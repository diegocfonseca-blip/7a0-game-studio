# ─── 🧢 RECORTE DA ARTE NOVA DO TÔKA10 (16/09) ───────────────────────────────
# Duas pranchas, e a ordem do Diego foi explícita:
#   · anexo 1 → o ESCUDO é a TOUCA SOZINHA;
#   · anexo 2 → dali sai SÓ o mascote (o boneco do meio) e o MANTO (a camisa).
#     O brasão redondo da esquerda NÃO entra — ele foi descartado de propósito.
# O corte é por MANCHA (nunca retângulo): o boneco e a camisa se cruzam em x
# 927-946 sem se tocarem, e retângulo levaria pedaço de um pro outro.
# Saída em /tmp/toka/, com as provas sobre fundo CREME (nunca branco).
from PIL import Image
import numpy as np
from scipy import ndimage

TOUCA   = '/root/.claude/uploads/15782737-58e2-54d9-971e-653cb64061f2/4d50d4ea-image.jpg'
PRANCHA = '/root/.claude/uploads/15782737-58e2-54d9-971e-653cb64061f2/a618db74-image.png'
VERDE = (1, 178, 38)

# ⚠️ ESTA ARTE TEM VERDE DENTRO DO DESENHO (o raio da touca é verde, a camisa tem
# detalhe verde) e o fundo também é verde. Duas armadilhas, as duas já pagas aqui:
#   1. o croma tem que olhar o BRILHO, não só a saturação: o fundo é verde CLARO
#      (G≈168) e o verde do desenho é ESCURO (G entre 16 e 80). Sem o piso de brilho,
#      o recorte come o raio da touca — mesma lição do Bagres 1993 (06/09).
#   2. o DESPILL só pode agir na FRANJA da borda. Na 1ª tentativa ele rodava no
#      desenho inteiro e clareava o verde escuro até virar CINZA: o raio da touca
#      saiu acinzentado. Agora ele só encosta onde o alfa é parcial.
def mascara_verde(a):
    R,G,B = a[:,:,0], a[:,:,1], a[:,:,2]
    return (G>140) & (G-R>60) & (G-B>60)

def tira_verde(img):
    a = np.asarray(img).astype(np.float32)
    R,G,B = a[:,:,0], a[:,:,1], a[:,:,2]
    exc = G - np.maximum(R,B)
    k = np.clip((exc - 60)/60.0, 0, 1) * np.clip((G - 120)/40.0, 0, 1)  # só verde CLARO e saturado
    alpha = (1-k)*255
    franja = (k > 0.02) & (k < 0.98)                 # só a borda meio-transparente
    g2 = np.minimum(G, np.maximum(R,B) + 12)
    return Image.fromarray(np.dstack([R, np.where(franja, g2, G), B, alpha]).astype(np.uint8),'RGBA')

def poeira_fora(img, minA=40, um_so=True):
    a = np.asarray(img).copy(); al = a[:,:,3]
    al[al < minA] = 0
    lab,n = ndimage.label(al>0, np.ones((3,3)))
    if n:
        t = ndimage.sum(al>0, lab, range(1,n+1))
        keep = np.zeros(n+1,bool); keep[1:] = t > max(80, 0.0008*t.max())
        al[~keep[lab]] = 0
    if um_so:
        l2,n2 = ndimage.label(al>=minA, np.ones((3,3)))
        if n2>1:
            t2 = ndimage.sum(al>=minA, l2, range(1,n2+1))
            al[l2 != int(np.argmax(t2))+1] = 0
    a[:,:,3] = al
    sol = al>=minA
    lin = np.where(sol.sum(axis=1)>=3)[0]; col = np.where(sol.sum(axis=0)>=3)[0]
    if not len(lin) or not len(col): return Image.fromarray(a,'RGBA')
    return Image.fromarray(a,'RGBA').crop((col.min(),lin.min(),col.max()+1,lin.max()+1))

def prova(img,nome):
    b=Image.new('RGB',img.size,(244,236,214)); b.paste(img,(0,0),img); b.save(f'/tmp/toka/{nome}-prova.png')

def salva(img, nome, um_so=True):
    out = poeira_fora(tira_verde(img), um_so=um_so)
    out.save(f'/tmp/toka/{nome}.png'); prova(out,nome)
    w,h = out.size; print(f'{nome}: {w}x{h}  proporção {w/h:.4f}')

# ── 1. a TOUCA (escudo) — mancha única, direto
im1 = Image.open(TOUCA).convert('RGB')
salva(im1, 'escudo')

# ── 2. a prancha: mascote (boneco do meio) e camisa (direita)
im2 = Image.open(PRANCHA).convert('RGB'); base = np.asarray(im2).copy()
obj = ndimage.binary_opening(~mascara_verde(base.astype(int)), np.ones((5,5)))
lab,n = ndimage.label(obj, np.ones((3,3)))
t = ndimage.sum(obj, lab, range(1,n+1)); cx = ndimage.find_objects(lab)
m_mascote = np.zeros_like(obj); m_camisa = np.zeros_like(obj)
for i in range(n):
    if t[i] < 3000: continue
    x = cx[i][1]
    if x.start >= 900: m_camisa |= (lab == i+1)          # a camisa e o escudinho do peito
    elif x.start >= 500: m_mascote |= (lab == i+1)       # o boneco
    # x.start < 500 = o brasão redondo → FORA, por ordem do Diego
def so(mask):
    arr = np.full_like(base, VERDE); arr[mask] = base[mask]; return Image.fromarray(arr)
salva(so(m_mascote), 'mascote')
salva(so(m_camisa), 'camisa', um_so=False)
