# 🛍️ LOJA DO CLUBE — proposta (15/09/2026)

⛔ **NADA DISSO ESTÁ NO JOGO.** Este documento é o planejamento pedido pelo Diego
em 15/09: *"me mande todo planejamento e proposta da loja do clube com patrocínio
de material e vendas de camisas e arte da camisa na loja"*. Só o gerador do
mockup (`scripts/mockup-loja-clube.mjs`) subiu pra main. Esperando o OK dele.

Referência de arte que ele mandou: a camisa do Internacional de Madrid (escudo no
peito esquerdo, marca no peito direito, patrocínio no centro abaixo do peito).

---

## 1. O problema que isso resolve

Medido em 14/09, amostra de 356 carreiras ativas:

| Série | Folha mediana | Caixa mediano | Sem caixa nem pra 1 folha |
|---|---|---|---|
| A | 123 | 881 | 24% |
| B | 33 | 32 | 43% |
| C | 27 | 53 | 37% |
| D | 23 | 36 | 39% |
| Várzea | 10 | 59 | 30% |

Do 5º ao 16º lugar o prêmio de colocação é **zero**, então a maioria das
temporadas termina sem nenhuma renda de campanha. A loja entra como renda que
**cresce com a torcida**, não com a sorte.

## 2. O que já existe (não precisa inventar)

- 🛍️ **Loja do Clube** já é uma melhoria do estádio (`STADIUM_EXTRAS`, custo 80,
  +6 fixo por temporada). Hoje é só um numerozinho. Vira **tela de verdade**.
- 🎽 **Manto**: 2 cores por conta (`MANTO_CONTAS` em `manto.ts`), desenhado em CSS,
  **0 KB**. É a base da camisa.
- 👕 **Arte oficial dos batismos**: 31 camisas `.webp` em `public/mantos-salao/`
  (`CAMISAS_SALAO`), carregadas só quando alguém abre o clube no Salão.
- 🤝 **Patrocínio Master**: contrato de 1/2/3/5 anos, régua `MASTER_BASE`
  (V 2 · D 4 · C 8 · B 16 · A 32) × `(1,25 + (anos−1)/2)`. Hoje só vira moeda,
  **não aparece em lugar nenhum**.
- 🎟️ **Ocupação do estádio** por colocação (`occByPos`): 1.0 no G4 · 0.82 até o 7º
  · 0.55 no meio · 0.35 · 0.18 no Z4.

## 3. O que entra de novo

### 3.1 A camisa, montada pelo jogo

🎨 **DECIDIDO PELO DIEGO EM 15/09: a camisa é ARTE DE VERDADE, não desenho vetorial.**
Eu mandei duas versões em SVG e ele cortou as duas: *"você tá fazendo em SVG e quero
arte de verdade igual está é a do time"*. Vale como regra: **camisa do jogo tem que
ter a mesma qualidade das artes de batismo** (dobras, costura, gola, sombra).

👕 **Como fazer isso sem criar um arquivo por clube** (a regra de peso continua de pé,
ele quer escalar pra 10 mil batismos): **UMA arte só**, de uma camisa **em branco**, no
estilo das artes de batismo. O jogo usa ela como MOLDE e pinta com as 2 cores do clube;
escudo e patrocínios são carimbados por cima.

- **Provado em 15/09**: peguei a arte do Internacional de Madrid, virei molde
  (luminância) e repintei em 4 duplas de cor. É a MESMA arte nas 4, só a cor muda.
- **Peso**: ~25 KB **uma vez**, pro jogo inteiro. Não é por clube.
- 🏆 **MOLDE ESCOLHIDO PELO DIEGO (15/09): a camisa do FINAL BOSS FC.** Palavras
  dele: *"faz com base na do Final Boss, que é esse modelo que é o certo de
  camisa"*. É a mais limpa do acervo: branca, gola V, faixa no peito, raglan.
  `public/mantos-salao/finalboss-camisa.webp`.
- 🪵 **O clube SEM batismo usa a cor do tier FOI PROFISSIONAL** (`#CBBF9E`, a mesma
  do chip 🪵 em `pyramidseason.tsx`). Foi o pedido dele: *"o segundo mockup do time
  que não tem batismo com tier cor foi profissional"*.
- ⛔ **O que falta**: a arte limpa. A que usei na prova tem o SIUUU e o escudo do
  Madrid impressos, então serve pra mostrar a ideia e não pra ir pro jogo. Precisa de
  **uma camisa branca, de frente, sem estampa, sem escudo, sem patrocínio, sem nome**.
  Caminhos: quem desenha os batismos faz essa uma (é o melhor: sai perfeita), ou gerar
  por IA. Em 15/09 o gerador do OpenArt estava **sem crédito** e os domínios do Canva
  **não são alcançáveis deste ambiente** (dá pra mandar gerar pelo MCP, mas não dá pra
  baixar a imagem aqui — o Diego precisa baixar e mandar).
  🩹 **Molde provisório**: peguei a camisa do Final Boss e apaguei na mão o escudo do
  peito (espelhando o lado limpo), o texto da manga, a coroa e a etiqueta da barra.
  Serve pro mockup, mas **sobraram dois remendos de leve** (manga esquerda e barra),
  então não é arte final.

✂️ **Ajustes que ele pediu vendo o mockup (15/09), todos aplicados:**
1. **Sem as duas faixas** no molde de quem não tem batismo — a camisa do tier é
   LISA, só com a gola e os punhos como detalhe. (A faixa vermelha/preta é do
   Final Boss, não do molde.)
2. **Sem escudo inventado** no clube sem batismo. Eu tinha posto uma águia de
   enfeite e ele cortou: *"não entendi o porquê da águia, tire também"*.
3. **O painel do clube COM batismo agora é o Final Boss FC** (era o Internacional
   de Madrid): *"e no do batismo coloque o do Final Boss"*.
4. **O Master virou ESTAMPA de verdade na camisa**, não caixinha com borda:
   *"a logo deixe de forma melhor na camisa o patrocinador Master"*. Texto
   impresso no tecido, do tamanho que couber no peito.

🖨️ **A ESTAMPA TEM QUE ENTRAR NO TECIDO (15/09).** Ele viu a primeira versão e
cortou: *"a logo tá ridícula, parece PowerPoint"*. Estava certo — era texto colado
POR CIMA da foto. O conserto é `mix-blend-mode: multiply` no nome do Master e do
fornecedor: as dobras e o desenho da camisa passam por cima das letras, e aí lê
como estampa. Vale como regra pra qualquer coisa que o jogo carimbar na camisa.

⛔ **E A LIÇÃO MAIOR, que custou várias idas e vindas:** *"não gostei nada… tá
manchada… quero camisa perfeita"*. O molde que eu montei é a camisa do Final Boss
com o escudo, o texto da manga e a etiqueta **apagados na mão por cima da arte do
dono**. Isso é REMENDO e vai ficar manchado sempre. **Não dá pra fabricar a arte
base apagando arte alheia.** O único caminho é uma camisa branca lisa desenhada do
zero — e ela precisa vir DE FORA, porque:
- o gerador de imagem (OpenArt) está **sem crédito**;
- o **Canva foi usado** (gerou 4 opções e os links foram pro Diego), mas este
  ambiente **bloqueia os domínios do Canva**, então não dá pra baixar a imagem
  aqui — e depois a conexão do Canva caiu da sessão.
👉 Pedido feito a ele: gerar/mandar **uma** camisa branca, de frente, sem estampa,
sem escudo, sem patrocínio, sem faixa, fundo verde. Prompt pronto entregue no chat.

🏷️ **MARCA REAL ENTRA COM LOGO DE VERDADE (regra dele, 15/09):** *"tinha que entrar
a logo real da Vadico, por exemplo. Só se fosse marca genérica que não"*. O jogo JÁ
tem os quatro logos dos amigos dele em `src/escalacao/img/`: `patro-vadico.webp`,
`patro-ero.webp`, `patro-maxjoias.webp`, `patro-reidastintas.webp` (usados hoje em
`estadio.tsx` e `career-sponsor-visual.tsx`). Então:
- **Vadico · ERO · Max Joias · Rei das Tintas** → estampa o **logo**;
- **Padaria do Zé, Açougue, Espetinho, Guaraná Craque, Diamante** → não têm logo,
  estampa o **nome escrito**.

🧼 **Molde refeito (15/09, 3ª tentativa).** Em vez de apagar as 4 marcas do Final
Boss uma a uma, o molde agora nasce da **metade ESQUERDA** da camisa dele — que é a
limpa, só tinha o texto da manga — e essa metade é **espelhada** pra formar a camisa
inteira. Sai simétrica, sem escudo, sem coroa e sem etiqueta, com um conserto só em
vez de quatro. Ainda sobra um clarão leve nas mangas: é o limite de mexer em arte
alheia, e por isso a arte limpa continua sendo pedida.

📐 **ENQUADRAMENTO DA ESTAMPA (medido, não chutado).** Ele pegou: *"a logo da
Vadico não está enquadrada"*. Na altura do peito o CORPO da camisa tem **253px de
498** (o resto é manga e fundo). A estampa tem que tomar ~65% do CORPO, ou seja
**~33% da largura da imagem** — eu estava desenhando com 46% da ALTURA, que dava
quase a camisa inteira e passava por cima das listras laterais. Também recortei a
moldura branca do arquivo do logo (`patro-vadico.webp` tem 5px de folga em volta).
Marca SEM logo (genérica) segue a mesma régua: nome comprido **quebra em 2 linhas**,
como kit de verdade, em vez de encolher até virar formiga.

🏷️ **Fornecedor virou MARQUINHA, não palavra solta** (*"tá com uma marca ridícula no
peito"*): símbolo em cima + nome pequeno embaixo, como etiqueta de material
esportivo. O símbolo é neutro de propósito — **não imitar a marca de verdade**
(Nike/Adidas/Puma), só o nome é paródia.

Lugares das peças (pedido dele, referência: Internacional de Madrid e Inter de Bailão):

- **peito esquerdo**: escudo do clube;
- **peito direito**: fornecedor de material;
- **centro, abaixo do peito**: patrocínio Master;
- **barra**: nome do clube; **corpo**: as 2 cores do clube.

Quem é **batismo** vê, ao lado, a **arte oficial** dele (o `.webp` que já existe) e as
2 cores saem dessa arte (as mesmas do `MANTO_CONTAS`).

🎨 **Quem NÃO é batismo ESCOLHE as 2 cores, de graça.** É a resposta pro medo que ele
levantou em 15/09, de o jogador sem batismo achar o próprio clube feio e desanimar: a
camisa é a MESMA, o molde é o mesmo, o escudo é o mesmo, os patrocínios são os mesmos.
A única coisa a mais do batismo é a **arte desenhada à mão**. Ninguém abre a loja e vê
tela pobre. (Hoje a carreira da pirâmide não guarda cor de clube nenhuma — só a
dinastia tem `crest` com 2 cores. Então é campo novo no save, pequeno: 2 cores.)

### 3.2 Fornecedor de material esportivo (slot NOVO de patrocínio)

Terceiro contrato, ao lado do Pontual e do Master. Nome cômico no estilo das
marcas de verdade, como ele pediu:

| Marca | Chega quando | Paga por ano | Bônus na loja |
|---|---|---|---|
| 👑 Rainha da Várzea | sempre | 1 | +10% |
| ⚡ Umbrinha | Série D | 2 | +15% |
| 🥋 Kapinha | Série D | 2 | +15% |
| 🔺 Adibas | Série C | 3 | +20% |
| 🦅 Penalti do Bairro | Série C | 3 | +20% |
| 👟 Naique Sports | Série B | 5 | +30% |
| 🐆 Pumba | Série B | 5 | +30% |
| 🦁 Reebocada | Série A | 8 | +40% |
| 🇧🇷 Topner | Série A | 8 | +40% |

Contrato de 1 a 3 temporadas, fechado na virada, no mesmo tempo morto do Master.
**Marca grande só bate na porta de quem subiu** — é o degrau de ambição.

### 3.3 Venda de camisas

```
camisas = base da divisão × ocupação do estádio × bônus do fornecedor × efeito do preço
renda   = camisas × margem do preço
```

- **base por divisão**: V 8 · D 14 · C 22 · B 34 · A 50
- **preço** (escolha do dono, uma vez por temporada):
  - Popular: ×1,3 camisas, margem 1
  - Normal: ×1,0 camisas, margem 2
  - Cara: ×0,6 camisas, margem 3

Exemplos: Série C no meio da tabela, Normal, Adibas → 22 × 0,55 × 1,2 = 14
camisas × 2 = **28 🪙**. Série C no G4 com Naique → 22 × 1,0 × 1,3 = 28 × 2 =
**56 🪙**. Várzea, estádio meio cheio, Rainha → **9 🪙**.

Isso é da mesma ordem do Master e **dobra** uma temporada de meio de tabela, sem
virar a principal fonte de renda.

## 4. Quando cada coisa aparece

| Momento | O que acontece |
|---|---|
| Virada de temporada | proposta do fornecedor (só quando o contrato antigo acaba), junto do Master |
| Virada de temporada | escolher o preço da camisa do ano |
| Virada de temporada | entra a renda: linha no Extrato "👕 Loja: N camisas × preço" |
| Qualquer hora | aba **Clube › Loja**: a camisa grande, é a vitrine do orgulho |

Nenhum passo novo dentro da temporada. Tudo em tela que já existe, em tempo morto
que já existe (regra de ouro: não atrasa o ritmo).

## 5. Travas

1. **A loja nunca paga mais que o Master** na mesma divisão. Se pagar, é bug de
   calibragem, não feature.
2. **Nenhum arquivo de imagem novo por clube.** A camisa é CSS; a arte do batismo
   é a que já está publicada.
3. **Marca de verdade não entra.** Os nomes são paródia, o jogo não usa logo real
   de Nike/Adidas/Puma.
4. **Quem não é batismo nunca vê tela pior**, só cores diferentes. Nada de "sua
   camisa está vazia porque você não pagou".

## 6. O que falta decidir com o Diego

- As 2 cores de quem **não é batismo**: tier de apoio? cor do escudo? ele escolhe?
- Os nomes das marcas (a lista acima é chute meu, ele pode trocar todos).
- Se a loja **substitui** a melhoria de estádio "🛍️ Loja do Clube" (+6 fixo) ou
  se a melhoria vira **pré-requisito** pra abrir a tela. Minha sugestão: vira
  pré-requisito, porque dá um motivo pra construir.

Mockup: `node scripts/mockup-loja-clube.mjs` → `mockup-loja-clube.png`.
