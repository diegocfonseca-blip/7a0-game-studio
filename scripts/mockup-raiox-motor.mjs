// 🖼️ MOCKUP — RAIO-X DO MOTOR: o que a simulação achou de estranho.
// Pedido do Diego (16/09): *"consegue ver como está a dificuldade do jogo e
// também em relação a zagueiro metendo muito gol, lateral, nível de jogadores…
// coisas que não têm sentido nenhum? Veja e me fala, mas não faça nada"*.
// ⚠️ Este quadro é DIAGNÓSTICO. Nada foi mexido no jogo.
// Números: scripts/analisa-motor.mjs · conta-perna-de-pau.mjs · nivel-por-posicao.mjs
import { chromium } from 'playwright-core'

const SAIDA = process.argv[2] || '/tmp/raiox-motor.png'
const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6', VERDE = '#1B7A3D', VERM = '#C2452F'

const FAKE = [ // div, LAT %, ZAG %, MEI %
  ['Série A', 43, 30, 0], ['Série B', 35, 23, 0], ['Série C', 15, 38, 22],
]
const GOLS = [ // posição, % dos gols no jogo, % no futebol de verdade
  ['⚽ Atacante', 60, 67, '45%'], ['🎩 Meia', 32, 25, '30%'],
  ['🏃 Lateral', 5.1, 6.2, '5%'], ['🧱 Zagueiro', 2.4, 1.8, '11%'],
]
const NIVEL = [ // posição, nível em campo na Série A, nível das cartas de verdade
  ['🧤 Goleiro', 86.5, 86.5], ['🎩 Meia', 86.2, 86.2], ['⚽ Atacante', 86.0, 86.0],
  ['🧱 Zagueiro', 70.2, 84.8], ['🏃 Lateral', 65.1, 86.1],
]
const CARREIRA = [
  ['Temporadas na Série B', '21 de 30'],
  ['Temporadas na Série A', '2 de 30'],
  ['Onde terminou nas duas vezes na A', '19º e caiu'],
  ['Títulos em 30 temporadas', '1'],
  ['Artilheiro foi ATACANTE', '90 de 90 vezes'],
]

const html = `<!doctype html><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;700;900&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0}
  body{background:${CREME};font-family:Oswald,system-ui;color:${INK};width:1020px;padding:28px}
  h1{font-size:48px;font-weight:900;text-transform:uppercase;line-height:.93}
  h1 .r{color:${VERM}}
  .lead{background:${GOLD};border:3px solid ${INK};border-radius:14px;box-shadow:4px 4px 0 ${INK};
        padding:13px 17px;font-size:16px;font-weight:700;margin:14px 0 20px;line-height:1.4}
  .card{background:#fff;border:3px solid ${INK};border-radius:16px;box-shadow:4px 4px 0 ${INK};padding:17px 19px;margin-bottom:16px}
  .cab{display:inline-block;background:${VERM};color:#fff;font-weight:900;font-size:13.5px;letter-spacing:.8px;
       text-transform:uppercase;padding:6px 13px;border-radius:9px;margin-bottom:12px}
  .cab.g{background:${VERDE}} .cab.o{background:#B8860B} .cab.k{background:${INK}}
  .sub{font-size:14px;font-weight:600;color:#555;margin:-4px 0 12px;line-height:1.45}
  table{width:100%;border-collapse:collapse;font-size:15.5px}
  th{font-size:11px;text-transform:uppercase;letter-spacing:.6px;text-align:right;padding:5px 8px;color:#777;font-weight:800}
  th.l,td.l{text-align:left}
  td{padding:10px 8px;border-top:1px solid rgba(12,12,12,.10);text-align:right;font-weight:800}
  td.l{font-weight:700}
  .ruim{color:${VERM};font-weight:900;font-size:21px}
  .ok{color:${VERDE};font-weight:900;font-size:19px}
  .cinza{color:#999}
  .bar{display:flex;align-items:center;gap:10px}
  .bar i{display:block;height:17px;border:2px solid ${INK};border-radius:5px;background:${VERM}}
  .bar i.v{background:${VERDE}} .bar i.c{background:#CFCabB}
  .nota{background:#FDECEA;border:3px solid ${VERM};border-radius:13px;padding:13px 16px;margin-top:12px;
        font-size:14.5px;font-weight:700;line-height:1.45}
  .boa{background:#EAF5EE;border-color:${VERDE}}
  .boa b{color:${VERDE}}
</style>

<h1>RAIO-X DO MOTOR:<br>O QUE <span class="r">NÃO FECHA</span></h1>
<div class="lead">Rodei 30 temporadas inteiras no motor de verdade (o mesmo do celular do jogador) e
contei tudo. <b>Não mexi em nada</b> — isto aqui é só o diagnóstico.</div>

<div class="card">
  <span class="cab">🦵 achado nº 1 — o mais grave</span>
  <div class="sub">Os times de computador entram em campo com <b>jogador FAKE</b> ("Perna-de-pau") na
  lateral e na zaga. Não é regra nova: <b>o baralho não tem carta suficiente</b> dessas posições.<br>
  Conta do baralho brasileiro: o jogo precisa de <b>160 laterais</b> (4 divisões × 20 times × 2) e o
  baralho tem <b>84</b>. De zagueiro precisa de 160 e tem 86.</div>
  <table>
    <tr><th class="l">quanto do time é perna-de-pau</th><th>lateral</th><th>zagueiro</th><th>meia</th></tr>
    ${FAKE.map(([d, l, z, m]) => `<tr><td class="l">${d}</td>
      <td class="ruim">${l}%</td><td class="ruim">${z}%</td><td class="${m ? 'ruim' : 'cinza'}">${m}%</td></tr>`).join('')}
  </table>
  <div class="nota">👉 Traduzindo: <b>quase METADE dos laterais da Série A não é jogador de verdade.</b>
  Goleiro, meia e atacante têm ZERO fake. A defesa dos bots é de papelão — e é por isso que sai gol demais.</div>
</div>

<div class="card">
  <span class="cab o">🎚️ achado nº 2 — o nível em campo mente</span>
  <div class="sub">Nível médio de quem joga na Série A. A coluna da direita é o nível das cartas DE
  VERDADE; a da esquerda é o que entra em campo, já com os perna-de-pau misturados.</div>
  <table>
    <tr><th class="l">posição</th><th>o que entra em campo</th><th>as cartas de verdade</th></tr>
    ${NIVEL.map(([p, campo, real]) => `<tr><td class="l">${p}</td>
      <td class="${campo < 80 ? 'ruim' : 'ok'}">${campo}</td><td class="cinza">${real}</td></tr>`).join('')}
  </table>
  <div class="nota">👉 O <b>goleiro é o melhor jogador do time</b> (86,5) e o <b>lateral é 21 pontos
  pior</b> (65,1) — só porque faltou carta. No baralho eles são iguais (76,3 × 77,3).</div>
</div>

<div class="card">
  <span class="cab g">🧱 achado nº 3 — zagueiro NÃO está fazendo gol demais</span>
  <div class="sub">Você perguntou disto. Medi: é o CONTRÁRIO — o zagueiro faz <b>menos</b> gol do que no
  futebol de verdade, e o lateral faz mais que ele.</div>
  <table>
    <tr><th class="l">quem faz os gols</th><th>Série A</th><th>Série D</th><th>futebol real</th></tr>
    ${GOLS.map(([p, a, d, real]) => `<tr><td class="l">${p}</td><td>${a}%</td><td>${d}%</td><td class="cinza">${real}</td></tr>`).join('')}
  </table>
  <div class="nota boa">👉 <b>Zagueiro faz 2% dos gols; no futebol de verdade faz 11%</b> (escanteio,
  falta, bola parada). E o peso do jogo dá <b>2,5× mais chance de gol pro LATERAL do que pro ZAGUEIRO</b>
  — que é o avesso da vida real. Se você está vendo zagueiro artilheiro em algum lugar,
  <b>não é na carreira</b>: me diga onde que eu vou lá medir.</div>
</div>

<div class="card">
  <span class="cab k">🧗 achado nº 4 — a dificuldade: existe um MURO antes da Série A</span>
  <div class="sub">Peguei um time mediano e joguei 30 temporadas seguidas com ele.</div>
  <table>
    ${CARREIRA.map(([o, v]) => `<tr><td class="l">${o}</td><td class="ruim">${v}</td></tr>`).join('')}
  </table>
  <div class="nota">👉 Ele <b>morou na Série B</b> e só viu a Série A duas vezes — nas duas terminou
  em 19º e voltou. O elenco da A é 6 pontos mais forte que o da B, e quem sobe entra com time de B.<br>
  👉 E o <b>artilheiro foi ATACANTE nas 90 vezes</b> (30 temporadas × 3 divisões). Meia nunca ganhou
  uma artilharia — no Brasileirão de verdade isso acontece direto.</div>
</div>
`

const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const page = await browser.newPage({ viewport: { width: 1020, height: 1400 }, deviceScaleFactor: 2 })
await page.setContent(html, { waitUntil: 'networkidle' })
await page.waitForTimeout(700)
await page.screenshot({ path: SAIDA, fullPage: true })
await browser.close()
console.log(SAIDA)
