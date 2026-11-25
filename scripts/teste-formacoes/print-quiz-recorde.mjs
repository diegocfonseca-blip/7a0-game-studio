// 🧪 25/11: o quiz com a sequência guardada e o 🏆 recorde (começa com 5 seguidos e recorde 9)
import { chromium } from 'playwright-core'
const PORTA = 5301
process.env.DEPLOY_BASE = '/'
const { createServer } = await import('vite')
const vite = await createServer({ server: { port: PORTA, strictPort: true, watch: null, hmr: false } })
await vite.listen()
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const cx = await b.newContext({ viewport: { width: 390, height: 900 }, deviceScaleFactor: 2, locale: 'pt-BR' })
await cx.addInitScript(() => { try { localStorage.setItem('bl_lang', 'pt'); if (!sessionStorage.getItem('ja')) { localStorage.setItem('esc-quiz-seguidos', '5'); localStorage.setItem('esc-quiz-recorde', '9'); sessionStorage.setItem('ja', '1') } } catch {} })
const p = await cx.newPage(); p.on('pageerror', e => console.log('ERRO', String(e).slice(0, 300)))
await p.goto(`http://localhost:${PORTA}/scripts/teste-formacoes/quiz.html`, { waitUntil: 'networkidle' }); await p.waitForTimeout(3000)
await p.screenshot({ path: process.argv[2] + '/quiz-recorde.png' })
await p.locator('button', { hasText: /.+/ }).nth(1).click(); await p.waitForTimeout(500)
await p.screenshot({ path: process.argv[2] + '/quiz-recorde-resp.png' })
await b.close(); await vite.close()
