// ─── 🎬 REELS 1080×1920: 👥 AMIGOS CHEGOU PRA TODO MUNDO (19/10) ───────────────────────────────
// Pedido do Diego (19/10): *"pode fazer p todos e tb já faça vídeo padrão de reels e tb aviso da comunidade do zap"*.
// Mesmo molde do `video-comunidade-reels.mjs` (cenas em HTML + Playwright gravando + ffmpeg).
// ⚠️ Ninguém de verdade: os "amigos" são apelidos de brincadeira (Seu parceiro, Seu primo…) e bolinha colorida no
// lugar do rosto (regra de não inventar pessoa real, 18/08).
//
// 🎞️ Roteiro (~37 s):
//   0,0– 4,4   👥 chegou: AMIGOS no Leilão Legends
//   4,4– 9,8   ➕ toque no nome (na sala ou no chat) → perfil → adicionar
//   9,8–15,4   🟢 quem está online · 📣 chamar pra sua sala · 🚪 entrar na dele (só enquanto a sala espera)
//  15,4–20,6   🔔 o sininho avisa convite e pedido + "entrou no jogo"
//  20,6–26,0   🏆 ranking dos amigos + 📊 posição na semana/mês + 🥇🥈🥉
//  26,0–31,0   🔥 marque UM rival
//  31,0–37,0   💬 conversa é na comunidade + CTA (home → 👥 Amigos)
//
//   node scripts/video-amigos-reels.mjs [--saida scripts/posts/amigos-reels.mp4]
import { readFileSync, writeFileSync, readdirSync, rmSync, mkdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { chromium } from 'playwright-core'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'scripts/posts/amigos-reels.mp4')
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
const bola = (cor, t = 84, ini = '') => `<span style="flex:none;width:${t}px;height:${t}px;border-radius:50%;background:${cor};border:4px solid ${INK};
  display:inline-flex;align-items:center;justify-content:center;${OSW};font-size:${t * .45}px;color:#fff">${ini}</span>`
const btn = (txt, bg, cor, fs = 30) => `<span style="flex:none;background:${bg};color:${cor};border:4px solid ${INK};border-radius:16px;box-shadow:4px 4px 0 ${INK};
  padding:10px 20px;${OSW};font-size:${fs}px;text-transform:uppercase;white-space:nowrap">${txt}</span>`
const caixa = (html, atraso, extra = '') => `<div style="width:940px;background:#fff;border:6px solid ${INK};border-radius:30px;box-shadow:10px 10px 0 ${INK};
  overflow:hidden;text-align:left;${pop(atraso)};${extra}">${html}</div>`
const topo = (txt, cor = GOLD) => `<div style="background:${INK};color:${cor};padding:20px 28px;${OSW};font-size:40px;text-transform:uppercase">${txt}</div>`
const linha = (cor, ini, nome, sub, subCor, dir, atraso) => `
  <div style="display:flex;align-items:center;gap:22px;padding:20px 28px;border-top:3px dashed #0002;${entra(atraso)}">
    ${bola(cor, 80, ini)}
    <span style="flex:1;min-width:0"><b style="font-size:40px;font-weight:800;display:block;line-height:1.1">${nome}</b>
      <span style="font-size:28px;font-weight:700;color:${subCor}">${sub}</span></span>${dir}
  </div>`

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
@keyframes cai{0%{transform:translateY(-260px) rotate(-8deg);opacity:0}70%{transform:translateY(16px) rotate(1deg);opacity:1}100%{transform:translateY(0) rotate(0);opacity:1}}
@keyframes balanca{0%,100%{transform:rotate(0)}20%{transform:rotate(-16deg)}40%{transform:rotate(14deg)}60%{transform:rotate(-8deg)}80%{transform:rotate(5deg)}}
@keyframes chama{0%,100%{transform:scale(1) rotate(-3deg)}50%{transform:scale(1.15) rotate(3deg)}}
@keyframes dedo{0%,100%{transform:translate(0,0)}50%{transform:translate(-14px,-14px)}}
</style><body>

<!-- ① chegou -->
${cena(0, 4.4, `
  <div style="display:flex;gap:-20px;${pop(.1)}">${bola(ROXO, 190, '👥')}</div>
  <p style="${OSW};font-size:60px;text-transform:uppercase;color:rgba(12,12,12,.5);margin-top:50px;${sobe(.45)}">chegou pra todo mundo</p>
  <p style="${OSW};font-size:170px;text-transform:uppercase;line-height:.95;color:${ROXO};${pop(.7)}">amigos</p>
  <p style="${OSW};font-size:64px;text-transform:uppercase;line-height:1.1;margin-top:14px;${sobe(1.1)}">no Leilão <span style="color:${RED}">Legends</span></p>
  <div style="margin-top:46px;${pop(1.6)}">${pill('⚽ online', GOLD, INK, 40)}</div>`)}

<!-- ② adicionar -->
${cena(4.4, 9.8, `
  <p style="${OSW};font-size:72px;text-transform:uppercase;line-height:1.05;margin-bottom:12px;${sobe(4.5)}">toca no <span style="color:${ROXO}">nome</span></p>
  <p style="font-size:34px;font-weight:700;color:rgba(12,12,12,.6);margin-bottom:34px;${sobe(4.7)}">na sala de espera ou no chat 👇</p>
  ${caixa(`${topo('🔨 técnicos na sala', '#fff')}
    ${linha(GREEN, 'P', '<u style="text-decoration-style:dotted">Seu parceiro</u> <span style="font-size:44px;animation:dedo 1s ease-in-out 5.6s infinite;display:inline-block">👆</span>', 'pronto pro pregão', '#666', '', 5.0)}
    ${linha('#3B82F6', 'G', 'Galera do trampo', 'pronto pro pregão', '#666', '', 5.2)}`, 4.9)}
  <div style="margin-top:34px">${caixa(`
    <div style="display:flex;align-items:center;gap:22px;padding:26px 28px;background:linear-gradient(135deg,#E8F5EC,#fff)">${bola(GREEN, 120, 'P')}
      <span><b style="${OSW};font-size:52px;text-transform:uppercase;display:block">Seu parceiro</b><span style="font-size:28px;font-weight:700;color:#555">🏆 12 títulos no online</span></span></div>
    <div style="padding:0 28px 26px"><div style="background:${GREEN};color:#fff;border:4px solid ${INK};border-radius:18px;box-shadow:4px 4px 0 ${INK};
      text-align:center;padding:18px;${OSW};font-size:42px;text-transform:uppercase;animation:pulsa 1.2s ease-in-out 7.4s infinite">➕ adicionar amigo</div></div>`, 6.6)}</div>
  <p style="font-size:30px;font-weight:800;margin-top:30px;${sobe(7.8)}">amizade vale com os dois aceitando · ninguém vê seu e-mail 🔒</p>`)}

<!-- ③ online + chamar/entrar -->
${cena(9.8, 15.4, `
  <p style="${OSW};font-size:72px;text-transform:uppercase;line-height:1.05;margin-bottom:34px;${sobe(9.9)}">quem tá <span style="color:${GREEN}">online</span>?</p>
  ${caixa(`${topo('🟢 online agora (3)')}
    ${linha(GREEN, 'P', 'Seu parceiro', '● numa sala de espera', GREEN, btn('🚪 entrar', GREEN, '#fff'), 10.3)}
    ${linha('#F2C200', 'S', 'Seu primo', '● no menu', GREEN, btn('📣 chamar', ROXO, '#fff'), 10.7)}
    ${linha(RED, 'V', 'Vizinho', '🎮 jogando agora · a sala já começou', '#7a4d00', '', 11.1)}`, 10.1)}
  <div style="display:flex;flex-direction:column;gap:18px;margin-top:44px;align-items:center">
    <div style="${pop(12.0)}">${pill('📣 chama pra SUA sala na hora', '#fff', INK, 32)}</div>
    <div style="${pop(12.5)}">${pill('🚪 entra na dele enquanto ela espera', GOLD, INK, 32)}</div>
  </div>
  <p style="font-size:30px;font-weight:800;color:rgba(12,12,12,.6);margin-top:30px;${sobe(13.1)}">começou o pregão? aí não entra mais — é justo pra todo mundo</p>`)}

<!-- ④ sininho -->
${cena(15.4, 20.6, `
  <div style="position:relative;${pop(15.5)}">
    <div style="width:220px;height:220px;border-radius:40px;background:#fff;border:7px solid ${INK};box-shadow:10px 10px 0 ${INK};display:flex;align-items:center;justify-content:center;
      font-size:130px;animation:balanca 1s ease-in-out 16s 3">🔔</div>
    <span style="position:absolute;top:-26px;right:-26px;width:84px;height:84px;border-radius:50%;background:${RED};color:#fff;border:5px solid ${INK};display:flex;align-items:center;justify-content:center;${OSW};font-size:46px;${pop(16.1)}">2</span>
  </div>
  <p style="${OSW};font-size:66px;text-transform:uppercase;line-height:1.05;margin:44px 0 30px;${sobe(16.2)}">o sininho <span style="color:${RED}">avisa</span></p>
  ${caixa(`
    ${linha(GREEN, 'P', 'Seu parceiro', 'te chamou pra sala <b>KXT42P</b>', INK, btn('🚪 entrar', GREEN, '#fff'), 16.8)}
    ${linha('#F2C200', 'S', 'Seu primo', 'quer ser seu amigo', INK, btn('aceitar', GREEN, '#fff'), 17.2)}`, 16.6)}
  <div style="margin-top:36px;display:flex;align-items:center;gap:18px;width:820px;background:#fff;border:5px solid ${INK};border-radius:22px;box-shadow:6px 6px 0 ${INK};padding:18px 24px;
    text-align:left;animation:cai .7s cubic-bezier(.2,1.4,.4,1) 18.2s both">${bola(RED, 64, 'V')}
    <span style="font-size:34px;font-weight:800"><span style="color:${GREEN}">●</span> <b>Vizinho</b> entrou no jogo</span></div>`)}

<!-- ⑤ ranking dos amigos -->
${cena(20.6, 26.0, `
  <p style="${OSW};font-size:68px;text-transform:uppercase;line-height:1.05;margin-bottom:30px;${sobe(20.7)}">🏆 ranking <span style="color:${ROXO}">dos amigos</span></p>
  ${caixa(`${topo('títulos no online · esta semana')}
    ${linha(GREEN, 'P', '🥇 Seu parceiro', '', '#666', `<span style="${OSW};font-size:44px">9 🏆</span>`, 21.1)}
    ${linha(ROXO, 'V', '🥈 Você', '', '#666', `<span style="${OSW};font-size:44px">7 🏆</span>`, 21.4)}
    ${linha('#F2C200', 'S', '🥉 Seu primo', '', '#666', `<span style="${OSW};font-size:44px">4 🏆</span>`, 21.7)}`, 20.9)}
  <div style="display:flex;gap:24px;margin-top:40px;${pop(22.6)}">
    <div style="width:300px;background:#FFF7DA;border:5px solid ${INK};border-radius:22px;box-shadow:6px 6px 0 ${INK};padding:18px">
      <div style="font-size:26px;font-weight:800;color:#555">esta semana</div><div style="${OSW};font-size:76px;line-height:1">12º</div></div>
    <div style="width:300px;background:#FFF7DA;border:5px solid ${INK};border-radius:22px;box-shadow:6px 6px 0 ${INK};padding:18px">
      <div style="font-size:26px;font-weight:800;color:#555">este mês</div><div style="${OSW};font-size:76px;line-height:1">31º</div></div>
  </div>
  <p style="${OSW};font-size:52px;margin-top:30px;${pop(23.4)}">🥇 2 &nbsp; 🥈 1 &nbsp; 🥉 3</p>
  <p style="font-size:30px;font-weight:800;color:rgba(12,12,12,.6);margin-top:10px;${sobe(23.8)}">no perfil: sua posição no online + as medalhas do pódio semanal</p>`)}

<!-- ⑥ rival -->
${cena(26.0, 31.0, `
  <p style="font-size:200px;line-height:1;animation:pop .5s cubic-bezier(.2,1.6,.4,1) 26.1s both, chama .9s ease-in-out 26.6s infinite">🔥</p>
  <p style="${OSW};font-size:76px;text-transform:uppercase;line-height:1.05;margin:20px 0 30px;${sobe(26.4)}">marque <span style="color:${RED}">UM rival</span></p>
  ${caixa(`<div style="display:flex;align-items:center;gap:24px;padding:28px;background:#FFE3D6">${bola(RED, 110, 'V')}
    <span style="flex:1"><b style="${OSW};font-size:50px;text-transform:uppercase;display:block">🔥 Vizinho</b><span style="font-size:28px;font-weight:700;color:#7a2a12">títulos desde que virou rival</span></span>
    <span style="${OSW};font-size:72px">5 × 3</span></div>`, 26.8)}
  <div style="display:flex;flex-direction:column;gap:16px;margin-top:40px;align-items:center">
    <div style="${pop(27.6)}">${pill('🔥 do lado do nome dele na sala', '#fff', INK, 30)}</div>
    <div style="${pop(28.0)}">${pill('ganhou com ele na sala? o chat zoa 😎', GOLD, INK, 30)}</div>
  </div>
  <p style="font-size:30px;font-weight:800;color:rgba(12,12,12,.6);margin-top:26px;${sobe(28.5)}">é só zoeira: não muda nada no jogo</p>`)}

<!-- ⑦ comunidade + CTA -->
${cena(31.0, 60, `
  <div style="width:180px;height:180px;border-radius:50%;background:${ZAP};border:7px solid ${INK};box-shadow:9px 9px 0 ${INK};display:flex;align-items:center;justify-content:center;font-size:100px;${pop(31.1)}">💬</div>
  <p style="${OSW};font-size:60px;text-transform:uppercase;line-height:1.08;margin:34px 0 10px;${sobe(31.4)}">a resenha é na<br><span style="color:${GREEN}">comunidade do zap</span></p>
  <p style="font-size:32px;font-weight:700;color:rgba(12,12,12,.6);margin-bottom:46px;${sobe(31.7)}">o botão tá dentro dos Amigos</p>
  <p style="${OSW};font-size:84px;text-transform:uppercase;line-height:1.02;${pop(32.3)}">abre o jogo</p>
  <div style="display:flex;align-items:center;gap:20px;margin-top:26px;${pop(32.8)}">${btn('👥 amigos', ROXO, '#fff', 52)}<span style="font-size:60px">+</span>${btn('🔔', '#fff', INK, 52)}</div>
  <p style="${OSW};font-size:60px;margin-top:60px;text-transform:uppercase;animation:pulsa 1.4s ease-in-out 33.4s infinite">⚽ Leilão <span style="color:${RED}">Legends</span></p>
  <p style="font-size:32px;font-weight:700;color:rgba(12,12,12,.55);margin-top:12px">leilaolegends.com</p>`)}
</body>`

// ── grava e converte ───────────────────────────────────────────────────────
const REC = '/tmp/rec-amigos-reels'
rmSync(REC, { recursive: true, force: true }); mkdirSync(REC, { recursive: true })
const vtmp = '/tmp/video-amigos-reels.html'
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
