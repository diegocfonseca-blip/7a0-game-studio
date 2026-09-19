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

console.log('\n2) 🔔 o APITO toca nos dois modos (é o único som que ele liberou)')
{
  ok(/playWhistle\(\)/.test(carreira), 'CARREIRA: o apito existe — era o que faltava')
  ok(/playWhistle\(\)/.test(rapido), 'RÁPIDO/ONLINE: o apito existe')
}

// 🔔 UM APITO POR TEMPORADA, NÃO UM POR RODADA (Diego 19/09): *"apito coloque só
// no início do jogo p N ficar repetitivo"*. Esta é a trava que impede alguém de
// voltar pro `useEffect` solto de antes — que tocava 38 vezes por temporada.
console.log('\n2b) 🔁 o apito NÃO se repete (só no início)')
{
  for (const [nome, src] of [['CARREIRA', carreira], ['RÁPIDO/ONLINE', rapido]]) {
    // cada chamada de playWhistle() tem que estar atrás de um guarda `jaApitou`
    const chamadas = [...src.matchAll(/playWhistle\(\)/g)]
    ok(chamadas.length > 0, `${nome}: ${chamadas.length} lugar(es) que apitam`)
    for (const c of chamadas) {
      const antes = src.slice(Math.max(0, c.index - 700), c.index)
      ok(/jaApitou\w*\.current\s*=/.test(antes), `${nome}: o apito está travado por \`jaApitou\` (não toca de novo)`)
    }
    ok(/jaApitou\w*\s*=\s*useRef</.test(src), `${nome}: o guarda é um useRef (sobrevive ao redesenho da tela)`)
    ok(/jaApitou\w*\.current\s*=\s*state\.seasonNo|jaApitou\w*\.current\s*=\s*\(?state\.seasonNo/.test(src) || nome !== 'CARREIRA',
      `${nome}: o contador é a TEMPORADA — temporada nova ganha apito novo`)
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
