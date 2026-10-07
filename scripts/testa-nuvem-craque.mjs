// ☁️⭐ trava da NUVEM SÓ PRO CRAQUE (07/10): conta grátis só sobe carreira que JÁ estava na nuvem;
// pagante sobe tudo; sem resposta do banco sobe como sempre; e a tela lê a MESMA régua do salvar.
//   npm run nuvem-craque
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createServer } from 'vite'
const vite = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom', logLevel: 'silent' })
try {
  const { nuvemAceita } = await vite.ssrLoadModule('/src/escalacao/store.tsx')
  const gratis = { pago: false, seeds: [111, 222] }
  assert.equal(nuvemAceita(gratis, 111), true, 'grátis: carreira que já estava na nuvem continua subindo')
  assert.equal(nuvemAceita(gratis, 999), false, 'grátis: carreira NOVA fica no aparelho')
  assert.equal(nuvemAceita({ pago: true, seeds: [] }, 999), true, 'pagante: sobe tudo')
  assert.equal(nuvemAceita(null, 999), true, 'sem resposta do banco: sobe como sempre (nunca tira a nuvem de quem paga)')
  const src = readFileSync('src/escalacao/store.tsx', 'utf8')
  const fn = src.slice(src.indexOf('export async function savePyramidCloud'), src.indexOf('export type SubidaNuvem'))
  assert.ok(fn.includes("return 'aparelho'"), 'carreira nova de grátis não sobe')
  assert.ok(fn.includes('.filter(liberada)'), 'o pacote da nuvem só leva carreira liberada (nunca uma nova do arquivo)')
  const ps = readFileSync('src/escalacao/pyramidseason.tsx', 'utf8')
  assert.ok(ps.includes("estado: 'so_aparelho'") && ps.includes('soAparelhoPe'), 'a tela avisa (faixa da Central e o Sair e salvar)')
  assert.ok(readFileSync('src/escalacao/screens.tsx', 'utf8').includes("a === 'nuvem'"), 'o botão ⭐ Craque abre todos os planos')
  console.log('✅ nuvem só pro Craque: grátis sobe só o que já estava lá · pagante tudo · banco mudo = como sempre · tela avisa')
} finally { await vite.close() }
