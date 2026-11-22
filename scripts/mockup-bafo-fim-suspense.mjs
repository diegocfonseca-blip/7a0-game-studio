// 📸 prints REAIS (21/11): a faixa da regra em cima do campo (2, 4 e 12 pessoas) e o suspense da carta tomada (pista e carta virada).
// uso: node scripts/mockup-bafo-fim-suspense.mjs → scripts/mockups/bafo-faixa.png, bafo-suspense-{pista,carta}.png
import { chromium } from 'playwright-core'
const PORTA = '5294'
process.env.DEPLOY_BASE = '/'
const { createServer } = await import('vite')
const vite = await createServer({ server: { port: Number(PORTA), strictPort: true, watch: null, hmr: false } })
await vite.listen()
for (let i = 0; i < 60; i++) { try { const r = await fetch(`http://localhost:${PORTA}/`); if (r.ok) break } catch {} await new Promise(r => setTimeout(r, 500)) }
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const linha = { id: 5, dono: 'u0', valendo: true, fase: 'fim', squads: { u0: [], u1: [] }, nomes: { u0: 'Futpoint FC', u1: 'Neymarzetti' }, campeao: 'u0', escolha_ate: null, batida_em: new Date().toISOString(), punicao: null,
  resultado: { de: 'u1', para: 'u0', deNome: 'Neymarzetti', paraNome: 'Futpoint FC', sorteio: false, carta: { id: 'x', name: 'Ronaldo Fenômeno', club: 'Inter', year: 1998, pos: 'ATA', fame: 5 } } }
const ctx = await b.newContext({ viewport: { width: 390, height: 760 }, deviceScaleFactor: 2 })
await ctx.addInitScript(() => { try { localStorage.setItem('bl_lang', 'pt') } catch {} })
const p = await ctx.newPage()
await p.route(/supabase\.co\/rest\/v1\/esc_bafo2/, r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(linha) }))
await p.route(/supabase\.co\/rest\/v1\/rpc\//, r => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
await p.goto(`http://localhost:${PORTA}/`, { waitUntil: 'domcontentloaded' })
const monta = (corpo) => p.evaluate(`(async()=>{
  const R = await import('/@id/react'); const h = (R.default ?? R).createElement
  const RD = await import('/@id/react-dom/client'); const createRoot = RD.createRoot ?? RD.default?.createRoot
  const U = await import('/src/escalacao/bafo2-ui.tsx')
  document.getElementById('root')?.remove(); document.querySelectorAll('.bf-raiz').forEach(e=>e.remove()); document.body.style.background='#0c120e'
  const root=document.createElement('div'); root.className='bf-raiz'; root.style.cssText='padding:12px;max-width:390px;margin:0 auto'; document.body.appendChild(root)
  ${corpo}
})()`)
const T = (n, lider) => JSON.stringify(Array.from({ length: n }, (_, i) => ({ id: i, name: ['Futpoint FC', 'Neymarzetti', 'The Wolf', 'Abobados', 'Robinhos FC', 'Cr7 Leilão', 'Rei da Bola', 'Fabulous EC', 'La Bestia', 'Tocaia FC', 'Papão', 'Skyy FC'][i], pts: Math.max(0, lider - i * 2) })))
await monta(`createRoot(root).render(h('div',null,
  h(U.FaixaBafo,{liga:${T(2, 4)},youId:1,rodada:3,total:5}), h('div',{style:{height:10}}),
  h(U.FaixaBafo,{liga:${T(4, 10)},youId:1,rodada:5,total:12}), h('div',{style:{height:10}}),
  h(U.FaixaBafo,{liga:${T(12, 19)},youId:4,rodada:9,total:22}), h('div',{style:{height:10}}),
  h(U.FaixaBafo,{liga:${T(4, 10)},youId:0,rodada:5,total:12})))`)
await p.waitForTimeout(1200); await p.screenshot({ path: 'scripts/mockups/bafo-faixa.png', fullPage: true })
await p.evaluate(() => sessionStorage.clear())
await monta(`const managers=[{id:0,name:'Futpoint FC',teamName:'Futpoint FC',isHuman:true,squad:[]},{id:1,name:'Neymarzetti',teamName:'Neymarzetti',isHuman:true,squad:[]}]
  createRoot(root).render(h(U.Bafo2Fim,{roomId:'r',souDono:true,meuUid:'u1',campeaoUid:'u0',managers,assentos:['u0','u1'],aoVoltar(){}}))`)
await p.waitForTimeout(1200); await p.screenshot({ path: 'scripts/mockups/bafo-suspense-pacote.png', fullPage: true })
await p.waitForTimeout(5600); await p.screenshot({ path: 'scripts/mockups/bafo-suspense-pista.png', fullPage: true })
await p.waitForTimeout(3200); await p.screenshot({ path: 'scripts/mockups/bafo-suspense-carta.png', fullPage: true })
await p.waitForTimeout(7500); await p.screenshot({ path: 'scripts/mockups/bafo-suspense-depois.png', fullPage: true })
await b.close(); await vite.close(); console.log('📸 ok'); process.exit(0)
