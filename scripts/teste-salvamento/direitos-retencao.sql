\set ON_ERROR_STOP on
-- Somente a bancada criada pelo bootstrap.sql.
do $$begin if to_regclass('public.test_rights') is null then raise exception 'SOMENTE LAB'; end if;end$$;
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-a000-000000000001',false);
select public.esc_carreira_salvar_v2(auth.uid(),97,'{"seed":97,"careerOnline":true,"onlineMode":"cpu","managers":[{}],"round":1}',0,'00000000-0000-0000-0000-000000000301');
do $$declare n int; r jsonb;begin
 for n in 2..6 loop
  r:=public.esc_carreira_salvar_v2(auth.uid(),97,jsonb_build_object('seed',97,'careerOnline',true,'onlineMode','cpu','managers',jsonb_build_array('{}'::jsonb),'round',n),n-1,md5('paid'||n)::uuid);
  perform public.test_assert(r->>'status'='saved','revisão pagante');
 end loop;
 perform public.test_assert(jsonb_array_length(public.esc_carreira_historico_v2(auth.uid(),97))=1,'histórico do Craque limitado');
end$$;
reset role;
update public.test_rights set rights='{"pago":true,"tier":"ouro"}' where email='pago@test.invalid';
set role authenticated;
do $$declare n int;begin
 for n in 7..11 loop perform public.esc_carreira_salvar_v2(auth.uid(),97,jsonb_build_object('seed',97,'careerOnline',true,'onlineMode','cpu','managers',jsonb_build_array('{}'::jsonb),'round',n),n-1,md5('upper'||n)::uuid);end loop;
 perform public.test_assert(jsonb_array_length(public.esc_carreira_historico_v2(auth.uid(),97))=3,'histórico superior limitado a três');
end$$;
reset role;
update public.test_rights set rights='{"pago":true,"tier":"prata"}' where email='pago@test.invalid';
set role authenticated;
select public.esc_carreira_salvar_v2(auth.uid(),97,'{"seed":97,"careerOnline":true,"onlineMode":"cpu","managers":[{}],"round":12}',11,'00000000-0000-0000-0000-000000000302');
select public.test_assert(jsonb_array_length(public.esc_carreira_historico_v2(auth.uid(),97))=3,'direito já armazenado preservado');
reset role;
insert into public.esc_carreiras_barradas values('00000000-0000-4000-a000-000000000001','98');
set role authenticated;
select public.test_assert(public.esc_carreira_salvar_v2(auth.uid(),98,'{"seed":98,"careerOnline":true,"onlineMode":"cpu","managers":[{}]}',0,'00000000-0000-0000-0000-000000000303')->>'status'='deleted','bloqueio administrativo preservado');
select public.esc_carreira_salvar_v2(auth.uid(),95,'{"seed":95,"careerOnline":true,"onlineMode":"cpu","managers":[{}]}',0,'00000000-0000-0000-0000-000000000304');
select public.test_assert(public.esc_carreira_salvar_v2(auth.uid(),96,'{"seed":96,"careerOnline":true,"onlineMode":"cpu","managers":[{}]}',0,'00000000-0000-0000-0000-000000000305')->>'status'='slots_full','limite de nuvem validado no servidor');
select public.test_assert(public.esc_carreira_excluir_v2(auth.uid(),95,1,'00000000-0000-0000-0000-000000000306',true)->>'status'='protected','expiração automática não apaga carreira de pagante');
select public.esc_carreira_excluir_v2(auth.uid(),95,1,'00000000-0000-0000-0000-000000000307');
reset role;
-- A limpeza em lotes conserva o vigente e só vence o que já passou da retenção antiga + margem.
insert into public.esc_saves_lixeira(user_id,career,apagar_em) values('00000000-0000-4000-a000-000000000001','{}',now()-interval '9 days'),('00000000-0000-4000-a000-000000000001','{}',now()+interval '1 day');
update esc_save_private.policy set cleanup_after=now()-interval '1 day';
select esc_save_private.maintenance();
select public.test_assert((select count(*)=1 from public.esc_saves_lixeira),'lixeira vigente preservada');
select public.test_assert((select payload is not null from esc_save_private.careers where seed=97),'save ativo preservado na limpeza');
select 'OK: planos, snapshots limitados, bloqueios e retenção' as resultado;
