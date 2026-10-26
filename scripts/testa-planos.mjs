// 💳 trava dos PLANOS V2 (08/10): Gratuito · ⭐ Craque completo R$ 9,90/mês (14/10; era 12,90) · 🖋 Batismo Lenda R$ 69,90 ·
// 🖋✨ Batismo Plus R$ 89,90. Confere as regras puras (planos-regras.ts), que a tela e o banco seguem,
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
  assert.equal(R.PRECOS.craqueMensal, 9.9); assert.equal(R.PRECOS.batismoLenda, 79.9); assert.equal(R.PRECOS.batismoPlus, 89.9)
  assert.equal(R.precoTxt(89.9), 'R$ 89,90'); assert.equal(R.precoTxt(9.9, true), 'R$ 9.90')

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

  // ⭐📅 26/10: Craque MENSAL da Vendria (Salas 9,90 · Completo 14,90)
  const salas = D({ mensal_plano: 'craque_salas', mensal_ate: '2026-11-08T12:00:00Z', tier: 'prata', salas_pagas: true, pago: true })
  assert.equal(R.tierEfetivo(null, salas), 'prata', 'Craque Salas: nome prata')
  assert.equal(R.temManual(null, false, salas), false, 'Craque Salas: SEM Modo Manual')
  assert.equal(R.podeCriarModo('liga', null, salas), true, 'Craque Salas: cria Minhas Ligas')
  const completo = D({ mensal_plano: 'craque_completo', mensal_ate: '2026-11-08T12:00:00Z', tier: 'prata', manual: true, salas_pagas: true, pago: true })
  assert.equal(R.tierEfetivo(null, completo), 'prata', 'Craque Completo: nome prata')
  assert.equal(R.temManual(null, false, completo), true, 'Craque Completo: Modo Manual')
  assert.equal(R.temManual(null, false, D({ mensal_plano: 'craque_completo' })), true, 'Craque Completo: Manual mesmo se o campo manual faltar')
  assert.equal(R.tierEfetivo('ouro', salas), 'ouro', 'quem já é Lenda e assina continua ouro (não muda nada)')
  assert.equal(R.temManual('prata', false, salas), true, 'Craque antigo que assina o Salas não perde o Manual que já tinha')
  assert.equal(R.tierEfetivo(null, D({ mensal_plano: 'qualquer' })), null, 'plano mensal desconhecido não libera nada')
  assert.equal(R.tierEfetivo(null, D({ mensal_ate: '2026-11-08T12:00:00Z' })), null, 'sem plano ativo (vencido) não libera nada')

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
  // os dois batismos moram em `CartoesBatismo` (13/10), que a vitrine chama DEPOIS do Sócio — e a pública também usa
  const ordem = ['support-gratis', 'support-craque', 'CartoesBatismo batismoPlano'].map(id => id.startsWith('Cartoes') ? vit.indexOf(`<${id}`) : vit.indexOf(`id="${id}"`))
  assert.ok(ordem.every(i => i > 0) && ordem.every((v, i) => i === 0 || v > ordem[i - 1]), 'ordem: Gratuito, Sócio, os dois Batismos')
  assert.ok(vit.indexOf('id="support-batismo"') < vit.indexOf('id="support-plus"'), 'ordem: Batismo antes do Batismo Lenda')
  assert.ok(vit.includes("QUERO O BATISMO · ${reais(PRECOS_UNICO.batismo)}") && vit.includes("QUERO SER FUNDADOR · ${reais(PRECOS_UNICO.fundador)}") && vit.includes('<UmaVezSo />'), 'nomes: Batismo e Fundador (14/10)')
  assert.ok(readFileSync('src/escalacao/support-plans.tsx', 'utf8').includes('<CartoesBatismo onNaming={p.onNaming}'), 'a vitrine pública usa os mesmos cartões')
  for (const p of ['R$ 9,90', 'R$ 0']) assert.ok(vit.includes(`"${p}"`), `preço à vista: ${p}`)
  // 💳 14/10 (Diego): planos de UMA VEZ SÓ na vitrine pública — 29,90 · 49,90 · 79,90 · 99,90, subida = só a diferença
  // 17/10 (Diego): Lenda 49,90 → 44,90
  assert.deepEqual({ ...R.PRECOS_UNICO }, { craque: 29.9, lenda: 44.9, batismo: 79.9, fundador: 99.9 })
  // subir = diferença + R$ 5 (Diego 14/10)
  assert.equal(R.precoSubida('lenda', 'craque'), 20)
  assert.equal(R.precoSubida('batismo', 'craque'), 55)
  assert.equal(R.precoSubida('batismo', 'lenda'), 40)
  assert.equal(R.precoSubida('fundador', 'lenda'), 60)
  assert.equal(R.precoSubida('fundador', 'craque'), 75)
  assert.equal(R.precoSubida('fundador', 'batismo'), 29.9, 'Batismo → Fundador = 29,90 fixo (17/10)')
  assert.equal(R.PRECOS_DUPLO.lenda, 80.9, 'duplo do Lenda: 2 × 44,90 − 10%')
  assert.equal(R.precoSubida('craque', null), 29.9, 'sem plano paga o preço cheio, sem taxa')
  assert.equal(R.precoSubida('craque', 'fundador'), 0, 'descer de plano nunca vira crédito')
  assert.equal(R.planoAtual({ batismoPlano: 'plus' }, 'ouro'), 'fundador')
  assert.equal(R.planoAtual({ batismoPlano: 'antigo' }, 'ouro'), 'batismo')
  assert.equal(R.planoAtual(null, 'ouro'), 'lenda')
  assert.equal(R.planoAtual(null, 'prata'), 'craque')
  assert.equal(R.planoAtual(null, 'bege'), null)
  const pub = readFileSync('src/escalacao/support-plans.tsx', 'utf8')
  assert.ok(!pub.includes('R$ 4,90/mês') && !pub.includes('R$ 2,90/mês'), 'o Sócio (mensal) saiu da vitrine pública')
  for (const velho of ['R$ 19,90', 'R$ 39,90', 'R$ 59,90', 'R$ 2,90/MÊS', 'R$ 4,90/MÊS']) assert.ok(!vit.includes(velho), `oferta velha fora da vitrine: ${velho}`)
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
