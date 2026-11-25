import { chromium } from 'playwright-core'
const PORTA = 5311, OUT = process.argv[2] ?? '/tmp/claude-0/tat'
process.chdir('/home/user/7a0-game-studio'); process.env.DEPLOY_BASE = '/'
const { createServer } = await import('vite')
const vite = await createServer({ root: '/home/user/7a0-game-studio', server: { port: PORTA, strictPort: true, watch: null, hmr: false } })
await vite.listen()
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
for (const aba of ['jogo', 'elenco', 'aba-elenco']) for (const w of [390, 1280]) {
  const cx = await b.newContext({ viewport: { width: w, height: w > 800 ? 900 : 844 }, locale: 'pt-BR' }); await cx.addInitScript(() => { try { localStorage.setItem('bl_lang', 'pt') } catch {} }); const p = await cx.newPage(); p.on('pageerror', e => console.log('ERRO', aba, w, String(e).slice(0, 300)))
  await p.goto(`http://localhost:${PORTA}/scripts/teste-taticas-draft/index.html?aba=${aba === 'aba-elenco' ? 'jogo' : aba}`, { waitUntil: 'networkidle' }); await p.waitForTimeout(3500)
  if (aba === 'aba-elenco') { await p.getByRole('button', { name: /^Elenco$/ }).first().click(); await p.waitForTimeout(1200) }
  const t = p.locator('.ld-taticas').first()
  const alvo = p.locator(aba === 'aba-elenco' ? '.ld-taticas-escuro:visible, .ld-taticas:visible' : '.ld-taticas:visible, .fp-advanced-tactics:visible').first(); if (await alvo.count()) { const y = await alvo.evaluate(e => e.getBoundingClientRect().top + window.scrollY); await p.evaluate(y => window.scrollTo(0, y - 200), y) } else console.log('SEM PAINEL', aba, w, await t.count())
  await p.waitForTimeout(300)
  await p.screenshot({ path: `${OUT}/${aba}-${w}.png` }); await p.close()
}
await b.close(); await vite.close()
