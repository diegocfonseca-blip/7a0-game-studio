// 📸 CARREIRA ONLINE (27/11): "A TURMA NA CARREIRA" + 🐤 TUITER na Central.   node scripts/foto-co2-turma.mjs [--out pasta]
import { chromium } from 'playwright-core'
import { spawn } from 'node:child_process'
const arg = (n, d = '') => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const OUT = arg('out', 'scripts/mockups'), PORTA = '5265'
const vite = spawn('npx', ['vite', '--port', PORTA], { env: { ...process.env, DEPLOY_BASE: '/' }, stdio: 'ignore', detached: true })
for (let i = 0; i < 60; i++) { try { const r = await fetch(`http://localhost:${PORTA}/`); if (r.ok) break } catch { /* subindo */ } await new Promise(r => setTimeout(r, 500)) }
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const NOMES = ['Neymarzetti', 'Futpoint FC', 'Tricolor do Arruda', 'Guimarães SCI']
const ORDEM = ['u0', 'u1', 'u2', 'u3']
const agora = Date.now()
const clubes = NOMES.map((nome, i) => ({ sala: 's1', assento: i, user_id: ORDEM[i], nome, pronto_rodada: null, na_sala_em: new Date(agora - (i === 2 ? 2 * 86400000 : 60000)).toISOString() }))
const tuites = [
  { id: 3, user_id: 'u3', nome: 'Guimarães SCI', texto: '@futpoint comprou caro e vai sentar no banco 🪑🤣', resp: 1, em: new Date(agora - 60000).toISOString(), reacoes: { '❤️': 15, '🔁': 4 }, minhas: ['❤️'], respostas: 0 },
  { id: 1, user_id: 'u1', nome: 'Futpoint FC', texto: 'Romário chegou pra resolver. @neymarzetti, te vejo na rodada 24 😏', resp: null, em: new Date(agora - 120000).toISOString(), reacoes: { '❤️': 12, '🔁': 5, '🤡': 7 }, minhas: [], respostas: 1 },
]
for (const w of [420, 1280]) {
  const ctx = await b.newContext({ viewport: { width: w, height: 900 }, deviceScaleFactor: 2 })
  await ctx.addInitScript(() => { try { localStorage.setItem('bl_lang', 'pt') } catch {} })
  const p = await ctx.newPage(); p.on('pageerror', e => console.error('💥', e.message))
  const sala = { id: 's1', codigo: 'K7Q2ZP', nome: 'A Pirâmide dos Amigos', dono: 'u0', vice: null, versao: '', temporada: 3, rodada: 24, fase: 'jogo', prazo: null, inicio_rodada: null, auto: false, velocidade: 1, pausado: false, comandante: 'u0' }
  await p.route('**/rest/v1/esc_carr_sala?**', r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(r.request().url().includes('mundo') ? { mundo: { ordem: ORDEM, v: 1, modo: 'livre' } } : sala) }))
  await p.route('**/rest/v1/esc_carr_clube?**', r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(clubes) }))
  await p.route('**/rest/v1/rpc/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: r.request().url().includes('esc_carr_tuites') ? JSON.stringify(tuites) : '"ok"' }))
  await p.goto(`http://localhost:${PORTA}/`, { waitUntil: 'domcontentloaded' })
  await p.evaluate(`(async()=>{
    const R = await import('/@id/react'); const React = R.default ?? R; const h = React.createElement
    const RD = await import('/@id/react-dom/client'); const createRoot = RD.createRoot ?? RD.default?.createRoot
    const S = await import('/src/escalacao/store.tsx')
    const C = await import('/src/escalacao/co2.ts')
    const T = await import('/src/escalacao/co2-turma.tsx')
    document.getElementById('root')?.remove()
    const root=document.createElement('div'); root.style.cssText='background:#F4ECD6;min-height:100vh;padding:14px;max-width:960px;margin:0 auto'; document.body.appendChild(root)
    await C.co2Abrir('s1')
    const t = (name, teamId, pts) => ({ name, teamId, pts, you: false, human: teamId < 4, squad: [], xi: [], w: 0, d: 0, l: 0, gf: 0, ga: 0 })
    const fill = (pre, n, base) => Array.from({ length: n }, (_, i) => t(pre + ' ' + (i + 1), 100 + base + i, 40 - i))
    const A = fill('Bot A', 17, 0); A.splice(2, 0, t('Futpoint FC', 1, 50)); A.splice(0, 0, t('Flamengo', 90, 60)); A.splice(5, 0, t('Neymarzetti', 0, 45))
    const B = fill('Bot B', 19, 30); B.splice(16, 0, t('Tricolor do Arruda', 2, 18))
    const D = fill('Bot D', 19, 60); D.unshift(t('Guimarães SCI', 3, 52))
    const tables = { A, B, C: fill('Bot C', 20, 90), D, V: [] }
    const m = (h, a, hg, ag, hId, aId) => ({ h, a, hg, ag, hId, aId, you: false, hum: true, goals: [] })
    const matches = { A: [m('Futpoint FC', 'Flamengo', 2, 0, 1, 90), m('Bot A 3', 'Neymarzetti', 1, 1, 102, 0)], B: [m('Bot B 2', 'Tricolor do Arruda', 3, 1, 31, 2)], D: [m('Guimarães SCI', 'Bot D 4', 4, 0, 3, 63)] }
    const scorers = [{ name: 'Romário', teamName: 'Futpoint FC', teamId: 1, div: 'A', goals: 14, you: false, human: true }]
    const V = () => { const { state, dispatch } = S.useEsc(); window.__d = dispatch; if (!state.co2) return null
      return h('div', null, h(T.Co2Turma, { tables, matches, scorers, round: 24 }), h(T.Co2Tuiter, { tables, matches, round: 24 })) }
    createRoot(root).render(h(S.EscProvider, null, h(V)))
    await new Promise(r=>setTimeout(r,800))
    window.__d({ type: 'START_CAREER_SOLO', teamName: 'Neymarzetti', formation: '4-3-3', rivals: 3, co2: { sala: 's1', nomes: ${JSON.stringify(NOMES)}, assento: 0 } })
    await new Promise(r=>setTimeout(r,400))
    window.__d({ type: 'CO2_GAVETAS', gavetas: [{ mgrId: 1, nome: 'Futpoint FC', squad: [], entradas: {}, intl: { season: 1, club: 'Boca Juniors', xi: new Array(11).fill({}) } }] })
    await new Promise(r=>setTimeout(r,1200))
    C._bancadaCo2({ uid: 'u0', aqui: ['u0', 'u1', 'u3'] })
    await new Promise(r=>setTimeout(r,1500))
  })()`)
  await p.screenshot({ path: `${OUT}/co2-turma-tuiter-${w}.png`, fullPage: true })
  console.log('📸', `${OUT}/co2-turma-tuiter-${w}.png`)
  await ctx.close()
}
await b.close()
try { process.kill(-vite.pid) } catch { /* já foi */ }
process.exit(0)
