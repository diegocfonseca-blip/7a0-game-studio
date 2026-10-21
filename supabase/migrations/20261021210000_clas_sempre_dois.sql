-- ⚔️⚔️ 21/10 (Diego): "SEMPRE SÃO DOIS". Cada técnico fica em até 2 clãs, em qualquer combinação (membro dos 2, presidente dos 2,
-- presidente de um e membro do outro). A 2ª vaga só existe pra quem PAGOU a opção do 2º clã (cla_extra, R$ 9,90, pra sempre):
-- "só se ele já pagou a opção de criar clã… aí ele pode estar em dois lugares". Pra entrar num 3º: sair de um, passar a presidência,
-- GUARDAR o clã ("engavetar… deixar em off, não é excluir") ou fechar.
-- Modelo: toda pessoa de um clã é uma linha em esc_cla_membros, com vaga 1 ou 2 (o presidente também). O selo usa a vaga 1.
-- ⚠️ a ferramenta de migration barra "drop index", então a regra velha (1 linha por pessoa, índice esc_cla_membro_um) saiu
-- TROCANDO A TABELA: a antiga virou esc_cla_membros_v1 (cópia de segurança, intacta) e nasceu uma nova sem aquele índice.
alter table public.esc_cla_membros add column if not exists vaga smallint not null default 1;
alter table public.esc_clas add column if not exists guardado boolean not null default false;
alter table public.esc_cla_membros rename to esc_cla_membros_v1;
create table public.esc_cla_membros (
  id bigint not null default nextval('public.esc_cla_membros_id_seq'::regclass),
  cla_id bigint not null references public.esc_clas(id),
  user_id uuid not null references auth.users(id),
  desde timestamptz not null default now(),
  saiu_em timestamptz,
  sem_espera boolean not null default false,
  vaga smallint not null default 1 check (vaga in (1, 2)),
  constraint esc_cla_membros2_pkey primary key (id)
);
insert into public.esc_cla_membros (id, cla_id, user_id, desde, saiu_em, sem_espera, vaga)
  select id, cla_id, user_id, desde, saiu_em, sem_espera, vaga from public.esc_cla_membros_v1;
alter sequence public.esc_cla_membros_id_seq owned by public.esc_cla_membros.id;
create unique index esc_cla_membros2_vaga on public.esc_cla_membros (user_id, vaga) where saiu_em is null;
create unique index esc_cla_membros2_um_por_cla on public.esc_cla_membros (user_id, cla_id) where saiu_em is null;
create index esc_cla_membros2_cla on public.esc_cla_membros (cla_id) where saiu_em is null;
alter table public.esc_cla_membros enable row level security;
-- (em 21/10 não havia nenhum 2º clã "extra" no banco: o modelo velho de presidente-sem-linha morreu sem precisar migrar ninguém)

-- quantos lugares a pessoa tem: 1, ou 2 com a compra do 2º clã
create or replace function public.esc_cla_vagas(p_uid uuid) returns int language sql stable security definer set search_path = public as $$
  select case when exists (select 1 from esc_mp_pedidos p join auth.users u on lower(u.email) = p.email
    where u.id = p_uid and p.produto = 'cla_extra' and p.status in ('pago', 'liberado')) then 2 else 1 end
$$;
create or replace function public.esc_cla_ocupadas(p_uid uuid) returns int language sql stable security definer set search_path = public as $$
  select count(*)::int from esc_cla_membros m join esc_clas c on c.id = m.cla_id and c.ativo where m.user_id = p_uid and m.saiu_em is null
$$;
create or replace function public.esc_cla_membro_de(p_uid uuid, p_cla bigint) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from esc_cla_membros where user_id = p_uid and cla_id = p_cla and saiu_em is null)
$$;
create or replace function public.esc_cla_de(p_uid uuid) returns bigint language sql stable security definer set search_path = public as $$
  select m.cla_id from esc_cla_membros m join esc_clas c on c.id = m.cla_id and c.ativo where m.user_id = p_uid and m.saiu_em is null order by m.vaga limit 1
$$;
-- o 2º lugar (vaga 2)
create or replace function public.esc_cla_extra_de(p_uid uuid) returns bigint language sql stable security definer set search_path = public as $$
  select m.cla_id from esc_cla_membros m join esc_clas c on c.id = m.cla_id and c.ativo where m.user_id = p_uid and m.saiu_em is null and m.vaga = 2 limit 1
$$;
-- ficou só com a vaga 2? ela sobe pra 1 (o selo segue o clã que sobrou)
create or replace function public.esc_cla_arruma(p_uid uuid) returns void language sql security definer set search_path = public as $$
  update esc_cla_membros set vaga = 1 where user_id = p_uid and saiu_em is null and vaga = 2
    and not exists (select 1 from esc_cla_membros x where x.user_id = p_uid and x.saiu_em is null and x.vaga = 1)
$$;
create or replace function public.esc_cla_vaga_livre(p_uid uuid) returns smallint language sql stable security definer set search_path = public as $$
  select case when not exists (select 1 from esc_cla_membros where user_id = p_uid and saiu_em is null and vaga = 1) then 1
              when esc_cla_vagas(p_uid) >= 2 and not exists (select 1 from esc_cla_membros where user_id = p_uid and saiu_em is null and vaga = 2) then 2
              else null end::smallint
$$;
-- presidente de um clã com mais gente: não sai sem antes passar a presidência ou fechar
create or replace function public.esc_cla_preso_em(p_uid uuid, p_cla bigint) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from esc_clas c where c.id = p_cla and c.ativo and c.lider = p_uid
    and (select count(*) from esc_cla_membros m where m.cla_id = c.id and m.saiu_em is null) > 1)
$$;
create or replace function public.esc_cla_presidente_preso(p_uid uuid) returns boolean language sql stable security definer set search_path = public as $$
  select esc_cla_preso_em(p_uid, esc_cla_de(p_uid))
$$;
create or replace function public.esc_cla_presidente_email(p_email text) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from auth.users u join esc_clas c on c.lider = u.id and c.ativo where lower(u.email) = lower(p_email))
$$;
-- os 2 clãs da pessoa (pra tela "sempre são dois")
create or replace function public.esc_cla_meus_json(p_uid uuid) returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(esc_cla_json(m.cla_id) || jsonb_build_object('vaga', m.vaga) order by m.vaga), '[]'::jsonb)
  from esc_cla_membros m join esc_clas c on c.id = m.cla_id and c.ativo where m.user_id = p_uid and m.saiu_em is null
$$;

-- sair de UM clã (o da tela)
create or replace function public.esc_cla_sai_de2(p_uid uuid, p_cla bigint) returns void language plpgsql security definer set search_path = public as $$
declare prox uuid;
begin
  update esc_cla_membros set saiu_em = now() where user_id = p_uid and cla_id = p_cla and saiu_em is null;
  if (select lider from esc_clas where id = p_cla) = p_uid then
    select user_id into prox from esc_cla_membros where cla_id = p_cla and saiu_em is null order by desde limit 1;
    if prox is null then update esc_clas set ativo = false, fechado_em = now() where id = p_cla;
    else update esc_clas set lider = prox where id = p_cla; end if;
  end if;
  perform esc_cla_arruma(p_uid);
end $$;
create or replace function public.esc_cla_sai_de(p_uid uuid) returns void language plpgsql security definer set search_path = public as $$
declare c bigint := esc_cla_de(p_uid);
begin
  if c is not null then perform esc_cla_sai_de2(p_uid, c); end if;
end $$;
create or replace function public.esc_cla_sair(p_cla bigint) returns jsonb language plpgsql security definer set search_path = public as $$
declare eu uuid := auth.uid(); c bigint := coalesce(p_cla, esc_cla_de(auth.uid()));
begin
  if c is null or not esc_cla_membro_de(eu, c) then return jsonb_build_object('erro', 'sem_cla'); end if;
  if esc_cla_preso_em(eu, c) then return jsonb_build_object('erro', 'presidente'); end if;
  perform esc_cla_sai_de2(eu, c);
  return jsonb_build_object('ok', true);
end $$;
create or replace function public.esc_cla_sair() returns jsonb language sql security definer set search_path = public as $$
  select esc_cla_sair(null::bigint)
$$;

-- entrar num clã: cabe numa vaga livre → entra; 1 vaga só e ocupada → pergunta de troca; 2 vagas cheias → 'cheio' ("sempre são dois")
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
    if esc_cla_preso_em(p_uid, atual) then return 'presidente'; end if;
    perform esc_cla_sai_de2(p_uid, atual);
    v := 1;
  end if;
  insert into esc_cla_membros (cla_id, user_id, vaga) values (p_cla, p_uid, v);
  update esc_cla_pedidos set status = 'vencido' where user_id = p_uid and status = 'aberto' and (esc_cla_vaga_livre(p_uid) is null or cla_id = p_cla);
  return 'ok';
end $$;
create or replace function public.esc_cla_poe(p_cla bigint, p_uid uuid) returns text language sql security definer set search_path = public as $$
  select esc_cla_poe2(p_cla, p_uid, false)
$$;
create or replace function public.esc_cla_cheio_info(p_uid uuid) returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('erro', 'cheio', 'meus', esc_cla_meus_json(p_uid))
$$;
create or replace function public.esc_cla_entrar(p_cla bigint, p_trocar boolean) returns jsonb language plpgsql security definer set search_path = public as $$
declare eu uuid := auth.uid(); ab boolean; r text;
begin
  if eu is null then return jsonb_build_object('erro', 'login'); end if;
  select aberto into ab from esc_clas where id = p_cla and ativo;
  if ab is null then return jsonb_build_object('erro', 'sem_cla'); end if;
  if esc_cla_membro_de(eu, p_cla) then return jsonb_build_object('erro', 'mesmo'); end if;
  if esc_cla_vaga_livre(eu) is null then
    if esc_cla_vagas(eu) >= 2 then return esc_cla_cheio_info(eu); end if;
    if not coalesce(p_trocar, false) then return esc_cla_troca_info(eu); end if;
    if esc_cla_presidente_preso(eu) then return jsonb_build_object('erro', 'presidente'); end if;
  end if;
  if not esc_cla_cabe(p_cla) then return jsonb_build_object('erro', 'lotado'); end if;
  if ab then r := esc_cla_poe2(p_cla, eu, coalesce(p_trocar, false)); return case when r = 'ok' then jsonb_build_object('ok', true) when r = 'cheio' then esc_cla_cheio_info(eu) else jsonb_build_object('erro', r) end; end if;
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
    if not coalesce(p_trocar, false) then return esc_cla_troca_info(p.user_id); end if;
  end if;
  r := esc_cla_poe2(p.cla_id, p.user_id, case when p.tipo = 'convite' then coalesce(p_trocar, false) else p.trocar end);
  if r = 'cheio' and p.tipo = 'convite' then return esc_cla_cheio_info(p.user_id); end if;
  if r <> 'ok' then return jsonb_build_object('erro', r); end if;
  update esc_cla_pedidos set status = 'aceito' where id = p_id;
  return jsonb_build_object('ok', true);
end $$;

-- criar: vaga 1 pede plano (ou o Pix de R$ 9,90 sem plano); a vaga 2 já foi paga na compra do 2º clã
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
    if esc_cla_preso_em(eu, atual) then return jsonb_build_object('erro', 'presidente'); end if;
    perform esc_cla_sai_de2(eu, atual);
    v := 1;
  end if;
  insert into esc_clas (nome, nome_norm, emblema, lider, aberto, pedido_criar) values (nm, lower(nm), emb, eu, coalesce(p_aberto, true), cred) returning id into novo;
  insert into esc_cla_membros (cla_id, user_id, vaga) values (novo, eu, v);
  if esc_cla_vaga_livre(eu) is null then update esc_cla_pedidos set status = 'vencido' where user_id = eu and status = 'aberto'; end if;
  return jsonb_build_object('ok', true, 'id', novo);
end $$;
-- o formulário da Loja depois do Pix do 2º clã cria pela MESMA porta
create or replace function public.esc_cla_extra_criar2(p_id uuid, p_nome text, p_emblema text, p_batismo boolean) returns text language plpgsql security definer set search_path = public as $$
declare em text := lower(coalesce(auth.jwt() ->> 'email', '')); r jsonb;
begin
  if not exists (select 1 from esc_mp_pedidos where id = p_id and email = em and produto = 'cla_extra' and status in ('pago', 'liberado')) then return 'sem_pedido'; end if;
  if esc_cla_vaga_livre(auth.uid()) is null then return 'cheio'; end if;
  r := esc_cla_criar(p_nome, case when coalesce(p_batismo, false) then 'escudo' else p_emblema end, true, false);
  return coalesce(r ->> 'erro', 'ok');
end $$;
-- a compra do 2º clã aparece pra quem já está num clã e ainda tem 1 vaga só
create or replace function public.esc_cla_pode_extra(p_email text) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from auth.users u where lower(u.email) = lower(p_email) and esc_cla_ocupadas(u.id) >= 1 and esc_cla_vagas(u.id) < 2)
$$;
-- o formulário de criar o 2º clã aparece na Loja enquanto a 2ª vaga está livre (dá pra entrar em outro também)
create or replace function public.esc_cla_extra_pendentes() returns table(id uuid) language sql stable security definer set search_path = public as $$
  select p.id from esc_mp_pedidos p
  where p.email = lower(coalesce(auth.jwt() ->> 'email', '')) and p.produto = 'cla_extra' and p.status in ('pago', 'liberado')
    and esc_cla_ocupadas(auth.uid()) = 1 and esc_cla_vaga_livre(auth.uid()) = 2
  order by p.criado_em limit 1
$$;

-- presidência e fechar valem pro clã da tela
create or replace function public.esc_cla_membros_plano(p_cla bigint) returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('uid', m.user_id, 'nome', esc_nome_conta(m.user_id), 'plano', esc_cla_tem_plano(m.user_id)) order by m.desde), '[]'::jsonb)
  from esc_cla_membros m join esc_clas c on c.id = m.cla_id
  where m.saiu_em is null and m.user_id <> auth.uid() and c.lider = auth.uid() and c.id = esc_cla_meu_alvo(p_cla)
$$;
create or replace function public.esc_cla_membros_plano() returns jsonb language sql stable security definer set search_path = public as $$
  select esc_cla_membros_plano(null::bigint)
$$;
create or replace function public.esc_cla_passar(p_para uuid, p_cla bigint) returns jsonb language plpgsql security definer set search_path = public as $$
declare eu uuid := auth.uid(); c bigint := esc_cla_meu_alvo(p_cla);
begin
  if c is null or (select lider from esc_clas where id = c) <> eu then return jsonb_build_object('erro', 'nao_pode'); end if;
  if p_para is null or p_para = eu or not esc_cla_membro_de(p_para, c) then return jsonb_build_object('erro', 'nao_pode'); end if;
  if not esc_cla_tem_plano(p_para) then return jsonb_build_object('erro', 'sem_plano'); end if;
  update esc_clas set lider = p_para where id = c;
  return jsonb_build_object('ok', true);
end $$;
create or replace function public.esc_cla_passar(p_para uuid) returns jsonb language sql security definer set search_path = public as $$
  select esc_cla_passar(p_para, null::bigint)
$$;
create or replace function public.esc_cla_fechar(p_cla bigint) returns jsonb language plpgsql security definer set search_path = public as $$
declare c bigint := esc_cla_meu_alvo(p_cla); u uuid;
begin
  if c is null or (select lider from esc_clas where id = c) <> auth.uid() then return jsonb_build_object('erro', 'nao_pode'); end if;
  for u in select user_id from esc_cla_membros where cla_id = c and saiu_em is null loop
    update esc_cla_membros set saiu_em = now(), sem_espera = true where cla_id = c and user_id = u and saiu_em is null;
    perform esc_cla_arruma(u);
  end loop;
  update esc_clas set ativo = false, guardado = false, fechado_em = now() where id = c;
  update esc_cla_pedidos set status = 'vencido' where cla_id = c and status = 'aberto';
  return jsonb_build_object('ok', true);
end $$;
create or replace function public.esc_cla_fechar() returns jsonb language sql security definer set search_path = public as $$
  select esc_cla_fechar(null::bigint)
$$;
-- 📦 GUARDAR ("engavetar"): só presidente sozinho; o clã sai do ar, o nome fica reservado e ele reabre quando tiver vaga
create or replace function public.esc_cla_guardar(p_cla bigint) returns jsonb language plpgsql security definer set search_path = public as $$
declare eu uuid := auth.uid(); c bigint := esc_cla_meu_alvo(p_cla);
begin
  if c is null or (select lider from esc_clas where id = c) <> eu then return jsonb_build_object('erro', 'nao_pode'); end if;
  if esc_cla_preso_em(eu, c) then return jsonb_build_object('erro', 'guardar_gente'); end if;
  update esc_cla_membros set saiu_em = now(), sem_espera = true where cla_id = c and saiu_em is null;
  update esc_clas set ativo = false, guardado = true, fechado_em = now() where id = c;
  update esc_cla_pedidos set status = 'vencido' where cla_id = c and status = 'aberto';
  perform esc_cla_arruma(eu);
  return jsonb_build_object('ok', true);
end $$;
create or replace function public.esc_cla_reabrir(p_cla bigint) returns jsonb language plpgsql security definer set search_path = public as $$
declare eu uuid := auth.uid(); v smallint; nm text;
begin
  select nome_norm into nm from esc_clas where id = p_cla and guardado and lider = eu;
  if nm is null then return jsonb_build_object('erro', 'nao_pode'); end if;
  v := esc_cla_vaga_livre(eu);
  if v is null then return case when esc_cla_vagas(eu) >= 2 then esc_cla_cheio_info(eu) else jsonb_build_object('erro', 'ja_tem') end; end if;
  if exists (select 1 from esc_clas where ativo and nome_norm = nm) then return jsonb_build_object('erro', 'nome_em_uso'); end if;
  update esc_clas set ativo = true, guardado = false, fechado_em = null where id = p_cla;
  insert into esc_cla_membros (cla_id, user_id, vaga) values (p_cla, eu, v);
  return jsonb_build_object('ok', true);
end $$;
create or replace function public.esc_cla_tirar(p_uid uuid, p_cla bigint) returns jsonb language plpgsql security definer set search_path = public as $$
declare c bigint := esc_cla_meu_alvo(p_cla);
begin
  if c is null or (select lider from esc_clas where id = c) <> auth.uid() or p_uid = auth.uid() then return jsonb_build_object('erro', 'nao_pode'); end if;
  update esc_cla_membros set saiu_em = now() where user_id = p_uid and cla_id = c and saiu_em is null;
  if found then perform esc_cla_arruma(p_uid); return jsonb_build_object('ok', true); end if;
  return jsonb_build_object('ok', false);
end $$;
create or replace function public.esc_cla_tirar(p_uid uuid) returns jsonb language sql security definer set search_path = public as $$
  select esc_cla_tirar(p_uid, null::bigint)
$$;
create or replace function public.esc_cla_convidar(p_para uuid, p_cla bigint) returns jsonb language plpgsql security definer set search_path = public as $$
declare eu uuid := auth.uid(); c bigint := esc_cla_meu_alvo(p_cla);
begin
  if c is null or not esc_cla_membro_de(eu, c) then return jsonb_build_object('erro', 'sem_cla'); end if;
  if p_para is null or p_para = eu then return jsonb_build_object('erro', 'nao_pode'); end if;
  if esc_cla_membro_de(p_para, c) then return jsonb_build_object('erro', 'mesmo'); end if;
  if exists (select 1 from esc_cla_pedidos where cla_id = c and user_id = p_para and tipo = 'convite' and status = 'aberto') then return jsonb_build_object('ok', true); end if;
  insert into esc_cla_pedidos (cla_id, user_id, de, tipo) values (c, p_para, eu, 'convite');
  return jsonb_build_object('ok', true);
end $$;
create or replace function public.esc_cla_convidar(p_para uuid) returns jsonb language sql security definer set search_path = public as $$
  select esc_cla_convidar(p_para, null::bigint)
$$;
-- convidar pro 2º clã: a tela manda o id; o membro (não só o presidente) também chama
create or replace function public.esc_cla_meu_alvo(p_cla bigint) returns bigint language sql stable security definer set search_path = public as $$
  select case when p_cla is not null and exists (select 1 from esc_cla_membros m join esc_clas c on c.id = m.cla_id and c.ativo
    where m.cla_id = p_cla and m.user_id = auth.uid() and m.saiu_em is null) then p_cla else esc_cla_de(auth.uid()) end
$$;

-- o selo é do clã da vaga 1
create or replace function public.esc_clas_de(p_uids uuid[]) returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('uid', m.user_id, 'id', c.id, 'nome', c.nome, 'emblema', c.emblema, 'campeao', c.id = esc_cla_campeao_passado())), '[]'::jsonb)
  from esc_cla_membros m join esc_clas c on c.id = m.cla_id and c.ativo
  where m.saiu_em is null and m.vaga = 1 and m.user_id = any(p_uids[1:60])
$$;

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
    'cla', case when c is null then null else esc_cla_bloco(c, eu) end,
    'extra', case when x is null then null else esc_cla_bloco(x, eu) end,
    'guardados', coalesce((select jsonb_agg(jsonb_build_object('id', k.id, 'nome', k.nome, 'emblema', k.emblema) order by k.fechado_em desc) from esc_clas k where k.guardado and k.lider = eu), '[]'::jsonb),
    'convites', coalesce((select jsonb_agg(esc_cla_json(p.cla_id) || jsonb_build_object('pedido_id', p.id, 'de_nome', esc_nome_conta(p.de)) order by p.criado_em desc)
                from esc_cla_pedidos p join esc_clas k on k.id = p.cla_id and k.ativo where p.user_id = eu and p.tipo = 'convite' and p.status = 'aberto'), '[]'::jsonb),
    'pedi', coalesce((select jsonb_agg(p.cla_id) from esc_cla_pedidos p where p.user_id = eu and p.tipo = 'pedido' and p.status = 'aberto'), '[]'::jsonb)
  );
end $$;

grant execute on function public.esc_cla_sair(bigint), public.esc_cla_membros_plano(bigint), public.esc_cla_passar(uuid, bigint),
  public.esc_cla_guardar(bigint), public.esc_cla_reabrir(bigint) to authenticated;
