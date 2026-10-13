-- 📱☁️ RESUMO DA CARREIRA NA NUVEM (13/10) — seed + temporada de cada carreira da conta, sem baixar o save (~1 MB).
-- Usado pelo `syncCareersWithCloud`: mesmo com o carimbo igual, se a nuvem estiver NA FRENTE do aparelho (aparelho
-- cheio que não gravou a cópia nova — caso do Pé de Breque, preso na 189 com a nuvem na 193), baixa e junta. APLICADO.
create or replace function public.esc_pyramid_progresso()
returns jsonb language sql stable security invoker set search_path = '' as $$
  select coalesce((
    select jsonb_agg(jsonb_build_object('seed', c->'save'->'seed', 'temp', c->'save'->'seasonNo'))
    from public.esc_pyramid_saves s,
      jsonb_array_elements(case when jsonb_typeof(s.save->'careers') = 'array' then s.save->'careers'
                                when s.save ? 'seed' then jsonb_build_array(jsonb_build_object('save', s.save)) else '[]'::jsonb end) c
    where s.user_id = auth.uid()), '[]'::jsonb)
$$;
grant execute on function public.esc_pyramid_progresso() to authenticated;
