// 📢 POST — "agora dá pra vender o 2º clube" (pedido do Diego 14/09: *"faça um aí,
// pode ser foto mesmo, da arte dizendo que agora tem a possibilidade de vender o
// clube. O segundo clube só apenas, né?"*).
//
// 🤫 REGRA DESTE POST: **não conta o que está escrito na hora da venda.** Palavras
// dele: *"mas não dá não do que que vem escrito na hora"*. Ou seja, o churrasco de
// despedida (a piada do −1.000) NÃO aparece aqui — quem vende descobre no jogo.
// É a regra de sempre dele: odeia spoiler.
//
// O post diz só: dá pra vender, é 3.000 das 4.000, SÓ o segundo clube, e o que
// acontece com o clube depois. O porquê das 1.000 fica como isca.
//
// Rodar: node scripts/post-venda-2o-clube.mjs [--saida /tmp/x.png]
import { chromium } from 'playwright-core'

const arg = (n, d = '') => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const SAIDA = arg('saida', '/tmp/post-venda-2o-clube.png')
const INK = '#0C0C0C', CREME = '#F4ECD6', OURO = '#FFC400', VERM = '#C2452F', VERDE = '#1B7A3D'

const html = `<!doctype html><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;700;900&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box}
  body{margin:0;background:${CREME};font-family:Oswald,system-ui;color:${INK};width:900px;padding:34px 32px 26px}
  .pill{display:inline-block;background:${OURO};border:3.5px solid ${INK};border-radius:30px;
        padding:7px 20px;font-weight:900;font-size:17px;letter-spacing:1.6px;box-shadow:4px 4px 0 ${INK}}
  h1{font-size:74px;line-height:.93;margin:20px 0 0;text-transform:uppercase;letter-spacing:-1px}
  h1 em{font-style:normal;color:${VERM}}
  p.lead{font-family:system-ui;font-size:20px;line-height:1.45;color:#3a3527;margin:16px 0 0;font-weight:500}
  p.lead b{font-weight:800}

  .so{margin:22px 0 0;background:${INK};color:${CREME};border-radius:18px;padding:18px 20px;
      box-shadow:5px 5px 0 ${VERM}}
  .so h2{margin:0;font-size:31px;text-transform:uppercase;color:${OURO};line-height:1.1}
  .so p{margin:9px 0 0;font-family:system-ui;font-size:17px;line-height:1.45;color:rgba(244,236,214,.9)}
  .so p b{color:#fff}

  .grid{display:flex;gap:14px;margin-top:22px}
  .c{flex:1;background:#fff;border:4px solid ${INK};border-radius:17px;box-shadow:4px 4px 0 ${INK};padding:15px}
  .c h3{margin:0 0 7px;font-size:18px;text-transform:uppercase;line-height:1.12}
  .c p{margin:0;font-family:system-ui;font-size:15px;line-height:1.45;color:#333}

  .isca{margin-top:20px;background:#FFF4E2;border:4px solid #B8722A;border-radius:17px;padding:16px 18px;
        box-shadow:4px 4px 0 #B8722A}
  .isca p{margin:0;font-family:system-ui;font-size:18px;line-height:1.45;color:#3A2C18;font-weight:600}
  .isca b{font-weight:800}

  .foot{display:flex;justify-content:space-between;align-items:center;margin-top:26px;
        border-top:4px solid ${INK};padding-top:14px}
  .foot .mk{font-size:27px;font-weight:900;text-transform:uppercase}
  .foot .mk span{color:${VERM}}
  .foot .rt{font-family:system-ui;font-size:15px;color:#6b6552;text-align:right;line-height:1.35}
</style>
<span class="pill">🏛️ NOVIDADE · CARREIRA</span>
<h1>Agora dá pra<br><em>vender</em> o 2º clube</h1>
<p class="lead">Comprou um segundo clube e não quer mais? Na aba <b>Clube</b> agora tem o botão de vender. Você <b>recebe 3.000</b> das 4.000 moedas que pagou, e elas caem no caixa do time na hora.</p>

<div class="so">
  <h2>🚫 Só o segundo clube</h2>
  <p>O seu clube <b>oficial</b> — o que aparece no <b>rank global</b>, o que vai pra Copa do Mundo — <b>não se vende nunca</b>. Nem sem querer, nem trocando o comando antes. Esse é seu e ponto.</p>
</div>

<div class="grid">
  <div class="c">
    <h3>🤖 Ele fica no jogo</h3>
    <p>O clube vendido continua na divisão dele, comandado pela máquina, com o estádio, os títulos e o caixa que juntou.</p>
  </div>
  <div class="c">
    <h3>🤝 Empréstimo se acerta</h3>
    <p>Quem ele tinha emprestado volta pra ele. E se algum jogador seu estava jogando lá, volta pra casa antes da venda.</p>
  </div>
  <div class="c">
    <h3>🔄 Volta ao normal</h3>
    <p>Somem o trocar de comando e o clube dormindo. O jogo fica de um clube só de novo — e dá pra comprar outro quando quiser.</p>
  </div>
</div>

<div class="isca">
  <p>🤫 Ah: das 4.000 você recebe 3.000. <b>O que aconteceu com as outras 1.000 você só descobre na hora de vender.</b> Não vou estragar a surpresa.</p>
</div>

<div class="foot">
  <div class="mk">⚽ Leilão <span>Legends</span></div>
  <div class="rt">Modo Carreira · já está no ar<br>leilaolegends.com</div>
</div>`

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 900, height: 400 }, deviceScaleFactor: 2 })
await p.setContent(html, { waitUntil: 'networkidle' })
await p.screenshot({ path: SAIDA, fullPage: true })
await b.close()
console.log(SAIDA)
