// 🖼️ MOCKUP — RAIO-X DO MOTOR (versão CORRIGIDA, 16/09).
//
// A 1ª versão deste quadro estava ERRADA e o Diego pegou na hora: *"ué, como
// assim? O modo carreira a gente junta todas as cartas — Brasil, Europa e Mundo"*.
// Eu tinha rodado a simulação com o baralho SÓ DO BRASIL. Conferido no código
// (`store.tsx`: `escadaLiberada() ? 'todos' : …`), a carreira com a escada usa
// mesmo os TRÊS baralhos. Refiz tudo com `'todos'` — e dois dos quatro achados
// caíram por terra.
//
// ⚠️ DIAGNÓSTICO. Nada foi mexido no jogo.
// Números: analisa-motor.mjs · conta-perna-de-pau.mjs · nivel-por-posicao.mjs
import { chromium } from 'playwright-core'

const SAIDA = process.argv[2] || '/tmp/raiox-motor.png'
const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6', VERDE = '#1B7A3D', VERM = '#C2452F'

// perna-de-pau na Série A, por baralho + quantas carreiras usam cada um (banco)
const BARALHOS = [
  ['🌎 Os três (Brasil+Europa+Mundo)', '3.142', 3, 0, 1],
  ['🇧🇷🇪🇺 Brasil + Europa', '2.808', 3, 0, 1],
  ['🇧🇷 Só Brasil', '204', 43, 30, 0],
  ['🇪🇺 Só Europa', '73', 78, 40, 0],
]
const NIVEL = [['🧤 Goleiro', 87.1], ['🏃 Lateral', 86.1], ['🧱 Zagueiro', 85.9], ['🎩 Meia', 86.5], ['⚽ Atacante', 87.9]]
const GOLS = [
  ['⚽ Atacante', '61%', '45%', 1], ['🎩 Meia', '30%', '30%', 1],
  ['🏃 Lateral', '7,1%', '5%', 1], ['🧱 Zagueiro', '2,6%', '11%', 0],
]
const VIDA = [
  ['Temporadas na Série C', '14 de 30'], ['Temporadas na Série B', '15 de 30'],
  ['Temporadas na Série A', '0 de 30'], ['Subiu / caiu', '8 acessos · 7 quedas'],
  ['Artilheiro foi ATACANTE', '90 de 90 vezes'],
]

const html = `<!doctype html><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;700;900&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0}
  body{background:${CREME};font-family:Oswald,system-ui;color:${INK};width:1020px;padding:28px}
  h1{font-size:46px;font-weight:900;text-transform:uppercase;line-height:.93}
  h1 .g{color:${VERDE}} h1 .r{color:${VERM}}
  .lead{background:${GOLD};border:3px solid ${INK};border-radius:14px;box-shadow:4px 4px 0 ${INK};
        padding:14px 17px;font-size:16px;font-weight:700;margin:14px 0 20px;line-height:1.45}
  .card{background:#fff;border:3px solid ${INK};border-radius:16px;box-shadow:4px 4px 0 ${INK};padding:17px 19px;margin-bottom:16px}
  .cab{display:inline-block;color:#fff;font-weight:900;font-size:13.5px;letter-spacing:.8px;
       text-transform:uppercase;padding:6px 13px;border-radius:9px;margin-bottom:12px;background:${VERM}}
  .cab.g{background:${VERDE}} .cab.o{background:#B8860B} .cab.k{background:${INK}}
  .sub{font-size:14px;font-weight:600;color:#555;margin:-4px 0 12px;line-height:1.45}
  table{width:100%;border-collapse:collapse;font-size:15.5px}
  th{font-size:11px;text-transform:uppercase;letter-spacing:.6px;text-align:right;padding:5px 8px;color:#777;font-weight:800}
  th.l,td.l{text-align:left}
  td{padding:10px 8px;border-top:1px solid rgba(12,12,12,.10);text-align:right;font-weight:800}
  td.l{font-weight:700}
  .ruim{color:${VERM};font-weight:900;font-size:20px}
  .ok{color:${VERDE};font-weight:900;font-size:18px}
  .cinza{color:#999;font-weight:700}
  .nota{background:#FDECEA;border:3px solid ${VERM};border-radius:13px;padding:13px 16px;margin-top:12px;
        font-size:14.5px;font-weight:700;line-height:1.45}
  .boa{background:#EAF5EE;border-color:${VERDE}} .boa b{color:${VERDE}}
</style>

<h1>RAIO-X DO MOTOR<br><span class="r">— CORRIGIDO</span></h1>
<div class="lead">❌ <b>Meu quadro anterior estava errado e você pegou:</b> eu rodei a simulação com o
baralho <b>só do Brasil</b>. Conferi no código — a carreira usa mesmo <b>os três baralhos</b>.
Refiz as 30 temporadas com o baralho certo. <b>Dois achados caíram por terra. Dois ficaram de pé.</b></div>

<div class="card">
  <span class="cab g">✅ caiu por terra — você estava certo</span>
  <div class="sub">O "perna-de-pau na lateral" que eu te mostrei <b>não existe na carreira de hoje</b>.
  Com os três baralhos sobra carta pra todo mundo. Fui ver no banco quantas carreiras usam cada baralho:</div>
  <table>
    <tr><th class="l">baralho da carreira</th><th>carreiras</th><th>lateral fake</th><th>zagueiro fake</th></tr>
    ${BARALHOS.map(([n, q, l, z, ok]) => `<tr><td class="l">${n}</td><td class="cinza">${q}</td>
      <td class="${ok ? 'ok' : 'ruim'}">${l}%</td><td class="${ok ? 'ok' : 'ruim'}">${z}%</td></tr>`).join('')}
  </table>
  <div class="nota">⚠️ <b>Mas sobra um canto ruim:</b> quem joga com <b>só Brasil</b> ou <b>só Europa</b>
  ainda pega isso — e no "só Europa" é feio: <b>78% dos laterais da Série A são carta fake</b>.
  São <b>277 carreiras</b> de umas 6.200 (4,5%). Pequeno, mas é exatamente a coisa que você odeia.</div>
</div>

<div class="card">
  <span class="cab g">✅ caiu por terra — o nível está PERFEITO</span>
  <div class="sub">Nível médio de quem entra em campo na Série A, por posição:</div>
  <table>${NIVEL.map(([p, v]) => `<tr><td class="l">${p}</td><td class="ok">${v}</td></tr>`).join('')}</table>
  <div class="nota boa">👉 <b>Tudo entre 85,9 e 87,9.</b> Não tem posição fraca, não tem goleiro
  gigante ao lado de lateral perna-de-pau. A escada de nível entre as divisões também está redondinha:
  <b>Série C 72 · Série B 80 · Série A 86,7</b> — uns 7 pontos por degrau, parelho.</div>
</div>

<div class="card">
  <span class="cab">🧱 ficou de pé nº 1 — o zagueiro está INVERTIDO</span>
  <div class="sub">Você perguntou de zagueiro fazendo muito gol. É o contrário: ele faz <b>de menos</b>,
  e o lateral faz quase <b>3× mais que ele</b>.</div>
  <table>
    <tr><th class="l">quem faz os gols</th><th>no jogo</th><th>no futebol real</th></tr>
    ${GOLS.map(([p, j, r, ok]) => `<tr><td class="l">${p}</td>
      <td class="${ok ? 'ok' : 'ruim'}">${j}</td><td class="cinza">${r}</td></tr>`).join('')}
  </table>
  <div class="nota">👉 No motor, a chance de gol por posição é <b>atacante 6 · meia 3 · LATERAL 1 ·
  ZAGUEIRO 0,4</b>. No futebol de verdade é o avesso: quem sobe no escanteio e cabeceia é o zagueirão,
  não o lateral.<br>
  👉 Efeito na tela: <b>o zagueiro do seu time faz ~1 gol por temporada inteira.</b></div>
</div>

<div class="card">
  <span class="cab k">🏆 ficou de pé nº 2 — a artilharia é monopólio do atacante</span>
  <div class="sub">30 temporadas × 3 divisões = 90 artilharias.</div>
  <table>${VIDA.map(([o, v]) => `<tr><td class="l">${o}</td><td class="ruim">${v}</td></tr>`).join('')}</table>
  <div class="nota">👉 <b>Meia NUNCA ganhou uma artilharia</b> nas 90. No top-5 das divisões, em 30 anos,
  foram <b>447 atacantes e 3 meias</b> — zero lateral, zero zagueiro.<br>
  👉 E a dificuldade: o time mediano virou <b>elevador entre C e B</b> (8 acessos, 7 quedas) e
  <b>não chegou à Série A nenhuma vez</b>. ⚠️ Ressalva honesta: nesta simulação o elenco dele ficou
  CONGELADO 30 anos (não contratou ninguém) — na vida real a pessoa reforça o time, então o muro da
  Série A é menor do que este número sugere.</div>
</div>
`

const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const page = await browser.newPage({ viewport: { width: 1020, height: 1400 }, deviceScaleFactor: 2 })
await page.setContent(html, { waitUntil: 'networkidle' })
await page.waitForTimeout(700)
await page.screenshot({ path: SAIDA, fullPage: true })
await browser.close()
console.log(SAIDA)
