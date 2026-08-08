-- 🤝 DUPLA (2 pessoas dividindo o comando de 1 time só) — passo 1: schema.
-- Feature em desenho com o Diego (ver docs/pendencias.md). Este arquivo só
-- CRIA colunas novas, opcionais (default NULL) — não muda nada em quem já
-- joga hoje. Nenhuma sala/jogo existente é afetado até o código passar a
-- LER essas colunas de propósito (o que ainda não foi feito).
--
-- Como aplicar: cole no SQL Editor do Supabase (projeto do Leilão Legends) e
-- rode. É idempotente: pode rodar quantas vezes quiser.
--
-- Como reverter (some tudo da feature, zero rastro):
--   alter table public.room_players
--     drop column if exists dupla_partner_of,
--     drop column if exists dupla_categories,
--     drop column if exists dupla_seek;

-- Quem essa linha acompanha (dupla): NULL = vaga normal de sempre (comanda o
-- próprio player_index, como hoje). Preenchido = essa linha é o PARCEIRO —
-- não tem player_index próprio, só "carona" no assento de quem tá aqui
-- (guarda o user_id do dono do time).
alter table public.room_players
  add column if not exists dupla_partner_of uuid references auth.users(id) on delete set null;

-- Dono de cada categoria no time (só preenchido na linha do TÉCNICO DONO do
-- assento, depois que a dupla já formou e dividiu as posições). Formato:
--   { "GOL": "<uuid>", "LAT": "<uuid>", "ZAG": "<uuid>",
--     "MEI": "<uuid>", "ATA": "<uuid>", "MONTE": "<uuid>" }
-- cada valor é o user_id de quem manda naquela categoria (o dono ou o
-- parceiro). NULL = ainda não dividiram (cai no sorteio 3-e-3 se o host
-- iniciar assim mesmo).
alter table public.room_players
  add column if not exists dupla_categories jsonb;

-- Vaga "procurando parceiro": NULL = não tá procurando (solo, ou já achou).
--   'aberta'  = qualquer um na sala pode tocar e virar parceiro
--   'privada' = não aparece pra estranhos, só quem já tem o convite
alter table public.room_players
  add column if not exists dupla_seek text check (dupla_seek in ('aberta', 'privada'));

-- (o modo "Duplas (beta)" da SALA em si não precisa de coluna nova — entra
-- como mais uma chave no `game_state` jsonb de `game_rooms`, igual `varzea`,
-- `manual`, `ligaFechada` já fazem hoje: { ...gs, duplasMode: true }.)
