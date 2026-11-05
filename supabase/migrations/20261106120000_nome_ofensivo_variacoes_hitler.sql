-- 06/11 (Diego): "Raiohitaler" passou no filtro. Agora pega Hitler escrito errado de propósito (Hitaler, Hitller, Hittler, H1tler…).
CREATE OR REPLACE FUNCTION public.esc_nome_ofensivo(t text)
 RETURNS boolean
 LANGUAGE sql
 IMMUTABLE
AS $function$
  select replace(public.esc_nome_norm(t), 'internazional', '') ~ '(nazis|crioul|h+[iy1]+t+[ae]?l+[e3]+r|suastic|swastik|fuhrer|fuehrer|siegheil|estupr|molest|卍|卐|࿕|࿖|࿗|࿘)'
      or translate(lower(coalesce(t, '')), 'áàâãäéèêëíìîïóòôõöúùûüç01345@$!', 'aaaaaeeeeiiiiooooouuuucoieasasi') ~ '(^|[^a-z])nazi([^a-z]|$)'
$function$;
