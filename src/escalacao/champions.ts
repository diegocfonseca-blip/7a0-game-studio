// ─── ⭐ CHAMPIONS LEGENDS — o formato REAL de hoje (2024+) ───────────────────
//
// Pedido do Diego (21/09): *"quero formato real de hj como seria"* — e, depois de
// ver o mockup, *"pode fazer"*, com três ordens junto:
//   1. *"N terá nomes europeus pois usarmos usuários de batismos mms por ordem de
//      série a e dps série b C d e várzea q tiver bots na ordem de preferência"*
//   2. *"queria ela toda poow"* (a tabela de 36 aparece INTEIRA, sem janela)
//   3. *"N libere ainda ela pra todos não, coloque um selo de em breve"*
//
// ── O FORMATO, numa frase ───────────────────────────────────────────────────
// Não tem grupo. São **36 clubes numa tabela só**; cada um joga **8 adversários
// diferentes**; no fim, **1º-8º** vão direto pras oitavas, **9º-24º** disputam um
// repescão de ida e volta (8 sobem) e **25º-36º** caem fora. Das oitavas em
// diante é o MESMO motor da Copa dos 8 / Liberta (ida e volta, final única).
//
// ── POR QUE ESTE ARQUIVO EXISTE (e não é mais um pedaço do store.tsx) ───────
// O `store.tsx` já passa de 11 mil linhas. O que é MESA (quem entra, os potes, o
// calendário) não precisa do reducer pra nada — é conta pura, testável sozinha
// pelo `npm run champions`. O reducer só chama daqui.

import { BATISMOS, chaveClube } from './batismos'
import { DIVISION_TEAMS, VARZEA_TEAMS } from './data'

export const CHAMPIONS_CLUBES = 36     // a tabela inteira
export const CHAMPIONS_RODADAS = 8     // jogos de cada clube na fase de tabela
export const CHAMPIONS_DIRETO = 8      // 1º ao 8º: oitavas direto
export const CHAMPIONS_REPESCAO = 24   // 9º ao 24º: repescão · do 25º pra baixo, fora
export const CHAMPIONS_ID0 = 1800      // ids dos convidados (não colidem com a liga nem com a Liberta, que usa 900+)

/** o clube tem dono de verdade? (batismo ou sócio — os dois são gente) */
const ehDeGente = (() => {
  const set = new Set(BATISMOS.map(b => chaveClube(b.clube)))
  return (clube: string) => set.has(chaveClube(clube))
})()

// 💪 FORÇA POR DIVISÃO. A pirâmide já diz quem é melhor — a Série A é a elite e a
// Várzea é o fundo. Cada divisão tem uma faixa, e dentro dela o clube desce de 1
// em 1 na ordem da lista. São os mesmos números do `CLASSIC_CLUBS` (78→55), então
// o convidado da Champions não fica nem mais forte nem mais fraco que o resto do
// jogo: ele encaixa na régua que já existe.
const FAIXA: Record<string, [number, number]> = {
  A: [78, 70], B: [73, 65], C: [68, 60], D: [63, 55], V: [58, 50],
}

export type ClubeConvidado = { name: string; atk: number; def: number; divisao: string }

/**
 * 🖋️ OS 28 CONVIDADOS — clube de GENTE, na ordem que o Diego mandou.
 *
 * *"usarmos usuários de batismos mms por ordem de série a e dps série b C d e
 * várzea q tiver bots na ordem de preferência"*. Traduzindo pra regra:
 *   · varre a pirâmide de CIMA pra baixo (A → B → C → D → Várzea);
 *   · dentro de cada divisão, **clube de gente na frente** (batismo/sócio), e o
 *     resto só completa se faltar;
 *   · nunca repete quem já está na liga da sala (senão o cara jogaria contra ele
 *     mesmo).
 *
 * Por que a preferência importa: o sentido da Champions é dar PALCO pra quem
 * batizou. Clube genérico só entra pra fechar a conta.
 */
export function championsConvidados(jaNaLiga: string[], quantos = CHAMPIONS_CLUBES - CHAMPIONS_DIRETO): ClubeConvidado[] {
  const usado = new Set(jaNaLiga.map(chaveClube))
  const divs: [string, { team: string }[]][] = [
    ['A', DIVISION_TEAMS.A], ['B', DIVISION_TEAMS.B], ['C', DIVISION_TEAMS.C],
    ['D', DIVISION_TEAMS.D], ['V', VARZEA_TEAMS],
  ]
  const out: ClubeConvidado[] = []
  for (const [d, lista] of divs) {
    if (out.length >= quantos) break
    const [alto, baixo] = FAIXA[d]
    // gente primeiro, genérico depois — a ordem DENTRO de cada grupo é a da lista
    const livres = lista.map(t => t.team).filter(c => !usado.has(chaveClube(c)))
    const ordenados = [...livres.filter(ehDeGente), ...livres.filter(c => !ehDeGente(c))]
    ordenados.forEach((clube, i) => {
      if (out.length >= quantos) return
      usado.add(chaveClube(clube))
      // desce de 1 em 1 dentro da faixa da divisão, sem furar o piso dela
      const forca = Math.max(baixo, alto - i)
      out.push({ name: clube, atk: forca, def: Math.max(baixo, forca - 1), divisao: d })
    })
  }
  return out.slice(0, quantos)
}

// ── 🎱 POTES ────────────────────────────────────────────────────────────────
// 36 clubes → 4 potes de 9, do mais forte pro mais fraco (é assim na Champions de
// verdade: pote é ranking, não sorteio). O pote decide CONTRA QUEM você joga.
export function potesChampions(forcas: number[]): (1 | 2 | 3 | 4)[] {
  const ordem = forcas.map((f, i) => ({ f, i })).sort((a, b) => b.f - a.f || a.i - b.i)
  const pote: (1 | 2 | 3 | 4)[] = new Array(forcas.length).fill(1)
  ordem.forEach(({ i }, rank) => { pote[i] = (Math.min(3, Math.floor(rank / 9)) + 1) as 1 | 2 | 3 | 4 })
  return pote
}

// ── 📅 O CALENDÁRIO: 8 rodadas, 18 jogos por rodada, ninguém repete adversário ─
//
// Na Champions de verdade cada clube pega 2 de cada pote. Com 9 clubes por pote
// isso não fecha em rodadas inteiras (9 é ímpar — não dá pra parear um pote
// consigo mesmo sem sobrar um), e a UEFA resolve isso porque lá os jogos não
// acontecem todos ao mesmo tempo. Aqui TODO MUNDO joga em TODA rodada (é o que
// faz a tabela andar junto na tela), então a régua vira:
//
//   **cada clube pega 8 adversários de POTES DIFERENTES do seu, nunca repetindo.**
//
// Como: as rodadas emparelham potes dois a dois — (1×2 e 3×4), (1×3 e 2×4),
// (1×4 e 2×3) — e essa trinca roda 3 vezes até dar 8 rodadas. Cada repetição usa
// um DESLOCAMENTO diferente dentro do pote, então o adversário nunca se repete
// (são 9 deslocamentos possíveis e só 3 são usados).
//
// 🏠 MANDO DE CAMPO: 4 em casa e 4 fora pra TODO MUNDO. Alternar pela rodada não
// resolve (um pote é sempre o "de casa" no seu combo, e sobrava 3×5 pra metade da
// tabela — a trava pegou). O que fecha é dar o mando, jogo a jogo, a quem ainda
// jogou MENOS em casa; empate desempata pela rodada, pra não virar sempre o mesmo.
const COMBOS: [[number, number], [number, number]][] = [
  [[0, 1], [2, 3]], // pote 1 × pote 2 · pote 3 × pote 4
  [[0, 2], [1, 3]],
  [[0, 3], [1, 2]],
]

export function calendarioChampions(ids: number[], potes: (1 | 2 | 3 | 4)[], rng: () => number): [number, number][][] {
  // os 9 ids de cada pote, embaralhados (o sorteio mora aqui)
  const porPote: number[][] = [0, 1, 2, 3].map(p =>
    embaralha(ids.filter((_, i) => potes[i] - 1 === p), rng))
  const emCasa = new Map<number, number>(ids.map(i => [i, 0]))
  const rodadas: [number, number][][] = []
  for (let r = 0; r < CHAMPIONS_RODADAS; r++) {
    const combo = COMBOS[r % 3]
    const volta = Math.floor(r / 3)          // 0, 1, 2 → deslocamento diferente a cada volta
    const jogos: [number, number][] = []
    let k = 0 // nº do jogo DENTRO da rodada — desempata o mando alternando
    for (const [pa, pb] of combo) {
      const A = porPote[pa], B = porPote[pb]
      const n = Math.min(A.length, B.length)
      for (let i = 0; i < n; i++) {
        const a = A[i], b = B[(i + volta) % B.length]
        const ca = emCasa.get(a) ?? 0, cb = emCasa.get(b) ?? 0
        const aEmCasa = ca !== cb ? ca < cb : (r + k++) % 2 === 0
        const [casa, fora] = aEmCasa ? [a, b] : [b, a]
        emCasa.set(casa, (emCasa.get(casa) ?? 0) + 1)
        jogos.push([casa, fora])
      }
    }
    rodadas.push(jogos)
  }
  // 🔧 PASSE DE ACERTO: o guloso acima é MÍOPE (decide jogo a jogo sem olhar o
  // resto) e sobrava gente com 3 ou 5 jogos em casa. Aqui a conta fecha: enquanto
  // alguém tiver mando demais, acha um jogo em que ele é o mandante e o visitante
  // tem mando de menos, e VIRA esse jogo. Sempre termina, porque o total de mandos
  // é fixo (18 por rodada × 8 = 144 = 36 × 4) — então todo excesso tem uma falta
  // do outro lado esperando por ele.
  // ⚠️ E O ACERTO TEM QUE SEGUIR A CORRENTE, não só o vizinho: às vezes quem tem
  // mando A MAIS não joga em casa contra NINGUÉM que tenha a menos. Aí procura-se
  // um CAMINHO — A manda em B, B manda em C, e o C é que está devendo. Virando os
  // três jogos, A cai 1, C sobe 1 e o B no meio não se mexe. Isso sempre existe
  // quando alguém está sobrando (o total de mandos é fixo: 18 × 8 = 144 = 36 × 4).
  const alvo = CHAMPIONS_RODADAS / 2
  type Aresta = { rodada: number; k: number; de: number; para: number }
  const arestasDe = (time: number): Aresta[] => {
    const out: Aresta[] = []
    rodadas.forEach((rd, ri) => rd.forEach(([h, a], k) => { if (h === time) out.push({ rodada: ri, k, de: h, para: a }) }))
    return out
  }
  for (let passe = 0; passe < 400; passe++) {
    const sobrando = ids.find(i => (emCasa.get(i) ?? 0) > alvo)
    if (sobrando == null) break
    // busca em largura até achar quem está DEVENDO mando
    const veioDe = new Map<number, Aresta>()
    const visto = new Set<number>([sobrando])
    const fila = [sobrando]
    let destino: number | null = null
    while (fila.length && destino == null) {
      const atual = fila.shift()!
      for (const e of arestasDe(atual)) {
        if (visto.has(e.para)) continue
        visto.add(e.para); veioDe.set(e.para, e)
        if ((emCasa.get(e.para) ?? 0) < alvo) { destino = e.para; break }
        fila.push(e.para)
      }
    }
    if (destino == null) break // 🛟 sem caminho: para em vez de girar à toa
    for (let no = destino; no !== sobrando;) {
      const e = veioDe.get(no)!
      rodadas[e.rodada][e.k] = [e.para, e.de] // vira o mando deste jogo
      no = e.de
    }
    emCasa.set(sobrando, (emCasa.get(sobrando) ?? 0) - 1)
    emCasa.set(destino, (emCasa.get(destino) ?? 0) + 1)
  }
  return rodadas
}

function embaralha<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] }
  return a
}

// ── ✂️ OS CORTES DA TABELA ──────────────────────────────────────────────────
export type ZonaChampions = 'direto' | 'repescao' | 'fora'
export const zonaChampions = (pos: number): ZonaChampions =>
  pos <= CHAMPIONS_DIRETO ? 'direto' : pos <= CHAMPIONS_REPESCAO ? 'repescao' : 'fora'

/**
 * 🥊 OS 8 CONFRONTOS DO REPESCÃO — 9º ao 24º.
 * Quem terminou melhor pega quem terminou pior: 9×24, 10×23, 11×22… É a mesma
 * lógica de chaveamento do resto do jogo (o melhor tem o confronto mais fácil),
 * e ela é DETERMINÍSTICA de propósito: ninguém sorteia castigo pra ninguém.
 */
export function repescaoChampions<T>(classificados: T[]): [T, T][] {
  const meio = classificados.slice(CHAMPIONS_DIRETO, CHAMPIONS_REPESCAO) // 16
  const pares: [T, T][] = []
  for (let i = 0; i < meio.length / 2; i++) pares.push([meio[i], meio[meio.length - 1 - i]])
  return pares
}
