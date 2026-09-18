#!/usr/bin/env python3
# 🌑🐺 RECORTE DA PRANCHA DO PESADELO VERDE FC (portaltech.ep, batismo de 18/09).
#
# ⚠️ ESTA É A PRANCHA DIFÍCIL: o desenho é VERDE e o chroma é VERDE. O lobo tem
# raio verde, a lua tem halo verde e o pelo tem reflexo verde — medido, existem
# 5.319 pixels do PELO e 3.553 do HALO a menos de 60 de distância da cor exata do
# fundo. Cortar por "verde forte" (o jeito das outras pranchas) comeria o brilho
# do bicho, que é justamente a identidade do clube. É o sufoco do Marinheiros
# (porco verde em chroma verde), só que pior.
#
# A SAÍDA: não cortar por COR, e sim por LIGAÇÃO — o fundo é a mancha de cor-de-
# chroma que ENCOSTA NA BORDA da imagem. Verde igualzinho que esteja DENTRO do
# desenho não encosta em borda nenhuma, então fica. Duas passadas:
#   1. fundo = manchas cor-de-chroma ligadas à borda  → vira transparente
#   2. buracos PRESOS (entre as pernas, dentro do brasão) só saem se forem
#      grandes e chroma de ponta a ponta — assim pelo/pena escura não some junto
#
# Rodar: python3 scripts/recorta-prancha-pesadelo.py <prancha.png>
import sys, os, numpy as np
from PIL import Image
from scipy import ndimage as ndi

SRC = sys.argv[1]
im = Image.open(SRC).convert('RGBA')
a = np.array(im).astype(np.int16)
R, G, B = a[..., 0], a[..., 1], a[..., 2]

# 🎯 a cor EXATA do fundo (a mais comum da imagem, medida: 3,242,59)
ref = np.array([3, 242, 59])
dist = np.abs(a[..., :3] - ref).sum(axis=2)
corDeFundo = dist <= 45          # tolerância folgada: o fundo é chapado

# 1️⃣ FUNDO = cor-de-chroma LIGADA À BORDA
lab, n = ndi.label(corDeFundo)
naBorda = set(lab[0, :]) | set(lab[-1, :]) | set(lab[:, 0]) | set(lab[:, -1])
naBorda.discard(0)
fundo = np.isin(lab, list(naBorda))

# 2️⃣ BURACOS PRESOS: chroma cercado por desenho (vão entre as patas, miolo do
#    brasão). Só some se for GRANDE — pra não comer sombra esverdeada do pelo.
presos = corDeFundo & ~fundo
labp, np_ = ndi.label(presos)
if np_:
    tamp = np.array(ndi.sum(presos, labp, range(1, np_ + 1)))
    grandes = [i + 1 for i, t in enumerate(tamp) if t > 900]
    if grandes: fundo |= np.isin(labp, grandes)

alpha = np.where(fundo, 0, 255).astype(np.uint8)

# 🧴 DESPILL SÓ NA FRANJA (2 px pra dentro): tira o verde que "vazou" na borda do
# desenho. Fora da franja a arte fica INTACTA — é o que salva o raio e o halo.
dentro = ~fundo
franja = dentro & ~ndi.binary_erosion(dentro, np.ones((5, 5), bool))
vazou = franja & ((G - np.maximum(R, B)) > 25)
G[vazou] = np.maximum(R, B)[vazou]
a[..., 1] = G
full = Image.fromarray(np.dstack([a[..., 0], a[..., 1], a[..., 2], alpha]).astype(np.uint8), 'RGBA')

# 3️⃣ as 3 peças: as maiores manchas ligadas (o escudo, o lobo e a camisa)
solido = alpha > 40
lab2, n2 = ndi.label(solido)
tam = np.array(ndi.sum(solido, lab2, range(1, n2 + 1)))
tres = sorted((int(i) + 1 for i in np.argsort(tam)[-3:]), key=lambda i: ndi.center_of_mass(lab2 == i)[1])
fatias = ndi.find_objects(lab2)
mascaras = []
for i in tres:
    ys, xs = fatias[i - 1]
    m = (lab2 == i)
    perto = ndi.binary_dilation(m, np.ones((29, 29), bool))  # só encosta entra (ver La Bestia Negra)
    for j in range(1, n2 + 1):
        if j in tres or tam[j - 1] < 40: continue
        cy, cx = ndi.center_of_mass(lab2 == j)
        if not (ys.start <= cy < ys.stop and xs.start <= cx < xs.stop): continue
        if (perto & (lab2 == j)).any(): m |= (lab2 == j)
    mascaras.append(m)
print('peças (x do centro):', [round(ndi.center_of_mass(m)[1]) for m in mascaras])
assert len(mascaras) == 3

def corta(m):
    arr = np.array(full).copy()
    arr[..., 3] = np.where(m, arr[..., 3], 0)
    p = Image.fromarray(arr, 'RGBA')
    al = np.array(p)[..., 3]
    linhas = np.where((al >= 40).sum(axis=1) >= 3)[0]   # o bbox CRU mente: exige 3px
    cols = np.where((al >= 40).sum(axis=0) >= 3)[0]
    p = p.crop((cols[0], linhas[0], cols[-1] + 1, linhas[-1] + 1))
    arr = np.array(p); arr[..., 3] = np.where(arr[..., 3] < 40, 0, arr[..., 3])
    return Image.fromarray(arr, 'RGBA')

def salva(img, destino, altura, teto_kb):
    w = round(img.width * altura / img.height)
    r = img.resize((w, altura), Image.LANCZOS)
    for q in (88, 84, 80, 76, 72, 68):
        r.save(destino, 'WEBP', quality=q, method=6)
        kb = os.path.getsize(destino) / 1024
        if kb <= teto_kb: break
    print(f'{destino}  {w}x{altura}  {kb:.1f} KB  (q={q})')

escudo, mascote, camisa = [corta(m) for m in mascaras]
salva(escudo, 'src/escalacao/img/pesadelo-escudo.webp', 360, 30)
salva(mascote, 'src/escalacao/img/pesadelo-mascote.webp', 440, 45)
salva(camisa, 'scripts/kits/pesadelo-camisa.webp', 620, 200)
