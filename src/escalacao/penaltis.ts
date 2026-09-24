// ─── ⚽ DISPUTA DE PÊNALTIS — o placar e as bolinhas, um só lugar ────────────
//
// 🐛 O QUE ESTAVA ERRADO (11/09/2026, reclamação do Diego: *"pelo menos na Copa
// do Mundo vi erros das cobranças acabarem antes da hora ou contagem errada das
// bolinhas"*):
//
// O placar dos pênaltis NÃO era disputado — era SORTEADO. Em três lugares
// diferentes (`copa-mundo.tsx`, `store.tsx` e `pyramidseason.tsx`) o código
// fazia a mesma coisa: tirava dois números de 2 a 5, garantia que fossem
// diferentes, e pronto. Só que placar de pênalti não é qualquer par de números:
// a disputa PARA na hora em que um time não alcança mais o outro. Por isso
// **5×2 não existe** no futebol — quando o primeiro chega a 4 com o outro em 2,
// já acabou (o quinto nem é cobrado). O sorteio cuspia 5×2 e 2×5 na boa.
//
// Aí a tela das bolinhas fazia o certo — ela reencena a disputa e para quando
// decide — e chegava a 4×2. Resultado na tela do jogador: o cabeçalho dizia
// "Pênaltis 5 × 2" e as bolinhas mostravam outra coisa, com cobrança faltando.
// Não era a tela que errava: era o placar que era impossível.
//
// 🩹 O CONSERTO, em duas partes:
//   1. `disputaPenaltis` SIMULA cobrança a cobrança, com a regra de parada de
//      verdade (e morte súbita se empatar em 5). Só sai placar que existe.
//   2. `sequenciaPenaltis` remonta as bolinhas de um jeito que SEMPRE fecha com
//      o placar — e agora aguenta morte súbita de qualquer tamanho (antes só
//      sabia desenhar 6×5; um 7×6 saía com bolinha faltando).
//
// ⚠️ Isto NÃO muda quem ganha nem quantos gols o jogo dá: o vencedor continua
// sendo quem fez mais, e a disputa só acontece quando o agregado empata.

/** Uma cobrança: de quem foi e se entrou. */
export interface Cobranca { side: 0 | 1; ok: boolean }

const CONVERSAO = 0.76 // ~3 em cada 4 entram, que é a média do futebol de verdade

/**
 * Disputa de verdade, cobrança a cobrança. Devolve [gols do A, gols do B].
 * Nunca devolve empate e nunca devolve placar impossível.
 */
export function disputaPenaltis(rng: () => number): [number, number] {
  const gols: [number, number] = [0, 0]
  const cobradas: [number, number] = [0, 0]
  // acabou: o que está atrás não alcança mais nem acertando tudo o que falta
  const decidido = () => gols[0] + (5 - cobradas[0]) < gols[1] || gols[1] + (5 - cobradas[1]) < gols[0]
  for (let r = 0; r < 5; r++) {
    for (const s of [0, 1] as const) {
      if (decidido()) return gols
      cobradas[s]++
      if (rng() < CONVERSAO) gols[s]++
    }
  }
  if (gols[0] !== gols[1]) return gols
  // 🎯 MORTE SÚBITA: rodada completa; quem fizer e o outro perder, leva.
  for (let r = 0; r < 30; r++) {
    const a = rng() < CONVERSAO, b = rng() < CONVERSAO
    if (a) gols[0]++
    if (b) gols[1]++
    if (a !== b) return gols
  }
  gols[rng() < 0.5 ? 0 : 1]++ // rede de segurança: nunca sai daqui empatado
  return gols
}

/**
 * Remonta as cobranças de um placar já decidido, pra desenhar as bolinhas.
 * Garantia: a soma das bolinhas de cada lado bate EXATAMENTE com o placar.
 */
export function sequenciaPenaltis(pens: [number, number], rng?: () => number): Cobranca[] {
  const vencedor: 0 | 1 = pens[0] > pens[1] ? 0 : 1
  const max = Math.max(pens[0], pens[1])
  // morte súbita: rodadas iguais até a última, onde um faz e o outro perde
  if (max > 5) {
    const seq: Cobranca[] = []
    for (let r = 0; r < max - 1; r++) seq.push({ side: 0, ok: true }, { side: 1, ok: true })
    // 🐛 A ORDEM NÃO MUDA NA RODADA DECISIVA (24/09). Diego: *"às vezes começa a
    //    bater sem tá alinhado, como se tivesse faltando o primeiro pênalti de um
    //    time"*. Era esta linha: ela punha o VENCEDOR primeiro. Quando quem vencia
    //    era o B (a linha de baixo), na última rodada o B batia ANTES do A — a
    //    bolinha de baixo pipocava com a de cima ainda vazia, e a disputa inteira
    //    parecia desencontrada bem no lance que decide.
    //    Agora é como no futebol de verdade: a ordem da disputa é uma só, do começo
    //    ao fim — A e depois B, sempre. Quem vence é quem converte; a ordem não.
    //    ⚠️ Não muda placar nem vencedor de NADA: só a ordem em que as bolinhas da
    //    última rodada aparecem. Trava: `npm run penaltis`.
    seq.push({ side: 0, ok: vencedor === 0 }, { side: 1, ok: vencedor === 1 })
    return seq
  }
  // até 5 cobranças: tenta algumas distribuições "naturais" (gols espalhados) e
  // fica com a primeira que fecha com o placar; se nenhuma fechar, usa a
  // distribuição simples (gols primeiro), que fecha sempre.
  for (let tentativa = 0; tentativa < (rng ? 12 : 0); tentativa++) {
    const seq = monta(pens, espalha(pens[0], rng!), espalha(pens[1], rng!))
    if (confere(seq, pens)) return seq
  }
  return monta(pens, cedo(pens[0]), cedo(pens[1]))
}

const cedo = (feitos: number) => Array.from({ length: 5 }, (_, i) => i < feitos)
function espalha(feitos: number, rng: () => number): boolean[] {
  const idx = [0, 1, 2, 3, 4]
  for (let i = 4; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]] }
  const arr = [false, false, false, false, false]
  idx.slice(0, feitos).forEach(i => { arr[i] = true })
  return arr
}
function monta(_pens: [number, number], planA: boolean[], planB: boolean[]): Cobranca[] {
  const plan = [planA, planB]
  const seq: Cobranca[] = []
  const gols: [number, number] = [0, 0]
  const cobradas: [number, number] = [0, 0]
  outer: for (let r = 0; r < 5; r++) {
    for (const s of [0, 1] as const) {
      const ok = plan[s][r]
      seq.push({ side: s, ok }); cobradas[s]++; if (ok) gols[s]++
      if (gols[0] + (5 - cobradas[0]) < gols[1] || gols[1] + (5 - cobradas[1]) < gols[0]) break outer
    }
  }
  return seq
}
function confere(seq: Cobranca[], pens: [number, number]): boolean {
  const soma: [number, number] = [0, 0]
  for (const k of seq) if (k.ok) soma[k.side]++
  return soma[0] === pens[0] && soma[1] === pens[1]
}

// ─── 🎯 OS BATEDORES (24/09) ─────────────────────────────────────────────────
// Diego: *"tô achando sem graça demais… poderia aparecer os jogadores que batem,
// de alguma forma que não aumentasse o tamanho do modal demais"* — e depois, sobre
// o erro: *"pra fora.. trave… travessão.. isolou"*. Mockup aprovado em 24/09
// (`scripts/mockup-penaltis-batedores.mjs`).
// ⚠️ TUDO AQUI É SÓ DESENHO: nada muda placar, vencedor nem a ordem das bolinhas.
// E nada gasta o `rng` da disputa — o jeito do erro sai de um hash próprio, pra
// todo aparelho da sala ver o MESMO lance sem mexer em sorteio nenhum.

/** Quem bate, em ordem, e o goleiro do time (que bate por último). */
export interface Batedores { batem: string[]; goleiro?: string }

/** Carta mínima pra montar a fila: serve pro `Card` (pos) e pro PoolCard da Copa do Mundo (sec). */
export interface CartaBatedor { name: string; pos?: string; sec?: string; lo?: number; hi?: number; fake?: boolean }

const ORDEM_SETOR: Record<string, number> = { ATA: 0, MEI: 1, LAT: 2, ZAG: 3 }

/**
 * A fila dos batedores: os 5 MELHORES de linha, do ataque pra trás (atacante,
 * meia, lateral, zagueiro); se for pra morte súbita, segue o resto na mesma régua;
 * o goleiro por último, como no futebol. Determinística: mesma entrada, mesma fila
 * em todo aparelho.
 */
export function ordemBatedores(cartas: CartaBatedor[] | undefined): Batedores | undefined {
  if (!cartas || !cartas.length) return undefined
  const setor = (c: CartaBatedor) => c.pos ?? c.sec ?? 'MEI'
  const nivel = (c: CartaBatedor) => ((c.lo ?? 0) + (c.hi ?? 0)) / 2
  const vistos = new Set<string>()
  const unicas = cartas.filter(c => c && c.name && !vistos.has(c.name) && (vistos.add(c.name), true))
  const goleiro = unicas.filter(c => setor(c) === 'GOL').sort((a, b) => nivel(b) - nivel(a) || a.name.localeCompare(b.name))[0]
  const linha = unicas.filter(c => setor(c) !== 'GOL')
    .sort((a, b) => nivel(b) - nivel(a) || a.name.localeCompare(b.name))
  const doAtaquePraTras = (xs: CartaBatedor[]) => [...xs].sort((a, b) => (ORDEM_SETOR[setor(a)] ?? 1) - (ORDEM_SETOR[setor(b)] ?? 1) || nivel(b) - nivel(a) || a.name.localeCompare(b.name))
  const batem = [...doAtaquePraTras(linha.slice(0, 5)), ...doAtaquePraTras(linha.slice(5))].map(c => c.name)
  if (!batem.length && !goleiro) return undefined
  return { batem, goleiro: goleiro?.name }
}

/** O i-ésimo batedor do time (0 = primeiro). Depois do goleiro, a fila recomeça. */
export function batedorDaVez(b: Batedores | undefined, i: number): string | undefined {
  if (!b) return undefined
  const fila = b.goleiro ? [...b.batem, b.goleiro] : b.batem
  return fila.length ? fila[i % fila.length] : undefined
}

/**
 * Iniciais de cada nome, SEM repetir dentro do time: Romário é RO, Ronaldinho vira
 * RN. Nome de duas palavras usa as duas iniciais (Adriano Imperador → AI).
 */
export function siglasDoTime(nomes: string[]): Record<string, string> {
  const semAcento = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '')
  const base = (n: string) => {
    const ps = semAcento(n).replace(/[^A-Za-z\s]/g, '').split(/\s+/).filter(Boolean)
    if (!ps.length) return '?'
    return (ps.length > 1 ? ps[0][0] + ps[1][0] : ps[0].slice(0, 2)).toUpperCase()
  }
  const usadas = new Set<string>()
  const out: Record<string, string> = {}
  for (const n of nomes) {
    if (out[n]) continue
    let s = base(n)
    if (usadas.has(s)) {
      const letras = semAcento(n).toUpperCase().replace(/[^A-Z]/g, '')
      const troca = [...letras.slice(1)].map(l => letras[0] + l).find(c => !usadas.has(c))
      if (troca) s = troca
    }
    usadas.add(s); out[n] = s
  }
  return out
}

export type JeitoDoErro = 'defendeu' | 'fora' | 'isolou' | 'trave' | 'travessao'
/** Pesos de futebol de verdade: a maioria é defesa; bola no travessão é a mais rara. */
export const PESO_ERRO: [JeitoDoErro, number][] = [['defendeu', 45], ['fora', 20], ['isolou', 15], ['trave', 12], ['travessao', 8]]

/** Semente do desenho, a partir do que TODO aparelho da sala já tem igual. */
export function sementePalco(aName: string, bName: string, pens: [number, number]): number {
  let h = 2166136261 >>> 0
  for (const ch of `${aName}|${bName}|${pens[0]}x${pens[1]}`) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0
  return h
}

/** Como a cobrança nº `at` foi perdida. Hash puro: não consome o rng de nada. */
export function jeitoDoErro(semente: number, at: number): JeitoDoErro {
  let h = (semente ^ Math.imul(at + 1, 0x9E3779B1)) >>> 0
  h = Math.imul(h ^ (h >>> 16), 0x85EBCA6B) >>> 0
  h = Math.imul(h ^ (h >>> 13), 0xC2B2AE35) >>> 0
  h = (h ^ (h >>> 16)) >>> 0
  let r = h % 100
  for (const [k, p] of PESO_ERRO) { if (r < p) return k; r -= p }
  return 'defendeu'
}
