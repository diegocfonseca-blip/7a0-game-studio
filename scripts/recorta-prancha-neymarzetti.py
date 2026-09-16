# ─── 🦇 RECORTE DA PRANCHA NOVA DO NEYMARZETTI (16/09) ───────────────────────
# Mesma escola do scripts/recorta-prancha-batismo.py, com dois detalhes desta arte:
#   · mascote × camisa se aproximam e se afastam conforme a altura (e encostam em
#     y≈460), então o corte entre elas é CURVO, achando o vão de verde linha a linha;
#   · o ESCUDO sai pela MANCHA, não por caixa: a mão do Neymar entra na janela dele
#     (o mascote começa em x=419 e o escudo vai até x=529), e qualquer retângulo leva
#     pedaço de dedo junto — foi o que apareceu no 1º mockup.
# Gera também a versão SÓ DO MORCEGO (sem o letreiro), que é a que o jogo usa.
# Saída em /tmp/ney/, com as provas sobre fundo CREME (nunca branco).
from PIL import Image
import numpy as np
from scipy import ndimage
SRC='/root/.claude/uploads/15782737-58e2-54d9-971e-653cb64061f2/e956000d-image.png'
im0 = Image.open(SRC).convert('RGB'); base = np.asarray(im0).copy()
a0 = base.astype(int); R,G,B = a0[:,:,0], a0[:,:,1], a0[:,:,2]
obj = ~((G>120)&(G-R>60)&(G-B>60))
H,W = obj.shape
VERDE = (1,249,78)

# 🪚 fronteira CURVA mascote × camisa (mesmo remédio do Raiva Cajuri: a distância
# entre as duas peças muda com a altura e num ponto elas encostam)
Y0,Y1, B0,B1 = 128, 958, 930, 1185
corte = np.full(H, 10**6)
for y in range(Y0,Y1):
    f = obj[y, B0:B1]; best=(0,None); run=0; ini=None
    for i,v in enumerate(f):
        if not v:
            if run==0: ini=i
            run+=1
            if run>best[0]: best=(run,ini)
        else: run=0
    if best[1] is not None and best[0] >= 4: corte[y] = B0 + best[1] + best[0]/2
val = np.where(corte[Y0:Y1] < 10**6)[0]
corte[Y0:Y1] = np.interp(np.arange(Y1-Y0), val, corte[Y0:Y1][val])
corte[Y0:Y1] = ndimage.uniform_filter1d(corte[Y0:Y1].astype(float), 9)
xs = np.arange(W)[None,:]
m_camisa = np.zeros_like(obj); m_camisa[Y0:Y1] = xs >= corte[Y0:Y1][:,None]

# 🖐️ O ESCUDO SAI PELA MANCHA, NÃO POR CAIXA. A mão do Neymar entra na janela do
# escudo (o mascote começa em x=419 e o escudo vai até x=529), então qualquer retângulo
# leva pedaço de dedo junto — foi o que apareceu no 1º mockup.
_l,_n = ndimage.label(ndimage.binary_opening(obj, np.ones((5,5))), np.ones((3,3)))
_t = ndimage.sum(obj, _l, range(1,_n+1)); _cx = ndimage.find_objects(_l)
_i = [k for k in np.argsort(_t)[::-1][:4] if _cx[k][1].start < 100][0]
m_escudo = (_l == _i + 1)
m_mascote = ~m_camisa & ~m_escudo

def tira_verde(img):
    a = np.asarray(img).astype(np.float32)
    R,G,B = a[:,:,0], a[:,:,1], a[:,:,2]
    exc = G - np.maximum(R,B)
    k = np.clip((exc - 18)/60.0, 0, 1)
    g2 = np.minimum(G, np.maximum(R,B) + 12)
    return Image.fromarray(np.dstack([R, np.where(exc>8, g2, G), B, (1-k)*255]).astype(np.uint8),'RGBA')

def poeira_fora(img, minA=40, um_so=True):
    a = np.asarray(img).copy(); al = a[:,:,3]
    al[al < minA] = 0
    lab,n = ndimage.label(al>0, np.ones((3,3)))
    if n:
        t = ndimage.sum(al>0, lab, range(1,n+1))
        keep = np.zeros(n+1,bool); keep[1:] = t > max(80, 0.0008*t.max())
        al[~keep[lab]] = 0
    # 🖐️ a MÃO do mascote entra na janela do escudo pela direita. Em vez de chutar um
    # tamanho mínimo, cai fora quem ENCOSTA na borda da janela sem ser a mancha principal
    # — o desenho de dentro nunca toca a borda, o invasor sempre toca.
    l3,n3 = ndimage.label(al>=minA, np.ones((3,3)))
    if n3 > 1:
        t3 = ndimage.sum(al>=minA, l3, range(1,n3+1))
        maior = int(np.argmax(t3)) + 1
        hh, ww = al.shape
        for k in range(1, n3+1):
            if k == maior: continue
            ys, xs2 = np.where(l3 == k)
            if xs2.min() == 0 or xs2.max() == ww-1 or ys.min() == 0 or ys.max() == hh-1:
                al[l3 == k] = 0
    if um_so:
        l2,n2 = ndimage.label(al>=minA, np.ones((3,3)))
        if n2>1:
            t2 = ndimage.sum(al>=minA, l2, range(1,n2+1))
            al[l2 != int(np.argmax(t2))+1] = 0
    a[:,:,3]=al
    sol = al>=minA
    lin = np.where(sol.sum(axis=1)>=3)[0]; col = np.where(sol.sum(axis=0)>=3)[0]
    if not len(lin) or not len(col): return Image.fromarray(a,'RGBA')
    return Image.fromarray(a,'RGBA').crop((col.min(),lin.min(),col.max()+1,lin.max()+1))

def so(mask):
    arr = np.full_like(base, VERDE); arr[mask] = base[mask]; return Image.fromarray(arr)
def prova(img,nome):
    b=Image.new('RGB',img.size,(244,236,214)); b.paste(img,(0,0),img); b.save(f'/tmp/ney/{nome}-prova.png')

# só o morcego-N: a MESMA mancha do escudo, cortada acima do letreiro
m_morcego = m_escudo.copy(); m_morcego[545:, :] = False
for nome, mask, um in (('escudo-morcego', m_morcego, False), ('escudo', m_escudo, False), ('mascote', m_mascote, True), ('camisa', m_camisa, True)):
    img = poeira_fora(tira_verde(so(mask)), um_so=um)
    img.save(f'/tmp/ney/{nome}.png'); prova(img,nome)
    w,h = img.size; print(f'{nome}: {w}x{h}  proporção {w/h:.4f}')
