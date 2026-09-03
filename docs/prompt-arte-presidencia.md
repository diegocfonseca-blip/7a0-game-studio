# 🎨 Prompt pro GPT — arte da Sala da Presidência e da Garagem

> Feito em 03/09 a pedido do Diego (*"me manda um prompt pro GPT fazer as artes
> da imagem da sala e da área do carro com base na identidade visual sua"*).
> O mockup de referência sai de `node scripts/mockup-presidencia.mjs`.

## ⚠️ As 3 regras que decidem se a arte serve

1. **PEÇA POR PEÇA, fundo transparente.** A sala ENCHE conforme o jogador
   compra. Uma ilustração fechada da sala inteira é inútil — não dá pra tirar a
   poltrona de quem não comprou. Cada móvel é um arquivo separado, todos na
   MESMA perspectiva e escala, pra empilhar como camada por cima da base.
2. **Nada que é do clube vem desenhado.** Escudo, manto e mascote mudam por
   jogador (o escudo é gerado pelo nome, o manto é do sócio, a mascote é a arte
   do batismo). Então a arte entrega o **suporte vazio**: a moldura sem camisa,
   o pedestal sem bicho, o gancho sem escudo, a estante sem taça. O jogo põe o
   conteúdo por cima.
3. **Zero texto na imagem.** Todo texto é escrito pelo jogo (fonte Oswald). Se
   vier texto desenhado, ele fica torto, não dá pra traduzir e envelhece.

## 📏 Peso (a regra da casa)
- Cada peça ≤ **25 KB** em `.webp` · a base da sala ≤ **60 KB** · conjunto todo
  ≤ **350 KB**. Tudo em `src/escalacao/img/`, carregado só quando a Presidência
  abre — quem nunca entra não baixa.
- Sem imagem animada. Brilho/luz é CSS, custa 0 KB (padrão do `ApoioSheen`).

## ✅ Conferência quando a arte chegar (erros que já aconteceram)
- Olhar a peça recortada **sobre o fundo creme e sobre o verde escuro**, nunca
  sobre branco — branco no branco esconde buraco (caso do Theuzudo FC).
- Medir o bbox com **corte de alfa ≥ 40 e ao menos 3 px na linha/coluna**: o
  bbox cru mente por causa da poeira de alfa (caso do Papão).
- Recortar no limite do desenho: moldura vazia sobrando faz a peça renderizar
  menor que as outras.

---

# 📋 PROMPT 1 — A SALA DA PRESIDÊNCIA (colar no GPT)

```
Você vai criar um conjunto de ilustrações para um jogo de futebol brasileiro
chamado Leilão Legends. Preciso da "Sala da Presidência" de um clube de futebol.

IDENTIDADE VISUAL (obrigatória, é a cara do jogo inteiro):
- Estilo: ilustração vetorial chapada, tipo adesivo / cartoon editorial. SEM
  gradiente complexo, SEM textura fotográfica, SEM realismo, SEM sombra suave.
- Contorno preto GROSSO e uniforme em tudo (equivalente a 3-4 px numa arte de
  640 px de largura), cantos arredondados generosos.
- Sombra dura deslocada quando houver: um bloco sólido preto deslocado para
  baixo e para a direita, sem desfoque.
- Paleta EXATA, não invente cor fora dela:
  fundo creme #F4ECD6 · tinta preta #0C0C0C · dourado #FFC400 ·
  verde #1B7A3D · vermelho #C2452F · roxo #7C3AED ·
  madeira escura #7A4A26 e #5E3719 · madeira clara #8B5A2B · pedra #CFC7B1
- Clima: nostálgico, caloroso, um pouco debochado. É a sala de um dirigente de
  futebol brasileiro, não um escritório corporativo frio.

PERSPECTIVA (a mesma em TODAS as peças, isso é crítico):
- Vista frontal reta, levemente de cima, como um cenário de jogo 2D.
- A parede ocupa os 2/3 de cima, o chão de tábuas de madeira o 1/3 de baixo,
  com a linha do rodapé reta na horizontal.
- Nada em perspectiva de fuga forte. Os móveis são vistos de frente.
- Escala de referência: a sala inteira cabe num quadro de 640 x 620 px.

ENTREGA: quero ARQUIVOS SEPARADOS, cada um com FUNDO TRANSPARENTE (PNG),
recortados no limite do desenho, todos na mesma escala e na mesma perspectiva,
para eu empilhar como camadas. NÃO me entregue a sala montada num quadro só.

PEÇA 0 — BASE DA SALA (esta pode ter fundo, é o fundo de todas):
parede creme vazia com rodapé de madeira escura, e chão de tábuas de madeira
com as juntas visíveis. Nada mais. 640 x 620 px.

PEÇAS SEPARADAS (cada uma um arquivo, fundo transparente):
1.  Estante de troféus de madeira escura, alta, com 3 prateleiras VAZIAS
    (sem nenhuma taça — as taças eu desenho por cima) e uma placa de madeira
    lisa na base, sem texto.
2.  Mesa de presidente, madeira maciça, vista de frente, com tampo e gavetas.
3.  Poltrona de couro escuro de espaldar alto, vista por trás (fica atrás da
    mesa, aparece só o encosto).
4.  Tapete oval vermelho vinho com um filete claro na borda.
5.  Moldura de quadro VAZIA, retangular em pé, moldura creme com contorno preto
    grosso, interior 100% transparente (é onde entra a camisa do time).
6.  Pedestal / coluna de pedra clara, topo liso e VAZIO (é onde entra o mascote
    do clube). Com uma base larga embaixo.
7.  Janela retangular com caixilho preto grosso em cruz, mostrando à noite um
    estádio de futebol ao fundo: gramado verde, arquibancada azulada e duas
    torres de refletor acesas com feixe de luz amarelo suave. Céu azul-escuro.
8.  A MESMA janela, versão dia: céu claro, sem refletor aceso.
9.  Redoma de vidro (cúpula transparente) sobre uma base de madeira escura,
    com uma joia azul-clara facetada dentro, brilhando. Este é o objeto mais
    precioso da sala — capriche, é o xodó do presidente.
10. Vaso de planta: vaso de barro laranja com uma planta de folhas verdes.
11. Mesa de sinuca pequena, pano verde, vista de frente.
12. Aquário retangular com peixinhos coloridos.
13. Carrinho de bar com uma garrafa de champanhe e duas taças.
14. Busto de bronze sobre coluna, rosto genérico de homem de meia-idade, sem
    parecer nenhuma pessoa real.
15. Cofre antigo de ferro com roda de segredo.
16. VERSÃO POBRE (a sala do começo de carreira, é pra dar risada):
    16a. mesa dobrável de plástico branco, torta;
    16b. cadeira de plástico branca de bar;
    16c. ventilador de mesa velho;
    16d. calendário de parede simples pendurado num prego.

REGRAS FINAIS:
- NENHUM texto, letra ou número em qualquer peça.
- Nenhuma marca real, nenhum escudo de time real, nenhum rosto de pessoa real.
- Não desenhe camisa dentro da moldura nem mascote no pedestal: eles têm que
  ficar VAZIOS.
- Fundo transparente de verdade (alfa), não branco.
```

---

# 📋 PROMPT 2 — A GARAGEM E OS CARROS (colar no GPT)

```
Mesmo jogo, mesma identidade visual e mesma perspectiva do conjunto anterior
(ilustração vetorial chapada, contorno preto grosso, paleta creme #F4ECD6 /
preto #0C0C0C / dourado #FFC400 / verde #1B7A3D / vermelho #C2452F, sem
gradiente complexo, sem realismo). Agora preciso da GARAGEM DA PRESIDÊNCIA.

ENTREGA: arquivos SEPARADOS, fundo transparente, mesma escala.

PEÇA 0 — BASE DA GARAGEM (pode ter fundo): interior de uma garagem simples.
Parede cinza-clara, piso de concreto cinza mais escuro, e no alto uma porta
basculante de garagem meio erguida, com as ripas horizontais aparecendo.
No chão, três vagas de estacionamento demarcadas com faixas pintadas em creme,
vistas em leve perspectiva (mais largas na frente). Sem texto. 640 x 420 px.

OS CARROS — cada um um arquivo, fundo transparente, TODOS de PERFIL (vista
lateral pura, olhando o carro de lado), todos na mesma escala e na mesma
altura de linha do chão, para eu poder trocar um pelo outro na mesma vaga.
Carros com cara de desenho, proporção levemente "fofa" (rodas grandes,
corpo compacto), contorno preto grosso, vidros azul-claro:

1. Fusca clássico dos anos 70, azul, um pouco surrado, com um espelho torto.
2. Perua familiar quadrada dos anos 80, amarela.
3. Hatch quadradão dos anos 90, vermelho, com um aerofólio pequeno.
4. Hatch popular branco com uma escada de alumínio amarrada no teto.
5. Esportivo baixo e largo, preto brilhante, vidros escuros, rodas aro grande.

REGRAS FINAIS:
- NENHUM texto, número, placa legível ou logotipo.
- NÃO copie o desenho de nenhuma marca real de carro nem use nome de marca:
  são carros genéricos "inspirados na vibe" daquela época, não reproduções.
- Fundo transparente de verdade (alfa), não branco.
- As rodas de todos os carros têm que tocar exatamente a mesma linha
  horizontal, para encaixarem na vaga sem flutuar.
```

---

## 🧩 Como isso encaixa no que já existe
- A base + as peças entram como `.webp` em `src/escalacao/img/`, e a sala é
  montada empilhando as camadas que o jogador comprou (`careerSala`).
- Escudo (`escudoDe`), manto (`mantoStripes`) e mascote (`MASCOTES`) continuam
  vindo do código de hoje, desenhados POR CIMA dos suportes vazios.
- Se a arte gerada não bater no peso, o plano B é o que o estádio já faz:
  desenhar em SVG à mão, que custa 0 KB (é assim que o `StadiumSvg` funciona).
