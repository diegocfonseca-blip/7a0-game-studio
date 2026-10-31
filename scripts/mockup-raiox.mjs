// 🔎 MOCKUP (31/10): o Raio-X do adversário na Central (o mesmo cartão de central.tsx `CartaoRaioX`).
import { readFileSync } from 'node:fs'
import { chromium } from 'playwright-core'
const OUT = process.argv[2] ?? 'mockup-raiox.png'
const INK = '#0C0C0C', CREME = '#F4ECD6', GOLD = '#FFC400'
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const F = [400, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w}}`).join('')
const bola = c => `<i style="display:inline-block;width:9px;height:9px;border-radius:50%;margin:0 1.5px;border:1.5px solid ${INK};background:${c === 'V' ? '#2FBF5A' : c === 'E' ? GOLD : '#E8503A'}"></i>`
const lin = (r, v) => `<div style="display:flex;gap:8px;padding:6px 11px;font:800 11.5px system-ui;border-top:1px solid rgba(0,0,0,.1);align-items:center"><span style="width:92px;color:#6a6250">${r}</span><span style="flex:1">${v}</span></div>`
const top = [['Ronaldinho Gaúcho', 'Atlético-MG 2013', '👑 Lenda'], ['Diego Tardelli', 'Atlético-MG 2014', '⭐ Craque'], ['Réver', 'Atlético-MG 2013', '🎯 Bom']]
const card = `<div style="border:3px solid ${INK};border-radius:16px;overflow:hidden;background:${CREME};box-shadow:4px 4px 0 #000;width:380px;color:${INK}">
 <div style="display:flex;justify-content:space-between;align-items:center;padding:9px 13px;background:${INK};color:#fff"><b style="font:700 15px Oswald;letter-spacing:.08em;text-transform:uppercase">🔎 Raio-X do adversário</b><small style="font:800 9.5px system-ui;opacity:.75">Galo Doido FC</small></div>
 ${lin('Formação', '4-2-4 <span style="color:#6a6250;font-weight:700">· ⚽ Ofensivas</span>')}
 ${lin('Últimos 5', 'VVEDV'.split('').map(bola).join(''))}
 ${lin('Cansaço', '😓 2 titulares cansados · 🔁 vai poupar 1')}
 <div style="padding:7px 11px 9px;border-top:1px solid rgba(0,0,0,.1)"><small style="font:700 10px Oswald;letter-spacing:.08em;color:#7a7462;text-transform:uppercase">Os 3 melhores</small>
 ${top.map(([n, c, k], i) => `<div style="display:flex;gap:7px;margin-top:4px;font:11.5px system-ui;align-items:center"><span style="width:16px">${['🥇', '🥈', '🥉'][i]}</span><b style="flex:1">${n} <span style="font-weight:700;color:#6a6250">· ${c}</span></b><span style="font-size:10px;font-weight:900">${k}</span></div>`).join('')}</div></div>`
const html = `<html><head><style>${F}body{margin:0;background:#141210;padding:20px;width:440px;font-family:Oswald;color:#fff}</style></head><body>
<div style="font:700 13px Oswald;color:${GOLD};letter-spacing:.16em">TEMPORADA 12 · SÉRIE B</div><div style="font:700 26px Oswald;text-transform:uppercase;margin-bottom:12px">📺 Central Legends</div>
<div style="border:3px solid #847657;border-radius:16px;height:120px;background:linear-gradient(#1d3a26,#0c0c0c);display:flex;align-items:center;justify-content:center;font:700 18px Oswald;margin-bottom:12px;text-transform:uppercase">⚽ Próximo jogo · Você × Galo Doido FC</div>
${card}
<div style="font:400 12px system-ui;color:#aaa;margin-top:10px">Logo abaixo do próximo jogo. Só aparece em jogo de liga.</div></body></html>`
const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const pg = await br.newPage({ viewport: { width: 480, height: 600 }, deviceScaleFactor: 2 })
await pg.setContent(html); await pg.evaluate(() => document.fonts.ready)
await pg.screenshot({ path: OUT, fullPage: true }); await br.close(); console.log('✅', OUT)
