import { chromium } from 'playwright-core'
import { spawn } from 'node:child_process'
const PORTA = '5311', D = '/tmp/claude-0/-home-user-7a0-game-studio/15782737-58e2-54d9-971e-653cb64061f2/scratchpad/mk/'
const vite = spawn('npx', ['vite', '--port', PORTA], { cwd: '/home/user/7a0-game-studio', env: { ...process.env, DEPLOY_BASE: '/' }, stdio: 'ignore', detached: true })
for (let i = 0; i < 60; i++) { try { if ((await fetch(`http://localhost:${PORTA}/`)).ok) break } catch {} await new Promise(r => setTimeout(r, 500)) }
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const cenarios = [
  { nome: 'real-1-grupos-manual', manual: true, reveal: 3, rep: 'Flamengo', espera: [1500, 19000] },
  { nome: 'real-2-grupos-auto', manual: false, reveal: 3, rep: 'Flamengo', espera: [1500] },
  { nome: 'real-3-finais', manual: true, reveal: 12, rep: 'Flamengo', final: true, espera: [19000] },
  { nome: 'real-4-mundial', manual: true, reveal: 13, rep: 'Flamengo', campeao: true, espera: [19000] },
  { nome: 'real-5-sem-vaga', manual: true, reveal: 0, rep: null, semVaga: true, espera: [1200] },
  { nome: 'real-6-assistindo', manual: true, reveal: 3, rep: null, modo: 'libertadores', espera: [1200] },
  { nome: 'real-7-champions-trancada', manual: true, reveal: 0, rep: null, passo1: true, espera: [1200] },
]
for (const c of cenarios) {
  const p = await b.newPage({ viewport: { width: 400, height: 900 }, deviceScaleFactor: 2 }); p.on('pageerror', e => console.log('ERRO', c.nome, e.message))
  await p.goto(`http://localhost:${PORTA}/`, { waitUntil: 'domcontentloaded' })
  await p.evaluate(({ manual, modo }) => { localStorage.clear(); localStorage.setItem('bl_lang', 'pt'); localStorage.setItem('esc-sim-manual', manual ? '1' : '0'); if (modo) localStorage.setItem('esc-intl-modo-v1', JSON.stringify({ season: 40, modo })) }, c)
  await p.reload({ waitUntil: 'domcontentloaded' })
  await p.waitForTimeout(1500)
  await p.evaluate(async (c) => {
    const R = await import('/node_modules/.vite/deps/react.js'); const React = R.default ?? R
    const RD = await import('/node_modules/.vite/deps/react-dom_client.js'); const createRoot = RD.createRoot ?? RD.default.createRoot
    const { EscProvider } = await import('/src/escalacao/store.tsx')
    const { CareerInternationalView } = await import('/src/escalacao/career-international-view.tsx')
    const { INTERNATIONAL_CLUBS, internationalClubCards } = await import('/src/escalacao/career-international.ts')
    const { makeInternationalCampaign } = await import('/src/escalacao/career-international-season.ts')
    const need = { GOL: 1, LAT: 2, ZAG: 2, MEI: 3, ATA: 3 }
    const pool = internationalClubCards('Flamengo')
    const xi = Object.entries(need).flatMap(([pos, n]) => pool.filter(x => x.pos === pos).slice(0, n))
    let campaign = null
    if (!c.semVaga && !c.passo1) {
      for (let seed = 1; seed < 400; seed++) {
        const cp = makeInternationalCampaign({ season: 40, seed, representedClub: c.rep, userTeam: 'Neymarzetti', userId: 0, priority: c.rep ? 1 : null, userXI: c.rep ? xi : [] })
        const naFinal = cp.steps[12]?.libertadores?.ties?.some(t => t.home === 'Flamengo' || t.away === 'Flamengo')
        if (c.campeao ? cp.libertadoresChampion === 'Flamengo' : c.final ? naFinal : true) { campaign = cp; break }
      }
      campaign.reveal = c.reveal
    }
    const host = document.createElement('div'); host.style.padding = '12px'; document.body.innerHTML = ''; document.body.appendChild(host); document.body.style.background = '#F4ECD6'
    const props = { season: 40, seed: 7, userTeam: 'Neymarzetti', userId: 0, squad: [], choices: c.semVaga ? [] : INTERNATIONAL_CLUBS, priority: c.semVaga ? null : 1, campaign, history: [], onStart: cp => console.log('start', cp.representedClub), onAdvance: () => console.log('advance'), onFinish: () => console.log('finish') }
    createRoot(host).render(React.createElement(EscProvider, null, React.createElement(CareerInternationalView, props)))
  }, c)
  let t0 = 0
  for (const [i, ms] of c.espera.entries()) { await p.waitForTimeout(ms - t0); t0 = ms; await p.screenshot({ path: `${D}${c.nome}${c.espera.length > 1 ? '-' + (i + 1) : ''}.png`, fullPage: true }); console.log(c.nome, i + 1) }
  await p.close()
}
await b.close(); try { process.kill(-vite.pid) } catch {}
