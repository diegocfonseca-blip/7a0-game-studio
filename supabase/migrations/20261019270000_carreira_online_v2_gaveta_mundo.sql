-- 🌐 CARREIRA ONLINE v2 (19/10): gravar a GAVETA pública do clube e o MUNDO da sala.
-- Gaveta: cada conta grava só a dela (elenco, formação e as entradas da simulação), com teto de tamanho.
-- Mundo: só quem comanda o dia (dono, ou vice quando o dono não está) troca a fase e grava o que é de todos.
create or replace function public.esc_carr_gaveta(p_sala uuid, p_publico jsonb) returns text
language plpgsql security definer set search_path to 'public' as $$
begin
  if auth.uid() is null then return 'sem_login'; end if;
  if jsonb_typeof(p_publico) is distinct from 'object' then return 'erro'; end if;
  if pg_column_size(p_publico) > 262144 then return 'grande_demais'; end if;
  update public.esc_carr_clube set publico = p_publico, atualizado_em = now()
   where sala = p_sala and user_id = auth.uid();
  return case when found then 'ok' else 'nao_e_da_sala' end;
end $$;

create or replace function public.esc_carr_mundo(p_sala uuid, p_fase text, p_temporada integer, p_rodada integer, p_mundo jsonb, p_prazo_s integer default null)
returns text language plpgsql security definer set search_path to 'public' as $$
begin
  if not public.esc_carr_sou_comandante(p_sala) then return 'sem_permissao'; end if;
  if p_fase not in ('preparo', 'jogando', 'virada', 'fim') then return 'erro'; end if;
  if p_mundo is not null and pg_column_size(p_mundo) > 2097152 then return 'grande_demais'; end if;
  update public.esc_carr_sala set fase = p_fase, temporada = coalesce(p_temporada, temporada), rodada = coalesce(p_rodada, rodada),
    mundo = coalesce(p_mundo, mundo),
    prazo = case when p_prazo_s is null then null else now() + make_interval(secs => least(greatest(p_prazo_s, 15), 300)) end,
    inicio_rodada = case when p_fase = 'jogando' then now() else null end,
    atualizado_em = now()
   where id = p_sala and fase <> 'espera';
  return case when found then 'ok' else 'fora_de_hora' end;
end $$;

-- a partir de agora a gaveta só muda pela função (sem mexer em assento/pronto na mão)
alter policy "carr clube: dono do clube atualiza" on public.esc_carr_clube using (false) with check (false);

grant execute on function public.esc_carr_gaveta(uuid, jsonb), public.esc_carr_mundo(uuid, text, integer, integer, jsonb, integer) to authenticated;
