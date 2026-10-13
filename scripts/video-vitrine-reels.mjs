// ─── 🎬 REELS 1080×1920: 🏆📊🖋️ A VITRINE DA LISTA DE SALAS ─────────────────
// Pedido do Diego (13/10): *"me mande vídeo dessas coisas que fizemos no online que fica embaixo
// das salas… vídeo padrão que sempre fazemos"*. Mesmo molde dos outros reels (cenas em HTML +
// Playwright gravando + ffmpeg). Nomes e números são os do banco no dia (esc_vitrine_salas).
//
// 🎞️ Roteiro (~24 s):
//   0,0– 4,0  📲 novo nas salas online · embaixo do "Atualizar lista"
//   4,0–10,2  🏆 Campeões de hoje — quem acabou de ganhar entra EM CIMA
//  10,2–16,4  📊 Ranking da semana — top 5 + você · seg 0h → dom 23h59 · zera toda segunda
//  16,4–20,6  🖋️ Último batismo — o clube mais novo do jogo
//  20,6–24,4  quem fecha a semana em 1º? + marca
//
//   node scripts/video-vitrine-reels.mjs [--saida vitrine-reels.mp4]
import { readFileSync, writeFileSync, readdirSync, rmSync, mkdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { chromium } from 'playwright-core'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'vitrine-reels.mp4')
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')
const img = f => `data:image/webp;base64,${readFileSync(f).toString('base64')}`

const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6', GREEN = '#1B7A3D', RED = '#E8503A', ROXO = '#7C3AED'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'
const cena = (ini, fim, html) => `<div class="cena" style="animation:apar .01s linear ${ini}s both, some .01s linear ${fim}s both">${html}</div>`
const pill = (txt, bg, cor, fs = 34) => `<span style="display:inline-block;background:${bg};color:${cor};border:4px solid ${INK};border-radius:999px;
  box-shadow:5px 5px 0 ${INK};padding:10px 30px;${OSW};font-size:${fs}px;letter-spacing:.05em;text-transform:uppercase">${txt}</span>`
const caixa = (titulo, sub, corpo, atraso, escura = false) => `<div style="width:960px;background:${escura ? 'linear-gradient(150deg,#1f1a14,#0c0c0c)' : CREME};color:${escura ? '#fff' : INK};
  border:5px solid ${INK};border-radius:30px;box-shadow:8px 8px 0 ${INK};padding:30px 32px 24px;text-align:left;animation:sobe .5s cubic-bezier(.2,1.4,.4,1) ${atraso}s both">
  <p style="margin:0;${OSW};font-size:52px;text-transform:uppercase;color:${escura ? GOLD : INK}">${titulo}</p>
  <p style="margin:4px 0 18px;font-size:27px;font-weight:700;color:${escura ? '#bbb' : '#5a5240'}">${sub}</p>${corpo}</div>`

// 🏆 os campeões entram UM POR VEZ, e cada novo empurra os outros pra baixo (é "quem vai ganhando")
const CAMP = [['Jota67resenha', '🏆 Copa'], ['All tac adão FC', '🏆 Liga'], ['SOCA FOFO FC', '🏆 Liga'], ['Vemd4', '🏆 Liga'], ['Nathan kids proclub', '🏆 Liga']]
const linhaCamp = ([n, t], quando, atraso) => `<div style="display:flex;align-items:center;gap:18px;padding:14px 4px;border-top:3px solid #0001;animation:entra .45s cubic-bezier(.2,1.5,.4,1) ${atraso}s both">
  <span style="font-size:44px">🏆</span><b style="flex:1;${OSW};font-size:40px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${n}</b>
  <span style="${OSW};font-size:28px;background:${GOLD};border:3px solid ${INK};border-radius:999px;padding:3px 18px">${t}</span>
  <span style="font-size:24px;font-weight:700;color:#7a705a;width:150px;text-align:right">${quando}</span></div>`
// cada campeão novo aparece no TOPO: renderizo a lista em ordem de chegada invertida, com atraso crescente de baixo pra cima
const campeoes = `<div style="display:flex;flex-direction:column-reverse">${CAMP.map((c, i) => linhaCamp(c, i === CAMP.length - 1 ? 'agora há pouco' : `há ${(CAMP.length - 1 - i) * 2} min`, 5.0 + i * 0.85)).join('')}</div>`

const SEM = [['Broxada Sinistra', 10, '🥇'], ['BarSemLonã', 9, '🥈'], ['GAMA FC', 9, '🥈'], ['Diesel Fc', 6, '4º'], ['Light FC', 6, '4º']]
const semana = SEM.map(([n, t, m], i) => `<div style="display:flex;align-items:center;gap:18px;padding:12px 14px;border-radius:18px;${i === 0 ? `background:linear-gradient(90deg,#FFE79A,${GOLD});border:4px solid ${INK};` : 'border-top:3px solid #0001;'}animation:entra .45s cubic-bezier(.2,1.5,.4,1) ${(11.2 + i * 0.35).toFixed(2)}s both">
  <span style="${OSW};font-size:40px;width:64px;text-align:center">${m}</span><b style="flex:1;${OSW};font-size:40px">${n}</b>
  <span style="${OSW};font-size:42px">${t} <span style="font-size:24px;font-weight:600">títulos</span></span></div>`).join('')
  + `<div style="display:flex;align-items:center;gap:18px;padding:14px;margin-top:14px;border:4px dashed ${INK};border-radius:18px;background:#fff;animation:pop .5s cubic-bezier(.2,1.6,.4,1) 13.2s both">
  <span style="${OSW};font-size:34px;width:64px;text-align:center">87º</span><b style="flex:1;${OSW};font-size:36px">Você · seu clube</b><span style="${OSW};font-size:36px">1 título</span></div>`

const batismo = `<div style="display:flex;align-items:center;gap:26px">
  <img src="${img('src/escalacao/img/rossini-escudo.webp')}" style="height:190px;animation:pop .55s cubic-bezier(.2,1.6,.4,1) 17.2s both">
  <div style="flex:1"><p style="margin:0;${OSW};font-size:60px;text-transform:uppercase;line-height:1">Rossini Money</p>
    <p style="margin:8px 0 0;font-size:30px;font-weight:700;color:#ddd">o clube mais novo do jogo</p></div>
  <img src="${img('src/escalacao/img/rossini-mascote.webp')}" style="height:250px;margin:-30px -10px -20px 0;animation:pop .55s cubic-bezier(.2,1.6,.4,1) 17.6s both"></div>
  <div style="margin-top:26px;${OSW};font-size:38px;text-align:center;background:${GOLD};color:${INK};border:4px solid ${INK};border-radius:22px;box-shadow:6px 6px 0 ${INK};padding:20px;animation:pop .5s cubic-bezier(.2,1.6,.4,1) 18.4s both">🖋️ QUERO BATIZAR O MEU CLUBE →</div>`

const video = `<!doctype html><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box;margin:0;padding:0}
body{width:1080px;height:1920px;background:#120f0c;font-family:system-ui;overflow:hidden;position:relative}
.cena{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:56px 44px;opacity:0;text-align:center}
@keyframes apar{to{opacity:1}} @keyframes some{to{opacity:0}}
@keyframes pop{0%{transform:scale(.3);opacity:0}70%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}}
@keyframes entra{0%{transform:translateY(-40px);opacity:0}100%{transform:translateY(0);opacity:1}}
@keyframes sobe{0%{transform:translateY(90px);opacity:0}100%{transform:translateY(0);opacity:1}}
@keyframes pulsa{0%,100%{transform:scale(1)}50%{transform:scale(1.07)}}
</style><body>

${cena(0, 4.0, `
  <p style="font-size:130px;line-height:1;animation:pop .6s cubic-bezier(.2,1.6,.4,1) .1s both">📲</p>
  <p style="${OSW};font-size:62px;text-transform:uppercase;color:#bbb;margin-top:18px;animation:sobe .45s .35s both">novo nas</p>
  <p style="${OSW};font-size:120px;text-transform:uppercase;line-height:1;color:${GOLD};animation:pop .55s cubic-bezier(.2,1.6,.4,1) .6s both">salas online</p>
  <div style="width:900px;margin-top:60px;background:#fff;border:5px solid ${INK};border-radius:26px;box-shadow:6px 6px 0 ${GOLD};padding:26px;${OSW};font-size:44px;animation:sobe .45s 1.2s both">🔄 ATUALIZAR LISTA</div>
  <p style="${OSW};font-size:40px;color:${GOLD};letter-spacing:.1em;margin-top:40px;animation:pulsa 1.2s ease-in-out 1.8s infinite">⬇️ OLHA O QUE TEM AQUI EMBAIXO</p>`)}

${cena(4.0, 10.2, `
  ${caixa('🏆 Campeões de hoje', 'Quem levantou taça nas salas online — só gente, nunca bot.', campeoes, 4.1)}
  <p style="${OSW};font-size:40px;color:#fff;margin-top:44px;line-height:1.25;animation:sobe .45s 9.0s both">quem acabou de ganhar<br><span style="color:${GOLD}">aparece em cima</span></p>`)}

${cena(10.2, 16.4, `
  ${caixa('📊 Ranking da semana', 'Os técnicos com mais títulos online nesta semana.', semana, 10.3)}
  <div style="margin-top:40px;animation:pop .5s cubic-bezier(.2,1.6,.4,1) 14.2s both">${pill('seg 0h → dom 23h59', '#fff', INK, 38)}</div>
  <p style="${OSW};font-size:42px;color:${GOLD};margin-top:28px;animation:sobe .45s 14.8s both">⏳ zera toda segunda</p>`)}

${cena(16.4, 20.6, caixa('🖋️ Último batismo', 'O clube mais novo do jogo — de um jogador de verdade.', batismo, 16.5, true))}

${cena(20.6, 40, `
  <p style="font-size:140px;line-height:1;animation:pop .55s cubic-bezier(.2,1.6,.4,1) 20.7s both">🏆</p>
  <p style="${OSW};font-size:84px;text-transform:uppercase;line-height:1.05;color:#fff;margin:20px 0 40px;animation:sobe .45s 21.0s both">quem vai fechar<br>a semana em <span style="color:${GOLD}">1º</span>?</p>
  <div style="animation:pop .5s cubic-bezier(.2,1.6,.4,1) 21.6s both">${pill('entra numa sala hoje', GREEN, '#fff', 40)}</div>
  <p style="${OSW};font-size:62px;margin-top:70px;text-transform:uppercase;color:#fff;animation:pulsa 1.4s ease-in-out 22.2s infinite">⚽ Leilão <span style="color:${RED}">Legends</span></p>
  <p style="font-size:32px;font-weight:700;color:#999;margin-top:12px">leilaolegends.com</p>`)}
</body>`

const REC = '/tmp/rec-vitrine-reels'
rmSync(REC, { recursive: true, force: true }); mkdirSync(REC, { recursive: true })
const vtmp = '/tmp/video-vitrine-reels.html'
writeFileSync(vtmp, video)
if (process.argv.includes('--so-html')) { console.log(vtmp); process.exit(0) }
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const ctx = await b.newContext({ viewport: { width: 1080, height: 1920 }, recordVideo: { dir: REC, size: { width: 1080, height: 1920 } } })
const vp = await ctx.newPage()
await vp.goto('file://' + vtmp)
await vp.evaluate(() => document.fonts.ready)
await vp.waitForTimeout(24800)
await ctx.close(); await b.close()
const webm = readdirSync(REC).find(f => f.endsWith('.webm'))
if (!webm) throw new Error('o Playwright não gravou o webm')
let FF = 'ffmpeg'
try { FF = createRequire(import.meta.url)('ffmpeg-static') } catch { /* usa o do PATH */ }
execFileSync(FF, ['-y', '-i', `${REC}/${webm}`, '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-pix_fmt', 'yuv420p', '-r', '30', '-movflags', '+faststart', SAIDA], { stdio: 'ignore' })
console.log(SAIDA)
