# ─── ⚔️ RECORTE DA ARTE NOVA DO NIGHTFULL FC (16/09) ────────────────────────────
# Prancha única sobre croma VERDE CLARO (G≈249), com as três peças bem separadas:
#   escudo (esquerda) · mascote guerreiro (meio, em cima do entulho) · manto (direita).
# Corte por MANCHA, como sempre — e com PISO DE BRILHO no croma, porque o desenho
# tem verde escuro de sobra não, mas a regra fica: fundo é G>180, desenho nunca.
# O mascote pisa em PEDRAS SOLTAS que fazem parte do desenho, então esse pedaço
# NÃO pode usar `um_so` (senão as pedras soltas somem) — filtra por área e por x.
# Saída em /tmp/papao/, com as provas sobre fundo CREME (nunca branco).
from PIL import Image
import numpy as np
from scipy import ndimage
import os

PRANCHA = '/root/.claude/uploads/15782737-58e2-54d9-971e-653cb64061f2/aaa3137d-image.png'
VERDE = (2, 249, 61)
os.makedirs('/tmp/papao', exist_ok=True)


def mascara_verde(a):
    R, G, B = a[:, :, 0], a[:, :, 1], a[:, :, 2]
    return (G > 180) & (G - R > 60) & (G - B > 60)


def tira_verde(img):
    a = np.asarray(img).astype(np.float32)
    R, G, B = a[:, :, 0], a[:, :, 1], a[:, :, 2]
    exc = G - np.maximum(R, B)
    k = np.clip((exc - 60) / 60.0, 0, 1) * np.clip((G - 160) / 40.0, 0, 1)
    alpha = (1 - k) * 255
    franja = (k > 0.02) & (k < 0.98)                  # despill SÓ na borda meio-transparente
    g2 = np.minimum(G, np.maximum(R, B) + 12)
    return Image.fromarray(np.dstack([R, np.where(franja, g2, G), B, alpha]).astype(np.uint8), 'RGBA')


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


def limpa_franja(img, raio=4):
    """Tira o verde que sobra na BORDA com alfa cheio.

    O despill do `tira_verde` só pega alfa parcial, e nesta arte sobrava um fio
    verde de ~1-3 px no contorno (visível sobre o creme do jogo, invisível sobre
    branco). Aqui só encosta em pixel que é verde-dominante E está a poucos
    pixels do transparente — o miolo do desenho nunca é tocado.
    """
    a = np.asarray(img).astype(np.int16).copy()
    R, G, B, A = a[:, :, 0], a[:, :, 1], a[:, :, 2], a[:, :, 3]
    perto = ndimage.binary_dilation(A < 40, np.ones((2 * raio + 1, 2 * raio + 1)))
    alvo = perto & (A >= 40) & (G - np.maximum(R, B) > 25)
    a[:, :, 1] = np.where(alvo, np.minimum(G, np.maximum(R, B) + 8), G)
    return Image.fromarray(a.astype(np.uint8), 'RGBA')


def prova(img, nome):
    b = Image.new('RGB', img.size, (244, 236, 214)); b.paste(img, (0, 0), img)
    b.save(f'/tmp/papao/{nome}-prova.png')


def salva(img, nome, um_so=True):
    out = limpa_franja(poeira_fora(tira_verde(img), um_so=um_so))
    out.save(f'/tmp/papao/{nome}.png'); prova(out, nome)
    w, h = out.size
    moldura = 1 - (np.asarray(out)[:, :, 3] >= 40).mean()
    print(f'{nome}: {w}x{h}  proporção {w/h:.4f}  vazio {moldura*100:.1f}%')


im = Image.open(PRANCHA).convert('RGB')
base = np.asarray(im).copy()
obj = ndimage.binary_opening(~mascara_verde(base.astype(int)), np.ones((5, 5)))
lab, n = ndimage.label(obj, np.ones((3, 3)))
t = ndimage.sum(obj, lab, range(1, n + 1)); cx = ndimage.find_objects(lab)

m = {'escudo': np.zeros_like(obj), 'mascote': np.zeros_like(obj), 'camisa': np.zeros_like(obj)}
for i in range(n):
    if t[i] < 200:
        continue
    x = cx[i][1]; meio = (x.start + x.stop) / 2
    alvo = 'escudo' if meio < 490 else ('mascote' if meio < 1015 else 'camisa')
    m[alvo] |= (lab == i + 1)
    if t[i] > 3000:
        print(f'  mancha {t[i]:>8.0f} px  x {x.start}-{x.stop} → {alvo}')


def so(mask):
    arr = np.full_like(base, VERDE); arr[mask] = base[mask]; return Image.fromarray(arr)


salva(so(m['escudo']), 'escudo')
salva(so(m['mascote']), 'mascote', um_so=False)   # o entulho no pé é desenho
salva(so(m['camisa']), 'camisa', um_so=False)     # o escudinho no peito é desenho
