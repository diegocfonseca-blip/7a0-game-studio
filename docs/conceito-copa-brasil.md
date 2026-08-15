# 🏆 Copa do Brasil Legends + Supercopa Legends — conceito

## 🚧 Status da construção (15/08)
Indo "em pedaços", como o Diego pediu:
1. ✅ **Placar com goleadores** — no ar (ver `docs/pendencias.md`).
2. ✅ **Motor do chaveamento** — `src/escalacao/copa-brasil.ts`, construído
   e TESTADO isolado (harness Node com Vite SSR, 30 temporadas sintéticas,
   421 verificações, 0 falhas — grupos fecham matematicamente, 1ª rodada
   sem time duplicado, funil de tamanhos certo, zebra só quando é
   realmente empate, premiação paga o campeão certo). **AINDA NÃO ligado
   ao jogo** — ninguém chama essa função de lugar nenhum ainda, zero risco
   pro que já está no ar.
3. ✅ **Motor LIGADO ao jogo** — mas atrás de trava por conta
   (`COPA_BRASIL_TESTERS` em `sport.ts`, só `diego.c.fonseca@gmail.com`);
   pra todo mundo continua 100% Copa Legends. Reaproveita a tela inteira
   da Copa Legends via 2 adaptadores (`copaBrasilAsCopaResult` /
   `copaBrasilRewardsAsCopaRewards`) — zero UI nova reescrita, zero risco
   pra quem não está na lista. Testado: `tsc -b`+`build` limpos, harness
   novo confirma a forma do dado (261 verificações, 0 falhas).
4. ⏳ Falta: tela da fase de grupos/potes (a peneira já roda e paga
   certo, mas ainda não tem NENHUMA tela mostrando os grupos — pula
   direto pra chave de 64), ranking (Copa do Brasil ainda soma no mesmo
   contador da Copa Legends, e o ranking GLOBAL vive no banco Supabase,
   fora deste repo), Supercopa Legends (não existe ainda).

⚠️ **Duas contas que não fechavam sozinhas na especificação do Diego —
resolvidas com uma escolha minha, sinalizando pra ele conferir**:
- A pirâmide tem **100 clubes de verdade** (20 por série), mas a conta do
  Diego precisa de **96**. Escolhi excluir os **4 últimos da Várzea**
  (constante `VARZEA_EXCLUI_ULTIMOS` em `copa-brasil.ts` — fácil de mudar).
- O funil original pula uma fase: "Semifinal: 8 clubes → sobram 4" seguido
  direto de "Final entre os 2 finalistas" — falta o passo que reduz de 4
  pra 2. Completei com a nomenclatura padrão (oitavas=16 · quartas=8 ·
  semifinal=4 · final=2) e nomeei a fase que faltava de **"Rodada dos
  32"**. Também precisou de mais um degrau na premiação (`CB_PAY.r32 = 5`,
  entre o valor da 1ª rodada e o das oitavas).

> Decidido com o Diego em 14-15/08/2026, em cima de um brainstorm. A
> **especificação do chaveamento (seção 1) veio pronta do próprio Diego,
> por escrito** — é a fonte de verdade, não inventar variação. O resto
> (potes de força, calendário, cores) foi decidido junto no chat. Mockup
> de tabela/potes/funil/placar já mostrado e aprovado no visual (ver
> `scratchpad` da sessão — replicar essa forma quando for construir).
> **AINDA NÃO CODAR** sem reconfirmar com o Diego — este doc é memória
> entre sessões (protocolo do CLAUDE.md), não uma ordem de serviço.

## A ideia geral
Hoje a carreira tem Liga (Séries A/B/C/D/V) + Copa Legends (mata-mata só
com o G4 de cada série, 16 times). A **Copa do Brasil Legends SUBSTITUI a
Copa Legends** — chaveamento aberto, favorecendo zebra, com 64 times na
chave principal. Depois dela, mais uma novidade: a **Supercopa Legends**
(Liga × Copa do Brasil), jogo único.

## 1. Especificação do chaveamento (Copa do Brasil) — FECHADA (96 clubes, 15/08)
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

## 7. Premiação — proposta (15/08, baseada na régua real da Copa Legends)
A Copa Legends hoje paga por FASE, valor fixo, igual em toda divisão
(`COPA_PAY` em `pyramidseason.tsx`): participação 2 · quartas 4 · semi 8 ·
vice 10 · campeão 30 · artilheiro +16 (caixa) e +10 (piso fixo). A Copa do
Brasil é uma competição BEM maior (96 clubes, 6 fases até o título vindo
da peneira, contra as ~4 da Copa Legends com 16 clubes) — a régua precisa
ter mais degraus e pagar mais no topo, pra refletir o tamanho do desafio:

| Até onde foi | Copa Legends (hoje) | Copa do Brasil (proposta) |
|---|---|---|
| Caiu na fase de grupos | — | 2 |
| Caiu na 1ª rodada da chave de 64 | — | 4 |
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

### 7.3 Posição no RANKING (local e global) — FECHADO 15/08
Confirmado pelo Diego: a Supercopa vira um critério PRÓPRIO na fila de
desempate, logo depois da Copa do Brasil. Ordem nova (era: Mundo → Série A
→ Copa Legends → B → C → D → Várzea → dinheiro):

**🌍 Copa do Mundo → 🏆 Série A → 🏆 Copa do Brasil → 🏆 Supercopa → 🏆 Série B
→ 🏆 Série C → 🏆 Série D → 🏆 Várzea → 💰 Dinheiro**

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
