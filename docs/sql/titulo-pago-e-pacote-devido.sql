-- 🃏 21/11 — AUDITORIA DA CARTINHA DE CAMPEÃO (APLICADO em produção em 4 migrations: bafo2_titulo_ja_pago, bafo2_pune_anota_pago,
-- esc_titulos_sem_carta, esc_titulos_sem_carta_v2). Este arquivo é o retrato do que ficou valendo.
--
-- 1) TÍTULO JÁ PAGO: a carta tomada no Bafo liberava a chave do título original (season_key) no perdedor; reabrir a tela final
--    daquele título dava OUTRA carta. Agora o banco lembra e recusa em silêncio (o insert simplesmente não grava).
create table if not exists public.esc_titulo_pago (
  user_id uuid not null, season_key text not null, em timestamptz not null default now(), primary key (user_id, season_key));
alter table public.esc_titulo_pago enable row level security; -- sem policy: só as funções de dentro leem/escrevem

create or replace function bafo_int.anota_pago(p_card uuid, p_de uuid)
 returns void language sql security definer set search_path to 'public' as $$
  insert into public.esc_titulo_pago (user_id, season_key)
    select uc.user_id, uc.season_key from public.user_cards uc where uc.id = p_card and uc.user_id = p_de and uc.season_key is not null
  on conflict do nothing;
$$;
-- `bafo_int.passa` e `bafo_int.pune` chamam `anota_pago` ANTES de a carta sair do dono (ver bafo2.sql; a linha foi acrescentada).

create or replace function public.esc_titulo_pago_trava()
 returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  if exists (select 1 from public.esc_titulo_pago t where t.user_id = new.user_id and t.season_key = new.season_key) then return null; end if;
  return new;
end $$;
-- create trigger esc_titulo_pago_trg before insert on public.user_cards for each row execute function public.esc_titulo_pago_trava();

-- 2) PACOTE QUE FICOU PRA TRÁS: títulos de SALA dos últimos 3 dias em que a conta foi campeã e a carta não existe.
--    Medido em 21/11: ~25 de 1.230 títulos (2%). A tela inicial (`PacotesDevidos`, screens.tsx) oferece o pacote com a MESMA chave.
create index if not exists game_champions_created_at_idx on public.game_champions (created_at);
create or replace function public.esc_titulos_sem_carta()
 returns table (season_key text, tipo text, sala text)
 language sql stable security definer set search_path to 'public' as $$
  with eu as (select auth.uid() as uid),
  linhas as (
    select gc.room_id, gc.match_seed, gc.season_no, h,
           g.game_state ->> 'copaMode' as copa_mode, coalesce(g.game_state ->> 'roomName', g.code) as sala
    from public.game_champions gc
    join public.game_rooms g on g.id = gc.room_id
    cross join lateral jsonb_array_elements(coalesce(gc.human_results, '[]'::jsonb)) h
    where gc.created_at > now() - interval '3 days' and gc.created_at < now() - interval '3 minutes'
      and gc.match_seed is not null
      and h ->> 'user_id' = (select uid::text from eu)
      and coalesce(g.game_state ->> 'sport', 'futebol') <> 'basquete'
      and coalesce(g.game_state ->> 'mode', 'rapido') not in ('carreira', 'elenco', 'mundo')
  ),
  devidos as (
    select room_id::text || ':' || match_seed || ':' || season_no || case when copa_mode in ('relampago', 'champions') then ':copa' else '' end as k,
           case when copa_mode in ('relampago', 'champions') then 'copa' else 'liga' end as tipo, sala
      from linhas where (h ->> 'league_champion')::boolean
    union
    -- sala só de liga + Copa do Mundo/regional grava o título como 'copa', mas a carta dela tem OUTRA chave: fica de fora
    select room_id::text || ':' || match_seed || ':' || season_no || ':copa', 'copa', sala
      from linhas where (h -> 'cup_titles') ?| array['copa', 'libertadores'] and copa_mode is distinct from 'liga'
  )
  select d.k, d.tipo, d.sala from devidos d
  where (select uid from eu) is not null
    and not exists (select 1 from public.user_cards uc where uc.user_id = (select uid from eu) and uc.season_key = d.k)
    and not exists (select 1 from public.esc_titulo_pago t where t.user_id = (select uid from eu) and t.season_key = d.k)
  limit 5;
$$;
