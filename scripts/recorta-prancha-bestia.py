#!/usr/bin/env python3
# 🐴 RECORTE DA PRANCHA DO LA BESTIA NEGRA (eltonfrossard45, 18/09).
#
# A prancha veio em fundo CHROMA VERDE (3,250,5), com escudo · mascote · camisa.
# Caso fácil, e vale registrar por quê: a arte é PRETO E BRANCO inteira, então
# nenhum pixel do desenho tem verde dominante — dá pra cortar por "verde muito
# maior que vermelho e azul" sem risco de comer parte do bicho (o sufoco do
# Marinheiros, que era um PORCO VERDE em chroma verde, aqui não existe).
#
# O que ele faz, na ordem:
#  1. alfa por dominância de verde + despill só na FRANJA (2 px da borda)
#  2. separa as 3 peças pelos VÃOS de coluna
#  3. recorta com corte de alfa >= 40 e exigindo >= 3 px na linha/coluna
#     (o bbox cru MENTE — poeira de alfa invisível devolve o arquivo inteiro)
#  4. salva nos tamanhos e tetos do batismo: escudo 360px/30KB · mascote
#     440px/45KB · camisa 620px (a camisa é do POST, não entra no bundle)
#
# Rodar: python3 scripts/recorta-prancha-bestia.py <prancha.png>
import sys, numpy as np
from PIL import Image

SRC = sys.argv[1] if len(sys.argv) > 1 else '/root/.claude/uploads/bestia.png'
im = Image.open(SRC).convert('RGBA')
a = np.array(im).astype(np.int16)
R, G, B = a[..., 0], a[..., 1], a[..., 2]

# 1️⃣ chroma = verde manda em cima do vermelho E do azul, com folga
chroma = (G > 120) & (G - np.maximum(R, B) > 45)
alpha = np.where(chroma, 0, 255).astype(np.uint8)

# despill só na FRANJA: 2 px pra dentro da borda do desenho. Fora da franja a
# arte fica INTACTA — é o que evita comer o cinza do desenho.
from scipy import ndimage
dentro = ~chroma
franja = dentro & ~ndimage.binary_erosion(dentro, np.ones((5, 5), bool))
verde_demais = franja & (G - np.maximum(R, B) > 12)
m = np.maximum(R, B)[verde_demais]
G[verde_demais] = m
a[..., 1] = G

out = np.dstack([a[..., 0], a[..., 1], a[..., 2], alpha]).astype(np.uint8)
full = Image.fromarray(out, 'RGBA')

# 2️⃣ separa as 3 peças por MANCHAS LIGADAS, não por coluna vazia.
# ⚠️ Por coluna vazia NÃO FUNCIONA nesta prancha: a crina e o rabo do cavalo
# esticam pros lados e o JPEG deixa uma poeira fininha de pixels no vão inteiro,
# então nenhuma coluna chega a zerar (medido: a coluna mais vazia do meio ainda
# tinha 187 pixels). Manchas ligadas ignoram a poeira: a gente fica só com os
# borrões grandes e agrupa pelo x de cada um.
from scipy import ndimage as ndi
solido = alpha > 40
lab, n = ndi.label(solido)
tam = np.array(ndi.sum(solido, lab, range(1, n + 1)))
# as 3 MAIORES manchas são o escudo, o mascote e a camisa
tres = sorted((int(i) + 1 for i in np.argsort(tam)[-3:]), key=lambda i: ndi.center_of_mass(lab == i)[1])
fatias = ndi.find_objects(lab)
# cada peça leva junto as manchinhas soltas que caem DENTRO da janela dela
# (grama, bola, ponta de coroa) — senão o recorte perde pedaço do desenho.
mascaras = []
for i in tres:
    ys, xs = fatias[i - 1]
    m = (lab == i)
    # ⚠️ "CAIU DENTRO DA JANELA" NÃO BASTA (erro pego no La Bestia Negra, 18/09):
    # uma sujeirinha solta do lado do escudo entrava porque o centro dela caía no
    # retângulo da peça — e aí ela ESTICA a moldura, que é exatamente o defeito do
    # Papão (arte encaixada pequena dentro da janela, porque o arquivo tem vazio).
    # Regra certa: a manchinha só entra se ENCOSTAR no desenho (até ~14 px). Assim
    # entram grama, bola e ponta de coroa — e ficam de fora os respingos.
    perto = ndi.binary_dilation(m, np.ones((29, 29), bool))
    for j in range(1, n + 1):
        if j in tres or tam[j - 1] < 40: continue
        cy, cx = ndi.center_of_mass(lab == j)
        if not (ys.start <= cy < ys.stop and xs.start <= cx < xs.stop): continue
        if (perto & (lab == j)).any(): m |= (lab == j)
    mascaras.append(m)
print('peças encontradas (x do centro):', [round(ndi.center_of_mass(m)[1]) for m in mascaras])
assert len(mascaras) == 3

def corta(m):
    """recorte HONESTO: alfa >= 40 e pelo menos 3 px na linha/coluna.
    ⚠️ Corta pela MÁSCARA da peça, não por uma faixa de x: aqui as janelas do
    escudo e do mascote se CRUZAM (a crina do cavalo passa por cima do escudo),
    então corte reto levaria pedaço do vizinho junto."""
    arr0 = np.array(full).copy()
    arr0[..., 3] = np.where(m, arr0[..., 3], 0)
    p = Image.fromarray(arr0, 'RGBA')
    al = np.array(p)[..., 3]
    linhas = np.where((al >= 40).sum(axis=1) >= 3)[0]
    cols = np.where((al >= 40).sum(axis=0) >= 3)[0]
    p = p.crop((cols[0], linhas[0], cols[-1] + 1, linhas[-1] + 1))
    # apaga a poeira de alfa que sobra (1-40): ela mente pro navegador também
    arr = np.array(p); arr[..., 3] = np.where(arr[..., 3] < 40, 0, arr[..., 3])
    return Image.fromarray(arr, 'RGBA')

def salva(img, destino, altura, teto_kb):
    w = round(img.width * altura / img.height)
    r = img.resize((w, altura), Image.LANCZOS)
    for q in (88, 84, 80, 76, 72):
        r.save(destino, 'WEBP', quality=q, method=6)
        import os; kb = os.path.getsize(destino) / 1024
        if kb <= teto_kb: break
    print(f'{destino}  {w}x{altura}  {kb:.1f} KB  (q={q})')

escudo, mascote, camisa = [corta(m) for m in mascaras]
salva(escudo, 'src/escalacao/img/bestia-escudo.webp', 360, 30)
salva(mascote, 'src/escalacao/img/bestia-mascote.webp', 440, 45)
salva(camisa, 'scripts/kits/bestia-camisa.webp', 620, 200)
