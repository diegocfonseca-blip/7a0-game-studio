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
  await p.evaluate(`(async()=>{
    const R = await import('/@id/react'); const h = (R.default ?? R).createElement
    const RD = await import('/@id/react-dom/client'); const createRoot = RD.createRoot ?? RD.default?.createRoot
    const S = await import('/src/escalacao/screens.tsx')
    const pack = (await import('/src/escalacao/img/online-pacote-v20.webp')).default
    document.getElementById('root')?.remove(); document.body.style.background='#0d1410'
    const root=document.createElement('div'); root.style.cssText='padding:12px;max-width:${nome === 'pc' ? 720 : 390}px;margin:0 auto;font-family:Inter,system-ui,sans-serif'; document.body.appendChild(root)
    const OSW={fontFamily:'Oswald, sans-serif',textTransform:'uppercase'}
    const pc=${nome === 'pc'}
    createRoot(root).render(h('div',null,
      h('p',{style:{...OSW,fontWeight:900,fontSize:19,color:'#FFC400',margin:'2px 2px 8px'}},'🃏 Bafo · convocação'),
      h('div',{style:{border:'4px solid #0C0C0C',borderRadius:22,background:'radial-gradient(circle at 50% 35%,#12301f,#0c0c0c 75%)',boxShadow:'4px 4px 0 #000',padding:pc?'22px 26px':'16px 14px',display:'flex',flexDirection:pc?'row':'column',alignItems:'center',gap:pc?26:12}},
        h('div',{style:{position:'relative',flex:'none',width:230,paddingTop:6}},
          h('div',{style:{position:'relative',margin:'0 auto',width:190,filter:'drop-shadow(0 0 26px #FFC400)',transform:'rotate(3deg)'}}, h(S.CollectibleCard,{name:'Ronaldo Fenômeno',club:'Inter',year:1998,pos:'ATA',fame:5,big:true}))),
        h('div',{style:{color:'#F4ECD6',textAlign:pc?'left':'center'}},
          h('p',{style:{...OSW,fontWeight:900,fontSize:pc?26:22,color:'#fff',margin:0,lineHeight:1.1}},'Estas são as suas cartinhas de campeão'),
          h('p',{style:{fontSize:14,fontWeight:600,lineHeight:1.4,margin:'8px 0 0'}},'Toda vez que você é ',h('b',{style:{color:'#FFC400'}},'campeão'),' de qualquer campeonato, na ',h('b',{style:{color:'#fff'}},'Carreira'),' ou nas ',h('b',{style:{color:'#fff'}},'salas online'),', você abre um pacote e ganha uma carta.'),
          h('p',{style:{fontSize:14,fontWeight:600,lineHeight:1.4,margin:'6px 0 0'}},'No Bafo você põe ',h('b',{style:{color:'#fff'}},'22 delas em jogo'),'. O campeão toma 1 de alguém.'),
          h('p',{style:{fontSize:11.5,fontWeight:700,color:'#9fb5a6',margin:'10px 0 0'}},'(carta de exemplo · as suas aparecem em seguida)'))),
      h('p',{style:{textAlign:'center',color:'#cfc8b4',fontSize:12.5,fontWeight:700,margin:'10px 0 0'}},'⏱️ some sozinho em 5 s, ou toque pra pular · o relógio da convocação só conta depois')
    ))
  })()`)
  await p.waitForTimeout(2500)
  await p.screenshot({ path: `scripts/mockups/bafo-carta-exemplo-${nome}.png`, fullPage: true })
  await ctx.close()
}
await b.close(); await vite.close(); console.log('📸 ok'); process.exit(0)
