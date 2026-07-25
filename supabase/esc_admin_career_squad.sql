-- 🔧 Função do painel admin: "ver o elenco de um técnico" (Modo Carreira).
-- CORREÇÃO: o save da carreira passou a ser gravado no formato NOVO
--   { "__multi": 1, "careers": [ { "save": <estado>, "at": ... }, ... ] }
-- (várias carreiras por conta). A versão antiga da função lia o elenco no TOPO
-- do save e, com o formato novo, não achava nada -> "Sem save na nuvem" mesmo
-- pra quem está logado. Esta versão entende os DOIS formatos (novo e antigo).
--
-- Como aplicar: cole no SQL Editor do Supabase (projeto do Leilão Legends) e rode.
-- É idempotente: pode rodar quantas vezes quiser.

drop function if exists public.esc_admin_career_squad(uuid);
drop function if exists public.esc_admin_career_squad(text);

create or replace function public.esc_admin_career_squad(p_user uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  raw    jsonb;
  st     jsonb;   -- estado da carreira ativa
  yi     int;     -- índice do humano (youIdx)
  human  jsonb;   -- o técnico humano (managers[youIdx])
  hid    text;    -- id do humano (chave de careerCoins/placements)
begin
  select save into raw
    from public.esc_pyramid_saves
   where user_id = p_user
   limit 1;
  if raw is null then
    return null;
  end if;

  -- formato NOVO (várias carreiras) -> carreira ATIVA = careers[0].save
  -- formato ANTIGO -> o estado é o próprio save
  if raw ? '__multi' then
    st := raw #> '{careers,0,save}';
  else
    st := raw;
  end if;
  if st is null then
    return null;
  end if;

  yi    := coalesce(nullif(st->>'youIdx','')::int, 0);
  human := st->'managers'->yi;
  if human is null then
    return null;
  end if;
  hid   := human->>'id';

  return jsonb_build_object(
    'team',      human->>'teamName',
    'formation', human->>'formation',
    'season',    nullif(st->>'seasonNo','')::int,
    'division',  coalesce(st->>'careerDivision', st->'careerPlacements'->>('m'||coalesce(hid,'0'))),
    'coins',     coalesce(st->'careerCoins'->>coalesce(hid,'0'), human->>'money'),
    'squad',     coalesce(human->'squad', '[]'::jsonb)
  );
end;
$$;

grant execute on function public.esc_admin_career_squad(uuid) to authenticated;
