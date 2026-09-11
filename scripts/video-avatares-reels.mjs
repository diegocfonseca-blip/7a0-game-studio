// ─── 🎬 REELS 1080×1920 EM PARTES: OS AVATARES DAS LENDAS ────────────────────
// Pedido do Diego (10/09): *"vc viu q o codex fez q agora tem avatares dentro do
// jogo… quero q faça um vídeo mostrando isso com detalhes e locais q aparece.
// Faça em dois vídeos divididos"*, depois: *"lembrando q de início começaremos
// com as lendas"*, *"mostre como ficou real também, se possível com famosos
// conhecidos"* e *"mantém o estilo dos últimos vídeos, vê se é melhor dois ou
// três, eu junto depois"*.
//
// Mesma técnica dos outros reels (`video-apresentacao-partes.mjs`): cenas em
// keyframes de CSS, Playwright GRAVA a tela (webm), ffmpeg converte pra mp4.
// Sem voz — tudo legenda na tela.
//
// São 3 PARTES, cada uma um mp4 separado (ele cola no CapCut na ordem):
//   parte 1 (~25 s)  quem são: 156 LENDAS com arte própria, camisa do clube
//                    E DO ANO, rosto vazio de propósito
//   parte 2 (~29 s)  no LEILÃO: envelope cego não mostra nada, a arte só nasce
//                    DEPOIS do martelo, e a carta de Lenda vem dourada
//   parte 3 (~29 s)  DEPOIS: o campinho inteiro, o elenco no celular e o time
//                    dos sonhos montado
//
// 📸 Os prints das partes 2 e 3 são do JOGO DE VERDADE, guardados em
// `scripts/prints-avatares/`: os do pregão saíram de uma partida rodada aqui
// com a prévia ligada, e os três do time montado (campinho, celular no
// leilaolegends.com e o time dos sonhos) foram mandados pelo PRÓPRIO DIEGO,
// da conta dele. Ficam AQUI e não em `src/escalacao/img/` de propósito: são do
// VÍDEO, não do jogo — não entram no bundle nem contam no teto de peso.
//
// ✅ Conferido no código antes de escrever qualquer número (10/09):
//    156 arquivos em `public/avatars/lendas-v1/` (check-legend-avatars.mjs),
//    cada um ≤ 60 KB, carregados com loading="lazy" (avatar-lote1.tsx) — ou
//    seja, o jogador só baixa o rosto que aparece na tela dele.
//    A arte é casada por NOME + CLUBE + ANO (legend-avatars.ts): errou o ano,
//    não vem rosto nenhum — é por isso que dá pra ter o mesmo craque em duas
//    épocas com camisas diferentes.
//    Rosto vazio é REGRA, não falha: `docs/prompt-retrato-lenda.md` ("ROSTO
//    TOTALMENTE VAZIO: sem olhos, sem boca, sem nariz") — a gente não inventa
//    a cara de ninguém.
//
//   node scripts/video-avatares-reels.mjs [--so 2] [--pasta /tmp/avatares]
import { readFileSync, writeFileSync, readdirSync, rmSync, mkdirSync, existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { chromium } from 'playwright-core'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const PASTA = arg('--pasta', '/tmp/avatares')
const SO = arg('--so', '')
mkdirSync(PASTA, { recursive: true })

const b64 = p => readFileSync(p).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(`scripts/fonts/oswald-latin-${w}-normal.woff2`)}) format('woff2');font-weight:${w};font-display:block}`).join('')
const img = p => `data:image/webp;base64,${b64(p)}`
const png = p => `data:image/png;base64,${b64(p)}`

const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6', GREEN = '#1B7A3D', RED = '#E8503A', ROXO = '#7C3AED'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'

// ── peças reutilizadas (as mesmas dos outros reels) ────────────────────────
const pill = (txt, bg, cor, fs = 32, atraso = 0) => `
  <span style="display:inline-block;background:${bg};color:${cor};border:4px solid ${INK};border-radius:999px;
    box-shadow:5px 5px 0 ${INK};padding:10px 32px;${OSW};font-size:${fs}px;letter-spacing:.06em;text-transform:uppercase;
    animation:pop .5s cubic-bezier(.2,1.6,.4,1) ${atraso}s both">${txt}</span>`
const cena = (ini, fim, html) => `
  <div class="cena" style="animation:apar .01s linear ${ini}s both, some .01s linear ${fim}s both">${html}</div>`
const titulo = (html, atraso, fs = 72) => `
  <p style="${OSW};font-size:${fs}px;text-transform:uppercase;text-align:center;line-height:1.05;animation:sobe .5s ${atraso}s both">${html}</p>`
const sub = (html, atraso, fs = 40) => `
  <p style="font-size:${fs}px;font-weight:700;color:rgba(12,12,12,.62);margin-top:28px;text-align:center;line-height:1.35;animation:sobe .5s ${atraso}s both">${html}</p>`
const grande = (txt, atraso, cor = RED, fs = 170) => `
  <p style="${OSW};font-size:${fs}px;text-transform:uppercase;line-height:1;margin:14px 0;color:${cor};
    animation:pop .55s cubic-bezier(.2,1.6,.4,1) ${atraso}s both">${txt}</p>`

// ── o retrato da lenda, do jeito que o jogo desenha ────────────────────────
const AV = 'public/avatars/lendas-v1/'
// moldura creme com borda preta grossa: é a carta do jogo, em tamanho de reels
const retrato = (arquivo, nome, ficha, atraso, largura = 300, cor = CREME) => `
  <div style="width:${largura}px;animation:pop .5s cubic-bezier(.2,1.6,.4,1) ${atraso}s both">
    <div style="background:${cor};border:5px solid ${INK};border-radius:20px;box-shadow:6px 6px 0 ${INK};overflow:hidden">
      <img src="${img(AV + arquivo)}" style="width:100%;display:block">
    </div>
    <p style="${OSW};font-size:${Math.round(largura / 10)}px;text-transform:uppercase;text-align:center;margin:12px 0 0;line-height:1">${nome}</p>
    <p style="font-size:${Math.round(largura / 13)}px;font-weight:700;color:rgba(12,12,12,.55);text-align:center;margin:4px 0 0">${ficha}</p>
  </div>`
// print do jogo de verdade, dentro de uma "telinha" de celular
const PRINT = 'scripts/prints-avatares/'
const telinha = (arquivo, atraso, largura = 780) => existsSync(PRINT + arquivo) ? `
  <div style="width:${largura}px;border:6px solid ${INK};border-radius:26px;box-shadow:8px 8px 0 ${INK};overflow:hidden;background:${CREME};
    animation:entra .55s cubic-bezier(.2,1.5,.4,1) ${atraso}s both">
    <img src="${png(PRINT + arquivo)}" style="width:100%;display:block">
  </div>` : `<p style="${OSW};font-size:40px;color:${RED}">falta o print ${arquivo}</p>`

const pagina = (corpo) => `<!doctype html><meta charset="utf-8"><style>${FONTES}
  html,body{margin:0;width:1080px;height:1920px;overflow:hidden;background:${CREME};color:${INK};font-family:Oswald,sans-serif}
  .cena{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:90px 70px;opacity:0;box-sizing:border-box}
  .cena>*{animation-fill-mode:both}
  @keyframes apar{to{opacity:1}} @keyframes some{to{opacity:0}}
  @keyframes pop{0%{transform:scale(.3);opacity:0}70%{transform:scale(1.12)}100%{transform:scale(1);opacity:1}}
  @keyframes entra{0%{transform:translateX(-70px);opacity:0}100%{transform:translateX(0);opacity:1}}
  @keyframes sobe{0%{transform:translateY(90px);opacity:0}100%{transform:translateY(0);opacity:1}}
  @keyframes pulsa{0%,100%{transform:scale(1)}50%{transform:scale(1.07)}}
  @keyframes martelo{0%{transform:rotate(-40deg)}60%{transform:rotate(18deg)}100%{transform:rotate(0)}}
  .marca{position:absolute;bottom:70px;left:0;right:0;text-align:center;${OSW};font-size:40px;color:rgba(12,12,12,.5);text-transform:uppercase}
</style><body>${corpo}
<div class="marca">⚽ Leilão <span style="color:${RED}">Legends</span> · leilaolegends.com</div>
</body>`

// ─── PARTE 1 · quem são ────────────────────────────────────────────────────
const parte1 = { dur: 25.5, html: `
${cena(0, 5.8, `
  <div style="margin-bottom:26px">${pill('novidade 🔨', GOLD, INK, 36, 0.15)}</div>
  ${titulo('as lendas agora<br>têm <span style="color:' + RED + '">arte própria</span>', 0.6, 84)}
  ${sub('não é foto, não é boneco genérico:<br>é um desenho pra cada uma', 1.5)}
  <div style="margin-top:34px">${grande('156', 2.4, GREEN, 220)}</div>
  ${sub('lendas desenhadas — o começo é por elas', 3.1, 38)}`)}
${cena(5.8, 12.4, `
  ${titulo('gente que você conhece', 5.95, 66)}
  <div style="display:flex;gap:26px;margin-top:34px">
    ${retrato('pele-santos-1962.webp', 'Pelé', 'Santos · 1962', 6.5, 290)}
    ${retrato('diego-maradona-napoli-1987.webp', 'Maradona', 'Napoli · 1987', 6.8, 290)}
    ${retrato('ronaldinho-gaucho-barcelona-2005.webp', 'Ronaldinho', 'Barcelona · 2005', 7.1, 290)}
  </div>
  <div style="display:flex;gap:26px;margin-top:30px">
    ${retrato('zinedine-zidane-juventus-1998.webp', 'Zidane', 'Juventus · 1998', 7.5, 290)}
    ${retrato('cristiano-ronaldo-real-madrid-2014.webp', 'Cristiano', 'Real Madrid · 2014', 7.8, 290)}
    ${retrato('lionel-messi-barcelona-2012.webp', 'Messi', 'Barcelona · 2012', 8.1, 290)}
  </div>
  ${sub('e também Zico, Sócrates, Garrincha,<br>Romário, Yashin, Cruyff, Maldini…', 9.0, 38)}`)}
${cena(12.4, 19.0, `
  ${titulo('a camisa é a<br>daquele <span style="color:' + ROXO + '">ano</span>', 12.55, 76)}
  ${sub('o mesmo craque muda de arte<br>quando muda de época', 13.2, 38)}
  <div style="display:flex;gap:40px;margin-top:34px;align-items:flex-start">
    ${retrato('neymar-santos-2011.webp', 'Neymar', 'Santos · 2011', 14.0, 330)}
    ${retrato('neymar-barcelona-2015.webp', 'Neymar', 'Barcelona · 2015', 14.4, 330)}
  </div>
  <div style="display:flex;gap:40px;margin-top:26px;align-items:flex-start">
    ${retrato('romario-barcelona-1994.webp', 'Romário', 'Barcelona · 1994', 15.2, 330)}
    ${retrato('romario-vasco-2000.webp', 'Romário', 'Vasco · 2000', 15.6, 330)}
  </div>`)}
${cena(19.0, 25.5, `
  ${titulo('e o rosto é vazio<br><span style="color:' + GREEN + '">de propósito</span>', 19.15, 74)}
  <div style="display:flex;gap:30px;margin-top:30px">
    ${retrato('zico-flamengo-1981.webp', 'Zico', 'Flamengo · 1981', 19.9, 300)}
    ${retrato('socrates-corinthians-1983.webp', 'Sócrates', 'Corinthians · 1983', 20.2, 300)}
    ${retrato('garrincha-botafogo-1958.webp', 'Garrincha', 'Botafogo · 1958', 20.5, 300)}
  </div>
  ${sub('a gente <b>não inventa a cara</b> de ninguém.<br>é o cabelo, a barba e a camisa da época —<br>o resto fica por sua conta', 21.4, 40)}`)}
` }

// ─── PARTE 2 · no leilão ───────────────────────────────────────────────────
const parte2 = { dur: 29.0, html: `
${cena(0, 8.0, `
  <div style="margin-bottom:22px">${pill('lugar 1 · o pregão 🔨', INK, GOLD, 34, 0.15)}</div>
  ${titulo('no envelope,<br>ninguém vê nada', 0.6, 76)}
  ${telinha('01-lista-cega.png', 1.4, 760)}
  ${sub('na hora do lance você lê só<br><b>nome · clube · ano</b> — igual a antes', 3.4, 38)}`)}
${cena(8.0, 16.4, `
  <p style="font-size:140px;line-height:1;animation:martelo .5s ease-out 8.2s both">🔨</p>
  ${titulo('bateu o martelo,<br>a carta abre', 8.7, 68)}
  ${telinha('02-revelacao.png', 9.4, 800)}
  ${sub('quem levou, por quanto…<br><b>e a lenda desenhada</b>', 12.0, 38)}`)}
${cena(16.4, 22.4, `
  ${titulo('e a carta é sua', 16.55, 72)}
  ${telinha('04-carta.png', 17.2, 520)}
  ${sub('lenda vem <b>dourada</b>, com as 5 estrelas', 19.6, 38)}`)}
${cena(22.4, 29.0, `
  ${titulo('nada vaza antes', 22.55, 74)}
  ${sub('carta escondida, jogador surpresa e<br>lote que ninguém quis <b>continuam cegos</b>.<br><br>a arte só nasce quando o martelo bate —<br>o pregão segue às cegas do mesmo jeito.', 23.4, 42)}
  <div style="margin-top:40px">${pill('o leilão não mudou 🔒', GREEN, '#fff', 36, 25.4)}</div>`)}
` }

// ─── PARTE 3 · onde ele aparece depois ─────────────────────────────────────
const parte3 = { dur: 29.0, html: `
${cena(0, 8.2, `
  <div style="margin-bottom:22px">${pill('lugar 2 · o seu time ⚽', INK, GOLD, 34, 0.15)}</div>
  ${titulo('o time inteiro<br>ganha cara', 0.6, 74)}
  ${telinha('03-campinho.png', 1.4, 860)}
  ${sub('cada um na posição, com a camisa<br>do clube e do ano que você comprou', 3.8, 38)}`)}
${cena(8.2, 15.6, `
  ${titulo('no <span style="color:' + GOLD + '">elenco</span>,<br>no celular', 8.35, 74)}
  ${telinha('06-celular.png', 9.1, 480)}
  ${sub('do jeito que a galera joga de verdade', 12.0, 38)}`)}
${cena(15.6, 22.2, `
  ${titulo('dá pra montar<br>o time dos sonhos', 15.75, 68)}
  ${telinha('05-campinho2.png', 16.5, 860)}
  ${sub('Maradona, Yashin, Cruyff, Kaká,<br>Roberto Carlos, Gerrard…', 18.8, 38)}`)}
${cena(22.2, 25.4, `
  ${titulo('e não pesa', 22.35, 78)}
  ${sub('cada retrato tem <b>menos de 60 KB</b> e só<br>baixa quando aparece na SUA tela.<br>quem nunca cruzar com a lenda,<br>nunca baixa o desenho dela.', 22.9, 42)}`)}
${cena(25.4, 29.0, `
  <p style="font-size:130px;line-height:1;animation:pop .6s cubic-bezier(.2,1.6,.4,1) 25.55s both">⚽</p>
  <p style="${OSW};font-size:92px;text-transform:uppercase;margin-top:10px;animation:pulsa 1.4s ease-in-out 26.2s infinite">
    Leilão <span style="color:${RED}">Legends</span></p>
  ${sub('grátis · no navegador · chama a turma', 26.4, 44)}
  <div style="margin-top:30px">${pill('leilaolegends.com', INK, GOLD, 40, 27.0)}</div>`)}
` }

// ─── grava cada parte ──────────────────────────────────────────────────────
const PARTES = [parte1, parte2, parte3]
let FF = 'ffmpeg'
try { FF = createRequire(import.meta.url)('ffmpeg-static') } catch { /* usa o do PATH */ }

const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] })
for (let i = 0; i < PARTES.length; i++) {
  const n = i + 1
  if (SO && String(n) !== SO) continue
  const { dur, html } = PARTES[i]
  const REC = `${PASTA}/rec-${n}`
  rmSync(REC, { recursive: true, force: true }); mkdirSync(REC, { recursive: true })
  const htmlPath = `${PASTA}/parte-${n}.html`
  writeFileSync(htmlPath, pagina(html))
  const ctx = await b.newContext({ viewport: { width: 1080, height: 1920 }, recordVideo: { dir: REC, size: { width: 1080, height: 1920 } } })
  const vp = await ctx.newPage()
  await vp.goto('file://' + htmlPath)
  await vp.evaluate(() => document.fonts.ready)
  await vp.waitForTimeout(Math.round(dur * 1000) + 400)
  await ctx.close()
  const webm = readdirSync(REC).find(f => f.endsWith('.webm'))
  if (!webm) throw new Error(`parte ${n}: o Playwright não gravou o webm`)
  const saida = `${PASTA}/avatares-parte${n}.mp4`
  execFileSync(FF, ['-y', '-i', `${REC}/${webm}`, '-t', String(dur),
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-pix_fmt', 'yuv420p',
    '-r', '30', '-movflags', '+faststart', saida], { stdio: 'ignore' })
  console.log(`parte ${n}: ${saida} (${dur}s)`)
}
await b.close()
