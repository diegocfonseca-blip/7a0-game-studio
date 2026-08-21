// ─── ⚽ MOCKUP: "E AGORA, O QUE EU FAÇO?" (opção 3) ──────────────────────────
//
// 🔎 O QUE EU ACHEI DE VERDADE NO CÓDIGO (e onde eu tinha errado):
// na minha lista eu disse que "o botão de tocar a temporada fica no meio de
// outros do mesmo tamanho". **Isso está errado** — o Diego já arrumou isso em
// 13/08 (*"tá confuso, botão manual deveria ter um fundo envolvendo"*): hoje o
// MODO MANUAL tem um cartão "🎮 Controle da partida" com o botão verde GRANDE
// à esquerda e o ⏭️ Pular / 🔁 Modo auto miúdos à direita. Está bom.
//
// O buraco de verdade é OUTRO, e é maior:
//   1. **No MODO AUTOMÁTICO — que é o padrão — não existe botão nenhum.** Sobra
//      só uma tirinha branca "⏸️ MANUAL: pausar entre as rodadas". A rodada anda
//      sozinha a cada 9s e quem abriu o jogo não sabe se tem que fazer algo,
//      quanto falta, nem contra quem vai jogar.
//   2. **O botão verde não diz QUAL é o jogo.** Diz "▶️ Próxima rodada" — nunca
//      "contra quem". A pergunta que a pessoa tem na cabeça ("e agora?") é
//      respondida com o nome de um botão genérico.
//
// 💡 A PROPOSTA: o botão (ou a linha, no automático) VIRA a resposta.
//   · manual   → "▶️ Rodada 19 · vs Skyy FC (fora)"
//   · auto     → linha viva: "⏱️ Rolando sozinho · a seguir: rodada 19 vs Skyy
//     FC" + o pausar do lado, pequeno.
//
// ⚠️ NÃO É SPOILER: mostra o ADVERSÁRIO (a tabela de jogos, que já está na aba
// Jogos), nunca o placar. Nada revela resultado antes do apito.
// ⚠️ NÃO ATRASA O RITMO: não adiciona passo nem espera — é o mesmo clique de
// hoje, só que com nome de gente.
//
//   node scripts/mockup-proxima-rodada.mjs [--saida x.png]
import { readFileSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright-core'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'proxima-rodada.png')
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D', RED = '#C2452F', PURPLE = '#7C3AED'
const CREME = '#F4ECD6'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'

const fone = (inner, rot, cor, nota) => `
<div style="flex:0 0 372px">
  <div style="${OSW};font-size:15px;text-transform:uppercase;letter-spacing:.06em;color:${cor}">${rot}</div>
  <div style="font-family:system-ui;font-weight:600;font-size:11.5px;color:rgba(12,12,12,.5);margin:3px 0 9px;min-height:62px">${nota}</div>
  <div style="width:372px;border:5px solid ${INK};border-radius:26px;background:${CREME};box-shadow:6px 6px 0 ${INK};overflow:hidden">${inner}</div>
</div>`

const cab = `
  <div style="background:${INK};padding:11px 13px 14px;color:#fff;position:relative">
    <div style="${OSW};font-size:9.5px;letter-spacing:.1em;color:${GOLD}">TEMPORADA 11 · ⚽ LIGA LEGENDS</div>
    <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:8px;margin-top:2px">
      <div><div style="${OSW};font-size:19px;line-height:1">Rodada <b style="font-size:23px">18</b><span style="font-size:12px;opacity:.5"> / 38</span></div>
      <div style="font-family:system-ui;font-size:10px;font-weight:700;opacity:.65;margin-top:3px">Série D</div></div>
      <div style="display:flex;gap:6px">
        <span style="${OSW};font-size:11px;border:2px solid rgba(255,255,255,.25);border-radius:999px;padding:2px 8px">🏅 3º</span>
        <span style="${OSW};font-size:11px;background:${GOLD};color:${INK};border-radius:7px;padding:2px 8px">🪙 412</span>
      </div>
    </div>
    <div style="position:absolute;left:0;bottom:0;height:6px;width:100%;background:#2b2721"><div style="height:100%;width:47%;background:linear-gradient(90deg,${GOLD},#ffde5c)"></div></div>
  </div>`

// placar da partida que acabou (o mesmo nos quatro celulares)
const placar = `
  <div style="border:3px solid ${INK};border-radius:15px;background:#fff;box-shadow:3px 3px 0 ${INK};padding:12px;margin-bottom:10px;text-align:center">
    <div style="${OSW};font-size:8.5px;letter-spacing:.1em;color:rgba(0,0,0,.4)">SEU JOGO · ENCERRADO</div>
    <div style="display:flex;align-items:center;justify-content:center;gap:12px;margin-top:5px">
      <span style="${OSW};font-size:15px;color:${PURPLE}">Neymarzetti</span>
      <span style="${OSW};font-size:22px;background:${INK};color:#fff;border-radius:10px;padding:3px 12px">2 × 1</span>
      <span style="${OSW};font-size:15px">Sapekeiros FC</span>
    </div>
  </div>`

const barra = () => `
  <div style="background:rgba(250,247,238,.98);border-top:1.5px solid rgba(12,12,12,.13);display:flex;padding:7px 6px 9px">
    ${[['🗓️', 'Jogos'], ['📊', 'Tabelas'], ['👥', 'Elenco'], ['🏆', 'Rank'], ['🏟️', 'Clube']].map(([i, t]) => {
      const on = t === 'Jogos'
      return `<div style="flex:1;text-align:center;${OSW};font-size:9px;text-transform:uppercase;color:${on ? PURPLE : 'rgba(12,12,12,.45)'}">
        <div style="font-size:17px">${i}</div>${t}</div>`
    }).join('')}
  </div>`

// ── ① HOJE · MODO MANUAL (o que já está bom) ───────────────────────────────
const HOJE_MANUAL = `${cab}<div style="padding:11px">${placar}
  <div style="border:3px solid ${INK};border-radius:15px;background:#fff;box-shadow:3px 3px 0 ${INK};padding:10px;margin-bottom:10px">
    <div style="${OSW};font-size:9.5px;letter-spacing:1px;text-transform:uppercase;color:rgba(0,0,0,.45);margin:0 0 7px 2px">🎮 Controle da partida</div>
    <div style="display:flex;gap:5px;margin-bottom:8px">
      ${['🐢 4×', '🐢 2×', 'Normal', '⚡ 2×', '⚡ 4×'].map((v, i) => `
        <div style="flex:1;border:2px solid ${INK};border-radius:8px;padding:5px 1px;text-align:center;${OSW};font-size:9px;background:${i === 2 ? INK : '#fff'};color:${i === 2 ? '#fff' : INK}">${v}</div>`).join('')}
    </div>
    <div style="display:grid;grid-template-columns:1.12fr 1fr;grid-template-rows:auto auto;gap:7px">
      <div style="grid-row:1/3;display:flex;align-items:center;justify-content:center;border:2.5px solid ${INK};border-radius:11px;background:${GREEN};color:#fff;box-shadow:2px 2px 0 ${INK};${OSW};font-size:15px">▶️ Próxima rodada</div>
      <div style="grid-column:2;grid-row:1;border:1.5px solid ${INK};border-radius:10px;background:#2F6BAE;color:#fff;padding:8px;text-align:center;${OSW};font-size:12.5px">⏭️ Pular</div>
      <div style="grid-column:2;grid-row:2;border:1.5px solid ${INK};border-radius:10px;background:#fff;color:#5a5647;padding:8px;text-align:center;${OSW};font-size:11.5px">🔁 Modo auto</div>
    </div>
  </div>
</div>${barra()}`

// ── ② HOJE · MODO AUTOMÁTICO (o buraco de verdade) ─────────────────────────
const HOJE_AUTO = `${cab}<div style="padding:11px">${placar}
  <div style="border:2.5px solid ${INK};border-radius:12px;background:#fff;box-shadow:2px 2px 0 ${INK};padding:9px 10px;text-align:center;${OSW};font-size:12px;margin-bottom:10px">
    ⏸️ MANUAL: pausar entre as rodadas
  </div>
  <div style="text-align:center;font-family:system-ui;font-size:10.5px;font-weight:700;color:${RED};padding:10px 6px 4px;line-height:1.45">
    ☝️ é só isso. A rodada anda sozinha a cada 9s e nada na tela diz<br>o que está acontecendo, quanto falta, nem contra quem é o próximo jogo.
  </div>
</div>${barra()}`

// ── ③ PROPOSTA · MANUAL ────────────────────────────────────────────────────
const PROP_MANUAL = `${cab}<div style="padding:11px">${placar}
  <div style="border:3px solid ${INK};border-radius:15px;background:#fff;box-shadow:3px 3px 0 ${INK};padding:10px;margin-bottom:10px">
    <div style="display:flex;align-items:baseline;justify-content:space-between;margin:0 2px 7px">
      <span style="${OSW};font-size:9.5px;letter-spacing:1px;text-transform:uppercase;color:rgba(0,0,0,.45)">⚽ A próxima rodada</span>
      <span style="font-family:system-ui;font-size:9px;font-weight:800;color:rgba(0,0,0,.35)">20 jogos faltando</span>
    </div>
    <div style="display:flex;gap:5px;margin-bottom:8px">
      ${['🐢 4×', '🐢 2×', 'Normal', '⚡ 2×', '⚡ 4×'].map((v, i) => `
        <div style="flex:1;border:2px solid ${INK};border-radius:8px;padding:5px 1px;text-align:center;${OSW};font-size:9px;background:${i === 2 ? INK : '#fff'};color:${i === 2 ? '#fff' : INK}">${v}</div>`).join('')}
    </div>
    <div style="display:grid;grid-template-columns:1.12fr 1fr;grid-template-rows:auto auto;gap:7px">
      <div style="grid-row:1/3;display:flex;flex-direction:column;align-items:center;justify-content:center;border:2.5px solid ${INK};border-radius:11px;background:${GREEN};color:#fff;box-shadow:2px 2px 0 ${INK};padding:9px 6px">
        <div style="${OSW};font-size:15.5px;line-height:1">▶️ Rodada 19</div>
        <div style="${OSW};font-size:12px;color:#BFF2D3;margin-top:3px;line-height:1.15">vs Skyy FC</div>
        <div style="font-family:system-ui;font-size:9px;font-weight:800;color:rgba(255,255,255,.65);margin-top:1px">fora de casa</div>
      </div>
      <div style="grid-column:2;grid-row:1;border:1.5px solid ${INK};border-radius:10px;background:#2F6BAE;color:#fff;padding:8px;text-align:center;${OSW};font-size:12.5px">⏭️ Pular</div>
      <div style="grid-column:2;grid-row:2;border:1.5px solid ${INK};border-radius:10px;background:#fff;color:#5a5647;padding:8px;text-align:center;${OSW};font-size:11.5px">🔁 Modo auto</div>
    </div>
  </div>
</div>${barra()}`

// ── ④ PROPOSTA · AUTOMÁTICO ────────────────────────────────────────────────
const PROP_AUTO = `${cab}<div style="padding:11px">${placar}
  <div style="border:3px solid ${INK};border-radius:15px;background:#fff;box-shadow:3px 3px 0 ${INK};overflow:hidden;margin-bottom:10px">
    <div style="display:flex;align-items:center;gap:10px;padding:11px 12px">
      <span style="width:34px;height:34px;border-radius:999px;border:2.5px solid ${INK};background:#EAF3FF;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0">⏱️</span>
      <div style="flex:1;min-width:0">
        <div style="${OSW};font-size:8.5px;letter-spacing:.09em;color:rgba(0,0,0,.42)">RODANDO SOZINHO · A SEGUIR</div>
        <div style="${OSW};font-size:14px;line-height:1.1;margin-top:1px">Rodada 19 · vs Skyy FC</div>
        <div style="font-family:system-ui;font-size:9.5px;font-weight:700;color:rgba(0,0,0,.5);margin-top:1px">fora de casa · 20 jogos faltando</div>
      </div>
    </div>
    <div style="height:5px;background:#EDE6D4"><div style="height:100%;width:62%;background:${GREEN}"></div></div>
    <div style="padding:9px 12px 11px">
      <div style="border:2px solid ${INK};border-radius:10px;background:#fff;padding:7px;text-align:center;${OSW};font-size:11.5px;color:#5a5647">⏸️ Quero pausar entre as rodadas</div>
    </div>
  </div>
</div>${barra()}`

const bloco = (tit, bg, txt) => `
  <div style="border:4px solid ${INK};border-radius:18px;background:${bg};box-shadow:4px 4px 0 ${INK};padding:16px 18px;margin-bottom:14px">
    <div style="${OSW};font-size:16px;text-transform:uppercase;margin-bottom:9px">${tit}</div>
    <div style="font-family:system-ui;font-size:12.5px;font-weight:600;line-height:1.55">${txt}</div>
  </div>`

const html = `<!doctype html><meta charset="utf-8"><style>${FONTES}
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:${CREME};padding:34px 38px;font-family:system-ui}</style>
<body>
  <div style="${OSW};font-size:31px;text-transform:uppercase">⚽ Opção 3 — "e agora, o que eu faço?"</div>
  <div style="font-family:system-ui;font-weight:600;font-size:13.5px;color:rgba(12,12,12,.6);margin:5px 0 12px;max-width:1080px;line-height:1.5">
    <b style="color:${RED}">Antes de tudo, uma correção minha:</b> na lista eu disse que "o botão de tocar a temporada fica no meio
    de outros do mesmo tamanho". <b>Está errado</b> — você já arrumou isso em 13/08 ("botão manual deveria ter um fundo
    envolvendo"), e no MODO MANUAL o cartão está bom, com o verde grande e o Pular/Auto miúdos do lado.
  </div>
  <div style="font-family:system-ui;font-weight:600;font-size:13.5px;color:rgba(12,12,12,.6);margin:0 0 26px;max-width:1080px;line-height:1.5">
    O buraco de verdade é outro, e é maior: <b>no MODO AUTOMÁTICO — que é o padrão — não existe botão nenhum</b>.
    Sobra uma tirinha branca. E o botão verde do manual <b>nunca diz contra quem</b> é o próximo jogo.
  </div>

  <div style="display:flex;gap:24px;align-items:flex-start;flex-wrap:wrap;margin-bottom:30px">
    ${fone(HOJE_MANUAL, '① Hoje · manual', '#8a7d59', 'Está bom: cartão fechado, verde grande, Pular e Auto miúdos. O único reparo é o nome do botão — "Próxima rodada" não diz nada sobre o jogo que vem.')}
    ${fone(HOJE_AUTO, '② Hoje · automático', RED, 'Aqui é o problema. Some o cartão inteiro e sobra <b>uma tirinha branca</b>. A rodada roda sozinha a cada 9s e a tela não conta nada: nem que está rodando, nem quanto falta, nem quem é o próximo.')}
    ${fone(PROP_MANUAL, '③ Proposta · manual', GREEN, 'O botão <b>vira a resposta</b>: "▶️ Rodada 19 · vs Skyy FC · fora de casa". Mesmo clique, mesmo lugar, mesmo tamanho — só que agora ele conta o que vai acontecer.')}
    ${fone(PROP_AUTO, '④ Proposta · automático', GREEN, 'No lugar do vazio, uma <b>linha viva</b>: o que está rolando, o próximo adversário, quantos jogos faltam e uma barrinha da temporada. O pausar continua ali, menorzinho.')}
  </div>

  <div style="display:flex;gap:26px;align-items:flex-start;flex-wrap:wrap">
    <div style="flex:1;min-width:430px">
      ${bloco('📏 A ideia em uma frase', '#EAF3FF', `
        <b>A pessoa abre o jogo com uma pergunta na cabeça: "e agora?"</b><br><br>
        Hoje a tela responde com o nome de um painel ("Controle da partida") ou com nada.<br>
        Na proposta, a resposta está escrita no lugar mais óbvio da tela: <b>a próxima rodada, contra quem,
        dentro ou fora de casa</b>. É a mesma informação que já existe na aba Jogos — só que ela sobe pro
        lugar onde a pergunta é feita.`)}
      ${bloco('🚫 Não é spoiler, e não atrasa nada', '#FFF6D6', `
        <b>Spoiler:</b> mostra só <b>o adversário</b> (a tabela de jogos, que qualquer um já vê na aba Jogos).
        <b>Nunca o placar.</b> Nada revela resultado antes do apito.<br><br>
        <b>Ritmo:</b> não adiciona passo, nem espera, nem clique. É exatamente o mesmo botão de hoje com outro
        texto — e no automático é só informação, sem nada pra apertar.`)}
    </div>
    <div style="flex:1;min-width:430px">
      ${bloco('🛡️ O que NÃO muda / dá pra voltar', '#F1EDE0', `
        As <b>5 marchas de velocidade</b> continuam iguais. <b>Pular</b> e <b>Modo auto</b> continuam no mesmo
        canto, do mesmo tamanho. O placar ao vivo continua em cima. O motor da simulação <b>não é tocado</b>:
        é texto de botão e uma linha de status.<br><br>
        Commit isolado, revertível sozinho — e dá pra ligar <b>só na sua conta</b> primeiro, como fizemos com
        a barra de baixo.`)}
      ${bloco('🎯 O ganho que eu espero', '#E6F3EA', `
        No <b>manual</b>: ninguém mais aperta "próxima rodada" no automático mental, sem saber contra quem joga.<br><br>
        No <b>automático</b>: quem abre o jogo entende <b>na hora</b> que a temporada está rolando sozinha e que
        dá pra pegar o controle se quiser — hoje isso é adivinhação. E é aí que mora a maioria dos jogadores.`)}
    </div>
  </div>

  <p style="margin-top:16px;${OSW};font-size:15px">⚽ Leilão <span style="color:${RED}">Legends</span>
    <span style="float:right;font-weight:700;font-size:12px;opacity:.45">leilaolegends.com</span></p>
</body></html>`

const tmp = `/tmp/mockup-prox-${process.pid}.html`
writeFileSync(tmp, html)
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1700, height: 1000 }, deviceScaleFactor: 2 })
await p.goto('file://' + tmp)
await p.evaluate(() => document.fonts.ready)
await p.waitForTimeout(600)
await p.screenshot({ path: SAIDA, fullPage: true })
await b.close()
console.log(SAIDA)
