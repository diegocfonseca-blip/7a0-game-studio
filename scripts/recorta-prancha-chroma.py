#!/usr/bin/env python3
# ─── ✂️🟩 RECORTE DE PRANCHA SOBRE FUNDO VERDE (chroma) ─────────────────────
#
# Os donos mandam a arte do clube como UMA prancha só — escudo + mascote +
# camisa lado a lado — e cada vez mais sobre FUNDO VERDE CHROMA (#01F748), não
# transparente. Este é o recorte genérico; nasceu do `recorta-marreco.py`
# (19/09) e virou script de todo mundo no Futpoint FC, no mesmo dia.
#
# O que ele faz, e por quê cada passo existe:
#  1. 🎯 ALVO SÓ O VERDE CHROMA — claro (g > 150) e absurdamente mais verde que
#     vermelho/azul. Clube verde-escuro (o Marreco é) e grama passam longe.
#     Se um dia chegar clube com verde CLARO no desenho, baixar o corte NÃO é a
#     saída: aí é máscara na mão. Este script avisa se o fundo detectado é menos
#     de 20% do quadro (sinal de que o chroma não é o que ele pensa).
#  2. 🕳️ APAGA O VERDE PRESO TAMBÉM (entre pernas, alças, vãos fechados). Inundar
#     só a partir da borda deixou um BLOCO VERDE entre as pernas do marreco —
#     o mesmo erro do Skyy FC (23/08), o retângulo entre as pernas da águia.
#  3. 💨 TIRA O DERRAME: a franja esverdeada que o chroma deixa na borda do
#     desenho (some no branco da bola e no dourado, que é onde mais aparece).
#  4. ✂️ SEPARA AS PEÇAS POR DESENHO, não por régua: as N maiores ILHAS são os
#     corpos, e cada pedacinho solto (o balão, a bola no pé, os riscos de
#     expressão) vai pro corpo que o cobre na horizontal. Cortar em faixas fixas
#     levava um naco do escudo junto com a mascote.
#  5. 📏 Mede a caixa com alfa ≥ 40 e pelo menos 3 px na linha/coluna: o bbox CRU
#     MENTE (erro do Papão, 23/08) — poeira de alfa devolve o arquivo inteiro.
#
# uso: python3 scripts/recorta-prancha-chroma.py <prancha.png> <pasta> <prefixo> [nomes...]
#      (nomes padrão: escudo mascote camisa — na ordem da esquerda pra direita)
import sys
import numpy as np
import cv2
from PIL import Image

ORIG, SAIDA, PREFIXO = sys.argv[1], sys.argv[2], sys.argv[3]
NOMES = sys.argv[4:] or ['escudo', 'mascote', 'camisa']

im = np.array(Image.open(ORIG).convert('RGB')).astype(np.int16)
H, W, _ = im.shape
r, g, b = im[:, :, 0], im[:, :, 1], im[:, :, 2]

# 1️⃣ + 2️⃣ o fundo é TODO o verde chroma, preso ou não
chroma = (g > 150) & (g - r > 80) & (g - b > 60)
pct = 100 * chroma.mean()
print(f'fundo chroma: {pct:.1f}% do quadro')
assert pct >= 20, f'só {pct:.1f}% de chroma — esta prancha não parece ter fundo verde'
alfa = np.where(chroma, 0, 255).astype(np.uint8)

# 3️⃣ DERRAME: na faixa que encosta no fundo, puxa o verde pro nível do maior dos
#    outros canais. Tira a franja sem lavar verde-escuro de desenho.
rgb = im.copy()
borda = cv2.dilate(chroma.astype(np.uint8), np.ones((5, 5), np.uint8)) > 0
borda &= ~chroma
teto = np.maximum(rgb[:, :, 0], rgb[:, :, 2])
derrama = borda & (rgb[:, :, 1] > teto + 25)
rgb[:, :, 1] = np.where(derrama, teto + 25, rgb[:, :, 1])
print(f'franja verde limpa em {int(derrama.sum())} px')

# 4️⃣ SEPARA POR DESENHO
n, rot, stats, _ = cv2.connectedComponentsWithStats((alfa >= 40).astype(np.uint8), 8)
ilhas = [(stats[i, cv2.CC_STAT_LEFT], stats[i, cv2.CC_STAT_TOP],
          stats[i, cv2.CC_STAT_WIDTH], stats[i, cv2.CC_STAT_HEIGHT],
          stats[i, cv2.CC_STAT_AREA], i) for i in range(1, n)]
ilhas = [x for x in ilhas if x[4] >= 300]          # poeira fora

K = len(NOMES)
corpos = sorted(sorted(ilhas, key=lambda x: -x[4])[:K], key=lambda x: x[0])
assert len(corpos) == K, f'esperava {K} peças, achei {len(corpos)} — conferir a prancha'
grupos = [{'x0': c[0], 'x1': c[0] + c[2], 'y0': c[1], 'y1': c[1] + c[3], 'idx': [c[5]]} for c in corpos]
for x0, y0, w, h, a_, idx in ilhas:
    if any(idx in gp['idx'] for gp in grupos):
        continue
    cx = x0 + w / 2
    dono = next((gp for gp in grupos if gp['x0'] - 12 <= cx <= gp['x1'] + 12), None)
    if dono is None:
        dono = min(grupos, key=lambda gp: abs((gp['x0'] + gp['x1']) / 2 - cx))
    dono['idx'].append(idx)
print(f'peças: {len(grupos)}  ·  pedaços soltos distribuídos: {len(ilhas) - K}')

for nome, gp in zip(NOMES, grupos):
    so = np.isin(rot, gp['idx'])
    a2 = np.where(so, alfa, 0)
    m = a2 >= 40
    lin = np.where(m.sum(axis=1) >= 3)[0]
    col = np.where(m.sum(axis=0) >= 3)[0]
    y0, y1, x0, x1 = lin[0], lin[-1] + 1, col[0], col[-1] + 1
    peca = np.dstack([rgb[y0:y1, x0:x1].astype(np.uint8), a2[y0:y1, x0:x1].astype(np.uint8)])
    img = Image.fromarray(peca)
    img.save(f'{SAIDA}/{PREFIXO}-{nome}-cru.png')
    cheio = (a2[y0:y1, x0:x1] >= 40).mean()
    print(f'{nome}: {img.width}x{img.height} · desenho ocupa {100 * cheio:.0f}% da caixa')
