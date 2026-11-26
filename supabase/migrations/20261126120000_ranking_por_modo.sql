-- 🏆 RANKING SEPARADO POR MODO (26/11, Diego: "Tem q separar. Msm e C a msm regra do tradicional").
-- Antes as carreiras da Tradicional e do Brasil Oficial entravam no MESMO ranking global — e no Oficial dá pra pegar um clube
-- da Série A na 1ª temporada, enquanto na Tradicional todo mundo começa na Várzea. Agora cada foto sabe de qual modo é.
-- • `modo` = 'tradicional' (padrão) ou 'oficial'. O jogo novo grava o modo em toda foto.
-- PARTE 1 (sem efeito pra ninguém): coluna, fotos antigas marcadas e as funções novas `_modo`.
-- A PARTE 2 (20261126120100) é que faz as funções de sempre lerem só a Tradicional — entra junto com a publicação.
-- • As funções `_modo` servem o ranking de qualquer modo, com a MESMA regra (pontos, sua carreira de agora no lugar da melhor).
-- Reverter: `update esc_pyramid_rank_snap set modo = 'tradicional'` volta tudo pro ranking único.

alter table public.esc_pyramid_rank_snap add column if not exists modo text not null default 'tradicional';
create index if not exists esc_pyramid_rank_snap_modo on public.esc_pyramid_rank_snap (modo, season_no);

-- fotos antigas de carreira do Brasil Oficial (as que estão na nuvem; a de quem só salvou no aparelho passa a ir certa na próxima foto)
update public.esc_pyramid_rank_snap r set modo = 'oficial'
  from (select distinct s.user_id, (e->'save'->>'seed')::bigint as career_id
          from public.esc_pyramid_saves s, jsonb_array_elements(s.save->'careers') e
         where e->'save'->'oficial' is not null and e->'save'->'oficial' <> 'null'::jsonb) o
 where r.user_id = o.user_id and r.career_id = o.career_id and r.modo <> 'oficial';

-- linhas do ranking de UM modo (a mesma conta da v2, com o filtro do modo)
create or replace function public.esc_pyramid_rank_rows_v3(p_season integer, p_modo text)
 returns table(user_id uuid, career_id bigint, season_no integer, team_name text, honors_a integer, honors_b integer, honors_c integer, honors_d integer, honors_v integer, copa_titles integer, supercopa_titles integer, world_titles integer, mundial_titles integer, libertadores_titles integer, champions_titles integer, money integer, points bigint)
 language sql stable set search_path to 'public'
as $function$
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
      and s.modo = coalesce(p_modo, 'tradicional')
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
$function$;

-- 🔝 top N de um modo
create or replace function public.esc_pyramid_rank_modo(p_season integer, p_limit integer, p_modo text)
 returns table(user_id uuid, season_no integer, team_name text, honors_a integer, honors_b integer, honors_c integer, honors_d integer, honors_v integer, copa_titles integer, supercopa_titles integer, world_titles integer, mundial_titles integer, libertadores_titles integer, champions_titles integer, money integer)
 language sql stable set search_path to 'public'
as $function$
  with best as (
    select r.*, row_number() over (partition by r.user_id order by r.points desc, r.money desc, r.career_id) as n
    from public.esc_pyramid_rank_rows_v3(p_season, p_modo) r
  )
  select b.user_id, b.season_no, b.team_name, b.honors_a, b.honors_b, b.honors_c, b.honors_d, b.honors_v,
    b.copa_titles, b.supercopa_titles, b.world_titles, b.mundial_titles, b.libertadores_titles, b.champions_titles, b.money
  from best b where b.n = 1
  order by b.points desc, b.money desc, b.user_id
  limit greatest(p_limit, 0);
$function$;

-- 🪄 onde a SUA carreira de agora fica (no lugar da sua melhor), dentro de um modo
create or replace function public.esc_pyramid_career_rank_modo(p_season integer, p_user_id uuid, p_career_id bigint, p_modo text)
 returns table(pos integer, total integer, season_no integer, team_name text, honors_a integer, honors_b integer, honors_c integer, honors_d integer, honors_v integer, copa_titles integer, supercopa_titles integer, world_titles integer, mundial_titles integer, libertadores_titles integer, champions_titles integer, money integer)
 language sql stable set search_path to 'public'
as $function$
  with rows as (select * from public.esc_pyramid_rank_rows_v3(p_season, p_modo)),
  best as (select r.*, row_number() over (partition by r.user_id order by r.points desc, r.money desc, r.career_id) as n from rows r),
  mix as (
    select b.* from best b where b.n = 1 and b.user_id <> p_user_id
    union all
    select r.*, 1::bigint as n from rows r where r.user_id = p_user_id and r.career_id = p_career_id
  ),
  ranked as (select m.*, row_number() over (order by m.points desc, m.money desc, m.user_id)::integer as pos from mix m)
  select t.pos, (select count(*)::integer from ranked), t.season_no, t.team_name,
    t.honors_a, t.honors_b, t.honors_c, t.honors_d, t.honors_v,
    t.copa_titles, t.supercopa_titles, t.world_titles, t.mundial_titles, t.libertadores_titles, t.champions_titles, t.money
  from ranked t where t.user_id = p_user_id and t.career_id = p_career_id;
$function$;

-- 🔎 a sua posição (melhor carreira) dentro de um modo, pra quem fica fora do top
create or replace function public.esc_pyramid_my_rank_modo(p_season integer, p_user_id uuid, p_modo text)
 returns table(pos integer, total integer)
 language sql stable set search_path to 'public'
as $function$
  with best as (
    select r.*, row_number() over (partition by r.user_id order by r.points desc, r.money desc, r.career_id) as n
    from public.esc_pyramid_rank_rows_v3(p_season, p_modo) r
  ),
  ranked as (select b.user_id, row_number() over (order by b.points desc, b.money desc, b.user_id)::integer as pos from best b where b.n = 1)
  select t.pos, (select count(*)::integer from ranked) from ranked t where t.user_id = p_user_id;
$function$;

