-- ⚔️ CLÃS (aprovado pelo Diego 19/10; mockups `scripts/mockups/clas.png` e `clas-onde-aparece.png`, "ok pode fazer" 21/10).
-- Criar = qualquer plano PAGO (esc_plano_rank ≥ 1). Entrar = todo mundo. Até 20 membros, 1 clã por vez, voltar pra outro só 7 dias
-- depois de sair. Títulos ONLINE da semana (os mesmos do Ranking da Semana) somam pro clã. Sem rivalidade entre clãs.
-- Tudo passa por função (security definer); as tabelas não têm leitura direta.
create table if not exists public.esc_clas (
  id bigserial primary key,
  nome text not null,
  nome_norm text not null,
  emblema text not null,              -- 'e:<n>' emblema pronto · 'escudo:<clube>' escudo do clube do dono (batismo/sócio)
  lider uuid not null references auth.users(id),
  aberto boolean not null default true,
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);
create unique index if not exists esc_clas_nome_ativo on public.esc_clas (nome_norm) where ativo;
create table if not exists public.esc_cla_membros (
  id bigserial primary key,
  cla_id bigint not null references public.esc_clas(id),
  user_id uuid not null references auth.users(id),
  desde timestamptz not null default now(),
  saiu_em timestamptz
);
create unique index if not exists esc_cla_membro_um on public.esc_cla_membros (user_id) where saiu_em is null;
create index if not exists esc_cla_membros_cla on public.esc_cla_membros (cla_id) where saiu_em is null;
create table if not exists public.esc_cla_pedidos (
  id bigserial primary key,
  cla_id bigint not null references public.esc_clas(id),
  user_id uuid not null references auth.users(id),   -- quem entra
  de uuid references auth.users(id),                 -- convite: quem chamou · pedido: null
  tipo text not null check (tipo in ('pedido', 'convite')),
  status text not null default 'aberto' check (status in ('aberto', 'aceito', 'recusado', 'vencido')),
  criado_em timestamptz not null default now()
);
alter table public.esc_clas enable row level security;
alter table public.esc_cla_membros enable row level security;
alter table public.esc_cla_pedidos enable row level security;

-- 🏆 títulos online por conta num intervalo (a MESMA conta do Ranking da Semana: liga + copas de cada partida)
create or replace function public.esc_titulos_por_uid(p_de timestamptz, p_ate timestamptz)
returns table(uid uuid, titulos int) language sql stable security definer set search_path = public as $$
  select (x->>'user_id')::uuid, sum(
      (case when coalesce((x->>'league_champion')::boolean, false) then 1 else 0 end)
      + coalesce(jsonb_array_length(case when jsonb_typeof(x->'cup_titles') = 'array' then x->'cup_titles' end), 0))::int
  from (select created_at, human_results from game_champions union all select created_at, human_results from game_champions_arquivo) g,
       jsonb_array_elements(coalesce(g.human_results, '[]'::jsonb)) x
  where g.created_at >= p_de and g.created_at < p_ate and x->>'user_id' ~ '^[0-9a-f-]{36}$'
  group by 1
$$;
create or replace function public.esc_semana_ini(p_atras int default 0) returns timestamptz language sql stable as $$
  select (date_trunc('week', now() at time zone 'America/Sao_Paulo') at time zone 'America/Sao_Paulo') - make_interval(days => 7 * p_atras)
$$;
create or replace function public.esc_cla_de(p_uid uuid) returns bigint language sql stable security definer set search_path = public as $$
  select m.cla_id from esc_cla_membros m join esc_clas c on c.id = m.cla_id and c.ativo where m.user_id = p_uid and m.saiu_em is null limit 1
$$;
-- títulos da semana de cada clã (membros de agora)
create or replace function public.esc_clas_semana(p_atras int default 0)
returns table(cla_id bigint, titulos int) language sql stable security definer set search_path = public as $$
  select m.cla_id, coalesce(sum(t.titulos), 0)::int
  from esc_cla_membros m join esc_clas c on c.id = m.cla_id and c.ativo
  left join esc_titulos_por_uid(esc_semana_ini(p_atras), esc_semana_ini(p_atras) + interval '7 days') t on t.uid = m.user_id
  where m.saiu_em is null group by m.cla_id
$$;
-- o clã campeão da semana PASSADA (o selo 🏆 da semana de agora). Precisa de pelo menos 1 título.
create or replace function public.esc_cla_campeao_passado() returns bigint language sql stable security definer set search_path = public as $$
  select cla_id from esc_clas_semana(1) where titulos > 0 order by titulos desc, cla_id limit 1
$$;
create or replace function public.esc_cla_espera_ate(p_uid uuid) returns timestamptz language sql stable security definer set search_path = public as $$
  select max(saiu_em) + interval '7 days' from esc_cla_membros where user_id = p_uid and saiu_em > now() - interval '7 days'
$$;
create or replace function public.esc_cla_cabe(p_cla bigint) returns boolean language sql stable security definer set search_path = public as $$
  select count(*) < 20 from esc_cla_membros where cla_id = p_cla and saiu_em is null
$$;
-- entra de verdade (todas as checagens num lugar só)
create or replace function public.esc_cla_poe(p_cla bigint, p_uid uuid) returns text language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from esc_clas where id = p_cla and ativo) then return 'sem_cla'; end if;
  if esc_cla_de(p_uid) is not null then return 'ja_tem'; end if;
  if esc_cla_espera_ate(p_uid) is not null then return 'espera'; end if;
  if not esc_cla_cabe(p_cla) then return 'lotado'; end if;
  insert into esc_cla_membros (cla_id, user_id) values (p_cla, p_uid);
  update esc_cla_pedidos set status = 'vencido' where user_id = p_uid and status = 'aberto';
  return 'ok';
end $$;

create or replace function public.esc_cla_criar(p_nome text, p_emblema text, p_aberto boolean default true)
returns jsonb language plpgsql security definer set search_path = public as $$
declare eu uuid := auth.uid(); em text; nm text := btrim(regexp_replace(coalesce(p_nome, ''), '\s+', ' ', 'g')); emb text; esc text; novo bigint;
begin
  if eu is null then return jsonb_build_object('erro', 'login'); end if;
  select lower(email) into em from auth.users where id = eu;
  if coalesce(esc_plano_rank(em), 0) < 1 then return jsonb_build_object('erro', 'plano'); end if;
  if char_length(nm) < 3 or char_length(nm) > 20 then return jsonb_build_object('erro', 'tamanho'); end if;
  if esc_nome_ofensivo(nm) then return jsonb_build_object('erro', 'ofensivo'); end if;
  if esc_cla_de(eu) is not null then return jsonb_build_object('erro', 'ja_tem'); end if;
  if esc_cla_espera_ate(eu) is not null then return jsonb_build_object('erro', 'espera', 'ate', esc_cla_espera_ate(eu)); end if;
  if exists (select 1 from esc_clas where ativo and nome_norm = lower(nm)) then return jsonb_build_object('erro', 'nome_em_uso'); end if;
  if p_emblema = 'escudo' then
    select escudo_time into esc from esc_socios where lower(email) = em and escudo_time is not null order by socio_n desc nulls last limit 1;
    if esc is null then return jsonb_build_object('erro', 'sem_escudo'); end if;
    emb := 'escudo:' || esc;
  elsif p_emblema ~ '^e:[0-9]{1,2}$' then emb := p_emblema;
  else emb := 'e:0'; end if;
  insert into esc_clas (nome, nome_norm, emblema, lider, aberto) values (nm, lower(nm), emb, eu, coalesce(p_aberto, true)) returning id into novo;
  insert into esc_cla_membros (cla_id, user_id) values (novo, eu);
  update esc_cla_pedidos set status = 'vencido' where user_id = eu and status = 'aberto';
  return jsonb_build_object('ok', true, 'id', novo);
end $$;

create or replace function public.esc_cla_entrar(p_cla bigint) returns jsonb language plpgsql security definer set search_path = public as $$
declare eu uuid := auth.uid(); ab boolean; r text;
begin
  if eu is null then return jsonb_build_object('erro', 'login'); end if;
  select aberto into ab from esc_clas where id = p_cla and ativo;
  if ab is null then return jsonb_build_object('erro', 'sem_cla'); end if;
  if ab then r := esc_cla_poe(p_cla, eu); return case when r = 'ok' then jsonb_build_object('ok', true) else jsonb_build_object('erro', r) end; end if;
  if esc_cla_de(eu) is not null then return jsonb_build_object('erro', 'ja_tem'); end if;
  if esc_cla_espera_ate(eu) is not null then return jsonb_build_object('erro', 'espera'); end if;
  if not esc_cla_cabe(p_cla) then return jsonb_build_object('erro', 'lotado'); end if;
  if not exists (select 1 from esc_cla_pedidos where cla_id = p_cla and user_id = eu and tipo = 'pedido' and status = 'aberto') then
    insert into esc_cla_pedidos (cla_id, user_id, tipo) values (p_cla, eu, 'pedido');
  end if;
  return jsonb_build_object('ok', true, 'pedido', true);
end $$;

-- sair: o líder que sai passa a liderança pro membro mais antigo; sem ninguém, o clã fecha
create or replace function public.esc_cla_sair() returns jsonb language plpgsql security definer set search_path = public as $$
declare eu uuid := auth.uid(); c bigint := esc_cla_de(auth.uid()); prox uuid;
begin
  if c is null then return jsonb_build_object('erro', 'sem_cla'); end if;
  update esc_cla_membros set saiu_em = now() where user_id = eu and saiu_em is null;
  if (select lider from esc_clas where id = c) = eu then
    select user_id into prox from esc_cla_membros where cla_id = c and saiu_em is null order by desde limit 1;
    if prox is null then update esc_clas set ativo = false where id = c;
    else update esc_clas set lider = prox where id = c; end if;
  end if;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.esc_cla_aberto(p_aberto boolean) returns jsonb language plpgsql security definer set search_path = public as $$
begin
  update esc_clas set aberto = p_aberto where id = esc_cla_de(auth.uid()) and lider = auth.uid();
  return jsonb_build_object('ok', found);
end $$;

create or replace function public.esc_cla_tirar(p_uid uuid) returns jsonb language plpgsql security definer set search_path = public as $$
declare c bigint := esc_cla_de(auth.uid());
begin
  if c is null or (select lider from esc_clas where id = c) <> auth.uid() or p_uid = auth.uid() then return jsonb_build_object('erro', 'nao_pode'); end if;
  update esc_cla_membros set saiu_em = now() where user_id = p_uid and cla_id = c and saiu_em is null;
  return jsonb_build_object('ok', found);
end $$;

-- convite: qualquer membro chama; quem aceita entra direto (mesmo em clã fechado)
create or replace function public.esc_cla_convidar(p_para uuid) returns jsonb language plpgsql security definer set search_path = public as $$
declare eu uuid := auth.uid(); c bigint := esc_cla_de(auth.uid());
begin
  if c is null then return jsonb_build_object('erro', 'sem_cla'); end if;
  if p_para is null or p_para = eu then return jsonb_build_object('erro', 'nao_pode'); end if;
  if esc_cla_de(p_para) is not null then return jsonb_build_object('erro', 'ja_tem'); end if;
  if exists (select 1 from esc_cla_pedidos where cla_id = c and user_id = p_para and tipo = 'convite' and status = 'aberto') then return jsonb_build_object('ok', true); end if;
  insert into esc_cla_pedidos (cla_id, user_id, de, tipo) values (c, p_para, eu, 'convite');
  return jsonb_build_object('ok', true);
end $$;

-- responder: convite (quem foi chamado) ou pedido (o líder)
create or replace function public.esc_cla_responder(p_id bigint, p_aceita boolean) returns jsonb language plpgsql security definer set search_path = public as $$
declare p esc_cla_pedidos; r text;
begin
  select * into p from esc_cla_pedidos where id = p_id and status = 'aberto';
  if p.id is null then return jsonb_build_object('erro', 'sem_pedido'); end if;
  if p.tipo = 'convite' and p.user_id <> auth.uid() then return jsonb_build_object('erro', 'nao_pode'); end if;
  if p.tipo = 'pedido' and (select lider from esc_clas where id = p.cla_id) <> auth.uid() then return jsonb_build_object('erro', 'nao_pode'); end if;
  if not p_aceita then update esc_cla_pedidos set status = 'recusado' where id = p_id; return jsonb_build_object('ok', true); end if;
  r := esc_cla_poe(p.cla_id, p.user_id);
  if r <> 'ok' then return jsonb_build_object('erro', r); end if;
  update esc_cla_pedidos set status = 'aceito' where id = p_id;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.esc_cla_json(p_cla bigint) returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('id', c.id, 'nome', c.nome, 'emblema', c.emblema, 'aberto', c.aberto, 'lider', c.lider, 'lider_nome', esc_nome_conta(c.lider),
    'membros', (select count(*) from esc_cla_membros m where m.cla_id = c.id and m.saiu_em is null),
    'titulos', coalesce((select s.titulos from esc_clas_semana(0) s where s.cla_id = c.id), 0),
    'campeao', c.id = esc_cla_campeao_passado())
  from esc_clas c where c.id = p_cla
$$;

-- o painel da aba ⚔️ Clã
create or replace function public.esc_cla_painel() returns jsonb language plpgsql stable security definer set search_path = public as $$
declare eu uuid := auth.uid(); em text; c bigint; esc text;
begin
  if eu is null then return null; end if;
  select lower(email) into em from auth.users where id = eu;
  c := esc_cla_de(eu);
  select escudo_time into esc from esc_socios where lower(email) = em and escudo_time is not null order by socio_n desc nulls last limit 1;
  return jsonb_build_object(
    'pode_criar', coalesce(esc_plano_rank(em), 0) >= 1,
    'escudo', esc,
    'espera_ate', esc_cla_espera_ate(eu),
    'cla', case when c is null then null else esc_cla_json(c) || jsonb_build_object(
      'pos', (select r.pos from (select s.cla_id, rank() over (order by s.titulos desc) as pos from esc_clas_semana(0) s) r where r.cla_id = c),
      'lista', (select jsonb_agg(jsonb_build_object('uid', m.user_id, 'nome', esc_nome_conta(m.user_id), 'titulos', coalesce(t.titulos, 0)) order by coalesce(t.titulos, 0) desc, m.desde)
                from esc_cla_membros m left join esc_titulos_por_uid(esc_semana_ini(0), now() + interval '1 day') t on t.uid = m.user_id
                where m.cla_id = c and m.saiu_em is null),
      'pedidos', case when (select lider from esc_clas where id = c) = eu then coalesce((select jsonb_agg(jsonb_build_object('id', p.id, 'uid', p.user_id, 'nome', esc_nome_conta(p.user_id)) order by p.criado_em)
                from esc_cla_pedidos p where p.cla_id = c and p.tipo = 'pedido' and p.status = 'aberto'), '[]'::jsonb) else '[]'::jsonb end) end,
    'convites', coalesce((select jsonb_agg(esc_cla_json(p.cla_id) || jsonb_build_object('pedido_id', p.id, 'de_nome', esc_nome_conta(p.de)) order by p.criado_em desc)
                from esc_cla_pedidos p join esc_clas k on k.id = p.cla_id and k.ativo where p.user_id = eu and p.tipo = 'convite' and p.status = 'aberto'), '[]'::jsonb),
    'pedi', coalesce((select jsonb_agg(p.cla_id) from esc_cla_pedidos p where p.user_id = eu and p.tipo = 'pedido' and p.status = 'aberto'), '[]'::jsonb)
  );
end $$;

-- procurar: filtros 'vaga' · 'titulos' · 'batismo'
create or replace function public.esc_cla_lista(p_q text default '', p_filtro text default 'vaga') returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(j order by (j->>'titulos')::int desc, j->>'nome'), '[]'::jsonb) from (
    select esc_cla_json(c.id) as j from esc_clas c
    where c.ativo and (coalesce(p_q, '') = '' or c.nome_norm like '%' || lower(btrim(p_q)) || '%')
      and (p_filtro <> 'batismo' or c.emblema like 'escudo:%')
    limit 60) x
  where p_filtro <> 'vaga' or (j->>'membros')::int < 20
$$;
create or replace function public.esc_cla_ranking() returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(esc_cla_json(s.cla_id) || jsonb_build_object('pos', s.pos) order by s.pos, s.cla_id), '[]'::jsonb)
  from (select cla_id, titulos, rank() over (order by titulos desc) as pos from esc_clas_semana(0)) s where s.pos <= 20
$$;
-- 🏷️ o selo de cada conta (lote, pra sala/chat/amigos — mesma ideia do presidente)
create or replace function public.esc_clas_de(p_uids uuid[]) returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('uid', m.user_id, 'id', c.id, 'nome', c.nome, 'emblema', c.emblema, 'campeao', c.id = esc_cla_campeao_passado())), '[]'::jsonb)
  from esc_cla_membros m join esc_clas c on c.id = m.cla_id and c.ativo
  where m.saiu_em is null and m.user_id = any(p_uids[1:60])
$$;
grant execute on function public.esc_cla_criar(text, text, boolean), public.esc_cla_entrar(bigint), public.esc_cla_sair(), public.esc_cla_aberto(boolean),
  public.esc_cla_tirar(uuid), public.esc_cla_convidar(uuid), public.esc_cla_responder(bigint, boolean), public.esc_cla_painel(),
  public.esc_cla_lista(text, text), public.esc_cla_ranking(), public.esc_clas_de(uuid[]) to authenticated;
