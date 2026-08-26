// ─── 🏟️ OS CAMPINHOS: 4-4-2 hoje × 4-4-2 losango × 3-5-2 com alas (26/08) ───
//
// O Diego BATEU O MARTELO nas 15 formações e pediu: *"quero antes q me mande
// mockup da formação atual 442 c campinho e como ficará por exemplo a do 442
// losango e 352 tb c alas"*.
//
// Os três campos usam os MESMOS jogadores de propósito — é a prova visual de que
// a maquiagem não mexe em quem joga: no losango são os MESMOS 4 meias do 4-4-2
// (só o desenho muda), e no 3-5-2 os "alas" são o Cafu e o R.Carlos, os
// LATERAIS DE VERDADE do time (a régua dele: zagueiro e atacante nunca mentem).
//
// 📐 DECISÃO DO DIEGO (26/08, em cima da 1ª versão): *"melhor você já aumentar o
// campinho no padrão do losango p todos ficarem iguais e ajustar os espaços"*.
// Ou seja: o campo tem UMA altura padrão (a do desenho mais alto) pra TODAS as
// formações, e o campo nunca muda de tamanho ao trocar de formação.
//
// 📐 v3 (26/08, ele pegou o defeito do v2): *"os zagueiros no 442 normal estão
// numa distância do goleiro definida, já no 442 losango eles estão em outra, e
// no 352 em outra — tem que ter um padrão"*. O space-between no campo inteiro
// espalhava TODAS as linhas, então a zaga subia e descia conforme a formação.
// Agora o campo tem FAIXAS FIXAS: GOL, ZAG e ATA ficam SEMPRE na mesma altura
// em qualquer formação — só o MIOLO (as linhas de meia, exatamente o que a
// maquiagem redesenha) se distribui na faixa do meio, que é fixa.
//
//   node scripts/mockup-campinhos-442-352.mjs [--saida campinhos-442-352.png]
import { readFileSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright-core'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'campinhos-442-352.png')
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D', RED = '#C2452F', CREME = '#F4ECD6'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'

// bolinha do campinho (mesmo traço do mockup-formacoes-espelho, aprovado em 24/08)
const jog = (nome, tag, destaque) => `
  <div style="text-align:center;width:60px;flex:none">
    <span style="display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:50%;
      border:3px solid ${INK};background:${destaque ? GOLD : '#DBD1B5'};color:${INK};
      ${OSW};font-size:14px">${nome[0]}</span>
    <p style="${OSW};font-size:8.5px;color:#fff;margin:2px 0 0;text-shadow:0 1px 2px rgba(0,0,0,.85);line-height:1.1">${nome}<br>
      <span style="opacity:.75;font-size:7px">${tag}</span></p>
  </div>`

const linha = (js) => `<div style="display:flex;justify-content:center;gap:4px;flex:none">${js}</div>`
// 📏 ALTURA PADRÃO única (a do losango, o desenho mais alto) + FAIXAS FIXAS:
// ataque em cima, zaga e goleiro embaixo ficam SEMPRE na mesma altura, em
// qualquer formação. Só o MIOLO (faixa do meio, flex:1) redistribui suas
// linhas — 1 linha de meia fica no centro da faixa, 3 linhas se espalham nela.
const ALTURA = 560
const ZAG_GOL = 26 // respiro FIXO entre a linha da zaga e o goleiro (igual nos 3)
const campo = (rotulo, cor, faixas, legenda) => `
  <div style="width:330px;flex:none">
    <p style="${OSW};font-size:14px;text-transform:uppercase;color:${cor};margin:0 0 7px">${rotulo}</p>
    <div style="background:repeating-linear-gradient(180deg,${GREEN} 0 ${ALTURA / 10}px,#166332 ${ALTURA / 10}px ${ALTURA / 5}px);
      border:3px solid ${INK};border-radius:14px;padding:14px 4px 10px;box-shadow:4px 4px 0 ${INK};
      height:${ALTURA}px;display:flex;flex-direction:column">
      ${faixas.ataque}
      <div style="flex:1;display:flex;flex-direction:column;justify-content:space-evenly">${faixas.meio}</div>
      <div style="margin-bottom:${ZAG_GOL}px">${faixas.defesa}</div>
      ${faixas.gol}
    </div>
    <p style="font-family:system-ui;font-size:11px;font-weight:700;color:rgba(0,0,0,.6);margin:8px 2px 0;line-height:1.45">${legenda}</p>
  </div>`

// ── 1) 4-4-2 COMO É HOJE: meio em linha ────────────────────────────────────
const F442 = campo('① 4-4-2 · como é HOJE', 'rgba(0,0,0,.55)', {
  ataque: linha(jog('Romário', 'ATA') + jog('Bebeto', 'ATA')),
  meio: linha(jog('Rivelino', 'MEI') + jog('Zico', 'MEI') + jog('Falcão', 'MEI') + jog('Dunga', 'MEI')),
  defesa: linha(jog('Cafu', 'LAT') + jog('Aldair', 'ZAG') + jog('Lúcio', 'ZAG') + jog('R.Carlos', 'LAT')),
  gol: linha(jog('Taffarel', 'GOL')),
}, 'Repare nas alturas: ataque, zaga e goleiro estão na MESMA posição nos 3 campos. A linha única de meias fica no centro da faixa do meio.')

// ── 2) 4-4-2 LOSANGO: os MESMOS 4 meias, em losango ────────────────────────
const FLOS = campo('② 4-4-2 LOSANGO · novo desenho', GREEN, {
  ataque: linha(jog('Romário', 'ATA') + jog('Bebeto', 'ATA')),
  meio:
    linha(jog('Zico', 'MEI · camisa 10', 1)) +
    linha(jog('Rivelino', 'MEI', 1) + '<div style="width:66px"></div>' + jog('Falcão', 'MEI', 1)) +
    linha(jog('Dunga', 'MEI · volante', 1)),
  defesa: linha(jog('Cafu', 'LAT') + jog('Aldair', 'ZAG') + jog('Lúcio', 'ZAG') + jog('R.Carlos', 'LAT')),
  gol: linha(jog('Taffarel', 'GOL')),
}, 'Os <b>MESMOS 4 meias</b> (em dourado) abrem em losango DENTRO da faixa do meio — zaga e goleiro não saem do lugar. O time é idêntico ao ①.')

// ── 3) 3-5-2 COM ALAS: o time do 5-3-2, laterais adiantados ────────────────
const F352 = campo('③ 3-5-2 · os ALAS são os laterais', GREEN, {
  ataque: linha(jog('Romário', 'ATA') + jog('Bebeto', 'ATA')),
  meio: linha(jog('Cafu', 'LAT · ala', 1) + jog('Rivelino', 'MEI') + jog('Zico', 'MEI') + jog('Falcão', 'MEI') + jog('R.Carlos', 'LAT · ala', 1)),
  defesa: linha(jog('Aldair', 'ZAG') + jog('Gamarra', 'ZAG') + jog('Lúcio', 'ZAG')),
  gol: linha(jog('Taffarel', 'GOL')),
}, 'Os alas (em dourado) são <b>Cafu e R.Carlos, laterais DE VERDADE</b>, adiantados pra faixa do meio — e a zaga de 3 fica na MESMA altura da zaga de 4 dos outros campos.')

const html = `<!doctype html><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box;margin:0;padding:0}
body{background:${CREME};padding:32px;font-family:system-ui}</style>
<body>
  <div style="display:inline-block;background:${GOLD};border:3px solid ${INK};border-radius:999px;box-shadow:3px 3px 0 ${INK};
    padding:5px 16px;${OSW};font-size:12.5px;letter-spacing:.08em">🏟️ OS CAMPINHOS · martelo batido nas 15 formações 🔨</div>
  <p style="font-size:13px;font-weight:600;max-width:1060px;line-height:1.5;margin:12px 0 20px">
    Os três campos usam <b>os mesmos jogadores</b> de propósito — é a prova de que a maquiagem não mexe em
    quem joga, só em ONDE cada um aparece desenhado. O que está <b>em dourado</b> é o que muda de lugar.
    <br>📏 <b>Padrão das alturas</b>: goleiro, zaga e ataque ficam SEMPRE na mesma posição — só o meio-campo
    redistribui na faixa dele.</p>
  <div style="display:flex;gap:24px;align-items:flex-start;flex-wrap:wrap">
    ${F442}
    ${FLOS}
    ${F352}
  </div>
  <p style="margin-top:18px;font-size:11.5px;font-weight:700;color:rgba(0,0,0,.55)">
    🤫 Nada disso é dito ao jogador — pra ele são 15 formações. · ⚽ Leilão <span style="color:${RED};${OSW}">Legends</span></p>
</body>`

const tmp = `/tmp/mock-campinhos-${process.pid}.html`
writeFileSync(tmp, html)
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1160, height: 720 }, deviceScaleFactor: 2 })
await p.goto('file://' + tmp)
await p.evaluate(() => document.fonts.ready)
await p.waitForTimeout(500)
await p.screenshot({ path: SAIDA, fullPage: true })
await b.close()
console.log(SAIDA)
