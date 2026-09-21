#!/usr/bin/env python3
# ─── 🟩❌ TIRA O RESTO DE CHROMA DA ARTE DO GRÊMIO FBPA (21/09) ──────────────
#
# A prancha do danieldias11 veio em chroma VERDE, e o recorte por ligação com a
# borda deixou franjas: o manto é RASGADO (bordas em tiras), a pena do chapéu é
# recortada e a luva tem vãos — lugares onde o verde fica PRESO em manchinhas
# pequenas demais pro corte de buracos (> 700 px) e sobrevive.
#
# ✅ POR QUE AQUI DÁ PRA SER AGRESSIVO, e no Pesadelo Verde NÃO dava:
#    o Grêmio é AZUL, PRETO e BRANCO — não existe verde nenhum no desenho. Então
#    todo pixel esverdeado é resto de fundo, ponto. (No Pesadelo o bicho ERA
#    verde, e por isso lá o corte teve que ser por ligação, nunca por cor.)
#    ⚠️ Quem for copiar este script pra outro clube: confira a paleta ANTES. Em
#    clube que tem verde de verdade, isto come o desenho.
#
# 🧵 O QUE FAZ: pixel esverdeado vira VÃO (alfa 0) — é fundo aparecendo, não
#    tinta pra repintar. Depois um despill de 2 px na franja nova, pra não
#    sobrar contorno esverdeado na borda do rasgo.
#
# uso: python3 scripts/tira-chroma-gremio.py
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

for nome in ('escudo', 'mascote', 'camisa'):
    arq = f'/tmp/gremio-{nome}.png'
    a = np.array(Image.open(arq).convert('RGBA')).astype(np.int16)
    R, G, B, A = a[..., 0], a[..., 1], a[..., 2], a[..., 3]

    # 1️⃣ o que é verde de fundo (nenhum verde é do desenho neste clube)
    verde = (A > 0) & ((G - np.maximum(R, B)) > 28) & (G > 70)
    antes = int(verde.sum())
    A[verde] = 0

    # 2️⃣ despill na franja NOVA: 2 px pra dentro do que sobrou, puxando o verde
    #    pro nível do vermelho/azul. Sem isto o rasgo do manto fica com contorno
    #    esverdeado, que aparece feio sobre o creme do jogo.
    dentro = A > 40
    franja = dentro & ~ndi.binary_erosion(dentro, np.ones((5, 5), bool))
    vazou = franja & ((G - np.maximum(R, B)) > 12)
    G[vazou] = np.maximum(R, B)[vazou]

    # 3️⃣ e recorta de novo: tirar pixel pode ter encolhido o desenho.
    #    Medido com alfa ≥ 40 e ≥ 3 px na linha/coluna (o bbox cru mente).
    forte = A >= 40
    linhas = np.where(forte.sum(axis=1) >= 3)[0]
    colunas = np.where(forte.sum(axis=0) >= 3)[0]
    A[:] = np.where(A < 40, 0, A)          # 🧹 poeira de alfa
    out = np.dstack([R, G, B, A]).astype(np.uint8)[linhas[0]:linhas[-1] + 1, colunas[0]:colunas[-1] + 1]
    Image.fromarray(out, 'RGBA').save(arq)
    print(f'   🟩 {nome}: {antes} px de chroma viraram vão · ficou {out.shape[1]}×{out.shape[0]}')

print('\n✅ chroma fora. Conferir SOBRE FUNDO CREME (nunca branco) antes de exportar.')
