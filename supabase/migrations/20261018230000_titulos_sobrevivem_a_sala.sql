-- 🏆 18/10 (Diego: "sempre que tiver campeão em qualquer liga ou copa online deve contar")
-- 1) o título NÃO some quando a sala é apagada da limpeza (antes: ON DELETE CASCADE)
alter table public.game_champions alter column room_id drop not null;
alter table public.game_champions drop constraint game_champions_room_id_fkey;
alter table public.game_champions add constraint game_champions_room_id_fkey foreign key (room_id) references public.game_rooms(id) on delete set null;
-- 2) esc_perfil_publico: 'titulos.salas' passou a contar pelo human_results (user_id + league_champion + cup_titles),
--    porque champion_user_id quase nunca é preenchido (6 de 661 no último mês). Aplicado direto no banco com replace() no corpo.
