-- 🥇🥈🥉 02/11 (Diego, depois de pedir só o 1º): "deixe com a medalha do clã e a individual dele. E o segundo clã fica com medalha
-- prata e terceiro clã fica com medalha bronze". Volta o top 3: 1º ouro · 2º prata · 3º bronze, todo membro carrega.
create or replace function public.esc_cla_medalha(p_cla bigint) returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('pos', pos, 'ate', semana + 37)
  from esc_podio_cla_semana
  where cla_id = p_cla and (semana + 37) > (now() at time zone 'America/Sao_Paulo')::date
  order by pos, semana desc limit 1
$$;
