// 🔥 CALDEIRÃO (07/10) — mockups: 1) o STORIES da novidade (1080×1920) · 2) o quadro na aba Clube
// (celular, abaixo do desenho do estádio). Números medidos no motor (scratch caldeirao.mjs):
// lotado = empurrão de casa ×2,1 ≈ +2 pts/temporada · vazio = sem empurrão ≈ −2 · meio-termo = igual hoje.
// Rodar: node scripts/mockup-caldeirao.mjs <pasta-de-saída>
import { chromium } from 'playwright-core'
import { readFileSync } from 'node:fs'

const OUT = process.argv[2] || '/tmp'
const img = k => `data:image/webp;base64,${readFileSync(`src/escalacao/img/${k}`).toString('base64')}`
const ESTADIO = img('online-estadio-v25.webp')
const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6', VERDE = '#1B7A3D', VERM = '#C2452F'
// a Oswald vem de scripts/fonts (a rede do ambiente bloqueia o Google Fonts)
const ow = w => `@font-face{font-family:Oswald;font-weight:${w};src:url(data:font/woff2;base64,${readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')})}`
const fonte = `<style>${[500, 600, 700].map(ow).join('')}</style>`

const stories = `<!doctype html><meta charset="utf-8">${fonte}<style>
 *{box-sizing:border-box;margin:0}
 body{background:${CREME};font-family:Oswald,system-ui;color:${INK};width:1080px;height:1920px;padding:80px 60px 60px;display:flex;flex-direction:column}
 .sel{align-self:flex-start;background:${VERM};color:#fff;font-size:26px;font-weight:700;letter-spacing:2px;text-transform:uppercase;padding:10px 22px;border-radius:12px;border:4px solid ${INK};box-shadow:6px 6px 0 ${INK};margin-bottom:26px}
 h1{font-size:118px;font-weight:700;text-transform:uppercase;line-height:.9;letter-spacing:-2px}
 h1 span{color:${VERM}}
 .lead{font-size:36px;font-weight:600;line-height:1.3;margin:18px 0 34px;color:#333}
 .foto{height:470px;border:5px solid ${INK};border-radius:26px;box-shadow:8px 8px 0 ${INK};background:url(${ESTADIO}) center/cover;position:relative;overflow:hidden;margin-bottom:34px}
 .foto::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0) 45%,rgba(0,0,0,.75))}
 .foto b{position:absolute;left:28px;bottom:22px;z-index:2;color:#fff;font-size:46px;font-weight:700;text-transform:uppercase;text-shadow:3px 3px 0 ${INK}}
 .linha{display:flex;align-items:center;gap:22px;background:#fff;border:5px solid ${INK};border-radius:22px;box-shadow:7px 7px 0 ${INK};padding:24px 26px;margin-bottom:22px}
 .linha .e{font-size:62px;flex:none;width:80px;text-align:center}
 .linha b{display:block;font-size:40px;font-weight:700;line-height:1.05;text-transform:uppercase}
 .linha span{display:block;font-size:27px;font-weight:600;color:#555;margin-top:4px;line-height:1.25}
 .pe{margin-top:auto;text-align:center;font-size:30px;font-weight:800;color:#555}
 .pe b{color:${INK}}
</style>
<div class="sel">🆕 Novidade na carreira</div>
<h1>🔥 O <span>Caldeirão</span></h1>
<p class="lead">Agora a sua torcida joga junto. Estádio cheio empurra o seu time nos jogos em casa.</p>
<div class="foto"><b>Casa cheia, time com sangue nos olhos</b></div>
<div class="linha" style="background:${GOLD}"><span class="e">🔥</span><div><b>Estádio lotado</b><span>seu time ganha força extra em casa</span></div></div>
<div class="linha"><span class="e">🏟️</span><div><b>Meio cheio</b><span>fica como sempre foi</span></div></div>
<div class="linha" style="background:#F6D9D2"><span class="e">🦗</span><div><b>Estádio vazio</b><span>sem a torcida, o mando de campo some</span></div></div>
<div class="linha" style="background:#E3F1E6"><span class="e">💡</span><div><b>Como lotar</b><span>torcida feliz + obras do estádio (cobertura segura o público na chuva, estação traz mais gente)</span></div></div>
<div class="pe">⚽ <b>leilaolegends.com</b> · aba Clube</div>`

// 2) o quadro na aba Clube — celular 390px, logo abaixo do desenho do estádio e da lotação
const quadro = (pct, nivel) => {
  const n = nivel === 'lotado' ? { cor: VERM, bg: '#FFE9B8', emo: '🔥', tit: 'Caldeirão aceso', txt: 'Estádio lotado: o time entra em casa com força extra.' }
    : nivel === 'vazio' ? { cor: '#7A6F5A', bg: '#EFE7D2', emo: '🦗', tit: 'Caldeirão apagado', txt: 'Estádio vazio: sem a torcida, o time joga em casa sem empurrão.' }
    : { cor: '#B37A00', bg: '#FBF6E9', emo: '🏟️', tit: 'Caldeirão morno', txt: 'Meio cheio: o empurrão de casa de sempre.' }
  return `<div style="border:3px solid ${INK};border-radius:14px;box-shadow:3px 3px 0 ${INK};background:${n.bg};padding:12px;margin-bottom:14px">
  <div style="font-weight:700;font-size:12px;letter-spacing:.8px;text-transform:uppercase;color:rgba(0,0,0,.6);margin-bottom:8px">🔥 Caldeirão · próximo jogo em casa</div>
  <div style="display:flex;align-items:center;gap:10px">
    <span style="font-size:30px">${n.emo}</span>
    <div style="flex:1">
      <b style="font-size:18px;font-weight:700;text-transform:uppercase;color:${n.cor}">${n.tit}</b>
      <div style="height:12px;border:2px solid ${INK};border-radius:99px;background:#fff;overflow:hidden;margin:6px 0 4px;position:relative">
        <i style="position:absolute;left:0;top:0;bottom:0;width:${pct}%;background:${n.cor}"></i>
        <i style="position:absolute;left:30%;top:-2px;bottom:-2px;width:2px;background:${INK};opacity:.35"></i>
        <i style="position:absolute;left:80%;top:-2px;bottom:-2px;width:2px;background:${INK};opacity:.35"></i>
      </div>
      <span style="font-family:system-ui;font-size:11px;font-weight:700;color:#555">${pct}% de lotação · ${n.txt}</span>
    </div>
  </div>
  <p style="font-family:system-ui;font-size:10.5px;font-weight:700;color:rgba(0,0,0,.55);margin:8px 0 0;line-height:1.35">Acima de 80% o caldeirão acende; abaixo de 30% apaga. Vale só em casa e só pro seu time. Pra lotar: torcida feliz, cobertura pra chuva e a estação. 💰 A bilheteria continua igual.</p>
</div>`
}
const celular = `<!doctype html><meta charset="utf-8">${fonte}<style>*{box-sizing:border-box;margin:0}body{background:${CREME};font-family:Oswald,system-ui;color:${INK};width:390px;padding:14px}</style>
<div style="height:150px;border:3px solid ${INK};border-radius:14px;background:url(${ESTADIO}) center/cover;margin-bottom:12px;position:relative">
 <span style="position:absolute;left:8px;top:8px;background:${INK};color:#fff;font-size:10px;font-weight:700;padding:3px 7px;border-radius:6px">🏟️ desenho do estádio (fica em cima, como sempre)</span></div>
<div style="border:3px solid ${INK};border-radius:14px;background:#FBF6E9;padding:12px;margin-bottom:12px;font-weight:700;font-size:12px;text-transform:uppercase;color:rgba(0,0,0,.6)">🎟️ Lotação do próximo jogo — 92% <span style="display:block;font-family:system-ui;font-size:10px;text-transform:none;font-weight:700;color:#777;margin-top:3px">(o quadro que já existe)</span></div>
${quadro(92, 'lotado')}${quadro(62, 'morno')}${quadro(24, 'vazio')}`

const br = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
for (const [nome, html, w, h] of [['caldeirao-stories.png', stories, 1080, 1920], ['caldeirao-aba-clube.png', celular, 390, 900]]) {
  const pg = await br.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: w < 500 ? 2 : 1 })
  await pg.setContent(html, { waitUntil: 'networkidle' }); await pg.waitForTimeout(600)
  await pg.screenshot({ path: `${OUT}/${nome}`, fullPage: true }); await pg.close(); console.log(`${OUT}/${nome}`)
}
await br.close()
