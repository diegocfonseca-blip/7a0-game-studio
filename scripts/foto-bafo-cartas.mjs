// 📸 Cartas REAIS do jogo (com o avatar) recortadas em PNG transparente, pro stories e pro reels do Bafo (21/11).
// uso: node scripts/foto-bafo-cartas.mjs → scripts/posts/img/bafo-<nome>.png + bafo-pacote.png
import { chromium } from 'playwright-core'
import { mkdirSync, copyFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
const PORTA = '5296'
process.env.DEPLOY_BASE = '/'
const { createServer } = await import('vite')
const vite = await createServer({ server: { port: Number(PORTA), strictPort: true, watch: null, hmr: false } })
await vite.listen()
for (let i = 0; i < 60; i++) { try { const r = await fetch(`http://localhost:${PORTA}/`); if (r.ok) break } catch {} await new Promise(r => setTimeout(r, 500)) }
mkdirSync('scripts/posts/img', { recursive: true })
const CARTAS = [
  ['ronaldo', { name: 'Ronaldo Fenômeno', nomeNaCarta: 'Ronaldo', club: 'Inter', year: 1998, pos: 'ATA', fame: 5 }],
  ['zico', { name: 'Zico', club: 'Flamengo', year: 1981, pos: 'MEI', fame: 5 }],
  ['pele', { name: 'Pelé', club: 'Santos', year: 1962, pos: 'ATA', fame: 5 }],
  ['romario', { name: 'Romário', club: 'Vasco', year: 2000, pos: 'ATA', fame: 5 }],
  ['taffarel', { name: 'Taffarel', club: 'Internacional', year: 1989, pos: 'GOL', fame: 5 }],
  ['cafu', { name: 'Cafu', club: 'Milan', year: 2004, pos: 'LAT', fame: 5 }],
]
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const ctx = await b.newContext({ viewport: { width: 900, height: 900 }, deviceScaleFactor: 3 })
await ctx.addInitScript(() => { try { localStorage.setItem('bl_lang', 'pt') } catch {} })
const p = await ctx.newPage()
await p.goto(`http://localhost:${PORTA}/`, { waitUntil: 'domcontentloaded' })
for (const [nome, props] of CARTAS) {
  await p.evaluate(`(async()=>{
    const R = await import('/@id/react'); const h = (R.default ?? R).createElement
    const RD = await import('/@id/react-dom/client'); const createRoot = RD.createRoot ?? RD.default?.createRoot
    const S = await import('/src/escalacao/screens.tsx')
    document.getElementById('root')?.remove(); document.querySelectorAll('.bf-raiz').forEach(e=>e.remove())
    document.documentElement.style.background='transparent'; document.body.style.background='transparent'
    const root=document.createElement('div'); root.className='bf-raiz'; root.style.cssText='padding:30px;display:inline-block'; document.body.appendChild(root)
    createRoot(root).render(h('div',{id:'alvo',className:'ll-lote1-reveal-card',style:{width:220,margin:0}},h(S.CollectibleCard,${JSON.stringify(props)})))
  })()`)
  await p.waitForTimeout(2200)
  await p.locator('.bf-raiz').screenshot({ path: `scripts/posts/img/bafo-${nome}.png`, omitBackground: true })
  console.log('📸', nome)
}
await b.close(); await vite.close()
execFileSync('ffmpeg', ['-y', '-i', 'src/escalacao/img/online-pacote-v20.webp', 'scripts/posts/img/bafo-pacote.png'], { stdio: 'ignore' })
console.log('📸 ok'); process.exit(0)
