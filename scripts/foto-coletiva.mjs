// 📸 FOTOS DA COLETIVA DE IMPRENSA (19/10) numa carreira de verdade.
//   1. DEPLOY_BASE=/ npx vite --port 5199
//   2. node scripts/navega-carreira.mjs --fase nova --pasta /tmp/claude-0/carreira --url http://localhost:5199/
//   3. node scripts/foto-coletiva.mjs [--pasta /tmp/claude-0/carreira] [--url http://localhost:5199/] [--desk]
// Carrega o save, liga a coletiva pela chave de bancada (`esc-coletiva-dev`), põe no MANUAL e joga rodada a rodada
// até a coletiva acordar. Fotografa: o cartão · a resposta · a Central (quadro + manchete) · a Sala de imprensa.
import { chromium } from 'playwright-core'
import { readFileSync } from 'node:fs'
const arg = (n, d = '') => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const PASTA = arg('pasta', '/tmp/claude-0/carreira'), URL = arg('url', 'http://localhost:5199/'), DESK = process.argv.includes('--desk')
const OUT = arg('out', PASTA)
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: DESK ? { width: 1440, height: 900 } : { width: 430, height: 900 }, deviceScaleFactor: DESK ? 1 : 2, locale: 'pt-BR' })
p.on('pageerror', e => console.log('⚠️ erro na página:', e.message.slice(0, 160)))
const texto = () => p.evaluate(() => document.body.innerText)
const botoes = () => p.evaluate(() => [...document.querySelectorAll('button,[role=button],a')].map((e, i) => i + ':' + (e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 60)))
const clica = async (re) => { const alvo = (await botoes()).find(s => re.test(s.split(':').slice(1).join(':'))); if (!alvo) return false; await p.locator('button,[role=button],a').nth(Number(alvo.split(':')[0])).click({ timeout: 5000, force: true }).catch(() => {}); return true }
const aba = n => p.evaluate(n => { const b = [...document.querySelectorAll('.ll-career-navigation button')].find(x => (x.getAttribute('aria-label') || x.textContent || '').trim() === n); b?.click() }, n)

const save = JSON.parse(readFileSync(`${PASTA}/save.json`, 'utf8'))
await p.goto(URL, { waitUntil: 'domcontentloaded' })
await p.evaluate(s => { for (const [k, v] of Object.entries(s)) localStorage.setItem(k, v); localStorage.setItem('esc-coletiva-dev', '1'); localStorage.setItem('esc-sim-manual', '1'); localStorage.setItem('bl_lang', 'pt') }, save)
await p.goto(URL, { waitUntil: 'networkidle' }); await p.waitForTimeout(2000)
await p.getByText('LEILÃO LEGENDS 38').first().click().catch(() => {}); await p.waitForTimeout(2400)
await p.getByText(/CONTINUAR · /i).first().click({ timeout: 8000 }).catch(() => {}); await p.waitForTimeout(4000)
await clica(/^fechar$|^✕$/); await p.waitForTimeout(500)
await aba('Jogos'); await p.waitForTimeout(800)
// velocidade máxima se tiver botão
await clica(/^⚡+$|^🐇$|rápido/i).catch(() => {})
let achou = false
for (let r = 0; r < 14 && !achou; r++) {
  if (!await clica(/Próxima rodada/i)) { console.log('sem botão de próxima rodada'); break }
  for (let k = 0; k < 40; k++) {
    await p.waitForTimeout(1000)
    const t = await texto()
    if (/pular coletiva/i.test(t)) { achou = true; break }
    if (/▶️ Próxima rodada/.test(t)) break
  }
  console.log('rodada', r + 1, achou ? '🎙️ coletiva!' : '…')
}
if (!achou) { console.log('❌ nenhuma coletiva em 14 rodadas'); await b.close(); process.exit(1) }
const el = p.locator('text=pular coletiva').first()
await el.scrollIntoViewIfNeeded(); await p.evaluate(() => window.scrollBy(0, -420)); await p.waitForTimeout(400)
await p.screenshot({ path: `${OUT}/coletiva-1-pergunta.png` })
console.log(((await texto()).match(/🎙️ Coletiva[\s\S]{0,400}/) ?? [''])[0].replace(/\n+/g, ' | '))
// responde provocando (1º botão da lista de respostas)
await p.locator('button:has-text("provoca")').first().click({ force: true }); await p.waitForTimeout(800)
await aba('Central'); await p.waitForTimeout(1500); await p.evaluate(() => window.scrollTo(0, 0))
await p.screenshot({ path: `${OUT}/coletiva-2-central-topo.png` })
const card = p.locator('.ll-c-coletiva').first()
if (await card.count()) { await card.scrollIntoViewIfNeeded(); await p.waitForTimeout(300); await p.screenshot({ path: `${OUT}/coletiva-3-central-quadro.png` }) }
await clica(/sala de imprensa/i); await p.waitForTimeout(900)
await p.screenshot({ path: `${OUT}/coletiva-4-sala.png` })
console.log('✅ fotos em', OUT)
await b.close()
