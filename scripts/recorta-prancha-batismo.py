# ─── 🪚 RECORTE DE PRANCHA DE BATISMO (escudo · mascote · camisa) ────────────
# Nasceu no batismo do Rei da Bola FC (16/09) e mora no repo porque o erro que ele
# conserta é fácil de repetir: a prancha vem com as três peças sobre fundo verde, e
# elas SE ENCOSTAM. Cortar com linha reta come a manga da camisa OU deixa a manga
# grudada no mascote — foi o que o Diego pegou: *"tem manga da camisa aparecendo no
# mascote e também saiu parte da manga da camisa"*.
#
# O que este script faz de diferente:
#   1. corte CURVO: pra cada linha da imagem ele acha o VÃO de verde entre as peças e
#      corta no meio dele (a distância entre mascote e camisa muda com a altura);
#   2. despill: tira a franja verde do contorno, senão o pelo do bicho fica com auréola;
#   3. apaga a POEIRA DE ALFA antes de medir o corte — o bbox cru mente (erro do Papão);
#   4. deixa UM desenho por arquivo (a maior mancha), senão um pedaço da capa vira
#      triângulo solto no canto do escudo;
#   5. salva a PROVA sobre fundo CREME, nunca branco (erro do Theuzudo: letra branca
#      comida é invisível no branco).
# As janelas (Y0/Y1, BUSCA0/BUSCA1 e a janela do escudo) são da prancha do Rei da Bola —
# conferir e ajustar pra cada arte nova, sempre olhando a prova antes de exportar.
#
# Rodar: python3 scripts/recorta-prancha-batismo.py   (saída em /tmp/rei/)
from PIL import Image
import numpy as np
from scipy import ndimage
SRC='/root/.claude/uploads/15782737-58e2-54d9-971e-653cb64061f2/5954c91d-image.png'
im0 = Image.open(SRC).convert('RGB')
a0 = np.asarray(im0).astype(int)
R,G,B = a0[:,:,0], a0[:,:,1], a0[:,:,2]
obj = ~((G > 120) & (G - R > 60) & (G - B > 60))
H, W = obj.shape

# ── 🪚 A FRONTEIRA CURVA entre o MASCOTE e a CAMISA ─────────────────────────
# Diego pegou o erro (16/09): *"tem manga da camisa aparecendo no mascote e
# também saiu parte da manga da camisa"*. A causa: eu cortei com uma linha
# VERTICAL, e a distância entre os dois MUDA com a altura — em y=460 o vão está
# em x≈950, em y=780 em x≈1048. Reto sempre ia comer um e deixar o outro.
# Aqui o corte acompanha o VÃO DE VERDE, linha por linha.
Y0, Y1 = 170, 882      # faixa de altura onde a camisa existe
BUSCA0, BUSCA1 = 890, 1215
corte = np.full(H, 10**6)   # default: tudo é mascote
for y in range(Y0, Y1):
    faixa = obj[y, BUSCA0:BUSCA1]
    melhor, ini_melhor, run, ini = 0, None, 0, None
    for i, v in enumerate(faixa):
        if not v:
            if run == 0: ini = i
            run += 1
            if run > melhor: melhor, ini_melhor = run, ini
        else: run = 0
    if ini_melhor is not None and melhor >= 4:
        corte[y] = BUSCA0 + ini_melhor + melhor / 2   # meio do vão
# onde eles ENCOSTAM (y≈480) não há vão: interpola pelos vizinhos
val = np.where(corte[Y0:Y1] < 10**6)[0]
if len(val):
    corte[Y0:Y1] = np.interp(np.arange(Y1-Y0), val, corte[Y0:Y1][val])
# suaviza pra fronteira não serrilhar
corte[Y0:Y1] = ndimage.uniform_filter1d(corte[Y0:Y1].astype(float), 9)

xs = np.arange(W)[None, :]
mask_camisa = np.zeros_like(obj)
mask_camisa[Y0:Y1] = xs >= corte[Y0:Y1][:, None]

def tira_verde(img):
    a = np.asarray(img).astype(np.float32)
    R,G,B = a[:,:,0], a[:,:,1], a[:,:,2]
    exc = G - np.maximum(R,B)
    k = np.clip((exc - 18) / 60.0, 0, 1)
    g2 = np.minimum(G, np.maximum(R,B) + 12)
    return Image.fromarray(np.dstack([R, np.where(exc > 8, g2, G), B, (1-k)*255]).astype(np.uint8), 'RGBA')

def poeira_fora(img, minA=40):
    a = np.asarray(img).copy(); al = a[:,:,3]
    al[al < minA] = 0
    lab,n = ndimage.label(al > 0, np.ones((3,3)))
    if n:
        t = ndimage.sum(al > 0, lab, range(1,n+1))
        keep = np.zeros(n+1, bool); keep[1:] = t > max(60, 0.0005*t.max())
        al[~keep[lab]] = 0
    lab2,n2 = ndimage.label(al >= minA, np.ones((3,3)))
    if n2 > 1:
        t2 = ndimage.sum(al >= minA, lab2, range(1,n2+1))
        al[lab2 != int(np.argmax(t2)) + 1] = 0
    a[:,:,3] = al
    sol = al >= minA
    lin = np.where(sol.sum(axis=1) >= 3)[0]; col = np.where(sol.sum(axis=0) >= 3)[0]
    if not len(lin) or not len(col): return Image.fromarray(a,'RGBA')
    return Image.fromarray(a,'RGBA').crop((col.min(), lin.min(), col.max()+1, lin.max()+1))

def prova(img, nome):
    bg = Image.new('RGB', img.size, (244,236,214)); bg.paste(img, (0,0), img)
    bg.save(f'/tmp/rei/{nome}-prova.png')

VERDE = (2,250,49)
base = np.asarray(im0).copy()
# CAMISA: apaga tudo que não é dela
ca = base.copy(); ca[~mask_camisa] = VERDE
# MASCOTE: apaga a camisa e o escudo
ma = base.copy(); ma[mask_camisa] = VERDE; ma[80:712, 20:472] = VERDE
# ESCUDO: só a janela dele
es = base.copy(); es[:, 472:] = VERDE

for nome, arr in (('escudo', es), ('mascote', ma), ('camisa', ca)):
    img = poeira_fora(tira_verde(Image.fromarray(arr)))
    img.save(f'/tmp/rei/{nome}.png'); prova(img, nome)
    w,h = img.size; print(f'{nome}: {w}x{h}  proporção {w/h:.4f}')
