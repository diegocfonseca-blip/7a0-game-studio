// 🧪 print da Partida Rápida offline (25/11): visual escuro (conta principal, login FALSO só na bancada) e creme (todo mundo)
import { chromium } from 'playwright-core'
const PORTA = 5312, OUT = process.argv[2] ?? '/tmp/claude-0/tat'
process.chdir('/home/user/7a0-game-studio'); process.env.DEPLOY_BASE = '/'
const { createServer } = await import('vite')
const vite = await createServer({ root: '/home/user/7a0-game-studio', server: { port: PORTA, strictPort: true, watch: null, hmr: false } })
await vite.listen()
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const user = { id: '6b5cf422-d4ad-4c69-a7e6-da1125c85844', aud: 'authenticated', role: 'authenticated', email: 'diego.c.fonseca@gmail.com', app_metadata: {}, user_metadata: {}, created_at: '2026-01-01T00:00:00Z' }
const sessao = { access_token: 'x.eyJleHAiOjQxMDI0NDQ4MDB9.x', token_type: 'bearer', expires_in: 3600, expires_at: 4102444800, refresh_token: 'r', user }
for (const escuro of [true, false]) for (const w of [390, 1280]) {
  const cx = await b.newContext({ viewport: { width: w, height: w > 800 ? 900 : 844 }, locale: 'pt-BR' })
  await cx.addInitScript(([s, escuro]) => { try { localStorage.setItem('bl_lang', 'pt'); if (escuro) localStorage.setItem('sb-faabglpjutwursgmrpny-auth-token', s) } catch {} }, [JSON.stringify(sessao), escuro])
  await cx.route('**/*.supabase.co/**', r => r.request().url().includes('/auth/v1/user') ? r.fulfill({ json: user }) : r.fulfill({ json: [] }))
  const p = await cx.newPage(); p.on('pageerror', e => console.log('ERRO', w, String(e).slice(0, 300)))
  await p.goto(`http://localhost:${PORTA}/scripts/teste-taticas-rapida/index.html`, { waitUntil: 'networkidle' }); await p.waitForTimeout(4000)
  if (escuro) { await p.locator('.ov3-speed').first().click(); await p.locator('.ov3-speed-dialog select').first().selectOption('manual'); await p.locator('.ov3-dialog-done').click(); await p.waitForTimeout(800) }
  const nome = `${escuro ? 'escuro' : 'creme'}-${w}`
  await p.screenshot({ path: `${OUT}/rapida-${nome}.png`, fullPage: true }); await p.close()
  console.log('ok', nome)
}
await b.close(); await vite.close()
