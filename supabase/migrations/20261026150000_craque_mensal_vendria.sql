-- ⭐📅 CRAQUE MENSAL PELA VENDRIA (26/10, loja aprovada pelo Diego: `scripts/mockups/loja-craque-mensal-lenda-vez.png`).
-- Dois mensais no Pix recorrente da Vendria: ⭐ Craque Salas R$ 9,90 (salas à vontade, Minhas Ligas, personagem, clã, prata) e
-- ⭐ Craque Completo R$ 14,90 (tudo do Salas + Modo Manual + Campo 2D). "Quem já tem plano não muda nada" (Diego, 26/10): esta tabela
-- é NOVA e só SOMA por cima do que a conta já tem — tier ouro, batismo, Craque/Lenda antigos continuam iguais.
-- 🛡️ Segurança: quem escreve aqui é SÓ o webhook da Vendria (assinatura HMAC conferida na Edge Function) chamando
-- `esc_vendria_aplica` com a chave de serviço. Clicar no link, abrir o checkout ou voltar dele não libera nada.
create table if not exists public.esc_assinatura_mensal (
  email text primary key,
  plano text not null check (plano in ('craque_salas', 'craque_completo')),
  valido_ate timestamptz not null,
  cancelada_em timestamptz,
  vendria_sub text,
  conta_ok boolean not null default false, -- a conta do jogo com esse e-mail já existia quando o pagamento chegou
  atualizado_em timestamptz not null default now()
);
alter table public.esc_assinatura_mensal enable row level security;

-- aplica um evento de assinatura da Vendria (só a chave de serviço chama — a Edge Function, depois de conferir a assinatura)
create or replace function public.esc_vendria_aplica(p_ev jsonb) returns text language plpgsql security definer set search_path = public as $$
declare s jsonb := p_ev->'data'->'subscription'; it jsonb := p_ev->'data'->'items'->0;
  v_email text; v_cent int; v_plano text; v_ate timestamptz; v_cancel timestamptz; v_conta boolean;
begin
  if coalesce(auth.role(), '') <> 'service_role' then raise exception 'SO_SERVIDOR'; end if;
  if s is null then return 'sem_assinatura'; end if;
  v_email := lower(trim(coalesce(s->'customer'->>'email', '')));
  if v_email = '' then return 'sem_email'; end if;
  -- o produto sai do VALOR cobrado (o webhook é assinado pela Vendria, então o valor é dela, não do cliente)
  v_cent := coalesce((it->'values'->'total'->>'amountInCents')::int, (s->'billing'->'values'->'total'->>'amountInCents')::int, 0);
  v_plano := case v_cent when 990 then 'craque_salas' when 1490 then 'craque_completo' end;
  if v_plano is null then return 'produto_desconhecido:' || v_cent; end if;
  v_ate := coalesce((s->>'accessEndsAt')::timestamptz, (s->'currentPeriod'->>'end')::timestamptz);
  if v_ate is null then return 'sem_prazo'; end if;
  v_cancel := (s->>'cancelledAt')::timestamptz;
  v_conta := exists (select 1 from auth.users u where lower(u.email) = v_email);
  insert into esc_assinatura_mensal (email, plano, valido_ate, cancelada_em, vendria_sub, conta_ok)
    values (v_email, v_plano, v_ate, v_cancel, s->>'id', v_conta)
  on conflict (email) do update set
    plano = excluded.plano,
    -- renovação nunca encurta o prazo; um evento velho chegando fora de ordem não tira mês pago
    valido_ate = greatest(esc_assinatura_mensal.valido_ate, excluded.valido_ate),
    cancelada_em = excluded.cancelada_em,
    vendria_sub = excluded.vendria_sub,
    conta_ok = esc_assinatura_mensal.conta_ok or excluded.conta_ok,
    atualizado_em = now();
  return case when v_conta then 'ok' else 'sem_conta' end;
end $$;

-- os DIREITOS passam a enxergar o mensal (o resto da função é a de 14/10, igual)
create or replace function public.esc_direitos_de(p_email text) returns jsonb language sql stable security definer set search_path to 'public' as $function$
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
      (select m.cancelada_em from esc_assinatura_mensal m, e where m.email = e.email and m.conta_ok) as mensal_cancelada_em
  ),
  y as (
    select x.*,
      (craque_ate is not null and craque_ate > now()) as craque_ativo,
      (batismo_plano is not null or batismo_antigo) as batismo,
      (mensal_plano is not null) as mensal_ativo
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
    -- ⭐ mensal ativo = prata (Craque); quem já é ouro/batismo continua ouro
    'tier', case when craque_ativo or batismo then 'ouro' when mensal_ativo and coalesce(tier_legado, '') <> 'ouro' then 'prata' else tier_legado end,
    -- 🎮 o Manual do mensal é SÓ do Craque Completo
    'manual', manual_col or craque_ativo or batismo or coalesce(tier_legado in ('prata','ouro'), false) or coalesce(mensal_plano = 'craque_completo', false),
    'salas_pagas', craque_ativo or batismo or fundador or socio_ativo or coalesce(tier_legado = 'ouro', false) or (coalesce(tier_legado = 'prata', false) and craque_antigo) or mensal_ativo,
    'pago', craque_ativo or batismo_plano is not null or fundador or socio_ativo or coalesce(tier_legado in ('prata','ouro'), false) or mensal_ativo
  )
  from y
$function$;
