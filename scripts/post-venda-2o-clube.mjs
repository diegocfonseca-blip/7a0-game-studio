// 📢 STORIES — "agora dá pra vender o 2º clube" (Diego 14/09).
//
// Formato: 1080×1920 (9:16), pra ele postar em stories. Palavras dele:
// *"e é stories, que eu quero postar"*.
//
// 📜 O CAMINHO ATÉ AQUI (3 voltas, vale guardar pra não refazer o zigue-zague):
//   1ª — post cheio, com preço, com a regra e com o churrasco. Ele cortou:
//        *"não conta por quanto vai valer não… não quero spoiler"*.
//   2ª — post quase vazio, só "dá pra vender o clube". Ele cortou de novo:
//        *"tem que botar assim, agora dá pra vender o SEGUNDO clube… faltou mais
//        informações aí"*.
//   3ª — ESTA: diz que é o SEGUNDO clube, explica o que acontece com ele e o que
//        volta ao normal… e continua **sem dizer o valor** e **sem contar o
//        churrasco de despedida**. Esses dois seguem proibidos.
//
// ⚠️ Resumo da regra pra quem mexer depois: pode explicar O QUE a feature faz.
// NÃO pode dizer QUANTO vale nem entregar a piada que aparece na hora de vender.
//
// Rodar: node scripts/post-venda-2o-clube.mjs [--saida /tmp/x.png]
import { chromium } from 'playwright-core'

const arg = (n, d = '') => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const SAIDA = arg('saida', '/tmp/stories-venda-2o-clube.png')
const INK = '#0C0C0C', CREME = '#F4ECD6', OURO = '#FFC400', VERM = '#C2452F'

const html = `<!doctype html><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;700;900&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box}
  body{margin:0;background:${CREME};font-family:Oswald,system-ui;color:${INK};
       width:1080px;height:1920px;padding:96px 66px 74px;display:flex;flex-direction:column}
  .pill{align-self:flex-start;background:${OURO};border:5px solid ${INK};border-radius:40px;
        padding:12px 30px;font-weight:900;font-size:24px;letter-spacing:2.4px;box-shadow:7px 7px 0 ${INK}}
  h1{font-size:118px;line-height:.89;margin:40px 0 0;text-transform:uppercase;letter-spacing:-3px}
  h1 em{font-style:normal;color:${VERM}}
  p.lead{font-family:system-ui;font-size:31px;line-height:1.4;color:#3a3527;margin:30px 0 0;font-weight:500}
  p.lead b{font-weight:800}

  .so{margin:34px 0 0;background:${INK};color:${CREME};border-radius:26px;padding:28px 32px;
      box-shadow:8px 8px 0 ${VERM}}
  .so h2{margin:0;font-size:46px;text-transform:uppercase;color:${OURO};line-height:1.05}
  .so p{margin:14px 0 0;font-family:system-ui;font-size:28px;line-height:1.4;color:rgba(244,236,214,.92)}
  .so p b{color:#fff}

  .c{background:#fff;border:6px solid ${INK};border-radius:24px;box-shadow:6px 6px 0 ${INK};
     padding:22px 26px;margin-top:22px}
  .c h3{margin:0 0 8px;font-size:34px;text-transform:uppercase;line-height:1.1}
  .c p{margin:0;font-family:system-ui;font-size:26px;line-height:1.4;color:#333}

  .shh{margin-top:auto;display:flex;align-items:center;gap:22px;background:#FFF4E2;
       border:6px solid #B8722A;border-radius:24px;padding:22px 26px;box-shadow:6px 6px 0 #B8722A}
  .shh .emo{font-size:62px;line-height:1}
  .shh p{margin:0;font-family:system-ui;font-size:28px;line-height:1.38;color:#3A2C18;font-weight:700}

  .foot{display:flex;justify-content:space-between;align-items:flex-end;margin-top:34px;
        border-top:7px solid ${INK};padding-top:22px}
  .foot .mk{font-size:46px;font-weight:900;text-transform:uppercase}
  .foot .mk span{color:${VERM}}
  .foot .rt{font-family:system-ui;font-size:23px;color:#6b6552;text-align:right;line-height:1.35}
</style>
<span class="pill">🏛️ NOVIDADE · MODO CARREIRA</span>
<h1>Agora dá pra<br><em>vender</em> o<br>2º clube</h1>
<p class="lead">Comprou um segundo clube e não quer mais? Agora dá pra devolver. O botão novo está na <b>aba Clube</b>.</p>

<div class="so">
  <h2>🚫 Só o segundo</h2>
  <p>O seu clube <b>oficial</b> — o do <b>rank global</b>, o que vai pra Copa do Mundo — <b>não se vende nunca</b>. Esse é seu e ponto.</p>
</div>

<div class="c">
  <h3>🤖 Ele fica no jogo</h3>
  <p>O clube vendido continua na divisão dele, comandado pela máquina, com o estádio, os títulos e o caixa que juntou.</p>
</div>
<div class="c">
  <h3>🤝 Empréstimo se acerta</h3>
  <p>Quem ele tinha emprestado volta pra ele. E se um jogador seu estava jogando lá, volta pra casa antes da venda.</p>
</div>
<div class="c">
  <h3>🔄 Volta ao normal</h3>
  <p>Somem o trocar de comando e o clube dormindo. E dá pra comprar outro segundo clube quando quiser.</p>
</div>

<div class="shh">
  <div class="emo">🤫</div>
  <p>Quanto você recebe de volta? Isso você descobre na hora.</p>
</div>

<div class="foot">
  <div class="mk">⚽ Leilão <span>Legends</span></div>
  <div class="rt">já está no ar<br>leilaolegends.com</div>
</div>`

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 })
await p.setContent(html, { waitUntil: 'networkidle' })
const sobra = await p.evaluate(() => document.body.scrollHeight - window.innerHeight)
if (sobra > 0) console.warn(`⚠️ o conteúdo passou ${sobra}px da altura do stories — encolher algo`)
await p.screenshot({ path: SAIDA })
await b.close()
console.log(SAIDA)
