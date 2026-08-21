// ─── 🖼️ RETRATOS DE LENDA · ESTÁ NO PADRÃO? ────────────────────────────────
//
// Diego (21/08) mandou uma arte de jogadores retrô SEM ROSTO e perguntou:
// *"elas estão no padrão do nosso site ou tem algo q deveria ser mudado?"*
//
// ✅ O QUE JÁ ESTÁ CERTO: fundo creme, borda preta grossa, cantos arredondados,
// sombra dura, Oswald maiúscula, pílula dourada. E principalmente: **sem rosto**
// — isso não é só bonito, é a REGRA DELE ("não inventar como uma pessoa real
// é", 18/08). Sem olhos e sem boca, ninguém pode dizer "não tem nada a ver".
//
// ❌ O QUE PRECISA MUDAR (achado lendo o código, não no olho):
//  1. 🚨 **ESCUDO DE CLUBE REAL** — dois cards trazem o escudo do Real Madrid e
//     o do Inter. Isso quebra a regra escrita em `manto.ts` e `coracao.ts`:
//     *"nome/escudo de clube REAL nunca aparece: só as CORES"*. Fora que é marca
//     registrada. As cores/listras PODEM ficar; o escudo não.
//  2. 📋 **A ficha técnica está com o GABARITO** — "PESO: 10k (Inter, 12px, 45%
//     Tinta)", "CAIXA: Alta (Inter)", "ESPAÇO: Aberto (Inter)". Isso saiu do
//     NOSSO `scripts/padrao-visual.mjs` (linhas 132-134), onde PESO/CAIXA/ESPAÇO
//     são especificações de FONTE (peso 700–900, caixa MAIÚSCULA, espaçamento) e
//     "Inter" é o nome da 2ª fonte da casa — não o clube. Quem gerou a arte
//     copiou o layout da folha de estilo e deixou os rótulos. Pra jogador não
//     quer dizer nada.
//  3. ✂️ **Título cortando** — "VALDERRAMA 'O" some no canto.
//  4. ⚖️ **Peso**, se for entrar no JOGO: `padrao-visual.mjs` já fixa
//     *rosto de jogador = 256px no lado maior · ≤ 14 KB*. Se for só pra POST,
//     não conta (post não entra no bundle, igual às camisas de `scripts/kits/`).
//
//   node scripts/mockup-retratos-padrao.mjs [--saida x.png]
import { readFileSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright-core'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'retratos-padrao.png')
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D', RED = '#C2452F', PURPLE = '#7C3AED'
const CREME = '#F4ECD6'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'
const S = 3 // traço

// ── o retrato SEM ROSTO (mesma linguagem da arte que ele mandou) ───────────
const retrato = (o) => {
  const { pele = '#8A5533', cabelo = '#1A1310', tipoCab = 'curto', camisa = '#fff', camisa2 = '', gola = INK, escudo = null, bigode = false } = o
  const CAB = {
    curto: `<path d="M50 16 C68 16 76 30 74 46 C72 34 64 30 50 30 C36 30 28 34 26 46 C24 30 32 16 50 16 Z" fill="${cabelo}"/>`,
    black: `<ellipse cx="50" cy="30" rx="27" ry="22" fill="${cabelo}"/><ellipse cx="50" cy="34" rx="22" ry="18" fill="${pele}"/>`,
    calvo: `<path d="M50 18 C64 18 72 26 73 36 C68 30 60 28 50 28 C40 28 32 30 27 36 C28 26 36 18 50 18 Z" fill="${cabelo}" opacity=".9"/>`,
    liso: `<path d="M50 15 C69 15 77 30 74 48 C73 36 68 28 50 28 C32 28 27 36 26 48 C23 30 31 15 50 15 Z" fill="${cabelo}"/>`,
  }[tipoCab] ?? ''
  const listras = camisa2
    ? `<pattern id="p${camisa2.replace('#', '')}" width="14" height="10" patternUnits="userSpaceOnUse"><rect width="14" height="10" fill="${camisa}"/><rect width="7" height="10" fill="${camisa2}"/></pattern>`
    : ''
  const fill = camisa2 ? `url(#p${camisa2.replace('#', '')})` : camisa
  return `<svg viewBox="0 0 100 130" style="width:100%;display:block">
    <defs>${listras}</defs>
    <path d="M8 130 C8 100 26 88 50 88 C74 88 92 100 92 130 Z" fill="${fill}" stroke="${INK}" stroke-width="${S}" stroke-linejoin="round"/>
    <path d="M38 89 L50 104 L62 89 C58 87 42 87 38 89 Z" fill="#F7F3E8" stroke="${INK}" stroke-width="${S * .8}" stroke-linejoin="round"/>
    <path d="M38 89 L50 104 L62 89" fill="none" stroke="${gola}" stroke-width="${S * .9}"/>
    ${escudo ? `<g transform="translate(64,104) scale(.9)"><path d="M0 0 L14 5 V16 C14 24 7 29 0 31 C-7 29 -14 24 -14 16 V5 Z" fill="${escudo.bg}" stroke="${INK}" stroke-width="2.4"/><text x="0" y="21" text-anchor="middle" ${OSW.replace('font-family:', 'font-family:')} font-size="15" fill="${escudo.c}">${escudo.l}</text></g>` : ''}
    <path d="M42 74 h16 v16 h-16 Z" fill="${pele}"/>
    <path d="M50 16 C70 16 78 32 78 52 C78 74 66 86 50 86 C34 86 22 74 22 52 C22 32 30 16 50 16 Z" fill="${pele}" stroke="${INK}" stroke-width="${S}" stroke-linejoin="round"/>
    <ellipse cx="21" cy="54" rx="5.5" ry="7" fill="${pele}" stroke="${INK}" stroke-width="${S * .8}"/>
    <ellipse cx="79" cy="54" rx="5.5" ry="7" fill="${pele}" stroke="${INK}" stroke-width="${S * .8}"/>
    ${CAB}
    ${bigode ? `<path d="M38 66 q12-5 24 0 q-12 6-24 0 Z" fill="${cabelo}"/>` : ''}
  </svg>`
}

const cardBase = (inner) => `
  <div style="flex:0 0 340px;border:4px solid ${INK};border-radius:20px;background:${CREME};box-shadow:5px 5px 0 ${INK};overflow:hidden">${inner}</div>`

// ── ❌ o jeito que veio (com os dois furos) ────────────────────────────────
const cardErrado = (nome, o) => cardBase(`
  <div style="padding:12px 13px 0">
    <div style="display:inline-flex;align-items:center;gap:7px;background:${GOLD};border:${S}px solid ${INK};border-radius:999px;padding:3px 11px;${OSW};font-size:9.5px;letter-spacing:.07em">⚽ PADRÃO VISUAL DA CASA</div>
    <div style="${OSW};font-size:27px;line-height:1;margin-top:9px;white-space:nowrap;overflow:hidden">${nome}</div>
  </div>
  <div style="padding:4px 20px 0">${retrato(o)}</div>
  <div style="background:${INK};color:#fff;${OSW};font-size:10px;letter-spacing:.09em;padding:5px 13px">NASCIMENTO DE LENDA</div>
  <div style="background:#fff;padding:10px 13px 12px">
    <div style="${OSW};font-size:19px;line-height:1.05;margin-bottom:7px">${nome}</div>
    ${[['PESO', '10k (Inter, 12px, 45% Tinta)'], ['CAIXA', 'Alta (Inter)'], ['ESPAÇO', 'Aberto (Inter)']].map(l => `
      <div style="display:flex;gap:10px;border-top:1.5px solid rgba(12,12,12,.12);padding:5px 0">
        <span style="${OSW};font-size:11px;letter-spacing:.07em;min-width:64px;color:rgba(0,0,0,.55)">${l[0]}</span>
        <span style="font-family:system-ui;font-size:11px;font-weight:600;color:${RED}">${l[1]}</span></div>`).join('')}
  </div>`)

// ── ✅ o mesmo card arrumado ───────────────────────────────────────────────
const cardCerto = (nome, apelido, o, ficha, tier) => cardBase(`
  <div style="padding:12px 13px 0">
    <div style="display:inline-flex;align-items:center;gap:7px;background:${tier.bg};border:${S}px solid ${INK};border-radius:999px;padding:3px 11px;${OSW};font-size:9.5px;letter-spacing:.07em;color:${tier.c}">${tier.s} ${tier.n}</div>
    <div style="${OSW};font-size:26px;line-height:1;margin-top:9px">${nome}</div>
    <div style="${OSW};font-size:15px;line-height:1;color:${PURPLE};margin-top:1px">‘${apelido}’</div>
  </div>
  <div style="padding:4px 20px 0">${retrato(o)}</div>
  <div style="background:${INK};color:#fff;${OSW};font-size:10px;letter-spacing:.09em;padding:5px 13px">NASCIMENTO DE LENDA</div>
  <div style="background:#fff;padding:10px 13px 12px">
    ${ficha.map(l => `
      <div style="display:flex;gap:10px;border-top:1.5px solid rgba(12,12,12,.12);padding:5px 0">
        <span style="${OSW};font-size:11px;letter-spacing:.07em;min-width:64px;color:rgba(0,0,0,.55)">${l[0]}</span>
        <span style="font-family:system-ui;font-size:11.5px;font-weight:700">${l[1]}</span></div>`).join('')}
  </div>`)

const OURO = { n: 'LENDA', s: '👑', bg: GOLD, c: INK }
const bloco = (tit, bg, txt) => `
  <div style="border:4px solid ${INK};border-radius:18px;background:${bg};box-shadow:4px 4px 0 ${INK};padding:16px 18px;margin-bottom:14px">
    <div style="${OSW};font-size:16px;text-transform:uppercase;margin-bottom:9px">${tit}</div>
    <div style="font-family:system-ui;font-size:12.5px;font-weight:600;line-height:1.55">${txt}</div>
  </div>`

const html = `<!doctype html><meta charset="utf-8"><style>${FONTES}
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:${CREME};padding:34px 34px 28px;font-family:system-ui}</style>
<body>
  <div style="display:inline-block;background:${GOLD};border:3px solid ${INK};border-radius:999px;box-shadow:3px 3px 0 ${INK};
    padding:5px 15px;${OSW};font-size:12.5px;letter-spacing:.08em">🖼️ RETRATOS DE LENDA · ESTÁ NO PADRÃO?</div>
  <h1 style="${OSW};text-transform:uppercase;font-size:42px;margin:14px 0 6px;line-height:1">
    O TRAÇO ESTÁ CERTO. <span style="color:${RED}">DUAS COISAS NÃO.</span></h1>
  <p style="font-size:14px;font-weight:600;max-width:1080px;line-height:1.5;margin:0 0 22px">
    Fundo creme, borda grossa, sombra dura, Oswald maiúscula, pílula dourada — tudo da casa. E o <b>sem rosto</b> não é
    só bonito: <b>é a sua regra</b> ("não inventar como uma pessoa real é"). Sem olhos e sem boca, <b>ninguém pode
    dizer que não tem nada a ver</b>. Isso eu manteria pra sempre.
  </p>

  <div style="display:flex;gap:22px;flex-wrap:wrap;align-items:flex-start;margin-bottom:26px">
    <div>
      <div style="${OSW};font-size:15px;text-transform:uppercase;color:${RED};margin-bottom:8px">❌ Como veio</div>
      <div style="display:flex;gap:18px">
        ${cardErrado('ZIDANE ‘O MAGO’', { pele: '#E8B98C', cabelo: '#3A2A22', tipoCab: 'calvo', camisa: '#fff', gola: PURPLE, escudo: { bg: '#fff', c: '#C9A227', l: 'R' } })}
        ${cardErrado('RONALDO ‘O FENÔ…', { pele: '#C68B5E', cabelo: '#3A2A22', tipoCab: 'calvo', camisa: '#0C0C0C', camisa2: '#0B2C6B', gola: '#fff', escudo: { bg: '#0B2C6B', c: '#fff', l: 'I' } })}
      </div>
    </div>
    <div>
      <div style="${OSW};font-size:15px;text-transform:uppercase;color:${GREEN};margin-bottom:8px">✅ Arrumado</div>
      <div style="display:flex;gap:18px">
        ${cardCerto('ZIDANE', 'O MAGO', { pele: '#E8B98C', cabelo: '#3A2A22', tipoCab: 'calvo', camisa: '#fff', gola: PURPLE },
          [['POSIÇÃO', 'MEI · meia'], ['AUGE', 'Espanha · 2002'], ['NÍVEL', '⭐⭐⭐⭐⭐']], OURO)}
        ${cardCerto('RONALDO', 'O FENÔMENO', { pele: '#C68B5E', cabelo: '#3A2A22', tipoCab: 'calvo', camisa: '#0C0C0C', camisa2: '#0B2C6B', gola: '#fff' },
          [['POSIÇÃO', 'ATA · atacante'], ['AUGE', 'Itália · 1998'], ['NÍVEL', '⭐⭐⭐⭐⭐']], OURO)}
      </div>
    </div>
  </div>

  <div style="display:flex;gap:22px;flex-wrap:wrap">
    <div style="flex:1;min-width:440px">
      ${bloco('🚨 1. O escudo do clube real tem que sair', '#FBE7E3', `
        O Zidane está com o <b>escudo do Real Madrid</b> e o Ronaldo com o <b>do Inter</b>. Isso quebra uma regra que
        já está <b>escrita no código</b>, em <code>manto.ts</code> e <code>coracao.ts</code>:<br><br>
        <i>"nome/escudo de clube REAL nunca aparece: só as CORES"</i><br><br>
        Fora que é <b>marca registrada</b>. <b>As cores e as listras podem ficar</b> — branco com detalhe roxo, preto e
        azul listrado — porque cor não é marca. É só o escudo que sai. (Repara que no Pelé e no Valderrama o
        escudo é uma <b>águia genérica</b>: aquele já era o caminho certo.)`)}
      ${bloco('📋 2. A ficha técnica está com o gabarito da nossa folha de estilo', '#FFF6D6', `
        "PESO: 10k (Inter, 12px, 45% Tinta)" · "CAIXA: Alta (Inter)" · "ESPAÇO: Aberto (Inter)".<br><br>
        Isso saiu do <b>nosso próprio</b> <code>scripts/padrao-visual.mjs</code> (linhas 132–134), onde
        <b>PESO / CAIXA / ESPAÇO são especificações de FONTE</b> — peso 700 a 900, caixa MAIÚSCULA, espaçamento das
        letras. E <b>"Inter" ali é o nome da 2ª fonte da casa</b>, não o clube italiano.<br><br>
        Ou seja: quem gerou a arte <b>copiou o layout da folha de estilo</b> e deixou os rótulos dela. Pra quem joga,
        isso não quer dizer nada. No lugar entra <b>posição · auge · nível</b>, que é o que a carta do jogo mostra.`)}
    </div>
    <div style="flex:1;min-width:440px">
      ${bloco('✂️ 3. Detalhes menores', '#F1EDE0', `
        · O título do Valderrama <b>corta no canto</b> ("VALDERRAMA ‘O"). Nome grande precisa quebrar em duas linhas —
        no arrumado eu pus o <b>apelido embaixo</b>, em roxo, e resolveu.<br><br>
        · A pílula dourada dizia "PADRÃO VISUAL DA CASA" nos quatro cards. Isso é o rótulo da <b>folha de estilo</b>,
        não do jogador. No arrumado ela virou o <b>tier</b> (👑 LENDA), que é o que o jogo usa de verdade.`)}
      ${bloco('⚖️ 4. Peso — só se for entrar no JOGO', '#EAF3FF', `
        A folha de estilo já fixa: <b>rosto de jogador = 256px no lado maior · ≤ 14 KB</b> (na tela ele aparece a
        96px no campinho e 100px na carta).<br><br>
        <b>Se for só pra POST, isso não conta</b> — post não entra no bundle, igual às camisas que ficam em
        <code>scripts/kits/</code>. Me diz pra qual dos dois é, que a exigência muda.`)}
    </div>
  </div>

  <p style="margin-top:16px;${OSW};font-size:15px">⚽ Leilão <span style="color:${RED}">Legends</span>
    <span style="float:right;font-weight:700;font-size:12px;opacity:.45">leilaolegends.com</span></p>
</body></html>`

const tmp = `/tmp/mockup-retr-${process.pid}.html`
writeFileSync(tmp, html)
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1620, height: 1000 }, deviceScaleFactor: 2 })
await p.goto('file://' + tmp)
await p.evaluate(() => document.fonts.ready)
await p.waitForTimeout(600)
await p.screenshot({ path: SAIDA, fullPage: true })
await b.close()
console.log(SAIDA)
