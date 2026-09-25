#!/usr/bin/env node
// ─── 🧊 TRAVA: depois do apito, o passado não muda ──────────────────────────
//
// Caso do Futpoint FC (23/09): ele não tinha ganhado nada, foi na janela de
// empréstimo buscar o Roberto Carlos na SAF e o jogo passou a dizer que ele era
// campeão das duas copas; mexeu de novo e virou campeão da LIGA. A tela refaz as
// 38 rodadas a partir do elenco de AGORA, e mexer no elenco depois do apito
// reescrevia a temporada inteira.
//
// Esta trava prova as três coisas que importam:
//   1. temporada rolando → o valor vivo passa (nada congela cedo demais);
//   2. depois do apito → mexer no elenco NÃO muda mais o resultado;
//   3. temporada nova → a foto velha é jogada fora (senão a T7 mostraria a T6).
//
// uso: node scripts/testa-congela.mjs
import { readFileSync } from 'node:fs'
import ts from 'typescript'
import vm from 'node:vm'

const js = ts.transpileModule(readFileSync('src/escalacao/congela-temporada.ts', 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
const ctx = { exports: {} }
vm.runInNewContext(js, ctx)
const { congelaNoApito } = ctx.exports

const falhas = []
const ok = (c, m) => { if (!c) falhas.push(m) }

// 🎬 a história do Futpoint, passo a passo
const caixa = { current: null }
let campeao = 'ninguem'                                   // ele não tinha ganhado nada
ok(congelaNoApito(caixa, false, 6, campeao) === 'ninguem', 'com a temporada rolando, o valor vivo tem que passar')

// apito final: a temporada 6 termina com ele sem título
ok(congelaNoApito(caixa, true, 6, campeao) === 'ninguem', 'no apito, a foto tem que ser o que estava na tela')

// ... e agora ele vai na janela de empréstimo buscar o R. Carlos na SAF
campeao = 'Futpoint FC campeao das 2 copas'
ok(congelaNoApito(caixa, true, 6, campeao) === 'ninguem',
  '🔴 MEXER NO ELENCO DEPOIS DO APITO AINDA MUDA O CAMPEÃO — é exatamente o bug do Futpoint')
campeao = 'Futpoint FC campeao da liga'
ok(congelaNoApito(caixa, true, 6, campeao) === 'ninguem', '🔴 a segunda mexida também mudou o campeão')

// 🔄 temporada NOVA: a foto da 6 não pode vazar pra 7
ok(congelaNoApito(caixa, false, 7, 'temporada 7 rolando') === 'temporada 7 rolando', 'a temporada nova ficou presa na foto velha')
ok(congelaNoApito(caixa, true, 7, 'campeao da 7') === 'campeao da 7', 'a temporada 7 não tirou foto própria')
ok(congelaNoApito(caixa, true, 7, 'outro qualquer') === 'campeao da 7', 'a foto da 7 não segurou')

// 🛟 e a foto tem que aguentar a tela redesenhar mil vezes sem mudar
const caixa2 = { current: null }
congelaNoApito(caixa2, true, 9, 'primeiro')
let firme = true
for (let i = 0; i < 500; i++) if (congelaNoApito(caixa2, true, 9, 'lixo ' + i) !== 'primeiro') firme = false
ok(firme, 'a foto mudou em algum dos 500 redesenhos da tela')

console.log('\n🧊 DEPOIS DO APITO, O PASSADO NÃO MUDA\n')
if (falhas.length) { for (const f of falhas) console.log(`   🔴 ${f}`); console.log(`\n❌ ${falhas.length} problema(s).\n`); process.exit(1) }
console.log('   ✅ temporada rolando passa o valor vivo (nada congela cedo demais)')
console.log('   ✅ mexer no elenco depois do apito NÃO muda mais campeão, copa nem artilheiro')
console.log('   ✅ temporada nova joga a foto velha fora e tira a sua')
console.log('   ✅ 500 redesenhos da tela e a foto não se mexeu\n✅ tudo certo\n')
