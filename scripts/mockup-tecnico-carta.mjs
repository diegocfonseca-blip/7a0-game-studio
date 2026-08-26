// ─── 🃏 A CARTA DO TÉCNICO — o desenho que o Diego fechou (26/08) ───────────
//
// Palavras dele: *"Quero overall igual jogador.. N quero nada de setor.. na
// prática vai ser apenas como mais uma carta normal como se fosse mais um
// jogador, só isso, além de ter mais formações por categoria"*.
//
// Ou seja: o técnico é UMA CARTA no formato que o jogo inteiro já fala —
// categoria (como a fama), overall em faixa (como o lo–hi), uma vaga só no
// time (como o goleiro). A única coisa própria dele: a categoria diz QUANTOS
// esquemas ele domina (lenda 5 · craque 4 · promessa 3 · bom 2 · profissional 1).
// E o Diego aceitou de olhos abertos o efeito colateral: *"às vezes um time tem
// o melhor técnico mas o outro time tem jogadores melhores"* — 11 jogadores
// pesam mais que 1 técnico, e é assim MESMO que ele quer.
//
//   node scripts/mockup-tecnico-carta.mjs [--saida tecnico-carta.png]
import { readFileSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright-core'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'tecnico-carta.png')
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6', GREEN = '#1B7A3D', RED = '#C2452F'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'

// os MESMOS degradês do CollectibleCard (screens.tsx) — a carta do técnico não
// inventa visual: ela é a carta que o jogo já tem, com o selo TEC no lugar da posição
const TIERS = {
  lenda: { grad: 'linear-gradient(160deg,#FFE79A,#FFC400 45%,#E8A200)', label: 'LENDA', ink: '#0C0C0C', tierColor: '#7a4d00' },
  craque: { grad: 'linear-gradient(160deg,#F4F7FB,#CBD4DE 55%,#9BA7B5)', label: 'CRAQUE', ink: '#0C0C0C', tierColor: '#4a5a6a' },
  bom: { grad: 'linear-gradient(160deg,#41C07A,#2E9E5B 55%,#1E7A45)', label: 'BOM TÉCNICO', ink: '#fff', tierColor: '#dff3e7' },
  prof: { grad: 'linear-gradient(160deg,#DBD1B5,#CBBF9E 55%,#B2A583)', label: 'FOI PROFISSIONAL', ink: '#0C0C0C', tierColor: '#6b5f43' },
}

const carta = (t, nome, clube, ano, estrelas, overall, esquemas, multa, bio, folk = false) => `
  <div style="width:236px;border:3px solid ${INK};border-radius:18px;background:${t.grad};box-shadow:5px 6px 0 ${INK};
    padding:12px;display:flex;flex-direction:column;gap:8px;position:relative;overflow:hidden">
    <div style="display:flex;justify-content:space-between;align-items:flex-start">
      <span style="${OSW};background:${INK};color:#fff;border:2px solid rgba(255,255,255,.25);border-radius:8px;font-size:11px;padding:2px 8px">TEC</span>
      <div style="text-align:right">
        <span style="${OSW};font-size:10px;letter-spacing:.06em;color:${t.tierColor}">${t.label}</span>
        ${folk ? `<br><span style="${OSW};background:rgba(0,0,0,.28);color:#fff;font-size:8px;border-radius:999px;padding:1px 7px;letter-spacing:.5px">🃏 FOLCLÓRICO</span>` : ''}
      </div>
    </div>
    <div style="align-self:center;width:66px;height:66px;border-radius:50%;background:rgba(255,255,255,.5);border:3px solid rgba(0,0,0,.28);
      display:flex;align-items:center;justify-content:center;${OSW};font-size:27px;color:${INK}">${nome.trim()[0]}</div>
    <div>
      <p style="${OSW};font-size:17px;color:${t.ink};margin:0;line-height:1.15">${nome}</p>
      <p style="font-family:system-ui;font-weight:800;font-size:10px;color:${t.ink};opacity:.62;margin:1px 0 0">${clube} · ${ano}</p>
      <p style="font-size:11px;letter-spacing:1px;margin:3px 0 0">${'⭐'.repeat(estrelas)}</p>
    </div>
    <div style="display:flex;gap:6px">
      <span style="flex:1;text-align:center;${OSW};font-size:10.5px;background:rgba(0,0,0,.22);color:#fff;border-radius:9px;padding:5px 0">📊 ${overall}</span>
      <span style="flex:1;text-align:center;${OSW};font-size:10.5px;background:rgba(0,0,0,.22);color:#fff;border-radius:9px;padding:5px 0">🎯 ${esquemas} esquema${esquemas > 1 ? 's' : ''}</span>
    </div>
    <p style="font-family:system-ui;font-weight:600;font-style:italic;font-size:9.5px;color:${t.ink};opacity:.78;line-height:1.3;margin:0">“${bio}”</p>
    <div style="text-align:center;${OSW};font-size:12px;background:${INK};color:${GOLD};border-radius:10px;padding:6px 0">💰 Multa: ${multa} 🪙</div>
  </div>`

const bloco = (tit, bg, txt, cor = INK) => `
  <div style="border:4px solid ${INK};border-radius:18px;background:${bg};box-shadow:4px 4px 0 ${INK};padding:15px 17px">
    <div style="${OSW};font-size:15px;text-transform:uppercase;margin-bottom:8px;color:${cor}">${tit}</div>
    <div style="font-family:system-ui;font-size:12.5px;font-weight:600;line-height:1.55">${txt}</div>
  </div>`

const html = `<!doctype html><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box;margin:0;padding:0}
body{background:${CREME};padding:32px;font-family:system-ui}</style>
<body>
  <div style="display:inline-block;background:${GOLD};border:3px solid ${INK};border-radius:999px;box-shadow:3px 3px 0 ${INK};
    padding:5px 16px;${OSW};font-size:12.5px;letter-spacing:.08em">🧢 O TÉCNICO É UMA CARTA · desenho fechado com o Diego 26/08</div>
  <h1 style="${OSW};text-transform:uppercase;font-size:36px;margin:12px 0 4px;line-height:1">Overall igual jogador. <span style="color:${RED}">Sem setor. Sem sistema novo.</span></h1>
  <p style="font-size:13.5px;font-weight:600;max-width:1010px;line-height:1.5;margin:0 0 20px">
    Uma vaga só no time (igual goleiro). A carta tem <b>categoria</b> (a cor) e <b>overall em faixa</b> — que rola
    por partida <b>igual jogador</b>: dia inspirado, dia congelado. A única coisa própria dele: a categoria diz
    <b>quantos esquemas ele libera</b>. E vale a frase do Diego: <i>"às vezes um time tem o melhor técnico, mas o
    outro time tem jogadores melhores"</i> — 11 jogadores pesam mais que 1 técnico, de propósito.
  </p>

  <div style="display:flex;gap:20px;align-items:flex-start;flex-wrap:wrap">
    ${carta(TIERS.lenda, 'Telê Santana', 'São Paulo', 1992, 5, '90–96', 5, 46, 'O maestro do futebol-arte. Qualquer esquema, nas mãos dele, vira espetáculo.')}
    ${carta(TIERS.craque, 'Renato Gaúcho', 'Grêmio', 2017, 4, '82–88', 4, 28, 'Confia no talento, resolve na resenha. Na beira do campo é personagem.')}
    ${carta(TIERS.prof, 'Zé da Prancheta', 'Peladão da Vila', 2024, 1, '55–65', 1, 3, 'Grita muito, entende pouco — mas o churrasco do fim de ano é ele quem faz.', true)}
    <div style="flex:1;min-width:340px;display:flex;flex-direction:column;gap:13px">
      ${bloco('🎯 Esquemas por categoria (regra do Diego)', '#fff', `
        👑 Lenda <b>5</b> · 💎 Craque <b>4</b> · 🌟 Promessa <b>3</b> · 👍 Bom <b>2</b> · 🪖 Foi profissional <b>1</b><br>
        Time sem esquema liberado joga no <b>4-3-3</b> de sempre — técnico nunca TRAVA nada que existe hoje, só ABRE opção.`)}
      ${bloco('⚙️ Como a carta joga (por dentro)', '#FFF6D6', `
        A cada partida o overall dele <b>rola na faixa</b>, igual jogador — e vira um empurrão pequeno no time
        inteiro. Um Telê no dia bom vale uns <b>+2</b>; o Zé da Prancheta, quase nada. O número exato eu
        <b>calibro com medição</b> (já sabemos o teto: +2 geral é o limite seguro; +8 dava 100% de título e
        matava o campeonato). O jogador nunca vê essa conta — ele vê a carta.`)}
    </div>
  </div>

  <h2 style="${OSW};text-transform:uppercase;font-size:24px;margin:26px 0 12px">💰 E como contrata? A dança das cadeiras</h2>
  <div style="display:flex;gap:14px;flex-wrap:wrap">
    <div style="flex:1;min-width:250px">${bloco('1 · Todo clube tem o seu', '#fff', `São <b>100 clubes = 100 técnicos</b>. Carreira nova começa com um técnico fraquinho da sua divisão. Ninguém fica sem — nem os bots.`)}</div>
    <div style="flex:1;min-width:250px">${bloco('2 · Pagou a multa, levou', '#fff', `Na <b>Sala da Presidência</b>, só na <b>virada de temporada</b> (nada de parar leilão). Você paga a multa, o clube dele recebe a grana, e os dois técnicos <b>TROCAM de clube</b> — o seu vai pra lá. Cadeira nunca fica vazia.`)}</div>
    <div style="flex:1;min-width:250px">${bloco('3 · A trava da escada', '#FFF0EC', `Só dá pra contratar técnico de clube <b>da sua divisão pra baixo</b>. Série D não anda com lenda. Subiu de divisão? Pode <b>segurar o seu</b> — lealdade vale.`, '#8E2A1B')}</div>
    <div style="flex:1;min-width:250px">${bloco('4 · Caiu? Ele mete o pé', '#FFF0EC', `Regra do Diego: <i>"o técnico na hora de meter o pé, quando cai, ele mete"</i>. Clube rebaixado troca de técnico com clube promovido — cada um fica na divisão que merece. É isso que <b>renova as divisões</b> sozinho.`, '#8E2A1B')}</div>
  </div>

  <p style="margin-top:20px;font-size:12px;font-weight:700;color:rgba(0,0,0,.55)">
    🔒 Tudo atrás da trava <b>tecnicosOn</b>: só carreira NOVA vê técnico. Save antigo e o online com os amigos não mudam NADA.
    &nbsp;·&nbsp; ⚽ Leilão <span style="color:${RED};${OSW}">Legends</span></p>
</body>`

const tmp = `/tmp/mock-tec-carta-${process.pid}.html`
writeFileSync(tmp, html)
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1240, height: 900 }, deviceScaleFactor: 2 })
await p.goto('file://' + tmp)
await p.evaluate(() => document.fonts.ready)
await p.waitForTimeout(500)
await p.screenshot({ path: SAIDA, fullPage: true })
await b.close()
console.log(SAIDA)
