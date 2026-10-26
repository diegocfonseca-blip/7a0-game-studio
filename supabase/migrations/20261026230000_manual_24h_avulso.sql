-- ⏱️🎮 26/10 (Diego: *"bota 9,90 avulso por 24 horas ou 14,90 no Craque Completo… e por último ver todos os planos"*): o MODO MANUAL
-- avulso por 24 h, R$ 9,90, no Pix do Mercado Pago. Produto 'manual_24h'. Não precisa de entrega própria: o `esc_mp_entregar` só marca
-- o pedido como liberado, e quem dá o Manual é o `esc_direitos_de`, que agora lê o último Pix pago de 'manual_24h' (vale 24 h depois do
-- pagamento). Quem JÁ tem Manual (plano, Craque Completo ou um 24 h ainda valendo) não consegue comprar (preço nulo = sem Pix).
alter table public.esc_mp_pedidos drop constraint if exists esc_mp_pedidos_produto_check;
alter table public.esc_mp_pedidos add constraint esc_mp_pedidos_produto_check check (produto = any (array[
  'craque','lenda','batismo','fundador','salas_extras','teste','moedas_10','moedas_50','moedas_100','moedas_500','moedas_1000',
  'canto','presente','dia_marca','giro_dia','ficha_carreira','tema_coracao','tema_clube','giro_hora','recado_hora','recado_dia',
  'peca_presidente','escudo_cla','cla_extra','cla_criar','manual_24h'])) not valid;
alter table public.esc_pagamentos drop constraint if exists esc_pagamentos_produto_check;
alter table public.esc_pagamentos add constraint esc_pagamentos_produto_check check (produto = any (array[
  'craque_mensal','batismo_lenda','batismo_plus','craque','lenda','salas_extras','teste','moedas_10','moedas_50','moedas_100',
  'moedas_500','moedas_1000','canto','presente','dia_marca','giro_dia','ficha_carreira','tema_coracao','tema_clube','giro_hora',
  'recado_hora','recado_dia','peca_presidente','escudo_cla','cla_extra','cla_criar','manual_24h'])) not valid;

CREATE OR REPLACE FUNCTION public.esc_direitos_de(p_email text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  with e as (select lower(trim(coalesce(p_email, ''))) as email),
  x as (
    select
      coalesce((select c.tier from user_colors c, e where lower(c.email) = e.email limit 1),
               (select l.tier from esc_legado_codigo l, e where l.email = e.email)) as tier_legado,
      exists (select 1 from user_colors c, e where lower(c.email) = e.email and c.manual) as manual_col,
      exists (select 1 from esc_fundadores f, e where lower(f.email) = e.email) as fundador,
      exists (select 1 from esc_socios s, e where lower(s.email) = e.email and coalesce(s.valido_ate, current_date) >= current_date) as socio_ativo,
      exists (select 1 from esc_socios s, e where lower(s.email) = e.email and s.origem = 'batismo' and coalesce(s.valido_ate, current_date) >= current_date) as batismo_antigo,
      exists (select 1 from esc_craque_antigo k, e where k.email = e.email) as craque_antigo,
      (select b.plano from esc_compras_batismo b, e where b.email = e.email) as batismo_plano,
      (select a.valido_ate from esc_assinaturas a, e where a.email = e.email) as craque_ate,
      (select a.cancelada_em from esc_assinaturas a, e where a.email = e.email) as craque_cancelada_em,
      (select m.plano from esc_assinatura_mensal m, e where m.email = e.email and m.conta_ok and m.valido_ate > now()) as mensal_plano,
      (select m.valido_ate from esc_assinatura_mensal m, e where m.email = e.email and m.conta_ok) as mensal_ate,
      (select m.cancelada_em from esc_assinatura_mensal m, e where m.email = e.email and m.conta_ok) as mensal_cancelada_em,
      (select max(p.pago_em) + interval '24 hours' from esc_mp_pedidos p, e where lower(p.email) = e.email and p.produto = 'manual_24h' and p.status in ('pago', 'liberado')) as manual24_ate
  ),
  y as (
    select x.*,
      (craque_ate is not null and craque_ate > now()) as craque_ativo,
      (batismo_plano is not null or batismo_antigo) as batismo,
      (mensal_plano is not null) as mensal_ativo,
      coalesce(manual24_ate > now(), false) as manual24_ativo
    from x
  )
  select jsonb_build_object(
    'tier_legado', tier_legado,
    'fundador', fundador,
    'socio_ativo', socio_ativo,
    'batismo', batismo,
    'batismo_plano', coalesce(batismo_plano, case when batismo_antigo then 'antigo' end),
    'plus', coalesce(batismo_plano = 'plus', false),
    'craque_ativo', craque_ativo,
    'craque_ate', craque_ate,
    'craque_cancelada', craque_cancelada_em is not null,
    'mensal_plano', mensal_plano,
    'mensal_ate', mensal_ate,
    'mensal_cancelada', mensal_cancelada_em is not null,
    'manual24_ate', case when manual24_ativo then manual24_ate end,
    'tier', case when craque_ativo or batismo then 'ouro' when mensal_ativo and coalesce(tier_legado, '') <> 'ouro' then 'prata' else tier_legado end,
    'manual', manual_col or craque_ativo or batismo or coalesce(tier_legado in ('prata','ouro'), false) or coalesce(mensal_plano = 'craque_completo', false) or manual24_ativo,
    'salas_pagas', craque_ativo or batismo or fundador or socio_ativo or coalesce(tier_legado = 'ouro', false) or (coalesce(tier_legado = 'prata', false) and craque_antigo) or mensal_ativo,
    'pago', craque_ativo or batismo_plano is not null or fundador or socio_ativo or coalesce(tier_legado in ('prata','ouro'), false) or mensal_ativo
  )
  from y
$function$;

CREATE OR REPLACE FUNCTION public.esc_mp_preco_ref(p_email text, p_produto text, p_ref text)
 RETURNS numeric
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare pl text; rk int; alvo int; duplo boolean := coalesce(p_ref, '') ~ '^d-\d{1,12}$'; rid text;
begin
  -- ⏱️🎮 26/10: Manual por 24 h, R$ 9,90 — só pra quem ainda não tem o Manual
  if p_produto = 'manual_24h' then return case when coalesce((public.esc_direitos_de(p_email) ->> 'manual')::boolean, false) then null else 9.90 end; end if;
  if p_produto = 'escudo_cla' then return case when public.esc_cla_presidente_email(p_email) then 9.90 else null end; end if;
  if p_produto = 'cla_criar' then return case when coalesce(public.esc_plano_rank(lower(p_email)), 0) < 1 and public.esc_cla_credito_criar(p_email) is null then 4.90 else null end; end if;
  if p_produto = 'cla_extra' then return case when public.esc_cla_pode_extra(p_email) then 4.90 else null end; end if;
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
      if coalesce(public.esc_plano_rank_fixo(p_email), 0) >= alvo then return null; end if;
      return case pl when 'craque' then 53.90 when 'lenda' then 107.90 when 'batismo' then 143.90 when 'fundador' then 179.90 end;
    end if;
    return case pl when 'craque' then 29.90 when 'lenda' then 59.90 when 'batismo' then 79.90 when 'fundador' then 99.90 else null end;
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
end $function$;
