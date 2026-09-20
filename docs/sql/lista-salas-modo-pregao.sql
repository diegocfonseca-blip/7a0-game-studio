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
-- moram em colunas magras `ls_*`, preenchidas pelo gatilho
-- `game_rooms_colunas_magras_trg`. `holandes` nasceu depois e nunca ganhou
-- coluna, então na lista ele chegava sempre vazio e o selo nunca acendia.
-- O código do selo estava certo; faltava o dado chegar nele.
--
-- ✅ ESTE ARQUIVO FOI ESCRITO EM CIMA DO QUE ESTÁ NO AR, não de memória.
-- O corpo da função abaixo é o `pg_get_functiondef` LIDO DO BANCO em 20/09,
-- com UMA linha a mais (`ls_holandes`) e nada mais mudado — nem uma vírgula,
-- nem a trava de cima (`is not distinct from`), que é o que faz o gatilho não
-- trabalhar à toa quando só o `updated_at` muda.
-- É a lição escrita no `online-copa-clock-preview.sql`: *"antes de mexer nessa
-- função de novo, LEIA o prosrc do banco e edite em cima dele"*.
-- Se você for reaplicar isto MESES depois, **leia o prosrc de novo antes** —
-- outra sessão pode ter acrescentado uma coluna no meio tempo, e reaplicar esta
-- versão apagaria ela:
--   select pg_get_functiondef(p.oid) from pg_proc p
--     join pg_namespace n on n.oid = p.pronamespace
--    where n.nspname = 'public' and p.proname = 'game_rooms_colunas_magras';
--
-- 🛡️ É SEGURO RODAR COM GENTE JOGANDO:
--   · `add column` de coluna NULA é instantâneo — não reescreve a tabela e não
--     tranca ninguém (diferente de uma coluna `generated … stored`);
--   · o `create or replace function` troca o corpo do gatilho sem derrubar o
--     gatilho nem a tabela;
--   · o código do jogo já está no ar com REDE: se a coluna não existir, a lista
--     cai sozinha no formato antigo e continua de pé (só sem o selo). Por isso
--     código e SQL podiam subir em qualquer ordem.
--
-- ↩️ PRA DESFAZER: rode de novo o corpo da função SEM a linha do `ls_holandes`
--    e, se quiser, `alter table public.game_rooms drop column ls_holandes;`.
--    O resto do jogo não sabe que ela existe.

-- 1) a coluna magra do modo do pregão
--    ('true' = 🐊 Tocaia · NULL/'false' = ✉️ às cegas, que é quem não grava a chave)
alter table public.game_rooms add column if not exists ls_holandes text;

-- 2) o MESMO gatilho das outras 15 colunas, com uma linha a mais no fim
create or replace function public.game_rooms_colunas_magras()
 returns trigger
 language plpgsql
as $function$
begin
  if tg_op = 'UPDATE' and new.game_state is not distinct from old.game_state then
    return new;
  end if;
  new.ls_tag    := new.game_state->>'__game';
  new.ls_name   := new.game_state->>'roomName';
  new.ls_deck   := new.game_state->>'deck';
  new.ls_varzea := new.game_state->>'varzea';
  new.ls_mode   := new.game_state->>'mode';
  new.ls_at     := new.game_state->>'ligaAt';
  new.ls_career := new.game_state->>'careerOnline';
  new.ls_manual := new.game_state->>'manual';
  new.ls_copa   := new.game_state->>'copaMode';
  new.ls_liga   := new.game_state->>'ligaFechada';
  new.ls_locked := new.game_state->>'locked';
  new.ls_stream := new.game_state->>'stream';
  new.ls_pw     := new.game_state->>'pwHash';
  new.ls_chat   := new.game_state->>'chatOff';
  new.ls_duplas := new.game_state->>'duplasMode';
  new.ls_holandes := new.game_state->>'holandes';   -- 🐊 20/09
  return new;
end $function$;

-- 3) AS SALAS QUE JÁ ESTÃO DE PÉ — este passo é obrigatório, não é enfeite.
--    O gatilho é `BEFORE INSERT OR UPDATE **OF game_state**`, e a sala parada na
--    SALA DE ESPERA só grava `updated_at` de 30 em 30s (o batimento do host) —
--    o `game_state` dela não muda, então o gatilho não dispara e a coluna ficaria
--    vazia até o pregão começar. São poucas dezenas de linhas (a lista só mostra
--    salas das últimas 6h) e este UPDATE não encosta no `game_state` nem no
--    `updated_at`, então não mexe no "host vivo" de ninguém.
update public.game_rooms
   set ls_holandes = game_state->>'holandes'
 where created_at > now() - interval '6 hours'
   and ls_holandes is distinct from (game_state->>'holandes');

-- 4) conferência: deve listar as salas das últimas 6h com o modo de cada uma
select code, ls_name, ls_holandes, status
  from public.game_rooms
 where created_at > now() - interval '6 hours'
 order by created_at desc;
