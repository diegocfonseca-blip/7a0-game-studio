-- 📊 26/10 (Diego: "também tem que ter esses botões anteriores… bateu no botão manual, bateu o limite de sala do dia"): o funil
-- mantém TODAS as linhas de antes e ganha as do caminho de cada lugar — Manual trancado (24 h avulso · 14,90 · todos os planos)
-- e limite de sala (4,90 · 9,90 · todos os planos) — + quantos PAGARAM o Manual de 24 h (pedido pago, não só toque).
create or replace function public.esc_admin_funil_mensal() returns jsonb language plpgsql stable security definer set search_path = public as $$
declare hoje timestamptz := (date_trunc('day', now() at time zone 'America/Sao_Paulo')) at time zone 'America/Sao_Paulo';
  r jsonb := '[]'::jsonb; it record;
begin
  if coalesce(auth.jwt() ->> 'email', '') <> 'diego.c.fonseca@gmail.com' then raise exception 'not authorized'; end if;
  for it in select * from (values
      (1, '⭐ Craque Salas · R$ 9,90/mês (todos os lugares)', array['%Craque Salas (Vendria)%', '%craque_salas (Vendria)%']),
      (2, '⭐ Craque Completo · R$ 14,90/mês (todos os lugares)', array['%Craque Completo (Vendria)%', '%craque_completo (Vendria)%']),
      (3, '💛 Ver todos os planos (todos os lugares)', array['%ver todos os planos%', '%limite de sala → ver os planos%']),
      (4, '🎮 Tocou no Manual trancado (carreira)', array['%modo manual (trava)%']),
      (5, '🎮 → ⏱️ Manual 24 h avulso · R$ 9,90', array['%manual trancado → avulso 24 h%']),
      (6, '🎮 → ⭐ Craque Completo · R$ 14,90', array['%manual trancado → Craque Completo%']),
      (7, '🎮 → 💛 ver todos os planos', array['%manual trancado → ver todos os planos%']),
      (8, '🏟️ Bateu no limite de sala do dia', array['%bateu no limite de sala%']),
      (9, '🏟️ → 🎟️ salas extras · R$ 4,90', array['%abriu a loja (loja-salas)%']),
      (10, '🏟️ → ⭐ Craque Salas · R$ 9,90', array['%limite de sala → Craque Salas%']),
      (11, '🏟️ → 💛 ver os planos', array['%limite de sala → ver os planos%']),
      (12, '🛒 Abriu a Loja', array['%abriu a loja%'])
    ) v(ordem, nome, pats) order by ordem
  loop
    r := r || jsonb_build_object('nome', it.nome,
      'hoje', (select count(*) from apoio_intents a where a.created_at >= hoje and a.choice ilike any(it.pats)),
      'pessoas_hoje', (select count(distinct coalesce(a.email, a.nick, a.id::text)) from apoio_intents a where a.created_at >= hoje and a.choice ilike any(it.pats)),
      'sete', (select count(*) from apoio_intents a where a.created_at >= now() - interval '7 days' and a.choice ilike any(it.pats)),
      'pessoas_sete', (select count(distinct coalesce(a.email, a.nick, a.id::text)) from apoio_intents a where a.created_at >= now() - interval '7 days' and a.choice ilike any(it.pats)));
  end loop;
  r := r || jsonb_build_object('nome', '✅ Pagaram o Manual 24 h',
    'hoje', (select count(*) from esc_mp_pedidos p where p.produto = 'manual_24h' and p.status in ('pago','liberado') and p.pago_em >= hoje),
    'pessoas_hoje', (select count(distinct lower(p.email)) from esc_mp_pedidos p where p.produto = 'manual_24h' and p.status in ('pago','liberado') and p.pago_em >= hoje),
    'sete', (select count(*) from esc_mp_pedidos p where p.produto = 'manual_24h' and p.status in ('pago','liberado') and p.pago_em >= now() - interval '7 days'),
    'pessoas_sete', (select count(distinct lower(p.email)) from esc_mp_pedidos p where p.produto = 'manual_24h' and p.status in ('pago','liberado') and p.pago_em >= now() - interval '7 days'));
  return jsonb_build_object('linhas', r,
    'assinantes', coalesce((select jsonb_agg(jsonb_build_object('email', m.email, 'plano', m.plano, 'ate', m.valido_ate, 'cancelada', m.cancelada_em is not null, 'conta_ok', m.conta_ok) order by m.atualizado_em desc) from esc_assinatura_mensal m), '[]'::jsonb));
end $$;
grant execute on function public.esc_admin_funil_mensal() to authenticated;
