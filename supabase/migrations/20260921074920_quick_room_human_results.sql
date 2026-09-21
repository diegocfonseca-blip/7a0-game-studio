-- Sala rápida: guarda o resultado de CADA usuário, não só o nome do campeão.
-- É aditivo e retrocompatível: linhas antigas continuam válidas com [].
alter table public.game_champions
  add column if not exists human_results jsonb not null default '[]'::jsonb;

alter table public.game_champions
  drop constraint if exists game_champions_human_results_array;

alter table public.game_champions
  add constraint game_champions_human_results_array
  check (jsonb_typeof(human_results) = 'array');

-- Uma partida (room + seed) só pode produzir uma linha. O cliente usa UPSERT,
-- então reload, reconexão e as telas finais das Copas não duplicam a temporada.
create unique index if not exists game_champions_room_seed_uidx
  on public.game_champions (room_id, match_seed);

-- A gravação vem do navegador, mas somente a conta que criou a sala pode
-- inserir ou alterar a temporada. SELECT continua seguindo a política existente.
drop policy if exists champions_insert on public.game_champions;
create policy champions_insert
  on public.game_champions
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.game_rooms r
      where r.id = game_champions.room_id
        and r.host_id = (select auth.uid())
    )
  );

drop policy if exists champions_update on public.game_champions;
create policy champions_update
  on public.game_champions
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.game_rooms r
      where r.id = game_champions.room_id
        and r.host_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.game_rooms r
      where r.id = game_champions.room_id
        and r.host_id = (select auth.uid())
    )
  );

comment on column public.game_champions.human_results is
  'Snapshot por usuário da temporada: uid, nome, time, posição, classificação, rebaixamento e títulos.';
