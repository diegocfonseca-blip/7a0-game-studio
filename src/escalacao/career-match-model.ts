import type { CopaTie, CopaRound, SeasonAssist } from './pyramidseason'

// Apresentação pura: não chama RNG nem altera o resultado da competição.
export function careerTieView(tie: CopaTie, pos: number) {
  const legs = tie.legGoals.length ? tie.legGoals : [tie.goals]
  const n = legs.length
  const done = pos >= n * 90
  const index = Math.min(n - 1, Math.max(0, Math.floor(pos / 90)))
  const minute = Math.max(0, Math.min(90, Math.round(pos - index * 90)))
  const swap = n === 2 && index === 1
  const visible = (legs[index] ?? []).filter(g => done || g.min <= minute)
  const goals = visible.map(g => ({ ...g, home: swap ? !g.home : g.home }))
  const a = visible.filter(g => g.home).length, b = visible.filter(g => !g.home).length
  const first = index > 0 ? tie.legs[0] : [0, 0]
  const score = done ? (tie.legs[index] ?? [a, b]) : [a, b]
  return { done, index, minute, swap, goals, home: swap ? tie.b : tie.a, away: swap ? tie.a : tie.b,
    hg: swap ? score[1] : score[0], ag: swap ? score[0] : score[1],
    aggregate: done ? [tie.aggA, tie.aggB] : [first[0] + a, first[1] + b],
    leg: n === 1 ? 'JOGO ÚNICO' : swap ? 'VOLTA' : 'IDA', n }
}

export function careerCupAssists(rounds: CopaRound[], completed: number): SeasonAssist[] {
  const rows = new Map<string, SeasonAssist>()
  for (const round of rounds.slice(0, Math.max(0, completed))) for (const tie of round.ties) for (const goal of tie.goals) {
    if (!goal.assist) continue
    const team = goal.home ? tie.a : tie.b, key = `${team.teamId}|${team.name}|${goal.assist}`
    const row = rows.get(key)
    if (row) row.assists++
    else rows.set(key, { name: goal.assist, teamName: team.name, teamId: team.teamId,
      div: goal.home ? tie.aDiv : tie.bDiv, assists: 1, you: team.you, human: team.human, rival: team.rival, dorm: team.dorm })
  }
  return [...rows.values()].sort((a,b) => b.assists - a.assists)
}
