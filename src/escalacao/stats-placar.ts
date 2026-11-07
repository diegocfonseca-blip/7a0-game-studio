// 📊 ESTATÍSTICAS NO PLACAR CINEMA (07/11, pedido do Diego): no apito do placar normal (sem o 2D) aparece o MESMO resumo do
// Campo 2D — posse · finalizações · chutes no gol · ⭐ melhor em campo (`campo2d-resumo.ts` conta, `campo2d-resumo-ui.tsx` desenha).
// No placar não tem campinho, então aqui roda o MESMO motor que encenaria aquele jogo no 2D, SEM desenhar, só pra contar:
//   · jogo de teatro (salas, partida rápida, copas): o v1 (`Jogo2D`), preso na semente do jogo (`sementeDasChances`) e nos gols
//     REAIS do placar — o mesmo jeito que o `Campo2D` monta o jogo dele;
//   · jogo da carreira decidido pelo motor novo (`EntradaM2`): o v2 com a MESMA entrada que deu o placar (`novoMotor2`).
// Regras que moram aqui:
//   · ⛔ nada de sorteio local: só a semente + o resultado que já estão no estado (todo aparelho da sala chega no mesmo número);
//     o idioma não entra na conta (as estatísticas são as mesmas em PT e EN);
//   · ⚽ os números batem com o placar: gol é sempre chute no gol (e chute no gol é sempre finalização);
//   · 🙈 nada antes do apito: a tela só chama `statsPlacarVisivel` → `resumoDoPlacar` depois do FIM (e da última cobrança de pênalti);
//   · 🧊 não mexe em resultado, rng do jogo, relógio, canal nem coroa — é um motor PRÓPRIO, criado aqui e jogado fora.
import { Jogo2D, eventosDoJogo, type CartaCampo } from './campo2d-motor'
import { chancesDoJogo, sementeDasChances, quemFinalizou } from './chances'
import { criaColetorCampo2D, type Par, type ResumoCampo2D } from './campo2d-resumo'
import { novoMotor2, type EntradaM2 } from './motor2/carreira'

export type LadoStats = { nome: string; cartas?: CartaCampo[]; cartas2?: CartaCampo[]; formacao?: string; formacao2?: string }
export type GolStats = { name: string; min: number; home: boolean; assist?: string }
export interface EntradaStats {
  roundKey: number
  casa: LadoStats
  fora: LadoStats
  /** os gols do placar (TODOS — é o resultado do jogo) */
  gols: GolStats[]
  /** a duração da rodada na tela (decide quantas chances o teatro monta — o mesmo número que o placar e o 2D usam) */
  roundMs: number
  /** -1 retranca · 0 equilíbrio · 1 ataque (o v1 do 2D recebe a mesma) */
  tatica?: [number, number]
  /** jogo decidido pelo motor novo (carreira): o v2 com esta entrada */
  m2?: EntradaM2
}

/** 🙈 a régua de QUANDO aparece (a mesma pra tela e pra trava): liberado, fim de jogo de futebol, e pênaltis (se houver) encerrados */
export function statsPlacarVisivel(o: { liberado: boolean; fechado: boolean; basket?: boolean; kings?: boolean; penaltis?: { encerrado: boolean } | null }): boolean {
  return o.liberado && o.fechado && !o.basket && !o.kings && (!o.penaltis || o.penaltis.encerrado)
}

const sig = (cs?: CartaCampo[]) => (cs ?? []).map(c => c.name).join('|')
const chave = (e: EntradaStats) => JSON.stringify([e.roundKey, e.casa, e.fora, e.gols, e.roundMs, e.tatica ?? null, e.m2 ?? null])
const CACHE = new Map<string, ResumoCampo2D>()
const guarda = (k: string, r: ResumoCampo2D) => { CACHE.set(k, r); if (CACHE.size > 24) CACHE.delete(CACHE.keys().next().value as string) }

/** o resumo que JÁ foi contado (ou null) — a tela lê isto antes de pedir a conta */
export function resumoGuardado(e: EntradaStats): ResumoCampo2D | null { return CACHE.get(chave(e)) ?? null }

/** 📊 o resumo do apito do jogo do placar, de uma vez (trava/bancada). A tela usa `contaResumoDoPlacar`, que não trava a tela. */
export function resumoDoPlacar(e: EntradaStats): ResumoCampo2D {
  const k = chave(e), c = CACHE.get(k)
  if (c) return c
  const it = conta(e)
  let p = it.next()
  while (!p.done) p = it.next()
  guarda(k, p.value.resumo)
  return p.value.resumo
}

/** 🐢 a mesma conta, em fatias pequenas entre os quadros (o motor anda ~10 minutos de jogo por vez): o apito e a festa do FIM
 *  não engasgam. Devolve o "cancelar" (trocou de jogo / saiu da tela antes de acabar). */
export function contaResumoDoPlacar(e: EntradaStats, pronto: (r: ResumoCampo2D) => void): () => void {
  const k = chave(e), c = CACHE.get(k)
  if (c) { pronto(c); return () => {} }
  const it = conta(e)
  let vivo = true, h: ReturnType<typeof setTimeout> | undefined
  const fatia = () => {
    if (!vivo) return
    const p = it.next()
    if (p.done) { guarda(k, p.value.resumo); pronto(p.value.resumo); return }
    h = setTimeout(fatia, 0)
  }
  h = setTimeout(fatia, 0)
  return () => { vivo = false; if (h) clearTimeout(h) }
}

/** 🔎 só a trava: o resumo + o placar a que o motor chegou (tem que ser o do jogo) */
export function contaComPlacar(e: EntradaStats): { resumo: ResumoCampo2D; placarMotor: Par } {
  const it = conta(e)
  let p = it.next()
  while (!p.done) p = it.next()
  return p.value
}

function* conta(e: EntradaStats): Generator<void, { resumo: ResumoCampo2D; placarMotor: Par }> {
  const cartas: [CartaCampo[] | undefined, CartaCampo[] | undefined] = [e.casa.cartas2 ?? e.casa.cartas, e.fora.cartas2 ?? e.fora.cartas]
  let jogo: { placar: number[] }
  if (e.m2) {
    // ⚽🧠 v2: o mesmo motor e o mesmo fim que deram o placar da carreira (`resultadoM2`)
    const m = novoMotor2(e.m2, false)
    for (let min = 1; min <= 120 && !m.fim; min++) { m.avancaAte(min); if (min % 8 === 0) yield }
    jogo = m as unknown as { placar: number[] }
  } else {
    // 🎭 v1: o jogo que o Campo2D montaria — mesma semente, mesmas chances, mesmo finalizador, mesma tática
    const seed = sementeDasChances(e.roundKey, e.casa.nome, e.fora.nome)
    const chances = chancesDoJogo(seed, e.gols, e.roundMs)
    const evs = eventosDoJogo(e.gols, chances, ch => quemFinalizou(ch.home ? e.casa.cartas : e.fora.cartas, { ...ch, fim: 'fora' }, ch.home ? e.casa.nome : e.fora.nome))
    const j = new Jogo2D(seed, e.casa.cartas ?? [], e.fora.cartas ?? [], evs, false, [e.casa.formacao, e.fora.formacao])
    if (e.tatica) j.tatica = e.tatica
    for (let min = 10; min < 45; min += 10) { j.avancaAte(min); yield }
    // 🔁 intervalo da carreira: do 45' em diante joga quem o técnico pôs (igual o campinho faz)
    j.avancaAte(45)
    if (e.casa.cartas2 && sig(e.casa.cartas2) !== sig(e.casa.cartas)) j.trocaTime(0, e.casa.cartas2, e.casa.formacao2 ?? e.casa.formacao)
    if (e.fora.cartas2 && sig(e.fora.cartas2) !== sig(e.fora.cartas)) j.trocaTime(1, e.fora.cartas2, e.fora.formacao2 ?? e.fora.formacao)
    for (let min = 55; min < 93; min += 10) { yield; j.avancaAte(min) }
    // 🏁 o apito do campinho: 93' passados, sem festa de gol na tela e com todos os gols do placar já dentro
    let m = 93
    j.avancaAte(m)
    while ((j.festa || j.placar[0] + j.placar[1] < e.gols.length) && m < 125) { m += 0.05; j.avancaAte(m) }
    jogo = j
  }
  const r = criaColetorCampo2D().resumo(jogo as never, cartas)
  // ⚽ bate com o placar: gol do placar é chute no gol, e chute no gol é finalização
  const golsLado: Par = [e.gols.filter(g => g.home).length, e.gols.filter(g => !g.home).length]
  const noAlvo: Par = [Math.max(r.noAlvo[0], golsLado[0]), Math.max(r.noAlvo[1], golsLado[1])]
  const chutes: Par = [Math.max(r.chutes[0], noAlvo[0]), Math.max(r.chutes[1], noAlvo[1])]
  return { resumo: { ...r, noAlvo, chutes }, placarMotor: [jogo.placar[0], jogo.placar[1]] }
}
