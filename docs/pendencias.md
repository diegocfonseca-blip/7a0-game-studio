## 16/09/2026 (parte 14) — 🖥️ "O campinho ficou pequeno pro espaço?" — sim, era o do CELULAR

Diego, olhando o desktop: *"mas o campinho ficou mt pequeno pro espaço que tem, não? Ou
ele tá do tamanho q sempre foi??"*.

**Resposta: estava do tamanho de sempre — o do celular.** Eu tinha feito o erro clássico
de responsivo mal feito: **cresci a COLUNA e deixei o CONTEÚDO dela igual**. A coluna do
campo tinha 330px de 980 (34%) com o rosto em 44px, que é a medida do telefone.

**Consertado** (`scripts/mockup-elenco-final.mjs`): no desktop o campo passa a ocupar
**480px de 1120 (~45%)** e o rosto vai de **44 → 64px**; o campinho ganhou linha de meio
de campo e círculo central proporcionais. **No celular nada mudou** — lá o tamanho já
estava certo.

### 📌 Lição pro repo (vale pra QUALQUER tela nova de desktop)
`checa-telas.mjs` já garante que a tela não fica presa em 384px no PC. Mas ele olha a
**caixa**, não o **conteúdo**. Uma tela pode passar no guarda e ainda assim ser "o celular
esticado". Quando desenhar desktop, perguntar: **o que dentro da coluna também deveria
crescer?** (aqui: o rosto, o gap entre linhas, a espessura das linhas do campo).

## 16/09/2026 (parte 13) — 👥 A ABA ELENCO FECHADA NO DESENHO (desktop lado a lado · celular empilhado)

Ordem do Diego: *"talvez p desktop vc deixa lateral o campo e a lista lateral ao campo…
e dispositivo móvel deixe o campo em cima e lista dos jogadores embaixo… e c esses dados
assim. Faça agora c seu visual, sem pôr gols no campinho e assistência no campinho tb,
pq a pessoa já vê na lista"*.
Material: `node scripts/mockup-elenco-final.mjs`. **Desenho, nada codado.**

### ⚠️ Duas correções que ELE fez em mim (anotar, pra não repetir)
1. **O campinho mostra ROSTO, não camisa com número.** Eu tinha copiado a camisa da
   referência. Os rostos existem no repo: `src/escalacao/legend-avatars.json` →
   **157 avatares** em `public/avatars/lendas-v1/`. O mockup agora usa os de verdade.
   Lição: **antes de desenhar peça do jogo, procurar a peça no repo.**
2. **Sem selo de gol/assistência no campinho** — e o motivo dele é melhor que o meu:
   agora GOLS e ASS são **coluna da tabela**, com o número de todo mundo alinhado; o
   selo virava repetição. (A régua de ontem — campinho = história, lista = operação —
   continua válida: a lista passou a dar conta da história também.)
3. A barrinha de gás ganhou **6px + borda + número**; no tracinho de 4px ela sumia.

### O layout fechado
- **Desktop**: campo à ESQUERDA (330px) · tabela à DIREITA · barra do selecionado FIXA no
  pé · atalhos Comissão/Base/SAF embaixo do campo · abas do topo
  ELENCO/TÁTICA/COMISSÃO/NÚMEROS/CONQUISTAS.
- **Celular**: campo EM CIMA · abas TITULARES/RESERVAS/SAF · tabela EMBAIXO · barra do
  selecionado no pé (peça PRÓPRIA — a do desktop não cabe no estreito, vira sopa).
- **Colunas**: Nº · NOME (clube · ano) · POS · NÍVEL · JOGOS · GOLS · ASS · GÁS · STATUS.
- **Barra do selecionado** (o "Aldair preto" que ele gostou): jogos · gols · ass · gás ·
  valor · salário · contrato + a faixa do que está acontecendo + botão DETALHES.

### ⛔ O GER continua fora (decisão mantida)
A referência tem coluna GER (overall) = **perk pago do olheiro**. A coluna é **NÍVEL**
(🪵🎯💎⭐👑) e, pra quem TEM olheiro, o número aparece **no lugar do selo**, na mesma
coluna. Ninguém perde nada e a loja continua de pé.

### De onde vem cada dado (tudo já existe)
jogos → `condicao.jogos[id]` · gols/ass → `goals`/`assists` · gás e volta de lesão →
`condicao` · valor → `c.paid` · contrato → `c.contratoAte` · nível → `c.fame` ·
bio → `c.bio` · salário = piso ÷ 10.

### Estado
**Nada codado.** Próximo passo, já oferecido: montar DE VERDADE com o elenco real dele.

## 16/09/2026 (parte 12) — ⚽🅰️ Gol e assistência no campinho do layout novo: cabe?

Diego: *"gostei, porém teria q continuar mostrando gols e assistência tb no campinho.
Daria ou ficaria MT informação???"*.
Material: `node scripts/mockup-campinho-gols.mjs`. **Desenho, nada codado.**

### Resposta: cabe — e a prova é o PIOR CASO
Não dá pra responder "fica muita informação?" com a tela vazia, então o material mostra
**três momentos da mesma temporada**, contando os selos:
- **Rodada 1 → 0 selos.** O campo é só o time. Os selos só existem com número > 0.
- **Rodada 19 → 13 selos.**
- **Rodada 38 → 21 selos** — e esse é o teto prático (máximo absoluto 22: 2 por jogador
  × 11, que nem acontece porque zagueiro e goleiro quase não pontuam).
👉 A tela mais cheia possível tem **21 selinhos de 8px, nos cantos, sem encostar em nome
nenhum**.

### Por que cabe (o desenho, não a sorte)
- Selos no canto de **CIMA** da camisa; o nome fica **embaixo**. Nunca disputam espaço.
- São **dois no máximo**, empilhados — e sem gol a assistência **sobe** pro lugar de cima
  (regra dele de 24/08, já no código).
- São a **única coisa colorida** sobre a camisa, então o olho vai direto neles.

### 🔧 O ajuste necessário (achado ao desenhar)
No código hoje os selos ficam **pendurados 10px pra fora** da camisa (`right: -10` em
`jogadorcampo.tsx`). No campinho do layout novo, com 4 meias na mesma linha, eles
**encostam no vizinho**. No desenho ficaram em `right: -7, top: -5` — mesmo tamanho e
mesma cor, só não invadem mais o colega.

### 🎯 E isto FECHA a conversa do gás, com uma régua
Os dois selos dizem **o que o jogador FEZ** (gol, assistência = história, orgulho).
O gás diz **como ele ESTÁ** (estado, operação, decisão da próxima rodada).
👉 **O campinho é o lugar da HISTÓRIA; a lista é o lugar da OPERAÇÃO.**
Por isso gol e assistência ficam e o gás não — e por isso a ordem dele de 12/09
(*"não quero no campinho, só onde tem a listagem"*) **estava certa desde o começo**, só
não tinha sido dito o porquê. Guardar essa régua: serve pra decidir o que entra no
campinho daqui pra frente, sem ter que perguntar caso a caso.

### Estado
Nada codado. Se o layout for aprovado, os selos entram junto — são os mesmos de hoje,
reposicionados 3px pra dentro.

## 16/09/2026 (parte 11) — 👥⚡ O elenco de 31 no layout novo + "como se vê o gás dos titulares?"

Diego: *"eu teria q ver a foto de +1 por posição q dá 5 e +4 da saf pra ver como fica…
E como q vê a energia dos titulares? No campo? N sei…"*.
Material: `node scripts/mockup-elenco-31-e-gas.mjs`. **Desenho, nada codado.**

### A conta de 31 (4-4-2, +1 por posição)
`GOL 3 · LAT 5 · ZAG 5 · MEI 9 · ATA 5 = 27` · titulares 11 → **reservas 16** · +4 da SAF
= **31 na tela**. No layout campo|lista isso vira **três abas** sobre uma tabela:
`⭐ TITULARES (11)` · `🔁 RESERVAS (16)` · `🏢 SAF (4)`.

### 🔑 A pergunta dele achou o FURO do layout
Se **só uma lista aparece por vez**, quem está vendo os reservas **não vê o gás dos
titulares**. Isso é um defeito real do layout da referência, e não tinha sido notado por
mim — foi ele que achou. Anotar: **toda vez que um layout esconde metade da informação,
perguntar "e a parte escondida, quando é que ela importa?"**.

### ⚠️ E tem uma ORDEM DELE no meio (12/09, está no código com as palavras dele)
`pyramidseason.tsx`: *"não quero que apareça no campinho, só onde tem a listagem"*.
Então as três opções foram apresentadas com isso na mesa:
1. **A aba TITULARES mostra o gás** — já resolve, e respeita a regra. Bônus: hoje é PIOR,
   porque a lista de titulares é a coluna estreita da esquerda; no layout novo ela ocupa
   a largura toda.
2. **Faixa de aviso em cima do campinho** (⚡ "1 no vermelho (Edmundo 🥵) · 3 no amarelo ·
   VER") — **recomendada junto com a 1**. Não põe gás no campinho (respeita a regra), mas
   avisa que existe problema, e o VER pula pra lista filtrada. Resolve o caso REAL: ele não
   quer olhar o gás de 11, quer saber **se tem alguém ruim**.
3. **Gás embaixo da camisa no campinho** — desenhado, mas marcado como
   **"PRECISA VOCÊ MUDAR DE IDEIA"**, porque contraria a ordem dele. Minha opinião dada:
   ele tinha razão — 11 barrinhas transformam o campinho em painel de indicadores.

### 📐 A conta de altura com 31
A maior das três listas é a de reservas (16 linhas). Como **só uma aparece por vez**, a
tela tem sempre a altura da MAIOR, não a soma: **31 jogadores cabem na mesma altura que
os 16 reservas de hoje**. E se o elenco crescer de novo, a tela **não cresce junto** — só
a rolagem de dentro da tabela.

### Estado
Nada codado. Próximo passo oferecido: montar de verdade, com o elenco real dele.

## 16/09/2026 (parte 10) — 👥 O elenco no estilo da REFERÊNCIA que ele mandou

Diego mandou o print de um jogo de futebol (tela "MEU TIME · ESCALAÇÃO E ELENCO",
escura/cromada, campinho à esquerda com só os 11 e tabela de reservas à direita):
*"e algo inspirado nisso aqui, claro q no nosso padrão de arte. Os reservas de um lado
e no campinho só os titulares e etc"*.

Material: `node scripts/mockup-elenco-referencia.mjs`. **Desenho, nada codado.**

### 🔑 Por que a referência dele é MELHOR que as minhas duas saídas
Transbordo e empilhado tentavam **consertar** o problema de duas listas de tamanhos
diferentes na mesma linha. A referência **não tem esse problema**: troca o par
`titulares | reservas` pelo par **`campo | lista`**. Não são duas listas competindo, são
duas coisas diferentes — **nunca sobra buraco**, e o elenco pode ir a 27 que a tabela só
ganha linha. Anotar isso: quando o layout tem o problema embutido, **trocar o par** é
melhor que remendar.

### O que peguei dela
- No campinho, **só os 11** (já é assim hoje — a referência confirma).
- A lista vira **TABELA densa**: Nº · camisa · nome · POS · nível · gás.
- Botão **TITULARES / RESERVAS** em cima da tabela (uma lista por vez).
- Comissão técnica no pé.

### O que mudei, e por quê
- **Sem as setas "PARA RESERVAS / PARA TITULARES"**: o nosso jogo troca por toque-toque,
  que é mais rápido no celular e ele já aprovou. As setas existem lá porque é jogo de mouse.
- **No CELULAR, um em cima do outro** (430px não comporta campinho em metade da tela);
  **lado a lado só no PC**, onde hoje o jogo desperdiça mais da metade do monitor
  (~620px de 1440).
- **O jogador tocado mostra a CARTA dele**, não ficha genérica de atributos — a carta
  colecionável já existe no jogo.

### ⛔ O que NÃO dá pra copiar (achado importante)
A coluna **"GER"** (overall de cada jogador). No nosso jogo isso é **perk pago**:
`olheiros` + tier (⭐ Craque vê até craque · 👑 Lenda vê tudo, ver `ElencoField`).
Pôr o número pra todo mundo **entrega de graça o que a loja vende**.
👉 Na versão desenhada a coluna mostra o **NÍVEL** (🪵🎯💎⭐👑), que todo mundo já vê, e
o **número** aparece no lugar do selo só pra quem tem olheiro. Mesma tabela, sem furar a loja.

### Estado
Nada codado. Próximo passo oferecido: montar a tela DE VERDADE com o elenco real dele
(como já foi feito com o bloco da SAF e com o transbordo) antes de qualquer commit.

## 16/09/2026 (parte 9) — 👥 A aba ELENCO refeita do zero (OPINIÃO, corrigindo a parte 8)

⚠️ **Correção de leitura minha**: na parte 8 ele perguntou *"e se fosse reformular na sua
cabeça todo visual"* e eu respondi do JOGO INTEIRO. Ele corrigiu: *"eu falei do elenco,
cara, que a gente tava falando"*. Era a **aba Elenco**. Lição: quando a conversa está
num assunto há várias mensagens, "todo visual" quer dizer **o visual DAQUILO**.

Material: `node scripts/mockup-elenco-do-zero.mjs`. **Opinião, nada codado.**

### A pergunta antes do desenho: pra que serve a aba?
Ela faz **três** trabalhos: **escalar** (quem joga a próxima) · **conhecer** (quem eu
tenho e como está) · **gerir** (técnico, preparador, base, folha, agência). Hoje eles vêm
**intercalados**: campinho → Depto Técnico → Base → folha → e só então a lista. Quem
entrou pra trocar um jogador **atravessa a gerência no caminho**.

### Os 5 pontos
1. **Agrupar por POSIÇÃO, não por titular/reserva.** Um bloco por setor (GOL/LAT/ZAG/
   MEI/ATA), bolinha cheia = titular, vazia = reserva. Motivo forte: **a troca do jogo já
   exige a mesma posição** (`a.pos !== b.pos` bloqueia), então a tela passa a falar a
   língua da regra. Técnico não pensa "quem é reserva", pensa "quem substitui meu goleiro".
2. **A escassez aparece sozinha**: o contador vai no título do setor — `GOLEIROS 2`, em
   vermelho quando está no osso. O problema dos 2 goleiros vira óbvio sem texto.
3. **Uma linha diz tudo do jogador**: nome · clube·ano · barra de gás · selo (🚑 😓 🔄 SAF).
4. **A gerência sai do meio do caminho**: Depto Técnico, Base e Agenciados viram três
   atalhos pequenos no pé, com o número que importa.
5. **O buraco nem existe**: cada setor é um bloco de 2 colunas, então no máximo sobra
   meia linha num setor ímpar.

### 🔑 A conta que amarra tudo (é o que fecha a conversa do elenco maior)
Hoje a lista são **16 linhas** (a coluna mais comprida) + 2 títulos.
Agrupada por posição: **11 linhas** + 5 títulos, **sem buraco**.
Com elenco de **27**: **14 linhas** + 5 títulos — ainda **menos** que as 16 de hoje com 22.
👉 **A mesma mudança que deixa a tela mais fácil também abre espaço pro elenco maior.**
Ele não precisa escolher entre as duas coisas.

### Estado
Nada codado. Ofereci montar a tela de VERDADE com o elenco real dele (como fiz com o
bloco da SAF e com o transbordo) antes de qualquer decisão.

## 16/09/2026 (parte 8) — 🎨 "Se fosse você, como reformularia o visual?" (OPINIÃO)

Diego: *"e se fosse reformular na sua cabeça todo visual sem ser influenciado por mim,
como vc faria?"*. Material: `node scripts/mockup-se-fosse-eu.mjs`.
**É opinião, está marcada como opinião, e nada foi codado.**

### A tese
**Não trocaria o estilo — trocaria a HIERARQUIA.** A identidade (creme, borda preta
grossa, sombra dura, Oswald) é patrimônio: quase todo jogo de celular parece o mesmo
app cinza, e este parece álbum de figurinha. O problema é que ela está aplicada em
TUDO IGUAL — a faixa "Torcida 45%" tem a mesma borda, a mesma sombra e o mesmo peso do
jogo ao vivo. Quando tudo grita, nada é ouvido.

### Os 6 princípios (com a tela redesenhada da aba Jogos, lado a lado com a real)
1. **Três pesos de superfície, não um** — moldura+sombra só no HERÓI; contexto vira
   linha lisa; ajuste vira texto. ⭐ **É a que eu faria se pudesse fazer só uma**: não é
   redesenho, é RÉGUA, e melhora toda tela junto, inclusive as que ainda não existem.
2. **Uma tela, um assunto** — a 1ª tela de cada aba responde UMA pergunta; o resto é um
   toque, não um rolar ("ver a tabela inteira →" em vez de 100 linhas).
3. **O botão mora sempre no mesmo lugar** — barra de ação fixa no pé, acima das abas; só
   o rótulo muda (Começar a temporada · Próxima rodada · Decida quem fica).
4. **O dourado só pode querer dizer UMA coisa** — hoje é tier 👑 E botão E destaque E
   moeda. Dourado = identidade de quem você é; botão vira verde. Reforça a regra dele de
   "cor é sagrada" em vez de enfraquecer.
5. **Oswald é para número e título** — parágrafo em fonte de sistema, caixa normal.
6. **O vazio trabalha** — borda 2px/sombra 2px no secundário encolheria ~20% de toda tela.

### E o ELENCO POR POSIÇÃO (a mudança que eu mais defenderia)
Hoje são duas colunas (titulares | reservas) e a pessoa **filtra por posição com o olho**.
Técnico não pensa "quem é reserva" — pensa **"quem substitui meu goleiro?"**. Agrupado por
setor (GOL/LAT/ZAG/MEI/ATA) com bolinha cheia = titular, o problema dos **2 goleiros**
aparece sozinho na tela, sem precisar de texto explicando.

### Onde eu discordo dele — dito na cara (e ele pediu assim)
1. **A caixa grande de "criar conta"** (que ELE pediu chamativa em 21/08): é a 1ª coisa
   das 5 abas e só some pra quem JÁ fez conta — quem mais joga sem conta é quem mais
   apanha dela. Eu faria discreta no dia a dia e GRANDE uma vez, na hora que dói (acabou
   de ser campeão e a carta só existe com conta).
2. **A faixa do Desbloquear**: aparece em toda aba de toda rodada e TIRA do jogo. Uma vez
   por temporada, como modal. A regra de ouro dele é "nada atrasa o ritmo".
3. **O estádio sagrado**: concordo com a regra, discordo da execução — hoje ele começa em
   y=740. A regra está certa; falta ela valer na prática.

### O que eu jamais tocaria, mesmo com carta branca
Paleta · Oswald · sombra dura · campinho · desenho do estádio · zoeira dos textos.
O jogo tem cara própria, que é a coisa mais difícil de conseguir. O trabalho seria
**fazer essa cara aparecer mais, usando ela menos.**

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

