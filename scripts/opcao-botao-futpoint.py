#!/usr/bin/env python3
# ─── ▶️ O BOTÃO DE PLAY DA MÃO DO PONTINHO — versão nas cores do clube ───────
#
# A arte nova do Futpoint FC (19/09) tem a mascote segurando o **botão vermelho
# do YouTube**. É a marca de outra empresa, e ela iria dentro do arquivo do
# mascote, que todo jogador baixa e vê (inclusive no carimbo de gol).
# Este script faz a OPÇÃO B pro Diego escolher: o mesmo botão, mesma pose, mesma
# mão — só que **dourado com o play preto**, que são as cores do próprio clube
# (preto/dourado/branco). Não muda desenho nenhum: só troca a cor.
#
# uso: python3 scripts/opcao-botao-futpoint.py <mascote.png> <saida.png>
import sys
import numpy as np
import cv2
from PIL import Image

ORIG, SAIDA = sys.argv[1], sys.argv[2]
im = np.array(Image.open(ORIG).convert('RGBA'))
rgb, alfa = im[:, :, :3].astype(np.float32), im[:, :, 3]
H, W = alfa.shape
r, g, b = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]

# 1️⃣ acha o botão: a ilha VERMELHA grande (não existe outro vermelho no desenho
#    fora a língua, que é bem menor e fica colada na boca)
# ⚠️ o corte tem que pegar TAMBÉM o vermelho ESCURO da sombra embaixo do botão
#    (r ≈ 90): com corte alto sobrava uma tirinha vermelha na barra de baixo.
verm = ((alfa >= 200) & (r > 60) & (r - g > 35) & (r - b > 35)).astype(np.uint8)
verm = cv2.morphologyEx(verm, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
n, rot, st, _ = cv2.connectedComponentsWithStats(verm, 8)
i = max(range(1, n), key=lambda k: st[k, cv2.CC_STAT_AREA])
X0, Y0, w, h = st[i, 0], st[i, 1], st[i, 2], st[i, 3]
print(f'botão achado: {w}x{h} em x {X0}..{X0 + w} · y {Y0}..{Y0 + h} ({st[i, cv2.CC_STAT_AREA]} px)')
assert st[i, cv2.CC_STAT_AREA] > 3000, 'ilha vermelha pequena demais pra ser o botão'

# 2️⃣ a caixa do botão = o vermelho + o buraco de dentro (o triângulo branco)
caixa = np.zeros((H, W), bool)
caixa[Y0:Y0 + h, X0:X0 + w] = True
tile = (rot == i)
# ⚠️ fechamento morfológico NÃO serve pra achar o play: ele tapa só um pedaço do
#    triângulo e a ponta de baixo continuava branca. O que fecha é preencher o
#    CONTORNO do botão e tirar o vermelho — sobra exatamente o buraco de dentro.
cont, _ = cv2.findContours(tile.astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
cheio = np.zeros((H, W), np.uint8)
cv2.drawContours(cheio, cont, -1, 255, cv2.FILLED)
tri = (cheio > 0) & ~tile & caixa        # o play branco no meio

# 3️⃣ 🟡 o vermelho vira DOURADO do clube (#B89040) guardando o sombreado: a luz
#    do desenho é o brilho do vermelho, então ela é reaproveitada como brilho do
#    dourado — nada é repintado chapado.
OURO = np.array([184, 144, 64], np.float32)
out = rgb.copy()
lum = (r * 0.5 + g * 0.3 + b * 0.2)
ref = float(np.median(lum[tile]))
fator = np.clip(lum / max(ref, 1.0), 0.40, 1.75)[..., None]   # guarda o brilho do plástico
sel = tile[..., None]
out = np.where(sel, np.clip(OURO * fator, 0, 255), out)

# 4️⃣ ⬛ o play branco vira PRETO (contraste em cima do dourado)
selt = tri[..., None]
escuro = np.clip(np.array([12, 12, 12], np.float32) + (lum[..., None] - 230) * 0.10, 0, 60)
out = np.where(selt, escuro, out)

Image.fromarray(np.dstack([out.astype(np.uint8), alfa])).save(SAIDA)
print(f'salvo: {SAIDA}  ·  tile {int(tile.sum())} px · play {int(tri.sum())} px')
