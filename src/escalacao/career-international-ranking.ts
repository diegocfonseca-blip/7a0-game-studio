import { INTERNATIONAL_CLUBS } from './career-international'
import type { InternationalHistoryEntry } from './career-international-season'

/** Ranking das instituições da carreira, derivado só de temporadas concluídas. */
export function internationalCareerRanking(history: readonly InternationalHistoryEntry[]) {
  const rows = new Map(INTERNATIONAL_CLUBS.map(club => [club.name, {
    club: club.name, competition: club.competition, block: club.block,
    libertadores: 0, champions: 0, mundial: 0,
    games: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, points: 0,
  }]))
  for (const season of history) {
    const lib = rows.get(season.libertadoresChampion), champ = rows.get(season.championsChampion), world = rows.get(season.mundialChampion)
    if (lib) { lib.libertadores++; lib.points += 40 }
    if (champ) { champ.champions++; champ.points += 40 }
    if (world) { world.mundial++; world.points += 50 }
    for (const record of season.teamRecords ?? []) {
      const row = rows.get(record.club)
      if (!row) continue
      row.games += record.games; row.wins += record.wins; row.draws += record.draws; row.losses += record.losses
      row.goalsFor += record.goalsFor; row.goalsAgainst += record.goalsAgainst
    }
  }
  return [...rows.values()].sort((a, b) => b.points - a.points || b.wins - a.wins ||
    (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst) || a.club.localeCompare(b.club))
}
