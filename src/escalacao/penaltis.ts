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
    seq.push({ side: vencedor, ok: true }, { side: (1 - vencedor) as 0 | 1, ok: false })
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
