-- Só inicia o protocolo novo quando cada participante tem uma sessão do cliente novo.
-- Cliente anterior não cria essa autorização. Evita mesclar versões sem recarregar ninguém.
create or replace function public.esc_carr_jogo_compativel(p_sala uuid)
returns boolean language sql stable security definer set search_path=public as $$
 select public.esc_carr_sou_comandante(p_sala)
 and exists(select 1 from public.esc_carr_clube where sala=p_sala)
 and not exists(select 1 from public.esc_carr_clube c where c.sala=p_sala and not exists(
   select 1 from public.esc_carr_aparelho a where a.sala=c.sala and a.user_id=c.user_id and a.ate>now()
 ));
$$;
revoke all on function public.esc_carr_jogo_compativel(uuid) from public,anon,authenticated;
grant execute on function public.esc_carr_jogo_compativel(uuid) to authenticated;
-- O cliente da publicação inicial não conferia as versões dos colegas. Não habilita por esse caminho.
create or replace function public.esc_carr_jogo_protocolo() returns integer language sql stable security invoker set search_path=public as $$ select 0 $$;
revoke all on function public.esc_carr_jogo_protocolo() from public,anon,authenticated;
grant execute on function public.esc_carr_jogo_protocolo() to authenticated;
