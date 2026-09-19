#!/usr/bin/env python3
# ─── 🌑🐺 RECORTE DA MASCOTE NOVA DO PESADELO VERDE FC (19/09) ───────────────
#
# O Diego mandou a prancha nova (escudo + mascote + camisa) e pediu SÓ a mascote:
# *"troque o mascote do pesadelo verde por esse aqui"*. É o lobo de armadura com a
# espada e o pé na bola, com a LUA, a FUMAÇA VERDE e os pinheiros atrás — cena
# inteira, igual a mascote antiga dele (que também vinha com lua e fumaça).
#
# ⚠️ POR QUE ESTE CORTE É O MAIS PERIGOSO QUE JÁ FIZEMOS:
#    o clube é VERDE-NEON e o fundo é VERDE CHROMA. O critério de sempre
#    (`g > 150 e muito acima de R/B`) apagava **20% do desenho** — a fumaça, o
#    brilho da espada, as rachaduras da bola e os olhos do lobo. Medi antes de
#    cortar, e por isso aqui o alvo é a COR EXATA do chroma:
#      chroma medido = (10, 243, 94) · corte = distância RGB < 60.
#    A distância é BIMODAL: 41,4% do quadro fica abaixo de 40 e só +1,9% entre 40
#    e 100. Ou seja, o chroma é um bloco isolado e a arte não encosta nele.
#
# ✂️ E A MASCOTE ESTAVA GRUDADA NA CAMISA. A fumaça do lobo encosta no ombro da
#    camisa no render — não existe coluna vazia entre as duas, então régua não
#    separa e erosão não quebra a ponte. O que separa é a CAMISA: ela é a maior
#    ilha sem neon da direita; acho ela, preencho o contorno e tiro do quadro.
#
# 🩹 O REMENDO QUE ISSO EXIGE: cortar pela silhueta da camisa deixa um RISCO RETO
#    na nuvem (ficou bem visível na conferência — parece tesourada). Então a borda
#    que nasceu do corte é recuada com uma ONDA (ruído suave), só nos pixels de
#    fumaça e só perto do corte. Nuvem tem borda irregular; reta, não.
#
# uso: python3 scripts/recorta-pesadelo-mascote.py <prancha.png> <saida.png>
import sys
import numpy as np
import cv2
from PIL import Image

ORIG, SAIDA = sys.argv[1], sys.argv[2]
im = np.array(Image.open(ORIG).convert('RGB')).astype(np.float32)
H, W, _ = im.shape
r, g, b = im[:, :, 0], im[:, :, 1], im[:, :, 2]

# 1️⃣ o fundo é a COR EXATA do chroma (não "o que é verde")
CHROMA = np.array([10, 243, 94], np.float32)
dist = np.linalg.norm(im - CHROMA, axis=2)
arte = dist >= 60
print(f'fundo chroma: {100 * (~arte).mean():.1f}% do quadro')
assert 30 <= 100 * (~arte).mean() <= 60, 'proporção de fundo estranha — remedir o chroma'

# 2️⃣ a CAMISA: maior ilha de arte-sem-neon na metade direita da prancha
neon = (g > 140) & (g - r > 60) & (g - b > 55)          # a fumaça e o brilho
semneon = (arte & ~neon).astype(np.uint8)
semneon[:, :int(W * 0.65)] = 0
n, rot, st, _ = cv2.connectedComponentsWithStats(semneon, 8)
i = max(range(1, n), key=lambda k: st[k, cv2.CC_STAT_AREA])
cont, _ = cv2.findContours((rot == i).astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
camisa = np.zeros((H, W), np.uint8)
cv2.drawContours(camisa, cont, -1, 255, cv2.FILLED)
camisa = cv2.dilate(camisa, np.ones((7, 7), np.uint8)) > 0   # come o contorno preto dela
print(f'camisa achada: x {st[i, 0]}..{st[i, 0] + st[i, 2]} · y {st[i, 1]}..{st[i, 1] + st[i, 3]}')

# 3️⃣ a MASCOTE: a maior ilha do que sobra (sem o escudo, que fica na esquerda)
sobra = (arte & ~camisa).astype(np.uint8)
sobra[:, :int(W * 0.28)] = 0
sobra = cv2.morphologyEx(sobra, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
n2, rot2, st2, _ = cv2.connectedComponentsWithStats(sobra, 8)
j = max(range(1, n2), key=lambda k: st2[k, cv2.CC_STAT_AREA])
masc = (rot2 == j)

# 4️⃣ 🩹 DESFAZ O RISCO RETO: a borda que encostou na camisa recua numa ONDA
corte = masc & (cv2.dilate(camisa.astype(np.uint8), np.ones((9, 9), np.uint8)) > 0)
if corte.any():
    dcorte = cv2.distanceTransform((~corte).astype(np.uint8), cv2.DIST_L2, 5)
    rng = np.random.default_rng(7)
    onda = cv2.GaussianBlur(rng.normal(0, 1, (H, W)).astype(np.float32), (0, 0), 16.0)
    onda = (onda - onda.min()) / max(onda.max() - onda.min(), 1e-6)   # 0..1
    recuo = 8 + 30 * onda                                             # 8..38 px
    masc = masc & ~(neon & (dcorte < recuo))
    n3, rot3, st3, _ = cv2.connectedComponentsWithStats(masc.astype(np.uint8), 8)
    masc = rot3 == max(range(1, n3), key=lambda k: st3[k, cv2.CC_STAT_AREA])
    print(f'borda reta desfeita: {int(corte.sum())} px de corte viraram onda de 8–38 px')

# 5️⃣ 💨 DERRAME: a franja esverdeada na borda que encostava no chroma
rgb = im.copy()
borda = (cv2.dilate((~arte).astype(np.uint8), np.ones((5, 5), np.uint8)) > 0) & arte
teto = np.maximum(rgb[:, :, 0], rgb[:, :, 2])
derrama = borda & (rgb[:, :, 1] > teto + 60)   # folgado: o desenho É verde
rgb[:, :, 1] = np.where(derrama, teto + 60, rgb[:, :, 1])
print(f'franja de chroma limpa em {int(derrama.sum())} px')

# 6️⃣ 📏 caixa honesta: alfa ≥ 40 e pelo menos 3 px na linha/coluna
alfa = np.where(masc, 255, 0).astype(np.uint8)
m = alfa >= 40
lin = np.where(m.sum(axis=1) >= 3)[0]
col = np.where(m.sum(axis=0) >= 3)[0]
y0, y1, x0, x1 = lin[0], lin[-1] + 1, col[0], col[-1] + 1
peca = np.dstack([rgb[y0:y1, x0:x1].astype(np.uint8), alfa[y0:y1, x0:x1]])
Image.fromarray(peca).save(SAIDA)
print(f'{SAIDA}: {x1 - x0}x{y1 - y0} · desenho ocupa {100 * m[y0:y1, x0:x1].mean():.0f}% da caixa')
