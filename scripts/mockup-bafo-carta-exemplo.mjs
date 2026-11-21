// Mockup (21/11): no começo da convocação do Bafo, o pacote abre e mostra uma carta de EXEMPLO (a de verdade do jogo) com a
// explicação de onde vêm as cartas. uso: node scripts/mockup-bafo-carta-exemplo.mjs → scripts/mockups/bafo-carta-exemplo-{cel,pc}.png
import { chromium } from 'playwright-core'
const PORTA = '5292'
process.env.DEPLOY_BASE = '/'
const { createServer } = await import('vite')
const vite = await createServer({ server: { port: Number(PORTA), strictPort: true, watch: null, hmr: false } })
await vite.listen()
for (let i = 0; i < 60; i++) { try { const r = await fetch(`http://localhost:${PORTA}/`); if (r.ok) break } catch {} await new Promise(r => setTimeout(r, 500)) }
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
for (const [nome, w] of [['cel', 390], ['pc', 900]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: 640 }, deviceScaleFactor: 2 })
  await ctx.addInitScript(() => { try { localStorage.setItem('bl_lang', 'pt') } catch {} })
  const p = await ctx.newPage()
  await p.goto(`http://localhost:${PORTA}/`, { waitUntil: 'domcontentloaded' })
  for (const [fase, dec] of [['pacote', 800], ['carta', 4000]]) {
  await p.evaluate(`(async()=>{
    const R = await import('/@id/react'); const h = (R.default ?? R).createElement
    const RD = await import('/@id/react-dom/client'); const createRoot = RD.createRoot ?? RD.default?.createRoot
    const U = await import('/src/escalacao/bafo2-ui.tsx')
    document.getElementById('root')?.remove(); document.querySelectorAll('.bf-raiz').forEach(e=>e.remove()); document.body.style.background='#0d1410'
    const root=document.createElement('div'); root.className='bf-raiz'; root.style.cssText='padding:12px;max-width:${nome === 'pc' ? 720 : 390}px;margin:0 auto'; document.body.appendChild(root)
    const col=['GOL','LAT','ZAG','MEI','ATA'].flatMap((p,i)=>['Taffarel','Cafu','Aldair','Zico','Romário','Marcos','Maicon','Lúcio','Kaká','Bebeto'].filter((_,k)=>k%5===i).map((n,k)=>({id:p+k,name:n,club:'Flamengo',year:1990+k,pos:p,fame:3,lo:70,hi:80})))
    createRoot(root).render('${fase}'==='pacote' ? h(U.AberturaBafo,{decorrido:${dec},onPular(){}}) : h('div',null,h(U.ExemploBafo),h(U.ConvocacaoBafo,{telaCheia:true,colecao:col,marcadas:[col[0].id,col[2].id],onMarcar(){},seg:160,pronto:false,onPronto(){}})))
  })()`)
  await p.waitForTimeout(2500)
  await p.screenshot({ path: `scripts/mockups/bafo-abertura-${fase}-${nome}.png`, fullPage: true })
  }
  await ctx.close()
}
await b.close(); await vite.close(); console.log('📸 ok'); process.exit(0)
