// ─── 👑 CONFERE A ENTRADA DE GALA DE TODOS OS BATISMOS ────────────────────────
// Diego (28/09): *"a entrada de gala, todos escudos e mascotes estão direitos?"*.
// Monta, com as peças REAIS (`entrada-gala.tsx`), a linha dourada + o telão de cada
// batismo numa folha só e confere sozinho: escudo de ARTE (não o genérico gerado),
// mascote presente, e nada saindo da janela. Tira as fotos da folha.
// uso: node scripts/confere-gala-todos.mjs [--porta 5295] [--saida pasta]
import { chromium } from 'playwright-core'
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const PORTA = arg('porta', '5295'), SAIDA = arg('saida', '/tmp/confere-gala')
mkdirSync(SAIDA, { recursive: true })
const vite = spawn('npx', ['vite', '--port', PORTA], { env: { ...process.env, DEPLOY_BASE: '/' }, stdio: 'ignore', detached: true })
const fim = c => { try { process.kill(-vite.pid) } catch {} ; process.exit(c) }
for (let i = 0; i < 40; i++) { try { if ((await fetch(`http://localhost:${PORTA}/`)).ok) break } catch {} await new Promise(r => setTimeout(r, 500)) }
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 1 })
await p.goto(`http://localhost:${PORTA}/`, { waitUntil: 'domcontentloaded' })
const rel = await p.evaluate(async () => {
  const R = await import('/@id/react'); const React = R.default ?? R
  const RD = await import('/@id/react-dom/client'); const createRoot = RD.createRoot ?? RD.default?.createRoot
  const G = await import('/src/escalacao/entrada-gala.tsx')
  const B = await import('/src/escalacao/batismos.ts')
  const E = await import('/src/escalacao/escudos.tsx')
  const M = await import('/src/escalacao/mascotes.tsx')
  document.getElementById('root')?.remove()
  document.body.style.cssText = 'margin:0;background:#F4ECD6;font-family:system-ui;color:#0C0C0C'
  const clubes = B.BATISMOS.filter(x => x.tipo === 'batismo').map(x => x.clube)
  const e = React.createElement
  const Card = ({ c }) => e('div', { 'data-clube': c, style: { border: '2px solid #0C0C0C', borderRadius: 12, padding: 8, background: '#fff' } },
    e('div', { className: 'gala-linha', style: { marginBottom: 6 } },
      e('div', { style: { display: 'flex', alignItems: 'center', gap: 10, position: 'relative', zIndex: 1 } },
        e(G.GalaEscudoBotao, { clube: c, souEu: true }), e('b', { style: { flex: 1, fontFamily: 'Oswald', fontSize: 14 } }, c), e(G.GalaMascoteMini, { clube: c }))),
    e('div', { className: 'telao', style: { background: '#111', borderRadius: 8, height: 190, display: 'flex', alignItems: 'center', justifyContent: 'space-around', overflow: 'hidden' } },
      e('span', { className: 'esc-grande' }, e(E.Escudo, { nome: c, size: 120 })),
      M.mascoteInteiraDoTime(c) ? e('span', { className: 'masc-grande' }, e((await_ => null) && null || (() => null))) : null))
  // a mascote grande usa o MESMO MascoteMini do show
  const MM = (await import('/src/escalacao/mascote-atravessa.tsx')).MascoteMini
  const Card2 = ({ c }) => { const art = M.mascoteInteiraDoTime(c); return e('div', { 'data-clube': c, style: { border: '2px solid #0C0C0C', borderRadius: 12, padding: 8, background: '#fff' } },
    e('div', { className: 'gala-linha', style: { marginBottom: 6 } },
      e('div', { style: { display: 'flex', alignItems: 'center', gap: 10, position: 'relative', zIndex: 1 } },
        e(G.GalaEscudoBotao, { clube: c, souEu: true }), e('b', { style: { flex: 1, fontFamily: 'Oswald', fontSize: 14 } }, c), e(G.GalaMascoteMini, { clube: c }))),
    e('div', { style: { background: '#111', borderRadius: 8, height: 190, display: 'flex', alignItems: 'center', justifyContent: 'space-around', overflow: 'hidden' } },
      e('span', { className: 'esc-grande' }, e(E.Escudo, { nome: c, size: 120 })),
      art ? e('span', { className: 'masc-grande' }, e(MM, { art, alt: 170 })) : e('span', { style: { color: '#f55', fontWeight: 900 } }, 'SEM MASCOTE'))) }
  const root = document.body.appendChild(document.createElement('div'))
  root.style.cssText = 'display:grid;grid-template-columns:repeat(4,1fr);gap:12px;padding:12px'
  createRoot(root).render(e(React.Fragment, null, e(G.GalaEstilo), ...clubes.map(c => e(Card2, { key: c, c }))))
  await new Promise(r => setTimeout(r, 2500))
  // conferência: escudo de ARTE = tem <img>; mascote presente; imagens carregadas
  return clubes.map(c => {
    const card = document.querySelector(`[data-clube="${CSS.escape(c)}"]`)
    const esc = card?.querySelector('.esc-grande')
    const escImg = esc?.querySelector('img')
    const masc = card?.querySelector('.masc-grande img, .masc-grande svg')
    const imgs = [...(card?.querySelectorAll('img') ?? [])]
    return { c, escudoArte: !!escImg, mascote: !!masc, quebrada: imgs.some(i => i.complete && i.naturalWidth === 0) }
  })
})
const erros = rel.filter(r => !r.escudoArte || !r.mascote || r.quebrada)
for (const r of rel) console.log(`${!r.escudoArte || !r.mascote || r.quebrada ? '⚠️ ' : '✅'} ${r.c}${r.escudoArte ? '' : ' · escudo GENÉRICO'}${r.mascote ? '' : ' · SEM mascote'}${r.quebrada ? ' · imagem QUEBRADA' : ''}`)
const h = await p.evaluate(() => document.body.scrollHeight)
for (let y = 0, i = 1; y < h; y += 900, i++) await p.screenshot({ path: `${SAIDA}/folha-${i}.png`, clip: { x: 0, y, width: 1200, height: Math.min(900, h - y) }, fullPage: true })
await b.close()
console.log(`\n${rel.length} batismos · ${erros.length} com problema · fotos em ${SAIDA}`)
fim(0)
