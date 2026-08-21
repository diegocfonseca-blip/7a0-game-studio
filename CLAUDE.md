# Leilão Legends (⚽ leilaolegends.com) + BidLegends (🏀 bidlegendsarena.com)

Jogo de leilão às cegas de lendas do futebol, em produção com jogadores REAIS
(deploy automático: push na main → site ao vivo em ~2 min). O basquete
(BidLegends) vai morar NESTE mesmo repo/site. Dono: Diego (fala PT-BR,
responde melhor a explicações simples, sem jargão).

## ⚠️ Regras de trabalho (o Diego exige isso)
1. **Nunca quebrar o futebol.** Ele está AO VIVO. Mudança arriscada = commit
   isolado e revertível. Na dúvida, perguntar antes.
2. **Mostrar screenshot/mockup e esperar OK do Diego ANTES de commitar
   qualquer coisa VISUAL nova.** Ele decide o visual.
3. **Segurança contra estados quebrados é prioridade #1 do Diego**: nada de
   jogador fake ("perna-de-pau") entrando em elenco por regra nova; travas
   sempre com aviso claro do porquê e do caminho pra destravar.
4. Commits com mensagem descritiva em PT; sem model ID em commits/PRs.
5. Online é **host-autoritativo** (guest roteia ações pro host). Identidade
   (youIdx) é LOCAL — nunca sincronizar. Cuidado extremo com índices de
   assento (histórico de bugs: "virei bot", "dei lance por outro").
6. 👑 **A COROA NÃO TROCA SOZINHA (regra permanente, 21/08).** Palavras do
   Diego: *"eu não quero q ng assuma. Tem q ser sempre o host. Se o host q
   criou tem q ser sempre ele sem trocar"*. **Quem criou a sala manda do começo
   ao fim.** A eleição automática de host novo está DESLIGADA
   (`ELEICAO_AUTOMATICA = false` em `store.tsx`) e **não se religa sem ele
   pedir**. Motivo: toda troca de dono devolve o envelope de todo mundo (senão
   o setor fecharia com lance ZERO), e um falso positivo — dono dado como
   sumido sem ter saído — estraga o pregão inteiro (noite da sala do
   Braguinha). Ele prefere a sala ESPERAR o dono a embolar do nada.
   Continuam valendo, porque são decisão de gente e não troca automática: o
   dono aperta SAIR e passa a coroa; e quem já é dono no banco reassume sozinho
   ao voltar.

## 🎨 Identidade visual (OBRIGATÓRIA — não inventar arte nova)
- Fundo creme `#F4ECD6` · tinta `#0C0C0C` · dourado `#FFC400` · verde `#1B7A3D`
  · vermelho `#C2452F` / `#E8503A` · roxo `#7C3AED`.
- Bordas pretas grossas (3-4px), cantos arredondados grandes, **sombras duras
  deslocadas** (`3px 3px 0 #000` / `4px 4px 0 #000`).
- Fonte display: **Oswald** condensada, pesos 800-900, uppercase em títulos.
- Componentes prontos em `src/escalacao/screens.tsx`: `Box`, `Btn`,
  `CollectibleCard`, `Shell` — REUSAR, não recriar.
- Tiers de apoio (cores por usuário): `src/escalacao/apoio.tsx`
  (`APOIO_PERKS`: bege grátis · verde · roxo 💎 · prata ⭐ · ouro 👑, cada um
  com degradê `grad` + brilho `holo`). REGRA: cada usuário leva a cor do
  PRÓPRIO tier pra todo canto; gratuito = bege; NUNCA dourado fixo pra todos.
- Cartas do basquete = MESMO visual das cartas do futebol (só muda o conteúdo).

## 🛡️📏 Arte de BATISMO: regra de peso (decidida com o Diego 16/08)
O Diego quer escalar pra **10 mil batismos**. Isso só fecha se a arte ficar
FORA do bundle. Então, sem exceção:

1. **Batismo NASCE como arquivo `.webp` em `src/escalacao/img/`** — nunca como
   SVG desenhado à mão no meio do `.tsx`. SVG à mão vira código, entra no
   bundle e é baixado por TODO jogador, mesmo quem nunca vê o clube; `.webp`
   é arquivo separado e só desce pra quem cruza com o clube. Se o dono não
   mandar arte, **gerar uma imagem** — não desenhar em SVG.
2. **Tetos de peso** (medidos nos tamanhos reais que o jogo usa):
   - **Escudo**: 360px no maior lado · **≤ 30 KB** (na tela ele nunca passa
     de 78px, então 360 já é o dobro do necessário em retina).
   - **Mascote**: 440px no maior lado · **≤ 45 KB** (na tela: 176px).
   - **Total por batismo: ≤ 75 KB.** Passou disso, reduzir/recomprimir antes
     de commitar (`quality=88, method=6` costuma bater o alvo).
3. **Recortar no limite do desenho** (bbox do alfa) antes de salvar — moldura
   transparente sobrando faz a arte renderizar menor que as outras e ainda
   ocupa KB à toa.
4. **Largura declarada pela proporção REAL** do arquivo
   (`width={Math.round(size * w / h)}`), nunca `width={size}` chutado.
5. **Animação de escudo/mascote é feita em CSS**, nunca em webp animado
   (medido: o mesmo escudo animado em webp deu 136–176 KB contra 27 KB
   parado — 6× o teto). Brilho passando/pulso em CSS custa **0 KB**; já
   existe o padrão em `ApoioSheen`.
6. Os **16 mascotes antigos em SVG** ficam onde estão (66 KB somados, ninguém
   sente). Só não nascem mais. Antes de chegar perto de ~500 batismos,
   converter esses 16 em `.webp` e **tirar a lista de nomes do código pro
   banco** — é o último pedaço que ainda multiplica por jogador.
7. **Regra permanente (17/08): todo batismo JÁ NASCE sócio + fundador.**
   Sempre que alguém vira dono de um clube batizado, ele automaticamente leva
   tier ouro (👑 Lenda) + o próximo número de `FUNDADOR_N` em `apoio.tsx` —
   não precisa o Diego pedir de novo caso a caso.
9. **Regra permanente (20/08): batismo RESERVA 4 FORMAS do nome.** Palavras do
   Diego: *"qd eu te falar o time dele você já deve reservar o escudo pra esse
   nome seja letras minúscula ou maiúsculas e tb c fc e ec no final do nome do
   time. E c isso ng poderia ter esses 4 nomes"*. Na prática:
   - **O banco faz sozinho** — o gatilho `esc_batismo_reserva_variacoes` cria as
     linhas com **FC** e **EC** assim que o nome puro entra em
     `esc_nomes_batismo`; a caixa já está coberta porque a chave é minúscula.
     **Mas alguém tem que inserir o nome puro** — isso virou passo FIXO do
     roteiro de batismo, do lado de `LOGOS_PRONTAS`/`MASCOTES`/`data.ts`.
     (Em 20/08 achamos **8 batismos sem reserva nenhuma**, e por isso o dono do
     Coringas do Diniz não conseguia usar o próprio nome.)
   - **Escudo/mimos são do E-MAIL do dono**, não da palavra. Nunca registrar
     APELIDO como chave de escudo: em 20/08 um usuário chamado só "Arruda" estava
     jogando com o escudo do Tricolor do Arruda FC. Palavras dele: *"não tem nada
     a ver o cara escreveu o nome de Arruda… está errado"*. Só o **nome inteiro**
     vale (`chaveEscudo()` em `escudos.tsx` ignora caixa, acento e FC/EC/SC).

10. **Regra permanente (17/08): TODO batismo tem FORMATO PADRÃO.** Palavras do
   Diego: *"sempre irei falar arte padrão de formato pra escudo manto e mascote…
   e mockup padrão também"*. Traduzindo, e sem exceção:
   - **Arte**: escudo `.webp` 360px/≤30 KB · mascote `.webp` 440px/≤45 KB · manto
     = **2 cores medidas na arte que o dono mandou** (nunca chutadas; 3ª cor só
     via `MANTO_TRI`). Sempre os MESMOS lugares no código: `LOGOS_PRONTAS`
     (com as variações do nome + o nome velho) · `MASCOTES` + `MASCOTE_NOME` +
     `CARIMBO_GOL` · `data.ts` (`OLD_NAME` + a divisão) · `apoio.tsx`.
   - **Mockup do post**: `node scripts/mockup-batismo.mjs` — formato aprovado
     pelo Diego (o do Nata de SP). **Tem que ter a seção das ANIMAÇÕES** ("onde
     a mascote aparece": carimbo no gol · festão de campeão · pulo no pênalti) —
     foi o que ele cobrou. Não inventar layout novo a cada batismo: é esse
     arquivo, e ele mora no repo justamente porque o mockup do Coringas foi feito
     à mão e **se perdeu** com o scratchpad. Mandar pro Diego junto com a entrega.
   - 🎽 **A CAMISA que o dono mandou VAI no post** (`--camisa`), sempre. O
     gerador só desenha uma camisa genérica quando o batismo veio sem arte de
     manto. Cobrança do Diego: *"a camisa eu mandei pra você, cara"*. As camisas
     ficam em `scripts/kits/` — **nunca** em `src/escalacao/img/`: elas são do
     POST, não do jogo (no jogo o manto é listra em CSS, 0 KB), então não entram
     no bundle nem contam no teto de peso do batismo.
   - **Limpeza da arte**: recortar o quadriculado falso em **DOIS passes** — o
     normal (a partir da borda) **e** o de buracos PRESOS dentro do desenho
     (entre pernas, alças, vãos fechados). Só apagar região que tenha os **dois
     tons** do xadrez, senão pena/pelo cinza do bicho some junto. Aconteceu no
     Skyy FC: sobrou um retângulo cinza entre as pernas da águia.

## 📁 Mapa do código
- `src/escalacao/` — o jogo todo: `store.tsx` (estado/reducer/online),
  `screens.tsx` (leilão/home/jogo rápido), `pyramidseason.tsx` (carreira
  pirâmide), `lobby.tsx` (salas online), `data.ts` (baralhos BR/EU + bios),
  `apoio.tsx` (tiers), `dinastia.tsx`, `estadio.tsx` (SAF/estádio).
- Backend: Supabase (auth, game_rooms, room_players, user_colors, user_cards).
- Build: `npm run build` (Vite + tsc). SEMPRE buildar antes de commitar.

## 🏀 BidLegends (basquete)
- Conceito COMPLETO e decidido: **`docs/conceito-basquete.md`** (ler antes de
  qualquer trabalho de basquete). Pendências combinadas: **`docs/pendencias.md`**.
- Mesmo site, dois domínios: hostname `bidlegendsarena.com` → modo basquete;
  `leilaolegends.com` → futebol. Marca visível: "BidLegends".
- Home com seletor ⚽/🏀 no topo (mockup aprovado pelo Diego); o resto da cara
  é IDÊNTICO ao jogo atual (creme/bordas/Oswald) — só troca o conteúdo.
- 🌐 **BILÍNGUE (BR/EN) OBRIGATÓRIO**: o basquete é internacional (NBA). TODO
  texto novo do BidLegends NASCE em PT **e** EN — usar `useT()` de
  `src/escalacao/lang.ts` (`const t = useT(); t('Português','English')`). Botão
  BR/EN fica no **canto direito do header** do BidLegends (`LangToggle`). Padrão:
  navegador PT → BR, senão EN; escolha manual grava no aparelho. ⚠️ Isto é SÓ do
  basquete — o FUTEBOL segue 100% em PT, não traduzir.
- 🔒 Enquanto está em construção, o basquete é **invisível pra todo mundo**: só
  aparece pra `diego.c.fonseca@gmail.com` logado (trava por conta em
  `src/escalacao/sport.ts`, `BASQUETE_TESTERS`). Não fundir na main sem OK visual.

## 📢 Novidades: automáticas, e bug NUNCA entra (regra do Diego 16/08)
Antes as novidades da home eram 17 avisos escritos na mão que nunca saíam.
Agora:
1. **Toda feature nova ganha UMA linha em `src/escalacao/novidades.ts`**, na
   mesma entrega que a liga pro pessoal. Formato: o que mudou pra quem joga, em
   uma frase, com o modo entre parênteses. A mais nova em cima, com a data.
2. **BUG NUNCA VIRA NOVIDADE.** Palavras do Diego: *"menos bugs, que nunca
   lance"*. Conserto vai pro `docs/pendencias.md` e pro commit — nunca pra tela
   do jogador.
3. **Novidade some sozinha**: a home mostra só os últimos 45 dias, no máximo 5
   (`novidadesDaVez`). Ninguém precisa apagar nada.
4. **Mexeu em JOGADOR** (entrou, saiu, mudou de nível ou de categoria)? Rode
   **`npm run novidades`** — ele compara o baralho com a foto anterior
   (`scripts/catalogo-snapshot.json`) e escreve sozinho o que mudou em
   `src/escalacao/novidades-jogadores.ts` (arquivo GERADO, não editar na mão).
   Commitar os três juntos: `data.ts`, a foto e o gerado.

## 🔄 Protocolo de memória compartilhada (OBRIGATÓRIO em toda sessão)
As sessões não se veem — o repo é a memória comum. Então TODA sessão deve:
1. **Ao começar**: `git pull` e ler `git log --oneline -15` (o que as outras
   sessões fizeram), + `docs/pendencias.md`. Se for trabalho de basquete, ler
   também `docs/conceito-basquete.md`.
2. **Ao terminar cada entrega**: atualizar `docs/pendencias.md` (riscar o que
   fez, adicionar o que ficou combinado e ainda não foi feito) e commitar
   junto. Pendência que só existe no chat SE PERDE — anotar sempre.
3. **Quando o Diego revelar um gosto/decisão novos**: gravar na hora na seção
   "Gostos do Diego" deste arquivo (ou no doc do assunto) e commitar.
4. Commits sempre descritivos em PT — eles são o diário que as outras sessões
   leem.

## 💛 Gostos do Diego (aprendidos na prática — respeitar)
- **Segurança acima de feature**: prefere bloquear com aviso claro a deixar
  acontecer algo estranho. Toda trava explica O PORQUÊ e O CAMINHO ("faltam 2
  meias — contrate no leilão ou traga da SAF").
- **"Saber o que pode e o que não pode"** (14/08): as regras do jogo são lei —
  antes de explicar um comportamento ou mexer numa regra, CONFERIR no código o
  que realmente pode e o que não pode acontecer (nada de achismo). E o JOGO
  também tem que ser assim: nenhum comportamento "emergente" fora das regras
  mapeadas — se algo acontece que nenhuma regra previu (jogador entrando em
  campo sem o dono saber, contagem furando animação), é bug, não feature.
- **🚫 NÃO INVENTAR COMO UMA PESSOA REAL É** (18/08, palavras dele: *"qd vc N
  souber qm é a pessoa é como é me fala pow.. pq fazer algo q N trm nd ver e
  foda"*). Vale pra rosto de jogador, escudo, mascote, bio — qualquer coisa
  ligada a gente de verdade. Se não tem referência, **falar na hora e usar a
  peça NEUTRA**, marcando na tela que é neutra (foi o que aconteceu com o
  Vozinha, goleiro de Cabo Verde). Chute com cara de retrato é pior que rosto
  genérico: o Diego prefere "não sei" do que algo que não tem nada a ver.
- **Odeia spoiler**: tabela, giro, artilharia — NADA revela resultado antes da
  animação/apito na tela.
- **Nada pode atrasar o ritmo do jogo**: zoeira/interação nova entra nos tempos
  mortos, nunca adiciona passo nem espera extra (regra de ouro do leilão).
- **Zoeira é a alma do jogo**: textos com humor BR, emojis, provocação entre
  amigos (cantadas de blefe, chuva de dinheiro 💸, "QUASE!" no martelo com
  frases BEM variadas). Folclóricos > nomes reais em conteúdo inventado.
- **Fidelidade de tier é sagrada**: quem paga ouro vê ouro brilhante em TODO
  lugar; gratuito vê bege em todo lugar. Nenhuma cor emprestada, nunca.
- **UI nova = mockup primeiro**: ele quer VER (artifact/screenshot) e aprovar
  antes de codar. Textos de UI: simples, diretos, sem tecniquês.
- **Sempre quer saber se dá pra reverter** ("qualquer bug eu posso voltar
  atrás né?") — responder isso proativamente a cada entrega.
- Sons: martelo só pra QUEM ganha (ou vende) — nada de som genérico pra todos.
- **O desenho do estádio (StadiumSvg) é sagrado**: tem que ser a PRIMEIRA coisa
  visível ao abrir a área do clube ("via o estádio de cara, eu achava bonito").
  Qualquer coisa nova naquela área entra ABAIXO dele, nunca antes.
- Explicações embaixo do botão/do lugar exato, não parágrafos soltos.

## 🗣️ Como falar com o Diego
- PT-BR, direto, sem tecniquês; explicar o "porquê" em linguagem de jogo.
- Ele manda áudio transcrito com erros — interpretar com boa vontade e
  confirmar o entendimento quando for ambíguo.
- Sempre dizer o que foi feito, o que falta e como reverter se der ruim.
