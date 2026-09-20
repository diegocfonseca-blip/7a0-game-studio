## 20/09/2026 (parte 51) — 🐆👑 BATISMO: PANTERA NEGRA FC (Série C)

Dono: **ericrabelo29@gmail.com** (Eric). Assento da **Série C** que era do
🤖 Miúdo EC. Arte inteira mandada pelo dono (escudo, mascote e camisa).

### 🎨 A arte
- escudo `292×360` · **27,7 KB** (teto 30)
- mascote `400×440` · **40,6 KB** (teto 45) · **total 68,4 KB** (teto 75)
- camisa `626×760` · 67,4 KB — em `scripts/kits/` (post) e `public/mantos-salao/`
  (Loja), com `-v1` no nome de propósito (endereço fixo = cache de navegador).
- recorte: `scripts/recorta-prancha-pantera.py` (chroma verde, corte por LIGAÇÃO
  com a borda, despill só na franja, poeira de alfa apagada, bbox medido com
  alfa ≥ 40 e ≥ 3 pixels).

### ⚠️ O ERRO QUE ELE PEGOU, e a lição
Na 1ª versão eu tirei o **balão de fala** e a **plaquinha de madeira** do mascote,
achando que eram peça de POST. Ele corrigiu: *"faltou a plaquinha com frase
embaixo do mascote ao lado da bola e também em cima o balão com frase"*. O
mascote dele é a **CENA inteira** — balão em cima, jogador com a bola-galáxia no
pé, plaquinha embaixo.
👉 **Regra pra qualquer arte que venha do dono: o que entra e o que sai é decisão
DELE.** Na dúvida, perguntar — não podar por conta própria. (Irmã da regra de
18/08: "quando você não souber como a pessoa é, me fala".)

### 🎽 O manto: preto e dourado, MEDIDOS
Medição nas três peças, e elas concordam: dourado `#CB9D3E` na camisa (11,3%
dela), `#DEA152` no escudo, `#D38952` no mascote; escuro `#0E0C0C` na camisa
(82,8%). O preto foi **levantado pra `#191615`** pelo mesmo motivo já escrito na
linha do Futpoint: preto de arte escura, na listra fininha do jogo, lê como
buraco. O tom quente é o medido; só a luz subiu.

### ✅ As TRÊS pernas da entrega (código + banco + main)
**Código:** `escudos.tsx` (4 formas do nome + o nome velho) · `mascotes.tsx`
(`pantera_negra` + `MASCOTE_NOME` + `CARIMBO_GOL`) · `data.ts` (`OLD_NAME` +
o assento da Série C) · `apoio.tsx` (ouro + `FUNDADOR_N` 74) · `manto.ts` ·
`batismos.ts` (com o MESMO par de cores) · `salao-camisas.ts` + o arquivo
público · a lista do `checa-batismos.mjs`.

**Banco (rodado e CONFERIDO no mesmo dia):**
- ⛔ a trava de segurança de 07/09 passou primeiro: **a conta existe**
  (`auth.users`), então o batismo não ficou à espera de quem criasse a conta
  com esse e-mail;
- `user_colors` → ouro, manual ✅ · `esc_fundadores` → **74** ✅ ·
  `esc_socios` → sócio **55**, manto `#191615`/`#CB9D3E`, `mascote_key`,
  `escudo_time`, válido até 2099-12-31 ✅ · `esc_nomes_batismo` → o nome PURO,
  e o gatilho criou FC e EC sozinho (**3 formas travadas**) ✅.

### 👟❌ A NIKE SAIU (ordem dele, no mesmo dia)
*"Tire a Nike do peito do manto também."* A prancha vinha com o símbolo em TRÊS
lugares: o peito da camisa e as DUAS chuteiras do mascote. Marca registrada de
outra empresa não entra no jogo — é a mesma decisão das chuteiras do Pontinho
(Futpoint, 19/09) e do letreiro da bola de ouro. Script:
`scripts/tira-marcas-pantera.py`.

⚠️ **A receita do Futpoint NÃO serviu nas chuteiras.** Lá (e no pelo da pantera
aqui) funciona ajustar uma superfície quadrática no RETÂNGULO e repintar com
grão. No couro da chuteira isso deixou um **remendo quadrado de borda dura, com
granulado cinza** — porque o brilho do couro muda rápido demais dentro da janela
pra uma superfície suave acompanhar. A saída foi mais humilde e melhor:
**mexer só nos pixels da marca** — marca o dourado, engorda 2 px e deixa o
`inpaint` do OpenCV costurar pelo que está em volta. O couro, o brilho e o grão
do lado nem são tocados.
👉 Pra próxima marca a apagar: **comece pelo inpaint do risco**; a superfície
quadrática é pra fundo LISO, não pra material brilhante.

🟩 De quebra saíram **36 px de chroma** presos entre a chuteira e a bola-galáxia
(escaparam do recorte por serem menores que o corte de buracos presos, > 700 px).
Viraram vão, não pintura. A grama do pé da plaquinha também é verde e **não foi
tocada** — o alvo foi só a janela da chuteira.

### 📮 O post
`node scripts/mockup-batismo.mjs` com `--camisa` (a que ele mandou). **Sem
`--antigo`**, pela regra de 05/09: o post diz só "chega na Série C", nunca de
quem era o assento.

### ⏳ Falta
❤️ **O time de coração dele.** O post leva `--coracao` sempre que a gente sabe —
aqui ninguém disse. Quando o Diego souber, é só regerar o post e preencher
`time_coracao` em `esc_socios`.

🛡️ `npm run batismos` (Pantera Negra completo) · `salao` · `piramide`
(C segue com 20) · `mimos` · `telas` · `carta` · e `npm run ascegas` com as
mesmas digitais (`28bea2df` · `d65041f6` · `06bab491`).

---
## 20/09/2026 (parte 50) — 🕵️ O JOGADOR ENIGMA (no branch, esperando OK visual)

Ele perguntou se já estava feito. **Não estava** — dos dois modos que saíram
daquela conversa de ideias, só a 🐊 Tocaia foi construída; este ficou parado no
"mockup" desde então.

### 🎯 A regra, com as palavras dele
- *"Ele só tira o lugar de outro jogador, igual já existe com o jogador surpresa.
  É um jogador que já iria pro leilão, e aí a gente faz essa opção nele, dele
  ficar escondido com a dica. **Mas não vai ter que botar um jogador a mais**."*
- *"Ele pode aparecer uma vez só no leilão… pode ser algum leilão no gol, no
  ataque ou outro, mas só uma vez."*
- *"É só revelar igual é com o surpresa."*
- *"Tem que entrar na posição que é a do leilão no momento que ele entra. Então a
  dica já é a posição do momento que tão todos listados, mais a dica que o jogo
  vai dar."*

### 🆚 A diferença pro 🎁 Surpresa, que já existia
O Surpresa esconde **só o nome** — clube e ano continuam à mostra, e com esses
dois muita gente adivinha quem é. O Enigma esconde **nome, clube E ano**. Sobra
a POSIÇÃO (que já é dica) + **uma dica**: a ÉPOCA (`🕰️ dos anos 2010`). Escolhi
a época porque dá pra apostar ("craque velho ou moleque novo?") sem entregar
ninguém — mas é justamente o que ele tem que aprovar.

### ⚙️ Onde mora
`mudoId` no estado (irmão do `surpriseId`) · `pickMudo` + `sorteiaEspeciais` +
`dicaDoEnigma` no `store.tsx` · a prop `mudo` do `CardFace` no `screens.tsx`.
Nome numa fonte ÚNICA e com identificador NEUTRO (`ENIGMA_NOME`/`ENIGMA_EMOJI`)
— lição da Tocaia, que mudou de nome cinco vezes num dia.

### 🎲 Ele NÃO puxa número da fila do acaso — e isso foi de propósito
Todo sorteio do leilão sai da mesma fila de números aleatórios. Se o Enigma
puxasse UM número a mais, todos os lances dos bots andariam pra frente e o
pregão às cegas fecharia diferente — exatamente o que o `npm run ascegas`
existe pra impedir. Então o Enigma é escolhido por uma CONTA em cima da semente
da sala (a mesma sala sorteia o mesmo Enigma), sem encostar na fila.
✅ As três digitais seguem `28bea2df` · `d65041f6` · `06bab491`.

### 🔒 `npm run enigma-trava` (e como ela quase nasceu inútil)
Confere: não é carta a mais · não consome acaso · nunca cai na mesma carta do
Surpresa · a dica é verdade e não entrega nome/clube/ano · e o principal:
**nome, clube e ano NÃO estão no HTML antes do martelo** (o Surpresa já teve
esse bug — ia pro HTML e só era borrado por CSS, dava pra ler no "inspecionar").

⚠️ **Duas vezes a trava mentiu pra mim antes de prestar:**
1. ela rodava com o remendo que fixa o Enigma na 1ª carta (pro mockup) e acusava
   "o sorteio está viciado" — estava mesmo, **por culpa do remendo**. Sumiu o
   remendo: agora o modo liga por um interruptor de bancada (`bancadaEnigma`) na
   página que já está aberta, sem editar arquivo nenhum. De quebra, acabou o
   risco de o processo morrer no meio e a bandeira ir ligada pro commit.
2. o recorte que tirava a dica apagava "tudo do 🕰️ pra frente" — então um
   clube+ano colados DEPOIS da dica sumiam junto e **a trava passava num
   vazamento de verdade** (testei: passou). Agora ela remove só os textos que a
   função de dica sabe gerar, e o que sobrar tem que ser posição + 🕵️ + "?".
   Testada nos dois sentidos: com o vazamento plantado, ela pega
   (`"GOL🕵️ ? ? ? ? Sport · 2008"`).

### ⏳ O que falta
1. **OK visual do Diego** — nasce DESLIGADO (`ENIGMA_LIGADO = false`) e nada vai
   pra `main` antes disso.
2. Ele decidir a **DICA** (fiquei na época; dá pra ser "🌍 jogou na Europa",
   "🏆 jogou Copa do Mundo"…) e o **NOME** do bicho (fiquei em "Enigma").
3. Linha em `novidades.ts` — só na entrega que ligar isso pro pessoal.

### ↩️ Dá pra voltar atrás?
Dá, e nem precisa reverter: com `ENIGMA_LIGADO = false` o `mudoId` fica vazio e
todas as telas caem no caminho de sempre. Pra sumir de vez, reverter o commit.

---
## 20/09/2026 (parte 49) — 🐊 O SELO DO PREGÃO NA LISTA (e por que ele não acendia)

*"Ainda não tá aparecendo o selo do modo Tocaia… pode ser um jacaré talvez. E o
padrão às cegas coloque outro emoji."*

### 🔍 A causa: não era o selo, era o DADO
O selo lia `game_state.holandes` — mas a **lista de salas abertas não baixa o
`game_state`** desde 09/09. Naquela noite ela extraía 15 campos com `->>` e o
Postgres descomprimia o JSON (50–200 KB) **uma vez por campo**: 3,5 s por
consulta, 400 consultas/min, o banco parou (timeout em login, sala e save).
Desde então os campos moram em colunas magras `ls_*`, preenchidas por gatilho.

`holandes` nasceu depois e **nunca ganhou coluna**. Então na lista ele chegava
sempre `undefined` e o selo nunca tinha como acender. O código do selo estava
certo desde ontem; faltava o dado chegar até ele.

👉 **Lição pra quem for pôr qualquer coisa nova na lista de salas abertas:** não
basta gravar no `game_state`. **Tem que ter coluna `ls_*`** — a lista não lê o
JSON e nunca mais vai ler.

### ✅ O que foi feito
- **`docs/sql/lista-salas-modo-pregao.sql`** — cria `ls_holandes` e um gatilho
  **próprio e separado**, que NÃO encosta no `game_rooms_colunas_magras` que já
  está no ar (a lição do `online-copa-clock-preview.sql`). Coluna nula =
  instantâneo, sem travar a tabela; não precisa preencher as salas de pé, porque
  toda sala viva é regravada em segundos.
- **Os DOIS modos têm selo agora**: 🐊 TOCAIA (vermelho) e ✉️ ÀS CEGAS (branco).
  Só carimbar a Tocaia não diferenciava nada pra quem olha a lista.
- **Três estados, não dois**: `true` = Tocaia · `false` = envelope cego ·
  `undefined` = a lista não conseguiu ler. **Sem leitura, nenhum selo** — senão
  um banco ainda sem a coluna faria toda sala, inclusive as de Tocaia, se
  anunciar como "às cegas", que é mentir pra quem vai entrar.
- 🛟 **Rede na consulta**: se a coluna não existir, o Postgres devolve erro e a
  lista voltaria **VAZIA** — ninguém entraria em sala nenhuma. O primeiro erro
  faz a consulta cair pro formato antigo pelo resto da sessão. Por isso o código
  pode subir antes do SQL, em qualquer ordem, sem risco.
- 🏟️ **E dentro da sala de espera também**, logo abaixo do código da sala — e
  essa parte **não depende de banco nenhum** (lá o `game_state` inteiro está na
  mão). Quem entrou pelo código precisa saber em que jogo se meteu.

### ✅ BANCO RODADO em 20/09 — a entrega está COMPLETA (código + banco + main)
`docs/sql/lista-salas-modo-pregao.sql` aplicado no Supabase. Conferência na hora:
**44 salas** nas últimas 6h — **4 de 🐊 Tocaia** (todas em jogo) e 40 de envelope
cego, 3 delas com a coluna nula (o normal: sala às cegas não grava a chave).
Permissões conferidas (`anon`/`authenticated` leem a coluna nova) e
`notify pgrst, 'reload schema'` disparado — sem isso o PostgREST poderia demorar
a enxergar a coluna, a consulta daria erro e a lista cairia na rede do formato
antigo (funcionando, mas sem o selo).

⚠️ **Armadilha pra quem for conferir isso à mão:** NÃO peça `ls_deck` num
`select` de várias salas. Em sala velha "estragada" essa coluna guarda o baralho
INTEIRO — um `select` de 20 linhas voltou com 209 mil caracteres.

O arquivo foi escrito **em cima do `pg_get_functiondef` LIDO DO BANCO** (não de
memória): é o mesmo gatilho `game_rooms_colunas_magras`, com UMA linha a mais e
nada mais tocado. Dois achados da leitura que mudaram o plano:
- o gatilho é `BEFORE INSERT OR UPDATE **OF game_state**` — e a sala parada na
  espera só grava `updated_at` (batimento do host de 30s). Sem o passo 3
  (o `update` de preenchimento) as salas que já estão de pé ficariam sem selo
  até o pregão começar. O plano original dizia que elas se preencheriam
  sozinhas; **estava errado**, e só a leitura do banco mostrou isso;
- as outras 15 colunas guardam o `->>` cru, então sala às cegas fica com
  `ls_holandes` **NULL** (ela não grava a chave). O código já trata: NULL = às
  cegas, campo AUSENTE (consulta velha) = não sei, não carimbo nada.

🛡️ `npm run holandes` (com 6 travas novas, inclusive a que reprova quem voltar a
procurar o modo no `game_state`) · `npm run ascegas` com as mesmas digitais
(`28bea2df` · `d65041f6` · `06bab491`) · `npm run sala` e `npm run relogio` verdes.

---
## 20/09/2026 (parte 48) — 🎬 REELS DA TOCAIA (`npm run tocaia`)

*"Preciso de um vídeo top agora, padrão de vídeos que fazemos, falando dessa
baita novidade!! E mostrando o tempo rolando e etc."*

`scripts/video-tocaia-reels.mjs` · 1080×1920 · ~36s · mesmo padrão dos outros
reels (creme, bordas grossas, sombra dura, Oswald, cenas por `animation-delay`).

### 🎞️ As 7 cenas
1. 🐊 **CHEGOU A TOCAIA** — a novidade antes de qualquer regra (regra do reels do
   Bola de Ouro: *"primeiro você tem que começar o vídeo falando da novidade"*);
2. às cegas × Tocaia — envelope lacrado × preço à vista de todo mundo;
3. ⭐ **O PREÇO ROLANDO** — a parte que ele pediu: a leva inteira listada com o
   botão PEGAR, o número gigante caindo `100·90·80·70·60·55·50·46·42·38·34·30·27·24·21·18`
   e uma barrinha vermelha esvaziando. No 18 o 🫵 desce e a carta vira dourada
   com **PEGUEI! · 18 🪙**;
4. quem aperta **primeiro** leva — é por TEMPO, não por valor (PEGUEI! × 😤 QUASE!);
5. o jogador **cai no campinho na hora**;
6. ninguém quis? preço até zero → Monte de sobras, e **o às cegas não mudou nada**;
7. onde jogar (rápida · sala online · Minhas Ligas) + marca.

### ✅ Os números do vídeo são os DO JOGO
A escada saiu pra `scripts/escada-tocaia.mjs` (espelho em JS puro do `holEscada`
do `store.tsx` — `.mjs` não importa `.tsx`), e o **`npm run holandes` agora
compara as duas**: mexeu na escada do jogo e esqueceu o espelho, a trava reprova.
Motivo: vídeo é o que vai pro Instagram — anunciar preço que o jogo não tem é
propaganda enganosa.

⏱️ **A descida do vídeo corre em DOBRO** (100→18 leva 17,1s de verdade, no vídeo
leva 8,5s). A ordem e os números são os reais e **a própria tela avisa**:
*"no jogo a descida inteira leva ~49s · aqui está acelerada"*. Reel não aguenta
17s de contagem, mas ninguém pode chegar no jogo e se sentir enganado.

### 🚫 O que ficou DE FORA de propósito
O conserto do relógio (parte 47) **não entra no vídeo nem nas novidades**: é
bug, e a regra dele é *"menos bugs, que nunca lance"*.

---
## 20/09/2026 (parte 47) — ⏱️ UM RELÓGIO SÓ PRA SALA (o "154s" do print dele)

Ele mandou cinco prints da Copa do Mundo online e o recado:
*"os tempos de escolhas estão MT longos… tem que ser igual ao modo às cegas. E o
monte de sobras também, que era 15s e tava bem mais também."*

### 🔍 O que estava acontecendo (não era a Copa, nem o Monte)
Nos prints: **154s** onde são 75s (escolher a seleção), **84s** onde são 15s (o
banner) e **129s** onde são 90s (a convocação). Os três batem com a MESMA conta:
o número certo **+ 79 segundos**.

O relógio do celular dele estava **~79 segundos atrasado**. Todo prazo do online
nasce no aparelho do **DONO** da sala (`Date.now() + 15s`) e viaja como um
INSTANTE; quem recebia fazia a conta com a hora do **próprio** celular. Celular
atrasado = todo prazo parece maior do que é.

A prova de que era relógio, e não a Copa: o **Monte de sobras** deu o mesmo erro,
e ele vem por um caminho de código **completamente diferente** (broadcast do
estado, não a tabela `esc_copa_salas`). Dois lugares sem nenhuma ligação, o mesmo
desvio — é a assinatura de relógio torto.

E o pior não era o número feio: a fase acabava **na hora certa** (quem manda é o
relógio do dono), então quem tinha o celular atrasado levava um susto — *"mas
ainda tinha um minuto!"*.

### ✅ O conserto — `src/escalacao/relogio.ts`
O dono carimba a hora dele nas **duas mensagens que já manda** (o estado e o "tô
vivo" de 4 em 4 segundos — uns 20 bytes, zero mensagem nova, zero banco). Cada
convidado aprende o **desvio** entre os dois relógios, e daí pra frente toda
contagem do online é lida com `agoraSala()` — a hora do DONO.

Vale pra **tudo** de uma vez: envelope do leilão às cegas (45s), desempate,
🐊 Tocaia, Monte de sobras (15s), cerimônia e os três relógios da Copa do Mundo
(75s · 15s · 90s).

🛡️ Por que não quebra nada:
- pro **DONO** o desvio é SEMPRE zero (ele não recebe carimbo de ninguém, e
  `souODono()` zera na hora que alguém assume) → o jogo dele fica idêntico;
- **offline** nunca recebe carimbo → desvio zero, idêntico;
- host numa versão velha (janela de deploy) não manda carimbo → o convidado fica
  exatamente como era hoje, sem erro novo;
- **zona morta de 1,5s**: a variação da rede não faz a contagem pular na tela;
- carimbo inválido ou absurdo (> 12h) não encosta no relógio;
- só **PRAZO** usa essa hora. Salvar, assinar, ordenar e registrar continuam no
  relógio do próprio aparelho.

### ⚙️ E o botão que ele pediu junto
*"no final também tem que ter o botão de gerenciar técnicos perto de sair, igual
também tem no outro modo."* Durante a partida o ⚙️ mora no rodapé do `Shell` — só
que a tela de FIM do online abre com `hideExit`, e o rodapé inteiro some. Agora
ele aparece na linha das saídas do quadro roxo "🗳️ E agora?", ao lado de
🏠 Voltar pro menu e 🚪 Sair da sala. Mesmas regras de sempre: **só o host**, só os
OUTROS técnicos, humanos e rivais CPU, com os buracos (`−N 🕳️`) à mostra. É
justamente aqui que ele é mais útil: o host está decidindo o "novo leilão" e
precisa tirar da frente quem largou o jogo.

### 🛡️ Trava nova: `npm run relogio`
Confere a conta do desvio, a zona morta, o lixo que não pode entrar, que o DONO
nunca tem desvio, que assumir a coroa zera na hora — e, por texto, que nenhuma
das telas de contagem (leilão, desempate, Monte, cerimônia, Copa) voltou a usar
`Date.now()` cru.

`npm run ascegas` com as mesmas digitais (`28bea2df` · `d65041f6` · `06bab491`) ·
`npm run holandes`, `npm run revanche`, `npm run copa`, `npm run sala` e
`npm run vigias` verdes.

### ↩️ Dá pra voltar atrás?
Dá, e é um commit só. Voltando, tudo fica exatamente como estava hoje (o número
inflado volta pra quem tem o celular fora de hora, e o ⚙️ some do fim).

---
## 20/09/2026 (parte 46) — 🐊 FECHADO: o modo é TOCAIA, com o jacaré

*"Coloque Tocaia mesmo, com emoji de jacaré."* Decisão final dele, depois de o
nome passar por **Holandês → Queda Livre → Holandês → Pescaria → Tocaia** em um
único dia.

### 🐊 Como ficou
- nome: **🐊 Tocaia / Ambush**;
- emoji: **🐊** em todas as telas (montar partida, montar sala, selo da lista de
  salas abertas, topo do pregão, novidade da home);
- grito do arremate: **PEGUEI! / GOT IT!** na tarja da carta que é sua (era
  "FISGOU!" na versão Pescaria, que durou uma mensagem);
- a faixa do último martelo segue com **🔨** — é o martelo do leilão, símbolo do
  jogo, e não é do modo.

### 🧠 Por que Tocaia é o nome certo (e fica registrado)
É o único dos cinco que carrega o **RIVAL**. A emoção do modo não é o preço
caindo — é o amigo te passando na frente. Tocaia tem alvo e tem disputa; pescaria
é você contra o peixe, e o peixe não está competindo com você. O jacaré fecha a
imagem: fica parado, de olho, e dá o bote na hora certa.

⚠️ **Não repropor outro nome sem ele pedir.** Os descartados, pro caso de ele
voltar ao assunto: Queda Livre (Free Fall) · Pescaria (Fishing) · Bote (virava
"bot") · Às Claras · Chapéu · Caçada · Sniper · Anzol.

### 💡 O que essa novela ensinou, e que vale pra qualquer coisa "de gosto"
O nome mudou **cinco vezes**. Custou barato porque, na terceira troca, eu parei de
espalhar a palavra pelas telas e criei uma **fonte única com identificador
NEUTRO**: `MODO_NOME` / `MODO_EMOJI` / `MODO_FISGOU`. Da quarta em diante, trocar
o nome do modo virou **trocar uma string** — não renomear código em sete lugares.
👉 Quando um assunto for de GOSTO do Diego, assuma que vai mudar e **prepare o
código pra mudar barato desde a primeira vez**.

E a chave do estado nunca se mexeu: continua `holandes` no save, no reducer e no
`game_state` da sala. Sala criada com o nome antigo abre normalmente.

🛡️ `npm run holandes` verde · `npm run ascegas` com as mesmas digitais
(`28bea2df` · `d65041f6` · `06bab491`).

---

## 20/09/2026 (parte 45) — 🎣 O modo virou PESCARIA (votação do pessoal dele) — PRONTO, NÃO PUBLICADO

Depois de rodar vários nomes com ele, o pessoal votou: *"pescaria, pessoal tá
votando aqui"*. Feito — e com o **FISGOU!** junto, que era a condição pra Pescaria
funcionar (ver abaixo).

### 🎣 O que mudou na tela
- nome: **🎣 Pescaria / Fishing** (era Holandês / Dutch);
- emoji do modo: 🔻 → **🎣** em todo lugar (telas de montar, selo da lista de salas,
  topo do pregão, novidade da home);
- **o grito do arremate**: quando a carta é SUA, a tarja não diz "Arrematado", diz
  **FISGOU!** (**HOOKED!** em EN). É o que resolve o único problema do nome.

### 🔑 Duas decisões de engenharia que vão importar na PRÓXIMA troca de nome
1. **O identificador virou NEUTRO**: `MODO_HOLANDES` → **`MODO_NOME`** (e
   `MODO_EMOJI`, `MODO_FISGOU`, `MODO_NOME_NASCEU`). Este nome mudou **duas vezes
   em um dia**; deixar "PESCARIA" no identificador obrigaria a renomear código
   toda vez. Agora trocar o nome do modo é trocar **uma string**.
2. **A chave do estado continua `holandes`** — no save, no reducer e no
   `game_state` da sala. Nome que o código compara ou guarda NUNCA se rebatiza:
   sala criada ontem continua abrindo hoje.

### 🗣️ O que eu respondi quando ele perguntou se eu achava mesmo Pescaria melhor
Ele cobrou franqueza (*"fala verdade"*). Minha resposta, registrada porque é uma
opinião de design que pode voltar à mesa: **na minha opinião Tocaia é o melhor nome
pro modo**, porque *na pescaria não existe rival* — a emoção do modo não é o preço,
é o amigo te passando na frente, e tocaia tem alvo e disputa. **Mas o voto do
pessoal ganha da minha opinião**: nome de modo existe pra ser FALADO, e quem vai
falar é a turma dele, não eu.

### ⏸️ ESTÁ NO BRANCH, NÃO NA MAIN
Parei antes de publicar porque ele pediu a minha opinião no meio da troca — é
decisão dele, não minha. A `main` segue com **Holandês** até ele bater o martelo.
Pra publicar: `git checkout main && git merge claude/denis-save-file-x1osct`.
Pra voltar pra Tocaia (ou qualquer outro): uma string em `MODO_NOME`.

🛡️ Conferido no branch: `npm run holandes` verde · `npm run ascegas` com as mesmas
digitais (`28bea2df` · `d65041f6` · `06bab491`).

---

## 20/09/2026 (parte 44) — 🏷️ Tarja "NOVO" no Holandês (nas duas telas de montar)

Pedido dele, com o print da tela de criar sala: *"aonde tá holandês coloque uma obs
de novo"* — igual à que o **🌐 Liga + Mundo** já tem ali do lado.

### O que foi feito
O componente `Seg` do `lobby.tsx` **já sabia** desenhar essa tarja (`selos`), então
não teve desenho novo — só faltava usar. Mas ela estava presa numa data FIXA
(`NOVO_ATE = 16/10`), que era a validade da Copa do Mundo online (nascida em 01/09).
Se eu reaproveitasse, a tarja do holandês morreria 26 dias antes da hora.

Virou genérica: **`seloNovoDe(nascimento)`** — a tarja some sozinha **45 dias**
depois de o modo nascer, e a data da Copa do Mundo continua a dela.

### 📍 E está nas DUAS telas de montar
- **Sala online** (`lobby.tsx`), via o `Seg`;
- **Partida Rápida** (`screens.tsx`), onde o seletor é feito à mão — a tarja foi
  desenhada com o MESMO estilo (mesma pílula, mesmo tamanho, mesma inversão de cor
  quando o botão está escolhido).

Se ficasse só numa, as duas telas contariam histórias diferentes sobre o mesmo modo.

### 🗓️ A data mora junto do NOME
`MODO_HOLANDES_NASCEU = '2026-09-20'` ficou em `store.tsx`, ao lado de
`MODO_HOLANDES`. É a mesma informação ("este é o modo novo") — separar os dois seria
pedir pra um envelhecer sem o outro. E, como as novidades da home, **ninguém precisa
lembrar de tirar**: em 04/11 a tarja some sozinha.

🛡️ `npm run ascegas`: `28bea2df` · `d65041f6` · `06bab491` — iguais.
---

## 20/09/2026 (parte 3) — 👟 AS 20 MARCAS DE MATERIAL ESPORTIVO

Ele mandou as 20 paródias e perguntou: *"vai ser com base na divisão ou você acha
melhor variar? A pessoa pode renovar contrato com a atual?"*. Depois montou a escada
inteira, corrigiu dois nomes (**Abibas**, e **Luis Vitão** no lugar de Bibas) e
cortou a ideia de marca com regra própria: *"não quero que diferencie marca por ser
Havaianas e coisas do tipo"*.

### O que entrou
- **20 marcas** em 5 andares, com o `desde` de cada uma (a escada é dele).
- **`fornOfertas(div, seed, season, excluir)`**: 4 papéis, um de cada prazo,
  sorteados no seu andar (70%) ou no de baixo, com dado preso em semente+temporada
  — reabrir o jogo devolve a MESMA vitrine. A marca que já é sua sai dos papéis.
- **Renovação** (`LOJA_FORNECEDOR` com `fidelidade: true`): só com a marca que já era
  dele, valor recalculado na divisão de hoje, `+5` pontos de loja via
  `fornBonusLoja(contrato)` — que virou a fonte única do bônus (vendas, Loja e faixa).
- **Aviso do contrato longo** na tela, pra o custo parar de ser invisível.

### 🔁 E NO MESMO DIA ELE TIROU A RENOVAÇÃO
A faixa "a marca quer ficar" com +5% de loja viveu ~20 minutos na main. Ele leu a
explicação, achou confuso (*"confuso demais, entendi nada"*) e mandou: *"mantenha
nosso padrão mesmo e sem renovar com 5% também, deixa ele escolher normal... mas pelo
menos já deixe todas as marcas novas em cada divisão"*. Então a tela voltou a ser
EXATAMENTE a de sempre (4 papéis e só), ficou o que ele quis: as 20 marcas se
revezando por divisão. Saiu junto o aviso do contrato longo. O campo `fidelidade`
continua no tipo só pra não quebrar save de quem pegou aquela janela.

### O que ele decidiu NÃO mexer
Preço, prazo e formato. Levantei que o contrato de 5 temporadas domina (paga mais por
temporada **e** dá mais loja) e ele respondeu *"mantenha preços iguais já eram e
formatos / prazos"*. **Se um dia quiser resolver**: bônus de loja pelo ANDAR em vez do
prazo, ou inverter a régua (curto paga mais por temporada). As duas estão medidas na
conversa — e a segunda esbarra na trava de que o fornecedor paga menos que o Master.

**Reverter**: `git revert` volta as 4 marcas de antes; contrato correndo não quebra
porque os 4 ids e prazos antigos continuam os mesmos.

**Bancada**: `scripts/teste-rosto/index.html?fornecedor&div=A` (ou `&div=D`).

---

## 20/09/2026 (parte 43) — ⏱️ No holandês o host NÃO escolhe tempo (ele desfez o que eu tinha feito)

Na parte 42 eu tinha "consertado" o `auctionSecs` (o tempo do pregão da sala de
stream) fazendo ele ESTICAR ou ENCOLHER a descida do holandês. Ele leu e mandou
desfazer:

*"No stream não quero que tenha tempo pra escolher não, quando ele selecionar
holandês e stream remova a opção de escolher esse tempo. Só se for no padrão que
ele pode, senão vai dar merda — porque tem que ser com base na regra que fizemos
pro modo rápido."*

### ✅ Ele está certo, e é mais simples
Meu conserto criava **duas regras pro mesmo modo**: o pregão holandês da sala de
stream sairia com um ritmo e o da Partida Rápida com outro. Isso é exatamente a
fábrica de bug que ele odeia — e ainda por cima eu tinha inventado um PISO
(`HOL_PISO_MS`) pra segurar o caso em que o tempo pedido não cabia. Peça a mais pra
manter, problema a mais pra acontecer.

**Agora: o holandês tem UM relógio só, em toda sala.** Quem manda é a escada de
preços, e ela é idêntica na Partida Rápida, no Rápido online, no Minhas Ligas e no
Stream. `HOL_PISO_MS` e o escalonamento saíram do código.

### 🎛️ E o seletor de tempo SOME da tela
Na sala de stream, escolher 🔻 Holandês **tira o seletor de segundos** e põe no
lugar um aviso que explica (regra dele: toda trava diz o porquê):
> 🔻 No pregão Holandês não tem tempo pra escolher: quem manda o relógio é o PREÇO
> caindo, e a descida é a mesma em toda sala — igual à da Partida Rápida. O Modo
> Stream continua valendo (os valores ficam escondidos e você dá o start).

E o tempo não é nem **gravado** no estado da sala quando o pregão é holandês —
senão ficaria um número morto guardado lá, esperando alguém ler por engano.

### 🔒 A trava virou do avesso
`npm run holandes` agora reprova o CONTRÁRIO do que reprovava ontem:
- se o `holPassoMs` voltar a aceitar um tempo de sala (assinatura com 3 parâmetros);
- se a descida da sala ficar diferente da descida da Partida Rápida;
- se o seletor de tempo voltar a aparecer com o holandês ligado;
- se faltar o aviso explicando o porquê;
- se a sala holandesa voltar a gravar um tempo de pregão.

⚠️ **Lição**: quando uma opção da sala não faz sentido num modo, o certo é **tirar a
opção da tela**, não fazer o modo se contorcer pra atender. Eu fui pelo caminho
difícil primeiro.

🛡️ `npm run ascegas`: `28bea2df` · `d65041f6` · `06bab491` — iguais.

---

## 20/09/2026 (parte 42) — 🎥🏆 Holandês no STREAM e no MINHAS LIGAS: funciona, e achei um furo de ritmo

Pedido dele: *"agora veja se vai funcionar normal no modo stream e também em
minhas ligas"*. Fui rodar o pregão INTEIRO em cada uma em vez de supor.

### ✅ As cinco salas rodam até o fim
| sala | resultado |
|---|---|
| 🎥 stream (`auctionSecs = 0`) | 310 degraus · host deu o start · fecha no Monte |
| 🎮 manual | 310 degraus · fecha no Monte |
| ⏱️ tempo do host (20s) | 310 degraus · fecha no Monte |
| 🏆 Minhas Ligas | 310 degraus · fecha no Monte |
| 🏆 liga + stream | 310 degraus · host deu o start · fecha no Monte |

Nenhuma trava, nenhuma caixa negativa. O detalhe que o teste me ensinou: a **sala
de stream não abre no pregão** — ela abre no `streamIntro` e espera o HOST apertar
(`START_STREAM_AUCTION`). O holandês sobrevive a esse degrau a mais, e a trava
agora confere que depois do start a sala abre o pregão **holandês** e não o cego.

⚠️ Na 1ª rodada a trava acusou "stream travou" e "manual travou" — **era o meu
teste**, não o jogo: ele não sabia passar pelo `streamIntro` e não aceitava o Monte
Final como fim válido (o teste principal aceita). Consertado. Fica a lição: teste
novo que acusa bug em código que já roda merece uma segunda olhada NO TESTE antes
de sair mexendo no jogo.

### 🐛 O furo que apareceu: o tempo do host virava enfeite
Na sala de stream o host escolhe o tempo do pregão (`auctionSecs`) porque está
**narrando pra plateia**. O holandês **ignorava** esse número: ele pedia 20s e a
descida insistia nos 49s dela. É a família do "botão mudo" — a tela promete uma
coisa e o motor faz outra.

**Consertado**: a descida inteira passa a CABER no tempo pedido, mantendo a
proporção entre as marchas (corre em cima, respira embaixo).

| host pede | descida de verdade |
|---|---|
| 20s | **27s** ← o piso segurou |
| 30s | 30s |
| 45s | 45s |
| 60s | 60s |
| 90s | 90s |

🕳️ **O piso (`HOL_PISO_MS = 1200`) é deliberado**: por mais apertado que o host
peça, o degrau do fundo nunca fica mais curto que 1,2s — são esses milissegundos
que impedem meio segundo de internet ruim de decidir quem leva a carta. Quando o
tempo pedido não cabe, **o pregão estoura o relógio em vez de roubar carta de quem
está no 4G**. É a troca certa, e está escrita no código.

E `auctionSecs = 0` ("o host avança no botão") **não** virou 32 cliques por leva: o
host já deu o start na tela de abertura, daí pra frente a escada toca sozinha.

### 🔒 Travas novas em `npm run holandes`
Roda o pregão inteiro nas 5 salas · confere que a sala de stream passa pela tela do
host e abre HOLANDESA · que pedir mais tempo estica e pedir menos encurta · que o
piso do fundo segura mesmo num pedido absurdo (5s) · e que `0` não muda o ritmo.

🛡️ `npm run ascegas`: `28bea2df` · `d65041f6` · `06bab491` — iguais.

---

## 20/09/2026 (parte 41) — 🎚️ A escada afina a partir do 50 — e o holandês passou a ser MAIS LENTO que o cego

2º pedido dele sobre o relógio: *"sobre o tempo ainda acho q qd chegar no 50 na
regressiva pode ter mais números próximos… não tem problema demorar um pouco mais o
leilão não"*.

### 🎚️ A escada agora
```
100 · 90 · 80 · 70 · 60          ← pulo de 10 (enfeite puro)
55 · 50                          ← pulo de 5
46 · 42 · 38 · 34 · 30           ← pulo de 4   ← ERA 52 · 44 · 36 (de 8 em 8)
27 · 24 · 21                     ← pulo de 3
18 · 16                          ← pulo de 2
14 · 13 · 12 … 2 · 1 · 0         ← de 1 em 1
```
`v > 60 ? 10 : v > 50 ? 5 : v > 30 ? 4 : v > 20 ? 3 : v > 14 ? 2 : 1`.
De 50 pra baixo eram **3 degraus** (52·44·36), agora são **12** até o 14.

### 🕰️ E a marcha do meio passou a começar no 55 (era 40)
De nada adianta pôr mais número na faixa dos 50 se ele passar voando. Então:
| faixa | por degrau |
|---|---|
| acima de 55 | 0,5s (era 0,6 — acelerou, porque ali NUNCA acontece nada) |
| 23 a 55 | 1,4s |
| 22 pra baixo | 2,0s |

### ⚠️ O NÚMERO QUE ELE PRECISA SABER: o holandês virou o modo MAIS LENTO
| | pregão inteiro (93 cartas) |
|---|---|
| 🔻 holandês | **12:05** |
| ✉️ cego (hoje) | 11:15 |

Ele autorizou (*"não tem problema demorar um pouco mais"*), então **fica** — mas
registrando: até a parte 37 o holandês era a opção mais RÁPIDA (9:36, depois
10:57). Agora é **50s mais lento** que o pregão de hoje. Se um dia isso incomodar,
a alavanca mais barata é **abrir em 50 em vez de 100** (o topo 100→60 nunca vende
nada): corta ~2,5s por leva sem tocar na parte fina que ele pediu. A segunda é
baixar a marcha do fundo de 2,0s pra 1,7s — mas aí encosta no anti-delay, que é o
que protege quem tem internet pior.

Economia segue igual: 52 × 46 arremates · preço médio 12,1 × 13,3.

### 🔒 Travas novas
`npm run holandes` agora também reprova se: de 50 pra baixo aparecer pulo maior que
4 · houver menos de 20 degraus abaixo de 50 · o degrau do 50 durar menos de 1,2s
(passaria voando) · a descida passar de **55s** (teto novo, autorizado por ele — não
subir mais sem pedido).

🛡️ `npm run ascegas`: `28bea2df` · `d65041f6` · `06bab491` — iguais.

---

## 20/09/2026 (parte 40) — ↩️ O nome VOLTOU a ser HOLANDÊS (eu tinha lido errado)

*"Eu falei pra manter holandês mesmo."*

**Erro meu de leitura, e vale anotar como se deu**: ele perguntou *"qual nome eu
poderia dar pra esse modo, sem ser o nome holandês?"*, eu ofereci quatro opções, ele
respondeu **"[sem preferência]"** nas duas perguntas — e logo em seguida mandou
*"tô falando as salas abertas, colocar ali holandês sei lá, pra diferenciar"*.

Eu li aquele "holandês" como EXEMPLO ("põe o nome do modo aí, sei lá"). Era
**decisão**: manter Holandês. As duas leituras cabiam na frase, e eu escolhi a
errada — e, pior, escolhi sozinho num assunto que é 100% gosto dele.

👉 **Lição pra qualquer sessão**: "[sem preferência]" numa pergunta de GOSTO não é
carta branca — é sinal de que a pergunta não era a que ele queria responder. Quando
a resposta seguinte usar uma das palavras da pergunta, ela provavelmente É a
resposta. Na dúvida em assunto de gosto, perguntar de novo com uma frase, não
decidir.

### O que voltou e o que FICOU
- **Voltou**: o nome visível é **🔻 Holandês / 🔻 Dutch** em todas as telas e na
  novidade da home. `MODO_QUEDA` → **`MODO_HOLANDES`**.
- **Ficou** (foi o que ele pediu de verdade nesta rodada): o **selo na lista de
  salas abertas** (`🔻 HOLANDÊS`, vermelho, no nome da sala) e o **nome no topo do
  pregão**. Era isso o *"colocar ali… pra diferenciar"*.
- **Ficou também** a fonte única: o nome mora em UM lugar (`MODO_HOLANDES` em
  `store.tsx`) e toda tela puxa de lá. Foi o que fez este desfazer custar uma
  linha em vez de sete telas — e é o que vai deixar barato se ele um dia trocar.
- 🔒 A trava agora **segura o nome**: `npm run holandes` reprova se alguém
  rebatizar sem ele pedir, e reprova se alguma tela escrever o nome na mão.
- ⛔ **Não repropor outro nome.** Os quatro que ofereci (Queda Livre · Quem Pega,
  Leva · Liquidação · Quem Pisca, Perde) ficam só como registro.

---

## 20/09/2026 (parte 39) — 🏷️ O modo virou 🔻 QUEDA LIVRE, e aparece nas salas abertas

Ele pediu: *"qual nome eu poderia dar pra esse modo do leilão, sem ser o nome
holandês? Outra coisa: o nome do modo tem que aparecer nas salas criadas né, de
alguma forma"* — e depois, com o print da lista: *"tô falando as salas abertas,
colocar ali holandês sei lá, pra diferenciar"*. Ofereci quatro nomes e ele deixou a
escolha comigo.

### 🔻 Ficou **Queda Livre** (Free Fall)
Por quê, entre os quatro:
- **nomeia o que a pessoa VÊ** — o número despencando na tela;
- **cabe no selo** da lista de salas (duas palavras);
- **não mente**: "Liquidação" e "Pechincha" prometeriam que tudo sai barato, e
  nesse modo o craque sai CEDO e CARO (o barato é o que sobra no fim);
- **traduz limpo** (Free Fall), e o jogo é BR/EN.
Os descartados ficam registrados caso ele mude de ideia: Quem Pega, Leva (First to
Grab) · Liquidação (Clearance) · Quem Pisca, Perde (Blink and Lose).

### 🔑 A chave no código CONTINUA `holandes`
De propósito, e é regra da casa: nome que o código compara, guarda no save ou grava
no `game_state` da sala **não é rebatizado** — senão toda sala criada antes desta
linha deixaria de abrir. O que mudou é só o que a pessoa LÊ.

### 📍 Onde o nome aparece agora
1. **Lista de salas abertas** — selo VERMELHO no nome da sala, do lado do `BR`
   (`🔻 QUEDA LIVRE`). Foi pra lá e não pra linha de baixo porque essa é a
   diferença mais grossa entre duas salas: quem entra sem saber cai num jogo com
   outra regra de lance. Tem `title` explicando, pra quem passa o dedo.
2. **Topo do pregão** — `🔻 QUEDA LIVRE` em vermelho miúdo, acima de `GOLEIROS`.
   Quem entrou numa sala que outra pessoa criou descobre ali.
3. **As duas telas de montar** (partida rápida e sala online) — o botão de escolha.
4. **A novidade da home** (PT + EN) — reescrita com o nome novo.

### 🔒 Trava: o nome mora num lugar SÓ
`MODO_QUEDA` em `store.tsx` é a fonte única; toda tela puxa de lá. O
`npm run holandes` agora reprova se: a lista de salas não souber ler a bandeira ·
o selo não for desenhado · alguma tela escrever o nome na mão em vez de puxar da
fonte · ou se sobrar "🔻 Holandês" escrito em qualquer tela.

📷 **O que não deu pra fotografar**: a lista de salas exige login, e eu não entro na
conta dele. Por isso o selo é conferido na FONTE (existe, lê a bandeira certa, usa o
nome da fonte única) em vez de por print.

---

## 20/09/2026 (parte 38) — 🐛 Dois bugs que ele pegou JOGANDO com o pessoal (os dois do mesmo print)

Ele terminou uma sala com os amigos e mandou duas fotos.

### 🐛 1 — o "novo leilão" voltava pro ENVELOPE CEGO
Palavras dele: *"tava no modo holandês e todo mundo votou pra uma nova. Porém foi
criado no modo às cegas. Sendo que estávamos jogando modo holandês… então tem que
seguir com a mesma regra e modos e tudo que foi feito a sala"*.

**Causa, e ela é estrutural**: o `START_ONLINE` **zera tudo que não vier na ação**.
Então cada escolha da sala tem que ser REENVIADA na revanche, uma a uma, na mão. Eu
liguei o holandês e não reenviei. **É a MESMA falha de 08/08** (naquele dia o que
sumiu foi o modo stream) — ou seja, a 2ª vez que a revanche come uma regra da sala.

**Consertado**: a revanche reenvia `holandes` — e também **`sport`**, que estava
faltando do mesmo jeito e é pior: uma sala de **BidLegends virava futebol** no novo
leilão. Ninguém tinha reclamado só porque o basquete abre pra uma conta só.

### 🐛 2 — o campinho do LEILÃO mostrava ⚽ e 🅰️ antes de a bola rolar
Na 2ª foto, o Bernabei aparece na escalação com gol e assistência **durante a
revelação do pregão**, sem nenhuma partida jogada.

**Causa**: o campinho acha o número pelo **NOME + time** (`golsDe`/`assistDe` em
`screens.tsx`), e os **sete** caminhos de "começar leilão novo" zeravam `news`,
`champion` e `round` — mas **não** `scorers`, `assists` e `lastResults`. Quem
reaparecia na mesma cadeira herdava o número do ano anterior.

**Consertado em CINCO dos sete**, e a escolha foi deliberada:
- ✅ zeram: `START` (rápido) · `START_NBA` · `START_NBA_CAREER` ·
  `START_CAREER_SOLO` · `START_ONLINE`;
- ⛔ **NÃO zeram**: `REAUCTION_ONLINE` e `RESERVE_AUCTION_ONLINE` — esses dois são
  de MEIO de carreira (o `round` nem volta a 0). Zerar ali apagaria a artilharia da
  temporada **em andamento**, que seria um bug pior que o consertado.
- **A régua**: zera junto com o `round = 0` e o `champion = null`. Se a temporada
  virou, a artilharia vira junto.
- ⚠️ `rivalries` fica FORA: o retrospecto entre amigos atravessa temporada (é o
  "Rivalidade V=2 D=1" da tela de próximo jogo).
- 🅰️ E, como manda a regra permanente, **gol e assistência zeram na MESMA linha** —
  pra ninguém esquecer metade.

### 🔒 Trava nova: `npm run revanche`
Ela confere as duas coisas, e a 1ª é a que importa pro futuro:
1. **as 15 escolhas da sala** têm que estar na chamada do "novo leilão" (baralho,
   várzea, copa, **holandês**, **esporte**, stream, manual, chat, tempo, liga sem
   bots, Minhas Ligas, senha, hash, temporada, duplas). Esquecer uma é bug MUDO —
   a sala volta pro padrão e ninguém entende;
2. artilharia/assistência/resultados zeram nos três caminhos principais, e o
   retrospecto entre amigos **não** zera.

⚠️ Detalhe pra quem for mexer nela: o Vite serve o `.tsx` **já transpilado**, então
cortar o bloco por indentação ou por número de caracteres não funciona (tentei, e a
trava acusou falta de campo que estava lá). A janela é achada **contando chaves** a
partir do `type: 'START_ONLINE'`.

### 🛡️ `npm run ascegas` depois de tudo
`28bea2df` · `d65041f6` · `06bab491` — iguais. O leilão cego segue intocado mesmo
com o `START` dele tendo ganhado a linha de zerar artilharia.

---

## 20/09/2026 (parte 37) — 🎚️ A escada afina perto do 30 (pedido dele, com o jogo já no ar)

Ele jogou e aprovou (*"tô adorando"*), com um pedido: *"só acho q tem q qd começa a
chegar próximo do 30 começar a cair os números cada vez mais próximo de um por um
sabe"*. E logo depois: *"sim, pode aumentar um pouco mais, não tem problema… só um
pouco mais também"* — ou seja, autorizou a descida ficar mais longa.

### 🎚️ A escada agora
```
100 · 90 · 80 · 70 · 60 · 52 · 44   ← pulos de 10 e 8 (enfeite: ninguém paga isso)
36 · 31                             ← pulos de 5
26 · 23                             ← pulos de 3
20 · 18 · 16                        ← pulos de 2
14 · 13 · 12 · 11 · 10 · 9 … 1 · 0  ← de 1 em 1
```
A conta é `v > 60 ? 10 : v > 40 ? 8 : v > 30 ? 5 : v > 20 ? 3 : v > 14 ? 2 : 1`.
Bate com o que ele quis: **de 30 pra baixo o pulo vai encolhendo até virar 1**. E
faz sentido no jogo — o preço médio de arremate medido é ~12 🪙, então é ali que a
carta troca de mão de verdade.

### ⏱️ E o relógio virou TRÊS marchas (senão o modo perdia a vantagem)
Só afinar a escada engordava a descida em ~11s e o holandês passaria a ser mais
LENTO que o envelope cego — matando a única vantagem de tempo que ele tem. Então o
relógio desce junto com a escada:
| faixa | tempo por degrau | por quê |
|---|---|---|
| acima de 40 | 0,6s | enfeite, ninguém paga |
| 23 a 40 | 1,4s | a tensão começa |
| 22 pra baixo | 2,0s | é aqui que a carta troca de mão |

Os **2,0s do fundo** são a peça do anti-delay: com dois segundos pra reagir, meio
segundo de internet ruim não decide carta nenhuma.

### 📊 Medido depois (`npm run holandes`)
- descida da leva: **43,8s** (era 39,4s) — ainda **abaixo** dos 45s do envelope cego;
- pregão inteiro: **10:57** contra **11:15** do cego. Continua mais rápido, com folga
  menor — que foi exatamente o que ele autorizou;
- economia igual: 49 × 51 arremates · 40 × 38 vagas vazias · 12,3 × 11,6 de preço.

### 🔒 E virou LEI na trava
`npm run holandes` agora reprova se: algum pulo **aumentar** na descida · de 30 pra
baixo aparecer pulo maior que 5 · os 14 últimos degraus não caírem de 1 em 1 · o
fundo não for a marcha mais lenta das três. Ninguém desfaz isso sem o teste gritar.

### 🛡️ `npm run ascegas` depois de tudo
`28bea2df` · `d65041f6` · `06bab491` — iguais.

---

## 20/09/2026 (parte 36) — 🙈 "Ainda não tô vendo no online ao criar sala" — dois motivos, os dois meus

Ele foi olhar e não achou. Duas coisas, e a segunda era bug meu:

### 1️⃣ Não está na `main` — nada disso foi pro ar
O trabalho todo do holandês vive no branch `claude/denis-save-file-x1osct`. O site
ao vivo é a `main`, que não tem uma linha disso. **Ele estava olhando o jogo no
ar.** Enquanto não houver o OK dele + merge, não vai aparecer.

### 2️⃣ E, quando aparecesse, estaria NO LUGAR ERRADO (bug meu)
Eu pus o campo "Como é o leilão" na seção velha da tela de criar sala. Só que a
tela **v2 está ligada pra todo mundo** (`CRIAR2_GERAL = true` em `sport.ts`) e ela
**recolhe aquelas seções dentro de um ⚙️ Ajustes**. Ou seja: o campo existia, mas
escondido atrás de uma engrenagem. Escolher o tipo de pregão é a decisão mais
importante da sala — não pode ficar lá.

**Movido pra Section "⚽ A partida"**, que é visível nas DUAS telas (a v2 e a
antiga).

### 3️⃣ E ele aparecia em modo que NEM TEM LEILÃO
O `{!isCareer && …}` que eu usei liberava também o **🃏 Bafo** (*"SEM LEILÃO — cada
um traz o time da própria carreira"*) e a **🌍 Copa do Mundo** (sala de seleções,
sem leilão). Perguntar "como é o leilão" numa sala sem leilão é justo o tipo de
tela torta que ele odeia.

Agora a condição é explícita e é a ordem dele: **`roomMode === 'rapido' || liga`**
— ⚡ Rápido online e 🏆 Minhas Ligas, mais nada. E a gravação no `game_state`
ganhou a MESMA condição, senão escolher Holandês no rápido e depois trocar pro
Bafo deixava `holandes: true` guardado numa sala sem pregão.

⚠️ **Lição**: `!isCareer` **não** quer dizer "tem leilão". Esta tela tem 5 modos, e
dois deles não leiloam nada. Quem for pôr opção de pregão aqui, liste os modos na
mão.

### 🛡️ Conferido depois de tudo
`npm run holandes` verde · `npm run ascegas` com as MESMAS digitais da main
(`28bea2df` · `d65041f6` · `06bab491`).

---

## 20/09/2026 (parte 35) — 🌐 Holandês LIGADO no online (Rápido online + 🏆 Minhas Ligas)

Ordem dele: *"ok pode criar no partida rápida e no modo rápido online e minhas
ligas"*. Os três estão ligados. **A Carreira online fica de fora** de propósito: lá
o pregão é o de sempre, e carreira é save longo — não é lugar de estrear modo.

### 🎛️ Onde o host escolhe
Na tela de montar a sala, um `SegField` novo — **"Como é o leilão"**, com `✉️
Envelope cego` (padrão) e `🔻 Holandês` — no mesmo lugar e estilo do "Baralho de
craques" e da "Formação". A escolha **é do HOST e vale pra sala inteira**: vai
gravada no `game_state` (`holandes: true`), então quem entra depois joga o mesmo
pregão, não o que o aparelho dele preferia. **Sala antiga não tem o campo → leilão
cego**, como sempre.

### 🔒 O SEGREDO QUE NÃO PODE VAZAR (o perigo real do online)
O estado do holandês é quase todo público — o pregão acontece na cara de todo
mundo. **Menos os `tetos`**: eles dizem por quanto cada robô vai apertar em cada
carta. Convidado com isso na mão sabe a hora exata de cortar o bot em TODA carta do
pregão — acabou o jogo. Então o `sanitize` (o mesmo que já esconde o
`pendingEnvelopes`) passou a **zerar `hol.tetos`** antes de o host mandar o pacote
pra sala. **Trava nova (seção 7)** confere as duas pontas: que o teto NÃO sai, e
que preço/degrau/`levados` SAEM (senão a tela do convidado não desenha nada).

### 📮 E o toque do convidado ganhou ESTRADA RESERVA
O `HOLANDES_PEGAR` entrou na lista dos recados que também vão **pelo banco**
(`room_acoes`, por HTTPS), além do rádio — e o host passou a lê-lo. Motivo: é o
recado mais urgente do jogo. Se o lance cego se perde, dá pra reenviar em 4s; aqui
**o preço está caindo**, cada toque vale por um preço que não volta. Diferente dos
outros, ele vai **sem folga de espera** — e chegar pelas duas estradas não compra
duas vezes, porque o reducer recusa toque com preço velho e carta que já tem dono.
O vigia do host também passou a acordar na fase `'holandes'`.

### 👑 Host sumido no meio da descida
Continua valendo a **regra permanente da coroa**: a sala PARA e espera o dono. No
holandês o `phaseDeadline` é `null` (quem manda o relógio é a escada de preços),
então não existe "fecha sozinho". É o comportamento desejado, não bug.

### 🛡️ E o às cegas continua intocado
`npm run ascegas` rodado DEPOIS de toda a fiação do online: `28bea2df` · `d65041f6`
· `06bab491` — as mesmas três digitais da `origin/main`.

### 📷 O que eu NÃO consegui mostrar
A tela de criar sala **exige login**, e eu não vou entrar na conta dele pra tirar
print. Então o botão novo do lobby é a única peça deste trabalho que ele ainda não
viu em foto — as do pregão (partida rápida) estão todas conferidas. Quando ele abrir
uma sala, é o 3º campo da tela, logo acima da Formação.

---

## 20/09/2026 (parte 34) — 🛡️ PROVA de que o leilão às cegas não foi tocado (`npm run ascegas`)

Ordem dele: *"tudo q estamos fazendo aqui, não mexa em nada o que já funciona no
modo às cegas, pelo amor de Deus"*.

Ler o diff e dizer "não mexi" **não vale** — é exatamente assim que bug entra.
Então virou prova, e a prova mora no repo: **`npm run ascegas`**.

### 🔬 Como ela funciona
Ela joga **três pregões às cegas INTEIROS** (sala de 6 · 8 · 12, formações e
baralhos diferentes) com o acaso **travado** — o `Math.random` é trocado por um
gerador de semente fixa, então baralho, bots, lances, empates e monte saem sempre
iguais. No fim imprime uma **impressão digital**: caixa + elenco + preço pago +
via, de todos os técnicos, resumido num número.

Se um dígito mudar, alguma coisa do modo às cegas mudou.

### ✅ O resultado (rodado nos dois lados)
| pregão | meu branch (com o holandês) | `origin/main` pura |
|---|---|---|
| sala de 6 · 4-3-3 · BR | `28bea2df` | `28bea2df` |
| sala de 8 · 4-4-2 · BR | `d65041f6` | `d65041f6` |
| sala de 12 · 4-3-3 · Europa | `06bab491` | `06bab491` |

**Idênticas.** Todo o trabalho do holandês (partes 25 a 33) não muda **uma moeda**
do pregão de hoje.

### 🧰 Como repetir
```
git worktree add /tmp/antes origin/main
ln -s "$PWD/node_modules" /tmp/antes/node_modules
cp scripts/prova-as-cegas.mjs /tmp/antes/scripts/
cd /tmp/antes && node scripts/prova-as-cegas.mjs --porta 5246
```
⚠️ **Compare sempre contra a MESMA base.** Na 1ª tentativa eu comparei com a
`origin/main` que já tinha as 49 cartas novas de outra sessão — as digitais não
bateram por causa do BARALHO, não do meu código. Ou se compara contra o
`git merge-base`, ou se traz a main pro branch antes (foi o que fiz).

### 🔀 Main trazida pro branch
`origin/main` andou (49 cartas novas, e a agência pagando por artilheiro/Bola de
Ouro). Merge feito; o único conflito foi este arquivo, com as duas sessões
escrevendo no topo — ficaram as duas.

Com o baralho novo, o holandês continua batendo o cego: **51 × 51 arremates,
37 × 37 vagas vazias, 12,5 × 12,2 de preço médio — e 9:36 contra 11:15.**

---

## 20/09/2026 (parte 33) — 🛟 A repescagem FAZ falta (eu estava errado) — e virou descida holandesa

Ele perguntou: *"e sobre repescagem acha q não deve ter mesmo?"*. Fui medir em vez
de opinar, e **a medição me desmentiu**.

### ❌ Onde eu errei
Eu concordei em tirar a repescagem com o argumento: *"o preço já passou por 1 moeda
na frente de todo mundo, todo mundo teve chance"*. Isso vale pra **GENTE** — você vê
a lista e pega o que quiser por 1 moeda. **Robô não funciona assim**: o teto dele sai
do `cpuEnvelope`, que só olha as `need` cartas mais bem ranqueadas. Carta que ele
nunca ranqueou, ele **não pega nem de graça**. E a pirâmide é quase toda robô.

Com a repescagem simplesmente removida: **55 vagas vazias** (contra 38 do cego) e
**32 moedas encalhadas** por técnico. 17 perna-de-pau a mais por leilão — justo a
reclamação dele de 19/09.

### 🛟 O que ficou (e respeita o que ele pediu)
Ele disse *"não tem negócio de repescagem nesse leilão"* — e quanto à **TELA** ele
está certo: envelope cego no meio de um leilão holandês é outro jogo. Então:
- **a repescagem continua existindo, mas como DESCIDA HOLANDESA**: as sobras do
  setor voltam pra mesa e o preço cai de novo. Mesmo visual, mesma lista, mesmo
  botão. Nenhuma tela nova;
- e antes disso, **dentro da própria descida**, quando o preço cruza 25% da
  abertura, os robôs que ainda têm buraco **reavaliam o que sobrou na mesa**
  (`holResgate`, usando o `cpuEnvelope(rescue)` que a repescagem de hoje já usa).

### 📊 E aí a conta fecha — inclusive o TEMPO, que eu vinha medindo errado
⚠️ **Segundo erro de medição desta série**: eu vinha dizendo que o pregão cego leva
"6:00". Mentira — eu contava só as levas e **esquecia as rodadas de repescagem
dele**, que também custam 45s cada. O cego de verdade leva **11:15**.

| | arremates | vagas vazias | moeda encalhada | pregão |
|---|---|---|---|---|
| 🔻 holandês | 53 | **36** | 23,4 🪙 | **9:51** |
| ✉️ cego (hoje) | 48 | 41 | 21,4 🪙 | 11:15 |

Ou seja, com a repescagem holandesa o modo novo ficou **melhor em tudo**: menos
perna-de-pau (36 × 41), mais carta colocada (53 × 48) e **1min24 mais rápido** que
o pregão de hoje.

### 🎬 E a tela depois da descida: FICA O REVEAL (decisão dele)
*"A manter revelando quem pagou valor e etc… se for lenda mostrará avatar e etc"*.
Nada a construir: o holandês já cai no `Reveal` de sempre, que mostra carta por
carta com o vencedor e o valor, e já trata lenda (selo 👑 LENDA, chime dourado,
áudio e o festão). O holandês passa por ele igual ao pregão cego.

### 🧠 Lição (a terceira desta série, e a mais cara)
**Toda comparação entre os dois modos tem que incluir as FASES INTEIRAS dos dois.**
Comparar "a leva do holandês" com "a leva do cego" e esquecer a repescagem do cego
deu 6:00 × 9:51 (holandês perdendo) quando a verdade é 11:15 × 9:51 (holandês
ganhando). Erro de escopo de medição, igual ao seed da parte 27 e ao arremate
contado duas vezes da parte 26.

---

## 20/09/2026 (parte 32) — ⏱️ O Diego escolheu POR TEMPO. E o holandês perdeu a repescagem.

Ele leu a parte 31 (roleta) e decidiu o contrário: *"eu ainda acho que deveria ter
que ser por tempo… só quando der alguma merda e o jogo não entender é aí sim iria
pro desempate. Eles não precisariam saber disso também, pra eles é como se fosse ao
mesmo tempo"*. Eu tinha levantado o argumento da internet; ele ouviu e escolheu.
**Decisão dele, implementada.**

### ⏱️ A regra agora
- **Pessoa aperta → a carta é dela NO MESMO TOQUE.** Sem janela, sem esperar
  degrau. Entra em `levados` na hora, e o campinho desenha na hora.
- **Chegou em segundo → recusado**, e a carta já aparece com o nome do outro.
- **Robô continua atrás da gente**: ele entra numa fila (`pedidos`) e só é servido
  no FIM do degrau. Se uma pessoa apertar naquele degrau, ela passa na frente.
  Regra antiga dele, mantida — senão o robô apertaria no milissegundo e ganharia
  sempre.
- **A roleta virou REDE INVISÍVEL**, que é exatamente o que ele pediu: ela só age
  na fila dos robôs (dois com o mesmo teto) ou se algum caminho novo um dia
  depositar dois pedidos na mesma carta. Ninguém vê: pra quem joga, "o outro
  chegou antes".

### 🔒 E o medo dele — "os dois põem o jogador no campinho?" — fica ainda MAIS seguro
Por tempo é mais simples de garantir que por janela: quem escreve `levados` é **só
o host, uma ação de cada vez**, e a primeira linha da carta tranca todas as outras.
Não existe ordem de execução em que os dois passem.
**Trava**: 40 disputas seguidas, alternando quem aperta primeiro — *quem apertou
primeiro levou **40/40***, e a carta nunca saiu duas vezes.

### 📱 A regra que o ONLINE vai ter que respeitar (ainda não ligado)
O convidado **não escreve `levados` no próprio aparelho**. Ele mostra **"✋
ENVIANDO"** e só desenha o jogador no campinho quando o host confirmar — o mesmo
padrão do "ENVIANDO…" do envelope cego. Se a tela dele entregasse na hora e o host
dissesse "não foi você", o jogador **apareceria e sumiria** do campinho. O estado
da tela já está pronto pra isso (`enviando` local); falta só o cano.

### 🗑️ E o holandês NÃO TEM MAIS REPESCAGEM
Palavras dele: *"não tem negócio de repescagem nesse leilão eu acho… quem não pegou
se ferra que vai ter que ir pro monte mesmo então. No 0 não tem empate também, é
monte direto"*. **Ele está certo**: a repescagem existe pra dar uma última chance de
PAGAR pelas sobras — mas no holandês essa chance já foi dada, o preço passou por 1
moeda na frente de todo mundo. Repescar depois seria leiloar a mesma carta duas
vezes. Agora, no holandês: **acabou a descida → o que sobrou vai direto pro Monte
Final**. (No pregão cego a repescagem continua exatamente como sempre.)

### ❓ O QUE FICOU EM ABERTO — precisa da decisão dele
Ele levantou, e eu NÃO construí pra não chutar: *"a próxima tela eu acho que já
seria outra lista não?? Ou apenas mostrar as cartas de quem pegou quem?? Até porque
se tiver lendas mostra também a carta da lenda com avatar também faz sentido assim.
E aí nessa área apareceria o desempate."*

São duas perguntas:
1. **Depois da descida, vai direto pra próxima lista (próximo setor) ou tem uma
   tela de resumo** mostrando quem levou quem, com a carta da lenda e avatar?
   → hoje está indo pro `Reveal` de sempre, que já mostra carta por carta com o
   vencedor. Dá pra: (a) manter, (b) pular direto pro próximo setor, ou (c) fazer
   um resumo novo em grade, com destaque pra lenda.
2. Ele falou em pôr o **desempate nessa área**. Com a regra por TEMPO isso perdeu a
   função (não sobra empate pra decidir) — mas se ele quiser o re-lance cego de
   volta pros casos de empate, é aqui que ele moraria.

---

## 20/09/2026 (parte 31) — 🎰 O desempate afunilado: NEM valor, NEM tempo — roleta. E o número numa sala de 20

Perguntas dele: *"e se der ao mesmo tempo alguém pegando junto? Como desempata…
ou já vai mostrar na hora alguma informação q o outro pegou um milésimo de segundo
na frente? E é com base no valor ou no tempo?? Precisamos afunilar tudo isso pq
imagina uma sala c/ 20 pessoas, tudo pode ocorrer"*.

### 📏 A REGRA, afunilada (é esta, e não muda)
Na janela de meio segundo, **a ordem de chegada NÃO conta**. Quem apertou naquele
preço está na disputa, ponto. Aí, nesta ordem:
1. **Gente ganha de robô.** Sempre. Se tem uma pessoa na fila, nenhum bot leva.
2. **Gente × gente → 🎰 roleta**, chance igual pra todos.
3. **Preço**: é o MESMO pra todo mundo (é o número da tela), então valor não
   desempata — não tem como, ninguém ofereceu mais que ninguém.

### 🤔 Por que NÃO é por tempo
"Quem apertou um milésimo antes" = **quem tem a internet melhor**. No online o
toque viaja até o host, e essa viagem não é igual pra todo mundo. Decidir por
tempo é decidir por operadora. Numa sala de 20 isso vira "o host e o do wifi bom
ganham tudo" — e o resto larga a sala.

### 🤔 E por que NÃO é por valor (mas o valor JÁ decidiu antes)
Não dá pra desempatar por valor porque os dois ofereceram **o mesmo preço**: o da
tela. Mas repare que o valor decide o jogo inteiro **antes** disso: quem quer o
Cafu de verdade aperta em **44**, não espera chegar em 16. Quem espera ganha
preço e arrisca dividir. **A roleta é só o que sobra quando duas pessoas quiseram
exatamente igual** — e aí o sorteio é o único juiz que não é a operadora de
celular.

### 📊 E COM 20 PESSOAS, QUANTO ISSO ACONTECE? (medido)
| sala | cartas resolvidas | deram empate | % | roleta média | maior roleta |
|---|---|---|---|---|---|
| 8 técnicos | 35 | 6 | **17%** | 2,2 técnicos | 3 |
| 20 técnicos | 78 | 17 | **22%** | 2,6 técnicos | 4 |

Ou seja: **4 em cada 5 cartas vão pra quem quis mais** (apertou mais cedo, pagou
mais). A roleta é 1 em 5, quase sempre entre 2 ou 3, e nunca passou de 4 numa sala
cheia. A trava reprova se passar de **34% das cartas** ou se der roleta com **mais
de 6 técnicos** — se um dia passar disso, o leilão virou sorteio e a regra precisa
mudar.

### 👀 E mostra na hora?
Mostra, e agora com o número da briga:
- pra todos: `🎰 Cafu → Rei da Bola FC por 16 🪙 · 3 pediram no mesmo preço — a
  roleta girou`;
- pra **quem perdeu**, faixa vermelha própria: *"Você pediu o Cafu por 16 🪙 — 3
  pediram no mesmo preço e a roleta deu pro Rei da Bola FC. Sua moeda continua no
  bolso. Pra não depender de sorteio, aperte MAIS CEDO: quem paga mais caro não
  divide com ninguém."* — a trava explica o porquê **e o caminho**, como ele exige.

### 🔀 A ALTERNATIVA que existe e NÃO foi ligada (decisão dele)
Dava pra mandar o empate pro **re-lance cego** que o pregão já tem
(`resolveOneTiebreak`): os empatados escrevem escondido e quem paga mais leva.
É mais "leilão" que sorteio. **Não liguei** porque, com 22% de empate e 21 levas
numa sala de 20, seriam **~17 paradas** no meio do pregão — e a regra de ouro dele
é que *nada pode atrasar o ritmo do jogo*. Se ele preferir o re-lance mesmo assim,
é ligar: o motor do desempate já existe e está testado.

---

## 20/09/2026 (parte 30) — ⚡ "Quando o cara aperta ele não pega na hora?" — agora pega (meio segundo)

Ele leu a parte 29 e estranhou, com razão: *"não entendi. Qd o cara aperta ele não
pega na hora e já não vai pro campinho dele??"*.

**Eu tinha exagerado na dose.** Na parte 29 o arremate só saía quando o DEGRAU
fechava — até 2 segundos parado olhando pra tela sem saber se era seu. Chato, e
contra a regra de ouro dele (*"nada pode atrasar o ritmo do jogo"*).

Agora a entrega tem **janela própria de meio segundo** (`HOL_JANELA_MS = 500`,
ação `HOLANDES_JANELA`), separada do relógio do preço:
- **apertou e ninguém mais apertou → a carta é sua em 0,5s**, sem esperar o degrau.
  O preço nem se mexe. Do lado de quem joga, é "na hora";
- **alguém apertou junto** → os dois entram na 🎰 roleta, como na parte 29.

### 🤔 Por que não pode ser ZERO (a pergunta por trás da pergunta)
No online o toque do convidado **precisa viajar até o host** de qualquer jeito. As
opções eram:
- **entregar na hora na tela dele** e o host responder depois "não foi você" → aí o
  jogador APARECE no campinho e SOME. É exatamente o estado quebrado que ele odeia
  (regra nº 3 do CLAUDE.md);
- **esperar o host** → a espera existe do mesmo jeito, só que honesta.

Ou seja: a espera não é escolha minha, é a rede. O que dá pra escolher é o tamanho
dela e se ela é justa. Meio segundo é maior que a diferença de internet entre dois
celulares na mesma partida e menor que o que a mão sente.

### 🧪 Travas (`npm run holandes`)
- **5-zero** (nova): aperta SOZINHO → `HOLANDES_JANELA` entrega a carta, o degrau
  **não anda**, o preço **não muda**, paga o que estava na tela e entra em
  `levados` (que é o que o campinho desenha). Com contador anti-verde-falso.
- `HOL_JANELA_MS` tem que ficar entre **250ms e 700ms** — abaixo disso não cabe a
  diferença de internet, acima disso a mão sente.
- A disputa de dois humanos (parte 29) passou a fechar pela JANELA também. Roleta:
  **20 × 20** em 40 disputas.

### 🏷️ E o texto mudou junto
O botão travado deixou de dizer "✋ PEDI" (que soava "torce pra dar certo") e passou
a dizer **"✋ É SEU!"**. A explicação de baixo agora é: *"Apertou, é seu — o jogador
cai no seu campinho em meio segundo. Esse tiquinho existe só pro caso de outra
pessoa apertar junto."*

---

## 20/09/2026 (parte 29) — 👥👥 "E se os DOIS apertarem quase junto? Vão os dois pôr o jogador no campinho?"

Pergunta dele, e é o pesadelo clássico do leilão ao vivo: *"agora é sobre o delay e
sobre o usuário apertar pegar ao mesmo tempo quase?? E aí?? Será q vai os dois pôr
o jogador no campinho e tal?? O mesmo jogador"*.

**NÃO VAI — e não é promessa, é como o código foi montado.** Apertar não arremata:
vira um PEDIDO do degrau. Quando o degrau fecha, o `holResolvePedidos` junta TODOS
os pedidos daquela carta e escreve **UMA linha** em `hol.levados`. E `levados` é a
fonte ÚNICA de tudo: o campinho (`YourPitch`), a caixa, a vaga e o
`pendingEnvelopes` que fecha a leva. Não existe caminho no código em que a mesma
carta saia com dois donos.

### 🧪 A trava que prova (`npm run holandes`, seção 5-bis)
Simula a sala online de verdade: **dois assentos HUMANOS** pedindo a MESMA carta no
MESMO degrau. Confere, uma a uma:
- antes do degrau fechar, **nenhum dos dois** tem a carta (pedido ≠ arremate — é o
  arremate por ordem de chegada que ele temia);
- depois de fechar, a carta sai com **1 dono**, e pelo preço que estava na tela;
- **quem perdeu não paga NADA** e continua com a vaga aberta (a caixa dele nem se
  mexe — conferido moeda a moeda);
- quem perdeu **vê o porquê** numa faixa 😤 (`ultimo.perdedores`), em vez da carta
  sumir em silêncio;
- **o mesmo jogador não entra em dois campinhos** (soma dos `levados` dos dois = 1);
- e o botão apaga pros DOIS: ninguém aperta numa carta já arrematada.

### 🎲 E a roleta não é viciada
40 disputas repetidas deram **22 × 18**. A trava reprova se um dos dois nunca ganhar
ou se ficar abaixo de 25%. Isso importa: se o host ganhasse sempre, o convidado
largava a sala na primeira noite — e "o host manda" (regra dele) é sobre QUEM
arbitra, não sobre quem leva a carta.

⚠️ **E a trava confere que ela própria RODOU** (`disputaTestada`). A simulação tem
`if`s (precisa achar uma carta que os dois possam pegar); sem esse contador, ela
podia ficar verde sem ter conferido nada. Teste que não roda é pior que teste nenhum.

### 📶 E o delay, em uma frase
Cada degrau dura **~2 segundos**. O host não olha quem chegou primeiro — ele espera
o degrau FECHAR e resolve todo mundo junto. Então meio segundo de internet ruim não
tira a carta de ninguém: quem apertou naquele preço está na disputa, ponto.

### ⏳ O que ainda falta pra isso valer online de verdade
O **roteamento** (`HOLANDES_PEGAR` do convidado → host, e o host transmitindo preço
e `levados`). A REGRA que decide já está pronta e travada; o que falta é o cano.
Enquanto não for ligado, o holandês só aparece na partida rápida offline.

---

## 20/09/2026 (parte 28) — ⚽ O campinho enche NA HORA no holandês

Pedido dele: *"além disso conseguiu o jogador aparece no campinho do usuário embaixo
também"*. Feito — e o campinho é o `YourPitch` de sempre, o MESMO que o pregão cego
já mostra embaixo da tela. Nada de desenho novo.

**O detalhe que precisou de código**: no holandês a carta arrematada só entra no
elenco de verdade quando a LEVA FECHA (quem paga e move é o `resolve` de sempre —
foi assim que a gente garantiu que o holandês não mexe no dinheiro). Então, no meio
da descida, o campinho mostraria só as levas ANTERIORES e o jogador que você acabou
de levar não apareceria. Agora o `YourPitch` desenha também o que está em
`hol.levados` no seu nome.

✅ **E isso não vaza nada**: no holandês o martelo cai na frente de todo mundo, não
existe revelação escondida pra estragar. O NÍVEL continua secreto até a Cerimônia —
o campinho nunca mostrou nível, só nome e posição. A trava anti-spoiler da
revelação (`pendingIds`) continua intacta e vem depois, então o pregão cego não
mudou em nada.

Conferido na tela: apertei PEGAR no Cortês a 16 🪙 → a carta saiu da lista pra "🫵
VOCÊ", a caixa foi de 100 pra 84, a vaga de lateral foi de 2 pra 1 e ele apareceu
no campinho de baixo, tudo no mesmo instante.

### 👥 E a regra do baralho por número de usuários (ele repetiu)
Continua valendo o que a parte 27 mediu: **é a mesma regra de hoje**, e o holandês
não encosta nela. O baralho sai do `buildDeck(auctioningManagers(...))` antes do
pregão; o holandês só entra no `startAuctionPhase`, depois. 20 técnicos = 220 vagas
= 225 cartas = 21 levas, idêntico nos dois modos.

---

## 20/09/2026 (parte 27) — 👥 "O baralho segue a quantidade de usuários, igual à regra que já funciona?" — SIM

Pergunta dele: *"tem q ser msm regra c/ base na quantidade de jogadores usuários q
entram no online igual a regra q já funciona ou tô errado?"*.

**Ele está certo, e já é assim** — não precisou mexer em nada. O baralho é montado
pelo `buildDeck(auctioningManagers(s.managers), rng, 1.0, …, extra = 1)` **antes**
do pregão começar. O holandês só entra em `startAuctionPhase`, que roda DEPOIS. Ele
não encosta no baralho, na formação, na vaga nem na leva.

Medido, sala por sala (`npm run holandes`):

| técnicos | vagas (11 cada) | cartas no baralho | levas | pregão 🔻 holandês | pregão ✉️ cego |
|---|---|---|---|---|---|
| 3 | 33 | 38 | 5 | 3:17 | 3:45 |
| 6 | 66 | 71 | 7 | 4:36 | 5:15 |
| 8 | 88 | 93 | 10 | 6:34 | 7:30 |
| 12 | 132 | 137 | 12 | 7:53 | 9:00 |
| 20 | 220 | 225 | 20 | 13:08 | 15:00 |

Sempre **demanda + 1 carta por posição**, e a leva continua sendo a de hoje
(`BATCH_SIZE = 12`, `batchCount`). De brinde: o holandês fecha **mais rápido** que o
cego em toda sala, porque a descida da leva custa 39s contra 45s do envelope.

### 🧨 E a trava pegou um erro meu DE NOVO — vale a lição
A primeira versão desta trava comparava o baralho dos dois modos **carta a carta** e
acusava diferença em MEI e ATA em toda sala acima de 6. Não era o modo: o `START`
sorteia um `seed` NOVO a cada partida, então nas duas partidas os bots sorteavam
formações diferentes (4-3-3 × 4-4-2) e a divisão MEI/ATA mudava **por sorteio**.

👉 **Regra pra quem for medir dois modos deste jogo**: `START` é aleatório. Ou se
pina o seed, ou se compara a **CONTA** (cada posição cobre a demanda daquela
partida; a demanda é 11 × técnicos; o baralho é demanda + folga), nunca o número
cru de uma partida contra o da outra. É o segundo erro de medição meu em dois dias
— o primeiro foi o "80 × 47" da parte 26.

Com o ruído do seed fora, a comparação de 8 técnicos ficou **49 arremates × 49** e
**39 vagas vazias × 39**: a economia é a MESMA, como ele previu.

---

## 20/09/2026 (parte 26) — 🔻 Holandês virou LISTA (ideia dele) e ganhou o anti-delay

Ele bateu em dois pontos ao ver a primeira versão (uma carta por vez):

1. *"Qd alguém apertar vai sair o jogador na hr?? Pq o problema é alguém apertar e o
   botão não atualizar e com isso ainda ter esse botão de apertar e o outro jogador
   apertar… tô preocupado com delay também."*
2. *"Achei q fosse tipo aparecer todos listados igual já é no nosso leilão e a barra
   de 100 moedas caindo c/ botão ali da pessoa pegar… mas por mim tanto faz, quero
   o que seja melhor. Só me explique por que você acha assim."*

**A ideia dele é melhor, e os dois problemas são O MESMO problema.** Com uma carta
por vez, a leva de 12 precisava de 12 descidas — pra caber no tempo de hoje, cada
degrau durava ~0,2s. Nesse ritmo quem tem internet melhor ganha a carta, sempre.
Com a leva INTEIRA na tela e **uma descida só**, o degrau passa a durar **~2
segundos** (10× mais folga) e a leva fecha em ~39s, contra os 45s do envelope cego.

### ✋ O anti-delay, em três camadas
1. **Apertar não arremata na hora — vira um PEDIDO daquele degrau.** A carta tranca
   na hora **no seu aparelho** (vira "✋ PEDI"), antes do host responder. Não existe
   apertar duas vezes: o motor também engole o 2º toque, não é só a tela escondendo.
2. **O host não decide por ordem de chegada.** Ele espera o degrau FECHAR e resolve
   todos os pedidos daquele preço juntos. Internet melhor não vale nada.
3. **Empate no mesmo preço**: 🎰 roleta entre as pessoas — e **gente sempre passa na
   frente de robô** (o robô aperta no milissegundo; se competisse na reação, ganharia
   sempre). Quando o degrau fecha, a carta sai da lista pra TODO MUNDO, em cinza, com
   o nome de quem levou e por quanto.
4. E a trava velha continua: **toque com preço VELHO não vale** (nada de pagar um
   preço que ninguém viu na tela).

### 📊 O que mudou nos números — e o ERRO que ele pegou

⚠️ **Primeiro a correção, porque foi feia.** Eu mandei pra ele *"o holandês vende
muito mais: 80 × 47"* e contei isso como coisa boa (menos perna-de-pau). Ele
respondeu: *"não entendi pq ter mais jogadores… pq se não perde oferta e demanda"*.
**Ele estava certo e o número era MEU ERRO**: a medição contava o mesmo arremate
duas vezes no holandês — uma vez ao vivo (`hol.levados`) e outra na revelação —
enquanto no pregão cego contava só uma. O pregão cego não tem "ao vivo", então a
comparação era torta desde o começo. Agora só a REVELAÇÃO conta, que é o mesmo
lugar nos dois modos.

Medido de novo, direito (`npm run holandes`, 93 cartas, 8 técnicos):

| | arremates | no pregão | na repescagem | desceram p/ repescagem | vagas vazias | preço médio | tempo |
|---|---|---|---|---|---|---|---|
| 🔻 holandês | 48 | 32 | 16 | 61 | 41 | 12,5 🪙 | ~6:23 |
| ✉️ cego (hoje) | 51 | 33 | 18 | 60 | 37 | 12,7 🪙 | ~6:00 |

**São a MESMA coisa.** E tem que ser mesmo, pelo motivo que ele deu: a oferta (93
cartas) e a procura (as vagas dos 8 técnicos) não mudaram — o holandês só troca o
jeito de DESCOBRIR o preço, não quantos jogadores existem nem quantas vagas tem.
Se vendesse muito mais, era sinal de bug, não de feature.

A única diferença de verdade são os **23 segundos a mais** no pregão inteiro.

🧠 **Lição pra quem mexer nisto depois**: quando um modo novo parecer "melhor" num
número de balanço, desconfiar da MEDIÇÃO antes de comemorar. Os dois modos têm que
ser medidos no MESMO ponto do código (aqui: a revelação), senão a conta mente.

### 🔒 Travas novas no `npm run holandes`
Além das de ontem: apertar 2× na mesma carta não vira 2 pedidos · a carta sai com UM
dono só quando duas pessoas pedem no mesmo preço · gente ganha de robô no empate ·
a carta arrematada não volta a acender botão · e o degrau de baixo tem que durar
**≥1,5s** (é a conta que faz o delay parar de decidir a partida).

### ⏳ Continua faltando
1. **OK visual do Diego.**
2. **Roteamento online** do `HOLANDES_PEGAR` (convidado → host) e uma rede pra host
   que some no meio da escada (hoje `phaseDeadline` é `null` no holandês).
3. Linha em `novidades.ts` — só na entrega que ligar isso pro pessoal.
4. **Envelope Mudo** segue sem construir (falta ele dizer se a carta muda ENTRA a
   mais na leva ou SUBSTITUI uma, e se pode dividir leilão com o 🎁 Surpresa).

---

## 20/09/2026 (parte 25) — 🔻 LEILÃO HOLANDÊS: o modo novo, pronto e esperando o OK visual

Ideia aprovada por ele em 19/09, com as regras ditadas: *"a hi q tem q começar com
100 p qlwr jogador até pq ng tem 200… todo mundo começa C 100"* · *"preço cair até
0… se ng pegar esse jogador vai pras sobras igual ocorre hoje Tb já"* · *"oq manda
e o ID do host sempre"* · *"quantidade de jogadores q aparece no leilão e regras
com quantidades q jogam tudo igual Tb"* · *"quero usar tudo parecido C oq já
funciona hoje no motor e visual"*.

### 🔑 A decisão de arquitetura que faz isso NÃO poder quebrar o jogo no ar
O holandês **só troca o jeito de COLETAR o lance**. Quando a leva acaba, ele
escreve os arremates em `pendingEnvelopes` — o MESMO lugar de onde o pregão cego lê
— e chama o `sealAndResolve` de sempre. Daí pra frente é 100% código antigo:
`resolve` paga, move a carta pro elenco, anota no livro de preços, credita o
vendedor, cobra a comissão do agente, monta a revelação e manda o que ninguém quis
pra repescagem/monte. **Nenhuma regra nova toca em dinheiro.**

A bandeira `holFechando` liga por um instante só pra avisar o `sealAndResolve` que
não é pra gerar envelope de CPU (senão o bot disputaria contra o próprio arremate).

### 📐 Como ficou
- **Escada de preços** (`holEscada`): 100 · 90 · 80 · 70 · 60 · 52 · 44 · 36 · 31 ·
  26 · 21 · 16 · 14 · 12 · 10 · 8 · 7 … 1 · 0. Degrau **gordo em cima** (ninguém
  paga 90 num lateral) e **miúdo embaixo**, que é onde a decisão acontece. No
  basquete abre em 50, que é o bolso de lá.
- **Abertura IGUAL pra toda carta** — de propósito: preço de abertura diferente
  entregaria o nível, que é segredo até a Cerimônia.
- **O bot** não ganhou cérebro novo: o teto dele sai do MESMO `cpuEnvelope`,
  calculado uma vez quando a leva abre. Ele só passa a "apertar o botão" quando o
  preço desce até o valor que ele teria escrito no envelope.
- **Repescagem e setor técnico continuam no envelope cego.** Sobra é sobra.
- **Online**: quem faz o preço cair é SÓ o host (`HOLANDES_TICK`), e o toque do
  convidado vai roteado pra ele. ⚠️ A perna de roteamento online ainda **não foi
  ligada** — ver pendências abaixo.

### ⏱️💰 Medido, não chutado (`npm run holandes`)
O MESMO pregão (93 cartas, 8 técnicos, humano só assistindo), nos dois modos:

| | cartas | arremates | preço médio | tempo de pregão |
|---|---|---|---|---|
| 🔻 holandês | 93 | 54 | 10,4 🪙 | ~5:52 |
| ✉️ cego (hoje) | 93 | 48 | 12,4 🪙 | ~6:00 |

Ou seja: **não atrasa o ritmo** (regra de ouro dele) e a economia fica praticamente
igual. As duas diferenças naturais do formato, que ele precisa saber:
- o holandês **vende um pouco mais** (54 × 48): quem perdeu uma carta ainda pega a
  seguinte quando o preço chega nela — no envelope cego o lance perdido é lance
  jogado fora;
- e **paga um pouco menos** (10,4 × 12,4), porque a escada é de degraus: o bot leva
  no primeiro degrau ABAIXO do teto dele, nunca exatamente no teto.

### 🔒 Travas
`npm run holandes` roda um pregão INTEIRO no motor de verdade e reprova se:
abertura ≠ 100 · a escada não chegar a 0 · alguém ficar com caixa negativa · alguém
estourar vaga de posição · uma carta cair em dois elencos · a tela acender PEGAR e
o motor recusar (botão mudo) ou o contrário (arremate fantasma) · um toque com
**preço velho** for aceito · e — o mais importante — se o **pregão cego de hoje**
deixar de fechar igualzinho.

`npm run mockup-holandes` tira as fotos da tela no jogo de verdade (não é desenho).

### ⏳ O que FALTA (não está pronto)
1. **OK visual do Diego** — ele decide o visual, e nada disso vai pra `main` antes.
2. **Roteamento online** (`HOLANDES_PEGAR` do convidado → host, e o host
   transmitindo o preço). Hoje o modo só aparece na **partida rápida offline**.
   Quando ligar: o vigia de prazo do online precisa de uma rede pra host sumido no
   meio da escada (hoje `phaseDeadline` é `null` no holandês).
3. **Linha em `novidades.ts`** — só entra na entrega que ligar isso pro pessoal.
4. **Envelope Mudo** (a outra ideia que ele gostou) continua sem construir; faltava
   ele responder se a carta muda ENTRA a mais na leva ou SUBSTITUI uma, e se pode
   dividir leilão com o 🎁 Surpresa.

### ↩️ Dá pra voltar atrás?
Dá, e é barato: o modo nasce DESLIGADO (`holandes: false` no `INITIAL`) e só liga
por escolha na tela de montar a partida rápida. Sem a escolha, o jogo roda o mesmo
código de sempre — o `npm run holandes` prova isso a cada rodada. Pra sumir de vez:
reverter o commit.
---

## 20/09/2026 (parte 2) — 🥇 A AGÊNCIA PAGA POR ARTILHEIRO E POR BOLA DE OURO

Ordem dele, no mesmo dia da tela nova: *"o usuário tem q ganhar 1 moeda na temporada
se o jogador for artilheiro de qlqr competição ou mais uma se for bola de ouro também.
Desses ativos logicamente"*.

### Como ficou
- **Artilheiro de QUALQUER competição = 1 🪙.** Já valia pra cada série da liga e pra
  Copa (a Supercopa entra dentro dela, porque o `copaBrasilAsCopaResult` soma os gols
  do jogo do título). **Faltava a Copa do Mundo — agora entra.**
- **Bola de Ouro = mais 1 🪙**, em linha separada: quem foi artilheiro *e* melhor do
  mundo leva as duas. Cai na virada, junto das outras comissões.
- **Só quem está NA ATIVA** (`agenciados`). Quem espera a vez não paga nada e não
  acumula nada — a mesma regra das mensalidades.
- 🚫 **Campeão continua sem pagar** (ordem de 16/09). Nada mudou aí.

### O pulo do gato da Copa do Mundo
Ela acontece no **passo 3 do roteiro**, ou seja **depois de o caixa fechar** — então
não dava pra pendurar em `agenciaEventos` (que já foi pago na virada). A comissão dela
é paga **na hora**, pela ação nova `AGENCIA_COMISSAO_MUNDO`, com trava por
`nome+temporada` dentro do `copaPrizeDone` (o mesmo mapa do prêmio de 100 🪙, que
persiste no autosave). Reabrir o jogo não paga duas vezes.
O artilheiro sai do `artilhariaDaCopa()` — a MESMA conta que a tela da Copa já
mostrava, agora em função. **Ela só LÊ o torneio simulado: não encosta no `rng`**,
então placar e campeão continuam idênticos.

### Travas
`npm run agencia` (novo) — paga 1 pro ativo, 0 pra quem espera a vez, não paga duas
vezes e não mexe em carreira antiga (`agenciaOn` desligado).

**Reverter**: commit só de regra de dinheiro + textos; `git revert` volta tudo e
nenhum save quebra (o que já foi pago fica pago, como qualquer moeda do jogo).

---

## 20/09/2026 — 🕴️ SUA AGÊNCIA: saiu do Elenco, foi pro Clube e ficou legível

Decisão dele depois de recusar seis direções novas (transferências, fantasy, álbum,
ranking de empresários, museu de ídolos, telefone do empresário): *"a minha forma
dos 22 ainda parece melhor. Quero que melhore, aperfeiçoe"* + *"tem que tirar do
elenco e pôr lá no clube também, mostrar dinheiro onde ela olha"* + *"E pode
fazer"*. A MECÂNICA não mudou nada: título dá carta · até 22 na ativa · cada
categoria rende o mesmo de sempre · as obras destravam igual.

### O que entrou (`src/escalacao/pyramidseason.tsx`)
- **Mudou de lugar**: `Clube › 🕴️ Sua Agência` (era `Elenco › Agenciados`; a
  sub-aba do Elenco sumiu, o `elencoSub` foi embora). A escada de desbloqueios
  (`AgenciaDesbloqueios`) veio junto — agência num lugar só.
- **A frase que explica o negócio** no cabeçalho + o dinheiro em cima:
  "mensalidades desta temporada", onde ele cai (extrato 🕴️ Agência) e o
  **total que a agência já rendeu na carreira** (soma do `agenciaHist`).
- **O 22 deixou de ser número mágico**: a regra que ele ditou está escrita na
  tela — *"quem não está ativo não recebe nada e nem o que teria ganhado; só
  quando ativo, a partir daquele momento"*.
- **⚡ um toque** põe na ativa quem mais rende (o que PAGA hoje manda; carta
  travada não fura fila) e **🧢 escolher na mão** continua pra quem gosta.
- **💤 Esperando a vez**: quem está fora aparece, apagado, com o número do que
  renderia. Antes era cofre invisível.
- **🆕 Aviso de troca** quando chega carta que rende MAIS que a pior da ativa
  (só quando a troca põe dinheiro hoje — nada de "ele rende +0 e o outro +0").
- **🔒 O dinheiro parado virou chamada** ("+24 🪙 por temporada parados"), com o
  caminho da obra.
- **🃏 E a ESCOLHA virou CARTA** (*"ao ele escolher os jogadores ele vê as
  cartinhas também né?"*): a convocação era uma LISTA de nomes e virou grade de
  cartinhas (cor do tier, rosto quando existe, clube · ano, quanto rende), com
  🔍 pra abrir a carta inteira com bio. O quadradinho virou um componente só
  (`AgMini`), usado na ativa, na espera e na convocação.
- Correção de régua: a legenda dizia 👑 **5** e o valor real é **6**.

**Reverter**: é um commit só, e é só de tela — `git revert` põe a agência de volta
no Elenco sem mexer em save nenhum (nada de economia mudou).

**Bancada**: `scripts/teste-rosto/index.html?agencia2` monta a tela com carteira
cheia (31 clientes, 22 na ativa, SAF por fazer) — é de lá que saíram os prints.

---

## 19/09/2026 (parte 24) — 🔀 DUAS SESSÕES fizeram o perna-de-pau, e ficou UMA régua

Na hora de publicar, a `main` já tinha o commit `6f2754c` de OUTRA sessão fazendo a
MESMA coisa que eu tinha feito no branch: tirar o perna-de-pau da estatística. Sete
conflitos, todos nos mesmos pedaços.

**Resolvi tudo pro lado da `main`**, e desfiz a minha metade. Motivo, e vale pra
próxima vez que isso acontecer:
- a versão deles **já estava no ar** — é a que o Diego está vendo;
- ela vai mais longe e do jeito certo: o filler **nem entra no sorteio** do gol
  (`xi.filter(c => !ehFake(c))`), em vez de marcar e ser peneirado depois;
- ela trouxe junto o **prêmio da Bola de Ouro** (20 moedas + 10 de piso), que é
  pedido dele e eu não tinha;
- e, acima de tudo: **duas réguas pra mesma regra é fábrica de bug.** Meu
  `fake.ts` foi APAGADO e tudo passou a usar o `ehFake()` do `store.tsx`.

### 🎯 O que sobrou de meu, porque a `main` não tinha
- **Sobra de verdade antes do perna-de-pau** (`sobrasReais` + `fillToEleven`) — o
  pedido dele de *"ele poderia ganhar um atacante de sobra"*. Não tem equivalente lá.
- **O jogo rápido e a sala online** (`simMatch`): a régua deles pegou a carreira
  (liga e copa), mas o rápido/online roda em **outro motor** — e é lá que a sala
  grande enche de incógnita. Agora peneira nos dois, com a MESMA régua.

⚠️ **A diferença de comportamento que o Diego precisa saber**: ele me disse *"eles
podem fazer gols durante o jogo, não tem problema"*, e a versão que ficou é mais
dura — o perna-de-pau **nem marca na súmula** (o gol sai como gol do time). Como é a
que já está no ar e ele não reclamou, fica. Se ele quiser o meio-termo (marcar na
súmula mas não no ranking), é voltar o sorteio e peneirar só a lista.

**Trava: `npm run fake`** — reapontada pra régua da `main` e ampliada com as duas
partes que sobraram (rápido/online e sobra antes do filler).

---

## 19/09/2026 (parte 23) — 🏋️💸 Troco de 200 pra quem já tinha o preparador 👑

Ordem dele: *"aumente 200 de moedas pra quem tem o preparador [👑 Lenda], igual o
time Rei da Bola — porque eu diminuí o valor de 1000 pra 800"*.

Quem comprou o 👑 antes pagou **1.000** por uma coisa que agora custa **800**. O
troco entra no caixa quando o save abre, com **recibo na tela** (mesmo formato do
reembolso do Dep. Médico de 15/09 — não inventei layout novo).

Garantias, as mesmas do irmão dele:
- **uma vez só**: `preparadorDevolvidoV1` é gravada ao abrir, inclusive em quem não
  tem preparador nenhum (assim o save não é varrido toda vez);
- **só clube SEU** (principal + 2º clube); time de máquina nunca entra;
- **nada mais é tocado**: contrato, salário e tanque do preparador ficam iguais;
- **vai pro Extrato**, então dá pra conferir de onde veio a moeda.

A tabela `PREPARADOR_DEVOLVE` é uma linha por preparador de propósito.

### ✅ E o ⭐ também (ele liberou: *"perfeito, pode tb"*)
O ⭐ caiu de **600 pra 500** na mesma mexida, então quem comprou antes recebe **100**
pelo mesmo motivo. A tabela ficou: `{ seirulo: 200, paixao: 100 }` — 🟢 e 💎 não
mudaram de preço e não têm troco. O texto do recibo virou genérico (cita os dois
preços novos), porque agora são dois valores diferentes na mesma tela.

### 🩹 E de quebra: a trava do preparador estava REPROVANDO há dois dias
`npm run preparador` falhava em duas linhas desde a mexida de preços de 19/09 (a
outra sessão baixou 600→500 e 1000→800 e fez a renovação virar metade, mas os dois
números estavam escritos à mão na trava). Consertado — agora os preços **saem do
catálogo**, então a próxima mudança de preço não quebra a trava de novo.

---

## 19/09/2026 (parte 22) — ⚔️ A linha do próximo jogo mais sutil + rivalidade só entre usuários

Mockup aprovado por ele (*"sobre o mockup anterior está aprovado"*). O pedido veio
vendo a tela da sala em live: *"tá mt exagerado esse negócio de próximo jogo e
equilíbrio retranca e ataque… não precisa escrever o que é retranca, equilíbrio e
ataque, só bote. E de forma mais sutil também o próximo jogo"*.

### O que mudou
1. 🧹 **Saiu a explicação das táticas** ("retranca segura ataque · ataque atropela
   equilíbrio…"), nos DOIS blocos — o da liga e o da Copa. Ele mexe na tática toda
   rodada; a explicação era ruído fixo. **A regra no jogo continua a mesma.**
2. 🔇 **O título encolheu**: "PRÓXIMO" e "(em casa)" viraram uma etiqueta miúda em
   cima (10px, cinza), e o nome do jogo caiu de 18px pra 15px. No celular ele
   ocupava três linhas.
3. ⚔️ **A rivalidade virou pílula**: `⚔️ RIVALIDADE V=2 · E=1 · D=1`.

### A regra da rivalidade (palavras dele)
*"Se tiver alguma rivalidade mostre se já teve jogo entre usuários APENAS. Se for
usuário e bot não mostre nada… mas só vale entre usuários"*. Dois cortes:
- o adversário tem que ser **gente** (`isHuman`) — **rival-bot da carreira não
  conta**, mesmo continuando a ser "clássico" pra cor da caixa e pra etiqueta;
- e eles já têm que **ter se enfrentado** — no primeiro duelo não existe
  retrospecto, e "0 × 0" seria ruído.

O `rivalry` velho (que misturava usuário e rival-bot num retrospecto por extenso)
foi embora junto com o parágrafo de clássico.

**Trava: `npm run proximo`** — 3 seções: a explicação não volta · a pílula sai do
corte de usuário e exige jogo · o título continua miúdo.

### ⏳ Ficou de fora, e ele ainda não respondeu
A **faixa de DEPOIS do jogo** ("⚔️ CLÁSSICO VENCIDO contra X · Rivalidade: você 2 ×
1") ainda mostra retrospecto **contra rival-bot da carreira**. Ele falou só do
próximo jogo, e eu não quis estender por conta — perguntei e está esperando.

---

## 19/09/2026 (parte 21) — ⏱️ Mais 1 segundo na partida, agora incluindo TODAS as copas

Ordem dele: *"aumente mais um segundo qualquer copa do online e offline… e também
no jogo normal… qualquer modo offline carreira ou online… enfim aumente 1 segundo
da simulação da partida pras copas todas e ligas"*.

| onde | era | ficou |
|---|---|---|
| rodada do rápido/online (e basquete) | ~5,7s | **~6,7s** |
| carreira · manual | 10s | **11s** |
| carreira · auto | 11s | **12s** |
| Copa da carreira (Legends / Brasil) | 9s | **10s** |
| Copa dos 8 (rápido/online) | 15s | **16s** |
| Copa do Mundo · offline | 9s | **10s** |
| Copa do Mundo · online | 14s | **15s** |

Um número só por lugar: `ROUND_EXTRA_MS` (rápido/online), `ROUND_MS` (carreira),
`COPA_LEG_MS` (as duas copas de clube — a do rápido sai dele com +6s) e o par do
`copa-mundo.tsx`.

### 🗄️ ⚠️ FALTA RODAR O SQL — e sem ele a sala online fica pra trás
Na sala **sincronizada**, quem manda no relógio da Copa do Mundo é o BANCO
(`esc_copa_clock_preview.duration_ms`), pra todo mundo ver o mesmo minuto. O
código só usa o número dele quando não há relógio sincronizado. Então:

👉 **rodar `docs/sql/online-copa-clock-mais-1s.sql`** (única mudança: `14000` →
`15000`). Sem isso, a Copa da sala continua em 14s enquanto o resto do jogo já
está 1s mais devagar — e nada na tela avisa.

**Trava: `npm run ritmo`, seção 1b** — confere os sete tempos E se o SQL bate com
o código (se alguém mexer num e esquecer do outro, reprova).

---

## 19/09/2026 (parte 20) — 🎯 Sobra de VERDADE antes do perna-de-pau (e o que eu desfiz)

### ⛔ Primeiro: o que eu desfiz, porque passei do ponto
Vendo o print do Geovany (`ATA · Zé Ninguém (Várzea 2000) · pagou 50`), eu concluí
que o perna-de-pau estava vazando pro LEILÃO e fechei a porta: pus `fake: true` nas
quatro fábricas de filler e troquei 6 guardas do leilão. **O Diego mandou desfazer**:
*"não queria que você fizesse muito bem assim não… o Geovany comprou no SONDAR
jogador. Deixa ele poder ir pro sondar, não tem problema não — o usuário pode
comprar sim lá no sondar se ele quiser"*.

E ele estava certo também no efeito colateral: com o selo, o perna-de-pau comprado
**deixaria de contar pra fechar os 11** no elenco de quem comprou, perderia contrato
e sumiria da sondagem. Mudança grande demais. **Tudo revertido.**
👉 Quem mantém o perna-de-pau fora de RANKING continua sendo o `ehCartaFake()`
(`fake.ts`), que reconhece pelo clube e pelo id — não precisa de selo nenhum.

### ✅ O que ele pediu de verdade, e que está feito
Palavras dele: *"a gente tem um sorteio de um jogador que vai pro leilão, e o time
desse jogador também participa do leilão. Se ele também não comprar nenhum atacante
nesse leilão, ele poderia ganhar um jogador que está sobrando das sobras, de
atacante de sobra. Mas só se ele não conseguir repor esse atacante no leilão"*.

Era exatamente o buraco: `fillToEleven` (a rede que devolve o time de fundo pra 11
depois do mercado) ia **direto pro perna-de-pau**, sem nunca olhar as sobras. Por
isso nascia um Zé Ninguém ATACANTE com 31 de nível enquanto dezenas de atacantes
reais estavam sem dono — a resposta pra pergunta dele.

Agora a ordem é **1º sobra real · 2º perna-de-pau**:
- `sobrasReais(s)` monta a fila por posição com quem não está em elenco nenhum
  (nem de técnico, nem de fundo, nem no baralho do leilão);
- ordenada do mais FRACO pro mais forte — quem tapa buraco de time de fundo é a
  sobra modesta, não o craque esquecido (esse continua aparecendo no leilão);
- consumida com `shift()`, então dois times nunca levam a mesma carta;
- o perna-de-pau **continua existindo** como última rede: sem ele, time de fundo
  entraria em campo com 10.

**Trava: `npm run fake`, seção 6.**

### 📊 Quantas cartas faltam pra acabar com o perna-de-pau de vez
Medido (`npm run pernadepau`), com 20 técnicos de elenco CHEIO (27 cartas):
| posição | faltando |
|---|---|
| GOL | 47 |
| LAT | 77 |
| ZAG | 58 |
| MEI | **0** |
| ATA | **0** |

Ou seja: **não falta atacante nem meia — falta goleiro, lateral e zagueiro.** E o
corte em 4 faixas de força pede margem, então na prática são ~+100 GOL, ~+150 LAT e
~+120 ZAG (≈ 370 cartas novas, baralho indo pra ~1.840). Não precisa de 2.500.

---

## 19/09/2026 (parte 19) — 🧮 Por que aparece perna-de-pau se o baralho tem 1.466 cartas

Pergunta do Diego: *"se eu tenho 1466 cartas, por que essas cartas todas não estão
preenchidas no baralho? Por que está aparecendo um monte de jogador fake?"*

Medido com o código de verdade (`npm run pernadepau` → `scripts/mede-perna-de-pau.mjs`,
que roda o `seedCpuSquads`, o mesmo que monta os times de fundo). **Não é que as
1.466 não são usadas — é que elas têm o FORMATO errado.**

### 1. O baralho não é uma pilha só: são CINCO, uma por posição
| posição | tem no baralho | a pirâmide precisa (80 times × 11) |
|---|---|---|
| GOL | 153 | 80 |
| LAT | **204** | **160** |
| ZAG | **202** | **160** |
| MEI | 413 | 240 |
| ATA | 494 | 240 |

Sobra atacante (494 pra 240) e quase não sobra lateral. Atacante que sobra **não
tapa buraco de lateral** — o sorteio é posição por posição.

### 2. E o pool ainda é cortado em QUATRO faixas de força (uma por divisão)
Cada faixa precisa, sozinha, de 20 GOL · 40 LAT · 40 ZAG · 60 MEI · 60 ATA:

| faixa | GOL | LAT | ZAG | MEI | ATA |
|---|---|---|---|---|---|
| A (mais forte) | 37 | **23** 🔴 | 41 | 121 | 145 |
| B | 42 | 44 | 64 | 95 | 122 |
| C | 30 | 57 | 47 | 115 | 118 |
| D | 44 | 80 | 50 | 82 | 109 |

A Série A tem **23 laterais pra 40 vagas** — e sobra lateral na D (80 pra 40). Hoje
a faixa A **não empresta** da B: inventa filler. São 17 fillers só por isso, com o
baralho INTEIRO disponível.

### 3. E as cartas do usuário e dos rivais saem do pool ANTES
| elencos em campo | cartas fora do pool | tapa-buraco na pirâmide |
|---|---|---|
| 20 × 11 | 220 | 46 |
| 20 × 15 | 300 | 70 |
| 20 × 20 | 400 | 100 |
| 20 × 27 (elenco cheio) | 540 | **182** |

### 🔧 Os dois consertos possíveis (decisão do Diego)
1. **Faixa empresta da vizinha** antes de inventar filler: falta lateral na A, pega
   o melhor lateral da B. Custa uma linha de código e derruba quase todo o
   tapa-buraco. Só vale pra carreira NOVA (elenco de bot já salvo não muda).
2. **Mais cartas de LAT/ZAG/GOL no baralho** — o conserto de raiz. Hoje o baralho
   tem 2,4 atacantes pra cada lateral.

⏳ **Não fiz nenhum dos dois ainda**: é mudança de regra de carreira, ele decide.

---

## 19/09/2026 (parte 18) — 🃏🚫 Jogador tapa-buraco fora de artilharia, garçons e Bola de Ouro

Ordem do Diego: *"tem um monte de jogador fake, Zé Ninguém, Trapalhão, ganhando a
bola de ouro… eles podem fazer gols ou assistência durante o jogo, não tem problema
nenhum. Mas não podem contar pra estatística de artilharia, assistência e bola de
ouro"*.

### A regra, em uma linha
**Tapa-buraco joga, marca e some.** O gol dele conta no PLACAR, sai na narração e
entra na ficha do time — ele só não aparece em NENHUMA classificação.

### Quem é tapa-buraco (são DOIS tipos, e valem os dois)
| tipo | como é | de onde vem |
|---|---|---|
| **filler de várzea** | `fil-…`, clube `Várzea` (no basquete, `Pickup`), nível 30–40, nome de zoeira | `filler()` em `pyramidseason.tsx` — fecha elenco de time de CPU |
| **incógnita** | `inc-…`, `fake: true`, nome e clube inventados | `makeIncognita()` em `data.ts` — quando o catálogo real de uma posição acaba |

Quem responde "é tapa-buraco?" é `src/escalacao/fake.ts`, um arquivo só — assim não
existe lista de ranking que peneirou com régua diferente.

### Onde a peneira entrou
- **Liga** (`simulatePyramid`): artilharia, garçons **e o artilheiro da divisão** —
  este último paga caixa pro clube e sobe o PISO do jogador, e filler não tem piso
  nem salário, então o prêmio ia pro ralo e ainda tirava o troféu de quem jogou.
- **Copa Legends** e **Copa do Brasil**: artilharia, garçons e o artilheiro da Copa.
- **Jogo rápido / sala online** (`simMatch`), inclusive a **cestinha do basquete**.
- **Bola de Ouro** (`melhorDoMundo`): peneira repetida de propósito — é o prêmio que
  ele viu indo pro Zé Ninguém, é o último lugar onde eu quero depender de quem chamou.
- **Porta do histórico** (`RECORD_SEASON_STATS`): peneira de novo, pra competição
  nova que nasça esquecendo de peneirar não furar o acumulado.

### 🧹 E o PASSADO é limpo
Trava nova só impede que entre MAIS. Ao abrir o save (`migrateTeamNames`), sai quem
já entrou: artilheiros e garçons de todos os tempos, e **o ano de Bola de Ouro
ganho por tapa-buraco some do quadro de campeões** — não dá pra recalcular quem
seria o certo (os números daquela temporada não ficam guardados), e some é melhor
do que mentir.

### 🛡️ O medo, e como ele foi medido
O risco desta mudança é o contrário dela: sumir com jogador DE VERDADE do Rank.
Varri o baralho inteiro (**1.466 cartas**): zero cartas reais com clube
Várzea/Pickup, zero com nome de filler e zero que batem nome de incógnita E clube de
incógnita ao mesmo tempo. **Nenhum falso positivo.** A varredura é parte da trava,
então ela reprova sozinha se um dia entrar no baralho um jogador que caia na regra.

**Trava: `npm run fake`** (5 seções: reconhecimento · zero falso positivo · Bola de
Ouro · limpeza do passado · gol e assistência peneirados igual).

🚫 **Não virou novidade da home**: é conserto, e a regra dele é *"menos bugs, que
nunca lance"*.

---

## 19/09/2026 (parte 17) — 🌑🐺 Mascote NOVA do Pesadelo Verde FC

Ordem dele, curta: *"troque o mascote do pesadelo verde por esse aqui"*. Saiu o
lobo uivando na pedra, entrou o **lobo de armadura** com capa esfarrapada, espada
fincada e o pé em cima da bola — mesma cena atrás (lua, fumaça verde, pinheiros),
que é a cara do clube e já era assim na arte antiga. **Só a mascote trocou**:
escudo e camisa continuam os de 18/09.

- 📏 **287×440 · 43,8 KB** (com o escudo de 29,0 KB dá **72,8 KB** dos 75 do teto).
  A largura mudou (era 312×440), então a proporção foi atualizada junto.
- ⚠️ **O corte mais perigoso até hoje, e por isso tem script próprio**
  (`scripts/recorta-pesadelo-mascote.py`): o clube é VERDE-NEON sobre fundo VERDE
  CHROMA. Medi antes de cortar — o critério de sempre (`g > 150 e muito acima de
  R/B`) apagava **20% do desenho**: a fumaça, o brilho da espada, as rachaduras da
  bola e os olhos do lobo. A saída foi mirar a **COR EXATA** do chroma
  (`(10,243,94)`, distância RGB < 60): a distância é bimodal (41,4% abaixo de 40 e
  só +1,9% entre 40 e 100), ou seja o fundo é um bloco isolado e a arte não encosta.
- ✂️ **A mascote estava GRUDADA na camisa** — a fumaça encosta no ombro dela e não
  existe coluna vazia entre as duas, então régua não separa e erosão não quebra a
  ponte. Quem separa é a CAMISA: maior ilha sem neon da direita, contorno
  preenchido e tirada do quadro.
- 🩹 **E isso deixava um RISCO RETO na nuvem** (pareceu tesourada na conferência).
  A borda nascida do corte agora recua numa **onda** de 8–38 px, só nos pixels de
  fumaça: nuvem tem borda irregular, reta não.

⏳ **O nome da mascote segue provisório** ("O Pesadelo") — as duas artes vieram sem
nome. Vale perguntar pro dono.

---

## 19/09/2026 (parte 16) — 📍 Futpoint FC de CARA NOVA (arte que o dono refez)

Ele mandou a prancha nova do **Futpoint FC** (gfpicolo13, **SÓCIO nº27** — não é
batismo, não tira o lugar de ninguém): escudo, mascote e camisa, tudo redesenhado.
Recorte, peso e cadastro feitos; **esperando o OK visual dele pra publicar**.

### ✅ O que ficou pronto (no branch)
- **Escudo novo** 228×360 · 17,7 KB (saiu o alfinete de mapa, entrou o brasão
  preto/dourado com o monograma FP em prata). **Mascote novo** 285×440 · 39,0 KB —
  **total 56,7 KB** dos 75 do teto.
- **Camisa nova na Loja** como `futpoint-camisa-v2.webp`: nome novo de propósito,
  porque `public/` tem endereço fixo e quem já abriu a Loja veria a velha pra
  sempre (a lição do Neymarzetti, 16/09).
- **Manto REMEDIDO na camisa nova**: preto `#0C0909` e dourado `#BE8F47` — ou seja,
  a arte nova **confirmou** a cor que o jogo já usa (`#181818`/`#B89040`, com o
  preto levantado de propósito pra listra fininha não virar buraco). O branco da
  faixa foi remedido pra `#EAE2E0` (era `#FFFFFF` chutado em 19/08).
- **`MANTO_CONTAS` ganhou a linha dele** (`gfpicolo13@gmail.com`), que faltava
  desde sempre: a chave lá é o E-MAIL e é ela que decora a tela do próprio dono.
  Por isso o `npm run batismos` cobrava "manto medido" no Futpoint — agora são
  **45 completos** (era 44).
- **Recorte virou script de todo mundo**: `scripts/recorta-prancha-chroma.py`
  (o do Marreco era só do Marreco). Prancha sobre fundo verde é o padrão agora.

### 🚫 Marca de terceiro que SAIU da arte
A mascote vinha com o **símbolo da Nike nas duas chuteiras**. É marca de outra
empresa e ia DENTRO do arquivo que todo jogador baixa (e que carimba o gol), então
saiu — `scripts/tira-marcas-futpoint.py`. Ficou a chuteira preta, o friso e as
travas douradas. Mesma régua do letreiro da bola de ouro (19/09).
⚠️ **Lição de método**: nessa reconstrução **não se põe grão**. Em pano claro o grão
salva; em couro PRETO o desvio que a conta estima vem dos vincos e do brilho, e as
duas janelas viraram dois retângulos chuviscados bem visíveis. Só a superfície fecha.

### ⏳ O que falta (perguntado pro Diego)
- **▶️ O botão de play na mão da mascote** é o do YouTube. Mandei as duas opções:
  como veio (vermelho) e **dourado com o play preto** (as cores do clube — vira uma
  plaquinha de ouro, que combina com dono de canal). **Ele escolhe.**
- **O nome do dono** pro rodapé do post ("CLUBE DE ___"): não invento nome de gente
  de verdade — está em branco até ele falar.
- 🗄️ **Banco**: `meuManto()` lê `esc_socios` ANTES do código. Se a linha do
  gfpicolo13 lá tiver outra cor, é ela que ele vê. Conferir junto das linhas do
  **Marreco FC** (`manto_c1`/`manto_c2`/`mascote_key`/`escudo_time`), que continuam
  pendentes porque a chamada do Supabase precisa da autorização dele.

---

## 19/09/2026 (parte 26) — 📝 LISTAR NÃO É ABANDONAR (o Garrincha e o Maradona voltam)

Ele juntou as peças depois de três relatos (Rei da Bola FC, Raiva Cajuri FC e o print do
Garrincha): *"o erro que eles estão reclamando não é apertar SAIR na renovação de
contrato — aí tudo bem. É que ele está LISTANDO o jogador, ainda em contrato. O jogador
é dele, pô. Ele pode pegar o jogador dele de volta se ninguém pegar e for pro monte.
Quando lista, ele pode até vender por mais; se ninguém comprar vai pro monte e aí sim
vale a metade. É diferente do caso de sair por contrato."*

### 🔎 A causa (e era antiga, não veio de hoje)
Ao consumir a lista de transferências, o reducer carimbava `semContrato` na carta
listada se o contrato dela já tivesse acabado. **Só que essa linha roda DEPOIS do
`s.seasonNo++` da virada.** Então o contrato que valia durante a temporada recém
encerrada já contava como vencido: quem listou o próprio jogador na janela levava o selo
de quem ABANDONOU, e o `semContrato` faz duas coisas ao mesmo tempo — limita o dinheiro
da venda **e** proíbe o ex-dono de recuperar a carta (no leilão e no monte).
Resultado: o dono listava, ninguém comprava, a carta caía no monte e ele não podia mais
pegá-la de volta. Foi o Garrincha e o Maradona.

### ✅ Conserto: um selo pra cada coisa
- **`semContrato`** = saiu por CONTRATO ENCERRADO (o dono apertou DEIXAR IR). Continua
  fazendo as duas coisas: teto de venda **e** proibição de recuperar. A regra dele não
  mudou uma vírgula.
- **`tetoOficial`** (novo) = só o TETO. É o que a listagem usa quando o contrato já tinha
  acabado, pra não virar atalho de quem deixou vencer — **mas o dono mantém o direito de
  recuperar a carta que ele mesmo pôs à venda**.
- Os dois selos morrem quando a carta entra num elenco.
- **Perdão único no save**: as cartas presas HOJE no leilão/monte com o selo errado e
  dono humano viram `tetoOficial` na abertura do save. O Garrincha e o Maradona voltam a
  poder ser recuperados. Carta de bot não muda.
  ⚠️ Efeito colateral aceito: quem REALMENTE apertou DEIXAR IR nesta virada também ganha
  o perdão nessas cartas específicas, uma vez só. Sem registro no save, não há como
  separar os dois casos no passado — e o erro foi nosso.
- Travas novas em `npm run monte`: carta listada é recuperável mesmo com teto; carta de
  contrato vencido segue barrada.

## 19/09/2026 (parte 25) — 🚨 A REMOÇÃO DO PONTUAL PRENDEU TODO MUNDO NA RODADA 0

Print do **Cr7 Leilão** minutos depois do deploy: T48, Série A, botão verde
**"▶️ Começar a temporada"** aceso, e o jogo não começava de jeito nenhum.

### ❌ O erro foi meu, e é o MESMO do monte, no mesmo dia
O `PLAY_ROUND` tinha um "cinto de segurança" de 07/08: **a rodada 0 não anda sem a
aposta do patrocinador pontual da temporada**. Eu tirei a TELA que fazia a aposta e
deixei o cinto lá. Sem tela, a aposta nunca existia → o reducer devolvia o estado
igual, calado → botão mudo, carreira parada. Valia pra TODO mundo em carreira solo,
não só pra quem virou temporada agora.

### ✅ Conserto
- O cinto saiu (o comentário no lugar conta a história, pra ninguém reintroduzir).
- **Trava nova** em `scripts/testa-loja.mjs`: rodada 0 → 1 sem aposta nenhuma, e
  também com resíduo de aposta velha no save.
- 🧠 **REGRA que vale pra sempre**: quando uma regra sai da TELA, tem que sair também
  do REDUCER. Duas regras decidindo a mesma coisa = botão que não faz nada. Hoje isso
  aconteceu duas vezes (monte e início de temporada).

## 19/09/2026 (parte 24) — 🚫🤝 O PATROCINADOR PONTUAL FOI REMOVIDO

Ordem dele: *"eu acho que eu vou tirar esse patrocinador pontual. Tá ficando muito
patrocinador, patrocinador, patrocinador, tá ficando chato. Tira esse patrocinador
pontual e a pessoa também não vai mais ganhar esse dinheiro. Hoje vai ter o
patrocinador master ali no início, aí logo depois vai pro próximo passo."*

### ✅ O que saiu
- O **passo do roteiro** da virada. A ordem agora é 🏆 Master → 👟 Fornecedor →
  🛍️ Camisas → 🕴️ Bico. A pílula "PASSO X DE N" conta sozinha, então o N caiu junto.
- A **trava de começar a temporada** não olha mais o pontual (só Master e crise).
- O **pagamento**, nos DOIS caminhos que existiam: o `CLOSE_SEASON_BOOKS` (temporada
  que fecha sem leilão) e o `OPEN_RESERVE_LIST`/`REAUCTION_ONLINE` (virada com leilão).
  Ninguém recebe mais nada da aposta, nem quem tinha aposta feita na temporada passada.
- O **recibo** "o patrocínio pagou", as telas de acompanhamento (`SponsorBetStatus` e
  `CareerSponsorOverview`) e a action `SET_SPONSOR_BET`.

### 🗄️ O que FICOU de propósito
- `careerSponsorBet` / `careerSponsorResult` continuam no save e nos tipos: apagar
  campo de save não desfaz nada e só arrisca quebrar quem está no meio da temporada.
  Ninguém escreve e ninguém lê.
- `sponsorBetRewards` e a tabela `SPONSOR_BET_PAY` seguem exportadas (as simulações de
  caixa `sim-caixa-120`/`sim-caixa-divisoes` ainda importam). Se ele mandar voltar, é
  religar o passo e os dois pontos de pagamento.
- O componente `SponsorBetBanner` continua em `estadio.tsx`, sem quem chame.

### 💰 Quanto some do caixa (por temporada, se batesse a meta)
Várzea 4/6/8 · D 8/12/16 · C 14/22/30 · B 24/40/56 · A 42/74/106 (nível 1/2/3).
Master, bilheteria, Loja, TV e bico não mudaram. Novidade na home avisando.
Reverter: `git revert` do commit desta parte.

## 19/09/2026 (parte 23) — 🐛🔒 TELA TRAVADA NO MONTE (Rei da Bola FC) — sem PEGAR e sem PASSAR

Relato dele: *"deu um erro no leilão do Rei da Bola FC. Quando foi pro monte, aparecia
um jogador pela metade pra ele pegar. Ele tentava pegar, pegar, pegar e não acontecia
nada — ficou travado na tela. Se aconteceu com ele, pode acontecer com outros."*

### 🔎 Eram DUAS regras diferentes decidindo a mesma coisa
1. **A tela** montava a lista com régua PRÓPRIA (`openSlots` + `monteLocked`).
   **O reducer** recusava por MAIS duas que a tela não conhecia: a anti-malandragem do
   **contrato vencido** (carta que saiu do seu clube não volta de graça pelo monte) e o
   **caixa**. Resultado: botão verde PEGAR que não fazia nada, sem dizer por quê.
2. **Pior**: com buraco no XI, o botão **PASSAR A VEZ some** se existir "alguma carta" —
   e essa conta só olhava o caixa. A carta travada contava como disponível, então ele
   ficava **sem PEGAR e sem PASSAR**: tela morta, exatamente o relato.

### ✅ Conserto
- **`monteBloqueio(state, m, c)`** no `store.tsx` é agora o ÚNICO juiz, e devolve o
  MOTIVO: `vaga` · `reservado` · `semcontrato` · `caixa` · `null`. O `montePickable`
  (que o reducer usa) virou uma linha em cima dele, então tela e regra não podem mais
  divergir.
- A tela esconde só `vaga` e `reservado` (nada de novidade pra quem olha). `caixa` e
  `semcontrato` **aparecem com o motivo e o caminho** — regra da casa pra toda trava:
  *"ele não volta de graça pro seu clube. Outro time pode levar — e um dia você
  recompra."*
- **PASSAR A VEZ fica liberado sempre que nenhuma carta for pegável DE VERDADE**,
  mesmo com buraco no XI. Ninguém mais fica preso.
- Trava nova: **`npm run monte`** (`scripts/testa-monte.mts`) — 11 checagens, incluindo
  a situação exata do Rei da Bola.
- Sem novidade na home (é conserto). Reverter: `git revert` desta parte.

## 19/09/2026 (parte 22) — 🚫🧍 PERNA-DE-PAU NÃO TEM ESTATÍSTICA (nem gol, nem assistência)

Ele mandou um print do jornal da T43 dele: **🥇 Zé Ninguém (Várzea · 2000) BOLA DE OURO**,
com 10 gols e 39 assistências, e a lista de garçons inteira tomada por Perna-de-pau,
Bola Murcha, Pé de Anjo e Meia-Boca. Palavras dele: *"jogadores fakes não quero que
tenha estatísticas pra eles, nem assistência e nem gols"*. É o "estado quebrado" nº 1
da casa: jogador de mentira premiado.

### 🔎 Por que acontecia
O peso por nível (`goalW`) só DIMINUÍA a chance do filler, não zerava. Nos times de
fundo da Várzea **todo mundo é filler** — então alguém de mentira tinha que marcar, e
com 38 rodadas ele acumulava mais que os craques das divisões de cima.

### ✅ Como ficou
- **`ehFake(c)`** (`store.tsx`), a régua única: `fake === true` **ou** clube de filler
  (`Várzea`/`Pickup` — o filler dos bots não carrega a flag, só o clube).
- **Gol e assistência na liga e na Copa** só sorteiam jogador de verdade. Time 100% de
  mentira faz o gol no PLACAR e **o gol fica sem dono na súmula** — nada trava.
- ⚠️ **O dado (rng) é consumido igual, com autor ou sem** — o minuto do gol passou pra
  antes da guarda de propósito. Sem isso, um gol sem autor desalinharia o sorteio e
  mudaria PLACAR de rodada já jogada (o passado é imutável, regra da casa).
- **Segunda tranca** no `RECORD_SEASON_STATS`: fake não entra no histórico de todos os
  tempos nem leva Bola de Ouro, mesmo que um caminho novo deixe passar.
- **Limpeza do passado na abertura do save**: os fakes somem de `careerScorersAll`,
  `careerAssistsAll` e `careerMelhorMundo`. O save dele perde o 🥇 Zé Ninguém sozinho,
  sem migração manual. **Cria da Base não é fake** — o guri é jogador de verdade do
  clube e mantém tudo o que fez.
- Sem novidade na home (é conserto, regra da casa). Reverter: `git revert` desta parte.

## 19/09/2026 (parte 21) — 🥇💰 A Bola de Ouro passa a PAGAR (20 🪙 + 10 de piso)

Ordem dele, junto com o pedido de mockup e vídeo: *"todo bola de ouro q o time tiver o
clube ganhará 20 moedas extras e a jogador passa a valorizar mais 10 de piso"*.

### ✅ A regra (no ar)
- Mora no `RECORD_SEASON_STATS` (`store.tsx`), **dentro do portão idempotente**
  (`statsSeason`), então nenhuma temporada paga duas vezes nem recarregando a tela.
- **20 🪙 pro CLUBE do premiado**, e só pra clube de gente (`teamId >= 0` = id do
  manager, a mesma régua do `teamKey`). Entra no caixa e escreve linha no extrato
  (`logFin` tipo `reward`) e no `marketLog`.
- **+10 de piso pro JOGADOR**, em campo próprio `careerBolaOuroPiso` (chave `ident` =
  `nome|clube`), somado DEPOIS do `max` dentro de `valorOficial`. Dois motivos pra não
  escrever no `marketValues`: o livro de preços é reescrito por toda venda/leilão (o
  bônus sumiria) e, com o `max`, um craque de tabela alta (fame 5 = 30) não sentiria
  o prêmio. Como está, vale em renovação, teto de venda, SAF e ficha.
- **Acumula**: 2 bolas = +20. E o piso sobe **mesmo quando o premiado é de bot** — a
  carta encarece pra todo mundo no leilão seguinte (só as moedas exigem dono humano).
- Os dois números moram em `BOLA_OURO_MOEDAS` / `BOLA_OURO_PISO`, lado a lado.
- Novidade na home. Reverter: `git revert` do commit desta parte.

### ⏳ O visual está ESPERANDO O OK DELE (mockup + vídeo entregues)
`node scripts/mockup-bola-ouro.mjs` desenha os três lugares onde o prêmio aparece, e
`node scripts/video-bola-ouro-reels.mjs` é o reels de ~27s explicando. O que ainda NÃO
foi codado, porque é visual novo e a regra da casa é esperar o OK:
1. a **faixa dourada do prêmio** na página da Bola de Ouro do jornal ("+20 🪙 pro clube
   · +10 de piso"),
2. o **selo 🥇 2× BOLA DE OURO** na ficha do jogador, com o valor mostrando `30 + 20 🥇`.
Hoje o jogador só vê o prêmio pelo **extrato** e pelo **mural de mercado**.

## 19/09/2026 (parte 20) — 🔓 A carreira nova saiu da prévia: PUBLICADA PRA TODOS

Ele olhou a aba Jogos no celular e fechou três coisas de uma vez:
1. *"Essa frase 'acompanhe sua divisão e os jogos etc' não precisa escrever."* → o
   subtítulo da liga saiu do palco (`CareerCompetitionStage`). O `CompetitionStage` só
   desenha o `<p>` quando tem texto, então **a Copa continua dizendo o formato da fase**
   (quantos confrontos · jogo único/ida e volta) — quem perdeu a linha foi só a liga.
2. *"Texto de pênalti não pode ter, porque quando é pênalti tem batida manual pra eu
   bater, lembra?"* → as 3 frases de pênalti saíram de `lances.ts` e foram **trocadas
   por outras 3** (o acervo continua com 80). Motivo, que vale pra qualquer frase nova:
   o pênalti tem TELA PRÓPRIA (mira + força); narrar "pênalti no canto" num gol de
   jogada normal seria contar uma história que não aconteceu.
3. *"Pode publicar p todos."* → a apresentação da carreira saiu da trava de conta.

### 🔓 Como ficou a liberação (e como reverter)
- `privateCareer` agora é `privatePreview || publicCareerVisual(state)`, e o placar
  (`grande`/`cinematic`) e as duas telas da Copa da carreira usam a MESMA chave:
  **`CAREER_VISUAL_RELEASED` em `career-feature-release.ts`**.
- 👉 **Reverter é UMA linha**: essa chave pra `false` devolve a carreira inteira ao
  visual antigo, **sem tocar no online** (que tem a chave dele, `ONLINE_VISUAL_RELEASED`).
- A casca da carreira (fundo de estádio, abas) já era pública desde antes — quem não
  era a conta dele via casca nova com miolo velho. Agora está coerente.
- Novidade na home (a do placar que conta o lance). O conserto do som não entra em
  novidade, que é regra da casa.

## 19/09/2026 (parte 19) — 🐛 O som AMBIENTE sumiu (só tocava o gol)

Ele: *"não sei por que não tá parecendo o som ambiente mais durante os jogos, só tô
ouvindo o do gol"*. Duas causas, as duas em `sound.ts`:
1. **O ambiente só era ligado UMA vez, ao abrir a tela do jogo.** Se naquele instante o
   som estava MUDO (é o padrão) ou ainda não liberado (o `setSoundAllowed(true)` do
   componente-pai roda DEPOIS do efeito da tela filha), `startCrowd` desistia — e
   ligar o 🔊 depois não tentava de novo. O gol funcionava porque é criado na hora.
   👉 Agora a tela só diz que QUER o ambiente (`crowdWanted`); ligar o 🔊 ou liberar o
   áudio acende a torcida sozinho. Desligar apaga sem esquecer; religou, volta.
2. **A Copa do Mundo abre DENTRO da carreira e as duas pedem o ambiente**; quando a
   Copa fechava, o `stopCrowd` dela matava a torcida da carreira, ainda aberta.
   👉 `crowdWanted` virou CONTADOR: cada tela soma 1 ao abrir, tira 1 ao fechar.
3. Bônus: AudioContext que nasce SUSPENSO (som já ligado de outra visita, tela abriu
   sem toque) agora acorda no primeiro toque em qualquer lugar (`acordaNoGesto`).
Sem novidade (é conserto). Reverter: `git revert` do commit desta parte.

E o header da prévia: o "TEMPORADA 28 · LIGA LEGENDS" ficou numa linha só, com 5px de
respiro antes da "Rodada N" (ele achou colado).

## 19/09/2026 (parte 18) — 🎙️ Placar GRANDE com o LANCE do gol (só na prévia do Diego)

Ele olhou a aba Elenco no celular: *"esse header (temporada, rodada, torcidômetro)
está muito grande — diminui um cadinho e aumenta a área do placar; ampliar as frases
também; e dar mais emoção ao placar"*. Mockup em `scripts/mockup-placar-emocao.mjs`
(3 colunas: antes · com faixa · sem faixa). Decisões dele no caminho:
- 🚫 **Faixa colorida de resultado (verde/vermelha/dourada): NÃO.** *"Não gostei."*
- 🚫 **Confete na vitória: NÃO.** (o confete do GOL, que já existia na cena dourada,
  ficou como estava — ele não falou dele.)
- ✅ **A emoção é o LANCE DO GOL**: *"driblou dois, chutou de fora da área, gol
  olímpico, tabelou, chutou cruzado, só colocou pra dentro na cara do gol… muitas e
  muitas frases, senão fica chato; alguns cômicos, tipo gol de barriga após um lindo
  cruzamento, mas sem exagerar no cômico"*.
- 🔒 **Só pra conta dele por enquanto** (*"code só pro meu usuário"*).

### ✅ O que subiu (tudo atrás de `useOnlinePreview()` = e-mails do Diego)
- **`src/escalacao/lances.ts`** (novo): 32 lances COM assistência (citam quem deu o
  passe) + 48 SEM (individual, bola parada, rebote), PT e EN com a mesma contagem.
  Sorteio determinístico por nome+minuto+rodada (a sala online lê o mesmo; o texto não
  troca a cada tique). Cômico ≈ 1 em 8, nunca humilhando o jogador real.
- **Placar (`OnlineScorePresentation` com `big`)**: no GOL o selo vira *"⚽ GOOOL!
  Petit 90+1′ — tabelou com Gerson e só empurrou"*; depois do flash a barra escura
  fica com *"⚽ 90+1′ Petit — <lance>"* até o próximo evento (antes voltava pra "bola
  rolando"). Apito final diz o RESULTADO na própria frase (4 variações × vitória/
  derrota/empate), escudo de quem ganhou brilha e o do outro apaga.
- **Tamanhos** (`.ll30-big` em `online-match-visual.css`): frase 17px em até 2 linhas ·
  escudo 92 · nome 18 · número 44 · goleadores 14 com ⚽.
- **Header compacto** (`privateCareer`): 176 → 118px; rodada e divisão na mesma linha;
  torcida numa linha com o histórico ("14º · 13º · 9º") ao lado.
- Bancada: `scripts/teste-placar-grande/` (`?cena=rolando|gol|fim&res=v|d|e`, print
  com `print.mjs`).

✅ **PUBLICADO PRA TODOS no mesmo dia** — ver a parte 20 logo abaixo.

## 19/09/2026 (parte 17) — 🔁 No rodízio entra o MAIS CHEIO (e o cria só sem reserva de verdade)

Ele perguntou como o preparador escolhe entre dois reservas, e ao saber que era "o
mais forte entre os inteiros" decidiu: *"Tem que pôr o cheio. Número 1. Somente o 2
se for jogador da base. Agora quando só tem a base no banco também vai ela mesma né."*

### ✅ Regra nova (`sugerirRodizio` em `condicao.ts` — vale pro botão E pro automático)
1. Entre os reservas da posição que estão inteiros, entra o de **mais gás**. Nível só
   desempata gás igual.
2. **Cria da Base** entra **só se não houver reserva de verdade inteiro** na posição
   (era excluído desde 13/09 — o titular jogava cansado). Um jogador de verdade
   inteiro sempre passa na frente do cria, mesmo o cria mais cheio.
3. O resto não mudou: sai o mais cansado primeiro, mesma vaga no campinho, reserva
   já 😓 não entra, suspenso/lesionado não entra.
- Trava: `npx tsx scripts/testa-condicao.mjs` seção 5 ganhou 4 checagens disso.
- Novidade na home. Reverter: `git revert` do commit desta parte.

## 19/09/2026 (parte 16) — 🐛 O botão 🤖 AUTOMÁTICO "sumiu" pro Rei da Bola FC

Ele avisou: o dono do Rei da Bola FC comprou o Seirulo (👑, o único com automático),
*"apertou, mas depois que apertou sumiu o botão"*.

### 🔎 O que acontecia
O interruptor do automático mora na caixa **😓 Quem está cansado**, em cima do campinho.
Essa caixa só existia (a) com alguém cansado ou (b) com o automático **LIGADO**. Então:
- De 13 a 15/09 o automático era de graça pra todo mundo, e a preferência
  (`condicaoAuto`) ficou gravada no save de quem ligou na época. Quem comprava o
  Lenda achava o botão **já verde (✔ ligado)**, tocava pra "ligar" e na verdade
  **desligava** → ninguém cansado → a caixa sumia → o botão junto. É a história dele.
- Sem preferência antiga o mesmo buraco existia: desligou de propósito, sem cansado,
  a caixa some e não tem como religar até alguém cansar.

### ✅ Conserto (commit desta parte)
- **Quem tem o direito (Lenda) vê a caixa SEMPRE**, ligado ou desligado. Desligado e
  sem cansado ela diz: *"Todo mundo inteiro (💪). 🤖 O automático está desligado —
  ligue e o preparador troca os cansados sozinho."*
- **Comprar preparador ZERA a preferência**: o automático nasce desligado, ninguém
  encontra botão verde sem ter apertado (regra dele: nada liga sem a pessoa mandar).
- No Departamento Técnico a linha do 🤖 agora diz o ESTADO (ligado/desligado) e ONDE
  fica o interruptor. Se o gás ainda não ligou na carreira (antes da Série C), diz que
  o automático liga junto com o gás.
- ⚠️ Continua igual: na **1ª temporada** não existe substituição (`canSub`), então nem
  RODIZIAR nem AUTOMÁTICO aparecem — o gás nem liga antes da Série C, então isso não
  chega a aparecer na prática.

Pro Rei da Bola: não precisa fazer nada — abrir a aba Elenco depois do deploy, a caixa
😓 estará lá com o botão 🤖 AUTOMÁTICO, é só tocar uma vez (fica verde ✔).

## 19/09/2026 (parte 15) — 🏋️ Renovar preparador = METADE do preço + o texto do gás que confundia

Duas cobranças dele no mesmo áudio, olhando a loja do preparador:

1. *"tá mt caro renovar contrato de preparador, principalmente o de mil… quero q seja
   metade todos eles, como se o valor desse é mil mas fosse 500 p cálculos de
   renovação… e serve p outros preparadores tb"*.
2. *"tá mt confuso esse negócio de joga 8 seguidas e senta 1… tá difícil entender pq o
   jogador q nem tem preparador cansa só dps de 50 partidas"*.

### ✅ 1. Renovação pela metade (`precoRenovacaoPreparador` em `preparadores.ts`)
- `RENOVAR_PREPARADOR` cobra `round(preco/2)`. Antes copiava o técnico e cobrava o
  preço cheio.
- 💰 **E logo depois ele baixou o catálogo**: *"coloque preço principal de 100, 300,
  500, 800"* (era 100/300/600/1000). Ficou: contratar **100 · 300 · 500 · 800** ·
  salário **10 · 30 · 50 · 80** · renovar **50 · 150 · 250 · 400**. Quem já tem o
  Paixão ou o Seirulo contratado não devolve nem paga nada — só o salário da
  próxima temporada já sai menor, porque é calculado do catálogo na hora.
- O botão RENOVAR mostra o valor novo e escreve "(metade do preço)"; o extrato e o
  aviso da renovação dizem o mesmo. Salário não mudou (10% do preço cheio).
- **Só o preparador.** O técnico continua renovando pelo valor dele — ele não pediu.
- Reverter: um commit só, `git revert`.

### ✅ 2. O texto "joga N seguidas e senta 1" tinha razão de confundir
Ele estava certo. Aquela frase era o **ritmo em que o tanque nunca desce** (banco
devolve +N ÷ 1,4 por jogo), não o ponto em que o cara cansa. E o jogador aguenta
**54 jogos seguidos** antes do 😓 **com ou sem** preparador — o preparador não mexe na
escada, mexe em quanto **uma rodada no banco devolve** (+4 sem ele; +6/+9/+12/+20 com).
Agora a tela diz exatamente isso:
- Loja: cabeçalho explica os 54 jogos e o +4 do banco sem preparador; cada card diz
  *"🔋 banco devolve +N de gás por rodada (sem preparador: +4)"* e *"1 rodada sentado
  paga X jogos de titular — descansando nesse ritmo, o gás nunca baixa"*.
- Departamento Técnico: a linha do preparador contratado ficou *"banco devolve +N…
  — 1 descanso paga X jogos"*.
- A conta mora em `jogosPorDescanso(banco)` (`preparadores.ts`), em vez de
  `Math.floor(banco/1.4)` espalhado.
- 🔁 **Segunda rodada de texto** (ele: *"tá confuso ainda… ng entendeu"*): saiu
  "gás/descanso/paga" e entrou **FÔLEGO**, uma linha só: *"🔋 1 rodada no banco =
  8 jogos de fôlego"* + *"sem preparador, 1 rodada no banco devolve o fôlego de só
  2 jogos"*. O cabeçalho da loja explica os 54 jogos e que o preparador só muda o
  quanto RECUPERA no banco. Se ainda confundir, o próximo passo é um desenho
  (barra de gás antes/depois do banco), não mais texto.

## 19/09/2026 (parte 14) — 🥇 A aba da Bola de Ouro no Rank (o que eu tinha ESQUECIDO)

Ele cobriu no ar: *"n tô vendo na área de rank a aba de bola de ouro e nem tô vendo
em aba de assistência o item de assistências de todos os tempos"*, e logo depois
*"já vi q garçons de todos tempos está na aba de artilheiro sendo q era p tá na de
garçom"*.

### ❌ Os dois erros eram meus
1. **A aba da Bola de Ouro no Rank eu simplesmente não fiz.** Desenhei ela no
   mockup, ele aprovou, e eu montei **só a página do jornal**. Lição: quando o
   mockup tem DUAS telas, a entrega tem duas telas — conferir o mockup item a item
   antes de dizer "publicado".
2. **O garçom de todos os tempos estava na aba de GOLS**, colado no irmão dele (o
   artilheiro de todos os tempos). Fazia sentido pra quem escreveu o código e
   nenhum pra quem usa.

### ✅ O que ficou
- **Aba nova 🥇 OURO** no Rank (5 abas agora: ⚽ Gols · 🅰️ Garçons · 🥇 Ouro ·
  🏟️ Local · 🌍 Global). Medido a 430px: **nenhuma aba corta o texto** — a lição do
  "Estatísticas" (cabe ≠ fica bom) virou medição antes de subir.
- ⚠️ **Troquei o ícone do ranking de clubes de 🥇 pra 🏟️**: com a aba nova, ficavam
  **duas medalhas iguais** lado a lado. Estádio diz melhor o que aquela aba é.
- **A caixa 🥇 BOLA DE OURO · TODOS OS TEMPOS**: o último a levar em destaque
  (preto/dourado) + a lista dos **DONOS**, com as temporadas como etiquetas
  (`T3 T5 T6 +9`) — a resposta da dúvida das mil temporadas.
- **O garçom de todos os tempos mudou pra aba de GARÇONS.**
- Trava: `npm run artilharia` seção 8 — reprova se a caixa de garçons voltar pra
  aba de gols ou se a aba de ouro sumir.

⏳ As duas listas **nascem vazias** e explicam isso na tela: o prêmio é entregue na
virada da temporada, então o primeiro nome só aparece depois que ele fechar a T27.
## 19/09/2026 (parte 9) — 🐛 As pílulas Comissão/Base jogavam pro fim da tela no celular

Diego, com três prints do celular: *"quando aperto nessas pílulas de comissão e base
tá me jogando pro final da tela e nem consigo subir mais"* — um vazio amarelo de mais
de uma tela embaixo da folha, e a rolagem presa.

**Causa:** `abrePainel` fazia `setPainel` e, no `requestAnimationFrame`, um
`scrollIntoView({ behavior: 'smooth' })` pro painel. Só que no mesmo instante a lista
de 27 linhas (~1400px) sai e o painel curto (~600px) entra: a página encolhe ~800px
NO MEIO da animação de rolagem, e o Chrome do celular se perde (para num ponto que
não existe mais, deixa um vazio e trava a rolagem). Na bancada de desktop não
reproduz; com emulação de celular também não — é coisa do Chrome Android real.

**Conserto:** saiu a animação. O painel entra onde a lista estava (logo abaixo das
pílulas); um `useLayoutEffect` só dá um empurrão SECO (`scrollBy` com `behavior:
'auto'`, depois do layout) se o topo do painel ficou fora da tela. Rolagem
instantânea depois do layout não tem como brigar com o encolhimento.
⚠️ Lição pra qualquer tela: **nunca rolar com `smooth` na mesma batida em que o
conteúdo muda de tamanho** — primeiro o React desenha, depois (se precisar) um
`scrollBy` seco. O atalho do cabeçalho (`ID_TITULARES`) continua suave porque lá a
página não muda de tamanho.

## 19/09/2026 (parte 13) — 🎬 ROTEIRO SEMPRE (pergunta fechada)

Eu tinha deixado uma pergunta aberta no mockup e no commit: o roteiro do fim de
temporada é obrigatório **sempre**, ou só na **primeira vez** (com um "ver tudo de
novo" depois)? Meu medo era a 20ª temporada cansar.

**Resposta dele: *"Roteiro sempre."*** Fechado, e virou regra permanente no
`CLAUDE.md`. **Não propor de novo** botão de pular, atalho pra decisão nem "só na
estreia". Nada a mudar no código — é exatamente como já subiu.

O que segura o risco do cansaço continua sendo o CUSTO do roteiro: um toque por
passo, nenhum passo pede pra pensar (só o último), e dá pra voltar. Se um dia ele
reclamar de ritmo, o lugar de mexer é aí — encurtar os passos —, nunca pular.

## 19/09/2026 (parte 12) — 🎬 ROTEIRO + 📰 JORNAL QUE VIRA PÁGINA + 🥇 BOLA DE OURO (FEITO)

Ele aprovou os mockups (*"pode seguir faça e publique já tb"*). O que entrou:

### 🎬 O roteiro do fim de temporada
4 passos, um por tela: **📰 jornal → 💰 caixa → 🌍 Copa do Mundo → 🔨 decisão**.
Barrinha de progresso em cima; dá pra VOLTAR num passo já feito, não dá pra pular
pra frente. O caixa deixou de ser uma linha fininha e virou quadro com o saldo em
número grande + os 5 maiores lançamentos. A Copa do Mundo saiu do topo (onde
competia com a decisão) e virou um passo discreto depois do jornal.
- ⚠️ **O buraco que eu tive que fechar**: passo a passo é lugar de PRENDER gente.
  Temporada sem lançamento nenhum não desenha o quadro do caixa → passo 2 ficaria
  sem botão → carreira travada. Agora tem aviso com saída, e o `npm run fim` reprova
  se qualquer passo ficar sem porta.
- 🌐 **O ONLINE não foi tocado** (lá é votação entre os técnicos da sala).
- 🧹 Os chips das fases saíram da aba JOGOS no fim; em TABELAS continuam.

### 📰 O jornal: as páginas já existiam — faltava AVISAR
🔑 **Achado**: `SeasonJornal` já tinha páginas (`capa`/`agencia`/`eventos`/`memoria`)
desde sempre. O convite eram **duas bolinhas de 8px e uma linha de 9px** — por isso
*"ninguém percebe"*. Agora tem as quatro pernas: **orelha** do papel no canto ·
**barra** dizendo pra qual página vai **e o que tem lá** · **"PÁG. X DE Y"** ·
**"NESTA EDIÇÃO"** na capa (e cada linha dela leva direto pra página).

### 🥇 A página da Bola de Ouro
Arte dele (com a marca apagada), o nome do melhor do mundo, a conta
`gols + assistências = total`, a frase que explica o prêmio, e os **top 5
artilheiros e top 5 garçons** do ano lado a lado — tudo por CARTA, com o clube
embaixo do nome. A página só existe quando houve Bola de Ouro na temporada.

### ⏳ O que ficou de fora (e por quê)
- **O compartilhar ainda manda a imagem inteira.** A pergunta "esta página ou o
  jornal todo?" é obra à parte (o canvas é outro código); não entrou agora.
- **A página 4 do mapa ("MERCADO")** não foi criada: o que ela teria já mora no
  Caderno do Empresário, que é uma página do jornal desde antes.
- **O flip automático da capa depois de 5s** continua como era. Ele existia
  justamente porque ninguém achava a página 2 — agora que a capa ANUNCIA as
  páginas, talvez ele só atrapalhe quem está lendo a manchete. Candidato a sair;
  não mexi porque ninguém pediu.

## 19/09/2026 (parte 11) — 🎬 O FIM DE TEMPORADA VIRA UM ROTEIRO

Ideia dele, com o print da tela na mão: *"e se fizéssemos de uma forma q tivesse q
ter o passo a passo obrigado e c isso teria q ler.. pq hj aparece essas coisas aqui
misturadas embaixo tb q n estão legais… A copa do mundo quero algo sutil msm mas
após o jornal, seria algo novo, tudo novo pra essa tela"*.

### 📋 O diagnóstico (conferido no print dele)
Seis coisas empilhadas na MESMA rolagem: aviso das Tabelas · cadeado da Copa do
Mundo · fechamento do caixa · a decisão da próxima temporada · os chips das fases ·
sair e salvar. **O que mais importa (a decisão) divide espaço com o que menos
importa agora** — um cadeado que só abre daqui a 74 temporadas. E o fechamento do
caixa, que é a melhor parte de ver, virou uma linha fininha que ninguém abre.
👉 Ninguém lê porque **está tudo com o mesmo peso**, não por falta de vontade.

### 🎯 A proposta (`npm run roteiro`)
Um passo por tela, na ordem que a cabeça pede, com barrinha de progresso em cima:
| passo | o quê |
|---|---|
| 1 📰 **JORNAL** | a notícia. A capa já anuncia as 4 páginas; a orelha chama a próxima; a Bola de Ouro mora aqui |
| 2 💰 **CAIXA** | o fechamento ganha a tela e um NÚMERO GRANDE (+50 🪙), com os lançamentos embaixo |
| 3 🌍 **MUNDO** | a Copa do Mundo **discreta**, como ele pediu: aparece uma vez, mostra "faltam 74", sai de cena |
| 4 🔨 **PRÓXIMA** | a decisão SOZINHA na tela — a única hora em que ele precisa pensar |

### ⚡ O risco, e o que fiz pra segurar
A regra de ouro dele é *"nada pode atrasar o ritmo do jogo"*, e passo a passo
obrigatório pode virar pedágio. Por isso: cada passo é **um toque**, nenhum pede pra
pensar (só o último), o jornal tem **"pular pro fim"**, e os 4 toques levam ~3s.
- ⏳ **PERGUNTA ABERTA PRA ELE**: obrigatório **sempre**, ou só na **primeira vez**
  (e depois um "ver tudo de novo")? Minha dúvida é a 20ª temporada cansar.

⏳ Esperando o OK. Nada no código.

## 19/09/2026 (parte 10) — 📰 O MARTELO VIRA JORNAL DE VÁRIAS PÁGINAS

Ele viu o mockup da página 2 e pegou o buraco de cara: *"agora q eu vi q já dava p
passar a página do jornal... Porém ng percebe... Tem q ter alguma dobra sei lá..
Algo q de vontade de virar a página… Outras páginas na verdade q são mais de duas"*.

### 🔑 O problema não é CABER, é AVISAR
O jornal já cresce pra baixo. O que falta é o papel **dizer** que tem mais. Num
jornal de verdade isso se resolve com **três coisas**, e o mockup
(`npm run jornalpags`) propõe as três:

1. **A ORELHA** — o canto do papel levantado no fim da página, com a de baixo
   espiando. É o sinal mais antigo que existe de "tem mais", e dá vontade de puxar.
   Tocar nela vira a página.
2. **A BARRA QUE DIZ O QUE TEM LÁ** — "próxima página" não convence ninguém; o que
   convence é *"🥇 Os prêmios do ano — quem levou a Bola de Ouro, e não foi o
   artilheiro"*. Fica grudada no fim de cada página.
3. **A CHAMADA DE CAPA ("nesta edição")** — logo abaixo da manchete. É ela que faz a
   pessoa saber que existem 4 páginas **antes mesmo de rolar**.
4. (+ o **número da página** sempre à vista, com bolinhas: some a dúvida de
   "acabou ou não?")

### 🗺️ Mapa proposto (4 páginas)
| pág | assunto |
|---|---|
| 1 | **CAPA** — a manchete e os teus números (fica LEVE de novo; hoje ela carrega tudo) |
| 2 | **PRÊMIOS** — Bola de Ouro · artilharia · garçons |
| 3 | **DONOS** — campeões de A, B, C, D, Copa, Supercopa e Mundial |
| 4 | **MERCADO** — a agência, quem valorizou, quem despencou |

### 🤔 E o compartilhar (pergunta que o multipágina cria)
Numa IMAGEM ninguém vira página. Proposta: o botão passa a perguntar **"esta
página"** (curta, boa pro grupo) ou **"o jornal inteiro"** (as 4 emendadas, com as
dobras desenhadas). O palpite é que a maioria mande só a página.

⏳ Esperando o OK dele. Nada no código — os três mockups do dia (página 2, páginas,
e o da Bola de Ouro) são só desenho.

## 19/09/2026 (parte 9) — 📰 A SEGUNDA PÁGINA DE O MARTELO

Ideia dele: *"acho q vc deveria prolongar o jornal p baixo… como se fosse uma
segunda página, mas embaixo, com mesmo estilo e arte, pra poder caber mais coisas"*.

### ✅ E dá, sem obra grande
O jornal **já cresce pra baixo**: o canvas é desenhado num buffer alto e depois
**cortado na altura que o conteúdo usou** (`const H = Math.min(MAXH, Math.round(y))`
em `jornal.tsx`). O que existe é um **teto**: `MAXH = 2520` no jornal de temporada
(2600 no de elenco). "Segunda página" = **subir o teto e desenhar mais blocos**.
A página 1 não precisa ser tocada.

### O que o mockup propõe pra página 2 (`npm run jornal2`)
1. **A dobra** — filete duplo + "CONTINUA NA PÁGINA 2", e o masthead menor repetido
   ("PÁGINA 2 · OS PRÊMIOS DO ANO"). É o que faz parecer jornal, e não rolagem.
2. **🥇 A BOLA DE OURO** — a arte dele em cima, o nome do melhor do mundo por cima
   do degradê, e a conta `24 GOLS + 13 ASSIST. = 37` embaixo, com a linha
   *"Não foi o artilheiro do ano, nem quem mais deu passes. Foi o único que fez as
   duas coisas."*
3. **🏆 Artilharia do ano** e **🅰️ Os garçons do ano**, lado a lado, top 5 de cada,
   com o clube da carta embaixo do nome (a identidade que virou regra hoje).
4. **🥇 A galeria das bolas de ouro** — os donos, com as temporadas como etiquetas.
   É a mesma solução da dúvida das mil temporadas: lista DONOS, não anos.

📏 A página 2 mede **~1900px** de altura em 1080 de largura, então o jornal inteiro
passaria de ~2500 pra ~4400px. **O teto (`MAXH`) precisa subir junto** — se ficar em
2520, a página 2 é desenhada e cortada fora, e ninguém entende por quê.

⏳ Esperando o OK visual dele. Nada no código ainda.

## 19/09/2026 (parte 8) — 🥇 BOLA DE OURO (melhor do mundo do ano)

### A regra
Ideia dele: *"o jogador que teve mais gols COM assistência junto… será considerado
o melhor do mundo no ano… NÃO é o artilheiro e também NÃO é o garçom, é o cara que
conseguiu unir os dois"*. Depois batizou: **Bola de Ouro**, por temporada, *"não
importa se o cara ganhar vários anos seguidos"*, e *"começa a contar a partir de
agora"*.

**Motor FEITO e testado** (`npm run melhor`): gols + assistências somados · liga +
todas as copas · o mundo inteiro (5 divisões, humano, rival e bot) · **por CARTA** ·
desempate fixo (total → mais gols → divisão mais alta → alfabético), **sem sorteio**,
porque no online cada aparelho calcula no próprio celular e dois amigos não podem ver
campeões diferentes. Guardado em `careerMelhorMundo`, por temporada, ~100 bytes/ano.
**Não mexe em dinheiro** — é honraria (ele disse "não" a prêmio de garçom, então não
inventei caixa nova).

### 🧩 A dúvida dele: "e se o cara tem mil temporadas?"
*"Não sei como seria o mockup disso… não sei como apareceria uma por uma"*.
👉 **Resposta: a lista não mostra TEMPORADAS, mostra DONOS.** Quem ganhou 12 bolas
ocupa **uma** linha, com as temporadas dele como etiquetas (`T3 T5 T6 T9 +8`). Mil
temporadas cabem numa tabela de 20 linhas, porque os ganhadores são muito menos que
os anos. Mockup mandado.

### ⚠️ A ARTE VEIO COM MARCA DE TERCEIRO
A imagem que ele mandou tinha **"FIFA BALLON D'OR"** escrito na bola. Não pode entrar
num jogo no ar. **Apaguei só o escrito**: o painel do pentágono foi RECONSTRUÍDO —
superfície quadrática ajustada nos pixels limpos do próprio painel + grão do mesmo
desvio, com a borda desvanecida dentro da margem que já era limpa. Sem letra, sem
fantasma, sem emenda. O resto da arte é exatamente a dele.
📦 `src/escalacao/img/jornal-bola-ouro-v1.webp` · 1080×608 · **57 KB** (a chuteira do
artilheiro tem 56 KB).
⚠️ Lição pra qualquer arte que chegar pronta: **procurar marca escrita antes de usar**.

### ⏳ O QUE FALTA (esperando o OK visual dele)
1. O bloco no **jornal** (Os donos da temporada, no topo).
2. A seção **🥇 BOLA DE OURO · TODOS OS TEMPOS** no Rank, por donos.
Nada disso está no código ainda — só a arte e o motor.

## 19/09/2026 (parte 7) — 🅰️ Assistência anda junto com gol · 🕳️ o "—" na ficha

### 📏 REGRA PERMANENTE NOVA (19/09): gol e assistência andam JUNTOS
Palavras dele: *"todos dados q tá fazendo de gols sempre serve p assistência tb
hein"*. Vale daqui pra frente, sem precisar pedir caso a caso. Já está gravado no
`CLAUDE.md`. O `npm run artilharia` tem uma seção só pra isso — inclusive
conferindo que os dois são ZERADOS nos mesmos lugares, pra nenhum reinício de
carreira esquecer um deles.

**Feito hoje**: `careerAssistsAll` (não existia — assistência nunca teve histórico
em canto nenhum), pela mesma chave (a carta), nas mesmas competições (liga +
Copa do Brasil + Copa Legends + Supercopa), com o mesmo teto de 2500, e a caixa
🅰️ GARÇONS · TODOS OS TEMPOS no Rank, do lado da artilharia.
⚠️ Ela **nasce vazia pra todo mundo** — não há passado pra trazer, e inventar não
é opção.

### 🕳️ A ficha: o "—" (o que ele estranhou)
Dúvida dele: *"pra quem chega hoje e vê gols iguais na temporada e no total…
porém jogos ele vê poucos da temporada e 300 total. Tá estranho. Não sei o que
fazer"*.

🔑 **A chave que faltava, e que eu só achei agora**: **o 337 jogos TAMBÉM é
parcial**. Jogos só começaram a ser gravados em **13/09** (vieram com o gás); gol
e assistência, em **19/09**. Não são "um certo e um errado" — são **dois números
com datas de nascimento diferentes**, e é isso que faz a coluna parecer torta.

**O que ficou** (a opção B do mockup, que eu tinha recomendado): enquanto a
carreira não tem passado de gol, a coluna dourada mostra **`—`** em GOLS e ASS,
com a linha `⚽ 🅰️ COMEÇAM A CONTAR NA PRÓXIMA TEMPORADA` embaixo. JOGOS continua
à mostra. Assim ninguém compara "337 jogos × 10 gols", e o jogo **assume que não
sabe** em vez de mostrar um número que parece defeito.

🔁 **Some sozinho**: a marca é "tem carry mas nenhuma carta com `gl` gravado", o
que só acontece em carreira anterior a hoje. Depois da 1ª virada toda carta tem
`gl` (mesmo que 0) e o `—` vira número, sem ninguém mexer. Carreira nova nunca vê
o aviso.

⏳ **Falta o OK visual dele** — está no branch, não publicado. Trocar pro aviso da
opção A (mostrar o número com uma notinha) é uma linha.

## 19/09/2026 (parte 6) — 🏆 A artilharia de todos os tempos virou POR CARTA

Veio do 337 jogos × 10 gols do Álvarez. Ele perguntou *"não seria melhor você
conferir os gols que o cara já fez, pelo usuário? Não dá?"* — fui procurar no
save e **achei um histórico que ninguém estava usando direito**.

### 🔎 O que eu achei
`careerScorersAll` (o Rank › Artilheiros) soma os gols de todo mundo desde a 1ª
temporada. O save da carreira T25 dele tem **1000 jogadores guardados, com 24
temporadas somadas**. Só que com **três defeitos**:

1. **A chave era o NOME.** O reducer até previa `nome|cardId`, mas quem despacha
   nunca mandou `cardId` — então caía no nome sempre, e dois jogadores diferentes
   com o mesmo nome somavam num registro só. Medido no baralho inteiro:
   **1466 cartas · 1403 nomes · 62 nomes repetidos em 125 cartas**.
2. **Só contava LIGA.** Copa do Brasil, Copa Legends e Supercopa ficavam de fora.
3. **Teto de 1000**, e o save dele estava EXATAMENTE em 1000 — lotado. Quem caía
   abaixo do 1000º perdia o histórico.

### ✅ O que ficou (decisões dele, 19/09)
- **Chave = a CARTA** (`nome|clube|ano`), a mesma identidade do `condicaoCarry`.
  **Não é o `cardId`**: o leilão dá id novo pra mesma pessoa todo ano.
- **O passado embolado foi DIVIDIDO**, não zerado — palavras dele: *"pros 62
  divida entre eles"*. Partes iguais, sobra pras primeiras em ordem fixa de
  clube+ano. **O total é preservado**, e é uma repartição DECLARADA, não um
  palpite sobre quem fez o gol.
- **Liga + TODAS as copas** contam. A Supercopa precisou de trabalho à parte: ela
  é calculada FORA da Copa do Brasil (`computeSupercopa`) e entra na chave só
  como uma fase a mais, então os gols dela não estavam em lugar nenhum.
- **Teto 1000 → 2500**: o baralho tem 1466 cartas, então ninguém mais é
  descartado.
- **Na tela**: o clube da carta aparece miúdo embaixo do nome. Escolha dele
  (*"sobre os gols quero que seja pelo clube da carta apenas"*), depois de eu
  medir que a letra (M)/(E) que ele tinha sugerido **não fecha**: em 6 dos 62 os
  dois xarás são do MESMO baralho (Marcelo Lomba Internacional × Bahia, Felipe,
  Diego, Reinaldo, Paulinho, Andreas Pereira) e levariam a mesma letra.
- ⚠️ **ASSISTÊNCIA continua sem histórico nenhum** — não existe `careerAssistsAll`
  em lugar nenhum do código. Se ele pedir, é obra nova.

### 🛡️ Travas: `npm run artilharia` (novo)
Roda o código DE VERDADE no navegador (não uma cópia da regra): a chave é a
carta · a divisão preserva o total · é **determinística** (dois aparelhos migram
igual — senão no online viraria briga de números) · é **idempotente** (abrir o
save 10 vezes não pica o histórico em migalhas) · cria da base fica pelo nome ·
e liga + Copa Legends + Copa do Brasil + Supercopa estão ligadas.

### 📌 O QUE ISSO **NÃO** RESOLVE (e ele já sabe)
Esse histórico é **gol em QUALQUER clube**, não "no seu clube". Então **não serve
pra ficha do jogador** — ele foi claro: *"quero apenas esse modal preto… apenas
dados do jogador do meu clube"*. A coluna dourada continua sendo só do clube dele,
e continua começando do zero nesta temporada.
- ⏳ **PENDENTE, esperando ele**: na ficha, **A** (notinha "contando desde esta
  temporada") ou **B** (tracinho "—" no lugar do número). Mockup já mandado.
## 19/09/2026 (parte 7) — 🧾 A ficha "NO SEU CLUBE": jogos passam a contar junto com os gols

Diego, olhando a ficha preta do Álvarez: *"300 partidas com 10 gols apenas, tá
estranho… se coloco os totais também contando no mesmo dia do gol?"*. Tinha razão: os
JOGOS vinham sendo guardados no `condicaoCarry` desde a condição física (12/09), e
gol/assistência só desde hoje de manhã — a ficha somava os dois como se fossem do
mesmo período.

**Regra (a proposta dele):** a história no clube começa no dia em que o gol passou
a contar. Carry ainda sem `gl` → os jogos de trás ficam de fora; jogos, gols e
assistências nascem juntos, da mesma temporada. Vive em DOIS lugares com a mesma
linha: `guardaCansaco` (store.tsx, a virada) e `condInicio` (pyramidseason.tsx, a
tela). O gás (`g`) continua vindo de trás — ele é de agora, não é histórico.
⚠️ Quem virou temporada entre o deploy da manhã (ficha nova) e este, já tem `gl` no
carry e ficou com os jogos velhos somados — não dá pra separar depois; é um punhado de
saves, e o número só cresce dali pra frente com os três juntos.

## 19/09/2026 (parte 6) — 🌐 Copa do Mundo: jogo único, relógios +10s, e o portão grande (em andamento)

Pedido do Diego, num áudio só: *"a Copa do Mundo o mata-mata tem que ser um jogo
único, porque Copa do Mundo é único, e isso serve também pra carreira… tá tendo
oitavas de final? acho que vi quartas apenas… quero que aumente mais 10s pra cada
um escolher seu país… e a convocação também mais dez segundos… esse quadrinho da
Copa pra escolher o país está MUITO pequeno… tem que ser parecido com o modelo da
Copa dos 8 e da Libertadores: acabou a liga, já aparece grande o banner da Copa, a
tabela da liga vai pra baixo, e embaixo maior a escolha dos países, e depois segue
pra convocação"*.

### ✅ 1. Mata-mata em JOGO ÚNICO (online e carreira)
`mkTie` em `simulaCopaMundo` jogava ida e volta com agregado. Agora é uma partida
(`g1`/`ev1`), empate = pênaltis. Como é o MESMO motor da carreira, vale nos dois.
Os passos mudaram de 12 pra 10 (5 rodadas · sorteio 6 · quartas 7 · semi 8 ·
final 9 · cerimônia 10) e agora moram num lugar só, `src/escalacao/copa-passos.ts`
— antes a tela, o `copa-stats` e o relógio da sala escreviam "8", "10", "11", "12"
na mão, cada um no seu canto.
- ⚠️ **O BANCO TEM CÓPIA**: a função `esc_copa_preview_clock` (o relógio
  sincronizado da sala) tinha `r.step<12` e "roda bola em 7–11". Virou `<10` e
  "7–9" — `docs/sql/online-copa-clock-jogo-unico.sql`. Foi aplicada via MCP
  (se a aprovação não passou, rodar o arquivo no SQL Editor; sem ela a Copa
  continua funcionando, só que o relógio marca "bola rolando" na cerimônia por
  14s à toa).
- `npm run copa` (o guarda "todo mundo vê a mesma Copa") continua verde.
- 🎲 **A mesma semente dá outro resultado a partir das quartas** (o `rng` andava
  mais com a volta). Copa encerrada não muda (campeão gravado). Sala no MEIO do
  mata-mata na hora do deploy: todo aparelho recalcula igual — ninguém racha.
- `placaresDoConfronto` (o agregado do bug do Gabriel, 15/08) saiu: sem volta não
  tem coluna pra somar errado.

### ✅ 2. Relógios da Copa online: bandeira 65 → 75s · convocação 80 → 90s
Constantes em `copa-mundo-online.tsx` (histórico no comentário: 45 → 65 → 75 e
65 → 135 → 80 → 90). O banner entre as duas continua 15s.

### ✅ 3b. OITAVAS — feito ("Ok ok ok", 19/09): 6 grupos de 4 + 4 melhores 3ºs = 16
`NUM_GROUPS 6 · GROUP_SIZE 4 · RODADAS_GRUPO 3`, `PASSO_COPA` ganhou `OITAVAS` (9
passos: 3 rodadas · sorteio 4 · oitavas 5 · quartas 6 · semi 7 · final 8 · fim 9),
`melhoresTerceiros()` (mesma régua da tabela: pontos → vitórias → saldo → gols;
empate total = letra do grupo), sorteio das oitavas sem reencontro de grupo (até 40
tentativas semeadas), prêmio da carreira ganhou o degrau **oitavas = 20**, e a CÓPIA do
banco (`docs/sql/online-copa-clock-oitavas.sql`, `r.step<9`, bola em 1–3 e 5–8) —
aplicada via MCP (se a aprovação não passou, rodar no SQL Editor).
Tela: 🟩 verde nos 2 primeiros · 🟨 amarelo no 3º **só enquanto está entre os 4
melhores** (recalculado a cada rodada apitada — a rodada rolando não entra, zero
spoiler) · quadro **OS MELHORES TERCEIROS** com os seis lado a lado · legenda com a
régua de desempate. `npm run copa` verde. Bancada: `scripts/teste-copa-grupos/`
(`?passo=3` grupos fechados · `4` sorteio · `5` oitavas).
⚠️ O que ele perguntou e eu respondi: a régua de desempate é **pontos → vitórias →
saldo → gols marcados** (ele achava "vitórias → gols → saldo"); trocar gols ↔ saldo é
uma linha em `groupTable`/`melhoresTerceiros` se ele quiser.

### ✅ 3c. Tabela em colunas + VOCÊ em roxo (19/09, "faça tudo") — no ar
Depois das oitavas ele pegou dois problemas: *"tá faltando organizar melhor os pts,
vitória e saldo"* e *"a cor amarela é a mesma do usuário selecionado?"* — era. Agora:
cabeçalho **# · SELEÇÃO · PTS · V · SG · GP** com colunas fixas (`cabecalhoTabela` /
`linhaTabela` no `CupScreen`), e a cor da linha é SÓ a zona (verde/amarelo); o
usuário é contorno **roxo #7C3AED + selo "VOCÊ"** (mesma linguagem do "SEU JOGO").
⚠️ Selo em `<em>`, não `<span>`: o CSS `.ll26-world-group>div span span{display:block}`
vira qualquer span interno em bloco e esticava o selo.

### ❓ 3. Oitavas: NÃO EXISTIAM — e ele viu certo (histórico)
Formato de hoje: 4 grupos de 6, passam 2 = **8 seleções → quartas direto**. Se
ele quiser oitavas, o formato natural de 24 seleções é o da **Copa de 86/90/94**:
6 grupos de 4 (3 rodadas), passam os 2 primeiros + os 4 melhores 3ºs = 16 →
oitavas → quartas → semi → final. Muda `NUM_GROUPS/GROUP_SIZE/RODADAS_GRUPO`,
`copa-passos.ts` (12 passos de novo: 3 rodadas · sorteio · oitavas · quartas ·
semi · final · fim), a régua dos melhores 3ºs, o prêmio da carreira (oitavas =
degrau novo) e a CÓPIA no banco. **Decisão dele — não fazer sem OK.**

### ✅ 4. O portão grande da Copa no fim da liga — APROVADO ("Ok correto", 19/09) e no ar
Feito (não está na main): `PortaoDaCopa` em `copa-mundo-online.tsx` (o desenho, sem
banco), `GradeDeSelecoes` (escudo 56px, 2/3 colunas, sem rolagem, CONFIRMAR grudado no
pé), CSS `ll27-*` em `online-match-visual.css`, e em `screens.tsx` o portão subiu pra
CIMA da liga com a liga recolhida (`mundoEsperando`). Bancada:
`scripts/teste-copa-portao/` (`?fase=inicio|bandeira|espera|banner|convocacao|torneio`);
mockup: `scripts/mockup-portao-copa.mjs`. **Aprovado e na main em 19/09.** Junto foi a 🟩 faixa verde dos 2 primeiros de cada grupo (era um branco a 6%, invisível — igual no online e na carreira). O formato 6 grupos de 4 → oitavas ficou pra ele confirmar à parte (muda o motor).

Como era o pedido:
Hoje o fim da liga com Copa do Mundo mostra a tabela da liga PRIMEIRO e o portão
da Copa depois, como uma caixinha; a escolha de país só fica grande pra quem está
na vez (modal), e os quadrinhos são pequenos (2 colunas, 320px de altura com
rolagem). O pedido: igual à Copa dos 8/Libertadores (`CompetitionStage` no TOPO com
a arte do mundial, liga recolhida em `<details>` embaixo), e a escolha de país
grande, inline, sob o banner; depois a convocação. Regra #2: mockup e OK antes de
subir.


## 19/09/2026 (parte 5) — ⏱️ +1s por rodada · 📣 a regra do apito · 🏟️ o SOM fechado

### ⏱️ A simulação da partida ficou 1 segundo mais longa (FEITO, no branch)
Ordem dele: *"aumente em mais 1s a simulação de uma partida tanto no modo off-line
qlqr ou modo online qlqr Tb"*. Medido pelo `npm run ritmo` (novo):

| modo | antes | agora |
|---|---|---|
| carreira no manual | 9,0s | **10,0s** |
| carreira no auto | 10,0s | **11,0s** (o +1s do auto, de 13/09, continua por cima) |
| rápido / online | 4,7s | **5,7s** |
| basquete | 2,2s | **3,2s** |

Temporada online inteira: 180s → **218s**.

⚠️ **Onde o segundo mora** (pra ninguém somar de novo depois): `ROUND_EXTRA_MS`
em `screens.tsx`, somado no `ROUND_MS` e no `baseRoundMs` do basquete — **nunca**
no `SEASON_TOTAL_MS`, que é o orçamento da temporada E divide os 82 jogos do
basquete. Na carreira é o `ROUND_MS` próprio do `pyramidseason.tsx`. O teste
`npm run ritmo` reprova se aparecer um segundo `ROUND_MS` em qualquer um dos dois.

### 🔔 O APITO tem REGRA agora (FEITO, no branch)
Isto virou pergunta dele, e a pergunta foi boa: *"não entendi sobre o apito.. vai
ter em uma partida só ou no início de todas as partidas?"*. Eu tinha lido o
*"apito coloque só no início do jogo p N ficar repetitivo"* como **um por
temporada**, e ele quis o meio-termo. Escolha dele: *"isso número 3.. qd for copa
e sempre a primeira partida tb né.. e qlqr copa nova ou liga.. e vale tb pro modo
online qlqr modo tb"*.

**A regra, em três linhas:**
1. A **primeira partida de qualquer competição** apita — liga nova, copa nova.
2. **Toda partida de COPA** apita — mata-mata é jogo grande, sempre.
3. Da **2ª rodada de liga** em diante, silêncio — era isso que ficava repetitivo
   (38 apitos por temporada).

Mora num lugar só: **`useApitoDeLargada`** (em `pyramidseason.tsx`, ao lado do
`LiveScoreCard`). As 6 telas de partida chamam esse gancho e nenhuma apita por
fora — o `npm run som` reprova `playWhistle()` solto:

| tela | competição | apita |
|---|---|---|
| liga da carreira | `liga-carreira-<temporada>` | só na largada |
| Copa da carreira (Brasil/Legends/Supercopa) | `copa-carreira` | **toda partida** |
| liga do rápido/online | `liga-<temporada>` | só na largada |
| Copa dos 8 / NBA Cup / playoffs | `copa-rapida` | **toda partida** |
| Libertadores | `libertadores` | **toda partida** |
| Copa do Mundo | `copa-mundo` | **toda partida** |

⚠️ **Por que o gancho tem DUAS chaves** (competição + partida): sem a competição, a
temporada nº 2 não apitaria (a rodada volta a ser 1, que o gancho já teria visto);
sem a partida, a copa não apitaria a cada jogo. São perguntas diferentes, e juntar
as duas numa chave só quebra uma das pontas.

🏟️ **DE QUEBRA: a Copa do Mundo estava MUDA e ninguém tinha notado.** Ela tem tela
própria (`copa-mundo.tsx`), não é a da liga — então o som de 18/09 passou por fora
dela. Ganhou ambiente + apito agora. O `npm run som` passou a varrer as telas pelo
`LiveScoreCard`, pra nenhuma outra ficar de fora de novo.

### 🔊 O SOM DA PARTIDA ESTÁ FECHADO (FEITO, no branch)
Palavras dele: *"quero só os áudios que eu mandei, do ambiente, gol, e o apito que
você já tinha mesmo"*. Isso respondeu de uma vez as três perguntas que estavam
abertas. A lista do som de partida é **FECHADA em três**:

| o quê | de onde vem | peso |
|---|---|---|
| 🏟️ ambiente | `public/sfx/torcida-estadio-v1.mp3` (arquivo DELE), em loop | 137 KB |
| 🥅 gol | `public/sfx/gol-torcida-v1.mp3` (a opção **B**, que ele escolheu) | 21 KB |
| 📣 apito | sintetizado, o de sempre (`playWhistle`) | 0 KB |

🗑️ **Aposentados**: o murmúrio de ruído rosa que fazia de ambiente, o urro
sintetizado do gol e o **canto de palmas + "ôôô"** — o ambiente dele já tem torcida
cantando ao longe, e os dois juntos embolavam. O `crowdChant` foi APAGADO do código
(não é chave desligada: sumiu mesmo), e o `npm run som` reprova se voltar.

🔑 `TORCIDA_NOVA = true` desde 19/09. **É o botão de pânico**: `false` numa linha
devolve o jogo ao silêncio de hoje, sem mexer em mais nada.

**As 4 regras de convivência do gol** (isto era a pendência nº 1, agora codada):
1. **Um gol por vez** — o anterior sai de fininho em 0,12s se vier outro.
2. **O gol nunca passa da rodada** — cortado em 85% do tempo dela, com 0,25s de
   saída (o tempo vem do `roundMs` do próprio placar, não de estado solto).
3. **Rodada abaixo de 2s (o ⚡4×) fica SÓ com o ambiente** — gol nenhum cabe ali.
4. **Ducking**: o ambiente cai pra 35% durante o gol e volta em 1,2s.

📏 **Medido nos arquivos dele** (não estimado): ambiente pica em 9,8%, gol em 32,5%,
os dois somados no gol dão 35,9% com ducking e 42,3% sem. **Nenhum estoura** — o
número de 107% que eu tinha anotado antes era de outra montagem, sem o master de
0.32. Então o ducking aqui é decisão de SOM (fazer o gol saltar), não conserto de
estouro. ⚠️ Corrigido também no comentário do código, que repetia o 107%.

✅ **Conferido de ponta a ponta no navegador**, não só no papel: o módulo real roda,
os dois arquivos baixam (200) e decodificam, apito + ambiente + dois gols
sobrepostos + um gol de ⚡4× (ignorado) + saída da tela, tudo sem erro.

🎚️ Se ele achar o ambiente baixo ou alto: `AMBIENTE_VOL` em `sound.ts`, uma linha.
## 19/09/2026 (parte 4) — 🪑 O banco do leilão parou de mentir · 🌱 o cria sai na hora · 🏢 a SAF parou de comer vaga

Tudo isto nasceu de UMA pergunta do Diego: *"todo time que tem formação com 4-2-3-1,
4-5-1 etc, sempre tão ficando preso o atacante e o usuário não consegue mais pôr pra
4-3-3, porque preenche o campo de titular e reserva"*. Depois ele fechou o caso:
*"é se não tiver ninguém da SAF e apenas 2 atacantes, um titular e um reserva. Mas
quero ir pro leilão pegar novo atacante, não deixa porque o campinho do titular tá
ocupado e o campinho do reserva tá ocupado"*. E, quando eu respondi olhando a aba
Elenco, ele corrigiu: **"o campinho que eu tava falando era o do leilão, quando vai
pro leilão aparecem dois campinhos"**.

Antes de mexer em qualquer coisa eu MEDI, com as funções do jogo
(`scripts/mede-vaga-atacante.mts` — roda com `npx tsx`). O que os números disseram:

| situação (4-2-3-1, ATACANTE) | tem | alvo do pregão | teto do elenco | vaga pra comprar |
|---|---|---|---|---|
| fora do leilão de reservas, 2 atacantes | 2 | 1 | 3 | **0** |
| dentro do leilão de reservas, 2 atacantes | 2 | 2 | 3 | **1** |
| dentro, com 1 atacante EMPRESTADO da SAF | 3 | 2 | 3 | **0** |

Ou seja: **a vaga existia** (o elenco de 27 separa 3 atacantes no 4-2-3-1) — quem
mentia era o DESENHO.

### 🪑 1. O campinho do BANCO mostrava a formação, não o banco
`Campinho` (`screens.tsx`) desenhava, no modo `bench`, exatamente `slots` lugares —
um espelho do time titular. Dois estragos de uma vez:
1. **parecia cheio quando não estava** (o caso do Diego: 1 lugar de ATA, ocupado);
2. **quem passasse de `2× a formação` na posição SUMIA** — ficava no elenco, dava
   lance, jogava, e não aparecia em campinho nenhum. Já acontecia desde o elenco de
   27 (o +1 por posição, 16/09) e com o emprestado da SAF.

Agora: `max(slots, slotsCheio - slots, have.length - slots)`. A vaga livre aparece
como **lugar VAZIO** (que é a verdade) e ninguém mais fica invisível. O campinho dos
**Titulares não mudou** — lá o número de lugares é regra de jogo.

### 🌱 2. O cria da base não saía na compra — e o jogo PROMETIA que saía
A tela do Sub-20 diz, com todas as letras: *"ele some sozinho assim que você comprar
um reforço de verdade pra vaga"* (`pyramidseason.tsx:5060`), e o botão repete
*"volta pra base sozinho quando chegar reforço"*. **Não era verdade**: o único lugar
que tirava o cria era a virada (`OPEN_RESERVE_LIST`). No meio do ano ele ficava — e
atrapalhava, porque o cria conta vaga igual a qualquer um (`filled`), é invendável e
não entra em "deixar ir": o técnico não tinha NENHUM jeito de se livrar dele.

Agora a conta virou um ajudante só, `voltaCriaSeSobrou(s, m, pos)`, com a MESMA régua
da virada (só sai se a posição continuar fechando a formação sem ele), chamado em:
leilão (`resolve`), desempate (`tiebreak`) e monte/mercado. A varredura da virada
continua, como rede de segurança (pega o que fechou por outro caminho — troca de
formação, volta de empréstimo, contrato renovado).

⚠️ Não quebra escalação: `lineupAt` já trata "um titular saiu" completando SÓ aquela
vaga com o melhor do banco na posição. E o cria só sai quando existe jogador real
naquela posição pra assumir.

### 🔓 3. `careerOpenSlots` cortava o humano no alvo do pregão
`Math.min(slotsOf, openSlots + cpuFakes)` existe por causa do BOT (o zé dele não
segura vaga). Só que pegava o humano junto e comia o +1 por posição do elenco de 27
no monte da carreira. O humano não tem fake pra descontar, então pra ele a trava só
tirava vaga que era dele. Agora `if (m.isHuman) return openSlots(m, pos)`.
Fora do leilão de reservas nada muda — lá `openSlots` já mira o time titular.

### 🧪 Bancadas novas (pra próxima sessão não refazer na mão)
- `scripts/teste-campinho-leilao/` — monta os DOIS campinhos do leilão de verdade
  (`?form=4-2-3-1&ata=3`). O `Campinho` virou `export` só por causa disto.
- `scripts/mockup-banco-leilao.mjs` — gera o antes/depois lado a lado (`--antes`,
  `--ata`, `--so-tira`).
- `scripts/teste-elenco/` ganhou `?form=` e `?ata=`; antes era 4-4-2 escrito na mão
  e mentia em qualquer outra formação.
- `scripts/mockup-terceiro-atacante.mjs` — o desenho que mostra onde o 3º atacante
  aparece na aba Elenco (campinho = 11; reserva = LISTA).
- `scripts/mede-vaga-atacante.mts` — a medição acima.

### 🏢 4. O emprestado da SAF gastava vaga do elenco — CONSERTADO no mesmo dia
Eu tinha deixado isto como "fica pra depois", e o Diego fechou a questão na hora:
*"uma coisa que te digo é que o elenco é de 27 jogadores + a SAF, que pode ser de
um ou até 4 emprestados conforme regras"*. Com a regra dita assim, não tem dúvida
nenhuma pra resolver — era só conta errada.

`filled()` olhava o `squad` inteiro, então **cada jogador pego emprestado comia uma
das 27 vagas que são dele**. Medido: no 4-2-3-1 com 2 atacantes **+ 1 atacante
emprestado**, a vaga de atacante caía de 1 pra **ZERO**. Na prática: *pegar reforço
na SAF te impedia de comprar reforço*.

Agora `filled()` ignora quem está `emprestado`. São só 3 chamadas dela, todas conta
de vaga (`openSlots`, `vagaCheio` e a poda de zé do bot — e bot não pega
emprestado), então o alcance é exatamente esse.

⚠️ **O que continua contando o emprestado, de propósito: `xiHoles`.** São duas
perguntas diferentes e elas têm que responder diferente:
- *"cabe mais um no meu elenco?"* → o emprestado **não** conta (ele é o +1 da SAF);
- *"falta gente em campo?"* → o emprestado **conta**, porque ele JOGA e tapa buraco
  de escalação.

⏳ **Sobrou um pedaço menor, anotado**: o jogador SEU que está emprestado NA SAF
(`loanOut`) sai do `squad`, então ele libera vaga enquanto está fora — se você
comprasse um substituto, na volta dele o elenco passaria de 27. **Já era assim
antes** (não é regressão) e quase não acontece, porque o empréstimo volta na virada
e a compra vem depois. A conta certa já existe pronta em `ownedRealCount` (ela soma
o `loanOut`), se um dia morder.

### ↩️ Como reverter
Os quatro consertos são pequenos e independentes: o do banco é uma linha em
`Campinho`, o do cria é o `voltaCriaSeSobrou` + 3 chamadas, o do teto é um `if`, e
o da SAF é um `&& !c.emprestado` no `filled`. Cada um volta atrás num commit
sozinho.

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

### ~~🔴 Buraco de verdade — 1 clube~~ ✅ FECHADO em 19/09
- ~~**Marreco FC** (lucasigorbortoliniii) — é o único batismo sem **escudo próprio**,
  sem **mascote que carimba o gol**, sem **manto** (nem no código nem no banco) e
  sem **camisa na Loja**.~~ O dono mandou a prancha em 19/09 e as quatro coisas
  entraram de uma vez (escudo 241×360 · mascote 321×440 · manto `#04512A`/`#E4CDA6`
  · camisa `marreco-camisa-v1.webp`). **Publicado na main em 19/09.**
  🗄️ **Falta só o BANCO**: `esc_socios` dele (`manto_c1`/`manto_c2`/`mascote_key`/
  `escudo_time`) ainda não foi gravado, e o banco GANHA do código no manto — sem
  isso ele continua vendo a cor velha.

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

### 🎽 Camisa na Loja do Clube — 6 sem arte (era 7; o Marreco saiu em 19/09)
Deportivo Montreal · SC Ferrari · Coringas do Diniz · Nata de SP · Sapekeiros FC ·
Eros FC. **Não é defeito**: é lista de a-quem-pedir. Todos os 7 já
aparecem com a cor certa na foto do campeão (o manto deles vem do painel).

### ❤️ TIME DE CORAÇÃO — e a conta que eu tinha errado
⚠️ **CORREÇÃO do relatório de mais cedo.** Eu disse "13 sem time de coração"
olhando SÓ o `esc_socios.time_coracao`. Errado: o ranking do Salão (aba TORCIDAS,
RPC `esc_salao_torcidas`) tem **TRÊS fontes**, e eu só tinha olhado a primeira:
1. `esc_socios.time_coracao` — o que a gente preenche na mão;
2. **`auth.users.raw_user_meta_data->>'time_coracao'`** — o time que a pessoa
   escolheu **no próprio cadastro**. É por isso que Fridão e Sistematizados já
   apareciam no ranking sem eu ter gravado nada;
3. **`esc_torcida_sem_dono`** — tabela pra clube SEM dono (era só o Vasco da Grana).

O Diego soltou 6 em 19/09, todos gravados no banco e anotados no código:
Pesadelo Verde → **Palmeiras** · Bagres 1993 → **São Paulo** · Leite de Verdade →
**Grêmio** · Seven City → **Corinthians** · Milhaça → **São Paulo** · Skyy FC →
**Vasco da Gama**.

🥇 E o **White Thigs do GuGu → Coritiba** entrou em `esc_torcida_sem_dono`, que é
o lugar certo pra clube sem dono. **Seguro**: a aba TORCIDAS mostra só o time e a
%, nunca o nome do clube (o `clubes[]` da RPC nem é lido na tela) — então o clube
continua oculto no Salão, como o Diego pediu em 13/09.

**Estado de hoje: 49 dos 55 no ranking.** Faltam **6**:
Marreco FC · Jurubeba FC (hoje Meia na Canela) · Stocco FC ·
Corporação Capsule FC · Eros FC · Crias do Bigão.
(19/09, mais tarde: **Bonança SSFC torce pro São Paulo** — `update esc_socios set
time_coracao='São Paulo'`, anotado também no `manto.ts` e no `batismos.ts`.)

📌 O ranking **não precisa de deploy**: a tela lê a RPC ao vivo. Gravou no banco,
aparece no próximo F5.

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

### 🏛️ E o Salão ficou SEM NINGUÉM oculto (19/09)
Ordem dele: *"pode tirar ele de ser oculto, pode mostrar já. Marreco também"*.
`SALAO_OCULTOS` foi esvaziado — **Marreco FC** e **White Thigs do GuGu** entraram
na lista de clubes.
O que aparece, conferido na bancada nova `scripts/teste-salao/`:
- **ESCUDO**: os dois TÊM escudo — não é o de letra, é o automático de cor + bicho
  (o do Marreco é um peixe amarelo em roxo). Fica bonito, não parece buraco.
- **MASCOTE e MANTO**: as folhas abrem com o aviso *"Este clube ainda não tem arte
  de mascote disponível no salão"* / *"A arte da camisa… não está disponível"*. A
  tela já tinha esse texto pronto; não quebra nada.
🔒 A lista `SALAO_OCULTOS` **ficou no código, vazia** — é a porta pra esconder um
clube de novo sem mexer em mais nada.

### Pendências que saem daqui
- 🔴 **Marreco FC**: segue sem mascote, sem manto e sem camisa (o escudo é o
  automático). Pedir arte ao dono — agora ele está VISÍVEL no Salão, então a falta
  aparece pra todo mundo.
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

