import fs from 'node:fs'
import assert from 'node:assert/strict'
const read = p => fs.readFileSync(new URL('../' + p, import.meta.url), 'utf8')
const tela = read('src/escalacao/salao.tsx')
const camisas = read('src/escalacao/salao-camisas.ts')
const home = read('src/escalacao/screens.tsx')
assert.ok(home.includes('ll-salao-entry'))
assert.ok(tela.includes("supabase.rpc('esc_salao_torcidas')"))
assert.ok(tela.includes('b.gente - a.gente'))
assert.ok(tela.includes('RECORTE_CAMISA[clube]'))
assert.ok(tela.includes('overflow="hidden"'))
for (const nome of ['Leão da Estradinha', 'Papão United Madrid', 'Neymarzetti', 'Milhaça FC']) {
  assert.ok(camisas.slice(camisas.indexOf('export const RECORTE_CAMISA')).includes(nome))
}
assert.ok(!camisas.includes('@'))
assert.ok(!tela.includes('.from('))
assert.ok(tela.includes('startScreen="batismo"'))
console.log('Salão: entrada, lista, recorte das quatro camisas, CTA e limites de dados conferidos.')
