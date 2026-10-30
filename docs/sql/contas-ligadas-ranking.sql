-- ✅ APLICADO 30/10 (Diego: "não quero deixar o Arruda ganhar pts no ranking qd jogar c/ as contas dele").
-- 🕵️ CONTAS LIGADAS: duas (ou mais) contas da MESMA pessoa ficam no mesmo `grupo`. Título ganho numa sala em que
-- TODOS os outros humanos são do mesmo grupo NÃO conta pro ranking (semana, prêmio da semana, rank online, clãs).
-- Continua valendo na Sala de Troféus/perfil (esc_tacas_online, esc_perfil_publico não mudaram).
-- Quem não está na lista não muda NADA (caminho rápido: `not in (select conta::text ...)` antes da função).
-- Pra ligar mais uma pessoa: insert into esc_contas_ligadas (conta, grupo, motivo) values (<uuid>, '<grupo>', '<por quê>');
-- Ninguém é colocado aqui por suspeita: só com prova (no 1º caso, a 2ª conta tinha o nome dele no e-mail).
create table if not exists public.esc_contas_ligadas (
  conta uuid primary key, grupo text not null, motivo text, criado_em timestamptz not null default now());
alter table public.esc_contas_ligadas enable row level security; -- sem política: só as funções leem

create or replace function public.esc_titulo_vale(hr jsonb, uid text) returns boolean
language plpgsql stable security definer set search_path = public as $$
declare g text;
begin
  if uid is null then return true; end if;
  select grupo into g from esc_contas_ligadas where conta::text = uid;
  if g is null then return true; end if;
  return not exists (select 1 from jsonb_array_elements(coalesce(hr, '[]'::jsonb)) o where o->>'user_id' is distinct from uid)
    or exists (
      select 1 from jsonb_array_elements(coalesce(hr, '[]'::jsonb)) o
      where o->>'user_id' is distinct from uid
        and not exists (select 1 from esc_contas_ligadas b where b.grupo = g and b.conta::text = o->>'user_id'));
end $$;

insert into public.esc_contas_ligadas (conta, grupo, motivo) values
  ('778abaf0-3e09-4723-8b3f-5d955f0912ae', 'geovany', 'Tricolor do Arruda FC (principal) — Diego 30/10'),
  ('da5d1de7-6aad-4886-b32e-54f8f3f077d3', 'geovany', 'Cobra Coral do Arruda / G_1MPACT (2ª conta) — Diego 30/10')
on conflict (conta) do nothing;

-- E nas 4 funções do ranking (esc_rank_online, esc_titulos_por_uid, esc_vitrine_salas, esc_fecha_semanas) entrou,
-- no filtro de cada título:
--   and (x->>'user_id' is null or x->>'user_id' not in (select conta::text from esc_contas_ligadas)
--        or esc_titulo_vale(g.human_results, x->>'user_id'))
-- Medido: vitrine ~0,09s (sem o caminho rápido ia a 0,4–0,7s — não tirar o `not in`).
