-- ─────────────────────────────────────────────────────────────────────────────
-- 🩺 PAINEL DO CRIADOR — esc_admin_dashboard (estado APLICADO no banco em 14/09/2026)
--
-- POR QUE MEXEMOS: medindo o banco (o Diego mandou o print com CPU em 99%), esta era a
-- consulta interativa mais cara do projeto — ~4,6 s de média e ~10 GB de blocos lidos
-- POR ABERTURA do painel. Pior: na janela cheia (30 dias / 200 usuários) ela levava
-- 9,3 s, e o papel `authenticated` tem statement_timeout = 8 s. Ou seja, o painel
-- ESTOURAVA e caía no remendo do front (tenta 30d, depois 14d, depois 7d). Era esse o
-- "painel lento" de verdade.
--
-- O QUE MUDOU (duas coisas, nenhuma delas muda um número sequer):
--
-- 1. O RESULTADO VIROU DUAS PARTES.
--    🔴 AO VIVO (online_now, playing_now, peak, peak_at, live_list) sai de `live_beats`,
--       que é pequena, e é SEMPRE calculado na hora. O Diego nunca vê "quem está
--       jogando agora" atrasado.
--    🗄️ HISTÓRICO (jogos, visitas, retorno, carreiras, lista de usuários) entra em
--       cache de 120 s na tabela `esc_admin_cache`. O botão "🔄 Atualizar dados" manda
--       `p_fresh = true` e recalcula na hora, ignorando o cache.
--
-- 2. O HISTÓRICO FICOU 4× MAIS RÁPIDO. O peso NÃO estava nas contagens simples (essas
--    já usam idx_game_plays_sp_date / idx_site_visits_sp_date e custam quase nada).
--    Estava em QUATRO varreduras com "group by session_id" na `game_plays` inteira:
--    players_total, players_today, returning_players/returning_7d e a lista de
--    usuários — cada uma refazendo o mesmo agrupamento de 348 mil linhas. Agora esse
--    agrupamento é UM só (`por_sessao`, materializado) e os quatro saem dele.
--
-- MEDIÇÕES REAIS (janela cheia 30d/200, nesta base):
--    antes ....................... 9.350 ms  (estourava o limite de 8 s)
--    tudo materializado .......... 4.939 ms  (tentativa intermediária, descartada)
--    versão aplicada ............. ~2.500 ms
--    abertura com cache quente ....... 36 ms
--
-- CONFERÊNCIA: a conta velha e a nova foram rodadas no MESMO instante (mesma transação,
-- mesmo snapshot) e deram idênticas em today, week, month, total, today_cpu,
-- today_online, week_cpu, week_online, month_cpu, month_online, total_cpu, total_online,
-- players_total, players_today, returning_players, returning_7d, visits_today,
-- visits_week, visits_month, visits_total, visitors_today e visitors_total.
--
-- BRINDE: a lista de usuários ganhou desempate fixo. No 200º lugar havia QUATRO sessões
-- empatadas (209 jogos) e só 199 acima do corte — sem desempate o banco escolhia uma a
-- esmo e a última linha trocava sozinha a cada abertura. Isso já era assim antes.
--
-- PERMISSÃO: recriar a função com DROP+CREATE devolve o EXECUTE padrão pra PUBLIC, então
-- foi revogado de volta. Quem pode chamar: authenticated, postgres, service_role — igual
-- a antes. A trava de e-mail continua sendo a primeira linha do corpo.
--
-- ⚠️ Este arquivo é a CÓPIA do que está no banco, pra próxima sessão não ter que
-- adivinhar. Editar aqui NÃO aplica nada — aplicar é migração no Supabase.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.esc_admin_cache (
  chave      text primary key,
  dados      jsonb not null,
  updated_at timestamptz not null default now()
);
-- ninguém alcança direto: RLS ligada, sem policy e sem grant — só a função dona entra
alter table public.esc_admin_cache enable row level security;
revoke all on public.esc_admin_cache from anon, authenticated;

create or replace function public.esc_admin_dashboard(
  p_days integer default 30,
  p_users integer default 200,
  p_fresh boolean default false
) returns json
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_email   text := coalesce(auth.jwt() ->> 'email', '');
  v_today   date := (now() at time zone 'America/Sao_Paulo')::date;
  v_now     int;
  v_chave   text;
  v_vivo    jsonb;
  v_hist    jsonb;
  v_hist_at timestamptz;
begin
  if v_email <> 'diego.c.fonseca@gmail.com' then
    raise exception 'not authorized';
  end if;

  delete from live_beats where beat_at < now() - interval '10 minutes';

  select count(distinct session_id) into v_now from live_beats where beat_at > now() - interval '90 seconds';
  update esc_live_peak set peak = v_now, peak_at = now() where id = 1 and v_now > peak;

  -- ── 🔴 AO VIVO: sempre calculado na hora (live_beats é pequena e barata) ───
  with cur as (
    select distinct on (session_id) session_id, mode, display_name, user_id, screen,
      career_season, career_division, career_coins, career_titles, deck_league, beat_at
    from live_beats
    where beat_at > now() - interval '90 seconds'
    order by session_id, beat_at desc
  )
  select jsonb_build_object(
    'online_now',  (select count(*) from cur),
    'playing_now', (select count(*) from cur where screen is not null and screen not in ('intro','lobby')),
    'peak',        (select peak from esc_live_peak where id=1),
    'peak_at',     (select peak_at from esc_live_peak where id=1),
    'live_list', (select coalesce(jsonb_agg(jsonb_build_object(
        'name', coalesce(nullif(display_name,''),'Anônimo'),
        'mode', mode, 'screen', coalesce(screen,'intro'),
        'careerSeason', career_season, 'careerDivision', career_division,
        'careerCoins', career_coins, 'careerTitles', career_titles,
        'deckLeague', deck_league,
        'registered', (user_id is not null),
        'uid', user_id,
        'playing', (screen is not null and screen not in ('intro','lobby')),
        'ago', greatest(0, extract(epoch from (now()-beat_at))::int)
      ) order by beat_at desc), '[]'::jsonb) from cur)
  ) into v_vivo;

  -- ── 🗄️ HISTÓRICO: cache de 120 s (p_fresh = true força recalcular) ────────
  v_chave := 'dash:' || p_days || ':' || p_users || ':' || v_today;

  if not coalesce(p_fresh, false) then
    select dados, updated_at into v_hist, v_hist_at
      from esc_admin_cache
     where chave = v_chave and updated_at > now() - interval '120 seconds';
  end if;

  if v_hist is null then
    with por_sessao as materialized (   -- 👈 o ÚNICO group-by pesado, feito uma vez só
      select session_id,
             coalesce(nullif(max(display_name),''),'Anônimo') as name,
             left(session_id, 8) as sid,
             count(*) as total,
             count(*) filter (where (created_at at time zone 'America/Sao_Paulo')::date = v_today) as today,
             max(created_at) as last_play,
             bool_or(user_id is not null) as registered,
             count(distinct (created_at at time zone 'America/Sao_Paulo')::date) as dias
      from game_plays group by session_id
    )
    select jsonb_build_object(
      'today', (select count(*) from game_plays where (created_at at time zone 'America/Sao_Paulo')::date = v_today),
      'week',  (select count(*) from game_plays where created_at > now() - interval '7 days'),
      'month', (select count(*) from game_plays where created_at > now() - interval '30 days'),
      'total', (select count(*) from game_plays),
      'today_cpu',    (select count(*) from game_plays where mode='cpu'    and (created_at at time zone 'America/Sao_Paulo')::date = v_today),
      'today_online', (select count(*) from game_plays where mode='online' and (created_at at time zone 'America/Sao_Paulo')::date = v_today),
      'week_cpu',     (select count(*) from game_plays where mode='cpu'    and created_at > now() - interval '7 days'),
      'week_online',  (select count(*) from game_plays where mode='online' and created_at > now() - interval '7 days'),
      'month_cpu',    (select count(*) from game_plays where mode='cpu'    and created_at > now() - interval '30 days'),
      'month_online', (select count(*) from game_plays where mode='online' and created_at > now() - interval '30 days'),
      'total_cpu',    (select count(*) from game_plays where mode='cpu'),
      'total_online', (select count(*) from game_plays where mode='online'),

      -- os quatro que antes varriam a tabela inteira, agora saem do mesmo agrupamento
      'players_total',     (select count(*) from por_sessao),
      'players_today',     (select count(*) from por_sessao where today > 0),
      'returning_players', (select count(*) from por_sessao where dias >= 2),
      'returning_7d',      (select count(*) from por_sessao where dias >= 2 and last_play > now() - interval '7 days'),

      'visits_today', (select count(*) from site_visits where (created_at at time zone 'America/Sao_Paulo')::date = v_today),
      'visits_week',  (select count(*) from site_visits where created_at > now() - interval '7 days'),
      'visits_month', (select count(*) from site_visits where created_at > now() - interval '30 days'),
      'visits_total', (select count(*) from site_visits),
      'visitors_today', (select count(distinct session_id) from site_visits where (created_at at time zone 'America/Sao_Paulo')::date = v_today),
      'visitors_total', (select count(distinct session_id) from site_visits),

      'careers', (select coalesce(jsonb_agg(jsonb_build_object(
          'name', coalesce(nullif(team_name,''),'Técnico'),
          'division', division, 'season', season_no, 'titles', titles,
          'updated', updated_at
        ) order by updated_at desc), '[]'::jsonb)
        from (select team_name, division, season_no, titles, updated_at from esc_careers order by updated_at desc limit 60) c),

      'daily', (select coalesce(jsonb_agg(to_jsonb(t) order by t.day), '[]'::jsonb) from (
          select d.day,
            coalesce(p.plays, 0) as plays,
            coalesce(p.cpu, 0) as cpu,
            coalesce(p.online, 0) as online,
            coalesce(v.visits, 0) as visits
          from (select gd::date as day from generate_series(v_today - (p_days-1), v_today, interval '1 day') gd) d
          left join (
            select (created_at at time zone 'America/Sao_Paulo')::date as day,
                   count(*) as plays,
                   count(*) filter (where mode='cpu') as cpu,
                   count(*) filter (where mode='online') as online
            from game_plays
            where created_at > now() - (p_days + 2) * interval '1 day'
            group by 1
          ) p on p.day = d.day
          left join (
            select (created_at at time zone 'America/Sao_Paulo')::date as day, count(*) as visits
            from site_visits
            where created_at > now() - (p_days + 2) * interval '1 day'
            group by 1
          ) v on v.day = d.day
        ) t),

      'users', (select coalesce(jsonb_agg(to_jsonb(u) order by u.total desc, u.last_play desc, u.sid), '[]'::jsonb) from (
          select name, sid, total, today, last_play, registered
          from por_sessao order by total desc, last_play desc, session_id limit p_users
        ) u)
    ) into v_hist;

    v_hist_at := now();
    insert into esc_admin_cache(chave, dados, updated_at)
      values (v_chave, v_hist, v_hist_at)
      on conflict (chave) do update set dados = excluded.dados, updated_at = excluded.updated_at;
    delete from esc_admin_cache where updated_at < now() - interval '2 days';
  end if;

  -- o ao vivo tem a palavra final; hist_at diz de quando é o histórico
  return (v_hist || v_vivo || jsonb_build_object('hist_at', v_hist_at))::json;
end;
$function$;

-- permissão igual à de antes da mexida (o DROP+CREATE tinha devolvido pra PUBLIC)
revoke execute on function public.esc_admin_dashboard(integer, integer, boolean) from public, anon;
grant  execute on function public.esc_admin_dashboard(integer, integer, boolean) to authenticated, service_role;
