-- 🛡️ 22/10 (Diego: "escudo coloque 14,90"): escudo de clã personalizado (`escudo_cla`) passa de R$ 19,90 pra R$ 14,90.
-- Troca SÓ essa linha da esc_mp_preco_ref.
do $$
declare d text := pg_get_functiondef('public.esc_mp_preco_ref'::regproc); n text;
begin
  n := regexp_replace(d, '(p_produto = ''escudo_cla'' then return case when [^;]*? then )19\.90( else null end)', '\114.90\2');
  if n <> d then execute n; end if;
end $$;
