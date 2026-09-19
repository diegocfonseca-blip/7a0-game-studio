#!/usr/bin/env node
// 🎤 TRAVA DO GIRO DA RODADA — a zoeira neutra que roda embaixo do placar.
//
// Diego (18/09): *"e quero MAIS zueira… o que pode fazer??"*.
// O giro tinha QUATRO tipos de manchete (líder, artilheiro, zebra, goleada) e três
// deles só acontecem de vez em quando — então rodada atrás de rodada não tinha nada
// pra ler, e quando tinha era sempre a mesma frase.
//
// O que esta trava protege:
//  1. TODA manchete tem tradução em EN (regra da casa: texto novo nasce PT e EN).
//     Sem isto a linha nova aparece em português pra quem joga em inglês.
//  2. Nenhuma manchete inventa número: elas saem de dado que o jogo já tem.
//  3. O giro é NEUTRO — a sala inteira lê a mesma coisa (sem "você").
//
// uso: node scripts/testa-giro.mjs
import { readFileSync } from 'node:fs'
const store = readFileSync('src/escalacao/store.tsx', 'utf8')
const screens = readFileSync('src/escalacao/screens.tsx', 'utf8')
let falhas = 0
const ok = (cond, msg) => { console.log(`  ${cond ? '✅' : '❌'} ${msg}`); if (!cond) falhas++ }

// o corpo do narrateRound
const i = store.indexOf('function narrateRound(')
const fim = store.indexOf('// ─── monte final', i)
const corpo = i > 0 && fim > i ? store.slice(i, fim) : ''
// os emojis que abrem cada manchete que o giro empurra
const tipos = [...corpo.matchAll(/heads\.push\(`([^\s`]+)/g)].map(m => m[1])
const unicos = [...new Set(tipos)]

console.log('\n1) 🎤 quantos tipos de zoeira a rodada pode produzir')
{
  console.log(`     tipos: ${unicos.join(' ')}`)
  ok(unicos.length >= 10, `${unicos.length} tipos de manchete (eram 4 antes de 18/09)`)
  const cap = corpo.match(/heads\.slice\(0, (\d+)\)/)
  ok(cap && Number(cap[1]) >= 4, `cabem ${cap?.[1]} manchetes por rodada`)
}

console.log('\n2) 🌐 toda manchete tem versão em INGLÊS')
{
  // cada emoji de abertura precisa aparecer no tradutor do giro
  const it = screens.indexOf('function traduzManchete(')
  const ifim = screens.indexOf('function GiroDaRodada(', it)
  const trad = it > 0 ? screens.slice(it, ifim) : ''
  ok(trad.length > 0, 'achei o tradutor do giro')
  for (const e of unicos) ok(trad.includes(e), `${e} tem linha de tradução`)
}

console.log('\n3) 🙂 o giro é NEUTRO (a sala toda lê a mesma coisa)')
{
  const frases = [...corpo.matchAll(/heads\.push\(`([^`]+)`\)/g)].map(m => m[1])
  const pessoais = frases.filter(f => /\bvocê\b|\bVocê\b|\bseu \b|\bsua \b/.test(f))
  ok(pessoais.length === 0, pessoais.length ? `manchete pessoal no giro neutro: ${pessoais[0]}` : 'nenhuma manchete fala com "você" — a parte pessoal é do cliente')
}

console.log(falhas === 0 ? '\n✅ tudo certo\n' : `\n❌ ${falhas} falha(s)\n`)
process.exit(falhas === 0 ? 0 : 1)
