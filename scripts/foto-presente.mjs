// 📸 presente de plano (14/10): a caixa na Loja (vista por Craque) + o aviso que o amigo vê. node scripts/foto-presente.mjs
import { chromium } from 'playwright-core'
import { spawn } from 'node:child_process'
const PORTA = '5261'
const vite = spawn('npx', ['vite', '--port', PORTA], { env: { ...process.env, DEPLOY_BASE: '/' }, stdio: 'ignore', detached: true })
for (let i = 0; i < 40; i++) { try { const r = await fetch(`http://localhost:${PORTA}/`); if (r.ok) break } catch { /* subindo */ } await new Promise(r => setTimeout(r, 500)) }
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const ctx = await b.newContext({ viewport: { width: 420, height: 3400 }, deviceScaleFactor: 2 })
await ctx.addInitScript(() => { try { localStorage.setItem('bl_lang', 'pt') } catch {} })
const p = await ctx.newPage(); p.on('pageerror', e => console.error('💥', e.message))
await p.route('**/rpc/esc_meus_direitos**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '{}' }))
await p.route('**/rpc/esc_meus_presentes**', r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ id: 7, de_nome: 'Renaton', plano: 'craque', recado: 'Agora não tem desculpa pra perder no envelope 😂' }]) }))
await p.goto(`http://localhost:${PORTA}/`, { waitUntil: 'domcontentloaded' })
await p.evaluate(`(async()=>{
  const R = await import('/@id/react'); const React = R.default ?? R; const h = React.createElement
  const RD = await import('/@id/react-dom/client'); const createRoot = RD.createRoot ?? RD.default?.createRoot
  const A = await import('/src/escalacao/apoio.tsx'); A._bancadaApoio('foto@teste.com','prata'); A.recarregaDireitos()
  const L = await import('/src/escalacao/loja-clube.tsx')
  document.getElementById('root')?.remove()
  const root=document.createElement('div'); document.body.appendChild(root)
  createRoot(root).render(h(L.LojaButton,{}))
  await new Promise(r=>setTimeout(r,800)); document.querySelector('button')?.click()
  await new Promise(r=>setTimeout(r,2000))
})()`)
await p.screenshot({ path: 'scripts/mockups/presente-loja.png', fullPage: true })
await p.evaluate(`(async()=>{
  const R = await import('/@id/react'); const h = (R.default ?? R).createElement
  const RD = await import('/@id/react-dom/client'); const createRoot = RD.createRoot ?? RD.default?.createRoot
  const P = await import('/src/escalacao/presente.tsx')
  document.body.innerHTML=''; const root=document.createElement('div'); document.body.appendChild(root)
  createRoot(root).render(h(P.PresenteRecebido,{}))
  await new Promise(r=>setTimeout(r,3500))
})()`)
await p.screenshot({ path: 'scripts/mockups/presente-aviso.png' })
await b.close(); try { process.kill(-vite.pid) } catch { /* já foi */ }
console.log('📸 ok')
