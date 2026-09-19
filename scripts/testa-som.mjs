#!/usr/bin/env node
// 🔊 TRAVA DO SOM DO JOGO — ambiente, gol e apito.
//
// Como o som ficou depois das decisões do Diego em 18 e 19/09:
//   🏟️ AMBIENTE → o arquivo que ELE mandou, em loop, em toda tela de partida
//   🥅 GOL      → o arquivo que ELE mandou (a opção B)
//   📣 APITO    → sintetizado, o de sempre, mas com REGRA: na largada de qualquer
//                 competição e em TODA partida de copa; na liga, só na 1ª rodada
// Palavras dele: *"quero só os áudios que eu mandei, do ambiente, gol, e o apito
// que você já tinha mesmo"* e *"quando for copa e sempre a primeira partida também…
// e qualquer copa nova ou liga… e vale também pro modo online, qualquer modo"*.
//
// O que esta trava protege, em ordem de perigo:
//  1. 🪶 PESO: o som de partida é ARQUIVO em `public/` (fora do bundle) e leve.
//     Se alguém empurrar um loop de estádio de 1 MB, ou embutir áudio em base64
//     no código, ela reprova — a regra de peso vale pro som igual vale pra arte.
//  2. 🔇 NINGUÉM LEVA SUSTO: o som nasce MUDO e é opt-in no botão 🔊.
//  3. 📣 A REGRA DO APITO MORA NUM LUGAR SÓ (`useApitoDeLargada`). Apito solto
//     numa tela = duas versões da regra, e uma delas envelhece errado.
//  4. 🏟️ NENHUMA TELA DE PARTIDA FICA MUDA. A Copa do Mundo ficou de fora do som
//     de 18/09 e ninguém notou por um dia — a tela dela é própria, não é a da liga.
//  5. 🥅 O GOL CONVIVE com a partida: um por vez, cortado no tamanho da rodada,
//     ausente no ⚡4× e com o ambiente abaixando por baixo dele.
//
// uso: node scripts/testa-som.mjs
import { readFileSync, readdirSync, statSync } from 'node:fs'
const som = readFileSync('src/escalacao/sound.ts', 'utf8')
const carreira = readFileSync('src/escalacao/pyramidseason.tsx', 'utf8')
const rapido = readFileSync('src/escalacao/screens.tsx', 'utf8')
const mundo = readFileSync('src/escalacao/copa-mundo.tsx', 'utf8')
let falhas = 0
const ok = (cond, msg) => { console.log(`  ${cond ? '✅' : '❌'} ${msg}`); if (!cond) falhas++ }

console.log('\n1) 🪶 peso: o som da partida é ARQUIVO, e fica leve e fora do bundle')
{
  // 🔁 MUDOU EM 19/09. Antes esta seção exigia que TUDO fosse sintetizado. O Diego
  // escolheu os áudios dele: *"quero só os áudios que eu mandei, do ambiente, gol,
  // e o apito que você já tinha mesmo"*. Então ambiente e gol agora SÃO arquivo —
  // e o que a trava protege deixou de ser "não pode arquivo" e passou a ser
  // "arquivo sim, mas leve e em `public/`, nunca embutido no código".
  const AMBIENTE = 'torcida-estadio-v1.mp3', GOL = 'gol-torcida-v1.mp3'
  const arqs = readdirSync('public/sfx').map(f => ({ f, kb: statSync(`public/sfx/${f}`).size / 1024 }))
  const acha = n => arqs.find(x => x.f === n)
  for (const [nome, teto] of [[AMBIENTE, 200], [GOL, 60]]) {
    const a = acha(nome)
    ok(!!a, `${nome} existe em public/sfx/`)
    ok(!!a && a.kb <= teto, a ? `${nome}: ${a.kb.toFixed(0)} KB (teto ${teto})` : `${nome} não medido`)
  }
  const somaPartida = [AMBIENTE, GOL].reduce((s, n) => s + (acha(n)?.kb ?? 0), 0)
  ok(somaPartida <= 250, `o som de partida inteiro pesa ${somaPartida.toFixed(0)} KB (teto 250) — e só baixa pra quem liga o 🔊`)
  const gordo = arqs.find(x => x.kb > 200)
  ok(!gordo, gordo ? `⚠️ ${gordo.f} tem ${gordo.kb.toFixed(0)} KB` : `os ${arqs.length} sons de arquivo somam ${arqs.reduce((a, x) => a + x.kb, 0).toFixed(0)} KB (nenhum acima de 200)`)
  // o apito continua SINTETIZADO — é o "que você já tinha mesmo" da fala dele
  {
    const i = som.indexOf('export function playWhistle')
    const corpo = som.slice(i, som.indexOf('\n}', i))   // só o CORPO da função
    ok(i > 0, 'playWhistle() existe')
    ok(!/new Audio\(|\.mp3|fetch\(/.test(corpo), 'playWhistle() continua sintetizado — 0 KB, como ele aprovou')
  }
  // e nenhum áudio entrou no CÓDIGO (base64 num .ts desce pra todo jogador)
  ok(!/data:audio\//.test(som), 'nenhum áudio embutido em base64 no código')
}

console.log('\n2) 🔔 o APITO: a regra que ele fechou em 19/09')
{
  // Ele perguntou *"vai ter em uma partida só ou no início de todas as partidas?"*
  // e escolheu: *"isso número 3.. qd for copa e sempre a primeira partida tb né..
  // e qlqr copa nova ou liga.. e vale tb pro modo online qlqr modo tb"*.
  //   1. a PRIMEIRA partida de qualquer competição apita (liga nova, copa nova)
  //   2. TODA partida de COPA apita
  //   3. da 2ª rodada de LIGA em diante, silêncio (era o repetitivo)
  ok(/export function useApitoDeLargada/.test(carreira), 'a regra mora num lugar só: `useApitoDeLargada`')
  // ⛔ ninguém apita por fora — se alguém soltar um `playWhistle()` numa tela, a
  // regra passa a ter duas versões e uma delas vai envelhecer errado.
  for (const [nome, src] of [['CARREIRA', carreira], ['RÁPIDO/ONLINE', rapido], ['COPA DO MUNDO', mundo]]) {
    const soltos = [...src.matchAll(/playWhistle\(\)/g)].filter(m => {
      const antes = src.slice(Math.max(0, m.index - 900), m.index)
      return !/useApitoDeLargada/.test(antes)
    })
    ok(soltos.length === 0, `${nome}: nenhum apito solto por fora da regra`)
  }
  const usos = [
    ['liga da carreira', carreira, /useApitoDeLargada\(`liga-carreira-\$\{[^}]+\}`,[^)]*\)/, false],
    ['copa da carreira', carreira, /useApitoDeLargada\('copa-carreira',[\s\S]{0,160}?,\s*true\)/, true],
    ['liga do rápido/online', rapido, /useApitoDeLargada\(`liga-\$\{[^}]+\}`,[^)]*\)/, false],
    ['copa do rápido/online', rapido, /useApitoDeLargada\('copa-rapida',[\s\S]{0,160}?,\s*true\)/, true],
    ['Libertadores', rapido, /useApitoDeLargada\('libertadores',[\s\S]{0,160}?,\s*true\)/, true],
    ['Copa do Mundo', mundo, /useApitoDeLargada\('copa-mundo',[\s\S]{0,160}?,\s*true\)/, true],
  ]
  for (const [nome, src, re, copa] of usos) {
    ok(re.test(src), `${nome}: ${copa ? 'apita em TODA partida (é copa)' : 'apita só na largada (é liga)'}`)
  }
  // 🧪 e a LIGA não pode ter virado copa por engano (o `true` no fim)
  for (const [nome, src, re] of usos.filter(u => !u[3])) {
    const m = src.match(re)
    ok(!!m && !/,\s*true\)\s*$/.test(m[0]), `${nome}: continua SEM o "toda partida" — senão volta o apito a cada rodada`)
  }
}

console.log('\n2b) 🏟️ toda tela que mostra partida tem o som (nenhuma fica muda)')
{
  // A Copa do Mundo ficou de fora do som de 18/09 e ninguém notou: a tela é
  // própria, não é a da liga. Esta trava conta as telas pelo LiveScoreCard.
  for (const [nome, src] of [['CARREIRA', carreira], ['RÁPIDO/ONLINE', rapido], ['COPA DO MUNDO', mundo]]) {
    ok(/LiveScoreCard/.test(src), `${nome}: mostra partida na tela`)
    ok(/startCrowd\(\)/.test(src) && /stopCrowd\(\)/.test(src), `${nome}: tem ambiente, e ele PARA ao sair da tela`)
    ok(/useApitoDeLargada\(/.test(src), `${nome}: tem apito pela regra`)
  }
}

console.log('\n3) 🎧 o som da partida é EXATAMENTE o que ele escolheu — nada mais')
{
  // Diego (19/09): *"quero só os áudios que eu mandei, do ambiente, gol, e o apito
  // que você já tinha mesmo"*. É uma lista FECHADA de três. Esta trava existe pra
  // ninguém reintroduzir som inventado por engano.
  ok(/export const TORCIDA_NOVA = true/.test(som), 'a chave TORCIDA_NOVA está LIGADA (ele aprovou em 19/09)')
  ok(/crowdRoar\(/.test(carreira), 'o gol toca no placar — o mesmo componente serve carreira e rápido/online')
  ok(/startCrowd\(\)/.test(carreira), 'a carreira tem o ambiente de fundo')
  ok(/startCrowd\(\)/.test(rapido), 'o rápido/online tem o ambiente de fundo')
  // 🗑️ o canto sintetizado (palmas + "ôôô") foi APOSENTADO: o ambiente que ele
  // mandou já tem torcida cantando ao longe, e os dois juntos embolavam.
  ok(!/crowdChant/.test(som), 'o canto sintetizado foi aposentado (não existe mais no código)')
  ok(!/crowdChant/.test(carreira) && !/crowdChant/.test(rapido), 'e nenhuma tela ficou chamando o canto')
  // 🗑️ e o ambiente/urro de RUÍDO também saíram: quem faz esse papel agora é o mp3
  {
    const i = som.indexOf('export function startCrowd')
    const corpo = som.slice(i, som.indexOf('export function stopCrowd'))
    ok(/SFX_AMBIENTE/.test(corpo), 'o ambiente é o ARQUIVO dele, não ruído sintetizado')
    ok(/loop = true/.test(corpo), 'e roda em loop enquanto a partida está na tela')
    ok(/stopCrowd/.test(rapido) && /stopCrowd/.test(carreira), 'ao sair da tela o ambiente para (nada toca fora do jogo)')
  }
}

console.log('\n4) 🥅 o gol convive com a partida (não vira bagunça)')
{
  // Reclamação dele sobre o arquivo original: *"acho q tá mt longo pq o gol
  // acontece e a partida continua"*. As quatro regras que resolvem isso:
  const i = som.indexOf('export function crowdRoar')
  const corpo = som.slice(i, i + 2600)
  ok(/golAtual/.test(corpo), '1. UM gol por vez — o anterior sai de fininho se vier outro')
  ok(/ritmoMs < 2000/.test(corpo), '2. rodada curta demais (⚡4×) fica SÓ com o ambiente')
  ok(/ritmoMs \/ 1000\) \* 0\.85/.test(corpo), '3. o gol é cortado em 85% da rodada — nunca invade o jogo seguinte')
  ok(/DUCK/.test(corpo), '4. o ambiente abaixa enquanto o gol toca (senão os dois somados estouram)')
  ok(/crowdRoar\([^)]*,\s*roundMs\)/.test(carreira), 'e quem chama passa o tempo REAL da rodada (o placar é quem sabe)')
}

console.log('\n5) 🔇 ninguém leva susto')
{
  ok(/let muted = true/.test(som), 'o som nasce MUDO — quem quiser liga no botão 🔊')
  ok(/getItem\('esc-sound-muted'\)/.test(som), 'e a escolha fica lembrada no aparelho')
  ok(/if \(!allowed \|\| muted\) return null/.test(som), 'mudo = o motor de áudio nem acorda')
}

console.log(falhas === 0 ? '\n✅ tudo certo\n' : `\n❌ ${falhas} falha(s)\n`)
process.exit(falhas === 0 ? 0 : 1)
