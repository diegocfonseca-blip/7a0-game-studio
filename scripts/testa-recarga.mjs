#!/usr/bin/env node
// ─── 🔄 TRAVA: pedaço que sumiu recarrega UMA VEZ, nunca duas ────────────────
//
// O que esta trava protege (24/09): quando a gente publica no meio da partida,
// o arquivo de um pedaço do jogo (Loja do Clube, Copa da liga) some do servidor
// e a tela de quem está com o jogo aberto CAI. Agora a página se recarrega
// sozinha — mas **uma vez só**, que é ordem do Diego: *"ok mas no máximo uma vez
// hein"*. Duas recargas viram pisca-pisca e o jogador nunca vê o que houve.
//
// uso: node scripts/testa-recarga.mjs
import { readFileSync } from 'node:fs'
import ts from 'typescript'
import vm from 'node:vm'
import assert from 'node:assert/strict'

const src = readFileSync('src/escalacao/recarga.ts', 'utf8')
const js = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText

// 🧪 navegador de mentira: guarda a marca e conta as recargas
let recargas = 0
const loja = new Map()
const contexto = {
  exports: {},
  sessionStorage: {
    getItem: k => (loja.has(k) ? loja.get(k) : null),
    setItem: (k, v) => loja.set(k, String(v)),
  },
  location: { reload: () => { recargas++ } },
}
vm.runInNewContext(js, contexto)
const { recarregaUmaVez, ehPedacoQueSumiu, pedaco } = contexto.exports

const falhas = []
const ok = (c, m) => { if (!c) falhas.push(m) }

// 1) reconhece a frase de cada navegador
ok(ehPedacoQueSumiu(new Error('Failed to fetch dynamically imported module: https://x/assets/salao-ab12.js')), 'não reconheceu o erro do Chrome')
ok(ehPedacoQueSumiu(new Error('Importing a module script failed.')), 'não reconheceu o erro do Safari/iOS')
ok(ehPedacoQueSumiu(new Error('Unable to preload CSS for /assets/salao-x.css')), 'não reconheceu a falha do CSS do pedaço')
// 2) e NÃO confunde com bug de verdade
ok(!ehPedacoQueSumiu(new Error("Cannot read properties of undefined (reading 'squad')")), '⚠️ confundiu bug de verdade com pedaço que sumiu — isso esconderia erro real')

// 3) a regra principal: recarrega na 1ª, NUNCA na 2ª
recargas = 0
ok(recarregaUmaVez(new Error('Failed to fetch dynamically imported module: /assets/salao-1.js')) === true, 'a 1ª falha não recarregou')
ok(recarregaUmaVez(new Error('Failed to fetch dynamically imported module: /assets/salao-1.js')) === false, '⚠️ RECARREGOU DUAS VEZES — o Diego pediu no máximo UMA')
ok(recarregaUmaVez(new Error('Importing a module script failed.')) === false, '⚠️ recarregou de novo com outra frase — a marca tem que valer pra qualquer pedaço')
ok(recargas === 1, `recarregou ${recargas} vez(es); tem que ser exatamente 1`)

// 4) bug de verdade nunca recarrega (senão a gente esconde o problema)
loja.clear(); recargas = 0
ok(recarregaUmaVez(new Error("Cannot read properties of undefined")) === false, 'bug de verdade não pode recarregar')
ok(recargas === 0, 'bug de verdade disparou recarga')

// 5) o embrulho do lazy: engole a falha (a página está indo) e deixa bug passar
loja.clear(); recargas = 0
const some = pedaco(() => Promise.reject(new Error('Failed to fetch dynamically imported module: /assets/salao-2.js')))
let resolveu = false
some().then(() => { resolveu = true }, () => { resolveu = true })
await new Promise(r => setTimeout(r, 30))
ok(recargas === 1, 'o embrulho do lazy não recarregou quando o pedaço sumiu')
ok(!resolveu, 'o embrulho devolveu resultado em vez de esperar a página recarregar')

const bug = pedaco(() => Promise.reject(new Error('boom de verdade')))
let subiu = false
await bug().catch(() => { subiu = true })
ok(subiu, 'bug de verdade tem que subir pra tela de erro, não sumir')

console.log('\n🔄 PEDAÇO QUE SUMIU · recarrega uma vez\n')
if (falhas.length) { for (const f of falhas) console.log(`   🔴 ${f}`); console.log(`\n❌ ${falhas.length} problema(s).\n`); process.exit(1) }
console.log('   ✅ reconhece a frase dos três navegadores e não confunde com bug de verdade')
console.log('   ✅ recarrega na 1ª falha e NUNCA na 2ª (ordem do Diego: no máximo uma)')
console.log('   ✅ bug de verdade continua indo pra tela de erro\n✅ tudo certo\n')
