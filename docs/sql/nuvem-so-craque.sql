-- ☁️⭐ NUVEM SÓ PRO CRAQUE nas carreiras NOVAS (07/10, Diego: "Nuvem só pra quem paga… quem já tem save na
-- nuvem continua igual. Ninguém perde nada"). A função diz, pra conta logada: se ela PAGA (Craque/Lenda,
-- batismo/fundador, sócio em dia) e quais carreiras (seed) dela JÁ estão na nuvem. O jogo (savePyramidCloud)
-- só deixa conta grátis subir as carreiras que já estavam lá. Leve: devolve só números, nunca o save.
create or replace function public.esc_nuvem_regra()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with eu as (select auth.uid() as uid, lower(coalesce((select email from auth.users where id = auth.uid()), '')) as email),
  pago as (
    select exists (select 1 from user_colors c, eu where lower(c.email) = eu.email and c.tier in ('prata', 'ouro'))
        or exists (select 1 from esc_fundadores f, eu where lower(f.email) = eu.email)
        or exists (select 1 from esc_socios s, eu where lower(s.email) = eu.email and coalesce(s.valido_ate, current_date) >= current_date) as p
  ),
  sv as (select p.save from esc_pyramid_saves p, eu where p.user_id = eu.uid)
  select jsonb_build_object(
    'pago', (select p from pago),
    'seeds', coalesce((
      select jsonb_agg(x) from (
        select (c->'save'->>'seed')::bigint as x from sv, jsonb_array_elements(case when jsonb_typeof(sv.save->'careers') = 'array' then sv.save->'careers' else '[]'::jsonb end) c
        where c->'save'->>'seed' ~ '^-?[0-9]+$'
        union
        select (sv.save->>'seed')::bigint from sv where sv.save->>'seed' ~ '^-?[0-9]+$'
      ) q), '[]'::jsonb)
  )
$$;
grant execute on function public.esc_nuvem_regra() to authenticated;
