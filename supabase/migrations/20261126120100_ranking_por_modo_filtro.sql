-- 🏆 RANKING SEPARADO POR MODO — PARTE 2 (aplicar JUNTO com a publicação do jogo que grava `modo`).
-- As funções de sempre (v1, v2 e o perfil) passam a ler SÓ a Tradicional. Antes, remarca as fotos do Oficial que o jogo antigo
-- gravou como 'tradicional' entre a parte 1 e a publicação.
-- Reverter: rodar de novo as definições antigas (sem o filtro `modo`), ou `update esc_pyramid_rank_snap set modo = 'tradicional'`.

-- fotos antigas de carreira do Brasil Oficial (as que estão na nuvem; a de quem só salvou no aparelho passa a ir certa na próxima foto)
update public.esc_pyramid_rank_snap r set modo = 'oficial'
  from (select distinct s.user_id, (e->'save'->>'seed')::bigint as career_id
          from public.esc_pyramid_saves s, jsonb_array_elements(s.save->'careers') e
         where e->'save'->'oficial' is not null and e->'save'->'oficial' <> 'null'::jsonb) o
 where r.user_id = o.user_id and r.career_id = o.career_id and r.modo <> 'oficial';

-- a v2 de sempre = só a Tradicional
create or replace function public.esc_pyramid_rank_rows_v2(p_season integer)
 returns table(user_id uuid, career_id bigint, season_no integer, team_name text, honors_a integer, honors_b integer, honors_c integer, honors_d integer, honors_v integer, copa_titles integer, supercopa_titles integer, world_titles integer, mundial_titles integer, libertadores_titles integer, champions_titles integer, money integer, points bigint)
 language sql stable set search_path to 'public'
as $function$
  select * from public.esc_pyramid_rank_rows_v3(p_season, 'tradicional');
$function$;

-- v1 de sempre (o perfil usa a career_rank) = só a Tradicional
create or replace function public.esc_pyramid_rank(p_season integer, p_limit integer default 50)
 returns table(user_id uuid, season_no integer, team_name text, honors_a integer, honors_b integer, honors_c integer, honors_d integer, honors_v integer, copa_titles integer, supercopa_titles integer, world_titles integer, money integer)
 language sql stable set search_path to 'public'
as $function$
  with por_carreira as (
    select distinct on (s.user_id, s.career_id)
      s.user_id, s.career_id, s.season_no, s.team_name,
      least(s.honors_a, s.season_no) as honors_a, least(s.honors_b, s.season_no) as honors_b,
      least(s.honors_c, s.season_no) as honors_c, least(s.honors_d, s.season_no) as honors_d,
      least(s.honors_v, s.season_no) as honors_v, least(s.copa_titles, s.season_no) as copa_titles,
      least(s.supercopa_titles, s.season_no) as supercopa_titles, least(s.world_titles, s.season_no) as world_titles,
      s.money
    from public.esc_pyramid_rank_snap s
    where s.season_no <= p_season and s.modo = 'tradicional'
    order by s.user_id, s.career_id, s.season_no desc
  ),
  melhor as (
    select *, row_number() over (partition by user_id
      order by world_titles desc, honors_a desc, copa_titles desc, supercopa_titles desc,
               honors_b desc, honors_c desc, honors_d desc, honors_v desc, money desc) as n
    from por_carreira
  )
  select user_id, season_no, team_name, honors_a, honors_b, honors_c, honors_d, honors_v,
         copa_titles, supercopa_titles, world_titles, money
  from melhor where n = 1
  order by world_titles desc, honors_a desc, copa_titles desc, supercopa_titles desc,
           honors_b desc, honors_c desc, honors_d desc, honors_v desc, money desc
  limit p_limit
$function$;

create or replace function public.esc_pyramid_career_rank(p_season integer, p_user_id uuid, p_career_id bigint)
 returns table(pos integer, total integer, season_no integer, team_name text, honors_a integer, honors_b integer, honors_c integer, honors_d integer, honors_v integer, copa_titles integer, supercopa_titles integer, world_titles integer, money integer)
 language sql stable set search_path to 'public'
as $function$
  with por_carreira as (
    select distinct on (s.user_id, s.career_id)
      s.user_id, s.career_id, s.season_no, s.team_name,
      least(s.honors_a, s.season_no) as honors_a, least(s.honors_b, s.season_no) as honors_b,
      least(s.honors_c, s.season_no) as honors_c, least(s.honors_d, s.season_no) as honors_d,
      least(s.honors_v, s.season_no) as honors_v, least(s.copa_titles, s.season_no) as copa_titles,
      least(s.supercopa_titles, s.season_no) as supercopa_titles, least(s.world_titles, s.season_no) as world_titles,
      s.money
    from public.esc_pyramid_rank_snap s
    where s.season_no <= p_season and s.modo = 'tradicional'
    order by s.user_id, s.career_id, s.season_no desc
  ),
  melhor as (
    select *, row_number() over (partition by user_id
      order by world_titles desc, honors_a desc, copa_titles desc, supercopa_titles desc,
               honors_b desc, honors_c desc, honors_d desc, honors_v desc, money desc) as n
    from por_carreira
  ),
  mistura as (
    select * from melhor where n = 1 and user_id <> p_user_id
    union all
    select * from por_carreira c, lateral (select 1 as n) z where c.user_id = p_user_id and c.career_id = p_career_id
  ),
  tabela as (
    select user_id, career_id, season_no, team_name, honors_a, honors_b, honors_c, honors_d, honors_v,
           copa_titles, supercopa_titles, world_titles, money,
      row_number() over (order by world_titles desc, honors_a desc, copa_titles desc, supercopa_titles desc,
                 honors_b desc, honors_c desc, honors_d desc, honors_v desc, money desc)::int as pos
    from mistura
  )
  select t.pos, (select count(*)::int from tabela), t.season_no, t.team_name,
         t.honors_a, t.honors_b, t.honors_c, t.honors_d, t.honors_v,
         t.copa_titles, t.supercopa_titles, t.world_titles, t.money
  from tabela t where t.user_id = p_user_id and t.career_id = p_career_id
$function$;

create or replace function public.esc_pyramid_my_rank(p_season integer, p_user_id uuid)
 returns table(pos integer, total integer)
 language sql stable set search_path to 'public'
as $function$
  with por_carreira as (
    select distinct on (s.user_id, s.career_id)
      s.user_id, s.career_id, s.season_no,
      least(s.honors_a, s.season_no) as honors_a, least(s.honors_b, s.season_no) as honors_b,
      least(s.honors_c, s.season_no) as honors_c, least(s.honors_d, s.season_no) as honors_d,
      least(s.honors_v, s.season_no) as honors_v, least(s.copa_titles, s.season_no) as copa_titles,
      least(s.supercopa_titles, s.season_no) as supercopa_titles, least(s.world_titles, s.season_no) as world_titles,
      s.money
    from public.esc_pyramid_rank_snap s
    where s.season_no <= p_season and s.modo = 'tradicional'
    order by s.user_id, s.career_id, s.season_no desc
  ),
  melhor as (
    select *, row_number() over (partition by user_id
      order by world_titles desc, honors_a desc, copa_titles desc, supercopa_titles desc,
               honors_b desc, honors_c desc, honors_d desc, honors_v desc, money desc) as n
    from por_carreira
  ),
  tabela as (
    select user_id, row_number() over (order by world_titles desc, honors_a desc, copa_titles desc, supercopa_titles desc,
               honors_b desc, honors_c desc, honors_d desc, honors_v desc, money desc)::int as pos
    from melhor where n = 1
  )
  select tabela.pos, (select count(*)::int from tabela) from tabela where tabela.user_id = p_user_id
$function$;
