-- 🛡️📧 ESCUDO DE BATISMO SÓ PELO E-MAIL (02/11, Diego: "não deveria seguir pelo nome… somente pelo e-mail da conta do usuário").
-- Caso: "Mengão Malvadao" (joaovictorsilvap20, grátis) aparecia com o escudo do batismo Mengão Malvadão (atilasoaresjr21) na lista
-- do clã, porque o escudo é achado pelo NOME (a chave ignora acento). Aqui o banco devolve os nomes EXATOS (minúsculo, com acento)
-- das contas que usam um nome de batismo sem ser a dona — o aparelho nunca desenha escudo de batismo pra esses nomes. O dono
-- (mesmo e-mail) continua com o escudo; o nome CANÔNICO do clube (o dos bots de batismo, `BATISMOS`) é liberado no aparelho.
create or replace function public.esc_nomes_sem_escudo() returns jsonb language sql stable security definer set search_path = public as $$
  with bat as (
    select public.esc_nome_chave(nome_norm) as k, lower(btrim(email)) as email from esc_nomes_batismo
  ), contas as (
    select lower(coalesce(u.email, '')) as email, lower(btrim(u.raw_user_meta_data->>'display_name')) as nome,
           public.esc_nome_chave(u.raw_user_meta_data->>'display_name') as k
    from auth.users u where coalesce(btrim(u.raw_user_meta_data->>'display_name'), '') <> ''
  ), donos as (  -- nome EXATO que o próprio dono usa: nunca entra na lista (senão o dono perderia o escudo junto com a cópia)
    select c.nome from contas c where exists (select 1 from bat b where b.k = c.k and b.email = c.email)
  )
  select coalesce(jsonb_agg(distinct c.nome), '[]'::jsonb)
  from contas c
  where c.k in (select k from bat)
    and not exists (select 1 from bat b where b.k = c.k and b.email = c.email)  -- o dono de verdade (pelo e-mail)
    and c.nome not in (select nome from donos)
$$;
grant execute on function public.esc_nomes_sem_escudo() to anon, authenticated;
