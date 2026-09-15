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
const SCRATCH = process.env.SCRATCH || '/tmp/claude-0/-home-user-7a0-game-studio/eff68882-b963-5eee-b2bb-3ea2ad04e5b9/scratchpad'
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')
const OSW = 'font-family:Oswald,sans-serif'
const img = (caminho, tipo = 'webp') => `data:image/${tipo};base64,${readFileSync(caminho).toString('base64')}`

// ── A CAMISA: a arte (imagem) + as 3 peças carimbadas por cima ──────────────
// `pos` = onde cada peça cai NAQUELA arte, em % (arte de batismo e molde têm
// enquadramentos diferentes, então cada uma traz as suas medidas).
const camisa = ({ arte, alt = 300, escudo, fornecedor, master, masterCor, pos }) => `
  <div style="position:relative;height:${alt}px;flex:none">
    <img src="${arte}" style="height:${alt}px;display:block">
    ${!escudo ? '' : `<div style="position:absolute;left:${pos.escudoX}%;top:${pos.escudoY}%;transform:translate(-50%,-50%)">
      ${escudo.startsWith('data:')
        ? `<img src="${escudo}" style="height:${Math.round(alt * 0.135)}px;display:block;filter:drop-shadow(0 1px 2px rgba(0,0,0,.45))">`
        : `<span style="font-size:${Math.round(alt * 0.11)}px;line-height:1;filter:drop-shadow(0 1px 2px rgba(0,0,0,.45))">${escudo}</span>`}
    </div>`}
    <div style="position:absolute;left:${pos.fornX}%;top:${pos.fornY}%;transform:translate(-50%,-50%);
                ${OSW};font-weight:700;font-size:${Math.round(alt * 0.045)}px;color:#fff;letter-spacing:.4px;white-space:nowrap;
                text-shadow:0 1px 0 ${INK},1px 0 0 ${INK},-1px 0 0 ${INK},0 -1px 0 ${INK}">${fornecedor}</div>
    <div style="position:absolute;left:${pos.masterX}%;top:${pos.masterY}%;transform:translate(-50%,-50%);
                ${OSW};font-weight:700;font-size:${Math.round(alt * (master.length > 18 ? 0.042 : master.length > 13 ? 0.05 : 0.058))}px;line-height:1;letter-spacing:.5px;
                text-transform:uppercase;white-space:nowrap;color:${masterCor ?? INK};
                text-shadow:0 1px 1px rgba(0,0,0,.35)">${master}</div>
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

const tela = ({ titulo, sub, shirt, extra, forn, master, vendeu }) => `
  <div style="width:392px;flex:none;background:${CREME};border:3px solid ${INK};border-radius:16px;box-shadow:4px 4px 0 ${INK};padding:12px;color:${INK}">
    <div style="${OSW};font-weight:700;font-size:16px;text-transform:uppercase">🛍️ Loja do Clube</div>
    <div style="${OSW};font-weight:400;font-size:11px;opacity:.7;margin-bottom:8px">${titulo} · ${sub}</div>
    <div style="display:flex;justify-content:center;background:#fff;border:3px solid ${INK};border-radius:14px;box-shadow:3px 3px 0 ${INK};padding:10px;margin-bottom:9px">${shirt}</div>
    ${extra ?? ''}
    ${cartao('💰 Preço da camisa', `<div style="display:flex;gap:5px">${pill('Popular', '1 🪙 cada', false)}${pill('Normal', '2 🪙 cada', true)}${pill('Cara', '3 🪙 cada', false)}</div>`,
      'Barata vende pra torcida toda e rende pouco por peça. Cara rende mais e vende menos.')}
    ${cartao('👟 Fornecedor de material', `<div style="display:flex;align-items:center;gap:8px">
        <div style="width:38px;height:38px;border:2.5px solid ${INK};border-radius:9px;background:${forn.cor};color:#fff;display:flex;align-items:center;justify-content:center;font-size:19px">${forn.emoji}</div>
        <div style="flex:1;min-width:0"><div style="${OSW};font-weight:700;font-size:13px">${forn.nome}</div>
          <div style="${OSW};font-weight:400;font-size:10px;opacity:.7">${forn.linha}</div></div></div>`, forn.pe)}
    ${cartao('🤝 Patrocínio Master', `<div style="${OSW};font-weight:700;font-size:13px">${master}</div>`,
      'O Master que você já fechou aparece ESTAMPADO na camisa.')}
    <div style="border:3px solid ${INK};border-radius:13px;background:${GOLD};box-shadow:3px 3px 0 ${INK};padding:9px 10px">
      <div style="${OSW};font-weight:700;font-size:11.5px;text-transform:uppercase">📦 Vendeu na temporada</div>
      <div style="${OSW};font-weight:700;font-size:20px;margin-top:2px">${vendeu.n} camisas · <span style="color:${GREEN}">+${vendeu.m} 🪙</span></div>
      <div style="${OSW};font-weight:400;font-size:10px;opacity:.7;margin-top:2px">${vendeu.conta}</div>
    </div>
  </div>`

const html = `<style>${FONTES}body{margin:0;background:#E8DFC6;padding:16px;width:860px}</style>
  <div style="${OSW};font-weight:700;font-size:20px;text-transform:uppercase;color:${INK}">Loja do Clube · proposta</div>
  <div style="${OSW};font-weight:400;font-size:12px;color:${INK};opacity:.75;margin-bottom:12px">
    Molde da camisa: o do <b>Final Boss FC</b>. Escudo no peito esquerdo, fornecedor no peito direito, Master abaixo do peito.</div>
  <div style="display:flex;gap:14px;align-items:flex-start">
    ${tela({
      titulo: 'COM batismo', sub: 'Final Boss FC',
      shirt: camisa({
        arte: img('public/mantos-salao/finalboss-camisa.webp'), alt: 300,
        escudo: '', // a arte do batismo já traz o escudo dele — o jogo não carimba outro
        fornecedor: 'NAIQUE', master: 'VADICO VEÍCULOS', masterCor: INK,
        pos: { fornX: 30, fornY: 25, masterX: 50, masterY: 62 },
      }),
      extra: cartao('👑 A camisa do seu clube', `<div style="${OSW};font-weight:700;font-size:12.5px">Arte própria do batismo</div>`,
        'Clube batizado usa a arte que o dono mandou — é ela que aparece na loja. As 2 cores do manto saem dessa arte.'),
      forn: { nome: 'Naique Sports', emoji: '👟', cor: GREEN, linha: 'contrato de 3 temporadas · 5 🪙 por ano<br>+30% nas vendas da loja', pe: 'Marca grande só te procura na Série B pra cima.' },
      master: '🚗 Vadico Veículos <span style="font-weight:400;font-size:10px;opacity:.7">· ano 2 de 5</span>',
      vendeu: { n: 44, m: 88, conta: '34 de base na Série B × estádio cheio × Naique (+30%)' },
    })}
    ${tela({
      titulo: 'SEM batismo', sub: 'tier 🪵 FOI PROFISSIONAL',
      shirt: camisa({
        arte: img(`${SCRATCH}/camisa-foiprof.webp`), alt: 300,
        escudo: '', fornecedor: 'ADIBAS', master: 'ESPETINHO DO BAIXINHO', masterCor: '#5B5138',
        pos: { fornX: 69, fornY: 26, masterX: 50, masterY: 52 },
      }),
      extra: cartao('🪵 A camisa do seu clube', `<div style="${OSW};font-weight:700;font-size:12.5px">Molde do jogo, na cor do seu tier</div>`,
        'Mesmo molde, mesma qualidade de arte. É UM arquivo só pro jogo inteiro, pintado com as suas cores — aqui o bege do tier 🪵 Foi Profissional.'),
      forn: { nome: 'Adibas', emoji: '🔺', cor: '#0E3E86', linha: 'contrato de 2 temporadas · 3 🪙 por ano<br>+20% nas vendas da loja', pe: 'Subiu de série, marca melhor bate na porta.' },
      master: '🍗 Espetinho do Baixinho <span style="font-weight:400;font-size:10px;opacity:.7">· ano 1 de 2</span>',
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
