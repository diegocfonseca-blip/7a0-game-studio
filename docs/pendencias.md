# 📌 Pendências combinadas com o Diego (atualizado 14/08/2026)

## 🌍 RANKING GLOBAL de usuários (aba Rank) — ✅ NO AR (14/08, mockup aprovado)
Pedido do Diego: rank mundial de USUÁRIOS de verdade (bots já têm o rank local),
mesma régua do ranking do save (títulos A›Mundo›Copa›B›C›D, depois dinheiro),
**top 50**, sub-aba própria do lado de Clubes/Artilheiros. Regra de ouro dele:
**anti-spoiler por temporada** — se eu tô na T15 e o outro já foi pra T89, só
vejo o que ele tinha feito ATÉ a T15 (nem um pouco do futuro dele). Só conta
carreira feita com **Agência 2.0** (`agenciaOn` — a mesma trava das 2 sub-abas
em Elenco); carreira antiga fica de fora.
- **Banco** (projeto certo é `faabglpjutwursgmrpny` — o `supabase/config.toml`
  do repo aponta pra OUTRO projeto errado/morto, cuidado se for usar ele de
  referência): tabela nova `esc_pyramid_rank_snap` (user_id, season_no, nome do
  time, títulos A/B/C/D/V, Copa Legends, Copa do Mundo, dinheiro) — um retrato
  POR TEMPORADA de cada usuário, não só o estado atual. RLS: todo mundo LÊ,
  cada um só grava a PRÓPRIA linha. Função `esc_pyramid_rank(p_season, p_limit)`
  pega, pra cada usuário, o retrato mais recente **ATÉ** p_season (nunca depois)
  — é isso que impede o spoiler — e devolve já ordenado/limitado. Testado na mão
  (2 usuários fake, um "do futuro") — bateu certinho.
- **Grava o retrato**: `pyramidseason.tsx` (dentro de `PyramidSeasonScreen`), um
  `useEffect` que dispara 1× por temporada nova (só carreira offline com
  `agenciaOn`) e sobe pro Supabase (melhor esforço — sem login/net, o jogo
  segue normal, só o rank de quem tá sem conta que não atualiza).
- **Lê o retrato**: `GlobalRankTab` (nova, mesmo arquivo) — sub-aba "🌍 Global"
  (só aparece com Agência 2.0 liberada), busca via RPC, mostra banner roxo
  fixo explicando o trava-por-temporada, badges de troféus iguais ao rank
  local, sua linha destacada (mesmo fora do Top 50).
- ⚠️ Não consegui testar dentro do jogo de ponta a ponta (precisaria de 2
  contas jogando carreiras de verdade) — testei a função do banco isolada e o
  build passou limpo. Se aparecer algo estranho, avisar.
- Reversível: `git revert` no código; a tabela nova no banco fica órfã mas
  inofensiva (não é lida em lugar nenhum se reverter o código).
- ⏳ PRÓXIMO PASSO (pedido pelo Diego): montar mockup pra Stories/Feed do
  Instagram anunciando essa feature.

## 🗺️ GUIA DA CARREIRA — banners de desbloqueio explicado — 🚧 EM ANDAMENTO (13/08)
Diego: muita gente começa a carreira e não entende nada (Agenciados, Estádio, quando
o salário chega, etc.) — pediu um sistema de avisos que explica cada mecânica NA
HORA em que ela passa a valer, uma vez só. Fiz mockup visual (aprovado) antes de
codar. Pesquisei as condições REAIS no código (nada de números inventados) e simulei
uma carreira de 120 temporadas pra achar TODOS os marcos (SAF, Multiclubes, Copa do
Mundo, extras do estádio, Departamento Médico etc.) — relatório completo na sessão,
não copiado aqui por ser longo demais; qualquer sessão que continuar isso deve pedir
o relatório de novo se precisar (perguntar ao Diego ou re-analisar o código).
- **Infra nova**: `unlockbanner.tsx` (`UnlockBanner`, componente reusável — módulo à
  parte pra não criar import circular entre `estadio.tsx` e `pyramidseason.tsx`).
  `state.careerSeen: Record<string, true>` (types.ts) marca banners já fechados
  ("Entendi!" → dispatch `MARK_CAREER_SEEN`) — nunca mais aparece NESTA carreira,
  zera só na fundação de carreira nova (mesmo lugar da "faxina anti-herança").
- **✅ 1ª leva NO AR (13/08)**: Substituições liberadas (T2) · Salário chegou (T4) ·
  Seu estádio já rende (base +20 fixa) · Departamento Médico pronto (acaba com lesão
  pra sempre) · Você comprou a SAF · Virou profissional (saiu da Várzea).
- **⏳ PENDENTE (próxima leva, planejado no mockup)**: Agenciados (versão rica —
  como ganha carta, convoca 22, as 2 formas de renda), Premiações (valores reais por
  divisão: campeão V15/D20/C35/B50/A65 + acesso + queda), Categoria Lenda destrava
  (junto com a SAF), Multiclubes comprado. Diego pediu explicitamente pra NÃO fazer
  banner de "Dinastia" (6 títulos da Série A) — achou bobeira / incentiva o cara a se
  gabar. Não reintroduzir essa ideia.
- **Bônus corrigido no caminho (13/08)**: 2 números errados na tela de artilharia —
  prêmio do artilheiro por divisão mostrava METADE do valor real (D+4/C+8/B+12/A+16
  → corrigido pra V+6/D+10/C+15/B+20/A+30) e o piso do artilheiro da Copa Legends
  mostrava +16 (correto é +10, igual à liga). Só texto, os valores que o jogo já
  pagava sempre estavam certos.
- ⚠️ Reversível: cada banner é independente (`git revert` no commit, ou remover 1
  chamada de `UnlockBanner` não afeta as outras). Não mexe no online nem no futebol.
- **✅ Malandro de 11 jogadores — CORRIGIDO (13/08)**: Diego reportou que quem nunca
  compra reserva (fica sempre com exatamente 11) driblava TODO evento de jogador
  (noitada/expulsão/lesão) — sem reserva na posição, virava só manchete de zoeira,
  nada travava. Corrigido: `EVENTO_SET_NO_RESERVE` (store.tsx) sobe um 🌱 Cria da
  Base pra tapar o buraco de verdade (mesmo mecanismo da crise financeira/contrato
  vencido) — ruim, sem contrato, some sozinho quando compra reforço de verdade. Vale
  em qualquer divisão (Diego não tinha certeza se devia travar só a partir da Série
  D — deixei valendo geral por consistência com os outros casos de Cria da Base; se
  ele quiser restringir depois é só adicionar a checagem de divisão). Banner novo
  (`k="criabase"`) explica na 1ª vez que acontece.
- **✅ Backfill pra quem já tá em carreira (13/08)**: Diego apontou que carreira EM
  ANDAMENTO (de antes do Guia) ia mostrar TODOS os banners de uma vez, mesmo etapa
  antiga (ex: "Salário chegou" pra quem já paga desde a T4 e tá na T20). Corrigido
  com `BACKFILL_CAREER_SEEN` (store.tsx): roda 1x nesses saves (só quando
  `careerSeen` nunca existiu), marca como "já visto" o que já passou — só o que
  ainda vem pela frente (Médico, SAF, próximas etapas) avisa de verdade. Carreira
  NOVA não passa por aqui (já nasce com `careerSeen: {}` na fundação).

## ⚡🧤 FIX: pênalti interativo — goleiro "não pega" a bola + acertar o verde não fazia gol — ✅ NO AR (14/08)
Diego reportou dois problemas no pênalti (🎯 Você bate): "o goleiro defende e a bola
nem parece que tá na luva" + "acertando várias vezes na cor verde na hora de bater
e ainda assim não sai gol". Achados os dois no código de `PenaltyBanner`
(`pyramidseason.tsx`):
1. **Bug real de lógica**: em `travar()`, mesmo acertando o VERDE (`onTarget`), só
   valia gol se TAMBÉM tivesse mirado num canto de CIMA (`aimZ<3`) E acertado uma
   faixa ainda mais fina dentro do verde (`err<half*0.55`) — trava escondida que a
   tela nunca avisa. Mirando canto de BAIXO (3/4/5), era IMPOSSÍVEL sair gol mesmo
   acertando o verde na mosca. Corrigido: acertar o verde agora É perigo de gol de
   verdade — só defende se o goleiro "ler" o canto (32%, mesmo de antes), sem mais
   depender de qual canto ou de precisão extra escondida.
2. **Bug visual**: `moveKeeper` usava uma escala fixa (`×2.3`/`×1.05`) sem relação
   nenhuma com o tamanho real do gol na tela, enquanto `flyBall` (a bola) calculava
   a posição em % do tamanho de verdade (`goalRef.clientWidth/Height`) — os dois
   apontavam pra lugares DIFERENTES na mesma "zona", por isso a defesa nunca parecia
   pegar a bola de verdade. Corrigido: goleiro agora usa a MESMA base de cálculo da
   bola (% do goalRef). Testei visualmente as 6 zonas num teste isolado (mesma
   fórmula, fora do app) — bola e luva caem juntas no mesmo canto agora.
- Também removido o SELO de categoria (👑 Lenda / ⭐ Craque / etc.) da escolha do
  cobrador, a pedido do Diego.
- Build ok. Não consegui testar no jogo real de ponta a ponta (precisa cair numa
  temporada com jogo decisivo) — se ainda estiver estranho, avisar que reverto.
- Reversível: `git revert`. Só mexe no banner de pênalti, nada mais.

## 🐛🕰️ FIX: tela do leilão "travava" pra quem tá com saldo negativo — ✅ NO AR (14/08)
Relato do Diego (com print): técnico devendo (saldo negativo — vira espectador,
sem lance pra dar) via a tela de revelação/martelo travar de vez em quando, só
resolvia dando F5. Não achei um bug de LÓGICA do jogo (Monte Final e desempate
foram descartados com prova — não travam por saldo negativo). Explicação mais
provável: quem tá de espectador não toca na tela, então se a aba do navegador
fica em 2º plano nesse meio tempo (troca de janela/app), o navegador ATRASA ou
pausa o `setTimeout` que passa a carta sozinha — o timer nunca disparava e a
revelação ficava presa até recarregar.
- Correção em `AutoAdvance` (`screens.tsx`, componente que avança a revelação
  do leilão sozinho): trocado o `setTimeout` cego por PRAZO com relógio real
  (`Date.now()`) + um poll de reforço a cada 1s + um gatilho no
  `visibilitychange` (quando a aba volta a ficar visível). Se o navegador
  atrasou o timer, assim que ele volta a rodar de verdade (ou você volta pra
  aba) o jogo vê que o prazo já passou e avança na hora — sem precisar de F5.
- Escopo mínimo, só a tela de revelação do leilão (onde o print mostrava a
  trava) — não mexe em Monte Final, desempate, liga ou Copa.
- Reversível: `git revert`. Não muda o RITMO nem o TEMPO normal de ninguém —
  só destrava quem ficaria preso esperando um timer atrasado.
- ⚠️ Ainda não é 100% certeza (não consegui reproduzir a trava de propósito) —
  se voltar a acontecer mesmo com essa correção, o próximo passo é logar o
  `state.phase`/`revealIdx` no momento da trava pra achar outra causa.

## 📝💰 RENOVAÇÃO DE CONTRATO: escada por valor + Várzea sem renovação — ✅ NO AR (14/08)
Reforma pedida pelo Patrick (usuário) + retrabalhada a fundo com o Diego (várias
rodadas calibrando pra nunca ter "opção dominada" — prazo mais longo NUNCA pode
custar igual ou menos que um mais curto, senão ninguém escolheria o curto).
- ⚠️ **CORRIGIDO (14/08, entendimento errado na 1ª tentativa)**: Várzea NÃO manda
  jogador pro leilão quando o contrato "venceria" — o relógio do contrato **pausa**
  enquanto o time tá lá. `applySeasonMoney`-adjacent (a virada de temporada, logo
  após `s.careerPlacements = action.placements`): se a divisão nova do manager é
  'V', soma +1 em `contratoAte` de TODO o elenco, junto com o `seasonNo++` que vem
  logo depois — cancela o avanço, "congela" quantos anos faltavam. Quando o time
  sobe de novo pra Série D+, o relógio RETOMA do ponto exato onde parou (2 anos
  faltando quando caiu → ainda 2 anos faltando quando sobe, não importa quantas
  temporadas ficou lá embaixo). Efeito: a lista de "vencidos" fica SEMPRE vazia em
  Várzea → a tela de contratos inteira some sozinha (nem aparece botão de renovar
  nem de "deixar ir" — não existiam pra sumir, o painel só não renderiza).
  RENEW_CONTRACT e RELEASE_CONTRACT também têm trava explícita de divisão (reforço,
  já que o freeze sozinho já deveria bastar). Vale JÁ pra quem já tá na Várzea.
- **Série D pra cima**: `renewOptions(oficial)` / `renewCost(oficial, anos)` em
  `store.tsx`. Abaixo de 10 moedas = tabela fixa calibrada valor a valor pelo Diego
  (1 a 9, cada um com só os prazos que fazem sentido — 1/2/3/5 anos, nunca 10). A
  PARTIR de 10 moedas (jogador "de verdade") = só 5 e 10 anos, fórmula: 5 anos =
  metade (ceil), 10 anos = 90% arredondado pro mais PRÓXIMO (não é floor — testado
  contra 15 moedas = 14, não 13). Testei em script isolado: **nenhuma opção
  dominada de 1 a 600 moedas**, todas as âncoras do Diego batem.
- UI (`pyramidseason.tsx`, tela reserveList): os botões de renovar agora são
  DINÂMICOS — só aparecem os prazos que `renewOptions` liberar pra aquele valor,
  cada um com sua cor (dourado=10, verde=5, azul claro=1-3).
- Reversível: `git revert`. Não muda nada da lógica do leilão/liga.
- ❌ "Saída de emergência" (quebrar contrato com multa) e "vender reserva pro
  banco": foram cogitadas mas o Diego NÃO quer — descartadas, não implementar.

## 🏎️⚽ Ferrari SC (batismo adriano.ferrari) — ✅ NO AR (14/08)
Kit visual do time do adriano.ferrari@quepazseguros.com.br. Arte AUTORAL (piloto de
macacão vermelho + capacete do Brasil dirigindo uma BOLA de futebol gigante com rodas).
- ⚠️ **REGRA DE MARCA**: o Diego pediu MUITAS vezes o cavalo/escudo IDÊNTICO da Ferrari
  (inclusive "só mudando detalhes"). **NÃO foi feito** — é marca registrada e poria o
  site (ao vivo, no nome dele) em risco. Mesma regra dos clubes reais. A arte final é o
  piloto-na-bola, SEM o emblema/cavalinho da Ferrari (esse detalhe do render dele ficou
  de fora de propósito). Se ele insistir de novo: continua sendo NÃO.
- **Manto** vermelho/preto: `manto.ts` MANTO_CONTAS (por e-mail) — já vale, é só cor.
- **Escudo/Mascote = ARTE PRÓPRIA do dono** (imagens webp que o Diego mandou, exceção de
  batismo — igual Sapekeiros/Eros). Cavalo-piloto de macacão vermelho + capacete do Brasil,
  SEM emblema da Ferrari (o Diego regerou sem a marca; conferido). TROCA pedida pelo Diego:
  `img/ferrari-escudo.webp` = cavalo gritando GOL; `img/ferrari-mascote.webp` = cavalo no
  carrinho de bola. A pilotBallSC vetorial ficou em `escudos.tsx` só como fallback (não é usada).
  - 🧼 **RECORTE DE FUNDO (14/08)**: o "fundo transparente" dos PNGs dele era FALSO — o
    xadrez vinha PINTADO nos pixels e apareceu atrás da arte no jogo (reclamação dele).
    Recorte real por inundação a partir das bordas + limpeza dos retalhos presos entre as
    rodas e do chão quadriculado. Se ele mandar arte nova, CONFERIR se o fundo é
    transparência de verdade antes de embutir.
  - Escudo: `ferrariSCRender` → `<img ferrari-escudo.webp>`. LOGOS_PRONTAS: 'Ferrari SC'/
    'Ferrari FC'/'Ferrari'. Vale pelo NOME — já aparece.
  - Mascote: MASCOTES['piloto_bola'] → `<img ferrari-mascote.webp>`. Pro festão.
- **Manto**: vermelho/preto/**branco** (3 cores). MANTO_CONTAS (email) dá vermelho+preto;
  MANTO_TRI['piloto_bola'] = branco (3ª cor).
- ✅ **DB do sócio ATUALIZADO (14/08, direto pelo Claude no Supabase — sócio nº10, já
  existia desde 09/08 com validade até 2100, só faltava a personalização)**: `esc_socios`
  manto_c1='#C2452F', manto_c2='#141414', mascote_key='piloto_bola', escudo_time='Ferrari SC',
  time_coracao='Corinthians', origem='batismo'. Nada mais pendente no painel — escudo,
  mascote (festão) e manto tricolor valem pra ele já na próxima aberta do jogo.
- Reversível: `git revert` (código) / UPDATE esc_socios (banco). Só afeta esse time/conta.
- 🔧 Pendente do gosto do Diego: ele queria a qualidade de RENDER (imagem gerada). Vetor
  à mão não chega lá; se um dia ele mandar o ARQUIVO (webp) de uma arte SEM marca, dá pra
  embutir igual Sapekeiros/Eros.



## 🐞🌐 FIX GRAVE: ONLINE virava DOIS HOSTS (dessincronia total na Copa) — ✅ NO AR (13/08)
Relato do Diego (sala "Sapekeiro FC", jogo rápido online): no meio do leilão o host
(Sapekeiro) foi TROCADO sozinho — apareceu pra outro que ELE virou host — mesmo com o
Sapekeiro **online, na mesma tela, sem trocar de app**, só demorando pra jogar. Daí a sala
ficou com **dois donos** e cada aparelho passou a rodar a própria simulação: liga e Copa
**dessincronizadas** (campeão diferente pra cada um, eliminado pra um e pra outro não,
jogador sumindo do campinho). A Copa é determinística (mesma tabela + mesma semente = mesmo
campeão) → só diverge com >1 host rodando com semente/tabela própria.
- **RAIZ**: pra economizar egress, o host fica CALADO no Realtime até ~12s quando não há
  jogada nova (leilão parado). O convidado lia esse silêncio como "host caiu" em 10s e, com
  um piscar de presença, se auto-promovia — e o host antigo NUNCA era rebaixado → dois donos.
- **FIX (5 partes, `store.tsx`, só online; futebol offline/normal intocado):**
  1. Ação **STEP_DOWN_HOST** (host antigo abaixa a bola → vira convidado).
  2. **Ping "tô vivo"** do host a cada 4s (broadcast de POUCOS BYTES no canal já aberto —
     NÃO é o estado de ~100KB, NÃO toca no banco). Convidado marca "host vivo" por aqui →
     ficar quieto não parece mais que caiu.
  3. Convidado escuta o `host_ping` (zera o relógio de "host sumiu").
  4. **Anti-roubo**: a promoção de novo host só rola se o **batimento do banco**
     (`game_rooms.updated_at`, que o host já grava a cada ~3s) estiver SECO (>9s). Host vivo
     e batendo NUNCA é usurpado. (Custo zero: é a MESMA leitura, só +1 coluna.)
  5. **Regra de ouro (UM DONO SÓ)**: o host confere no banco quem é o `host_id` a cada 5s
     (usando `youUid`, sem chamada de auth na rede); se a posse já é de OUTRO, ABAIXA A BOLA
     na hora. Impossível ficar com dois hosts. Leitura nula/erro NÃO rebaixa (rede ruim não
     tira o dono legítimo).
- ⚠️ Reversível: `git revert` desse commit volta ao de hoje. Não muda o fluxo normal
  (leilão/liga/Copa com rede boa) — só o "e se o dono cair" passa a se comportar direito.
- 🔎 A investigar se reincidir: janela de ~5s em que um host que RECONECTA pode mandar 1
  estado velho antes de detectar que deve ceder (auto-corrige no próximo estado do novo dono).



## ⚽ CARREIRA: pênalti decisivo — ✅ NO AR (12/08, deploy junto com a reforma do estádio)
Feature nova SÓ na carreira OFFLINE (online intocado). Aprovada visualmente pelo Diego
via protótipo (artifact pen_full). Aparece **0-2x/temporada** (sorteio fixo por semente),
SÓ em **jogo de última hora onde um gol empata ou vira** (você empatando = 1 gol vira;
perdendo por 1 = 1 gol empata). Abre no FIM da animação (tempo morto — não atrasa ritmo).
- `types.ts`: `careerPenalty` (mgrId → índice 0-based do jogo → {scored, taker}). Zera
  por temporada. `store.tsx`: action **SET_PENALTY** (travas: só offline; cobrador REAL
  do elenco, sem fake; grava 1x — não re-bate no reload).
- **MOTOR** (`pyramidseason.tsx`): `penaltyPlan(seasonSeed)` sorteia 0-2 índices de jogo
  (rodadas 5..35). O motor SÓ soma **1 gol** ao humano no min 90 se `scored` — sem rng,
  resultado já decidido pelo jogador. Com `careerPenalty` vazio a simulação é
  **byte-idêntica** (não afeta ninguém). ⚠️ Chave = índice 0-based do jogo atual
  (`round-1`) — o motor lê por esse índice. (A substituição do intervalo usava `round`
  por engano → CORRIGIDO, ver abaixo.)
- UI: `PenaltyBanner` com **2 modos num toggle** (🎯 Você bate: mira 6 cantos + trava a
  força no verde; 🎙️ Bate sozinho: narração de suspense, pontinhos um a um). Header mostra
  o JOGO (mandante 🏠 esquerda × visitante ✈️ direita, placar de cada, SEU time em ouro).
  Categoria do cobrador (Foi Profissional→Lenda) manda no acerto/tamanho do verde. Gol →
  GOOOOL + confete (+ **mascote de quem TEM mascote**; sem mascote = só a festa). Depois
  de BATER **não volta** (trava modo/cobrador). Fundo = manto do tier do usuário.
- ⚠️ Reversível: `git revert`. Não toca no futebol online nem em carreiras sem pênalti.

## 🐞 FIX: pênalti decisivo disparando toda hora (só na conta do Diego) — ✅ CORRIGIDO (13/08)
Diego reportou: "está passando duas, três rodadas está tendo pênalti... dá nem pra jogar
direito" — quando o certo é 0-2x/temporada (às vezes zero). Causa: `PEN_TEST_TESTERS` em
`sport.ts`, um modo de teste temporário criado em 12/08 (ligado SÓ na conta dele) pra ele
conferir os dois modos do `PenaltyBanner` sem esperar a raridade sortear — e esquecido
ligado. `usePenaltiTeste()` fazia `penPlanned || penTeste` pular direto o `penaltyPlan()`
raro. Corrigido esvaziando `PEN_TEST_TESTERS` (`new Set<string>([])`) — a conta dele volta
a seguir a mesma raridade sorteada de todo mundo. Motor (`penaltyPlan`) nunca teve bug,
sempre foi só o teste ligado. ⚠️ Reversível: `git revert`. Não mexe em mais nada.

## 🐞 FIX: pênalti "aparecia do nada já com o placar pronto" — ⚠️ diagnóstico incompleto (13/08)
Primeira tentativa: achei que era só o técnico estar em Tabelas/Elenco/Rank enquanto a
rodada decisiva rolava — corrigi trocando pra aba Jogos sozinho quando `penMode` liga
(igual a Copa já faz). Isto ficou (é bom de qualquer forma), MAS Diego confirmou que
mesmo JÁ na aba Jogos, olhando o jogo, o pênalti continuava abrindo com placar de OUTRO
jogo — não era isso. Causa real, achada depois: ver entrada abaixo (corrida de timers).

## 🐞 FIX: pênalti abria com o placar de OUTRO jogo (corrida de timers) — ✅ CORRIGIDO (13/08)
Causa raiz de verdade, achada com o relato específico do Diego ("o jogo 1 tava
terminando, quando acaba já abriu o pênalti mostrando resultado de 2x2 EM OUTRO jogo" +
"depois do leilão mal começou o jogo já abrindo pênalti, como se nem visse a simulação").
Existiam DOIS relógios (`setTimeout`) rodando em paralelo e independentes: um decidia
quando a rodada troca sozinha (`roundMs` cheio) e outro decidia quando o pênalti pode
abrir (`roundMs*0.85+250`, sempre um pouco ANTES). Em corrida (mais comum em rodada
rápida/decisiva), a rodada podia virar ANTES do banner abrir — e quando abria, já lia os
dados da rodada NOVA (o jogo seguinte), não da que o Diego via na tela. Corrigido em
`pyramidseason.tsx`: os dois agora usam o MESMO sinal (`roundReady`) — a troca de rodada
só acontece DEPOIS que o jogo atual terminou de animar, no mesmo instante em que o
pênalti decide se abre. Não tem mais corrida entre os dois relógios. Ritmo do resto da
carreira não muda (a troca de rodada fica só ~250ms mais rápida). ⚠️ Reversível:
`git revert`. Não mexe no online (o auto-avanço aqui é só da carreira offline solo).

## 🐞 FIX: substituição no intervalo estava 1 rodada adiantada — ✅ CORRIGIDO (12/08)
Bug encontrado ao codar o pênalti e **comprovado em teste** (rodando `simulatePyramid`):
a troca do intervalo gravava em `careerHalftime[mgr][round]`, mas o jogo que está
rolando é o índice **`round-1`** (o motor lê por esse índice). Resultado: a substituição
não fazia efeito nenhum no jogo que você assistia — ela caía no PRÓXIMO jogo (1 rodada
adiantada). Corrigido pra `round-1` (dispatch do SET_HALFTIME + leitura do `halftimeDone`
em `pyramidseason.tsx`). O motor NÃO mudou → colocações de saves antigos não mudam
retroativamente; só as trocas NOVAS passam a valer no jogo certo. Só offline. Reversível.

## 🏟️ ESTÁDIO: renda por ocupação + 4 estabelecimentos — ✅ NO AR (12/08)
Reforma do torcidômetro (Diego): a renda deixa de ser bônus solto e passa a vir da
**LOTAÇÃO** — o estádio construído é o TETO (potencial); quanto enche de verdade sai da
**colocação final** (1º-4º lotado → … → 17º-20º às moscas). Piso pequeno garantido.
Gate: `agenciaOn` (carreira NOVA); carreiras antigas seguem no esquema velho (grandfather
via `extraNovaOnly`). 4 estabelecimentos novos pagos e encadeados: 🍔 Praça de Alimentação,
🍺 Choperia, 🚉 Estação/Acesso Fácil (+8% lotação), 🏨 Hotel do Clube. Ver `estadiodata.ts`
(`occByPos`, `stadiumOccupancy`, `stadiumIncomeAt`, `NEW_EXTRAS`) e `estadio.tsx`.
- 🎪 Casou com o "torcidômetro AO VIVO" de outra sessão (medidor reage à posição atual —
  `torcidaDeltaByPos`): são coisas separadas (medidor % vs renda 🪙), sem dupla contagem.
- ⚠️ Reversível: `git revert`. Só carreira NOVA (offline); antigas intocadas.

## 🐝👑 BATISMO: Sapekeiros FC (tiosapeka@gmail.com / @tiosapekagg) — ✅ NO AR (12/08)
Batismo do Tio Sapeka (Gaming Content Creator / Streamer / UGC Creator, presidente do
Sapekeiros FC). Coração **Santos**. Logo REAL do clube (abelha coroada com a bola) vira
escudo; a **abelha coroada** (arte do Gemini no mesmo estilo, recortada) vira mascote.
- `escudos.tsx`: `sapekEscudoRender` (webp `img/sapek-escudo.webp`, redondo) em
  `LOGOS_PRONTAS` pros nomes **'Sapekeiros FC'** e **'Sapekeiros'**.
- `mascotes.tsx`: `MASCOTES.sapek_abelha` (webp `img/sapek-mascote.webp`).
- `apoio.tsx`: FOUNDERS ouro + FUNDADOR_N **nº 41**.
- DB: `esc_socios` (sócio **nº21**, escudo_time='Sapekeiros FC', mascote_key='sapek_abelha',
  manto #0C0C0C/#C9A227 preto+dourado, time_coracao='Santos', origem='batismo') +
  `esc_nomes_batismo` (sapekeiros fc / sapekeiros) + `user_colors` tier ouro.
- ⚠️ Reserva de nome + kit (não substitui time de CPU). Reversível: `git revert` + apagar DB.

## 🔁 CARREIRA: substituição no intervalo — ✅ NO AR (12/08)
Feature nova SÓ na carreira OFFLINE solo (online intocado). Aprovada pelo Diego 12/08.
Toggle no Elenco: **Dinâmico** (padrão, como sempre foi) vs **Só no intervalo** (o jogo
pausa aos 45' e abre banner pra mexer no 2º tempo).
- `types.ts`: `careerSubMode` ('dinamico'|'intervalo') + `careerHalftime` (mgrId→rodada→
  {xi2, formation?, tactic?}). `store.tsx`: actions SET_SUBMODE/SET_HALFTIME (travas: 11
  reais distintos, sem fake, batendo a formação; só offline). Reset por temporada.
- **MOTOR** (`pyramidseason.tsx`): 2º tempo re-simulado com **rng ISOLADO** (semente =
  seed+rodada+time) só quando há decisão de intervalo do humano. Com `halftime` vazio o
  caminho é **byte-idêntico** ao de hoje → NÃO cascateia em outros jogos (não repete o
  bug "gols mudaram de dono"). `scoreGoals` agora devolve id e aceita rng/faixa própria.
- UI: relógio pausável aos 45' (`LiveScoreCard`) + `HalftimeBanner` (titulares|reservas,
  troca mesma posição até 3, formação, tática; **vale só o 2º tempo, não muda o próximo
  jogo**). Fundo = manto do TIER do usuário (perk.grad + brilho, igual Elenco); selo de
  posição neutro (não parecer Lenda). Rodada não anda enquanto o banner está aberto.
- ⚠️ Copa fica FORA (não anima 1º/2º tempo por jogo). Reversível: `git revert`.

## 🎮🐶 BATISMO: Eros FC (erosreis@outlook.com.br / @erosreis) — ✅ NO AR (12/08)
Batismo do Eros Reis, influencer de games nostálgicos (@erosreis). Time **Eros FC**,
mascote a cachorrinha **Nina**, manto **vermelho e cinza**. Escudo = arte própria do
dono (Eros com o videogame retrô). Aprovado pelo Diego 12/08 (mockup padrão v7).
- ✅ `escudos.tsx`: `erosEscudoRender` (webp `img/eros-escudo.webp`) em `LOGOS_PRONTAS`
  pros **4 nomes**: 'Eros FC', 'Eros Reis FC', 'Eros Reis', 'Eros' (todos mesmo escudo).
- ✅ `mascotes.tsx`: `MASCOTES.eros_nina` (webp `img/eros-nina-mascote.webp` — Nina nos
  cartuchos, controle no peito).
- ✅ `apoio.tsx`: FOUNDERS ouro + FUNDADOR_N **nº 40**.
- ✅ DB: `esc_socios` (sócio **nº20**, escudo_time='Eros FC', mascote_key='eros_nina',
  manto #C2452F/#7C7C7C, origem='batismo') + `esc_nomes_batismo` (os 4 nomes → eros) +
  `user_colors` tier ouro.
- ⚠️ NÃO substitui time de CPU (é só reserva de nome + kit do sócio) — Diego não indicou
  divisão. Se um dia quiser o Eros FC como time na pirâmide, aí entra em `data.ts`.
- ✅ **Na main (deploy 12/08)** — escudo/mascote/Lenda no ar; DB já estava no ar.
- Reversível: `git revert` do commit + apagar as linhas do DB.

## 🎽 CARREIRA: formações novas 3-4-3 e 5-3-2 ✅ NO AR (12/08)
Aprovado. **Só na carreira, meio de temporada** (o início segue só 4-3-3/4-4-2 — base do
leilão, `screens.tsx:1875`). Igual o 4-5-1.
- `types.ts`: FormationKey + FORMATIONS → **3-4-3** (GOL1 LAT2 ZAG1 MEI4 ATA3, ousado) e
  **5-3-2** (GOL1 LAT2 ZAG3 MEI3 ATA2, muralha). LAT fixo em 2 (igual todas), varia ZAG.
- `dinastia.tsx`: FORM_NEED ganhou as 2 (senão o Record<FormationKey> quebra o tsc).
- `pyramidseason.tsx`: seletor do meio de carreira (botões + dica) lista as 5 agora,
  com flexWrap (3+2). A **trava** que já existe segura: só troca se tem os jogadores
  REAIS por posição (5-3-2 pede 3 zagueiros; se faltar, botão travado com aviso claro).
- Força de ataque/defesa sai EMERGENTE do XI (mais ATA = mais ataque; rollForm usa o XI,
  não a formação) — nada hardcoded, nada a balancear. Reversível: `git revert`.
- ✅ FEITO (12/08): **substituição no intervalo** (toggle "só no intervalo" vs "dinâmico";
  pausa aos 45' + banner) — ver seção "🔁 CARREIRA: substituição no intervalo" no topo.
- ⏳ PENDENTE: **pênalti interativo** (mockup jogável feito e ideia aprovada, mas Diego
  NÃO liberou codar ainda).


## 🦁⚡ BATISMO: Remoçada (luiz.maia.luiz) — Série A ✅ NO AR
Batismo do luiz.maia.luiz@gmail.com, aprovado 12/08. Time **Remoçada**, coração **Remo**.
O **Leão Azul do Remo fantasiado de Thor** (elmo alado + Mjölnir), azul-marinho + branco,
capa vermelha. Entrou na **Série A no lugar do Olimpo FC**. luiz **já era Lenda(ouro) +
FUNDADOR nº35** (código + banco) — não precisou mexer nisso.
- ✅ `data.ts`: DIVISION_TEAMS.A Olimpo FC → Remoçada + OLD_NAME 'Remoçada':'Olimpo FC'.
- ✅ `escudos.tsx`: `LOGOS_PRONTAS['Remoçada']` — leão dourado do Remo, elmo alado,
  2 Mjölnir cruzados, "REMOÇADA" branco em faixa navy (clipPath id `rmcEsc`).
- ✅ `mascotes.tsx`: `MASCOTES.leao_thor` — leão dourado, elmo alado, Mjölnir erguido +
  faísca, camisa navy/branca, capa vermelha, pé na bola. Festão genérico (Campeão!).
- ✅ Manto azul-marinho `#12256B` + branco `#FFFFFF` (2 cores, vertical).
- ✅ DB: `esc_socios` (sócio nº19, escudo_time='Remoçada', mascote_key='leao_thor',
  manto navy/branco, time_coracao='Remo', origem='batismo') + `esc_nomes_batismo`
  ('remoçada'→luiz). `user_colors` já era ouro.
- ⚠️ luiz precisa colocar o nome do time como **"Remoçada"** (hoje é "PES FC") pra a
  logo aparecer (Escudo casa pelo nome EXATO; o fallback newestTeamName cobre saves
  com "Olimpo FC"). Reversível: `git revert` + apagar as 2 linhas do banco.


## ⚽🧊 BUG "gols mudam ao trocar formação" (VOLTOU — reforço 12/08)
Relato do Diego (niko.messias/Aracaju Saf, carreira solo): trocou 4-5-1↔4-4-2 e os
gols dos jogadores mudaram ("os gols do Evaristo foram pro Jairzinho"). Já tinha o
band-aid de 10/08 (commit 5533e39) mas CONTINUAVA. Causa real: a temporada re-simula
do seed a cada render; as rodadas SEM escalação gravada caíam no `bestXI` da formação
ATUAL → trocar formação re-atribuía os gols do passado. O band-aid só congelava no
CHANGE_FORMATION e, pior, sobrescrevia com `bestXIids` uma SUBSTITUIÇÃO MANUAL que
valia dali pra frente (buraco do carry-forward). Correção (2 frentes, `store.tsx`):
1. **Congela CADA rodada AO JOGAR** (`PLAY_ROUND`/`SIM_MANY`, SÓ solo): grava o XI real
   de cada humano em todas as rodadas já jogadas, com a MESMA regra da simulação
   (`frozenXIids` = última escalação <= r, senão bestXI). Gravar = capturar o que a
   tela já mostra (mesmo XI), então NADA muda na hora — só trava o passado pra sempre.
2. **Band-aid do CHANGE_FORMATION agora é carry-forward aware** (usa `frozenXIids`, não
   `bestXIids` cru) → não atropela mais a troca manual.
Verificado: `bestXI`(sim) == `bestXIids`(store) idênticos, até com empate de nível →
gravar é transparente. Reversível: `git revert`. ⚠️ FALTA: mesmo congelamento no
ONLINE (por ora só solo, pra não mexer no host-autoritativo sem teste).


## 🛡️ LIÇÃO (11/08): logo do batismo no JORNAL + em carreira antiga
Diego: "a logo do Império Samambaia não aparece no jornal quando ele joga carreira".
Duas causas achadas e corrigidas (commit isolado, reversível com `git revert`):
1. **Carreira antiga fica com o nome VELHO do time** (`store.tsx:1706` migra o nome
   de todo mundo com `newestTeamName`, MENOS o humano — pra não trocar nome que a
   pessoa escolheu). Então quem começou a carreira antes do batismo continua com
   "Cuiabagre" e caía no escudo automático. FIX: `Escudo()` agora tenta
   `LOGOS_PRONTAS[nome] ?? LOGOS_PRONTAS[newestTeamName(nome)]` — a logo comprada
   aparece mesmo com o nome antigo. NÃO renomeia nada (seguro).
2. **A IMAGEM do jornal que vai pro grupo** (`buildJornalBlob`) desenhava só a 1ª
   LETRA do time no lugar do brasão. FIX: agora rasteriza o `<Escudo>` de verdade
   (react-dom já no bundle) e desenha o brasão; se falhar, cai na letra de antes.
   Vale pra TODO time (futebol também ganha brasão na figura de compartilhar).
👉 Se algum dia quiser o NOME do time também migrar pro do batismo em carreira antiga,
   é tirar o `m.isHuman ? m :` da linha 1706 — mas aí renomeia o time do cara (pedir OK).


## ⚠️ LIÇÃO (11/08): TIER ao vivo = tabela `user_colors` (banco), NÃO só o código!
`apoio.tsx:214` → `const tier = dbTier ?? FOUNDERS[email]`. O tier que o jogo mostra
(e que os OUTROS jogadores enxergam) vem da tabela **`user_colors`** (email, tier,
manual). O `FOUNDERS` do código é só fallback do próprio aparelho. Mudei só o código
e o Gabriel continuou prata (tinha user_colors='prata' do tempo de Craque).
👉 Pra dar/trocar tier: **gravar em `user_colors` (upsert email→tier)** — código é só backup.
Corrigido hoje: Gabriel/paisagensetrilha/agrostinho/lucas=ouro, lipeh/pedronovikoff=prata.

## ⚠️ LIÇÃO (11/08): escudo do batismo é pelo NOME EXATO do time (LOGOS_PRONTAS[nome])
O `Escudo(nome)` faz `LOGOS_PRONTAS[nome]` (match exato do nome do time). Cadastrei
"Desportivo Montreal" (com S) mas o time do Gabriel é "Deportivo Montreal" (sem S,
clube real) → escudo caía no automático. Renomeado pra "Deportivo Montreal" no código
(escudos.tsx + data.ts) e no banco (esc_socios.escudo_time + esc_nomes_batismo).
👉 Conferir a grafia EXATA do nome do time do dono antes de cadastrar o batismo.

## ⚠️ LIÇÃO (11/08): batismo TEM que entrar em `esc_nomes_batismo` também!
A trava de nome único (`esc_nome_livre`) reserva o nome do batismo pro dono
**pela tabela `esc_nomes_batismo`** (colunas: nome_norm, nome, email). Publiquei
Scorporila/Montreal/Marolados só no `esc_socios` e ESQUECI dessa tabela → o dono
do Marolados não conseguia salvar o nome (batia no lucasjogomes, que já usava o
nome por coincidência). CORRIGIDO: registrei os 3 em `esc_nomes_batismo`.
👉 CHECKLIST batismo daqui pra frente: data.ts (OLD_NAME + CPU) · apoio.tsx (ouro
+ FUNDADOR_N) · escudos/mascotes · `esc_socios` (kit) · **`esc_nomes_batismo` (reserva do nome)**.

## 🌱🤙 BATISMO: Marolados FC (paisagensetrilha) — Série D ✅ FEITO
Batismo do paisagensetrilha@gmail.com, aprovado 11/08. Ideia da casa: a molecada de
periferia que joga na várzea ("fumaçou o campo"), coração Palmeiras. Entrou no lugar
do **Real Madruga** na Série D. Craque? não — direto **Lenda(ouro) + FUNDADOR nº 38**.
- ✅ `data.ts`: DIVISION_TEAMS.D Real Madruga → Marolados FC + OLD_NAME.
- ✅ `apoio.tsx`: FOUNDERS ouro + FUNDADOR_N 38.
- ✅ `escudos.tsx`: `LOGOS_PRONTAS['Marolados FC']` — cabeça do moleque RASTAFARI
  (dreadlocks + touca rasta, sem blush) no escudo verde "AQUI É RAIZ" + fumaça (full+mini).
- ✅ `mascotes.tsx`: `MASCOTES.marolado` — moleque rasta descalço com bola RASGADA,
  fazendo joia. Festão "É GOL, FIRMEZA!".
- ✅ Manto verde/branco (Palmeiras) — 2 cores normais.
- ⏳ FALTA: DB `esc_socios` do paisagensetrilha (escudo_time='Marolados FC',
  mascote_key='marolado', manto_c1='#1B7A3D' manto_c2='#FFFFFF', time_coracao='Palmeiras').
- Reversível: `git revert` + apagar linha do banco.

## 🛡️ BATISMO: Desportivo Montreal (nevesgabriel95) — Série A ✅ FEITO (código)
Batismo do Gabriel (nevesgabriel95@gmail.com), aprovado 11/08. Recriação em SVG
(estilo da casa) do escudo real do clube dele (verde, estrela-bússola, faixas
DEPORTIVO/MONTREAL, **2026**, bola). Entrou no lugar do **Titan Capital** na Série A.
Gabriel: **Craque(prata) → Lenda(ouro) + FUNDADOR nº 37**.
- ✅ `data.ts`: DIVISION_TEAMS.A Titan Capital → Desportivo Montreal + OLD_NAME.
- ✅ `apoio.tsx`: FOUNDERS ouro + FUNDADOR_N 37.
- ✅ `escudos.tsx`: `LOGOS_PRONTAS['Desportivo Montreal']` (full + mini).
- ✅ `mascotes.tsx`: `MASCOTES.maite` — a MAITÊ, bebê brava de óculos escuros
  (homenagem do Gabriel à filha). Festão "É GOL DA MAITÊ!".
- ✅ **Manto 3 cores** (preto/branco/verde): `manto.ts` ganhou `MANTO_TRI` + `meuMantoC3()`
  e `mantoStripes` aceita 3ª cor opcional. Passado como prop SÓ nos renders do DONO
  (screens.tsx Campinho + pyramidseason) — NÃO pinta o manto dos outros na sala.
- ⏳ FALTA: DB `esc_socios` do Gabriel (escudo_time='Desportivo Montreal', mascote_key='maite',
  manto_c1='#0C0C0C' manto_c2='#FFFFFF', time_coracao='Internacional', origem='batismo') + `esc_fundadores`.
- Reversível: `git revert` + apagar linha do banco. Manto 2-cores dos outros intocado.

## ⏸️ PAUSADOS (esperando email do Diego pra publicar):
- **Allan Stag** (arte pronta: escudo-foto/arte + cobra Dibrados) — falta email + batismo/person.
- **Ligeiro FC** (Artur; escudo-arte + robô-TV, homenagem Túlio Ligeiro) — falta email + batismo/person.

## 🦍🦂 BATISMO: Scorporila FC (lucassrribeiroo2023) — kit visual (11/08)
Escudo + mascote + manto do batismo (ex-Realeza FC, Série A). O Diego rejeitou
várias tentativas SVG e TAMBÉM a imagem do Gemini (pesada: PNG cru ~275KB; webp
otimizado ~30KB, mas ele preferiu vetor). Decisão FINAL **aprovada**: SVG leve
estilo Nightfull. Gorila RUGINDO (silverback preto + máscara facial cinza) fundido
com ESCORPIÃO (cauda dourada segmentada + ferrão vermelho + pinças), sobre listras
P&B do Santos. Coração: Santos → manto branco com listras pretas (verticais).
- ✅ `escudos.tsx`: `LOGOS_PRONTAS['Scorporila FC']` (versão detalhada + MINI pra tabela).
- ✅ `mascotes.tsx`: `MASCOTES.scorporila` (corpo inteiro, aparece no festão).
- ✅ `data.ts` (OLD_NAME + CPU_MANAGERS) e `apoio.tsx` (ouro/Lenda) — já feitos por outra sessão.
- ⏳ FALTA: DB `esc_socios` do lucassrribeiroo2023 (escudo_time='Scorporila FC',
  mascote_key='scorporila', manto_c1='#FFFFFF' manto_c2='#0C0C0C', time_coracao='Santos').
- Reversível: `git revert` do commit + 1 UPDATE no banco. Futebol intocado.

## 💰 CARREIRA: reforma da economia (11/08) ✅ NO AR
Simulação até T140 mostrou que subir/competir levava ao vermelho (folha > renda de
meio de tabela da Série C pra cima). Ajustes aprovados pelo Diego (valores dele) e
implementados, cada um em commit isolado:
- 🔻 **Quedas aliviadas** — QUEDA em pyramidseason: C −10 · B −15 · A −20 (era 20/25/30).
- 🏆 **Copa Legends por fase** — `copaRewards` paga por fase alcançada (participação
  20% → quartas 40% → semi 65% → vice 80% → campeão 100%), total/divisão A30/B20/C15/D10.
- 🌍 **Copa do Mundo por participação** — campeão 100 · vice 70 · semi 50 · quartas 32 ·
  grupos 10 (ação COPA_MUNDO_PRIZE ganhou `coins`; copa-mundo.tsx calcula a fase).
- 📺 **Cota de TV** — renda por divisão no fim de temporada: V0 D5 C10 B15 A20
  (`applyTVIncome` em store.tsx, linha própria "📺 Cota de TV" no extrato) +
  **banner "a TV descobriu seu clube"** 1x por divisão (D/C/B/A), antes do patrocínio,
  só carreira SOLO (estado `tvBannerSeen`, ação TV_BANNER_SEEN).
- Simulação final: frugal 100→6.201, equilibrado 100→11.526 (nunca no vermelho);
  só quem estoura a folha na A/B ainda aperta (realista). Sem erro financeiro.
- Reversível: `git revert` em cada commit. Futebol (jogo) intocado — só economia da carreira.

## 🐛 ONLINE: host sai na votação → identidade embaralha (11/08) — EM CONSERTO
Bug relatado + CONFIRMADO no servidor (sala ABVYLU/68036bfb): o host (SucodeFruta,
cadeira 0) saiu na votação de fim de temporada; o `game_rooms.host_id` continuou
apontando pra ele (**host fantasma**) e ninguém assumiu direito; ao começar o
próximo jogo as cadeiras vazias foram renumeradas e cada aparelho continuou no
"quem sou eu" pela CADEIRA antiga → todos escorregaram de assento → nomes trocados
no chat, "lacrando pelo outro", voto de um caindo na conta de outro.
CAUSA-RAIZ: identidade amarrada à CADEIRA (youIdx/player_index) em vez do CRACHÁ
(manager.id) em vários pontos + carreira sem migração de host (store.tsx:5893).
Plano em 3 passos revertíveis:
- ✅ **Passo 1 (feito)**: `OnlineEndVote` (screens.tsx) usa CRACHÁ no voto/placar/
  presença/tag de host (era `youId = state.youIdx`). `duplas` continua por cadeira
  (`youSeat`). Presença convertida cadeira→crachá.
- ✅ **Passo 2 (feito)**: chat e alfinetada carimbam pelo CRACHÁ. `EmoteEvent`/
  `ChatMsg` ganharam `fromId` (crachá); `sendChat`/`emote` usam `myMgrIdRef`
  (âncora estável, movida pra cima no provider) pra achar "meu técnico" mesmo se
  a cadeira deslizou; `FloatingEmotes` resolve o autor por crachá (fallback índice).
- ✅ **Passo 3 (feito)**: eleição de host DETERMINÍSTICA no vigia do host
  (store.tsx ~6289). Quando o `host_id` aponta pra alguém fora da presença (host
  fantasma: fechou app/caiu/saiu sem passar coroa — rápido E carreira), os
  presentes elegem o MENOR uid presente → exatamente um assume, grava host_id e
  vira autoritativo; ganha o aviso "você virou host". Sem sorteio, sem dois hosts.
Futebol não foi tocado; cada passo é commit isolado e revertível.
CONSERTO COMPLETO (3 passos no ar). Falta o Diego testar em sala real com amigos.

## 🔴⚫🌿 KITS: Murriz FC + Império Samambaia (batismo) (10/08) ✅ NO AR
Dois batismos novos publicados juntos:
- **Murriz FC** (msb102010@hotmail.com, sócio nº7) — careca de barba ruiva
  ESTRESSADO, rubro-negro (Flamengo). Escudo faixas HORIZONTAIS + cabeça;
  mascote `careca_ruivo` corpo inteiro; manto vermelho/preto HORIZONTAL.
- **Império Samambaia** (jorgericardo777@gmail.com, sócio nº4) — samambaia BRABA
  coroada (cara de bravo + coroinha), verde sobre diagonais vermelho/branco
  (Rio Branco). Escudo + mascote `samambaia` (cabeça-vaso, corpo, punhos);
  manto vermelho/branco DIAGONAL; **festão CHOVE FOLHA** no lugar do confete.
- **Código**: `escudos.tsx` (2 entradas em LOGOS_PRONTAS), `mascotes.tsx`
  (`careca_ruivo` + `samambaia` + folhas no FestaoMascote), `manto.ts`
  (`mantoStripes` ganhou ângulo + `meuMantoAngle()` por mascote:
  samambaia=45° diagonal, careca_ruivo=0° horizontal, resto 90° vertical),
  `screens.tsx`/`pyramidseason.tsx` passam o ângulo só pro time do próprio dono.
- ⚠️ No online (manto dos OUTROS na sala) a listra sai VERTICAL por enquanto
  (o RPC esc_mantos_sala só devolve cor, não o mascote) — detalhe pequeno na
  faixinha de 14px; dá pra evoluir depois se o Diego quiser.
- **Banco**: 2 linhas em esc_socios + nomes reservados em esc_nomes_batismo.
- Reversível: `git revert` no commit + apagar as 2 linhas do banco.

## 🐷⚓ KIT: Marinheiros AS — 1ª ASSINATURA (10/08) ✅ NO AR
Primeira ASSINATURA do jogo (feehcamp11@gmail.com)! NÃO é batismo — é
personalização da conta do assinante (origem='assinatura', sócio nº15).
- Porco marinheiro ESTRESSADO (boina branca, vapor, dentes trincados), verde e
  branco (Palmeiras). Escudo = brasão verde + boia salva-vidas + porco de boina;
  mascote `porco_marinheiro`; manto verde/branco HORIZONTAL (marujo).
- **Código**: `escudos.tsx` ('Marinheiros AS'), `mascotes.tsx`
  (`porco_marinheiro`), `manto.ts` (porco_marinheiro=0° horizontal).
- **Banco**: 1 linha em esc_socios (origem assinatura, valido_ate 2099 — Diego
  ajusta se a assinatura vencer; não há hook de cobrança automático).
- Reversível: `git revert` + apagar a linha do banco.

## 🖤🤍 KIT: Bicho da Seda vira PRETO E BRANCO (Davi/davisantana1312) (10/08) ✅ NO AR
Diego corrigiu: o coração do Davi é **BOTAFOGO**, não Palmeiras. Então o
Bicho da Seda trocou de verde pra **preto e branco (alvinegro)**.
- **escudos.tsx** `'Bicho da Seda'`: brasão PRETO (#141414) com listras brancas
  + mariposa BRANCA (#F4F4F4) com pintas/veias/tufos pretos.
- **mascotes.tsx** `mariposa`: idem, branca com detalhes pretos.
- **Banco** `esc_socios` do Davi: manto_c1='#141414', manto_c2='#FFFFFF',
  time_coracao='Botafogo'.
- PENDENTE (perguntei ao Diego): botar ou não uma estrelinha branca no escudo
  (cara de Botafogo do Rio) — só se ele pedir.
- Reversível: `git revert` + voltar os campos no banco.

## 🐷 KIT: Xurupitas FC (batismo do denilson.stifler10) (10/08) ✅ NO AR
O denilson (sócio nº14, ouro) trocou o time de batismo "Tokyo City Esperion"
por **Xurupitas FC** — nome escolhido pra BATER com o "Xurupitas" que ele já
usa na carreira/ranking. Kit aprovado pelo Diego: **porco** verde/branco
(Palmeiras de coração), com as presas apontadas PRA CIMA (igual foto que o
Diego mandou), cabeça colada no corpo, porco forte.
- **escudos.tsx**: `'Xurupitas FC'` em LOGOS_PRONTAS (SVG do porco, presas p/ cima).
- **mascotes.tsx**: `porco` (corpo inteiro, camisa verde, short/tênis brancos).
- **data.ts**: ponte de renome `'Xurupitas FC' → 'Tokyo City Esperion' → 'FC Galáticos'`;
  desmanchei o elo velho da corrente do Davi (`'Bicho da Seda' → 'Red Bull Diet'`,
  sem passar mais pelo Xurupitas). CPU manager "Neguinho do Apito" agora joga
  pelo Xurupitas FC.
- **Banco**: `esc_socios` do denilson (escudo_time='Xurupitas FC', mascote_key='porco',
  manto_c1='#0B4D2C', manto_c2='#FFFFFF', time_coracao='Palmeiras');
  `esc_nomes_batismo` reserva **Xurupitas FC** pra ele (mantive "Tokyo City
  Esperion" reservado também, pra ninguém pegar o nome antigo).
- Reversível: `git revert` no commit + trocar de volta os campos no banco.

## 🖼️ PATROCÍNIO: logo da Vadico/ERO saía BRANCA quando selecionada (09/08) ✅ NO AR
Achado ao fazer o mockup do banner de fidelidade (pedido do Diego pra usar a
Vadico no lugar do Açougue): a logo virava um retângulo branco liso. Causa: o
PNG da Vadico e da ERO não tem fundo transparente (é RGB puro, fundo branco
"colado" na imagem) — o filtro que deixava a logo branca em cima do fundo
verde/preto (`brightness(0) invert(1)`) inverte a imagem TODA, não só o
desenho, e sem transparência isso vira um bloco branco sem nada visível.
A MaxJoias não tinha esse problema (o PNG dela tem transparência).
- **Confirmado que também acontecia na tela REAL** (não só no mockup): no
  cartão de escolha do patrocínio (`SponsorTierCard`), ao SELECIONAR a Vadico
  ou a ERO, a logo sumia (virava branco).
- **Corrigido** (`estadio.tsx`, 2 lugares — `SponsorTierCard` e o
  `SponsorLoyaltyBanner` novo de hoje): troquei o filtro de inverter cor por
  uma "chapinha branca" atrás da logo — funciona com QUALQUER logo, tenha ou
  não transparência, selecionada ou não.
- Reversível: `git revert` no commit desse fix.

## 🎖️ PATROCÍNIO: garantia de fidelidade (09/08, mockup aprovado) ✅ NO AR
Bateu a meta do patrocínio com uma marca → na temporada SEGUINTE, antes de
escolher de novo, aparece um banner da <b>Diretoria Comercial</b> da própria
marca (nome da empresa aparece), parabenizando e propondo: escolha a MESMA
marca de novo essa temporada e, mesmo que não bata a meta dessa vez, o
patrocínio garante pelo menos o mínimo (nível 1) em vez de zero. Só vale
UMA temporada (a que vem logo depois do acerto) — se não usar na hora, some.
Combinado com o Diego: **não usar a palavra "aposta" nesse banner novo**
(o resto da tela de patrocínio continua com "aposta" normal, só esse banner
evita).
- **Lógica** (`pyramidseason.tsx`, `sponsorBetRewards`): novo parâmetro
  `lastResults` (o `careerSponsorResult` de ANTES da virada, ainda não
  sobrescrito) — se não bateu a meta mas bateu na temporada anterior E
  escolheu a MESMA marca, aplica o piso (`sponsorBetValue(div, 1)`) e marca
  `floored: true` no resultado. Os 2 call-sites (`CLOSE_SEASON_BOOKS` solo e
  o builder de `args()` do online) passam `state.careerSponsorResult`.
- **UI** (`estadio.tsx`): `SponsorLoyaltyBanner` novo (só aparece quando
  `result.hit`, antes do técnico escolher de novo — some depois que ele
  decide). `SponsorBetResultCard` ganhou o caso `floored` (ícone 🎖️, texto
  explicando que a fidelidade pagou o mínimo, pílula verde em vez de
  vermelha) — sem isso a pessoa não entenderia de onde veio o dinheiro numa
  temporada que "não bateu".
- Reversível: `git revert` no commit desse fix.

## 💰 CARREIRA: prêmio de acesso da D/Várzea + campeão da Várzea subiram (09/08) ✅ NO AR
Contexto: investiguei relato de "carreira tá difícil" e achei que o handicap
subiu MUITO exatamente na Várzea/D (04/08) — é a primeira coisa que todo
mundo enfrenta. Diego decidiu dar uma força de caixa logo na entrada:
- **Acesso (top-4) da Série D**: 0 → **15**
- **Acesso (top-4) da Várzea**: 0 → **10**
- **Campeão da Várzea**: 12 → **15** (campeão da Várzea agora leva 15+10=25)
- `pyramidseason.tsx`: constantes `CAMPEAO`/`ZONA`. Vale carreira em andamento
  (não precisa começar save novo).
- **Bug de exibição achado e corrigido junto** (o Diego reparou sozinho e
  pediu pra conferir): o painel "🏆 Prêmios da temporada" (aba Tabelas)
  tratava a Série D como especial no "Queda" (mostrava "—" hardcoded pro "D"
  só), mas não fazia o mesmo pra Várzea — a Várzea mostrava "−0" em vermelho
  (parece penalidade, mas o valor real sempre foi zero). Trocado pra checar
  `QUEDA[d] > 0` (mesmo padrão que a coluna Top-4 já usava), corrige as duas.
  Textos da legenda também tavam desatualizados ("Da Série D ninguém cai — é
  a última") — isso ficou errado desde que a Várzea existe (os últimos 4 da D
  caem pra Várzea todo ano, só que sem desconto). Reescrito.
- **Os NÚMEROS pagos sempre bateram certo** (o painel lê a mesma constante
  que o jogo usa pra pagar) — o problema era só a aparência/texto do "—", não
  o dinheiro em si.
- Reversível: `git revert` no commit desse fix.

## 💰 BATIZA TEU CLUBE: Pix da Série D não copiava o valor certo (09/08) ✅ NO AR
Diego reparou que os dois cards de preço (Série A·B·C·Várzea R$59,90 · Série
D R$69,90) eram só enfeite fixo — o botão "COPIAR PIX" sempre gravava 59,90,
mesmo pra quem ia batizar clube na Série D.
- Mockup aprovado ("ficou bom") antes de codar, como sempre pra visual.
- **Corrigido** (`screens.tsx`, `ApoieButton`): os dois cards agora são
  TOCÁVEIS — escolhe a série, o card escolhido fica destacado (dourado) e o
  botão de copiar Pix já muda pro valor certo sozinho (59,90 ou 69,90).
  Padrão: A·B·C·Várzea (59,90), igual já era.
- Reversível: `git revert` no commit desse fix.

## ⚽ COPA LEGENDS (carreira): reserva fazendo gol + substituição não valia (09/08) ✅ NO AR
Diego repassou relato de usuário: "reserva fazendo gol" na Copa (só valem os
11 titulares — reserva só entra COM troca) e "não dá pra substituir na Copa".
- **Causa (uma só, pros dois relatos)**: a Copa Legends (mata-mata dos 16, fim
  de temporada) é calculada TODA DE UMA VEZ (`computeCopa`), diferente da liga
  (que já usava a escalação certa por rodada, `lineupAt`). A Copa sempre usava
  o `bestXI` cru do elenco inteiro — o "melhor 11 pelo nível" recalculado do
  zero — ignorando por completo a escalação que o técnico realmente montou
  (`careerLineup`). Por isso: (1) quem aparecia jogando podia ser diferente de
  quem o usuário escalou (parecia reserva fazendo gol) e (2) qualquer troca
  feita não tinha efeito nenhum na Copa — daí "não dá pra substituir".
- **Corrigido** (`pyramidseason.tsx`, `computeCopa`): agora o time HUMANO
  entra na Copa com a escalação DE VERDADE (a mesma que valeu no fim da liga,
  via `lineupAt`), não mais o `bestXI` cru.
- **Por que a troca não muda fase a fase**: a Copa inteira já sai pronta de
  uma vez (só é REVELADA fase a fase depois, pra não dar spoiler) — trocar o
  time NO MEIO da Copa reabriria resultado que já foi mostrado. Por isso a
  escalação usada é fixa: a mesma que valeu no fim da liga (rodada 38). Pra
  mudar quem joga a Copa, o técnico troca no Elenco ANTES da liga acabar (ou
  no fim, antes de entrar na Copa) — vale pra ela inteira.
- Reversível: `git revert` no commit desse fix.

## 🎁 CARTA DO CAMPEÃO: achado o motivo de sumir mesmo campeão de verdade (09/08) ✅ NO AR
Diego relatou um usuário que foi campeão DUAS vezes e não recebeu carta
NENHUMA das duas — pediu pra analisar a fundo os dois pontos possíveis: (1)
tem algum modo/cenário onde o pacote nem aparece pro campeão? (2) quando
falha, a carta some do álbum de vdd (quebra a GARANTIA) ou só o banner
visual que não aparece?
- **Ponto 1 (nunca aparece pro campeão): não achei nenhum buraco.** Conferi
  TODOS os lugares que abrem `CardCollectPrompt` — Rápido CPU/online (liga
  e Copa dos 8), Carreira liga/divisão (D/C/B/A **e Várzea**), Copa Legends,
  Copa do Mundo, e o guardado de multiclube — e em todos o pacote só depende
  de "você é campeão", nunca de `agenciaOn` ou qualquer outro flag que
  pudesse excluir um campeão de verdade. Inclusive conferi que meu fix de
  09/08 do ranking (item acima) só mexeu na GRAVAÇÃO DO TÍTULO, não na carta
  — carta continua garantida em qualquer carreira, nova ou antiga.
- **Ponto 2: achei e corrigi uma falha real, que apaga a carta de verdade
  (não é só o banner que some).** O `CardCollectPrompt` checava a conta com
  `supabase.auth.getUser()` — essa chamada BATE NO SERVIDOR (não é local).
  Se a rede engasgasse bem naquele instante (comum em carreira, que roda
  horas — celular volta do fundo, wifi cai um segundo), o código tratava
  "deu erro de rede" IGUAL a "não tem conta": mostrava a tela de "criar
  conta grátis" pra um campeão que JÁ TINHA conta, e a carta nunca era
  gravada (nem entrava na fila de retry — essa parte só existe pra falha na
  GRAVAÇÃO, não pra falha no check de login). Pior: o `persist()` fazia
  outro `getUser()` por conta própria — ou seja, DOIS pontos onde uma rede
  ruim podia derrubar a carta, não só um.
- **Corrigido** (`screens.tsx`, `CardCollectPrompt`): troquei o check pra
  `getSession()` (lê local, sem bater na rede — não trava por wifi ruim),
  com até 3 tentativas antes de desistir de vdd; e o `persist()` agora
  REUSA a conta já resolvida no check inicial em vez de checar de novo. Isso
  fecha os dois pontos onde uma instabilidade passageira podia fazer o
  campeão sumir sem carta.
- **Achado à parte, NÃO mexido**: esse padrão de `getUser()` (bate na rede,
  sem retry) se repete em ~40 lugares do jogo todo (vários arquivos) — não
  mexi em nada além do fluxo da carta (é o único que Diego pediu pra
  investigar, e mexer nos outros 39 é risco desnecessário pro futebol ao
  vivo sem pedido). Se aparecer outro relato parecido em outro lugar (ex.:
  perfil não carrega, apoio não reconhece a conta), é candidato a levar o
  mesmo tratamento.
- Reversível: `git revert` no commit desse fix (só mexe no
  `CardCollectPrompt`, não muda visual nenhum — sem precisar de mockup).

## 🏆 RANKING: carreira antiga (sem Agência) parou de somar título (09/08, print do Falido FC) ✅ NO AR
Diego mandou print de um técnico (Falido FC) com 391 títulos/quase 49 mil
gols — carreira antiga, sem a Agência 2.0, virou um jeito fácil de inflar o
ranking sem jogar o modo de verdade. Pedido: só carreira NOVA (com Agência)
soma título pro ranking daqui pra frente; quem quer subir tem que jogar
carreira nova.
- **Achado**: os 3 lugares que gravam título de carreira no `esc_results`
  (o que a aba "🪜 Carreira" do ranking lê) — liga/divisão e Copa Legends em
  `pyramidseason.tsx`, Copa do Mundo em `copa-mundo.tsx` — não checavam
  `state.agenciaOn` (o flag que marca carreira nova vs antiga). Corrigido:
  os 3 agora só gravam com `agenciaOn` true. A Copa do Mundo precisou o flag
  passado por prop (`CopaMundoGate → CopaMundo → CupScreen`).
- **A carta de campeão continua garantida em QUALQUER carreira** (antiga ou
  nova) — só o TÍTULO do ranking que parou de contar em save antigo.
- **NÃO retroativo**: título já gravado de carreira antiga continua lá (não
  apaguei histórico de ninguém) — só parou de SOMAR mais daqui pra frente.
  Se quiser também esconder/zerar o que o Falido FC (e outros) já grindaram
  assim, é outro passo — avisar antes de eu mexer (apaga dado de gente).
- **Achado à parte, NÃO mexido**: o modo "carreira online" LEGADO
  (`careeronline.tsx`, tela antiga) grava `season_key` sem o prefixo `co:`
  — por isso nem cai na aba Carreira hoje, cai ERRADO na aba Rápido Online
  (o filtro do RPC `esc_ranking` só exclui `co:%`, não confere o formato
  certo do rápido). Pode ser OUTRA fonte da inflação do Falido FC — decisão
  em aberto, e mexer aí é do lado do banco (RPC `esc_ranking`), mais
  delicado. Reversível com `git revert d55c35b`.

## 🤝 DUPLA: formar vaga virou PEDIDO com aceite (09/08, pedido do Diego) ✅ NO AR
Mudança combinada em conversa: tocar numa vaga não vira dupla mais na hora —
manda um PEDIDO, a pessoa vê um banner e ACEITA ou RECUSA (ou deixa expirar
em 30s). O 🔒 cadeado continua igual (a própria pessoa marca na vaga dela,
bloqueia qualquer pedido de fora — mostra "guardando a vaga pra um amigo").
- **Schema** (`supabase/dupla_pedido_schema.sql`, JÁ aplicado no projeto real
  `faabglpjutwursgmrpny` via MCP): 2 colunas em `room_players`
  (`dupla_request_to`, `dupla_request_at` — moram na linha de QUEM PEDIU,
  por causa da RLS) + função `dupla_responder` (SECURITY DEFINER: só ela
  grava `dupla_partner_of` na linha de quem pediu, depois de confirmar no
  servidor que o pedido é mesmo pra quem tá aceitando/recusando).
- **Código** (`lobby.tsx`, commit `8efba3c`): `pedirDupla` (manda o pedido,
  com conferência fresca pra não deixar 2 pedidos brigando pela mesma vaga),
  `cancelarPedido` (self-clear, inclusive o auto-expira em 30s via
  `useEffect`), `responderPedido` (chama a RPC). Tela mostra: pra quem pediu
  "⏳ esperando [nome] responder…" com botão cancelar; pra quem recebeu, o
  banner com ✅ Aceitar / ✕ Recusar; pra um terceiro olhando a mesma vaga,
  "⏳ já mandou pedido, aguardando resposta" (não deixa pedir por cima).
- Reversível: código com `git revert 8efba3c`; schema com o comando no topo
  do `.sql`.
- **Não mexido**: nada na formação de dupla durante um REMATCH (aquilo já
  usa outro caminho, `startLeilao`/`redraftSeason`, que preserva a dupla que
  JÁ EXISTIA — não passa por pedido/aceite de novo).

## 🐛 DUPLA ONLINE: relato do próprio Diego jogando com o Didico — 2 corrigidos, 1 em aberto
Diego jogou de dupla com o host numa sala e relatou dois problemas (fotos):
**(1) virou "rival" do próprio parceiro** — no fim do jogo, o host apertou
"🔨 Novo leilão" e Diego, que era DUPLA do host, apareceu como time
SEPARADO/adversário, sem ninguém ter pedido pra desfazer a dupla.
**Causa achada e CORRIGIDA ✅**: o botão "Novo leilão" (`startLeilao` em
`screens.tsx`) remontava os times só pela ordem crua da tabela
`room_players`, sem saber que uma das linhas era CARONA de dupla
(`dupla_partner_of`) — tratava o parceiro como um técnico próprio. A sala
de espera já resolvia isso certinho; só copiei o mesmo jeito pro "novo
leilão" (só DONO de assento vira time; `duplasMode`/`duplas`/`youUid` agora
vão junto no `START_ONLINE`, que antes não mandava nada disso — ficava
sempre sem dupla nenhuma no leilão novo).
**(2) chat mostrando "Você" pro parceiro também** — no chat da partida,
quando o Diego e o parceiro (Didico/Alfacehh) escreviam, os dois apareciam
como "Você", sem dar pra saber quem tinha falado o quê.
**Causa achada e CORRIGIDA ✅**: o chat decidia "é minha mensagem?" pelo
TIME (`from === youIdx`) — numa dupla os dois COMPARTILHAM o mesmo time,
então a msg do parceiro batia como sendo seguida. `ChatMsg` ganhou um
campo `uid` (a pessoa de verdade, não o time); a checagem agora usa esse
uid quando existe. Reversível com `git revert 9bc346e`.
**(3) host podia começar sem o parceiro votar — CORRIGIDO ✅ (09/08)**: a
tela de votação do fim de jogo (`OnlineEndVote`) conta voto por TIME, e
numa dupla o parceiro do host compartilha o mesmo time — nunca aparecia
na lista de pendência do host, que achava "só falta gente de fora" e
destravava sozinho. Corrigido: o host agora enxerga se tem parceiro
(`state.duplas`) e usa a MESMA chave (`votes[youId]`, que só o parceiro
escreve — o host nunca vota, decide) pra saber se ele já confirmou.
Botões travam com aviso "🤝 Aguardando seu parceiro [nome] votar…", igual
já acontecia pros outros times. O modal "nem todo mundo votou" ganhou
opção própria pro parceiro (não dá pra "excluir" ele — só esperar ou
"▶️ Começar mesmo assim", nunca trava o jogo). Reversível com
`git revert 3f4dfba`.
Também relatado, ainda **NÃO confirmado/investigado**: um amigo que entrou
pra ser dupla do Diego não apareceu no nome da dupla (apareceu o nome de
OUTRA pessoa) — pode ser sintoma do mesmo bug (1) com dado velho no
`room_players`, mas não tracei a fundo ainda; avisar se acontecer de novo
depois desse conserto.

## 🐛 AGÊNCIA: carta de campeão podia não entrar (relato do Diego sobre o Luiz Filipe Maia, campeão da Série D) ✅ NO AR
Print do jogador: ganhou a Série D (troféu confirmado no Hall), álbum tem a
carta certinha, mas "Seus agenciados" tava vazio (0/22, busca sem resultado).
Perguntei se era travado por tier (Lenda/Craque) — **não é**: `AGENCIA_GERAL
= true`, liberada geral, comentário antigo dizia "só o Diego" mas isso mudou
em 03/08. Achei a causa de verdade: `CardCollectPrompt` já GARANTIA a carta
no ÁLBUM na hora (efeito "conta mesmo sem abrir"), mas o aviso pra Agência
(`ADD_EMPRESARIO_CARD`) só disparava dentro de `openPack()` — ou seja, só se
a pessoa tocasse no pacote OU esperasse o timer acabar. Quem avança rápido
pra próxima temporada antes disso: álbum ok, Agência vazia.
**Regra confirmada pelo Diego (nesta conversa)**: "deve qualquer título
ganhar carta... serve pra qualquer modo rápido/carreira/online/offline...
até na várzea... e qualquer outro novo que eu invente." Ou seja: card da
Agência tem que ser GARANTIDO igual o álbum, sem depender de interação.
**Corrigido**: novo callback `onGuaranteed` no `CardCollectPrompt`, disparado
no MESMO instante da garantia do álbum. Trocado nos 4 lugares que alimentam
a Agência: liga (solo/online), Copa Legends, multiclube pendente e Copa do
Mundo. `onClaimed` continua como estava (o broadcast pros outros da sala
online ainda espera a revelação de verdade — sem spoiler pra ninguém, regra
separada e não mexida). Reversível com `git revert da5c24a`.
⚠️ **Não corrigido retroativamente**: a Série D do Luiz já passou (ele tá na
Série C agora) — a carta dele NÃO vai aparecer na Agência sozinha, porque a
tela daquele título específico não existe mais pra remontar. Se quiser
compensar ele, precisa de um ajuste manual no save dele (não fiz — precisa
acesso ao Supabase, que essa sessão não tinha liberado).
✅ **Segunda pergunta do Diego, respondida**: e se o prêmio sortear uma carta
de categoria ainda TRANCADA (ex.: 👑 Lenda antes de comprar a SAF)? Já
funciona do jeito certo: a carta APARECE e CONTA (mostra no "Sua Agência",
inclusive pode ser convocada pros 22 ativos), só a RENDA em moedas fica
"🔒 destrava: [requisito]" até desbloquear aquela categoria — nunca esconde
nem perde a carta, só a moeda que ela renderia.

## 🏪 APOIE v14 COMPLETO — NO AR (09/08, commit 9087922; Diego reclamou
"quase não mudou" vendo só o card do sócio): o MIOLO do modal foi trocado
pelos cards aprovados — ⭐ Craque (Manual/prata/overall até ⭐ + chips 4
fichas e sócio 4,90) · 👑 Lenda (ouro/VIP/overall total + caixa dourada
Carreira Online/Ligas Fechadas + chips 6 fichas, +R$20, sócio 2,90) ·
🖋️ Batismo preto-e-ouro (nome no jogo, preços com motivo A·B·C·Várzea
59,90 / Série D rivais 69,90, tudo da Lenda, SÓCIO INCLUSO, FUNDADOR até
nº100, regra do barão, 8 fichas). Tocar no card abre o fluxo de compra de
cada um (cores prata/ouro · dream). "Só apoiar (Pix)" virou botão fino.
Caixa antiga "Só pra quem é Lenda" saiu (conteúdo mora no card da Lenda).
+ 🗳️ BANCO DA VOTAÇÃO PRONTO (migração votacao_e_mural_dos_socios):
esc_votacoes/esc_votos + RPCs esc_admin_votacao_criar/fechar,
esc_votacao_atual (% ao vivo, só sócio), esc_votar (troca permitida
enquanto aberta) e esc_mural (nome+nº+desde+tier, sem e-mail). FALTA a UI
(área do sócio no modal + seção votação no painel) — próxima leva.

## 🐊 FESTÃO DA MASCOTE — NO AR (09/08, commit 9c1d24f):
src/escalacao/mascotes.tsx = registro MASCOTES (chave→desenho; 1ª: 'alface',
a alface brava de corpo inteiro) + <FestaoMascote>: overlay do GIF aprovado
em CSS 60fps — fundo verde radial + raios girando + chuva de confete +
"🏆 CAMPEÃO!" pulsando + a mascote ATRAVESSANDO a tela quicando (sombra,
gingado), ~4,2s, toque pula. Gatilhos: RÁPIDO (EscEnd, youWon) e CARREIRA
(campeão da divisão, pós-animação da 38ª). Só o campeão vê; 1x por
temporada (sessionStorage). A chave vem de esc_socios.mascote_key — campo
novo "mascote (chave: alface)" no painel 🎨. Pra estrear: setar
mascote_key='alface' pro matheus223lms (Alfacehh) no painel.
FALTAM da fila grande: votação+mural · cards v14 no modal · patch
quase-nomes · mascotes novas conforme os barões pedirem (desenhar em
mascotes.tsx, mesma receita da alface).

## 📰 ESTÁDIO NO JORNAL — NO AR (09/08, commit 3298204): a capa do jornal
de fim de temporada (na tela E na imagem compartilhada pro zap/IG) agora
fecha o subtítulo com "Direto do 🏟️ {nome batizado}." quando o sócio tem
estádio batizado. Propaganda do batismo de estádio em toda capa postada.

## 🚪 PORTA DOS OLHEIROS NO AR (09/08, commit 95119d0): no topo do elenco
da carreira, quem NÃO tem tier vê o convite discreto "🕵️ Quer ver o
overall? ⭐ vê até craque · 👑 vê TUDO — toca aqui" → abre o APOIE (tela
choice). Some pra Craque/Lenda (regra das portas: botão só pra quem não
tem). Obs: a arte antiga olheiro-porta.png dizia "olheiros do sócio" —
DESATUALIZADA, olheiros são dos TIERS agora.

## 🎟️ FICHAS DE CARREIRA POR TIER — NO AR (09/08, commit ee324df, Diego
confirmou 2/4/6/8): grátis 2 · ⭐ Craque 4 · 👑 Lenda 6 · 🖋️ Batismo 8.
careerSlotLimit(count) em store.tsx: GRANDFATHER LITERAL — limite pessoal
nunca fica abaixo do que a pessoa JÁ tem (nada apagado, nada travado; a
régua só vale pra criar ALÉM). MAX_CAREER_SLOTS virou teto de GUARDA = 8
(o slice do arquivo nunca corta ninguém). Trava com aviso claro + caminho
("apague uma ou vire ⭐4/👑6/🖋️8") na tela Minhas Carreiras; linha "💾
Fichas de carreira" adicionada no card de cores do APOIE.

## 🕵️ OLHEIROS NO AR (09/08, commit 9f7825f — Diego cobrou ao vivo "não tô
vendo over no meu elenco"): overall "lo–hi" com FUNDO na cor da categoria
(ouro lenda · prata craque · roxo promessa · verde bom · bege resto) ao
lado de "clube · ano" nas listas Titulares/Reservas do elenco da CARREIRA.
Escadinha: 👑 ouro/batismo vê TUDO · ⭐ prata vê fame<5 · resto nada.
Gates duros: olheiros={onlineMode!=='online'} (nunca online), só
ElencoField (nunca leilão/monte/YourPitch), cartas fake não mostram,
NUNCA a palavra da categoria. + MANTO AGORA LÊ DO BANCO: manto.ts busca
esc_meu_socio (cache com auth listener + hook useMeuSocio), fallback
MANTO_CONTAS do código; migração socio_personalizacao_admin criou RPC
esc_admin_socio_perso(email, c1, c2, estadio, mascote) gated no Diego.
✅ ENTREGUE (commit caf9ff8): inputs de personalização no painel (🎨
"Personalizar sócio": email + 2 cores do manto com PREVIEW das listras +
nome do estádio → esc_admin_socio_perso) e o NOME BATIZADO no título da
área do clube ("🏟️ Alfacehh Arena" no lugar do nome de nível; desenho
intocado, só pro dono sócio ativo).
AINDA FALTA: mascote/festão animado · votação de categoria + mural ·
cards v14 do craque/lenda/batismo no modal · patch quase-nomes · nome do
estádio nas manchetes do jornal · link avulso Craque 19,90 (Diego).

## 🏪 LOJA v1 NO AR (09/08, commit 556f697): o modal APOIE ganhou o SÓCIO
- Card 🎫 SÓCIO LEGENDS no TOPO da tela "choice" (roxo com brilho, selo
  NOVO): benefícios em 1 linha (manto/escudo/mascote/estádio/30 moedas/
  cor roxa+carteirinha) e o BOTÃO JÁ ABRE O PLANO CERTO do Mercado Pago
  pelo tier da pessoa (grátis 9,90 · prata 4,90 · ouro 2,90 — MP_SOCIO em
  screens.tsx) + logApoio pro funil.
- 💛 História do Luca v3 substituiu a antiga NOS DOIS lugares do modal
  (card preto-e-ouro, assinada "fundador nº 1").
- ❌ "100% grátis" REMOVIDO do jogo inteiro (grep = 0) → "grátis pra jogar".
- FALTA na loja (próximas levas): cards do Craque/Lenda/Batismo no formato
  v14 (hoje seguem o fluxo antigo de cores/Pix, funcionando) · link avulso
  Craque 19,90 na trava do Manual (esperando o Diego criar) · área do
  sócio · manto/mascote/estádio pelo admin · votação/mural · patch nomes.

## 🖋️🎫 BARÕES VIRARAM SÓCIOS — NO AR (09/08, commit 6ea494c + migração
baroes_socios_inclusos_e_resgate_mensal):
- 11 contas de batismo inseridas no esc_socios com validade 2099 e
  origem='batismo' (achadas nos comentários do FOUNDERS; LISTA CONFIRMAR
  com Diego): danielmanfre5 (Manfré FC) · matheus223lms (Alfacehh) ·
  jorgericardo777 (Império Samambaia) · davisantana1312 (Bicho da Seda) ·
  guilhermevictor539 (Nightfull FC) · msb102010 (Murriz FC) · ofc.toka10
  (Tôka10) · matheusncruz1 (Skyy FC) · adriano.ferrari@quepazseguros (SC
  Ferrari) · lucasigorbortoliniii (Marreco FC) · ricardopessoafreire
  (Barcenite FC). Eles já têm carteirinha roxa no perfil + selo 🎫.
- 🪙 RESGATE MENSAL: RPC esc_socio_resgatar (30 🪙, 1× por conta/mês,
  trava no servidor via esc_socio_resgates) → cliente credita com
  BANCO_CREDIT no caixa da carreira ativa. Vale pra TODO sócio ativo.
- 📢 BANNER DO BARÃO no topo da carreira solo (SÓ origem='batismo'):
  boas-vindas "seu batismo vale um Sócio", lista das vantagens (30 moedas
  — "as deste mês JÁ caíram" quando o resgate acontece —, escudo, mascote,
  manto, estádio, carteirinha) + botão "chamar no direct" (copia msg e
  abre o IG) + fechar com memória. Aviso pós-fechado quando moedas caem.

## 🚀 FECHA GERAL DADO (09/08, madrugada): "E pode implementar tudo já"
TUDO aprovado — specs finais: loja em cards v14 (sócio → HISTÓRIA v3 →
craque → lenda → batismo), história v3 com o LUCA (sem barra de servidor,
sem "100% grátis"), estilo v11 (título forte + 1 linha de tempero), preços
9,90/4,90/2,90 com os 3 links MP no diário, batismo com sócio incluso +
fundador. ✅ JÁ ENTREGUE nesta leva: carteirinha ROXA de sócio no perfil
(commit 81fc7c0: card roxo com nº/meses de casa/desde + selo 🎫 no nome —
o 1º sócio que o Diego liberar no painel já aparece). PRÓXIMAS OBRAS na
ordem: (1) LOJA NOVA no jogo (substituir modal APOIE: cards v14 + história
v3 + botões abrindo os links MP por tier + corrigir "100% grátis" do
paywall vivo) · (2) área do sócio (pedidos de escudo/mascote/manto/nome do
estádio → admin) · (3) manto pelo admin (tirar do hardcode) · (4) nome do
estádio no jogo · (5) mascote/festão · (6) votação+mural · (7) patch
quase-nomes. Falta do Diego: link avulso Craque 19,90.

## 🏗️ PLANO DE OBRA DA LOJA/SÓCIO — "pode implementar" dado pelo Diego (09/08)
Ele aprovou as carteirinhas ("Perfeito") e mandou construir TUDO que foi
decidido + um PERFIL COMPLETO do usuário. Ordem de obra combinada (cada
entrega = commit isolado, buildar antes, main = deploy):
1. ✅ PERFIL DO TÉCNICO v1 NO AR (commit 942e03e; mockup aprovado "Perfeito"
   + regra dele: 1 carteirinha só = tamanho grande — aplicada, a de fundador
   sozinha já ocupa a largura toda). O que entrou: tocar no técnico do
   ranking abre PERFIL (stats 🏆👟⚽🎴 da RankRow + sala de troféus em chips +
   carteirinha de FUNDADOR — por ora SÓ no próprio perfil, pois FUNDADOR_N é
   por e-mail local) e o álbum virou seção "🎴 Álbum de cartas" (chips
   carreira/conta e ordenação intactos). FALTA (fase 2, depende da infra
   item 2): carteirinhas dos OUTROS + header na cor do tier de cada um (RPC
   esc_perfil por user_id) + carteirinha de sócio.
   ✅ FASE 2 TAMBÉM NO AR (commit 6d20601 + migração
   perfil_publico_tiers_e_fundadores): Diego questionou ("se eu te dou o
   e-mail pra fazer craque/lenda, como não dá pra saber?") — e ele tinha
   razão: a ponte foi construída. (a) tiers do código FOUNDERS upsertados no
   user_colors com DO NOTHING (não sobrescreve o painel; 54 linhas);
   (b) tabela esc_fundadores (email→nº, RLS trancada, 28 fundadores);
   (c) RPC esc_perfil(p_user) SECURITY DEFINER: user_id → tier + fundador_n
   SEM expor e-mail. No jogo: header do perfil na COR DO TIER de cada um
   (grátis=bege) + selos no nome + carteirinha de fundador visível em
   QUALQUER perfil. ⚠️ Regra nova: ao dar tier/fundador novo, atualizar
   TAMBÉM o banco (user_colors/esc_fundadores) — ou só pelo painel, que já
   grava no banco.
   (era: 👤 PERFIL DO TÉCNICO — mockup perfil-ex.png aprovado):
   tocar num nome (ranking etc.) abre perfil completo — header na cor do
   tier + selos, stats (títulos/artilharias/gols/cartas — RankRow já tem),
   Documentos (carteirinha fundador preta-e-ouro / sócio roxa, só se
   existirem), Sala de Troféus, e o álbum de cartas vira UMA seção ("ver as
   N →" abre o álbum de hoje). Fundador nº: precisa expor por user_id (hoje
   FUNDADOR_N é por e-mail, client-side) — criar view/RPC ou coluna no
   ranking.
2. ✅ INFRA SÓCIO NO AR (09/08, migração infra_socio_legends + commit
   b3b4453): tabela esc_socios (email PK, socio_n identity FIXO, desde,
   valido_ate ~33d, manto_c1/c2, estadio_nome, mascote_key; RLS trancada) ·
   RPCs: esc_admin_socio_set (liberar/renovar +33d; p_dias<=0 EXPIRA sem
   apagar — nº e tempo de casa preservados, regra do Diego) ·
   esc_admin_socio_list · esc_meu_socio (status próprio) · esc_perfil
   AMPLIADO (agora devolve socio_n/desde/ativo também). Painel ganhou a
   seção "🎫 Sócio Legends · mensal" (roxa, entre Apoiadores e Fichas).
   💳 LINKS MP DOS SÓCIOS — COMPLETOS (09/08) e PREÇOS OFICIAIS CORRIGIDOS
   pra terminação ,90 (Diego): grátis R$ 9,90 · Craque R$ 4,90 · Lenda
   R$ 2,90 (batismo = incluso, sem plano):
   · 9,90/mês (grátis): https://mpago.la/2G3nmQq
   · 2,90/mês (Lenda): https://mpago.la/2CGoqiJ
   · 4,90/mês (Craque): https://mpago.la/1jqtK38
   ✔️ 09/08: eltonfrossard45@gmail.com virou LENDA (ouro+manual) + FUNDADOR nº 36
   + SÓCIO nº 12 (origem batismo, validade 2099) — direto no banco.
   ✔️ 09/08: TIME DE CORAÇÃO no perfil (só sócio; batismo já é sócio): coluna
   time_coracao em esc_socios + esc_perfil devolve + rótulo embaixo do escudo
   vira o clube REAL (Palmeiras, Cruzeiro...). Painel 🎨 ganhou o campo. Já
   setados: Xurupitas=Palmeiras · Manfré=Paraná Clube · Elton=Cruzeiro ·
   Nightfull=Atlético Mineiro · Diego=Flamengo. 💡 FUTURO combinado: ranking de
   TORCIDAS no jogo usando time_coracao.
   🔁 CORREÇÃO DE DONO (09/08, confirmada pelo Diego): o batismo Xurupitas FC
   (ex-Bicho da Seda) é da conta denilson.stifler10@gmail.com — a conta que
   JOGA de Xurupitas no ranking (registro de 07/08 tinha trocado pra
   davisantana1312). Movido o pacote inteiro: sócio nº 5 origem batismo,
   mascote mariposa, escudo_time Xurupitas FC, manto verde/branco.
   davisantana1312 segue Lenda paga + Fundador nº 11 (status original), SEM
   sócio. Atenção: o batismo Tokyo City também consta nessa mesma conta
   denilson — Diego vai checar com a galera se está certo.
   ✔️ 09/08: REGRA DO CLONE no ar — nunca dois times com o mesmo nome na mesma
   competição: humano jogando com o nome do próprio batizado esconde o robô
   homônimo DAQUELA partida/carreira (reserva entra; batizado segue normal pro
   resto do mundo). Pontos: makeManagers (online/rápido, c/ backfill),
   initCareerRivals, soloRivalDefs e fillerDefs. Saves em andamento intocados.
   📌 REGRA PRA TODA SESSÃO (09/08): liberar Craque/Lenda = setar user_colors
   (tier + manual). Essa é a CHAVE-MESTRA — overall dos olheiros, fichas de
   carreira e preço do sócio derivam dela sozinhos, não existe trava separada.
   E ANTES de explicar o que um tier dá, ler este diário (o mundo mudou 09/08).
   ✔️ pereirigor@outlook.com = Craque completo (conferido: prata+manual no banco).
   ✔️ 09/08: PERFIL ganhou "🛡️ O clube do coração": escudo artesanal + mascote
   de quem TEM (esc_perfil agora devolve mascote_key + escudo_time; coluna nova
   escudo_time em esc_socios com os 5 barões). Sem placeholder pra quem não tem.
   Troféus da Sala de troféus MAIORES (14px, borda 3px, Oswald).
   ✔️ 09/08: KIT NIGHTFULL FC publicado (Atlético-MG do Guilherme): escudo
   alvinegro c/ lua+estrela e o GALO BALADEIRO de óculos escuro; mascote 'galo'
   (corrente de ouro, pose Travolta, bola); manto preto/branco no banco.
   Total: 5 escudos artesanais + 6 mascotes no ar.
   ✔️ 09/08: KIT MANFRÉ FC publicado (Paraná Clube do Manfré): escudo azul c/
   faixa vermelha + CABEÇONA da gralha-azul (molde da referência oficial que o
   Diego mandou — só a cabeça no escudo, pedido dele); mascote 'gralha' inteira
   (camisa metade/metade, mão na cintura, pé na bola); manto azul/vermelho no
   banco. 4º escudo artesanal + 5ª mascote.
   ✔️ 09/08 (noite): KIT NEYMARZETTI publicado (aprovado v5): escudo artesanal
   de perfil c/ crista ÚNICA preto+loiro, brincão, sorrisão c/ dentes; mascote
   'moicano' (camisa 11, meião, bota amarela, bola). Diego virou SÓCIO Nº 1 no
   banco (todos os outros desceram +1: Manfré 2, Alface 3...), manto vermelho/
   preto agora no DB. Mascotes setadas: alface (matheus223lms), mariposa (davi),
   raposa (elton), moicano (diego). 4 escudos artesanais no ar.
   ✔️ 09/08: ÁREA DO SÓCIO no ar (mockup aprovado; SEM votação criada — quem
   cria as perguntas é o Diego pelo painel): no APOIE, sócio ativo vê "Você é o
   Sócio nº X" no lugar da propaganda → abre votação (barras SÓ depois de votar,
   anti-spoiler) + mural (cor do próprio tier, nº, origem, desde). Painel ganhou
   seção 🗳️ criar/parciais/fechar. ✔️ Xurupitas FC no lugar do Bicho da Seda
   (davisantana1312) — kit mariposa APROVADO e no ar: escudo SÓ asas de cima (pedido do Diego), mascote inteira (chave mariposa), manto verde/branco no banco.
   ✔️ 09/08: sócio agora BATIZA O PRÓPRIO ESTÁDIO na área do estádio (✏️ no
   título → formzinho ABAIXO do StadiumSvg; RPC esc_socio_estadio_nome valida
   sócio ativo — batismo entra junto pois é sócio). Vazio = volta ao padrão.
   Aparece no clube + capa do jornal. Diego segue podendo trocar pelo painel.
   ✔️ 09/08: KIT completo do La Bestia Negra aprovado e no ar — escudo artesanal
   (LOGOS_PRONTAS em escudos.tsx: azul cruzeirense + raposa + estrela creme),
   mascote 'raposa' (mascotes.tsx, cara igual à do escudo) e manto azul/creme
   (#0E3E86/#F4ECD6) + mascote_key no banco. Estádio dele ainda SEM nome — se o
   Elton quiser, Diego seta pelo painel.
   ✔️ batismo do Elton: "Lá Bestia Negra" no lugar do River Prato (SÉRIE D, a
   dos rivais) — DIVISION_TEAMS.D + CPU_MANAGERS + ponte OLD_NAME pros saves.
   ✔️ 09/08 (tarde): LOJA DE TELA ÚNICA no ar (mockup v3 aprovado, "e publique"):
   o modal APOIE virou acordeão — 4 pacotes (Sócio/Craque/Lenda/Batismo), um
   amplia por vez com TUDO dentro (simulação da cor c/ nome real, botões do
   Manual, overall Djalminha ⭐ 83–88 no Craque e Romário 👑 93–99 no Lenda,
   grupo VIP, Carreira Online em preto+ouro, tabela do batizado + fundador).
   Botão do Craque em prata, do Lenda em ouro. Escolheu → tela 'pay' (Pix +
   comprovante + voltar). Telas 'cores' e 'dream' REMOVIDAS (rotas do Manual e
   ?apoie=lenda apontam pro novo fluxo). PENDENTE: Diego mandar os 4 links de
   pagamento avulso do MP (Craque 19,90 · Lenda 39,90 · Batismo 59,90 · Batismo
   Série D 69,90) → aí entra o botão 💳 "Pagar no cartão" na tela 'pay' e no
   batismo. Sócio no cartão já funciona (links de assinatura corrigidos).
   ✔️ 09/08: telas INTERNAS (cores/manual/dream/batismo) corrigidas pro mundo novo:
   Promessa 💎 fora da vitrine (roxo agora é cor do Sócio; quem tinha, mantém),
   FUNDADOR só via batismo (saiu do Lenda; contador de vagas foi pro dream),
   sem "pra sempre" no batismo, preços 59,90 (A/B/C/Várzea) e 69,90 (Série D)
   explicados, Sócio incluso citado no dream/batismo.
   (⚠️ 09/08: Diego trocou — os links antigos 32tTjqE/1BiaXQ6/2xzZmiC estavam ERRADOS, era por isso que o botão "Pagar assinatura" ficava cinza)
   ⚠️ NUNCA usar 4,99/2,99 em arte/código — é 4,90/2,90. Artes de referência
   (m1/m2/olheiro-porta/portas-ex) já corrigidas; m1 também ganhou a
   caixinha FINAL (manto, escudo, mascote+festão, batizar estádio, roxa,
   voto, 30 moedas, carteirinha/mural — sem olheiro, sem cobertura).
   FALTA SÓ: link avulso do ⭐ Craque R$ 19,90 (pra trava do Manual).
   ✍️ ESTILO DE TEXTO DA LOJA — LEI DO DIEGO (calibrada em 3 rodadas,
   09/08): v9 "escrevendo demais" → v10 bullets secos "resumiu demais" →
   ✅ v11 É O PONTO: cada benefício = TÍTULO FORTE em negrito (5-6
   palavras) + UMA linha de tempero em cinza menor (a frase que dá água
   na boca), mini-amostra visual na linha (chip do overall), letras
   miúdas viram chips. APLICAR esse formato em TODA a loja final
   (m1/m3 idem quando virarem código).
   v12 (5 ajustes do Diego, 09/08): chip "⭐→👑 depois vira Lenda por +20"
   TAMBÉM no card do Craque · bullet "Por que a Série D custa mais?"
   (série dos RIVAIS, todo mundo começa lá) · SEM "pra sempre" no nome do
   batismo · bullet do sócio incluso sem o "mesmo se perder o nome" (a
   regra do barão embaixo já explica, não repetir) · linha da Carreira
   Online/Ligas Fechadas na Lenda com DESTAQUE (caixa dourada).
   v13 (Diego, 09/08): chip do upgrade "+R$20" fica SÓ na Lenda (saiu do
   Craque — "já tem no craque falando isso" → decisão final: como estava) ·
   preço do batismo explicado NA LISTAGEM, curto: "Série A·B·C e Várzea —
   59,90 · times de todas as divisões do modo carreira" e "Série D — 69,90
   · os rivais escolhidos pra te enfrentar" (bullet longo do porquê saiu;
   header do card virou só "uma vez"). ⚠️ NOVO: batismo agora inclui
   VÁRZEA na faixa de 59,90.
   v14 (Diego reafirmou 09/08): overall NUNCA no leilão — SÓ no elenco da
   pessoa, APÓS contratação, e SÓ no modo carreira. Regra já era lei; agora
   os cards DIZEM isso na cara ("no leilão segue todo mundo às cegas — a
   emoção não muda"), pra ninguém comprar esperando ver overall no pregão.
   ⚠️ NA IMPLEMENTAÇÃO: overall aparece apenas em ElencoField/carreira,
   jamais em YourPitch/leilão/monte/online.
   💛 HISTÓRIA DO DIEGO NA LOJA (pedido dele 09/08: "mais aparente"):
   reescrita e virou CARD de destaque preto-e-ouro (historia.png):
   "Quem faz isso aqui 🔴⚫" — vende carro de dia com o pai, faz o jogo de
   madrugada sozinho; filho com condição rara (120 casos no mundo), o jogo
   existe por ele; apoio = vida melhor pro filho + jogo 100% grátis;
   "apoio nenhum dá vantagem em campo"; assinatura "🖋️ Diego · fundador
   nº 1" + barra "sócios seguram o servidor" INTEGRADA no card. POSIÇÃO:
   logo abaixo do card do Sócio, antes do Craque. Aguardando OK.
   v2 da história (09/08): ❌ BARRA "sócios seguram o servidor" CORTADA
   (recomendação aceita: número baixo público anuncia fraqueza + tom
   pedinte; prova social volta só quando houver número bonito) · ❌ "100%
   grátis com tudo liberado" REMOVIDO (Diego: "não está mais") → virou
   "este jogo vivo, crescendo toda semana". ⚠️ Checar o paywall AO VIVO:
   o texto atual da tela principal também promete "100% grátis pra sempre,
   com tudo liberado" (screens.tsx ~linha 238 e 367) — corrigir junto com
   a loja nova pra não prometer o que não é.
   🕵️→🎨 PEDIDO DO DIEGO (09/08, madrugada): nos cards de Craque/Lenda o
   olheiro tem que DIZER "overall do jogador" e MOSTRAR mini-amostra visual
   (chip colorido tipo "Djalminha 82–91") — feito na v9 do m2 (Craque:
   Djalminha 82–91 + Zagallo "?" com nota "lendas só com 👑"; Lenda: tudo
   revelado). E a ÁREA DO SÓCIO (m3) foi reformada pra caixinha final:
   carteirinha roxa + votação + "mimos à mão" (escudo/mascote/manto, pede
   ali) + batizar estádio + 30 moedas + mural. Saíram do m3: cobertura
   (virou obra), olheiros (viraram dos tiers), manual.
   ⚖️ PREÇO DO BATISMO RESOLVIDO — REGRA FINAL (09/08, ajustada pelo senso
   de justiça do Diego): 🖋️ BATISMO INCLUI O SÓCIO LEGENDS, e o incluso é
   DE QUEM PAGOU o batismo — NÃO do nome. Perdeu o nome no leilão dos
   barões (não cobriu)? Perde SÓ a placa; ouro/VIP/olheiros/clube de sócio
   continuam com a conta que pagou ("eu acho que seria justo quando ele
   perder o nome continuar com sócio pelo menos" — Diego). O novo barão
   também pagou → também tem o dele. Vetos anteriores mantidos: sem meio-
   termo de meses, sem 3,90, sem a palavra "pra sempre" na comunicação.
   Lenda segue 2,99; preços intactos (9,90/4,99/2,99). Escadinha final:
   grátis→9,90 · craque→4,99 · lenda→2,99 · batismo→INCLUSO (da conta).
   Planos MP necessários: 4,99 e 2,99 + link avulso Craque 19,90.
   🖋️ FUNDADOR MUDOU DE CASA (decisão do Diego 09/08): a partir de agora o
   selo FUNDADOR (numerado até o 100) vem do BATISMO, não mais da Lenda.
   Lenda vira 39,90 SECO (sem "→49,90", escadinha de fundador saiu do card).
   Quem JÁ é fundador por Lenda (nº 1-35) CONTINUA — "nº gravado é nº
   gravado", não remover ninguém. Arte loja-m2 v7 atualizada e enviada
   (Lenda sem caixa de fundador; Batismo com "agora é o batismo que faz
   FUNDADOR" + chip "SÓCIO INCLUSO — é da conta").
   + v8 (pedido do Diego 09/08): card da Lenda ganhou de volta a caixa "🔜
   já garante o que vem chegando: a nova Carreira Online e as Ligas
   Fechadas SEM BOTS — só entre amigos" (promessa que já existe no paywall
   ao vivo hoje; não esquecer na loja final).
3. 🪪 CARTEIRINHAS no jogo (área do apoiador + perfil) — visual APROVADO
   (carteirinhas.png), compartilháveis via motor do shareElenco.
4. 🏟️ NOME DO ESTÁDIO (campo aprovado por Diego no admin; aparece na área do
   clube ABAIXO do StadiumSvg + manchetes do jornal).
5. 🐊 MASCOTE: MASCOTES_PRONTAS (símbolo por conta, tipo LOGOS_PRONTAS) +
   FESTÃO do título aprovado (GIF): overlay ~4s pós-apito, só o campeão vê,
   60fps, toque pula; mora na área do clube na carreira.
6. 🗳️ VOTAÇÃO de categoria (ORIENTA — default recomendado, Diego não vetou)
   + 🧱 MURAL dos sócios (com selos e tempo de casa).
7. 🏪 LOJA NOVA (artes v6 aprovadas em série) — TRAVADA esperando Diego criar
   os planos/links no Mercado Pago (9,90/4,99/2,99 + link Craque 19,90 pra
   trava do Manual).
8. 🩹 PATCH QUASE-NOMES estilo PES (toggle por pagante no admin) — depois da
   infra (2).
SEM VEREDITO (não fazer): capa de campeão · camisa aposentada · batizar
torcida/clássico · bots com nomes batizados no online.
JÁ NO AR: manto beta (conta do Diego) · campinhos de todos no rápido online ·
retrátil como obra do estádio.

## 🆕 Banner verde removido + home com novidades atualizada (08/08, pedido do Diego) ✅ NO AR
Diego: "remove esse banner verde q atualizou do jogo toda hora" (culpado: com o
volume de deploys do dia, o `VersionWatcher` — `index.tsx` — avisava sem parar)
+ "atualize a home c várias novidades... banner de cima que fala de hall
troféus... e o banner novo da novidade do modo online de duplas".
- **Banner verde removido**: `VersionWatcher` não mostra mais o toast "O jogo
  atualizou". O auto-reload SILENCIOSO continua (só na tela inicial/home,
  no máx. 1x/5min) — ninguém fica preso numa versão velha, só não avisa mais.
- **Banner de cima** (`NewsBanner`, dispensável, em cima do menu): trocado o
  `NEWS_ID` (→ `2026-08-duplas`) pra reaparecer pra todo mundo, com Duplas
  (beta), Patrocínio-aposta, Contratos em massa e o Hall da Fama que já tinha.
- **Seção de baixo** (`NewsSection`, embaixo do botão de tema noturno): 3
  itens novos no topo da lista "📢 Últimas novidades" — Duplas, Patrocínio-
  aposta, Contratos em massa.
- Revertível com `git revert 89c442b`.

## 💛 LOJA — MOCKUPS VISUAIS ENVIADOS (08/08 à noite) — aguardando OK do Diego
4 artes na identidade do jogo (scratchpad da sessão: loja-m1..m4.png):
1. loja-m1 — vitrine: card SÓCIO LEGENDS 9,90/mês + preço de fidelidade
   (Craque 4,99 · Lenda/Batismo 2,99) + 8 benefícios + barra "sócios seguram
   o servidor" (meta do mês).
2. loja-m2 — vitalícios: Craque 19,90 · Lenda 39,90 (fundador até nº100 →
   49,90) · BATISMO "leilão dos barões" A/B/C 59,90 · D 69,90.
3. loja-m3 — área do sócio: carteirinha tempo de casa, votação com % ao vivo,
   cobertura retrátil (ABAIXO do StadiumSvg sagrado), escudo à mão (barra
   3 meses), mural dos sócios (cada nome na cor do próprio tier).
4. loja-m4 — onde o nome batizado aparece: tabela Série D (fundinho dourado
   + 🖋️) + jornal + PROPOSTA NOVA mostrada: times dos barões entram no
   sorteio dos BOTS (sala online + modo rápido) — precisa de OK explícito.
DECISÕES NOVAS DO DIEGO (08/08 à noite):
- Manter o desenho DELE (preços/fidelidade como estavam). SEM 1º mês grátis.
- ⚠️ NUNCA usar "pra sempre" na comunicação do BATISMO: batismo é LEILÃO DOS
  BARÕES — se alguém oferecer mais e o dono atual não cobrir/igualar, o nome
  do time MUDA de dono. (Craque/Lenda vitalícios seguem permanentes.)
- Ele pediu mockup completo incluindo COMO O NOME aparece "na sala online,
  carreira e todos os modos" → por isso a proposta dos bots batizados no m4.
DECISÕES NOVAS DO DIEGO (rodada v2 dos mockups, mesma noite):
- 💜 ROXO É A COR DO SÓCIO (mensal). Língua de cores: dourado = Lenda E
  Batismo · prata = Craque · roxo = sócio · bege = grátis. (No banco o único
  tier roxo era conta de teste pessoa@email.com — cor livre, sem conflito.)
- 🖋️ BATISMO GANHA TUDO DA LENDA incluso (ouro/qualquer cor com brilho,
  selo, grupo VIP) — escrito no card do batismo.
- 🛡️ ESCUDO À MÃO já no 1º MÊS de sócio (era 3 meses — ele cortou a espera).
- Lenda+sócio ao mesmo tempo: PROPOSTA enviada (cor mais alta manda — ouro
  continua em todo canto — e o sócio vira selinho 🎫 ao lado do nome; sócio
  puro fica roxo). Aguardando OK dele nessa regra.
- 🎮 MANUAL: ⚖️ DECIDIDO PELO DIEGO (08/08) — Manual FORA do sócio de vez
  ("N pode ter botão de manual pra sócio não em três meses... Só se ele
  pagar msm o craque tb"). Manual = EXCLUSIVO do ⭐ Craque 19,90. A trava do
  Manual fica com UM botão só (Craque). O card do Craque na loja vende isso:
  "Manual seu pra sempre — SÓ o Craque tem, nem o sócio destrava". A ideia
  do 3º mês foi descartada. Artes v5 atualizadas (m1 sem linha de Manual,
  m2 e portas-ex reforçando a exclusividade).
- 📐 ORDEM DOS BENEFÍCIOS no card do sócio (pedido dele, v4): 1º olheiros/
  overall · 2º escudo à mão · 3º cor roxa no nome · 4º carteirinha · depois
  o resto (votação, cobertura, moedas, manual 3º mês, mural).
- 🛡️ ESCUDO ganhou EXEMPLO DE IMPACTO próprio (igual o do overall):
  scratchpad/escudo-ex.png — antes (automático) → Alfacehh FC à mão
  (reaproveita os símbolos #alfacehh/#alfacehhMini do mock-alface de outra
  entrega), + como fica na tabela e no placar com versão mini.
- 🚪 REGRA ANTI-CANSAÇO das portas de venda (Diego temeu "muito botão de
  apoie" e cansar quem já pagou; arte portas-ex.png enviada): (1) todo botão
  é atalho pra MESMA loja, não existem lojas separadas; (2) botão/cadeado SÓ
  aparece pra quem NÃO tem aquilo. Craque nunca mais vê o cadeado do Manual;
  sócio não vê botão nenhum. Cobertura = item com cadeado na estrutura
  (abaixo do estádio), SEM botão "apoie" solto.
- 🕵️→🎫 PORTA DO OLHEIRO — REFINO DO DIEGO (decidido): o botão de sócio nos
  olheiros aparece pra TODO não-sócio, de QUALQUER categoria (grátis, craque,
  lenda, batismo). Ao tocar, a pessoa VÊ a diferença: R$ 9,90 RISCADO + "você
  paga 4,99/2,99" + a escadinha completa com a linha DELA marcada (VOCÊ) — de
  propósito, pra ela ver o que os outros pagam e sentir o desconto do tier.
  Arte: scratchpad/olheiro-porta.png.
- 🕵️ OLHEIROS POR ESCADINHA DE TIER — IDEIA DO DIEGO aplicada na v6 (raciocínio
  dele: "sócio torcedor não tem a ver com olheiros" — sócio é torcida, olheiro
  é estrutura/status; bate com o funil, status vende). Distribuição:
  🆓 grátis = nada · 🎫 sócio = olheiro de BASE (💎 promessas + 🪵 ex-
  profissionais) · ⭐ Craque = de craque pra baixo (tudo menos lendas) ·
  👑 Lenda = TODOS · 🖋️ Batismo = todos (tudo da Lenda, SEM escudo — Diego
  devolveu o escudo à mão pro SÓCIO). Elenco misto (parte colorida, parte
  "?") vira vitrine: quem vê metade quer o resto → upsell natural
  Craque→Lenda. Sócio pra Lenda fica como clube de torcida (votação,
  cobertura, moedas, escudo, mural, 2,99 simbólico). AGUARDANDO o "fecha"
  final do Diego nessa distribuição.
- ❌ CARDÁPIO DE IDEIAS DESCARTADO PELO DIEGO ("N gostei nda disso"):
  placas, aniversário, batizar folclórico, bônus de fichas, recado do
  presidente, faixa da torcida, conselho mensal, pacote coração (manto/
  carteirinha-coração/escudo-com-alma) e o modelo "comunidade fornece o
  patch". NÃO reapresentar.
- ✅ O QUE ELE QUER (decidido 08/08): além dos itens fixos da caixinha, DOIS
  mimos de ENTREGA MANUAL pelo admin (modelo igual cor/tier de hoje), por
  e-mail do pagante: (1) 🩹 toggle NOMES REAIS — patch de exibição na
  carreira (tabela/jornal/placar; de-para preenchido 1x pelo Diego numa
  tabelinha editável no admin; chave interna intocada; batizado imune);
  (2) 🥁 CANTO DA TORCIDA — Diego sobe MP3s (1x, Supabase Storage) e escolhe
  qual toca pra cada pagante na temporada da carreira (mudo com memória;
  rugido nunca antes do gol na tela). Aviso legal dado 1x (marca/direitos:
  entrega manual não muda o risco); decisão dele, seguimos.
- ⚖️ QUADRO LEGAL EXPLICADO AO DIEGO (08/08, pergunta direta dele): nomes
  reais = marca registrada, precisa licença (por isso Cartola paga e
  Brasfoot nunca embutiu); canto real = pior ainda (música + gravação,
  ECAD). Risco prático: pequeno hoje, cresce com o sucesso → notificação
  pra remover. Alternativa 0-risco com 90% do efeito: QUASE-NOMES estilo
  PES ("Rubro-Negro Carioca") + som de arquibancada genérico. A TOMADA
  técnica é idêntica nos dois cenários; conteúdo = escolha/risco dele.
- 💡 REENQUADRAMENTO PROPOSTO (08/08, após "tô mt na dúvida... N sei se tá
  tendo vantagem" — o esvaziamento era real): nomes+som viram A COROA do
  sócio, EXCLUSIVOS do sócio (nunca avulsos, nunca de brinde em tier) — é o
  único benefício desejado igual por grátis/craque/lenda, sustenta 9,90/
  4,99/2,99 pros três. Retenção embutida: cancelou → nomes voltam a ser
  fictícios e estádio fica MUDO. Caixinha final enxuta: nomes reais + som
  do estádio + voto + 30 moedas/cobertura + escudo à mão + carteirinha/
  mural/cor roxa. AGUARDANDO O "FECHA" → aí arte final da loja completa.
- 🥁 IDEIA 8 (do Diego): TORCIDA SONORA na simulação da carreira — loop de
  arquibancada, volume cresce com o estádio da SAF, rugido junto com o
  carimbo do gol (NUNCA antes — lei do spoiler), só gol do próprio time,
  botão de mudo com memória. Só pra sócio. REFINO DO DIEGO: ele quer SUBIR
  os MP3 ele mesmo (canto real por clube do coração, ex. Flamengo) pelo
  painel admin → Supabase Storage, um arquivo por clube; sem arquivo → som
  genérico. ⚠️ Avisado 1x do risco autoral de cantos reais (paródias de
  músicas protegidas + venda de assinatura); decisão é dele. Alternativa
  segura sugerida (e MUITO a cara do jogo): a COMUNIDADE grava os próprios
  cantos (grupo VIP), Diego aprova e sobe — mesmo esquema técnico, zero
  risco, zoeira máxima. Aguardando decisão.
- 🩹 IDEIA 10 (do Diego): PATCH DE NOMES REAIS (estilo Brasfoot) como
  benefício de sócio. ⚖️ Modelo legal do Brasfoot: o jogo vende o SUPORTE a
  patch (importar arquivo de apelidos), a COMUNIDADE cria/compartilha o
  arquivo com nomes reais — o jogo nunca embute marca registrada. 🔧 Lei
  técnica: patch é APELIDO DE EXIBIÇÃO apenas (tabela/jornal/placar/ficha);
  a chave interna do time NUNCA muda (lição van der Sar — senão quebra
  cpuSquads/valores/histórico). Liga/desliga sem efeito no save. 🖋️ REGRA
  SAGRADA: patch jamais renomeia time BATIZADO (barão pagou pelo nome). Só
  carreira solo (online precisa de nomes iguais pra todos). Esforço médio.
  Aguardando decisão.
- ❤️ IDEIA 9 (do Diego): PACOTE CORAÇÃO — usuário torce por um clube REAL
  (ex.: Flamengo) e o jogo usa isso SEM nome/escudo oficial (marca
  registrada; cores e padrões são livres): (a) MANTO DO CORAÇÃO — o time
  dele (ex.: Bagres FC) veste as cores/listras do clube do coração no
  campinho/ficha (⚠️ nome do usuário SEGUE na cor do tier, intocável);
  (b) carteirinha/mural com "❤️ torço pro X" (texto declarado pelo próprio
  usuário) + coraçãozinho nas cores; (c) escudo à mão nasce "com alma" do
  coração; (d) tempero no estilo da torcida sonora. Manto = o mais
  trabalhoso (mexe no campinho, mockup antes). Aguardando decisão.
PERGUNTA ABERTA (segue sem resposta): voto dos sócios DECIDE ou só orienta?
Depois do OK: ordem combinada = loja nova → trava do Manual 2 botões →
olheiros (só elenco) → votação/área do sócio → cobertura retrátil (mockup
antes, StadiumSvg intocável) → carteirinha/mural. Diego cria os 3 planos no
Mercado Pago e manda os links; validade 30d do sócio entra no admin.

## 💛 (histórico) LOJA — SPEC COMPLETA ENVIADA (08/08) — texto antes das artes
Spec final em texto (antes do mockup, como ele pediu). Decisões DELE já dentro:
- Preços: Sócio 9,90/mês (Craque 4,99 · Lenda/Batismo 2,99) · Craque 19,90 ·
  Lenda 39,90→49,90 pós-fundador nº100 · Batismo D 69,90 / ABC 59,90 ·
  upgrade Craque→Lenda por R$20 · vale-presente (código estilo fichas).
- Caixinha do sócio: votação de categoria das cartas novas (enquete estilo IG,
  % ao vivo, Diego escolhe a urna) · 3 olheiros · cobertura retrátil
  (+10/temporada enquanto sócio; cancela → fecha) · 30 moedas/mês · manual ·
  carteirinha tempo de casa · escudo a dedo após 3 meses · mural dos sócios.
  SEM carta do mês (cortada por ele) e SEM copa anunciada.
- 🕵️ OLHEIRO — REGRAS DO DIEGO (08/08): aparece SÓ NO ELENCO do usuário
  (⚠️ NÃO no leilão — decisão dele, e concordo: leilão às cegas é a alma/anti-
  spoiler + ranking). Mostra SÓ o overall "de tanto a tanto" com o FUNDO na cor
  da categoria (dourado lenda · prata craque · roxo promessa · verde bom · bege
  foi-profissional). NUNCA a palavra escrita. Exemplo: Zagallo 92–97 fundo
  dourado (scratchpad/olheiro-ex.png). Sem olheiro = como hoje. NUNCA online.
  Ideia guardada (não fazer agora): olheiro no MONTE como meio-termo futuro.
- Pagamento: 3 planos no MP (cartão) + recarga Pix 30d; entrega pelo painel
  (já no ar) + validade de 30 dias a construir.
PERGUNTA ABERTA: o voto dos sócios DECIDE a categoria ou só orienta?
⚖️→🎨 DECISÃO DO DIEGO (09/08): NADA de nome real ("Flamengo") nem canto
real — ele acatou o quadro legal. Cardápio REABERTO a pedido dele (a nota
"não reapresentar" caiu — ele pediu "fale todas aqui novamente"). Lista
completa reenviada com as versões LEGAIS destacadas: quase-nomes estilo PES
+ som de estádio genérico + manto do coração (cores são livres) — mesmas
tomadas técnicas, zero risco. Escudo à mão explicado de novo (desenho manual
do Diego via LOGOS_PRONTAS/admin; aparece no elenco, tabela, placar,
carteirinha, mural; 1º mês). Seleção recomendada pra caixinha: fixos +
quase-nomes + som genérico + manto do coração + placas do campinho +
aniversário do sócio; resto vira novidade mês a mês. AGUARDANDO ele escolher.
AMOSTRAS ENVIADAS (09/08): 🔊 torcida-demo.wav (28s sintetizado: murmúrio +
bateria 104bpm + apito + rugido de GOL aos 15s + olé; gerado 100% em código,
zero direito autoral — é a vibe, produção final pode usar loops CC0 melhores)
+ 🎽 manto-ex.png (antes/depois da camisa, campinho com o Bagres FC de manto
rubro-negro, 6 opções de cores, regra "cancelou → manto volta pro genérico").
CORREÇÃO DO DIEGO (09/08): "hoje não tem camisa, é balãozinho/fichinha com o
nome" — verdade (ElencoField usa chips brancos pos+nome). Arte refeita no
visual REAL (manto-real.png): fichinha branca FICA (nome legível), o coração
entra como FAIXINHA LISTRADA no topo de cada chip + placa do time nas cores.
Mudança mínima. A camisa da arte anterior era só conceito.
✅ ENTREGUE NA MAIN (09/08): Diego aprovou a faixinha ("Gostei assim!") →
- 🎽 MANTO NO AR (commit 88496b9, beta SÓ diego.c.fonseca@gmail.com):
  src/escalacao/manto.ts (MANTO_CONTAS email→cores, meuManto() via
  loggedEmail); faixinha nas fichinhas do Campinho (rápido) e do ElencoField
  (carreira) + barrinha de título listrada. Vermelho/preto na conta dele.
  Pra liberar mais gente: adicionar e-mail no MANTO_CONTAS (depois migra
  pro admin).
- 🌐 CAMPINHOS DE TODOS NO RÁPIDO ONLINE (commit ffbd922): na temporada do
  rápido online, abaixo do seu campinho entram os de TODOS os times da sala
  (👤 humanos e 🤖 bots), um embaixo do outro, com o nome do time na
  barrinha. Offline/carreira intocados. Sem spoiler (elencos já públicos).
- ❌ ÁUDIO SINTETIZADO REPROVADO ("ficou ruim") — torcida sonora parada;
  se voltar, caminho é gravação CC0 real de multidão (não sintetizar).
  Obs.: já existe um startCrowd() tocando na temporada hoje (sound.ts).
🔥 AÇÃO IMEDIATA COMBINADA (09/08 00h, print do admin: 8 toques na trava do
Manual em 1h, Akatsuki FC apertou "quero o Craque"): assim que o Diego criar
e mandar o LINK DE PAGAMENTO do Mercado Pago do Craque (R$ 19,90 — app MP:
Cobrar → Link de pagamento), trocar a trava do Manual de Pix+DM pra abrir o
link direto (cartão/Pix em 3 toques) + aviso "libera em minutos" (entrega
pelo painel já no ar). Commit isolado e revertível. Fase 2 futura: webhook
do MP → entrega automática. AGUARDANDO O LINK DELE.
🏟️ RETRÁTIL ENTREGUE NA MAIN (commit 24532da, decisão do Diego 09/08: "não
tem a ver com sócio-torcedor → põe nos desbloqueios, mantém padrão de
valores"): Cobertura Retrátil agora é OBRA da árvore do estádio — 180 🪙,
+10/temporada, exige a ☂️ Cobertura comum. SAIU DO SÓCIO de vez. Mesmo gate
do Dep. Médico (só carreiras novas com agenciaOn veem/exigem — save antigo
intocado, incl. régua da SAF nos DOIS pontos do reducer + renda de craque da
agência com grandfather). StadiumSvg NÃO mudou (sagrado). Reversível: 1
commit isolado.
⚖️ MARTELOS DO DIEGO (09/08): (1) OLHEIROS: sócio NÃO vê nenhuma categoria;
escadinha final = ⭐ Craque vê de craque pra baixo · 👑 Lenda e 🖋️ Batismo
veem TUDO · grátis nada. DECIDIDO. (2) SOM DE ESTÁDIO: fora do sócio DE VEZ.
(3) Ele quer ENGORDAR o sócio com coisas "que funcionem" estilo escudo
("que a pessoa queira ser sócio e não faça por caridade"). 5 propostas
enviadas: nome do próprio estádio (aprovado por ele à mão, sai no jornal;
abaixo do StadiumSvg) · gramado à escolha (skins do campinho: noturno/chuva/
várzea/premium — turfColors já existe) · fichas de carreira em dobro +
backup na nuvem (dor real) · martelo do sócio (som/estampa própria SÓ pra
quem ganha — lei do som pessoal) · pacote de cantadas prontas no chat.
Recomendação: as 3 primeiras. AGUARDANDO a escolha dele.
→ RESPOSTA DO DIEGO (09/08): 🏟️ NOME DO ESTÁDIO ENTROU no sócio ✅; gramado,
carreiras/nuvem, martelo e cantadas REJEITADOS ("quero mais interessantes" —
não reapresentar). Padrão do que ele aprova: feito à mão/patrimônio do clube
(escudo, manto, nome do estádio). NOVAS 4 propostas nessa família enviadas:
🐊 mascote do clube desenhada à mão (irmã do escudo) · 🗞️ capa de jornal de
CAMPEÃO compartilhável (motor do shareElenco já existe) · 🐐 camisa
aposentada/ídolo eterno no museu do clube (gols já são contados) · 🧣 batizar
a torcida organizada + o clássico (careerRivals já existe; manchetes usam).
AGUARDANDO escolha.
→ Diego perguntou como seria a MASCOTE ("apareceria aonde? dançando fazendo
o quê?"). Mockup enviado (scratchpad/mascote-ex.png, alface brava de corpo
inteiro): (1) mora na ÁREA DO CLUBE ao lado do escudo, abaixo do StadiumSvg,
com balancinho leve (sem dança maluca — 2 poses 2D); (2) na FESTA DE
CAMPEÃO de qualquer modo, pose levantando a taça no confete, SÓ pós-apito
(zero spoiler), só o dono vê a sua; (3) sairia na capa de campeão se essa
entrar; (4) NUNCA no leilão. Feita à mão pelo Diego igual o escudo
(2 desenhos por mascote: parada + com taça). Aguardando o veredito dele.
→ Diego: "QUERO a animação quando ganha título!" e pediu mockup REAL no
rápido online. Enviado (scratchpad/mascote-festa.png), 2 quadros: (1) o
FESTÃO — overlay de ~4s POR CIMA da tela de fim de temporada, pós-apito:
fundo verde com raios dourados girados, chuva de confete, "🏆 CAMPEÃO!" +
nome do time, mascote GRANDE pulando com a taça; só o time campeão vê
(regra do som do martelo); toque pula. (2) DEPOIS: a mascote fica em cima
do quadro preto do "Fim da temporada" segurando a taça até a sala votar.
Mesma festa no rápido offline e na carreira. AGUARDANDO OK do visual pra
esse ser o comportamento oficial da mascote.
→ Diego achou o quadro estático "parecendo a carta que já se ganha" e pediu
INTERATIVO, "boneco solto na tela". Resposta: GIF ANIMADO enviado
(scratchpad/mascote-festa.gif, 36 frames gerados de mascote-anim.html com
?f=N + JS posicionando por frame): a mascote ATRAVESSA a tela real de fim
de temporada quicando POR CIMA da UI (tabela, botão de voto), com um pulão
no meio, sombra no chão, rotação de gingado, banner CAMPEÃO pulsando e
confete caindo em loop. Na implementação real: CSS/JS a 60fps, ~4s,
toque pula. AGUARDANDO veredito do GIF.
→ 🪪 CARTEIRINHAS — mockup enviado a pedido dele (scratchpad/
carteirinhas.png): (1) SÓCIO roxa — nome grande, nº de sócio, tempo de casa,
escudo à mão + chips do manto (❤️🖤) e do nome do estádio; tier pago leva o
selo sem perder o roxo; (2) FUNDADOR preta-e-ouro — PRA SEMPRE, independe de
assinatura: nº gravado (ex. 34) + carimbo redondo "dos 100 primeiros", faixa
dourada, nome do batismo, e chip-lembrete "sócio por R$ 2,99". As duas moram
na área do apoiador e são COMPARTILHÁVEIS como imagem (motor do shareElenco).
Resposta ao medo do ciúme Lenda/Batismo também dada: eles pagam 2,99 (o
menor preço), artesanal contínuo só existe com mensalidade, e a carteirinha
de fundador é presente de prestígio pra eles SEM assinar. AGUARDANDO OK.
→ ✅ APROVADO PELO DIEGO (09/08): "Gostei desse pra quem é sócio torcedor".
A MASCOTE ENTRA NO SÓCIO como benefício oficial: desenhada à mão pelo Diego
(entrega manual, tipo escudo), mora na área do clube (carreira) e faz o
FESTÃO ANIMADO do título em todos os modos (versão do GIF: solta na tela,
quicando por cima da UI, pulão, sombra, confete; 60fps, ~4s, toque pula;
só o time campeão vê; pós-apito). Pendentes ainda: capa de campeão, camisa
aposentada, batizar torcida/clássico, bots batizados, voto decide/orienta.
📌 STATUS FINAL DA RODADA (08/08, noite): Diego travou na dúvida olheiros-
no-sócio vs escadinha ("só sei que quero que venda MT"). RECOMENDAÇÃO FIRME
enviada: ESCADINHA por tier (4 produtos, 4 desejos: sócio=jogo do seu
jeito · craque=manual+prata+olheiros até ⭐ · lenda=ouro+VIP+olheiros
totais · batismo=tudo+nome na história; o "?" nas lendas do elenco do
Craque é o vendedor da Lenda). + Defaults propostos pros 2 martelos
finais: bots batizados=SIM (propaganda do batismo) · voto=ORIENTA
(segurança, lei nº1). AGUARDANDO "FECHA TUDO" → arte final da loja →
aprovação visual → código.

## 💛 (histórico) desenho anterior — desconto por fidelidade + caixinha v2
EVOLUÇÃO (ideia do PRÓPRIO Diego, ele gostou): mensal com a MESMA caixinha pra
todos e preço por fidelidade — grátis paga R$9,90/mês · ⭐ Craque R$4,99 ·
👑 Lenda/Batismo R$2,99. O vitalício vira "carteirinha de desconto" (fortalece
a venda da Lenda em vez de canibalizar). Vitalícios intocados.
CAIXINHA (recomendada, Diego vai cortar o que não quiser vendo a arte):
📀 Carta do Mês numerada/datada (dia 1, nunca reimpressa) · 🗳️ voto na próxima
lenda (dia 10) · 🏆 Copa dos Sócios (1ª sexta) · 🎮 Manual · 🕵️ 3 Olheiros ·
🪙 30 moedas/mês · 🪪 carteirinha com tempo de casa · 🛡️ personalizar o escudo
GERADO (cores/símbolo). Escudo ARTESANAL fica FORA do mensal (item avulso, não
escala e é permanente por natureza) — decisão explicada ao Diego.
Mensagem de custo aprovada pelo conceito: "sócios seguram o servidor" (barra
de meta na loja). História pessoal reformulada (rodapé escuro, mais clara).
Arte final: scratchpad/loja-final.png — AGUARDANDO cortes/OK do Diego.
Já no ar independente: entrega na hora no admin (seção Apoiadores).

## 💛 (histórico) menu de 3 modelos apresentado antes do desenho acima (08/08)
Diego não gostou do pacote "utilidades" (manual+olheiro+moeda = genérico) e
NÃO aprovou nada ainda (nem copa mensal, nem preços). Diagnóstico novo: o que
VENDE no jogo é STATUS/HISTÓRIA (cores, fundador numerado, batismo), não
ferramenta. Menu apresentado:
- MODELO 1 "Álbum Vivo": Carta do Mês numerada/datada (só sócios do mês; nunca
  reimpressa) — mesmo mecanismo do fundador, que comprovadamente vende.
- MODELO 2 "Clube de Sócios": voto mensal na próxima lenda do baralho,
  carteirinha com tempo de casa, mural de sócios.
- MODELO 3 "Temporada Premium" (utilidades) — só como tempero.
Recomendação: 1+2 com 3 de brinde, "SÓCIO LEGENDS" R$9,90/mês (1º mês trava
7,90 pra sempre), calendário mensal (dia 1 carta, dia 10 votação). Avulsos:
Kit do Mês R$4,90, Vale-presente (código estilo fichas). Descartados: patrono
de carta (vira anúncio), caixas/sorteio (cheiro de aposta), XP pago (fere a
lei nº1). Vitalícios intocados; Lenda ganha olheiros + carta do lançamento.
✅ JÁ NO AR independente disso: entrega na hora no admin (seção Apoiadores).
AGUARDANDO: Diego escolher modelo/misturar → aí mockup final.

## 💛 (histórico) proposta v1 enviada antes do menu acima (08/08)
Diego pediu análise a fundo da área de vendas ("MT gente abrindo os pacotes mas
não fechando") + plano mensal ~R$5,99 + olheiros por baralho + torneios/escudos
+ qual ferramenta de cobrança mensal. Mockup: `scratchpad/vendas-mock.png`.
NÚMEROS (30 dias, apoio_intents): 1.347 pessoas abriram a trava do Manual
(5.647 aberturas — ~4× por pessoa!); só ~101 copiaram o Pix de 19,90 e ~83
clicaram "quero". Funil vaza no CHECKOUT (Pix manual → DM comprovante → até
24h de espera), não no interesse.
PROPOSTA (nada implementado):
- Plano ⚽ SÓCIO TORCEDOR R$5,99/mês: Manual (enquanto assinar) + os 3
  Olheiros + 20 moedas/mês no Banco + Copa dos Sócios mensal. Vitalícios
  intocados; 👑 Lenda GANHA os 3 olheiros de presente (pra sempre).
- 🕵️ Olheiros (BR/Europa/Mundo): na carreira SOLO a carta mostra a cor da
  categoria antes do lance. REGRA SAGRADA: nunca no online/rápido.
- Trava do Manual com 2 saídas (5,99/mês ou 19,90 vitalício) + "libera em
  minutos" + garantia de 1ª semana.
- Cobrança mensal: recomendação Mercado Pago Assinaturas (link pronto, sem
  código); entrega via user_colors (sem deploy). Alternativas: Asaas/Efí
  (Pix Automático), Kiwify/Hotmart (mais taxa, zero trabalho).
DECISÕES DO DIEGO PENDENTES: preço final do Sócio; se o Craque também leva
Olheiro BR; aprovar o mockup; criar o plano no Mercado Pago.

## 🤝 DUPLA — NO AR (08/08) ✅ — ajustes da 1ª sala real de duplas
Diego testou com a galera e foram vários acertos no mesmo dia (todos na main,
cada um em commit próprio e revertível):
- **Vaga nasce ABERTA**; só o 🔒 cadeado fecha. "Me esperem" foi cortado ("é a
  mesma coisa que qualquer um"). Botão único põe/tira o cadeado.
- **Sem "jogar sozinho"** dentro da sala de duplas ("tem q ter dupla").
- **Trava do host = 2 duplas fechadas, só isso.** Quem sobrar sem parceiro NÃO
  segura a sala (com gente ímpar ela nunca abriria) — entra com o time dele.
- **Nome do time da dupla**: campo na sala de espera (qualquer um dos dois
  escreve); em branco vira `Neymarzetti|Alfacehh` — formato escolhido pelo Diego,
  sem espaços em volta do risco. Coluna nova `dupla_name` (aditiva).
- **Chat**: os dois dividem o MESMO técnico, então falavam com nome idêntico.
  Quem está em dupla passa a falar com o próprio nome.
- **Parceiro que CAI** (não sai pelo botão) travava o time pra sempre. Presença
  agora carrega o crachá; o host libera sozinho após 25s fora (25s de propósito:
  trocar de app derruba a conexão por segundos e perder o foco não pode liberar)
  + botão "Fulano caiu — assumir o time" no leilão e no monte.
- **Novo pregão**: os DOIS da dupla confirmam (antes o 1º clique decidia pelos
  dois) e a dupla CONTINUA junta, com a mesma divisão e o mesmo nome. ⚠️ Achado
  ao conferir: o redraft RENUMERA os técnicos, então as duplas tiveram que ser
  remapeadas — sem isso, se alguém saísse, a dupla caía no time de OUTRO.
- **Lista de salas**: selo roxo 🤝 DUPLAS + contagem em pessoas. (O flag também
  passou a vir na lista magra e a sala de espera pergunta direto ao banco — a
  falta disso foi o "não aparece o botão de duplas".)
- **✕ do host** num time de dupla deixava o parceiro pendurado sem time
  (família do "virei bot"): agora ele é solto antes e vira time próprio.
- ⏸️ **DECIDIDO ADIAR** (Diego, 08/08): time de dupla NÃO leva selo de tier
  (👑/⭐) — "deixe com os nomes deles mesmo por enquanto". Cada um continua vendo
  a própria cor na tela dele; o time fica neutro. Rever se ele pedir.

## 🤝 DUPLA — como nasceu (08/08) ✅
Diego mandou "Faz. O modo da dupla aí cara", viu o mockup
(`scratchpad/dupla-telas.png`) e aprovou ("Pode fazer. Publicar"). Feito ponta a
ponta **só no Rápido Online**, tudo atrás do toggle da sala.
- **Criar sala**: escolha nova "Quem comanda cada time" — 👤 Solo (de sempre) ou
  🤝 Duplas (beta). Grava `duplasMode` no `game_state` (padrão de `varzea`).
  Sala de duplas nasce com `max_players` dobrado (20 times = até 40 pessoas).
- **Formar**: lista da sala vira por TIME (1/2 · 2/2). "🌍 Chamar qualquer um" /
  "🔒 Esperar um amigo"; o outro TOCA na vaga e vira parceiro (sem aceite). Tem
  "Sair da dupla" e "Desistir de esperar". Iniciar TRAVA com vaga pendurada, com
  o porquê e o caminho embaixo do botão; mínimo = 1 dupla completa.
- **Dividir**: 6 categorias (Monte é categoria própria), 3 pra cada, primeiro
  que toca leva, dá pra soltar, e ao fechar 3 as outras caem pro parceiro. Host
  abriu antes? sorteia 3-e-3 com o RNG da partida (determinístico).
- **Leilão**: o pregão já anda setor a setor, então cada leva tem UM dono — só
  ele lacra; o parceiro vê as MESMAS cartas com o aviso de quem decide. Monte
  igual. Se um sair de verdade, o outro assume tudo (em vez de virar CPU).
- **Onde mora a regra**: `duplaPodeAgir` e `duplaToggleCat` em `types.ts` — UMA
  função só, usada pela tela E pelo host. Se fossem duas, poderiam discordar e é
  daí que vêm os bugs de assento.
- **Trava no HOST, não só na tela**: `SUBMIT_ENVELOPE`, `MONTE_PICK` e
  `MONTE_PASS` levam o crachá (`by`) e o reducer recusa quem não manda na
  categoria. ⚠️ Honestidade técnica: isso mata o caso REAL (corrida entre os dois
  aparelhos, tela defasada) — o modelo online do jogo nunca teve identidade
  assinada, então um cliente adulterado ainda poderia forjar o crachá, exatamente
  como já podia forjar um `mgrId` hoje. Não é regressão; é limite antigo.
- **Assento**: a linha do parceiro é CARONA (`dupla_partner_of`) e fica FORA da
  deduplicação/renumeração — senão viraria time fantasma. A renumeração passou a
  mirar `user_id` (com carona, `player_index` deixou de ser único).
- **Regressão**: `scratchpad/duplatest.mjs`, 40 checagens, incluindo a prova de
  que sala Solo lacra/pega monte exatamente como antes.
- **Falta (combinado, depois do OK)**: Duplas na Carreira online (lá cada técnico
  tem caixa e temporada própria — passo separado).

## 🤝 DUPLA — schema APLICADO no Supabase de verdade (08/08) ✅
O `supabase/dupla_schema.sql` (escrito no branch `claude/pontosafe-repo-setup-qzjo89`,
commit `437853d`) **já rodou no banco de produção** (projeto `faabglpjutwursgmrpny`,
o do Leilão Legends — é o que `src/lib/supabase.ts` usa; o `.env` aponta pra
OUTRO projeto que o jogo não usa, não confundir).
`public.room_players` ganhou 3 colunas opcionais, todas NULL:
`dupla_partner_of` (uuid → auth.users, on delete set null) · `dupla_categories`
(jsonb) · `dupla_seek` (text, check 'aberta'/'privada').
Conferido depois de aplicar: **1.232 linhas existentes, as 3 colunas 100% NULL**
— nenhuma sala/jogo mexido. Rodei o script 2× pra provar que é idempotente.
⚠️ Pro outro branch: a anotação de lá ("falta aplicar no Supabase") está VELHA.
Reverter (some tudo, zero rastro):
`alter table public.room_players drop column if exists dupla_partner_of, drop column if exists dupla_categories, drop column if exists dupla_seek;`
O código ainda NÃO lê essas colunas — próximo passo é reducer/telas.

## ⭐ Novo Craque (07/08): gabriel.alves.martins.2010@gmail.com ✅
Entrou em `FOUNDERS` (apoio.tsx) como `'prata'` → cor/selo ⭐ prata em TODO
canto do jogo + Modo Manual liberado. Craque NÃO ganha número de fundador
(isso é só do Lenda 👑), então nada mexeu em `FUNDADOR_N`.

## 🐛 LIVRO DE PREÇOS: preço compartilhado por NOME (relato de jogador, Neymar) ✅ NO AR
Jogador reportou: renovar o Neymar do Santos estava pedindo o preço do Neymar
do BARCELONA (vendido por 200+) — são cartas diferentes (nome igual, clube
diferente), mas o "livro de preços" (piso de mercado/renovação) só guardava
pelo NOME do jogador, então uma inflava a outra. Bug real, valia pra QUALQUER
jogador com 2+ cartas (clubes/anos diferentes) — bem comum no baralho.
Corrigido: a memória de preço agora é por CARTA (nome+clube, usando o `ident`
que o jogo já usa pra tudo mais), não só nome. Mesma correção aplicada no
bônus de artilheiro (tinha o mesmo problema escondido). Reversível com
`git revert fdcc41f`.

## 🐛 COPA DO MUNDO: pular a FINAL podia perder carta e troféu — CORRIGIDO ✅ NO AR
Relato de jogador (via Diego, 07/08): "pulei a final, ganhei, mas não veio
carta nem troféu". Conferido Liga, Copa Legends e Copa do Mundo — só a Copa do
Mundo tinha o problema. Causa: lá o "Pular" tem 2 estágios (1º toque só corta
a animação e mostra o placar da final; 2º avança pra "🎉 Cerimônia" de
verdade) — só DEPOIS desse 2º clique é que o prêmio/carta gravavam. Quem via
o placar da final (achando "já era, acabou") e não clicava de novo nunca
recebia nada — não tem mais nenhum jogo pra assistir depois da final, então
era fácil parar aí achando que tinha terminado.
Corrigido: prêmio e carta agora gravam assim que o placar da FINAL aparece na
tela, sem depender do clique extra da cerimônia. Visual não mudou em nada
(banner/estatísticas continuam iguais) — só a GRAVAÇÃO ficou mais cedo e
garantida. Reversível com `git revert 79af73c`.

## 🐛 BOTÃO "⏭️ PULAR" travado — CORRIGIDO (07/08, relato de jogador) ✅ NO AR
Jogador (craque/lenda, com Modo Manual) reportou que o Pular parou de
funcionar. Causa: era EU MESMO, mais cedo hoje — pra fechar o buraco do
patrocínio (Pular pulando a escolha da meta), botei uma trava no botão Pular
que na verdade é COMPARTILHADO por vários modos (carreira, rápido, Copa do
Mundo). Sem querer, isso fez o Pular esperar "a rodada acabar" pra liberar —
ou seja, perdeu a função dele (que é JUSTAMENTE pular a animação e ir direto
pro resultado, sem esperar nada). Como a trava do patrocínio já tinha sido
resolvida de outro jeito (um botão PRÓPRIO só na hora de escolher a meta, fora
desse componente), a trava no Pular ficou sobrando e não fazia mais falta —
tirei ela. Agora o Pular volta a ser IMEDIATO em todo lugar (carreira, rápido,
Copa do Mundo), e a trava do patrocínio continua funcionando (ela nunca
dependeu do Pular). Reversível com `git revert 8c2664c`.

## 🤝 Patrocínio: mais 2 ajustes (07/08) ✅ NO AR
- **Trava reforçada**: além da tela bloquear o botão "Começar a temporada" até
  escolher a meta, agora o PRÓPRIO reducer recusa avançar a rodada 0 sem a
  escolha — cinto de segurança extra (Diego relatou que "se demorar, começa
  sozinho"; não achamos o buraco exato mas essa trava cobre qualquer caminho).
- **Logos maiores** na tela de escolha das marcas (quase dobrou de tamanho).
- **Max Joias** (amigo do Diego) entrou no tier 1 (🛡️ Não cair de divisão), no
  lugar do "Paredão Materiais" fictício. Logo recortada (fundo preto virou
  transparente) pra combinar com o cartão. Aprovado pelo Diego.

## 🐛 SELO DE GOL NO 0×0 — CORRIGIDO (07/08, relato do Diego) ✅
Diego mandou print: jogo **0 × 0 aos 16'** com o selo "🔥 GOL NO FIM!" na tela,
e a frase **trocando sozinha em looping** ("passando todas as frases").
Eram DOIS defeitos no `LiveScoreCard` (pyramidseason.tsx):
- **(a) o selo ficava preso**: o `setTimeout` que apagava o selo vivia no
  *cleanup* do efeito. Quando a rodada virava, o React rodava o cleanup
  (matando o timer) e o efeito caía no `return` do rebase — ninguém apagava o
  selo, que atravessava pra rodada seguinte.
- **(b) a frase corria com o relógio**: `goalSeed = last?.min ?? min`. Sem gol,
  `last` é `null`, então a semente era o MINUTO CORRENTE → frase nova a cada
  tique.
Consertos: timer numa `ref` (o cleanup não o mata mais), rodada nova chama
`apaga()` explícito, frase **congelada** no minuto do gol (`goalSeedFix`) e uma
**trava final**: `temGolNaTela` — placar 0×0 na tela = nenhum selo e nenhum
flash, aconteça o que acontecer com o estado.
Regressão nova: `scratchpad/goltest.mjs` (reproduz o bug na versão antiga e
prova os 6 comportamentos certos na nova) + eventotest/copatest/dormtest 🟢.

## ✅ ENTREGUE 07/08 — Patrocínio virou APOSTA + correções da carreira (já na MAIN, ao vivo)
1. **Patrocínio reformulado pra sistema de APOSTA por temporada** (pedido do
   Diego, inspirado em jogos tipo Motorsport Manager): saiu o patrocínio fixo
   por divisão, entrou escolha no INÍCIO de cada temporada (banner logo após o
   leilão, antes do botão "Começar a temporada" — trava o botão até escolher).
   Três níveis de aposta, cada um com 3 marcas pra escolher (visual): 🛡️ Não
   cair de divisão · 📈 Acesso (top 4) · 👑 Campeão (liga OU copa, as duas não
   dobra). Pagamento por divisão (dobra a cada degrau): Várzea 1/2/3 · D 2/4/6
   · C 4/8/12 · B 8/16/24 · A 16/32/48 (moedas conforme o nível apostado).
   **Errou a meta = ZERO** (apostou seguro e foi além = só ganha o que apostou,
   "deu mole" — regra explícita do Diego). Aviso sutil disso no próprio banner.
   Logo do amigo dentista (ERO Odontologia) e do Vadico Veículos entram como
   marcas reais no tier 👑 Campeão. Caixa/extrato atualiza sozinho no fim da
   temporada junto com os outros prêmios (reaproveita o motor que já existia).
   Multiclube: cada clube tem sua própria aposta (não mistura). Story pra
   divulgar já entregue (scratchpad/story-patrocinio.html/png).
2. **Hack do "mesmo time" corrigido** — apertar "mesmo time" ao fim da
   temporada abria uma brecha que pulava a área de contratos sem o jogador
   decidir nada. Agora abre o MESMO banner de contratos de sempre (sem leilão
   depois) — o usuário decide (renovar/deixar ir) e só depois avança.
3. **Timer da tela de contratos**: offline (modo carreira solo) não tem mais
   tempo nenhum — decide na hora que quiser. Online continua com tempo, mas
   reduzido pra 1 minuto (era 45s).
4. **Caixa em tempo real**: confirmado que compra/venda/renovação no leilão já
   atualizavam o caixa na hora (motor `mirrorWallets` já fazia isso, achado
   ao investigar — nenhum bug aqui). Premiação de artilheiro/títulos/folha
   salarial continuam batendo só no fechamento da liga/copa, como já era.
5. **Bug dos eventos de zoeira (baladeira/pavio-curto/lesão) sempre na MESMA
   rodada todo ano** — corrigido. Causa: a semente do sorteio tava sendo
   embaralhada duas vezes com o mesmo número (cancelava e voltava a ser
   sempre igual). Também aumentei bastante a variedade de jogadores e de
   frases de cada evento, e o evento agora evita repetir o MESMO jogador do
   evento anterior (antes reclamavam que era sempre o Romário, por exemplo).
6. **Desconto da renovação de 10 anos**: tinha um arredondamento errado que às
   vezes cobrava o preço CHEIO em vez dos 90% combinados. Corrigido.

## 🐛 BUG DA TRAVA DO PATROCÍNIO consertado (07/08, relato do Diego) ✅
No Modo Manual tinha um botão "⏭️ Pular" que NÃO respeitava a trava de "precisa
escolher a meta do patrocínio antes de começar a temporada" — só o botão grande
"Começar a temporada" travava; o Pular avançava direto. Corrigido nos dois
lugares (screens.tsx: botão Pular agora fica cinza/desabilitado igual o
grande; pyramidseason.tsx: o clique também é bloqueado no código, não só
visual). Confirmado com o Diego como já estava certo: o prêmio da meta é
sempre calculado com base na temporada que ACABOU de terminar (a mesma em que
foi escolhida) e cai no caixa/extrato junto com os outros prêmios no fechamento
daquela temporada — não é preciso trocar nada aí, já funciona assim.
✅ MAIS UM PONTO (07/08, Diego: "não pode ter tempo nessa área de escolher
patrocínio no carreira offline"): achado outro buraco — no modo AUTO (sem
manual ligado) da carreira solo, a rodada 0 tinha um cronômetro ESCONDIDO de
9s (o mesmo tempo de qualquer rodada) que avançava sozinho mesmo sem escolher
a meta. Agora esse relógio também espera a escolha — carreira offline fica
sem tempo nenhum pra escolher o patrocínio, seja no manual ou no automático.
✅ MAIS UM PONTO (07/08, Diego: "escolheu o patrocínio já inicia a temporada
sozinho, tem que ter o botão de iniciar — pra quem tem Manual E pra quem não
tem"): a rodada 0→1 (começo da temporada) agora SEMPRE exige um clique
explícito no botão "▶️ Começar a temporada", pra TODO mundo — inclusive quem
não é craque/lenda (não tem Modo Manual) e antes ficava só no automático puro,
sem botão nenhum, e a temporada começava sozinha 9s depois de escolher.
A partir da 1ª rodada em diante nada mudou (quem não tem Manual continua 100%
automático como sempre foi — só o INÍCIO da temporada ganhou a trava).

## 🚀 Contratos: botões de ação em massa (07/08, pedido do Diego) ✅ NO AR
Quando vence contrato de vários jogadores de uma vez, agora tem 3 botões em
cima da lista (só aparecem com 2+ contratos vencendo): "🔟 Renovar TODOS 10
anos", "5️⃣ Renovar TODOS 5 anos", "😢 Deixar TODOS ir". Um clique aplica a
mesma decisão pra lista inteira de uma vez (multiclube: os dois clubes
juntos), sem precisar clicar jogador por jogador. Mockup enviado ANTES de
subir (mesmo visual dos botões individuais já aprovados); pushado já — se o
Diego não curtir a posição/texto, é reverter o commit 426713d.

## 🖥️ Campinho do Elenco com mais espaço (07/08, Diego: "tá muito apertado") ✅ NO AR
Celular ganhou um respiro pequeno (gap/padding um pouco maiores). No desktop
(onde sobrava tela vazia dos dois lados e as casinhas ficavam espremidas
mesmo assim) o ganho é bem maior: casinha maior e mais espaço entre elas —
só dentro do `@media (min-width: 1024px)` já usado no resto do "Modo
Desktop", então o celular não muda em nada além do respiro combinado. Mockup
antes/depois enviado e aprovado.

## 🆕 Bannerzinho de "o jogo atualizou" voltou (07/08, pedido do Diego) ✅ NO AR
Tinha sido tirado antes (aparecia toda hora nos dias de muito deploy). Diego
pediu de volta: banner pequeno no topo pra quem JÁ ESTÁ com o jogo aberto
quando sai versão nova, com botão "Atualizar" (recarrega na hora) e ✕ pra
fechar — uma vez fechado, some e NÃO volta nessa versão (só a PRÓXIMA versão
nova avisa de novo). ⚠️ Efeito colateral esperado nesta primeira leva: quem
já estava com o jogo aberto ANTES deste deploy não viu o banner aparecer,
porque o código rodando na aba dele ainda era o ANTIGO (o antigo tinha o
banner desligado) — só um F5 manual pega a versão nova. A partir de agora
(próximos deploys), o banner detecta e avisa normalmente.

## ✅ ENTREGUE 05/08 — 3 pedidos do Diego (já na MAIN, ao vivo)
1. **Escudos nos confrontos da Copa dos 8** — a lista "Todos os jogos da fase"
   (screens.tsx, `tieRow`) agora mostra o escudo (gerado do nome, o mesmo
   `<Escudo>` do placar grande) nos dois lados. A Copa do Mundo já tinha a
   bandeira do país (`nm()` prefixa FLAG), então lá não mexi.
2. **Expulso SAI da sala de verdade (online)** — o handler do evento `kick`
   (store.tsx) trocou o `alert()` (que o celular às vezes engolia → pessoa
   continuava assistindo) por: `KICKED_OUT` na hora + banner vermelho na tela
   ("VOCÊ FOI EXPULSO", estado `kickedOut`). Não fica mais de penetra.
3. **Patrocínio da Várzea = zoeira do lanche, SEM dinheiro** — `SPONSOR_PAY.V=0`
   (várzea não paga nada). Marcas REAIS de esquina: Guaravita, Trakinas, Fofura
   (estadiodata.ts). O cartão (estadio.tsx, `varzeaLanche`) mostra as 3 com o
   aviso "não pinga dinheiro, paga em lanche — suba pra Série D pra faturar".
   Régua nova de renda: D +5 · C +10 · B +15 · A +20 (antes era D0·C5·B10·A20).
   ⚠️ Diego aprovou TUDO sem pedir mockup ("ta td aprovado").

## ⏳ AINDA PENDENTE (combinado, ainda não feito)
- **Zoeira dos banners de evento (OCULTO nas cartas)**: ampliar as categorias
  escondidas que disparam os banners na simulação — 🍺 baladeiro (noitada),
  🟥 pavio curto (expulsão), 🤕 vidro (lesão) + novas (frangueiro, mercenário,
  guerreiro, maestro, matador…). NADA escrito na carta; só dispara evento.
  Analisar TODAS as cartas e classificar mais jogadores + banco de frases.
  (Regras em eventos.ts: baladeiro→noitada, pavio→expulsão, peso 4× cada.)
- **Copa dos 8 — visual mais bonito dos jogos simulados** (os que você NÃO tá):
  Diego achou "muito feio". Mockup em scratchpad/copa-bonita.html. Aguardando.
- **Modo Libertadores temático** (gated pro Diego testar): 32 times, 8 grupos de
  4, mata-mata, baralho SÓ de quem jogou a Liberta (clube+ano corretos), jogos
  simulados AO VIVO minuto a minuto (igual Copa, não resultado pronto nem só
  tabela). Visual "cara da Liberta". Mockups: scratchpad/liberta-*.html.


## ⚽ Batismo: Bicho da Seda (04/08)
Clube do **davisantana1312** (👑 Lenda, fundador nº 11) entrou no lugar do
**Red Bull Diet** na Série D. OLD_NAME atualizado ('Bicho da Seda': 'Red Bull
Diet') — save antigo carrega já com o nome novo. Escudo automático pelo nome.
👉 Com ele, são **12 clubes de batismo** na Série D.


## ⚽ Batismo novo + apoiadores (04/08)
· **Barcenite FC** (batismo do ricardopessoafreire / xRichard56, 👑 Lenda +
  fundador nº 31) entrou no lugar do **Milanesa FC** na Série D. OLD_NAME
  atualizado ('Barcenite FC': 'Milanesa FC'), então save antigo com Milanesa
  carrega já com o nome novo. Escudo automático: escudo vermelho-telha com faixa
  dourada e inicial B (o nome não tem palavra do dicionário).
· **victordudu.monte14@gmail.com** (Kings Fc) entrou como ⭐ **Craque** (prata).


## 👑 Novo Lenda (04/08): ricardopessoafreire@gmail.com
Entrou em FOUNDERS como 'ouro' + FUNDADOR **nº 31** (apoio.tsx). Ganha cor/selo
👑🖋️, Modo Manual, tudo do ouro e direito a batismo de clube (ainda não usou).
⚠️ Se o Diego NÃO quiser dar o selo de fundador a ele, é só tirar a linha do
FUNDADOR_N (o tier ouro fica igual).


## 🃏 Baralho: Philipp Lahm virou LENDA (04/08, pedido do Diego)
Era craque (fame 4, 86-92) — agora 👑 lenda (fame 5, **88-93**), entre Roberto
Carlos (88-93) e Cafu (87-92). Bio já existia. Efeito: entra no pacote de lendas
do leilão (Série A da escada), rende como 👑 na agência e sobe o piso dele.


## 🥬 Escudo do Alfacehh: verde + pé de alface (04/08) — AGUARDANDO OK VISUAL
Pedido do Diego: "a logo do Alfacehh quero que seja verde e emoji de alguma
planta que pareça alface". Feito em `escudos.tsx`: símbolo `alface` (roseta de
folhas) + **paleta TRAVADA no verde** (o DICIO agora aceita um 3º item que fixa
a cor, pra palavra cuja cor faz parte da identidade). Pega alfac/couve/folha/
horta/salada/rúcula. Prévia enviada ao Diego (scratchpad/alface.png).
✅ APROVADO pelo Diego (04/08) e PUBLICADO na main.


## ⏱️ Revelação do leilão: folga na SURPRESA e na ÚLTIMA carta (04/08, Diego)
"a surpresa passa tão rápido que nem consigo ver quem foi o jogador". A 🎁
surpresa só mostra o nome NO MARTELO, então ganhava menos tempo de leitura que
as outras. Agora, em `AutoAdvance` (screens.tsx):
· carta surpresa VENDIDA: **+1,6s** · ÚLTIMA revelação da rodada: **+1,2s**
(somam com o extra de desempate). O resto do pregão segue no ritmo de sempre —
a regra de ouro do Diego ("nada atrasa o jogo") vale pro fluxo normal.


## 🐛 BUG DA COPA DO MUNDO CORRIGIDO (04/08, relato de jogador) ✅
Dois problemas no manual da Copa, ambos consertados:
1. **"Apertei pular 2× e a partida voltou"** — `next`/`skip` liam o passo da
   renderização (`const s = step + 1`). Dois toques rápidos liam o MESMO número:
   o 2º não avançava fase, mas reiniciava o relógio (roundKey) e o jogo parecia
   voltar do zero. Agora o passo é calculado DENTRO do setState (valor mais novo)
   e o relógio só reinicia quando a fase realmente mudou.
2. **"Mudou o resultado da Copa"** (grave) — o torneio era calculado num useMemo
   que usava o `rng` COMPARTILHADO da tela de cima (gerador COM ESTADO). Como a
   lista de participantes (`top16`) nasce de um array recriado a cada render, o
   useMemo refazia o torneio de vez em quando com o gerador JÁ AVANÇADO → outros
   placares e outro campeão. Agora a simulação virou função pura EXPORTADA
   (`simulaCopaMundo`) com semente própria fixa: recalcular N vezes dá sempre o
   mesmo campeão/placar.
🧪 `scratchpad/copatest.mjs`: 5 recálculos × 3 sementes = idênticos; lista
recriada = mesmo resultado; sementes/temporadas diferentes = Copas diferentes.


## 🛡️ ESCUDOS DOS CLUBES (04/08) — motor PRONTO, aguardando autorização
`src/escalacao/escudos.tsx` — brasão desenhado POR CÓDIGO (SVG), peso ZERO no
servidor (viaja pelo GitHub Pages junto com o jogo; NÃO encosta no Supabase).
O gerador lê o NOME: 35 símbolos + dicionário de palavras ("Sertão"→cacto,
"meias"→par de meias, "fogo"→labareda, "Ferroviária"→trem...). Sem palavra
conhecida = sorteio FIXO do nome (inicial + padrão/cor), igual em todo aparelho.
Cobertura medida: 114 de 146 nomes (78%) com símbolo pelo significado.
⚠️ REGRA: paródia de clube real NUNCA vira cópia (Flamengo do Sertão lê
«Sertão», não «Flamengo») — marca registrada não entra.
💰 `LOGOS_PRONTAS` (mapa vazio) = onde entram as logos ARTESANAIS pagas: o
usuário manda a arte, o Diego aprova, eu redesenho em SVG (~2 KB) e cadastro ali;
ela passa na frente do automático.
✅ **NO AR (04/08, autorizado pelo Diego)** — `<Escudo nome={} />` ligado em 6
lugares (o Diego pediu na tabela do modo RÁPIDO também):
· modo RÁPIDO: tabela da Liga Legends (18px) e artilharia (15px) — só futebol
🧼 O nome é LIMPO de emoji antes de gerar (`nomeLimpo`): na tabela o nome vem com
o selo do tier ("Fulano 👑🖊️") e sem isso o escudo MUDARIA ao trocar de tier.
Testado em scratchpad/escudocheck.mjs.
· carreira: tabela de classificação (19px), ranking de clubes (19px), lista de jogos
da rodada (16px, um de cada lado do placar) e placar AO VIVO (34px). Vale igual
pros times de batismo (o motor só olha o nome). 🏀 O basquete segue com a inicial
(visual dele ainda não passou pelo Diego).
📲 Story do Instagram pronto (scratchpad/story-escudos.png, 1080×2100, selo
"já no ar 🔥") — Diego vai postar.
📸 Amostras aprovadas pelo Diego: mockup dos 6 times + folha dos 146
(scratchpad: mock-6times.png, escudos-todos.png, mock-alface.png).
ESCADA DE VENDA combinada: (1) escudo automático grátis pra todos · (2) editor
de brasão pro usuário montar (perk de apoio ou compra barata — entrega sozinho)
· (3) logo artesanal, a cara, feita sob encomenda quando o cara paga.


## 🏆 Ranking Carreira: saiu a sub-aba "Total da conta" (04/08, Diego) ✅
A aba Carreira mostra SÓ a lista por carreira (cada save uma linha). O total
da conta inteira já aparece ao tocar no técnico (álbum, chip "📊 Conta toda")
— tinha ficado redundante. O modo 'carreiratotal' segue no servidor (RPC),
só não tem mais botão; pra voltar é só recolocar o chip na EscRanking.

## 🏦 Banco Legends: regra do TRIPLO (04/08, decisão do Diego) ✅
+ (04/08) Banco TAMBÉM no FIM da aba Estrutura (ideia do Diego): logo depois
do teaser dourado — momento em que o técnico viu os preços das obras/SAF.
Segue em Finanças também. Estádio continua a 1ª coisa visível (sagrado).
Cada R$ 1 de Pix vira **3 moedas** — sempre o triplo (R$10→30 🪙 · R$50→150 ·
R$100→300 · R$500→1.500 · R$1.000→3.000). Vitrine no jogo mostra a regra e os
pacotes ×3; admin escolhe pelo valor do Pix (R$) e a ficha nasce com ×3
automático (BL_TRIPLO/TRIPLO = 3). Fichas ANTIGAS não resgatadas seguem valendo
o que foi gravado nelas — se o Diego quiser, gerar de novo pelas novas contas.

## 💰 AdSense instalado no site (04/08) — AGUARDANDO APROVAÇÃO DO GOOGLE
Diego mandou o Publisher ID: **pub-7150600438130611**. Instalado:
- Script do AdSense no `<head>` do index.html (async, não atrasa nada; nenhum
  anúncio aparece sem a gente criar bloco — é só a fundação/verificação).
- `public/ads.txt` com a linha padrão do Google (vale pros dois domínios).
PRÓXIMOS PASSOS: (1) Diego volta no painel do AdSense → Sites → confirma
leilaolegends.com e pede a REVISÃO (o site já tem o código, o Google acha
sozinho); (2) aprovação leva de dias a ~2 semanas; (3) SÓ DEPOIS: vídeo
recompensado via H5 Games Ads (adBreak type 'reward') — UI passa por MOCKUP
antes, reward provável em moedas da carreira (a combinar com o Diego).
⚠️ MAQUETE VIRTUAL: transferida pra org gratuita (04/08, feito pelo Diego —
verificado: sumiu da org paga). Falta SÓ o "Disable spend cap" até 09/08!

## 🎭 EVENTOS DE JOGADOR na carreira solo — NO AR (04/08) ✅
Aprovado pelo Diego e implementado completo (mockup mock-eventos.html ok'd):
- Máx. **1 evento por temporada**, só carreira SOLO (online 100% intacto), só a
  partir da T2, janela rodadas 3..31 (nunca na reta final; volta máx. rodada 36).
- **Noitada 🍾** (baladeiros): banner roxo, escolhe "banco 1 jogo" (reserva da
  MESMA posição assume) ou "escalar assim mesmo" (-2 de força SÓ naquele jogo,
  via mods POR RODADA na simulação — nunca mexe na carta, o passado não muda).
- **Expulsão 🟥** (pavio-curto, 1-3 rodadas) e **lesão 🩹** (qualquer um, 1-5):
  troca obrigatória — só escolhe QUEM assume. Suspensão vive no careerLineup
  (entrada na rodada + volta automática na rodada certa); SET_LINEUP rejeita o
  suspenso até a volta; formação NUNCA quebra (reserva = mesma posição, senão
  nem dispara).
- **Sem reserva na posição = só manchete de zoeira**, nada trava (regra do Diego).
- **🏥 Departamento Médico** no estádio: 1.000 🪙, rende 0, destrava depois da
  Cobertura; construiu = lesões ACABAM pra sempre. SAF agora exige ele também
  (era o combinado: última obra antes da SAF). Grandfather protegido: quem já
  tinha estádio 100% NÃO perde a renda de Craque da agência.
- **Jornal ganhou página "📻 Aconteceu na temporada"** com as manchetes dos causos.
- Traits curados à mão em eventos.ts (BR/EU/mundo + folclóricos inventados):
  só folclore LEVE (Romário/Vampeta/Balotelli baladeiros; Edmundo/Zidane/Cantona
  pavio) — NUNCA tragédia/lesão real de ninguém (Garrincha/Sócrates/Gascoigne
  ficaram DE FORA de propósito). Lesões são 100% fictícias e bobas.
- Trava dupla: banner pendente PAUSA o auto e trava PLAY_ROUND no reducer;
  multiclube seguro (banner decide no clube DO evento mesmo se trocar o seletor).
- Testes: eventotest.mjs (21 checks verdes) + regressões cria/dorm/herança ok;
  auditoria segue só com o "bot com 10" raro já conhecido (pendência antiga).
- 📣 Story regenerado com "JÁ NO AR 🔥" e entregue pro Diego postar (04/08).
- 🔒 CORREÇÃO (04/08, relato do Diego — usuário viu banner em carreira ANTIGA):
  eventos + Departamento Médico agora SÓ em carreira com `agenciaOn` (o novo
  modo empresário, ligado nas carreiras criadas após 03/08). Carreira antiga:
  zero banner, zero médico na lista de obras, SAF com a régua de sempre (sem
  os 1.000 extras) e CURA automática pra quem pegou banner vazado no lançamento
  (PLAY_ROUND limpa e destrava a rodada). Testes: +5 checks no eventotest.

## 🔑 Redefinir senha consertado (04/08, relato do Didico) ✅
Bug: clicava no link do e-mail de "esqueci a senha" e voltava pro site SEM a
tela de nova senha. Causa: o link de recuperação dispara TAMBÉM o evento de
"logou" (ordem varia) e o handler jogava pro MENU por cima da tela de
redefinição; o auto-reconectar de sala podia atropelar também. Conserto
(lobby.tsx): trava recoveringRef — armada pelo evento PASSWORD_RECOVERY E pela
marca type=recovery na URL (hash/query, já no carregamento); enquanto armada,
nenhum caminho troca de tela (menu/salas/convite); "Salvar nova senha" solta.
Pedir pro Didico testar de novo (F5 antes).

## 🏆 Sub-filtro na aba Carreira do ranking (04/08, pedido do Diego) ✅
Dois chips dentro da aba Carreira: "🪜 Por carreira" (padrão — cada save uma
linha, cartas daquela carreira) e "📊 Total da conta" (todas as carreiras
somadas + todas as cartas de carreira — o jeito antigo). RPC ganhou o modo
'carreiratotal' (migração esc_ranking_carreira_total); EscRanking com carSub.
Contexto: reclamações de "sumiu título/carta" eram a separação por carreira
(caso Alface) — verificado no banco que NADA sumiu (39/40 campeões recentes com
carta; liga+copa contando exato). Agora o usuário escolhe a visão.

## 🌱 CRIA DA BASE na renovação — MOCKUP enviado, AGUARDANDO OK (03/08)
Crítica justa do Diego: quando a saída do contrato vencido quebraria o XI, o
jogo FORÇA a renovação no aperto (dívida) sem dar escolha. Proposta desenhada
(mockup-base.html no scratchpad):
- Janela de renovação: Renovar 10 (90%) · Renovar 5 (metade) · "😢 Deixar ir —
  sobe um CRIA" SEMPRE habilitado (sem caixa, os renovar ficam apagados
  mostrando o preço).
- Escolheu deixar ir e quebraria o XI → entra um 🌱 CRIA DA BASE: nível 🪵 de
  base, valor 1, salário simbólico, contrato ~3 anos, nome folclórico sorteado
  (Zezinho, Guri, Pituquinha…), selo 🌱 claro no elenco + BANNER com historinha
  emotiva na virada ("o menino realizou um sonho").
- Anti-malandragem: cria fraco de verdade (deixar craque ir nunca compensa "de
  graça"), não vira carta de álbum, valor de mercado 1.
- AFK/sem decisão: mantém a regra de hoje (renova NO APERTO, cheque especial) —
  dívida forçada só por OMISSÃO, nunca contra a escolha do usuário.
- Só carreiras com contratos.
✅ AJUSTE 2 (03/08, Diego): avançou a janela SEM escolher = renova AUTOMÁTICO
por 5 anos (metade) pra TODOS os vencidos — com ou sem caixa (negativa; valor
REAL no extrato, caixa nunca fura). Jogador só vai pro leilão por ESCOLHA
("deixar ir"). O caso "quebraria o XI" deixou de existir na omissão (todos
renovam); o cria só nasce no deixar-ir explícito. Textos da janela atualizados.
✅ AJUSTE (03/08, Diego): renovar por ESCOLHA também pode NEGATIVAR — caiu a
trava de saldo do RENEW_CONTRACT (botões sempre ativos; sem caixa mostram 💳 e
o rodapé explica o cheque especial + transfer ban). Dívida por escolha OU por
omissão; nunca sem saber.
✅ IMPLEMENTADO (03/08) com os ajustes finais do Diego:
- Cria SEM contrato nenhum (cerimônia pula ele no sorteio), RUIM mesmo (48-58 —
  derruba o nível do time; 2-3 crias = time capenga), INVENDÁVEL (não lista,
  nunca entra em leilão/monte, bot nenhum paga nada), SOME DE GRAÇA quando
  chega reforço que fecha a formação sem ele ("voltou pra base de cabeça
  erguida", no resumo), nome NOVO a cada entrada (CRIA_NOMES ~30, sem repetir
  na carreira; esgotou → sufixo).
- Historinha melhorada e honesta (3 variações: "é RUIM de doer... mas dá pra
  tapar o buraco") — banner verde na CERIMÔNIA (criaNews) + linha no resumo.
- Botão "😢 Deixar ir" na janela (toggle; marcado = renovar apaga) via
  RELEASE_CONTRACT; aviso no rodapé: "não decidiu e avançou? renova SOZINHO
  por 5 anos (metade), mesmo no vermelho" (pedido dele de avisar).
- Aperto forçado agora SÓ por omissão. Selo "🌱 cria da base — sem contrato"
  na linha do elenco.
- TESTADO (criatest.mjs): 2 carreiras ×9 temporadas soltando TODO vencido —
  crias nomes únicos, zero dívida forçada, XI nunca fura, vencido não volta
  (anti-malandragem segue), invariantes todos verdes.

## 🚑 SUPABASE ESTOURANDO (03/08, pós-liberação geral): egress/realtime/lentidão
Sintomas: salas lentas, admin com "Could not query the database for the schema
cache", Diego avisado de limite de egress + realtime messages no plano Pro $25.
MEDIDO (pg_stat_statements): (1) upsert do esc_pyramid_saves = 1s de banco ×651
(autosave da carreira BAIXAVA+SUBIA o save inteiro a cada 6s por jogador);
(2) lista pública de salas = 850ms ×207 (baixava o game_state INTEIRO de até 50
salas A CADA 5s por pessoa na aba — nº 1 de egress); (3) realtime processando
esses estados gigantes.
✅ CONSERTOS (03/08):
- Autosave nuvem: throttle 6s→60s (save LOCAL continua instantâneo; force=true
  nos momentos-chave permanece). Corta ~10× as escritas/leituras gigantes.
- fetchOpenRooms: LISTA MAGRA — só os campos exibidos via game_state->>x
  (roomName/deck/varzea/mode/careerOnline/manual/copaMode/ligaFechada/locked/
  stream/pwHash/chatOff). De ~MBs por refresh pra ~KBs.
- fetchMyCareers: idem (nome/temporada/tipo) — carreira tem o maior estado do
  jogo e a lista baixava até 30 deles.
- triggerStart: TRAVA — se o fetch fresco falhar e a linha for magra (sem
  managers), aborta em vez de "começar do zero" (nunca reseta sala).
✅ ITEM 1 EXECUTADO (03/08, ordem do Diego: "parada há 2 dias já pode"):
7.736 salas rápidas paradas 2+ dias DELETADAS (de 8.603 → 882; as 13 carreiras
online 100% intactas — carreira NUNCA entra na limpeza). Registro leve do que
saiu em game_rooms_cleanup_log. FKs room_players/game_champions caíram por
CASCADE (game_champions é placar vivo da sala; títulos permanentes = esc_results,
intocados). LIMPEZA AUTOMÁTICA ligada: pg_cron 'limpa-salas-rapidas' todo dia
08:00 UTC (05:00 BRT) com o MESMO critério; desligar =
select cron.unschedule('limpa-salas-rapidas'). VACUUM (analyze) rodado (o
espaço vira reuso; o VACUUM FULL que encolhe o arquivo fica pra madrugada,
junto do item 2).
✅ MAIS 3 EXECUTADOS (03/08, "pode fazer o que não impacta nada"):
- RLS initplan das tabelas QUENTES consertado (migração
  rls_initplan_tabelas_quentes): esc_pyramid_saves, esc_results, game_rooms,
  room_players, user_cards, user_colors — auth.uid()/jwt() viram
  (select auth.uid()), semântica idêntica, CPU por consulta despenca.
  Restam as tabelas frias do advisor (profiles, boloes etc.) pra janela calma.
- Índices duplicados de analytics dropados (idx_game_plays_created_at,
  idx_site_visits_created_at ~14 MB). O unique do room_players FICA (é a trava
  anti-vaga-duplicada do jogo).
- Host só re-sobe o game_state (100-180 KB) quando ele MUDOU — estado idêntico
  vira só batimento do updated_at (ex.: 45s de envelope = 15 uploads idênticos
  → 1). lastUpRef em store.tsx; reconexão intacta (primeiro save sempre sobe).
⚠️ Advisors pendentes (fazer em janela calma): auth_rls_initplan ×39 (RLS
reavaliando auth.uid() por LINHA — trocar por (select auth.uid()) nas policies
quentes: esc_pyramid_saves, game_rooms, room_players, esc_results, user_cards);
multiple_permissive_policies ×35; índices duplicados em game_plays.
💡 Billing dito ao Diego: NÃO é o plano de $500 (Team). Opções no Pro $25:
manter spend cap (estoura = degrada) ou desligar spend cap e pagar excedente
(egress ~$0.09/GB, realtime ~$2.50/milhão de msgs — dezenas de reais, não
centenas de dólares). Com os consertos, o consumo deve despencar.

## 📝 Contrato SUTIL no Elenco — MOCKUP enviado, AGUARDANDO escolha (03/08)
Pedido do Diego: info discreta do contrato embaixo do nome no Elenco ("quantos
anos faltam, algo sutil"). Era o combinado antigo do sistema de contratos
("mostrar contrato até T__ na carta do Elenco"). Mockup com 2 opções
(mockup-contrato-elenco.html no scratchpad):
- OPÇÃO A (sugerida): na linha que já existe sob o nome — "São Paulo · 2005 ·
  📝 7 anos"; estados: cinza normal · ⏳ último ano âmbar · ❗ vencido vermelho.
- OPÇÃO B: selinho compacto na direita junto do 💰/💸 (📝7 / ⏳1 / ❗0).
Regras nas duas: emprestado/incógnito sem selo; só carreiras com contratos.
✅ IMPLEMENTADO (03/08): Diego escolheu a A ("faz a opção A e já atualize").
ctInfo() no ElencoField: linha do clube vira "São Paulo · 2005 · 📝 7 anos"
(cinza) / "⏳ último ano" (âmbar) / "❗ vencido — decida na janela" (vermelho).
Contagem: contratoAte − seasonNo + 1 (inclui a atual). Emprestado/incógnito sem
selo; gate contratosOn (só carreiras com contratos). Campinho de cima intocado.

## 🏆 Ranking Carreira: uma linha POR CARREIRA, sem unificar (03/08) ✅
Dúvida do Diego (caso Alface, 379 títulos): carreira NOVA com o mesmo nome
unificaria? SIM, unificava (esc_ranking agrupava só por user_id). Regra dele:
"unificar não pode — é uma nova carreira; dois Alface pode". Migração
esc_ranking_carreira_por_save: a aba 'carreira' agora agrupa por conta+SAVE
(prefixo do season_key até o seed: co:solo<seed> / co:<room>:<seed>), e o
total de CARTAS também sai por carreira (prefixo igual no user_cards).
Alface antigo fica intacto com os 379; carreira nova dele = linha nova do
zero. Abas rápido online/offline intocadas (por conta, como sempre).
Verificado no banco: top da aba continua batendo (Alfacehh 379/384 cartas).

## 💰 Renovação de 10 anos agora custa 90% (03/08, decisão do Diego)
Análise que embasou (amigo sugeriu 80%): por temporada, 5 anos=10%/ano e 10
anos a 100% também 10%/ano (dilema fraco); a 80% os 10 anos dominavam demais e
secavam o mercado. A 90% nasce o dilema: rico trava preço por 10 (9%/ano),
apertado paga metade à vista por 5. Mudança: RENEW_CONTRACT (custo ×0.9) +
botão da tela de venda mostra "(-10%)". Renovação NO APERTO e CPU rival seguem
na regra de 5 anos/metade (sem mudança). Arte dos stories de Contratos
atualizada ("90% do valor 🤑") e reenviada. Fatos confirmados pro Diego:
valorização de jogador parado no elenco = SÓ artilharia (liga/Copa); o livro
só muda quando ele é negociado; renovar NÃO mexe no piso.

## 🔓 CARREIRA NOVA LIBERADA PRA TODOS (03/08, ordem do Diego)
`AGENCIA_GERAL = true` em sport.ts: Agência 2.0 + Escada/Várzea + baralho
'todos' + Clube›Estrutura valem pra QUALQUER conta em carreira criada a partir
de agora (o pacote todo usa o mesmo gate). Saves antigos seguem exatamente
iguais. Rollback: AGENCIA_GERAL=false volta ao teste fechado (lista de
testers preservada no código). Basquete e tema seguem só na conta do Diego.

## 📝 ANTI-MALANDRAGEM dos contratos vencidos (03/08, achado do tester) ✅
Golpe: deixar o contrato vencer (jogador vai pro leilão com selo SEM CONTRATO)
e RECOMPRAR barato no pregão/monte — "renovação" mais barata que renovar.
Regra do Diego: o ex-dono NÃO pode recomprar nem pegar de graça; só se OUTRO
clube levar e o jogador voltar ao mercado um dia. Travado em 4 pontos (vale
humano E bot; a compra por outro clube limpa o selo, então o retorno futuro
libera sozinho):
- resolve(): lance do ex-dono em carta sem-contrato é ANULADO (e fora do
  desempate);
- cpuEnvelope(): CPU nem gasta lance no próprio vencido;
- montePickable(): ex-dono não pesca o vencido de graça no monte;
- sweepMonteToBackstops(): o comprador forçado de última hora nunca é o ex-dono.
UI: no leilão, a carta "⏳ seu — sem contrato" mostra caixa "🔒 SEM RECOMPRA —
você deixou o contrato vencer; só se outro clube levar" no lugar dos botões.
TESTADO (malandragem.mjs, scratchpad): 2 carreiras ×9 temporadas SEM renovar
nada e dando lance em tudo — todo vencido saiu e NENHUM voltou (leilão, empate,
monte e varredura). Renovação NO APERTO (trava do XI) segue funcionando.

## 🃏 Verificação de cartas (03/08) — pesquisa web clube+ano+posição
✅ ADICIONADOS hoje (todos conferidos): Saulo (GK Sport 22), Bosco (GK Sport 00),
Max Walef (GK Fortaleza 22), Brítez (LAT Fortaleza 23), Zizão (MEI Corinthians 13),
Preto Casagrande (MEI Santos 04), Pochettino (MEI Fortaleza 24), Feijão (MEI Bahia 13),
Felipe Cabeleira (MEI Náutico 22), Gonçalo Paciência (ATA Sport 25), Alef Manga
(ATA Coritiba 22), Wallace Pernambucano (ATA Confiança 14), Mascote (ATA Retrô 24),
Neto Baiano (ATA Vitória 09), Robgol (ATA Bahia 02), Rogério "Neymar do Nordeste"
(ATA Ceará 20), Machuca (ATA Fortaleza 24), Vagalume (ATA Maranhão 25).
🔧 CORRIGIDOS: Gustavo Geladeira (Portuguesa→Flamengo 11), Rodrigo Arroz (GK→ZAG),
Rodrigo Alvim (ZAG→LAT). ❌ REMOVIDO: Sérgio Escobar (não existe no Vasco).
⚠️ SEGURADOS (não bater ano/clube): Yamada (Diego pediu p/ NÃO botar — não achei
no Palmeiras), Milagres (real é GOL do América-MG, não bate c/ nordeste atacante),
Sandro Gaúcho (2 jogadores diferentes — ambíguo), Everton Páscoa (passagem nordeste
não confirmada). Andrés Escobar já estava no baralho Mundo (Atlético Nacional 91).


## 🎨 Artes de stories entregues (03/08): Contratos + Empresário + Várzea + PROPAGANDA da carreira
Quarta arte (03/08, pós-liberação geral): "🪜 SUBA NA VIDA — da várzea à glória"
com a ESCADA visual das 5 divisões (degraus subindo, Várzea marrom → Série A
premium com 👑), régua por divisão nos degraus e a zoeira pedida pelo Diego:
"acabou a mordomia: LENDA não aparece mais na Série D — quer o Pelé? Come
poeira subindo até a elite 😤". CTA dourado "JÁ DISPONÍVEL — crie uma carreira
nova" (fonte: story-carreira.html no scratchpad).
Três PNGs 1080×1920 no visual do jogo, todas com carimbo vermelho "SÓ PRA
CARREIRAS NOVAS": (1) Contratos (carta-contrato assinada); (2) Modo Empresário
— REFEITA a pedido do Diego (03/08): agora a estrela é a prancheta "CONVOQUE
SEUS 22" (5 cartinhas por categoria com renda + vagas tracejadas + contador
5/22) e os 3 bullets são as comissões que ele gostou (artilheiro · campeão em
qualquer time · negociado no leilão); (3) Várzea
(campinho de TERRA MARROM já de teaser, placa "Bar do Zé", bullets escada/
régua/baralho gigante). Fontes em scratchpad (story-*.html).

## 🎨 MOCKUP dos 5 CAMPOS por divisão — AGUARDANDO OK do Diego (03/08)
Pedido (áudio): campinho do leilão/pregão MARROM na Várzea, verde tradicional
nas outras, e o verde da Série A "mais bonito". Mockup enviado com os 5:
🌱 Várzea terra batida #8B5E3C/#7A4E2E (placa de zoeira "Bar do Zé") ·
D/C/B verde de hoje #1B7A3D/#166332 · 👑 Série A premium #23984F/#1A7F40.
Formato/casinhas idênticos (Campinho em screens.tsx usa
repeating-linear-gradient 34px — é trocar o par de cores por divisão).
✅ APROVADO E IMPLEMENTADO (03/08, "adorei tudo, já faça valer"):
- turfColors() em screens.tsx: 🌱 marrom #8B5E3C/#7A4E2E na divisão V da
  carreira nova E TAMBÉM no modo várzea do rápido (state.varzea — pedido
  explícito dele); 👑 Série A da carreira nova = verde premium #23984F/#1A7F40;
  resto = verde tradicional (tudo que existia fica idêntico).
- ⚠️ DECISÃO DO DIEGO: a placa/logo de patrocínio (Vadico) FICA em todo campo —
  o "Bar do Zé" do mockup era só zoeira de mockup, NUNCA trocar a placa.

## 🎨 Arte de stories "CONTRATOS chegaram" entregue (03/08)
PNG 1080×1920 no visual do jogo (creme/Oswald/sombras duras): carta-contrato,
3 bullets (renovar/deixar ir, teto + família gananciosa, rivais no mercado) e
carimbo vermelho grandão "SÓ PRA CARREIRAS NOVAS — save antigo segue igual".
Enviada pro Diego postar; fonte em scratchpad (story-contratos.html). Se pedir
variações (cores/texto), é editar o HTML e re-renderizar (chromium headless
1080×2100 + crop 1920 — o viewport do headless come ~180px do window-size).

## 💰 PREÇOS INTELIGENTES na carreira nova (03/08, relato do tester Maurice) ✅
Relato: "🪵 vendido por 40 e ⭐ pelos mesmos 40; CPU pagando alto em jogador
ruim". MEDIDO em simulação (25 temporadas × runs, todas as vendas do leilão):
médias eram saudáveis (🪵12 · 🎯15 · 💎29 · ⭐40) mas as CAUDAS estouravam
(🎯 max 42 = mediana de ⭐; 🪵 p90 35 na Série B) e o LIVRO inflava sem teto
(🎯 com piso 100! — bônus de artilheiro somando toda temporada sem limite).
✅ CONSERTO (tudo atrás de `escadaOn` — jogo ao vivo e saves antigos intocados):
- `catPriceCap` (store): teto de mercado por categoria 🪵16 · 🎯26 · 💎42 ·
  ⭐65 · 👑90 (derivado das distribuições saudáveis medidas).
- `applyScorerValues`: bônus de artilheiro não empurra piso/livro além do teto
  da categoria (nunca REDUZ valor já gravado; carta não achada → teto médio 42).
- `cpuEnvelope(smart)`: lance da CPU capado no teto da categoria (×0.8-1.05 de
  variação) — bot rico/agressivo não fura o nível do jogador.
- `resolveOneTiebreak`: CPU não cobre EMPATE além do teto (era a última rota —
  empate a 25 escalava pra 38). Humano segue livre pra pagar o que quiser.
RESULTADO re-simulado: inversões 3.8%→0.0% (nenhum 🪵/🎯 acima da média ⭐ da
época); max 🎯 42→27; livro capado; escada por divisão limpa (V:🪵10/🎯14 →
B:💎36/⭐42). Regressão escadafina toda verde. Relista barato de encalhado
continua existindo (Diego: "é do jogo").
### ➕ Ajuste do Diego (03/08): "quero algo REAL — mercado sobe conforme avança,
### time rico paga mais (mas inteligente)" → TETO DINÂMICO
- `escadaEconFactor` (store): teto por categoria × riqueza média da sala (caixa
  dos humanos + clubCash de rivais/bots). Caixa ~100 = fator 1; cresce até 4×.
  Aplica no lance da CPU (os DOIS tetos escalam: fairPrice e categoria), na
  cobertura de empate e no piso de artilheiro. A PROPORÇÃO entre categorias é
  o que nunca muda (🪵 não alcança ⭐ da mesma época).
- Simulado 28 temporadas ×3: mercado SOBE com a era (🎯 12.9→20.5 · 💎 30→36 ·
  ⭐ 34.7→42.7 max 65) e inversões seguem 0.0%. Time rico já pagava mais pelo
  motor (fatia de orçamento + starHunger) — agora o teto deixa, sem pagar burro.
### ➕➕ Diego de novo (03/08): "Pelé por 409 depois de muitas temporadas" →
### teto estendido pra TODA CARREIRA (não só escada)
- Os 4 gates (lance CPU, empate, piso de artilheiro) mudaram de `escadaOn` pra
  `careerOnline` — carreira ANTIGA/longa também ganha o teto dinâmico. Modos
  rápidos seguem intocados (não têm inflação de livro).
- Piso JÁ inflado num save velho (ex.: Pelé 409) NÃO é reduzido na marra: a CPU
  para de cobrir (acima do teto), o jogador encalha e o piso CAI PELA METADE a
  cada relista (mecânica que já existia) até voltar pro teto — deflação natural
  em 2-3 temporadas, sem mexer em save.
- Regressões re-rodadas: preços ok, inversões 0.0%, escadafina toda verde.
## 📈 "SUBIU COM TIME RUIM?" — verificado, é percepção da régua (03/08)
Nas 15 promoções simuladas o promovido era SEMPRE mais forte que a MÉDIA da
divisão (XI ~77-80 vs ~75). Como a régua nivela todo mundo por baixo, o time
parece "ruim" no absoluto mas é o melhor do pelotão — funcionamento desenhado.
Obs.: a força média dos elencos CPU é ~constante entre divisões (a dificuldade
por divisão vem do handicap A2 B4 C5 D3 V4, não do elenco) — se o Diego quiser
elencos visivelmente melhores em cima, é outra alavanca (não mexida).

## 👥 TESTADORES da carreira nova (03/08): msb102010@hotmail.com + denilson.stifler10@gmail.com
Diego pediu pra liberar essas contas com o pacote COMPLETO da carreira nova de
teste, "igual o meu": entrou em AGENCIA_TESTERS (sport.ts) — a mesma lista
libera Agência 2.0 + Escada/Várzea + baralho 'todos'. Basquete e tema seguem
SÓ na conta do Diego (não fazem parte da carreira nova; se ele quiser, é
adicionar nas outras listas do mesmo arquivo).

## ⚠️ LIÇÃO DE DEPLOY (03/08): commitar no branch NÃO põe no ar!
O hotfix do loop ficou 2 commits só no branch `claude/denis-...` enquanto o site
(main) seguia sem ele — por isso o Diego continuou vendo bugs "já consertados".
Protocolo: depois de commitar/pushar no branch, conferir `git log origin/main` e
publicar com `git push origin HEAD:main` (fast-forward). Feito agora — main tem
o hotfix do leilão de reservas.

## 🕴️ AGÊNCIA NO ESTÁDIO — mockup mostrado, AGUARDANDO OK do Diego (03/08)
Pedidos do áudio do Diego:
1. "Aba antiga de Agência ainda aparece" — no código ela JÁ está escondida
   (filter em pyramidseason ~3117, main tem). Provável bundle em cache no
   aparelho dele (pedir F5/atualizar). ⚠️ MAS ao esconder a sub-aba, a tela
   AgenciaDesbloqueios ficou INALCANÇÁVEL — resolve junto com o item 2.
2. Mover os desbloqueios das categorias da agência pra DENTRO da área do
   estádio (Clube), visualmente integrado ("no estádio fica fácil de entender").
   Mockup enviado (scratchpad `mockup-estadio-agencia.html/png` + artifact):
   seção "🕴️ Agência de Jogadores" DENTRO da aba do estádio, escada de 5
   categorias com estado/falta/renda: 🪵 grátis de cara · 🎯 1 setor · 💎 3
   setores · ⭐ estádio 100% · 👑 SAF (= a régua que JÁ existe em empCatUnlocked
   — Diego confirmou no áudio que lenda é pós-SAF e prof ~de início; sugeri
   manter grátis de cara). CTA aponta pra Elenco › Agenciados. Texto stale da
   AgenciadosTab ("desbloqueios seguem na aba Clube › Agência", linha ~881)
   deve passar a apontar pra nova casa QUANDO implementar.
3. Nome da sub-aba: Diego APROVOU "🏗️ Estrutura" (áudio 03/08: "gostei do nome
   estrutura, gostei das ideias das três: estádio, patrocínio e o empresário").
4. Feedback do Diego no mockup v1: ele AMA o estádio ABERTO de cara ("uma
   pessoa via o estádio de cara, eu achava bonito") → mockup v2 enviado com a
   ordem: 1) StadiumSvg no TOPO (intacto, primeira coisa visível) · 2) obras/
   melhorias · 3) patrocínio · 4) caixa escura da Agência por último (destaca,
   não confunde com a obra). Aguardando OK do v2.
✅ IMPLEMENTADO (03/08) — Diego aprovou o v2 ("Gostei", com a ressalva de NÃO
   mexer no visual do estádio; o desenho do mockup era só marcador meu):
   - Sub-aba vira "🏗️ Estrutura" e ordem StadiumTab (desenho intacto, primeiro)
     → SponsorCard → AgenciaDesbloqueios (escada escura nova com progresso real:
     você tem X setores, falta camarote/telão…, chips ✓ABERTA/🔒N-de-M, CTA
     "Ver meus agenciados" que pula pra Elenco › Agenciados).
   - TUDO atrás de `agenciaOk` (agenciaOn && conta liberada) — jogo clássico e
     saves antigos 100% intocados (patrocínio continua em cima, aba Agência
     clássica continua existindo pra eles).
   - clubeSub 'escritorio' herdado numa carreira 2.0 cai na Estrutura (nada de
     tela órfã); texto da AgenciadosTab agora aponta pra Clube › Estrutura.

## 🔬 AUDITORIA FINA da carreira nova (escada) — pedido do Diego pós-loop (03/08) ✅
Diego pediu: (a) confirmar leilão de reservas na 2ª + listar na 3ª; (b) contratos
com a MESMA ordem de avisos/liberação da carreira antiga; (c) "analisar cada
pontinho" da carreira nova de novo. Feito com harness novo `escadafina.mjs`
(scratchpad, dirige o reducer REAL com asserções duras, monte via MONTE_PICK/PASS
de verdade — sem o atalho antigo que duplicava carta). Resultado TUDO VERDE:
- Gates: T2 compra reservas ✓ (leilão vende ~45-55 lotes; deepSquad ligado);
  T2 listar BLOQUEADO ✓; T3 listar libera ✓ — carta listada sai do elenco, vai
  pro baralho com seller, termina em EXATAMENTE 1 elenco (inclui times de fundo
  via cpuSquads) e a venda aparece no extrato ✓.
- Contratos: ordem JÁ ERA idêntica à carreira antiga (tudo por seasonNo, nada
  de código novo): T1 sorteio 5-10 na cerimônia ✓ · fim da T4 primeira folha ✓
  (antes disso só a linha 0 forçada do resumo) · T5 avisos "último ano" com
  conteúdo ✓ · T6-T7 primeiro selo ⏳ SEM CONTRATO no baralho ✓ · nenhum
  contrato vencido sobrevive pós-cerimônia (renova/aperto/leilão) ✓.
- Invariantes por temporada (10 temporadas × vários runs): caixa×extrato EXATO
  em toda virada ✓ · sem NaN (careerCoins/clubCash/money) ✓ · sem duplicata de
  jogador real entre elencos ✓ · sem FAKE no baralho de reservas ✓ · régua da
  divisão respeitada (fora dela SÓ mercado secundário: seller/sem-contrato, por
  design) ✓ · placements 20 times × 5 divisões ✓ · sem multiclube fantasma ✓ ·
  leilão sempre termina ✓.
- 🎁 Bônus: o achado da auditoria anterior (rival de várzea com incógnito preso
  no XI) SUMIU — com o leilão de reservas funcionando, os rivais repõem de
  verdade. Sem warnings em nenhum run.
Nenhuma mudança de código precisou nesta rodada (contratos já alinhados).

## 🪜 HOTFIX — "loop 1→12" no leilão de reservas da escada (03/08, Diego bravo) ✅
Relato (carreira nova com escada/Várzea): iniciou o leilão de reservas na virada
T1→T2, tela dizia "não liberado" mas rodou mesmo assim, e virou um desfile de
resultados 1→12→1 sem leilão de verdade (teve que sair do jogo).
CAUSA-RAIZ: a trava "banco de reservas só depois do 1º acesso" (benchOK em
RESERVE_AUCTION_ONLINE) deixava TODO MUNDO mirando 11 — e a sala inteira já tem
11/11 na virada. Ninguém podia dar lance em NADA → cada leva de 12 lotes
(BATCH_SIZE=12) lacrava sozinha, tudo "não vendido", leva após leva, setor após
setor (~10 levas de 12 = o "looping de 1 a 12"). Não era infinito (terminava na
cerimônia), mas era um leilão 100% inútil e parecia travado.
✅ CONSERTO (regra nova do Diego: "o leilão de reservas deve funcionar sim, e na
3ª temporada libera a venda"):
- Trava do banco REMOVIDA: leilão de reservas da escada funciona desde a T2 igual
  à carreira normal (todo mundo mira 22; venda continua liberando na T3, regra
  global que já existia). A RÉGUA de categorias por divisão FICA (na Várzea o
  banco enche de 🪵+🎯, etc.).
- `escadaSubiu` virou só marco de "virou profissional" (persiste; muda a régua) —
  textos e mensagem de acesso atualizados; caixa "banco travado" da tela de venda
  substituída por explicação da régua; banner T2 "🔓 Desbloqueado: Reservas!"
  voltou a aparecer na escada (antes era suprimido e contradizia o fluxo).
- Simulação headless (simescada) re-rodada: 30 temporadas sem stall, elenco chega
  a 22, régua respeitada, arco V→A preservado.
- SOBRE O "caixa aumentou estranhamente" ao iniciar o leilão: é a VIRADA legítima
  — prêmios da temporada + bilheteria − folha entram exatamente no
  OPEN_RESERVE_LIST e BATEM com o extrato (invariante auditado caixa×extrato).
  Explicar pro Diego; se ele suspeitar de valor, pedir print do extrato.

## 🏛️ BUG — SEGUNDO CLUBE não compra depois que o técnico SOBE da Série D (04/08)
Relato: Lenda com 4.000 moedas, botão fica CINZA com "Nenhum clube da Série D
disponível agora." (SOLO/offline — não é o online.) CAUSA: a lista `opcoes`
(pyramidseason ~2761) e o motor `BUY_MULTICLUBE` (store ~3217) só olham `state.managers`
placeados em 'D'. Mas `state.managers` = só ~20 times da SUA divisão atual
(buildPyramid usa `managers.slice(0,20)`); os outros 60 (outras divisões) são times de
FUNDO gerados por `buildCpuSquads`, que NÃO estão em `state.managers`. Então, assim que
o técnico sobe pra C/B/A, a Série D vira só times de fundo → lista vazia → botão cinza.
Justo quem tem 4.000 moedas (várias temporadas) já subiu → não consegue comprar.
✅ FEITO (04/08) — "comprar de qualquer divisão, igual à SAF":
- `opcoes` (pyramidseason) agora vem de `sortDiv(tables.D).slice(4)` (a Série D DE
  VERDADE, exista você onde existir), filtrando você/humanos/rivais/SAF/2º-clube — igual
  à lista da SAF.
- `BUY_MULTICLUBE` (store): CASO 1 (estou na D) = transforma o bot como antes; CASO 2
  (outra divisão) = CRIA o 2º clube dormindo (id novo, squad via `cpuSquads`, placement
  D, mine+dormindo), e um preenchimento cede o lugar pra liga seguir com 20. Resultado é
  um assento `mine+dormindo` IDÊNTICO ao do Caso 1 → reusa o caminho já testado (dorme/
  joga/troca). Travas: nunca você/rival/SAF; alvo TEM que estar na D; sem filler livre →
  não compra (nunca cria estado inválido). Regra do Diego: 1º time em qualquer divisão;
  2º escolhido entre os que HOJE jogam a Série D; depois cada um vai pra onde o mérito
  levar. Escolha "todos que vão jogar a D" (inclui caídos da C) atendida por usar tables.D.
- `buildCpuSquads` agora exclui nomes que viraram MANAGER (evita time DUPLICADO na
  pirâmide quando um clube de fundo vira 2º clube). No-op no jogo normal.
Testado: build OK + app sobe sem erro de JS no navegador. NÃO deu pra fazer playthrough
multi-temporada aqui (Supabase bloqueado no ambiente de teste → sem login/carreira).
⚠️ FALTA: Diego (ou tester) testar em carreira real: subir pra Série A, comprar 2º clube
da D, passar 1-2 temporadas e conferir que o clube PERSISTE e dá pra assumir. Reversível
(commit isolado). FALTA TB: textinho informativo no painel (visual → aguardando OK do
Diego). WORKAROUND enquanto valida: comprar ainda na Série D.

## 🚨🚨 BUG SÉRIO — IDENTIDADE/ASSENTO EM SALA GRANDE (03/08) — Diego quer MANTER 20
Sala LOTADA (18/20) na noite 03/08. Relatos do jogador "Viria" (host): (1) "no começo
tinha DOIS eu; o 2º não dava lance (fantasma), aí expulsei"; (2) depois ficou
**jogando com o NOME DE OUTRO técnico**; (3) deu **F5 e trocou pra OUTRO nome, ainda
não o dele**. Sintomas colaterais: leilão lacrando sozinho + time montado sozinho.
Diego escolheu **MANTER limite 20** (não capar sala) → precisa consertar a RAIZ.

### O que já apurei no código (03/08):
- **KICK NÃO desloca o array** (era minha suspeita, ERRADA): `KICK_PLAYER` (store.tsx
  ~2547) acha o manager por **id** e só faz `isHuman=false` **no lugar** (vira CPU).
  Não faz splice → não empurra índices. Então o kick sozinho não é o vilão.
- **A âncora de identidade é FRÁGIL**: `FIX_YOU_IDX` (auto-cura, store.tsx ~5145-5160)
  reancora o `youIdx` **pelo NOME** (device display_name × manager.name), e só quando
  há EXATAMENTE 1 humano com aquele nome. Fura quando: (a) existe **fantasma com nome
  igual** (cands≠1 → não cura); (b) o **nome do device ≠ nome do time** no jogo (nunca
  casa → nunca cura); (c) **carreira online reordena os managers entre temporadas** →
  `player_index` do room_players deixa de bater com a posição no array.
- No reconnect, `RESTORE_ONLINE` faz `youIdx = room_players.player_index` (lobby ~270),
  e o **host-recreate usa `seatIdx = mineMgr.id`** (lobby ~256) — id NÃO é
  necessariamente a posição do array. Somados, dá pra cair no assento errado.
- Dedup "1 técnico = 1 assento" só roda no **startOnline** (lobby ~1139-1151); um
  fantasma criado por corrida/reconexão DEPOIS do start escapa.

### 🎯 SMOKING GUN (04/08) — "expulsar" mistura ID com ÍNDICE DE ASSENTO:
A UI chama `kickPlayer(m.id)` (screens.tsx 745/5937/5941) → passa o **id** do manager.
Mas dentro do fluxo o mesmo número é tratado como **índice de assento** em 3 pontos:
- `kickPlayer` guard (store ~4854): `playerIndex === youIdx` compara **id × índice**.
- `room_players.delete().eq('player_index', playerIndex)` (store ~4858): apaga a vaga
  pelo **id** achando que é player_index → apaga a vaga ERRADA (ou nenhuma) → o
  expulso reconecta na mesma partida / sobra fantasma.
- Handler do cliente (store ~4952): `payload.playerIndex !== youIdx` compara **id ×
  índice** → o banner "você foi removido" pode ir pra pessoa ERRADA, e o expulso pode
  continuar dentro. (O reducer KICK_PLAYER em si usa id e está certo; submitted/
  monteOrder/tiebreak usam id — OK. O erro está nesses 3 pontos da BORDA.)
Como `id` só coincide com `youIdx`/`player_index` quando os assentos são 0,1,2… (some
na carreira online reordenada / salas grandes), é AÍ que "vira outro / removido errado".
FIX: usar o **id** de ponta a ponta no expulsar → guard compara com o MEU id
(`managers[youIdx].id`); handler compara `managers[youIdx].id` com o id expulso; e a
vaga do banco tem que ser apagada pelo assento/usuário certo daquele id (parte que
depende do item 1 do plano — âncora por id estável).

### 📏 REGRA DO EXPULSAR (Diego, 04/08): expulsou → a pessoa SAI (banner "removido
pelo host"), NÃO vira CPU. Vira CPU (auctionRival) SÓ quando eram 2 jogadores (pra
quem ficou não jogar sozinho). O reducer já faz `auctionRival = humansLeft<=1`, mas o
"exclui de verdade" precisa remover o expulso do fluxo/vaga sem virar filler ativo.

### PLANO DO FIX (área sensível — testar antes de subir pra sala grande):
1. **Assento ancorado por ID ESTÁVEL, não por nome**: guardar o `manager.id` do técnico
   por usuário (ex.: gravar no room_players no START_ONLINE) e no reconnect fazer
   `youIdx = managers.findIndex(m => m.id === meuManagerId)`. Sobrevive a reordenação
   de temporada e a nome de time custom. (Fallback: nome, só se não achar por id.)
2. **1 técnico = 1 assento SEMPRE**: rodar a dedup por usuário também na reconexão/no
   meio do jogo, não só no start → fantasma nunca existe.
3. Revisar auto-lacra do espectador (screens.tsx ~2197-2213) pra assento fantasma não
   forçar SEAL.
⚠️ NÃO hot-patchar na sala ao vivo de 20; **reproduzir num teste de 2-3 pessoas** e
subir validado. Deploy não derruba quem já joga (só vale em F5/próxima sala).

### ✅ Já consertado nesta noite (03-04/08):
- **Velocidade** (commit 6a42317): sala AUTO rodava "ultra rápida" porque `simSpeed`
  (sincronizado na sala) vinha alto de um jogo anterior e o online não tem botão pra
  voltar. `START_ONLINE` agora zera `simSpeed=1`. Só afeta jogos NOVOS. Reversível.
- **EXPULSAR + IDENTIDADE por CRACHÁ (id), não por cadeira (04/08)**: 3 pontos que
  misturavam id×índice foram alinhados pro id:
  · `kickPlayer` guard → compara o expulso com o MEU id (`managers[youIdx].id`).
  · handler do 'kick' no cliente → idem (banner vai pra pessoa certa).
  · `RESTORE_ONLINE` → `youIdx` acha a posição atual do meu manager pelo id
    (`findIndex(m.id===player_index)`), fallback pro cru. Corrige "F5 trocou de nome"
    na carreira reordenada e o "virei outro" ao expulsar em sala grande.
  Em sala pequena/temporada 1 (id===cadeira) o comportamento é IDÊNTICO ao de antes —
  só corrige os casos desalinhados. Não toca em partida em andamento (vale em novo
  kick/reconexão). Reversível.
- **AUTO-CURA por CRACHÁ (id), não por nome (04/08)**: a `FIX_YOU_IDX` agora guarda o
  id do meu técnico (bootstrap: 1º nome único da sala) e daí reancora pela POSIÇÃO
  ATUAL desse id — imune a nome repetido (fantasma), nome de time trocado e reordenação
  de temporada. Zera o crachá ao trocar de sala (ids se repetem entre salas). Fecha o
  último band-aid do "virei outro / F5 trocou de nome".
  ⚠️ FALTA SÓ: **TESTE de 2-3 pessoas** (idealmente reproduzindo a carreira online
  entre temporadas: F5 no meio + expulsar) pra confirmar em campo antes de sala cheia
  confiar 100%. Regra do expulsar (sai; CPU só p/ 2) já batida pelo reducer
  (auctionRival=humansLeft<=1) — o "virava CPU errado" era o id×índice, agora alinhado.

## 🚨 CUSTO SUPABASE — estourou cota (03/08) — fix REVERTIDO, RE-APLICAR com calma
Pro Plan. Ciclo passou da cota: **Realtime Messages 20mi/5mi (400%)** e **Egress
555/250 GB (222%)**. Grace até **29/ago**; até lá funciona e **NÃO cobra** (spend cap
ON — "not billed for overages"). Causa: heartbeat do host reemitia o ESTADO INTEIRO
a cada 3s sem parar (pior com sala de 20). ⚠️ NUNCA "Disable spend cap" (é o que
cobraria). NÃO precisa Team ($599) nem trocar de plano — resolve no código.
- Fix feito (commit b72a847) e **REVERTIDO (cffa33d)** na mesma noite só por PRECAUÇÃO
  quando apareceu o bug do jogador-em-dobro (que NÃO era do fix). O fix era: heartbeat
  só reemite quando a sala está quieta (>12s sem envio), checando a cada 6s — mesma
  proteção contra trava, fração do tráfego. **RE-APLICAR com o Diego quando acalmar**
  (não urgente — 26 dias). Próximos alvos seguros: enxugar `packState`; throttle do
  broadcast por-mudança na simulação da temporada.

## ⚽ Leilão Legends
1. **Painel "PRÓXIMO" do modo rápido (online + offline) — APROVADO em mockup, falta implementar:**
   - Botões de tática ~40% menores (pílulas de uma linha; a escolhida ganha ✓).
   - Micro-legenda EMBAIXO de cada botão: retranca "segura o ataque" · equilíbrio "fura a retranca" · ataque "atropela o equilíbrio".
   - REMOVER a linha "⏱️ Temporada rolando sozinha — sente e assista".
   - NOVO: scout do adversário (posição · pontos · últimos 5 jogos V/E/D).
   - NOVO: chip 🔥 CLÁSSICO com retrospecto do confronto quando o próximo rival é humano.
   - Barrinha de progresso continua (fina, embaixo).
   - Mockup de referência: artifact "Mockup — Painel PRÓXIMO (rápido)" (sessão de 26/07).
2. (Opcional, oferecido) Brilho ANIMADO (sheen) na faixa do tier nas tabelas — hoje é só o degradê parado.
3. (Opcional, oferecido) CPU/rivais escolherem a própria formação (4-3-3/4-4-2) na carreira — hoje só humano troca.
4. 🏆 **COPA DO MUNDO LEGENDS (conceito aprovado; construção COMEÇOU 27/07):** a cada 10 temporadas da carreira, entre temporadas. Desbloqueio: já foi campeão de alguma série. Jogador escolhe uma SELEÇÃO e monta o XI por leilão cego só com cartas daquele país; 16 seleções, grupos + mata-mata. Prêmio = status (carta dourada + estrela mundial + mural).
   - ✅ **Passo 1 FEITO**: país etiquetado nas 1032 cartas (`src/escalacao/paises.ts`, não importado pelo jogo ainda — zero risco). Ranking + buracos por posição: `docs/copa-paises-worklog.md`.
   - ✅ **Decisões novas do Diego (27/07)**: as 16 vagas = TOP-16 do ranking por Nº DE CARTAS no baralho (atualiza sozinho; Brasil 1º disparado com 510); fluxo de entrada = botão dourado "🌍 DISPUTAR A COPA" na tela "novo leilão/mesmo time" nas temporadas múltiplas de 10 + notícia-hype na temporada anterior + trava "só campeões" com aviso claro.
   - ✅ Lote de 36 cartas NO AR (28/07): todas as 16 seleções com 22+ e formação fechando.
   - ✅ **MODO NO AR (28/07, v1 SOLO)**: `src/escalacao/copa-mundo.tsx` — tudo local (localStorage llcopa:<seed>, ZERO mexida no reducer). Gate no fim de temporada solo (trava temporada 100 com barra · chip contagem · botão dourado), escolha de seleção travada pela posição no TOP 16 do ranking de clubes, convocação (listão A-Z sem categoria, versões dedupe, 4-3-3/4-4-2 com trava por elenco, campinho enchendo), bots convocam os melhores 11, torneio AO VIVO (28/07, pedido do Diego após teste): SEU jogo roda no LiveScoreCard oficial (relógio 0→90 em 9s = ritmo da liga, GOOOL pingando com nome do convocado), tabela/resultados dos outros SÓ após o apito, pênaltis no PensShootout cobrança a cobrança, MODO AUTO por padrão (a Copa anda sozinha, igual a liga) + Modo Manual completo pra quem tem (🐢/⚡, pular, próxima fase — SimControls/SpeedControls oficiais; QuickManualLock/APOIE pro resto) + eliminado ASSISTE todos os confrontos ao vivo — 6 rodadas de grupo → sorteio → QF/SF ida-volta → final única → cerimônia + mural.
   - ✅ **ONLINE liberado (28/07)**: o gate aparece também na carreira online — cada técnico disputa a SUA Copa no próprio aparelho (demais clubes do top 16 viram CPU; nada sincroniza → zero risco pra sala; jogar não trava a votação). **FALTA (fase 3)**: Copa SINCRONIZADA na sala (votação/host, humanos se enfrentando) · notícia-hype no O Martelo · ⭐ fora do mural · carta dourada física · testes com save real do Diego.
5. 🏛️ **SEGUNDO CLUBE (spec do Diego 28/07 — aguardando 2 confirmações p/ mockup):** compra por **4.000 moedas do jogo** (tem que TER); botão de compra **exclusivo do tier Lenda 👑** (Lenda não ganha de graça, paga igual); ✅ CONFIRMADO (28/07): aparece quando o **modo Empresário** estiver desbloqueado (+ tier Lenda + 4.000 moedas). **Seletor de clube** na carreira; o clube NÃO selecionado DORME: não lista, não compra, não dá lance, elenco travado — NUNCA entra em leilão sozinho. Fim de temporada: mesmo time = os DOIS seguem; leilão = SÓ o clube selecionado vai (o outro aguarda e segue mesmo time); pra levar o outro, seleciona ele ANTES. Jogo entre os dois clubes do mesmo dono = 100% simulado, sem interferência. ✅ CONFIRMADO (28/07): a compra é IGUAL À SAF — escolhe um clube JÁ EXISTENTE da **Série D**, o clube vira a COR do comprador (não nasce do zero; herda nome/histórico do time de fundo). **SPEC FECHADA — mockup aprovado (artifact b0791c0d).** SAF continua como é (é outra coisa).
   - **NOME OFICIAL (29/07, escolha do Diego): 🏛️ MULTICLUBES.** Modo Empresário = a AGÊNCIA (💼 cartas), que já existe — então o gate é ter a carreira solo + Lenda + 4.000. Escopo: **SÓ SOLO** (online seria pesadelo de sync). Copa do Mundo: se os DOIS clubes estiverem no top-16, você joga com o SELECIONADO; o que dorme é auto-jogado pela CPU (pode até ser campeão pela máquina). Você escolhe qual joga selecionando antes.
   - **EM CONSTRUÇÃO, INVISÍVEL PRO PÚBLICO** (igual basquete): trava `MULTICLUBE_TESTERS` em `pyramidseason.tsx` (só `diego.c.fonseca@gmail.com` vê). Liberar só quando pronto+aprovado.
   - ✅ **FASE 1 (a COMPRA) FEITA (29/07):** estado `multiClube` (types.ts) · ação `BUY_MULTICLUBE` (store.tsx: solo, 4.000 moedas, clube da Série D não-seu/não-rival) · painel `MultiClubeBuy` na aba Clube (gated + travas: só Lenda / faltam X moedas / lista de clubes da Série D). Reversível, isolado.
   - ✅ **FASE 2 (motor da troca) FEITA (1º corte, 29/07):** DECISÕES do Diego: TUDO SEPARADO (não mistura caixa/extrato/rank/títulos/estádio/agência/SAF); troca SÓ entre temporadas (tela de fim); clube que dorme = congelado "mesmo time" (não vai ao leilão, mesma escalação); carta do clube que dormia APARECE quando você troca pra ele (você abre). Motor: BUY vira o clube da Série D num assento MEU independente (id próprio → caixa/títulos/estádio já separados); SWITCH_MULTICLUBE troca youIdx + swap dos campos únicos (extrato/SAF/patrocínio/agência) via stash; `dormindo` excluído de `auctioningManagers` (não dá lance); seletor na tela de fim de temporada. Gated (MULTICLUBE_TESTERS). **FALTA testar/afinar:** (a) extrato do clube que dorme pode cair no do ativo (campo único do solo) — rever.
   - ✅ **FASE 3 FEITA (1º corte, 29/07):** (a) **CARTA-esperando** — quando o clube que DORMIA foi campeão (título de divisão e/ou Copa Legends), a carta fica GUARDADA (`multiClubePendingCards`, keyed por id → separado) e o pacote aparece na tela de fim de temporada pra VOCÊ abrir assim que passa o comando pra ele (`recordDormantCards` no fim de temporada + `CLEAR_MULTICLUBE_PENDING` ao abrir). (b) **Copa do Mundo** e (c) **jogo entre os 2 clubes** já saem de graça da arquitetura da Fase 2: o clube que dorme entra no top-16 como CPU (auto-jogado, pode ser campeão pela máquina) e o assento dele NÃO tem input humano (`youIdx` só aponta pro ativo) → jogo entre os dois é 100% simulado. **BUG corrigido de tabela:** o 2º clube é `isHuman` (assento meu), então o SOLO ia cair no fluxo de VOTAÇÃO online — agora `humans` exclui `dormindo`. Gated. **REVERSÍVEL** (tudo atrás da trava de tester; nada toca o jogo do público). **FALTA testar com save real do Diego** + afinar extrato do clube dormindo.
   - ✅ **SELETOR LIVRE — Opção B (FEITO 31/07, aprovado pelo Diego, commit af96129):** trocar de clube A QUALQUER HORA (não só entre temporadas). Seletor na aba **Clube** (`pyramidseason.tsx`): mostra os 2 clubes (ativo/dormindo) + botão. **Travas com aviso claro:** no meio de rodada/Copa animando → "deixe a rodada/Copa acabar"; fora do leilão é garantido (leilão é outra tela). **AUTO:** botão "Trocar no fim desta rodada" → espera o apito e abre o confirmar sozinho (`multiPending` + efeito). **MANUAL:** troca direto entre rodadas. **Modal de confirmar** com a explicação (o outro dorme "mesmo time"; empréstimo acaba na virada e repõe titular; nada mistura). Reducer `SWITCH_MULTICLUBE` já suportava mid-season (era só a UI que limitava). Só solo/tester. **FALTA CONFIRMAR num teste real:** (a) trocar no meio da temporada não bagunça a sim; (b) o empréstimo do clube DORMINDO realmente acaba na virada e o titular do próprio clube repõe (nunca 10) — o texto do modal promete isso; validar. **Falta (opcional):** banner mais festivo "acabei de comprar o 2º clube" (hoje o seletor + nota já explicam ao aparecer).
   - ✅ **BUG "virei o bot / não consigo dar lance" no ONLINE RÁPIDO após "novo leilão" (FEITO 31/07 — ocorreu com o Diego, não-host):** depois do "novo leilão" (rematch, mesma sala, ninguém saiu), o índice local "quem sou eu" (youIdx) DESLIZOU e passou a apontar pra um assento de BOT (o "Biriba United", elenco completo, 💰0) — a pessoa só ASSISTIA, não dava lance, e o assento humano dela ("Neymarzetti", 💰100, 0/11) ficava órfão esperando lacrar. **RAIZ (screens.tsx `startLeilao`):** o INÍCIO da sala (lobby) DEDUPLICA os `room_players` por usuário e usa a POSIÇÃO na lista limpa como número do assento; o "novo leilão" lia os `room_players` CRUS (sem dedup) e montava os assentos noutra ordem. Reconexão/refresh no meio do jogo pode deixar vaga DUPLICADA no banco → a revanche montava os assentos deslocados e o youIdx (preservado do jogo 1) caía num bot. **Fix (raiz):** o `startLeilao` agora deduplica igual ao início e usa a posição na lista limpa (`playerIndex = minha posição`) — ordem dos assentos IDÊNTICA ao jogo anterior, ninguém desliza. **Rede de segurança (store.tsx):** a AUTO-CURA de identidade tinha um buraco — só reancorava quando eu caía em cima de OUTRO HUMANO; caindo num BOT, desistia. Agora reancora também no bot/assento vazio (se existe exatamente 1 humano com o meu nome) e o nome tem fallback pro começo do e-mail. Identidade 100% LOCAL. Isolado, revertível.
   - ✅ **BUG do LEILÃO TRAVANDO no 2º clube (FEITO 31/07 — testers denilson/"Denis" travados no "TEMPO 0s"):** RAIZ (commit 25cf656): em `RESERVE_AUCTION_ONLINE`, TODO clube `isHuman` virava `deepSquad` (mira 22) — inclusive o DORMINDO. Aí os DOIS clubes entravam no MESMO leilão de reservas, o pregão pulava entre eles (o tester relatou: travou no zagueiro do time 2 e "pulou pro time 1" que também faltava zagueiro) e travava (o dormindo nunca lacra). **Fix: só o clube ATIVO (`isHuman && !dormindo`) vira deepSquad e entra no leilão** — o dormindo segue "mesmo time" fora do pregão. **Redes de segurança (commits e8ff0ef, dd9eb24, 8088a5f, 70e283d):** no SOLO, só o assento ATIVO (youIdx) conta pra lacrar (`humansToSubmit`), pescar (`buildMonteOrder`) e reiniciar (`humanManagerIds`); e um **FORCE_SEAL no tempo-0** destrava QUALQUER leilão solo já preso (inclusive quem já tinha lacrado — no solo a tela de lance aparece mesmo pós-lacre, então o auto-lacre não re-disparava). **No-op em jogo normal (ninguém `dormindo`; 1 humano = youIdx).** Save preso se recupera ao pegar a versão NOVA (recarregar forte).
   - ✅ **BUG "os 2 clubes com o MEU nome" + "Dedé bigode aguardando na sala" (FEITO 31/07 — Denis, save do 2º clube):** RAIZ: `RESUME_CAREER_SOLO` (store.tsx) forçava `youIdx: 0` ao recarregar. Na carreira normal o técnico é sempre o assento 0 — mas com MULTICLUBES o comando pode estar em OUTRO assento (você trocou de clube). Aí, no reload, o jogo voltava pro assento 0 enquanto `multiClube.team` ainda apontava pro clube que ESTAVA no 0 → o seletor mostrava **os DOIS clubes com o mesmo nome (o seu)**, e o clube que você comandava de verdade virava "outro humano na sala" (aparecia como `Fulano aguardando na sala` no leilão, mesmo sendo carreira SOLO). **Fix: com multiclube, ao recarregar eu reancoro no assento ATIVO (o humano que NÃO está `dormindo`); sem multiclube segue 0 — no-op no jogo normal.** Só solo/tester, isolado, revertível (1 commit).
   - ✅ **SAF ÚNICA COMPARTILHADA pelos 2 clubes (decisão do Diego 31/07, FEITO):** só existe UMA SAF; ela fica **grudada no clube ativo** pra novos empréstimos, e é um **bolo compartilhado** — se a SAF tem 4 jogadores e um clube pega 2, sobram 2 pro outro (o jogador emprestado sai fisicamente do elenco da SAF, então o outro clube só vê o que restou). **Implementação (store.tsx):** (1) `SWITCH_MULTICLUBE` **não faz mais swap da `careerFilial`** — a SAF segue igual ao trocar de comando (migra automático uma SAF que save antigo tenha guardado no clube que dormia). (2) cada empréstimo é carimbado com `byClub` (qual clube fez) → na virada/venda o `revertFilialLoans` devolve pro clube CERTO e tira o jogador da SAF de QUALQUER elenco seu por id (nunca duplica, mesmo se estava no clube que dormia). (3) o limite de vagas por divisão conta só o que ESTE clube emprestou (o do outro não gasta a sua vaga). **No-op na carreira normal (1 humano, sem `byClub` = comportamento idêntico ao de antes).** Só solo/tester, isolado, revertível. **FALTA testar num save real:** trocar de clube + emprestar dos dois + virar a temporada e conferir que cada empréstimo volta certo e ninguém joga com 10.
   - ✅ **BUG "carreira OFFLINE caindo em VOTAÇÃO" + "Você" no lugar do nome do time (FEITO 31/07 — Diego):** a tela de fim de temporada mostrava a VOTAÇÃO online (chips "Tokyo City Esperion ✓" + "Você", "Aguardando votos 1/2") numa carreira SOLO. RAIZ: `humans = managers.filter(isHuman && !dormindo)`; num save de multiclube TORTO os DOIS clubes estavam como humanos ATIVOS (o dormindo perdeu a flag) → `humans.length === 2` → caía no ramo online da votação. **Fix A (pyramidseason.tsx):** a votação é SÓ do online — `if (state.onlineMode !== 'online' || humans.length <= 1)` cai sempre no ramo solo (decisão de UM clube, sem voto). **Fix B (store.tsx `normalizeMultiSeats`):** ao carregar/retomar, crava exatamente 1 humano ativo + o `dormindo` certo (usa `multiClube.id`, que é sempre o que dorme) e reancora o `youIdx` — repara o save torto e protege o leilão de reentrar o dormindo. Roda nos 2 caminhos de retomada. No-op sem 2º clube. Isolado, revertível.
   - ✅ **BUG "entrei com outra conta no meu aparelho e ela viu meus saves" (FEITO 31/07 — Diego logou na conta do Denis no celular DELE pra testar; depois a carreira "Neymar" do DIEGO apareceu na conta do DENIS):** RAIZ: na nuvem cada carreira já é por CONTA (`esc_pyramid_saves`, `user_id`) — o backup de cada um está intacto. Mas os saves LOCAIS do aparelho (`esc-solo-career` + `esc-career-archive` + resume) eram COMPARTILHADOS: quando o Diego logou na conta do Denis, o `savePyramidCloud`/`syncCareersWithCloud` juntou os saves LOCAIS do Diego na nuvem do DENIS (vazou a carreira do Diego pra conta do Denis). **Fix (store.tsx):** carimbo de DONO do aparelho (`esc-career-owner` = user_id) + COFRE por conta (`esc-career-vault::<uid>`). `ensureCareerOwner(uid)` roda antes de subir/juntar na nuvem: mesma conta = no-op (caminho quente intocado); 1ª vez sem dono = a conta atual assume o que já está no aparelho (grandfather, ninguém perde); conta DIFERENTE = guarda a anterior no cofre (não perde nada), limpa o compartilhado e restaura o cofre da conta que entrou. Agora **o que manda é o login, nunca o aparelho.** No-op pra 99% (1 conta/aparelho). Isolado, revertível. **FALTA:** limpar o que JÁ vazou pra conta do Denis (as carreiras do Diego que já subiram) — apagar pelo seletor de saves na conta do Denis (o delete tira da nuvem também) OU limpeza cirúrgica no Supabase (com OK do Diego).
   - ✅ **VERIFICADO no save REAL do Denis (denilson.stifler10) — "cartas embaralhando entre os 2 clubes" NÃO reproduz mais (31/07):** o Denis relatou que o elenco do time 1 aparecia no time 2 (comandava o time 2 no leilão e os jogadores caíam no time 1). Inspeção do save de verdade (`esc_pyramid_saves` no Supabase, projeto `faabglpjutwursgmrpny`): carreira multiclube na temp. 180 (Tokyo City Esperion id 0 · Inter Estadual id 11), os **DOIS elencos 100% separados (0 carta em comum), cada um batendo com o próprio extrato — nada foi perdido**. Peguei o Denis JOGANDO ao vivo: passou o comando pro Inter (time 2), arrematou o Ronaldinho no leilão → entrou no **Inter**, e o **Tokyo ficou intacto** (mesmos 16). Ou seja, na versão de hoje o roteamento está certo (carta vai pro assento no comando = `youIdx`; o clube que dorme fica fora de leilão/monte/lacre). O relato era da versão ANTIGA — a leva de fixes de multiclube de hoje (dormindo fora do leilão de reservas · reancorar assento no reload · `normalizeMultiSeats`) fechou a classe do bug. **Denis reconfirmou por teste: deu certo.** Regras reconfirmadas com o Diego e batidas com o código: (a) compra um clube da Série D e as lendas/jogadores que ele JÁ tinha **continuam** (BUY_MULTICLUBE não toca no `squad`); (b) o **nome do clube comprado se mantém** (não renomeia — só veste a cor do dono, igual à SAF); (c) fake/perna-de-pau do clube comprado **fica** (cerimônia só tira fake de BOT, `if (m.isHuman) continue`); (d) **um leilão por temporada, só do time no comando** — o outro fica "mesmo time" congelado; pra renovar o outro, seleciona ele antes numa temporada seguinte (alterna, nunca os dois no mesmo ano). Nenhuma linha de código mexida nesta sessão (só diagnóstico) → nada a reverter. **Oferta em aberto:** trava defensiva "carta arrematada sempre vai pro assento no comando; se os 2 clubes divergirem, corrige na hora" (no-op em carreira de 1 clube) — só se o Diego pedir.
   - ✅ **EMPRÉSTIMO DA SAF AGORA PERSISTE (pedido do Diego 01/08 — "muita gente reclamando que tinha que refazer o empréstimo TODA temporada"; aprovou "pode fazer tudo"):** o empréstimo NÃO volta mais sozinho na virada — **fica valendo até você trazer de volta** (quem quiser mexer mexe, quem não quiser mantém). As 4 travas combinadas e feitas (store.tsx): (1) `trimFilialLoansToDivision` substitui `revertFilialLoans` em `NEXT_SEASON_ONLINE` e `OPEN_RESERVE_LIST` — roda DEPOIS de gravar `careerPlacements` (divisão nova) e só devolve o **EXCEDENTE** quando você **rebaixa** e a SAF perde vaga (D1·C2·B3·A4); (2) emprestado **travado pra venda/lista** — guarda novo em `TOGGLE_RESERVE_LIST` (`if (card.emprestado) return s`) + a UI já bloqueava (`canList`); (3) **botão manual "↩️ trazer de volta / devolver pra SAF"** em cada empréstimo (ação `RETURN_FILIAL_LOAN`, os 2 sentidos, online+solo+multiclube por `byClub`); (4) **vender a SAF** (`SELL_FILIAL`) e **novo leilão** (`REAUCTION_ONLINE`) continuam devolvendo TUDO (mantêm `revertFilialLoans`/`returnFilialLoansFor` — reset total). **Aviso na tela:** `filialTrimNotice` (types.ts) conta quantos voltaram por rebaixamento → banner âmbar na aba Estádio/SAF (dispensa no ×, ação `CLEAR_FILIAL_TRIM_NOTICE`). Textos da SAF atualizados ("fica valendo até você trazer de volta"; regra "só volta sozinho o excedente se cair de divisão"). **No-op pra quem tem 1 clube e não rebaixa.** Isolado, revertível (reverter os commits desta entrega volta ao "devolve tudo na virada"). **FALTA testar num save real:** emprestar, virar 2-3 temporadas sem mexer (deve continuar valendo), rebaixar com a vaga cheia (deve voltar só o excedente + aviso), e usar o botão de trazer de volta pra depois vender.
6. 📯 Buzina da Zoeira (sala de espera online) FEITA (3 memes: 📞 posso-te-ligar · 🎙️ meme2 · 🗣️ SIIIIUU (28/07) + regras: 30s/pessoa, 1 som por vez, assinatura, mudo). Áudio "faah" na LENDA (pega/vende) FEITO. **Ampliar cardápio**: Diego manda MP3s novos (myinstants) → entram como botões novos. Futuro possível: buzina TAMBÉM dentro do leilão.
7. 🖋️ **FUNDADOR + grupo VIP no APOIE — ✅ NO AR (27/07, aprovado em mockup):**
   - Lenda 👑 agora anuncia: **grupo privado no WhatsApp** (galera do online + Diego criador) e **os 100 primeiros Lendas = FUNDADORES** (selo 🖋️ eterno do lado do 👑 → "Nome 👑🖋️" + mural "Fundadores do Leilão Legends"). Textos em: tela inicial do APOIE (box roxo "Só pra quem é Lenda"), fileira/expandido do ouro na tela de cores, escadinha do Manual e box do Batismo. Clareza de cor por tier (💎/⭐ dizem "nome, elenco, estádio — todos os modos"; ouro só "dourada em todos os modos").
   - **Contador de vagas é MANUAL**: const `FUNDADOR_VAGAS` em `screens.tsx` (começou em 77). Cada Lenda confirmado no Instagram → baixar 1 aqui.
   - ✅ **Grants de FUNDADOR ativos (28/07, apoio.tsx: FOUNDERS ouro + FUNDADOR_N)**: nº 3 cesar.verissimo27@gmail.com · nº 9 dasilva1227br@gmail.com · nº 11 davisantana1312@gmail.com · nº 12 ambielvictor@gmail.com · nº 13 denilson.stifler10@gmail.com (número 13 foi ESCOLHIDO pela sessão — Diego não informou; se ele corrigir, trocar no FUNDADOR_N) — selo 🖋️ gruda no 👑 via apoioSelo/apoioName. Prata (Craque) avulsos: victorreservauso@gmail.com · venturakaua2@gmail.com. Grant novo = 2 linhas nesses dois mapas.
   - **FALTA (combinado, ainda não feito):** (a) mural "Fundadores do Leilão Legends" dentro do jogo (tela/lista); (b) mecanismo de GRANT do selo 🖋️ (hoje: quando o Diego confirmar um fundador, a sessão adiciona o 🖋️ junto do selo 👑 no nome — perkFromSelo continua achando o 👑, então a cor/tier não quebra); (c) criar o grupo real no WhatsApp (Diego cria, link fica com ele — o jogo só anuncia); (d) stories futuros: um SÓ do fundador (Diego pediu pra depois).
   - Artes prontas: mockup APOIE (artifact d08cedfd) · stories em VÍDEO MP4 1080×1920 sem preço (Lenda completo + Fundador 77 vagas) — enviados no chat de 27/07.
8b. 🃏 **2º lote de cartas do Diego — ✅ NO AR (30/07):** +16 cartas novas. **BR:** Edinho (goleiro filho do Pelé, Santos), Leandro Ávila (Botafogo 95), Vinícius Pacheco (Paraná), Gonzalo Plata (Flamengo), Vitor Roque (Barcelona)=foi profissional. **EU:** Luca Zidane (goleiro filho do Zidane, foi prof.), Federico Valverde (craque), Çalhanoğlu (craque), Arda Güler (promessa), Brahim Díaz (bom jog.), Ben Arfa (craque folk), Roque Santa Cruz (bom jog.). **WORLD:** Papa Bouba Diop (bom jog. folk), Gilberto Mora (promessa), Carlos Vela (bom jog.), Hirving Lozano (bom jog.). **Ajuste:** Vitor Roque (Athletico-PR) virou promessa (par com a carta do Barcelona). **JÁ EXISTIAM (não dupliquei):** Zamorano, Recoba, Marcelo Salas, Son Heung-min, Makélélé (Chelsea), Fábio Baiano, Carlos Germano, Hélton. Cada carta = 1 linha em `data.ts`, revertível.
8. 🃏 **Cartas novas do Diego (reais + folclóricos) — ✅ NO AR (30/07):** 19 cartas nos 3 baralhos (BR/EU/WORLD) + Leynny. **ESCALA OFICIAL DO DIEGO (gravar): fame 1=foi profissional · 2=bom jogador · 3=promessa · 4=craque · 5=lenda; folclórico é marca à parte (`folk`), pode estar em qualquer categoria.** Ajustes 30/07: James Rodríguez (SP)=bom jogador (2) e removida a carta DUPLICADA (já existia no baralho); Loide Augusto (Vasco)=foi profissional (1, topo da faixa); Fabrício/Douglas Barriga de Cadela/Valdir Papel/Leynny=foi profissional (1); Sérginho/Javi Varas(folk)/Sugawara=bom jogador (2); craques (Doku/Koke/Marcos Senna/Kagawa/Caicedo/Kubo)=4. **A CONFIRMAR com o Diego:** Kubo ficou craque (4) — ele pode querer promessa (3). Cada carta é 1 linha em `data.ts` (revertível fácil).

## 🎴 Carta do campeão (visibilidade + garantia) — EM ANDAMENTO (30/07)
Diego: "muita gente diz que às vezes NÃO CONTA ou NÃO APARECE" a carta do campeão. Quer o banner **na cara** na hora que ganha, 1 toque pra abrir (mais suspense), e **conta mesmo sem abrir/sair**. **Regra nova (importante): a carta é PRIVADA do campeão** — cada um só vê a SUA; amigo ganhou não muda nada na minha tela (CPU e online). Vale campeão de QUALQUER série (A·B·C·D), Copa Legends, **Copa do Mundo** e qualquer copa/liga NOVA. **Sempre só o vencedor.** **Mockup APROVADO** (artifact "Mockup — Carta do Campeão (banner na cara)", favicon 🎁).
- ✅ **"Conta mesmo sem abrir" (FEITO, commit eca786c):** `CardCollectPrompt` (screens.tsx) grava a carta na conta ASSIM QUE o campeão cai na tela (sorteia + `persist` resiliente), antes de qualquer toque. Abrir vira só a cerimônia. Idempotente pelo `season_key`. Na carreira online (careeronline.tsx, escolher do elenco) adicionei guardião de SAÍDA: sair sem escolher grava uma do time. Isso conserta o "não conta" e boa parte do "não aparece [no álbum depois]" (que era save perdido por rede/saída).
- ✅ **Copa do Mundo agora dá carta (FEITO, commit b9803fd):** antes só dava estrela no mural; agora o campeão do mundo ganha a carta surpresa (privada, mesma garantia). `CardCollectPrompt` na cerimônia de `copa-mundo.tsx` (`you` virou opcional no componente). seasonKey `copamundo:seed:temporada`.
- ✅ **Privacidade já estava certa no modo normal:** só o campeão renderiza `CardCollectPrompt` (`youWon`/`copaChampIsYou`); o `StreamSpectatorCard` (sala vê a carta) é EXCLUSIVO do modo STREAM (broadcast proposital). Ninguém mais vê no CPU/online comum.
- ✅ **"Pular NA CARA" (popup, FEITO — commit 7beadc7):** `CardCollectPrompt` virou POPUP por cima da tela (portal, fundo escurecido, entra com pop) na hora do título. Diego escolheu **"toca fora e segue"**: tocar fora / no ✕ fecha e segue o jogo na hora; fechou vira pílula "🎁 Ver a carta do campeão" pra reabrir. A carta já está gravada (não depende de abrir). Vale nos sites que usam `CardCollectPrompt`: fim de temporada do rápido (liga+copa), carreira pirâmide (divisão+Copa Legends), Copa do Mundo.
- ✅ **Trava online SOLTA (FEITO — commit 7beadc7):** `awaitingCard = false`. Como a carta é garantida na hora, a sala não espera mais o campeão abrir. "Amigo ganhou não trava ninguém" (decisão do Diego).
- 🔜 **Falta afinar/rever:** (a) `careeronline.tsx` (carreira online legado, escolher-do-elenco) ganhou a garantia de gravar, mas ainda NÃO virou popup — decidir se entra no mesmo popup ou fica inline. (b) Se ganhar liga E copa na mesma temporada = 2 popups empilhados (raro) — ver se incomoda. (c) Testar com conta real: campeão vê o popup, fecha, carta no álbum; amigo não vê nada.

## 💾 Save de carreira (integridade) — EM ANDAMENTO (30/07)
- ✅ **Bug Felipe (perdeu tudo):** celular limpou os dados → gravava carreira zerada por cima do backup. **CONSERTADO**: `savePyramidCloud` agora LÊ a nuvem e JUNTA (`mergeCareers`), nunca sobrescreve o cheio com o vazio.
- ✅ **Bug Matheus (rollback 370→345):** em "conflito" a nuvem atrasada ganhava do local mais novo. **CONSERTADO**: ganha sempre a carreira MAIS AVANÇADA (maior `seasonNo`; empate = `at` mais novo). Removida a trava de versão (pyrCloudBaseIso). Apagar carreira usa `removeCareerFromCloud(seed)` (preciso, não ressuscita no merge). Commit isolado, reversível. **FALTA o Matheus testar e confirmar.**
- 🔜 **Felipe:** carreira antiga não recuperável (não está mais no backup); daqui pra frente não perde. Ver se Supabase tem backup antigo (chance baixa).
- ✅ **LOGIN OBRIGATÓRIO NA CARREIRA — FEITO (30/07, mockup aprovado):** `CareerLoginGate` (screens.tsx) — tela "Sua carreira mora na sua conta" (roxo/creme/Oswald) com Entrar/Criar conta (reusa GO_LOBBY_ONLINE → "esqueci a senha" vem junto). Gate `startCareer()` confere `getSession()` em TODA entrada de carreira (botão CARREIRA POR DIVISÕES, banner "Continuar", lista trocar-save, nova carreira, e o SoloContinueBanner secundário). Sem login/sessão caída → mostra a tela; dá pra voltar pra home (✕). Partida rápida/leilão avulso seguem sem login. Save local não é apagado — sobe pra conta ao logar (merge). **FALTA testar com conta real.**
- 🔜 **PLANO base (decisão do Diego 30/07): LOGIN = a verdade.** Exigir login pra carreira (anônimo perde ao limpar navegador/trocar de navegador — é o buraco que sobra). Cuidado: NÃO quebrar quem já joga carreira local sem login (grandfather + subir o save ao logar). UI nova (tela de login na hora) = mockup primeiro. Regra mestra: a conta manda; multi-carreira/multi-aparelho já resolvido pelo merge (mais avançada por seed).

## ⚙️ Mecânica de carreira (formação / elenco / lesão) — 30/07
- ✅ **Troca de formação pelo MÍNIMO por posição (FEITO):** não exige mais 22 nem "teto". Troca pra qualquer formação que consiga preencher com jogadores REAIS e SEUS por posição; emprestado NÃO conta (volta na virada, nunca deixa sem jogador em campo); fake nunca entra. Aviso claro do que falta. (`CHANGE_FORMATION` store.tsx + UI pyramidseason).
- ✅ **Formação 4-5-1 (FEITO):** GOL1·LAT2·ZAG2·MEI5·ATA1. Troca TÁTICA na carreira (precisa de 5 meias) — INÍCIO segue só 4-3-3/4-4-2 (base do leilão; seletor do setup fixado). Motor/campo/escalação dirigidos pela formação (se adaptam sozinhos). **FALTA:** olhar o campo do 4-5-1 no olho (5 meias na linha) e testar troca com save real.
- ✅ **Aviso de VENDA de reserva (FEITO):** a tela "Listar pra leilão" ganhou banner vermelho + texto que abre com a PERDA, badge "🔴 N à venda", jogador listado fica vermelho "🔴 À VENDA (tirar)". Trava de venda conta só jogadores SEUS por posição (emprestado não conta — fechou o furo). O jogo nunca tira ninguém sem a pessoa listar de propósito.
- ✅ **Goleiro não é mais artilheiro (FEITO):** peso de gol do GOL zerado (só Chilavert/Ceni levam 0.05 de brincadeira) — em `pyramidseason.tsx` e `store.tsx`.
- ✅ **Fim da "temporada idêntica" (FEITO, 30/07):** a carreira ONLINE mantinha a MESMA semente entre temporadas → todo ano a mesma goleada, contra o mesmo time, na rodada 1. Corrigido em 2 camadas: (1) `seasonSeed = seed ^ seasonNo` → RESULTADOS variam a cada temporada; (2) rodízio de calendário (embaralha qual time ocupa cada vaga do round-robin pela semente da temporada) → o ADVERSÁRIO de cada rodada muda a cada ano. Determinístico (mesmo calendário/placar em todos os aparelhos no online). Solo já variava (re-sorteia a semente). Copa já variava (`seed ^ seasonNo`, linha 227). Commits isolados/revertíveis (0ce2547 + 92fc05c). Elenco de CPU segue estável entre temporadas de propósito (memória de mercado — não é bug).
- 🔜 **LESÃO (a bolar depois, decisão do Diego): regra-mestra de segurança = só lesiona se tiver RESERVA de verdade na posição** (real na posição > o que a formação usa) → banco cobre, nunca fica furado. Raro, 1-3 rodadas, substituto automático, cura sozinho, aviso sem spoiler. Empréstimo pode servir de reserva na temporada.

## 🚫 Auditoria de SPOILER / previsibilidade (pedido do Diego 30/07 — "está tudo escrito antes de jogar")
- ✅ **Artilharia da COPA LEGENDS vazava (FEITO, print do Diego — Temp. 4, oitavas rolando, Neymar já com 9 gols):** o mata-mata é pré-calculado inteiro, mas a artilharia somava TODAS as fases (quartas/semi/final que nem rolaram na tela). Agora conta só as fases JÁ APITADAS (`copaScorersShown` reconstruído dos gols revelados por fase): oitavas rolando → artilharia da Copa vazia (mostra a do campeonato); a cada fase que fecha, entram os gols dela; no fim, tudo. Commit c64e617, isolado/revertível.
- ✅ **Varredura do resto do reveal (auditado, JÁ estava certo):** liga usa `shown`=`revealed` (tabela e artilharia só até a rodada apitada); chave da Copa Legends fatia por `reveal` (`copaFinished ? n : copaRound`); Copa do Mundo (`copa-mundo.tsx`) grupos por `shownRounds`, mata-mata ao vivo, artilharia só na cerimônia. Só `live.matches` (o jogo que anima na tela agora) usa o resultado completo — é intencional (é o placar rolando).
- ✅ **SPOILER dos PÊNALTIS (FEITO 30/07, commit b060f25 — print do Diego):** a disputa de pênaltis mostrava "✅ Fulano avança" + riscava o perdedor NA HORA do apito, antes das cobranças animarem. Corrigido: `CopaLiveMatch` (Copa Legends) e `tieRow`/final (Copa do Mundo) seguram o "avança"/placar dos pênaltis até `pensRevealDelay` (última cobrança na tela). A Copa dos 8 do rápido já fazia certo (modelo). **A auditoria anterior tinha PASSADO BATIDO nos pênaltis — lição: conferir todo reveal de mata-mata, não só tabela/artilharia.**
- ✅ **Auditoria independente do MOTOR (30/07, "joguei" 5+ temporadas via SSR):** tabelas íntegras (pts=3V+E, 38 jogos, GF=GA), Copa consistente (pênalti só em empate, chave 8→4→2→1, sempre campeão), determinístico (online seguro), goleiro não marca (só Ceni). **Conclusão: o motor/lógica está limpo; os erros que o Diego vinha sentindo são todos da família "tela revela antes da animação" (spoiler) — goleada idêntica, artilharia da Copa e pênaltis, os três já corrigidos.**
- ℹ️ **Tática/formação/substituição VALEM mesmo:** a simulação usa a tática e a escalação do humano por rodada (`tacAt`/`lineupAt` em `simDivTo`/`rollForm`) — não é enfeite. O que dava a sensação de "escrito" era o spoiler (ver o resultado antes) + a repetição idêntica entre temporadas — os dois já corrigidos.
- ✅ **AUDITORIA COMPLETA — TODOS os modos/ligas/copas (pedido do Diego 30/07, "ataque tudo"):** varri o reveal e a semente de cada modo. Achei **UM** spoiler real (artilharia da Copa Legends, já corrigido acima); todo o resto **já tinha trava**. Também rodei o motor REAL por 6 temporadas (SSR do Vite + Node) e confirmei por número: adversário da rodada 1 = 6 de 6 diferentes; campeão = 5 de 6 diferentes; goleiro não marca (só Rogério Ceni 1 gol, exceção proposital); artilharia da Copa cresce fase a fase (39→50→63→65).
  - **SPOILER por modo:** Carreira liga (segura com `revealed`) ✅ · Copa Legends chave (`reveal` fase a fase) ✅ · Copa Legends artilharia (era o furo → `copaScorersShown`) ✅ · Copa Legends campeão (só quando `finished`, ChampionsPanel gated) ✅ · Jogo rápido liga (`resultRevealed`/`holdResults`/`leagueBeforeResults`) ✅ · Copa dos 8 do rápido (jogada perna a perna, `qc.scorers` acumula no `PLAY_COPA_LEG`) ✅ · Copa do Mundo (grupos por `shownRounds`, mata-mata ao vivo, artilharia só na cerimônia) ✅ · Dinastia (mesmo motor round-a-round do rápido) ✅ · Basquete liga/playoffs (mesmo motor, "zero spoiler") ✅ · Giro/manchetes e aviso pessoal G4/Z4 (usam a posição EXIBIDA) ✅.
  - **PREVISIBILIDADE por modo:** Carreira online "mesmo time" (era semente fixa → corrigido: `seasonSeed` + rodízio de calendário) ✅ · Carreira solo (re-sorteia) ✅ · Jogo rápido/Dinastia (`redraftSeason` re-sorteia a semente e o baralho) ✅ · Copa Legends e Copa do Mundo (`seed ^ seasonNo`) ✅ · Basquete (`NEXT_NBA_SEASON` re-sorteia) ✅ · Online por sala (`hashCode(roomCode)`, revanche muda a semente) ✅. **Intencional (não é bug):** elenco dos times de CPU é estável entre temporadas (memória de mercado — quando sobe/desce leva o mesmo elenco).
- ✅ **2ª VARREDURA (31/07 — 5 frentes paralelas de auditoria de código; Diego mandou "arruma tudo menos o patrocínio + mais narração"). A 1ª auditoria tinha PASSADO BATIDO em spoilers de TEMPO/UI — corrigidos agora:**
  - **[ALTA] Spoiler na marcha LENTA (🐢) da carreira pirâmide:** o `revealed` (segura tabela/artilharia) usava `ROUND_MS` FIXO em vez de `ROUND_MS/velocidade` — no 🐢2×/4× a partida animava 15-30s mas a tabela/artilharia soltavam aos ~7,7s (jogo ainda no 24'-48'). Corrigido em `pyramidseason.tsx` (acompanha a velocidade, igual ao card e ao `endShown`). Lição de novo: **spoiler de TEMPO, não só de gate.**
  - **[ALTA] Leilão — vencedor VERDE antes do martelo:** a linha do maior lance entrava já verde em ~0s (martelo só em `hammerDelay`). Agora: lances revelam do MENOR pro MAIOR (casa com "pote crescente") e o verde só no `hammered` (martelo). `screens.tsx`.
  - **[MÉDIA] Artilharia da liga OFFLINE não segurava:** o total do artilheiro subia com o jogo animando (entregava gol do adversário). Novo `state.scorersPrev` (foto pré-rodada no `PLAY_ROUND`) + `hold` no `TopScorersBox`. `types.ts`/`store.tsx`/`screens.tsx`.
  - **[MÉDIA] Carta surpresa:** nome real estava no HTML (só borrado por CSS → lia no "inspecionar"). Trocado por placeholder mascarado. `screens.tsx`.
  - **[BAIXA-MÉDIA] "Giro" da carreira:** os outros jogos mostravam placar final na hora; agora ficam "🟢 em jogo" e revelam junto com o seu apito (`reveal` no `DivMatches`).
  - **[MÉDIA — bug de dado] Manchete do 17º dizia "escapou"** sendo que o 17º é REBAIXADO (caem 4). Séries A/B/C reescritas pra tom de queda. `jornal.tsx`.
  - **[MÉDIA — motor] Teto de 7 gols** no `poisson` (store + pyramid): jogo desigual não vira goleada irreal (8×0/9×0). **[BAIXA] goleiro não vira artilheiro** em elenco degenerado (total de peso 0 → não credita ninguém).
  - **NARRAÇÃO turbinada (pedido do Diego):** `LiveScoreCard` ganhou bancos variados de apito inicial (6), volta do intervalo (5), apito final (6) e selo de gol (GOOOL!/PINGOU!/NA REDE!/GOLAÇO!/ESTUFOU!... + variações de gol no fim) — determinístico por rodada/minuto (a sala vê o mesmo no online). "QUASE!" do leilão: 8→16 frases + 2º tempero (`revealIdx`). **NÃO reativei** `src/engine/commentary.ts` (52 narrações, mas CÓDIGO MORTO e com cadência de gol FIXA que o Diego odeia) — a variedade nova foi feita direto no card ao vivo.
  - **NÃO mexido de propósito (pedido do Diego):** logo de patrocínio repetido (Vadico) em `estadio.tsx` — ele quer manter.
  - **Buildado (tsc+vite OK). 4 commits isolados (pyramidseason · jornal · store+types · screens). Reversível.**

## ⚖️ Balanceamento / realismo da carreira pirâmide (31/07)
- **Análise a fundo com o MOTOR REAL** (SSR do Vite headless, centenas de temporadas simuladas — sonda de nível 60→88 em cada divisão + baseline). Veredito: **mérito e escada de dificuldade já estavam BONS** (melhor time fica na frente; D→C→B→A exige time melhor; Série A no talo = ~metade dos anos de título, corrida real). Os 2 furos reais eram **gol demais** (Série A 4,2/jogo, arcade) e **Série A com freguês** (lanterna ~12 pts; folga 1º-20º de 75, a elite era a MAIS bagunçada).
- ✅ **FEITO (só simulação da partida; NÃO tocou leilão, divisões nem dificuldade):** fórmula de gol **v3** — base/casa/peso-da-diferença menores + teto de qualidade 1.12. Resultado medido: Série A **4,2→3,1 gols/jogo**, lanterna **12→17 pts**, folga **75→66** (elite mais equilibrada); mérito/escada intactos (nível 88 = campeão da A em ~56% dos anos). **Travado por `simV`** (v3): temporada em andamento (simV<3) termina no modelo antigo, a próxima nasce no novo; carreira nova já nasce v3. Medido: **v2 byte-idêntico ao de hoje** (in-progress não muda). `pyramidseason.tsx` (GOAL_TUNE + gating) + `store.tsx` (simV 2→3). Reversível.
- ❌ **DESCARTADO com o Diego (não fazer):** "mundo evolui" (rival ganha força sozinho — briga com o leilão, que os bots já disputam) e "envelhecimento de elenco" — Diego não quis. Regra do leilão (quem vai, quantos) **NÃO se mexe**.
- 💤 **Na gaveta (ideia do Diego, é DIVERSÃO não balanceamento):** 👑 "peso da coroa" — quando você é campeão, começam a pintar **machucado / expulsão / zoeira** (Romário pulou o muro, Edmundo faltou o treino…), **mas só se tiver reserva na posição** (senão nem aparece o banner — profundidade importa, nunca deixa o time quebrado). Conteúdo em 2 camadas: banco genérico (serve pra todos) + pérolas folclóricas (`folk`) pingadas aos poucos. Fazer mockup do banner antes. Não decidido — quando o Diego quiser.

## 🏀 BidLegends
- Conceito completo: `docs/conceito-basquete.md` (pirâmide, 82 jogos, conferências, elenco 15, domínio bidlegendsarena.com).
- **Fase 1 — ✅ NO AR (fundida na main 26/07, aprovada pelo Diego):**
  - `src/escalacao/sport.ts` — detecção de esporte (hostname + override `?sport=` de teste) e **trava por conta**: basquete SÓ aparece pra `diego.c.fonseca@gmail.com` (regra do Diego 26/07: nada de basquete visível pra ninguém ainda). Pra todo o resto o app é idêntico ao futebol de hoje.
  - Seletor ⚽/🏀 no topo da home (só pro Diego) + home do BidLegends "chegando" (mesma cara, conteúdo de basquete) em `screens.tsx` (`SportTabs`, `BidLegendsHome`). Título da aba vira "BidLegends" só pra ele.
  - 🌐 **Bilíngue BR/EN**: `src/escalacao/lang.ts` (`useT()`) + botão `LangToggle` no canto direito do header do BidLegends. TODO texto novo do basquete daqui pra frente NASCE em PT+EN. Futebol NÃO se traduz.
- **Baralho NBA — 243 cartas (`src/escalacao/data-basquete.ts`), crescendo:** 5 posições (PG 52/SG 48/SF 46/PF 46/C 50), bio bilíngue PT+EN. Mistura de tiers + folclóricos/busts/brasileiros. Regras: SÓ quem jogou NBA; apelido no nome só nos marcantes. Formato espelha o `data.ts` do futebol (motor pluga direto). Prévia gerável por `scratchpad/gen-deck-preview.mjs`.
  - ✅ **Lote HOF (27/07):** +37 lendas do Hall da Fama das ERAS ANTIGAS (Oscar Robertson, Jerry West, Elgin Baylor, Havlicek, Mikan, Pettit, Cousy, Frazier, Drexler, Elvin Hayes, Nate Thurmond, McAdoo, Gilmore, English, Dantley, Bernard King, Mullin, Earl "The Pearl" Monroe, Chauncey Billups…).
  - ✅ **Lote HOF 2 — variedade (27/07):** +44 cartas VARIANDO posições E categorias (pedido do Diego): craques/modernos (SGA, Jalen Brunson, Jrue, Siakam, Randle, Sabonis, Dražen Petrović HOF), sextos-homens (Lou Williams, Kukoč, Vinnie "Microwave" Johnson), promessas (Haliburton, Franz Wagner, Paolo Banchero, Chet Holmgren), folclóricos/memes (LaMelo, VanVleet, Ben Simmons, Aaron Gordon, Kurt Rambis, Steve Francis), busts fame 1 (Anthony Bennett, Sam Bowie, Olowokandi, Thabeet), gigantes fofos (Tacko Fall) e brasileiro (Raul Neto). Agora ~48/posição → 20 times enchem quase 100% com jogador real.
  - **FALTA no baralho:** dá pra continuar (HOFers nichados + mais modernos/folclóricos) — o Diego curte engordar sempre.
- **🚨 DIREÇÃO (decisão firme do Diego 27/07): basquete = MESMO MOTOR do futebol, IDÊNTICO.** Nada de módulo/tela separada. Mesmas telas, botões, cores, fluxo (envelope→lacrar→martelo→cerimônia→temporada). Quem sai do futebol tem que entender o basquete NA HORA. Só muda o CONTEÚDO: cartas NBA, rótulo das posições (armador no lugar de goleiro), cesta no lugar de gol. Futebol fica EXATAMENTE igual (mesmo código, valores do futebol intactos; testar antes/depois; commit isolado revertível).
  - ✅ Baralho no formato do motor: `basquete-deck.ts` (`buildNbaDeck`/`buildNbaCatalog`), mapeando PG→GOL·SG→LAT·SF→ZAG·PF→MEI·C→ATA. `sportcfg.ts` = rótulos por esporte + vagas por modo.
  - ✅ **Motor sport-aware** (`store.tsx`, guardado por `ACTIVE_SPORT`, futebol byte-idêntico): `setActiveSport`, `slotsOf`/`makeBotSquad` via `baseSlots`, ação `START_NBA` (jogo rápido = 1 vaga/posição = quinteto 5, rivais = franquias NBA), `EscState.sport`.
  - ✅ **Pregão do basquete JOGÁVEL** (mesmo motor/telas do futebol): botão "Partida Rápida" na home do BidLegends → pregão cego → martelo → cerimônia. Rótulos PG/SG/SF/PF/C (`posTag`/`secLabel`), sem campinho de futebol, sem formação.
  - ✅ **QUADRA** (`NbaCourt`, aprovada pelo Diego: madeira, garrafão laranja, logo BidLegends no centro) no lugar do campinho — só no basquete, anti-spoiler reusado.
  - ✅ **Bilíngue**: textos do pregão em PT+EN (helper `L` no Envelope/RivalsStrip; futebol sempre PT).
  - ✅ **Fim coerente**: cerimônia do basquete → "Quinteto fechado! Temporada chegando" → home (NÃO cai na temporada de futebol).
  - ✅ **TEMPORADA de basquete de verdade** (rápido offline): `simMatch` com placar de PONTOS (~100, sem empate/prorrogação), `buildLeague` com franquias NBA (`NBA_CLUBS`), CESTINHA/Pontos/SC (não artilharia/gols/SG), táticas Defesa/Equilíbrio/Run-and-gun, notícias adaptadas (atropelou/pontos), `LiveScoreCard` com placar subindo até o total + selo 🏀 CESTA (via prop `basket`, só basquete). TODAS as mudanças guardadas por `sport==='basquete'` → futebol byte-idêntico (verificado no diff + setup/intro do futebol limpos).
  - ✅ **STREET LEAGUE JOGÁVEL (carreira — a base da pirâmide, 27/07):** botão "🛝 CARREIRA · STREET LEAGUE" na home do BidLegends → `START_NBA_CAREER`: liga cheia de **20 times** (CREWS DE RUA/streetball — `NBA_STREET_TEAMS`, NÃO franquias NBA, essas ficam pro topo da pirâmide; espelha a Série D de várzea do futebol), **rotação de 10** (2/posição via `setActiveSport('basquete','career')`), **100 moedas** (`NBA_CAREER_BUDGET`), pontos corridos no motor atual. Aprovado pelo Diego (print) e NO AR.
    - ✅ **Fillers/incógnitas por esporte** (`makeIncognita` com flag `nba`, `fillerCard` via `ACTIVE_SPORT`, helper `isFillerClub`): no basquete viram lendas de STREETBALL em quadras REAIS (Rucker Park, Barry Farm, Tri-State…), NUNCA mais jogador de futebol vazando. Futebol byte-idêntico (guardas caem no caminho de sempre).
    - ✅ Dica do pregão diferencia rápido (5 vagas/50 moedas) de carreira (10 vagas/100).
  - ✅ **Temporada REALISTA (27/07):** 82 jogos (não 38 — `buildFixtures` concatena turnos-returno até 82 só no basquete; ritmo do autoplay dinâmico p/ caber em ~3min). Tabela por **V-D + aproveitamento %** (sem "P"/pontos de futebol nem "E"/empate). Cestinha por **MÉDIA (ppg)** com total ao lado. **Placar inteligente:** só a rotação (~9) pontua, decaimento de posto (astro ~28%), cestinha da liga ~30/jogo com variação — calibrado por simulação. Tudo guardado `sport==='basquete'`, futebol byte-idêntico.
  - ✅ **CARREIRA COMPLETA — CICLO NO AR (28/07, autocontida no basquete, `nbaCareer`/`nbaTier`; futebol e rápido INTOCADOS):**
    - Modelo aprovado: todo time começa com o **quinteto (5)**; só VOCÊ cresce **5→10 (T2)→15 (T3)** via `Manager.nbaSlots` (slotsOf no basquete usa nbaSlots; bots ficam no 5). Reservas MANTÊM o quinteto — leiloa só as vagas novas (`NEXT_NBA_SEASON` + `NbaCareerEndPanel`, botão "Próxima temporada").
    - ✅ **Reservas** (T2 5→10, T3 10→15): leilão só pras suas vagas, `buildDeck([you])`, orçamento `NBA_RESERVE_BUDGET`. ✅ **Vender** (T3+): `TOGGLE_NBA_RELEASE` dispensa reserva fraca (trava do quinteto: mín. 1 real/posição) → repõe no leilão. ✅ **Salvar/continuar**: autosave ISOLADO na chave `bl-nba-career` (não mexe no `esc-solo-career`), card "Carreira em andamento" na home, `RESUME_NBA_CAREER` + `useResumableNbaCareer`.
    - ✅ **Subir de liga** (`nbaTier` street→gleague→nba, `NBA_TIERS`): top 4 sobe um andar; você leva o elenco, adversários viram os do andar de cima (Street 20 crews → G League 24 afiliados reais → NBA 30 franquias). Ninguém cai. Aviso "🔼 SUBIU DE LIGA" no fim.
    - 🔨 **FALTA (refinamento dos andares de cima):** conferências Leste×Oeste + playoffs top-8 + Finals + anel (cartas de campeão) na G League/NBA · dificuldade crescente por andar (hoje mesmo nível) · NBA Cup.
      - 🗳️ **REGRAS DOS JOGOS DE MATA-MATA (lembrete firme do Diego 28/07) — os playoffs/Finals do basquete SÃO IGUAIS À COPA LEGENDS do futebol:** (1) **cronômetro rolando progressivo** — placar sobe ao vivo com o relógio (reusar `LiveScoreCard`/`COPA_LEG_MS`, o mesmo do futebol; o basquete já tem o relógio de 4 quartos na partida ao vivo); (2) **simulação INDEPENDENTE do usuário** — TODOS os jogos do chaveamento simulam (não só o seu), esteja você jogando a partida ou vendo a tabela; (3) **NUNCA SPOILER em liga NENHUMA** — tabela/artilharia/chaveamento/giro NÃO revelam resultado antes da animação/apito na tela (o basquete já herda o anti-spoiler do futebol: `holdResults`/`leagueBeforeResults`).
      - ✅ **PLAYOFFS NO AR (28/07, reusa a Copa dos 8):** copaMode='liga_copa' nos andares G League/NBA (street = só pontos corridos). Cronômetro ao vivo + tudo simula + zero spoiler (herdado). ✅ **CONFERÊNCIAS Leste × Oeste**: `seedQuickCopa(nba)` = top 4 de cada conferência (id par=Leste/ímpar=Oeste), cada conf é metade da chave → campeões se cruzam nas FINAIS pelo anel. Rótulos bilíngues (SEMIS/FINAIS DE CONF. → FINAIS). **FALTA refino:** top 8 por conf (hoje 4) · séries melhor-de (hoje ida-volta agregada) · standings split por conf na tela · dificuldade já cresce por andar (Street 0/G+3/NBA+6).
  - **FALTA além da carreira:** (a) online (rápido + carreira); (b) placar com relógio de 48min/4 quartos (a partida ao vivo já tem o de quartos; o resto reusa o de 90'); (c) i18n dos textos do MARTELO/cerimônia; (d) baralho pode engordar mais.
- **DNS do bidlegendsarena.com**: registrado na **Hostinger**, falta configurar. Host = GitHub Pages, que serve 1 domínio custom só (hoje leilaolegends.com via CNAME) → 2º domínio direto no Pages redireciona pro principal. Caminho limpo p/ dividir por hostname = Cloudflare grátis na frente (Fase 2+). Pra Fase 1 NÃO precisa do domínio: a trava é por conta, o Diego testa logado no leilaolegends.com.

---

## 🔧 ONLINE travando ("erro de host" / preso no "Enviando…") — CORRIGIDO (01/08)
**Sintoma (relato do Murriz FC, sala de 8):** todo convidado (menos o host) dava
"erro de host" já no 1º leilão (goleiro); só destravava dando F5, e a cada leilão
de novo; alguém entrou na sala e não apareceu pros outros.

**Causa RAIZ (confirmada no log do Realtime do Supabase):**
`UnprocessableEntity: "Payload size exceeds tenant limit" → Sent 422`. O host
manda o estado INTEIRO do jogo pros convidados a cada mudança + a cada 3s
(heartbeat). Esse estado chega a **~80 KB** (baralho + elencos + monte + bios) e
**estoura o limite de tamanho de mensagem** do Supabase Realtime → a mensagem é
**descartada em silêncio** → o convidado nunca recebe a confirmação → trava no
"Enviando…" e acende o "host caiu". F5 só pegava o estado atual uma vez.

**Correção (`src/escalacao/netpack.ts` + `store.tsx`):** o estado agora vai
**COMPRIMIDO** no fio (lz-string vendorizado, sem dependência nova no npm).
Medido: **82 KB → ~36 KB** (round-trip idêntico, testado). Empacota como
`{ z: <base64> }`; **nada é cortado** (deck, bios, troca de host, reconexão: tudo
igual). O recebedor aceita os dois formatos (comprimido e cru) pra não quebrar na
janela de deploy; pacote corrompido é ignorado (heartbeat conserta em ~3s). Cache
por identidade evita reempacotar o mesmo estado. Futebol/solo/offline intactos
(só mexeu no broadcast do evento 'state' do online). **Revertível** (1 commit).
- ⚠️ Depois do deploy, quem estava no meio de uma sala precisa dar **F5 uma vez**
  pra carregar o código novo (host E convidados). Salas novas já nascem certas.
- 💡 Rede de segurança do lado do servidor (opcional, não feito): dá pra **subir o
  teto de payload do Realtime** no painel do Supabase — protegeria até clientes em
  cache antigo. Confirmar plano.

---

## ⚖️ JUSTIÇA DA CARREIRA — escada menos injusta (01/08)
**Problema (medido, time de lendas + forte + médio, 150 temporadas/série):** o
"bônus escondido" que os bots ganhavam por divisão era altíssimo
(`CPU_DIV_BOOST {A:6,B:9,C:12,D:2}`) — e o humano/rivais NÃO ganham. Resultado:
só time de LENDA competia na Série A (10% título), time FORTE (80) era rebaixado
94% na A / 93% na B, e time MÉDIO (68) ganhava a D e era **rebaixado da C em 99%**
→ ioiô eterno ("campeão num dia, rebaixado no outro"). O bônus ainda era torto
(C ganhava +12, mais que a A). Detalhe importante: esse bônus é somado IGUAL a
todos os bots, então nem deixava as divisões de CPU mais disputadas entre si — só
segurava o jogador (handicap invisível).
**Ajuste (aprovado pelo Diego = 2/3/4/2):** `CPU_DIV_BOOST_FAIR {A:2,B:3,C:4,D:2}`,
travado por **simV>=4** (temporada em andamento termina na escada antiga; a
próxima já entra na nova). Agora o NÍVEL REAL do time manda: lendas brigam/ganham
a A (27% título, 71% acesso, ~nunca rebaixa), forte é dono da C e briga na B,
médio ganha a D e precisa reforçar pra firmar. A sorte NÃO foi mexida (testado:
quase não muda — o vilão era o bônus). Só a simulação da carreira (solo+online);
leilão, online e futebol ao vivo intactos. `computeCopa` não usa esse bônus (Copa
inalterada). **Revertível** (1 commit).
- PRÓXIMO passo combinado: leilão mais esperto pra bots+rivais (valorizar
  lenda/craque) pra o desafio vir de adversário forte de verdade; e "real na
  frente de fake" (bot compra sobra pra tirar perna-de-pau do banco). Medir antes.

---

## 🧹 Bug "dois Van der Sar" no leilão — CORRIGIDO (01/08)
**Relato do Diego:** no leilão apareceu o MESMO jogador (Van der Sar) duas vezes —
um num time (com dono) e outro solto, como se fosse uma "sobra". Só existe 1 Van
der Sar no baralho, então é duplicata de verdade.
**Investigação:** a trava anti-duplicata (por nome+clube, `ident`) é minuciosa em
todas as fontes (mercado/listados/sobras/fichas). Rodei 6 temporadas de carreira
solo (com o mercado das fichas ativo) e NÃO reproduzi — indício de que a cópia
escapa num caso específico (online, "novo pregão", ou um SAVE ANTIGO que já
carregava a duplicata de uma versão anterior).
**Correção (universal):** `dedupeDeck` — uma peneira final que roda no ARRANQUE de
todo leilão (1ª posição, antes de distribuir), tirando qualquer jogador real
repetido do baralho (mantém o 1º; incógnitos/fake ficam, cada um é único).
Guardado por `sectorIdx===0 && sectorCursor===0` → roda 1x por leilão. Pega TODOS
os casos, inclusive save antigo. Não importa por onde a cópia entrou, ela não
chega mais na tela. Testado (2 Van der Sar → 1, fakes preservados). Revertível.
- FALTA (se voltar a aparecer): achar a ORIGEM exata — provavelmente online ou o
  "novo pregão"/REAUCTION. A peneira já mata o sintoma pra todo mundo enquanto isso.

---

## 🥅 Categoria "Várzea" (Sem craques) no rápido ONLINE (02/08)
No criar-sala do **jogo rápido online**, quando o host escolhe o baralho **🇧🇷 Brasil**,
abre embaixo a **Categoria**: **Todos (padrão)** ou **🥅 Várzea (sem craques)**.
Várzea = leilão só com **Bom jogador (fame 2/3) + Foi profissional (fame 1)** — sem
lenda/craque/promessa. Todo mundo no mesmo nível (peladão).
- Medido: BR "sem craques" = **342 cartas**, enche os **20 times sem nenhum fake**.
- Implementação: `filterVarzea` + `setActiveCatalog(league, varzea)`; aplicado no
  `START_ONLINE` SÓ quando `!career && deck==='br' && varzea` (filtra o baralho pro
  leilão E os bots de uma vez), e **restaura o baralho cheio logo após montar**.
  Testado: várzea sem craque em lugar nenhum; normal segue com craque; baralho
  restaurado depois. Europa/Todos e a carreira NÃO têm a opção. Futebol offline e
  carreira intactos. Flag `varzea` viaja na sala (game_state) → host e convidados
  pegam igual. Marca "🥅" na lista de salas. Revertível.

## 🏷️ Auditoria de nível do baralho BR — craques presos na várzea (02/08)
O Diego reclamou que a Várzea tinha **craque de verdade** (Zinho, Weverton,
Veiga…) marcado como "bom jogador" → apareciam no peladão. Auditei as 340 cartas
do pool (BR, fame ≤ 3). **40 correções** aprovadas pelo Diego:
- **Subiram pra CRAQUE (fame 4) → saíram da várzea (37):** Weverton, Leonardo,
  David Luiz, Lugano, Edmílson, Oscar, Zinho, Raphael Veiga, Mascherano,
  Zé Roberto, Gerson, Renato Augusto, Denílson, Giovanni, Hernanes, Depay,
  Everton Cebolinha, Müller, Amoroso, Guerrero, Félix, Maicon, Sorín, Belletti,
  Rafinha, Dedé, Gustavo Gómez, Everton Ribeiro, Fernandinho, Juninho Paulista,
  Pedro, Casagrande, Dudu, Grafite, Germán Cano, Serginho Chulapa, Calleri.
- **Folclórico mal avaliado (o selo 🃏 não é categoria — é PLUS):** Valdivia
  fame 2 → **craque** (sai da várzea); Dadá Maravilha e Vampeta fame 2 →
  **craque** também (o Diego pediu subir os três juntos — saíram do peladão).
  Selo folk mantido nos três.
- ⚠️ **Só mexi no `fame` (etiqueta/curadoria) — `lo/hi` (força de jogo) INTACTO**,
  então nenhuma partida muda de resultado; futebol ao vivo e carreira seguem
  iguais em equilíbrio. Só muda a etiqueta exibida e a raridade. Revertível
  (1 número por linha).
- Pool da várzea: 340 → **302 cartas** (ainda enche os 20 times sem fake).
- FALTA (se o Diego quiser depois): decidir se algum desses craques deve ficar
  mais FORTE (subir lo/hi) — hoje viraram craque mas jogam no mesmo nível de antes.

## ⚖️ Várzea online estava DESEQUILIBRADA (bots ganhavam fácil) (02/08)
Diego notou: no rápido online da várzea "todo mundo ficou muito longe de ganhar
dos bots". **Medi e confirmei a causa (2 assimetrias):**
1. O baralho do LEILÃO (o que o humano disputa) vinha com **27% de "foi
   profissional"** (cota `low` de 29%, pensada pra um baralho que TAMBÉM tinha
   lenda/craque compensando — na várzea não tem). Média do leilão caía pra **72.8**.
2. Os BOTS pegam elenco pronto filtrado por fame (médio = fame 2/3, forte = fame≥3),
   então **fugiam do "foi profissional"** (14/16 bots com ZERO perna-curta) e
   ficavam com média **74.0** — mais fortes que o time que o humano montava.
   Resultado: o humano pegava o refugo e ficava atrás. (No modo normal é o
   contrário: leilão 77.6 > bots 76.1, porque o humano compra craque/lenda.)
**Correção (v2 — o Diego corrigiu: NÃO é pra diminuir foi profissional; tem que
ser PARELHO entre bom jogador e foi profissional, e os bots seguem a regra de
força que o normal já usa — 9%/76%/15%).**
- Descoberta: 50/50 de verdade é IMPOSSÍVEL sem fake. O baralho BR só tem **74
  foi profissional** pra **226 bom jogador**; 20 times = 220 vagas → meio a meio
  pediria 110 perna-curta. Teto REAL sem inventar fake = **~1/3 foi profissional**.
- `buildDeck(..., varzea)`: cota de foi profissional (fame 1) na várzea = **33%**
  (era 29% no normal; a graça do modo pede mais perna-curta). Leilão = 33% foi
  prof / 67% bom jogador, média 72.1.
- `makeBotSquad(..., varzea)` / `dealBotSquads(..., varzea)`: mantém o rateio de
  força 9/76/15 (igual ao normal), mas cada tier carrega foi profissional na
  proporção parelha — forte 15%, médio 33%, fraco 60% (média ≈ 1/3, o teto real).
  Antes os bots FUGIAM da perna-curta (14/16 sem nenhuma); agora todos sentem a
  várzea (2.6 por time). Top dos bots caiu de 77-78 → 75-76.
- Placar: leilão 72.1 / bots 72.8 — parelho. E como no leilão o humano ESCOLHE
  (pega os bons, deixa a perna-curta pros bots), o time montado fica acima da
  média → dá pra brigar pelo título de igual pra igual. Modo normal, carreira e
  offline NÃO mudam (77.6/76.1). Só vale com `varzea` ligado. Revertível.
- FALTA (se o Diego quiser 50/50 mesmo): só criando cartas de foi profissional
  novas no baralho BR (mais nomes reais), pra ter estoque pra encher 20 times.
- ✅ **AJUSTE FINAL da várzea (02/08, aprovado + simulado):** sem adicionar cartas.
  - **LEILÃO dos usuários = 70/30 foi profissional** (pedido do Diego "deixe 70 a 30
    sendo mais foi profissional 70"): `buildDeck` cota `low` da várzea = **0.70**.
    Simulado (40 seeds × tamanhos de sala): 2–6 humanos = 69–74% foi prof; 8 = 62%;
    12 = 50% (sala grande esgota os ~74 foi-prof → completa com bom jogador, nunca
    fake). Baralho embaralha a cada leilão novo (semente nova no rematch) →
    variedade; só lembrar que foi-prof tem menos cartas (GOL 8) então repetem mais.
  - 🚫 **SEM FAKE (pedido explícito do Diego):** simulado 40 seeds × 6 tamanhos de
    sala = **0 fakes** em todos. Se acabar um tipo na posição, o bot completa com o
    OUTRO tipo REAL (bom jogador ↔ foi profissional) — a incógnita (`makeIncognita`)
    nunca dispara na várzea porque o pool real (foi+bom) sempre cobre a demanda.
  - **BOTS espalhados + fraco mais foi prof (opção 1 do Diego):** `dealBotSquads`
    monta os times FRACOS primeiro (o baralho BR só tem ~74 foi-prof pra 20 times →
    dando pros fracos antes, o perna-curta cai no time certo e o tier de força vale
    de verdade); `makeBotSquad` foiRate da várzea = fraco 0.55 · médio 0.40 · forte
    0.22. Simulado (4 e 2 humanos): **0 times sem foi profissional** (antes metade
    da liga ficava só com bom jogador), fracos ~68 de força, fortes ~74-76. Se um
    tipo acaba na posição, completa com o outro — nunca fake.
  - Modo PADRÃO 100% intocado (só `START_ONLINE` passa `varzea`; makeBotSquad/
    buildDeck/dealBotSquads têm branch `if (varzea)` — fora dela, idêntico). Revertível.
  - ✅ **EQUILÍBRIO da força dos bots (02/08, Diego perguntou "tá rivalizando ou muito
    fortes?"):** medido — com o alvo do `fillerAdj` em 74 (igual ao normal), na várzea
    o humano terminava **~14-16º** (bots fortes demais), porque o leilão 70% foi prof
    deixa o time do humano mais fraco (~71 vs ~76 do normal). Fix: `VARZEA_BASE = 69`
    em `cpuAdjFor` (só quando `s.varzea` no online) — puxa a média dos bots pra 69 →
    humano ~2 acima → briga pelo título (top 5-6 em sala de 2, top 2-4 em sala de 4,
    medido em 40 seeds). A `fillerAdj` aplica UM offset a todos os fillers, então a
    variação fraco/médio/forte (das cartas) continua — só desce a média. Normal (74)
    intocado. Revertível (1 número).
- ✅ **BUG "novo leilão perdia a várzea" (FEITO 02/08 — Diego relatou):** ao acabar
  o jogo da várzea online e a galera votar "novo leilão" pra continuar na MESMA sala,
  o leilão novo vinha em modo PADRÃO (com craque/lenda). RAIZ: o `startLeilao`
  (screens.tsx) montava o `START_ONLINE` do rematch passando só `deck: state.deckLeague`,
  **sem o `varzea`** → `onlineVarzea` caía em false. Fix: passa `varzea: state.varzea`
  junto (o estado já guarda a escolha da sala, e é sincronizado pros convidados). O
  "mesmo time" (REPLAY_SEASON) não monta baralho, então nunca teve o problema. Revertível.

## 🐛 Bug do 4-4-2 (faltava 1 meia / time com 10) — CORRIGIDO (02/08)
Amigo começou carreira no 4-4-2 e o time entrava com 10 (faltava 1 meia; o 4º
meia ficava no banco). CAUSA: em `pyramidseason.tsx` o `bestXI` e o `lineupAt`
usavam uma constante fixa `NEED` = 4-3-3 (`MEI:3, ATA:3`) pra montar o XI de TODO
mundo, ignorando a formação real do técnico. No 4-4-2 (4 MEI, 2 ATA) isso jogava
o 4º meia pro banco e tentava um 3º atacante que não existe → só 10 em campo.
CORREÇÃO: `bestXI(squad, formation)` e `lineupAt(..., formation)` passam a usar
`FORMATIONS[formation]`; a formação viaja no `SimTeam` (via `mk`/`buildPyramid`) e
nos dois pontos de exibição do Elenco e na simulação da partida. CPU de fundo
segue no padrão (montado 4-3-3), então nada muda pra eles. Vale pra 4-4-2 E 4-5-1.
Testado (4-4-2 → XI=11 com 4 meias). 4-3-3 intacto. Revertível.

## 🌍 Copa do Mundo começando na 110 em vez da 100 — CORRIGIDO (02/08)
A 1ª Copa do Mundo Legends abria só na temporada 110 (a âncora nascia 110).
Diego quer que comece na **100** e siga de 10 em 10 (100, 110, 120…). CORREÇÃO em
`copa-mundo.tsx`: `COPA_ANCHOR = 100`; saves que ainda NÃO jogaram nenhuma Copa
são realinhados pra 100 (o save antigo que nasceu com 110 se corrige sozinho);
quem já jogou uma edição mantém a agenda. Tela de "🔒 desbloqueia na 100"
aparece pra todo mundo abaixo da 100. Revertível.

## 🥅 Várzea online: bots MUITO difíceis + fakes + cartas novas (02/08 — Diego relatou)
Diego: no rápido online da várzea os bots estavam quase imbatíveis (no padrão a
dificuldade está "certinha"). MEDIDO: o leilão do usuário vinha **70% foi
profissional (nível 67.9)** e os bots só **~17% foi prof (nível 73.6)** → o time
do humano nascia **6 pontos mais fraco**. E ACHEI FAKES entrando nos bots (9 no
teste) — Diego proíbe fake.
**O que foi feito:**
- **+18 cartas reais de "foi profissional" (BR)** pedidas/aprovadas pelo Diego
  (auges reais, clube+ano, bio de auge; folk onde cabe). Total foi-prof: 74 → 92.
  GOL: Júlio César (Corinthians), Renan Ribeiro. LAT: China, Jorge. ZAG (array
  NOVOS_BR_ZAG novo): Erazo, Rafael Vaz, Lucão, Bressan. MEI: Lulinha, Renato
  Cajá, Camacho, Marlone, Giovanni Augusto, Rivaldinho. ATA: Léo Gamalho, Finazzi,
  Maxi Lopez, Paulinho Bóia. (Cortados por já existirem: Renato Abreu = craque no
  Fla; Carlos Alberto = já está pelo Flu.)
- **Equilíbrio:** cota de foi profissional do LEILÃO baixou de 0.70 → **0.40**
  (`buildDeck` várzea) pra bater com o nível dos bots. Medido: leilão 71.4 vs bots
  72.5 (gap 6 → 1); bots agora carregam foi-prof de verdade (3.3/time, era 1.9).
- **ZERO fakes** agora (medido em salas de 2/4/8 humanos) — as cartas novas + o %
  menor tiram a pressão que fazia o incógnito disparar.
- `VARZEA_BASE=69` mantido (calibrado por simulação, escala de "power").
- FALTA: Diego mandar clube/ano de 3 que ele pediu mas não achei o auge — **goleiro
  Saulo, lateral Gedeílson, Wellington Saci**. E PLAYTEST do Diego pra dizer se a
  dificuldade ficou boa (aí eu afino o VARZEA_BASE). Conforme entrar mais foi-prof,
  dá pra subir o % do leilão de volta rumo aos 70% que ele curte.

## 🗑️ Botão de excluir carreira "não fazia nada" — CORRIGIDO (02/08 — Diego relatou)
Amigo tentou apagar uma carreira no 🗑️ e não conseguia. CAUSA: o botão usava
`window.confirm(...)`, que é **bloqueado no navegador embutido do WhatsApp/
Instagram** (volta "cancelado" sozinho) — aí o apagar nunca rodava. É onde a
galera mais abre o jogo. CORREÇÃO: troquei por confirmação DENTRO do jogo (dois
toques): 1º toque no 🗑️ mostra "🗑️ Apagar" (vermelho) + ✕ cancelar; 2º toque
apaga. Vale na lista "Minhas Carreiras" (`MinhasCarreiras`) e no banner antigo
de carreira em andamento (`CareerContinueBanner`). Funciona em qualquer
navegador. Seeds das carreiras são únicos (não era colisão). Revertível.

## 🥅 Campinho: linha de defesa "quebrando" (lateral em cima do goleiro) — FEITO (02/08)
Diego (com print): no elenco/campinho (`ElencoField`, pyramidseason.tsx) alguns
times pareciam com "formação errada" — um lateral flutuando sozinho em cima do
goleiro. RAIZ: a linha de defesa do 4-3-3 tem 4 cartas (LAT-ZAG-ZAG-LAT) e o row
usava `flexWrap: wrap` → no celular a 4ª carta não cabia e pulava pra outra linha,
parecendo formação torta. A formação estava CERTA (3-3-4-1 no desenho = 4-3-3), era
só o layout. Fix: row com `flexWrap: nowrap` + cartas `flex: 1 1 0; minWidth: 0`
(encolhem pra caber lado a lado) — a linha de trás fica reta. Nome trunca com "…" se
faltar espaço. Só visual, revertível.

## 🏆 Hall da Fama campeão ERRADO + carta de campeão não aparece/não conta — DIAGNÓSTICO (02/08, Diego relatou)
Diego (2 prints): Cess FC foi campeão da liga (1º, 77 pts) e no aparelho dele aparece
campeão certo; mas no HALL DA FAMA (aparelho do host) mostra "Temporada 1: 🏆 Caue"
(que é só o 7º!). A Copa (Cess FC) está certa. E vários reclamam que a CARTA de campeão
não aparece e às vezes não conta no álbum/ranking.

**RAIZ ÚNICA encontrada (por código; não deu pra consultar o banco desta sessão —
aprovação do Supabase MCP só na outra sessão do Diego):** o **"novo leilão" reseta
`s.seasonNo = 1`** (`START_ONLINE`, store.tsx ~2994). Mas TRÊS coisas guardam por
**sala + nº da temporada**, e como a temporada volta a ser "1" a cada novo leilão na
MESMA sala, os registros de jogos diferentes se ATROPELAM:
1. **Hall da Fama (`game_champions`, chave room_id+season_no):** o campeão da "temporada
   1" de um jogo anterior (Caue) fica, e a regravação do novo (Cess) falha/atropela. Pior:
   a gravação é CRUA (`supabase...update`, screens.tsx ~4330) SEM retry → no navegador do
   WhatsApp falha fácil e fica o velho. (A ordenação da tabela é determinística — Caue com
   63 nunca seria table[0] sobre Cess com 77 — logo NÃO é cálculo, é registro atropelado.)
2. **Carta (`user_cards`, season_key = `${roomId}:${seasonNo}`, screens.tsx 6025/6054):**
   se já foi campeão da "temporada 1" nessa sala antes, o check acha o registro velho e
   não dá carta nova.
3. **Ranking (`esc_results`, mesmo season_key, `onConflict: user_id,season_key`,
   RankResultWriter ~5214/5231):** o upsert do jogo novo grava POR CIMA do antigo → título
   some ("não conta no ranking").

**FIX PROPOSTO (aguardando OK do Diego — mexe em como TODO campeão/carta/título é
gravado; risco alto de quebrar geral, então NÃO fiz blind):**
- Botar a "impressão digital" do jogo (o `s.seed`, que já é único por leilão =
  hashCode(roomCode+rematch)) nas chaves, pra jogos diferentes na mesma sala não
  colidirem. season_key online → algo curto tipo `on:${seed}:${seasonNo}` (⚠️ a coluna
  season_key tem limite ~48 — a outra sessão precisa confirmar o limite exato).
- Hall da Fama: distinguir por jogo (seed) — provavelmente precisa de uma coluninha
  `seed`/`game_id` em `game_champions` (migration) OU limpar os registros da sala no
  novo leilão. E tornar a gravação RESILIENTE (retry, como a `resilientWrite`).
- Conferir também o ângulo `youIdx` (identidade local): `champion: champ.id === you.id`
  usa `managers[youIdx]` — se o assento deslizou, o flag de campeão sai errado pra alguém.
**A outra sessão (com Supabase) deve confirmar:** (a) os registros de `game_champions`
dessa sala (pra ver o "Caue" atropelado); (b) o limite da coluna `season_key`. Aí dá
pra implementar certo e seguro.

### ✅ CONFIRMAÇÃO da sessão com Supabase (02/08) — responde o que faltava acima
Rodei as consultas de leitura no banco. Resultados:
- **Limite da coluna `season_key` (a dúvida acima): NÃO TEM.** Em `user_cards` E
  `esc_results` a coluna é **`text` (ilimitada)**. Então o FIX pode usar a chave
  INTEIRA com o seed (ex.: `on:${seed}:${seasonNo}`) sem medo de estourar/cortar.
- **Limpei 4 truncamentos legados `.slice(0, 48)`** (careeronline, CardCollectPrompt,
  2 na pirâmide) — eram inúteis (coluna é text) e a leitura da carta usava a chave
  inteira enquanto a escrita cortava (não batia). Agora chave inteira sempre. Só 1
  linha no banco tinha sido cortada, então era fragilidade latente, não o estrago.
- `game_champions`: sem BURACOS (3 em 4.131) — mas o bug é ATROPELO (update por
  cima), que não aparece como buraco. Bate com o diagnóstico do rematch acima.
- Ranking global (`esc_ranking`): agrupa por `user_id` (soma certo; o "Cess" tem 3
  nomes no mesmo cadastro = 148-149 títulos numa entrada só). Cess: 149 títulos ≈
  146 cartas.
- **CONCLUSÃO conjunta:** a RAIZ é o rematch resetando `seasonNo=1` + gravação por
  sala+temporada (diagnóstico da outra sessão). O fix é **botar o `seed` (único por
  jogo) nas chaves** de `game_champions` / `user_cards` / `esc_results`, com chave
  INTEIRA (a coluna aguenta) + gravação com retry. FALTA: OK do Diego pra implementar
  (mexe em como todo campeão/carta/título é gravado — risco alto, então não fiz blind).

### ✅ CONSERTO APLICADO (02/08) — "faça o que achar melhor" (Diego)
Implementado o fix do atropelo (rematch reseta seasonNo=1):
- **Cartas (`user_cards`) e Títulos (`esc_results`):** a season_key ONLINE agora
  inclui o **seed** (impressão digital do jogo): `${roomId}:${seed}:${seasonNo}`
  (e `:copa`). Vale no rápido (RankResultWriter + CardCollectPrompt liga/copa) e na
  carreira pirâmide (2 writers). Solo/dinastia já tinham o seed. Assim jogo novo e
  antigo na MESMA sala não colidem → título/carta não somem. Coluna é `text`, chave
  inteira, sem cortar.
- **Hall da Fama (`game_champions`):** a coluna `room_id` é `uuid` COM foreign key
  (aponta pra sala) — então NÃO dá pra botar chave composta ali (quebraria). Como o
  Hall da Fama é um placar VIVO da sala (não registro permanente), a correção certa
  era a GRAVAÇÃO com **retry (3x)**: o bug era o host gravar cru e falhar no
  navegador do WhatsApp, deixando o campeão de um jogo anterior. Com retry, a
  regravação vinga e o campeão certo aparece. (Sem migração, sem mexer no uuid/FK.)
- Tudo forward-safe (dados antigos ficam; jogos novos usam a chave nova). Buildado.
  Revertível.

## 📝 CONTRATOS na carreira — IMPLEMENTADO (02/08, mockup aprovado pelo Diego)
Sistema desenhado COM o Diego em longa conversa (+ simulações de 9.000 temporadas):
- **Todo jogador de humano/rival ganha contrato sorteado de 5-10 temporadas** ao
  chegar (atribuído na cerimônia — vale save antigo tb, ganha na próxima). Fake não.
- **Desbloqueia junto da folha (T4-T5):** como o menor contrato é 5, o primeiro
  vencimento cai no fim da T5 — a tela explica na primeira vez ("CONTRATOS
  CHEGARAM!"), e mostra "último ano" na anterior.
- **Venceu → tela de venda (reserveList):** renova **10 anos = valor oficial
  CHEIO** · **5 anos = METADE** · ou deixa ir → vai pro leilão com selo
  **⏳ SEM CONTRATO** e a venda tem **TETO no valor oficial** (o excedente "fica
  com a família gananciosa" — msg no resumo do mercado). Vender ANTES de vencer
  segue preço cheio. Listar manualmente um vencido também leva o selo (anti-furo).
- **Valor oficial** = max(livro de preços, paid, TABELA por categoria: lenda 30 ·
  craque 20 · promessa 12 · bom 8 · foi-prof 3) — mata a "renovação de graça"
  (piso de leilão nasce 1-2). `valorOficial()` exportado.
- **Prazo temperado:** renovação de 5 assina 4-6, de 10 assina 9-11 (preço igual)
  — sem isso os vencimentos re-alinhavam (simulado: até 13 juntos; agora máx ~5).
- **Trava do XI:** se a saída do vencido quebrar a formação (ou ele estiver
  emprestado na SAF), renova sozinho "NO APERTO" (5 anos, metade, pode ficar no
  vermelho — dívida já existe) com aviso no mercado. Ninguém fica sem time.
- **RIVAIS na mesma regra:** renovam com o clubCash (craque 85% · bom 60% ·
  fraco 35%, se a grana der), gastando verba que fazia falta no leilão. O MELHOR
  solto por posição entra no leilão com selo + zoeira ("Paixandu NÃO renovou
  fulano! 🍿"); o resto volta pro mundo em silêncio (sem inflar). Bots de fundo:
  o sorteio de famoso de sempre (sem mudança).
- **Comprou = contrato novo:** os 4 pontos de compra (leilão/desempate/monte/
  varredura de bot) limpam selo+prazo; a cerimônia sorteia 5-10 novo.
- Ações: `RENEW_CONTRACT {mgrId, cardId, anos:5|10}` (guest roteia pro host
  normal). UI: painel na reserveList (pyramidseason) + selo vermelho na carta do
  leilão (screens). Campos: `WonCard.contratoAte`, `Card.semContrato`.
- TESTADO headless (carreira solo até T7): atribuição ✓ renovação ✓ trava do XI
  ("renovou NO APERTO") ✓ rival soltando com zoeira ✓ selo no baralho ✓ recompra
  limpa contrato ✓. Rápido/várzea/dinastia intocados (tudo atrás de careerOnline).
- FALTA (combinado, próximos passos): mostrar "contrato até T__" na carta do
  Elenco; banner T4 dedicado (hoje a explicação aparece na 1ª tela de renovação);
  Diego fazer playtest de dificuldade/custos (tabela é 1 lugar só pra calibrar).

### 🔒 Ajuste (02/08, pedido do Diego): contratos SÓ pra carreira NOVA
Flag `contratosOn` no estado: nasce `true` só em START_CAREER_SOLO e START_ONLINE
com career. **Save antigo (sem a flag) fica exatamente como era** — sem atribuição,
sem renovação, sem vencidos no mercado (3 portões: cerimônia, leilão de reservas,
RENEW_CONTRACT). Testado: carreira nova com contratos ✓, save antigo intocado ✓.
## 🌍 Copa do Mundo: "seleção ??" com jogadores misturados + gate de escolha torto — FEITO (02/08)
Diego (print do Giovani Picolo): a convocação mostrava "CONVOCAÇÃO · ??" com jogadores
de países misturados (Frank de Boer, Pau Torres, Sugawara, Luisão...); e um usuário ~4º
do rank só conseguia escolher seleção do 6º pra baixo. RAIZ: em `paisDe` (paises.ts) as
cartas dos baralhos EU/MUNDO SEM etiqueta de país viram '??', e `rankingSelecoes` CONTAVA
o balde '??'. Como 32 cartas novas (adicionadas em sessões anteriores) não tinham país,
o '??' juntou 32 cartas e virou a **6ª "seleção"** do top 16 — com elenco de nacionalidades
misturadas, e empurrando as seleções reais pra baixo (por isso o gate `locked = i < myPos`,
que está CERTO, mostrava as reais em posições piores). **Fix:** (1) etiquetei os 32 com o
país real (Espanha: Pau Torres/Koke/Javi Varas/Marcos Senna; Holanda: de Boer/Obispo/Promes;
França: Mendy/Ben Arfa; Japão: Sugawara/Kagawa/Kubo; México: Vela/Lozano/Gilberto Mora;
Alemanha: Cacau/Rummenigge; etc. — alguns órfãos: Argélia/Luca Zidane, Marrocos/Brahim Díaz,
Congo/Kidiaba, Senegal/Bouba Diop, Turquia/Çalhanoğlu+Güler, África do Sul/Mudau). (2) `rankingSelecoes`
agora FILTRA '??' fora (segurança pra qualquer carta futura sem país). Resultado: **0 cartas
sem país**, top 16 limpo (Brasil…Coreia do Sul), gate alinhado (4º escolhe do 4º pra baixo).
Só dados (paises.ts), revertível. ⚠️ FALTA: rodar `scripts/checa-paises` a cada carta EU/MUNDO
nova pra nunca mais acumular '??' (o comentário "não importado pelo jogo" em paises.ts está
DESATUALIZADO — copa-mundo.tsx importa paisDe/rankingSelecoes).

## 🌍 Copa do Mundo: expandir 16 → 20 seleções quando +4 países fecharem 11 (pedido do Diego 02/08)
Hoje **16 países fecham um XI válido** (4-3-3 ou 4-4-2) → a Copa é top-16. O Diego quer
subir pra **20** quando MAIS 4 países conseguirem montar 11 (formação válida). **AVISAR O
DIEGO** quando isso acontecer. Medição atual (script scratchpad/copafield.mjs — G/L/Z/A/M
por posição; "falta" = jogadores pra fechar o XI):
- ✅ FECHAM (16): Brasil, Argentina, Espanha, França, Inglaterra, Holanda, Alemanha, Itália,
  Portugal, México, Bélgica, Uruguai, Colômbia, Chile, EUA, Coreia do Sul.
- ⏳ PRÓXIMOS: **Paraguai falta 4** (precisa de MEIAS — tem 0 meia! [G2 L1 Z3 M0 A3]) ·
  **Japão falta 4** [G0 L1 Z1 M3 A2] · Equador/Camarões/Senegal faltam 6 · Bolívia/Dinamarca/
  Suécia/Egito/Arábia Saudita faltam 7.
- Pra chegar aos 20: fechar Paraguai + Japão + 2 de {Equador, Camarões, Senegal}. A cada
  carta EU/MUNDO nova, rodar copafield.mjs e conferir se cruzou +4.
- QUANDO FOR HORA (o Diego autoriza subir pra 20): trocar `.slice(0, 16)` → `.slice(0, 20)`
  em `copa-mundo.tsx` (rankingSelecoes) e o `top16` em `pyramidseason.tsx` (~2492) pra pegar
  os 20 primeiros do rank de clubes. (1-2 números; hoje NÃO fazer — só 16 fecham.)

## 📖 Manual do Técnico + 🎙️ Narrador da 1ª partida — FEITOS (02/08, mockup aprovado)
Sugestão de usuário (via Diego): jogo confuso pra quem chega ("fui explicar pro
cunhado…"). Plano de 4 partes aprovado em mockup; as 2 primeiras publicadas:
1. **Manual do Técnico** (`ManualDoTecnico` em screens.tsx): overlay aberto por
   botão na home (abaixo da grade "como funciona"). Capítulo-mãe "Como funciona o
   LEILÃO" (envelope → revelação → martelo → monte, + desempate/nível oculto) e um
   card por modo SÓ com o que muda: ⚡ Rápido offline · 🌐 Rápido online (cita
   Várzea) · 🪜 Carreira. Dinastia/Carreira online/Liga Fechada FICAM DE FORA até
   liberar (decisão do Diego). PT-só (futebol).
2. **Narrador da 1ª partida** (`NarradorDica`): balão de dica com zoeira que
   aparece UMA vez por fase (envelope/revelação/monte) e some no "✅ Entendi";
   "pular todas as dicas" desliga geral. Guarda no aparelho (esc-dica-*/
   esc-dicas-off). SÓ futebol (basquete é bilíngue, ficou de fora por ora).
FALTAM (combinados): 3. **Respiro** — SÓ depois do Diego vetar/aprovar a lista
classificada de avisos (regra dura: aviso de REGRA DA JOGADA — ex. "2 vagas de
lateral", piso, saldo — NUNCA some; ensino contextual vira pílula após 2 vistas;
banner de novidade some após 1-2). 4. **Tema Noturno** — todas as telas, fundo
escurece e cartas/caixas seguem idênticas; claro NÃO muda 1 pixel (camada
opt-in). Cada parte em commit separado (reversíveis).

## 🧹 Respiro (parte 3 do plano) — FEITO (02/08, lista vetada pelo Diego)
Só os 2 avisos de ENSINO aprovados viram pílula, e com a régua que o Diego pediu:
**ficam INTEIROS nas primeiras 6 temporadas** em que aparecem (constante
`ENSINO_VEZES = 6` em pyramidseason.tsx — 1 número pra calibrar) e depois viram
pílula pequena que ABRE NO TOQUE (informação nunca é apagada):
- "💡 O que acontece ao listar" → pílula "ℹ️ como funciona a venda"
- "🔒 Não dá pra vender esses" → pílula "🔒 tem jogador travado (por quê?)"
Conta 1 vista por TEMPORADA (não por render; localStorage esc-ensino-*). TODOS os
avisos de regra da jogada (transfer ban, chip à venda, aviso "sai do time",
contratos, vagas/piso/saldo do leilão) INTOCADOS — a tela do leilão nem foi
tocada. FALTA (parte 4): 🌙 Tema Noturno (todas as telas; claro intocado).

### ✅ 4 seleções novas FECHADAS (02/08) — 20 países agora dão time
Adicionadas 62 cartas famosas (baralho MUNDO) → **Paraguai, Japão, Camarões, Senegal a 22 cada**.
Agora **20 seleções fecham XI válido** (verificado: rank + copafield). Faltava isso pra Copa de 20.
⚠️ PORÉM virar a Copa de 16→20 NÃO é 1 número: a chave (`copa-mundo.tsx`, CupScreen ~452) é
**4 grupos de 4 (6 rodadas ida-volta) → 8 melhores → QF/SF/final**. Pra 20 = **4 grupos de 5
(8 rodadas)** → top 2 de cada = 8 → mesmo mata-mata. Precisa: (a) `rankingSelecoes().slice(0,16)`
→ 20 (linha 188); (b) `top16`/entrants pra 20 clubes (pyramidseason ~2492 — hoje pega top 16 do
rank de clubes; virar 20); (c) montar grupos de 5 e fixtures de 8 rodadas; (d) trocar "Rodada X
de 6" → "de 8" e o groupTable(g,6)→8. Copa é LOCAL (localStorage, sem reducer) → risco baixo,
não toca futebol ao vivo. AGUARDANDO OK do Diego pra fazer a chave de 20.

## 🌙 Tema Noturno — NO AR, SÓ pra conta do Diego (03/08)
Parte 4 do plano (mockup + screenshots reais aprovados). "Estádio à noite":
camada CSS opt-in (classe `noturno` no html) — o PALCO escurece (Shell +
wrappers da carreira marcados `.palco`) e o texto direto nele clareia; CARTAS/
CAIXAS claras seguem IDÊNTICAS (cascata re-escurece o texto interno). Claro não
muda 1 pixel (sem a classe, o CSS nem existe). Botão na home ("🌙 Tema noturno")
+ escolha salva no aparelho + ?tema= na URL.
- 🔒 **Decisão do Diego: por enquanto SÓ a conta dele** (`TEMA_TESTERS` em
  sport.ts, mesmo padrão do basquete). Conta sem direito: botão nem aparece, e
  se o noturno estiver ligado por localStorage/URL é DESLIGADO quando o login
  resolve. **Futuro combinado: virar REGALIA DE PLANO PAGO** (trocar a trava de
  e-mail pra tier de apoio, 1 lugar só).
- ⚠️ Detalhe técnico pra próximas sessões: React serializa cores inline como
  rgb(...) — os seletores [style*=] do CSS noturno usam ESSA forma, não hex.
  Home verificada com screenshot real; telas internas usam os mesmos padrões —
  se escapar texto escuro num canto, é 1 linha de CSS (lista de containers).
### ✅ Copa do Mundo virou 20 seleções (02/08) — FEITO
Chave de 16→20: `copa-mundo.tsx` agora **4 grupos de 5, turno único (5 rodadas, 1 folga/rodada)
→ top 2 de cada = 8 → QF/SF/final** (mata-mata igual). Parametrizado: `NUM_GROUPS=4, GROUP_SIZE=5,
GROUP_ROUNDS=5, COPA_TEAMS=20` + helper `roundRobin()` + a máquina de passos agora usa `GR`
(=GROUP_ROUNDS) em vez de números fixos (grupos 1..GR · sorteio GR+1 · QF GR+2/GR+3 · SF GR+4/GR+5 ·
final GR+6 · fim GR+7). `rankingSelecoes().slice(0,20)` e o top-20 do rank de clubes (pyramidseason
~2510). Aviso de FOLGA (bye) na rodada que sua seleção descansa. Textos "TOP 16"→"TOP 20". Copa é
LOCAL (localStorage, sem reducer) → não toca futebol ao vivo/online. Simulado: 4×5, todos jogam 4x,
40 jogos de grupo. Build ok. Revertível.

## 🛟 Online: sala travada no "ENVIANDO…" na largada (Diego + Rocha, 02/08) — FEITO (03/08)
Sintoma (print do Diego): ele era o HOST, criou a sala, e na 1ª tela do leilão o
jogo travou no "ENVIANDO…" COM o banner "o host caiu" — no aparelho DO HOST. F5
resolvia pra sala toda. DIAGNÓSTICO: a leitura "sou host?" (game_rooms.host_id
=== user.id, lida na largada/reconexão) pode piscar errada (corrida na criação/
handoff de presença) → o dono se acha CONVIDADO → ninguém é host → os lances de
todo mundo vão pro nada e a sala congela até alguém recarregar (o F5 relê o banco
e conserta — por isso "voltava pra todo mundo").
FIX (2 defesas):
1. **Auto-cura**: o vigia de host (que já pedia estado a cada 2,5s) agora, quando
   fica >10s sem notícia, também confere no BANCO se o host da sala é o PRÓPRIO
   aparelho — se for, dispara BECOME_HOST e reassume o comando sozinho (o canal
   re-inscreve como host, heartbeat volta, sala destrava SEM F5). Fonte da
   verdade = game_rooms.host_id (não memória local — sem risco de host duplo).
2. **Aviso de recuperação** (pedido do Diego): o banner vermelho ganhou o botão
   "🔄 Travou? Atualiza a página — a partida continua de onde parou".
Revertível. Se voltar a acontecer, o print novo mostra se a auto-cura disparou.

## 🏛️ MULTICLUBES: caixas se misturando / premiação sumindo — 3 CONSERTOS (03/08, Diego relatou)
Usuários com 2º clube: prêmios contando só pra um, caixa "se misturando", extrato
incompleto. INVESTIGADO — 3 causas reais:
1. **A BOMBA (caixa "se mistura"/premiação some):** no FINISH_CEREMONY o troco do
   leilão era gravado na carteira de TODO humano — e o clube DORMINDO é humano mas
   NÃO joga o leilão, então a carteira dele era SOBRESCRITA com um `m.money` velho
   TODA temporada, apagando os prêmios ganhos dormindo. Fix: só grava quem jogou
   (`isHuman && !dormindo`). Testado: caixa do dormindo preservada (200→256→256;
   antes viraria 77).
2. **Extrato do dormindo vazio:** `logFin` agora ROTEIA lançamento cujo mgrId é o
   clube dormindo (s.multiClube.id) pro ledger DELE no stash — quando o dono troca
   de clube, o Extrato mostra tudo que rolou dormindo. E o resumo de fim de
   temporada (5 linhas) agora sai pros DOIS clubes (ids = [ativo, dormindo]).
3. **Dormindo não faturava patrocínio/empresário:** applySeasonMoney agora paga o
   patrocínio (pela divisão DELE) e a renda da agência DELE (cartas do stash +
   estádio dele + SAF compartilhada) na caixa DELE. Independência total.
O que É compartilhado POR DESENHO (não é bug): o ÁLBUM de cartas é da CONTA (mesmo
dono) e a SAF é uma só pros 2 clubes (decisão antiga do Diego). Prêmio de tabela/
título do dormindo já entrava certo (rewards por id) — só era apagado pela bomba 1.
Revertível (3 pontos).

## 🏛️ Multiclubes: Cerimônia abria no clube ERRADO — FEITO (03/08, print do Diego)
Após o leilão do 2º clube, a Cerimônia da Revelação abria mostrando o clube
ORIGINAL (ex.: Carecamburgo) em vez do que leiloou. CAUSA: a tela sempre abria no
time nº 0 da lista (na carreira normal você É o nº 0 — com o 2º clube no comando,
o nº 0 é o original dormindo). FIX: `EscCerimonia` abre no índice do SEU clube
ativo (youIdx) na lista filtrada. Navegar pelos outros times segue igual. Revertível.

## 🕴️ AGÊNCIA 2.0 (22 convocados do álbum) — FEITO (03/08, spec + mockups aprovados pelo Diego)
Reforma do empresário de cartas, SÓ CARREIRA SOLO NOVA (save antigo segue no
empresário clássico, nada muda). Decidido com o Diego nesta sessão:
- Convoca **até 22 cartas do ÁLBUM** (global da conta) pra "ativa" — só elas
  rendem. Mesma PESSOA só 1 vez (auges diferentes = 1 vaga). Cap 22 travado no
  motor (SET_AGENCIA). Convocação estilo COPA: filtro por posição + busca + selo
  do tier em cada nome. Troca quando quiser.
- **Mensalidade por categoria** (paga na virada): 👑 lenda **5** (≠ clássico 6,
  decisão do Diego) · ⭐ 4 · 💎 3 · 🎯 2 · 🪵 1 · carta **🃏 Folclórica +1** por
  cima. Desbloqueios = os MESMOS do estádio/SAF, e a tela deles CONTINUA em
  Clube › Agência (AgenciaDesbloqueios) — decisão do Diego.
- **Comissões por acontecimento** (+1 cada): 🥇 artilheiro de cada série + Copa;
  🏆 campeão em QUALQUER time (as 4 séries + Copa Legends, elenco do campeão);
  💸 negociado no leilão/monte (qualquer comprador — banner dourado no tempo
  morto do martelo, comissão paga NA HORA).
- **Renda 100% no 1º CLUBE** (agenciaClubeId = clube da fundação), mesmo se ele
  estiver DORMINDO no Multiclubes (cai na caixa dele + extrato do stash).
- UI: sub-aba **Elenco › 🕴️ Agenciados** (grade com cor do tier; toque abre a
  carta IGUAL álbum + "já te rendeu X"); fatura na **Cerimônia** (mensalidades +
  eventos + transações); extrato com 2 linhas 🕴️ (mensalidades / comissões).
- Motor testado headless (agenciatest.mjs): cap/dedupe, eventos idempotentes,
  virada pagando no clube 0, transações +1 na hora somando na fatura, folclórico
  +1, save antigo intacto (linha clássica 💼, sem 🕴️). Pegadinha corrigida: o
  leilão roda com seasonNo já virado → fatura carimbada com a temporada NOVA
  (senão a transação criava fatura vazia por cima e a Cerimônia perdia tudo).
Revertível: commit isolado; agenciaOn só nasce em carreira nova.
- 🔒 **TRAVA DE CONTA (03/08, pedido do Diego DEPOIS do deploy): Agência 2.0 por
  enquanto SÓ diego.c.fonseca@gmail.com** (AGENCIA_TESTERS em sport.ts, mesmo
  padrão do noturno/basquete). Carreira nova de conta comum nasce SEM a flag; e
  mesmo save com flag (criado na janela pública de ~2h) não mostra NADA pra
  conta comum — motor e telas checam agenciaLiberada(). Liberar geral = esvaziar
  a checagem num lugar só. ⚠️ O teste headless (agenciatest.mjs) agora precisa
  de mock do tester pra rodar (sem auth, gate=false).
### Combinados que FICARAM (não fazer sem OK):
- ✅ 📰 **Jornal página 2 "Caderno do Empresário" — FEITO (03/08, mockup v2 aprovado)**:
  capa 100% IGUAL a hoje (donos da temporada intactos — exigência do Diego) + vira
  SOZINHA após 5s (só 1x; bolinhas pra ir/voltar) pra página com as notícias dos
  agenciados — SÓ EMOÇÃO, SEM MOEDA (exigência do Diego): artilheiro/campeão da
  temporada + negociações do último mercado + "Palavra do empresário" (frase
  rotativa). Sem notícia ou save antigo = só a capa, como hoje (nem pager aparece).
- 🏦 **Divisão da renda entre os 2 clubes** (futuro): caixinha na sub-aba
  Agenciados, SÓ aparece com 2 clubes — tudo pro 1º / 50-50 / tudo pro 2º
  (mockup já mostrado). Por enquanto renda é 100% do 1º clube.
- 🎮 Futuro maior: jogos ONLINE usando as cartas do álbum (os 22 convocados são a
  base natural). Só ideia, sem spec.
- 📖 Manual do Técnico ainda não fala da Agência 2.0 — adicionar quando o Diego
  liberar a feature pro público (hoje só carreiras novas dele em teste? NÃO — já
  vale pra TODO MUNDO que criar carreira nova; visual aprovado).

## 🪜 ESCADA DE CATEGORIAS na carreira — FEITO Fase 1 (03/08, SÓ conta do Diego)
Ideia do Diego: divisão dita as categorias do leilão. Fase 1 (sem a divisão
Várzea real ainda — essa é a Fase 2, pendente, com mockup antes):
- D (estreia) = 🪵 foi-prof + 🎯 bom (baralho estilo Várzea, bots parejos) ·
  C = 🎯 bom + 💎 promessa · B = 💎 promessa + ⭐ craque · A = ⭐ craque + 👑 lenda.
- 🔓 LIBERA GERAL depois de **2 temporadas COMPLETAS jogadas na Série A**
  (decisão do Diego) — vira o jogo normal pra sempre (escadaLivre).
- 🔒 BANCO DE RESERVAS só destrava no **1º acesso** (sai da divisão de estreia);
  não tranca de novo se cair. Rivais/bots seguem a MESMA regra (deepSquad).
- Mercado secundário (sobras, contratos vencidos, venda de jogador existente)
  NÃO respeita a régua de propósito — palavras do Diego ("tem as sobras").
- Gate: ESCADA_TESTERS = mesma lista da agência (sport.ts). Carreira nova de
  conta comum nasce SEM escadaOn. Caixa informativa na tela de venda
  (ReserveListScreen) explica régua/banco/progresso 2-na-A.
- SIMULAÇÃO 40 temporadas ×2 (simescada.mjs no scratchpad, usa sportstub.js):
  régua 100% no baralho novo (0 fake, 0 furo), zoeira perfeita na estreia
  (Falcão do Futsal, Walter Gordinho...), sobe RÁPIDO (A na T4-T7, livre T6-T10)
  — se o Diego quiser arco mais longo, opções: mínimo de temporadas por degrau
  ou régua só sobe quando é CAMPEÃO. Dinheiro: harness sem vender jogador não
  chega na SAF 2000 em 40 temporadas (venda de jogador é o motor real de grana).
### Pendências da escada:
- Fase 2: divisão VÁRZEA real embaixo da D (20 times zoeiros, acesso) — mockup 1º.
- Decisão do Diego: manter subida livre (rápida) ou segurar o arco?
- Banco Legends (comprar moeda de verdade) segue parado aguardando ele.
## 🃏 AUDITORIA DOS BARALHOS (04/08) — feita
Analisadas as 1204 cartas (BR 516 · Europa 534 · Mundo 154). ZERO duplicado exato,
zero mesmo-nome+mesmo-clube, zero erro factual de clube/ano/posição encontrado (dataset
muito bem curado). Nomes repetidos (54) são de PROPÓSITO (auge BR + auge Europa do mesmo
craque). Único ajuste: PADRONIZAÇÃO de clubes escritos de 2 jeitos (mesmo clube virava
dois no álbum) — grafia por maioria: Manchester United→Man United, Manchester City→Man
City, Bayern München→Bayern, Borussia Dortmund→Dortmund, Bayer Leverkusen→Leverkusen,
Inter de Milão→Inter, FC Porto→Porto, Sporting CP→Sporting, Olympique Lyon→Lyon,
Olympique Marseille→Marseille, Leicester City→Leicester, Schalke 04→Schalke,
Pohang→Pohang Steelers, Suwon Bluewings→Suwon, Birmingham City→Birmingham (35 cartas).
Mantidos de propósito: Bernard (ATA-BR/MEI-EU) e Denílson (MEI-BR/ATA "Denílson Show"-EU)
= auges diferentes em países diferentes. Falsos-alarme (clubes DIFERENTES, não mexer):
América×América de Cali×América-RJ · Inter×Internacional · Sport×Sporting · Grêmio×
Grêmio Barueri · Bragantino×Red Bull Bragantino (renome de época).

## 🌍 Baralho TODOS (BR+Europa+Mundo) na carreira — FEITO (04/08, só conta do Diego)
Pedido do Diego (print da tela de criação): carreira nova da conta liberada usa
`deckLeague='todos'` = CATALOG_BOTH + CATALOG_WORLD (dedup por auge, ~850+ nomes).
setActiveCatalog/pickCatalog sabem 'todos' (cpuSquads também). Todo mundo mais
segue no both fixo. Texto da tela de criação muda só pra ele. Confirmações dadas:
rivais escolhidos começam TODOS na divisão de estreia junto do usuário; conta
dele ativa (precisa criar a carreira LOGADO).

## 🌱 FASE 2 — DIVISÃO VÁRZEA REAL (V) — FEITO (04/08, só conta do Diego)
Diego cobrou "tudo novo já" na conta dele → a 5ª divisão entrou de verdade:
- Tipo Div = A/B/C/D/**V**; carreiras normais têm V VAZIA (guards em promotions/
  balanceamento/UI — nada muda pra ninguém sem escadaOn; placements sem 'V').
- Escada com escadaOn: sala inteira (você+rivais+fillers) nasce na **Várzea**;
  fillers usam VARZEA_TEAMS (20 times zoeiros novos em data.ts: Unidos da
  Resenha, Perna de Pau City, Doze Contra Onze…); Série D vira divisão de fundo
  (DIVISION_TEAMS.D − rivais escolhidos + EXTRA_D_TEAMS, 20 times, fichas na
  fatia mais fraca do pool em buildCpuSquads comVarzea).
- Régua Fase 2 (spec original do Diego): V=🪵+🎯 · D=🎯+💎 · C=💎+⭐ · B=💎+⭐ ·
  A=⭐+👑. Banco de reservas destrava ao SUBIR PRA D; livre = 2 temporadas na A.
- Copa Legends: Várzea NÃO joga (top-4 de A-D como sempre). Promoções V↔D só
  quando V existe. 20 manchetes de jornal da Várzea (tom peladão). Prêmios/caixa/
  boost com valores de várzea (CAMPEAO.V=12, base 60, boost 0, patrocínio 0).
- Vazamento corrigido: as "sobras do mundo" (cartas left- que voltavam do
  catálogo pro leilão) agora respeitam a régua. Mercado secundário (vendedor real)
  segue fora da régua DE PROPÓSITO (palavra do Diego).
- SIMULADO (30 temporadas ×2): mundo 5×20 ✅, arco ÉPICO (ex.: V1→D1→8 anos de
  Série C→B→A na T14, livre T20, com quedas e voltas), 0 fake, régua do baralho
  novo 100%. agenciatest ✅ (agência no mundo V) + save antigo clássico ✅.
- Harnesses (scratchpad): simescada.mjs/agenciatest.mjs usam sportstub.js (alias
  ./sport com travas ligadas).

## 🏦 BANCO LEGENDS — FEITO (04/08, mockup aprovado; visível SÓ pro Diego até a chave Pix real)
Pacotes 10/50/100/500/1000 (1 real = 1 moeda). Supabase: tabela bl_fichas (RLS só
admin) + RPC bl_redeem (atômica, security definer, 1 uso por ficha, exige login).
Jogo: botão "🏦 Banco Legends" em Clube › Finanças (SÓ carreira solo) → gerente
Seu Creuzebek 🤵 + pacotes + passos do Pix + resgatar ficha (anti-chute 3 erros =
1min) → BANCO_CREDIT credita no caixa do clube ativo + extrato "🏦 Empréstimo do
Banco Legends" (kind 'banco'). Admin: "Caixa do Gerente" (gera ficha BL-XXXX-XX,
copia no toque, lista quem usou). ✅ RESOLVIDO 04/08: chave Pix real = diego.c.fonseca@gmail.com; Banco LIBERADO GERAL (sem gate de conta, segue só carreira solo; comprovante via Instagram @leilaolegendscom ou e-mail). Nota antiga: ⚠️ BL_PIX = banco@leilaolegends.com é
PLACEHOLDER — Diego precisa passar a chave real; aí troca e libera geral (gate
useAgenciaLiberada hoje).

## 🌱 VÁRZEA — 4 correções do 1º teste do Diego (04/08, prints)
1. Patrocínio dizia "Série D" na Várzea → texto próprio ("A Várzea não atrai
   patrocínio (ainda 🍺)"); telas de criação/manual também falam Várzea (conta dele).
2. Clube › Agência (sub-aba) REMOVIDA quando Agência 2.0 ligada (a agência mora
   em Elenco › Agenciados; desbloqueios aparecem lá na caixinha de travas).
3. 🚨 Convocação puxava o ÁLBUM GLOBAL da conta → agora SÓ cartas de título DESTA
   carreira (empresarioCards + stash do 2º clube), com TRAVA no motor
   (SET_AGENCIA valida contra o cofre) e SANEAMENTO na virada (convocação antiga
   com carta de fora é limpa e para de render).
4. Bots da várzea tinham PROMESSA no elenco → makeBotSquad (modo várzea) exclui
   promessa (vale também pro modo rápido Várzea — lá o catálogo já vinha filtrado).

## 🏆 RANKING reformulado — FEITO (04/08, pedido do Diego com print)
Abas novas (saiu o "Geral"): 🪜 **Carreira** (primeira aba, EM BREVE — lista
ZERADA de propósito, aviso "contagem começa do zero quando abrir") · 👥 **Rápido
online** · 🤖 **Rápido offline**. RPC esc_ranking ganhou modos 'ronline'/'rcpu'
que EXCLUEM temporadas de carreira (season_key like 'co:%'); modos antigos
seguem funcionando (compat com app aberto). ✅ RESOLVIDO 04/08: Diego decidiu
MANTER O HISTÓRICO — aba 🪜 Carreira liberada GERAL com o modo RPC 'carreira'
(todos os títulos co:, liga+Copa juntos) e títulos novos de carreira seguem
contando normal. Ordem final das abas: Rápido online · Rápido offline · Carreira.
Ideias futuras (sem decisão): separar liga/Copa na exibição; régua por divisão.

## 💀 KFC — LIMPEZA EXECUTADA (04/08, AUTORIZADA pelo Diego: "sei q ele fez hacker, coloque 57")
user_id 9ba06350-8b24-4ba2-85b6-b045a5a9c28d. Antes: 191 títulos rápido-cpu +
216 cartas CPU (fabricados). Feito: (1) champion=false nos 134 títulos rápido-cpu
mais NOVOS (ficam os 57 mais antigos — número escolhido pelo Diego); (2) álbum
CPU enxugado pra 85 cartas mais antigas (= 57 rápido + 28 carreira) — SEM isso o
reconcileCardsToTitles do cliente RECRIAVA os títulos pra bater com as cartas;
(3) BACKUP integral antes de apagar: tabela kfc_cards_backup_20260804 (217 rows,
RLS on). Verificado: cartas_cpu=85 = títulos_cpu=85 → reconcile neutro. Online
(17) e carreira (28) intocados.
⚠️ AINDA ABERTO: o buraco em si (cliente grava esc_results/user_cards direto —
qualquer um pode fabricar). Fechar com validação server-side ANTES de abrir o
ranking da Carreira.

## 🏛️ BUG AO VIVO: Multiclubes FANTASMA em carreira nova — CONSERTADO (04/08, print do Murriz)
Sintoma: usuário criou carreira NOVA e na virada apareceu o seletor "MULTICLUBES
— quem você comanda?" com o PRÓPRIO time duplicado (M10 × M10) + aviso de 2
clubes. CAUSA-RAIZ: START_CAREER_SOLO nunca limpava s.multiClube/
multiClubePendingCards — o stash da carreira ANTERIOR (ou de sessão carregada)
vazava pro save novo. FIX duplo: (1) START limpa os dois campos; (2) AUTO-CURA
em normalizeMultiSeats: ao carregar QUALQUER save, se o multiClube aponta pra um
"2º clube" que não existe entre os managers (ou só há 1 humano), o stash é
PURGADO e a carreira volta a clube único — cura o save do Murriz e de quem mais
foi afetado, sem perder nada (o fantasma nunca teve nada dentro).
## 🃏 Cartas corrigidas (04/08, relato do Diego): China → Flamengo 2004 (ano
estava 2013) · Léo Gamalho → Criciúma 2013 (clube estava Vasco). ⚠️ Diego:
confirmar se prefere OUTRO auge pra esses dois (chutei o mais conhecido).

## 🎁 Cartinha "do nada" (sem título) — CONSERTADA (04/08, relato de amigo do Diego)
CAUSA: mesmo fantasma do Multiclubes — recordDormantCards fabricava "pacotes
guardados" (multiClubePendingCards) pro clube-fantasma, e o bloco "Enquanto
dormia, seu time foi campeão! Abra o pacote" renderiza SÓ pela lista de pacotes,
independente do seletor. FIX triplo: (1) auto-cura do fantasma agora purga os
pacotes também; (2) pacotes ÓRFÃOS (fantasma curado antes do fix) são limpos ao
carregar o save; (3) recordDormantCards nunca grava pacote quando o "dormindo"
é o próprio clube ativo. Basta o afetado ATUALIZAR a página.

## 🃏 Auditoria das 18 cartas foi-prof adicionadas — 9 CORREÇÕES aplicadas (04/08, OK do Diego)
Paulinho Bóia → São Paulo 2019 (era "Flamengo", nunca jogou lá) · Maxi Lopez →
Vasco 2017 (era "Grêmio") · Bressan → Grêmio 2014 + bio corrigida (a antiga
dizia "bicampeão da Libertadores 2017" — ele saiu antes) · Rafael Vaz →
Flamengo 2016 · Camacho → Corinthians 2017 · Júlio César goleiro → Corinthians
2010 + bio ("antes do Cássio") · Renan Ribeiro → Atlético-MG 2016 · Léo Gamalho
→ Goiás 2019 · Renato Cajá → Ponte Preta 2012. Mantidas como estavam: Jorge,
Lulinha, Marlone, Giovanni Augusto, Rivaldinho, Lucão, Erazo, Finazzi, China
(Flamengo 2004 — ⚠️ ano ainda é chute; Diego confirma quando souber).
REGRA NOVA: carta nova SEMPRE passa a ficha (clube+ano+bio) pelo Diego ANTES de
entrar no jogo.

## 🤖 DIFICULDADE da carreira nova — handicap SUBIU (04/08, decisão do Diego "tá fácil")
Amigo do Diego subiu rápido demais e ganhou muitos títulos. Simulei 5 receitas
(30 temporadas cada) antes de mexer:
- 6/9/12/2 (antigo) e 4/6/8/3/4: RESSUSCITAM o ioiô (A19→cai, C20→cai) ❌
- 3/4/5/3/4: ioiô no topo (A:3 pune quem acabou de subir) ❌
- ✅ APLICADO: **A:2 · B:4 · C:5 · D:3 · V:4** (era A:2 B:3 C:4 D:2 V:0→3) —
  chegada na Série A vai de T4-T7 pra **T13-T23**, títulos 30T caem pra 1-3,
  topo continua justo (A fica em 2; o vai-e-vem A↔B restante é elenco limitado,
  não handicap). Vale pra TODA carreira da fórmula nova (simV>=4) — inclusive
  em andamento, a partir da próxima temporada. Carreiras antigas seguem 6/9/12/2.
Alavancas NÃO usadas (anotadas): G3/G2 no acesso (sobem 3/2 — visível, muda a
régua de todo mundo) e bots mais espertos no leilão. Se ainda reclamar de fácil,
próxima é G3.

## 🔎 AUDITORIA GERAL (04/08, pedido do Diego) — auditoria.mjs no scratchpad
15 temporadas ×2 no reducer real (carreira nova completa). ✅ PASSARAM: caixa ×
extrato batem EXATO na virada (prêmios+bilheteria+folha+patrocínio+agência);
tabelas fecham (pts=3V+E, 38 jogos, gols pró=contra); artilharia 100% (todo gol
tem dono, por divisão); mundo 100 times sem duplicação; Copa Legends sempre 16
de A-D (Várzea fora); contratos presentes em todo real de humano/rival; XI de
HUMANOS nunca quebra; fatura da agência fecha; caixa nunca NaN.
⚠️ ACHADO MENOR (aberto): na escada, 1-2 RIVAIS de várzea podem ficar com 1
INCÓGNITO no XI persistente (perderam a posição no leilão V e o monte esgotou;
a IA não prioriza repor). Não quebra jogo (jogam com 11, incógnito é fraco), mas
fere o "nunca fake em rival" — consertar: IA do bot prioriza posição com fake no
leilão de reservas. Bots de FUNDO da várzea com incógnito = ok temático.
## 👻 Cartas :mc no Supabase (04/08): 157 cartas de 4 usuários desde 31/07 —
MISTURA de legítimas (donos reais de 2º clube) e do bug fantasma (mc0 sem 2º
clube real). Separar exige abrir os saves — aguardando decisão do Diego (dá pra
cruzar esc_pyramid_saves × user_cards se ele quiser limpeza fina).

## 📝 Contrato no Elenco não cortava mais (04/08, screenshot de amigo do Diego)
Em celular estreito (duas colunas Titulares|Reservas), a linha "clube · ano ·
📝 N anos" cortava pela direita e escondia JUSTAMENTE o contrato ("Milan ·
2007 · 📝 ..."). Conserto em ElencoField (pyramidseason.tsx): (1) contrato
agora vem PRIMEIRO na linha — "📝 7 anos · Milan · 2007" — então se cortar,
some o ano, nunca o contrato; (2) textos compactados: "❗ vencido — decida na
janela" → "❗ vencido" e "🌱 cria da base — sem contrato" → "🌱 sem contrato"
(cores e regras iguais). Reverter = 1 commit.
↳ AJUSTE do Diego (04/08, aplicado): contrato saiu da linha "clube · ano" e
foi pra coluna da DIREITA, embaixo do 💰 piso e 💸 salário (ali nunca corta).
A linha "clube · ano" voltou a ficar inteira, com o ano. Textos continuam
compactos: "📝 N anos" / "⏳ último ano" / "❗ vencido" / "🌱 sem contrato".

## 👑 Arte de compartilhar elenco com o MANTO do tier (04/08, mockup aprovado)
Foto do Kata-Kata 👑 mostrou a arte saindo num mostarda apagado: a imagem
compartilhada usava só a cor CHAPADA do tier (o.color), nunca o degradê+brilho
da aba Elenco. Agora (jornal.tsx buildElencoBlob): topo e listas pintam com o
degradê do tier (gradStops/fillTier parseiam o grad CSS de apoio.tsx) + faixa
de brilho congelada (sheenRect, intensidade = holo do tier). Texto escolhe
contraste sozinho (ouro/prata/bege → escuro; roxo/verde → branco). Sem tier →
arte igualzinha à de hoje. Vale pra todos os tiers, cada um com o SEU manto.

## 🏆 Ranking "Total da conta": nome agora é o da MAIOR carreira (04/08)
Diego estranhou: "HAHAHA · 394" no topo do Total sem existir no Por carreira.
Causa: o RPC esc_ranking batizava a conta com o nome da ÚLTIMA partida jogada
— o Alface tinha acabado de jogar numa carreira nova "HAHAHA" (1 título), e o
Tokyo aparecia como "Xurupitas FC" (45). Somas estavam CERTAS (394 = 379+15;
333 = 269+45+18+1) — só o nome enganava. Migration
ranking_total_nome_da_maior_carreira: no modo carreiratotal o nome vem da
carreira com MAIS títulos da conta (empate → mais recente). Por carreira e
modos rápidos intocados. Verificado ao vivo: Alfacehh FC 394 · Tokyo 333.

## 📖 Álbum do técnico com os DOIS totais (04/08, mockup aprovado)
O que o Diego tinha pedido de verdade no caso Alface: ao tocar num técnico no
ranking CARREIRA, o álbum abre com dois botões-total — "🪜 Esta carreira · N
cartas" (só as cartas daquela linha/carreira) × "📊 Conta toda · M cartas"
(tudo somado) — e a grade de cartas troca junto; filtros Tier/Recentes/etc.
seguem funcionando. Feito: RPC esc_ranking agora devolve career_key (drop+
create, coluna extra não quebra chamador antigo — único chamador é o próprio
ranking); openAlbum busca season_key e guarda SEM dedup (dedup por visão);
chips só aparecem quando a linha tocada é uma carreira (sub-aba Por carreira);
no Total da conta e nos rápidos o álbum fica igual era. Sub-abas do ranking
MANTIDAS (Diego confirmou) e conserto do nome (maior carreira) mantido.

## 🏛️ MULTICLUBES × CONTRATOS: dormindo renova sozinho (04/08, decisão do Diego)
Diego: "dormindo não quer dizer que não faz as coisas — conta prêmios, títulos,
cartas, gasta salários... e renovação também". Conferido no código, TUDO já
rodava pro dormindo: prêmios por colocação (seasonRewards t.human), bilheteria
(applyStadiumIncome), folha T4+ (chargeSalaries), patrocínio e agência/empresário
(blocos dorm explícitos), títulos (honors por teamKey), cartas de campeão
(multiClubePendingCards, abre ao assumir), extrato no stash (logFin roteia).
FALTAVA só contrato: o bloco de vencidos PULAVA o dormindo (if m.dormindo
continue). Agora: vencido de clube dormindo renova AUTOMÁTICO 5 anos pela
metade, pagando da caixa DELE (pode negativar, valor real no extrato guardado
+ linha no resumo do mercado "💤"). Dormir NUNCA perde jogador nem manda
ninguém pro leilão (ninguém decide por ele — auto-renova tudo). Cerimônia já
dava contrato 5-10 ao elenco dele (isHuman). Teste novo: scratchpad/dormtest.mjs
(🟢 verde: contrato na cerimônia, renovação, caixa×extrato EXATO, nada vaza
pro leilão). criatest/malandragem seguem verdes.
↳ MUDANÇA do Diego (04/08): NADA de renovar sozinho no dormindo. Feito no
lugar (mockup lado a lado aprovado): (1) janela de contratos ganha modo 2
COLUNAS quando o dormindo tem vencidos — 🟡 ativo × 💤 dormindo, mesmos 3
botões por jogador (RENEW/RELEASE já aceitavam mgrId), renovação do dormindo
sai da caixa DELE (saldo na tela); sem 2º clube a janela fica idêntica.
(2) Avançar sem decidir = regra de sempre nos dois clubes (auto 5 anos metade).
(3) 😤 MAGOADO: soltou em QUALQUER clube seu → o jogador vai a leilão e NENHUM
clube seu recompra (mesmoDono() em resolve/tiedTop/montePickable; selo "😤
magoado com você" + aviso "🙅 não joga pra você!" no leilão; só solo — online
nunca bloqueia outro humano). (4) BUG evitado: venda de jogador do dormindo
creditava no money (nunca reconciliado) — agora credita direto na careerCoins
dele. dormtest.mjs reescrito (🟢): solta 1 no banner → leilão com selo, monte
bloqueado pros 2 clubes, não volta; 2 sem decisão → renovam automático; caixa
× extrato guardado EXATO. criatest/malandragem verdes.

## 🏛️ AUDITORIA DE INDEPENDÊNCIA dos 2 clubes + toggle da agência (04/08)
Pedido do Diego: "nada passa de um clube pro outro, tudo independente". Varri
TODAS as escritas de caixa (careerCoins/money/logFin) do store:
✅ JÁ INDEPENDENTES: prêmios de liga/Copa/artilheiro (por teamId), bilheteria
(estádio próprio), folha, patrocínio (divisão de cada um), obras do estádio
(id + extrato casados), títulos/honras (teamKey), cartas de campeão (pacote
guardado por clube), extrato (stash roteado), renovações (caixa do dono),
Banco Legends (ativo), leilão (só o ativo joga; money re-semeado da caixa).
🔧 VAZAMENTOS ACHADOS E CONSERTADOS (2):
1. (entrega anterior) venda de jogador solto do DORMINDO caía no money nunca
   reconciliado → evaporava. Agora: caixa oficial do dormindo + extrato.
2. Comissão da SAF (50% da campanha) ia pro "PRIMEIRO humano da lista" — podia
   cair no clube errado (até no dormindo) com extrato no outro. Agora: sempre
   no clube ATIVO (a SAF anda grudada nele) e extrato com o id certo.
🤝 COMPARTILHADO DE PROPÓSITO (decisões antigas mantidas): SAF única (bolo,
byClub devolve certo) · álbum/cofre de cartas ÚNICO da conta (títulos dos 2
clubes enchem o mesmo cofre — "as cartas é única", Diego).
📝 NOTA: prêmio da Copa do Mundo de seleções (+100) só o clube ATIVO recebe.
💰 TOGGLE DA AGÊNCIA (pedido de hoje): na tela Elenco › Agenciados, com 2
clubes aparece "A renda da agência cai no caixa de: [🟡 A] [💤 B]" — renda
INTEIRA (mensalidades+comissões) pro marcado, destraves olham o estádio dele,
troca quando quiser (SET_AGENCIA_CLUBE, só solo, só clube seu). Sem 2º clube,
tela idêntica. dormtest/criatest 🟢.
↳ 🤝 OPÇÃO "DIVIDIR OS DOIS" no toggle da agência (04/08, pedido do Diego):
terceiro botão na tela dos Agenciados — mensalidades E comissões da virada
racham meio a meio entre os 2 clubes (moeda ímpar fica com o clube NO COMANDO;
comissão de negociação de 1 🪙 idem). No dividir, os destraves usam o estádio
QUE RENDE MAIS dos dois (agenciaEstadio). Extrato de cada clube mostra a sua
metade sozinho (linhas por variação de caixa por id). Estado agenciaDividir +
SET_AGENCIA_CLUBE{dividir}. Esclarecido com o Diego: "cartas é única" = cofre
de cartas da agência (um só da conta); estádio segue um por clube.

## 🏆 HALL DA FAMA DA SALA repaginado (04/08, mockup aprovado) — modo rápido online
Era uma linha seca de texto por temporada; agora é a ESTANTE (visual da sala de
troféus da carreira), pra quem fica jogando várias partidas na mesma sala:
- Cartão por jogador com faixa na COR DO TIER (perkFromSelo no nome; ouro/prata
  brilham com ApoioSheen; sem selo = bege) + contador "N troféus".
- Troféus empilhados: 🏆 Liga (dourado c/ brilho) · 🏆 Copa · ⚽ Artilharia
  (verde, por TIME do artilheiro — coluna nova top_scorer_team) · 🙈 TROFÉU
  MICO do lanterna (marrom, BALANÇA — animação escMicoWiggle).
- Zoeira do Mico: 12 frases BR rotativas, sorteio estável por temporada (todo
  mundo da sala vê a mesma) — "música no Fantástico", "ônibus de ré" etc.
- 📜 Linha do tempo embaixo (mais novo em cima): T{n} · campeão · copa ·
  artilheiro · 🙈 mico.
- Banco: game_champions += top_scorer_team, mico_name (migration
  hall_da_fama_time_artilheiro_e_mico); host grava, temporadas antigas seguem
  aparecendo (sem ⚽/🙈 retroativos). Lanterna = último da tabela (pode ser bot,
  zoeira vale). Ideias anotadas sem decisão: 🐔 Frango de Ouro (defesa mais
  vazada) · 🥶 Geladeira (temporada sem vitória).

## ✉️ AVISO DO SUPABASE: bounce alto de e-mail — TRAVA APLICADA (04/08)
Supabase mandou e-mail: taxa alta de e-mails devolvidos (risco de suspenderem o
envio = ninguém recupera senha). Causa medida no banco: cadastros com e-mail
digitado errado — gmail.con (15), gmai.com (8), gnail.com (6), "gmail" sem
.com (6), gmail.com.br (4) — e temporários (temp-mail.org 18, bolaoww.temp 22).
Confirmação de cadastro está DESLIGADA (0 pendentes de 5.958 contas), então o
bounce vem do "esqueci a senha" indo pra endereço errado.
FEITO (emailProblema em apoio.tsx, ligada nos 3 formulários — cadastro do
lobby, esqueci-a-senha, modal salvar-carreira): corrige typo clássico com
sugestão ("@gmail.con → não seria @gmail.com? 🧐"), barra e-mail temporário
(aviso do porquê) e final incompleto. Mensagem do cadastro corrigida ("✅ Conta
criada" — não pede mais confirmação que não existe).
⏳ PENDENTE (precisa do Diego): SMTP próprio no Supabase (Auth → SMTP) com
Brevo (300/dia grátis) ou Resend — tira o envio do pool compartilhado do
Supabase. Volume de reset é baixo, plano grátis sobra.

## 📉 CORTES DE CONSUMO rodada 2 (04/08, OK do Diego — itens 4-7 da lista)
Contexto: aviso do Supabase — restrição em 09/08 se seguir sobre a cota
(Realtime 424%, Egress 240%); Diego orientado a DESLIGAR O SPEND CAP (senão o
jogo trava dia 9; custo estimado R$ 500-600 no ciclo, caindo).
(4) ✅ ECO DO CHAT DO LOBBY removido JÁ (ordem do Diego, sem esperar sexta):
sendLobbyChat mandava 'chat' + 'emote' (dobro de mensagem Realtime) → agora só
'chat'; ouvinte de 'emote' MANTIDO (aba antiga ainda é ouvida; aba muito antiga
precisa de F5 pra ver as novas — custo aceito). Chat/emotes DENTRO da sala já
eram 1× (sem eco).
(5) ✅ live_beats 30s→60s: JÁ ESTAVA FEITO por sessão anterior.
(6) ✅ ~90% já feito antes (estado comprimido ~15-35KB, envia só quando muda,
reenvio de parado a cada 12s). Resto = migalha com risco no online — NÃO mexer.
(7) ✅ Lista de salas: refresh 5s→8s (−37% dessas queries; botão 🔄 segue
na hora).
PENDENTE (Diego): apertar "Disable spend cap" ANTES de 09/08 · transferir
projeto MAQUETE VIRTUAL pra org Free (API não pausa projeto em org paga) ·
SMTP Brevo. EU: monitorar consumo diário e reportar a fatura em R$.

## 🏆 BUG: "Copa21 na temporada 8" — Copas herdadas de carreira antiga (04/08, print do leodiniz85)
No Ranking Geral DENTRO da carreira, clubes (e o próprio usuário) apareciam com
mais Copas que temporadas existentes. CAUSA: START_CAREER (solo E online)
zerava careerHonors mas ESQUECIA careerCopaHonors — as Copas de todas as
carreiras anteriores do aparelho se acumulavam (chave por nome de clube, que
repete entre carreiras: 'Coliseu United' etc.). CONSERTO: (1) os dois STARTs
agora zeram careerCopaHonors junto; (2) CURA no migrateTeamNames (roda em todo
load de save): se a soma de Copas guardada > nº de temporadas (impossível — é
1 Copa por temporada), o histórico tá contaminado → recomeça a contagem.
Efeito colateral aceito: save contaminado perde também as Copas legítimas da
carreira atual NA TELA (recomeça a contar dali). Cartas e ranking da home
NUNCA usaram careerCopaHonors — sempre estiveram certos (esc_results).
↳ CORREÇÃO da cura (bronca do Diego, certíssima): zerar apagava as Copas
LEGÍTIMAS. Agora a cura RECONSTRÓI as copas do jogador pelos recibos de carta
DESTA carreira (empresarioClaimKeys com ':copa'; stash do 2º clube idem) — só
os bots (sem registro por temporada) recomeçam do zero. herancatest.mjs 🟢.
## 🧹 FAXINA ANTI-HERANÇA nos STARTs (04/08 — "analise a fundo", Diego)
Varri TODOS os campos do EscState × o que START_CAREER_SOLO/ONLINE zeram.
MAIS 3 VAZAMENTOS reais achados e corrigidos (mesma família do Copa21):
1. cpuSquads: carreira nova REUSAVA as fichas/elencos dos 60 times de fundo da
   carreira anterior (o semeador só roda "se não existe"). Agora zera → re-semeia.
2. copaDoneSeason: valor velho podia PULAR a Copa da temporada de mesmo nº na
   carreira nova. Zerado.
3. varzea (modo rápido) vazava pro campo da carreira (pintaria marrom errado).
   Zerado no START solo (online já setava da sala).
+ criaNames/criaNews/contratoRelease/agenciaDividir zerados por higiene.
Testes: herancatest.mjs novo (carreira A 3 temporadas → START B: nada herda;
cura reconstrói 2 copas reais e limpa 32 fantasmas) 🟢 · criatest 🟢.
⚠️ auditoria.mjs: 153 falhas PRÉ-EXISTENTES (com e sem as mudanças dá igual) —
todas "XI quebrado/bot com 10 jogadores" em bots de VÁRZEA, efeito do handicap
novo (A:2 B:4 C:5 D:3 V:4) aplicado hoje. Decidir: IA repõe elenco dos bots de
fundo OU atualizar a invariante da auditoria. NÃO mexido sem o Diego.

## 📉 CORTES DEFINITIVOS rodada 3 (04/08, escolhas do Diego item a item)
1️⃣2️⃣ RANKING DIÁRIO: esc_ranking_cache (tabela + esc_ranking_cache_refresh +
pg_cron 'ranking-diario' 06:00 UTC, 4 modos) — a home lê a foto pronta;
fallback pro RPC ao vivo se a foto faltar. reconcileCardsToTitles roda 1×/dia
por aparelho (localStorage esc-reconcile-dia). Aviso sutil na tela: "🕐 O
ranking e as cartas atualizam 1× por dia".
3️⃣ BOLÃO APOSENTADO (Diego: "não tô usando"): REVOKE anon/authenticated em
boloes/participantes/palpites/placares_tempo_normal (dados preservados;
reverter = GRANT). + 🔒 game_rooms_cleanup_log estava SEM RLS (alerta crítico
do advisor) → RLS ligado sem política (só servidor acessa; cron intacto).
6️⃣ esc_admin_dashboard: bloco 'daily' virou UMA passada agrupada (era 4
varreduras × dia) + índices created_at em game_plays/site_visits. Saída igual.
4️⃣5️⃣ NÃO feitos (Diego não entendeu ainda): amostragem de visitas e batimento
ao-vivo — re-explicados no chat, aguardando decisão.
⚠️ Tabelas de um app morto de VISTORIA DE VEÍCULOS (vehicles, inspections,
escrow_records etc., todas 0 linhas) seguem no projeto — perguntar ao Diego se
aposenta igual ao bolão.

## 🔬 SIMULAÇÃO 200 TEMPORADAS ×2 + varredura (04/08, pedido do Diego — SÓ RELATÓRIO, nada consertado)
Harness: scratchpad/simulacao200.mjs (motor real, 200 temporadas; run A jogador
"passivo" nunca vende/solta; run B "ativo" vende 1 sobra/temporada e solta todo
vencido). Resultados completos em sim200.log / sim200b.log.
✅ PASSOU NAS 400 TEMPORADAS: golpe "comprou 15+→saiu por ≤2" = 0 casos (o caso
"Ronaldo de graça" NÃO reproduz — travas de 03-04/08 seguram); monte de graça
de carta valiosa = 0; XI do humano nunca furou (cria SEMPRE tapa); contrato
vencido sobrando pós-cerimônia = 0; duplicatas = 0; NaN = 0; Copa Legends
exatamente 1/temporada (contador são); rivais renovam com inteligência (~95%
dos bons/craques; ZERO lenda solta tendo caixa); rivais listam sobras; preços
mantêm hierarquia por era (craque máx 105 e bom máx 94 em eras ricas — dentro
dos tetos×economia; sem inversão na mesma era).
🚨 ACHADOS REAIS (decisões pro Diego):
1. ESPIRAL DE DÍVIDA SEM RESGATE: jogador passivo (só auto-renova) afunda no
   vermelho PRA SEMPRE (-2.282 na T200, transfer ban eterno, 193 temporadas de
   auto-renew). O jogo nunca quebra, mas também nunca oferece saída da dívida.
2. HANDICAP NOVO É SECO: passivo ficou 200 temporadas preso em D↔C (13 títulos);
   soltador afundou na Várzea com 0 título. Estratégias burras, mas mede o peso.
3. Bots de FUNDO da várzea com XI furado/10 jogadores (auditoria: 153 avisos)
   — efeito do handicap V:4; decidir se IA repõe ou se é "temático".
4. Carta da COPA DO MUNDO (chave copamundo:) NÃO conta no ranking Carreira da
   home (que só soma chaves co:) — decidir se deveria.
5. Prêmio da Copa do Mundo (+100) só existe pro clube ATIVO (dormindo nunca
   concorre) — coerente?, decidir.
📋 ESTÁTICO OK: Copa do Mundo âncora T100 + de 10 em 10 + played[] trava
rejogar; venda nunca quebra XI (inclusive com emprestado); SAF byClub/trim/
revert ligados nos 2 caminhos de virada (segue pendente: teste em save real);
multiclube contratos ✓ (dormtest); heranças entre carreiras zeradas hoje.
⚠️ LIMITES DA SIMULAÇÃO: harness não clica telas/botões (testa o MOTOR);
"deadlock" do run B (dinheiro parado) é em parte artefato do lance burro do
robô — re-testar com estratégia esperta antes de concluir.

## 🔬 RODADA 2 da simulação profunda + CONSERTOS (04/08, ordens do Diego)
PEDIDO: analisar lances de rivais/bots a fundo + consertar XI furado de bot,
Copa do Mundo pro 2º clube e carta/título da CdM contando em tudo.
📊 RAIO-X DOS LANCES (150 temporadas instrumentadas, cada lote registrado):
lances de bots/rivais SENSATOS — craque máx 65 (=teto), lenda 66, médias sobem
com a era sem inversão; rivais renovam ~95% dos bons/craques e NUNCA soltam
lenda com caixa; venda cai de 83% (eras cedo) pra ~60% (eras ricas).
🚨 CONFIRMADO "encalhe do caro": lote com piso ≥30 encalha e CRESCE por era
(14→26→33→67→85 por bloco de 25 temporadas) — o caro roda leilão sem comprador
(piso alto), vai pro monte/varredura, MAS NUNCA sai de graça (0 golpes em 550+
temporadas somadas). PROPOSTA (não feita, decidir): piso do relistado = min(
paid, valorOficial atual) ou decaimento de 20%/temporada encalhada.
🔧 CONSERTO 1 — XI DOS BOTS (auditoria: 153 falhas → ~4): reposição na
cerimônia (FINISH_CEREMONY) com cascata: baralho livre na régua → fama ≤3 →
(rival) qualquer fama mais fraco → PUXA DO FUNDO (cpuSquads doa o real mais
fraco e tampa com zé) → (rival) fundo qualquer fama → incógnito só em último
caso. ⚠️ BUG MEU no meio do caminho (pego pela auditoria): carta de catálogo
não carrega `pos` — injetar é obrigatório (cartas sem posição nasceram e
morreram no mesmo dia). Resta caso raro "bot com 10" (~4 em 30 temporadas
auditadas) — anotado, não crítico.
🔧 CONSERTO 2 — COPA DO MUNDO × MULTICLUBE: os DOIS clubes seus contam pro
top-20 e CADA classificado recebe os +100 (COPA_MUNDO_PRIZE agora com logFin —
extrato do dormindo no stash). 
🔧 CONSERTO 3 — CARTA/TÍTULO DA CdM CONTAM EM TUDO: chave da carta virou
co:solo<seed>:<temporada>:copamundo (origin cpu) → soma nas CARTAS do ranking
Carreira; vitória grava esc_results (champion) → soma nos TÍTULOS; onCard novo
leva a carta pro COFRE do empresário (ADD_EMPRESARIO_CARD), igual liga/Copa.
Cartas copamundo: antigas (chave legada) não migram — só as novas contam.
✅ REGRESSÕES: auditoria 153→4 · criatest 🟢 · dormtest 🟢 · herancatest 🟢 ·
sim 150 temporadas: golpes 0, monte-grátis 0, XI humano 0, vencidos 0,
duplicatas 0, NaN 0. (Métrica "bots XI furado" do sim usa 4-3-3 fixo pra todo
bot — artefato de medição; a régua real é a da auditoria/xiHoles.)

## 🧢 KIT TÔKA10 PUBLICADO (10/08 — aprovado pelo Diego "Ok publica aí")
FEITO: escudo + mascote do Tôka10 (ofc.toka10) com ARTE PRÓPRIA do dono em
IMAGEM (webp): `src/escalacao/img/toka10-{escudo,mascote}.webp` — escudo 22 KB
(entrada 'Tôka10' em LOGOS_PRONTAS via <img>), mascote 15 KB (chave `toka` em
MASCOTES). DB: esc_socios do ofc.toka10 → manto #F0CD23/#1B7A3D (canarinho),
mascote_key 'toka', escudo_time 'Tôka10'. Time já existia em data.ts
('Tôka10', ex-Biriba United, ponte OLD_NAME ok).
📌 REGRA NOVA (decisão do Diego, anotada em escudos.tsx): batismo PODE usar
imagem quando o dono manda a arte — webp comprimido, kit ≤ ~40 KB. O medo de
"estourar KB" foi desfeito com números (37 KB = 1,2% do site de 3,2 MB; limite
de hospedagem 1 GB). Desenho em código continua o padrão dos demais.
🗒️ HISTÓRIA (pra não repetir): 6 versões desenhadas em código foram rejeitadas
("não parece o menino") — o que destravou foi recuperar o ARQUIVO da referência
do transcript da sessão (imagens do chat ficam no .jsonl em base64) e depois o
Diego mandar a arte final pronta (print). Fica a lição: batismo com referência
de imagem → pedir/usar o arquivo, não desenhar de olho.
~~PENDENTE: time_coracao do ofc.toka10~~ ✅ FEITO 10/08: Santos (Diego
confirmou; gravado direto em esc_socios.time_coracao).

## 🦋 CORREÇÃO FINAL Xurupitas/Bicho da Seda/Tokyo (10/08 — Diego esclareceu)
QUEM É QUEM (gravar com e-mail pra NUNCA mais confundir):
- davisantana1312@gmail.com (Davi) = batismo BICHO DA SEDA 🦋 → dono da
  mariposa + manto verde/branco + coração Palmeiras + sócio nº 5.
- denilson.stifler10@gmail.com (Denilson) = batismo TOKYO CITY ESPERION →
  ganhou sócio PRÓPRIO nº 14 (batismo é vitalício). Joga online com o NOME
  "Xurupitas" (camisa livre, não é clube batizado).
FEITO: clube volta a se chamar 'Bicho da Seda' em data.ts (corrente de nomes:
Red Bull Diet → Xurupitas FC [janela 09-10/08] → Bicho da Seda; saves das 3
épocas acham o clube); mariposa em LOGOS_PRONTAS mudou de chave pra 'Bicho da
Seda'; comentários de apoio.tsx/mascotes.tsx corrigidos; DB: pacote inteiro
movido de volta pro Davi (escudo_time='Bicho da Seda') + linha nova do
Denilson (nº 14, sem kit ainda).
LIÇÃO: escudo artesanal segue o NOME do time ("camisa"); perfil/mascote seguem
a CONTA ("tatuagem"). Explicado pro Diego de novo nesse episódio.
PENDENTE: kit do TOKYO CITY ESPERION (escudo+mascote+manto do Denilson) —
Diego vai perguntar o tema pro dono; time_coracao do Denilson idem.

## 🔒 NOME DE TIME ÚNICO — tipo @ do Instagram (10/08, pedido do Diego)
REGRA: nome de time/técnico agora é único. (1) Nome já usado por OUTRA conta →
novo jogador não consegue pegar (quem JÁ tinha repetido, mantém — sem mexer nos
antigos). (2) Nome de clube de BATISMO fica RESERVADO pro dono — só a conta
dona pode usar, mesmo que ainda não use (ex.: denilson pode virar "Tokyo City
Esperion" quando quiser; mais ninguém pode).
COMO: RPC esc_nome_livre(p_nome) (SECURITY DEFINER; normaliza lower/trim;
consulta reservas + display_name de auth.users) + tabela esc_nomes_batismo
(nome_norm→email dono, 14 batismos semeados). Cliente checa nos 4 pontos que
gravam display_name: setup do jogo (screens.tsx start), dinastia, chip ✏️ do
lobby e CADASTRO (signUp) — aviso claro embaixo do campo com o porquê e o
caminho (mensagens em NOME_MSG no manto.ts). Servidor fora → deixa passar
(padrão "não trava o jogo").
⚠️ White Thigs do GuGu ficou FORA das reservas (dono desconhecido) — se o
Diego souber a conta, é só inserir em esc_nomes_batismo.
📌 BATISMO NOVO = lembrar de inserir a reserva em esc_nomes_batismo!

## 🎽 MANTO NO CARD — Opção C aprovada (10/08)
Diego achou a faixinha de 5-7px tímida ("tá MT pouco o detalhe"). Mockup A/B/C
mostrado; ele escolheu a C perguntando se aumentava o card — NÃO aumenta: a
linha da posição foi PRA DENTRO da faixa (topo do card vira manto ~14-16px com
a POSIÇÃO num selinho preto por cima; altura total igual). Aplicado nos DOIS
campinhos: screens.tsx (Campinho do leilão/jogo, variantes small/normal) e
pyramidseason.tsx (campinho da temporada — o do print dele). Vale pra todo
sócio com manto, cada um nas SUAS cores.
+ ONLINE (mesmo dia): os campinhos dos OUTROS times da sala também vestem o
manto do dono — RPC esc_mantos_sala(p_room) devolve SÓ assento→cores (e-mail
nunca viaja; manager.id === room_players.player_index). Bot fica sem manto.

## 📝 CONTRATOS "não aparecem" (10/08 — investigação do caso pedrohenriquedasilva315)
DIAGNÓSTICO (2 causas separadas):
1. BUG REAL (consertado agora): a tela "📝 CONTRATOS · MESMO TIME"
   (ReserveListScreen → SquadTab, pyramidseason.tsx:4241) NÃO passava
   contratosOn/seasonNo → os selos ❗vencido/⏳último ano/📝N anos e o chip 💸
   sumiam JUSTO na tela de decidir contratos. Uma linha, corrigida.
2. CASO DO PEDRO: save dele está na TEMPORADA 178 — carreira ANTIGA (criada
   antes de 02/08). Carreira antiga NÃO tem contratos por decisão de produto
   (contratosOn só nasce em START_CAREER_SOLO/START_ONLINE; sem backfill).
   Não é bug — mas o usuário não tem como saber. PROPOSTO ao Diego (aguardando
   decisão): avisinho na carreira antiga tipo "📝 contratos são das carreiras
   novas — comece uma nova pra ter" OU backfill (arriscado em save T178).
   Comentário desatualizado do types.ts:108 corrigido junto.

## 🌍 COPA DO MUNDO — auditoria profunda + consertos (10/08)
RELATOS: "tá dando erro" (sem detalhe) + "ganhei com o Brasil escalando os
piores" (carreira antiga).
CONSERTADO (commit único, reversível):
1. 🔴 CAUSA MAIS PROVÁVEL DO "ERRO": o Modal era declarado DENTRO do
   componente CopaMundo → todo re-render do pai REMONTAVA a Copa inteira
   (voltava pros grupos, perdia convocação) e no título entrava em LOOP
   (prêmio→re-render→remonta→prêmio). Modal movido pra fora (CMModal).
2. Save llcopa antigo sem played/mural dava tela branca no fim de temporada —
   ensureSave agora normaliza; ?.mural?.find no jornal.
3. scorerPick com XI vazio e país undefined não quebram mais (guardas).
4. Convocação: 2 toques rápidos furavam o limite da posição (guardas liam
   estado velho) → agora contam no prev; travava o botão sem explicação.
5. Título da CdM sumia do Rank após rename do clube (cmTitles sem ponte
   oldChain) → ponte aplicada (Neymarzetti/Tôka10/etc mantêm a estrela).
VEREDITO DO "ganhei com os piores" (Monte Carlo 2.000 copas no motor real):
escalação PESA SIM — 11 piores do Brasil = 0,0% de título (nem sai do grupo);
11 melhores = 34,8%. O que engana: a tela de convocação NÃO mostra
overall/fama (de propósito), então "escalar desconhecidos" ≈ força média ≈
level dos bots. OU o usuário viu o bug 1 (copa dupla). Carreira antiga × nova:
motor IDÊNTICO; só a gravação do título no ranking é gated (agenciaOn).
PENDENTE (decisões do Diego):
- Mostrar nível (fama/estrelas) na convocação? Hoje é escolha às cegas de
  propósito — mas o resultado depende 100% disso.
- ~~Aviso em carreira ANTIGA de que contratos são só das novas~~ ✅ FEITO
  10/08 (Diego aprovou): caixinha na aba Elenco da carreira sem contratosOn.
  Texto ampliado no mesmo dia (pedido dele): primeiro ACALMA ("carreira raiz
  continua valendo e NÃO vai ser interrompida") e depois lista o que só as
  novas têm (contratos, Agência 2.0 na aba Elenco, crias) + caminho.
- Multiclube na Copa: 2 clubes seus no top-20 = duas seleções IGUAIS no
  torneio (Brasil × Brasil possível) — visual estranho, prêmio ok.
- esc_results da CdM usa season_key/mode de solo mesmo em carreira online
  (inconsistência anotada, sem mexer).

## 🔍 AUDITORIA PROFUNDA DO JOGO (10/08 — Diego cobrou "acha os que eu NÃO peço")
5 frentes (finanças, leilão, online, telas, carreira) + 150 temporadas rodadas
no motor real. NÚCLEO LIMPO (div sempre 20, ninguém some, 0 carta duplicada, 0
dinheiro NaN/negativo, sobe4/desce4, determinístico, cerimônia conserta XI de
bot). CONFIRMADO pelo Diego: Agência 2.0 JÁ está solta pra geral (AGENCIA_GERAL
= true) — de propósito. Doc/tasks antigas que diziam "só Diego" estão obsoletas.

BUGS ENCONTRADOS — aguardando o Diego escolher a ordem (NADA foi mexido):
🔴 ALTO 1. Gols mudam ao trocar formação (re-simula o passado; formação não é
   congelada por rodada como escalação/eventos). pyramidseason: world usa
   mgrMe.formation global → lineupAt refaz todas as rodadas. [o que o Diego viu]
🔴 ALTO 2. OPEN_RESERVE_LIST não idempotente: double-tap credita 2× + folha 2× +
   pula temporada. store.tsx:4637 (fix: `if s.screen==='reserveList' return s`).
🔴 ALTO 3. Modal inline em ApoieButton (screens.tsx:297): campo "nome do clube"
   do batismo perde foco a cada letra. MESMO bug da Copa (mover Modal p/ módulo).
🟠 MÉD 4. COPA_MUNDO_PRIZE: +100 pode se perder se app fecha na hora do título
   (idempotência terceirizada ao localStorage, fora do caixa).
🟠 MÉD 5. Host recarrega na fase de envelope → sanitize tira pendingEnvelopes
   também na persistência DB; RESTORE_ONLINE zera envelopes mas mantém submitted
   → lances somem. (fix: limpar submitted ao restaurar em envelope).
🟡 6. Sala host-manual/stream ainda força tiebreak(30s)/monte(45s) escondido.
🟡 7. Copa do Mundo multiclube paga +100 por clube classificado (confirmar).
🟡 8. SUBMIT_TIEBREAK não checa duplaPodeAgir (parceiro errado relança).
🟡 9. DIV_BASE_CASH sem 'V' → várzea nasce com 100 (devia 60). store.tsx:386.
🟢 higiene: key={i} no álbum; resumo de fechamento esconde kind 'saf'; componentes
   inline (Stat/Face/PickList/Team) sem bug hoje mas mesmo padrão do #3.
🟣 LATENTE: restart-ready e voto de fim de temporada mistura youIdx×manager.id
   (ok hoje pq batem; trava sala se algum dia reordenar os times). Blindar.

## ✅ CONSERTOS DA AUDITORIA (10/08 — Diego mandou "faça os 3 que doem, depois médios, depois menores")
FEITOS E NO AR (cada um commit isolado, buildado, reversível):
🔴 1. Campo "nome do clube" do batismo não perde mais o foco (ApoieModal movido
   pra fora do componente — mesmo padrão do fix da Copa).
🔴 2. Anti-toque-dublado no fim de temporada: OPEN_RESERVE_LIST ignora 2º toque
   (`if s.screen==='reserveList' return s`) — não dobra mais dinheiro/folha/temporada.
🔴 3. Gols não mudam mais ao trocar formação: CHANGE_FORMATION congela o XI das
   rodadas já jogadas na formação ANTIGA (bestXIids por rodada); a nova vale do
   jogo atual em diante. Provado com teste (XI da rodada passada fica idêntico).
🟠 4. Prêmio da Copa do Mundo (+100) não some mais: credita ANTES de marcar
   played + trava idempotente por `${mgrId}:${temporada}` (copaPrizeDone no
   estado). Anti-perda e anti-dobro.
🟠 5. Host recarrega na coleta de lances → zera `submitted` só nas fases de
   envelope no RESTORE_ONLINE (guests reabrem input e reenviam; não resolve mais
   com lance zero).
🟡 6. Várzea nasce com 60 (DIV_BASE_CASH ganhou 'V'). 🟡 7. Prêmio da SAF aparece
   no resumo de fim de temporada (kind 'saf' no filtro). 🟡 8. Desempate em dupla
   respeita o dono da categoria (SUBMIT_TIEBREAK ganhou `by` + duplaPodeAgir).

PENDENTE (precisa de decisão/UI nova — NÃO mexido):
- ⏱️ Timer escondido do DESEMPATE/MONTE em sala host-manual/stream: setar "sem
  tempo" TRAVA (não há botão de host pra fechar o desempate, só o envelope tem).
  Pra consertar direito = adicionar botão "fechar desempate e avançar" na UI do
  online. Item menos urgente (não corrompe estado, só contraria o "show pausado").
- 🟢 Cosméticos deixados: álbum key={i} (risco de key duplicada se mexer);
  componentes inline sem bug hoje (Stat/Face/PickList/Team).
- 🟣 LATENTE de assento (restart-ready/voto de fim de temporada usam youIdx×id):
  ok hoje pq batem; blindar preventivamente antes de qualquer reorder de times.
- Copa do Mundo multiclube paga +100 por clube classificado (Diego confirmar se
  é isso mesmo — comentário diz intencional "independência dos 2 clubes").

## ✅ CONSERTOS DA AUDITORIA DE DINHEIRO & DADOS (10/08 — Diego: "conserte todos")
FEITOS E NO AR (commits isolados, buildados, reversíveis):
🔴 1. Removida a rotina reconcileCardsToTitles: ela igualava títulos ao nº de
   cartas e, com a trava do Falido FC, FABRICAVA título de carreira antiga e
   APAGAVA título real (2 títulos c/ a mesma carta). Rodava 1×/dia → corrompia
   sempre. Ranking agora reflete só o que o jogo grava. (screens.tsx)
🔴 2. Vaga/ordem da Copa do Mundo agora usa a MESMA ordenação do Rank
   (A·Mundo·Legends·B·C·D·dinheiro) — antes o gate ignorava wc/copas e a
   colocação exibida ≠ a que qualificava. (pyramidseason copaGate)
🟠 4. Título de Copa do Mundo sobrevive ao rename: ponte pela corrente de NOMES
   (oldChain(t.name)), não oldChain('m{id}') que era vazio. (pyramidseason mural+gate)
🟠 3. Artilheiro de todos os tempos separa xarás: chave nome+cardId (94 nomes
   repetidos no baralho somavam junto). Teto subiu 300→1000 (menos perda de
   quem sai/volta ao top). (store RECORD_SEASON_STATS)
🟠 5. Álbum conta por AUGE (nome|clube|ano), não só nome — 2 versões da mesma
   lenda contam separado, bate com o servidor. (screens dedupByName)
🟡 9. REAUCTION_ONLINE (caminho legado) blindado contra toque-dublado.

✅ CONFIRMADO REDONDO (150 temporadas + leitura): dinheiro conservado nas
transferências (comprador debita = vendedor credita), premiações no momento
certo e 1×, folha piso÷10 por jogador só da 4ª, renovação bate com a tela,
transfer ban trava compra, campeão 1/divisão sem dobrar, idempotência OK.

DEIXADOS PRA CONFIRMAÇÃO DO DIEGO (são DECISÃO DE DESIGN, não bug claro —
mexer muda semântica/arrisca; NÃO mexidos):
- #7 "Artilharia" na Sala de Troféus conta só o artilheiro GERAL da pirâmide
  (scorers[0]), não o de cada divisão (B/C/D). Contar por divisão inflaria o
  nº de artilharias de todo mundo. Quer contar por divisão?
- #8 Bot-fiador varrendo o monte credita o vendedor SEM se debitar (cria
  graninha na caixa do humano-vendedor). É o que GARANTE que quem lista carta
  sempre recebe. Impacto ínfimo. Deixar como está (garante pagamento) ou fazer
  o bot pagar (conservação)? ✅ RESOLVIDO 10/08: Diego escolheu "robô paga" —
  o bot debita o próprio caixa quando fica com carta LISTADA (conservação 100%).
  Banner da carreira antiga ganhou botão ✕ (fecha e não volta, por aparelho).

## ⚽ NOVOS JOGADORES ADICIONADOS (10/08 — lista grande do Diego)
Adicionadas 25 cartas novas reais no baralho BR (+ 1 no baralho EU) em
`data.ts` (blocos `NOVOS_BR2_*`), build ok. Conferido no catálogo o que já
existia antes de adicionar (evitar duplicata):
- JÁ ESTAVAM no jogo (Diego pode conferir in-game): Kaio Jorge (Cruzeiro),
  Alan Patrick (Inter), Bernabei (Inter), Robgol (Bahia), Luciano Juba (Bahia),
  Nino (Fluminense), Nonato (Bahia), Ronaldo Giovanelli (Corinthians),
  Diego Tardelli (Atlético-MG), Tinga (Inter), Dario Conca (Fluminense),
  Thorgan Hazard (irmão do Eden, baralho EU).
- NOVOS adicionados: Lucas Arcanjo e Marcelo Lomba (gol); Cuiabano,
  Matheuzinho, Natanael (lat); Félix Torres, Gabriel Mercado, Titi, Jemerson,
  Rafael Tolói (zag); Rodrigo Garro, Breno Bidon (promessa), Arthur (Grêmio),
  Bitello, Juan Cazares, Edu (Corinthians), Gabriel Bontempo (promessa),
  Lucas Crispim, Lucho González (mei); Gabriel Pec, Lingard, Elkeson,
  Rafael Borré, Dirceu Lopes, Nikão, Marcelo Cirino, Jesé Rodríguez,
  Alex Alves, Osvaldo (ata); Jobe Bellingham (baralho EU, irmão do Jude).

RESOLVIDO (10/08, 2ª leva): Diego confirmou 3 (Kevin Viveros Athletico-PR,
zagueiro é Alexander BARBOZA não "Barbosa" — do Botafogo campeão da
Libertadores 2024, Willian Bigode é atacante do Cruzeiro bicampeão 13/14) e
mandou pesquisar o resto a fundo (usei WebSearch). Todos entraram em
`data.ts` (blocos `NOVOS_BR3_*` + 1 no baralho EU):
Kevin Viveros (Athletico-PR, artilheiro do Brasileirão 2026), Alexander
Barboza (Botafogo, zag, seleção da Libertadores/Brasileirão 2024), Willian
Bigode (Cruzeiro, ata, bi 13/14), Newton (Botafogo, volante do elenco campeão
2024), Leozinho (Athletico-PR, ex-futsal, promessa confirmada), Marcelino
Moreno (Coritiba, meia camisa 10), Allan Delon (Vitória, meia-artilheiro,
campeão baiano 2002), Alex Dias "Pantaneiro" (Goiás, vice-artilheiro
Brasileirão 2004 c/ 22 gols), Beto Acosta (Náutico, vice-artilheiro 2007),
Cédric Soares (São Paulo, lateral, campeão Euro 2016 — bem mais forte que
"foi profissional", ajustei o nível), Valdívia "Poko Pika" (Internacional,
NÃO é o Mago do Palmeiras — outro Valdívia, top de gols entre meias do
Brasil em 2015; nome da carta ficou "Valdívia (Poko Pika)" pra não confundir
com o outro), Roger Machado (Grêmio, lateral-esquerdo, 10 anos e 6 títulos —
achei bem mais decorado do que a pergunta original sugeria), Mariano
(Fluminense 2010 — foi o AUGE real dele, campeão brasileiro e um dos
melhores laterais do país no ano, não "promessa"; passagem de 2008 no
Atlético-MG foi curta e sem brilho, não usei essa), Mancini (foi pro baralho
EU, clube Roma — pesquisa confirmou que o auge mesmo foi lá, 222 jogos/59
gols, ídolo da torcida, "Tacco di Dio"; começou no Atlético-MG onde fez 15
gols numa Brasileirão como lateral, citado na bio).

PENDENTE — só sobrou 1 sem confiança suficiente pra não arriscar errar:
"Boiadeiro" do Goiás — achei o Ricardo Boiadeiro (atacante, mas o Wikipédia
lista Atlético-GO, não Goiás EC) e outros 2 jogadores diferentes com esse
apelido ligados ao futebol goiano — preciso do nome completo ou ano pra
saber qual dos 3 é.

## 🎚️ AJUSTE DE NÍVEL — leva de jogadores (10/08, à noite)
Diego revisou os níveis e pediu ajustes (já no ar em `main`):
subiu p/ CRAQUE: Arthur, Rodrigo Garro, Edu, Mancini. Subiu p/ LENDA: Dirceu
Lopes. Desceu de lenda p/ craque: Andrade (Flamengo 81 — o Adílio já tava
craque certo, não mexi). Desceu p/ bom jogador: Alexander Barboza. Desceu p/
foi profissional: Cédric Soares, Lingard. Careca (São Paulo 1986) já era
lenda, conferido, não precisou mexer.
PERGUNTA EM ABERTO pro Diego: ele perguntou se o Mariano (lateral) não seria
"promessa" no auge (2010, Fluminense, campeão brasileiro) — respondi no chat
que naquele ano ele já estava consagrado (não estreante), então mantive
"bom jogador"; só mudo se ele confirmar que quer assim mesmo.

## 🖼️ ARTE STORIES — 44 reforços
Gerada arte vertical (1080×1920) com todos os 44 jogadores agrupados por
posição, identidade visual do jogo (creme/preto/Oswald/sombra dura). SEM
cor por raridade e SEM texto de categoria — Diego pediu que os cards
fiquem todos iguais (só nome+clube). Arquivo:
`/tmp/.../scratchpad/story-novos-jogadores.html` (+ fontes Oswald ttf no
mesmo scratchpad) — gerada a screenshot via `playwright screenshot
--viewport-size "1080,1920"`. Já entregue ao Diego, aguardando OK final
pra postar.

## 🔍 AUDITORIA DE DATAS/FATOS — leva de jogadores (10/08, à noite)
Diego achou 2 problemas (Kaio Jorge duplicado + Lingard com ano errado — ele
chegou em 2026, não 2023) e pediu pra conferir TODAS as cartas novas. Fui
carta por carta com WebSearch e achei **16 erros reais** de ano/fato/clube
(taxa de erro alta — quase 40% das 44 cartas novas tinham algo errado):
- Lingard: ano 2023→2026 (chegou É este ano, não em 2023)
- Cuiabano: ano 2023→2024 (contratação foi abril/2024)
- Titi: ERA TOTALMENTE ERRADO — inventei "convocação pra Seleção" que não
  achei confirmação nenhuma; o Titi real jogou no Bahia 2011-2015 (não 2023),
  tricampeão baiano no período. Corrigido ano e bio.
- Gabriel Bontempo: ano 2024→2025 (estreou profissional em jan/2025)
- Natanael: bio dizia "lateral-esquerdo...foi pra Europa" — ele é
  lateral-DIREITO e não foi pra Europa, foi pro Atlético-MG em 2025.
- Bitello: ano 2022→2023 (foi vendido em set/2023)
- Rafael Tolói: ano 2011→2014 (saiu pra Atalanta em 2015, não logo em 2011)
- Edu: bio citava "Deportivo" errado — foi Arsenal e Valencia. Ano 1997→1999.
- Lucho González: ERRO GRAVE — disse que foi do Athletico-PR PRO Porto, mas é
  o contrário (jogou no Porto ANTES, no início da carreira, e chegou no
  Athletico já veterano em 2016, saindo em 2021). Ano corrigido 2005→2019,
  bio reescrita.
- Gabriel Pec: ano 2022→2023 (foi vendido em jan/2024)
- Elkeson: bio dizia "revelado no Botafogo" — ele foi revelado no VITÓRIA,
  só chegou no Botafogo em 2011. Ano 2010→2012, bio corrigida.
- Osvaldo: card dizia "Ceará" mas os anos que pus (2019-2021) eram do
  FORTALEZA — o Osvaldo no Ceará foi 2010-2011. Ano corrigido pra 2011.
- Lucas Arcanjo: ERRO GRAVE — inventei que ele era "cria do Athletico-PR
  emprestado ao Vitória" e "pegou pênaltis decisivos". Na real ele é cria
  da BASE do próprio Vitória (lá desde 2016), sem nenhum vínculo com
  Athletico-PR. Bio reescrita do zero.
- Marcelo Cirino: joguei ele em 2015, mas nesse ano ele tava EMPRESTADO ao
  Flamengo, não jogando pelo Athletico-PR. Ano corrigido pra 2019 (ano que
  fez o gol do título da Copa do Brasil) + bio mais precisa.
- Alex Alves: ERRO GRAVE de década — pus "2013" mas o auge dele no Cruzeiro
  foi 1998-1999 (artilheiro, vendido pro Hertha Berlin por US$7mi). Corrigido
  + adicionei o apelido real "Capoeira" (comemorava com golpes de capoeira).
- Félix Torres: bio dizia que ele foi "rumar ao futebol mexicano" mas é o
  contrário — ele VEIO do México (Santos Laguna) pro Corinthians. Corrigido.

Todas as correções já buildadas e no `main` (ao vivo). Conferido também se
"Kaio Jorge" tem duplicata na base — NÃO tem (só uma carta, Cruzeiro 2024).
Então a duplicata que o Diego viu no leilão não é erro de dado — pedi pra
ele mandar print/mais detalhe pra caçar se é bug de embaralhamento
(store.tsx) ou só duas telas mostrando a mesma carta (normal).

## 💰 GRANA MAIS FÁCIL NO CARREIRA (10/08, à noite)
Diego: "pessoal reclamando que tá difícil fazer grana no carreira" — 2 ajustes:
- Agência 2.0: carta LENDA sobe de 5→6 moedas/temporada (bate com o valor que
  o Empresário clássico já pagava).
- Patrocínio por aposta: tabela inteira DOBROU. Várzea 1/2/3→2/4/6, D
  2/4/6→4/8/12, C 4/8/12→8/16/24, B 8/16/24→16/32/48, A 16/32/48→32/64/96.
  Mira ajudar quem tá começando (Várzea/D), onde a bilheteria-base (20 fixo)
  ainda é quase a única renda garantida.
Ambos já no ar em `main`, build ok, reversível (só valor de tabela).

## 🎨 Mata-mata mais vivo — Copa dos 8, Copa Legends e Copa do Mundo (11/08)
Diego achava os jogos simulados (que ele não tá jogando) "muito feio" —
mockup aprovado, aplicado nos 3 sistemas de mata-mata do jogo:
- **Copa dos 8** (Jogo Rápido, `screens.tsx` `tieRow`/`copaFill`)
- **Copa Legends** (Carreira, `pyramidseason.tsx` `CopaLiveMatch`/`fillFor`)
- **Copa do Mundo** (`copa-mundo.tsx` `MiniLive`/`tieRow` — não tinha NEM cor
  antes, era texto puro; ganhou o visual dos outros dois)
O que mudou nos 3: time de ROBÔ ganha cor de verdade (antes era cinza
apagado de propósito — combinado com o Diego que pode perder essa "pista
visual" de bot); barrinha de progresso do tempo; flash dourado + "GOOOL
agora!" quando alguém acaba de marcar (só destaca o que JÁ apareceu no
placar — zero mudança no timing de revelação/anti-spoiler, conferido com
cuidado porque é ponto sensível do Diego); lista de jogos rolando vira
grade que se ajusta ao espaço (1 coluna no celular, mais em tela larga).
`copaSideColor`/`CopaHalves`/`copaCenterChip` viraram export de
`pyramidseason.tsx` pra dar pra reusar no `copa-mundo.tsx` sem duplicar.
Build ok, já no ar em `main`. NÃO consegui testar ao vivo num navegador de
verdade (sandbox sem acesso de rede configurado direito pro Supabase —
o jogo caía numa tela de manutenção) — pedido ao Diego pra conferir na
próxima Copa dele e avisar se tiver algo estranho (reversão é 1 commit).
Pendente ainda combinado, não mexido: melhorar visual da disputa de
pênaltis (ideias sugeridas no chat: ⚽/🧤 em vez de ✓/✕, destaque na
cobrança decisiva, cor diferente na morte súbita).

## 🏆 Copa do Mundo: visual preto e dourado + cor real das seleções (11/08)
Mockup aprovado pelo Diego ("ficou perfeito"). Aplicado de verdade em
`copa-mundo.tsx`: cabeçalho do torneio, caixas de grupo e caixa do
mata-mata agora em preto com detalhe dourado (tema de troféu). Criada
`PAIS_COLORS` com a cor real de cada uma das 16 seleções que já jogam
(Brasil amarelo, Argentina celeste, Alemanha preto, Holanda laranja
etc.) — usada em `MiniLive`/`tieRow` no lugar do hash genérico
(`copaSideColor`, que era o mesmo dos outros dois sistemas de copa).
Build ok, no ar. Não dava pra testar ao vivo de qualquer forma (Copa do
Mundo só destrava na temporada 100 da carreira — não rola simular até lá
numa sessão de teste rápida), então fica pro Diego conferir na conta dele
quando chegar lá (ele já tem carreiras avançadas, deve ser em breve).
Se aparecer alguma seleção nova no futuro, falta adicionar a cor dela em
`PAIS_COLORS` (cai no fallback do hash automático, só não vai ser a cor
real até alguém completar).

## 🎯 Disputa de pênaltis mais chamativa (11/08) ✅ NO AR
Retomando a pendência anotada acima. Mostrei 6 ideias em 2 mockups pro
Diego, ele escolheu 3 ("4-5-6"): implementadas em `PensShootout`
(`pyramidseason.tsx`), componente ÚNICO reusado pelas 3 copas do jogo
(Copa dos 8, Copa Legends, Copa do Mundo — mexeu 1 vez, valeu nas 3):
- **Morte súbita** ganha caixa vermelha com textura listrada + título em
  destaque (antes era só um texto pequeno "· MORTE SÚBITA" no cabeçalho).
- **Confete + tremidinha** no instante exato que o resultado final
  aparece (mesmo timing de antes — não adianta nem atrasa nada).
- **Telão final**: o placar vira uma caixa preta/dourada com um quadrado
  da cor de cada time dos lados (na Copa do Mundo é a cor REAL do país,
  via `PAIS_COLORS`; nas outras copas é a cor já sorteada do time —
  passado por um novo prop opcional `colorOf` no `PensShootout`).
Ideias NÃO escolhidas (1: ⚽/🧤 em vez de ✓/✕; 2: pausa de suspense na
cobrança decisiva; 3: bolinha de cada cobrança com a cor do time) ficam
guardadas caso o Diego queira depois — não implementadas.
Build ok, no ar em `main`. Revertível (1 commit:
`git revert 235160f` no main / `f076855` na branch de trabalho).

## 🏆 Auditoria "Libertadores" no baralho (11/08) ✅ NO AR
Diego perguntou pelo modo **"Glória Eterna Libertadores"** achando que já
tinha um baralho separado pra conferir — na real esse modo **NUNCA foi
programado**, só tem a ideia anotada mais acima ("Modo Libertadores
temático... AINDA PENDENTE") + mockups antigos. Expliquei isso a ele e, como
prep pro dia que o modo for feito de verdade, auditei as ~45 cartas do
baralho ÚNICO cuja bio cita Libertadores (clube+ano bate com a história
real?). Rodei em agente separado (pesquisa na web pros casos mais obscuros),
conferi cada achado eu mesmo antes de mexer. 7 cartas corrigidas em
`data.ts`:
- Alex Mineiro: não tava no Athletico em 2005 (emprestado ao Kashima
  Antlers no Japão) — ano 2005→2002, tirei o claim de Libertadores da bio.
- Andrés Escobar: título (1º colombiano campeão) foi 1989, card tinha 1991.
- Aranha: bio dizia "vice" 2011, Santos foi CAMPEÃO naquele ano.
- Carlos Germano: título do Vasco foi 1998, card tinha 1997.
- Deyverson: gol histórico do título é 2021, card tinha 2018 (1ª passagem,
  antes do feito).
- Nino: título de capitão do Flu foi 2023, card tinha 2021.
- Piquerez: bio dizia "bicampeão", só tem 1 título (chegou depois da final
  de 2020, jogada em jan/2021).
- Gabigol (Inter de Milão, 2017): card sem bio própria HERDAVA a bio do
  Flamengo dele (que fala de finais de Libertadores) por compartilhar o
  mesmo nome no dicionário de bios — bug estrutural, ganhou bio própria.
  ⚠️ Vale considerar se tem mais algum card assim (nome repetido em clubes
  diferentes, sem bio própria, herdando bio errada de outra fase da
  carreira) — não fiz uma varredura geral disso, só resolvi este caso.
NÃO mexido (fica pro Diego decidir, não tive certeza suficiente): Antony de
Ávila (ano 1990 não bate exato com nenhuma das finais de vice que achei —
1985/86 — mas ele jogou lá 1988-96 então não é erro grosseiro) e a bio do
Gabriel Mendoza (diz "Corinthians 99", pode ser Tigres UANL/México — não
afeta o veredito Libertadores do card, só um detalhe da frase).
44 cartas conferidas e certas, sem mexer. Build ok, no ar em `main`.

## 🎨 Cor do time na Copa = cor do escudo dele (11/08) ✅ NO AR
Diego notou no print da Copa Legends que o Guarani (fictício, "Guarani do
Cerrado") tava com fundo laranja — perguntou se não dava pra basear na cor
da LOGO do time, "não importa se é genérico ou não". Confirmado: os times
da Copa Legends (Guarani do Cerrado, Napolitano, Nacional da Serra etc.)
são fictícios das divisões, não têm "cor real" tipo seleção da Copa do
Mundo — mas o Diego só queria que a cor do card BATESSE com a do escudo do
mesmo time, sorteada ou não. Antes eram DOIS sorteios separados (escudo E
card de jogo), podendo dar cores diferentes pro mesmo time. Agora
`copaSideColor` (usada nas 3 copas: dos 8, Legends, Mundo) puxa direto o
`c1` (fundo) do `escudoDe()` — o MESMO gerador que desenha o brasão — então
card e escudo do time são sempre a mesma cor, para qualquer nome (real ou
fictício). Mexido em `screens.tsx` e `pyramidseason.tsx`. Build ok, no ar
em `main`. Revertível (1 commit: `e9a238c` no main).

## 🎨 Copa: faixa branca no meio com o placar (11/08) ✅ NO AR
Diego mandou print da Copa Legends + print do card de partida do próprio
jogo dele, perguntando se dava pra manter as cores dos times mas com um
fundo branco separando os dois no meio (onde fica o placar), igual ao card
do jogo dele. Mockup aprovado ("Pode fazer"). Aplicado nos 5 lugares que
mostravam o card de confronto da Copa (nos 3 sistemas: Copa dos 8, Copa
Legends — card grande ao vivo + lista de confrontos decididos do
chaveamento, Copa do Mundo — MiniLive + lista de confrontos): trocou o
fundo colorido cobrindo o card INTEIRO (placar flutuando numa pilulazinha
preta por cima) por 3 zonas lado a lado — cor cheia do time à esquerda,
faixa BRANCA no meio com o placar, cor cheia do time à direita. Resto
(barra de progresso ao vivo, flash de gol, escudo, anti-spoiler dos
pênaltis) preservado, só que agora fica embaixo da faixa colorida em vez
de por cima dela. O componente antigo `CopaHalves` (fundo full-bleed) foi
REMOVIDO do código — não sobrou nenhum uso dele. ⚠️ Cuidado que resolvi na
hora: o brilho holográfico do tier pago (ApoioSheen, aparece no lado
"você" quando é verde/roxo/prata/ouro) tinha ficado de fora na primeira
versão da troca — recolocado nos 3 lugares que precisavam (Copa dos 8,
Copa Legends card grande, Copa Legends lista). Build ok, no ar em `main`.
Revertível (1 commit: `d6b7346` no main).

## 🎨 Identidade da Copa dos 8 (roxo) e Copa Legends (verde-escuro) (11/08) ✅ NO AR
Diego pediu identidade visual por copa (tinha mostrado um mockup antigo da
"Glória Eterna" Libertadores — CONFIRMADO que não existe no código, é só
mockup salvo, expliquei de novo). 1ª tentativa com nomes novos ("Copa
Relâmpago", "Hall da Fama") foi REJEITADA — ele quer os nomes ORIGINAIS
(Copa dos 8, Copa Legends), só a cor entrando mais. 2ª versão aprovada
("Isso aí!! Pode aprovar"):
- **Copa dos 8** (`screens.tsx`): roxo `PURPLE` (#7C3AED) no cabeçalho da
  fase + no aviso "Chegou a Copa dos 8!".
- **Copa Legends** (`pyramidseason.tsx`): verde-escuro `COPA_LEG_GREEN`
  (#14401f) + dourado no cabeçalho da temporada (só na fase da Copa) e no
  painel do chaveamento "🏆 COPA LEGENDS".
- **Card de partida** (nos 2 sistemas): pedido do Diego — escudo agora fica
  EM CIMA do nome (não mais lado a lado, dá mais espaço pra ler); barra de
  progresso ao vivo subiu pro TOPO do card (antes ficava embaixo, entre
  placar e infos); moldura do card ganha a cor do tema (roxo/verde) SÓ
  enquanto tá rolando ao vivo — decidido volta pro preto normal, "seu jogo"
  continua vermelho (prioridade sobre o tema).
Copa do Mundo (preto/dourado) e Glória Eterna Libertadores (mockup, não
programada) ficam de fora dessa rodada — não foram pedidas dessa vez.
Build ok, no ar em `main`.

## 🐛 Copa Legends ONLINE: fase agora sincronizada pelo host (11/08)
Diego repassou relato de jogadores: "atualiza [a página] e muda o placar
todo" na Copa Legends. Investiguei com agente de pesquisa (só leitura) e
depois confirmei com o Diego que precisava mesmo ser corrigido. Achado:
- O RESULTADO final (campeão, placares, artilheiros) sempre foi 100%
  determinístico (semente + temporada) — refresh NUNCA mudou isso, nem
  antes desta correção.
- O problema real: a FASE da Copa (oitavas/quartas/semi/final) era um
  `useState` LOCAL de cada tela — cada convidado avançava sozinho no
  próprio relógio, sem nenhum dado sincronizado. Um F5/reconexão podia
  mostrar uma fase (e portanto um placar) diferente do que o host via na
  mesma sala. O aviso que já existia na tela pro convidado ("a próxima
  fase anda quando o host avançar") não era verdade — hoje passou a ser.
Corrigido: novo campo `EscState.copaRound` (só o HOST escreve, via
`dispatch({type:'SET_COPA_ROUND'})`, gate por `state.isHost` — igual o
`state.round` da liga) — o mecanismo de sync que já existe (host reemite o
estado a cada mudança) propaga sozinho, nada novo de rede. Carreira SOLO
(offline) continua 100% em `useState` local, zero mudança de
comportamento. Mexeu em `types.ts`, `store.tsx`, `pyramidseason.tsx`.
Build ok, no ar em `main`. Não dava pra testar ao vivo numa sala online de
verdade nesta sessão (sandbox sem 2 abas simultâneas de teste) — pedido
ao Diego pra avisar se algo parecer estranho numa sala online (reversão é
1 commit).

## 🐛 Fundo roxo da Copa dos 8 sumido (bug de CSS) — corrigido (11/08)
Diego mandou print: a caixa "Chegou a Copa dos 8!" e o cabeçalho da fase
apareciam esbranquiçados, texto quase ilegível (era pra ser roxo). Causa:
o componente `Box` (screens.tsx) usava a prop `bg` como CSS
`backgroundColor`, que NÃO aceita degradê — só cor sólida. A identidade
roxa da Copa dos 8 (adicionada hoje) usa `linear-gradient(...)`, o
navegador ignorava o valor inválido e a caixa ficava sem fundo nenhum.
Corrigido: `backgroundColor` → `background` no componente (aceita sólido
E degradê, sem quebrar quem já usava cor sólida — só 2 lugares usavam
degradê, os 2 novos de hoje). Build ok, no ar em `main`.

## 🐊 Festão do mascote também no Jogo Rápido/Copa dos 8 (11/08)
Diego: ganhou a Copa dos 8 no Jogo Rápido online e o festão do mascote
(feature nova de "Sócio Legends" — `mascotes.tsx`/`manto.ts`, de outra
sessão) não apareceu. Achado em `screens.tsx` (`EscEnd`): a condição só
olhava campeão da LIGA (`youWon`), igual o mesmo recorte que já existe na
Copa Legends da carreira (`pyramidseason.tsx`, só liga também, não mexido
por enquanto — fora do escopo combinado). Agora conta liga OU Copa dos 8
(`state.quickCopa?.champion?.id === you.id`, "por quem vê" — nunca o flag
`.you` global, que no online marca todo humano por igual). Mesma trava de
1x por sessionStorage (ganhar os dois no mesmo jogo festeja só 1 vez).
Build ok, no ar em `main`.
⚠️ Nota pra próxima sessão: `mascotes.tsx`/`manto.ts` (Sócio Legends: 30
moedas/mês, escudo à mão, mascote+festão, manto do coração, nome do
estádio) foram adicionados por outra sessão em paralelo — ainda sem
entrada própria nesse diário explicando o desenho completo (RPC
`esc_meu_socio`, tabela `esc_socios`, painel `esc_admin_socio_perso`). Se
mexer nessa área de novo, vale ler o código direto (`manto.ts` tem os
comentários) antes de assumir o que já existe.

## 🎪 Torcidômetro + 🚨 Riscômetro financeiro (Modo Carreira) — parte 1 (11/08)
Longa conversa de design com o Diego (várias idas e voltas — vale ler o
histórico do chat se precisar do racional completo). Fechado e IMPLEMENTADO:

**Torcidômetro** (`state.careerTorcida`, `Record<string, number>` 0-100 por
time humano, chave `m<id>`, começa em 50): atualiza **1x por temporada**
(no fim, junto com título/colocação — reaproveita o `tables` que já
calcula `computePromotions`/`seasonChampions`, função nova
`torcidaDeltas()` em `pyramidseason.tsx`) pela colocação final:
- 1º-4º: **+5** · 5º-6º: **+4** · 7º-14º: **0** · 15º-16º: **−4** ·
  17º-20º: **−5** · subiu/caiu de divisão DE VERDADE: **+5/−5** a mais
- ✅ Régua CONFIRMADA pelo Diego (12/08) pra TODOS os 20 lugares — a 1ª
  versão tinha 3 degraus chutados por mim (1º/2º/4º), corrigido.
- Aparece no cabeçalho do clube (escudo/nome/dinheiro) — carinha + barra
  + %. **Nunca** perto de jogador/elenco (pedido explícito do Diego).

**Riscômetro** (usa `state.careerCoins` que já existe, NADA de campo novo):
barra verde/amarelo/vermelho dentro do Extrato, só aparece quando o caixa
fica negativo, aviso vago ("coisas piores podem acontecer com o time")
— nunca cita jogador.

**✅ TUDO IMPLEMENTADO (12/08, 3 entregas seguintes no mesmo dia):**
- **Bônus de moedas** (`torcidaBonusRewards` em `pyramidseason.tsx`): torcida
  ≥55% no fim da temporada paga +8 🪙, ≥80% paga +15 🪙 — sempre por cima do
  que o clube já ganha (misturado no mesmo balde de "Prêmios da temporada"
  do extrato; dar uma linha própria exigiria mexer na contabilidade de
  fechamento de temporada, código sensível — fica pra depois se o Diego
  quiser).
- **Histórico sutil** (`careerTorcidaHist`, `torcidaHistEntries`): chips tipo
  "+5 · 3º lugar · +5 · subiu de divisão" embaixo da barra, guarda os
  últimos 6, mostra os últimos 3 — igual ao mockup aprovado.
- **Lotação + chuva/Camarote** (`StadiumTab` em `estadio.tsx`, props novas
  `torcidaPct`/`chuvaHoje`): card "Lotação do próximo jogo" logo depois do
  desenho do estádio (StadiumSvg) e da bilheteria fixa — a lotação segue o
  torcidômetro; dia de chuva (sorteio determinístico por seed+rodada, ~28%
  dos jogos, calculado em `pyramidseason.tsx`) derruba a lotação SÓ daquele
  jogo, a menos que o clube já tenha o Camarote construído. Nunca toca na
  bilheteria fixa por temporada (isso é outro número, intocado).
  ⚠️ Mockup mostrado (`mockup-lotacao-chuva.png`) e aprovado pelo Diego
  ("Já dei ok pode fazer") antes de codar.
Build ok em cada passo, tudo no ar em `main`. Não testado ao vivo (precisa
jogar de verdade pra ver o número da torcida mudar, o bônus cair no caixa e
pegar um dia de chuva) — pedido ao Diego pra conferir.

**🎨 Stories pro Instagram**: 3 imagens 1080x1920 feitas e entregues (não
fazem parte do jogo, só material de divulgação): torcidômetro sozinho,
riscômetro com tom de MEDO (ligado ao evento "jogador vai embora"), e uma
versão "tudo junto" com os 3 recursos numa imagem só (fontes reduzidas pra
caber). Arquivos ficaram só no scratchpad da sessão (não versionados).

## 🚨 Crise financeira (Modo Carreira) — parte 2, IMPLEMENTADA (12/08)
"Pode iniciar" do Diego → construí o EVENTO GRANDE que tava pendente da
entrega acima. Design já vinha 100% fechado do chat (releitura antes de
codar), resumo do que ficou:

**Gatilho** (`state.careerDebtBarrier`, `Record<number, number>` por
técnico, e a lógica em `pyramidseason.tsx`): quando o caixa cruza uma
barreira NOVA de −500 (−500, −1000, −1500...), o jogador de MAIS FAMA do
elenco (empate: maior `hi`) anuncia que vai embora. Matemática confirmada
com o Diego: barreira já cruzada = `Math.ceil(caixa/500)*500`. A 1ª vez
que o app observa o caixa de uma conta, ele só GRAVA essa marca (sem
disparar banner) — assim quem já tava fundo no vermelho quando a feature
foi ao ar não "deve" as barreiras antigas, só a PRÓXIMA conta daqui pra
frente. Só carreira SOLO (mesmo padrão do banner de evento de jogador —
online tem estado compartilhado, fica de fora por segurança, igual o
banner da TV e o dos eventos de jogador já faziam).

**Banner** (`CriseBanner` em `pyramidseason.tsx`): é um AVISO, não uma
pergunta — "Não jogo em time duro assim, não." + o nome do jogador + tag
vermelha "CAIXA NO VERMELHO". Duas respostas:
- **"Aqui não tem mercenário"** → lista de gente da categoria **"foi
  profissional"** (fame 1), filtrada pela posição que abriu.
  ⚠️ CORREÇÃO (12/08, mesmo dia): a 1ª versão desta entrega inventou uma
  lista nova (`FOLCLORICOS_LIVRES`) com bios escritas por mim — o Diego
  apontou o erro: Mauro Shampoo, Carlos Kaiser, Adriano Gol Contra e o
  resto da categoria "foi profissional" **já existem de verdade no
  catálogo** (`CATALOG`/`CATALOG_EU`/`CATALOG_BOTH`/`catalogTodos()`,
  `fame===1`), com bio/clube/ano reais. Removi a lista inventada; agora a
  tela busca direto no catálogo REAL da carreira (mesmo baralho
  br/eu/both/todos que o jogo já usa), priorizando quem tem selo
  folclórico (`folk:true`) — cai pra "foi profissional" sem selo só se a
  posição não tiver folclórico nenhum. **Lição pra quem mexer aqui de
  novo:** antes de inventar conteúdo novo pro jogo, checar se já não
  existe no catálogo — "foi profissional"/folclórico já é um sistema
  grande e pronto.
  - Quem já tá jogando em ALGUM time (seu ou de bot) some da lista —
    evita duplicar a mesma pessoa em 2 lugares. Vende/solta depois? Ele
    volta a aparecer sozinho (calculado on-the-fly, sem flag "usado").
- **"Nunca gostei dele mesmo"** → sobe alguém da BASE, reaproveitando 100%
  o `spawnCria()` que já existia pro tapa-buraco de contrato vencido
  (mesmos nomes de `CRIA_NOMES`, mesma mecânica) — esses sim são
  inventados, igual sempre foram.
- O jogador que saiu só é removido do elenco — não narra pra onde ele foi
  (pedido explícito do Diego: "não precisa falar nada no jogo dessa troca").
- Trava a tela igual o banner de evento de jogador (não anda "Próxima
  rodada"/Copa enquanto não decide) e nunca aparece em cima da Copa Legends
  ao vivo nem da tela de fim de temporada.
- 🤡 Piada pedida pelo Diego: o botão "Aqui não tem mercenário" faz bravata
  ("temos gente MELHOR, pode confiar") e um aviso embaixo dos 2 botões
  zoa que, seja base ou "foi profissional", ninguém ali é bom de bola —
  é de graça mesmo.

**Reversível:** é só um novo jogador de graça entrando (mesma mecânica do
Cria da Base que já existe há meses) — se algo sair torto, é reverter o
commit, não tem save quebrado nem estado que trava o jogo.

**Arquivos:** `types.ts` (`careerDebtBarrier`, `careerCrise`), `store.tsx`
(3 ações novas: `SEED_DEBT_BARRIER`, `START_CAREER_CRISE`,
`RESOLVE_CAREER_CRISE`), `data.ts` (`FOLCLORICOS_LIVRES`),
`pyramidseason.tsx` (gatilho + `CriseBanner`).
Build ok. **Não testado ao vivo** (precisa realmente deixar o caixa
negativo numa carreira solo de verdade pra ver o banner disparar) — avisar
o Diego pra testar e conferir se o texto/fluxo tá do jeito que ele
imaginou.

## 🐛 Medalha errada (3º lugar mostrava "2") + 🎯 tática na Copa dos 8 (12/08)
Relato de um jogador (print de WhatsApp que o Diego repassou), jogo rápido
vs CPU:

- **Bug real**: a carta de compartilhar (`buildShareCardBlob` em
  `screens.tsx`) e o cabeçalho de fim de temporada (`placementHeader`)
  usavam 🥈 pra QUALQUER posição dentro da zona de acesso (ex.: top 4 de
  20) — só que 🥈 É literalmente a medalha "2º lugar" (tem um "2" desenhado
  nela nos emojis). Quem ficava em 3º ou 4º via a medalha de prata com "2"
  do lado do texto certo "3º LUGAR"/"4º LUGAR" — visual contraditório.
  Trocado por 🏅 (medalha genérica, sem número) nos 2 lugares. Não mexi na
  lógica de zona (continua sendo "zona de acesso" proporcional, só o ícone
  não promete mais uma posição que não é a de verdade).
- **Pedido do jogador**: a tática (🧱 Retranca / ⚖️ Equilíbrio / 🔥 Ataque)
  já existia no jogo rápido, mas só na LIGA — sumia na Copa dos 8. Conferi
  o motor (`simMatch` em `store.tsx`): ele SEMPRE leu `state.tactics[id]`,
  inclusive nos jogos da Copa — só faltava o BOTÃO pra trocar durante a
  Copa (ficava travada na última escolha da liga). Adicionei o mesmo
  seletor (reaproveitando 100% o componente que já existia) na tela da
  Copa dos 8, logo depois do cabeçalho roxo da fase.
- ⚠️ **Pendência em aberto, NÃO mexida**: o Diego reclamou que a arte da
  carta de compartilhar do jogo rápido/CPU (fundo creme, faixa amarela
  "🔨 LEILÃO LEGENDS", texto em lista "Pontos:/Artilheiro:/Campeão da
  temporada:") tá "muito feia" pro nível visual atual do jogo. Não mexi
  nisso ainda — é redesign de verdade (precisa mockup + OK do Diego antes,
  regra do próprio Diego pra qualquer visual novo). Se for pedido de novo,
  o arquivo é `buildShareCardBlob`/`buildChampionShareBlob` em `screens.tsx`.
Build ok, no ar em `main`. Reversível (2 emojis trocados + 1 bloco de UI
reaproveitado — sem campo novo no estado).

## 🐛 Botão do estádio prometia "+20" mesmo quando ia cobrar menos (12/08)
Relato de usuário (via Diego): "Cadeiras custa 90 mas os investimentos vão
de 80 pra 100 — paga 10 a mais". **Investiguei e o jogo NUNCA cobrou a
mais**: o reducer (`STADIUM_INVEST` em `store.tsx`) já fazia
`Math.min(STADIUM_STEP, custo - investido, carteira)` — o clique final de
Cadeiras (80/90) sempre cobrou só +10, nunca +20; total pago sempre bate
exatamente o "custo total" mostrado. O bug de verdade era só o BOTÃO
(`StadiumTab` em `estadio.tsx`), que sempre escrevia "Investir +20 💰"
mesmo no clique que ia cobrar menos — dava a entender (corretamente, pela
lógica do próprio jogador) que o total ia estourar. Corrigido pra mostrar
o valor REAL do próximo clique. De brinde, achei e corrigi um bug
funcional junto: a trava de "sem grana" (`poor`) comparava com o +20 fixo
também, então podia travar o clique final barato de alguém que já tinha o
suficiente pra completar o setor (ex.: 15 moedas não bastam pra "+20", mas
bastam pra completar os 10 que faltavam).
Só afeta Cadeiras (90) e Camarote (150) — os únicos setores que não são
múltiplo de 20 (Gramado/Geral/Visitante fecham exato, sem clique parcial).
Build ok, no ar em `main`. Reversível — só troca o número mostrado no
botão e a conta da trava, nenhum campo de estado novo.

## 👑 Novo Lenda: chiarentin.dyno127@gmail.com (12/08)
Pedido do Diego: "add esse usuário, como Lenda e tudo que tem direito".
Adicionado em `apoio.tsx` — tier `ouro` no `FOUNDERS` + `FUNDADOR_N`
(tudo do ouro: cor/selo 👑, brilho, Modo Manual + selo de fundador 🖋️).
Sem batismo (Diego não passou nome de clube — só entra quando for pedido
explicitamente, igual todo mundo dessa lista).
⚠️ **Colisão com sessão concorrente**: outra sessão adicionou o Tio Sapeka
(@tiosapekagg, batismo Sapekeiros FC) como fundador nº41 quase na mesma
hora — o cherry-pick pro `main` bateu de frente (os 2 tentaram usar o
nº41). Resolvido mantendo os DOIS: **Tio Sapeka = 41, chiarentin = 42**
(o commit local ficou com a mensagem desatualizada dizendo "41" por
engano — o número de verdade no código é 42, mais confiável que a
mensagem do commit).
Build ok, no ar em `main`. A fonte oficial de tier é a tabela
`user_colors` do Supabase (o Diego gerencia no painel dele) — isto aqui é
só a lista de reserva no código, que o jogo usa se o banco não responder.

## 🎪 Torcidômetro ao vivo + 🗑️ banner preto do batismo removido (12/08)
Duas pendências rápidas do Diego:
- **Torcidômetro ao vivo**: o medidor ficava travado a temporada toda,
  só atualizando na virada. Agora o número exibido é `banco + degrau da
  posição ATUAL na tabela` (recalculado a cada render, nunca grava nada
  novo) — sobe/desce em tempo real conforme a rodada avança. O valor
  BANCADO (`state.careerTorcida`, o que paga bônus e vira histórico)
  continua intocado, só muda de verdade na virada como sempre foi.
- **Banner preto do sócio-batismo removido**: `SocioBaraoBanner` em
  `pyramidseason.tsx` mostrava uma lista grande de vantagens (30
  moedas/mês, escudo, mascote, manto, estádio) + botão de Instagram toda
  vez que um sócio de batismo abria a carreira — o Diego achou repetitivo
  e pediu pra tirar (confirmado explicitamente: remoção total, não só
  encurtar). A CREDITAÇÃO das 30 moedas/mês continua rodando sozinha
  (nunca dependeu do banner aparecer) — só sobrou um avisinho pequeno e
  discreto ("🪙 as 30 moedas caíram") quando cai, sem a lista de
  vantagens nem botão nenhum.
Build ok, no ar em `main`. Reversível nos dois — nenhum campo de estado
novo, só lógica de exibição.

## 💸 Investigação: "difícil ganhar dinheiro na Várzea" (12/08)
Pessoal reclamando pro Diego. Fui atrás e mapeei TODA fonte de renda da
carreira, comparando Várzea × resto — a Várzea é a ÚNICA divisão que:
- Fica de fora da **Copa Legends** inteira (`COPA_DIV_STRENGTH`, comentário
  já dizia "Várzea não joga a Copa — só A-D") → perde campeão/vice/
  artilheiro da Copa.
- Tinha **ZERO cota de TV** (`TV_COTA`, era `{ A:20, B:15, C:10, D:5, V:0 }`).
- Tem os MENORES prêmios em tudo que É proporcional (artilheiro +6 vs +30
  na A; patrocínio 2/4/6 vs 32/64/96 na A).
- Some com a maior parte do que construiu no estádio se não tiver bem
  colocada (sistema de OCUPAÇÃO — `occByPos` em `estadiodata.ts`, já
  existia de outra sessão: top4=100%, meio=55%, Z4=18% do que foi
  construído).
**Implementado (só isto, o resto ficou pra decisão futura do Diego)**:
Várzea agora tem cota de TV = **1** (era 0). Não resolve tudo (a Copa
fora do escopo, e a ocupação continua igual) — foi só o "buraco" mais
fácil e barato de tapar, símbolico mas tira o zero. `TV_COTA` em
`store.tsx`.
**Ainda em aberto (perguntei, Diego não decidiu ainda)**: subir o PISO da
ocupação só na Várzea (hoje 18% no rebaixamento — ficaria tipo 40%) pra
quem tá começando não ficar preso no fundo do poço.
Build ok, no ar em `main`.
