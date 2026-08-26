// ─── 🔊 OS 6 ÁUDIOS DA SALA DE ESPERA (Diego 25/08) ────────────────────────
//
// Ele mandou dois áudios novos: 🐊 no que começa com "share22" e ☀️ "Bom dia" no
// outro. Este mockup mostra a fileira da buzina ANTES (4) e DEPOIS (6), no mesmo
// desenho da tela de verdade — botão dourado, borda preta, Oswald.
//
//   node scripts/mockup-audios-sala.mjs [--saida audios-sala.png]
import { readFileSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright-core'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'audios-sala.png')
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6', GREEN = '#1B7A3D'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'

const botao = ([ic, tx], novo) => `
  <button style="border:2px solid ${INK};border-radius:12px;padding:9px 8px;${OSW};font-size:11px;
    background:${GOLD};color:#000;position:relative;${novo ? `outline:3px dashed ${GREEN};outline-offset:3px` : ''}">
    ${ic} ${tx} 🔊
  </button>`

const fileira = (lista, marcaNovos) => `
  <div style="width:330px;border:3px solid ${INK};border-radius:16px;padding:12px;background:${CREME};box-shadow:4px 4px 0 ${INK}">
    <p style="${OSW};font-size:11px;text-transform:uppercase;letter-spacing:.14em;color:rgba(0,0,0,.6);margin:0 0 8px">😜 Enquanto espera… zoa a galera</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
      ${lista.map((b, i) => botao(b, marcaNovos && i >= 4)).join('')}
    </div>
  </div>`

const QUATRO = [['📞', '"Posso te ligar agora?"'], ['🎙️', 'AQUELE áudio'], ['🗣️', 'SIIIIUU!'], ['🔊', 'Áudio novo']]
const SEIS = [...QUATRO, ['🐊', 'Jacaré'], ['☀️', 'Bom dia']]

const html = `<!doctype html><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box;margin:0;padding:0}
body{background:#fff;padding:30px;font-family:system-ui}
button{cursor:default}</style>
<body>
  <div style="display:inline-block;background:${GOLD};border:3px solid ${INK};border-radius:999px;box-shadow:3px 3px 0 ${INK};
    padding:5px 15px;${OSW};font-size:12.5px;letter-spacing:.08em">🔊 SALA DE ESPERA · AGORA SÃO 6 ÁUDIOS</div>
  <div style="display:flex;gap:26px;align-items:flex-start;margin-top:18px">
    <div>
      <p style="${OSW};font-size:13px;text-transform:uppercase;color:rgba(0,0,0,.5);margin:0 0 8px">Como é hoje · 4</p>
      ${fileira(QUATRO, false)}
    </div>
    <div>
      <p style="${OSW};font-size:13px;text-transform:uppercase;color:${GREEN};margin:0 0 8px">Com os dois novos · 6</p>
      ${fileira(SEIS, true)}
    </div>
    <div style="width:330px;border:3px solid ${INK};border-radius:16px;padding:14px;background:#fff;box-shadow:4px 4px 0 ${INK}">
      <p style="${OSW};font-size:14px;text-transform:uppercase;margin:0 0 8px">⏱️ Atenção no tamanho</p>
      <p style="font-size:12px;font-weight:600;line-height:1.5;margin:0">
        O do <b>🐊 jacaré tem 1 minuto e 6 segundos</b>. Os outros da sala vão de 3 a 17 segundos.<br><br>
        Como a sala toca <b>um áudio por vez</b>, enquanto ele rola <b>ninguém mais consegue soltar som</b> —
        por mais de um minuto.<br><br>
        O ☀️ <b>bom dia tem 28s</b>, esse tá de bom tamanho.<br><br>
        <b>Se quiser, eu corto o jacaré</b> pros primeiros ~10s (a parte da piada) e ele fica no ritmo dos outros.
      </p>
    </div>
  </div>
</body>`

const tmp = `/tmp/mock-audios-${process.pid}.html`
writeFileSync(tmp, html)
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1150, height: 420 }, deviceScaleFactor: 2 })
await p.goto('file://' + tmp)
await p.evaluate(() => document.fonts.ready)
await p.waitForTimeout(400)
await p.screenshot({ path: SAIDA, fullPage: true })
await b.close()
console.log(SAIDA)
