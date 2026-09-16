// 📱 STORIES — tudo que melhorou hoje (16/09), em formato 1080×1920.
// Diego: *"p stories dps q fizer tudo q fizemos hj de melhorias desde antes"*.
// São 3 telas: 1) as artes novas dos clubes · 2) o estádio · 3) o resumo.
// Rodar: node scripts/mockup-stories-melhorias.mjs   (gera 3 arquivos em /tmp)
import { chromium } from 'playwright-core'
import { readFileSync } from 'node:fs'

// 🖼️ os escudos DE VERDADE, embutidos em base64 — um story de "arte nova" sem a
//    arte não é story nenhum. São os mesmos arquivos que o jogo usa.
const esc = k => `data:image/webp;base64,${readFileSync(`src/escalacao/img/${k}`).toString('base64')}`
const CLUBES = [
  ['murriz-escudo.webp', 'Murriz FC'], ['nightfull-escudo.webp', 'Nightfull FC'],
  ['barcenite-escudo.webp', 'Barcenite FC'], ['scorporila-escudo.webp', 'Scorporila FC'],
  ['marolados-escudo.webp', 'Marolados FC'], ['marinheiros-escudo.webp', 'Marinheiros AS'],
  ['papao-escudo.webp', 'Papão United Madrid'], ['saoluiz-escudo.webp', 'São Luiz FC'],
]
const INK='#0C0C0C', GOLD='#FFC400', CREME='#F4ECD6', VERDE='#1B7A3D', VERM='#C2452F'
const base = corpo => `<!doctype html><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;700;900&display=swap" rel="stylesheet">
<style>
 *{box-sizing:border-box;margin:0}
 body{background:${CREME};font-family:Oswald,system-ui;color:${INK};width:1080px;height:1920px;
      padding:90px 60px 70px;display:flex;flex-direction:column;justify-content:flex-start}
 .sel{display:inline-block;background:${VERM};color:#fff;font-size:24px;font-weight:900;letter-spacing:2px;
      text-transform:uppercase;padding:10px 22px;border-radius:12px;border:4px solid ${INK};
      box-shadow:6px 6px 0 ${INK};margin-bottom:26px;align-self:flex-start}
 h1{font-size:82px;font-weight:900;text-transform:uppercase;line-height:.92;letter-spacing:-2px;margin-bottom:14px}
 h1 .g{color:${VERDE}} h1 .r{color:${VERM}}
 .lead{font-size:31px;font-weight:600;line-height:1.35;margin-bottom:40px;color:#444}
 .it{background:#fff;border:5px solid ${INK};border-radius:22px;box-shadow:8px 8px 0 ${INK};
     padding:30px 30px;margin-bottom:26px;display:flex;align-items:center;gap:24px}
 .it .e{font-size:58px;flex:none}
 .it b{display:block;font-size:38px;font-weight:900;line-height:1.05}
 .it span{display:block;font-size:26px;font-weight:600;color:#555;margin-top:4px;line-height:1.3}
 .pe{margin-top:auto;padding-top:40px;font-size:29px;font-weight:800;color:#666;text-align:center}
 .pe b{color:${INK}}
 .gr{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:10px}
 .cl img{height:180px;width:auto;object-fit:contain;display:block;margin:0 auto 10px}
 .cl{background:#fff;border:5px solid ${INK};border-radius:20px;box-shadow:6px 6px 0 ${INK};
     padding:18px 14px;text-align:center;display:flex;flex-direction:column;justify-content:center;min-height:262px}
 .cl b{display:block;font-size:30px;font-weight:900;line-height:1.1}
 .cl span{font-size:23px;font-weight:600;color:#666}
 table{width:100%;border-collapse:collapse;font-size:32px}
 td{padding:26px 10px;border-top:3px solid rgba(12,12,12,.12);font-weight:800}
 td.l{text-align:left} td.r{text-align:right;color:${VERDE};font-weight:900;font-size:34px}
 td.h{text-align:right;color:#bbb;font-size:27px}
</style>${corpo}`

const TELAS = [
  { f: '/tmp/story-1.png', html: base(`
    <div class="sel">⚽ Leilão Legends · 16 de setembro</div>
    <h1>OITO CLUBES DE<br><span class="g">CARA NOVA</span></h1>
    <div class="lead">Os donos mandaram arte nova. Escudo, mascote e manto — tudo redesenhado.</div>
    <div class="gr">
      ${CLUBES.map(([f, n]) => `<div class="cl"><img src="${esc(f)}"><b>${n}</b></div>`).join('')}
    </div>
    <div class="pe">Clube seu? <b>Recarrega o jogo pra ver.</b></div>`) },

  { f: '/tmp/story-2.png', html: base(`
    <div class="sel">🏟️ O estádio mudou</div>
    <h1>AGORA <span class="r">ENCHER</span><br>O ESTÁDIO<br><span class="g">DÁ DINHEIRO</span></h1>
    <div class="lead">O começo ficou mais barato, e construir passou a valer a pena de verdade.</div>
    <div class="it"><span class="e">🎟️</span><div><b>Arquibancada vira bilheteria</b>
      <span>antes os lugares não contavam. Agora cada lugar soma no seu caixa.</span></div></div>
    <div class="it"><span class="e">🧍</span><div><b>Sua torcida cresce quando você sobe</b>
      <span>era 12.000 da Várzea à Série A. Agora a elite tem 100.000.</span></div></div>
    <div class="it"><span class="e">🎭</span><div><b>Camarote vale por dois</b>
      <span>quem senta no camarote gasta mais — e agora o jogo sabe disso.</span></div></div>
    <div class="it"><span class="e">💸</span><div><b>Começar ficou mais barato</b>
      <span>gramado pela metade, e a Loja abre com 1 setor em vez de 2.</span></div></div>
    <div class="pe"><b>A Várzea não mudou nada</b> — quem tá começando não perde nada.</div>`) },

  { f: '/tmp/story-3.png', html: base(`
    <div class="sel">💰 O que muda no seu caixa</div>
    <h1>MAIS <span class="g">GRANA</span><br>PRA QUEM<br>CONSTRÓI</h1>
    <div class="lead">Medido no jogo, com o estádio construído:</div>
    <table>
      <tr><td class="l">🎟️ Bilheteria<br><span style="font-size:22px;font-weight:600;color:#777">estádio completo, brigando em cima</span></td>
          <td class="h">112</td><td class="r">132</td></tr>
      <tr><td class="l">👕 Venda de camisa<br><span style="font-size:22px;font-weight:600;color:#777">na Série A</span></td>
          <td class="h">21</td><td class="r">55</td></tr>
      <tr><td class="l">👕 Venda de camisa<br><span style="font-size:22px;font-weight:600;color:#777">na Série B</span></td>
          <td class="h">21</td><td class="r">40</td></tr>
      <tr><td class="l">🧍 Torcida<br><span style="font-size:22px;font-weight:600;color:#777">Série A, estádio cheio</span></td>
          <td class="h">90 mil</td><td class="r">195 mil</td></tr>
    </table>
    <div class="it" style="margin-top:28px;background:${GOLD}"><span class="e">🛡️</span><div>
      <b>Ninguém perdeu nada</b><span>nenhum estádio já construído foi mexido. Tudo só somou.</span></div></div>
    <div class="pe">⚽ <b>leilaolegends.com</b></div>`) },
]
const br = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
for (const t of TELAS) {
  const pg = await br.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 })
  await pg.setContent(t.html, { waitUntil: 'networkidle' }); await pg.waitForTimeout(600)
  await pg.screenshot({ path: t.f }); await pg.close(); console.log(t.f)
}
await br.close()
