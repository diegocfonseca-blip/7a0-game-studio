import { DisputaPenaltisCampo, AUXILIARES_PENALTIS, type ConfigPenaltisCampo, type EstadoPenaltisCampo, type QuadroPenaltisCampo } from './campo2d-penaltis'
import { batedorDaVez, jeitoDoErro } from './penaltis'
import type { Atleta } from './campo2d-motor'

// ─── 👑🥅 SHOOTOUT DA KINGS NO CAMPINHO 2D (11/11) ─────────────────────────────────────────────────────────────────────
// Diego: *"igual antes eram pênaltis no modo normal, esse é shootout que o bicho vai tentar driblar o goleiro… ao invés de bater
// ele sai lá de trás com a bola do meio-campo e vai levando, tentando driblar o goleiro… se o goleiro der uma encostada na bola
// já era o atacante… e depois segue o outro jogador do outro time"*. A regra que ele mandou (Kings League):
//  · 5 cobranças alternadas por time; empatou, morte súbita;
//  · o atacante sai com a bola do CÍRCULO CENTRAL e tem 5 s pra finalizar, sempre indo pra frente;
//  · o goleiro começa EM CIMA da linha e só sai depois do apito;
//  · todo o resto fica FORA do campo de jogo, atrás da linha do meio, olhando;
//  · ninguém repete antes de todos do elenco (goleiro incluído) cobrarem — é o `batedorDaVez` de sempre (a linha toda, depois o goleiro).
// Igual à disputa de pênaltis: só APRESENTAÇÃO da disputa já decidida (placar e sequência guardados) — não sorteia nada.
// Todo mundo ataca o MESMO gol (o de cima, y ≈ 0), como no pênalti. O lado 1 é o espelho (x → 68 − x).

type Ponto = { x: number; y: number }
type Lado = 0 | 1
const S = { organizar: 2.6, ida: 2.4, apito: 1, corrida: 3.4, voo: .55, festa: 1.3, passo: 9, encerrar: 2.5 } as const
/** do apito ao pé na bola: o 5 s da regra (a corrida até finalizar cabe dentro) */
const ANTES = S.apito + S.corrida
const APOS = S.voo + S.festa
const VEL_VOLTA = 6.5
const MEIO: Ponto = { x: 34, y: 52.5 }
const GOL: Ponto = { x: 34, y: .6 }
const JUIZ: Ponto = { x: 27.5, y: 50.5 }
const espelho = (p: Ponto, l: Lado): Ponto => (l ? { x: 68 - p.x, y: p.y } : { x: p.x, y: p.y })
const limitar = (n: number) => Math.max(0, Math.min(1, n))
const misturar = (a: Ponto, b: Ponto, t: number): Ponto => ({ x: a.x + (b.x - a.x) * limitar(t), y: a.y + (b.y - a.y) * limitar(t) })
const suave = (t: number) => { const k = limitar(t); return k * k * (3 - 2 * k) }
/** onde cada um espera: atrás da linha do meio, perto da lateral do SEU lado (fila de cima pra baixo) */
const espera = (j: number, l: Lado): Ponto => espelho({ x: 5 + (j % 2) * 3.2, y: 58 + Math.floor(j / 2) * 3.4 + (j % 2) * 1.7 }, l)
// o goleiro que não defende espera AO LADO do gol, do seu lado (a troca é rápida e os dois nunca se cruzam)
const ESPERA_GOLEIRO: Ponto = { x: 13, y: 2.2 }

/** o jeito de cada cobrança (fixo pela semente): gol driblando, gol chutando; erro = goleiro tocou, pra fora, por cima, na trave */
type Jeito = 'drible' | 'chute' | 'defendeu' | 'fora' | 'isolou' | 'trave'

export class DisputaShootoutCampo extends DisputaPenaltisCampo {
  override readonly shootout = true
  constructor(config: ConfigPenaltisCampo) { super(config) }
  /** instante (natural) em que ele finaliza (ou o goleiro chega na bola) na cobrança k */
  override contato(k: number) { return S.organizar + S.ida + ANTES + k * S.passo }
  protected override daVez(t: number) {
    for (let k = 0; k < this.seq.length; k++) if (t < this.contato(k) + APOS) return k
    return this.seq.length - 1
  }
  private jeito(k: number): Jeito {
    const c = this.seq[k]
    if (c.ok) return ((this.seed >>> (k % 24)) & 3) === 0 ? 'chute' : 'drible' // ~3 em 4 gols saem driblando o goleiro
    const e = jeitoDoErro(this.seed, k)
    return e === 'travessao' ? 'trave' : e
  }
  /** o lado pra onde ele vai (−1 esquerda · +1 direita), fixo por cobrança */
  private sinal(k: number) { return ((this.seed >>> ((k * 3) % 29)) & 1) ? 1 : -1 }
  /** o caminho do atacante do meio-campo até finalizar (pontos no lado 0; o espelho acontece no fim) */
  private corrida(k: number): Ponto[] {
    const s = this.sinal(k), j = this.jeito(k)
    if (j === 'drible') return [MEIO, { x: 34 + s * 3, y: 30 }, { x: 34 + s * 1.5, y: 14 }, { x: 34 + s * 7, y: 6.5 }, { x: 34 + s * 3, y: 2.2 }]
    if (j === 'defendeu') return [MEIO, { x: 34 + s * 3, y: 30 }, { x: 34 + s * 1.5, y: 13 }, { x: 34 + s * 1, y: 8.6 }]
    return [MEIO, { x: 34 + s * 3, y: 30 }, { x: 34 + s * 4, y: 15 }]
  }
  /** o goleiro: em cima da linha até o apito, depois sai pra fechar o ângulo */
  private saidaGoleiro(k: number): Ponto[] {
    const s = this.sinal(k), j = this.jeito(k)
    if (j === 'drible') return [GOL, { x: 34 + s * .5, y: 7.2 }, { x: 34 - s * 1.5, y: 5.6 }] // vai na bola e o atacante passa por ele
    if (j === 'defendeu') return [GOL, { x: 34 + s * .6, y: 7.8 }, { x: 34 + s * 1, y: 8.3 }] // chega primeiro e ENCOSTA na bola
    if (j === 'chute') return [GOL, { x: 34 + s * 1, y: 5 }, { x: 34 - s * 2.4, y: 1.4 }] // sai e é encoberto pelo chute
    return [GOL, { x: 34 + s * 1.2, y: 5.5 }]
  }
  private fimBolaSh(k: number): Ponto & { h: number } {
    const s = this.sinal(k), j = this.jeito(k)
    if (j === 'drible') return { x: 34 + s * 2, y: -1.4, h: 0 }
    if (j === 'chute') return { x: 34 + s * 2.6, y: -1.5, h: .4 }
    if (j === 'defendeu') return { x: 34 + s * 9, y: 13, h: 0 } // o goleiro encostou: a bola sai pro lado
    if (j === 'trave') return { x: 34 + s * 6.5, y: 8, h: 0 }
    return { x: 34 + s * (j === 'fora' ? 9 : 4), y: -4, h: 0 }
  }

  override preparar(atletas: readonly Atleta[], bola: Ponto) {
    if (this.preparado) return
    const n = this.seq.length
    this.inicio = atletas.map(p => ({ x: p.x, y: p.y }))
    this.ladoDe = atletas.map(p => p.lado as Lado)
    this.nomes = atletas.map(p => p.nome)
    this.agenda = atletas.map(() => [])
    this.bolaInicial = { x: bola.x, y: bola.y }
    this.goleiros = [0, 1].map(l => atletas.findIndex(p => p.lado === l && p.grupo === 'GOL')) as [number, number]
    // quem bate (a linha toda, depois o goleiro — ninguém repete antes de todos); sem carta nominal, quem está em campo
    const batidas = [0, 0]
    this.cobradores = this.seq.map(k => {
      const nb = batidas[k.side]++, nome = batedorDaVez(this.times[k.side], nb), l = this.lado(k.side)
      const indices = atletas.flatMap((p, i) => p.lado === l ? [i] : [])
      const encontrado = indices.find(i => atletas[i].nome === nome)
      const fila = [...indices.filter(i => atletas[i].grupo !== 'GOL'), ...indices.filter(i => atletas[i].grupo === 'GOL')]
      return encontrado ?? fila[nb % fila.length] ?? -1
    })
    // 🧍 a espera: cada um atrás do meio, do SEU lado; o goleiro que não defende também espera lá
    const lugar = new Map<number, Ponto>()
    for (const l of [0, 1] as Lado[]) {
      let j = 0
      atletas.forEach((p, i) => { if (p.lado === l && p.grupo !== 'GOL') lugar.set(i, espera(j++, l)) })
    }
    const defende = (k: number) => this.goleiros[1 - this.ladoQueBate(k)]
    atletas.forEach((p, i) => {
      const l = p.lado as Lado
      if (p.grupo === 'GOL') { this.inicio[i] = n && i === defende(0) ? { ...GOL } : espelho(ESPERA_GOLEIRO, l); lugar.set(i, espelho(ESPERA_GOLEIRO, l)); return }
      this.inicio[i] = lugar.get(i) ?? espera(0, l)
    })
    this.bolaInicial = { ...MEIO }
    for (let k = 0; k < n; k++) {
      const C = this.contato(k), l = this.ladoQueBate(k), quem = this.cobradores[k]
      const chega = C - ANTES, apito = C - S.corrida // chega na bola, espera 1 s o apito e aí tem os 5 s
      if (quem >= 0) {
        const casa = lugar.get(quem) ?? espelho(ESPERA_GOLEIRO, this.ladoDe[quem])
        // a ida: da espera até a bola no círculo central (o goleiro que bate também vem de onde estava)
        this.vai(quem, chega - S.ida, chega - .15, [espelho({ x: 33, y: 54.5 }, l), MEIO], true)
        // a corrida com a bola: 5 s pra frente, até finalizar
        this.vai(quem, apito, C, this.corrida(k).slice(1).map(p => espelho(p, l)))
        // a volta pra espera, por fora (pela lateral do seu lado)
        const fim = espelho(this.corrida(k)[this.corrida(k).length - 1], l)
        // (morte súbita longa: o GOLEIRO que acabou de bater defende a próxima — vai direto pro gol, antes do apito)
        if (k + 1 < n && quem === defende(k + 1)) this.vai(quem, C + APOS, this.contato(k + 1) - ANTES - .3, [GOL], true)
        else {
          const volta = [espelho({ x: 10, y: 20 }, l), casa]
          const dur = (Math.hypot(volta[0].x - fim.x, volta[0].y - fim.y) + Math.hypot(casa.x - volta[0].x, casa.y - volta[0].y)) / VEL_VOLTA
          this.vai(quem, C + APOS, C + APOS + dur, volta)
        }
      }
      // o goleiro que defende: na linha até o apito; sai na corrida
      const d = defende(k)
      if (d >= 0) this.vai(d, apito + .35, C, this.saidaGoleiro(k).slice(1).map(p => espelho(p, l)))
      // a troca de goleiro pra próxima (as cobranças alternam, então o goleiro sempre troca): quem defendeu vai esperar ao lado do
      // gol, do SEU lado; o outro entra do lado dele — e tem que estar na linha ANTES do apito seguinte
      const ini = C + APOS + .1, naLinha = (k + 1 < n ? this.contato(k + 1) - ANTES : C + APOS + 2.5) - .3
      if (d >= 0) this.vai(d, ini, Math.max(ini + 1, naLinha), [k + 1 < n && d !== defende(k + 1) ? espelho(ESPERA_GOLEIRO, this.ladoDe[d]) : GOL], true)
      if (k + 1 < n) {
        const prox = defende(k + 1)
        if (prox >= 0 && prox !== d && prox !== quem) this.vai(prox, ini, Math.max(ini + 1, naLinha), [GOL], true)
      }
    }
    const fimNatural = Math.max(this.contato(Math.max(0, n - 1)) + S.voo + S.encerrar, ...this.agenda.flatMap(a => a.map(s => s.t1)))
    this.duracaoCena = fimNatural * this.escala
    this.preparado = true
  }

  override get estado(): EstadoPenaltisCampo {
    const t = this.t, n = this.seq.length
    const i = Math.max(0, this.daVez(t))
    const encerrado = this.elapsed >= this.duracao
    const reveladas = this.seq.filter((_, k) => t >= this.contato(k) + S.voo).length
    const placar: [number, number] = [0, 0]
    this.seq.slice(0, reveladas).forEach(k => { if (k.ok) placar[k.side]++ })
    const batedor = this.nomes[this.cobradores[i]] || undefined
    const nome = batedor || 'O cobrador', en = batedor || 'The taker'
    const C = n ? this.contato(i) : 0
    let fase: EstadoPenaltisCampo['fase'], mensagem: string, mensagemEn: string
    if (encerrado) { fase = 'encerrado'; mensagem = 'Shootout encerrado'; mensagemEn = 'Shootout complete' }
    else if (t < S.organizar) { fase = 'organizar'; mensagem = 'Shootout: todo mundo atrás do meio-campo'; mensagemEn = 'Shootout: everyone behind the halfway line' }
    else if (t < C - ANTES) { fase = 'caminhar'; mensagem = `${nome} leva a bola pro meio-campo`; mensagemEn = `${en} takes the ball to the centre spot` }
    else if (t < C - S.corrida) { fase = 'preparar'; mensagem = `${nome} espera o apito… o goleiro na linha`; mensagemEn = `${en} waits for the whistle… keeper on the line` }
    else if (t < C) { fase = 'correr'; mensagem = `Apito! ${nome} tem 5 segundos!`; mensagemEn = `Whistle! ${en} has 5 seconds!` }
    else if (t < C + S.voo) { fase = 'bola'; mensagem = `${nome} finaliza!`; mensagemEn = `${en} finishes!` }
    else {
      fase = 'resultado'
      const j = this.jeito(i)
      const pt: Record<Jeito, string> = { drible: 'DRIBLOU O GOLEIRO E FEZ!', chute: 'GOL!', defendeu: 'O GOLEIRO ENCOSTOU NA BOLA!', fora: 'PRA FORA!', isolou: 'POR CIMA!', trave: 'NA TRAVE!' }
      const ing: Record<Jeito, string> = { drible: 'ROUNDED THE KEEPER AND SCORED!', chute: 'GOAL!', defendeu: 'THE KEEPER GOT A TOUCH!', fora: 'WIDE!', isolou: 'OVER!', trave: 'OFF THE POST!' }
      mensagem = `${pt[j]} · ${nome}`; mensagemEn = `${ing[j]} · ${en}`
    }
    return { reveladas, encerrado, mensagem, mensagemEn, fase, cobranca: i, batedor, placar }
  }

  override quadro(): QuadroPenaltisCampo | null {
    if (!this.preparado || !this.seq.length) return null
    const t = this.t, i = this.daVez(t), k = this.seq[i]
    const jogadores = this.inicio.map((_, n) => this.posicao(n, t))
    const C = this.contato(i), l = this.ladoQueBate(i), chegaT = C - ANTES, apitoT = C - S.corrida
    const goleiro = this.goleiros[1 - l], quem = this.cobradores[i] ?? -1
    const juiz = espelho(JUIZ, (1 - l) as Lado)
    let bola: Ponto & { h: number } = { ...MEIO, h: 0 }
    let rede: QuadroPenaltisCampo['rede'] = null
    if (t < S.organizar) bola = { ...misturar(this.bolaInicial, MEIO, suave(t / S.organizar)), h: 0 }
    else if (t < chegaT) {
      // a anterior ainda na tela: a bola fica onde parou e volta pro meio
      const ant = i - 1
      if (ant >= 0) {
        const Ca = this.contato(ant), desde = t - (Ca + APOS), fim = this.fimBolaSh(ant)
        const la = this.ladoQueBate(ant), fimL = { ...espelho(fim, la), h: fim.h }
        bola = desde < 0 ? fimL : { ...misturar(fimL, MEIO, suave(desde / 2)), h: fim.h * (1 - limitar(desde / 2)) }
        if (this.seq[ant].ok && desde < 0) rede = { y0: 0, t0: (Ca + S.voo) * this.escala }
      }
    } else if (t < apitoT) bola = { ...MEIO, h: 0 } // no círculo central, esperando o apito
    else if (t < C) {
      // 🏃 a bola no pé: um passinho à frente do atacante, na direção da corrida
      const p = quem >= 0 ? jogadores[quem] : MEIO
      const prox = quem >= 0 ? this.posicao(quem, Math.min(C, t + .15)) : MEIO
      const dx = prox.x - p.x, dy = prox.y - p.y, d = Math.hypot(dx, dy) || 1
      bola = { x: p.x + dx / d * .7, y: p.y + dy / d * .7, h: 0 }
    } else {
      const ini = quem >= 0 ? this.posicao(quem, C) : MEIO, fim = this.fimBolaSh(i), fimL = espelho(fim, l)
      const u = limitar((t - C) / S.voo)
      const alt = this.jeito(i) === 'isolou' ? 3.5 : this.jeito(i) === 'chute' ? 1.2 : .2
      bola = { ...misturar(ini, fimL, suave(u)), h: alt * Math.sin(u * Math.PI) + fim.h * u }
      if (u >= 1 && k.ok) rede = { y0: 0, t0: (C + S.voo) * this.escala }
    }
    const apito = t >= apitoT - .4 && t < apitoT + .5
    let comemora: QuadroPenaltisCampo['comemora'] = null
    if (t >= C + S.voo && t < C + APOS) {
      if (k.ok && quem >= 0) comemora = { indice: quem, tipo: 'gol' }
      else if (!k.ok && this.jeito(i) === 'defendeu' && goleiro >= 0) comemora = { indice: goleiro, tipo: 'defesa' }
    }
    const corte = t < .7 ? 1 - t / .7 : 0
    return { jogadores, bola, juiz, batedor: quem, goleiro, rede, auxiliares: AUXILIARES_PENALTIS, apito, comemora, corte }
  }
}
