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
  // 💰 PREMIAÇÃO POR ETAPA (Diego 01/10): *"Libertadores e Champions um pouco mais do que a Copa
  // do Brasil, por etapas; o Mundial um pouco mais do que a Supercopa"*. Régua da Copa do Brasil
  // (`CB_PAY`): oitavas 6 · quartas 10 · semi 16 · vice 25 · campeão 50; Supercopa: vice 8 · campeão 20.
  // Aqui: fase inicial 6 · repescagem 8 · oitavas 10 · quartas 14 · semi 20 · vice 30 · campeão 60;
  // Mundial: vice +10 · campeão +25. O campeão continental que perde o Mundial leva 60 + 10.
  const etapa = champ === club ? 60 : finalist ? 30 : last?.title === 'Semifinal' ? 20 : last?.title === 'Quartas' ? 14 : last?.title === 'Oitavas' ? 10 : last?.title === 'Repescagem' ? 8 : 6
  const mundialPrize = campaign.mundialChampion === club ? 25 : champ === club ? 10 : 0
  const prizeCoins = !club ? 0 : etapa + mundialPrize
  const stats = campaign.statistics.filter(s => s.you)
  const records = new Map(campaign.teams.map(team => [team.id, { club: team.id, games: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0 }]))
  for (const match of campaign.steps.flatMap(step => [...(step.libertadores?.matches ?? []), ...(step.champions?.matches ?? []), ...(step.mundial?.matches ?? [])])) {
    const home = records.get(match.home)!, away = records.get(match.away)!
    home.games++; away.games++
    home.goalsFor += match.hg; home.goalsAgainst += match.ag
    away.goalsFor += match.ag; away.goalsAgainst += match.hg
    if (match.hg > match.ag) { home.wins++; away.losses++ }
    else if (match.hg < match.ag) { away.wins++; home.losses++ }
    else { home.draws++; away.draws++ }
  }
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
    teamRecords: [...records.values()],
    botPlayerStats: campaign.statistics.filter(stat => !stat.you).map(stat => [stat.key, stat.team, stat.games, stat.goals, stat.assists]),
    libertadoresChampion: campaign.libertadoresChampion, championsChampion: campaign.championsChampion, mundialChampion: campaign.mundialChampion,
  }
}
