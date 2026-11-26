-- 📊 Painel do Criador (26/11, Diego: "Sim"): o histórico (700 mil partidas + 690 mil visitas) passou de 8 s e o banco cortava
-- o painel inteiro ("canceling statement due to statement timeout"), até o "quem está on". Agora o histórico é calculado POR TRÁS
-- a cada 5 min (pg_cron, sem o limite de 8 s) em `esc_admin_hist_calc`, e o painel só LÊ a cópia pronta (até 15 min). O ao vivo
-- continua calculado na hora. Reverter: voltar a função antiga (está no histórico do git) e tirar o job 'esc-admin-hist'.
create or replace function public.esc_admin_hist_calc(p_days integer default 30, p_users integer default 200)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare
  v_today date := (now() at time zone 'America/Sao_Paulo')::date;
  v_hist jsonb;
begin
  -- só o cron (sem login) ou o próprio Diego
  if auth.jwt() is not null and coalesce(auth.jwt() ->> 'email', '') <> 'diego.c.fonseca@gmail.com' then
    raise exception 'not authorized';
  end if;
  with por_sessao as materialized (
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
          coalesce(p.plays, 0) as plays, coalesce(p.cpu, 0) as cpu, coalesce(p.online, 0) as online, coalesce(v.visits, 0) as visits
        from (select gd::date as day from generate_series(v_today - (p_days-1), v_today, interval '1 day') gd) d
        left join (
          select (created_at at time zone 'America/Sao_Paulo')::date as day, count(*) as plays,
                 count(*) filter (where mode='cpu') as cpu, count(*) filter (where mode='online') as online
          from game_plays where created_at > now() - (p_days + 2) * interval '1 day' group by 1
        ) p on p.day = d.day
        left join (
          select (created_at at time zone 'America/Sao_Paulo')::date as day, count(*) as visits
          from site_visits where created_at > now() - (p_days + 2) * interval '1 day' group by 1
        ) v on v.day = d.day
      ) t),
    'users', (select coalesce(jsonb_agg(to_jsonb(u) order by u.total desc, u.last_play desc, u.sid), '[]'::jsonb) from (
        select name, sid, total, today, last_play, registered
        from por_sessao order by total desc, last_play desc, session_id limit p_users
      ) u)
  ) into v_hist;
  insert into esc_admin_cache(chave, dados, updated_at)
    values ('dash:' || p_days || ':' || p_users || ':' || v_today, v_hist, now())
    on conflict (chave) do update set dados = excluded.dados, updated_at = excluded.updated_at;
  delete from esc_admin_cache where updated_at < now() - interval '2 days';
  return v_hist;
end $$;

create or replace function public.esc_admin_dashboard(p_days integer default 30, p_users integer default 200, p_fresh boolean default false)
returns json language plpgsql security definer set search_path to 'public' as $function$
declare
  v_email   text := coalesce(auth.jwt() ->> 'email', '');
  v_today   date := (now() at time zone 'America/Sao_Paulo')::date;
  v_now     int;
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

  -- 🔴 AO VIVO: sempre na hora
  with cur as (
    select distinct on (session_id) session_id, mode, display_name, user_id, screen,
      career_season, career_division, career_coins, career_titles, deck_league, career_modo, beat_at
    from live_beats where beat_at > now() - interval '90 seconds'
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
        'deckLeague', deck_league, 'careerModo', career_modo,
        'registered', (user_id is not null), 'uid', user_id,
        'playing', (screen is not null and screen not in ('intro','lobby')),
        'ago', greatest(0, extract(epoch from (now()-beat_at))::int)
      ) order by beat_at desc), '[]'::jsonb) from cur)
  ) into v_vivo;

  -- 🗄️ HISTÓRICO: a cópia que o cron faz a cada 5 min (aceita até 15 min; qualquer janela pega a cheia de 30d/200 se for a que existe)
  select dados, updated_at into v_hist, v_hist_at from esc_admin_cache
   where chave in ('dash:' || p_days || ':' || p_users || ':' || v_today, 'dash:30:200:' || v_today)
     and updated_at > now() - interval '15 minutes'
   order by updated_at desc limit 1;

  if v_hist is null then
    v_hist := esc_admin_hist_calc(p_days, p_users); -- sem cópia (cron parado): tenta na hora, como antes
    v_hist_at := now();
  end if;

  return (v_hist || v_vivo || jsonb_build_object('hist_at', v_hist_at))::json;
end;
$function$;

select cron.schedule('esc-admin-hist', '*/5 * * * *', $$select public.esc_admin_hist_calc(30, 200)$$);
