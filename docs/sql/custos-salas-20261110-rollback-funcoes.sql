-- Backup anterior à otimização, somente funções existentes; sem apagar dados.
CREATE OR REPLACE FUNCTION public.esc_cla_limites_atualiza()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  insert into esc_cla_limite_cache (cla_id, limite, plano, em)
  select c.id, esc_cla_limite_vivo(c.id), esc_cla_limite_vivo(c.id) - 22, now() from esc_clas c where c.ativo
  on conflict (cla_id) do update set limite = excluded.limite, plano = excluded.plano, em = now();
end $function$
;
CREATE OR REPLACE FUNCTION public.esc_nomes_sem_escudo()
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  with bat as (
    select public.esc_nome_chave(nome_norm) as k, lower(btrim(email)) as email from esc_nomes_batismo
  ), contas as (
    select lower(coalesce(u.email, '')) as email, lower(btrim(u.raw_user_meta_data->>'display_name')) as nome,
           public.esc_nome_chave(u.raw_user_meta_data->>'display_name') as k
    from auth.users u where coalesce(btrim(u.raw_user_meta_data->>'display_name'), '') <> ''
  ), donos as (
    select c.nome from contas c where exists (select 1 from bat b where b.k = c.k and b.email = c.email)
  )
  select coalesce(jsonb_agg(distinct c.nome), '[]'::jsonb)
  from contas c
  where c.k in (select k from bat)
    and not exists (select 1 from bat b where b.k = c.k and b.email = c.email)
    and c.nome not in (select nome from donos)
$function$
;
