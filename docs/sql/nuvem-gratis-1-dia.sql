-- ✅ APLICADO no banco em 07/11 às 22:50 UTC (migration nuvem_gratis_1_dia).
-- ☁️ 07/11 (Diego: "ficou um dia sem jogar, quem não tem plano pode apagar o save… pra dar espaço… só tem direito a um save").
-- Troca o prazo de 7 dias (de 26/10) por 1 DIA e passa a valer pra TODA conta sem plano (não só a marcada a partir de 26/10).
-- O relógio começa na hora em que isto é aplicado: ninguém perde a carreira no mesmo dia da mudança (`inicio`).
-- Só esvazia a carreira da NUVEM; a do aparelho não é tocada (e volta a subir no próximo Salvar).
create or replace function public.esc_nuvem_gratis_limpa()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare n integer := 0; inicio constant timestamptz := '2026-11-07T22:50:00Z';
begin
  with alvo as (
    select p.user_id from public.esc_pyramid_saves p
      join auth.users u on u.id = p.user_id
     where greatest(p.updated_at, inicio) < now() - interval '1 day'
       and p.save <> '{}'::jsonb
       and not coalesce((public.esc_direitos_de(lower(u.email)) ->> 'pago')::boolean, false)
  ), feito as (
    update public.esc_pyramid_saves p set save = '{}'::jsonb from alvo where p.user_id = alvo.user_id returning p.user_id
  )
  select count(*) into n from feito;
  return n;
end;
$$;
-- a cada hora (com 1 dia, uma vez por dia deixava gente até ~2 dias)
select cron.unschedule('esc-nuvem-gratis-7d');
select cron.schedule('esc-nuvem-gratis-1d', '23 * * * *', 'select public.esc_nuvem_gratis_limpa()');
