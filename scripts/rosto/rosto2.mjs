// ─── 🧑 ROSTO DE JOGADOR v2 — o acabamento de verdade ────────────────────────
//
// O Diego comparou com o meuonze.app.br: "olha a diferença dos caras pro nosso
// pqp". Ele estava certo, e o problema NÃO era o estilo — era o acabamento.
// O que o deles tem e o meu v1 não tinha:
//
//   1. PROPORÇÃO DE GENTE. Cabeça oval (não bola), pescoço de verdade, ombro,
//      busto cortado no peito. O v1 era uma cabeça redonda gigante.
//   2. CAMISA DE VERDADE. Gola, manga, ombro — não um trapézio colorido.
//   3. CABELO COM MECHA. Uma massa chapada não lê como cabelo; mecha lê.
//   4. SOMBRA. Dois tons na pele (queixo/pescoço) e na camisa. É isso que faz
//      parecer "bem feito" — sem isso fica adesivo.
//   5. ROSTO DISCRETO. Olho pequeno, sem sorrisão. Cara de retrato, não emoji.
//
// Continua sendo PEÇA, não figura: o desenho entra uma vez e serve pros 1.414.
//
// Dois acabamentos, pro Diego escolher:
//   'casa'  — com o contorno preto grosso da nossa identidade
//   'suave' — sem contorno, só sombra (é o do concorrente)
//
const INK = '#0C0C0C'
const pa = d => `<path d="${d}"/>`
// escurece uma cor (pra mecha do cabelo) sem depender de CSS moderno
const escurecer = (hex, f = .62) => {
  const n = parseInt(hex.slice(1), 16)
  const r = Math.round(((n >> 16) & 255) * f), g = Math.round(((n >> 8) & 255) * f), b = Math.round((n & 255) * f)
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')
}

// contorno de união: traço grosso embaixo, preenchimento em cima → só a
// silhueta de fora fica preta (sem risco no meio das mechas)
const uni = (formas, c, w) =>
  (w ? `<g fill="none" stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round">${formas}</g>` : '') +
  `<g fill="${c}" stroke="none">${formas}</g>`

// 🎨 pele: base + sombra (o 2º tom é o que dá volume)
export const PELE = {
  a: ['#F2CDA8', '#DCAE87'], b: ['#E3B389', '#C89669'], c: ['#C68A5C', '#A97046'],
  d: ['#8E5931', '#6F4321'], e: ['#5E3819', '#452710'], f: ['#FBDCC0', '#EAC3A1'],
}

// ── geometria (viewBox 200×250) ─────────────────────────────────────────────
// cabeça: oval de x64..136, y27..123 · pescoço x84..116 · busto a partir de 170
const CABECA = 'M64 70 C64 42 79 27 100 27 C121 27 136 42 136 70 C136 93 129 109 117 117 C111 121 105 123 100 123 C95 123 89 121 83 117 C71 109 64 93 64 70 Z'
const PESCOCO = 'M84 100 L84 140 C84 148 116 148 116 140 L116 100 Z'
const BUSTO = 'M10 235 C12 190 38 165 68 157 C79 176 90 182 100 182 C110 182 121 176 132 157 C162 165 188 190 190 235 Z'
const GOLA = 'M68 157 C79 176 90 182 100 182 C110 182 121 176 132 157 L124 154 C115 170 108 175 100 175 C92 175 85 170 76 154 Z'

// toucas (a linha do cabelo fica em y≈56, que é onde acaba a testa)
const T   = 'M62 80 C60 46 77 25 100 25 C123 25 140 46 138 80 C135 65 130 56 123 52 C114 58 106 60 100 60 C94 60 86 58 77 52 C70 56 65 65 62 80 Z'
const T_R = 'M65 76 C64 48 79 32 100 32 C121 32 136 48 135 76 C133 65 128 58 122 55 C114 60 107 62 100 62 C93 62 86 60 78 55 C72 58 67 65 65 76 Z'
const T_G = 'M60 82 C57 43 76 21 100 21 C124 21 143 43 140 82 C137 66 131 56 124 52 C114 58 106 60 100 60 C94 60 86 58 76 52 C69 56 63 66 60 82 Z'
const T_T = 'M62 80 C60 46 77 25 100 25 C123 25 140 46 138 80 C136 66 132 57 125 53 C116 49 84 49 75 53 C68 57 64 66 62 80 Z'
const JUBA = 'M70 80 C70 46 82 27 100 27 C118 27 130 46 130 80 L130 124 C130 134 124 137 119 132 C115 128 115 120 115 112 L115 98 C115 86 109 80 100 80 C91 80 85 86 85 98 L85 112 C85 120 85 128 81 132 C76 137 70 134 70 124 Z'
const JUBA_G = 'M56 82 C56 40 74 20 100 20 C126 20 144 40 144 82 L144 146 C144 158 134 161 128 155 C124 151 123 138 123 126 L123 96 C123 78 114 68 100 68 C86 68 77 78 77 96 L77 126 C77 138 76 151 72 155 C66 161 56 158 56 146 Z'

// mechas: riscos finos DENTRO do cabelo. É o detalhe que tira a cara de adesivo.
const mecha = (d, c, w = 3) =>
  `<g fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" opacity=".55">${d}</g>`

const M_TOPO = '<path d="M74 56 C76 42 86 32 100 30"/><path d="M88 52 C90 40 96 33 103 30"/>' +
  '<path d="M126 56 C124 42 114 32 100 30"/><path d="M112 52 C110 40 104 33 97 30"/>'
const M_TRAS = '<path d="M78 60 C80 44 88 32 100 29"/><path d="M122 60 C120 44 112 32 100 29"/>' +
  '<path d="M100 29 L100 52"/>'

// ✂️ CABELOS
export const CABELO = {
  curto:  { base: () => pa(T),   mechas: M_TOPO },
  risca:  { base: () => pa(T),   mechas: '<path d="M79 56 C78 44 78 36 79 28"/>' + M_TOPO },
  topete: { base: () => pa('M62 80 C60 46 77 25 100 25 C123 25 140 46 138 80 C135 65 130 56 123 52 C118 34 96 29 86 39 C82 44 81 50 80 55 C73 55 66 65 62 80 Z'), mechas: M_TOPO },
  raspado:{ base: () => pa(T_R) },
  cacheado: {
    base: () => pa(T_G),
    caroco: '<circle cx="70" cy="58" r="12"/><circle cx="82" cy="40" r="13.5"/>' +
      '<circle cx="100" cy="32" r="14.5"/><circle cx="118" cy="40" r="13.5"/><circle cx="130" cy="58" r="12"/>',
  },
  afro: {
    atras: () => '<circle cx="100" cy="50" r="45"/><circle cx="58" cy="64" r="24"/>' +
      '<circle cx="142" cy="64" r="24"/><circle cx="70" cy="26" r="21"/><circle cx="130" cy="26" r="21"/>',
    base: () => pa(T_G),
  },
  moicano: {
    base: () => pa('M65 78 C64 52 79 38 100 38 C121 38 136 52 135 78 C133 69 128 63 122 61 C114 64 107 65 100 65 C93 65 86 64 78 61 C72 63 67 69 65 78 Z') +
      pa('M86 74 C86 44 92 16 100 16 C108 16 114 44 114 74 C110 70 90 70 86 74 Z'),
    mechas: '<path d="M94 66 C94 46 97 26 100 22"/><path d="M106 66 C106 46 103 26 100 22"/>',
  },
  longo:  { atras: () => pa(JUBA), base: () => pa(T_T), mechas: M_TRAS },
  cachos: {
    atras: () => pa(JUBA_G) + '<circle cx="60" cy="54" r="16"/><circle cx="72" cy="30" r="17"/>' +
      '<circle cx="100" cy="19" r="18"/><circle cx="128" cy="30" r="17"/><circle cx="140" cy="54" r="16"/>' +
      '<circle cx="59" cy="112" r="14"/><circle cx="141" cy="112" r="14"/>' +
      '<circle cx="62" cy="141" r="12"/><circle cx="138" cy="141" r="12"/>',
    base: () => pa(T_G),
    caroco: '<circle cx="70" cy="52" r="13"/><circle cx="84" cy="36" r="14"/>' +
      '<circle cx="116" cy="36" r="14"/><circle cx="130" cy="52" r="13"/>',
  },
  // mop cacheado volumoso (Maradona). Sem camada de trás: de frente o rabo do
  // mullet aparecia dos dois lados do pescoço parecendo gola.
  mullet: {
    base: () => pa(T_G),
    caroco: '<circle cx="70" cy="58" r="12"/><circle cx="83" cy="39" r="14"/>' +
      '<circle cx="100" cy="31" r="14.5"/><circle cx="117" cy="39" r="14"/><circle cx="130" cy="58" r="12"/>',
  },
  tranca: {
    base: () => pa(T_R),
    tranquinha: '<path d="M76 58 C76 46 81 38 88 34"/><path d="M86 50 C86 42 90 36 95 32"/>' +
      '<path d="M100 48 L100 31"/><path d="M114 50 C114 42 110 36 105 32"/>' +
      '<path d="M124 58 C124 46 119 38 112 34"/>',
  },
  // careca com cabelo só nas têmporas. A 1ª versão era uma faixa atravessando
  // a testa — parecia bandana, não careca.
  coroa:  { base: () => pa('M62 94 C62 70 69 53 82 44 C78 57 76 68 76 80 C70 82 65 87 62 94 Z') +
    pa('M138 94 C138 70 131 53 118 44 C122 57 124 68 124 80 C130 82 135 87 138 94 Z') },
  careca: { base: () => '' },
}

// 🧔 barbas
export const BARBA = {
  nao: '',
  cavan: '<path d="M85 91 C91 87 109 87 115 91 C109 94.5 91 94.5 85 91 Z"/>' +
    '<path d="M88 108 C88 104 112 104 112 108 C112 120 106 125.5 100 125.5 C94 125.5 88 120 88 108 Z"/>',
  cheia: '<path d="M66 78 C72 88 82 93 100 93 C118 93 128 88 134 78 C134 111 119 132 100 132 C81 132 66 111 66 78 Z"/>' +
    '<path d="M84 92 C90 87 110 87 116 92 C110 96 90 96 84 92 Z"/>',
  bigode: '<path d="M81 93 C89 87 111 87 119 93 C111 97 89 97 81 93 Z"/>',
}

// 👕 camisa: gola + manga + padrão, tudo recortado no busto
function camisa({ c1, c2 = c1, tipo = 'lisa', gola = '#ffffff' }, id, casa) {
  const t = casa ? 3.2 : 0
  let dentro = `<rect x="0" y="140" width="200" height="100" fill="${c1}"/>`
  if (tipo === 'listras') dentro += [0,1,2,3,4,5].map(i => `<rect x="${16 + i*30}" y="140" width="15" height="100" fill="${c2}"/>`).join('')
  if (tipo === 'faixa')   dentro += `<path d="M18 235 152 140h30L48 235z" fill="${c2}"/>`
  if (tipo === 'meio')    dentro += `<rect x="86" y="140" width="28" height="100" fill="${c2}"/>`
  if (tipo === 'banda')   dentro += `<rect x="0" y="196" width="200" height="24" fill="${c2}"/>`
  // manga: um tom mais escuro nas pontas, pra ler o braço
  const manga = '<path d="M10 235 C11 202 20 180 40 169 L58 235 Z"/><path d="M190 235 C189 202 180 180 160 169 L142 235 Z"/>'
  return `<clipPath id="b${id}"><path d="${BUSTO}"/></clipPath>
    <g clip-path="url(#b${id})">${dentro}
      <g fill="#000" opacity=".13">${manga}</g>
      <path d="${GOLA}" fill="${gola}"/>
    </g>
    ${t ? `<path d="${BUSTO}" fill="none" stroke="${INK}" stroke-width="${t}" stroke-linejoin="round"/>
    <path d="${GOLA}" fill="none" stroke="${INK}" stroke-width="${t * .8}" stroke-linejoin="round"/>` : ''}`
}

// 🧑 o boneco. estilo: 'casa' (contorno preto) | 'suave' (só sombra)
export function rosto2({
  pele = 'b', cabelo = 'curto', corCabelo = '#2B2118', pintado, barba = 'nao',
  c1 = '#fff', c2, gola, tipo = 'lisa', id = 'x', estilo = 'casa',
}) {
  const casa = estilo === 'casa'
  const t = casa ? 3.2 : 0       // traço das peças grandes
  const th = casa ? 6.4 : 0      // traço do contorno de união (some metade)
  const [p, ps] = PELE[pele] ?? PELE.b
  const cab = CABELO[cabelo] ?? CABELO.curto
  const cc = corCabelo
  const esc = escurecer(cc)  // mecha mais escura
  const bocaCor = barba === 'cheia' ? '#F4ECD6' : INK
  const olhos = casa
    ? `<ellipse cx="84" cy="76" rx="4" ry="5" fill="${INK}"/><ellipse cx="116" cy="76" rx="4" ry="5" fill="${INK}"/>`
    : `<path d="M76 75 C81 81 89 81 93 75" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round" opacity=".8"/>
       <path d="M124 75 C119 81 111 81 107 75" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round" opacity=".8"/>`

  return `<svg viewBox="0 0 200 235" width="100%" style="display:block">
  ${camisa({ c1, c2, tipo, gola: gola || '#F3F3F3' }, id, casa)}
  ${cab.atras ? uni(cab.atras(), cc, th) : ''}
  <path d="${PESCOCO}" fill="${p}"${t ? ` stroke="${INK}" stroke-width="${t}"` : ''}/>
  <path d="M84 100 C88 116 112 116 116 100 L116 116 C112 126 88 126 84 116 Z" fill="${ps}"/>
  <ellipse cx="64" cy="80" rx="7" ry="10" fill="${p}"${t ? ` stroke="${INK}" stroke-width="${t}"` : ''}/>
  <ellipse cx="136" cy="80" rx="7" ry="10" fill="${p}"${t ? ` stroke="${INK}" stroke-width="${t}"` : ''}/>
  <path d="${CABECA}" fill="${p}"${t ? ` stroke="${INK}" stroke-width="${t}"` : ''}/>
  <path d="M66 84 C70 106 82 120 100 123 C82 123 68 108 66 84 Z" fill="${ps}" opacity=".75"/>
  <path d="M134 84 C130 106 118 120 100 123 C118 123 132 108 134 84 Z" fill="${ps}" opacity=".45"/>
  ${BARBA[barba] ? uni(BARBA[barba], cc, casa ? 5 : 0) : ''}
  <path d="M76 63 C82 57.5 92 57.5 97 61.5M124 63 C118 57.5 108 57.5 103 61.5" fill="none" stroke="${INK}" stroke-width="3.2" stroke-linecap="round" opacity=".9"/>
  ${olhos}
  <path d="M100 78 C100 88 102 92 105 95 C103 97 97 97 95 95" fill="none" stroke="${ps}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M92 107 C96 111 104 111 108 107" fill="none" stroke="${bocaCor}" stroke-width="3.4" stroke-linecap="round" opacity="${casa ? 1 : .75}"/>
  ${cab.base() ? uni(cab.base(), cc, th) : ''}
  ${cab.caroco ? uni(cab.caroco, pintado || cc, th) : ''}
  ${cab.mechas ? mecha(cab.mechas, esc) : ''}
  ${cab.tranquinha ? mecha(cab.tranquinha, esc, 4) : ''}
</svg>`
}
