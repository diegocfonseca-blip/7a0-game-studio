// ─── 🏛️ ARTE DA SALA DA PRESIDÊNCIA (v2 · 03/09) ────────────────────────────
//
// O que o Diego fechou nesta rodada (palavras dele, resumidas):
//   · "não tem nada de Várzea/D/C/B/A — a pessoa vai comprando e melhorando
//     as coisas, só isso" → UMA sala; cada item comprado aparece no lugar dele.
//   · "tira esse diamante, não tem nada a ver" → não existe mais.
//   · "fora da janela seria a vista pro estádio" → a janela mostra o
//     StadiumSvg REAL do jogador (com as obras que ele fez), renderizado aqui
//     pelo mesmo componente do jogo.
//   · "o carro também não sei aonde apareceria" → na VAGA DO PRESIDENTE, que
//     fica na frente do estádio, vista pela mesma janela. Comprou, aparece.
//   · "analise a fundo como montar de forma que encaixe bem e dê pra ver os
//     itens de forma clara" → cada item tem um SLOT fixo na composição
//     (mapa abaixo). Nada se sobrepõe, nunca.
//
// MAPA DE SLOTS (canvas 1280×1100 · parede até y=640 · chão de 640 a 1100)
//   teto        lustre (ou lâmpada pelada, no começo)
//   parede esq  estante de troféus  36..376
//   parede meio manto emoldurado    412..612 (acima da poltrona)
//   parede dir  JANELA              660..1244 → estádio ao fundo + vaga na frente
//   centro      mesa 250..830 + poltrona atrás; o ESCUDO vai na frente da mesa
//   chão esq    mascote no pedestal 60..220
//   chão dir    aquário 900..1120 (sob a janela) · planta 1150..1250
//   frente dir  carrinho de champanhe 1000..1180
//   sob a mesa  tapete
//
// A arte sai em PNG/webp (o que vai pro jogo é o .webp). O desenho do estádio
// dentro da janela é o componente real, então ele muda junto com o estádio da
// pessoa — de graça.
//
// uso: node scripts/arte-presidencia.mjs [--pasta /tmp/arte-presid]
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs'
import { chromium } from 'playwright-core'
import { createServer } from 'vite'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

const OUT = (i => i > 0 ? process.argv[i + 1] : '/tmp/arte-presid')(process.argv.indexOf('--pasta')); mkdirSync(OUT, { recursive: true })
const REPO = process.cwd()
const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D', CREME = '#F4ECD6'
const W = 1280, H = 1100, PY = 640

// ── o estádio REAL do jogo, pela janela ─────────────────────────────────────
async function motorEstadio() {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent', optimizeDeps: { noDiscovery: true, include: [] } })
  const mod = await server.ssrLoadModule('/src/escalacao/estadio.tsx')
  const dados = await server.ssrLoadModule('/src/escalacao/estadiodata.ts')
  const apoio = await server.ssrLoadModule('/src/escalacao/apoio.tsx')
  return {
    // o MAPA (o desenho de gestão que já existe no jogo) — pra folha de comparação
    mapa: (st, tier = 'bege') => renderToStaticMarkup(React.createElement(mod.StadiumSvg, { st, perkOverride: apoio.APOIO_PERKS[tier] })),
    pct: (st, k) => dados.sectorPct(st, k),
    tem: (st, k) => dados.hasExtra(st, k),
    cores: tier => apoio.APOIO_PERKS[tier].svgFull,
    fechar: () => server.close(),
  }
}

// ── ferramentas de ilustração ───────────────────────────────────────────────
const grad = (id, stops, x1 = 0, y1 = 0, x2 = 0, y2 = 1) =>
  `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</linearGradient>`
const pousa = (cx, cy, rx, op = 0.32) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${rx * 0.16}" fill="#000" opacity="${op}" filter="url(#borrao)"/>`
const veio = (x, y, w, h, n = 7, cor = 'rgba(0,0,0,.15)') => {
  let o = ''
  for (let i = 0; i < n; i++) {
    const yy = y + (h / (n + 1)) * (i + 1) + (i % 3) * 2
    o += `<path d="M${x} ${yy} q${w * 0.3} ${i % 2 ? -3 : 3} ${w * 0.55} 0 t${w * 0.45} 0" fill="none" stroke="${cor}" stroke-width="${1.4 + (i % 2) * 0.7}"/>`
  }
  return o
}
const taca = (x, y, s = 1) => `<g transform="translate(${x},${y}) scale(${s})">
  <ellipse cx="0" cy="30" rx="15" ry="4" fill="#000" opacity=".28"/>
  <rect x="-13" y="22" width="26" height="7" rx="3" fill="url(#ouroG)" stroke="${INK}" stroke-width="2.6"/>
  <rect x="-4" y="10" width="8" height="13" fill="url(#ouroG)" stroke="${INK}" stroke-width="2.6"/>
  <path d="M-15 -20 h30 v9 a15 17 0 0 1 -30 0 z" fill="url(#ouroG)" stroke="${INK}" stroke-width="2.8"/>
  <path d="M-15 -15 h-9 a9 9 0 0 0 9 11 M15 -15 h9 a9 9 0 0 1 -9 11" fill="none" stroke="${INK}" stroke-width="2.6"/>
  <path d="M-8 -16 v6 a7 8 0 0 0 5 8" fill="none" stroke="#FFF3C4" stroke-width="3" stroke-linecap="round" opacity=".9"/>
</g>`
// escudo do clube (no jogo vem do escudoDe(); aqui um genérico verde)
const escudo = (x, y, s = 1) => `<g transform="translate(${x},${y}) scale(${s})">
  <path d="M0 -60 L54 -42 V14 C54 50 30 70 0 82 C-30 70 -54 50 -54 14 V-42 Z" fill="#000" opacity=".22" transform="translate(5,7)" filter="url(#borraoP)"/>
  <path d="M0 -60 L54 -42 V14 C54 50 30 70 0 82 C-30 70 -54 50 -54 14 V-42 Z" fill="${GREEN}" stroke="${INK}" stroke-width="6"/>
  <path d="M0 -44 L38 -31 V13 C38 38 20 54 0 64 Z" fill="#12572A"/>
  <path d="M0 -60 L54 -42 V-24 C34 -33 18 -38 0 -42 Z" fill="#fff" opacity=".16"/>
  <text x="0" y="30" text-anchor="middle" font-family="Georgia,serif" font-size="58" font-weight="bold" fill="#fff">T</text>
</g>`
// carro de perfil, na vaga
const carro = (x, y, s, cor, tipo = 'sport') => {
  const teto = tipo === 'fusca' ? 'M34 36 C42 4 94 4 102 36 Z' : tipo === 'sport' ? 'M26 36 L54 12 h50 l26 24 Z' : 'M30 36 L46 10 h50 l16 26 Z'
  return `<g transform="translate(${x},${y}) scale(${s})">
    <ellipse cx="70" cy="82" rx="76" ry="9" fill="#000" opacity=".35"/>
    <path d="${teto}" fill="#9FD3EC" stroke="${INK}" stroke-width="4"/>
    <path d="M40 34 L58 16 h42 l18 18 Z" fill="#fff" opacity=".35"/>
    <path d="M6 36 h124 a12 12 0 0 1 12 12 v18 a7 7 0 0 1 -7 7 h-134 a7 7 0 0 1 -7 -7 v-18 a12 12 0 0 1 12 -12 z" fill="${cor}" stroke="${INK}" stroke-width="4.5"/>
    <path d="M10 40 h116 a6 6 0 0 1 6 6 v4 h-128 v-4 a6 6 0 0 1 6 -6 z" fill="#fff" opacity=".18"/>
    <circle cx="36" cy="72" r="15" fill="#22201C" stroke="${INK}" stroke-width="4"/><circle cx="36" cy="72" r="6" fill="#D8D8D8"/>
    <circle cx="106" cy="72" r="15" fill="#22201C" stroke="${INK}" stroke-width="4"/><circle cx="106" cy="72" r="6" fill="#D8D8D8"/>
    <rect x="128" y="46" width="12" height="9" rx="3" fill="${GOLD}" stroke="${INK}" stroke-width="2.5"/>
    <rect x="2" y="46" width="10" height="9" rx="3" fill="#E8503A" stroke="${INK}" stroke-width="2.5"/>
  </g>`
}


// ── A VISTA PELA JANELA: estádio de noite, em perspectiva, SEM contorno ───────
// Dentro da janela nada leva traço preto: é luz, sombra, brilho e névoa. É o
// contraste com a sala (que tem o traço da casa) que faz parecer uma vista de
// verdade e não um desenho colado. O carro é visto de trás, em ângulo.
const lerp = (a, b, t) => { const h = x => [parseInt(x.slice(1, 3), 16), parseInt(x.slice(3, 5), 16), parseInt(x.slice(5, 7), 16)]; const A = h(a), B = h(b); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',')})` }
// E = { st, pct, tem, cores } — o MESMO dado do estádio do jogador
// ═══ A VISTA v3: estádio VISTO DE FRENTE (fachada), como quem olha da janela ═══
// Nada de tigela vista de cima. É a fachada: asas laterais, setor central em
// dois andares, pilares, teto, mastros de luz. Cada bloco é um SETOR do jogo e
// cresce com o % dele. Tudo desenhado num sistema local 560×486 e encaixado na
// janela com um <svg> aninhado — assim a composição é sempre a mesma.
const vistaJanela = (jx, jy, jw, jh, temCarro, _grande, E) => {
  const { st, pct, tem, cores } = E
  const noite = tem(st, 'refl'), cober = tem(st, 'cober'), telao = tem(st, 'telao'), loja = tem(st, 'loja'), estac = tem(st, 'estac'), hotel = tem(st, 'hotel')
  const g = pct(st, 'grama') / 100
  const P = { geral: pct(st, 'geral') / 100, cadeiras: pct(st, 'cadeiras') / 100, visitante: pct(st, 'visitante') / 100, camarote: pct(st, 'camarote') / 100 }
  const [c0, c1] = cores
  const BASE = 330                                    // linha do chão do estádio
  // um bloco da FACHADA. De fora se vê CONCRETO; a cor do tier só aparece onde
  // as cadeiras aparecem de verdade: pelos ARCOS abertos do andar de baixo e
  // nas últimas fileiras do anel de cima, que despontam acima do muro.
  const bloco = (x, w, hFull, f, opts = {}, BASE = 330) => {
    if (f <= 0) return `<path d="M${x} ${BASE} q${w / 2} -${hFull * 0.22} ${w} 0 z" fill="#6B5637"/><path d="M${x + 6} ${BASE} q${w / 2 - 6} -${hFull * 0.16} ${w - 12} 0 z" fill="#7E6743" opacity=".8"/>`
    const h = hFull * Math.max(0.18, f), top = BASE - h, pronto = f >= 1
    const asa = opts.asa // 'L' | 'R' — a asa foge em perspectiva: a borda de fora é mais baixa
    const corpo = asa === 'L' ? `M${x} ${top + h * 0.22} L${x + w} ${top} L${x + w} ${BASE} L${x} ${BASE} Z`
      : asa === 'R' ? `M${x} ${top} L${x + w} ${top + h * 0.22} L${x + w} ${BASE} L${x} ${BASE} Z`
      : `M${x} ${top} L${x + w} ${top} L${x + w} ${BASE} L${x} ${BASE} Z`
    // arcos abertos: dentro, as cadeiras na cor do tier (fileiras) com brilho à noite
    const nArc = Math.max(2, Math.floor(w / 34)), aw = (w - 12) / nArc
    const arcos = opts.arcos ? Array.from({ length: nArc }).map((_, i) => {
      const ax = x + 6 + i * aw + 4, aW = aw - 8, aT = BASE - Math.min(h - 8, 34), r = aW / 2
      const dentro = pronto ? `url(#tierV)` : '#8a8266'
      return `<path d="M${ax} ${BASE - 2} V${aT + r} A${r} ${r} 0 0 1 ${ax + aW} ${aT + r} V${BASE - 2} Z" fill="#0E1218"/>
        <path d="M${ax + 2} ${BASE - 2} V${aT + r} A${r - 2} ${r - 2} 0 0 1 ${ax + aW - 2} ${aT + r} V${BASE - 2} Z" fill="${dentro}" opacity=".9"/>
        ${[0, 1, 2].map(k => `<line x1="${ax + 3}" y1="${BASE - 8 - k * 7}" x2="${ax + aW - 3}" y2="${BASE - 8 - k * 7}" stroke="#000" stroke-width="1.6" opacity=".28"/>`).join('')}
        ${noite ? `<path d="M${ax + 2} ${BASE - 2} V${aT + r} A${r - 2} ${r - 2} 0 0 1 ${ax + aW - 2} ${aT + r} V${BASE - 2} Z" fill="url(#bloomQ)" opacity=".55"/>` : ''}`
    }).join('') : ''
    // as últimas fileiras do anel, despontando acima do muro (só setor pronto)
    const topoAssentos = opts.topo && pronto ? `<rect x="${x + 6}" y="${top - 16}" width="${w - 12}" height="16" fill="url(#tierV)"/>
      ${[0, 1].map(k => `<line x1="${x + 8}" y1="${top - 12 + k * 7}" x2="${x + w - 8}" y2="${top - 12 + k * 7}" stroke="#000" stroke-width="1.6" opacity=".3"/>`).join('')}
      ${noite ? `<rect x="${x + 6}" y="${top - 16}" width="${w - 12}" height="16" fill="url(#bloomQ)" opacity=".45"/>` : ''}` : ''
    // juntas de dilatação e faixa clara no topo do muro (concreto de verdade tem isso)
    const juntas = Array.from({ length: Math.max(1, Math.floor(w / 46)) }).map((_, i) => `<line x1="${x + 23 + i * 46}" y1="${top + 6}" x2="${x + 23 + i * 46}" y2="${BASE - 2}" stroke="#000" stroke-width="1.2" opacity=".14"/>`).join('')
    return `${topoAssentos}<path d="${corpo}" fill="${pronto ? 'url(#concreto)' : 'url(#obra)'}"/>
      <path d="${corpo}" fill="#000" opacity="${asa ? .12 : 0}"/>
      ${juntas}
      <rect x="${x}" y="${top}" width="${w}" height="4" fill="#fff" opacity="${asa ? .12 : .22}"/>
      ${arcos}
      ${opts.vidro ? `<rect x="${x + 8}" y="${top + 10}" width="${w - 16}" height="${h * 0.22}" rx="2" fill="url(#vidroCam)" opacity=".92"/><rect x="${x + 8}" y="${top + 10}" width="${w - 16}" height="4" fill="#fff" opacity=".35"/>` : ''}
      ${opts.decal || ''}`
  }
  // 🛡️ escudo grande na asa esquerda · 🐯 mascote na asa direita (se o clube tem)
  const decalEscudo = (x, w, top, h) => `<g transform="translate(${x + w / 2},${top + h * 0.5}) scale(${Math.min(w / 130, h / 130) * 0.9})">
    <path d="M0 -60 L54 -42 V14 C54 50 30 70 0 82 C-30 70 -54 50 -54 14 V-42 Z" fill="#000" opacity=".25" transform="translate(3,4)"/>
    <path d="M0 -60 L54 -42 V14 C54 50 30 70 0 82 C-30 70 -54 50 -54 14 V-42 Z" fill="${GREEN}" stroke="#F4ECD6" stroke-width="4"/>
    <path d="M0 -44 L38 -31 V13 C38 38 20 54 0 64 Z" fill="#12572A"/>
    <text x="0" y="30" text-anchor="middle" font-family="Georgia,serif" font-size="58" font-weight="bold" fill="#fff">T</text>
    ${noite ? `<circle cx="0" cy="10" r="90" fill="url(#bloomQ)" opacity=".35"/>` : ''}</g>`
  const decalMascote = (x, w, top, h) => `<g transform="translate(${x + w / 2},${top + h * 0.5})">
    <rect x="${-w * 0.42}" y="${-h * 0.5}" width="${w * 0.84}" height="${h}" rx="6" fill="#F4ECD6" opacity=".95"/>
    <rect x="${-w * 0.42}" y="${-h * 0.5}" width="${w * 0.84}" height="5" fill="${GOLD}"/><rect x="${-w * 0.42}" y="${h * 0.5 - 5}" width="${w * 0.84}" height="5" fill="${GOLD}"/>
    <text x="0" y="${h * 0.3}" text-anchor="middle" font-size="${h * 0.82}">🐯</text>
    ${noite ? `<rect x="${-w * 0.42}" y="${-h * 0.5}" width="${w * 0.84}" height="${h}" fill="url(#bloomQ)" opacity=".3"/>` : ''}</g>`
  const hAsa = f => f > 0 ? 120 * Math.max(0.18, f) : 0
  const hCentro = (P.geral > 0 ? 70 * Math.max(0.18, P.geral) : 0) + (P.geral > 0 && P.cadeiras > 0 ? 80 * Math.max(0.18, P.cadeiras) : 0)
  const topoFachada = BASE - Math.max(hAsa(P.visitante), hAsa(P.camarote), hCentro, 8)
  const roofY = topoFachada - 6
  const mastro = (x, sc = 1) => `
    <line x1="${x}" y1="${44}" x2="${x}" y2="${BASE}" stroke="${noite ? '#8B93A3' : '#6B7280'}" stroke-width="${3 * sc}" opacity=".9"/>
    <line x1="${x - 5}" y1="${60}" x2="${x - 5}" y2="${BASE}" stroke="${noite ? '#6B7280' : '#4F5866'}" stroke-width="1.5" opacity=".7"/>
    <rect x="${x - 15}" y="${34}" width="30" height="12" rx="2" fill="${noite ? '#E9EEF5' : '#9AA0AC'}"/>
    ${noite ? `<circle cx="${x}" cy="40" r="34" fill="url(#bloom)"/><circle cx="${x}" cy="40" r="8" fill="#FFF7D6"/><path d="M${x} 46 L${x - 70} ${BASE} L${x + 70} ${BASE} Z" fill="url(#cone)" opacity=".5"/>` : ''}`
  return `<svg x="${jx}" y="${jy}" width="${jw}" height="${jh}" viewBox="0 0 560 486" preserveAspectRatio="none">
  <defs>
    ${grad('tierV', [[0, c0], [1, c1]])}
    ${grad('concreto', [[0, '#C9C6BE'], [0.5, '#A9A59B'], [1, '#7E7B72']])}
    ${grad('obra', [[0, '#B8AE98'], [1, '#8A8266']])}
    ${grad('vidroCam', [[0, '#9CC8E8'], [0.5, '#4E86B4'], [1, '#26496B']])}
    ${grad('teto', [[0, '#DADCE0'], [0.35, '#9BA1AB'], [1, '#5F6670']])}
    ${grad('ceuTarde', [[0, '#5B7FB0'], [0.5, '#9FB7D3'], [0.85, '#E9C9A0'], [1, '#C9A97E']])}
    ${grad('carroFrente', [[0, '#3A3F48'], [0.4, '#181B21'], [1, '#0A0C10']])}
    ${grad('paraBrisa', [[0, '#A9D3EE'], [1, '#2F4E6E']])}
  </defs>
  <rect width="560" height="486" fill="${noite ? 'url(#ceuV)' : 'url(#ceuTarde)'}"/>
  ${noite ? [[40, 30], [120, 18], [210, 52], [300, 14], [390, 40], [470, 22], [520, 66], [250, 80]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.6" fill="#fff" opacity=".7"/>`).join('') : `<circle cx="96" cy="70" r="22" fill="#FFF3D0" opacity=".9"/><circle cx="96" cy="70" r="64" fill="url(#bloomQ)" opacity=".7"/>`}
  <!-- cidade ao fundo, silhueta -->
  <g opacity="${noite ? .9 : .55}">${[[0, 34, 140], [40, 26, 190], [72, 30, 120], [108, 22, 160], [440, 28, 150], [474, 34, 200], [514, 24, 130], [544, 20, 170]].map(([x, w, h]) => `<rect x="${x}" y="${BASE - h}" width="${w}" height="${h}" fill="${noite ? '#141C2E' : '#6E7C95'}"/>`).join('')}
  ${noite ? [[8, 60], [14, 96], [50, 120], [56, 80], [80, 70], [118, 100], [448, 90], [484, 130], [490, 70], [520, 84], [550, 110]].map(([x, y]) => `<rect x="${x}" y="${BASE - y}" width="3" height="4" fill="#FFD98A" opacity=".8"/>`).join('') : ''}</g>
  <!-- 🏨 hotel do clube (torre à esquerda, atrás da asa) -->
  ${hotel ? `<g><rect x="2" y="${BASE - 200}" width="46" height="200" fill="${noite ? '#2A3448' : '#B8C2D2'}"/><rect x="2" y="${BASE - 206}" width="46" height="8" fill="${GOLD}"/>
    ${Array.from({ length: 8 }).map((_, r) => [8, 20, 32].map(o => `<rect x="${o}" y="${BASE - 190 + r * 22}" width="8" height="10" fill="${noite ? '#FFE0A0' : '#E9EEF5'}" opacity=".9"/>`).join('')).join('')}</g>` : ''}
  <!-- névoa de luz do estádio -->
  ${noite ? `<ellipse cx="280" cy="${roofY}" rx="300" ry="120" fill="url(#nevoa)"/>` : ''}
  <!-- mastros de luz (atrás da fachada) -->
  ${mastro(86)}${mastro(210, 0.9)}${mastro(350, 0.9)}${mastro(474)}
  <!-- A FACHADA: asa esquerda (Visitante) · centro (Geral embaixo, Cadeiras em cima) · asa direita (Camarote) -->
  ${bloco(40, 130, 120, P.visitante, { asa: 'L', arcos: true, decal: P.visitante >= 1 ? decalEscudo(40, 130, BASE - 120, 120 - 40) : '' })}
  ${bloco(390, 130, 120, P.camarote, { asa: 'R', vidro: true, decal: P.camarote >= 1 && E.mascote ? decalMascote(390, 130, BASE - 120 + 120 * 0.36, 120 * 0.36) : '' })}
  ${bloco(170, 220, 70, P.geral, { arcos: true })}
  ${P.geral > 0 ? bloco(182, 196, 80, P.cadeiras, { topo: true }, BASE - 70 * Math.max(0.18, P.geral)) : ''}
  <!-- portão central: dá pra ver o gramado (terra → verde pelo % do gramado) -->
  <rect x="262" y="${BASE - 30}" width="36" height="30" rx="3" fill="${lerp('#7B5B3A', noite ? '#2E9048' : '#3FA85A', g)}"/>
  ${noite && g > 0.3 ? `<rect x="262" y="${BASE - 30}" width="36" height="30" fill="url(#bloomQ)" opacity=".5"/>` : ''}
  <rect x="262" y="${BASE - 30}" width="36" height="30" rx="3" fill="none" stroke="#0E1218" stroke-width="3"/>
  <!-- ☂️ cobertura: laje em balanço sobre o que está pronto -->
  ${cober ? `<g><rect x="34" y="${roofY - 14}" width="492" height="14" rx="3" fill="url(#teto)"/><rect x="34" y="${roofY - 14}" width="492" height="3" fill="#fff" opacity=".5"/><rect x="34" y="${roofY - 2}" width="492" height="5" fill="#3A4048"/>
    ${[[105, hAsa(P.visitante)], [455, hAsa(P.camarote)], [200, hCentro], [280, hCentro], [360, hCentro]].map(([x, h]) => `<line x1="${x}" y1="${roofY}" x2="${x}" y2="${BASE - h}" stroke="#5F6670" stroke-width="5"/>`).join('')}
    ${noite ? `<rect x="30" y="${roofY}" width="500" height="10" fill="url(#bloomQ)" opacity=".35"/>` : ''}</g>` : ''}
  <!-- 📺 telão no alto do centro -->
  ${telao ? `<g><line x1="270" y1="${roofY - 14}" x2="270" y2="${roofY - 44}" stroke="#6B7280" stroke-width="4"/><line x1="290" y1="${roofY - 14}" x2="290" y2="${roofY - 44}" stroke="#6B7280" stroke-width="4"/>
    <rect x="232" y="${roofY - 96}" width="96" height="54" rx="4" fill="#0C0C0C"/><rect x="238" y="${roofY - 90}" width="84" height="42" fill="#0F1A2A"/>
    <text x="280" y="${roofY - 60}" text-anchor="middle" font-family="Oswald,sans-serif" font-weight="700" font-size="24" fill="#37D067">1×0</text>
    ${noite ? `<rect x="238" y="${roofY - 90}" width="84" height="42" fill="url(#bloomQ)" opacity=".45"/>` : ''}</g>` : ''}
  <!-- 🛍️ loja do clube, na base -->
  ${loja ? `<g><rect x="446" y="${BASE - 28}" width="72" height="28" rx="2" fill="${noite ? '#F4ECD6' : '#FFFDF5'}"/>${[0, 1, 2, 3].map(i => `<rect x="${446 + i * 18}" y="${BASE - 35}" width="18" height="8" fill="${i % 2 ? GOLD : GREEN}"/>`).join('')}
    <text x="482" y="${BASE - 9}" text-anchor="middle" font-family="Oswald,sans-serif" font-weight="700" font-size="13" fill="${INK}">LOJA</text>${noite ? `<rect x="446" y="${BASE - 28}" width="72" height="28" fill="url(#bloomQ)" opacity=".4"/>` : ''}</g>` : ''}
  <!-- 🅿️ o estacionamento na frente (asfalto se tem a obra; barro se não) -->
  <rect x="0" y="${BASE}" width="560" height="${486 - BASE}" fill="${estac ? 'url(#asfaltoV)' : '#6E5A3C'}"/>
  <rect x="0" y="${BASE - 4}" width="560" height="6" fill="${estac ? '#5B6270' : '#8A7355'}"/>
  ${estac ? `<g opacity=".85" stroke="#E8E1C8" stroke-width="3" fill="none"><path d="M182 486 L226 ${BASE + 8}"/><path d="M378 486 L334 ${BASE + 8}"/><path d="M60 486 L150 ${BASE + 8}"/><path d="M500 486 L410 ${BASE + 8}"/></g>
    <text x="280" y="470" text-anchor="middle" font-family="Georgia,serif" font-size="14" font-weight="bold" fill="#E8E1C8" opacity=".75" letter-spacing="3">PRESIDENTE</text>`
    : `<g opacity=".5" fill="#4E3E28"><ellipse cx="110" cy="420" rx="34" ry="12"/><ellipse cx="420" cy="452" rx="30" ry="10"/><ellipse cx="470" cy="392" rx="22" ry="8"/></g>`}
  ${noite ? `<line x1="500" y1="${BASE - 70}" x2="500" y2="${BASE + 40}" stroke="#9AA0AC" stroke-width="3"/><circle cx="500" cy="${BASE - 72}" r="26" fill="url(#bloomQ)"/><circle cx="500" cy="${BASE - 72}" r="5" fill="#FFF1C9"/><ellipse cx="490" cy="${BASE + 44}" rx="70" ry="16" fill="url(#pocaLuz)"/>` : ''}
  ${temCarro ? carroFrente(280, 396, 1, noite) : ''}
  <!-- reflexo do vidro -->
  <path d="M34 0 L112 0 L12 243 L0 165 Z" fill="#fff" opacity=".07"/><path d="M146 0 L174 0 L45 486 L17 486 Z" fill="#fff" opacity=".045"/>
</svg>`
}
// carro VISTO DE FRENTE (virado pro escritório): faróis acesos, capô com reflexo
const carroFrente = (x, y, s, noite) => `<g transform="translate(${x},${y}) scale(${s})">
  <ellipse cx="0" cy="74" rx="96" ry="14" fill="#000" opacity=".5" filter="url(#borraoP)"/>
  <path d="M-84 66 L-80 26 Q-78 12 -64 10 L64 10 Q78 12 80 26 L84 66 Q84 72 78 72 L-78 72 Q-84 72 -84 66 Z" fill="url(#carroFrente)"/>
  <path d="M-60 10 L-48 -30 Q-44 -38 -34 -38 L34 -38 Q44 -38 48 -30 L60 10 Z" fill="url(#carroTeto)"/>
  <path d="M-48 8 L-40 -26 L40 -26 L48 8 Z" fill="url(#paraBrisa)"/>
  <path d="M-44 6 L-38 -22 L-14 -22 L-22 6 Z" fill="#fff" opacity=".22"/>
  <path d="M-70 30 Q0 22 70 30 L72 40 Q0 32 -72 40 Z" fill="#fff" opacity=".14"/>
  <rect x="-30" y="42" width="60" height="16" rx="3" fill="#0B0D11"/>${[-22, -12, -2, 8, 18].map(gx => `<rect x="${gx}" y="45" width="4" height="10" fill="#2A2F38"/>`).join('')}
  <path d="M-76 34 h34 l6 12 h-38 z" fill="#FFF6D8"/><path d="M76 34 h-34 l-6 12 h38 z" fill="#FFF6D8"/>
  ${noite ? `<ellipse cx="-58" cy="41" rx="40" ry="18" fill="#FFF3C4" opacity=".55" filter="url(#borraoP)"/><ellipse cx="58" cy="41" rx="40" ry="18" fill="#FFF3C4" opacity=".55" filter="url(#borraoP)"/>
  <path d="M-76 46 L-150 120 L-30 120 Z" fill="#FFF3C4" opacity=".18"/><path d="M76 46 L150 120 L30 120 Z" fill="#FFF3C4" opacity=".18"/>` : ''}
  <rect x="-80" y="60" width="160" height="8" rx="3" fill="#0E1116"/>
  <rect x="-26" y="62" width="52" height="10" rx="2" fill="#EDEDED" opacity=".9"/>
  <rect x="-88" y="52" width="16" height="22" rx="3" fill="#15181D"/><rect x="72" y="52" width="16" height="22" rx="3" fill="#15181D"/>
</g>`
// carro visto de trás, em ângulo, com reflexo e lanterna acesa — sem contorno
const carroTras = (x, y, s) => `<g transform="translate(${x},${y}) scale(${s})">
  <ellipse cx="0" cy="44" rx="86" ry="14" fill="#000" opacity=".5" filter="url(#borraoP)"/>
  <path d="M-74 40 L-70 2 Q-66 -14 -50 -16 L50 -16 Q66 -14 70 2 L74 40 Q74 46 68 46 L-68 46 Q-74 46 -74 40 Z" fill="url(#carroCorpo)"/>
  <path d="M-52 -16 L-42 -50 Q-38 -58 -28 -58 L28 -58 Q38 -58 42 -50 L52 -16 Z" fill="url(#carroTeto)"/>
  <path d="M-40 -18 L-33 -46 L33 -46 L40 -18 Z" fill="url(#vidroTras)"/>
  <path d="M-36 -20 L-31 -42 L-10 -42 L-16 -20 Z" fill="#fff" opacity=".18"/>
  <rect x="-70" y="4" width="140" height="4" fill="#fff" opacity=".12"/>
  <rect x="-64" y="12" width="30" height="10" rx="4" fill="#FF4A3A"/><rect x="34" y="12" width="30" height="10" rx="4" fill="#FF4A3A"/>
  <ellipse cx="-49" cy="17" rx="26" ry="12" fill="#FF3B2A" opacity=".45" filter="url(#borraoP)"/><ellipse cx="49" cy="17" rx="26" ry="12" fill="#FF3B2A" opacity=".45" filter="url(#borraoP)"/>
  <rect x="-22" y="14" width="44" height="14" rx="3" fill="#EDEDED" opacity=".85"/>
  <rect x="-66" y="34" width="132" height="8" rx="3" fill="#0E1116"/>
  <rect x="-72" y="30" width="16" height="18" rx="3" fill="#15181D"/><rect x="56" y="30" width="16" height="18" rx="3" fill="#15181D"/>
</g>`

// ── A SALA ──────────────────────────────────────────────────────────────────
// `tem` = conjunto de itens comprados. Tudo que não está no conjunto mostra a
// versão "de fábrica" (ou nada). Itens: piso parede lustre mesa poltrona
// tapete janela estante manto mascote aquario bar planta carro
const sala = (tem, E) => {
  const T = k => tem.has(k)
  const parA = T('parede') ? '#F1E8CE' : '#D3C8AC', parB = T('parede') ? '#DED0AC' : '#B7AB8E'
  return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
<defs>
  ${grad('parede', [[0, parA], [0.6, parA], [1, parB]])}
  ${grad('chao', [[0, '#8A5730'], [1, '#5A3418']])}
  ${grad('concreto', [[0, '#A9A296'], [1, '#7E786D']])}
  ${grad('ouroG', [[0, '#FFE9A0'], [0.42, GOLD], [1, '#C89400']])}
  ${grad('mad', [[0, '#A06B33'], [0.5, '#8B5A2B'], [1, '#5A3517']], 0, 0, 0.25, 1)}
  ${grad('madTopo', [[0, '#B87C41'], [1, '#8B5A2B']])}
  ${grad('couro', [[0, '#6A4520'], [0.45, '#4A2E13'], [1, '#2E1A08']])}
  ${grad('vidro', [[0, 'rgba(255,255,255,.55)'], [0.35, 'rgba(190,232,255,.22)'], [1, 'rgba(140,200,235,.12)']])}
  ${grad('ceu', [[0, '#0F1A32'], [0.5, '#1E3350'], [1, '#3A5A7A']])}
  ${grad('asfalto', [[0, '#4A4F58'], [1, '#2E323A']])}
  ${grad('tap', [[0, '#7A2320'], [0.5, '#A83F36'], [1, '#7A2320']], 0, 0, 1, 0)}
  ${grad('ceuV', [[0, '#070C1A'], [0.45, '#0F1A33'], [0.8, '#2A3550'], [1, '#4A4A5A']])}
  ${grad('arqui', [[0, '#6B7488'], [0.5, '#4A5265'], [1, '#2E3546']])}
  ${grad('gramado', [[0, '#3FB25C'], [0.6, '#2E9048'], [1, '#1F6D36']])}
  ${grad('asfaltoV', [[0, '#3A3F4A'], [1, '#1C1F26']])}
  ${grad('carroCorpo', [[0, '#3A3F48'], [0.35, '#15181E'], [1, '#0A0C10']])}
  ${grad('carroTeto', [[0, '#4C525C'], [1, '#1A1E25']])}
  ${grad('vidroTras', [[0, '#8FB6D6'], [1, '#2B4460']])}
  ${grad('cone', [[0, 'rgba(255,241,201,.55)'], [1, 'rgba(255,241,201,0)']])}
  <radialGradient id="bloom" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FFF7D6" stop-opacity=".95"/><stop offset="0.35" stop-color="#FFE8A8" stop-opacity=".5"/><stop offset="1" stop-color="#FFE8A8" stop-opacity="0"/></radialGradient>
  <radialGradient id="bloomQ" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FFE9B8" stop-opacity=".9"/><stop offset="1" stop-color="#FFE9B8" stop-opacity="0"/></radialGradient>
  <radialGradient id="nevoa" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FFE7B0" stop-opacity=".22"/><stop offset="1" stop-color="#FFE7B0" stop-opacity="0"/></radialGradient>
  <radialGradient id="pocaLuz" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FFE7B0" stop-opacity=".35"/><stop offset="1" stop-color="#FFE7B0" stop-opacity="0"/></radialGradient>
  <radialGradient id="halo" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FFF3C4" stop-opacity=".85"/><stop offset="1" stop-color="#FFF3C4" stop-opacity="0"/></radialGradient>
  <radialGradient id="vinheta" cx="50%" cy="46%" r="72%"><stop offset="0.55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".24"/></radialGradient>
  <filter id="borrao" x="-60%" y="-160%" width="220%" height="420%"><feGaussianBlur stdDeviation="11"/></filter>
  <filter id="borraoP" x="-60%" y="-160%" width="220%" height="420%"><feGaussianBlur stdDeviation="5"/></filter>
  <filter id="graos"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3"/><feColorMatrix type="saturate" values="0"/></filter>
  <pattern id="tabuas" x="0" y="0" width="96" height="${H}" patternUnits="userSpaceOnUse"><rect width="96" height="${H}" fill="url(#chao)"/><rect x="93" width="3" height="${H}" fill="#000" opacity=".22"/></pattern>
  <clipPath id="jan"><rect x="672" y="102" width="560" height="486" rx="6"/></clipPath>
</defs>

<!-- ═══ PAREDE ═══ -->
<rect width="${W}" height="${PY}" fill="url(#parede)"/>
${T('parede')
      ? `<g><rect y="486" width="${W}" height="154" fill="#DCCFA9"/><rect y="478" width="${W}" height="12" fill="#C6B78E"/><rect y="472" width="${W}" height="7" fill="#B0A177"/>
       ${[30, 250, 470, 690, 910, 1130].map(x => `<rect x="${x}" y="504" width="160" height="112" rx="4" fill="none" stroke="#B0A177" stroke-width="5" opacity=".7"/>`).join('')}</g>`
      : `<g opacity=".45"><ellipse cx="560" cy="150" rx="120" ry="80" fill="#B5A98C"/><ellipse cx="200" cy="540" rx="90" ry="54" fill="#B5A98C"/>
       <path d="M150 90 q34 78 -12 152" fill="none" stroke="#9C9077" stroke-width="6" stroke-linecap="round"/></g>`}

<!-- ═══ RODAPÉ + CHÃO ═══ -->
<rect y="${PY - 30}" width="${W}" height="30" fill="${T('piso') ? '#5A3517' : '#8C867A'}"/>
<rect y="${PY - 37}" width="${W}" height="9" fill="${T('piso') ? '#9A7A3F' : '#A29B8D'}"/>
${T('piso')
      ? `<g><rect y="${PY}" width="${W}" height="${H - PY}" fill="url(#tabuas)"/>${veio(0, PY, W, H - PY, 10, 'rgba(0,0,0,.12)')}<rect y="${PY}" width="${W}" height="44" fill="#fff" opacity=".06"/></g>`
      : `<rect y="${PY}" width="${W}" height="${H - PY}" fill="url(#concreto)"/>
       <g opacity=".5" stroke="#6E685E" stroke-width="6" fill="none" stroke-linecap="round"><path d="M60 720 L230 790 L180 920"/><path d="M620 700 L780 780 L720 880 L840 990"/><path d="M1000 760 L1140 830 L1100 950"/></g>`}

<!-- ═══ LUZ ═══ -->
${T('lustre')
      ? `<g><ellipse cx="540" cy="170" rx="280" ry="150" fill="url(#halo)" opacity=".5"/>
       <line x1="540" y1="0" x2="540" y2="34" stroke="#2E1A08" stroke-width="9"/>
       <path d="M436 64 h208 l-40 58 h-128 z" fill="url(#ouroG)" stroke="${INK}" stroke-width="9"/>
       <path d="M454 74 h172 l-14 20 h-144 z" fill="#fff" opacity=".3"/>
       ${[494, 540, 586].map(x => `<g><line x1="${x}" y1="122" x2="${x}" y2="140" stroke="#2E1A08" stroke-width="7"/><circle cx="${x}" cy="156" r="19" fill="#FFF3C4" stroke="${INK}" stroke-width="7"/><circle cx="${x}" cy="156" r="46" fill="url(#halo)" opacity=".7"/></g>`).join('')}</g>`
      : `<g><line x1="540" y1="0" x2="540" y2="96" stroke="#2A2A2A" stroke-width="7"/>
       <ellipse cx="540" cy="150" rx="150" ry="120" fill="url(#halo)" opacity=".5"/>
       <rect x="526" y="94" width="28" height="18" rx="4" fill="#9A9384" stroke="${INK}" stroke-width="6"/>
       <circle cx="540" cy="134" r="30" fill="#F6E7A8" stroke="${INK}" stroke-width="7"/></g>`}

<!-- ═══ JANELA: o SEU estádio ao fundo, a SUA vaga na frente ═══ -->
${(() => {
      const g = true // a janela grande é de fábrica: sala crua tem a mesma janela (Diego)
      const jx = g ? 672 : 832, jy = g ? 102 : 212, jw = g ? 560 : 236, jh = g ? 486 : 216
      const esc = g ? 1.02 : 0.44, ex = jx + jw / 2 - 180 * esc, ey = jy + (g ? 14 : 8)
      const vagaY = jy + jh * 0.74
      return `<g>
      ${g ? `<ellipse cx="${jx + jw / 2}" cy="${jy + jh / 2}" rx="${jw * 0.8}" ry="${jh * 0.72}" fill="url(#halo)" opacity=".22"/>` : ''}
      <rect x="${jx - 14}" y="${jy - 14}" width="${jw + 28}" height="${jh + 28}" rx="14" fill="${g ? 'url(#mad)' : '#B9B2A2'}" stroke="${INK}" stroke-width="9"/>
      <g clip-path="url(#jan)">
        ${vistaJanela(jx, jy, jw, jh, T('carro'), g, E)}
        ${g ? '' : `<rect x="${jx}" y="${jy}" width="${jw}" height="${jh}" fill="#8C867A" opacity=".16"/>`}
      </g>
      ${g ? `<line x1="${jx}" y1="${jy + 54}" x2="${jx + jw}" y2="${jy + 54}" stroke="${INK}" stroke-width="8"/>`
          : `<line x1="${jx + jw / 2}" y1="${jy}" x2="${jx + jw / 2}" y2="${jy + jh}" stroke="${INK}" stroke-width="9"/><line x1="${jx}" y1="${jy + jh * 0.5}" x2="${jx + jw}" y2="${jy + jh * 0.5}" stroke="${INK}" stroke-width="9"/>`}
      <rect x="${jx}" y="${jy}" width="${jw}" height="${jh}" rx="6" fill="none" stroke="${INK}" stroke-width="7"/>
      ${g ? `<rect x="${jx - 30}" y="${jy + jh + 14}" width="${jw + 60}" height="18" rx="5" fill="url(#madTopo)" stroke="${INK}" stroke-width="7"/>` : ''}</g>`
    })()}

<!-- ═══ ESTANTE DE TROFÉUS ═══ -->
${T('estante') ? (() => {
      const ex = 46, ey = 140, ew = 318, eb = PY - 4, linhas = [ey + 100, ey + 212, ey + 324, ey + 436]
      const nt = 9
      return `<g>${pousa(ex + ew / 2, eb + 14, 180)}
    <rect x="${ex - 12}" y="${ey - 16}" width="${ew + 24}" height="${eb - ey + 16}" rx="10" fill="url(#mad)" stroke="${INK}" stroke-width="9"/>
    ${veio(ex - 12, ey - 16, ew + 24, eb - ey + 16, 8)}
    <rect x="${ex}" y="${ey}" width="${ew}" height="${eb - ey - 6}" fill="#41260F"/>
    <rect x="${ex}" y="${ey}" width="${ew}" height="${eb - ey - 6}" fill="url(#halo)" opacity=".18"/>
    ${linhas.map(y => `<g><rect x="${ex}" y="${y}" width="${ew}" height="14" fill="#8B5A2B"/><rect x="${ex}" y="${y + 14}" width="${ew}" height="7" fill="#000" opacity=".3"/></g>`).join('')}
    ${(() => { let o = '', k = 0; for (const y of linhas) for (const x of [ex + 56, ex + 159, ex + 262]) { if (k < nt) { o += taca(x, y - 6, 1.02); k++ } } return o })()}
    <rect x="${ex - 12}" y="${ey - 16}" width="${ew + 24}" height="${eb - ey + 16}" rx="10" fill="url(#vidro)" opacity=".5"/>
    <path d="M${ex + 26} ${ey + 6} L${ex + 124} ${ey + 6} L${ex + 30} ${eb - 20} L${ex - 4} ${eb - 20} Z" fill="#fff" opacity=".1"/>
    <rect x="${ex - 12}" y="${ey - 16}" width="${ew + 24}" height="${eb - ey + 16}" rx="10" fill="none" stroke="${INK}" stroke-width="9"/></g>`
    })() : ''}

<!-- ═══ MANTO EMOLDURADO ═══ -->
${T('manto') ? `<g transform="translate(412,200)">
  <rect x="6" y="10" width="200" height="256" rx="10" fill="#000" opacity=".2" filter="url(#borraoP)"/>
  <rect x="0" y="0" width="200" height="256" rx="10" fill="#EAE0C4" stroke="${INK}" stroke-width="9"/>
  <rect x="22" y="22" width="156" height="212" fill="#F7F3E6" stroke="${INK}" stroke-width="5"/>
  <path d="M52 60 L82 44 h36 l30 16 18 26 -24 22 -9 -10 v96 h-78 v-96 l-9 10 -24 -22 z" fill="#fff" stroke="${INK}" stroke-width="7"/>
  ${[76, 94, 112, 130].map(x => `<rect x="${x}" y="76" width="10" height="118" fill="${GREEN}"/>`).join('')}
  <path d="M56 64 L82 46" stroke="#fff" stroke-width="6" opacity=".9"/></g>` : ''}

<!-- ═══ ESCUDO na parede (só enquanto não tem mesa boa — depois ele vai pra frente da mesa) ═══ -->
${!T('mesa') ? escudo(540, 300, 0.9) : ''}

<!-- ═══ TAPETE ═══ -->
${T('tapete') ? `<g><ellipse cx="540" cy="${PY + 290}" rx="470" ry="112" fill="url(#tap)" stroke="${INK}" stroke-width="9"/>
  <ellipse cx="540" cy="${PY + 290}" rx="392" ry="86" fill="none" stroke="rgba(255,255,255,.32)" stroke-width="7"/>
  <ellipse cx="540" cy="${PY + 290}" rx="318" ry="62" fill="none" stroke="rgba(0,0,0,.18)" stroke-width="5"/></g>` : ''}

<!-- ═══ O TRONO ═══ -->
${T('poltrona')
      ? `<g><rect x="396" y="${PY - 176}" width="248" height="250" rx="66" fill="url(#couro)" stroke="${INK}" stroke-width="10"/>
     <rect x="428" y="${PY - 146}" width="184" height="190" rx="50" fill="#5A3A18"/>
     ${[[484, PY - 106], [556, PY - 106], [484, PY - 40], [556, PY - 40]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7" fill="#2E1A08"/>`).join('')}
     <path d="M420 ${PY - 150} q-8 60 0 120" fill="none" stroke="#fff" stroke-width="9" opacity=".13"/></g>`
      : `<g transform="translate(212,${PY - 104})">${pousa(56, 250, 60)}
     <rect x="12" y="0" width="94" height="100" rx="10" fill="#EFEFEA" stroke="${INK}" stroke-width="9"/>
     <rect x="0" y="100" width="118" height="24" rx="8" fill="#EFEFEA" stroke="${INK}" stroke-width="9"/>
     <line x1="20" y1="124" x2="8" y2="244" stroke="${INK}" stroke-width="9" stroke-linecap="round"/><line x1="98" y1="124" x2="110" y2="244" stroke="${INK}" stroke-width="9" stroke-linecap="round"/></g>`}
${T('mesa')
      ? `<g>${pousa(540, PY + 250, 360)}
     <rect x="250" y="${PY - 10}" width="580" height="52" rx="14" fill="url(#madTopo)" stroke="${INK}" stroke-width="10"/>
     ${veio(260, PY - 6, 560, 44, 4, 'rgba(0,0,0,.14)')}
     <rect x="250" y="${PY - 10}" width="580" height="16" rx="8" fill="#fff" opacity=".18"/>
     <rect x="286" y="${PY + 42}" width="508" height="168" rx="10" fill="url(#mad)" stroke="${INK}" stroke-width="9"/>
     ${veio(286, PY + 42, 508, 168, 6)}
     <rect x="470" y="${PY + 66}" width="140" height="120" rx="12" fill="#5A3517" stroke="${INK}" stroke-width="5"/>
     ${escudo(540, PY + 128, 0.62)}
     ${[360, 720].map(x => `<g><rect x="${x - 54}" y="${PY + 72}" width="108" height="42" rx="7" fill="#4A2E13" stroke="${INK}" stroke-width="5"/><rect x="${x - 22}" y="${PY + 88}" width="44" height="10" rx="5" fill="#8B5A2B"/>
        <rect x="${x - 54}" y="${PY + 134}" width="108" height="42" rx="7" fill="#4A2E13" stroke="${INK}" stroke-width="5"/><rect x="${x - 22}" y="${PY + 150}" width="44" height="10" rx="5" fill="#8B5A2B"/></g>`).join('')}
     <g><rect x="296" y="${PY - 36}" width="150" height="30" rx="5" fill="#F7F3E6" stroke="${INK}" stroke-width="6"/><rect x="312" y="${PY - 30}" width="118" height="6" rx="3" fill="#C9C2AE"/><rect x="312" y="${PY - 18}" width="86" height="6" rx="3" fill="#C9C2AE"/></g>
     <g transform="translate(722,${PY - 76})"><rect x="0" y="34" width="42" height="38" rx="6" fill="#4A2E13" stroke="${INK}" stroke-width="6"/>${[10, 22, 32].map((x, i) => `<line x1="${x}" y1="34" x2="${x - 4 + i * 4}" y2="${4 + i * 6}" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>`).join('')}</g>
     <g transform="translate(664,${PY - 88})"><line x1="6" y1="0" x2="6" y2="80" stroke="${INK}" stroke-width="5"/><path d="M8 4 h54 l-10 16 10 16 h-54 z" fill="${GREEN}" stroke="${INK}" stroke-width="4"/><rect x="0" y="78" width="14" height="6" rx="2" fill="${INK}"/></g></g>`
      : `<g>${pousa(540, PY + 200, 210)}
     <rect x="330" y="${PY - 58}" width="420" height="30" rx="8" fill="#E8E3D4" stroke="${INK}" stroke-width="9" transform="rotate(-2 540 ${PY - 42})"/>
     <line x1="370" y1="${PY - 28}" x2="346" y2="${PY + 150}" stroke="#8C867A" stroke-width="12" stroke-linecap="round"/>
     <line x1="712" y1="${PY - 28}" x2="736" y2="${PY + 150}" stroke="#8C867A" stroke-width="12" stroke-linecap="round"/>
     <g transform="translate(800,${PY - 130})">${pousa(50, 250, 56)}
       <rect x="0" y="0" width="100" height="100" rx="12" fill="#E4E9ED" stroke="${INK}" stroke-width="9"/>
       <circle cx="50" cy="50" r="30" fill="#CBD5DC" stroke="${INK}" stroke-width="7"/>
       ${[0, 60, 120, 180, 240, 300].map(a => `<line x1="50" y1="50" x2="${50 + 26 * Math.cos(a * Math.PI / 180)}" y2="${50 + 26 * Math.sin(a * Math.PI / 180)}" stroke="${INK}" stroke-width="5"/>`).join('')}
       <rect x="34" y="100" width="32" height="94" fill="#E4E9ED" stroke="${INK}" stroke-width="8"/><rect x="8" y="194" width="84" height="20" rx="9" fill="#CBD5DC" stroke="${INK}" stroke-width="8"/></g>`}

<!-- ═══ MASCOTE NO PEDESTAL (chão, esquerda) ═══ -->
${T('mascote') ? `<g transform="translate(64,${PY + 60})">${pousa(78, 262, 96)}
  <rect x="26" y="130" width="104" height="120" fill="#CFC7B1" stroke="${INK}" stroke-width="9"/>
  <rect x="4" y="240" width="148" height="26" rx="7" fill="#9A927C" stroke="${INK}" stroke-width="8"/>
  <rect x="10" y="108" width="136" height="26" rx="6" fill="#B9B09A" stroke="${INK}" stroke-width="8"/>
  ${veio(26, 130, 104, 120, 3, 'rgba(0,0,0,.1)')}
  <text x="78" y="98" text-anchor="middle" font-size="124">🐯</text></g>` : ''}

<!-- ═══ AQUÁRIO (sob a janela, à direita da mesa) ═══ -->
${T('aquario') ? `<g transform="translate(900,${PY + 4})">${pousa(110, 190, 120)}
  <rect x="0" y="0" width="220" height="150" rx="10" fill="#1F5B78" stroke="${INK}" stroke-width="9"/>
  <rect x="14" y="16" width="192" height="118" fill="#4FA3C7"/><rect x="14" y="16" width="192" height="46" fill="#7FC6E2" opacity=".6"/>
  ${[[56, 70], [124, 96], [176, 60]].map(([x, y]) => `<g transform="translate(${x},${y})"><path d="M0 0 l26 -13 v26 z" fill="${GOLD}" stroke="${INK}" stroke-width="3.5"/><circle cx="7" cy="0" r="3" fill="${INK}"/></g>`).join('')}
  ${[[40, 112], [100, 120], [160, 108]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="#fff" opacity=".55"/>`).join('')}
  <rect x="0" y="0" width="220" height="150" rx="10" fill="url(#vidro)" opacity=".45"/>
  <rect x="-6" y="-24" width="232" height="30" rx="8" fill="url(#madTopo)" stroke="${INK}" stroke-width="8"/>
  <rect x="10" y="150" width="200" height="34" rx="6" fill="url(#mad)" stroke="${INK}" stroke-width="8"/></g>` : ''}

<!-- ═══ PLANTA (canto direito) ═══ -->
${T('planta') ? `<g transform="translate(1152,${PY + 86})">${pousa(52, 176, 62)}
  <path d="M8 60 h88 l-12 104 h-64 z" fill="#B5642F" stroke="${INK}" stroke-width="9"/>
  <rect x="0" y="42" width="104" height="26" rx="6" fill="#C97440" stroke="${INK}" stroke-width="9"/>
  <path d="M52 44 C-6 8 16 -66 52 -22 C88 -66 110 8 52 44 Z" fill="${GREEN}" stroke="${INK}" stroke-width="9"/>
  <path d="M52 44 v-58" stroke="#12572A" stroke-width="7"/></g>` : ''}

<!-- ═══ CARRINHO DE CHAMPANHE (frente, direita) ═══ -->
${T('bar') ? `<g transform="translate(1004,${PY + 250})">${pousa(80, 176, 88)}
  <rect x="6" y="56" width="152" height="16" rx="6" fill="url(#ouroG)" stroke="${INK}" stroke-width="7"/>
  <rect x="6" y="120" width="152" height="16" rx="6" fill="url(#ouroG)" stroke="${INK}" stroke-width="7"/>
  <line x1="20" y1="72" x2="20" y2="120" stroke="${INK}" stroke-width="7"/><line x1="144" y1="72" x2="144" y2="120" stroke="${INK}" stroke-width="7"/>
  <circle cx="26" cy="152" r="14" fill="#2A2A2A" stroke="${INK}" stroke-width="6"/><circle cx="138" cy="152" r="14" fill="#2A2A2A" stroke="${INK}" stroke-width="6"/>
  <path d="M58 4 h26 v22 l12 30 h-50 l12 -30 z" fill="#17512C" stroke="${INK}" stroke-width="7"/><rect x="60" y="10" width="8" height="34" fill="#fff" opacity=".3"/>
  ${[112, 134].map(x => `<path d="M${x} 20 l16 0 -8 18 z" fill="#F7F3E6" stroke="${INK}" stroke-width="5"/>`).join('')}
  <rect x="26" y="88" width="112" height="22" rx="4" fill="#4A2E13" opacity=".6"/></g>` : ''}

<rect width="${W}" height="${H}" fill="url(#vinheta)"/>
<rect width="${W}" height="${H}" filter="url(#graos)" opacity=".05" style="mix-blend-mode:multiply"/>
</svg>`
}

// ── os 3 estados que valem mostrar ─────────────────────────────────────────
const TUDO = ['piso', 'parede', 'lustre', 'mesa', 'poltrona', 'tapete', 'estante', 'manto', 'mascote', 'aquario', 'bar', 'planta', 'carro']
const ESTADOS = {
  '1-comeco': [],
  '2-meio': ['piso', 'mesa', 'poltrona', 'estante', 'planta'],
  '3-completa': TUDO,
}

// ── a WEBAPP: as telas do celular com a arte dentro ─────────────────────────
const b64 = p => readFileSync(p).toString('base64')
const FONTES = [500, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(`${REPO}/scripts/fonts/oswald-latin-${w}-normal.woff2`)}) format('woff2');font-weight:${w};font-display:block}`).join('')
const CSS = `${FONTES}
*{box-sizing:border-box} html,body{margin:0;background:${CREME};color:${INK};font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;font-weight:700}
.osw{font-family:Oswald,sans-serif;font-weight:700;text-transform:uppercase}
.box{background:#fff;border:3px solid ${INK};border-radius:14px;box-shadow:3px 3px 0 ${INK}}
.band{background:${INK};color:#fff;border:3px solid ${INK};border-radius:14px;box-shadow:3px 3px 0 ${INK}}
.pill{display:inline-block;border:2px solid ${INK};border-radius:999px;padding:1px 8px;font-size:10px;font-family:Oswald,sans-serif;font-weight:700;text-transform:uppercase;white-space:nowrap}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:5px;border:3px solid ${INK};border-radius:12px;box-shadow:3px 3px 0 ${INK};font-family:Oswald,sans-serif;font-weight:700;text-transform:uppercase;padding:9px 10px;font-size:11px;background:#fff}
.muted{color:rgba(12,12,12,.55)} .row{display:flex;align-items:center;gap:8px}
.sub{display:flex;flex-direction:column;align-items:center;gap:2px;font-family:Oswald,sans-serif;font-weight:700;font-size:9.5px;letter-spacing:.04em;color:rgba(12,12,12,.5);border:2.5px solid rgba(12,12,12,.18);border-radius:11px;padding:5px 0;background:#fff;flex:1;min-width:0}
.sub.on{color:${INK};border-color:${INK};background:${GOLD};box-shadow:2px 2px 0 ${INK}}
.tab{display:flex;flex-direction:column;align-items:center;gap:2px;font-family:Oswald,sans-serif;font-weight:700;font-size:10px;letter-spacing:.06em;color:rgba(12,12,12,.45)} .tab.on{color:${INK}}
.tit{font-family:Oswald,sans-serif;font-weight:700;text-transform:uppercase;font-size:13px}
.sob{font-size:9.5px;font-weight:700;color:rgba(12,12,12,.55);margin-top:1px;line-height:1.35}
.item{display:flex;justify-content:space-between;align-items:center;gap:8px;border:2px solid ${INK};border-radius:10px;padding:5px 8px;margin-bottom:5px;background:#fff}
`
const faixa = `<div class="row" style="justify-content:space-between;background:#fff;border:2.5px solid ${INK};border-radius:11px;padding:5px 9px;margin-bottom:8px">
  <span class="osw" style="font-size:10.5px">Temporada 7 · <span style="color:${GREEN}">Série B</span></span>
  <span class="row" style="gap:5px"><span class="pill">Rodada 12/38</span><span class="pill" style="background:${GOLD}">🪙 128</span></span></div>`
const salas = `<div class="row" style="gap:5px;margin-bottom:9px">${[['🏟️', 'Estádio'], ['💰', 'Finanças'], ['🤝', 'Patroc.'], ['💼', 'Agência'], ['🏛️', 'Presidência']].map(([i, t]) => `<div class="sub${t === 'Presidência' ? ' on' : ''}"><span style="font-size:14px">${i}</span>${t}</div>`).join('')}</div>`
const rodape = `<div style="position:absolute;left:0;right:0;bottom:0;background:${CREME};border-top:3px solid ${INK};padding:8px 12px 12px;display:flex;justify-content:space-between">${[['🗓️', 'Jogos'], ['📊', 'Tabelas'], ['👥', 'Elenco'], ['🏆', 'Rank'], ['🏟️', 'Clube']].map(([i, t]) => `<div class="tab${t === 'Clube' ? ' on' : ''}"><span style="font-size:17px">${i}</span>${t}</div>`).join('')}</div>`
const fade = `<div style="position:absolute;left:0;right:0;bottom:70px;height:40px;background:linear-gradient(to top,${CREME},rgba(244,236,214,0))"></div>`
const cabecalho = `<div class="band" style="padding:9px 12px;margin-bottom:9px;display:flex;justify-content:space-between;align-items:center">
  <div><div class="osw" style="font-size:9.5px;color:${GOLD};letter-spacing:.09em">Sala da Presidência</div>
    <div class="osw" style="font-size:19px;line-height:1.05">Tigres do Asfalto</div>
    <div style="font-size:9.5px;color:rgba(255,255,255,.65);margin-top:2px">Presidente <b style="color:#fff">Diego Fonseca</b> <span style="border:1.5px solid rgba(255,255,255,.5);border-radius:6px;padding:0 4px;font-size:8.5px;margin-left:3px">✏️</span></div></div>
  <span class="pill" style="background:${GOLD}">Série B</span></div>`

const LOJA = [
  ['🪵', 'Piso de madeira', 6, 'piso'], ['🧱', 'Parede com lambri', 8, 'parede'], ['🪑', 'Mesa de presidente', 14, 'mesa'], ['💺', 'Poltrona de couro', 10, 'poltrona'],
  ['🟥', 'Tapete', 6, 'tapete'], ['🏆', 'Estante de troféus', 16, 'estante'], ['👕', 'Manto emoldurado', 10, 'manto'],
  ['🐯', 'Mascote no pedestal', 12, 'mascote'], ['💡', 'Lustre', 12, 'lustre'], ['🐟', 'Aquário', 16, 'aquario'], ['🍾', 'Bar de champanhe', 20, 'bar'], ['🌿', 'Planta', 3, 'planta'],
]
const telaSala = (img, tem, titulo, sub) => `<style>${CSS} body{width:390px;height:844px;overflow:hidden;position:relative;padding:10px 10px 0}</style>
${faixa}${salas}${cabecalho}
<div class="box" style="padding:0;overflow:hidden;margin-bottom:9px"><img src="${img}" style="width:100%;display:block">
  <div style="border-top:3px solid ${INK};padding:8px 11px">
    <div class="row" style="justify-content:space-between"><div><div class="tit">${titulo}</div><div class="sob">${sub}</div></div><span class="pill">${tem.size} de ${TUDO.length}</span></div>
    <div style="height:8px;border:2.5px solid ${INK};border-radius:999px;margin:8px 0 7px;background:#fff;overflow:hidden"><div style="width:${Math.round(tem.size / TUDO.length * 100)}%;height:100%;background:${GOLD}"></div></div>
    <div class="row" style="gap:6px"><a class="btn" style="flex:1;background:${GOLD}">🛒 Mobiliar</a><a class="btn" style="flex:1;background:#1faa54;color:#fff">📲 Mostrar no grupo</a></div></div></div>
<div class="box" style="padding:10px 12px">
  <div class="row" style="justify-content:space-between"><div><div class="tit">🎪 A torcida</div><div class="sob">Como a arquibancada te vê hoje.</div></div><span class="osw" style="font-size:22px;color:${GREEN}">72%</span></div></div>
${fade}${rodape}`
const telaLoja = (tem) => `<style>${CSS} body{width:390px;height:844px;overflow:hidden;position:relative;padding:10px 10px 0}</style>
${faixa}${salas}
<div class="box" style="padding:10px 12px;margin-bottom:9px">
  <div class="row" style="justify-content:space-between"><div><div class="tit">🛒 Mobiliar a sala</div><div class="sob">Sai do caixa do clube — o mesmo que contrata jogador. Nada aqui dá vantagem em campo.</div></div><span class="pill" style="background:${GOLD}">🪙 128</span></div>
  <div style="margin-top:9px">${LOJA.map(([ic, n, p, k]) => `<div class="item" style="background:${tem.has(k) ? '#E4F4E8' : '#fff'}"><span class="row" style="gap:8px"><span style="font-size:18px;line-height:1">${ic}</span><b style="font-size:11px">${n}</b></span>${tem.has(k) ? `<span class="pill" style="background:${GREEN};color:#fff">na sala ✓</span>` : `<span class="pill" style="background:${GOLD}">🪙 ${p} · comprar</span>`}</div>`).join('')}</div>
  <div class="tit" style="margin-top:8px">🚗 A vaga do presidente</div><div class="sob" style="margin-bottom:6px">Fica na frente do estádio — dá pra ver pela janela. Comprou, o carro aparece lá.</div>
  ${[['🚙', 'Brasília amarela', 24], ['🚗', 'Gol quadrado turbo', 40], ['🏎️', 'Importado de vidro fumê', 120]].map(([ic, n, p]) => `<div class="item" style="background:${n.startsWith('Importado') && tem.has('carro') ? '#E4F4E8' : '#fff'}"><span class="row" style="gap:8px"><span style="font-size:18px;line-height:1">${ic}</span><b style="font-size:11px">${n}</b></span>${n.startsWith('Importado') && tem.has('carro') ? `<span class="pill" style="background:${GREEN};color:#fff">na vaga ✓</span>` : `<span class="pill" style="background:${GOLD}">🪙 ${p} · comprar</span>`}</div>`).join('')}
  <div style="border:2px dashed rgba(12,12,12,.3);border-radius:10px;padding:6px 8px;font-size:9.5px;margin-top:4px" class="muted">🔒 Não deixa comprar se o caixa ficar sem cobrir a folha salarial — e diz quanto falta.</div></div>
${fade}${rodape}`

// ── render ──────────────────────────────────────────────────────────────────
const M = await motorEstadio()
const ESTADIOS = {
  'varzea':   { inv: {}, ext: [] },
  'meio':     { inv: { grama: 36, geral: 60, cadeiras: 90, visitante: 40 }, ext: ['refl', 'loja'] },
  'completo': { inv: { grama: 60, geral: 60, cadeiras: 90, visitante: 120, camarote: 150 }, ext: ['refl', 'telao', 'loja', 'estac', 'cober', 'hotel'] },
}
const Ede = (st, tier = 'bege', mascote = false) => ({ st, pct: M.pct, tem: M.tem, cores: M.cores(tier), mascote })
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const shot = async (nome, html, w, h, dpr = 1) => {
  const p = `${OUT}/${nome}.html`; writeFileSync(p, `<!doctype html><meta charset="utf-8"><style>html,body{margin:0;background:${CREME}}</style>${html}`)
  const pg = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: dpr })
  await pg.goto('file://' + p); await pg.evaluate(() => document.fonts.ready).catch(() => {}); await pg.waitForTimeout(260)
  await pg.screenshot({ path: `${OUT}/${nome}.png` }); await pg.close(); console.log(`${OUT}/${nome}.png`)
}
// a) folha de comparação: o MAPA do jogo à esquerda, a JANELA à direita — mesmo dado
for (const [nome, st] of Object.entries(ESTADIOS)) {
  const tier = nome === 'completo' ? 'ouro' : 'bege'
  const E = Ede(st, tier, nome === 'completo')
  const jan = `<svg viewBox="0 0 560 486" style="width:100%;height:auto;display:block" xmlns="http://www.w3.org/2000/svg"><defs>
    ${grad('ceuV', [[0, '#070C1A'], [0.45, '#0F1A33'], [0.8, '#2A3550'], [1, '#4A4A5A']])}${grad('asfaltoV', [[0, '#3A3F4A'], [1, '#1C1F26']])}
    ${grad('carroCorpo', [[0, '#3A3F48'], [0.35, '#15181E'], [1, '#0A0C10']])}${grad('carroTeto', [[0, '#4C525C'], [1, '#1A1E25']])}${grad('vidroTras', [[0, '#8FB6D6'], [1, '#2B4460']])}${grad('cone', [[0, 'rgba(255,241,201,.55)'], [1, 'rgba(255,241,201,0)']])}
    <radialGradient id="bloom" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FFF7D6" stop-opacity=".95"/><stop offset="0.35" stop-color="#FFE8A8" stop-opacity=".5"/><stop offset="1" stop-color="#FFE8A8" stop-opacity="0"/></radialGradient>
    <radialGradient id="bloomQ" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FFE9B8" stop-opacity=".9"/><stop offset="1" stop-color="#FFE9B8" stop-opacity="0"/></radialGradient>
    <radialGradient id="nevoa" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FFE7B0" stop-opacity=".22"/><stop offset="1" stop-color="#FFE7B0" stop-opacity="0"/></radialGradient>
    <radialGradient id="pocaLuz" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FFE7B0" stop-opacity=".35"/><stop offset="1" stop-color="#FFE7B0" stop-opacity="0"/></radialGradient>
    <filter id="borraoP" x="-60%" y="-160%" width="220%" height="420%"><feGaussianBlur stdDeviation="5"/></filter></defs>
    ${vistaJanela(0, 0, 560, 486, nome !== 'varzea', true, E)}</svg>`
  const html = `<style>${CSS} body{width:1240px;padding:16px}</style>
    <div class="band" style="padding:8px 14px;margin-bottom:10px;display:flex;justify-content:space-between"><span class="osw" style="font-size:16px">Estádio ${nome} · mesmo dado, duas vistas</span><span class="pill" style="background:${GOLD}">${tier}</span></div>
    <div style="display:grid;grid-template-columns:420px 1fr;gap:14px;align-items:start">
      <div class="box" style="padding:10px"><div class="tit" style="margin-bottom:6px">🗺️ No jogo hoje (gestão)</div>${M.mapa(st, tier)}</div>
      <div class="box" style="padding:10px"><div class="tit" style="margin-bottom:6px">🪟 Pela janela da Presidência</div><div style="border:3px solid ${INK};border-radius:10px;overflow:hidden">${jan}</div></div>
    </div>`
  await shot(`compara-${nome}`, html, 1240, 830)
}
// b) a sala com o estádio completo (tier ouro) e a sala do começo (várzea)
await shot('sala-3-completa', sala(new Set(TUDO), Ede(ESTADIOS.completo, 'ouro', true)), W, H)
await shot('sala-1-comeco', sala(new Set([]), Ede(ESTADIOS.varzea)), W, H)
await shot('sala-2-meio', sala(new Set(['piso', 'mesa', 'poltrona', 'estante', 'planta']), Ede(ESTADIOS.meio)), W, H)
const img = nome => `data:image/png;base64,${b64(`${OUT}/sala-${nome}.png`)}`
await shot('app-3-completa', telaSala(img('3-completa'), new Set(TUDO), '🏛️ A sua sala', 'Tudo comprado — e pela janela, o SEU estádio, com as SUAS obras.'), 390, 844, 2)
await shot('app-1-comeco', telaSala(img('1-comeco'), new Set([]), '🏛️ A sua sala', 'Começo de carreira: mesa de plástico, e lá fora o campo de várzea.'), 390, 844, 2)
await b.close(); await M.fechar()
