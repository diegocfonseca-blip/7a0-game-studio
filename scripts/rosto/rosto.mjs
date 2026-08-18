// ─── 🧑 ROSTO DE JOGADOR — sistema de peças (mockup) ─────────────────────────
// A ideia: NÃO desenhar 1.414 jogadores. Desenhar UM boneco e trocar as peças —
// pele, cabelo, barba e as cores da camisa. O desenho é código (entra uma vez);
// cada jogador guarda só 3-4 números. Mesma lógica do MANTO do jogo, que já é
// listra em CSS (0 KB) em vez de imagem de camisa.
//
// Identidade da casa, não a do concorrente: traço preto GROSSO, cores chapadas,
// sem degradê, sombra dura deslocada.
const INK = '#0C0C0C'

// 🎨 tons de pele
export const PELE = {
  a: '#F3C9A0', b: '#E0A97B', c: '#C07E4E', d: '#8A5430', e: '#5A3418', f: '#FAD9BC',
}

// ✂️ CABELOS — cada um é um caminho só, desenhado por cima da cabeça.
// (o `k` é a chave que o jogador guarda no baralho: 3 letras, ~3 bytes)
export const CABELO = {
  curto:   (c) => `<path d="M22 44c0-18 12-28 28-28s28 10 28 28c0-8-6-13-12-13H34c-7 0-12 5-12 13z" fill="${c}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`,
  raspado: (c) => `<path d="M23 45c1-16 12-26 27-26s26 10 27 26c-3-6-9-9-14-10-8-2-18-2-26 0-5 1-11 4-14 10z" fill="${c}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`,
  cacheado:(c) => `<g fill="${c}" stroke="${INK}" stroke-width="4"><circle cx="30" cy="30" r="11"/><circle cx="50" cy="23" r="13"/><circle cx="70" cy="30" r="11"/><circle cx="24" cy="44" r="8"/><circle cx="76" cy="44" r="8"/></g>`,
  afro:    (c) => `<g fill="${c}" stroke="${INK}" stroke-width="4"><circle cx="50" cy="24" r="24"/><circle cx="22" cy="36" r="15"/><circle cx="78" cy="36" r="15"/><circle cx="30" cy="16" r="13"/><circle cx="70" cy="16" r="13"/></g>`,
  moicano: (c) => `<path d="M25 47c1-6 3-11 7-15l4 7c-4 4-7 8-8 12zM75 47c-1-6-3-11-7-15l-4 7c4 4 7 8 8 12z" fill="${c}" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/><path d="M41 45c0-21 3-36 9-36s9 15 9 36c-3-3-6-4-9-4s-6 1-9 4z" fill="${c}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`,
  longo:   (c) => `<path d="M22 48c0-19 12-29 28-29s28 10 28 29v20c0 4-3 6-6 5-3-1-4-5-4-11 0-9-7-13-18-13s-18 4-18 13c0 6-1 10-4 11-3 1-6-1-6-5z" fill="${c}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`,
  mullet:  (c) => `<path d="M21 46c0-19 13-29 29-29s29 10 29 29v6c0 3-3 4-5 2-3-3-4-9-6-11-6 4-30 4-36 0-2 2-3 8-6 11-2 2-5 1-5-2z" fill="${c}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/><path d="M24 52c-3 12-2 22 1 30h10c-4-9-5-19-4-28zM76 52c3 12 2 22-1 30H65c4-9 5-19 4-28z" fill="${c}" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>`,
  careca:  ()  => '',
  coroa:   (c) => `<path d="M23 50c0-4 1-8 2-11 3 5 8 7 12 7v-8c-6 0-11-3-13-7 5-9 14-14 26-14 15 0 27 11 27 26 0 3 0 6-1 8-2-9-5-14-9-17-5 3-14 5-24 5-8 0-14-1-18-3-1 4-2 9-2 14z" fill="${c}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`,
  tranca:  (c) => `<g fill="${c}" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"><rect x="29" y="12" width="7" height="16" rx="3.5"/><rect x="38" y="9" width="7" height="18" rx="3.5"/><rect x="47" y="8" width="7" height="18" rx="3.5"/><rect x="56" y="9" width="7" height="18" rx="3.5"/><rect x="65" y="12" width="7" height="16" rx="3.5"/><path d="M24 46c0-18 12-28 26-28s26 10 26 28c-4-4-10-6-16-6H40c-6 0-12 2-16 6z"/></g>`,
}

// 🧔 barbas
export const BARBA = {
  nao:    () => '',
  cavan:  (c) => `<path d="M40 74c3 4 6 6 10 6s7-2 10-6c1 6-3 12-10 12s-11-6-10-12z" fill="${c}" stroke="${INK}" stroke-width="3"/>`,
  cheia:  (c) => `<path d="M25 52c0 22 11 34 25 34s25-12 25-34c2 14-2 32-11 38-5 3-23 3-28 0-9-6-13-24-11-38z" fill="${c}" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>`,
  bigode: (c) => `<path d="M39 68h22c0 4-5 6-11 6s-11-2-11-6z" fill="${c}" stroke="${INK}" stroke-width="3"/>`,
}

// 👕 CAMISA — as cores do clube, sem escudo (o desenho é o mesmo pra todos)
function camisa({ c1, c2 = c1, tipo = 'lisa' }) {
  const ombro = 'M8 120c2-22 14-34 26-38 5 6 10 9 16 9s11-3 16-9c12 4 24 16 26 38z'
  let dentro = `<rect x="0" y="70" width="100" height="50" fill="${c1}"/>`
  if (tipo === 'listras') dentro += [0,1,2,3,4].map(i => `<rect x="${10 + i*18}" y="70" width="9" height="50" fill="${c2}"/>`).join('')
  if (tipo === 'faixa')   dentro += `<path d="M14 120 78 70h16L30 120z" fill="${c2}"/>`
  if (tipo === 'meio')    dentro += `<rect x="42" y="70" width="16" height="50" fill="${c2}"/>`
  if (tipo === 'banda')   dentro += `<rect x="0" y="96" width="100" height="13" fill="${c2}"/>`
  return `<clipPath id="cam"><path d="${ombro}"/></clipPath>
    <g clip-path="url(#cam)">${dentro}</g>
    <path d="${ombro}" fill="none" stroke="${INK}" stroke-width="4.5" stroke-linejoin="round"/>`
}

// 🧑 o boneco montado
export function rosto({ pele = 'b', cabelo = 'curto', corCabelo = '#2B2118', barba = 'nao', c1 = '#fff', c2, tipo = 'lisa', id = 'x' }) {
  const p = PELE[pele] ?? PELE.b
  return `<svg viewBox="0 0 100 120" width="100%" style="display:block">
  ${camisa({ c1, c2, tipo })}
  <rect x="42" y="60" width="16" height="20" fill="${p}" stroke="${INK}" stroke-width="4"/>
  <ellipse cx="24" cy="48" rx="5" ry="7" fill="${p}" stroke="${INK}" stroke-width="3.5"/>
  <ellipse cx="76" cy="48" rx="5" ry="7" fill="${p}" stroke="${INK}" stroke-width="3.5"/>
  <ellipse cx="50" cy="45" rx="26" ry="30" fill="${p}" stroke="${INK}" stroke-width="4.5"/>
  ${(BARBA[barba] ?? BARBA.nao)(corCabelo)}
  <ellipse cx="40" cy="45" rx="3" ry="4" fill="${INK}"/>
  <ellipse cx="60" cy="45" rx="3" ry="4" fill="${INK}"/>
  <path d="M34 36c3-2 8-2 11 0M55 36c3-2 8-2 11 0" stroke="${INK}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
  <path d="M50 50v6" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
  <path d="M42 64c3 3 13 3 16 0" stroke="${INK}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
  ${(CABELO[cabelo] ?? CABELO.curto)(corCabelo)}
</svg>`.replace(/id="cam"/g, `id="cam${id}"`).replace(/url\(#cam\)/g, `url(#cam${id})`)
}
