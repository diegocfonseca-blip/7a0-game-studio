// 🧪 ⏩📺 VELOCIDADE ABSOLUTA DO CAMPO 2D (06/11, ordem do Diego). A marcha do 2D é a velocidade do jogo, NUNCA um multiplicador
// por cima da base (a sala 4RVDD8 tinha simSpeed=3 gravado: 3× × 3 = 9×, ~12 s por jogo). Confere:
//  · sala no AUTO = 2,5× mesmo com simSpeed velho · sala com Manual = a opção do dono, absoluta (no estado da sala)
//  · carreira/Partida Rápida padrão = 2× · a conversão do `esc-vel2d` velho · as listas exatas de opções
//  · a tela não divide mais o 2D pelo simSpeed · o relógio do banco segue a mesma régua (SQL) e o aparelho reconhece o passo
// uso: npx tsx scripts/testa-vel-2d.mts   (ou npm run vel-2d)
import { readFileSync } from 'node:fs'
import { reducer } from '../src/escalacao/store'
import { doisDDoPasso } from '../src/escalacao/campo2d-modo'
import { DUR_2D_MS, DUR_2D_SALA_MS } from '../src/escalacao/campo2d-motor'
import {
  DUR_2D_BASE_MS, VEL2D_SALA_VALORES, VEL2D_SOLO_VALORES, VEL2D_SALA_PADRAO, VEL2D_SOLO_PADRAO, VEL2D_SALA_OPTS, VEL2D_SOLO_OPTS,
  vel2dSala, vel2dCarreiraOnline, vel2dDoContexto, vel2dSoloDoGuardado, vel2dBanco, dur2DDaVel, seg2DDaVel, PASSOS_2D_BANCO_MS,
} from '../src/escalacao/vel2d-regra'
import type { EscState } from '../src/escalacao/types'
let falhas = 0
const ok = (c: boolean, m: string) => { console.log(c ? '✅' : '❌', m); if (!c) falhas++ }
const igual = (a: readonly number[], b: number[]) => a.length === b.length && a.every((v, i) => v === b[i])

console.log('📋 1) as listas exatas')
ok(igual(VEL2D_SALA_VALORES, [1, 1.5, 2, 2.5, 3, 3.5, 4]) && VEL2D_SALA_PADRAO === 2.5, 'sala: 1 · 1,5 · 2 · 2,5 (padrão) · 3 · 3,5 · 4')
ok(igual(VEL2D_SOLO_VALORES, [1, 1.5, 2, 2.5, 3, 3.5, 4]) && VEL2D_SOLO_PADRAO === 2, 'carreira/rápida: 1 · 1,5 · 2 (padrão) · 2,5 · 3 · 3,5 · 4')
ok(VEL2D_SALA_OPTS.filter(o => /padrão/.test(o.pt)).map(o => o.v).join() === '2.5' && VEL2D_SOLO_OPTS.filter(o => /\(default\)/.test(o.en)).map(o => o.v).join() === '2', 'o rótulo "padrão"/"default" fica SÓ no valor padrão')
ok(VEL2D_SALA_OPTS.find(o => o.v === 1.5)?.pt === '1,5×' && VEL2D_SALA_OPTS.find(o => o.v === 1.5)?.en === '1.5×', 'rótulo PT com vírgula, EN com ponto')
ok(DUR_2D_BASE_MS === DUR_2D_MS && dur2DDaVel(2.5) === DUR_2D_SALA_MS && DUR_2D_SALA_MS === 43902, 'a base é o mesmo 1:30 do motor; DUR_2D_SALA_MS = 2,5× (43902)')

console.log('🌐 2) sala online')
const sala = (extra: Record<string, unknown> = {}) => {
  let s = reducer({} as EscState, { type: 'NEW_GAME' } as never)
  s = reducer(s, { type: 'START_ONLINE', roomId: 'r1', roomCode: 'VEL2D', isHost: true, playerIndex: 0, playerNames: ['Dono FC', 'Convidado EC'],
    seatUids: ['u0', 'u1'], youUid: 'u0', formation: '4-3-3', deck: 'br', copaMode: 'liga_copa', ...extra } as never)
  return s
}
{
  let s = sala()
  ok(s.vel2d === undefined && vel2dDoContexto(s, 4) === 2.5, 'sala no AUTO começa em 2,5× (a marcha do aparelho não entra)')
  s = reducer(s, { type: 'SET_SIM_SPEED', speed: 3 } as never) // o caso da 4RVDD8
  ok(vel2dDoContexto(s, 2) === 2.5 && dur2DDaVel(vel2dDoContexto(s, 2)) === DUR_2D_SALA_MS, 'simSpeed=3 velho gravado: 2,5× (36 s), não multiplica (era 9×)')
  s = reducer(s, { type: 'SET_VEL_2D', vel: 4 } as never)
  ok(vel2dSala(s) === 4, '07/11: escolheu 4× no Manual e voltou pro AUTO → o auto fica em 4×')
  ok(vel2dSala(reducer(s, { type: 'SET_VEL_2D', vel: 2.5 } as never)) === 2.5, '… voltou pro 2,5× no Manual → o auto fica em 2,5×')
}
{
  let s = sala({ manual: true })
  ok(s.manualRoom === true && vel2dSala(s) === 2.5, 'sala COM Manual sem escolha: 2,5×')
  s = reducer(s, { type: 'SET_SIM_SPEED', speed: 2 } as never)
  ok(vel2dSala(s) === 2.5, 'o simSpeed (placar normal) não entra na marcha do 2D')
  for (const v of VEL2D_SALA_VALORES) {
    const t = reducer(s, { type: 'SET_VEL_2D', vel: v } as never)
    ok(vel2dDoContexto(t, 2) === v && dur2DDaVel(vel2dDoContexto(t, 2)) === Math.round(DUR_2D_MS / v), `Manual da sala em ${v}× = ${v}× absoluto (${seg2DDaVel(v)} s)`)
  }
  ok(vel2dSala(reducer(s, { type: 'SET_VEL_2D', vel: 0.5 } as never)) === 2.5, '½× não é opção: vale o padrão 2,5×')
  ok(reducer(s, { type: 'SET_VEL_2D', vel: 9 } as never).vel2d === undefined, 'valor fora de toda lista: o reducer não grava')
  ok(vel2dSala({ streamMode: true, vel2d: 2.5 }) === 2.5, 'sala em stream conta como Manual')
  const nova = reducer(reducer(s, { type: 'SET_VEL_2D', vel: 4 } as never), { type: 'START_ONLINE', roomId: 'r2', roomCode: 'NOVA', isHost: true, playerIndex: 0,
    playerNames: ['Dono FC', 'B'], seatUids: ['u0', 'u1'], youUid: 'u0', formation: '4-3-3', deck: 'br', copaMode: 'liga_copa', manual: true } as never)
  ok(nova.vel2d === undefined, 'jogo online novo (START_ONLINE) começa sem marcha herdada')
}

console.log('🏆 3) carreira online (marcha do dono, padrão 2×)')
{
  const base = { onlineMode: 'online', careerOnline: true, manualRoom: true }
  ok(vel2dDoContexto(base, 4) === 1.5, 'sem escolha: 1,5× — padrão da carreira desde 07/11 (a marcha do aparelho do convidado não entra)')
  ok(vel2dDoContexto({ ...base, vel2d: 3.5 }, 1) === 3.5 && vel2dCarreiraOnline({ vel2d: 1 }) === 1, 'escolha do dono vale absoluta (inclusive 1×)')
}

console.log('💾 4) carreira/Partida Rápida offline: padrão 2× e a conversão do esc-vel2d velho')
ok(vel2dSoloDoGuardado(null) === 2 && vel2dSoloDoGuardado('') === 2 && vel2dSoloDoGuardado('abc') === 2, 'sem valor (ou lixo) = 2×')
// o valor velho JÁ era absoluto (Partida Rápida: 1:30 ÷ marcha) — a conversão mantém a velocidade e encaixa na lista nova
const conv: [string, number][] = [['0.5', 1], ['1', 1], ['2', 2], ['3', 3], ['4', 4], ['1.5', 1.5], ['2.5', 2.5], ['3.5', 3.5], ['8', 4]]
for (const [velho, novo] of conv) ok(vel2dSoloDoGuardado(velho) === novo, `esc-vel2d "${velho}" → ${novo}×`)
ok(vel2dDoContexto({ onlineMode: 'cpu', careerOnline: true }, 3.5) === 3.5 && vel2dDoContexto({ onlineMode: 'cpu', careerOnline: true }, 0.5) === 1.5 && vel2dDoContexto({ onlineMode: 'cpu', careerOnline: true }, null) === 1.5 && vel2dDoContexto({ onlineMode: 'cpu', careerOnline: true }, 3.5, false) === 1.5 && vel2dDoContexto({ onlineMode: 'cpu' }, null) === 2, 'carreira OFFLINE (careerOnline=true) usa a marcha do aparelho')
ok(vel2dDoContexto({ onlineMode: 'cpu' }, 2) === 2, 'Partida Rápida offline padrão 2×')

console.log('🗄️ 5) relógio do banco (Copa do Mundo/regionais)')
ok(vel2dBanco(false, 2) === 2 && vel2dBanco(false, 4) === 4 && vel2dBanco(true, null) === 2.5 && vel2dBanco(true, 0.5) === 2.5 && vel2dBanco(true, 1) === 1 && vel2dBanco(true, 3.5) === 3.5, '07/11: AUTO e Manual usam a última marcha escolhida (sem escolha/inválida = 2,5×)')
ok(PASSOS_2D_BANCO_MS.every(d => doisDDoPasso({ step: 2, duration_ms: d, speed: 1 }) === true && doisDDoPasso({ step: 2, duration_ms: d, speed: 2.5 }) === true), 'o aparelho reconhece todo passo 2D da régua nova, com qualquer speed')
ok([0.25, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4].every(v => doisDDoPasso({ step: 2, duration_ms: Math.round(16000 / v), speed: v }) === false), 'placar normal (16000 ÷ speed) nunca é confundido com 2D')
ok(doisDDoPasso({ step: 2, duration_ms: 36585, speed: 1 }) === true && doisDDoPasso({ step: 2, duration_ms: Math.round(36585 / 2), speed: 2 }) === true, 'e o 36585 (3×, o que o banco carimba HOJE) e o 36585 ÷ speed continuam 2D — nada quebra entre o deploy e o SQL')
const sql = readFileSync(new URL('../docs/sql/campo2d-vel-lembra-auto.sql', import.meta.url), 'utf8')
ok((sql.match(/round\(109756\.0\/\(case when coalesce\(r\.vel2d,gv\) in \(1,1\.5,2,2\.5,3,3\.5,4\) then coalesce\(r\.vel2d,gv\) else 2\.5 end\)\)/g) ?? []).length === 2, 'SQL: as duas funções (Copa do Mundo e regionais) seguem a marcha do Manual (a da copa, senão a da sala), padrão 2,5× — sem valor fixo')
ok((sql.match(/\(g\.game_state->>'vel2d'\)::numeric into d2, gv/g) ?? []).length === 2, 'SQL: a marcha da sala (game_state.vel2d) é lida a cada passo')
ok((sql.match(/p_command='vel2d' and p_speed in \(1,1\.5,2,2\.5,3,3\.5,4\)/g) ?? []).length === 2 && (sql.match(/add column if not exists vel2d/g) ?? []).length === 2, 'SQL: coluna e comando próprios da marcha do 2D (a speed do placar normal fica como estava)')
ok((sql.match(/p_command='speed' and p_speed in \(0\.25,0\.5,1,2,3,4\)/g) ?? []).length === 2 && (sql.match(/round\(16000\/r\.speed\)/g) ?? []).length === 2, 'SQL: placar normal sem mudança')
ok(Math.round(DUR_2D_MS) === 109756 && Math.round(109756 / 2.5) === 43902, 'SQL: a base 109756 é a mesma do código (2,5× = 43902)')

console.log('🖥️ 6) as telas não dividem mais o 2D pelo simSpeed')
const src = (f: string) => readFileSync(new URL('../src/escalacao/' + f, import.meta.url), 'utf8')
const scr = src('screens.tsx'), pyr = src('pyramidseason.tsx'), intl = src('career-international-view.tsx'), copa = src('copa-mundo.tsx'), rit = src('ritmo2d.ts')
ok(!/fatorRitmo2D|DUR_2D_SALA_MS \/|dur2D\(manual\)/.test(scr), 'screens: sem o divisor velho')
ok((scr.match(/c2d \? dur2DDaVel\(vel2dAqui\)/g) ?? []).length >= 4, 'screens: liga, copa, Liberta e Champions usam a velocidade absoluta')
ok(/Math\.round\(baseRoundMs \/ \(c2d \? 1 : speedFactor\)\)/.test(scr) && /const copaSf = c2d \? 1 : speedFactor/.test(scr) && /copaLegMs \/ copaSf/.test(scr), 'screens: no 2D o tempo final NÃO divide pelo simSpeed (liga e copa)')
ok(/const speedFactor = campo2d \? vel2dCarr :/.test(pyr) && /const baseRoundMs = campo2d \? DUR_2D_MS :/.test(pyr), 'carreira: 2D = 1:30 ÷ a marcha absoluta (não mais 2× × simSpeed)')
ok(/const speed = c2d \? vel2dIntl :/.test(intl), 'internacional da carreira: idem')
ok(/c2d \? dur2DDaVel\(vel2dCopa\)/.test(copa), 'Copa do Mundo sem relógio: idem')
ok(/s\.onlineMode !== 'online' && s\.sport !== 'basquete'/.test(rit) && !/!s\.careerOnline && s\.sport/.test(rit), 'a carreira OFFLINE entra no ritmo do aparelho (careerOnline é a flag da pirâmide)')

console.log('\n⏱️ segundos por jogo na tela (placar anima 93\' em roundMs × 0,82):')
console.log('   sala online : ' + VEL2D_SALA_VALORES.map(v => `${v}× = ${seg2DDaVel(v)} s`).join(' · '))
console.log('   carreira/rápida: ' + VEL2D_SOLO_VALORES.map(v => `${v}× = ${seg2DDaVel(v)} s`).join(' · '))

console.log(falhas ? `\n❌ ${falhas} falha(s)` : '\n✅ velocidade absoluta do 2D ok')
process.exit(falhas ? 1 : 0)
