// 📣 POST — TUDO QUE MUDOU HOJE, num quadro só, PRA POSTAR PRO PESSOAL.
//
// Diego: *"não, um mockup com tudo que fizemos pra postar pra eles"*.
// Diferença pro `mockup-tudo-hoje.mjs`: aquele é pra ELE decidir (tem hex de cor,
// "dá pra reverter", nome de arquivo). Este é pro JOGADOR — só o que muda na vida
// de quem joga, em linguagem de jogo, e com as artes novas dos clubes juntas.
//
// Rodar: node scripts/post-tudo-hoje.mjs [saida.png]
import { chromium } from 'playwright-core'
import { readFileSync } from 'node:fs'

const SAIDA = process.argv[2] || '/tmp/post-tudo-hoje.png'
const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6', VERDE = '#1B7A3D', VERM = '#C2452F'

const esc = k => `data:image/webp;base64,${readFileSync(`src/escalacao/img/${k}-escudo.webp`).toString('base64')}`
const CLUBES = [
  ['murriz', 'Murriz FC', 240], ['nightfull', 'Nightfull FC', 249], ['barcenite', 'Barcenite FC', 268],
  ['papao', 'Papão United Madrid', 232], ['scorporila', 'Scorporila FC', 262], ['saoluiz', 'São Luiz FC', 360],
  ['marolados', 'Marolados FC', 298], ['marinheiros', 'Marinheiros AS', 290],
]
const H = 108

const PRECOS = [['🌱', 'Gramado', '60', '30'], ['💺', 'Arquibancada Geral', '60', '40'],
  ['💡', 'Refletores', '50', '30'], ['🛍️', 'Loja do Clube', '80', '60']]
const TORCIDA = [['Várzea', '12 mil', '12 mil', 1], ['Série D', '12 mil', '20 mil'], ['Série C', '12 mil', '35 mil'],
  ['Série B', '12 mil', '60 mil'], ['Série A', '12 mil', '100 mil']]
const CAMISA = [['Várzea', '21', '21', 1], ['Série D', '21', '24'], ['Série C', '21', '30'],
  ['Série B', '21', '40'], ['Série A', '21', '55']]
const RENDE = [
  ['🎟️', 'A arquibancada virou dinheiro', 'cada 3.000 lugares construídos = +1 moeda por temporada'],
  ['🎭', 'Camarote vale por dois', 'quem senta no camarote gasta mais — e agora o jogo sabe disso'],
  ['☂️', 'Cobertura enche o estádio', '+8% de venda de camisa: sem chuva, o povo vem'],
  ['💡', 'Refletor enche o estádio', '+5% de venda de camisa: jogo à noite lota mais'],
  ['😮‍💨', 'Time lá embaixo não joga mais pra estádio vazio', 'quem escapou do Z4 e quem caiu passaram a levar mais gente'],
]

const tab = rows => `<table>${rows.map(([n, a, d, ig]) => `<tr><td class="l">${n}</td>
  <td class="h">${a}</td><td class="${ig ? 'ig' : 'd'}">${d}${ig ? ' <span class="mn">(igual)</span>' : ''}</td></tr>`).join('')}</table>`

const html = `<!doctype html><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;700;900&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0}
  body{background:${CREME};font-family:Oswald,system-ui;color:${INK};width:1080px;padding:46px 44px 40px}
  .top{display:inline-block;background:${VERM};color:#fff;font-size:20px;font-weight:900;letter-spacing:2.2px;
       text-transform:uppercase;padding:9px 20px;border-radius:11px;border:4px solid ${INK};
       box-shadow:5px 5px 0 ${INK};margin-bottom:20px}
  h1{font-size:74px;font-weight:900;text-transform:uppercase;line-height:.9;letter-spacing:-1.5px}
  h1 .g{color:${VERDE}}
  .lead{font-size:26px;font-weight:600;color:#444;line-height:1.35;margin:16px 0 26px}
  .card{background:#fff;border:5px solid ${INK};border-radius:22px;box-shadow:7px 7px 0 ${INK};padding:26px 28px;margin-bottom:22px}
  .cab{display:inline-block;background:${VERDE};color:#fff;font-weight:900;font-size:19px;letter-spacing:1.4px;
       text-transform:uppercase;padding:8px 17px;border-radius:11px;margin-bottom:16px}
  .cab.o{background:#B8860B} .cab.k{background:${INK}}
  .sub{font-size:22px;font-weight:600;color:#555;margin:-6px 0 16px;line-height:1.4}
  .pr{display:grid;grid-template-columns:56px 1fr 110px 34px 110px;gap:12px;align-items:center;
      padding:15px 0;border-top:3px solid rgba(12,12,12,.10);font-size:27px;font-weight:800}
  .pr:first-of-type{border-top:0}
  .pr .e{font-size:38px;text-align:center}
  .pr .a{color:#bbb;text-decoration:line-through;text-align:right}
  .pr .s{color:#ccc;font-size:30px;text-align:center}
  .pr .d{color:${VERDE};font-weight:900;font-size:36px}
  .cx{background:${GOLD};border:4px solid ${INK};border-radius:16px;padding:18px 20px;margin-top:16px;
      font-size:25px;font-weight:800;line-height:1.35}
  .dup{display:grid;grid-template-columns:1fr 1fr;gap:22px}
  table{width:100%;border-collapse:collapse;font-size:26px}
  td{padding:15px 6px;border-top:3px solid rgba(12,12,12,.10);font-weight:800}
  tr:first-child td{border-top:0}
  td.l{text-align:left} td.h{text-align:right;color:#bbb;font-size:23px;text-decoration:line-through}
  td.d{text-align:right;color:${VERDE};font-weight:900;font-size:32px}
  td.ig{text-align:right;color:#999;font-size:26px}
  .mn{font-size:17px;color:#bbb;font-weight:700}
  .it{display:flex;align-items:center;gap:20px;padding:16px 0;border-top:3px solid rgba(12,12,12,.10)}
  .it:first-of-type{border-top:0}
  .it .e{font-size:44px;flex:none;width:56px;text-align:center}
  .it b{display:block;font-size:28px;font-weight:900;line-height:1.1}
  .it span{display:block;font-size:22px;font-weight:600;color:#666;margin-top:3px;line-height:1.3}
  .gr{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
  .cl{background:${CREME};border:4px solid ${INK};border-radius:16px;padding:14px 8px 10px;text-align:center;
      display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:8px;min-height:172px}
  .cl img{display:block;object-fit:contain}
  .cl b{font-size:19px;font-weight:900;line-height:1.1}
  .pe{background:${INK};color:#fff;border-radius:22px;padding:24px 28px;font-size:26px;font-weight:800;
      line-height:1.5;text-align:center}
  .pe b{color:${GOLD}} .pe .site{display:block;font-size:34px;margin-top:10px;color:#fff}
</style>

<div class="top">⚽ Leilão Legends · 16 de setembro</div>
<h1>O QUE MUDOU<br><span class="g">NO SEU CLUBE</span></h1>
<div class="lead">Mexemos na conta do clube inteira — e nas artes de 8 clubes. <b>Ninguém perdeu nada:</b>
o que você já tinha construído continua igual, tudo só somou.</div>

<div class="card">
  <span class="cab">🏟️ construir ficou mais barato</span>
  <div class="sub">As obras do começo, que é onde todo mundo trava.</div>
  ${PRECOS.map(([e, n, a, d]) => `<div class="pr"><div class="e">${e}</div><div>${n}</div>
    <div class="a">${a}</div><div class="s">→</div><div class="d">${d}</div></div>`).join('')}
  <div class="cx">🛍️ E a <b>Loja do Clube</b> abre com <b>1 setor pronto</b> em vez de 2:
    juntar 200 moedas virou juntar <b>100</b>.</div>
</div>

<div class="dup">
  <div class="card">
    <span class="cab">🧍 sua torcida</span>
    <div class="sub">Era a MESMA da Várzea à Série A. Agora <b>subir traz torcedor</b>.</div>
    ${tab(TORCIDA)}
  </div>
  <div class="card">
    <span class="cab">👕 venda de camisa</span>
    <div class="sub">Moedas por temporada, estádio meio construído.</div>
    ${tab(CAMISA)}
  </div>
</div>

<div class="card">
  <span class="cab o">🎟️ o estádio agora paga o que promete</span>
  ${RENDE.map(([e, t, s]) => `<div class="it"><span class="e">${e}</span><div><b>${t}</b><span>${s}</span></div></div>`).join('')}
</div>

<div class="card">
  <span class="cab k">🎨 e 8 clubes de cara nova</span>
  <div class="sub">Os donos mandaram arte nova — escudo, mascote e manto redesenhados.</div>
  <div class="gr">${CLUBES.map(([k, n, w]) =>
    `<div class="cl"><img src="${esc(k)}" height="${H}" width="${Math.round(H * w / 360)}"><b>${n}</b></div>`).join('')}</div>
</div>

<div class="pe">
  👀 Já está no ar — é só <b>recarregar o jogo</b>.
  <span class="site">⚽ leilaolegends.com</span>
</div>
`

const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const page = await browser.newPage({ viewport: { width: 1080, height: 1500 }, deviceScaleFactor: 1.5 })
await page.setContent(html, { waitUntil: 'networkidle' })
await page.waitForTimeout(800)
await page.screenshot({ path: SAIDA, fullPage: true })
await browser.close()
console.log(SAIDA)
