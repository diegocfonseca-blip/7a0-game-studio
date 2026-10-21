-- ✂️ CLÃ NÃO TEM "FC" (Diego 21/10: "não precisa ter FC nos clãs"). O clã do batismo nasce com o nome do time SEM o FC/EC/SC/AC/SAF no fim
-- ("Futpoint FC" → "Futpoint", "Neymar_FC" → "Neymar"); o escudo continua o do time (emblema 'escudo:<nome completo>'). Vale também pro
-- nome digitado e pro 2º clã do batismo.
create or replace function public.esc_cla_sem_fc(t text) returns text language sql immutable as $$
  select btrim(regexp_replace(btrim(coalesce(t, '')), '[\s_.-]+(f\.?\s?c\.?|e\.?\s?c\.?|s\.?\s?c\.?|a\.?\s?c\.?|saf)$', '', 'i'))
$$;

create or replace function public.esc_cla_criar(p_nome text, p_emblema text, p_aberto boolean, p_trocar boolean)
returns jsonb language plpgsql security definer set search_path = public as $$
declare eu uuid := auth.uid(); em text; cred uuid; nm text := btrim(regexp_replace(coalesce(p_nome, ''), '\s+', ' ', 'g')); emb text; esc text; novo bigint; atual bigint;
begin
  if eu is null then return jsonb_build_object('erro', 'login'); end if;
  select lower(email) into em from auth.users where id = eu;
  -- 🔓 21/10: sem plano, cria com o crédito do Pix de R$ 9,90 ('cla_criar')
  if coalesce(esc_plano_rank(em), 0) < 1 then
    cred := esc_cla_credito_criar(em);
    if cred is null then return jsonb_build_object('erro', 'plano'); end if;
  end if;
  if p_emblema = 'escudo' then
    -- 🖋 clã do batismo: NOME e ESCUDO do time do dono, juntos
    select escudo_time into esc from esc_socios where lower(email) = em and escudo_time is not null order by socio_n desc nulls last limit 1;
    if esc is null then return jsonb_build_object('erro', 'sem_escudo'); end if;
    nm := esc_cla_sem_fc(esc); emb := 'escudo:' || esc;
  else
    nm := esc_cla_sem_fc(nm);
    if char_length(nm) < 3 or char_length(nm) > 20 then return jsonb_build_object('erro', 'tamanho'); end if;
    if esc_nome_ofensivo(nm) then return jsonb_build_object('erro', 'ofensivo'); end if;
    emb := case when p_emblema ~ '^e:[0-9]{1,2}$' then p_emblema else 'e:0' end;
  end if;
  atual := esc_cla_de(eu);
  if atual is not null and not coalesce(p_trocar, false) then return jsonb_build_object('erro', 'ja_tem'); end if;
  if atual is not null and esc_cla_presidente_preso(eu) then return jsonb_build_object('erro', 'presidente'); end if;
  if esc_cla_espera_ate(eu) is not null then return jsonb_build_object('erro', 'espera', 'ate', esc_cla_espera_ate(eu)); end if;
  if exists (select 1 from esc_clas where ativo and nome_norm = lower(nm)) then return jsonb_build_object('erro', 'nome_em_uso'); end if;
  if atual is not null then perform esc_cla_sai_de(eu); end if;
  insert into esc_clas (nome, nome_norm, emblema, lider, aberto, pedido_criar) values (nm, lower(nm), emb, eu, coalesce(p_aberto, true), cred) returning id into novo;
  insert into esc_cla_membros (cla_id, user_id) values (novo, eu);
  update esc_cla_pedidos set status = 'vencido' where user_id = eu and status = 'aberto';
  return jsonb_build_object('ok', true, 'id', novo);
end $$;

create or replace function public.esc_cla_extra_criar(p_id uuid, p_nome text, p_ideia text) returns text
language plpgsql security definer set search_path = public as $$
declare em text := lower(coalesce(auth.jwt() ->> 'email', '')); eu uuid := auth.uid(); novo bigint; esc text; prin bigint;
  n text := regexp_replace(btrim(coalesce(p_nome, '')), '\s+', ' ', 'g'); i text := regexp_replace(btrim(coalesce(p_ideia, '')), '\s+', ' ', 'g');
begin
  if not exists (select 1 from public.esc_mp_pedidos where id = p_id and email = em and produto = 'cla_extra' and status in ('pago', 'liberado')) then return 'sem_pedido'; end if;
  if exists (select 1 from public.esc_cla_escudo_pedidos where pedido_id = p_id) then
    update public.esc_cla_escudo_pedidos set ideia = left(i, 300), atualizado_em = now() where pedido_id = p_id and char_length(i) >= 5;
    return 'ok';
  end if;
  if char_length(i) < 5 or char_length(i) > 300 then return 'ideia'; end if;
  if public.esc_cla_extra_de(eu) is not null then return 'ja_tem'; end if;
  select escudo_time into esc from public.esc_socios where lower(email) = em and escudo_time is not null order by socio_n desc nulls last limit 1;
  if esc is not null then
    -- 🖋 batismo: o 2º clã é o time do batismo; o escudo personalizado vai pro 1º clã
    prin := public.esc_cla_de(eu);
    if prin is null then return 'sem_cla'; end if;
    if exists (select 1 from public.esc_clas where ativo and nome_norm = lower(public.esc_cla_sem_fc(esc))) then return 'nome_em_uso'; end if;
    insert into public.esc_clas (nome, nome_norm, emblema, lider, aberto, extra) values (public.esc_cla_sem_fc(esc), lower(public.esc_cla_sem_fc(esc)), 'escudo:' || esc, eu, true, true);
    insert into public.esc_cla_escudo_pedidos (pedido_id, email, cla_id, nome_cla, ideia) values (p_id, em, prin, (select nome from public.esc_clas where id = prin), i);
    return 'ok';
  end if;
  n := public.esc_cla_sem_fc(n);
  if char_length(n) < 3 or char_length(n) > 20 then return 'tamanho'; end if;
  if public.esc_nome_ofensivo(n) then return 'ofensivo'; end if;
  if exists (select 1 from public.esc_clas where ativo and nome_norm = lower(n)) then return 'nome_em_uso'; end if;
  insert into public.esc_clas (nome, nome_norm, emblema, lider, aberto, extra) values (n, lower(n), 'e:0', eu, true, true) returning id into novo;
  insert into public.esc_cla_escudo_pedidos (pedido_id, email, cla_id, nome_cla, ideia) values (p_id, em, novo, n, i);
  return 'ok';
end $$;
