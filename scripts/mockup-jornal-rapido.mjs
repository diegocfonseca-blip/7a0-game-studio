// ─── 📰 O MARTELO · EDIÇÃO DA SALA (mockup — NÃO está no jogo) ──────────────
// Ideia do Diego (27/08): *"quando acabar liga e copa, aparecer o jornal O
// Martelo igual quando tem no modo carreira… dando uma notícia grande, um banner
// com quem ganhou a liga, a copa, e rebaixamento ou lanterna. Ou quem ficou a uma
// posição de se classificar… e seria apenas sobre os USUÁRIOS, falando deles. E
// também mostra embaixo os títulos, quem ganhou"*.
//
// ✅ O QUE JÁ EXISTE (conferido em `jornal.tsx`): a capa, o cabeçalho, o bloco
//    "Os Donos da Temporada", o escudo desenhado por código, o botão de mandar no
//    grupo — e **80 manchetes**, uma pra cada posição da pirâmide. Ou seja: o
//    jornal não nasce do zero, ele GANHA UMA EDIÇÃO NOVA.
//
// 🔀 O QUE MUDA NO RÁPIDO ONLINE: lá o jornal fala do SEU time contra times de
//    CPU. Aqui os outros times são GENTE DE VERDADE — então a manchete cita as
//    pessoas pelo nome, e a novidade é o bloco "AS NOTAS DA REDAÇÃO": uma linha
//    por usuário, da taça à lanterna.
//
// 🎯 A POSIÇÃO 9 É O DRAMA DA NOITE: a Copa dos 8 leva os 8 primeiros da liga
//    (confirmado no texto de abertura da Copa, `screens.tsx`). Então o 9º é
//    exatamente o "ficou a uma posição de se classificar" que o Diego pediu.
//
// 🃏 A CARTA DO CAMPEÃO NÃO CORRE RISCO: ela é sorteada e gravada na conta no
//    instante em que o cara vira campeão, antes de qualquer toque e sem depender
//    do cronômetro (`screens.tsx:6465`, `persist()` com resilientWrite). O jornal
//    só não pode entrar NO LUGAR da tela do campeão — tem que vir DEPOIS dela,
//    porque é ao montar aquela tela que a gravação dispara.
//
//   node scripts/mockup-jornal-rapido.mjs [--saida jornal-rapido.png]
import { readFileSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright-core'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'jornal-rapido.png')
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const INK = '#0C0C0C', CREME = '#F4ECD6', PAPEL = '#FBF6E9', VERM = '#B23A2A', GOLD = '#FFC400', GREEN = '#1B7A3D'
const SERIF = "font-family:Georgia,'Times New Roman',serif"
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'

// ── a sala do exemplo: 10 humanos, com os clubes batizados que existem no jogo ──
// A ordem é a classificação final. As frases são o miolo da ideia — uma pra cada
// colocação, com o tom mudando da taça pra lanterna.
const SALA = [
  { pos: 1, time: 'Milhaça FC', quem: 'Igor', pts: 79, nota: '🏆 <b>CAMPEÃO.</b> Levantou a taça e levou a carta pro álbum. Fim de papo.', cor: GOLD },
  { pos: 2, time: 'Nata de SP', quem: 'Pedrinho', pts: 77, nota: 'Liderou <b>11 rodadas</b> e entregou na última. Vai dormir pensando nisso.' },
  { pos: 3, time: 'Papão United Madrid', quem: 'Agostinho', pts: 71, nota: 'Pódio conquistado reclamando do juiz em <b>todas</b> as 38 rodadas.' },
  { pos: 4, time: 'Skyy FC', quem: 'Matheus', pts: 68, nota: 'Chegou perto. Perto não vale taça, não vale carta, não vale nada.' },
  { pos: 5, time: 'Theuzudo FC', quem: 'Theus', pts: 62, nota: 'Time bonito no papel, campanha morna no campo.' },
  { pos: 6, time: 'Coringas do Diniz', quem: 'Lucas', pts: 58, nota: 'Ninguém lembra do 6º colocado. Nem a própria torcida.' },
  { pos: 7, time: 'Crias do Bigão', quem: 'Giovanne', pts: 54, nota: 'Entrou na <b>Copa dos 8</b> pela porta dos fundos, na última rodada.' },
  { pos: 8, time: 'Neymarzetti', quem: 'Diego', pts: 52, nota: 'Último classificado. Tá dentro — e é só isso que ele vai lembrar. 😅' },
  { pos: 9, time: 'Tricolor do Arruda FC', quem: 'Souza', pts: 52, nota: '❗ <b>A UMA POSIÇÃO da Copa dos 8.</b> Mesmos 52 pontos do 8º. Ficou de fora por <b>UM gol</b> de saldo.', cor: '#E8503A' },
  { pos: 10, time: 'Leão da Estradinha', quem: 'Jorge', pts: 31, nota: '🏮 <b>LANTERNA.</b> Gastou tudo num atacante e escalou o goleiro mais barato do pregão.', cor: '#7A7460' },
]

const DONOS = [
  ['🏆', 'CAMPEÃO DA LIGA', 'Milhaça FC', 'Igor · 79 pontos', GOLD],
  ['🥇', 'CAMPEÃO DA COPA DOS 8', 'Neymarzetti', 'Diego · bateu o Milhaça na final', '#7C3AED'],
  ['⚽', 'ARTILHEIRO DA SALA', 'Romário', 'Nata de SP · 24 gols', GREEN],
  ['🏮', 'LANTERNA', 'Leão da Estradinha', 'Jorge · 31 pontos', '#7A7460'],
]

const escudo = (letra, c1, c2) => `
  <span style="display:inline-flex;align-items:center;justify-content:center;width:118px;height:118px;border-radius:50%;
    border:6px solid ${INK};background:linear-gradient(160deg,${c1},${c2});color:#fff;${OSW};font-size:52px;
    box-shadow:0 0 0 5px ${PAPEL}">${letra}</span>`

const numero = (k, v) => `
  <tr style="border-top:2px solid rgba(0,0,0,.12)">
    <td style="padding:11px 0;${SERIF};font-weight:700;font-size:22px">${k}</td>
    <td style="padding:11px 0;text-align:right;${OSW};font-size:24px">${v}</td>
  </tr>`

const linhaSala = ({ pos, time, quem, pts, nota, cor }) => `
  <div style="display:flex;gap:14px;align-items:flex-start;padding:13px 14px;border-top:2px solid rgba(0,0,0,.1);
    ${cor ? `background:${cor}22;border-left:8px solid ${cor}` : 'border-left:8px solid transparent'}">
    <span style="${OSW};font-size:26px;width:52px;flex:none;text-align:center;color:${cor || 'rgba(0,0,0,.4)'}">${pos}º</span>
    <div style="min-width:0;flex:1">
      <p style="${SERIF};font-weight:700;font-size:23px;margin:0;line-height:1.15">${time}
        <span style="${OSW};font-size:15px;color:rgba(0,0,0,.45);margin-left:6px">${quem} · ${pts} pts</span></p>
      <p style="${SERIF};font-size:19px;margin:4px 0 0;line-height:1.35;color:rgba(0,0,0,.78)">${nota}</p>
    </div>
  </div>`

const html = `<!doctype html><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box;margin:0;padding:0}
body{background:${CREME};width:1080px;padding:34px;font-family:system-ui}</style>
<body>
<div style="background:${PAPEL};border:8px solid ${INK};border-radius:6px;padding:34px 36px 30px">

  <!-- cabeçalho do jornal -->
  <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:20px">
    <div style="${SERIF};font-weight:700;font-size:64px;line-height:1">O <span style="color:${VERM}">MARTELO</span></div>
    <div style="text-align:right;${OSW};font-size:18px;line-height:1.5;color:rgba(0,0,0,.75)">
      EDIÇÃO DA SALA · SALA DO BRAGUINHA<br>10 TÉCNICOS · PREÇO: 1 MOEDA</div>
  </div>
  <div style="border-top:4px solid ${INK};border-bottom:2px solid ${INK};margin:14px 0 10px;height:6px"></div>
  <div style="display:flex;justify-content:space-between;${OSW};font-size:19px;padding-bottom:12px;border-bottom:4px solid ${INK}">
    <span>⚽ O DIÁRIO DO LEILÃO LEGENDS</span><span>FIM DE JOGO · LIGA + COPA</span>
  </div>

  <!-- manchete -->
  <h1 style="${SERIF};font-weight:700;font-size:66px;line-height:1.08;margin:26px 0 0;text-transform:uppercase">
    O MILHAÇA É CAMPEÃO — E O ARRUDA FICA DE FORA POR UM GOL!</h1>
  <p style="${SERIF};font-style:italic;font-size:26px;line-height:1.4;margin:16px 0 26px;color:rgba(0,0,0,.8)">
    Noite de decisão na sala: taça pro Igor, a Copa dos 8 pro Diego e o Souza chorando
    no vestiário com o mesmo número de pontos do oitavo colocado.</p>

  <!-- campeão + números -->
  <div style="display:flex;gap:18px;align-items:stretch;margin-bottom:26px">
    <div style="flex:1;background:linear-gradient(160deg,#2E9E5B,#14532d);border:4px solid ${INK};border-radius:8px;
      padding:24px;display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative;overflow:hidden">
      <div style="position:absolute;top:26px;right:-58px;transform:rotate(34deg);background:#DFF3E3;border-top:3px solid ${INK};
        border-bottom:3px solid ${INK};${OSW};font-size:22px;padding:6px 70px;letter-spacing:.1em">CAMPEÃO</div>
      ${escudo('M', '#F3B212', '#AE1A13')}
      <p style="${SERIF};font-weight:700;font-size:32px;color:#fff;margin:16px 0 0">Milhaça FC</p>
      <p style="${SERIF};font-style:italic;font-size:19px;color:rgba(255,255,255,.8);margin:6px 0 0">o time do Igor · 79 pontos</p>
    </div>
    <div style="flex:1;background:#fff;border:4px solid ${INK};border-radius:8px;overflow:hidden">
      <p style="${OSW};font-size:22px;background:${INK};color:#fff;padding:12px 16px;letter-spacing:.05em">OS NÚMEROS DO CAMPEÃO</p>
      <table style="width:100%;border-collapse:collapse;padding:0 16px">
        <tbody style="display:table;width:calc(100% - 32px);margin:0 16px">
          ${numero('Posição', '1º')}
          ${numero('Pontos', '79')}
          ${numero('V · E · D', '24·7·7')}
          ${numero('Gols (pró/contra)', '71/34')}
          ${numero('Saldo', '+37')}
        </tbody>
      </table>
    </div>
  </div>

  <!-- os donos da noite -->
  <div style="border:4px solid ${INK};border-radius:8px;overflow:hidden;margin-bottom:26px">
    <p style="${OSW};font-size:24px;background:${INK};color:${GOLD};padding:13px 16px;letter-spacing:.05em">🏆 OS DONOS DA NOITE</p>
    <div style="background:#fff">
      ${DONOS.map(([ic, rot, nome, sub, cor]) => `
        <div style="display:flex;gap:14px;align-items:center;padding:14px 16px;border-top:2px solid rgba(0,0,0,.1);border-left:9px solid ${cor}">
          <span style="font-size:30px;flex:none">${ic}</span>
          <div style="flex:1;min-width:0">
            <p style="${OSW};font-size:15px;color:rgba(0,0,0,.45);margin:0;letter-spacing:.05em">${rot}</p>
            <p style="${SERIF};font-weight:700;font-size:26px;margin:1px 0 0;line-height:1.15">${nome}
              <span style="${SERIF};font-style:italic;font-weight:400;font-size:19px;color:rgba(0,0,0,.6);margin-left:8px">${sub}</span></p>
          </div>
        </div>`).join('')}
    </div>
  </div>

  <!-- a novidade: uma linha por usuário -->
  <div style="border:4px solid ${INK};border-radius:8px;overflow:hidden">
    <p style="${OSW};font-size:24px;background:${VERM};color:#fff;padding:13px 16px;letter-spacing:.05em">📝 AS NOTAS DA REDAÇÃO</p>
    <p style="${SERIF};font-style:italic;font-size:19px;padding:12px 16px 4px;color:rgba(0,0,0,.6);background:#fff">
      Uma linha pra cada um dos 10. Ninguém escapa.</p>
    <div style="background:#fff">${SALA.map(linhaSala).join('')}</div>
  </div>

  <!-- rodapé -->
  <div style="display:flex;gap:14px;margin-top:26px">
    <div style="flex:1;background:${GREEN};color:#fff;border:4px solid ${INK};border-radius:10px;box-shadow:5px 5px 0 ${INK};
      padding:18px;text-align:center;${OSW};font-size:28px">📲 Mandar no grupo</div>
    <div style="flex:none;background:#fff;border:4px solid ${INK};border-radius:10px;box-shadow:5px 5px 0 ${INK};
      padding:18px 34px;${OSW};font-size:28px">Fechar</div>
  </div>
</div>
<p style="text-align:center;${OSW};font-size:19px;color:rgba(0,0,0,.5);margin-top:18px">
  🔨 mockup — não está no jogo · leilaolegends.com</p>
</body>`

const tmp = `/tmp/mock-jornal-rapido-${process.pid}.html`
writeFileSync(tmp, html)
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1080, height: 1400 }, deviceScaleFactor: 2 })
await p.goto('file://' + tmp)
await p.evaluate(() => document.fonts.ready)
await p.waitForTimeout(500)
await p.screenshot({ path: SAIDA, fullPage: true })
const alt = await p.evaluate(() => document.body.scrollHeight)
await b.close()
console.log(`${SAIDA} — 1080x${alt}`)
