// 🔁 trava do RIVAL COM BANCO (13/10): bot cansa, se machuca e roda o time com a MESMA régua do humano,
// nunca põe incógnito em campo no lugar de real, e o passado nunca muda (rodada r só depende de < r).
// E as duas receitas novas: patrocínio (= Master de 2 temporadas do humano) e prêmio pela colocação.
//   npm run bots-banco
import assert from 'node:assert/strict'
import { createServer } from 'vite'
const vite = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom', logLevel: 'silent' })
try {
  const B = await vite.ssrLoadModule('/src/escalacao/bots-banco.ts')
  const E = await vite.ssrLoadModule('/src/escalacao/estadiodata.ts')
  const S = await vite.ssrLoadModule('/src/escalacao/store.tsx')
  const { planoCansacoBot, premioColocacaoBot, PATROCINIO_BOT } = B
  const NEED = { GOL: 1, LAT: 2, ZAG: 2, MEI: 3, ATA: 3 }
  const carta = (id, pos, lv, extra = {}) => ({ id, pos, lo: lv, hi: lv + 4, ...extra })
  const elenco = (comBanco) => {
    const out = []
    for (const [pos, n] of Object.entries(NEED)) for (let i = 0; i < n * (comBanco ? 2 : 1); i++) out.push(carta(`${pos}${i}`, pos, i < n ? 80 : 70))
    return out
  }
  const args = (o) => ({ squad: elenco(true), need: NEED, seed: 12345, seasonNo: 7, nome: 'Flamengo', rodadas: 38, ...o })

  // 1) determinístico e o PASSADO NÃO MUDA: o plano de 10 rodadas é o começo exato do de 38
  const p38 = planoCansacoBot(args({}))
  assert.deepEqual(planoCansacoBot(args({})), p38, 'mesma entrada → mesmo plano')
  const p10 = planoCansacoBot(args({ rodadas: 10 }))
  assert.deepEqual(p10.xi, p38.xi.slice(0, 10), 'as 10 primeiras rodadas não dependem das seguintes')
  for (let r = 0; r < 10; r++) assert.deepEqual(p10.mods[r], p38.mods[r])
  for (const xi of p38.xi) assert.equal(xi.length, 11, 'sempre 11 em campo')

  // 2) temporada começando inteira: com a escada do humano (−1,4 por jogo) ninguém cansa em 38 rodadas
  assert.equal(Object.keys(p38.mods).length, 0, 'começou a 100: nenhum titular joga cansado na 1ª temporada')
  assert.equal(p38.lesoes.length, 0, 'inteiro não se machuca por desgaste')

  // 3) começando CANSADO (veio do carry) e COM banco: o bot roda o time (poupa) e o reserva entra
  const titulares = elenco(false).map(c => c.id)
  const cansado = Object.fromEntries(titulares.map(id => [id, 20]))
  const pc = planoCansacoBot(args({ inicio: cansado }))
  assert.ok((pc.poupados[0] ?? 0) >= 5, 'na 1ª rodada o bot poupa os titulares esgotados')
  assert.ok(pc.xi[0].some(id => !titulares.includes(id)), 'reserva entra no lugar')

  // 4) SEM banco, cansado: joga cansado (−1/−2/−3), ninguém some, nada de incógnito
  const sb = planoCansacoBot(args({ squad: elenco(false), inicio: cansado }))
  assert.ok(Object.keys(sb.mods[0] ?? {}).length >= 5, 'sem reserva: o titular joga com o modificador do cansaço')
  for (const xi of sb.xi) assert.equal(xi.length, 11)

  // 5) incógnito (fake) no banco NUNCA entra no lugar de um titular cansado
  const comFake = [...elenco(false), carta('fakeGOL', 'GOL', 99, { fake: true })]
  const pf = planoCansacoBot(args({ squad: comFake, inicio: cansado }))
  assert.ok(pf.xi.every(xi => !xi.includes('fakeGOL')), 'fake não entra pelo rodízio')

  // 6) lesão: com o elenco no limite por muitas rodadas, aparece lesão, e o lesionado fica FORA
  const esgotado = Object.fromEntries(elenco(true).map(c => [c.id, 12]))
  let achou = null
  for (let seed = 1; seed < 200 && !achou; seed++) { const pl = planoCansacoBot(args({ seed, inicio: esgotado })); if (pl.lesoes.length) achou = pl }
  assert.ok(achou, 'com o time acabado, alguma lesão acontece')
  const l = achou.lesoes[0]
  for (let r = l.r + 1; r < Math.min(38, l.r + 1 + l.rodadas); r++) {
    const subs = elenco(true).filter(c => c.pos === elenco(true).find(x => x.id === l.id).pos).length
    if (subs > NEED[elenco(true).find(x => x.id === l.id).pos]) assert.ok(!achou.xi[r].includes(l.id), 'lesionado com reserva no banco não joga')
  }

  // 7) dinheiro: patrocínio = Master de 2 temporadas do humano; prêmio da colocação por divisão
  for (const d of ['A', 'B', 'C', 'D', 'V']) assert.equal(PATROCINIO_BOT[d], E.masterPorTemporada(d, 2), `patrocínio do bot = Master 2 temp. (${d})`)
  assert.equal(premioColocacaoBot('A', 1), 40); assert.equal(premioColocacaoBot('A', 3), 30); assert.equal(premioColocacaoBot('A', 6), 24)
  assert.equal(premioColocacaoBot('A', 12), 15); assert.equal(premioColocacaoBot('A', 20), 8)
  assert.ok(premioColocacaoBot('B', 1) < premioColocacaoBot('A', 1) && premioColocacaoBot('V', 1) < premioColocacaoBot('D', 1), 'divisão de baixo ganha menos')
  const sem = S.balancoBot('A', 100, 300), com = S.balancoBot('A', 100, 300, PATROCINIO_BOT.A)
  assert.equal(com.saldo - sem.saldo, PATROCINIO_BOT.A, 'patrocínio entra no saldo')
  assert.equal(sem.patrocinio, undefined, 'sem a regra, o balanço é o mesmo de antes')

  // 8) a conta fecha? Série A com 22 de nível bom pagando o justo: a folha cabe nas 4 receitas
  const folha22 = S.folhaDoBot(Array.from({ length: 22 }, (_, i) => ({ name: `J${i}`, club: 'Clube', year: 2000, pos: 'MEI', fame: i < 4 ? 5 : i < 12 ? 4 : 2, paid: i < 4 ? 110 : i < 12 ? 60 : 20 })))
  const renda = 50 + 40 + PATROCINIO_BOT.A + premioColocacaoBot('A', 10)
  console.log(`   Série A · folha de 22 ≈ ${folha22} · renda (TV+bilheteria+patrocínio+prêmio do 10º) = ${renda}`)
  assert.ok(renda >= folha22 * 0.8, 'a renda nova segura um elenco de 22 sem quebrar de cara')
  console.log('✅ bots-banco: plano determinístico, passado imutável, rodízio sem incógnito, lesão, patrocínio e prêmio')
} finally { await vite.close() }
