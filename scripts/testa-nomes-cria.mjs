#!/usr/bin/env node
// 🌱 NOME DO CRIA DA BASE — nunca mais "Cotoco 33º".
//
// Cobrança do Diego (15/09): *"não gostei desses nomes Cotoco 33, Pimentinha 25, não
// ficou bom desse jeito, parecem robôs pow… até porque o jogador não foi vendido do time,
// ele é o mesmo da base de sempre"*.
//
// Era o CONTADOR aparecendo na cara de quem joga: a lista tem 30 nomes e, acabados, o
// código colava o número. Agora vem apelido de várzea — e esta trava garante que:
//   · nenhum nome sai com número
//   · ninguém repete dentro da mesma carreira
//   · nome que já tem duas palavras não ganha apelido ("Zé Pequeno da Base do Morro")
//   · as 3 opções que a tela oferece vêm sempre diferentes entre si
//
// uso: node scripts/testa-nomes-cria.mjs     (sai com código 1 se reprovar)
import { createServer } from 'vite'
const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error', optimizeDeps: { noDiscovery: true } })
const { proximoNomeCria, previewCriaNomes } = await vite.ssrLoadModule('/src/escalacao/store.tsx')
const { CRIA_NOMES, CRIA_APELIDOS } = await vite.ssrLoadModule('/src/escalacao/data.ts')
let falhas = 0
const ok = (c, m) => { console.log(`  ${c ? '✅' : '❌'} ${m}`); if (!c) falhas++ }
const rng = (() => { let x = 12345; return () => { x = (x * 1103515245 + 12345) & 0x7fffffff; return x / 0x7fffffff } })()

// gera 120 crias seguidas numa MESMA carreira e olha o que sai
const usados = new Set()
const saida = []
for (let i = 0; i < 120; i++) { const n = proximoNomeCria(usados, rng); usados.add(n); saida.push(n) }
console.log('\nOs 30 primeiros (nome solto, como sempre foi):')
console.log('  ' + saida.slice(0, 30).join(' · '))
console.log('\nDo 31º em diante (onde antes vinha "Cotoco 33º"):')
console.log('  ' + saida.slice(30, 54).join(' · '))
console.log('')
ok(new Set(saida).size === 120, 'os 120 nomes são todos diferentes — ninguém repete na carreira')
ok(!saida.some(n => /\d/.test(n)), 'NENHUM nome tem número (era o "Cotoco 33º")')
ok(saida.slice(0, 30).every(n => CRIA_NOMES.includes(n)), 'os 30 primeiros continuam sendo os nomes soltos de sempre')
ok(saida.slice(30).every(n => CRIA_APELIDOS.some(a => n.endsWith(' ' + a))), 'do 31º em diante, todos terminam em apelido de várzea')
ok(!saida.some(n => n.startsWith('Zé Pequeno da Base ') || n.startsWith('Juninho Pipoca ')), 'nome que já tem duas palavras não ganha apelido (nada de "Zé Pequeno da Base do Morro")')
// a tela mostra 3 opções: nunca podem vir repetidas
const tres = previewCriaNomes([...usados], rng, 3)
ok(new Set(tres).size === 3 && !tres.some(n => usados.has(n)), `as 3 opções da tela vêm diferentes e inéditas: ${tres.join(' · ')}`)
// quantos nomes existem antes de precisar de número
const soltos = CRIA_NOMES.length, combos = CRIA_NOMES.filter(n => !n.includes(' ')).length * CRIA_APELIDOS.length
console.log(`\n  📊 ${soltos} nomes soltos + ${combos} com apelido = ${soltos + combos} antes de qualquer número`)
ok(soltos + combos > 600, 'mais de 600 nomes — na prática o número nunca aparece')
console.log(falhas === 0 ? '\n✅ tudo certo\n' : `\n❌ ${falhas} falha(s)\n`)
await vite.close(); process.exit(falhas ? 1 : 0)
