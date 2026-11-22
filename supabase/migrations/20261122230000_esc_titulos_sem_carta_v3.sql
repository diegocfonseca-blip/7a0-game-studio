-- 🃏 22/11 — RESGATE DA CARTINHA v3 (Diego: "Sim" pra estender o resgate). Mesma função, mesma assinatura e mesmo retorno da v2;
-- só ganha um caminho a mais: desde 22/11 cada time campeão leva na própria linha de `human_results` a lista `cartas` com as
-- chaves EXATAS das cartinhas que ganhou (liga, copa, Copa do Mundo/regional/Libertadores dentro da liga). É isso que cobre a
-- Liga da Turma e a Liga Draft (sem `match_seed`) e as Copas de dentro da sala, que a v2 não conseguia montar.
-- O caminho antigo (sala rápida pela semente) fica idêntico; `union` tira repetida.
create or replace function public.esc_titulos_sem_carta()
 returns table (season_key text, tipo text, sala text)
 language sql stable security definer set search_path to 'public' as $$
  with eu as (select auth.uid() as uid),
  base as (
    select gc.room_id, gc.match_seed, gc.season_no, h,
           g.game_state ->> 'copaMode' as copa_mode, coalesce(g.game_state ->> 'roomName', g.code) as sala,
           coalesce(g.game_state ->> 'mode', 'rapido') as modo
    from public.game_champions gc
    join public.game_rooms g on g.id = gc.room_id
    cross join lateral jsonb_array_elements(coalesce(gc.human_results, '[]'::jsonb)) h
    where gc.created_at > now() - interval '3 days' and gc.created_at < now() - interval '3 minutes'
      and h ->> 'user_id' = (select uid::text from eu)
      and coalesce(g.game_state ->> 'sport', 'futebol') <> 'basquete'
      and coalesce(g.game_state ->> 'mode', 'rapido') not in ('carreira', 'elenco')
  ),
  linhas as (select * from base where match_seed is not null and modo <> 'mundo'),
  devidos as (
    select room_id::text || ':' || match_seed || ':' || season_no || case when copa_mode in ('relampago', 'champions') then ':copa' else '' end as k,
           case when copa_mode in ('relampago', 'champions') then 'copa' else 'liga' end as tipo, sala
      from linhas where (h ->> 'league_champion')::boolean
    union
    select room_id::text || ':' || match_seed || ':' || season_no || ':copa', 'copa', sala
      from linhas where (h -> 'cup_titles') ?| array['copa', 'libertadores'] and copa_mode is distinct from 'liga'
    union
    -- 🃏 v3: a chave anotada na hora do título (qualquer sala, com ou sem semente)
    select c.k, case when c.k like '%:copa' or c.k like 'mundo:%' or c.k like 'regional:%' or c.k like 'libsala:%' then 'copa' else 'liga' end, b.sala
      from base b cross join lateral jsonb_array_elements_text(case when jsonb_typeof(b.h -> 'cartas') = 'array' then b.h -> 'cartas' else '[]'::jsonb end) c(k)
  )
  select d.k, d.tipo, d.sala from devidos d
  where (select uid from eu) is not null
    and not exists (select 1 from public.user_cards uc where uc.user_id = (select uid from eu) and uc.season_key = d.k)
    and not exists (select 1 from public.esc_titulo_pago t where t.user_id = (select uid from eu) and t.season_key = d.k)
  limit 5;
$$;
