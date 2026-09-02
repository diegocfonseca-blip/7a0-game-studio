// ─── 🎬 REELS 1080×1920 EM PARTES: O JOGO EXPLICADO ──────────────────────────
// Pedido do Diego (02/09): *"um vídeo falando do jogo, explicando o jogo, nos
// mesmos padrões dos últimos vídeos… o mais longo possível… fale que é
// inspirado no Brasfoot, que dá pra jogar com até 20 amigos online e que no
// modo carreira você inicia da várzea até a Série A… fale do leilão… faça em
// partes e eu colo no CapCut"*.
//
// Mesma técnica dos outros reels (`video-copa-online-reels.mjs`): cenas em
// keyframes de CSS, Playwright GRAVA a tela (webm), ffmpeg converte pra mp4.
// Sem voz — igual aos anteriores, tudo é legenda na tela.
//
// São 5 PARTES, cada uma um mp4 separado (o Playwright grava uma página por
// vez; partes curtas ficam mais leves e ele cola no CapCut na ordem):
//   parte 1 (~22 s)  o que é: inspirado no Brasfoot, mas com a turma · o leilão
//   parte 2 (~24 s)  o LEILÃO por dentro: envelope, 45 s, blefe, martelo, QUASE!
//   parte 3 (~24 s)  ONLINE: até 20 amigos, sala por código, liga + Libertadores + Copa
//   parte 4 (~26 s)  CARREIRA: da Várzea até a Série A, 38 rodadas, as copas
//   parte 5 (~22 s)  o clube é SEU: batismo (escudo, mascote, manto) · marca · site
//
// ✅ Todo número aqui foi conferido no código antes (02/09): MAX_PLAYERS = 20
// (lobby.tsx), escada V→D→C→B→A (pyramidseason.tsx), 38 rodadas (pyramid.tsx),
// envelope 45 s (ENVELOPE_MS, store.tsx), Copa do Brasil/Supercopa/Copa do
// Mundo na carreira, Liga + Libertadores no online. Não inventar número novo
// sem conferir de novo.
//
//   node scripts/video-apresentacao-partes.mjs [--so 3] [--pasta /tmp/apres]
import { readFileSync, writeFileSync, readdirSync, rmSync, mkdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { chromium } from 'playwright-core'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const PASTA = arg('--pasta', '/tmp/apresentacao')
const SO = arg('--so', '')
mkdirSync(PASTA, { recursive: true })

const b64 = p => readFileSync(p).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(`scripts/fonts/oswald-latin-${w}-normal.woff2`)}) format('woff2');font-weight:${w};font-display:block}`).join('')
const img = p => `data:image/webp;base64,${b64(p)}`

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
const cartao = (html, atraso, largura = 860) => `
  <div style="background:#fff;border:5px solid ${INK};border-radius:22px;box-shadow:7px 7px 0 ${INK};padding:22px 28px;width:${largura}px;
    animation:entra .5s cubic-bezier(.2,1.5,.4,1) ${atraso}s both">${html}</div>`
const linha = (esq, dir, atraso, cor = GREEN) => cartao(`
  <div style="display:flex;align-items:center;justify-content:space-between;gap:20px">
    <span style="${OSW};font-size:48px">${esq}</span>
    <span style="${OSW};font-size:44px;color:${cor}">${dir}</span></div>`, atraso)

// arte REAL do jogo (os mesmos .webp que o jogador vê)
const ESC = {
  neymarzetti: img('src/escalacao/img/neymarzetti-escudo.webp'),
  nata: img('src/escalacao/img/nata-escudo.webp'),
  papao: img('src/escalacao/img/papao-escudo.webp'),
  takhadao: img('src/escalacao/img/al-takahdao-escudo.webp'),
}
const MASC = {
  takhadao: img('src/escalacao/img/al-takahdao-mascote.webp'),
  nata: img('src/escalacao/img/nata-mascote.webp'),
}

const pagina = (corpo, dur) => `<!doctype html><meta charset="utf-8"><style>${FONTES}
  html,body{margin:0;width:1080px;height:1920px;overflow:hidden;background:${CREME};color:${INK};font-family:Oswald,sans-serif}
  .cena{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:90px 70px;opacity:0;box-sizing:border-box}
  .cena>*{animation-fill-mode:both}
  @keyframes apar{to{opacity:1}} @keyframes some{to{opacity:0}}
  @keyframes pop{0%{transform:scale(.3);opacity:0}70%{transform:scale(1.12)}100%{transform:scale(1);opacity:1}}
  @keyframes entra{0%{transform:translateX(-70px);opacity:0}100%{transform:translateX(0);opacity:1}}
  @keyframes sobe{0%{transform:translateY(90px);opacity:0}100%{transform:translateY(0);opacity:1}}
  @keyframes pulsa{0%,100%{transform:scale(1)}50%{transform:scale(1.07)}}
  @keyframes martelo{0%{transform:rotate(-40deg)}60%{transform:rotate(18deg)}100%{transform:rotate(0)}}
  @keyframes conta{from{width:100%}to{width:0}}
  @keyframes sobeDegrau{0%{transform:translateY(40px);opacity:0}100%{transform:translateY(0);opacity:1}}
  .marca{position:absolute;bottom:70px;left:0;right:0;text-align:center;${OSW};font-size:40px;color:rgba(12,12,12,.5);text-transform:uppercase}
</style><body>${corpo}
<div class="marca">⚽ Leilão <span style="color:${RED}">Legends</span> · leilaolegends.com</div>
</body>`

// ─── PARTE 1 · o que é ─────────────────────────────────────────────────────
const parte1 = { dur: 22.5, html: `
${cena(0, 5.6, `
  <p style="font-size:150px;line-height:1;animation:pop .6s cubic-bezier(.2,1.6,.4,1) .15s both">🎮</p>
  ${sub('lembra do', 0.7, 48)}
  ${grande('BRASFOOT?', 1.05, INK, 150)}
  ${sub('aquele de montar time e<br>dirigir o clube sozinho, no PC', 1.7)}`)}
${cena(5.6, 11.4, `
  ${titulo('o Leilão <span style="color:' + RED + '">Legends</span><br>é inspirado nele', 5.75, 80)}
  ${sub('só que com uma diferença<br>que muda tudo:', 6.5)}
  ${grande('COM A TURMA', 7.2, GREEN, 130)}
  <div style="margin-top:20px">${pill('no navegador · não instala nada', '#fff', INK, 34, 8.0)}</div>`)}
${cena(11.4, 17.2, `
  ${titulo('você monta o time<br>num <span style="color:' + ROXO + '">leilão às cegas</span>', 11.55, 74)}
  ${sub('de mais de mil lendas do futebol', 12.3)}
  <div style="display:flex;flex-direction:column;gap:18px;margin-top:30px">
    ${linha('👑 Pelé · Zico · Romário', 'BR', 12.9)}
    ${linha('🌍 Zidane · Ronaldinho · CR7', 'EU', 13.35)}
    ${linha('🧤 Rogério Ceni · Taffarel', 'GOL', 13.8)}
  </div>`)}
${cena(17.2, 22.5, `
  ${titulo('e aí escolhe:', 17.35, 64)}
  <div style="display:flex;flex-direction:column;gap:26px;margin-top:30px">
    ${cartao('<span style="' + OSW + ';font-size:56px">🌐 ONLINE</span><br><span style="font-size:38px;font-weight:700;color:rgba(12,12,12,.6)">com até 20 amigos na mesma sala</span>', 17.9)}
    ${cartao('<span style="' + OSW + ';font-size:56px">🪜 CARREIRA</span><br><span style="font-size:38px;font-weight:700;color:rgba(12,12,12,.6)">da várzea até a Série A</span>', 18.5)}
  </div>
  ${sub('bora ver cada um 👇', 19.4, 44)}`)}
` }

// ─── PARTE 2 · o leilão ────────────────────────────────────────────────────
const relogio = (atraso) => `
  <div style="width:760px;height:34px;border:5px solid ${INK};border-radius:999px;background:#fff;box-shadow:5px 5px 0 ${INK};overflow:hidden;margin-top:26px;animation:sobe .4s ${atraso}s both">
    <div style="height:100%;background:${RED};animation:conta 4s linear ${atraso + 0.4}s both"></div></div>`
const envelope = (nome, lance, atraso, cor = INK) => cartao(`
  <div style="display:flex;align-items:center;justify-content:space-between">
    <span style="${OSW};font-size:46px">✉️ ${nome}</span>
    <span style="${OSW};font-size:46px;color:${cor}">${lance}</span></div>`, atraso, 800)
const parte2 = { dur: 24.5, html: `
${cena(0, 6.0, `
  ${titulo('o leilão é<br><span style="color:' + ROXO + '">às cegas</span>', 0.15, 84)}
  ${sub('a lenda aparece na mesa…', 0.9)}
  ${cartao('<span style="' + OSW + ';font-size:64px">⭐ ROMÁRIO</span><br><span style="font-size:36px;font-weight:700;color:rgba(12,12,12,.6)">atacante · nível 5</span>', 1.5)}
  ${sub('e cada um escreve o lance<br>num envelope fechado', 2.3)}
  ${relogio(3.0)}
  ${sub('<b>45 segundos</b>. ninguém vê o do outro.', 3.6, 36)}`)}
${cena(6.0, 12.4, `
  ${titulo('abre os envelopes 👀', 6.15, 70)}
  <div style="display:flex;flex-direction:column;gap:16px;margin-top:26px">
    ${envelope('você', '🪙 180', 6.7)}
    ${envelope('o zé', '🪙 175', 7.15, RED)}
    ${envelope('o compadre', '🪙 40', 7.6, 'rgba(12,12,12,.45)')}
    ${envelope('o cunhado', '🪙 0', 8.05, 'rgba(12,12,12,.45)')}
  </div>
  ${grande('QUASE! 😱', 9.0, RED, 120)}
  ${sub('o zé perdeu por 5 moedas', 9.7, 38)}`)}
${cena(12.4, 18.4, `
  <p style="font-size:200px;line-height:1;transform-origin:80% 80%;animation:martelo .7s cubic-bezier(.2,1.5,.4,1) 12.6s both">🔨</p>
  ${titulo('é seu!', 13.2, 110)}
  ${sub('o martelo bate <b>só pra quem ganha</b>', 13.9)}
  ${sub('e a resenha come solta:<br>blefe, chuva de dinheiro 💸, provocação', 14.7, 38)}`)}
${cena(18.4, 24.5, `
  ${titulo('goleiro, zaga, meio, ataque…', 18.55, 64)}
  ${sub('setor por setor, até fechar<br>os 11 de cada um', 19.2)}
  <div style="margin-top:30px">${pill('quem gasta mal fica com perna-de-pau', GOLD, INK, 32, 20.0)}</div>
  ${sub('aí o campeonato começa ⚽', 21.0, 44)}`)}
` }

// ─── PARTE 3 · online ──────────────────────────────────────────────────────
const cadeira = (n, atraso, humano) => `
  <span style="width:72px;height:72px;border-radius:50%;border:5px solid ${INK};box-shadow:4px 4px 0 ${INK};display:inline-flex;align-items:center;justify-content:center;
    font-size:34px;background:${humano ? GOLD : '#DBD1B5'};animation:pop .35s cubic-bezier(.2,1.6,.4,1) ${atraso}s both">${humano ? '🙂' : '🤖'}</span>`
const parte3 = { dur: 24.5, html: `
${cena(0, 6.0, `
  ${grande('ONLINE', 0.15, RED, 160)}
  ${titulo('até <span style="color:' + GREEN + '">20 amigos</span><br>na mesma sala', 0.8, 76)}
  <div style="display:flex;flex-wrap:wrap;gap:14px;justify-content:center;width:900px;margin-top:34px">
    ${Array.from({ length: 20 }, (_, i) => cadeira(i, 1.5 + i * 0.09, i < 6)).join('')}
  </div>
  ${sub('faltou gente? o jogo completa com bot', 3.6, 36)}`)}
${cena(6.0, 12.0, `
  ${titulo('cria a sala,<br>manda o código no zap', 6.15, 72)}
  ${cartao('<span style="' + OSW + ';font-size:96px;letter-spacing:.18em;color:' + ROXO + '">7K2QX</span>', 7.0, 640)}
  ${sub('quem clica no link<br>já cai dentro da sala', 7.8)}
  <div style="margin-top:30px">${pill('⚡ jogo rápido · uma noite', '#fff', INK, 34, 8.6)}</div>`)}
${cena(12.0, 18.4, `
  ${titulo('ou faz uma <span style="color:' + GOLD + '">liga</span><br>com a turma', 12.15, 76)}
  <div style="display:flex;flex-direction:column;gap:18px;margin-top:30px">
    ${linha('🏆 Liga', 'temporada inteira', 12.8)}
    ${linha('🌎 Libertadores', 'os melhores da liga', 13.25)}
    ${linha('🌐 Copa do Mundo', 'cada um com uma seleção', 13.7)}
  </div>
  ${sub('e no fim sai o jornal da sala<br>com a resenha de todo mundo 📰', 14.6, 36)}`)}
${cena(18.4, 24.5, `
  ${titulo('tudo <span style="color:' + GREEN + '">ao vivo</span>', 18.55, 90)}
  ${sub('chat na sala, cantada de blefe,<br>chuva de dinheiro e dupla com o parceiro', 19.2)}
  <div style="margin-top:34px">${pill('💸 "esse aí é meu, nem tenta"', GOLD, INK, 32, 20.2)}</div>`)}
` }

// ─── PARTE 4 · carreira ────────────────────────────────────────────────────
const degrau = (rot, cor, atraso, largura) => `
  <div style="width:${largura}px;background:${cor};border:5px solid ${INK};border-radius:16px;box-shadow:6px 6px 0 ${INK};padding:16px 0;
    ${OSW};font-size:46px;text-transform:uppercase;text-align:center;animation:sobeDegrau .45s cubic-bezier(.2,1.4,.4,1) ${atraso}s both">${rot}</div>`
const parte4 = { dur: 26.5, html: `
${cena(0, 6.4, `
  ${grande('CARREIRA', 0.15, GREEN, 150)}
  ${titulo('você começa na<br><span style="color:' + RED + '">várzea</span>', 0.8, 80)}
  ${sub('time fraco, caixa curto,<br>e um sonho: chegar na Série A', 1.6)}
  <div style="margin-top:30px">${pill('🪜 5 divisões pra subir', '#fff', INK, 34, 2.5)}</div>`)}
${cena(6.4, 13.0, `
  ${titulo('a escada', 6.55, 70)}
  <div style="display:flex;flex-direction:column-reverse;gap:14px;align-items:center;margin-top:26px">
    ${degrau('🌱 Várzea', '#DBD1B5', 7.0, 520)}
    ${degrau('Série D', '#F3D34A', 7.45, 600)}
    ${degrau('Série C', '#BFE3C7', 7.9, 680)}
    ${degrau('Série B', '#B9D8F5', 8.35, 760)}
    ${degrau('👑 Série A', GOLD, 8.8, 840)}
  </div>
  ${sub('sobe quem termina em cima.<br>cai quem termina embaixo.', 9.7, 36)}`)}
${cena(13.0, 19.6, `
  ${titulo('cada temporada:', 13.15, 64)}
  <div style="display:flex;flex-direction:column;gap:18px;margin-top:26px">
    ${linha('⚽ 38 rodadas', 'ida e volta', 13.7)}
    ${linha('🔨 leilão no começo', 'reforça o time', 14.15)}
    ${linha('🏆 Copa do Brasil', 'mata-mata', 14.6)}
    ${linha('🥇 Supercopa', 'campeão × campeão', 15.05)}
  </div>
  ${sub('e mais pra frente destrava a<br><b>🌐 Copa do Mundo</b> de seleções', 15.9, 36)}`)}
${cena(19.6, 26.5, `
  ${titulo('e o clube <span style="color:' + ROXO + '">cresce</span> com você', 19.75, 70)}
  <div style="display:flex;flex-direction:column;gap:18px;margin-top:26px">
    ${linha('🏟️ estádio', 'vai ficando maior', 20.3)}
    ${linha('🧑‍💼 técnico', 'contrata, demite', 20.75)}
    ${linha('💰 patrocínio', 'bate a meta, ganha', 21.2)}
    ${linha('🎖️ títulos', 'ficam na estante', 21.65)}
  </div>
  ${sub('tem gente na <b>temporada 30</b>. sério.', 22.6, 40)}`)}
` }

// ─── PARTE 5 · o clube é seu ───────────────────────────────────────────────
const escudo = (src, atraso, h = 300) => `
  <img src="${src}" style="height:${h}px;width:auto;animation:pop .55s cubic-bezier(.2,1.6,.4,1) ${atraso}s both">`
const parte5 = { dur: 22.5, html: `
${cena(0, 6.4, `
  ${titulo('e o time pode ser<br><span style="color:' + RED + '">o SEU</span>', 0.15, 84)}
  <div style="display:flex;gap:30px;align-items:center;margin-top:36px">
    ${escudo(ESC.neymarzetti, 0.9, 260)}
    ${escudo(ESC.nata, 1.15, 260)}
    ${escudo(ESC.papao, 1.4, 260)}
  </div>
  ${sub('com nome, escudo e mascote<br>de verdade, dentro do jogo', 2.2)}`)}
${cena(6.4, 13.0, `
  <div style="display:flex;gap:40px;align-items:flex-end;margin-bottom:20px">
    ${escudo(ESC.takhadao, 6.6, 330)}
    ${escudo(MASC.takhadao, 6.9, 420)}
  </div>
  ${titulo('a mascote carimba a tela<br>quando o seu time faz gol', 7.6, 60)}
  ${sub('e invade tudo quando é campeão 🎉', 8.4, 38)}`)}
${cena(13.0, 18.4, `
  ${titulo('são só <span style="color:' + GOLD + '">100 clubes</span><br>no jogo inteiro', 13.15, 78)}
  ${sub('quem batiza um, vira<br><b>Fundador</b> — pra sempre', 13.9)}
  <div style="margin-top:30px">${pill('👑 Lenda · sócio · fundador nº', GOLD, INK, 34, 14.8)}</div>`)}
${cena(18.4, 22.5, `
  <p style="font-size:130px;line-height:1;animation:pop .6s cubic-bezier(.2,1.6,.4,1) 18.55s both">⚽</p>
  <p style="${OSW};font-size:92px;text-transform:uppercase;margin-top:10px;animation:pulsa 1.4s ease-in-out 19.2s infinite">
    Leilão <span style="color:${RED}">Legends</span></p>
  ${sub('grátis · no navegador · chama a turma', 19.4, 44)}
  <div style="margin-top:30px">${pill('leilaolegends.com', INK, GOLD, 40, 20.0)}</div>`)}
` }

// ─── grava cada parte ──────────────────────────────────────────────────────
const PARTES = [parte1, parte2, parte3, parte4, parte5]
let FF = 'ffmpeg'
try { FF = createRequire(import.meta.url)('ffmpeg-static') } catch { /* usa o do PATH */ }

const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
for (let i = 0; i < PARTES.length; i++) {
  const n = i + 1
  if (SO && String(n) !== SO) continue
  const { dur, html } = PARTES[i]
  const REC = `${PASTA}/rec-${n}`
  rmSync(REC, { recursive: true, force: true }); mkdirSync(REC, { recursive: true })
  const htmlPath = `${PASTA}/parte-${n}.html`
  writeFileSync(htmlPath, pagina(html, dur))
  const ctx = await b.newContext({ viewport: { width: 1080, height: 1920 }, recordVideo: { dir: REC, size: { width: 1080, height: 1920 } } })
  const vp = await ctx.newPage()
  await vp.goto('file://' + htmlPath)
  await vp.evaluate(() => document.fonts.ready)
  await vp.waitForTimeout(Math.round(dur * 1000) + 400)
  await ctx.close()
  const webm = readdirSync(REC).find(f => f.endsWith('.webm'))
  if (!webm) throw new Error(`parte ${n}: o Playwright não gravou o webm`)
  const saida = `${PASTA}/apresentacao-parte${n}.mp4`
  execFileSync(FF, ['-y', '-i', `${REC}/${webm}`, '-t', String(dur),
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-pix_fmt', 'yuv420p',
    '-r', '30', '-movflags', '+faststart', saida], { stdio: 'ignore' })
  console.log(`parte ${n}: ${saida} (${dur}s)`)
}
await b.close()
