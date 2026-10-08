-- 🧪 TESTE DOS PLANOS V2 NO BANCO (08/10). Roda tudo dentro de UMA transação e no fim DESFAZ
-- (o `raise exception` final devolve o relatório e dá rollback): nenhuma conta de verdade é tocada,
-- as contas de teste são inventadas (@teste.invalid) e somem junto.
-- Como rodar: colar no SQL do Supabase (ou execute_sql). O resultado vem na mensagem de erro
-- "RELATORIO ..." — cada linha "ok" ou "FALHOU".
do $$
declare
  r text := '';
  d jsonb;
  j jsonb;
  ate1 timestamptz;
  ate2 timestamptz;
  u_free uuid := gen_random_uuid();
  u_cr uuid := gen_random_uuid();
  u_bl uuid := gen_random_uuid();
  u_pl uuid := gen_random_uuid();
begin
  -- contas de teste (só dentro desta transação)
  insert into auth.users (id, email, aud, role) values
    (u_free, 'free@teste.invalid', 'authenticated', 'authenticated'),
    (u_cr, 'craque@teste.invalid', 'authenticated', 'authenticated'),
    (u_bl, 'batlenda@teste.invalid', 'authenticated', 'authenticated'),
    (u_pl, 'batplus@teste.invalid', 'authenticated', 'authenticated');

  -- 1) gratuito: nada pago
  d := esc_direitos_de('free@teste.invalid');
  r := r || format(E'\n1 gratuito sem nada: %s', case when d->>'tier' is null and not (d->>'salas_pagas')::bool and not (d->>'pago')::bool and not (d->>'manual')::bool then 'ok' else 'FALHOU '||d::text end);

  -- não-admin não registra pagamento
  perform set_config('request.jwt.claims', json_build_object('email','craque@teste.invalid','sub',u_cr)::text, true);
  begin
    perform esc_admin_craque_pagamento('craque@teste.invalid', 'PIX-T1');
    r := r || E'\n2 não-admin registrou pagamento: FALHOU';
  exception when others then r := r || E'\n2 não-admin barrado: ok'; end;

  -- pedido do mensal com WhatsApp (pela própria conta)
  j := esc_pedir_craque('(21) 99999-0000');
  j := esc_pedir_craque('21 98888-1111'); -- 2º pedido atualiza o mesmo, não duplica
  r := r || format(E'\n3 pedido único por conta: %s', case when (select count(*) from esc_pedidos_craque where email='craque@teste.invalid')=1 and (select whatsapp from esc_pedidos_craque where email='craque@teste.invalid')='21988881111' then 'ok' else 'FALHOU' end);
  begin perform esc_pedir_craque('123'); r := r || E'\n4 whatsapp curto aceito: FALHOU';
  exception when others then r := r || E'\n4 whatsapp inválido barrado: ok'; end;
  d := esc_meus_direitos();
  r := r || format(E'\n5 pedido NÃO libera nada: %s', case when not (d->>'craque_ativo')::bool and d->'pedido'->>'status'='novo' then 'ok' else 'FALHOU '||d::text end);

  -- admin confirma o pagamento
  perform set_config('request.jwt.claims', '{"email":"diego.c.fonseca@gmail.com"}', true);
  begin perform esc_admin_craque_pagamento('naoexiste@teste.invalid', 'PIX-X'); r := r || E'\n6 conta inexistente: FALHOU';
  exception when others then r := r || E'\n6 conta inexistente barrada: ok'; end;
  j := esc_admin_craque_pagamento('craque@teste.invalid', 'PIX-T1');
  ate1 := (j->>'valido_ate')::timestamptz;
  d := esc_direitos_de('craque@teste.invalid');
  r := r || format(E'\n7 Craque ativo = tudo do Craque completo: %s', case when (d->>'craque_ativo')::bool and d->>'tier'='ouro' and (d->>'manual')::bool and (d->>'salas_pagas')::bool and (d->>'pago')::bool then 'ok' else 'FALHOU '||d::text end);
  r := r || format(E'\n8 pedido virou pago: %s', case when (select status from esc_pedidos_craque where email='craque@teste.invalid')='pago' then 'ok' else 'FALHOU' end);

  -- mesmo pagamento de novo: não estende
  j := esc_admin_craque_pagamento('craque@teste.invalid', 'PIX-T1');
  r := r || format(E'\n9 pagamento repetido não duplica: %s', case when (j->>'repetido')::bool and (select valido_ate from esc_assinaturas where email='craque@teste.invalid')=ate1 and (select count(*) from esc_pagamentos where email='craque@teste.invalid')=1 then 'ok' else 'FALHOU '||j::text end);

  -- 2º mês: soma a partir do fim do 1º
  j := esc_admin_craque_pagamento('craque@teste.invalid', 'PIX-T2');
  ate2 := (j->>'valido_ate')::timestamptz;
  r := r || format(E'\n10 renovação soma do fim do período: %s', case when ate2 = ate1 + interval '1 month' then 'ok' else 'FALHOU '||ate1||' '||ate2 end);

  -- cancelou: continua valendo até o fim
  j := esc_admin_craque_cancelar('craque@teste.invalid');
  d := esc_direitos_de('craque@teste.invalid');
  r := r || format(E'\n11 cancelado mas no prazo continua Craque: %s', case when (d->>'craque_ativo')::bool and (d->>'craque_cancelada')::bool and d->>'tier'='ouro' then 'ok' else 'FALHOU '||d::text end);

  -- venceu: perde SÓ o que veio da assinatura
  update esc_assinaturas set valido_ate = now() - interval '1 day' where email='craque@teste.invalid';
  d := esc_direitos_de('craque@teste.invalid');
  r := r || format(E'\n12 vencido sem compra antiga = gratuito de novo: %s', case when not (d->>'craque_ativo')::bool and d->>'tier' is null and not (d->>'salas_pagas')::bool and not (d->>'pago')::bool then 'ok' else 'FALHOU '||d::text end);
  r := r || format(E'\n13 vencido NÃO apaga histórico de pagamento: %s', case when (select count(*) from esc_pagamentos where email='craque@teste.invalid')=2 and exists(select 1 from esc_assinaturas where email='craque@teste.invalid') then 'ok' else 'FALHOU' end);

  -- vencido, mas tinha comprado o Craque antigo (prata, pra sempre): fica com o prata
  insert into user_colors (email, tier, manual) values ('craque@teste.invalid', 'prata', true);
  d := esc_direitos_de('craque@teste.invalid');
  r := r || format(E'\n14 vencido + Craque antigo permanente = mantém o antigo: %s', case when d->>'tier'='prata' and (d->>'manual')::bool and (d->>'salas_pagas')::bool and (d->>'pago')::bool then 'ok' else 'FALHOU '||d::text end);
  -- e assinando de novo sobe pra ouro enquanto vale
  j := esc_admin_craque_pagamento('craque@teste.invalid', 'PIX-T3');
  d := esc_direitos_de('craque@teste.invalid');
  r := r || format(E'\n15 Craque antigo + assinatura = ouro enquanto vale, pagamento recomeça de hoje: %s', case when d->>'tier'='ouro' and (j->>'valido_ate')::timestamptz between now() + interval '27 days' and now() + interval '32 days' then 'ok' else 'FALHOU '||d::text||j::text end);
  r := r || format(E'\n16 assinatura não escreve em user_colors: %s', case when (select tier from user_colors where email='craque@teste.invalid')='prata' then 'ok' else 'FALHOU' end);

  -- batismo antigo (sócio vitalício) continua igual
  insert into user_colors (email, tier, manual) values ('batlenda@teste.invalid', 'ouro', true);
  insert into esc_socios (email, socio_n, desde, valido_ate, origem) values ('batlenda@teste.invalid', 99999, current_date, '2099-12-31', 'batismo');
  d := esc_direitos_de('batlenda@teste.invalid');
  r := r || format(E'\n17 batismo antigo vitalício = tudo: %s', case when (d->>'batismo')::bool and d->>'batismo_plano'='antigo' and d->>'tier'='ouro' and (d->>'socio_ativo')::bool and (d->>'salas_pagas')::bool and not coalesce((d->>'plus')::bool,false) then 'ok' else 'FALHOU '||d::text end);

  -- batismo novo Lenda / Plus
  j := esc_admin_batismo_compra('batplus@teste.invalid', 'lenda', 'PIX-B1', 69.90);
  d := esc_direitos_de('batplus@teste.invalid');
  r := r || format(E'\n18 Batismo Lenda novo = tudo do Craque pra sempre: %s', case when (d->>'batismo')::bool and d->>'batismo_plano'='lenda' and d->>'tier'='ouro' and (d->>'manual')::bool and (d->>'salas_pagas')::bool and (d->>'pago')::bool and not (d->>'plus')::bool then 'ok' else 'FALHOU '||d::text end);
  j := esc_admin_batismo_compra('batplus@teste.invalid', 'plus', 'PIX-B2', 10.09);
  j := esc_admin_batismo_compra('batplus@teste.invalid', 'lenda', 'PIX-B3', 0);
  d := esc_direitos_de('batplus@teste.invalid');
  r := r || format(E'\n19 Plus não rebaixa pra Lenda: %s', case when (d->>'plus')::bool and d->>'batismo_plano'='plus' then 'ok' else 'FALHOU '||d::text end);
  j := esc_admin_batismo_compra('batplus@teste.invalid', 'plus', 'PIX-B2', 10.09);
  r := r || format(E'\n20 pagamento de batismo repetido: %s', case when (j->>'repetido')::bool then 'ok' else 'FALHOU '||j::text end);

  raise exception 'RELATORIO%', r;
end $$;

-- ── bloco "sala": a trava do servidor (docs/sql/sala-exige-plano.sql) criada e testada DENTRO da
-- transação — tudo some no fim. Resultado em 08/10: 8 de 8 ok.
--   sala rápida grátis cria · liga/bafo com dono grátis barrados · sala grátis não vira carreira ·
--   sala normal salva sem problema · liga com dono batismo cria · liga existente segue salvando ·
--   convidado grátis entra na liga paga.
-- (o texto completo do bloco está no histórico da sessão de 08/10; ele repete o sala-exige-plano.sql
--  dentro de um `do $t$ … raise exception 'RELATORIO' end $t$`.)
