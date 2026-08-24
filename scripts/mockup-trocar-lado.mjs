// ─── 🔁 MOCKUP: TROCAR DE LADO NO CAMPINHO (Diego 24/08) ────────────────────
// Pedido: *"quando boto o Roberto Carlos de lateral às vezes ele vai pra direita
// automático e o Cafu na esquerda, e eu queria inverter e não dá"*.
//   node scripts/mockup-trocar-lado.mjs [--saida x.png]
import { chromium } from 'playwright-core'
import { readFileSync, statSync } from 'node:fs'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'trocar-lado.png')
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'

// um jogador do campinho (mesma cara do jogo: bolinha + nome + clube/ano)
const jog = (nome, clube, ano, tag, estado) => {
  const anel = estado === 'sel' ? `0 0 0 5px ${GOLD}` : estado === 'alvo' ? `0 0 0 5px #41C07A` : 'none'
  const opac = estado === 'dim' ? .45 : 1
  return `
  <div style="text-align:center;opacity:${opac};width:88px">
    <div style="position:relative;display:inline-block">
      <span style="display:inline-flex;align-items:center;justify-content:center;width:56px;height:56px;border-radius:50%;border:3px solid ${INK};background:#DBD1B5;color:#fff;${OSW};font-size:22px;text-shadow:0 2px 3px rgba(0,0,0,.6);box-shadow:${anel}">${nome.trim()[0]}</span>
    </div>
    <p style="${OSW};text-transform:uppercase;color:#fff;margin:3px 0 0;font-size:11px;text-shadow:0 2px 3px rgba(0,0,0,.7);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
      <span style="background:${INK};border-radius:5px;padding:1px 4px;font-size:8px;margin-right:3px">${tag}</span>${nome}</p>
    <p style="font-weight:800;font-size:9px;color:rgba(255,255,255,.85);margin:2px 0 0;text-shadow:0 1px 2px rgba(0,0,0,.7)">${clube} · ${ano}</p>
  </div>`
}
const linha = (js) => `<div style="display:flex;justify-content:center;gap:4px;margin-bottom:12px">${js}</div>`
const campo = (conteudo) => `<div style="background:repeating-linear-gradient(180deg,${GREEN} 0 44px,#166332 44px 88px);border:3.5px solid ${INK};border-radius:14px;padding:14px 6px 8px;box-shadow:4px 4px 0 ${INK}">${conteudo}</div>`

const DEF = (a, b, estadoA, estadoB) => linha(
  jog(a, a === 'Cafu' ? 'São Paulo' : 'Real Madrid', a === 'Cafu' ? 1994 : 2002, 'LAT', estadoA) +
  jog('Aldair', 'Roma', 1993, 'ZAG', 'idle') +
  jog('Lúcio', 'Bayern', 2004, 'ZAG', 'idle') +
  jog(b, b === 'Cafu' ? 'São Paulo' : 'Real Madrid', b === 'Cafu' ? 1994 : 2002, 'LAT', estadoB))

const html = `<style>${FONTES}
*{box-sizing:border-box} body{margin:0;background:#F4ECD6;font-family:system-ui,-apple-system,sans-serif;color:${INK};padding:22px}
.f{width:430px;margin:0 auto}
.topo{background:linear-gradient(150deg,#1c1c1e,#0C0C0C 60%,#26221a);border:4px solid ${INK};border-radius:18px;box-shadow:4px 4px 0 ${INK};padding:14px;color:#fff;text-align:center}
.topo h1{${OSW};font-size:29px;line-height:1.05;text-transform:uppercase;margin:8px 0 0;color:${GOLD}}
.topo p{font-weight:600;font-size:12px;line-height:1.45;color:#EDE7D3;margin:8px 0 0}
.tag{display:inline-block;background:${GOLD};color:${INK};${OSW};font-size:10px;padding:3px 10px;border-radius:999px;border:2px solid ${INK};text-transform:uppercase}
.passo{display:flex;align-items:center;gap:9px;margin:18px 0 8px}
.passo .n{flex:none;width:26px;height:26px;border-radius:999px;background:${INK};color:${GOLD};display:flex;align-items:center;justify-content:center;${OSW};font-size:13px}
.passo p{margin:0;font-weight:800;font-size:12.5px;line-height:1.35}
.nota{background:#EAF7EE;border:3px solid ${GREEN};border-radius:14px;padding:11px 13px;font-weight:700;font-size:11.5px;line-height:1.5;margin-top:16px}
</style>
<div class="f">
  <div class="topo">
    <span class="tag">🔁 no campinho do elenco</span>
    <h1>Agora dá pra trocar<br>de lado</h1>
    <p>Roberto Carlos caiu na direita e o Cafu na esquerda? Dois toques e eles trocam de lugar.</p>
  </div>

  <div class="passo"><span class="n">1</span><p>Toque no primeiro — ele acende <b style="color:#B8860B">dourado</b>, e quem pode trocar com ele acende <b style="color:${GREEN}">verde</b>.</p></div>
  ${campo(DEF('Cafu', 'Roberto Carlos', 'sel', 'alvo'))}

  <div class="passo"><span class="n">2</span><p>Toque no outro: <b>trocaram de lado</b>. O canhoto na esquerda, o destro na direita.</p></div>
  ${campo(DEF('Roberto Carlos', 'Cafu', 'idle', 'idle'))}

  <div class="nota">⚖️ <b>Não muda a força do time.</b> A simulação usa a posição e o nível de cada um — nunca o lado. Trocar é organização do seu campinho, do jeito que você gosta de ver. E vale pra <b>qualquer posição</b>: os dois atacantes, os meias, a dupla de zaga.</div>
</div>`

const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const page = await browser.newPage({ viewport: { width: 474, height: 1000 }, deviceScaleFactor: 2 })
await page.setContent(html, { waitUntil: 'load' })
await page.evaluate(() => document.fonts.ready)
await page.screenshot({ path: SAIDA, fullPage: true })
await browser.close()
console.log(`${SAIDA} · ${(statSync(SAIDA).size / 1024).toFixed(0)} KB`)
