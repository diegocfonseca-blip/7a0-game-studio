// 🛡️ trava da TROCA DE CARREIRA (06/10, La Bestia do Elton: trocou de carreira com o aparelho cheio
// e a temporada 378 sumiu). Regra do Diego: *"ele pode trocar pela carreira que ele quiser… se ele
// excluir, já era"*. Esta trava simula um aparelho com POUCO espaço e confere que, troque como
// trocar, nenhuma carreira some — ou a troca acontece inteira, ou não acontece.
import assert from 'node:assert/strict'
import { createServer } from 'vite'

// localStorage de mentira com teto de espaço (em caracteres)
class Store {
  m = new Map<string, string>(); teto: number
  constructor(teto: number) { this.teto = teto }
  get used() { let n = 0; for (const [k, v] of this.m) n += k.length + v.length; return n }
  getItem(k: string) { return this.m.has(k) ? this.m.get(k)! : null }
  setItem(k: string, v: string) { const antes = this.m.get(k); const novo = this.used - (antes ? k.length + antes.length : 0) + k.length + v.length; if (novo > this.teto) { const e = new Error('QuotaExceededError'); e.name = 'QuotaExceededError'; throw e } this.m.set(k, v) }
  removeItem(k: string) { this.m.delete(k) }
  key(i: number) { return [...this.m.keys()][i] ?? null }
  get length() { return this.m.size }
  clear() { this.m.clear() }
}
const store = new Store(10_000_000)
;(globalThis as unknown as { localStorage: Store }).localStorage = store
;(globalThis as unknown as { window: unknown }).window = globalThis

const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' })
const m = await vite.ssrLoadModule('/src/escalacao/store.tsx')
try {
const carreira = (seed: number, tam: number, temp: number) => ({
  seed, seasonNo: temp, careerOnline: true, youIdx: 0, careerDivision: 'A',
  managers: [{ id: 0, isHuman: true, teamName: `Time ${seed}`, squad: [], recheio: 'x'.repeat(tam) }],
})
const seeds = () => m.listAllCareers().map(c => c.slot.save.seed).sort((a, b) => a - b)

// 3 carreiras: a ativa (grande, 378) + 2 no arquivo
store.setItem('esc-solo-career', JSON.stringify(carreira(378, 3000, 378)))
store.setItem('esc-solo-career-at', '1')
store.setItem('esc-career-archive', JSON.stringify([{ save: carreira(72, 2000, 72), at: 2 }, { save: carreira(92, 2000, 92), at: 3 }]))
const todas = seeds()
assert.deepEqual(todas, [72, 92, 378])

// 1) aparelho com folga: troca normal, nada some
store.teto = store.used + 500
assert.ok(m.activateCareerSlot(72), 'com espaço, a troca acontece')
assert.deepEqual(seeds(), todas, 'troca com espaço: as 3 continuam')
assert.equal(JSON.parse(store.getItem('esc-solo-career')!).seed, 72, 'a escolhida virou a ativa')

// 2) volta pra 378 com o aparelho NO LIMITE (a troca antiga duplicava e perdia aqui)
store.teto = store.used + 50
assert.ok(m.activateCareerSlot(378), 'troca de lugar cabe no mesmo espaço')
assert.deepEqual(seeds(), todas, 'no limite: as 3 continuam')
assert.equal(JSON.parse(store.getItem('esc-solo-career')!).seed, 378)

// 3) aparelho CHEIO até a tampa e a escolhida maior que a atual (não cabe a troca): NADA muda
store.teto = 10_000_000
store.setItem('esc-career-archive', JSON.stringify([{ save: carreira(72, 2000, 72), at: 2 }, { save: carreira(92, 6000, 92), at: 3 }]))
store.teto = store.used
const antes = JSON.stringify([...store.m])
assert.equal(m.activateCareerSlot(92), null, 'sem espaço: não troca')
assert.deepEqual(seeds(), todas, 'sem espaço: nenhuma carreira some · nuvem só apaga no 🗑️')
assert.equal(JSON.stringify([...store.m]), antes, 'sem espaço: o aparelho fica exatamente como estava')

// 4) começar carreira nova com o aparelho cheio: não apaga a atual
store.teto = store.used
assert.equal(m.stashActiveBeforeNew(), false, 'sem espaço: não começa a nova')
assert.ok(store.getItem('esc-solo-career'), 'a atual continua na vaga dela')
assert.deepEqual(seeds(), todas)

// 5) a nuvem nunca apaga carreira sozinha: se o aparelho perdeu alguma que a nuvem tem, a subida junta
const fonte = (await import('node:fs')).readFileSync('src/escalacao/store.tsx', 'utf8')
assert.ok(/faltaNoAparelho/.test(fonte) && /carimbo !== cloudAtConhecido\(uid\) \|\| faltaNoAparelho/.test(fonte), 'subida junta com a nuvem quando falta carreira no aparelho')
assert.ok(/anotaSeedsDaNuvem\(uid, kept\)/.test(fonte), 'o 🗑️ atualiza a lista do que a nuvem tem')

console.log('✅ troca de carreira: com espaço troca, no limite troca sem dobrar, sem espaço não mexe em nada — nenhuma carreira some · nuvem só apaga no 🗑️')
} finally { await vite.close() }
process.exit(0)
