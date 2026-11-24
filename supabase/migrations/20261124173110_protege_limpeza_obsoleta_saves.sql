-- A exclusão automática de um dia foi revogada em 08/11.
-- Não executa a função nem modifica qualquer save: somente fecha o acesso de clientes.
revoke execute on function public.esc_nuvem_gratis_limpa() from public, anon, authenticated;
