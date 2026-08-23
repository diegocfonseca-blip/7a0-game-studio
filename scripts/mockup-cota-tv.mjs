// ─── 📺 MOCKUP: "SEU CLUBE NA TV" — o UGC da carreira com história de futebol ──
//
// Pedido do Diego (23/08): *"quero um banner pra quem for jogar carreira, mas
// algo relacionado a futebol — fingindo que é algo pro CLUBE que ele ganha,
// uma historinha. O vídeo: ele jogando, filmando a tela — mas TEM que ser
// vídeo, não pode ser foto parada — algo que tenha sentido com o jogo, que
// conte uma história de pra que é, e com isso ganha moedas"*.
//
// REGRAS FECHADAS PELO DIEGO (23/08, palavras dele):
//   *"vídeo de no mínimo 15s, seja Instagram marcando @leilaolegendscom ou
//   15s no TikTok marcado @leilaolegendscom. Não pode foto. É vídeo da tela
//   sendo jogada ou vc jogando o jogo aparecendo seu time na tela. Vale
//   apenas UM vídeo por temporada. Cada vídeo vale 10 MOEDAS extras no clube
//   e, como toda cota de TV, pode atrasar um pouco mas vai receber."*
//
// A emissora é a REDE PELADA — a mesma que JÁ paga a cota de TV por divisão
// no fim de temporada (banner "A TV descobriu seu clube!", Diego 11/08).
// Isto aqui é a COTA EXTRA da mesma TV: aparecer na "transmissão" (o vídeo
// postado) = +10 🪙 no caixa. A conferência é MANUAL do Diego (mesmo esquema
// do Pix das fichas): a marcação do @ avisa ele na rede social, o link colado
// no jogo diz QUAL conta/clube recebe, e ele aprova no admin quando der —
// por isso o status "🕓 em análise na emissora" (a cota "atrasa" sem quebrar).
//
// ⚠️ SÓ DESENHO — nada disto está no jogo. Aguardando OK visual do Diego.
//   node scripts/mockup-cota-tv.mjs [--saida x.png]
import { chromium } from 'playwright-core'
import { readFileSync, statSync } from 'node:fs'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'cota-tv.png')
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const INK = '#0C0C0C', GOLD = '#FFC400', RED = '#C2452F', GREEN = '#1B7A3D'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'

const html = `<style>${FONTES}
*{box-sizing:border-box} body{margin:0;background:#F4ECD6;font-family:system-ui,-apple-system,sans-serif;color:${INK};padding:24px}
.fone{width:420px;margin:0 auto}
.rotulo{${OSW};font-size:11px;text-transform:uppercase;letter-spacing:.14em;color:rgba(12,12,12,.45);margin:0 0 8px}
.banner{position:relative;background:linear-gradient(150deg,#1c1c1e,#0C0C0C 60%,#26221a);border:4px solid ${INK};border-radius:18px;box-shadow:4px 4px 0 ${INK};padding:13px 14px;overflow:hidden;color:#fff}
.aovivo{position:absolute;top:10px;right:10px;background:${RED};border:2px solid #fff3;border-radius:8px;${OSW};font-size:10px;letter-spacing:.1em;padding:3px 8px;display:flex;align-items:center;gap:5px}
.dot{width:7px;height:7px;border-radius:99px;background:#fff;animation:p 1.2s infinite}
@keyframes p{50%{opacity:.3}}
.b-tit{${OSW};font-size:19px;text-transform:uppercase;margin:0;padding-right:74px;color:${GOLD}}
.b-txt{font-weight:600;font-size:12.5px;line-height:1.4;color:rgba(255,255,255,.85);margin:5px 0 10px}
.b-cta{background:${GOLD};color:${INK};border:2.5px solid #000;border-radius:11px;${OSW};font-size:13.5px;text-align:center;padding:9px 8px;text-transform:uppercase}
.card{background:#fff;border:4px solid ${INK};border-radius:18px;box-shadow:4px 4px 0 ${INK};padding:14px;margin-top:18px}
.tit{${OSW};font-size:12px;text-transform:uppercase;letter-spacing:.13em;color:rgba(12,12,12,.5);margin:0 0 9px}
.passo{display:flex;gap:10px;align-items:flex-start;margin-bottom:9px}
.pn{flex:none;width:26px;height:26px;border-radius:99px;background:${INK};color:${GOLD};display:flex;align-items:center;justify-content:center;${OSW};font-size:13px}
.pt{margin:0;font-weight:700;font-size:12.5px;line-height:1.4}
.aviso{background:#FDECEA;border:2.5px solid ${RED};border-radius:11px;padding:8px 11px;font-weight:800;font-size:11px;color:#7a2418;line-height:1.4;margin-top:10px}
.valor{display:flex;align-items:center;gap:10px;background:linear-gradient(150deg,#FFE79A,${GOLD} 60%,#E8A200);border:3px solid ${INK};border-radius:13px;box-shadow:3px 3px 0 ${INK};padding:11px 13px}
.v-num{${OSW};font-size:26px;white-space:nowrap}
.v-txt{font-weight:800;font-size:11.5px;line-height:1.35}
.regra{display:flex;align-items:center;gap:9px;font-weight:800;font-size:12px;line-height:1.35;margin-top:9px}
.regra .ic{flex:none;font-size:16px}
.fila{display:flex;align-items:center;gap:9px;background:#F4ECD6;border:2.5px dashed rgba(12,12,12,.4);border-radius:11px;padding:9px 11px;font-weight:800;font-size:11.5px;color:rgba(12,12,12,.75);margin-top:10px}
</style>
<div class="fone">
  <p class="rotulo">① O banner, na tela da carreira</p>
  <div class="banner">
    <div class="aovivo"><span class="dot"></span> AO VIVO</div>
    <p class="b-tit">📺 A TV quer o SEU clube!</p>
    <p class="b-txt">A <b>Rede Pelada</b> paga <b>cota EXTRA</b> pra clube que aparecer na transmissão: filma seu jogo, posta, e a cota cai <b>na caixa do clube</b>. 🪙</p>
    <div class="b-cta">🎬 Televisionar meu jogo</div>
  </div>

  <p class="rotulo" style="margin-top:20px">② Tocou no banner: a história e as regras</p>
  <div class="card">
    <p class="tit">📺 Como o clube entra na TV</p>
    <div class="passo"><div class="pn">1</div><p class="pt"><b>Grava um vídeo de 15s ou mais</b>: a tela do jogo rolando — ou você jogando, com o seu time aparecendo na tela. O martelo, o gol, o título, a zebra: o momento é seu.</p></div>
    <div class="passo"><div class="pn">2</div><p class="pt"><b>Posta no Instagram ou no TikTok</b> marcando <b>@leilaolegendscom</b>.</p></div>
    <div class="passo"><div class="pn">3</div><p class="pt"><b>Cola o link aqui</b> — a emissora confere e deposita a cota <b>na caixa do seu clube</b>. 💰</p></div>
    <div class="aviso">📵 Foto não vale — a TV só paga por <b>vídeo com o jogo acontecendo</b>.</div>
  </div>

  <p class="rotulo" style="margin-top:20px">③ Quanto vale (regras do Diego, 23/08)</p>
  <div class="card">
    <div class="valor"><div class="v-num">+10 🪙</div><div class="v-txt">extras na caixa do clube,<br>por vídeo aprovado</div></div>
    <div class="regra"><span class="ic">🗓️</span><span>Vale <b>1 vídeo por temporada</b> — temporada nova, vídeo novo.</span></div>
    <div class="regra"><span class="ic">🔗</span><span>Cada vídeo vale <b>uma vez só</b> — repetir o mesmo link não paga de novo.</span></div>
    <div class="fila"><span style="font-size:15px">🕓</span><span><b>Em análise na emissora</b> — como toda cota de TV, pode atrasar um pouco… mas cai. 💰</span></div>
  </div>
</div>`

const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const page = await browser.newPage({ viewport: { width: 470, height: 1000 }, deviceScaleFactor: 2 })
await page.setContent(html, { waitUntil: 'load' })
await page.evaluate(() => document.fonts.ready)
await page.screenshot({ path: SAIDA, fullPage: true })
await browser.close()
console.log(`${SAIDA} · ${(statSync(SAIDA).size / 1024).toFixed(0)} KB`)
