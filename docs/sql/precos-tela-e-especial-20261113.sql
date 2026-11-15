-- 💳 13/11 — "arrume toda a questão do atual dos preços" (Diego)
-- 1) PREÇO ESPECIAL por conta: o Diego libera um preço só pra uma pessoa (1º caso: EhuLaion FC viu "+ R$ 55" no Batismo por
--    erro da tela e o Diego mandou honrar os 55; o Fundador continua no preço normal). Vale uma vez: depois que a pessoa tem o
--    plano, `esc_mp_preco` já devolve null (alvo <= atual) e a linha deixa de valer sozinha.
-- 2) `esc_mp_meus_precos()`: a TELA pergunta ao banco quanto custa cada plano PRA ESTA CONTA (o mesmo `esc_mp_preco` do Pix),
--    pra nunca mais mostrar um preço e cobrar outro (`src/escalacao/precos-servidor.ts`).
-- ⚠️ Mexe em função: o PostgREST recarrega o esquema (salas podem engasgar 1–3 min). Rodar com o jogo vazio.
create table if not exists public.esc_preco_especial (
  email text not null,
  produto text not null,
  valor numeric not null,
  motivo text,
  criado_em timestamptz not null default now(),
  primary key (email, produto)
);
alter table public.esc_preco_especial enable row level security;

create or replace function public.esc_mp_preco(p_email text, p_produto text)
 returns numeric language plpgsql stable security definer set search_path to 'public'
as $function$
declare
  precos numeric[] := array[29.90, 59.90, 79.90, 99.90];
  alvo int; atual int; esp numeric;
begin
  if p_produto = 'salas_extras' then return 4.90; end if;
  if p_produto = 'ficha_carreira' then return 9.99; end if;
  if p_produto = 'teste' then
    return case when lower(p_email) = 'diego.c.fonseca@gmail.com' then 1.00 else null end;
  end if;
  alvo := case p_produto when 'craque' then 1 when 'lenda' then 2 when 'batismo' then 3 when 'fundador' then 4 else null end;
  if alvo is null then return null; end if;
  if alvo = 1 then return null; end if;
  atual := coalesce(public.esc_plano_rank_fixo(p_email), 0);
  if alvo <= atual then return null; end if;
  select e.valor into esp from public.esc_preco_especial e where e.email = lower(p_email) and e.produto = p_produto;
  if esp is not null then return esp; end if;
  if atual = 0 then return precos[alvo]; end if;
  if atual = 3 and alvo = 4 then return 29.90; end if;
  if atual = 2 and not exists (select 1 from esc_mp_pedidos m where lower(m.email) = lower(p_email) and m.produto = 'lenda' and m.pago_em is not null and m.valor >= 59.90) then
    return precos[alvo] - 44.90 + 5;
  end if;
  return precos[alvo] - precos[atual] + 5;
end $function$;

create or replace function public.esc_mp_meus_precos()
 returns jsonb language plpgsql stable security definer set search_path to 'public'
as $function$
declare e text := lower(coalesce(auth.jwt() ->> 'email', ''));
begin
  if e = '' then return '{}'::jsonb; end if;
  return jsonb_build_object('lenda', public.esc_mp_preco(e, 'lenda'), 'batismo', public.esc_mp_preco(e, 'batismo'), 'fundador', public.esc_mp_preco(e, 'fundador'));
end $function$;
grant execute on function public.esc_mp_meus_precos() to authenticated;

insert into public.esc_preco_especial (email, produto, valor, motivo)
values ('sergioricardocf16@gmail.com', 'batismo', 55.00, 'EhuLaion FC: a tela mostrou + R$ 55 (erro de 13/11); o Diego mandou honrar')
on conflict (email, produto) do update set valor = excluded.valor, motivo = excluded.motivo;
