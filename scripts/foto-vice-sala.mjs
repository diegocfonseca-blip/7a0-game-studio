// 🌴 19/11: fotos do tema Vice City nas telas da sala (revelação + temporada), celular e computador.
//   node scripts/foto-vice-sala.mjs [--out scripts/mockups]
import { chromium } from 'playwright-core'
const arg = (n, d = '') => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const OUT = arg('out', 'scripts/mockups'), PORTA = '5279'
process.env.DEPLOY_BASE = '/'
const { createServer } = await import('vite')
const vite = await createServer({ server: { port: +PORTA, strictPort: true, watch: null, hmr: false } })
await vite.listen()
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
for (const [w, h, tam] of [[390, 1300, 'cel'], [1280, 900, 'pc']]) for (const tela of ['cerimonia', 'season']) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, reducedMotion: 'reduce' })
  await ctx.addInitScript(() => { try { localStorage.setItem('bl_lang', 'pt') } catch {} })
  const p = await ctx.newPage(); p.on('pageerror', e => console.error('💥', e.message))
  await p.route('**/rest/v1/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }))
  await p.route('**/realtime/**', r => r.abort())
  await p.goto(`http://localhost:${PORTA}/`, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2500)
  await p.evaluate(`(async()=>{
    const txt = await (await fetch('/src/escalacao/vice-city-ui.tsx')).text()
    const txt2 = await (await fetch('/src/main.tsx')).text()
    const pega = (t, k) => { const i = t.indexOf(k); const j = t.indexOf(String.fromCharCode(34), i); const j2 = t.indexOf(String.fromCharCode(39), i); const fim = [j, j2].filter(x => x > 0).sort((a,b)=>a-b)[0]; return t.slice(i, fim) }
    const R = await import(pega(txt, '/node_modules/.vite/deps/react.js')); const React = R.default ?? R; const h = React.createElement
    const RD = await import(pega(txt2, '/node_modules/.vite/deps/react-dom_client.js')); const createRoot = RD.createRoot ?? RD.default?.createRoot
    const S = await import('/src/escalacao/store.tsx')
    document.getElementById('root')?.remove()
    const root = document.createElement('div'); document.body.appendChild(root)
    let s = S.reducer({}, { type: 'NEW_GAME' })
    const nomes = ['Neymarzetti', 'Futpoint FC', 'Duarte FC', 'Stocco FC']
    s = S.reducer(s, { type: 'START', teamName: 'Neymarzetti', formation: '4-3-3', rivals: 9, career: false, league: 'both', copaMode: 'liga', intro: true, pregaoAberto: true, vice: true })
    s = S.reducer(s, { type: 'REPLAY_SEASON' })
    if ('${tela}' === 'season') { s = S.reducer(s, { type: 'PLAY_ROUND' }) }
    s = { ...s, screen: '${tela}', viceCity: true }
    localStorage.setItem('esc-solo-inprogress-v1', JSON.stringify(s))
    const Sc = await import('/src/escalacao/screens.tsx')
    createRoot(root).render(h(S.EscProvider, null, h('${tela}' === 'season' ? Sc.EscSeason : Sc.EscCerimonia)))
    await new Promise(r => setTimeout(r, 2500))
  })()`)
  await p.waitForTimeout(3500)
  const f = `${OUT}/vice-sala-${tela}-${tam}.png`
  await p.screenshot({ path: f }); console.log('📸', f)
  await ctx.close()
}
await b.close()
await vite.close()
