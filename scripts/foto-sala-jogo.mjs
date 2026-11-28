// 📸 TELAS DO JOGO ONLINE (leilão e temporada) com o estado de uma sala de verdade (START_ONLINE), no celular e no computador.
//   node scripts/foto-sala-jogo.mjs [--out pasta] [--larguras 1366,1100,390] [--telas auction,season]
import { chromium } from 'playwright-core'
const arg = (n, d = '') => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const OUT = arg('out', 'scripts/mockups'), PORTA = '5282'
const LARG = arg('larguras', '1366,1100,390').split(',').map(Number)
const TELAS = arg('telas', 'auction,season').split(',')
process.env.DEPLOY_BASE = '/'
const { createServer } = await import('vite')
const vite = await createServer({ server: { port: +PORTA, strictPort: true, watch: null, hmr: false } })
await vite.listen()
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
for (const w of LARG) for (const tela of TELAS) {
  const ctx = await b.newContext({ viewport: { width: w, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce' })
  await ctx.addInitScript(() => { try { localStorage.setItem('bl_lang', 'pt') } catch {} })
  const p = await ctx.newPage(); p.on('pageerror', e => console.error('💥', e.message))
  await p.route('https://faabglpjutwursgmrpny.supabase.co/**', r => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' }, body: /pgrst\.object/.test(r.request().headers()['accept'] ?? '') ? 'null' : '[]' }))
  await p.goto(`http://localhost:${PORTA}/`, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2500)
  await p.evaluate(`(async()=>{
    const txt = await (await fetch('/src/main.tsx')).text()
    const pega = (t, k) => { const i = t.indexOf(k); const j = t.indexOf(String.fromCharCode(34), i); const j2 = t.indexOf(String.fromCharCode(39), i); const fim = [j, j2].filter(x => x > 0).sort((a,b)=>a-b)[0]; return t.slice(i, fim) }
    const R = await import(pega(txt, '/node_modules/.vite/deps/react.js')); const React = R.default ?? R; const h = React.createElement
    const RD = await import(pega(txt, '/node_modules/.vite/deps/react-dom_client.js')); const createRoot = RD.createRoot ?? RD.default?.createRoot
    const S = await import('/src/escalacao/store.tsx')
    const Sc = await import('/src/escalacao/screens.tsx')
    const old = document.getElementById('root'); const root = document.createElement('div'); old.replaceWith(root); root.id = 'root'
    const nomes = ['História do Futebol', 'Dendele', 'Gui Santana FC', 'Brasil', 'Fluminense Ab', 'Leon', 'Atlético Bagrense', 'Não é o Luiz']
    const Cap = () => { const { state, dispatch } = S.useEsc(); window.__d = dispatch; window.__s = state; return null }
    const Tela = () => { const { state } = S.useEsc(); return state.screen === 'auction' ? h(Sc.EscAuction) : state.screen === 'season' ? h(Sc.EscSeason) : state.screen === 'cerimonia' ? h(Sc.EscCerimonia) : state.screen === 'champions' ? h(Sc.EscChampions) : h('p', null, 'tela: ' + state.screen) }
    createRoot(root).render(h(S.EscProvider, null, h(Cap), h('div', { className: 'tela-cheia', style: { background: '#F4ECD6' } }, h(Tela))))
    await new Promise(r => setTimeout(r, 800))
    window.__d({ type: 'START_ONLINE', roomId: 'r1', roomCode: '53TG9T', roomName: 'Sala do História do Futebol', isHost: true, playerIndex: 0, playerNames: nomes, seatUids: nomes.map((_, i) => '0000000'+i+'-0000-4000-8000-000000000000'), youUid: '00000000-0000-4000-8000-000000000000', formation: '4-3-3', deck: 'todos', copaMode: ${JSON.stringify(tela === 'champions' ? 'champions' : 'liga')}, turnoUnico: true, clubes: false, manual: true })
    await new Promise(r => setTimeout(r, 1200))
    if (${JSON.stringify(tela)} !== 'auction') { window.__d({ type: 'REPLAY_SEASON' }); await new Promise(r => setTimeout(r, 600)); window.__d({ type: 'PLAY_ROUND' }) }
    await new Promise(r => setTimeout(r, 2500))
  })()`)
  await p.waitForTimeout(2500)
  const info = await p.evaluate(() => { const b = document.querySelector('.ll-shell-bar'); const r = (e) => { if (!e) return null; const q = e.getBoundingClientRect(); const cs = getComputedStyle(e); return [e.tagName, e.className.toString().slice(0, 60), Math.round(q.x), Math.round(q.width), cs.display, cs.justifyContent, cs.maxWidth] }; return { sw: document.documentElement.scrollWidth, tela: window.__s?.screen, bar: r(b), barDiv: r(b?.firstElementChild), kids: [...(b?.firstElementChild?.children ?? [])].map(r) } })
  await p.locator('.fp-advanced-tactics button', { hasText: 'Pressão alta' }).first().click().catch(()=>{}); await p.waitForTimeout(800)
  await p.locator('.fp-advanced-tactics').first().scrollIntoViewIfNeeded().catch(()=>{})
  await p.locator('.fp-advanced-tactics').first().screenshot({ path: `${OUT}/tatica-${w}.png` }).catch(e=>console.log('sem tatica', e.message.slice(0,80)))
  const f = `${OUT}/sala-jogo-${tela}-${w}.png`
  await p.screenshot({ path: f, fullPage: true }); console.log('📸', f, JSON.stringify(info))
  await p.screenshot({ path: f.replace('.png', '-topo.png'), clip: { x: 0, y: 60, width: w, height: 360 } })
  await ctx.close()
}
await b.close(); await vite.close(); process.exit(0)
