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

🚫 **NÃO MEXER NAS MANGAS (ordem dele, 15/09).** Pra disfarçar o remendo eu tinha
pintado uma faixa escura na manga; ele cortou na hora: *"na manga ficou ridícula,
não mexe nas mangas"*. A manga não recebe desenho novo — só a limpeza do texto do
Final Boss.
🥇 **O JEITO QUE FINALMENTE FUNCIONOU NA MANGA: usar a manga do OUTRO LADO.**
A manga esquerda do Final Boss tem o texto "MAIS QUE UM JOGO" (área grande); a
direita só tem uma coroa pequena. Então o molde apaga só a coroa (área minúscula) e
usa **essa manga nos DOIS lados**, espelhada. Resultado: manga com o TECIDO DE
VERDADE, com as dobras originais, sem remendo e sem mancha — que foi o que ele
cobriu 3 vezes (*"a manga tá ruim, quero sem essa mancha, igual era antes"*).
⚠️ Ao colar a manga espelhada, a máscara TEM que ser multiplicada pelo alfa da
própria manga; sem isso o pixel transparente do recorte abre um buraco branco na
axila do corpo (aconteceu e ele não chegou a ver).

🩹 **Onde a área é pequena, a limpeza certa é RECONSTRUIR, não remendar.** Colar um pedaço de tecido
vizinho deixa caixa e fantasma das letras, por mais que se case o brilho (tentei
3 vezes). O que funcionou foi reconstruir o buraco a partir das BORDAS — média dos
vizinhos repetida até assentar (Laplace). Sai liso, no tom exato da volta, sem
caixa e sem fantasma. Vale pra qualquer limpeza de arte daqui pra frente.
🎽 **As DUAS FAIXAS DO PEITO ficaram** (ele pediu de volta, *"só pra disfarçar essa
mancha"*): elas cobrem o fantasma da faixa original e ainda dão cara de kit.

📐 **ENQUADRAMENTO DA ESTAMPA (medido, não chutado).** Ele pegou: *"a logo da
Vadico não está enquadrada"*. Na altura do peito o CORPO da camisa tem **253px de
498** (o resto é manga e fundo). A estampa tem que tomar ~65% do CORPO, ou seja
**~33% da largura da imagem** — eu estava desenhando com 46% da ALTURA, que dava
quase a camisa inteira e passava por cima das listras laterais. Também recortei a
moldura branca do arquivo do logo (`patro-vadico.webp` tem 5px de folga em volta).
Marca SEM logo (genérica) segue a mesma régua: nome comprido **quebra em 2 linhas**,
como kit de verdade, em vez de encolher até virar formiga.

✅ **A ARTE LIMPA CHEGOU — o Diego mandou (15/09): *"segue a arte certa"*.**
Acabou a novela do molde remendado. É uma camisa de frente, gola V, duas faixas
pretas no peito, punhos com detalhe, **sem escudo, sem patrocínio, sem nada
escrito** — exatamente o que faltava. Ela virou `scripts/kits/MOLDE-camisa-tier.webp`
(fundo cinza recortado pro alfa, 542×620, ~58 KB) e **aposentou** as duas peças
remendadas que eu tinha fabricado apagando a camisa do Final Boss. É ela o MOLDE
do jogo daqui pra frente: sai nesta cor pro tier 🪵 e é repintada pros outros
(`scripts/tinge-camisa.py`).

🛡️ **ESCUDO BASE — quem não tem batismo TAMBÉM tem escudo (regra dele, 15/09).**
Palavras do Diego: *"o escudo base que sempre vem com a primeira letra ou algo do
tipo pra pôr no peito, com alguma cor também o escudo"*. Como funciona:
- nasce da **primeira letra** do nome do clube (Fulanos FC → **F**);
- pintado com as **2 cores que o dono escolher** (as mesmas da camisa, ou outras);
- é **desenho em código** (SVG), **não arquivo**. Isso é obrigatório: seria um
  arquivo por clube, e são dezenas de milhares de carreiras — a regra de peso
  morria na hora. Em código custa **0 KB** e serve pra qualquer nome.
- formato: escudo de ponta, borda preta grossa, degradê das 2 cores, barra
  preta em cima e a letra em creme com contorno preto — a mesma cara do resto do
  jogo (borda 3-4px, sombra dura).

📏 **TAMANHO DAS PEÇAS: medido na camisa, não chutado (ele cortou 15/09).**
*"totalmente desproporcional × o tamanho da camisa"*. Eu estava dimensionando pela
ALTURA da imagem inteira, e a imagem tem manga dos dois lados — então tudo saía
grande demais e o escudo ainda atravessava a costura do ombro. As medidas certas,
tiradas da arte (542×620): gola escura até **12%** da altura · faixa de cima
**32→38%** · faixa de baixo **42→48%** · corpo entre **21% e 79%** da largura
(o resto é manga). Daí:
- **escudo**: altura ≈ **8,5%** da camisa, centro em **x 64% · y 27%** (peito
  esquerdo de quem veste = lado direito de quem olha) — cabe entre a gola e a faixa;
- **fornecedor**: marquinha espelhada em **x 36% · y 27%**, símbolo 3% + nome 1,9%;
- **Master**: largura ≈ **22%** da altura da camisa, centro em **x 50% · y 61%**
  (na barriga, abaixo das duas faixas), que dá ~48% da largura do corpo.
👉 Regra que fica: peça de camisa se mede pelo **CORPO** (21–79%), nunca pela
largura da imagem, e nunca pela altura total.

🎨 **COR DE TIER TEM QUE PARECER COR (15/09, última correção dele).** Palavras do
Diego: *"a cor do batismo eu pedi cor do tier profissional, mas na forma que tá parece
que tá sem cor. Estranho"*. Eu tinha pintado o molde com uma rampa lavada
(`#6B6148` → `#E3DBC3`) e a camisa saiu cinza-areia, sem vida. O conserto é **esticar
a rampa**: escuro de verdade embaixo, cor cheia no meio, claro em cima. A do tier 🪵
ficou `#2A2211` → `#8A6E33` → `#C3AF78` → `#DCCB9A` → `#F1E7CB` — tecido areia quente
e faixa caramelo no peito, ainda na família do bege do tier (`#DBD1B5/#CBBF9E/#B2A583`),
mas lendo como camisa de verdade. **Regra pros outros tiers**: nunca dois tons quase
iguais; a rampa precisa de faixa larga, senão a camisa fica "sem cor".
A conta mora em `scripts/tinge-camisa.py` (é ela que vai virar o pintor do jogo) e o
molde limpo em `scripts/kits/MOLDE-camisa-branca.webp`.

🔴 **LOGO DE MARCA REAL ENTRA EM CORES (mesma mensagem dele):** *"se eu por a logo da
Vadico ali, que tem parte vermelha, deve aparecer o vermelho. Não é pra ser sem cor"*.
O `mix-blend-mode: multiply` (que é o que faz a estampa entrar no tecido) **come a cor
do logo** — o vermelho da Vadico sumia. Então a regra se divide:
- **nome escrito** (marca genérica) → segue com `multiply`, porque é tinta chapada;
- **logo de verdade** → entra **normal**, com o fundo branco do arquivo virado
  **transparente de verdade** (`scripts/kits/patro-vadico-alfa.webp`) e uma sombrinha
  de 1px pra encaixar no pano. A cor fica intacta.

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

### 3.1b A LOJA É UMA VITRINE, não uma caixa branca (Diego, 15/09)

Pergunta dele vendo o mockup do fornecedor: *"mas é a loja com a arte da camisa e
patrocínio e etc?? não tem uma arte foda que possa fazer também?"*. Tem razão duas vezes:

1. **Sim — a loja é a tela que mostra a camisa montada** (arte + escudo + fornecedor +
   Master). O balanço e o contrato são tempo morto da virada; a LOJA é a vitrine do
   orgulho, e é lá que a camisa aparece grande.
2. **E ela merece cena, não moldura.** A camisa numa caixa branca é catálogo. Agora a
   moldura virou vitrine: madeira escura, foco de luz quente em cima da camisa, chão
   refletindo, placa "· LOJA DO CLUBE ·" em cima. Feito em **degradê CSS, 0 KB** — e
   por isso serve pra QUALQUER camisa (batismo ou molde do tier) sem arquivo novo.

🎨 **Arte de verdade: 4 opções geradas no Canva em 15/09** (loja vista por dentro,
balcão, arara ao fundo, luz de vitrine, **centro vazio de propósito** pra a camisa
entrar por cima):

- https://www.canva.com/d/Ia9F9GEo8hmyR8V
- https://www.canva.com/d/ygsMC6AdbShx4Zg
- https://www.canva.com/d/CbHOrcQAa9G1JcS
- https://www.canva.com/d/Sp4QschTs7xxpYf

⚠️ **Este ambiente BLOQUEIA os domínios do Canva** (`design.canva.ai` e cia dão 403 no
proxy), então eu **gero mas não consigo ver nem baixar** — igual aconteceu com a camisa
em branco. O caminho que funciona é o mesmo de sempre: o Diego abre, escolhe e **manda
o arquivo**. Quando chegar, é UM `.webp` no lugar do fundo da vitrine e a camisa
continua entrando por cima exatamente do mesmo jeito (nada de conta muda).

### 3.1d 👕 A CAMISA MUDA COM OS CONTRATOS — regra fechada (Diego, 15/09)

Palavras dele: *"lembrando que todo clube sem batismo só terá no peito esquerdo,
enquadrado corretamente, o escudo dele. O patrocínio irá alterar com base no fechamento
do patrocínio Master e também do fornecedor de material esportivo. **Isso vale também
pros times de batismo.**"*

São **três lugares fixos**, e o que aparece em cada um depende do que está fechado
NAQUELE momento:

| Lugar | O que entra | Quando |
|---|---|---|
| **peito ESQUERDO** (lado direito de quem olha) | o **escudo do clube** | sempre |
| **peito DIREITO** | o **fornecedor de material** | só com contrato assinado |
| **BARRIGA** | o **patrocínio Master** | só com contrato assinado |

- **Sem batismo**: no peito esquerdo vai o **escudo base** — a letra do nome + as 2
  cores do dono — e **só ele**, sempre **enquadrado igual** (mesmo tamanho, mesmo
  lugar, em qualquer clube). Nada de enfeite inventado.
- **Com batismo**: o escudo **já vem desenhado na arte** que o dono mandou, então o
  jogo **não carimba outro por cima**. A arte do dono nunca muda.
- **E as duas estampas de patrocínio valem IGUAL pros dois.** Fechou, aparece.
  Acabou o contrato, **some da camisa** até fechar outro. É a mesma regra — só muda de
  onde vem a arte de base.

**Mockup com os dois casos** (`node scripts/mockup-camisa-patrocinio.mjs`), com o
exemplo que ele pediu — Master 🎨 **Rei das Tintas** (marca real → logo de verdade, em
cores) e fornecedor 🐆 **Pumba** (marca cômica → nome escrito):

- **Leite de Verdade FC** (COM batismo, Série A) — arte própria do dono, com o escudo
  do curral já nela; Pumba e Rei das Tintas carimbados por cima.
- **Morto FC** (SEM batismo, tier 🪵, Série C) — molde do jogo na cor do tier, escudo
  base com a letra **M** no peito esquerdo, Pumba e Rei das Tintas nos mesmos lugares.

Cada painel traz a **tirinha dos 3 estados** (sem nada fechado → fechou o fornecedor →
fechou o Master), que é a prova visual da regra.

📐 **As medidas saem de CADA arte, não da imagem.** A camisa do Leite (588×760) tem o
escudo do batismo em x68%/y28%, a coroa do clube em x34%/y26%, o nome escrito de 37% a
51% e o celeiro a partir de 55% — então o fornecedor cai em x33%/y34% e o Master em
x50%/y65%. No molde do tier (542×620) as posições são outras. Chutar pela altura da
imagem foi exatamente o erro que ele pegou ("totalmente desproporcional"): **cada arte
traz as suas medidas.**

### 3.1c 🧭 ONDE ISSO MORA: sub-aba 🏟️ Clube › 🛍️ Loja (Diego, 15/09)

Pergunta dele: *"gostei dessa forma… mas onde entra a arte da camisa, da loja e etc?
Fica em alguma aba?? Ou o quê?"*. Conferido na navegação **de verdade**
(`pyramidseason.tsx`), sem chutar:

- **abas da carreira**: 🗓️ Jogos · 📊 Tabelas · 👥 Elenco · 🏆 Rank · 🏟️ Clube
- **sub-abas dentro de 🏟️ Clube** (hoje, 3 pílulas): 🏗️ Estrutura · 💰 Finanças ·
  🤝 Patrocínio (+ 🏛️ Presidência, só na carreira privada)

👉 **A Loja entra como a 4ª pílula: `🏟️ Clube › 🛍️ Loja`.** Tudo dela mora ali:
a camisa na vitrine · o preço do ano · o fornecedor · o balanço da última temporada.

**Por que sub-aba própria, e não dentro do Patrocínio:** o Patrocínio já está cheio
(Master + Pontual + TV + a régua de valores), e a Loja tem três coisas pra mostrar. E
porque a camisa é a vitrine do orgulho — merece porta própria. Continua cabendo na
tela do celular: 4 pílulas, como já foi 4 antes da Agência sair de lá.

🏟️ **O desenho do estádio segue intocado.** A regra permanente ("o `StadiumSvg` é a
PRIMEIRA coisa ao abrir a área do clube") vale pra sub-aba 🏗️ Estrutura, que não muda
em nada — a Loja é uma porta ao lado, não algo empilhado antes do estádio.

🔒 **A porta abre com a obra que JÁ EXISTE.** A 🛍️ Loja do Clube é uma melhoria de
`STADIUM_EXTRAS` desde sempre (custo 80, exige 2 setores prontos, rende +6 por
temporada). Quem construiu encontra a loja aberta; quem não construiu vê a porta
fechada dizendo **o porquê e o caminho** ("sua camisa existe, mas não tem onde vender"
+ botão **Ir pra 🏗️ Estrutura**) — regra permanente do Diego sobre travas. E o +6 de
hoje continua valendo: ninguém perde o que já pagou.

Mockup: `node scripts/mockup-loja-aba.mjs` → `mockup-loja-aba.png` (as duas telas:
loja aberta e loja trancada).

### 3.2 Fornecedor de material esportivo — MESMA MECÂNICA DO MASTER (Diego, 15/09)

Palavras dele: *"o fornecedor de material esportivo deve ser parecido com o estilo do
patrocinador Master, em relação a temporadas que se escolhe 1, 2, 3 e 5. Só que moedas
menos que o Master. E também tem aumento em relação à divisão que vai participar quando
começar a temporada e tiver sem contrato, com base na divisão… igual do Master, e não
quebra contrato também mas que tenha subido ou caído"*.

Então é **cópia da régua do Master** (`MASTER_PRAZOS` / `masterPorTemporada` em
`estadiodata.ts`), trocando só a base:

- **4 marcas, prazo fixo em cada uma** (1 · 2 · 3 · 5 temporadas), abertas de uma vez;
- o valor **POR TEMPORADA sai da divisão em que assinou e CONGELA** até o fim —
  **subiu ou caiu, tanto faz, o contrato não quebra**;
- proposta nova **só quando o contrato acaba**, aí com os valores da divisão do momento;
- no meio do contrato **não há nada pra decidir** (não atrasa o começo da temporada);
- **soma** com o Pontual e com o Master. São três contratos vivos ao mesmo tempo.

**Base:** `FORN_BASE = { V: 1, D: 2, C: 5, B: 10, A: 20 }` — ≈62% da base do Master
(V2 D4 C8 B16 A32), com a **mesma fórmula** `base × (1,25 + (anos−1)/2)`. Fica menos
que o Master porque o fornecedor ainda paga a **segunda perna**: o bônus nas vendas
da loja.

| Divisão | 1 temp | 2 temp | 3 temp | 5 temp | total do contrato de 5 |
|---|---|---|---|---|---|
| Várzea | 1 | 2 | 2 | 3 | 15 |
| Série D | 3 | 4 | 5 | 7 | 35 |
| Série C | 6 | 9 | 11 | 16 | 80 |
| Série B | 13 | 18 | 23 | 33 | 165 |
| Série A | 25 | 35 | 45 | 65 | 325 |

*(Master, pra comparar: V 3/4/5/7 · D 5/7/9/13 · C 10/14/18/26 · B 20/28/36/52 ·
A 40/56/72/104.)*

**As 4 marcas** — nome cômico no estilo das de verdade, como ele pediu, mas **símbolo
neutro**: não imitar o desenho da Nike/Adidas/Puma, só o nome é paródia.

| Marca | Prazo | Bônus na loja | Bate na porta de |
|---|---|---|---|
| ⚡ Pênalti do Bairro | 1 temporada | +10% | todo mundo (já na Várzea) |
| ◣ Adibas | 2 temporadas | +20% | todo mundo (já na Várzea) |
| 🐆 Pumba | 3 temporadas | +30% | Série D pra cima |
| ✓ Naique | 5 temporadas | +45% | Série B pra cima |

🔒 **A trava explica o porquê e a saída** (regra do Diego): *"a Naique só fecha com
clube da Série B pra cima — suba uma série e ela bate na sua porta"*. Marca grande
que só procura quem subiu é o degrau de ambição, e o jogador nunca fica sem opção:
na Várzea já há duas marcas na mesa.

### 3.3 Venda de camisas — torcida vem do ESTÁDIO, venda vem do RESULTADO

Pedido dele (15/09): *"o tamanho da torcida deve ser com base no estádio, de coisas
que é construído. E também as vendas com base na temporada, como foi"*. A conta usa só
coisa que o jogo **já mede** — nada de número solto:

```
👥 TORCIDA   = 12.000 + assentos construídos no estádio
               (Geral 21.500 · Cadeiras 18.500 · Visitante 22.838 · Camarote 16.000)
               → de 12.000 (estádio cru) a 90.838 (estádio completo)

📣 COMO ACABOU — as 4 FAIXAS (as mesmas do Pontual):
               👑 CAMPEÃO (1º) · 📈 CLASSIFICAÇÃO (2º–4º)
               🛡️ SE MANTEVE (5º–16º) · 🔴 CAIU (17º–20º)

🏬 OBRAS     = o que leva gente pra loja (soma, teto +50%):
               📺 telão +4% · 🅿️ estacionamento +6% · 🍔 praça +10% · 🍻 choperia +6%
               🚇 estação +8% · 🏨 hotel +10% · 🏟️ retrátil +6%
               (a 🛍️ Loja do Clube não está na lista porque ela é a PORTA: sem ela
                não existe loja nenhuma — e ela já é uma obra do estádio hoje)

👟 FORNECEDOR = +10% · +20% · +30% · +45%

CAMISAS = TORCIDA × quem_compra × curva_do_preço[faixa] × (1+OBRAS) × (1+FORNECEDOR)
MOEDAS  = CAMISAS ÷ 100 × margem_do_preço
```

### 3.3b 💰 O PREÇO É UMA APOSTA — 3 faixas, e quem cai não vende nada

A ideia é dele: *"sobre os preços, temos que basear com base no time… e aí, se escolher
o mais caro da camisa e disputar pra não cair, ele se ferra — ele teria ganho mais se
escolhesse a moeda menor"*.

✂️ **E ele MESMO cortou a versão de 4 faixas em seguida**: *"muita confusão, acho que
tem que ter só: se manteve, classificação zona, ou campeão. Caiu não vendeu nada"*.
Então são **3 faixas — as mesmas 3 metas do Patrocinador Pontual**, que o jogador já
conhece de cor — e o 🔴 caiu **não é uma 4ª faixa: é o ZERO**.

| Preço | de cada 100 torcedores compram | margem (por 100 camisas) | 🛡️ SE MANTEVE | 📈 CLASSIFICAÇÃO | 👑 CAMPEÃO | 🔴 CAIU |
|---|---|---|---|---|---|---|
| **Popular** (1 🪙) | 8,0 | 0,5 | ×1,00 | ×1,15 | ×1,30 | **0** |
| **Normal** (2 🪙) | 4,5 | 1,0 | ×0,80 | ×1,25 | ×1,55 | **0** |
| **Cara** (3 🪙) | 2,4 | 1,5 | ×0,50 | ×1,40 | ×2,00 | **0** |

- **Popular** quase não sente o resultado: camisa barata o torcedor leva mesmo com o
  time no meio da tabela. Em compensação sobra pouco por peça.
- **Cara** só vende se o time for bem: ninguém paga caro pra vestir time sem graça —
  mas campeão vende camisa cara que é uma beleza.
- 🔴 **Caiu = zero, em qualquer preço.** Não é curva baixinha, é não vender nada mesmo.

**O resultado, no mesmo clube** (Série C, 52.000 de torcida, Adibas +20%):

| Preço | 🛡️ SE MANTEVE | 📈 CLASSIFICAÇÃO | 👑 CAMPEÃO | 🔴 CAIU |
|---|---|---|---|---|
| Popular (1 🪙) | **26** | 30 | 34 | 0 |
| Normal (2 🪙) | 24 | **37** | 46 | 0 |
| Cara (3 🪙) | 12 | 33 | **48** | 0 |

👉 A diagonal conta a história sozinha: **só se manteve → a popular ganha** (26 contra
12 da cara, mais que o dobro); **classificação → a normal**; **campeão → a cara**.
É exatamente o que ele descreveu, com uma faixa a menos e sem confusão.

⚠️ **E NÃO É PEGADINHA.** A tela mostra as 3 colunas **antes** de ele escolher, com o
verde marcando qual preço ganha em cada final, e a faixa vermelha embaixo avisando que
cair zera tudo — regra permanente do Diego: toda escolha explica o porquê. Ele aposta
sabendo; o risco é dele, a informação é dele também.

**Quanto isso dá numa temporada** (preço Normal, rodado em `node scripts/mockup-fornecedor.mjs`):

| Situação | Torcida | Camisas | Entra |
|---|---|---|---|
| Várzea, estádio cru, meio de tabela | 12.000 | 475 | **+5 🪙** |
| Série D, só a Geral, escapou do Z4 | 33.500 | 1.447 | **+14 🪙** |
| Série C, 2 setores, meio de tabela | 52.000 | 2.381 | **+24 🪙** |
| Série C, 2 setores, **CLASSIFICAÇÃO** | 52.000 | 3.721 | **+37 🪙** |
| Série A, estádio COMPLETO, **CAMPEÃO** | 90.838 | 13.781 | **+138 🪙** |
| **qualquer clube que CAIU** | — | 0 | **0 🪙** |

Por que esses tamanhos: medido em 14/09, a mediana de caixa é **32 na Série B** e
**53 na Série C** — ou seja, +24 a +37 numa temporada de Série C **dobra** o ano de
quem está no meio da tabela, que é exatamente quem reclamou. Na Série A (mediana de
caixa 881) os +138 são um bônus, não uma virada — a loja não vira a fonte principal
de ninguém. E quem cai perde a loja no ano, o que dá mais um motivo pra não cair.

### 3.4 QUANDO isso aparece — o balanço só na virada (Diego, 15/09)

*"o resultado das vendas aparece somente no início da nova temporada. Aparece o
resultado e depois mostra a continuação do contrato ou se inicia um novo, na qual ele
precisa decidir"*. Então a ordem na virada é SEMPRE esta, e só esta:

1. 📦 **BALANÇO DA LOJA** — camisas vendidas e moedas da temporada que acabou, com a
   conta na tela (torcida · colocação · preço · fornecedor). Entra direto no caixa.
2. 👟 **FORNECEDOR** — duas caras:
   - **contrato em dia**: é só um aviso ("ano 2 de 2, assinado na Série D, +4 🪙"),
     **nada pra decidir**, a temporada começa;
   - **contrato acabou**: chegam as 4 propostas com os valores da divisão atual, e aí
     sim ele escolhe e assina.

⏱️ Isso respeita a regra de ouro dele (*"nada pode atrasar o ritmo do jogo"*): durante
a temporada a loja trabalha calada, sem passo novo. Só na virada há tela — e mesmo lá,
na maioria das temporadas, o fornecedor é aviso e não decisão.

🎬 **A ARTE É A QUE JÁ EXISTE.** A cena é a mesma mesa de presidente com o estádio na
janela que o Master e o Pontual já usam (`img/career-sponsor-office-v36.webp`), com o
papel no mesmo lugar do CSS de verdade (`career-sponsor-office.css`: inset 49%/24%,
51% × 36%). **0 KB de arte nova.** Se um dia ele quiser uma cena própria de loja
(balcão, arara de camisas), é UM `.webp` a mais — mas não precisa pra entregar.

Mockup: `node scripts/mockup-fornecedor.mjs` → `mockup-fornecedor.png`.

## 4. Quando cada coisa aparece

| Momento | O que acontece |
|---|---|
| **1º** — abertura da temporada nova | 📦 **Balanço da Loja** do ano que acabou: camisas vendidas, moedas, e a conta na tela. Cai direto no caixa. |
| **2º** — logo em seguida | 👟 **Fornecedor**: contrato em dia = só aviso, nada pra decidir · contrato acabou = 4 propostas e ele assina |
| **3º** — ainda na virada | 💰 **O preço da camisa** do ano novo: aposta nas 3 faixas (se manteve · classificação · campeão), com a tabela na tela antes de escolher. Caiu = zero. |
| Durante a temporada | **nada**. A loja trabalha calada. |
| Qualquer hora | aba **Clube › Loja**: a camisa grande, é a vitrine do orgulho |

Nenhum passo novo dentro da temporada. Tudo em tela que já existe, em tempo morto
que já existe (regra de ouro: não atrasa o ritmo). E na maioria das temporadas o
fornecedor nem é decisão — é um aviso de uma linha, porque o contrato ainda corre.

## 5. Travas

1. **A loja + o fornecedor nunca pagam mais que o Master + o Pontual** na mesma
   divisão. Conferido na régua: Série A completa e campeã dá +120 (loja) + 65
   (fornecedor de 5 temporadas) = 185, contra 104 (Master) + 106 (Pontual) = 210.
   Se algum dia passar, é bug de calibragem, não feature.
1b. **O fornecedor paga sempre MENOS que o Master** na mesma divisão e prazo
   (base 1/2/5/10/20 contra 2/4/8/16/32). É a ordem que o Diego pediu.
2. **Nenhum arquivo de imagem novo por clube.** A camisa é CSS; a arte do batismo
   é a que já está publicada.
3. **Marca de verdade não entra no fornecedor.** Os nomes são paródia e o símbolo
   é neutro — o jogo não usa nem imita o desenho da Nike/Adidas/Puma. (O Master é
   o contrário: ali as marcas são os amigos do Diego, com o logo de verdade.)
5. **Nada do que a loja rende aparece no meio da temporada.** Se aparecer, virou
   spoiler do resultado — e o Diego odeia spoiler.
4. **Quem não é batismo nunca vê tela pior**, só cores diferentes. Nada de "sua
   camisa está vazia porque você não pagou".

## 6. O que falta decidir com o Diego

- As 2 cores de quem **não é batismo**: tier de apoio? cor do escudo? ele escolhe?
- Os nomes das marcas (a lista acima é chute meu, ele pode trocar todos).
- Se a loja **substitui** a melhoria de estádio "🛍️ Loja do Clube" (+6 fixo) ou
  se a melhoria vira **pré-requisito** pra abrir a tela. Minha sugestão: vira
  pré-requisito, porque dá um motivo pra construir.

Mockup: `node scripts/mockup-loja-clube.mjs` → `mockup-loja-clube.png`.
