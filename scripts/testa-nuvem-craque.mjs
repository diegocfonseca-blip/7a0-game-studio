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
  assert.ok(ps.includes("'salvo_7d'") && ps.includes('esc-nuvem7-visto'), 'a tela avisa do prazo no 1º salvamento')
  assert.ok(readFileSync('src/escalacao/nuvem-planos.tsx', 'utf8').includes('7 dias sem salvar'), 'a janela explica os 7 dias')
  const sql = readFileSync('supabase/migrations/20261026020000_nuvem_gratis_7_dias.sql', 'utf8')
  assert.ok(sql.includes("interval '7 days'") && sql.includes("->> 'pago'"), 'o banco só tira da nuvem quem NÃO tem plano, depois de 7 dias')
  console.log('✅ nuvem: grátis sobe (prazo de 7 dias, avisado no 1º salvamento) · pagante sem prazo · banco mudo = como sempre')
} finally { await vite.close() }
