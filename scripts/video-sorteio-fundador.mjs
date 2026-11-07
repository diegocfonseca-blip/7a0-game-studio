// 🎁 REELS 1080×1920 — SORTEIO DO PLANO FUNDADOR (Diego 07/11)
// Pedido: *"agora chegou o sorteio para ganhar o plano de fundador do Leilão Legends… as regras: seguir, curtir essa foto e marcar três
// amigos… data do sorteio estará na descrição"*. Galas que ELE escolheu: Tricolor do Arruda, K9, Neymar FC (o GOAT dourado) e Monarca
// Tricolor (*"não quero do Piranhão… do lutador do Intervale… do Seven City"*).
// 1) `node scripts/video-sorteio-grava-galas.mjs arruda` (e k9, neymarfc, monarca) grava as galas em alta → /tmp/claude-0/sorteio
// 2) `node scripts/video-sorteio-fundador.mjs` monta as telas e costura → scripts/posts/sorteio-fundador-reels.mp4
import { chromium } from 'playwright-core'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
const T = '/tmp/claude-0/sorteio', SAIDA = 'scripts/posts/sorteio-fundador-reels.mp4'
mkdirSync(T, { recursive: true })
const b64 = f => readFileSync(f).toString('base64')
const FONTES = [500, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(`scripts/fonts/oswald-latin-${w}-normal.woff2`)}) format('woff2');font-weight:${w}}`).join('')
const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D', RED = '#C2452F'
const LOGO = `data:image/webp;base64,${b64('src/escalacao/img/logo-ll.webp')}`
const CSS = `${FONTES}*{box-sizing:border-box;margin:0}
body{width:1080px;height:1920px;overflow:hidden;font-family:system-ui,sans-serif;color:${INK};background:radial-gradient(circle at 50% 30%,#FFF6DD 0,#F4ECD6 55%,#E9DDB9 100%);display:flex;flex-direction:column;align-items:center;padding:90px 70px;text-align:center}
.escuro{background:radial-gradient(circle at 50% 35%,#2a2208 0,#0C0C0C 70%);color:#fff}
.logo{width:300px}
.selo{font:700 46px Oswald;text-transform:uppercase;background:${RED};color:#fff;border:5px solid ${INK};border-radius:18px;box-shadow:7px 7px 0 ${INK};padding:8px 34px;rotate:-2deg}
h1{font:700 210px/0.9 Oswald;text-transform:uppercase;letter-spacing:-2px}
h2{font:700 92px/0.98 Oswald;text-transform:uppercase}
.ouro{color:${GOLD};text-shadow:6px 6px 0 ${INK}}
.plano{font:700 104px/1 Oswald;text-transform:uppercase;background:${INK};color:${GOLD};border:6px solid ${GOLD};border-radius:28px;box-shadow:10px 10px 0 ${GOLD}55;padding:18px 50px}
.vale{font:700 50px Oswald;text-transform:uppercase;opacity:.85}
.lista{display:flex;flex-direction:column;gap:26px;width:100%;text-align:left}
.it{display:flex;gap:26px;align-items:center;background:#fff;border:5px solid ${INK};border-radius:24px;box-shadow:7px 7px 0 ${INK};padding:30px 36px;font:700 62px/1.08 Oswald;text-transform:uppercase}
.it .e{font-size:92px;flex:none}.it small{display:block;font:600 30px/1.2 system-ui;text-transform:none;opacity:.7;margin-top:4px}
.ouroBox{background:${GOLD}}
.passo{display:flex;gap:30px;align-items:center;width:100%;background:#fff;border:6px solid ${INK};border-radius:28px;box-shadow:9px 9px 0 ${INK};padding:30px 36px;text-align:left}
.passo .n{flex:none;width:130px;height:130px;border-radius:50%;background:${GREEN};color:#fff;border:6px solid ${INK};font:700 86px/118px Oswald;text-align:center}
.passo b{font:700 70px/1 Oswald;text-transform:uppercase}.passo small{display:block;font:700 36px Oswald;color:${RED};margin-top:6px}
.faixa{font:700 64px/1.05 Oswald;text-transform:uppercase;background:${GREEN};color:#fff;border:6px solid ${INK};border-radius:26px;box-shadow:9px 9px 0 ${INK};padding:26px 40px}
.url{font:700 52px Oswald;color:${GOLD};background:${INK};border-radius:16px;padding:8px 30px}
.sp{flex:1}`
const pag = (corpo, cls = '') => `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body class="${cls}">${corpo}</body></html>`
const CENAS = {
  abre: [3.8, pag(`<img class="logo" src="${LOGO}"><div class="sp"></div><span class="selo">🎁 chegou o</span><div style="height:40px"></div><h1>SORTEIO</h1><div style="height:50px"></div><p class="vale">do nosso plano mais top do jogo</p><div style="height:30px"></div><p class="plano">🖋 FUNDADOR</p><div class="sp"></div>`)],
  ganha: [5.2, pag(`<div class="sp"></div><h2>Quem ganhar<br>leva <span class="ouro">tudo</span>:</h2><div style="height:60px"></div><div class="lista">
    <div class="it"><span class="e">🛡️</span><div>Escudo do seu clube</div></div>
    <div class="it"><span class="e">🐾</span><div>Mascote própria</div></div>
    <div class="it"><span class="e">🎽</span><div>Manto com as suas cores</div></div>
    <div class="it"><span class="e">👑</span><div>Entrada de gala personalizada</div></div>
    <div class="it ouroBox"><span class="e">➕</span><div>E mais de 20 benefícios</div></div></div><div class="sp"></div>`)],
  regras: [6.5, pag(`<div class="sp"></div><h2>Como<br>participar</h2><div style="height:70px"></div><div class="lista" style="gap:40px">
    <div class="passo"><span class="n">1</span><div><b>Marque 3 amigos</b><small>reais, que você segue</small></div></div>
    <div class="passo"><span class="n">2</span><div><b>Curta</b><small>esta publicação</small></div></div>
    <div class="passo"><span class="n">3</span><div><b>Siga</b><small>@leilaolegendscom</small></div></div></div><div class="sp"></div>`)],
  fim: [4.0, pag(`<img class="logo" src="${LOGO}"><div class="sp"></div><h2 style="font-size:130px">Boa sorte! 🍀</h2><div style="height:50px"></div><p class="vale" style="opacity:.7">data do sorteio na legenda</p><div class="sp"></div><p class="url">leilaolegends.com</p>`)],
}
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1080, height: 1920 } })
for (const [k, [, html]] of Object.entries(CENAS)) { await p.setContent(html); await p.waitForTimeout(300); await p.screenshot({ path: `${T}/c-${k}.png` }) }
await b.close()
// cada tela vira um trecho com um zoom bem lento; as galas entram cortando 0,2 s do começo (tela vazia)
const trechos = []
const tela = k => { const [d] = CENAS[k], f = `${T}/v-${k}.mp4`; execFileSync('ffmpeg', ['-v', 'error', '-y', '-loop', '1', '-i', `${T}/c-${k}.png`, '-t', String(d), '-vf', `scale=1188:2112,zoompan=z='1+0.0006*on':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1080x1920:fps=30,fade=t=in:st=0:d=0.25,format=yuv420p`, '-c:v', 'libx264', '-crf', '18', '-r', '30', f]); trechos.push(f) }
const gala = g => { const f = `${T}/v-gala-${g}.mp4`; execFileSync('ffmpeg', ['-v', 'error', '-y', '-ss', '0.2', '-i', `${T}/${g}.mp4`, '-vf', 'fps=30,format=yuv420p', '-c:v', 'libx264', '-crf', '18', '-r', '30', f]); trechos.push(f) }
tela('abre'); tela('ganha'); for (const g of ['neymarfc', 'arruda', 'k9', 'monarca']) gala(g); tela('regras'); tela('fim')
writeFileSync(`${T}/junta.txt`, trechos.map(f => `file '${f}'`).join('\n'))
execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', `${T}/junta.txt`, '-c:v', 'libx264', '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', SAIDA])
console.log('🎬', SAIDA)
