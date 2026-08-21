# 🎴 Prompt padrão — RETRATO DE LENDA

Prompt pronto pra colar no Gemini/Midjourney/OpenArt. É a arte que o Diego
aprovou (Pelé/Valderrama/Zidane/Ronaldo), **com as correções da conferência de
21/08**: sem escudo de clube real, ficha do jogador no lugar do gabarito da
folha de estilo, nome quebrado em duas linhas, barba liberada.

Mora aqui no repo porque prompt que só existe no chat **se perde**.

**São DOIS prompts diferentes, não confundir:**
- **A) PRA ENTRAR NO JOGO (sem fundo)** — é o de baixo, o principal. Só o busto,
  fundo vazio, sem card, sem texto nenhum. Passa pela esteira
  `scripts/rosto/foto-jogador.py` e vira rosto de jogador de verdade.
- **B) PRA POST** — o card completo, com moldura creme, pílula e ficha. Está
  mais pra baixo neste arquivo. Esse NÃO entra no jogo.

---

# A) 📸 PROMPT PRA ENTRAR NO JOGO — SEM FUNDO

Este é o formato que a esteira come. Um arquivo por jogador, e **o nome do
arquivo tem que ser o nome do jogador** (`neymar.png`, `lamine-yamal.png`) —
é assim que a esteira casa com o baralho do `data.ts`. Arquivo que não casa com
ninguém é avisado e não entra (pra não nascer rosto órfão no jogo).

```
Ilustração vetorial chapada (flat vector), estilo mascote de card colecionável.
Enquadramento quadrado 1:1.

FUNDO: TOTALMENTE VAZIO. Fundo transparente (PNG com alpha). Se não for possível
gerar transparência, usar branco puro #FFFFFF liso, absolutamente nada mais.
- SEM cenário, SEM moldura, SEM card, SEM borda, SEM sombra atrás do
  personagem, SEM gradiente, SEM textura, SEM piso, SEM círculo, SEM vinheta.
- SEM nenhum texto, nenhum nome, nenhum número, nenhuma etiqueta, nenhuma ficha,
  nenhuma pílula, nenhuma estrela. A imagem tem SÓ o personagem.

O PERSONAGEM: busto de jogador de futebol (cabeça, ombros e peito), centralizado,
visto de frente, ocupando bem o quadro.
- Deixar uma margem de uns 6% de espaço vazio em volta: o busto NÃO pode encostar
  em nenhuma das quatro bordas da imagem.
- ROSTO TOTALMENTE VAZIO: SEM olhos, SEM boca, SEM nariz, SEM sobrancelha, SEM
  orelha desenhada por dentro. A pele é um formato chapado de uma cor só.
  Isso é obrigatório e não pode ser suavizado.
- Pode ter CABELO e pode ter BARBA/BIGODE, desenhados como formas chapadas de cor
  sólida com contorno preto — nunca com fios, textura, brilho ou sombreado.
- Contorno preto #0C0C0C grosso, fechado e uniforme em TUDO (cabelo, barba,
  cabeça, pescoço, ombros, camisa). Nenhuma linha pode ficar aberta.
- Sem gradiente, sem brilho, sem textura, sem sombra suave, sem luz. Tudo cor
  chapada, no máximo 6 cores na imagem inteira.

A CAMISA: retrô, gola em V, listras ou blocos de cor conforme os DADOS abaixo.
- PROIBIDO: escudo, brasão, logo, nome, número, patrocinador ou qualquer marca de
  clube ou de time REAL. Nada de Real Madrid, Inter, Barcelona, seleção nenhuma.
  Só as CORES da camisa.
- Se a camisa for branca ou clara, o contorno preto em volta dela tem que ser
  bem visível e fechado, pra ela não se misturar com o fundo.

DADOS DO JOGADOR:
- Nome: <NOME>
- Pele: <tom de pele>
- Cabelo: <descrição chapada>
- Barba: <descrição, ou "sem barba">
- Camisa: <cores, sem citar clube>
```

## ⚠️ Os dois detalhes que estragam a imagem se escaparem

1. **Camisa branca encostando na borda.** A esteira apaga o branco *a partir da
   borda* (flood fill) — miolo branco fica, mas branco que toca a borda some
   junto com o fundo. Por isso o prompt exige margem em volta e contorno preto
   fechado. Se vier uma camisa branca cortada no rabo da imagem, ela perde o
   peito na hora de tirar o fundo.
2. **Sombra atrás do personagem.** Vira uma mancha cinza flutuando, porque não é
   branca o bastante pra esteira apagar. Sombra dura é do CARD, não do busto.

## 🔧 Como eu ponho no jogo depois

Você me manda a pasta com as imagens. Eu rodo:

```
python3 scripts/rosto/foto-jogador.py --pasta <pasta>
```

A esteira sozinha: casa o nome com o jogador do baralho · tira o fundo · corta no
limite do desenho · reduz pro **lado maior 200px** · salva `.webp` (q85) em
`public/rostos/` · **avisa todo arquivo que passar de 12 KB** · e reescreve
`src/escalacao/rostos-lista.ts`. Quem tem rosto usa rosto; quem não tem fica
exatamente como está hoje — nunca fica meio quebrado.

---

# B) 🖼️ PROMPT PRA POST (card completo, com fundo creme)

⚠️ Este NÃO entra no jogo — é só pra divulgação.

---

## 📋 PROMPT (colar inteiro, trocar só o bloco `DADOS DO JOGADOR`)

```
Ilustração vetorial chapada (flat vector), estilo card colecionável de jogo,
formato retrato 3:4.

FUNDO DO CARD: creme #F4ECD6. Card com borda preta #0C0C0C de 4px, cantos bem
arredondados (24px) e SOMBRA DURA DESLOCADA de 4px pra baixo e pra direita, em
preto sólido, sem desfoque nenhum.

O PERSONAGEM: busto de jogador de futebol (cabeça, ombros e peito), centralizado,
visto de frente.
- ROSTO TOTALMENTE VAZIO: SEM olhos, SEM boca, SEM nariz, SEM sobrancelhas, SEM
  orelha desenhada por dentro. A pele é um formato chapado de uma cor só. Isso é
  obrigatório e não pode ser suavizado.
- Pode ter CABELO e pode ter BARBA/BIGODE, desenhados como formas chapadas de cor
  sólida com contorno preto — nunca com fios, textura ou sombreado.
- Contorno preto grosso e uniforme em tudo (cabelo, barba, cabeça, camisa).
- Sem gradiente, sem brilho, sem textura, sem sombra suave. Tudo cor chapada.

A CAMISA: retrô, gola em V, listras ou blocos de cor conforme os DADOS abaixo.
- ⛔ PROIBIDO: escudo, brasão, logo, nome, patrocinador ou qualquer marca de
  clube ou de time REAL na camisa. Nada de Real Madrid, Inter, Barcelona, seleção
  nenhuma. Só as CORES da camisa.
- Se quiser algo no peito, use um escudo GENÉRICO inventado (silhueta simples de
  animal ou uma forma geométrica), sem texto dentro.

O TOPO DO CARD: uma pílula dourada #FFC400 com borda preta grossa, alinhada à
esquerda, com o texto "👑 LENDA" em MAIÚSCULAS.

O NOME, logo abaixo da pílula, em DUAS linhas:
- Linha 1: o nome, fonte condensada tipo Oswald, peso 800-900, MAIÚSCULAS, preto,
  grande. Nunca deixar o nome cortar na borda — se for grande, diminuir a fonte.
- Linha 2: o apelido entre aspas simples, MAIÚSCULAS, menor, em roxo #7C3AED.

A FICHA, na parte de baixo do card: uma faixa preta fina com o texto
"NASCIMENTO DE LENDA" em branco maiúsculo, e abaixo dela um painel branco com
três linhas separadas por filete cinza claro. Cada linha tem o rótulo à esquerda
em cinza maiúsculo pequeno e o valor à direita em preto negrito:
- POSIÇÃO
- AUGE
- NÍVEL  → mostrar como estrelas ⭐ douradas #FFC400
⛔ A ficha só pode ter essas três linhas. NÃO escrever "PESO", "CAIXA",
"ESPAÇO", "Inter", "12px", "45%" nem qualquer especificação de fonte ou de
design dentro do card.

DADOS DO JOGADOR:
- Nome: <NOME>
- Apelido: <APELIDO>
- Pele: <tom de pele>
- Cabelo: <descrição chapada>
- Barba: <descrição, ou "sem barba">
- Camisa: <cores, sem citar clube>
- POSIÇÃO: <GOL | LAT | ZAG | MEI | ATA> · <goleiro|lateral|zagueiro|meia|atacante>
- AUGE: <País> · <ano>
- NÍVEL: <1 a 5> estrelas
```

---

## 🧾 Blocos prontos dos 4 pedidos (Neymar, Messi, CR7, Yamal)

Só trocar o bloco `DADOS DO JOGADOR` do prompt acima por um destes:

**Neymar**
```
- Nome: NEYMAR
- Apelido: 'O MENINO DA VILA'
- Pele: morena clara
- Cabelo: moicano curto, castanho escuro, forma chapada
- Barba: cavanhaque fino no queixo, castanho escuro
- Camisa: amarela com gola verde em V (sem escudo)
- POSIÇÃO: ATA · atacante
- AUGE: Brasil · 2015
- NÍVEL: 5 estrelas
```

**Messi**
```
- Nome: MESSI
- Apelido: 'LA PULGA'
- Pele: clara
- Cabelo: castanho escuro, curto e repartido, forma chapada
- Barba: barba curta e cheia, castanho escuro
- Camisa: listras verticais celeste e branca, gola em V preta (sem escudo)
- POSIÇÃO: ATA · atacante
- AUGE: Argentina · 2022
- NÍVEL: 5 estrelas
```

**Cristiano Ronaldo**
```
- Nome: CRISTIANO
- Apelido: 'O COMANDANTE'
- Pele: clara amorenada
- Cabelo: preto curto, topete arrumado, forma chapada
- Barba: sem barba (só barba muito rente, opcional)
- Camisa: vermelha com detalhe verde na gola em V (sem escudo)
- POSIÇÃO: ATA · atacante
- AUGE: Portugal · 2016
- NÍVEL: 5 estrelas
```

**Lamine Yamal**
```
- Nome: YAMAL
- Apelido: 'O GAROTO'
- Pele: morena
- Cabelo: preto, cacheado curto, forma chapada
- Barba: sem barba
- Camisa: listras verticais vermelha e azul-marinho, gola em V amarela (sem escudo)
- POSIÇÃO: ATA · atacante
- AUGE: Espanha · 2025
- NÍVEL: 4 estrelas
```

---

## ⚖️ Se a arte for ENTRAR NO JOGO (não só em post)

A folha de estilo (`scripts/padrao-visual.mjs`) já fixa: **rosto de jogador =
256px no lado maior · ≤ 14 KB `.webp`** (na tela ele aparece a 96px no campinho
e 100px na carta). Nesse caso o gerador deve entregar **só o busto recortado**,
sem o card em volta — o card o jogo desenha sozinho.

Se for só pra POST, não conta peso nenhum (igual às camisas em `scripts/kits/`,
que ficam fora do bundle).

## 🚫 Por que o escudo real não pode

Regra já escrita em `src/escalacao/manto.ts` e `src/escalacao/coracao.ts`:
*"nome/escudo de clube REAL nunca aparece: só as CORES"*. Fora que escudo de
clube é marca registrada. Cor e listra podem — cor não é marca.
