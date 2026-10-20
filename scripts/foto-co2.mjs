// 📸 CARREIRA ONLINE v2 (19/10): a sala de espera (dono e convidado) e a barra do PRONTO, com o banco fingido.
//   node scripts/foto-co2.mjs [--out pasta]
import { chromium } from 'playwright-core'
import { spawn } from 'node:child_process'
const arg = (n, d = '') => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const OUT = arg('out', 'scripts/mockups'), PORTA = '5263'
const vite = spawn('npx', ['vite', '--port', PORTA], { env: { ...process.env, DEPLOY_BASE: '/' }, stdio: 'ignore', detached: true })
for (let i = 0; i < 60; i++) { try { const r = await fetch(`http://localhost:${PORTA}/`); if (r.ok) break } catch { /* subindo */ } await new Promise(r => setTimeout(r, 500)) }
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const DONO = 'u-dono', AMIGO = 'u-amigo'
const clubes = [
  { sala: 's1', assento: 0, user_id: DONO, nome: 'Neymarzetti', pronto_rodada: 15, na_sala_em: null },
  { sala: 's1', assento: 1, user_id: AMIGO, nome: 'Futpoint FC', pronto_rodada: 14, na_sala_em: null },
  { sala: 's1', assento: 2, user_id: 'u3', nome: 'Tricolor do Arruda', pronto_rodada: 15, na_sala_em: null },
  { sala: 's1', assento: 3, user_id: 'u4', nome: 'Low profile F.C', pronto_rodada: 14, na_sala_em: null },
]
const casos = [
  { nome: 'espera-dono', fase: 'espera', temporada: 3, rodada: 14, eu: DONO, tela: 'espera' },
  { nome: 'espera-convidado', fase: 'espera', temporada: 0, rodada: 0, eu: AMIGO, tela: 'espera' },
  { nome: 'pronto-dono', fase: 'preparo', temporada: 3, rodada: 14, eu: DONO, tela: 'pronto' },
]
for (const c of casos) {
  const ctx = await b.newContext({ viewport: { width: 420, height: 900 }, deviceScaleFactor: 2 })
  await ctx.addInitScript(() => { try { localStorage.setItem('bl_lang', 'pt') } catch {} })
  const p = await ctx.newPage(); p.on('pageerror', e => console.error('💥', e.message))
  const sala = { id: 's1', codigo: 'K7Q2ZP', nome: 'A Pirâmide dos Amigos', dono: DONO, vice: null, versao: '', temporada: c.temporada, rodada: c.rodada, fase: c.fase, prazo: new Date(Date.now() + 42000).toISOString(), inicio_rodada: null, auto: true, velocidade: 1, pausado: false, comandante: c.tela === 'pronto' ? DONO : null }
  await p.route('**/rest/v1/esc_carr_sala?**', r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(r.request().url().includes('mundo') ? { m: null, v: null } : sala) }))
  await p.route('**/rest/v1/esc_carr_clube?**', r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(clubes) }))
  await p.route('**/rest/v1/rpc/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
  await p.goto(`http://localhost:${PORTA}/`, { waitUntil: 'domcontentloaded' })
  await p.evaluate(`(async()=>{
    const R = await import('/@id/react'); const React = R.default ?? R; const h = React.createElement
    const RD = await import('/@id/react-dom/client'); const createRoot = RD.createRoot ?? RD.default?.createRoot
    const S = await import('/src/escalacao/store.tsx')
    const C = await import('/src/escalacao/co2.ts')
    const T = await import('/src/escalacao/co2-telas.tsx')
    document.getElementById('root')?.remove()
    const root=document.createElement('div'); root.style.cssText='padding:14px;background:#F4ECD6;min-height:100vh'; document.body.appendChild(root)
    if (${JSON.stringify(c.tela)} === 'espera') {
      createRoot(root).render(h(S.EscProvider, null, h(T.Co2Espera, { salaId: 's1', onSair(){} })))
    } else {
      await C.co2Abrir('s1')
      const Pronto = () => { const { state, dispatch } = S.useEsc(); React.useEffect(() => { dispatch({ type: 'SYNC_STATE', newState: { ...state, co2: { sala: 's1', assento: 0, gavetas: [], comanda: true } } }) }, []); return h(T.Co2Temporada, { entradasLocais: { tactics:{}, lineups:{}, halftime:{}, penalty:{}, mods:{}, cardMods:{} }, round: 14, roundReady: true, seasonOver: false, onEscalacao(){}, onTatica(){} }) }
      createRoot(root).render(h(S.EscProvider, null, h(Pronto)))
    }
    await new Promise(r=>setTimeout(r,1200))
    C._bancadaCo2({ uid: ${JSON.stringify(c.eu)}, aqui: [${JSON.stringify(DONO)}, ${JSON.stringify(AMIGO)}, 'u3'] })
    await new Promise(r=>setTimeout(r,600))
  })()`)
  await p.screenshot({ path: `${OUT}/co2-${c.nome}.png`, fullPage: true })
  console.log('📸', `${OUT}/co2-${c.nome}.png`)
  await ctx.close()
}
await b.close()
try { process.kill(-vite.pid) } catch {}
