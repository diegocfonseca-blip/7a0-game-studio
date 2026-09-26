// ─── ⚽ MOCKUP: A BOLA VIAJA NO PALCO DOS PÊNALTIS (25/09) ───────────────────
//
// Ideia apresentada ao Diego depois de ele achar a disputa *"muito rápida e sem
// emoção"*: em vez de a bolinha só PISCAR no meio do palco, ela SAI do lado do
// batedor, atravessa o palco e só quando chega no goleiro sai o veredito
// ("GOL!" ou "DEFENDEU!"). Mesmo 1,6 s da cobrança com gente — só que agora a
// espera vira tensão, porque você está olhando a bola chegar.
//
// Sai em DOIS formatos: uma tira de quadros (PNG, pra ler o caminho) e um GIF
// (pra sentir o movimento). Mesmo palco preto do jogo (`.ll28-palco`), mesmas
// cores e a Oswald embutida.
//
//   node scripts/mockup-penaltis-bola.mjs
//   → mockups/penaltis-bola.png · mockups/penaltis-bola.gif
import fs from 'node:fs'
import { chromium } from 'playwright-core'

const f = w => `data:font/woff2;base64,${fs.readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')}`

// t = segundos desde o início da cobrança (0 → 1,6). A bola parte em 0,15 e
// chega em 1,15; o veredito fica de 1,15 em diante.
const palco = (batedor, time, goleiro, resultado, t) => {
  const viajando = t >= 0.15 && t < 1.15
  const chegou = t >= 1.15
  const p = Math.min(1, Math.max(0, (t - 0.15) / 1.0))
  // a bola acelera no começo e chega "seca" (sem frear)
  const x = 8 + (p * p * (3 - 2 * p)) * 84
  const y = Math.sin(p * Math.PI) * -14 // sobe um pouco no meio
  const gol = resultado === 'gol'
  const bola = viajando
    ? `<div class="bola" style="left:${x}%;transform:translate(-50%,${y}px)">⚽</div>
       <div class="rastro" style="left:${Math.max(8, x - 14)}%;width:${Math.min(14, x - 8)}%"></div>`
    : chegou
      ? `<div class="bola fim ${gol ? 'na-rede' : 'na-luva'}">${gol ? '⚽' : '🧤'}</div>`
      : `<div class="bola" style="left:8%;transform:translate(-50%,0)">⚽</div>` // parada no pé do batedor
  const veredito = chegou
    ? `<div class="veredito ${gol ? 'v-gol' : 'v-erro'}">${gol ? '⚽ GOL!' : '🧤 DEFENDEU!'}</div>`
    : ''
  return `
  <div class="palco ${chegou ? (gol ? 'p-gol' : 'p-erro') : ''}">
    <div class="lado"><small>⚽ ${chegou ? 'BATEU' : 'BATE'}</small><b>${batedor}</b><i>${time}</i></div>
    <div class="pista">
      <div class="trilho"></div>
      <div class="gol-icone ${chegou && gol ? 'balanca' : ''}">🥅</div>
      ${bola}
      ${veredito}
    </div>
    <div class="lado dir"><small>🧤 GOLEIRO</small><b>${goleiro}</b></div>
  </div>`
}

const cartao = (placarA, placarB, bolasA, bolasB, palcoHtml, legenda) => `
<div class="quadro">
  <div class="card">
    <header><b>PÊNALTIS</b><strong>${placarA} × ${placarB}</strong><span>COBRANÇAS</span></header>
    <div class="row"><span class="esc" style="background:#C2452F"></span><span class="nome">WFP Bahia 88</span><div class="bolas">${bolasA}</div></div>
    <div class="row"><span class="esc" style="background:#123B8A"></span><span class="nome">São Luiz FC</span><div class="bolas">${bolasB}</div></div>
    ${palcoHtml}
  </div>
  <p class="leg">${legenda}</p>
</div>`

const b = (cls, txt) => `<span class="b ${cls}">${txt}</span>`
const bolasA = b('gol', 'AI') + b('gol', 'DJ') + b('gol', 'ED')
const bolasB = (vez, ok) => b('gol', 'RO') + b('erro', 'ZI') + (vez ? b('vez', 'SÓ') : ok ? b('gol', 'SÓ') : b('erro', 'SÓ'))

const CSS = `
@font-face{font-family:Oswald;font-weight:700;src:url(${f(700)}) format('woff2')}
@font-face{font-family:Oswald;font-weight:500;src:url(${f(500)}) format('woff2')}
*{box-sizing:border-box}
body{margin:0;background:#F4ECD6;font-family:Oswald,sans-serif;color:#0C0C0C;padding:26px 28px 22px}
h1{margin:0 0 4px;font-size:34px;font-weight:700;text-transform:uppercase;letter-spacing:.5px}
h1 em{color:#C2452F;font-style:normal}
p.sub{margin:0 0 18px;font-size:15px;font-weight:500;opacity:.8;max-width:900px;line-height:1.35}
.tira{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:22px}
.tira h2{grid-column:1/-1;margin:0;font-size:15px;text-transform:uppercase;letter-spacing:1.5px;font-weight:700}
.card{border:3px solid #0C0C0C;border-radius:14px;overflow:hidden;background:#F4ECD6;box-shadow:3px 3px 0 #0C0C0C}
header{display:flex;justify-content:space-between;align-items:center;padding:8px 10px 2px;font-size:11px;font-weight:700}
header strong{font-size:20px}header span{font-size:9px;color:#53534B;font-weight:500}
.row{display:grid;grid-template-columns:minmax(0,40%) minmax(0,1fr);align-items:center;gap:6px;padding:3px 10px;font-size:11px;font-weight:700}
.row>.nome{grid-column:1;display:flex;align-items:center;gap:5px}
.esc{width:14px;height:14px;border-radius:4px;border:1.5px solid #0C0C0C;display:inline-block;margin-right:5px;vertical-align:-3px}
.row{display:flex}.row .nome{width:40%}
.bolas{display:flex;gap:4px}
.b{width:19px;height:19px;border-radius:50%;border:1.5px solid #0C0C0C;display:grid;place-items:center;font-size:8px;font-weight:700;color:#fff}
.b.gol{background:#1B7A3D}.b.erro{background:#C2452F}.b.vez{background:#FFC400;color:#0C0C0C;box-shadow:0 0 0 2px #FFC400}
.palco{margin-top:6px;background:#0C0C0C;color:#F4ECD6;padding:7px 9px 8px;display:flex;align-items:center;gap:6px;min-height:52px}
.lado{flex:0 0 74px;display:flex;flex-direction:column;line-height:1.05;min-width:0}
.lado.dir{text-align:right;align-items:flex-end}
.lado small{font-size:8px;font-weight:700;letter-spacing:.8px;color:#FFC400;white-space:nowrap}
.lado b{font-size:12.5px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
.lado i{font-size:8.5px;font-style:normal;font-weight:500;opacity:.55}
.pista{flex:1;position:relative;height:36px}
.trilho{position:absolute;left:8%;right:8%;top:50%;border-top:1.5px dashed rgba(244,236,214,.25)}
.gol-icone{position:absolute;right:0;top:50%;transform:translateY(-50%);font-size:20px;opacity:.9}
.gol-icone.balanca{animation:balanca .35s ease}
@keyframes balanca{30%{transform:translateY(-50%) rotate(-10deg) scale(1.15)}60%{transform:translateY(-50%) rotate(8deg) scale(1.1)}}
.bola{position:absolute;top:50%;margin-top:-9px;font-size:15px;line-height:18px;filter:drop-shadow(0 2px 2px rgba(0,0,0,.6))}
.rastro{position:absolute;top:50%;height:3px;margin-top:-1px;border-radius:3px;background:linear-gradient(90deg,transparent,#FFC400)}
.bola.fim{left:auto;right:2px;transform:none;margin-top:-10px;font-size:16px}
.bola.na-luva{right:-2px}
.veredito{position:absolute;left:4%;top:50%;transform:translateY(-50%);white-space:nowrap;font-size:14px;font-weight:700;padding:2px 8px;border-radius:7px;border:2px solid #F4ECD6;animation:pop .25s cubic-bezier(.2,1.5,.5,1)}
.veredito.v-gol{background:#1B7A3D}.veredito.v-erro{background:#C2452F}
@keyframes pop{from{transform:translateY(-50%) scale(.5);opacity:0}}
.leg{margin:7px 2px 0;font-size:12px;font-weight:500;line-height:1.3;opacity:.85}
.leg b{font-weight:700}
.nota{border:3px solid #0C0C0C;border-radius:14px;background:#fff;box-shadow:4px 4px 0 #0C0C0C;padding:12px 16px;max-width:900px}
.nota h3{margin:0 0 6px;font-size:14px;text-transform:uppercase;letter-spacing:1.2px}
.nota p{margin:0;font-size:13px;font-weight:500;line-height:1.4}
`

const quadrosGol = [
  [0.0, '<b>0,0 s</b> — a bola nasce do lado de quem bate. O nome dele já está ali; o goleiro do outro lado.'],
  [0.45, '<b>0,45 s</b> — ela sai correndo pela pista, com um rastro dourado. Nada de veredito ainda: é só espera.'],
  [0.95, '<b>0,95 s</b> — chegando no goleiro. É aqui que a pessoa prende a respiração.'],
  [1.3, '<b>1,15 s</b> — entrou: a rede balança, a bolinha fica verde na linha e o "GOL!" pipoca. Some no próximo batedor.'],
]
const quadrosDef = [
  [0.0, 'A mesma cobrança, quando o goleiro pega:'],
  [0.45, 'Até aqui é IGUAL ao gol — a bola não entrega nada no caminho.'],
  [0.95, 'Mesma chegada. Quem está vendo não sabe o que vem.'],
  [1.3, '<b>1,15 s</b> — a luva fecha na bola e o "DEFENDEU!" pipoca. (Pra fora, trave e travessão são variações deste mesmo momento.)'],
]

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body>
<h1>Pênaltis: <em>a bola viaja</em></h1>
<p class="sub">Hoje a bolinha só pisca no meio do palco e o veredito cai do nada. Na ideia nova ela SAI do batedor, atravessa o palco e só quando chega no goleiro sai o "GOL!" ou "DEFENDEU!". É o mesmo 1,6 s da cobrança com gente — mas agora você está olhando a bola chegar. Nada de novo entra no cartão: é o mesmo palco preto, só que com a bola andando.</p>
<div class="tira"><h2>⚽ Gol — o caminho, quadro a quadro</h2>
${quadrosGol.map(([t, l]) => cartao(3, t >= 1.15 ? 2 : 1, bolasA, bolasB(t < 1.15, true), palco('Sócrates', 'São Luiz FC', 'Rogério Ceni', 'gol', t), l)).join('')}
</div>
<div class="tira"><h2>🧤 Defesa — o mesmo caminho, outro final</h2>
${quadrosDef.map(([t, l]) => cartao(3, 1, bolasA, bolasB(t < 1.15, false), palco('Sócrates', 'São Luiz FC', 'Rogério Ceni', 'defendeu', t), l)).join('')}
</div>
<div class="nota"><h3>🙈 O que continua escondido</h3><p>A bola faz o MESMO caminho no gol e na defesa — quem olha só descobre quando ela chega. O próximo batedor não aparece antes da hora, e o placar de cima só muda quando a bolinha da linha nasce. Bot contra bot a bola corre no ritmo rápido de sempre (0,85 s); é só desenho, não muda placar nem quem passa.</p></div>
</body></html>`

fs.mkdirSync('mockups', { recursive: true })
const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const page = await browser.newPage({ viewport: { width: 1180, height: 900 }, deviceScaleFactor: 2 })
await page.setContent(html, { waitUntil: 'load' })
await page.evaluate(() => document.fonts.ready)
await page.waitForTimeout(400)
await page.screenshot({ path: 'mockups/penaltis-bola.png', fullPage: true })
console.log('mockups/penaltis-bola.png')

// ── o GIF: um cartão só, uma cobrança de gol e uma de defesa, 24 quadros/s ──
const frames = []
const gifPage = await browser.newPage({ viewport: { width: 380, height: 176 }, deviceScaleFactor: 2 })
const seq = [['gol', true], ['defendeu', false]]
for (const [res, ok] of seq) {
  for (let i = 0; i <= 40; i++) {
    const t = i / 25 // 0 → 1,6 s
    const h = `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}body{padding:8px}</style></head><body>
      ${cartao(3, t >= 1.15 && ok ? 2 : 1, bolasA, bolasB(t < 1.15, ok), palco('Sócrates', 'São Luiz FC', 'Rogério Ceni', res, t), '').replace(/<p class="leg"><\/p>/, '')}</body></html>`
    await gifPage.setContent(h, { waitUntil: 'load' })
    if (i === 0 && res === 'gol') { await gifPage.evaluate(() => document.fonts.ready); await gifPage.waitForTimeout(200) }
    frames.push(await gifPage.locator('.card').screenshot())
  }
  // segura o veredito 0,8 s
  for (let k = 0; k < 20; k++) frames.push(frames[frames.length - 1])
}
fs.mkdirSync('/tmp/pens-gif', { recursive: true })
frames.forEach((buf, i) => fs.writeFileSync(`/tmp/pens-gif/f${String(i).padStart(3, '0')}.png`, buf))
console.log(`${frames.length} quadros em /tmp/pens-gif (o GIF é montado pelo Python logo depois)`)
await browser.close()
