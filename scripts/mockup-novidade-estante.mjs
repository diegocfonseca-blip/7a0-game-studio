// ─── 🏅 MOCKUP: A NOVIDADE DA SALA ONLINE (estante de troféus) ──────────────
//
// Diego 23/08: *"quero mockup da novidade da sala normal"*, e antes disso:
// *"vamos começar com calma.. uma coisa de cada vez. Primeiro vamos lançar pra
// salas normais as coisas novas que falamos aqui das pílulas e etc, e até pra eu
// testar também"*.
//
// Então ESTE post é só da SALA NORMAL (rápido online). A 🏆 Minhas Ligas fica pra
// depois — o nome dela já está decidido (ver `docs/pendencias.md`), mas não entra
// neste anúncio.
//
// O post mostra as TELAS DE VERDADE (prints tirados do jogo rodando), não desenho
// à mão: assim o que a pessoa vê no post é o que ela acha no jogo.
//
//   node scripts/mockup-novidade-estante.mjs \
//     --fechada /tmp/bar-fechada.png --rank /tmp/bar-rank.png --estante /tmp/bar-estante.png \
//     --saida /tmp/novidade-estante.png
//
// Sem os prints ele ainda roda (deixa a moldura vazia com o rótulo), mas o post
// bom é COM eles.
import { chromium } from 'playwright-core'
import fs from 'node:fs'
import path from 'node:path'

const arg = (n, d = '') => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const o = {
  fechada: arg('fechada'), rank: arg('rank'), estante: arg('estante'),
  saida: arg('saida', 'novidade-estante.png'),
}
const b64 = p => fs.readFileSync(p).toString('base64')
const img = p => (p && fs.existsSync(p)) ? `data:image/${path.extname(p).slice(1)};base64,${b64(p)}` : ''
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(`scripts/fonts/oswald-latin-${w}-normal.woff2`)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const INK = '#0C0C0C', GOLD = '#FFC400', RED = '#C2452F', GREEN = '#1B7A3D'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'

const tela = (src, rot) => `
<div style="flex:1;min-width:0">
  <div style="border:3px solid ${INK};border-radius:14px;overflow:hidden;box-shadow:4px 4px 0 ${INK};background:#F4ECD6;aspect-ratio:400/780;display:flex;align-items:center;justify-content:center">
    ${src ? `<img src="${src}" style="width:100%;height:100%;object-fit:cover;object-position:bottom;display:block">`
          : `<span style="${OSW};font-size:12px;opacity:.45">print aqui</span>`}
  </div>
  <p style="${OSW};font-weight:600;font-size:11.5px;text-align:center;margin:7px 0 0;color:rgba(12,12,12,.62)">${rot}</p>
</div>`

const item = (emoji, titulo, txt) => `
<div style="display:flex;gap:10px;align-items:flex-start;padding:11px 0;border-bottom:2px solid rgba(12,12,12,.08)">
  <span style="font-size:22px;line-height:1;flex:none">${emoji}</span>
  <div style="min-width:0">
    <p style="${OSW};font-size:15px;margin:0;text-transform:uppercase">${titulo}</p>
    <p style="font-size:13px;line-height:1.42;color:rgba(12,12,12,.68);margin:3px 0 0;font-weight:600">${txt}</p>
  </div>
</div>`

const html = `<style>${FONTES}
*{box-sizing:border-box}
body{margin:0;background:#F4ECD6;color:${INK};font-family:system-ui,-apple-system,sans-serif;padding:26px 22px 20px;width:860px}
.pill{display:inline-block;background:${GOLD};border:3px solid ${INK};border-radius:999px;padding:7px 17px;${OSW};font-size:13.5px;text-transform:uppercase;letter-spacing:.09em;box-shadow:3px 3px 0 ${INK}}
h1{${OSW};font-weight:700;font-size:52px;line-height:1.02;text-transform:uppercase;margin:16px 0 0}
h1 .r{color:${RED}}
.lead{font-size:17px;line-height:1.45;color:rgba(12,12,12,.72);margin-top:14px;max-width:760px;font-weight:600}
.card{border:4px solid ${INK};border-radius:20px;box-shadow:6px 6px 0 ${INK};background:#fff;padding:16px 18px;margin-top:20px}
.tit{background:${INK};color:#fff;${OSW};font-size:15px;text-transform:uppercase;letter-spacing:.13em;padding:9px 15px;border-radius:11px;display:inline-block}
.telas{display:flex;gap:14px;margin-top:16px}
.rodape{display:flex;align-items:center;justify-content:space-between;margin-top:20px;padding:0 4px}
.marca{${OSW};font-size:21px;display:flex;align-items:center;gap:8px}
.marca span{color:${RED}}
.site{font-size:13.5px;color:rgba(12,12,12,.42);font-weight:700}
</style>
<div class="pill">📣 Novidade · sala online</div>
<h1>A SALA AGORA<br><span class="r">GUARDA</span> TUDO</h1>
<p class="lead">Toda partida online já anotava o campeão, o artilheiro e o lanterna — mas ninguém via. Agora tem um <b>menu embaixo</b>, do mesmo jeito do Modo Carreira, com o histórico da sala inteirinho.</p>

<div class="card">
  <div class="tit">🔽 O que tem na barra</div>
  ${item('🏆', 'Rank', 'Quem manda na sala, somando as temporadas. <b>Só a galera pontua — bot não entra.</b>')}
  ${item('🏅', 'Estante', 'Os troféus de cada um empilhados: liga, copa e artilharia. E o <b>🙈 Troféu Mico</b> pro lanterna, com zoeira nova a cada temporada.')}
  ${item('📜', 'Temporadas', 'Campeão, campeão da copa e artilheiro de cada partida que rolou aqui, do mais novo pro mais velho.')}
  <div style="display:flex;gap:10px;align-items:flex-start;padding:11px 0">
    <span style="font-size:22px;line-height:1;flex:none">🔕</span>
    <div><p style="${OSW};font-size:15px;margin:0;text-transform:uppercase">Não atrapalha o jogo</p>
    <p style="font-size:13px;line-height:1.42;color:rgba(12,12,12,.68);margin:3px 0 0;font-weight:600">A barra <b>começa fechada</b> e só abre quando você toca. Nada tapa a partida rolando.</p></div>
  </div>
</div>

<div class="telas">
  ${tela(img(o.fechada), 'a barra fica embaixo, fechada')}
  ${tela(img(o.rank), '🏆 quem lidera a sala')}
  ${tela(img(o.estante), '🏅 a estante da resenha')}
</div>

<div class="card" style="background:linear-gradient(105deg,#FFF3C4,#FFE79A);margin-top:18px">
  <p style="${OSW};font-size:16px;margin:0;text-transform:uppercase">⏳ Uma coisa de cada vez</p>
  <p style="font-size:13.5px;line-height:1.45;color:rgba(12,12,12,.7);margin:5px 0 0;font-weight:600">
    Isto é o começo: a sala rápida <b>some</b> quando a galera sai, então a estante dela vale por aquela sala.
    Em breve chega o <b>🏆 Minhas Ligas</b> — o campeonato que <b>fica guardado</b>, com dia e hora marcados e a pontuação do jeito que vocês combinarem.
  </p>
</div>

<div class="rodape">
  <div class="marca">⚽ Leilão <span>Legends</span></div>
  <div class="site">leilaolegends.com</div>
</div>`

const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const page = await browser.newPage({ viewport: { width: 860, height: 1400 }, deviceScaleFactor: 2 })
await page.setContent(html, { waitUntil: 'load' })
await page.evaluate(() => document.fonts.ready)
await page.screenshot({ path: o.saida, fullPage: true })
await browser.close()
console.log(`${o.saida} · ${(fs.statSync(o.saida).size / 1024).toFixed(0)} KB`)
