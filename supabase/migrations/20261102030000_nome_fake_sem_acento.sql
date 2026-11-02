-- 🎭 SELO FAKE SEM BURACO DE ACENTO (02/11, Diego aprovou: "sim aplica"). Achado: "Mengão Malvadao" (sem o til) não levava o
-- 🎭 FAKE do batismo "Mengão Malvadão", porque a conferência comparava letra por letra. Eram 21 contas escapando assim
-- ("Mengaomalvadao", "Falad10", "Neymarfc", "Paizao fc", ".real madruga."…).
-- Agora a comparação ignora caixa, acento, espaço e pontuação, mas MANTÉM os números (senão "K7" viraria cópia do "K9").
-- As duas proteções continuam: o dono (mesmo e-mail do batismo) e quem tem plano NUNCA são fake.
create or replace function public.esc_nome_chave(t text)
returns text
language sql
immutable
as $function$
  select regexp_replace(
    translate(lower(coalesce(t, '')), 'áàâãäéèêëíìîïóòôõöúùûüçñ', 'aaaaaeeeeiiiiooooouuuucn'),
    '[^a-z0-9]', '', 'g')
$function$;

create or replace function public.esc_meu_nome_fake()
 returns boolean
 language sql
 stable security definer
 set search_path to 'public'
as $function$
  with eu as (
    select u.id, lower(coalesce(u.email, '')) as email,
           public.esc_nome_chave(u.raw_user_meta_data->>'display_name') as k
      from auth.users u where u.id = auth.uid()
  )
  select coalesce((
    select case
      when eu.k = '' then false
      when coalesce((public.esc_direitos_de(eu.email) ->> 'pago')::boolean, false) then false
      else exists (select 1 from esc_nomes_batismo b where public.esc_nome_chave(b.nome_norm) = eu.k and lower(btrim(b.email)) <> eu.email)
        or exists (select 1 from auth.users o
                    where public.esc_nome_chave(o.raw_user_meta_data->>'display_name') = eu.k
                      and o.id <> eu.id
                      and coalesce((public.esc_direitos_de(lower(o.email)) ->> 'pago')::boolean, false))
    end from eu), false)
$function$;
