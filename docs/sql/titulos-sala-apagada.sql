-- ⏳ NÃO APLICADO AINDA (14/10): a aplicação foi cancelada; esperando o OK do Diego.
-- 🏆 CASO 2 (Diego 14/10): título ganho de verdade NÃO some quando o dono aperta SAIR e a sala é apagada.
-- Antes: game_champions.room_id → game_rooms ON DELETE CASCADE, então o título ia pro lixo junto com a sala e
-- saía do 🏆 Ranking da Semana. Agora a linha vai pro ARQUIVO (game_champions_arquivo) antes de ser apagada, e a
-- vitrine (esc_vitrine_salas) soma as duas. Só arquiva quando a SALA sumiu — apagar uma temporada pela Sala de
-- Troféus da liga (edição do dono) continua apagando de verdade.
-- Caso 1 (sala viva) e caso 3 (sala apagada antes do fim, sem campeão) não mudam.
create table if not exists public.game_champions_arquivo (like public.game_champions including defaults);
alter table public.game_champions_arquivo add column if not exists arquivado_em timestamptz not null default now();
alter table public.game_champions_arquivo add column if not exists origem text not null default 'sala_apagada';
alter table public.game_champions_arquivo enable row level security; -- sem política: só as funções leem

create or replace function public.esc_arquiva_titulo() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from game_rooms where id = old.room_id) then
    insert into game_champions_arquivo
      select (jsonb_populate_record(null::game_champions_arquivo, to_jsonb(old) || jsonb_build_object('arquivado_em', now(), 'origem', 'sala_apagada'))).*;
  end if;
  return old;
end $$;
drop trigger if exists trg_arquiva_titulo on public.game_champions;
create trigger trg_arquiva_titulo before delete on public.game_champions for each row execute function public.esc_arquiva_titulo();
