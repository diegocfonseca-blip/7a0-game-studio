-- 📊 26/10 (Diego: "quero saber se tem algum lugar que posso ver quantos estão apertando no 9,90, 14,90 e todos os planos…
-- e quando alguém tenta criar sala online e não consegue"). Conta os toques que já caem em `apoio_intents` (hoje, no horário
-- de Brasília, e últimos 7 dias) + os assinantes do mensal da Vendria. Só o Diego lê (mesma trava dos outros painéis #admin).
create or replace function public.esc_admin_funil_mensal() returns jsonb language plpgsql stable security definer set search_path = public as $$
declare hoje timestamptz := (date_trunc('day', now() at time zone 'America/Sao_Paulo')) at time zone 'America/Sao_Paulo';
  r jsonb := '[]'::jsonb; it record;
begin
  if coalesce(auth.jwt() ->> 'email', '') <> 'diego.c.fonseca@gmail.com' then raise exception 'not authorized'; end if;
  for it in select * from (values
      (1, '⭐ Craque Salas · R$ 9,90/mês', array['%Craque Salas (Vendria)%', '%craque_salas (Vendria)%']),
      (2, '⭐ Craque Completo · R$ 14,90/mês', array['%Craque Completo (Vendria)%', '%craque_completo (Vendria)%']),
      (3, '💛 Ver todos os planos', array['%ver todos os planos%', '%limite de sala → ver os planos%']),
      (4, '🎮 Tocou no Manual trancado', array['%modo manual (trava)%']),
      (5, '🏟️ Bateu no limite de sala do dia', array['%bateu no limite de sala%']),
      (6, '🏟️ → foi ver os planos', array['%limite de sala → ver os planos%']),
      (7, '🏟️ → foi nas salas extras (R$ 4,90)', array['%abriu a loja (loja-salas)%']),
      (8, '🛒 Abriu a Loja', array['%abriu a loja%'])
    ) v(ordem, nome, pats) order by ordem
  loop
    r := r || jsonb_build_object('nome', it.nome,
      'hoje', (select count(*) from apoio_intents a where a.created_at >= hoje and a.choice ilike any(it.pats)),
      'pessoas_hoje', (select count(distinct coalesce(a.email, a.nick, a.id::text)) from apoio_intents a where a.created_at >= hoje and a.choice ilike any(it.pats)),
      'sete', (select count(*) from apoio_intents a where a.created_at >= now() - interval '7 days' and a.choice ilike any(it.pats)),
      'pessoas_sete', (select count(distinct coalesce(a.email, a.nick, a.id::text)) from apoio_intents a where a.created_at >= now() - interval '7 days' and a.choice ilike any(it.pats)));
  end loop;
  return jsonb_build_object('linhas', r,
    'assinantes', coalesce((select jsonb_agg(jsonb_build_object('email', m.email, 'plano', m.plano, 'ate', m.valido_ate, 'cancelada', m.cancelada_em is not null, 'conta_ok', m.conta_ok) order by m.atualizado_em desc) from esc_assinatura_mensal m), '[]'::jsonb));
end $$;
grant execute on function public.esc_admin_funil_mensal() to authenticated;
