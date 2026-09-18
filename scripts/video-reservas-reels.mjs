// ─── 🎬 REELS 1080×1920: O BANCO CRESCEU — 11 → 16 RESERVAS (+1 por posição) ──
// Pedido do Diego (18/09): *"preciso de mockup agora com vídeo padrão q sempre
// fazemos, dizendo q agora aumentou o número de reservas incluindo mais um por
// posição, tendo agora mais 5. Porém, abrindo mais vagas tb tem q tomar cuidado
// com salário e renovação. Portanto é algo mt bom ter mais reservas e tal, mas
// com cuidado"*.
// Mesma técnica dos outros reels do repo (`video-preparador-reels.mjs`): as cenas
// são keyframes de CSS, o Playwright GRAVA A TELA em tempo real (webm) e o ffmpeg
// converte pra mp4 do Instagram/WhatsApp.
//
// 🚀 ATUALIZADO 18/09: a trava ABRIU (`ELENCO27_GERAL = true`), então a fita final diz
// "já está no ar" (verde), não mais "chegando". A legenda do post diz o mesmo — fita não
// pode contradizer o jogo.
//
// 🧾 OS NÚMEROS SÃO OS DO CÓDIGO, não chute:
//   · salário = `salaryOfCard` (store.tsx): **piso ÷ 10** por jogador, por temporada
//   · emprestado da SAF paga **ZERO** salário (mesma função, primeira linha)
//   · renovar (`renewCost`): **5 temporadas = metade** do valor · **10 = 90%**
//   · teto: 11 titulares + 16 reservas = **27**, e a SAF entra POR CIMA (A 4 · B 3 · C 2 · D 1)
//
// 🎞️ Roteiro (~26 s):
//   0,0–3,6    o seu banco cresceu: de 11 pra 16
//   3,6–8,4    +1 EM CADA POSIÇÃO (as cinco fichinhas)
//   8,4–12,6   a conta: 11 + 16 = 27 · e a SAF entra por cima (até 31)
//   12,6–19,0  ⚠️ o cuidado: 💸 salário todo ano · 📝 renovação quando o contrato vence
//   19,0–22,6  a régua: vaga a mais NÃO é obrigação
//   22,6–26,0  marca
//
//   node scripts/video-reservas-reels.mjs [--saida reservas-reels.mp4]
//   (ffmpeg: usa `ffmpeg-static` se instalado, senão FFMPEG=/caminho/ffmpeg, senão o do PATH)
import { readFileSync, writeFileSync, readdirSync, rmSync, mkdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { chromium } from 'playwright-core'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'reservas-reels.mp4')
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6', GREEN = '#1B7A3D', RED = '#E8503A', AMBAR = '#D9A000'
const SLATE = '#3E4A5A'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'

const pill = (txt, bg, cor, fs = 32) => `
  <span style="display:inline-block;background:${bg};color:${cor};border:4px solid ${INK};border-radius:999px;
    box-shadow:5px 5px 0 ${INK};padding:10px 32px;${OSW};font-size:${fs}px;letter-spacing:.06em;text-transform:uppercase">${txt}</span>`

const cena = (ini, fim, html) => `
  <div class="cena" style="animation:apar .01s linear ${ini}s both, some .01s linear ${fim}s both">${html}</div>`

// 🎽 a fichinha de uma posição: "+1" grande e o nome da posição embaixo
const vaga = (emoji, pos, de, para, atraso) => `
  <div style="width:168px;background:#fff;border:6px solid ${INK};border-radius:22px;box-shadow:6px 6px 0 ${INK};
    padding:18px 10px;text-align:center;animation:pop .45s cubic-bezier(.2,1.6,.4,1) ${atraso}s both">
    <div style="font-size:54px;line-height:1">${emoji}</div>
    <div style="${OSW};font-size:30px;margin-top:6px;letter-spacing:.06em">${pos}</div>
    <div style="${OSW};font-size:40px;color:${GREEN};margin-top:8px;line-height:1">${de} <span style="color:rgba(12,12,12,.35)">→</span> ${para}</div>
  </div>`

// 🃏 um cartão de aviso (o mesmo formato das "regras" dos outros reels)
const aviso = (emoji, titulo, txt, cor, atraso) => `
  <div style="width:900px;background:#fff;border:6px solid ${INK};border-radius:24px;box-shadow:7px 7px 0 ${INK};padding:24px 30px;text-align:left;
    animation:entra .5s cubic-bezier(.2,1.5,.4,1) ${atraso}s both">
    <p style="${OSW};font-size:40px;text-transform:uppercase;color:${cor}">${emoji} ${titulo}</p>
    <p style="font-size:34px;font-weight:800;color:rgba(12,12,12,.7);margin-top:6px;line-height:1.3">${txt}</p>
  </div>`

const video = `<!doctype html><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box;margin:0;padding:0}
body{width:1080px;height:1920px;background:${CREME};font-family:system-ui;overflow:hidden;position:relative}
.cena{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:56px 44px;opacity:0}
@keyframes apar{to{opacity:1}}
@keyframes some{to{opacity:0}}
@keyframes pop{0%{transform:scale(.3);opacity:0}70%{transform:scale(1.12)}100%{transform:scale(1);opacity:1}}
@keyframes entra{0%{transform:translateX(-70px);opacity:0}100%{transform:translateX(0);opacity:1}}
@keyframes sobe{0%{transform:translateY(90px);opacity:0}100%{transform:translateY(0);opacity:1}}
@keyframes pulsa{0%,100%{transform:scale(1)}50%{transform:scale(1.07)}}
@keyframes treme{0%,100%{transform:rotate(0)}25%{transform:rotate(-5deg)}75%{transform:rotate(5deg)}}
</style><body>

<!-- ① abertura: o banco cresceu -->
${cena(0, 3.6, `
  <p style="font-size:160px;line-height:1;margin-bottom:24px;animation:pop .6s cubic-bezier(.2,1.6,.4,1) .15s both">🔁</p>
  <p style="${OSW};font-size:130px;text-transform:uppercase;text-align:center;line-height:.98;animation:sobe .5s .4s both">
    o seu banco<br><span style="color:${GREEN}">cresceu</span></p>
  <div style="display:flex;align-items:center;gap:34px;margin-top:44px;animation:pop .55s cubic-bezier(.2,1.6,.4,1) 1.1s both">
    <span style="${OSW};font-size:120px;color:rgba(12,12,12,.32);text-decoration:line-through">11</span>
    <span style="${OSW};font-size:80px;color:rgba(12,12,12,.4)">→</span>
    <span style="${OSW};font-size:150px;color:${GREEN}">16</span>
  </div>
  <p style="font-size:44px;font-weight:700;color:rgba(12,12,12,.62);margin-top:34px;text-align:center;line-height:1.35;
    animation:sobe .5s 1.7s both">reservas no elenco</p>
  <div style="margin-top:38px;animation:pop .5s cubic-bezier(.2,1.6,.4,1) 2.1s both">${pill('modo carreira', '#fff', INK, 36)}</div>`)}

<!-- ② +1 em cada posição -->
${cena(3.6, 8.4, `
  <p style="${OSW};font-size:96px;text-transform:uppercase;text-align:center;line-height:1;margin-bottom:14px;
    animation:sobe .45s 3.75s both">mais <span style="color:${GREEN}">um</span><br>em cada posição</p>
  <p style="font-size:38px;font-weight:700;color:rgba(12,12,12,.62);text-align:center;line-height:1.3;margin-bottom:44px;
    animation:sobe .45s 4.1s both">um goleiro, um lateral, um zagueiro,<br>um meia e um atacante</p>
  <div style="display:flex;gap:16px;justify-content:center;flex-wrap:wrap;max-width:980px">
    ${vaga('🧤', 'GOL', 2, 3, 4.5)}
    ${vaga('🏃', 'LAT', 4, 5, 4.7)}
    ${vaga('🛡️', 'ZAG', 4, 5, 4.9)}
    ${vaga('🎩', 'MEI', 8, 9, 5.1)}
    ${vaga('⚽', 'ATA', 4, 5, 5.3)}
  </div>
  <p style="font-size:42px;font-weight:800;color:rgba(12,12,12,.7);margin-top:46px;text-align:center;line-height:1.3;
    animation:sobe .45s 6.0s both">são <b style="color:${GREEN}">5 vagas a mais</b> pro seu elenco</p>`)}

<!-- ③ a conta -->
${cena(8.4, 12.6, `
  <div style="animation:sobe .45s 8.55s both">${pill('a conta', '#fff', INK, 34)}</div>
  <div style="display:flex;align-items:center;gap:26px;margin:36px 0 10px;animation:pop .5s cubic-bezier(.2,1.6,.4,1) 8.85s both">
    <div style="text-align:center"><div style="${OSW};font-size:96px;line-height:1">11</div>
      <div style="font-size:28px;font-weight:800;color:rgba(12,12,12,.5)">titulares</div></div>
    <span style="${OSW};font-size:70px;color:rgba(12,12,12,.35)">+</span>
    <div style="text-align:center"><div style="${OSW};font-size:96px;line-height:1;color:${GREEN}">16</div>
      <div style="font-size:28px;font-weight:800;color:rgba(12,12,12,.5)">reservas</div></div>
    <span style="${OSW};font-size:70px;color:rgba(12,12,12,.35)">=</span>
    <div style="text-align:center"><div style="${OSW};font-size:130px;line-height:1;color:${GOLD};-webkit-text-stroke:5px ${INK}">27</div>
      <div style="font-size:28px;font-weight:800;color:rgba(12,12,12,.5)">no elenco</div></div>
  </div>
  <div style="margin-top:44px;width:900px;background:${SLATE};border:6px solid ${INK};border-radius:26px;box-shadow:8px 8px 0 ${INK};padding:26px 30px;text-align:left;
    animation:entra .5s cubic-bezier(.2,1.5,.4,1) 9.9s both">
    <p style="${OSW};font-size:38px;text-transform:uppercase;color:#fff">🏢 e a SAF entra por cima</p>
    <p style="font-size:34px;font-weight:800;color:rgba(255,255,255,.8);margin-top:8px;line-height:1.3">
      o emprestado da SAF <b>não gasta vaga</b> do elenco. Na Série A dá pra trazer <b>4</b> — o time chega a <b>31</b>.</p>
  </div>`)}

<!-- ④ o cuidado: salário e renovação -->
${cena(12.6, 19.0, `
  <p style="font-size:130px;line-height:1;animation:treme .5s ease-in-out 12.75s 3">⚠️</p>
  <p style="${OSW};font-size:84px;text-transform:uppercase;text-align:center;line-height:1;margin:16px 0 12px;
    animation:sobe .45s 12.95s both">mais gente,<br><span style="color:${RED}">mais conta</span></p>
  <p style="font-size:36px;font-weight:700;color:rgba(12,12,12,.62);text-align:center;line-height:1.3;margin-bottom:34px;
    animation:sobe .45s 13.3s both">encher o banco é ótimo — só não esquece<br>que cada jogador tem um custo</p>
  <div style="display:flex;flex-direction:column;gap:20px">
    ${aviso('💸', 'salário, todo ano', 'cada jogador pesa <b>o preço que você pagou ÷ 10</b> na folha do time, cobrada no fim da temporada. Banco cheio de craque caro é folha cara.', RED, 13.7)}
    ${aviso('📝', 'e a renovação chega', 'quando o contrato vence você renova: <b>5 temporadas por metade</b> do valor, ou <b>10 por 90%</b>. Com 27 no elenco, vence contrato mais vezes.', AMBAR, 14.4)}
    ${aviso('🏢', 'o emprestado é de graça', 'quem veio da SAF <b>não entra na folha</b> — ele não é seu. Volta no fim da temporada.', GREEN, 15.1)}
  </div>
  <p style="font-size:40px;font-weight:800;color:rgba(12,12,12,.7);margin-top:40px;text-align:center;line-height:1.3;
    animation:sobe .45s 16.2s both">caixa no vermelho <b style="color:${RED}">trava contratar</b><br>e investir até você sair do sufoco</p>`)}

<!-- ⑤ a régua: ninguém é obrigado -->
${cena(19.0, 22.6, `
  <p style="font-size:140px;line-height:1;animation:pop .55s cubic-bezier(.2,1.6,.4,1) 19.15s both">🤝</p>
  <p style="${OSW};font-size:88px;text-transform:uppercase;text-align:center;line-height:1;margin:18px 0 14px;
    animation:sobe .45s 19.45s both">vaga a mais<br><span style="color:${GREEN}">não é obrigação</span></p>
  <p style="font-size:40px;font-weight:700;color:rgba(12,12,12,.65);text-align:center;line-height:1.35;
    animation:sobe .45s 19.85s both">você compra <b>se quiser</b>, no leilão,<br>igual já era com o banco.<br>Não comprou? A vaga fica vazia e <b>tudo certo</b>.</p>
  <div style="margin-top:40px;animation:pop .5s cubic-bezier(.2,1.6,.4,1) 20.6s both">
    ${pill('e o leilão não mudou', '#fff', INK, 34)}</div>`)}

<!-- ⑥ marca -->
${cena(22.6, 40, `
  <p style="font-size:150px;line-height:1;animation:pop .55s cubic-bezier(.2,1.6,.4,1) 22.75s both">🔁</p>
  <p style="${OSW};font-size:96px;text-transform:uppercase;text-align:center;line-height:1;margin:20px 0 34px;
    animation:sobe .45s 23.05s both">banco de <span style="color:${GREEN}">16</span><br>no modo carreira</p>
  <!-- 🚀 no ar pra todo mundo desde 18/09 (ver o topo do arquivo) -->
  <div style="animation:pop .5s cubic-bezier(.2,1.6,.4,1) 23.5s both">${pill('já está no ar', GREEN, '#fff', 40)}</div>
  <p style="${OSW};font-size:64px;margin-top:60px;text-transform:uppercase;animation:pulsa 1.4s ease-in-out 24.0s infinite">
    ⚽ Leilão <span style="color:${RED}">Legends</span></p>
  <p style="font-size:32px;font-weight:700;color:rgba(12,12,12,.55);margin-top:12px">leilaolegends.com</p>`)}
</body>`

// ── grava e converte ───────────────────────────────────────────────────────
const REC = '/tmp/rec-reservas-reels'
rmSync(REC, { recursive: true, force: true }); mkdirSync(REC, { recursive: true })
const vtmp = '/tmp/video-reservas-reels.html'
writeFileSync(vtmp, video)

const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const ctx = await b.newContext({ viewport: { width: 1080, height: 1920 }, recordVideo: { dir: REC, size: { width: 1080, height: 1920 } } })
const vp = await ctx.newPage()
await vp.goto('file://' + vtmp)
await vp.evaluate(() => document.fonts.ready)
await vp.waitForTimeout(26400)
await ctx.close()
await b.close()

const webm = readdirSync(REC).find(f => f.endsWith('.webm'))
if (!webm) throw new Error('o Playwright não gravou o webm')

let FF = process.env.FFMPEG || 'ffmpeg'
try { FF = createRequire(import.meta.url)('ffmpeg-static') } catch { /* usa FFMPEG/PATH */ }
execFileSync(FF, ['-y', '-i', `${REC}/${webm}`,
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-pix_fmt', 'yuv420p',
  '-r', '30', '-movflags', '+faststart', SAIDA], { stdio: 'ignore' })
console.log(SAIDA)
