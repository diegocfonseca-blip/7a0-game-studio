import fs from 'node:fs'
import vm from 'node:vm'
import assert from 'node:assert/strict'
import ts from 'typescript'

// Pure modules only: this check never imports the store, auth or a network client.
const evaluate = (file, require = () => { throw new Error('Unexpected import') }) => {
  const exports = {}
  const compiled = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText
  vm.runInNewContext(compiled, { exports, require })
  return exports
}
const football = JSON.parse(fs.readFileSync('src/escalacao/legend-avatars.json', 'utf8'))
const basketball = JSON.parse(fs.readFileSync('src/escalacao/basketball-avatars.json', 'utf8'))
const nba = evaluate('src/escalacao/data-basquete.ts').CATALOG_NBA
const resolver = evaluate('src/escalacao/legend-avatars.ts', path => {
  if (path === './legend-avatars.json') return football
  if (path === './basketball-avatars.json') return basketball
  throw new Error(`Unexpected import: ${path}`)
})
const legends = Object.values(nba).flat().filter(card => card.fame === 5)
assert.equal(basketball.length, legends.length, 'Every current NBA legend needs one portrait')
const ids = new Set()
const paths = new Set()
for (const card of legends) {
  const art = resolver.legendAvatar(card.name, card.club, card.year)
  assert.ok(art, `${card.name}: missing exact club/year portrait`)
  assert.ok(art.src.startsWith('/avatars/nba-v1/'), card.name)
  assert.equal(art.transparent, true)
  assert.equal(resolver.legendAvatar(card.name, 'Other franchise', card.year), undefined)
  assert.equal(resolver.legendAvatar(card.name, card.club, card.year + 100), undefined)
  const path = 'public' + art.src
  assert.ok(fs.existsSync(path), path)
  assert.ok(fs.statSync(path).size <= 60000, path)
  ids.add(resolver.legendAvatarKey(card.name, card.club, card.year))
  paths.add(art.src)
}
assert.equal(ids.size, basketball.length)
assert.equal(paths.size, basketball.length)
for (const art of football) {
  assert.equal(resolver.legendAvatar(art.name, art.club, art.year)?.src, art.src,
    `${art.name}: football portrait must remain unchanged`)
}
for (const card of Object.values(nba).flat().filter(card => card.fame !== 5)) {
  assert.equal(resolver.legendAvatar(card.name, card.club, card.year), undefined,
    `${card.name}: no invented portrait for another tier`)
}
console.log(`PASS ${legends.length} NBA legends: exact identities, unique assets, <=60KB; ${football.length} football portraits preserved`)
