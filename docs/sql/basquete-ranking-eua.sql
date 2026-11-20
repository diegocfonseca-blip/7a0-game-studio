-- 🏀🌍 RANKING GLOBAL DO BASQUETE (EUA Oficial) — 20/11, pontos aprovados pelo Diego ("Ok"):
-- 💍 Anel da NBA 50 · 🏆 Campeão do Leste/Oeste 30 · 🏆 NBA Cup 25 · 🏀 Melhor campanha da temporada regular 20. Empate: caixa.
-- Tabela PRÓPRIA do basquete (a do futebol, esc_pyramid_rank_snap, não muda). Uma linha por carreira; cada um grava só a sua.
create table if not exists public.esc_nba_rank_snap (
  user_id uuid not null references auth.users(id) on delete cascade,
  career_id text not null,
  display_name text not null default '',
  team_name text not null default '',
  aneis int not null default 0,
  conferencias int not null default 0,
  copas int not null default 0,
  campanhas int not null default 0,
  money int not null default 0,
  temporadas int not null default 0,
  pontos int generated always as (aneis * 50 + conferencias * 30 + copas * 25 + campanhas * 20) stored,
  updated_at timestamptz not null default now(),
  primary key (user_id, career_id)
);
alter table public.esc_nba_rank_snap enable row level security;
create policy esc_nba_rank_snap_select_all on public.esc_nba_rank_snap for select using (true);
create policy esc_nba_rank_snap_insert_own on public.esc_nba_rank_snap for insert with check (auth.uid() = user_id);
create policy esc_nba_rank_snap_update_own on public.esc_nba_rank_snap for update using (auth.uid() = user_id);
create index if not exists esc_nba_rank_snap_pontos on public.esc_nba_rank_snap (pontos desc, money desc);
