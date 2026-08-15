# 🏆 Copa do Brasil Legends + Supercopa Legends — conceito

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

## 1. Especificação do chaveamento (Copa do Brasil) — texto do Diego, literal
**Estrutura geral**: 64 clubes na chave do mata-mata. Os 16 times da Série
A entram DIRETO na 1ª rodada da chave de 64 (bye, sem jogar fase de
grupos).

**Fase 1 — fase de grupos (peneira inicial)**: objetivo é filtrar os times
menores pra classificar 32. 16 grupos de 5 times (80 times disputando).
Top 2 de cada grupo avança (16×2 = 32 classificados). Sorteio dos grupos:
80 times divididos em **5 potes de força**, cada grupo recebe
obrigatoriamente 1 time de cada pote (equilíbrio).

**Fase 2 — sorteio da chave de 64**: quando os 32 classificados dos grupos
se juntam aos times da elite, a chave de 64 é formada com 2 potes:
- **Pote 1 (Favoritos, 32 times)**: 16 Série A + 16 líderes de grupo (1º
  lugar).
- **Pote 2 (Desafiantes, 32 times)**: 16 times de apoio (ex.: Série B) +
  16 vice-líderes de grupo (2º lugar).
- Sorteio livre entre os potes, sem trava de repetição de grupo.

**Mando de campo**:
- 1ª rodada da chave de 64 (64→32): quem veio do Pote 1 manda o jogo (casa
  no jogo único, ou a volta se for ida-e-volta).
- Das oitavas em diante: mando por melhor campanha acumulada, ou por
  ordem de sorteio puro (decidir na construção — o Diego topou os dois).

**O funil**: 64 → (1ª rodada) → 32 → (oitavas) → 16 → (quartas) → 8 →
(semi) → 4 → (final única) → campeão. A partir de oitavas/quartas isso
vira ida-e-volta reaproveitando 100% o motor que a Copa Legends já tem —
`CopaTie`, `LiveScoreCard`, `PensShootout`, tudo em `pyramidseason.tsx`.
Não é construir do zero.

⚠️ **Conta pendente**: hoje as séries têm ~20 times cada (100 no total).
A conta do Diego usa só 80 na fase de grupos (presumivelmente C+D+V) +
16 Série A de bye + 16 "times de apoio, ex. Série B" de bye direto = 112
times "de origem" mapeados pros 64 vagas — precisa fechar na construção
QUAIS séries exatamente alimentam cada pote/fase (o texto dele usa "ex:
Série B" — não 100% travado que é B, só um exemplo).

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

## 4. 🚧 DECISÃO EM ABERTO — calendário
1. **Sequencial** (recomendação do Claude): depois que Liga termina, na
   mesma temporada — mesma lógica de hoje (Copa Legends já roda assim,
   tacada isolada no fim). Mais seguro: não toca no cálculo de rodada da
   Liga pra ninguém, não esbarra na regra #1 do Diego ("nunca quebrar o
   futebol").
2. **Misturada** (preferência inicial do Diego): rodadas de Copa
   intercaladas nas rodadas da Liga, tipo a Copa do Brasil de verdade
   rodando junto com o Brasileirão. Mais fiel à vida real, mais arriscado
   (mexe no motor de rodadas pra todo mundo). Mesmo comprimida (fases que
   não são suas resolvem nos bastidores), a temporada cresce uns capítulos
   a mais pra quem tá na Série A, mais ainda pra divisão baixa.
👉 Ainda NÃO fechada. Perguntar de novo quando for pra construção.

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

## Pendências antes de codar (nenhuma travada ainda)
- [ ] Fechar calendário: sequencial ou misturada?
- [ ] Fechar exatamente quais séries alimentam cada pote/fase (ver nota
      da "conta pendente" na seção 1)
- [ ] Mando de campo das oitavas em diante: campanha acumulada ou sorteio
      puro?
- [ ] Nome definitivo (Copa do Brasil Legends? outro nome pra não
      confundir com "Legends" já usado em Copa Legends, que está sendo
      substituída?)
