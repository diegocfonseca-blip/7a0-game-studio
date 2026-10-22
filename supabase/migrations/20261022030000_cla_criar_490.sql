-- 🔓 22/10 (Diego: "coloque criação de clã por 4,90 pra quem não tem plano no primeiro clã"): o produto `cla_criar` (1º clã de
-- quem NÃO tem plano) passa de R$ 9,90 pra R$ 4,90. Nada mais muda: com plano continua grátis; 2º clã (`cla_extra`) R$ 9,90;
-- escudo personalizado (`escudo_cla`) R$ 19,90. Aplicado trocando SÓ essa linha da esc_mp_preco_ref (a função inteira está em
-- 20261021190000_cla_precos.sql e nas migrations de preço anteriores):
--   if p_produto = 'cla_criar' then return case when coalesce(public.esc_plano_rank(lower(p_email)), 0) < 1
--     and public.esc_cla_credito_criar(p_email) is null then 4.90 else null end; end if;
do $$
declare d text := pg_get_functiondef('public.esc_mp_preco_ref'::regproc); n text;
begin
  n := regexp_replace(d, '(p_produto = ''cla_criar'' then return case when [^;]*? then )9\.90( else null end)', '\14.90\2');
  if n <> d then execute n; end if;
end $$;
