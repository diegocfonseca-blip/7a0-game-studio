// 📸 CARREIRA ONLINE (27/11): criar no padrão das salas (blocos numerados) + sala de espera com as regras.  node scripts/foto-co2-criar.mjs [--out pasta]
import { chromium } from 'playwright-core'
import { spawn } from 'node:child_process'
const arg = (n, d = '') => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const OUT = arg('out', 'scripts/mockups'), PORTA = '5266'
const vite = spawn('npx', ['vite', '--port', PORTA], { env: { ...process.env, DEPLOY_BASE: '/' }, stdio: 'ignore', detached: true })
for (let i = 0; i < 60; i++) { try { const r = await fetch(`http://localhost:${PORTA}/`); if (r.ok) break } catch { /* subindo */ } await new Promise(r => setTimeout(r, 500)) }
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
for (const tela of ['criar', 'espera']) {
  const ctx = await b.newContext({ viewport: { width: 420, height: 900 }, deviceScaleFactor: 2 })
  await ctx.addInitScript(() => { try { localStorage.setItem('bl_lang', 'pt'); localStorage.setItem('esc-co2-cfg', JSON.stringify({ sala: 's1', bots: 2, modo: 'dinamica', tempos: { pausa: 60, rodada: 60 } })) } catch {} })
  const p = await ctx.newPage(); p.on('pageerror', e => console.error('💥', e.message))
  const sala = { id: 's1', codigo: 'F4B04C', nome: 'Fut e Diego', dono: 'u0', vice: null, versao: '', temporada: 0, rodada: 0, fase: 'espera', prazo: null, inicio_rodada: null, auto: false, velocidade: 1, pausado: false, comandante: null }
  await p.route('**/rest/v1/esc_carr_sala?**', r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(r.request().url().includes('mundo') ? { mundo: null } : sala) }))
  await p.route('**/rest/v1/esc_carr_clube?**', r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ sala: 's1', assento: 0, user_id: 'u0', nome: 'Neymarzetti', pronto_rodada: null, na_sala_em: null }, { sala: 's1', assento: 1, user_id: 'u1', nome: 'Futpoint FC', pronto_rodada: null, na_sala_em: null }]) }))
  await p.route('**/rest/v1/rpc/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: r.request().url().includes('pode_criar') ? 'true' : r.request().url().includes('pedido') || r.request().url().includes('saidas') ? '[]' : '"ok"' }))
  await p.goto(`http://localhost:${PORTA}/`, { waitUntil: 'domcontentloaded' })
  await p.evaluate(`(async()=>{
    const R = await import('/@id/react'); const React = R.default ?? R; const h = React.createElement
    const RD = await import('/@id/react-dom/client'); const createRoot = RD.createRoot ?? RD.default?.createRoot
    const S = await import('/src/escalacao/store.tsx')
    const C = await import('/src/escalacao/co2.ts')
    const T = await import('/src/escalacao/co2-telas.tsx')
    document.getElementById('root')?.remove()
    const root=document.createElement('div'); root.style.cssText='background:#F4ECD6;min-height:100vh;padding:14px'; document.body.appendChild(root)
    const Secao = ({ num, title, icon, sub, children }) => h('div', { style: { background: '#fff', border: '3px solid #0C0C0C', boxShadow: '3px 3px 0 #0C0C0C', borderRadius: 16, padding: '11px 11px 12px', marginBottom: 12 } },
      h('div', { style: { display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 } }, h('span', { style: { width: 28, height: 28, borderRadius: 99, background: '#0C0C0C', color: '#FFC400', display: 'grid', placeItems: 'center', fontFamily: 'Oswald' } }, num),
        h('span', null, h('b', { style: { display: 'block', fontFamily: 'Oswald', fontSize: 17, textTransform: 'uppercase' } }, icon + ' ' + title), h('small', { style: { color: '#6b6250', fontWeight: 600 } }, sub))),
      h('div', { style: { display: 'grid', gap: 12 } }, children))
    if (${JSON.stringify(tela)} === 'criar') createRoot(root).render(h(S.EscProvider, null, h(T.Co2Criar, { nomeClube: 'Neymarzetti', Secao, primeiro: 2, onAbre(){} })))
    else { createRoot(root).render(h(S.EscProvider, null, h(T.Co2Espera, { salaId: 's1', onSair(){} }))); await new Promise(r=>setTimeout(r,1500)); C._bancadaCo2({ uid: 'u0', aqui: ['u0'] }) }
    await new Promise(r=>setTimeout(r,1500))
  })()`)
  await p.screenshot({ path: `${OUT}/co2-${tela}.png`, fullPage: true })
  console.log('📸', `${OUT}/co2-${tela}.png`)
  await ctx.close()
}
await b.close()
try { process.kill(-vite.pid) } catch { /* já foi */ }
process.exit(0)
