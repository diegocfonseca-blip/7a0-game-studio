-- 06/11: liga recém-criada (sem seatUids) dava NULL aqui, e no gatilho `esc_liga_comecada_so_plano` (`if not found or
-- not NULL`) isso vira falso → barrava amigo GRÁTIS na sala de ESPERA de liga nova ("Essa liga já começou"). Agora nunca
-- devolve nulo: só liga que JÁ JOGOU (temporada ≥ 1 ou crachá gravado) pede plano pra gente nova.
create or replace function public.esc_liga_ja_jogou(gs jsonb)
 returns boolean language sql immutable as $$
  select coalesce(gs->>'mode','') = 'liga'
     and (coalesce(nullif(gs->>'seasonNo','')::int, 0) >= 1 or coalesce(jsonb_typeof(gs->'seatUids') = 'array', false))
$$;
