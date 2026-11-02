-- 🎨 02/11 (Diego, mockup scripts/mockups/cor-adicional.png, "Sim"): COR ADICIONAL BRILHANTE, R$ 14,90 cada, pra sempre.
-- Só compra quem JÁ TEM PLANO (esc_plano_rank >= 1). Compra quantas quiser (cada cor 1x) e escolhe qual usar.
-- À venda: roxo · verde · rosa · azul · vermelho · laranja · turquesa. Dourado/prata/bege são do PLANO e o preto é reservado (futuro
-- Fundador) — nenhum deles entra aqui. A cor é só visual: o PLANO (tier, Manual, salas…) não muda nada.
create table if not exists public.esc_cores_conta (
  email text not null,
  cor text not null check (cor in ('roxo','verde','rosa','azul','vermelho','laranja','turquesa')),
  ativa boolean not null default false,
  pedido_id uuid,
  criado_em timestamptz not null default now(),
  primary key (email, cor)
);
alter table public.esc_cores_conta enable row level security; -- sem política: só as funções leem/escrevem

-- produto novo nos dois filtros (lista = a de 26/10 + 'cor_extra')
alter table public.esc_mp_pedidos drop constraint if exists esc_mp_pedidos_produto_check;
alter table public.esc_mp_pedidos add constraint esc_mp_pedidos_produto_check check (produto = any (array[
  'craque','lenda','batismo','fundador','salas_extras','teste','moedas_10','moedas_50','moedas_100','moedas_500','moedas_1000',
  'canto','presente','dia_marca','giro_dia','ficha_carreira','tema_coracao','tema_clube','giro_hora','recado_hora','recado_dia',
  'peca_presidente','escudo_cla','cla_extra','cla_criar','manual_24h','cor_extra'])) not valid;
alter table public.esc_pagamentos drop constraint if exists esc_pagamentos_produto_check;
alter table public.esc_pagamentos add constraint esc_pagamentos_produto_check check (produto = any (array[
  'craque_mensal','batismo_lenda','batismo_plus','craque','lenda','salas_extras','teste','moedas_10','moedas_50','moedas_100',
  'moedas_500','moedas_1000','canto','presente','dia_marca','giro_dia','ficha_carreira','tema_coracao','tema_clube','giro_hora',
  'recado_hora','recado_dia','peca_presidente','escudo_cla','cla_extra','cla_criar','manual_24h','cor_extra'])) not valid;

-- 💰 preço: 14,90 se tem plano, a cor é válida e ainda não é dela (senão nulo = sem Pix)
do $m$
declare d text;
begin
  d := pg_get_functiondef('public.esc_mp_preco_ref(text,text,text)'::regprocedure);
  if position('cor_extra' in d) = 0 then
    d := replace(d, $x$  if p_produto = 'manual_24h' then$x$,
      $x$  if p_produto = 'cor_extra' then
    if coalesce(p_ref, '') not in ('roxo','verde','rosa','azul','vermelho','laranja','turquesa') then return null; end if;
    if coalesce(public.esc_plano_rank(lower(p_email)), 0) < 1 then return null; end if;
    if exists (select 1 from public.esc_cores_conta c where c.email = lower(p_email) and c.cor = p_ref) then return null; end if;
    return 14.90;
  end if;
  if p_produto = 'manual_24h' then$x$);
    execute d;
  end if;
end $m$;

-- 📦 entrega: a cor vira dela e já fica EM USO
do $m$
declare d text;
begin
  d := pg_get_functiondef('public.esc_mp_entregar(uuid,text)'::regprocedure);
  if position('cor_extra' in d) = 0 then
    d := replace(d, $x$  elsif p.produto = 'ficha_carreira' then$x$,
      $x$  elsif p.produto = 'cor_extra' then
    if p.ref in ('roxo','verde','rosa','azul','vermelho','laranja','turquesa') then
      update public.esc_cores_conta set ativa = false where email = lower(p.email);
      insert into public.esc_cores_conta (email, cor, ativa, pedido_id) values (lower(p.email), p.ref, true, p.id)
        on conflict (email, cor) do update set ativa = true;
    end if;
  elsif p.produto = 'ficha_carreira' then$x$);
    execute d;
  end if;
end $m$;

-- 👀 as minhas cores (compradas) + qual está em uso
create or replace function public.esc_minhas_cores() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'cores', coalesce((select jsonb_agg(c.cor order by c.criado_em) from esc_cores_conta c where c.email = lower(u.email)), '[]'::jsonb),
    'ativa', (select c.cor from esc_cores_conta c where c.email = lower(u.email) and c.ativa limit 1))
  from auth.users u where u.id = auth.uid()
$$;

-- 🎯 escolher qual usar (null = a cor do plano). Só cor que é dela.
create or replace function public.esc_cor_usar(p_cor text) returns boolean
language plpgsql security definer set search_path = public as $$
declare em text;
begin
  select lower(email) into em from auth.users where id = auth.uid();
  if em is null then return false; end if;
  if p_cor is not null and not exists (select 1 from esc_cores_conta where email = em and cor = p_cor) then return false; end if;
  update esc_cores_conta set ativa = coalesce(cor = p_cor, false) where email = em;
  return true;
end $$;
grant execute on function public.esc_minhas_cores() to authenticated;
grant execute on function public.esc_cor_usar(text) to authenticated;

-- 👤 o perfil público manda a cor EM USO junto do tier (o card do perfil pinta com ela; só vale com plano, quem decide é a tela)
do $m$
declare d text;
begin
  d := pg_get_functiondef('public.esc_perfil_publico(uuid)'::regprocedure);
  if position('esc_cores_conta' in d) = 0 then
    d := replace(d, $x$    'tier', (select tier from user_colors where lower(email) = em limit 1),$x$,
      $x$    'tier', (select tier from user_colors where lower(email) = em limit 1),
    'cor', (select c.cor from esc_cores_conta c where c.email = em and c.ativa limit 1),$x$);
    execute d;
  end if;
end $m$;
