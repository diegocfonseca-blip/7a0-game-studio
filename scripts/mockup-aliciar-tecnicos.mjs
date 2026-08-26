// ─── 🔎 ALICIAR NO ELENCO — técnicos pra todos, jogadores só pro Diego (26/08) ─
//
// Decisão dele (por cima do mockup da Presidência): *"o aliciar ficaria lá em
// ELENCO, e não mais na presidência... o usuário veria os times da divisão dele e
// escolheria os TÉCNICOS pra ir pra LEILÃO e não comprar direto ao selecionar.
// Além disso já faça a área de JOGADOR pra aliciar que somente EU vou poder ver
// com meu usuário — os outros veem apenas o técnico."*
//
// E o aviso importante: NÃO copiar o visual do modo Manager oculto (os prints que
// ele mandou) — aquilo é do início do jogo. Estas telas nascem no visual DE HOJE:
// creme, borda preta grossa, sombra dura, Oswald, pílulas e botões da casa.
//
//   node scripts/mockup-aliciar-tecnicos.mjs [--saida aliciar-tecnicos.png]
import { readFileSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright-core'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'aliciar-tecnicos.png')
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6', GREEN = '#1B7A3D', RED = '#C2452F', PURPLE = '#7C3AED'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'

const fone = (titulo, corpo) => `
  <div style="width:372px;background:${CREME};border:5px solid ${INK};border-radius:26px;box-shadow:6px 6px 0 ${INK};overflow:hidden;flex:none">
    <div style="background:${INK};color:#fff;padding:10px 14px;display:flex;justify-content:space-between;align-items:center">
      <span style="${OSW};font-size:13px;text-transform:uppercase">${titulo}</span>
      <span style="${OSW};font-size:11px;color:${GOLD}">💰 320 🪙</span>
    </div>
    <div style="padding:12px 12px 16px">${corpo}</div>
  </div>`

const clube = (nome, rival = false) => `
  <button style="width:100%;text-align:left;${OSW};font-size:13px;border:3px solid ${INK};border-radius:12px;
    background:${rival ? '#FFF3C4' : '#fff'};box-shadow:2.5px 2.5px 0 ${INK};padding:10px 12px;margin-bottom:7px;
    display:flex;justify-content:space-between;align-items:center">
    <span>${rival ? '⚔️ ' : ''}${nome}</span><span style="font-size:11px;opacity:.55">›</span>
  </button>`

const jog = (pos, nome, faixa, forte, contrato) => `
  <div style="display:flex;align-items:center;gap:8px;border:2.5px solid ${contrato ? 'rgba(0,0,0,.35)' : INK};border-radius:12px;
    background:${contrato ? '#eee' : '#fff'};padding:7px 10px;margin-bottom:6px;${contrato ? 'opacity:.6' : `box-shadow:2px 2px 0 ${INK}`}">
    <span style="${OSW};font-size:9.5px;background:${INK};color:#fff;border-radius:7px;padding:2px 6px;flex:none">${pos}</span>
    <span style="${OSW};font-size:13px;flex:1">${nome}</span>
    <span style="${OSW};font-size:10px;background:${forte ? GOLD : '#DFF3E7'};border:2px solid ${INK};border-radius:8px;padding:1px 6px">📊 ${faixa}</span>
    ${contrato
      ? `<span style="${OSW};font-size:9.5px;color:#a15c4e">🔒 contrato</span>`
      : `<span style="${OSW};font-size:10.5px;color:${GREEN}">+ aliciar</span>`}
  </div>`

const bloco = (tit, bg, txt) => `
  <div style="border:4px solid ${INK};border-radius:18px;background:${bg};box-shadow:4px 4px 0 ${INK};padding:14px 16px;margin-bottom:12px">
    <div style="${OSW};font-size:14px;text-transform:uppercase;margin-bottom:6px">${tit}</div>
    <div style="font-family:system-ui;font-size:12.5px;font-weight:600;line-height:1.55">${txt}</div>
  </div>`

// ── TELA 1: dentro do ELENCO, a seção nova de aliciar ──────────────────────
const tela1 = fone('🧢 Elenco · Série B', `
  <div style="border:3px solid ${INK};border-radius:14px;background:#fff;box-shadow:3px 3px 0 ${INK};padding:10px 12px;margin-bottom:12px">
    <p style="${OSW};font-size:12px;text-transform:uppercase;margin:0">⚽ Meu Timão · 4-4-2</p>
    <p style="font-family:system-ui;font-size:10px;font-weight:700;color:rgba(0,0,0,.5);margin:2px 0 0">campinho, reservas e formação (como já é hoje)</p>
  </div>

  <p style="${OSW};font-size:11px;text-transform:uppercase;letter-spacing:.12em;color:rgba(0,0,0,.55);margin:0 0 4px">🔎 Aliciar · Série B</p>
  <p style="font-family:system-ui;font-size:10.5px;font-weight:700;color:rgba(0,0,0,.6);line-height:1.45;margin:0 0 8px">
    Toque num clube da sua divisão pra ver o <b>técnico</b> dele — quem você aliciar vai pro
    <b>LEILÃO</b> (você × seus rivais × o dono). Nada de compra direta.</p>
  ${clube('Bagres do Rio', true)}
  ${clube('Caixote EC', true)}
  ${clube('Nacional da Serra')}
  ${clube('Esporte do Cerrado')}
  ${clube('Guarani do Agreste')}
  ${clube('Comercial das Gerais')}
  <p style="text-align:center;font-family:system-ui;font-size:9.5px;font-weight:700;color:rgba(0,0,0,.45);margin:4px 0 0">⚔️ = rival seu · as outras divisões ficam no mistério</p>
`)

// ── TELA 2: dentro do clube — técnico (todos) + jogadores (SÓ o Diego) ─────
const tela2 = fone('🔎 Caixote EC', `
  <p style="${OSW};font-size:11px;text-transform:uppercase;letter-spacing:.12em;color:rgba(0,0,0,.55);margin:0 0 6px">🧢 O técnico deles</p>
  <div style="border:3px solid ${INK};border-radius:16px;background:linear-gradient(160deg,#F4F7FB,#CBD4DE 55%,#9BA7B5);box-shadow:4px 4px 0 ${INK};padding:11px">
    <div style="display:flex;gap:10px;align-items:center">
      <div style="width:50px;height:50px;border-radius:50%;background:rgba(255,255,255,.55);border:3px solid rgba(0,0,0,.28);display:flex;align-items:center;justify-content:center;${OSW};font-size:22px;flex:none">T</div>
      <div style="flex:1;min-width:0">
        <div style="display:flex;justify-content:space-between;align-items:baseline">
          <p style="${OSW};font-size:16px;margin:0">Telê Santana</p>
          <span style="${OSW};font-size:9px;color:#4a5a6a">GIGANTE · SÉRIE B ⭐⭐⭐⭐</span>
        </div>
        <p style="font-family:system-ui;font-size:10px;font-weight:700;color:rgba(0,0,0,.6);margin:1px 0 0">📊 84–90 · 🎯 4 esquemas · TEC</p>
      </div>
    </div>
    <button style="width:100%;margin-top:9px;${OSW};font-size:13px;text-transform:uppercase;background:${GOLD};
      border:3px solid ${INK};border-radius:12px;box-shadow:3px 3px 0 ${INK};padding:10px 0">🔨 Aliciar pro leilão</button>
    <p style="font-family:system-ui;font-size:9.5px;font-weight:700;color:rgba(0,0,0,.55);margin:6px 2px 0;line-height:1.4">
      Vai pro pregão: <b>você × seus rivais × o Caixote</b> (o dono briga pra segurar). Levou? Os técnicos <b>trocam de clube</b>.</p>
  </div>

  <div style="border:3px dashed ${PURPLE};border-radius:16px;padding:10px;margin-top:12px;background:rgba(124,58,237,.06)">
    <p style="${OSW};font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:${PURPLE};margin:0 0 6px">🔒 SÓ VOCÊ VÊ (teste da sua conta) · Jogadores</p>
    ${jog('GOL', 'Dida', '85–92', true, false)}
    ${jog('ZAG', 'Gamarra', '85–92', true, true)}
    ${jog('MEI', 'Adílio', '87–93', true, false)}
    ${jog('ATA', 'Guerrero', '80–84', false, false)}
    <p style="font-family:system-ui;font-size:9.5px;font-weight:700;color:rgba(0,0,0,.5);margin:4px 2px 0;line-height:1.4">
      Mesma regra do técnico: aliciar = <b>leilão</b>, até as vagas da posição. Sob contrato não vai. Aprovou o teste → libera geral.</p>
  </div>
`)

const html = `<!doctype html><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box;margin:0;padding:0}
body{background:#fff;padding:30px;font-family:system-ui}
button{cursor:default}</style>
<body>
  <div style="display:inline-block;background:${GOLD};border:3px solid ${INK};border-radius:999px;box-shadow:3px 3px 0 ${INK};
    padding:5px 16px;${OSW};font-size:12.5px;letter-spacing:.08em">🔎 ALICIAR NO ELENCO · técnicos pra todos · jogadores SÓ pra sua conta</div>
  <div style="display:flex;gap:22px;align-items:flex-start;margin-top:16px;flex-wrap:wrap">
    <div>
      <p style="${OSW};font-size:12px;text-transform:uppercase;color:rgba(0,0,0,.5);margin:0 0 7px">Tela 1 · a seção nova no ELENCO</p>
      ${tela1}
    </div>
    <div>
      <p style="${OSW};font-size:12px;text-transform:uppercase;color:${GREEN};margin:0 0 7px">Tela 2 · dentro do clube</p>
      ${tela2}
    </div>
    <div style="flex:1;min-width:330px;max-width:470px">
      ${bloco('O que mudou do mockup anterior', '#fff', `
        · O mercado de técnicos <b>SAI da Presidência</b> e vira <b>Aliciar no Elenco</b>, como você mandou.<br>
        · <b>Nada de multa direta</b>: técnico aliciado vai pro <b>LEILÃO</b> — você × rivais × o clube dono.<br>
        · Visual <b>zero herdado</b> do Manager oculto: tudo nos botões, cores e pílulas de HOJE.`)}
      ${bloco('👁️ Quem vê o quê', '#F3EAFE', `
        · <b>Técnicos</b>: todo mundo (carreira nova, trava <code>tecnicosOn</code>).<br>
        · <b>Jogadores</b>: só a SUA conta (mesmo esquema do basquete: trava por e-mail).
        Os outros nem sabem que a área existe até você aprovar o teste.`)}
      ${bloco('🧢 A lista dos 100 (fechada por você hoje)', '#FFF6D6', `
        A 20 · B 20 · C 20 · D 20 · Várzea 20 — gravada em <code>docs/tecnicos-100.md</code>.
        Esquemas por categoria: <b>A 5 · B 4 · C 3 · D 2 · Várzea 1</b>. No exemplo, o Telê
        aparece como <b>Série B</b> (a categoria é a da SUA lista, não a da fama do nome).`)}
      ${bloco('✅ Segurança', '#E6F3EA', `
        Só carreira nova · outras divisões no mistério (igual hoje) · sob contrato não alicia ·
        nada disso encosta no online com os amigos. Cada degrau = 1 commit revertível.`)}
    </div>
  </div>
</body>`

const tmp = `/tmp/mock-aliciar-${process.pid}.html`
writeFileSync(tmp, html)
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1280, height: 980 }, deviceScaleFactor: 2 })
await p.goto('file://' + tmp)
await p.evaluate(() => document.fonts.ready)
await p.waitForTimeout(500)
await p.screenshot({ path: SAIDA, fullPage: true })
await b.close()
console.log(SAIDA)
