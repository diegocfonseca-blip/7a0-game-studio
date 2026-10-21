-- 🎨 TROCAR O EMBLEMA DO CLÃ (Diego 21/10: "se quiserem editar o escudo… da mesma forma que eles criaram, eles podem editar o
-- escudozinho também… pra quem não pagou pra personalizar"). Só o PRESIDENTE, só entre os emblemas prontos (e:N), e só quando o emblema
-- de agora é um pronto: clã do batismo (nome + escudo do time) e escudo personalizado pago não se trocam por aqui.
create or replace function public.esc_cla_emblema(p_emblema text, p_cla bigint) returns jsonb language plpgsql security definer set search_path = public as $$
declare c bigint := public.esc_cla_meu_alvo(p_cla);
begin
  if c is null or (select lider from esc_clas where id = c) <> auth.uid() then return jsonb_build_object('erro', 'nao_pode'); end if;
  if coalesce(p_emblema, '') !~ '^e:[0-9]{1,2}$' then return jsonb_build_object('erro', 'nao_pode'); end if;
  if (select emblema from esc_clas where id = c) !~ '^e:[0-9]{1,2}$' then return jsonb_build_object('erro', 'emblema_fixo'); end if;
  update esc_clas set emblema = p_emblema where id = c;
  return jsonb_build_object('ok', true);
end $$;
grant execute on function public.esc_cla_emblema(text, bigint) to authenticated;
