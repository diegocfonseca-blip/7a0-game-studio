// ─── 🧾 MOCKUP: a FICHA do jogador na aba Elenco ────────────────────────────
//
// Pedido do Diego (18/09), com o print da barra preta na mão: *"nessa área aqui
// precisa arrumar as coisas, porque eu quero que tenha gols na temporada, gols
// totais que conta todas as temporadas, e também jogos totais, e assistência na
// temporada e assistências totais… poderia ter um espaço embaixo, não sei. Me
// manda mockup"*.
//
// ⚠️ O QUE EXISTE HOJE, DE VERDADE (conferido no código, não no chute):
//   · JOGOS já soma de uma temporada pra outra (`condicaoCarry` carrega o `j`).
//     Por isso o print dele mostra "304 JOGOS": é o Gilmar somado, mas o rótulo
//     diz só "JOGOS" e engana.
//   · 🔑 E É SEMPRE NO CLUBE DELE — o Diego perguntou e a conta confirma: o
//     `guardaCansaco` tem `if (!m.isHuman) continue`, ou seja **só o elenco do
//     usuário é anotado**. Bot nunca acumula. Então o número nunca inclui jogo
//     feito em outro clube: é o tempo dele NO TEU time. (Se você vender e
//     recomprar a mesma carta, o número volta inteiro — é de propósito.)
//     Por isso o rótulo certo é "NO CLUBE", não "carreira".
//   · GOLS e ASS são só da TEMPORADA (saem do `goalsByCard`/`assistsByCard`, que
//     o pregão refaz do zero a cada ano).
//   · O TOTAL de gols e de assistências **não existe em lugar nenhum** — ninguém
//     guarda. Pra ter, o `condicaoCarry` precisa passar a carregar mais dois
//     números na virada da temporada.
//   👉 Consequência que o Diego precisa saber ANTES de escolher: carreira que já
//     está rolando começa o total do ZERO (o passado não dá pra recuperar, nunca
//     foi gravado). Os JOGOS totais continuam certos, porque esses já vinham.
//
// Rodar: node scripts/mockup-ficha-jogador.mjs [--saida /tmp/ficha.png]
import { chromium } from 'playwright-core'
import fs from 'node:fs'

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const SAIDA = arg('saida', '/tmp/ficha-jogador.png')

const b64 = w => fs.readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const INK = '#0C0C0C', CREME = '#F4ECD6', GOLD = '#FFC400'
const AZUL = '#8FC0F0', VERDE = '#4ED07E', AREIA = '#FFE79A'

// o jogador do print dele: Gilmar, goleiro reserva, 304 jogos somados no clube
const J = {
  nome: 'Gilmar', sub: 'Santos · 1962 · GOL · reserva', ct: '📝 4 anos',
  jogosTemp: 11, jogosTot: 304, golsTemp: 0, golsTot: 0,
  assTemp: 0, assTot: 2, gas: 100, valor: 89, sal: 9,
}
// um segundo caso, pra dar pra ver número grande em tudo (o Diego sempre olha o
// pior caso: nome longo + números de 3 dígitos)
const A = {
  nome: 'Romário', sub: 'Vasco · 2000 · ATA · titular', ct: '⏳ último ano',
  jogosTemp: 34, jogosTot: 271, golsTemp: 28, golsTot: 188,
  assTemp: 7, assTot: 63, gas: 44, valor: 240, sal: 24,
}

// 🎨 a fichinha de número, igual à do jogo (`dadoSel` em pyramidseason.tsx)
const dado = (rot, val, cor = '#fff', tam = 15) => `
  <span style="text-align:center;flex:none;min-width:34px">
    <span style="display:block;font-family:Oswald,sans-serif;font-weight:700;font-size:${tam}px;color:${cor};line-height:1">${val}</span>
    <span style="display:block;font-size:7px;font-weight:800;color:rgba(255,255,255,.45);letter-spacing:.6px">${rot}</span>
  </span>`

const cabeca = j => `
  <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
    <span style="flex:none;width:40px;height:40px;border-radius:50%;background:#2a2a2a;border:2px solid rgba(255,255,255,.15)"></span>
    <span style="flex:1;min-width:0">
      <span style="display:block;font-family:Oswald,sans-serif;font-weight:700;font-size:14px;line-height:1.1;color:#fff">${j.nome}</span>
      <span style="display:block;font-size:8.5px;font-weight:700;color:rgba(255,255,255,.5)">${j.sub}</span>
      <span style="display:block;font-size:8.5px;font-weight:800;color:#FFD9A8;margin-top:1px">${j.ct}</span>
    </span>
  </div>`

const faixa = (conteudo, fundo = 'rgba(255,255,255,.06)') =>
  `<div style="display:flex;gap:4px;justify-content:space-between;align-items:center;background:${fundo};border-radius:9px;padding:6px 6px">${conteudo}</div>`

const caixa = dentro => `
  <div style="background:linear-gradient(160deg,#1a1a1a,#0C0C0C);border:3px solid ${INK};border-radius:12px;padding:9px 10px;color:#fff;box-shadow:3px 3px 0 rgba(0,0,0,.3)">${dentro}</div>`

// ── HOJE: uma linha só, e o rótulo "JOGOS" não diz que é somado ─────────────
const hoje = j => caixa(cabeca(j) + faixa(
  dado('JOGOS', j.jogosTot) + dado('GOLS', j.golsTemp, GOLD) + dado('ASS', j.assTemp, AZUL) +
  dado('GÁS', `${j.gas}%`, VERDE) + dado('VALOR', j.valor, AREIA) + dado('SAL.', j.sal, AREIA)))

// ── A) DUAS FAIXAS: "NESTA TEMPORADA" e "NO CLUBE" ──────────────────────────
const rotulo = t => `<span style="flex:none;width:52px;font-family:Oswald,sans-serif;font-weight:700;font-size:8px;letter-spacing:.7px;color:rgba(255,255,255,.4);line-height:1.15">${t}</span>`
const opcaoA = j => caixa(cabeca(j) +
  faixa(rotulo('NESTA<br>TEMPORADA') + dado('JOGOS', j.jogosTemp) + dado('GOLS', j.golsTemp, GOLD) + dado('ASS', j.assTemp, AZUL) + dado('GÁS', `${j.gas}%`, VERDE)) +
  `<div style="height:5px"></div>` +
  faixa(rotulo('NO<br>CLUBE') + dado('JOGOS', j.jogosTot) + dado('GOLS', j.golsTot, GOLD) + dado('ASS', j.assTot, AZUL) + dado('VALOR', j.valor, AREIA) + dado('SAL.', j.sal, AREIA), 'rgba(255,196,0,.07)'))

// ── B) NÚMERO DUPLO no mesmo lugar: "28 / 188" ──────────────────────────────
const duplo = (rot, temp, tot, cor) => `
  <span style="text-align:center;flex:none;min-width:48px">
    <span style="display:block;line-height:1">
      <span style="font-family:Oswald,sans-serif;font-weight:700;font-size:15px;color:${cor}">${temp}</span>
      <span style="font-family:Oswald,sans-serif;font-weight:700;font-size:11px;color:rgba(255,255,255,.3)"> / </span>
      <span style="font-family:Oswald,sans-serif;font-weight:700;font-size:12px;color:rgba(255,255,255,.62)">${tot}</span>
    </span>
    <span style="display:block;font-size:7px;font-weight:800;color:rgba(255,255,255,.45);letter-spacing:.6px">${rot}</span>
  </span>`
const opcaoB = j => caixa(cabeca(j) +
  faixa(duplo('JOGOS', j.jogosTemp, j.jogosTot, '#fff') + duplo('GOLS', j.golsTemp, j.golsTot, GOLD) + duplo('ASS', j.assTemp, j.assTot, AZUL) +
    dado('GÁS', `${j.gas}%`, VERDE) + dado('VALOR', j.valor, AREIA) + dado('SAL.', j.sal, AREIA)) +
  `<div style="text-align:center;font-size:7.5px;font-weight:800;color:rgba(255,255,255,.34);letter-spacing:.5px;margin-top:5px">NESTA TEMPORADA / DESDE QUE CHEGOU</div>`)

// ── C) DUAS COLUNAS lado a lado ─────────────────────────────────────────────
const coluna = (titulo, linhas, fundo) => `
  <div style="flex:1;background:${fundo};border-radius:9px;padding:6px 7px 7px">
    <div style="font-family:Oswald,sans-serif;font-weight:700;font-size:8px;letter-spacing:.8px;color:rgba(255,255,255,.42);text-align:center;margin-bottom:4px">${titulo}</div>
    <div style="display:flex;justify-content:space-around">${linhas}</div>
  </div>`
const opcaoC = j => caixa(cabeca(j) +
  `<div style="display:flex;gap:6px">
     ${coluna('ESTA TEMPORADA', dado('JOGOS', j.jogosTemp) + dado('GOLS', j.golsTemp, GOLD) + dado('ASS', j.assTemp, AZUL), 'rgba(255,255,255,.06)')}
     ${coluna('NO SEU CLUBE', dado('JOGOS', j.jogosTot) + dado('GOLS', j.golsTot, GOLD) + dado('ASS', j.assTot, AZUL), 'rgba(255,196,0,.08)')}
   </div>
   <div style="height:5px"></div>` +
  faixa(dado('GÁS', `${j.gas}%`, VERDE) + dado('VALOR', j.valor, AREIA) + dado('SAL.', j.sal, AREIA)))

const bloco = (titulo, nota, render) => `
  <section style="margin-bottom:20px">
    <div style="font-family:Oswald,sans-serif;font-weight:700;font-size:16px;letter-spacing:.5px;color:${INK};text-transform:uppercase">${titulo}</div>
    <div style="font-size:11.5px;color:rgba(12,12,12,.62);margin:1px 0 8px;line-height:1.45">${nota}</div>
    ${render(J)}<div style="height:8px"></div>${render(A)}
  </section>`

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}
  *{box-sizing:border-box}
  body{margin:0;background:${CREME};font-family:Arial,sans-serif;padding:20px 18px 26px;width:430px}
</style></head><body>
  <div style="font-family:Oswald,sans-serif;font-weight:700;font-size:26px;color:${INK};line-height:1.05">A FICHA DO JOGADOR</div>
  <div style="font-size:12px;color:rgba(12,12,12,.6);margin:3px 0 16px;line-height:1.5">
    Gols, jogos e assistências <b>nesta temporada</b> e <b>no seu clube</b>. Três jeitos — escolhe um.
  </div>

  ${bloco('Hoje', 'Uma linha só. O <b>JOGOS</b> já vem somado de todas as temporadas no seu clube (o 304 do seu print), mas o rótulo não diz isso — e gols e assistências, do lado, são só da temporada. Três números juntos falando de tempos diferentes.', hoje)}
  ${bloco('A · Duas faixas', 'Uma faixa pra temporada, outra pro total no seu clube (a de baixo, dourada). É o mais fácil de ler, e é o "espaço embaixo" que você falou. Gasta mais altura.', opcaoA)}
  ${bloco('B · Número duplo', 'Os dois números no mesmo lugar: <b>temporada</b> em destaque, <b>total no clube</b> menor do lado. Continua em uma linha só — não cresce nada.', opcaoB)}
  ${bloco('C · Duas colunas', 'Temporada de um lado, total no clube do outro (dourada). Gás, valor e salário descem pra uma faixa própria, porque não são de temporada nem de total.', opcaoC)}

  <div style="background:#FFF6E0;border:3px solid ${INK};border-radius:12px;padding:11px 12px;box-shadow:3px 3px 0 rgba(0,0,0,.2)">
    <div style="font-family:Oswald,sans-serif;font-weight:700;font-size:14px;color:${INK}">📌 RESPONDENDO A TUA PERGUNTA</div>
    <div style="font-size:12px;color:rgba(12,12,12,.75);margin-top:5px;line-height:1.5">
      ✅ <b>É sempre no SEU clube</b>, como você falou — o jogo só anota o elenco do usuário, nunca o dos bots.
      Jogo feito em outro time não entra. (Se você vender e recomprar a mesma carta, o número dela volta inteiro.)
      <br><br>⚠️ Mas hoje o jogo guarda só os <b>jogos</b> de uma temporada pra outra. <b>Gols e assistências ele não guarda</b> — nunca gravou.
      Então, em carreira que já está rolando, esses dois começam do <b>zero</b> e vão contando daqui pra frente. Os <b>jogos</b> continuam certos.
      <br><br>Se preferir, eu escrevo <b>"desde agora"</b> na primeira temporada, pra ninguém achar que é bug.
    </div>
  </div>
</body></html>`

const nav = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await nav.newPage({ viewport: { width: 430, height: 900 }, deviceScaleFactor: 2 })
await p.setContent(html, { waitUntil: 'load' })
await p.evaluate(() => document.fonts.ready)
await p.screenshot({ path: SAIDA, fullPage: true })
await nav.close()
console.log(`${SAIDA} · ${(fs.statSync(SAIDA).size / 1024).toFixed(0)} KB`)
