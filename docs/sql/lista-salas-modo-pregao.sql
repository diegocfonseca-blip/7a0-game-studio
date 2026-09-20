-- ─── 🐊 O MODO DO PREGÃO NA LISTA DE SALAS ABERTAS ──────────────────────────
--
-- Diego (20/09), olhando a lista de salas: *"ainda não tá aparecendo o selo do
-- modo Tocaia… pode ser um jacaré talvez. E o padrão às cegas coloque outro
-- emoji"*.
--
-- 🔍 POR QUE NÃO APARECIA (não era o selo, era o DADO): a lista de salas abertas
-- **não baixa o `game_state`** desde 09/09. Naquela noite ela extraía 15 campos
-- com `->>` e o Postgres descomprimia o JSON (50–200 KB) UMA VEZ POR CAMPO —
-- 3,5 s por consulta, 400 consultas/min, o banco parou. Desde então os campos
-- moram em colunas magras `ls_*`, preenchidas por gatilho. `holandes` nunca
-- ganhou coluna, então na lista ele chegava sempre `undefined` e o selo nunca
-- acendia. O código estava certo; faltava o dado.
--
-- ✅ O QUE ESTE ARQUIVO FAZ (e o que ele NÃO faz):
--   · cria a coluna `ls_holandes`;
--   · cria um gatilho PRÓPRIO e SEPARADO pra ela.
--   · **NÃO encosta no `game_rooms_colunas_magras`** que já está no ar. É a
--     lição do `online-copa-clock-preview.sql`: *"antes de mexer nessa função de
--     novo, LEIA o prosrc do banco e edite em cima dele — reaplicar o arquivo
--     inteiro fecharia a Copa da sala"*. Aqui não precisa nem ler: dois gatilhos
--     BEFORE na mesma tabela convivem numa boa, cada um escrevendo a SUA coluna.
--
-- 🛡️ É SEGURO RODAR COM GENTE JOGANDO:
--   · `add column` de coluna NULA é instantâneo — não reescreve a tabela, não
--     trava ninguém (diferente de uma coluna `generated … stored`, que reescreve);
--   · nada lê `ls_holandes` até o código novo subir, e o código novo já sobe com
--     rede: se a coluna não existir, ele volta pro formato antigo sozinho e a
--     lista continua de pé (sem o selo);
--   · não precisa preencher as salas que já estão de pé: o gatilho é `before
--     insert or update`, e toda sala viva é regravada em segundos (o host bate
--     o heartbeat no lobby a cada 30s e salva o jogo a cada 3s).
--
-- ↩️ PRA DESFAZER: `drop trigger game_rooms_coluna_pregao on public.game_rooms;`
--    e `alter table public.game_rooms drop column ls_holandes;` — o resto do
--    jogo não sabe que ela existe.

-- 1) a coluna magra do modo do pregão ('true' = 🐊 Tocaia · 'false' = ✉️ às cegas)
alter table public.game_rooms add column if not exists ls_holandes text;

-- 2) o gatilho SÓ dela (não mexe no gatilho das outras 15 colunas)
create or replace function public.game_rooms_coluna_pregao() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  new.ls_holandes := case when (new.game_state->>'holandes') = 'true' then 'true' else 'false' end;
  return new;
end $$;

drop trigger if exists game_rooms_coluna_pregao on public.game_rooms;
create trigger game_rooms_coluna_pregao
  before insert or update on public.game_rooms
  for each row execute function public.game_rooms_coluna_pregao();

-- 3) conferência (deve devolver as salas das últimas 6h com o modo de cada uma)
-- select code, ls_holandes, ls_name from public.game_rooms
--  where created_at > now() - interval '6 hours' order by created_at desc;
