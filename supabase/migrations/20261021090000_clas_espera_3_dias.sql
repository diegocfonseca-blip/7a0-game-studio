-- ⚔️ Clãs: a espera depois de sair/trocar caiu de 7 pra 3 dias (Diego 21/10: "troque de 7 dias pra 3").
create or replace function public.esc_cla_espera_ate(p_uid uuid) returns timestamptz language sql stable security definer set search_path = public as $$
  select max(saiu_em) + interval '3 days' from esc_cla_membros where user_id = p_uid and saiu_em > now() - interval '3 days'
$$;
