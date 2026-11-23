-- 🚫 23/11 (Diego: "remova palavras de pedófilo pedofelo pedofilia", conta "Titio Pedofelo" → "Titio P"):
-- mesma régua do estupr/molest — o nome inteiro sai ("Sala" na sala; "Técnico" no perfil, pelo gatilho do perfil).
-- `pedof[ie]l` cobre pedófilo/pedofilia/pedofelo e NÃO pega "Torpedo FC" nem "TRIPÉDOFLU FC" (tri, pé do Flu).
-- As 7 contas que já tinham a palavra foram limpas direto no banco em 23/11 (Titio P + 6 viraram "Técnico").
create or replace function public.esc_nome_ofensivo(t text) returns boolean language sql immutable as $$
  select replace(public.esc_nome_norm(t), 'internazional', '') ~ '(nazis|crioul|h+[iy1]+t+[ae]?l+[e3]+r|suastic|swastik|fuhrer|fuehrer|siegheil|estupr|molest|pedof[ie]l|卍|卐|࿕|࿖|࿗|࿘)'
      or translate(lower(coalesce(t, '')), 'áàâãäéèêëíìîïóòôõöúùûüç01345@$!', 'aaaaaeeeeiiiiooooouuuucoieasasi') ~ '(^|[^a-z])nazi([^a-z]|$)'
$$;
create or replace function public.esc_nome_limpo(t text) returns text language sql immutable as $$
  select case when public.esc_nome_norm(t) ~ '(estupr|molest|pedof[ie]l)' then 'Sala' else coalesce(nullif(btrim(regexp_replace(
    regexp_replace(coalesce(t, ''), '(n[a4@]z[i1!][s5$]?[mt]?[a4@o0]?s?|cr[i1!][o0]u?l[o0a4]s?|h[i1!]tl[e3]r|su[aá]st[i1]c[a4]s?|sw[a4]st[i1]k[a4]s?|f[uü]e?hrer|s[i1]eg\s*h[e3][i1]l|卍|卐|࿕|࿖|࿗|࿘)', '', 'gi'),
    '\s+', ' ', 'g')), ''), 'Sala') end
$$;
