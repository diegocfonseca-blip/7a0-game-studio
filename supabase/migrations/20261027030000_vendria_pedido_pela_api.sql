-- ⭐📅 VENDRIA PELA API (27/10). Diego: "o jogo precisa liberar o e-mail de quem paga na hora".
-- O que deu errado em 26/10: o botão abria um link fixo da Vendria, então o jogo não sabia QUEM ia pagar; o aviso
-- `order.paid` chega sem e-mail e o `subscription.started` (o único com e-mail) não veio — mesmo com a assinatura ATIVA lá.
-- Agora é igual ao Mercado Pago: quem está LOGADO aperta "Assinar", a Edge Function `vendria-checkout` cria o pedido pela API
-- da Vendria (com o e-mail da conta e uma referência nossa) e anota aqui "pedido X = e-mail Y, plano Z". Quando a Vendria
-- avisa "pedido X pagou", o `vendria-webhook` acha a linha, CONFERE na API que está pago e liga o plano. As renovações
-- chegam pela assinatura (`sub_id`), que fica gravada no primeiro pagamento.
-- 🛡️ Clicar, abrir o checkout ou voltar dele não libera nada: só o aviso assinado da Vendria + a conferência na API.
create table if not exists public.esc_vendria_pedidos (
  order_id text primary key,
  email text not null,
  plano text not null check (plano in ('craque_salas', 'craque_completo')),
  sub_id text,
  checkout_url text,
  criado_em timestamptz not null default now(),
  pago_em timestamptz
);
alter table public.esc_vendria_pedidos enable row level security; -- sem política: só o servidor lê e escreve
create index if not exists esc_vendria_pedidos_sub on public.esc_vendria_pedidos (sub_id);
create index if not exists esc_vendria_pedidos_email on public.esc_vendria_pedidos (email, criado_em);

-- liga/prorroga/encerra o mensal de uma conta (só a chave de serviço). Prorrogar nunca encurta; `p_fim` (assinatura
-- encerrada de vez) é o único caminho que traz o prazo pra trás.
create or replace function public.esc_vendria_libera(p_email text, p_plano text, p_ate timestamptz, p_sub text,
  p_cancel timestamptz default null, p_fim boolean default false) returns text
language plpgsql security definer set search_path = public as $$
declare v_email text := lower(trim(coalesce(p_email, ''))); v_conta boolean;
begin
  if coalesce(auth.role(), '') <> 'service_role' then raise exception 'SO_SERVIDOR'; end if;
  if v_email = '' or p_plano not in ('craque_salas', 'craque_completo') or p_ate is null then return 'invalido'; end if;
  v_conta := exists (select 1 from auth.users u where lower(u.email) = v_email);
  insert into esc_assinatura_mensal (email, plano, valido_ate, cancelada_em, vendria_sub, conta_ok)
    values (v_email, p_plano, p_ate, p_cancel, p_sub, v_conta)
  on conflict (email) do update set
    plano = excluded.plano,
    valido_ate = case when p_fim then least(esc_assinatura_mensal.valido_ate, excluded.valido_ate)
                      else greatest(esc_assinatura_mensal.valido_ate, excluded.valido_ate) end,
    cancelada_em = coalesce(excluded.cancelada_em, case when p_fim then now() end, esc_assinatura_mensal.cancelada_em),
    vendria_sub = coalesce(excluded.vendria_sub, esc_assinatura_mensal.vendria_sub),
    conta_ok = esc_assinatura_mensal.conta_ok or excluded.conta_ok,
    atualizado_em = now();
  return case when v_conta then 'ok' else 'sem_conta' end;
end $$;
