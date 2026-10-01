-- 🏅 01/10 (Diego): Mundial de Clubes vale 60 e Libertadores/Champions 50 no ranking global (antes 50/40/40).
-- Mesma régua de PTS_TITULO em src/escalacao/pyramidseason.tsx. Só os pesos mudam; o resto da função é igual à migração 20261001173507.
create or replace function public.esc_pyramid_rank_rows_v2(p_season integer)
returns table(
  user_id uuid, career_id bigint, season_no integer, team_name text,
  honors_a integer, honors_b integer, honors_c integer, honors_d integer, honors_v integer,
  copa_titles integer, supercopa_titles integer, world_titles integer,
  mundial_titles integer, libertadores_titles integer, champions_titles integer,
  money integer, points bigint
)
language sql stable set search_path = 'public'
as $rank$
  with latest as (
    select distinct on (s.user_id, s.career_id)
      s.user_id, s.career_id, s.season_no, s.team_name,
      least(greatest(s.honors_a, 0), s.season_no) as honors_a,
      least(greatest(s.honors_b, 0), s.season_no) as honors_b,
      least(greatest(s.honors_c, 0), s.season_no) as honors_c,
      least(greatest(s.honors_d, 0), s.season_no) as honors_d,
      least(greatest(s.honors_v, 0), s.season_no) as honors_v,
      least(greatest(s.copa_titles, 0), s.season_no) as copa_titles,
      least(greatest(s.supercopa_titles, 0), s.season_no) as supercopa_titles,
      least(greatest(s.world_titles, 0), s.season_no) as world_titles,
      least(greatest(s.mundial_titles, 0), greatest(s.season_no - 1, 0)) as mundial_titles,
      least(greatest(s.libertadores_titles, 0), greatest(s.season_no - 1, 0)) as libertadores_titles,
      least(greatest(s.champions_titles, 0), greatest(s.season_no - 1, 0)) as champions_titles,
      s.money
    from public.esc_pyramid_rank_snap s
    where s.season_no <= p_season
      and public.esc_private_international_rank_allowed()
    order by s.user_id, s.career_id, s.season_no desc
  )
  select l.*,
    l.world_titles::bigint * 200 + l.mundial_titles::bigint * 60
    + l.libertadores_titles::bigint * 50 + l.champions_titles::bigint * 50
    + l.copa_titles::bigint * 30 + l.honors_a::bigint * 20
    + l.supercopa_titles::bigint * 15 + l.honors_b::bigint * 10
    + l.honors_c::bigint * 5 + l.honors_d::bigint * 3 + l.honors_v::bigint
  from latest l;
$rank$;
