-- 📏 MEDIDOR DE MENSAGENS AO VIVO (13/10) — ver src/escalacao/medidor-realtime.ts
-- Cada aparelho grava, a cada 10 min e ao sair, o que RECEBEU e MANDOU por tipo de mensagem
-- (state, action, chat, emote, masc, sfx, presence, db:*) + bytes. A soma de `rx` de todo mundo
-- é o que o Supabase cobra em "Realtime Messages". Só insere a própria linha; leitura só pelo painel/SQL.
create table if not exists public.esc_realtime_medidor (
  id bigint generated always as identity primary key,
  criado_em timestamptz not null default now(),
  user_id uuid,
  sala text not null,
  canal text not null,
  papel text,
  minutos integer,
  pessoas_max integer,
  rx jsonb not null default '{}',
  tx jsonb not null default '{}',
  rx_bytes bigint default 0,
  tx_bytes bigint default 0
);
alter table public.esc_realtime_medidor enable row level security;
drop policy if exists medidor_insere on public.esc_realtime_medidor;
create policy medidor_insere on public.esc_realtime_medidor for insert to authenticated, anon
  with check (user_id is null or user_id = (select auth.uid()));
create index if not exists esc_realtime_medidor_criado on public.esc_realtime_medidor (criado_em);

-- 📊 O RELATÓRIO (rodar no SQL):
-- select k as tipo, sum((rx->>k)::bigint) as recebidas
--   from esc_realtime_medidor, jsonb_object_keys(rx) k
--  where criado_em > now() - interval '1 day' group by k order by 2 desc;
