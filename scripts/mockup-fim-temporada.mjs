// ─── 🏆 MOCKUP: O FIM DA TEMPORADA (opção 5) ────────────────────────────────
//
// 🔎 O QUE EU ACHEI NO CÓDIGO — e é o achado mais forte de todos:
//
// Quando a temporada acaba (`done`), o que a tela dá pra cada desfecho:
//   · CAMPEÃO  → uma faixa dourada de UMA LINHA: "🏆 CAMPEÃO DA SÉRIE D!"
//     (pyramidseason.tsx:5213) + a carta colecionável (CardCollectPrompt).
//   · SUBIU DE DIVISÃO (acesso) → **NADA**.
//   · CAIU DE DIVISÃO → **NADA**.
//
// A pessoa descobre que subiu ou caiu **olhando uma setinha ▲/▼ na tabela**
// (o desenho está lá em pyramidseason.tsx:1636). O jogo INTEIRO é uma pirâmide
// de 5 divisões — subir é a razão de existir do Modo Carreira — e o momento em
// que isso acontece **não tem momento nenhum**.
//
// E o que TEM na tela nessa hora chega tudo junto e com o mesmo peso: o jornal
// inteiro (SeasonJornal), a carta ganha, o fechamento do caixa e a decisão da
// próxima temporada. Emoção espremida dentro de um relatório.
//
// 💡 A PROPOSTA — e o cuidado com a regra de ouro do Diego ("nada pode atrasar
// o ritmo"): NÃO é uma sequência de 5 telinhas. É **UMA tela de desfecho**, com
// UM toque, que aparece quando a temporada fecha:
//   · o que aconteceu com o clube, grande (SUBIU / CAIU / CAMPEÃO / FICOU);
//   · de onde saiu → pra onde vai, na cara da pessoa;
//   · o que ela levou (caixa, prêmio do acesso, carta) em linha, ali dentro;
//   · "▶️ Continuar" leva pro que já existe (jornal + decisão), já arrumado.
// Um toque a mais, não cinco. E ganha o momento que hoje não existe.
//
//   node scripts/mockup-fim-temporada.mjs [--saida x.png]
import { readFileSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright-core'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'fim-temporada.png')
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D', RED = '#C2452F', PURPLE = '#7C3AED'
const CREME = '#F4ECD6'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'

const fone = (inner, rot, cor, nota) => `
<div style="flex:0 0 372px">
  <div style="${OSW};font-size:15px;text-transform:uppercase;letter-spacing:.06em;color:${cor}">${rot}</div>
  <div style="font-family:system-ui;font-weight:600;font-size:11.5px;color:rgba(12,12,12,.5);margin:3px 0 9px;min-height:66px">${nota}</div>
  <div style="width:372px;border:5px solid ${INK};border-radius:26px;background:${CREME};box-shadow:6px 6px 0 ${INK};overflow:hidden">${inner}</div>
</div>`

const quadro = (bg, inner, mb = 10) =>
  `<div style="border:3px solid ${INK};border-radius:15px;background:${bg};box-shadow:3px 3px 0 ${INK};margin:0 0 ${mb}px;overflow:hidden">${inner}</div>`

const cab = `
  <div style="background:${INK};padding:11px 13px 13px;color:#fff">
    <div style="${OSW};font-size:9.5px;letter-spacing:.1em;color:${GOLD}">TEMPORADA 11 · ⚽ LIGA LEGENDS</div>
    <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:8px;margin-top:2px">
      <div><div style="${OSW};font-size:19px;line-height:1">Encerrada</div>
      <div style="font-family:system-ui;font-size:10px;font-weight:700;opacity:.65;margin-top:3px">Série D</div></div>
      <span style="${OSW};font-size:11px;background:${GOLD};color:${INK};border-radius:7px;padding:2px 8px">🪙 626</span>
    </div>
  </div>`

const jornal = `
  ${quadro('#fff', `<div style="padding:11px 12px">
    <div style="${OSW};font-size:9px;letter-spacing:.08em;color:rgba(0,0,0,.45)">📰 O MARTELO · EDIÇÃO DA TEMPORADA 11</div>
    <div style="${OSW};font-size:15px;margin-top:2px;line-height:1.1">Neymarzetti é vice e sobe pra Série C</div>
    <div style="font-family:system-ui;font-size:9.5px;font-weight:600;color:rgba(0,0,0,.55);margin-top:4px;line-height:1.45">
      Skyy FC leva o título · Gabigol artilheiro com 21 gols · Sapekeiros FC e mais três caem pra Várzea.</div>
    <div style="margin-top:8px;display:flex;gap:6px">
      <div style="flex:1;border:2.5px solid ${INK};border-radius:9px;background:#FFF6DE;padding:6px;text-align:center;${OSW};font-size:10.5px">📰 Página 2</div>
      <div style="flex:1;border:2.5px solid ${INK};border-radius:9px;background:#FFF6DE;padding:6px;text-align:center;${OSW};font-size:10.5px">🏆 Chaveamento</div>
    </div>
  </div>`)}`

const proxima = `
  ${quadro('#EAF3FF', `<div style="padding:12px">
    <div style="border:2.5px solid ${INK};border-radius:11px;background:#fff;padding:8px 10px;margin-bottom:9px;display:flex;align-items:center;gap:8px">
      <span style="font-size:15px">💰</span>
      <div style="flex:1"><div style="${OSW};font-size:11px;line-height:1.15">Fechamento da temporada 11</div>
      <div style="font-family:system-ui;font-size:9px;font-weight:700;color:rgba(0,0,0,.48)">6 lançamentos · já caiu no caixa</div></div>
      <span style="${OSW};font-size:11px;color:${GREEN}">+214 🪙</span><span style="${OSW};font-size:14px;color:rgba(0,0,0,.3)">›</span>
    </div>
    <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">
      <span style="${OSW};font-size:9px;letter-spacing:.08em;background:${RED};color:#fff;border-radius:999px;padding:2px 9px">👉 SUA VEZ</span>
      <span style="font-family:system-ui;font-size:9.5px;font-weight:700;color:rgba(0,0,0,.45)">decida como monta o time da próxima</span>
    </div>
    <div style="${OSW};font-size:13px;margin-bottom:3px">📅 Próxima temporada</div>
    <div style="font-family:system-ui;font-size:10px;font-weight:600;color:rgba(0,0,0,.55);margin-bottom:9px;line-height:1.4">1 carta nova por posição + os listados, ou seguir com o mesmo time.</div>
    <div style="display:flex;gap:7px">
      <div style="flex:1;border:3px solid ${INK};border-radius:11px;background:${GOLD};padding:9px 4px;text-align:center;${OSW};font-size:12.5px;box-shadow:2px 2px 0 ${INK}">🔨 Abrir o leilão</div>
      <div style="flex:1;border:3px solid ${INK};border-radius:11px;background:${GREEN};color:#fff;padding:9px 4px;text-align:center;${OSW};font-size:12.5px;box-shadow:2px 2px 0 ${INK}">▶️ Mesmo time</div>
    </div>
  </div>`, 0)}`

// ── ① HOJE · CAMPEÃO ───────────────────────────────────────────────────────
const HOJE_CAMPEAO = `${cab}<div style="padding:11px">
  ${quadro(GOLD, `<div style="padding:11px;text-align:center;${OSW};font-size:16px">🏆 CAMPEÃO DA SÉRIE D!</div>`)}
  ${quadro('#F3EBFF', `<div style="padding:11px 12px;text-align:center">
    <div style="${OSW};font-size:13px">🎴 Sua carta de campeão</div>
    <div style="font-family:system-ui;font-size:9.5px;font-weight:600;color:rgba(0,0,0,.55);margin-top:3px">Toque pra abrir e guardar no álbum.</div>
    <div style="margin-top:7px;border:2.5px solid ${INK};border-radius:9px;background:${PURPLE};color:#fff;padding:7px;${OSW};font-size:11.5px">🎁 Abrir a carta</div>
  </div>`)}
  ${jornal}
  ${proxima}
</div>`

// ── ② HOJE · SUBIU DE DIVISÃO (o buraco) ───────────────────────────────────
const HOJE_ACESSO = `${cab}<div style="padding:11px">
  ${jornal}
  ${proxima}
  <div style="text-align:center;font-family:system-ui;font-size:10.5px;font-weight:800;color:${RED};padding:11px 6px 2px;line-height:1.45">
    ☝️ é isso. Você <b>subiu de divisão</b> e o jogo não falou nada.<br>
    Pra descobrir, tem que ir na aba Tabelas e ver a setinha ▲ do seu nome.
  </div>
</div>`

// ── ③ PROPOSTA · A TELA DE DESFECHO ────────────────────────────────────────
const linhaPremio = (ic, txt, val, cor) => `
  <div style="display:flex;align-items:center;gap:9px;padding:8px 12px;border-top:1.5px solid rgba(255,255,255,.14)">
    <span style="font-size:15px">${ic}</span>
    <span style="flex:1;${OSW};font-size:11.5px;color:#fff">${txt}</span>
    <span style="${OSW};font-size:12px;color:${cor};white-space:nowrap">${val}</span>
  </div>`

const DESFECHO = `
  <div style="background:linear-gradient(160deg,#1F8C4A,#0d3f21);padding:20px 14px 0;color:#fff;text-align:center;position:relative;overflow:hidden">
    <div style="position:absolute;inset:0;background:repeating-linear-gradient(110deg,rgba(255,255,255,.05) 0 8px,transparent 8px 30px)"></div>
    <div style="position:relative">
      <div style="${OSW};font-size:9.5px;letter-spacing:.12em;color:rgba(255,255,255,.6)">TEMPORADA 11 ENCERRADA</div>
      <div style="${OSW};font-size:44px;line-height:1;margin-top:5px;color:${GOLD};text-shadow:3px 3px 0 rgba(0,0,0,.35)">ACESSO!</div>
      <div style="font-family:system-ui;font-size:12px;font-weight:700;color:rgba(255,255,255,.85);margin-top:5px">Neymarzetti terminou em <b>2º lugar</b></div>
      <div style="display:flex;align-items:center;justify-content:center;gap:11px;margin:14px 0 4px">
        <span style="border:3px solid rgba(255,255,255,.35);border-radius:12px;padding:6px 13px;${OSW};font-size:14px;color:rgba(255,255,255,.6)">Série D</span>
        <span style="font-size:24px;line-height:1">⬆️</span>
        <span style="border:3px solid ${INK};border-radius:12px;padding:6px 13px;${OSW};font-size:17px;background:${GOLD};color:${INK};box-shadow:3px 3px 0 rgba(0,0,0,.35)">Série C</span>
      </div>
      <div style="font-family:system-ui;font-size:10.5px;font-weight:700;color:rgba(255,255,255,.6);padding-bottom:14px">Décima primeira temporada · 4ª divisão do seu clube</div>
    </div>
  </div>
  <div style="background:#123d24;padding:2px 0 8px">
    <div style="${OSW};font-size:9px;letter-spacing:.1em;color:rgba(255,255,255,.45);padding:8px 12px 2px">O QUE VOCÊ LEVOU</div>
    ${linhaPremio('🏅', 'Prêmio do acesso', '+15 🪙', GOLD)}
    ${linhaPremio('💰', 'Fechamento do caixa', '+214 🪙', '#7BE59B')}
    ${linhaPremio('🛡️', 'Patrocínio (Max Joias)', '+8 🪙', '#7BE59B')}
    ${linhaPremio('🎪', 'Torcida', '69% → 78%', '#7BE59B')}
  </div>
  <div style="padding:11px 12px 13px;background:${CREME};border-top:3px solid ${INK}">
    <div style="border:3px solid ${INK};border-radius:13px;background:${GREEN};color:#fff;padding:12px;text-align:center;${OSW};font-size:15px;box-shadow:3px 3px 0 ${INK}">▶️ Continuar</div>
    <div style="text-align:center;font-family:system-ui;font-size:9px;font-weight:700;color:rgba(0,0,0,.4);margin-top:7px">Um toque e você cai no jornal e na decisão da próxima temporada.</div>
  </div>`

// ── ④ PROPOSTA · DEPOIS DO TOQUE ───────────────────────────────────────────
const DEPOIS = `${cab}<div style="padding:11px">
  ${quadro('#E6F3EA', `<div style="padding:8px 11px;display:flex;align-items:center;gap:9px">
    <span style="font-size:17px">⬆️</span>
    <div style="flex:1"><div style="${OSW};font-size:11.5px;line-height:1.15">Você subiu: Série D → Série C</div>
    <div style="font-family:system-ui;font-size:9.5px;font-weight:700;color:rgba(0,0,0,.5)">2º lugar · +15 🪙 de prêmio</div></div>
    <span style="${OSW};font-size:14px;color:rgba(0,0,0,.3)">›</span>
  </div>`)}
  ${jornal}
  ${proxima}
</div>`

const bloco = (tit, bg, txt) => `
  <div style="border:4px solid ${INK};border-radius:18px;background:${bg};box-shadow:4px 4px 0 ${INK};padding:16px 18px;margin-bottom:14px">
    <div style="${OSW};font-size:16px;text-transform:uppercase;margin-bottom:9px">${tit}</div>
    <div style="font-family:system-ui;font-size:12.5px;font-weight:600;line-height:1.55">${txt}</div>
  </div>`

const html = `<!doctype html><meta charset="utf-8"><style>${FONTES}
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:${CREME};padding:34px 38px;font-family:system-ui}</style>
<body>
  <div style="${OSW};font-size:31px;text-transform:uppercase">🏆 Opção 5 — o fim da temporada</div>
  <div style="font-family:system-ui;font-weight:600;font-size:13.5px;color:rgba(12,12,12,.6);margin:5px 0 10px;max-width:1120px;line-height:1.5">
    <b style="color:${RED}">O achado mais forte de todos.</b> Conferi o que a tela dá pra cada desfecho quando a temporada acaba:
    <b>campeão</b> ganha uma faixa dourada de uma linha + a carta. <b>Subir de divisão: nada. Cair de divisão: nada.</b>
  </div>
  <div style="font-family:system-ui;font-weight:600;font-size:13.5px;color:rgba(12,12,12,.6);margin:0 0 26px;max-width:1120px;line-height:1.5">
    A pessoa descobre que subiu <b>olhando uma setinha ▲ na tabela</b>. O jogo inteiro é uma pirâmide de 5 divisões — subir é
    a razão de existir do Modo Carreira — e o momento em que isso acontece <b>não tem momento nenhum</b>.
  </div>

  <div style="display:flex;gap:24px;align-items:flex-start;flex-wrap:wrap;margin-bottom:30px">
    ${fone(HOJE_CAMPEAO, '① Hoje · campeão', '#8a7d59', 'O campeão até tem alguma coisa: a faixa dourada de uma linha e a carta colecionável. Mas o jornal, o caixa e a decisão da próxima chegam tudo junto e com o mesmo peso.')}
    ${fone(HOJE_ACESSO, '② Hoje · subiu de divisão', RED, 'Aqui é o buraco: <b>não existe absolutamente nada</b>. O jornal comenta de passagem, e só. Pra ter certeza de que subiu, a pessoa precisa ir na aba Tabelas caçar a setinha do próprio nome.')}
    ${fone(DESFECHO, '③ Proposta · a tela de desfecho', GREEN, 'Uma tela, um toque. O que aconteceu com o clube em letra grande, de onde saiu → pra onde vai, e <b>o que você levou</b> logo abaixo. Vale igual pra ACESSO, QUEDA, CAMPEÃO e "ficou na divisão".')}
    ${fone(DEPOIS, '④ Proposta · depois do toque', GREEN, 'O "Continuar" leva pro que já existe — jornal e decisão — agora com uma linha no topo lembrando o que aconteceu, caso a pessoa queira rever.')}
  </div>

  <div style="display:flex;gap:26px;align-items:flex-start;flex-wrap:wrap">
    <div style="flex:1;min-width:430px">
      ${bloco('⏱️ Por que NÃO fiz uma sequência de 5 telinhas', '#FFF6D6', `
        Foi a primeira ideia — "abrir figurinha", uma tela de cada vez. <b>Eu descartei</b>, e o motivo é sua regra de ouro:
        <b>nada pode atrasar o ritmo</b>.<br><br>
        Uma sequência de 5 vira <b>5 toques pra ver o que hoje aparece de uma vez</b> — e na décima temporada isso é
        burocracia, não emoção. Então é <b>UMA tela só</b>, com <b>UM toque</b>. O ganho de emoção vem do
        <b>tamanho</b> e da <b>cor</b>, não da quantidade de telas.`)}
      ${bloco('🎯 O que essa tela resolve', '#E6F3EA', `
        · <b>Acesso e queda ganham momento</b> — hoje eles simplesmente não existem na tela.<br>
        · O <b>caixa, o prêmio, o patrocínio e a torcida</b> aparecem juntos, como "o que você levou", em vez de
        espalhados em três lugares.<br>
        · O <b>campeão</b> continua com a carta colecionável do mesmo jeito — ela abre depois, no Continuar.<br>
        · E a <b>torcida</b> ganha o antes→depois (69% → 78%), que hoje ninguém percebe.`)}
    </div>
    <div style="flex:1;min-width:430px">
      ${bloco('🛡️ O que NÃO muda / dá pra voltar', '#F1EDE0', `
        <b>Nenhuma regra, nenhum número, nenhum prêmio muda.</b> Acesso, queda, premiação, torcida e carta seguem
        exatamente como são — a tela só <b>conta</b> o que já aconteceu.<br><br>
        O jornal (O Martelo) continua inteiro, a decisão da próxima temporada continua igual, o motor não é tocado.<br><br>
        Commit isolado, revertível — e ligo <b>só na sua conta</b> primeiro, como nos outros.`)}
      ${bloco('⚠️ O que eu quero que você decida', '#EAF3FF', `
        <b>1. A tela de QUEDA.</b> Ela precisa existir (a pessoa tem que saber que caiu), mas eu <b>não faria festa
        de tristeza</b>. Meu instinto: vermelho, curto, e uma frase de virada ("ano que vem a gente volta") — sem
        zoar quem caiu. Você conhece a galera melhor que eu: <b>quer humor aí ou respeito seco?</b><br><br>
        <b>2. "Ficou na divisão"</b> (nem subiu nem caiu) — mostro a tela também, mais discreta, ou pulo direto?`)}
    </div>
  </div>

  <p style="margin-top:16px;${OSW};font-size:15px">⚽ Leilão <span style="color:${RED}">Legends</span>
    <span style="float:right;font-weight:700;font-size:12px;opacity:.45">leilaolegends.com</span></p>
</body></html>`

const tmp = `/tmp/mockup-fim-${process.pid}.html`
writeFileSync(tmp, html)
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1700, height: 1000 }, deviceScaleFactor: 2 })
await p.goto('file://' + tmp)
await p.evaluate(() => document.fonts.ready)
await p.waitForTimeout(600)
await p.screenshot({ path: SAIDA, fullPage: true })
await b.close()
console.log(SAIDA)
