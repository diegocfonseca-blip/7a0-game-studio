#!/usr/bin/env node
// ─── 🧼 TRAVA: a CARREIRA nasce limpa — nada da partida rápida nem da sala online entra nela (21/10) ──────────────────
// Diego, depois que a carreira nova de um amigo abriu no PREGÃO ABERTO de uma partida rápida anterior: *"partida rápida
// não tem relação com modo carreira, que também não tem relação com salas online… absurdo isso"*.
// Reprova se: (1) START_CAREER_SOLO (ou o "virar carreira") não chamar `limpaMarcasDeModo`; (2) aparecer uma escolha NOVA
// no START (rápido) ou no START_ONLINE (sala) que a carreira não zera e que não está na lista de coisas neutras abaixo.
//   uso: npm run carreira-limpa
import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'

const src = readFileSync('src/escalacao/store.tsx', 'utf8')
const bloco = (nome, linhas) => { const i = src.indexOf(`    case '${nome}': {`); assert.ok(i >= 0, `não achei o ${nome}`); return src.slice(i, i + linhas) }
const campos = txt => new Set([...txt.matchAll(/\bs\.([a-zA-Z0-9_]+)\s*=(?!=)/g)].map(m => m[1]))
const marcas = new Set([...src.match(/export const MARCAS_DE_MODO = \[([\s\S]*?)\]/)[1].matchAll(/'([^']+)'/g)].map(m => m[1]))

const carreira = bloco('START_CAREER_SOLO', 16000)
assert.ok(/limpaMarcasDeModo\(s\)/.test(carreira.slice(0, 600)), 'START_CAREER_SOLO tem que começar chamando limpaMarcasDeModo(s)')
const fimDaCarreira = campos(carreira.slice(0, carreira.indexOf("\n    case '", 10)))

// o que o rápido e a sala gravam e NÃO é escolha de modo (é a própria carreira refazendo, ou sessão/aparelho)
const NEUTROS = new Set(['careerEmpresario', 'careerEmpresarioClaims', 'careerFilials', 'careerIntent', 'careerLedgers', 'careerRivalCount',
  'careerRivals', 'convocacaoDeadline', 'convocacaoDuplaFeitos', 'convocacaoEscolhas', 'convocacaoFeitos', 'cpuAtkAdj', 'cpuDefAdj',
  'nbaCareer', 'nbaTier', 'simSpeed', 'sport', 'screen',
  'escalaBots', // 📏 05/11: régua dos bots da SALA — só é lida com onlineMode 'online' (escalaDe), a carreira solo nunca enxerga
])
const faltam = []
for (const nome of ['START', 'START_ONLINE']) {
  const b = bloco(nome, 20000)
  for (const k of campos(b.slice(0, b.indexOf("\n    case '", 10)))) if (!fimDaCarreira.has(k) && !marcas.has(k) && !NEUTROS.has(k)) faltam.push(`${nome}: s.${k}`)
}
assert.deepEqual(faltam, [], `escolha de modo que a carreira não zera — entra em MARCAS_DE_MODO (store.tsx) ou, se for neutra, em NEUTROS aqui:\n  ${faltam.join('\n  ')}`)
assert.ok(marcas.has('pregaoAberto') && marcas.has('holandes') && marcas.has('auctionSecs'), 'pregão aberto, Tocaia e tempo do leilão têm que estar na lista')
assert.ok(/!state\.careerOnline\) \{ abrePregaoAberto/.test(src), 'trava do leilão: carreira nunca abre pregão aberto')
console.log(`✅ carreira nasce limpa: ${marcas.size} marcas de modo zeradas · leilão da carreira nunca abre pregão aberto/Tocaia`)
// 🧾 02/11 ("mal começou a carreira e o jogador já tinha gol e assistência"): o histórico NO SEU CLUBE (jogos/gols/assist./gás)
// mora em `condicaoCarry` (e o dos bots em `botCarry`) — carreira nova tem que nascer sem os dois, e save da T1 que veio sujo é curado.
for (const nome of ['START_CAREER_SOLO', 'CAREER_FROM_QUICK']) {
  const b = bloco(nome, 12000); const corpo = b.slice(0, b.indexOf("\n    case '", 10))
  assert.ok(/s\.condicaoCarry = undefined/.test(corpo) && /s\.botCarry = undefined/.test(corpo), `${nome} tem que zerar condicaoCarry e botCarry`)
  // 🏋️🧢 03/11: a comissão da carreira anterior (preparador, técnico e contratos) também não vem junto
  assert.ok(/s\.careerPreparador = undefined; s\.careerPreparadorContrato = undefined/.test(corpo) && /s\.careerTecnicos = undefined/.test(corpo) && /s\.careerTecnicoContrato = undefined/.test(corpo), `${nome} tem que zerar preparador e técnico (com contratos)`)
}
assert.ok(/seasonNo \?\? 1\) <= 1\) \{ restored\.condicaoCarry = undefined/.test(bloco('RESUME_CAREER_SOLO', 6000)), 'RESUME_CAREER_SOLO tem que curar carry herdado em save da T1')
console.log('✅ carreira nova nasce sem jogos/gols/assistências da carreira anterior')
// 🧹 03/11 (Diego: "veja se tem mais furos em carreira nova"): TODO campo do EscState tem que estar em um destes lugares —
// zerado/montado no começo da carreira (START_CAREER_SOLO), nas MARCAS_DE_MODO, no ZERA_NA_CARREIRA_NOVA, ou na lista abaixo do
// que é da CONTA, do APARELHO, da SALA ou passageiro do pregão (esses podem passar de uma carreira pra outra sem dano).
// Campo novo que não esteja em lugar nenhum = reprova: quem criou decide se ele é da carreira (vai pro ZERA) ou não (vai pra cá).
{
  const { readFileSync } = await import('node:fs')
  const tipos = readFileSync('src/escalacao/types.ts', 'utf8')
  const corpoTipo = tipos.match(/export interface EscState \{([\s\S]*?)\n\}/)[1]
  const campos = [...corpoTipo.matchAll(/^ {2}([a-zA-Z0-9_]+)\??:/gm)].map(m => m[1])
  const ini = src.indexOf("case 'START_CAREER_SOLO'"), fim = src.indexOf("\n    case '", ini + 10)
  const start = src.slice(ini, fim)
  const zera = new Set([...src.match(/export const ZERA_NA_CARREIRA_NOVA = \[([\s\S]*?)\] as const/)[1].matchAll(/'(\w+)'/g)].map(m => m[1]))
  const FICA_NA_CARREIRA_NOVA = new Set([
    'sport', 'nbaCareer', 'nbaCareerId', 'nbaTier', // esporte/NBA: escolha do aparelho
    'submitted', 'pendingEnvelopes', 'presence', 'restartReadyUids', 'presenceUids', 'seatUids', 'youUid', 'espectador', 'espHostUid', // sala/presença
    'surpriseId', 'mudoId', 'phase', 'currentCards', 'revealQueue', 'resenha', 'revealIdx', 'stock', 'convocacaoDeadline', 'convocacaoFeitos',
    'convocacaoDuplaFeitos', 'convocacaoEscolhas', 'hol', 'holFechando', 'monteOrder', 'monteIdx', 'phaseDeadline', 'monteDeadline',
    'cerimoniaDeadline', 'restartPending', 'restartReady', // passageiros do pregão (o leilão da carreira remonta)
    'league', 'fixtures', // remontados pela temporada da carreira
    'careerSubMode', 'careerIntent', 'careerRivalCount', 'careerRivals', // escolhidos NA TELA de criar, antes do START
    'tvBannerSeen', 'tvExtraVisto', 'simSpeed', 'condicaoAuto', // preferência/aviso visto do aparelho
    'bafoOn', 'colecoesRecebidas', 'bafoTrocasFeitas', // da CONTA (o servidor é quem marca)
    'bicoZeradoV2', 'medicoDevolvidoV1', 'medicoDevolvido', 'preparadorDevolvidoV1', 'preparadorDevolvido', // migrações já feitas
    'dinastiaPaused', 'dinastiaMidUsed', 'cpuAtkAdj', 'cpuDefAdj', // do jogo rápido
    'escalaBots', // 📏 da SALA (05/11): só é lida com onlineMode 'online' — a carreira solo nunca enxerga
  ])
  const soltos = campos.filter(c => !new RegExp(`\\bs\\.${c}\\s*=(?!=)`).test(start) && !marcas.has(c) && !zera.has(c)
    && !['rivalries', 'tiebreaks', 'tiebreakIdx', 'tiebreakPending'].includes(c) && !FICA_NA_CARREIRA_NOVA.has(c))
  assert.deepEqual(soltos, [], `campo(s) do EscState sem decisão pra carreira nova (zera ou fica?): ${soltos.join(', ')}`)
  assert.ok(/zeraCarreiraAnterior\(s\)/.test(start), 'START_CAREER_SOLO tem que chamar zeraCarreiraAnterior')
  assert.ok(/zeraCarreiraAnterior\(s\)/.test(bloco('CAREER_FROM_QUICK', 12000)), 'CAREER_FROM_QUICK tem que chamar zeraCarreiraAnterior')
  console.log(`✅ carreira nova: ${campos.length} campos do estado, todos com decisão (${zera.size} zerados de propósito)`)
}
