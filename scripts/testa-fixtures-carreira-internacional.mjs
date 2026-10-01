import assert from 'node:assert/strict'
import { createServer } from 'vite'

const vite = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' })
try {
  // Nenhuma sessão ou conta real é usada. O módulo de feature flags recebe
  // apenas esta identidade fictícia em memória para exercitar o reducer.
  const { supabase } = await vite.ssrLoadModule('/src/lib/supabase.ts')
  const user = { id: 'fixture-local', email: 'diego.c.fonseca@gmail.com' }
  supabase.auth.getUser = async () => ({ data: { user }, error: null })
  supabase.auth.onAuthStateChange = fn => {
    queueMicrotask(() => fn('SIGNED_IN', { user }))
    return { data: { subscription: { unsubscribe() {} } } }
  }
  supabase.rpc = async name => name === 'esc_private_international_rank_allowed'
    ? { data: true, error: null }
    : { data: null, error: { code: 'PGRST202' } }

  const { CATALOG_BOTH } = await vite.ssrLoadModule('/src/escalacao/data.ts')
  const { INTERNATIONAL_BLOCKS, INTERNATIONAL_CLUBS, internationalCardKey, internationalChoice, internationalQualifiers, isRealInternationalCard, validInternationalXI } = await vite.ssrLoadModule('/src/escalacao/career-international.ts')
  const { makeInternationalCampaign } = await vite.ssrLoadModule('/src/escalacao/career-international-season.ts')
  const { summarizeInternationalCampaign } = await vite.ssrLoadModule('/src/escalacao/career-international-summary.ts')
  const { internationalCareerRanking } = await vite.ssrLoadModule('/src/escalacao/career-international-ranking.ts')
  const { pontosDeTitulos } = await vite.ssrLoadModule('/src/escalacao/pyramidseason.tsx')
  const { INITIAL, reducer } = await vite.ssrLoadModule('/src/escalacao/store.tsx')
  const { internacionalCarreiraLiberada } = await vite.ssrLoadModule('/src/escalacao/sport.ts')
  await new Promise(resolve => setTimeout(resolve, 0))
  assert.equal(internacionalCarreiraLiberada(), true)

  const league = Array.from({ length: 20 }, (_, i) => ({ id: `m${i}`, position: i + 1 }))
  const key = team => team.id
  const cases = [
    { name: 'G8 sem campeão da Copa', cup: null, order: [0, 1, 2, 3, 4, 5, 6, 7] },
    { name: 'Série A e Copa pelo mesmo campeão', cup: 0, order: [0, 1, 2, 3, 4, 5, 6, 7] },
    { name: 'vice da Série A campeão da Copa', cup: 1, order: [0, 1, 2, 3, 4, 5, 6, 7] },
    { name: 'sexto da Série A campeão da Copa', cup: 5, order: [0, 5, 1, 2, 3, 4, 6, 7] },
    { name: 'oitavo da Série A campeão da Copa', cup: 7, order: [0, 7, 1, 2, 3, 4, 5, 6] },
    { name: 'décimo da Série A campeão da Copa', cup: 9, order: [0, 9, 1, 2, 3, 4, 5, 6, 7] },
    { name: 'campeão da Copa fora da Série A', cup: 99, order: [0, 99, 1, 2, 3, 4, 5, 6, 7] },
  ]
  for (const fixture of cases) {
    const cup = fixture.cup === 99 ? { id: 'm99', position: 1 } : fixture.cup == null ? null : league[fixture.cup]
    const qualified = internationalQualifiers(league, cup, key)
    assert.deepEqual(qualified.map(row => row.team.id), fixture.order.map(i => `m${i}`), fixture.name)
    assert.deepEqual(qualified.map(row => row.priority), fixture.order.map((_, i) => i + 1), fixture.name)
    assert.equal(new Set(qualified.map(row => row.team.id)).size, fixture.order.length, fixture.name)
    assert.equal(qualified[0].leagueChampion, true, fixture.name)
    if (cup) assert.equal(qualified.find(row => row.team.id === cup.id)?.cupChampion, true, fixture.name)
    assert.equal(qualified.length, fixture.cup != null && fixture.cup >= 8 ? 9 : 8, fixture.name)
    for (const row of qualified) {
      const clubs = internationalChoice(true, 87, qualified, row.team.id, key)
      assert.equal(clubs.length, (10 - row.priority) * 8, `${fixture.name}: prioridade ${row.priority}`)
      assert.equal(Math.min(...clubs.map(club => club.block)), row.priority, fixture.name)
      assert.equal(Math.max(...clubs.map(club => club.block)), 9, fixture.name)
      assert.equal(internationalChoice(true, 39, qualified, row.team.id, key).length, 0)
      assert.equal(internationalChoice(false, 87, qualified, row.team.id, key).length, 0)
    }
    assert.equal(internationalChoice(true, 87, qualified, 'm19', key).length, 0)
  }
  assert.equal(INTERNATIONAL_BLOCKS.length, 9)
  assert.equal(INTERNATIONAL_CLUBS.length, 72)
  assert.equal(new Set(INTERNATIONAL_CLUBS.map(club => club.name)).size, 72)
  assert.equal(INTERNATIONAL_CLUBS.filter(club => club.competition === 'libertadores').length, 36)
  assert.equal(INTERNATIONAL_CLUBS.filter(club => club.competition === 'champions').length, 36)
  for (const [index, block] of INTERNATIONAL_BLOCKS.entries()) {
    assert.equal(block.libertadores.length, 4)
    assert.equal(block.champions.length, 4)
    assert.equal(INTERNATIONAL_CLUBS.filter(club => club.block === index + 1).length, 8)
  }

  const needs = { GOL: 1, LAT: 2, ZAG: 2, MEI: 3, ATA: 3 }
  const xi = Object.entries(needs).flatMap(([pos, count]) => CATALOG_BOTH[pos].slice(0, count).map((card, i) => ({ ...card, pos, id: `user-${pos}-${i}` })))
  assert.equal(validInternationalXI(xi), true)
  for (const impostor of [{ ...xi[0], fake: true }, { ...xi[0], cria: true }, { ...xi[0], club: 'Várzea' }, { ...xi[0], club: 'Sub-20' }]) {
    assert.equal(isRealInternationalCard(impostor), false)
    assert.equal(validInternationalXI([impostor, ...xi.slice(1)]), false)
    assert.throws(() => makeInternationalCampaign({ season: 87, seed: 731, representedClub: 'Flamengo', userTeam: 'Meu FC', userId: 0, priority: 1, userXI: [impostor, ...xi.slice(1)] }))
  }
  const knownCards = new Set(Object.entries(CATALOG_BOTH).flatMap(([pos, cards]) => cards.map(card => `${pos}|${internationalCardKey(card)}`)))
  const base = { season: 87, seed: 731, userTeam: 'Neymarzetty FC', userId: 0, priority: 1, userXI: xi }
  for (const representedClub of ['Flamengo', 'Real Madrid', null]) {
    const campaign = makeInternationalCampaign({ ...base, representedClub, priority: representedClub ? 1 : null, userXI: representedClub ? xi : [] })
    const me = campaign.teams.filter(team => team.you)
    assert.equal(me.length, representedClub ? 1 : 0)
    if (representedClub) {
      assert.equal(me[0].name, base.userTeam)
      assert.equal(me[0].institution, representedClub)
      assert.deepEqual(me[0].xi.map(card => card.id), xi.map(card => card.id))
      assert.equal(me[0].competition, representedClub === 'Flamengo' ? 'libertadores' : 'champions')
    }
    const allCards = campaign.teams.flatMap(team => team.xi)
    assert.equal(allCards.length, 72 * 11)
    assert.equal(new Set(allCards.map(internationalCardKey)).size, allCards.length)
    assert.ok(campaign.teams.every(team => team.xi.every(card => !card.fake && knownCards.has(`${card.pos}|${internationalCardKey(card)}`))))
    assert.equal(campaign.steps.length, 14)
    assert.ok(campaign.steps.slice(0, 8).every(step => step.champions))
    assert.equal(campaign.steps.slice(0, 13).filter(step => step.libertadores).length, 9)
    assert.equal(campaign.steps.slice(0, 13).filter(step => step.champions).length, 13)
    assert.ok(campaign.steps.slice(0, 13).every(step => !step.mundial))
    const final = campaign.steps[13].mundial
    assert.equal(final.matches.length, 1)
    assert.deepEqual([final.matches[0].home, final.matches[0].away], [campaign.libertadoresChampion, campaign.championsChampion])
    assert.ok([campaign.libertadoresChampion, campaign.championsChampion].includes(campaign.mundialChampion))
    const summary = summarizeInternationalCampaign(campaign)
    assert.equal(summary.teamRecords.length, 72)
    assert.equal(summary.botPlayerStats.length, representedClub ? 71 * 11 : 72 * 11)
  }

  // O mesmo resultado não vira um segundo título ao fechar/reabrir o save nem
  // ao receber um segundo clique de encerramento. O jornal lê uma edição por ano.
  const state0 = reducer(INITIAL, { type: 'START_CAREER_SOLO', teamName: base.userTeam, formation: '4-3-3', rivals: 0, league: 'both' })
  state0.managers[0].squad = xi
  state0.screen = 'cerimonia'
  const state1 = reducer(state0, { type: 'FINISH_CEREMONY' })
  state1.seasonNo = 87
  state1.round = 38
  state1.copaDoneSeason = 87
  const campaign = makeInternationalCampaign({ ...base, seed: state1.seed, representedClub: 'Flamengo' })
  let state = reducer(state1, { type: 'START_INTERNATIONAL_CAMPAIGN', campaign })
  assert.equal(state.careerInternational?.representedClub, 'Flamengo')
  for (let i = 0; i < 14; i++) state = reducer(state, { type: 'ADVANCE_INTERNATIONAL_CAMPAIGN' })
  const summary = summarizeInternationalCampaign(campaign)
  state = reducer(state, { type: 'FINISH_INTERNATIONAL_CAMPAIGN', entry: summary })
  assert.equal(state.careerInternationalHistory.length, 1)
  const firstCoins = state.careerCoins[0]
  const firstRank = internationalCareerRanking(state.careerInternationalHistory)
  const firstPoints = pontosDeTitulos({ mundial: summary.mundial, libertadores: summary.libertadores, champions: summary.champions })
  const titleFixture = { ...summary, libertadoresChampion: 'Flamengo', mundialChampion: 'Flamengo', libertadores: 1, mundial: 1 }
  const titleRank = internationalCareerRanking([titleFixture])
  assert.equal(titleRank.find(row => row.club === 'Flamengo').points, 110)
  assert.equal(pontosDeTitulos({ libertadores: titleFixture.libertadores, mundial: titleFixture.mundial }), 110)
  assert.deepEqual(internationalCareerRanking(JSON.parse(JSON.stringify([titleFixture]))), titleRank)
  state = JSON.parse(JSON.stringify(state))
  state = reducer(state, { type: 'FINISH_INTERNATIONAL_CAMPAIGN', entry: summary })
  assert.equal(state.careerInternationalHistory.length, 1)
  assert.equal(state.careerCoins[0], firstCoins)
  assert.deepEqual(internationalCareerRanking(state.careerInternationalHistory), firstRank)
  assert.equal(pontosDeTitulos({ mundial: state.careerInternationalHistory[0].mundial, libertadores: state.careerInternationalHistory[0].libertadores, champions: state.careerInternationalHistory[0].champions }), firstPoints)
  const nextSeason = reducer(state, { type: 'OPEN_RESERVE_LIST', placements: state.careerPlacements ?? {}, rewards: {}, clubRewards: {}, champions: {}, mesmo: true })
  assert.equal(nextSeason.seasonNo, 88)
  assert.equal(nextSeason.careerInternational, null)
  assert.equal(nextSeason.careerInternationalHistory.length, 1)
  assert.deepEqual(internationalCareerRanking(nextSeason.careerInternationalHistory), firstRank)
  assert.equal(nextSeason.careerInternationalHistory.filter(entry => entry.season === 87).length, 1)
  const doubleTurn = reducer(nextSeason, { type: 'OPEN_RESERVE_LIST', placements: {}, rewards: {}, clubRewards: {}, champions: {}, mesmo: true })
  assert.equal(doubleTurn.seasonNo, 88)
  assert.deepEqual(doubleTurn.careerInternationalHistory, nextSeason.careerInternationalHistory)
  console.log(`Fixtures internacionais: ${cases.length} classificações G8/G9; 72 clubes; 3 campanhas; histórico/pontos idempotentes OK`)
} finally {
  await vite.close()
}
