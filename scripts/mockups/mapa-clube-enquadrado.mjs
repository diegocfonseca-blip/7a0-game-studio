// ─── 🗺️ MOCKUP: o MAPA DO CLUBE enquadrado e virando menu (Diego 18/11) ─────────
// Pedido: *"parece que é mais enquadrado… a usabilidade… sinto o meu tudo estranho, a forma que tá no menu, a forma que entra…
// analise e o que você faria, mesmo que tivesse que reformular"*. Proposta: abrir com o clube inteiro na tela, o mapa ser o menu
// (ícone em cima de cada lugar, selo dourado no que pede atenção), atalhos em cima, controles enxutos num canto.
// ⚠️ SÓ DESENHO. Fundo = foto do mapa de verdade (carreira Brasil Oficial de teste).  node scripts/mockups/mapa-clube-enquadrado.mjs
import { chromium } from 'playwright-core'
import { readFileSync } from 'node:fs'

const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [500, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w}}`).join('')
const jpg = p => `data:image/jpeg;base64,${readFileSync(p).toString('base64')}`
const CLUBE = jpg('scripts/mockups/_mapa-clube.jpg'), FONE = jpg('scripts/mockups/_mapa-clube-fone.jpg')
const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6', GREEN = '#1B7A3D', BG = '#0E1210'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'

// pinos em % da foto (x, y): no celular a foto é um recorte em pé; no computador, deitado
const PF = [
  { x: 41, y: 8, e: '🏢', n: 'Agência' },
  { x: 41, y: 37, e: '⚽', n: 'Campo', selo: 'sáb 16h' },
  { x: 44, y: 55, e: '📋', n: 'Gestão', selo: '1 decisão' },
  { x: 20, y: 62, e: '🏛️', n: 'Museu' },
  { x: 66, y: 66, e: '🛍️', n: 'Loja', selo: 'construir', vazio: true },
  { x: 88, y: 31, e: '🏟️', n: 'Arena' },
]
const PD = [
  { x: 44, y: 10, e: '🏢', n: 'Agência' },
  { x: 44, y: 42, e: '⚽', n: 'Campo', selo: 'sáb 16h' },
  { x: 46, y: 57, e: '📋', n: 'Gestão', selo: '1 decisão' },
  { x: 30, y: 63, e: '🏛️', n: 'Museu' },
  { x: 60, y: 66, e: '🛍️', n: 'Loja', selo: 'construir', vazio: true },
  { x: 84, y: 34, e: '🏟️', n: 'Arena' },
]
const pino = (p, s = 1) => `<div style="position:absolute;left:${p.x}%;top:${p.y}%;transform:translate(-50%,-50%) scale(${s});display:flex;flex-direction:column;align-items:center">
  ${p.selo ? `<span style="${OSW};font-size:10px;text-transform:uppercase;background:${GOLD};border:2px solid ${INK};border-radius:999px;padding:1px 7px;margin-bottom:-4px;z-index:1;white-space:nowrap;box-shadow:2px 2px 0 #000">${p.selo}</span>` : ''}
  <span style="width:40px;height:40px;border-radius:50%;background:${p.vazio ? 'rgba(255,255,255,.75)' : '#fff'};border:3px ${p.vazio ? 'dashed' : 'solid'} ${INK};box-shadow:3px 3px 0 #000;display:flex;align-items:center;justify-content:center;font-size:19px">${p.e}</span>
  <span style="${OSW};font-size:11px;text-transform:uppercase;background:${CREME};border:2px solid ${INK};border-radius:7px;padding:0 6px;margin-top:3px;white-space:nowrap">${p.n}</span></div>`
const ctl = t => `<span style="width:38px;height:38px;border-radius:10px;background:${CREME};border:2.5px solid ${INK};box-shadow:2px 2px 0 #000;display:flex;align-items:center;justify-content:center;${OSW};font-size:17px">${t}</span>`
const atalho = (e, t, s) => `<span style="flex:none;display:flex;align-items:center;gap:6px;background:${CREME};border:3px solid ${INK};border-radius:12px;box-shadow:3px 3px 0 #000;padding:6px 10px;${OSW};font-size:13px;text-transform:uppercase">${e} ${t}${s ? `<b style="background:${GOLD};border:2px solid ${INK};border-radius:999px;padding:0 6px;font-size:10px">${s}</b>` : ''}</span>`
const mapa = (img, pinos, escala = 1) => `<div style="position:relative;border:3px solid ${INK};border-radius:16px;overflow:hidden;box-shadow:4px 4px 0 #000;line-height:0">
  <img src="${img}" style="width:100%;display:block">
  <span style="position:absolute;left:10px;top:10px;line-height:1.2;${OSW};font-size:12px;background:${INK};color:#fff;border-radius:999px;padding:3px 10px">☀️ SÁB · 10H</span>
  <div style="line-height:1.2">${pinos.map(p => pino(p, escala)).join('')}</div>
  <div style="position:absolute;right:10px;bottom:10px;display:grid;gap:6px;line-height:1">${ctl('+')}${ctl('−')}${ctl('⛶')}${ctl('⋯')}</div>
  <span style="position:absolute;left:10px;bottom:10px;line-height:1.2;${OSW};font-size:11px;background:rgba(244,236,214,.92);border:2px solid ${INK};border-radius:8px;padding:2px 8px">toque num lugar pra entrar</span></div>`
const cab = `<p style="margin:0;${OSW};font-size:12px;letter-spacing:.12em;color:#E8C66A">BRASILIENSE · TEMPORADA 1 · SÉRIE D</p>
<p style="margin:3px 0 10px;${OSW};font-size:28px;color:${CREME};text-transform:uppercase">Seu clube</p>`
const atalhos = `<div style="display:flex;gap:8px;overflow:hidden;margin-bottom:10px">${atalho('📋', 'Gestão', '1 decisão')}${atalho('🛍️', 'Loja', 'construir')}</div>`

const sheet = `<div style="margin-top:-90px;position:relative;background:${CREME};border:3px solid ${INK};border-radius:16px 16px 12px 12px;box-shadow:4px 4px 0 #000;padding:12px 14px">
  <div style="display:flex;align-items:center;gap:10px"><span style="font-size:26px">📋</span><div style="flex:1"><p style="margin:0;${OSW};font-size:18px;text-transform:uppercase">Gestão</p><p style="margin:0;font:600 12px system-ui;color:#555">Finanças, contratos e patrocínio</p></div><span style="${OSW};font-size:16px">✕</span></div>
  <p style="margin:8px 0;font:700 12.5px system-ui;background:#FFF3C4;border:2px solid ${INK};border-radius:9px;padding:6px 9px">🔔 1 decisão: renovar o contrato do goleiro</p>
  <div style="${OSW};font-size:16px;text-transform:uppercase;text-align:center;background:${GOLD};border:3px solid ${INK};border-radius:12px;box-shadow:3px 3px 0 #000;padding:9px">Entrar na Gestão →</div></div>`

const fone = (titulo, corpo) => `<div style="width:390px;flex:none"><p style="margin:0 0 8px;${OSW};font-size:17px;text-transform:uppercase;color:${INK}">${titulo}</p>
<div style="background:${BG};border:3px solid ${INK};border-radius:22px;padding:16px;height:840px;box-shadow:5px 5px 0 #000;overflow:hidden">${corpo}</div></div>`
const HOJE = fone('Hoje', `${cab}<img src="${jpg('scripts/mockups/_mapa-hoje.jpg')}" style="width:100%;border-radius:14px;border:3px solid ${INK}"><p style="${OSW};color:#FFB4A8;font-size:14px;margin:10px 0 0">❌ abre longe, grama vazia, 9 botões cobrindo, menu escondido em "Locais"</p>`)
const PROP1 = fone('① Proposta · abre assim', `${cab}${atalhos}${mapa(FONE, PF, .85)}`)
const PROP2 = fone('② Tocou num lugar', `${cab}${atalhos}${mapa(FONE, PF, .85)}${sheet}`)

const DESK = `<div style="margin-top:26px"><p style="margin:0 0 8px;${OSW};font-size:17px;text-transform:uppercase;color:${INK}">③ No computador</p>
<div style="background:${BG};border:3px solid ${INK};border-radius:18px;padding:20px;box-shadow:5px 5px 0 #000;display:grid;grid-template-columns:1fr 300px;gap:18px;width:1200px">
  <div>${cab}${atalhos}${mapa(CLUBE, PD, 1.1)}</div>
  <div style="padding-top:78px;display:grid;gap:10px;align-content:start">
    <div style="background:${CREME};border:3px solid ${INK};border-radius:14px;box-shadow:3px 3px 0 #000;padding:12px"><p style="margin:0 0 6px;${OSW};font-size:16px;text-transform:uppercase">🔔 Pede sua atenção</p>
      <p style="margin:4px 0;font:700 13px system-ui">📋 Gestão · 1 decisão</p><p style="margin:4px 0;font:700 13px system-ui">🛍️ Loja · terreno pronto pra construir</p></div>
    <div style="background:${CREME};border:3px solid ${INK};border-radius:14px;box-shadow:3px 3px 0 #000;padding:12px"><p style="margin:0 0 6px;${OSW};font-size:16px;text-transform:uppercase">⋯ Mais do mapa</p>
      <p style="margin:4px 0;font:600 13px system-ui">🚶 Passear · 🔄 Girar · 🏙️ Ver cidade · 🤝 Patrocinadores</p></div>
  </div></div></div>`

const NOTA = `<div style="background:${CREME};border:3px solid ${INK};border-radius:14px;box-shadow:4px 4px 0 #000;padding:14px 18px;margin-bottom:18px;max-width:1236px">
<p style="margin:0;${OSW};font-size:24px;text-transform:uppercase">🗺️ Mapa do clube: enquadrado e virando menu</p>
<p style="margin:6px 0 0;font:600 14px/1.5 system-ui">Abre com o <b>clube inteiro na tela</b> (a cidade só se afastar). Cada lugar tem um <b>ícone</b> e tocar nele abre a tela dele; o que pede atenção ganha <b>selo dourado</b>. Em cima, atalhos do que está pendente. Controles: só <b>+ − ⛶ ⋯</b> num canto (Passear, Girar, Ver cidade e Patrocinadores ficam no ⋯). O 3D não muda.</p></div>`

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}body{margin:0;background:#E9DFC4;padding:22px;font-family:system-ui}</style></head><body>
${NOTA}<div style="display:flex;gap:26px;align-items:flex-start">${HOJE}${PROP1}${PROP2}</div>${DESK}</body></html>`
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const pg = await b.newPage({ viewport: { width: 1290, height: 900 }, deviceScaleFactor: 2 })
await pg.setContent(html, { waitUntil: 'load' })
await pg.screenshot({ path: 'scripts/mockups/mapa-clube-enquadrado.png', fullPage: true })
await b.close()
console.log('ok scripts/mockups/mapa-clube-enquadrado.png')
