# Leilão Legends — briefing pra quem vai fazer ARTE

> Este arquivo existe pra um agente de fora (Codex, ChatGPT, um ilustrador)
> entender o jogo em 2 minutos e produzir arte que ENCAIXA. O dono é o **Diego**
> (fala português, decide tudo que é visual).
> Quem for mexer em CÓDIGO leia também o `CLAUDE.md` — lá estão as regras do
> jogo, do online e do banco. Aqui é só o necessário pra arte.

## O que é o jogo
Jogo de **leilão às cegas de lendas do futebol**, em produção, com jogadores
reais (leilaolegends.com). Você monta um time comprando cartas de jogador num
pregão de envelope fechado, e joga campeonato — sozinho contra a máquina
(Modo Carreira, subindo da Várzea até a Série A) ou online com os amigos.
Tem humor brasileiro de várzea em tudo: zoeira, provocação, apelido.

## 🎨 A identidade visual (não inventar arte fora disso)
- **Paleta exata**: creme `#F4ECD6` · tinta preta `#0C0C0C` · dourado `#FFC400`
  · verde `#1B7A3D` · vermelho `#C2452F` e `#E8503A` · roxo `#7C3AED`.
- **Traço**: contorno preto GROSSO (3-4 px), cantos bem arredondados, e
  **sombra dura deslocada** (um bloco preto sólido pra baixo/direita, sem
  desfoque). É a cara de adesivo/cartaz.
- **Fonte de título**: Oswald condensada, peso 700-900, tudo em CAIXA ALTA.
- **Clima**: nostálgico, caloroso, um pouco debochado. Futebol brasileiro de
  várzea, não corporativo.

## 🚫 As 5 regras que mais reprovam arte aqui
1. **Nada que é do CLUBE vem desenhado.** Escudo, camisa (manto) e mascote
   mudam de jogador pra jogador — o jogo desenha isso por cima. A arte entrega
   o **suporte vazio**: moldura sem camisa, pedestal sem bicho, placa sem
   escudo, estante sem taça.
2. **Zero texto na imagem.** Nenhuma letra, número ou placa escrita. Todo texto
   é escrito pelo jogo, na fonte dele. Texto desenhado sai torto e não traduz.
3. **Nada de pessoa real.** Nem rosto de jogador, nem marca de carro, nem
   escudo de time real. Se não tem referência, usar peça neutra.
4. **Peso é lei.** Arte entra como `.webp`. Peça de cenário ≤ 25 KB · imagem
   grande ≤ 60 KB. Escudo de clube ≤ 30 KB (360 px) · mascote ≤ 45 KB (440 px).
   Fundo transparente de verdade (alfa), recortado no limite do desenho.
5. **Conferir sobre fundo CREME e VERDE ESCURO, nunca sobre branco.** Já
   perdemos letras brancas de um escudo porque sobre fundo branco elas somem.

## 📁 Onde estão as coisas
- `src/escalacao/` — o jogo. `img/` é onde mora a arte que vai pro jogo.
- `scripts/kits/` — arte de REFERÊNCIA e de post (camisas, mockups). **Não
  entra no jogo**, então não conta no peso.
- `docs/` — as decisões escritas. Comece por `docs/pendencias.md`.

## 🏛️ O que está sendo feito AGORA: a Sala da Presidência
Uma sala de presidente de clube que o jogador **vai mobiliando com o dinheiro
do clube**. Cada móvel comprado aparece. Pela janela se vê **o estádio dele**,
que muda conforme ele faz obras, e o **carro** que ele comprou na vaga.

- **O brief completo da arte está em `docs/prompt-arte-presidencia.md`** —
  leia esse arquivo antes de gerar qualquer coisa. Tem os prompts prontos, a
  ordem das peças e o método (cadeia de edições) pra as peças encaixarem.
- **A referência de estilo aprovada pelo Diego** é
  `scripts/kits/presidencia-referencia-2.jpg`. É esse estilo, essa câmera,
  essa luz. (`presidencia-referencia.jpg` é a primeira versão, também dele.)
- Decidido e fechado: **uma sala só** (sem fases por divisão) · **janela grande
  de fábrica** · **sem diamante** · carro **de frente** pro escritório ·
  escudo de um lado da fachada do estádio e mascote do outro · a fachada é de
  **concreto** (a cor dourada/prata/bege é das **cadeiras**, só aparece onde as
  cadeiras aparecem de verdade).

## 🖼️ Como entregar a arte
Peça por peça, PNG com **fundo transparente**, todas na **mesma câmera e
escala**. Nunca a cena montada num quadro só — o jogo precisa acender e apagar
cada móvel separadamente. Se o gerador não segurar a cena igual entre as peças,
avise: existe um plano B (cenas completas em ordem fixa) descrito no
`docs/prompt-arte-presidencia.md`.
