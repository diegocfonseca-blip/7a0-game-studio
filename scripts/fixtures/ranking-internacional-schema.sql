create schema auth;
create table auth.users (id uuid primary key, email text not null);
create function auth.uid() returns uuid language sql stable
as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
create role authenticated;
grant usage on schema public, auth to authenticated;
grant execute on function auth.uid() to authenticated;

create table public.esc_pyramid_rank_snap (
  user_id uuid not null,
  career_id bigint not null default 0,
  season_no integer not null,
  team_name text not null default '',
  honors_a integer not null default 0,
  honors_b integer not null default 0,
  honors_c integer not null default 0,
  honors_d integer not null default 0,
  honors_v integer not null default 0,
  copa_titles integer not null default 0,
  supercopa_titles integer not null default 0,
  world_titles integer not null default 0,
  money integer not null default 0,
  primary key (user_id, career_id, season_no)
);
alter table public.esc_pyramid_rank_snap enable row level security;
create policy insert_own on public.esc_pyramid_rank_snap for insert with check (auth.uid() = user_id);
create policy update_own on public.esc_pyramid_rank_snap for update using (auth.uid() = user_id);
create policy select_all on public.esc_pyramid_rank_snap for select using (true);
grant select, insert, update on public.esc_pyramid_rank_snap to authenticated;

insert into auth.users(id,email) values
  ('00000000-0000-0000-0000-000000000001','diego.c.fonseca@gmail.com'),
  ('00000000-0000-0000-0000-000000000002','outra.conta@example.com');
