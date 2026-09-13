// 🧪 REPRO: toca a Copa de um save e, numa FASE escolhida, despeja o texto da tela
// (pra ver pênaltis, placares, o que estava montado) — e caça erro de página. Aceita
// BROWSER=webkit (se o WebKit do Playwright estiver instalado) pra imitar iPhone.
//   BROWSER=webkit node scripts/repro-copa-fase.mjs <save.json> [url] [fase=Quartas] [segundos=200]
import { chromium, webkit } from 'playwright-core'
import { readFileSync } from 'node:fs'

const [saveFile, url = 'http://localhost:5177/7a0-game-studio/', faseAlvo = 'Quartas', segundos = '200'] = process.argv.slice(2)
const save = readFileSync(saveFile, 'utf8')
const out = process.env.OUT || '/tmp/repro-copa-fase'
const isWk = process.env.BROWSER === 'webkit'
const browser = isWk
  ? await webkit.launch({ executablePath: process.env.WEBKIT_PATH || undefined })
  : await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
  userAgent: isWk ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/128.0.0.0 Mobile/15E148 Safari/604.1' : undefined })
const page = await ctx.newPage()
await page.addInitScript(([s]) => {
  localStorage.setItem('esc-solo-career', s)
  localStorage.setItem('esc-solo-career-at', String(Date.now()))
  localStorage.setItem('bl_lang', 'pt')
}, [save])
const erros = []
page.on('pageerror', e => { erros.push(e); console.log('💥 PAGEERROR', e.message, '\n', (e.stack || '').split('\n').slice(0, 10).join('\n')) })
page.on('console', m => { if (m.type() === 'error' && !/ERR_|Failed to load resource/.test(m.text())) console.log('🟥 console.error', m.text().slice(0, 500)) })
await page.goto(url, { waitUntil: 'networkidle' })
await page.getByText(/LEILÃO LEGENDS/).first().click()
await page.getByText(/^CONTINUAR · /).first().click()

let ultimo = '', dumped = false, ops = false
const t0 = Date.now()
while ((Date.now() - t0) / 1000 < +segundos) {
  const txt = await page.evaluate(() => document.body.innerText)
  if (/Ops, algo deu errado/.test(txt)) { ops = true; console.log('💀 tela de erro:\n' + txt.slice(0, 1500)); await page.screenshot({ path: `${out}-ops.png`, fullPage: true }); break }
  const m = txt.match(/(Peneira|Rodada de 64|Rodada de 32|Oitavas|Quartas|Semifinal|Final|Supercopa) · OUTROS JOGOS/)
  const fase = m ? m[1] : '?'
  if (fase !== ultimo) { console.log(`t+${Math.round((Date.now() - t0) / 1000).toString().padStart(3)}s · fase ${fase}`); ultimo = fase }
  if (fase === faseAlvo && !dumped && /ENCERRADO|FIM/.test(txt.split(faseAlvo + ' · OUTROS JOGOS')[1] ?? '')) {
    dumped = true
    const sec = txt.split(faseAlvo + ' · OUTROS JOGOS')[1] ?? ''
    console.log(`📋 ${faseAlvo} · OUTROS JOGOS (fim da fase):\n` + sec.slice(0, 2500))
    await page.screenshot({ path: `${out}-${faseAlvo}.png`, fullPage: true })
    // 🧨 SABOTA=1: imita o que o WebKit fez no iPhone — tira um card da lista de onde o
    // React o deixou. Na virada de fase o React vai tentar removê-lo e o navegador
    // responde "not a child" (no WebKit: "The object can not be found here"). Com a
    // zona segura, a lista tem que piscar "atualizando…" e seguir; sem ela, cai a tela.
    if (process.env.SABOTA === '1') {
      const feito = await page.evaluate(() => {
        const grid = document.querySelector('.ll29-match-grid')
        const card = grid?.querySelectorAll(':scope > article')[2]
        if (!card) return 'sem card'
        document.body.appendChild(card) // sai do lugar: o React ainda acha que está no grid
        card.setAttribute('hidden', '')
        return 'card 3 movido pra fora do grid'
      })
      console.log('🧨 sabotagem:', feito)
    }
  }
  await page.waitForTimeout(700)
}
await browser.close()
console.log(ops || erros.length ? `❌ erro (${erros.length} pageerror${ops ? ' + tela de erro' : ''})` : '✅ sem erro de página')
process.exit(ops || erros.length ? 1 : 0)
