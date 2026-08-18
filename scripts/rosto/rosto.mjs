// ─── 🧑 ROSTO DE JOGADOR — sistema de peças (mockup) ─────────────────────────
// A ideia: NÃO desenhar 1.414 jogadores. Desenhar UM boneco e trocar as peças —
// pele, cabelo, barba e as cores da camisa. O desenho é código (entra uma vez);
// cada jogador guarda só 3-4 números. Mesma lógica do MANTO do jogo, que já é
// listra em CSS (0 KB) em vez de imagem de camisa.
//
// Identidade da casa, não a do concorrente: traço preto GROSSO, cores chapadas,
// sem degradê, sombra dura deslocada.
//
// ── DUAS COISAS QUE FAZEM O CABELO FICAR BOM (aprendido na marra, 18/08) ─────
// O Diego reprovou a 1ª versão: "olha o cabelo do gaúcho q ridículo.. do
// Batistuta". Estava ridículo por dois motivos técnicos:
//
// 1. **Cabelo tem CAMADA DE TRÁS.** Antes tudo era desenhado por cima do rosto,
//    então cabelo comprido virava capacete tapando a bochecha. Agora cada
//    cabelo tem `atras` (cai atrás da cabeça e no ombro) e `frente` (o topo).
//    Ordem: camisa → cabelo de trás → pescoço → orelha → rosto → barba →
//    olhos/boca → cabelo da frente.
// 2. **Contorno de UNIÃO.** Cabelo cacheado/afro é feito de várias bolas. Se
//    cada bola tiver contorno, aparece risco preto no meio do cabelo. O truque
//    do `uni()`: desenha TODAS as formas só com traço grosso, e depois desenha
//    as MESMAS formas preenchidas por cima — sobra só o contorno de fora, como
//    se fosse uma peça só.
const INK = '#0C0C0C'

// contorno de união: traço grosso embaixo, preenchimento em cima → só a
// silhueta de fora fica preta (sem risco no meio das mechas)
const uni = (formas, c, w = 8) =>
  `<g><g fill="none" stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round">${formas}</g>` +
  `<g fill="${c}" stroke="none">${formas}</g></g>`

// 🎨 tons de pele
export const PELE = {
  a: '#F3C9A0', b: '#E0A97B', c: '#C07E4E', d: '#8A5430', e: '#5A3418', f: '#FAD9BC',
}

// ── formas reaproveitadas ───────────────────────────────────────────────────
// A cabeça é uma elipse (50,45) raio 26x30 → topo y=15, queixo y=75.
// A touca do cabelo é um arco um pouco MAIOR que o crânio, fechado por baixo
// com a linha do cabelo (a franja).
const TOUCA   = '<path d="M22.5 47 A27.5 31.5 0 0 1 77.5 47 C75 36 70 31 63 30 C56 33 44 33 37 30 C30 31 25 36 22.5 47 Z"/>'
const TOUCA_R = '<path d="M24.5 46 A26.5 30.5 0 0 1 75.5 46 C74 39 70 35 64 34 C56 37 44 37 36 34 C30 35 26 39 24.5 46 Z"/>'
const TOUCA_G = '<path d="M22 48 A29 33.5 0 0 1 78 48 C75 37 70 32 63 31 C56 34 44 34 37 31 C30 32 25 37 22 48 Z"/>'
// touca penteada PRA TRÁS (sem franja caindo na testa) — é o que tira a cara
// de "corte de moça" no cabelo comprido
const TOUCA_T = '<path d="M22.5 47 A27.5 31.5 0 0 1 77.5 47 C76 38 72 33 65 31 C58 29 42 29 35 31 C28 33 24 38 22.5 47 Z"/>'
// juba: cai dos dois lados, com o miolo vazado (o rosto entra ali).
// CURTA e da LARGURA DO ROSTO de propósito: juba larga + rosto redondo dava
// cara de moça (foi o que o Diego reclamou no Batistuta). Assim a orelha
// aparece por cima e lê como "cabelo até o ombro, atrás da orelha".
const JUBA    = '<path d="M24 46 C24 25 35 13 50 13 C65 13 76 25 76 46 L76 68 C76 74 71 76 67 73 C64 71 64 66 64 60 L64 54 C64 45 58 41 50 41 C42 41 36 45 36 54 L36 60 C36 66 36 71 33 73 C29 76 24 74 24 68 Z"/>'
// juba GRANDE, pro cabeludo cacheado (Ronaldinho)
const JUBA_G  = '<path d="M17 50 C17 24 32 11 50 11 C68 11 83 24 83 50 L83 90 C83 97 76 99 71 96 C68 94 67 87 67 79 L67 57 C67 45 60 39 50 39 C40 39 33 45 33 57 L33 79 C33 87 32 94 29 96 C24 99 17 97 17 90 Z"/>'

// ✂️ CABELOS — `atras` cai atrás da cabeça, `frente` fica por cima.
// (a chave é o que o jogador guarda no baralho: ~3 letras, ~3 bytes)
export const CABELO = {
  // aparado, com franjinha
  curto: { frente: c => uni(TOUCA, c) },

  // curto com a risca de lado (pra 6 caras de cabelo curto não virarem clones)
  risca: {
    frente: c => uni(TOUCA, c) +
      `<path d="M37 30 C36 24 35.5 20 36 16" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round" opacity=".8"/>`,
  },

  // curto com topetinho na frente
  topete: {
    frente: c => uni('<path d="M22.5 47 A27.5 31.5 0 0 1 77.5 47 C75 36 70 31 63 30 C61 21 51 18 45 22 C42 25 41 28 40 31 C31 31 25 36 22.5 47 Z"/>', c),
  },

  // raspado rente ao crânio
  raspado: { frente: c => uni(TOUCA_R, c) },

  // cacheado curto: touca com caroços em cima (união, sem risco no meio).
  // Aceita 2ª cor = CABELO PINTADO: base escura embaixo, cacho descolorido em
  // cima (é o visual do Yamal — o Diego cobrou: "o yamal q tem cabelo pintado
  // N tá").
  cacheado: {
    frente: (c, c2) => uni(TOUCA_G, c) +
      uni('<circle cx="27" cy="38" r="8.5"/><circle cx="35" cy="26" r="9.5"/>' +
        '<circle cx="50" cy="21" r="10.5"/><circle cx="65" cy="26" r="9.5"/>' +
        '<circle cx="73" cy="38" r="8.5"/>', c2 || c),
  },

  // afro: o volumão fica ATRÁS (halo), na frente só a touca — assim a testa
  // aparece e o cabelo não come o rosto
  afro: {
    atras: c => uni('<circle cx="50" cy="33" r="32"/><circle cx="20" cy="42" r="17"/>' +
      '<circle cx="80" cy="42" r="17"/><circle cx="27" cy="17" r="15"/>' +
      '<circle cx="73" cy="17" r="15"/>', c),
    frente: c => uni(TOUCA_G, c),
  },

  // moicano: laterais rentes + a crista no meio
  moicano: {
    frente: c => uni('<path d="M24.5 47 A26.5 30.5 0 0 1 75.5 47 C74 41 70 38 64 37 C56 39 44 39 36 37 C30 38 26 41 24.5 47 Z"/>' +
      '<path d="M41 44 C41 24 45 10 50 10 C55 10 59 24 59 44 C56 41 44 41 41 44 Z"/>', c),
  },

  // comprido liso: cai dos dois lados até o ombro (Batistuta)
  longo: {
    atras: c => uni(JUBA, c),
    frente: c => uni(TOUCA_T, c),
  },

  // comprido cacheado: mesma juba, mas com cachos na borda (Ronaldinho)
  cachos: {
    atras: c => uni(JUBA_G +
      '<circle cx="20" cy="34" r="10"/><circle cx="29" cy="19" r="11"/>' +
      '<circle cx="50" cy="12" r="12"/><circle cx="71" cy="19" r="11"/>' +
      '<circle cx="80" cy="34" r="10"/><circle cx="20" cy="72" r="9"/>' +
      '<circle cx="80" cy="72" r="9"/><circle cx="22" cy="89" r="8"/>' +
      '<circle cx="78" cy="89" r="8"/>', c),
    frente: c => uni(TOUCA_G +
      '<circle cx="28" cy="34" r="9"/><circle cx="38" cy="24" r="9.5"/>' +
      '<circle cx="62" cy="24" r="9.5"/><circle cx="72" cy="34" r="9"/>', c),
  },

  // mullet cacheado (Maradona): mata-cachorro CURTO na nuca + mop cacheado em
  // cima. A 1ª versão descia até o ombro pelos dois lados do rosto e virava um
  // chanel — o Diego reclamou ("olha q ridículo tá o Maradona"). O rabo agora
  // é estreito e para logo abaixo do maxilar.
  mullet: {
    atras: c => uni('<path d="M34 54 C34 46 40 42 50 42 C60 42 66 46 66 54 L66 70 C66 78 64 84 61 85 C58 86 55.5 84.5 55.5 82 L44.5 82 C44.5 84.5 42 86 39 85 C36 84 34 78 34 70 Z"/>', c),
    frente: c => uni(TOUCA_G +
      '<circle cx="27" cy="38" r="8"/><circle cx="36" cy="26" r="9.5"/>' +
      '<circle cx="50" cy="21" r="10"/><circle cx="64" cy="26" r="9.5"/>' +
      '<circle cx="73" cy="38" r="8"/>', c),
  },

  // trança/cornrow: a touca com as divisões das tranças. Riscos CURTOS e
  // finos — riscos longos viravam uma rede na cabeça.
  tranca: {
    frente: c => uni(TOUCA_R, c) +
      `<g fill="none" stroke="${INK}" stroke-width="2.2" stroke-linecap="round" opacity=".85">` +
      '<path d="M34 32 C34 26 37 22 41 20"/><path d="M44 27 C44 23 46 20 48 18"/>' +
      '<path d="M56 27 C56 23 54 20 52 18"/><path d="M66 32 C66 26 63 22 59 20"/></g>',
  },

  // coroa: careca no alto, cabelo só na beirada (Zidane)
  coroa: {
    frente: c => uni('<path d="M22.5 53 C22.5 34 34 23 50 23 C66 23 77.5 34 77.5 53 C77 46 74 42 69 41 C67 33 60 29 50 29 C40 29 33 33 31 41 C26 42 23 46 22.5 53 Z"/>', c),
  },

  careca: { frente: () => '' },
}

// 🧔 barbas
export const BARBA = {
  nao: () => '',
  // cavanhaque: bigodinho fino + queixo pequeno. As duas peças ficam LONGE da
  // boca de propósito — grudadas nela viravam um borrão preto.
  cavan: c => uni('<path d="M39 59.5 C43.5 57 56.5 57 61 59.5 C56.5 61.8 43.5 61.8 39 59.5 Z"/>' +
    '<path d="M41 70 C41 67.5 59 67.5 59 70 C59 77.5 55.5 81 50 81 C44.5 81 41 77.5 41 70 Z"/>', c, 5),
  // barba cheia: pega o maxilar todo
  cheia: c => uni('<path d="M26 50 C30 56 38 59 50 59 C62 59 70 56 74 50 C74 71 64 85 50 85 C36 85 26 71 26 50 Z"/>' +
    '<path d="M38 59 C42 55.5 58 55.5 62 59 C58 61.5 42 61.5 38 59 Z"/>', c, 6),
  // só bigode (Valderrama)
  bigode: c => uni('<path d="M36 59 C41 55 59 55 64 59 C60 63 40 63 36 59 Z"/>', c, 6),
}

// 👕 CAMISA — as cores do clube, sem escudo (o desenho é o mesmo pra todos)
function camisa({ c1, c2 = c1, tipo = 'lisa' }, id) {
  const ombro = 'M8 120c2-22 14-34 26-38 5 6 10 9 16 9s11-3 16-9c12 4 24 16 26 38z'
  let dentro = `<rect x="0" y="70" width="100" height="50" fill="${c1}"/>`
  if (tipo === 'listras') dentro += [0,1,2,3,4].map(i => `<rect x="${10 + i*18}" y="70" width="9" height="50" fill="${c2}"/>`).join('')
  if (tipo === 'faixa')   dentro += `<path d="M14 120 78 70h16L30 120z" fill="${c2}"/>`
  if (tipo === 'meio')    dentro += `<rect x="42" y="70" width="16" height="50" fill="${c2}"/>`
  if (tipo === 'banda')   dentro += `<rect x="0" y="96" width="100" height="13" fill="${c2}"/>`
  return `<clipPath id="cam${id}"><path d="${ombro}"/></clipPath>
    <g clip-path="url(#cam${id})">${dentro}</g>
    <path d="${ombro}" fill="none" stroke="${INK}" stroke-width="4.5" stroke-linejoin="round"/>`
}

// 🧑 o boneco montado — a ordem aqui é o que faz o cabelo funcionar
// `pintado` = 2ª cor do cabelo (descolorido/tingido). Só os cortes que sabem
// usar duas cores olham pra ela; os outros ignoram.
export function rosto({ pele = 'b', cabelo = 'curto', corCabelo = '#2B2118', pintado, barba = 'nao', c1 = '#fff', c2, tipo = 'lisa', id = 'x' }) {
  const p = PELE[pele] ?? PELE.b
  const cab = CABELO[cabelo] ?? CABELO.curto
  // boca preta em cima de barba cheia preta = boca some. Aí ela vira clara.
  const boca = barba === 'cheia' ? '#F4ECD6' : INK
  return `<svg viewBox="0 0 100 120" width="100%" style="display:block">
  ${camisa({ c1, c2, tipo }, id)}
  ${cab.atras ? cab.atras(corCabelo, pintado) : ''}
  <rect x="42" y="60" width="16" height="20" fill="${p}" stroke="${INK}" stroke-width="4"/>
  <ellipse cx="24" cy="48" rx="5" ry="7" fill="${p}" stroke="${INK}" stroke-width="3.5"/>
  <ellipse cx="76" cy="48" rx="5" ry="7" fill="${p}" stroke="${INK}" stroke-width="3.5"/>
  <ellipse cx="50" cy="45" rx="26" ry="30" fill="${p}" stroke="${INK}" stroke-width="4.5"/>
  ${(BARBA[barba] ?? BARBA.nao)(corCabelo)}
  <ellipse cx="40" cy="45" rx="3" ry="4" fill="${INK}"/>
  <ellipse cx="60" cy="45" rx="3" ry="4" fill="${INK}"/>
  <path d="M34 36c3-2 8-2 11 0M55 36c3-2 8-2 11 0" stroke="${INK}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
  <path d="M50 50v6" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
  <path d="M42 64c3 3 13 3 16 0" stroke="${boca}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
  ${cab.frente(corCabelo, pintado)}
</svg>`
}
