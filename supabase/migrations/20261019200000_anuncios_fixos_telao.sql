-- 📌 ANÚNCIOS FIXOS DO TELÃO (19/10, Diego: "deveria aparecer no painel as três p eu remover editar ou add nova").
-- Vadico, K9 e Max Joias saíram do código (patrocinio.ts) e vieram pra cá; o #admin edita pela caixa "📌 Anúncios fixos".
-- Tirar = `ativo = false` (fica guardado). Só a conta do Diego grava; todo mundo lê (é o texto público do letreiro).
create table if not exists public.esc_anuncios_fixos (
  id bigserial primary key,
  ordem int not null default 0,
  texto text not null check (char_length(texto) between 4 and 90),
  link text check (link is null or link ~ '^https://'),
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
alter table public.esc_anuncios_fixos enable row level security;
create policy "todos leem fixos" on public.esc_anuncios_fixos for select using (true);
grant select on public.esc_anuncios_fixos to anon, authenticated;
-- (semeado com os 3 que estavam no código: Vadico GWM Haval H6, K9 no YouTube, Max Joias)
-- funções: esc_admin_fixo_salvar(p_id, p_texto, p_link) · esc_admin_fixo_tirar(p_id) · esc_admin_fixo_subir(p_id)
-- (corpo completo aplicado no banco em 19/10 pela migration `anuncios_fixos_telao`)
