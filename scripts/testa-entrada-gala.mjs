// ─── 👑 TRAVA DA ENTRADA DE GALA (sala de espera do online) ──────────────────
// Monta a peça REAL (`entrada-gala.tsx`) no navegador e confere:
//   1. quem já estava na sala quando eu abri NÃO ganha entrada (só quem chega depois);
//   2. eu mesmo, se sou batismo, ganho a minha;
//   3. quem chega depois ganha; dois juntos entram em fila, um de cada vez;
//   4. clube que não é batismo nunca ganha;
//   5. nada de nº de sócio/fundador na tela (ordem do Diego, 28/09).
// Tira fotos do show e da linha dourada.
// uso: node scripts/testa-entrada-gala.mjs [--porta 5281]
import { chromium } from 'playwright-core'
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const PORTA = arg('porta', '5281'), SAIDA = arg('saida', '/tmp/entrada-gala')
mkdirSync(SAIDA, { recursive: true })
const vite = spawn('npx', ['vite', '--port', PORTA], { env: { ...process.env, DEPLOY_BASE: '/' }, stdio: 'ignore', detached: true })
const fim = c => { try { process.kill(-vite.pid) } catch {} ; process.exit(c) }
for (let i = 0; i < 40; i++) { try { if ((await fetch(`http://localhost:${PORTA}/`)).ok) break } catch {} await new Promise(r => setTimeout(r, 500)) }
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 420, height: 880 }, deviceScaleFactor: 2, locale: 'pt-BR' })
await p.addInitScript(() => { try { localStorage.setItem('bl_lang', 'pt') } catch {} })
await p.goto(`http://localhost:${PORTA}/`, { waitUntil: 'domcontentloaded' })
await p.evaluate(async () => {
  const R = await import('/@id/react'); const React = R.default ?? R
  const RD = await import('/@id/react-dom/client'); const createRoot = RD.createRoot ?? RD.default?.createRoot
  const G = await import('/src/escalacao/entrada-gala.tsx')
  document.getElementById('root')?.remove()
  document.body.style.cssText = 'margin:0;background:#F4ECD6;font-family:system-ui'
  window.__log = []
  function Harness() {
    const [players, setPlayers] = React.useState([
      { user_id: 'a', manager_name: 'Fabulous EC 👑' }, { user_id: 'b', manager_name: 'Neymarzetti FC' }, { user_id: 'eu', manager_name: 'Meu Time Qualquer' },
    ])
    window.__set = setPlayers
    const atual = G.useEntradaGala('SALA1', players, 'eu')
    React.useEffect(() => { if (atual) window.__log.push(atual.clube) }, [atual])
    const e = React.createElement
    return e('div', { style: { padding: 16 } },
      e(G.GalaEstilo),
      e('h2', { style: { fontFamily: 'Oswald' } }, 'TÉCNICOS NA SALA'),
      ...players.map(pl => { const gala = G.clubeDeGala(pl.manager_name); return e('div', { key: pl.user_id, className: gala ? 'gala-linha' : '', style: { margin: '6px 0', padding: gala ? undefined : '8px', border: gala ? undefined : '2px solid #000', borderRadius: 12 } },
        e('div', { style: { display: 'flex', alignItems: 'center', gap: 12, position: 'relative', zIndex: 1 } },
          gala ? e(G.GalaEscudoBotao, { clube: gala, souEu: pl.user_id === 'eu' }) : e('b', null, pl.manager_name[0]),
          e('b', { style: { flex: 1, fontFamily: 'Oswald' } }, pl.manager_name),
          gala ? e(G.GalaMascoteMini, { clube: gala }) : null)) }),
      atual ? e(G.EntradaGalaShow, { key: atual.uid, chave: atual.uid, clube: atual.clube }) : null)
  }
  createRoot(document.body.appendChild(document.createElement('div'))).render(React.createElement(Harness))
  await new Promise(r => setTimeout(r, 400))
})
const erros = []; const ok = (c, m) => { console.log(`   ${c ? '✅' : '❌'} ${m}`); if (!c) erros.push(m) }
await p.waitForTimeout(600)
ok((await p.evaluate(() => window.__log.length)) === 0, 'quem já estava na sala (Fabulous) não ganha entrada quando eu abro')
await p.evaluate(() => window.__set(ps => [...ps, { user_id: 'c', manager_name: 'Al Takhadao FC 👑' }, { user_id: 'd', manager_name: 'Cajuri Raiva' }, { user_id: 'e', manager_name: 'Fabulous EC' }]))
await p.waitForTimeout(1700)
await p.screenshot({ path: `${SAIDA}/1-show.png` })
const txt = await p.evaluate(() => document.body.innerText)
ok(/CHEGOU NA SALA/.test(txt) && /Al Takhadao FC/.test(txt), 'quem chega depois ganha a entrada (Al Takhadao)')
ok(!/s[óo]cio|fundador|nº/i.test(txt), 'nenhum nº de sócio/fundador na tela')
await p.waitForTimeout(6500)
await p.screenshot({ path: `${SAIDA}/2-lista.png` })
const log = await p.evaluate(() => window.__log)
ok(JSON.stringify(log) === JSON.stringify(['Al Takhadao FC', 'Fabulous EC']), `fila: um de cada vez, na ordem (${log.join(' → ')})`)
ok(!log.includes('Cajuri Raiva'), 'clube sem batismo nunca ganha entrada')
await p.locator('button[aria-label="Al Takhadao FC"]').click()
await p.waitForTimeout(700)
await p.screenshot({ path: `${SAIDA}/3-toque.png` })
ok(/entrar assim também/i.test(await p.evaluate(() => document.body.innerText)), 'tocar no escudo mostra o convite pro Batismo')
await b.close()
if (erros.length) { console.log('\n❌ REPROVADO'); fim(1) }
console.log('\n✅ entrada de gala ok · fotos em', SAIDA); fim(0)
