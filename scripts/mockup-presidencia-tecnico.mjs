// ─── 👔 O TÉCNICO DENTRO DA SALA DA PRESIDÊNCIA (Diego 26/08) ───────────────
//
// Ele pediu o mockup da Sala da Presidência já com o técnico do desenho novo
// (carta com overall igual jogador, esquemas por categoria, mercado por multa).
// A Presidência é a 4ª pílula (opção B, já aprovada em 24/08): Patrocínio NÃO
// muda de lugar.
//
//   node scripts/mockup-presidencia-tecnico.mjs [--saida presidencia-tecnico.png]
import { readFileSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright-core'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'presidencia-tecnico.png')
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6', GREEN = '#1B7A3D', RED = '#C2452F', PURPLE = '#7C3AED'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'

const pill = (ic, tx, on = false) => `
  <div style="flex:1;text-align:center;padding:8px 0 7px;border-radius:12px;${on ? `background:${GOLD};border:2.5px solid ${INK};box-shadow:2px 2px 0 ${INK}` : 'opacity:.55'}">
    <div style="font-size:16px;line-height:1">${ic}</div>
    <div style="${OSW};font-size:9px;text-transform:uppercase;margin-top:2px">${tx}</div>
  </div>`

const esquema = (nome, aberto) => `
  <span style="${OSW};font-size:10.5px;border:2px solid ${INK};border-radius:9px;padding:4px 8px;
    background:${aberto ? '#E6F3EA' : '#eee'};color:${aberto ? INK : 'rgba(0,0,0,.4)'}">${aberto ? '✅' : '🔒'} ${nome}</span>`

const linhaMercado = (nome, tier, tierCor, ov, esq, multa, trava) => `
  <div style="display:flex;align-items:center;gap:8px;border:2.5px solid ${INK};border-radius:12px;background:#fff;padding:8px 10px;${trava ? 'opacity:.55' : ''}">
    <div style="width:34px;height:34px;border-radius:50%;background:${tierCor};border:2px solid rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;${OSW};font-size:15px;flex:none">${nome[0]}</div>
    <div style="flex:1;min-width:0">
      <p style="${OSW};font-size:12.5px;margin:0;line-height:1.1">${nome}</p>
      <p style="font-family:system-ui;font-size:9.5px;font-weight:700;color:rgba(0,0,0,.55);margin:1px 0 0">${tier} · 📊 ${ov} · 🎯 ${esq} esquemas</p>
    </div>
    ${trava
      ? `<span style="${OSW};font-size:9px;text-align:center;line-height:1.2">🔒 clube da<br>Série A</span>`
      : `<button style="${OSW};font-size:11px;background:${GOLD};border:2.5px solid ${INK};border-radius:10px;box-shadow:2px 2px 0 ${INK};padding:6px 9px">💰 ${multa}</button>`}
  </div>`

const bloco = (tit, bg, txt) => `
  <div style="border:4px solid ${INK};border-radius:18px;background:${bg};box-shadow:4px 4px 0 ${INK};padding:15px 17px;margin-bottom:13px">
    <div style="${OSW};font-size:14.5px;text-transform:uppercase;margin-bottom:7px">${tit}</div>
    <div style="font-family:system-ui;font-size:12.5px;font-weight:600;line-height:1.55">${txt}</div>
  </div>`

const html = `<!doctype html><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box;margin:0;padding:0}
body{background:#fff;padding:32px;font-family:system-ui}
button{cursor:default}</style>
<body>
  <div style="display:inline-block;background:${PURPLE};color:#fff;border:3px solid ${INK};border-radius:999px;box-shadow:3px 3px 0 ${INK};
    padding:5px 16px;${OSW};font-size:12.5px;letter-spacing:.08em">👔 SALA DA PRESIDÊNCIA · agora com o TÉCNICO</div>
  <div style="display:flex;gap:26px;align-items:flex-start;margin-top:16px;flex-wrap:wrap">

    <!-- 📱 o celular -->
    <div style="width:375px;background:${CREME};border:5px solid ${INK};border-radius:26px;box-shadow:6px 6px 0 ${INK};overflow:hidden;flex:none">
      <div style="background:${INK};color:#fff;padding:10px 14px;display:flex;justify-content:space-between;align-items:center">
        <span style="${OSW};font-size:13px;text-transform:uppercase">👔 Sala da Presidência</span>
        <span style="${OSW};font-size:11px;color:${GOLD}">💰 1.240 🪙</span>
      </div>
      <div style="padding:12px 12px 16px">
        <!-- pílulas (opção B aprovada: Patrocínio fica, Presidência é a 4ª) -->
        <div style="display:flex;gap:6px;background:#fff;border:3px solid ${INK};border-radius:14px;padding:5px;box-shadow:3px 3px 0 ${INK}">
          ${pill('🧢', 'Elenco')}${pill('🕴️', 'Agência')}${pill('📺', 'Patrocínio')}${pill('👔', 'Presidência', true)}
        </div>

        <!-- o técnico atual: a CARTA compacta -->
        <p style="${OSW};font-size:11px;text-transform:uppercase;letter-spacing:.12em;color:rgba(0,0,0,.55);margin:13px 0 6px">🧢 Seu técnico</p>
        <div style="border:3px solid ${INK};border-radius:16px;background:linear-gradient(160deg,#F4F7FB,#CBD4DE 55%,#9BA7B5);box-shadow:4px 4px 0 ${INK};padding:11px;display:flex;gap:10px;align-items:center">
          <div style="width:54px;height:54px;border-radius:50%;background:rgba(255,255,255,.55);border:3px solid rgba(0,0,0,.28);display:flex;align-items:center;justify-content:center;${OSW};font-size:24px;flex:none">R</div>
          <div style="flex:1;min-width:0">
            <div style="display:flex;justify-content:space-between;align-items:baseline">
              <p style="${OSW};font-size:16px;margin:0">Renato Gaúcho</p>
              <span style="${OSW};font-size:9px;color:#4a5a6a;letter-spacing:.05em">CRAQUE ⭐⭐⭐⭐</span>
            </div>
            <p style="font-family:system-ui;font-size:10px;font-weight:700;color:rgba(0,0,0,.6);margin:1px 0 4px">📊 82–88 · 💰 multa 28 🪙 · com você há 2 temporadas</p>
            <div style="display:flex;gap:4px;flex-wrap:wrap">${esquema('4-3-3', true)}${esquema('4-4-2', true)}${esquema('4-5-1', true)}${esquema('3-4-3', true)}${esquema('5-3-2', false)}</div>
          </div>
        </div>
        <p style="font-family:system-ui;font-size:10px;font-weight:700;color:rgba(0,0,0,.5);margin:7px 2px 0;line-height:1.4">
          😜 Ele arma o time no vestiário… mas quem escala, quem muda o esquema e quem paga o salário é <b>você, presidente</b>.</p>

        <!-- mercado -->
        <p style="${OSW};font-size:11px;text-transform:uppercase;letter-spacing:.12em;color:rgba(0,0,0,.55);margin:14px 0 6px">🔁 Mercado de técnicos <span style="font-size:9px">(abre na virada da temporada)</span></p>
        <div style="display:flex;flex-direction:column;gap:7px">
          ${linhaMercado('Zagallo do Grotão', '👍 Bom', '#DBD1B5', '70–77', 2, '12 🪙', false)}
          ${linhaMercado('Mestre Sabença', '🌟 Promessa', '#41C07A', '76–83', 3, '19 🪙', false)}
          ${linhaMercado('Telê Santana', '👑 Lenda', '#FFC400', '90–96', 5, '46 🪙', true)}
        </div>
        <p style="font-family:system-ui;font-size:9.5px;font-weight:700;color:rgba(0,0,0,.5);margin:8px 2px 0;line-height:1.45">
          🔒 O Telê está num clube da <b>Série A</b> — você está na B. Suba de divisão pra alcançar ele. Contratou? Os dois técnicos <b>trocam de clube</b>.</p>
      </div>
    </div>

    <!-- as notas do lado -->
    <div style="flex:1;min-width:360px;max-width:520px">
      ${bloco('O que esta tela respeita', '#fff', `
        · <b>Opção B</b> (você aprovou 24/08): Patrocínio NÃO muda de lugar — a Presidência é a 4ª pílula.<br>
        · A carta do técnico é o <b>MESMO visual</b> das cartas de jogador (cor da categoria, estrelas, faixa).<br>
        · A zoeira que você pediu: ele é o técnico, <b>mas quem manda é você</b>.`)}
      ${bloco('⏱️ Nada atrasa o jogo', '#FFF6D6', `
        O mercado só abre <b>na virada de temporada</b>, dentro da Presidência. O leilão, a rodada e o online
        com os amigos <b>não ganham nenhum passo novo</b>. Regra de ouro respeitada.`)}
      ${bloco('🔒 Travas', '#FFF0EC', `
        · Só <b>carreira NOVA</b> (tecnicosOn) — save antigo não vê nada disso.<br>
        · Só contrata técnico de clube <b>da sua divisão pra baixo</b>.<br>
        · Caiu de divisão → o técnico <b>mete o pé</b> (troca com o de um clube promovido).<br>
        · Sem técnico NUNCA: a dança das cadeiras garante os 100 clubes com os 100 técnicos.`)}
      ${bloco('✅ Reverter', '#E6F3EA', `Cada degrau é um commit isolado. E enquanto você não aprovar o visual, nada disso vai pra main.`)}
    </div>
  </div>
</body>`

const tmp = `/tmp/mock-pres-tec-${process.pid}.html`
writeFileSync(tmp, html)
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1100, height: 980 }, deviceScaleFactor: 2 })
await p.goto('file://' + tmp)
await p.evaluate(() => document.fonts.ready)
await p.waitForTimeout(500)
await p.screenshot({ path: SAIDA, fullPage: true })
await b.close()
console.log(SAIDA)
