-- 17/10 (Diego): Lenda 49,90 → 44,90 · Batismo → Fundador fixo em 29,90 · 💾 ficha extra de carreira na Loja (R$ 9,99).
-- Espelho de `planos-regras.ts` (PRECOS_UNICO, PRECOS_DUPLO, SUBIDA_BATISMO_FUNDADOR) e `FICHA_EXTRA_PRECO`: mudou lá, muda aqui.

-- 💾 saldo de fichas extras de carreira, por e-mail (cada compra = +1, pra sempre)
create table if not exists public.esc_fichas_extras (
  email text primary key,
  qtd integer not null default 0,
  atualizado_em timestamptz not null default now()
);
alter table public.esc_fichas_extras enable row level security;

create or replace function public.esc_minhas_fichas_extras()
returns integer language sql stable security definer set search_path to 'public' as $$
  select coalesce((select qtd from esc_fichas_extras where email = lower(coalesce(auth.jwt()->>'email',''))), 0)
$$;
grant execute on function public.esc_minhas_fichas_extras() to authenticated;

-- a trava de produtos do pedido (giro_dia estava faltando desde 16/10)
alter table public.esc_mp_pedidos drop constraint if exists esc_mp_pedidos_produto_check;
alter table public.esc_mp_pedidos add constraint esc_mp_pedidos_produto_check check (produto = any (array[
  'craque','lenda','batismo','fundador','salas_extras','teste','moedas_10','moedas_50','moedas_100','moedas_500','moedas_1000',
  'canto','presente','dia_marca','giro_dia','ficha_carreira'])) not valid;

create or replace function public.esc_mp_preco(p_email text, p_produto text)
 returns numeric language plpgsql stable security definer set search_path to 'public' as $function$
declare
  precos numeric[] := array[29.90, 44.90, 79.90, 99.90];
  alvo int; atual int;
begin
  if p_produto = 'salas_extras' then return 4.90; end if;
  if p_produto = 'ficha_carreira' then return 9.99; end if;
  if p_produto = 'teste' then
    return case when lower(p_email) = 'diego.c.fonseca@gmail.com' then 1.00 else null end;
  end if;
  alvo := case p_produto when 'craque' then 1 when 'lenda' then 2 when 'batismo' then 3 when 'fundador' then 4 else null end;
  if alvo is null then return null; end if;
  atual := coalesce(public.esc_plano_rank(p_email), 0);
  if alvo <= atual then return null; end if;
  if atual = 0 then return precos[alvo]; end if;
  if atual = 3 and alvo = 4 then return 29.90; end if; -- Batismo → Fundador, fixo (17/10)
  return precos[alvo] - precos[atual] + 5;
end $function$;

create or replace function public.esc_mp_preco_ref(p_email text, p_produto text, p_ref text)
 returns numeric language plpgsql stable security definer set search_path to 'public' as $function$
declare pl text; rk int; alvo int; duplo boolean := coalesce(p_ref, '') ~ '^d-\d{1,12}$'; rid text;
begin
  if p_produto in ('moedas_10','moedas_50','moedas_100','moedas_500','moedas_1000') then return substring(p_produto from 8)::numeric; end if;
  if p_produto = 'dia_marca' then return 50.00; end if;
  if p_produto = 'giro_dia' then return 25.00; end if;
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
      if coalesce(public.esc_plano_rank(p_email), 0) >= alvo then return null; end if;
      return case pl when 'craque' then 53.90 when 'lenda' then 80.90 when 'batismo' then 143.90 when 'fundador' then 179.90 end;
    end if;
    return case pl when 'craque' then 29.90 when 'lenda' then 44.90 when 'batismo' then 79.90 when 'fundador' then 99.90 else null end;
  end if;
  return public.esc_mp_preco(p_email, p_produto);
end $function$;

-- 💾 a entrega: +1 ficha pra quem pagou (enxerto na esc_mp_entregar, sem reescrever o resto)
do $do$
declare d text; n text;
begin
  d := pg_get_functiondef('public.esc_mp_entregar(uuid,text)'::regprocedure);
  if position('ficha_carreira' in d) > 0 then return; end if;
  n := replace(d, $x$  elsif p.produto like 'moedas\_%' then$x$,
$x$  elsif p.produto = 'ficha_carreira' then
    insert into public.esc_fichas_extras (email, qtd, atualizado_em) values (p.email, 1, now())
      on conflict (email) do update set qtd = esc_fichas_extras.qtd + 1, atualizado_em = now();
  elsif p.produto like 'moedas\_%' then$x$);
  if n = d then raise exception 'esc_mp_entregar: ponto de enxerto não achado'; end if;
  execute n;
end $do$;
