// 📺 MOCKUP (01/11): MODO TRANSMISSÃO — o link pro OBS de quem faz live (ideia 5 de docs/ideias-online-grandes.md).
// Duas telas 16:9: durante o LEILÃO e durante os JOGOS. Só o que o público precisa, em letra grande, sem botão.
//   node scripts/mockup-modo-transmissao.mjs <saida.png>
import { readFileSync } from 'node:fs'
import { chromium } from 'playwright-core'

const OUT = process.argv[2] ?? 'mockup-modo-transmissao.png'
const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6', GREEN = '#1B7A3D', RED = '#E8503A', PURPLE = '#7C3AED'
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const F = [400, 600, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w}}`).join('')
const esc = n => `data:image/webp;base64,${readFileSync(`public/escudos-clubes/${n}.webp`).toString('base64')}`
const box = (extra = '') => `background:#fff;border:4px solid ${INK};border-radius:18px;box-shadow:5px 5px 0 #000;${extra}`

const topo = (fase) => `<div style="display:flex;align-items:center;gap:14px;background:${INK};color:#fff;padding:10px 22px;border-bottom:4px solid ${GOLD}">
  <b style="font:700 26px Oswald;color:${GOLD};letter-spacing:.04em">🔨 LEILÃO LEGENDS</b>
  <span style="font:700 15px Oswald;background:${RED};padding:3px 10px;border-radius:8px">● AO VIVO</span>
  <span style="font:600 20px Oswald;opacity:.9">Tropa do Paizão · 12 técnicos</span>
  <span style="margin-left:auto;font:700 20px Oswald;background:${GOLD};color:${INK};padding:3px 12px;border-radius:8px">${fase}</span>
  <span style="font:600 16px Oswald;opacity:.75">leilaolegends.com</span></div>`

const tabela = (linhas) => `<div style="${box('padding:0;overflow:hidden')}">
  <div style="background:${INK};color:${GOLD};font:700 20px Oswald;padding:8px 14px;letter-spacing:.06em">📊 TABELA</div>
  ${linhas.map(([n, p, eu], i) => `<div style="display:flex;gap:10px;align-items:center;padding:7px 14px;font:600 19px Oswald;border-top:2px solid #eee;${eu ? `background:#FFF3C4` : ''}"><span style="width:26px;color:#888">${i + 1}º</span><span style="flex:1">${n}</span><b>${p}</b></div>`).join('')}</div>`

const chat = `<div style="${box('padding:0;overflow:hidden')}">
  <div style="background:${INK};color:${GOLD};font:700 20px Oswald;padding:8px 14px;letter-spacing:.06em">💬 CHAT DA SALA</div>
  ${[['Corneta', 'esse Romário é meu, ninguém encosta 😤'], ['Gui', 'CHUVA DE DINHEIRO 💸💸'], ['Rubão FC', 'blefe, ele não tem 40'], ['Noronha FC', 'QUASE! 🔨']].map(([n, t]) => `<div style="padding:7px 14px;font:500 17px system-ui;border-top:2px solid #eee"><b style="font:700 17px Oswald">${n}:</b> ${t}</div>`).join('')}</div>`

const rodape = `<div style="display:flex;align-items:center;gap:12px;background:${INK};color:#fff;padding:8px 22px;border-top:4px solid ${GOLD};font:600 18px Oswald">
  <span style="background:${GOLD};color:${INK};padding:2px 10px;border-radius:6px">📣 TELÃO</span>
  <span>Jogue também: <b style="color:${GOLD}">leilaolegends.com</b> · entra na sala pelo código <b style="color:${GOLD}">NXVJBW</b></span></div>`

// 1 — LEILÃO
const leilao = `<div class="tela">${topo('🔨 LEILÃO · ATACANTES')}
<div style="flex:1;display:grid;grid-template-columns:1.25fr 1fr;gap:20px;padding:20px">
  <div style="display:flex;flex-direction:column;gap:18px">
    <div style="${box(`background:linear-gradient(160deg,#1a1508,#0C0C0C);color:#fff;padding:22px;display:flex;gap:24px;align-items:center`)}">
      <div style="width:220px;height:300px;border:4px solid ${GOLD};border-radius:16px;background:linear-gradient(150deg,#FFE79A,#FFC400 45%,#E8A200);display:flex;flex-direction:column;align-items:center;justify-content:center;color:${INK};box-shadow:4px 4px 0 #000">
        <div style="font:700 15px Oswald;letter-spacing:.1em">👑 LENDA</div><div style="font:700 34px Oswald;margin:8px 0">ROMÁRIO</div><div style="font:600 17px Oswald">Vasco · 2000</div><div style="font:700 15px Oswald;margin-top:16px;background:${INK};color:${GOLD};padding:3px 10px;border-radius:7px">ATA</div></div>
      <div style="flex:1">
        <div style="font:600 18px Oswald;color:${GOLD};letter-spacing:.08em">LANCE ATUAL</div>
        <div style="font:700 92px Oswald;line-height:1">41 🪙</div>
        <div style="font:600 26px Oswald;margin-top:6px">de <span style="color:${GOLD}">Corneta</span></div>
        <div style="margin-top:18px;display:flex;align-items:center;gap:12px"><span style="font:700 22px Oswald;background:${RED};padding:4px 14px;border-radius:9px">🔨 MARTELO EM 3s</span><span style="font:500 17px Oswald;opacity:.75">3 técnicos disputando</span></div>
      </div>
    </div>
    <div style="${box('padding:0;overflow:hidden')}">
      <div style="background:${INK};color:${GOLD};font:700 20px Oswald;padding:8px 14px;letter-spacing:.06em">✅ ÚLTIMOS ARREMATES</div>
      ${[['Ronaldo Fenômeno', 'Paizão', 58], ['Adriano Imperador', 'Gui', 33], ['Edmundo', 'Rubão FC', 27]].map(([c, t, v]) => `<div style="display:flex;padding:8px 14px;font:600 19px Oswald;border-top:2px solid #eee"><span style="flex:1">${c} <span style="color:#777">→ ${t}</span></span><b>${v} 🪙</b></div>`).join('')}
    </div>
  </div>
  <div style="display:flex;flex-direction:column;gap:18px">
    <div style="${box('padding:14px 16px')}"><div style="font:700 20px Oswald;letter-spacing:.06em">💰 QUEM TEM MAIS DINHEIRO</div>
      ${[['Noronha FC', 212], ['Corneta', 188], ['Paizão', 151]].map(([n, v]) => `<div style="display:flex;font:600 19px Oswald;margin-top:6px"><span style="flex:1">${n}</span><b>${v} 🪙</b></div>`).join('')}</div>
    ${chat}
  </div>
</div>${rodape}</div>`

// 2 — JOGOS
const placar = (a, ea, ga, gb, eb, b, min, ok) => `<div style="${box(`padding:12px 16px;display:flex;align-items:center;gap:12px;${ok ? `background:#FFF3C4` : ''}`)}">
  <img src="${esc(ea)}" style="height:44px"><b style="font:700 24px Oswald;flex:1">${a}</b>
  <b style="font:700 40px Oswald;background:${INK};color:${CREME};padding:0 16px;border-radius:10px">${ga} × ${gb}</b>
  <b style="font:700 24px Oswald;flex:1;text-align:right">${b}</b><img src="${esc(eb)}" style="height:44px">
  <span style="font:600 16px Oswald;color:${RED};width:50px;text-align:right">${min}'</span></div>`
const jogos = `<div class="tela">${topo('⚽ RODADA 14 / 38')}
<div style="flex:1;display:grid;grid-template-columns:1.25fr 1fr;gap:20px;padding:20px">
  <div style="display:flex;flex-direction:column;gap:12px">
    <div style="font:700 22px Oswald;color:${GOLD};letter-spacing:.06em">AO VIVO · JOGOS DA RODADA</div>
    ${placar('Paizão', 'flamengo', 2, 1, 'corinthians', 'Corneta', 67, true)}
    ${placar('Gui', 'palmeiras', 0, 0, 'santos', 'Rubão FC', 67, false)}
    ${placar('Noronha FC', 'gremio', 3, 2, 'internacional', 'Spfcb', 67, false)}
    <div style="${box(`background:${PURPLE};color:#fff;padding:12px 16px;font:600 20px Oswald`)}">⚽ GOL! Romário, de bico, no canto — Corneta 1 × 2 Paizão (58')</div>
  </div>
  <div style="display:flex;flex-direction:column;gap:18px">
    ${tabela([['Noronha FC', 31], ['Paizão', 29, true], ['Corneta', 27], ['Gui', 24], ['Rubão FC', 22], ['Spfcb', 19]])}
    <div style="${box('padding:14px 16px')}"><div style="font:700 20px Oswald;letter-spacing:.06em">⚽ ARTILHARIA</div>
      ${[['Romário', 'Corneta', 12], ['Ronaldo Fenômeno', 'Paizão', 11], ['Adriano', 'Gui', 9]].map(([n, t, g]) => `<div style="display:flex;font:600 19px Oswald;margin-top:6px"><span style="flex:1">${n} <span style="color:#777">· ${t}</span></span><b>${g}</b></div>`).join('')}</div>
  </div>
</div>${rodape}</div>`

const html = `<html><head><style>${F}body{margin:0;background:#2b2b2b;padding:30px;font-family:Oswald;width:1340px}
.tela{width:1280px;height:720px;background:${CREME};display:flex;flex-direction:column;overflow:hidden;border-radius:6px;box-shadow:0 10px 30px #0008;margin-bottom:34px;color:${INK}}
.leg{color:#fff;font:700 24px Oswald;margin:0 0 10px;text-transform:uppercase}</style></head><body>
<div class="leg">1 · Durante o leilão (o que a live mostra)</div>${leilao}
<div class="leg">2 · Durante os jogos</div>${jogos}
<div style="color:#ccc;font:400 17px system-ui;line-height:1.5">O streamer abre um link separado no PC e põe no OBS. Ele continua jogando no celular normalmente.<br>Sem botão nenhum na tela, tudo grande, e o endereço do jogo sempre à vista.</div>
</body></html>`
const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const pg = await br.newPage({ viewport: { width: 1400, height: 900 } })
await pg.setContent(html); await pg.evaluate(() => document.fonts.ready)
await pg.screenshot({ path: OUT, fullPage: true }); await br.close()
console.log('✅', OUT)
