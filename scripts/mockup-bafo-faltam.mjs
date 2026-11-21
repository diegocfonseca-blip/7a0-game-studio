// 📸 print REAL (21/11): o banner "faltam cartas pra você jogar o Bafo" (quem tem menos de 11 ou não fecha um time).
// uso: node scripts/mockup-bafo-faltam.mjs → scripts/mockups/bafo-faltam-{cel,pc}.png
import { chromium } from 'playwright-core'
const PORTA = '5297'
process.env.DEPLOY_BASE = '/'
const { createServer } = await import('vite')
const vite = await createServer({ server: { port: Number(PORTA), strictPort: true, watch: null, hmr: false } })
await vite.listen()
for (let i = 0; i < 60; i++) { try { const r = await fetch(`http://localhost:${PORTA}/`); if (r.ok) break } catch {} await new Promise(r => setTimeout(r, 500)) }
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const linhas = [['Taffarel', 'Internacional', 1989, 'GOL', 5], ['Zico', 'Flamengo', 1981, 'MEI', 5], ['Romário', 'Vasco', 2000, 'ATA', 5], ['Pelé', 'Santos', 1962, 'ATA', 5]]
  .map(([n, c, y, p, f], i) => ({ id: 'c' + i, card_name: n, card_club: c, card_year: y, card_pos: p, card_fame: f }))
for (const [nome, w] of [['cel', 390], ['pc', 900]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: 420 }, deviceScaleFactor: 2 })
  await ctx.addInitScript(() => { try { localStorage.setItem('bl_lang', 'pt') } catch {} })
  const p = await ctx.newPage()
  await p.route(/supabase\.co\/rest\/v1\/user_cards/, r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(linhas) }))
  await p.goto(`http://localhost:${PORTA}/`, { waitUntil: 'domcontentloaded' })
  await p.evaluate(`(async()=>{
    const R = await import('/@id/react'); const h = (R.default ?? R).createElement
    const RD = await import('/@id/react-dom/client'); const createRoot = RD.createRoot ?? RD.default?.createRoot
    const U = await import('/src/escalacao/bafo2-ui.tsx')
    document.getElementById('root')?.remove(); document.body.style.background='#0d1410'
    const root=document.createElement('div'); root.style.cssText='padding:12px;max-width:${nome === 'pc' ? 720 : 390}px;margin:0 auto'; document.body.appendChild(root)
    createRoot(root).render(h('div',null,h(U.FaltamCartasBafo,{uid:'u1'}),h(U.FaltamCartasBafo,{uid:'u1',semPacote:true})))
  })()`)
  await p.waitForTimeout(3000)
  await p.screenshot({ path: `scripts/mockups/bafo-faltam-${nome}.png`, fullPage: true })
  await ctx.close()
}
await b.close(); await vite.close(); console.log('📸 ok'); process.exit(0)
