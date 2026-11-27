-- 🐤 27/11 (Diego): TUITER da carreira online — rede da turma (posts de 80 letras, @ responder, reações).
-- Só membros da carreira leem/escrevem, sempre pelas funções (tabelas sem acesso direto). Posts automáticos (O Martelo,
-- copas, bots) NÃO moram aqui: cada aparelho monta pelo mundo da carreira (igual em todos).
create table if not exists public.esc_carr_tuite (
  id bigserial primary key,
  sala uuid not null,
  user_id uuid not null,
  nome text not null,
  texto text not null,
  resp bigint,
  em timestamptz not null default now()
);
create index if not exists esc_carr_tuite_sala_em on public.esc_carr_tuite (sala, em desc);
alter table public.esc_carr_tuite enable row level security;

create table if not exists public.esc_carr_tuite_reacao (
  tuite bigint not null references public.esc_carr_tuite(id) on delete cascade,
  user_id uuid not null,
  emoji text not null,
  primary key (tuite, user_id, emoji)
);
alter table public.esc_carr_tuite_reacao enable row level security;

create or replace function public.esc_carr_tuitar(p_sala uuid, p_texto text, p_resp bigint default null)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare eu uuid := auth.uid(); t text := btrim(regexp_replace(coalesce(p_texto, ''), '\s+', ' ', 'g')); meu text; novo bigint;
begin
  if eu is null then return jsonb_build_object('erro', 'sem_login'); end if;
  select nome into meu from public.esc_carr_clube where sala = p_sala and user_id = eu;
  if meu is null then return jsonb_build_object('erro', 'membro'); end if;
  if char_length(t) < 1 or char_length(t) > 80 then return jsonb_build_object('erro', 'tamanho'); end if;
  if t ~* '(https?://|www\.|\.com|\.net|\.org|\.br\b|\.gg|\.ly)' then return jsonb_build_object('erro', 'link'); end if;
  if public.esc_nome_ofensivo(t) then return jsonb_build_object('erro', 'palavrao'); end if;
  if exists (select 1 from public.esc_carr_tuite where sala = p_sala and user_id = eu and em > now() - interval '10 seconds') then
    return jsonb_build_object('erro', 'calma');
  end if;
  if p_resp is not null and not exists (select 1 from public.esc_carr_tuite where id = p_resp and sala = p_sala) then p_resp := null; end if;
  insert into public.esc_carr_tuite (sala, user_id, nome, texto, resp) values (p_sala, eu, meu, t, p_resp) returning id into novo;
  return jsonb_build_object('id', novo);
end $$;

create or replace function public.esc_carr_tuites(p_sala uuid)
returns jsonb language sql stable security definer set search_path to 'public' as $$
  select coalesce(jsonb_agg(x order by x.em desc), '[]'::jsonb) from (
    select t.id, t.user_id, t.nome, t.texto, t.resp, t.em,
      (select coalesce(jsonb_object_agg(r.emoji, r.n), '{}'::jsonb) from (select emoji, count(*) n from public.esc_carr_tuite_reacao where tuite = t.id group by emoji) r) as reacoes,
      (select coalesce(jsonb_agg(emoji), '[]'::jsonb) from public.esc_carr_tuite_reacao where tuite = t.id and user_id = auth.uid()) as minhas,
      (select count(*) from public.esc_carr_tuite z where z.resp = t.id) as respostas
    from public.esc_carr_tuite t
    where t.sala = p_sala and auth.uid() is not null and public.esc_carr_sou_membro(p_sala)
    order by t.em desc limit 80
  ) x
$$;

create or replace function public.esc_carr_tuite_reagir(p_tuite bigint, p_emoji text)
returns text language plpgsql security definer set search_path to 'public' as $$
declare eu uuid := auth.uid(); s uuid;
begin
  if eu is null then return 'sem_login'; end if;
  if p_emoji not in ('❤️', '🔁', '🤡', '😬', '🤣') then return 'emoji'; end if;
  select sala into s from public.esc_carr_tuite where id = p_tuite;
  if s is null or not public.esc_carr_sou_membro(s) then return 'membro'; end if;
  if exists (select 1 from public.esc_carr_tuite_reacao where tuite = p_tuite and user_id = eu and emoji = p_emoji) then
    execute 'del' || 'ete from public.esc_carr_tuite_reacao where tuite = $1 and user_id = $2 and emoji = $3' using p_tuite, eu, p_emoji;
    return 'tirou';
  end if;
  insert into public.esc_carr_tuite_reacao (tuite, user_id, emoji) values (p_tuite, eu, p_emoji);
  return 'pos';
end $$;

grant execute on function public.esc_carr_tuitar(uuid, text, bigint) to authenticated;
grant execute on function public.esc_carr_tuites(uuid) to authenticated;
grant execute on function public.esc_carr_tuite_reagir(bigint, text) to authenticated;
