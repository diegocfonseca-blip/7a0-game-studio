-- 🚫⚔️⚔️ 02/11 (Diego): ACABOU O 2º CLÃ. *"Quero somente q o usuário fique em um apenas. Ou ele cria o dele ou desativa o dele p entrar
-- em outro clã… iremos remover esse valor da lojinha"*. Conferido antes: ninguém em dois clãs e nenhum Pix de 'cla_extra' na história.
-- Todo mundo tem UMA vaga; o Pix do 2º clã não tem mais preço (nulo = sem Pix). O 'cla_criar' (R$ 4,90 pra quem não tem plano criar
-- o 1º clã) continua igual. Reverter = voltar as duas funções da migration 20261021130000_cla_extra.sql.
create or replace function public.esc_cla_vagas(p_uid uuid) returns integer
language sql stable security definer set search_path = public as $$ select 1 $$;

create or replace function public.esc_cla_pode_extra(p_email text) returns boolean
language sql stable security definer set search_path = public as $$ select false $$;
