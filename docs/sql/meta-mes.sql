-- 📊 META DO MÊS na tela de apoio (14/10). Um número por mês (a % do custo coberta pelo apoio); a tela mostra só a %.
-- Leitura pública; escrita SÓ por SQL (o Diego pede e a gente atualiza). Sem linha no mês = a barra some.
-- APLICADO. Outubro/2026 começou em 22% por escolha do Diego (ainda sem o total de Pix do mês).
create table if not exists public.esc_meta_mes (mes text primary key check (mes ~ '^\d{4}-\d{2}$'), pct integer not null check (pct between 0 and 999), atualizado timestamptz not null default now());
alter table public.esc_meta_mes enable row level security;
create policy esc_meta_mes_le on public.esc_meta_mes for select to anon, authenticated using (true);
insert into public.esc_meta_mes(mes, pct) values ('2026-10', 22) on conflict (mes) do update set pct = excluded.pct, atualizado = now();
-- pra mudar:  update public.esc_meta_mes set pct = 35, atualizado = now() where mes = '2026-10';
