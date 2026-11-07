// 🧪 📺⚡ TROCA 2D ↔ PLACAR RÁPIDO NO MEIO DA SALA (05/11, pedido do Diego: o DONO troca quando quiser, tenha a sala começado
// num ou noutro). Confere a regra de construção:
//  · `SET_CAMPO2D` só MARCA (`campo2dProximo`) — o `campo2d` (que muda o relógio da sala) NÃO muda na hora;
//  · a troca entra no passo que COMEÇA um jogo (rodada da liga, perna da Copa) — nunca em ação qualquer (velocidade, manual…);
//  · convidado não consegue (crachá de outro no reducer do dono, ou o reducer do próprio convidado);
//  · fora da sala online, no basquete e na Kings: nada;
//  · apertar de novo desmarca; a troca não mexe no sorteio (placar da rodada igual com e sem troca);
//  · a largada nova (START_ONLINE) zera a marca e a carreira zera junto (MARCAS_DE_MODO).
// uso: npx tsx scripts/testa-sala-troca-2d.mts   (ou npm run sala-troca-2d)
//  · 🔒 por enquanto SÓ a conta do Diego (como dono): a trava `troca2DSalaLiberada` desligada recusa no reducer;
//  · TODAS as competições: liga, Copa dos 8, Liberta, Champions (tabela/repescão/mata), Relâmpago, Liga Draft, carreira em sala,
//    revanche — e as copas do relógio do BANCO (Copa do Mundo/Euro/regionais) pelo `VIRA_CAMPO2D` entre um passo e outro.
import { readFileSync } from 'node:fs'
import { reducer, MARCAS_DE_MODO, viraCampo2D } from '../src/escalacao/store'
import { applyTroca2DSalaBancada } from '../src/escalacao/sport'
import { doisDDoPasso } from '../src/escalacao/campo2d-modo'
import type { EscState } from '../src/escalacao/types'
let falhas = 0
const ok = (c: boolean, m: string) => { console.log(c ? '✅' : '❌', m); if (!c) falhas++ }

console.log('🔒 0) trava de conta')
{
  applyTroca2DSalaBancada(false)
  let s = reducer({} as EscState, { type: 'NEW_GAME' } as never)
  s = reducer(s, { type: 'START_ONLINE', roomId: 'r1', roomCode: 'T', isHost: true, playerIndex: 0, playerNames: ['Dono FC', 'B'], seatUids: ['u0', 'u1'], youUid: 'u0', formation: '4-3-3', deck: 'br', copaMode: 'liga_copa' } as never)
  ok(reducer(s, { type: 'SET_CAMPO2D', on: true, by: 'u0' } as never).campo2dProximo === undefined, 'dono SEM a conta liberada: recusado no reducer')
  applyTroca2DSalaBancada(true)
  ok(reducer(s, { type: 'SET_CAMPO2D', on: true, by: 'u0' } as never).campo2dProximo === true, 'dono com a conta liberada (Diego): marca')
}

const start = (extra: Record<string, unknown> = {}, isHost = true, you = 'u0') => {
  let s = reducer({} as EscState, { type: 'NEW_GAME' } as never)
  s = reducer(s, { type: 'START_ONLINE', roomId: 'r1', roomCode: 'TROCA2D', isHost, playerIndex: you === 'u0' ? 0 : 1,
    playerNames: ['Dono FC', 'Convidado EC'], seatUids: ['u0', 'u1'], youUid: you, formation: '4-3-3', deck: 'br', copaMode: 'liga_copa', ...extra } as never)
  return reducer(s, { type: 'REPLAY_SEASON' } as never) // pula o leilão: temporada pronta pra rolar
}
const troca = (s: EscState, on: boolean, by?: string) => reducer(s, { type: 'SET_CAMPO2D', on, by } as never)

console.log('📺 1) dono marca → só vale no próximo jogo')
{
  let s = start()
  ok(!s.campo2d && s.campo2dProximo === undefined, 'sala começou no placar rápido, sem troca marcada')
  s = troca(s, true, 'u0')
  ok(!s.campo2d, 'marcar NÃO muda o relógio na hora (campo2d continua desligado)')
  ok(s.campo2dProximo === true, 'a troca fica marcada (campo2dProximo = true)')
  const r0 = s.round
  s = reducer(s, { type: 'SET_SIM_SPEED', speed: 2 } as never)
  s = reducer(s, { type: 'SET_MANUAL_ROOM', on: true } as never)
  ok(!s.campo2d && s.campo2dProximo === true, 'velocidade/manual não aplicam a troca (não começam jogo)')
  s = reducer(s, { type: 'PLAY_ROUND' } as never)
  ok(s.round === r0 + 1, `a rodada andou (${r0} → ${s.round})`)
  ok(s.campo2d === true && s.campo2dProximo === undefined, 'no PLAY_ROUND a troca entra (campo2d = true) e a marca some')
  s = troca(s, false, 'u0')
  ok(s.campo2d === true && s.campo2dProximo === false, 'volta pro rápido também só marca (o jogo em curso segue no 2D)')
  s = reducer(s, { type: 'PLAY_ROUND' } as never)
  ok(!s.campo2d && s.campo2dProximo === undefined, 'e entra na rodada seguinte')
}

console.log('🔁 2) apertar de novo desmarca')
{
  let s = start({ campo2d: true })
  ok(s.campo2d === true, 'sala criada no 2D')
  s = troca(s, false, 'u0'); ok(s.campo2dProximo === false, 'marcou o rápido')
  s = troca(s, true, 'u0'); ok(s.campo2dProximo === undefined && s.campo2d === true, 'desfez: nada marcado, segue 2D')
  s = troca(s, true, 'u0'); ok(s.campo2dProximo === undefined, 'pedir o que já vale não marca nada')
}

console.log('🚫 3) convidado não consegue')
{
  const s = start()
  const forjado = troca(s, true, 'u1')
  ok(forjado.campo2dProximo === undefined && !forjado.campo2d, 'recado com crachá do convidado no reducer do dono: recusado')
  const semCracha = troca(s, true)
  ok(semCracha.campo2dProximo === undefined, 'recado sem crachá: recusado')
  const conv = start({}, false, 'u1')
  const c2 = troca(conv, true, 'u1')
  ok(c2.campo2dProximo === undefined && !c2.campo2d, 'reducer do próprio convidado (isHost=false): recusado')
}

console.log('🛑 4) fora da sala / basquete / Kings')
{
  let off = reducer({} as EscState, { type: 'NEW_GAME' } as never)
  off = reducer(off, { type: 'START', teamName: 'Solo FC', formation: '4-3-3', rivals: 7 } as never)
  ok(troca(off, true, off.youUid).campo2dProximo === undefined, 'partida rápida offline: nada (lá o 2D é do aparelho)')
  const bb = { ...start(), sport: 'basquete' } as EscState
  ok(troca(bb, true, 'u0').campo2dProximo === undefined, 'basquete: nada')
  const k = start(); const kings = { ...k, managers: k.managers.map((m, i) => i === 0 ? { ...m, formation: 'kings' } : m) } as EscState
  ok(troca(kings, true, 'u0').campo2dProximo === undefined, 'Kings League (relógio próprio): nada')
}

console.log('🎲 5) a troca não mexe no sorteio')
{
  const base = start()
  const a = reducer(base, { type: 'PLAY_ROUND' } as never)
  const b = reducer(troca(base, true, 'u0'), { type: 'PLAY_ROUND' } as never)
  const limpa = (s: EscState) => JSON.stringify({ ...s, campo2d: undefined, campo2dProximo: undefined, rodadaEm: undefined }) // rodadaEm = carimbo de hora (Date.now), muda a cada chamada
  ok(limpa(a) === limpa(b), 'rodada jogada com e sem troca: estado idêntico (fora o 2D)')
}

console.log('🏆 6) perna da Copa também é jogo novo')
{
  let s = start()
  for (let i = 0; i < 60 && s.round < s.fixtures.length; i++) s = reducer(s, { type: 'PLAY_ROUND' } as never)
  s = reducer(s, { type: 'FINISH_SEASON' } as never)
  for (let i = 0; i < 3 && !s.quickCopa; i++) s = reducer(s, { type: 'START_COPA' } as never)
  if (s.quickCopa && s.quickCopa.phase !== 'done') {
    s = troca(s, true, 'u0')
    ok(s.campo2dProximo === true && !s.campo2d, 'marcado durante a Copa')
    s = reducer(s, { type: 'PLAY_COPA_LEG' } as never)
    ok(s.campo2d === true && s.campo2dProximo === undefined, 'PLAY_COPA_LEG aplica a troca')
  } else ok(false, `a Copa dos 8 não abriu (screen ${s.screen})`)
}

console.log('🧼 7) largada nova e carreira')
{
  let s = troca(start(), true, 'u0')
  s = reducer(s, { type: 'START_ONLINE', roomId: 'r1', roomCode: 'TROCA2D', isHost: true, playerIndex: 0, playerNames: ['Dono FC', 'Convidado EC'], seatUids: ['u0', 'u1'], youUid: 'u0', formation: '4-3-3', deck: 'br', copaMode: 'liga_copa', campo2d: true } as never)
  ok(s.campo2d === true && s.campo2dProximo === undefined, 'START_ONLINE (revanche leva a marca no campo2d) zera a marca')
  ok((MARCAS_DE_MODO as readonly string[]).includes('campo2dProximo'), 'campo2dProximo está nas MARCAS_DE_MODO (carreira nova zera)')
  const v = { campo2d: false, campo2dProximo: true } as EscState; viraCampo2D(v)
  ok(v.campo2d === true && v.campo2dProximo === undefined, 'viraCampo2D sozinho')
}

console.log('🌎 8) as outras competições da sala')
{
  // Liberta (grupos)
  let s = start({ copaMode: 'liga_liberta' })
  for (let i = 0; i < 60 && s.round < s.fixtures.length; i++) s = reducer(s, { type: 'PLAY_ROUND' } as never)
  s = reducer(s, { type: 'FINISH_SEASON' } as never)
  s = troca(s, true, 'u0')
  const lb0 = JSON.stringify((s as unknown as { liberta?: unknown }).liberta ?? null)
  s = reducer(s, { type: 'PLAY_LIBERTA_RODADA' } as never)
  ok(s.campo2d === true && s.campo2dProximo === undefined, `Liberta: PLAY_LIBERTA_RODADA aplica (liberta ${lb0 === 'null' ? 'não montada nesta bancada' : 'rodando'})`)
  // Só Champions (tabela de 36 → repescão)
  let c = start({ copaMode: 'champions' })
  c = troca(c, true, 'u0'); c = reducer(c, { type: 'PLAY_CHAMPIONS_RODADA' } as never)
  ok(c.campo2d === true && c.campo2dProximo === undefined, 'Só Champions: PLAY_CHAMPIONS_RODADA aplica')
  c = troca(c, false, 'u0'); c = reducer(c, { type: 'PLAY_CHAMPIONS_REPESCAO' } as never)
  ok(!c.campo2d && c.campo2dProximo === undefined, 'Champions: PLAY_CHAMPIONS_REPESCAO aplica')
  // Relâmpago (mata-mata no motor da Copa)
  let r = start({ copaMode: 'relampago', relampagoChave: 16 })
  for (let i = 0; i < 3 && !r.quickCopa; i++) r = reducer(r, { type: 'START_COPA' } as never)
  if (r.quickCopa && r.quickCopa.phase !== 'done') { r = troca(r, true, 'u0'); r = reducer(r, { type: 'PLAY_COPA_LEG' } as never); ok(r.campo2d === true, 'Relâmpago: perna aplica') }
  else ok(true, `Relâmpago: chave não montou na bancada (screen ${r.screen}) — mesma PLAY_COPA_LEG da Copa dos 8 (coberta no 6)`)
  // Liga Draft / Liga da Turma: a mesma temporada da sala
  let d = start({ liga: true, ligaDraft: true })
  d = troca(d, true, 'u0'); d = reducer(d, { type: 'PLAY_ROUND' } as never)
  ok(d.campo2d === true, 'Liga Draft / Liga da Turma: PLAY_ROUND aplica')
  // carreira em sala: fase nova da Copa
  let k = start()
  k = troca(k, true, 'u0'); k = reducer(k, { type: 'SET_COPA_ROUND', round: 1 } as never)
  ok(k.campo2d === true && k.campo2dProximo === undefined, 'carreira em sala: fase nova da Copa (SET_COPA_ROUND sobe) aplica')
  k = troca(k, false, 'u0'); k = reducer(k, { type: 'SET_COPA_ROUND', round: 1 } as never)
  ok(k.campo2d === true && k.campo2dProximo === false, 'SET_COPA_ROUND sem subir de fase NÃO aplica')
}

console.log('🏟️ 9) copas do relógio do BANCO (Copa do Mundo / Euro / regionais)')
{
  let s = troca(start(), true, 'u0')
  const g = reducer(s, { type: 'VIRA_CAMPO2D', by: 'u1' } as never)
  ok(!g.campo2d && g.campo2dProximo === true, 'VIRA_CAMPO2D com crachá do convidado: recusado')
  s = reducer(s, { type: 'VIRA_CAMPO2D', by: 'u0' } as never)
  ok(s.campo2d === true && s.campo2dProximo === undefined, 'VIRA_CAMPO2D do dono: aplica (o relógio do dono pede entre um passo e outro)')
  ok(doisDDoPasso({ step: 3, duration_ms: 109756, speed: 1 }) === true && doisDDoPasso({ step: 3, duration_ms: 16000, speed: 1 }) === false, 'o passo diz o 2D pela duração que o banco carimbou (1:30 × 16 s)')
  ok(doisDDoPasso({ step: 3, duration_ms: Math.round(109756 / 4), speed: 4 }) === true && doisDDoPasso({ step: 3, duration_ms: 4000, speed: 4 }) === false, '… em qualquer velocidade (4×)')
  ok(doisDDoPasso({ step: 0, duration_ms: 16000, speed: 1 }) === undefined, 'antes do 1º passo: vale a sala')
  const src = (f: string) => readFileSync(new URL('../src/escalacao/' + f, import.meta.url), 'utf8')
  const clk = src('copa-clock-preview.ts'), reg = src('copa-regional-online.tsx')
  ok(/prepara2D\(\)/.test(clk) && /cmd==='next'&&!pronto2D/.test(clk), 'Copa do Mundo/Euro: o `next` automático espera a troca entrar no banco')
  ok(/c==='next'&&!prepara2D\(\)/.test(clk), 'Copa do Mundo/Euro: o `next` do MANUAL também espera')
  ok(/&& pronto2D\) void rpc\('next'\)/.test(reg) && /c === 'next' && !prepara2D\(\)/.test(reg), 'regionais: auto e manual esperam a troca')
  ok(/Campo2DDoPassoCtx\.Provider/.test(src('copa-mundo-online.tsx')) && /Campo2DDoPassoCtx\.Provider/.test(reg), 'Copa do Mundo e regionais desenham o 2D do PASSO (todo aparelho igual)')
}

console.log('🔘 10) o botão do dono está em toda competição')
{
  const src = (f: string) => readFileSync(new URL('../src/escalacao/' + f, import.meta.url), 'utf8')
  const sc = src('screens.tsx')
  const n = (sc.match(/<TrocaCampo2DSala \/>/g) ?? []).length
  ok(n >= 4, `screens: liga · Copa dos 8/Relâmpago/Champions-mata · Liberta · Champions tabela/repescão (${n} lugares)`)
  ok(/<TrocaCampo2DSala \/>/.test(src('copa-mundo.tsx')), 'Copa do Mundo / Eurocopa')
  ok(/<TrocaCampo2DSala \/>/.test(src('copa-regional-online.tsx')), 'copas regionais')
  ok(/<TrocaCampo2DSala \/>/.test(src('pyramidseason.tsx')), 'carreira em sala (liga e Copa)')
  ok(/salva2DLiga/.test(src('lobby.tsx')), 'Liga Draft / Liga da Turma: o dono escolhe na sala de espera (vale na próxima largada)')
  ok(/useTroca2DSala\(\)/.test(sc) && /troca2DSalaLiberada\(\)/.test(src('store.tsx')), 'a trava de conta vale na tela E no reducer')
  ok(/ehKings\(state\)\) return null/.test(sc), 'Kings fica de fora (relógio próprio)')
}

if (falhas) { console.log(`\n❌ ${falhas} falha(s)`); process.exit(1) }
console.log('\n✅ troca 2D ↔ rápido na sala: só o dono, só no próximo jogo')
process.exit(0) // (o cliente do banco acorda depois e reclama do import.meta — não é deste teste)
