-- 👥 18/10 (Diego, "estilo Orkut" SEM comunidades): AMIGOS + PERFIL PÚBLICO. Aplicada via MCP, em pedaços.
-- Só a tela da conta do Diego enxerga por enquanto (gate no cliente: AMIGOS_GERAL/AMIGOS_TESTERS em sport.ts).
-- Nada aqui devolve e-mail. Definição viva de cada função: select pg_get_functiondef('public.<nome>'::regproc);
--
-- Tabela esc_amizades (id, de, para, status 'pedido'|'aceito', criado_em, aceito_em, ativo):
--   · par único (least/greatest), RLS ligada SEM policy (só as funções mexem);
--   · desfazer/recusar = ativo false (nunca apaga linha); pedir de novo reaproveita a linha.
-- Funções (security definer, só authenticated):
--   esc_amigo_pedir(p_para uuid) → 'enviado'|'aceito' (o outro já tinha pedido)|'ja'|'limite'|'erro'  (50 pedidos abertos · 500 amigos)
--   esc_amigo_responder(p_id bigint, p_aceita boolean) → 'ok'|'erro' (só quem RECEBEU)
--   esc_amigo_desfazer(p_outro uuid) → 'ok'|'erro'
--   esc_amigos_lista() → amizade_id, outro, nome, relacao ('aceito'|'recebido'|'enviado'), visto_em (live_beats/game_plays),
--                        tela ('modo:tela' da última batida, só de amigo), online (batida < 3 min)
--   esc_perfil_publico(p_uid uuid) → jsonb {uid, nome, clube, tier, fundador_n, titulos{ligas, serie_a, copas, supercopas,
--                        libertadores, champions, mundial, copa_mundo, temporadas, salas}, amigos_total, amigos[8], relacao, amizade_id, sou_eu}
--     títulos da carreira = última temporada de CADA carreira em esc_pyramid_rank_snap (já é o acumulado), somadas;
--     salas = game_champions.champion_user_id.
--   esc_nome_conta(uuid) → display_name (interna, sem grant).
create table if not exists public.esc_amizades (
  id bigserial primary key,
  de uuid not null references auth.users(id) on delete cascade,
  para uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pedido' check (status in ('pedido', 'aceito')),
  criado_em timestamptz not null default now(),
  aceito_em timestamptz,
  ativo boolean not null default true,
  check (de <> para)
);
create unique index if not exists esc_amizades_par on public.esc_amizades (least(de, para), greatest(de, para));
alter table public.esc_amizades enable row level security;
