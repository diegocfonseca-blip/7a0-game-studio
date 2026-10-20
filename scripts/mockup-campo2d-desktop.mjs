// 🖼️ MOCKUP do CAMPO 2D no DESKTOP (20/10): campo DEITADO (horizontal) com gramado de TV, jogadores com camisa,
// arquibancada em fileiras, placas nas laterais, árbitro e rastro da bola. Só pra o Diego aprovar — nada daqui é código do jogo.
//   node scripts/mockup-campo2d-desktop.mjs  →  scripts/mockups/campo2d-desktop.png
import { chromium } from 'playwright-core'
import { writeFileSync, mkdirSync } from 'node:fs'

const html = String.raw`<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;700;800;900&display=swap" rel="stylesheet">
<style>
  body{margin:0;background:#F4ECD6;font-family:Oswald,'Arial Narrow',Arial,sans-serif;display:flex;justify-content:center;padding:18px}
  .wrap{width:1100px}
  h1{margin:0 0 10px;font-size:22px;font-weight:900;text-transform:uppercase;letter-spacing:.5px;color:#0C0C0C}
  .box{border:3px solid #0C0C0C;border-radius:16px;box-shadow:4px 4px 0 #0C0C0C;overflow:hidden;background:#17202a;position:relative}
  canvas{display:block}
  .bug{position:absolute;left:14px;top:14px;background:#0C0C0C;color:#fff;border:2px solid #fff;border-radius:9px;padding:4px 12px;font-weight:900;font-size:15px;display:flex;gap:8px;align-items:center}
  .bug i{display:inline-block;width:10px;height:10px;border-radius:3px;border:1px solid #fff}
  .bug b{color:#FFC400}
  .narra{margin-top:10px;background:#fff;border:3px solid #0C0C0C;border-radius:12px;padding:9px 12px;font-weight:700;font-size:15px;box-shadow:3px 3px 0 #0C0C0C;font-family:system-ui,sans-serif}
  .legenda{margin-top:14px;display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
  .legenda div{background:#fff;border:3px solid #0C0C0C;border-radius:12px;padding:8px 10px;font-size:13px;font-family:system-ui,sans-serif;box-shadow:3px 3px 0 #0C0C0C}
  .legenda b{font-family:Oswald;font-size:14px;text-transform:uppercase}
</style></head><body><div class="wrap">
<h1>📺 Campo 2D — desktop (deitado)</h1>
<div class="box"><canvas id="c" width="1100" height="640"></canvas>
<div class="bug"><i style="background:#FFC400"></i>FAB <b>1 × 0</b> CHE <i style="background:#2B6CFF"></i><span style="opacity:.8">38'</span></div>
</div>
<div class="narra">🎙️ <b>Zico</b> levanta a cabeça e ENFIA pro <b>Romário</b>!</div>
<div class="legenda">
 <div><b>🟩 Gramado</b><br>listras cortadas, meia-lua e marca do pênalti, sombra da arquibancada caindo no canto</div>
 <div><b>🧍 Jogadores</b><br>camisa do time com número, lenda com rosto, pezinho mexendo, seta em quem tem a bola, rastro na bola</div>
 <div><b>🏟️ Estádio</b><br>3 fileiras de torcida nas cores dos times, bandeirão atrás do gol, placas Vadico/Tidex nas laterais, juiz de preto</div>
</div></div>
<script>
const c=document.getElementById('c'),x=c.getContext('2d')
const W=1100,H=640, PX=70, PY=92            // margens: arquibancada em cima/embaixo, gols nas pontas
const FW=W-PX*2, FH=H-PY*2                   // campo 105×68 deitado
const sx=FW/105, sy=FH/68
const px=v=>PX+v*sx, py=v=>PY+v*sy
const GOLD='#FFC400', BLUE='#2B6CFF', INK='#0C0C0C'
// 🏟️ fundo do estádio
x.fillStyle='#1b232c';x.fillRect(0,0,W,H)
// arquibancadas (3 fileiras em cima e embaixo)
function arquibancada(y0,dir){
  for(let f=0;f<3;f++){const yy=y0+dir*(f*18+8)
    x.fillStyle=f%2?'#232c36':'#1f2831';x.fillRect(PX-40,Math.min(yy,yy+dir*16),FW+80,16)
    for(let i=0;i<120;i++){const xx=PX-36+i*((FW+72)/120)+((i*7)%5);const cor=(i*13+f*5)%3===0?BLUE:GOLD
      x.beginPath();x.arc(xx,yy+dir*8+((i*3)%4-2),3.1,0,7);x.fillStyle=cor;x.globalAlpha=.85;x.fill();x.globalAlpha=1}}
}
arquibancada(0,1); arquibancada(H,-1)
// bandeirão atrás dos gols (nas pontas, torcida de cada lado)
function bandeirao(x0,cor,txt){x.save();x.translate(x0,H/2);x.rotate(-Math.PI/2);x.fillStyle=cor;x.globalAlpha=.9
  x.beginPath();x.moveTo(-120,-26);x.lineTo(120,-22);x.lineTo(116,22);x.lineTo(-124,26);x.closePath();x.fill();x.globalAlpha=1
  x.fillStyle=INK;x.font='900 22px Oswald, Arial Narrow, Arial, sans-serif';x.textAlign='center';x.fillText(txt,0,8);x.restore()}
bandeirao(26,GOLD,'FABULOUS'); bandeirao(W-26,BLUE,'CHELSÃO')
// placas de propaganda nas laterais (cima e embaixo, trocando Vadico/Tidex)
function placas(y){const n=5,w=FW/n
  for(let i=0;i<n;i++){const vad=i%2===0;x.fillStyle=vad?'#e9e9e9':'#0d1b2a';x.fillRect(PX+i*w,y,w-3,22)
    x.fillStyle=vad?'#222':'#5ec8ff';x.font='800 15px Oswald, Arial Narrow, Arial, sans-serif';x.textAlign='center';x.fillText(vad?'Ⓥ VADICO VEÍCULOS':'~ TIDEX',PX+i*w+w/2,y+16)}}
placas(PY-30); placas(PY+FH+8)
// 🟩 gramado com listras cortadas
for(let i=0;i<14;i++){x.fillStyle=i%2?'#2a8542':'#32984e';x.fillRect(PX+i*FW/14,PY,FW/14+1,FH)}
// sombra da arquibancada caindo no canto
const g=x.createLinearGradient(PX,PY,PX+260,PY+200);g.addColorStop(0,'rgba(0,0,0,.28)');g.addColorStop(1,'rgba(0,0,0,0)')
x.fillStyle=g;x.beginPath();x.moveTo(PX,PY);x.lineTo(PX+FW*.55,PY);x.lineTo(PX,PY+FH*.75);x.closePath();x.fill()
// linhas
x.strokeStyle='rgba(255,255,255,.9)';x.lineWidth=2.5
x.strokeRect(px(0),py(0),FW,FH)
x.beginPath();x.moveTo(px(52.5),py(0));x.lineTo(px(52.5),py(68));x.stroke()
x.beginPath();x.arc(px(52.5),py(34),9.15*sx,0,7);x.stroke()
x.beginPath();x.arc(px(52.5),py(34),3,0,7);x.fillStyle='#fff';x.fill()
for(const s of [1,-1]){const x0=s>0?0:105, d=v=>s>0?x0+v:x0-v
  x.strokeRect(Math.min(px(d(0)),px(d(16.5))),py(13.85),16.5*sx,40.3*sy)
  x.strokeRect(Math.min(px(d(0)),px(d(5.5))),py(24.85),5.5*sx,18.3*sy)
  x.beginPath();x.arc(px(d(11)),py(34),3,0,7);x.fill()            // marca do pênalti
  x.beginPath();x.arc(px(d(11)),py(34),9.15*sx,s>0?-0.93:Math.PI-0.93,s>0?0.93:Math.PI+0.93);x.stroke() // meia-lua
  // gol com rede
  const gx=s>0?px(0)-18:px(105);x.fillStyle='rgba(255,255,255,.35)';x.fillRect(gx,py(30.34),18,7.32*sy)
  x.lineWidth=3;x.strokeStyle='#fff';x.strokeRect(gx,py(30.34),18,7.32*sy);x.lineWidth=2.5;x.strokeStyle='rgba(255,255,255,.9)'
  for(let i=1;i<4;i++){x.beginPath();x.moveTo(gx+i*4.5,py(30.34));x.lineTo(gx+i*4.5,py(37.66));x.strokeStyle='rgba(255,255,255,.4)';x.lineWidth=1;x.stroke()}
  x.lineWidth=2.5;x.strokeStyle='rgba(255,255,255,.9)'
  // escanteios
  for(const cy of [0,68]){x.beginPath();x.arc(px(d(0)),py(cy),10,0,7);x.stroke()}
}
x.save();x.beginPath();x.rect(px(0),py(0),FW,FH);x.clip()
// 🧍 jogadores: {x,y,lado,nome,num,lenda,bola}
const casa=[[6,34,'Taffarel',1],[22,10,'Cafu',2,1],[20,26,'T. Silva',3],[20,42,'Índio',4],[22,58,'R. Carlos',6,1],[38,22,'Mineiro',8],[42,34,'Zico',10,1],[40,48,'Kaká',8,1],[60,14,'Dentinho',7],[64,34,'Romário',11,1,1],[62,52,'Fenômeno',9,1]]
const fora=[[99,34,'A. Muralha',1],[84,12,'Cicinho',2],[86,28,'J. Terry',26,1],[86,42,'Chicão',4],[84,56,'A. Cole',3,1],[72,22,'Lampard',8,1],[70,36,'Léo Lima',10],[72,48,'Gerrard',8,1],[56,16,'T. Henry',14,1],[54,36,'Luciano',9],[55,54,'L. Messi',10,1]]
const R=13
function jogador(p,cor,lado){const[X0,Y0,nome,num,lenda,bola]=p;const X=px(X0),Y=py(Y0)
  // sombra + pezinhos
  x.beginPath();x.ellipse(X,Y+R+2,R*.9,4,0,0,7);x.fillStyle='rgba(0,0,0,.3)';x.fill()
  x.fillStyle=INK;x.beginPath();x.ellipse(X-5,Y+R-1,4,2.5,0,0,7);x.fill();x.beginPath();x.ellipse(X+5,Y+R+1,4,2.5,0,0,7);x.fill()
  // camisa (bola com o manto: cor do time + gola/ombros mais escuros)
  x.beginPath();x.arc(X,Y,R,0,7);x.fillStyle=cor;x.fill();x.lineWidth=2.5;x.strokeStyle=INK;x.stroke()
  x.save();x.beginPath();x.arc(X,Y,R-1.5,0,7);x.clip();x.fillStyle='rgba(0,0,0,.22)';x.fillRect(X-R,Y-R,R*2,6);x.restore()
  if(lenda){ // lenda: rostinho (aqui um boneco neutro) com anel na cor do time
    x.beginPath();x.arc(X,Y+1,R-4,0,7);x.fillStyle='#f1d3b3';x.fill();x.fillStyle='#3a2a1c';x.beginPath();x.arc(X,Y-3,R-5,Math.PI,0);x.fill()
    x.beginPath();x.arc(X,Y,R,0,7);x.lineWidth=3.5;x.strokeStyle='#fff';x.stroke();x.beginPath();x.arc(X,Y,R+2,0,7);x.lineWidth=2;x.strokeStyle=cor;x.stroke()
  }else{x.fillStyle=cor===GOLD?INK:'#fff';x.font='800 14px Oswald, Arial Narrow, Arial, sans-serif';x.textAlign='center';x.fillText(num,X,Y+5)}
  if(bola){x.beginPath();x.arc(X,Y,R+5,0,7);x.lineWidth=2;x.strokeStyle='rgba(255,255,255,.95)';x.setLineDash([4,3]);x.stroke();x.setLineDash([])
    x.fillStyle='#fff';x.beginPath();x.moveTo(X,Y-R-14);x.lineTo(X-6,Y-R-22);x.lineTo(X+6,Y-R-22);x.closePath();x.fill()}
  x.font='700 11px Oswald, Arial Narrow, Arial, sans-serif';const w=x.measureText(nome).width+8;x.fillStyle='rgba(0,0,0,.6)';x.fillRect(X-w/2,Y+R+4,w,13);x.fillStyle='#fff';x.textAlign='center';x.fillText(nome,X,Y+R+14)
}
casa.forEach(p=>jogador(p,GOLD,0)); fora.forEach(p=>jogador(p,BLUE,1))
// juiz
{const X=px(48),Y=py(26);x.beginPath();x.ellipse(X,Y+R,R*.8,4,0,0,7);x.fillStyle='rgba(0,0,0,.3)';x.fill();x.beginPath();x.arc(X,Y,R-2,0,7);x.fillStyle='#111';x.fill();x.lineWidth=2;x.strokeStyle='#ff0';x.stroke();x.fillStyle='#ff0';x.font='800 12px Oswald, Arial Narrow, Arial, sans-serif';x.textAlign='center';x.fillText('👁',X,Y+4)
 x.font='700 10px Oswald, Arial Narrow, Arial, sans-serif';x.fillStyle='rgba(0,0,0,.6)';x.fillRect(X-16,Y+R+2,32,12);x.fillStyle='#fff';x.fillText('JUIZ',X,Y+R+11)}
// ⚽ bola com rastro (passe do Zico pro Romário)
const bx0=px(44),by0=py(33),bx1=px(62),by1=py(34)
const tr=x.createLinearGradient(bx0,by0,bx1,by1);tr.addColorStop(0,'rgba(255,255,255,0)');tr.addColorStop(1,'rgba(255,255,255,.8)')
x.strokeStyle=tr;x.lineWidth=5;x.lineCap='round';x.beginPath();x.moveTo(bx0,by0);x.lineTo(bx1,by1);x.stroke()
x.beginPath();x.ellipse(bx1+2,by1+4,6,3,0,0,7);x.fillStyle='rgba(0,0,0,.35)';x.fill()
x.beginPath();x.arc(bx1,by1-3,6,0,7);x.fillStyle='#fff';x.fill();x.lineWidth=1.5;x.strokeStyle='#111';x.stroke()
x.restore()
// 🧢 técnicos na beira (embaixo), com balão
function tecnico(X,cor,nome,fala){const Y=PY+FH+58
  x.fillStyle='rgba(0,0,0,.5)';x.fillRect(X-26,Y-16,52,32)
  x.beginPath();x.arc(X,Y,12,0,7);x.fillStyle='#1b1b1b';x.fill();x.lineWidth=3;x.strokeStyle=cor;x.stroke()
  x.font='14px sans-serif';x.textAlign='center';x.fillText('🧢',X,Y+5)
  x.font='700 11px Oswald, Arial Narrow, Arial, sans-serif';x.fillStyle='#fff';x.fillText(nome,X,Y+27)
  x.font='700 13px Oswald, Arial Narrow, Arial, sans-serif';const w=x.measureText(fala).width+12;x.fillStyle='#fff';x.strokeStyle=INK;x.lineWidth=2;x.beginPath();x.roundRect(X+18,Y-12,w,20,6);x.fill();x.stroke();x.fillStyle=INK;x.textAlign='left';x.fillText(fala,X+24,Y+3)}
tecnico(PX+140,GOLD,'SANTANA','🔥 Pra cima!'); tecnico(PX+FW-200,BLUE,'MOURINHO','🧱 Fecha a casinha!')
</script></body></html>`

mkdirSync('scripts/mockups', { recursive: true })
const tmp = 'scripts/mockups/_campo2d-desktop.html'
writeFileSync(tmp, html)
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1140, height: 860 }, deviceScaleFactor: 2 })
await p.goto('file://' + process.cwd() + '/' + tmp)
await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(600)
await p.screenshot({ path: 'scripts/mockups/campo2d-desktop.png', fullPage: true })
await b.close()
console.log('→ scripts/mockups/campo2d-desktop.png')
