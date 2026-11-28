// 📸 SALA DE ESPERA ONLINE de verdade (lobby real, servidor de mentira) — celular e computador, pra caçar desalinhado.
//   node scripts/foto-sala-espera.mjs [--out pasta] [--larguras 390,1280,1440,1920] [--dono 1|0] [--chat 1|0]
import { chromium } from 'playwright-core'
const arg = (n, d = '') => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const OUT = arg('out', 'scripts/mockups'), PORTA = '5281'
const LARG = arg('larguras', '390,1280,1440,1920').split(',').map(Number)
const SOU_DONO = arg('dono', '1') === '1'
const ABRE_CHAT = arg('abrechat', '1') === '1'
const EMAIL = arg('email', 'teste@exemplo.com')
const CARREIRA = process.argv.includes('--carreira') // 🏟️ 28/11: sala de espera da carreira online (mode carreira2)
process.env.DEPLOY_BASE = '/'
const { createServer } = await import('vite')
const vite = await createServer({ server: { port: +PORTA, strictPort: true, watch: null, hmr: false } })
await vite.listen()
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const EU = '11111111-1111-4111-8111-111111111111', SALA = '22222222-2222-4222-8222-222222222222'
const nomes = ['História do Futebol', 'Dendele', 'Gui Sant\'ana FC', 'Brasil', 'Fluminense Ab', 'Leon', 'Atlético Bagrense', 'Não é o Luiz']
const uids = nomes.map((_, i) => i === 0 ? EU : `3333333${i}-3333-4333-8333-33333333333${i}`)
const players = nomes.map((n, i) => ({ room_id: SALA, user_id: uids[i], player_index: i, manager_name: n, is_ready: i % 2 === 0, joined_at: new Date().toISOString() }))
const room = { id: SALA, code: '53TG9T', host_id: SOU_DONO ? EU : uids[1], status: 'waiting', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), locked: false,
  game_state: CARREIRA ? { __game: 'escalacao', roomName: 'Carreira do Neymarzetti', mode: 'carreira2', formation: '4-3-3', locked: true, pwHash: 'x', co2Sala: 's1', co2Codigo: 'C9403B', co2Cfg: { bots: 2, modo: 'dinamica', tempos: { pausa: 60, rodada: 60 }, baralho: 'todos' }, chat: true }
    : { __game: 'escalacao', roomName: 'Sala do História do Futebol', mode: 'rapido', copaMode: 'champions', chat: arg('chat', '1') === '1', manualRoom: true, clubes: true, turnoUnico: true, formation: '4-3-3', deckSala: 'todos', holandes: false } }
const b64 = o => Buffer.from(JSON.stringify(o)).toString('base64url')
const jwt = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: EU, role: 'authenticated', exp: 4102444800, email: EMAIL })}.x`
const user = { id: EU, aud: 'authenticated', role: 'authenticated', email: EMAIL, user_metadata: { name: nomes[0] }, app_metadata: {}, created_at: '2026-01-01T00:00:00Z' }
const session = { access_token: jwt, token_type: 'bearer', expires_in: 3600, expires_at: 4102444800, refresh_token: 'r', user }
for (const w of LARG) {
  const ctx = await b.newContext({ viewport: { width: w, height: w < 600 ? 900 : 900 }, deviceScaleFactor: 1 })
  await ctx.addInitScript(([s, sala]) => { try { localStorage.setItem('bl_lang', 'pt'); localStorage.setItem('sb-faabglpjutwursgmrpny-auth-token', JSON.stringify(s)); localStorage.setItem('escalacao-room', sala) } catch {} }, [session, SALA])
  const p = await ctx.newPage(); p.on('pageerror', e => console.error('💥', e.message))
  await p.route('https://faabglpjutwursgmrpny.supabase.co/**', r => {
    const u = new URL(r.request().url()), m = r.request().method(), obj = /pgrst\.object/.test(r.request().headers()['accept'] ?? '')
    const ok = body => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(body) })
    if (u.pathname.startsWith('/auth/v1/user')) return ok(user)
    if (u.pathname.startsWith('/auth/v1/token')) return ok(session)
    if (u.pathname.startsWith('/auth/')) return ok({})
    if (m === 'OPTIONS') return r.fulfill({ status: 200, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' } })
    if (u.pathname === '/rest/v1/game_rooms' && m === 'GET') return ok(obj ? room : [room])
    if (u.pathname === '/rest/v1/room_players' && m === 'GET') { const mine = u.search.includes(`user_id=eq.${EU}`); return ok(obj ? (mine ? players[0] : players[0]) : (mine ? [players[0]] : players)) }
    if (u.pathname.startsWith('/rest/v1/rpc/')) return ok(null)
    if (m !== 'GET') return ok(obj ? {} : [])
    return ok(obj ? null : [])
  })
  await p.goto(`http://localhost:${PORTA}/`, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2500)
  await p.evaluate(`(async()=>{
    const txt = await (await fetch('/src/main.tsx')).text()
    const pega = (t, k) => { const i = t.indexOf(k); const j = t.indexOf(String.fromCharCode(34), i); const j2 = t.indexOf(String.fromCharCode(39), i); const fim = [j, j2].filter(x => x > 0).sort((a,b)=>a-b)[0]; return t.slice(i, fim) }
    const R = await import(pega(txt, '/node_modules/.vite/deps/react.js')); const React = R.default ?? R; const h = React.createElement
    const RD = await import(pega(txt, '/node_modules/.vite/deps/react-dom_client.js')); const createRoot = RD.createRoot ?? RD.default?.createRoot
    const S = await import('/src/escalacao/store.tsx')
    const L = await import('/src/escalacao/lobby.tsx')
    const old = document.getElementById('root'); old.innerHTML = ''; const root = document.createElement('div'); old.replaceWith(root); root.id = 'root'
    createRoot(root).render(h(S.EscProvider, null, h(L.EscLobby)))
  })()`)
  await p.waitForTimeout(5000)
  if (ABRE_CHAT) { const bt = p.locator('button[aria-label="Abrir chat da sala"]').first(); if (await bt.count()) { await bt.click(); await p.waitForTimeout(1200) } }
  const larg = await p.evaluate(() => document.documentElement.scrollWidth)
  await p.screenshot({ path: `${OUT}/${CARREIRA ? 'carreira-' : ''}sala-espera-${w}${SOU_DONO ? '' : '-convidado'}${EMAIL.startsWith('diego') ? '-diego' : ''}.png`, fullPage: false })
  console.log('📸', w, 'scrollWidth', larg)
  await ctx.close()
}
await b.close(); await vite.close(); process.exit(0)
