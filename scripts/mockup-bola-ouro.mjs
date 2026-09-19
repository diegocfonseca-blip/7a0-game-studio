// 🥇 MOCKUP — O PRÊMIO DA BOLA DE OURO (20 🪙 pro clube + 10 de piso no jogador)
//
// Pedido do Diego (19/09): *"preciso de um mockup agora do bola de ouro que fizemos e
// vídeo também igual normalmente costumamos fazer do mockup e explicando. Além disso
// todo bola de ouro q o time tiver o clube ganhará 20 moedas extras e o jogador passa
// a valorizar mais 10 de piso."*
//
// Três painéis, na ordem em que a pessoa vive a coisa:
//   ① o jornal de fim de temporada — a página da Bola de Ouro com a FAIXA DO PRÊMIO nova
//   ② a ficha do jogador — o selo 🥇 e o piso que ele ganhou (é o que muda a renovação)
//   ③ o extrato do clube — a linha de +20 🪙, junto dos outros prêmios da temporada
//
// Rodar (da raiz do repo): node scripts/mockup-bola-ouro.mjs [saida.png]
import { chromium } from 'playwright-core'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6', VERDE = '#1B7A3D', PAPEL = '#F6EFDD'
const b64 = w => readFileSync(`${ROOT}/scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')
const ARTE = `data:image/webp;base64,${readFileSync(`${ROOT}/src/escalacao/img/jornal-bola-ouro-v1.webp`).toString('base64')}`

const coluna = (titulo, sub, corpo) => `
  <div class="col">
    <h1>${titulo}<span>${sub}</span></h1>
    ${corpo}
  </div>`

// ① a página do jornal, com a faixa do prêmio NOVA
const jornal = `
<div class="papel">
  <div class="cab"><h2>O MARTELO</h2><p>TEMPORADA 29 · VÁRZEA</p></div>
  <div class="linha"><span>O DIÁRIO DO LEILÃO LEGENDS</span><span>FIM DE TEMPORADA</span></div>
  <div class="foto"><img src="${ARTE}">
    <div class="legenda"><span class="sel">🥇 BOLA DE OURO · TEMPORADA 29</span>
      <b>Rummenigge</b><i>Bayern · 1981 — Sapekeiros FC</i></div>
  </div>
  <div class="soma"><b>27</b> GOLS <span>+</span> <b>16</b> ASSIST. <span>=</span> <em>43</em></div>
  <p class="cit">Não foi o artilheiro do ano, nem quem mais deu passes. Foi o único que fez as duas coisas.</p>
  <!-- 🆕 A FAIXA DO PRÊMIO: é isto que o mockup está propondo -->
  <div class="premio">
    <span class="tag">NOVO · O QUE O TÍTULO PAGA</span>
    <div class="pp">
      <div><b>+20 🪙</b><i>pro <u>Sapekeiros FC</u>, direto no caixa</i></div>
      <div><b>+10 📈</b><i>de piso no valor do <u>Rummenigge</u></i></div>
    </div>
  </div>
  <div class="virar"><span>3</span><div><i>VIRAR PARA A PÁGINA 3</i><b>📻 Aconteceu na temporada</b></div><em>›</em></div>
</div>`

// ② a ficha do jogador (a de duas colunas, aprovada em 19/09) com o selo do prêmio
const ficha = `
<div class="ficha">
  <div class="fc"><b>Rummenigge</b><i>ATA · Bayern · 1981</i></div>
  <div class="selo">🥇 2× BOLA DE OURO <span>T26 · T29</span></div>
  <div class="duas">
    <div><p>ESTA TEMPORADA</p><ul><li>Jogos <b>38</b></li><li>Gols <b>27</b></li><li>Assist. <b>16</b></li></ul></div>
    <div class="ouro"><p>NO SEU CLUBE</p><ul><li>Jogos <b>112</b></li><li>Gols <b>71</b></li><li>Assist. <b>44</b></li></ul></div>
  </div>
  <div class="faixa">
    <span>😓 Gás <b>62%</b></span>
    <span>💰 Valor <b>50</b> <u>30 + 20 🥇</u></span>
    <span>💸 Salário <b>5</b></span>
  </div>
  <p class="nota">O piso entra no <b>valor oficial</b>: é ele que manda na <b>renovação</b>, no <b>teto de venda</b> e no que a SAF paga. Duas bolas, duas vezes 10.</p>
</div>`

// ③ o extrato do clube
const extrato = `
<div class="extrato">
  <p class="et">🧾 FINANÇAS · TEMPORADA 29</p>
  ${[['🏆', 'Prêmio por posição na Várzea', '+34'],
     ['🥇', 'Bola de Ouro: Rummenigge é o melhor do mundo', '+20', 1],
     ['🎟️', 'Bilheteria da temporada', '+58'],
     ['🤝', 'Patrocínio master', '+40'],
     ['💸', 'Folha do elenco', '−96']].map(([ic, txt, val, novo]) => `
    <div class="li${novo ? ' novo' : ''}"><span>${ic}</span><i>${txt}</i><b class="${String(val).startsWith('−') ? 'neg' : 'pos'}">${val}</b></div>`).join('')}
  <p class="nota">A linha do prêmio nasce sozinha na virada da temporada, junto das outras. Se o melhor do mundo for de um clube de bot, ninguém recebe — mas o <b>piso da carta sobe do mesmo jeito</b>, e ela fica mais cara pra todo mundo no próximo leilão.</p>
</div>`

const css = `
${FONTES}
*{box-sizing:border-box}body{margin:0;background:#cfc4a6;font-family:system-ui,sans-serif;color:${INK}}
.wrap{display:flex;gap:26px;padding:26px;justify-content:center;align-items:flex-start}
.col{width:430px}
h1{font-family:Oswald;font-weight:700;font-size:23px;text-transform:uppercase;margin:0 0 10px;letter-spacing:.5px}
h1 span{display:block;font-family:system-ui;font-weight:700;font-size:12.5px;color:#4e4936;text-transform:none;letter-spacing:0;margin-top:2px}
/* ① jornal */
.papel{background:${PAPEL};border:4px solid ${INK};border-radius:14px;box-shadow:6px 7px 0 ${INK};padding:14px}
.cab h2{font-family:'Times New Roman',serif;font-weight:700;font-size:42px;text-align:center;margin:2px 0 0;letter-spacing:1px}
.cab p{font-family:'Times New Roman',serif;font-weight:700;font-size:13px;text-align:center;margin:2px 0 8px}
.linha{display:flex;justify-content:space-between;border-top:2px solid ${INK};border-bottom:2px solid ${INK};padding:5px 0;font-family:Oswald;font-weight:700;font-size:9.5px;letter-spacing:.08em}
.foto{position:relative;border:3px solid ${INK};border-radius:8px;overflow:hidden;margin:10px 0}
.foto img{display:block;width:100%}
.legenda{position:absolute;left:0;right:0;bottom:0;padding:10px 12px;background:linear-gradient(0deg,#000d,#0000)}
.sel{display:block;font-family:Oswald;font-weight:700;font-size:11px;color:${GOLD};letter-spacing:.12em}
.legenda b{display:block;font-family:Oswald;font-weight:700;font-size:26px;color:#fff;line-height:1.05}
.legenda i{display:block;font-family:'Times New Roman',serif;font-weight:700;font-style:normal;font-size:12.5px;color:#fff}
.soma{text-align:center;font-family:'Times New Roman',serif;font-weight:700;font-size:15px;margin:10px 0 6px}
.soma b{font-size:30px}.soma span{opacity:.6;margin:0 4px}
.soma em{display:inline-block;font-style:normal;font-size:28px;background:${GOLD};border:3px solid ${INK};border-radius:9px;padding:1px 12px;box-shadow:3px 3px 0 ${INK};vertical-align:3px}
.cit{font-family:'Times New Roman',serif;font-style:italic;font-size:14px;text-align:center;line-height:1.35;margin:0 6px 12px}
.premio{border:3px solid ${INK};border-radius:12px;background:linear-gradient(160deg,#FFF3C9,#FFE08A);box-shadow:4px 4px 0 ${INK};padding:9px 11px;margin-bottom:11px;position:relative}
.tag{position:absolute;top:-11px;left:10px;background:${VERDE};color:#fff;font-family:Oswald;font-weight:700;font-size:9px;letter-spacing:.1em;border:2.5px solid ${INK};border-radius:6px;padding:1px 7px}
.pp{display:flex;gap:10px;margin-top:5px}
.pp>div{flex:1;background:#fff9;border:2.5px solid ${INK};border-radius:9px;padding:7px 9px;text-align:center}
.pp b{display:block;font-family:Oswald;font-weight:700;font-size:25px;line-height:1}
.pp i{display:block;font-style:normal;font-size:10.5px;font-weight:700;color:#4a4636;margin-top:3px;line-height:1.3}
.virar{display:flex;align-items:center;gap:10px;background:#141210;border-radius:11px;padding:9px 11px;color:#fff}
.virar>span{flex:none;width:30px;height:30px;border:2.5px solid ${GOLD};border-radius:8px;color:${GOLD};font-family:Oswald;font-weight:700;font-size:17px;display:flex;align-items:center;justify-content:center}
.virar i{display:block;font-style:normal;font-family:Oswald;font-weight:700;font-size:9.5px;color:#ffffff8c;letter-spacing:.1em}
.virar b{font-family:Oswald;font-weight:700;font-size:16px}
.virar em{margin-left:auto;font-style:normal;color:${GOLD};font-size:20px}
/* ② ficha */
.ficha{background:#141210;border:4px solid ${INK};border-radius:16px;box-shadow:6px 7px 0 ${INK};padding:14px;color:#f4ecd6}
.fc b{display:block;font-family:Oswald;font-weight:700;font-size:28px;line-height:1}
.fc i{display:block;font-style:normal;font-size:12px;font-weight:700;color:#ffffff8c;margin-top:2px}
.selo{display:inline-block;margin:10px 0 12px;background:linear-gradient(160deg,#FFE79A,${GOLD} 45%,#E8A200);color:${INK};border:3px solid #000;border-radius:999px;padding:4px 13px;font-family:Oswald;font-weight:700;font-size:14px;box-shadow:3px 3px 0 #000}
.selo span{font-size:11px;opacity:.72;margin-left:4px}
.duas{display:flex;gap:10px}
.duas>div{flex:1;background:#ffffff12;border-radius:10px;padding:9px 10px}
.duas p{font-family:Oswald;font-weight:700;font-size:10px;letter-spacing:.1em;margin:0 0 6px;color:#ffffff8c}
.duas.ouro p,.duas .ouro p{color:${GOLD}}
.duas ul{margin:0;padding:0;list-style:none;font-size:12.5px;font-weight:700}
.duas li{display:flex;justify-content:space-between;padding:2px 0;color:#ffffffc4}
.duas li b{font-family:Oswald;font-size:16px;color:#fff}
.duas .ouro li b{color:${GOLD}}
.faixa{display:flex;gap:8px;margin-top:10px;background:#ffffff0f;border-radius:10px;padding:8px 10px;font-size:11px;font-weight:700;color:#ffffffc4}
.faixa span{flex:1;text-align:center}
.faixa b{display:block;font-family:Oswald;font-size:17px;color:#fff;margin-top:1px}
.faixa u{display:block;text-decoration:none;font-size:9.5px;color:${GOLD};margin-top:1px}
.ficha .nota{font-size:10.5px;font-weight:700;color:#ffffff8c;line-height:1.45;margin:11px 2px 0}
.ficha .nota b{color:${GOLD}}
/* ③ extrato */
.extrato{background:#fff;border:4px solid ${INK};border-radius:16px;box-shadow:6px 7px 0 ${INK};padding:13px}
.et{font-family:Oswald;font-weight:700;font-size:14px;margin:0 0 9px}
.li{display:flex;align-items:center;gap:9px;border-bottom:2px dashed #e2d9bd;padding:8px 4px;font-size:12.5px;font-weight:700}
.li>span{font-size:17px}.li i{flex:1;font-style:normal}
.li b{font-family:Oswald;font-size:17px}.pos{color:${VERDE}}.neg{color:#C2452F}
.li.novo{background:linear-gradient(90deg,#FFF3C9,#fff);border-radius:9px;outline:3px solid ${GOLD};outline-offset:-1px}
.extrato .nota{font-size:11px;font-weight:700;color:#4a4636;line-height:1.5;margin:11px 2px 0}
`

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body><div class="wrap">
${coluna('① No jornal', 'fim de temporada, página da Bola de Ouro — a faixa dourada é o que entra', jornal)}
${coluna('② Na ficha do jogador', 'o selo e o piso que ele ganhou — é o que muda renovação e venda', ficha)}
${coluna('③ No caixa do clube', 'a linha nasce sozinha na virada, junto dos outros prêmios', extrato)}
</div></body></html>`

const out = process.argv[2] ?? 'mockup-bola-ouro.png'
const htmlPath = path.join(path.dirname(path.resolve(out)), 'mockup-bola-ouro.html')
writeFileSync(htmlPath, html)
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1420, height: 780 }, deviceScaleFactor: 2 })
await p.goto(`file://${htmlPath}`, { waitUntil: 'networkidle' })
await p.evaluate(() => document.fonts.ready)
await p.screenshot({ path: out, fullPage: true })
await b.close()
console.log('ok →', out)
