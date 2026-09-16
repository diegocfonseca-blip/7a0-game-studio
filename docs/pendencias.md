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

