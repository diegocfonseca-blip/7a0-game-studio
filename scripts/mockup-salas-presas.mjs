// ─── 🚪 O BOTÃO QUE DESTRAVA A SALA PRESA (bug do Diego 24/08) ─────────────
//
// Relato: *"o usuário derick não estava mais com sala aberta e apareceu esse
// erro"* (a trava de "você já tem 2 salas abertas").
//
// 🔍 A CAUSA, achada no banco: ao SAIR da sala, o último save do host **bate o
// `updated_at`** — ou seja, abandonar a sala a marca como VIVA exatamente na
// hora em que ela deixa de existir pra pessoa. A trava conta sala mexida nas
// últimas 3h, então quem fechou a aba fica preso por 3 horas sem saber por quê.
// (Conferido: as duas salas do Derick estavam paradas há 0,7h e 1,0h — dentro
// da janela — e uma delas com ZERO jogadores.)
//
// 🩹 O CONSERTO DESTA ENTREGA: em vez de mexer no batimento (arriscado no meio
// de partida ao vivo), a trava passa a **destravar na mesma tela**: um toque
// encerra as salas paradas, sem precisar entrar em cada uma. Segue a lei do
// Diego — *toda trava explica o PORQUÊ e o CAMINHO*.
//
//   node scripts/mockup-salas-presas.mjs [--saida x.png]
import { readFileSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright-core'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'salas-presas.png')
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D', RED = '#C2452F', CREME = '#F4ECD6'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'
const box = (bg = '#fff') => `border:3px solid ${INK};border-radius:16px;background:${bg};box-shadow:4px 4px 0 0 ${INK}`

// a tela de criar sala é ESCURA (é o lobby) — o mockup respeita isso
const tela = (erro, comBotao) => `
  <div style="width:360px;background:#141414;border:5px solid ${INK};border-radius:22px;box-shadow:6px 6px 0 ${INK};overflow:hidden">
    <div style="padding:14px 16px">
      <div style="background:${GOLD};border:3px solid ${INK};border-radius:14px;box-shadow:3px 3px 0 ${INK};
        padding:13px 0;text-align:center;${OSW};font-size:17px;text-transform:uppercase">🏠 Criar sala</div>
      <p style="color:${comBotao ? '#FF8A75' : '#FF6B52'};font-family:system-ui;font-size:12px;font-weight:800;
        line-height:1.5;margin:13px 0 0">${erro}</p>
      ${comBotao ? `
      <div style="background:${RED};color:#fff;border:3px solid ${INK};border-radius:12px;box-shadow:3px 3px 0 ${INK};
        padding:11px 0;text-align:center;${OSW};font-size:12px;text-transform:uppercase;margin-top:10px">
        🚪 Encerrar as salas paradas (II544U, KFKNW1)</div>` : ''}
    </div>
  </div>`

const ERRO_ANTES = 'Você já tem 2 salas abertas (II544U e KFKNW1) — é o máximo por pessoa, pra lista de salas não encher de sala vazia. Pra abrir outra, entre numa delas e use "🚪 Sair e encerrar a sala".'
const ERRO_DEPOIS = 'Você já tem 2 salas abertas (II544U e KFKNW1) — é o máximo por pessoa, pra lista de salas não encher de sala vazia. Se você já saiu delas, é só encerrar aqui embaixo.'

const bloco = (tit, bg, txt) => `
  <div style="border:4px solid ${INK};border-radius:18px;background:${bg};box-shadow:4px 4px 0 ${INK};padding:16px 18px;margin-bottom:14px">
    <div style="${OSW};font-size:16px;text-transform:uppercase;margin-bottom:9px">${tit}</div>
    <div style="font-family:system-ui;font-size:12.5px;font-weight:600;line-height:1.55">${txt}</div>
  </div>`

const html = `<!doctype html><meta charset="utf-8"><style>${FONTES}
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:${CREME};padding:34px;font-family:system-ui}</style>
<body>
  <div style="display:inline-block;background:${RED};color:#fff;border:3px solid ${INK};border-radius:999px;box-shadow:3px 3px 0 ${INK};
    padding:5px 15px;${OSW};font-size:12.5px;letter-spacing:.08em">🐛 CONSERTO · SALA PRESA</div>
  <h1 style="${OSW};text-transform:uppercase;font-size:40px;margin:14px 0 6px;line-height:1">
    SAIR DA SALA <span style="color:${RED}">MARCAVA ELA COMO VIVA</span></h1>
  <p style="font-size:14px;font-weight:600;max-width:1050px;line-height:1.5;margin:0 0 22px">
    O Derick não tinha sala aberta nenhuma e mesmo assim levou a trava. Fui no banco e a causa apareceu:
    <b>o último save do host bate o "coração" da sala</b> — então ABANDONAR a sala é justamente o que a deixa
    marcada como viva. Ela conta na trava por 3 horas, e quem fechou a aba não tem como saber disso.
  </p>

  <div style="display:flex;gap:24px;align-items:flex-start;flex-wrap:wrap">
    <div style="flex:0 0 360px">
      <p style="${OSW};font-size:14px;text-transform:uppercase;color:rgba(0,0,0,.5);margin:0 0 8px">Como é hoje</p>
      ${tela(ERRO_ANTES, false)}
      <p style="font-family:system-ui;font-size:11.5px;font-weight:700;color:rgba(0,0,0,.55);margin:10px 0 0;line-height:1.45">
        Manda entrar na sala pra encerrar — mas quem já saiu não vê mais a sala em lugar nenhum. Beco sem saída.</p>
    </div>
    <div style="flex:0 0 360px">
      <p style="${OSW};font-size:14px;text-transform:uppercase;color:${GREEN};margin:0 0 8px">Com o conserto</p>
      ${tela(ERRO_DEPOIS, true)}
      <p style="font-family:system-ui;font-size:11.5px;font-weight:700;color:rgba(0,0,0,.55);margin:10px 0 0;line-height:1.45">
        Um toque encerra as salas paradas ali mesmo. Só apaga as <b>dele</b> (o filtro é por dono) e só as que
        estavam travando.</p>
    </div>
    <div style="flex:1;min-width:360px">
      ${bloco('🔍 O que o banco mostrou', '#FFF0EC', `
        · <b>II544U</b> — parada há 1,0h · <b>ZERO jogadores dentro</b><br>
        · <b>KFKNW1</b> — parada há 0,7h · 1 jogador<br><br>
        As duas dentro da janela de 3h, então contavam. E a de zero jogadores é a prova de que "mexida
        recentemente" <b>não é a mesma coisa</b> que "sala em uso".`)}
      ${bloco('⚖️ Por que NÃO mexi no batimento agora', '#FFF6D6', `
        O caminho "certo" seria não bater o <code>updated_at</code> na saída. Só que esse mesmo save é o que
        <b>guarda a partida pra reconexão</b> — mexer nele arrisca quebrar sala AO VIVO, que é o pior tipo de
        bug pra você.<br><br>
        Então fiz o conserto <b>seguro</b>: a trava continua igual, mas <b>destrava sozinha na tela</b>.
        Zero risco pra quem está jogando agora.`)}
      ${bloco('✅ Reverter', '#E6F3EA', `
        1 commit. E enquanto isso, quem estiver preso já consegue destravar sozinho — não precisa te chamar.`)}
    </div>
  </div>
</body></html>`

const tmp = `/tmp/mock-salas-${process.pid}.html`
writeFileSync(tmp, html)
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1420, height: 900 }, deviceScaleFactor: 2 })
await p.goto('file://' + tmp)
await p.evaluate(() => document.fonts.ready)
await p.waitForTimeout(500)
await p.screenshot({ path: SAIDA, fullPage: true })
await b.close()
console.log(SAIDA)
