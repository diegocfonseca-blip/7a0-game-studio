// 📏 MOCKUP (02/11): Minha Liga Draft — criar: bots (sem bots = mín. 4) + tamanho (usuários + bots = N times)
//   node scripts/mockup-minha-tamanho.mjs <saida.png>
import { readFileSync } from 'node:fs'
import { chromium } from 'playwright-core'
const OUT = process.argv[2] ?? 'mockup-minha-tamanho.png'
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const F = [400, 600, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w}}`).join('')
const seg = (a, b, sel) => `<div style="display:flex;gap:8px">${[a, b].map((t, i) => `<div style="flex:1;text-align:center;border:2.5px solid #000;border-radius:10px;padding:9px 4px;font:700 13px Oswald;background:${i === sel ? '#FFC400' : '#F4ECD6'};box-shadow:${i === sel ? '2px 2px 0 #000' : 'none'}">${t}</div>`).join('')}</div>`
const lbl = t => `<p style="font:700 11px Oswald;letter-spacing:.08em;color:rgba(255,255,255,.55);text-transform:uppercase;margin:14px 0 6px">${t}</p>`
const painel = (comBots, tam) => `<div style="background:#1a1712;border:3px solid #000;border-radius:18px;padding:14px;width:360px;box-sizing:border-box">
  ${lbl('🤖 Bots na tabela')}${seg('🤖 Com bots', '🚫 Sem bots (mín. 4 pessoas)', comBots ? 0 : 1)}
  ${comBots ? `${lbl('📏 Tamanho da liga')}${seg('20 times (padrão)', '10 times', tam === 20 ? 0 : 1)}
  <div style="margin-top:8px;border:2px solid #000;border-radius:12px;padding:8px 10px;background:rgba(255,255,255,.08)">
    <p style="margin:0;color:#fff;font:700 13px Oswald">👤 Usuários + 🤖 bots = ${tam} times</p>
    <p style="margin:2px 0 0;color:rgba(255,255,255,.6);font:600 11px system-ui">${tam === 10 ? 'Ex.: 3 de vocês + 7 bots. Cabem até 10 pessoas. Temporada de 18 rodadas.' : 'Ex.: 3 de vocês + 17 bots. Cabem até 20 pessoas. Temporada de 38 rodadas.'}</p></div>`
  : `<div style="margin-top:8px;border:2px solid #000;border-radius:12px;padding:8px 10px;background:#FFE7A3">
    <p style="margin:0;font:700 13px Oswald">⚠️ Sem bots só vale com 4 pessoas ou mais</p>
    <p style="margin:2px 0 0;color:rgba(0,0,0,.7);font:600 11px system-ui">A tabela fica só com vocês. Se começarem com menos de 4, a liga entra com bots sozinha (até 20 times).</p></div>`}
</div>`
const html = `<html><head><style>${F}body{margin:0;background:#F4ECD6;padding:20px;font-family:Oswald}</style></head><body>
<div style="font:700 24px Oswald;text-transform:uppercase;margin-bottom:12px">📋 Minha Liga Draft · criar</div>
<div style="display:flex;gap:16px">${painel(true, 20)}${painel(true, 10)}${painel(false, 20)}</div></body></html>`
const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const pg = await br.newPage({ viewport: { width: 1160, height: 500 } })
await pg.setContent(html); await pg.evaluate(() => document.fonts.ready)
await pg.screenshot({ path: OUT, fullPage: true }); await br.close()
console.log('✅', OUT)
