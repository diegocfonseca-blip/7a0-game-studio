#!/usr/bin/env python3
# 🦅🔴⚫ RECORTE DA PRANCHA DO FABULOUS EC (koeppfabio, batismo de 23/09).
#
# A prancha tem TRÊS peças sobre chroma verde: o escudo (esq.), o mascote — uma
# águia/urubu de asas abertas com a garra na bola (centro) — e a camisa (dir.).
#
# ⚠️ AQUI O CHROMA É SEGURO, e o motivo importa: o clube é VERMELHO, PRETO e
# PRATA — não tem um pixel de verde no desenho. Em clube que tem verde isso
# comeria a arte (ver Pesadelo Verde), então este script NÃO serve de modelo
# cego: antes de reusar, conferir a paleta do clube.
#
# ⚠️ E O BBOX CRU MENTE (erro do Papão, 23/08): depois de tirar o fundo sobra
# POEIRA DE ALFA (pixels de alfa 1–40, invisíveis a olho nu) espalhada pela
# moldura, e o `getbbox()` devolve o arquivo inteiro — a arte sai pequena dentro
# da janela do jogo. Aqui o corte é medido com alfa ≥ 40 E exigindo ≥ 3 pixels
# na linha/coluna (um pixel solto também mente).
#
# Rodar: python3 scripts/recorta-prancha-fabulous.py <prancha.png>
import sys, numpy as np
from PIL import Image
from scipy import ndimage as ndi

SRC = sys.argv[1] if len(sys.argv) > 1 else 'prancha.png'
im = Image.open(SRC).convert('RGBA')
a = np.array(im).astype(np.int16)
R, G, B = a[..., 0], a[..., 1], a[..., 2]

# 🎯 a cor EXATA do fundo desta prancha (medida: 1,248,101)
ref = np.array([1, 248, 101])
dist = np.abs(a[..., :3] - ref).sum(axis=2)
corDeFundo = dist <= 110

# 1️⃣ FUNDO = chroma LIGADO À BORDA (verde preso DENTRO do desenho fica)
lab, n = ndi.label(corDeFundo)
naBorda = set(lab[0, :]) | set(lab[-1, :]) | set(lab[:, 0]) | set(lab[:, -1])
naBorda.discard(0)
fundo = np.isin(lab, list(naBorda))

# 2️⃣ BURACOS PRESOS: o vão entre as penas abertas da asa, o miolo do escudo, o
#    vão do decote da camisa. Só some se for GRANDE, pra não comer sombra.
presos = corDeFundo & ~fundo
labp, np_ = ndi.label(presos)
if np_:
    tamp = np.array(ndi.sum(presos, labp, range(1, np_ + 1)))
    grandes = [i + 1 for i, t in enumerate(tamp) if t > 700]
    if grandes: fundo |= np.isin(labp, grandes)

alpha = np.where(fundo, 0, 255).astype(np.uint8)

# 🧴 DESPILL SÓ NA FRANJA (2 px pra dentro): tira o verde que vazou na borda.
# Fora da franja a arte fica INTACTA — o vermelho e o prata não podem ser tocados.
dentro = ~fundo
franja = dentro & ~ndi.binary_erosion(dentro, np.ones((5, 5), bool))
vazou = franja & ((G - np.maximum(R, B)) > 25)
G[vazou] = np.maximum(R, B)[vazou]
a[..., 1] = G
rgba = np.dstack([a[..., 0], a[..., 1], a[..., 2], alpha]).astype(np.uint8)

# 3️⃣ AS PEÇAS, escolhidas pela POSIÇÃO (é o desenho da prancha), nunca pelo
#    tamanho às cegas: escudo à esquerda, mascote no meio, camisa à direita.
solido = alpha > 40
lab2, n2 = ndi.label(solido)
tam = np.array(ndi.sum(solido, lab2, range(1, n2 + 1)))
H, W = alpha.shape
cent = {i + 1: ndi.center_of_mass(lab2 == (i + 1)) for i in range(n2) if tam[i] > 400}

escudo = max((i for i in cent if cent[i][1] < W / 3), key=lambda i: tam[i - 1], default=None)
camisa = max((i for i in cent if cent[i][1] > 0.72 * W), key=lambda i: tam[i - 1], default=None)
# mascote = TODO O RESTO (a águia + os cacos de pedra que saltam da bola, que
# fazem parte do desenho — são o impacto da garra)
resto = [i for i in range(1, n2 + 1) if i not in (escudo, camisa) and tam[i - 1] > 1]

def salva(mascara, nome):
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
    out.save(f'/tmp/fabulous-{nome}.png')
    print(f'   ✂️ {nome}: {out.size[0]}×{out.size[1]}')

def junta(idx):
    """cola as manchinhas vizinhas (brilho solto, caco de pedra) na peça"""
    m = (lab2 == idx)
    perto = ndi.binary_dilation(m, np.ones((9, 9), bool))
    for j in range(1, n2 + 1):
        if j == idx or tam[j - 1] < 60: continue
        if (perto & (lab2 == j)).any(): m |= (lab2 == j)
    return m

if escudo: salva(junta(escudo), 'escudo')
if camisa: salva(junta(camisa), 'camisa')
mascote = np.zeros_like(solido)
for i in resto: mascote |= (lab2 == i)
salva(mascote, 'mascote')

print('\n✅ peças cruas em /tmp/fabulous-*.png (o redimensionar e o webp vêm depois)')
