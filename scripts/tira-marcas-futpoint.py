#!/usr/bin/env python3
# ─── 👟❌ TIRA AS MARCAS DE TERCEIRO DA ARTE DO FUTPOINT FC (19/09) ──────────
#
# A arte que o dono mandou veio com o **símbolo da Nike nas duas chuteiras** da
# mascote (o risco branco com o contorno dourado). É marca registrada de outra
# empresa e ia entrar no jogo dentro do arquivo do mascote, visto por todo
# jogador — então sai, como já saiu o letreiro da bola de ouro.
# 👉 O QUE SAI: só o risco (branco + o dourado colado nele).
# 👉 O QUE FICA: a chuteira preta inteira, o friso dourado da sola, as travas
#    douradas, o cadarço, o "FP" do calcanhar — nada disso é da Nike.
#
# 🧵 COMO APAGA: não é borrão. O couro ali é preto com brilho e grão fino, e o
#    que funciona é RECONSTRUIR: ajusta uma superfície quadrática nos pixels
#    ESCUROS de couro em volta da janela, repinta por cima com o mesmo grão e
#    desvanece na margem. Mesma receita que apagou o letreiro da bola de ouro
#    (19/09) e a coroa do peito da camisa do Marreco.
#
# uso: python3 scripts/tira-marcas-futpoint.py <mascote.png> <saida.png>
import sys
import numpy as np
import cv2
from PIL import Image

ORIG, SAIDA = sys.argv[1], sys.argv[2]
im = np.array(Image.open(ORIG).convert('RGBA'))
rgb, alfa = im[:, :, :3].astype(np.float32), im[:, :, 3]
H, W = alfa.shape
assert (W, H) == (510, 787), f'janelas medidas no recorte 510x787; veio {W}x{H} — remedir antes'

# as duas janelas, medidas na lupa (x0, y0, x1, y1)
JANELAS = [
    ('chuteira de trás', 326, 592, 405, 631),
    ('chuteira da frente', 136, 697, 194, 751),
]

out = rgb.copy()

yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)

for nome, X0, Y0, X1, Y1 in JANELAS:
    alvo = np.zeros((H, W), bool)
    alvo[Y0:Y1, X0:X1] = True

    # o couro LIMPO em volta: anel de 22 px, só o que é escuro (couro) e opaco.
    # Dourado e branco de fora ficam de fora do ajuste pra não puxar cor.
    viz = np.zeros((H, W), bool)
    viz[max(0, Y0 - 22):min(H, Y1 + 22), max(0, X0 - 22):min(W, X1 + 22)] = True
    v = out.max(axis=2)
    limpos = viz & ~alvo & (alfa >= 200) & (v < 95)
    print(f'{nome}: couro usado no ajuste = {int(limpos.sum())} px')
    assert limpos.sum() >= 400, 'couro de menos em volta — conferir a janela'

    cx, cy = (X0 + X1) / 2, (Y0 + Y1) / 2
    Xn, Yn = (xx - cx) / 40.0, (yy - cy) / 40.0
    base = [np.ones_like(Xn), Xn, Yn, Xn * Xn, Xn * Yn, Yn * Yn]
    A = np.stack([bb[limpos] for bb in base], axis=1)

    # 🪶 desvanece na margem (cheio no miolo, suave na beirada)
    nucleo = np.zeros((H, W), np.uint8)
    nucleo[Y0 + 4:Y1 - 4, X0 + 4:X1 - 4] = 255
    mist = np.maximum(cv2.GaussianBlur(alvo.astype(np.float32), (0, 0), 3.0),
                      nucleo.astype(np.float32) / 255.0)
    mist = np.clip(cv2.GaussianBlur(mist, (0, 0), 1.1), 0, 1)[..., None]

    # ⚠️ AQUI **NÃO ENTRA GRÃO** — e isso é o contrário do que fizemos na bola de
    #    ouro e na coroa do Marreco. Lá o fundo era pano claro com grão visível;
    #    aqui é couro PRETO, onde o grão que a conta estima vem dos vincos e do
    #    brilho da chuteira, não do grão de verdade. Com ruído, as duas janelas
    #    viraram dois retângulos CHUVISCADOS bem visíveis (testei: colorido, feio).
    #    Só a superfície já fecha sem emenda — conferido na lupa 3×.
    novo = np.empty_like(out)
    for c in range(3):
        coef, *_ = np.linalg.lstsq(A, out[:, :, c][limpos], rcond=None)
        novo[:, :, c] = np.clip(sum(k * bb for k, bb in zip(coef, base)), 0, 255)
    out = np.clip(novo * mist + out * (1 - mist), 0, 255)

    # confere que não sobrou branco nem dourado dentro da janela
    r2, g2, b2 = out[:, :, 0], out[:, :, 1], out[:, :, 2]
    sobra = int((((r2 > 150) & (g2 > 140)) & alvo).sum())
    print(f'{nome}: branco/dourado que sobrou = {sobra} px')

Image.fromarray(np.dstack([out.astype(np.uint8), alfa])).save(SAIDA)
print(f'salvo: {SAIDA}')
