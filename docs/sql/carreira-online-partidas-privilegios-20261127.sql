-- O projeto concede EXECUTE diretamente ao anon por padrão; retirar também esse GRANT.
revoke all on function public.esc_carr_jogo_protocolo() from public,anon,authenticated;
grant execute on function public.esc_carr_jogo_protocolo() to authenticated;
revoke all on public.esc_carr_jogo from public,anon,authenticated;
grant select on public.esc_carr_jogo to authenticated;
revoke all on function public.esc_carr_jogo_comecar(uuid,integer,integer),public.esc_carr_jogo_foto(uuid,integer,integer,text,jsonb),public.esc_carr_jogos_le(uuid,integer,integer,integer[]),public.esc_carr_jogo_troca(uuid,integer,integer,uuid,integer,jsonb),public.esc_carr_jogo_ritmo(uuid,boolean,integer,boolean),public.esc_carr_jogo_apito(uuid,integer,integer,integer) from public, anon, authenticated;
grant execute on function public.esc_carr_jogo_comecar(uuid,integer,integer),public.esc_carr_jogo_foto(uuid,integer,integer,text,jsonb),public.esc_carr_jogos_le(uuid,integer,integer,integer[]),public.esc_carr_jogo_troca(uuid,integer,integer,uuid,integer,jsonb),public.esc_carr_jogo_ritmo(uuid,boolean,integer,boolean),public.esc_carr_jogo_apito(uuid,integer,integer,integer) to authenticated;
