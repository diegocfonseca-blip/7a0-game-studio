import { chromium } from 'playwright-core'
const PORTA = 5321
process.chdir('/home/user/7a0-game-studio'); process.env.DEPLOY_BASE = '/'
const { createServer } = await import('vite')
const vite = await createServer({ root: '/home/user/7a0-game-studio', server: { port: PORTA, strictPort: true, watch: null, hmr: false } })
await vite.listen()
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', ignoreDefaultArgs: ['--hide-scrollbars'] })
const cx = await b.newContext({ viewport: { width: 390, height: 844 }, locale: 'pt-BR', hasTouch: false }); await cx.addInitScript(() => { try { localStorage.setItem('bl_lang', 'pt') } catch {} })
const p = await cx.newPage(); p.on('pageerror', e => console.log('ERRO', String(e).slice(0, 300)))
await p.goto(`http://localhost:${PORTA}/scripts/teste-draft/index.html?cena=escolha&minha=1`, { waitUntil: 'networkidle' }); await p.waitForTimeout(3500)
const cx2 = p.locator('.ld-lista-draft').first()
console.log('caixa', await cx2.count())
const y = await cx2.evaluate(e => e.getBoundingClientRect().top + window.scrollY); await p.evaluate(y => window.scrollTo(0, y - 240), y)
await p.waitForTimeout(300); await p.screenshot({ path: '/tmp/claude-0/ld/topo.png' })
// rola a caixa até o fim 3 vezes pra ver se carrega mais
for (let i = 0; i < 3; i++) { await cx2.evaluate(e => { e.scrollTop = e.scrollHeight }); await p.waitForTimeout(500) }
console.log('linhas', await cx2.evaluate(e => e.children.length))
await p.screenshot({ path: '/tmp/claude-0/ld/rolado.png' })
await b.close(); await vite.close()
