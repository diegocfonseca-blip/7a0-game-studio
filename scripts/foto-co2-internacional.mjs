// 📸 CARREIRA ONLINE (27/11): a fila dos convites da Libertadores/Champions única.   node scripts/foto-co2-internacional.mjs
import { chromium } from 'playwright-core'
import { spawn } from 'node:child_process'
const OUT = 'scripts/mockups', PORTA = '5265'
const vite = spawn('npx', ['vite', '--port', PORTA], { env: { ...process.env, DEPLOY_BASE: '/' }, stdio: 'ignore', detached: true })
for (let i = 0; i < 90; i++) { try { const r = await fetch(`http://localhost:${PORTA}/`); if (r.ok) break } catch { /* subindo */ } await new Promise(r => setTimeout(r, 500)) }
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
for (const [nome, w, dono, mural] of [['co2-intl-fila', 420, true, false], ['co2-intl-fila-pc', 1280, true, false], ['co2-intl-mural', 420, false, true], ['co2-intl-mural-pc', 1280, false, true]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: 760 }, deviceScaleFactor: 2 })
  await ctx.addInitScript(() => { try { localStorage.setItem('bl_lang', 'pt') } catch {} })
  const p = await ctx.newPage(); p.on('pageerror', e => console.error('💥', e.message))
  await p.goto(`http://localhost:${PORTA}/`, { waitUntil: 'domcontentloaded' })
  await p.evaluate(`(async()=>{
    const R = await import('/@id/react'); const React = R.default ?? R; const h = React.createElement
    const RD = await import('/@id/react-dom/client'); const createRoot = RD.createRoot ?? RD.default?.createRoot
    const S = await import('/src/escalacao/store.tsx')
    const V = await import('/src/escalacao/career-international-view.tsx')
    document.getElementById('root')?.remove()
    const root=document.createElement('div'); root.style.cssText='background:#F4ECD6;min-height:100vh;padding:14px;max-width:760px;margin:0 auto'; document.body.appendChild(root)
    const K = await import('/src/escalacao/career-international.ts')
    const mural = ${mural}
    const co2 = { fila: [{ mgrId: 2, priority: 1, name: 'Tricolor do Arruda', estado: 'Boca Juniors' }, { mgrId: 1, priority: 2, name: 'Futpoint FC', estado: 'vez' }, { mgrId: 0, priority: 5, name: 'Neymarzetti', estado: mural ? 'vez' : 'espera' }],
      vez: mural ? 0 : 1, meuId: 0, comanda: ${dono}, qualificado: true, pulado: false, tomados: ['Boca Juniors'], amigos: null, onEscolha(){}, onPular(){} }
    createRoot(root).render(h(S.EscProvider, null, h(V.CareerInternationalView, { season: 3, seed: 1, userTeam: 'Neymarzetti', userId: 0, squad: [], choices: mural ? K.INTERNATIONAL_CLUBS.filter(c => c.name !== 'Boca Juniors') : [], priority: 5, campaign: null, history: [], onStart(){}, onAdvance(){}, onFinish(){}, co2 })))
    await new Promise(r=>setTimeout(r,1500))
  })()`.replaceAll('${mural}', String(mural)).replaceAll('${dono}', String(dono)))
  await p.screenshot({ path: `${OUT}/${nome}.png`, fullPage: true })
  console.log('📸', `${OUT}/${nome}.png`)
  await ctx.close()
}
await b.close()
try { process.kill(-vite.pid) } catch {}
