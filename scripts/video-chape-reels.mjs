// 💚 REELS 1080×1920 — HOMENAGEM À CHAPECOENSE
//
// Pedido do Diego (28/08): *"faça também um vídeo dessa arte aqui da Chape, pra
// eu postar no Instagram"*.
//
// 🕊️ TOM: é HOMENAGEM, não anúncio. Então **nada** do repertório dos outros
// vídeos do jogo aqui: sem `pop`, sem `treme`, sem número gigante, sem 🔥, sem
// confete e sem contagem regressiva. Só **fade** e um **leve subir**, devagar.
// Os nomes entram UM DE CADA VEZ, com pausa entre eles — é o ritmo que faz o
// vídeo parecer respeito e não propaganda. Se alguém for mexer aqui depois:
// **animação com energia quebra o post inteiro**.
//
// 🟢 As cartas saem TODAS no mesmo verde, sem estrela e sem categoria — a mesma
// decisão que o Diego tomou pro post estático em 21/08: aqui ninguém é melhor
// que ninguém, e o post não pode parecer ranking dos mortos e dos sobreviventes.
//
// 📌 A lista sai do PRÓPRIO `data.ts` (todos os cartões com club === Chapecoense),
// igual o `mockup-chape.mjs`. Entrou gente nova no baralho? Roda de novo.
//
//   node scripts/video-chape-reels.mjs [--saida chape-reels.mp4]
import { readFileSync, writeFileSync, readdirSync, rmSync, mkdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { chromium } from 'playwright-core'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'chape-reels.mp4')
const b64 = f => readFileSync(`scripts/fonts/oswald-latin-${f}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const INK = '#0C0C0C', CREME = '#F4ECD6', VERDE = '#1B7A3D'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'
const VERDE_CARTA = 'linear-gradient(150deg,#41C07A,#2E9E5B 55%,#1E7A45)'

// ── quem é da Chape: lê do BARALHO (mesma leitura do mockup-chape.mjs) ──
const data = readFileSync('src/escalacao/data.ts', 'utf8')
const re = /\{[^{}]*?name:\s*("[^"]+"|'[^']+'),\s*club:\s*("[^"]*"|'[^']*'),\s*year:\s*(\d+),\s*fame:\s*(\d)/g
const st = s => s.slice(1, -1)
const blocos = [...data.matchAll(/const (\w+): C\[\] = \[/g)].map(m => ({ n: m[1], p: m.index }))
const blocoDe = p => { let r = ''; for (const b of blocos) { if (b.p < p) r = b.n; else break } return r }
const posDe = b => b.includes('GOL') ? 'GOL' : b.includes('LAT') ? 'LAT' : b.includes('ZAG') ? 'ZAG' : b.includes('MEI') ? 'MEI' : 'ATA'
const ORD = ['GOL', 'LAT', 'ZAG', 'MEI', 'ATA']
const cartas = [...data.matchAll(re)]
  .map(m => ({ nome: st(m[1]), club: st(m[2]), year: +m[3], fame: +m[4], pos: posDe(blocoDe(m.index)) }))
  .filter(c => c.club === 'Chapecoense')
  .sort((a, b) => ORD.indexOf(a.pos) - ORD.indexOf(b.pos) || b.fame - a.fame)
if (!cartas.length) throw new Error('nenhuma carta da Chapecoense no data.ts')
console.log(`${cartas.length} cartas: ${cartas.map(c => c.nome).join(', ')}`)

const carta = (c, atraso) => `
  <div style="width:296px;flex:none;animation:sobe .9s ease-out ${atraso.toFixed(2)}s both">
    <div style="position:relative;overflow:hidden;border:4px solid ${INK};border-radius:20px;display:flex;
                flex-direction:column;justify-content:space-between;background:${VERDE_CARTA};
                aspect-ratio:3/4.2;box-shadow:6px 7px 0 0 ${INK};padding:15px">
      <div><span style="${OSW};background:${INK};color:#fff;border:2px solid rgba(255,255,255,.25);
                        border-radius:9px;font-size:14px;padding:3px 9px">${c.pos}</span></div>
      <div style="align-self:center;width:86px;height:86px;border-radius:50%;display:flex;align-items:center;
                  justify-content:center;background:rgba(255,255,255,.35);color:#14532d;
                  border:4px solid rgba(0,0,0,.28);${OSW};font-size:36px;
                  box-shadow:inset 0 0 14px rgba(255,255,255,.6)">${c.nome.trim()[0].toUpperCase()}</div>
      <div style="text-align:center">
        <p style="${OSW};color:#fff;font-size:26px;line-height:1.12;margin:0;white-space:nowrap;
                  overflow:hidden;text-overflow:ellipsis">${c.nome}</p>
        <p style="font-weight:800;color:#fff;opacity:.7;font-size:15px;margin:4px 0 0">${c.club} · ${c.year}</p>
      </div>
    </div>
  </div>`

// ── ritmo (segundos) ──
// ⚠️ UMA CENA SÓ NA TELA POR VEZ. Cada cena leva `SAI` segundos pra sumir, e a
// próxima só começa DEPOIS disso (`fim + SAI`). Se as duas se cruzarem, o texto
// de uma aparece por cima da outra — deu fantasma no fecho na 1ª versão.
const SAI = 0.5             // quanto demora pra uma cena sumir
const T_ABRE = 0.4          // título
const T_SUB = 1.6           // a linha de apoio
const C1_FIM = 2.9

const T_CARTA0 = C1_FIM + SAI + 0.2   // 1ª carta
const PASSO = 0.6           // pausa entre uma carta e a outra — é o que dá o tom
const T_DATA = T_CARTA0 + cartas.length * PASSO + 0.5
const C2_FIM = T_DATA + 2.2

const T_TEXTO = C2_FIM + SAI + 0.1
const C3_FIM = T_TEXTO + 2.9

const T_FIM = C3_FIM + SAI
const DUR = T_FIM + 4.0

const cena = (ini, fim, html) => `
  <div class="cena" style="animation:apar .01s linear ${ini}s both, some ${SAI}s ease-in ${fim}s both">${html}</div>`

const video = `<!doctype html><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box;margin:0;padding:0}
body{width:1080px;height:1920px;background:${CREME};color:${INK};font-family:system-ui;overflow:hidden;position:relative}
.cena{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px;opacity:0}
/* 🕊️ só isto: aparecer e subir devagar. Nada de pop, treme ou bounce. */
/* ⚠️ apar só serve pra CENA (a .cena já nasce com opacity:0 no CSS). Num texto
   solto ele NAO segura nada antes da hora: keyframe só com "to" herda a
   opacidade do próprio elemento, que é 1. Foi por isso que o leilaolegends.com
   apareceu ANTES do logo. Pra texto, usar surge, que tem o from opacity 0. */
@keyframes apar{to{opacity:1}}
@keyframes surge{from{opacity:0}to{opacity:1}}
@keyframes some{to{opacity:0}}
@keyframes sobe{0%{transform:translateY(26px);opacity:0}100%{transform:translateY(0);opacity:1}}
@keyframes respira{0%,100%{opacity:.82}50%{opacity:1}}
</style><body>

  <!-- ① a homenagem -->
  ${cena(0, C1_FIM, `
    <div style="animation:sobe 1.1s ease-out ${T_ABRE}s both;text-align:center">
      <div style="display:inline-block;background:${VERDE};color:#fff;border:4px solid ${INK};border-radius:999px;
        box-shadow:5px 5px 0 ${INK};padding:10px 30px;${OSW};font-size:26px;letter-spacing:2px;text-transform:uppercase">
        💚 homenagem</div>
      <h1 style="${OSW};font-size:96px;line-height:1.04;margin:28px 0 0;text-transform:uppercase">
        A Chape está<br>no <span style="color:${VERDE}">Leilão Legends</span></h1>
    </div>
    <p style="font-size:32px;font-weight:600;line-height:1.45;margin:34px 0 0;text-align:center;max-width:860px;
              animation:sobe 1.1s ease-out ${T_SUB}s both">
      ${cartas.length} cartas do Verdão do Oeste dentro do jogo — cada um com a história dele escrita na carta.</p>`)}

  <!-- ② os nomes, um de cada vez -->
  ${cena(C1_FIM + SAI, C2_FIM, `
    <p style="${OSW};font-size:34px;text-transform:uppercase;letter-spacing:2px;color:${VERDE};margin-bottom:34px;
              animation:surge .8s ease-out ${C1_FIM + SAI + 0.1}s both">💚 os ${cartas.length} do Verdão do Oeste</p>
    <div style="display:flex;flex-wrap:wrap;gap:22px 20px;justify-content:center;max-width:960px">
      ${cartas.map((c, i) => carta(c, T_CARTA0 + i * PASSO)).join('')}
    </div>
    <p style="${OSW};font-size:36px;color:${VERDE};margin-top:46px;text-align:center;
              animation:sobe 1.2s ease-out ${T_DATA}s both">
      28 de novembro de 2016<br><span style="font-size:30px">nunca esquecemos 💚</span></p>`)}

  <!-- ③ eles jogam de verdade -->
  ${cena(C2_FIM + SAI, C3_FIM, `
    <div style="background:#fff;border:5px solid ${INK};border-radius:24px;box-shadow:7px 7px 0 ${INK};
                padding:38px 40px;max-width:900px;animation:sobe 1.1s ease-out ${T_TEXTO}s both">
      <p style="${OSW};font-size:38px;margin:0 0 18px;text-transform:uppercase;line-height:1.1">
        Eles disputam leilão como qualquer lenda</p>
      <p style="font-size:30px;font-weight:600;line-height:1.45;margin:0">
        Não é enfeite: eles entram no sorteio, você briga pra arrematar e escala eles no seu time.
        Quem pega, leva a história junto. 💚</p>
    </div>`)}

  <!-- ④ fecho -->
  ${cena(T_FIM, 600, `
    <p style="${OSW};font-size:56px;text-transform:uppercase;text-align:center;line-height:1.15;color:${VERDE};
              animation:sobe 1.1s ease-out ${T_FIM + 0.2}s both">Em breve,<br>mais deles aqui</p>
    <p style="${OSW};font-size:46px;margin-top:56px;animation:sobe 1.1s ease-out ${T_FIM + 0.9}s both">
      ⚽ Leilão <span style="color:#C2452F">Legends</span></p>
    <p style="font-size:27px;font-weight:600;opacity:.6;margin-top:12px;
              animation:surge 1.2s ease-out ${T_FIM + 1.3}s both">leilaolegends.com</p>
    <p style="font-size:42px;margin-top:44px;animation:respira 3s ease-in-out ${T_FIM + 1.6}s infinite">💚</p>`)}
</body>`

const REC = '/tmp/rec-chape-reels'
rmSync(REC, { recursive: true, force: true }); mkdirSync(REC, { recursive: true })
const vtmp = '/tmp/video-chape-reels.html'
writeFileSync(vtmp, video)

const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const ctx = await b.newContext({ viewport: { width: 1080, height: 1920 }, recordVideo: { dir: REC, size: { width: 1080, height: 1920 } } })
const vp = await ctx.newPage()
await vp.goto('file://' + vtmp)
await vp.evaluate(() => document.fonts.ready)
await vp.waitForTimeout(Math.round(DUR * 1000))
await ctx.close()
await b.close()

const webm = readdirSync(REC).find(f => f.endsWith('.webm'))
if (!webm) throw new Error('o Playwright não gravou o webm')
let FF = 'ffmpeg'
try { FF = createRequire(import.meta.url)('ffmpeg-static') } catch { /* usa o do PATH */ }
execFileSync(FF, ['-y', '-i', `${REC}/${webm}`,
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-pix_fmt', 'yuv420p',
  '-r', '30', '-movflags', '+faststart', SAIDA], { stdio: 'ignore' })
console.log(`${SAIDA} — 1080x1920 · ~${DUR.toFixed(1)}s`)
