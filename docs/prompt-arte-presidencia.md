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

# 📋 PROMPT 1 — A SALA (colar no gerador, junto com a imagem de referência)

```
Use a imagem anexa como REFERÊNCIA DE ESTILO E DE COMPOSIÇÃO: mesma pintura,
mesma paleta, mesma perspectiva, mesma iluminação. É a "Sala da Presidência"
de um clube de futebol num jogo brasileiro chamado Leilão Legends.

Preciso da MESMA sala, mas entregue em CAMADAS SEPARADAS, cada uma um PNG
com fundo transparente, todas na mesma escala e perspectiva da referência,
para o jogo montar a sala peça a peça conforme o jogador compra.

CAMADA 0 — BASE (pode ter fundo): a sala VAZIA: parede, teto, piso e a JANELA
GRANDE de parede inteira já no lugar, mas com o vidro TOTALMENTE TRANSPARENTE
(sem nada lá fora — a vista entra por outra camada). Sem nenhum móvel.

CAMADA 0-B — BASE POBRE: a mesma sala vazia, versão começo de carreira: parede
manchada, piso de concreto rachado, lâmpada pelada. Mesma janela.

PEÇAS (um PNG transparente cada, recortadas no limite do desenho):
 1. Mesa dobrável de plástico branco, torta (de fábrica)
 2. Cadeira de plástico de bar (de fábrica)
 3. Ventilador de mesa velho (de fábrica)
 4. Mesa de presidente de madeira, com uma PLACA LISA VAZIA na frente (onde
    entra o escudo) e o tampo com blotter, canetas e uma bandeirinha de mesa
    SEM escudo
 5. Poltrona de couro de espaldar alto, vista por trás
 6. Tapete oval vermelho vinho
 7. Estante de troféus de madeira escura com prateleiras VAZIAS
 8. As taças e troféus SEPARADOS (5 modelos diferentes: taça grande, taça
    média, bola de ouro, chuteira de ouro, medalha) — vou empilhar na estante
 9. Moldura de quadro VAZIA (interior transparente — a camisa entra depois)
10. Pedestal de pedra clara com o topo VAZIO (o mascote entra depois)
11. Lustre / luminária de teto
12. Aquário com peixinhos
13. Carrinho de bar com champanhe e taças
14. Planta em vaso
15. Sofá de couro verde (canto esquerdo)
16. Quadro de parede com moldura, interior VAZIO (o lema do clube entra em texto)

REGRAS:
- NENHUM texto, letra, número ou escudo desenhado em peça nenhuma.
- Nenhuma marca real, nenhum rosto de pessoa real.
- Fundo transparente de verdade (alfa), nunca branco.
- Cada peça na MESMA perspectiva e escala da referência.
```

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
