-- Migração privada da carreira internacional. Base: esquema do projeto
-- faabglpjutwursgmrpny, ensaiado em transação reversível em 01/10/2026.
-- Mantém as três RPCs antigas intactas e não concede títulos a ninguém.

alter table public.esc_pyramid_rank_snap
  add column if not exists mundial_titles integer not null default 0,
  add column if not exists libertadores_titles integer not null default 0,
  add column if not exists champions_titles integer not null default 0;

create or replace function public.esc_private_international_rank_allowed()
returns boolean language sql stable security definer
set search_path = ''
as $allowed$
  select exists(
    select 1 from auth.users u
    where u.id = (select auth.uid())
      and lower(u.email) = 'diego.c.fonseca@gmail.com'
  );
$allowed$;

-- A RLS atual permite UPDATE da linha própria a todos. Este trigger limita
-- novos contadores a zero para qualquer conta fora da autorização privada.
-- Não usa o e-mail enviado pelo navegador; lê auth.users pelo auth.uid().
create or replace function public.esc_private_international_rank_guard()
returns trigger language plpgsql security definer
set search_path = ''
as $guard$
declare allowed boolean;
begin
  if tg_op = 'INSERT' then
    if new.mundial_titles = 0 and new.libertadores_titles = 0 and new.champions_titles = 0 then
      return new;
    end if;
  elsif (new.mundial_titles, new.libertadores_titles, new.champions_titles)
       is not distinct from (old.mundial_titles, old.libertadores_titles, old.champions_titles) then
    return new;
  end if;

  allowed := public.esc_private_international_rank_allowed();
  if not allowed or new.user_id is distinct from (select auth.uid()) then
    raise exception 'international career ranking is private' using errcode = '42501';
  end if;
  if new.mundial_titles < 0 or new.libertadores_titles < 0 or new.champions_titles < 0 then
    raise exception 'negative international titles' using errcode = '23514';
  end if;
  return new;
end;
$guard$;

drop trigger if exists esc_private_international_rank_guard on public.esc_pyramid_rank_snap;
create trigger esc_private_international_rank_guard
before insert or update of mundial_titles, libertadores_titles, champions_titles
on public.esc_pyramid_rank_snap
for each row execute function public.esc_private_international_rank_guard();

-- Uma foto por carreira até a temporada consultada (mesmo recorte das RPCs
-- atuais). Os novos títulos são limitados às temporadas já concluídas.
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
    l.world_titles::bigint * 200 + l.mundial_titles::bigint * 50
    + l.libertadores_titles::bigint * 40 + l.champions_titles::bigint * 40
    + l.copa_titles::bigint * 30 + l.honors_a::bigint * 20
    + l.supercopa_titles::bigint * 15 + l.honors_b::bigint * 10
    + l.honors_c::bigint * 5 + l.honors_d::bigint * 3 + l.honors_v::bigint
  from latest l;
$rank$;

create or replace function public.esc_pyramid_rank_v2(p_season integer, p_limit integer default 50)
returns table(
  user_id uuid, season_no integer, team_name text,
  honors_a integer, honors_b integer, honors_c integer, honors_d integer, honors_v integer,
  copa_titles integer, supercopa_titles integer, world_titles integer,
  mundial_titles integer, libertadores_titles integer, champions_titles integer, money integer
)
language sql stable set search_path = 'public'
as $rank$
  with best as (
    select r.*, row_number() over (
      partition by r.user_id order by r.points desc, r.money desc, r.career_id
    ) as n
    from public.esc_pyramid_rank_rows_v2(p_season) r
  )
  select b.user_id, b.season_no, b.team_name,
    b.honors_a, b.honors_b, b.honors_c, b.honors_d, b.honors_v,
    b.copa_titles, b.supercopa_titles, b.world_titles,
    b.mundial_titles, b.libertadores_titles, b.champions_titles, b.money
  from best b where b.n = 1
  order by b.points desc, b.money desc, b.user_id
  limit greatest(p_limit, 0);
$rank$;

create or replace function public.esc_pyramid_career_rank_v2(
  p_season integer, p_user_id uuid, p_career_id bigint
)
returns table(
  pos integer, total integer, season_no integer, team_name text,
  honors_a integer, honors_b integer, honors_c integer, honors_d integer, honors_v integer,
  copa_titles integer, supercopa_titles integer, world_titles integer,
  mundial_titles integer, libertadores_titles integer, champions_titles integer, money integer
)
language sql stable set search_path = 'public'
as $rank$
  with rows as (select * from public.esc_pyramid_rank_rows_v2(p_season)),
  best as (
    select r.*, row_number() over (
      partition by r.user_id order by r.points desc, r.money desc, r.career_id
    ) as n from rows r
  ),
  mix as (
    select b.* from best b where b.n = 1 and b.user_id <> p_user_id
    union all
    select r.*, 1::bigint as n from rows r
    where r.user_id = p_user_id and r.career_id = p_career_id
  ),
  ranked as (
    select m.*, row_number() over (
      order by m.points desc, m.money desc, m.user_id
    )::integer as pos from mix m
  )
  select t.pos, (select count(*)::integer from ranked), t.season_no, t.team_name,
    t.honors_a, t.honors_b, t.honors_c, t.honors_d, t.honors_v,
    t.copa_titles, t.supercopa_titles, t.world_titles,
    t.mundial_titles, t.libertadores_titles, t.champions_titles, t.money
  from ranked t where t.user_id = p_user_id and t.career_id = p_career_id;
$rank$;

create or replace function public.esc_pyramid_my_rank_v2(p_season integer, p_user_id uuid)
returns table(pos integer, total integer)
language sql stable set search_path = 'public'
as $rank$
  with best as (
    select r.*, row_number() over (
      partition by r.user_id order by r.points desc, r.money desc, r.career_id
    ) as n
    from public.esc_pyramid_rank_rows_v2(p_season) r
  ),
  ranked as (
    select b.user_id, row_number() over (
      order by b.points desc, b.money desc, b.user_id
    )::integer as pos
    from best b where b.n = 1
  )
  select t.pos, (select count(*)::integer from ranked) from ranked t
  where t.user_id = p_user_id;
$rank$;

-- RPCs expostas somente a sessoes autenticadas. A funcao de trigger nao
-- precisa ser chamada diretamente pelo cliente.
revoke execute on function public.esc_private_international_rank_allowed() from public, anon;
grant execute on function public.esc_private_international_rank_allowed() to authenticated;
revoke execute on function public.esc_private_international_rank_guard() from public, anon, authenticated;
revoke execute on function public.esc_pyramid_rank_rows_v2(integer) from public, anon;
grant execute on function public.esc_pyramid_rank_rows_v2(integer) to authenticated;
revoke execute on function public.esc_pyramid_rank_v2(integer, integer) from public, anon;
grant execute on function public.esc_pyramid_rank_v2(integer, integer) to authenticated;
revoke execute on function public.esc_pyramid_career_rank_v2(integer, uuid, bigint) from public, anon;
grant execute on function public.esc_pyramid_career_rank_v2(integer, uuid, bigint) to authenticated;
revoke execute on function public.esc_pyramid_my_rank_v2(integer, uuid) from public, anon;
grant execute on function public.esc_pyramid_my_rank_v2(integer, uuid) to authenticated;

