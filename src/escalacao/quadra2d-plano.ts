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
  /** quem pegou o REBOTE do arremesso errado — índice no quinteto do outro lado (quem defendia) */
  reb?: number
  /** 🎬 jogada em DESTAQUE: a quadra encena por inteiro (~30 por jogo, espaçadas). As outras cestas sobem no placar como
   *  "cesta rápida", com o nome na faixa — o mesmo placar, os mesmos donos, em qualquer tela (quadra ou placar cinema). */
  destaque?: boolean
  /** uma das jogadas GARANTIDAS do quarto (mínimo de 3 por quarto) — a quadra nunca descarta essa */
  garantida?: boolean
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

/** quem joga: os 5 primeiros são o QUINTETO (PG..C, os que a quadra mostra); do 6º em diante, o BANCO que entrou no jogo
 *  (carreira: elenco com reservas). `pos` = a posição (0..4 = PG..C) — no banco é ela que diz se chuta de 3 ou enterra. */
export type JogadorPlano = { name: string; nivel?: number; pos?: number }
type Item = { tipo: TipoLance; quem?: number }

// 🏀 18/11 (Diego, "o que vale é o que a tela mostra"): quando o jogo diz QUANTOS PONTOS cada um fez (os mesmos que vão pras
// estatísticas da temporada), as cestas saem DE CADA JOGADOR — a soma de cada um fecha no que a estatística dele mostra.
// Bola de 3 pela posição (armador/ala-armador chutam mais de longe, pivô quase nunca), ~15% em lance livre.
const TAXA3 = [0.4, 0.42, 0.33, 0.2, 0.06]
function cestasDosJogadores(pts: number[], r: () => number, el: JogadorPlano[] = []): Item[] {
  const out: Item[] = []
  pts.forEach((p0, quem) => {
    const P = Math.max(0, Math.round(p0))
    const pos = Math.max(0, Math.min(4, el[quem]?.pos ?? quem))
    let tres = Math.max(0, Math.round(P * TAXA3[pos] * (0.75 + r() * 0.5) / 3))
    let ll = Math.max(0, Math.round(P * (0.1 + r() * 0.1)))
    let resto = P - tres * 3 - ll
    while (resto < 0 && tres > 0) { tres--; resto += 3 }
    if (resto < 0) { ll += resto; resto = 0 }
    if (resto % 2 === 1) { resto -= 1; ll += 1 }
    for (let k = 0; k < tres; k++) out.push({ tipo: 'tres', quem })
    const dentro = pos >= 3 ? ['enterrada', 'gancho', 'bandeja', 'meia'] as const : ['bandeja', 'meia', 'meia', 'enterrada'] as const
    for (let k = 0; k < resto / 2; k++) out.push({ tipo: dentro[Math.floor(r() * dentro.length)], quem })
    for (let k = 0; k < ll; k++) out.push({ tipo: 'lance', quem })
  })
  return out
}

/** 🏀 o roteiro do jogo. `seed` = a mesma semente do placar (ex.: sementeDasChances). Elencos = o quinteto (PG..C).
 *  `ptsCasa/ptsFora` = os pontos de cada um do quinteto NAQUELE jogo (a mesma conta das estatísticas); sem eles, o roteiro sorteia. */
export type ExtraPlano = { astCasa?: number[]; astFora?: number[]; rebCasa?: number[]; rebFora?: number[] }
/** distância mínima (minutos do relógio 0–93) entre duas jogadas em destaque — dá ~2 s de tela no jogo de 1 min */
export const GAP_DESTAQUE = 4
/** mínimo de jogadas encenadas em CADA quarto (Diego, 18/11) e os quartos no relógio 0–93 */
export const MIN_POR_QUARTO = 3
export const QUARTOS: [number, number][] = [[0, 23.25], [23.25, 46.5], [46.5, 69.75], [69.75, 93.01]]
export function planoQuadra(seed: number, casaFim: number, foraFim: number, elCasa: JogadorPlano[] = [], elFora: JogadorPlano[] = [], ptsCasa?: number[], ptsFora?: number[], extra: ExtraPlano = {}): PlanoQuadra {
  const r = rngDe(seed ^ 0xB45E7)
  const soma = (a?: number[]) => (a ?? []).reduce((x, y) => x + Math.max(0, Math.round(y)), 0)
  const valePts = (a: number[] | undefined, fim: number) => !!a && a.length > 0 && soma(a) === Math.round(fim)
  const cc: Item[] = valePts(ptsCasa, casaFim) ? cestasDosJogadores(ptsCasa!, r, elCasa) : cestasDoTime(Math.max(0, Math.round(casaFim)), r).map(tipo => ({ tipo }))
  const cf: Item[] = valePts(ptsFora, foraFim) ? cestasDosJogadores(ptsFora!, r, elFora) : cestasDoTime(Math.max(0, Math.round(foraFim)), r).map(tipo => ({ tipo }))
  // embaralha cada lista (os lances livres saem em dupla, do MESMO batedor: a falta dá 2 tiros seguidos)
  const emb = <T,>(a: T[]) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] } return a }
  const agrupa = (lista: Item[]): Item[][] => {
    const outros = emb(lista.filter(t => t.tipo !== 'lance')).map((t): Item[] => [t])
    const porQuem = new Map<number | undefined, Item[]>()
    for (const t of lista) if (t.tipo === 'lance') { const k = t.quem; porQuem.set(k, [...(porQuem.get(k) ?? []), t]) }
    const pares: Item[][] = []
    for (const ls of porQuem.values()) for (let k = 0; k < ls.length; k += 2) pares.push(ls.slice(k, k + 2))
    for (const p of pares) outros.splice(Math.floor(r() * (outros.length + 1)), 0, p)
    return outros
  }
  const gc = agrupa(cc), gf = agrupa(cf)
  // posses que NÃO pontuam (erro, toco, roubo) — dão vida e alternam a bola
  const vazias = (n: number): Item[][] => Array.from({ length: n }, () => { const v = r(); return [{ tipo: (v < 0.55 ? 'erro' : v < 0.78 ? 'toco' : 'roubo') as TipoLance }] })
  const posC = [...gc, ...vazias(Math.round(gc.length * 0.32))]
  const posF = [...gf, ...vazias(Math.round(gf.length * 0.32))]
  // espalha as vazias no meio das cheias
  const ehVazia = (p: Item[]) => ['erro', 'toco', 'roubo'].includes(p[0].tipo)
  const misturaVazias = (l: Item[][]) => { const cheias = l.filter(p => !ehVazia(p)); const vz = l.filter(ehVazia); for (const v of vz) cheias.splice(Math.floor(r() * (cheias.length + 1)), 0, v); return cheias }
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
  const pesoT = (p: Item[]) => p[0].tipo === 'lance' ? 0.55 : 1
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
    p.forEach((item, j) => {
      const tipo = item.tipo
      const t0 = t + dur * (j / n), t1 = t + dur * ((j + 1) / n)
      const pesos = (PESO[tipo] ?? PESO.erro).map((x, i) => x * (0.6 + nivelDe(el, i) * 0.8))
      // quem arremessa: o dono da cesta (quando o jogo diz os pontos de cada um) · lance livre: o mesmo batedor nas duas
      const quem = item.quem != null ? item.quem : tipo === 'lance' && j > 0 ? lances[lances.length - 1].quem : escolhe(pesos, r)
      const passe = tipo === 'lance' || tipo === 'roubo' || r() < 0.38 ? -1 : escolhe([3, 1.4, 1.2, 0.9, 0.7], r, quem)
      const pts = (tipo === 'tres' ? 3 : tipo === 'lance' ? 1 : tipo === 'erro' || tipo === 'toco' || tipo === 'roubo' ? 0 : 2) as Lance['pts']
      if (lado === 'casa') pc += pts; else pf += pts
      const { x, y } = pontoDo(tipo, r)
      const defensor = tipo === 'toco' ? escolhe([0.2, 0.4, 0.9, 1.8, 3], r) : tipo === 'roubo' ? escolhe([3, 2.2, 1.4, 0.7, 0.4], r) : undefined
      lances.push({ t0, t1, lado, pts, tipo, quem, passe, x, y, casa: pc, fora: pf, defensor })
    })
    t += dur
  })
  // 🅰️ ASSISTÊNCIAS que batem com a estatística do jogo: cada um dá exatamente o nº de passes da AST dele (nunca pra si mesmo)
  const r2 = rngDe(seed ^ 0xA5515)
  for (const [lado, ast] of [['casa', extra.astCasa], ['fora', extra.astFora]] as const) {
    if (!ast || !ast.some(x => x > 0)) continue
    const cestas = lances.filter(l => l.lado === lado && l.pts >= 2)
    cestas.forEach(l => { l.passe = -1 })
    const fila: number[] = []
    ast.forEach((n, i) => { for (let k = 0; k < Math.max(0, Math.round(n)); k++) fila.push(i) })
    for (let i = fila.length - 1; i > 0; i--) { const j = Math.floor(r2() * (i + 1)); [fila[i], fila[j]] = [fila[j], fila[i]] }
    const ordem = [...cestas]; for (let i = ordem.length - 1; i > 0; i--) { const j = Math.floor(r2() * (i + 1)); [ordem[i], ordem[j]] = [ordem[j], ordem[i]] }
    for (const passador of fila) {
      const alvo = ordem.find(l => l.passe < 0 && l.quem !== passador)
      if (alvo) alvo.passe = passador
    }
  }
  // 🏀 REBOTE de todo arremesso errado: quem defendia, pelo nº de rebotes de cada um no jogo (ou pela posição)
  for (const l of lances) if (l.tipo === 'erro') {
    const rb = l.lado === 'casa' ? extra.rebFora : extra.rebCasa
    // (só quem está em QUADRA pega rebote na tela — o quinteto)
    l.reb = escolhe(rb && rb.slice(0, 5).some(x => x > 0) ? rb.slice(0, 5).map(x => Math.max(0.2, x)) : [0.5, 0.6, 1, 1.6, 2], r2)
  }
  // 🎬 as jogadas em DESTAQUE (~30): enterrada, bola de 3, toco, roubo e as cestas do cestinha pesam mais; o fim do jogo pesa mais;
  // sempre com GAP_DESTAQUE entre uma e outra (a quadra precisa de ~2 s pra mostrar cada uma inteira)
  const somaQuem = (lado: 'casa' | 'fora') => { const m = [0, 0, 0, 0, 0]; for (const l of lances) if (l.lado === lado) m[l.quem] += l.pts; return m.indexOf(Math.max(...m)) }
  const cestinha = { casa: somaQuem('casa'), fora: somaQuem('fora') }
  const PESO_D: Record<TipoLance, number> = { enterrada: 3.6, tres: 3, toco: 3, roubo: 2.4, bandeja: 1.6, gancho: 1.6, meia: 1.4, erro: 0.9, lance: 0.25 }
  // só vira jogada encenada quem está em QUADRA (o quinteto): ponto de reserva é sempre cesta rápida, com o nome dele na faixa
  const emQuadra = (l: Lance) => l.quem < 5 && l.passe < 5
  const cand = lances.map((l, i) => ({ i, w: (PESO_D[l.tipo] + (l.quem === cestinha[l.lado] && l.pts > 0 ? 1.5 : 0) + (l.t1 > 86 ? 2 : 0)) * (0.7 + r2() * 0.6) }))
    .sort((a, b) => b.w - a.w)
  const escolhidos: number[] = []
  // ⏱️ quanto tempo de relógio precisa entre duas jogadas encenadas: o MESMO time atacando a MESMA cesta = ~4 min; a bola trocando
  // de lado (o outro time, ou o intervalo virando a quadra) = todo mundo atravessa a quadra correndo = ~7 min
  const mesmaCesta = (a: Lance, b: Lance) => a.lado === b.lado && (a.t1 < 46.5) === (b.t1 < 46.5)
  const folga = (a: Lance, b: Lance) => (mesmaCesta(a, b) ? GAP_DESTAQUE : 7)
  const cabe = (i: number) => emQuadra(lances[i]) && lances[i].t1 >= 6 && escolhidos.every(e => Math.abs(lances[e].t1 - lances[i].t1) >= folga(lances[e], lances[i]))
  // 🕐 18/11 (Diego: *"tem que ter um mínimo de destaque do 1º, 2º, 3º e 4º quarto"*): primeiro garante as melhores de CADA quarto,
  // depois completa com as melhores do jogo todo
  for (const [ini, fim] of QUARTOS) {
    // (o `cabe` já dá o tempo de corrida certo entre uma jogada e outra — ver `folga`)
    const tenta = (lista: typeof cand) => {
      const feitos: number[] = []
      for (const c of lista) {
        if (feitos.length >= MIN_POR_QUARTO) break
        const t = lances[c.i].t1
        if (t >= ini && t < fim && cabe(c.i)) { escolhidos.push(c.i); feitos.push(c.i) }
      }
      return feitos
    }
    // 1º as mais bonitas do quarto; se não couberem 3, a ordem do relógio (a que mais encaixa jogadas no quarto)
    let feitos = tenta(cand)
    if (feitos.length < MIN_POR_QUARTO) {
      for (const f of feitos) escolhidos.splice(escolhidos.indexOf(f), 1)
      feitos = tenta([...cand].sort((x, y) => lances[x.i].t1 - lances[y.i].t1))
    }
    for (const f of feitos) lances[f].garantida = true
  }
  // as outras entram onde couber
  for (const c of cand) if (cabe(c.i)) escolhidos.push(c.i)
  for (const e of escolhidos) lances[e].destaque = true
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
