// 🧑‍💼 trava do PRESIDENTE × PLANO (15/10, Diego: "nada é de graça… começa a ganhar boneco apenas no modo craque
// pra cima"). Confere as regras puras (presidente-plano.ts) que o editor, a Loja e o reducer da carreira seguem:
//   · grátis monta mas NÃO salva · Craque = roupas básicas · Lenda = + especiais · Batismo/Fundador = tudo
//   · nenhum selo da tela diz GRÁTIS · o sorteio nunca entrega roupa fora do plano
//   npm run presidente
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createServer } from 'vite'
const vite = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom', logLevel: 'silent' })
try {
  const P = await vite.ssrLoadModule('/src/escalacao/presidente-plano.ts')
  const A = await vite.ssrLoadModule('/src/escalacao/presidente-vestuario-acesso.ts')
  const M = await vite.ssrLoadModule('/src/escalacao/presidente-vestuario-modular.ts')
  const R = await vite.ssrLoadModule('/src/escalacao/presidente-roupas.ts')
  const S = await vite.ssrLoadModule('/src/escalacao/presidente-sortear.ts')
  const todas = M.VESTUARIO_MODULAR.map(r => r.id)

  // grátis: olha, não salva, não veste nada
  assert.equal(P.podeSalvarPresidente(null), false, 'grátis não salva')
  assert.equal(P.podeUsarPeca(null), false, 'grátis não usa peça')
  assert.ok(P.motivoTrava(null), 'grátis vê o motivo da trava')
  assert.ok(P.motivoTrava(null)[0].includes('Craque'), 'a trava aponta o caminho (Craque)')
  for (const id of todas) assert.equal(A.podeVestirModular(id, null), false, `grátis não veste ${id}`)

  // ⭐ Craque: salva, peças do rosto, só as roupas básicas
  assert.equal(P.podeSalvarPresidente('craque'), true)
  assert.equal(P.podeUsarPeca('craque'), true)
  assert.equal(P.motivoTrava('craque'), null)
  assert.equal(A.podeVestirModular('polo', 'craque'), true, 'Craque veste polo')
  assert.equal(A.podeVestirModular('camiseta-branca', 'craque'), true)
  assert.equal(A.podeVestirModular('jaqueta-couro', 'craque'), false, 'Craque NÃO veste couro (especial)')
  assert.equal(A.podeVestirModular('traje-real', 'craque'), false, 'Craque NÃO veste traje real (gala)')
  const basicas = todas.filter(id => A.podeVestirModular(id, 'craque'))
  assert.equal(basicas.length, 14, `Craque alcança 14 roupas básicas (deu ${basicas.length})`)

  // 👑 Lenda: + especiais, ainda sem gala
  assert.equal(A.podeVestirModular('jaqueta-couro', 'lenda'), true, 'Lenda veste couro')
  assert.equal(A.podeVestirModular('smoking-branco', 'lenda'), true)
  assert.equal(A.podeVestirModular('traje-real', 'lenda'), false, 'Lenda NÃO veste gala')
  assert.equal(A.podeVestirModular('rei-pregao', 'lenda'), false)
  assert.equal(todas.filter(id => A.podeVestirModular(id, 'lenda')).length, 23, 'Lenda alcança 14 + 9')

  // 🖋 Batismo e Fundador: tudo
  for (const pl of ['batismo', 'fundador']) for (const id of todas) assert.equal(A.podeVestirModular(id, pl), true, `${pl} veste ${id}`)

  // selos nunca dizem GRÁTIS; o nível certo em cada degrau
  for (const id of todas) {
    const [pt, en] = A.seloRoupaModular(id)
    assert.ok(!/GR[ÁA]TIS|FREE/i.test(pt + en), `selo de ${id} não pode dizer grátis: ${pt}`)
  }
  assert.deepEqual([...A.seloRoupaModular('polo')], ['⭐ CRAQUE', '⭐ STAR'])
  assert.deepEqual([...A.seloRoupaModular('jaqueta-couro')], ['👑 LENDA', '👑 LEGEND'])
  assert.deepEqual([...A.seloRoupaModular('traje-real')], ['🖋 BATISMO', '🖋 CLUB NAMING'])
  assert.deepEqual([...P.seloPeca()], ['⭐ CRAQUE', '⭐ STAR'])
  assert.equal(R.podeVestirRoupa('polo-azul', null), false)
  assert.equal(R.podeVestirRoupa('polo-azul', 'craque'), true)
  assert.equal(R.podeVestirRoupa('inventada', 'fundador'), false, 'roupa que não existe nunca passa')

  // o sorteio respeita o plano
  const base = { version: 5, name: 'Diego', outfit: 'terno' }
  assert.equal(S.sortearPresidente(base, Math.random, null), base, 'grátis: sorteio não muda nada')
  for (let i = 0; i < 60; i++) {
    const v = S.sortearPresidente(base, Math.random, 'craque')
    assert.ok(A.podeVestirModular(v.outfit, 'craque'), `sorteio do Craque entregou ${v.outfit}`)
  }
  for (let i = 0; i < 60; i++) {
    const v = S.sortearPresidente(base, Math.random, 'lenda')
    assert.ok(A.podeVestirModular(v.outfit, 'lenda'), `sorteio do Lenda entregou ${v.outfit}`)
  }

  // a tela não tem a palavra GRÁTIS em selo nenhum (regra do Diego, 15/10)
  const tela = readFileSync('src/escalacao/presidente-formulario.tsx', 'utf8')
  assert.ok(!/t\('GRÁTIS','FREE'\)/.test(tela), 'o formulário não pode carimbar GRÁTIS')
  const editor = readFileSync('src/escalacao/presidente-editor.tsx', 'utf8')
  assert.ok(!/tr\('GRÁTIS','FREE'\)/.test(editor), 'o editor legado não pode carimbar GRÁTIS')

  // a gravação na conta usa a MESMA régua (botão mudo, nunca)
  const conta = readFileSync('src/escalacao/presidente-conta.ts', 'utf8')
  assert.ok(conta.includes('podeSalvarPresidente(plano)') && conta.includes('podeVestirModular(v.outfit, plano)'), 'salvar na conta confere plano e roupa')

  console.log('✅ presidente × plano: grátis só olha · Craque 14 · Lenda 23 · Batismo/Fundador 33 · sem GRÁTIS · sorteio no plano · conta com a mesma régua')
} finally { await vite.close() }
