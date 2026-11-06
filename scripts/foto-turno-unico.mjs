// 📸 TURNO ÚNICO (06/11): fotos REAIS da tela de criar sala (Rápido · Liga da Turma · Liga Draft) com a opção
// "📅 Rodadas da liga", e a temporada parada na "Rodada 19/19". Banco fingido, conta do Diego (sessão fake só pra foto).
//   node scripts/foto-turno-unico.mjs [--out scripts/mockups]
import { chromium } from 'playwright-core'
import { spawn } from 'node:child_process'
const arg = (n, d = '') => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const OUT = arg('out', 'scripts/mockups'), PORTA = '5277'
const vite = spawn('npx', ['vite', '--port', PORTA, '--strictPort'], { env: { ...process.env, DEPLOY_BASE: '/' }, stdio: 'ignore', detached: true })
for (let i = 0; i < 90; i++) { try { const r = await fetch(`http://localhost:${PORTA}/`); if (r.ok) break } catch { /* subindo */ } await new Promise(r => setTimeout(r, 500)) }
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const UID = '00000000-0000-4000-8000-000000000001'
const user = { id: UID, aud: 'authenticated', role: 'authenticated', email: 'diego.c.fonseca@gmail.com', user_metadata: { display_name: 'Leilão Legends FC' }, app_metadata: {}, created_at: '2026-01-01T00:00:00Z' }
const sessao = { access_token: 'x.eyJzdWIiOiIxIn0.x', token_type: 'bearer', expires_in: 3600 * 24 * 365, expires_at: Math.floor(Date.now() / 1000) + 3600 * 24 * 365, refresh_token: 'r', user }

async function pagina() {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, reducedMotion: 'reduce' })
  await ctx.addInitScript(([s]) => { try { localStorage.setItem('bl_lang', 'pt'); localStorage.setItem('sb-faabglpjutwursgmrpny-auth-token', s) } catch {} }, [JSON.stringify(sessao)])
  const p = await ctx.newPage(); p.on('pageerror', e => console.error('💥', e.message, e.stack?.split('\n').slice(0,4).join(' / ')))
  await p.route('**/rest/v1/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: r.request().headers()['accept']?.includes('vnd.pgrst.object') ? 'null' : '[]' }))
  await p.route('**/rest/v1/rpc/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
  await p.route('**/auth/v1/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(user) }))
  await p.route('**/rest/v1/user_colors**', r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(r.request().headers()['accept']?.includes('vnd.pgrst.object') ? { tier: 'ouro', manual: true } : [{ email: user.email, tier: 'ouro', manual: true }]) }))
  await p.route('**/rest/v1/rpc/esc_vitrine_salas**', r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ hoje: [], semana: [], passada: [] }) }))
  await p.route('**/realtime/**', r => r.abort())
  await p.goto(`http://localhost:${PORTA}/`, { waitUntil: 'domcontentloaded' })
  return { ctx, p }
}
const monta = (p, corpo) => p.evaluate(`(async()=>{
  const R = await import('/@id/react'); const React = R.default ?? R; const h = React.createElement
  const RD = await import('/@id/react-dom/client'); const createRoot = RD.createRoot ?? RD.default?.createRoot
  const S = await import('/src/escalacao/store.tsx')
  document.getElementById('root')?.remove()
  const root = document.createElement('div'); document.body.appendChild(root)
  ${corpo}
  await new Promise(r => setTimeout(r, 1500))
})()`)
const clica = async (p, texto) => { const l = p.getByText(texto, { exact: false }).first(); await l.waitFor({ state: 'attached', timeout: 15000 }); await l.evaluate(el => { el.scrollIntoView({ block: 'center' }); el.click() }); await p.waitForTimeout(600) }

const casos = [
  { n: 1, modo: null },
  { n: 2, modo: 'Liga da Turma' },
  { n: 3, modo: 'Liga Draft' },
]
for (const c of casos) {
  const { ctx, p } = await pagina()
  await monta(p, `const L = await import('/src/escalacao/lobby.tsx'); createRoot(root).render(h(S.EscProvider, null, h(L.EscLobby)))`)
  await clica(p, 'Criar sala')
  if (c.modo) await clica(p, c.modo)
  await clica(p, '19 rodadas · só ida')
  const alvo = p.getByText('📅 Rodadas da liga').first()
  await alvo.evaluate(el => el.scrollIntoView({ block: 'center' }))
  await p.waitForTimeout(500)
  await p.screenshot({ path: `${OUT}/turno-unico-${c.n}.png` })
  console.log('📸', `${OUT}/turno-unico-${c.n}.png`)
  await ctx.close()
}

// ④ a temporada de 19 parada na última rodada (sala online, turno único)
{
  const { ctx, p } = await pagina()
  await monta(p, `
    let s = S.reducer({}, { type: 'NEW_GAME' })
    const nomes = ['Leilão Legends FC', 'Futpoint FC', 'Tricolor do Arruda', 'K9 FC']
    s = S.reducer(s, { type: 'START_ONLINE', roomId: 'r1', roomCode: 'TURNO1', isHost: true, playerIndex: 0, playerNames: nomes, seatUids: nomes.map((_, i) => 'u' + i), youUid: 'u0', formation: '4-3-3', deck: 'br', copaMode: 'liga', turnoUnico: true })
    s = S.reducer(s, { type: 'REPLAY_SEASON' })
    for (let i = 0; i < 19; i++) s = S.reducer(s, { type: 'PLAY_ROUND' })
    // a foto fica no apito da rodada 19 (a última do turno único)
    // a foto usa o caminho do save em andamento (mesmo calendário de 19, só pra desenhar a tela)
    s = { ...s, roomId: null, onlineMode: 'cpu', screen: 'season', youIdx: 0 }
    localStorage.setItem('esc-solo-inprogress-v1', JSON.stringify(s))
    const Sc = await import('/src/escalacao/screens.tsx')
    createRoot(root).render(h(S.EscProvider, null, h(Sc.EscSeason)))`)
  await p.waitForTimeout(6000)
  await p.screenshot({ path: `${OUT}/turno-unico-4.png` })
  console.log('📸', `${OUT}/turno-unico-4.png`)
  await ctx.close()
}
await b.close()
try { process.kill(-vite.pid) } catch {}
