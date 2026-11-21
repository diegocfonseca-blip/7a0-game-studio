// ─── 🃏 BAFO NOVO · as REGRAS (puras, sem tela e sem banco) ─────────────────────────────────────────────────────────
//
// Diego (21/11): cada um joga com 22 cartas que JÁ GANHOU sendo campeão (a coleção da conta, `user_cards`, de carreira ou de
// sala), só gente, só liga, e no fim SÓ o campeão toma 1 carta das 22 de alguém. Aqui mora o que dá pra testar sem rede:
//   · a coleção vira cartas de jogo (força vem do baralho — a linha do banco só tem nome/clube/ano/posição/categoria);
//   · a convocação FECHA sempre num time que joga (as marcadas entram; o que faltar o jogo completa com as PIORES cartas);
//   · o formato da liga pela quantidade de gente (2 = 5 jogos · 3–4 = todos contra todos 4× · 5–20 = ida e volta).
// A trava `npm run bafo` roda este arquivo.
import type { FormationKey, Sector } from './types'

export const BAFO2_ELENCO = 22
export const BAFO2_MIN = 11
export const BAFO2_CONVOCA_SEG = 160 // 21/11 (Diego, depois do 1º teste: "ter mais 40s pra convocar")
export const BAFO2_ESCOLHA_SEG = 60
const POS: Sector[] = ['GOL', 'LAT', 'ZAG', 'MEI', 'ATA']

/** a linha da coleção como vem do banco */
export interface LinhaColecao { id: string; card_name: string; card_club: string; card_year: number; card_pos: string; card_fame: number }
/** a carta da coleção pronta pra jogar (com a força do baralho) */
export interface CartaBafo { id: string; name: string; club: string; year: number; pos: Sector; fame: number; lo: number; hi: number }
/** como achar a carta no baralho (a tela passa o leitor dos 3 catálogos; o teste passa um de mentira) */
export type AchaNoBaralho = (nome: string, clube: string, ano: number) => { pos: Sector; fame: number; lo: number; hi: number; club: string; year: number } | null

const chave = (n: string, c: string, a: number) => `${n}|${c}|${a}`

/** 🃏 a coleção vira cartas de jogo. Carta que não existe mais no baralho fica de fora (melhor faltar do que inventar força) e
 *  a MESMA carta ganha duas vezes conta uma só (não dá pra escalar dois Messis do Barcelona 2012 no mesmo time). */
export function resolveColecao(linhas: LinhaColecao[], acha: AchaNoBaralho): CartaBafo[] {
  const vistos = new Set<string>()
  const out: CartaBafo[] = []
  for (const l of linhas) {
    const b = acha(l.card_name, l.card_club, l.card_year)
    if (!b) continue
    const k = chave(l.card_name, b.club, b.year)
    if (vistos.has(k)) continue
    vistos.add(k)
    out.push({ id: l.id, name: l.card_name, club: b.club, year: b.year, pos: b.pos, fame: b.fame, lo: b.lo, hi: b.hi })
  }
  return out
}

/** da pior pra melhor: categoria primeiro, depois a força média (quem o jogo usa pra completar a convocação) */
export const piorPrimeiro = (a: CartaBafo, b: CartaBafo): number => a.fame - b.fame || (a.lo + a.hi) - (b.lo + b.hi) || a.name.localeCompare(b.name) || a.id.localeCompare(b.id)

/** as formações que o Bafo aceita, na ordem em que o jogo tenta (a 1ª que o elenco fechar é a do time) */
export const FORMACOES_BAFO: FormationKey[] = ['4-3-3', '4-4-2', '4-5-1', '5-3-2', '3-4-3z', '4-2-4', '5-4-1']
export type Necessidades = Record<string, Record<Sector, number>>

const conta = (cs: CartaBafo[]): Record<Sector, number> => {
  const n = { GOL: 0, LAT: 0, ZAG: 0, MEI: 0, ATA: 0 } as Record<Sector, number>
  for (const c of cs) n[c.pos]++
  return n
}
/** a 1ª formação que estas cartas fecham (um titular de verdade em cada vaga) — ou null */
export function formacaoQueFecha(cs: CartaBafo[], need: Necessidades): FormationKey | null {
  const n = conta(cs)
  for (const f of FORMACOES_BAFO) { const q = need[f]; if (q && POS.every(p => n[p] >= q[p])) return f }
  return null
}
/** dá pra jogar o Bafo com esta coleção? */
export const podeJogarBafo = (colecao: CartaBafo[], need: Necessidades): boolean => formacaoQueFecha(colecao, need) !== null

/** ✔ FECHA A CONVOCAÇÃO. Regra do Diego: *"se ele não escolher no tempo o sistema bota a pior carta pra ele; as que ele marcou
 *  entram no jogo"*. Ordem:
 *   1. entram as MARCADAS (só as que são dele, no máximo 22);
 *   2. se elas ainda não fecham um time, o jogo completa as VAGAS QUE FALTAM com as piores cartas daquela posição
 *      (e, se o elenco já está cheio, tira a pior marcada de uma posição que sobra — o time TEM que entrar em campo);
 *   3. o resto das 22 vagas é preenchido com as piores cartas que sobraram.
 *  Devolve null se a coleção não fecha time nenhum (aí a pessoa não joga). É a MESMA conta no aparelho de quem convoca e no do dono. */
export function fechaConvocacao(marcadas: string[], colecao: CartaBafo[], need: Necessidades): { ids: string[]; cartas: CartaBafo[]; formacao: FormationKey } | null {
  if (!podeJogarBafo(colecao, need)) return null
  const porId = new Map(colecao.map(c => [c.id, c]))
  const dentro: CartaBafo[] = []
  for (const id of marcadas) { const c = porId.get(id); if (c && !dentro.includes(c) && dentro.length < BAFO2_ELENCO) dentro.push(c) }
  const fora = () => colecao.filter(c => !dentro.includes(c)).sort(piorPrimeiro)
  // a formação-alvo: a que as marcadas já fecham; senão a que pede MENOS carta de fora (empate = ordem da lista)
  let alvo = formacaoQueFecha(dentro, need)
  if (!alvo) {
    let melhor = Infinity
    const nd = conta(dentro), nc = conta(colecao)
    for (const f of FORMACOES_BAFO) {
      const q = need[f]; if (!q || !POS.every(p => nc[p] >= q[p])) continue
      const falta = POS.reduce((s, p) => s + Math.max(0, q[p] - nd[p]), 0)
      if (falta < melhor) { melhor = falta; alvo = f }
    }
  }
  if (!alvo) return null
  const q = need[alvo]
  for (const p of POS) {
    while (dentro.filter(c => c.pos === p).length < q[p]) {
      const entra = fora().find(c => c.pos === p)
      if (!entra) return null
      if (dentro.length >= BAFO2_ELENCO) {
        // elenco cheio: sai a pior marcada de uma posição com gente sobrando
        const sai = [...dentro].sort(piorPrimeiro).find(c => dentro.filter(x => x.pos === c.pos).length > q[c.pos])
        if (!sai) return null
        dentro.splice(dentro.indexOf(sai), 1)
      }
      dentro.push(entra)
    }
  }
  for (const c of fora()) { if (dentro.length >= BAFO2_ELENCO) break; dentro.push(c) }
  // ordem do elenco = quem é titular (os primeiros de cada posição): as marcadas na ordem em que a pessoa marcou, e o que o
  // jogo completou vem depois — menos onde ele precisou tapar vaga, que aí a carta dele é a titular mesmo.
  return { ids: dentro.map(c => c.id), cartas: dentro, formacao: alvo }
}

/** 📅 o formato pela quantidade de gente (decisão do Diego, 21/11) */
export function formatoBafo(n: number): { rodadas: number; jogosCadaUm: number; pt: string; en: string } {
  if (n <= 2) return { rodadas: 5, jogosCadaUm: 5, pt: '2 pessoas = 5 jogos entre os dois, quem somar mais pontos leva', en: '2 people = 5 games between the two, most points wins' }
  if (n <= 4) {
    const porTurno = n % 2 === 0 ? n - 1 : n // ímpar tem folga
    return { rodadas: porTurno * 4, jogosCadaUm: (n - 1) * 4, pt: `${n} pessoas = todos contra todos, 4 vezes`, en: `${n} people = everyone plays everyone, 4 times` }
  }
  const porTurno = n % 2 === 0 ? n - 1 : n
  return { rodadas: porTurno * 2, jogosCadaUm: (n - 1) * 2, pt: `${n} pessoas = todos contra todos, ida e volta`, en: `${n} people = everyone plays everyone, home and away` }
}

/** um turno (todos contra todos uma vez) pelo método do círculo; time ímpar folga */
function umTurno(ordem: number[]): [number, number][][] {
  const ids = ordem.slice()
  if (ids.length % 2 === 1) ids.push(-1)
  const n = ids.length, rot = ids.slice(1), rounds: [number, number][][] = []
  for (let r = 0; r < n - 1; r++) {
    const left = [ids[0], ...rot.slice(0, n / 2 - 1)], right = rot.slice(n / 2 - 1).reverse()
    const round: [number, number][] = []
    for (let i = 0; i < n / 2; i++) {
      const h = r % 2 === 0 ? left[i] : right[i], a = r % 2 === 0 ? right[i] : left[i]
      if (h !== -1 && a !== -1) round.push([h, a])
    }
    rounds.push(round)
    rot.unshift(rot.pop()!)
  }
  return rounds
}
const inverte = (rs: [number, number][][]): [number, number][][] => rs.map(r => r.map(([h, a]) => [a, h] as [number, number]))

/** 📅 o calendário do Bafo (os ids já vêm embaralhados pela semente da sala) */
export function calendarioBafo(ids: number[]): [number, number][][] {
  const n = ids.length
  if (n < 2) return []
  if (n === 2) return [0, 1, 2, 3, 4].map(i => [[i % 2 === 0 ? ids[0] : ids[1], i % 2 === 0 ? ids[1] : ids[0]] as [number, number]])
  const ida = umTurno(ids), volta = inverte(ida)
  return n <= 4 ? [...ida, ...volta, ...ida, ...volta] : [...ida, ...volta]
}
