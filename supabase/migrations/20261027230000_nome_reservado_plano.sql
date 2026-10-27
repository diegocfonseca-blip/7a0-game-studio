-- 🔒 NOME RESERVADO PRA QUEM TEM PLANO (27/10, Diego: "quem tem plano reserva o nome p sempre p ele. quem nao tem alguem pode
-- fazer igual… o que tava gratuito irá aparecer joaquim fc fake"). Mockup aprovado: scripts/mockups/nome-reservado.png.
--
-- Antes: o nome era único pra TODO mundo (grátis inclusive). Agora:
--   · nome de BATISMO continua do dono (igual a antes);
--   · nome de quem tem PLANO (régua `esc_direitos_de(...)->>'pago'` — o mensal só conta enquanto está em dia; cancelou, perde)
--     é dele: outra conta COM plano não pega;
--   · quem é GRÁTIS pode usar qualquer nome que não seja de batismo — se for o nome de alguém com plano, passa, mas
--     a resposta vem com `fake: true` e o aparelho dele mostra o selo 🎭 FAKE;
--   · nome de grátis não trava mais ninguém.
create or replace function public.esc_nome_livre(p_nome text, p_email text)
returns jsonb
language plpgsql
stable security definer
set search_path to 'public'
as $function$
declare
  norm text := lower(btrim(coalesce(p_nome, '')));
  dono text;
  meu  text;
  eu_pago boolean := false;
  outro_pago boolean := false;
begin
  if norm = '' then return jsonb_build_object('livre', true); end if;

  -- quem sou eu: o e-mail do login; se não há login (cadastro), o e-mail digitado
  meu := lower(btrim(coalesce(auth.jwt()->>'email', '')));
  if meu = '' and auth.uid() is null then
    meu := lower(btrim(coalesce(p_email, '')));
  end if;

  -- 1) nome de batismo é RESERVADO pro dono (igual a antes)
  select email into dono from esc_nomes_batismo where nome_norm = norm;
  if found then
    if meu <> '' and meu = lower(btrim(dono)) then
      return jsonb_build_object('livre', true);
    end if;
    return jsonb_build_object('livre', false, 'motivo', 'batismo');
  end if;

  -- 2) o nome é de OUTRA conta que tem plano?
  if meu <> '' then
    eu_pago := coalesce((public.esc_direitos_de(meu) ->> 'pago')::boolean, false);
  end if;
  select coalesce(bool_or(coalesce((public.esc_direitos_de(lower(u.email)) ->> 'pago')::boolean, false)), false)
    into outro_pago
    from auth.users u
   where lower(btrim(coalesce(u.raw_user_meta_data->>'display_name', ''))) = norm
     and u.id is distinct from auth.uid()
     and (meu = '' or lower(coalesce(u.email, '')) <> meu);

  if outro_pago then
    if eu_pago then
      return jsonb_build_object('livre', false, 'motivo', 'em_uso');
    end if;
    return jsonb_build_object('livre', true, 'fake', true);
  end if;

  return jsonb_build_object('livre', true);
end $function$;

-- 🎭 o MEU nome de conta é cópia do nome de alguém com plano (ou de um batismo que não é meu)? Lido pelo aparelho no login,
-- do mesmo jeito que a medalha da semana: o selo viaja grudado no nome (sala, chat, tabela, ranking).
-- Quem tem plano nunca é fake.
create or replace function public.esc_meu_nome_fake()
returns boolean
language sql
stable security definer
set search_path to 'public'
as $function$
  with eu as (
    select u.id, lower(coalesce(u.email, '')) as email,
           lower(btrim(coalesce(u.raw_user_meta_data->>'display_name', ''))) as k
      from auth.users u where u.id = auth.uid()
  )
  select coalesce((
    select case
      when eu.k = '' then false
      when coalesce((public.esc_direitos_de(eu.email) ->> 'pago')::boolean, false) then false
      else exists (select 1 from esc_nomes_batismo b where b.nome_norm = eu.k and lower(btrim(b.email)) <> eu.email)
        or exists (select 1 from auth.users o
                    where lower(btrim(coalesce(o.raw_user_meta_data->>'display_name', ''))) = eu.k
                      and o.id <> eu.id
                      and coalesce((public.esc_direitos_de(lower(o.email)) ->> 'pago')::boolean, false))
    end from eu), false)
$function$;

grant execute on function public.esc_meu_nome_fake() to authenticated;
