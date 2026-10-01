import assert from 'node:assert/strict'
import { CATALOG_BOTH } from '../src/escalacao/data.ts'
import { INTERNATIONAL_BLOCKS, INTERNATIONAL_CLUBS, internationalBotSquads, internationalCardKey, internationalChoice, internationalQualifiers, isInternationalCareerTester, validInternationalXI } from '../src/escalacao/career-international.ts'

const serieA = Array.from({ length: 20 }, (_, i) => `time-${i + 1}`)
const key = (team: string) => team

assert.equal(isInternationalCareerTester('diego.c.fonseca@gmail.com'), true)
assert.equal(isInternationalCareerTester(' DIEGO.C.FONSECA@GMAIL.COM '), true)
assert.equal(isInternationalCareerTester('diego.c.fonseca2@gmail.com'), false)
assert.equal(isInternationalCareerTester(null), false)

assert.equal(INTERNATIONAL_BLOCKS.length, 9)
assert.equal(INTERNATIONAL_CLUBS.length, 72)
assert.equal(new Set(INTERNATIONAL_CLUBS.map(c => c.name)).size, 72)
for (let block = 1; block <= 9; block++) {
  assert.equal(INTERNATIONAL_CLUBS.filter(c => c.block === block && c.competition === 'libertadores').length, 4)
  assert.equal(INTERNATIONAL_CLUBS.filter(c => c.block === block && c.competition === 'champions').length, 4)
}

const same = internationalQualifiers(serieA, serieA[0], key)
assert.deepEqual(same.map(q => q.team), serieA.slice(0, 8))
assert.deepEqual(same.map(q => q.priority), [1, 2, 3, 4, 5, 6, 7, 8])
assert.equal(same[0].cupChampion, true)

const sixth = internationalQualifiers(serieA, serieA[5], key)
assert.deepEqual(sixth.map(q => q.team), [serieA[0], serieA[5], ...serieA.slice(1, 5), ...serieA.slice(6, 8)])
assert.equal(sixth[1].leaguePosition, 6)
assert.equal(internationalChoice(true, 40, sixth, serieA[5], key).some(c => c.name === 'Real Madrid'), false)
assert.equal(internationalChoice(true, 40, sixth, serieA[5], key).length, 64)

const outside = internationalQualifiers(serieA, serieA[11], key)
assert.equal(outside.length, 9)
assert.equal(outside[1].team, serieA[11])
assert.equal(outside[1].leaguePosition, null)
assert.deepEqual(outside.map(q => q.priority), [1, 2, 3, 4, 5, 6, 7, 8, 9])
assert.equal(internationalChoice(true, 39, outside, serieA[0], key).length, 0)
assert.equal(internationalChoice(false, 87, outside, serieA[0], key).length, 0)
assert.equal(internationalChoice(true, 87, outside, serieA[0], key).length, 72)
assert.equal(internationalChoice(true, 87, outside, serieA[7], key).length, 8)
assert.equal(internationalChoice(true, 87, outside, serieA[12], key).length, 0)
assert.equal(internationalChoice(true, 87, outside, serieA[0], key).find(c => c.name === 'Milan')?.competition, 'champions')

const cards = Object.entries(CATALOG_BOTH).flatMap(([pos, list]) => list.map(card => ({ ...card, pos: pos as 'GOL' | 'LAT' | 'ZAG' | 'MEI' | 'ATA' })))
const validXI = Object.entries({ GOL: 1, LAT: 2, ZAG: 2, MEI: 3, ATA: 3 }).flatMap(([pos, n]) => cards.filter(c => c.pos === pos).slice(0, n))
assert.equal(validInternationalXI(validXI), true)
assert.equal(validInternationalXI(cards.filter(c => c.pos === 'ATA').slice(0, 11)), false)
const reserved = cards.slice(0, 11)
assert.throws(() => internationalBotSquads(cards, '', reserved), /Escolha uma instituição/)
const botSquads = internationalBotSquads(cards, 'Flamengo', reserved)
assert.equal(botSquads.size, 71)
assert.equal(botSquads.has('Flamengo'), false)
const assigned = [...botSquads.values()].flat()
assert.equal(assigned.length, 71 * 11)
assert.equal(new Set(assigned.map(internationalCardKey)).size, assigned.length)
assert.equal(assigned.some(card => reserved.some(user => internationalCardKey(user) === internationalCardKey(card))), false)
assert.equal(botSquads.get('Bayern de Munique')?.some(card => card.club === 'Bayern'), true)
for (const squad of botSquads.values()) {
  assert.deepEqual(Object.fromEntries(['GOL', 'LAT', 'ZAG', 'MEI', 'ATA'].map(pos => [pos, squad.filter(card => card.pos === pos).length])), { GOL: 1, LAT: 2, ZAG: 2, MEI: 3, ATA: 3 })
}

console.log('Carreira internacional: catálogo, classificação, blocos e 71 elencos reais OK')
