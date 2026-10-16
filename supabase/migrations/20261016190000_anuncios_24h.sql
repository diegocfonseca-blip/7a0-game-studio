-- ⏱️ ANÚNCIOS PAGOS DURAM 24 H DESDE QUE ENTRAM NO AR (16/10, aplicado no banco pelo MCP; este arquivo é a memória).
-- Diego: "todo anúncio dura 24h desde que colocado no ar… somente anúncios manuais como da Vadico ficam direto até eu alterar".
-- Substitui esc_dia_marca / esc_giro_anuncio (ficaram vazias e sem uso). tipo 'marca' = Dia da marca (Copa dos 8),
-- 'giro' = Anúncio do dia (letreiro). Leitura no cliente: `carregaAvulsos` em patrocinio.ts; #admin: `AnuncioAdmin`.
create table if not exists public.esc_anuncios (
  id bigserial primary key,
  tipo text not null check (tipo in ('giro','marca')),
  texto text not null check (char_length(texto) between 2 and 120),
  emoji text not null default '⭐' check (char_length(emoji) <= 8),
  inicio timestamptz not null default now(),
  fim timestamptz not null
);
alter table public.esc_anuncios enable row level security;
create policy "todos leem" on public.esc_anuncios for select to anon, authenticated using (true);
create or replace function public.esc_admin_anuncio(p_tipo text, p_inicio timestamptz, p_texto text, p_emoji text)
returns text language plpgsql security definer set search_path = public as $$
declare i timestamptz := coalesce(p_inicio, now());
begin
  if coalesce(auth.jwt() ->> 'email', '') <> 'diego.c.fonseca@gmail.com' then raise exception 'not authorized'; end if;
  insert into public.esc_anuncios (tipo, texto, emoji, inicio, fim)
    values (p_tipo, trim(p_texto), coalesce(nullif(trim(p_emoji), ''), '⭐'), i, i + interval '24 hours');
  return 'ok';
end $$;
create function public.esc_admin_anuncio_tirar(p_id bigint) returns text language sql security definer set search_path = public as $$
  delete from public.esc_anuncios where id = p_id and coalesce(auth.jwt() ->> 'email', '') = 'diego.c.fonseca@gmail.com' returning 'apagado'
$$;
revoke all on function public.esc_admin_anuncio(text, timestamptz, text, text) from public, anon;
revoke all on function public.esc_admin_anuncio_tirar(bigint) from public, anon;
grant execute on function public.esc_admin_anuncio(text, timestamptz, text, text) to authenticated;
grant execute on function public.esc_admin_anuncio_tirar(bigint) to authenticated;
-- 📣 16/10: o comprador escreve o próprio anúncio depois do Pix (máx 82 letras) — só com pedido 'giro_dia' pago/liberado.
alter table public.esc_anuncios add column if not exists pedido_id uuid unique;
-- esc_mp_anuncio_giro(p_id uuid, p_texto text) → 'ok' | 'curto' | 'longo' | 'sem_pedido' | 'ja_tem'  (insere 24 h a partir de now())
-- esc_mp_anuncio_pendente() → ids dos pedidos giro_dia pagos do próprio usuário que ainda não viraram anúncio
-- (corpo completo: pg_get_functiondef no banco)
