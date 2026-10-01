import assert from 'node:assert/strict'
import { createServer } from 'vite'

const vite = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' })
try {
  const { supabase } = await vite.ssrLoadModule('/src/lib/supabase.ts')
  const verificationQueue = []
  const authListeners = []
  supabase.auth.getUser = () => new Promise(resolve => { verificationQueue.push(resolve) })
  supabase.auth.onAuthStateChange = fn => {
    authListeners.push(fn)
    return { data: { subscription: { unsubscribe() {} } } }
  }
  let serverAllowsDiego = true
  let serverGateMissing = false
  supabase.rpc = async name => name === 'esc_private_international_rank_allowed'
    ? { data: serverAllowsDiego, error: serverGateMissing ? { code: 'PGRST202' } : null }
    : { data: null, error: { code: 'PGRST202' } }
  const onAuth = (event, session) => { for (const fn of authListeners) fn(event, session) }

  const { internationalTitleCounts } = await vite.ssrLoadModule('/src/escalacao/career-international-rank-snapshot.ts')
  const { isInternationalCareerTester } = await vite.ssrLoadModule('/src/escalacao/career-international.ts')
  const { internacionalCarreiraLiberada, internacionalCarreiraAuthResolvida } = await vite.ssrLoadModule('/src/escalacao/sport.ts')
  const { pontosDeTitulos, globalRankRpc } = await vite.ssrLoadModule('/src/escalacao/pyramidseason.tsx')
  const initialVerifications = verificationQueue.splice(0)

  const diego = { id: 'fixture-diego', email: 'diego.c.fonseca@gmail.com' }
  const other = { id: 'fixture-other', email: 'outra.conta@example.com' }
  assert.equal(isInternationalCareerTester(null), false)
  assert.equal(isInternationalCareerTester(other.email), false)
  assert.equal(isInternationalCareerTester(diego.email), true)
  assert.equal(internacionalCarreiraLiberada(), false)
  onAuth('INITIAL_SESSION', null)
  assert.equal(internacionalCarreiraLiberada(), false)
  onAuth('SIGNED_IN', { user: diego })
  assert.equal(internacionalCarreiraAuthResolvida(), false)
  for (const resolve of initialVerifications) resolve({ data: { user: diego }, error: null }) // respostas iniciais atrasadas
  await new Promise(resolve => setTimeout(resolve, 0))
  assert.equal(internacionalCarreiraLiberada(), false, 'a sessão sozinha não libera')
  verificationQueue.shift()({ data: { user: diego }, error: null })
  await new Promise(resolve => setTimeout(resolve, 0))
  assert.equal(internacionalCarreiraLiberada(), true)
  onAuth('SIGNED_OUT', null)
  assert.equal(internacionalCarreiraLiberada(), false)
  onAuth('SIGNED_IN', { user: diego })
  verificationQueue.shift()({ data: { user: other }, error: null })
  await new Promise(resolve => setTimeout(resolve, 0))
  assert.equal(internacionalCarreiraLiberada(), false, 'sessão com e-mail do Diego não prevalece sobre getUser')
  onAuth('SIGNED_IN', { user: other })
  assert.equal(internacionalCarreiraLiberada(), false)
  onAuth('SIGNED_IN', { user: diego })
  verificationQueue.shift()({ data: { user: other }, error: null }) // verificação antiga da outra conta
  await new Promise(resolve => setTimeout(resolve, 0))
  assert.equal(internacionalCarreiraLiberada(), false)
  verificationQueue.shift()({ data: { user: diego }, error: null })
  await new Promise(resolve => setTimeout(resolve, 0))
  assert.equal(internacionalCarreiraLiberada(), true)
  onAuth('SIGNED_IN', { user: other })
  assert.equal(internacionalCarreiraLiberada(), false, 'troca de conta fecha o teste')
  verificationQueue.shift()({ data: { user: other }, error: null })
  await new Promise(resolve => setTimeout(resolve, 0))
  assert.equal(internacionalCarreiraAuthResolvida(), true)
  serverAllowsDiego = false
  onAuth('SIGNED_IN', { user: diego })
  verificationQueue.shift()({ data: { user: diego }, error: null })
  await new Promise(resolve => setTimeout(resolve, 0))
  assert.equal(internacionalCarreiraLiberada(), false, 'servidor negou mesmo com e-mail correto')
  serverAllowsDiego = true
  serverGateMissing = true
  onAuth('SIGNED_IN', { user: diego })
  verificationQueue.shift()({ data: { user: diego }, error: null })
  await new Promise(resolve => setTimeout(resolve, 0))
  assert.equal(internacionalCarreiraLiberada(), false, 'RPC ausente não abre a carreira')
  serverGateMissing = false
  onAuth('SIGNED_IN', { user: diego })
  verificationQueue.shift()({ data: { user: diego }, error: null })
  await new Promise(resolve => setTimeout(resolve, 0))
  assert.equal(internacionalCarreiraLiberada(), true, 'liberação exige Auth e servidor')
  onAuth('SIGNED_OUT', null)
  assert.equal(internacionalCarreiraLiberada(), false)

  const calls = []
  supabase.rpc = async name => {
    calls.push(name)
    return name.endsWith('_v2')
      ? { data: null, error: { code: 'PGRST202' } }
      : { data: [{ user_id: 'fixture' }], error: null }
  }
  await globalRankRpc('esc_pyramid_rank', { p_season: 87, p_limit: 50 }, false)
  assert.deepEqual(calls, ['esc_pyramid_rank'], 'outra conta usa só o ranking legado')
  calls.length = 0
  await globalRankRpc('esc_pyramid_rank', { p_season: 87, p_limit: 50 }, true)
  assert.deepEqual(calls, ['esc_pyramid_rank_v2', 'esc_pyramid_rank'], 'migração ausente preserva o ranking legado')
  calls.length = 0
  supabase.rpc = async name => { calls.push(name); return { data: [{ user_id: 'fixture' }], error: null } }
  await globalRankRpc('esc_pyramid_rank', { p_season: 87, p_limit: 50 }, true)
  assert.deepEqual(calls, ['esc_pyramid_rank_v2'], 'Diego usa o ranking novo quando disponível')
  calls.length = 0
  supabase.rpc = async name => { calls.push(name); return { data: [], error: name.endsWith('_v2') ? { code: '42501' } : null } }
  await globalRankRpc('esc_pyramid_rank', { p_season: 87, p_limit: 50 }, true)
  assert.deepEqual(calls, ['esc_pyramid_rank_v2'], 'erro de autorização não aciona fallback')

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
