-- 🏟️ CRIAR SALA À VONTADE AGORA É DO 👑 LENDA PRA CIMA (Diego 14/10: "criar mais de uma sala no dia apenas no plano de 49,90…
-- tudo é adicional do Craque pro Lenda, do Lenda pro Batismo"). O ⭐ Craque NOVO cria 1 por dia, igual ao grátis.
-- Regra de 13/10 (planos novos não mexem em quem já paga): todo Craque que existia em 14/10 entra na foto abaixo e
-- continua criando à vontade, pra sempre.
create table if not exists public.esc_craque_antigo (email text primary key, foto_em timestamptz not null default now());
alter table public.esc_craque_antigo enable row level security; -- sem política: só as funções do banco leem
insert into public.esc_craque_antigo(email)
  select lower(email) from public.user_colors where tier = 'prata'
  union select lower(email) from public.esc_legado_codigo where tier = 'prata'
  on conflict do nothing;
-- e o `salas_pagas` de esc_direitos_de passa a ser:
--   craque_ativo or batismo or fundador or socio_ativo or tier_legado = 'ouro'
--   or (tier_legado = 'prata' and email está em esc_craque_antigo)
-- (o resto da função não muda — ver a definição aplicada no banco)
