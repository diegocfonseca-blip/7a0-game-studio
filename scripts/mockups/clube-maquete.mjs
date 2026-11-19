// ─── 🏟️ MOCKUP: aba CLUBE reformulada — "a maquete do clube" (Diego 18/11) ─────────
// Pedido: *"ainda continua estranho… eu disse que você poderia fazer uma reformulação total de como você faria"*.
// Ideia: a aba Clube deixa de ser "um mapa da cidade dentro de um cartão" e vira o PAINEL DO CLUBE:
//   1. topo com o que importa (escudo, série, caixa, torcida, dia/clima);
//   2. a MAQUETE: só o terreno do clube, recortado como uma peça de tabuleiro, câmera fixa de cima — nada de cidade nem grama infinita;
//   3. embaixo, os LUGARES em cartões (Estádio, Gestão, Agência, Loja, Museu, Casa) com o status de cada um — tocar no cartão OU no
//      prédio da maquete abre o mesmo lugar;
//   4. a cidade 3D vira um passeio opcional ("🚶 Passear pela cidade"), não a tela de entrada.
// ⚠️ SÓ DESENHO.  node scripts/mockups/clube-maquete.mjs
import { chromium } from 'playwright-core'
import { readFileSync } from 'node:fs'

const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [500, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w}}`).join('')
const img = (p, t = 'jpeg') => `data:image/${t};base64,${readFileSync(p).toString('base64')}`
const MAQ = img('scripts/mockups/_maquete.jpg'), ESC = img('public/escudos-clubes/brasiliense.webp', 'webp')
const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6', GREEN = '#1B7A3D', BG = '#0E1210'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'

const chip = (t, bg = 'rgba(255,255,255,.08)', fg = '#fff') => `<span style="${OSW};font-size:12px;background:${bg};color:${fg};border:2px solid rgba(255,255,255,.18);border-radius:999px;padding:3px 10px;white-space:nowrap">${t}</span>`
const topo = `<div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
  <img src="${ESC}" style="width:54px;height:54px;object-fit:contain;background:#fff;border-radius:50%;border:3px solid ${INK};padding:5px">
  <div style="min-width:0"><p style="margin:0;${OSW};font-size:24px;color:${CREME};text-transform:uppercase;line-height:1">Brasiliense</p>
  <p style="margin:3px 0 0;${OSW};font-size:11px;letter-spacing:.12em;color:#E8C66A">SÉRIE D · TEMPORADA 1</p></div></div>
<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px">${chip('🪙 100')}${chip('😊 torcida 55%')}${chip('☀️ sáb · 10h')}</div>`

// a maquete: só o terreno, recortado, com a "lateral de terra" e sombra dura
const selo = (x, y, t) => `<span style="position:absolute;left:${x}%;top:${y}%;transform:translate(-50%,-100%);${OSW};font-size:10.5px;text-transform:uppercase;background:${GOLD};border:2px solid ${INK};border-radius:999px;padding:1px 8px;box-shadow:2px 2px 0 #000;white-space:nowrap">${t}</span>`
const placa = (x, y, t) => `<span style="position:absolute;left:${x}%;top:${y}%;transform:translate(-50%,-50%);${OSW};font-size:10px;text-transform:uppercase;background:rgba(244,236,214,.95);border:2px solid ${INK};border-radius:6px;padding:0 6px;white-space:nowrap">${t}</span>`
const maquete = (w) => `<div style="position:relative;width:${w}px;margin:6px auto 0;padding-bottom:16px">
  <div style="position:absolute;left:10px;right:-6px;top:14px;bottom:0;background:#6b4a2b;border:3px solid ${INK};border-radius:22px"></div>
  <div style="position:relative;border:3px solid ${INK};border-radius:22px;overflow:hidden;box-shadow:6px 6px 0 #000;line-height:0">
    <img src="${MAQ}" style="width:100%;display:block">
    <div style="line-height:1.2">
      ${placa(43, 37, 'Estádio')}${placa(84, 33, 'Arena')}${placa(34, 61, 'Museu')}${placa(47, 55, 'Gestão')}${placa(25, 85, 'Campinho')}
      ${selo(47, 50, '1 decisão')}${selo(43, 31, 'jogo sáb 16h')}
    </div>
  </div></div>`

const card = (e, n, s, badge, opts = {}) => `<div style="background:${opts.vago ? 'rgba(244,236,214,.55)' : CREME};border:3px ${opts.vago ? 'dashed' : 'solid'} ${INK};border-radius:14px;box-shadow:3px 3px 0 #000;padding:10px 11px;position:relative">
  ${badge ? `<span style="position:absolute;right:-6px;top:-10px;${OSW};font-size:10.5px;text-transform:uppercase;background:${opts.cor ?? GOLD};color:${opts.corTxt ?? INK};border:2px solid ${INK};border-radius:999px;padding:1px 8px;box-shadow:2px 2px 0 #000">${badge}</span>` : ''}
  <div style="font-size:24px;line-height:1">${e}</div>
  <p style="margin:5px 0 0;${OSW};font-size:15px;text-transform:uppercase">${n}</p>
  <p style="margin:2px 0 0;font:600 11.5px/1.3 system-ui;color:#4a4536">${s}</p></div>`
const CARDS = [
  card('⚽', 'Estádio', 'Campo de várzea · nível 0<br>próximo jogo: sáb 16h em casa', 'dia de jogo'),
  card('📋', 'Gestão', 'Finanças, contratos e patrocínio', '1 decisão'),
  card('🏢', 'Agência', '3 clientes · comissão no fim da temporada'),
  card('🏛️', 'Museu', 'Sala de troféus · 0 taças'),
  card('🛍️', 'Loja', 'Terreno vazio · construir por 300 🪙', 'construir', { vago: true, cor: '#fff' }),
  card('🏠', 'Sua casa', 'Presidente, garagem e carros'),
]
const grade = (cols) => `<p style="margin:16px 0 8px;${OSW};font-size:13px;letter-spacing:.12em;color:#E8C66A">LUGARES DO CLUBE</p>
<div style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:12px">${CARDS.join('')}</div>
<div style="margin-top:14px;${OSW};font-size:15px;text-transform:uppercase;text-align:center;color:${CREME};border:3px solid rgba(244,236,214,.5);border-radius:12px;padding:10px">🚶 Passear pela cidade 3D</div>`

const FONE = `<div style="width:390px;flex:none"><p style="margin:0 0 8px;${OSW};font-size:17px;text-transform:uppercase">📱 Celular</p>
<div style="background:${BG};border:3px solid ${INK};border-radius:22px;padding:18px 16px;box-shadow:5px 5px 0 #000">${topo}${maquete(346)}${grade(2)}</div></div>`
const DESK = `<div style="flex:1"><p style="margin:0 0 8px;${OSW};font-size:17px;text-transform:uppercase">🖥️ Computador</p>
<div style="background:${BG};border:3px solid ${INK};border-radius:22px;padding:22px;box-shadow:5px 5px 0 #000;display:grid;grid-template-columns:520px 1fr;gap:24px;align-items:start">
  <div>${topo}${maquete(500)}</div><div style="padding-top:4px">${grade(2)}</div></div></div>`
const NOTA = `<div style="background:${CREME};border:3px solid ${INK};border-radius:14px;box-shadow:4px 4px 0 #000;padding:14px 18px;margin-bottom:18px">
<p style="margin:0;${OSW};font-size:24px;text-transform:uppercase">🏟️ Aba Clube reformulada: a maquete do clube</p>
<p style="margin:6px 0 0;font:600 14px/1.5 system-ui">Em vez de abrir a <b>cidade inteira</b> dentro de um cartão, a aba vira o <b>painel do seu clube</b>: em cima o que importa (série, caixa, torcida, dia), no meio uma <b>maquete só do terreno do clube</b> (câmera fixa, recortada como peça de tabuleiro, sem grama infinita), e embaixo os <b>lugares em cartões</b> com o status de cada um. Tocar no cartão ou no prédio abre o mesmo lugar. A cidade 3D vira um <b>passeio</b> pra quem quiser.</p></div>`

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}body{margin:0;background:#E9DFC4;padding:22px;font-family:system-ui;width:1350px}</style></head><body>
${NOTA}<div style="display:flex;gap:26px;align-items:flex-start">${FONE}${DESK}</div></body></html>`
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const pg = await b.newPage({ viewport: { width: 1394, height: 900 }, deviceScaleFactor: 2 })
await pg.setContent(html, { waitUntil: 'load' })
await pg.screenshot({ path: 'scripts/mockups/clube-maquete.png', fullPage: true })
await b.close()
console.log('ok scripts/mockups/clube-maquete.png')
