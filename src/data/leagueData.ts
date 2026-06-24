import type { LeagueTeam } from '../types/game'

const TEAMS_BY_LEVEL: Record<1 | 2 | 3, { name: string; strength: number }[]> = {
  1: [
    { name: 'EC Cotia', strength: 26 },
    { name: 'AA Tietê', strength: 33 },
    { name: 'Grêmio Atibaia', strength: 29 },
    { name: 'Sport Catanduva', strength: 36 },
    { name: 'EC Mauá', strength: 23 },
    { name: 'Atlético Piracicaba', strength: 31 },
    { name: 'Desportivo Guaratinguetá', strength: 38 },
  ],
  2: [
    { name: 'EC Guarulhos', strength: 50 },
    { name: 'AA Sorocaba', strength: 55 },
    { name: 'GE Campinas', strength: 52 },
    { name: 'Sport Osasco', strength: 62 },
    { name: 'EC São José', strength: 48 },
    { name: 'AA Jundiaí', strength: 57 },
    { name: 'Atlético Ribeirão', strength: 45 },
  ],
  3: [
    { name: 'EC Nacional', strength: 70 },
    { name: 'Sport Maringá', strength: 68 },
    { name: 'AA Goiânia', strength: 65 },
    { name: 'Grêmio Caxias', strength: 78 },
    { name: 'EC Ceará', strength: 72 },
    { name: 'SC Recife', strength: 75 },
    { name: 'AA Belém', strength: 62 },
  ],
}

export const LEAGUE_TOTAL_ROUNDS = 7

export function generateLeague(clubName: string, clubLevel: 1 | 2 | 3): LeagueTeam[] {
  const aiData = TEAMS_BY_LEVEL[clubLevel] ?? TEAMS_BY_LEVEL[1]
  const playerTeam: LeagueTeam = {
    id: 'player',
    name: clubName,
    strength: 25 + (clubLevel - 1) * 15,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
  }
  return [
    playerTeam,
    ...aiData.map((t, i) => ({
      id: `ai-${i}`,
      name: t.name,
      strength: t.strength,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
    })),
  ]
}

function simGoals(strongerFirst: boolean): { a: number; b: number } {
  const a = 1 + Math.floor(Math.random() * 3)
  const b = Math.floor(Math.random() * a)
  return strongerFirst ? { a, b } : { a: b, b: a }
}

export function simulateAIMatch(
  homeStrength: number,
  awayStrength: number,
): { homeGoals: number; awayGoals: number } {
  const diff = (homeStrength - awayStrength) / 100
  const homeWinP = Math.max(0.15, Math.min(0.75, 0.40 + diff * 0.35))
  const drawP = 0.25
  const r = Math.random()

  if (r < homeWinP) {
    const { a, b } = simGoals(true)
    return { homeGoals: a, awayGoals: b }
  } else if (r < homeWinP + drawP) {
    const g = Math.floor(Math.random() * 3)
    return { homeGoals: g, awayGoals: g }
  } else {
    const { a, b } = simGoals(false)
    return { homeGoals: a, awayGoals: b }
  }
}

export function simulateRoundAI(
  teams: LeagueTeam[],
  playerOpponentId: string,
): LeagueTeam[] {
  const remaining = teams.filter(t => t.id !== 'player' && t.id !== playerOpponentId)
  let updated = [...teams]

  for (let i = 0; i + 1 < remaining.length; i += 2) {
    const home = remaining[i]
    const away = remaining[i + 1]
    const { homeGoals, awayGoals } = simulateAIMatch(home.strength, away.strength)
    updated = updated.map(t => {
      if (t.id === home.id) {
        return {
          ...t,
          wins: t.wins + (homeGoals > awayGoals ? 1 : 0),
          draws: t.draws + (homeGoals === awayGoals ? 1 : 0),
          losses: t.losses + (homeGoals < awayGoals ? 1 : 0),
          goalsFor: t.goalsFor + homeGoals,
          goalsAgainst: t.goalsAgainst + awayGoals,
        }
      }
      if (t.id === away.id) {
        return {
          ...t,
          wins: t.wins + (awayGoals > homeGoals ? 1 : 0),
          draws: t.draws + (awayGoals === homeGoals ? 1 : 0),
          losses: t.losses + (awayGoals < homeGoals ? 1 : 0),
          goalsFor: t.goalsFor + awayGoals,
          goalsAgainst: t.goalsAgainst + homeGoals,
        }
      }
      return t
    })
  }

  return updated
}

export function getPoints(t: LeagueTeam): number {
  return t.wins * 3 + t.draws
}

export function sortLeague(teams: LeagueTeam[]): LeagueTeam[] {
  return [...teams].sort((a, b) => {
    const ptsDiff = getPoints(b) - getPoints(a)
    if (ptsDiff !== 0) return ptsDiff
    const gdA = a.goalsFor - a.goalsAgainst
    const gdB = b.goalsFor - b.goalsAgainst
    return gdB !== gdA ? gdB - gdA : b.goalsFor - a.goalsFor
  })
}
