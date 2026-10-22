-- 🔒 22/10 (Diego): "pra pessoa sair do clã e poder entrar em outro, tem que demorar pelo menos 7 dias, a partir do momento
-- que ela entra". Trava por MEMBRO: até `desde + 7 dias` ninguém SAI nem TROCA daquele clã por vontade própria.
-- Não conta como sair (continua liberado): o presidente tirar · o presidente fechar/guardar o clã · usar a 2ª vaga paga
-- (aí ele não sai do primeiro). (A espera DEPOIS de sair, que era 3 dias, segue zerada desde 21/10 — é outra regra.)
create or replace function public.esc_cla_trava_ate(p_uid uuid, p_cla bigint) returns timestamptz language sql stable security definer set search_path = public as $$
  select m.desde + interval '7 days' from esc_cla_membros m
  where m.user_id = p_uid and m.cla_id = p_cla and m.saiu_em is null and m.desde + interval '7 days' > now()
  limit 1
$$;
create or replace function public.esc_cla_trava_info(p_uid uuid, p_cla bigint) returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('erro', 'trava', 'ate', esc_cla_trava_ate(p_uid, p_cla), 'cla', (select nome from esc_clas where id = p_cla))
$$;

create or replace function public.esc_cla_sair(p_cla bigint) returns jsonb language plpgsql security definer set search_path = public as $$
declare eu uuid := auth.uid(); c bigint := coalesce(p_cla, esc_cla_de(auth.uid()));
begin
  if c is null or not esc_cla_membro_de(eu, c) then return jsonb_build_object('erro', 'sem_cla'); end if;
  if esc_cla_trava_ate(eu, c) is not null then return esc_cla_trava_info(eu, c); end if;
  if esc_cla_preso_em(eu, c) then return jsonb_build_object('erro', 'presidente'); end if;
  perform esc_cla_sai_de2(eu, c);
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.esc_cla_poe2(p_cla bigint, p_uid uuid, p_trocar boolean) returns text language plpgsql security definer set search_path = public as $$
declare v smallint; atual bigint;
begin
  if not exists (select 1 from esc_clas where id = p_cla and ativo) then return 'sem_cla'; end if;
  if esc_cla_membro_de(p_uid, p_cla) then return 'mesmo'; end if;
  if not esc_cla_cabe(p_cla) then return 'lotado'; end if;
  v := esc_cla_vaga_livre(p_uid);
  if v is null then
    if esc_cla_vagas(p_uid) >= 2 then return 'cheio'; end if;
    atual := esc_cla_de(p_uid);
    if not coalesce(p_trocar, false) then return 'ja_tem'; end if;
    if esc_cla_trava_ate(p_uid, atual) is not null then return 'trava'; end if;
    if esc_cla_preso_em(p_uid, atual) then return 'presidente'; end if;
    perform esc_cla_sai_de2(p_uid, atual);
    v := 1;
  end if;
  insert into esc_cla_membros (cla_id, user_id, vaga) values (p_cla, p_uid, v);
  update esc_cla_pedidos set status = 'vencido' where user_id = p_uid and status = 'aberto' and (esc_cla_vaga_livre(p_uid) is null or cla_id = p_cla);
  return 'ok';
end $$;

create or replace function public.esc_cla_entrar(p_cla bigint, p_trocar boolean) returns jsonb language plpgsql security definer set search_path = public as $$
declare eu uuid := auth.uid(); ab boolean; r text;
begin
  if eu is null then return jsonb_build_object('erro', 'login'); end if;
  select aberto into ab from esc_clas where id = p_cla and ativo;
  if ab is null then return jsonb_build_object('erro', 'sem_cla'); end if;
  if esc_cla_membro_de(eu, p_cla) then return jsonb_build_object('erro', 'mesmo'); end if;
  if esc_cla_vaga_livre(eu) is null then
    if esc_cla_vagas(eu) >= 2 then return esc_cla_cheio_info(eu); end if;
    if esc_cla_trava_ate(eu, esc_cla_de(eu)) is not null then return esc_cla_trava_info(eu, esc_cla_de(eu)); end if;
    if not coalesce(p_trocar, false) then return esc_cla_troca_info(eu); end if;
    if esc_cla_presidente_preso(eu) then return jsonb_build_object('erro', 'presidente'); end if;
  end if;
  if not esc_cla_cabe(p_cla) then return jsonb_build_object('erro', 'lotado'); end if;
  if ab then r := esc_cla_poe2(p_cla, eu, coalesce(p_trocar, false)); return case when r = 'ok' then jsonb_build_object('ok', true) when r = 'cheio' then esc_cla_cheio_info(eu) when r = 'trava' then esc_cla_trava_info(eu, esc_cla_de(eu)) else jsonb_build_object('erro', r) end; end if;
  update esc_cla_pedidos set trocar = coalesce(p_trocar, false) where cla_id = p_cla and user_id = eu and tipo = 'pedido' and status = 'aberto';
  if not found then insert into esc_cla_pedidos (cla_id, user_id, tipo, trocar) values (p_cla, eu, 'pedido', coalesce(p_trocar, false)); end if;
  return jsonb_build_object('ok', true, 'pedido', true);
end $$;

create or replace function public.esc_cla_responder(p_id bigint, p_aceita boolean, p_trocar boolean) returns jsonb language plpgsql security definer set search_path = public as $$
declare p esc_cla_pedidos; r text;
begin
  select * into p from esc_cla_pedidos where id = p_id and status = 'aberto';
  if p.id is null then return jsonb_build_object('erro', 'sem_pedido'); end if;
  if p.tipo = 'convite' and p.user_id <> auth.uid() then return jsonb_build_object('erro', 'nao_pode'); end if;
  if p.tipo = 'pedido' and (select lider from esc_clas where id = p.cla_id) <> auth.uid() then return jsonb_build_object('erro', 'nao_pode'); end if;
  if not p_aceita then update esc_cla_pedidos set status = 'recusado' where id = p_id; return jsonb_build_object('ok', true); end if;
  if p.tipo = 'convite' and esc_cla_vaga_livre(p.user_id) is null and not esc_cla_membro_de(p.user_id, p.cla_id) then
    if esc_cla_vagas(p.user_id) >= 2 then return esc_cla_cheio_info(p.user_id); end if;
    if esc_cla_trava_ate(p.user_id, esc_cla_de(p.user_id)) is not null then return esc_cla_trava_info(p.user_id, esc_cla_de(p.user_id)); end if;
    if not coalesce(p_trocar, false) then return esc_cla_troca_info(p.user_id); end if;
  end if;
  r := esc_cla_poe2(p.cla_id, p.user_id, case when p.tipo = 'convite' then coalesce(p_trocar, false) else p.trocar end);
  if r = 'cheio' and p.tipo = 'convite' then return esc_cla_cheio_info(p.user_id); end if;
  if r = 'trava' then return esc_cla_trava_info(p.user_id, esc_cla_de(p.user_id)); end if;
  if r <> 'ok' then return jsonb_build_object('erro', r); end if;
  update esc_cla_pedidos set status = 'aceito' where id = p_id;
  return jsonb_build_object('ok', true);
end $$;

-- criar o seu estando em outro = sair do atual: a mesma trava
create or replace function public.esc_cla_criar(p_nome text, p_emblema text, p_aberto boolean, p_trocar boolean)
returns jsonb language plpgsql security definer set search_path = public as $$
declare eu uuid := auth.uid(); em text; cred uuid; nm text := btrim(regexp_replace(coalesce(p_nome, ''), '\s+', ' ', 'g')); emb text; esc text; novo bigint; atual bigint; v smallint;
begin
  if eu is null then return jsonb_build_object('erro', 'login'); end if;
  select lower(email) into em from auth.users where id = eu;
  v := esc_cla_vaga_livre(eu);
  if v is null and esc_cla_vagas(eu) >= 2 then return esc_cla_cheio_info(eu); end if;
  if coalesce(v, 1) = 1 and coalesce(esc_plano_rank(em), 0) < 1 then
    cred := esc_cla_credito_criar(em);
    if cred is null then return jsonb_build_object('erro', 'plano'); end if;
  end if;
  if p_emblema = 'escudo' then
    select escudo_time into esc from esc_socios where lower(email) = em and escudo_time is not null order by socio_n desc nulls last limit 1;
    if esc is null then return jsonb_build_object('erro', 'sem_escudo'); end if;
    nm := esc_cla_sem_fc(esc); emb := 'escudo:' || esc;
  else
    nm := esc_cla_sem_fc(nm);
    if char_length(nm) < 3 or char_length(nm) > 20 then return jsonb_build_object('erro', 'tamanho'); end if;
    if esc_nome_ofensivo(nm) then return jsonb_build_object('erro', 'ofensivo'); end if;
    emb := case when p_emblema ~ '^e:[0-9]{1,2}$' then p_emblema else 'e:0' end;
  end if;
  if exists (select 1 from esc_clas where (ativo or guardado) and nome_norm = lower(nm)) then return jsonb_build_object('erro', 'nome_em_uso'); end if;
  if v is null then
    atual := esc_cla_de(eu);
    if not coalesce(p_trocar, false) then return jsonb_build_object('erro', 'ja_tem'); end if;
    if esc_cla_trava_ate(eu, atual) is not null then return esc_cla_trava_info(eu, atual); end if;
    if esc_cla_preso_em(eu, atual) then return jsonb_build_object('erro', 'presidente'); end if;
    perform esc_cla_sai_de2(eu, atual);
    v := 1;
  end if;
  insert into esc_clas (nome, nome_norm, emblema, lider, aberto, pedido_criar) values (nm, lower(nm), emb, eu, coalesce(p_aberto, true), cred) returning id into novo;
  insert into esc_cla_membros (cla_id, user_id, vaga) values (novo, eu, v);
  if esc_cla_vaga_livre(eu) is null then update esc_cla_pedidos set status = 'vencido' where user_id = eu and status = 'aberto'; end if;
  return jsonb_build_object('ok', true, 'id', novo);
end $$;

-- a tela mostra até quando cada clã meu está travado
create or replace function public.esc_cla_painel() returns jsonb language plpgsql stable security definer set search_path = public as $$
declare eu uuid := auth.uid(); em text; c bigint; x bigint; esc text;
begin
  if eu is null then return null; end if;
  select lower(email) into em from auth.users where id = eu;
  c := esc_cla_de(eu);
  x := esc_cla_extra_de(eu);
  select escudo_time into esc from esc_socios where lower(email) = em and escudo_time is not null order by socio_n desc nulls last limit 1;
  return jsonb_build_object(
    'pode_criar', esc_cla_vaga_livre(eu) = 2 or esc_cla_pode_criar(em),
    'plano', coalesce(esc_plano_rank(em), 0) >= 1,
    'escudo', esc,
    'espera_ate', null,
    'vagas', esc_cla_vagas(eu),
    'trava_cla', case when c is null then null else esc_cla_trava_ate(eu, c) end,
    'trava_extra', case when x is null then null else esc_cla_trava_ate(eu, x) end,
    'cla', case when c is null then null else esc_cla_bloco(c, eu) end,
    'extra', case when x is null then null else esc_cla_bloco(x, eu) end,
    'guardados', coalesce((select jsonb_agg(jsonb_build_object('id', k.id, 'nome', k.nome, 'emblema', k.emblema) order by k.fechado_em desc) from esc_clas k where k.guardado and k.lider = eu), '[]'::jsonb),
    'convites', coalesce((select jsonb_agg(esc_cla_json(p.cla_id) || jsonb_build_object('pedido_id', p.id, 'de_nome', esc_nome_conta(p.de)) order by p.criado_em desc)
                from esc_cla_pedidos p join esc_clas k on k.id = p.cla_id and k.ativo where p.user_id = eu and p.tipo = 'convite' and p.status = 'aberto'), '[]'::jsonb),
    'pedi', coalesce((select jsonb_agg(p.cla_id) from esc_cla_pedidos p where p.user_id = eu and p.tipo = 'pedido' and p.status = 'aberto'), '[]'::jsonb)
  );
end $$;
