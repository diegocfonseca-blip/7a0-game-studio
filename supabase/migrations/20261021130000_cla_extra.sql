-- ⚔️⚔️ 2º CLÃ PAGO (Diego 21/10: "sendo grátis ou não, só pode criar um clã. Se quiser criar mais clã tem que pagar o clã com escudo
-- personalizado da lojinha, que será presidente de dois e ainda terá personalização no novo" → combinado: criar continua de quem tem
-- plano · 1 clã por conta · o 2º vem na Loja por R$ 19,99 já com escudo personalizado · o título dele soma nos DOIS · o selo mostra o 1º).
--
-- Como fica no banco, SEM mexer na trava "1 membro = 1 clã" (esc_cla_membro_um): o 2º clã é uma linha de esc_clas com extra = true e
-- lider = quem comprou. O presidente do 2º clã NÃO vira linha de membro: ele entra nas contas por esc_cla_gente() (títulos, membros,
-- prêmio). A presidência do 2º clã não se passa (ele pode fechar). Os outros entram no 2º clã normalmente (pra eles é o clã deles).
alter table public.esc_clas add column if not exists extra boolean not null default false;
alter table public.esc_clas add column if not exists fechado_em timestamptz;

-- quem está em cada clã AGORA: os membros + o presidente de cada 2º clã
create or replace function public.esc_cla_gente() returns table(cla_id bigint, user_id uuid) language sql stable security definer set search_path = public as $$
  select m.cla_id, m.user_id from esc_cla_membros m join esc_clas c on c.id = m.cla_id and c.ativo where m.saiu_em is null
  union
  select c.id, c.lider from esc_clas c where c.ativo and c.extra
$$;

create or replace function public.esc_clas_semana(p_atras int default 0)
returns table(cla_id bigint, titulos int) language sql stable security definer set search_path = public as $$
  select g.cla_id, coalesce(sum(t.titulos), 0)::int
  from esc_cla_gente() g
  left join esc_titulos_por_uid(esc_semana_ini(p_atras), esc_semana_ini(p_atras) + interval '7 days') t on t.uid = g.user_id
  group by g.cla_id
$$;

create or replace function public.esc_cla_json(p_cla bigint) returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('id', c.id, 'nome', c.nome, 'emblema', c.emblema, 'aberto', c.aberto, 'lider', c.lider, 'lider_nome', esc_nome_conta(c.lider),
    'membros', (select count(*) from esc_cla_gente() g where g.cla_id = c.id),
    'titulos', coalesce((select s.titulos from esc_clas_semana(0) s where s.cla_id = c.id), 0),
    'campeao', c.id = esc_cla_campeao_passado(), 'extra', c.extra)
  from esc_clas c where c.id = p_cla
$$;

-- cabe? o presidente do 2º clã ocupa 1 das 22 vagas
create or replace function public.esc_cla_cabe(p_cla bigint) returns boolean language sql stable security definer set search_path = public as $$
  select (select count(*) from esc_cla_gente() g where g.cla_id = p_cla) < 22
$$;

-- selo: o clã de membro; quem só tem o 2º clã (sem clã de membro) mostra o 2º
create or replace function public.esc_clas_de(p_uids uuid[]) returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('uid', x.uid, 'id', c.id, 'nome', c.nome, 'emblema', c.emblema, 'campeao', c.id = esc_cla_campeao_passado())), '[]'::jsonb)
  from (
    select m.user_id as uid, m.cla_id from esc_cla_membros m join esc_clas k on k.id = m.cla_id and k.ativo where m.saiu_em is null and m.user_id = any(p_uids[1:60])
    union all
    select k.lider, min(k.id) from esc_clas k where k.ativo and k.extra and k.lider = any(p_uids[1:60])
      and not exists (select 1 from esc_cla_membros m join esc_clas k2 on k2.id = m.cla_id and k2.ativo where m.user_id = k.lider and m.saiu_em is null)
    group by k.lider
  ) x join esc_clas c on c.id = x.cla_id
$$;

-- o 2º clã de uma conta (no máximo 1)
create or replace function public.esc_cla_extra_de(p_uid uuid) returns bigint language sql stable security definer set search_path = public as $$
  select id from esc_clas where ativo and extra and lider = p_uid order by id limit 1
$$;

-- qual clã eu estou comandando nesta ação: o informado (se for meu, como presidente) ou o meu de sempre
create or replace function public.esc_cla_meu_alvo(p_cla bigint) returns bigint language sql stable security definer set search_path = public as $$
  select case when p_cla is not null and exists (select 1 from esc_clas where id = p_cla and ativo and lider = auth.uid()) then p_cla else esc_cla_de(auth.uid()) end
$$;

create or replace function public.esc_cla_aberto(p_aberto boolean, p_cla bigint) returns jsonb language plpgsql security definer set search_path = public as $$
begin
  update esc_clas set aberto = p_aberto where id = esc_cla_meu_alvo(p_cla) and lider = auth.uid();
  return jsonb_build_object('ok', found);
end $$;
create or replace function public.esc_cla_tirar(p_uid uuid, p_cla bigint) returns jsonb language plpgsql security definer set search_path = public as $$
declare c bigint := esc_cla_meu_alvo(p_cla);
begin
  if c is null or (select lider from esc_clas where id = c) <> auth.uid() or p_uid = auth.uid() then return jsonb_build_object('erro', 'nao_pode'); end if;
  update esc_cla_membros set saiu_em = now() where user_id = p_uid and cla_id = c and saiu_em is null;
  return jsonb_build_object('ok', found);
end $$;
create or replace function public.esc_cla_convidar(p_para uuid, p_cla bigint) returns jsonb language plpgsql security definer set search_path = public as $$
declare eu uuid := auth.uid(); c bigint := esc_cla_meu_alvo(p_cla);
begin
  if c is null then return jsonb_build_object('erro', 'sem_cla'); end if;
  if p_para is null or p_para = eu then return jsonb_build_object('erro', 'nao_pode'); end if;
  if esc_cla_de(p_para) = c then return jsonb_build_object('erro', 'mesmo'); end if;
  if exists (select 1 from esc_cla_pedidos where cla_id = c and user_id = p_para and tipo = 'convite' and status = 'aberto') then return jsonb_build_object('ok', true); end if;
  insert into esc_cla_pedidos (cla_id, user_id, de, tipo) values (c, p_para, eu, 'convite');
  return jsonb_build_object('ok', true);
end $$;
-- fechar o 2º clã (o 1º continua pelo esc_cla_fechar() de sempre)
create or replace function public.esc_cla_fechar(p_cla bigint) returns jsonb language plpgsql security definer set search_path = public as $$
declare c bigint := esc_cla_meu_alvo(p_cla);
begin
  if c is null or (select lider from esc_clas where id = c) <> auth.uid() then return jsonb_build_object('erro', 'nao_pode'); end if;
  if not (select extra from esc_clas where id = c) then return esc_cla_fechar(); end if;
  update esc_cla_membros set saiu_em = now(), sem_espera = true where cla_id = c and saiu_em is null;
  update esc_clas set ativo = false, fechado_em = now() where id = c;
  update esc_cla_pedidos set status = 'vencido' where cla_id = c and status = 'aberto';
  return jsonb_build_object('ok', true);
end $$;

-- painel: + o 2º clã (com a lista, os pedidos e o selo de 'extra')
create or replace function public.esc_cla_bloco(p_cla bigint, p_eu uuid) returns jsonb language sql stable security definer set search_path = public as $$
  select esc_cla_json(p_cla) || jsonb_build_object(
    'pos', (select r.pos from (select s.cla_id, rank() over (order by s.titulos desc) as pos from esc_clas_semana(0) s) r where r.cla_id = p_cla),
    'lista', (select jsonb_agg(jsonb_build_object('uid', g.user_id, 'nome', esc_nome_conta(g.user_id), 'titulos', coalesce(t.titulos, 0)) order by coalesce(t.titulos, 0) desc)
              from esc_cla_gente() g left join esc_titulos_por_uid(esc_semana_ini(0), now() + interval '1 day') t on t.uid = g.user_id
              where g.cla_id = p_cla),
    'pedidos', case when (select lider from esc_clas where id = p_cla) = p_eu then coalesce((select jsonb_agg(jsonb_build_object('id', p.id, 'uid', p.user_id, 'nome', esc_nome_conta(p.user_id)) order by p.criado_em)
              from esc_cla_pedidos p where p.cla_id = p_cla and p.tipo = 'pedido' and p.status = 'aberto'), '[]'::jsonb) else '[]'::jsonb end)
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
    'pode_criar', coalesce(esc_plano_rank(em), 0) >= 1,
    'escudo', esc,
    'espera_ate', esc_cla_espera_ate(eu),
    'cla', case when c is null then null else esc_cla_bloco(c, eu) end,
    'extra', case when x is null then null else esc_cla_bloco(x, eu) end,
    'convites', coalesce((select jsonb_agg(esc_cla_json(p.cla_id) || jsonb_build_object('pedido_id', p.id, 'de_nome', esc_nome_conta(p.de)) order by p.criado_em desc)
                from esc_cla_pedidos p join esc_clas k on k.id = p.cla_id and k.ativo where p.user_id = eu and p.tipo = 'convite' and p.status = 'aberto'), '[]'::jsonb),
    'pedi', coalesce((select jsonb_agg(p.cla_id) from esc_cla_pedidos p where p.user_id = eu and p.tipo = 'pedido' and p.status = 'aberto'), '[]'::jsonb)
  );
end $$;

-- 💳 produto 'cla_extra' (R$ 19,99): só quem é presidente do seu clã e ainda não tem o 2º
alter table public.esc_mp_pedidos drop constraint if exists esc_mp_pedidos_produto_check;
alter table public.esc_mp_pedidos add constraint esc_mp_pedidos_produto_check check (produto = any (array[
  'craque','lenda','batismo','fundador','salas_extras','teste','moedas_10','moedas_50','moedas_100','moedas_500','moedas_1000',
  'canto','presente','dia_marca','giro_dia','ficha_carreira','tema_coracao','tema_clube','giro_hora','recado_hora','recado_dia',
  'peca_presidente','escudo_cla','cla_extra'])) not valid;
alter table public.esc_pagamentos drop constraint if exists esc_pagamentos_produto_check;
alter table public.esc_pagamentos add constraint esc_pagamentos_produto_check check (produto = any (array[
  'craque_mensal','batismo_lenda','batismo_plus','craque','lenda','salas_extras','teste','moedas_10','moedas_50','moedas_100',
  'moedas_500','moedas_1000','canto','presente','dia_marca','giro_dia','ficha_carreira','tema_coracao','tema_clube','giro_hora',
  'recado_hora','recado_dia','peca_presidente','escudo_cla','cla_extra'])) not valid;

create or replace function public.esc_cla_pode_extra(p_email text) returns boolean language sql stable security definer set search_path = public as $$
  select public.esc_cla_presidente_email(p_email)
    and not exists (select 1 from auth.users u where lower(u.email) = lower(p_email) and public.esc_cla_extra_de(u.id) is not null)
    and not exists (select 1 from esc_mp_pedidos p left join esc_cla_escudo_pedidos e on e.pedido_id = p.id
                    where p.email = lower(p_email) and p.produto = 'cla_extra' and p.status in ('pago', 'liberado') and e.pedido_id is null)
$$;

create or replace function public.esc_mp_preco_ref(p_email text, p_produto text, p_ref text)
 returns numeric language plpgsql stable security definer set search_path = public as $$
declare pl text; rk int; alvo int; duplo boolean := coalesce(p_ref, '') ~ '^d-\d{1,12}$'; rid text;
begin
  if p_produto = 'escudo_cla' then return case when public.esc_cla_presidente_email(p_email) then 19.99 else null end; end if; -- 🛡️ 21/10
  if p_produto = 'cla_extra' then return case when public.esc_cla_pode_extra(p_email) then 19.99 else null end; end if;   -- ⚔️⚔️ 21/10
  if p_produto in ('moedas_10','moedas_50','moedas_100','moedas_500','moedas_1000') then return substring(p_produto from 8)::numeric; end if;
  if p_produto = 'dia_marca' then return 50.00; end if;
  if p_produto = 'peca_presidente' then return public.esc_preco_peca(p_email, p_ref); end if;
  if p_produto = 'giro_dia' then return 25.00; end if;
  if p_produto = 'giro_hora' then return 4.99; end if;
  if p_produto = 'recado_hora' then return 2.99; end if;
  if p_produto = 'recado_dia' then return 9.90; end if;
  if p_produto = 'canto' then
    rk := coalesce(public.esc_plano_rank(p_email), 0);
    return case when rk = 3 then 10.00 else null end;
  end if;
  if p_produto = 'presente' then
    rid := case when duplo then substring(p_ref from 3) else p_ref end;
    if coalesce(rid, '') !~ '^\d{1,12}$' then return null; end if;
    select plano into pl from public.esc_presentes where id = rid::bigint and lower(de_email) = lower(p_email) and status = 'pedido';
    if pl is null then return null; end if;
    if duplo then
      alvo := case pl when 'craque' then 1 when 'lenda' then 2 when 'batismo' then 3 when 'fundador' then 4 end;
      if coalesce(public.esc_plano_rank(p_email), 0) >= alvo then return null; end if;
      return case pl when 'craque' then 53.90 when 'lenda' then 80.90 when 'batismo' then 143.90 when 'fundador' then 179.90 end;
    end if;
    return case pl when 'craque' then 29.90 when 'lenda' then 44.90 when 'batismo' then 79.90 when 'fundador' then 99.90 else null end;
  end if;
  if p_produto = 'tema_coracao' then
    if coalesce(p_ref, '') !~ '^[a-z0-9-]{2,20}$' then return null; end if;
    if exists (select 1 from public.esc_temas_conta t where lower(t.email) = lower(p_email) and t.tipo = 'coracao' and t.alvo = p_ref) then return null; end if;
    return 6.90;
  end if;
  if p_produto = 'tema_clube' then
    rk := coalesce(public.esc_plano_rank(p_email), 0);
    if rk < 3 then return null; end if;
    return case when rk >= 4 then 9.90 else 6.90 end;
  end if;
  return public.esc_mp_preco(p_email, p_produto);
end $$;

-- depois do Pix do 2º clã: nome + ideia → o clã nasce (extra = true, presidente = quem pagou) e o pedido do escudo fica anotado.
-- Escudo e 2º clã moram na MESMA tabela de pedido (esc_cla_escudo_pedidos), então "meus" mostra os dois com o mesmo formulário.
create or replace function public.esc_cla_extra_criar(p_id uuid, p_nome text, p_ideia text) returns text
language plpgsql security definer set search_path = public as $$
declare em text := lower(coalesce(auth.jwt() ->> 'email', '')); eu uuid := auth.uid(); novo bigint;
  n text := regexp_replace(btrim(coalesce(p_nome, '')), '\s+', ' ', 'g'); i text := regexp_replace(btrim(coalesce(p_ideia, '')), '\s+', ' ', 'g');
begin
  if not exists (select 1 from public.esc_mp_pedidos where id = p_id and email = em and produto = 'cla_extra' and status in ('pago', 'liberado')) then return 'sem_pedido'; end if;
  if exists (select 1 from public.esc_cla_escudo_pedidos where pedido_id = p_id) then
    -- clã já criado por este pedido: só corrige a ideia
    update public.esc_cla_escudo_pedidos set ideia = left(i, 300), atualizado_em = now() where pedido_id = p_id and char_length(i) >= 5;
    return 'ok';
  end if;
  if char_length(n) < 3 or char_length(n) > 20 then return 'tamanho'; end if;
  if public.esc_nome_ofensivo(n) then return 'ofensivo'; end if;
  if exists (select 1 from public.esc_clas where ativo and nome_norm = lower(n)) then return 'nome_em_uso'; end if;
  if char_length(i) < 5 or char_length(i) > 300 then return 'ideia'; end if;
  if public.esc_cla_extra_de(eu) is not null then return 'ja_tem'; end if;
  insert into public.esc_clas (nome, nome_norm, emblema, lider, aberto, extra) values (n, lower(n), 'e:0', eu, true, true) returning id into novo;
  insert into public.esc_cla_escudo_pedidos (pedido_id, email, cla_id, nome_cla, ideia) values (p_id, em, novo, n, i);
  return 'ok';
end $$;

create or replace function public.esc_cla_escudo_meus2() returns table(id uuid, produto text, nome text, ideia text, pronto boolean)
language sql stable security definer set search_path = public as $$
  select p.id, p.produto, e.nome_cla, e.ideia, e.pronto_em is not null
  from public.esc_mp_pedidos p left join public.esc_cla_escudo_pedidos e on e.pedido_id = p.id
  where p.email = lower(coalesce(auth.jwt() ->> 'email', '')) and p.produto in ('escudo_cla', 'cla_extra') and p.status in ('pago', 'liberado')
  order by p.criado_em desc
$$;

-- prêmio da semana: o presidente do 2º clã conta como membro dele (o pkey semana+conta deixa 1 prêmio por pessoa: o melhor lugar)
create or replace function public.esc_fecha_semanas_clas() returns void language plpgsql security definer set search_path = public as $$
declare atual date := (date_trunc('week', now() at time zone 'America/Sao_Paulo'))::date; s date := date '2026-10-19'; ini timestamptz; fim timestamptz;
begin
  while s < atual loop
    if not exists (select 1 from esc_semana_cla_fechada where semana = s) then
      perform pg_advisory_xact_lock(hashtext('esc_fecha_semana_cla_' || s));
      if not exists (select 1 from esc_semana_cla_fechada where semana = s) then
        ini := (s::timestamp) at time zone 'America/Sao_Paulo';
        fim := ((s + 7)::timestamp) at time zone 'America/Sao_Paulo';
        insert into esc_premio_cla_semana (semana, user_id, cla_id, pos, nome_cla, emblema, titulos)
        with membros as (
          select m.cla_id, m.user_id from esc_cla_membros m
          where m.desde < fim and (m.saiu_em is null or m.saiu_em >= fim)
          union
          select c.id, c.lider from esc_clas c where c.extra and c.criado_em < fim and (c.ativo or c.fechado_em >= fim)
        ), soma as (
          select mb.cla_id, coalesce(sum(t.titulos), 0)::int as titulos
          from membros mb left join esc_titulos_por_uid(ini, fim) t on t.uid = mb.user_id group by mb.cla_id
        ), pos as (
          select cla_id, titulos, rank() over (order by titulos desc) as p from soma where titulos > 0
        )
        select s, mb.user_id, p.cla_id, p.p, c.nome, c.emblema, p.titulos
        from pos p join esc_clas c on c.id = p.cla_id join membros mb on mb.cla_id = p.cla_id
        where p.p <= 3
        order by p.p
        on conflict do nothing;
        insert into esc_semana_cla_fechada (semana) values (s) on conflict do nothing;
      end if;
    end if;
    s := s + 7;
  end loop;
end $$;

grant execute on function public.esc_cla_aberto(boolean, bigint), public.esc_cla_tirar(uuid, bigint), public.esc_cla_convidar(uuid, bigint),
  public.esc_cla_fechar(bigint), public.esc_cla_extra_criar(uuid, text, text), public.esc_cla_escudo_meus2() to authenticated;
