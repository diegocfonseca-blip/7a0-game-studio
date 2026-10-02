// ─── 🎬 REELS 1080×1920: 🌎🌍🌐 AS 3 COMPETIÇÕES NOVAS DA CARREIRA ─────────────────
// Pedido do Diego (02/10): *"quero também um vídeo naquele estilo padrão que temos feito,
// lançando as 3 novas competições, mas não fale nada que a pessoa vai receber o convite e
// etc. Só fale das 3 novas."*. Mesmo molde do `video-clubes-reels.mjs` (cenas em HTML +
// Playwright gravando + ffmpeg).
//
// ✅ TUDO É DO JOGO: as artes das competições são as do jogo (`src/escalacao/img/`), os
// escudos são os oficiais que o jogo já usa (`public/escudos-clubes/`), e os números são os
// do motor: Libertadores 36 clubes em 6 grupos de 6 · Champions 36 numa tabela só (1º–8º
// direto, 9º–24º repescão) · Mundial jogo único · pontos do ranking 60/50/50 (`PTS_TITULO`).
// 🚫 Sem falar de convite (ordem dele).
//
// 🎞️ Roteiro (~38 s):
//   0,0– 4,8   3 competições novas na carreira
//   4,8–11,0   🌎 Libertadores: 36 clubes, 6 grupos de 6
//  11,0–17,0   🌍 Champions: 36 numa tabela só, cortes
//  17,0–22,6   o jogo rolando no placar (gol saindo)
//  22,6–28,0   🌐 Mundial: campeão × campeão, jogo único
//  28,0–32,4   o que vale: pontos no ranking e moedas
//  32,4–38,2   como chegar (G8 da Série A ou Copa do Brasil) + marca
//
//   node scripts/video-internacional-reels.mjs [--saida internacional-reels.mp4]
import { readFileSync, writeFileSync, readdirSync, rmSync, mkdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { chromium } from 'playwright-core'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'internacional-reels.mp4')
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')
const img = p => `data:image/webp;base64,${readFileSync(p).toString('base64')}`
const esc = f => img(`public/escudos-clubes/${f}.webp`)
const ART_LIB = img('src/escalacao/img/online-liberta-v25.webp')
const ART_CHA = img('src/escalacao/img/online-champions-v25.webp')
const ART_MUN = img('src/escalacao/img/carreira-mundial-clubes-v1.webp')

const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6', GREEN = '#1B7A3D', RED = '#E8503A', ROXO = '#7C3AED', AZUL = '#0D4FCC'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'
const G_OURO = 'linear-gradient(160deg,#FFE79A,#FFC400 40%,#E8A200 70%,#FFDD70)'

const pill = (txt, bg, cor, fs = 32) => `
  <span style="display:inline-block;background:${bg};color:${cor};border:4px solid ${INK};border-radius:999px;
    box-shadow:5px 5px 0 ${INK};padding:10px 32px;${OSW};font-size:${fs}px;letter-spacing:.06em;text-transform:uppercase">${txt}</span>`
const cena = (ini, fim, html) => `
  <div class="cena" style="animation:apar .01s linear ${ini}s both, some .01s linear ${fim}s both">${html}</div>`
// 🎞️ o banner da competição, com a arte do jogo atrás
const banner = (art, org, nome, sub, t, grad = '90deg,rgba(0,0,0,.88),rgba(0,0,0,.25)') => `
  <div style="width:980px;height:330px;border:6px solid ${INK};border-radius:30px;box-shadow:10px 10px 0 ${INK};overflow:hidden;position:relative;
    background-image:linear-gradient(${grad}),url(${art});background-size:cover;background-position:center 35%;animation:pop .55s cubic-bezier(.2,1.6,.4,1) ${t}s both">
    <div style="position:absolute;left:44px;bottom:36px;text-align:left">
      <div style="${OSW};font-size:36px;letter-spacing:.14em;color:${GOLD}">${org}</div>
      <div style="${OSW};font-size:96px;line-height:.95;color:${CREME};text-transform:uppercase">${nome}</div>
      <div style="font-size:32px;font-weight:700;color:rgba(244,236,214,.85);margin-top:8px">${sub}</div>
    </div>
  </div>`
const disco = (f, tam, t) => `<span style="width:${tam}px;height:${tam}px;border-radius:50%;background:#fff;border:5px solid ${INK};box-shadow:5px 5px 0 ${INK};
  display:inline-flex;align-items:center;justify-content:center;animation:pop .4s cubic-bezier(.2,1.6,.4,1) ${t}s both">
  <img src="${esc(f)}" style="width:${Math.round(tam * .72)}px;height:${Math.round(tam * .72)}px;object-fit:contain"></span>`

// ⚽ o placar: Flamengo × Boca, gols saindo no relógio
const GOLS = [{ t: 18.9, h: 1, a: 0, txt: '⚽ GOLAÇO! de fora da área, no ângulo' }, { t: 20.4, h: 1, a: 1, txt: '⚽ empatou! cabeçada no segundo pau' }, { t: 21.6, h: 2, a: 1, txt: '⚽ VIRADA! contra-ataque fulminante' }]

const video = `<!doctype html><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box;margin:0;padding:0}
body{width:1080px;height:1920px;background:${CREME};font-family:system-ui;overflow:hidden;position:relative}
.cena{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:56px 44px;opacity:0}
@keyframes apar{to{opacity:1}}
@keyframes some{to{opacity:0}}
@keyframes pop{0%{transform:scale(.3);opacity:0}70%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}}
@keyframes entra{0%{transform:translateX(-70px);opacity:0}100%{transform:translateX(0);opacity:1}}
@keyframes sobe{0%{transform:translateY(90px);opacity:0}100%{transform:translateY(0);opacity:1}}
@keyframes pulsa{0%,100%{transform:scale(1)}50%{transform:scale(1.07)}}
@keyframes brilha{0%,100%{filter:drop-shadow(0 0 0 rgba(255,196,0,0))}50%{filter:drop-shadow(0 0 45px rgba(255,196,0,.9))}}
@keyframes treme{0%,100%{transform:translateX(0)}20%{transform:translateX(-14px)}40%{transform:translateX(14px)}60%{transform:translateX(-9px)}80%{transform:translateX(9px)}}
</style><body>

<!-- ① chegaram -->
${cena(0, 4.8, `
  <div style="animation:pop .5s cubic-bezier(.2,1.6,.4,1) .1s both">${pill('novo na carreira', RED, '#fff', 36)}</div>
  <p style="${OSW};font-size:150px;text-transform:uppercase;text-align:center;line-height:.95;margin:30px 0 6px;animation:sobe .5s .4s both">3 novas</p>
  <p style="${OSW};font-size:150px;text-transform:uppercase;text-align:center;line-height:.95;
    background:${G_OURO};-webkit-background-clip:text;-webkit-text-fill-color:transparent;filter:drop-shadow(6px 6px 0 ${INK});animation:sobe .5s .7s both">competições</p>
  <div style="display:flex;flex-direction:column;gap:18px;margin-top:50px">
    ${[['🌎', 'Libertadores', GREEN], ['🌍', 'Champions League', AZUL], ['🌐', 'Mundial de Clubes', ROXO]].map(([e, n, c], i) => `
    <div style="width:820px;background:#fff;border:6px solid ${INK};border-radius:24px;box-shadow:8px 8px 0 ${INK};padding:18px 28px;display:flex;align-items:center;gap:22px;
      animation:entra .45s cubic-bezier(.2,1.5,.4,1) ${(1.3 + i * .35).toFixed(2)}s both">
      <span style="font-size:70px;line-height:1">${e}</span><b style="${OSW};font-size:58px;text-transform:uppercase;color:${c}">${n}</b></div>`).join('')}
  </div>`)}

<!-- ② Libertadores -->
${cena(4.8, 11.0, `
  ${banner(ART_LIB, 'CONMEBOL', 'Libertadores', '36 clubes · 6 grupos de 6', 4.95, '90deg,rgba(1,15,10,.92),rgba(1,15,10,.2)')}
  <p style="${OSW};font-size:76px;text-transform:uppercase;text-align:center;line-height:1;margin:44px 0 30px;animation:sobe .45s 5.6s both">os gigantes<br><span style="color:${GREEN}">da América</span></p>
  <div style="display:grid;grid-template-columns:repeat(4,170px);gap:26px">
    ${['flamengo', 'boca-juniors', 'river-plate', 'palmeiras', 'penarol', 'sao-paulo', 'independiente', 'nacional-uru'].map((f, i) => disco(f, 170, 6.1 + i * .16)).join('')}
  </div>
  <div style="margin-top:40px;width:940px;background:#FFF6D6;border:6px solid ${INK};border-radius:26px;box-shadow:8px 8px 0 ${INK};padding:22px 30px;
    animation:entra .5s cubic-bezier(.2,1.5,.4,1) 7.9s both">
    <p style="font-size:38px;font-weight:800;line-height:1.4">🟢 Passam os <b>2 primeiros</b> de cada grupo + os <b>4 melhores 3ºs</b>. Depois é mata-mata até a <b>final em jogo único</b>.</p>
  </div>`)}

<!-- ③ Champions -->
${cena(11.0, 17.0, `
  ${banner(ART_CHA, 'UEFA', 'Champions League', '36 clubes numa tabela só', 11.15, '90deg,rgba(3,12,37,.92),rgba(3,12,37,.2)')}
  <div style="display:flex;gap:22px;margin:40px 0 34px">
    ${['real-madrid', 'barcelona', 'bayern', 'milan', 'liverpool'].map((f, i) => disco(f, 160, 11.7 + i * .16)).join('')}
  </div>
  <div style="display:flex;flex-direction:column;gap:14px;width:940px">
    ${[['1º ao 8º', 'direto pras oitavas', GREEN, '#fff'], ['9º ao 24º', 'jogam o repescão', GOLD, INK], ['25º ao 36º', 'estão fora', '#9A9384', '#fff']].map(([a, b, bg, c], i) => `
    <div style="display:flex;align-items:center;gap:20px;background:${bg};color:${c};border:5px solid ${INK};border-radius:20px;box-shadow:6px 6px 0 ${INK};padding:16px 26px;
      animation:entra .4s cubic-bezier(.2,1.5,.4,1) ${(12.8 + i * .4).toFixed(2)}s both">
      <b style="${OSW};font-size:46px;text-transform:uppercase;width:280px;text-align:left">${a}</b><span style="${OSW};font-size:40px;text-transform:uppercase">${b}</span></div>`).join('')}
  </div>
  <p style="font-size:36px;font-weight:800;color:rgba(12,12,12,.6);margin-top:28px;animation:sobe .45s 14.4s both">o formato de verdade, igual ao de hoje</p>`)}

<!-- ④ o jogo rolando -->
${cena(17.0, 22.6, `
  <p style="${OSW};font-size:80px;text-transform:uppercase;text-align:center;line-height:1;margin-bottom:30px;animation:sobe .45s 17.15s both">cada jogo<br><span style="color:${GREEN}">ao vivo</span></p>
  <div style="width:980px;background:linear-gradient(135deg,rgba(10,28,22,.97),rgba(7,19,15,.92));border:4px solid #847657;border-radius:32px;box-shadow:0 8px 0 ${INK};overflow:hidden;
    animation:pop .5s cubic-bezier(.2,1.6,.4,1) 17.4s both">
    <div style="position:relative;height:96px;background:${GOLD}">
      ${GOLS.map((g, i) => `<b style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;${OSW};font-size:40px;color:${INK};opacity:0;
        animation:apar .01s linear ${g.t}s both${i < GOLS.length - 1 ? `, some .01s linear ${GOLS[i + 1].t}s both` : ''}">${g.txt}</b>`).join('')}
      <b style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;${OSW};font-size:40px;color:${INK};animation:some .01s linear ${GOLS[0].t}s both">🟢 BOLA ROLANDO</b>
    </div>
    <div style="display:grid;grid-template-columns:1fr auto 1fr;align-items:center;padding:34px 20px 30px;color:${CREME}">
      <div style="text-align:center"><img src="${esc('flamengo')}" style="width:170px;height:170px;object-fit:contain"><b style="display:block;${OSW};font-size:46px;text-transform:uppercase;margin-top:10px">Flamengo</b></div>
      <div style="position:relative;width:250px;height:190px;background:${CREME};color:${INK};border:6px solid ${INK};border-radius:30px;display:flex;align-items:center;justify-content:center">
        ${[{ t: 17.4, h: 0, a: 0 }, ...GOLS].map((g, i, arr) => `<b style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;${OSW};font-size:100px;opacity:0;
          animation:apar .01s linear ${g.t}s both${i < arr.length - 1 ? `, some .01s linear ${arr[i + 1].t}s both` : ''}${i > 0 ? `, treme .4s ${g.t}s both` : ''}">${g.h} × ${g.a}</b>`).join('')}
      </div>
      <div style="text-align:center"><img src="${esc('boca-juniors')}" style="width:170px;height:170px;object-fit:contain"><b style="display:block;${OSW};font-size:46px;text-transform:uppercase;margin-top:10px">Boca Juniors</b></div>
    </div>
  </div>
  <p style="font-size:38px;font-weight:800;color:rgba(12,12,12,.62);margin-top:34px;text-align:center;line-height:1.35;animation:sobe .45s 18.2s both">
    o tempo correndo, o lance de cada gol<br>e a <b style="color:${INK}">tabela</b> sempre à vista</p>`)}

<!-- ⑤ Mundial -->
${cena(22.6, 28.0, `
  ${banner(ART_MUN, 'FIFA', 'Mundial de Clubes', 'a final das finais · jogo único', 22.75, '90deg,rgba(8,2,24,.9),rgba(8,2,24,.2)')}
  <div style="display:flex;align-items:center;gap:30px;margin:50px 0 30px">
    <div style="text-align:center;animation:pop .45s cubic-bezier(.2,1.6,.4,1) 23.5s both">${disco('flamengo', 210, 23.5)}<b style="display:block;${OSW};font-size:34px;margin-top:14px;text-transform:uppercase;color:${GREEN}">campeão da<br>Libertadores</b></div>
    <b style="${OSW};font-size:110px;color:#999;animation:pop .4s 24.1s both">×</b>
    <div style="text-align:center;animation:pop .45s cubic-bezier(.2,1.6,.4,1) 24.4s both">${disco('real-madrid', 210, 24.4)}<b style="display:block;${OSW};font-size:34px;margin-top:14px;text-transform:uppercase;color:${AZUL}">campeão da<br>Champions</b></div>
  </div>
  <p style="${OSW};font-size:72px;text-transform:uppercase;text-align:center;line-height:1;animation:sobe .45s 25.2s both, brilha 2.4s ease-in-out 26s infinite">quem é o<br><span style="color:${ROXO}">melhor do mundo?</span></p>
  <p style="font-size:36px;font-weight:800;color:rgba(12,12,12,.6);margin-top:22px;animation:sobe .45s 25.8s both">empatou? decide nos pênaltis 🥅</p>`)}

<!-- ⑥ o que vale -->
${cena(28.0, 32.4, `
  <p style="${OSW};font-size:88px;text-transform:uppercase;text-align:center;line-height:1;margin-bottom:36px;animation:sobe .45s 28.15s both">vale<br><span style="color:${GREEN}">muito ponto</span></p>
  ${[['🌐', 'Mundial de Clubes', '+60', ROXO], ['🌎', 'Libertadores', '+50', GREEN], ['🌍', 'Champions League', '+50', AZUL]].map(([e, n, p, c], i) => `
  <div style="display:flex;align-items:center;gap:20px;width:940px;background:#fff;border:5px solid ${INK};border-radius:22px;box-shadow:7px 7px 0 ${INK};padding:18px 28px;margin-bottom:16px;
    animation:entra .4s cubic-bezier(.2,1.5,.4,1) ${(28.5 + i * .35).toFixed(2)}s both">
    <span style="font-size:60px">${e}</span><b style="${OSW};font-size:46px;text-transform:uppercase;flex:1;text-align:left">${n}</b>
    <b style="${OSW};font-size:56px;color:#fff;background:${c};border:4px solid ${INK};border-radius:16px;padding:2px 18px">${p}</b></div>`).join('')}
  <p style="font-size:38px;font-weight:800;text-align:center;margin-top:24px;line-height:1.35;animation:sobe .45s 29.8s both">no <b>ranking global</b> · e 🪙 moedas pro caixa<br>a cada fase que você passa</p>`)}

<!-- ⑦ como chegar + marca -->
${cena(32.4, 40, `
  <p style="${OSW};font-size:84px;text-transform:uppercase;text-align:center;line-height:1;margin-bottom:34px;animation:sobe .45s 32.55s both">como<br><span style="color:${GREEN}">chegar lá</span></p>
  <div style="display:flex;flex-direction:column;gap:16px;align-items:center">
    <div style="width:880px;background:#fff;border:6px solid ${INK};border-radius:24px;box-shadow:8px 8px 0 ${INK};padding:20px 28px;${OSW};font-size:46px;text-transform:uppercase;
      animation:entra .45s cubic-bezier(.2,1.5,.4,1) 32.9s both">🏆 termine no <span style="color:${GREEN}">G8</span> da Série A</div>
    <b style="${OSW};font-size:42px;color:rgba(12,12,12,.5);animation:pop .4s 33.3s both">ou</b>
    <div style="width:880px;background:#fff;border:6px solid ${INK};border-radius:24px;box-shadow:8px 8px 0 ${INK};padding:20px 28px;${OSW};font-size:46px;text-transform:uppercase;
      animation:entra .45s cubic-bezier(.2,1.5,.4,1) 33.5s both">🇧🇷 ganhe a <span style="color:${GREEN}">Copa do Brasil</span></div>
  </div>
  <div style="margin-top:40px;animation:pop .5s cubic-bezier(.2,1.6,.4,1) 34.2s both">${pill('no modo carreira', GREEN, '#fff', 38)}</div>
  <p style="${OSW};font-size:64px;margin-top:44px;text-transform:uppercase;animation:pulsa 1.4s ease-in-out 34.8s infinite">
    ⚽ Leilão <span style="color:${RED}">Legends</span></p>
  <p style="font-size:32px;font-weight:700;color:rgba(12,12,12,.55);margin-top:12px">leilaolegends.com</p>`)}
</body>`

// ── grava e converte ───────────────────────────────────────────────────────
const REC = '/tmp/rec-internacional-reels'
rmSync(REC, { recursive: true, force: true }); mkdirSync(REC, { recursive: true })
const vtmp = '/tmp/video-internacional-reels.html'
writeFileSync(vtmp, video)
if (process.argv.includes('--so-html')) { console.log(vtmp); process.exit(0) }

const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const ctx = await b.newContext({ viewport: { width: 1080, height: 1920 }, recordVideo: { dir: REC, size: { width: 1080, height: 1920 } } })
const vp = await ctx.newPage()
await vp.goto('file://' + vtmp)
await vp.evaluate(() => document.fonts.ready)
await vp.waitForTimeout(38300)
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
