-- 💳 04/11: a Vendria passou a cobrar a TAXA da plataforma junto (R$ 1,99): Craque Completo 14,90 chega como total 16,89
-- (subtotal 14,90). A regra só reconhecia 1490 no total → "produto_desconhecido" e o plano NÃO ligava (caso seneorlucas, Neymar FC).
-- Agora o plano é lido pelo SUBTOTAL (o preço do produto, sem taxa) e, por garantia, aceita também o total com a taxa.
CREATE OR REPLACE FUNCTION public.esc_vendria_aplica(p_ev jsonb)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare s jsonb := p_ev->'data'->'subscription'; it jsonb := p_ev->'data'->'items'->0;
  v_email text; v_cent int; v_plano text; v_ate timestamptz; v_cancel timestamptz; v_conta boolean;
begin
  if coalesce(auth.role(), '') <> 'service_role' then raise exception 'SO_SERVIDOR'; end if;
  if s is null then return 'sem_assinatura'; end if;
  v_email := lower(trim(coalesce(s->'customer'->>'email', '')));
  if v_email = '' then return 'sem_email'; end if;
  v_cent := coalesce((it->'values'->'subtotal'->>'amountInCents')::int, (it->'values'->'total'->>'amountInCents')::int,
                     (s->'billing'->'values'->'subtotal'->>'amountInCents')::int, (s->'billing'->'values'->'total'->>'amountInCents')::int, 0);
  v_plano := case v_cent when 990 then 'craque_salas' when 1189 then 'craque_salas' when 1490 then 'craque_completo' when 1689 then 'craque_completo' end;
  if v_plano is null then return 'produto_desconhecido:' || v_cent; end if;
  v_ate := coalesce((s->>'accessEndsAt')::timestamptz, (s->'currentPeriod'->>'end')::timestamptz);
  if v_ate is null then return 'sem_prazo'; end if;
  v_cancel := (s->>'cancelledAt')::timestamptz;
  v_conta := exists (select 1 from auth.users u where lower(u.email) = v_email);
  insert into esc_assinatura_mensal (email, plano, valido_ate, cancelada_em, vendria_sub, conta_ok)
    values (v_email, v_plano, v_ate, v_cancel, s->>'id', v_conta)
  on conflict (email) do update set
    plano = excluded.plano,
    valido_ate = greatest(esc_assinatura_mensal.valido_ate, excluded.valido_ate),
    cancelada_em = excluded.cancelada_em,
    vendria_sub = excluded.vendria_sub,
    conta_ok = esc_assinatura_mensal.conta_ok or excluded.conta_ok,
    atualizado_em = now();
  return case when v_conta then 'ok' else 'sem_conta' end;
end $function$;
