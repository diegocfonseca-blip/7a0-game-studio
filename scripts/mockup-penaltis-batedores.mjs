// ─── 🎯 MOCKUP: PÊNALTIS COM OS BATEDORES ────────────────────────────────────
//
// Pedido do Diego (24/09): *"quero uma nova ideia de arte pros pênaltis, mockup
// também. Tô achando sem graça demais. Poderia também aparecer os jogadores que
// batem o pênalti de alguma forma que não aumentasse também o tamanho do modal
// demais. Pense aí"*.
//
// ⚖️ AS REGRAS QUE ESTE DESENHO RESPEITA (todas dele, todas já gravadas):
//   · 🙈 NADA DO FUTURO (24/09): só aparece cobrança que já foi batida + a da vez.
//     O batedor que vem depois NÃO aparece antes — isso seria spoiler de novo.
//   · 🎭 UM TEATRO SÓ (21/09): quem conta o lance é o PALCO. As bolinhas embaixo
//     são só o placar — não repetem o "GOL!" por escrito.
//   · 🎙️ NADA DE CONFETE NEM FAIXA COLORIDA (19/09): a emoção é o LANCE — quem
//     bateu, contra quem, e o que aconteceu.
//   · 📏 NÃO CRESCE O MODAL: o palco ENTRA NO LUGAR da linha "Uma cobrança de cada
//     vez…", e o nome do batedor vai DENTRO da bolinha (as iniciais), que já existe.
//
// uso: node scripts/mockup-penaltis-batedores.mjs  →  mockups/penaltis-batedores.png
import { chromium } from 'playwright-core'
import fs from 'node:fs'

const f = w => `data:font/woff2;base64,${fs.readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')}`

// ── uma disputa de mentira, só pra desenhar (nomes do baralho de verdade) ──
const A = { nome: 'WFP Bahia 88', cor: '#C2452F', goleiro: 'Rogério Ceni',
  batem: ['Adriano Imperador', 'Djalminha', 'Edmundo', 'Juninho', 'Rivaldo', 'Marcelinho'] }
const B = { nome: 'São Luiz FC', cor: '#0E3E86', goleiro: 'Marcos',
  batem: ['Romário', 'Zico', 'Sócrates', 'Neto', 'Alex', 'Ronaldinho'] }
// 🔤 AS INICIAIS de quem bateu — e elas NÃO PODEM SE REPETIR no mesmo time.
//    Nome composto → 1ª letra de cada palavra (Adriano Imperador → AI). Nome de uma
//    palavra só → as 2 primeiras letras (Zico → ZI). Se dois do MESMO time caírem na
//    mesma sigla (Romário e Ronaldinho, os dois "RO"), o segundo troca a 2ª letra
//    pela próxima consoante do nome que ainda não foi usada (Ronaldinho → RN). Duas
//    bolinhas iguais na mesma linha seria dizer que o mesmo cara bateu duas vezes.
const siglaBase = n => { const ps = n.split(/\s+/); return (ps.length > 1 ? ps[0][0] + ps[1][0] : n.slice(0, 2)).toUpperCase() }
const siglasDoTime = nomes => {
  const usadas = new Set(), out = {}
  for (const n of nomes) {
    let s = siglaBase(n)
    if (usadas.has(s)) {
      const letras = n.normalize('NFD').replace(/[^A-Za-z]/g, '').toUpperCase()
      for (let k = 2; k < letras.length && usadas.has(s); k++) if (!'AEIOU'.includes(letras[k])) s = letras[0] + letras[k]
    }
    usadas.add(s); out[n] = s
  }
  return out
}

// ── a bolinha: agora com as INICIAIS de quem bateu dentro ──
const bola = (sig, nome, ok, estado = 'feito') => {
  if (estado === 'vez') return `<span class="b vez">${sig[nome]}</span>`
  return `<span class="b ${ok ? 'gol' : 'erro'}" title="${nome}">${sig[nome]}</span>`
}
const linha = (t, kicks, vez) => {
  const sig = siglasDoTime(t.batem)
  return `
  <div class="row">
    <div class="time"><span class="esc" style="background:${t.cor}"></span><span>${t.nome}</span></div>
    <div class="bolas">${kicks.map(([n, ok]) => bola(sig, n, ok)).join('')}${vez ? bola(sig, vez, null, 'vez') : ''}</div>
  </div>`
}

// ── o PALCO: quem está batendo agora, contra quem, e o que aconteceu ──
const palco = (estado, batedor, goleiro, time) => {
  if (estado === 'batendo') return `
  <div class="palco">
    <div class="duelo">
      <div class="lado"><span class="tag">⚽ BATE</span><b>${batedor}</b><small>${time}</small></div>
      <div class="bolinha-corre">●</div>
      <div class="lado dir"><span class="tag">🧤 GOLEIRO</span><b>${goleiro}</b></div>
    </div>
  </div>`
  const gol = estado === 'gol'
  return `
  <div class="palco ${gol ? 'p-gol' : 'p-erro'}">
    <div class="duelo">
      <div class="lado"><span class="tag">⚽ BATEU</span><b>${batedor}</b><small>${time}</small></div>
      <div class="veredito">${gol ? 'GOL!' : 'DEFENDEU!'}</div>
      <div class="lado dir"><span class="tag">🧤 GOLEIRO</span><b>${goleiro}</b></div>
    </div>
  </div>`
}

const cartao = (titulo, placar, estadoRodape, rowsHtml, palcoHtml, sub) => `
<div class="card">
  <div class="cab"><b>${titulo}</b><strong>${placar}</strong><span>${estadoRodape}</span></div>
  ${rowsHtml}
  ${palcoHtml}
</div>
<p class="leg">${sub}</p>`

// ── os 3 momentos ──
const m1 = cartao('PÊNALTIS', '3 × 2', 'COBRANÇAS',
  linha(A, [['Adriano Imperador', 1], ['Djalminha', 1], ['Edmundo', 1]]) +
  linha(B, [['Romário', 1], ['Zico', 0]], 'Sócrates'),
  palco('batendo', 'Sócrates', 'Rogério Ceni', 'São Luiz FC'),
  '① <b>A cobrança da vez.</b> O palco mostra quem bate e contra qual goleiro. A bolinha dele pisca na linha — com as iniciais. Quem vem depois <u>não aparece</u>.')

const m2 = cartao('PÊNALTIS', '3 × 3', 'COBRANÇAS',
  linha(A, [['Adriano Imperador', 1], ['Djalminha', 1], ['Edmundo', 1]]) +
  linha(B, [['Romário', 1], ['Zico', 0], ['Sócrates', 1]]),
  palco('gol', 'Sócrates', 'Rogério Ceni', 'São Luiz FC'),
  '② <b>O lance.</b> Meio segundo de "GOL!" (ou "DEFENDEU!") no palco — é o único lugar que grita. A bolinha fica verde, com o <b>SÓ</b> de Sócrates dentro.')

const m3 = cartao('MORTE SÚBITA', '5 × 6', 'ENCERRADO',
  linha(A, [['Adriano Imperador', 1], ['Djalminha', 1], ['Edmundo', 1], ['Juninho', 1], ['Rivaldo', 1], ['Marcelinho', 0]]) +
  linha(B, [['Romário', 1], ['Zico', 1], ['Sócrates', 1], ['Neto', 1], ['Alex', 1], ['Ronaldinho', 1]]),
  palco('gol', 'Ronaldinho', 'Rogério Ceni', 'São Luiz FC'),
  '③ <b>O fim.</b> O palco fica no último lance — quem decidiu. Dá pra ler a disputa inteira pelas iniciais: <b>MA</b> errou, <b>RN</b> (Ronaldinho) fechou — e não se confunde com o <b>RO</b> do Romário.')

// ── o de hoje, pra comparar o tamanho ──
const hoje = `
<div class="card velho">
  <div class="cab"><b>PÊNALTIS</b><strong>3 × 2</strong><span>COBRANÇAS</span></div>
  <div class="row"><div class="time"><span class="esc" style="background:${A.cor}"></span><span>${A.nome}</span></div><div class="bolas"><span class="b gol">✓</span><span class="b gol">✓</span><span class="b gol">✓</span></div></div>
  <div class="row"><div class="time"><span class="esc" style="background:${B.cor}"></span><span>${B.nome}</span></div><div class="bolas"><span class="b gol">✓</span><span class="b erro">×</span><span class="b vez"></span></div></div>
  <p class="rodape">Uma cobrança de cada vez…</p>
</div>
<p class="leg"><b>HOJE</b> (já sem o spoiler): bolinha vazia, sem saber quem bateu. A linha verde de baixo é o espaço que o <b>palco</b> ocupa na versão nova.</p>`

const html = `<!doctype html><meta charset="utf-8"><style>
@font-face{font-family:Osw;src:url('${f(700)}') format('woff2');font-weight:700}
@font-face{font-family:Osw;src:url('${f(600)}') format('woff2');font-weight:600}
@font-face{font-family:Osw;src:url('${f(500)}') format('woff2');font-weight:500}
*{margin:0;padding:0;box-sizing:border-box}
body{width:1180px;background:#F4ECD6;color:#0C0C0C;font-family:Osw,sans-serif;padding:34px 34px 30px}
h1{font-weight:700;font-size:38px;text-transform:uppercase;letter-spacing:-.5px}
h1 em{font-style:normal;color:#C2452F}
.intro{font-weight:600;font-size:16px;opacity:.7;margin:4px 0 22px;max-width:980px;line-height:1.3}
.grade{display:grid;grid-template-columns:repeat(4,1fr);gap:20px;align-items:start}
.col h2{font-weight:700;font-size:15px;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px}
.card{background:#F6EEDB;border:4px solid #0C0C0C;border-radius:16px;box-shadow:5px 5px 0 #0C0C0C;overflow:hidden}
.cab{display:flex;align-items:center;justify-content:space-between;padding:10px 12px 6px;border-top:3px solid #0C0C0C}
.cab b{font-size:15px;font-weight:700;letter-spacing:.5px}
.cab strong{font-size:26px;font-weight:700}
.cab span{font-size:11px;font-weight:600;opacity:.6}
.row{display:flex;align-items:center;gap:8px;padding:4px 12px}
.time{display:flex;align-items:center;gap:6px;width:108px;flex:none;font-size:13px;font-weight:700;white-space:nowrap;overflow:hidden}
.esc{width:16px;height:16px;border-radius:5px;border:2px solid #0C0C0C;flex:none}
.bolas{display:flex;gap:4px;flex-wrap:nowrap}
.b{width:25px;height:25px;border-radius:999px;border:2.5px solid #0C0C0C;display:inline-flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#fff;flex:none;letter-spacing:-.3px}
.b.gol{background:#1B7A3D}
.b.erro{background:#C2452F}
.b.vez{background:#FFC400;color:#0C0C0C;box-shadow:0 0 0 4px rgba(255,196,0,.35)}
.rodape{font-size:13px;font-weight:700;color:#1B7A3D;padding:8px 12px 12px;border-top:2px dashed rgba(27,122,61,.55);margin-top:6px;background:rgba(27,122,61,.07)}
.palco{margin-top:8px;border-top:3px solid #0C0C0C;background:#0C0C0C;color:#F4ECD6;padding:8px 10px 9px}
.duelo{display:flex;align-items:center;justify-content:space-between;gap:6px}
.lado{display:flex;flex-direction:column;line-height:1.05;min-width:0}
.lado.dir{text-align:right;align-items:flex-end}
.lado b{font-size:14px;font-weight:700;white-space:nowrap}
.lado small{font-size:9.5px;font-weight:600;opacity:.55}
.tag{font-size:8.5px;font-weight:700;letter-spacing:1px;color:#FFC400}
.bolinha-corre{font-size:15px;color:#FFC400;letter-spacing:6px}
.veredito{font-size:20px;font-weight:700;padding:1px 9px;border-radius:8px;border:2.5px solid #F4ECD6}
.p-gol .veredito{background:#1B7A3D}
.p-erro .veredito{background:#C2452F}
.leg{font-size:13px;font-weight:600;line-height:1.3;margin-top:10px;opacity:.85}
.nota{margin-top:24px;display:grid;grid-template-columns:1fr 1fr;gap:18px}
.box{background:#fff;border:3px solid #0C0C0C;border-radius:14px;box-shadow:4px 4px 0 #0C0C0C;padding:12px 14px;font-size:14px;font-weight:600;line-height:1.35}
.box h3{font-weight:700;font-size:15px;text-transform:uppercase;letter-spacing:1px;margin-bottom:5px}
</style>
<h1>Pênaltis com <em>os batedores</em></h1>
<p class="intro">A disputa ganha um <b>palco</b> embaixo: quem está batendo, contra qual goleiro, e o que aconteceu. E cada bolinha passa a ter as <b>iniciais de quem bateu</b>. O palco entra no lugar da linha "Uma cobrança de cada vez…" — o cartão cresce só a diferença entre as duas.</p>
<div class="grade">
  <div class="col"><h2>Hoje</h2>${hoje}</div>
  <div class="col"><h2>Novo · ①</h2>${m1}</div>
  <div class="col"><h2>Novo · ②</h2>${m2}</div>
  <div class="col"><h2>Novo · ③</h2>${m3}</div>
</div>
<div class="nota">
  <div class="box"><h3>🎯 Quem bate, e em que ordem</h3>Os 5 primeiros são os <b>melhores do time em campo</b>, do ataque pra trás (atacante, meia, lateral, zagueiro). Se for pra morte súbita, segue a fila; o <b>goleiro bate por último</b>, igual no futebol. A ordem sai sempre igual em todos os aparelhos da sala. E <b>dois do mesmo time nunca ficam com a mesma sigla</b>: Romário é RO, Ronaldinho vira RN.</div>
  <div class="box"><h3>🙈 O que continua escondido</h3>O batedor seguinte <b>não aparece</b> antes da hora, a bolinha só nasce quando ele bate, e o título só vira MORTE SÚBITA quando a 6ª rodada começa. Nada disso muda placar nem quem passa: é só desenho.</div>
</div>`

const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1180, height: 800 }, deviceScaleFactor: 2 })
await p.setContent(html, { waitUntil: 'load' })
await p.evaluate(() => document.fonts.ready)
await p.waitForTimeout(300)
fs.mkdirSync('mockups', { recursive: true })
await p.screenshot({ path: 'mockups/penaltis-batedores.png', fullPage: true })
// quanto o cartão cresce de verdade?
const alturas = await p.evaluate(() => [...document.querySelectorAll('.card')].map(c => Math.round(c.getBoundingClientRect().height)))
await b.close()
console.log('mockups/penaltis-batedores.png')
console.log(`altura dos cartões (px): hoje ${alturas[0]} · novo ${alturas[1]} / ${alturas[2]} / ${alturas[3]}  → cresce ${alturas[1] - alturas[0]}px`)
