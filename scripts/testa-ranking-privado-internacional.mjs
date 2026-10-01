import assert from 'node:assert/strict'
import { createServer } from 'vite'

const vite = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' })
try {
  const { supabase } = await vite.ssrLoadModule('/src/lib/supabase.ts')
  let resolveInitial
  const authListeners = []
  supabase.auth.getUser = () => new Promise(resolve => { resolveInitial = resolve })
  supabase.auth.onAuthStateChange = fn => {
    authListeners.push(fn)
    return { data: { subscription: { unsubscribe() {} } } }
  }
  const onAuth = (event, session) => { for (const fn of authListeners) fn(event, session) }

  const { internationalTitleCounts } = await vite.ssrLoadModule('/src/escalacao/career-international-rank-snapshot.ts')
  const { isInternationalCareerTester } = await vite.ssrLoadModule('/src/escalacao/career-international.ts')
  const { internacionalCarreiraLiberada, internacionalCarreiraAuthResolvida } = await vite.ssrLoadModule('/src/escalacao/sport.ts')
  const { pontosDeTitulos } = await vite.ssrLoadModule('/src/escalacao/pyramidseason.tsx')

  const diego = { id: 'fixture-diego', email: 'diego.c.fonseca@gmail.com' }
  const other = { id: 'fixture-other', email: 'outra.conta@example.com' }
  assert.equal(isInternationalCareerTester(null), false)
  assert.equal(isInternationalCareerTester(other.email), false)
  assert.equal(isInternationalCareerTester(diego.email), true)
  assert.equal(internacionalCarreiraLiberada(), false)
  onAuth('INITIAL_SESSION', null)
  assert.equal(internacionalCarreiraLiberada(), false)
  onAuth('SIGNED_IN', { user: diego })
  assert.equal(internacionalCarreiraLiberada(), true)
  onAuth('SIGNED_OUT', null)
  resolveInitial({ data: { user: diego }, error: null })
  await new Promise(resolve => setTimeout(resolve, 0))
  assert.equal(internacionalCarreiraLiberada(), false, 'getUser atrasado não reabre após logout')
  onAuth('SIGNED_IN', { user: other })
  assert.equal(internacionalCarreiraLiberada(), false)
  onAuth('SIGNED_IN', { user: diego })
  assert.equal(internacionalCarreiraLiberada(), true)
  onAuth('SIGNED_IN', { user: other })
  assert.equal(internacionalCarreiraLiberada(), false, 'troca de conta fecha o teste')
  assert.equal(internacionalCarreiraAuthResolvida(), true)

  const season = (s, lib, champ, mundial) => ({ season: s, libertadores: lib, champions: champ, mundial })
  const history = [season(39, 1, 0, 0), season(87, 1, 0, 1), season(87, 1, 0, 1), season(88, 0, 1, 0), season(100, 0, 0, 1)]
  assert.deepEqual(internationalTitleCounts(history, 39), { mundial_titles: 0, libertadores_titles: 0, champions_titles: 0 })
  const at87 = internationalTitleCounts(history, 87)
  assert.deepEqual(at87, { mundial_titles: 1, libertadores_titles: 1, champions_titles: 0 })
  assert.equal(pontosDeTitulos({ mundial: at87.mundial_titles, libertadores: at87.libertadores_titles, champions: at87.champions_titles }), 90)
  assert.deepEqual(internationalTitleCounts(JSON.parse(JSON.stringify(history)), 87), at87, 'reabrir não duplica')
  assert.deepEqual(internationalTitleCounts(history, 88), { mundial_titles: 1, libertadores_titles: 1, champions_titles: 1 })
  assert.deepEqual(internationalTitleCounts(history, 101), { mundial_titles: 2, libertadores_titles: 1, champions_titles: 1 })
  assert.equal(pontosDeTitulos({ world: 1, mundial: 1, libertadores: 1, champions: 1, copa: 1 }), 360)
  console.log('OK: gate simulado sem sessão/Diego/outra conta/logout, resposta atrasada, snapshots T87/T88/T101 e pontos 200/50/40/40/30')
} finally {
  await vite.close()
}
