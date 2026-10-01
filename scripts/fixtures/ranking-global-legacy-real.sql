-- Definições read-only lidas do projeto faabglpjutwursgmrpny em 01/10/2026.
CREATE OR REPLACE FUNCTION public.esc_pyramid_career_rank(p_season integer, p_user_id uuid, p_career_id bigint)
 RETURNS TABLE(pos integer, total integer, season_no integer, team_name text, honors_a integer, honors_b integer, honors_c integer, honors_d integer, honors_v integer, copa_titles integer, supercopa_titles integer, world_titles integer, money integer)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  with por_carreira as (
    select distinct on (s.user_id, s.career_id)
      s.user_id, s.career_id, s.season_no, s.team_name,
      least(s.honors_a, s.season_no) as honors_a,
      least(s.honors_b, s.season_no) as honors_b,
      least(s.honors_c, s.season_no) as honors_c,
      least(s.honors_d, s.season_no) as honors_d,
      least(s.honors_v, s.season_no) as honors_v,
      least(s.copa_titles, s.season_no) as copa_titles,
      least(s.supercopa_titles, s.season_no) as supercopa_titles,
      least(s.world_titles, s.season_no) as world_titles,
      s.money
    from public.esc_pyramid_rank_snap s
    where s.season_no <= p_season
    order by s.user_id, s.career_id, s.season_no desc
  ),
  melhor as (
    select *, row_number() over (
      partition by user_id
      order by world_titles desc, honors_a desc, copa_titles desc, supercopa_titles desc,
               honors_b desc, honors_c desc, honors_d desc, honors_v desc, money desc
    ) as n
    from por_carreira
  ),
  -- a tabela oficial, com a MINHA carreira de agora trocada no lugar da minha melhor
  mistura as (
    select * from melhor where n = 1 and user_id <> p_user_id
    union all
    select * from por_carreira c, lateral (select 1 as n) z
      where c.user_id = p_user_id and c.career_id = p_career_id
  ),
  tabela as (
    select user_id, career_id, season_no, team_name, honors_a, honors_b, honors_c, honors_d, honors_v,
           copa_titles, supercopa_titles, world_titles, money,
      row_number() over (
        order by world_titles desc, honors_a desc, copa_titles desc, supercopa_titles desc,
                 honors_b desc, honors_c desc, honors_d desc, honors_v desc, money desc
      )::int as pos
    from mistura
  )
  select t.pos, (select count(*)::int from tabela), t.season_no, t.team_name,
         t.honors_a, t.honors_b, t.honors_c, t.honors_d, t.honors_v,
         t.copa_titles, t.supercopa_titles, t.world_titles, t.money
  from tabela t where t.user_id = p_user_id and t.career_id = p_career_id
$function$;


CREATE OR REPLACE FUNCTION public.esc_pyramid_my_rank(p_season integer, p_user_id uuid)
 RETURNS TABLE(pos integer, total integer)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  with por_carreira as (
    select distinct on (s.user_id, s.career_id)
      s.user_id, s.career_id, s.season_no,
      least(s.honors_a, s.season_no) as honors_a,
      least(s.honors_b, s.season_no) as honors_b,
      least(s.honors_c, s.season_no) as honors_c,
      least(s.honors_d, s.season_no) as honors_d,
      least(s.honors_v, s.season_no) as honors_v,
      least(s.copa_titles, s.season_no) as copa_titles,
      least(s.supercopa_titles, s.season_no) as supercopa_titles,
      least(s.world_titles, s.season_no) as world_titles,
      s.money
    from public.esc_pyramid_rank_snap s
    where s.season_no <= p_season
    order by s.user_id, s.career_id, s.season_no desc
  ),
  melhor as (
    select *, row_number() over (
      partition by user_id
      order by world_titles desc, honors_a desc, copa_titles desc, supercopa_titles desc,
               honors_b desc, honors_c desc, honors_d desc, honors_v desc, money desc
    ) as n
    from por_carreira
  ),
  tabela as (
    select user_id, row_number() over (
      order by world_titles desc, honors_a desc, copa_titles desc, supercopa_titles desc,
               honors_b desc, honors_c desc, honors_d desc, honors_v desc, money desc
    )::int as pos
    from melhor where n = 1
  )
  select tabela.pos, (select count(*)::int from tabela) from tabela where tabela.user_id = p_user_id
$function$;

CREATE OR REPLACE FUNCTION public.esc_pyramid_rank(p_season integer, p_limit integer DEFAULT 50)
 RETURNS TABLE(user_id uuid, season_no integer, team_name text, honors_a integer, honors_b integer, honors_c integer, honors_d integer, honors_v integer, copa_titles integer, supercopa_titles integer, world_titles integer, money integer)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  with por_carreira as (
    -- a foto mais nova de CADA carreira (conta + career_id)
    select distinct on (s.user_id, s.career_id)
      s.user_id, s.career_id, s.season_no, s.team_name,
      least(s.honors_a, s.season_no) as honors_a,
      least(s.honors_b, s.season_no) as honors_b,
      least(s.honors_c, s.season_no) as honors_c,
      least(s.honors_d, s.season_no) as honors_d,
      least(s.honors_v, s.season_no) as honors_v,
      least(s.copa_titles, s.season_no) as copa_titles,
      least(s.supercopa_titles, s.season_no) as supercopa_titles,
      least(s.world_titles, s.season_no) as world_titles,
      s.money
    from public.esc_pyramid_rank_snap s
    where s.season_no <= p_season
    order by s.user_id, s.career_id, s.season_no desc
  ),
  melhor as (
    -- de cada pessoa, só a melhor carreira
    select *, row_number() over (
      partition by user_id
      order by world_titles desc, honors_a desc, copa_titles desc, supercopa_titles desc,
               honors_b desc, honors_c desc, honors_d desc, honors_v desc, money desc
    ) as n
    from por_carreira
  )
  select user_id, season_no, team_name, honors_a, honors_b, honors_c, honors_d, honors_v,
         copa_titles, supercopa_titles, world_titles, money
  from melhor where n = 1
  order by world_titles desc, honors_a desc, copa_titles desc, supercopa_titles desc,
           honors_b desc, honors_c desc, honors_d desc, honors_v desc, money desc
  limit p_limit
$function$;

create table public.rank_legacy_fingerprint as
select p.proname, md5(pg_get_functiondef(p.oid)) as hash
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and p.proname in
  ('esc_pyramid_rank','esc_pyramid_career_rank','esc_pyramid_my_rank');
