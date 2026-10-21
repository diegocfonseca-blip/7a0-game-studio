-- 🚫 21/10 (Diego, sala "Sala do Nazistaisaque卍", código 1O8OTJ): nome de sala com preconceito não é criado e o que já
-- está na lista é limpo. Só "nazi/nazista", "crioulo" e a suástica por enquanto (palavrão continua liberado — ordem dele).
-- Retrato do que foi aplicado no banco (migrations `nome_ofensivo_sala` e `avisos_conta`).
create or replace function public.esc_nome_norm(t text) returns text language sql immutable as $$
  select regexp_replace(
    translate(lower(coalesce(t, '')), 'áàâãäéèêëíìîïóòôõöúùûüç01345@$!', 'aaaaaeeeeiiiiooooouuuucoieasasi'),
    '[^a-z卍卐]', '', 'g')
$$;
create or replace function public.esc_nome_ofensivo(t text) returns boolean language sql immutable as $$
  select public.esc_nome_norm(t) ~ '(nazi|crioul|卍|卐)'
$$;
create or replace function public.esc_nome_limpo(t text) returns text language sql immutable as $$
  select coalesce(nullif(btrim(regexp_replace(
    regexp_replace(coalesce(t, ''), '(n[a4@]z[i1!][s5$]?t?[a4@]?s?|cr[i1!][o0]u?l[o0a4]s?|卍|卐)', '', 'gi'),
    '\s+', ' ', 'g')), ''), 'Sala')
$$;
create or replace function public.esc_sala_nome_ofensivo() returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' and (public.esc_nome_ofensivo(new.game_state->>'roomName') or public.esc_nome_ofensivo(new.ls_name)) then
    raise exception 'NOME_PROIBIDO' using hint = 'Nome de sala com preconceito não é permitido.';
  end if;
  if public.esc_nome_ofensivo(new.ls_name) then
    new.ls_name := case when new.id = 'd63fcf89-281a-4bf1-90f7-b2bfd0f87e93' then 'Sala Isaque' else public.esc_nome_limpo(new.ls_name) end;
  end if;
  return new;
end $$;
-- "zz_" = roda DEPOIS do gatilho que copia o nome do game_state pra ls_name (game_rooms_colunas_magras_trg)
create trigger zz_esc_sala_nome_ofensivo before insert or update on public.game_rooms
  for each row execute function public.esc_sala_nome_ofensivo();
create or replace function public.esc_jogador_nome_ofensivo() returns trigger language plpgsql as $$
begin
  if public.esc_nome_ofensivo(new.manager_name) then new.manager_name := public.esc_nome_limpo(new.manager_name); end if;
  return new;
end $$;
create trigger zz_esc_jogador_nome_ofensivo before insert or update of manager_name on public.room_players
  for each row execute function public.esc_jogador_nome_ofensivo();

-- 📣 aviso pra UMA conta (moderação): aparece uma vez; o X marca como visto (não volta nem em outro aparelho)
create table if not exists public.esc_avisos_conta (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  titulo text not null,
  texto text not null,
  criado_em timestamptz not null default now(),
  visto_em timestamptz
);
alter table public.esc_avisos_conta enable row level security;
create policy esc_avisos_conta_ler on public.esc_avisos_conta for select to authenticated using (user_id = auth.uid());
create or replace function public.esc_aviso_visto(p_id bigint) returns void language sql security definer set search_path = public as $$
  update public.esc_avisos_conta set visto_em = now() where id = p_id and user_id = auth.uid() and visto_em is null
$$;
grant execute on function public.esc_aviso_visto(bigint) to authenticated;
-- (a linha do aviso da sala 1O8OTJ foi inserida direto no banco)

-- ─── 21/10 (2ª parte): palavras do nazismo + vale no NOME DO PERFIL/TIME (display_name) ───
-- (migrations `nome_ofensivo_perfil` e `nome_ofensivo_internazionale`; a régua da tela é `src/escalacao/nome-ofensivo.ts`)
create or replace function public.esc_nome_norm(t text) returns text language sql immutable as $$
  select regexp_replace(
    translate(lower(coalesce(t, '')), 'áàâãäéèêëíìîïóòôõöúùûüç01345@$!', 'aaaaaeeeeiiiiooooouuuucoieasasi'),
    '[^a-z卍卐࿕࿖࿗࿘]', '', 'g')
$$;
-- "nazi" só solto (Davi nazi) ou com o "s" (nazista/nazismo); "Internazionale" (Inter de Milão) não conta
create or replace function public.esc_nome_ofensivo(t text) returns boolean language sql immutable as $$
  select replace(public.esc_nome_norm(t), 'internazional', '') ~ '(nazis|crioul|hitler|suastic|swastik|fuhrer|fuehrer|siegheil|卍|卐|࿕|࿖|࿗|࿘)'
      or translate(lower(coalesce(t, '')), 'áàâãäéèêëíìîïóòôõöúùûüç01345@$!', 'aaaaaeeeeiiiiooooouuuucoieasasi') ~ '(^|[^a-z])nazi([^a-z]|$)'
$$;
create or replace function public.esc_nome_limpo(t text) returns text language sql immutable as $$
  select coalesce(nullif(btrim(regexp_replace(
    regexp_replace(coalesce(t, ''), '(n[a4@]z[i1!][s5$]?[mt]?[a4@o0]?s?|cr[i1!][o0]u?l[o0a4]s?|h[i1!]tl[e3]r|su[aá]st[i1]c[a4]s?|sw[a4]st[i1]k[a4]s?|f[uü]e?hrer|s[i1]eg\s*h[e3][i1]l|卍|卐|࿕|࿖|࿗|࿘)', '', 'gi'),
    '\s+', ' ', 'g')), ''), 'Sala')
$$;
create or replace function public.esc_perfil_nome_ofensivo() returns trigger language plpgsql security definer set search_path = public as $$
declare dn text := new.raw_user_meta_data->>'display_name';
begin
  if dn is not null and public.esc_nome_ofensivo(dn) then
    dn := public.esc_nome_limpo(dn);
    if dn = 'Sala' or public.esc_nome_ofensivo(dn) then dn := 'Técnico'; end if;
    new.raw_user_meta_data := jsonb_set(coalesce(new.raw_user_meta_data, '{}'::jsonb), '{display_name}', to_jsonb(dn));
  end if;
  return new;
end $$;
create trigger zz_esc_perfil_nome_ofensivo before insert or update of raw_user_meta_data on auth.users
  for each row execute function public.esc_perfil_nome_ofensivo();
-- o perfil da conta da sala 1O8OTJ virou "N Isaque" (pedido do Diego)
