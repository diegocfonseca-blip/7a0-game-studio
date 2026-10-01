-- PREPARAÇÃO LOCAL. NÃO executar em produção sem inspecionar RLS, chave e RPCs.
-- Números cumulativos por carreira e temporada; os snapshots antigos seguem 0.
alter table public.esc_pyramid_rank_snap
  add column if not exists mundial_titles integer not null default 0,
  add column if not exists libertadores_titles integer not null default 0,
  add column if not exists champions_titles integer not null default 0;

-- As funções esc_pyramid_rank, esc_pyramid_career_rank e esc_pyramid_my_rank
-- precisam incorporar estas colunas e ordenar por 200/50/40/40/30 + pesos
-- anteriores antes de esta migração ser aplicada. Suas definições atuais não
-- constam neste checkout; não as substitua por versões inferidas.
