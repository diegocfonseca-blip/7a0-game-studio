# ─── ⚓🐷 RECORTE DA ARTE NOVA DO MARINHEIROS AS (16/09) ─────────────────────
# Prancha sobre croma VERDE CLARO, e com DUAS armadilhas ao mesmo tempo:
#
# 1. 🟢 O DESENHO É VERDE (o porco marujo é verde da cabeça aos pés) e o fundo
#    também. E aqui o piso de brilho PADRÃO (G>180) NÃO BASTA: medido na prancha,
#    o croma tem G≈248 e a pele do porco vai de G≈118 a G≈169 — ou seja, o verde
#    dele passa de 180 em vários pontos. Com o piso padrão a pele virava BURACO
#    TRANSPARENTE e, sobre o creme do jogo, o bicho aparecia manchado de pálido
#    (só dava pra ver comparando com a prancha original — sobre branco some).
#    Por isso o piso subiu pra G>210 e o despill só rampa de 205 pra cima:
#    248 e 169 ficam bem separados. Mesma família de erro do Bagres 1993 e do
#    Tôka10, mas com a margem MEDIDA em vez de herdada.
#
# 2. 🪚 ESCUDO E MASCOTE QUASE SE TOCAM. O vão entre os dois existe em TODAS as
#    linhas, mas chega a ter 2 px de largura (y≈520) — e a limpeza 5×5 que tira
#    a poeira do croma fecha esse vão e FUNDE os dois numa mancha só. Corte por
#    mancha aqui não serve, e corte RETO também não: o vão ANDA com a altura
#    (em y=300 está em x≈478, em y=520 em x≈526, em y=900 em x≈489). Então o
#    corte acompanha o vão linha por linha — a mesma solução do Rei da Bola.
# Saída em /tmp/marinh/, com as provas sobre fundo CREME (nunca branco).
from PIL import Image
import numpy as np
from scipy import ndimage
import os

PRANCHA = '/root/.claude/uploads/15782737-58e2-54d9-971e-653cb64061f2/8bf3dee4-image.png'
VERDE = (2, 249, 61)
FAIXA = (440, 660)     # onde procurar o vão entre escudo e mascote
SEMENTE = 520          # por onde a linha de corte começa
os.makedirs('/tmp/marinh', exist_ok=True)


def mascara_verde(a):
    R, G, B = a[:, :, 0], a[:, :, 1], a[:, :, 2]
    return (G > 210) & (G - R > 60) & (G - B > 60)


def tira_verde(img):
    a = np.asarray(img).astype(np.float32)
    R, G, B = a[:, :, 0], a[:, :, 1], a[:, :, 2]
    exc = G - np.maximum(R, B)
    k = np.clip((exc - 60) / 60.0, 0, 1) * np.clip((G - 205) / 35.0, 0, 1)
    alpha = (1 - k) * 255
    franja = (k > 0.02) & (k < 0.98)
    g2 = np.minimum(G, np.maximum(R, B) + 12)
    return Image.fromarray(np.dstack([R, np.where(franja, g2, G), B, alpha]).astype(np.uint8), 'RGBA')


def limpa_franja(img, raio=4):
    a = np.asarray(img).astype(np.int16).copy()
    R, G, B, A = a[:, :, 0], a[:, :, 1], a[:, :, 2], a[:, :, 3]
    perto = ndimage.binary_dilation(A < 40, np.ones((2 * raio + 1, 2 * raio + 1)))
    alvo = perto & (A >= 40) & (G - np.maximum(R, B) > 25)
    a[:, :, 1] = np.where(alvo, np.minimum(G, np.maximum(R, B) + 8), G)
    return Image.fromarray(a.astype(np.uint8), 'RGBA')


def poeira_fora(img, minA=40, um_so=True):
    a = np.asarray(img).copy(); al = a[:, :, 3]
    al[al < minA] = 0
    lab, n = ndimage.label(al > 0, np.ones((3, 3)))
    if n:
        t = ndimage.sum(al > 0, lab, range(1, n + 1))
        keep = np.zeros(n + 1, bool); keep[1:] = t > max(80, 0.0008 * t.max())
        al[~keep[lab]] = 0
    if um_so:
        l2, n2 = ndimage.label(al >= minA, np.ones((3, 3)))
        if n2 > 1:
            t2 = ndimage.sum(al >= minA, l2, range(1, n2 + 1))
            al[l2 != int(np.argmax(t2)) + 1] = 0
    a[:, :, 3] = al
    sol = al >= minA
    lin = np.where(sol.sum(axis=1) >= 3)[0]; col = np.where(sol.sum(axis=0) >= 3)[0]
    if not len(lin) or not len(col):
        return Image.fromarray(a, 'RGBA')
    return Image.fromarray(a, 'RGBA').crop((col.min(), lin.min(), col.max() + 1, lin.max() + 1))


def salva(img, nome, um_so=True):
    out = limpa_franja(poeira_fora(tira_verde(img), um_so=um_so))
    out.save(f'/tmp/marinh/{nome}.png')
    b = Image.new('RGB', out.size, (244, 236, 214)); b.paste(out, (0, 0), out)
    b.save(f'/tmp/marinh/{nome}-prova.png')
    w, h = out.size
    vazio = 1 - (np.asarray(out)[:, :, 3] >= 40).mean()
    print(f'{nome}: {w}x{h}  proporção {w/h:.4f}  vazio {vazio*100:.1f}%')


im = Image.open(PRANCHA).convert('RGB')
base = np.asarray(im).copy()
fundo = mascara_verde(base.astype(int))
obj_fino = ~fundo                                    # SEM opening: preserva o vão de 2 px
obj = ndimage.binary_opening(obj_fino, np.ones((5, 5)))

# ── a linha de corte CURVA: por linha, o vão de fundo mais perto do corte anterior
H, W = fundo.shape
corte = np.full(H, SEMENTE)
ant = SEMENTE
for y in range(H):
    linha = obj_fino[y, FAIXA[0]:FAIXA[1]]
    idx = np.where(~linha)[0]
    if len(idx):
        grupos = np.split(idx, np.where(np.diff(idx) != 1)[0] + 1)
        centros = [FAIXA[0] + (g[0] + g[-1]) / 2 for g in grupos]
        ant = int(min(centros, key=lambda c: abs(c - ant)))
    corte[y] = ant
corte = np.round(ndimage.uniform_filter1d(corte.astype(float), 25)).astype(int)  # suaviza
print(f'corte curvo: x de {corte.min()} a {corte.max()}')

xs = np.arange(W)[None, :]
esq = xs < corte[:, None]

lab, n = ndimage.label(obj, np.ones((3, 3)))
t = ndimage.sum(obj, lab, range(1, n + 1)); cx = ndimage.find_objects(lab)
m = {'escudo': np.zeros_like(obj), 'mascote': np.zeros_like(obj), 'camisa': np.zeros_like(obj)}
for i in range(n):
    if t[i] < 200:
        continue
    peca = (lab == i + 1)
    meio = (cx[i][1].start + cx[i][1].stop) / 2
    if meio >= 960:
        m['camisa'] |= peca
    else:                       # a mancha grudada vira DUAS, pela linha curva
        m['escudo'] |= peca & esq
        m['mascote'] |= peca & ~esq


def so(mask):
    arr = np.full_like(base, VERDE); arr[mask] = base[mask]; return Image.fromarray(arr)


salva(so(m['escudo']), 'escudo')
salva(so(m['mascote']), 'mascote', um_so=False)   # a fumacinha do cachimbo é desenho
salva(so(m['camisa']), 'camisa', um_so=False)
