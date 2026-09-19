#!/usr/bin/env python3
# ⚽🥋 RECORTE DA PRANCHA DO WHITE THIGS DO GUGU — o 1º BATISMO DA HISTÓRIA.
#
# Ordem do Diego (18/09): *"atualize o time White Thigs do GuGu"*, com a prancha
# do dono. O clube é o primeiro batismo que o jogo teve e, até hoje, o ÚNICO sem
# arte nenhuma: não tinha escudo, nem mascote, nem manto, nem camisa na Loja —
# estava até na lista de escondidos do Salão. Esta prancha fecha isso.
#
# A prancha: escudo (esquerda) · mascote sentado no bloco "COXA SEMPRE" com a
# bandeira atrás (meio) · camisa branca de listras verdes (direita).
#
# Técnica: a MESMA do Pesadelo Verde — corte por LIGAÇÃO, não por cor. O fundo é a
# mancha cor-de-chroma que ENCOSTA NA BORDA; verde igualzinho que esteja DENTRO do
# desenho (e aqui tem MUITO: o clube é verde-e-branco) não encosta na borda e fica.
# Cortar por "verde forte" comeria o manto do bicho e as listras da camisa.
#
# ⚠️ A BANDEIRA atrás do mascote é peça ligada por um mastro fino — o passe de
# "encosta, entra" (dilatação 29×29) traz ela junto, como tem que ser.
#
# Rodar: python3 scripts/recorta-prancha-gugu.py <prancha.png>
import sys, os, numpy as np
from PIL import Image
from scipy import ndimage as ndi

SRC = sys.argv[1]
im = Image.open(SRC).convert('RGBA')
a = np.array(im).astype(np.int16)
R, G, B = a[..., 0], a[..., 1], a[..., 2]

# 🎯 a cor do fundo: a mais comum da imagem (medida, não chutada)
cores, contagem = np.unique(a[..., :3].reshape(-1, 3), axis=0, return_counts=True)
ref = cores[contagem.argmax()]
print('cor do chroma (medida):', tuple(int(v) for v in ref), f'— {contagem.max()/a[...,0].size:.0%} da prancha')
dist = np.abs(a[..., :3] - ref).sum(axis=2)
corDeFundo = dist <= 60

# 1️⃣ FUNDO = cor-de-chroma LIGADA À BORDA
lab, n = ndi.label(corDeFundo)
naBorda = set(lab[0, :]) | set(lab[-1, :]) | set(lab[:, 0]) | set(lab[:, -1])
naBorda.discard(0)
fundo = np.isin(lab, list(naBorda))

# 2️⃣ BURACOS PRESOS (o vão do braço, o miolo do escudo): só some se for GRANDE,
#    pra não comer sombra esverdeada do desenho
presos = corDeFundo & ~fundo
labp, np_ = ndi.label(presos)
if np_:
    tamp = np.array(ndi.sum(presos, labp, range(1, np_ + 1)))
    grandes = [i + 1 for i, t in enumerate(tamp) if t > 900]
    if grandes: fundo |= np.isin(labp, grandes)

alpha = np.where(fundo, 0, 255).astype(np.uint8)

# 🧴 DESPILL SÓ NA FRANJA (2px pra dentro): tira o verde que vazou no contorno.
#    Fora da franja a arte fica INTACTA — é o que salva o verde do clube.
dentro = ~fundo
franja = dentro & ~ndi.binary_erosion(dentro, np.ones((5, 5), bool))
vazou = franja & ((G - np.maximum(R, B)) > 25)
G[vazou] = np.maximum(R, B)[vazou]
a[..., 1] = G

# 🧹 POEIRA DE CHROMA: sobra um punhado de pixels verdes-neon soltos DENTRO do
# desenho (serrilha das bordas internas — medidos: 88 na mascote, 5 no escudo).
# Some a olho nu sobre verde, mas sobre o CREME do jogo vira sujeira — e foi assim
# que o retângulo cinza apareceu entre as pernas da águia do Skyy FC.
# Aqui NÃO se apaga (buraco é pior): puxa o verde pra baixo, que é despill.
neon = (alpha > 40) & (G > 180) & (R < 120) & (B < 140)
if neon.any():
    print('poeira de chroma limpa por despill:', int(neon.sum()), 'px')
    a[..., 1] = np.where(neon, np.maximum(R, B), a[..., 1])

full = Image.fromarray(np.dstack([a[..., 0], a[..., 1], a[..., 2], alpha]).astype(np.uint8), 'RGBA')

# 3️⃣ as 3 peças: as maiores manchas ligadas, ordenadas da esquerda pra direita
solido = alpha > 40
lab2, n2 = ndi.label(solido)
tam = np.array(ndi.sum(solido, lab2, range(1, n2 + 1)))
tres = sorted((int(i) + 1 for i in np.argsort(tam)[-3:]), key=lambda i: ndi.center_of_mass(lab2 == i)[1])
fatias = ndi.find_objects(lab2)
mascaras = []
for i in tres:
    ys, xs = fatias[i - 1]
    m = (lab2 == i)
    perto = ndi.binary_dilation(m, np.ones((29, 29), bool))  # só o que ENCOSTA entra
    for j in range(1, n2 + 1):
        if j in tres or tam[j - 1] < 40: continue
        cy, cx = ndi.center_of_mass(lab2 == j)
        if not (ys.start <= cy < ys.stop and xs.start <= cx < xs.stop): continue
        if (perto & (lab2 == j)).any(): m |= (lab2 == j)
    mascaras.append(m)
print('peças (x do centro):', [round(ndi.center_of_mass(m)[1]) for m in mascaras])
assert len(mascaras) == 3, f'esperava 3 peças, achei {len(mascaras)}'

def corta(m):
    arr = np.array(full).copy()
    arr[..., 3] = np.where(m, arr[..., 3], 0)
    p = Image.fromarray(arr, 'RGBA')
    al = np.array(p)[..., 3]
    # ⚠️ o bbox CRU MENTE (erro do Papão): exige 3px na linha/coluna, corte de alfa 40
    linhas = np.where((al >= 40).sum(axis=1) >= 3)[0]
    cols = np.where((al >= 40).sum(axis=0) >= 3)[0]
    p = p.crop((cols[0], linhas[0], cols[-1] + 1, linhas[-1] + 1))
    arr = np.array(p); arr[..., 3] = np.where(arr[..., 3] < 40, 0, arr[..., 3])
    return Image.fromarray(arr, 'RGBA')

def salva(img, destino, altura, teto_kb):
    os.makedirs(os.path.dirname(destino), exist_ok=True)
    w = round(img.width * altura / img.height)
    r = img.resize((w, altura), Image.LANCZOS)
    for q in (88, 84, 80, 76, 72, 68):
        r.save(destino, 'WEBP', quality=q, method=6)
        kb = os.path.getsize(destino) / 1024
        if kb <= teto_kb: break
    print(f'{destino}  {w}x{altura}  {kb:.1f} KB  (q={q})')
    return w, altura

escudo, mascote, camisa = [corta(m) for m in mascaras]
salva(escudo, 'src/escalacao/img/gugu-escudo.webp', 360, 30)
salva(mascote, 'src/escalacao/img/gugu-mascote.webp', 440, 45)
salva(camisa, 'scripts/kits/gugu-camisa.webp', 620, 200)
