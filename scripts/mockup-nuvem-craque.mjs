// ☁️⭐ NUVEM SÓ PRO CRAQUE (07/10) — mockup do aviso pra quem é grátis, nos 2 lugares onde se salva:
// a faixa 💾 da Central (topo da carreira) e o botão "Sair e salvar carreira".
// Rodar: node scripts/mockup-nuvem-craque.mjs <pasta>
import { chromium } from 'playwright-core'
import { readFileSync } from 'node:fs'
const OUT = process.argv[2] || '/tmp'
const ow = w => `@font-face{font-family:Oswald;font-weight:${w};src:url(data:font/woff2;base64,${readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')})}`
const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6'
const OSW = 'font-family:Oswald,system-ui;text-transform:uppercase'
const faixa = (texto, cor, botao2) => `<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:7px 8px 7px 12px;border:2px solid rgba(255,196,0,.35);border-radius:12px;background:rgba(255,255,255,.05);margin-bottom:10px">
  <span style="${OSW};font-weight:600;font-size:11px;letter-spacing:.05em;color:${cor};line-height:1.25">${texto}</span>
  <span style="display:flex;gap:6px;flex:none">${botao2 ? `<button style="${OSW};font-weight:700;font-size:11px;color:#fff;background:#7C3AED;border:2px solid ${INK};border-radius:10px;padding:7px 9px;box-shadow:2px 2px 0 #000">⭐ Craque</button>` : ''}
  <button style="${OSW};font-weight:700;font-size:12px;color:${INK};background:${GOLD};border:2px solid ${INK};border-radius:10px;padding:7px 12px;box-shadow:2px 2px 0 #000">💾 Salvar</button></span></div>`
const rot = t => `<p style="font:800 10px system-ui;color:rgba(255,255,255,.55);margin:14px 0 6px;letter-spacing:.06em;text-transform:uppercase">${t}</p>`
const html = `<!doctype html><meta charset="utf-8"><style>${[500, 600, 700].map(ow).join('')}*{box-sizing:border-box;margin:0}body{width:390px;background:#15110c;padding:14px;font-family:system-ui}</style>
<p style="${OSW};font-weight:700;color:${GOLD};font-size:16px;margin-bottom:4px">📺 Central Legends — faixa de salvar</p>
${rot('Pagante (Craque/Lenda/Batismo) — igual hoje')}
${faixa('☁️ Salvo na nuvem há 5 min · tudo em dia', '#4ADE80')}
${rot('Grátis, carreira NOVA — antes de salvar')}
${faixa('📱 Esta carreira salva só neste aparelho · ☁️ a nuvem é do ⭐ Craque', '#FFB020', true)}
${rot('Grátis, carreira NOVA — depois de apertar Salvar')}
${faixa('✅ Salvo no aparelho · pra guardar na nuvem e jogar em outro celular: ⭐ Craque', '#4ADE80', true)}
${rot('Grátis com carreira que JÁ estava na nuvem — igual hoje')}
${faixa('☁️ Salvo na nuvem há 2 h · 3 rodadas desde então', '#FFB020')}
<div style="background:${CREME};border-radius:14px;padding:14px;margin-top:16px">
<p style="${OSW};font-weight:700;font-size:13px;margin-bottom:8px">🚪 Botão do pé da página (grátis, carreira nova)</p>
<div style="width:100%;border:3px solid ${INK};border-radius:14px;padding:11px 13px;background:#fff;box-shadow:4px 4px 0 0 ${INK};text-align:center">
 <span style="${OSW};font-weight:700;font-size:14px">🚪 Sair e salvar carreira</span>
 <span style="display:block;font-size:9.5px;font-weight:700;color:#5a5647;margin-top:2px">Fica salva neste aparelho. Pra guardar na nuvem e continuar em outro celular, só no ⭐ Craque.</span>
</div></div>`
const br = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const pg = await br.newPage({ viewport: { width: 390, height: 700 }, deviceScaleFactor: 2 })
await pg.setContent(html); await pg.waitForTimeout(300)
await pg.screenshot({ path: `${OUT}/nuvem-craque.png`, fullPage: true }); await br.close(); console.log(`${OUT}/nuvem-craque.png`)
