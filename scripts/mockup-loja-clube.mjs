// 🛍️ LOJA DO CLUBE — mockup da proposta (Diego, 15/09): vender camisa, fornecedor
// de material esportivo com nome cômico, e o patrocínio Master ESTAMPADO no manto.
// Formato da camisa pedido por ele (referência: a camisa do Internacional de Madrid):
//   · escudo no peito ESQUERDO
//   · fornecedor de material no peito DIREITO
//   · patrocínio MASTER no centro, ABAIXO do peito
// A camisa é montada em CSS (0 KB, como o manto já é hoje) — as cores saem das 2
// cores do clube (MANTO_CONTAS pro batismo, cor do tier pra quem não é).
//   node scripts/mockup-loja-clube.mjs
import { readFileSync } from 'node:fs'
import { chromium } from 'playwright-core'

const INK = '#0C0C0C', CREME = '#F4ECD6', GOLD = '#FFC400', GREEN = '#1B7A3D'
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')
const OSW = 'font-family:Oswald,sans-serif'

// ── A CAMISA, montada pelo jogo ────────────────────────────────────────────
// 👕 O MOLDE é o mesmo das artes de batismo que o Diego mandou (15/09): camisa de
// verdade, com gola V, ombros e caimento — não um desenho chapado. Desenhada em
// SVG (0 KB, nenhum arquivo por clube): o jogo só pinta com as 2 cores do manto e
// encaixa as 3 peças nos lugares que ele pediu:
//   · escudo no peito ESQUERDO · fornecedor no peito DIREITO · Master ABAIXO do peito
const camisa = ({ c1, c2, escudo, fornecedor, master, nome, larg = 230 }) => {
  const id = Math.random().toString(36).slice(2, 7)
  const corpo = 'M60,20 L84,11 Q100,30 116,11 L140,20 L192,48 L170,96 L150,84 L154,212 Q100,222 46,212 L50,84 L30,96 L8,48 Z'
  const soCorpo = 'M60,20 L84,11 Q100,30 116,11 L140,20 L150,26 L150,84 L154,212 Q100,222 46,212 L50,84 L50,26 Z'
  const listras = Array.from({ length: 7 }, (_, i) =>
    `<rect x="${50 + i * 15}" y="0" width="8" height="230" fill="${c2}" opacity=".95"/>`).join('')
  return `
  <svg viewBox="0 0 200 230" width="${larg}" height="${Math.round(larg * 1.15)}" style="flex:none;overflow:visible">
    <defs>
      <clipPath id="b${id}"><path d="${soCorpo}"/></clipPath>
      <linearGradient id="g${id}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/>
        <stop offset="1" stop-color="#000" stop-opacity=".16"/>
      </linearGradient>
    </defs>
    <!-- sombra dura do jogo -->
    <path d="${corpo}" fill="${INK}" transform="translate(4,5)"/>
    <!-- camisa -->
    <path d="${corpo}" fill="${c1}"/>
    <g clip-path="url(#b${id})">${listras}</g>
    <path d="${corpo}" fill="url(#g${id})"/>
    <!-- gola V -->
    <path d="M84,11 Q100,30 116,11 L122,15 Q100,40 78,15 Z" fill="${c2}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
    <!-- punhos -->
    <path d="M192,48 L170,96 L150,84 L168,44 Z" fill="${c2}" opacity=".85"/>
    <path d="M8,48 L30,96 L50,84 L32,44 Z" fill="${c2}" opacity=".85"/>
    <path d="${corpo}" fill="none" stroke="${INK}" stroke-width="4.5" stroke-linejoin="round"/>
    <!-- escudo: peito esquerdo -->
    <g transform="translate(66,58)">
      ${escudo.startsWith('data:')
        ? `<image href="${escudo}" x="-2" y="-2" width="34" height="42" preserveAspectRatio="xMidYMid meet"/>`
        : `<path d="M0,0 H30 V17 Q30,31 15,38 Q0,31 0,17 Z" fill="${CREME}" stroke="${INK}" stroke-width="2.6"/>
           <text x="15" y="25" text-anchor="middle" font-size="17">${escudo}</text>`}
    </g>
    <!-- fornecedor: peito direito -->
    <text x="134" y="74" text-anchor="middle" font-family="Oswald" font-weight="700" font-size="12"
          fill="${CREME}" stroke="${INK}" stroke-width="2.6" paint-order="stroke" letter-spacing="0.4">${fornecedor}</text>
    <!-- MASTER: centro, abaixo do peito -->
    ${(() => {
      const fs = master.length > 17 ? 9.5 : master.length > 13 ? 11 : 12
      const larguraPatch = Math.min(150, Math.max(90, master.length * fs * 0.62 + 16))
      return `<g transform="translate(100,124)">
      <rect x="${-larguraPatch / 2}" y="-13" width="${larguraPatch}" height="26" rx="7" fill="${CREME}" stroke="${INK}" stroke-width="2.8"/>
      <text x="0" y="4.5" text-anchor="middle" font-family="Oswald" font-weight="700" font-size="${fs}" fill="${INK}">${master}</text>
    </g>` })()}
    <!-- nome do clube na barra -->
    <text x="100" y="199" text-anchor="middle" font-family="Oswald" font-weight="700" font-size="11"
          fill="${CREME}" stroke="${INK}" stroke-width="2.4" paint-order="stroke" letter-spacing="0.8">${nome.toUpperCase()}</text>
  </svg>`
}

const pill = (txt, sub, on) => `
  <div style="flex:1;min-width:0;border:2.5px solid ${INK};border-radius:11px;padding:6px 4px;text-align:center;background:${on ? GOLD : '#fff'};box-shadow:${on ? `2px 2px 0 ${INK}` : 'none'}">
    <div style="${OSW};font-weight:700;font-size:11px;text-transform:uppercase">${txt}</div>
    <div style="${OSW};font-weight:400;font-size:9px;opacity:.65;margin-top:1px">${sub}</div>
  </div>`

const cartao = (titulo, corpo, rodape) => `
  <div style="border:3px solid ${INK};border-radius:13px;background:#fff;box-shadow:3px 3px 0 ${INK};padding:9px 10px;margin-bottom:9px">
    <div style="${OSW};font-weight:700;font-size:11.5px;text-transform:uppercase;margin-bottom:5px">${titulo}</div>
    ${corpo}
    ${rodape ? `<div style="${OSW};font-weight:400;font-size:10px;opacity:.65;margin-top:6px;line-height:1.4">${rodape}</div>` : ''}
  </div>`

const tela = ({ titulo, sub, shirt, artOficial, forn, master, vendeu, extra }) => `
  <div style="width:392px;flex:none;background:${CREME};border:3px solid ${INK};border-radius:16px;box-shadow:4px 4px 0 ${INK};padding:12px;color:${INK}">
    <div style="${OSW};font-weight:700;font-size:16px;text-transform:uppercase">🛍️ Loja do Clube</div>
    <div style="${OSW};font-weight:400;font-size:11px;opacity:.7;margin-bottom:8px">${titulo} · ${sub}</div>

    <div style="display:flex;gap:10px;align-items:flex-start;justify-content:center;background:#fff;border:3px solid ${INK};border-radius:14px;box-shadow:3px 3px 0 ${INK};padding:12px 8px;margin-bottom:9px">
      ${shirt}
      ${artOficial ? `<div style="text-align:center">
        <img src="${artOficial}" height="215" style="object-fit:contain">
        <div style="${OSW};font-weight:600;font-size:9px;opacity:.6;margin-top:3px;text-transform:uppercase">arte oficial<br>do batismo</div></div>` : ''}
    </div>

    ${extra ?? ''}
    ${cartao('💰 Preço da camisa', `<div style="display:flex;gap:5px">
        ${pill('Popular', '1 🪙 cada', false)}${pill('Normal', '2 🪙 cada', true)}${pill('Cara', '3 🪙 cada', false)}</div>`,
      'Camisa barata vende pra torcida toda e rende pouco por peça. Cara rende mais e vende menos.')}

    ${cartao('👟 Fornecedor de material', `<div style="display:flex;align-items:center;gap:8px">
        <div style="width:40px;height:40px;border:2.5px solid ${INK};border-radius:9px;background:${forn.cor};color:#fff;display:flex;align-items:center;justify-content:center;font-size:20px">${forn.emoji}</div>
        <div style="flex:1;min-width:0">
          <div style="${OSW};font-weight:700;font-size:13px">${forn.nome}</div>
          <div style="${OSW};font-weight:400;font-size:10px;opacity:.7">${forn.linha}</div>
        </div></div>`, forn.pe)}

    ${cartao('🤝 Patrocínio Master', `<div style="${OSW};font-weight:700;font-size:13px">${master}</div>`,
      'O Master que você já fechou agora aparece ESTAMPADO na camisa, no peito.')}

    <div style="border:3px solid ${INK};border-radius:13px;background:${GOLD};box-shadow:3px 3px 0 ${INK};padding:9px 10px">
      <div style="${OSW};font-weight:700;font-size:11.5px;text-transform:uppercase">📦 Vendeu na temporada</div>
      <div style="${OSW};font-weight:700;font-size:20px;margin-top:2px">${vendeu.n} camisas · <span style="color:${GREEN}">+${vendeu.m} 🪙</span></div>
      <div style="${OSW};font-weight:400;font-size:10px;opacity:.7;margin-top:2px;line-height:1.4">${vendeu.conta}</div>
    </div>
  </div>`

const b64img = f => `data:image/webp;base64,${readFileSync(`public/mantos-salao/${f}`).toString('base64')}`

const escudoIM = `data:image/webp;base64,${readFileSync('src/escalacao/img/internacional-madrid-escudo.webp').toString('base64')}`
const artIM = `data:image/webp;base64,${readFileSync('/tmp/claude-0/-home-user-7a0-game-studio/eff68882-b963-5eee-b2bb-3ea2ad04e5b9/scratchpad/intermadrid-camisa.webp').toString('base64')}`

const bolinha = (cor, on) => `<span style="display:inline-block;width:26px;height:26px;border-radius:50%;background:${cor};border:${on ? `3px solid ${INK}` : '2px solid rgba(0,0,0,.25)'};box-shadow:${on ? `2px 2px 0 ${INK}` : 'none'};margin-right:5px"></span>`

const html = `<style>${FONTES}body{margin:0;background:#E8DFC6;padding:16px;width:860px}</style>
  <div style="${OSW};font-weight:700;font-size:20px;text-transform:uppercase;color:${INK};margin-bottom:2px">Loja do Clube · proposta</div>
  <div style="${OSW};font-weight:400;font-size:12px;color:${INK};opacity:.75;margin-bottom:12px">A camisa é montada pelo jogo, no molde das artes de batismo. Escudo no peito esquerdo, fornecedor no peito direito, Master abaixo do peito.</div>
  <div style="display:flex;gap:14px;align-items:flex-start">
    ${tela({
      titulo: 'COM batismo', sub: 'Internacional de Madrid',
      shirt: camisa({ c1: '#A90605', c2: '#FCF6F1', escudo: escudoIM, fornecedor: 'NAIQUE', master: 'VADICO VEÍCULOS', nome: 'Internacional de Madrid' }),
      artOficial: artIM,
      forn: { nome: 'Naique Sports', emoji: '👟', cor: GREEN, linha: 'contrato de 3 temporadas · 5 🪙 por ano<br>+30% nas vendas da loja', pe: 'Marca grande só te procura na Série B pra cima.' },
      master: '🚗 Vadico Veículos <span style="font-weight:400;font-size:10px;opacity:.7">· ano 2 de 5</span>',
      vendeu: { n: 44, m: 88, conta: '34 de base na Série B × estádio cheio × Naique (+30%)' },
      extra: cartao('👕 A camisa do seu clube', `<div style="${OSW};font-weight:700;font-size:12.5px">👑 Arte oficial do batismo</div>`,
        'Clube batizado usa a arte que o dono mandou. As 2 cores do manto saem dela — aqui, o vermelho e o branco medidos na camisa dele.'),
    })}
    ${tela({
      titulo: 'SEM batismo', sub: 'clube de qualquer jogador',
      shirt: camisa({ c1: '#1C57C8', c2: '#F2F0E9', escudo: '🦅', fornecedor: 'ADIBAS', master: 'ESPETINHO DO BAIXINHO', nome: 'Gaviões do Zé FC' }),
      artOficial: null,
      forn: { nome: 'Adibas', emoji: '🔺', cor: '#0E3E86', linha: 'contrato de 2 temporadas · 3 🪙 por ano<br>+20% nas vendas da loja', pe: 'Subiu de série, marca melhor bate na porta.' },
      master: '🍗 Espetinho do Baixinho <span style="font-weight:400;font-size:10px;opacity:.7">· ano 1 de 2</span>',
      vendeu: { n: 15, m: 30, conta: '22 de base na Série C × estádio 55% × Adibas (+20%)' },
      extra: cartao('🎨 Cores do seu manto', `<div style="display:flex;align-items:center;flex-wrap:wrap">
          ${bolinha('#1C57C8', true)}${bolinha('#F2F0E9', true)}${bolinha('#0C7A3D', false)}${bolinha('#FFC400', false)}${bolinha('#C2452F', false)}${bolinha('#0C0C0C', false)}
          <span style="${OSW};font-weight:700;font-size:11px;margin-left:4px">escolher</span></div>`,
        'Quem não é batismo ESCOLHE as 2 cores, de graça. A camisa é a mesma, o escudo é o mesmo, o que muda é só a arte desenhada à mão do batismo.'),
    })}
  </div>`

const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 892, height: 900 }, deviceScaleFactor: 2 })
await p.setContent(html)
await p.evaluate(() => document.fonts.ready)
await p.screenshot({ path: 'mockup-loja-clube.png', fullPage: true })
await b.close()
console.log('mockup-loja-clube.png')
