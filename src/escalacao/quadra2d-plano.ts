// 🏀📺 QUADRA 2D — o ROTEIRO do jogo (18/11, mockup aprovado pelo Diego: *"Pode sim"*).
//
// A quadra NÃO decide nada: o placar final vem do jogo (`simMatch`). Daqui sai só COMO os pontos
// aconteceram — quem arremessou, de onde, quanto valeu e em que minuto — e a soma fecha SEMPRE no
// placar real (`placarEm(93)` = final). Mesma entrada → mesmo roteiro (todo aparelho da sala vê igual).
//
// 🎯 Regra do Diego (18/11): *"qd faz pts de 3 ele está fora da marcação real?"* → cesta de 3 SEMPRE
// sai de fora da linha de 3 de verdade (no canto, entre a linha e a lateral), cesta de 2 SEMPRE de
// dentro e lance livre da linha do lance livre. Trava: `npm run quadra2d`.
//
// Medidas em PÉS, na quadra da NBA (94 × 50). O time que ATACA a cesta da DIREITA usa x crescente;
// o motor guarda tudo como se fosse pra direita e a tela espelha quando o ataque é pra esquerda.

export const QUADRA = { comp: 94, larg: 50, aroX: 88.75, aroY: 25, raio3: 23.75, canto3Y: 3, canto3Ate: 14, linhaLL: 75 } as const

export type TipoLance = 'tres' | 'enterrada' | 'bandeja' | 'meia' | 'gancho' | 'lance' | 'erro' | 'toco' | 'roubo'
export type Lance = {
  /** minuto do relógio do placar (0..93) em que a posse começa e em que a bola chega */
  t0: number; t1: number
  lado: 'casa' | 'fora'
  pts: 0 | 1 | 2 | 3
  tipo: TipoLance
  /** índice (0..4) no quinteto: quem arremessa e quem deu o passe (−1 = sem passe) */
  quem: number; passe: number
  /** de onde sai o arremesso, em pés, atacando pra DIREITA */
  x: number; y: number
  /** placar ACUMULADO depois deste lance */
  casa: number; fora: number
  /** quem defendeu (toco/roubo) — índice no quinteto do outro lado */
  defensor?: number
}
export type PlanoQuadra = { lances: Lance[]; casaFim: number; foraFim: number }

const FIM = 93 // o relógio do card vai de 0 a 93 (4 quartos)

function rngDe(seed: number) {
  let a = seed >>> 0 || 1
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}

/** distância (pés) até o aro da direita */
export const distAro = (x: number, y: number) => Math.hypot(x - QUADRA.aroX, y - QUADRA.aroY)
/** a bola sai de FORA da linha de 3? (arco + os dois cantos retos, igual à NBA) */
export function foraDaLinha3(x: number, y: number): boolean {
  const deBaseline = QUADRA.comp - x
  if (deBaseline <= QUADRA.canto3Ate) return y <= QUADRA.canto3Y || y >= QUADRA.larg - QUADRA.canto3Y
  return distAro(x, y) >= QUADRA.raio3
}

// 🎯 o ponto do arremesso, sempre na zona certa do tipo
function pontoDo(tipo: TipoLance, r: () => number): { x: number; y: number } {
  if (tipo === 'lance') return { x: QUADRA.linhaLL, y: QUADRA.aroY }
  if (tipo === 'tres') {
    if (r() < 0.28) { // canto: entre a linha e a lateral
      const cima = r() < 0.5
      return { x: QUADRA.comp - 2 - r() * 9, y: cima ? 0.8 + r() * 1.6 : QUADRA.larg - 0.8 - r() * 1.6 }
    }
    // arco: 1 a 4 pés pra fora da linha, ângulo longe dos cantos
    const ang = (-62 + r() * 124) * Math.PI / 180, d = QUADRA.raio3 + 1 + r() * 3
    return { x: QUADRA.aroX - Math.cos(ang) * d, y: QUADRA.aroY + Math.sin(ang) * d }
  }
  if (tipo === 'enterrada' || tipo === 'bandeja' || tipo === 'toco') {
    const ang = (-70 + r() * 140) * Math.PI / 180, d = 1.5 + r() * 3.5
    return { x: QUADRA.aroX - Math.cos(ang) * d, y: QUADRA.aroY + Math.sin(ang) * d }
  }
  if (tipo === 'gancho') {
    const ang = (-60 + r() * 120) * Math.PI / 180, d = 5 + r() * 5
    return { x: QUADRA.aroX - Math.cos(ang) * d, y: QUADRA.aroY + Math.sin(ang) * d }
  }
  // meia distância / erro / roubo: dentro da linha, longe do aro
  const ang = (-75 + r() * 150) * Math.PI / 180, d = 10 + r() * 10
  return { x: QUADRA.aroX - Math.cos(ang) * d, y: QUADRA.aroY + Math.sin(ang) * d }
}

// quem arremessa: posição (PG..C = 0..4) × tipo, com o nível da carta somando
const PESO: Record<string, number[]> = {
  tres: [3.2, 3.6, 2.4, 1.1, 0.35],
  enterrada: [0.4, 1.2, 2.0, 2.8, 3.6],
  bandeja: [2.6, 2.4, 2.0, 1.2, 0.9],
  meia: [2.0, 2.6, 2.4, 1.8, 0.9],
  gancho: [0.1, 0.2, 0.6, 2.2, 3.6],
  lance: [1.6, 1.8, 1.8, 1.8, 1.6],
  erro: [2.4, 2.4, 2.0, 1.4, 1.0],
}
function escolhe(pesos: number[], r: () => number, menos = -1): number {
  const w = pesos.map((p, i) => (i === menos ? 0 : p))
  const tot = w.reduce((a, b) => a + b, 0) || 1
  let x = r() * tot
  for (let i = 0; i < w.length; i++) { x -= w[i]; if (x <= 0) return i }
  return w.length - 1
}

/** os pontos de um time viram uma lista de cestas (3, 2, lance livre) que SOMA exatamente `pts` */
function cestasDoTime(pts: number, r: () => number): TipoLance[] {
  const out: TipoLance[] = []
  const lances = Math.max(0, Math.round(pts * (0.13 + r() * 0.08))) // ~17% de lance livre, como na NBA
  let tres = Math.max(0, Math.round(pts * (0.27 + r() * 0.12) / 3))
  let resto = pts - lances - tres * 3
  while (resto < 0 && tres > 0) { tres--; resto += 3 }
  let ll = lances
  if (resto < 0) { ll += resto; resto = 0 }
  if (resto % 2 === 1) { resto -= 1; ll += 1 }
  for (let i = 0; i < tres; i++) out.push('tres')
  for (let i = 0; i < resto / 2; i++) { const v = r(); out.push(v < 0.22 ? 'enterrada' : v < 0.55 ? 'bandeja' : v < 0.85 ? 'meia' : 'gancho') }
  // lance livre em PARES (falta no arremesso de 2), sobra 1 vira "and-one"/técnica
  while (ll > 0) { out.push('lance'); ll-- }
  return out
}

export type JogadorPlano = { name: string; nivel?: number }

/** 🏀 o roteiro do jogo. `seed` = a mesma semente do placar (ex.: sementeDasChances). Elencos = o quinteto (PG..C). */
export function planoQuadra(seed: number, casaFim: number, foraFim: number, elCasa: JogadorPlano[] = [], elFora: JogadorPlano[] = []): PlanoQuadra {
  const r = rngDe(seed ^ 0xB45E7)
  const cc = cestasDoTime(Math.max(0, Math.round(casaFim)), r)
  const cf = cestasDoTime(Math.max(0, Math.round(foraFim)), r)
  // embaralha cada lista (os lances livres saem em dupla: a falta dá 2 tiros seguidos)
  const emb = <T,>(a: T[]) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] } return a }
  const agrupa = (lista: TipoLance[]): TipoLance[][] => {
    const ll = lista.filter(t => t === 'lance').length
    const outros = emb(lista.filter(t => t !== 'lance')).map((t): TipoLance[] => [t])
    const pares: TipoLance[][] = []
    for (let k = 0; k < Math.floor(ll / 2); k++) pares.push(['lance', 'lance'])
    if (ll % 2) pares.push(['lance'])
    for (const p of pares) outros.splice(Math.floor(r() * (outros.length + 1)), 0, p)
    return outros
  }
  const gc = agrupa(cc), gf = agrupa(cf)
  // posses que NÃO pontuam (erro, toco, roubo) — dão vida e alternam a bola
  const vazias = (n: number): TipoLance[][] => Array.from({ length: n }, () => { const v = r(); return [v < 0.55 ? 'erro' : v < 0.78 ? 'toco' : 'roubo'] as TipoLance[] })
  const posC = [...gc, ...vazias(Math.round(gc.length * 0.32))]
  const posF = [...gf, ...vazias(Math.round(gf.length * 0.32))]
  // espalha as vazias no meio das cheias
  const misturaVazias = (l: TipoLance[][]) => { const cheias = l.filter(p => !['erro', 'toco', 'roubo'].includes(p[0])); const vz = l.filter(p => ['erro', 'toco', 'roubo'].includes(p[0])); for (const v of vz) cheias.splice(Math.floor(r() * (cheias.length + 1)), 0, v); return cheias }
  const seqC = misturaVazias(posC), seqF = misturaVazias(posF)
  // intercala as posses dos dois lados (quem tem mais posses ganha algumas seguidas)
  const ordem: ('casa' | 'fora')[] = []
  let ic = 0, iF = 0, vez: 'casa' | 'fora' = r() < 0.5 ? 'casa' : 'fora'
  while (ic < seqC.length || iF < seqF.length) {
    if (vez === 'casa' && ic >= seqC.length) vez = 'fora'
    if (vez === 'fora' && iF >= seqF.length) vez = 'casa'
    ordem.push(vez)
    if (vez === 'casa') ic++; else iF++
    const faltaC = seqC.length - ic, faltaF = seqF.length - iF
    const extra = faltaC > faltaF + 1 ? 'casa' : faltaF > faltaC + 1 ? 'fora' : null
    vez = extra && r() < 0.35 ? extra : (vez === 'casa' ? 'fora' : 'casa')
  }
  // tempo de cada posse: proporcional (lance livre é rápido), com jitter; ocupa 1..92
  const pesoT = (p: TipoLance[]) => p[0] === 'lance' ? 0.55 : 1
  ic = 0; iF = 0
  const posses = ordem.map(l => (l === 'casa' ? seqC[ic++] : seqF[iF++]))
  const w = posses.map(p => pesoT(p) * (0.75 + r() * 0.5))
  const tot = w.reduce((a, b) => a + b, 0) || 1
  const nivelDe = (el: JogadorPlano[], i: number) => el[i]?.nivel ?? 0.5
  const lances: Lance[] = []
  let t = 0.6, pc = 0, pf = 0
  posses.forEach((p, k) => {
    const dur = (FIM - 1.4) * w[k] / tot
    const lado = ordem[k], el = lado === 'casa' ? elCasa : elFora
    const n = p.length
    p.forEach((tipo, j) => {
      const t0 = t + dur * (j / n), t1 = t + dur * ((j + 1) / n)
      const pesos = (PESO[tipo] ?? PESO.erro).map((x, i) => x * (0.6 + nivelDe(el, i) * 0.8))
      // lance livre: o mesmo batedor nas duas
      const quem = tipo === 'lance' && j > 0 ? lances[lances.length - 1].quem : escolhe(pesos, r)
      const passe = tipo === 'lance' || tipo === 'roubo' || r() < 0.38 ? -1 : escolhe([3, 1.4, 1.2, 0.9, 0.7], r, quem)
      const pts = (tipo === 'tres' ? 3 : tipo === 'lance' ? 1 : tipo === 'erro' || tipo === 'toco' || tipo === 'roubo' ? 0 : 2) as Lance['pts']
      if (lado === 'casa') pc += pts; else pf += pts
      const { x, y } = pontoDo(tipo, r)
      const defensor = tipo === 'toco' ? escolhe([0.2, 0.4, 0.9, 1.8, 3], r) : tipo === 'roubo' ? escolhe([3, 2.2, 1.4, 0.7, 0.4], r) : undefined
      lances.push({ t0, t1, lado, pts, tipo, quem, passe, x, y, casa: pc, fora: pf, defensor })
    })
    t += dur
  })
  return { lances, casaFim: pc, foraFim: pf }
}

/** placar acumulado até o minuto `min` (só cesta que JÁ caiu — nunca spoiler) */
export function placarEm(plano: PlanoQuadra, min: number): { casa: number; fora: number; ultimo?: Lance } {
  let ultimo: Lance | undefined
  for (const l of plano.lances) { if (l.t1 <= min) ultimo = l; else break }
  return { casa: ultimo?.casa ?? 0, fora: ultimo?.fora ?? 0, ultimo }
}
/** a posse que está rolando no minuto `min` */
export function posseEm(plano: PlanoQuadra, min: number): { atual?: Lance; i: number } {
  const ls = plano.lances
  for (let i = 0; i < ls.length; i++) if (min < ls[i].t1) return { atual: ls[i], i }
  return { atual: ls[ls.length - 1], i: ls.length - 1 }
}
