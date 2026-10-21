-- 🚫 21/10 (Diego, sala do mengao caxiense: um time chamado "ESTUPRADOR DE JUDEU"): a palavra "estupr…" (estuprador, estuprado,
-- estupra, estupro…) também é barrada em nome de sala, de time e de perfil. "Judeu" sozinho NÃO é barrado (ordem dele:
-- "às vezes vai ter judeu que vai querer falar alguma coisa"). Nome com essa palavra NÃO é aproveitado (tirar só a palavra deixava
-- "DE JUDEU", "maraiza gord"…): vira "Técnico" (perfil/time na sala) ou "Sala" (nome da sala). A tela tem a mesma régua (nome-ofensivo.ts).
create or replace function public.esc_nome_ofensivo(t text) returns boolean language sql immutable as $$
  select replace(public.esc_nome_norm(t), 'internazional', '') ~ '(nazis|crioul|hitler|suastic|swastik|fuhrer|fuehrer|siegheil|estupr|卍|卐|࿕|࿖|࿗|࿘)'
      or translate(lower(coalesce(t, '')), 'áàâãäéèêëíìîïóòôõöúùûüç01345@$!', 'aaaaaeeeeiiiiooooouuuucoieasasi') ~ '(^|[^a-z])nazi([^a-z]|$)'
$$;
create or replace function public.esc_nome_limpo(t text) returns text language sql immutable as $$
  select case when public.esc_nome_norm(t) ~ 'estupr' then 'Sala' else coalesce(nullif(btrim(regexp_replace(
    regexp_replace(coalesce(t, ''), '(n[a4@]z[i1!][s5$]?[mt]?[a4@o0]?s?|cr[i1!][o0]u?l[o0a4]s?|h[i1!]tl[e3]r|su[aá]st[i1]c[a4]s?|sw[a4]st[i1]k[a4]s?|f[uü]e?hrer|s[i1]eg\s*h[e3][i1]l|卍|卐|࿕|࿖|࿗|࿘)', '', 'gi'),
    '\s+', ' ', 'g')), ''), 'Sala') end
$$;
create or replace function public.esc_jogador_nome_ofensivo() returns trigger language plpgsql as $$
begin
  if public.esc_nome_ofensivo(new.manager_name) then
    new.manager_name := public.esc_nome_limpo(new.manager_name);
    if new.manager_name = 'Sala' or public.esc_nome_ofensivo(new.manager_name) then new.manager_name := 'Técnico'; end if;
  end if;
  return new;
end $$;
