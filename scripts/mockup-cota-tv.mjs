// ─── 📺 MOCKUP: A CASA DA TV — contrato + cota extra das redes, tudo junto ──
//
// Pedido do Diego (23/08), em 3 tempos:
// 1. *"quero um banner pra quem for jogar carreira… fingindo que é algo pro
//    CLUBE que ele ganha, uma historinha… TEM que ser vídeo, não pode ser
//    foto… e com isso ganha moedas"*.
// 2. REGRAS FECHADAS (palavras dele): *"vídeo de no mínimo 15s, seja Instagram
//    marcando @leilaolegendscom ou 15s no TikTok marcado @leilaolegendscom.
//    Não pode foto. É vídeo da tela sendo jogada ou vc jogando o jogo
//    aparecendo seu time na tela. Vale apenas UM vídeo por temporada. Cada
//    vídeo vale 10 MOEDAS extras no clube e, como toda cota de TV, pode
//    atrasar um pouco mas vai receber."*
// 3. REFORMA DA TV INTEIRA (23/08): *"podemos reformular como está hoje junto
//    com o que você tá fazendo? Não tô vendo nada falando de TV no jogo, não
//    tá muito clara. A história tem que ser: a TV JÁ paga, mas é cota extra de
//    transmissão também nas redes sociais… organizado, hora certa… e ficar
//    dentro da aba de patrocínios"*.
//
// Hoje a TV só existe em 2 pontos e some: banner 1x por divisão nova (fim de
// temporada) e a linha "📺 Cota de TV" no extrato. A reforma dá MORADA FIXA:
// um card "📺 Contrato de TV — Rede Martelo TV" na aba 🏟️ Clube › 🤝 Patrocínio,
// com o contrato por divisão (que já paga sozinho) + a cota extra das redes
// (o vídeo) no MESMO card — uma emissora, uma história. Conferência manual do
// Diego (esquema do Pix): a marcação do @ avisa ele, o link diz qual clube
// recebe, ele aprova no admin quando der.
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

// escadinha do contrato por divisão (valores REAIS do jogo, store.tsx TV_COTA)
const degrau = (div, v, atual) => `
<div style="flex:1;text-align:center;border:2.5px solid ${atual ? INK : 'rgba(12,12,12,.25)'};border-radius:10px;padding:5px 2px;background:${atual ? GOLD : '#FBF6E9'};${atual ? `box-shadow:2px 2px 0 ${INK};` : 'opacity:.75;'}">
  <div style="${OSW};font-size:12px">${div}</div>
  <div style="font-weight:800;font-size:10px;white-space:nowrap">${v} 🪙</div>
  ${atual ? `<div style="font-size:7px;font-weight:900;text-transform:uppercase;letter-spacing:.05em">você</div>` : `<div style="font-size:7px;">&nbsp;</div>`}
</div>`

const html = `<style>${FONTES}
*{box-sizing:border-box} body{margin:0;background:#F4ECD6;font-family:system-ui,-apple-system,sans-serif;color:${INK};padding:24px}
.fone{width:420px;margin:0 auto}
.rotulo{${OSW};font-size:11px;text-transform:uppercase;letter-spacing:.14em;color:rgba(12,12,12,.45);margin:0 0 8px}
.abas{display:flex;gap:6px;margin-bottom:10px}
.aba{flex:1;text-align:center;border:2.5px solid rgba(12,12,12,.3);border-radius:10px;padding:6px 2px;${OSW};font-size:10px;text-transform:uppercase;color:rgba(12,12,12,.45);background:#EFE6CC}
.aba.on{border-color:${INK};background:#fff;color:${INK};box-shadow:2px 2px 0 ${INK}}
.card{background:#fff;border:4px solid ${INK};border-radius:18px;box-shadow:4px 4px 0 ${INK};overflow:hidden;margin-top:14px}
.tv-head{position:relative;background:linear-gradient(150deg,#1c1c1e,#0C0C0C 60%,#26221a);padding:12px 14px;color:#fff}
.aovivo{position:absolute;top:10px;right:10px;background:${RED};border:2px solid #fff3;border-radius:8px;${OSW};font-size:9px;letter-spacing:.1em;padding:2px 7px;display:flex;align-items:center;gap:4px}
.dot{width:6px;height:6px;border-radius:99px;background:#fff;animation:p 1.2s infinite}
@keyframes p{50%{opacity:.3}}
.tv-tag{font-size:8.5px;letter-spacing:1px;text-transform:uppercase;color:rgba(255,255,255,.6);font-weight:800;margin:0}
.tv-tit{${OSW};font-size:17px;text-transform:uppercase;margin:1px 0 0;color:${GOLD}}
.corpo{padding:12px 13px}
.sec{${OSW};font-size:10.5px;text-transform:uppercase;letter-spacing:.12em;color:rgba(12,12,12,.5);margin:0 0 7px}
.linha-cota{display:flex;align-items:center;gap:10px;background:#EAF7EE;border:2.5px solid ${GREEN};border-radius:11px;padding:8px 11px;font-weight:800;font-size:11.5px;line-height:1.35;margin-bottom:9px}
.divisor{border-top:2.5px dashed rgba(12,12,12,.2);margin:13px 0 11px}
.extra{display:flex;align-items:center;gap:10px;background:linear-gradient(150deg,#FFE79A,${GOLD} 60%,#E8A200);border:3px solid ${INK};border-radius:12px;box-shadow:2.5px 2.5px 0 ${INK};padding:9px 12px;margin-bottom:8px}
.x-num{${OSW};font-size:22px;white-space:nowrap}
.x-txt{font-weight:800;font-size:10.5px;line-height:1.3}
.cta{background:${INK};color:${GOLD};border:2.5px solid #000;border-radius:11px;${OSW};font-size:13px;text-align:center;padding:9px 8px;text-transform:uppercase;margin-top:3px}
.fila{display:flex;align-items:center;gap:8px;background:#F4ECD6;border:2.5px dashed rgba(12,12,12,.4);border-radius:10px;padding:7px 10px;font-weight:800;font-size:10.5px;color:rgba(12,12,12,.75);margin-top:8px}
.passo{display:flex;gap:10px;align-items:flex-start;margin-bottom:9px}
.pn{flex:none;width:26px;height:26px;border-radius:99px;background:${INK};color:${GOLD};display:flex;align-items:center;justify-content:center;${OSW};font-size:13px}
.pt{margin:0;font-weight:700;font-size:12.5px;line-height:1.4}
.aviso{background:#FDECEA;border:2.5px solid ${RED};border-radius:11px;padding:8px 11px;font-weight:800;font-size:11px;color:#7a2418;line-height:1.4;margin-top:10px}
.card2{background:#fff;border:4px solid ${INK};border-radius:18px;box-shadow:4px 4px 0 ${INK};padding:14px;margin-top:14px}
.banner-fim{background:linear-gradient(150deg,#2b2b2b,#0C0C0C);border:4px solid ${INK};border-radius:16px;box-shadow:4px 4px 0 ${INK};padding:13px 14px;color:#fff;margin-top:14px}
.bf-pill{display:inline-block;background:${GOLD};color:${INK};font-weight:900;font-size:10px;padding:3px 9px;border-radius:999px;border:2px solid ${INK};text-transform:uppercase}
</style>
<div class="fone">
  <p class="rotulo">① A morada fixa: aba 🏟️ Clube › 🤝 Patrocínio</p>
  <div class="abas">
    <div class="aba">🏟️ Estádio</div><div class="aba">💰 Finanças</div><div class="aba on">🤝 Patrocínio</div><div class="aba">💼 Agência</div>
  </div>
  <div style="border:2.5px dashed rgba(12,12,12,.35);border-radius:12px;padding:8px 11px;font-weight:800;font-size:10.5px;color:rgba(12,12,12,.55)">🤝 Patrocínio da temporada (o que já existe fica aqui em cima, igual hoje)</div>

  <div class="card">
    <div class="tv-head">
      <div class="aovivo"><span class="dot"></span> AO VIVO</div>
      <p class="tv-tag">📺 contrato de transmissão</p>
      <p class="tv-tit">Rede Martelo TV</p>
    </div>
    <div class="corpo">
      <p class="sec">🖋️ Seu contrato — paga sozinho, todo fim de temporada</p>
      <div style="display:flex;gap:5px;margin-bottom:8px">
        ${degrau('V', 1, false)}${degrau('D', 5, false)}${degrau('C', 10, false)}${degrau('B', 15, true)}${degrau('A', 20, false)}
      </div>
      <div class="linha-cota"><span style="font-size:15px">📡</span><span>Você está na <b>Série B</b>: a Rede Martelo TV deposita <b>+15 🪙 por temporada</b> no caixa. Subiu de série? O contrato melhora sozinho.</span></div>

      <div class="divisor"></div>
      <p class="sec">📱 Cota extra: transmissão nas redes sociais</p>
      <div class="extra"><div class="x-num">+10 🪙</div><div class="x-txt">por vídeo aprovado —<br><b>1 vídeo por temporada</b></div></div>
      <p style="font-weight:700;font-size:11.5px;line-height:1.4;margin:0 0 8px">A emissora também paga por jogo que passa <b>nas redes</b>: filma seu jogo, posta marcando <b>@leilaolegendscom</b>, cola o link — e a cota extra cai na caixa do clube.</p>
      <div class="cta">🎬 Televisionar meu jogo</div>
      <div class="fila"><span style="font-size:14px">🕓</span><span><b>Vídeo da T4 em análise na emissora</b> — como toda cota de TV, pode atrasar um pouco… mas cai. 💰</span></div>
    </div>
  </div>

  <p class="rotulo" style="margin-top:22px">② Tocou em "televisionar": as regras (fechadas 23/08)</p>
  <div class="card2">
    <div class="passo"><div class="pn">1</div><p class="pt"><b>Grava um vídeo de 15s ou mais</b>: a tela do jogo rolando — ou você jogando, com o seu time aparecendo na tela. O martelo, o gol, o título, a zebra: o momento é seu.</p></div>
    <div class="passo"><div class="pn">2</div><p class="pt"><b>Posta no Instagram ou no TikTok</b> marcando <b>@leilaolegendscom</b>.</p></div>
    <div class="passo"><div class="pn">3</div><p class="pt"><b>Cola o link aqui</b> — a emissora confere e deposita <b>+10 🪙 na caixa do seu clube</b>.</p></div>
    <div class="aviso">📵 Foto não vale — a TV só paga por <b>vídeo com o jogo acontecendo</b>. E cada vídeo vale uma vez só.</div>
  </div>

  <p class="rotulo" style="margin-top:22px">③ A hora certa: o banner do fim de temporada (o que já existe, com a história completa)</p>
  <div class="banner-fim">
    <span class="bf-pill">📺 Contrato de TV</span>
    <p style="${OSW};font-size:17px;text-transform:uppercase;margin:8px 0 0;line-height:1.1">A TV descobriu <span style="color:${GOLD}">seu clube!</span></p>
    <p style="font-size:12px;font-weight:600;line-height:1.45;margin:7px 0 0;color:#EDE7D3">A <b>Rede Martelo TV</b> assinou o 1º contrato do seu clube: <b>cota por temporada</b> direto no caixa — e agora também paga <b>cota extra</b> por transmissão nas redes sociais. 📡</p>
    <p style="font-size:10.5px;font-weight:800;margin:9px 0 0;color:${GOLD}">Tudo do contrato mora em: 🏟️ Clube › 🤝 Patrocínio</p>
  </div>
</div>`

const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const page = await browser.newPage({ viewport: { width: 470, height: 1000 }, deviceScaleFactor: 2 })
await page.setContent(html, { waitUntil: 'load' })
await page.evaluate(() => document.fonts.ready)
await page.screenshot({ path: SAIDA, fullPage: true })
await browser.close()
console.log(`${SAIDA} · ${(statSync(SAIDA).size / 1024).toFixed(0)} KB`)
