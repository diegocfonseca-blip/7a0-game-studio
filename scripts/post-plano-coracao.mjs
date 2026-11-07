// ─── 💙 ARTES DO PLANO CORAÇÃO (07/11, liberado pra todos) ──────────────────────────────────────────────────────────
// Feed 1080×1350 + capa de Reels 1080×1920 + VÍDEO de Reels (MP4 1080×1920, ~17 s, sem áudio) + legenda pronta.
// Mesma identidade dos posts de sempre (creme, borda preta, sombra dura, Oswald) + o azul da Casa Luca (casa-luca.tsx).
// Regras e textos SAEM DO JOGO: preço cheio dos mensais lido de src/escalacao/planos-regras.ts (MENSAIS) e a metade pela
// mesma conta de casa-luca-regras.ts (precoCoracaoCentavos). Nada de foto de gente: só emoji e peças do jogo.
// 🚫 Nunca mostrar valor de doação nem total arrecadado.
//   node scripts/post-plano-coracao.mjs            (precisa do ffmpeg pro .mp4)
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { chromium } from 'playwright-core'

// ── preços: lidos do código, nunca escritos à mão ──
const regras = readFileSync('src/escalacao/planos-regras.ts', 'utf8')
const preco = id => { const m = new RegExp(`${id}:\\s*\\{\\s*preco:\\s*([\\d.]+)`).exec(regras); if (!m) throw new Error(`preço de ${id} não achado`); return Number(m[1]) }
const desc = Number(/CORACAO_DESCONTO\s*=\s*([\d.]+)/.exec(readFileSync('src/escalacao/casa-luca-regras.ts', 'utf8'))[1])
const metade = r => Math.round(Math.round(r * 100) * (1 - desc)) / 100 // = precoCoracaoCentavos
const brl = v => 'R$ ' + v.toFixed(2).replace('.', ',')
const PLANOS = [['⭐ Craque Salas', preco('craque_salas')], ['⭐ Craque Completo', preco('craque_completo')]]
const PCT = Math.round(desc * 100)

const b64 = f => readFileSync(f).toString('base64')
const FONTES = [500, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(`scripts/fonts/oswald-latin-${w}-normal.woff2`)}) format('woff2');font-weight:${w}}`).join('')
const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D', RED = '#C2452F'
const AZUL = '#2F6FD6', AZUL_ESC = '#1D4FB8', AZUL_CLARO = '#DCE9FF'

const CSS = `${FONTES}
*{box-sizing:border-box;margin:0}
body{overflow:hidden;font-family:system-ui,sans-serif;color:${INK};background:radial-gradient(circle at 50% 28%,#FFF6DD 0,#F4ECD6 55%,#E9DDB9 100%)}
.wrap{position:relative;padding:60px 64px;display:flex;flex-direction:column}
.topo{display:flex;justify-content:space-between;align-items:center}
.marca{font:700 40px Oswald}.marca b{color:${RED}}
.selo{font:700 28px Oswald;color:#fff;background:${AZUL};border:4px solid ${INK};border-radius:16px;padding:8px 20px;box-shadow:5px 5px 0 ${INK};text-transform:uppercase}
.chega{font:700 38px Oswald;text-transform:uppercase;opacity:.55}
h1{font:700 150px/1 Oswald;text-transform:uppercase;letter-spacing:-1px;color:${AZUL_ESC}}
.off{display:flex;align-items:center;gap:22px;background:${GOLD};border:5px solid ${INK};border-radius:24px;box-shadow:8px 8px 0 ${INK};padding:16px 26px}
.off .n{font:700 112px/0.9 Oswald}.off p{font:700 38px/1.05 Oswald;text-transform:uppercase}
.precos{background:#fff;border:5px solid ${INK};border-radius:22px;box-shadow:7px 7px 0 ${INK};overflow:hidden}
.pl{display:flex;align-items:center;gap:16px;padding:16px 24px;font-size:32px;font-weight:900}
.pl+.pl{border-top:3px solid #EEE7D3}.pl span{flex:1}
.pl s{font-size:26px;font-weight:800;color:rgba(12,12,12,.42)}
.pl b{font:700 40px Oswald;color:#fff;background:${AZUL};border:4px solid ${INK};border-radius:14px;box-shadow:4px 4px 0 ${INK};padding:2px 14px;white-space:nowrap}
.pl b small{font-size:24px}
.it{display:flex;align-items:center;gap:20px;background:#fff;border:5px solid ${INK};border-radius:22px;box-shadow:7px 7px 0 ${INK};padding:14px 22px;font-size:30px;font-weight:800;line-height:1.2}
.it .ic{flex:none;width:68px;height:68px;border:4px solid ${INK};border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:36px}
.it b{font-weight:900}
.apaga{background:${RED};color:#fff;border-radius:8px;padding:0 8px}
.luca{background:${AZUL_CLARO};border:4px solid ${AZUL_ESC};border-radius:20px;box-shadow:6px 6px 0 ${AZUL_ESC};padding:14px 20px;font-size:25px;font-weight:800;line-height:1.3}
.cta{margin-top:auto;display:flex;align-items:center;justify-content:space-between;gap:20px;background:${INK};color:#fff;border-radius:26px;padding:22px 30px;box-shadow:8px 8px 0 ${GOLD}}
.cta p{font:700 40px Oswald;text-transform:uppercase}.cta small{display:block;font:500 23px system-ui;opacity:.75;margin-top:4px;text-transform:none}
.url{font:700 30px Oswald;color:${GOLD}}
`
const pagina = (w, h, corpo, extra = '') => `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}
body{width:${w}px;height:${h}px}.wrap{width:${w}px;height:${h}px}${extra}</style></head><body>${corpo}</body></html>`

const topo = `<div class="topo"><p class="marca">⚽ Leilão <b>Legends</b></p><span class="selo">🆕 liberado pra todos</span></div>`
const offBox = `<div class="off"><span class="n">${PCT}%</span><p>de desconto em<br>todos os planos mensais</p></div>`
const precosBox = `<div class="precos">${PLANOS.map(([n, v]) => `<div class="pl"><span>${n}</span><s>${brl(v)}</s><b>${brl(metade(v))}<small>/mês</small></b></div>`).join('')}</div>`
const item = (ic, cor, txt) => `<div class="it"><span class="ic" style="background:${cor}">${ic}</span><span>${txt}</span></div>`
const QUEM = [
  item('♿', AZUL_CLARO, '<b>Pessoa com deficiência</b> (PcD)'),
  item('👨‍👧', AZUL_CLARO, '<b>Pai, mãe ou responsável</b> de criança especial'),
]
const FOTO = item('📷', '#FFE0D6', 'Manda <b>uma foto</b> (carteirinha ou laudo). O Diego confere e a foto é <span class="apaga">APAGADA</span> logo depois')
const LUCA = `<div class="luca">💙 Na mesma área: <b>ajude o Luca</b>, filho do Diego, com um Pix. Não dá nada no jogo: é só carinho. 🧱 E tem o <b>Mural de apoiadores</b>.</div>`
const CTA = sub => `<div class="cta"><p>Planos → 💙 Apoie<small>${sub}</small></p><span class="url">leilaolegends.com</span></div>`

// ── 1. FEED 1080×1350 ──
const feed = pagina(1080, 1350, `<div class="wrap">${topo}
  <p class="chega" style="margin-top:22px">na área de planos</p>
  <h1 style="font-size:106px;white-space:nowrap;margin-top:6px">💙 Plano Coração</h1>
  <div style="display:flex;flex-direction:column;gap:18px;margin-top:24px">
    ${offBox}${precosBox}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">${QUEM.join('')}</div>
    ${FOTO}${LUCA}
  </div>
  ${CTA('discreto: ninguém vê que é o Plano Coração')}</div>`)

// ── 2. CAPA DE REELS 1080×1920 ──
const capa = pagina(1080, 1920, `<div class="wrap" style="padding:110px 70px 120px">${topo}
  <p class="chega" style="margin-top:60px;font-size:46px">na área de planos</p>
  <div style="font-size:150px;line-height:1;margin-top:6px">💙</div>
  <h1 style="font-size:172px;line-height:1.02;margin-bottom:18px">Plano<br>Coração</h1>
  <div style="display:flex;flex-direction:column;gap:24px;margin-top:40px">${offBox}${precosBox}
    <div style="display:flex;flex-direction:column;gap:18px">${QUEM.join('')}${FOTO}</div></div>
  <div style="height:30px;flex:none"></div>${CTA('pra PcD e pais/responsáveis de criança especial')}</div>`)

// ── 3. VÍDEO DE REELS: cenas HTML animadas por um relógio (render(t)), quadro a quadro, + ffmpeg ──
const DUR = 17, FPS = 30
const cena = (de, ate, html) => `<section class="cena" data-de="${de}" data-ate="${ate}">${html}</section>`
const pop = (d, html, cls = '') => `<div class="pop ${cls}" data-d="${d}">${html}</div>`
const video = pagina(1080, 1920, `<div class="wrap" style="height:1920px;padding:110px 70px 120px">${topo}
  ${cena(0, 3.2, `${pop(0.1, '<div style="font-size:260px;line-height:1" class="bate">💙</div>')}
     ${pop(0.45, '<h1 style="font-size:200px;line-height:1.2;text-align:center">Plano<br>Coração</h1>')}
     ${pop(1.0, '<p class="chega" style="font-size:48px;text-align:center;opacity:.6">chegou pra todo mundo</p>')}`)}
  ${cena(3.2, 6.4, `${pop(0.05, `<div class="off" style="flex-direction:column;text-align:center;padding:36px 30px"><span class="n" style="font-size:260px">${PCT}%</span><p style="font-size:58px">em todos os<br>planos mensais</p></div>`)}
     ${pop(0.7, precosBox, 'larga')}
     ${pop(1.2, '<p class="chega" style="font-size:42px;text-align:center;opacity:.6">pela metade, enquanto você assinar</p>')}`)}
  ${/* 07/11 (Diego): a cena da comprovação saiu e o tempo dela veio pra cá — ~5,5 s parada e legível depois de aparecer */ ''}
  ${cena(6.4, 12.8, `${pop(0.05, '<p class="titulo">pra quem é</p>')}
     ${pop(0.3, '<div class="grande"><span class="ic">♿</span><span><b style="text-transform:none">PcD</b><br><small>pessoa com deficiência</small></span></div>', 'larga')}
     ${pop(0.6, '<div class="grande"><span class="ic">👨‍👧</span><span><b>Pai, mãe ou<br>responsável</b><br><small>de criança especial</small></span></div>', 'larga')}`)}
  ${cena(12.8, 15.0, `${pop(0.05, '<p class="titulo">onde fica</p>')}
     ${pop(0.3, '<div class="caminho"><span class="bt">Planos</span><span class="seta">→</span><span class="bt az">💙 Apoie</span></div>', 'larga')}
     ${pop(0.9, `<div class="luca" style="font-size:34px;text-align:center">e na mesma área: 💙 <b>ajude o Luca</b>, filho do Diego, com um Pix · 🧱 <b>Mural de apoiadores</b></div>`, 'larga')}`)}
  ${cena(15.0, 99, `${pop(0.05, '<div style="font-size:200px;line-height:1" class="bate">💙</div>')}
     ${pop(0.3, '<p class="url" style="font-size:96px;color:#0C0C0C;text-align:center">leilaolegends.com</p>')}
     ${pop(0.7, '<div class="caminho" style="transform:scale(.8)"><span class="bt">Planos</span><span class="seta">→</span><span class="bt az">💙 Apoie</span></div>')}`)}
  </div>
<script>
const cenas=[...document.querySelectorAll('.cena')]
const ease=x=>1-Math.pow(1-Math.min(1,Math.max(0,x)),3)
const back=x=>{x=Math.min(1,Math.max(0,x));const c=1.7;return 1+(c+1)*Math.pow(x-1,3)+c*Math.pow(x-1,2)}
window.render=t=>{for(const c of cenas){const de=+c.dataset.de,ate=+c.dataset.ate,l=t-de
  const vis=l>=0&&t<ate+0.35;c.style.display=vis?'flex':'none';if(!vis)continue
  const saida=t>ate?ease((t-ate)/0.35):0;c.style.opacity=1-saida;c.style.transform='translateY('+(-80*saida)+'px)'
  for(const p of c.querySelectorAll('.pop')){const k=(l-+p.dataset.d)/0.45;p.style.opacity=ease(k*1.6);p.style.transform='translateY('+(60*(1-ease(k)))+'px) scale('+(0.7+0.3*back(k))+')'}
  for(const b of c.querySelectorAll('.bate')){const s=1+0.08*Math.max(0,Math.sin(t*6.3))**8;b.style.transform='scale('+s+')'}}}
</script>`, `
.cena{position:absolute;left:70px;right:70px;top:300px;bottom:160px;flex-direction:column;align-items:center;justify-content:center;gap:44px}
.pop{will-change:transform}.larga{align-self:stretch}
.titulo{font:700 64px Oswald;text-transform:uppercase;background:${INK};color:${GOLD};border-radius:18px;padding:6px 30px;box-shadow:6px 6px 0 ${AZUL}}
.precos .pl{font-size:42px;padding:24px 28px}.precos .pl s{font-size:34px}.precos .pl b{font-size:52px}
.grande{display:flex;align-items:center;gap:30px;background:#fff;border:6px solid ${INK};border-radius:28px;box-shadow:10px 10px 0 ${INK};padding:30px 34px;font-size:58px;line-height:1.1}
.grande .ic{flex:none;width:150px;height:150px;border:5px solid ${INK};border-radius:24px;background:${AZUL_CLARO};display:flex;align-items:center;justify-content:center;font-size:90px}
.grande b{font:700 72px Oswald;text-transform:uppercase}.grande small{font-size:42px;font-weight:800;opacity:.7}
.doc{display:flex;flex-direction:column;align-items:center;text-align:center;background:#fff;border:6px solid ${INK};border-radius:28px;box-shadow:10px 10px 0 ${INK};padding:36px 30px}
.doc .ic{font-size:150px;line-height:1}.doc b{font:700 92px/0.95 Oswald;text-transform:uppercase;margin-top:14px}.doc small{font-size:38px;font-weight:800;opacity:.65;margin-top:14px}
.carimbo{font:700 60px Oswald;text-transform:uppercase;color:#fff;background:${RED};border:6px solid ${INK};border-radius:20px;box-shadow:8px 8px 0 ${INK};padding:14px 30px;rotate:-3deg}
.caminho{display:flex;align-items:center;justify-content:center;gap:26px}
.caminho .bt{font:700 76px Oswald;text-transform:uppercase;background:#fff;border:6px solid ${INK};border-radius:22px;box-shadow:8px 8px 0 ${INK};padding:14px 34px}
.caminho .az{background:${AZUL};color:#fff}.caminho .seta{font:700 90px Oswald}
`)

// ── render ──
mkdirSync('scripts/posts', { recursive: true })
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const abre = async (html, w, h) => {
  const p = await b.newPage({ viewport: { width: w, height: h } })
  await p.setContent(html, { waitUntil: 'load' })
  await p.evaluate(() => document.fonts.ready)
  return p
}
for (const [html, h, out] of [[feed, 1350, 'scripts/posts/plano-coracao-feed.png'], [capa, 1920, 'scripts/posts/plano-coracao-reels.png']]) {
  const p = await abre(html, 1080, h)
  await p.screenshot({ path: out }); await p.close(); console.log('🖼️', out)
}
const dir = join(tmpdir(), `coracao-${process.pid}`); mkdirSync(dir, { recursive: true })
const p = await abre(video, 1080, 1920)
const total = DUR * FPS
for (let i = 0; i < total; i++) {
  await p.evaluate(t => window.render(t), i / FPS)
  await p.screenshot({ path: join(dir, `f${String(i).padStart(4, '0')}.jpg`), type: 'jpeg', quality: 92 })
}
await p.close(); await b.close()
const mp4 = 'scripts/posts/plano-coracao-reels.mp4'
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', join(dir, 'f%04d.jpg'), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-preset', 'medium', '-movflags', '+faststart', '-an', mp4])
rmSync(dir, { recursive: true, force: true })
console.log('🎬', mp4, `(${DUR}s, ${FPS} fps)`)

// ── 4. legenda ──
writeFileSync('scripts/posts/plano-coracao-legenda.txt', `💙 PLANO CORAÇÃO chegou pra todo mundo no Leilão Legends!

${PCT}% de desconto em TODOS os planos mensais, enquanto você assinar:
${PLANOS.map(([n, v]) => `${n}: de ${brl(v)} por ${brl(metade(v))}/mês`).join('\n')}

👥 Pra quem é: pessoa com deficiência (PcD) e pai, mãe ou responsável de criança especial.
📷 Como pedir: manda uma foto da carteirinha ou do laudo. O Diego confere pessoalmente e a foto é APAGADA logo depois.
🤫 Discreto: ninguém vê que é o Plano Coração.

💙 Na mesma área dá pra ajudar o Luca, filho do Diego, com um Pix. Não dá nada no jogo: é só carinho. E tem o Mural de apoiadores 🧱

👉 leilaolegends.com → Planos → 💙 Apoie

#LeilaoLegends #PlanoCoracao #PcD #Inclusao #AcessibilidadeImporta #FutebolParaTodos #JogoDeFutebol #Lendas
`)
console.log('📝 scripts/posts/plano-coracao-legenda.txt')
