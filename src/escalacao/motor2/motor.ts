// 📺 MOTOR 2D v2 (EXPERIMENTAL) — (A) a simulação. Plano: `docs/motor-2d-v2.md`.
// Diferença pro v1: aqui NADA é decidido antes. O jogo começa com os 22 no lugar e a bola no meio; daí cada jogador decide a
// cada 0,25 s (`decide.ts` / `coletivo.ts`), a bola obedece a física (`fisica.ts`), as disputas saem dos atributos da carta
// (`atributos.ts`) e o placar, as estatísticas e a narração (`narra.ts`) são CONSEQUÊNCIA do que aconteceu.
// Fala a mesma "língua" do desenho de hoje (`campo2d.tsx` lê atl, bola, bolaAnt, entre, narra, placar, festa, rede, t,
// tatica), então o campinho, a torcida e os bonecos não mudam.
// ⚠️ Isolado: só a bancada e a trava usam. Não decide placar de ninguém.
import { perfilDe } from './atributos'
import { alvoDe, andaBloco, ancora, linhaImpedimento, planeja, type Bloco } from './coletivo'
import { decide, pressaoEm, type Acao } from './decide'
import { AREA_LARG, AREA_PROF, DECISAO, DT, G, GOL_MEIO, L, SEG_POR_MIN, TRAVESSAO, W, ATRITO_AR, ATRITO_CHAO, clamp, dist, frente, fundo, len, linhaAtaque, sorteio, vRasteira, xgDe, yDe } from './fisica'
import { Narrador, PESO } from './narra'
import type { Atleta, Bola, CartaCampo, Estatistica, Evento, Grupo, Lado, TipoEvento } from './tipos'

const grupoDe = (pos?: string): Grupo => (pos === 'GOL' ? 'GOL' : pos === 'LAT' ? 'LAT' : pos === 'ZAG' ? 'DEF' : pos === 'MEI' ? 'MEI' : 'ATA')
const NEED: Record<string, Record<string, number>> = {
  '4-3-3': { GOL: 1, LAT: 2, ZAG: 2, MEI: 3, ATA: 3 }, '4-4-2': { GOL: 1, LAT: 2, ZAG: 2, MEI: 4, ATA: 2 }, '4-5-1': { GOL: 1, LAT: 2, ZAG: 2, MEI: 5, ATA: 1 },
  '3-4-3': { GOL: 1, LAT: 2, ZAG: 1, MEI: 4, ATA: 3 }, '5-3-2': { GOL: 1, LAT: 2, ZAG: 3, MEI: 3, ATA: 2 }, '4-2-4': { GOL: 1, LAT: 2, ZAG: 2, MEI: 2, ATA: 4 },
  '5-4-1': { GOL: 1, LAT: 2, ZAG: 3, MEI: 4, ATA: 1 },
}
/** os 11 pela formação do técnico (igual ao v1) */
function onze(cartas0: CartaCampo[], formacao?: string): CartaCampo[] {
  const cartas = cartas0.map(c => (c.pos || !c.sec ? c : { ...c, pos: c.sec }))
  if (cartas.length <= 11) return cartas
  const need = NEED[formacao ?? ''] ?? NEED['4-3-3'], out: CartaCampo[] = []
  for (const pos of ['GOL', 'LAT', 'ZAG', 'MEI', 'ATA']) out.push(...cartas.filter(c => c.pos === pos).sort((a, b) => (b.fame ?? 0) - (a.fame ?? 0)).slice(0, need[pos]))
  for (const c of cartas) if (out.length < 11 && !out.includes(c)) out.push(c)
  return out.slice(0, 11)
}

let idSeq = 0
function montaTime(lado: Lado, cartas: CartaCampo[], formacao?: string): Atleta[] {
  const lista = onze(cartas, formacao).slice(0, 11)
  while (lista.length < 11) lista.push({ name: '', pos: lista.some(c => c.pos === 'GOL') ? 'MEI' : 'GOL' })
  const por: Record<Grupo, CartaCampo[]> = { GOL: [], DEF: [], LAT: [], MEI: [], ATA: [] }
  for (const c of lista) por[grupoDe(c.pos)].push(c)
  if (!por.GOL.length) por.GOL.push((por.DEF.pop() ?? por.MEI.pop() ?? por.LAT.pop() ?? por.ATA.pop())!)
  const out: Atleta[] = []
  const linha = (cs: CartaCampo[], dep: number, gr: (i: number, n: number) => Grupo) => cs.forEach((c, i) => {
    const n = cs.length, bx = n === 1 ? 34 : 9 + (50 * i) / (n - 1), g = gr(i, n)
    const centro = n > 1 ? Math.abs(i - (n - 1) / 2) / ((n - 1) / 2) : 0
    const pf = perfilDe(c, g)
    out.push({
      id: idSeq++, lado, nome: c.name, carta: c, grupo: g, estilo: pf.estilo, golpes: pf.golpes, pe: pf.pe, at: pf.at, tend: pf.tend,
      bx, dep: g === 'MEI' ? dep - (1 - centro) * 0.08 : g === 'ATA' ? dep - (1 - centro) * 0.04 : dep,
      x: 34, y: 52.5, vx: 0, vy: 0, alvo: { x: 34, y: 52.5, v: 0 }, papel: 'forma', marca: null, proxDecisao: 0, atordoado: 0, amarelos: 0, expulso: false, gas: 1,
    })
  })
  linha(por.GOL.slice(0, 1), 0, () => 'GOL')
  const lats = por.LAT, zags = [...por.DEF, ...por.GOL.slice(1)]
  const defesa = lats.length >= 2 ? [lats[0], ...zags, ...lats.slice(1)] : [...lats, ...zags]
  linha(defesa, 0, (i, n) => ((lats.length >= 2 && (i === 0 || i === n - 1)) || (lats.length === 1 && i === 0) ? 'LAT' : 'DEF'))
  linha(por.MEI, 0.52, () => 'MEI')
  linha(por.ATA, 1, () => 'ATA')
  return out
}

type TipoParada = 'saida' | 'lateral' | 'escanteio' | 'tiro_de_meta' | 'falta' | 'penalti'
export interface Parada { tipo: TipoParada; lado: Lado; x: number; y: number; cobrador: Atleta; desde: number }
const ESPERA: Record<TipoParada, number> = { saida: 1.6, lateral: 0.9, escanteio: 2.2, tiro_de_meta: 1.4, falta: 1.8, penalti: 1.8 }

const zero2 = (): [number, number] => [0, 0]

export class Motor2 {
  t = 0
  atl: Atleta[]
  bola: Bola = { x: 34, y: L / 2, h: 0, vx: 0, vy: 0, vh: 0, dono: null, ultimo: null, lance: null }
  bolaAnt = { x: 34, y: L / 2, h: 0 }
  entre = 1
  narra = ''
  placar: [number, number] = [0, 0]
  tatica: [number, number] = [0, 0]
  festa: { lado: Lado; autor: string; assist?: string; min: number; ate: number } | null = null
  rede: { y0: number; t0: number } | null = null
  parada: Parada | null = null
  fim = false
  posseLado: Lado = 0
  bloco: Bloco[] = []
  opcaoDe = new Map<Atleta, { x: number; y: number }>()
  corrida = new Map<Atleta, { ate: number; alvo: { x: number; y: number } }>()
  donoDesde: number | null = null
  /** até quando quem acabou de receber segura a bola (não passa nem chuta — a não ser apertado ou de frente pro gol) */
  segurarAte = 0
  eventos: Evento[] = []
  stats: Estatistica = { posse: zero2(), passes: zero2(), passesCertos: zero2(), chutes: zero2(), noAlvo: zero2(), gols: zero2(), xg: zero2(), faltas: zero2(), amarelos: zero2(), vermelhos: zero2(), escanteios: zero2(), impedimentos: zero2(), laterais: zero2(), desarmes: zero2(), dribles: zero2(), interceptacoes: zero2(), defesas: zero2(), penaltis: zero2() }
  /** erros de REGRA achados pelo próprio motor (a trava reprova se aparecer algum) */
  diag = { foraDoCampo: 0, pulos: 0, reinicioErrado: 0, erros: [] as string[] }
  r: () => number
  private n: () => number
  private nar: Narrador
  private narraPeso = 0
  private narraAte = 0
  private passo = 0
  private tentou = new Map<Atleta, number>()
  private garcom: { de: Atleta; para: Atleta; t: number } | null = null
  private intervalo = false
  private acaoDe = new Map<Atleta, Acao>()

  constructor(seed: number, casa: CartaCampo[], fora: CartaCampo[], en = false, formacoes: [string?, string?] = [], tatica: [number, number] = [0, 0]) {
    const s = sorteio(seed)
    this.r = s.r; this.n = s.n
    this.nar = new Narrador(en, this.r)
    this.tatica = tatica
    this.atl = [...montaTime(0, casa, formacoes[0]), ...montaTime(1, fora, formacoes[1])]
    this.atl.forEach((p, i) => { p.proxDecisao = (i % 5) * 0.05 })
    for (const l of [0, 1] as Lado[]) this.bloco[l] = { tras: 18, frente: 48, largura: 0.75, desliza: 0 }
    for (const p of this.atl) { const a = ancora(this, p); p.x = a.x; p.y = clamp(a.y, p.lado === 0 ? L / 2 + 1 : 2, p.lado === 0 ? L - 2 : L / 2 - 1) }
    this.saida(0, true)
  }

  // ── consultas usadas pelo coletivo e pela decisão ──
  vmax(p: Atleta) { return (5.6 + p.at.vel * 0.038) * (p === this.bola.dono ? 0.88 : 1) * (0.85 + 0.15 * p.gas) }
  acel(p: Atleta) { return 4.2 + p.at.acel * 0.05 }
  /** onde a bola vai estar quando `p` chegar nela (ou onde ela está, se não há quem) */
  pontoBola(p?: Atleta): { x: number; y: number } {
    const b = this.bola
    if (b.dono) return { x: b.x, y: b.y }
    if (!p) return { x: b.x, y: b.y }
    // bola no AR: o lugar onde ela cai (quem chega antes espera lá; quem chega depois pega rolando)
    if (b.h > 0.05 || b.vh > 0.5) {
      const tl = (b.vh + Math.sqrt(b.vh * b.vh + 2 * G * Math.max(0, b.h))) / G
      const cai = { x: clamp(b.x + b.vx * tl, 0.5, W - 0.5), y: clamp(b.y + b.vy * tl, 0.5, L - 0.5) }
      if (dist(p, cai) / this.vmax(p) <= tl + 0.3) return cai
      return { x: clamp(cai.x + b.vx * 0.5, 0.5, W - 0.5), y: clamp(cai.y + b.vy * 0.5, 0.5, L - 0.5) }
    }
    let tt = dist(p, b) / this.vmax(p)
    for (let i = 0; i < 3; i++) {
      const v = len(b.vx, b.vy), andou = Math.max(0, v * tt - 0.5 * ATRITO_CHAO * tt * tt), k = v > 0.05 ? Math.min(andou, (v * v) / (2 * ATRITO_CHAO)) / v : 0
      const pt = { x: clamp(b.x + b.vx * k, 0.5, W - 0.5), y: clamp(b.y + b.vy * k, 0.5, L - 0.5) }
      tt = dist(p, pt) / this.vmax(p)
      if (i === 2) return pt
    }
    return { x: b.x, y: b.y }
  }
  /** o goleiro sai na bola se chega bem antes de todo mundo */
  goleiroSai(gk: Atleta) {
    const pt = this.pontoBola(gk), tg = dist(gk, pt) / this.vmax(gk)
    return this.atl.every(a => a === gk || a.lado === gk.lado || dist(a, pt) / this.vmax(a) > tg + 0.25)
  }
  /** onde cada um fica na bola parada (respeitando as distâncias da regra) */
  lugarNaCobranca(p: Atleta): { x: number; y: number; v: number } {
    const r = this.lugarNaCobranca0(p)
    // (longe do lugar, volta correndo — a saída depois do gol esperava o atacante que ainda estava no campo do rival)
    return { ...r, v: dist(p, r) > 12 ? Math.max(r.v, 8.5) : r.v }
  }
  private lugarNaCobranca0(p: Atleta): { x: number; y: number; v: number } {
    const pa = this.parada!, v = 6
    if (p === pa.cobrador) return { x: pa.x, y: pa.y, v: 7 }
    if (p.grupo === 'GOL' && p.lado !== pa.lado && pa.tipo !== 'saida') { const g = { x: 34, y: linhaAtaque((1 - p.lado) as Lado) + (p.lado === 0 ? -0.6 : 0.6) }; return { ...g, v } }
    const an = ancora(this, p)
    let x = an.x, y = an.y
    if (pa.tipo === 'saida') {
      // cada um no seu campo; o rival fora do círculo
      y = p.lado === 0 ? Math.max(y, L / 2 + 1.2) : Math.min(y, L / 2 - 1.2)
      if (p.lado !== pa.lado) { const dy = y - L / 2, dx = x - 34; if (len(dx, dy) < 10.5) y = L / 2 + (p.lado === 0 ? 10.5 : -10.5) }
      return { x, y, v }
    }
    if (pa.tipo === 'escanteio' || (pa.tipo === 'falta' && frente(pa.lado, pa.y) < 32)) {
      // na área: quem ataca sobe (5 de cabeça/finalização), quem defende marca
      const at = pa.lado, lin = linhaAtaque(at)
      const ataca = this.atl.filter(a => a.lado === at && a !== pa.cobrador && a.grupo !== 'GOL').sort((a, b) => b.at.cabeceio - a.at.cabeceio)
      const sobe = ataca.slice(0, 5)
      const i = sobe.indexOf(p)
      if (i >= 0) { const xs = [30, 38, 34, 27, 41], ys = [6, 8, 11, 12, 13]; return { x: xs[i], y: lin + (at === 0 ? ys[i] : -ys[i]), v: 7 } }
      if (p.lado !== at && p.grupo !== 'GOL') {
        const alvo = sobe[this.atl.filter(a => a.lado !== at && a.grupo !== 'GOL').indexOf(p) % Math.max(1, sobe.length)]
        if (alvo && (p.grupo === 'DEF' || p.grupo === 'LAT' || p.grupo === 'MEI')) { const a = this.lugarNaCobranca0(alvo); return { x: a.x + 0.8, y: a.y + (at === 0 ? 1.2 : -1.2), v: 7 } }
      }
    }
    // rival a 9,15 m da bola (falta/escanteio) · fora da área no tiro de meta · 2 m no lateral
    if (p.lado !== pa.lado) {
      const raio = pa.tipo === 'lateral' ? 2.5 : pa.tipo === 'tiro_de_meta' ? 0 : 9.6
      const dx = x - pa.x, dy = y - pa.y, d = len(dx, dy)
      if (raio && d < raio) { const k = raio / (d || 1); x = pa.x + dx * k; y = pa.y + dy * k }
      if (pa.tipo === 'tiro_de_meta' && fundo(pa.lado, y) < AREA_PROF + 1 && Math.abs(x - 34) < AREA_LARG + 1) y = yDe(pa.lado, AREA_PROF + 2)
    }
    return { x: clamp(x, 2, W - 2), y: clamp(y, 2, L - 2), v }
  }

  // ── relógio ──
  avancaAte(minuto: number) {
    const alvo = minuto * SEG_POR_MIN
    let n = 0
    while (this.t + DT <= alvo && n++ < 4000) {
      for (const a of this.atl) { a.ax = a.x; a.ay = a.y }
      this.bolaAnt.x = this.bola.x; this.bolaAnt.y = this.bola.y; this.bolaAnt.h = this.bola.h
      this.passa()
    }
    this.entre = clamp((alvo - this.t) / DT, 0, 1)
  }

  // ── um passo de simulação ──
  private passa() {
    const dt = DT
    this.t += dt
    this.passo++
    if (this.fim) { for (const p of this.atl) { p.vx *= 0.9; p.vy *= 0.9; p.x = clamp(p.x + p.vx * dt, -1.5, W + 1.5); p.y = clamp(p.y + p.vy * dt, -2, L + 2) } return }
    // posse
    const d = this.bola.dono
    if (d) this.posseLado = d.lado
    else if (this.bola.lance && this.bola.lance.tipo !== 'chute' && this.bola.lance.tipo !== 'cabeceio_gol') this.posseLado = this.bola.lance.de.lado
    if (d) this.stats.posse[d.lado] += dt
    else if (this.bola.lance) this.stats.posse[this.bola.lance.de.lado] += dt

    andaBloco(this, dt)
    if (this.passo % 5 === 0) planeja(this)

    // 🎉 festa do gol
    if (this.festa) {
      if (this.t >= this.festa.ate) { const sofreu = (1 - this.festa.lado) as Lado; this.festa = null; this.saida(sofreu) }
      else this.moveFesta()
    } else if (this.parada) this.cuidaParada()
    else {
      // ⏱️ intervalo e fim (só com a bola longe das áreas e sem chute no ar)
      const calmo = !(this.bola.lance && (this.bola.lance.tipo === 'chute' || this.bola.lance.tipo === 'cabeceio_gol')) && frente(0, this.bola.y) > 20 && frente(1, this.bola.y) > 20
      if (!this.intervalo && this.t >= 45 * SEG_POR_MIN && (calmo || this.t >= 46.5 * SEG_POR_MIN)) { this.intervalo = true; this.emite({ tipo: 'intervalo', lado: 0 }); this.saida(1); return }
      if (this.t >= 93 * SEG_POR_MIN && (calmo || this.t >= 94.5 * SEG_POR_MIN)) { this.fim = true; this.emite({ tipo: 'fim', lado: 0 }); this.bola.dono = null; this.bola.vx = this.bola.vy = 0; return }
      this.decisoes()
    }
    this.movimenta(dt)
    if (!this.festa && !this.parada) { this.fisicaBola(dt); this.disputas(); this.checaLinhas() }
    else this.grudaBolaParada()
  }

  private decisoes() {
    const d = this.bola.dono
    if (d && this.t >= d.proxDecisao) {
      // reavalia mais cedo se o marcador chegou
      const a = decide(this, d)
      this.acaoDe.set(d, a)
      d.proxDecisao = this.t + DECISAO
      this.executa(d, a)
    } else if (d && this.t >= d.proxDecisao - DECISAO + 0.1 && pressaoEm(this, d, d.lado) > 0.75 && this.acaoDe.get(d)?.tipo !== 'drible') d.proxDecisao = this.t
  }

  // ── execução das ações de quem tem a bola ──
  private executa(p: Atleta, a: Acao) {
    switch (a.tipo) {
      case 'chute': return this.chuta(p)
      case 'conduz': case 'drible': case 'segura': {
        const v = a.tipo === 'segura' ? 2.6 : this.vmax(p)
        p.alvo = { x: a.alvo.x, y: a.alvo.y, v }
        if (a.tipo === 'conduz' && p.tend.drible + (p.estilo === 'velocista' ? 0.3 : 0) > 0.45 && this.r() < 0.12) this.emite({ tipo: 'arrancada', lado: p.lado, a: p.nome })
        return
      }
      default: return this.passa_(p, a)
    }
  }
  private passa_(p: Atleta, a: Extract<Acao, { para: Atleta }>) {
    const l = p.lado, alvo = { ...a.alvo }
    const d0 = dist(p, alvo)
    // erro de execução: técnica, distância e pressão
    const pres = pressaoEm(this, p, l)
    const erro = (0.02 + (100 - p.at.passe) * 0.0016) * (1 + pres * 0.8) * d0
    alvo.x = clamp(alvo.x + this.n() * erro * 0.6, -3, W + 3); alvo.y = clamp(alvo.y + this.n() * erro * 0.6, -3, L + 3)
    const d = dist(this.bola, alvo) || 0.1
    const ux = (alvo.x - this.bola.x) / d, uy = (alvo.y - this.bola.y) / d
    const b = this.bola
    b.dono = null; b.ultimo = p; this.donoDesde = null
    if (this.parada) this.parada = null
    if (a.aereo) {
      const T = a.tipo === 'cruzamento' ? clamp(d / 21, 0.75, 1.5) : clamp(d / 18, 0.8, 2.2) // (bola longa vai em parábola e cai ~18 m/s: dá pra dominar)
      const hFim = a.tipo === 'cruzamento' ? 1.9 : 0.3
      b.vx = (ux * d) / T; b.vy = (uy * d) / T; b.vh = (hFim + 0.5 * G * T * T) / T; b.h = 0.05
    } else {
      // passe SECO (20 m em ~1 s, chegando a ~18 m/s — profissional domina); quem passa bem bate mais firme
      const v = a.tipo === 'chutao' ? clamp(vRasteira(d, 9), 12, 28) : clamp(11 + d * 0.42 + p.at.passe * 0.02, 11, 27)
      b.vx = ux * v; b.vy = uy * v; b.vh = 0; b.h = 0
    }
    // 🚩 impedimento: o alvo do passe à frente da bola e do penúltimo rival, no campo de ataque, NA HORA do passe
    const r = a.para
    const linha = linhaImpedimento(this, l)
    const impedido = r.lado === l && frente(l, r.y) < linha - 0.3 && frente(l, r.y) < frente(l, b.y) && frente(l, r.y) < L / 2
    b.lance = { tipo: a.tipo, de: p, para: r, t0: this.t, impedido }
    this.stats.passes[l]++
    r.papel = 'recebe'
    const tipo: TipoEvento = a.tipo === 'enfiada' ? 'enfiada' : a.tipo === 'lancamento' ? 'lancamento' : a.tipo === 'inversao' ? 'inversao' : a.tipo === 'cruzamento' ? 'cruzamento' : a.tipo === 'chutao' ? 'chutao' : 'passe'
    this.emite({ tipo, lado: l, a: p.nome, b: r.nome })
  }

  private chuta(p: Atleta, cabeca = false) {
    const l = p.lado, lin = linhaAtaque(l), b = this.bola
    const pres = pressaoEm(this, p, l), f = frente(l, p.y), dGol = len(p.x - 34, f)
    const xg = xgDe(l, p.x, p.y, pres, cabeca)
    // mira: um canto (quem finaliza bem mira mais no cantinho)
    const canto = (this.r() < 0.5 ? -1 : 1) * (GOL_MEIO - 0.5 - (p.at.finalizacao / 100) * 1.4 + this.r() * 0.6)
    const sigma = (0.35 + (100 - p.at.finalizacao) / 45) * (dGol / 15) * (1 + pres * 0.7) * (cabeca ? 1.3 : 1)
    const xAlvo = 34 + canto + this.n() * sigma
    const hAlvo = clamp((cabeca ? 0.6 : 0.4 + this.r() * 1.5) + this.n() * sigma * 0.45, 0.1, 6)
    const bomba = p.golpes.includes('bomba') || p.golpes.includes('falta_bomba')
    const v = cabeca ? 13 + p.at.cabeceio * 0.04 : clamp(17 + p.at.finalizacao * 0.09 + (bomba ? 5 : 0) + this.n() * 1.5, 14, 33)
    const dx = xAlvo - b.x, dy = lin - b.y, d = len(dx, dy) || 1, T = d / v
    b.dono = null; b.ultimo = p; this.donoDesde = null
    b.vx = (dx / d) * v; b.vy = (dy / d) * v; b.vh = (hAlvo - b.h + 0.5 * G * T * T) / T
    if (this.parada) this.parada = null
    b.lance = { tipo: cabeca ? 'cabeceio_gol' : 'chute', de: p, para: null, t0: this.t, impedido: false, xg, saiuDe: { x: p.x, y: p.y } }
    this.stats.chutes[l]++; this.stats.xg[l] += xg
    this.emite({ tipo: cabeca ? 'cabeceio' : 'chute', lado: l, a: p.nome })
  }

  // ── movimento dos 22 ──
  private movimenta(dt: number) {
    const d = this.bola.dono
    for (const p of this.atl) {
      if (!this.festa && !this.fim) {
        if (p === d) {
          const ac = this.acaoDe.get(p)
          if (!ac || ac.tipo === 'chute' || 'para' in ac) p.alvo = { x: p.x, y: p.y, v: 0 }
        } else if (p.atordoado > this.t) p.alvo = { x: p.x, y: p.y, v: 0 }
        else p.alvo = alvoDe(this, p)
      }
      const dx = p.alvo.x - p.x, dy = p.alvo.y - p.y, dd = len(dx, dy)
      let vq = Math.min(p.alvo.v, this.vmax(p))
      if (dd < 1.6) vq *= dd / 1.6
      const wx = dd > 0.01 ? (dx / dd) * vq : 0, wy = dd > 0.01 ? (dy / dd) * vq : 0
      const ax = wx - p.vx, ay = wy - p.vy, aa = len(ax, ay), lim = this.acel(p) * dt
      const k = aa > lim ? lim / aa : 1
      p.vx += ax * k; p.vy += ay * k
      p.x += p.vx * dt; p.y += p.vy * dt
    }
    // ninguém dentro de ninguém (o dono e quem disputa com ele podem colar)
    const n = this.atl.length
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      const a = this.atl[i], b = this.atl[j]
      // (perto da bola a disputa é de corpo: 1 m basta — senão o empurra-empurra não deixava ninguém chegar nela)
      const naBola = dist(a, this.bola) < 3 || dist(b, this.bola) < 3
      const min = naBola ? 1.0 : a.lado === b.lado ? 2.2 : 1.6
      const dx = b.x - a.x, dy = b.y - a.y, dd = len(dx, dy)
      if (dd < min && dd > 0.001) {
        const emp = Math.min(0.12, (min - dd) / 2), ux = dx / dd, uy = dy / dd
        if (a !== d) { a.x -= ux * emp; a.y -= uy * emp }
        if (b !== d) { b.x += ux * emp; b.y += uy * emp }
      }
    }
    for (const p of this.atl) {
      p.x = clamp(p.x, -1.5, W + 1.5); p.y = clamp(p.y, -2, L + 2)
      if (p.ax != null && len(p.x - p.ax, p.y - p.ay!) / dt > 13.5) this.diag.pulos++
    }
    // a bola no pé de quem conduz
    if (d) {
      const v = len(d.vx, d.vy), fy = d.lado === 0 ? -1 : 1
      const ux = v > 0.6 ? d.vx / v : 0, uy = v > 0.6 ? d.vy / v : fy
      const b = this.bola
      b.x = d.x + ux * 0.75; b.y = d.y + uy * 0.75; b.h = 0; b.vx = d.vx; b.vy = d.vy; b.vh = 0
    }
  }

  // ── a bola sem dono ──
  private fisicaBola(dt: number) {
    const b = this.bola
    if (b.dono) return
    if (b.h > 0 || b.vh > 0) {
      b.vh -= G * dt; b.h += b.vh * dt
      const k = 1 - ATRITO_AR * dt
      b.vx *= k; b.vy *= k
      if (b.h <= 0) {
        b.h = 0
        // (no quique a bola perde boa parte da velocidade — senão o lançamento caía e saía rolando 70 m)
        if (b.vh < -2.5) { b.vh = -b.vh * 0.4; b.vx *= 0.62; b.vy *= 0.62 } else { b.vh = 0; b.vx *= 0.8; b.vy *= 0.8 }
      }
    } else {
      const v = len(b.vx, b.vy)
      // (rasteira: a grama freia mais a bola rápida)
      if (v > 0) { const nv = Math.max(0, v - (ATRITO_CHAO + 0.07 * v) * dt); b.vx *= nv / v; b.vy *= nv / v }
    }
    const yAnt = b.y
    b.x += b.vx * dt; b.y += b.vy * dt
    this.goleiroNoChute(yAnt)
    // bola parou de vez sem ninguém: o lance acabou
    if (b.lance && len(b.vx, b.vy) < 0.3 && b.h <= 0) b.lance = null
  }

  /** 🧤 o chute cruzando a linha do goleiro: defende (encaixa ou espalma) ou passa */
  private goleiroNoChute(yAnt: number) {
    const b = this.bola, lc = b.lance
    if (!lc || (lc.tipo !== 'chute' && lc.tipo !== 'cabeceio_gol') || lc.defendido) return
    const def = (1 - lc.de.lado) as Lado, gk = this.atl.find(a => a.lado === def && a.grupo === 'GOL')
    if (!gk) return
    if ((yAnt - gk.y) * (b.y - gk.y) > 0) return // ainda não cruzou a linha dele
    const dx = Math.abs(b.x - gk.x), alc = 0.9 + 1.55 * (gk.at.reflexo / 100) + (gk.golpes.includes('defesa_milagrosa') ? 0.15 : 0)
    if (dx > alc || b.h > 2.55) return
    const v = len(b.vx, b.vy)
    const p = clamp(1.04 - (dx / alc) * 0.55 - (v - 15) / 42 + (gk.at.reflexo - 75) / 105, 0.06, 0.96)
    lc.defendido = true
    if (this.r() >= p) return // passou por ele
    this.stats.defesas[def]++
    if (v < 21 && dx < 0.8 && this.r() < 0.5 + gk.at.reflexo / 400) {
      b.vx = b.vy = b.vh = 0; b.h = 0; b.lance = null; b.ultimo = gk; this.pega(gk)
      this.emite({ tipo: 'encaixa', lado: def, a: gk.nome }); return
    }
    // espalma: a bola volta pro lado (rebote ou escanteio)
    const lado = b.x < 34 ? -1 : 1
    b.vx = lado * (4 + this.r() * 6); b.vy = -b.vy * (0.15 + this.r() * 0.25); b.vh = 1.5 + this.r() * 2; b.ultimo = gk
    lc.tipo = 'desvio'
    this.emite({ tipo: dx > alc * 0.7 ? 'espalma' : 'defesa', lado: def, a: gk.nome })
  }

  // ── quem domina a bola solta / corta o passe / cabeceia / desarma ──
  private disputas() {
    const b = this.bola
    if (b.dono) { this.desarmes(); return }
    const v = len(b.vx, b.vy), lc = b.lance
    const cands = this.atl.filter(p => !p.expulso && p.atordoado <= this.t && (this.tentou.get(p) ?? -9) < this.t - 0.35 && !(lc && lc.de === p && this.t - lc.t0 < 0.7)) // (quem chutou/passou não reencosta na bola na hora)
      .map(p => ({ p, d: dist(p, b) })).filter(c => c.d < (c.p.grupo === 'GOL' && this.naAreaDele(c.p, b) ? 1.9 : b.h > 1.5 ? 1.2 : 1.45)) // (um passo e o pé alcançam ~1,4 m)
      .sort((a, c) => a.d - c.d)
    for (const { p } of cands) {
      this.tentou.set(p, this.t)
      const gk = p.grupo === 'GOL' && this.naAreaDele(p, b)
      if (b.h > (gk ? 2.7 : 2.4)) continue // (bola acima da cabeça passa — só o goleiro, com a mão, alcança mais alto)
      // chute: rival na frente pode bloquear (o goleiro trata no `goleiroNoChute`)
      if (lc && (lc.tipo === 'chute' || lc.tipo === 'cabeceio_gol') && p.lado !== lc.de.lado && !gk) {
        if (this.t - lc.t0 > 0.12 && this.r() < 0.22 + p.at.desarme / 400) { b.vx *= -0.3 + this.r() * 0.2; b.vy *= -0.35; b.vx += (this.r() - 0.5) * 8; b.ultimo = p; lc.tipo = 'desvio'; this.emite({ tipo: 'bloqueio', lado: p.lado, a: p.nome }) }
        continue
      }
      if (lc && (lc.tipo === 'chute' || lc.tipo === 'cabeceio_gol') && p === lc.de) continue
      // bola alta: cabeceio
      if (b.h > 1.5 && !gk) { this.cabeceia(p); return }
      const meu = !!lc && lc.de.lado === p.lado
      const pOk = gk ? 0.93 : meu || !lc ? clamp(1.1 - v / 70 + (p.at.conducao - 60) / 250, 0.5, 0.98) : clamp(0.24 + (p.at.desarme + p.at.posicionamento - 110) / 220 + (v < 7 ? 0.3 : 0), 0.12, 0.85)
      if (this.r() < pOk) {
        // 🚩 impedimento: quem estava impedido NA HORA do passe e é o alvo, tocou primeiro
        if (lc && lc.impedido && lc.para === p && meu) {
          this.stats.impedimentos[p.lado]++
          this.emite({ tipo: 'impedimento', lado: p.lado, a: p.nome })
          this.para('falta', (1 - p.lado) as Lado, p.x, p.y); return
        }
        if (lc && meu && lc.tipo !== 'chute' && lc.tipo !== 'desvio' && lc.de !== p) { this.stats.passesCertos[p.lado]++; this.garcom = { de: lc.de, para: p, t: this.t } }
        if (lc && !meu && lc.tipo !== 'chute' && lc.tipo !== 'desvio' && lc.tipo !== 'chutao') { this.stats.interceptacoes[p.lado]++; this.emite({ tipo: 'intercepta', lado: p.lado, a: p.nome }) }
        if (gk && lc && !meu) this.emite({ tipo: 'saida_goleiro', lado: p.lado, a: p.nome })
        this.pega(p, gk ? 0.6 : 0.12 + (100 - p.at.conducao) * 0.0035)
        return
      }
      // não dominou: a bola espirra
      b.vx = b.vx * (0.3 + this.r() * 0.3) + (this.r() - 0.5) * 4; b.vy = b.vy * (0.3 + this.r() * 0.3) + (this.r() - 0.5) * 4; b.ultimo = p
      p.atordoado = this.t + 0.3
      return
    }
  }
  private naAreaDele(p: Atleta, pt: { x: number; y: number }) { return fundo(p.lado, pt.y) < AREA_PROF && Math.abs(pt.x - 34) < AREA_LARG }

  /** bola alta perto: quem ataca na área finaliza de cabeça; quem defende corta; no meio do campo vira passe de cabeça */
  private cabeceia(p: Atleta): void {
    const b = this.bola, l = p.lado
    // disputa aérea com quem estiver junto
    const rival = this.atl.filter(a => a.lado !== l && a.grupo !== 'GOL' && dist(a, b) < 1.6).sort((a, c) => dist(a, b) - dist(c, b))[0]
    if (rival) {
      const pa = clamp(0.5 + (p.at.cabeceio + p.at.fisico - rival.at.cabeceio - rival.at.fisico) / 160, 0.15, 0.85)
      if (this.r() > pa) { this.tentou.set(rival, this.t - 1); return this.cabeceia(rival) }
    }
    const atacaArea = frente(l, b.y) < AREA_PROF + 2 && Math.abs(b.x - 34) < AREA_LARG + 2
    if (atacaArea && b.lance && b.lance.de.lado === l) {
      if (b.lance.de !== p) { this.stats.passesCertos[l]++; this.garcom = { de: b.lance.de, para: p, t: this.t } }
      b.h = 1.8; return this.chuta(p, true)
    }
    const fy = l === 0 ? -1 : 1
    if (fundo(l, b.y) < 30) { // corte
      b.vx = (this.r() - 0.5) * 14; b.vy = fy * (12 + this.r() * 6); b.vh = 4 + this.r() * 2; b.ultimo = p; b.lance = { tipo: 'desvio', de: p, para: null, t0: this.t, impedido: false }
      return this.emite({ tipo: 'corte', lado: l, a: p.nome })
    }
    // passe de cabeça pra um companheiro perto
    const c = this.atl.filter(a => a.lado === l && a !== p && a.grupo !== 'GOL').sort((a, z) => dist(a, b) - dist(z, b))[0]
    if (c) { const d = dist(c, b) || 1; b.vx = ((c.x - b.x) / d) * 10; b.vy = ((c.y - b.y) / d) * 10; b.vh = 1.5; b.ultimo = p; b.lance = { tipo: 'cabeceio', de: p, para: c, t0: this.t, impedido: false } }
  }

  /** marcador colado no dono: desarme, falta ou drible (atributo contra atributo) */
  private desarmes() {
    const d = this.bola.dono!
    if (d.grupo === 'GOL' && this.naAreaDele(d, d)) return // (goleiro com a bola na mão ninguém toca)
    if (this.donoDesde != null && this.t - this.donoDesde < 0.25) return
    for (const z of this.atl) {
      if (z.lado === d.lado || z.atordoado > this.t || z.grupo === 'GOL') continue
      if (dist(z, d) > 1.5) continue
      if (this.r() > 2.3 * DT) continue
      const ac = this.acaoDe.get(d), dribla = ac?.tipo === 'drible'
      const carrinho = z.golpes.includes('carrinho') || (z.grupo === 'DEF' && this.r() < 0.15)
      // falta?
      let pF = clamp(0.06 + (60 - z.at.desarme) / 250 + (carrinho ? 0.05 : 0) + (d.at.conducao - 70) / 450, 0.03, 0.2)
      if (this.naAreaDele(z, d)) pF *= 0.35
      if (this.r() < pF) return this.falta(z, d)
      const pW = clamp(0.42 + (z.at.desarme - d.at.conducao) / 105 + (z.at.fisico - d.at.fisico) / 450 - (dribla ? 0.07 : 0), 0.12, 0.82)
      if (this.r() < pW) {
        this.stats.desarmes[z.lado]++
        this.emite({ tipo: carrinho ? 'carrinho' : 'desarme', lado: z.lado, a: z.nome, b: d.nome })
        d.atordoado = this.t + 0.5
        if (this.r() < 0.62) this.pega(z, 0.3)
        else { const b = this.bola; b.dono = null; b.ultimo = z; b.lance = null; b.vx = (this.r() - 0.5) * 9; b.vy = (this.r() - 0.5) * 9; this.donoDesde = null }
        return
      }
      // passou por ele
      z.atordoado = this.t + 0.85
      this.stats.dribles[d.lado]++
      const moves = d.golpes.filter(g => ['elastico', 'pedalada', 'chapeu', 'roleta', 'caneta', 'slalom', 'croqueta', 'corta_pra_dentro', 'cruyff'].includes(g))
      const golpe = moves.length && this.r() < 0.7 ? moves[Math.floor(this.r() * moves.length)] : undefined
      this.emite({ tipo: 'drible', lado: d.lado, a: d.nome, b: z.nome, golpe })
      return
    }
  }

  private falta(z: Atleta, d: Atleta) {
    this.stats.faltas[z.lado]++
    this.emite({ tipo: 'falta', lado: z.lado, a: z.nome, b: d.nome })
    if (this.r() < 0.16 + (z.golpes.includes('carrinho') ? 0.08 : 0)) {
      z.amarelos++
      this.stats.amarelos[z.lado]++
      if (z.amarelos >= 2) { this.stats.vermelhos[z.lado]++; this.emite({ tipo: 'vermelho', lado: z.lado, a: z.nome }); z.expulso = true; this.atl = this.atl.filter(a => a !== z) }
      else this.emite({ tipo: 'amarelo', lado: z.lado, a: z.nome })
    }
    if (this.naAreaDele(z, d)) { this.stats.penaltis[d.lado]++; this.para('penalti', d.lado, 34, yDe(z.lado, 11)) }
    else this.para('falta', d.lado, d.x, d.y)
  }

  /** a bola passou de alguma linha? gol · trave · escanteio · tiro de meta · lateral */
  private checaLinhas() {
    const b = this.bola
    // (conduzindo, a bola saiu do campo: vale como bola fora, tocada por ele)
    if (b.dono && (b.x < 0 || b.x > W || b.y < 0 || b.y > L)) { b.ultimo = b.dono; b.dono = null; b.lance = null; this.donoDesde = null }
    if (b.dono) return
    if (b.y < 0 || b.y > L) {
      const def: Lado = b.y < 0 ? 1 : 0, ata = (1 - def) as Lado, x = b.x
      const dx = Math.abs(x - 34), lc = b.lance
      const chute = !!lc && (lc.tipo === 'chute' || lc.tipo === 'cabeceio_gol' || lc.tipo === 'desvio')
      if (dx > GOL_MEIO - 0.13 && dx < GOL_MEIO + 0.2 && b.h < TRAVESSAO + 0.1 && chute) {
        // 🥅 trave: volta pro campo
        b.y = def === 1 ? 0.3 : L - 0.3; b.vy = -b.vy * 0.5; b.vx = -b.vx * 0.4 + (this.r() - 0.5) * 6; if (lc) lc.tipo = 'desvio'
        return this.emite({ tipo: 'trave', lado: ata, a: lc?.de.nome })
      }
      if (dx <= GOL_MEIO && b.h <= TRAVESSAO) return this.gol(ata)
      if (lc && (lc.tipo === 'chute' || lc.tipo === 'cabeceio_gol')) this.emite({ tipo: b.h > TRAVESSAO + 1 ? 'isolou' : 'fora', lado: ata, a: lc.de.nome })
      if (b.ultimo && b.ultimo.lado === def) { this.stats.escanteios[ata]++; this.emite({ tipo: 'escanteio', lado: ata }); return this.para('escanteio', ata, x < 34 ? 0.6 : W - 0.6, def === 1 ? 0.6 : L - 0.6) }
      this.emite({ tipo: 'tiro_de_meta', lado: def })
      return this.para('tiro_de_meta', def, 34 + (x < 34 ? -9 : 9), yDe(def, 5.5))
    }
    if (b.x < 0 || b.x > W) {
      const quem = b.ultimo ? ((1 - b.ultimo.lado) as Lado) : ((1 - this.posseLado) as Lado)
      this.stats.laterais[quem]++
      this.emite({ tipo: 'lateral', lado: quem })
      return this.para('lateral', quem, b.x < 0 ? 0 : W, clamp(b.y, 1, L - 1))
    }
  }

  private gol(lado: Lado) {
    const lc = this.bola.lance, autor = lc && lc.de.lado === lado ? lc.de : this.bola.ultimo?.lado === lado ? this.bola.ultimo : null
    if (lc && lc.tipo !== 'desvio') this.stats.noAlvo[lado]++
    this.placar[lado]++; this.stats.gols[lado]++
    const g = this.garcom && autor && this.garcom.para === autor && this.t - this.garcom.t < 9 ? this.garcom.de.nome : undefined
    const nome = autor?.nome ?? (this.bola.ultimo?.nome ? `${this.bola.ultimo.nome} (contra)` : '')
    this.festa = { lado, autor: nome, assist: g, min: Math.min(93, Math.floor(this.t / SEG_POR_MIN) + 1), ate: this.t + 3.3 }
    this.rede = { y0: linhaAtaque(lado), t0: this.t }
    this.emite({ tipo: 'gol', lado, a: nome, b: g })
    const b = this.bola; b.dono = null; b.vx *= 0.15; b.vy *= 0.15; b.lance = null; this.garcom = null
  }

  private moveFesta() {
    const f = this.festa!, autor = this.atl.find(a => a.lado === f.lado && a.nome === f.autor)
    for (const p of this.atl) {
      if (autor && p === autor) { p.alvo = { x: autor.x < 34 ? 3 : W - 3, y: linhaAtaque(f.lado) + (f.lado === 0 ? 6 : -6), v: 6.5 }; continue }
      if (autor && p.lado === f.lado && dist(p, autor) < 22 && p.grupo !== 'GOL') { p.alvo = { x: autor.x + (p.x < autor.x ? -1.5 : 1.5), y: autor.y + (p.y < autor.y ? -1.5 : 1.5), v: 6 }; continue }
      const a = ancora(this, p); p.alvo = { x: a.x, y: p.lado === 0 ? Math.max(a.y, L / 2 + 2) : Math.min(a.y, L / 2 - 2), v: 4.5 }
    }
  }

  // ── bola parada ──
  private para(tipo: TipoParada, lado: Lado, x: number, y: number) {
    const b = this.bola
    b.dono = null; b.vx = b.vy = b.vh = 0; b.h = 0; b.lance = null; b.x = clamp(x, 0, W); b.y = clamp(y, 0, L); this.donoDesde = null
    const time = this.atl.filter(a => a.lado === lado)
    let cob: Atleta
    if (tipo === 'tiro_de_meta') cob = time.find(a => a.grupo === 'GOL') ?? time[0]
    else if (tipo === 'saida') cob = time.filter(a => a.grupo === 'ATA' || a.grupo === 'MEI').sort((a, c) => dist(a, b) - dist(c, b))[0] ?? time[0]
    else if (tipo === 'escanteio') cob = time.filter(a => a.grupo !== 'GOL').sort((a, c) => c.at.passe + c.tend.cruza * 30 - a.at.passe - a.tend.cruza * 30)[0]
    else if (tipo === 'penalti') cob = time.filter(a => a.grupo !== 'GOL').sort((a, c) => c.at.finalizacao - a.at.finalizacao)[0]
    else if (tipo === 'falta' && frente(lado, y) < 30) cob = time.filter(a => a.grupo !== 'GOL').sort((a, c) => c.at.finalizacao + c.tend.chuteLonge * 25 - a.at.finalizacao - a.tend.chuteLonge * 25)[0]
    else cob = time.filter(a => a.grupo !== 'GOL').sort((a, c) => dist(a, b) - dist(c, b))[0] ?? time[0]
    this.parada = { tipo, lado, x: b.x, y: b.y, cobrador: cob, desde: this.t }
    this.posseLado = lado
    planeja(this)
  }
  private saida(lado: Lado, inicio = false) {
    this.para('saida', lado, 34, L / 2)
    if (inicio) {
      for (const p of this.atl) { const a = this.lugarNaCobranca(p); p.x = a.x; p.y = a.y }
      this.emite({ tipo: 'saida', lado })
    }
  }
  private cuidaParada() {
    const pa = this.parada!, c = pa.cobrador
    if (!this.atl.includes(c)) { this.para(pa.tipo, pa.lado, pa.x, pa.y); return }
    const pronto = dist(c, pa) < 0.9 && this.t - pa.desde >= ESPERA[pa.tipo]
    if (!pronto && this.t - pa.desde < ESPERA[pa.tipo] + 4) return
    // REGRA da distância (rival a 9,15 m na falta/escanteio, fora da área no tiro de meta, no próprio campo na saída)
    const ok = this.atl.every(a => {
      if (a === c) return true
      if (pa.tipo === 'saida') return a.lado === 0 ? a.y >= L / 2 - 0.5 : a.y <= L / 2 + 0.5
      if (a.lado === pa.lado) return true
      if (pa.tipo === 'falta' || pa.tipo === 'escanteio') return dist(a, pa) > 8.6
      if (pa.tipo === 'tiro_de_meta') return !(fundo(pa.lado, a.y) < AREA_PROF && Math.abs(a.x - 34) < AREA_LARG)
      return true
    })
    if (!ok && this.t - pa.desde < ESPERA[pa.tipo] + 4) return
    if (!ok) this.diag.reinicioErrado++
    // cobra: a decisão é a de sempre, com a restrição da cobrança (lateral só passa, escanteio cruza, tiro de meta não dribla…)
    if (dist(c, pa) > 1.2 && this.t - pa.desde < ESPERA[pa.tipo] + 6) return // (o cobrador ainda está chegando — nada de teletransporte)
    this.bola.dono = c; this.bola.ultimo = c; this.donoDesde = this.t
    const a = decide(this, c)
    this.acaoDe.set(c, a)
    if (a.tipo === 'conduz' || a.tipo === 'drible' || a.tipo === 'segura') { this.parada = null; c.proxDecisao = this.t + DECISAO; return }
    this.executa(c, a)
    this.parada = null
  }
  private grudaBolaParada() {
    const pa = this.parada
    if (pa) { this.bola.x = pa.x; this.bola.y = pa.y; this.bola.h = 0 }
    else if (this.festa) { const b = this.bola; b.vx *= 0.9; b.vy *= 0.9; b.x += b.vx * DT; b.y += b.vy * DT }
  }

  private pega(p: Atleta, toque = 0.15) {
    const b = this.bola
    b.dono = p; b.ultimo = p; b.lance = null; b.h = 0; b.vh = 0
    this.posseLado = p.lado; this.donoDesde = this.t
    // ⏳ quem recebe fica um tempo com a bola (domina, levanta a cabeça, conduz) antes de soltar — 0,4 a 1,3 s; quem joga de
    // primeira (passador, finalizador) às vezes solta na hora. Apertado pelo marcador, solta antes (`decide` olha a pressão).
    const primeira = (p.estilo === 'passador' || p.golpes.includes('de_primeira')) && this.r() < 0.25
    this.segurarAte = primeira ? this.t : this.t + 0.4 + this.r() * 0.9 - p.at.decisao * 0.002
    p.proxDecisao = this.t + toque
    this.acaoDe.delete(p)
  }

  emite(e: Omit<Evento, 't'>) {
    const ev: Evento = { t: this.t, ...e }
    this.eventos.push(ev)
    const peso = PESO[e.tipo]
    if (peso == null) return
    if (peso < this.narraPeso && this.t < this.narraAte) return
    const txt = this.nar.texto(ev)
    if (!txt) return
    this.narra = txt; this.narraPeso = peso; this.narraAte = this.t + (peso >= 6 ? 2.2 : 1.3)
  }
}

export { DT, SEG_POR_MIN, W, L }
