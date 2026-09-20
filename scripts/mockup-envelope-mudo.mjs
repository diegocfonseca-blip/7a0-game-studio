// ─── 🙈 MOCKUP: ENVELOPE MUDO + ⏬ LEILÃO HOLANDÊS (ideias de modo, 20/09) ───
//
// O Diego pediu modos novos com o LEILÃO no centro (*"precisa ter de alguma forma
// leilão, que é o nome do jogo"*). Dos seis que mandei, ele gostou do ENVELOPE
// MUDO e reconheceu na hora: *"já tem, o envelope surpresa né… ele pode aparecer
// uma vez só no leilão… vai aparecer aleatório, pode ser no gol, no ataque ou
// outro, mas só uma vez"*. E está certo: o 🎁 Surpresa (`pickSurprise` em
// `store.tsx`) já é UM por leilão, sorteado entre TODAS as cartas do baralho.
//
// 👉 A DIFERENÇA, que é a ideia nova: o 🎁 Surpresa esconde só o NOME — a posição,
//    o clube e o ano ficam à mostra. O 🙈 MUDO esconde TUDO e entrega no lugar UMA
//    PISTA VERDADEIRA, tirada da própria carta (nacionalidade, década, continente).
//    Revela igual, no martelo, como ele mesmo disse.
//
// E o segundo mockup é o ⏬ LEILÃO HOLANDÊS, que ele não entendeu escrito —
// desenhado é uma linha: o preço cai sozinho e quem apertar primeiro leva.
//
// uso: node scripts/mockup-envelope-mudo.mjs [--saida-lista x.png] [--saida-holandes y.png]
import { chromium } from 'playwright-core'
import fs from 'node:fs'

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const b64 = f => fs.readFileSync(f).toString('base64')
const fonte = w => `data:font/woff2;base64,${b64(`scripts/fonts/oswald-latin-${w}-normal.woff2`)}`

const CREME = '#F4ECD6', INK = '#0C0C0C', OURO = '#FFC400', ROXO = '#7C3AED', VERDE = '#1B7A3D', VERM = '#C2452F'

const base = `
@font-face{font-family:Oswald;font-weight:500;src:url(${fonte(500)}) format('woff2')}
@font-face{font-family:Oswald;font-weight:700;src:url(${fonte(700)}) format('woff2')}
*{box-sizing:border-box}
body{margin:0;background:${CREME};color:${INK};font:14px/1.45 Arial,sans-serif;padding:24px}
h1{font:800 21px Oswald;margin:0 0 3px}
.sub{font-size:12.5px;color:#6b6252;margin:0 0 18px;max-width:760px}
.rot{font:800 11px Oswald;letter-spacing:1.4px;text-transform:uppercase;color:#6b6252;margin:0 0 8px}
.caixa{background:#fff;border:3px solid ${INK};border-radius:14px;box-shadow:4px 4px 0 ${INK};padding:12px 14px;margin-bottom:10px;display:flex;align-items:center;gap:12px}
.pos{border:2px solid ${INK};border-radius:999px;padding:3px 9px;font:800 10px Oswald;background:${INK};color:#fff;flex:none}
.pos.q{background:#fff;color:${INK}}
.nome{font:800 16px Oswald;margin:0}
.meta{font-size:11.5px;font-weight:700;color:rgba(0,0,0,.55);margin:2px 0 0}
.borrado{filter:blur(4px);letter-spacing:3px;user-select:none}
.lance{margin-left:auto;flex:none;display:flex;align-items:center;gap:6px}
.lance b{font:800 15px Oswald;min-width:26px;text-align:center}
.bt{width:28px;height:28px;border:2px solid ${INK};border-radius:8px;background:#fff;font:800 15px Oswald;line-height:1}
.pista{display:inline-flex;align-items:center;gap:6px;margin-top:5px;border:2px solid ${INK};border-radius:999px;padding:2px 9px;font:800 11px Oswald;background:${OURO}}
`

// ── 1) A LISTA DA LEVA ──────────────────────────────────────────────────────
const linha = (pos, nome, meta, extra = '', cor = INK) => `<div class="caixa">
  <span class="pos${pos === '?' ? ' q' : ''}">${pos}</span>
  <div style="min-width:0">
    <p class="nome" style="color:${cor}">${nome}</p>
    <p class="meta">${meta}</p>${extra}
  </div>
  <span class="lance"><button class="bt">−</button><b>0</b><button class="bt">+</button></span>
</div>`

const listaHtml = `<!doctype html><meta charset="utf-8"><style>${base}
.col{display:grid;grid-template-columns:1fr 1fr;gap:26px;align-items:start}
.topo{display:flex;align-items:center;justify-content:space-between;border:3px solid ${INK};border-radius:14px;background:${INK};color:${CREME};padding:9px 14px;margin-bottom:12px;box-shadow:4px 4px 0 rgba(0,0,0,.25)}
.topo b{font:800 15px Oswald}
.nota{font-size:11.5px;color:#6b6252;line-height:1.45;margin:8px 2px 0}
.rev{background:${INK};color:${CREME};border:3px solid ${INK};border-radius:14px;padding:12px 14px;box-shadow:4px 4px 0 rgba(0,0,0,.2)}
.rev h3{font:800 14px Oswald;margin:0 0 6px;text-transform:uppercase;letter-spacing:.5px}
.rev p{font-size:12px;margin:0;color:#ded6c2;line-height:1.5}
</style>
<h1>🙈 Envelope Mudo — como ele aparece na lista</h1>
<p class="sub">Um por leilão, sorteado em qualquer posição — igualzinho ao 🎁 Surpresa que já existe. A lista é a mesma de hoje; só entram duas cartas diferentes no meio dela.</p>
<div class="col">
  <div>
    <p class="rot">A leva, do jeito que fica</p>
    <div class="topo"><b>⚽ ATACANTES · leva 2 de 4</b><b>0:45</b></div>
    ${linha('ATA', 'Romário', 'Vasco · 2000')}
    ${linha('ATA', '🎁 <span class="borrado">Jogador</span>', 'Barcelona · 1999', '', ROXO)}
    ${linha('ATA', 'Bebeto', 'Flamengo · 1989')}
    ${linha('?', '🙈 <span class="borrado">Envelope</span>', 'clube e ano escondidos', '<span class="pista">🔎 É ARGENTINO</span>', VERM)}
    ${linha('ATA', 'Careca', 'Napoli · 1988')}
    <p class="nota">A carta <b style="color:${ROXO}">🎁 SURPRESA</b> é a de hoje: esconde só o <b>nome</b>, mas tu ainda vê que é atacante, de que clube e de que ano.<br>
    A <b style="color:${VERM}">🙈 MUDA</b> é a nova: <b>nem a posição tu vê</b>. Sobra uma pista verdadeira, tirada da própria carta.</p>
  </div>
  <div>
    <p class="rot">De onde sai a pista (tudo verdade, nada inventado)</p>
    <div class="caixa" style="display:block"><p class="nome">🔎 É ARGENTINO</p><p class="meta">a nacionalidade da carta</p></div>
    <div class="caixa" style="display:block"><p class="nome">🔎 JOGOU NOS ANOS 90</p><p class="meta">o ano da carta</p></div>
    <div class="caixa" style="display:block"><p class="nome">🔎 BRILHOU NA EUROPA</p><p class="meta">o clube da carta</p></div>
    <p class="rot" style="margin-top:16px">Na hora do martelo</p>
    <div class="rev">
      <h3>🔨 revela igual à surpresa</h3>
      <p>O envelope abre na <b>Cerimônia da Revelação</b>, junto com todos os outros — do mesmo jeito que o 🎁 Surpresa abre hoje. Ninguém descobre antes, ninguém descobre depois.</p>
    </div>
    <p class="nota">⚠️ <b>Uma regra pra tu decidir:</b> se a carta muda cair numa posição que o teu time <b>já fechou</b>, o jogo hoje <b>anula o lance e devolve a moeda</b> (é a regra de setor cheio, que já existe). Dá pra manter assim, ou deixar ela entrar como reserva. Eu manteria a devolução — é a que não deixa ninguém no prejuízo por azar.</p>
  </div>
</div>`

// ── 2) O LEILÃO HOLANDÊS ────────────────────────────────────────────────────
const quadro = (t, preco, dono, destaque) => `<div style="flex:1;min-width:0;background:#fff;border:3px solid ${INK};border-radius:16px;box-shadow:4px 4px 0 ${INK};padding:14px;text-align:center;${destaque ? `outline:4px solid ${VERDE};outline-offset:3px` : ''}">
  <p style="font:800 11px Oswald;letter-spacing:1.4px;color:#6b6252;margin:0 0 8px;text-transform:uppercase">${t}</p>
  <div style="border:3px solid ${INK};border-radius:12px;background:${INK};color:#fff;padding:10px 6px">
    <p style="font:800 11px Oswald;margin:0 0 2px;color:#bdb49e;letter-spacing:1px">ATA · ROMÁRIO</p>
    <p style="font:800 40px/1 Oswald;margin:0;color:${destaque ? '#7CE0A0' : OURO}">${preco} 🪙</p>
  </div>
  <button style="width:100%;margin-top:10px;background:${destaque ? VERDE : OURO};color:${destaque ? '#fff' : INK};border:3px solid ${INK};border-radius:12px;box-shadow:3px 3px 0 ${INK};font:800 15px Oswald;padding:10px 0;text-transform:uppercase">${destaque ? '✋ Peguei!' : 'Pegar'}</button>
  <p style="font-size:11.5px;font-weight:700;color:rgba(0,0,0,.6);margin:8px 0 0;min-height:32px">${dono}</p>
</div>`

const holandesHtml = `<!doctype html><meta charset="utf-8"><style>${base}
.fila{display:flex;gap:18px;align-items:start}
.seta{align-self:center;font:800 26px Oswald;color:#9c917c}
.nota{font-size:12.5px;color:#4a4437;line-height:1.55;margin:16px 2px 0;max-width:900px}
.regra{background:#fff;border:3px solid ${INK};border-radius:14px;box-shadow:4px 4px 0 ${INK};padding:12px 14px;margin-top:14px;max-width:900px}
.regra b{color:${VERM}}
</style>
<h1>⏬ Leilão Holandês — o preço CAI sozinho</h1>
<p class="sub">Ninguém dá lance. A carta abre cara e vai barateando na tela, segundo a segundo. Quem apertar PEGAR primeiro leva — pelo preço que estiver na tela naquele instante.</p>
<div class="fila">
  ${quadro('abre assim', '200', 'ninguém apertou.<br>tá caro demais.', false)}
  <span class="seta">→</span>
  ${quadro('4 segundos depois', '120', 'ninguém apertou ainda.<br>quem segura, paga menos…', false)}
  <span class="seta">→</span>
  ${quadro('7 segundos', '60', '<b>o Felipe apertou.</b><br>Romário é dele por 60.', true)}
</div>
<div class="regra">
  <p style="font:800 15px Oswald;margin:0 0 6px">A pegadinha é essa:</p>
  <p style="margin:0;font-size:13px;line-height:1.55">Esperar mais um segundo é <b>pagar menos</b> — e é <b>ver o outro levar na tua cara</b>. Não tem conta pra fazer, não tem envelope: é só nervo.<br>
  Se ninguém apertar até o preço chegar a zero, a carta vai pro <b>monte</b>, igual hoje.</p>
</div>
<p class="nota">⏱️ <b>E cabe no relógio.</b> Hoje são 45 segundos pra uma leva de 12 cartas. No holandês cada carta cai em ~4 segundos: 12 × 4 = <b>48 segundos</b>. Praticamente o mesmo tempo — só que em vez de todo mundo mexendo em 12 envelopes ao mesmo tempo, é uma carta de cada vez, todo mundo olhando a mesma coisa.</p>`

const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
for (const [html, saida, w] of [[listaHtml, arg('saida-lista', 'mockup-envelope-mudo.png'), 1080], [holandesHtml, arg('saida-holandes', 'mockup-holandes.png'), 1000]]) {
  const p = await b.newPage({ viewport: { width: w, height: 700 }, deviceScaleFactor: 2 })
  await p.setContent(html); await p.waitForTimeout(300)
  await p.screenshot({ path: saida, fullPage: true })
  console.log(`${saida} · ${(fs.statSync(saida).size / 1024) | 0} KB`)
}
await b.close()
