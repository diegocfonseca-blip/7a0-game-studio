## 19/09/2026 (parte 3) — 🟢⚪ Dirceu Krüger entra no baralho + o coração do White Thigs

### ❤️ White Thigs do GuGu é CORITIBA
Ordem do Diego. Este é o **1º batismo da história** e **não tem dono nem e-mail
conhecido** — logo não existe linha em `esc_socios` pra guardar o coração. Ficou
anotado no `batismos.ts`, junto do clube. No dia em que o dono aparecer, o coração
vai pro banco junto com o nº de fundador.

### 🃏 A carta do Dirceu Krüger
Pedido dele na mesma mensagem: *"pesquise qual auge, o ano dele, e nível e
categoria se enquadraria"*. **Nada aqui foi chutado** — a regra dele de 18/08 vale
justamente pra isso.

**O que a pesquisa deu** (ESPN, Gazeta do Povo, Gazeta Esportiva, Câmara de
Curitiba):
- Coritiba **1966–1976**: **252 jogos, 58 gols**
- **7 títulos paranaenses**: 1968, 1969 e o **penta de 1971 a 1975**
- Apelido **"Flecha Loira"**
- **1999**: eleito numa enquete da imprensa esportiva o **melhor jogador da
  história do Coritiba** (53,3%) e escalado no **MEIO** do time de todos os tempos
- **Estátua** em tamanho real na frente do Couto Pereira (2016)
- Em 1970 quase morreu em campo; a dor no local da cirurgia o **aposentou aos 30**,
  em 1975. Depois virou o técnico com mais jogos pelo clube (185)

**A carta que saiu:**
`Dirceu Krüger · Coritiba · 1973 · MEI · fame 3 · 70-86`

**Por que cada número** (e o que é decisão, não fato):
- **MEI** — é FATO: foi escalado no meio no time de todos os tempos do clube.
- **fame 3 (BOM JOGADOR)** — calibrado pelos VIZINHOS, não pelo olho. O perfil
  "ídolo máximo de clube grande de estado, recordista e multicampeão, **sem
  Seleção**" já existe no baralho: **Pedro Basílio** (Fortaleza, 1973) é fame 3. O
  **Givanildo Oliveira** (Santa Cruz, 1976) é fame 4 *porque foi convocado* —
  Krüger não foi. Faixa 70-86, larga como as outras cartas de ídolo de clube.
- **1973** — ⚠️ **isto é CURADORIA, e o Diego sabe**: as fontes dão um CICLO de
  títulos, não um "melhor ano" isolado. 1973 é o meio do penta, ele com 28 anos,
  depois de se recuperar do lance de 70 e antes da dor que o aposentou. **Trocar o
  ano é uma linha** se ele preferir outro.

Rodados junto, como manda a regra: `npm run novidades` (1 entrou) e
`npm run paises` (nenhuma carta sem seleção, nenhum nome repetido). Commitados os
três: `data.ts`, a foto do catálogo e o arquivo gerado.

## 19/09/2026 (parte 2) — 🔎 VARREDURA DOS BATISMOS: código + banco, clube por clube

O Diego pediu: *"me fale quais de batismos q faltam"*. Com o acesso ao Supabase
liberado, deu pra conferir as DUAS metades pela primeira vez — o código
(`npm run batismos` + `npm run salao`) **e o banco**, que nenhuma trava enxerga
porque os guardas rodam offline.

❤️ Antes disso: **Pesadelo Verde FC é PALMEIRAS** (ordem dele). Gravado em
`esc_socios.time_coracao` de `portaltech.ep@gmail.com`.

### 🔴 Buraco de verdade — 1 clube
- **Marreco FC** (lucasigorbortoliniii) — é o único batismo sem **escudo próprio**,
  sem **mascote que carimba o gol**, sem **manto** (nem no código nem no banco) e
  sem **camisa na Loja**. Tem só a vaga na pirâmide, o ouro e o nº de fundador.
  É o mais atrasado da lista inteira, e de longe.

### 🟠 A linha OFICIAL do ouro não existe — 3 clubes
`user_colors` é a fonte oficial do tier, e **não tem linha nenhuma** pra:
**Crias do Bigão** · **Coringas do Diniz** · **Nata de SP**.
Hoje os três **veem dourado assim mesmo**, porque o `apoio.tsx` é a reserva e o
Modo Manual também sai do tier. Ou seja: não há prejuízo na tela HOJE — mas no dia
em que alguém limpar a reserva do código, os três perdem tudo de uma vez.

### 🟡 Nome reservado pela METADE — 4 clubes
A regra das 4 formas depende do gatilho, e o gatilho só dispara quando entra o
**nome PURO**. Nestes quatro entrou direto a forma com sufixo, então o gatilho
nunca rodou e **o nome puro está LIVRE pra qualquer um pegar**:
| clube | reservado | livre |
|---|---|---|
| Skyy FC | `skyy fc` | `skyy`, `skyy ec` |
| Marreco FC | `marreco fc` | `marreco`, `marreco ec` |
| Futpoint FC | `futpoint fc` | `futpoint`, `futpoint ec` |
| Marinheiros AS | `marinheiros as` | `marinheiros`, `marinheiros fc/ec` |
Conserto: inserir o nome puro em `esc_nomes_batismo` que o gatilho completa sozinho.
(Os outros 49 estão com as 3+ formas certas.)

### 🎽 Camisa na Loja do Clube — 7 sem arte
Deportivo Montreal · SC Ferrari · Coringas do Diniz · Nata de SP · Sapekeiros FC ·
Marreco FC · Eros FC. **Não é defeito**: é lista de a-quem-pedir. Todos os 7 já
aparecem com a cor certa na foto do campeão (o manto deles vem do painel).

### ❤️ Time de coração em branco — 8 (eram 13)
O Diego foi soltando em 19/09; todos gravados em `esc_socios.time_coracao` **e**
anotados no `manto.ts`, do lado das cores de cada um:
~~Bagres 1993~~ → **São Paulo** · ~~Leite de Verdade~~ → **Grêmio** ·
~~Seven City~~ → **Corinthians** · ~~Milhaça FC~~ → **São Paulo** ·
~~Skyy FC~~ → **Vasco da Gama**.
⚠️ O do **Skyy** ficou anotado no `batismos.ts`, não no `manto.ts`: ele não tem
linha lá, porque o manto dele foi escolhido no painel e mora só em `esc_socios`.

Faltam **8**: Corporação Capsule · Bonança SSFC · Eros FC · Fridão FC ·
Sistematizados · Crias do Bigão · Meia na Canela (ex-Jurubeba) · Stocco FC.
Só serve pro post do batismo — não muda nada no jogo.

### ✅ O que está inteiro
**43 dos 53** completos no código. No banco, todos os 53 têm `esc_socios` com
sócio, manto, mascote e escudo apontados, e `valido_ate` de batismo eterno.
Fundador bate com o código em todos (os dois sem número são **sócios**, que por
regra não têm mesmo: Futpoint FC e o assinante `delaofut`).

### ✅ Dois dos três consertos, feitos no mesmo dia (ele mandou: *"2 ok"* · *"3 são
todos times de batismo igual aos outros"*)
- 🟠 **Ouro oficial criado** pros três: `user_colors` (tier ouro + manual) pra
  **Crias do Bigão**, **Coringas do Diniz** e **Nata de SP**. Conferido depois:
  **zero** batismo sem a linha oficial. Não mudou nada na tela deles (já viam
  dourado pela reserva do código) — o que mudou é que agora a fonte oficial
  concorda com o código, e é a única perna que funciona sem deploy.
- 🟡 **Os 4 nomes puros foram trancados**: entrou `skyy`, `marreco`, `futpoint` e
  `marinheiros` em `esc_nomes_batismo`, e **o gatilho completou o FC e o EC
  sozinho**, como manda a regra das 4 formas. Antes dava pra qualquer um criar um
  time chamado "Skyy" — agora não dá. (Marinheiros ficou com as 4 + o `as`.)
  📌 **A lição**: o gatilho só dispara com o **nome PURO**. Quem cadastrar direto a
  forma com sufixo deixa o nome puro livre e não percebe, porque nenhuma trava
  olha o banco. Vale conferir isso a cada batismo novo.

### Pendências que saem daqui
- 🔴 **Marreco FC**: pedir arte ao dono, ou avisar o Diego que vai de peça neutra.
  É o único batismo sem escudo, sem mascote, sem manto e sem camisa.
- 🦁 Confirmar com o Luiz o nome da mascote do Remoçada ("O Leão de Thor" é chute).
- 📅 O ano do **Dirceu Krüger** (1973) ficou aprovado por ele: *"1- ok segue"*.

## 19/09/2026 — 🧾 A ficha do jogador: "esta temporada" × "no seu clube"

Pedido do Diego, com o print da barra preta: *"eu quero que tenha gols na temporada,
gols totais… e também jogos totais, e assistência na temporada e assistências
totais… poderia ter um espaço embaixo"*. Mandei três mockups; ele escolheu a
**letra C** (duas colunas).

### 🔑 O que a pergunta dele esclareceu
Depois do 1º mockup ele perguntou: *"são dados dele no clube que ele tá atual né?
Não são jogos totais contando outros clubes"*. Fui conferir e **ele está certo**:
`guardaCansaco` tem `if (!m.isHuman) continue` — **só o elenco do usuário é
anotado**, bot nunca acumula. Então jogo feito em outro clube não entra em lugar
nenhum. Por isso o rótulo virou **"NO SEU CLUBE"**, nunca "carreira" (isso virou
regra no `CLAUDE.md`).
Detalhe de propósito: vender e recomprar a mesma carta **devolve o número inteiro**.

### O que estava errado antes
Os três números ficavam lado a lado falando de tempos diferentes, sem avisar:
**JOGOS** já vinha somado de todas as temporadas (o 304 do Gilmar), **GOLS** e
**ASS** eram só da temporada. Dá pra ler tudo errado.

### O que foi feito
- **Motor**: `condicaoCarry` passou a carregar `gl` (gols) e `as` (assistências)
  junto do `g`/`j` que já levava. Os números da temporada vão na ação da virada
  (`golsCard`/`assCard`), porque quem os calcula é a tela, não o reducer.
- **Tela**: a ficha virou duas colunas — `ESTA TEMPORADA` (cinza) e `NO SEU CLUBE`
  (dourada), com jogos/gols/assistências nas duas. **Gás, valor e salário** desceram
  pra faixa própria, porque não são de temporada nem de total: são de AGORA.
- O "nesta temporada" sai por **subtração** (`jogos` já vem somado menos o `antes`),
  então não existe segunda contagem pra desencontrar da primeira.

### Onde NÃO mudou nada
Sem condição física (Várzea, Série D, carreira antiga sem Agência) não existe
contagem de jogos — lá fica a faixa única de sempre, sem coluna vazia inventada.

### ⚠️ O que o Diego já sabe e aceitou
Carreira que já está rolando **começa o total de gols e assistências do ZERO** — o
passado nunca foi gravado, não dá pra recuperar. Os **jogos** continuam certos.
- ⏳ **Pendente**: ele não respondeu se quer o aviso **"desde agora"** escrito na
  tela na 1ª temporada. Não pus, porque é texto novo e ele decide o visual.

### ✅ Fechado no mesmo dia: a COPA SOMA, e sem aviso
Perguntei as duas coisas que tinham ficado; resposta dele: *"deve somar sim. E não
precisa de aviso não"*.
- 🧮 **Gol e assistência de COPA agora contam** na temporada do jogador. Não dava
  pra usar a lista `scorers` da Copa: ela é cortada no **top 20 da competição**, e
  quem fez 1 gol de copa simplesmente não aparecia. Então `CopaResult` e
  `CopaBrasilResult` ganharam `goalsByCard`/`assistsByCard` — a conta COMPLETA por
  carta —, e a tela soma liga + copa num mapa só (`golsTemporada`/`assTemporada`).
  Os QUATRO lugares passaram a usar o mesmo número: a ficha, a coluna ⚽/🅰️ do
  elenco, a imagem de compartilhar e o acumulado que atravessa a virada.
  ⚠️ **O `goalsByCard` CRU ficou intocado de propósito**: é ele que alimenta a
  ARTILHARIA e o prêmio do artilheiro, que são do CAMPEONATO. Misturar copa lá
  mudaria quem leva o prêmio, e isso ninguém pediu.
- 🔕 **Sem aviso "desde agora"** na tela — ele dispensou.

### Pendências
- **Dá pra voltar atrás?** Dá: reverter o commit. O `gl`/`as` do save são campos
  opcionais — save novo aberto em versão velha simplesmente ignora os dois.

## 18/09/2026 (parte 10) — 🏟️ ETAPA 3 FECHADA: o batismo aparece pra TODA a sala ✅ NO AR

Diego, depois do conserto da mascote do Leite de Verdade: *"ué, pra mim já era assim
normalmente… o mascote, seja no modo carreira ou online, ele deve aparecer nos times de
batismo pra todo mundo"*.

**Ele estava meio certo — e a diferença importa.** Pra clube batizado jogando com o NOME
DO BATISMO, sempre foi assim: a lista fixa (`CARIMBO_GOL`/`LOGOS_PRONTAS`) é pública, todo
mundo enxerga, na carreira e no online. O furo era só quando o DONO joga com **outro
nome** — o normal no online, onde o nome do clube é digitado. Aí a arte vinha pelo E-MAIL
(regra de 08/09) e e-mail só decora a tela do próprio dono.
👉 Era exatamente a **"Etapa 3"** anotada em 08/09. **Fica fechada aqui.**

### O caminho já existia
Desde 10/08 o MANTO de cada assento viaja pra sala inteira por `esc_mantos_sala`
(assento → conta → `esc_socios`, devolvendo SÓ assento → cores; o e-mail nunca sai do
servidor). Agora a MASCOTE e o ESCUDO usam a mesma porta.
- **Banco**: `esc_mimos_sala`, **irmã** da antiga e não substituta — a `esc_mantos_sala`
  fica intocada, pra nenhum navegador aberto quebrar no meio de um jogo.
- **Código**: o registro mora no **provider** (`store.tsx`), não numa tela — o carimbo do
  gol é desenhado em vários lugares, e assim sala rápida, liga e carreira online passam a
  enxergar de uma vez.

### ⚖️ A ordem da busca É a segurança (não mexer sem entender)
1. **lista FIXA** (clube batizado pelo nome) — ganha de tudo, então ninguém rouba arte
   alheia digitando o nome do clube dos outros;
2. o que o **servidor** disse sobre os assentos DESTA sala;
3. o **meu próprio** batismo (vale offline, onde sala não existe).
E ao sair da sala a lista é **zerada**: mimo de sala sobrando viraria arte de outra pessoa
num bot do jogo solo seguinte.
🧪 `npm run mimos` seções 5–8 guardam isso, incluindo a tentativa de roubo de arte.

### 🚫 Sem linha de novidade — de propósito
Anunciar "agora aparece pra todo mundo" é dizer "antes não aparecia". Regra da casa:
**bug nunca vira novidade**.

---

## 18/09/2026 (parte 9) — 🎁📝🤖 Três pedidos dele numa tacada ✅ NO AR

### 🐮 A mascote de gol do dono sumia no ONLINE — e não era cadastro
*"O usuário do Leite de Verdade, que tem batismo, disse que quando ele joga online o
gol do mascote dele não tá aparecendo"*.
**Causa (medida no banco, não chutada):** no online o nome do clube é o que a pessoa
DIGITA, e o jogo cola o selo do apoiador. No banco o clube dele está como
**"Loopesmiranda FC 👑🖋️"**, não "Leite de Verdade FC" — então `CARIMBO_GOL` não acha, e
quem deveria salvar é a regra de 08/09 (mimo segue o E-MAIL). Só que as duas pontas
usavam chaves diferentes:
- REGISTRO ("qual é o meu clube") → `loopesmiranda fc 👑🖋️`
- BUSCA (a tela, com `nomeLimpo`) → `loopesmiranda`

A tela limpava o selo; o registro guardava com ele. E o emoji no fim ainda impedia o
corte do "FC", dobrando o estrago. **Conserto num lugar só**: `chaveEscudo` (mimos.ts)
tira selo, "(você)" e acento ANTES de cortar FC/EC/SC — como é a chave dos DOIS lados,
acerta registro e busca juntos, e vale pro escudo e pro manto pelo mesmo caminho.
A linha dele em `esc_socios` estava completa (sócio 45, escudo_time, mascote_key).
🧪 Trava nova: **`npm run mimos`**. Cobre o caso real, a limpeza do que é enfeite, e —
o que mais importa — que **mimo meu nunca vai pro clube de outro humano nem de bot**.

### ⚠️ PENDÊNCIA QUE FICA: os OUTROS ainda veem pelo nome
Isto conserta a tela **do dono**. Os outros jogadores da sala continuam desenhando o
clube dele pelo NOME — é a "Etapa 3" aberta desde 08/09. Pra a sala inteira ver a
Mimosa no gol dele, ou o nome que ele usa online entra em `CARIMBO_GOL`, ou o mimo
passa a viajar pelo e-mail na sala. **O Diego foi avisado e não decidiu ainda.**

### 📝 O contrato da comissão passou a VARIAR
*"Sobre contratos: mesmo tempo, igual faz pro jogador"* e, sobre o sorteio curto que
ofereci, *"opção A, mas quero mais tempos, acho que falta um de dez, sei lá"*.
O prazo agora é **sorteado na assinatura: 3 · 5 · 10** — a MESMA escada do jogador
(`renewOptions` já oferece 1/2/3/5/10). Pesos 30/45/25 → média **5,65**, de propósito:
item PAGO não pode virar aposta ruim, então ninguém fica pior que os 5 fixos de antes.
O número sorteado **aparece no log da assinatura** — a tela nunca promete 5 e entrega 3.
⚠️ O teto da cura e o da tela subiram de 5 pra `CONTRATO_MAX` (10) junto — senão o
conserto de hoje de manhã cortaria contrato legítimo.

### 🤖🌱 O automático avisa quando fica sem reserva
*"Os três meio-campos cansaram, o automático ligado e não tem reserva. Tem que aparecer
uma pergunta: você quer que suba um jogador da base? Aí ele responde sim e cai na área
da base"*. Feito — **só com o automático ligado**, por ordem dele (quem troca na mão
segue com o aviso curto). Faz sentido: com o automático ligado o botão verde de
RODIZIAR nem aparece, então nada na tela dizia que ele tinha travado.
A caixa diz **qual posição** está faltando, e o "AGORA NÃO" guarda a situação recusada
(volta sozinho quando muda quem está cansado). **Nada sobe sozinho.**

---

## 18/09/2026 (parte 8b) — 🏛️🌱 As pílulas do Elenco viram DESTINO ✅ NO AR

Ele pegou AO VIVO: *"hoje quando apertava nessas pílulas tava jogando pro final da tela
sem nada"*. Culpa da entrega de 18/09 de manhã: eu limpei o meio da tela e deixei as
caixas no PÉ da página, com as pílulas só ROLANDO até lá — com elenco de 27 a lista
ficou comprida e o rolar terminava no rodapé.
1. **A pílula de SAF saiu** (*"já tem embaixo SAF"* — a ABA continua).
2. **Base** abre a área da Base no lugar da lista.
3. **Comissão** abre o Departamento Técnico ali mesmo — e por isso ele saiu do pé.
Detalhe da causa: a área só existe DEPOIS do React desenhar, então rolar no mesmo
instante do clique não achava nada. Agora rola no `requestAnimationFrame`.

---

## 18/09/2026 (parte 11) — 🗄️ O banco ganha do código: o manto errado do Manfré e mais 9 clubes no jornal

O Diego liberou o Supabase pra eu fechar a perna do banco do Remoçada. Fechei — e
a varredura que fiz de carona achou duas coisas.

### 1. 🔴 O Manfré FC estava com o manto errado há 19 dias
`meuManto()` lê `esc_socios` PRIMEIRO e só cai no `MANTO_CONTAS` se o banco não
tiver nada. Ou seja: **remedir a cor e mexer só no código não muda nada pro dono**.

Foi exatamente o que aconteceu. A cor do Manfré foi medida na 2ª camisa que o dono
mandou (30/08), o código virou `#EC121C/#0135A3` — e o banco continuou com
`#0E3E86/#C2452F`. O Daniel passou 19 dias vendo o manto velho, e **nenhuma trava
pegava**, porque `checa-batismos.mjs` roda offline.
✅ Corrigido no banco. E a lição virou regra no `CLAUDE.md`: **remediu manto, roda
o `update esc_socios` junto.**

Varri os 52 clubes com manto no banco contra o código: **era o único em desacordo**.

### 2. 🎽 9 clubes ficariam de fora da foto do campeão
A peça de hoje à noite lê a cor de `batismos.ts`, que eu tinha preenchido a partir
do `MANTO_CONTAS` — e o `MANTO_CONTAS` só tem quem **mandou camisa**. Clube cujo
manto o Diego escolheu no painel mora só em `esc_socios`, então ficou sem cor no
código e a foto ia sair genérica pra ele.

Entraram agora, com a cor que já está valendo no jogo: **Coringas do Diniz ·
Crias do Bigão · Deportivo Montreal · Eros FC · Futpoint FC · Leão da Estradinha ·
Nata de SP · Sapekeiros FC · Skyy FC**. Conferi os quatro primeiros na bancada: o
Nata sai amarelo e preto, o Bigão azul e amarelo, o Montreal preto e branco, o
Manfré vermelho e azul (já com a cor corrigida).

Isso segue a regra que ele deu — *"quando for genérico, mantém genérico"* vale pra
clube de CPU, não pra batismo que tem manto.

O guarda foi ajustado pra entender a diferença: **cor só em `batismos.ts` é
normal** (manto do painel); **cor só em `MANTO_CONTAS` é furo** (a foto sairia
genérica pra quem tem camisa).

### Remoçada: as outras pernas conferidas
Fundador ✅ · tier ouro ✅ · nomes reservados (`remoçada`, `remoçada fc`,
`remoçada ec`) ✅ · `esc_socios` com manto novo, `mascote_key = leao_thor` e
`escudo_time = Remoçada` ✅.

- **Dá pra voltar atrás?** Nas duas coisas. No banco é um `update` de volta
  (`#0E3E86/#C2452F` no Manfré, `#12256B/#FFFFFF` no Remoçada); no código é
  reverter o commit.
## 18/09/2026 (parte 10) — 🦁⚡ Remoçada de cara nova: a arte do dono entrou

O Diego mandou a prancha do clube (escudo + mascote + camisa, em tela verde) com
*"Remoçada eu fiz já ué"* — respondendo à lista dos 8 clubes que eu tinha dado
como "sem camisa". Ele tinha razão: a arte existia, só não estava no jogo.

O Remoçada era um dos **poucos que ainda tinham escudo e mascote em SVG desenhado
à mão** (de 08/08, antes da regra de peso). Agora os dois são `.webp` fora do
bundle, como manda a regra.

| peça | antes | agora | peso |
|---|---|---|---|
| 🛡️ escudo | SVG à mão no `.tsx` | `remocada-escudo.webp` 291×360 | 27,5 KB (teto 30) |
| 🦁 mascote | SVG à mão no `.tsx` | `remocada-mascote.webp` 280×440 | 43,1 KB (teto 45) |
| 🎽 camisa | não existia | Loja + acervo do post | 42,5 KB (fora do bundle) |

**Total do batismo: 70,6 KB** — dentro do teto de 75 KB.

### 🎨 O manto, medido (não chutado)
`['#072246', '#F8F8F8']` — azul-marinho e branco. O azul é **86% da camisa** e o
branco **4%** (gola, punhos e as duas listras da manga).
⚠️ A mediana crua dava `#031936`, quase preto, porque a arte tem sombreado pesado
e um leão estampado escuro no peito. A leitura boa veio do **pano dos ombros**,
longe da sombra — mesmo cuidado que o La Bestia Negra exigiu hoje de manhã.
❤️ Clube do Remo (o Leão Azul do norte, e daí o "impondo respeito no norte do
Brasil" da faixa do escudo). **Sem 3ª cor**: o vermelho é da CAPA da mascote, não
da camisa.

### Onde foi cadastrado
`escudos.tsx` (4 formas do nome) · `mascotes.tsx` (`leao_thor` — **a chave não
mudou**, é a que está no banco; entraram as 4 formas + o nome velho Olimpo FC, e
o `MASCOTE_NOME`) · `manto.ts` · `batismos.ts` (campo `manto`) ·
`salao-camisas.ts` + `public/mantos-salao/remocada-camisa-v1.webp` ·
`scripts/kits/remocada-camisa.webp` (a do post).

Com isso ele já entra de graça na foto do campeão de O MARTELO (a peça de hoje à
noite) — azul e branco, sem mais nenhum passo.

### ⛔ A PERNA DO BANCO AINDA FALTA — e ela GANHA do código
`meuManto()` lê `esc_socios` PRIMEIRO e só cai no `MANTO_CONTAS` se o banco não
tiver nada. Se a linha do `luiz.maia.luiz@gmail.com` tiver manto antigo gravado,
**ele vai continuar vendo o manto velho na própria tela** mesmo com o deploy
verde. Falta rodar (não consegui: o MCP do Supabase pediu aprovação):
```sql
update esc_socios set manto_c1 = '#072246', manto_c2 = '#F8F8F8',
       mascote_key = 'leao_thor', escudo_time = 'Remoçada'
 where email = 'luiz.maia.luiz@gmail.com';
```
É o mesmo erro do Al Takhadao (01/09): código pronto ≠ jogador atendido.

- 🦁 **Nome da mascote ("O Leão de Thor") é PROVISÓRIO** — a arte veio sem nome.
  Confirmar com o dono, igual às outras da lista.
- **Dá pra voltar atrás?** Dá: os SVGs antigos estão no histórico do git; é
  reverter o commit. Nada do jogo depende da arte nova.
## 18/09/2026 (parte 9) — 📰 A foto do campeão em O MARTELO sai com o manto do clube

Pergunta do Diego, com o print do jornal na mão: *"teria como, principalmente
quando for algum time de batismo, aparecer a camisa do time de batismo no lugar
desses jogadores? Ou seria muito trabalho? Ou você quer fazer uma arte nova… ou
mantém a mesma arte que já tem da foto, mas só botando a camisa?"*

**Escolhido (e aprovado por ele): manter a arte e repintar o uniforme.** Foi
mockup antes, commit depois — ele viu as cinco variações e respondeu *"Ok pode
fazer"*.

### Por que não foi arte nova por clube
~60 KB vezes 53 clubes, e o alvo dele é **10 mil batismos**. Morre na regra de
peso (a mesma que mandou escudo e mascote virarem `.webp` fora do bundle). Aqui é
**UM arquivinho de máscara por foto** — `jornal-liga-manto-v1.webp` (2,6 KB) e
`jornal-copa-manto-v1.webp` (3,7 KB) — que serve pra **todos os clubes**,
inclusive os que ainda não mandaram camisa e os batismos que nem existem ainda.
**Zero KB por clube.**

### Como funciona
1. A máscara marca, pixel a pixel, o que é listra CLARA e o que é listra ESCURA.
   Gerada por `python3 scripts/mascara-jornal.py` (roda uma vez; se a arte do
   jornal trocar, roda de novo).
2. `src/escalacao/jornal-manto.tsx` desenha a foto num canvas e troca as duas
   cores **mantendo o brilho original** — por isso dobra de pano, sombra e vinco
   continuam lá; muda só a cor.
3. As 2 cores saem de `batismos.ts` (campo `manto`), pelo **NOME do clube**.

### 🔑 A parte que não é óbvia: por que o manto agora vive em dois lugares
`MANTO_CONTAS` (manto.ts) é chaveado por **e-mail** — e e-mail só serve pra
decorar a tela do PRÓPRIO dono. A foto do campeão é diferente: quem lê o jornal
pode ser qualquer um, e o campeão é achado pelo **nome do clube**. Então a cor
(que já é pública — está à vista na Loja do Clube) desce em `batismos.ts`, e o
**e-mail continua fora** desse arquivo, como sempre foi.
🔒 `npm run batismos` compara as duas listas clube a clube e **reprova** se
discordarem — duas listas sem trava sempre acabam brigando.

### Onde aparece
Carreira (`jornal-career-visual`), online (`jornal-online-visual`) e as **duas
imagens de compartilhar** (o canvas de `jornal.tsx` e o `buildOnlineSalaBlob`) —
a capa que ele manda no grupo sai igual à tela. Vale pro campeão da liga **e**
pro dono da Copa.

### O que NÃO muda
- **Genérico continua genérico**, como ele pediu: clube de CPU e batismo sem
  camisa cadastrada ficam com a foto de sempre.
- **Não atrasa nada** (regra de ouro do leilão): a pintura roda uma vez por
  clube, na abertura do jornal — fim de temporada, hora de pausa — e fica
  guardada. A tela mostra a arte genérica no mesmo instante e troca quando a
  pintada fica pronta. Qualquer erro (canvas bloqueado, arte que não carregou) cai
  na genérica, sem buraco na tela.
- **Dá pra voltar atrás**: apagar os 2 arquivos de máscara e o
  `jornal-manto.tsx`, e devolver o `<img src={ligaArt}>` nos três lugares. Nada
  do jogo depende disso.

### 🧪 Bancada nova: `scripts/teste-jornal/` + `node scripts/print-jornal.mjs`
Monta `CareerNewspaperStories` DE VERDADE e mostra os três casos de uma vez:
batismo com camisa (pinta), batismo sem camisa (genérico) e clube de CPU
(genérico). Existe porque a pintura roda no NAVEGADOR — medir a máscara em
Python prova metade do caminho.

### Pendências que ficam
- 🎽 **A manga sobra**: em uns jogadores o ombro/manga continua na cor velha,
  porque ali o pano não tem listra clara ao lado pra ancorar. Não parece bug (lê
  como manga de outra cor), mas dá pra melhorar numa próxima rodada da máscara.
- A foto do **artilheiro** não tem camisa listrada (é a chuteira de ouro), então
  fica fora disso de propósito.

## 18/09/2026 (parte 8) — 📱 A TELA DA SALA ONLINE NO CELULAR ✅ NO AR

Fecha o pedido dele depois de aprovar o desktop: *"quero uma ideia melhor visual também
pra dispositivos móveis igual fez pro desktop. Consegue? **Sem diminuir a área dos gols e
tamanhos de mascote e etc**"*.

### 😅 Antes: seis versões de mockup e ele se perdeu
Fui mandando desenho atrás de desenho e ele parou tudo: *"mas não o giro da rodada, as
zoeiras e etc? Sei lá, tô confuso, não sei o que faço"*. **A culpa era do método**, não
dele: eu nunca mostrei a LISTA do que existe na tela, só recortes.
Parei de desenhar e fui conferir bloco por bloco no código (`scripts/mockup-celular-lista.mjs`).
Duas coisas caíram por terra ali:
- **Os OUTROS JOGOS já estavam certos.** `.ll27-ticker` já é `overflow-x:auto` com card de
  230px logo abaixo do placar. Eu tinha inventado um problema — e na v4 encolhi o card pra
  132px, que foi o *"não gostei de você diminuir o tamanho dos jogos"*.
- **A zoeira nunca esteve na fila.** `ChatWidget` é montado no `index.tsx`, nível de app,
  como balão flutuante. Não tinha o que decidir sobre ela.
Sobraram 3 decisões de 12 blocos. Ele respondeu: *"ok publique"*.

### O que foi ao ar (3 commits isolados, cada um revertível sozinho)
1. **🏆 A tabela sobe.** No celular ela era a ÚLTIMA da fila. A fila passa a seguir o
   relógio: placar → outros jogos ao vivo → próximo jogo + tática → **TABELA** → giro.
2. **⚖️ A tática vira pílula.** O padrão que ele aprovou no Elenco no mesmo dia
   (`🎽 4-4-2 ▾`). Medido: a caixa cai de **197px → 94px** fechada.
3. **🧭 Uma navegação só.** As abas de cima (jogos · números · elenco) descem pra barra
   que já existe embaixo; Rank/Estante/Temporadas viram **📚 Estante** com as três em
   pílulas dentro do painel. Eram 7 botões de navegação; viraram 5.

### 🛡️ O desktop não foi tocado — e isso foi condição, não sorte
Ele aprovou a tela larga poucas horas antes. Tudo que é novo mora em
`@media (max-width:1099.98px)` e exige `.ll25-shell`:
- a coluna da direita virou duas metades dentro de um invólucro (`.ll-lado`) que no
  desktop é UM bloco na coluna 2 e no celular se dissolve (`display:contents`);
- a barra desenha os DOIS conjuntos de botões e a CSS escolhe qual aparece
  (`ll-barra-cel` / `ll-barra-desk` / `ll-abas-topo`) — **nada é remontado pelo React no
  meio da rodada**.
Medido na bancada com a CSS do build: desktop com tabela e próximo jogo no **mesmo y=502**
e o giro colado embaixo (sem buraco); barra de 5 botões cabe em **320px** em PT e EN.

### Não existe estado sem navegação
Sem a barra na tela (preview do Diego offline, ou durante a Copa) as abas de cima
continuam onde sempre estiveram. Foi a primeira coisa conferida antes de mexer.

### 📌 Lição pro repo
**Mockup não substitui inventário.** Quando o dono se perde entre versões, o problema
quase nunca é a versão — é que ninguém listou o que existe hoje. A lista fez duas das
seis versões virarem pó e o trabalho encolher de 12 decisões pra 3.

---
## 18/09/2026 (parte 7) — 👕 A GAVETA ESQUECIDA: 5 camisas de batismo que nunca chegaram na Loja

Cobrança do Diego, com a foto da Loja do Clube na mão: *"a camisa do La Bestia Negra não
atualizou… então outros de batismo ainda não devem? Ou só ele?"*

**Não era cache nem arte errada — o clube nunca esteve na lista.** A camisa que o dono
manda no batismo é usada em DOIS lugares diferentes:
- `scripts/kits/` → o ACERVO, que o **post** usa (por isso o post do batismo sempre saiu
  com a camisa certa, e ninguém desconfiou);
- `public/mantos-salao/` + `CAMISAS_SALAO` em `salao-camisas.ts` → o que o **site** serve
  na Loja do Clube.

Quando só o acervo é alimentado, a Loja cai no molde genérico (camisa creme/preta de
galão + escudo com a letra do clube) — exatamente o print que ele mandou.

**A varredura dos 53 batismos/sócios**: 40 tinham camisa, 13 não. Desses 13, **5 já
tinham a arte parada no acervo** e foram publicadas agora:

| clube | dono | arte parada desde |
|---|---|---|
| 🦊 La Bestia Negra | eltonfrossard45 | 09/08 (renovada 18/09) |
| 🌑🐺 Pesadelo Verde FC | portaltech.ep | 18/09 |
| 🐴 Fridão FC | felipe.ofrida | 16/09 |
| 😇🐷 São Marcos Antônio FC | marcomak03 | 13/09 |
| 👑 Internacional de Madrid | matheusstefanello372 | 14/09 |

Os **8 restantes** (Deportivo Montreal · SC Ferrari · Coringas do Diniz · Remoçada ·
Nata de SP · Sapekeiros FC · Marreco FC · Eros FC) seguem no molde genérico porque o
**dono nunca mandou camisa** — e isso é o certo até a arte chegar (nada de inventar
manto: regra do Diego de 18/08).

### 🛡️ A trava que deixou passar, e o conserto dela
`scripts/checa-salao.mjs` (`npm run salao`) conferia só as camisas **cadastradas** —
então no dia em que o clube não estava na lista, ele dava ✅. Agora ele lê a lista de
batismos/sócios do próprio `checa-batismos.mjs` (uma lista só, pra não discordarem) e
cobra clube por clube, separando:
- ❌ **arte no acervo e nunca publicada** → erro nosso, quebra o guarda (exit 1);
- ⏳ **dono nunca mandou arte** → aviso, não quebra.

### 🧪 Bancada nova: `scripts/teste-camisa/`
Monta a `CamisaLoja` DE VERDADE (o componente do jogo, com fornecedor no peito e Master
na barriga) pra qualquer clube cadastrado. `?molde=1` desenha o ANTES. Serve pra conferir,
em toda camisa nova, se a arte encaixa na janela e se as estampas caem no pano.

- **Dá pra voltar atrás?** Dá, e é barato: são 5 arquivos novos em `public/mantos-salao/`
  e 5 linhas em `CAMISAS_SALAO`. Tirando as linhas, o clube volta ao molde genérico na
  hora. Nada do jogo mudou — só o que a Loja serve.

### Pendências que ficam
- 🎽 **Pedir a camisa** pros 8 clubes sem arte (lista acima) — é o que falta pra Loja
  ficar 100% batizada.
- ⏳ 28 camisas antigas ainda sem `-vN` no nome (o guarda avisa). Não quebra nada hoje;
  no dia em que a arte de uma delas trocar, trocar o nome junto.

## 18/09/2026 (parte 6) — 🔓 O banco de 16 ABRIU PRA TODO MUNDO

Ordem dele, no fim do dia: *"publique isso pra todos já, não só no meu usuário"*.
`ELENCO27_GERAL = true` em `sport.ts`. A lista `ELENCO27_TESTERS` virou RESERVA — pra
fechar de novo é voltar pra `false` e ela reassume (o e-mail dele continua lá).

**As três pernas saíram juntas, como manda o roteiro** (código + o que o jogador vê + o
anúncio):
1. **Trava aberta** → elenco 27, aba Elenco nova, pílulas, aba SAF, atalhos, barrinha de
   gás no campinho: tudo de todo mundo agora.
2. **Linha em `novidades.ts`** (PT + EN) — o banco de 11 → 16, com o aviso do salário e
   da renovação na mesma frase. Era a pendência que estava aberta desde 16/09.
3. **A fita trocou o fecho**: `chegando` (dourado) → **`já está no ar`** (verde).
   Regravada. Fita não pode contradizer o jogo — a mesma regra que o reels do preparador
   registrou em 15/09.

### 🧪 A trava quebrou — e era pra quebrar
`npm run elenco27` reprovou na hora: a seção 1 dela guardava o mundo ANTIGO ("trava
fechada = elenco 22"), que deixou de existir. **Isso é o serviço dela**, não um defeito.
Atualizada pro mundo novo: hoje a seção 1 prova que **qualquer conta** chega a 27.
📌 Mesma limpeza no que virou herança: o alvo `elenco-antigo-celular` (`?novo=0`) saiu do
`print-elenco.mjs` — o `?novo=0` não fecha mais nada (o GERAL ganha da lista de e-mails),
então aquele print só enganaria quem viesse conferir depois.

## 18/09/2026 (parte 5) — 🌐 Minhas Ligas: os DOIS bugs do Bruno, com a causa achada

Diego trouxe o áudio do Bruno + a cobrança: *"eu já tinha pedido pra você arrumar o
Minhas Ligas do online, mas pelo visto ainda tem erros"*. Tinha mesmo. As duas causas:

### 1) 📣 "Chamar mais gente" — o amigo novo não entrava e o pregão continuava de onde parou
Bruno: *"tô jogando entre duas pessoas, chega um amigo, eu clico pra voltar pra sala de
espera, ele entra, eu abro o pregão de novo e continua só eu e o outro — o novo não entra
e o pregão continua de onde parou"*.
**Eram DUAS travas engolindo a largada nova, e em 15/09 eu consertei só UMA:**
- ✅ (15/09) `jaTocoAquiComoDono` — a guarda do eco da largada. Ganhou o `emJogoVivo`.
- ❌ **`jaIniciouRef`** — guarda "já montei ESTA sala" pela VIDA do componente. A 2ª
  largada da MESMA sala caía num `return true` e **não montava nada**. Agora o aviso do
  banco zera esse ref quando a sala volta pra `waiting` (chega em TODO aparelho, então
  host e convidados voltam a largar juntos).
- ❌ **o `game_state` guardava a partida inteira.** O `status: 'waiting'` sozinho não
  bastava: o estado salvo continuava com `managers` + `screen: 'auction'`, então a
  largada seguinte caía no ramo *"partida em andamento"* do `triggerStart`, que
  **RESTAURA** em vez de montar. Daí os dois sintomas de uma vez. Agora o
  `chamarMaisGente` grava `screen: 'lobby'` DENTRO do game_state — cirúrgico: é o campo
  exato que a conta olha, e liga/regras/baralho/senha ficam intactos.

### 2) 🌎 Baralho do MUNDO virando BRASIL
Bruno: *"colocou baralho mundo, porém quando jogou de novo apareceu baralho do Brasil…
depois de um tempo na sala começa a aparecer só jogador brasileiro"*.
**CAUSA: dois bichos com o mesmo nome.** A sala guardava a escolha em
`game_state.deck` — e `deck` é TAMBÉM o baralho de CARTAS do estado do jogo
(`Record<Sector, Card[]>`). No **primeiro save do host** (3 s depois de abrir o pregão)
as cartas gravavam **por cima** da escolha. Daí em diante `gs.deck` era um objeto; como
não é `'todos'` nem `'eu'`, caía no padrão: **Brasil**.
**Não dava pra só proteger o `deck`** — quem reconecta PRECISA das cartas nesse campo.
Então a escolha mudou de nome: **`deckSala`**, que entrou na lista protegida do save
(`salaFixaRef`, store.tsx) junto com `rivals`/`rivalTeams` (que sumiam pelo mesmo
motivo: não existem no estado do jogo). O `deck` velho só é lido se ainda for TEXTO.

📊 **O tamanho do estrago, medido no banco** (últimos 7 dias): **773 de 844 salas** com a
escolha destruída (`deck` virou objeto) — 92%. As 71 intactas são salas que nunca
abriram o pregão, ou seja, nunca chegaram no primeiro save.
⚠️ **Sala criada ANTES deste conserto não tem como recuperar a escolha** — a informação
foi sobrescrita. Sala nova nasce certa.

🧪 **Trava nova: `npm run sala`** (`scripts/testa-sala-online.mjs`) — as duas contas do
jogo copiadas (a de "restaura o pregão velho?" e a do baralho da sala), incluindo sala
velha intacta, sala velha já estragada e dez saves seguidos.
⚠️ **O que a trava NÃO cobre:** a sala de verdade. Este ambiente **não alcança o
Supabase**, então o que está travado é a REGRA, não a fiação.
↩️ Reverter: `git revert` do commit — são três pontos pequenos (lobby, screens, store).

## 18/09/2026 (parte 4) — 🐊 "Solta a mascote": agora ATRAVESSA A TELA ✅ CODADO E NO AR

Diego: *"esse solta o mascote das salas online está mt pequeno e sem graça… sei lá"*.

**Ele tem razão, e dá pra medir:** hoje o botão SOLTA A SUA MASCOTE (`MascoteJab`,
screens.tsx) manda um emote `masc:<chave>`, e o que aparece é uma **fichinha de 52px** na
fila de reações, do lado de *"soltou o bicho!"*. Comparando com o que já existe no jogo:
a cantada 💸 tem **chuva de dinheiro na tela inteira** (`MoneyRain`, ~2,4 s). Ou seja, a
mascote do **clube batizado** — a coisa mais pessoal que o jogo tem — tem MENOS teatro
que um emoji.

### A proposta (nada codado no jogo; só a bancada)
A mascote **ATRAVESSA a tela**, grande, por ~2,2 s: entra por um lado, cruza a parte de
baixo do jeito DELA, solta confete e deixa a faixa roxa *"Fulano soltou o bicho!"*.
- **Zero arte nova**: é a mesma arte e os mesmos keyframes da festa de campeão, incluindo
  o `FESTA_JEITO` (🦅 quem voa plana alto e sem sombra · 🐍 quem rasteja ondula rente ·
  o resto quica).
- **Não atrasa o jogo** (regra de ouro): camada fixa, `pointer-events: none`, fora do
  reducer — a MESMA receita da chuva de dinheiro. Não toca em lance, tempo nem resultado.
- Quem não tem clube batizado continua sem ver botão nenhum (régua dele).

🎥 **Bancada: `scripts/teste-mascote/` + `node scripts/print-mascote.mjs [--masc chave]`**
— grava ANTES × PROPOSTA lado a lado num mp4. Animação não se julga em print parado.

### ✅ Aprovado e feito
Ele escolheu: ***"atravessa a tela"*** — uma passada só, ~2,2 s. Entrou como
`MascoteAtravessa` (screens.tsx), montado ao lado do `MoneyRain`. **Este vale pra TODO
MUNDO** (não tem trava de conta): é cosmético, e quem não tem clube batizado continua
sem botão nenhum.
- 🧹 **A fichinha de 52px SAIU da fila de reações** quando o bicho grande está cruzando —
  senão era a mesma coisa duas vezes na tela, exatamente a bronca da faixa dos cansados.
  Chave que o aparelho NÃO sabe desenhar continua na fila com o 🎭 (nada se perde).
- 👥 Dois ao mesmo tempo cruzam juntos, em alturas diferentes (`MASC_ALTURAS`, sorteadas
  pelo id do emote, então re-render não faz o bicho pular).

### ⚠️ O que NÃO deu pra testar daqui — e por quê
O `MascoteAtravessa` lê `useEsc()` (estado da SALA + fila de emotes), que **só existe
numa sala online de verdade** — e este ambiente **não alcança o Supabase** (o proxy
bloqueia `faabglpjutwursgmrpny.supabase.co`, achado em 18/09 no bug do host).
Então a bancada é **ESPELHO, não importação**: ela copia os keyframes com os MESMOS
nomes e valores, e o `print-mascote.mjs` **compara os dois arquivos antes de gravar** e
falha se um mudar sozinho (hoje: 6 animações em sincronia). Ou seja, o movimento está
provado; o que falta ver com gente de verdade é a **fiação** (o emote chegando na sala).
↩️ Reverter é tirar `<MascoteAtravessa />` de uma linha no `screens.tsx`.
## 18/09/2026 (parte 3) — 🎬 Reels do banco de 16 (com o aviso de salário/renovação)

Pedido dele: *"preciso de mockup agora com vídeo padrão q sempre fazemos, dizendo q agora
aumentou o número de reservas incluindo mais um por posição, tendo agora mais 5. Porém,
abrindo mais vagas tb tem q tomar cuidado com salário e renovação. Portanto é algo mt bom
ter mais reservas e tal, mas com cuidado"*.

**`node scripts/video-reservas-reels.mjs`** — 1080×1920, ~26 s, mesma técnica dos outros
(cenas em keyframes de CSS, Playwright grava a tela, ffmpeg converte). Roteiro: banco
11→16 · +1 em cada posição · a conta (11+16=27, e a SAF por cima até 31) · ⚠️ o cuidado
(salário todo ano · renovação · o emprestado é de graça) · vaga a mais não é obrigação ·
marca.

🧾 **Os números saíram do CÓDIGO, não de cabeça** (pra fita não mentir):
- salário = `salaryOfCard`: **piso ÷ 10** por jogador, por temporada
- emprestado da SAF paga **ZERO** (primeira linha da mesma função) — virou cena
- renovar (`renewCost`): **5 temporadas = metade** · **10 = 90%**
- caixa no vermelho trava contratar/investir (já existia; entrou como aviso)

⚠️ **A FITA FINAL DIZ "CHEGANDO", NÃO "JÁ ESTÁ NO AR"** — de propósito: o banco de 16 está
travado na conta dele (`ELENCO27_GERAL = false`). **No dia de abrir pra geral**, trocar a
pílula da cena ⑥ pra `pill('já está no ar', GREEN, '#fff', 40)` **e** pôr a linha em
`novidades.ts` (com o campo `en`). Fita não pode contradizer o jogo — foi o cuidado que o
reels do preparador registrou em 15/09.

## 18/09/2026 (parte 2) — 😓 Gás volta ao campinho · 📤 compartilhar com o banco LISTADO

1. **A barrinha de energia VOLTOU pro campinho** (*"tá faltando a barrinha de energia no
   time titular do campinho"*). ⚠️ Isto **revoga a regra de 12/09** (*"não quero que
   apareça no campinho, só onde tem a listagem"*) — CLAUDE.md atualizado. Por que mudou:
   em 12/09 a barra dividia o boneco com ⚽, 🅰️ e cia., e virava painel; hoje o campinho
   está limpo (gol e assistência são COLUNA), então sobrou lugar pra única coisa que
   importa olhando o time que vai entrar. Vai a **barra crua**, sem número (o % vive na
   lista), e **só na tela nova**.
2. **📤 O compartilhar: banco LISTADO, não um segundo campinho** (*"ajuste o botão de
   compartilhar pra vir apenas os titulares do campo + o time reserva listado"*).
   Antes a arte desenhava **dois gramados** — o segundo era o banco —, o que dava a
   entender que os reservas também estavam em campo; e com o banco de 16 aquilo virava
   um campão de 4 linhas. Agora: campinho = quem JOGA; banco = ficha em **duas colunas**
   (rosto · POS · nome · clube·ano · ⚽), no fundo creme com a borda e a sombra da casa.
   🧹 De quebra: `titulares` saiu do pacote do compartilhar — era **dado morto**, ninguém
   desenhava com ele, e ficava parecendo que existia uma lista de titulares na arte.
3. 🧪 **Bancada nova: `scripts/teste-share/` + `node scripts/print-share.mjs`.** A arte é
   CANVAS — o `tsc` não enxerga UM erro de desenho ali. Sem bancada, eu só ia descobrir
   que quebrou quando ele tentasse postar. Ela desenha o pior caso (16 reservas) e o
   script falha com o stack na tela se a arte estourar.
   ⚠️ E ela caiu na primeira tentativa por culpa minha: usei `find(...)!` num nome que não
   está no catálogo de rostos e o `undefined` derrubou tudo. Agora tem fallback.
## 18/09/2026 — 🌑🐺 BATISMO: Pesadelo Verde FC (portaltech.ep) na Série C + 🦊 arte nova do La Bestia Negra

### 🌑🐺 Pesadelo Verde FC — batismo novo, 3 pernas fechadas
Pedido do Diego: *"faça batismo desse usuário aqui, que hoje é craque mas vai ser
batismo, troque por um time da Série C"*. Ele era **prata (Craque)** e subiu.

⛔ **Conta conferida ANTES de qualquer linha** (regra de 07/09): existe em `auth.users`.

- **Assento**: Série C, na vaga do bot **Zé Colmeia**, com
  `OLD_NAME['Pesadelo Verde FC'] = 'Zé Colmeia'`. O bot segue vivo em `CPU_MANAGERS`.
- **Manto**: quase-preto `#030A04` + verde-musgo `#597751`, **medidos na camisa**
  (84% e 7%); branco `#D8D6D1` da gola como 3ª cor (`MANTO_TRI`).
- **Banco** (feito e conferido): `esc_socios` nº **54** (`valido_ate 2099-12-31`,
  `origem batismo`) · `esc_fundadores` nº **73** · `user_colors` **ouro + manual** ·
  `esc_nomes_batismo` com **3 nomes travados** (o gatilho criou FC e EC).

### 🎨 RECEITA NOVA: recortar arte VERDE em chroma VERDE
Vale guardar, porque vai repetir. Medido nesta prancha: **5.319 pixels do pelo do
lobo e 3.553 do halo da lua** estão a menos de 60 de distância da cor EXATA do
fundo. Cortar por "verde forte" (o jeito das outras pranchas) comeria o raio e o
brilho — que é a identidade do clube.
👉 **A saída é cortar por LIGAÇÃO, não por cor**: o fundo é a mancha cor-de-chroma
que **encosta na borda da imagem**. Verde igualzinho dentro do desenho não encosta
em borda nenhuma, então fica. Buraco preso (vão entre as patas) só sai se for
grande. Está em `scripts/recorta-prancha-pesadelo.py` — é o script a copiar quando
a arte tiver a cor do chroma.

### 🦊 La Bestia Negra — arte nova do dono (renovação)
- Escudo e mascote **eram SVG desenhado à mão dentro do código** (de 09/08, antes
  da regra de peso). Saíram e viraram `.webp` fora do bundle.
- **Manto remedido**: azul `#011B8A` + branco `#E8E8EB`. O azul saiu da leitura do
  PANO (p65-p75 do brilho) — a mediana crua puxava pro quase-preto por causa do
  sombreado pesado. ⚠️ E a 2ª cor que estava no banco era `#F4ECD6`, que é
  **exatamente o creme da tela do jogo**: a listra clara dele sumia no fundo.
  Corrigido no banco também.
- 🕳️ **Buraco antigo fechado de lambuja**: ele tinha `FUNDADOR_N` mas **não tinha a
  linha de tier ouro** em `apoio.tsx` desde 09/08. No banco (`user_colors`, a fonte
  oficial) já era ouro, então nunca deixou de ver o dourado — a RESERVA é que
  estava vazia. `npm run batismos` foi de 40 → **42 completos**.

### ⏳ Pendente (avisar o Diego quando souber)
- 🦊 Nome da mascote do La Bestia (**"A Bestia"**) e do Pesadelo (**"O Pesadelo"**)
  são PROVISÓRIOS — as artes vieram sem nome.
- ❤️ Time de coração do dono do Pesadelo Verde: não sei, `time_coracao` vazio e o
  post saiu sem a linha.
- 📝 O escudo do La Bestia escreve **"LÁ BESTIA NEGRA"** (com acento). O clube no
  jogo é "La Bestia Negra" — **não renomeei**, nome de clube batizado é identidade
  e chave de save.

---

## 18/09/2026 — 👥 Aba Elenco: aba SAF, fora o Nº, o meio limpo, pílulas e a Base no banco ✅ NO AR (só a conta dele)

Diego, olhando a tela NO CELULAR dele (não mais a bancada): *"faltou a aba da SAF, como
pode ver na primeira foto q tá ótimo… Número n entendi pq significa… e já disse q nível n
precisa pq já basta o over c gás e a regra q o tier do usuário pode ver… e quero ver no
desktop e móveis como ficará, pois do jeito q tá c essa segunda foto n gostei, c mts coisas
no meio atrapalhando"*.

✅ **OK DADO E PUBLICADO** (*"ok faça tudo aí… como falei atualize apenas pro meu usuário"*).
Segue travado em `ELENCO27_TESTERS`.

1. **🏢 Aba SAF** — agora são três (⭐ TITULARES · 🔁 RESERVAS · 🏢 SAF). Ela estava no
   desenho aprovado e eu tinha entregado só com duas. Emprestado tem lugar próprio porque é
   outra coisa: não é do elenco, não gasta vaga e volta na virada. Quem está emprestado **e
   escalado** aparece nos titulares também, com o selo 🔁 EMP — esconder ele do time em
   campo seria mentira. Dentro da aba SAF o selo some (ali todo mundo é emprestado).
2. **🔢 Coluna Nº saiu** — e ele está certo: a carta NÃO tem número de camisa, então aquilo
   era só a ordem da linha. Número que não quer dizer nada, comendo a largura que o NOME
   precisava no celular. Inventar camisa seria pior: seria dado falso.
3. **Nível já estava fora** — a foto 1 dele é do DESENHO velho, que ainda tinha a coluna. O
   código mostra só OVERALL, com a trava do tier de sempre.
4. **🧹 O MEIO DA TELA (a bronca principal)** — entre o campinho e a lista moravam TRÊS
   caixas grandes (Departamento Técnico · Base · Folha), então pra ver o elenco ele rolava
   meia tela de coisa que não é elenco. Agora embaixo do campo ficam só **atalhos de uma
   linha** (🏛️ Comissão · 🌱 Base, quando tem vaga · 🏢 SAF) e a lista vem em seguida. As
   caixas inteiras desceram pro PÉ da tela — **nada sumiu**, o atalho rola até elas
   (`ID_COMISSAO`/`ID_BASE`) e o de SAF troca a aba na hora.
5. **📝 Contrato enxuto no estreito** — por extenso ele cortava o clube no meio ("São Paulo ·
   2005 · ⏳ ú…"). No celular sobrou só o EMOJI, e só quando é aviso (❗ vencido · ⏳ último
   ano · 🌱 sem contrato); "📝 4 anos" (tudo certo) saiu da linha e vive na barra do
   selecionado. No monitor continua por extenso.
6. 🏷️ O selo 🔁 EMP saiu de DENTRO do nome que corta — em nome comprido (David Beckham) o
   "…" comia justamente o selo.

🖨️ `node scripts/print-elenco.mjs` agora tira o print **em português** (`bl_lang`) e espera
por `domcontentloaded`, não `networkidle` — o ambiente não alcança o Supabase, então o
`networkidle` pendurava pra sempre. E ganhou o alvo `elenco-celular-saf` (n=31).

7. **🎽🔁 O TOPO TAMBÉM ESTAVA CHEIO** (*"essa foto tb tá c mt informação"* — a foto era o
   topo: Formação + Trocas + Quem está cansado, tudo aberto ao mesmo tempo). Medi: a caixa
   da **Formação sozinha tem 171px** no celular — e isso **com UMA formação só** (sem
   técnico), ou seja, um botão e um parágrafo explicando que não dá pra trocar. A de Trocas
   é do mesmo tipo. As duas viraram **PÍLULA** (`🎽 4-4-2 ▾` · `🔄 Dinâmico ▾`) e só abrem no
   toque — os botões e os textos são os MESMOS, só pararam de ficar abertos o tempo todo.
   Régua que decidiu: **campo e lista você olha toda rodada; formação e modo de troca você
   mexe de vez em quando.** Altura fixa pra ação rara é troca ruim.
   ⚠️ O que NÃO virou pílula: 😓 **Quem está cansado**. Aquilo é ação com hora marcada (os
   nomes + o 🔁 RODIZIAR) — esconder seria esconder o problema.
8. **🌱 SUBIR DA BASE dentro do banco** (*"tem algum botão da base na área do banco? pra
   poder subir da base pros reservas se o cara quiser"*). Entrou no pé da aba 🔁 RESERVAS,
   que é onde se sente a falta de reserva. **Não duplica nada**: leva pra MESMA caixa da
   Base. Só aparece quando existe vaga (a caixa da Base já respeita `vagaCheio`).

9. **🚑 A FAIXA VERMELHA SAIU — eram duas caixas dizendo a mesma coisa** (*"não entendi
   por que tá aparecendo duas linhas da mesma coisa, esgotados em cima e embaixo também
   falando dos nomes cansados. Tá muita informação pra uma coisa só"*). Ele está certo: a
   faixa dizia *"9 esgotados — toque pra ver quem"* e, 100px abaixo, a caixa 😓 QUEM ESTÁ
   CANSADO já mostrava QUEM.
   👉 **Por que a faixa existia, e por que não precisa mais:** ela nasceu em 15/09 pra
   resolver *"o cara tem q descer lá embaixo p ver os cansados"*. Nesta tela isso **acabou**
   — a lista subiu, porque comissão/base/folha desceram pro pé. O atalho virou atalho pra
   uma coisa que já está na tela.
   Ficaram as duas que **não** se repetem: o **RESUMO** na linha do gás (`68% · 1 🥵`, com os
   contadores de volta, já que era a faixa que os carregava) e os **NOMES** na caixa.
   🔒 Trava fechada: `atalhoGas` ganhou `&& !elencoNovoOk`, então pra todo mundo a
   condição é a de sempre — não é screenshot, é o próprio `&&`.

### ⏭️ Pendente
- [ ] Mockup da novidade (11 → 16 reservas), só quando ele mandar abrir pra geral.

## 18/09/2026 — 👑 O DONO ENTRA NA PRÓPRIA SALA COMO CONVIDADO (medido: ~18% das travas)

Relato do Diego, com dois prints da live do canalmeianacanela (sala KIKO6I):
*"toda vez que um streamer vai fazer live… ele vem pra essa sala e, mesmo sendo
host, aparece no final o botão escrito 'o host vai começar o leilão', sendo que a
tela dele era pra ter o botão de iniciar… e quando ele atualiza no F5 volta ao
normal. Muita gente não sabe que precisa atualizar e acaba desistindo"*.

### 🧾 A PROVA (caixa-preta `esc_travas` × `game_rooms`)
Cruzei cada trava com o dono da sala no banco (`papel = 'convidado'` E
`game_rooms.host_id = esc_travas.uid` = o aparelho do DONO se achando convidado):

| dia | travas com a sala ainda no banco | dono como convidado | % |
| --- | --- | --- | --- |
| 18/09 | 263 | **51** (29 pessoas) | 19,4% |
| 17/09 | 738 | **129** (67 pessoas) | 17,5% |
| 16/09 | 634 | **118** (58 pessoas) | 18,6% |

⚠️ **NÃO é regressão nova** — eu quase disse que era. A conta crua parecia um salto
no dia 16 (2 → 118), mas é ilusão: sala some do banco quando o dono sai, e de 15/09
pra trás só **1%** das salas ainda existe, então os casos velhos ficam invisíveis.
Olhando só onde dá pra ver, a taxa é **estável em ~18%** — o defeito é antigo.

### O que isso significa de verdade
Não é só o botão sumido. As linhas têm `momento = 'envelope'`: o dono **entra no
pregão** como convidado. Com o jogo host-autoritativo, aí **ninguém é host** — e é
por isso que essas linhas existem, elas são relatos de "travou". Ou seja: 1 em cada
5 salas travadas é uma sala **sem dono nenhum**, com o dono lá dentro.

### 🚨 E o socorro que deveria consertar isso está MORTO
Existe desde 07/09 (sala do Sistematizados) um resgate no `store.tsx` (~9870): na
tela de abertura ele pergunta ao banco a cada 5 s quem é o dono e, se for este
aparelho, dá `BECOME_HOST` sozinho. Ele grava `extra.quando = 'reassumiu'`.
**Em 10 dias ele gravou UMA linha — e nenhuma na `streamIntro`.** Na prática não
roda. Conferido que não é o registro que falha: `anotaTrava` é à prova de erro e o
resgate chama com `semFreio = true`.
👉 Isso é o conserto de maior retorno: devolver a coroa a quem **o banco já diz que
é o dono** não é troca de dono — é exatamente o que o Diego permite (*"quem já é
dono no banco reassume sozinho ao voltar"*).

### 🔎 Mecanismo mais provável (hipótese, ainda não provada)
No `lobby.tsx` o `triggerStart` roda DUAS vezes no aparelho do dono na largada:
uma pelo botão (`startGame` → `update status='started'` → relê → `triggerStart`) e
outra pelo ECO do banco (`postgres_changes` → `if (r.status === 'started')
triggerStart(r)`). Desde **83735ee (15/09)** a guarda `jaTocoAquiComoDono` exige
`emJogoVivo` (tela ≠ lobby) — e o dono está EXATAMENTE no lobby quando aperta o
botão, então a guarda não cobre. As duas chamadas correm juntas; o `jaIniciouRef`
só é marcado no fim, depois de vários `await`, então as duas passam por ele e as
duas despacham `START_ONLINE`. A última a chegar manda — e a do eco calcula o dono
a partir de um `host_id` que o próprio código já avisa que "chega picado".
⚠️ Marcado como HIPÓTESE de propósito: a taxa estável desde antes de 15/09 diz que
existe pelo menos mais uma porta. Não mexer sem instrumentar primeiro.

### ✅ CONSERTADO (18/09) — o Diego liberou: *"faz os 2 logo cara, lembrando que o
host que cria a sala nunca pode mudar"*. Dois commits separados, revertíveis um a um:

**1. `store.tsx` — a coroa volta sozinha pro dono.** Efeito PRÓPRIO, fora do vigia
(era lá que o socorro velho morria). Pergunta ao banco quem é o dono e só age se a
resposta for ELE MESMO; se for outro uid, ou se a leitura falhar, não faz nada.
1ª checagem em 800 ms (é a que resolve o caso do streamer, sem F5); depois só
insiste quando o aparelho não ouve host NENHUM há 6 s — convidado de verdade ouve
o "tô vivo" do dono a cada ~4 s, então pra ele roda uma vez e para (isso segura o
custo de banco: sem esse freio seriam 13 aparelhos consultando a cada 4 s numa
sala de 14).

**2. `lobby.tsx` — a coroa só cai com PROVA, e uma largada por vez.**
- `donoDaSala === user.id` tratava "não sei quem é o dono" e "o dono é outro" como
  a MESMA coisa: as duas leituras falhando davam `undefined === user.id` = FALSE e
  o dono se rebaixava sozinho. Agora, sem dono na leitura, quem já é dono DESTA
  sala continua dono. Handoff de verdade (banco apontando outro uid) segue igual.
- Cadeado de largada: o `triggerStart` rodava DUAS vezes no aparelho do dono (o
  botão e o eco do banco), as duas penduradas em `await`, e o `jaIniciouRef` só era
  marcado no fim — as duas passavam e as duas montavam o jogo. Agora, enquanto uma
  largada da sala está em voo, a outra devolve na hora.
- Registro novo na caixa-preta: `coroa_preservada` (leitura sem dono, coroa
  mantida) e `coroa_devolvida` (o socorro agiu). É com isso que dá pra conferir
  amanhã se funcionou, sem depender de relato.

🚫 **A COROA CONTINUA SEM TROCAR DE DONO.** Conferido no diff: **nenhuma das duas
mudanças escreve `host_id`** em lugar nenhum. Não há eleição, candidato nem votação
— o aparelho só pergunta "sou eu o dono?" e, se for, volta a ser. É o caso que o
Diego sempre autorizou (*"quem já é dono no banco reassume sozinho ao voltar"*).

### 📊 COMO CONFERIR SE DEU CERTO (rodar amanhã)
```sql
select date_trunc('day', t.created_at)::date dia,
       count(*) filter (where t.extra->>'quando' = 'coroa_devolvida')  as socorro_agiu,
       count(*) filter (where t.extra->>'quando' = 'coroa_preservada') as rebaixamento_evitado,
       count(*) filter (where t.papel = 'convidado' and g.host_id = t.uid) as dono_como_convidado,
       count(*) filter (where g.id is not null) as base
from esc_travas t left join game_rooms g on g.id = t.room_id
where t.created_at > now() - interval '4 days' group by 1 order by 1 desc;
```
O que esperar: `dono_como_convidado / base` cair dos ~18% de hoje. Se não cair mas
`coroa_devolvida` subir, o socorro está tapando o buraco sem fechá-lo — aí a caça
continua na largada. **Se `coroa_preservada` aparecer muito, a hipótese da leitura
picada estava certa.**

---

## 16/09/2026 (parte 2) — 🚨 A trava da crise NUNCA EXISTIU (ligada agora)

Diego, depois do primeiro conserto: *"eu não entendi que, se foi menos 500 lá atrás,
a mensagem deveria aparecer, ele deveria resolver, fazer as coisas que ele tem que
fazer na hora, OBRIGADO a fazer, e seguir. Eu não entendi como é que ele conseguiu
seguir jogando, fazendo dinheiro, e a mensagem está aparecendo"*.

Ele estava certo, e a resposta é pior do que parecia: **a trava nunca foi ligada.**

### O que estava no código
O comentário da fila de avisos dizia, desde 12/08: *"a crise trava até o técnico
escolher"*. Mentira do comentário. Na prática:
- `decisoesOk = sponsorBetOk && masterOk` — a crise não estava lá;
- `SimControls canNext = roundReady && !intervalo && !pênalti` — a crise não estava lá;
- o efeito do modo automático parava em `eventoPendente` (evento de JOGADOR) — **mas
  não em `criseAtual`**.
Ou seja: o evento de jogador travava a rodada; a crise financeira tinha ficado de fora.
Era literalmente por isso que o dono do Divizeiro seguiu jogando e faturando com o
aviso pendurado — o modo automático dele andava sozinho por cima da crise.

### O que foi ligado
`criseTrava` entra nos três portões: `decisoesOk`, o `canNext` do controle e o
botão de começar a temporada. O rótulo vira **"🚪 Decida quem fica no lugar dele"**, e
o selo da virada conta a crise como uma decisão pendente.

### ⚠️ Por que travar só é seguro JUNTO com o conserto da parte 1
A saída *"Nunca gostei dele mesmo"* (sobe alguém da base) não depende de nada — nem de
moeda, nem de folclórico livre, nem de vaga. Sempre há caminho pra destravar.
**Mas**: se a trava fosse ligada sozinha, os saves que já estavam PRESOS com o aviso e
o caixa recuperado (o Divizeiro, +3.870) ficariam travados PRA SEMPRE numa tela que
não faz mais sentido. É o conserto da parte 1 (o aviso expira fora do vermelho) que
solta esses saves. As duas coisas são uma entrega só.

### Provado no jogo rodando, não no papel
`node scripts/navega-carreira.mjs --fase crise` — abre o jogo, injeta a crise e espera:
- caixa **-900** + crise → a rodada FICA na 34 com o aviso na tela ✅
- caixa **+3.870** + crise → o aviso expira sozinho e o jogo segue ✅
E `npm run crise` (18 conferências no motor) continua cobrindo a escada -500/-1000.

### Lição pro repo
**Comentário não é trava.** O comentário dizia "trava" e ninguém conferiu por um mês.
Toda regra que promete bloquear alguma coisa precisa de um teste que ABRE o jogo e
confere que bloqueou — foi assim que este aqui foi pego.
---

---

## 16/09/2026 (parte 18) — 🏢 A SAF entra POR CIMA: 27 + 4 = 31
Diego: *"tem a SAF também, né? A SAF o usuário pode pegar emprestado quatro jogadores.
Então pode ir de 27 para 31. Era isso que dava para marcar."*

**No MOTOR já estava certo** e eu conferi antes de mexer: `LOAN_FROM_FILIAL` limita o
empréstimo pela **vaga da DIVISÃO** (`FILIAL_SLOTS` — A 4 · B 3 · C 2 · D 1), nunca pelo teto
do elenco. O emprestado sempre entrou por cima, e volta pra SAF na virada.

**Errada estava a CONTA DA TELA**, e era erro NOVO, meu, da entrega de hoje: a aba dizia
`(${'{'}reservas{'}'}/16)` contando o emprestado junto, então com 4 da SAF ia aparecer
**"20/16"** — número impossível, cara de bug. Consertado: o teto conta só o que é SEU e o
empréstimo aparece à parte.
- selo do cabeçalho: **`27/27 +4 🏢`** (era `31/31`, que fazia o teto parecer outro)
- aba do banco: **`🔁 RESERVAS (16/16 +4 🏢)`**
- com a trava fechada, o selo fica **byte a byte** o texto de sempre.

🧪 Entrou no `npm run elenco27`: elenco próprio cheio em 27 fecha o pregão · os 4 da SAF
levam a 31 · e o teto DELE segue 27 (empréstimo não gasta vaga).

📌 **Lição:** quando um teto muda, **toda conta que usava o teto velho vira suspeita**. Eu
mexi no número e não varri quem mais o lia — quem varreu foi ele, de cabeça.

## 16/09/2026 (parte 17) — ⚠️ CORREÇÃO: o leilão de reservas NÃO muda (são 11, sempre)

Diego, logo depois da entrega da parte 16: *"o leilão de reserva são 11 jogadores sempre.
Poder comprar mais cinco jogadores agora não tem nada a ver com o leilão de reserva, leilão
de titulares, não tem nada a ver. É durante o jogo, durante as temporadas, o usuário, se ele
quiser comprar para ter mais cinco reservas, ele compra. Se ele não quiser, também tá tudo
certo. O leilão de reserva mantém-se igual, que são 11."*

**Eu tinha posto o +1 por posição nos DOIS lugares** (`slotsOf` e `slotsCheio`) e escrito no
commit que era obrigatório mexer nas duas. **Estava errado** — `slotsOf` é o ALVO DO PREGÃO,
e o pregão ele não quer mexer. Revertido: `slotsOf` volta a `baseSlots × 2` (22), então o
leilão de reservas é byte a byte o de antes, pra ele e pra todo mundo.
O +1 por posição fica **só em `slotsCheio`** = **teto do elenco** (27), que é o número que a
tela mostra e o que limita quem entra fora do pregão.

### ✅ RESOLVIDO na mesma conversa — onde ele compra os 5
Perguntei e ele respondeu: *"ele contrata quando ele quiser, quando aparecer leilão ou
mesmo time… não tem exigência nenhuma"*. Ou seja: **é no leilão mesmo**, sem obrigação
nenhuma e sem tela nova.

Como ficou no código (duas regras que não brigam):
1. **O pregão é montado igual ao de sempre** — `slotsOf` (a mira, que decide o tamanho do
   baralho e a fome dos bots) segue **22**. "O leilão de reserva mantém-se igual, que são 11."
2. **Mas o técnico HUMANO nunca é BARRADO no 22º.** `openSlots` — que é quem ANULA lance,
   libera a repescagem e deixa pegar do monte — passou a usar o **teto do elenco**
   (`slotsCheio`, 27) **quando o pregão está aberto** (`deepSquad`). Se ele quiser gastar e
   levar o 27º, leva; se não quiser, fica em 22 e está tudo certo.
   ⚠️ **Só com o pregão aberto**, de propósito: fora dele o alvo volta pra 11 e esse mesmo
   número alimenta o "−N 🕳️" do gerenciar e a vez do monte — se crescesse o ano inteiro, a
   tela ia dizer que falta gente sem faltar. (Peguei isso porque `npx tsx
   scripts/testa-cria-base.mjs` quebrou na hora.)
3. Bot, rival e **o online inteiro** seguem em 22.

🧪 **Trava nova: `npm run elenco27`** (`scripts/testa-elenco-27.mjs`) — 15 conferências que
viram a regra dele em teste: trava fechada não muda nada · trava aberta mantém a mira em 22
e ainda deixa 1 vaga por posição · elenco 27 fecha · bot/rival/online intocados · fora do
pregão o número de vagas não muda.

#### (o levantamento que gerou a pergunta, guardado pra memória)
Hoje, na carreira, **não existe comprar jogador durante a temporada**. As entradas de jogador
são: **leilão** (entre temporadas, agora travado em 22), **Base/cria** (respeita `vagaCheio`,
ou seja, já usa o teto 27 ✅) e **empréstimo da SAF** (limite por divisão, `filialSlots`, e
entra POR CIMA do teto). A própria tela diz isso: *"Contrate no leilão ou traga da SAF"*.

Foi por isso que eu perguntei em vez de chutar — e a resposta dele (acima) fechou pelo
caminho mais barato: **nada de tela nova, é no pregão que já existe**.

## 16/09/2026 (parte 16) — ✅ CODADO: banco de 16 + aba Elenco nova, TRAVADA na conta do Diego

Ordem dele: *"antes eram 11 reservas, agora são 16 reservas, mais um por posição — um
goleiro, um zagueiro, um lateral, um meio e um atacante"* + *"você só vai publicar agora,
da forma que eu quero para desktop e dispositivos móveis"*, e no fim do dia:
***"só p meu usuário msm por enquanto"*.**

### O que foi pro ar (e pra quem)
🔒 **TUDO abaixo só aparece pra `diego.c.fonseca@gmail.com`.** Trava:
`ELENCO27_GERAL = false` + `ELENCO27_TESTERS` em `src/escalacao/sport.ts`
(`useElencoNovo()` na tela · `elencoNovoLiberado()` no motor).
Pra soltar pra geral: **`ELENCO27_GERAL = true`, e mais nada**.
Com a trava fechada a aba é **byte a byte a de sempre** — conferido com print
(`node scripts/print-elenco.mjs`, alvo `elenco-antigo-celular`).

1. **Banco de 11 → 16 (elenco 22 → 27)**, `+1 por posição`, em `store.tsx`:
   `extraDoDono()` entra em **`slotsOf` E `slotsCheio`** (as duas! só uma não adianta:
   `slotsOf` é o alvo do LEILÃO e `slotsCheio` é o teto da Base).
   - Vale **só pro técnico HUMANO** (bot/rival seguem 22) — palavras dele:
     *"eu não tô falando de bot, de rivais, eu tô falando do usuário principal"*. Por isso
     a demanda do baralho cresce 5 cartas NO TOTAL, não 5 por time.
   - Vale **só no OFFLINE** (`MODO_ONLINE`, espelhado do `state.onlineMode` a cada ação do
     reducer): o online no ar não muda sozinho.
   - **Ninguém é obrigado a comprar** — vaga a mais é vaga vazia até você dar o lance.
     Conferido: o leilão de reservas roda com `noFake`, então **nunca entra perna-de-pau**
     pra tapar a vaga nova.
   - O selo do cabeçalho agora lê `elencoCheio(mgr)` — acabou o `22` escrito na mão.
2. **Aba Elenco nova** (`ElencoField`, pyramidseason.tsx):
   - 🖥️ monitor: a caixa do clube **sai da coluna de 576px** (vai a ~1180px, centrada) e
     fica **campo à esquerda (560px, boneco 88px) · lista à direita**; comissão, Base e
     folha descem pro pé da lista, senão sobrava vão verde. 📱 celular: **empilhado**,
     igual sempre.
   - A lista virou **TABELA com abas** (⭐ TITULARES · 🔁 RESERVAS n/16):
     `Nº · rosto · NOME (clube·ano + contrato) · POS · OVERALL · JOGOS · GOLS · ASS · GÁS · STA`.
     Coluna que depende de direito (OVERALL, do olheiro) ou de regra ligada (JOGOS/GÁS, da
     condição) **só existe quando tem o que mostrar** — coluna vazia com título parece bug.
   - **Sem coluna NÍVEL** (ordem dele: *"o nível n aparece… só overall msm q já vem c a cor"*).
   - **Campinho limpo**: saíram os selos ⚽ e 🅰️ de cima do boneco — os dois viraram coluna.
   - **Barra do selecionado** (o "Aldair preto"): rosto + jogos · gols · ass · gás · valor ·
     salário + o estado dele.
   - O rostinho da lista é a **mesma arte e a mesma trava** do campinho (`avatarLote1`).

### 🧪 A bancada mentia — lição do dia
Mandei pro Diego um print da bancada com **nomes e clubes inventados**: sem rosto (o rosto
é achado pela trinca nome+clube+ano), sem gás, sem overall. Ele: *"essa arte q vc mandou tá
bem diferente do meu anexo q vc tinha feito antes tb"*. **Estava mesmo — e a culpada era a
bancada, não a tela.** `scripts/teste-elenco/main.tsx` agora monta o elenco com trincas
REAIS de `legend-avatars.json`, liga a condição e liga o Olheiro; e `scripts/print-elenco.mjs`
tira as fotos sempre nos mesmos tamanhos.
📌 **Régua nova: print de bancada só vale com dado REAL do jogo.** Bancada com dado
inventado não prova tela — cria discussão à toa.

### ↩️ Como voltar atrás
- Só o visual/banco: `ELENCO27_GERAL` já está `false` e a lista de testers é uma linha.
  Tirando o e-mail dele de `ELENCO27_TESTERS`, o jogo inteiro volta ao de hoje sem deploy
  de código novo... (precisa de deploy, sim — mas é UMA linha).
- Tudo: `git revert` do commit. As duas listinhas antigas e o `rowOf` continuam no
  arquivo, inteiros, justamente porque a trava está fechada.

### ⏭️ O que falta (combinado, ainda não feito)
- [ ] **Mockup de novidade** ("antes 11 reservas, agora 16 — um por posição"), **sem falar
      da mudança visual** (ordem dele). Só faz sentido mandar quando a trava abrir.
- [ ] **Linha em `novidades.ts`** — NÃO entrou de propósito: anunciar pra todo mundo algo
      que só a conta dele vê seria mentira. Entra junto com `ELENCO27_GERAL = true`.
- [ ] **Aba 🏢 SAF na tabela** (o mockup tinha): hoje o emprestado aparece na lista com o
      selo de empréstimo, como já era. Só vale separar se ele pedir.
- [ ] Ideias da SAF 1/3/4 (forma do jogador, luva, jornal) — decisão dele.

## 16/09/2026 (parte 15) — 🕵️ O overall na tabela (com a trava do olheiro) + as 2 abas que EU INVENTEI

Diego: *"lembrando q temos q por o overall tb e tb temos regras né pra aparecer o overall
de acordo c o usuário pagante q pode ver como já funciona hoje. Além disso n entendi q
aba é aquela escrito números, conquistas…"*.
Material: `node scripts/mockup-elenco-overall.mjs`. **Desenho, nada codado.**

### 1) O overall entra — e a regra foi COPIADA do código, não inventada
`ElencoField` (pyramidseason.tsx):
```
if (olheiroTier !== 'ouro' && !(olheiroTier === 'prata' && c.fame < 5)) return null
```
- 👑 **ouro (Lenda) e batismo** → vê TUDO
- ⭐ **prata (Craque)** → vê de craque pra baixo; **a LENDA fica escondida** (`fame < 5`)
- **sem olheiro** → não vê, e aparece a **porta** (o mesmo texto que já existe no jogo)

⚠️ **Dois detalhes que eu quase errei:**
- **Não é um número só, é a FAIXA `lo–hi`** (ex. 90–96), no degradê do tier da carta.
- **Lei do Diego escrita no código:** *"nunca a palavra da categoria escrita — só a cor"*.

O material mostra as **três visões lado a lado** (ouro / prata / sem olheiro) com o mesmo
elenco. A do prata é a mais interessante: Rogério Ceni, Cafu, Zico e Romário (lendas)
ficam **só com o 👑** — o buraco cai **exatamente nos melhores jogadores dele**. A coluna
vira vitrine sozinha, sem anúncio.

👉 **A tabela não muda de forma nas três visões** — muda só o que a coluna mostra. Ninguém
fica com buraco de layout.

### 2) 🙋 As abas NÚMEROS e CONQUISTAS: eu inventei, e ele pegou
Ele estava certo em não entender: **elas não existem no jogo**. Eu copiei da referência
dele ("ESTATÍSTICAS" e "CONQUISTAS") **sem conferir se tinham correspondente aqui**.
E pior: o que elas mostrariam **já existe** —
**NÚMEROS** = artilharia e garçons, que estão na aba **📊 Tabelas**;
**CONQUISTAS** = títulos, que estão na aba **🏆 Rank**.
**Tiradas.** Ficam só as três reais: **ELENCO · TÁTICA · COMISSÃO**.

📌 **Lição:** criar aba que duplica navegação é exatamente o defeito que eu apontei no
levantamento de telas — e eu fui e fiz igual, por copiar a referência sem checar.
**Antes de trazer um elemento de outro jogo, perguntar: isso já existe aqui? onde?**

### Estado
Nada codado. Ofereci montar de verdade com o elenco real dele, **testando as três visões
do olheiro na bancada** (ouro, prata, sem) antes de qualquer commit.

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

