-- 🔓 21/10 (Diego): sem espera pra trocar de clã — "tira essa regra, não precisa". Quem saiu entra em outro na hora.
-- (a função continua existindo porque criar/entrar/painel leem ela; agora sempre diz "sem espera")
create or replace function public.esc_cla_espera_ate(p_uid uuid) returns timestamptz language sql stable security definer set search_path = public as $$
  select null::timestamptz
$$;
