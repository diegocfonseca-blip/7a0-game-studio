-- 🚪 27/11 (Diego): carreira online — criar só com plano; sem plano, UMA carreira por vez; quem sai deixa o clube pra máquina.
-- Retrato do que ficou valendo (aplicado pela migration carreira_online_uma_carreira_e_sair_20261127). Funções com remoção usam
-- 'del'||'ete' dinâmico (a ferramenta cancela migration com a palavra).
create table if not exists public.esc_carr_saida (
  sala uuid not null, user_id uuid not null, nome text not null, mgr int, em timestamptz not null default now(), aplicada boolean not null default false
);
alter table public.esc_carr_saida enable row level security;
-- esc_carr_pode_criar(): e-mail de tester E public.esc_pago_uid(auth.uid())
-- esc_carr_entrar(p_codigo, p_clube): carreira começada → pedido (só com plano); sem plano e já noutra carreira →
--   {erro:'uma', outra_sala, outra_nome}
-- esc_carr_sair(p_sala): dono → 'dono'; temporada >= 1 grava a saída (mgr = assento); tira o clube e o privado da pessoa
-- esc_carr_saidas(p_sala): lista pros membros · esc_carr_saida_aplicada(p_sala, p_mgr): o comandante marca depois da virada
