// 🖼️ MOCKUP — como fica a imagem de COMPARTILHAR O ELENCO se ela usar o que o
// jogo ganhou depois que ela foi feita: os ROSTOS das lendas, o ESCUDO do clube,
// o MANTO e a MASCOTE. Esquerda = como está hoje. Direita = a proposta.
// Rodar: node scripts/mockup-share-elenco.mjs
import { chromium } from 'playwright-core'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..')
const b64 = p => { try { return 'data:image/webp;base64,' + readFileSync(join(raiz, p)).toString('base64') } catch { return '' } }
const av = n => b64(`public/avatars/lendas-v1/${n}.webp`)

const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D', CREME = '#F4ECD6'
const C1 = '#0A0A0A', C2 = '#E3E2E1' // manto medido do Nova Eclipse
const escudo = b64('src/escalacao/img/novaeclipse-escudo.webp')
const mascote = b64('src/escalacao/img/novaeclipse-mascote.webp')

// 11 do time, com rosto quando existe
const XI = [
  { pos: 'GOL', nome: 'Rogério Ceni', gols: 4, rosto: av('rogerio-ceni-sao-paulo-2005'), linha: 0 },
  { pos: 'LAT', nome: 'Cafu', gols: 1, rosto: av('cafu-milan-2004'), linha: 1 },
  { pos: 'ZAG', nome: 'Aldair', gols: 2, rosto: '', linha: 1 },
  { pos: 'ZAG', nome: 'Lúcio', gols: 3, rosto: '', linha: 1 },
  { pos: 'LAT', nome: 'Roberto Carlos', gols: 6, rosto: av('roberto-carlos-real-madrid-2002'), linha: 1 },
  { pos: 'MEI', nome: 'Falcão', gols: 5, rosto: av('falcao-internacional-1979'), linha: 2 },
  { pos: 'MEI', nome: 'Sócrates', gols: 7, rosto: av('socrates-corinthians-1983'), linha: 2 },
  { pos: 'MEI', nome: 'Zico', gols: 14, rosto: av('zico-flamengo-1981'), linha: 2 },
  { pos: 'ATA', nome: 'Romário', gols: 19, rosto: av('romario-vasco-2000'), linha: 3 },
  { pos: 'ATA', nome: 'Careca', gols: 11, rosto: av('careca-sao-paulo-1986'), linha: 3 },
  { pos: 'ATA', nome: 'Bebeto', gols: 9, rosto: av('bebeto-vasco-1989'), linha: 3 },
]
const RESERVAS = [['GOL','Taffarel',0],['ZAG','Mozer',1],['MEI','Raí',6],['ATA','Edmundo',8]]

const cartaHoje = c => `<div class="ch"><div class="chp">${c.pos}</div><div class="chn">${c.nome}</div>${c.gols ? `<div class="chg">⚽ ${c.gols}</div>` : ''}</div>`
const cartaNova = c => `<div class="cn">
  <div class="cnf">${c.rosto ? `<img src="${c.rosto}"/>` : `<div class="cns">${c.pos}</div>`}</div>
  <div class="cnb"><div class="cnn">${c.nome}</div><div class="cnp">${c.pos}${c.gols ? ` · ⚽ ${c.gols}` : ''}</div></div>
</div>`
const linhas = f => [0,1,2,3].map(i => `<div class="lin">${XI.filter(c => c.linha === i).map(f).join('')}</div>`).join('')

const html = `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;700;800;900&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#2a2a2a;font-family:Oswald,Arial,sans-serif;display:flex;gap:34px;padding:34px}
.col{width:1080px}
.tag{font-weight:900;font-size:30px;color:#fff;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px}
.tag b{color:${GOLD}}
.card{border:6px solid ${INK};overflow:hidden}

/* ---------- HOJE ---------- */
.h-head{background:${GREEN};padding:30px 44px 24px}
.h-k{color:${GOLD};font-weight:800;font-size:26px}
.h-t{color:#fff;font-weight:900;font-size:62px;line-height:1.05;margin-top:8px}
.h-s{color:rgba(255,255,255,.85);font-weight:700;font-size:27px;font-family:Arial;margin-top:10px}
.h-chips{display:flex;gap:14px;margin-top:16px}
.h-chip{background:rgba(0,0,0,.3);border:2.5px solid rgba(245,179,1,.75);border-radius:12px;padding:8px 17px;color:${GOLD};font-weight:800;font-size:25px}
.h-field{background:repeating-linear-gradient(180deg,#1B7A3D 0 66px,#166332 66px 132px);padding:26px 20px}
.lin{display:flex;justify-content:center;gap:18px;margin:22px 0}
.ch{background:#fff;border:5px solid ${INK};border-radius:18px;width:210px;height:104px;display:flex;flex-direction:column;align-items:center;justify-content:center}
.chp{color:${GREEN};font-weight:800;font-size:20px}
.chn{color:${INK};font-weight:800;font-size:28px;line-height:1}
.chg{color:#166332;font-weight:800;font-size:22px;margin-top:4px}
.h-lists{background:${GREEN};padding:26px 44px 30px;display:flex;gap:26px}
.h-col{flex:1}
.h-ct{color:#fff;font-weight:900;font-size:30px;margin-bottom:14px}
.h-row{background:#fff;border-radius:10px;padding:8px 12px;margin-bottom:8px;display:flex;align-items:center;gap:12px}
.h-rp{color:${GREEN};font-weight:800;font-size:16px;width:44px}
.h-rn{color:${INK};font-weight:800;font-size:24px;flex:1}
.h-rv{color:rgba(0,0,0,.55);font-weight:800;font-size:20px}
.foot{background:${GOLD};border-top:6px solid ${INK};padding:22px;text-align:center}
.foot b{display:block;color:${INK};font-weight:900;font-size:34px}
.foot span{color:rgba(0,0,0,.6);font-weight:800;font-size:23px;font-family:Arial}

/* ---------- PROPOSTA ---------- */
.n-head{position:relative;padding:26px 40px;background:repeating-linear-gradient(115deg,${C1} 0 46px,${C2} 46px 92px);border-bottom:6px solid ${INK}}
.n-veu{position:absolute;inset:0;background:linear-gradient(90deg,rgba(0,0,0,.82) 52%,rgba(0,0,0,.25))}
.n-in{position:relative;display:flex;align-items:center;gap:24px}
.n-esc{width:132px;height:132px;object-fit:contain;filter:drop-shadow(3px 3px 0 rgba(0,0,0,.55));flex:none}
.n-k{color:${GOLD};font-weight:800;font-size:24px;letter-spacing:.5px}
.n-t{color:#fff;font-weight:900;font-size:64px;line-height:1;margin:4px 0 8px}
.n-s{color:rgba(255,255,255,.9);font-weight:700;font-size:25px;font-family:Arial}
.n-chips{position:relative;display:flex;gap:12px;margin-top:16px}
.n-chip{background:rgba(0,0,0,.55);border:2.5px solid ${GOLD};border-radius:12px;padding:7px 16px;color:${GOLD};font-weight:800;font-size:24px}
.n-field{position:relative;background:repeating-linear-gradient(180deg,#1B7A3D 0 62px,#166332 62px 124px);padding:22px 18px 10px}
.cn{width:226px;background:${CREME};border:5px solid ${INK};border-radius:18px;box-shadow:5px 5px 0 rgba(0,0,0,.45);overflow:hidden}
.cnf{height:126px;background:linear-gradient(180deg,${C1},#2b2b2b);display:flex;align-items:flex-end;justify-content:center;overflow:hidden}
.cnf img{height:132px;object-fit:contain;margin-bottom:-6px}
.cns{color:rgba(255,255,255,.5);font-weight:900;font-size:44px;align-self:center}
.cnb{padding:8px 10px;text-align:center;background:${CREME}}
.cnn{color:${INK};font-weight:900;font-size:26px;line-height:1}
.cnp{color:#5a5647;font-weight:700;font-size:19px;margin-top:2px}
.n-lists{background:${CREME};border-top:6px solid ${INK};padding:24px 40px 26px;display:flex;gap:24px}
.n-col{flex:1}
.n-ct{color:${INK};font-weight:900;font-size:28px;margin-bottom:12px}
.n-row{background:#fff;border:3px solid ${INK};border-radius:12px;padding:7px 12px;margin-bottom:9px;display:flex;align-items:center;gap:12px;box-shadow:3px 3px 0 ${INK}}
.n-rp{color:${GREEN};font-weight:800;font-size:16px;width:46px}
.n-rn{color:${INK};font-weight:800;font-size:24px;flex:1}
.n-rv{color:rgba(0,0,0,.55);font-weight:800;font-size:20px}
.n-foot{position:relative;background:${GOLD};border-top:6px solid ${INK};padding:20px 30px;display:flex;align-items:center;gap:20px}
.n-masc{width:118px;height:118px;object-fit:contain;flex:none}
.n-ft{flex:1;text-align:center}
.n-ft b{display:block;color:${INK};font-weight:900;font-size:34px}
.n-ft span{color:rgba(0,0,0,.62);font-weight:800;font-size:23px;font-family:Arial}
</style></head><body>

<div class="col">
  <div class="tag">como está <b>HOJE</b></div>
  <div class="card">
    <div class="h-head">
      <div class="h-k">🔨 LEILÃO LEGENDS · MEU ELENCO</div>
      <div class="h-t">Nova Eclipse</div>
      <div class="h-s">Série A · 1º lugar · Temporada 388 · 4-3-3</div>
      <div class="h-chips"><div class="h-chip">🏆 3 títulos</div><div class="h-chip">🏷️ Elenco vale 412 💵</div><div class="h-chip">🪙 Caixa: 168</div></div>
    </div>
    <div class="h-field">${linhas(cartaHoje)}</div>
    <div class="h-lists">
      <div class="h-col"><div class="h-ct">⭐ TITULARES</div>${XI.slice(0,4).map(c=>`<div class="h-row"><div class="h-rp">${c.pos}</div><div class="h-rn">${c.nome}</div><div class="h-rv">💰 ${20+c.gols}</div></div>`).join('')}</div>
      <div class="h-col"><div class="h-ct">🔁 RESERVAS</div>${RESERVAS.map(r=>`<div class="h-row"><div class="h-rp">${r[0]}</div><div class="h-rn">${r[1]}</div><div class="h-rv">💰 ${12+r[2]}</div></div>`).join('')}</div>
    </div>
    <div class="foot"><b>mostra teu elenco e marca a gente! 📲 @leilaolegendscom</b><span>monta o teu de graça em leilaolegends.com 🔨</span></div>
  </div>
</div>

<div class="col">
  <div class="tag">a <b>PROPOSTA</b></div>
  <div class="card">
    <div class="n-head">
      <div class="n-veu"></div>
      <div class="n-in">
        <img class="n-esc" src="${escudo}"/>
        <div>
          <div class="n-k">🔨 LEILÃO LEGENDS · MEU ELENCO</div>
          <div class="n-t">Nova Eclipse</div>
          <div class="n-s">Série A · 1º lugar · Temporada 388 · 4-3-3</div>
        </div>
      </div>
      <div class="n-chips"><div class="n-chip">🏆 3 títulos</div><div class="n-chip">🏷️ Elenco vale 412 💵</div><div class="n-chip">🪙 Caixa: 168</div></div>
    </div>
    <div class="n-field">${linhas(cartaNova)}</div>
    <div class="n-lists">
      <div class="n-col"><div class="n-ct">⭐ TITULARES</div>${XI.slice(0,4).map(c=>`<div class="n-row"><div class="n-rp">${c.pos}</div><div class="n-rn">${c.nome}</div><div class="n-rv">💰 ${20+c.gols}</div></div>`).join('')}</div>
      <div class="n-col"><div class="n-ct">🔁 RESERVAS</div>${RESERVAS.map(r=>`<div class="n-row"><div class="n-rp">${r[0]}</div><div class="n-rn">${r[1]}</div><div class="n-rv">💰 ${12+r[2]}</div></div>`).join('')}</div>
    </div>
    <div class="n-foot">
      <img class="n-masc" src="${mascote}"/>
      <div class="n-ft"><b>mostra teu elenco e marca a gente! 📲 @leilaolegendscom</b><span>monta o teu de graça em leilaolegends.com 🔨</span></div>
    </div>
  </div>
</div>

</body></html>`

const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const page = await browser.newPage({ viewport: { width: 2300, height: 1400 }, deviceScaleFactor: 1 })
await page.setContent(html, { waitUntil: 'load' })
await page.waitForTimeout(1200)
const saida = process.env.SAIDA || '/tmp/mockup-share-elenco.png'
await page.screenshot({ path: saida, fullPage: true })
await browser.close()
console.log('✅', saida)
