## 16/09/2026 (parte 5) — 🏢 As 4 ideias da SAF DESENHADAS + a quantidade do elenco visual

Diego: *"quero todas ideias pra saf e pro elenco quantidade visual"*.
Material: `node scripts/mockup-saf-ideias.mjs`. **Nada foi codado** — é desenho pra ele
aprovar ou vetar.

### A quantidade do elenco, camisa por camisa
Grade por posição (4-4-2, Série A) nas três opções, com as vagas desenhadas:
bege = elenco próprio · roxo = vaga nova · cinza tracejado = emprestado da SAF (entra
POR CIMA do teto). **Hoje 22 · +1 goleiro 23 · +1 em tudo 27.** A linha do GOL mostra
sozinha o argumento: 2 em todas as 7 formações, contra 8 no MEI.

### As 4 ideias, cada uma como TELA
1. 🌱 **A SAF forma jogador** — painel da SAF com barra de jogos ("24 de 38 · piso 66→71")
   e o cartão da virada ("Kerlon voltou da SAF · piso 66 → 71"). Quem fica no banco lá
   volta quase igual: tem que JOGAR. Reaproveita a mecânica de piso que já existe
   (artilheiro +10). ⚠️ mexe em ficha dentro do save (não no catálogo) e precisa de teto.
2. 🎽 **A SAF é o teto do elenco** — a aba Elenco com bloco próprio "SEU ELENCO 22/22" +
   "🏢 DA SUA SAF · SÉRIE B 2/3", e a escada Várzea 22 → Série A 26. Quase só leitura de
   tela: hoje o emprestado se mistura na lista com um chip "EMP" cinza.
3. 💰 **Emprestar vira dinheiro** — janela de empréstimo com luva por temporada
   (+8 🪙 · +12 🪙). Vira a TERCEIRA saída da crise do caixa no vermelho (a de hoje de
   manhã), sem perder ninguém. ⚠️ medir a régua antes: pouco dinheiro, senão vira torneira.
4. 📰 **A SAF no jornal** — página 2 (que já existe) com "Sua SAF subiu pra Série C",
   "Kerlon foi artilheiro da Série D", "a SAF quase se enrolou". Zero regra nova.

### Ordem recomendada, se ele quiser todas
1º jornal (mais barata, zero regra) · 2º +1 goleiro · 3º bloco da SAF no elenco ·
4º a SAF forma jogador (a que muda o jogo — fazer com calma e com teto) ·
5º a luva (mexe em dinheiro → medir antes).

### Continua pendente
O **+1 em todas as posições** (caminho A). Se ele mandar, MEDIR ANTES o efeito no
tamanho da mesa do leilão (5 cartas a mais por técnico) e na folha salarial.

## 16/09/2026 (parte 4) — 👥🏢 Elenco maior + o que fazer com a SAF (LEVANTAMENTO, nada codado)

Diego: *"poder colocar mais jogadores no elenco… mais um goleiro, mais um meia, mais
um lateral, mais um zagueiro e mais um atacante. Mas o meu problema é esteticamente…
porque também tem a SAF, que pode pegar até quatro emprestados. Tô com medo de ficar
muito exagerado… ou eu limitar a SAF se eu já tiver com o elenco cheio. Mas aí pode
ser que a SAF também não tenha mais sentido ter. E já me fale sobre a SAF também, se
tem alguma ideia nova pra reformular"*.

Material pra ele: `node scripts/mockup-elenco-e-saf.mjs`.

### As regras de hoje (conferidas no código, não de cabeça)
- **Elenco** = `slotsCheio()` em `store.tsx` → `FORMATIONS[f][pos] * 2`. Sempre 22.
- **Empréstimo da SAF** (`estadio.tsx`) = **por lado**, por divisão: D 1 · C 2 · B 3 · A 4.
  **Não é troca** — dá pra pegar sem emprestar. E quem entra vem **por cima** do teto,
  então o teto real na Série A já é **26**, não 22.
- **Troca em campo exige MESMA posição** (`a.pos !== b.pos` → bloqueia).

### 1) Cabe na tela? CABE.
Medido na bancada `scripts/teste-elenco/` (SquadTab de verdade, celular 454px, em PT):
**22 → 2152px · 27 → 2427px (+275) · 31 → 2647px (+495)**. De 2,4 pra 2,7 telas; no teto
com a SAF, 2,9. A lista é em DUAS COLUNAS, então cada jogador novo empurra meia linha.

### 2) O achado: o aperto NÃO é igual em todas as posições
`FORMATIONS[f][pos] * 2` dá **MEI 8** no 4-4-2 (sobra) e **GOL 2** — e **GOL é 2 nas 7
formações do jogo**, sem exceção. Titular machucado + reserva suspenso (ou os dois
cansados, agora que existe gás) = buraco, e **não dá pra pôr zagueiro no gol**. Entra
perna-de-pau, que é o que ele mais odeia.
👉 **+1 no meio resolve um problema que não existe; +1 no gol resolve o único que existe sempre.**

### 3) Três caminhos apresentados
- **A) +1 em cada posição** (27, +4 SAF = 31): é o pedido dele. Mexe na régua "2× a
  formação" que o leilão, o Monte, a base e a SAF usam — o leilão passa a precisar de
  **5 cartas a mais por técnico** na mesa, e a folha cresce.
- **B) só +1 goleiro** (23, +4 SAF = 27): +55px. **Foi a minha recomendação.**
- **C) não mexe; a SAF é o caminho de passar de 22.** Custo zero.

### 4) A SAF — o medo dele TEM fundo
Hoje quase todo mundo só **PEGA** da SAF; ninguém manda ninguém pra lá. Se o elenco
sobe pra 27, sobra mais gente própria e **cai o motivo de pegar emprestado**:
**aumentar o elenco enfraquece a SAF de graça.** Ideias oferecidas:
1. 🌱 **A SAF FORMA jogador** (recomendada): quem passa uma temporada jogando NA SAF
   volta com o piso maior — mecânica que JÁ existe no jogo (o artilheiro sobe +10 de
   piso). Emprestar vira investimento, e o valor da SAF para de depender do tamanho
   do elenco. Custo médio.
2. 🎽 **A SAF é o teto do elenco** (= caminho C visto do lado dela). Custo zero.
3. 💰 **Emprestar vira dinheiro**: luva por temporada. Hoje é de graça dos dois lados.
4. 📰 **A SAF aparece no jornal** (página 2 já existe): "sua SAF subiu pra Série C".

### Estado
**NADA foi codado.** Esperando ele escolher. Se ele pedir o caminho A, o passo seguinte
é MEDIR o efeito no tamanho da mesa do leilão e na folha salarial ANTES de mexer.

