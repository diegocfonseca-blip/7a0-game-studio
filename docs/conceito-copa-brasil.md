# 🏆 Copa do Brasil Legends — conceito (RASCUNHO, ainda em discussão)

> Brainstorm com o Diego em 14/08/2026 — **NADA aqui está aprovado pra
> codar**. É só pra não perder o fio da meada entre sessões (protocolo de
> memória do CLAUDE.md). Antes de escrever qualquer linha de código disto,
> reler este doc inteiro e confirmar com o Diego que ainda vale.

## A ideia
Uma 3ª competição da carreira. Hoje a carreira tem:
1. **Liga** (Séries A/B/C/D/V, pontos corridos)
2. **Copa Legends** (mata-mata só com o G4 de CADA série — 16 times)

A Copa do Brasil seria um chaveamento **aberto pra todo mundo** (da Série A
até a Série V/várzea) — o contraste com a Copa Legends é justamente esse:
lá só entra quem já tá bem na Liga, aqui entra TODO MUNDO, favorecendo a
zebra.

## A regra de ouro puxada da Copa do Brasil de verdade
Nas fases iniciais, **empate favorece o time de divisão mais baixa**
(mesmo critério de desempate do torneio real) — é a máquina de fabricar
zebra: "time de várzea elimina gigante da Série A com um 0×0". Bate direto
com o gosto do Diego por zebra (giro da rodada já tem essa categoria de
notícia).

## Formato do chaveiro (rascunho)
- ~100 times (5 séries × 20 cada, número exato depende do tamanho real de
  cada série hoje).
- **Fases iniciais**: só Série V/D/C se enfrentando, jogo único, empate
  favorece o de baixo.
- **Fase intermediária**: Série B entra (sugestão do Claude 14/08: nas
  quartas).
- **Fase final**: Série A entra de bye (sugestão do Claude 14/08: nas
  oitavas) — igual clube grande de verdade, que só estreia depois que os
  menores já se decantaram. Diego perguntou se vale a pena dar essa
  vantagem pra A/B: SIM, é o que sustenta a emoção da zebra (upset só dói
  gostoso quando o favorito tinha vantagem e caiu mesmo assim) — mas sem
  dar bye ATÉ A FINAL, senão quem joga Série A só disputa 2 jogos de Copa
  no total (pouco pra chamar de competição). Com A nas oitavas e B nas
  quartas, cada um pega uns 3-4 jogos reais — parecido em quantidade com a
  Copa Legends de hoje. Ainda não é decisão FINAL, é recomendação.
- **A partir de oitavas/quartas**: vira ida-e-volta, reaproveitando 100% o
  motor que a Copa Legends já tem — `CopaTie`, `LiveScoreCard`,
  `PensShootout`, tudo em `pyramidseason.tsx`. Não é construir do zero.
- Fases que não envolvem o SEU time resolvem sozinhas (igual a Liga já faz
  hoje com os outros 19 times da sua série — só o seu jogo anima de
  verdade). O resto vira manchete de zebra no giro da rodada. Só quando
  chega a vez do seu time é que vira tela de verdade, com tática e tudo.

## 🚧 DECISÃO EM ABERTO — calendário (NENHUMA opção fechada ainda)
1. **Sequencial** (recomendação do Claude, 14/08): depois que Liga + Copa
   Legends + Supercopa terminam na mesma temporada — mesma lógica de hoje
   (Copa Legends já roda assim, tacada isolada no fim). Mais seguro: não
   toca no cálculo de rodada da Liga pra ninguém, então não esbarra na
   regra #1 do Diego ("nunca quebrar o futebol").
2. **Misturada** (preferência inicial do Diego): rodadas de Copa
   intercaladas nas rodadas da Liga, tipo a Copa do Brasil de verdade
   rodando junto com o Brasileirão. Mais fiel à vida real, mas mexe direto
   no motor de rodadas pra TODO MUNDO — mais arriscado. Mesmo comprimida
   (fases que não são suas resolvem nos bastidores, sem tomar rodada do
   calendário), a temporada cresce uns 3-4 capítulos pra quem tá na Série A
   (mais pra quem tá numa divisão baixa, já que a campanha dele começa mais
   cedo no chaveamento).
👉 Perguntar de novo pro Diego quando for pra construção de verdade.

## Relação com a Supercopa (outra ideia do mesmo brainstorm)
A Supercopa (campeão da Liga × campeão da Copa daquela temporada) deve ser
montada de forma **genérica** — um parâmetro "campeão da copa da vez", não
hard-coded pra Copa Legends especificamente. Assim, se a Copa do Brasil
nascer depois, é só trocar quem entra nesse espaço (bate com a Supercopa do
Brasil de verdade: Brasileirão × Copa do Brasil, não Brasileirão × copa
interna). A Copa Legends viraria um troféu à parte, sem Supercopa vinculada
a ela. Se o 1º lugar da Série A ganhar Liga E Copa no mesmo ano, o 2º lugar
da Série A joga a Supercopa no lugar dele.

## Pendências antes de codar (nenhuma resolvida ainda)
- [ ] Fechar calendário: sequencial ou misturada?
- [ ] Confirmar se TODAS as séries entram ou só até uma certa divisão
- [ ] Final: jogo único ou ida-e-volta?
- [ ] Mockup da tela ANTES de qualquer código (regra de ouro do Diego:
      visual novo precisa de OK dele antes de commitar)
- [ ] Nome definitivo (Copa do Brasil Legends? outro nome pra não confundir
      com o "Legends" já usado em Copa Legends?)
