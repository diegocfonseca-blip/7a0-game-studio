// 📸 SALA SÓ DE COPA DO MUNDO (convocando), com relógio e táticas de mentira: compara antes × depois do visual novo.
//   node scripts/foto-copa-sala.mjs [--out pasta] [--larguras 1366,390]
import { chromium } from 'playwright-core'
const arg = (n, d = '') => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const OUT = arg('out', 'scripts/mockups'), PORTA = '5283'
const LARG = arg('larguras', '1366,390').split(',').map(Number)
process.env.DEPLOY_BASE = '/'
const { createServer } = await import('vite')
const vite = await createServer({ server: { port: +PORTA, strictPort: true, watch: null, hmr: false } })
await vite.listen()
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
for (const w of LARG) for (const propria of [false, true]) {
  const ctx = await b.newContext({ viewport: { width: w, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce' })
  await ctx.addInitScript(() => { try { localStorage.setItem('bl_lang', 'pt') } catch {} })
  const p = await ctx.newPage(); p.on('pageerror', e => console.error('💥', e.message))
  const t0 = Date.now()
  await p.route('https://faabglpjutwursgmrpny.supabase.co/**', r => {
    const u = r.request().url(); let body = '[]'
    if (u.includes('esc_copa_preview_clock')) body = JSON.stringify({ server_ms: Date.now(), clock: { revision: 3, step: 1, running: true, manual: false, speed: 1, started_at: new Date(t0 - 15000).toISOString(), updated_at: new Date(t0 - 15000).toISOString(), duration_ms: 600000, extra_ms: 0 } })
    else if (u.includes('esc_copa_taticas')) body = JSON.stringify({ rev: 1, step: 1, running: true, linhas: [], planos: [], planos_ativos: true })
    else if (u.includes('/rpc/')) body = JSON.stringify({ ok: true })
    else if (/pgrst\.object/.test(r.request().headers()['accept'] ?? '')) body = 'null'
    r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' }, body })
  })
  await p.goto(`http://localhost:${PORTA}/`, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2500)
  await p.evaluate(`(async()=>{
    const txt = await (await fetch('/src/main.tsx')).text()
    const pega = (t, k) => { const i = t.indexOf(k); const j = t.indexOf(String.fromCharCode(34), i); const j2 = t.indexOf(String.fromCharCode(39), i); const fim = [j, j2].filter(x => x > 0).sort((a,b)=>a-b)[0]; return t.slice(i, fim) }
    const R = await import(pega(txt, '/node_modules/.vite/deps/react.js')); const React = R.default ?? R; const h = React.createElement
    const RD = await import(pega(txt, '/node_modules/.vite/deps/react-dom_client.js')); const createRoot = RD.createRoot ?? RD.default?.createRoot
    const S = await import('/src/escalacao/store.tsx')
    const C = await import('/src/escalacao/copa-mundo-online.tsx')
    const O = await import('/src/escalacao/owner-online-visual.tsx')
    const old = document.getElementById('root'); const root = document.createElement('div'); old.replaceWith(root); root.id = 'root'
    const eu = '11111111-1111-4111-8111-111111111111'
    const ficha = C.montaFicha([{ uid: eu, nome: 'História do Futebol', pick: { pais: 'Brasil', xiKeys: [] } }], 12345, 1)
    const lobbyState = { managers: [], youIdx: 0, quickCopa: null, onlineMode: 'online', sport: 'futebol', screen: 'lobby' }
    createRoot(root).render(h(S.EscProvider, null, h(O.OwnerOnlineProvider, { enabled: true, state: lobbyState }, h('div', { className: 'ov3 tela-cheia', style: { background: '#0b120e', minHeight: '100vh' } }, h(C.CopaDaSala, { ficha, roomId: 'r-copa', meuUid: eu, souDono: true, visible: true, salaPropria: ${propria}, aoFechar: () => {} })))))
    await new Promise(r => setTimeout(r, 6000))
  })()`)
  await p.waitForTimeout(4000)
  const info = await p.evaluate(() => ({ plano: !!document.querySelector('.fp-advanced-tactics, .fp-cup-plan, [aria-label="Plano do seu time"]'), botoes: [...document.querySelectorAll('button')].map(b => b.textContent.trim()).filter(t => /Retranca|Equil|Ofensivo|Ataque|Pressão|Pontas/.test(t)).slice(0, 12) }))
  const f = `${OUT}/copa-sala-${propria ? 'depois' : 'antes'}-${w}.png`
  await p.screenshot({ path: f, fullPage: true }); console.log('📸', f, JSON.stringify(info))
  await ctx.close()
}
await b.close(); await vite.close(); process.exit(0)
