#!/usr/bin/env python3
# ─── 🧽 TIRA O QUADRICULADO FALSO DA ARTE DE BATISMO ────────────────────────
#
# Gerador de imagem entrega PNG SEM transparência com o xadrez PINTADO por
# dentro. Este script acha os dois tons do xadrez sozinho (olhando a moldura da
# imagem) e apaga em DOIS passes:
#   1. o de fora, a partir da borda;
#   2. os buracos PRESOS dentro do desenho (entre pernas, asas, vãos fechados).
#
# ⚠️ A REGRA QUE O DIEGO PEGOU NO THEUZUDO FC (21/08): buraco preso só some se
# for xadrez DE VERDADE — precisa ter fatia GORDA dos DOIS tons. A primeira
# versão apagava "qualquer cinza claro" e comeu as LETRAS BRANCAS do escudo (o
# "D" e o "O" viraram buraco). Sobre fundo branco isso é invisível; no jogo, com
# fundo creme, apareceria o furo. Por isso a conferência tem que ser SOBRE FUNDO
# COLORIDO, nunca sobre branco.
#
# O xadrez pode ser CLARO (255/206) ou ESCURO (48/99) — por isso os tons são
# medidos, nunca chutados.
#
#   python3 scripts/limpa-xadrez.py entrada.png saida.png
import sys
from collections import deque, Counter
from PIL import Image

CAM, SAI = sys.argv[1], sys.argv[2]
im = Image.open(CAM).convert('RGBA')
w, h = im.size
px = im.load()


def cinza(p):
    r, g, b = p[0], p[1], p[2]
    return abs(r - g) <= 6 and abs(g - b) <= 6 and abs(r - b) <= 6


# ── acha os DOIS tons do xadrez na moldura da imagem ────────────────────────
borda = Counter()
for x in range(0, w, 2):
    for y in list(range(0, 14)) + list(range(h - 14, h)):
        p = px[x, y]
        if cinza(p):
            borda[p[0]] += 1
for y in range(0, h, 2):
    for x in list(range(0, 14)) + list(range(w - 14, w)):
        p = px[x, y]
        if cinza(p):
            borda[p[0]] += 1
if len(borda) < 2:
    sys.exit('não achei tom de xadrez na borda — essa arte já vem limpa?')
# os dois picos: o mais comum, e o mais comum que esteja longe do primeiro
t1 = borda.most_common(1)[0][0]
t2 = next((v for v, _ in borda.most_common() if abs(v - t1) > 20), None)
if t2 is None:
    sys.exit(f'só achei um tom ({t1}) — confira a arte na mão')
TOL = int(sys.argv[3]) if len(sys.argv) > 3 else 12
# 🕸️ A GRADE FINA (Diego, arte do São Luiz FC): entre os dois tons do xadrez
# sobram as linhas serrilhadas da grade, num tom no MEIO dos dois. Elas são
# fininhas, mas atravessam a imagem inteira e GRUDAM as peças umas nas outras —
# o recorte por componente vinha 1024x1024 (a imagem toda). Por isso o passe de
# FORA varre a faixa inteira entre os dois tons; lá dentro, o desenho continua
# protegido pela regra dos dois tons do passe 2.
LO, HI = min(t1, t2) - TOL, max(t1, t2) + TOL
print(f'tons do xadrez medidos: {t1} e {t2} (±{TOL}) · faixa da grade: {LO}..{HI}')


def tomA(p): return cinza(p) and abs(p[0] - t1) <= TOL
def tomB(p): return cinza(p) and abs(p[0] - t2) <= TOL
def xadrez(p): return tomA(p) or tomB(p)
def faixa(p): return cinza(p) and LO <= p[0] <= HI  # só o passe de FORA usa


vis = bytearray(w * h)
dq = deque()
for x in range(w):
    dq.append((x, 0)); dq.append((x, h - 1))
for y in range(h):
    dq.append((0, y)); dq.append((w - 1, y))
fora = 0
while dq:
    x, y = dq.popleft()
    if x < 0 or y < 0 or x >= w or y >= h or vis[y * w + x]:
        continue
    if not faixa(px[x, y]):
        continue
    vis[y * w + x] = 1
    px[x, y] = (255, 255, 255, 0)
    fora += 1
    dq.extend(((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))
print('passe 1 (fora):', fora, 'px')

presos = poupados = 0
for y0 in range(h):
    for x0 in range(w):
        if vis[y0 * w + x0] or not xadrez(px[x0, y0]):
            continue
        comp = []
        nA = nB = 0
        q = deque([(x0, y0)])
        vis[y0 * w + x0] = 1
        while q:
            x, y = q.popleft()
            comp.append((x, y))
            p = px[x, y]
            if tomA(p): nA += 1
            if tomB(p): nB += 1
            for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                if 0 <= nx < w and 0 <= ny < h and not vis[ny * w + nx] and xadrez(px[nx, ny]):
                    vis[ny * w + nx] = 1
                    q.append((nx, ny))
        n = len(comp)
        # xadrez de verdade = fatia gorda dos DOIS tons. Cor chapada do desenho não passa.
        if n > 60 and nA >= n * 0.18 and nB >= n * 0.18:
            for x, y in comp:
                px[x, y] = (255, 255, 255, 0)
            presos += n
        elif n > 60:
            poupados += n
print('passe 2 (buracos de xadrez apagados):', presos, 'px')
print('           cor do DESENHO poupada:   ', poupados, 'px')
im.save(SAI)
print('salvo em', SAI)
