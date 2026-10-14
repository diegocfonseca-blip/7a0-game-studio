// 🎬 grava a gala única do Tricolor do Arruda rodando DE VERDADE (o componente do jogo), tela de celular.
// uso: node scripts/video-gala-arruda.mjs  → scripts/posts/gala-arruda.webm
import { chromium } from 'playwright-core'
import { spawn } from 'node:child_process'
import { renameSync, mkdirSync, readdirSync } from 'node:fs'
const PORTA = '5272'
const vite = spawn('npx', ['vite', '--port', PORTA], { env: { ...process.env, DEPLOY_BASE: '/' }, stdio: 'ignore', detached: true })
for (let i = 0; i < 60; i++) { try { const r = await fetch(`http://localhost:${PORTA}/`); if (r.ok) break } catch {} await new Promise(r => setTimeout(r, 500)) }
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
// 1ª passada só aquece o vite (não grava)
{ const p = await b.newPage(); await p.goto(`http://localhost:${PORTA}/`, { waitUntil: 'domcontentloaded' }); await p.evaluate(`import('/src/escalacao/gala-arruda.tsx')`); await p.waitForTimeout(3000); await p.close() }
mkdirSync('/tmp/claude-0/vid', { recursive: true })
const ctx = await b.newContext({ viewport: { width: 390, height: 760 }, recordVideo: { dir: '/tmp/claude-0/vid', size: { width: 390, height: 760 } } })
await ctx.addInitScript(() => { try { localStorage.setItem('bl_lang', 'pt') } catch {} })
const p = await ctx.newPage()
await p.goto(`http://localhost:${PORTA}/`, { waitUntil: 'domcontentloaded' })
await p.evaluate(`(async()=>{
  const R = await import('/@id/react'); const h = (R.default ?? R).createElement
  const RD = await import('/@id/react-dom/client'); const createRoot = RD.createRoot ?? RD.default?.createRoot
  const G = await import('/src/escalacao/gala-arruda.tsx')
  document.getElementById('root')?.remove(); document.body.style.background='#F4ECD6'
  const root=document.createElement('div'); document.body.appendChild(root)
  await new Promise(r=>setTimeout(r,700))
  createRoot(root).render(h(G.GalaArruda,{clube:'Tricolor do Arruda FC',chave:'v',mostra:'Tricolor do Arruda FC',grito:'ARRUDA'}))
})()`)
await p.waitForTimeout(7400)
await ctx.close(); await b.close(); try { process.kill(-vite.pid) } catch {}
const f = readdirSync('/tmp/claude-0/vid').filter(x => x.endsWith('.webm')).map(x => '/tmp/claude-0/vid/' + x).pop()
renameSync(f, 'scripts/posts/gala-arruda.webm'); console.log('🎬 scripts/posts/gala-arruda.webm')
