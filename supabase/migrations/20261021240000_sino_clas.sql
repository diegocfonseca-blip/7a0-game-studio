-- 🔔 21/10 (Diego): "o sininho… agora também aparece convite de clã, amigo adicionando… algo do tipo". A MESMA leitura de 60s
-- (`esc_avisos`, nada de canal) ganha: 'clas' = convites pra clã que eu recebi · 'cla_pedidos' = gente pedindo pra entrar nos
-- clãs que EU presido. Pedido de amizade e amizade aceita já vinham.
create or replace function public.esc_avisos() returns jsonb language plpgsql stable security definer set search_path = public as $$
declare eu uuid := auth.uid();
begin
  if eu is null then return null; end if;
  return jsonb_build_object(
    'convites', coalesce((select jsonb_agg(jsonb_build_object('id', c.id, 'de', c.de, 'nome', esc_nome_conta(c.de), 'code', c.room_code,
        'status', (select g.status from game_rooms g where g.code = c.room_code order by g.updated_at desc limit 1), 'em', c.criado_em) order by c.criado_em desc)
      from esc_convites c where c.para = eu and not c.visto and c.criado_em > now() - interval '20 minutes'), '[]'::jsonb),
    'pedidos', coalesce((select jsonb_agg(jsonb_build_object('id', z.id, 'de', z.de, 'nome', esc_nome_conta(z.de), 'em', z.criado_em) order by z.criado_em desc)
      from esc_amizades z where z.para = eu and z.ativo and z.status = 'pedido'), '[]'::jsonb),
    'aceitos', coalesce((select jsonb_agg(jsonb_build_object('uid', z.para, 'nome', esc_nome_conta(z.para), 'em', z.aceito_em) order by z.aceito_em desc)
      from esc_amizades z where z.de = eu and z.ativo and z.status = 'aceito' and z.aceito_em > now() - interval '2 days'), '[]'::jsonb),
    'online', coalesce((select jsonb_agg(jsonb_build_object('uid', l.outro, 'nome', l.nome)) from esc_amigos_lista() l where l.relacao = 'aceito' and l.online), '[]'::jsonb),
    'clas', coalesce((select jsonb_agg(jsonb_build_object('id', p.id, 'cla', k.id, 'cla_nome', k.nome, 'emblema', k.emblema, 'de', p.de, 'nome', esc_nome_conta(p.de), 'em', p.criado_em) order by p.criado_em desc)
      from esc_cla_pedidos p join esc_clas k on k.id = p.cla_id and k.ativo where p.user_id = eu and p.tipo = 'convite' and p.status = 'aberto'), '[]'::jsonb),
    'cla_pedidos', coalesce((select jsonb_agg(jsonb_build_object('id', p.id, 'cla', k.id, 'cla_nome', k.nome, 'de', p.user_id, 'nome', esc_nome_conta(p.user_id), 'em', p.criado_em) order by p.criado_em desc)
      from esc_cla_pedidos p join esc_clas k on k.id = p.cla_id and k.ativo and k.lider = eu where p.tipo = 'pedido' and p.status = 'aberto'), '[]'::jsonb)
  );
end $$;
