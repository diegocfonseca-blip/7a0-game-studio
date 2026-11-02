// 🏆 MOCKUP (02/11): sala de espera das MINHAS LIGAS reorganizada (Diego: "o minhas ligas também tá muito feio visualmente").
// Mesma informação de hoje, em 3 cartões: 📅 próximo jogo · 🎮 como é a liga (modo + bots + regras) · 👥 técnicos.
//   node scripts/mockup-minhas-ligas-espera.mjs <saida.png>
import { readFileSync } from 'node:fs'
import { chromium } from 'playwright-core'
const OUT = process.argv[2] ?? 'mockup-minhas-ligas-espera.png'
const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6', GREEN = '#1B7A3D'
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const F = [400, 600, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w}}`).join('')
const chip = (t, bg = '#fff') => `<span style="display:inline-block;border:2px solid ${INK};border-radius:9px;padding:4px 8px;font:700 12px Oswald;background:${bg};margin:0 5px 6px 0;text-transform:uppercase">${t}</span>`
const btn = (t, bg = '#fff', fg = INK, flex = 1) => `<div style="flex:${flex};text-align:center;border:2.5px solid ${INK};border-radius:11px;padding:9px 4px;font:700 13px Oswald;background:${bg};color:${fg};box-shadow:2px 2px 0 ${INK};text-transform:uppercase">${t}</div>`
const card = (cab, corpo, bg = '#fff') => `<div style="border:3px solid ${INK};border-radius:18px;background:${bg};box-shadow:4px 4px 0 ${INK};overflow:hidden;margin-bottom:14px">${cab}<div style="padding:12px">${corpo}</div></div>`
const cab = (t, bg = INK, fg = GOLD) => `<p style="margin:0;padding:7px 12px;background:${bg};color:${fg};font:700 12px Oswald;letter-spacing:.1em;text-transform:uppercase">${t}</p>`
const novo = `<div style="width:380px">
  ${card(cab('📅 Próximo jogo', GREEN, '#fff'), `
    <p style="margin:0;font:700 26px Oswald;text-transform:uppercase">Dom, 1/11 · 23:30</p>
    <p style="margin:2px 0 10px;font:700 12px Oswald;color:${GREEN};text-transform:uppercase">⏰ É hoje · faltam 42 min</p>
    <div style="display:flex;gap:6px">${btn('📅 Remarcar')}${btn('+1 dia')}${btn('+1 semana')}</div>`)}
  ${card(cab('🎮 Como é a liga'), `
    <div>${chip('✉️ Envelope único')}${chip('🃏 Jogador')}${chip('🇧🇷 Brasil')}${chip('🏆 Liga + Copa')}${chip('🤖 com bots · 20 times')}${chip('⚖️ por títulos', '#FFF1B8')}</div>
    <div style="display:flex;gap:6px;margin-top:4px">${btn('🔁 Trocar o modo')}${btn('🤖 Tirar bots')}${btn('⚖️ Regras')}</div>
    <p style="margin:8px 0 0;font:600 11px system-ui;color:#666">Só você (dono) vê os botões. Troféus e ranking continuam ao trocar.</p>`)}
  ${card(cab('👥 Técnicos · 1/20'), `
    <div style="display:flex;gap:8px"><div style="flex:1;border:3px solid ${INK};border-radius:12px;padding:8px;background:linear-gradient(135deg,#FFE79A,#FFC400);font:700 14px Oswald">👑 Neymarzetti <span style="font-size:11px">DONO</span></div>
    <div style="flex:1;border:2.5px dashed #999;border-radius:12px;padding:8px;font:600 13px Oswald;color:#888;text-align:center">+ 19 vagas</div></div>`, CREME)}
  <div style="border:3px solid ${INK};border-radius:14px;padding:12px;text-align:center;background:${GREEN};color:#fff;font:700 18px Oswald;box-shadow:4px 4px 0 ${INK}">🔨 ABRIR O PREGÃO!</div>
</div>`
const regras = `<div style="width:380px">
  <p style="font:700 16px Oswald;text-transform:uppercase;margin:0 0 8px">Ao tocar em ⚖️ Regras abre por cima (e fecha):</p>
  ${card(cab('⚖️ O que conta nesta liga'), `
    <div style="display:flex;gap:6px;margin-bottom:10px">${btn('🏆 Por títulos', GOLD)}${btn('🔢 Por pontos')}</div>
    ${[['🏆 Título da liga', 'conta'], ['🏆 Copa', 'conta'], ['⚽ Artilheiro', 'não conta'], ['🔻 Rebaixamento', 'tira 1 título']].map(([a, b]) => `<div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid #eee;padding:8px 2px;font:700 14px Oswald"><span>${a}</span><span style="border:2px solid ${INK};border-radius:8px;padding:2px 8px;background:${b === 'não conta' ? '#fff' : GREEN};color:${b === 'não conta' ? INK : '#fff'};font-size:12px">${b}</span></div>`).join('')}
    <div style="margin-top:8px">${btn('✅ Pronto', GREEN, '#fff')}</div>`)}
</div>`
const html = `<html><head><style>${F}body{margin:0;background:${CREME};padding:22px;font-family:Oswald}</style></head><body>
<div style="font:700 26px Oswald;text-transform:uppercase;margin-bottom:4px">🏆 Minhas Ligas · sala de espera (proposta)</div>
<div style="font:400 14px Oswald;color:#555;margin-bottom:16px">A mesma informação de hoje, em 3 cartões. As regras do ranking saem da tela e abrem só no toque.</div>
<div style="display:flex;gap:28px;align-items:flex-start">${novo}${regras}</div></body></html>`
const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const pg = await br.newPage({ viewport: { width: 880, height: 900 } })
await pg.setContent(html); await pg.evaluate(() => document.fonts.ready)
await pg.screenshot({ path: OUT, fullPage: true }); await br.close()
console.log('✅', OUT)
