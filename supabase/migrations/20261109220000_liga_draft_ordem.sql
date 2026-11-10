-- 🔢 09/11 (Diego): ordem do draft escolhida pelo dono (melhor→pior ou pior→melhor). Só acrescenta 'piorPrimeiro' à lista de
-- regras que o `liga_patch_draft` aceita (o resto da função igual).
create or replace function public.liga_patch_draft(p_room uuid, p_regras jsonb default null::jsonb, p_premios jsonb default null::jsonb, p_premios_padrao boolean default false)
returns boolean language plpgsql security definer set search_path to 'public' as $function$
declare
  r public.game_rooms%rowtype;
  eu uuid := auth.uid();
  patch jsonb := '{}'::jsonb;
  regras jsonb := '{}'::jsonb;
  k text;
  v jsonb;
  premios jsonb := '[]'::jsonb;
begin
  if eu is null then return false; end if;
  select * into r from public.game_rooms where id = p_room;
  if not found then return false; end if;
  if coalesce(r.game_state->>'mode', '') <> 'liga' or coalesce(r.game_state->>'minhaLigaDraft', 'false') <> 'true' then return false; end if;
  if coalesce(r.liga_dono, r.host_id) <> eu then return false; end if;
  if p_regras is not null then
    if jsonb_typeof(p_regras) <> 'object' then return false; end if;
    foreach k in array array['semLendas', 'semCraques', 'soBrasil', 'piorPrimeiro'] loop
      if (p_regras->>k) = 'true' then regras := regras || jsonb_build_object(k, true); end if;
    end loop;
    patch := patch || jsonb_build_object('draftRegras', regras);
  end if;
  if p_premios_padrao then
    patch := patch || jsonb_build_object('draftPremios', null);
  elsif p_premios is not null then
    if jsonb_typeof(p_premios) <> 'array' or jsonb_array_length(p_premios) > 20 then return false; end if;
    for v in select * from jsonb_array_elements(p_premios) loop
      if jsonb_typeof(v) <> 'number' then return false; end if;
      premios := premios || to_jsonb(greatest(0, least(999, floor((v)::text::numeric)::int)));
    end loop;
    patch := patch || jsonb_build_object('draftPremios', premios);
  end if;
  if patch = '{}'::jsonb then return false; end if;
  update public.game_rooms set game_state = game_state || patch, updated_at = now() where id = p_room;
  return true;
end $function$;
