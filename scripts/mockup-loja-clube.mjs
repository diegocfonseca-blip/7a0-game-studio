// 🛍️ LOJA DO CLUBE — mockup da proposta (Diego, 15/09).
//
// 👕 A CAMISA É ARTE DE VERDADE, NÃO VETOR (ele cortou duas versões em SVG:
// *"você tá fazendo em SVG e quero arte de verdade igual está é a do time"*).
// E o MOLDE é o da camisa do **Final Boss FC** — escolha dele: *"faz com base na
// do Final Boss, que é esse modelo que é o certo de camisa"*.
//
// Como isso não vira um arquivo por clube: o jogo guarda **UMA** arte de camisa
// em branco e pinta com as 2 cores do clube. Quem tem batismo continua usando a
// arte própria dele (as 31 que já estão em public/mantos-salao).
//
// As 3 peças entram sempre nos mesmos lugares, como ele desenhou:
//   · escudo no peito ESQUERDO · fornecedor no peito DIREITO · Master ABAIXO do peito
//
//   node scripts/mockup-loja-clube.mjs
import { readFileSync } from 'node:fs'
import { chromium } from 'playwright-core'

const INK = '#0C0C0C', CREME = '#F4ECD6', GOLD = '#FFC400', GREEN = '#1B7A3D'
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')
const OSW = 'font-family:Oswald,sans-serif'
const img = (caminho, tipo = 'webp') => `data:image/${tipo};base64,${readFileSync(caminho).toString('base64')}`

// 👕 As peças do mockup moram em `scripts/kits/` (são do POST, não do jogo —
// no jogo o molde é pintado na hora, veja `scripts/tinge-camisa.py`):
//   · MOLDE-camisa-branca.webp  → o molde em branco (camisa do Final Boss, limpa)
//   · camisa-tier-foiprof.webp  → o molde já pintado no bege 🪵 Foi Profissional
//   · patro-vadico-alfa.webp    → o logo da Vadico com fundo transparente (cor intacta)
const CAMISA_TIER = img('scripts/kits/MOLDE-camisa-tier.webp')
const LOGO_VADICO = img('scripts/kits/patro-vadico-alfa.webp')

// 🛡️ ESCUDO BASE — quem não tem batismo também tem escudo (pedido do Diego, 15/09):
// *"o escudo base que sempre vem com a primeira letra ou algo do tipo pra pôr no
// peito, com alguma cor também o escudo"*.
//
// Ele NASCE DA LETRA do clube e das 2 cores que o dono escolhe, então é DESENHO EM
// CÓDIGO, não arquivo — se fosse arquivo seria um por clube, e aí a regra de peso
// morria na hora (são dezenas de milhares de carreiras). Aqui ele custa 0 KB e serve
// pra qualquer nome: "Fulanos FC" → F.
const escudoBase = ({ letra, c1, c2, size = 44 }) => {
  const L = (letra || '?').trim().charAt(0).toUpperCase()
  return `<svg viewBox="0 0 100 114" width="${Math.round(size * 100 / 114)}" height="${size}" style="display:block;overflow:visible">
    <defs><linearGradient id="g${L}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs>
    <path d="M50 3 L95 17 V60 C95 86 74 102 50 111 C26 102 5 86 5 60 V17 Z"
          fill="url(#g${L})" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/>
    <path d="M9 34 H91" stroke="${INK}" stroke-width="5" opacity=".85"/>
    <text x="50" y="82" text-anchor="middle" style="${OSW};font-weight:700;font-size:56px;letter-spacing:-1px"
          fill="#F4ECD6" stroke="${INK}" stroke-width="5" paint-order="stroke">${L}</text>
  </svg>`
}


// 🏬 A VITRINE DA LOJA — pedido do Diego (15/09): *"não tem uma arte foda que possa
// fazer também?"*. A camisa numa caixa branca é catálogo; loja é vitrine. Então a
// moldura virou cena: madeira escura, foco de luz quente em cima da camisa, chão
// refletindo e a placa de LOJA DO CLUBE. Tudo em degradê CSS — **0 KB**, e por isso
// funciona com QUALQUER camisa (batismo ou molde do tier) sem arquivo novo.
// 👉 Se ele aprovar uma das artes do Canva, essa cena vira UM `.webp` e a camisa
//    continua entrando por cima exatamente do mesmo jeito.
const vitrine = (shirt) => `
  <div style="position:relative;overflow:hidden;border:3px solid ${INK};border-radius:14px;box-shadow:3px 3px 0 ${INK};
              margin-bottom:9px;background:
                radial-gradient(120% 70% at 50% 4%, rgba(255,213,120,.42) 0%, rgba(255,196,0,.10) 38%, transparent 66%),
                linear-gradient(#2A1B10 0%, #40281680 34%, #1A0F08 100%),
                repeating-linear-gradient(90deg,#3A2414 0 26px,#331F11 26px 52px)">
    <div style="position:absolute;inset:0 0 auto;height:30px;background:linear-gradient(#0B0704,#0B070400);opacity:.85"></div>
    <div style="position:relative;text-align:center;padding:7px 0 2px">
      <span style="${OSW};font-weight:700;font-size:10px;letter-spacing:.22em;color:#F0DFAE;text-transform:uppercase;
                   text-shadow:0 1px 0 #000">· Loja do Clube ·</span>
    </div>
    <div style="position:relative;display:flex;justify-content:center;padding:2px 10px 0;
                filter:drop-shadow(0 14px 16px rgba(0,0,0,.55))">${shirt}</div>
    <div style="position:relative;height:34px;margin-top:-6px;background:
                linear-gradient(#150C06,#0A0603);border-top:2px solid #54351C"></div>
  </div>`

// ── A CAMISA: a arte (imagem) + as 3 peças carimbadas por cima ──────────────
// `pos` = onde cada peça cai NAQUELA arte, em % (arte de batismo e molde têm
// enquadramentos diferentes, então cada uma traz as suas medidas).
const camisa = ({ arte, alt = 300, escudo, fornecedor, fornSimbolo, master, masterLogo, masterCor, masterW = 0.27, pos }) => `
  <div style="position:relative;height:${alt}px;flex:none;isolation:isolate">
    <img src="${arte}" style="height:${alt}px;display:block">
    ${!escudo ? '' : `<div style="position:absolute;left:${pos.escudoX}%;top:${pos.escudoY}%;transform:translate(-50%,-50%);
                filter:drop-shadow(0 1px 2px rgba(0,0,0,.42))">
      ${escudo.startsWith('data:')
        ? `<img src="${escudo}" style="height:${Math.round(alt * 0.135)}px;display:block">`
        : escudo /* escudo base desenhado em código (SVG) */}
    </div>`}
    <div style="position:absolute;left:${pos.fornX}%;top:${pos.fornY}%;transform:translate(-50%,-50%);
                display:flex;flex-direction:column;align-items:center;gap:${Math.round(alt * 0.006)}px;
                mix-blend-mode:multiply;opacity:.95;filter:blur(.15px);color:${masterCor ?? INK}">
      <span style="font-size:${(alt * 0.030).toFixed(1)}px;line-height:1">${fornSimbolo ?? '▸'}</span>
      <span style="${OSW};font-weight:700;font-size:${(alt * 0.019).toFixed(1)}px;line-height:1;letter-spacing:.6px;text-transform:uppercase;white-space:nowrap">${fornecedor}</span>
    </div>
    <div style="position:absolute;left:${pos.masterX}%;top:${pos.masterY}%;transform:translate(-50%,-50%);
                ${masterLogo ? 'opacity:.97' : 'mix-blend-mode:multiply;opacity:.93'};filter:blur(.15px)">
      ${masterLogo
        // 🔴 LOGO DE MARCA REAL ENTRA EM CORES DE VERDADE. O `multiply` casava a
        // estampa com o tecido, mas comia a cor do logo — o vermelho da Vadico
        // sumia. O Diego pegou: *"se eu por a logo da Vadico ali, que tem parte
        // vermelha, deve aparecer o vermelho. Não é pra ser sem cor"*. Como o
        // arquivo já tem alfa de verdade (o branco do fundo virou transparente,
        // veja `scripts/kits/patro-vadico-alfa.webp`), ele entra por cima normal
        // e a cor fica intacta; a sombrinha é que encaixa a estampa no pano.
        ? `<img src="${masterLogo}" style="width:${Math.round(alt * masterW)}px;display:block;filter:drop-shadow(0 1px 1px rgba(0,0,0,.28))">`
        : (() => {
            // 🖨️ marca SEM logo: o nome é impresso no peito e tem que CABER no corpo
            // da camisa (≈65% da largura dele). Nome comprido quebra em 2 linhas,
            // que é o que kit de verdade faz — não encolhe até virar formiga.
            const linhas = master.length > 14 ? (() => {
              const p = master.split(' '); const meio = Math.ceil(p.length / 2)
              return [p.slice(0, meio).join(' '), p.slice(meio).join(' ')]
            })() : [master]
            const maior = Math.max(...linhas.map(l => l.length))
            const fs = Math.max(alt * 0.028, Math.min(alt * 0.058, (alt * 0.30) / (maior * 0.52)))
            return `<div style="${OSW};font-weight:700;font-size:${fs.toFixed(1)}px;line-height:1.05;letter-spacing:.5px;
                      text-transform:uppercase;text-align:center;color:${masterCor ?? INK}">${linhas.join('<br>')}</div>`
          })()}
    </div>
  </div>`

const pill = (txt, sub, on) => `
  <div style="flex:1;min-width:0;border:2.5px solid ${INK};border-radius:11px;padding:6px 4px;text-align:center;background:${on ? GOLD : '#fff'};box-shadow:${on ? `2px 2px 0 ${INK}` : 'none'}">
    <div style="${OSW};font-weight:700;font-size:11px;text-transform:uppercase">${txt}</div>
    <div style="${OSW};font-weight:400;font-size:9px;opacity:.65;margin-top:1px">${sub}</div>
  </div>`

const cartao = (titulo, corpo, rodape) => `
  <div style="border:3px solid ${INK};border-radius:13px;background:#fff;box-shadow:3px 3px 0 ${INK};padding:9px 10px;margin-bottom:9px">
    <div style="${OSW};font-weight:700;font-size:11.5px;text-transform:uppercase;margin-bottom:5px">${titulo}</div>
    ${corpo}${rodape ? `<div style="${OSW};font-weight:400;font-size:10px;opacity:.65;margin-top:6px;line-height:1.4">${rodape}</div>` : ''}
  </div>`

const tela = ({ titulo, sub, shirt, extra, forn, master, masterPe, vendeu }) => `
  <div style="width:392px;flex:none;background:${CREME};border:3px solid ${INK};border-radius:16px;box-shadow:4px 4px 0 ${INK};padding:12px;color:${INK}">
    <div style="${OSW};font-weight:700;font-size:16px;text-transform:uppercase">🛍️ Loja do Clube</div>
    <div style="${OSW};font-weight:400;font-size:11px;opacity:.7;margin-bottom:8px">${titulo} · ${sub}</div>
    ${vitrine(shirt)}
    ${extra ?? ''}
    ${cartao('💰 Preço da camisa', `<div style="display:flex;gap:5px">${pill('Popular', '1 🪙 cada', false)}${pill('Normal', '2 🪙 cada', true)}${pill('Cara', '3 🪙 cada', false)}</div>`,
      'Barata vende pra torcida toda e rende pouco por peça. Cara rende mais e vende menos.')}
    ${cartao('👟 Fornecedor de material', `<div style="display:flex;align-items:center;gap:8px">
        <div style="width:38px;height:38px;border:2.5px solid ${INK};border-radius:9px;background:${forn.cor};color:#fff;display:flex;align-items:center;justify-content:center;font-size:19px">${forn.emoji}</div>
        <div style="flex:1;min-width:0"><div style="${OSW};font-weight:700;font-size:13px">${forn.nome}</div>
          <div style="${OSW};font-weight:400;font-size:10px;opacity:.7">${forn.linha}</div></div></div>`, forn.pe)}
    ${cartao('🤝 Patrocínio Master', `<div style="${OSW};font-weight:700;font-size:13px">${master}</div>`,
      `O Master que você já fechou aparece ESTAMPADO na camisa.<br>${masterPe}`)}
    <div style="border:3px solid ${INK};border-radius:13px;background:${GOLD};box-shadow:3px 3px 0 ${INK};padding:9px 10px">
      <div style="${OSW};font-weight:700;font-size:11.5px;text-transform:uppercase">📦 Vendeu na temporada</div>
      <div style="${OSW};font-weight:700;font-size:20px;margin-top:2px">${vendeu.n} camisas · <span style="color:${GREEN}">+${vendeu.m} 🪙</span></div>
      <div style="${OSW};font-weight:400;font-size:10px;opacity:.7;margin-top:2px">${vendeu.conta}</div>
    </div>
  </div>`

const html = `<style>${FONTES}body{margin:0;background:#E8DFC6;padding:16px;width:860px}</style>
  <div style="${OSW};font-weight:700;font-size:20px;text-transform:uppercase;color:${INK}">Loja do Clube · proposta</div>
  <div style="${OSW};font-weight:400;font-size:12px;color:${INK};opacity:.75;margin-bottom:12px">
    Escudo no peito <b>esquerdo</b>, fornecedor de material no peito <b>direito</b>, patrocínio Master na <b>barriga</b>.</div>
  <div style="display:flex;gap:14px;align-items:flex-start">
    ${tela({
      titulo: 'COM batismo', sub: 'Final Boss FC',
      shirt: camisa({
        arte: img('public/mantos-salao/finalboss-camisa.webp'), alt: 300,
        escudo: '', // a arte do batismo já traz o escudo dele — o jogo não carimba outro
        fornecedor: 'Naique', fornSimbolo: '✓', master: 'VADICO VEÍCULOS', masterCor: INK,
        masterLogo: LOGO_VADICO, masterW: 0.22, // 🏷️ marca REAL = logo de verdade, em cores
        pos: { fornX: 30, fornY: 27, masterX: 50, masterY: 58 },
      }),
      extra: cartao('👑 A camisa do seu clube', `<div style="${OSW};font-weight:700;font-size:12.5px">Arte própria do batismo</div>`,
        'Clube batizado usa a arte que o dono mandou — é ela que aparece na loja. As 2 cores do manto saem dessa arte.'),
      forn: { nome: 'Naique Sports', emoji: '👟', cor: GREEN, linha: 'contrato de 3 temporadas · 5 🪙 por ano<br>+30% nas vendas da loja', pe: 'Marca grande só te procura na Série B pra cima.' },
      master: '🚗 Vadico Veículos <span style="font-weight:400;font-size:10px;opacity:.7">· ano 2 de 5</span>',
      masterPe: 'Marca REAL (Vadico, ERO, Max Joias, Rei das Tintas): entra o <b>logo de verdade</b>, o mesmo que já está no jogo.',
      vendeu: { n: 44, m: 88, conta: '34 de base na Série B × estádio cheio × Naique (+30%)' },
    })}
    ${tela({
      titulo: 'SEM batismo', sub: 'Fulanos FC · tier 🪵 FOI PROFISSIONAL',
      shirt: camisa({
        arte: CAMISA_TIER, alt: 300,
        // 📐 medido na arte que o Diego mandou (542×620): gola escura até 12%, faixa de
        // cima 32→38%, faixa de baixo 42→48%, corpo entre x=128 e x=414.
        // Escudo no peito ESQUERDO de quem veste = lado DIREITO de quem olha.
        escudo: escudoBase({ letra: 'F', c1: '#2E9E5B', c2: '#14612F', size: Math.round(300 * 0.085) }),
        fornecedor: 'Adibas', fornSimbolo: '◣', master: 'VADICO VEÍCULOS', masterCor: '#4F462E',
        masterLogo: LOGO_VADICO, masterW: 0.22,
        pos: { escudoX: 64, escudoY: 27, fornX: 36, fornY: 27, masterX: 50, masterY: 61 },
      }),
      extra: cartao('🪵 A camisa e o escudo do seu clube', `<div style="display:flex;align-items:center;gap:9px">
          ${escudoBase({ letra: 'F', c1: '#2E9E5B', c2: '#14612F', size: 40 })}
          <div style="flex:1;min-width:0"><div style="${OSW};font-weight:700;font-size:12.5px">Fulanos FC</div>
            <div style="${OSW};font-weight:400;font-size:10px;opacity:.7">escudo base · letra F · verde escolhido por você</div></div></div>`,
        'A camisa é a MESMA arte de quem tem batismo, na cor do tier 🪵. E o clube sem batismo também tem escudo: o <b>escudo base</b> nasce da <b>primeira letra</b> do nome e das <b>2 cores</b> que você escolher — é desenho do jogo, não custa nada e serve pra qualquer nome.'),
      forn: { nome: 'Adibas', emoji: '🔺', cor: '#0E3E86', linha: 'contrato de 2 temporadas · 3 🪙 por ano<br>+20% nas vendas da loja', pe: 'Subiu de série, marca melhor bate na porta.' },
      master: '🚗 Vadico Veículos <span style="font-weight:400;font-size:10px;opacity:.7">· ano 1 de 3</span>',
      masterPe: 'Marca <b>real</b> entra com o <b>logo de verdade, em cores</b> (o vermelho da Vadico aparece). Marca <b>genérica</b> (Padaria do Zé, Espetinho do Baixinho…) não tem logo: entra o <b>nome escrito</b>.',
      vendeu: { n: 15, m: 30, conta: '22 de base na Série C × estádio 55% × Adibas (+20%)' },
    })}
  </div>`

const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 892, height: 900 }, deviceScaleFactor: 2 })
await p.setContent(html)
await p.evaluate(() => document.fonts.ready)
await p.screenshot({ path: 'mockup-loja-clube.png', fullPage: true })
await b.close()
console.log('mockup-loja-clube.png')
