// ─── 🎬 REELS 1080×1920: 🏢 A SAF AGORA VIRA SEU 2º CLUBE ───────────────────
// Pedido do Diego (13/10): vídeo padrão anunciando a SAF que vira 2º clube na carreira, com
// destaque pra NOVIDADE dos empréstimos entre os seus dois clubes. Mesmo molde do
// `video-comunidade-reels.mjs` (cenas em HTML + Playwright gravando + ffmpeg).
//
// ✅ Regras mostradas (decididas em 13/10, ver `docs/pendencias.md` e o mockup
// `scripts/mockups/carreira-saf-completo.png`): SAF 2.000 (Série D, bot no comando, precisa do
// estádio completo) → 10 temporadas → assumir o comando 4.000 (só apoiador, só na virada) →
// empréstimo entre os clubes (1 temporada, volta sozinho, metade do salário cada) e
// transferência de vez pelo valor oficial → troca entre rodadas de graça, auxiliar no outro →
// vender com lucro máx +500 (SAF pela divisão; 2º clube pela coleção de 6 taças).
// Clubes de exemplo inventados ("Seu Clube FC", "Galáxia EC"); nenhum nome de gente de verdade.
//
// 🎞️ Roteiro (~36,6 s):
//   0,0– 4,4   🏢 a SAF agora vira seu 2º clube
//   4,4–10,4   🪜 a escada: compra a SAF 2.000 → 10 temporadas (barra) → assumir o comando 4.000
//  10,4–17,4   🔁 NOVIDADE: empréstimo entre os seus dois clubes (cartas viajando) + transferência de vez
//  17,4–22,6   ⚽ troca de clube entre as rodadas, de graça · o outro fica com o auxiliar
//  22,6–26,6   💸 vender a SAF: lucro máx +500 · tabela por divisão
//  26,6–30,6   🏆 vender o 2º clube: coleção de 6 taças (3.000 → 6.500)
//  30,6–36,6   CTA: Carreira · Clube › Estrutura + marca
//
//   node scripts/video-saf-reels.mjs [--saida saf-reels.mp4]
import { readFileSync, writeFileSync, readdirSync, rmSync, mkdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { chromium } from 'playwright-core'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'saf-reels.mp4')
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6', GREEN = '#1B7A3D', RED = '#E8503A', ROXO = '#7C3AED'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'
const TOTAL = 36.6

const pill = (txt, bg, cor, fs = 32) => `
  <span style="display:inline-block;background:${bg};color:${cor};border:4px solid ${INK};border-radius:999px;
    box-shadow:5px 5px 0 ${INK};padding:10px 32px;${OSW};font-size:${fs}px;letter-spacing:.06em;text-transform:uppercase">${txt}</span>`
const cena = (ini, fim, html) => `
  <div class="cena" style="animation:apar .01s linear ${ini}s both, some .01s linear ${fim}s both">${html}</div>`
const entra = (atraso, extra = '') => `animation:entra .45s cubic-bezier(.2,1.5,.4,1) ${atraso}s both;${extra}`
const sobe = atraso => `animation:sobe .45s ${atraso}s both`
const pop = atraso => `animation:pop .5s cubic-bezier(.2,1.6,.4,1) ${atraso}s both`
const caixa = (extra = '') => `background:#fff;border:5px solid ${INK};border-radius:28px;box-shadow:9px 9px 0 ${INK};${extra}`

// degrau da escada: número + título + detalhe
const degrau = (n, cor, titulo, sub, atraso, conteudo = '') => `
  <div style="display:flex;align-items:center;gap:26px;width:960px;${caixa('padding:22px 28px;')}${pop(atraso)}">
    <span style="flex:none;width:104px;height:104px;border-radius:22px;background:${cor};border:5px solid ${INK};display:flex;align-items:center;
      justify-content:center;${OSW};font-size:64px;color:${cor === GOLD ? INK : '#fff'}">${n}</span>
    <span style="flex:1;text-align:left">
      <b style="${OSW};font-size:48px;display:block;line-height:1.05;text-transform:uppercase">${titulo}</b>
      <span style="font-size:28px;font-weight:700;opacity:.7;line-height:1.3;display:block">${sub}</span>
      ${conteudo}
    </span>
  </div>`
const seta = atraso => `<p style="font-size:54px;line-height:1;margin:10px 0;${pop(atraso)}">⬇️</p>`

// clube (caixa grande com escudo de emoji)
const clube = (emoji, nome, sub, cor, atraso, tinta = '#fff') => `
  <div style="width:300px;background:${cor};color:${tinta};border:5px solid ${INK};border-radius:28px;box-shadow:9px 9px 0 ${INK};
    padding:24px 14px;${pop(atraso)}">
    <p style="font-size:84px;line-height:1">${emoji}</p>
    <p style="${OSW};font-size:40px;text-transform:uppercase;line-height:1.05;margin-top:10px">${nome}</p>
    <p style="font-size:24px;font-weight:700;opacity:.85;margin-top:6px">${sub}</p>
  </div>`

// cartinha de jogador viajando entre os clubes (posição + faixa de nível; sem nome de gente)
const carta = (pos, cor, anim) => `
  <div style="position:absolute;left:50%;top:50%;width:132px;height:178px;margin:-89px 0 0 -66px;background:#fff;border:5px solid ${INK};
    border-radius:18px;box-shadow:6px 6px 0 ${INK};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;
    z-index:5;animation:${anim}">
    <span style="width:70px;height:70px;border-radius:50%;background:${cor};border:4px solid ${INK};display:flex;align-items:center;justify-content:center;font-size:38px">🧍</span>
    <b style="${OSW};font-size:36px;line-height:1">${pos}</b>
  </div>`

const linha = (esq, dir, atraso, fundo = '#fff', corDir = INK) => `
  <div style="display:flex;justify-content:space-between;align-items:center;padding:16px 26px;border:4px solid ${INK};border-radius:16px;
    background:${fundo};margin-top:12px;${entra(atraso)}">
    <span style="font-size:32px;font-weight:800">${esq}</span>
    <b style="${OSW};font-size:38px;color:${corDir}">${dir}</b>
  </div>`

const taca = (nome, ganha, atraso) => `
  <div style="width:292px;padding:18px 8px;border:4px solid ${ganha ? INK : '#0003'};border-radius:20px;background:${ganha ? '#FFF4C2' : '#fff'};
    ${ganha ? `box-shadow:5px 5px 0 ${INK};` : ''}${pop(atraso)}">
    <p style="font-size:62px;line-height:1;${ganha ? '' : 'filter:grayscale(1);opacity:.35'}">🏆</p>
    <p style="${OSW};font-size:28px;text-transform:uppercase;margin-top:8px;${ganha ? '' : 'opacity:.4'}">${nome}</p>
  </div>`

const video = `<!doctype html><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box;margin:0;padding:0}
body{width:1080px;height:1920px;background:${CREME};font-family:system-ui;color:${INK};overflow:hidden;position:relative}
.cena{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:56px 44px;opacity:0;text-align:center}
@keyframes apar{to{opacity:1}}
@keyframes some{to{opacity:0}}
@keyframes pop{0%{transform:scale(.3);opacity:0}70%{transform:scale(1.12)}100%{transform:scale(1);opacity:1}}
@keyframes entra{0%{transform:translateX(-70px);opacity:0}100%{transform:translateX(0);opacity:1}}
@keyframes sobe{0%{transform:translateY(90px);opacity:0}100%{transform:translateY(0);opacity:1}}
@keyframes pulsa{0%,100%{transform:scale(1)}50%{transform:scale(1.07)}}
@keyframes brilho{0%{background-position:-400px 0}100%{background-position:900px 0}}
@keyframes enche{0%{width:0}100%{width:100%}}
@keyframes vai{0%{transform:translateX(-330px) scale(.6);opacity:0}15%{opacity:1;transform:translateX(-330px) scale(1)}
  85%{transform:translateX(330px) scale(1);opacity:1}100%{transform:translateX(330px) scale(.6);opacity:0}}
@keyframes volta{0%{transform:translateX(330px) scale(.6);opacity:0}15%{opacity:1;transform:translateX(330px) scale(1)}
  85%{transform:translateX(-330px) scale(1);opacity:1}100%{transform:translateX(-330px) scale(.6);opacity:0}}
</style><body>

<!-- ① a SAF vira seu 2º clube -->
${cena(0, 4.4, `
  <div style="width:230px;height:230px;border-radius:44px;background:${GOLD};border:7px solid ${INK};box-shadow:10px 10px 0 ${INK};
    display:flex;align-items:center;justify-content:center;font-size:130px;${pop(.1)}">🏢</div>
  <p style="${OSW};font-size:58px;text-transform:uppercase;color:rgba(12,12,12,.5);margin-top:50px;${sobe(.45)}">novidade na carreira</p>
  <p style="${OSW};font-size:150px;text-transform:uppercase;line-height:.98;color:${ROXO};${pop(.7)}">a SAF</p>
  <p style="${OSW};font-size:76px;text-transform:uppercase;line-height:1.08;margin-top:14px;${sobe(1.1)}">agora vira seu<br><span style="color:${GREEN}">2º clube</span> ⚽</p>
  <div style="margin-top:46px;${pop(1.7)}">${pill('dois clubes · uma carreira', '#fff', INK, 36)}</div>`)}

<!-- ② a escada -->
${cena(4.4, 10.4, `
  <p style="${OSW};font-size:70px;text-transform:uppercase;line-height:1.05;margin-bottom:34px;${sobe(4.5)}">o caminho 🪜</p>
  ${degrau(1, GOLD, '🏢 Compra a SAF · 2.000 🪙', 'clube da Série D · o bot segue no comando<br>precisa do estádio completo', 4.7)}
  ${seta(5.5)}
  ${degrau(2, ROXO, '⏳ 10 temporadas como dono', 'você é o sócio: leva parte dos prêmios dela', 5.8, `
    <div style="margin-top:14px;height:34px;border:4px solid ${INK};border-radius:999px;background:#fff;overflow:hidden">
      <div style="height:100%;background:${GOLD};border-right:4px solid ${INK};animation:enche 2.2s ease-in-out 6.3s both"></div></div>`)}
  ${seta(7.4)}
  ${degrau(3, GREEN, '⚽ Assumir o comando · 4.000 🪙', 'só na virada · vira seu 2º clube jogável', 7.7)}
  <div style="margin-top:34px;${pop(8.6)}">${pill('⭐ só pra apoiador: Craque · Lenda · Batismo', GOLD, INK, 30)}</div>`)}

<!-- ③ NOVIDADE: empréstimo entre os seus clubes -->
${cena(10.4, 17.4, `
  <div style="${pop(10.5)}">${pill('🆕 novidade', RED, '#fff', 38)}</div>
  <p style="${OSW};font-size:76px;text-transform:uppercase;line-height:1.04;margin:26px 0 40px;${sobe(10.7)}">empresta jogador<br><span style="color:${ROXO}">entre os seus clubes</span></p>
  <div style="position:relative;width:960px;display:flex;justify-content:space-between;align-items:center">
    ${clube('⚽', 'Seu Clube FC', 'clube principal', GREEN, 11.0)}
    ${clube('🏢', 'Galáxia EC', 'seu 2º clube', ROXO, 11.2)}
    <p style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font-size:90px;line-height:1;${pop(11.4)}">🔁</p>
    ${carta('MEI', GOLD, 'vai 1.8s ease-in-out 11.8s both')}
    ${carta('ATA', RED, 'volta 1.8s ease-in-out 13.7s both')}
  </div>
  <div style="width:960px;margin-top:40px;${caixa('padding:24px 30px;text-align:left;')}${sobe(12.2)}">
    <p style="font-size:34px;font-weight:800;line-height:1.5">🔁 só na janela, na virada da temporada<br>📅 vale 1 temporada e volta sozinho<br>💰 metade do salário pra cada clube</p>
  </div>
  <div style="width:960px;margin-top:26px;background:${GOLD};border:5px solid ${INK};border-radius:28px;box-shadow:9px 9px 0 ${INK};padding:22px 30px;${pop(15.6)}">
    <p style="${OSW};font-size:44px;text-transform:uppercase;line-height:1.1">🤝 ou transfere de vez</p>
    <p style="font-size:30px;font-weight:800;margin-top:8px">pelo valor oficial: sai de um caixa, entra no outro</p>
  </div>`)}

<!-- ④ troca de clube + auxiliar -->
${cena(17.4, 22.6, `
  <p style="${OSW};font-size:72px;text-transform:uppercase;line-height:1.05;${sobe(17.5)}">troca de clube<br><span style="color:${GREEN}">entre as rodadas</span></p>
  <div style="margin:24px 0 40px;${pop(17.9)}">${pill('de graça', GREEN, '#fff', 40)}</div>
  <div style="display:flex;gap:16px;width:960px;${pop(18.3)}">
    <div style="flex:1;background:${GREEN};color:#fff;border:5px solid ${INK};border-radius:22px;box-shadow:6px 6px 0 ${INK};padding:20px 10px;${OSW};font-size:36px;text-transform:uppercase">⚽ Seu Clube FC</div>
    <div style="flex:1;background:#fff;border:5px solid ${INK};border-radius:22px;padding:20px 10px;${OSW};font-size:36px;text-transform:uppercase">🏢 Galáxia EC</div>
  </div>
  <div style="width:960px;margin-top:34px;${caixa('padding:28px 30px;text-align:left;')}${sobe(19)}">
    <p style="${OSW};font-size:46px;text-transform:uppercase;line-height:1.1">🤖 o outro fica com o auxiliar</p>
    <p style="font-size:32px;font-weight:700;line-height:1.4;margin-top:12px;opacity:.75">sem você lá, ele escala, renova<br>e repõe quem sai com o caixa dele</p>
  </div>
  <div style="margin-top:34px;${pop(20.2)}">${pill('💰 cada clube com o seu caixa', GOLD, INK, 34)}</div>`)}

<!-- ⑤ vender a SAF: tabela por divisão -->
${cena(22.6, 26.6, `
  <p style="${OSW};font-size:66px;text-transform:uppercase;line-height:1.05;${sobe(22.7)}">💸 quer vender?</p>
  <p style="font-size:34px;font-weight:800;margin:14px 0 26px;${sobe(22.9)}">comprar clube é risco: lucro máximo <span style="color:${GREEN}">+500</span> 😅</p>
  <div style="width:960px;${caixa('padding:24px 28px 34px;')}${pop(23.1)}">
    <p style="${OSW};font-size:44px;text-transform:uppercase;text-align:left">🏢 a SAF vale pela divisão</p>
    ${linha('Várzea', '500', 23.5, '#fff', RED)}
    ${linha('Série D', '1.000', 23.7, '#fff', RED)}
    ${linha('Série C', '1.500', 23.9, '#fff', RED)}
    ${linha('Série B', '2.000', 24.1)}
    ${linha('Série A', '2.500 · +500', 24.3, '#E8F8EE', GREEN)}
  </div>
  <p style="font-size:30px;font-weight:700;color:rgba(12,12,12,.6);margin-top:26px;${sobe(24.7)}">você pagou 2.000 · só dá lucro na Série A</p>`)}

<!-- ⑥ vender o 2º clube: coleção de taças -->
${cena(26.6, 30.6, `
  <p style="${OSW};font-size:62px;text-transform:uppercase;line-height:1.1;${sobe(26.7)}">⚽ o 2º clube vale<br><span style="color:${GREEN}">pela coleção de taças</span></p>
  <p style="font-size:30px;font-weight:700;color:rgba(12,12,12,.6);margin:14px 0 26px;${sobe(26.9)}">ganhas com você · cada uma conta 1 vez</p>
  <div style="display:grid;grid-template-columns:repeat(3,292px);gap:18px">
    ${taca('Série A', true, 27.1)}${taca('Copa do Brasil', true, 27.25)}${taca('Supercopa', false, 27.4)}
    ${taca('Libertadores', false, 27.55)}${taca('Champions', false, 27.7)}${taca('Mundial', false, 27.85)}
  </div>
  <div style="display:flex;gap:18px;margin-top:34px">
    <div style="${pop(28.3)}">${pill('sem taça · 3.000', '#fff', INK, 32)}</div>
    <div style="${pop(28.6)}">${pill('as 6 · 6.500 🏆', GOLD, INK, 32)}</div>
  </div>`)}

<!-- ⑦ CTA -->
${cena(30.6, 60, `
  <p style="font-size:120px;line-height:1;${pop(30.7)}">🏢⚽</p>
  <p style="${OSW};font-size:84px;text-transform:uppercase;line-height:1.02;margin-top:20px;${sobe(30.9)}">monta o seu<br><span style="color:${ROXO}">2º clube</span></p>
  <p style="font-size:34px;font-weight:700;color:rgba(12,12,12,.6);margin:20px 0 34px;${sobe(31.1)}">já está no jogo 👇</p>
  <div style="width:900px;border:5px solid ${INK};border-radius:28px;box-shadow:9px 9px 0 ${INK};padding:30px;
    background:linear-gradient(110deg,${GOLD} 0%,#FFE27A 40%,#fff6cf 50%,#FFE27A 60%,${GOLD} 100%);background-size:900px 100%;
    animation:pop .5s cubic-bezier(.2,1.6,.4,1) 31.4s both, brilho 2.2s linear 31.9s infinite">
    <p style="${OSW};font-size:52px;text-transform:uppercase;line-height:1.15">na Carreira</p>
    <p style="${OSW};font-size:46px;text-transform:uppercase;line-height:1.15;margin-top:6px">Clube › Estrutura</p>
  </div>
  <div style="display:flex;gap:14px;flex-wrap:wrap;justify-content:center;margin-top:34px;${pop(32)}">
    ${pill('🏢 SAF', '#fff', INK, 28)}${pill('🔁 empréstimos', ROXO, '#fff', 28)}${pill('⚽ 2º clube', GREEN, '#fff', 28)}
  </div>
  <p style="${OSW};font-size:60px;margin-top:56px;text-transform:uppercase;animation:pulsa 1.4s ease-in-out 32.6s infinite">
    ⚽ Leilão <span style="color:${RED}">Legends</span></p>
  <p style="font-size:32px;font-weight:700;color:rgba(12,12,12,.55);margin-top:12px">leilaolegends.com</p>`)}
</body>`

// ── grava e converte ───────────────────────────────────────────────────────
const REC = '/tmp/rec-saf-reels'
rmSync(REC, { recursive: true, force: true }); mkdirSync(REC, { recursive: true })
const vtmp = '/tmp/video-saf-reels.html'
writeFileSync(vtmp, video)
if (process.argv.includes('--so-html')) { console.log(vtmp); process.exit(0) }

const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const ctx = await b.newContext({ viewport: { width: 1080, height: 1920 }, recordVideo: { dir: REC, size: { width: 1080, height: 1920 } } })
const vp = await ctx.newPage()
await vp.goto('file://' + vtmp)
await vp.evaluate(() => document.fonts.ready)
await vp.waitForTimeout(Math.round((TOTAL + 0.6) * 1000))
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
