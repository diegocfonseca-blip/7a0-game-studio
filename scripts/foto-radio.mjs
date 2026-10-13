// 📸 foto do placar REAL com a Rádio Legends (13/10): node scripts/foto-radio.mjs
import { chromium } from 'playwright-core'
import { spawn } from 'node:child_process'
const PORTA='5255'
const vite = spawn('npx', ['vite', '--port', PORTA], { cwd: '/home/user/7a0-game-studio', env: { ...process.env, DEPLOY_BASE: '/' }, stdio: 'ignore', detached: true })
for (let i=0;i<40;i++){ try{ const r=await fetch(`http://localhost:${PORTA}/`); if(r.ok)break }catch{} await new Promise(r=>setTimeout(r,500)) }
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const ctx = await b.newContext({ viewport: { width: 420, height: 700 }, deviceScaleFactor: 2 })
await ctx.addInitScript(() => { try { localStorage.setItem('bl_lang', 'pt') } catch {} })
const p = await ctx.newPage(); p.on('pageerror', e => console.error('💥', e.message))
await p.goto(`http://localhost:${PORTA}/`, { waitUntil: 'domcontentloaded' })
await p.evaluate(`(async()=>{
  const R = await import('/@id/react'); const React = R.default ?? R; const h = React.createElement
  const RD = await import('/@id/react-dom/client'); const createRoot = RD.createRoot ?? RD.default?.createRoot
  const P = await import('/src/escalacao/pyramidseason.tsx')
  document.getElementById('root')?.remove(); document.body.style.cssText='margin:0;background:#F4ECD6;padding:12px'
  const root=document.createElement('div'); document.body.appendChild(root)
  createRoot(root).render(h(P.LiveScoreCard,{homeName:'K9 FC',awayName:'Fabulous EC',homeColor:'#1B3A6B',awayColor:'#C2452F',youIsHome:true,goals:[{name:'Romário',min:23,home:true},{name:'Cristiano Ronaldo',min:44,home:false}],roundKey:7,roundMs:16000,enhancedOnline:true,enhancedCareer:true,homeOwner:'Kelvin',awayOwner:'Fabulous',displayMinute:62}))
  await new Promise(r=>setTimeout(r,9000))
})()`)
await p.screenshot({ path: 'scripts/mockups/radio-real.png', fullPage: true })
await b.close(); try { process.kill(-vite.pid) } catch {}
