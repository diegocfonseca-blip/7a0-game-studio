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
import { estiloDe, golpesDe, peDe, type Estilo, type Golpe, type Pe } from './campo2d-estilos'
import { frase, type ChaveNarra } from './campo2d-narracao'

export const W = 68, L = 105
/** 93' em 90 s no automático do 2D (decisão do Diego: 1:30 por jogo) */
export const SEG_POR_MIN = 90 / 93
export const DUR_2D_MS = Math.round(90_000 / 0.82) // o `roundMs` que faz o placar andar 93' em 90 s (o placar anima em roundMs × 0,82)
const DT = 1 / 50
const ANTECEDE = 8.5 // segundos de jogada antes de um evento (gol/chance)
const FESTA = 4.2 // segundos de comemoração do gol

export type Lado = 0 | 1 // 0 = mandante (ataca pra CIMA, y → 0)
export type Fim = 'gol' | 'defendeu' | 'trave' | 'fora' | 'isolou'
/** 🎯 COMO a bola foi batida (20/10, Diego: *"chute colocado, de trivela, gol de cabeça, de bicicleta, de barriga, de canhota…"*).
 *  Muda a trajetória (altura, força, curva) e a narração — nunca o resultado, que é o do jogo. */
export type Acab = 'rasteiro' | 'colocado' | 'trivela' | 'folha_seca' | 'tres_dedos' | 'bomba' | 'cobertura' | 'cavadinha' | 'voleio' | 'bicicleta' | 'calcanhar' | 'cabeca' | 'de_bico' | 'de_primeira' | 'barriga'
/** altura (m) · força (× a base) · curva (m, pro lado de dentro = negativo) · quanto tempo o lance de armar pede antes */
const ACAB: Record<Acab, { alt: number; vel: number; curva: number }> = {
  rasteiro: { alt: 0.3, vel: 1, curva: 0 }, colocado: { alt: 0.9, vel: 0.9, curva: -3 }, trivela: { alt: 1, vel: 0.95, curva: 3.2 }, folha_seca: { alt: 2.2, vel: 1.05, curva: -1.6 },
  tres_dedos: { alt: 1.1, vel: 1.1, curva: 3.6 }, bomba: { alt: 0.7, vel: 1.35, curva: 0 }, cobertura: { alt: 3.2, vel: 0.55, curva: 0 }, cavadinha: { alt: 2.4, vel: 0.5, curva: 0 },
  voleio: { alt: 1.3, vel: 1.2, curva: 0 }, bicicleta: { alt: 1.6, vel: 1.1, curva: 0 }, calcanhar: { alt: 0.3, vel: 0.65, curva: 0 }, cabeca: { alt: 1.2, vel: 0.75, curva: 0 },
  de_bico: { alt: 0.4, vel: 1.15, curva: 0 }, de_primeira: { alt: 0.6, vel: 1.1, curva: 0 }, barriga: { alt: 0.5, vel: 0.5, curva: 0 },
}
const COMO: Record<Acab, [string, string]> = {
  rasteiro: ['rasteiro, no canto', 'low into the corner'], colocado: ['colocado, no cantinho', 'placed into the corner'], trivela: ['de TRIVELA', 'with the OUTSIDE of the boot'],
  folha_seca: ['de folha seca — a bola caiu na hora', 'a dipping knuckleball'], tres_dedos: ['de três dedos', 'with the outside of the foot'], bomba: ['uma BOMBA', 'a THUNDERBOLT'],
  cobertura: ['de COBERTURA, por cima do goleiro', 'CHIPPED over the keeper'], cavadinha: ['de cavadinha', 'with a cheeky chip'], voleio: ['de VOLEIO', 'on the VOLLEY'],
  bicicleta: ['de BICICLETA!', 'an OVERHEAD KICK!'], calcanhar: ['de CALCANHAR', 'with a BACKHEEL'], cabeca: ['de cabeça', 'with a header'], de_bico: ['de bico', 'with a toe-poke'],
  de_primeira: ['de primeira', 'first time'], barriga: ['de BARRIGA! Feio, mas vale', 'off the BELLY! Ugly, but it counts'],
}
export interface Evento { min: number; lado: Lado; fim: Fim; autor?: string; assist?: string }
export interface CartaCampo { name: string; pos?: string; club?: string; year?: number; fame?: number; fake?: boolean }
type Grupo = 'GOL' | 'DEF' | 'LAT' | 'MEI' | 'ATA'
export interface Atleta { lado: Lado; nome: string; carta?: CartaCampo; estilo: Estilo; /** 🎯 os golpes assinatura (só lenda) */ golpes: Golpe[]; /** 🦶 pé conhecido (só lenda famosa por ele) */ pe: Pe; grupo: Grupo; bx: number; dep: number; x: number; y: number; /** onde estava no passo anterior (só pro DESENHO ficar liso) */ ax?: number; ay?: number; ov: { x: number; y: number; v: number; busca?: boolean } | null }
interface Voo { x0: number; y0: number; x1: number; y1: number; t: number; dur: number; alt: number; lin: boolean; fim?: () => void; /** 🌀 curva (metros pro lado, no meio do caminho): colocado, trivela, folha seca */ curva?: number }
type Acao = { ini?: () => void; upd: (dt: number) => boolean; /** enfeite: pode ser cortado pelo prazo do lance decisivo e pelo lance seguinte */ pre?: boolean; /** reinício (tiro de meta, lateral, reposição): só o lance SEGUINTE corta — o prazo do lance anterior não */ pos?: boolean; /** o chute: o vigia nunca derruba (é ele que faz o placar) */ chute?: boolean }

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
    const g = gr(i, n), centro = n > 1 ? Math.abs(i - (n - 1) / 2) / ((n - 1) / 2) : 0 // 0 no meio · 1 na ponta
    const profundidade = g === 'LAT' ? dep - 0.12 : g === 'MEI' || g === 'ATA' ? dep + (1 - centro) * 0.07 : dep // meio e ataque em "V": os do centro um passo atrás
    out.push({ lado, nome: c.name, carta: c, estilo: estiloDe(c.name, c.fame), golpes: golpesDe(c.name, c.fame), pe: peDe(c.name, c.fame), grupo: g, bx, dep: profundidade, x: 34, y: 52, ov: null })
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
  festa: { de?: number; abraco?: Atleta[]; curta?: boolean; ate: number; lado: Lado; autor: string; assist?: string; min: number } | null = null
  rede: { y0: number; t0: number } | null = null
  placar: [number, number] = [0, 0]
  /** 🔎 conferência das REGRAS (o teste lê): bola colocada parada (saída, lateral, escanteio, tiro de meta, falta) ·
   *  bola que "voou" sozinha pro pé de alguém longe · quantos atacantes estavam na área em cada escanteio cobrado */
  diag = { colocadas: 0, magicas: 0, escanteios: [] as number[], saidas: 0, laterais: 0, tirosDeMeta: 0, moldes: {} as Record<string, number>, reinicioErrado: 0, paradaSemCobranca: 0, cobrancasForcadas: 0, erros: [] as string[], acabs: {} as Record<string, number>, chutesLonge: 0, chancesPuladas: 0, reinicioSemSair: 0, travadas: 0, chutesBandeirinha: 0, bolaParadaIrregular: 0, cobrancasConferidas: 0 }
  private deslizando = false
  /** ⏱️ o instante do lance decisivo que está sendo montado (pra "pressa": atrasado, todo mundo dá um pique) */
  private tLance: number | null = null
  /** 🏃 ATRASADO? Todo mundo acelera (até 1,8×) e a bola anda mais rápido — é um pique, nunca um teletransporte */
  private pressa() { if (this.tLance == null) return 1; return clamp(1 + (this.t - (this.tLance - 2)) / 3, 1, 1.8) }
  private rng: () => number
  private evs: Evento[]
  private iev = 0
  private acoes: Acao[] = []
  private cur: Acao | null = null
  /** 🐕 vigia: desde quando a bola está no MESMO lugar (com o jogo rolando) */
  /** 🎙️ até quando a frase do RESULTADO (isolou, na trave, defendeu) fica na tela sem a cobrança passar por cima */
  private narraForteAte = 0
  private ovDesde = new WeakMap<object, number>()
  private angDono = 0; private donoLivre: Atleta | null = null
  private paradaDesde = 0; private paradaK = ''; private paradaFoto: number[] = []
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
  private preferido(l: Lado, g: Grupo[], est: Estilo[], fora?: Atleta | null | (Atleta | null)[]): Atleta {
    const tira = Array.isArray(fora) ? fora : [fora]
    const cands = this.do(l, g).filter(a => !tira.includes(a))
    const bons = cands.filter(a => est.includes(a.estilo))
    const base = cands.length ? cands : this.time(l).filter(a => a.grupo !== 'GOL' && !tira.includes(a))
    return bons.length && this.rng() < 0.75 ? this.sorteia(bons) : this.sorteia(base)
  }
  private porNome(l: Lado, nome?: string) { return nome ? this.time(l).find(a => a.nome === nome && !!a.nome) : undefined }
  private n(a?: Atleta | null) { return a?.nome ? `<b>${a.nome}</b>` : (this.en ? 'the player' : 'o jogador') }
  private tt(pt: string, en: string) { return this.en ? en : pt }
  /** 🎙️ uma frase do banco (sorteada entre as versões), com os nomes no lugar */
  private v(k: ChaveNarra, vars: Record<string, string> = {}) { return frase(k, this.en, this.rng(), vars) }

  // ── a forma do time: linhas sobem/descem com a bola, com a posse e com a tática ─────────────────────────────────────────
  private rel(l: Lado, x: number, y: number) { return l === 0 ? { x, y } : { x: W - x, y: L - y } }
  /** 🧱 onde o BLOCO do time quer estar (linha da frente, linha de trás, quanto ele puxa pro lado da bola) */
  private blocoDesejado(l: Lado) {
    const b = this.rel(l, this.bola.x, this.bola.y), tac = this.tatica[l], ataca = this.posse === l
    let frente: number, fundo: number
    if (ataca) { frente = clamp(b.y - 14 - 6 * tac, 6, 60); fundo = clamp(frente + 46 - 5 * tac, 38, 90) }
    else { frente = clamp(b.y + 2 - 6 * tac, 30, 78); fundo = clamp(frente + 30 - 2 * tac, 60, 96) }
    return { frente, fundo, puxa: (b.x - 34) * (ataca ? 0.22 : 0.34), ataca: ataca ? 1 : 0, bx: b.x }
  }
  /** 🧱 o bloco ANDA junto e liso (Diego 20/10: *"não tem uma sincronia boa"*): antes a linha do time saltava 10–20 m toda
   *  vez que a posse trocava, e com a bola indo e vindo o time inteiro ia e voltava (566 "vai-e-volta" em 60 jogos). Agora a
   *  linha caminha até onde quer, a no máx. ~7 m/s, e a troca de posse vira uma transição, não um pulo. */
  private bloco: { frente: number; fundo: number; puxa: number; ataca: number; bx: number }[] = []
  private andaBloco(dt: number) {
    for (const l of [0, 1] as Lado[]) {
      const d = this.blocoDesejado(l), b = this.bloco[l]
      if (!b) { this.bloco[l] = d; continue }
      const anda = (de: number, para: number, v: number) => de + clamp(para - de, -v * dt, v * dt)
      b.frente = anda(b.frente, d.frente, 7); b.fundo = anda(b.fundo, d.fundo, 7); b.puxa = anda(b.puxa, d.puxa, 6)
      b.ataca = anda(b.ataca, d.ataca, 0.8); b.bx = anda(b.bx, d.bx, 12)
    }
  }
  private alvoForma(p: Atleta) {
    const blk = this.bloco[p.lado] ?? this.blocoDesejado(p.lado), tac = this.tatica[p.lado], ataca = blk.ataca > 0.5
    if (p.grupo === 'GOL') return this.rel(p.lado, 34 + (blk.bx - 34) * 0.12 + Math.sin(this.t * 0.6 + p.lado * 1.7) * 0.7, 99 + 2.5 * (1 - blk.ataca)) // (o goleiro se ajeita na linha, nunca parado de estátua)
    const frente = blk.frente, fundo = blk.fundo
    let y = frente + (fundo - frente) * p.dep
    // ↔️ o time desliza pro lado da bola ENCOLHENDO a largura (Diego 20/10: *"não tem sincronia"*): antes ele só somava o
    // deslize, e quem já estava aberto passava da linha e ficava preso na lateral — 3, 4 jogadores amontoados longe da bola
    const largura = ataca ? 0.92 : 0.72
    let x = 34 + (p.bx - 34) * largura + blk.puxa * 0.9
    if (ataca && p.grupo === 'ATA' && (p.bx < 20 || p.bx > 48)) x = 34 + (p.bx - 34) * 0.95 + (blk.bx - 34) * 0.08
    x = clamp(x, 4, W - 4)
    if (ataca && p.grupo === 'LAT' && tac >= 0) y -= p.estilo === 'apoiador' ? 12 : 6
    // 🚶 NINGUÉM FICA PLANTADO (Diego 20/10: *"não parece que tá tendo futebol"*): um terço dos jogadores ficava parado com a
    // bola rolando. Agora cada um tem um vaivém próprio em volta do lugar dele — atacante se desmarca mais (diagonal pra
    // frente e pros lados), defensor só ajusta. Liso e igual em todo aparelho (depende só do relógio do jogo).
    {
      const ph = p.bx * 0.37 + p.dep * 5.1 + p.lado * 2.3 + (p.grupo === 'ATA' ? 1.1 : 0)
      const amp = (ataca ? 1 : 0.6) * (p.grupo === 'ATA' ? 3.2 : p.grupo === 'MEI' ? 2.4 : 1.4)
      x += Math.sin(this.t * 0.55 + ph) * amp
      y += Math.cos(this.t * 0.41 + ph * 1.3) * amp * (ataca && p.grupo === 'ATA' ? 1.3 : 0.7)
    }
    const r = this.rel(p.lado, x, y)
    return { x: clamp(r.x, 1.5, W - 1.5), y: clamp(r.y, 0.5, L - 0.5) } // ninguém se posiciona fora das linhas
  }
  private marcador(): Atleta | null {
    const d = this.bola.dono
    if (!d || this.parada != null) return null // (bola parada não tem marcador: ninguém cola em quem vai cobrar — é regra)
    let best: Atleta | null = null, bd = 1e9
    for (const q of this.atl) if (q.lado !== d.lado && q.grupo !== 'GOL' && !q.ov) { const dd = dist(q, this.bola); if (dd < bd) { bd = dd; best = q } }
    return best
  }

  // ── um passo fixo de simulação ──────────────────────────────────────────────────────────────────────────────────────────
  private passo(dt: number) {
    this.t += dt
    // 🏁 depois do apito final (93'), o jogo só termina o que estiver PENDENTE (um gol dos acréscimos que ainda não saiu, a
    // festa aberta) e congela — nada de saída de bola fantasma nem de enfeite depois do fim
    if (this.t > 93.5 * SEG_POR_MIN && !this.festa) {
      const pendente = this.iev < this.evs.length || (this.cur && !this.cur.pre) || this.acoes.some(a => !a.pre)
      if (!pendente) return
    }
    if (this.festa) {
      // 🎉 comemoração: o time que marcou corre pro autor; o outro volta pro meio
      const autor = this.porNome(this.festa.lado, this.festa.autor) ?? this.gk(this.festa.lado)
      const volta = this.t >= (this.festa.de ?? this.festa.ate) + 1.3 || this.t >= this.festa.ate - 3 || !!this.festa.curta // o abraço dura ~1,3 s e todo mundo volta pro próprio campo ainda com o GOL na tela (festa curta: já volta direto)
      // 🫂 só quem está PERTO vai abraçar quem fez o gol (os 4 mais perto); o resto já volta trotando pro meio — como na TV.
      // Antes o time inteiro ia lá na área do rival e depois tinha que correr 40 m: a saída demorava 3–5 s com o jogo parado.
      if (!this.festa.abraco) this.festa.abraco = this.time(this.festa.lado).filter(p => p !== autor && p.grupo !== 'GOL').sort((a, b) => dist(a, autor) - dist(b, autor)).slice(0, 4)
      for (const p of this.atl) {
        const abraca = !volta && p.lado === this.festa.lado && (p === autor || this.festa.abraco.includes(p))
        const sai = (1 - this.festa.lado) as Lado, casa = this.posSaida(p), longe = dist(p, casa) > 15
        const a = abraca ? { x: autor.x + (p.bx - 34) * 0.08, y: autor.y + (p.dep - 0.5) * 3 } : this.rotaSaida(p, casa, sai)
        this.anda(p, a, p === autor && !volta ? 3 : abraca ? 7 : volta ? (longe ? 11 : 8) : (longe ? 8 : 5), dt)
      }
      if (volta) this.espaca(dt, null) // (na volta pro meio ninguém anda um em cima do outro; no abraço, pode)
      if (this.t >= this.festa.ate) {
        // ⚽ GOL = BOLA NO MEIO: quem tomou dá a saída (regra do Diego, 20/10)
        const sai = (1 - this.festa.lado) as Lado
        this.festa = null; this.rede = null; this.prazo = null; this.acoes = []; this.cur = null
        if (this.t <= 93.5 * SEG_POR_MIN) this.saida(sai)
      }
      return
    }
    // ⏰ estourou o prazo do enfeite: corta o que sobrou dele e vai direto pro final da jogada
    if (this.prazo != null && this.t >= this.prazo) {
      if (this.cur?.pre && !this.cur.pos) { this.cur = null; for (const a of this.atl) if (a.ov && a.ov.v < 9) a.ov = null }
      // (os reinícios de DEPOIS do lance ficam: são eles que tiram a bola do chão — mas só se a bola SAIU mesmo; cobrança de uma
      // saída que foi cortada antes de acontecer é lateral do nada, com a bola rolando)
      const saiu = !!this.semReinicio || this.parada != null
      this.acoes = this.acoes.filter(a => !a.pre || (a.pos && saiu))
      this.prazo = null
    }
    // ⏰ o lance do jogo está chegando e o que corre é ENCHIMENTO (troca de passe, lateral, tiro de meta…): corta e vai pro lance
    const prox = this.evs[this.iev]
    // (com a bola PARADA no chão — lateral, tiro de meta — espera alguém pegar; cortar aí deixaria a bola morta no gramado)
    // (a COBRANÇA de bola parada nunca é cortada: lateral, tiro de meta, escanteio, falta e saída vão até o fim)
    const cortavel = (a?: Acao | null) => !!a && !!a.pre && !a.pos
    if (prox && this.prazo == null && prox.min * SEG_POR_MIN - this.t <= ANTECEDE + 1 && (cortavel(this.cur) || this.acoes.some(cortavel)) && (this.bola.dono || this.bola.voo) && this.parada == null) {
      if (cortavel(this.cur)) { this.cur = null; for (const a of this.atl) a.ov = null }
      // (e a cobrança que vinha DEPOIS desse enfeite sai junto: a bola não saiu, então não tem lateral/tiro de meta pra cobrar)
      this.acoes = this.acoes.filter(a => !cortavel(a) && !(a.pre && !this.semReinicio))
    }
    // 🧑‍⚖️ O JUIZ: a bola saiu e parou fora — ninguém joga antes da COBRANÇA certa (lateral, escanteio ou tiro de meta,
    // por quem tocou por último). Se ela não está na fila, entra NA FRENTE (o lance decisivo, se houver, espera atrás dela).
    if (this.semReinicio && !this.bola.voo && !this.bola.dono && !this.festa && this.foraDoCampo() && !this.cur?.pos && !this.acoes.some(a => a.pos)) {
      this.cur = null
      for (const a of this.atl) if (a.ov && a.ov.v < 9) a.ov = null
      this.acoes.unshift(...this.cobrancaDaSaida())
    }
    // e bola PARADA dentro do campo (tiro de meta, falta, saída) sem a cobrança na fila: o cobrador do time certo bate primeiro
    // (também quando o cobrador JÁ está com a bola na mão e a cobrança dele foi cortada: ele bate)
    else if (this.parada != null && !this.bola.voo && (!this.bola.dono || this.bola.dono.lado === this.parada) && !this.festa && !this.cur?.pos && !(this.bola.dono && this.acoes[0]?.pos)) {
      // a cobrança já está na fila, mas atrás de outra coisa? ela passa NA FRENTE; não está? o cobrador do time certo bate
      const i = this.acoes.findIndex(a => a.pos)
      const cobr = i >= 0 ? this.acoes.splice(i, this.acoes.slice(i).findIndex(a => !a.pos) < 0 ? this.acoes.length - i : this.acoes.slice(i).findIndex(a => !a.pos)) : this.reinicio(this.cobrancaPendente())
      if (this.cur) { this.acoes.unshift(this.cur); this.cur = null }
      this.acoes.unshift(...cobr)
    }
    // 🐕 O VIGIA (Diego 20/10: *"jogada parar e do nada voltar ao jogo"*): bola PARADA no mesmo lugar, sem cobrança correndo,
    // por mais de 2,5 s = alguma ordem esperando algo que não vai acontecer (um jogador que não chega). A ordem cai e o jogo segue.
    const bk = `${this.bola.x.toFixed(1)}|${this.bola.y.toFixed(1)}`
    // (só conta como travado se NINGUÉM saiu do lugar: jogador correndo até a bola é espera de verdade, não trava)
    const foto = () => this.atl.flatMap(z => [z.x, z.y])
    if (bk !== this.paradaK || this.bola.voo || this.cur?.pos || this.cur?.chute || this.festa) { this.paradaK = bk; this.paradaDesde = this.t; this.paradaFoto = foto() }
    else if (this.cur && this.t - this.paradaDesde > 2 && this.t < 93.5 * SEG_POR_MIN) {
      const f = foto(); let mov = 0
      for (let i = 0; i < f.length; i += 2) mov = Math.max(mov, Math.hypot(f[i] - (this.paradaFoto[i] ?? f[i]), f[i + 1] - (this.paradaFoto[i + 1] ?? f[i + 1])))
      if (mov > 0.6) { this.paradaDesde = this.t; this.paradaFoto = f }
      else {
      this.diag.travadas++
      if (this.diag.erros.length < 40) this.diag.erros.push(`${(this.t / SEG_POR_MIN).toFixed(1)}' vigia: ordem travada (${String(this.cur.upd).slice(0, 60)})`)
      this.cur = null; for (const z of this.atl) if (z.ov && z.ov.v < 9) z.ov = null
      this.paradaDesde = this.t
      }
    }
    if (!this.cur) { this.cur = this.acoes.shift() ?? null; if (!this.cur) { this.planeja(); this.cur = this.acoes.shift() ?? null } ; this.cur?.ini?.() }
    if (this.cur && this.cur.upd(dt)) this.cur = null
    // 🏃 quem é dono da bola mas está longe dela vai BUSCAR a bola antes de qualquer outra ordem (as jogadas mandam ele
    // conduzir/driblar supondo a bola no pé; sem isto ele corria pro alvo e a bola ficava pra trás)
    if (this.bola.dono && !this.bola.voo) {
      const d = this.bola.dono, dd = Math.hypot(d.x + 0.4 - this.bola.x, d.y + (d.lado === 0 ? -1.1 : 1.1) - this.bola.y)
      if (dd > 1.6) d.ov = { x: this.bola.x, y: this.bola.y, v: Math.max(d.ov?.v ?? 0, 9), busca: true }
      // (bola parada: quem vai cobrar CHEGA na bola — senão ficava a 2 m dela, sem ordem, e a cobrança esperava pra sempre)
      else if (this.parada != null && !d.ov && dist(d, this.bola) > 1.4) d.ov = { x: this.bola.x, y: this.bola.y, v: 6, busca: true }
    }
    // 🚶 quem está com a bola e SEM ordem não fica plantado (Diego 20/10: *"jogada parar"*): enquanto a jogada espera alguém
    // chegar, ele protege e leva a bola devagar, rodando — pra frente se tem campo, de lado se já está perto da área
    // (bola parada de cobrança, goleiro e acréscimos ficam como estão)
    {
      const d = this.bola.dono
      // (vale também pra quem JÁ CHEGOU no ponto que a jogada mandou e está esperando o próximo passo)
      if (d && (!d.ov || d.ov.v === 2.2 || (!d.ov.busca && Math.hypot(d.x - d.ov.x, d.y - d.ov.y) < 0.8)) && !this.bola.voo && this.parada == null && !this.cur?.pos && d.grupo !== 'GOL' && !this.festa && this.t < 93.5 * SEG_POR_MIN) {
        this.angDono += 1.7 * dt
        const fr = this.frente(d.lado, d.y), sobe = fr > 30 ? (d.lado === 0 ? -1 : 1) * 0.9 : (fr < 18 ? (d.lado === 0 ? 1 : -1) * 0.6 : 0)
        d.ov = { x: clamp(d.x + Math.cos(this.angDono) * 1.6 + (34 - d.x) * 0.06, 3, W - 3), y: clamp(d.y + sobe + Math.sin(this.angDono) * 0.8, 3, L - 3), v: 2.2 }
        this.donoLivre = d
      } else if (this.donoLivre && (this.donoLivre !== d || this.parada != null || this.bola.voo)) { if (this.donoLivre.ov?.v === 2.2) this.donoLivre.ov = null; this.donoLivre = null }
    }
    // ("vai buscar a bola" é ordem SÓ do dono: perdeu a bola, a ordem cai — senão ele corria pra um lugar onde a bola nem está mais)
    for (const p of this.atl) if (p.ov?.busca && p !== this.bola.dono) p.ov = null
    // ⌛ ORDEM VELHA (Diego 20/10: *"a sincronia de todos"*): quem chegou onde mandaram e ninguém renovou a ordem há 3 s volta pra
    // posição do time — antes ficava plantado ali (dois jogadores parados no mesmo ponto enquanto o jogo ia pro outro lado).
    // (bola parada não: barreira, escanteio e lateral seguram a posição até a cobrança)
    // (e nunca no meio de uma jogada de chute: o finalizador ESPERA o cruzamento lá na área)
    if (this.parada == null && !this.cur?.chute && !this.acoes.some(a => a.chute)) for (const p of this.atl) {
      if (!p.ov || p === this.bola.dono) continue
      const t0 = this.ovDesde.get(p.ov)
      if (t0 == null) this.ovDesde.set(p.ov, this.t)
      else if (this.t - t0 > 3 && Math.hypot(p.x - p.ov.x, p.y - p.ov.y) < 1.2) p.ov = null
    }
    this.andaBloco(dt)
    const mk = this.marcador()
    // 🧩 os LUGARES da formação não podem coincidir (Diego 20/10: *"não tem sincronia"*): o lateral e o meia do mesmo lado às
    // vezes ganhavam o mesmo ponto e passavam o jogo grudados (o espaçamento afastava, a formação puxava de volta). Antes de
    // andar, os alvos que caem a menos de 3 m um do outro se afastam.
    const forma = new Map<Atleta, { x: number; y: number }>()
    for (const p of this.atl) if (!p.ov && p !== this.bola.dono) forma.set(p, this.alvoForma(p))
    const fs = [...forma.entries()]
    for (let it = 0; it < 2; it++) for (let i = 0; i < fs.length; i++) for (let k = i + 1; k < fs.length; k++) {
      const A = fs[i][1], B = fs[k][1], dx = B.x - A.x, dy = B.y - A.y, d = Math.hypot(dx, dy)
      if (d >= 3.6 || fs[i][0].grupo === 'GOL' || fs[k][0].grupo === 'GOL') continue
      const ux = d > 0.01 ? dx / d : 1, uy = d > 0.01 ? dy / d : 0, e = (3.6 - d) / 2
      A.x = clamp(A.x - ux * e, 2, W - 2); A.y = clamp(A.y - uy * e, 0.5, L - 0.5); B.x = clamp(B.x + ux * e, 2, W - 2); B.y = clamp(B.y + uy * e, 0.5, L - 0.5)
    }
    for (const p of this.atl) {
      if (p === this.bola.dono && !p.ov) continue
      let a: { x: number; y: number } = p.ov ?? forma.get(p) ?? this.alvoForma(p)
      // 🤼 quem JÁ CHEGOU no ponto da jogada (esperando o cruzamento, o passe) não vira estátua: se mexe em volta dele,
      // brigando por posição — só com a bola rolando (na bola parada cada um segura o seu lugar)
      if (p.ov && !p.ov.busca && p !== this.bola.dono && this.parada == null && p.grupo !== 'GOL' && Math.hypot(p.x - p.ov.x, p.y - p.ov.y) < 1.2) {
        const ph = p.bx * 0.71 + p.dep * 3.3 + p.lado
        a = { x: p.ov.x + Math.sin(this.t * 1.1 + ph) * 0.9, y: p.ov.y + Math.cos(this.t * 0.9 + ph) * 0.7 }
      }
      if (p === mk) { const d = this.bola.dono!; a = { x: d.x, y: d.y + (p.lado === 0 ? 2.4 : -2.4) } } // (na frente do atacante, entre ele e o gol — colado demais virava um boneco só)
      // 📏 REGRA da bola parada: o time que NÃO cobra fica longe — 9,15 m na falta e no escanteio, 2 m no lateral
      // (saída e tiro de meta têm regra própria: o círculo/o próprio campo e a grande área)
      const saidaOuTiro = (Math.abs(this.bola.x - 34) < 0.5 && Math.abs(this.bola.y - L / 2) < 0.5) || ((this.bola.y < 7 || this.bola.y > L - 7) && Math.abs(this.bola.x - 34) < 14)
      if (this.parada != null && !saidaOuTiro && p.lado !== this.parada && p.grupo !== 'GOL') {
        const R = (this.bola.x < 0 || this.bola.x > W) ? 2.2 : 9.6, b = this.bola
        // (quem JÁ está dentro do raio sai primeiro, pra fora — antes cortava caminho por dentro dele)
        if (Math.hypot(p.x - b.x, p.y - b.y) < R) a = { x: p.x, y: p.y }
        const d = Math.hypot(a.x - b.x, a.y - b.y)
        if (d < R) { const ux = d > 0.01 ? (a.x - b.x) / d : 0, uy = d > 0.01 ? (a.y - b.y) / d : (p.lado === 0 ? 1 : -1); a = { x: clamp(b.x + ux * R, 1, W - 1), y: clamp(b.y + uy * R, 0.5, L - 0.5) } }
      }
      this.anda(p, a, p.ov?.v ?? (p === mk ? 6 : 4.2), dt)
    }
    this.espaca(dt, mk)
    const v = this.bola.voo
    if (v) {
      v.t += dt
      const k = Math.min(1, v.t / v.dur), e = v.lin ? k : 1 - (1 - k) * (1 - k)
      this.bola.x = v.x0 + (v.x1 - v.x0) * e; this.bola.y = v.y0 + (v.y1 - v.y0) * e; this.bola.h = v.alt ? Math.sin(k * Math.PI) * v.alt : 0
      if (v.curva) { // 🌀 a bola faz a curva: desvia pro lado no meio do caminho e volta pro alvo
        const dx = v.x1 - v.x0, dy = v.y1 - v.y0, d = Math.hypot(dx, dy) || 1, c = Math.sin(k * Math.PI) * v.curva
        this.bola.x += (-dy / d) * c; this.bola.y += (dx / d) * c
      }
      if (k >= 1) { this.bola.voo = null; this.bola.h = 0; v.fim?.() }
    } else if (this.bola.dono && this.parada == null) { // (bola PARADA — falta, lateral, escanteio — fica no lugar da cobrança)
      // 🚫 A BOLA NUNCA "VAI SOZINHA" (Diego 20/10: *"a bola para no meio do caminho e depois vai sozinha pro gol"*): se quem
      // deveria estar com ela está longe, a bola FICA onde está e ele CORRE até ela. Só no pé é que ela acompanha.
      const d = this.bola.dono, tx = d.x + 0.4, ty = d.y + (d.lado === 0 ? -1.1 : 1.1)
      const dd = Math.hypot(tx - this.bola.x, ty - this.bola.y)
      this.bola.h = 0
      if (dd > 1.6) {
        if (!this.deslizando) { this.deslizando = true; if (dd > 4) this.diag.magicas++ }
      } else { if (this.deslizando) { this.deslizando = false; if (d.ov && Math.hypot(d.ov.x - this.bola.x, d.ov.y - this.bola.y) < 0.5) d.ov = null } this.bola.x = tx; this.bola.y = ty }
    }
  }
  /** 🧍↔🧍 ESPAÇAMENTO (Diego 20/10: *"melhorar posicionamento dos dois times… a organização, a sincronia"*): dois jogadores a
   *  menos de 2,2 m se afastam com um PASSO DE LADO (no máx. 6 m/s — antes era um salto na hora, que piscava na tela). Só o
   *  dono da bola e quem o marca ficam colados; companheiro em cima do dono da bola é quem sai. Quem corre em disparada atrás da
   *  bola não é empurrado — o OUTRO abre espaço (empurrado de volta, o desarme nunca chegava e o jogo parava). */
  private espaca(dt: number, mk: Atleta | null) {
    const dono = this.bola.dono, max = 9 * dt
    for (let i = 0; i < this.atl.length; i++) for (let k = i + 1; k < this.atl.length; k++) {
      const a = this.atl[i], b = this.atl[k]
      if (a.grupo === 'GOL' && b.grupo === 'GOL') continue
      // (o marcador fica colado no dono da bola, mas não DENTRO dele: 1,7 m)
      // (a bolinha do jogador tem ~4 m de diâmetro na tela: companheiros ficam a 3,2 m pra não virar um boneco só; rival a
      // 2,6 m — marcação é perto mesmo; o marcador do dono da bola, 1,7 m)
      const marca = (a === dono && b === mk) || (b === dono && a === mk), minD = marca ? 1.7 : a.lado === b.lado ? 3.2 : 2.6
      // duas ORDENS pro mesmo lugar (dois atacantes mandados pro mesmo ponto da área): o 2º vai pro lado
      if (a.ov && b.ov && a.ov !== b.ov && a.lado === b.lado && Math.hypot(a.ov.x - b.ov.x, a.ov.y - b.ov.y) < 3 && !a.ov.busca && !b.ov.busca) {
        const lado = b.ov.x >= 34 ? -1 : 1
        b.ov = { ...b.ov, x: clamp(b.ov.x + lado * 2.6, 2, W - 2) }
      }
      const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy)
      if (d >= minD) continue
      const ux = d > 0.001 ? dx / d : 1, uy = d > 0.001 ? dy / d : 0
      // quem NÃO se mexe: o dono da bola, o marcador dele e quem corre em disparada (o outro sai)
      const fixoA = a === dono || a === mk || (!!a.ov && a.ov.v >= 8), fixoB = b === dono || b === mk || (!!b.ov && b.ov.v >= 8)
      // (bola parada: quem vai cobrar não sai do lugar, os outros é que abrem)
      const pa = this.parada != null && (a === dono || b === dono) ? (a === dono ? 0 : 1) : marca ? (a === mk ? 1 : 0) : fixoA === fixoB ? 0.5 : fixoA ? 0 : 1, pb = 1 - pa
      const e = Math.min(minD - d, max * 2)
      a.x -= ux * Math.min(e * pa, max); a.y -= uy * Math.min(e * pa, max); b.x += ux * Math.min(e * pb, max); b.y += uy * Math.min(e * pb, max)
    }
  }
  private anda(p: Atleta, a: { x: number; y: number }, v: number, dt: number) {
    const dx = a.x - p.x, dy = a.y - p.y, d = Math.hypot(dx, dy)
    // (teto de 13 m/s, um pique forte: o "pique" do atrasado nunca vira teletransporte — Diego 20/10)
    const vv = Math.min(13, v * (p.estilo === 'velocista' ? 1.12 : 1) * this.pressa()) * dt
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
  /** pode pegar a bola agora? (bola PARADA só é do time que repõe) */
  private podePegar(p: Atleta) { return this.parada == null || p.lado === this.parada || !!this.bola.dono || !!this.bola.voo }
  private pega(p: Atleta) {
    if (this.parada != null && p.lado !== this.parada && !this.festa) { this.diag.reinicioErrado++; this.diag.erros.push(`t=${this.t.toFixed(1)} ${p.nome} (${p.lado}) pegou bola parada do time ${this.parada} · ${this.narra.replace(/<\/?b>/g, '').slice(0, 40)}`) }
    if (this.semReinicio && !this.festa) { this.diag.paradaSemCobranca++; this.diag.erros.push(`t=${this.t.toFixed(1)} ${p.nome} tocou na bola depois de '${this.semReinicio}' sem cobrança · ${this.narra.replace(/<\/?b>/g, '').slice(0, 40)}`) }
    this.bola.dono = p; this.posse = p.lado; p.ov = null; this.ultimoToque = p.lado
  }
  private viaja(x1: number, y1: number, vel: number, alt = 0, lin = false, fim?: () => void, curva = 0) {
    const d = Math.hypot(x1 - this.bola.x, y1 - this.bola.y)
    if (this.bola.dono) this.ultimoToque = this.bola.dono.lado
    if (this.parada != null) this.confereCobranca()
    this.parada = null
    // (bola indo pro GOL ou na TRAVE não é bola fora: o fim do lance decide; o resto que passa das linhas é apito)
    if ((x1 < 0 || x1 > W || y1 < 0 || y1 > L) && !(Math.abs(x1 - 34) <= 3.8 && (y1 < 0 || y1 > L))) this.apita('bola fora')
    this.bola.dono = null
    this.bola.voo = { x0: this.bola.x, y0: this.bola.y, x1, y1, t: 0, dur: Math.max(0.25, d / (vel * this.pressa())), alt, lin, fim, curva }
  }
  /** 🦶 " de canhota" / " de direita" — só de quem a gente sabe o pé */
  private pe(a: Atleta) { return a.pe === 'canhota' ? this.tt(' de canhota', ' with the left') : a.pe === 'direita' ? this.tt(' de direita', ' with the right') : '' }
  private tem(a: Atleta | null | undefined, ...gs: Golpe[]) { return !!a && gs.some(g => a.golpes.includes(g)) }
  /** bola PARADA posta no lugar da cobrança (saída, lateral, escanteio, tiro de meta, falta) — o único "pulo" permitido */
  /** 🧑‍⚖️ na hora em que a bola parada é batida: o time que NÃO cobra está onde a regra manda? (tiro de meta = fora da área ·
   *  falta/escanteio = a 9,15 m · lateral = a 2 m · saída = cada time no seu campo). Só conta (a trava cobra). */
  private confereCobranca() {
    const q = this.parada!, b = this.bola, rivais = this.time((1 - q) as Lado).filter(z => z.grupo !== 'GOL')
    const saida = Math.abs(b.x - 34) < 0.5 && Math.abs(b.y - L / 2) < 0.5, lateral = b.x < 0 || b.x > W
    const tiro = !saida && !lateral && (b.y < 7 || b.y > L - 7) && Math.abs(b.x - 34) < 14
    let erro = ''
    if (saida) { if (this.atl.some(z => z !== this.bola.dono && (z.lado === 0 ? z.y < L / 2 - 0.5 : z.y > L / 2 + 0.5))) erro = 'saída com gente no campo do rival' }
    else if (lateral) { if (rivais.some(z => dist(z, b) < 1.5)) erro = 'rival colado em quem cobra o lateral' }
    else if (tiro) { if (rivais.some(z => (q === 1 ? z.y : L - z.y) < 16.5 && Math.abs(z.x - 34) < 20.2)) erro = 'rival dentro da área no tiro de meta' }
    else if (rivais.some(z => dist(z, b) < 8.5)) erro = 'rival a menos de 9 m na falta/escanteio'
    this.diag.cobrancasConferidas++
    if (erro) { this.diag.bolaParadaIrregular++; if (this.diag.erros.length < 40) this.diag.erros.push(`${(this.t / SEG_POR_MIN).toFixed(1)}' ${erro}`) }
  }
  private coloca(x: number, y: number, quemRepoe?: Lado, cobrador?: Atleta) { this.bola.dono = null; this.bola.voo = null; this.bola.x = x; this.bola.y = y; this.bola.h = 0; this.deslizando = false; this.diag.colocadas++; this.parada = quemRepoe ?? null; this.cobrador = cobrador ?? null; this.semReinicio = null }
  /** 🧑‍⚖️ FISCAL (20/10, Diego: *"vi atacante do rival bater tiro de meta… jogada parar e do nada voltar ao jogo como se nada"*):
   *  `parada` = de QUEM é a bola parada (saída, lateral, tiro de meta, escanteio, falta) até ela ser chutada;
   *  `semReinicio` = a bola SAIU ou o juiz APITOU e ainda não foi posta no lugar da cobrança. */
  parada: Lado | null = null
  private cobrador: Atleta | null = null
  semReinicio: string | null = null
  private apita(motivo: string) { this.semReinicio = motivo }
  /** 🧑‍⚖️ lateral, escanteio e tiro de meta só existem se a bola SAIU (o apito veio antes): cobrança sem saída = jogada que
   *  parou do nada e voltou (Diego 20/10) — conta como erro do fiscal */
  private colocaSaida(x: number, y: number, quem: Lado, cobrador: Atleta, tipo: string) {
    if (!this.semReinicio) { this.diag.reinicioSemSair++; if (this.diag.erros.length < 40) this.diag.erros.push(`${(this.t / SEG_POR_MIN).toFixed(1)}' ${tipo} sem a bola ter saído`) }
    else if (quem === this.ultimoToque) { this.diag.reinicioErrado++; if (this.diag.erros.length < 40) this.diag.erros.push(`${(this.t / SEG_POR_MIN).toFixed(1)}' ${tipo} pro time que tocou por último`) }
    this.coloca(x, y, quem, cobrador)
  }
  /** quem tocou na bola por último (decide lateral/escanteio/tiro de meta) */
  private ultimoToque: Lado = 0
  /** 🔄 caminho de volta pra saída: quem é do time que NÃO sai e está do outro lado contorna o círculo central (antes passava
   *  em linha reta por cima da bola) */
  private rotaSaida(p: Atleta, lugar: { x: number; y: number }, quemSai: Lado) {
    if (p.lado === quemSai || p.grupo === 'GOL') return lugar
    const doOutroLado = p.lado === 0 ? p.y < L / 2 + 1 : p.y > L / 2 - 1
    if (!doOutroLado) return lugar
    const lado = p.x < 34 ? -1 : 1
    return Math.abs(p.x - 34) > 11 ? { x: p.x, y: L / 2 + (p.lado === 0 ? 2 : -2) } : { x: 34 + lado * 12, y: L / 2 + (p.lado === 0 ? 2 : -2) }
  }
  private posSaida(p: Atleta) { return this.rel(p.lado, p.bx, p.grupo === 'GOL' ? 101 : 54 + 40 * p.dep) }
  /** ⚽ saída do meio: cada time no seu campo, bola no centro, quem dá a saída toca pra trás */
  saida(l: Lado, inicio = false) {
    // (no apito inicial todo mundo já está no lugar; depois de um gol eles CORREM até lá — antes o time inteiro "pulava" pra
    // posição de saída, um teletransporte na tela)
    const ca = this.do(l, ['ATA'])[0] ?? this.time(l)[1]
    const lugar = new Map<Atleta, { x: number; y: number }>()
    for (const p of this.atl) {
      const r = this.posSaida(p)
      // quem NÃO dá a saída fica fora do círculo central (9,15 m)
      if (p.lado !== l) { const dx = r.x - 34, dy = r.y - L / 2, d = Math.hypot(dx, dy); if (d < 10.8) { const k = Math.sqrt(Math.max(0, 10.8 * 10.8 - dx * dx)); r.y = L / 2 + (p.lado === 0 ? k : -k) } }
      lugar.set(p, p === ca ? { x: 34, y: L / 2 + (l === 0 ? 0.8 : -0.8) } : r)
    }
    this.coloca(34, L / 2, l, ca)
    this.diag.saidas++
    const rec = this.preferido(l, ['MEI'], ['passador'], ca)
    if (inicio) {
      for (const p of this.atl) { const r = lugar.get(p)!; p.ov = null; p.x = r.x; p.y = r.y }
      this.pega(ca)
    } else {
      for (const p of this.atl) p.ov = { ...this.rotaSaida(p, lugar.get(p)!, l), v: dist(p, lugar.get(p)!) > 15 ? 11 : 8 }
      let t0 = 0
      this.acoes.push(...this.cobranca({
        ini: () => { t0 = this.t; this.narra = this.v('saida') + ' ' + this.v(l === 0 ? 'saida_casa' : 'saida_fora') },
        upd: () => {
          // REGRA: todo mundo no PRÓPRIO campo e o rival fora do círculo (perto do lugar já basta pra rolar)
          const noCampo = this.atl.every(p => p === ca || (p.lado === 0 ? p.y >= L / 2 + 0.3 : p.y <= L / 2 - 0.3))
          const circulo = this.atl.every(p => p.lado === l || Math.hypot(p.x - 34, p.y - L / 2) > 9.3)
          // (quem já cruzou o meio segue pro lugar dele; a bola rola quando a REGRA está cumprida — não precisa todo mundo no lugar exato)
          for (const p of this.atl) if (p.ov) { const r = this.rotaSaida(p, lugar.get(p)!, l); p.ov = { ...r, v: p.ov.v } }
          const perto = dist(ca, this.bola) < 1.6
          if (!(noCampo && circulo && perto) && this.t - t0 < 5) { if (this.t - t0 > 1) for (const p of this.atl) if (p.ov) p.ov.v = 10; return false }
          // (as ordens só caem DEPOIS do toque: soltas aqui, no meio segundo de espera o time voltava pro campo do rival)
          ca.ov = null
          this.pega(ca)
          return true
        },
      }))
    }
    // (a saída NUNCA é cortada: é curta e é regra — o próximo lance espera ela)
    this.acoes.push(...this.cobranca(this.aEspera(inicio ? 0.4 : 0.5), this.aPasse(() => ca, () => rec, { adiante: -5, vel: 13 })), this.soltaTodos())
  }

  // ── as AÇÕES (cada jogada é uma fila delas) ──────────────────────────────────────────────────────────────────────────────
  private aNarra(txt: string): Acao { return { upd: () => { this.narra = txt; return true } } }
  private aPasse(de: () => Atleta, para: () => Atleta, o: { adiante?: number; dx?: number; vel?: number; alto?: boolean } = {}): Acao {
    let feito = false, foi = false, solta = -1, quem: Atleta | null = null
    return {
      upd: () => {
        if (!foi) {
          if (this.bola.voo) return false // a bola ainda está no ar: espera ela chegar antes de tocar de novo
          const p = para()
          quem = p // (o recebedor fica FIXO a partir do passe: quem escolhe por sorteio sorteava outro a cada instante, e vários
          // corriam pro mesmo lugar e ficavam lá plantados)
          let d = de() ?? p
          const h = this.bola.dono
          if (h && h !== d && h.lado === d.lado) d = h // quem passa é quem ESTÁ com a bola
          else if (h !== d) this.pega(d)
          if (dist(d, this.bola) > 1.8) return false // ainda correndo pra bola: o passe espera
          if (d === p) return (feito = true)
          const fw = p.lado === 0 ? -1 : 1
          let ax = clamp(p.x + (o.dx ?? 0), 2, W - 2), ay = clamp(p.y + fw * (o.adiante ?? 3), 2, L - 2)
          // a bola cai num lugar que o recebedor ALCANÇA no tempo do passe (senão ela "voaria" até ele depois)
          const dur = Math.max(0.25, Math.hypot(ax - this.bola.x, ay - this.bola.y) / (o.vel ?? 19)), alc = 7.5 * dur * 0.85 + 0.6, dp = Math.hypot(ax - p.x, ay - p.y)
          if (dp > alc) { ax = p.x + ((ax - p.x) * alc) / dp; ay = p.y + ((ay - p.y) * alc) / dp }
          p.ov = { x: ax, y: ay, v: 7.5 }
          this.viaja(ax, ay, o.vel ?? 19, o.alto ? 3.2 : 0, false, () => { solta = this.t })
          foi = true
        }
        // a bola chegou: ela fica ali e o recebedor domina quando CHEGA nela (teto de 2 s pra não travar o jogo)
        if (solta >= 0 && !feito) {
          const p = quem ?? para()
          if (dist(p, this.bola) < 1.3 || this.t - solta > 0.9) { this.pega(p); feito = true }
          else p.ov = { x: this.bola.x, y: this.bola.y, v: 9 }
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
    // quem segura a bola não fica plantado (nem na linha de fundo): roda a bola em volta de si, sempre dentro do campo
    let prox = 0, ang = 0
    const alvo = (d: Atleta) => {
      ang += 2.1
      const fr = this.frente(d.lado, d.y), recua = fr < 8 // colado na linha de fundo? volta um pouco
      const x = clamp(d.x + Math.cos(ang) * 2.2 + (34 - d.x) * 0.1, 3, W - 3)
      const y = clamp(d.y + (d.lado === 0 ? (recua ? 3 : -2.5) : (recua ? -3 : 2.5)) + Math.sin(ang) * 1.2, 3, L - 3)
      d.ov = { x, y, v: 2.4 }
    }
    return {
      ini: () => { const d = this.bola.dono; if (d) { alvo(d); prox = this.t + 0.7 } },
      upd: () => {
        if (this.t >= ateT) { if (this.bola.dono) this.bola.dono.ov = null; return true }
        const d = this.bola.dono
        if (d && this.t >= prox) { alvo(d); prox = this.t + 0.7 }
        return false
      },
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
        if (this.parada != null && this.parada !== quem.lado) return false // bola PARADA do outro time (até no pé do cobrador): ninguém dá bote antes da cobrança
        if (!v) { // bola solta: quem chega primeiro fica com ela
          quem.ov = { x: this.bola.x, y: this.bola.y, v: Math.max(8.5, quem.ov?.v ?? 0) } // (sempre NA BOLA: ordem velha de "fica aqui" não pode prender o desarme)
          if (dist(quem, this.bola) < 1.4 || this.t - t0 > 5) { this.pega(quem); this.narra = txt(quem, null); return true }
          return false
        }
        quem.ov = { x: v.x, y: v.y, v: Math.max(8, quem.ov?.v ?? 0) }
        if (dist(quem, v) < 1.5 || this.t - t0 > 5) { this.pega(quem); this.narra = txt(quem, v); return true }
        return false
      },
    }
  }
  private aEspera(seg: number): Acao { let t0 = 0; return { ini: () => { t0 = this.t }, upd: () => this.t - t0 >= (this.apressado() ? Math.min(seg, 0.2) : seg) } }
  /** o lance seguinte do jogo está chegando: reinícios (tiro de meta, lateral) saem rápido, sem cerimônia */
  private apressado() { const prox = this.evs[this.iev]; return !!prox && prox.min * SEG_POR_MIN - this.t < ANTECEDE + 3 }
  private enfeite(as: Acao[]): Acao[] { for (const a of as) a.pre = true; return as }
  private reinicio(as: Acao[]): Acao[] { for (const a of as) { a.pre = true; a.pos = true } return as }
  /** marca ações como parte da COBRANÇA (o juiz não interrompe nem manda chutar por cima delas) — sem virar enfeite */
  private cobranca(...as: Acao[]): Acao[] { for (const a of as) a.pos = true; return as }
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
      upd: () => {
        const a = q(), vv = this.apressado() ? v * 1.5 : v, max = this.apressado() ? Math.min(maxSeg, 1.4) : maxSeg
        a.ov = { x: this.bola.x, y: this.bola.y, v: vv }
        if (dist(a, this.bola) < 1.2 || this.t - t0 > max) { this.pega(a); a.ov = null; return true }
        return false
      },
    }
  }
  /** a cobrança certa pra uma bola que SAIU: pela lateral = lateral de quem não tocou; pela linha de fundo = escanteio (se
   *  quem tocou foi a defesa) ou tiro de meta (se foi o ataque) */
  private cobrancaDaSaida(): Acao[] {
    const b = this.bola, outro = (1 - this.ultimoToque) as Lado
    if (b.x < 0 || b.x > W) return this.reinicio(this.lateral(outro))
    const defende: Lado = b.y < 0 ? 1 : 0, ataca = (1 - defende) as Lado
    if (this.ultimoToque === defende) {
      const ladoX = b.x < 34 ? -1 : 1
      const cob = umaVez(() => this.maisPerto(ataca, this.rel(ataca, ladoX < 0 ? 0 : W, 0)))
      const alvo = umaVez(() => this.preferido(ataca, ['ATA', 'DEF'], ['cabeceador'], cob()))
      const zag = umaVez(() => this.preferido(defende, ['DEF'], ['cabeceador', 'desarmador']))
      return this.reinicio([
        ...this.escanteio(ataca, ladoX, cob, alvo, null), this.aEspera(0.5),
        { upd: () => { this.narra = this.v('escanteio_cobra', { a: this.n(cob()) }); return true } },
        this.aPasse(cob, alvo, { alto: true, adiante: 0, vel: 20 }),
        { upd: () => { this.narra = this.v('zaga_cabeca', { a: this.n(zag()) }); return true } },
        { upd: () => { if (this.bola.voo) return false; this.pega(zag()); return true } }, this.soltaTodos(),
        this.aPasse(zag, () => this.preferido(defende, ['MEI', 'ATA'], []), { alto: true, vel: 22, adiante: 6 }),
      ])
    }
    return this.reinicio(this.tiroDeMeta(defende))
  }
  /** 🧑‍⚖️ a bola está PARADA e é do outro time: primeiro sai a cobrança (o cobrador vai até ela e bate longo pro próprio time) */
  private cobrancaPendente(): Acao[] {
    if (this.parada == null) return []
    this.diag.cobrancasForcadas++
    const lado = this.parada, c = this.cobrador && this.cobrador.lado === lado ? this.cobrador : this.maisPerto(lado, this.bola, [], false)
    return [this.aChegaNaBola(() => c, 4, 9), this.aEspera(0.3), this.aPasse(() => c, () => this.preferido(lado, ['MEI', 'ATA'], [], c), { alto: true, vel: 24, adiante: 8 })]
  }
  /** 📏 REGRA da bola parada: quem é do time `l` (fora `menos`) e está a menos de `raio` da bola sai pra fora desse raio */
  private afastaDe(pt: { x: number; y: number }, l: Lado, raio: number, menos: Atleta[] = []) {
    for (const z of this.time(l)) {
      if (menos.includes(z) || z.grupo === 'GOL') continue
      const d = dist(z, pt); if (d >= raio) continue
      const ux = d > 0.01 ? (z.x - pt.x) / d : 0, uy = d > 0.01 ? (z.y - pt.y) / d : (l === 0 ? 1 : -1)
      z.ov = { x: clamp(pt.x + ux * (raio + 0.8), 2, W - 2), y: clamp(pt.y + uy * (raio + 0.8), 1, L - 1), v: 8 }
    }
  }
  /** 🧤 REGRA do tiro de meta: o time rival sai da grande área de `d` antes da cobrança (fica na entrada dela) */
  private foraDaArea(d: Lado) {
    for (const z of this.time((1 - d) as Lado)) {
      if (z.grupo === 'GOL') continue
      const fr = d === 1 ? z.y : L - z.y // (quanto ele está pra dentro do campo, contando da linha de fundo de `d`)
      if (fr < 18 && Math.abs(z.x - 34) < 22) z.ov = { x: z.x, y: d === 1 ? 19 + (z.dep * 6) : L - 19 - z.dep * 6, v: 10 }
    }
  }
  /** espera o rival sair da área de `d` (regra do tiro de meta), no máx. 2 s */
  private aAreaLimpa(d: Lado): Acao {
    let t0 = 0
    return { ini: () => { t0 = this.t; this.foraDaArea(d) }, upd: () => this.t - t0 > 3 || !this.time((1 - d) as Lado).some(z => z.grupo !== 'GOL' && (d === 1 ? z.y : L - z.y) < 16.5 && Math.abs(z.x - 34) < 20.2) }
  }
  /** ⏱️ passe NO TEMPO: o ponto (no caminho de quem corre até `alvo`) e a força pra bola e jogador chegarem juntos */
  private encontro(bola: { x: number; y: number }, quem: Atleta, alvo: { x: number; y: number }): { pt: { x: number; y: number }; vel: number } {
    const vr = 9.5, dr = dist(quem, alvo)
    let f = 1, pt = alvo, vel = 27
    for (let k = 0; k < 6; k++) {
      pt = { x: quem.x + (alvo.x - quem.x) * f, y: quem.y + (alvo.y - quem.y) * f }
      const tr = Math.max(0.35, (dr * f) / vr), db = dist(bola, pt)
      vel = db / tr
      if (vel >= 13) break
      f *= 0.7 // a bola teria que ir devagar demais (ele está longe): encurta pro meio do caminho dele
    }
    return { pt, vel: clamp(vel, 13, 30) }
  }
  private soltaTodos(): Acao { return { ini: () => { for (const z of this.atl) z.ov = null }, upd: () => true } }

  /** 🧤 TIRO DE META: a bola saiu pela linha de fundo de `d` (chute pra fora) → bola na pequena área, o goleiro bate longo */
  private tiroDeMeta(d: Lado): Acao[] {
    const gk = this.gk(d)
    return [
      ...this.cobranca({ ini: () => { const pt = this.rel(d, 34 + (this.bola.x < 34 ? -9 : 9), 99.5); this.colocaSaida(pt.x, pt.y, d, gk, 'tiro de meta'); this.posse = d; this.diag.tirosDeMeta++; this.foraDaArea(d); if (this.t >= this.narraForteAte) this.narra = this.v('tiro_meta') }, upd: () => true }),
      ...this.reinicio([
        this.aChegaNaBola(() => gk, 3, 5.5), this.aEspera(0.5), this.aAreaLimpa(d),
        this.aPasse(() => gk, () => this.preferido(d, ['MEI', 'ATA'], []), { alto: true, vel: 24, adiante: 12 }),
      ]),
    ]
  }
  /** 🧤 o goleiro segurou: segura um instante e repõe com a mão/pé pra um da defesa */
  private reposicao(d: Lado): Acao[] {
    const gk = this.gk(d)
    return this.reinicio([this.aEspera(1), this.aPasse(() => gk, () => this.preferido(d, ['LAT', 'DEF', 'MEI'], []), { adiante: 4, vel: 16 })])
  }
  /** 📏 LATERAL: a bola saiu pela linha lateral → quem NÃO tocou por último cobra com as mãos, do lugar onde saiu */
  private lateral(l: Lado): Acao[] {
    const n = this.n.bind(this)
    const cob = umaVez(() => this.maisPerto(l, this.bola))
    const rec = umaVez(() => this.maisPerto(l, this.bola, [cob()]))
    return this.reinicio([
      { ini: () => { const x = this.bola.x < 34 ? -0.6 : W + 0.6, y = clamp(this.bola.y, 3, L - 3); this.colocaSaida(x, y, l, cob(), 'lateral'); this.posse = l; this.diag.laterais++; // dois companheiros vêm dar opção (um curto, um mais pra dentro) — antes às vezes não tinha ninguém perto pra receber
        { const dentro = x < 34 ? 1 : -1, r = rec(); r.ov = { x: clamp(x + dentro * 7, 2, W - 2), y: clamp(y + (l === 0 ? -4 : 4), 3, L - 3), v: 9 }
          const o2 = this.maisPerto(l, this.bola, [cob(), r]); o2.ov = { x: clamp(x + dentro * 13, 2, W - 2), y: clamp(y + (l === 0 ? 5 : -5), 3, L - 3), v: 8 } } if (this.t >= this.narraForteAte) this.narra = this.v('lateral', { a: n(cob()) }) }, upd: () => true },
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
      sobem.forEach((z, i) => { z.ov = { ...this.naArea(l, z === f ? 7 : 5 + (i % 3) * 3.5, -11 + (22 * i) / Math.max(1, sobem.length - 1)), v: z.grupo === 'DEF' ? 11 : 10 } }) // sobem CORRENDO
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
      pos: true, // (é a própria cobrança: o juiz não interrompe)
      ini: () => {
        t0 = this.t
        const cant = this.rel(l, ladoX < 0 ? 0.6 : 67.4, 0.6)
        this.colocaSaida(cant.x, cant.y, l, cob(), 'escanteio'); this.posse = l
        this.sobeProEscanteio(l, ladoX, cob, alvo)
        this.narra = this.v('escanteio')
      },
      upd: () => {
        let c = cob()
        if (c.lado !== l) c = this.maisPerto(l, this.bola) // (cobrador sempre do time do escanteio)
        // só cobra com o ATAQUE NA ÁREA (ou quando o relógio do lance manda)
        const naArea = this.time(l).filter(z => this.frente(l, z.y) < 17 && Math.abs(z.x - 34) < 21).length
        if ((dist(c, this.bola) < 1.1 && naArea >= 4) || this.t > (ate ?? t0 + 6)) {
          this.pega(c)
          this.diag.escanteios.push(naArea)
          return true
        }
        return false
      },
    }]
  }
  /** a finalização: é AQUI que o resultado do motor do jogo aparece */
  private aChute(quem: () => Atleta, fim: Fim, ev: Evento | null, o: { alto?: boolean; vel?: number; cabeca?: boolean; acab?: Acab } = {}): Acao {
    let feito = false, foi = false, solta = -1, quemPega: Atleta | null = null
    const ini = () => {
        const p = quem(); if (this.bola.dono !== p) this.pega(p)
        const ataca0 = p.lado === 0, gk = this.gk((1 - p.lado) as Lado)
        const lado = this.rng() < 0.5 ? -1 : 1
        const linha = ataca0 ? -0.6 : L + 0.6
        const acab: Acab = o.acab ?? (o.cabeca ? 'cabeca' : o.alto ? 'bomba' : 'rasteiro'), A = ACAB[acab]
        const fr0 = this.frente(p.lado, this.bola.y); if (fr0 > 33) this.diag.chutesLonge++; if (fr0 < 6 && Math.abs(this.bola.x - 34) > 22) this.diag.chutesBandeirinha++
        // ⏱️ a bola chega no gol NO MINUTO do lance do jogo: a força do chute se ajusta pra isso (dentro do que é crível)
        const alvoT = ev ? ev.min * SEG_POR_MIN : this.t + 0.6
        const dGol = Math.hypot(34 - this.bola.x, (ataca0 ? 0 : L) - this.bola.y)
        const velBase = (o.vel ?? 25) * A.vel
        const vel = clamp(dGol / Math.max(0.3, alvoT - this.t), velBase * 0.75, velBase * (alvoT - this.t < 0.6 ? 2.2 : 1.6)) // atrasado: a bomba sai mais forte
        // a curva vira pro lado certo (pra DENTRO do gol = negativa; trivela/três dedos = pra fora e volta)
        const curva = A.curva * lado * (ataca0 ? 1 : -1)
        const como = this.en ? COMO[acab][1] : COMO[acab][0]
        this.diag.acabs[acab] = (this.diag.acabs[acab] ?? 0) + 1
        if (fim === 'gol') {
          // na cobertura/cavadinha o goleiro SAI e a bola passa por cima; no resto ele cai pro canto errado
          if (acab === 'cobertura' || acab === 'cavadinha') gk.ov = { x: gk.x + (this.bola.x - gk.x) * 0.5, y: gk.y + (this.bola.y - gk.y) * 0.45, v: 7 }
          else gk.ov = { x: 34 - lado * 2, y: gk.y, v: 6 }
          this.viaja(34 + lado * (acab === 'bomba' ? 1.8 : 2.7), ataca0 ? -1.6 : L + 1.6, vel, A.alt, true, () => {
            gk.ov = null
            this.rede = { y0: ataca0 ? 0 : L, t0: this.t }
            this.placar[p.lado]++
            // a festa encurta se o próximo lance do motor já está chegando (gols colados)
            const prox = this.evs[this.iev], folga = prox ? prox.min * SEG_POR_MIN - this.t - 6 : FESTA
            this.festa = { de: this.t, curta: folga < 3.4, ate: this.t + clamp(folga, 1.6, FESTA), lado: p.lado, autor: ev?.autor ?? p.nome, assist: ev?.assist, min: ev?.min ?? 0 }
            this.narra = this.tt(`GOOOOL! ${this.n(p)}, ${como}!`, `GOOOAL! ${this.n(p)}, ${como}!`)
            feito = true
          }, curva)
          return
        }
        if (fim === 'defendeu') {
          const bx = 34 + lado * (gk.estilo === 'paredao' ? 3.2 : 2.3), by = ataca0 ? 1.3 : L - 1.3
          gk.ov = { x: bx, y: by, v: 12 }
          this.viaja(bx, by, vel, Math.min(A.alt, 1.4), true, () => { gk.ov = null; this.pega(gk); feito = true }, curva * 0.6)
          return
        }
        if (fim === 'trave') {
          this.viaja(34 + lado * 3.66, linha, vel, Math.min(A.alt, 1.6), true, () => {
            const cai = { x: 34 + lado * 10, y: ataca0 ? 10 : L - 10 }, z = this.maisPerto((1 - p.lado) as Lado, cai)
            z.ov = { ...cai, v: 9 }
            this.viaja(cai.x, cai.y, 13, 1.5, false, () => { solta = this.t; quemPega = z })
          }, curva * 0.6)
          return
        }
        const isolou = fim === 'isolou'
        // pra fora: a bola passa a linha de fundo e PARA lá — quem repõe é o goleiro, no tiro de meta (`tiroDeMeta`)
        this.viaja(34 + lado * (5 + this.rng() * 7), ataca0 ? -3 : L + 3, vel, isolou ? Math.max(4.2, A.alt + 2) : Math.max(0.9, A.alt), false, () => { feito = true }, curva)
    }
    return {
      chute: true,
      upd: () => {
        if (!foi) {
          if (this.bola.voo) return false
          const p = quem(); if (this.bola.dono !== p) this.pega(p)
          if (dist(p, this.bola) > 1.8) return false // ainda correndo pra bola: o chute espera
          ini(); foi = true; this.tLance = null
        }
        if (quemPega && solta >= 0 && !feito) { const z = quemPega; if (dist(z, this.bola) < 1.3 || this.t - solta > 2) { this.pega(z); feito = true } else z.ov = { x: this.bola.x, y: this.bola.y, v: 9 } }
        return feito
      },
    }
  }

  // ── o DIRETOR: escolhe a próxima jogada ──────────────────────────────────────────────────────────────────────────────────
  private planeja() {
    // ⏭️ ATRASADO? As CHANCES (lance sem gol) são enfeite: se o campinho já está atrás do relógio e não dá pra armar a jogada,
    // a chance é pulada — o GOL nunca é pulado (o placar do campinho é o do jogo). É o que impede o fim de jogo "em dívida".
    // E se tem GOL logo depois de uma chance e o tempo não dá pros dois (a bola precisa ~1 s a cada 7 m pra ir de uma área à outra),
    // a CHANCE sai e o gol fica — o gol é o que o placar cobra.
    for (;;) {
      const c = this.evs[this.iev]
      if (!c || c.fim === 'gol') break
      // (20/10, Diego: *"mais lance"*: 59% das chances sumiam por chegarem uns segundos atrasadas. Chance não mexe no placar,
      // então ela pode sair um pouco DEPOIS do minuto dela — só cai se atrasar o próximo GOL, se passar do apito ou se o
      // campinho já estiver muito atrás)
      const tc = c.min * SEG_POR_MIN, g = this.evs.slice(this.iev + 1).find(e => e.fim === 'gol')
      const quando = this.quandoChance(c), sobra = g ? g.min * SEG_POR_MIN - (quando + 4) : 99
      const apertado = sobra < ANTECEDE || quando > 91 * SEG_POR_MIN || tc - this.t < -10
      if (!apertado) break
      this.diag.chancesPuladas++; this.iev++
    }
    const prox = this.evs[this.iev]
    const chance = !!prox && prox.fim !== 'gol'
    const tEv = prox ? (chance ? this.quandoChance(prox) : prox.min * SEG_POR_MIN) : Infinity
    // 📏 quanto mais LONGE do gol a bola está, mais cedo a jogada começa (a bola tem que andar até a área — sem atalho)
    const longe = prox ? clamp((this.frente(prox.lado, this.bola.y) - 25) / 7, 0, 7) : 0
    if (prox && tEv - this.t <= ANTECEDE + 1 + longe) { this.iev++; this.decisiva(chance ? { ...prox, min: tEv / SEG_POR_MIN } : prox, tEv); return }
    this.enchimento(prox ? tEv - ANTECEDE - longe - this.t : 99)
  }
  /** quando a CHANCE consegue sair: no minuto dela, ou (se o campinho está atrasado) assim que dá pra levar a bola até a área */
  private quandoChance(c: Evento) {
    const longe = clamp((this.frente(c.lado, this.bola.y) - 25) / 7, 0, 7)
    return Math.max(c.min * SEG_POR_MIN, this.t + 5 + longe * 0.6)
  }
  /** garante que o lado `l` está com a bola (rouba/intercepta se precisar) */
  private recuperaAcoes(l: Lado): Acao[] {
    if (this.bola.dono?.lado === l && !this.bola.voo) return []
    // bola parada fora do campo (sobrou de um lance cortado): reinicia com a regra, nunca com alguém buscando lá fora
    if (!this.bola.dono && !this.bola.voo && this.foraDoCampo()) {
      const fundo = this.bola.y < 0 || this.bola.y > L
      // (a linha de fundo de CIMA, y<0, é o gol que o VISITANTE defende — o mandante ataca pra cima)
      return fundo ? [...this.tiroDeMeta(this.bola.y < 0 ? 1 : 0)] : this.lateral(l)
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
    if (this.parada != null && this.parada !== l && !this.bola.dono && !this.bola.voo) return [...this.cobrancaPendente(), ...this.recuperaAcoes2b(l)]
    return this.recuperaAcoes2b(l)
  }
  private recuperaAcoes2b(l: Lado): Acao[] {
    const def = umaVez(() => {
      const perto = this.time(l).filter(a => a.grupo !== 'GOL' && dist(a, this.bola) < 14)
      const bons = perto.filter(a => a.estilo === 'desarmador')
      return bons.length && this.rng() < 0.7 ? this.sorteia(bons) : this.maisPerto(l, this.bola)
    })
    return [this.aDesarme(def, (d, v) => (d.estilo === 'desarmador' || this.tem(d, 'carrinho', 'bote')) && v
      ? (this.tem(d, 'carrinho') ? this.tt(`CARRINHO de ${this.n(d)}! Tirou a bola de ${this.n(v)}`, `SLIDING TACKLE by ${this.n(d)}! Took it off ${this.n(v)}`) : this.v('rouba', { a: this.n(d) }))
      : this.v('intercepta', { a: this.n(d) }))]
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
    // 🎬 os MOLDES de jogada (20/10, Diego: *"mais lances, mais jogadas: tabelas, ensaiadas, faltas, cruzamentos, lançamentos,
    // passes na frente, dribles, chute de fora, de dentro…"*). O autor da jogada puxa o molde que combina com o estilo e com o
    // GOLPE dele (driblador → jogada individual; quem tem lançamento → lançamento; cabeceador → bola aérea…).
    type Molde = 'enfiada' | 'cruzamento' | 'chute_fora' | 'drible' | 'escanteio' | 'falta' | 'contra' | 'tabela' | 'lancamento' | 'passe_na_frente' | 'individual' | 'ensaiada' | 'erro_zaga' | 'rebote'
    const TODOS: Molde[] = ['enfiada', 'cruzamento', 'chute_fora', 'drible', 'tabela', 'escanteio', 'contra', 'falta', 'lancamento', 'passe_na_frente', 'individual', 'ensaiada', 'erro_zaga', 'rebote']
    const dribla = this.tem(autor, 'slalom', 'elastico', 'pedalada', 'roleta', 'cruyff', 'croqueta', 'caneta', 'meia_lua', 'corta_pra_dentro')
    let molde: Molde =
      this.tem(assist, 'lancamento') && r < 0.6 ? 'lancamento'
      : dribla && r < 0.5 ? 'individual'
      : autor?.grupo === 'DEF' || autor?.grupo === 'LAT' || est === 'cabeceador' ? (r < 0.5 ? 'escanteio' : r < 0.8 ? 'cruzamento' : 'ensaiada')
      : est === 'chutador' ? (r < 0.4 ? 'chute_fora' : r < 0.7 ? 'falta' : r < 0.85 ? 'rebote' : 'enfiada')
      : est === 'driblador' ? (r < 0.5 ? 'drible' : r < 0.8 ? 'individual' : 'tabela')
      : est === 'velocista' ? (r < 0.5 ? 'contra' : r < 0.8 ? 'lancamento' : 'passe_na_frente')
      : est === 'finalizador' ? (r < 0.3 ? 'enfiada' : r < 0.5 ? 'cruzamento' : r < 0.65 ? 'tabela' : r < 0.8 ? 'passe_na_frente' : r < 0.9 ? 'rebote' : 'erro_zaga')
      : TODOS[Math.floor(r * TODOS.length)]
    // pouco tempo até o lance? molde curto
    const folga = tEv - this.t
    // (CHANCE com GOL logo atrás: nada de escanteio/falta, que levam uns 10 s armando e empurram o gol pra depois)
    const golPerto = ev.fim !== 'gol' && this.evs.slice(this.iev).some(e => e.fim === 'gol' && e.min * SEG_POR_MIN - tEv < 22)
    if (golPerto && (molde === 'escanteio' || molde === 'ensaiada' || molde === 'falta')) molde = 'enfiada'
    // (escanteio, ensaiada e falta precisam de tempo pra ARMAR: o time sobe, a barreira se forma, o cobrador vai até a bola)
    if ((molde === 'escanteio' && folga < 8.2) || (molde === 'ensaiada' && folga < 8.8) || (molde === 'falta' && folga < 5.8) || ((molde === 'cruzamento' || molde === 'rebote' || molde === 'individual') && folga < 5)) molde = folga < 4.5 ? 'chute_fora' : 'enfiada'
    // 🗺️ bola lá atrás (no próprio campo): não dá tempo de ARMAR escanteio/cruzamento — daí sai contra-ataque ou lançamento,
    // que é o que acontece de verdade quando o time sai de trás
    const fr = this.frente(l, this.bola.y)
    if ((fr > 45 && (molde === 'escanteio' || molde === 'ensaiada')) || (fr > 55 && (molde === 'cruzamento' || molde === 'rebote'))) molde = this.rng() < 0.5 ? 'contra' : 'lancamento'
    // ⏱️ o lance do jogo já está em cima (ou passou): vai no CURTO — o gol do campinho tem que sair no minuto do gol do jogo
    if (folga < 4.5) molde = folga < 2.7 ? 'chute_fora' : folga < 3.2 ? (this.rng() < 0.5 ? 'chute_fora' : 'erro_zaga') : (['chute_fora', 'drible', 'tabela', 'erro_zaga', 'enfiada'] as Molde[])[Math.floor(this.rng() * 5)]
    this.diag.moldes[molde] = (this.diag.moldes[molde] ?? 0) + 1
    this.tLance = tEv
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
          if (this.parada != null && this.parada !== l) return false // bola parada do rival (até no pé do cobrador): espera a cobrança dele
          if (t0 < 0) { t0 = this.t; ladrao = this.maisPerto(l, this.bola) }
          ladrao!.ov = { x: this.bola.x, y: this.bola.y, v: 10 }
          // (com o lance em cima, o bote é instantâneo: o tempo do gol vale mais que a bonitez)
          if (dist(ladrao!, this.bola) > 1.5 && this.t - t0 < Math.min(1.4, (tEv - this.t - 2.2) / 2)) return false
          // longe da bola? ela não "pula" pro pé dele: o rival erra o passe e a bola ROLA até ele (Diego 20/10: a bola nunca vai sozinha)
          if (dist(ladrao!, this.bola) > 3) { const z = ladrao!; z.ov = { x: z.x, y: z.y, v: 10 }; this.narra = this.v('intercepta', { a: this.n(z) }); this.viaja(clamp(z.x + 0.4, 1.5, W - 1.5), clamp(z.y - (z.lado === 0 ? 1.1 : -1.1), 1.5, L - 1.5), 22, 0, false, () => { this.pega(z); z.ov = null }); return false }
          this.pega(ladrao!); ladrao!.ov = null
        }
        if (this.bola.dono === quem()) return true
        passe = this.aPasse(() => this.bola.dono!, quem, { adiante: 1, vel: 26 })
        return passe.upd(0)
      } }
    }
    const LEAD: Record<Molde, number> = { enfiada: 3.4, cruzamento: 3.6, chute_fora: 1.6, drible: 2.6, tabela: 2.8, contra: 3.2, escanteio: 6.8, falta: 4.8, lancamento: 3.6, passe_na_frente: 3.4, individual: 3.4, ensaiada: 7.2, erro_zaga: 2.4, rebote: 3.2 }
    this.prazo = tEv - LEAD[molde]
    // 📏 de vez em quando a jogada COMEÇA num lateral — é o que dá lateral num jogo em que quase todo segundo é lance de verdade.
    // REGRA: quem manda pra fora é o RIVAL (o lateral é de quem NÃO tocou por último), e só com a bola perto da linha
    // (antes o próprio time chutava 34 m pra fora e cobrava o lateral dele mesmo)
    // (no GOL só com folga grande: o relógio manda e a cobrança do lateral custa uns segundos)
    if (folga > (ev.fim === 'gol' ? 12 : 7.5) && this.frente(l, this.bola.y) > 20 && Math.min(this.bola.x, W - this.bola.x) < 16 && !this.bola.voo && this.parada == null && !this.foraDoCampo() && (molde === 'cruzamento' || molde === 'passe_na_frente' || molde === 'lancamento' || molde === 'tabela' || molde === 'enfiada') && this.rng() < 0.4) {
      let corta: Atleta | null = null, t0 = 0
      pre({
        ini: () => { const d = this.bola.dono; corta = d && d.lado === adv ? d : this.maisPerto(adv, this.bola); t0 = this.t },
        upd: () => {
          const c = corta!
          if (this.bola.dono !== c && dist(c, this.bola) > 1.6 && this.t - t0 < 2) { c.ov = { x: this.bola.x, y: this.bola.y, v: 9.5 }; return false }
          if (this.bola.dono !== c) { if (dist(c, this.bola) > 1.6) return true; this.pega(c) } // (não chegou: a jogada segue sem o lateral)
          c.ov = null
          this.narra = this.v('afasta_lateral', { a: this.n(c) })
          this.viaja(this.bola.x < 34 ? -1.4 : W + 1.4, clamp(this.bola.y + (this.rng() - 0.5) * 6, 4, L - 4), 16, 0.4)
          return true
        },
      }, { upd: () => !this.bola.voo })
      // (a cobrança só entra se a bola SAIU mesmo; se o rival não chegou, o juiz/recupera seguem a regra normal)
      pre({ upd: () => { if (this.semReinicio && this.foraDoCampo()) this.acoes.unshift(...this.lateral(l)); return true } })
    }
    pre(...this.recuperaAcoes(l))
    // 🎯 COMO vai bater: o golpe da lenda manda (se ela tiver um que caiba na jogada); senão, o sorteio da posição
    const sorte = <T,>(xs: T[]) => xs[Math.floor(this.rng() * xs.length)]
    const acabDe = (p: Atleta, tipo: 'aereo' | 'longe' | 'perto'): Acab => {
      const g = p.golpes, r = this.rng()
      const mapa: Partial<Record<Golpe, Acab>> = tipo === 'aereo'
        ? { cabecada: 'cabeca', bicicleta: 'bicicleta', voleio: 'voleio', barriga: 'barriga' }
        : tipo === 'longe'
          ? { bomba: 'bomba', colocado: 'colocado', trivela: 'trivela', folha_seca: 'folha_seca', tres_dedos: 'tres_dedos', falta_curva: 'colocado', falta_bomba: 'bomba' }
          : { cobertura: 'cobertura', cavadinha: 'cavadinha', de_bico: 'de_bico', colocado: 'colocado', calcanhar: 'calcanhar', de_primeira: 'de_primeira', bomba: 'bomba', trivela: 'trivela', voleio: 'voleio', barriga: 'barriga' }
      const meus = g.map(x => mapa[x]).filter((x): x is Acab => !!x)
      if (meus.length && r < 0.7) return sorte(meus)
      if (tipo === 'aereo') return r < 0.08 ? 'voleio' : r < 0.1 ? 'barriga' : 'cabeca'
      if (tipo === 'longe') return r < 0.5 ? 'bomba' : r < 0.85 ? 'colocado' : 'trivela'
      return r < 0.35 ? 'rasteiro' : r < 0.6 ? 'colocado' : r < 0.8 ? 'de_primeira' : r < 0.9 ? 'de_bico' : r < 0.96 ? 'cobertura' : 'cavadinha'
    }
    // a frase de quem vai bater, pelo acabamento (com o pé, quando a gente sabe)
    const vaiBater = (p: Atleta, acab: Acab): string => {
      const pe = this.pe(p)
      const T: Record<Acab, [string, string]> = {
        rasteiro: [`${n(p)} ajeita${pe} e bate rasteiro…`, `${n(p)} sets it${pe} and hits it low…`], colocado: [`${n(p)} coloca${pe}, no cantinho…`, `${n(p)} curls it${pe} for the corner…`],
        trivela: [`${n(p)} bate de TRIVELA…`, `${n(p)} goes with the outside of the boot…`], folha_seca: [`${n(p)} bate por cima da barreira… a bola CAI!`, `${n(p)} strikes it over the wall… it DIPS!`],
        tres_dedos: [`${n(p)} bate de três dedos, com efeito…`, `${n(p)} bends it with the outside of the foot…`], bomba: [`${n(p)} solta a BOMBA${pe}!`, `${n(p)} lets fly${pe}!`],
        cobertura: [`${n(p)} vê o goleiro adiantado… e COBRE!`, `${n(p)} sees the keeper off his line… and CHIPS him!`], cavadinha: [`${n(p)} tenta a cavadinha…`, `${n(p)} tries a cheeky chip…`],
        voleio: [`${n(p)} pega de VOLEIO${pe}!`, `${n(p)} hits it on the VOLLEY${pe}!`], bicicleta: [`${n(p)} se joga… BICICLETA!`, `${n(p)} throws himself… OVERHEAD KICK!`],
        calcanhar: [`${n(p)} de calcanhar, sem olhar…`, `${n(p)} backheels it, no look…`], cabeca: [`${n(p)} sobe de cabeça…`, `${n(p)} rises for the header…`],
        de_bico: [`${n(p)} de bico, sem tempo pra pensar…`, `${n(p)} toe-pokes it, no time to think…`], de_primeira: [`${n(p)} bate de primeira${pe}!`, `${n(p)} hits it first time${pe}!`],
        barriga: [`a bola bate na BARRIGA de ${n(p)}…`, `it comes off ${n(p)}'s BELLY…`],
      }
      // 🎯 chute DE FORA DA ÁREA (Diego 20/10: *"deve chutar sim… mas não toda hora"*): a narração avisa que foi de longe
      const dGol = Math.hypot(34 - this.bola.x, this.frente(p.lado, this.bola.y))
      if (dGol > 21 && (acab === 'bomba' || acab === 'rasteiro' || acab === 'colocado' || acab === 'trivela' || acab === 'tres_dedos')) return this.v('arrisca', { a: n(p) })
      return this.en ? T[acab][1] : T[acab][0]
    }
    // 🚫 NADA DE CHUTE DO MEIO-CAMPO (Diego 20/10: *"tá tendo muito chute do meio-campo, nunca vi isso"*): antes de bater, a bola
    // TEM que estar a no máximo ~27 m do gol (chute de longe) ou ~18 m (chute de dentro). Se o enfeite foi cortado com a bola lá
    // atrás, quem vai bater ARRANCA com ela até a entrada da área (ou recebe um passe rápido lá) — custa 1–3 s, nunca um chute absurdo.
    const aLevaAte = (quem: () => Atleta, ponto: () => { x: number; y: number }, pronto: () => boolean, teto = 6, cortaNoLance = false): Acao => {
      let alvo: { x: number; y: number } | null = null, t0 = -1, solta = -1, tabelou = false
      return { upd: () => {
        if (this.bola.voo) return false
        const p = quem()
        if (pronto() && (this.bola.dono === p || (solta >= 0 && dist(p, this.bola) < 1.3))) { if (this.bola.dono !== p) this.pega(p); p.ov = null; return true }
        if (t0 < 0) {
          t0 = this.t; alvo = ponto()
          const h0 = this.bola.dono
          if (h0 === p) this.narra = this.v('avanca', { a: n(p) })
          else if (h0 && h0.lado === l) this.narra = this.v('toca_na_frente', { a: n(h0), b: n(p) })
        }
        if (this.t - t0 > (cortaNoLance ? Math.min(teto, Math.max(1.2, tEv - this.t + 0.8)) : teto)) { if (this.bola.dono !== p) this.pega(p); return true } // teto: o lance do jogo não espera pra sempre (e o chute, de todo jeito, só sai com a bola no pé)
        const h = this.bola.dono
        if (h === p) {
          // atrasado e longe? toca pro companheiro mais perto e CORRE pra área — o companheiro devolve lá na frente (2 passes
          // rápidos são bem mais rápidos que conduzir 40 m)
          // (UMA vez por jogada: antes virava pingue-pongue — tocava, recebia de volta e tocava de novo, e o gol atrasava)
          if (!tabelou && this.t > tEv - 2.5 && dist(p, alvo!) > 22 && dist(p, this.bola) <= 1.8) {
            // (só pra quem está À FRENTE dele e perto — antes podia ser o zagueiro lá atrás, e a bola voltava 27 m pra depois
            // um chutão de 75 m)
            const frente = this.time(l).filter(z => z !== p && z.grupo !== 'GOL' && this.frente(l, z.y) < this.frente(l, p.y) - 4 && dist(z, p) < 25)
            const ap = frente.sort((a, b) => dist(a, p) - dist(b, p))[0]
            if (ap) { tabelou = true; this.viaja(ap.x + 0.4, ap.y, 24, 0, false, () => { this.pega(ap) }); p.ov = { ...alvo!, v: 10 }; return false }
          }
          p.ov = { ...alvo!, v: 10 }; return false // conduz em velocidade
        }
        if (h && h.lado === l && h !== p) { // outro do time tem a bola: passe RÁPIDO pro ponto, quem recebe corre pra lá
          solta = -1 // (companheiro com a bola SEMPRE devolve — antes, depois do 1º passe, ele ficava parado segurando)
          // ⏱️ a bola e quem corre CHEGAM JUNTOS (Diego 20/10: *"a bola às vezes para do nada"*): antes o passe saía a 27 m/s e
          // a bola ficava 2–3 s parada no ponto esperando o jogador correr 12 m. Agora a força do passe sai do tempo da corrida, e
          // se ele está longe demais, a bola cai num ponto mais perto dele, no caminho.
          // (o DESTINO da jogada não muda: depois de dominar ele segue conduzindo até lá)
          const enc = this.encontro(this.bola, p, alvo!)
          p.ov = { ...enc.pt, v: 10 }
          this.viaja(enc.pt.x, enc.pt.y, enc.vel, dist(this.bola, enc.pt) > 25 ? 2.4 : 0.4, false, () => { solta = this.t })
          return false
        }
        if (solta >= 0 || !h) { if (!h && !this.podePegar(p)) return false; p.ov = { x: this.bola.x, y: this.bola.y, v: 10 }; if (!h && dist(p, this.bola) < 1.3) this.pega(p); return false }
        return false
      } }
    }
    const aproxima = (quem: () => Atleta, longe: boolean, teto = 6): Acao => {
      const lim = longe ? 27 : 18
      return aLevaAte(quem, () => box(lim - 3, clamp((quem().x - 34) * 0.5, -14, 14)), () => this.frente(l, this.bola.y) <= lim + 1, teto)
    }
    // 🚚 TRANSIÇÃO: a jogada começa lá atrás (depois de um tiro de meta, por exemplo)? Primeiro a bola vem rápido pro campo de
    // ataque — passe longo pro meia ou arrancada — e só então o molde começa. Sem isso o enfeite inteiro acontecia no próprio campo.
    if (this.frente(l, this.bola.y) > 50 && folga > 5) {
      const meia = umaVez(() => this.preferido(l, ['MEI'], ['passador', 'lancamento' as never]))
      pre(aLevaAte(meia, () => box(44, clamp((meia().x - 34) * 0.6, -16, 16)), () => this.frente(l, this.bola.y) <= 48, 5.5, true))
    }
    const chute = (quem: () => Atleta, o: { cabeca?: boolean; alto?: boolean; vel?: number; acab?: Acab; tipo?: 'aereo' | 'longe' | 'perto'; parada?: boolean }, txt?: string) =>
      fim(...(o.parada ? [] : [aproxima(quem, o.tipo === 'longe' || !!o.alto), aproxima(quem, o.tipo === 'longe' || !!o.alto, 5)]), ...(o.parada ? this.cobranca(this.aSegura(tEv - 0.75)) : [this.aSegura(tEv - (o.cabeca || o.tipo === 'aereo' ? 0.9 : 0.75))]), {
        pos: !!o.parada,
        // o acabamento é sorteado NA HORA (quem bate pode ter mudado se o enfeite foi cortado)
        upd: () => { const p = quem(); const acab = o.acab ?? acabDe(p, o.tipo ?? (o.cabeca ? 'aereo' : o.alto ? 'longe' : 'perto')); o.acab = acab; this.narra = txt ?? vaiBater(p, acab); return true },
      }, ...(o.parada ? this.cobranca(this.aChute(quem, ev.fim, ev, o)) : [this.aChute(quem, ev.fim, ev, o)]))
    // 🧤 drible no goleiro (golpe de Romário/Ronaldo/Pelé/Maradona): o goleiro sai, o cara passa por ele e empurra pro gol vazio
    const dribleGoleiro = (quem: () => Atleta): Acao => ({
      ini: () => { const p = quem(), gk = this.gk(adv); gk.ov = { x: p.x + (this.bola.x - p.x), y: p.y + (l === 0 ? -3 : 3), v: 8 }; p.ov = { ...this.rel(l, clamp(this.rel(l, p.x, p.y).x + (p.x < 34 ? 5 : -5), 20, 48), 5), v: 7.5 }; this.narra = this.v('dribla_goleiro', { a: n(p) }) },
      upd: () => { const p = quem(); if (!p.ov || dist(p, p.ov) < 0.8 || this.t > tEv - 0.7) { p.ov = null; return true } return false },
    })
    // 🪄 um drible com nome: o marcador dá o bote e fica pra trás; o golpe da lenda dá o texto
    const umDrible = (quem: () => Atleta, prof: number, ultimo = false): Acao => ({
      ini: () => {
        const d = quem(), z = this.preferido(adv, ['DEF', 'MEI'], []); z.ov = { x: d.x, y: d.y + (l === 0 ? -2 : 2), v: 7 }
        d.ov = { ...this.rel(l, clamp(this.rel(l, d.x, d.y).x + (this.rng() < 0.5 ? -7 : 7), 8, 60), Math.max(prof, this.frente(l, d.y) - 9)), v: 8 }
        const g = d.golpes.filter(x => (['elastico', 'pedalada', 'chapeu', 'roleta', 'cruyff', 'caneta', 'meia_lua', 'slalom', 'croqueta', 'corta_pra_dentro'] as Golpe[]).includes(x))
        const golpe = g.length ? sorte(g) : null
        const TX: Partial<Record<Golpe, [string, string]>> = {
          elastico: [`ELÁSTICO de ${n(d)}! ${n(z)} ficou pra trás`, `FLIP-FLAP by ${n(d)}! ${n(z)} is left behind`], pedalada: [`${n(d)} dá a pedalada e sai de ${n(z)}`, `${n(d)} stepovers and leaves ${n(z)}`],
          chapeu: [`CHAPÉU de ${n(d)} em ${n(z)}!`, `${n(d)} LOBS it over ${n(z)}!`], roleta: [`ROLETA de ${n(d)}! Girou em cima de ${n(z)}`, `ROULETTE by ${n(d)}! Spun past ${n(z)}`],
          cruyff: [`${n(d)} dá o giro de Cruyff e deixa ${n(z)} no chão`, `${n(d)} Cruyff-turns ${n(z)} to the ground`], caneta: [`CANETA! ${n(d)} passou a bola entre as pernas de ${n(z)}`, `NUTMEG! ${n(d)} slips it through ${n(z)}'s legs`],
          meia_lua: [`${n(d)} dá a meia-lua em ${n(z)}`, `${n(d)} goes round ${n(z)} with a half-moon`], slalom: [`${n(d)} costura a defesa, deixa ${n(z)} no caminho…`, `${n(d)} slaloms through, ${n(z)} is beaten…`],
          croqueta: [`${n(d)} faz a croqueta e ${n(z)} vai no cheiro`, `${n(d)}'s croqueta leaves ${n(z)} grasping`], corta_pra_dentro: [`${n(d)} corta pra dentro em cima de ${n(z)}…`, `${n(d)} cuts inside past ${n(z)}…`],
        }
        const tx = golpe ? TX[golpe]! : [`${n(d)} passa por ${n(z)}!`, `${n(d)} goes past ${n(z)}!`]
        this.narra = (this.en ? tx[1] : tx[0]) + (ultimo ? '' : '')
      },
      upd: () => { const d = quem(); if (!d.ov || dist(d, d.ov) < 0.8 || this.t > tEv - (ultimo ? 1 : 2.2)) { d.ov = null; return true } return false },
    })
    switch (molde) {
      case 'enfiada': {
        pre(this.aPasse(() => this.bola.dono!, passador, { adiante: 2 }), this.aConduz(passador, () => box(40, (passador().bx - 34) * 0.5), 6))
        fim(garante(passador), { upd: () => { this.narra = this.v('enfia', { a: n(passador()), b: n(fin()) }); return true } },
          this.aPasse(() => this.bola.dono!, fin, { adiante: 9, vel: 22 }), this.aConduz(fin, () => box(11, (fin().x - 34) * 0.2), 7.4, 1.2))
        if (ev.fim === 'gol' && this.tem(fin(), 'drible_goleiro') && this.rng() < 0.6) { fim(dribleGoleiro(fin)); chute(fin, { acab: 'rasteiro' }, this.v('gol_vazio', { a: n(fin()) })) }
        else chute(fin, { tipo: 'perto' })
        break
      }
      case 'cruzamento': {
        const oCruz: { cabeca: boolean; alto: boolean; acab?: Acab } = { cabeca: true, alto: true }
        let t0c = 0
        const ala = umaVez(() => this.preferido(l, ['LAT', 'ATA'], ['apoiador', 'driblador'], fin()))
        const lado = this.rng() < 0.5 ? -1 : 1
        pre(this.aPasse(() => this.bola.dono!, ala, { adiante: 8, dx: lado * 10 }), { upd: () => { this.narra = this.v('linha_fundo', { a: n(ala()) }); return true } },
          this.aConduz(ala, () => this.rel(l, lado < 0 ? 5 : 63, 8), 7.2, 3.5))
        // o cruzamento só sai da LINHA DE FUNDO (senão a "cabeçada" acontecia no meio-campo): o ala leva a bola até lá primeiro
        fim(garante(ala), aLevaAte(ala, () => this.rel(l, lado < 0 ? 6 : 62, 9), () => this.frente(l, this.bola.y) <= 16, 5),
          { ini: () => { const f = fin(); f.ov = { ...box(7, -lado * 3), v: 9.5 } }, upd: () => true },
          this.aSegura(tEv - 2.1),
          // (e só cruza com o atacante JÁ na área — senão a "cabeçada" saía de 30 m)
          { ini: () => { t0c = this.t }, upd: () => { const f = fin(); if (this.frente(l, f.y) <= 16 || this.t - t0c > 3) return true; f.ov = { ...box(7, -lado * 3), v: 9.5 }; return false } }, { upd: () => { this.narra = this.v('cruzou'); return true } }, this.aPasse(() => this.bola.dono!, fin, { alto: true, adiante: 0, vel: 18 }),
          { upd: () => { const f = fin(); oCruz.acab = acabDe(f, 'aereo'); this.narra = vaiBater(f, oCruz.acab); return true } }, this.aChute(fin, ev.fim, ev, oCruz))
        break
      }
      case 'chute_fora': {
        const ch = umaVez(() => autor ?? this.preferido(l, ['MEI', 'LAT'], ['chutador']))
        pre(this.aPasse(() => this.bola.dono!, ch, { adiante: 4 }), this.aConduz(ch, () => box(26, (ch().x - 34) * 0.4), 6, 3))
        fim(garante(ch))
        chute(ch, { alto: true, vel: 29, tipo: 'longe' })
        break
      }
      case 'drible': {
        const dr = umaVez(() => autor ?? this.preferido(l, ['ATA', 'MEI'], ['driblador']))
        pre(this.aPasse(() => this.bola.dono!, dr, { adiante: 4 }), { upd: () => { this.narra = this.v('parte_pra_cima', { a: n(dr()) }); return true } })
        // 🪄 o drible: o marcador dá o bote e fica pra trás
        fim(garante(dr), {
          ini: () => { const d = dr(), z = this.preferido(adv, ['DEF', 'MEI'], []); z.ov = { x: d.x, y: d.y + (l === 0 ? -2 : 2), v: 7 }; d.ov = { ...this.rel(l, clamp(this.rel(l, d.x, d.y).x + (this.rng() < 0.5 ? -7 : 7), 8, 60), Math.max(12, this.frente(l, d.y) - 9)), v: 8 } },
          upd: () => { const d = dr(); if (!d.ov || dist(d, d.ov) < 0.8 || this.t > tEv - 1) { d.ov = null; this.narra = this.v('drible_passou', { a: n(d) }); return true } return false },
        })
        chute(dr, { tipo: 'perto' })
        break
      }
      case 'tabela': {
        const um = umaVez(() => autor ?? this.preferido(l, ['ATA'], ['finalizador', 'driblador']))
        const outro = umaVez(() => assist ?? this.preferido(l, ['MEI', 'ATA'], ['passador'], um()))
        pre(this.aPasse(() => this.bola.dono!, um, { adiante: 3 }), { upd: () => { this.narra = this.v('tabela', { a: n(um()), b: n(outro()) }); return true } }, this.aPasse(um, outro, { adiante: 2 }))
        fim(garante(outro), this.aPasse(() => this.bola.dono!, um, { adiante: 8, vel: 21 }), this.aConduz(um, () => box(12, (um().x - 34) * 0.3), 7, 1))
        chute(um, { tipo: 'perto' })
        break
      }
      case 'contra': {
        const vel = umaVez(() => autor ?? this.preferido(l, ['ATA'], ['velocista']))
        pre({ upd: () => { this.narra = this.v('contra'); return true } }, this.aPasse(() => this.bola.dono!, vel, { adiante: 12, vel: 21 }), { upd: () => { this.narra = this.v('dispara', { a: n(vel()) }); return true } })
        fim(garante(vel), this.aConduz(vel, () => box(13, (vel().x - 34) * 0.4), 8.6, 2.2))
        if (ev.fim === 'gol' && this.tem(vel(), 'drible_goleiro') && this.rng() < 0.6) { fim(dribleGoleiro(vel)); chute(vel, { acab: 'rasteiro' }, this.v('gol_vazio', { a: n(vel()) })) }
        else chute(vel, { tipo: 'perto' })
        break
      }
      case 'escanteio': {
        const oEsc: { cabeca: boolean; alto: boolean; acab?: Acab } = { cabeca: true, alto: true }
        // a bola vai pela ponta, a zaga desvia pra linha de fundo → ESCANTEIO armado (o ataque inteiro sobe)
        const lado = this.rng() < 0.5 ? -1 : 1
        const ala = umaVez(() => this.preferido(l, ['LAT', 'ATA', 'MEI'], ['apoiador', 'driblador'], fin()))
        const cob = umaVez(() => this.maisPerto(l, this.rel(l, lado < 0 ? 0 : W, 0), [fin()]))
        // o ataque já vem subindo DESDE AGORA (é o que dá tempo de a área encher antes da cobrança)
        this.sobeProEscanteio(l, lado, cob, fin)
        pre(this.aPasse(() => this.bola.dono!, ala, { adiante: 10, dx: lado * 12, vel: 22 }))
        // (o desvio pra linha de fundo NÃO é cortado: é ele que mostra por que é escanteio)
        fim({ ini: () => { this.narra = this.v('escanteio_desvio'); const o = this.rel(l, lado < 0 ? 4 : 64, -1.5); this.viaja(o.x, o.y, Math.max(22, dist(this.bola, o) / 1.2), 0.8); this.ultimoToque = adv; this.sobeProEscanteio(l, lado, cob, fin) }, upd: () => !this.bola.voo })
        fim(...this.escanteio(l, lado, cob, fin, tEv - 1.5), ...this.cobranca(this.aSegura(tEv - 2), { upd: () => { this.narra = this.v('escanteio_cobra', { a: n(cob()) }); return true } },
          this.aPasse(cob, fin, { alto: true, adiante: 0, vel: 23 })), { upd: () => { const f = fin(); oEsc.acab = acabDe(f, 'aereo'); this.narra = vaiBater(f, oEsc.acab); return true } },
          this.aChute(fin, ev.fim, ev, oEsc), this.soltaTodos())
        break
      }
      case 'falta': {
        // o jogador avança, o zagueiro chega atrasado e DERRUBA → falta: barreira a 9 m, o batedor vai até a bola
        const ch = umaVez(() => autor ?? this.preferido(l, ['MEI', 'ATA', 'LAT'], ['chutador']))
        const vit = umaVez(() => this.preferido(l, ['ATA', 'MEI'], ['driblador'], ch()))
        const falt = umaVez(() => this.preferido(adv, ['DEF', 'MEI'], ['desarmador']))
        // (o batedor já vai chegando perto da área enquanto a jogada rola — senão ele vinha de longe pra cobrar e a bola ficava parada)
        pre({ ini: () => { const c = ch(); if (c !== vit()) c.ov = { ...this.naArea(l, 26, (c.x - 34) * 0.4), v: 9 } }, upd: () => true },
          this.aPasse(() => this.bola.dono!, vit, { adiante: 4 }), this.aConduz(vit, () => this.naArea(l, 23, (this.rng() - 0.5) * 14), 6.5, 3))
        fim(garante(vit), {
          ini: () => { const v = this.bola.dono ?? vit(); falt().ov = { x: v.x, y: v.y, v: 10 }; const c = ch(); if (c !== v) c.ov = { x: v.x, y: v.y + (l === 0 ? 4 : -4), v: 9 } },
          upd: () => { const v = this.bola.dono ?? vit(); return dist(falt(), v) < 1.6 || this.t > tEv - 3.6 },
        }, {
          pos: true, // (a partir do apito, tudo é a cobrança da falta: o juiz não interrompe)
          ini: () => {
            const v = this.bola.dono ?? vit()
            this.narra = this.v('falta', { a: n(falt()), b: n(v) })
            // a bola fica onde foi a falta (se for longe demais do gol, vai pra entrada da área)
            const fr = this.frente(l, this.bola.y), pt = fr > 17 && fr < 32 && this.bola.x > 12 && this.bola.x < 56 ? { x: this.bola.x, y: this.bola.y } : this.naArea(l, 22, (this.rng() - 0.5) * 12)
            this.coloca(pt.x, pt.y, l, ch()); this.posse = l
            const g = this.rel(l, 34, 0), dx = g.x - pt.x, dy = g.y - pt.y, dd = Math.hypot(dx, dy), ux = dx / dd, uy = dy / dd
            // a barreira: os 4 da defesa/meio MAIS PERTO do lugar dela (antes iam os 4 primeiros da lista, às vezes lá do outro lado)
            const bar = { x: pt.x + ux * 9.15, y: pt.y + uy * 9.15 }
            const barreira = this.do(adv, ['DEF', 'MEI']).sort((a, b) => dist(a, bar) - dist(b, bar)).slice(0, 4)
            barreira.forEach((z, i) => { z.ov = { x: bar.x - uy * (i - 1.5) * 1.1, y: bar.y + ux * (i - 1.5) * 1.1, v: 10 } })
            this.afastaDe(pt, adv, 9.6, barreira) // REGRA: o resto do time rival (até quem fez a falta) fica a 9,15 m da bola
            this.do(l, ['ATA']).filter(z => z !== ch()).forEach((z, i) => { z.ov = { ...this.naArea(l, 9, i % 2 ? 7 : -7), v: 7 } })
            ch().ov = { x: pt.x - ux * 1.3, y: pt.y - uy * 1.3, v: 10 }
          },
          // (só bate com a barreira armada e o resto do time rival a 9,15 m — REGRA; o relógio do lance é o teto)
          upd: () => { const c = ch(); const livre = !this.time(adv).some(z => z.grupo !== 'GOL' && dist(z, this.bola) < 8.8); if ((dist(c, this.bola) < 1.8 && livre) || this.t > tEv - 0.9) { this.pega(c); return true } return false },
        })
        chute(ch, { alto: true, vel: 24, tipo: 'longe', parada: true }) // (falta se bate de onde foi: ninguém sai conduzindo)
        fim(this.soltaTodos())
        break
      }
      case 'lancamento': {
        // 🎯 lançamento longo nas costas da zaga (golpe de Pirlo, Gérson, Xavi, Kroos, Beckenbauer…): o atacante domina e finaliza
        const lanc = umaVez(() => assist ?? this.preferido(l, ['MEI', 'DEF'], ['passador'], fin()))
        pre(this.aPasse(() => this.bola.dono!, lanc, { adiante: 1 }), { upd: () => { this.narra = this.v('lanc_olha', { a: n(lanc()), b: n(fin()) }); return true } })
        fim(garante(lanc), { upd: () => { this.narra = this.v('lanc_bola', { a: n(lanc()) }); return true } },
          this.aPasse(() => this.bola.dono!, fin, { alto: true, vel: 24, adiante: 14 }), { upd: () => { this.narra = this.v('domina', { a: n(fin()) }); return true } }, this.aConduz(fin, () => box(10, (fin().x - 34) * 0.2), 7.6, 1.3))
        if (ev.fim === 'gol' && this.tem(fin(), 'drible_goleiro') && this.rng() < 0.5) { fim(dribleGoleiro(fin)); chute(fin, { acab: 'rasteiro' }, this.v('gol_vazio', { a: n(fin()) })) }
        else chute(fin, { tipo: 'perto' })
        break
      }
      case 'passe_na_frente': {
        // ↗️ a bola rolada na frente pelo lateral/meia, pro atacante chegar batendo
        const ala = umaVez(() => assist ?? this.preferido(l, ['LAT', 'MEI'], ['apoiador', 'passador'], fin()))
        const lado = this.rng() < 0.5 ? -1 : 1
        pre(this.aPasse(() => this.bola.dono!, ala, { adiante: 6, dx: lado * 8 }), { upd: () => { this.narra = this.v('avanca_lado', { a: n(ala()), b: lado < 0 ? tt('esquerda', 'left') : tt('direita', 'right') }); return true } },
          this.aConduz(ala, () => this.rel(l, lado < 0 ? 14 : 54, 30), 6.8, 2.5))
        fim(garante(ala), { upd: () => { this.narra = this.v('rola_na_frente', { a: n(ala()), b: n(fin()) }); return true } },
          this.aPasse(() => this.bola.dono!, fin, { adiante: 7, dx: -lado * 8, vel: 20 }), this.aConduz(fin, () => box(11, -lado * 4), 7.4, 1.1))
        chute(fin, { tipo: 'perto' })
        break
      }
      case 'individual': {
        // 🪄 jogada individual: a lenda passa por DOIS (cada drible com o golpe dela: elástico, pedalada, roleta, caneta…)
        const dr = umaVez(() => autor ?? this.preferido(l, ['ATA', 'MEI'], ['driblador']))
        pre(this.aPasse(() => this.bola.dono!, dr, { adiante: 4 }), { upd: () => { this.narra = this.v('individual', { a: n(dr()) }); return true } })
        fim(garante(dr), umDrible(dr, 22), umDrible(dr, 12, true))
        chute(dr, { tipo: 'perto' }, undefined)
        break
      }
      case 'ensaiada': {
        // 📐 escanteio CURTO ensaiado: o cobrador toca pro parceiro, que devolve rasteiro pra trás pro atacante chegar de primeira
        const lado = this.rng() < 0.5 ? -1 : 1
        const ala = umaVez(() => this.preferido(l, ['LAT', 'ATA', 'MEI'], ['apoiador', 'driblador'], fin()))
        const cob = umaVez(() => this.maisPerto(l, this.rel(l, lado < 0 ? 0 : W, 0), [fin()]))
        const par = umaVez(() => this.preferido(l, ['MEI', 'LAT'], ['passador'], [fin(), cob()])) // (nunca o próprio cobrador: senão ele "tocava pra si" e batia da bandeirinha)
        this.sobeProEscanteio(l, lado, cob, fin)
        pre(this.aPasse(() => this.bola.dono!, ala, { adiante: 10, dx: lado * 12, vel: 22 }))
        fim({ ini: () => { this.narra = this.v('escanteio_desvio'); const o = this.rel(l, lado < 0 ? 4 : 64, -1.5); this.viaja(o.x, o.y, Math.max(22, dist(this.bola, o) / 1.2), 0.8); this.ultimoToque = adv; this.sobeProEscanteio(l, lado, cob, fin) }, upd: () => !this.bola.voo })
        fim(...this.escanteio(l, lado, cob, fin, tEv - 2.8), { ini: () => { const pr = par(); pr.ov = { ...this.rel(l, lado < 0 ? 6 : 62, 7), v: 9 } }, upd: () => true },
          ...this.cobranca({ upd: () => { this.narra = this.v('ensaiada_1', { a: n(cob()), b: n(par()) }); return true } },
          this.aPasse(cob, par, { adiante: 0, vel: 14 })), this.aEspera(0.3),
          { upd: () => { this.narra = this.v('ensaiada_2', { a: n(par()), b: n(fin()) }); return true } },
          { ini: () => { const f = fin(); f.ov = { ...box(14, -lado * 3), v: 9 } }, upd: () => true },
          this.aPasse(par, fin, { adiante: 0, vel: 17 }))
        chute(fin, { acab: 'de_primeira' })
        fim(this.soltaTodos())
        break
      }
      case 'erro_zaga': {
        // 😱 ERRO DA ZAGA: o zagueiro roda a bola na própria área, o atacante dá o bote e rouba
        const z = umaVez(() => (this.bola.dono?.lado === adv ? this.bola.dono : this.maisPerto(adv, this.bola)))
        // (se a bola já está com a zaga rival, ela só roda; senão a zaga INTERCEPTA um passe — nada de bola aparecendo no pé)
        if (this.bola.dono?.lado !== adv) pre(this.aPasse(() => this.bola.dono!, () => this.preferido(l, ['ATA', 'MEI'], [], fin()), { adiante: 10, vel: 20 }), ...this.recuperaAcoes2(adv))
        // a bola solta? o zagueiro vai até ela antes de "rodar" (nada de bola morta no gramado)
        pre({ upd: () => { if (this.bola.voo) return false; if (this.bola.dono) return true; const d = z(); d.ov = { x: this.bola.x, y: this.bola.y, v: 9 }; if (dist(d, this.bola) < 1.2) { this.pega(d); return true } return false } },
          { ini: () => { const d = this.bola.dono?.lado === adv ? this.bola.dono : z(); d.ov = { ...this.naArea(l, 19, (this.rng() - 0.5) * 16), v: 4.5 }; this.narra = this.v('zaga_roda', { a: n(d) }) }, upd: () => { const d = this.bola.dono ?? z(); return !d.ov || dist(d, d.ov) < 1 } })
        fim({
          ini: () => { const f = fin(); const d = this.bola.dono?.lado === adv ? this.bola.dono : z(); f.ov = { x: d.x, y: d.y, v: 10.5 }; this.narra = this.v('pressiona', { a: n(f) }) },
          upd: () => {
            const f = fin(), d = this.bola.dono
            if (this.bola.voo || (!d && this.parada != null && this.parada !== l)) return false
            if (!d || d.lado === l) { f.ov = null; return true } // a bola já é nossa: vai bater
            f.ov = { x: d.x, y: d.y, v: 10.5 }
            if (dist(f, d) < 1.6 || this.t > tEv - 1.6) { this.pega(f); f.ov = null; this.narra = this.v('erro_zaga', { a: n(d), b: n(f) }); return true }
            return false
          },
        })
        chute(fin, { tipo: 'perto' })
        break
      }
      case 'rebote': {
        // 🧤 REBOTE: o primeiro chute o goleiro espalma; a sobra cai pro atacante, que bate de primeira
        const ch = umaVez(() => this.preferido(l, ['MEI', 'ATA'], ['chutador'], fin()))
        const gk = this.gk(adv)
        pre(this.aPasse(() => this.bola.dono!, ch, { adiante: 4 }), this.aConduz(ch, () => box(21, (ch().x - 34) * 0.4), 6, 2.2))
        let cai = { x: 34, y: 10 }
        fim(garante(ch), { upd: () => { this.narra = this.v('arrisca', { a: n(ch()) }); return true } }, {
          ini: () => {
            const c = ch(); if (this.bola.dono !== c) this.pega(c)
            const ataca0 = l === 0, lado = this.rng() < 0.5 ? -1 : 1
            const bx = 34 + lado * 2.4, by = ataca0 ? 1.4 : L - 1.4
            cai = { x: 34 + lado * (6 + this.rng() * 3), y: ataca0 ? 7 + this.rng() * 3 : L - 7 - this.rng() * 3 }
            gk.ov = { x: bx, y: by, v: 12 }
            const f = fin(); f.ov = { ...cai, v: 9 }
            this.viaja(bx, by, 23, 0.6, true, () => { gk.ov = null; this.narra = this.v('espalma', { a: n(gk) }); this.viaja(cai.x, cai.y, 11, 1.2, false) })
          },
          upd: () => { const f = fin(); if (this.bola.voo) return false; if (dist(f, this.bola) < 1.6 || this.t > tEv - 1) { this.pega(f); f.ov = null; return true } f.ov = { ...cai, v: 9 }; return false },
        })
        chute(fin, { acab: this.rng() < 0.7 ? 'de_primeira' : 'rasteiro' })
        break
      }
    }
    if (ev.fim !== 'gol') {
      const gk = this.gk(adv), k = ev.fim
      // (pra fora/isolou a frase já é parte da COBRANÇA: a bola saiu e o juiz não pode mandar um 2º tiro de meta na frente dela)
      const final: Acao = { upd: () => {
        // 🧤 goleiro paredão/com golpe de defesa milagrosa ganha a frase dele
        this.narra = k === 'defendeu' && this.tem(gk, 'defesa_milagrosa') && this.rng() < 0.6
          ? this.tt(`DEFESA MILAGROSA de ${n(gk)}! De onde ele tirou essa?`, `MIRACLE SAVE by ${n(gk)}! Where did that come from?`)
          : this.v(k)
        this.narraForteAte = this.t + 1.5 // (o resultado da chance fica no ar: o tiro de meta/a reposição não apaga ela na hora)
        return true
      } }
      fim(...(k === 'fora' || k === 'isolou' ? this.cobranca(final) : [final]))
      // e o jogo recomeça com a REGRA: pra fora = tiro de meta · o goleiro segurou = ele repõe
      if (ev.fim === 'fora' || ev.fim === 'isolou') fim(...this.reinicio([this.aEspera(0.7)]), ...this.tiroDeMeta(adv))
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
    // (escanteio pede tempo pra subir o time e cobrar: com folga, ele aparece mais — futebol de verdade tem vários por jogo)
    // (e o lateral também: bola afastada pela linha é o lance mais comum do futebol)
    const r0 = this.rng(), r1 = livre >= 13 && r0 < 0.25 ? 0.7 : livre >= 6 && r0 < 0.5 ? 0.5 : this.rng()
    const r = r1 >= 0.64 && r1 < 0.74 && livre < 11 ? 0.45 : r1 // (sem ~10 s livres, nada de escanteio: ele empurrava o lance seguinte)
    const meia = umaVez(() => this.preferido(l, ['MEI'], ['passador']))
    const dono = () => this.bola.dono!
    if (r < 0.1) {
      // ⚽ troca de passe no meio e o rival rouba
      const a = meia(), b = this.preferido(l, ['MEI', 'LAT', 'ATA'], [], a)
      ac.push(this.aNarra(this.v('toca', { a: n(a), b: n(b) })), this.aPasse(dono, () => a), this.aPasse(() => a, () => b), ...this.recuperaAcoes2(adv))
    } else if (r < 0.18) {
      // 🔄 inversão de jogo, o lateral apoia e cruza: a zaga corta
      const lat = this.preferido(l, ['LAT'], ['apoiador'])
      ac.push(this.aNarra(this.v('inverte', { a: n(meia()), b: n(lat) })),
        this.aPasse(dono, meia), this.aPasse(meia, () => lat, { alto: true, vel: 21, adiante: 6 }),
        this.aConduz(() => lat, a => ({ x: a.x, y: clamp(a.y + (l === 0 ? -10 : 10), 4, L - 4) }), 6.5, 2),
        this.aNarra(this.v('zaga_corta')),
        this.aPasse(() => lat, () => this.preferido(adv, ['DEF'], ['cabeceador', 'desarmador']), { alto: true, adiante: 0, vel: 17 }))
    } else if (r < 0.32) {
      // 🛡️ o drible não passa: desarme (às vezes o zagueiro tira pela LATERAL)
      const dr = this.preferido(l, ['ATA', 'MEI'], ['driblador'])
      const g = dr.golpes.find(x => x === 'elastico' || x === 'pedalada' || x === 'chapeu' || x === 'roleta' || x === 'caneta')
      const txDr = g === 'elastico' ? tt(`${n(dr)} tenta o elástico…`, `${n(dr)} tries the flip-flap…`) : g === 'pedalada' ? tt(`${n(dr)} dá uma pedalada…`, `${n(dr)} stepovers…`) : g === 'chapeu' ? tt(`${n(dr)} tenta o chapéu…`, `${n(dr)} tries to lob him…`) : g === 'roleta' ? tt(`${n(dr)} tenta a roleta…`, `${n(dr)} tries the roulette…`) : g === 'caneta' ? tt(`${n(dr)} tenta a caneta…`, `${n(dr)} tries a nutmeg…`) : this.v('tenta_drible', { a: n(dr) })
      ac.push(this.aPasse(dono, () => dr, { adiante: 3 }), this.aNarra(txDr),
        this.aConduz(() => dr, a => ({ x: clamp(a.x + (this.rng() < 0.5 ? -4 : 4), 3, W - 3), y: clamp(a.y + (l === 0 ? -5 : 5), 6, L - 6) }), 6, 1.6))
      if (this.rng() < 0.6) {
        const z = umaVez(() => this.maisPerto(adv, this.bola))
        ac.push({ ini: () => { z().ov = { x: this.bola.x, y: this.bola.y, v: 9 } }, upd: () => dist(z(), this.bola) < 1.6 || (z().ov = { x: this.bola.x, y: this.bola.y, v: 9 }, false) },
          { ini: () => { this.narra = this.v('carrinho_lateral', { a: n(z()) }); this.viaja(this.bola.x < 34 ? -1.4 : W + 1.4, clamp(this.bola.y + (this.rng() - 0.5) * 6, 4, L - 4), 12, 0.4); this.ultimoToque = z().lado; z().ov = null }, upd: () => !this.bola.voo },
          ...this.lateral(l))
      } else ac.push(...this.recuperaAcoes2(adv))
    } else if (r < 0.64) {
      // 📏 a bola vai pela ponta, o rival afasta pela LATERAL → lateral cobrado com as mãos
      const ala = this.preferido(l, ['LAT', 'ATA', 'MEI'], ['apoiador']), corta = this.preferido(adv, ['LAT', 'DEF', 'MEI'], ['desarmador'])
      const sx = ala.x < 34 ? -1 : 1
      ac.push(this.aPasse(dono, () => ala, { adiante: 5, dx: sx * 6 }),
        (() => { let t0 = 0; return { ini: () => { t0 = this.t; corta.ov = { x: ala.x, y: ala.y, v: 8.5 } }, upd: () => dist(corta, ala) < 2.6 || this.t - t0 > 2.5 || (corta.ov = { x: ala.x, y: ala.y, v: 8.5 }, false) } })(),
        { ini: () => { this.narra = this.v('afasta_lateral', { a: n(corta) }); this.viaja(sx < 0 ? -1.4 : W + 1.4, clamp(this.bola.y + (this.rng() - 0.5) * 8, 4, L - 4), 12, 0.6); this.ultimoToque = corta.lado; corta.ov = null }, upd: () => !this.bola.voo },
        ...this.lateral(l))
    } else if (r < 0.74) {
      // ⛳ cruzamento desviado pra escanteio; cobrança na área e a zaga tira de cabeça
      const lado = this.rng() < 0.5 ? -1 : 1
      const ala = this.preferido(l, ['LAT', 'ATA'], ['apoiador', 'driblador'])
      const cob = umaVez(() => this.maisPerto(l, this.rel(l, lado < 0 ? 0 : W, 0)))
      const alvo = umaVez(() => this.preferido(l, ['ATA', 'DEF'], ['cabeceador'], cob()))
      const zag = umaVez(() => this.preferido(adv, ['DEF'], ['cabeceador', 'desarmador']))
      ac.push(this.aPasse(dono, () => ala, { adiante: 8, dx: lado * 10 }), this.aConduz(() => ala, () => this.rel(l, lado < 0 ? 7 : 61, 12), 7.2, 2.6),
        { ini: () => { this.narra = this.v('escanteio_desvio'); const o = this.rel(l, lado < 0 ? 4 : 64, -1.5); this.viaja(o.x, o.y, 22, 0.8); this.ultimoToque = adv; this.sobeProEscanteio(l, lado, cob, alvo) }, upd: () => !this.bola.voo },
        ...this.escanteio(l, lado, cob, alvo, null), ...this.cobranca(this.aEspera(0.8), { upd: () => { this.narra = this.v('escanteio_cobra', { a: n(cob()) }); return true } },
        this.aPasse(cob, alvo, { alto: true, adiante: 0, vel: 18 })),
        { ini: () => { const z = zag(); z.ov = { x: this.bola.x, y: this.bola.y, v: 9 } }, upd: () => true },
        { upd: () => { this.narra = this.v('zaga_cabeca', { a: n(zag()) }); return true } },
        { upd: () => { if (this.bola.voo) return false; const z = zag(); this.pega(z); return true } }, this.soltaTodos(),
        this.aPasse(zag, () => this.preferido(adv, ['MEI', 'ATA'], []), { alto: true, vel: 22, adiante: 6 }))
    } else if (r < 0.82) {
      // 🧤 recua pro goleiro e ele sai jogando
      const gk = this.gk(l), z = this.preferido(l, ['DEF', 'LAT'], [])
      ac.push(this.aPasse(dono, () => z, { adiante: -4 }), this.aPasse(() => z, () => gk, { adiante: 0, vel: 15 }),
        this.aNarra(gk.estilo === 'goleiro_linha' || this.tem(gk, 'saida_pes') ? this.v('goleiro_pes', { a: n(gk) }) : this.v('recua_goleiro', { a: n(gk) })),
        this.aEspera(0.6), this.aPasse(() => gk, () => this.preferido(l, ['LAT', 'DEF'], [], z), { adiante: 3 }), this.aPasse(() => this.bola.dono!, meia))
    } else if (r < 0.88) {
      // 🏃 lançamento longo pro atacante, o zagueiro chega antes
      const at = this.preferido(l, ['ATA'], ['velocista'])
      ac.push(this.aNarra(this.v('lancamento_longo', { a: n(at) })), this.aPasse(dono, () => at, { alto: true, vel: 21, adiante: 10 }), ...this.recuperaAcoes2(adv))
    } else {
      // 🎯 posse paciente: toca, toca e vira
      const a = meia(), b = this.preferido(l, ['DEF', 'MEI'], [], a), c = this.preferido(l, ['LAT'], [])
      ac.push(this.aNarra(this.v('posse', { a: l === 0 ? tt('time da casa', 'home side') : tt('visitante', 'visitors') })),
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
