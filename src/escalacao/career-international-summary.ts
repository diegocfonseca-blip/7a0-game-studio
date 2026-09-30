import type { InternationalCampaign, InternationalHistoryEntry } from './career-international-season'

export function summarizeInternationalCampaign(campaign: InternationalCampaign): InternationalHistoryEntry {
  const club = campaign.representedClub
  const user = club ? campaign.teams.find(t => t.id === club) : null
  const mine = campaign.steps.flatMap(s => [...(s.libertadores?.matches ?? []), ...(s.champions?.matches ?? []), ...(s.mundial?.matches ?? [])]).filter(m => club && (m.home === club || m.away === club))
  let wins = 0, draws = 0, losses = 0, goalsFor = 0, goalsAgainst = 0
  for (const m of mine) {
    const gf = m.home === club ? m.hg : m.ag, ga = m.home === club ? m.ag : m.hg
    goalsFor += gf; goalsAgainst += ga
    if (gf > ga) wins++
    else if (gf < ga) losses++
    else draws++
  }
  const champ = user?.competition === 'libertadores' ? campaign.libertadoresChampion : campaign.championsChampion
  const phases = campaign.steps.flatMap(s => [s.libertadores, s.champions].filter(p => p?.competition === user?.competition))
  const last = phases.filter(p => p?.matches.some(m => m.home === club || m.away === club)).at(-1)
  const finalist = last?.title === 'Final'
  const bestCampaign = !club ? 'Sem classificação' : champ === club ? 'Campeão continental' : finalist ? 'Vice-campeão continental' : last?.title ?? 'Fase inicial'
  const prizeCoins = !club ? 0 : (champ === club ? 50 : finalist ? 40 : last?.title === 'Semifinal' ? 32 : last?.title === 'Quartas' ? 24 : last?.title === 'Oitavas' ? 16 : 10) + (campaign.mundialChampion === club ? 50 : 0)
  const stats = campaign.statistics.filter(s => s.you)
  const scorer = [...stats].sort((a, b) => b.goals - a.goals || a.name.localeCompare(b.name))[0]
  const assist = [...stats].sort((a, b) => b.assists - a.assists || a.name.localeCompare(b.name))[0]
  return {
    season: campaign.season, representedClub: club, userTeam: campaign.userTeam,
    competition: user?.competition ?? null, priority: campaign.priority,
    games: mine.length, wins, draws, losses, goalsFor, goalsAgainst,
    libertadores: +(club === campaign.libertadoresChampion), champions: +(club === campaign.championsChampion),
    mundial: +(club === campaign.mundialChampion), runnerUp: +(!!club && (finalist && champ !== club || (champ === club && campaign.mundialChampion !== club))),
    bestCampaign, prizeCoins,
    topScorer: scorer?.goals ? { name: scorer.name, club: scorer.club, year: scorer.year, goals: scorer.goals } : undefined,
    topAssist: assist?.assists ? { name: assist.name, club: assist.club, year: assist.year, assists: assist.assists } : undefined,
    playerStats: stats.map(({ key, name, club, year, games, goals, assists }) => ({ key, name, club, year, games, goals, assists })),
    libertadoresChampion: campaign.libertadoresChampion, championsChampion: campaign.championsChampion, mundialChampion: campaign.mundialChampion,
  }
}
