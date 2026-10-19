// 📸 MOCKUP (19/10): tema da Tidex na sala de espera (Wen Milan B / vittor@tidex). node scripts/mockup-tema-tidex.mjs
import { chromium } from 'playwright-core'
import { spawn } from 'node:child_process'
const PORTA = '5267'
const vite = spawn('npx', ['vite', '--port', PORTA], { env: { ...process.env, DEPLOY_BASE: '/' }, stdio: 'ignore', detached: true })
for (let i = 0; i < 60; i++) { try { const r = await fetch(`http://localhost:${PORTA}/`); if (r.ok) break } catch {} await new Promise(r => setTimeout(r, 500)) }
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
for (const [nome, vp] of [['cel', { width: 430, height: 900 }], ['desk', { width: 1280, height: 800 }]]) {
  const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: nome === 'cel' ? 2 : 1 })
  await ctx.addInitScript(() => { try { localStorage.setItem('bl_lang', 'pt') } catch {} })
  const p = await ctx.newPage()
  p.on('pageerror', e => console.log('💥', e.message))
  await p.goto(`http://localhost:${PORTA}/`, { waitUntil: 'domcontentloaded' })
  await p.evaluate(`(async()=>{
    localStorage.setItem('bl_lang','pt')
    const R = await import('/@id/react'); const h = (R.default ?? R).createElement
    const RD = await import('/@id/react-dom/client'); const createRoot = RD.createRoot ?? RD.default?.createRoot
    const T = await import('/src/escalacao/temas-sala.tsx'); await import('/src/escalacao/temas-sala.css')
    const tema = T.temaValido('tidex')
    document.getElementById('root')?.remove()
    const root = document.createElement('div'); document.body.style.margin='0'; document.body.appendChild(root)
    const card = h('div',{style:{position:'relative',zIndex:2,maxWidth:420,margin:'0 auto',background:'#F4ECD6',border:'4px solid #0C0C0C',borderRadius:18,boxShadow:'5px 5px 0 #000',padding:16,fontFamily:'system-ui',color:'#0C0C0C'}},
      h('p',{style:{font:'900 22px Oswald',margin:0}},'SALA DO WEN MILAN B'),
      h('p',{style:{fontWeight:700,fontSize:13,color:'#5a5240',margin:'4px 0 12px'}},'Código QX7T2A · 6 de 8 técnicos · Liga + Copa'),
      ...['😈 Wen Milan B 👑🖋️','📍 Futpoint FC','🐍 Tricolor do Arruda','Cativeiro fc','Low profile F.C','LendiasFC'].map(n=>h('div',{key:n,style:{background:'#fff',border:'2px solid #0C0C0C',borderRadius:10,padding:'7px 10px',marginBottom:6,fontWeight:800,fontSize:14}},n)),
      h('div',{style:{marginTop:12,textAlign:'center',font:'900 20px Oswald',padding:'12px 0',border:'4px solid #0C0C0C',borderRadius:14,boxShadow:'4px 4px 0 #000',background:tema.botao,color:tema.botaoTxt}},'🔨 ABRIR O PREGÃO'))
    createRoot(root).render(h('div',{className:'tela-cheia tema-sala tema-tidex',style:{position:'relative',minHeight:'100vh',backgroundColor:'#0C0C0C',padding:'60px 16px 260px',overflow:'hidden'}}, h(T.TemaFundo,{tema}), card))
    await new Promise(r=>setTimeout(r,1500))
  })()`)
  await p.screenshot({ path: `scripts/mockups/tema-tidex-${nome}.png` })
  await ctx.close(); console.log('📸', nome)
}
await b.close(); try { process.kill(-vite.pid) } catch {}
