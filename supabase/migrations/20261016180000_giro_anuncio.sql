-- 📣 ANÚNCIO NO GIRO, 1 DIA (16/10, aplicado no banco pelo MCP; este arquivo é a memória). R$ 25 na Loja (produto MP
-- 'giro_dia', preço em esc_mp_preco_ref). O Diego marca no #admin a data e o texto; naquele dia (Brasília) o texto passa no
-- giro da rodada de todo mundo (`useAnunciosGiro` em patrocinio.ts).
create table if not exists public.esc_giro_anuncio (
  dia date primary key,
  texto text not null check (char_length(texto) between 4 and 120),
  criado_em timestamptz not null default now()
);
alter table public.esc_giro_anuncio enable row level security;
create policy "todos leem" on public.esc_giro_anuncio for select to anon, authenticated using (true);
create or replace function public.esc_admin_giro_anuncio(p_dia date, p_texto text)
returns text language plpgsql security definer set search_path = public as $$
begin
  if coalesce(auth.jwt() ->> 'email', '') <> 'diego.c.fonseca@gmail.com' then raise exception 'not authorized'; end if;
  if coalesce(trim(p_texto), '') = '' then delete from public.esc_giro_anuncio where dia = p_dia; return 'apagado'; end if;
  insert into public.esc_giro_anuncio (dia, texto) values (p_dia, trim(p_texto))
    on conflict (dia) do update set texto = excluded.texto;
  return 'ok';
end $$;
revoke all on function public.esc_admin_giro_anuncio(date, text) from public, anon;
grant execute on function public.esc_admin_giro_anuncio(date, text) to authenticated;
-- esc_mp_preco_ref ganhou: if p_produto = 'giro_dia' then return 25.00; end if;
