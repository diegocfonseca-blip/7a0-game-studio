import assert from 'node:assert/strict'
import { CATALOG } from '../src/escalacao/data'
import { entradaM2 } from '../src/escalacao/motor2/carreira'
import { FutebolOficial3D } from '../src/escalacao/presidencia-futebol-oficial'
import { identidadeAtleta3D } from '../src/escalacao/presidencia-futebol-identidade'
import { prepareMapTimeline } from '../src/escalacao/futebol3d/motion/map-football-timeline.mjs'

const pick = (pos: string, n: number, offset = 0) => (CATALOG as any)[pos].slice(offset, offset + n).map((c: any) => ({ ...c, pos }))
const team = (offset: number) => [...pick('GOL', 1, offset), ...pick('LAT', 2, offset), ...pick('ZAG', 2, offset), ...pick('MEI', 3, offset), ...pick('ATA', 3, offset)]
const casa = team(0), fora = team(20)
const reservas = [pick('GOL', 1, 60)[0], pick('MEI', 1, 60)[0], pick('ATA', 1, 60)[0]]
const input = entradaM2({ seed: 1000, casa, fora, fCasa: '4-3-3', fFora: '4-3-3', tatica: [0, 0], bots: [false, true], aoVivo: reservas.map((entra, i) => ({ t: 10 + i * 12, lado: 0, sai: casa[[0, 5, 8][i]].name, entra })) })
const state: any = { officialInput: input, context: { id: 'timeline-tres-trocas', home: casa, away: fora }, minute: 0, homeScore: 0, awayScore: 0, paused: true, finished: false }
const timeline = await prepareMapTimeline(state)
const motor = new FutebolOficial3D(input)
let frames = 0, owners = 0
for (let i = 0; i <= Math.floor(timeline.duration * 12); i++) {
  const t = i / 12, frame = motor.sample(state, t * 93 / 90, { replay: false, postMatchWalk: false })
  for (const p of frame.players) {
    const sampled = timeline.sample(t, p.key).player
    assert(sampled, `identidade presente na trilha: ${p.name}`)
    assert(Number.isFinite(sampled.x) && Number.isFinite(sampled.z))
    assert(Math.hypot(sampled.x - p.sourceAnchor!.x, sampled.z - p.sourceAnchor!.z) < .02, `posição oficial de ${p.name}`)
  }
  if (frame.owner) { assert.equal(timeline.sample(t).owner, frame.owner); owners++ }
  frames++
}
for (const card of reservas) assert(timeline.keys.includes(identidadeAtleta3D('home', card.name, card.club, card.year)))
assert(timeline.agenda.every((a: any) => !!a.rec), 'lances de reservas têm participante definido')
console.log(`PASS: trilha 3D com três reservas, ${frames} quadros e ${owners} posses conferidos contra o motor oficial`)
