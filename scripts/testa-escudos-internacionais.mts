import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'
import { INTERNATIONAL_CLUBS } from '../src/escalacao/career-international'
import { escudoOficialDoClube } from '../src/escalacao/escudos-clube-resolver'

for (const club of INTERNATIONAL_CLUBS) {
  const badge = escudoOficialDoClube(club.name)
  assert.ok(badge, `Falta escudo oficial para ${club.name}`)
  const bytes = readFileSync(`public/${badge.src}`)
  assert.equal(bytes.toString('ascii', 0, 4), 'RIFF', `${club.name}: arquivo inválido`)
  assert.equal(bytes.toString('ascii', 8, 12), 'WEBP', `${club.name}: não é WebP`)
  assert.ok(badge.w > 0 && badge.h > 0, `${club.name}: dimensões inválidas`)
}

console.log(`${INTERNATIONAL_CLUBS.length}/72 instituições com escudo oficial WebP`)
