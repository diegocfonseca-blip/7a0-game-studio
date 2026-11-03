-- 🥇 02/11 (Diego, print do clã Leite de Verdade): "não tem sentido os três do clã ganhar medalha… quero que o rank que tá em
-- primeiro ganhe a medalha apenas, e mesmo assim todos membros". Só o 1º clã da semana leva a medalha na pílula (30 dias).
create or replace function public.esc_cla_medalha(p_cla bigint) returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('pos', pos, 'ate', semana + 37)
  from esc_podio_cla_semana
  where cla_id = p_cla and pos = 1 and (semana + 37) > (now() at time zone 'America/Sao_Paulo')::date
  order by semana desc limit 1
$$;
