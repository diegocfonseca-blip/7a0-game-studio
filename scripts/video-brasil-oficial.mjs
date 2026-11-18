// 🎬 VÍDEO DE LANÇAMENTO — Brasil Oficial (18/11, pedido do Diego: "quero um vídeo agora do lançamento do novo carreira oficial c
// clubes"). Stories 1080×1920, telas DE VERDADE do jogo (gravadas com `captura.cjs`) + textos curtos no padrão do jogo (creme/Oswald/
// borda preta/sombra dura). Uso: node scripts/video-brasil-oficial.mjs <pasta-das-telas> → scripts/mockups/video-brasil-oficial.mp4
import { chromium } from 'playwright-core'
import { readFileSync, existsSync, mkdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
const PASTA = process.argv[2]
const OUT = 'scripts/mockups'
const TMP = `${PASTA}/quadros`; mkdirSync(TMP, { recursive: true })
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [500, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w}}`).join('')
const img = (p, t = 'png') => `data:image/${t};base64,${readFileSync(p).toString('base64')}`
const LOGO = img('src/escalacao/img/logo-ll.webp', 'webp')
const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6', GREEN = '#1B7A3D'
const CENAS = [
  { tipo: 'capa' },
  { tela: 's2-clubes-a', t: 'Escolha um clube REAL', s: 'Séries A, B, C e D · escudo e estádio de verdade' },
  { tela: 's2-clubes-c', t: 'Na divisão real dele', s: 'Formato real de cada série · quem sobe, quem cai' },
  { tela: 's5-leilao', t: 'Leilão de abertura', s: '1 reforço por posição · a mesma chance pra todos' },
  { tela: 's6-central', t: 'Central da carreira', s: 'A agenda com os jogos de verdade' },
  { tela: 's8-mercado-clube', t: '🛒 Mercado', s: 'Fique de olho em quem fica sem contrato' },
  { tela: 's9-jogos', t: 'Copa do Brasil · Libertadores', s: 'Sul-Americana e Mundial pela sua colocação' },
  { tipo: 'fim' },
].filter(c => !c.tela || existsSync(`${PASTA}/${c.tela}.png`))
const base = (corpo) => `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}
body{margin:0;width:1080px;height:1920px;overflow:hidden;background:radial-gradient(ellipse at 50% 20%,#1d3b27 0%,#0E1210 60%);font-family:system-ui;color:${CREME}}
.osw{font-family:Oswald,sans-serif;font-weight:700;text-transform:uppercase}</style></head><body>${corpo}</body></html>`
const cena = c => c.tipo === 'capa' ? base(`
  <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:80px">
   <img src="${LOGO}" style="width:200px;height:200px;border-radius:40px;border:6px solid ${INK};box-shadow:10px 10px 0 #000">
   <p class="osw" style="font-size:44px;letter-spacing:.14em;color:#E8C66A;margin:60px 0 10px">Novo modo carreira</p>
   <p class="osw" style="font-size:150px;line-height:.95;margin:0">🇧🇷 Brasil<br>Oficial</p>
   <p style="font:600 46px/1.35 system-ui;margin:50px 0 0;max-width:860px">Clubes reais. Divisões reais.<br>Campeonatos reais.</p>
  </div>`) : c.tipo === 'fim' ? base(`
  <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:80px">
   <p class="osw" style="font-size:96px;line-height:1;margin:0">Tudo de<br>verdade.</p>
   <div style="margin:60px 0 0;display:grid;gap:22px;width:860px">
    ${['💰 Caixa pela receita real do clube', '🤖 Rivais que pagam salário, contratam e renovam', '🏟️ O estádio de verdade de cada clube'].map(x => `<div style="background:${CREME};color:${INK};border:5px solid ${INK};border-radius:28px;box-shadow:8px 8px 0 #000;padding:26px 30px;font:700 40px/1.25 system-ui;text-align:left">${x}</div>`).join('')}
   </div>
   <img src="${LOGO}" style="width:130px;height:130px;border-radius:28px;border:5px solid ${INK};box-shadow:8px 8px 0 #000;margin-top:80px">
   <p class="osw" style="font-size:54px;margin:26px 0 0">Leilão Legends</p>
   <p class="osw" style="font-size:40px;color:${GOLD};margin:8px 0 0;text-transform:none">leilaolegends.com</p>
  </div>`) : base(`
  <div style="position:absolute;left:0;right:0;top:110px;text-align:center;padding:0 60px">
   <p class="osw" style="font-size:86px;line-height:1;margin:0">${c.t}</p>
   <p style="font:600 40px/1.3 system-ui;margin:22px 0 0;color:#e7dcc0">${c.s}</p>
  </div>
  <div style="position:absolute;left:50%;top:430px;transform:translateX(-50%);width:640px;height:1385px;border:8px solid ${INK};border-radius:64px;overflow:hidden;box-shadow:16px 16px 0 #000;background:#000">
   <img src="${img(`${PASTA}/${c.tela}.png`)}" style="width:100%;display:block">
  </div>
  <div class="osw" style="position:absolute;right:50px;bottom:40px;font-size:30px;color:#E8C66A">🇧🇷 Brasil Oficial</div>`)
const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const pg = await br.newPage({ viewport: { width: 1080, height: 1920 } })
const quadros = []
for (const [i, c] of CENAS.entries()) {
  await pg.setContent(cena(c), { waitUntil: 'load' }); await pg.waitForTimeout(300)
  const f = `${TMP}/c${i}.png`; await pg.screenshot({ path: f }); quadros.push(f)
}
await br.close()
// cada cena 3,2 s com zoom lento; transição de 0,5 s
const D = 3.2, X = 0.5, args = ['-y']
for (const f of quadros) args.push('-loop', '1', '-t', String(D), '-i', f)
const filtros = quadros.map((_, i) => `[${i}:v]scale=1188:2112,zoompan=z='min(zoom+0.0009,1.1)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${Math.round(D * 30)}:s=1080x1920:fps=30,setsar=1[v${i}]`)
let ult = 'v0', off = 0
for (let i = 1; i < quadros.length; i++) { off += D - X; filtros.push(`[${ult}][v${i}]xfade=transition=fade:duration=${X}:offset=${off.toFixed(2)}[x${i}]`); ult = `x${i}` }
args.push('-filter_complex', filtros.join(';'), '-map', `[${ult}]`, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-r', '30', '-movflags', '+faststart', `${OUT}/video-brasil-oficial.mp4`)
execFileSync('ffmpeg', args, { stdio: 'inherit' })
console.log('ok', `${OUT}/video-brasil-oficial.mp4`)
