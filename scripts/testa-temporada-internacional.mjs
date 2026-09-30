import assert from 'node:assert/strict'
import { createServer } from 'vite'

const vite = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' })
try {
  const { CATALOG_BOTH } = await vite.ssrLoadModule('/src/escalacao/data.ts')
  const { makeInternationalCampaign } = await vite.ssrLoadModule('/src/escalacao/career-international-season.ts')
  const { summarizeInternationalCampaign } = await vite.ssrLoadModule('/src/escalacao/career-international-summary.ts')
  const needs = { GOL: 1, LAT: 2, ZAG: 2, MEI: 3, ATA: 3 }
  const xi = Object.entries(needs).flatMap(([pos, count]) => CATALOG_BOTH[pos].slice(0, count).map((card, i) => ({ ...card, pos, id: `minha-${pos}-${i}` })))
  const input = { season: 40, seed: 12345, representedClub: 'Flamengo', userTeam: 'Meu FC', userId: 0, priority: 1, userXI: xi }
  const campaign = makeInternationalCampaign(input)
  assert.equal(campaign.teams.length, 72)
  assert.equal(campaign.teams.filter(t => t.you).length, 1)
  assert.equal(campaign.teams.find(t => t.you)?.name, 'Meu FC')
  assert.equal(campaign.steps.length, 14)
  assert.equal(campaign.libertadoresGroups.length, 6)
  assert.equal(campaign.libertadoresGroups.every(g => g.length === 6 && g.every(t => t.played === 5)), true)
  assert.equal(campaign.championsTable.length, 36)
  assert.equal(campaign.championsTable.every(t => t.played === 8), true)
  assert.equal(campaign.teams.find(t => t.id === campaign.libertadoresChampion)?.competition, 'libertadores')
  assert.equal(campaign.teams.find(t => t.id === campaign.championsChampion)?.competition, 'champions')
  assert.equal([campaign.libertadoresChampion, campaign.championsChampion].includes(campaign.mundialChampion), true)
  const matches = campaign.steps.flatMap(s => [...(s.libertadores?.matches ?? []), ...(s.champions?.matches ?? []), ...(s.mundial?.matches ?? [])])
  assert.equal(campaign.statistics.reduce((n, s) => n + s.games, 0), matches.length * 22)
  assert.equal(campaign.statistics.reduce((n, s) => n + s.goals, 0), matches.reduce((n, m) => n + m.hg + m.ag, 0))
  assert.equal(campaign.statistics.reduce((n, s) => n + s.assists, 0), matches.flatMap(m => m.goals).filter(g => g.assist).length)
  assert.deepEqual(makeInternationalCampaign(input), campaign)
  const summary = summarizeInternationalCampaign(campaign)
  assert.equal(summary.season, 40)
  assert.equal(summary.representedClub, 'Flamengo')
  assert.equal(summary.games, matches.filter(m => m.home === 'Flamengo' || m.away === 'Flamengo').length)
  assert.equal(summary.playerStats.length, 11)
  assert.equal([10, 16, 24, 32, 40, 50, 100].includes(summary.prizeCoins), true)
  const botOnly = makeInternationalCampaign({ season: 87, seed: 54321, representedClub: null, userTeam: 'Meu FC', userId: 0, priority: null, userXI: [] })
  assert.equal(botOnly.teams.filter(t => t.you).length, 0)
  assert.equal(botOnly.mundialChampion.length > 0, true)
  assert.equal(summarizeInternationalCampaign(botOnly).prizeCoins, 0)
  console.log('Temporada internacional: 72 elencos, 2 competições, Mundial e estatísticas OK')
} finally {
  await vite.close()
}
