// ─── 🎬 REELS 1080×1920: PREPARADOR FÍSICO + 🏛️ DEPARTAMENTO TÉCNICO ──────────
// Pedido do Diego (14/09): *"quero agora um vídeo também. Aquele vídeo daquele
// estilo que a gente sempre faz"* — a mesma técnica dos outros reels do repo
// (`video-condicao-reels.mjs`): as cenas são keyframes de CSS, o Playwright GRAVA
// A TELA em tempo real (webm) e o ffmpeg converte pra mp4 do Instagram/WhatsApp.
//
// ⚠️ A FEATURE AINDA NÃO ESTÁ NO JOGO. Por isso o vídeo NÃO diz "já está no ar" —
// diz "chegando". Só trocar essa fita quando o deploy fechar na main.
//
// 🎞️ Roteiro (~25 s):
//   0,0–3,4    seu time agora tem PREPARADOR FÍSICO
//   3,4–7,4    🏛️ Departamento Técnico — técnico e preparador saem do meio dos jogadores
//   7,4–11,4   como é hoje: joga 2, senta 1 — sem preparador não tem o botão RODIZIAR
//   11,4–18,6  os QUATRO, cada um na cor do tier (Rui Faria · Pintus · Paixão · Seirulo)
//   18,6–22,0  salário igual ao do técnico · contrato de 5 temporadas · nada trava
//   22,0–25,5  marca
//
//   node scripts/video-preparador-reels.mjs [--saida preparador-reels.mp4]
//   (ffmpeg: usa `ffmpeg-static` se instalado, senão FFMPEG=/caminho/ffmpeg, senão o do PATH)
import { readFileSync, writeFileSync, readdirSync, rmSync, mkdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { chromium } from 'playwright-core'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'preparador-reels.mp4')
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6', GREEN = '#1B7A3D', RED = '#E8503A', AMBAR = '#D9A000'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'
// 🎨 os MESMOS degradês dos tiers em apoio.tsx — cor de tier é sagrada
const G_VERDE = 'linear-gradient(160deg,#41C07A,#2E9E5B 55%,#1E7A45)'
const G_ROXO = 'linear-gradient(160deg,#C9A9FF,#8B5CF6 52%,#5B2FB0)'
const G_PRATA = 'linear-gradient(160deg,#F4F7FB,#CBD4DE 52%,#9BA7B5)'
const G_OURO = 'linear-gradient(160deg,#FFE79A,#FFC400 40%,#E8A200 70%,#FFDD70)'

const pill = (txt, bg, cor, fs = 32) => `
  <span style="display:inline-block;background:${bg};color:${cor};border:4px solid ${INK};border-radius:999px;
    box-shadow:5px 5px 0 ${INK};padding:10px 32px;${OSW};font-size:${fs}px;letter-spacing:.06em;text-transform:uppercase">${txt}</span>`

const cena = (ini, fim, html) => `
  <div class="cena" style="animation:apar .01s linear ${ini}s both, some .01s linear ${fim}s both">${html}</div>`

// 🃏 a ficha de um preparador, na cor do tier dele
const card = (grad, selo, cat, nome, pais, frase, preco, atraso) => `
  <div style="width:900px;background:${grad};border:6px solid ${INK};border-radius:26px;box-shadow:8px 8px 0 ${INK};padding:7px;
    animation:entra .5s cubic-bezier(.2,1.5,.4,1) ${atraso}s both">
    <div style="background:rgba(255,255,255,.93);border-radius:19px;padding:20px 26px;display:flex;align-items:center;gap:22px">
      <div style="text-align:left;flex:1;min-width:0">
        <div style="${OSW};font-size:28px;letter-spacing:.12em;color:rgba(12,12,12,.5);text-transform:uppercase">${selo} ${cat}</div>
        <div style="${OSW};font-size:60px;line-height:1.02;white-space:nowrap">${nome} <span style="font-size:38px">${pais}</span></div>
        <div style="font-size:31px;font-weight:800;color:rgba(12,12,12,.72);margin-top:6px">${frase}</div>
      </div>
      <div style="flex:none;text-align:center;background:${INK};color:#fff;border-radius:18px;padding:16px 22px;min-width:190px">
        <div style="${OSW};font-size:50px;line-height:1">${preco}</div>
        <div style="font-size:24px;font-weight:800;opacity:.65;margin-top:2px">🪙 uma vez</div>
      </div>
    </div>
  </div>`

// uma rodada da fitinha "joga N, senta 1"
const passo = (tipo, atraso) => `
  <div style="width:96px;height:112px;border:5px solid ${INK};border-radius:14px;box-shadow:4px 4px 0 ${INK};
    display:flex;align-items:center;justify-content:center;font-size:50px;
    background:${tipo === 'banco' ? GREEN : '#fff'};
    animation:pop .4s cubic-bezier(.2,1.6,.4,1) ${atraso}s both">${tipo === 'banco' ? '🪑' : '⚽'}</div>`
const fita = (n, ini) => {
  const itens = []
  for (let i = 0; i < n; i++) itens.push(passo('jogo', ini + i * 0.12))
  itens.push(passo('banco', ini + n * 0.12))
  return `<div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;max-width:960px">${itens.join('')}</div>`
}

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

<!-- ① abertura -->
${cena(0, 3.4, `
  <p style="font-size:160px;line-height:1;margin-bottom:24px;animation:pop .6s cubic-bezier(.2,1.6,.4,1) .15s both">🏋️</p>
  <p style="${OSW};font-size:126px;text-transform:uppercase;text-align:center;line-height:.98;animation:sobe .5s .4s both">
    seu time agora<br>tem <span style="color:${GREEN}">preparador</span><br>físico</p>
  <p style="font-size:44px;font-weight:700;color:rgba(12,12,12,.62);margin-top:40px;text-align:center;line-height:1.35;
    animation:sobe .5s 1.2s both">quatro nomes de verdade — e cada um<br>deixa seu craque jogar mais seguido</p>
  <div style="margin-top:38px;animation:pop .5s cubic-bezier(.2,1.6,.4,1) 1.8s both">${pill('modo carreira', '#fff', INK, 36)}</div>`)}

<!-- ② o departamento técnico -->
${cena(3.4, 7.4, `
  <p style="font-size:140px;line-height:1;animation:pop .55s cubic-bezier(.2,1.6,.4,1) 3.55s both">🏛️</p>
  <p style="${OSW};font-size:92px;text-transform:uppercase;text-align:center;line-height:1;margin:16px 0 14px;
    animation:sobe .45s 3.8s both">departamento<br><span style="color:${GREEN}">técnico</span></p>
  <p style="font-size:40px;font-weight:700;color:rgba(12,12,12,.62);text-align:center;line-height:1.3;
    animation:sobe .45s 4.2s both">o técnico e o preparador saem do meio<br>dos jogadores e ganham a área deles</p>
  <div style="margin-top:44px;width:900px;background:#fff;border:6px solid ${INK};border-radius:26px;box-shadow:8px 8px 0 ${INK};overflow:hidden;
    animation:entra .5s cubic-bezier(.2,1.5,.4,1) 4.7s both">
    <div style="background:linear-gradient(150deg,#2A241A,#17130A);padding:18px 26px;text-align:left">
      <div style="${OSW};font-size:34px;color:#fff;text-transform:uppercase">🏛️ Departamento Técnico</div>
      <div style="font-size:24px;font-weight:700;color:rgba(255,255,255,.55)">comissão — não entram em campo</div>
    </div>
    <div style="display:flex;align-items:center;gap:20px;padding:22px 26px;text-align:left;border-bottom:4px dashed #d9d0b4">
      <div style="flex:none;width:92px;height:92px;border:5px solid ${INK};border-radius:20px;background:${G_PRATA};box-shadow:4px 4px 0 ${INK};display:flex;align-items:center;justify-content:center;font-size:44px">🧢</div>
      <div><div style="${OSW};font-size:26px;color:rgba(12,12,12,.5);text-transform:uppercase">técnico</div>
        <div style="${OSW};font-size:50px;line-height:1.05">Telê Santana</div></div>
    </div>
    <div style="display:flex;align-items:center;gap:20px;padding:22px 26px;text-align:left">
      <div style="flex:none;width:92px;height:92px;border:5px solid ${INK};border-radius:20px;background:${G_VERDE};box-shadow:4px 4px 0 ${INK};display:flex;align-items:center;justify-content:center;font-size:44px">🏋️</div>
      <div><div style="${OSW};font-size:26px;color:rgba(12,12,12,.5);text-transform:uppercase">preparador físico</div>
        <div style="${OSW};font-size:50px;line-height:1.05">Rui Faria</div></div>
    </div>
  </div>`)}

<!-- ③ como é hoje -->
${cena(7.4, 11.4, `
  <div style="animation:sobe .45s 7.55s both">${pill('como é hoje', '#fff', INK, 34)}</div>
  <p style="${OSW};font-size:88px;text-transform:uppercase;text-align:center;line-height:1;margin:26px 0 12px;
    animation:sobe .45s 7.8s both">joga <span style="color:${RED}">2</span>,<br>senta <span style="color:${GREEN}">1</span></p>
  <p style="font-size:38px;font-weight:700;color:rgba(12,12,12,.62);text-align:center;line-height:1.3;margin-bottom:40px;
    animation:sobe .45s 8.2s both">esse é o ritmo em que o tanque nunca desce.<br>mais que isso, o craque começa a cansar</p>
  <div style="animation:apar .3s 8.5s both">${fita(2, 8.6)}</div>
  <div style="margin-top:46px;width:900px;background:#FFF6D6;border:6px solid ${INK};border-radius:26px;box-shadow:8px 8px 0 ${INK};padding:26px 30px;text-align:left;
    animation:entra .5s cubic-bezier(.2,1.5,.4,1) 9.4s both">
    <p style="${OSW};font-size:34px;text-transform:uppercase;color:rgba(12,12,12,.55)">🔒 sem preparador</p>
    <p style="font-size:36px;font-weight:800;margin-top:10px;line-height:1.3">o rodízio é <b>na mão</b>: você toca no cansado e no reserva. O botão <b>🔁 RODIZIAR</b> e o automático são de quem contrata.</p>
  </div>`)}

<!-- ④ os quatro -->
${cena(11.4, 18.6, `
  <p style="${OSW};font-size:80px;text-transform:uppercase;text-align:center;line-height:1;margin-bottom:12px;
    animation:sobe .45s 11.55s both">escolha o <span style="color:${GREEN}">seu</span></p>
  <p style="font-size:34px;font-weight:700;color:rgba(12,12,12,.6);text-align:center;margin-bottom:34px;
    animation:sobe .45s 11.8s both">quanto melhor o preparador, mais o banco devolve</p>
  <div style="display:flex;flex-direction:column;gap:20px">
    ${card(G_VERDE, '🟢', 'bom', 'Rui Faria', '🇵🇹', 'joga <b>4</b> seguidas e senta 1', 100, 12.1)}
    ${card(G_ROXO, '💎', 'promessa', 'Antonio Pintus', '🇮🇹', 'joga <b>6</b> seguidas e senta 1', 300, 13.3)}
    ${card(G_PRATA, '⭐', 'craque', 'Paulo Paixão', '🇧🇷', 'joga <b>8</b> seguidas e senta 1', 600, 14.5)}
    ${card(G_OURO, '👑', 'lenda', 'Paco Seirulo', '🇪🇸', 'joga <b>14</b> seguidas e senta 1', 1000, 15.7)}
  </div>
  <p style="font-size:38px;font-weight:800;color:rgba(12,12,12,.68);margin-top:40px;text-align:center;line-height:1.3;
    animation:sobe .45s 16.9s both">com o 👑 o tanque vazio enche em <b>5 rodadas</b><br>no banco — hoje leva <b>25</b></p>`)}

<!-- ⑤ as regras -->
${cena(18.6, 22.0, `
  <p style="font-size:130px;line-height:1;animation:treme .5s ease-in-out 18.75s 3">📝</p>
  <p style="${OSW};font-size:76px;text-transform:uppercase;text-align:center;line-height:1;margin:16px 0 34px;
    animation:sobe .45s 18.95s both">igualzinho ao técnico</p>
  <div style="display:flex;flex-direction:column;gap:20px">
    <div style="width:900px;background:#fff;border:6px solid ${INK};border-radius:24px;box-shadow:7px 7px 0 ${INK};padding:24px 30px;text-align:left;
      animation:entra .5s cubic-bezier(.2,1.5,.4,1) 19.3s both">
      <p style="${OSW};font-size:40px;text-transform:uppercase">💸 salário de 10%</p>
      <p style="font-size:34px;font-weight:800;color:rgba(12,12,12,.7);margin-top:6px">custou 300? paga 30 por temporada, na folha do time</p>
    </div>
    <div style="width:900px;background:#fff;border:6px solid ${INK};border-radius:24px;box-shadow:7px 7px 0 ${INK};padding:24px 30px;text-align:left;
      animation:entra .5s cubic-bezier(.2,1.5,.4,1) 19.8s both">
      <p style="${OSW};font-size:40px;text-transform:uppercase">📝 contrato de 5 temporadas</p>
      <p style="font-size:34px;font-weight:800;color:rgba(12,12,12,.7);margin-top:6px">venceu, você renova pelo mesmo preço — ou deixa ir, sem multa</p>
    </div>
    <div style="width:900px;background:#fff;border:6px solid ${INK};border-radius:24px;box-shadow:7px 7px 0 ${INK};padding:24px 30px;text-align:left;
      animation:entra .5s cubic-bezier(.2,1.5,.4,1) 20.3s both">
      <p style="${OSW};font-size:40px;text-transform:uppercase;color:${GREEN}">🛡️ nada trava</p>
      <p style="font-size:34px;font-weight:800;color:rgba(12,12,12,.7);margin-top:6px">sem preparador o time joga igual — você só troca na mão</p>
    </div>
  </div>`)}

<!-- ⑥ marca -->
${cena(22.0, 40, `
  <p style="font-size:150px;line-height:1;animation:pop .55s cubic-bezier(.2,1.6,.4,1) 22.15s both">🏋️</p>
  <p style="${OSW};font-size:96px;text-transform:uppercase;text-align:center;line-height:1;margin:20px 0 34px;
    animation:sobe .45s 22.45s both">chega no<br><span style="color:${GREEN}">modo carreira</span></p>
  <div style="animation:pop .5s cubic-bezier(.2,1.6,.4,1) 22.9s both">${pill('chegando', GOLD, INK, 40)}</div>
  <p style="${OSW};font-size:64px;margin-top:60px;text-transform:uppercase;animation:pulsa 1.4s ease-in-out 23.4s infinite">
    ⚽ Leilão <span style="color:${RED}">Legends</span></p>
  <p style="font-size:32px;font-weight:700;color:rgba(12,12,12,.55);margin-top:12px">leilaolegends.com</p>`)}
</body>`

// ── grava e converte ───────────────────────────────────────────────────────
const REC = '/tmp/rec-preparador-reels'
rmSync(REC, { recursive: true, force: true }); mkdirSync(REC, { recursive: true })
const vtmp = '/tmp/video-preparador-reels.html'
writeFileSync(vtmp, video)

const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const ctx = await b.newContext({ viewport: { width: 1080, height: 1920 }, recordVideo: { dir: REC, size: { width: 1080, height: 1920 } } })
const vp = await ctx.newPage()
await vp.goto('file://' + vtmp)
await vp.evaluate(() => document.fonts.ready)
await vp.waitForTimeout(25900)
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
