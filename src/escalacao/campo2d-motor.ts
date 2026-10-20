// 📺 CAMPO 2D — O MOTOR DAS JOGADAS (20/10, a partir do protótipo que o Diego aprovou: *"achei sensacional… gostei muito do
// motor, a bola batendo na trave"*). Puro: sem React, sem tela.
//
// O que ele faz: pega os GOLS e as CHANCES que o jogo JÁ calculou (minuto, lado, autor, como terminou) e monta em volta deles
// as jogadas que aparecem no campinho — troca de passe, drible, enfiada, cruzamento, cabeçada, chute de fora, escanteio,
// falta, contra-ataque, desarme, defesa do goleiro, trave, pra fora, isolou. O que ele NÃO faz: decidir resultado. O gol do
// campinho é o gol do motor do jogo (mesmo autor, mesmo minuto).
//
// Regras da casa:
//   · 🎲 DETERMINÍSTICO: tudo sai da semente + passo fixo de simulação. No online, cada aparelho desenha o mesmo jogo.
//   · ⏱️ O RELÓGIO MANDA: o tempo da simulação é o minuto do placar × SEG_POR_MIN. Acelerou no Modo Manual, o campinho acelera
//     junto; o placar parou, o campinho para.
//   · 🃏 Estilo só das lendas (`campo2d-estilos.ts`); o resto joga no neutro da posição.
import { estiloDe, type Estilo } from './campo2d-estilos'

export const W = 68, L = 105
/** 93' em 90 s no automático do 2D (decisão do Diego: 1:30 por jogo) */
export const SEG_POR_MIN = 90 / 93
export const DUR_2D_MS = Math.round(90_000 / 0.82) // o `roundMs` que faz o placar andar 93' em 90 s (o placar anima em roundMs × 0,82)
const DT = 1 / 50
const ANTECEDE = 8.5 // segundos de jogada antes de um evento (gol/chance)
const FESTA = 4.2 // segundos de comemoração do gol

export type Lado = 0 | 1 // 0 = mandante (ataca pra CIMA, y → 0)
export type Fim = 'gol' | 'defendeu' | 'trave' | 'fora' | 'isolou'
export interface Evento { min: number; lado: Lado; fim: Fim; autor?: string; assist?: string }
export interface CartaCampo { name: string; pos?: string; club?: string; year?: number; fame?: number; fake?: boolean }
type Grupo = 'GOL' | 'DEF' | 'LAT' | 'MEI' | 'ATA'
export interface Atleta { lado: Lado; nome: string; carta?: CartaCampo; estilo: Estilo; grupo: Grupo; bx: number; dep: number; x: number; y: number; /** onde estava no passo anterior (só pro DESENHO ficar liso) */ ax?: number; ay?: number; ov: { x: number; y: number; v: number } | null }
interface Voo { x0: number; y0: number; x1: number; y1: number; t: number; dur: number; alt: number; lin: boolean; fim?: () => void }
type Acao = { ini?: () => void; upd: (dt: number) => boolean; pre?: boolean }

function mulberry(seed: number) { return () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 } }
// escolhe UMA vez e lembra (sem isto, cada chamada sorteava outro jogador e a jogada nunca fechava)
const umaVez = <T,>(f: () => T): (() => T) => { let v: T | undefined; return () => (v === undefined ? (v = f()) : v) }
const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y)
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))
const grupoDe = (pos?: string): Grupo => pos === 'GOL' ? 'GOL' : pos === 'LAT' ? 'LAT' : pos === 'ZAG' ? 'DEF' : pos === 'MEI' ? 'MEI' : 'ATA'

// ── montar o time: a escalação real vira 11 no campo, cada linha espalhada na largura ─────────────────────────────────────
function montaTime(lado: Lado, cartas: CartaCampo[]): Atleta[] {
  const lista = cartas.slice(0, 11)
  while (lista.length < 11) lista.push({ name: '', pos: lista.some(c => c.pos === 'GOL') ? 'MEI' : 'GOL' })
  const por: Record<Grupo, CartaCampo[]> = { GOL: [], DEF: [], LAT: [], MEI: [], ATA: [] }
  for (const c of lista) por[grupoDe(c.pos)].push(c)
  if (!por.GOL.length) por.GOL.push((por.DEF.pop() ?? por.MEI.pop())!)
  const out: Atleta[] = []
  const linha = (cs: CartaCampo[], dep: number, gr: (i: number, n: number) => Grupo) => cs.forEach((c, i) => {
    const n = cs.length, bx = n === 1 ? 34 : 9 + (50 * i) / (n - 1)
    out.push({ lado, nome: c.name, carta: c, estilo: estiloDe(c.name, c.fame), grupo: gr(i, n), bx, dep: gr(i, n) === 'LAT' ? dep - 0.12 : dep, x: 34, y: 52, ov: null })
  })
  linha(por.GOL.slice(0, 1), 0, () => 'GOL')
  // defesa: laterais nas pontas, zagueiros no meio
  const lats = por.LAT, zags = [...por.DEF, ...por.GOL.slice(1)]
  const defesa = lats.length >= 2 ? [lats[0], ...zags, ...lats.slice(1)] : [...lats, ...zags]
  linha(defesa, 1, (i, n) => (lats.length >= 2 && (i === 0 || i === n - 1)) || (lats.length === 1 && i === 0) ? 'LAT' : 'DEF')
  linha(por.MEI, 0.58, () => 'MEI')
  linha(por.ATA, 0.08, () => 'ATA')
  return out
}

export class Jogo2D {
  t = 0
  atl: Atleta[]
  bola = { x: 34, y: L / 2, h: 0, dono: null as Atleta | null, voo: null as Voo | null }
  posse: Lado = 0
  tatica: [number, number] = [0, 0] // -1 retranca · 0 equilíbrio · 1 ataque (as 3 que o jogo já tem)
  narra = ''
  festa: { ate: number; lado: Lado; autor: string; assist?: string; min: number } | null = null
  rede: { y0: number; t0: number } | null = null
  placar: [number, number] = [0, 0]
  /** 🔎 conferência das REGRAS (o teste lê): bola colocada parada (saída, lateral, escanteio, tiro de meta, falta) ·
   *  bola que "voou" sozinha pro pé de alguém longe · quantos atacantes estavam na área em cada escanteio cobrado */
  diag = { colocadas: 0, magicas: 0, escanteios: [] as number[], saidas: 0, laterais: 0, tirosDeMeta: 0 }
  private deslizando = false
  private rng: () => number
  private evs: Evento[]
  private iev = 0
  private acoes: Acao[] = []
  private cur: Acao | null = null
  private prazo: number | null = null // até quando o ENFEITE da jogada decisiva pode correr
  private en: boolean

  constructor(seed: number, casa: CartaCampo[], fora: CartaCampo[], eventos: Evento[], en = false) {
    this.rng = mulberry(seed)
    this.atl = [...montaTime(0, casa), ...montaTime(1, fora)]
    this.evs = [...eventos].sort((a, b) => a.min - b.min)
    this.en = en
    this.saida(0, true)
    this.narra = en ? 'Kick-off!' : 'Rola a bola!'
  }

  // ── consultas ──
  time(l: Lado) { return this.atl.filter(a => a.lado === l) }
  gk(l: Lado) { return this.atl.find(a => a.lado === l && a.grupo === 'GOL') ?? this.time(l)[0] }
  private do(l: Lado, g: Grupo[]) { return this.time(l).filter(a => g.includes(a.grupo)) }
  private sorteia<T>(xs: T[]): T { return xs[Math.floor(this.rng() * xs.length)] }
  private preferido(l: Lado, g: Grupo[], est: Estilo[], fora?: Atleta | null): Atleta {
    const cands = this.do(l, g).filter(a => a !== fora)
    const bons = cands.filter(a => est.includes(a.estilo))
    const base = cands.length ? cands : this.time(l).filter(a => a.grupo !== 'GOL')
    return bons.length && this.rng() < 0.75 ? this.sorteia(bons) : this.sorteia(base)
  }
  private porNome(l: Lado, nome?: string) { return nome ? this.time(l).find(a => a.nome === nome && !!a.nome) : undefined }
  private n(a?: Atleta | null) { return a?.nome ? `<b>${a.nome}</b>` : (this.en ? 'the player' : 'o jogador') }
  private tt(pt: string, en: string) { return this.en ? en : pt }

  // ── a forma do time: linhas sobem/descem com a bola, com a posse e com a tática ─────────────────────────────────────────
  private rel(l: Lado, x: number, y: number) { return l === 0 ? { x, y } : { x: W - x, y: L - y } }
  private alvoForma(p: Atleta) {
    const b = this.rel(p.lado, this.bola.x, this.bola.y), tac = this.tatica[p.lado], ataca = this.posse === p.lado
    if (p.grupo === 'GOL') return this.rel(p.lado, 34 + (b.x - 34) * 0.12, ataca ? 99 : 101.5)
    let frente: number, fundo: number
    if (ataca) { frente = clamp(b.y - 14 - 6 * tac, 6, 60); fundo = clamp(frente + 46 - 5 * tac, 38, 90) }
    else { frente = clamp(b.y + 2 - 6 * tac, 30, 78); fundo = clamp(frente + 30 - 2 * tac, 60, 96) }
    let y = frente + (fundo - frente) * p.dep
    let x = p.bx + (b.x - 34) * (ataca ? 0.22 : 0.42)
    if (ataca && p.grupo === 'ATA' && (p.bx < 20 || p.bx > 48)) x = p.bx + (b.x - 34) * 0.08
    if (ataca && p.grupo === 'LAT' && tac >= 0) y -= p.estilo === 'apoiador' ? 12 : 6
    const r = this.rel(p.lado, x, y)
    return { x: clamp(r.x, 1.5, W - 1.5), y: clamp(r.y, 0.5, L - 0.5) } // ninguém se posiciona fora das linhas
  }
  private marcador(): Atleta | null {
    const d = this.bola.dono
    if (!d) return null
    let best: Atleta | null = null, bd = 1e9
    for (const q of this.atl) if (q.lado !== d.lado && q.grupo !== 'GOL' && !q.ov) { const dd = dist(q, this.bola); if (dd < bd) { bd = dd; best = q } }
    return best
  }

  // ── um passo fixo de simulação ──────────────────────────────────────────────────────────────────────────────────────────
  private passo(dt: number) {
    this.t += dt
    if (this.festa) {
      // 🎉 comemoração: o time que marcou corre pro autor; o outro volta pro meio
      const autor = this.porNome(this.festa.lado, this.festa.autor) ?? this.gk(this.festa.lado)
      const volta = this.t >= this.festa.ate - 1.4 // no finzinho da festa todo mundo já corre pro próprio campo, pra saída do meio
      for (const p of this.atl) {
        const a = !volta && p.lado === this.festa.lado && p.grupo !== 'GOL' ? { x: autor.x + (p.bx - 34) * 0.08, y: autor.y + (p.dep - 0.5) * 3 } : this.posSaida(p)
        this.anda(p, a, p === autor && !volta ? 3 : 7, dt)
      }
      if (this.t >= this.festa.ate) {
        // ⚽ GOL = BOLA NO MEIO: quem tomou dá a saída (regra do Diego, 20/10)
        const sai = (1 - this.festa.lado) as Lado
        this.festa = null; this.rede = null; this.prazo = null; this.acoes = []; this.cur = null
        this.saida(sai)
      }
      return
    }
    // ⏰ estourou o prazo do enfeite: corta o que sobrou dele e vai direto pro final da jogada
    if (this.prazo != null && this.t >= this.prazo) {
      if (this.cur?.pre) { this.cur = null; for (const a of this.atl) if (a.ov && a.ov.v < 9) a.ov = null }
      this.acoes = this.acoes.filter(a => !a.pre)
      this.prazo = null
    }
    // ⏰ o lance do jogo está chegando e o que corre é ENCHIMENTO (troca de passe, lateral, tiro de meta…): corta e vai pro lance
    const prox = this.evs[this.iev]
    if (prox && this.prazo == null && prox.min * SEG_POR_MIN - this.t <= ANTECEDE + 1 && (this.cur?.pre || this.acoes.some(a => a.pre))) {
      if (this.cur?.pre) this.cur = null
      this.acoes = this.acoes.filter(a => !a.pre)
      for (const a of this.atl) a.ov = null
    }
    if (!this.cur) { this.cur = this.acoes.shift() ?? null; if (!this.cur) { this.planeja(); this.cur = this.acoes.shift() ?? null } ; this.cur?.ini?.() }
    if (this.cur && this.cur.upd(dt)) this.cur = null
    const mk = this.marcador()
    for (const p of this.atl) {
      if (p === this.bola.dono && !p.ov) continue
      let a: { x: number; y: number } = p.ov ?? this.alvoForma(p)
      if (p === mk) a = { x: this.bola.x, y: this.bola.y + (p.lado === 0 ? 1.6 : -1.6) }
      this.anda(p, a, p.ov?.v ?? (p === mk ? 6 : 4.2), dt)
    }
    const v = this.bola.voo
    if (v) {
      v.t += dt
      const k = Math.min(1, v.t / v.dur), e = v.lin ? k : 1 - (1 - k) * (1 - k)
      this.bola.x = v.x0 + (v.x1 - v.x0) * e; this.bola.y = v.y0 + (v.y1 - v.y0) * e; this.bola.h = v.alt ? Math.sin(k * Math.PI) * v.alt : 0
      if (k >= 1) { this.bola.voo = null; this.bola.h = 0; v.fim?.() }
    } else if (this.bola.dono) {
      // a bola vai até o pé de quem a domina — NUNCA aparece do nada lá (se estiver longe, ela rola até ele)
      const d = this.bola.dono, tx = d.x + 0.4, ty = d.y + (d.lado === 0 ? -1.1 : 1.1)
      const dd = Math.hypot(tx - this.bola.x, ty - this.bola.y)
      this.bola.h = 0
      if (dd > 1.2) {
        if (!this.deslizando) { this.deslizando = true; if (dd > 4) this.diag.magicas++ }
        const k = Math.min(1, (30 * dt) / dd); this.bola.x += (tx - this.bola.x) * k; this.bola.y += (ty - this.bola.y) * k
      } else { this.deslizando = false; this.bola.x = tx; this.bola.y = ty }
    }
  }
  private anda(p: Atleta, a: { x: number; y: number }, v: number, dt: number) {
    const dx = a.x - p.x, dy = a.y - p.y, d = Math.hypot(dx, dy)
    const vv = v * (p.estilo === 'velocista' ? 1.12 : 1) * dt
    if (d > 0.05) { const k = Math.min(1, vv / d); p.x += dx * k; p.y += dy * k }
    p.x = clamp(p.x, -1.5, W + 1.5); p.y = clamp(p.y, -2, L + 2) // no máximo o pé na linha (quem cobra lateral/escanteio)
  }
  /** avança a simulação até o minuto do placar (passo fixo → igual em todo aparelho) */
  /** onde a bola estava no passo anterior (só pro desenho) */
  bolaAnt = { x: 34, y: L / 2, h: 0 }
  /** quanto do próximo passo já "passou" (0–1): o desenho mistura o passo anterior com o atual e a bola anda LISA, mesmo
   *  com o motor em 50 passos/s e a tela em 60 quadros/s (antes, a cada 5 quadros um repetia — a "travadinha") */
  entre = 1
  avancaAte(minuto: number) {
    const alvo = minuto * SEG_POR_MIN
    let n = 0
    while (this.t + DT <= alvo && n++ < 20000) {
      for (const a of this.atl) { a.ax = a.x; a.ay = a.y }
      this.bolaAnt.x = this.bola.x; this.bolaAnt.y = this.bola.y; this.bolaAnt.h = this.bola.h
      this.passo(DT)
    }
    this.entre = Math.max(0, Math.min(1, (alvo - this.t) / DT))
  }

  // ── posse e bola ──
  private pega(p: Atleta) { this.bola.dono = p; this.posse = p.lado; p.ov = null }
  private viaja(x1: number, y1: number, vel: number, alt = 0, lin = false, fim?: () => void) {
    const d = Math.hypot(x1 - this.bola.x, y1 - this.bola.y)
    this.bola.dono = null
    this.bola.voo = { x0: this.bola.x, y0: this.bola.y, x1, y1, t: 0, dur: Math.max(0.25, d / vel), alt, lin, fim }
  }
  /** bola PARADA posta no lugar da cobrança (saída, lateral, escanteio, tiro de meta, falta) — o único "pulo" permitido */
  private coloca(x: number, y: number) { this.bola.dono = null; this.bola.voo = null; this.bola.x = x; this.bola.y = y; this.bola.h = 0; this.deslizando = false; this.diag.colocadas++ }
  private posSaida(p: Atleta) { return this.rel(p.lado, p.bx, p.grupo === 'GOL' ? 101 : 54 + 40 * p.dep) }
  /** ⚽ saída do meio: cada time no seu campo, bola no centro, quem dá a saída toca pra trás */
  saida(l: Lado, inicio = false) {
    for (const p of this.atl) {
      p.ov = null; const r = this.posSaida(p); p.x = r.x; p.y = r.y
      // quem NÃO dá a saída fica fora do círculo central (9,15 m)
      if (p.lado !== l) { const dx = p.x - 34, dy = p.y - L / 2, d = Math.hypot(dx, dy); if (d < 9.8) { const k = Math.sqrt(Math.max(0, 9.8 * 9.8 - dx * dx)); p.y = L / 2 + (p.lado === 0 ? k : -k) } }
    }
    const ca = this.do(l, ['ATA'])[0] ?? this.time(l)[1]
    this.coloca(34, L / 2)
    ca.x = 34; ca.y = L / 2 + (l === 0 ? 0.8 : -0.8)
    this.pega(ca); this.diag.saidas++
    const rec = this.preferido(l, ['MEI'], ['passador'], ca)
    if (!inicio) this.acoes.push(this.aNarra(this.tt(`Bola no meio. Saída ${l === 0 ? 'do time da casa' : 'do visitante'}.`, `Back to the centre spot. ${l === 0 ? 'Home side' : 'Visitors'} kick off.`)))
    // (a saída NUNCA é cortada: é curta e é regra — o próximo lance espera ela)
    this.acoes.push(this.aEspera(inicio ? 0.4 : 0.7), this.aPasse(() => ca, () => rec, { adiante: -5, vel: 13 }))
  }

  // ── as AÇÕES (cada jogada é uma fila delas) ──────────────────────────────────────────────────────────────────────────────
  private aNarra(txt: string): Acao { return { upd: () => { this.narra = txt; return true } } }
  private aPasse(de: () => Atleta, para: () => Atleta, o: { adiante?: number; dx?: number; vel?: number; alto?: boolean } = {}): Acao {
    let feito = false, foi = false
    return {
      upd: () => {
        if (!foi) {
          if (this.bola.voo) return false // a bola ainda está no ar: espera ela chegar antes de tocar de novo
          const p = para()
          let d = de() ?? p
          const h = this.bola.dono
          if (h && h !== d && h.lado === d.lado) d = h // quem passa é quem ESTÁ com a bola
          else if (h !== d) this.pega(d)
          if (d === p) return (feito = true)
          const fw = p.lado === 0 ? -1 : 1
          let ax = clamp(p.x + (o.dx ?? 0), 2, W - 2), ay = clamp(p.y + fw * (o.adiante ?? 3), 2, L - 2)
          // a bola cai num lugar que o recebedor ALCANÇA no tempo do passe (senão ela "voaria" até ele depois)
          const dur = Math.max(0.25, Math.hypot(ax - this.bola.x, ay - this.bola.y) / (o.vel ?? 19)), alc = 7.5 * dur * 0.85 + 0.6, dp = Math.hypot(ax - p.x, ay - p.y)
          if (dp > alc) { ax = p.x + ((ax - p.x) * alc) / dp; ay = p.y + ((ay - p.y) * alc) / dp }
          p.ov = { x: ax, y: ay, v: 7.5 }
          this.viaja(ax, ay, o.vel ?? 19, o.alto ? 3.2 : 0, false, () => { this.pega(p); feito = true })
          foi = true
        }
        return feito
      },
    }
  }
  private aConduz(p: () => Atleta, ate: (a: Atleta) => { x: number; y: number }, vel = 6.2, maxSeg = 4): Acao {
    let t0 = 0, alvo = { x: 0, y: 0 }, quem: Atleta
    return {
      ini: () => { quem = p(); this.pega(quem); alvo = ate(quem); quem.ov = { ...alvo, v: vel }; t0 = this.t },
      upd: () => { if (dist(quem, alvo) < 0.6 || this.t - t0 > maxSeg) { quem.ov = null; return true } return false },
    }
  }
  /** segura a bola (andando devagar pra frente) até o instante certo do lance */
  private aSegura(ateT: number): Acao {
    return {
      ini: () => { const d = this.bola.dono; if (d) d.ov = { x: d.x + (34 - d.x) * 0.15, y: d.y + (d.lado === 0 ? -4 : 4), v: 1.6 } },
      upd: () => { if (this.t >= ateT) { if (this.bola.dono) this.bola.dono.ov = null; return true } return false },
    }
  }
  private aDesarme(def: () => Atleta, txt: (d: Atleta, v: Atleta | null) => string): Acao {
    let quem: Atleta, t0 = 0
    return {
      ini: () => { quem = def(); t0 = this.t },
      upd: () => {
        if (this.bola.voo) return false // passe no ar: o desarme é em quem RECEBER
        const v = this.bola.dono
        if (v && v.lado === quem.lado) return true // o time já está com ela
        if (!v) { // bola solta: quem chega primeiro fica com ela
          quem.ov = { x: this.bola.x, y: this.bola.y, v: 8.5 }
          if (dist(quem, this.bola) < 1.4 || this.t - t0 > 5) { this.pega(quem); this.narra = txt(quem, null); return true }
          return false
        }
        quem.ov = { x: v.x, y: v.y, v: 8 }
        if (dist(quem, v) < 1.5 || this.t - t0 > 5) { this.pega(quem); this.narra = txt(quem, v); return true }
        return false
      },
    }
  }
  private aEspera(seg: number): Acao { let t0 = 0; return { ini: () => { t0 = this.t }, upd: () => this.t - t0 >= seg } }
  private enfeite(as: Acao[]): Acao[] { for (const a of as) a.pre = true; return as }
  private maisPerto(l: Lado, pt: { x: number; y: number }, fora: Atleta[] = [], semGoleiro = true): Atleta {
    let best = this.time(l)[1], bd = 1e9
    for (const q of this.time(l)) if (!fora.includes(q) && (!semGoleiro || q.grupo !== 'GOL')) { const d = dist(q, pt); if (d < bd) { bd = d; best = q } }
    return best
  }
  /** ponto na área que `l` ATACA: prof = metros da linha de fundo, lat = metros do meio pro lado */
  private naArea(l: Lado, prof: number, lat = 0) { return this.rel(l, clamp(34 + lat, 4, 64), prof) }
  private foraDoCampo() { return this.bola.x < 0 || this.bola.x > W || this.bola.y < 0 || this.bola.y > L }
  /** espera um jogador chegar na bola parada e pega (com teto de tempo: nada trava a partida) */
  private aChegaNaBola(q: () => Atleta, maxSeg = 3.5, v = 8): Acao {
    let t0 = 0
    return {
      ini: () => { t0 = this.t; const a = q(); a.ov = { x: this.bola.x, y: this.bola.y, v } },
      upd: () => { const a = q(); a.ov = { x: this.bola.x, y: this.bola.y, v }; if (dist(a, this.bola) < 1.2 || this.t - t0 > maxSeg) { this.pega(a); a.ov = null; return true } return false },
    }
  }
  private soltaTodos(): Acao { return { ini: () => { for (const z of this.atl) z.ov = null }, upd: () => true } }

  /** 🧤 TIRO DE META: a bola saiu pela linha de fundo de `d` (chute pra fora) → bola na pequena área, o goleiro bate longo */
  private tiroDeMeta(d: Lado): Acao[] {
    const gk = this.gk(d), tt = this.tt.bind(this)
    return [
      { ini: () => { const pt = this.rel(d, 34 + (this.bola.x < 34 ? -9 : 9), 99.5); this.coloca(pt.x, pt.y); this.posse = d; this.diag.tirosDeMeta++; this.narra = tt('Tiro de meta.', 'Goal kick.') }, upd: () => true },
      ...this.enfeite([
        this.aChegaNaBola(() => gk, 3, 5.5), this.aEspera(0.5),
        this.aPasse(() => gk, () => this.preferido(d, ['MEI', 'ATA'], []), { alto: true, vel: 24, adiante: 3 }),
      ]),
    ]
  }
  /** 🧤 o goleiro segurou: segura um instante e repõe com a mão/pé pra um da defesa */
  private reposicao(d: Lado): Acao[] {
    const gk = this.gk(d)
    return this.enfeite([this.aEspera(1), this.aPasse(() => gk, () => this.preferido(d, ['LAT', 'DEF', 'MEI'], []), { adiante: 4, vel: 16 })])
  }
  /** 📏 LATERAL: a bola saiu pela linha lateral → quem NÃO tocou por último cobra com as mãos, do lugar onde saiu */
  private lateral(l: Lado): Acao[] {
    const tt = this.tt.bind(this), n = this.n.bind(this)
    const cob = umaVez(() => this.maisPerto(l, this.bola))
    const rec = umaVez(() => this.maisPerto(l, this.bola, [cob()]))
    return this.enfeite([
      { ini: () => { const x = this.bola.x < 34 ? -0.6 : W + 0.6, y = clamp(this.bola.y, 3, L - 3); this.coloca(x, y); this.posse = l; this.diag.laterais++; this.narra = tt(`Lateral. ${n(cob())} vai cobrar.`, `Throw-in. ${n(cob())} takes it.`) }, upd: () => true },
      this.aChegaNaBola(cob, 3.5, 7.5), this.aEspera(0.5),
      this.aPasse(cob, rec, { adiante: 1.5, vel: 12, alto: true }),
    ])
  }
  /** ⛳ o time SOBE pro escanteio (já no desvio, pra dar tempo de chegar): atacantes, 2 zagueiros e um meia na área; a defesa
   *  inteira volta pra marcar; o cobrador corre pro corner */
  private sobeProEscanteio(l: Lado, ladoX: number, cob: () => Atleta, alvo: () => Atleta) {
    const adv = (1 - l) as Lado
      const c = cob(), f = alvo(), cant = this.rel(l, ladoX < 0 ? 0.6 : 67.4, 0.6)
      c.ov = { ...cant, v: 10 }
      const sobem = [...new Set([f, ...this.do(l, ['ATA']), ...this.do(l, ['DEF']).slice(0, 2), ...this.do(l, ['MEI']).slice(0, 1)])].filter(z => z !== c)
      sobem.forEach((z, i) => { z.ov = { ...this.naArea(l, z === f ? 7 : 5 + (i % 3) * 3.5, -11 + (22 * i) / Math.max(1, sobem.length - 1)), v: z.grupo === 'DEF' ? 10.5 : 9.5 } }) // sobem CORRENDO
      this.time(l).filter(z => z !== c && z.grupo !== 'GOL' && !sobem.includes(z)).forEach((z, i) => { z.ov = { ...this.naArea(l, i < 2 ? 20 : 40, i % 2 ? 9 : -9), v: 6 } })
      const defs = this.time(adv).filter(z => z.grupo !== 'GOL'), fica = this.do(adv, ['ATA'])[0]
      defs.filter(z => z !== fica).forEach((z, i) => {
        const m = sobem[i]
        z.ov = m?.ov ? { x: m.ov.x + 0.7, y: m.ov.y + (l === 0 ? -1 : 1), v: 8 } : { ...this.naArea(l, 3 + (i % 2) * 6, i % 3 === 0 ? -4 : 4), v: 8 }
      })
      const gk = this.gk(adv); gk.ov = { ...this.naArea(l, 1.2, ladoX * 1.5), v: 5 }
  }
  /** ⛳ ESCANTEIO armado: bola no corner, o cobrador vai até ela, o ATAQUE SOBE (atacantes, 2 zagueiros e um meia na área) e a
   *  defesa inteira volta pra marcar — devolve as ações; quem cabeceia é `alvo` */
  private escanteio(l: Lado, ladoX: number, cob: () => Atleta, alvo: () => Atleta, ate: number | null): Acao[] {
    let t0 = 0
    return [{
      ini: () => {
        t0 = this.t
        const cant = this.rel(l, ladoX < 0 ? 0.6 : 67.4, 0.6)
        this.coloca(cant.x, cant.y); this.posse = l
        this.sobeProEscanteio(l, ladoX, cob, alvo)
        this.narra = this.tt('Escanteio!', 'Corner!')
      },
      upd: () => {
        const c = cob()
        // só cobra com o ATAQUE NA ÁREA (ou quando o relógio do lance manda)
        const naArea = this.time(l).filter(z => this.frente(l, z.y) < 17 && Math.abs(z.x - 34) < 21).length
        if ((dist(c, this.bola) < 1.1 && naArea >= 4) || this.t > (ate ?? t0 + 7)) {
          this.pega(c)
          this.diag.escanteios.push(naArea)
          return true
        }
        return false
      },
    }]
  }
  /** a finalização: é AQUI que o resultado do motor do jogo aparece */
  private aChute(quem: () => Atleta, fim: Fim, ev: Evento | null, o: { alto?: boolean; vel?: number; cabeca?: boolean } = {}): Acao {
    let feito = false, foi = false
    const ini = () => {
        const p = quem(); if (this.bola.dono !== p) this.pega(p)
        const ataca0 = p.lado === 0, gk = this.gk((1 - p.lado) as Lado)
        const lado = this.rng() < 0.5 ? -1 : 1
        const linha = ataca0 ? -0.6 : L + 0.6
        // ⏱️ a bola chega no gol NO MINUTO do lance do jogo: a força do chute se ajusta pra isso (dentro do que é crível)
        const alvoT = ev ? ev.min * SEG_POR_MIN : this.t + 0.6
        const dGol = Math.hypot(34 - this.bola.x, (ataca0 ? 0 : L) - this.bola.y)
        const velBase = o.vel ?? (o.cabeca ? 17 : 25)
        const vel = clamp(dGol / Math.max(0.3, alvoT - this.t), velBase * 0.75, velBase * (alvoT - this.t < 0.6 ? 2.2 : 1.6)) // atrasado: a bomba sai mais forte
        if (fim === 'gol') {
          gk.ov = { x: 34 - lado * 2, y: gk.y, v: 6 }
          this.viaja(34 + lado * 2.7, ataca0 ? -1.6 : L + 1.6, vel, o.alto ? 1.4 : 0.5, true, () => {
            gk.ov = null
            this.rede = { y0: ataca0 ? 0 : L, t0: this.t }
            this.placar[p.lado]++
            // a festa encurta se o próximo lance do motor já está chegando (gols colados)
            const prox = this.evs[this.iev], folga = prox ? prox.min * SEG_POR_MIN - this.t - 3.5 : FESTA
            this.festa = { ate: this.t + clamp(folga, 1.6, FESTA), lado: p.lado, autor: ev?.autor ?? p.nome, assist: ev?.assist, min: ev?.min ?? 0 }
            this.narra = this.tt(`GOOOOL! ${this.n(p)}!`, `GOOOAL! ${this.n(p)}!`)
            feito = true
          })
          return
        }
        if (fim === 'defendeu') {
          const bx = 34 + lado * (gk.estilo === 'paredao' ? 3.2 : 2.3), by = ataca0 ? 1.3 : L - 1.3
          gk.ov = { x: bx, y: by, v: 12 }
          this.viaja(bx, by, vel, 0.8, true, () => { gk.ov = null; this.pega(gk); feito = true })
          return
        }
        if (fim === 'trave') {
          this.viaja(34 + lado * 3.66, linha, vel, 0.6, true, () => {
            const cai = { x: 34 + lado * 10, y: ataca0 ? 10 : L - 10 }, z = this.maisPerto((1 - p.lado) as Lado, cai)
            z.ov = { ...cai, v: 9 }
            this.viaja(cai.x, cai.y, 13, 1.5, false, () => { this.pega(z); feito = true })
          })
          return
        }
        const isolou = fim === 'isolou'
        // pra fora: a bola passa a linha de fundo e PARA lá — quem repõe é o goleiro, no tiro de meta (`tiroDeMeta`)
        this.viaja(34 + lado * (5 + this.rng() * 7), ataca0 ? -3 : L + 3, vel, isolou ? 4.2 : (o.alto ? 2.2 : 0.9), false, () => { feito = true })
    }
    return {
      upd: () => {
        if (!foi) { if (this.bola.voo) return false; ini(); foi = true }
        return feito
      },
    }
  }

  // ── o DIRETOR: escolhe a próxima jogada ──────────────────────────────────────────────────────────────────────────────────
  private planeja() {
    const prox = this.evs[this.iev]
    const tEv = prox ? prox.min * SEG_POR_MIN : Infinity
    if (prox && tEv - this.t <= ANTECEDE + 1) { this.iev++; this.decisiva(prox, tEv); return }
    this.enchimento(prox ? tEv - ANTECEDE - this.t : 99)
  }
  /** garante que o lado `l` está com a bola (rouba/intercepta se precisar) */
  private recuperaAcoes(l: Lado): Acao[] {
    if (this.bola.dono?.lado === l && !this.bola.voo) return []
    // bola parada fora do campo (sobrou de um lance cortado): reinicia com a regra, nunca com alguém buscando lá fora
    if (!this.bola.dono && !this.bola.voo && this.foraDoCampo()) {
      const fundo = this.bola.y < 0 || this.bola.y > L
      return fundo ? [...this.tiroDeMeta(this.bola.y < 0 ? 0 : 1)] : this.lateral(l)
    }
    // o goleiro rival está com ela: ele repõe longe e o time de `l` disputa lá
    const h = this.bola.dono
    if (h && h.grupo === 'GOL' && h.lado !== l) {
      const adv = h.lado
      return [this.aEspera(0.8), this.aPasse(() => h, () => this.preferido(adv, ['MEI', 'ATA'], []), { alto: true, vel: 23, adiante: 2 }), ...this.recuperaAcoes2(l)]
    }
    return this.recuperaAcoes2(l)
  }
  private recuperaAcoes2(l: Lado): Acao[] {
    const def = umaVez(() => {
      const perto = this.time(l).filter(a => a.grupo !== 'GOL' && dist(a, this.bola) < 14)
      const bons = perto.filter(a => a.estilo === 'desarmador')
      return bons.length && this.rng() < 0.7 ? this.sorteia(bons) : this.maisPerto(l, this.bola)
    })
    return [this.aDesarme(def, (d, v) => d.estilo === 'desarmador'
      ? this.tt(`${this.n(d)} chega firme e rouba a bola${v ? ` de ${this.n(v)}` : ''}!`, `${this.n(d)} goes in hard and wins the ball${v ? ` from ${this.n(v)}` : ''}!`)
      : this.tt(`${this.n(d)} intercepta o passe.`, `${this.n(d)} cuts out the pass.`))]
  }
  private frente(l: Lado, y: number) { return l === 0 ? y : L - y }

  /** a jogada que termina no evento do motor (gol ou chance), no minuto certo.
   *  Ela tem duas partes: o ENFEITE (troca de passe, condução, drible…) e o FINAL (o passe decisivo + a finalização). O enfeite
   *  tem prazo: se apertar o tempo (dois lances colados), ele é cortado e o jogo vai direto pro final — assim o gol do campinho
   *  sai no minuto do gol do jogo. */
  private decisiva(ev: Evento, tEv: number) {
    const l = ev.lado, adv = (1 - l) as Lado
    const autor = this.porNome(l, ev.autor)
    const assist = this.porNome(l, ev.assist)
    const fin = umaVez(() => autor ?? this.preferido(l, ['ATA', 'MEI'], ['finalizador', 'chutador', 'driblador', 'velocista']))
    const est = autor?.estilo ?? 'normal'
    const r = this.rng()
    type Molde = 'enfiada' | 'cruzamento' | 'chute_fora' | 'drible' | 'escanteio' | 'falta' | 'contra' | 'tabela'
    let molde: Molde =
      autor?.grupo === 'DEF' || autor?.grupo === 'LAT' || est === 'cabeceador' ? (r < 0.6 ? 'escanteio' : 'cruzamento')
      : est === 'chutador' ? (r < 0.45 ? 'chute_fora' : r < 0.75 ? 'falta' : 'enfiada')
      : est === 'driblador' ? (r < 0.7 ? 'drible' : 'tabela')
      : est === 'velocista' ? (r < 0.65 ? 'contra' : 'enfiada')
      : est === 'finalizador' ? (r < 0.45 ? 'enfiada' : r < 0.75 ? 'cruzamento' : 'tabela')
      : (['enfiada', 'cruzamento', 'chute_fora', 'drible', 'tabela', 'escanteio', 'contra', 'falta'] as Molde[])[Math.floor(r * 8)]
    // pouco tempo até o lance? molde curto
    const folga = tEv - this.t
    // (escanteio e falta precisam de tempo pra ARMAR: o time sobe, a barreira se forma, o cobrador vai até a bola)
    if ((molde === 'escanteio' && folga < 9.3) || (molde === 'falta' && folga < 5.8) || (molde === 'cruzamento' && folga < 5)) molde = folga < 4.5 ? 'chute_fora' : 'enfiada'
    // ⏱️ o lance do jogo já está em cima (ou passou): vai no CURTO — o gol do campinho tem que sair no minuto do gol do jogo
    if (folga < 4.5) molde = 'chute_fora'
    const n = this.n.bind(this), tt = this.tt.bind(this)
    const passador = umaVez(() => assist ?? this.preferido(l, ['MEI'], ['passador'], fin()))
    const box = (prof: number, lat = 0) => this.rel(l, clamp(34 + lat, 6, 62), prof)
    const pre = (...as: Acao[]) => { for (const a of as) { a.pre = true; this.acoes.push(a) } }
    const fim = (...as: Acao[]) => { for (const a of as) this.acoes.push(a) }
    // o FINAL começa garantindo a bola com o time certo (se o enfeite foi cortado no meio)
    const garante = (quem: () => Atleta): Acao => {
      // (o enfeite foi cortado antes de o time recuperar a bola): o mais perto dela dá o bote RÁPIDO e toca pra quem conclui
      let t0 = -1, ladrao: Atleta | null = null, passe: Acao | null = null
      return { upd: () => {
        if (this.bola.voo) return false
        if (passe) return passe.upd(0)
        const h = this.bola.dono
        if (h?.lado !== l) {
          if (t0 < 0) { t0 = this.t; ladrao = this.maisPerto(l, this.bola) }
          ladrao!.ov = { x: this.bola.x, y: this.bola.y, v: 10 }
          // (com o lance em cima, o bote é instantâneo: o tempo do gol vale mais que a bonitez)
          if (dist(ladrao!, this.bola) > 1.5 && this.t - t0 < Math.min(1.4, (tEv - this.t - 2.2) / 2)) return false
          this.pega(ladrao!); ladrao!.ov = null
        }
        if (this.bola.dono === quem()) return true
        passe = this.aPasse(() => this.bola.dono!, quem, { adiante: 1, vel: 26 })
        return passe.upd(0)
      } }
    }
    const LEAD: Record<Molde, number> = { enfiada: 3.4, cruzamento: 3.6, chute_fora: 1.6, drible: 2.6, tabela: 2.8, contra: 3.2, escanteio: 7.6, falta: 4.8 }
    this.prazo = tEv - LEAD[molde]
    pre(...this.recuperaAcoes(l))
    const chute = (quem: () => Atleta, o: { cabeca?: boolean; alto?: boolean; vel?: number }, txt: string) =>
      fim(this.aSegura(tEv - (o.cabeca ? 0.9 : 0.75)), this.aNarra(txt), this.aChute(quem, ev.fim, ev, o))
    switch (molde) {
      case 'enfiada': {
        pre(this.aPasse(() => this.bola.dono!, passador, { adiante: 2 }), this.aConduz(passador, () => box(40, (passador().bx - 34) * 0.5), 6))
        fim(garante(passador), this.aNarra(tt(`${n(passador())} levanta a cabeça e ENFIA pro ${n(fin())}!`, `${n(passador())} looks up and THREADS it through to ${n(fin())}!`)),
          this.aPasse(() => this.bola.dono!, fin, { adiante: 9, vel: 22 }), this.aConduz(fin, () => box(11, (fin().x - 34) * 0.2), 7.4, 1.2))
        chute(fin, {}, tt(`${n(fin())} na cara do gol…`, `${n(fin())} one-on-one…`))
        break
      }
      case 'cruzamento': {
        const ala = umaVez(() => this.preferido(l, ['LAT', 'ATA'], ['apoiador', 'driblador'], fin()))
        const lado = this.rng() < 0.5 ? -1 : 1
        pre(this.aPasse(() => this.bola.dono!, ala, { adiante: 8, dx: lado * 10 }), this.aNarra(tt(`${n(ala())} vai à linha de fundo…`, `${n(ala())} gets to the byline…`)),
          this.aConduz(ala, () => this.rel(l, lado < 0 ? 5 : 63, 8), 7.2, 3.5))
        fim(garante(ala), { ini: () => { const f = fin(); f.ov = { ...box(7, -lado * 3), v: 8 } }, upd: () => true },
          this.aSegura(tEv - 2.1), this.aNarra(tt('Cruzou na área!', 'Cross into the box!')), this.aPasse(() => this.bola.dono!, fin, { alto: true, adiante: 0, vel: 18 }),
          this.aNarra(tt(`${n(fin())} sobe de cabeça…`, `${n(fin())} rises for the header…`)), this.aChute(fin, ev.fim, ev, { cabeca: true, alto: true }))
        break
      }
      case 'chute_fora': {
        const ch = umaVez(() => autor ?? this.preferido(l, ['MEI', 'LAT'], ['chutador']))
        pre(this.aPasse(() => this.bola.dono!, ch, { adiante: 4 }), this.aConduz(ch, () => box(26, (ch().x - 34) * 0.4), 6, 3))
        fim(garante(ch))
        chute(ch, { alto: true, vel: 29 }, tt(`${n(ch())} solta a bomba de fora da área!`, `${n(ch())} lets fly from outside the box!`))
        break
      }
      case 'drible': {
        const dr = umaVez(() => autor ?? this.preferido(l, ['ATA', 'MEI'], ['driblador']))
        pre(this.aPasse(() => this.bola.dono!, dr, { adiante: 4 }), this.aNarra(tt(`${n(dr())} parte pra cima da marcação…`, `${n(dr())} runs at the defence…`)))
        // 🪄 o drible: o marcador dá o bote e fica pra trás
        fim(garante(dr), {
          ini: () => { const d = dr(), z = this.preferido(adv, ['DEF', 'MEI'], []); z.ov = { x: d.x, y: d.y + (l === 0 ? -2 : 2), v: 7 }; d.ov = { ...this.rel(l, clamp(this.rel(l, d.x, d.y).x + (this.rng() < 0.5 ? -7 : 7), 8, 60), Math.max(12, this.frente(l, d.y) - 9)), v: 8 } },
          upd: () => { const d = dr(); if (!d.ov || dist(d, d.ov) < 0.8 || this.t > tEv - 1) { d.ov = null; this.narra = tt(`…e passa como quer! Que drible de ${n(d)}!`, `…and skips past! What a dribble by ${n(d)}!`); return true } return false },
        })
        chute(dr, {}, tt(`${n(dr())} bate cruzado…`, `${n(dr())} shoots across goal…`))
        break
      }
      case 'tabela': {
        const um = umaVez(() => autor ?? this.preferido(l, ['ATA'], ['finalizador', 'driblador']))
        const outro = umaVez(() => assist ?? this.preferido(l, ['MEI', 'ATA'], ['passador'], um()))
        pre(this.aPasse(() => this.bola.dono!, um, { adiante: 3 }), this.aNarra(tt(`${n(um())} tabela com ${n(outro())}…`, `${n(um())} plays a one-two with ${n(outro())}…`)), this.aPasse(um, outro, { adiante: 2 }))
        fim(garante(outro), this.aPasse(() => this.bola.dono!, um, { adiante: 8, vel: 21 }), this.aConduz(um, () => box(12, (um().x - 34) * 0.3), 7, 1))
        chute(um, {}, tt(`${n(um())} recebe de volta e bate!`, `${n(um())} gets it back and shoots!`))
        break
      }
      case 'contra': {
        const vel = umaVez(() => autor ?? this.preferido(l, ['ATA'], ['velocista']))
        pre(this.aNarra(tt('Contra-ataque!', 'Counter-attack!')), this.aPasse(() => this.bola.dono!, vel, { adiante: 12, vel: 21 }), this.aNarra(tt(`${n(vel())} dispara em velocidade…`, `${n(vel())} races away…`)))
        fim(garante(vel), this.aConduz(vel, () => box(13, (vel().x - 34) * 0.4), 8.6, 2.2))
        chute(vel, {}, tt(`${n(vel())} sai na cara do goleiro…`, `${n(vel())} is through on goal…`))
        break
      }
      case 'escanteio': {
        // a bola vai pela ponta, a zaga desvia pra linha de fundo → ESCANTEIO armado (o ataque inteiro sobe)
        const lado = this.rng() < 0.5 ? -1 : 1
        const ala = umaVez(() => this.preferido(l, ['LAT', 'ATA', 'MEI'], ['apoiador', 'driblador'], fin()))
        const cob = umaVez(() => this.maisPerto(l, this.rel(l, lado < 0 ? 0 : W, 0), [fin()]))
        // o ataque já vem subindo na jogada que vira escanteio (é o que dá tempo de a área encher)
        pre({ ini: () => this.sobeProEscanteio(l, lado, cob, fin), upd: () => true }, this.aPasse(() => this.bola.dono!, ala, { adiante: 10, dx: lado * 12, vel: 22 }))
        // (o desvio pra linha de fundo NÃO é cortado: é ele que mostra por que é escanteio)
        fim({ ini: () => { this.narra = tt('Cruzou… a zaga desvia! Escanteio.', 'Crossed… deflected behind! Corner.'); const o = this.rel(l, lado < 0 ? 4 : 64, -1.5); this.viaja(o.x, o.y, 22, 0.8); this.sobeProEscanteio(l, lado, cob, fin) }, upd: () => !this.bola.voo })
        fim(...this.escanteio(l, lado, cob, fin, tEv - 1.5), this.aSegura(tEv - 2), this.aNarra(tt(`${n(cob())} cobra o escanteio…`, `${n(cob())} swings in the corner…`)),
          this.aPasse(cob, fin, { alto: true, adiante: 0, vel: 23 }), this.aChute(fin, ev.fim, ev, { cabeca: true, alto: true }), this.soltaTodos())
        break
      }
      case 'falta': {
        // o jogador avança, o zagueiro chega atrasado e DERRUBA → falta: barreira a 9 m, o batedor vai até a bola
        const ch = umaVez(() => autor ?? this.preferido(l, ['MEI', 'ATA', 'LAT'], ['chutador']))
        const vit = umaVez(() => this.preferido(l, ['ATA', 'MEI'], ['driblador'], ch()))
        const falt = umaVez(() => this.preferido(adv, ['DEF', 'MEI'], ['desarmador']))
        pre(this.aPasse(() => this.bola.dono!, vit, { adiante: 4 }), this.aConduz(vit, () => this.naArea(l, 23, (this.rng() - 0.5) * 14), 6.5, 3))
        fim(garante(vit), {
          ini: () => { const v = this.bola.dono ?? vit(); falt().ov = { x: v.x, y: v.y, v: 10 }; const c = ch(); if (c !== v) c.ov = { x: v.x, y: v.y + (l === 0 ? 4 : -4), v: 9 } },
          upd: () => { const v = this.bola.dono ?? vit(); return dist(falt(), v) < 1.6 || this.t > tEv - 3.6 },
        }, {
          ini: () => {
            const v = this.bola.dono ?? vit()
            this.narra = tt(`FALTA! ${n(falt())} derruba ${n(v)}.`, `FOUL! ${n(falt())} brings down ${n(v)}.`)
            // a bola fica onde foi a falta (se for longe demais do gol, vai pra entrada da área)
            const fr = this.frente(l, this.bola.y), pt = fr > 17 && fr < 32 && this.bola.x > 12 && this.bola.x < 56 ? { x: this.bola.x, y: this.bola.y } : this.naArea(l, 22, (this.rng() - 0.5) * 12)
            this.coloca(pt.x, pt.y); this.posse = l
            const g = this.rel(l, 34, 0), dx = g.x - pt.x, dy = g.y - pt.y, dd = Math.hypot(dx, dy), ux = dx / dd, uy = dy / dd
            this.do(adv, ['DEF', 'MEI']).slice(0, 4).forEach((z, i) => { z.ov = { x: pt.x + ux * 9.15 - uy * (i - 1.5) * 1.1, y: pt.y + uy * 9.15 + ux * (i - 1.5) * 1.1, v: 8 } }) // a barreira
            this.do(l, ['ATA']).filter(z => z !== ch()).forEach((z, i) => { z.ov = { ...this.naArea(l, 9, i % 2 ? 7 : -7), v: 7 } })
            ch().ov = { x: pt.x - ux * 1.3, y: pt.y - uy * 1.3, v: 10 }
          },
          upd: () => { const c = ch(); if (dist(c, this.bola) < 1.8 || this.t > tEv - 1.2) { this.pega(c); return true } return false },
        })
        chute(ch, { alto: true, vel: 24 }, tt(`${n(ch())} vai pra cobrança…`, `${n(ch())} steps up…`))
        fim(this.soltaTodos())
        break
      }
    }
    if (ev.fim !== 'gol') {
      const txt: Record<Exclude<Fim, 'gol'>, [string, string]> = {
        defendeu: ['Que defesa! O goleiro buscou!', 'What a save!'],
        trave: ['NA TRAVE! Quase!', 'OFF THE POST!'],
        fora: ['Pra fora, raspando a trave!', 'Just wide!'],
        isolou: ['Isolou! A bola foi pra arquibancada.', 'Blazed over the bar!'],
      }
      fim(this.aNarra(this.en ? txt[ev.fim][1] : txt[ev.fim][0]))
      // e o jogo recomeça com a REGRA: pra fora = tiro de meta · o goleiro segurou = ele repõe
      if (ev.fim === 'fora' || ev.fim === 'isolou') fim(...this.enfeite([this.aEspera(0.7)]), ...this.tiroDeMeta(adv))
      else if (ev.fim === 'defendeu') fim(...this.reposicao(adv))
    }
  }

  /** jogada sem gol: troca de passe, drible, desarme, lateral, escanteio, tiro de meta… (nunca passa do tempo livre; e se o lance
   *  do jogo chegar antes de ela acabar, ela é cortada — tudo aqui é ENFEITE) */
  private enchimento(livre: number) {
    const ac: Acao[] = []
    const vai = () => { this.acoes.push(...this.enfeite(ac)) }
    if (livre < 2.5) { ac.push(this.aSegura(this.t + Math.max(0.4, livre))); return vai() }
    const l: Lado = this.bola.dono ? this.bola.dono.lado : this.posse, adv = (1 - l) as Lado
    if (!this.bola.dono) ac.push(...this.recuperaAcoes(l))
    const n = this.n.bind(this), tt = this.tt.bind(this)
    const r = this.rng()
    const meia = umaVez(() => this.preferido(l, ['MEI'], ['passador']))
    const dono = () => this.bola.dono!
    if (r < 0.1) {
      // ⚽ troca de passe no meio e o rival rouba
      const a = meia(), b = this.preferido(l, ['MEI', 'LAT', 'ATA'], [], a)
      ac.push(this.aNarra(tt(`${n(a)} toca com ${n(b)}…`, `${n(a)} plays it to ${n(b)}…`)), this.aPasse(dono, () => a), this.aPasse(() => a, () => b), ...this.recuperaAcoes2(adv))
    } else if (r < 0.18) {
      // 🔄 inversão de jogo, o lateral apoia e cruza: a zaga corta
      const lat = this.preferido(l, ['LAT'], ['apoiador'])
      ac.push(this.aNarra(tt(`${n(meia())} inverte o jogo pro ${n(lat)}.`, `${n(meia())} switches play to ${n(lat)}.`)),
        this.aPasse(dono, meia), this.aPasse(meia, () => lat, { alto: true, vel: 21, adiante: 6 }),
        this.aConduz(() => lat, a => ({ x: a.x, y: clamp(a.y + (l === 0 ? -10 : 10), 4, L - 4) }), 6.5, 2),
        this.aNarra(tt('O cruzamento sai… e a zaga corta.', 'The cross comes in… and it\'s cleared.')),
        this.aPasse(() => lat, () => this.preferido(adv, ['DEF'], ['cabeceador', 'desarmador']), { alto: true, adiante: 0, vel: 17 }))
    } else if (r < 0.32) {
      // 🛡️ o drible não passa: desarme (às vezes o zagueiro tira pela LATERAL)
      const dr = this.preferido(l, ['ATA', 'MEI'], ['driblador'])
      ac.push(this.aPasse(dono, () => dr, { adiante: 3 }), this.aNarra(tt(`${n(dr)} tenta o drible…`, `${n(dr)} tries to take him on…`)),
        this.aConduz(() => dr, a => ({ x: clamp(a.x + (this.rng() < 0.5 ? -4 : 4), 3, W - 3), y: clamp(a.y + (l === 0 ? -5 : 5), 6, L - 6) }), 6, 1.6))
      if (this.rng() < 0.6) {
        const z = umaVez(() => this.maisPerto(adv, this.bola))
        ac.push({ ini: () => { z().ov = { x: this.bola.x, y: this.bola.y, v: 9 } }, upd: () => dist(z(), this.bola) < 1.6 || (z().ov = { x: this.bola.x, y: this.bola.y, v: 9 }, false) },
          { ini: () => { this.narra = tt(`${n(z())} chega no carrinho e manda pra lateral!`, `${n(z())} slides in and puts it out for a throw!`); this.viaja(this.bola.x < 34 ? -1.4 : W + 1.4, clamp(this.bola.y + (this.rng() - 0.5) * 6, 4, L - 4), 12, 0.4); z().ov = null }, upd: () => !this.bola.voo },
          ...this.lateral(l))
      } else ac.push(...this.recuperaAcoes2(adv))
    } else if (r < 0.64) {
      // 📏 a bola vai pela ponta, o rival afasta pela LATERAL → lateral cobrado com as mãos
      const ala = this.preferido(l, ['LAT', 'ATA', 'MEI'], ['apoiador']), corta = this.preferido(adv, ['LAT', 'DEF', 'MEI'], ['desarmador'])
      const sx = ala.x < 34 ? -1 : 1
      ac.push(this.aPasse(dono, () => ala, { adiante: 5, dx: sx * 6 }),
        { ini: () => { corta.ov = { x: ala.x, y: ala.y, v: 8.5 } }, upd: () => dist(corta, ala) < 2.2 || (corta.ov = { x: ala.x, y: ala.y, v: 8.5 }, false) },
        { ini: () => { this.narra = tt(`${n(corta)} afasta pela lateral.`, `${n(corta)} knocks it out for a throw.`); this.viaja(sx < 0 ? -1.4 : W + 1.4, clamp(this.bola.y + (this.rng() - 0.5) * 8, 4, L - 4), 12, 0.6); corta.ov = null }, upd: () => !this.bola.voo },
        ...this.lateral(l))
    } else if (r < 0.74) {
      // ⛳ cruzamento desviado pra escanteio; cobrança na área e a zaga tira de cabeça
      const lado = this.rng() < 0.5 ? -1 : 1
      const ala = this.preferido(l, ['LAT', 'ATA'], ['apoiador', 'driblador'])
      const cob = umaVez(() => this.maisPerto(l, this.rel(l, lado < 0 ? 0 : W, 0)))
      const alvo = umaVez(() => this.preferido(l, ['ATA', 'DEF'], ['cabeceador'], cob()))
      const zag = umaVez(() => this.preferido(adv, ['DEF'], ['cabeceador', 'desarmador']))
      ac.push(this.aPasse(dono, () => ala, { adiante: 8, dx: lado * 10 }), this.aConduz(() => ala, () => this.rel(l, lado < 0 ? 7 : 61, 12), 7.2, 2.6),
        { ini: () => { this.narra = tt('Cruzou… desviou! Escanteio.', 'Cross… deflected! Corner.'); const o = this.rel(l, lado < 0 ? 4 : 64, -1.5); this.viaja(o.x, o.y, 22, 0.8); this.sobeProEscanteio(l, lado, cob, alvo) }, upd: () => !this.bola.voo },
        ...this.escanteio(l, lado, cob, alvo, null), this.aEspera(0.8), this.aNarra(tt(`${n(cob())} cobra…`, `${n(cob())} whips it in…`)),
        this.aPasse(cob, alvo, { alto: true, adiante: 0, vel: 18 }),
        { ini: () => { const z = zag(); z.ov = { x: this.bola.x, y: this.bola.y, v: 9 } }, upd: () => true },
        this.aNarra(tt(`${n(zag())} sobe mais alto e afasta!`, `${n(zag())} gets up highest and clears!`)),
        { upd: () => { if (this.bola.voo) return false; const z = zag(); this.pega(z); return true } }, this.soltaTodos(),
        this.aPasse(zag, () => this.preferido(adv, ['MEI', 'ATA'], []), { alto: true, vel: 22, adiante: 6 }))
    } else if (r < 0.82) {
      // 🧤 recua pro goleiro e ele sai jogando
      const gk = this.gk(l), z = this.preferido(l, ['DEF', 'LAT'], [])
      ac.push(this.aPasse(dono, () => z, { adiante: -4 }), this.aPasse(() => z, () => gk, { adiante: 0, vel: 15 }),
        this.aNarra(gk.estilo === 'goleiro_linha' ? tt(`${n(gk)} sai jogando com os pés, com toda a calma.`, `${n(gk)} plays out from the back, cool as you like.`) : tt(`Recua pro ${n(gk)}.`, `Back to ${n(gk)}.`)),
        this.aEspera(0.6), this.aPasse(() => gk, () => this.preferido(l, ['LAT', 'DEF'], [], z), { adiante: 3 }), this.aPasse(() => this.bola.dono!, meia))
    } else if (r < 0.88) {
      // 🏃 lançamento longo pro atacante, o zagueiro chega antes
      const at = this.preferido(l, ['ATA'], ['velocista'])
      ac.push(this.aNarra(tt(`Lançamento longo procurando ${n(at)}…`, `A long ball looking for ${n(at)}…`)), this.aPasse(dono, () => at, { alto: true, vel: 21, adiante: 10 }), ...this.recuperaAcoes2(adv))
    } else {
      // 🎯 posse paciente: toca, toca e vira
      const a = meia(), b = this.preferido(l, ['DEF', 'MEI'], [], a), c = this.preferido(l, ['LAT'], [])
      ac.push(this.aNarra(tt(`O ${l === 0 ? 'time da casa' : 'visitante'} roda a bola com paciência.`, `${l === 0 ? 'The home side' : 'The visitors'} keep the ball patiently.`)),
        this.aPasse(dono, () => a), this.aPasse(() => a, () => b, { adiante: -3 }), this.aPasse(() => b, () => c))
    }
    vai()
  }
}

/** os gols do jogo (formato do placar) + as chances perdidas (`chances.ts`) → a lista de eventos do campinho */
export function eventosDoJogo(gols: { min: number; home: boolean; name: string; assist?: string }[], chances: { min: number; home: boolean; fim: Exclude<Fim, 'gol'> }[], quemChutou?: (c: { min: number; home: boolean }) => string | null): Evento[] {
  return [
    ...gols.map(g => ({ min: g.min, lado: (g.home ? 0 : 1) as Lado, fim: 'gol' as Fim, autor: g.name, assist: g.assist })),
    ...chances.map(c => ({ min: c.min, lado: (c.home ? 0 : 1) as Lado, fim: c.fim as Fim, autor: quemChutou?.(c) ?? undefined })),
  ].sort((a, b) => a.min - b.min)
}
