// ─── 🛡️🎽🦅 QUEM NÃO TEM BATISMO, COMO FICA? (Diego 24/08) ──────────────────
//
// Regra dele, palavra por palavra: *"O escudo vem automático qd o cara N tem.
// Manto coloque da cor do tier de foi profissional. Algo básico. E mascote
// deixa em branco."*
//
// Traduzindo pro código que JÁ EXISTE (nada aqui é invenção nova):
//   🛡️ ESCUDO — já vem automático hoje. `Escudo()` em `escudos.tsx` procura a
//      arte comprada (`logoPronta`); não achando, DESENHA um escudo pelo nome
//      (forma + 2 cores + padrão + letra, tudo derivado do hash do nome). Ou
//      seja: ninguém nunca fica sem escudo. Zero trabalho novo.
//   🎽 MANTO — sai da COR DO TIER do dono (`APOIO_PERKS[tier].svgFull`, os 2
//      tons que o resto do jogo já usa). Listra simples em CSS/SVG, 0 KB.
//      Respeita a regra de ouro: cada um leva a cor do PRÓPRIO tier — grátis é
//      bege, nunca dourado emprestado.
//   🦅 MASCOTE — fica VAZIA. Sem desenho genérico: inventar um bicho pra quem
//      não escolheu seria fazer o jogo falar por ele.
//
//   node scripts/mockup-presidencia-sem-batismo.mjs [--saida x.png]
import { readFileSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright-core'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'presidencia-sem-batismo.png')
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D', RED = '#C2452F', PURPLE = '#7C3AED'
const CREME = '#F4ECD6'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'
const box = (bg = '#fff') => `border:3px solid ${INK};border-radius:16px;background:${bg};box-shadow:4px 4px 0 0 ${INK}`

// as cores REAIS do jogo (copiadas de APOIO_PERKS em apoio.tsx — svgFull)
const TIER = {
  bege:  { nome: 'Grátis', selo: '', full: ['#DBD1B5', '#B2A583'] },
  verde: { nome: 'Verde', selo: '', full: ['#41C07A', '#1E7A45'] },
  roxo:  { nome: 'Roxo', selo: '💎', full: ['#C9A9FF', '#7C3AED'] },
  prata: { nome: 'Prata', selo: '⭐', full: ['#F4F7FB', '#9BA7B5'] },
  ouro:  { nome: 'Ouro', selo: '👑', full: ['#ffd85a', '#e09e00'] },
}

// 🛡️ escudo AUTOMÁTICO (o que `Escudo()` já desenha hoje pelo nome)
const escudoAuto = (s, c1, c2, letra) => `
  <svg width="${Math.round(s * 200 / 240)}" height="${s}" viewBox="0 0 200 240" style="display:block">
    <path id="sh" d="M100 8 L188 40 V132 C188 190 146 220 100 232 C54 220 12 190 12 132 V40 Z" fill="${c1}"/>
    <path d="M100 8 L188 40 V132 C188 190 146 220 100 232 Z" fill="${c2}" opacity=".55"/>
    <path d="M100 8 L188 40 V132 C188 190 146 220 100 232 C54 220 12 190 12 132 V40 Z" fill="none" stroke="${INK}" stroke-width="8" stroke-linejoin="round"/>
    <circle cx="100" cy="118" r="46" fill="${c2}" stroke="${INK}" stroke-width="7"/>
    <text x="100" y="146" font-family="Oswald,sans-serif" font-weight="900" font-size="74" fill="${INK}" text-anchor="middle">${letra}</text>
  </svg>`

// 🎽 manto BÁSICO na cor do tier (listra simples — 0 KB, igual no jogo)
const mantoTier = (s, full, id) => `
  <svg width="${s}" height="${Math.round(s * 1.06)}" viewBox="0 0 60 64" style="display:block">
    <defs><pattern id="p${id}" width="12" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(90)">
      <rect width="6" height="4" fill="${full[0]}"/><rect x="6" width="6" height="4" fill="${full[1]}"/></pattern></defs>
    <path d="M20 6 L8 12 L4 26 L14 29 V58 H46 V29 L56 26 L52 12 L40 6 C40 13 20 13 20 6 Z"
      fill="url(#p${id})" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
  </svg>`

// 🦅 mascote VAZIA — tracinho discreto, nunca um buraco com cara de bug
const mascoteVazia = `
  <div style="width:44px;height:44px;border:2.5px dashed rgba(12,12,12,.25);border-radius:12px;
    display:flex;align-items:center;justify-content:center;color:rgba(12,12,12,.3);${OSW};font-size:20px">—</div>`

// a tira de 3 do retrato (a mesma peça da sala)
const tira = (escudo, manto, mascote, rodape) => `
  <div style="display:flex;border-top:2.5px solid ${INK};border-bottom:2.5px solid ${INK};background:#FBF6E9">
    ${[[escudo, 'Escudo'], [manto, 'Manto'], [mascote, 'Mascote']].map(([art, rot], i) => `
      <div style="flex:1;text-align:center;padding:9px 2px 8px;${i < 2 ? 'border-right:1.5px solid rgba(12,12,12,.12)' : ''}">
        <div style="display:flex;justify-content:center;align-items:flex-end;height:48px">${art}</div>
        <div style="${OSW};font-size:9px;text-transform:uppercase;color:rgba(0,0,0,.5);margin-top:3px">${rot}</div>
      </div>`).join('')}
  </div>
  <p style="font-family:system-ui;font-size:9.5px;font-weight:700;color:rgba(0,0,0,.48);margin:0;padding:8px 12px 10px;background:#FBF6E9;text-align:center;line-height:1.4">${rodape}</p>`

const caso = (rot, cor, nota, clube, tierKey, arte) => {
  const t = TIER[tierKey]
  return `
  <div style="flex:0 0 300px">
    <div style="${OSW};font-size:14px;text-transform:uppercase;letter-spacing:.05em;color:${cor}">${rot}</div>
    <div style="font-family:system-ui;font-weight:600;font-size:11px;color:rgba(12,12,12,.5);margin:3px 0 9px;min-height:56px">${nota}</div>
    <div style="${box('#fff')};overflow:hidden">
      <div style="padding:10px 12px 9px;background:linear-gradient(180deg,#FBF6E9,#fff);display:flex;align-items:center;gap:9px">
        <div style="flex:1;min-width:0">
          <p style="${OSW};font-size:13.5px;margin:0;text-transform:uppercase">${clube}</p>
          <div style="display:flex;gap:4px;margin-top:4px;flex-wrap:wrap">
            <span style="${OSW};font-size:8px;border:2px solid ${INK};border-radius:999px;padding:1px 7px;background:${t.full[0]}">${t.selo} ${t.nome.toUpperCase()}</span>
          </div>
        </div>
      </div>
      ${arte}
    </div>
  </div>`
}

const bloco = (tit, bg, txt) => `
  <div style="border:4px solid ${INK};border-radius:18px;background:${bg};box-shadow:4px 4px 0 ${INK};padding:16px 18px;margin-bottom:14px">
    <div style="${OSW};font-size:16px;text-transform:uppercase;margin-bottom:9px">${tit}</div>
    <div style="font-family:system-ui;font-size:12.5px;font-weight:600;line-height:1.55">${txt}</div>
  </div>`

// escudo/manto/mascote DE VERDADE (quem batizou) — placeholder do mockup
const escudoBatizado = `
  <svg width="42" height="48" viewBox="0 0 64 72" style="display:block">
    <path d="M32 3 L60 12 V38 C60 55 46 65 32 69 C18 65 4 55 4 38 V12 Z" fill="#1B7A3D" stroke="${INK}" stroke-width="4"/>
    <path d="M32 3 L60 12 V38 C60 55 46 65 32 69 Z" fill="#166332"/>
    <circle cx="32" cy="32" r="13" fill="${GOLD}" stroke="${INK}" stroke-width="3"/>
    <text x="32" y="38" text-anchor="middle" style="${OSW};font-size:16px" fill="${INK}">N</text>
  </svg>`

const html = `<!doctype html><meta charset="utf-8"><style>${FONTES}
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:${CREME};padding:34px 34px 28px;font-family:system-ui}</style>
<body>
  <div style="display:inline-block;background:${GOLD};border:3px solid ${INK};border-radius:999px;box-shadow:3px 3px 0 ${INK};
    padding:5px 15px;${OSW};font-size:12.5px;letter-spacing:.08em">🛡️🎽🦅 QUEM NÃO TEM BATISMO</div>
  <h1 style="${OSW};text-transform:uppercase;font-size:43px;margin:14px 0 6px;line-height:1">
    NINGUÉM VÊ <span style="color:${RED}">BURACO</span></h1>
  <p style="font-size:14.5px;font-weight:600;max-width:1180px;line-height:1.5;margin:0 0 24px">
    Do seu jeito: <b>escudo automático</b> · <b>manto na cor do tier</b> (algo básico) · <b>mascote em branco</b>.
    Os 3 casos abaixo são os mesmos códigos que o jogo já tem — nada de arte nova, nada de peso novo.
  </p>

  <div style="display:flex;gap:22px;align-items:flex-start;flex-wrap:wrap;margin-bottom:26px">
    ${caso('① Grátis, sem batismo', '#8a7d59',
      'O caso mais comum do jogo. Escudo desenhado sozinho pelo nome, manto bege (a cor do tier grátis) e mascote vazia.',
      'Lendas FC', 'bege',
      tira(escudoAuto(46, '#DBD1B5', '#B2A583', 'L'), mantoTier(44, TIER.bege.full, 'a'), mascoteVazia,
        'Escudo automático · manto na cor do seu tier · mascote em branco.'))}
    ${caso('② Apoiador 💎, sem batismo', PURPLE,
      'Mesma coisa, só que o manto sai no ROXO dele. É a regra de ouro: cada um leva a cor do PRÓPRIO tier pra todo canto.',
      'Furacão do Vale', 'roxo',
      tira(escudoAuto(46, '#C9A9FF', '#7C3AED', 'F'), mantoTier(44, TIER.roxo.full, 'b'), mascoteVazia,
        'Escudo automático · manto no roxo do seu tier · mascote em branco.'))}
    ${caso('③ Batizado 👑', GOLD.replace('#FFC400', '#A67C00'),
      'Quem tem batismo vê a arte de verdade: o escudo .webp do dono, o manto nas 2 cores medidas na arte dele e a mascote escolhida.',
      'Neymarzetti', 'ouro',
      tira(escudoBatizado, mantoTier(44, ['#1B7A3D', '#FFFFFF'], 'c'), '<span style="font-size:42px;line-height:1">🦅</span>',
        'A arte que é sua — nem a regra do barão tira.'))}
    <div style="flex:1;min-width:380px">
      ${bloco('🛡️ O escudo JÁ é automático hoje', '#E6F3EA', `
        Não preciso fazer nada: <code>Escudo()</code> em <code>escudos.tsx</code> procura a arte comprada e, não
        achando, <b>desenha um escudo pelo nome do clube</b> — forma, 2 cores, padrão e a letra saem todos do nome.
        É o mesmo escudo que já aparece na tabela e nas listas, então a sala não inventa nada: ela mostra
        <b>o que a pessoa já vê no resto do jogo</b>.`)}
      ${bloco('🎽 O manto na cor do tier', '#EDE7FF', `
        Listra simples nas 2 cores do tier — as MESMAS de <code>APOIO_PERKS</code> (bege · verde · roxo 💎 ·
        prata ⭐ · ouro 👑). Desenhado em SVG, <b>0 KB</b>: nada é baixado, nada entra no bundle.<br><br>
        ⚠️ E respeita a sua regra sagrada: <b>ninguém pega cor emprestada</b>. Grátis é bege, e o dourado é só de
        quem é ouro.`)}
      ${bloco('🦅 A mascote em branco', '#FFF6D6', `
        Sem desenho genérico, como você mandou — inventar um bicho pra quem não escolheu seria o jogo
        falando por ele.<br><br>
        <b>Uma coisinha que eu decidi sozinho e quero te confirmar:</b> em vez de deixar a caixa 100% vazia
        (que fica com cara de <i>bug/imagem quebrada</i>), botei um <b>tracinho cinza discreto</b> —
        assim lê-se "não tem" em vez de "quebrou". Se você preferir <b>vazio total</b>, ou <b>sumir a
        terceira coluna</b> pra quem não tem, é uma linha de código.`)}
      ${bloco('❓ Falta só isso', '#fff', `
        · O tracinho na mascote fica, ou some a coluna?<br>
        · <b>Coloco um convite discreto</b> ("batize seu clube") embaixo da tira pra quem não tem? Eu
        <b>NÃO</b> colocaria em cima — a sala é do presidente, não vitrine — mas um link pequeno no rodapé
        converte sem incomodar. Você decide.`)}
    </div>
  </div>

  <p style="${OSW};font-size:15px">⚽ Leilão <span style="color:${RED}">Legends</span>
    <span style="float:right;font-weight:700;font-size:12px;opacity:.45">leilaolegends.com</span></p>
</body></html>`

const tmp = `/tmp/mockup-sembat-${process.pid}.html`
writeFileSync(tmp, html)
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1560, height: 1000 }, deviceScaleFactor: 2 })
await p.goto('file://' + tmp)
await p.evaluate(() => document.fonts.ready)
await p.waitForTimeout(600)
await p.screenshot({ path: SAIDA, fullPage: true })
await b.close()
console.log(SAIDA)
