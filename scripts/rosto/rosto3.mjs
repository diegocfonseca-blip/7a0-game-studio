// ─── 🧑 ROSTO DE JOGADOR v3 — SEM ROSTO ──────────────────────────────────────
//
// Direção do Diego (19/08), depois de mandar a referência:
//   "realmente C rostos q lembrem os jogadores reais mas SEM OLHOS BOCA E NARIZ"
//
// Isso muda tudo — e pra melhor. Sem olho/boca/nariz:
//   · acaba a cara de emoji (era o que ele odiava nas minhas versões);
//   · o que identifica o jogador vira o CABELO, a BARBA e as CORES DO CLUBE,
//     que é justamente o que a gente consegue acertar;
//   · e some o risco de "inventar como a pessoa é" — sem rosto, não tem chute
//     de traço, só o cabelo que todo mundo lembra.
//
// Fundo = cor do clube (é o que faz a peça saltar). Cabeça e pescoço chapados,
// com um 2º tom de sombra. Camisa só aparece no rodapé, com gola.
//
// Continua sendo PEÇA, não figura: o desenho entra uma vez e serve pros 1.414;
// cada jogador guarda ~5 letrinhas no baralho. Zero KB por jogador novo.
//
const INK = '#0C0C0C'
const pa = d => `<path d="${d}"/>`

// contorno de união: traço grosso embaixo, preenchimento em cima → só a
// silhueta de fora fica preta (sem risco no meio das mechas)
const uni = (formas, c, w) =>
  (w ? `<g fill="none" stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round">${formas}</g>` : '') +
  `<g fill="${c}" stroke="none">${formas}</g>`

// 🎨 pele: base + sombra
export const PELE = {
  a: ['#F2CDA8', '#E0B78E'], b: ['#E3B389', '#CE9D71'], c: ['#C68A5C', '#B0764B'],
  d: ['#8E5931', '#784825'], e: ['#5E3819', '#4C2C12'], f: ['#FBDCC0', '#EFCAA9'],
}

// ── geometria (viewBox 200×200, quadrado como o da referência) ──────────────
const CABECA  = 'M70 58 C70 36 83 26 100 26 C117 26 130 36 130 58 L130 98 C130 120 117 134 100 134 C83 134 70 120 70 98 Z'
const PESCOCO = 'M87 118 L87 170 L113 170 L113 118 Z'
const SOMBRA_PESCOCO = 'M87 118 C91 129 109 129 113 118 L113 128 L87 128 Z'
const BUSTO   = 'M4 200 C9 174 32 159 60 154 C69 169 83 177 100 177 C117 177 131 169 140 154 C168 159 191 174 196 200 Z'
const GOLA    = 'M60 154 C69 169 83 177 100 177 C117 177 131 169 140 154 L131 151 C123 164 113 171 100 171 C87 171 77 164 69 151 Z'

// toucas (a linha do cabelo fica em y≈53)
const C   = 'M68 64 C67 38 80 22 100 22 C120 22 133 38 132 64 C130 54 126 48 119 45 C112 51 106 53 100 53 C94 53 88 51 81 45 C74 48 70 54 68 64 Z'
const C_R = 'M71 62 C70 42 82 30 100 30 C118 30 130 42 129 62 C127 54 124 50 118 48 C112 53 106 55 100 55 C94 55 88 53 82 48 C76 50 73 54 71 62 Z'
const C_G = 'M65 66 C63 34 79 18 100 18 C121 18 137 34 135 66 C133 54 128 47 120 44 C112 50 106 52 100 52 C94 52 88 50 80 44 C72 47 67 54 65 66 Z'
const C_T = 'M68 64 C67 38 80 22 100 22 C120 22 133 38 132 64 C131 54 127 47 120 44 C112 40 88 40 80 44 C73 47 69 54 68 64 Z'
const JUBA = 'M72 60 C72 34 84 22 100 22 C116 22 128 34 128 60 L128 122 C128 134 122 138 117 133 C113 129 113 119 113 109 L113 92 C113 78 108 72 100 72 C92 72 87 78 87 92 L87 109 C87 119 87 129 83 133 C78 138 72 134 72 122 Z'
const JUBA_G = 'M58 66 C58 30 76 16 100 16 C124 16 142 30 142 66 L142 142 C142 156 132 159 126 152 C121 147 120 133 120 121 L120 96 C120 78 112 70 100 70 C88 70 80 78 80 96 L80 121 C80 133 79 147 74 152 C68 159 58 156 58 142 Z'

// mecha: risco fino DENTRO do cabelo (sem isso o cabelo vira mancha)
const mecha = (d, c, w = 3) =>
  `<g fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" opacity=".45">${d}</g>`
const escurecer = (hex, f = .58) => {
  const n = parseInt(hex.slice(1), 16)
  return '#' + [(n >> 16) & 255, (n >> 8) & 255, n & 255]
    .map(v => Math.round(v * f).toString(16).padStart(2, '0')).join('')
}
const M_TOPO = '<path d="M78 50 C80 38 88 28 100 26"/><path d="M89 46 C91 36 96 29 102 26"/>' +
  '<path d="M122 50 C120 38 112 28 100 26"/><path d="M111 46 C109 36 104 29 98 26"/>'
const M_TRAS = '<path d="M82 54 C84 38 91 27 100 24"/><path d="M118 54 C116 38 109 27 100 24"/>' +
  '<path d="M100 24 L100 48"/>'

// ✂️ CABELOS
export const CABELO = {
  curto:   { base: () => pa(C),   mechas: M_TOPO },
  risca:   { base: () => pa(C),   mechas: '<path d="M83 52 C82 42 82 34 83 25"/>' + M_TOPO },
  topete:  { base: () => pa('M68 64 C67 38 80 22 100 22 C120 22 133 38 132 64 C130 54 126 48 119 45 C115 29 95 24 86 33 C82 37 81 43 80 49 C74 50 70 55 68 64 Z'), mechas: M_TOPO },
  raspado: { base: () => pa(C_R) },
  cacheado: {
    base: () => pa(C_G),
    caroco: '<circle cx="74" cy="50" r="12"/><circle cx="86" cy="32" r="13.5"/>' +
      '<circle cx="100" cy="24" r="14.5"/><circle cx="114" cy="32" r="13.5"/><circle cx="126" cy="50" r="12"/>',
  },
  afro: {
    atras: () => '<circle cx="100" cy="44" r="42"/><circle cx="62" cy="58" r="22"/>' +
      '<circle cx="138" cy="58" r="22"/><circle cx="74" cy="22" r="20"/><circle cx="126" cy="22" r="20"/>',
    base: () => pa(C_G),
  },
  moicano: {
    base: () => pa('M71 64 C70 46 82 34 100 34 C118 34 130 46 129 64 C127 56 124 52 118 50 C112 55 106 57 100 57 C94 57 88 55 82 50 C76 52 73 56 71 64 Z') +
      pa('M88 62 C88 30 94 8 100 8 C106 8 112 30 112 62 C108 58 92 58 88 62 Z'),
    mechas: '<path d="M95 54 C95 36 97 18 100 14"/><path d="M105 54 C105 36 103 18 100 14"/>',
  },
  longo:  { atras: () => pa(JUBA), base: () => pa(C_T), mechas: M_TRAS },
  cachos: {
    atras: () => pa(JUBA_G) + '<circle cx="62" cy="46" r="16"/><circle cx="74" cy="24" r="17"/>' +
      '<circle cx="100" cy="14" r="18"/><circle cx="126" cy="24" r="17"/><circle cx="138" cy="46" r="16"/>' +
      '<circle cx="61" cy="110" r="14"/><circle cx="139" cy="110" r="14"/>' +
      '<circle cx="64" cy="138" r="12"/><circle cx="136" cy="138" r="12"/>',
    base: () => pa(C_G),
    caroco: '<circle cx="74" cy="44" r="13"/><circle cx="88" cy="28" r="14"/>' +
      '<circle cx="112" cy="28" r="14"/><circle cx="126" cy="44" r="13"/>',
  },
  // mop cacheado volumoso (Maradona)
  mullet: {
    base: () => pa(C_G),
    caroco: '<circle cx="74" cy="50" r="12"/><circle cx="87" cy="31" r="14"/>' +
      '<circle cx="100" cy="23" r="14.5"/><circle cx="113" cy="31" r="14"/><circle cx="126" cy="50" r="12"/>',
  },
  tranca: {
    base: () => pa(C_R),
    tranquinha: '<path d="M80 52 C80 40 85 32 92 28"/><path d="M90 46 C90 38 94 32 98 28"/>' +
      '<path d="M110 46 C110 38 106 32 102 28"/><path d="M120 52 C120 40 115 32 108 28"/>',
  },
  // careca com cabelo só nas têmporas
  coroa: {
    base: () => pa('M68 78 C68 54 75 40 86 32 C83 44 81 55 81 68 C75 70 70 74 68 78 Z') +
      pa('M132 78 C132 54 125 40 114 32 C117 44 119 55 119 68 C125 70 130 74 132 78 Z'),
  },
  careca: { base: () => '' },
}

// 🧔 barbas — sem boca, então a barba é uma forma chapada no maxilar
export const BARBA = {
  nao: '',
  cavan: '<path d="M88 96 C93 92 107 92 112 96 C107 99.5 93 99.5 88 96 Z"/>' +
    '<path d="M89 111 C89 107 111 107 111 111 C111 124 106 130 100 130 C94 130 89 124 89 111 Z"/>',
  cheia: '<path d="M70 84 C75 97 86 104 100 104 C114 104 125 97 130 84 C130 118 117 138 100 138 C83 138 70 118 70 84 Z"/>' +
    '<path d="M87 97 C92 92 108 92 113 97 C108 101 92 101 87 97 Z"/>',
  bigode: '<path d="M81 96 C89 89 111 89 119 96 C111 101 89 101 81 96 Z"/>',
}

// 👕 camisa: só o rodapé, com gola. As cores/padrão do clube.
function camisa({ c1, c2 = c1, tipo = 'lisa', gola = '#fff' }, id, casa) {
  const t = casa ? 3.4 : 0
  let dentro = `<rect x="0" y="145" width="200" height="60" fill="${c1}"/>`
  if (tipo === 'listras') dentro += [0,1,2,3,4,5].map(i => `<rect x="${14 + i*32}" y="145" width="16" height="60" fill="${c2}"/>`).join('')
  if (tipo === 'faixa')   dentro += `<path d="M18 205 152 145h34L52 205z" fill="${c2}"/>`
  if (tipo === 'meio')    dentro += `<rect x="86" y="145" width="28" height="60" fill="${c2}"/>`
  if (tipo === 'banda')   dentro += `<rect x="0" y="182" width="200" height="16" fill="${c2}"/>`
  if (tipo === 'chevron') dentro += `<path d="M100 145 130 205h-14L100 168 84 205H70Z" fill="${c2}"/>`
  return `<clipPath id="b${id}"><path d="${BUSTO}"/></clipPath>
    <g clip-path="url(#b${id})">${dentro}<path d="${GOLA}" fill="${gola}"/></g>
    ${t ? `<path d="${BUSTO}" fill="none" stroke="${INK}" stroke-width="${t}" stroke-linejoin="round"/>
    <path d="${GOLA}" fill="none" stroke="${INK}" stroke-width="${t * .75}" stroke-linejoin="round"/>` : ''}`
}

// 🧑 a peça. SEM olho, boca ou nariz — de propósito.
export function rosto3({
  pele = 'b', cabelo = 'curto', corCabelo = '#2B2118', pintado, barba = 'nao',
  fundo = '#C2452F', c1 = '#fff', c2, gola, tipo = 'lisa', id = 'x', estilo = 'casa',
}) {
  const casa = estilo === 'casa'
  const t = casa ? 3.4 : 0
  const th = casa ? 6.8 : 0
  const [p, ps] = PELE[pele] ?? PELE.b
  const cab = CABELO[cabelo] ?? CABELO.curto
  return `<svg viewBox="0 0 200 200" width="100%" style="display:block">
  <rect x="0" y="0" width="200" height="200" fill="${fundo}"/>
  ${cab.atras ? uni(cab.atras(), corCabelo, th) : ''}
  <path d="${PESCOCO}" fill="${p}"${t ? ` stroke="${INK}" stroke-width="${t}"` : ''}/>
  <path d="${SOMBRA_PESCOCO}" fill="${ps}"/>
  <rect x="64" y="80" width="8" height="20" rx="4" fill="${p}"${t ? ` stroke="${INK}" stroke-width="${t}"` : ''}/>
  <rect x="128" y="80" width="8" height="20" rx="4" fill="${p}"${t ? ` stroke="${INK}" stroke-width="${t}"` : ''}/>
  <path d="${CABECA}" fill="${p}"${t ? ` stroke="${INK}" stroke-width="${t}"` : ''}/>
  <path d="M70 80 C70 106 77 123 89 131 C79 129 70 117 70 98 Z" fill="${ps}" opacity=".7"/>
  ${BARBA[barba] ? uni(BARBA[barba], corCabelo, casa ? 5 : 0) : ''}
  ${cab.base() ? uni(cab.base(), corCabelo, th) : ''}
  ${cab.caroco ? uni(cab.caroco, pintado || corCabelo, th) : ''}
  ${cab.mechas ? mecha(cab.mechas, escurecer(pintado || corCabelo)) : ''}
  ${cab.tranquinha ? mecha(cab.tranquinha, escurecer(corCabelo), 3.6) : ''}
  ${camisa({ c1, c2, tipo, gola: gola || '#F2F2F2' }, id, casa)}
</svg>`
}
