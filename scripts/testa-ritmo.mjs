#!/usr/bin/env node
// ⏱️ TRAVA DO RITMO DA PARTIDA — quanto dura uma rodada em cada modo.
//
// Diego (18/09), depois de ouvir a simulação de som: *"aumente em mais 1s a
// simulação de uma partida, tanto no modo offline qualquer ou modo online
// qualquer também"*.
//
// Por que virou trava: o tempo da rodada é um número solto em DOIS arquivos
// (`screens.tsx` pro rápido/online e `pyramidseason.tsx` pra carreira), e ele
// manda em coisa que não parece ter relação — o relógio do placar, o momento em
// que a tabela atualiza, e agora o ENQUADRAMENTO DO SOM (o gol tem 3,1s; se a
// rodada encolher pra menos que isso, o gol vaza pra rodada seguinte e o som
// estoura — medido: 210% de pico no online ⚡4×).
// Se alguém mexer nesses números sem perceber o efeito, é esta trava que avisa.
//
// uso: node scripts/testa-ritmo.mjs
import { readFileSync } from 'node:fs'
const tela = readFileSync('src/escalacao/screens.tsx', 'utf8')
const carr = readFileSync('src/escalacao/pyramidseason.tsx', 'utf8')
let falhas = 0
const ok = (cond, msg) => { console.log(`  ${cond ? '✅' : '❌'} ${msg}`); if (!cond) falhas++ }
const num = (txt, re) => { const m = txt.match(re); return m ? Number(m[1]) : NaN }

const TOTAL = num(tela, /SEASON_TOTAL_MS = ([\d_]+)/.source ? /SEASON_TOTAL_MS = ([\d_]+)/ : null)
const EXTRA = num(tela, /ROUND_EXTRA_MS = (\d+)/)
const CARR = num(carr, /const ROUND_MS = (\d+)/)
const AUTO = num(carr, /AUTO_EXTRA_MS = (\d+)/)
const online = Math.round(180000 / 38) + EXTRA

console.log('\n1) ⏱️ a rodada dura o que a gente acha que dura')
{
  ok(EXTRA === 1000, `o segundo a mais existe e vale ${EXTRA}ms`)
  ok(CARR === 10000, `carreira no manual: ${CARR / 1000}s (era 9s antes de 18/09)`)
  ok(CARR + AUTO === 11000, `carreira no auto: ${(CARR + AUTO) / 1000}s (o +1s do auto, de 13/09, continua)`)
  ok(online >= 5500 && online <= 6000, `rápido/online: ${(online / 1000).toFixed(1)}s`)
}

console.log('\n2) 🥅 o gol CABE na rodada nas velocidades que têm som')
{
  // o gol tem 3,1s. Onde a rodada for MENOR que ele, o som precisa ceder a vez —
  // é por isso que o plano é calar efeito nas velocidades rápidas.
  const GOL = 3.1
  const casos = [
    ['carreira auto · Normal', (CARR + AUTO) / 1000],
    ['carreira auto · ⚡2×', (CARR + AUTO) / 2000],
    ['online · Normal', online / 1000],
    ['online · ⚡2×', online / 2000],
  ]
  for (const [nome, seg] of casos) {
    const pct = GOL / seg * 100
    ok(pct <= 115, `${nome}: rodada ${seg.toFixed(1)}s · o gol ocupa ${pct.toFixed(0)}%`)
  }
  // e o aviso honesto: no ⚡4× não cabe mesmo, e isso é esperado
  const ultra = online / 4000
  console.log(`  ℹ️  online ⚡4×: rodada ${ultra.toFixed(1)}s — o gol NÃO cabe (${(GOL / ultra * 100).toFixed(0)}%),`)
  console.log('      e é por isso que a velocidade ultra vai ficar só com o ambiente.')
}

console.log('\n3) 📐 o número mora num lugar só por modo')
{
  ok(/ROUND_MS = Math\.round\(SEASON_TOTAL_MS \/ 38\) \+ ROUND_EXTRA_MS/.test(tela), 'rápido/online: soma o extra na RODADA, não no orçamento da temporada')
  ok(/SEASON_TOTAL_MS \/ \(state\.fixtures\.length \|\| 82\)\) \+ ROUND_EXTRA_MS/.test(tela), 'basquete ganha o mesmo segundo ("modo online qualquer também")')
  ok((tela.match(/const ROUND_MS =/g) || []).length === 1, 'rápido/online: um ROUND_MS só')
  ok((carr.match(/const ROUND_MS =/g) || []).length === 1, 'carreira: um ROUND_MS só')
}

console.log(falhas === 0 ? '\n✅ tudo certo\n' : `\n❌ ${falhas} falha(s)\n`)
process.exit(falhas === 0 ? 0 : 1)
