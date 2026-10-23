// 🎬 grava a gala única do K9 FC rodando DE VERDADE (o componente do jogo), tela de celular.
// uso: node scripts/video-gala-k9.mjs  → scripts/posts/gala-k9.webm
import { chromium } from 'playwright-core'
import { spawn } from 'node:child_process'
import { renameSync, mkdirSync, readdirSync } from 'node:fs'
const PORTA = "5273"
const vite = spawn('npx', ['vite', '--port', PORTA], { env: { ...process.env, DEPLOY_BASE: '/' }, stdio: 'ignore', detached: true })
for (let i = 0; i < 60; i++) { try { const r = await fetch(`http://localhost:${PORTA}/`); if (r.ok) break } catch {} await new Promise(r => setTimeout(r, 500)) }
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
// 1ª passada só aquece o vite (não grava)
{ const p = await b.newPage(); await p.goto(`http://localhost:${PORTA}/`, { waitUntil: 'domcontentloaded' }); await p.evaluate(`import('/src/escalacao/gala-k9.tsx')`); await p.waitForTimeout(3000); await p.close() }
mkdirSync('/tmp/claude-0/vidk9', { recursive: true })
const ctx = await b.newContext({ viewport: { width: 390, height: 760 }, recordVideo: { dir: '/tmp/claude-0/vidk9', size: { width: 390, height: 760 } } })
await ctx.addInitScript(() => { try { localStorage.setItem('bl_lang', 'pt') } catch {} })
const p = await ctx.newPage()
await p.goto(`http://localhost:${PORTA}/`, { waitUntil: 'domcontentloaded' })
await p.evaluate(`(async()=>{
  const R = await import('/@id/react'); const h = (R.default ?? R).createElement
  const RD = await import('/@id/react-dom/client'); const createRoot = RD.createRoot ?? RD.default?.createRoot
  const G = await import('/src/escalacao/gala-k9.tsx')
  document.getElementById('root')?.remove(); document.body.style.background='#F4ECD6'
  const root=document.createElement('div'); document.body.appendChild(root)
  await new Promise(r=>setTimeout(r,700))
  createRoot(root).render(h(G.GalaK9,{clube:"K9 FC",chave:"v",mostra:"K9 FC",grito:"K9"}))
})()`)
await p.waitForTimeout(8400)
await ctx.close(); await b.close(); try { process.kill(-vite.pid) } catch {}
const f = readdirSync('/tmp/claude-0/vidk9').filter(x => x.endsWith('.webm')).map(x => '/tmp/claude-0/vidk9/' + x).pop()
renameSync(f, 'scripts/posts/gala-k9.webm'); console.log('🎬 scripts/posts/gala-k9.webm')
