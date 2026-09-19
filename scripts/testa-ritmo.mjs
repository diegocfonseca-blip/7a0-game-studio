#!/usr/bin/env node
// ⏱️ TRAVA DO RITMO DA PARTIDA — quanto dura uma rodada em cada modo.
//
// Diego (18/09), depois de ouvir a simulação de som: *"aumente em mais 1s a
// simulação de uma partida, tanto no modo offline qualquer ou modo online
// qualquer também"*.
// 🔁 E DE NOVO em 19/09, agora incluindo TODAS as copas: *"aumente mais um segundo
// qualquer copa do online e offline… e também no jogo normal… qualquer modo offline
// carreira ou online… enfim aumente 1 segundo da simulação da partida pras copas
// todas e ligas"*. Daí a seção 1b.
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
const COPA = num(carr, /COPA_LEG_MS = (\d+)/)
const QUICK = num(tela, /QUICK_COPA_LEG_MS = COPA_LEG_MS \+ (\d+)/)
const mundo = readFileSync('src/escalacao/copa-mundo.tsx', 'utf8')
const MUNDO_ON = num(mundo, /\(online \? (\d+) : \d+\)/)
const MUNDO_OFF = num(mundo, /\(online \? \d+ : (\d+)\)/)
const sql = readFileSync('docs/sql/online-copa-clock-mais-1s.sql', 'utf8')
const SQL_MS = num(sql, /duration_ms:=round\((\d+)\/r\.speed\)/)
const online = Math.round(180000 / 38) + EXTRA

console.log('\n1) ⏱️ a rodada dura o que a gente acha que dura')
{
  ok(EXTRA === 2000, `o extra da rodada vale ${EXTRA}ms (1s de 18/09 + 1s de 19/09)`)
  ok(CARR === 11000, `carreira no manual: ${CARR / 1000}s (9s → 10s em 18/09 → 11s em 19/09)`)
  ok(CARR + AUTO === 12000, `carreira no auto: ${(CARR + AUTO) / 1000}s (o +1s do auto, de 13/09, continua por cima)`)
  ok(online >= 6500 && online <= 7000, `rápido/online: ${(online / 1000).toFixed(1)}s`)
}

console.log('\n1b) 🏆 E AS COPAS GANHARAM O MESMO SEGUNDO (Diego 19/09)')
{
  // *"aumente mais um segundo qualquer copa do online e offline… enfim aumente 1
  // segundo da simulação da partida pras copas todas e ligas"*.
  ok(COPA === 10000, `Copa da carreira: ${COPA / 1000}s por jogo (era 9s)`)
  ok(COPA + QUICK === 16000, `Copa dos 8 (rápido/online): ${(COPA + QUICK) / 1000}s por jogo — sai do COPA_LEG_MS + ${QUICK / 1000}s`)
  ok(MUNDO_OFF === 10000, `Copa do Mundo offline: ${MUNDO_OFF / 1000}s (era 9s)`)
  ok(MUNDO_ON === 15000, `Copa do Mundo online (sem relógio sincronizado): ${MUNDO_ON / 1000}s (era 14s)`)
  // 🗄️ a sala SINCRONIZADA lê o tempo do BANCO — se o SQL não subir junto, o online
  // fica 1s atrás do resto do jogo e ninguém percebe olhando o código.
  ok(SQL_MS === MUNDO_ON, `o SQL do relógio da sala (${SQL_MS}ms) bate com o código (${MUNDO_ON}ms)`)
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
