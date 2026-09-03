# 🎨 Arte da Sala da Presidência — como ela é produzida (v2, 03/09)

> **Decisão do Diego (03/09):** *"quero nesse estilo aqui"* — e mandou uma
> imagem gerada (pintura de gerador de imagem). Esse estilo **não sai de
> código**: eu (Claude) não tenho gerador de imagem — só código e edição de
> imagem. Todas as tentativas "pelo Claude mesmo" saíram com cara de desenho e
> ele recusou todas. O OpenArt conectado à sessão pede aprovação a cada
> chamada e **não funciona aqui** (palavras dele).
>
> **Então o fluxo é o dos batismos:** o Diego gera as peças no gerador dele com
> o prompt abaixo, manda pra mim, e eu recorto, limpo, peso e monto no jogo.
> A referência de estilo está em **`scripts/kits/presidencia-referencia.jpg`**
> (a imagem que ele mandou — guardada no repo pra não se perder).

## O que está FECHADO sobre a sala (vale pro prompt e pro código)
- **Uma sala só.** Sem divisão. A pessoa compra peça por peça e cada uma
  aparece no lugar fixo dela. Sala crua = mesma sala, mesma janela grande,
  móveis de fábrica (mesa de plástico, cadeira de bar, ventilador).
- **Sem diamante.** (foi entendimento errado de áudio; não existe)
- **Janela grande de fábrica**, parede inteira. Lá fora: **o estádio do
  jogador**, muda quando ele faz obra. **Carro de frente pro escritório**, na
  vaga PRESIDENTE.
- **Escudo grande na fachada de um lado, mascote do outro** (mascote só quem
  tem). Fachada de **concreto**: a cor do tier (ouro/prata/bege) é das
  **cadeiras**, só aparece onde as cadeiras aparecem (arcos abertos, últimas
  fileiras despontando).
- **Zero texto desenhado** nas peças (o jogo escreve tudo na Oswald).
- **Nada do clube vem desenhado**: escudo, manto e mascote mudam por jogador →
  suporte vazio (moldura sem camisa, pedestal sem bicho, fachada sem escudo) e
  o jogo põe por cima. **Exceção pedida por ele:** na imagem de referência o
  escudo está no manto, na fachada, na mesa e na bandeirinha — no jogo TODOS
  esses são sobreposição do escudo real (`escudoDe()`/`LOGOS_PRONTAS`).

## ⚠️ As 3 regras que decidem se a arte serve
1. **PEÇA POR PEÇA, fundo transparente** — nunca a sala montada num quadro só.
   A sala enche conforme se compra; sem camadas não dá pra tirar a poltrona de
   quem não comprou. Mesma perspectiva e escala em todas.
2. **A janela é o problema técnico**: o estádio tem centenas de combinações
   (4 setores × % + 12 obras). Gerador não faz isso. Solução: o jogo **já tem 6
   NÍVEIS nomeados** de estádio (`stadiumLevel()` em `estadiodata.ts`):
   🌱 Campo de Várzea → 🚧 Canteiro de Obras → 🪵 Estádio de Bairro →
   🏛️ Estádio Municipal → 🏟️ Arena Legends → 👑 Templo Legends.
   **Gera-se 6 vistas** (uma por nível) e o jogo escolhe pelo nível. Por cima
   entram como camadas: o **carro** (3 modelos), o **escudo** na fachada, o
   **mascote** na fachada, e **dia/noite** (refletores) se couber no peso.
3. **Peso**: cada peça ≤ 25 KB `.webp` · cada vista de estádio ≤ 60 KB ·
   conjunto ≤ 600 KB. Carrega só quando a Presidência abre.

## ✅ Conferência quando a arte chegar
- Peça recortada conferida **sobre creme e sobre verde escuro**, nunca sobre
  branco (letra/bola branca some — caso Theuzudo).
- bbox com **corte de alfa ≥ 40 e ≥ 3 px** (poeira de alfa mente — caso Papão).
- Recorte no limite do desenho.
- Perspectiva idêntica entre as peças (senão a mesa "flutua").

---

# 📋 PROMPT 1 — A SALA, EM CADEIA DE EDIÇÕES (o jeito que NÃO fica estranho)

> ⚠️ Pergunta do Diego: *"mas aí que eu adiciono coisas vai ficar estranho né?"*
> Fica, **se as peças forem geradas soltas** — cada uma vem com luz e
> perspectiva diferentes e vira adesivo. A solução é **não gerar peça solta**:
> gerar a MESMA sala em etapas, editando a MESMA imagem, um móvel por vez.
> Eu extraio a DIFERENÇA entre uma etapa e a seguinte — a "peça" é um pedaço da
> própria pintura, então empilhar no jogo é revelar a pintura, não colar.

**Passo 0 — a sala vazia** (gerar do zero, com a imagem de referência anexa):
```
Use a imagem anexa como REFERÊNCIA DE ESTILO, câmera, paleta e iluminação.
Pinte a MESMA sala, mas VAZIA: só parede, teto, piso de madeira e a JANELA
GRANDE de parede inteira no mesmo lugar, com o vidro mostrando SÓ céu azul
liso (nada lá fora). Sem nenhum móvel, sem quadro, sem tapete, sem texto,
sem escudo. Formato 1400x1120.
```

**Passo 0-B — a sala pobre** (edição do passo 0):
```
Nesta mesma imagem, sem mudar câmera nem luz: troque o piso por concreto
cinza rachado, deixe a parede manchada, e adicione uma mesa dobrável de
plástico branco torta, uma cadeira de plástico de bar e um ventilador de
mesa velho. Mais nada.
```

**Passos 1 a 14 — um móvel por vez** (cada um é edição da imagem ANTERIOR;
salvar cada resultado com o número):
```
Nesta mesma imagem, SEM MUDAR MAIS NADA (mesma câmera, mesma luz, todos os
outros objetos exatamente iguais), adicione apenas: <PEÇA>.
```
Ordem das peças (a ordem da loja):
 1. tapete oval vermelho vinho no centro
 2. mesa de presidente de madeira, de frente, com uma PLACA LISA VAZIA na
    frente (sem escudo) e blotter, canetas e bandeirinha de mesa SEM escudo
 3. poltrona de couro de espaldar alto atrás da mesa, vista por trás
 4. estante de troféus de madeira escura à esquerda, prateleiras VAZIAS
 5. quatro troféus dourados variados nas prateleiras (taça grande, taça
    média, bola de ouro, chuteira de ouro)
 6. moldura de quadro na parede direita, interior VAZIO (creme liso)
 7. pedestal de pedra clara no chão à esquerda, topo VAZIO
 8. lustre / luminária de teto
 9. aquário com peixinhos na estante da direita
10. carrinho de bar dourado com champanhe e taças, canto direito
11. planta em vaso
12. sofá de couro verde, canto esquerdo
13. quadro pequeno na parede direita com moldura, interior VAZIO
14. lambri de madeira na parte de baixo da parede

REGRAS EM TODOS OS PASSOS:
- NENHUM texto, letra, número ou escudo desenhado (o jogo põe por cima).
- Nenhuma marca real, nenhum rosto de pessoa real.
- A janela continua SÓ céu liso (a vista entra por outra camada).

**Se o gerador NÃO segurar a cena igual entre os passos** (móvel mudando de
lugar, luz mudando): **Plano B** — 5 pinturas completas (vazia → básica →
média → boa → completa) e a loja compra em ORDEM FIXA. Nunca fica estranho,
porque é sempre um quadro inteiro; perde só a ordem livre de compra.

# 📋 PROMPT 2 — AS 6 VISTAS DO ESTÁDIO (a janela)

```
Mesmo estilo da referência. Preciso da VISTA PELA JANELA da sala do
presidente: o estádio do clube visto de fora, de frente, do nível do
estacionamento da presidência, com céu e cidade ao fundo. Tamanho 1200x900,
SEM moldura de janela (a moldura é da sala).

Quero 6 versões da MESMA vista, a mesma câmera, mostrando o estádio evoluindo:
 1. CAMPO DE VÁRZEA: um campo de terra batida, sem arquibancada, quatro
    mastros de luz apagados e velhos, cerca de arame, estacionamento de barro
 2. CANTEIRO DE OBRAS: o campo com grama nascendo, uma arquibancada pequena de
    concreto em obra (andaime, tapume), mastros ainda apagados
 3. ESTÁDIO DE BAIRRO: gramado verde, arquibancada de um lado pronta, muro
    de concreto, mastros acesos, estacionamento de barro
 4. ESTÁDIO MUNICIPAL: arquibancadas dos dois lados, telão pequeno, loja do
    clube ao lado, estacionamento ASFALTADO com vaga pintada
 5. ARENA LEGENDS: estádio fechado com cobertura, camarotes com vidro,
    telão grande, hotel ao lado, tudo aceso à noite
 6. TEMPLO LEGENDS: o mesmo, versão grandiosa: fachada nobre, iluminação
    cênica, praça de alimentação, estação de metrô, torcida chegando

Em TODAS: na fachada, deixe um ESPAÇO LISO grande à esquerda (onde entra o
escudo do clube) e outro à direita (onde entra o mascote). Na frente, a VAGA
DO PRESIDENTE vazia, pintada no chão, de frente para a câmera. Sem carro
(o carro é outra camada). Sem texto nenhum.

CAMADAS EXTRAS (PNG transparente, mesma câmera):
 7. Três carros vistos DE FRENTE, faróis acesos, cada um um arquivo: um
    popular antigo, um sedã, um esportivo preto de luxo — proporção "fofa",
    genéricos, sem marca real
 8. A mesma vista 5 de DIA (para o jogo alternar dia/noite)
```

---

## 🧩 Como entra no jogo depois que a arte chegar
- Base + peças → `.webp` em `src/escalacao/img/presidencia/`, empilhadas por
  `careerSala` (lista de peças compradas).
- Janela → `janela-{nivel}.webp` escolhida por `stadiumLevel(st).n`; por cima:
  carro (`careerCarro`), escudo (`<Escudo>`), mascote (`MASCOTES[k]`).
- Tudo com `import()` preguiçoso: quem não abre a Presidência baixa 0 KB.
- O gerador em código (`scripts/arte-presidencia.mjs`) fica como **registro da
  composição e dos slots** — não é mais a arte final.
