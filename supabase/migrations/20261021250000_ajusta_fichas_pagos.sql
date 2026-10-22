-- 💾 21/10 (Diego): "quem passou do limite de saves nas contas pagas… apague os saves que estão mais tempo sem mexer, pra deixar
-- na quantidade exata de cada plano". Limite: ⭐ Craque 2 · 👑 Lenda/🖋 Batismo/Fundador 4 (+ fichas extras compradas).
-- Fica SEMPRE as N carreiras mais recentes (pelo `at` de cada uma); as mais velhas saem da nuvem pra `esc_saves_lixeira`
-- (volta com esc_lixeira_devolve se alguém pagante reclamar) e o seed dela entra em `esc_carreiras_barradas`.
-- ⚠️ O celular guarda cópia e manda tudo de novo no "Sair e salvar" (mergeCareers com o arquivo local) — por isso a TRAVA:
-- o gatilho abaixo tira da gravação qualquer carreira barrada daquela conta. No aparelho a carreira continua (regra de não
-- mexer no save do aparelho); ela só não volta pra nuvem. A conta do Diego fica de fora.
create table if not exists public.esc_carreiras_barradas (
  user_id uuid not null,
  seed text not null,
  removido_em timestamptz not null default now(),
  primary key (user_id, seed)
);
alter table public.esc_carreiras_barradas enable row level security; -- sem policy: só o banco mexe

create or replace function public.esc_saves_tira_barradas() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if jsonb_typeof(new.save -> 'careers') = 'array' and exists (select 1 from esc_carreiras_barradas b where b.user_id = new.user_id) then
    new.save := jsonb_set(new.save, '{careers}', coalesce((
      select jsonb_agg(c order by o) from jsonb_array_elements(new.save -> 'careers') with ordinality x(c, o)
      where not exists (select 1 from esc_carreiras_barradas b where b.user_id = new.user_id and b.seed = c -> 'save' ->> 'seed')
    ), '[]'::jsonb));
  end if;
  return new;
end $$;
create trigger esc_saves_tira_barradas before insert or update on public.esc_pyramid_saves
  for each row execute function public.esc_saves_tira_barradas();

-- roda o ajuste (p_testar = true só conta). Uma conta por vez, só quem tem plano e passa do limite.
create or replace function public.esc_ajusta_fichas_pagos(p_testar boolean default true)
returns jsonb language plpgsql security definer set search_path = public, auth as $$
declare r record; lim int; v_fica jsonb; s record; n_contas int := 0; n_sai int := 0;
begin
  if auth.uid() is not null then raise exception 'so_o_banco'; end if; -- ninguém roda pelo jogo: só o painel/SQL do Diego
  for r in
    select p.user_id, p.save, lower(u.email) email, jsonb_array_length(p.save -> 'careers') n
    from esc_pyramid_saves p join auth.users u on u.id = p.user_id
    where jsonb_typeof(p.save -> 'careers') = 'array' and jsonb_array_length(p.save -> 'careers') > 2
      and lower(u.email) <> 'diego.c.fonseca@gmail.com'
  loop
    lim := case coalesce(esc_plano_rank(r.email), 0) when 0 then 0 when 1 then 2 else 4 end;
    if lim = 0 then continue; end if; -- grátis: fora deste ajuste
    lim := least(lim + coalesce((select qtd from esc_fichas_extras f where lower(f.email) = r.email), 0), 8);
    if r.n <= lim then continue; end if;
    n_contas := n_contas + 1;
    v_fica := '[]'::jsonb;
    for s in select c, row_number() over (order by (c ->> 'at')::bigint desc) ord from jsonb_array_elements(r.save -> 'careers') c loop
      if s.ord <= lim then v_fica := v_fica || jsonb_build_array(s.c);
      else
        n_sai := n_sai + 1;
        if not p_testar then
          insert into esc_saves_lixeira (user_id, email, career, career_at) values (r.user_id, r.email, s.c, to_timestamp((s.c ->> 'at')::bigint / 1000.0));
          insert into esc_carreiras_barradas (user_id, seed) values (r.user_id, s.c -> 'save' ->> 'seed') on conflict do nothing;
        end if;
      end if;
    end loop;
    if not p_testar then update esc_pyramid_saves set save = jsonb_set(save, '{careers}', v_fica) where user_id = r.user_id; end if;
  end loop;
  return jsonb_build_object('contas', n_contas, 'carreiras_que_saem', n_sai, 'testando', p_testar);
end $$;
