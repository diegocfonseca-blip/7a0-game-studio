import { batedorDaVez, jeitoDoErro, ordemBatedores, sementePalco, sequenciaGuardada, sequenciaPenaltis, type CartaBatedor, type Cobranca } from './penaltis'
import type { Atleta } from './campo2d-motor'

// ─── 🥅 DISPUTA DE PÊNALTIS NO CAMPINHO 2D ────────────────────────────────────
// Apresentação da disputa JÁ DECIDIDA. Não sorteia nada, não muda placar, motor, atributos
// nem quem ganhou: só diz ONDE cada boneco, a bola e o árbitro aparecem em cada instante.
// Tudo sai do resultado que já existe (placar + sequência guardada + nomes), então dois
// aparelhos com o mesmo estado veem a MESMA cena (nenhum sorteio, nenhum relógio do aparelho).
//
// 🎬 07/11 (Diego: "igual disputa de verdade"), a coreografia:
//  · os jogadores de linha ficam PERFILADOS em cima do círculo central — cada time num
//    meio-círculo (casa à esquerda, visitante à direita), na ordem de cobrança: o 1º batedor
//    fica no alto (mais perto do gol), o último embaixo;
//  · o goleiro que não está defendendo espera FORA DA ÁREA, na lateral da grande área;
//  · o árbitro fica do lado da marca e AUTORIZA (apito) antes de cada batida; os dois
//    auxiliares ficam na linha do gol;
//  · o batedor sai do círculo POR DENTRO (pela abertura de cima), desce pelo SEU lado do
//    campo, ajeita a bola, recua, espera o apito, bate. Gol = festinha curta; defesa = o
//    goleiro comemora;
//  · a volta é POR FORA: ele sobe pela lateral do seu lado e entra na vaga por TRÁS da fila.
//    O caminho de ida (por dentro do círculo) e o de volta (por fora) nunca se cruzam, e os
//    dois times nunca atravessam o meio (x = 34): quem volta nunca tromba com o batedor do
//    outro time que já está indo. A trava `npm run penaltis-2d` mede a distância de todo
//    mundo, quadro a quadro.
//
// ⏱️ O RITMO: a cena é desenhada num relógio "natural" (caminhada de gente, ~5 m/s). Quando a
// tela tem um tempo FIXO pra disputa (a sala online e as copas com relógio no banco seguram o
// passo por `pensRevealDelay`), passa-se `orcamento` e a cena inteira é acelerada por igual
// pra caber nele — mesma forma, mesmo caminho, só mais rápido (e por isso continua sem cruzar
// ninguém). Sem `orcamento` (carreira offline, que espera a disputa acabar) vale o ritmo natural.

export const TEMPO_PENALTIS_CAMPO = {
  organizar: 3, caminhar: 10, ajeitar: .6, recuar: .8, apito: 1.3, correr: .7, voo: .6, festa: 1.2, passo: 9, encerrar: 2.5,
} as const
const T = TEMPO_PENALTIS_CAMPO
/** tempo (natural) entre uma batida e a seguinte */
export const PASSO_PENALTIS_CAMPO = T.passo
/** do pé na bola pra trás: chega na bola, ajeita, recua, espera o apito e corre */
const PREPARO = T.ajeitar + T.recuar + T.apito + T.correr
const APOS = T.voo + T.festa // depois disso o batedor volta e os goleiros trocam
const VEL_VOLTA = 5
type Ponto = { x: number; y: number }
type Lado = 0 | 1
const CX = 34, CY = 52.5
const MARCA: Ponto = { x: 34, y: 11 }
const GOL: Ponto = { x: 34, y: .6 }
// geometria do lado ESQUERDO (lado 0); o lado 1 é o espelho (x → 68 − x)
const R_FILA = 9.7, R_DENTRO = 6.6, R_FORA = 12.6, PHI_ABRE = 26, PHI_FECHA = 165, PHI_SAIDA = 8, PHI_ENTRA = 40
const DESCIDA: Ponto = { x: 30.5, y: 27 }
const CONTATO: Ponto = { x: 33.2, y: 12.5 }
const RECUO: Ponto = { x: 30.6, y: 15.9 }
const VOLTA1: Ponto = { x: 20, y: 15.5 }, VOLTA2: Ponto = { x: 17.5, y: 38 }
const ESPERA_GOLEIRO: Ponto = { x: 12.2, y: 15.5 } // fora da área, na lateral da grande área
// o goleiro que BATE (morte súbita longa) vai e volta pela beira da área, longe do árbitro que troca de lado pela frente da marca
const GOLEIRO_BEIRA: Ponto[] = [{ x: 27.5, y: 2.5 }, { x: 26.5, y: 9 }]
const JUIZ_LADO: Ponto = { x: 29.8, y: 9.6 } // o árbitro fica do lado OPOSTO ao de onde o batedor vem
export const AUXILIARES_PENALTIS: readonly Ponto[] = [{ x: 20.5, y: .2 }, { x: 47.5, y: .2 }]

const limitar = (n: number) => Math.max(0, Math.min(1, n))
const misturar = (a: Ponto, b: Ponto, t: number): Ponto => ({ x: a.x + (b.x - a.x) * limitar(t), y: a.y + (b.y - a.y) * limitar(t) })
const suave = (t: number) => { const k = limitar(t); return k * k * (3 - 2 * k) }
const espelho = (p: Ponto, lado: Lado): Ponto => (lado ? { x: 68 - p.x, y: p.y } : { x: p.x, y: p.y })
const arco = (r: number, phi: number, lado: Lado): Ponto => {
  const a = phi * Math.PI / 180
  return { x: CX + (lado ? 1 : -1) * r * Math.sin(a), y: CY - r * Math.cos(a) }
}
/** pontos ao longo de um arco (de phiDe até phiAte), pra ninguém cortar caminho por dentro de ninguém */
const pelaRoda = (r: number, phiDe: number, phiAte: number, lado: Lado): Ponto[] => {
  const n = Math.max(1, Math.ceil(Math.abs(phiAte - phiDe) / 10))
  return Array.from({ length: n + 1 }, (_, k) => arco(r, phiDe + (phiAte - phiDe) * k / n, lado))
}
const comprimento = (pts: Ponto[]) => pts.slice(1).reduce((s, p, i) => s + Math.hypot(p.x - pts[i].x, p.y - pts[i].y), 0)
function caminho(pontos: Ponto[], t: number): Ponto {
  const ds = pontos.slice(1).map((p, i) => Math.hypot(p.x - pontos[i].x, p.y - pontos[i].y))
  let sobra = limitar(t) * ds.reduce((a, b) => a + b, 0)
  for (let i = 0; i < ds.length; i++) {
    if (sobra <= ds[i]) return misturar(pontos[i], pontos[i + 1], ds[i] ? sobra / ds[i] : 1)
    sobra -= ds[i]
  }
  return pontos[pontos.length - 1]
}

/** Exatamente a reconstrução que o placar existente usa nos saves antigos.
 * Quando existe a sequência salva, ela tem precedência. */
export function sequenciaVisualPenaltis(pens: [number, number], aName: string, bName: string, seqReal?: string): Cobranca[] {
  let salt = 0
  for (const ch of aName + '|' + bName) salt = (salt * 31 + ch.charCodeAt(0)) >>> 0
  let seed = ((pens[0] * 31 + pens[1] * 7) ^ salt ^ 0xA1B2) >>> 0
  const rng = () => {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  return sequenciaGuardada(pens, seqReal) ?? sequenciaPenaltis(pens, rng)
}

export type ConfigPenaltisCampo = {
  id: string; pens: [number, number]; aName: string; bName: string; seqReal?: string
  aSquad?: CartaBatedor[]; bSquad?: CartaBatedor[]
  /** Na volta, A é visitante. A ordem oficial A/B nunca é invertida. */
  invertido?: boolean
  /** ⏱️ segundos que a tela dá pra disputa (sala online / relógio do banco). A cena acelera por igual pra caber. */
  orcamento?: number
  /** 👑 Kings: shootout em vez de pênalti (`campo2d-shootout.ts`) */
  shootout?: boolean
}
export type EstadoPenaltisCampo = {
  reveladas: number; encerrado: boolean; mensagem: string; mensagemEn: string
  fase: 'organizar' | 'caminhar' | 'preparar' | 'correr' | 'bola' | 'resultado' | 'encerrado'
  cobranca: number; batedor?: string; placar: [number, number]
}
export type QuadroPenaltisCampo = {
  jogadores: Ponto[]; bola: Ponto & { h: number }; juiz: Ponto
  batedor: number; goleiro: number; rede: { y0: number; t0: number } | null
  /** os dois auxiliares, parados na linha do gol */
  auxiliares: readonly Ponto[]
  /** o árbitro autorizando (apito) */
  apito: boolean
  /** quem está comemorando agora: o batedor no gol, o goleiro na defesa */
  comemora: { indice: number; tipo: 'gol' | 'defesa' } | null
  /** 🎬 o corte de câmera do começo: quanto da tela está escura (1 = preta, 0 = normal) */
  corte: number
}
type Trecho = { t0: number; t1: number; pts: Ponto[]; liso?: boolean }

// 🧭 07/11 (2º acerto): a ORGANIZAÇÃO não é mais "todo mundo andando em linha reta pro círculo ao mesmo tempo" — assim um
// passava por cima do outro. Agora a disputa abre com um CORTE DE CÂMERA, igual à TV (entre o fim da prorrogação e a 1ª
// cobrança a transmissão sempre corta): a tela escurece e clareia em CORTE_ORG segundos e, quando clareia, cada um já está
// PERTO do seu lugar — o jogador de linha no seu ponto de espera, num anel por fora da roda (R_ESPERA, na direção da sua vaga,
// 3,6 m entre vizinhos), o goleiro que defende no gol, o outro na lateral da área e o árbitro do lado da marca. Aí os dez de
// cada lado entram JUNTOS na fila, cada um em linha reta do ponto de espera pra vaga: linhas que apontam pro centro e só se
// aproximam até o espaçamento da fila (2,6 m) — ninguém cruza ninguém, por construção, em qualquer começo. Tentei antes um
// planejador de caminhos (um por vez, desviando): fechava ~70% das vezes e custava até 0,2 s de conta no celular.
const R_ESPERA = 14, CORTE_ORG = .7, ENTRA_DE = 1.1
export class DisputaPenaltisCampo {
  readonly seq: Cobranca[]
  /** quando a disputa termina (segundos de tela) — é aqui que sai o vencedor */
  readonly duracao: number
  /** quando o último batedor termina de voltar pra fila (a cena pode seguir um pouco depois do fim) */
  duracaoCena: number
  /** quanto a cena foi acelerada pra caber no orçamento (1 = ritmo natural) */
  readonly escala: number
  readonly times
  /** 👑 Kings: a disputa é de SHOOTOUT (sai do meio-campo, 5 s, tenta driblar o goleiro) — ver `campo2d-shootout.ts` */
  readonly shootout: boolean = false
  elapsed = 0
  preparado = false
  protected bolaInicial: Ponto = MARCA
  protected agenda: Trecho[][] = []
  protected inicio: Ponto[] = []
  protected ladoDe: Lado[] = []
  protected goleiros: [number, number] = [-1, -1]
  protected cobradores: number[] = []
  protected nomes: string[] = []
  protected seed: number
  protected naturalFim: number
  readonly config: ConfigPenaltisCampo

  constructor(config: ConfigPenaltisCampo) {
    this.config = config
    this.seq = sequenciaVisualPenaltis(config.pens, config.aName, config.bName, config.seqReal)
    this.naturalFim = this.contato(Math.max(0, this.seq.length - 1)) + T.voo + T.encerrar
    this.escala = config.orcamento && config.orcamento > 0 ? Math.min(1, config.orcamento / this.naturalFim) : 1
    this.duracao = this.naturalFim * this.escala
    this.duracaoCena = this.duracao
    this.times = [ordemBatedores(config.aSquad), ordemBatedores(config.bSquad)]
    this.seed = sementePalco(config.aName, config.bName, config.pens)
  }
  /** instante (natural) em que o pé encosta na bola na cobrança k */
  contato(k: number) { return T.organizar + T.caminhar + PREPARO + k * T.passo }
  protected get t() { return this.elapsed / this.escala }
  protected lado(side: Lado): Lado { return (this.config.invertido ? 1 - side : side) as Lado }
  protected ladoQueBate(k: number): Lado { return this.lado(this.seq[k].side) }
  protected vai(i: number, t0: number, t1: number, pts: Ponto[], liso = false) {
    const ag = this.agenda[i], ult = ag[ag.length - 1]
    const de = ult ? ult.pts[ult.pts.length - 1] : this.inicio[i]
    const ini = Math.max(t0, ult ? ult.t1 : 0)
    ag.push({ t0: ini, t1: Math.max(ini + 1e-3, t1), pts: [de, ...pts], liso })
  }
  protected posicao(i: number, t: number): Ponto {
    let p = this.inicio[i]
    for (const s of this.agenda[i]) {
      if (t < s.t0) return p
      if (t < s.t1) {
        const u = (t - s.t0) / (s.t1 - s.t0)
        return caminho(s.pts, s.liso ? suave(u) : u)
      }
      p = s.pts[s.pts.length - 1]
    }
    return p
  }
  private mergulho(k: number): Ponto {
    const c = this.seq[k], sinal = k % 2 ? -1 : 1
    return { x: 34 + sinal * (c.ok ? -2.5 : jeitoDoErro(this.seed, k) === 'defendeu' ? 2.5 : 2), y: .6 }
  }
  private fimBola(k: number): Ponto & { h: number } {
    const c = this.seq[k], sinal = k % 2 ? -1 : 1, erro = jeitoDoErro(this.seed, k)
    if (c.ok) return { x: 34 + sinal * 2.8, y: -1.55, h: 0 }
    if (erro === 'defendeu') return { ...this.mergulho(k), h: .3 }
    if (erro === 'trave' || erro === 'travessao') return { x: 34 + sinal * 5, y: 7, h: 0 }
    return { x: 34 + sinal * (erro === 'fora' ? 10 : 5.5), y: -4, h: 0 }
  }

  preparar(atletas: readonly Atleta[], bola: Ponto) {
    if (this.preparado) return
    const n = this.seq.length
    this.inicio = atletas.map(p => ({ x: p.x, y: p.y }))
    this.ladoDe = atletas.map(p => p.lado as Lado)
    this.nomes = atletas.map(p => p.nome)
    this.agenda = atletas.map(() => [])
    this.bolaInicial = { x: bola.x, y: bola.y }
    this.goleiros = [0, 1].map(l => atletas.findIndex(p => p.lado === l && p.grupo === 'GOL')) as [number, number]
    // quem bate cada cobrança (sem carta nominal, usa quem já está em campo; nunca cria jogador)
    const batidas = [0, 0]
    this.cobradores = this.seq.map(k => {
      const nb = batidas[k.side]++, nome = batedorDaVez(this.times[k.side], nb), l = this.lado(k.side)
      const indices = atletas.flatMap((p, i) => p.lado === l ? [i] : [])
      const encontrado = indices.find(i => atletas[i].nome === nome)
      const fila = [...indices.filter(i => atletas[i].grupo !== 'GOL'), ...indices.filter(i => atletas[i].grupo === 'GOL')]
      return encontrado ?? fila[nb % fila.length] ?? -1
    })
    // 🧍 a fila: cada time num meio-círculo, na ordem em que vai bater (o 1º lá em cima)
    const vaga = new Map<number, { pt: Ponto; phi: number }>()
    for (const l of [0, 1] as Lado[]) {
      const linha = atletas.flatMap((p, i) => p.lado === l && p.grupo !== 'GOL' ? [i] : [])
      const ordem = [...new Set(this.cobradores.filter(i => linha.includes(i)))]
      const todos = [...ordem, ...linha.filter(i => !ordem.includes(i))]
      todos.forEach((i, j) => {
        const phi = todos.length > 1 ? PHI_ABRE + j * (PHI_FECHA - PHI_ABRE) / (todos.length - 1) : PHI_ABRE
        vaga.set(i, { pt: arco(R_FILA, phi, l), phi })
      })
    }
    // 1) organizar: todo mundo pro seu lugar; o goleiro que defende a 1ª no gol, o outro esperando
    const defende = (k: number) => this.goleiros[1 - this.ladoQueBate(k)]
    // 🎬 o corte de câmera: quando a tela clareia, cada um já está perto do seu lugar (ver o comentário lá em cima)
    atletas.forEach((p, i) => {
      const l = p.lado as Lado, v = vaga.get(i)
      if (!v) { this.inicio[i] = n && i === defende(0) ? { ...GOL } : espelho(ESPERA_GOLEIRO, l); return }
      this.inicio[i] = arco(R_ESPERA, v.phi, l)
      // os dez de cada lado entram juntos na fila, em linha reta (cada um no seu raio)
      this.agenda[i].push({ t0: ENTRA_DE, t1: T.organizar, pts: [this.inicio[i], v.pt], liso: true })
    })
    this.bolaInicial = { ...MARCA }
    // 2) cada cobrança
    for (let k = 0; k < n; k++) {
      const C = this.contato(k), l = this.ladoQueBate(k), quem = this.cobradores[k]
      const contato = espelho(CONTATO, l), recuo = espelho(RECUO, l)
      if (quem >= 0) {
        const goleiro = this.goleiros.includes(quem)
        if (!goleiro) {
          // a ida, POR DENTRO do círculo e descendo pelo próprio lado
          const v = vaga.get(quem)!
          const ida = [...pelaRoda(R_DENTRO, v.phi, PHI_SAIDA, l), espelho(DESCIDA, l), contato]
          this.vai(quem, C - PREPARO - T.caminhar, C - PREPARO, ida)
        }
        // (o goleiro que bate já foi levado até a bola na troca de goleiros, abaixo)
        this.vai(quem, C - PREPARO + T.ajeitar, C - PREPARO + T.ajeitar + T.recuar, [recuo], true)
        this.vai(quem, C - T.correr, C, [contato], true)
        if (!goleiro) {
          // a volta, POR FORA: sobe pela lateral e entra na vaga por trás da fila
          const v = vaga.get(quem)!
          const volta = [espelho(VOLTA1, l), espelho(VOLTA2, l), ...pelaRoda(R_FORA, PHI_ENTRA, v.phi, l), v.pt]
          const ida = C + APOS, dur = comprimento([contato, ...volta]) / VEL_VOLTA
          this.vai(quem, ida, ida + dur, volta)
        }
      }
      // os goleiros: o que defende mergulha; depois da batida, troca
      const d = defende(k)
      if (d >= 0) this.vai(d, C, C + T.voo, [this.mergulho(k)])
      if (k + 1 < n) {
        const ini = C + APOS, fimTroca = this.contato(k + 1) - T.apito - T.correr + .2
        const proxDefende = defende(k + 1), proxBate = this.cobradores[k + 1]
        if (d >= 0 && d !== proxDefende) {
          const ld = this.ladoDe[d]
          if (d === proxBate) this.vai(d, ini, this.contato(k + 1) - PREPARO, [...GOLEIRO_BEIRA.map(p => espelho(p, ld)), espelho(CONTATO, ld)])
          else this.vai(d, ini, fimTroca, [espelho(ESPERA_GOLEIRO, ld)])
        }
        if (proxDefende >= 0 && proxDefende !== d) {
          // quem entra no gol: da espera (ou da bola, se foi ele que acabou de bater)
          if (proxDefende === quem) this.vai(proxDefende, ini, fimTroca, [...[...GOLEIRO_BEIRA].reverse().map(p => espelho(p, this.ladoDe[proxDefende])), GOL])
          else this.vai(proxDefende, ini, fimTroca, [GOL])
        } else if (proxDefende >= 0) this.vai(proxDefende, ini, fimTroca, [GOL])
      }
    }
    const fimNatural = Math.max(this.naturalFim, ...this.agenda.flatMap(a => a.map(s => s.t1)))
    this.duracaoCena = fimNatural * this.escala
    this.preparado = true
  }
  /** `semCampo`: o campinho não apareceu (aba escondida, tela que não desenha) — o relógio anda mesmo assim, pra o quadro das
   *  bolinhas e quem espera o fim da disputa nunca ficarem presos */
  avancar(segundos: number, velocidade = 1, pausado = false, semCampo = false) {
    if ((!this.preparado && !semCampo) || pausado || this.elapsed >= this.duracaoCena) return
    this.elapsed = Math.min(this.duracaoCena, this.elapsed + Math.max(0, segundos) * Math.max(.25, Math.min(4, velocidade)))
  }
  /** a cobrança "da vez" no instante natural t */
  protected daVez(t: number) {
    for (let k = 0; k < this.seq.length; k++) if (t < this.contato(k) + APOS) return k
    return this.seq.length - 1
  }
  get estado(): EstadoPenaltisCampo {
    const t = this.t, n = this.seq.length
    const i = Math.max(0, this.daVez(t))
    const encerrado = this.elapsed >= this.duracao
    const reveladas = this.seq.filter((_, k) => t >= this.contato(k) + T.voo).length
    const placar: [number, number] = [0, 0]
    this.seq.slice(0, reveladas).forEach(k => { if (k.ok) placar[k.side]++ })
    const batedor = this.nomes[this.cobradores[i]] || undefined
    const nome = batedor || 'O cobrador', en = batedor || 'The taker'
    const C = n ? this.contato(i) : 0
    let fase: EstadoPenaltisCampo['fase'], mensagem: string, mensagemEn: string
    if (encerrado) { fase = 'encerrado'; mensagem = 'Disputa encerrada'; mensagemEn = 'Shoot-out complete' }
    else if (t < T.organizar) { fase = 'organizar'; mensagem = 'Pênaltis: os times se perfilam no círculo central'; mensagemEn = 'Penalties: both teams line up in the centre circle' }
    else if (t < C - PREPARO) { fase = 'caminhar'; mensagem = `${nome} caminha para a cobrança`; mensagemEn = `${en} walks to the penalty spot` }
    else if (t < C - T.apito - T.correr) { fase = 'preparar'; mensagem = `${nome} ajeita a bola na marca`; mensagemEn = `${en} places the ball on the spot` }
    else if (t < C - T.correr) { fase = 'preparar'; mensagem = `${nome} se prepara… aguarda o árbitro`; mensagemEn = `${en} gets ready… waiting for the referee` }
    else if (t < C) { fase = 'correr'; mensagem = `Apito! ${nome} vai para a bola`; mensagemEn = `Whistle! ${en} starts the run-up` }
    else if (t < C + T.voo) { fase = 'bola'; mensagem = `${nome} bateu!`; mensagemEn = `${en} shoots!` }
    else {
      fase = 'resultado'
      const erro = jeitoDoErro(this.seed, i)
      const pt = { defendeu: 'DEFENDEU!', fora: 'PRA FORA!', isolou: 'POR CIMA!', trave: 'NA TRAVE!', travessao: 'NO TRAVESSÃO!' }
      const ingles = { defendeu: 'SAVED!', fora: 'WIDE!', isolou: 'OVER!', trave: 'OFF THE POST!', travessao: 'OFF THE BAR!' }
      mensagem = `${this.seq[i]?.ok ? 'GOL!' : pt[erro]} · ${nome}`
      mensagemEn = `${this.seq[i]?.ok ? 'GOAL!' : ingles[erro]} · ${en}`
    }
    return { reveladas, encerrado, mensagem, mensagemEn, fase, cobranca: i, batedor, placar }
  }
  quadro(): QuadroPenaltisCampo | null {
    if (!this.preparado || !this.seq.length) return null
    const t = this.t, i = this.daVez(t), k = this.seq[i]
    const jogadores = this.inicio.map((_, n) => this.posicao(n, t))
    const C = this.contato(i), l = this.ladoQueBate(i)
    const goleiro = this.goleiros[1 - l]
    const lugarJuiz = (q: number) => espelho(JUIZ_LADO, (1 - this.ladoQueBate(q)) as Lado)
    // ⚽ a bola: vai pra marca na organização; voa na batida; fica um pouco onde parou; volta pra marca
    let bola: Ponto & { h: number } = { ...MARCA, h: 0 }
    let rede: QuadroPenaltisCampo['rede'] = null
    let juiz = lugarJuiz(i)
    if (t < T.organizar) {
      const u = suave(t / T.organizar)
      bola = { ...misturar(this.bolaInicial, MARCA, u), h: 0 }
      juiz = lugarJuiz(0)
    } else {
      const ant = t < C - PREPARO ? i - 1 : -1 // a cobrança anterior ainda "está na tela"?
      if (ant >= 0) {
        const Ca = this.contato(ant), desde = t - (Ca + APOS), u = suave(desde / (PREPARO * .55 + 1))
        const fim = this.fimBola(ant)
        bola = desde < 0 ? { ...fim } : { ...misturar(fim, MARCA, u), h: fim.h * (1 - u) }
        // o árbitro troca de lado pela frente da marca (bem longe de quem está voltando)
        const de = lugarJuiz(ant), para = lugarJuiz(i)
        juiz = desde < 0 ? de : de.x === para.x ? para : caminho([de, { x: de.x < 34 ? 32 : 36, y: 8 }, { x: para.x < 34 ? 32 : 36, y: 8 }, para], suave(desde / (PREPARO * .55 + 1)))
        if (this.seq[ant].ok && desde < 0) rede = { y0: 0, t0: (Ca + T.voo) * this.escala }
      }
      if (t >= C) {
        const sinal = i % 2 ? -1 : 1, erro = jeitoDoErro(this.seed, i)
        const alvo = { x: 34 + sinal * (k.ok || erro === 'defendeu' ? 2.8 : erro === 'trave' ? 3.66 : erro === 'fora' ? 6 : 1.5), y: 0 }
        const alt = !k.ok && erro === 'isolou' ? 3.8 : !k.ok && erro === 'travessao' ? 2.44 : .3
        const u = limitar((t - C) / T.voo)
        bola = { ...misturar(MARCA, alvo, u), h: alt * Math.sin(u * Math.PI / 2) }
        if (u >= 1) {
          const depois = t - C - T.voo, mg = this.mergulho(i)
          if (k.ok) { bola = { x: alvo.x, y: -Math.min(1.55, depois * 10), h: Math.max(0, alt - depois) }; rede = { y0: 0, t0: (C + T.voo) * this.escala } }
          else if (erro === 'defendeu') bola = { x: mg.x, y: mg.y, h: .3 }
          else if (erro === 'trave' || erro === 'travessao') bola = { ...misturar(alvo, { x: 34 + sinal * 5, y: 7 }, Math.min(1, depois / 1.4)), h: Math.max(0, alt - depois * 3) }
          else bola = { x: alvo.x + sinal * Math.min(4, depois * 3), y: -Math.min(4, depois * 6), h: Math.max(0, alt - depois * 2) }
        }
      }
    }
    const batedor = this.cobradores[i] ?? -1
    const apito = t >= C - T.apito - T.correr + .3 && t < C - .15 // o braço/apito fica até o pé chegar na bola
    let comemora: QuadroPenaltisCampo['comemora'] = null
    if (t >= C + T.voo && t < C + APOS) {
      if (k.ok && batedor >= 0) comemora = { indice: batedor, tipo: 'gol' }
      else if (!k.ok && jeitoDoErro(this.seed, i) === 'defendeu' && goleiro >= 0) comemora = { indice: goleiro, tipo: 'defesa' }
    }
    const corte = t < CORTE_ORG ? 1 - t / CORTE_ORG : 0
    return { jogadores, bola, juiz, batedor, goleiro, rede, auxiliares: AUXILIARES_PENALTIS, apito, comemora, corte }
  }
}
