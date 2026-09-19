// 📱✅ O QUE FOI AO AR NO CELULAR (18/09) — o antes e o depois, lado a lado.
//
// Ele aprovou a LISTA (`mockup-celular-lista.mjs`) com um "ok publique". Saíram os
// três itens, em três commits separados e revertíveis um a um:
//   1. 🏆 a tabela sobe pra logo depois do placar
//   2. ⚖️ a tática vira pílula (o padrão que ele aprovou no Elenco)
//   3. 🧭 as duas navegações viram uma barra só
// Este quadro é o COMPROVANTE do que mudou — não é proposta, já está no jogo.
// ⚠️ O DESKTOP não foi tocado: tudo mora em @media (max-width:1099.98px).
// Rodar: node scripts/mockup-celular-no-ar.mjs [saida.png]
import { chromium } from 'playwright-core'

const SAIDA = process.argv[2] || '/tmp/celular-no-ar.png'
const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6', VERDE = '#1B7A3D', CINZA = '#b9b1a0'

// um bloco da fila do celular
const bl = (emoji, nome, cor, alt, destaque) => `
<div style="background:${cor};border:2.5px solid ${INK};border-radius:9px;padding:0 8px;height:${alt}px;
     display:flex;align-items:center;gap:6px;font-size:11.5px;font-weight:900;color:${destaque ? '#fff' : INK};
     ${destaque ? `box-shadow:3px 3px 0 ${INK}` : ''}">
  <span style="font-size:14px">${emoji}</span><span>${nome}</span></div>`

const fila = (blocos) => `<div style="display:flex;flex-direction:column;gap:7px">${blocos.join('')}</div>`

const ANTES = fila([
  bl('🟢', 'Placar ao vivo', '#22352a', 62, 1),
  bl('🔖', 'abas: jogos · números · elenco', '#fff', 30),
  bl('📺', 'Outros jogos da rodada', '#fff', 40),
  bl('⚔️', 'Próximo jogo + 3 botões de tática', GOLD, 62),
  bl('📣', 'Giro da rodada', '#EDE6D2', 36),
  bl('🏆', 'A TABELA', VERDE, 96, 1),
  bl('🧭', 'barra: rank · estante · temporadas', '#fff', 30),
])
const DEPOIS = fila([
  bl('🟢', 'Placar ao vivo', '#22352a', 62, 1),
  bl('📺', 'Outros jogos da rodada', '#fff', 40),
  bl('⚔️', 'Próximo jogo · ⚖️ Equilíbrio ▾', GOLD, 34),
  bl('🏆', 'A TABELA', VERDE, 96, 1),
  bl('📣', 'Giro da rodada', '#EDE6D2', 36),
  bl('🧭', 'barra: jogos · números · elenco · 📚 · ⚙️', '#fff', 30),
])

const tele = (rot, corRot, dentro, nota) => `
<div style="flex:1">
  <div style="display:inline-block;background:${corRot};color:#fff;font-weight:900;font-size:12px;letter-spacing:1px;
       text-transform:uppercase;padding:5px 12px;border-radius:8px;margin-bottom:9px">${rot}</div>
  <div style="border:3px solid ${INK};border-radius:20px;box-shadow:4px 4px 0 ${INK};background:${CREME};padding:11px">
    ${dentro}</div>
  <p style="font-size:12.5px;font-weight:700;margin:9px 2px 0;line-height:1.45;color:#5f5848">${nota}</p>
</div>`

const html = `<!doctype html><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;700;900&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0}
  body{font-family:Oswald,system-ui;color:${INK};background:${CREME};width:1060px;padding:30px}
  h1{font-size:46px;font-weight:900;text-transform:uppercase;line-height:.95}
  h1 .g{color:${VERDE}}
  .lead{background:${GOLD};border:3px solid ${INK};border-radius:14px;box-shadow:4px 4px 0 ${INK};
        padding:14px 18px;font-size:16px;font-weight:700;margin:13px 0 22px;line-height:1.45}
  .par{display:flex;gap:26px;align-items:flex-start}
  .cx{border:3px solid ${INK};background:#fff;border-radius:14px;box-shadow:4px 4px 0 ${INK};
      padding:15px 19px;margin-top:22px;font-size:15px;font-weight:700;line-height:1.6}
  .cx b{color:${VERDE}}
  .seg{border:3px solid ${VERDE};background:#EAF5EE;border-radius:14px;padding:14px 18px;margin-top:14px;
       font-size:15px;font-weight:700;line-height:1.55}
  .seg b{color:${VERDE}}
</style>

<h1>ESTÁ <span class="g">NO AR</span> — O CELULAR</h1>
<div class="lead">Os três itens da lista que você aprovou saíram. <b>Nada encolheu e nada sumiu</b>: o placar,
a mascote do gol, os cards dos outros jogos e a zoeira da sala continuam do tamanho que eram —
o que mudou foi a <b>ORDEM da fila</b> e a altura parada das molduras.</div>

<div class="par">
  ${tele('antes', CINZA, ANTES, 'Pra ver a classificação você rolava a tela inteira: a tabela era a última da fila, depois de tudo. E tinha DOIS menus — abas em cima e barra embaixo.')}
  ${tele('agora', VERDE, DEPOIS, 'A fila segue o relógio: o que muda agora vem primeiro. A tabela subiu, a tática virou uma linha que abre no toque e sobrou UM menu só, o de baixo.')}
</div>

<div class="cx">
  <b>O que mudou, item por item</b><br>
  1️⃣ 🏆 <b>A tabela subiu</b> pra logo depois do seu próximo jogo.<br>
  2️⃣ ⚖️ <b>A tática virou pílula</b> — mostra a que está valendo e abre os três botões no toque.
  Medido: a caixa caiu de <b>197px pra 94px</b>, e essa altura virou tabela na tela.<br>
  3️⃣ 🧭 <b>Um menu só</b>: as abas de cima desceram pra barra que já existia. Rank, Estante e
  Temporadas são a mesma coisa (o passado), então viraram <b>📚 Estante</b> — e as três voltam
  em pílulas dentro do painel. Eram 7 botões de navegação; agora são 5.
</div>

<div class="seg">
  🖥️ <b>O desktop não foi tocado.</b> Tudo que é novo só existe em tela menor que 1100px — na tela
  larga que você aprovou hoje de manhã não mudou uma vírgula (conferi medindo: a tabela e o próximo
  jogo continuam lado a lado, na mesma altura).<br>
  ↩️ <b>Dá pra voltar atrás</b>: foram <b>três commits separados</b>, um pra cada item. Se você não
  gostar de um só, eu tiro aquele e os outros dois ficam.
</div>`

const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const page = await browser.newPage({ viewport: { width: 1060, height: 1000 }, deviceScaleFactor: 2 })
await page.setContent(html, { waitUntil: 'networkidle' })
await page.waitForTimeout(600)
await page.screenshot({ path: SAIDA, fullPage: true })
await browser.close()
console.log(SAIDA)
