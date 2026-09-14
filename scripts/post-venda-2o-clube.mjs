// 📢 POST — "agora dá pra vender o clube" (pedido do Diego 14/09: *"faça um aí, pode
// ser foto mesmo, da arte dizendo que agora tem a possibilidade de vender o clube"*).
//
// 🤫 ESTE POST É QUASE VAZIO DE PROPÓSITO. Ele cortou a 1ª versão inteira:
//   · *"não conta por quanto vai valer não"* → sem preço, sem 3.000, sem 4.000;
//   · *"que vai se contar tanto, não conta isso, não quero spoiler"* → sem o churrasco
//     de despedida, sem o que acontece com o clube depois;
//   · *"e não precisa falar também só segundo clube. A pessoa vai saber na hora"*.
//
// Sobra o essencial: a novidade existe e mora na aba Clube. Todo o resto é descoberto
// jogando. É a birra dele com spoiler valendo também pra divulgação.
// ⚠️ Se um dia alguém for "melhorar" este post enchendo de detalhe, está desfazendo
// uma ordem direta dele. O vazio aqui é a feature.
//
// Rodar: node scripts/post-venda-2o-clube.mjs [--saida /tmp/x.png]
import { chromium } from 'playwright-core'

const arg = (n, d = '') => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const SAIDA = arg('saida', '/tmp/post-venda-2o-clube.png')
const INK = '#0C0C0C', CREME = '#F4ECD6', OURO = '#FFC400', VERM = '#C2452F'

const html = `<!doctype html><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;700;900&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box}
  body{margin:0;background:${CREME};font-family:Oswald,system-ui;color:${INK};width:900px;height:900px;
       padding:48px 46px;display:flex;flex-direction:column}
  .pill{align-self:flex-start;background:${OURO};border:4px solid ${INK};border-radius:32px;
        padding:9px 24px;font-weight:900;font-size:19px;letter-spacing:2px;box-shadow:5px 5px 0 ${INK}}
  h1{font-size:112px;line-height:.9;margin:36px 0 0;text-transform:uppercase;letter-spacing:-2.5px}
  h1 em{font-style:normal;color:${VERM}}
  .sel{margin-top:34px;background:${INK};color:${CREME};border-radius:20px;padding:22px 26px;
       box-shadow:6px 6px 0 ${VERM}}
  .sel p{margin:0;font-family:system-ui;font-size:23px;line-height:1.4;font-weight:600}
  .sel b{color:${OURO};font-weight:800}
  .shh{margin-top:auto;display:flex;align-items:center;gap:16px}
  .shh .emo{font-size:52px;line-height:1}
  .shh p{margin:0;font-family:system-ui;font-size:22px;line-height:1.4;color:#3a3527;font-weight:600}
  .foot{display:flex;justify-content:space-between;align-items:flex-end;margin-top:30px;
        border-top:5px solid ${INK};padding-top:16px}
  .foot .mk{font-size:31px;font-weight:900;text-transform:uppercase}
  .foot .mk span{color:${VERM}}
  .foot .rt{font-family:system-ui;font-size:16px;color:#6b6552;text-align:right;line-height:1.35}
</style>
<span class="pill">🏛️ NOVIDADE · CARREIRA</span>
<h1>Agora dá<br>pra <em>vender</em><br>o clube</h1>
<div class="sel"><p>O botão novo está te esperando na <b>aba Clube</b>.</p></div>
<div class="shh">
  <div class="emo">🤫</div>
  <p>O resto você descobre na hora.</p>
</div>
<div class="foot">
  <div class="mk">⚽ Leilão <span>Legends</span></div>
  <div class="rt">Modo Carreira · já está no ar<br>leilaolegends.com</div>
</div>`

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 900, height: 900 }, deviceScaleFactor: 2 })
await p.setContent(html, { waitUntil: 'networkidle' })
await p.screenshot({ path: SAIDA })
await b.close()
console.log(SAIDA)
