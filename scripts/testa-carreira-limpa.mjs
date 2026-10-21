#!/usr/bin/env node
// ─── 🧼 TRAVA: a CARREIRA nasce limpa — nada da partida rápida nem da sala online entra nela (21/10) ──────────────────
// Diego, depois que a carreira nova de um amigo abriu no PREGÃO ABERTO de uma partida rápida anterior: *"partida rápida
// não tem relação com modo carreira, que também não tem relação com salas online… absurdo isso"*.
// Reprova se: (1) START_CAREER_SOLO (ou o "virar carreira") não chamar `limpaMarcasDeModo`; (2) aparecer uma escolha NOVA
// no START (rápido) ou no START_ONLINE (sala) que a carreira não zera e que não está na lista de coisas neutras abaixo.
//   uso: npm run carreira-limpa
import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'

const src = readFileSync('src/escalacao/store.tsx', 'utf8')
const bloco = (nome, linhas) => { const i = src.indexOf(`    case '${nome}': {`); assert.ok(i >= 0, `não achei o ${nome}`); return src.slice(i, i + linhas) }
const campos = txt => new Set([...txt.matchAll(/\bs\.([a-zA-Z0-9_]+)\s*=(?!=)/g)].map(m => m[1]))
const marcas = new Set([...src.match(/export const MARCAS_DE_MODO = \[([\s\S]*?)\]/)[1].matchAll(/'([^']+)'/g)].map(m => m[1]))

const carreira = bloco('START_CAREER_SOLO', 12000)
assert.ok(/limpaMarcasDeModo\(s\)/.test(carreira.slice(0, 600)), 'START_CAREER_SOLO tem que começar chamando limpaMarcasDeModo(s)')
const fimDaCarreira = campos(carreira.slice(0, carreira.indexOf("\n    case '", 10)))

// o que o rápido e a sala gravam e NÃO é escolha de modo (é a própria carreira refazendo, ou sessão/aparelho)
const NEUTROS = new Set(['careerEmpresario', 'careerEmpresarioClaims', 'careerFilials', 'careerIntent', 'careerLedgers', 'careerRivalCount',
  'careerRivals', 'convocacaoDeadline', 'convocacaoDuplaFeitos', 'convocacaoEscolhas', 'convocacaoFeitos', 'cpuAtkAdj', 'cpuDefAdj',
  'nbaCareer', 'nbaTier', 'simSpeed', 'sport', 'screen'])
const faltam = []
for (const nome of ['START', 'START_ONLINE']) {
  const b = bloco(nome, 20000)
  for (const k of campos(b.slice(0, b.indexOf("\n    case '", 10)))) if (!fimDaCarreira.has(k) && !marcas.has(k) && !NEUTROS.has(k)) faltam.push(`${nome}: s.${k}`)
}
assert.deepEqual(faltam, [], `escolha de modo que a carreira não zera — entra em MARCAS_DE_MODO (store.tsx) ou, se for neutra, em NEUTROS aqui:\n  ${faltam.join('\n  ')}`)
assert.ok(marcas.has('pregaoAberto') && marcas.has('holandes') && marcas.has('auctionSecs'), 'pregão aberto, Tocaia e tempo do leilão têm que estar na lista')
assert.ok(/!state\.careerOnline\) \{ abrePregaoAberto/.test(src), 'trava do leilão: carreira nunca abre pregão aberto')
console.log(`✅ carreira nasce limpa: ${marcas.size} marcas de modo zeradas · leilão da carreira nunca abre pregão aberto/Tocaia`)
