// 📸 foto da seção REAL "Pra onde vai o dinheiro" + meta (14/10): node scripts/foto-apoie-dinheiro.mjs
import { chromium } from 'playwright-core'
import { spawn } from 'node:child_process'
const PORTA = '5257'
const vite = spawn('npx', ['vite', '--port', PORTA], { env: { ...process.env, DEPLOY_BASE: '/' }, stdio: 'ignore', detached: true })
for (let i = 0; i < 40; i++) { try { const r = await fetch(`http://localhost:${PORTA}/`); if (r.ok) break } catch { /* subindo */ } await new Promise(r => setTimeout(r, 500)) }
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const ctx = await b.newContext({ viewport: { width: 420, height: 900 }, deviceScaleFactor: 2 })
await ctx.addInitScript(() => { try { localStorage.setItem('bl_lang', 'pt') } catch {} })
const p = await ctx.newPage(); p.on('pageerror', e => console.error('💥', e.message))
// 🧪 a máquina de teste não alcança o banco: a foto finge a resposta da meta (22%, o número que o Diego pôs em 14/10)
await p.route('**/rest/v1/esc_meta_mes**', r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ pct: 22 }) }))
await p.goto(`http://localhost:${PORTA}/`, { waitUntil: 'domcontentloaded' })
await p.evaluate(`(async()=>{
  const R = await import('/@id/react'); const React = R.default ?? R; const h = React.createElement
  const RD = await import('/@id/react-dom/client'); const createRoot = RD.createRoot ?? RD.default?.createRoot
  const S = await import('/src/escalacao/support-plans.tsx')
  document.getElementById('root')?.remove(); document.body.style.cssText='margin:0;background:#F4ECD6;padding:14px'
  const root=document.createElement('div'); root.className='ll-support-offer'; document.body.appendChild(root)
  createRoot(root).render(h('div',{className:'ll-support-bottom'},h(S.SupportMoney)))
  await new Promise(r=>setTimeout(r,3000))
})()`)
await p.screenshot({ path: 'scripts/mockups/apoie-dinheiro-real.png', fullPage: true })
await b.close(); try { process.kill(-vite.pid) } catch { /* já foi */ }
console.log('📸 scripts/mockups/apoie-dinheiro-real.png')
