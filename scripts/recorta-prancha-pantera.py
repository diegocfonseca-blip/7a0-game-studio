#!/usr/bin/env python3
# 🐆👑 RECORTE DA PRANCHA DO PANTERA NEGRA FC (ericrabelo29, batismo de 20/09).
#
# A prancha tem CINCO peças sobre chroma verde: o escudo (esq.), o mascote (o
# jogador, centro, com a bola-galáxia no pé), a camisa (dir.), a plaquinha de
# madeira e o balão de fala. Só as TRÊS primeiras vão pro jogo/post.
#
# ⚠️ O PERIGO AQUI É O CONTRÁRIO DO PESADELO VERDE: lá o desenho era verde e se
# confundia com o fundo. Aqui o desenho é PRETO e DOURADO — longe do chroma —
# então cortar é fácil. O que pode dar errado é a ESCOLHA das peças: pegar as
# "3 maiores manchas" às cegas pode trazer a PLAQUINHA ou o BALÃO no lugar da
# camisa. Por isso as peças são escolhidas pela POSIÇÃO no eixo X (esquerda,
# centro, direita) dentro das 5 maiores, que é o desenho da prancha.
#
# ⚠️ E O BBOX CRU MENTE (erro do Papão, 23/08): depois de tirar o fundo sobra
# POEIRA DE ALFA (pixels de alfa 1–40, invisíveis) espalhada pela moldura, e o
# `getbbox()` devolve o arquivo inteiro. Aqui o corte é medido com alfa ≥ 40 E
# exigindo ≥ 3 pixels na linha/coluna — um pixel solto também mente.
#
# Rodar: python3 scripts/recorta-prancha-pantera.py <prancha.jpg>
import sys, numpy as np
from PIL import Image
from scipy import ndimage as ndi

SRC = sys.argv[1] if len(sys.argv) > 1 else 'prancha.jpg'
SAIDA = 'src/escalacao/img'
im = Image.open(SRC).convert('RGBA')
a = np.array(im).astype(np.int16)
R, G, B = a[..., 0], a[..., 1], a[..., 2]

# 🎯 a cor EXATA do fundo (a mais comum da prancha, medida: 2,250,32)
ref = np.array([2, 250, 32])
dist = np.abs(a[..., :3] - ref).sum(axis=2)
corDeFundo = dist <= 120        # o JPG "suja" o chapado; folga maior que no PNG

# 1️⃣ FUNDO = cor-de-chroma LIGADA À BORDA (verde preso DENTRO do desenho fica)
lab, n = ndi.label(corDeFundo)
naBorda = set(lab[0, :]) | set(lab[-1, :]) | set(lab[:, 0]) | set(lab[:, -1])
naBorda.discard(0)
fundo = np.isin(lab, list(naBorda))

# 2️⃣ BURACOS PRESOS (vão entre os braços cruzados, entre as pernas, miolo do
#    escudo). Só some se for GRANDE — pra não comer sombra do pelo/da camisa.
presos = corDeFundo & ~fundo
labp, np_ = ndi.label(presos)
if np_:
    tamp = np.array(ndi.sum(presos, labp, range(1, np_ + 1)))
    grandes = [i + 1 for i, t in enumerate(tamp) if t > 700]
    if grandes: fundo |= np.isin(labp, grandes)

alpha = np.where(fundo, 0, 255).astype(np.uint8)

# 🧴 DESPILL SÓ NA FRANJA (2 px pra dentro): tira o verde que vazou na borda.
# Fora da franja a arte fica INTACTA — o dourado não pode ser tocado.
dentro = ~fundo
franja = dentro & ~ndi.binary_erosion(dentro, np.ones((5, 5), bool))
vazou = franja & ((G - np.maximum(R, B)) > 25)
G[vazou] = np.maximum(R, B)[vazou]
a[..., 1] = G
rgba = np.dstack([a[..., 0], a[..., 1], a[..., 2], alpha]).astype(np.uint8)

# 3️⃣ AS PEÇAS. O escudo e a camisa são uma mancha cada. O MASCOTE é TRÊS:
#    o jogador (com a bola-galáxia no pé), a PLAQUINHA de madeira e o BALÃO de
#    fala — ordem do Diego (20/09): *"faltou a plaquinha com frase embaixo do
#    mascote ao lado da bola e também em cima o balão com frase"*. Ou seja: o
#    mascote dele é a CENA inteira, não só o boneco.
#    ⚠️ Na 1ª tentativa eu joguei os dois fora achando que eram peça de post.
#    Eram identidade do clube. Quando a arte vier do dono, o padrão é PERGUNTAR
#    o que entra, não decidir por ele.
solido = alpha > 40
lab2, n2 = ndi.label(solido)
tam = np.array(ndi.sum(solido, lab2, range(1, n2 + 1)))
H, W = alpha.shape
cent = {i + 1: ndi.center_of_mass(lab2 == (i + 1)) for i in range(n2) if tam[i] > 400}
grandes = sorted(cent, key=lambda i: -tam[i - 1])

# escudo = a maior do TERÇO ESQUERDO na metade de CIMA
escudo = max((i for i in grandes if cent[i][1] < W / 3 and cent[i][0] < H * .6), key=lambda i: tam[i - 1], default=None)
# camisa = a maior do TERÇO DIREITO
camisa = max((i for i in grandes if cent[i][1] > 2 * W / 3), key=lambda i: tam[i - 1], default=None)
# mascote = TODO O RESTO (jogador + plaquinha + balão + a graminha solta)
resto = [i for i in range(1, n2 + 1) if i not in (escudo, camisa) and tam[i - 1] > 1]

def salvaMascara(mascara, nome):
    rec = rgba.copy()
    rec[..., 3] = np.where(mascara, rec[..., 3], 0)
    forte = rec[..., 3] >= 40
    linhas = np.where(forte.sum(axis=1) >= 3)[0]
    colunas = np.where(forte.sum(axis=0) >= 3)[0]
    if not len(linhas) or not len(colunas):
        print(f'   ⚠️ peça "{nome}" saiu vazia'); return
    y0, y1, x0, x1 = linhas[0], linhas[-1] + 1, colunas[0], colunas[-1] + 1
    rec[..., 3] = np.where(rec[..., 3] < 40, 0, rec[..., 3])   # 🧹 poeira de alfa
    out = Image.fromarray(rec[y0:y1, x0:x1], 'RGBA')
    out.save(f'/tmp/pantera-{nome}.png')
    print(f'   ✂️ {nome}: {out.size[0]}×{out.size[1]}')

def junta(idx):
    m = (lab2 == idx)
    perto = ndi.binary_dilation(m, np.ones((9, 9), bool))
    for j in range(1, n2 + 1):
        if j == idx or tam[j - 1] < 60: continue
        if (perto & (lab2 == j)).any(): m |= (lab2 == j)
    return m

if escudo: salvaMascara(junta(escudo), 'escudo')
if camisa: salvaMascara(junta(camisa), 'camisa')
mascote = np.zeros_like(solido)
for i in resto: mascote |= (lab2 == i)
salvaMascara(mascote, 'mascote')

print('\n✅ peças cruas em /tmp/pantera-*.png (o redimensionar e o webp vêm depois)')
