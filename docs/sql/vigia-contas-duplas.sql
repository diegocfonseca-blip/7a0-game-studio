-- 🕵️ VIGIA DE CONTA DUPLA (30/10, Diego: "fique atento se mais pessoas fizerem isso.. me avise").
-- Duplas que, nos últimos 7 dias, jogaram 5+ temporadas SÓ as duas na sala, um ganhou 3+ ligas e o outro nenhuma.
-- Só LEITURA. Padrão sozinho NÃO é prova (pode ser amigo fraco). Pistas que pesam: e-mail com o mesmo nome,
-- conta "de apoio" que nunca joga com mais ninguém, logins colados (min_dif_login pequeno), conta criada há pouco.
-- Já ligadas em esc_contas_ligadas saem da lista.
with t as (select created_at, human_results from game_champions union all select created_at, human_results from game_champions_arquivo),
d as (select human_results->0 a, human_results->1 b from t where jsonb_array_length(human_results)=2 and created_at > now()-interval '7 days'),
p as (select least(a->>'user_id',b->>'user_id') u1, greatest(a->>'user_id',b->>'user_id') u2, a, b from d
      where a->>'user_id' is not null and b->>'user_id' is not null and a->>'user_id'<>b->>'user_id'),
g as (select u1,u2,count(*) temps,
  count(*) filter (where (case when a->>'user_id'=u1 then a else b end->>'league_champion')::bool) ligas_u1,
  count(*) filter (where (case when a->>'user_id'=u2 then a else b end->>'league_champion')::bool) ligas_u2
  from p group by 1,2)
select g.temps, g.ligas_u1, g.ligas_u2, ua.email e1, ub.email e2, ua.created_at::date criada1, ub.created_at::date criada2,
  round(abs(extract(epoch from ua.last_sign_in_at-ub.last_sign_in_at))/60) min_dif_login,
  (select count(*) from t where t.created_at > now()-interval '30 days' and t.human_results::text like '%'||case when g.ligas_u1=0 then g.u1 else g.u2 end||'%'
     and jsonb_array_length(t.human_results) > 2) perdedor_em_sala_cheia_30d
from g join auth.users ua on ua.id::text=g.u1 join auth.users ub on ub.id::text=g.u2
where g.temps>=5 and (g.ligas_u1=0 or g.ligas_u2=0) and greatest(g.ligas_u1,g.ligas_u2)>=3
  and not exists (select 1 from esc_contas_ligadas l where l.conta::text in (g.u1, g.u2))
order by g.temps desc;
