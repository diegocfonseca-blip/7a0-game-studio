// 💳 trava dos PLANOS V2 (08/10): Gratuito · ⭐ Craque completo R$ 12,90/mês · 🖋 Batismo Lenda R$ 69,90 ·
// 🖋✨ Batismo Plus R$ 79,99. Confere as regras puras (planos-regras.ts), que a tela e o banco seguem,
// e que a vitrine mostra os 4 planos na ordem certa com os textos que o Diego pediu.
// O lado do BANCO tem o teste dele: docs/sql/testa-planos-v2.sql (20 cenários, desfeito no fim).
//   npm run planos
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createServer } from 'vite'
const vite = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom', logLevel: 'silent' })
try {
  const R = await vite.ssrLoadModule('/src/escalacao/planos-regras.ts')
  const agora = Date.parse('2026-10-08T12:00:00Z')
  const base = { tier_legado: null, fundador: false, socio_ativo: false, batismo: false, batismo_plano: null, plus: false, craque_ativo: false, craque_ate: null, craque_cancelada: false, tier: null, manual: false, salas_pagas: false, pago: false, pedido: null }
  const D = o => R.lerDireitos({ ...base, ...o })

  // preços
  assert.equal(R.PRECOS.craqueMensal, 12.9); assert.equal(R.PRECOS.batismoLenda, 69.9); assert.equal(R.PRECOS.batismoPlus, 79.99)
  assert.equal(R.precoTxt(79.99), 'R$ 79,99'); assert.equal(R.precoTxt(12.9, true), 'R$ 12.90')

  // gratuito
  const free = D({})
  assert.equal(R.tierEfetivo(null, free), null, 'grátis: sem cor paga')
  assert.equal(R.temManual(null, false, free), false, 'grátis: sem Modo Manual')
  assert.equal(R.fichasDoPlano(null, false), 1, 'grátis: 1 carreira')
  assert.equal(R.podeCriarModo('rapido', null, free), true, 'grátis: cria sala rápida (não restringir nesta etapa)')
  assert.equal(R.podeEntrarModo('liga'), true, 'grátis: entra na liga de um pagante')
  assert.equal(R.podeEntrarModo('carreira'), true, 'grátis: convidado nunca paga')

  // pedido do mensal NÃO libera nada
  const pedido = D({ pedido: { status: 'novo', criado_em: '2026-10-08' } })
  assert.equal(R.tierEfetivo(null, pedido), null, 'deixar o WhatsApp não libera nada')
  assert.equal(pedido.pedido?.status, 'novo')

  // Craque ativo
  const ativo = D({ craque_ativo: true, craque_ate: '2026-11-08T12:00:00Z', tier: 'ouro', manual: true, salas_pagas: true, pago: true })
  assert.equal(R.tierEfetivo(null, ativo), 'ouro', 'Craque ativo: visual premium')
  assert.equal(R.temManual(null, false, ativo), true, 'Craque ativo: Modo Manual')
  assert.equal(R.fichasDoPlano(R.tierEfetivo(null, ativo), false), 4, 'Craque ativo: 4 carreiras')
  assert.equal(R.podeCriarModo('liga', null, ativo), true, 'Craque ativo: cria Minhas Ligas')
  assert.equal(R.situacaoCraque(ativo, agora), 'ativo')

  // cancelado mas no prazo
  const cancel = D({ craque_ativo: true, craque_ate: '2026-11-08T12:00:00Z', craque_cancelada: true, tier: 'ouro', manual: true, salas_pagas: true, pago: true })
  assert.equal(R.situacaoCraque(cancel, agora), 'cancelado_no_prazo')
  assert.equal(R.tierEfetivo(null, cancel), 'ouro', 'cancelado no prazo continua Craque')

  // vencido
  const venc = D({ craque_ate: '2026-10-01T12:00:00Z' })
  assert.equal(R.situacaoCraque(venc, agora), 'vencido')
  assert.equal(R.tierEfetivo(null, venc), null, 'vencido: volta pro grátis')
  assert.equal(R.podeCriarModo('liga', null, venc), false, 'vencido: não cria liga nova (as que existem ficam)')

  // vencido + Craque/Lenda antigos permanentes
  assert.equal(R.tierEfetivo('prata', D({ tier_legado: 'prata', tier: 'prata', craque_ate: '2026-10-01T12:00:00Z' })), 'prata', 'Craque antigo fica com o antigo')
  assert.equal(R.tierEfetivo('ouro', D({ tier_legado: 'ouro', tier: 'ouro' })), 'ouro', 'Lenda antigo fica ouro')
  assert.equal(R.temManual('prata', false, null), true, 'Craque antigo mantém o Manual mesmo sem resposta do banco')

  // banco fora do ar NUNCA tira nada
  assert.equal(R.tierEfetivo('ouro', null), 'ouro')
  assert.equal(R.podeCriarModo('liga', 'ouro', null), true)
  assert.equal(R.podeCriarModo('liga', null, null, true), true, 'batismo antigo sem banco continua criando')

  // batismo antigo / Lenda / Plus
  const batAnt = D({ batismo: true, batismo_plano: 'antigo', tier_legado: 'ouro', tier: 'ouro', socio_ativo: true, manual: true, salas_pagas: true, pago: true })
  assert.equal(R.tierEfetivo('ouro', batAnt), 'ouro'); assert.equal(R.temExtrasPlus(batAnt), false, 'batismo antigo: gala padrão (sem Plus)')
  const batL = D({ batismo: true, batismo_plano: 'lenda', tier: 'ouro', manual: true, salas_pagas: true, pago: true })
  assert.equal(R.tierEfetivo(null, batL), 'ouro', 'Batismo Lenda: tudo do Craque pra sempre')
  assert.equal(R.temManual(null, false, batL), true)
  assert.equal(R.temExtrasPlus(batL), false, 'Batismo Lenda: gala padrão, sem canto')
  const batP = D({ batismo: true, batismo_plano: 'plus', plus: true, tier: 'ouro', manual: true, salas_pagas: true, pago: true })
  assert.equal(R.temExtrasPlus(batP), true, 'Batismo Plus: gala única + canto')

  // WhatsApp
  assert.equal(R.whatsappValido('(21) 99999-0000'), '21999990000')
  assert.equal(R.whatsappValido('123'), null)

  // lerDireitos nunca confia em lixo
  assert.equal(R.lerDireitos(null), null)
  assert.equal(R.lerDireitos({ tier: 'diamante', craque_ativo: 'sim' })?.tier, null)
  assert.equal(R.lerDireitos({ tier: 'diamante', craque_ativo: 'sim' })?.craqueAtivo, false)

  // limites de sala: os MESMOS números de antes (nada reduzido)
  assert.deepEqual([R.LIMITES_SALA.jogadores, R.LIMITES_SALA.jogadoresChampions, R.LIMITES_SALA.ligasPorPessoa, R.LIMITES_SALA.rapidasAbertas], [20, 36, 5, 2])

  // 🖼️ a vitrine: 4 planos, nesta ordem, com os textos do Diego
  const vit = readFileSync('src/escalacao/support-plans-v2.tsx', 'utf8')
  const ordem = ['support-gratis', 'support-craque', 'support-batismo', 'support-plus'].map(id => vit.indexOf(`id="${id}"`))
  assert.ok(ordem.every(i => i > 0) && ordem.every((v, i) => i === 0 || v > ordem[i - 1]), 'ordem: Gratuito, Craque, Batismo Lenda, Batismo Plus')
  assert.ok(vit.includes('Tudo do Craque, para sempre, sem mensalidade + seu clube personalizado.'), 'texto do Batismo Lenda')
  assert.ok(vit.includes('Tudo do Batismo Lenda + entrada de gala única e personalizada + canto de torcida na Carreira.'), 'texto do Plus')
  for (const p of ['R$ 12,90', 'R$ 69,90', 'R$ 79,99', 'R$ 0']) assert.ok(vit.includes(`"${p}"`), `preço à vista: ${p}`)
  for (const velho of ['R$ 19,90', 'R$ 39,90', 'R$ 59,90', 'R$ 2,90/MÊS', 'R$ 4,90/MÊS', 'R$ 9,90']) assert.ok(!vit.includes(velho), `oferta velha fora da vitrine: ${velho}`)
  assert.ok(vit.includes('continua com TUDO'), 'aviso pra quem já comprou')
  const scr = readFileSync('src/escalacao/apoie-v2.tsx', 'utf8')
  for (const velho of ['R$ 19,90', 'R$ 39,90', 'R$ 59,90']) assert.ok(!scr.includes(velho), `sem oferta velha na tela nova: ${velho}`)
  assert.ok(scr.includes("supabase.rpc('esc_pedir_craque'"), 'o mensal guarda o WhatsApp com a conta')
  assert.ok(!scr.includes("rpc('esc_admin_craque_pagamento'"), 'a tela do jogador nunca confirma pagamento (só o painel do Diego)')
  // 🔒 por enquanto SÓ as contas do Diego veem (ordem de 09/10); o resto do mundo segue no V1 intacto
  const sp = readFileSync('src/escalacao/sport.ts', 'utf8')
  assert.ok(/const PLANOS2_GERAL = false/.test(sp), 'planos v2 ainda fechado pros outros (PLANOS2_GERAL = false)')
  const scr1 = readFileSync('src/escalacao/screens.tsx', 'utf8')
  assert.ok(scr1.includes('usePlanos2() ? <ApoieButtonV2'), 'o botão escolhe V1/V2 pela conta')
  console.log('✅ planos v2: regras, vitrine e textos conferidos (só nas contas do Diego)')
} finally { await vite.close() }
