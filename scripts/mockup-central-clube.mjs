// ─── 🏠 MOCKUP: A CENTRAL DO CLUBE (Diego 01/10) ──────────────────────────────
//
// Pedido dele: *"tá faltando uma central… uma home do jogo ali, onde tem o jogo, ou
// você pode ver alguma outra coisa… esse pré-partida"*. É a tela que todo manager
// tem: a casa da carreira, com o PRÓXIMO JOGO no meio e o resto do clube em volta.
// ⚠️ SÓ DESENHO — nada disto está no jogo.
//   node scripts/mockup-central-clube.mjs [--saida central.png] [--desk]
import { chromium } from 'playwright-core'
import { readFileSync } from 'node:fs'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const DESK = process.argv.includes('--desk')
const SAIDA = arg('--saida', DESK ? 'central-desk.png' : 'central.png')
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')
const img = p => `data:image/webp;base64,${readFileSync(p).toString('base64')}`
const ESC_EU = img('src/escalacao/img/bagres-escudo.webp')

const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D', RED = '#C2452F', CREME = '#F4ECD6', BLUE = '#2F6BAE'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'
const box = (bg = '#fff', extra = '') => `background:${bg};border:3px solid ${INK};border-radius:14px;box-shadow:4px 4px 0 ${INK};${extra}`
const rot = t => `<p style="margin:0 0 7px;${OSW};font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:rgba(12,12,12,.55)">${t}</p>`
const pill = (t, bg = '#fff', fg = INK) => `<span style="${OSW};font-size:10.5px;border:2px solid ${INK};border-radius:999px;padding:3px 9px;background:${bg};color:${fg};white-space:nowrap">${t}</span>`
const forma = s => s.split('').map(c => `<span style="display:inline-block;width:17px;height:17px;line-height:15px;text-align:center;border:1.5px solid ${INK};border-radius:5px;${OSW};font-size:9.5px;color:#fff;background:${c === 'V' ? GREEN : c === 'E' ? '#8a8a8a' : RED}">${c}</span>`).join(' ')
const escudo = (letra, bg) => `<div style="width:62px;height:62px;border-radius:50%;background:${bg};border:3px solid ${INK};box-shadow:3px 3px 0 ${INK};display:flex;align-items:center;justify-content:center;${OSW};font-size:26px;color:#fff;text-shadow:1px 1px 0 #000">${letra}</div>`

// ── blocos ────────────────────────────────────────────────────────────────────
const TOPO = `
<div style="${box('linear-gradient(120deg,#0C0C0C,#1b2a1f)', 'padding:12px 13px;color:#fff')}">
  <div style="display:flex;align-items:center;gap:10px">
    <img src="${ESC_EU}" style="width:44px;height:44px;object-fit:contain">
    <div style="flex:1;min-width:0">
      <p style="margin:0;${OSW};font-size:17px;text-transform:uppercase;line-height:1">Nova Eclipse</p>
      <p style="margin:3px 0 0;font-weight:700;font-size:10.5px;color:${GOLD}">TEMPORADA 1 · VÁRZEA · RODADA 22/38</p>
    </div>
    <div style="text-align:right">
      <p style="margin:0;${OSW};font-size:17px;color:${GOLD}">💰 104</p>
      <p style="margin:0;font-weight:700;font-size:9.5px;opacity:.75">19º · 😐 torcida 45%</p>
    </div>
  </div>
</div>`

const PROXIMO = `
<div style="${box('#fff', 'padding:12px 13px;position:relative;overflow:hidden')}">
  <div style="position:absolute;inset:0;background:repeating-linear-gradient(90deg,transparent 0 38px,rgba(27,122,61,.06) 38px 76px);pointer-events:none"></div>
  ${rot('⚽ próximo jogo · rodada 22 · em casa')}
  <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;position:relative">
    <div style="text-align:center;width:112px"><img src="${ESC_EU}" style="width:62px;height:62px;object-fit:contain;filter:drop-shadow(3px 3px 0 ${INK})"><p style="margin:5px 0 0;${OSW};font-size:13px;line-height:1.05">Nova Eclipse</p><p style="margin:2px 0 0;font-weight:800;font-size:9px;color:rgba(12,12,12,.5)">19º · VOCÊ</p><p style="margin:4px 0 0">${forma('DDVED')}</p></div>
    <div style="text-align:center"><p style="margin:0;${OSW};font-size:30px;line-height:1">×</p><p style="margin:2px 0 0;${OSW};font-size:10px;color:rgba(12,12,12,.5)">Vila Esperança</p><p style="margin:0;font-weight:700;font-size:9px;color:rgba(12,12,12,.4)">🏟️ 12.000 esperados</p></div>
    <div style="text-align:center;width:112px">${escudo('T', '#6B2FA3')}<p style="margin:5px 0 0;${OSW};font-size:13px;line-height:1.05">Trave Torta EC</p><p style="margin:2px 0 0;font-weight:800;font-size:9px;color:rgba(12,12,12,.5)">2º · G4</p><p style="margin:4px 0 0">${forma('VVVEV')}</p></div>
  </div>
  <div style="margin-top:10px;background:${CREME};border:2px solid ${INK};border-radius:10px;padding:8px 10px;position:relative">
    <p style="margin:0;font-weight:700;font-size:11.5px;line-height:1.45">📰 <b>O Trave Torta chega embalado</b>: 4 vitórias nos últimos 5 e o artilheiro Victor Boniface (13 gols). Do seu lado, o <b>Zé Love fez 3 em 2 jogos</b> — e a torcida quer ver ele de novo.</p>
  </div>
  <div style="display:flex;gap:7px;margin-top:10px;position:relative">
    <span style="flex:1.4;${OSW};font-size:14px;text-align:center;text-transform:uppercase;background:${GREEN};color:#fff;border:3px solid ${INK};border-radius:11px;box-shadow:3px 3px 0 ${INK};padding:10px 6px">▶ Jogar a rodada</span>
    <span style="flex:1;${OSW};font-size:12px;text-align:center;text-transform:uppercase;background:#fff;border:3px solid ${INK};border-radius:11px;box-shadow:3px 3px 0 ${INK};padding:10px 6px">⚔️ Tática<br><span style="font-size:9px;font-weight:600;color:${BLUE}">⚖️ equilíbrio · 4-3-3</span></span>
  </div>
</div>`

const ELENCO = `
<div style="${box('#fff', 'padding:11px 12px')}">
  ${rot('👥 como o time chega')}
  <div style="display:flex;flex-wrap:wrap;gap:6px">
    ${pill('😓 2 cansados', '#FFF4D6')}${pill('🚑 Fabrício · volta em 3 jogos', '#FFE3DE')}${pill('🟨 ninguém suspenso', '#EAFAEF')}${pill('📝 2 contratos vencem no fim', '#EAF3FF')}
  </div>
  <p style="margin:8px 0 0;font-weight:700;font-size:10.5px;color:rgba(12,12,12,.6)">🔁 Rodízio sugerido: <b>Digão</b> sai, <b>Felipe Bastos</b> entra · <u>ver elenco</u></p>
</div>`

const CAIXA = `
<div style="${box('#fff', 'padding:11px 12px')}">
  ${rot('💰 caixa do clube')}
  <div style="display:flex;gap:6px;text-align:center">
    <div style="flex:1;background:${CREME};border:2px solid ${INK};border-radius:10px;padding:6px 4px"><b style="${OSW};font-size:17px">104</b><br><span style="font-weight:800;font-size:8.5px;text-transform:uppercase;opacity:.6">em caixa</span></div>
    <div style="flex:1;background:${CREME};border:2px solid ${INK};border-radius:10px;padding:6px 4px"><b style="${OSW};font-size:17px;color:${RED}">−12</b><br><span style="font-weight:800;font-size:8.5px;text-transform:uppercase;opacity:.6">folha / temp.</span></div>
    <div style="flex:1;background:${CREME};border:2px solid ${INK};border-radius:10px;padding:6px 4px"><b style="${OSW};font-size:17px;color:${GREEN}">+20</b><br><span style="font-weight:800;font-size:8.5px;text-transform:uppercase;opacity:.6">bilheteria</span></div>
  </div>
  <p style="margin:8px 0 0;font-weight:700;font-size:10.5px;color:rgba(12,12,12,.6)">🏆 Master: <b>Bet da Esquina</b> · 3 temporadas · 👟 Naique</p>
</div>`

const MANCHETES = `
<div style="${box('#fff', 'padding:11px 12px')}">
  ${rot('📰 o martelo · giro da rodada')}
  <div style="display:flex;flex-direction:column;gap:6px">
    ${[['🔥', '<b>Neymarzetti</b> abre 2 pontos na ponta da Várzea'], ['🥅', 'Malcom (Espeto Corrido) chega a <b>14 gols</b> e lidera a artilharia'], ['🚨', 'Você está no <b>Z4</b> — faltam 16 rodadas, 3 pontos pra sair'], ['🏆', 'Copa do Brasil Legends: <b>oitavas</b> começam na rodada 24']].map(([e, t]) => `<p style="margin:0;font-weight:700;font-size:11.5px;line-height:1.4;padding-left:4px;border-left:3px solid ${GOLD}">${e} ${t}</p>`).join('')}
  </div>
</div>`

const ATALHOS = `
<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:7px">
  ${[['📊', 'Tabela', '19º'], ['🏆', 'Rank', 'Malcom 14'], ['🏟️', 'Clube', 'nível 0'], ['🛒', 'Loja', '3 camisas']].map(([e, t, s]) => `<div style="${box('#fff', 'padding:8px 4px;text-align:center;box-shadow:3px 3px 0 ' + INK)}"><span style="font-size:20px">${e}</span><p style="margin:3px 0 0;${OSW};font-size:11px;text-transform:uppercase">${t}</p><p style="margin:0;font-weight:700;font-size:8.5px;color:rgba(12,12,12,.5)">${s}</p></div>`).join('')}
</div>`

const TORCIDA = `
<div style="${box('linear-gradient(150deg,#FFF6DE,#FFE7A8)', 'padding:10px 12px')}">
  <p style="margin:0;${OSW};font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:rgba(12,12,12,.6)">📣 recado da arquibancada</p>
  <p style="margin:5px 0 0;font-family:Georgia,serif;font-style:italic;font-size:12.5px;line-height:1.45">“Professor, é o 2º colocado em casa. Perdeu, a gente leva o churrasco pro Trave Torta.”</p>
</div>`

const NAV = `
<div style="display:flex;justify-content:space-around;border-top:2px solid rgba(12,12,12,.15);background:#faf7ee;padding:8px 4px 10px;margin:0 -15px -18px">
  ${[['🏠', 'Central', true], ['🗓️', 'Jogos'], ['📊', 'Tabelas'], ['👥', 'Elenco'], ['🏆', 'Rank'], ['🏟️', 'Clube']].map(([e, t, on]) => `<div style="text-align:center;${on ? `color:${GREEN}` : 'color:#777'}"><span style="font-size:18px;${on ? '' : 'filter:grayscale(1);opacity:.7'}">${e}</span><p style="margin:0;${OSW};font-size:8.5px;text-transform:uppercase">${t}</p></div>`).join('')}
</div>`

const corpoFone = `<div class="fone"><div class="corpo">
  <div class="pilha">${TOPO}${PROXIMO}${ELENCO}${CAIXA}${MANCHETES}${ATALHOS}${TORCIDA}</div>
  ${NAV}
</div></div>`

const corpoDesk = `<div class="desk">
  <div style="${box('#faf7ee', 'padding:8px 10px;margin-bottom:14px;display:flex;justify-content:space-around;box-shadow:none')}">
    ${[['🏠', 'Central', true], ['🗓️', 'Jogos'], ['📊', 'Tabelas'], ['👥', 'Elenco'], ['🏆', 'Rank'], ['🏟️', 'Clube']].map(([e, t, on]) => `<div style="text-align:center;${on ? `color:${GREEN}` : 'color:#777'}"><span style="font-size:20px;${on ? '' : 'filter:grayscale(1);opacity:.7'}">${e}</span><p style="margin:0;${OSW};font-size:9.5px;text-transform:uppercase">${t}</p></div>`).join('')}
  </div>
  <div style="display:grid;grid-template-columns:360px 1fr 320px;gap:16px;align-items:start">
    <div class="pilha">${TOPO}${CAIXA}${ELENCO}${TORCIDA}</div>
    <div class="pilha">${PROXIMO}${ATALHOS}</div>
    <div class="pilha">${MANCHETES}</div>
  </div>
</div>`

const html = `<!doctype html><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box} body{margin:0;background:#cfc8b4;font-family:system-ui,-apple-system,sans-serif;color:${INK};padding:20px 0}
.fone{width:430px;margin:0 auto;background:${CREME};border:3px solid ${INK};border-radius:20px;overflow:hidden}
.corpo{padding:14px 15px 18px}
.pilha{display:flex;flex-direction:column;gap:12px}
.desk{width:1240px;margin:0 auto;background:${CREME};border:3px solid ${INK};border-radius:20px;padding:16px 18px 22px}
</style><body>${DESK ? corpoDesk : corpoFone}</body>`

const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const page = await browser.newPage({ viewport: { width: DESK ? 1290 : 470, height: 900 }, deviceScaleFactor: 2 })
await page.setContent(html)
await page.evaluate(() => document.fonts.ready)
await page.waitForTimeout(300)
await page.screenshot({ path: SAIDA, fullPage: true })
await browser.close()
console.log(SAIDA)
