-- ⚔️ TROCAR DE CLÃ COM CONFIRMAÇÃO (Diego 21/10: "você já participa do clã do Futpoint, gostaria de confirmar?… já tem um clã e
-- alguém te convida ou você mesmo pede pra outro… aparece uma confirmação lembrando que você já está em outro, pra seguir ou não").
-- Antes: quem tinha clã levava "saia dele antes". Agora: o banco responde {erro:'confirmar', atual…} e a tela mostra o aviso; com
-- p_trocar = true ele SAI do atual e entra no novo de uma vez. Clã fechado: o pedido guarda trocar = true e a troca acontece quando o
-- líder aceita. A espera de 7 dias continua: quem saiu/trocou nos últimos 7 dias não troca de novo.
alter table public.esc_cla_pedidos add column if not exists trocar boolean not null default false;

-- sai de verdade (liderança passa pro mais antigo; sozinho = clã fecha). INVOKER: só as funções do banco chamam.
create or replace function public.esc_cla_sai_de(p_uid uuid) returns void language plpgsql security invoker set search_path = public as $$
declare c bigint := esc_cla_de(p_uid); prox uuid;
begin
  if c is null then return; end if;
  update esc_cla_membros set saiu_em = now() where user_id = p_uid and saiu_em is null;
  if (select lider from esc_clas where id = c) = p_uid then
    select user_id into prox from esc_cla_membros where cla_id = c and saiu_em is null order by desde limit 1;
    if prox is null then update esc_clas set ativo = false where id = c;
    else update esc_clas set lider = prox where id = c; end if;
  end if;
end $$;

-- o que a tela precisa pra perguntar: em que clã ele está, se é líder e se está sozinho
create or replace function public.esc_cla_troca_info(p_uid uuid) returns jsonb language sql stable security definer set search_path = public as $$
  select case when c.id is null then null else jsonb_build_object('erro', 'confirmar', 'atual', c.nome, 'atual_emblema', c.emblema,
    'lider', c.lider = p_uid, 'sozinho', (select count(*) from esc_cla_membros m where m.cla_id = c.id and m.saiu_em is null) <= 1) end
  from (select k.* from esc_clas k where k.id = esc_cla_de(p_uid)) c
$$;

-- põe no clã; com p_trocar tira do atual antes (tudo na mesma transação). INVOKER.
create or replace function public.esc_cla_poe2(p_cla bigint, p_uid uuid, p_trocar boolean) returns text language plpgsql security invoker set search_path = public as $$
declare atual bigint := esc_cla_de(p_uid);
begin
  if not exists (select 1 from esc_clas where id = p_cla and ativo) then return 'sem_cla'; end if;
  if atual = p_cla then return 'mesmo'; end if;
  if atual is not null and not p_trocar then return 'ja_tem'; end if;
  if esc_cla_espera_ate(p_uid) is not null then return 'espera'; end if;
  if not esc_cla_cabe(p_cla) then return 'lotado'; end if;
  if atual is not null then perform esc_cla_sai_de(p_uid); end if;
  insert into esc_cla_membros (cla_id, user_id) values (p_cla, p_uid);
  update esc_cla_pedidos set status = 'vencido' where user_id = p_uid and status = 'aberto';
  return 'ok';
end $$;

create or replace function public.esc_cla_entrar(p_cla bigint, p_trocar boolean) returns jsonb language plpgsql security definer set search_path = public as $$
declare eu uuid := auth.uid(); ab boolean; r text; atual bigint;
begin
  if eu is null then return jsonb_build_object('erro', 'login'); end if;
  select aberto into ab from esc_clas where id = p_cla and ativo;
  if ab is null then return jsonb_build_object('erro', 'sem_cla'); end if;
  atual := esc_cla_de(eu);
  if atual = p_cla then return jsonb_build_object('erro', 'mesmo'); end if;
  if esc_cla_espera_ate(eu) is not null then return jsonb_build_object('erro', 'espera'); end if;
  if atual is not null and not coalesce(p_trocar, false) then return esc_cla_troca_info(eu); end if;
  if not esc_cla_cabe(p_cla) then return jsonb_build_object('erro', 'lotado'); end if;
  if ab then r := esc_cla_poe2(p_cla, eu, coalesce(p_trocar, false)); return case when r = 'ok' then jsonb_build_object('ok', true) else jsonb_build_object('erro', r) end; end if;
  update esc_cla_pedidos set trocar = coalesce(p_trocar, false) where cla_id = p_cla and user_id = eu and tipo = 'pedido' and status = 'aberto';
  if not found then insert into esc_cla_pedidos (cla_id, user_id, tipo, trocar) values (p_cla, eu, 'pedido', coalesce(p_trocar, false)); end if;
  return jsonb_build_object('ok', true, 'pedido', true);
end $$;
create or replace function public.esc_cla_entrar(p_cla bigint) returns jsonb language sql security definer set search_path = public as $$
  select esc_cla_entrar(p_cla, false)
$$;

-- convidar: agora pode chamar quem já tem clã (ele decide no aviso)
create or replace function public.esc_cla_convidar(p_para uuid) returns jsonb language plpgsql security definer set search_path = public as $$
declare eu uuid := auth.uid(); c bigint := esc_cla_de(auth.uid());
begin
  if c is null then return jsonb_build_object('erro', 'sem_cla'); end if;
  if p_para is null or p_para = eu then return jsonb_build_object('erro', 'nao_pode'); end if;
  if esc_cla_de(p_para) = c then return jsonb_build_object('erro', 'mesmo'); end if;
  if exists (select 1 from esc_cla_pedidos where cla_id = c and user_id = p_para and tipo = 'convite' and status = 'aberto') then return jsonb_build_object('ok', true); end if;
  insert into esc_cla_pedidos (cla_id, user_id, de, tipo) values (c, p_para, eu, 'convite');
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.esc_cla_responder(p_id bigint, p_aceita boolean, p_trocar boolean) returns jsonb language plpgsql security definer set search_path = public as $$
declare p esc_cla_pedidos; r text;
begin
  select * into p from esc_cla_pedidos where id = p_id and status = 'aberto';
  if p.id is null then return jsonb_build_object('erro', 'sem_pedido'); end if;
  if p.tipo = 'convite' and p.user_id <> auth.uid() then return jsonb_build_object('erro', 'nao_pode'); end if;
  if p.tipo = 'pedido' and (select lider from esc_clas where id = p.cla_id) <> auth.uid() then return jsonb_build_object('erro', 'nao_pode'); end if;
  if not p_aceita then update esc_cla_pedidos set status = 'recusado' where id = p_id; return jsonb_build_object('ok', true); end if;
  -- convite pra quem já tem clã: primeiro a pergunta
  if p.tipo = 'convite' and esc_cla_de(p.user_id) is not null and esc_cla_de(p.user_id) <> p.cla_id and not coalesce(p_trocar, false) then
    if esc_cla_espera_ate(p.user_id) is not null then return jsonb_build_object('erro', 'espera'); end if;
    return esc_cla_troca_info(p.user_id);
  end if;
  r := esc_cla_poe2(p.cla_id, p.user_id, case when p.tipo = 'convite' then coalesce(p_trocar, false) else p.trocar end);
  if r <> 'ok' then return jsonb_build_object('erro', r); end if;
  update esc_cla_pedidos set status = 'aceito' where id = p_id;
  return jsonb_build_object('ok', true);
end $$;
create or replace function public.esc_cla_responder(p_id bigint, p_aceita boolean) returns jsonb language sql security definer set search_path = public as $$
  select esc_cla_responder(p_id, p_aceita, false)
$$;

grant execute on function public.esc_cla_entrar(bigint, boolean), public.esc_cla_responder(bigint, boolean, boolean) to authenticated;
