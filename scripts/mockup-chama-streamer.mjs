// ─── 🎥 ARTE DA CAMPANHA "CHAMA UM STREAMER" (pra POSTAR) ───────────────────
//
// A campanha é de 12/08: o jogador que faz um streamer POSTAR o jogo ganha
// prêmio — e o streamer também. Prêmios por tamanho do streamer (o Diego decide
// caso a caso): ⭐ Craque · 👑 Lenda · 🎖️ Batismo · 🛡️ escudo + mascote.
// Print da prova vai no direct do @leilaolegendscom.
//
// Esta é a versão IMAGEM, pros próprios jogadores repostarem (zap, status,
// stories). A 1ª versão morreu com o scratchpad de uma sessão antiga — por isso
// agora ela mora AQUI, no repo (mesma lição do mockup do Coringas).
//
//   node scripts/mockup-chama-streamer.mjs [--saida x.png]
import { chromium } from 'playwright-core'
import { readFileSync, statSync } from 'node:fs'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'chama-streamer.png')
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const INK = '#0C0C0C', GOLD = '#FFC400', RED = '#C2452F', GREEN = '#1B7A3D', ROXO = '#7C3AED'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'

const premio = (emoji, nome, desc, bg, fg = INK) => `
<div style="flex:1;min-width:0;background:${bg};border:3px solid ${INK};border-radius:15px;box-shadow:3px 3px 0 ${INK};padding:11px 8px;text-align:center;color:${fg}">
  <div style="font-size:30px;line-height:1">${emoji}</div>
  <div style="${OSW};font-size:15px;text-transform:uppercase;margin-top:4px">${nome}</div>
  <div style="font-weight:600;font-size:10.5px;line-height:1.3;opacity:.75;margin-top:2px">${desc}</div>
</div>`

const passo = (n, txt) => `
<div style="display:flex;align-items:center;gap:11px">
  <div style="flex:none;width:34px;height:34px;border-radius:999px;background:${INK};color:${GOLD};display:flex;align-items:center;justify-content:center;${OSW};font-size:17px">${n}</div>
  <p style="margin:0;font-weight:700;font-size:15px;line-height:1.35">${txt}</p>
</div>`

const html = `<style>${FONTES}
*{box-sizing:border-box} body{margin:0;background:${INK};font-family:system-ui,-apple-system,sans-serif;color:${INK}}
.folha{width:810px;padding:26px 24px 20px;background:#F4ECD6;border:10px solid ${INK}}
.pill{display:inline-block;background:${ROXO};color:#fff;border:3px solid ${INK};border-radius:999px;padding:7px 17px;${OSW};font-size:13px;text-transform:uppercase;letter-spacing:.1em;box-shadow:3px 3px 0 ${INK}}
h1{${OSW};font-size:57px;line-height:1.0;text-transform:uppercase;margin:16px 0 0}
h1 .d{color:${RED}}
.sub{font-size:17.5px;font-weight:700;color:rgba(12,12,12,.72);margin:12px 0 0;line-height:1.4;max-width:720px}
.card{background:#fff;border:4px solid ${INK};border-radius:18px;box-shadow:5px 5px 0 ${INK};padding:15px 16px;margin-top:18px}
.tit{${OSW};font-size:13px;text-transform:uppercase;letter-spacing:.14em;color:rgba(12,12,12,.5);margin:0 0 10px}
.zap{background:${INK};color:${GOLD};border-radius:14px;${OSW};font-size:19px;text-align:center;padding:13px 10px;margin-top:18px}
.zap span{color:#fff}
.rodape{display:flex;align-items:center;justify-content:space-between;margin-top:16px}
.marca{${OSW};font-size:20px;color:${INK}}
.marca b{color:${RED}}
.site{font-weight:800;font-size:14px;color:rgba(12,12,12,.5)}
</style>
<div class="folha">
  <div class="pill">🎥 Campanha · vale pra todo mundo</div>
  <h1>CHAMA UM<br><span class="d">STREAMER!</span></h1>
  <p class="sub">Você manda o jogo pra um streamer/influencer. Ele <b>posta</b>. Pronto: <b>VOCÊ E ELE ganham prêmio</b> dentro do jogo — e quanto maior o canal, maior o prêmio. 👀</p>

  <div class="card">
    <p class="tit">🎁 Os prêmios (pra você E pra ele)</p>
    <div style="display:flex;gap:10px">
      ${premio('⭐', 'Craque', 'benefícios no jogo', '#E8E8E8')}
      ${premio('👑', 'Lenda', 'o pacote dourado inteiro', `linear-gradient(150deg,#FFE79A,${GOLD} 60%,#E8A200)`)}
      ${premio('🎖️', 'Batismo', 'um CLUBE com seu nome na pirâmide', `linear-gradient(150deg,#e6d1ff,#c9a4ff)`)}
      ${premio('🛡️', 'Escudo + Mascote', 'sua marca dentro do jogo', `linear-gradient(160deg,${GREEN},#14401f)`, '#fff')}
    </div>
  </div>

  <div class="card">
    <p class="tit">📲 Como funciona</p>
    <div style="display:flex;flex-direction:column;gap:10px">
      ${passo(1, 'Manda o <b>leilaolegends.com</b> pro streamer que você acompanha')}
      ${passo(2, 'Ele joga e <b>posta</b> (live, story, vídeo — vale tudo)')}
      ${passo(3, 'Você manda o <b>print</b> no direct — e os DOIS levam o prêmio 🏆')}
    </div>
  </div>

  <div class="zap">Postou? Manda o print 📲 <span>@leilaolegendscom</span></div>

  <div class="rodape">
    <div class="marca">⚽ Leilão <b>Legends</b></div>
    <div class="site">leilaolegends.com · grátis, direto do navegador</div>
  </div>
</div>`

const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const page = await browser.newPage({ viewport: { width: 810, height: 1100 }, deviceScaleFactor: 2 })
await page.setContent(html, { waitUntil: 'load' })
await page.evaluate(() => document.fonts.ready)
const el = await page.$('.folha')
await el.screenshot({ path: SAIDA })
await browser.close()
console.log(`${SAIDA} · ${(statSync(SAIDA).size / 1024).toFixed(0)} KB`)
