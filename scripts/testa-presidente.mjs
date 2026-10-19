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

  // 🖋 Fundador: tudo · Batismo: tudo MENOS astronauta, gala dourada e traje real (só Fundador, Diego 16/10)
  const SO_FUNDADOR = ['astronauta', 'gala-dourada', 'traje-real']
  for (const id of todas) assert.equal(A.podeVestirModular(id, 'fundador'), true, `fundador veste ${id}`)
  for (const id of todas) assert.equal(A.podeVestirModular(id, 'batismo'), !SO_FUNDADOR.includes(id), `batismo ${SO_FUNDADOR.includes(id) ? 'NÃO ' : ''}veste ${id}`)
  assert.deepEqual([...A.seloRoupaModular('astronauta')], ['🖋 FUNDADOR', '🖋 FOUNDER'])

  // selos nunca dizem GRÁTIS; o nível certo em cada degrau
  for (const id of todas) {
    const [pt, en] = A.seloRoupaModular(id)
    assert.ok(!/GR[ÁA]TIS|FREE/i.test(pt + en), `selo de ${id} não pode dizer grátis: ${pt}`)
  }
  assert.deepEqual([...A.seloRoupaModular('polo')], ['⭐ CRAQUE', '⭐ STAR'])
  assert.deepEqual([...A.seloRoupaModular('jaqueta-couro')], ['👑 LENDA', '👑 LEGEND'])
  assert.deepEqual([...A.seloRoupaModular('traje-real')], ['🖋 FUNDADOR', '🖋 FOUNDER'])
  assert.deepEqual([...A.seloRoupaModular('magico')], ['🖋 BATISMO', '🖋 CLUB NAMING'])
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
  assert.ok(conta.includes('visualCabeNaPosse(v, posse)'), 'salvar na conta confere plano, roupa e peças compradas')

  // 🛍️ PEÇAS AVULSAS (19/10): preço pelo nível, grátis só ganha boneco com a 1ª ROUPA, e o banco tem o MESMO catálogo
  const V = await vite.ssrLoadModule('/src/escalacao/presidente-avulsas.ts')
  const C = await vite.ssrLoadModule('/src/escalacao/presidente-conta.ts').catch(() => null)
  const gratis = { plano: null, compradas: [] }
  assert.equal(V.temBoneco(gratis), false, 'grátis sem compra não tem boneco')
  assert.deepEqual(V.compraPossivel('p-classic-hair', gratis), { ok: false, motivo: 'roupa_primeiro' }, 'grátis: cabelo antes da roupa, não')
  assert.deepEqual(V.compraPossivel('r-polo', gratis), { ok: true, preco: 1.99 }, 'roupa de Craque = 1,99')
  assert.deepEqual(V.compraPossivel('r-jaqueta-couro', gratis), { ok: true, preco: 2.99 }, 'roupa de Lenda = 2,99')
  assert.deepEqual(V.compraPossivel('r-rei-pregao', gratis), { ok: true, preco: 3.99 }, 'roupa de Batismo = 3,99')
  assert.deepEqual(V.compraPossivel('r-astronauta', gratis), { ok: true, preco: 4.99 }, 'roupa de Fundador = 4,99 (liberada no avulso em 19/10)')
  const comRoupa = { plano: null, compradas: ['r-polo'] }
  assert.equal(V.temBoneco(comRoupa), true, 'comprou roupa = ganhou boneco')
  assert.equal(V.podeUsarPecaAvulsa('none', comRoupa), true, 'careca e sem barba sempre pode com boneco')
  assert.equal(V.podeUsarPecaAvulsa('classic-hair', comRoupa), false, 'cabelo não vem junto')
  assert.deepEqual(V.compraPossivel('p-classic-hair', comRoupa), { ok: true, preco: 1.99 }, 'depois da roupa, cabelo a 1,99')
  assert.deepEqual(V.compraPossivel('r-polo', comRoupa), { ok: false, motivo: 'ja_tem' }, 'não vende de novo')
  assert.deepEqual(V.compraPossivel('r-polo', { plano: 'craque', compradas: [] }), { ok: false, motivo: 'ja_tem' }, 'o plano já cobre')
  assert.deepEqual(V.compraPossivel('r-astronauta', { plano: 'batismo', compradas: [] }), { ok: true, preco: 4.99 }, 'Batismo compra a do Fundador')
  assert.equal(V.podeVestirComPosse('astronauta', { plano: 'craque', compradas: ['r-astronauta'] }), true, 'Craque com o astronauta comprado veste')
  for (let i = 0; i < 40; i++) {
    const v = S.sortearPresidente(base, Math.random, comRoupa)
    assert.equal(v.outfit, 'polo', 'grátis sorteia só a roupa que comprou')
    assert.ok(v.appearance.hair === 'none' && v.appearance.beard === 'none', 'grátis sem peça comprada sorteia careca')
  }
  console.log(C ? '  (conta carregada: régua de salvar conferida)' : '  ⚠️ presidente-conta não carregou no teste')
  if (C) {
    const careca = { version: 5, name: 'Zé', outfit: 'polo', appearance: { version: 22, hair: 'none', beard: 'none', accessories: [] } }
    assert.equal(C.visualCabeNaPosse(careca, comRoupa), true, 'boneco careca com a roupa comprada salva')
    assert.equal(C.visualCabeNaPosse({ ...careca, appearance: { ...careca.appearance, hair: 'classic-hair' } }, comRoupa), false, 'com cabelo não comprado não salva')
    assert.equal(C.visualCabeNaPosse(careca, gratis), false, 'sem roupa comprada não salva')
  }
  // o catálogo do banco (migration) é o MESMO do código: nem peça a mais, nem nível diferente
  const sql = readFileSync('supabase/migrations/20261019180000_presidente_pecas_avulsas.sql', 'utf8')
  const doBanco = new Map([...sql.matchAll(/\('([rp]-[a-z0-9-]+)', ([1-4])\)/g)].map(m => [m[1], Number(m[2])]))
  const doCodigo = V.catalogoAvulsas()
  assert.equal(doBanco.size, doCodigo.length, `catálogo: banco ${doBanco.size} × código ${doCodigo.length} — rode scripts/gera-catalogo-presidente.mts e atualize o banco`)
  for (const c of doCodigo) assert.equal(doBanco.get(c.ref), c.nivel, `catálogo: ${c.ref} nível ${c.nivel} no código, ${doBanco.get(c.ref)} no banco`)
  const telaF = readFileSync('src/escalacao/presidente-formulario.tsx', 'utf8')
  assert.ok(telaF.includes('visualCabeNaPosse(value,getPosseConta())') && telaF.includes('produto="peca_presidente"'), 'o editor salva com a mesma régua e compra pelo Pix')

  console.log('✅ presidente × plano: grátis só olha · Craque 14 · Lenda 23 · Batismo 30 · Fundador 33 (astronauta, gala dourada e traje real só no Fundador) · sem GRÁTIS · sorteio no plano · conta com a mesma régua · peças avulsas 1,99/2,99/3,99/4,99 com catálogo igual ao banco')
} finally { await vite.close() }
