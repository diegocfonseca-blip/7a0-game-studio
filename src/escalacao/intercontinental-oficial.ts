// 🌐 COPA INTERCONTINENTAL DA FIFA do Brasil Oficial: o formato REAL de 2026 (pesquisa: docs/brasil-oficial/competicoes-reais.md e
// https://pt.wikipedia.org/wiki/Copa_Intercontinental_da_FIFA_de_2026). Regra do Diego: tudo real, nada inventado; o que a
// pesquisa não confirmou está marcado ⚠️ INCERTO, com a escolha provisória ao lado.
// Módulo PURO (sem tela): quem joga cada partida é o `joga` de quem chama (na carreira: o motor de sempre).
//
// Formato 2026 (6 clubes, um por confederação, tudo em JOGO ÚNICO):
//  1. Playoff da Copa África-Ásia-Pacífico (26/08, Jidá): Al-Ahli × Auckland FC — mando do melhor no ranking da FIFA.
//  2. Copa África-Ásia-Pacífico (19/09, Pretória): Mamelodi Sundowns × o vencedor do playoff.
//  3. Dérbi das Américas (09/12, Doha, campo neutro): campeão da Libertadores × Toluca (Concacaf).
//  4. Copa Challenger (12/12, Doha, campo neutro): vencedor do Dérbi × campeão da Copa África-Ásia-Pacífico.
//  5. Final (16/12, Al Rayyan, campo neutro): vencedor da Challenger × PSG (campeão da Champions, entra direto na final).
//  ⚠️ INCERTO: a fonte não diz se há prorrogação; aqui, como nas outras copas do jogo, empate vai direto aos pênaltis.
//  ⚠️ De 2027 em diante os clubes de fora continuam os de 2026 (mesma regra dos estrangeiros da Libertadores — o modo não joga
//     as ligas deles). O mando dos jogos 1 e 2 fica como foi em 2026 (o real usa o ranking da FIFA de cada ano).
import { type Joga, type Penaltis, type Jogo, type Confronto, type CtxJogo } from './campeonato-oficial'
import type { FaseEstadual, ResultadoEstadual } from './estaduais'

export const NOME_INTERCONTINENTAL = 'Intercontinental'
export const INTERCONTINENTAL_2026 = { concacaf: 'Toluca', uefa: 'PSG', caf: 'Mamelodi Sundowns', afc: 'Al-Ahli', ofc: 'Auckland FC' } as const
// 🇪🇺 O CAMPEÃO DA EUROPA DE CADA ANO (19/11, Diego: *"sorteia sempre os melhores times do mundo, sempre podendo até repetir todo ano,
// começando pelo PSG que foi o último mesmo"*). O modo não joga a Champions, então a 1ª temporada usa o real (PSG) e daí em diante
// sai um sorteio preso na semente da carreira entre os gigantes da Europa que fecham time com as cartas do jogo (repetir pode).
export const CAMPEOES_EUROPA = ['PSG', 'Real Madrid', 'Barcelona', 'Bayern', 'Liverpool', 'Man City', 'Inter', 'Milan', 'Juventus', 'Chelsea', 'Man United', 'Arsenal'] as const
/** quem representa a Europa no Mundial desta temporada. `giro` = desde quando o save sorteia (save antigo: só a partir da próxima). */
export function europaDaTemporada(seed: number, temporada: number, giro?: number): string {
  if (giro == null || temporada < giro || temporada <= 1) return INTERCONTINENTAL_2026.uefa
  let h = (seed ^ Math.imul(temporada, 0x2C1B3C6D) ^ 0xE0C0) >>> 0
  h = Math.imul(h ^ (h >>> 15), 0x2C1B3C6D) >>> 0; h = (h ^ (h >>> 12)) >>> 0
  return CAMPEOES_EUROPA[h % CAMPEOES_EUROPA.length]
}
export const CLUBES_INTERCONTINENTAL: readonly string[] = [...new Set<string>([...Object.values(INTERCONTINENTAL_2026), ...CAMPEOES_EUROPA])]
/** as fases na ordem; as 3 últimas são as de quem vem da Libertadores (as duas primeiras rolam sem clube da Conmebol) */
export const FASES_INTERCONTINENTAL = ['Playoff da Copa África-Ásia-Pacífico', 'Copa África-Ásia-Pacífico', 'Dérbi das Américas', 'Copa Challenger', 'Final'] as const
/** 📅 (mês, dia) de cada fase, na ordem de cima (fonte: pt.wikipedia) */
export const DATAS_INTERCONTINENTAL: readonly [number, number][] = [[8, 26], [9, 19], [12, 9], [12, 12], [12, 16]]

export type ResultadoIntercontinental = ResultadoEstadual

/** jogo único: o 1º nome é o "mandante" do placar (campo neutro nas 3 últimas); empate = pênaltis */
function jogoUnico(a: string, b: string, fase: string, joga: Joga, pen: Penaltis): Confronto {
  const ctx: CtxJogo = { serie: NOME_INTERCONTINENTAL, fase, rodada: 1 }
  const p = joga(a, b, ctx)
  const j: Jogo = { casa: a, fora: b, gc: p.gc, gf: p.gf, ctx }
  return p.gc !== p.gf ? { a, b, jogos: [j], vencedor: p.gc > p.gf ? a : b } : { a, b, jogos: [j], vencedor: pen(a, b, ctx), penaltis: true }
}

/** a Intercontinental inteira. `libertadores` = o campeão da Libertadores do MESMO ano no modo (pode ser de fora do Brasil). */
export function simulaIntercontinental(libertadores: string, joga: Joga, pen: Penaltis, europa: string = INTERCONTINENTAL_2026.uefa): ResultadoIntercontinental {
  const C = INTERCONTINENTAL_2026
  const fases: FaseEstadual[] = []
  const jogos: Jogo[] = []
  const elim: string[] = []
  const roda = (i: number, a: string, b: string) => {
    const c = jogoUnico(a, b, FASES_INTERCONTINENTAL[i], joga, pen)
    fases.push({ nome: FASES_INTERCONTINENTAL[i], tabelas: [], confrontos: [c], rodadas: 1 })
    jogos.push(...c.jogos)
    elim.unshift(c.vencedor === c.a ? c.b : c.a)
    return c.vencedor
  }
  const playoff = roda(0, C.afc, C.ofc)
  const aap = roda(1, C.caf, playoff)
  const derbi = roda(2, libertadores, C.concacaf)
  const challenger = roda(3, derbi, aap)
  const campeao = roda(4, challenger, europa)
  const vice = elim[0]
  return { estadual: NOME_INTERCONTINENTAL, fases, jogos, campeao, vice, caem: [], classificacao: [campeao, ...elim] }
}
