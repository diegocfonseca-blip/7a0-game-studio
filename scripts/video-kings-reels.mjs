// ─── 🎬 REELS 1080×1920: 👑 KINGS LEAGUE — 2 VÍDEOS PRA JUNTAR NO CAPCUT (12/11) ────────────────────────────────────────
// Pedido do Diego (12/11): *"2 vídeos que eu vou juntar no CapCut… todos os jogadores da Kings League… a foto do Kelvin e o
// Lipão de lenda como exemplo… o nome de todos os presidentes, o nome dos times e dizendo como é que vai ser o modo"*.
// Mesmo molde dos outros reels (cenas em HTML + Playwright gravando + ffmpeg). Nomes, times e regras saem do CÓDIGO
// (`scripts/posts/kings-video-dados.json`, gerado do `kings-baralho.ts`/`kings-presidentes.ts`; regras = `kings.ts`).
// As cartas são da TELA DE VERDADE (bancada `scripts/teste-presidentes/video.html`), em scripts/posts/img/kings-*.png.
//
//   node scripts/video-kings-reels.mjs 1   → scripts/posts/kings-reels-1.mp4  (os times + TODOS os jogadores + as lendas)
//   node scripts/video-kings-reels.mjs 2   → scripts/posts/kings-reels-2.mp4  (os presidentes + como é o modo)
import { readFileSync, writeFileSync, readdirSync, rmSync, mkdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { chromium } from 'playwright-core'

const PARTE = process.argv[2] === '2' ? 2 : 1
const SAIDA = `scripts/posts/kings-reels-${PARTE}.mp4`
const D = JSON.parse(readFileSync('scripts/posts/kings-video-dados.json', 'utf8'))
const img = f => `data:image/png;base64,${readFileSync(`scripts/posts/img/${f}`).toString('base64')}`
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6', GREEN = '#1B7A3D', RED = '#E8503A', ROXO = '#7C3AED'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'
const luz = hex => { const n = parseInt(hex.slice(1), 16); return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) > 150 }
const cores = club => D.CORES[club] ?? ['#5A5A5A', '#2A2A2A']
const tinta = hex => luz(hex) ? INK : '#fff'
const pill = (txt, bg, cor, fs = 32) => `
  <span style="display:inline-block;background:${bg};color:${cor};border:4px solid ${INK};border-radius:999px;
    box-shadow:5px 5px 0 ${INK};padding:10px 32px;${OSW};font-size:${fs}px;letter-spacing:.06em;text-transform:uppercase">${txt}</span>`
const cena = (ini, fim, html) => `<div class="cena" style="animation:apar .01s linear ${ini}s both, some .01s linear ${fim}s both">${html}</div>`
const entra = a => `animation:entra .4s cubic-bezier(.2,1.5,.4,1) ${a}s both`
const sobe = a => `animation:sobe .45s ${a}s both`
const pop = a => `animation:pop .5s cubic-bezier(.2,1.6,.4,1) ${a}s both`
const CAT = { 5: ['👑', GOLD, 'Lenda'], 4: ['⭐', ROXO, 'Craque'], 2: ['🎯', GREEN, 'Bom jogador'], 1: ['🪖', '#7A7A7A', 'Foi profissional'] }
const coroa = `<div style="width:230px;height:230px;border-radius:50%;background:${INK};border:7px solid ${GOLD};box-shadow:10px 10px 0 ${GOLD};display:flex;align-items:center;justify-content:center;font-size:130px;animation:pop .5s cubic-bezier(.2,1.6,.4,1) .1s both, balanca 1.2s ease-in-out .7s infinite">👑</div>`
const marca = `<p style="${OSW};font-size:52px;text-transform:uppercase;margin-top:26px">⚽ Leilão <span style="color:${RED}">Legends</span></p>`

// uma cena com TODOS os jogadores de uma posição: 2 colunas, bolinha da categoria + nome + time (na cor do time)
function posicao(ini, fim, titulo, emoji, lista) {
  const ord = [...lista].sort((a, b) => b.fame - a.fame || b.hi - a.hi)
  const linhas = ord.map((c, i) => {
    const [ic, cor] = CAT[c.fame], [c1] = cores(c.club)
    return `<div style="display:flex;align-items:center;gap:12px;background:#fff;border:4px solid ${INK};border-radius:16px;box-shadow:4px 4px 0 ${INK};padding:6px 12px;${entra(ini + 0.25 + i * 0.07)}">
      <span style="width:42px;height:42px;flex:none;border-radius:50%;background:${cor};border:3px solid ${INK};display:flex;align-items:center;justify-content:center;font-size:22px">${ic}</span>
      <span style="flex:1;min-width:0;text-align:left"><b style="${OSW};font-size:31px;display:block;line-height:1.05;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${c.name}</b>
      <span style="font-size:19px;font-weight:800;color:${c1 === '#F2F2F2' || c1 === '#111111' ? '#555' : c1}">${c.club}</span></span></div>`
  }).join('')
  return cena(ini, fim, `
    <p style="${OSW};font-size:74px;text-transform:uppercase;line-height:1;margin-bottom:8px;${sobe(ini + .05)}">${emoji} ${titulo}</p>
    <p style="${OSW};font-size:34px;color:rgba(12,12,12,.55);margin-bottom:26px;${sobe(ini + .15)}">${lista.length} no baralho da Kings</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px 14px;width:1000px">${linhas}</div>`)
}
const legenda = `<div style="display:flex;gap:14px;flex-wrap:wrap;justify-content:center">${[5, 4, 2, 1].map(f => `<span style="display:flex;align-items:center;gap:8px;background:#fff;border:4px solid ${INK};border-radius:999px;padding:6px 18px 6px 8px;${OSW};font-size:28px"><span style="width:38px;height:38px;border-radius:50%;background:${CAT[f][1]};border:3px solid ${INK};display:flex;align-items:center;justify-content:center;font-size:20px">${CAT[f][0]}</span>${CAT[f][2]}</span>`).join('')}</div>`

let roteiro, DUR
if (PARTE === 1) {
  const times = [...new Set(['GOL', 'ZAG', 'MEI', 'ATA'].flatMap(k => D[k].map(c => c.club)))]
  const kings = Object.keys(D.CORES), fora = times.filter(t => !D.CORES[t]) // os 12 da Kings Brasil (o Desimpedidos Goti só tem presidente)
  const chip = (t, i, a) => { const [c1, c2] = cores(t); return `<div style="background:${c1};color:${tinta(c1)};border:5px solid ${INK};border-bottom:16px solid ${c2};border-radius:22px;box-shadow:6px 6px 0 ${INK};padding:20px 8px 14px;${OSW};font-size:36px;line-height:1.05;text-transform:uppercase;${pop(a + i * .1)}">${t}</div>` }
  DUR = 45.5
  roteiro = `
${cena(0, 4.6, `${coroa}
  <p style="${OSW};font-size:60px;text-transform:uppercase;color:rgba(12,12,12,.5);margin:46px 0 18px;${sobe(.45)}">chegou no leilão</p>
  <p style="${OSW};font-size:170px;text-transform:uppercase;line-height:.88;${pop(.75)}">kings<br><span style="color:${RED}">league</span></p>
  ${marca}
  <div style="margin-top:40px;${pop(1.6)}">${pill('os jogadores de verdade da Kings', GOLD, INK, 36)}</div>`)}

${cena(4.6, 9.8, `
  <p style="${OSW};font-size:72px;text-transform:uppercase;line-height:1;margin-bottom:34px;${sobe(4.7)}">🏟️ os times</p>
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px;width:1000px">${kings.map((t, i) => chip(t, i, 4.9)).join('')}</div>
  ${fora.length ? `<p style="${OSW};font-size:34px;margin:34px 0 14px;${sobe(6.4)}">+ os convidados de fora</p>
  <div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center;width:1000px">${fora.map((t, i) => `<span style="background:#fff;border:4px solid ${INK};border-radius:999px;padding:6px 20px;${OSW};font-size:30px;${pop(6.6 + i * .08)}">${t}</span>`).join('')}</div>` : ''}`)}

${posicao(9.8, 15.6, 'goleiros', '🧤', D.GOL)}
${posicao(15.6, 21.8, 'defensores', '🛡️', D.ZAG)}
${posicao(21.8, 28.2, 'meias', '🎯', D.MEI)}
${posicao(28.2, 34.6, 'atacantes', '⚡', D.ATA)}

${cena(34.6, 41.2, `
  <p style="${OSW};font-size:76px;text-transform:uppercase;line-height:1;${sobe(34.7)}">👑 as <span style="color:#C99700">lendas</span></p>
  <p style="${OSW};font-size:36px;color:rgba(12,12,12,.6);margin:10px 0 34px;${sobe(34.9)}">com rosto e tudo, igual às lendas do jogo</p>
  <div style="display:flex;gap:30px">
    <img src="${img('kings-kelvin.png')}" style="width:470px;${pop(35.2)}">
    <img src="${img('kings-lipao.png')}" style="width:470px;${pop(35.6)}">
  </div>
  <div style="margin-top:34px;${pop(36.4)}">${pill('Kelvin · G3X &nbsp;&nbsp; Lipão · Furia', INK, GOLD, 36)}</div>`)}

${cena(41.2, 60, `
  <p style="${OSW};font-size:60px;text-transform:uppercase;line-height:1.05;margin-bottom:30px;${sobe(41.3)}">${['GOL', 'ZAG', 'MEI', 'ATA'].reduce((n, k) => n + D[k].length, 0)} jogadores<br>em 4 categorias</p>
  <div style="${pop(41.7)}">${legenda}</div>
  <p style="${OSW};font-size:46px;margin-top:70px;text-transform:uppercase;${sobe(42.4)}">e tem mais:</p>
  <div style="margin-top:20px;${pop(42.8)}">${pill('🎩 os presidentes →', RED, '#fff', 52)}</div>
  <div style="margin-top:60px;animation:pulsa 1.4s ease-in-out 43.4s infinite">${marca}</div>`)}`
} else {
  const porTime = []
  for (const p of D.PRES) { let g = porTime.find(x => x.club === p.club); if (!g) porTime.push(g = { club: p.club, nomes: [] }); g.nomes.push(p.name) }
  const bloco = (g, i, a) => { const [c1, c2] = cores(g.club); return `<div style="background:#fff;border:5px solid ${INK};border-radius:22px;box-shadow:6px 6px 0 ${INK};overflow:hidden;text-align:left;${pop(a + i * .18)}">
    <div style="background:${c1};color:${tinta(c1)};padding:10px 20px;${OSW};font-size:36px;text-transform:uppercase;border-bottom:12px solid ${c2}">${g.club}</div>
    <div style="padding:10px 20px 14px;${OSW};font-size:34px;line-height:1.3">${g.nomes.map(n => `🎩 ${n}`).join('<br>')}</div></div>` }
  const meio = Math.ceil(porTime.length / 2)
  const grade = (lista, a) => `<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;width:1000px;align-items:start">${lista.map((g, i) => bloco(g, i, a)).join('')}</div>`
  const regra = (ic, txt, a) => `<div style="display:flex;align-items:center;gap:20px;padding:16px 26px;border-top:3px dashed #0002;${entra(a)}"><span style="font-size:52px;width:70px;text-align:center">${ic}</span><span style="font-size:36px;font-weight:800;line-height:1.25">${txt}</span></div>`
  const caixa = (html, a) => `<div style="width:980px;background:#fff;border:6px solid ${INK};border-radius:30px;box-shadow:10px 10px 0 ${INK};overflow:hidden;text-align:left;${pop(a)}">${html}</div>`
  const cab = (t, cor = INK, fg = GOLD) => `<div style="padding:18px 28px;${OSW};font-size:34px;background:${cor};color:${fg};letter-spacing:.06em">${t}</div>`
  DUR = 49.5
  roteiro = `
${cena(0, 5, `
  <div style="width:230px;height:230px;border-radius:50%;background:${RED};border:7px solid ${INK};box-shadow:10px 10px 0 ${INK};display:flex;align-items:center;justify-content:center;font-size:130px;animation:pop .5s cubic-bezier(.2,1.6,.4,1) .1s both, balanca 1.2s ease-in-out .7s infinite">🎩</div>
  <p style="${OSW};font-size:60px;text-transform:uppercase;color:rgba(12,12,12,.5);margin:46px 0 18px;${sobe(.45)}">na kings league tem</p>
  <p style="${OSW};font-size:150px;text-transform:uppercase;line-height:.9;color:${RED};${pop(.75)}">presidente</p>
  <p style="${OSW};font-size:50px;text-transform:uppercase;line-height:1.15;margin-top:30px;${sobe(1.3)}">a 5ª posição do leilão<br><span style="color:rgba(12,12,12,.55)">depois do ataque</span></p>
  <div style="margin-top:36px;${pop(1.9)}">${pill(`${D.PRES.length} presidentes · nenhum repetido`, GOLD, INK, 36)}</div>`)}

${cena(5, 12.4, `
  <p style="${OSW};font-size:64px;text-transform:uppercase;margin-bottom:30px;${sobe(5.1)}">🎩 os presidentes</p>
  ${grade(porTime.slice(0, meio), 5.3)}`)}
${cena(12.4, 19.8, `
  <p style="${OSW};font-size:64px;text-transform:uppercase;margin-bottom:30px;${sobe(12.5)}">🎩 os presidentes</p>
  ${grade(porTime.slice(meio), 12.7)}`)}

${cena(19.8, 25.6, `
  <p style="${OSW};font-size:62px;text-transform:uppercase;line-height:1.05;margin-bottom:30px;${sobe(19.9)}">a carta vem nas<br><span style="color:${RED}">cores do time</span></p>
  <div style="display:flex;gap:16px;align-items:flex-end">
    <img src="${img('kings-ludmilla.png')}" style="width:340px;transform:rotate(-5deg);${pop(20.2)}">
    <img src="${img('kings-neymar.png')}" style="width:370px;position:relative;z-index:2;${pop(20.5)}">
    <img src="${img('kings-toguro.png')}" style="width:340px;transform:rotate(5deg);${pop(20.8)}">
  </div>
  <p style="${OSW};font-size:40px;line-height:1.2;margin-top:34px;${sobe(21.5)}">todos com a <span style="color:${GREEN}">mesma força</span> 🤝<br>quem decide é o pênalti</p>`)}

${cena(25.6, 31.2, `
  <p style="${OSW};font-size:62px;text-transform:uppercase;line-height:1.05;margin-bottom:26px;${sobe(25.7)}">🎩 o pênalti<br>do <span style="color:${RED}">presidente</span></p>
  <div style="display:flex;gap:20px">
    <img src="${img('kings-penpres-a.png')}" style="width:470px;border:5px solid ${INK};border-radius:26px;box-shadow:8px 8px 0 ${INK};${pop(26.0)}">
    <img src="${img('kings-penpres-b.png')}" style="width:470px;border:5px solid ${INK};border-radius:26px;box-shadow:8px 8px 0 ${INK};${pop(27.6)}">
  </div>
  <p style="${OSW};font-size:38px;line-height:1.2;margin-top:28px;${sobe(26.4)}">1 por time em todo jogo · ele entra na arena<br>e você escolhe o canto ⚽</p>`)}

${cena(31.2, 38.0, `
  <p style="${OSW};font-size:66px;text-transform:uppercase;margin-bottom:28px;${sobe(31.3)}">👑 como é o jogo</p>
  ${caixa(`${cab('⏱️ 2 TEMPOS DE 20 MINUTOS · 7 CONTRA 7')}
    ${regra('🟡', 'a bola cai no meio: começa <b>1×1</b> e vai entrando gente até o <b>7×7</b>', 31.8)}
    ${regra('✖️2', 'do 17\' ao 20\' <b>todo gol vale 2</b>', 32.3)}
    ${regra('🎲', 'do 20\' ao 23\' o <b>dado</b> manda: 1×1, 2×2 ou 3×3', 32.8)}
    ${regra('🃏', 'no 2º tempo cada time tira uma <b>carta</b>: pênalti, shootout, suspensão, gol em dobro…', 33.3)}`, 31.6)}`)}

${cena(38.0, 44.4, `
  ${caixa(`${cab('🥅 NINGUÉM EMPATA', RED, '#fff')}
    ${regra('🥅', 'igual no fim = <b>SHOOTOUT</b>: sai do meio-campo, 1 contra o goleiro', 38.4)}
    ${regra('🏆', 'vitória <b>3</b> · no shootout <b>2</b> · derrota no shootout <b>1</b> · derrota <b>0</b>', 38.9)}`, 38.1)}
  <div style="height:30px"></div>
  ${caixa(`${cab('🔨 LEILÃO DE SEMPRE · 100 MOEDAS')}
    ${regra('👥', '<b>10 times</b> · 7 jogadores + 1 🎩 presidente', 39.6)}
    ${regra('📅', '9 rodadas · <b>1º direto na semi</b> · do 2º ao 7º nas quartas', 40.1)}
    ${regra('👑', 'tudo jogo único · <b>campeão é quem ganha a final</b>', 40.6)}`, 39.3)}`)}

${cena(44.4, 60, `
  ${coroa}
  <p style="${OSW};font-size:120px;text-transform:uppercase;line-height:.9;margin-top:40px;${pop(44.7)}">kings<br><span style="color:${RED}">league</span></p>
  <div style="margin-top:40px;${pop(45.3)}">${pill('já no ar · salas online', GOLD, INK, 44)}</div>
  <div style="margin-top:50px;animation:pulsa 1.4s ease-in-out 45.8s infinite">${marca}</div>
  <p style="font-size:32px;font-weight:700;color:rgba(12,12,12,.55);margin-top:12px">leilaolegends.com</p>`)}`
}

const video = `<!doctype html><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box;margin:0;padding:0}
body{width:1080px;height:1920px;background:${CREME};font-family:system-ui;overflow:hidden;position:relative;color:${INK}}
.cena{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:50px 40px;opacity:0;text-align:center}
@keyframes apar{to{opacity:1}}
@keyframes some{to{opacity:0}}
@keyframes pop{0%{transform:scale(.3);opacity:0}70%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}}
@keyframes entra{0%{transform:translateX(-60px);opacity:0}100%{transform:translateX(0);opacity:1}}
@keyframes sobe{0%{transform:translateY(80px);opacity:0}100%{transform:translateY(0);opacity:1}}
@keyframes pulsa{0%,100%{transform:scale(1)}50%{transform:scale(1.07)}}
@keyframes balanca{0%,100%{transform:rotate(-6deg)}50%{transform:rotate(6deg)}}
</style><body>${roteiro}</body>`

const REC = `/tmp/rec-kings-reels-${PARTE}`
rmSync(REC, { recursive: true, force: true }); mkdirSync(REC, { recursive: true })
const vtmp = `/tmp/video-kings-reels-${PARTE}.html`
writeFileSync(vtmp, video)
if (process.argv.includes('--so-html')) { console.log(vtmp); process.exit(0) }

const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const ctx = await b.newContext({ viewport: { width: 1080, height: 1920 }, recordVideo: { dir: REC, size: { width: 1080, height: 1920 } } })
const vp = await ctx.newPage()
await vp.goto('file://' + vtmp)
await vp.evaluate(() => document.fonts.ready)
await vp.waitForTimeout(DUR * 1000)
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
