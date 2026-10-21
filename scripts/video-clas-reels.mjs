// ─── 🎬 REELS 1080×1920: ⚔️ CLÃS (21/10) ─────────────────────────────────────────────────────────────────────────
// Pedido do Diego (21/10): *"me mande vídeo pro reels padrão. Aviso p comunidade no zap tb"*. Mesmo molde do
// `video-coletiva-reels.mjs` (cenas em HTML + Playwright gravando + ffmpeg). Nomes de clã e de técnico INVENTADOS.
//
// 🎞️ Roteiro (~37 s):
//   0,0– 4,6   ⚔️ chegaram os clãs
//   4,6–10,4   junte até 22 técnicos · todo título online soma pro clã
//  10,4–16,2   ranking dos clãs da semana (embaixo do ranking das salas)
//  16,2–21,8   prêmio: 30 · 20 · 10 moedas por membro + clã no telão + 🏆 no selo
//  21,8–26,8   o selo do clã embaixo do nome na sala
//  26,8–31,6   entrar é grátis · criar = qualquer plano · escudo do batismo vira emblema
//  31,6–37,2   CTA: Amigos → ⚔️ Clã
//
//   node scripts/video-clas-reels.mjs [--saida scripts/posts/clas-reels.mp4]
import { readFileSync, writeFileSync, readdirSync, rmSync, mkdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { chromium } from 'playwright-core'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'scripts/posts/clas-reels.mp4')
const ESTADIO = `data:image/webp;base64,${readFileSync('src/escalacao/img/online-estadio-v25.webp').toString('base64')}`
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6', GREEN = '#1B7A3D', RED = '#E8503A', ROXO = '#7C3AED', ZAP = '#25D366'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'

const pill = (txt, bg, cor, fs = 32) => `
  <span style="display:inline-block;background:${bg};color:${cor};border:4px solid ${INK};border-radius:999px;
    box-shadow:5px 5px 0 ${INK};padding:10px 32px;${OSW};font-size:${fs}px;letter-spacing:.06em;text-transform:uppercase">${txt}</span>`
const cena = (ini, fim, html) => `
  <div class="cena" style="animation:apar .01s linear ${ini}s both, some .01s linear ${fim}s both">${html}</div>`
const entra = (atraso, extra = '') => `animation:entra .45s cubic-bezier(.2,1.5,.4,1) ${atraso}s both;${extra}`
const sobe = atraso => `animation:sobe .45s ${atraso}s both`
const pop = atraso => `animation:pop .5s cubic-bezier(.2,1.6,.4,1) ${atraso}s both`
const caixa = (html, atraso, extra = '') => `<div style="width:940px;background:#fff;border:6px solid ${INK};border-radius:30px;box-shadow:10px 10px 0 ${INK};overflow:hidden;text-align:left;${pop(atraso)};${extra}">${html}</div>`
const emb = (ic, cor, t = 70) => `<span style="flex:none;width:${t * .86}px;height:${t}px;display:inline-flex;align-items:center;justify-content:center;background:${cor};border:4px solid ${INK};border-radius:${t * .2}px ${t * .2}px ${t * .45}px ${t * .45}px;font-size:${t * .5}px">${ic}</span>`
const selo = (ic, cor, nome, fs = 26) => `<span style="display:inline-flex;align-items:center;gap:8px;background:#181818;color:#E9C46A;border:3px solid ${INK};border-radius:999px;padding:4px 18px 4px 6px;${OSW};font-size:${fs}px;letter-spacing:.04em;text-transform:uppercase">${emb(ic, cor, fs * 1.3)}⚔️ ${nome}</span>`
const linha = (pos, ic, cor, nome, tit, atraso, ouro = false) => `<div style="display:flex;align-items:center;gap:20px;padding:16px 26px;${ouro ? `background:linear-gradient(90deg,#FFE79A,${GOLD});border-bottom:4px solid ${INK};` : 'border-top:3px dashed #0002;'}${entra(atraso)}">
  <span style="${OSW};font-size:46px;width:60px;text-align:center">${pos}</span>${emb(ic, cor, 62)}
  <b style="${OSW};flex:1;font-size:42px">${nome}</b><span style="${OSW};font-size:44px">${tit} <small style="font-size:24px">títulos</small></span></div>`
const membro = (nome, tit, atraso, lider = false) => `<div style="display:flex;align-items:center;gap:16px;padding:12px 26px;border-top:3px dashed #0002;${entra(atraso)}"><b style="flex:1;font-size:34px;font-weight:800">${nome}${lider ? ' 👑' : ''}</b><span style="${OSW};font-size:36px">+${tit} 🏆</span></div>`

const video = `<!doctype html><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box;margin:0;padding:0}
body{width:1080px;height:1920px;background:${CREME};font-family:system-ui;overflow:hidden;position:relative;color:${INK}}
.cena{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:56px 44px;opacity:0;text-align:center}
@keyframes apar{to{opacity:1}}
@keyframes some{to{opacity:0}}
@keyframes pop{0%{transform:scale(.3);opacity:0}70%{transform:scale(1.12)}100%{transform:scale(1);opacity:1}}
@keyframes entra{0%{transform:translateX(-70px);opacity:0}100%{transform:translateX(0);opacity:1}}
@keyframes sobe{0%{transform:translateY(90px);opacity:0}100%{transform:translateY(0);opacity:1}}
@keyframes pulsa{0%,100%{transform:scale(1)}50%{transform:scale(1.07)}}
@keyframes espada{0%,100%{transform:rotate(-8deg) scale(1)}50%{transform:rotate(8deg) scale(1.08)}}
@keyframes moeda{0%{transform:translateY(-300px) rotate(0);opacity:0}60%{opacity:1}100%{transform:translateY(0) rotate(360deg);opacity:1}}
@keyframes rola{from{transform:translateX(100%)}to{transform:translateX(-100%)}}
</style><body>

<!-- ① chegaram -->
${cena(0, 4.6, `
  <div style="width:240px;height:240px;border-radius:50%;background:${INK};border:7px solid ${INK};box-shadow:10px 10px 0 ${GOLD};display:flex;align-items:center;justify-content:center;font-size:140px;animation:pop .5s cubic-bezier(.2,1.6,.4,1) .1s both, espada 1.1s ease-in-out .7s infinite">⚔️</div>
  <p style="${OSW};font-size:60px;text-transform:uppercase;color:rgba(12,12,12,.5);margin:50px 0 34px;${sobe(.45)}">chegaram os</p>
  <p style="${OSW};font-size:210px;text-transform:uppercase;line-height:.92;color:${ROXO};${pop(.7)}">clãs</p>
  <p style="${OSW};font-size:60px;text-transform:uppercase;line-height:1.1;margin-top:14px;${sobe(1.1)}">Leilão <span style="color:${RED}">Legends</span></p>
  <div style="margin-top:46px;${pop(1.6)}">${pill('⚔️ junte a sua galera', GOLD, INK, 40)}</div>`)}

<!-- ② junte até 22 -->
${cena(4.6, 10.4, `
  <p style="${OSW};font-size:66px;text-transform:uppercase;line-height:1.05;margin-bottom:28px;${sobe(4.7)}">até <span style="color:${ROXO}">22 técnicos</span> no mesmo clã</p>
  ${caixa(`<div style="display:flex;gap:22px;align-items:center;padding:26px;background:linear-gradient(150deg,#262626,#0c0c0c);color:#fff">${emb('⚡', '#2563EB', 100)}
      <div><div style="${OSW};font-size:58px;color:#E9C46A;line-height:1">MARTELO DE OURO</div><div style="font-size:26px;font-weight:700;margin-top:6px">👑 presidente: Tigrão FC · 14/22 · 🔓 aberto</div></div></div>
    ${membro('Tigrão FC', 3, 5.4, true)}${membro('Várzea Moral', 2, 5.7)}${membro('Pé de Pano EC', 2, 6.0)}${membro('Canela Fina', 1, 6.3)}`, 5.0)}
  <p style="${OSW};font-size:52px;line-height:1.1;margin-top:38px;${pop(7.2)}">todo <span style="color:${GREEN}">título online</span> de cada um<br>soma pro clã 🏆</p>`)}

<!-- ③ ranking -->
${cena(10.4, 16.2, `
  <p style="${OSW};font-size:66px;text-transform:uppercase;line-height:1.05;margin-bottom:28px;${sobe(10.5)}">⚔️ ranking dos <span style="color:${RED}">clãs da semana</span></p>
  ${caixa(`${linha('🥇', '⚡', '#2563EB', 'Martelo de Ouro', 41, 10.9, true)}${linha('🥈', '🦅', '#C2452F', 'Os Brabos', 28, 11.2)}${linha('🥉', '🌳', GREEN, 'Várzea Unida', 17, 11.5)}${linha('4º', '🔥', '#EA580C', 'Tocaia Club', 9, 11.8)}`, 10.7)}
  <p style="font-size:32px;font-weight:800;color:rgba(12,12,12,.6);margin-top:34px;${sobe(12.6)}">nas salas online, embaixo do Ranking da Semana · zera toda segunda</p>`)}

<!-- ④ prêmio -->
${cena(16.2, 21.8, `
  <div style="display:flex;gap:30px;font-size:120px">${['🪙', '🪙', '🪙'].map((m, i) => `<span style="animation:moeda .8s cubic-bezier(.2,1.2,.4,1) ${16.3 + i * .15}s both">${m}</span>`).join('')}</div>
  <p style="${OSW};font-size:66px;text-transform:uppercase;line-height:1.05;margin:24px 0 30px;${sobe(16.6)}">prêmio pra <span style="color:${GREEN}">cada membro</span></p>
  <div style="display:flex;gap:22px">${[['🥇', '30'], ['🥈', '20'], ['🥉', '10']].map(([m, v], i) => `<div style="width:270px;background:#fff;border:6px solid ${INK};border-radius:26px;box-shadow:8px 8px 0 ${INK};padding:20px 0;${pop(17 + i * .25)}"><div style="font-size:90px">${m}</div><div style="${OSW};font-size:84px;line-height:1">${v}</div><div style="${OSW};font-size:28px;color:#666">moedas</div></div>`).join('')}</div>
  <p style="${OSW};font-size:40px;margin-top:30px;${sobe(18.2)}">pra gastar na carreira 💼</p>
  <div style="width:940px;height:180px;margin-top:34px;background:#0b0b0b;border:6px solid ${INK};border-radius:22px;box-shadow:8px 8px 0 ${INK};position:relative;overflow:hidden;${pop(18.8)}">
    <span style="position:absolute;left:24px;top:12px;${OSW};font-size:24px;letter-spacing:.16em;color:#C9A9FF">⚔️ CLÃS DA SEMANA</span>
    <span style="position:absolute;left:24px;right:24px;top:50px;${OSW};font-size:42px;line-height:1.1;text-align:left;color:#C9A9FF;text-shadow:0 0 12px #C9A9FF99">🥇 MARTELO DE OURO · 🥈 OS BRABOS · 🥉 VÁRZEA UNIDA</span></div>
  <p style="font-size:30px;font-weight:800;color:rgba(12,12,12,.6);margin-top:24px;${sobe(19.4)}">o clã no 📺 telão a semana toda · campeão com 🏆 no selo</p>`)}

<!-- ⑤ selo na sala -->
${cena(21.8, 26.8, `
  <p style="${OSW};font-size:66px;text-transform:uppercase;line-height:1.05;margin-bottom:30px;${sobe(21.9)}">o seu clã <span style="color:${ROXO}">embaixo do seu nome</span></p>
  ${caixa(`<div style="padding:18px 26px;${OSW};font-size:28px;background:${INK};color:${GOLD}">👥 TÉCNICOS NA SALA</div>
    ${[['Tigrão FC', '⚡', '#2563EB', 'Martelo de Ouro 🏆'], ['Os Brabos FC', '🦅', '#C2452F', 'Os Brabos'], ['Canela Fina', '⚡', '#2563EB', 'Martelo de Ouro 🏆']].map(([n, ic, c, cl], i) => `<div style="padding:16px 26px;border-top:3px dashed #0002;${entra(22.4 + i * .3)}"><b style="display:block;font-size:38px;font-weight:800;margin-bottom:8px">${n}</b>${selo(ic, c, cl)}</div>`).join('')}`, 22.2)}
  <p style="font-size:30px;font-weight:800;color:rgba(12,12,12,.6);margin-top:30px;${sobe(23.6)}">na sala de espera, nos Amigos e no seu perfil</p>`)}

<!-- ⑥ grátis × plano -->
${cena(26.8, 31.6, `
  <div style="display:flex;flex-direction:column;gap:30px;align-items:center">
    <div style="width:940px;background:${GREEN};color:#fff;border:6px solid ${INK};border-radius:30px;box-shadow:10px 10px 0 ${INK};padding:34px;${pop(26.9)}"><div style="${OSW};font-size:84px;line-height:1">ENTRAR</div><div style="${OSW};font-size:52px;color:${GOLD}">é de graça pra todo mundo</div></div>
    <div style="width:940px;background:${INK};color:#fff;border:6px solid ${INK};border-radius:30px;box-shadow:10px 10px 0 ${GOLD};padding:34px;${pop(27.5)}"><div style="${OSW};font-size:84px;line-height:1;color:#E9C46A">CRIAR</div><div style="${OSW};font-size:46px">qualquer plano · ⭐ Craque pra cima</div><div style="font-size:30px;font-weight:700;margin-top:12px;color:#ddd">tem batismo? o escudo do seu clube vira o emblema 🛡️</div></div>
  </div>
  <p style="font-size:30px;font-weight:800;color:rgba(12,12,12,.6);margin-top:34px;${sobe(28.4)}">um clã por vez · aberto entra direto · fechado o presidente aceita</p>`)}

<!-- ⑦ CTA -->
${cena(31.6, 60, `
  <p style="${OSW};font-size:64px;text-transform:uppercase;line-height:1.08;${sobe(31.7)}">monta o clã da sua galera</p>
  <div style="margin-top:44px;${pop(32.2)}">${pill('👥 Amigos → ⚔️ Clã', ROXO, '#fff', 54)}</div>
  <p style="font-size:34px;font-weight:700;color:rgba(12,12,12,.6);margin:30px 0 0;${sobe(32.8)}">e bota o nome do clã no telão 📺</p>
  <p style="${OSW};font-size:60px;margin-top:80px;text-transform:uppercase;animation:pulsa 1.4s ease-in-out 33.4s infinite">⚽ Leilão <span style="color:${RED}">Legends</span></p>
  <p style="font-size:32px;font-weight:700;color:rgba(12,12,12,.55);margin-top:12px">leilaolegends.com</p>`)}
</body>`

// ── grava e converte ───────────────────────────────────────────────────────
const REC = '/tmp/rec-clas-reels'
rmSync(REC, { recursive: true, force: true }); mkdirSync(REC, { recursive: true })
const vtmp = '/tmp/video-clas-reels.html'
writeFileSync(vtmp, video)
if (process.argv.includes('--so-html')) { console.log(vtmp); process.exit(0) }

const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const ctx = await b.newContext({ viewport: { width: 1080, height: 1920 }, recordVideo: { dir: REC, size: { width: 1080, height: 1920 } } })
const vp = await ctx.newPage()
await vp.goto('file://' + vtmp)
await vp.evaluate(() => document.fonts.ready)
await vp.waitForTimeout(37600)
await ctx.close()
await b.close()

const webm = readdirSync(REC).find(f => f.endsWith('.webm'))
if (!webm) throw new Error('o Playwright não gravou o webm')

let FF = 'ffmpeg'
try { FF = createRequire(import.meta.url)('ffmpeg-static') } catch { /* usa o do PATH */ }
execFileSync(FF, ['-y', '-i', `${REC}/${webm}`,
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-pix_fmt', 'yuv420p',
  '-r', '30', '-movflags', '+faststart', SAIDA], { stdio: 'ignore' })
console.log('🎬', SAIDA)
