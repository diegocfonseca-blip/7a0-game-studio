-- 👁️ MODO ESPECTADOR "FANTASMA" (28/10, Diego: "somente os usuários que eu permitir poderiam entrar e assistir dentro das
-- salas… ele entra mas não joga, pode falar no chat"). Mockup aprovado: scripts/mockups/espectador.png.
-- A lista de quem pode assistir é por E-MAIL e só o Diego mexe. Tirar alguém = `ativo = false` (a linha fica, é o histórico).
-- O espectador NUNCA ganha linha em room_players: o jogo dele só lê.
create table if not exists public.esc_espectadores (
  email text primary key,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
alter table public.esc_espectadores enable row level security;
-- sem policy de leitura/escrita: só pelas funções abaixo

-- posso assistir? (a conta do Diego sempre pode)
create or replace function public.esc_sou_espectador()
returns boolean
language sql
stable security definer
set search_path to 'public'
as $function$
  select coalesce(auth.jwt()->>'email','') = 'diego.c.fonseca@gmail.com'
      or exists (select 1 from esc_espectadores e where e.email = lower(coalesce(auth.jwt()->>'email','')) and e.ativo)
$function$;
grant execute on function public.esc_sou_espectador() to authenticated;

create or replace function public.esc_admin_espectadores()
returns table(email text, ativo boolean, criado_em timestamptz)
language plpgsql
stable security definer
set search_path to 'public'
as $function$
begin
  if coalesce(auth.jwt()->>'email','') <> 'diego.c.fonseca@gmail.com' then raise exception 'not authorized'; end if;
  return query select e.email, e.ativo, e.criado_em from esc_espectadores e where e.ativo order by e.criado_em desc;
end $function$;
grant execute on function public.esc_admin_espectadores() to authenticated;

create or replace function public.esc_admin_espectador_set(p_email text, p_ativo boolean)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare em text := lower(btrim(coalesce(p_email,'')));
begin
  if coalesce(auth.jwt()->>'email','') <> 'diego.c.fonseca@gmail.com' then raise exception 'not authorized'; end if;
  if em = '' then raise exception 'SEM_EMAIL'; end if;
  if p_ativo and not exists (select 1 from auth.users u where lower(u.email) = em) then raise exception 'SEM_CONTA'; end if;
  insert into esc_espectadores(email, ativo) values (em, p_ativo)
    on conflict (email) do update set ativo = p_ativo, atualizado_em = now();
end $function$;
grant execute on function public.esc_admin_espectador_set(text, boolean) to authenticated;
