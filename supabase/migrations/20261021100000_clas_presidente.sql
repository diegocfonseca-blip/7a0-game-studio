-- 👑 PRESIDENTE DO CLÃ NÃO VAI PRA OUTRO SEM RESOLVER O DELE (Diego 21/10: "não pode uma pessoa ser dona de um clã e querer
-- participar em outro… ou remove o clã dele pra poder entrar em outro, ou passa a presidência pra outro usuário, porém só dá pra
-- passar pra quem tem algum plano… e com isso abre a lista dos usuários que estão no clã").
-- Antes: o líder que saía/trocava passava a coroa sozinho pro membro mais antigo. Agora: com gente no clã, sair/trocar devolve
-- {erro:'presidente'} e a tela abre as duas saídas: 👑 passar a presidência (só pra membro com plano) ou 🗑️ fechar o clã.
-- Sozinho no clã: sair/trocar fecha o clã, como sempre. Fechar o clã solta todo mundo SEM a espera de 3 dias (ninguém escolheu sair).
alter table public.esc_cla_membros add column if not exists sem_espera boolean not null default false;

create or replace function public.esc_cla_espera_ate(p_uid uuid) returns timestamptz language sql stable security definer set search_path = public as $$
  select max(saiu_em) + interval '3 days' from esc_cla_membros where user_id = p_uid and not sem_espera and saiu_em > now() - interval '3 days'
$$;

create or replace function public.esc_cla_tem_plano(p_uid uuid) returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(esc_plano_rank((select email from auth.users where id = p_uid)), 0) >= 1
$$;

-- o presidente com outros membros não sai sem antes passar a presidência ou fechar
create or replace function public.esc_cla_presidente_preso(p_uid uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from esc_clas c where c.id = esc_cla_de(p_uid) and c.lider = p_uid
    and (select count(*) from esc_cla_membros m where m.cla_id = c.id and m.saiu_em is null) > 1)
$$;

-- a lista pra escolher o novo presidente: membros (menos ele) e se cada um tem plano
create or replace function public.esc_cla_membros_plano() returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('uid', m.user_id, 'nome', esc_nome_conta(m.user_id), 'plano', esc_cla_tem_plano(m.user_id)) order by m.desde), '[]'::jsonb)
  from esc_cla_membros m join esc_clas c on c.id = m.cla_id
  where m.saiu_em is null and m.user_id <> auth.uid() and c.lider = auth.uid() and c.id = esc_cla_de(auth.uid())
$$;

create or replace function public.esc_cla_passar(p_para uuid) returns jsonb language plpgsql security definer set search_path = public as $$
declare eu uuid := auth.uid(); c bigint := esc_cla_de(auth.uid());
begin
  if c is null or (select lider from esc_clas where id = c) <> eu then return jsonb_build_object('erro', 'nao_pode'); end if;
  if p_para is null or p_para = eu or esc_cla_de(p_para) is distinct from c then return jsonb_build_object('erro', 'nao_pode'); end if;
  if not esc_cla_tem_plano(p_para) then return jsonb_build_object('erro', 'sem_plano'); end if;
  update esc_clas set lider = p_para where id = c;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.esc_cla_fechar() returns jsonb language plpgsql security definer set search_path = public as $$
declare eu uuid := auth.uid(); c bigint := esc_cla_de(auth.uid());
begin
  if c is null or (select lider from esc_clas where id = c) <> eu then return jsonb_build_object('erro', 'nao_pode'); end if;
  update esc_cla_membros set saiu_em = now(), sem_espera = true where cla_id = c and saiu_em is null;
  update esc_clas set ativo = false where id = c;
  update esc_cla_pedidos set status = 'vencido' where cla_id = c and status = 'aberto';
  return jsonb_build_object('ok', true);
end $$;

-- sair: presidente com gente no clã → 'presidente'
create or replace function public.esc_cla_sair() returns jsonb language plpgsql security definer set search_path = public as $$
declare eu uuid := auth.uid();
begin
  if esc_cla_de(eu) is null then return jsonb_build_object('erro', 'sem_cla'); end if;
  if esc_cla_presidente_preso(eu) then return jsonb_build_object('erro', 'presidente'); end if;
  perform esc_cla_sai_de(eu);
  return jsonb_build_object('ok', true);
end $$;

-- trocar: idem (a pergunta de troca já avisa; o banco garante)
create or replace function public.esc_cla_poe2(p_cla bigint, p_uid uuid, p_trocar boolean) returns text language plpgsql security invoker set search_path = public as $$
declare atual bigint := esc_cla_de(p_uid);
begin
  if not exists (select 1 from esc_clas where id = p_cla and ativo) then return 'sem_cla'; end if;
  if atual = p_cla then return 'mesmo'; end if;
  if atual is not null and not p_trocar then return 'ja_tem'; end if;
  if atual is not null and esc_cla_presidente_preso(p_uid) then return 'presidente'; end if;
  if esc_cla_espera_ate(p_uid) is not null then return 'espera'; end if;
  if not esc_cla_cabe(p_cla) then return 'lotado'; end if;
  if atual is not null then perform esc_cla_sai_de(p_uid); end if;
  insert into esc_cla_membros (cla_id, user_id) values (p_cla, p_uid);
  update esc_cla_pedidos set status = 'vencido' where user_id = p_uid and status = 'aberto';
  return 'ok';
end $$;

-- a pergunta de troca leva também se ele é presidente PRESO (com gente no clã)
create or replace function public.esc_cla_troca_info(p_uid uuid) returns jsonb language sql stable security definer set search_path = public as $$
  select case when c.id is null then null else jsonb_build_object('erro', 'confirmar', 'atual', c.nome, 'atual_emblema', c.emblema,
    'lider', c.lider = p_uid, 'sozinho', (select count(*) from esc_cla_membros m where m.cla_id = c.id and m.saiu_em is null) <= 1,
    'preso', esc_cla_presidente_preso(p_uid)) end
  from (select k.* from esc_clas k where k.id = esc_cla_de(p_uid)) c
$$;

-- pedir pra entrar em clã fechado também barra o presidente preso (senão o pedido ficava pendurado até o líder aceitar)
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
  if atual is not null and esc_cla_presidente_preso(eu) then return jsonb_build_object('erro', 'presidente'); end if;
  if not esc_cla_cabe(p_cla) then return jsonb_build_object('erro', 'lotado'); end if;
  if ab then r := esc_cla_poe2(p_cla, eu, coalesce(p_trocar, false)); return case when r = 'ok' then jsonb_build_object('ok', true) else jsonb_build_object('erro', r) end; end if;
  update esc_cla_pedidos set trocar = coalesce(p_trocar, false) where cla_id = p_cla and user_id = eu and tipo = 'pedido' and status = 'aberto';
  if not found then insert into esc_cla_pedidos (cla_id, user_id, tipo, trocar) values (p_cla, eu, 'pedido', coalesce(p_trocar, false)); end if;
  return jsonb_build_object('ok', true, 'pedido', true);
end $$;

grant execute on function public.esc_cla_membros_plano(), public.esc_cla_passar(uuid), public.esc_cla_fechar() to authenticated;
