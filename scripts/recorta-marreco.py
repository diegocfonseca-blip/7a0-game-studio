#!/usr/bin/env python3
# ─── 🦆 RECORTE DA ARTE DO MARRECO FC (batismo, 19/09) ──────────────────────
#
# O Diego mandou a prancha do Marreco FC (escudo + mascote + camisa) sobre FUNDO
# VERDE CHROMA (#01F748), não transparente.
#
# ⚠️ O PERIGO DESTE RECORTE, e o motivo de ele ter script próprio: **o clube É
#    VERDE**. O escudo, a camisa e o uniforme da mascote são verde-ESCURO, e tem
#    grama verde-média no pé da mascote. Um corte por "tira tudo que é verde"
#    comeria metade do desenho.
#
# Como este script se protege:
#  1. 🎯 O ALVO É SÓ O VERDE CHROMA — claro (g > 150) e absurdamente mais verde
#     que vermelho/azul. O verde do clube (≈ #0E4A2E) e a grama (≈ #2D5A2A) têm
#     g < 100: passam longe do corte.
#  2. 🕳️ APAGA O VERDE PRESO TAMBÉM. Na 1ª tentativa eu só inundei a partir da
#     borda, e sobrou um BLOCO VERDE entre as pernas da mascote (atrás da placa) —
#     exatamente o erro do Skyy FC (23/08), o retângulo entre as pernas da águia.
#     Aqui dá pra apagar todo o chroma sem medo justamente por causa do item 1.
#  3. ✂️ SEPARA AS PEÇAS POR DESENHO, não por régua. Cortar a prancha em três
#     faixas fixas levava um naco do escudo junto com a mascote. Agora acha as
#     ILHAS de desenho (componentes) e agrupa por posição — cada peça sai inteira.
#  4. 💨 TIRA O DERRAME (a franja esverdeada da borda do chroma).
#  5. 📏 Mede a caixa com alfa ≥ 40 e pelo menos 3 px na linha/coluna: o bbox CRU
#     MENTE (erro do Papão, 23/08) — poeira de alfa devolve o arquivo inteiro.
#
# uso: python3 scripts/recorta-marreco.py <prancha.png> <pasta-de-saida>
import sys
import numpy as np
import cv2
from PIL import Image

ORIG, SAIDA = sys.argv[1], sys.argv[2]
im = np.array(Image.open(ORIG).convert('RGB')).astype(np.int16)
H, W, _ = im.shape
r, g, b = im[:, :, 0], im[:, :, 1], im[:, :, 2]

# 1️⃣ + 2️⃣ o fundo é TODO o verde chroma, preso ou não
chroma = (g > 150) & (g - r > 80) & (g - b > 60)
print(f'fundo chroma: {100 * chroma.mean():.1f}% do quadro')
alfa = np.where(chroma, 0, 255).astype(np.uint8)

# 4️⃣ DERRAME: na faixa que encosta no fundo, puxa o verde pro nível do maior dos
#    outros canais. Tira a franja sem lavar o verde-escuro (que fica bem abaixo).
rgb = im.copy()
borda = cv2.dilate(chroma.astype(np.uint8), np.ones((5, 5), np.uint8)) > 0
borda &= ~chroma
teto = np.maximum(rgb[:, :, 0], rgb[:, :, 2])
derrama = borda & (rgb[:, :, 1] > teto + 25)
rgb[:, :, 1] = np.where(derrama, teto + 25, rgb[:, :, 1])
print(f'franja verde limpa em {int(derrama.sum())} px')
rgba = np.dstack([rgb.astype(np.uint8), alfa])

# 3️⃣ SEPARA POR DESENHO: acha as ilhas e junta as que estão na mesma peça
n, rot, stats, _ = cv2.connectedComponentsWithStats((alfa >= 40).astype(np.uint8), 8)
ilhas = [(stats[i, cv2.CC_STAT_LEFT], stats[i, cv2.CC_STAT_TOP],
          stats[i, cv2.CC_STAT_WIDTH], stats[i, cv2.CC_STAT_HEIGHT],
          stats[i, cv2.CC_STAT_AREA], i) for i in range(1, n)]
ilhas = [x for x in ilhas if x[4] >= 300]          # poeira fora

# ⚠️ AS TRÊS PEÇAS QUASE SE ENCOSTAM na prancha (o vão entre elas é de ~6 px), e
# cada uma ainda tem um halo escuro de 2 px pra fora. Juntar "ilhas vizinhas na
# horizontal" com qualquer folga grudava tudo numa peça só, e cortar por régua
# levava um naco do escudo junto com a mascote.
# 👉 Então: as TRÊS MAIORES ilhas são os corpos (escudo, mascote, camisa), e cada
#    pedacinho solto (a placa, a bola, o capim, o cabelo) vai pro corpo de quem
#    ele mais se sobrepõe na horizontal. Isso não depende de vão nenhum.
corpos = sorted(sorted(ilhas, key=lambda x: -x[4])[:3], key=lambda x: x[0])
grupos = [{'x0': c[0], 'x1': c[0] + c[2], 'y0': c[1], 'y1': c[1] + c[3], 'area': c[4], 'idx': [c[5]]} for c in corpos]
for x0, y0, w, h, a_, idx in ilhas:
    if any(idx in gp['idx'] for gp in grupos):
        continue
    cx = x0 + w / 2
    # quem cobre este pedaço na horizontal; se nenhum cobrir, o de centro mais perto
    dono = next((gp for gp in grupos if gp['x0'] - 12 <= cx <= gp['x1'] + 12), None)
    if dono is None:
        dono = min(grupos, key=lambda gp: abs((gp['x0'] + gp['x1']) / 2 - cx))
    dono['idx'].append(idx)
    dono['x0'] = min(dono['x0'], x0); dono['x1'] = max(dono['x1'], x0 + w)
    dono['y0'] = min(dono['y0'], y0); dono['y1'] = max(dono['y1'], y0 + h)
    dono['area'] += a_
print(f'peças achadas: {len(grupos)}  ·  pedaços soltos distribuídos: {len(ilhas) - 3}')

NOMES = ['escudo', 'mascote', 'camisa']
assert len(grupos) == 3, f'esperava 3 peças, achei {len(grupos)} — conferir a prancha'
for nome, gp in zip(NOMES, grupos):
    # só os pixels DESTA peça (senão o pedaço do vizinho vem junto no retângulo)
    so = np.isin(rot, gp['idx'])
    a2 = np.where(so, alfa, 0)
    m = a2 >= 40
    lin = np.where(m.sum(axis=1) >= 3)[0]
    col = np.where(m.sum(axis=0) >= 3)[0]
    y0, y1, x0, x1 = lin[0], lin[-1] + 1, col[0], col[-1] + 1
    peca = np.dstack([rgb[y0:y1, x0:x1].astype(np.uint8), a2[y0:y1, x0:x1].astype(np.uint8)])
    img = Image.fromarray(peca)
    img.save(f'{SAIDA}/marreco-{nome}-cru.png')
    # 📏 quanto de moldura vazia sobrou (o mockup-batismo reclama a partir de 4%)
    cheio = (a2[y0:y1, x0:x1] >= 40).mean()
    print(f'{nome}: {img.width}x{img.height} · desenho ocupa {100 * cheio:.0f}% da caixa')
