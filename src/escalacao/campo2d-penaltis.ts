import { batedorDaVez, jeitoDoErro, ordemBatedores, sementePalco, sequenciaGuardada, sequenciaPenaltis, type CartaBatedor, type Cobranca } from './penaltis'
import type { Atleta } from './campo2d-motor'

/** Apresentação da disputa já decidida. Não sorteia resultado, altera atletas,
 * placar regulamentar, atributos ou o motor das jogadas. A cidade lê este mesmo quadro. */
export const TEMPO_PENALTIS_CAMPO = { organizar: 14, caminhar: 16, preparar: 2.3, correr: .8, voo: .65, resultado: 2.25, encerrar: 2.5 } as const
const T = TEMPO_PENALTIS_CAMPO
export const PASSO_PENALTIS_CAMPO = T.caminhar + T.preparar + T.correr + T.voo + T.resultado
const IMPACTO = T.caminhar + T.preparar + T.correr
const VEREDITO = IMPACTO + T.voo
type Ponto = { x: number; y: number }
type Lado = 0 | 1
const marca = { x: 34, y: 11 }, espera = { x: 44, y: .7 }, gol = { x: 34, y: .6 }
const preparo = { x: 36, y: 15 }, contato = { x: 34, y: 13 }
const limitar = (n: number) => Math.max(0, Math.min(1, n))
const misturar = (a: Ponto, b: Ponto, t: number): Ponto => ({ x: a.x + (b.x - a.x) * limitar(t), y: a.y + (b.y - a.y) * limitar(t) })
const suave = (t: number) => { const k = limitar(t); return k * k * (3 - 2 * k) }
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
}
export type EstadoPenaltisCampo = {
  reveladas: number; encerrado: boolean; mensagem: string; mensagemEn: string
  fase: 'organizar' | 'caminhar' | 'preparar' | 'correr' | 'bola' | 'resultado' | 'encerrado'
  cobranca: number; batedor?: string; placar: [number, number]
}
export type QuadroPenaltisCampo = {
  jogadores: Ponto[]; bola: Ponto & { h: number }; juiz: Ponto
  batedor: number; goleiro: number; rede: { y0: number; t0: number } | null
}

export class DisputaPenaltisCampo {
  readonly seq: Cobranca[]
  readonly duracao: number
  readonly times
  elapsed = 0
  preparado = false
  private inicio: Ponto[] = []
  private bolaInicial: Ponto = marca
  private lugares: Ponto[] = []
  private goleiros: number[] = []
  private cobradores: number[] = []
  private nomes: string[] = []
  private seed: number
  readonly config: ConfigPenaltisCampo

  constructor(config: ConfigPenaltisCampo) {
    this.config = config
    this.seq = sequenciaVisualPenaltis(config.pens, config.aName, config.bName, config.seqReal)
    this.duracao = T.organizar + this.seq.length * PASSO_PENALTIS_CAMPO + T.encerrar
    this.times = [ordemBatedores(config.aSquad), ordemBatedores(config.bSquad)]
    this.seed = sementePalco(config.aName, config.bName, config.pens)
  }
  private lado(side: Lado): Lado { return (this.config.invertido ? 1 - side : side) as Lado }
  preparar(atletas: readonly Atleta[], bola: Ponto) {
    if (this.preparado) return
    this.inicio = atletas.map(p => ({ x: p.x, y: p.y }))
    this.bolaInicial = { x: bola.x, y: bola.y }
    this.nomes = atletas.map(p => p.nome)
    this.goleiros = [0, 1].map(side => atletas.findIndex(p => p.lado === this.lado(side as Lado) && p.grupo === 'GOL'))
    // Dois grupos separados, dentro do círculo central. O cobrador deixa sua vaga livre.
    const contagem = [0, 0]
    this.lugares = atletas.map(p => {
      const i = contagem[p.lado]++
      if (p.grupo === 'GOL') { contagem[p.lado]--; return espera }
      return { x: (p.lado === 0 ? 28.2 : 36.6) + (i % 2) * 3.2, y: 46.1 + Math.floor(i / 2) * 3.2 }
    })
    const batidas = [0, 0]
    this.cobradores = this.seq.map(k => {
      const n = batidas[k.side]++, nome = batedorDaVez(this.times[k.side], n)
      const indices = atletas.flatMap((p, i) => p.lado === this.lado(k.side) ? [i] : [])
      const encontrado = indices.find(i => atletas[i].nome === nome)
      // Sem carta nominal (save antigo), usa um atleta já em campo; nunca cria jogador.
      const fila = [...indices.filter(i => atletas[i].grupo !== 'GOL'), ...indices.filter(i => atletas[i].grupo === 'GOL')]
      return encontrado ?? fila[n % fila.length] ?? -1
    })
    this.preparado = true
  }
  avancar(segundos: number, velocidade = 1, pausado = false) {
    if (!this.preparado || pausado || this.elapsed >= this.duracao) return
    this.elapsed = Math.min(this.duracao, this.elapsed + Math.max(0, segundos) * Math.max(.25, Math.min(4, velocidade)))
  }
  get estado(): EstadoPenaltisCampo {
    const desde = Math.max(0, this.elapsed - T.organizar)
    const i = Math.min(this.seq.length - 1, Math.floor(desde / PASSO_PENALTIS_CAMPO))
    const dentro = desde - i * PASSO_PENALTIS_CAMPO
    const encerrado = this.elapsed >= this.duracao
    const reveladas = this.seq.filter((_, k) => this.elapsed >= T.organizar + k * PASSO_PENALTIS_CAMPO + VEREDITO).length
    const placar: [number, number] = [0, 0]
    this.seq.slice(0, reveladas).forEach(k => { if (k.ok) placar[k.side]++ })
    const batedor = this.nomes[this.cobradores[i]] || undefined
    const nome = batedor || 'O cobrador', en = batedor || 'The taker'
    let fase: EstadoPenaltisCampo['fase'], mensagem: string, mensagemEn: string
    if (encerrado) { fase = 'encerrado'; mensagem = 'Disputa encerrada'; mensagemEn = 'Shoot-out complete' }
    else if (this.elapsed < T.organizar) { fase = 'organizar'; mensagem = 'Pênaltis: equipes se organizando no meio-campo'; mensagemEn = 'Penalties: teams gathering at the centre circle' }
    else if (dentro < T.caminhar) { fase = 'caminhar'; mensagem = `${nome} caminha para a cobrança`; mensagemEn = `${en} walks to the penalty spot` }
    else if (dentro < T.caminhar + T.preparar) { fase = 'preparar'; mensagem = `${nome} se prepara… aguarda o árbitro`; mensagemEn = `${en} prepares… waiting for the referee` }
    else if (dentro < IMPACTO) { fase = 'correr'; mensagem = `Autorizado! ${nome} vai para a bola`; mensagemEn = `Whistle! ${en} starts the run-up` }
    else if (dentro < VEREDITO) { fase = 'bola'; mensagem = `${nome} bateu!`; mensagemEn = `${en} shoots!` }
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
  private fimGoleiro(i: number) {
    const k = this.seq[i], sinal = i % 2 ? -1 : 1
    return { x: 34 + sinal * (k.ok ? -2.8 : jeitoDoErro(this.seed, i) === 'defendeu' ? 2.8 : 2), y: .6 }
  }
  private fimBola(i: number): Ponto & { h: number } {
    const k = this.seq[i], sinal = i % 2 ? -1 : 1, erro = jeitoDoErro(this.seed, i)
    if (k.ok) return { x: 34 + sinal * 2.8, y: -1.55, h: 0 }
    if (erro === 'defendeu') return { ...this.fimGoleiro(i), h: .3 }
    if (erro === 'trave' || erro === 'travessao') return { x: 34 + sinal * 5, y: 7, h: 0 }
    return { x: 34 + sinal * (erro === 'fora' ? 10 : 5.5), y: -4, h: 0 }
  }
  quadro(): QuadroPenaltisCampo | null {
    if (!this.preparado) return null
    const i = this.estado.cobranca, k = this.seq[i]
    if (!k) return null
    const t = this.elapsed - T.organizar - i * PASSO_PENALTIS_CAMPO
    const jogadores = this.lugares.map(p => ({ ...p }))
    const batedor = this.cobradores[i], goleiro = this.goleiros[1 - k.side], goleiroBate = this.goleiros[k.side]
    const dar = (indice: number, p: Ponto) => { if (indice >= 0) jogadores[indice] = p }
    dar(goleiro, gol); dar(goleiroBate, espera)
    let bola: Ponto & { h: number } = { ...marca, h: 0 }, juiz = { x: 25, y: 10 }
    let rede: QuadroPenaltisCampo['rede'] = null
    if (this.elapsed < T.organizar) {
      const u = suave(this.elapsed / T.organizar)
      jogadores.forEach((p, n) => { jogadores[n] = misturar(this.inicio[n], p, u) })
      bola = { ...misturar(this.bolaInicial, marca, u), h: 0 }
      juiz = misturar(bola, { x: 25, y: 10 }, suave((this.elapsed / T.organizar - .8) * 5))
      return { jogadores, bola, juiz, batedor: -1, goleiro, rede }
    }
    // Os goleiros trocam de lugar andando, sem atravessar o cobrador nem a trave.
    if (i > 0 && t < 5) {
      const fimGK = this.fimGoleiro(i - 1)
      const inicioGK = this.cobradores[i - 1] === goleiro ? { x: 33.6, y: 12.3 } : espera
      const entrada = this.cobradores[i - 1] === goleiro ? [inicioGK, { x: 26, y: 12.3 }, { x: 26, y: .6 }, gol] : [inicioGK, gol]
      dar(goleiro, caminho(entrada, t / 5))
      dar(goleiroBate, caminho([fimGK, { x: fimGK.x, y: 8 }, { x: 44, y: 8 }, espera], t / 5))
    }
    // Quem acabou de bater volta por fora; o próximo usa outra faixa para chegar.
    if (i > 0 && t < T.caminhar) {
      const anterior = this.cobradores[i - 1]
      if (anterior !== batedor && !this.goleiros.includes(anterior)) {
        const lugar = this.lugares[anterior]
        const externo = lugar.x < 34 ? 24.8 : 43.2
        const entrada = Math.abs(lugar.x - 34) < 3.5 ? 34 : externo
        dar(anterior, caminho([{ x: 33.6, y: 12.3 }, { x: 22, y: 19 }, { x: 22, y: 64 }, { x: entrada, y: 64 }, { x: entrada, y: lugar.y }, lugar], t / T.caminhar))
      }
    }
    if (batedor >= 0) {
      const ehGoleiro = this.goleiros.includes(batedor)
      const partida = ehGoleiro ? (i > 0 ? this.fimGoleiro(i - 1) : espera) : this.lugares[batedor]
      const interno = Math.abs(partida.x - 34) < 3.5
      const saida = interno ? 34 : partida.x < 34 ? 24.8 : 43.2
      const trajeto = ehGoleiro ? [partida, { x: partida.x, y: 9 }, { x: 43, y: 9 }, preparo]
        : [partida, { x: saida, y: partida.y }, { x: saida, y: 40 }, { x: 43, y: 19 }, preparo]
      const pos = t < T.caminhar ? caminho(trajeto, t / T.caminhar)
        : t < T.caminhar + T.preparar ? preparo
          : t < IMPACTO ? misturar(preparo, contato, suave((t - T.caminhar - T.preparar) / T.correr))
            : misturar(contato, { x: 33.6, y: 12.3 }, suave((t - IMPACTO) / .5))
      dar(batedor, pos)
    }
    if (i > 0 && t < 3.5) {
      // Bola morta: devolvida à marca antes da preparação, sem salto no desenho.
      const anterior = this.fimBola(i - 1), u = suave(t / 3.5)
      bola = { ...misturar(anterior, marca, u), h: anterior.h * (1 - u) }
      juiz = { ...bola }
    } else if (i > 0 && t < 6) juiz = misturar(marca, juiz, suave((t - 3.5) / 2.5))
    if (t >= IMPACTO) {
      const sinal = i % 2 ? -1 : 1, erro = jeitoDoErro(this.seed, i)
      const alvo = { x: 34 + sinal * (k.ok || erro === 'defendeu' ? 2.8 : erro === 'trave' ? 3.66 : erro === 'fora' ? 6 : 1.5), y: 0 }
      const alt = !k.ok && erro === 'isolou' ? 3.8 : !k.ok && erro === 'travessao' ? 2.44 : .3
      const u = limitar((t - IMPACTO) / T.voo)
      bola = { ...misturar(marca, alvo, u), h: alt * Math.sin(u * Math.PI / 2) }
      const gkX = 34 + sinal * (k.ok ? -2.8 : erro === 'defendeu' ? 2.8 : 2)
      dar(goleiro, { x: 34 + (gkX - 34) * suave((t - IMPACTO) / T.voo), y: .6 })
      if (u >= 1) {
        const depois = t - VEREDITO
        if (k.ok) {
          bola = { x: alvo.x, y: -Math.min(1.55, depois * 10), h: Math.max(0, alt - depois) }
          rede = { y0: 0, t0: T.organizar + i * PASSO_PENALTIS_CAMPO + VEREDITO }
        } else if (erro === 'defendeu') bola = { x: gkX, y: .6, h: .3 }
        else if (erro === 'trave' || erro === 'travessao') bola = { ...misturar(alvo, { x: 34 + sinal * 5, y: 7 }, Math.min(1, depois / 1.4)), h: Math.max(0, alt - depois * 3) }
        else bola = { x: alvo.x + sinal * Math.min(4, depois * 3), y: -Math.min(4, depois * 6), h: Math.max(0, alt - depois * 2) }
      }
    }
    if (i < this.seq.length - 1 && t >= VEREDITO) juiz = misturar({ x: 25, y: 10 }, this.fimBola(i), suave((t - VEREDITO) / T.resultado))
    // Reposição é uma bola parada entre cobranças; ocorre durante a caminhada seguinte.
    // Após a última, a cena fica no resultado até a carreira liberar a próxima fase.
    return { jogadores, bola, juiz, batedor, goleiro, rede }
  }
}
