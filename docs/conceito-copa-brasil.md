# 🏆 Copa do Brasil Legends + Supercopa Legends — conceito

## 🚨 ATUALIZAÇÃO 16/08 — chaveamento REFEITO, versão de grupos DESCARTADA
Depois de MUITA iteração com o Diego (ele foi trocando de ideia várias
vezes, mockups e simulações no meio do caminho), a seção 1 abaixo (grupos
de 4, 96 clubes) está **DESATUALIZADA/SUBSTITUÍDA**. A especificação
FECHADA de verdade agora é 100% mata-mata puro, sem fase de grupos
nenhuma — ver a nova seção **1-NOVA** logo abaixo desta caixa, ela é a
fonte de verdade agora. Motivo da troca: o Diego achou a fase de grupos
complicada demais de acompanhar e preferiu manter tudo no formato
eliminatório simples que o resto do jogo já usa.

**Isso exige reconstruir `src/escalacao/copa-brasil.ts` do zero** — o
motor que existe hoje (grupos de 4, 16 grupos, potes de força) não serve
mais pra nada, é preciso trocar pela lógica da seção 1-NOVA.

## 🚧 Status da construção (16/08)
1. ✅ **Placar com goleadores** — no ar.
2. ⚠️ **Motor do chaveamento v1 (grupos)** — DESCARTADO, ver acima.
3. ✅ **Motor v2 (mata-mata puro)** — reconstruído, testado (522
   verificações, 0 falhas), ligado ao jogo atrás da trava de teste. Peneira
   (72→36) + direto (28) = 64, funil trava a partir das oitavas.
4. ✅ **Supercopa Legends** — construída (`computeSupercopa` +
   `supercopaRewards`), campeão da Liga × campeão da Copa do Brasil, azul
   brilhante, empate técnico troca pro vice da Liga. Entra como a 8ª fase
   da mesma esteira de revelação da Copa do Brasil (zero state machine
   nova). Testado: 119 verificações, 0 falhas.
5. ✅ **Ranking LOCAL** — Supercopa é critério próprio no desempate; a
   Copa do Brasil usa o MESMO contador da Copa Legends (é renomeação, não
   competição nova — ver §7.3).
6. ⏳ Falta: telas dedicadas pra peneira/potes (hoje reaproveita 100% os
   componentes da Copa Legends via adaptador — funciona, mas não tem
   nenhuma tela EXTRA explicando o funil pro jogador dentro do jogo em
   si, só nos mockups fora dele), ranking GLOBAL (vive no Supabase, fora
   deste repo — só falta a Supercopa lá, o resto já está certo).

> Decidido com o Diego em 14-16/08/2026, em cima de muito brainstorm e
> idas-e-vindas. **AINDA NÃO CODAR sem reconfirmar com o Diego** — este
> doc é memória entre sessões (protocolo do CLAUDE.md), não ordem de
> serviço. A seção 1-NOVA é a especificação atual; a seção 1 antiga (logo
> depois) fica só de registro histórico, não usar mais.

## 1-NOVA. Especificação do chaveamento — FECHADA v2 (16/08, mata-mata puro)
**100 clubes reais (20 por série: A, B, C, D, Várzea) — NINGUÉM é
excluído.** Tudo roda de uma vez só, **depois que a rodada 38 termina**
(nada acontece no meio da temporada — o Diego cogitou adiantar parte da
peneira pro meio da temporada, mas descartou: o tempo total de exibição
seria o mesmo, só mudaria QUANDO se assiste, então não compensa a
complexidade extra).

**Peneira (72 clubes)** — mata-mata, jogo único, sorteio livre a cada
rodada:
- Várzea inteira (20) + Série C inteira (20) + Série D inteira (20) +
  **12 piores da Série B** (13º ao 20º) = 72
- 72 → 36 sobreviventes

**Direto na chave, sem jogar a peneira (28 clubes)**:
- Série A inteira (20) + **8 melhores da Série B** (1º ao 8º) = 28
- ⚠️ Isso muda o corte antigo da Série B (era 12 melhores/8 piores —
  agora é **8 melhores/12 piores**, ajustado pra fechar a conta exata em
  64 na chave principal, sem precisar excluir ninguém nem ter "passe
  direto" avulso no meio do caminho).

**Forma a chave principal**: 36 (peneira) + 28 (direto) = **64 clubes**

**O funil completo, do fim da Liga ao campeão** (7 fases):
1. Peneira: 72 → 36 (jogo único, sorteio)
2. Rodada de 64: 64 → 32 (jogo único, sorteio)
3. Rodada de 32: 32 → 16 (jogo único, sorteio)
4. **Oitavas: 16 → 8** (ida e volta) — **a partir daqui o chaveamento
   TRAVA** (estilo olímpico/árvore clássica: Chave A de um lado, Chave B
   do outro, convergindo pra Final no meio — vencedor do jogo A encara
   vencedor do jogo B na fase seguinte, sem sortear de novo)
5. Quartas: 8 → 4 (ida e volta, chave travada)
6. Semifinal: 4 → 2 (ida e volta, chave travada)
7. Final: 2 → 1 🏆 (jogo único, chave travada)

Empate (agregado ou na final): pênaltis, mesma trava de sempre da Copa
Legends. Tempo total estimado no automático: **~1min45** (calculado com a
régua de ~9s por jogo que a Copa Legends já usa).

**Divisões que dependem de posição**: só a Série B (corte 8º/9º) precisa
esperar a rodada 38 fechar pra saber quem é quem — Várzea, C e D entram
inteiras, não importa a posição de ninguém nelas. Série A inteira também
não depende de corte (todo mundo dela vai direto).

Logo depois do campeão da Copa do Brasil sair, entra a **Supercopa
Legends** (ver seção 5) — sequência única, sem intercalar com mais nada.

---

## A ideia geral
Hoje a carreira tem Liga (Séries A/B/C/D/V) + Copa Legends (mata-mata só
com o G4 de cada série, 16 times). A **Copa do Brasil Legends SUBSTITUI a
Copa Legends** — chaveamento aberto, favorecendo zebra, com 64 times na
chave principal. Depois dela, mais uma novidade: a **Supercopa Legends**
(Liga × Copa do Brasil), jogo único.

## 1 (ANTIGA, histórico — SUBSTITUÍDA pela seção 1-NOVA lá em cima, não usar)
### Especificação do chaveamento (Copa do Brasil) — versão com grupos, 96 clubes, 15/08
**Total geral do ecossistema: 96 clubes.** Quebra exata (confirmada pelo
Diego depois de eu apontar que a conta original não fechava):
- **32 clubes entram de BYE**, direto na chave de 64, sem jogar peneira:
  - **Pote 1 — Favoritos (16)**: os 16 MELHORES colocados da Série A.
  - **Pote 2 — Desafiantes (16)**: os 4 ÚLTIMOS colocados da Série A + 12
    da Série B.
- **64 clubes jogam a fase de grupos** (o resto da Série B + Séries
  C/D/V) — **16 grupos de 4 clubes** (não 5 — ajustado pra fechar a
  conta: 96 − 32 bye = 64 na peneira; 16 grupos × 4 = 64 ✓).

⚠️ **Requisito que o Diego marcou como crítico (15/08)**: quem vai pra
cada balde tem que sair **DIRETO da posição final da tabela daquela
temporada** (tela de Tabelas) — 1º ao 16º da Série A = Pote 1; 17º ao 20º
da Série A (os 4 últimos) = Pote 2; 1º ao 12º da Série B = Pote 2; 13º ao
20º da Série B + todo mundo de C/D/V = fase de grupos. NADA de sorteio ou
aleatoriedade nessa parte — é decidido pelo desempenho real na Liga. Isso
já está mockado (Série A e B com a etiqueta de destino em cada linha).

**Fase 1 — fase de grupos (peneira inicial)**: 16 grupos de 4 times (64
times disputando). Top 2 de cada grupo avança (16×2 = 32 classificados).
Sorteio dos grupos: os 64 times divididos em **4 potes de força**
(fechado 15/08 — eram 5 potes na ideia original, pensada pra grupos de 5;
ajustado pra 4 potes pra bater com o grupo de 4: cada grupo recebe
exatamente 1 time de cada pote, e 64 ÷ 4 potes = 16 times por pote =
exatamente os 16 grupos, uma conta redonda).

**Fase 2 — sorteio da chave de 64**: os 32 classificados dos grupos se
juntam aos 32 times de bye, formando a chave de 64 com 2 potes:
- **Pote 1 (Favoritos, 32 times)**: 16 melhores da Série A (bye) + 16
  líderes de grupo (1º lugar).
- **Pote 2 (Desafiantes, 32 times)**: 4 últimos da Série A + 12 da Série B
  (bye) + 16 vice-líderes de grupo (2º lugar).
- Sorteio livre entre os potes, sem trava de repetição de grupo.

**Mando de campo** — FECHADO 15/08:
- 1ª rodada da chave de 64 (64→32): quem veio do Pote 1 manda o jogo (casa
  no jogo único, ou a volta se for ida-e-volta).
- Das oitavas em diante: **sorteio puro** (não é campanha acumulada) —
  mesma simplicidade da 1ª rodada, sem precisar calcular ranking de
  campanha a cada fase.

**O funil**: 64 → (1ª rodada) → 32 → (oitavas) → 16 → (quartas) → 8 →
(semi) → 4 → (final única) → campeão. A partir de oitavas/quartas isso
vira ida-e-volta reaproveitando 100% o motor que a Copa Legends já tem —
`CopaTie`, `LiveScoreCard`, `PensShootout`, tudo em `pyramidseason.tsx`.
Não é construir do zero.

## 2. A regra de ouro puxada da Copa do Brasil de verdade
Nas fases de grupo/iniciais, **empate favorece o time de divisão mais
baixa** (mesmo critério de desempate do torneio real) — máquina de
fabricar zebra: "time de várzea elimina gigante da Série A com um 0×0".
Bate direto com o gosto do Diego por zebra.

## 3. Simulação e ritmo
Fases/jogos que não envolvem o SEU time resolvem sozinhas (igual a Liga já
faz hoje com os outros 19 times da sua série — só o seu jogo anima de
verdade). O resto vira manchete de zebra no giro da rodada. Só quando
chega a vez do seu time é que vira tela de verdade, com tática e tudo.

## 4. Calendário — FECHADO (15/08): sequencial, no mesmo gatilho da Copa Legends
Diego decidiu: entra **exatamente no mesmo momento em que a Copa Legends
entrava** — a Liga termina a rodada 38 e, no lugar do banner "Chegou a
Copa Legends!", aparece "Chegou a Copa do Brasil Legends!". Não muda NADA
na estrutura/duração da temporada, é troca de CONTEÚDO no mesmo gatilho
— não precisa intercalar rodada de Copa com rodada de Liga (a opção
"misturada" foi descartada). Mais seguro: não toca no cálculo de rodada
da Liga pra ninguém, não esbarra na regra #1 do Diego ("nunca quebrar o
futebol").

## 5. Supercopa Legends (decidido 15/08)
- **Quem joga**: campeão da Série A × campeão da Copa do Brasil daquela
  temporada, jogo único, DEPOIS que a Copa do Brasil termina.
- **Empate técnico**: se o MESMO time ganhar a Liga E a Copa do Brasil na
  mesma temporada, quem joga a final no lugar dele é o **VICE da Série
  A**.
- Deve ser montada de forma **genérica** no código — parâmetro "campeão da
  copa da vez" — não hard-coded. Bate com a Supercopa do Brasil de
  verdade (Brasileirão × Copa do Brasil, a copa aberta, não uma copa
  interna).

## 6. Identidade visual (decidido 15/08, mockup aprovado)
Cada competição tem cor própria, sempre com o brilho holográfico (mesmo
mecanismo já usado em Copa dos 8/Copa Legends — degradê + feixe de luz
varrendo, `ApoioSheen`/`apoioSheen` keyframe):
- **Copa dos 8** (online, já no ar): roxo brilhante.
- **Copa do Brasil Legends** (carreira): **verde carregando o brilho +
  amarelo só de detalhe** (testamos as 3 cores da bandeira brigando em
  peso igual e ficou poluído num card pequeno — por isso só 2 fortes).
- **Supercopa Legends**: identidade **INVERTIDA** de propósito — **azul
  carregando o brilho + amarelo só de detalhe**. Assim dá pra saber qual
  competição é só pela cor, sem ler texto.
- Mockup completo (funil, potes, tabela de grupo, placar ao vivo das duas
  cores) já enviado e aprovado no chat — replicar essa forma exata na
  construção.

## 7. Premiação — proposta (16/08, atualizada pro chaveamento v2/mata-mata puro)
A Copa Legends hoje paga por FASE, valor fixo, igual em toda divisão
(`COPA_PAY` em `pyramidseason.tsx`): participação 2 · quartas 4 · semi 8 ·
vice 10 · campeão 30 · artilheiro +16 (caixa) e +10 (piso fixo). A Copa do
Brasil é uma competição BEM maior (100 clubes, 7 fases até o título vindo
da peneira, contra as ~4 da Copa Legends com 16 clubes) — a régua precisa
ter mais degraus e pagar mais no topo, pra refletir o tamanho do desafio.
⚠️ Tabela ajustada 16/08 pro novo funil (seção 1-NOVA: peneira → rodada de
64 → rodada de 32 → oitavas → quartas → semi → final), sem fase de grupos:

| Até onde foi | Copa Legends (hoje) | Copa do Brasil (proposta) |
|---|---|---|
| Caiu na peneira (72→36) | — | 2 |
| Caiu na rodada de 64 | — | 4 |
| Caiu na rodada de 32 | — | 5 |
| Caiu nas oitavas | (junto no "resto": 2) | 6 |
| Caiu nas quartas | 4 | 10 |
| Caiu na semifinal | 8 | 16 |
| Vice (perdeu a final) | 10 | 25 |
| Campeão | 30 | **50** |
| Artilheiro da Copa | +16 caixa / +10 piso | **+10 caixa / +10 piso** (ajustado pelo Diego 15/08) |

Mantém a mesma lógica de hoje: valor FIXO por fase (não escala por
divisão), campeão ganha carta extra pro álbum, artilheiro sobe o piso.
💡 Ideia extra (não decidida ainda): um bônus pontual de "zebra" — moedas
a mais pra quem elimina um time de um Pote mais forte que o seu, prêmio
mecânico pro upset, não só cosmético. Perguntar ao Diego se quer isso.

### 7.1 Supercopa Legends — premiação proposta
Jogo único, então não tem "fase" — só dois resultados possíveis:
- **Vice** (perdeu a Supercopa): 8 moedas.
- **Campeão**: 20 moedas + o troféu conta pro Hall/ranking (posição
  confirmada abaixo, 7.3).

### 7.2 Ordem confirmada: Copa do Brasil primeiro, Supercopa logo atrás
Sequência dentro da MESMA temporada, sem intercalar com a Liga (calendário
já fechado na seção 4): **Liga (38 rodadas) → Copa do Brasil Legends
(todas as fases) → Supercopa Legends (jogo único, usa os 2 campeões que
acabaram de sair)**. A Supercopa só pode rodar depois que a Copa do
Brasil tem um campeão definido — por isso vem por último, não dá pra
inverter a ordem.

### 7.3 Posição no RANKING (local e global) — FECHADO 15/08, esclarecido 16/08
Confirmado pelo Diego: a Supercopa vira um critério PRÓPRIO na fila de
desempate, logo depois da Copa. ⚠️ **Esclarecido 16/08**: a Copa do
Brasil **NÃO é uma competição nova pro histórico/ranking** — é a MESMA
Copa Legends renomeada (mesmo contador de títulos, ninguém perde nada na
troca). Só a Supercopa é nova de verdade. Então a "Copa" NÃO muda de
posição no desempate — só a Supercopa entra como novidade logo depois
dela. Ordem nova (era: Mundo → Série A → Copa Legends → B → C → D →
Várzea → dinheiro):

**🌍 Copa do Mundo → 🏆 Série A → 🏆 Copa (Legends/do Brasil, mesmo
contador) → 🏆 Supercopa → 🏆 Série B → 🏆 Série C → 🏆 Série D → 🏆 Várzea
→ 💰 Dinheiro**

Vale pros DOIS rankings (local `RankingTab` e global `esc_pyramid_rank`) —
os dois sempre andaram juntos desde a mudança do Mundo em 14/08, não faz
sentido separar agora.

## ✅ Especificação FECHADA (15/08) — pronta pra construção
Últimos dois pontos travados pelo Diego:
- **Nome definitivo: Copa do Brasil Legends** (mantém o nome de trabalho,
  sem trocar por outro).
- **Mando de campo das oitavas em diante: sorteio puro** (não é campanha
  acumulada — ver seção 1, "Mando de campo").

Não sobrou nenhuma pendência de DESIGN. Antes de codar: reler o doc
inteiro (protocolo do CLAUDE.md), ir em pedaços/checkpoints (não subir a
substituição da Copa Legends inteira de uma vez — é mudança grande e
mexe em ranking/premiação/telas espalhadas), e mostrar mockup de qualquer
tela nova que ainda não tenha sido aprovada no visual antes de comitar.
