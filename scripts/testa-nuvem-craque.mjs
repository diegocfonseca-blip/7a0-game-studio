// ☁️ trava da NUVEM (07/10 → 26/10). 26/10 (Diego): a conta GRÁTIS também salva na nuvem, mas SEM PLANO a carreira tem prazo:
// 7 dias sem apertar Salvar e ela sai da nuvem (o banco faz: `esc_nuvem_gratis_limpa`, migration 20261026…). No 1º salvamento
// a conta sem plano é avisada do prazo. Quem tem plano não tem prazo.
//   npm run nuvem-craque
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createServer } from 'vite'
const vite = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom', logLevel: 'silent' })
try {
  const { nuvemAceita, nuvemSemPlano } = await vite.ssrLoadModule('/src/escalacao/store.tsx')
  const gratis = { pago: false, seeds: [111, 222] }
  assert.equal(nuvemAceita(gratis, 999), true, 'grátis: carreira nova também sobe (com prazo de 7 dias)')
  assert.equal(nuvemAceita({ pago: true, seeds: [] }, 999), true, 'pagante: sobe tudo')
  assert.equal(nuvemAceita(null, 999), true, 'sem resposta do banco: sobe como sempre')
  assert.equal(nuvemSemPlano(gratis), true, 'grátis = conta sem plano (tem prazo)')
  assert.equal(nuvemSemPlano({ pago: true, seeds: [] }), false, 'quem paga não tem prazo')
  assert.equal(nuvemSemPlano(null), false, 'banco mudo: não avisa prazo nenhum')
  const src = readFileSync('src/escalacao/store.tsx', 'utf8')
  const fn = src.slice(src.indexOf('export async function savePyramidCloud'), src.indexOf('export type SubidaNuvem'))
  assert.ok(fn.includes("'nuvem7'"), 'o salvar diz quando foi uma conta sem plano (pra tela avisar do prazo)')
  const ps = readFileSync('src/escalacao/pyramidseason.tsx', 'utf8')
  assert.ok(ps.includes("'salvo_7d'") && ps.includes('esc-teste5d-visto'), 'a tela avisa do teste de 5 dias no 1º salvamento')
  assert.ok(readFileSync('src/escalacao/nuvem-planos.tsx', 'utf8').includes('Seus primeiros 5 dias salvando a carreira são grátis'), 'a janela tem o texto do Diego (08/11)')
  // 🎁 08/11: teste de 5 dias — começa no 1º Salvar OU no 1º salvamento automático; acabou = bloqueado (nada é apagado)
  assert.ok(src.includes('export const SALVAR_TESTE_5D = true') && src.includes('TESTE_SALVAR_DIAS = 5'), 'teste de 5 dias ligado')
  assert.ok(fn.includes('iniciaTesteSalvar'), 'o Salvar de quem não tem plano começa/consulta o teste')
  assert.ok(src.includes('comecaTesteNoAparelho()'), 'o salvamento automático no aparelho também começa o teste')
  const sql = readFileSync('docs/sql/salvar-teste-5-dias.sql', 'utf8')
  assert.ok(sql.includes("interval '5 days'") && sql.includes('esc-nuvem-gratis-1d'), 'banco: 5 dias por conta e o "apaga em 1 dia" desligado')
  console.log('✅ nuvem: grátis salva 5 dias (começa no 1º salvamento) · depois só com plano, nada apagado · pagante sem prazo')
} finally { await vite.close() }
