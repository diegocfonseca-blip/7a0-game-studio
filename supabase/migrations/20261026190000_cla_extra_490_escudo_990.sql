-- 💸 26/10 (Diego: "segundo clã na loja coloca 4,90 e escudo a 9,90"): 2º clã (`cla_extra`) R$ 9,90 → R$ 4,90 e escudo de clã
-- personalizado (`escudo_cla`) R$ 14,90 → R$ 9,90. Nada mais muda (quem pode comprar continua igual). Troca SÓ essas duas linhas
-- da esc_mp_preco_ref, do mesmo jeito das migrations de preço de clã anteriores.
do $$
declare d text := pg_get_functiondef('public.esc_mp_preco_ref'::regproc); n text;
begin
  n := regexp_replace(d, '(p_produto = ''cla_extra'' then return case when [^;]*? then )9\.90( else null end)', '\14.90\2');
  n := regexp_replace(n, '(p_produto = ''escudo_cla'' then return case when [^;]*? then )14\.90( else null end)', '\19.90\2');
  if n <> d then execute n; end if;
end $$;
