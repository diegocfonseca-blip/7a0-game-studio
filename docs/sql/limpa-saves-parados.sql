-- 🗑️ APAGAR SAVE DE CONTA GRÁTIS PARADO HÁ 30+ DIAS (Diego 14/10: "gratuito após 30 dias do save sem jogar ou fazer nada
-- nem entrar vai ser apagado" + "pode ser de antes já" + "já pode fazer tudo").
-- ⛔ O execute_sql CANCELOU este arquivo 3 vezes (o comando apaga dados e precisa de aprovação). Rodar no SQL Editor do
--    Supabase (painel → SQL Editor → colar tudo → Run). A lixeira (`esc_pyramid_saves_apagados`) JÁ existe.
-- Quem cai: save da NUVEM de conta GRÁTIS, sem salvar, sem login e sem temporada jogada há 30+ dias. Pagante nunca.
-- Medido em 14/10: 90 saves (17 MB de 624 MB). Vão pra lixeira por 7 dias (dá pra devolver) e depois somem de vez.
create or replace function public.esc_limpa_saves_parados() returns integer language plpgsql security definer set search_path = '' as $$
declare n integer;
begin
  with alvo as (
    select s.user_id from public.esc_pyramid_saves s left join auth.users au on au.id = s.user_id
    where s.updated_at < now() - interval '30 days'
      and coalesce(au.last_sign_in_at, 'epoch') < now() - interval '30 days'
      and coalesce((select max(r.updated_at) from public.esc_pyramid_rank_snap r where r.user_id = s.user_id), 'epoch') < now() - interval '30 days'
      and not coalesce((public.esc_direitos_de(au.email)->>'pago')::boolean, false)),
  copia as (insert into public.esc_pyramid_saves_apagados(user_id, save, updated_at) select s.user_id, s.save, s.updated_at from public.esc_pyramid_saves s join alvo using (user_id) returning user_id)
  delete from public.esc_pyramid_saves s using copia c where s.user_id = c.user_id;
  get diagnostics n = row_count;
  delete from public.esc_pyramid_saves_apagados where apagado_em < now() - interval '7 days';
  return n;
end $$;
revoke all on function public.esc_limpa_saves_parados() from public, anon, authenticated;
-- roda uma vez agora (devolve quantos saves foram pra lixeira):
select public.esc_limpa_saves_parados();
-- e todo dia às 4h07 de Brasília (07:07 UTC):
select cron.schedule('esc-limpa-saves-parados', '7 7 * * *', 'select public.esc_limpa_saves_parados()');
-- ↩️ DEVOLVER um save da lixeira (até 7 dias):
--   insert into public.esc_pyramid_saves(user_id, save, updated_at) select user_id, save, now() from public.esc_pyramid_saves_apagados where user_id = '<id>' order by apagado_em desc limit 1;
-- ⏸️ PARAR a limpeza diária:  select cron.unschedule('esc-limpa-saves-parados');
