-- 🧑‍💼 PEÇAS AVULSAS DO PRESIDENTE pelo Pix do Mercado Pago (19/10, Diego: "ok pode fazer tudo nisso já pelo pix do mercado pago").
-- Preço pelo NÍVEL da peça: Craque 1,99 · Lenda 2,99 · Batismo 3,99 · Fundador 4,99. Produto `peca_presidente`, ref = 'r-<roupa>' ou
-- 'p-<cabelo/barba/acessório>'. A peça só entra em `esc_presidente_pecas` quando o Pix CAI (`esc_mp_entregar`). Grátis: a 1ª
-- compra tem que ser ROUPA (cabelo/barba/acessório sem roupa comprada = sem preço = não gera Pix). Regras puras: presidente-avulsas.ts.
-- ⚠️ No banco foi aplicada em PARTES (presidente_pecas_tabelas/_funcoes/_pix + _preco_so_dono_v2): migration com
-- `drop policy`/`revoke` é cancelada pela ferramenta. Este arquivo é o retrato do que ficou valendo.

create table if not exists public.esc_presidente_catalogo (peca text primary key, nivel int not null check (nivel between 1 and 4));
alter table public.esc_presidente_catalogo enable row level security;
create policy "todos leem catalogo" on public.esc_presidente_catalogo for select using (true);
grant select on public.esc_presidente_catalogo to anon, authenticated;

create table if not exists public.esc_presidente_pecas (
  email text not null, peca text not null, pedido_id uuid, criado_em timestamptz not null default now(),
  primary key (email, peca)
);
alter table public.esc_presidente_pecas enable row level security; -- sem policy: lê pela função abaixo

insert into public.esc_presidente_catalogo (peca, nivel) values
  ('r-mestre-envelopes', 3),
  ('r-dono-lua', 3),
  ('r-lenda-varzea', 3),
  ('r-presidente-cibernetico', 3),
  ('r-cavaleiro-clube', 3),
  ('r-rei-pregao', 3),
  ('r-magico', 3),
  ('r-traje-real', 4),
  ('r-astronauta', 4),
  ('r-executivo-futurista', 2),
  ('r-astro-rock', 2),
  ('r-magnata-retro', 2),
  ('r-presidente-motoqueiro', 2),
  ('r-streetwear', 2),
  ('r-jaqueta-metalica', 2),
  ('r-blazer-classico', 1),
  ('r-polo', 1),
  ('r-terno', 1),
  ('r-social', 1),
  ('r-casual', 1),
  ('r-polo-verde', 1),
  ('r-camiseta-branca', 1),
  ('r-social-azul', 1),
  ('r-agasalho', 1),
  ('r-blazer-vinho', 2),
  ('r-professor-varzea', 1),
  ('r-resenha-domingo', 1),
  ('r-presidente-raiz', 1),
  ('r-dia-jogo', 1),
  ('r-inverno-estadio', 1),
  ('r-gala-dourada', 4),
  ('r-jaqueta-couro', 2),
  ('r-smoking-branco', 2),
  ('p-marcelo-2017-hair', 1),
  ('p-marcelo-2017-beard', 1),
  ('p-puyol-2010-hair', 1),
  ('p-pirlo-2006-hair', 1),
  ('p-ronaldinho-2005-hair', 1),
  ('p-classic-hair', 1),
  ('p-classic-beard', 1),
  ('p-neymar-2011-hair', 1),
  ('p-messi-2023-hair', 1),
  ('p-cristiano-2014-hair', 1),
  ('p-dani-2011-hair', 1),
  ('p-ronaldo-frontal-hair', 1),
  ('p-beckham-curtains-hair', 1),
  ('p-messi-2023-beard', 1),
  ('p-dani-2011-beard', 1),
  ('p-maldini-1994-hair', 1),
  ('p-kaka-2007-hair', 1),
  ('p-maradona-1987-hair', 1),
  ('p-batistuta-1998-hair', 1),
  ('p-didi-1958-hair', 1),
  ('p-vini-2024-hair', 1),
  ('p-valderrama-1988-moustache', 1),
  ('p-valderrama-1988-hair', 1),
  ('p-gullit-1988-hair', 1),
  ('p-gullit-1988-moustache', 1),
  ('p-vozinha-2026-hair', 1),
  ('p-vozinha-2026-beard', 1),
  ('p-silver-studs', 1)
on conflict (peca) do update set nivel = excluded.nivel;

-- as minhas peças compradas (refs)
create or replace function public.esc_minhas_pecas() returns text[] language sql stable security definer set search_path to 'public' as $$
  select coalesce(array_agg(peca order by criado_em), '{}') from public.esc_presidente_pecas where email = lower(coalesce(auth.jwt() ->> 'email', ''))
$$;

-- preço de UMA peça pra ESTA conta (null = não pode comprar: já tem, o plano já cobre, peça inválida ou peça do rosto sem boneco)
create or replace function public.esc_preco_peca(p_email text, p_ref text) returns numeric language plpgsql stable security definer set search_path to 'public' as $$
declare n int; rk int; e text := lower(p_email);
begin
  -- só o servidor (Pix) ou a própria conta perguntam: ninguém espia plano/peças de outro e-mail
  if coalesce(auth.jwt() ->> 'role', '') <> 'service_role' and coalesce(current_setting('role', true), '') <> 'service_role'
     and e <> lower(coalesce(auth.jwt() ->> 'email', '')) then return null; end if;
  rk := coalesce(public.esc_plano_rank(p_email), 0);
  select nivel into n from public.esc_presidente_catalogo where peca = p_ref;
  if n is null then return null; end if;
  if rk >= n then return null; end if;                                                   -- o plano já dá essa peça
  if exists (select 1 from public.esc_presidente_pecas where email = e and peca = p_ref) then return null; end if; -- já comprou
  if p_ref like 'p-%' and rk < 1 and not exists (select 1 from public.esc_presidente_pecas where email = e and peca like 'r-%') then return null; end if; -- grátis: roupa primeiro
  return case n when 1 then 1.99 when 2 then 2.99 when 3 then 3.99 when 4 then 4.99 end;
end $$;

do $$ declare d text; begin
  -- preço: produto peca_presidente
  select pg_get_functiondef('public.esc_mp_preco_ref(text,text,text)'::regprocedure) into d;
  if position('peca_presidente' in d) = 0 then
    d := replace(d, $x$  if p_produto = 'dia_marca' then return 50.00; end if;$x$,
      $x$  if p_produto = 'dia_marca' then return 50.00; end if;
  if p_produto = 'peca_presidente' then return public.esc_preco_peca(p_email, p_ref); end if; -- 🧑‍💼 peça avulsa (19/10)$x$);
    execute d;
  end if;
  -- entrega: guarda a peça na conta
  select pg_get_functiondef('public.esc_mp_entregar(uuid,text)'::regprocedure) into d;
  if position('peca_presidente' in d) = 0 then
    d := replace(d, $x$  elsif p.produto = 'ficha_carreira' then$x$,
      $x$  elsif p.produto = 'peca_presidente' then
    insert into public.esc_presidente_pecas (email, peca, pedido_id) values (lower(p.email), p.ref, p.id) on conflict do nothing;
  elsif p.produto = 'ficha_carreira' then$x$);
    execute d;
  end if;
end $$;
