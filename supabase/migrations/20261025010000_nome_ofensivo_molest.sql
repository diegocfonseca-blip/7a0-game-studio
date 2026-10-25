-- 🚫 25/10 (Diego, sala "Sala do Molestador", código 0I5GVI): "molest…" (molestador, molestar…) barrado igual a "estupr…" —
-- em nome de sala, time e perfil, e o nome inteiro some (vira "Sala"/"Técnico"). A sala 0I5GVI virou "Sala do M." e o perfil
-- do dono virou "M." (pedido dele). A tela tem a mesma régua (nome-ofensivo.ts). Retrato do que foi aplicado no banco.
create or replace function public.esc_nome_ofensivo(t text) returns boolean language sql immutable as $$
  select replace(public.esc_nome_norm(t), 'internazional', '') ~ '(nazis|crioul|hitler|suastic|swastik|fuhrer|fuehrer|siegheil|estupr|molest|卍|卐|࿕|࿖|࿗|࿘)'
      or translate(lower(coalesce(t, '')), 'áàâãäéèêëíìîïóòôõöúùûüç01345@$!', 'aaaaaeeeeiiiiooooouuuucoieasasi') ~ '(^|[^a-z])nazi([^a-z]|$)'
$$;
create or replace function public.esc_nome_limpo(t text) returns text language sql immutable as $$
  select case when public.esc_nome_norm(t) ~ '(estupr|molest)' then 'Sala' else coalesce(nullif(btrim(regexp_replace(
    regexp_replace(coalesce(t, ''), '(n[a4@]z[i1!][s5$]?[mt]?[a4@o0]?s?|cr[i1!][o0]u?l[o0a4]s?|h[i1!]tl[e3]r|su[aá]st[i1]c[a4]s?|sw[a4]st[i1]k[a4]s?|f[uü]e?hrer|s[i1]eg\s*h[e3][i1]l|卍|卐|࿕|࿖|࿗|࿘)', '', 'gi'),
    '\s+', ' ', 'g')), ''), 'Sala') end
$$;
create or replace function public.esc_sala_nome_ofensivo() returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' and (public.esc_nome_ofensivo(new.game_state->>'roomName') or public.esc_nome_ofensivo(new.ls_name)) then
    raise exception 'NOME_PROIBIDO' using hint = 'Nome de sala com preconceito não é permitido.';
  end if;
  if public.esc_nome_ofensivo(new.ls_name) then
    new.ls_name := case when new.id = 'd63fcf89-281a-4bf1-90f7-b2bfd0f87e93' then 'Sala Isaque'
                        when new.id = '986f3909-3e59-4905-a350-fbe0f170f209' then 'Sala do M.'
                        else public.esc_nome_limpo(new.ls_name) end;
  end if;
  return new;
end $$;
-- (dados, direto no banco: game_rooms 0I5GVI ls_name = 'Sala do M.'; display_name do dono = 'M.'; room_players 'Molestador' → 'M.')
