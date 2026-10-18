-- ⚡ DIA DA MARCA (16/10, aplicado no banco pelo MCP). O Diego marca no #admin a data e a marca; naquele dia (horário de
-- Brasília) a Copa dos 8 sai "apresentada por…" pra todo mundo (`usePatrocinio('copa8')` em patrocinio.ts).
create table if not exists public.esc_dia_marca (
  dia date primary key,
  nome text not null check (char_length(nome) between 2 and 40),
  emoji text not null default '⭐' check (char_length(emoji) <= 8),
  criado_em timestamptz not null default now()
);
alter table public.esc_dia_marca enable row level security;
create policy "todos leem" on public.esc_dia_marca for select to anon, authenticated using (true);
create or replace function public.esc_admin_dia_marca(p_dia date, p_nome text, p_emoji text)
returns text language plpgsql security definer set search_path = public as $$
begin
  if coalesce(auth.jwt() ->> 'email', '') <> 'diego.c.fonseca@gmail.com' then raise exception 'not authorized'; end if;
  if coalesce(trim(p_nome), '') = '' then delete from public.esc_dia_marca where dia = p_dia; return 'apagado'; end if;
  insert into public.esc_dia_marca (dia, nome, emoji) values (p_dia, trim(p_nome), coalesce(nullif(trim(p_emoji), ''), '⭐'))
    on conflict (dia) do update set nome = excluded.nome, emoji = excluded.emoji;
  return 'ok';
end $$;
revoke all on function public.esc_admin_dia_marca(date, text, text) from public, anon;
grant execute on function public.esc_admin_dia_marca(date, text, text) to authenticated;
