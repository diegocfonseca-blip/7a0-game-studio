## 16/09/2026 (parte 7) — 🕳️ "Ficou um buraco na esquerda" (duas saídas, ele escolhe)

Diego, olhando a tela real do elenco de 27: *"não sei se gostei pq ficou um buraco na
esquerda"*. Ele está certo, e a causa é estrutural: as duas colunas da lista são
**FIXAS** (⭐ Titulares | 🔁 Reservas). Com 27, os titulares continuam **11** e os
reservas viram **16** — a esquerda acaba antes e sobra vazio verde.

Material: `node scripts/mockup-buraco-elenco.mjs`.
Rascunho (não commitado no jogo): `docs/rascunhos/2026-09-16-elenco-27-e-bloco-saf.patch`,
agora com `layoutListas?: 'hoje' | 'empilhado' | 'transbordo'` em `ElencoField`/`SquadTab`.
A bancada aceita `?layout=` pra ver as três: `/scripts/teste-elenco/index.html?n=27&layout=transbordo`

### As duas saídas, medidas na tela real (454px, PT)
| layout | elenco 27 | elenco 22 (o que está no ar) |
|---|---|---|
| como está | 2427px | 2152px |
| **transbordo** | **2339px** (−88) | **2152px — IDÊNTICO** |
| empilhado | 2350px (−77) | 2240px (**+88**) |

- **transbordo** = o reserva que não cabe **continua na coluna da esquerda**, embaixo dos
  titulares, com um risquinho `🔁 RESERVAS (CONTINUA)`. Nada some, nada muda de lugar.
- **empilhado** = cada lista ocupa a largura toda em 2 colunas próprias (titulares em
  cima, reservas embaixo). Título mais legível.

### 👉 Recomendado: TRANSBORDO — e o motivo é o número da direita
No elenco de **22**, que é o que está no ar pra todo mundo, o transbordo dá **2152px,
exatamente igual** ao de hoje: com 11 e 11 as colunas já batem, então a conta
(`porColuna - titulares.length`) dá 0 e **o risquinho nem aparece**. Ele só entra em ação
quando o elenco cresce — que é quando o buraco existiria.
O **empilhado** custa **+88px na tela de TODO MUNDO**, inclusive de quem nunca vai querer
elenco maior. Por isso é a 2ª opção.

### O que isso muda na decisão do elenco
O buraco **deixa de ser motivo** pra não fazer o +1 por posição: com transbordo, 27 fica
mais curto (2339) que 27 de hoje (2427). **Mas o que continua de pé** é o que já estava
anotado na parte 6: o meio-campo vira **9** (já sobrava com 8) e o leilão passa a precisar
de **5 cartas a mais por técnico** na mesa. **MEDIR ANTES.**

### Estado
Nada no ar. Esperando ele dizer qual layout quer.

## 16/09/2026 (parte 6) — 👥🏢 A tela DE VERDADE: +1 por posição e a SAF em bloco

Diego: *"e como ficaria real com um jogador a mais por posição a imagem do elenco…
e a SAF com bloco à parte?"*. Então saiu do desenho e foi pra tela real.

### ⛔ O rascunho NÃO está no código do jogo
Mora em **`docs/rascunhos/2026-09-16-elenco-27-e-bloco-saf.patch`**.
Ligar quando ele aprovar: `git apply docs/rascunhos/2026-09-16-elenco-27-e-bloco-saf.patch`
Material pro post: `node scripts/mockup-elenco-real.mjs`.

### O que o rascunho faz (2 mudanças)
1. **`slotsCheio()` em store.tsx**: `baseSlots * 2` → `baseSlots * 2 + 1` (elenco 22 → 27).
2. **`ElencoField` em pyramidseason.tsx**: o emprestado sai da lista de reservas
   (`reserves` agora filtra `!c.emprestado`) e ganha **bloco próprio** no pé da tela —
   cinza-ardósia, duas colunas, contador de vagas da divisão (`4/4`) e a frase
   *"eles jogam por você, mas são da sua SAF — não ocupam vaga do seu elenco"*.
   Props novas `safDiv` / `safSlots`, passadas por `SquadTab`.

### Medido na tela real (SquadTab de verdade, celular 454px, em PT)
| | rolagem | titulares | reservas | bloco SAF |
|---|---|---|---|---|
| hoje (22) | 2152px · 2,4 telas | 11 | 11 | — |
| +1 por posição (27) | 2427px · 2,7 telas | 11 | **16** | — |
| 27 + 4 da SAF (31) | 2630px · 2,9 telas | 11 | 16 | **4/4** |

**O campinho não muda em nada** — são sempre os 11 da formação. Todo o crescimento é
na coluna da direita. E tirar os emprestados da lista deixa a coluna de reservas
**mais curta** do que se eles ficassem misturados.

### 🐛 Consertado de lambuja: a bancada montava o XI errado
`scripts/teste-elenco/main.tsx` usava `squad.slice(0, 11)` como titulares — o que punha
**3 goleiros em campo** e deixava o campinho com cara de bug. Quem olhasse o print ia
achar que o JOGO estava quebrado. Agora o XI sai por posição (4-4-2), como o jogo escala.
Isso é conserto de bancada e **foi commitado** (não é visual do jogo).

### O que continua ABERTO
O **+1 por posição** mexe na régua "2× a formação", que **não é só do elenco**: o leilão
usa pra saber quantas cartas pôr na mesa, o Monte pra ordenar quem escolhe, a base pra
saber se cabe guri. Na tela custa 5 linhas; **no jogo custa 5 cartas a mais por técnico
na mesa do leilão** e folha salarial maior. **MEDIR ANTES de soltar.**
O **bloco da SAF**, esse, melhora a tela mesmo SEM mexer no tamanho do elenco.

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

