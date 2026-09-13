// ─── 🎬 REELS 1080×1920: PATROCINADOR MASTER — CONTRATO DE VÁRIAS TEMPORADAS ────
// Pedido do Diego (13/09): *"quero um vídeo de mockup do novo patrocinador Master…
// no estilo que temos feito de vídeo"* — ou seja, o padrão creme animado em CSS
// (`video-condicao-reels.mjs` / `video-olheiro-reels.mjs`), NÃO gravação do jogo.
//
// Mesma técnica: as cenas são keyframes de CSS, o Playwright GRAVA A TELA em tempo
// real (webm) e o ffmpeg converte pra mp4 no formato do Instagram/WhatsApp.
//
// 🎞️ Roteiro (~24,5 s):
//   0,0–3,2   CHEGOU O PATROCINADOR MASTER (novidade da carreira)
//   3,2–8,2   os 4 contratos na mesa — cada marca, um prazo (Série C: 10 · 28 · 54 · 130)
//   8,2–12,2  quanto mais longo, mais paga por temporada — Vadico: mais grana, mais tempo
//   12,2–16,4 o valor TRAVA na divisão da assinatura — suba ou caia, continua igual
//   16,4–21,0 aparece na 1ª temporada · só volta quando o contrato acaba · CADA DIVISÃO PAGA MAIS
//             (escada da Vadico: 35 · 65 · 130 · 260 · 520) · o Pontual continua
//   21,0–24,5 já está no ar · marca
//
//   node scripts/video-master-reels.mjs [--saida master-reels.mp4]
//   (ffmpeg: `ffmpeg-static` se instalado, senão FFMPEG=/caminho/ffmpeg, senão o do PATH)
import { readFileSync, writeFileSync, readdirSync, rmSync, mkdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { chromium } from 'playwright-core'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'master-reels.mp4')
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')
// logos REAIS das marcas: o .ts do jogo faz `import logo from './img/patro-x.webp'`
// (desde 13/09 — antes era data URI colado no arquivo); aqui a gente segue o import e
// embute o arquivo. Se algum dia voltar a ser data URI, também funciona.
const logo = f => {
  const src = readFileSync(f, 'utf8')
  const d = src.match(/'(data:image\/[^']+)'/); if (d) return d[1]
  const i = src.match(/from\s+'\.\/(img\/[^']+\.(webp|png|svg))'/)
  if (!i) return ''
  const mime = i[2] === 'svg' ? 'image/svg+xml' : `image/${i[2]}`
  return `data:${mime};base64,` + readFileSync(`src/escalacao/${i[1]}`).toString('base64')
}
const L = { maxjoias: logo('src/escalacao/maxjoias.ts'), reidastintas: logo('src/escalacao/reidastintas.ts'), ero: logo('src/escalacao/ero.ts'), vadico: logo('src/escalacao/vadico.ts') }

const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6', GREEN = '#1B7A3D', RED = '#E8503A', ROXO = '#7C3AED', PAPEL = '#f6efdc'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'

// a régua do jogo (estadiodata.ts): por temporada = 🛡️ não cair × (1,25 + (anos−1)/2)
const BASE = { V: 2, D: 4, C: 8, B: 16, A: 32 }
const porTemp = (div, anos) => Math.round(BASE[div] * (1.25 + (anos - 1) / 2))
const MARCAS = [
  { id: 'maxjoias', nome: 'Max Joias', anos: 1 },
  { id: 'reidastintas', nome: 'Rei das Tintas', anos: 2 },
  { id: 'ero', nome: 'ERO Odontologia', anos: 3 },
  { id: 'vadico', nome: 'Vadico Veículos', anos: 5 },
]

const pill = (txt, bg, cor, fs = 32) => `
  <span style="display:inline-block;background:${bg};color:${cor};border:4px solid ${INK};border-radius:999px;
    box-shadow:5px 5px 0 ${INK};padding:10px 32px;${OSW};font-size:${fs}px;letter-spacing:.06em;text-transform:uppercase">${txt}</span>`

const cena = (ini, fim, html) => `
  <div class="cena" style="animation:apar .01s linear ${ini}s both, some .01s linear ${fim}s both">${html}</div>`

// 📄 o papel de contrato, igual ao do jogo (logo · marca · prazo · TOTAL · por temporada)
const papel = (m, div, atraso, w = 440, destaque = false) => {
  const pt = porTemp(div, m.anos), tot = pt * m.anos
  return `
  <div style="width:${w}px;background:${PAPEL};border:6px solid ${destaque ? ROXO : INK};outline:${destaque ? `5px solid ${ROXO}` : 'none'};outline-offset:2px;border-radius:12px;
    box-shadow:8px 8px 0 ${INK};padding:22px 18px 18px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:6px;
    animation:pop .5s cubic-bezier(.2,1.5,.4,1) ${atraso}s both">
    <div style="${OSW};font-weight:600;font-size:18px;letter-spacing:.1em;color:rgba(12,12,12,.7)">CONTRATO MASTER</div>
    <div style="height:64px;width:76%;display:flex;align-items:center;justify-content:center"><img src="${L[m.id]}" style="max-height:100%;max-width:100%;object-fit:contain"></div>
    <div style="${OSW};font-size:38px;line-height:1.05">${m.nome}</div>
    <div style="${OSW};font-size:26px;background:${INK};color:${GOLD};border-radius:10px;padding:4px 16px;margin-top:2px;text-transform:uppercase">${m.anos} temporada${m.anos > 1 ? 's' : ''}</div>
    <div style="${OSW};font-size:74px;line-height:1;margin-top:10px">${tot} 🪙</div>
    <div style="font-size:24px;font-weight:700;color:rgba(12,12,12,.6)">no total</div>
    <div style="${OSW};font-size:30px;color:${GREEN};margin-top:4px">= +${pt} por temporada</div>
  </div>`
}

// um degrau (marca → prazo → valor por temporada)
const degrau = (m, div, atraso, w = 900) => `
  <div style="display:flex;align-items:center;gap:20px;width:${w}px;animation:entra .45s cubic-bezier(.2,1.5,.4,1) ${atraso}s both">
    <span style="flex:none;width:130px;height:74px;background:#fff;border:5px solid ${INK};border-radius:14px;display:flex;align-items:center;justify-content:center;padding:8px"><img src="${L[m.id]}" style="max-height:100%;max-width:100%;object-fit:contain"></span>
    <span style="flex:none;min-width:250px;text-align:center;background:${INK};color:${GOLD};border:5px solid ${INK};border-radius:16px;box-shadow:5px 5px 0 rgba(12,12,12,.35);padding:12px 18px;${OSW};font-size:36px;text-transform:uppercase;white-space:nowrap">${m.anos} temporada${m.anos > 1 ? 's' : ''}</span>
    <span style="${OSW};font-size:52px;line-height:1;color:${m.anos === 5 ? ROXO : INK};white-space:nowrap">+${porTemp(div, m.anos)} <span style="font-size:26px;color:rgba(12,12,12,.55)">/temporada</span></span>
  </div>`

// a ficha de divisão (pra cena do congelamento)
const divChip = (rot, cor, corTxt, atraso) => `
  <div style="animation:pop .45s cubic-bezier(.2,1.5,.4,1) ${atraso}s both;background:${cor};color:${corTxt};border:5px solid ${INK};border-radius:18px;box-shadow:6px 6px 0 ${INK};padding:18px 26px;text-align:center;min-width:250px">
    <div style="${OSW};font-size:40px;text-transform:uppercase;line-height:1">${rot}</div></div>`

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
@keyframes carimbo{0%{transform:rotate(-9deg) scale(2.2);opacity:0}60%{transform:rotate(-9deg) scale(.95);opacity:1}100%{transform:rotate(-9deg) scale(1);opacity:1}}
@keyframes enche{from{width:0}to{width:100%}}
</style><body>

<!-- ① abertura -->
${cena(0, 3.2, `
  <p style="font-size:150px;line-height:1;margin-bottom:26px;animation:pop .6s cubic-bezier(.2,1.6,.4,1) .15s both">🏆</p>
  <p style="${OSW};font-size:120px;text-transform:uppercase;text-align:center;line-height:.98;animation:sobe .5s .4s both">
    chegou o<br><span style="color:${ROXO}">patrocinador master</span></p>
  <p style="font-size:44px;font-weight:700;color:rgba(12,12,12,.62);margin-top:40px;text-align:center;line-height:1.35;
    animation:sobe .5s 1.1s both">contrato de várias temporadas · dinheiro garantido</p>
  <div style="margin-top:38px;animation:pop .5s cubic-bezier(.2,1.6,.4,1) 1.6s both">${pill('novidade no modo carreira', '#fff', INK, 36)}</div>`)}

<!-- ② os 4 contratos na mesa -->
${cena(3.2, 8.2, `
  <p style="${OSW};font-size:60px;text-transform:uppercase;text-align:center;line-height:1.1;margin-bottom:30px;
    animation:sobe .45s 3.35s both">quatro contratos na mesa —<br><span style="color:${ROXO}">cada marca, um prazo</span></p>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:26px">
    ${papel(MARCAS[0], 'C', 3.7)}${papel(MARCAS[1], 'C', 4.1)}
    ${papel(MARCAS[2], 'C', 4.5)}${papel(MARCAS[3], 'C', 4.9, 440, true)}
  </div>
  <p style="font-size:34px;font-weight:800;color:rgba(12,12,12,.6);margin-top:34px;text-align:center;line-height:1.3;
    animation:sobe .45s 5.8s both">exemplo na <b>Série C</b> · aparecem os quatro de uma vez · você escolhe um</p>
  <div style="margin-top:22px;animation:pop .45s cubic-bezier(.2,1.5,.4,1) 6.6s both">${pill('só marcas reais do jogo', '#fff', INK, 30)}</div>`)}

<!-- ③ quanto mais longo, mais paga -->
${cena(8.2, 12.2, `
  <p style="font-size:120px;line-height:1;animation:pop .55s cubic-bezier(.2,1.6,.4,1) 8.35s both">💰</p>
  <p style="${OSW};font-size:84px;text-transform:uppercase;text-align:center;line-height:1;margin:14px 0 40px;
    animation:sobe .45s 8.6s both">quanto mais longo,<br><span style="color:${GREEN}">mais paga por temporada</span></p>
  <div style="display:flex;flex-direction:column;gap:22px">
    ${degrau(MARCAS[0], 'C', 9.0)}${degrau(MARCAS[1], 'C', 9.4)}${degrau(MARCAS[2], 'C', 9.8)}${degrau(MARCAS[3], 'C', 10.2)}
  </div>
  <div style="margin-top:46px;animation:pop .5s cubic-bezier(.2,1.6,.4,1) 10.9s both">${pill('Vadico Veículos: mais grana, mais tempo', ROXO, '#fff', 34)}</div>
  <p style="font-size:34px;font-weight:800;color:rgba(12,12,12,.6);margin-top:30px;text-align:center;line-height:1.3;
    animation:sobe .45s 11.3s both">dobra a cada divisão que você sobe</p>`)}

<!-- ④ o valor trava na divisão da assinatura -->
${cena(12.2, 16.4, `
  <p style="font-size:120px;line-height:1;animation:pop .55s cubic-bezier(.2,1.6,.4,1) 12.35s both">🔒</p>
  <p style="${OSW};font-size:84px;text-transform:uppercase;text-align:center;line-height:1;margin:14px 0 14px;
    animation:sobe .45s 12.6s both">o valor <span style="color:${RED}">trava</span><br>onde você assinou</p>
  <p style="font-size:38px;font-weight:800;color:rgba(12,12,12,.65);margin-bottom:44px;text-align:center;animation:sobe .45s 12.9s both">
    assinou a Vadico na Várzea: <b>+${porTemp('V', 5)} por temporada</b>, por 5 temporadas</p>
  <div style="display:flex;align-items:center;gap:22px">
    ${divChip('🌱 Várzea', '#fff', INK, 13.3)}
    <span style="${OSW};font-size:60px;animation:pop .4s 13.7s both">→</span>
    ${divChip('Série D', '#fff', INK, 13.9)}
    <span style="${OSW};font-size:60px;animation:pop .4s 14.3s both">→</span>
    ${divChip('Série C', '#fff', INK, 14.5)}
  </div>
  <div style="margin-top:36px;display:flex;gap:22px">
    <div style="animation:pop .45s cubic-bezier(.2,1.5,.4,1) 13.5s both">${pill(`+${porTemp('V', 5)}`, GREEN, '#fff', 44)}</div>
    <div style="animation:pop .45s cubic-bezier(.2,1.5,.4,1) 14.1s both">${pill(`+${porTemp('V', 5)}`, GREEN, '#fff', 44)}</div>
    <div style="animation:pop .45s cubic-bezier(.2,1.5,.4,1) 14.7s both">${pill(`+${porTemp('V', 5)}`, GREEN, '#fff', 44)}</div>
  </div>
  <p style="${OSW};font-size:56px;text-transform:uppercase;text-align:center;margin-top:50px;line-height:1.15;animation:sobe .45s 15.2s both">
    subiu? continua igual.<br>caiu? <span style="color:${GREEN}">também</span> — é o seu colchão</p>`)}

<!-- ⑤ quando aparece · cada divisão, um contrato novo paga mais · o Pontual continua -->
${cena(16.4, 21.0, `
  <p style="${OSW};font-size:62px;text-transform:uppercase;text-align:center;line-height:1.1;margin-bottom:26px;
    animation:sobe .45s 16.55s both">aparece na <span style="color:${ROXO}">1ª temporada</span><br>e só volta quando o contrato acaba</p>
  <div style="display:flex;gap:14px;width:900px;animation:sobe .45s 16.9s both">
    ${[0, 1, 2, 3, 4].map(i => `<div style="flex:1;height:40px;border:5px solid ${INK};border-radius:12px;background:#e9dfbe;overflow:hidden"><div style="height:100%;background:${GOLD};width:0;animation:enche .3s ease-out ${17.1 + i * .25}s both"></div></div>`).join('')}
  </div>
  <p style="${OSW};font-size:56px;text-transform:uppercase;text-align:center;line-height:1.1;margin:40px 0 24px;animation:sobe .45s 18.2s both">
    acabou? chegam contratos novos —<br><span style="color:${GREEN}">e cada divisão paga mais</span></p>
  <div style="display:flex;flex-direction:column;gap:14px;width:900px">
    ${[['🌱 Várzea', 'V'], ['Série D', 'D'], ['Série C', 'C'], ['Série B', 'B'], ['Série A', 'A']].map(([rot, d], i) => `
      <div style="display:flex;align-items:center;gap:18px;animation:entra .4s cubic-bezier(.2,1.5,.4,1) ${18.6 + i * .28}s both">
        <span style="flex:none;width:230px;text-align:center;background:#fff;border:5px solid ${INK};border-radius:14px;box-shadow:4px 4px 0 ${INK};padding:10px 14px;${OSW};font-size:34px;text-transform:uppercase">${rot}</span>
        <div style="flex:1;height:46px;border:5px solid ${INK};border-radius:12px;background:#e9dfbe;overflow:hidden"><div style="height:100%;width:${Math.round(porTemp(d, 5) * 5 / 5.2)}%;background:${d === 'A' ? ROXO : GREEN}"></div></div>
        <span style="flex:none;width:250px;${OSW};font-size:40px;text-align:right;white-space:nowrap">${porTemp(d, 5) * 5} 🪙 <span style="font-size:22px;color:rgba(12,12,12,.55)">/5 temps</span></span>
      </div>`).join('')}
  </div>
  <p style="font-size:32px;font-weight:800;color:rgba(12,12,12,.6);margin-top:26px;text-align:center;line-height:1.3;animation:sobe .45s 20.2s both">
    exemplo: a Vadico (5 temporadas) em cada divisão · o 🤝 patrocínio de aposta continua — agora é o <b>Patrocinador Pontual</b></p>`)}

<!-- ⑥ já está no ar + marca -->
${cena(21.0, 32, `
  <div style="position:relative;animation:pop .55s cubic-bezier(.2,1.6,.4,1) 21.15s both">
    <div style="width:900px;background:#160e08;color:${CREME};border:6px solid ${INK};border-radius:26px;box-shadow:8px 8px 0 ${INK};padding:28px 32px;text-align:left">
      <div style="${OSW};font-weight:600;font-size:24px;letter-spacing:.1em;color:${GOLD}">🏆 PATROCINADOR MASTER · SÉRIE C</div>
      <div style="display:flex;align-items:center;justify-content:space-between;gap:20px;margin-top:10px">
        <div style="display:flex;align-items:center;gap:14px;min-width:0"><span style="background:#fff;border-radius:10px;padding:6px 10px;display:inline-flex;flex:none"><img src="${L.vadico}" style="height:40px"></span><span style="${OSW};font-size:40px;white-space:nowrap">Vadico Veículos</span></div>
        <div style="text-align:right;flex:none;white-space:nowrap"><div style="${OSW};font-size:56px;line-height:1;color:${GOLD}">+${porTemp('C', 5)} 🪙</div><div style="font-size:22px;font-weight:700;opacity:.75">por temporada · ${porTemp('C', 5) * 5} no total</div></div>
      </div>
      <div style="display:flex;gap:10px;margin:22px 0 12px">${[1, 0, 0, 0, 0].map(on => `<div style="flex:1;height:20px;border:4px solid ${GOLD};border-radius:8px;background:${on ? GOLD : 'transparent'}"></div>`).join('')}</div>
      <div style="font-size:28px;font-weight:700">Temporada <b>1</b> de <b>5</b> do contrato · faltam <b>4</b></div>
    </div>
    <span style="position:absolute;top:-30px;right:26px;${OSW};font-size:40px;color:#C2452F;border:6px solid #C2452F;border-radius:14px;padding:6px 22px;background:rgba(255,255,255,.92);letter-spacing:.08em;
      animation:carimbo .5s cubic-bezier(.2,1.4,.4,1) 21.8s both">ASSINADO</span>
  </div>
  <div style="margin-top:46px;animation:pop .5s cubic-bezier(.2,1.6,.4,1) 22.4s both">${pill('já está no ar', GOLD, INK, 40)}</div>
  <p style="${OSW};font-size:60px;margin-top:56px;text-transform:uppercase;animation:pulsa 1.4s ease-in-out 22.9s infinite">
    ⚽ Leilão <span style="color:${RED}">Legends</span></p>
  <p style="font-size:32px;font-weight:700;color:rgba(12,12,12,.55);margin-top:12px">leilaolegends.com</p>`)}
</body>`

// ── grava e converte ───────────────────────────────────────────────────────
const REC = '/tmp/rec-master-reels'
rmSync(REC, { recursive: true, force: true }); mkdirSync(REC, { recursive: true })
const vtmp = '/tmp/video-master-reels.html'
writeFileSync(vtmp, video)

const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const ctx = await b.newContext({ viewport: { width: 1080, height: 1920 }, recordVideo: { dir: REC, size: { width: 1080, height: 1920 } } })
const vp = await ctx.newPage()
await vp.goto('file://' + vtmp)
await vp.evaluate(() => document.fonts.ready)
await vp.waitForTimeout(24800)
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
