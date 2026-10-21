-- 🔓 CRIAR CLÃ SEM PLANO = R$ 9,90 (Diego 21/10: "quem tem plano não paga nada. Pra quem não tem plano paga R$9,90… fica com um
-- cadeadozinho lá pra pagar R$9,90 pra liberar… se quiser o escudo, paga R$19,90"). Produto 'cla_criar': cada Pix pago vale UM clã criado.
-- O crédito é o pedido pago que ainda não virou clã (esc_clas.pedido_criar). Quem tem plano nunca paga.
alter table public.esc_clas add column if not exists pedido_criar uuid;

alter table public.esc_mp_pedidos drop constraint if exists esc_mp_pedidos_produto_check;
alter table public.esc_mp_pedidos add constraint esc_mp_pedidos_produto_check check (produto = any (array[
  'craque','lenda','batismo','fundador','salas_extras','teste','moedas_10','moedas_50','moedas_100','moedas_500','moedas_1000',
  'canto','presente','dia_marca','giro_dia','ficha_carreira','tema_coracao','tema_clube','giro_hora','recado_hora','recado_dia',
  'peca_presidente','escudo_cla','cla_extra','cla_criar'])) not valid;
alter table public.esc_pagamentos drop constraint if exists esc_pagamentos_produto_check;
alter table public.esc_pagamentos add constraint esc_pagamentos_produto_check check (produto = any (array[
  'craque_mensal','batismo_lenda','batismo_plus','craque','lenda','salas_extras','teste','moedas_10','moedas_50','moedas_100',
  'moedas_500','moedas_1000','canto','presente','dia_marca','giro_dia','ficha_carreira','tema_coracao','tema_clube','giro_hora',
  'recado_hora','recado_dia','peca_presidente','escudo_cla','cla_extra','cla_criar'])) not valid;

-- o crédito de criar (o Pix pago mais antigo que ainda não virou clã)
create or replace function public.esc_cla_credito_criar(p_email text) returns uuid language sql stable security definer set search_path = public as $$
  select p.id from esc_mp_pedidos p
  where p.email = lower(p_email) and p.produto = 'cla_criar' and p.status in ('pago', 'liberado')
    and not exists (select 1 from esc_clas c where c.pedido_criar = p.id)
  order by p.criado_em limit 1
$$;
-- pode criar? plano OU crédito pago
create or replace function public.esc_cla_pode_criar(p_email text) returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.esc_plano_rank(lower(p_email)), 0) >= 1 or public.esc_cla_credito_criar(p_email) is not null
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
    nm := esc; emb := 'escudo:' || esc;
  else
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

create or replace function public.esc_cla_painel() returns jsonb language plpgsql stable security definer set search_path = public as $$
declare eu uuid := auth.uid(); em text; c bigint; x bigint; esc text;
begin
  if eu is null then return null; end if;
  select lower(email) into em from auth.users where id = eu;
  c := esc_cla_de(eu);
  x := esc_cla_extra_de(eu);
  select escudo_time into esc from esc_socios where lower(email) = em and escudo_time is not null order by socio_n desc nulls last limit 1;
  return jsonb_build_object(
    'pode_criar', esc_cla_pode_criar(em),
    'plano', coalesce(esc_plano_rank(em), 0) >= 1,
    'escudo', esc,
    'espera_ate', esc_cla_espera_ate(eu),
    'cla', case when c is null then null else esc_cla_bloco(c, eu) end,
    'extra', case when x is null then null else esc_cla_bloco(x, eu) end,
    'convites', coalesce((select jsonb_agg(esc_cla_json(p.cla_id) || jsonb_build_object('pedido_id', p.id, 'de_nome', esc_nome_conta(p.de)) order by p.criado_em desc)
                from esc_cla_pedidos p join esc_clas k on k.id = p.cla_id and k.ativo where p.user_id = eu and p.tipo = 'convite' and p.status = 'aberto'), '[]'::jsonb),
    'pedi', coalesce((select jsonb_agg(p.cla_id) from esc_cla_pedidos p where p.user_id = eu and p.tipo = 'pedido' and p.status = 'aberto'), '[]'::jsonb)
  );
end $$;

create or replace function public.esc_mp_preco_ref(p_email text, p_produto text, p_ref text)
 returns numeric language plpgsql stable security definer set search_path = public as $$
declare pl text; rk int; alvo int; duplo boolean := coalesce(p_ref, '') ~ '^d-\d{1,12}$'; rid text;
begin
  if p_produto = 'escudo_cla' then return case when public.esc_cla_presidente_email(p_email) then 19.99 else null end; end if; -- 🛡️ 21/10
  if p_produto = 'cla_criar' then return case when coalesce(public.esc_plano_rank(lower(p_email)), 0) < 1 and public.esc_cla_credito_criar(p_email) is null then 9.90 else null end; end if; -- 🔓 21/10
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
