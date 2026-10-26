-- 💳 LOJA NOVA · ETAPA 2 (26/10, mockup aprovado `scripts/mockups/loja-craque-mensal-lenda-vez.png`):
--  · 👑 Lenda uma vez: 44,90 → 59,90 (presente 59,90 · dupla 2×59,90 −10% = 107,90)
--  · ⭐ Craque de 29,90 SAI da venda (o Craque agora é mensal, pela Vendria). Quem já tem o Craque de uma vez continua pagando
--    só a diferença pra subir (o 29,90 segue na conta da diferença).
--  · ⭐📅 quem ASSINA o mensal não é "dono" de plano: no Pix ele paga o preço cheio (o rank pago-pra-sempre ignora o mensal).
--    `esc_plano_rank` (clã, presidente) continua vendo o mensal como Craque — é o que ele dá enquanto paga.
create or replace function public.esc_plano_rank_fixo(p_email text) returns integer language sql stable security definer set search_path to 'public' as $$
  select case
    when d->>'batismo_plano' = 'plus' then 4
    when d->>'batismo_plano' is not null then 3
    when (case when d->>'mensal_plano' is null then d->>'tier'
               when coalesce((d->>'craque_ativo')::boolean, false) or coalesce((d->>'batismo')::boolean, false) then 'ouro'
               else d->>'tier_legado' end) = 'ouro' then 2
    when (case when d->>'mensal_plano' is null then d->>'tier' else d->>'tier_legado' end) = 'prata' then 1
    else 0 end
  from (select public.esc_direitos_de(p_email) as d) x
$$;

create or replace function public.esc_mp_preco(p_email text, p_produto text) returns numeric language plpgsql stable security definer set search_path to 'public' as $$
declare
  precos numeric[] := array[29.90, 59.90, 79.90, 99.90];
  alvo int; atual int;
begin
  if p_produto = 'salas_extras' then return 4.90; end if;
  if p_produto = 'ficha_carreira' then return 9.99; end if;
  if p_produto = 'teste' then
    return case when lower(p_email) = 'diego.c.fonseca@gmail.com' then 1.00 else null end;
  end if;
  alvo := case p_produto when 'craque' then 1 when 'lenda' then 2 when 'batismo' then 3 when 'fundador' then 4 else null end;
  if alvo is null then return null; end if;
  if alvo = 1 then return null; end if; -- ⭐ o Craque de uma vez não é mais vendido (26/10)
  atual := coalesce(public.esc_plano_rank_fixo(p_email), 0);
  if alvo <= atual then return null; end if;
  if atual = 0 then return precos[alvo]; end if;
  if atual = 3 and alvo = 4 then return 29.90; end if;
  -- 👑 quem comprou o Lenda a 44,90 (antes de 26/10) sobe pela diferença de 44,90, como sempre foi; só quem pagou 59,90 sobe pela nova
  if atual = 2 and not exists (select 1 from esc_mp_pedidos m where lower(m.email) = lower(p_email) and m.produto = 'lenda' and m.pago_em is not null and m.valor >= 59.90) then
    return precos[alvo] - 44.90 + 5;
  end if;
  return precos[alvo] - precos[atual] + 5;
end $$;

-- presente de Lenda 59,90 · dupla de Lenda 107,90 · a checagem da dupla usa o rank pago-pra-sempre
do $do$
declare d text;
begin
  d := pg_get_functiondef('public.esc_mp_preco_ref(text,text,text)'::regprocedure);
  d := replace(d, $q$when 'lenda' then 80.90$q$, $q$when 'lenda' then 107.90$q$);
  d := replace(d, $q$when 'lenda' then 44.90$q$, $q$when 'lenda' then 59.90$q$);
  d := replace(d, $q$if coalesce(public.esc_plano_rank(p_email), 0) >= alvo then return null; end if;$q$,
                  $q$if coalesce(public.esc_plano_rank_fixo(p_email), 0) >= alvo then return null; end if;$q$);
  execute d;
end $do$;
