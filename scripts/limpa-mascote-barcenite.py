# ─── 🐈 LIMPEZA DA MASCOTE DO BARCENITE FC (16/09) ──────────────────────────
# Duas coisas que a prancha do dono trouxe e não podem entrar no jogo:
#
# 1. 🚫 O SWOOSH DA NIKE nas duas chuteiras. Marca real não entra em arte do jogo.
#    Apagar com cor lisa deixa REMENDO (fica um borrão claro em cima do couro) e
#    interpolar dos vizinhos PUXA VERDE da grama que está logo abaixo do pé — as
#    duas tentativas ficaram piores que o original. O que funciona é transplantar
#    o GRÃO do próprio couro: tira-se o campo de sombra (passa-baixa pesada, só
#    com pixels de couro pesando) e soma-se de volta a textura fina de um pedaço
#    LIMPO da mesma chuteira. Sobra um vinco de couro, não um logo.
#
# 2. 🟩 A POÇA VERDE embaixo dos pés. É croma que sobrou: a sombra da chuteira
#    escureceu o verde do fundo e ele passou pelo piso de brilho do recorte.
#    Esta arte NÃO tem verde nenhum (é azul, amarelo e pelo laranja), então aqui
#    dá pra caçar verde em QUALQUER brilho, sem risco de comer desenho.
from PIL import Image
import numpy as np
from scipy import ndimage
import sys

ENTRADA = sys.argv[1] if len(sys.argv) > 1 else '/tmp/barcenite2/mascote.png'
SAIDA = sys.argv[2] if len(sys.argv) > 2 else '/tmp/barcenite2/mascote-final.png'

# (x0, y0, x1, y1, dx, dy) — a caixa do swoosh e de onde vem o grão limpo
CAIXAS = [(98, 826, 120, 860, -26, 18), (317, 824, 361, 856, 52, 6)]

im = Image.open(ENTRADA)
a = np.asarray(im).astype(np.float32).copy()
R, G, B, A = a[:, :, 0], a[:, :, 1], a[:, :, 2], a[:, :, 3]
lum = .299 * R + .587 * G + .114 * B
ouro = (A >= 40) & (R > 115) & (R - B > 45)          # couro dourado, só ele

buraco = np.zeros(lum.shape, bool)
for (x0, y0, x1, y1, _dx, _dy) in CAIXAS:
    cx = np.zeros(lum.shape, bool); cx[y0:y1, x0:x1] = True
    buraco |= cx & (A >= 40) & (lum < 108)
buraco = ndimage.binary_dilation(buraco, np.ones((3, 3))) & ~ouro
print(f'🚫 swoosh: {buraco.sum()} px')

peso = ouro.astype(np.float32)
low = np.dstack([ndimage.gaussian_filter(a[:, :, c] * peso, 7)
                 / np.maximum(ndimage.gaussian_filter(peso, 7), 1e-6) for c in range(3)])
for (x0, y0, x1, y1, dx, dy) in CAIXAS:
    cx = np.zeros(lum.shape, bool); cx[y0:y1, x0:x1] = True
    h = buraco & cx
    grao = np.roll(np.roll(a[:, :, :3], -dy, 0), -dx, 1) - np.roll(np.roll(low, -dy, 0), -dx, 1)
    ok = np.roll(np.roll(ouro, -dy, 0), -dx, 1)
    for c in range(3):
        a[:, :, c][h & ok] = (low[:, :, c] + grao[:, :, c])[h & ok]
        a[:, :, c][h & ~ok] = low[:, :, c][h & ~ok]

a = a.astype(np.int16)
R, G, B, A = a[:, :, 0], a[:, :, 1], a[:, :, 2], a[:, :, 3]
verde = (A >= 40) & (G - R > 18) & (G - B > 18)
print(f'🟩 poça verde: {verde.sum()} px')
a[:, :, 3] = np.where(verde, 0, A)
resto = (a[:, :, 3] >= 40) & (G - np.maximum(R, B) > 10)
a[:, :, 1] = np.where(resto, np.minimum(G, np.maximum(R, B) + 6), G)

al = a[:, :, 3]
lab, n = ndimage.label(al >= 40, np.ones((3, 3)))
t = ndimage.sum(al >= 40, lab, range(1, n + 1))
al[lab != int(np.argmax(t)) + 1] = 0
a[:, :, 3] = al
sol = al >= 40
lin = np.where(sol.sum(1) >= 3)[0]; col = np.where(sol.sum(0) >= 3)[0]
out = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), 'RGBA').crop(
    (col.min(), lin.min(), col.max() + 1, lin.max() + 1))
out.save(SAIDA)
b = Image.new('RGB', out.size, (244, 236, 214)); b.paste(out, (0, 0), out)
b.save(SAIDA.replace('.png', '-prova.png'))
print(f'✅ {SAIDA}  {out.size[0]}x{out.size[1]}  proporção {out.size[0]/out.size[1]:.4f}')
