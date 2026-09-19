#!/usr/bin/env python3
# ─── 👑❌ TIRA A COROA SOLTA DO PEITO DA CAMISA DO MARRECO FC (19/09) ────────
#
# Pedido do Diego, vendo o post: *"remova a coroa do manto, direito do manto, só"*
# — a coroa dourada solta no peito DIREITO de quem veste (o lado ESQUERDO de quem
# olha), do lado oposto ao brasão.
#
# ⚠️ O QUE **NÃO** PODE SAIR, e por isso isto não é um "apaga o dourado":
#    · o BRASÃO no outro peito (é o escudo do clube);
#    · a coroa miúda da GOLA, junto do "MARRECO FC 2025";
#    · o friso dourado da gola e das mangas;
#    · a coroa do selo lá embaixo, na barra.
#    O script acha a coroa do peito como ILHA dourada isolada dentro de uma janela
#    do peito e mexe só nela — nada mais no arquivo é tocado.
#
# 🧵 COMO APAGA: não é borrão. O painel ali é pano verde liso com um grão fino, e
#    o que funciona é RECONSTRUIR: ajusta uma superfície quadrática nos pixels
#    LIMPOS em volta, repinta por cima com o mesmo grão e desvanece na margem (que
#    já é pano limpo dos dois lados). Foi a mesma receita que apagou a marca da
#    bola de ouro sem deixar emenda nem fantasma.
#
# uso: python3 scripts/tira-coroa-marreco.py <camisa.png> <saida.png>
import sys
import numpy as np
import cv2
from PIL import Image

ORIG, SAIDA = sys.argv[1], sys.argv[2]
im = np.array(Image.open(ORIG).convert('RGBA'))
rgb, alfa = im[:, :, :3].astype(np.float32), im[:, :, 3]
H, W = alfa.shape
r, g, b = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]

# 1️⃣ acha a coroa: ilha dourada dentro da janela do peito de quem veste (direito)
ouro = ((alfa >= 200) & (r > 140) & (g > 110) & (r - b > 60) & (g - b > 40)).astype(np.uint8)
jan = np.zeros_like(ouro)
jan[int(H * 0.18):int(H * 0.45), int(W * 0.15):int(W * 0.50)] = 1
m = cv2.morphologyEx(ouro & jan, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
n, rot, st, _ = cv2.connectedComponentsWithStats(m, 8)
ilhas = [(st[i, cv2.CC_STAT_AREA], i) for i in range(1, n) if st[i, cv2.CC_STAT_AREA] >= 300]
assert len(ilhas) == 1, f'esperava 1 coroa no peito, achei {len(ilhas)} — conferir antes de apagar'
idx = ilhas[0][1]
x, y, w, h = st[idx, cv2.CC_STAT_LEFT], st[idx, cv2.CC_STAT_TOP], st[idx, cv2.CC_STAT_WIDTH], st[idx, cv2.CC_STAT_HEIGHT]
print(f'coroa achada: {w}x{h} em x {x}..{x + w} · y {y}..{y + h}')

# 2️⃣ a área a repintar: a coroa + a sombra dela. Caixa com folga, que ali o pano
#    é liso (o vinco do ombro passa bem acima).
FOLGA = 9
X0, X1 = max(0, x - FOLGA), min(W, x + w + FOLGA)
Y0, Y1 = max(0, y - FOLGA), min(H, y + h + FOLGA)
alvo = np.zeros((H, W), bool)
alvo[Y0:Y1, X0:X1] = True

# 3️⃣ o pano LIMPO em volta, pra ajustar a superfície
viz = np.zeros((H, W), bool)
viz[max(0, Y0 - 26):min(H, Y1 + 26), max(0, X0 - 26):min(W, X1 + 26)] = True
limpos = viz & ~alvo & (alfa >= 200)
print(f'pano limpo usado no ajuste: {int(limpos.sum())} px')

yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
cx, cy = (X0 + X1) / 2, (Y0 + Y1) / 2
Xn, Yn = (xx - cx) / 60.0, (yy - cy) / 60.0
base = [np.ones_like(Xn), Xn, Yn, Xn * Xn, Xn * Yn, Yn * Yn]
A = np.stack([bb[limpos] for bb in base], axis=1)

# 🪶 desvanece na margem: cheio no miolo, suave na beirada — e a beirada já é pano
#    limpo dos dois lados, então a troca acontece onde ninguém vê.
nucleo = np.zeros((H, W), np.uint8)
nucleo[Y0 + 5:Y1 - 5, X0 + 5:X1 - 5] = 255
mistura = np.maximum(cv2.GaussianBlur(alvo.astype(np.float32), (0, 0), 4.0),
                     nucleo.astype(np.float32) / 255.0)
mistura = np.clip(cv2.GaussianBlur(mistura, (0, 0), 1.2), 0, 1)[..., None]

rng = np.random.default_rng(29)
novo = np.empty_like(rgb)
for c in range(3):
    coef, *_ = np.linalg.lstsq(A, rgb[:, :, c][limpos], rcond=None)
    sup = sum(k * bb for k, bb in zip(coef, base))
    grao = float(np.std(rgb[:, :, c][limpos] - sup[limpos]))
    novo[:, :, c] = np.clip(sup + rng.normal(0, grao * 0.8, (H, W)), 0, 255)
out = np.clip(novo * mistura + rgb * (1 - mistura), 0, 255).astype(np.uint8)

# 4️⃣ confere que não sobrou dourado na área
r2, g2, b2 = out[:, :, 0].astype(int), out[:, :, 1].astype(int), out[:, :, 2].astype(int)
sobrou = int((((r2 > 140) & (g2 > 110) & (r2 - b2 > 60)) & alvo).sum())
print(f'dourado que sobrou na área: {sobrou} px')
Image.fromarray(np.dstack([out, alfa.astype(np.uint8)])).save(SAIDA)
print(f'salvo: {SAIDA}')
