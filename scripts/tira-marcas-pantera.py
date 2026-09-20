#!/usr/bin/env python3
# ─── 👟❌ TIRA AS MARCAS DE TERCEIRO DA ARTE DO PANTERA NEGRA FC (20/09) ─────
#
# Ordem do Diego: *"tire a Nike do peito do manto também"*. A prancha que o dono
# mandou veio com o símbolo da Nike em três lugares: no PEITO da camisa e nas
# DUAS chuteiras do mascote. É marca registrada de outra empresa e ia entrar no
# jogo — sai, igual já saiu das chuteiras do Pontinho (Futpoint, 19/09) e do
# letreiro da bola de ouro.
#
# 👉 O QUE SAI: só o risco dourado da Nike.
# 👉 O QUE FICA: tudo o mais — a chuteira preta, o friso, as travas douradas, o
#    raio dourado da camisa, a pantera, o escudo do clube no peito, a coroa.
#
# 🧵 COMO APAGA: não é borrão. O fundo ali tem grão (pelo da pantera na camisa,
#    couro com brilho na chuteira), e borrar deixa uma mancha lisa que grita.
#    A receita é a mesma do Futpoint: ajusta uma superfície quadrática nos
#    pixels de FUNDO em volta da janela, repinta por cima com o mesmo grão
#    (copiado de uma faixa vizinha) e desvanece na margem.
#
# 🟩 E DE QUEBRA: apaga um resto de CHROMA (54 px de verde #2BF02E) preso entre
#    a chuteira e a bola-galáxia. Ele escapou do recorte porque era pequeno
#    demais pro corte de buracos presos (> 700 px) — ali é vão, então vira
#    TRANSPARENTE, não pintura. ⚠️ A grama do pé da plaquinha também é verde e
#    é DESENHO: por isso o alvo é só a janela da chuteira, não "todo verde".
#
# uso: python3 scripts/tira-marcas-pantera.py
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
import cv2

# (arquivo, [(rótulo, x0, y0, x1, y1)], tamanho esperado)
TAREFAS = [
    ('/tmp/pantera-camisa.png', (558, 677), [
        ('nike do peito', 148, 162, 220, 193),
    ]),
    ('/tmp/pantera-mascote.png', (904, 995), [
        ('nike da chuteira de cima', 461, 759, 519, 798),
        ('nike da chuteira de baixo', 632, 917, 707, 961),
    ]),
]

def apaga(rgb, alfa, X0, Y0, X1, Y1):
    """apaga SÓ O RISCO dourado dentro da janela, e deixa o resto intacto.

    ⚠️ 1ª tentativa (a receita do Futpoint: superfície quadrática + grão no
    RETÂNGULO inteiro) funcionou no pelo da pantera e ESTRAGOU as chuteiras —
    ficou um remendo quadrado, de borda dura, com granulado cinza no meio do
    couro brilhante. O motivo: no couro o brilho muda rápido dentro da janela,
    então uma superfície suave não tem como acompanhar.
    A receita certa aqui é mais humilde: **mexer só nos pixels da marca**. Marca
    o dourado, engorda 2 px e manda o `inpaint` do OpenCV costurar pelo que está
    em volta — o couro, o brilho e o grão do lado ficam INTACTOS porque nem são
    tocados."""
    H, W = alfa.shape
    R, G, B = (rgb[..., i].astype(int) for i in range(3))
    ouro = (R > 110) & (R - B > 55) & (G > 60) & (G < R) & (alfa > 100)
    alvo = np.zeros((H, W), bool)
    alvo[Y0:Y1, X0:X1] = ouro[Y0:Y1, X0:X1]
    if alvo.sum() < 20:
        print('      ⚠️ não achei o risco nesta janela — pulada'); return rgb, 0
    mask = ndi.binary_dilation(alvo, np.ones((5, 5), bool)).astype(np.uint8)
    curado = cv2.inpaint(cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR), mask, 4, cv2.INPAINT_TELEA)
    return cv2.cvtColor(curado, cv2.COLOR_BGR2RGB), int(alvo.sum())

for arq, tamanho, janelas in TAREFAS:
    im = Image.open(arq).convert('RGBA')
    assert im.size == tamanho, f'janelas medidas em {tamanho}; veio {im.size} — REMEDIR antes de rodar'
    a = np.array(im)
    rgb, alfa = a[..., :3].copy(), a[..., 3].copy()
    print(f'  {arq.split("/")[-1]}')
    for rot, X0, Y0, X1, Y1 in janelas:
        rgb, quantos = apaga(rgb, alfa, X0, Y0, X1, Y1)
        print(f'      ✂️ {rot}: {quantos} px de risco apagados')

    # 🟩 o resto de chroma preso entre a chuteira e a bola (só na janela dele)
    if 'mascote' in arq:
        X0, Y0, X1, Y1 = 470, 798, 515, 822
        R, G, B = (rgb[Y0:Y1, X0:X1, i].astype(int) for i in range(3))
        verde = (G - np.maximum(R, B) > 40) & (G > 90) & (alfa[Y0:Y1, X0:X1] > 0)
        alfa[Y0:Y1, X0:X1] = np.where(verde, 0, alfa[Y0:Y1, X0:X1])
        print(f'      🟩 chroma preso na chuteira: {int(verde.sum())} px viraram vão (a grama da plaquinha NÃO é tocada)')

    Image.fromarray(np.dstack([rgb, alfa])).save(arq)

print('\n✅ marcas fora. Reexportar os webp depois (o peso muda).')
