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
// 🎯 CORREÇÃO DELE, e é ela que faz a peça fechar: *"tem que entrar na POSIÇÃO que
//    é a do leilão no momento que ele entra. Então a dica já é a posição do momento,
//    que tão todos listados, mais a dica que o jogo vai dar"*.
//    Ou seja: a carta muda cai DENTRO da leva do setor que está rolando — se a leva
//    é de atacantes, ela é atacante, e isso a própria lista já diz. Esconde-se o
//    NOME, o CLUBE e o ANO; a posição nunca foi pra esconder.
//    👉 E isso mata o único risco que eu tinha levantado: não existe mais "e se ela
//       cair num setor que o time já fechou" — ela é sempre do setor da vez.
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
<p class="sub">Um por leilão, sorteado em qualquer posição — igualzinho ao 🎁 Surpresa que já existe. Ela cai <b>na leva do setor da vez</b>, então a posição tu já sabe: o que some é o nome, o clube e o ano.</p>
<div class="col">
  <div>
    <p class="rot">A leva, do jeito que fica</p>
    <div class="topo"><b>⚽ ATACANTES · leva 2 de 4</b><b>0:45</b></div>
    ${linha('ATA', 'Romário', 'Vasco · 2000')}
    ${linha('ATA', '🎁 <span class="borrado">Jogador</span>', 'Barcelona · 1999', '', ROXO)}
    ${linha('ATA', 'Bebeto', 'Flamengo · 1989')}
    ${linha('ATA', '🙈 <span class="borrado">Envelope</span>', 'clube e ano escondidos', '<span class="pista">🔎 É ARGENTINO</span>', VERM)}
    ${linha('ATA', 'Careca', 'Napoli · 1988')}
    <p class="nota">A carta <b style="color:${ROXO}">🎁 SURPRESA</b> é a de hoje: esconde só o <b>nome</b> — clube e ano ficam à mostra.<br>
    A <b style="color:${VERM}">🙈 MUDA</b> é a nova: esconde <b>nome, clube e ano</b>. A <b>posição tu já sabe</b>, porque ela cai na leva do setor da vez — e no lugar do resto vem uma pista verdadeira.</p>
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
    <p class="nota">✅ <b>Ela entra na leva do setor da vez</b> — se a leva é de atacantes, ela é atacante. Por isso a posição não é segredo: a própria lista já entrega.<br>Isso fecha a única brecha que existia: <b>não tem como cair numa posição que teu time já fechou</b>, então ninguém perde moeda por azar.</p>
  </div>
</div>`

// ── 2) O LEILÃO HOLANDÊS ────────────────────────────────────────────────────
// 🧱 REAPROVEITA TUDO (ordem dele, 20/09): *"quero usar tudo parecido com o que já
//    funciona hoje no motor e visual e etc do nosso leilão"*. Então: a MESMA linha
//    de carta (selo da posição + nome + clube · ano), o MESMO cabeçalho de setor
//    com relógio, a MESMA Cerimônia da Revelação no fim e o MESMO monte pra quem
//    sobrar. O que muda é UMA coisa: no lugar do −/+ do envelope, entra o preço
//    caindo e o botão PEGAR.
// 💰 E COMEÇA EM 100: *"tem que começar com 100 pra qualquer jogador, até porque
//    ninguém tem 200 — todo mundo começa com 100"*. Conferido no `store.tsx`
//    (`m.money = 100` no rápido/online). O basquete começa com 50, então lá o
//    preço abre em 50: a regra é **abre no orçamento inicial da sala**.
// 🙈 E o preço é IGUAL pra toda carta de propósito — se ele saísse do valor real,
//    entregaria o nível, que é o segredo que só abre na Cerimônia.
const quadro = (t, preco, dono, destaque) => `<div style="flex:1;min-width:0;background:#fff;border:3px solid ${INK};border-radius:16px;box-shadow:4px 4px 0 ${INK};padding:14px;${destaque ? `outline:4px solid ${VERDE};outline-offset:3px` : ''}">
  <p style="font:800 11px Oswald;letter-spacing:1.4px;color:#6b6252;margin:0 0 9px;text-transform:uppercase;text-align:center">${t}</p>
  <div style="display:flex;align-items:center;gap:10px;border-bottom:2px solid #e6dcc4;padding-bottom:10px;margin-bottom:10px">
    <span class="pos">ATA</span>
    <div><p class="nome">Romário</p><p class="meta">Vasco · 2000</p></div>
  </div>
  <p style="font:800 ${destaque ? 46 : 42}px/1 Oswald;margin:0;text-align:center;color:${destaque ? VERDE : INK}">${preco} 🪙</p>
  <button style="width:100%;margin-top:10px;background:${destaque ? VERDE : OURO};color:${destaque ? '#fff' : INK};border:3px solid ${INK};border-radius:12px;box-shadow:3px 3px 0 ${INK};font:800 15px Oswald;padding:10px 0;text-transform:uppercase">${destaque ? '✋ Peguei!' : 'Pegar'}</button>
  <p style="font-size:11.5px;font-weight:700;color:rgba(0,0,0,.6);margin:8px 0 0;min-height:32px;text-align:center">${dono}</p>
</div>`

const holandesHtml = `<!doctype html><meta charset="utf-8"><style>${base}
.fila{display:flex;gap:18px;align-items:start}
.seta{align-self:center;font:800 26px Oswald;color:#9c917c}
.nota{font-size:12.5px;color:#4a4437;line-height:1.55;margin:16px 2px 0;max-width:940px}
.regra{background:#fff;border:3px solid ${INK};border-radius:14px;box-shadow:4px 4px 0 ${INK};padding:12px 14px;margin-top:14px;max-width:940px}
.regra b{color:${VERM}}
.topo{display:flex;align-items:center;justify-content:space-between;border:3px solid ${INK};border-radius:14px;background:${INK};color:${CREME};padding:9px 14px;margin-bottom:14px;box-shadow:4px 4px 0 rgba(0,0,0,.25);max-width:940px}
.topo b{font:800 15px Oswald}
</style>
<h1>⏬ Leilão Holandês — o preço CAI sozinho</h1>
<p class="sub">Ninguém dá lance. A carta abre em <b>100</b> (o que todo mundo tem no bolso) e vai barateando na tela. Quem apertar PEGAR primeiro leva, pelo preço daquele instante. <b>Mesma carta, mesmo cabeçalho, mesma Cerimônia no fim</b> — só o −/+ do envelope é que sai.</p>
<div class="topo"><b>⚽ ATACANTES · carta 4 de 12</b><b>0:04</b></div>
<div class="fila">
  ${quadro('abre assim', '100', 'ninguém apertou.<br>é o bolso inteiro.', false)}
  <span class="seta">→</span>
  ${quadro('2 segundos depois', '55', 'ninguém apertou ainda.<br>quem segura, paga menos…', false)}
  <span class="seta">→</span>
  ${quadro('3 segundos e meio', '25', '<b>o Felipe apertou.</b><br>Romário é dele por 25.', true)}
</div>
<div class="regra">
  <p style="font:800 15px Oswald;margin:0 0 6px">A pegadinha é essa:</p>
  <p style="margin:0;font-size:13px;line-height:1.55">Esperar mais um segundo é <b>pagar menos</b> — e é <b>ver o outro levar na tua cara</b>. Não tem conta pra fazer, não tem envelope: é só nervo.<br>
  E o nível continua <b>escondido até a Cerimônia</b>, como sempre: tu aperta sem saber se é craque ou perna-de-pau.</p>
</div>
<p class="nota">⏱️ <b>E não estica o jogo.</b> Numa sala de 8, o leilão inteiro hoje leva <b>6min</b> (levas de 12 a cada 45s). No holandês, com ~4s por carta, dá <b>6min12s</b>. Praticamente o mesmo — só que em vez de todo mundo mexendo em 12 envelopes ao mesmo tempo, é uma carta de cada vez, todo mundo olhando a mesma coisa.</p>
<p class="nota">💰 <b>Por que 100:</b> é com isso que todo mundo começa o rápido/online. Então a regra é "abre no orçamento inicial da sala" — no basquete, que começa com 50, a carta abre em 50 sozinha.</p>`

const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
for (const [html, saida, w] of [[listaHtml, arg('saida-lista', 'mockup-envelope-mudo.png'), 1080], [holandesHtml, arg('saida-holandes', 'mockup-holandes.png'), 1000]]) {
  const p = await b.newPage({ viewport: { width: w, height: 700 }, deviceScaleFactor: 2 })
  await p.setContent(html); await p.waitForTimeout(300)
  await p.screenshot({ path: saida, fullPage: true })
  console.log(`${saida} · ${(fs.statSync(saida).size / 1024) | 0} KB`)
}
await b.close()
