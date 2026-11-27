// 📸 CARREIRA ONLINE v2 (26/11): as telas novas da VIRADA — escolha de bots na largada e a espera do leilão de todos (dono, Dinâmica).
//   node scripts/foto-co2-virada.mjs [--out pasta]
import { chromium } from 'playwright-core'
import { spawn } from 'node:child_process'
const arg = (n, d = '') => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const OUT = arg('out', 'scripts/mockups'), PORTA = '5264'
const vite = spawn('npx', ['vite', '--port', PORTA], { env: { ...process.env, DEPLOY_BASE: '/' }, stdio: 'ignore', detached: true })
for (let i = 0; i < 60; i++) { try { const r = await fetch(`http://localhost:${PORTA}/`); if (r.ok) break } catch { /* subindo */ } await new Promise(r => setTimeout(r, 500)) }
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const DONO = 'u-dono', AMIGO = 'u-amigo'
const NOMES = ['Neymarzetti', 'Futpoint FC', 'Tricolor do Arruda', 'Low profile F.C']
const ORDEM = [DONO, AMIGO, 'u3', 'u4']
const clubes = NOMES.map((nome, i) => ({ sala: 's1', assento: i, user_id: ORDEM[i], nome, pronto_rodada: null, na_sala_em: null, publico: i < 2 ? { mgrId: i, nome, squad: [], entradas: {}, fechamento: { temporada: 1, caixa: 50, squad: [], listados: [], soltar: [], sondados: [] } } : i === 2 ? { mgrId: 2, nome, squad: [], entradas: {}, copaMundo: { season: 1, pais: 'Argentina', form: '4-3-3' } } : null }))
const casos = [
  { nome: 'largada-bots', fase: 'espera', temporada: 0, tela: 'espera', w: 420 },
  { nome: 'virada-espera-dono', fase: 'virada', temporada: 1, tela: 'virada', w: 420 },
  { nome: 'virada-espera-dono-pc', fase: 'virada', temporada: 1, tela: 'virada', w: 1280 },
  { nome: 'anuncio-estreia', fase: 'preparo', temporada: 1, tela: 'anuncio', w: 420 },
  { nome: 'anuncio-faixa', fase: 'preparo', temporada: 1, tela: 'faixa', w: 420 },
  { nome: 'copa-mundo-vez', fase: 'virada', temporada: 1, tela: 'copa', w: 420 },
]
for (const c of casos) {
  const ctx = await b.newContext({ viewport: { width: c.w, height: 900 }, deviceScaleFactor: 2 })
  await ctx.addInitScript(() => { try { localStorage.setItem('bl_lang', 'pt') } catch {} })
  if (c.tela === 'faixa') await ctx.addInitScript(() => { try { for (let i = 0; i < 1; i++) localStorage.setItem('esc-aviso-x-co2-anuncio:s1:1', '1') } catch {} })
  const p = await ctx.newPage(); p.on('pageerror', e => console.error('💥', e.message))
  const sala = { id: 's1', codigo: 'K7Q2ZP', nome: 'A Pirâmide dos Amigos', dono: DONO, vice: null, versao: '', temporada: c.temporada, rodada: ['anuncio','faixa'].includes(c.tela) ? 0 : c.temporada ? 38 : 0, fase: c.fase, prazo: c.fase === 'virada' ? new Date(Date.now() + 42000).toISOString() : null, inicio_rodada: null, auto: true, velocidade: 1, pausado: false, comandante: DONO }
  await p.route('**/rest/v1/esc_carr_sala?**', r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(r.request().url().includes('mundo') ? { mundo: c.temporada ? { ordem: ORDEM, v: 1, modo: 'dinamica' } : null } : sala) }))
  await p.route('**/rest/v1/esc_carr_clube?**', r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(clubes) }))
  await p.route('**/rest/v1/rpc/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '"ok"' }))
  await p.goto(`http://localhost:${PORTA}/`, { waitUntil: 'domcontentloaded' })
  await p.evaluate(`(async()=>{
    const R = await import('/@id/react'); const React = R.default ?? R; const h = React.createElement
    const RD = await import('/@id/react-dom/client'); const createRoot = RD.createRoot ?? RD.default?.createRoot
    const S = await import('/src/escalacao/store.tsx')
    const C = await import('/src/escalacao/co2.ts')
    const T = await import('/src/escalacao/co2-telas.tsx')
    document.getElementById('root')?.remove()
    const root=document.createElement('div'); root.style.cssText='background:#F4ECD6;min-height:100vh'; document.body.appendChild(root)
    if (${JSON.stringify(c.tela)} === 'espera') {
      root.style.padding='14px'
      createRoot(root).render(h(S.EscProvider, null, h(T.Co2Espera, { salaId: 's1', onSair(){} })))
    } else {
      await C.co2Abrir('s1')
      const V = () => { const { state, dispatch } = S.useEsc(); window.__d = dispatch; if (state.co2 && ${JSON.stringify(c.tela)} === 'copa') return h('div', { style: { padding: 14 } }, h(T.Co2CopaMundo, { top: [{ name: 'Tricolor do Arruda', mgrId: 2 }, { name: 'Real Madrid', mgrId: null }, { name: 'Neymarzetti', mgrId: 0 }, { name: 'Boca Juniors', mgrId: null }, { name: 'Futpoint FC', mgrId: 1 }], seasonNo: 1, seed: 1, motor2: false })); return state.co2 ? (['anuncio','faixa'].includes(${JSON.stringify(c.tela)}) ? h('div', { style: { padding: 14 } }, h(T.Co2Anuncio, { restante: 47, comanda: true, onSeguir(){} })) : h(T.Co2ViradaEspera)) : null }
      createRoot(root).render(h(S.EscProvider, null, h(V)))
      await new Promise(r=>setTimeout(r,800))
      window.__d({ type: 'START_CAREER_SOLO', teamName: 'Neymarzetti', formation: '4-3-3', rivals: 3, co2: { sala: 's1', nomes: ${JSON.stringify(NOMES)}, assento: 0 } })
      if (${JSON.stringify(c.tela)} === 'copa') { await new Promise(r=>setTimeout(r,300)); window.__d({ type: 'CO2_GAVETAS', gavetas: [{ mgrId: 2, nome: 'Tricolor do Arruda', squad: [], entradas: {}, copaMundo: { season: 1, pais: 'Argentina', form: '4-3-3' } }] }) }
    }
    await new Promise(r=>setTimeout(r,1500))
    C._bancadaCo2({ uid: ${JSON.stringify(DONO)}, aqui: ORDEM_AQUI })
    await new Promise(r=>setTimeout(r,1500))
  })()`.replace('ORDEM_AQUI', JSON.stringify(ORDEM.slice(0, 3))))
  await p.screenshot({ path: `${OUT}/co2-${c.nome}.png`, fullPage: c.w < 1000 })
  console.log('📸', `${OUT}/co2-${c.nome}.png`)
  await ctx.close()
}
await b.close()
try { process.kill(-vite.pid) } catch {}
