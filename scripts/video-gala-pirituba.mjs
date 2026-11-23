// 🎬 grava a gala única do Pirituba SF rodando DE VERDADE (o componente do jogo), tela de celular.
// uso: node scripts/video-gala-pirituba.mjs  → scripts/posts/gala-pirituba.webm
import { chromium } from 'playwright-core'
import { renameSync, mkdirSync, readdirSync } from 'node:fs'
const PORTA = "5291"
process.env.DEPLOY_BASE = '/'
const { createServer } = await import('vite')
const vite = await createServer({ server: { port: Number(PORTA), strictPort: true, watch: null, hmr: false } }) // sem vigiar arquivos (o contêiner estoura o limite de watchers)
await vite.listen()
for (let i = 0; i < 60; i++) { try { const r = await fetch(`http://localhost:${PORTA}/`); if (r.ok) break } catch {} await new Promise(r => setTimeout(r, 500)) }
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
// 1ª passada só aquece o vite (não grava)
{ const p = await b.newPage(); await p.goto(`http://localhost:${PORTA}/`, { waitUntil: 'domcontentloaded' }); await p.evaluate(`import('/src/escalacao/gala-pirituba.tsx')`); await p.waitForTimeout(3000); await p.close() }
mkdirSync('/tmp/claude-0/vidp', { recursive: true })
const ctx = await b.newContext({ viewport: { width: 390, height: 760 }, recordVideo: { dir: '/tmp/claude-0/vidp', size: { width: 390, height: 760 } } })
await ctx.addInitScript(() => { try { localStorage.setItem('bl_lang', 'pt') } catch {} })
const p = await ctx.newPage()
await p.goto(`http://localhost:${PORTA}/`, { waitUntil: 'domcontentloaded' })
await p.evaluate(`(async()=>{
  const R = await import('/@id/react'); const h = (R.default ?? R).createElement
  const RD = await import('/@id/react-dom/client'); const createRoot = RD.createRoot ?? RD.default?.createRoot
  const G = await import('/src/escalacao/gala-pirituba.tsx')
  document.getElementById('root')?.remove(); document.body.style.background='#F4ECD6'
  const root=document.createElement('div'); document.body.appendChild(root)
  await new Promise(r=>setTimeout(r,700))
  createRoot(root).render(h(G.GalaPirituba,{clube:'Pirituba SF',chave:'v',mostra:'Pirituba SF',grito:'PIRITUBA'}))
})()`)
await p.waitForTimeout(9800)
await ctx.close(); await b.close(); await vite.close()
const f = readdirSync('/tmp/claude-0/vidp').filter(x => x.endsWith('.webm')).map(x => '/tmp/claude-0/vidp/' + x).pop()
renameSync(f, 'scripts/posts/gala-pirituba.webm'); console.log('🎬 scripts/posts/gala-pirituba.webm')
