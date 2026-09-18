#!/usr/bin/env python3
# ─── 🎽 MÁSCARA DO MANTO NAS FOTOS DO JORNAL ────────────────────────────────
#
# Pedido do Diego (18/09), olhando a foto do campeão em O MARTELO: *"teria como,
# principalmente quando for algum time de batismo, aparecer a camisa do time de
# batismo no lugar desses jogadores? Ou seria muito trabalho?"*
#
# A resposta que a gente escolheu: **não desenhar arte nova**. A foto continua a
# mesma; o que muda é a COR do uniforme, pintada na hora com as 2 cores do manto
# do clube (as mesmas já medidas na camisa que o dono mandou).
#
# Pra isso o navegador precisa saber QUAIS pixels são uniforme. Este script mede
# isso UMA vez e guarda num arquivinho de máscara:
#   · canal R = listra CLARA (o creme/branco da arte)
#   · canal G = listra ESCURA (o verde na foto da liga, o roxo na da Copa)
#   · preto   = não encosta (pele, troféu, multidão, confete, holofote)
#
# 💾 POR QUE MÁSCARA E NÃO UMA ARTE POR CLUBE: é UM arquivo de ~5 KB que serve
# pra TODOS os clubes — hoje, os que ainda não mandaram camisa, e todo batismo
# futuro. Uma arte por clube seria ~60 KB vezes 53 (e o Diego quer chegar a 10
# mil batismos): morre na regra de peso.
#
# 🧠 COMO A CONTA ACHA A CAMISA (e por que não é só "pegar o verde"): na foto da
# liga a ARQUIBANCADA é do mesmo verde da camisa, e na da Copa o fundo é do mesmo
# roxo. Cor sozinha não separa. O que separa é o DESENHO:
#   1. listra é RISCO COMPRIDO EM PÉ — abrir com uma coluna alta mata o confete
#      e a pipoca da multidão, e deixa a listra;
#   2. camisa listrada tem as DUAS listras juntas — só vale o pedaço que tem
#      clara e escura na mesma mancha;
#   3. listra escura é VIZINHA DE LADO de uma clara — mancha escura larga, sem
#      clara ao lado, é fundo (era o que sobrava entre os jogadores).
#
# Rodar:  python3 scripts/mascara-jornal.py
# Saída:  src/escalacao/img/<nome>-manto-v1.webp + o brilho de referência que o
#         `jornal-manto.ts` usa (ele imprime pra você conferir se mudar a arte).
import os
import numpy as np
from PIL import Image
from scipy import ndimage as nd

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG = os.path.join(RAIZ, 'src/escalacao/img')

# ⚠️ CADA ARTE TEM A SUA LUZ. A foto da liga é toda quente (a listra creme dela é
# MAIS saturada que a pele); a da Copa é fria e escura. Uma regra só pras duas
# zerou a máscara da liga na primeira tentativa — por isso cada uma traz o seu par.
ARTES = [
    ('jornal-liga-v22.webp', 'jornal-liga-manto-v1.webp',
     # 🟢 verde · listra creme quente
     lambda r, g, b, v, s: (g > r * 1.22) & (g > b * 1.02) & (v < 0.55),
     lambda r, g, b, v, s: (r / g < 1.42) & (r / g > 0.92) & (g > b * 1.08) & (v > 0.30)),
    ('jornal-copa-v22.webp', 'jornal-copa-manto-v1.webp',
     # 🟣 roxo · listra cinza-lavanda
     lambda r, g, b, v, s: (b > g * 1.18) & (r > g * 1.03) & (v < 0.48),
     lambda r, g, b, v, s: (v > 0.22) & (r / g < 1.45) & (r / g > 0.90) & (s < 0.55)),
]

COLUNA = np.ones((27, 3), bool)  # o "risco em pé" do passo 1


def mascara(arq, regra_escura, regra_clara):
    a = np.asarray(Image.open(os.path.join(IMG, arq)).convert('RGB')).astype(np.float32)
    r, g, b = a[..., 0] + 1, a[..., 1] + 1, a[..., 2] + 1
    mx, mn = a.max(2), a.min(2)
    v = mx / 255
    s = (mx - mn) / np.maximum(mx, 1)

    escuro = regra_escura(r, g, b, v, s)
    claro = regra_clara(r, g, b, v, s) & ~escuro

    cl = nd.binary_opening(claro, COLUNA)
    es = nd.binary_opening(escuro, COLUNA)

    # 2) só mancha que tem as DUAS listras é camisa
    junta = nd.binary_fill_holes(nd.binary_closing(cl | es, np.ones((9, 9))))
    lab, n = nd.label(junta)
    fica = []
    for i in range(1, n + 1):
        m = lab == i
        area = m.sum()
        if area < 8000:
            continue
        if (m & es).sum() / area > 0.15 and (m & cl).sum() / area > 0.15:
            fica.append(i)
    sel = np.isin(lab, fica)

    clara = nd.binary_closing(sel & cl, np.ones((5, 5)))
    # 3) escura tem que ter clara AO LADO
    lado = nd.binary_dilation(clara, np.ones((3, 49)))
    escura = nd.binary_closing(sel & es & lado, np.ones((5, 5))) & ~clara
    lab2, n2 = nd.label(escura)
    tam = nd.sum(escura, lab2, range(1, n2 + 1))
    escura = np.isin(lab2, 1 + np.where(tam > 400)[0])

    # 👕 manga, ombro e CALÇÃO: crescer SÓ pra dentro do casco do uniforme, em passo
    # curto. Sem o casco, o crescimento vaza pra arquibancada (que é da mesma cor).
    # O casco é ALTO E ESTREITO de propósito: ele precisa descer do peito até o
    # calção (que fica abaixo da barra da camisa) sem abrir pros lados, onde só tem
    # multidão. Com o casco quadrado, o calção ficava verde numa camisa azul — e
    # sobra de cor velha parece bug.
    # ⚠️ Aqui o crescimento anda pelo `es` (o pano JÁ passado pela coluna), nunca
    # pelo `escuro` cru: é isso que impede o confete — que é da mesma cor e fica
    # colado nos jogadores — de entrar junto. Confete não sobrevive à coluna.
    casco = nd.binary_fill_holes(nd.binary_dilation(clara | escura, np.ones((81, 41))))
    # o passo é ALTO e ESTREITO: desce do peito pro calção sem abrir pros lados,
    # onde só tem arquibancada.
    for _ in range(4):
        escura |= nd.binary_opening(nd.binary_dilation(escura, np.ones((41, 9))) & es & casco, np.ones((5, 5)))
    escura = nd.binary_closing(escura, np.ones((5, 5))) & ~clara

    luma = 0.299 * a[..., 0] + 0.587 * a[..., 1] + 0.114 * a[..., 2]
    return clara, escura, float(luma[clara].mean()), float(luma[escura].mean())


for base, saida, regra_esc, regra_cla in ARTES:
    clara, escura, refC, refE = mascara(base, regra_esc, regra_cla)
    m = np.zeros((*clara.shape, 3), np.uint8)
    m[..., 0] = clara * 255   # R = listra CLARA
    m[..., 1] = escura * 255  # G = listra ESCURA
    destino = os.path.join(IMG, saida)
    Image.fromarray(m).save(destino, 'WEBP', lossless=True, method=6)
    kb = os.path.getsize(destino) / 1024
    print(f'{saida:32} {kb:5.1f} KB   clara {clara.mean()*100:4.1f}%  escura {escura.mean()*100:4.1f}%'
          f'   brilho de referência: clara {refC:.0f} · escura {refE:.0f}')
