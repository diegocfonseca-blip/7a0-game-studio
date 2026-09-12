// 🗞️ MOCKUP — a imagem de COMPARTILHAR O JORNAL (O Martelo, fim de temporada).
// Esquerda = como sai hoje (o print que o Diego mandou). Direita = a proposta,
// usando o que o jogo ganhou depois: ESCUDO de cada campeão, ROSTO do artilheiro,
// MANTO e MASCOTE do clube. O papel de jornal continua igual — é a cara dele.
// Rodar: node scripts/mockup-share-jornal.mjs
import { chromium } from 'playwright-core'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..')
const b64 = p => { try { return 'data:image/webp;base64,' + readFileSync(join(raiz, p)).toString('base64') } catch { return '' } }
const av = n => b64(`public/avatars/lendas-v1/${n}.webp`)
const INK = '#0C0C0C', GOLD = '#FFC400', PAPEL = '#F7F1DD', VERM = '#B23A2A'
const C1 = '#0A0A0A', C2 = '#E3E2E1' // manto medido do Nova Eclipse
const escudo = b64('src/escalacao/img/novaeclipse-escudo.webp')
const mascote = b64('src/escalacao/img/novaeclipse-mascote.webp')

// mesmos dados do print que ele mandou (T388)
const DONOS = [
  { d:'A', cor:'#E7A21F', time:'Nova Eclipse', voce:true, art:'Vinícius Júnior', clube:'Corporação Capsule FC', gols:19, rosto:av('vinicius-junior-real-madrid-2024') },
  { d:'B', cor:'#8C97A3', time:'Comercial da Baixada', art:'Zagallo', clube:'White Thigs do GuGu', gols:20, rosto:av('zagallo-botafogo-1962') },
  { d:'C', cor:'#C77B3C', time:'Barcenite FC', art:'Rummenigge', clube:'Ferroviário da Serra', gols:19, rosto:'' },
  { d:'D', cor:'#1E7A3D', time:'Bagres de Wall Street FC', art:'Son Heung-min', clube:'Bagres de Wall Street FC', gols:25, rosto:'' },
  { d:'V', cor:'#8B8168', time:'Ressaca United', art:'Alan Shearer', clube:'Continental Real', gols:23, rosto:av('alan-shearer-newcastle-1996') },
  { d:'🏆', cor:'#2E6FB0', time:'Nova Eclipse', voce:true, copa:true, art:'Luis Suárez', clube:'Leão da Estradinha', gols:7, rosto:av('luis-suarez-barcelona-2016') },
]
const NUMS = [['Posição','1º'],['Pontos','71'],['V · E · D','22-5-11'],['Gols (pró/contra)','72/50'],['Saldo','+22']]

const linhaHoje = o => `<div class="dh">
  <span class="dd" style="background:${o.cor}">${o.d}</span>
  <span class="dt">${o.time}</span><span class="dc">${o.voce?'CAMPEÃO ⭐ VOCÊ':(o.copa?'CAMPEÃO DA COPA':'CAMPEÃO')}</span>
  <div class="da">⚽ ${o.art} (${o.clube}) · ${o.gols} gols</div></div>`
const linhaNova = o => `<div class="dn">
  <span class="dd" style="background:${o.cor}">${o.d}</span>
  <img class="desc" src="${o.time==='Nova Eclipse'?escudo:''}" onerror="this.style.visibility='hidden'"/>
  <div class="dmid"><div class="dt2">${o.time} <span class="dc2">${o.voce?'CAMPEÃO ⭐ VOCÊ':(o.copa?'CAMPEÃO DA COPA':'CAMPEÃO')}</span></div>
    <div class="da2">⚽ ${o.art} <i>(${o.clube})</i> · <b>${o.gols} gols</b></div></div>
  <div class="dros">${o.rosto?`<img src="${o.rosto}"/>`:`<span>⚽</span>`}</div></div>`

const html = `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;700;800;900&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#2a2a2a;display:flex;gap:34px;padding:34px;font-family:Oswald,Arial,sans-serif}
.col{width:1080px}
.tag{font-weight:900;font-size:30px;color:#fff;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px}
.tag b{color:${GOLD}}
.jor{background:${PAPEL};border:6px solid ${INK};padding:34px 40px 0}
.mast{display:flex;align-items:flex-end;justify-content:space-between}
.mt{font-family:Georgia,serif;font-weight:900;font-size:64px;color:${INK}}
.mt i{color:${VERM};font-style:normal}
.med{text-align:right;color:#3a3527;font-weight:800;font-size:20px;line-height:1.5}
.rule{border-top:3px solid ${INK};border-bottom:3px solid ${INK};height:7px;margin:14px 0 0}
.sub{display:flex;justify-content:space-between;color:#3a3527;font-weight:900;font-size:21px;padding:12px 0 10px;border-bottom:1.5px solid ${INK}}
h1{font-family:Georgia,serif;font-size:56px;line-height:1.05;color:${INK};margin:22px 0 12px;text-transform:uppercase}
.lead{font-family:Georgia,serif;font-style:italic;font-size:25px;color:#3a3527;line-height:1.35;margin-bottom:20px}
.duo{display:flex;gap:18px;margin-bottom:22px}
.box{flex:1;border:4px solid ${INK}}
.bxc{background:linear-gradient(160deg,#1B7A3D,#14401f);height:230px;position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px}
.bxc img.e{width:96px;height:96px;object-fit:contain}
.bxc .nm{color:#fff;font-weight:900;font-size:28px}
.bxc .sb{color:rgba(255,255,255,.75);font-weight:700;font-size:17px;font-family:Georgia,serif;font-style:italic}
.stamp{position:absolute;top:16px;right:-6px;transform:rotate(-9deg);background:#F7E6C9;border:3px solid ${VERM};color:${VERM};font-weight:900;font-size:19px;padding:3px 14px}
.tbl{background:${INK};color:#fff;font-weight:900;font-size:21px;padding:9px 16px}
.trow{display:flex;justify-content:space-between;padding:10px 16px;border-bottom:1.5px solid rgba(0,0,0,.15);background:#fff;font-weight:800;font-size:21px;color:${INK}}
.trow span:first-child{font-weight:700;color:#3a3527}
.dtitle{background:${INK};color:${GOLD};font-weight:900;font-size:22px;padding:9px 16px}
.dbox{border:4px solid ${INK};background:#FBF6E9;margin-bottom:22px}
.dh{padding:9px 16px;border-bottom:1.5px solid rgba(0,0,0,.14)}
.dd{display:inline-block;width:26px;height:26px;line-height:26px;text-align:center;color:#fff;font-weight:900;font-size:15px;border-radius:5px;margin-right:10px;vertical-align:middle}
.dt{font-weight:900;font-size:24px;color:${INK}}
.dc{font-weight:800;font-size:14px;color:#8a7a3a;margin-left:8px;letter-spacing:.5px}
.da{font-size:19px;color:#3a3527;font-weight:700;margin:2px 0 0 36px;font-family:Arial}
.foot{background:${GOLD};border-top:4px solid ${INK};margin:0 -40px;padding:18px;text-align:center;color:${INK};font-weight:900;font-size:34px}
/* --- proposta --- */
.bxn{height:230px;position:relative;display:flex;align-items:center;gap:14px;padding:0 18px;background:repeating-linear-gradient(118deg,${C1} 0 34px,${C2} 34px 68px)}
.bxn .veu{position:absolute;inset:0;background:linear-gradient(90deg,rgba(0,0,0,.8) 55%,rgba(0,0,0,.3))}
.bxn .in{position:relative;display:flex;align-items:center;gap:14px;width:100%}
.bxn img.e{width:104px;height:104px;object-fit:contain;flex:none;filter:drop-shadow(3px 3px 0 rgba(0,0,0,.5))}
.bxn .tx{flex:1}
.bxn .nm{color:#fff;font-weight:900;font-size:30px;line-height:1.05}
.bxn .sb{color:${GOLD};font-weight:800;font-size:17px;margin-top:4px}
.bxn img.m{width:112px;height:112px;object-fit:contain;flex:none}
.dn{display:flex;align-items:center;gap:12px;padding:8px 14px;border-bottom:1.5px solid rgba(0,0,0,.14)}
.desc{width:38px;height:38px;object-fit:contain;flex:none}
.dmid{flex:1;min-width:0}
.dt2{font-weight:900;font-size:23px;color:${INK};line-height:1.1}
.dc2{font-weight:800;font-size:13px;color:#8a7a3a;letter-spacing:.5px}
.da2{font-size:18px;color:#3a3527;font-weight:700;font-family:Arial;margin-top:1px}
.da2 i{font-style:normal;color:#6b6450}
.dros{width:54px;height:54px;border-radius:999px;border:3px solid ${INK};background:linear-gradient(180deg,#2b2b2b,#111);overflow:hidden;display:flex;align-items:flex-end;justify-content:center;flex:none}
.dros img{height:58px;object-fit:contain;margin-bottom:-2px}
.dros span{font-size:24px;align-self:center;opacity:.5}
</style></head><body>

<div class="col"><div class="tag">como sai <b>HOJE</b></div>
<div class="jor">
  <div class="mast"><div class="mt">O <i>MARTELO</i></div><div class="med">EDIÇÃO Nº 388 · TEMPORADA 388<br>SÉRIE A · PREÇO: 1 MOEDA</div></div>
  <div class="rule"></div>
  <div class="sub"><span>⚽ O DIÁRIO DO LEILÃO LEGENDS</span><span>FIM DE TEMPORADA</span></div>
  <h1>Nova Eclipse no topo do mundo!</h1>
  <div class="lead">Campeão da Série A — e o resto do país que se ajoelhe. Direto do 🏟 Nova Eclipse Stadium.</div>
  <div class="duo">
    <div class="box"><div class="bxc"><div class="stamp">CAMPEÃO</div><img class="e" src="${escudo}"/><div class="nm">Nova Eclipse</div><div class="sb">1º da Série A na temporada</div></div></div>
    <div class="box"><div class="tbl">OS NÚMEROS DO TIME</div>${NUMS.map(([a,b])=>`<div class="trow"><span>${a}</span><span>${b}</span></div>`).join('')}</div>
  </div>
  <div class="dbox"><div class="dtitle">🏆 OS DONOS DA TEMPORADA</div>${DONOS.map(linhaHoje).join('')}</div>
  <div class="foot">🔨 leilaolegends.com</div>
</div></div>

<div class="col"><div class="tag">a <b>PROPOSTA</b></div>
<div class="jor">
  <div class="mast"><div class="mt">O <i>MARTELO</i></div><div class="med">EDIÇÃO Nº 388 · TEMPORADA 388<br>SÉRIE A · PREÇO: 1 MOEDA</div></div>
  <div class="rule"></div>
  <div class="sub"><span>⚽ O DIÁRIO DO LEILÃO LEGENDS</span><span>FIM DE TEMPORADA</span></div>
  <h1>Nova Eclipse no topo do mundo!</h1>
  <div class="lead">Campeão da Série A — e o resto do país que se ajoelhe. Direto do 🏟 Nova Eclipse Stadium.</div>
  <div class="duo">
    <div class="box"><div class="bxn"><div class="veu"></div><div class="in">
      <img class="e" src="${escudo}"/>
      <div class="tx"><div class="nm">Nova Eclipse</div><div class="sb">1º DA SÉRIE A · TEMPORADA 388</div></div>
      <img class="m" src="${mascote}"/></div>
      <div class="stamp">CAMPEÃO</div></div></div>
    <div class="box"><div class="tbl">OS NÚMEROS DO TIME</div>${NUMS.map(([a,b])=>`<div class="trow"><span>${a}</span><span>${b}</span></div>`).join('')}</div>
  </div>
  <div class="dbox"><div class="dtitle">🏆 OS DONOS DA TEMPORADA</div>${DONOS.map(linhaNova).join('')}</div>
  <div class="foot">🔨 leilaolegends.com</div>
</div></div>

</body></html>`

const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const page = await browser.newPage({ viewport: { width: 2300, height: 1500 }, deviceScaleFactor: 1 })
await page.setContent(html, { waitUntil: 'load' })
await page.waitForTimeout(1200)
const saida = process.env.SAIDA || '/tmp/mockup-share-jornal.png'
await page.screenshot({ path: saida, fullPage: true })
await browser.close()
console.log('✅', saida)
