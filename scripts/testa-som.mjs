#!/usr/bin/env node
// 🔊 TRAVA DO SOM DO JOGO — torcida, canto e apito.
//
// Diego (18/09): *"precisamos colocar som de torcida nos jogos, seja online ou
// offline, pra dar mais emoção ao jogo.. apito sempre que iniciar partida e cantos
// de torcida durante o jogo... e aí, cadê?"*.
//
// O "cadê" tinha resposta: existia, mas só na tela do RÁPIDO/ONLINE. A carreira —
// que é onde ele mais joga — era muda. E a torcida era um zumbido PARADO: o mesmo
// ruído do começo ao fim, sem reagir nem ao gol.
//
// O que esta trava protege, em ordem de perigo:
//  1. 🪶 PESO: som do jogo é SINTETIZADO. Se alguém um dia empurrar um .mp3 de
//     torcida (loop de estádio passa fácil de 1 MB), ela reprova — a regra de peso
//     da casa vale pro som igual vale pra arte de batismo.
//  2. 🔇 NINGUÉM LEVA SUSTO: o som nasce MUDO e é opt-in no botão.
//  3. 📣 os DOIS modos têm torcida e apito (era o furo).
//
// uso: node scripts/testa-som.mjs
import { readFileSync, readdirSync, statSync } from 'node:fs'
const som = readFileSync('src/escalacao/sound.ts', 'utf8')
const carreira = readFileSync('src/escalacao/pyramidseason.tsx', 'utf8')
const rapido = readFileSync('src/escalacao/screens.tsx', 'utf8')
let falhas = 0
const ok = (cond, msg) => { console.log(`  ${cond ? '✅' : '❌'} ${msg}`); if (!cond) falhas++ }

console.log('\n1) 🪶 o som do jogo não baixa arquivo (0 KB no bundle)')
{
  for (const f of ['startCrowd', 'crowdChant', 'crowdRoar', 'playWhistle']) {
    const i = som.indexOf(`export function ${f}`)
    const corpo = som.slice(i, i + 2600)
    ok(i > 0, `${f}() existe`)
    ok(!/new Audio\(|\.mp3|fetch\(/.test(corpo), `${f}() é sintetizado — não baixa arquivo`)
  }
  // e os .mp3 que existem (memes do leilão) continuam pequenos
  const arqs = readdirSync('public/sfx').map(f => ({ f, kb: statSync(`public/sfx/${f}`).size / 1024 }))
  const total = arqs.reduce((a, x) => a + x.kb, 0)
  const gordo = arqs.find(x => x.kb > 200)
  ok(!gordo, gordo ? `⚠️ ${gordo.f} tem ${gordo.kb.toFixed(0)} KB` : `os ${arqs.length} sons de arquivo somam ${total.toFixed(0)} KB (nenhum acima de 200)`)
}

console.log('\n2) 🔔 o APITO toca nos dois modos (é o único som que ele liberou)')
{
  ok(/playWhistle\(\)/.test(carreira), 'CARREIRA: apito a cada rodada nova — era o que faltava')
  ok(/playWhistle\(\)/.test(rapido), 'RÁPIDO/ONLINE: apito a cada rodada nova')
}

console.log('\n3) 🔇 a TORCIDA NOVA fica segurada até ele aprovar o som')
{
  // Diego (18/09), depois de ouvir as gravações: *"não suba nenhum som ainda…
  // por enquanto só o apito mesmo"*. A chave guarda canto, urro e a torcida da
  // carreira. Se alguém ligar sem ele pedir, esta trava avisa.
  ok(/export const TORCIDA_NOVA = false/.test(som), 'a chave TORCIDA_NOVA está DESLIGADA')
  ok(/if \(TORCIDA_NOVA\) agenda\(\)/.test(som), 'o canto da arquibancada só agenda com a chave ligada')
  ok(/if \(TORCIDA_NOVA\) crowdRoar\(/.test(carreira), 'o urro do gol só sai com a chave ligada')
  ok(/if \(!TORCIDA_NOVA\) return; startCrowd\(\)/.test(carreira), 'a torcida de fundo da carreira só liga com a chave')
  // e o que JÁ estava no ar continua onde estava
  ok(/startCrowd\(\)/.test(rapido), 'a torcida do rápido/online, que já estava no ar desde antes, NÃO foi desligada')
}

console.log('\n4) 🎤 o canto, quando ligar, não vira barulho de fundo')
{
  const i = som.indexOf('export function startCrowd')
  const corpo = som.slice(i, som.indexOf('export function stopCrowd'))
  ok(/crowdChant\(\)/.test(corpo), 'o canto entra sozinho enquanto a torcida está no ar')
  const m = corpo.match(/setTimeout\(.*?,\s*(\d+)\s*\+\s*Math\.random\(\)\s*\*\s*(\d+)\)/)
  ok(!!m && Number(m[1]) >= 10000, `o canto espera ${m ? (Number(m[1]) / 1000) : '?'}s no mínimo entre um e outro`)
  ok(!!m && Number(m[2]) > 0, 'e o intervalo é SORTEADO — canto de relógio fixo vira barulho e a pessoa desliga o som')
  ok(/clearTimeout/.test(corpo) || /clearTimeout/.test(som.slice(i, i + 3000)), 'ao sair da tela o canto é cancelado (nada toca fora do jogo)')
}

console.log('\n5) 🔇 ninguém leva susto')
{
  ok(/let muted = true/.test(som), 'o som nasce MUDO — quem quiser liga no botão 🔊')
  ok(/getItem\('esc-sound-muted'\)/.test(som), 'e a escolha fica lembrada no aparelho')
  ok(/if \(!allowed \|\| muted\) return null/.test(som), 'mudo = o motor de áudio nem acorda')
}

console.log(falhas === 0 ? '\n✅ tudo certo\n' : `\n❌ ${falhas} falha(s)\n`)
process.exit(falhas === 0 ? 0 : 1)
