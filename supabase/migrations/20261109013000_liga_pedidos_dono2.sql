-- 🚨 09/11 (madrugada): o Painel do Dono (código de 07/11) relia esta função a CADA desenho da tela (~40/s no site inteiro,
-- quase tudo de 2 contas com a página aberta). O conserto do aparelho só vale pra quem recarrega, então a função ganhou nome
-- novo (o código novo chama a _dono2) e a antiga foi RENOMEADA: quem está com o código velho recebe "não existe" na hora, sem
-- ocupar o banco. Desfazer = renomear a _velha de volta.
create or replace function public.esc_liga_pedidos_dono2(p_room uuid)
 returns table(id uuid, user_id uuid, nome text, status text, alvo_bot integer, alvo_uid uuid, pago boolean, created_at timestamp with time zone)
 language plpgsql security definer set search_path to 'public'
as $function$
declare eu uuid := auth.uid();
begin
  if eu is null or not exists (select 1 from public.game_rooms g where g.id = p_room and coalesce(g.liga_dono, g.host_id) = eu) then return; end if;
  return query select p.id, p.user_id, p.nome, p.status, p.alvo_bot, p.alvo_uid, esc_pago_uid(p.user_id), p.created_at
    from public.esc_liga_pedidos p where p.room_id = p_room and p.status in ('pendente','aceito') order by p.created_at;
end $function$;
grant execute on function public.esc_liga_pedidos_dono2(uuid) to authenticated;
alter function public.esc_liga_pedidos_dono(uuid) rename to esc_liga_pedidos_dono_velha;
notify pgrst, 'reload schema';
