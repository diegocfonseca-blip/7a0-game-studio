// 📸 crachá do chat de quem está no pódio da semana (19/10). node scripts/foto-chat-podio.mjs <pasta>
import { chromium } from 'playwright-core'
import { spawn } from 'node:child_process'
const PORTA = '5265', OUT = process.argv[2] || 'scripts/mockups'
const vite = spawn('npx', ['vite', '--port', PORTA], { env: { ...process.env, DEPLOY_BASE: '/' }, stdio: 'ignore', detached: true })
for (let i = 0; i < 60; i++) { try { const r = await fetch(`http://localhost:${PORTA}/`); if (r.ok) break } catch {} await new Promise(r => setTimeout(r, 500)) }
const U = ['11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333']
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 430, height: 560 }, deviceScaleFactor: 2 })
p.on('pageerror', e => console.log('💥', e.message))
await p.route('**/rpc/esc_vitrine_salas**', r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ podio: U.map((uid, i) => ({ uid, pos: i + 1 })) }) }))
await p.goto(`http://localhost:${PORTA}/`, { waitUntil: 'domcontentloaded' })
await p.evaluate(`(async()=>{
  const R = await import('/@id/react'); const h = (R.default ?? R).createElement
  const RD = await import('/@id/react-dom/client'); const createRoot = RD.createRoot ?? RD.default?.createRoot
  const V = await import('/src/escalacao/vitrine-dados.ts'); await V.buscaVitrine?.()
  const C = await import('/src/escalacao/chat-sala.tsx'); const A = await import('/src/escalacao/amigos.tsx')
  document.getElementById('root')?.remove()
  const root=document.createElement('div'); root.style.cssText='padding:14px;background:#FBF6EA;min-height:100vh;display:grid;gap:12px;justify-items:start'; document.body.appendChild(root)
  const balao = (name, uid, txt) => h('div',{style:{border:'3px solid #0C0C0C',borderRadius:14,background:'#fff',padding:'8px 12px',boxShadow:'3px 3px 0 #0C0C0C',maxWidth:'80%'}}, h(A.ComPerfil,{uid}, h(C.ChatCracha,{name,uid})), h('div',{style:{fontSize:15,fontWeight:600}},txt))
  createRoot(root).render(h(R.Fragment ?? (R.default?.Fragment),null,
    balao('Cativeiro FC', null, '3 lendas'),
    balao('👑 Neymar_FC 🥇', '${U[0]}', 'bora que hoje é dia'),
    balao('⭐ Guimarães SCI 🥈', '${U[1]}', '2 lendas'),
    balao('Neymar_FC 🥉', '${U[2]}', '2')))
  await new Promise(r=>setTimeout(r,1500))
})()`)
await p.screenshot({ path: `${OUT}/chat-podio.png` })
await b.close(); try { process.kill(-vite.pid) } catch {}
console.log('ok')
