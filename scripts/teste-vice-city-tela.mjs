// 🌴 19/11: fotografa a tela do Vice City (celular e computador) montando a partida no motor de verdade. uso: SAIDA=<pasta> node scripts/teste-vice-city-tela.mjs
// 🆕 21/11: GOLPE=<id> usa outra carta (ex.: contrabando, paraquedas) e ESPERA=<ms> tira a foto no meio da cena
const GOLPE = process.env.GOLPE || 'blitz', ESPERA = Number(process.env.ESPERA || 4000)
import { chromium } from 'playwright-core'
const PORTA = 5291
process.env.DEPLOY_BASE = '/'
const { createServer } = await import('vite')
const vite = await createServer({ server: { port: PORTA, strictPort: true, watch: null, hmr: false } })
await vite.listen()
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
for (const [w, h, nome] of [[390, 1600, 'cel'], [1280, 1100, 'pc']]) {
  const p = await b.newPage({ viewport: { width: w, height: h } })
  await p.addInitScript(() => { try { localStorage.setItem('bl_lang', 'pt') } catch {} })
  p.on('pageerror', e => console.log('PAGEERR', e.message)); p.on('console', m => { if (m.type()==='error') console.log('CONSOLE', m.text().slice(0,300)) })
  await p.goto(`http://localhost:${PORTA}/`, { waitUntil: 'domcontentloaded' })
  await p.waitForTimeout(2500)
  await p.evaluate(`window.__GOLPE=${JSON.stringify(GOLPE)}`)
  await p.evaluate(`(async()=>{
    const txt = await (await fetch('/src/escalacao/vice-city-ui.tsx')).text()
    const txt2 = await (await fetch('/src/main.tsx')).text()
    const pega = (t, k) => { const i = t.indexOf(k); const j = t.indexOf(String.fromCharCode(34), i); const j2 = t.indexOf(String.fromCharCode(39), i); const fim = [j, j2].filter(x => x > 0).sort((a,b)=>a-b)[0]; return t.slice(i, fim) }
    const rPath = pega(txt, '/node_modules/.vite/deps/react.js')
    const rdPath = pega(txt2, '/node_modules/.vite/deps/react-dom_client.js')
    const R = await import(rPath); const React = R.default ?? R; const h = React.createElement
    const RD = await import(rdPath); const createRoot = RD.createRoot ?? RD.default?.createRoot
    const St = await import('/src/escalacao/store.tsx')
    const PA = await import('/src/escalacao/pregao-aberto.tsx')
    document.getElementById('root')?.remove()
    const root=document.createElement('div'); root.id='root'; document.body.appendChild(root)
    function Harness(){ const { state, dispatch } = St.useEsc(); const [ok,setOk]=React.useState(0)
      React.useEffect(()=>{ if(ok===0){ dispatch({type:'NEW_GAME'}); setOk(1) } else if(ok===1){ dispatch({ type:'START', teamName:'Futpoint FC', formation:'4-3-3', rivals:9, career:false, league:'both', copaMode:'liga', intro:true, pregaoAberto:true, vice:true }); setOk(2) } else if(ok===2){ dispatch({type:'START_STREAM_AUCTION'}); setOk(3) } else if (ok===3 && state.pa?.vice) {
          const me = state.managers[state.youIdx]; const alvo = state.managers.find(m=>!m.isHuman)
          state.pa.vice.mao[me.id] = ['roubo', window.__GOLPE, 'pneu', 'loja']; setOk(4) } else if (ok===4) { setTimeout(()=>setOk(5), 3000) } else if (ok===5) {
          const me = state.managers[state.youIdx]; const alvo = state.managers.find(m=>!m.isHuman)
          dispatch({ type:'VICE_USAR', mgrId: me.id, golpe: window.__GOLPE, alvo: alvo.id }); setOk(6) } },[ok, state])
      return ok>=3 ? h(PA.PregaoAberto) : h('div',null,'...') }
    createRoot(root).render(h(St.EscProvider, null, h(Harness)))
  })()`)
  await p.waitForTimeout(3000 + ESPERA)
  await p.screenshot({ path: `${process.env.SAIDA}/vice-${GOLPE}-${nome}.png`, fullPage: false })
  await p.close()
}
await b.close(); await vite.close()
console.log('ok')
