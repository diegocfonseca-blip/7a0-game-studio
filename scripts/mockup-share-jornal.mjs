// 🗞️ MOCKUP — a imagem de COMPARTILHAR O MARTELO.
// Correção de rumo (12/09): o jornal NA TELA já foi refeito no visual V22
// (masthead centralizado, ilustrações da liga/copa/artilheiro, escudo por cima
// da foto, notas em duas colunas). Quem ficou pra trás foi só a IMAGEM que vai
// pro zap, que ainda desenha o layout antigo. Palavras do Diego: *"o jornal
// atual hj já mudou aparência.. só o compartilhar q ainda não"*.
// Então a proposta aqui NÃO inventa nada: é a imagem virando cópia da tela.
// Rodar: node scripts/mockup-share-jornal.mjs
import { chromium } from 'playwright-core'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..')
const b64 = p => { try { return 'data:image/webp;base64,' + readFileSync(join(raiz, p)).toString('base64') } catch { return '' } }
const INK = '#0C0C0C', GOLD = '#FFC400', VERM = '#B23A2A'
const escudo = b64('src/escalacao/img/novaeclipse-escudo.webp')
const artLiga = b64('src/escalacao/img/jornal-liga-v22.webp')
const artCopa = b64('src/escalacao/img/jornal-copa-v22.webp')
const artArt = b64('src/escalacao/img/jornal-artilheiro-v22.webp')

// dados iguais ao print que o Diego mandou (T388)
const DONOS = [
  { d:'A', cor:'#E7A21F', time:'Nova Eclipse', voce:true, art:'Vinícius Júnior', clube:'Corporação Capsule FC', gols:19 },
  { d:'B', cor:'#8C97A3', time:'Comercial da Baixada', art:'Zagallo', clube:'White Thigs do GuGu', gols:20 },
  { d:'C', cor:'#C77B3C', time:'Barcenite FC', art:'Rummenigge', clube:'Ferroviário da Serra', gols:19 },
  { d:'D', cor:'#1E7A3D', time:'Bagres de Wall Street FC', art:'Son Heung-min', clube:'Bagres de Wall Street FC', gols:25 },
  { d:'V', cor:'#8B8168', time:'Ressaca United', art:'Alan Shearer', clube:'Continental Real', gols:23 },
  { d:'🏆', cor:'#2E6FB0', time:'Nova Eclipse', voce:true, copa:true, art:'Luis Suárez', clube:'Leão da Estradinha', gols:7 },
]
const NUMS = [['Posição','1º'],['Pontos','71'],['V · E · D','22-5-11'],['Gols (pró/contra)','72/50'],['Saldo','+22']]
const hoje = o => `<div class="dh"><span class="dd" style="background:${o.cor}">${o.d}</span><span class="dt">${o.time}</span><span class="dc">${o.voce?'CAMPEÃO ⭐ VOCÊ':(o.copa?'CAMPEÃO DA COPA':'CAMPEÃO')}</span><div class="da">⚽ ${o.art} (${o.clube}) · ${o.gols} gols</div></div>`
const nota = o => `<div class="jvnote"><span class="jvcrest">${o.voce?`<img src="${escudo}"/>`:`<span class="jvletra" style="background:${o.cor}">${o.time[0]}</span>`}</span>
  <div><h3>${o.time} ${o.voce?'<span class="jvyou">VOCÊ</span>':''}<span> · ${o.copa?'COPA':'SÉRIE '+o.d}</span></h3>
  <p class="jvby">campeão da temporada</p><p>Artilheiro: <b>${o.art}</b> (${o.clube}), ${o.gols} gols.</p></div></div>`

const html = `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;700;800;900&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#2a2a2a;display:flex;gap:40px;padding:34px;font-family:Oswald,Arial,sans-serif;align-items:flex-start}
.col{width:1080px}
.tag{font-weight:900;font-size:30px;color:#fff;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px}
.tag b{color:${GOLD}} .tag i{color:#7CE0A3;font-style:normal}
/* ====== IMAGEM DE HOJE (layout antigo) ====== */
.velho{background:#F7F1DD;border:6px solid ${INK};padding:34px 40px 0}
.mast{display:flex;align-items:flex-end;justify-content:space-between}
.mt{font-family:Georgia,serif;font-weight:900;font-size:62px;color:${INK}}.mt i{color:${VERM};font-style:normal}
.med{text-align:right;color:#3a3527;font-weight:800;font-size:19px;line-height:1.5}
.rule{border-top:3px solid ${INK};border-bottom:3px solid ${INK};height:7px;margin-top:13px}
.sub{display:flex;justify-content:space-between;color:#3a3527;font-weight:900;font-size:20px;padding:11px 0 9px;border-bottom:1.5px solid ${INK}}
.velho h1{font-family:Georgia,serif;font-size:54px;line-height:1.05;margin:20px 0 11px;text-transform:uppercase}
.lead{font-family:Georgia,serif;font-style:italic;font-size:24px;color:#3a3527;line-height:1.35;margin-bottom:18px}
.duo{display:flex;gap:16px;margin-bottom:20px}.box{flex:1;border:4px solid ${INK}}
.bxc{background:linear-gradient(160deg,#1B7A3D,#14401f);height:222px;position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:9px}
.bxc img{width:92px;height:92px;object-fit:contain}.bxc .nm{color:#fff;font-weight:900;font-size:27px}
.bxc .sb{color:rgba(255,255,255,.75);font-weight:700;font-size:16px;font-family:Georgia,serif;font-style:italic}
.stamp{position:absolute;top:15px;right:-6px;transform:rotate(-9deg);background:#F7E6C9;border:3px solid ${VERM};color:${VERM};font-weight:900;font-size:18px;padding:3px 13px}
.tbl{background:${INK};color:#fff;font-weight:900;font-size:20px;padding:9px 15px}
.trow{display:flex;justify-content:space-between;padding:9px 15px;border-bottom:1.5px solid rgba(0,0,0,.15);background:#fff;font-weight:800;font-size:20px}
.trow span:first-child{font-weight:700;color:#3a3527}
.dtitle{background:${INK};color:${GOLD};font-weight:900;font-size:21px;padding:9px 15px}
.dbox{border:4px solid ${INK};background:#FBF6E9;margin-bottom:20px}
.dh{padding:8px 15px;border-bottom:1.5px solid rgba(0,0,0,.14)}
.dd{display:inline-block;width:25px;height:25px;line-height:25px;text-align:center;color:#fff;font-weight:900;font-size:14px;border-radius:5px;margin-right:9px;vertical-align:middle}
.dt{font-weight:900;font-size:23px}.dc{font-weight:800;font-size:13px;color:#8a7a3a;margin-left:7px}
.da{font-size:18px;color:#3a3527;font-weight:700;margin:2px 0 0 34px;font-family:Arial}
.vfoot{background:${GOLD};border-top:4px solid ${INK};margin:0 -40px;padding:17px;text-align:center;font-weight:900;font-size:33px}

/* ====== IMAGEM NOVA = O JORNAL DA TELA (V22) ====== */
.v22{color:#0c0c0c;background:radial-gradient(ellipse at 30% 0%,#fbf3df,#e3d0ad);border:1px solid #8b785c;outline:4px solid #e3d0ad;outline-offset:3px;box-shadow:7px 7px 0 #a58e67;padding:34px;font-family:Georgia,'Times New Roman',serif}
.jvm{text-align:center;border-bottom:4px double #413825;padding-bottom:10px}
.jvm h1{font-family:Georgia,serif;font-size:84px;font-weight:900;line-height:1;letter-spacing:-.06em}
.jvm>p{font-size:16px;font-weight:700;margin:8px 0}
.jvm>div{display:flex;justify-content:space-between;border-top:1px solid #6c604a;padding-top:5px;font:700 13px Oswald,sans-serif}
.jvh{font:700 60px/1.08 Oswald,sans-serif;text-transform:uppercase;letter-spacing:-.025em;margin:16px 0}
.jvst{display:grid;grid-template-columns:minmax(0,1.7fr) minmax(0,1fr);gap:16px;align-items:start;margin:16px 0;padding-bottom:14px;border-bottom:3px double #74674e}
.jvph{position:relative}.jvph>img{display:block;width:100%;aspect-ratio:3/2;object-fit:cover;border:1px solid #74674e}
.jvcr{position:absolute;bottom:8px;left:8px;filter:drop-shadow(1px 2px 2px #0008)}.jvcr img{width:62px;height:62px;object-fit:contain}
.jvmain small{font:700 15px Oswald,sans-serif;display:block;margin-top:10px}
.jvmain h3{font:700 46px/1.1 Oswald,sans-serif;text-transform:uppercase;margin:2px 0 6px}
.jvside{display:grid;gap:16px}
.jvside h3{font:700 24px/1.2 Oswald,sans-serif;text-transform:uppercase;margin-bottom:7px}
.jvside img{display:block;width:100%;aspect-ratio:3/2;object-fit:cover;border:1px solid #74674e}
.jvside figcaption{font-size:15px;line-height:1.3;padding-top:5px}
.jvdeck{border-top:1px solid #665944;border-bottom:3px double #665944;padding:10px 0;font-size:19px;font-style:italic;line-height:1.45}
.jvnums{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin:14px 0}
.jvnum{border:1px solid #9f8b6b;background:#fffdf6;padding:8px 6px;text-align:center}
.jvnum b{display:block;font:700 26px Oswald,sans-serif}.jvnum span{font-size:12px;color:#615039;font-weight:700}
.jved>h2{font:700 36px Oswald,sans-serif;text-align:center;padding:14px 0 8px}
.jvnotes{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));column-gap:24px}
.jvnote{display:flex;gap:10px;border-top:1px solid #9f8b6b;padding:15px 0;align-items:start}
.jvcrest{flex:none;margin-top:3px}.jvcrest img{width:44px;height:44px;object-fit:contain}
.jvletra{display:flex;width:44px;height:44px;border-radius:8px;color:#fff;font:700 22px Oswald,sans-serif;align-items:center;justify-content:center}
.jvnote h3{font:700 19px/1.3 Oswald,sans-serif;text-transform:uppercase}
.jvnote h3>span{font-size:13px;white-space:nowrap;color:#615039}
.jvyou{display:inline-block;background:#0c0c0c;color:#ffc400;padding:1px 6px;border-radius:3px;font:700 11px Oswald,sans-serif;margin-left:5px;vertical-align:middle}
.jvby{font-size:13px;color:#615039;margin:3px 0}
.jvnote p{font-size:15px;line-height:1.5}
.jvfoot{border-top:3px double #615039;text-align:center;font:700 20px Oswald,sans-serif;padding-top:12px;margin-top:8px}
</style></head><body>

<div class="col"><div class="tag">a imagem que vai pro zap <b>HOJE</b></div>
<div class="velho">
  <div class="mast"><div class="mt">O <i>MARTELO</i></div><div class="med">EDIÇÃO Nº 388 · TEMPORADA 388<br>SÉRIE A · PREÇO: 1 MOEDA</div></div>
  <div class="rule"></div>
  <div class="sub"><span>⚽ O DIÁRIO DO LEILÃO LEGENDS</span><span>FIM DE TEMPORADA</span></div>
  <h1>Nova Eclipse no topo do mundo!</h1>
  <div class="lead">Campeão da Série A — e o resto do país que se ajoelhe. Direto do 🏟 Nova Eclipse Stadium.</div>
  <div class="duo">
    <div class="box"><div class="bxc"><div class="stamp">CAMPEÃO</div><img src="${escudo}"/><div class="nm">Nova Eclipse</div><div class="sb">1º da Série A na temporada</div></div></div>
    <div class="box"><div class="tbl">OS NÚMEROS DO TIME</div>${NUMS.map(([a,b])=>`<div class="trow"><span>${a}</span><span>${b}</span></div>`).join('')}</div>
  </div>
  <div class="dbox"><div class="dtitle">🏆 OS DONOS DA TEMPORADA</div>${DONOS.map(hoje).join('')}</div>
  <div class="vfoot">🔨 leilaolegends.com</div>
</div></div>

<div class="col"><div class="tag">a proposta: a imagem vira <i>CÓPIA DA TELA</i></div>
<div class="v22">
  <div class="jvm"><h1>O MARTELO</h1><p>TEMPORADA 388 · SÉRIE A</p>
    <div><span>O DIÁRIO DO LEILÃO LEGENDS</span><span>FIM DE TEMPORADA</span></div></div>
  <h2 class="jvh">Nova Eclipse no topo do mundo!</h2>
  <div class="jvdeck">Campeão da Série A — e o resto do país que se ajoelhe. Direto do 🏟 <b>Nova Eclipse Stadium</b>.</div>
  <section class="jvst">
    <figure class="jvmain">
      <div class="jvph"><img src="${artLiga}"/><span class="jvcr"><img src="${escudo}"/></span></div>
      <figcaption><small>CAMPEÃO · SÉRIE A</small><h3>Nova Eclipse</h3></figcaption>
    </figure>
    <div class="jvside">
      <figure><h3>O dono da Copa</h3><div class="jvph"><img src="${artCopa}"/><span class="jvcr"><img src="${escudo}"/></span></div><figcaption><b>Nova Eclipse</b></figcaption></figure>
      <figure><h3>Artilheiro · Série A</h3><img src="${artArt}"/><figcaption><b>Vinícius Júnior</b> · 19 gols</figcaption></figure>
    </div>
  </section>
  <div class="jvnums">${NUMS.map(([a,b])=>`<div class="jvnum"><b>${b}</b><span>${a}</span></div>`).join('')}</div>
  <div class="jved"><h2>Os donos da temporada</h2>
    <div class="jvnotes">${DONOS.map(nota).join('')}</div></div>
  <div class="jvfoot">🔨 leilaolegends.com</div>
</div></div>

</body></html>`

const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const page = await browser.newPage({ viewport: { width: 2320, height: 1600 }, deviceScaleFactor: 1 })
await page.setContent(html, { waitUntil: 'load' })
await page.waitForTimeout(1400)
const saida = process.env.SAIDA || '/tmp/mockup-share-jornal.png'
await page.screenshot({ path: saida, fullPage: true })
await browser.close()
console.log('✅', saida)
