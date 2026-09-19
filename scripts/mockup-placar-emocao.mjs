// 🖼️ MOCKUP — cabeçalho da carreira MENOR e placar MAIOR (+ emoção no apito final)
//
// Pedido do Diego (19/09), olhando a aba Jogos no celular: *"esse header aí onde tá
// temporada 28, rodada tal, torcidômetro etc. me parece que está muito grande. Poderia
// diminuir um cadinho só dele, e com isso aumentar mais a área do placar, ali onde
// mostra 'soou o apito final' e outras frases — precisamos ampliar também as frases.
// E gostaria ainda de dar mais emoção a esse placar completo"*.
//
// ANTES = medidas de hoje (online-match-visual.css: hero 176px, narração 13px/36px,
// escudo 76px, nome 15px, número 32px, goleadores 12px).
// DEPOIS = hero ~120px · narração 17px/46px · escudo 96px · nome 18px · número 44px ·
// goleadores 14px · e no apito final uma FAIXA DE RESULTADO (verde vitória · vermelha
// derrota · dourada empate), escudo do vencedor com brilho e o do perdedor apagado.
//
// Rodar (da raiz do repo): node scripts/mockup-placar-emocao.mjs [saida.png]
import { chromium } from 'playwright-core'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const IMG = `file://${ROOT}/src/escalacao/img`
const FONT = `file://${ROOT}/scripts/fonts`
const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6', VERDE = '#1B7A3D', VERM = '#C2452F'

const escudoDragao = (s) => `<svg width="${s}" height="${s}" viewBox="0 0 100 100"><path d="M50 4 92 18v34c0 24-18 38-42 44C26 90 8 76 8 52V18z" fill="#1c6b2f" stroke="#0C0C0C" stroke-width="5"/><path d="M50 12 84 23v29c0 19-14 30-34 35C30 82 16 71 16 52V23z" fill="#2f9a45"/><rect x="42" y="12" width="16" height="76" fill="#0C0C0C" opacity=".85"/><text x="50" y="64" font-size="34" text-anchor="middle">🐉</text></svg>`

function hero(depois) {
  if (!depois) return `
  <div class="hero a">
    <div class="top">
      <div>
        <div class="kick">TEMPORADA 28 · ⚽ LIGA LEGENDS</div>
        <div class="rod">Rodada <b>5</b><span> / 38</span></div>
        <div class="div">Várzea</div>
      </div>
      <div class="badges"><span class="pos">🏅 20º</span><span class="coins">💰 228</span></div>
    </div>
    <div class="torc"><span class="face">🥹</span><div class="bar"><div class="lab">TORCIDA</div><div class="trk"><i style="width:20%"></i></div></div><b>20%</b></div>
    <p class="hist">14º lugar  ·  13º lugar  ·  9º lugar</p>
    <div class="prog"><i style="width:13%"></i></div>
  </div>`
  return `
  <div class="hero d">
    <div class="top">
      <div>
        <div class="kick">TEMPORADA 28 · ⚽ LIGA LEGENDS</div>
        <div class="rod">Rodada <b>5</b><span> / 38</span> <em>· Várzea</em></div>
      </div>
      <div class="badges"><span class="pos">🏅 20º</span><span class="coins">💰 228</span></div>
    </div>
    <div class="torc"><span class="face">🥹</span><span class="lab">TORCIDA</span><div class="trk"><i style="width:20%"></i></div><b>20%</b><small>14º · 13º · 9º</small></div>
    <div class="prog"><i style="width:13%"></i></div>
  </div>`
}

function placar(depois, res = 'derrota', semFaixa = false) {
  const fraseFim = { vitoria: '📢 Apito final — VITÓRIA! Três pontos no bolso 🎉', derrota: '📢 Apito final — derrota por 1 a 2. Bola pra frente 😤', empate: '📢 Apito final — empate, um ponto cada 🤝' }[res]
  const faixa = { vitoria: ['v', '🎉 VITÓRIA! Três pontos no bolso — a torcida foi embora cantando'], derrota: ['r', '😤 DERROTA — a torcida saiu calada. Bola pra frente na próxima'], empate: ['e', '🤝 EMPATE — um ponto cada, ninguém saiu feliz'] }[res]
  const win = res === 'vitoria' ? 'h' : res === 'derrota' ? 'a' : ''
  return `
  <section class="score ${depois ? 'd' : 'a'}">
    <div class="narr${semFaixa ? ' two' : ''}">${semFaixa ? fraseFim : '📢 Soou o apito final — é isso aí!'}</div>
    ${depois && !semFaixa ? `<div class="res ${faixa[0]}">${faixa[1]}</div>` : ''}
    <div class="duel">
      <div class="team ${win === 'h' ? 'win' : win === 'a' ? 'lose' : ''}" style="border-color:${GOLD}"><div class="crest"><img src="${IMG}/neymarzetti-escudo.webp"></div><strong>Neymarzetti</strong><small>VOCÊ</small></div>
      <div class="nums"><small><i></i>FIM</small><strong>1 <span>×</span> 2</strong></div>
      <div class="team ${win === 'a' ? 'win' : win === 'h' ? 'lose' : ''}" style="border-color:#3A7CA5"><div class="crest">${escudoDragao(depois ? 96 : 76)}</div><strong>Dragão Imperial</strong><small>RIVAL</small></div>
    </div>
    <div class="scorers"><div><p>${depois ? '⚽ ' : ''}Petit <b>90+1′</b></p></div><div><p>${depois ? '⚽ ' : ''}Clodoaldo Matador <b>33′</b></p><p>${depois ? '⚽ ' : ''}Rodrigo Souto <b>59′</b></p></div></div>
  </section>`
}

const css = `
@font-face{font-family:Oswald;font-weight:400;src:url(${FONT}/oswald-latin-400-normal.woff2)}
@font-face{font-family:Oswald;font-weight:500;src:url(${FONT}/oswald-latin-500-normal.woff2)}
@font-face{font-family:Oswald;font-weight:600;src:url(${FONT}/oswald-latin-600-normal.woff2)}
@font-face{font-family:Oswald;font-weight:700;src:url(${FONT}/oswald-latin-700-normal.woff2)}
*{box-sizing:border-box}body{margin:0;background:#d9cfb2;font-family:system-ui,sans-serif;color:${INK}}
.wrap{display:flex;gap:28px;padding:22px;justify-content:center;align-items:flex-start}
.col{width:412px}.col h1{font:700 22px Oswald;text-transform:uppercase;margin:0 0 4px;letter-spacing:.5px}.col h1 span{font-size:12px;color:#5a5647;display:block;font-family:system-ui;font-weight:700;text-transform:none;letter-spacing:0}
.phone{background:${CREME};padding:14px;border:4px solid ${INK};border-radius:22px;box-shadow:5px 6px 0 ${INK};min-height:640px}
.mm{font:700 10.5px system-ui;color:#fff;background:#7C3AED;border-radius:6px;padding:2px 7px;display:inline-block;margin:6px 0 8px}
/* ---- HERO ---- */
.hero{position:relative;overflow:hidden;color:#fff;border:3px solid ${INK};border-radius:16px;box-shadow:3px 3px 0 ${INK};background:linear-gradient(0deg,rgba(3,13,9,.94),rgba(3,13,9,.12) 72%),url(${IMG}/online-estadio-v25.webp) center/cover;display:flex;flex-direction:column;justify-content:flex-end;text-shadow:0 2px 4px #000;margin-bottom:10px}
.hero.a{min-height:176px}.hero.d{min-height:118px}
.hero .top{display:flex;justify-content:space-between;align-items:flex-start;gap:8px}
.hero.a .top{padding:12px 14px 15px}.hero.d .top{padding:9px 12px 6px}
.kick{font-size:9.5px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:${GOLD}}
.rod{font:700 18px/1 Oswald;margin-top:2px}.rod b{font-size:21px}.rod span{font-size:12px;opacity:.5}.rod em{font-style:normal;font-size:12px;opacity:.75;font-weight:600}
.hero.d .rod{font-size:17px;margin-top:1px}.hero.d .rod b{font-size:20px}
.div{font-size:9px;font-weight:700;color:rgba(255,255,255,.7);margin-top:4px}
.badges{display:flex;align-items:center;gap:7px;flex-shrink:0}.badges span{font:800 12px Oswald;border-radius:999px;padding:3px 9px;white-space:nowrap}
.pos{border:2px solid rgba(255,255,255,.25)}.coins{background:${GOLD};color:${INK};border:2px solid ${INK};box-shadow:2px 2px 0 ${INK}}
.hero.d .badges span{font-size:11px;padding:2px 8px}
.torc{display:flex;align-items:center;gap:8px}
.hero.a .torc{padding:0 14px 12px}.hero.a .torc .face{font-size:20px}.hero.a .torc .bar{flex:1}.hero.a .torc .lab{font-size:8.5px;font-weight:800;letter-spacing:.5px;color:rgba(255,255,255,.5)}.hero.a .torc b{font:700 13px Oswald}
.trk{height:6px;border-radius:4px;background:rgba(255,255,255,.15);overflow:hidden;margin-top:2px}.trk i{display:block;height:100%;background:${VERM}}
.hero.d .torc{padding:0 12px 9px;gap:6px}.hero.d .torc .face{font-size:15px}.hero.d .torc .lab{font-size:8px;font-weight:800;letter-spacing:.5px;color:rgba(255,255,255,.55)}.hero.d .torc .trk{flex:1;margin:0;height:5px}.hero.d .torc b{font:700 12px Oswald}.hero.d .torc small{font-size:8px;font-weight:700;color:rgba(255,255,255,.5);white-space:nowrap}
.hist{padding:0 14px 12px;margin:-8px 0 0;font-size:8.5px;font-weight:700;color:rgba(255,255,255,.5)}
.prog{position:absolute;left:0;bottom:0;height:6px;width:100%;background:#2b2721}.prog i{display:block;height:100%;background:linear-gradient(90deg,${GOLD},#ffde5c)}
/* ---- PLACAR ---- */
.score{position:relative;color:${CREME};border:3px solid ${INK};border-radius:18px;overflow:hidden;box-shadow:4px 5px 0 ${INK};background:radial-gradient(ellipse at 50% 0,rgba(255,196,0,.13),transparent 65%),linear-gradient(120deg,rgba(7,30,21,.88),rgba(4,15,12,.92)),url(${IMG}/online-estadio-v25.webp) center/cover;margin-bottom:12px}
.narr{text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-family:Oswald;font-weight:700;background:#0c0c0ca8;letter-spacing:.035em;border-bottom:1px solid #f4ecd633}
.score.a .narr{height:36px;line-height:36px;font-size:13px;padding:0 10px}
.score.d .narr{height:46px;line-height:46px;font-size:17px;padding:0 12px}
.score.d .narr.two{height:auto;min-height:46px;line-height:1.25;padding:9px 12px;white-space:normal;font-size:17px}
.res{font:700 13px/1.25 Oswald;text-align:center;padding:8px 12px;letter-spacing:.02em;border-bottom:1px solid #0006}
.res.v{background:${VERDE};color:#fff}.res.r{background:${VERM};color:#fff}.res.e{background:${GOLD};color:${INK}}
.duel{display:grid;align-items:center;gap:8px}
.score.a .duel{grid-template-columns:minmax(0,1fr) 88px minmax(0,1fr);padding:16px 8px}
.score.d .duel{grid-template-columns:minmax(0,1fr) 98px minmax(0,1fr);padding:18px 8px 14px}
.team{text-align:center;min-width:0;border-bottom:4px solid;padding-bottom:8px}
.team strong{display:block;font:700 15px/1.3 Oswald;overflow-wrap:anywhere;margin-bottom:5px}.team small{display:block;font:700 10px/1.3 Oswald;opacity:.8}
.score.d .team strong{font-size:18px}.score.d .team small{font-size:11px}
.crest{display:flex;align-items:center;justify-content:center;margin-bottom:6px;filter:drop-shadow(0 5px 5px #0008)}
.score.a .crest{height:76px}.score.a .crest img{height:76px}
.score.d .crest{height:96px}.score.d .crest img{height:96px}
.score.d .team.win .crest{filter:drop-shadow(0 0 14px ${GOLD}) drop-shadow(0 5px 5px #0008)}
.score.d .team.lose .crest{filter:grayscale(.75) brightness(.6) drop-shadow(0 5px 5px #0008)}
.score.d .team.lose strong,.score.d .team.lose small{opacity:.6}
.nums{background:linear-gradient(#fff9e7,#f4ecd6);color:${INK};border:3px solid ${INK};border-radius:12px;padding:8px 2px 12px;text-align:center;box-shadow:3px 4px 0 ${INK};font-family:Oswald;font-variant-numeric:tabular-nums}
.nums small{display:block;font-weight:700;font-size:14px}.nums small i{display:inline-block;width:7px;height:7px;border-radius:99px;background:${VERDE};margin-right:5px;vertical-align:1px}
.nums strong{display:block;font-size:32px;line-height:1.5}.nums span{font-size:18px;color:#b8b0a0}
.score.d .nums strong{font-size:44px;line-height:1.3}.score.d .nums span{font-size:22px}.score.d .nums small{font-size:15px}
.scorers{display:grid;grid-template-columns:1fr 1fr;gap:16px;padding:10px 12px;border-top:1px solid #59624d;min-height:60px;background:#0c0c0c30;font-size:12px}.scorers p{margin:0 0 3px}
.score.d .scorers{font-size:14px;padding:11px 14px}
/* resto da tela, só pra dar escala */
.ctl{border:3px solid ${INK};border-radius:16px;background:${CREME};padding:10px;box-shadow:3px 3px 0 ${INK};display:grid;grid-template-columns:1fr 1fr 1.4fr;gap:8px;margin-bottom:10px}
.ctl span{border:3px solid ${INK};border-radius:10px;padding:9px;text-align:center;font:700 13px Oswald;background:#fff}.ctl .on{background:${VERDE};color:#fff}.ctl .y{background:${GOLD}}
.ctl2{grid-template-columns:2fr 1fr}.ctl2 span{font-size:15px;padding:12px}
.ghost{height:60px;border:3px dashed #b8ae92;border-radius:12px;display:flex;align-items:center;justify-content:center;color:#8a8266;font:700 12px Oswald}
.legend{margin:0 0 0;font-size:12px;line-height:1.5;color:#3d3a30;background:#fff;border:3px solid ${INK};border-radius:12px;padding:10px 12px;box-shadow:3px 3px 0 ${INK}}
.legend b{color:${INK}}
`

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body><div class="wrap">
<div class="col"><h1>Antes <span>como está hoje no celular</span></h1><div class="phone">
  ${hero(false)}${placar(false)}
  <div class="ctl"><span class="on">MANUAL</span><span>AUTO</span><span class="y">Normal ⌄</span></div>
  <div class="ctl ctl2"><span class="y">▶ Próxima rodada</span><span>PULAR</span></div>
  <div class="ghost">⬇ tática · elenco…</div>
</div></div>
<div class="col"><h1>Depois <span>header 1/3 menor · placar e frases maiores · faixa de resultado</span></h1><div class="phone">
  ${hero(true)}${placar(true, 'derrota')}
  <div class="ctl"><span class="on">MANUAL</span><span>AUTO</span><span class="y">Normal ⌄</span></div>
  <div class="ctl ctl2"><span class="y">▶ Próxima rodada</span><span>PULAR</span></div>
  <div class="ghost">⬇ tática · elenco…</div>
</div>
<p class="legend" style="margin-top:12px"><b>O que muda:</b> header 176 → ~120px (rodada e divisão na mesma linha; histórico da torcida vira "14º · 13º · 9º" ao lado da barra) · frase do apito 13 → 17px · escudos 76 → 96px · nomes 15 → 18px · placar 32 → 44px · goleadores 12 → 14px com ⚽.<br><b>Emoção no apito final:</b> faixa colorida com o resultado (verde VITÓRIA · vermelha DERROTA · dourada EMPATE, frases variadas), escudo de quem ganhou brilha, o de quem perdeu apaga. Durante o jogo a faixa não existe — nada de spoiler.</p>
</div>
<div class="col" style="width:412px"><h1>Sem faixa <span>o resultado vai na própria frase do apito · escudo de quem ganhou brilha</span></h1><div class="phone" style="min-height:0">
  ${placar(true, 'derrota', true)}
  <div style="height:8px"></div>
  ${placar(true, 'vitoria', true).replace('1 <span>×</span> 2', '3 <span>×</span> 2')}
</div></div>
</div></body></html>`

// 📁 a página vai pra um arquivo e abre por file:// — montada em memória (setContent)
// o Chromium bloqueia escudo/estádio/fonte locais e o mockup sai sem arte.
const out = process.argv[2] ?? 'mockup-placar-emocao.png'
const htmlPath = path.join(path.dirname(path.resolve(out)), 'mockup-placar-emocao.html')
const { writeFileSync } = await import('node:fs')
writeFileSync(htmlPath, html)
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1360, height: 900 }, deviceScaleFactor: 2 })
await p.goto(`file://${htmlPath}`, { waitUntil: 'networkidle' })
await p.evaluate(() => document.fonts.ready)
await p.screenshot({ path: process.argv[2] ?? 'mockup-placar-emocao.png', fullPage: true })
await b.close()
console.log('ok →', process.argv[2] ?? 'mockup-placar-emocao.png')
