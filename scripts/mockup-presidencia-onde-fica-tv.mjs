// ─── 📺 "CADÊ A TV E O BICO?" — a dúvida do Diego (24/08) ───────────────────
//
// Palavras dele: *"Única coisa q N entendi q vc tirando aba de patrocínio eu N
// vejo mais a TV e N vejo mais o bico então N entendi"*.
//
// A culpa é minha: eu falei "engolir o Patrocínio" e soou como APAGAR. Não é.
// Nada some — a MESMA tela muda de porta. Este mockup mostra as duas opções
// lado a lado, com o caminho do dedo em cada uma, pra ele escolher vendo.
//
//   node scripts/mockup-presidencia-onde-fica-tv.mjs [--saida x.png]
import { readFileSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright-core'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'presidencia-onde-fica-tv.png')
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D', RED = '#C2452F', PURPLE = '#7C3AED'
const CREME = '#F4ECD6'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'
const box = (bg = '#fff') => `border:3px solid ${INK};border-radius:16px;background:${bg};box-shadow:4px 4px 0 0 ${INK}`

const fone = (inner, rot, cor, nota) => `
<div style="flex:0 0 372px">
  <div style="${OSW};font-size:15px;text-transform:uppercase;letter-spacing:.06em;color:${cor}">${rot}</div>
  <div style="font-family:system-ui;font-weight:600;font-size:11.5px;color:rgba(12,12,12,.5);margin:3px 0 9px;min-height:44px">${nota}</div>
  <div style="width:372px;border:5px solid ${INK};border-radius:26px;background:${CREME};box-shadow:6px 6px 0 ${INK};overflow:hidden">${inner}</div>
</div>`

const cabecinha = `
  <div style="background:${INK};padding:10px 13px;color:#fff;display:flex;align-items:center;justify-content:space-between">
    <span style="${OSW};font-size:13px">🏟️ CLUBE</span>
    <span style="font-family:system-ui;font-size:9px;font-weight:800;color:rgba(255,255,255,.5)">NEYMARZETTI · SÉRIE C</span>
  </div>`

const pilulas = (abas, ativa) => `
  <div style="display:flex;gap:5px;padding:9px 10px 11px;background:${CREME};border-bottom:2.5px solid rgba(12,12,12,.16)">
    ${abas.map(([i, t]) => `
      <div style="flex:1;border:2.5px solid ${INK};border-radius:11px;background:${t === ativa ? PURPLE : '#fff'};color:${t === ativa ? '#fff' : INK};
        box-shadow:2px 2px 0 ${INK};padding:7px 1px;text-align:center;${OSW};font-size:8.5px;text-transform:uppercase">${i} ${t}</div>`).join('')}
  </div>`

// as DUAS peças que ele tem medo de perder — desenhadas igualzinho nas 2 opções
const bico = `
  <div style="border:2.5px solid ${INK};border-radius:12px;padding:9px 11px;background:#F7FBF3;display:flex;align-items:center;gap:9px;margin-bottom:7px">
    <span style="font-size:22px">🥤</span>
    <div style="flex:1;min-width:0">
      <p style="${OSW};font-size:12.5px;margin:0">Guaraná Gigante · meta: SUBIR</p>
      <p style="font-family:system-ui;font-size:9.5px;font-weight:700;color:rgba(0,0,0,.5);margin:1px 0 0">bateu a meta = 90 🪙 no fim da temporada</p>
    </div>
  </div>`
const tv = `
  <div style="border:2.5px solid ${INK};border-radius:12px;padding:9px 11px;background:#FFF6D6;display:flex;align-items:center;gap:9px">
    <span style="font-size:22px">📺</span>
    <div style="flex:1;min-width:0">
      <p style="${OSW};font-size:12.5px;margin:0">Rede Martelo TV · cota extra</p>
      <p style="font-family:system-ui;font-size:9.5px;font-weight:700;color:rgba(0,0,0,.5);margin:1px 0 0">1 vídeo por temporada = 10 moedas no clube</p>
    </div>
  </div>`
const regua = `
  <div style="border:2.5px dashed rgba(12,12,12,.3);border-radius:12px;padding:8px 11px;background:#fff;margin-top:7px">
    <p style="${OSW};font-size:11px;margin:0;color:rgba(0,0,0,.55)">📊 Tabela de valores por divisão</p>
  </div>`

// ── OPÇÃO A: a Presidência ENGOLE (o que eu tinha proposto) ────────────────
const A = `${cabecinha}
  ${pilulas([['🏗️', 'Estrutura'], ['💰', 'Finanças'], ['🎩', 'Presidência']], 'Presidência')}
  <div style="padding:11px">
    <div style="${box('#EDE7FF')};padding:9px 11px;margin-bottom:9px;font-family:system-ui;font-size:11px;font-weight:800;line-height:1.4">
      👆 Você tocou em <b>🎩 PRESIDÊNCIA</b> — e a PRIMEIRA coisa que aparece é o patrocínio.</div>
    <div style="${box('#fff')};padding:12px;border-color:${GREEN}">
      <p style="${OSW};font-size:14px;margin:0 0 2px">🤝 Patrocínio da temporada</p>
      <p style="font-family:system-ui;font-size:10px;font-weight:700;color:rgba(0,0,0,.5);margin:0 0 8px">Exatamente a mesma tela de hoje — nem um pixel mudou.</p>
      ${bico}${tv}${regua}
    </div>
    <div style="${box('#F3F0E6')};padding:10px 12px;margin-top:9px;font-family:system-ui;font-size:10.5px;font-weight:700;color:rgba(0,0,0,.55);line-height:1.45">
      ⬇️ e ABAIXO continua a sala: retrato · escudo/manto/mascote · técnico · garagem · patrimônio · troféus.</div>
  </div>`

// ── OPÇÃO B: as duas pílulas, lado a lado (mais simples de entender) ───────
const B = `${cabecinha}
  ${pilulas([['🏗️', 'Estrut.'], ['💰', 'Finanç.'], ['🤝', 'Patroc.'], ['🎩', 'Presid.']], 'Patroc.')}
  <div style="padding:11px">
    <div style="${box('#DFF3E3')};padding:9px 11px;margin-bottom:9px;font-family:system-ui;font-size:11px;font-weight:800;line-height:1.4">
      👆 <b>🤝 PATROCÍNIO</b> continua sendo um botão só dele — do jeitinho que você já conhece.</div>
    <div style="${box('#fff')};padding:12px;border-color:${GREEN}">
      <p style="${OSW};font-size:14px;margin:0 0 2px">🤝 Patrocínio da temporada</p>
      <p style="font-family:system-ui;font-size:10px;font-weight:700;color:rgba(0,0,0,.5);margin:0 0 8px">Nada muda de lugar. Zero risco de alguém se perder.</p>
      ${bico}${tv}${regua}
    </div>
    <div style="${box('#EDE7FF')};padding:10px 12px;margin-top:9px;font-family:system-ui;font-size:10.5px;font-weight:700;line-height:1.45">
      🎩 A <b>Presidência</b> vira a 4ª pílula, com o resto da sala (retrato · escudo/manto/mascote · técnico · garagem · patrimônio · troféus).</div>
  </div>`

const bloco = (tit, bg, txt) => `
  <div style="border:4px solid ${INK};border-radius:18px;background:${bg};box-shadow:4px 4px 0 ${INK};padding:16px 18px;margin-bottom:14px">
    <div style="${OSW};font-size:16px;text-transform:uppercase;margin-bottom:9px">${tit}</div>
    <div style="font-family:system-ui;font-size:12.5px;font-weight:600;line-height:1.55">${txt}</div>
  </div>`

const html = `<!doctype html><meta charset="utf-8"><style>${FONTES}
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:${CREME};padding:34px 34px 28px;font-family:system-ui}</style>
<body>
  <div style="display:inline-block;background:${RED};color:#fff;border:3px solid ${INK};border-radius:999px;box-shadow:3px 3px 0 ${INK};
    padding:5px 15px;${OSW};font-size:12.5px;letter-spacing:.08em">📺 CADÊ A TV E O BICO?</div>
  <h1 style="${OSW};text-transform:uppercase;font-size:43px;margin:14px 0 6px;line-height:1">
    CULPA MINHA — <span style="color:${RED}">NADA SOME</span></h1>
  <p style="font-size:14.5px;font-weight:600;max-width:1150px;line-height:1.5;margin:0 0 24px">
    Eu falei <b>"a Presidência engole o Patrocínio"</b> e isso soou como APAGAR. Não é isso.
    <b>A tela do patrocínio continua inteira</b>, com o bico do patrocinador, a Rede Martelo TV e a tabela de valores —
    ela só entraria por <b>outra porta</b>. Mas se isso gera dúvida em VOCÊ, vai gerar no jogador também. Então olha as duas
    opções e escolhe vendo:
  </p>

  <div style="display:flex;gap:26px;align-items:flex-start;flex-wrap:wrap;margin-bottom:28px">
    ${fone(A, 'Opção A — porta nova', PURPLE, 'O botão 🤝 some da fileira e o patrocínio vira a PRIMEIRA mesa dentro da 🎩 Presidência. Menos botão, mas um toque a mais pra quem já sabia o caminho.')}
    ${fone(B, 'Opção B — cada um no seu botão', GREEN, 'O 🤝 Patrocínio fica EXATAMENTE onde está, e a 🎩 Presidência vira a 4ª pílula. Ninguém precisa reaprender nada.')}
    <div style="flex:1;min-width:390px">
      ${bloco('✅ Minha recomendação MUDOU: vai de B', '#E6F3EA', `
        Eu tinha recomendado a A quando achava que o Clube já tinha 4 pílulas (era o erro da Agência que você pegou).
        Com <b>3 pílulas</b>, a 4ª cabe folgada — então <b>não existe motivo pra mexer no que já funciona</b>.<br><br>
        E tem o motivo mais forte: <b>você mesmo travou na explicação</b>. Se o dono do jogo ficou em dúvida de onde
        acha a TV, o jogador que entra uma vez por semana some. <b>A opção B não muda nada de lugar</b> — só ganha
        um botão novo.`)}
      ${bloco('🔒 O que a opção B garante', '#EAF3FF', `
        · O <b>bico do patrocinador</b> continua no mesmo botão de sempre;<br>
        · a <b>Rede Martelo TV</b> continua no mesmo botão de sempre (e o banner da TV continua abrindo direto lá);<br>
        · a <b>tabela de valores</b> por divisão idem;<br>
        · <b>nenhum atalho antigo quebra</b> — recibo de fim de temporada, banner, tudo continua caindo onde caía.<br><br>
        A Presidência entra <b>só somando</b>: retrato de posse, escudo/manto/mascote, técnico e garagem EM BREVE,
        patrimônio, troféus e a linha do mandato.`)}
      ${bloco('🙋 Me responde só isso', '#FFF6D6', `
        <b>Fecho na opção B?</b> (patrocínio fica onde está, Presidência vira o 4º botão)<br><br>
        Se sim, eu já começo a codar — <b>uma mesa por commit</b>, tudo reversível, e o patrocínio nem é tocado
        (o que não se mexe não quebra).`)}
    </div>
  </div>

  <p style="${OSW};font-size:15px">⚽ Leilão <span style="color:${RED}">Legends</span>
    <span style="float:right;font-weight:700;font-size:12px;opacity:.45">leilaolegends.com</span></p>
</body></html>`

const tmp = `/tmp/mockup-ondetv-${process.pid}.html`
writeFileSync(tmp, html)
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1560, height: 1000 }, deviceScaleFactor: 2 })
await p.goto('file://' + tmp)
await p.evaluate(() => document.fonts.ready)
await p.waitForTimeout(600)
await p.screenshot({ path: SAIDA, fullPage: true })
await b.close()
console.log(SAIDA)
