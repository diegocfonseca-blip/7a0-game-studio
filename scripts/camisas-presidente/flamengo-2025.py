import sys
import numpy as np
from PIL import Image, ImageFilter, ImageDraw
SP=sys.argv[1]; SS=4  # supersample p/ linhas finas
im=Image.open('public/presidente-v92/base-neutra-camiseta-branca.webp').convert('RGBA')
a=np.array(im).astype(float); r,g,b,al=a[...,0],a[...,1],a[...,2],a[...,3]
H,W=al.shape; yy,xx=np.mgrid[0:H,0:W].astype(float)
mx=np.maximum(np.maximum(r,g),b); mn=np.minimum(np.minimum(r,g),b)
shirt=(mn>150)&((mx-mn)<35)&(al>200)&(yy>100)&(yy<335)&(xx>115)&(xx<350)
m=Image.fromarray((shirt*255).astype(np.uint8)).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.MaxFilter(3))
shirt=np.array(m)>128
near=np.array(Image.fromarray((shirt*255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5)))>128
shirt=shirt|(near&(mn>95)&((mx-mn)<30)&(al>120))
lum=(0.3*r+0.59*g+0.11*b)/255.0
lo,hi=np.percentile(lum[shirt],[3,97]); shade=np.clip((lum-lo)/(hi-lo),0,1)
RED=np.array([206,18,32.]); BLK=np.array([20,19,21.])
# --- listras do corpo: 6 pretas (21px) e 5 vermelhas (17px), começando e terminando no preto
off=-5*((xx-236)/110.0)**2
yb=yy-off
bounds=[110]; 
for i in range(11): bounds.append(bounds[-1]+(21 if i%2==0 else 17))
def stripe_col(yv):
    c=np.zeros((H,W,3))+BLK
    for i in range(11):
        sel=(yv>=bounds[i])&(yv<bounds[i+1])
        if i%2==1: c[sel]=RED
    return c
col=sum(stripe_col(yb+o) for o in (-0.375,-0.125,0.125,0.375))/4.0
# filete fino (antialias) perto de cada borda: tom escuro do vermelho, discreto
PIP=np.array([120,12,22.])
for i in range(1,11):
    for d in (3.5,-3.5):
        w=np.clip(1-np.abs(yb-(bounds[i]+d))/0.9,0,1)[...,None]
        col=col*(1-w*0.85)+PIP*(w*0.85)
# --- mangas pretas
lseam=157+(yy-135)*(14/80.0); rseam=311-(yy-135)*(10/75.0)
sleeve=shirt&((xx<lseam)|(xx>rseam))&(yy<224)
col[sleeve]=BLK
k=0.30+0.70*shade[...,None]**1.25
newc=np.clip(col*k+(shade[...,None]**6)*22,0,255)
out=a.copy(); out[...,:3]=np.where(shirt[...,None],newc,a[...,:3])
img=Image.fromarray(out.astype(np.uint8),'RGBA')
# --- gola em V: pele dentro do V + acabamento preto
skin=a[124,235,:3]
big=img.resize((W*SS,H*SS),Image.LANCZOS); d=ImageDraw.Draw(big)
S=lambda p:(p[0]*SS,p[1]*SS)
Lt,Rt,Bt=(212,110),(259,110),(235.5,141)
smask=Image.fromarray((shirt*255).astype(np.uint8)).resize((W*SS,H*SS))
skinlayer=Image.new('RGBA',big.size,(0,0,0,0)); ds=ImageDraw.Draw(skinlayer)
ds.polygon([S(Lt),S(Rt),S(Bt)],fill=tuple(int(v) for v in skin)+(255,))
big.alpha_composite(skinlayer)
d=ImageDraw.Draw(big)
d.line([S((Lt[0]-2,Lt[1]-1)),S(Bt),S((Rt[0]+2,Rt[1]-1))],fill=(16,16,18,255),width=int(3.6*SS),joint='curve')
d.line([S((Lt[0]+1.5,Lt[1]+1)),S((Bt[0],Bt[1]-2.5)),S((Rt[0]-1.5,Rt[1]+1))],fill=(150,14,24,255),width=int(0.9*SS),joint='curve')
# --- três listras vermelhas nos ombros (mascaradas pela camisa)
three=Image.new('RGBA',big.size,(0,0,0,0)); dt=ImageDraw.Draw(three)
for side in (1,-1):
    pts=[(212,113),(152,138),(133,192)] if side==1 else [(259,113),(318,136),(336,192)]
    for j,o in enumerate((5.0,9.0,13.0)):
        q=[(x+(o*0.35 if side==1 else -o*0.35),y+o) for x,y in pts]
        dt.line([S(p) for p in q],fill=(214,24,36,255),width=int(2.0*SS),joint='curve')
ta=np.array(three); ta[...,3]=np.minimum(ta[...,3],np.array(smask))
big.alpha_composite(Image.fromarray(ta))
img=big.resize((W,H),Image.LANCZOS)
# --- escudo branco (lado esquerdo do peito do boneco = direita da tela) e logo adidas branco
crest=Image.open('public/escudos-clubes/flamengo.webp').convert('RGBA'); c=np.array(crest).astype(float)
cr,cg,cb,ca=c[...,0],c[...,1],c[...,2],c[...,3]
hh,ww=ca.shape; cy,cx=np.mgrid[0:hh,0:ww]
dark=(cr<70)&(cg<70)&(cb<70)
box=(cx<ww*0.47)&(cy<hh*0.38)
redp=(cr>120)&(cg<90)
edge=(ca>60)&~(np.array(Image.fromarray(((ca>60)*255).astype(np.uint8)).filter(ImageFilter.MinFilter(11)))>128)
keep=((ca>60)&~dark&~(box&redp))|edge
wc=np.zeros_like(c); wc[...,:3]=255; wc[...,3]=np.where(keep,ca,0)
crw=Image.fromarray(wc.astype(np.uint8),'RGBA')
cw=24; ch=round(cw*crest.height/crest.width)
img.alpha_composite(crw.resize((cw,ch),Image.LANCZOS),(253,140))
# adidas (três barras inclinadas) em branco
lg=Image.new('RGBA',(22*SS,16*SS),(0,0,0,0)); dl=ImageDraw.Draw(lg)
for i,h in enumerate((7,11,15)):
    x0=(2+i*6.5)*SS; dl.polygon([(x0,16*SS),(x0+4.6*SS,16*SS),(x0+4.6*SS+h*0.55*SS,(16-h)*SS),(x0+h*0.55*SS,(16-h)*SS)],fill=(255,255,255,255))
img.alpha_composite(lg.resize((22,16),Image.LANCZOS),(197,150))
img.save(f'{SP}/base-neutra-flamengo-2025.webp',quality=90,method=6)
bg=Image.new('RGBA',img.size,(244,236,214,255)); bg.alpha_composite(img)
bg.crop((100,90,370,350)).resize((540,520),Image.LANCZOS).convert('RGB').save(f'{SP}/fla25_zoom.png')
