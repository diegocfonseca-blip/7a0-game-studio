// ─── 🎬 REELS 1080×1920: 🎙️ COLETIVA DE IMPRENSA NA CARREIRA (19/10) ───────────────────────────────
// Pedido do Diego (19/10): *"faça um vídeo mockup tb p avisar a todos reels padrão e tb aviso da comunidade no zap"*.
// Mesmo molde do `video-amigos-reels.mjs` (cenas em HTML + Playwright gravando + ffmpeg). Repórteres INVENTADOS.
//
// 🎞️ Roteiro (~38 s):
//   0,0– 4,6   🎙️ chegou: a imprensa entrou no Modo Carreira
//   4,6–10,6   o repórter pergunta depois do jogo · você responde com UM toque (3 estilos) ou pula
//  10,6–16,0   a resposta vira manchete no Martelo + efeito pequeno (rival motivado, torcida em festa)
//  16,0–21,4   4 repórteres com mania própria × dezenas de situações · 600+ frases
//  21,4–26,8   🔥 arquirrival: o clássico de verdade, com retrospecto
//  26,8–32,2   📝 promessa feita volta cobrada · fama do presidente
//  32,2–38,2   CTA: abre a carreira e joga a rodada
//
//   node scripts/video-coletiva-reels.mjs [--saida scripts/posts/coletiva-reels.mp4]
import { readFileSync, writeFileSync, readdirSync, rmSync, mkdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { chromium } from 'playwright-core'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'scripts/posts/coletiva-reels.mp4')
const ESTADIO = `data:image/webp;base64,${readFileSync('src/escalacao/img/online-estadio-v25.webp').toString('base64')}`
const JORNAL = `data:image/webp;base64,${readFileSync('src/escalacao/img/online-jornal-v20.webp').toString('base64')}`
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
const rep = (cor, ini, t = 84) => `<span style="flex:none;width:${t}px;height:${t}px;border-radius:50%;background:${cor};border:4px solid ${INK};display:inline-flex;align-items:center;justify-content:center;${OSW};font-size:${t * .45}px;color:${cor === GOLD ? INK : '#fff'}">${ini}</span>`
const caixa = (html, atraso, extra = '') => `<div style="width:940px;background:#fff;border:6px solid ${INK};border-radius:30px;box-shadow:10px 10px 0 ${INK};overflow:hidden;text-align:left;${pop(atraso)};${extra}">${html}</div>`
const resposta = (txt, tag, bg, atraso) => `<div style="display:flex;align-items:center;gap:14px;background:${bg};border:4px solid ${INK};border-radius:18px;box-shadow:5px 5px 0 ${INK};padding:16px 20px;margin:0 20px 12px;${entra(atraso)}">
  <span style="flex:1;font-size:30px;font-weight:800;line-height:1.25">“${txt}”</span><span style="${OSW};font-size:20px;background:${INK};color:${GOLD};border-radius:10px;padding:4px 12px;white-space:nowrap">${tag}</span></div>`
const linhaRep = (cor, ini, nome, veic, mania, atraso) => `<div style="display:flex;align-items:center;gap:20px;padding:18px 26px;border-top:3px dashed #0002;${entra(atraso)}">${rep(cor, ini, 76)}
  <span style="flex:1"><b style="font-size:36px;font-weight:800;display:block;line-height:1.1">${nome} <small style="font-size:24px;color:#666">· ${veic}</small></b><span style="font-size:25px;font-weight:700;color:#555">${mania}</span></span></div>`
const chips = ['goleada', 'derrota pro rival', '5 sem vencer', 'virada', 'artilheiro', 'zaga furada', 'craque cansado', 'lesão', 'cria da base', 'vai subir?', 'vai cair?', 'final de Copa', 'eliminado', 'caixa vazio', 'clássico', 'estreia', 'última rodada', 'campeão']

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
@keyframes chama{0%,100%{transform:scale(1) rotate(-3deg)}50%{transform:scale(1.15) rotate(3deg)}}
@keyframes mic{0%,100%{transform:rotate(-6deg)}50%{transform:rotate(6deg)}}
@keyframes dedo{0%,100%{transform:translate(0,0)}50%{transform:translate(-14px,-14px)}}
</style><body>

<!-- ① chegou -->
${cena(0, 4.6, `
  <div style="width:230px;height:230px;border-radius:50%;background:${INK};border:7px solid ${INK};box-shadow:10px 10px 0 ${ROXO};display:flex;align-items:center;justify-content:center;font-size:130px;animation:pop .5s cubic-bezier(.2,1.6,.4,1) .1s both, mic 1.2s ease-in-out .7s infinite">🎙️</div>
  <p style="${OSW};font-size:58px;text-transform:uppercase;color:rgba(12,12,12,.5);margin-top:50px;${sobe(.45)}">a imprensa entrou no</p>
  <p style="${OSW};font-size:140px;text-transform:uppercase;line-height:.95;color:${GREEN};${pop(.7)}">modo<br>carreira</p>
  <p style="${OSW};font-size:60px;text-transform:uppercase;line-height:1.1;margin-top:14px;${sobe(1.1)}">Leilão <span style="color:${RED}">Legends</span></p>
  <div style="margin-top:46px;${pop(1.6)}">${pill('🎙️ coletiva de imprensa', GOLD, INK, 40)}</div>`)}

<!-- ② a pergunta e as 3 respostas -->
${cena(4.6, 10.6, `
  <p style="${OSW};font-size:64px;text-transform:uppercase;line-height:1.05;margin-bottom:28px;${sobe(4.7)}">acabou o jogo. <span style="color:${RED}">o repórter pergunta.</span></p>
  ${caixa(`
    <div style="height:150px;background:#111 url(${ESTADIO}) center/cover;position:relative"><div style="position:absolute;inset:0;background:linear-gradient(180deg,#0003,#000c)"></div>
      <div style="position:absolute;left:26px;bottom:16px;color:#fff;text-align:left"><div style="${OSW};font-size:22px;color:${GOLD}">⚽ 3 × 1 · vitória no clássico</div><div style="${OSW};font-size:44px;line-height:1">Seu clube 🎙️</div></div></div>
    <div style="display:flex;gap:18px;align-items:flex-start;padding:22px 20px 14px">${rep('#C2452F', 'R', 80)}
      <div style="flex:1"><span style="display:inline-block;${OSW};font-size:20px;background:#C2452F;color:#fff;border-radius:10px;padding:4px 12px;margin-bottom:8px">🎤 Rogério Provoca · Rádio Pregão</span>
        <div style="background:#fff;border:4px solid ${INK};border-radius:20px;border-top-left-radius:6px;box-shadow:5px 5px 0 ${INK};padding:18px 22px;font-size:31px;font-weight:700;line-height:1.3">“O rival disse que vocês tiveram sorte. Vai deixar passar?”</div></div></div>
    ${resposta('Sorte? A gente treina sorte segunda, quarta e sexta.', '😈 provoca', '#FFE3D6', 6.2)}
    ${resposta('Respeito o adversário. Hoje fomos melhores, só isso.', '🧊 diplomata', '#fff', 6.5)}
    ${resposta('Não vou responder atacante. Pergunta de futebol?', '🚪 desconversa', '#fff', 6.8)}
    <div style="margin:0 20px 20px;border:4px dashed ${INK};border-radius:16px;padding:12px;${OSW};font-size:24px;text-align:center;${entra(7.1)}">pular coletiva</div>`, 4.9)}
  <p style="font-size:30px;font-weight:800;color:rgba(12,12,12,.6);margin-top:28px;${sobe(7.8)}">UM toque. Só aparece quando tem assunto. Nunca segura o jogo.</p>`)}

<!-- ③ vira manchete + efeito -->
${cena(10.6, 16.0, `
  <p style="${OSW};font-size:66px;text-transform:uppercase;line-height:1.05;margin-bottom:30px;${sobe(10.7)}">a resposta vira <span style="color:${ROXO}">história</span></p>
  ${caixa(`<img src="${JORNAL}" style="width:100%;height:170px;object-fit:cover;display:block">
    <div style="padding:22px 26px"><span style="${OSW};font-size:20px;background:${ROXO};color:#fff;border-radius:10px;padding:4px 12px">coletiva</span>
      <div style="${OSW};font-size:40px;line-height:1.08;margin-top:10px">“A gente treina sorte segunda, quarta e sexta”: presidente cutuca o rival</div>
      <p style="font-size:26px;font-weight:700;color:#555;margin-top:10px">Pegou mal no vestiário adversário. O clássico de volta promete.</p></div>`, 10.9)}
  <div style="display:flex;flex-direction:column;gap:16px;margin-top:40px;align-items:center">
    <div style="${pop(12.4)}">${pill('🔥 rival motivado no jogo de volta', '#fff', INK, 30)}</div>
    <div style="${pop(12.8)}">${pill('📣 torcida em festa: +bilheteria', GOLD, INK, 30)}</div>
    <div style="${pop(13.2)}">${pill('🎙️ o repórter cobra depois', '#fff', INK, 30)}</div>
  </div>
  <p style="font-size:30px;font-weight:800;color:rgba(12,12,12,.6);margin-top:30px;${sobe(13.8)}">efeito sempre pequeno, sempre explicado</p>`)}

<!-- ④ variedade -->
${cena(16.0, 21.4, `
  <p style="${OSW};font-size:64px;text-transform:uppercase;line-height:1.05;margin-bottom:28px;${sobe(16.1)}">4 repórteres, <span style="color:${GREEN}">cada um com a sua mania</span></p>
  ${caixa(`${linhaRep('#C2452F', 'R', 'Rogério Provoca', 'Rádio Pregão', 'só quer briga: rival, promessa, cobrança', 16.4).replace('border-top:3px dashed #0002;', '')}
    ${linhaRep('#1B7A3D', 'C', 'Clarice Planilha', 'Jornal do Caixa', 'dinheiro, salário, patrocínio', 16.7)}
    ${linhaRep(GOLD, 'T', 'Tião Puxa-Saco', 'TV Legends', 'elogia tudo, pergunta de sonho e título', 17.0)}
    ${linhaRep('#7C3AED', 'M', 'Mila Vestiário', 'Blog Bastidores', 'jogador cansado, lesão, cria da base', 17.3)}`, 16.3)}
  <div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center;width:960px;margin-top:34px">${chips.map((c, i) => `<span style="border:3px solid ${INK};border-radius:999px;padding:8px 18px;background:#fff;font-size:24px;font-weight:800;${pop(18 + i * .08)}">${c}</span>`).join('')}</div>
  <p style="${OSW};font-size:44px;margin-top:30px;${pop(19.6)}">36 situações · <span style="color:${RED}">600+ frases</span> · sem repetir na temporada</p>`)}

<!-- ⑤ arquirrival -->
${cena(21.4, 26.8, `
  <p style="font-size:200px;line-height:1;animation:pop .5s cubic-bezier(.2,1.6,.4,1) 21.5s both, chama .9s ease-in-out 22s infinite">🔥</p>
  <p style="${OSW};font-size:72px;text-transform:uppercase;line-height:1.05;margin:20px 0 30px;${sobe(21.8)}">agora o jogo sabe quem é <span style="color:${RED}">seu arquirrival</span></p>
  ${caixa(`<div style="padding:26px 30px;background:#FFE3D6"><div style="${OSW};font-size:22px;color:#7a2a12">🔥 arquirrival</div><div style="${OSW};font-size:52px;line-height:1">Seu rival de sempre</div>
    <div style="font-size:30px;font-weight:800;margin-top:10px">retrospecto nesta carreira: <b>7V 3E 5D</b></div></div>
    <div style="padding:20px 30px;font-size:28px;font-weight:700;line-height:1.4">• é contra ele que a coletiva fala em <b>clássico</b><br>• provocou e perdeu? o jornal lembra<br>• dá pra trocar na virada da temporada</div>`, 22.2)}`)}

<!-- ⑥ promessa + fama -->
${cena(26.8, 32.2, `
  <p style="${OSW};font-size:66px;text-transform:uppercase;line-height:1.05;margin-bottom:30px;${sobe(26.9)}">promessa feita <span style="color:${RED}">volta cobrada</span></p>
  ${caixa(`<div style="padding:22px 26px;border-bottom:4px solid ${INK}"><span style="${OSW};font-size:20px;background:${INK};color:${GOLD};border-radius:10px;padding:4px 12px">rodada 1</span>
      <div style="font-size:32px;font-weight:800;margin-top:10px">“Prometo o título. Pode cobrar.”</div></div>
    <div style="padding:22px 26px;background:#FFF7DA"><span style="${OSW};font-size:20px;background:${RED};color:#fff;border-radius:10px;padding:4px 12px">fim da temporada</span>
      <div style="${OSW};font-size:38px;line-height:1.1;margin-top:10px">Prometeu o título… e a faixa ficou na loja</div></div>`, 27.1)}
  <div style="margin-top:40px;${pop(28.6)}"><div style="${OSW};font-size:26px;color:#666">fama do presidente</div><div style="${OSW};font-size:76px;color:#C2452F;line-height:1">“O Polemista”</div></div>
  <p style="font-size:30px;font-weight:800;color:rgba(12,12,12,.6);margin-top:16px;${sobe(29.2)}">Polemista · Diplomata · Escorregadio · Mudo · Sonhador · Pão-duro</p>`)}

<!-- ⑦ CTA -->
${cena(32.2, 60, `
  <p style="${OSW};font-size:60px;text-transform:uppercase;line-height:1.08;${sobe(32.3)}">pulou 3 seguidas?</p>
  <p style="${OSW};font-size:80px;text-transform:uppercase;line-height:1.02;color:${RED};${pop(32.7)}">“presidente foge da imprensa”</p>
  <p style="font-size:32px;font-weight:700;color:rgba(12,12,12,.6);margin:16px 0 50px;${sobe(33.1)}">até o silêncio vira manchete 🤐</p>
  <p style="${OSW};font-size:84px;text-transform:uppercase;line-height:1.02;${pop(33.6)}">abre a carreira</p>
  <div style="margin-top:26px;${pop(34)}">${pill('▶️ próxima rodada', GREEN, '#fff', 44)}</div>
  <p style="${OSW};font-size:60px;margin-top:60px;text-transform:uppercase;animation:pulsa 1.4s ease-in-out 34.6s infinite">⚽ Leilão <span style="color:${RED}">Legends</span></p>
  <p style="font-size:32px;font-weight:700;color:rgba(12,12,12,.55);margin-top:12px">leilaolegends.com</p>`)}
</body>`

// ── grava e converte ───────────────────────────────────────────────────────
const REC = '/tmp/rec-coletiva-reels'
rmSync(REC, { recursive: true, force: true }); mkdirSync(REC, { recursive: true })
const vtmp = '/tmp/video-coletiva-reels.html'
writeFileSync(vtmp, video)
if (process.argv.includes('--so-html')) { console.log(vtmp); process.exit(0) }

const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const ctx = await b.newContext({ viewport: { width: 1080, height: 1920 }, recordVideo: { dir: REC, size: { width: 1080, height: 1920 } } })
const vp = await ctx.newPage()
await vp.goto('file://' + vtmp)
await vp.evaluate(() => document.fonts.ready)
await vp.waitForTimeout(38600)
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
