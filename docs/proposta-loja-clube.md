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

Mesmo molde pra todo mundo, em **SVG, sem arquivo novo por clube** (respeita o teto
de peso). ⚠️ **Corrigido na hora pelo Diego (15/09):** a primeira versão que mandei
era uma camiseta CHAPADA e ele cortou — *"não entendi essa arte, acabei de te mandar
o padrão de modelo de camisa"*, com as artes do Inter de Bailão e do Internacional
de Madrid. O molde certo é o **das artes de batismo**: camisa de verdade, com gola V,
ombros e caimento. É esse molde que está no mockup agora.

- **peito esquerdo**: escudo do clube;
- **peito direito**: fornecedor de material;
- **centro, abaixo do peito**: patrocínio Master;
- **barra**: nome do clube; **corpo**: as 2 cores do manto.

Quem é **batismo** vê, ao lado, a **arte oficial** dele (o `.webp` que já existe).
Quem **não é** vê a camisa nas cores do próprio tier de apoio (bege no gratuito).
⚠️ Ponto a confirmar com o Diego: ele escreveu *"camisa simples tier foi
profissional"*. Entendi como **as cores do tier de apoio**. Se ele quis dizer
outra coisa, muda só a origem das 2 cores, o molde é o mesmo.

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
