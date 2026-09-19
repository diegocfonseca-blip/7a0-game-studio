// ─── 🏆 MOCKUP: como separar XARÁS na ARTILHARIA DE TODOS OS TEMPOS ─────────
//
// Ordem do Diego (19/09): *"primeira que não pode ser por nome, e sim por carta.
// É, quando tiver duas cartas, coloque Cristiano Ronaldo (M), ou algo que
// signifique que ele é do mundo; Cristiano Ronaldo (E) da Europa. Diferencie da
// forma que achar melhor, ok"*.
//
// ⚠️ MEDIDO ANTES DE DESENHAR (o baralho inteiro, os três: BR + Europa + Mundo):
//   · 1466 cartas · 1403 nomes diferentes
//   · 62 NOMES REPETIDOS, cobrindo 125 cartas
//   · 56 deles são de BARALHOS DIFERENTES (Cafu BR + Cafu Europa)
//   · 6 deles são DO MESMO BARALHO (Marcelo Lomba Internacional/2019 +
//     Marcelo Lomba Bahia/2012 — os dois brasileiros)
//
// 👉 Por isso a marca (M)/(E) que ele sugeriu **não fecha sozinha**: nos 6 casos
//    do mesmo baralho os dois levariam a MESMA letra e continuariam embolados na
//    leitura. Quem separa 62 de 62 é o CLUBE — que já é a identidade da carta no
//    jogo inteiro ("Kaká São Paulo é promessa, Kaká Milan é lenda").
//
// Rodar: node scripts/mockup-artilharia-por-carta.mjs [--saida /tmp/art.png]
import { chromium } from 'playwright-core'
import fs from 'node:fs'

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const SAIDA = arg('saida', '/tmp/artilharia-por-carta.png')

const b64 = w => fs.readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const INK = '#0C0C0C', CREME = '#F4ECD6', VERM = '#C2452F', VERDE = '#1B7A3D'
const TAG = { A: '#0C0C0C', B: '#1B7A3D', C: '#2B6CB0', D: '#8a6d1f', V: '#7A5C2E' }

// 🃏 xarás REAIS do baralho (conferidos no `data.ts`, não inventados).
// Os GOLS são de exemplo — é um desenho, não o teu save.
const LINHAS = [
  { div: 'A', nome: 'Cafu', club: 'Milan', ano: 2004, deck: 'E', time: 'Neymarzetti', gols: 61, voce: true },
  { div: 'A', nome: 'Cafu', club: 'São Paulo', ano: 1993, deck: 'BR', time: 'Sistematizados FC', gols: 44 },
  { div: 'B', nome: 'Marcelo Lomba', club: 'Internacional', ano: 2019, deck: 'BR', time: 'Tabajara', gols: 3 },
  { div: 'C', nome: 'Marcelo Lomba', club: 'Bahia', ano: 2012, deck: 'BR', time: 'Vasco da Grana', gols: 2 },
  { div: 'A', nome: 'Alisson', club: 'Liverpool', ano: 2019, deck: 'E', time: 'Braguinha FC', gols: 1 },
]

const tag = d => `<span style="display:inline-block;font-size:8px;font-weight:800;color:#fff;background:${TAG[d]};border-radius:4px;padding:0 4px;margin-right:4px;vertical-align:middle">${d}</span>`

const tabela = (linhas, celulaNome) => `
  <div style="background:#fff;border:3px solid ${INK};border-radius:12px;padding:12px;box-shadow:3px 3px 0 rgba(0,0,0,.2)">
    <div style="font-family:Oswald,sans-serif;font-weight:700;font-size:13px;margin-bottom:2px">🏆 ARTILHARIA · TODOS OS TEMPOS</div>
    <div style="font-size:9.5px;font-weight:700;color:rgba(0,0,0,.5);margin-bottom:8px">Gols somados de todas as temporadas — liga e copas.</div>
    <table style="width:100%;font-size:12px;border-collapse:collapse">
      <thead><tr style="text-align:left;font-size:9.5px;font-weight:800;color:rgba(0,0,0,.45)">
        <th style="padding-right:4px">#</th><th>Jogador</th><th>Time</th><th style="text-align:center">Gols</th></tr></thead>
      <tbody>
        ${linhas.map((l, i) => `
          <tr style="border-top:1px solid rgba(0,0,0,.1);font-weight:600">
            <td style="padding-right:4px;padding-top:3px;padding-bottom:3px">${i + 1}</td>
            <td style="max-width:150px">${celulaNome(l)}</td>
            <td style="color:rgba(0,0,0,.7);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:104px">${l.voce ? '👤 ' : ''}${l.time}</td>
            <td style="text-align:center;font-weight:800">${l.gols}</td>
          </tr>`).join('')}
      </tbody>
    </table>
  </div>`

// ── HOJE: por NOME — os xarás viram UMA linha só, com os gols somados ────────
const hoje = tabela(
  [{ div: 'A', nome: 'Cafu', time: 'Neymarzetti', gols: 105, voce: true },
   { div: 'B', nome: 'Marcelo Lomba', time: 'Tabajara', gols: 5 },
   { div: 'A', nome: 'Alisson', time: 'Braguinha FC', gols: 1 }],
  l => `${tag(l.div)}${l.nome}`)

// ── 1) PELO CLUBE DA CARTA ───────────────────────────────────────────────────
const op1 = tabela(LINHAS, l => `${tag(l.div)}${l.nome}<span style="display:block;font-size:8.5px;font-weight:700;color:rgba(0,0,0,.45);margin-left:22px">${l.club} · ${l.ano}</span>`)

// ── 2) PELA LETRA DO BARALHO, como ele sugeriu ───────────────────────────────
const marca = d => d === 'E' ? '(E)' : d === 'BR' ? '(BR)' : '(M)'
const op2 = tabela(LINHAS, l => `${tag(l.div)}${l.nome} <span style="font-weight:800;color:rgba(0,0,0,.5)">${marca(l.deck)}</span>`)

// ── 3) OS DOIS: letra + clube miúdo ──────────────────────────────────────────
const op3 = tabela(LINHAS, l => `${tag(l.div)}${l.nome} <span style="font-weight:800;color:rgba(0,0,0,.5)">${marca(l.deck)}</span><span style="display:block;font-size:8.5px;font-weight:700;color:rgba(0,0,0,.45);margin-left:22px">${l.club} · ${l.ano}</span>`)

const bloco = (titulo, nota, dentro, cor = INK) => `
  <section style="margin-bottom:18px">
    <div style="font-family:Oswald,sans-serif;font-weight:700;font-size:16px;letter-spacing:.5px;color:${cor};text-transform:uppercase">${titulo}</div>
    <div style="font-size:11.5px;color:rgba(12,12,12,.62);margin:1px 0 8px;line-height:1.45">${nota}</div>
    ${dentro}
  </section>`

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}
  *{box-sizing:border-box}
  body{margin:0;background:${CREME};font-family:Arial,sans-serif;padding:20px 18px 26px;width:430px}
</style></head><body>
  <div style="font-family:Oswald,sans-serif;font-weight:700;font-size:25px;color:${INK};line-height:1.05">ARTILHARIA POR CARTA</div>
  <div style="font-size:12px;color:rgba(12,12,12,.6);margin:3px 0 14px;line-height:1.5">
    Você mandou separar por carta e marcar os xarás. Fui medir o baralho inteiro antes de desenhar — e a marca (M)/(E) sozinha não fecha. Olha:
  </div>

  <div style="background:#FFF6E0;border:3px solid ${INK};border-radius:12px;padding:11px 12px;box-shadow:3px 3px 0 rgba(0,0,0,.2);margin-bottom:18px">
    <div style="font-family:Oswald,sans-serif;font-weight:700;font-size:14px;color:${INK}">📏 O QUE EU MEDI NO BARALHO</div>
    <div style="font-size:12px;color:rgba(12,12,12,.78);margin-top:6px;line-height:1.55">
      <b>1466 cartas</b> nos três baralhos, com <b>1403 nomes</b> diferentes.
      <br>👉 <b>62 nomes repetidos</b>, cobrindo <b>125 cartas</b>.
      <br><br>Desses 62:
      <br>· <b>56</b> são de baralhos diferentes — aí a tua letra resolve (Cafu <b>(BR)</b> × Cafu <b>(E)</b>).
      <br>· <b>6</b> são <b>do mesmo baralho</b> — e aí os dois levam a MESMA letra e continuam embolados:
      <br><span style="color:${VERM};font-weight:800">Marcelo Lomba (BR) × Marcelo Lomba (BR)</span>
      <br><span style="font-size:11px;color:rgba(12,12,12,.6)">(Internacional/2019 e Bahia/2012 — os outros 5: Felipe, Diego, Reinaldo, Paulinho e Andreas Pereira)</span>
      <br><br>Quem separa <b>62 de 62</b> é o <b>CLUBE</b> — que já é a identidade da carta no jogo todo ("Kaká São Paulo é promessa, Kaká Milan é lenda").
    </div>
  </div>

  ${bloco('Hoje (errado)', 'Soma por NOME: os dois Cafus viram <b>uma linha de 105 gols</b> que não é de ninguém. É o que você mandou consertar.', hoje, VERM)}
  ${bloco('1 · Pelo clube da carta', 'Cada carta é uma linha, com o clube e o ano miúdos embaixo. <b>Separa os 62 casos</b>, e é a mesma identidade que o resto do jogo usa.', op1, VERDE)}
  ${bloco('2 · Pela letra, como você falou', 'Curto e limpo. Resolve os 56 de baralhos diferentes — mas repara no <b>Marcelo Lomba</b>: os dois ficam <b>(BR)</b>, e continua sem dar pra saber quem é quem.', op2)}
  ${bloco('3 · Os dois juntos', 'A letra pra bater o olho e o clube pra tirar a dúvida. Ocupa a mesma altura da 1.', op3)}

  <div style="background:#fff;border:3px solid ${INK};border-radius:12px;padding:11px 12px;box-shadow:3px 3px 0 rgba(0,0,0,.2)">
    <div style="font-family:Oswald,sans-serif;font-weight:700;font-size:14px;color:${INK}">💡 EU IRIA DE 3</div>
    <div style="font-size:12px;color:rgba(12,12,12,.75);margin-top:5px;line-height:1.5">
      Fica com a tua letra, que é rápida de ler, e o clube embaixo resolve os 6 que a letra não separa. Mas é teu o visual — me fala <b>1</b>, <b>2</b> ou <b>3</b>.
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
