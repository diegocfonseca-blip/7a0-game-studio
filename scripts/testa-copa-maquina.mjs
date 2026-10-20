// 🤖 COPA DO MUNDO DA SALA: a máquina nova (20/10). Ninguém repetido no time da máquina e seleção fraca da máquina um
// pouco mais fraca (as 10 mais fortes não mudam). Mede quantas vezes uma seleção FRACA da máquina leva a Copa, antes e depois.
//   node scripts/testa-copa-maquina.mjs
import assert from 'node:assert/strict'
import { createServer } from 'vite'
const vite = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom', logLevel: 'silent' })
try {
  const M = await vite.ssrLoadModule('/src/escalacao/copa-mundo-online.tsx')
  const C = await vite.ssrLoadModule('/src/escalacao/copa-mundo.tsx')
  const paises = M.paisesDaCopa()
  // 1) ninguém aparece duas vezes no time da máquina
  for (const p of paises) {
    const xi = C.xiDaMaquina(p, true).xi
    const pool = C.countryPool(p)
    for (const [sec, cartas] of Object.entries(pool)) {
      const doSetor = xi.filter(c => cartas.includes(c))
      const pessoas = cartas.filter((c, i, arr) => arr.findIndex(o => C.mesmaPessoa(o, c)) === i).length
      const repetido = doSetor.some((a, i) => doSetor.some((b, j) => j > i && C.mesmaPessoa(a, b)))
      assert.ok(!repetido || pessoas < doSetor.length, `${p}/${sec}: repetiu gente havendo ${pessoas} pessoas diferentes pra ${doSetor.length} vagas`)
    }
    assert.equal(xi.length, 11, `${p}: time da máquina com 11`)
  }
  const velhoRepete = paises.filter(p => { const xi = C.xiDaMaquina(p).xi; return xi.some((a, i) => xi.some((b, j) => j > i && C.mesmaPessoa(a, b))) })
  console.log(`✅ máquina sem jogador repetido (antes repetia em: ${velhoRepete.join(', ') || 'nenhuma'})`)
  // 2) quem ganha: 20 de gente (as 20 primeiras com o time da máquina, como se convocassem bem) + 12 da máquina
  const fortes = M.selecoesFortesDaMaquina()
  const rodar = (maquina2) => {
    const times = paises.map((p, i) => i < 20 ? { pais: p, nome: p, uid: `u${i}`, xiKeys: C.xiDaMaquina(p).xi.map(c => `${c.name}|${c.club}|${c.year}`) } : { pais: p, nome: p })
    let fracaMaquina = 0, maquina = 0
    const N = 1500
    for (let s = 1; s <= N; s++) {
      const ents = M.entrantesDaFicha({ seed: s * 7919, edicao: 1, times, potes: true, forte: true, maquina2 })
      const camp = C.simulaCopaMundo(ents, s * 7919, 1, true, true).final.champion
      const t = times[camp]
      if (t && !t.uid) { maquina++; if (!fortes.has(t.pais)) fracaMaquina++ }
    }
    return { maquina: (maquina / N * 100).toFixed(1), fraca: (fracaMaquina / N * 100).toFixed(1) }
  }
  const a = rodar(false), b = rodar(true)
  console.log(`🏆 seleção da MÁQUINA campeã: antes ${a.maquina}% → agora ${b.maquina}% · seleção FRACA da máquina: antes ${a.fraca}% → agora ${b.fraca}%`)
  console.log(`💪 seleções da máquina que NÃO enfraquecem (as ${M.MAQUINA_FORTES} mais fortes): ${[...fortes].join(', ')}`)
  assert.ok(+b.fraca <= +a.fraca, 'a máquina fraca não pode ganhar MAIS que antes')
} finally { await vite.close() }
