-- 🧑‍💼 PRESIDENTE DA CONTA (15/10, Diego: "sempre com base no e-mail do usuário").
-- UM boneco por conta, guardado aqui e não no save da carreira: vale pra carreira, pro online e pro que vier.
-- O visual é o `PresidenteBaseSave` do jogo (nome, roupa, cabelo/barba/pele/brinco) — menos de 1 KB por conta,
-- então ler/escrever não pesa no tráfego (regra de 04/10).
-- Só o dono lê e escreve a própria linha. Ninguém de fora enxerga nada.
create table if not exists public.esc_presidente (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  visual jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.esc_presidente enable row level security;
drop policy if exists "own read" on public.esc_presidente;
drop policy if exists "own insert" on public.esc_presidente;
drop policy if exists "own update" on public.esc_presidente;
create policy "own read" on public.esc_presidente for select using ((select auth.uid()) = user_id);
create policy "own insert" on public.esc_presidente for insert with check ((select auth.uid()) = user_id);
create policy "own update" on public.esc_presidente for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
grant select, insert, update on public.esc_presidente to authenticated;
-- o visual nunca pode passar de 4 KB (um boneco são ~300 bytes; isso é só cinto de segurança contra lixo)
alter table public.esc_presidente drop constraint if exists esc_presidente_visual_tamanho;
alter table public.esc_presidente add constraint esc_presidente_visual_tamanho check (pg_column_size(visual) <= 4096);
