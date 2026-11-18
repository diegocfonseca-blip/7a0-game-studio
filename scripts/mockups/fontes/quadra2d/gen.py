import math
S=10 # px por pé
W,H=94*S,50*S
def quadra(gid):
  o=[]
  o.append(f'<defs><pattern id="mad{gid}" width="60" height="12" patternUnits="userSpaceOnUse"><rect width="60" height="12" fill="#D9A15F"/><rect width="60" height="6" fill="#D29655"/><line x1="0" y1="12" x2="60" y2="12" stroke="#B87C3E" stroke-width="1"/><line x1="22" y1="0" x2="22" y2="6" stroke="#B87C3E" stroke-width="1"/><line x1="48" y1="6" x2="48" y2="12" stroke="#B87C3E" stroke-width="1"/></pattern></defs>')
  o.append(f'<rect x="0" y="0" width="{W}" height="{H}" fill="url(#mad{gid})"/>')
  L='stroke="#fff" stroke-width="3" fill="none"'
  for lado in (0,1):
    bx = 5.25*S if lado==0 else W-5.25*S
    base = 0 if lado==0 else W
    d = 1 if lado==0 else -1
    pin = '#C2452F' if lado==0 else '#1B4FA8'
    # garrafão
    x0 = 0 if lado==0 else W-19*S
    o.append(f'<rect x="{x0}" y="{17*S}" width="{19*S}" height="{16*S}" fill="{pin}" fill-opacity=".82" {L}/>')
    ftx = 19*S if lado==0 else W-19*S
    o.append(f'<circle cx="{ftx}" cy="{25*S}" r="{6*S}" {L}/>')
    # 3 pontos
    cx=bx; r=23.75*S
    y1,y2=3*S,47*S
    xc = cx + d*math.sqrt(r*r-(cx-cx)**2 - (25*S-y1)**2) if False else None
    dx=math.sqrt(r*r-(25*S-y1)**2)
    xt = cx + d*dx
    o.append(f'<path d="M{base},{y1} L{xt:.1f},{y1} A{r},{r} 0 0 {1 if lado==0 else 0} {xt:.1f},{y2} L{base},{y2}" {L}/>')
    # área restrita
    o.append(f'<path d="M{bx},{21*S} A{4*S},{4*S} 0 0 {1 if lado==0 else 0} {bx},{29*S}" {L}/>')
    # tabela e aro
    tx = 4*S if lado==0 else W-4*S
    o.append(f'<line x1="{tx}" y1="{22*S}" x2="{tx}" y2="{28*S}" stroke="#0C0C0C" stroke-width="6"/>')
    o.append(f'<circle cx="{bx}" cy="{25*S}" r="9" fill="none" stroke="#E8503A" stroke-width="4"/>')
  o.append(f'<line x1="{W/2}" y1="0" x2="{W/2}" y2="{H}" {L}/>')
  o.append(f'<circle cx="{W/2}" cy="{H/2}" r="{6*S}" fill="#FFC400" fill-opacity=".9" {L}/>')
  o.append(f'<text x="{W/2}" y="{H/2+12}" text-anchor="middle" font-family="Oswald" font-weight="900" font-size="34" fill="#0C0C0C">BL</text>')
  o.append(f'<rect x="1.5" y="1.5" width="{W-3}" height="{H-3}" {L}/>')
  return '\n'.join(o)
# jogadores (x,y em pés) — ataque dourado indo pra DIREITA
casa=[('Magic','magic-johnson',32,'PG',63,26),('Jordan','michael-jordan',23,'SG',89,5),('Bird','larry-bird',33,'SF',69,44),('Malone','karl-malone',32,'PF',76,33),('Shaq','shaquille-oneal',34,'C',83,14)]
fora=[('Frazier','walt-frazier',10,'PG',69,24),('Starks','',3,'SG',83,9),('Reed','willis-reed',19,'SF',75,42),('Oakley','',34,'PF',81,36),('Ewing','patrick-ewing',33,'C',88,18)]
def fichas(rot):
  o=[]
  for lista,cor,txt in ((casa,'#FFC400','#0C0C0C'),(fora,'#1B4FA8','#fff')):
    for nome,img,num,pos,x,y in lista:
      px,py=x*S,y*S
      o.append((nome,img,num,cor,txt,px,py))
  return o
MOB={'Magic':(350,540),'Frazier':(250,565),'Bird':(70,640),'Reed':(150,700),'Malone':(80,830),'Oakley':(170,815),'Shaq':(260,760),'Ewing':(345,720),'Starks':(425,730),'Jordan':(450,870)}
def svg(rot, gid):
  w,h=(W,H) if not rot else (H,W)
  tr = '' if not rot else f'transform="translate({H},0) rotate(90)"'
  vb = f'-40 -40 {w+80} {h+80}' if not rot else f'-20 440 {w+40} 560'
  g=[f'<svg viewBox="{vb}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" class="q">']
  g.append(f'<rect x="-40" y="-40" width="{w+80}" height="{h+80}" fill="#1a1410"/>')
  g.append(f'<g {tr}>'+quadra(gid)+'</g>')
  def P(x,y): return (x,y) if not rot else (H-y,x)
  # passe/rastro da bola: Magic -> Jordan
  ax,ay=P(63*S,26*S) if not rot else MOB['Magic']; bx_,by_=P(89*S,5*S) if not rot else MOB['Jordan']
  g.append(f'<line x1="{ax}" y1="{ay}" x2="{bx_}" y2="{by_}" stroke="#fff" stroke-opacity=".55" stroke-width="5" stroke-dasharray="2 10" stroke-linecap="round"/>')
  for nome,img,num,cor,txt,px,py in fichas(rot):
    x,y=(P(px,py) if not rot else MOB[nome]); r=38 if rot else 26
    if img:
      g.append(f'<clipPath id="c{gid}{img}"><circle cx="{x}" cy="{y}" r="{r-4}"/></clipPath><circle cx="{x}" cy="{y}" r="{r}" fill="{cor}" stroke="#0C0C0C" stroke-width="3"/><image href="{img}.webp" x="{x-r}" y="{y-r+2}" width="{2*r}" height="{2*r}" clip-path="url(#c{gid}{img})"/>')
    else:
      g.append(f'<circle cx="{x}" cy="{y}" r="{r-4}" fill="{cor}" stroke="#0C0C0C" stroke-width="3"/><text x="{x}" y="{y+8}" text-anchor="middle" font-family="Oswald" font-weight="900" font-size="{32 if rot else 22}" fill="{txt}">{num}</text>')
    curto=nome
    g.append(f'<rect x="{x-(42 if rot else 34)}" y="{y+r+2}" width="{84 if rot else 68}" height="{26 if rot else 20}" rx="5" fill="#0C0C0C" fill-opacity=".82"/><text x="{x}" y="{y+r+(22 if rot else 17)}" text-anchor="middle" font-family="Oswald" font-weight="700" font-size="{21 if rot else 15}" fill="#fff">{curto}</text>')
  # bola com o Jordan + seta
  x,y=P(89*S,5*S) if not rot else MOB['Jordan']
  g.append(f'<circle cx="{x+20}" cy="{y-14}" r="10" fill="#E8701A" stroke="#0C0C0C" stroke-width="2.5"/><path d="M{x+10},{y-14} h20 M{x+20},{y-24} v20" stroke="#0C0C0C" stroke-width="1.5"/>')
  g.append(f'<path d="M{x-9},{y-48} h18 l-9,12 z" fill="#fff" stroke="#0C0C0C" stroke-width="2"/>')
  # +3 flutuando sobre a cesta do último lance (exemplo de efeito)
  x,y=P(89*S,5*S) if not rot else MOB['Jordan']
  bxo,byo=(x-250,y-35) if not rot else (x-170,y+40)
  g.append(f'<g><rect x="{bxo}" y="{byo}" width="92" height="40" rx="10" fill="#FFC400" stroke="#0C0C0C" stroke-width="3"/><text x="{bxo+46}" y="{byo+29}" text-anchor="middle" font-family="Oswald" font-weight="900" font-size="26" fill="#0C0C0C">+3 🔥</text></g>')
  g.append('</svg>')
  return '\n'.join(g)
def torcida(n, a, b):
  import random
  random.seed(n)
  return ''.join(f'<i style="background:{a if random.random()<.7 else b}"></i>' for _ in range(n))
placar='<div class="placar"><span class="dot" style="background:#FFC400"></span>GDZ <b>87</b><em>×</em><b>84</b> NYK <span class="dot" style="background:#1B4FA8"></span><span class="rel">Q4 · 2:14</span><span class="sc">⏱ 14</span></div>'
narr='<div class="narr">🎙️ <b>Magic</b> olha pra um lado e passa pro outro — <b>Jordan</b> recebe na zona morta… <b>DE TRÊS!</b></div>'
html=f'''<!doctype html><meta charset=utf-8><link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;700;900&family=Inter:wght@500;700&display=swap" rel=stylesheet>
<style>
body{{margin:0;background:#F4ECD6;font-family:Inter,system-ui;color:#0C0C0C;padding:28px}}
h1{{font:900 40px Oswald;text-transform:uppercase;margin:0 0 4px}} .sub{{font-weight:700;color:#0009;margin:0 0 18px}}
.wrap{{display:grid;grid-template-columns:1fr 400px;gap:26px;align-items:start}}
.arena{{background:#12100e;border:4px solid #000;border-radius:22px;box-shadow:5px 5px 0 #000;padding:14px;position:relative}}
.arq{{display:flex;flex-wrap:wrap;gap:4px;padding:6px 26px}} .arq i{{width:9px;height:9px;border-radius:50%;display:block;opacity:.9}}
.placas{{display:flex;gap:8px;margin:4px 26px 8px}} .placas span{{flex:1;background:#f4ecd6;border:2px solid #000;border-radius:6px;text-align:center;font:700 13px Oswald;padding:3px 0}}
.placas span:nth-child(2n){{background:#0C0C0C;color:#FFC400}}
.q{{width:100%;display:block}}
.placar{{position:absolute;top:22px;left:26px;background:#fff;border:3px solid #000;border-radius:12px;padding:6px 12px;font:900 20px Oswald;display:flex;align-items:center;gap:6px;box-shadow:3px 3px 0 #000;z-index:2}}
.placar b{{color:#c48a00}} .placar em{{font-style:normal;font-size:14px;color:#0007}} .dot{{width:12px;height:12px;border:2px solid #000;border-radius:3px;display:inline-block}}
.rel{{margin-left:8px;font-size:16px;color:#0C0C0C}} .sc{{margin-left:6px;background:#C2452F;color:#fff;border-radius:6px;padding:0 6px;font-size:15px}}
.banco{{display:flex;justify-content:space-between;padding:8px 26px 2px}} .tec{{display:flex;align-items:center;gap:8px;font:700 12px Oswald;color:#fff}}
.tec .cap{{width:30px;height:30px;border-radius:50%;border:3px solid #000;display:grid;place-items:center;font-size:15px}}
.tec .bal{{background:#fff;color:#0C0C0C;border:2px solid #000;border-radius:10px;padding:3px 8px;font-size:13px}}
.narr{{margin-top:14px;background:#fff;border:3px solid #000;border-radius:14px;padding:12px 16px;font-size:17px;box-shadow:4px 4px 0 #000}}
.cards{{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:20px}} .card{{background:#fff;border:3px solid #000;border-radius:14px;padding:12px;box-shadow:4px 4px 0 #000;font-size:13.5px;line-height:1.4}}
.card h3{{font:900 17px Oswald;margin:0 0 6px;text-transform:uppercase}}
.cel{{background:#0C0C0C;border:4px solid #000;border-radius:34px;padding:12px;box-shadow:5px 5px 0 #000}}
.cel .tela{{background:#12100e;border-radius:24px;overflow:hidden;position:relative;padding-bottom:10px}}
.cel .placar{{position:static;margin:10px;justify-content:center;font-size:18px}}
.cel .narr{{margin:10px;font-size:14px;box-shadow:none}} .lbl{{font:900 18px Oswald;text-transform:uppercase;margin:0 0 8px}}
</style>
<h1>🏀 Quadra 2D · proposta</h1><p class=sub>O mesmo Campo 2D do futebol, agora em quadra de basquete: 5 contra 5, ao vivo, no tempo do jogo. Celular em pé · computador deitado.</p>
<div class=wrap>
<div><p class=lbl>💻 Computador (deitado)</p>
<div class=arena>{placar}
<div class=arq style="padding-top:44px">{torcida(330,'#FFC400','#1B4FA8')}</div>
<div class=placas><span>VADICO VEÍCULOS</span><span>~ TIDEX</span><span>VADICO VEÍCULOS</span><span>~ TIDEX</span></div>
{svg(False,'d')}
<div class=placas style="margin-top:8px"><span>~ TIDEX</span><span>VADICO VEÍCULOS</span><span>~ TIDEX</span><span>VADICO VEÍCULOS</span></div>
<div class=banco><div class=tec><span class=cap style="background:#FFC400">🧢</span>SEU TÉCNICO <span class=bal>🔥 Corre, corre!</span></div><div class=tec><span class=bal>🧱 Fecha o garrafão!</span>RIVAL <span class=cap style="background:#1B4FA8">🧢</span></div></div>
<div class=arq>{torcida(330,'#FFC400','#1B4FA8')}</div>
</div>{narr}</div>
<div><p class=lbl>📱 Celular (em pé)</p><div class=cel><div class=tela>{placar}{svg(True,'m')}{narr}</div></div></div>
</div>
<div class=cards>
<div class=card><h3>🟫 Quadra</h3>Piso de madeira, garrafão pintado nas cores dos times, linha de 3, lance livre, tabela e aro. No computador a quadra inteira; no celular a câmera segue a bola e mostra a meia-quadra do ataque, com o jogador maior.</div>
<div class=card><h3>⛹️ Jogadores</h3>5 de cada lado, nas vagas do quinteto (armador, ala-armador, ala, ala-pivô, pivô). Lenda com rosto; os outros com o número. Seta em quem tem a bola.</div>
<div class=card><h3>⏱️ O jogo</h3>4 quartos, posse de 24s (o relógio vermelho), cesta de 2, de 3 e lance livre, toco, roubo e rebote. O placar do 2D é o MESMO do jogo — nada de resultado diferente.</div>
<div class=card><h3>🎙️ Narração + festa</h3>A mesma rádio do basquete embaixo (as 191 frases). "+3 🔥" sobe na cesta, torcida nas cores dos times, técnicos gritando do banco. Telão embaixo, como no futebol.</div>
</div>'''
open('/tmp/claude-0/harness/q2d/index.html','w').write(html)
