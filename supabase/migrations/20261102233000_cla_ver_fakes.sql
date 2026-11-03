-- 🎭 02/11 (Diego, print do clã Lulubaba: um "Neymar FC" grátis aparecia com o escudo do batismo do Neymar FC de verdade).
-- *"somente o q tem email q deve ter os escudos e coisas do plano"*. A ficha do clã agora diz QUEM é fake (mesma régua do
-- esc_meu_nome_fake, só que pra uma conta qualquer): grátis usando nome de batismo alheio ou de conta com plano. A tela desenha
-- o escudo GENÉRICO e o selo 🎭 FAKE pra esses.
create or replace function public.esc_nome_fake_de(p_uid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  with eu as (
    select u.id, lower(coalesce(u.email, '')) as email, public.esc_nome_chave(u.raw_user_meta_data->>'display_name') as k
      from auth.users u where u.id = p_uid)
  select coalesce((select case
      when eu.k = '' then false
      when coalesce((public.esc_direitos_de(eu.email) ->> 'pago')::boolean, false) then false
      else exists (select 1 from esc_nomes_batismo b where public.esc_nome_chave(b.nome_norm) = eu.k and lower(btrim(b.email)) <> eu.email)
        or exists (select 1 from auth.users o where public.esc_nome_chave(o.raw_user_meta_data->>'display_name') = eu.k and o.id <> eu.id
                     and coalesce((public.esc_direitos_de(lower(o.email)) ->> 'pago')::boolean, false))
    end from eu), false)
$$;

create or replace function public.esc_cla_ver(p_cla bigint) returns jsonb
language sql stable security definer set search_path = public as $$
  select esc_cla_bloco(c.id, auth.uid()) || jsonb_build_object(
    'sou', esc_cla_membro_de(auth.uid(), c.id),
    'pedi', exists (select 1 from esc_cla_pedidos p where p.cla_id = c.id and p.user_id = auth.uid() and p.tipo = 'pedido' and p.status = 'aberto'),
    'fakes', coalesce((select jsonb_agg(g.user_id) from esc_cla_gente() g where g.cla_id = c.id and esc_nome_fake_de(g.user_id)), '[]'::jsonb))
  from esc_clas c where c.id = p_cla and c.ativo
$$;
