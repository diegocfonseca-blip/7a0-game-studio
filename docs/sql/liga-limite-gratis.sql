-- 🔒 02/11 (Diego: "no liga draft ou minhas ligas o usuário que não paga só pode estar em uma liga por modo… ele pode estar
-- participando de uma liga do Minhas Ligas e uma liga do Liga Draft").
-- Gatilho em room_players: entrar numa sala de LIGA (game_state.mode = 'liga') quando já tem vaga em OUTRA liga do MESMO tipo
-- (Liga Draft = game_state.ligaDraft true; o resto = Minhas Ligas) só passa pra quem tem plano (esc_direitos_de(email).pago).
-- Quem já estava em 2+ antes desta regra continua (o gatilho só olha entrada NOVA). Recado: 'LIGA_LIMITE|<draft|liga>|<nome da outra>'
-- — a tela (lobby.tsx, enterRoom) traduz. Sala que não é liga: passa direto, sem custo.
create or replace function public.esc_liga_limite_gratis() returns trigger language plpgsql security definer set search_path = public as $$
declare v_mode text; v_draft boolean; v_email text; v_outra text;
begin
  select g.game_state->>'mode', coalesce(g.game_state->>'ligaDraft','false') = 'true' into v_mode, v_draft from game_rooms g where g.id = new.room_id;
  if v_mode is distinct from 'liga' then return new; end if;
  select coalesce(g.game_state->>'roomName', g.code) into v_outra
    from room_players rp join game_rooms g on g.id = rp.room_id
   where rp.user_id = new.user_id and rp.room_id <> new.room_id and g.game_state->>'mode' = 'liga'
     and (coalesce(g.game_state->>'ligaDraft','false') = 'true') = v_draft
   limit 1;
  if v_outra is null then return new; end if;
  select u.email into v_email from auth.users u where u.id = new.user_id;
  if v_email is not null and coalesce((esc_direitos_de(v_email)->>'pago')::boolean, false) then return new; end if;
  raise exception 'LIGA_LIMITE|%|%', case when v_draft then 'draft' else 'liga' end, v_outra using errcode = 'P0001';
end $$;
create trigger esc_liga_limite_gratis before insert on public.room_players for each row execute function public.esc_liga_limite_gratis();
