// 🎬 grava a gala única do Piranhão FC rodando DE VERDADE (o componente do jogo), tela de celular.
// uso: node scripts/video-gala-piranhao.mjs  → scripts/posts/gala-piranhao.webm
import { chromium } from 'playwright-core'
import { spawn } from 'node:child_process'
import { renameSync, mkdirSync, readdirSync } from 'node:fs'
const PORTA = "5288"
const vite = spawn('npx', ['vite', '--port', PORTA], { env: { ...process.env, DEPLOY_BASE: '/' }, stdio: 'ignore', detached: true })
for (let i = 0; i < 60; i++) { try { const r = await fetch(`http://localhost:${PORTA}/`); if (r.ok) break } catch {} await new Promise(r => setTimeout(r, 500)) }
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
// 1ª passada só aquece o vite (não grava)
{ const p = await b.newPage(); await p.goto(`http://localhost:${PORTA}/`, { waitUntil: 'domcontentloaded' }); await p.evaluate(`import('/src/escalacao/gala-piranhao.tsx')`); await p.waitForTimeout(3000); await p.close() }
mkdirSync('/tmp/claude-0/vidpz', { recursive: true })
const ctx = await b.newContext({ viewport: { width: 390, height: 760 }, recordVideo: { dir: '/tmp/claude-0/vidpz', size: { width: 390, height: 760 } } })
await ctx.addInitScript(() => { try { localStorage.setItem('bl_lang', 'pt') } catch {} })
const p = await ctx.newPage()
await p.goto(`http://localhost:${PORTA}/`, { waitUntil: 'domcontentloaded' })
await p.evaluate(`(async()=>{
  const R = await import('/@id/react'); const h = (R.default ?? R).createElement
  const RD = await import('/@id/react-dom/client'); const createRoot = RD.createRoot ?? RD.default?.createRoot
  const G = await import('/src/escalacao/gala-piranhao.tsx')
  document.getElementById('root')?.remove(); document.body.style.background='#F4ECD6'
  const root=document.createElement('div'); document.body.appendChild(root)
  await new Promise(r=>setTimeout(r,700))
  createRoot(root).render(h(G.GalaPiranhao,{clube:'Piranhão FC',chave:'v',mostra:'Piranhão FC',grito:'PIRANHAO'}))
})()`)
await p.waitForTimeout(9800)
await ctx.close(); await b.close(); try { process.kill(-vite.pid) } catch {}
const f = readdirSync('/tmp/claude-0/vidpz').filter(x => x.endsWith('.webm')).map(x => '/tmp/claude-0/vidpz/' + x).pop()
renameSync(f, 'scripts/posts/gala-piranhao.webm'); console.log('🎬 scripts/posts/gala-piranhao.webm')
