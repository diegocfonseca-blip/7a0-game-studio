// ─── 🧾 MOCKUP: o TOTAL "NO SEU CLUBE" quando ainda não existe passado ───────
//
// O Diego olhou a ficha do Julián Álvarez dele e perguntou (19/09):
// *"tem nada de errado com esses dados aí não do Julián Álvarez? Olha aí a
// quantidade de partidas e gols, estranhamente, da temporada e total?"*.
//
// ⚠️ ELE VIU CERTO, e NÃO é bug de conta — é a data em que cada número começou
// a ser gravado:
//   · JOGOS  → o save guarda desde **13/09** (veio junto com o gás/condição).
//              Por isso o dele já mostra 337 no clube.
//   · GOLS e ASSISTÊNCIAS → o save só passou a guardar em **19/09 (hoje)**,
//              no commit `e469e63`. O passado nunca foi gravado e não dá pra
//              recuperar — inventar número seria pior (regra dele de 18/08).
// 👉 Resultado na tela dele: 337 jogos com 10 gols, e os MESMOS 10 gols na
//    coluna da temporada. Parece defeito, e é só falta de passado.
//
// A conta em si está certa: `glTot = carry.gl + gols da temporada`. Com o
// `carry.gl` vazio (carreira velha), o total nasce igual ao da temporada e a
// partir da próxima virada ele soma normal.
//
// A pergunta pro Diego é de TELA, não de motor: o que fazer enquanto não há
// passado? A sessão de ontem já tinha oferecido escrever "desde agora" e ele
// não respondeu — agora ele mesmo tropeçou no número, então vale perguntar
// de novo com a coisa desenhada.
//
// Rodar: node scripts/mockup-total-desde-agora.mjs [--saida /tmp/total.png]
import { chromium } from 'playwright-core'
import fs from 'node:fs'

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const SAIDA = arg('saida', '/tmp/total-desde-agora.png')

const b64 = w => fs.readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const INK = '#0C0C0C', CREME = '#F4ECD6', GOLD = '#FFC400'
const AZUL = '#8FC0F0', VERDE = '#4ED07E', AREIA = '#FFE79A', VERM = '#C2452F'

// 🎯 os números REAIS do print dele — nada inventado
const ALVAREZ = {
  nome: 'Julián Álvarez', sub: 'Atlético de Madrid · 2025 · ATA · titular', ct: '⏳ último ano',
  jogosTemp: 17, jogosTot: 337, golsTemp: 10, golsTot: 10, assTemp: 0, assTot: 0,
  gas: 0, valor: 65, sal: 7,
}
// e como a MESMA ficha vai ficar daqui a duas temporadas, com passado gravado
const DEPOIS = {
  nome: 'Julián Álvarez', sub: 'Atlético de Madrid · 2027 · ATA · titular', ct: '📝 3 anos',
  jogosTemp: 31, jogosTot: 406, golsTemp: 19, golsTot: 48, assTemp: 4, assTot: 9,
  gas: 72, valor: 71, sal: 7,
}

const dado = (rot, val, cor = '#fff') => `
  <span style="text-align:center;flex:none;min-width:34px">
    <span style="display:block;font-family:Oswald,sans-serif;font-weight:700;font-size:15px;color:${cor};line-height:1">${val}</span>
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

const coluna = (titulo, linhas, fundo, rodape = '') => `
  <div style="flex:1;background:${fundo};border-radius:9px;padding:6px 7px 7px">
    <div style="font-family:Oswald,sans-serif;font-weight:700;font-size:8px;letter-spacing:.8px;color:rgba(255,255,255,.42);text-align:center;margin-bottom:4px">${titulo}</div>
    <div style="display:flex;justify-content:space-around">${linhas}</div>
    ${rodape}
  </div>`

const notinha = t => `<div style="text-align:center;font-size:7px;font-weight:800;color:rgba(255,196,0,.62);letter-spacing:.3px;margin-top:4px">${t}</div>`

const faixaBase = j => `
  <div style="height:5px"></div>
  <div style="display:flex;gap:4px;justify-content:space-around;background:rgba(255,255,255,.06);border-radius:9px;padding:6px 4px">
    ${dado('GÁS', `${j.gas}%`, j.gas <= 20 ? VERM : VERDE)}${dado('VALOR', j.valor, AREIA)}${dado('SAL.', j.sal, AREIA)}
  </div>`

const caixa = dentro => `
  <div style="background:linear-gradient(160deg,#1a1a1a,#0C0C0C);border:3px solid ${INK};border-radius:12px;padding:9px 10px;color:#fff;box-shadow:3px 3px 0 rgba(0,0,0,.3)">${dentro}</div>`

const trio = (j, gl, as) => dado('JOGOS', j) + dado('GOLS', gl, GOLD) + dado('ASS', as, AZUL)

// ── HOJE (o print dele) ─────────────────────────────────────────────────────
const hoje = j => caixa(cabeca(j) +
  `<div style="display:flex;gap:6px">
     ${coluna('ESTA TEMPORADA', trio(j.jogosTemp, j.golsTemp, j.assTemp), 'rgba(255,255,255,.06)')}
     ${coluna('NO SEU CLUBE', trio(j.jogosTot, j.golsTot, j.assTot), 'rgba(255,196,0,.08)')}
   </div>` + faixaBase(j))

// ── A) A NOTINHA ────────────────────────────────────────────────────────────
const opcaoA = j => caixa(cabeca(j) +
  `<div style="display:flex;gap:6px">
     ${coluna('ESTA TEMPORADA', trio(j.jogosTemp, j.golsTemp, j.assTemp), 'rgba(255,255,255,.06)')}
     ${coluna('NO SEU CLUBE', trio(j.jogosTot, j.golsTot, j.assTot), 'rgba(255,196,0,.08)', notinha('⚽ 🅰️ CONTANDO DESDE ESTA TEMPORADA'))}
   </div>` + faixaBase(j))

// ── B) O TRACINHO ───────────────────────────────────────────────────────────
const opcaoB = j => caixa(cabeca(j) +
  `<div style="display:flex;gap:6px">
     ${coluna('ESTA TEMPORADA', trio(j.jogosTemp, j.golsTemp, j.assTemp), 'rgba(255,255,255,.06)')}
     ${coluna('NO SEU CLUBE', dado('JOGOS', j.jogosTot) + dado('GOLS', '—', 'rgba(255,196,0,.45)') + dado('ASS', '—', 'rgba(143,192,240,.45)'), 'rgba(255,196,0,.08)', notinha('⚽ 🅰️ COMEÇA A CONTAR NA PRÓXIMA TEMPORADA'))}
   </div>` + faixaBase(j))

const bloco = (titulo, nota, dentro) => `
  <section style="margin-bottom:18px">
    <div style="font-family:Oswald,sans-serif;font-weight:700;font-size:16px;letter-spacing:.5px;color:${INK};text-transform:uppercase">${titulo}</div>
    <div style="font-size:11.5px;color:rgba(12,12,12,.62);margin:1px 0 8px;line-height:1.45">${nota}</div>
    ${dentro}
  </section>`

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}
  *{box-sizing:border-box}
  body{margin:0;background:${CREME};font-family:Arial,sans-serif;padding:20px 18px 26px;width:430px}
</style></head><body>
  <div style="font-family:Oswald,sans-serif;font-weight:700;font-size:25px;color:${INK};line-height:1.05">O 337 × 10 DO ÁLVAREZ</div>
  <div style="font-size:12px;color:rgba(12,12,12,.6);margin:3px 0 14px;line-height:1.5">
    Você viu certo — mas não é conta errada, é <b>falta de passado</b>. Olha o porquê e escolhe o que a tela faz enquanto isso.
  </div>

  <div style="background:#FFF6E0;border:3px solid ${INK};border-radius:12px;padding:11px 12px;box-shadow:3px 3px 0 rgba(0,0,0,.2);margin-bottom:18px">
    <div style="font-family:Oswald,sans-serif;font-weight:700;font-size:14px;color:${INK}">📌 POR QUE 337 JOGOS E SÓ 10 GOLS</div>
    <div style="font-size:12px;color:rgba(12,12,12,.78);margin-top:6px;line-height:1.55">
      Cada número começou a ser <b>guardado no save</b> num dia diferente:
      <br><br>📅 <b>JOGOS</b> — guardado desde <b>13/09</b>, junto com o gás. Por isso o dele já tem <b>337</b>.
      <br>📅 <b>GOLS e ASSISTÊNCIAS</b> — só passaram a ser guardados <b>hoje, 19/09</b>. Antes disso o jogo <b>nunca gravou</b> gol de temporada passada.
      <br><br>Resultado: numa carreira que já estava rolando (a tua está na <b>T25</b>), o total de gols nasce igual ao da temporada — os <b>mesmos 10</b>. A conta está certa; o que falta é o passado, e <b>inventar número seria mentira</b>.
      <br><br>✅ <b>Se conserta sozinho</b>: na virada da temporada ele soma. Na T26 vira 10 + o que ele fizer, e daí em diante vai crescendo pra sempre.
    </div>
  </div>

  ${bloco('Hoje', 'É o teu print. Ninguém avisa nada, e dá pra achar que quebrou.', hoje(ALVAREZ))}
  ${bloco('A · A notinha', 'Uma linha miudinha embaixo da coluna dourada. <b>Some sozinha</b> assim que o jogador tiver passado gravado — ninguém precisa apagar depois.', opcaoA(ALVAREZ))}
  ${bloco('B · O tracinho', 'Mais radical: enquanto não há passado, o total de gols e assistências mostra <b>—</b> em vez de um número que parece errado. Os <b>jogos</b> continuam à mostra, porque esses estão certos.', opcaoB(ALVAREZ))}

  ${bloco('E daqui a duas temporadas…', 'Do jeito que for, a ficha fica assim quando já tiver passado: aviso nenhum, só número — <b>19 gols na temporada, 48 no teu clube</b>.', hoje(DEPOIS))}

  <div style="background:#fff;border:3px solid ${INK};border-radius:12px;padding:11px 12px;box-shadow:3px 3px 0 rgba(0,0,0,.2)">
    <div style="font-family:Oswald,sans-serif;font-weight:700;font-size:14px;color:${INK}">🤔 E TEM A OPÇÃO C: NÃO FAZER NADA</div>
    <div style="font-size:12px;color:rgba(12,12,12,.75);margin-top:5px;line-height:1.5">
      Vale lembrar que isso <b>só aparece pra quem já tinha carreira antes de hoje</b>, e <b>só nesta temporada</b>. Carreira nova nasce certa, e a tua se acerta na virada. Se achar que não vale mexer na tela por uma temporada, a gente deixa como está.
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
