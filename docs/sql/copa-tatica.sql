-- ⚔️ TÁTICA NA COPA DO MUNDO E NOS REGIONAIS DO ONLINE (23/10, Diego: "sim pode fazer").
--
-- Essas copas são calculadas em CADA aparelho pela ficha (é o que garante "todo mundo vê a mesma Copa"). Pra tática
-- entrar sem rachar a sala, ela vira um dado do banco com uma trava só:
--   · só se ESCREVE enquanto um jogo está ROLANDO (relógio da copa com running = true);
--   · o banco carimba em `passo` o passo do jogo que estava rolando (não é o aparelho que diz);
--   · a tática vale do PRÓXIMO jogo em diante: no jogo do passo k vale a última escolhida com passo < k.
-- Quando o jogo termina (running = false) as linhas daquele passo ficam CONGELADAS: ninguém mais escreve, e todo aparelho
-- lê o mesmo antes da bola voltar a rolar (o respiro entre jogos é de 5 s ou mais). A leitura só devolve linha congelada.
-- O `for share` no relógio fila a escrita com o 'finish' do dono: ou a escrita entra antes do apito, ou é recusada.
create table if not exists public.esc_copa_tatica (
  room_id uuid not null references public.game_rooms(id) on delete cascade,
  tipo text not null check (tipo in ('mundo', 'regional')),
  edicao integer not null,
  seed bigint not null,
  uid uuid not null,
  passo integer not null,
  tatica text not null check (tatica in ('retranca', 'equilibrio', 'ataque')),
  updated_at timestamptz not null default now(),
  primary key (room_id, tipo, edicao, seed, uid, passo)
);
alter table public.esc_copa_tatica enable row level security; -- sem política: só pelas duas funções abaixo

create or replace function public.esc_copa_tatica_set(p_room uuid, p_tipo text, p_edicao integer, p_seed bigint, p_tatica text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare me uuid := auth.uid(); st integer; run boolean;
begin
  if me is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if p_tatica not in ('retranca', 'equilibrio', 'ataque') then raise exception 'Tática inválida' using errcode = '22023'; end if;
  if not exists (select 1 from public.room_players rp where rp.room_id = p_room and rp.user_id = me) then
    raise exception 'Você não está nesta sala' using errcode = '42501';
  end if;
  if p_tipo = 'mundo' then
    select c.step, c.running into st, run from public.esc_copa_clock_preview c
      where c.room_id = p_room and c.edicao = p_edicao and c.seed = p_seed for share;
  elsif p_tipo = 'regional' then
    select c.step, c.running into st, run from public.esc_regional_clock c
      where c.room_id = p_room and c.edicao = p_edicao and c.seed = p_seed for share;
  else
    raise exception 'Copa inválida' using errcode = '22023';
  end if;
  if st is null or not run then return jsonb_build_object('ok', false, 'motivo', 'fora_do_jogo'); end if;
  insert into public.esc_copa_tatica (room_id, tipo, edicao, seed, uid, passo, tatica)
    values (p_room, p_tipo, p_edicao, p_seed, me, st, p_tatica)
    on conflict (room_id, tipo, edicao, seed, uid, passo) do update set tatica = excluded.tatica, updated_at = now();
  return jsonb_build_object('ok', true, 'passo', st);
end $$;

create or replace function public.esc_copa_taticas(p_room uuid, p_tipo text, p_edicao integer, p_seed bigint)
returns jsonb language sql stable security definer set search_path = '' as $$
  with relogio as (
    select c.step, c.running, c.revision from public.esc_copa_clock_preview c
      where p_tipo = 'mundo' and c.room_id = p_room and c.edicao = p_edicao and c.seed = p_seed
    union all
    select c.step, c.running, c.revision from public.esc_regional_clock c
      where p_tipo = 'regional' and c.room_id = p_room and c.edicao = p_edicao and c.seed = p_seed
  )
  select case
    when auth.uid() is null or not exists (select 1 from public.room_players rp where rp.room_id = p_room and rp.user_id = auth.uid())
      then jsonb_build_object('rev', -1, 'linhas', '[]'::jsonb)
    else coalesce((
      select jsonb_build_object('rev', r.revision, 'step', r.step, 'running', r.running, 'linhas', coalesce((
        select jsonb_agg(jsonb_build_object('uid', t.uid, 'passo', t.passo, 'tatica', t.tatica) order by t.uid, t.passo)
        from public.esc_copa_tatica t
        where t.room_id = p_room and t.tipo = p_tipo and t.edicao = p_edicao and t.seed = p_seed
          and (t.passo < r.step or (t.passo = r.step and not r.running))
      ), '[]'::jsonb))
      from relogio r limit 1
    ), jsonb_build_object('rev', -1, 'linhas', '[]'::jsonb))
  end
$$;

grant execute on function public.esc_copa_tatica_set(uuid, text, integer, bigint, text) to authenticated;
grant execute on function public.esc_copa_taticas(uuid, text, integer, bigint) to authenticated;
