// 🥅🙈 TRAVA "PÊNALTIS SEM SPOILER E SEM CORTE" (07/11)
// Pedido do Diego: *"nada de spoiler"* e *"o jogo não pode acabar antes dos pênaltis"*. Vale com o 📺 2D e com o placar
// normal/cinema, em todo modo e competição. Esta trava confere:
//   3. SEM SPOILER — enquanto a disputa roda, nada diz quem passou: as bolinhas e o número sobem uma cobrança por vez, e o
//      "avança"/"classificado", a chave, o giro, a lista dos outros jogos e a festa esperam a última cobrança;
//   4. SEM CORTE — a fase só vira depois da última cobrança mostrada: avanço automático, botão "próximo", relógio do dono
//      (salas) e relógio do banco (Copa do Mundo/regionais), inclusive com morte súbita longa (acima do teto de 60 s do banco).
//
//   npm run penaltis-sem-spoiler
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'
import { DisputaPenaltisCampo } from '../src/escalacao/campo2d-penaltis'
import { disputaRolandoNaTela, entrouNaTela, saiuDaTela } from '../src/escalacao/penaltis-na-tela'
import { disputaPenaltisComSequencia } from '../src/escalacao/penaltis'

const falhas: string[] = []
const ok = (c: unknown, msg: string) => { if (!c) falhas.push(msg) }
const ler = (f: string) => fs.readFileSync(f, 'utf8')
const tem = (arq: string, t: string | RegExp, msg: string) => { const s = ler(arq); ok(typeof t === 'string' ? s.includes(t) : t.test(s), `${arq}: ${msg}`) }
const naoTem = (arq: string, t: string | RegExp, msg: string) => { const s = ler(arq); ok(!(typeof t === 'string' ? s.includes(t) : t.test(s)), `${arq}: ${msg}`) }

// módulo de tela sem React/banco (o mesmo jeito do check-copa-preview): só as contas puras
function modulo(path: string) {
  const exports: Record<string, unknown> = {}
  vm.runInNewContext(ts.transpileModule(ler(path), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { exports, require: () => ({}) })
  return exports as any
}

// ── 3a. as bolinhas e o número da disputa sobem UMA cobrança por vez (as duas telas de bolinhas) ──────────────────
const PY = 'src/escalacao/pyramidseason.tsx', OMV = 'src/escalacao/online-match-visual.tsx'
tem(PY, 'if (decorrido < lead + k.at * step) return null', 'a bolinha da cobrança que ainda não aconteceu existe na tela')
tem(PY, /animation: `telaoPop \.3s ease \$\{totalDelay\.toFixed\(2\)\}s forwards`/, 'o telão com o placar final dos pênaltis não espera a última cobrança')
tem(OMV, 'const done=campo?.encerrado ?? elapsed>=totalDelay', 'o "classificado" da disputa compacta não segue o fim da disputa (ou do campinho)')
tem(OMV, 'const visible=rows.map(r=>r.filter(k=>mostrado(k.at)))', 'as bolinhas da disputa compacta não sobem uma por vez')
tem(OMV, 'const scores=visible.map(r=>r.filter(k=>k.ok).length)', 'o número da disputa compacta não sai só do que já apareceu')
// e no campinho: o placar da disputa (selo + bolinhas) nunca anda pra trás nem pula cobrança
for (const pens of [[4, 2], [5, 4], [8, 7], [15, 14]] as [number, number][]) {
  const s = new DisputaPenaltisCampo({ id: 'spoiler', pens, aName: 'A', bName: 'B' })
  let ant = 0, antPlacar = [0, 0]
  while (!s.estado.encerrado) {
    s.avancar(.1, 1, false, true)
    const e = s.estado
    ok(e.reveladas - ant <= 1, `campinho ${pens.join('x')}: revelou ${e.reveladas - ant} cobranças de uma vez`)
    ok(e.placar[0] >= antPlacar[0] && e.placar[1] >= antPlacar[1] && e.placar[0] + e.placar[1] - antPlacar[0] - antPlacar[1] <= 1, `campinho ${pens.join('x')}: o placar da disputa pulou`)
    // o número é SÓ o das cobranças já mostradas (nunca o resultado final adiantado)
    const ja = s.seq.slice(0, e.reveladas)
    ok(e.placar[0] === ja.filter(k => k.side === 0 && k.ok).length && e.placar[1] === ja.filter(k => k.side === 1 && k.ok).length, `campinho ${pens.join('x')}: o placar da disputa mostra gol de cobrança que ainda não aconteceu`)
    ant = e.reveladas; antPlacar = [...e.placar]
  }
  assert.deepEqual(s.estado.placar, pens)
}

// ── 3b. cada tela segura o vencedor enquanto a disputa roda ─────────────────────────────────────────────────────
const SC = 'src/escalacao/screens.tsx', CM = 'src/escalacao/copa-mundo.tsx', CR = 'src/escalacao/copa-regional-online.tsx', CI = 'src/escalacao/career-international-view.tsx'
// Partida Rápida / salas (Copa dos 8, Liberta, Champions, Relâmpago, Liga da Turma/Draft)
tem(SC, 'const penSegura = !!meuTiePen && !!penCampo.estado && !penCampo.estado.encerrado', 'quickCopa: a disputa do campinho não segura a fase')
tem(SC, 'const copaAdvReady = copaAdvTimer && !penSegura', 'quickCopa: o "Próximo" acende com a disputa rolando')
tem(SC, /const giroReady = copaLive \? \(copaMin >= 93 && copaAdvReady\)/, 'quickCopa: o giro/jornal entrega o vencedor antes da última cobrança')
tem(SC, /loserStyle = \(isLoser: boolean\) => !settled \|\| !isLoser \|\| escondeVencedor/, 'quickCopa: o riscado do eliminado aparece com a disputa do campinho rolando')
ok((ler(SC).match(/!escondeVencedor/g) ?? []).length >= 2, `${SC}: quickCopa: o "avança/é campeão" da lista não espera a disputa do campinho`)
tem(SC, /pd = settled && tie\.pens && !tie\.ot && !campoPen \? pensRevealDelay\(tie\.pens, copaTemGenteQ\(tie\), tie\.pensSeq\)/, 'quickCopa: o "avança" dos outros jogos não espera a disputa deles (com as cobranças de verdade)')
// Copa da carreira
tem(PY, "display: penaltisCampo.estado.encerrado ? undefined : 'none'", 'Copa da carreira: o "avança" aparece com a disputa do campinho rolando')
tem(PY, /pensDelay > 0 \? \{ opacity: 0, animation: `pensPop \.35s ease \$\{pensDelay\.toFixed\(2\)\}s forwards` \}/, 'Copa da carreira: o "avança" não espera a disputa')
tem(PY, 'animation: `copaPensShow .35s ease ${pensDelay.toFixed(2)}s forwards`', 'Copa da carreira (lista antiga): o placar dos pênaltis dos outros aparece antes da disputa acabar')
tem(PY, 'const visto = i < copaRound || (i === copaRound && copaReady)', 'Central da carreira: a chave da Copa mostra quem passou antes da fase acabar de animar')
// Copa do Mundo: os outros confrontos com pênaltis só dizem quem passou no fim da disputa deles
tem(CM, "liveDone || (liveMin >= 93 && t.pen) ? tieRow(t, true, t.pen && !liveDone ? pensRevealDelay(t.pen, koTemGente(entrants, t))", 'Copa do Mundo: o "Pênaltis X × Y · fulano avança" dos outros confrontos não espera a disputa')
tem(CM, "{step === FINAL && liveDone && (", 'Copa do Mundo: o placar da final sai antes do apito do passo')
// regionais: a disputa dos outros jogos entra aos 93' (dentro do tempo reservado), não no apito do passo
tem(CR, 'detail={pen && (liveDone || liveMin >= 93) ? <PensShootout compactOnline', 'regionais: a disputa dos outros jogos só começa no apito do passo (e é cortada pela fase seguinte)')
// carreira internacional: sem o campinho a disputa também aparece, e a noite espera ela
tem(CI, 'const pensCss = !campoPen && !!penalties?.penalties', 'internacional: sem o 2D o resultado dos pênaltis sai seco no apito')
tem(CI, 'if (!temDisputaCampo && !pensCss) onFim()', 'internacional: o apito da noite não espera a disputa sem o 2D')
tem(CI, /setTimeout\(onFim, Math\.round\(pensRevealDelay\(penalties\.penalties, lentoPens\) \* 1000\) \+ 300\)/, 'internacional: a noite vira antes da última cobrança')

// ── 4a. a fase só vira depois da última cobrança (avanço automático e botão) ──────────────────────────────────────
tem(SC, /if \(!canAdvance \|\| !copaLive \|\| manual \|\| firstLegPending \|\| cupNow \|\| penSegura\) return/, 'quickCopa: o avanço automático não espera a disputa do campinho')
tem(SC, 'roundMs={Math.round(copaLegMs / copaSf)} classico={oppIsHuman}', 'quickCopa: o placar grande anda em outra marcha que a fase (em 2× a fase virava no ~57\')')
naoTem(SC, 'roundMs={copaLegMs} classico', 'quickCopa: o placar grande voltou a receber o tempo sem a marcha')
tem(PY, 'setTimeout(semDisputa(() => setCopaReady(true)), Math.max(0,dur+250+penMs-already))', 'Copa da carreira: o "Próxima fase" acende antes do fim da volta/disputa')
naoTem(PY, 'Math.round(dur * 0.9)+250+penMs', 'Copa da carreira: o botão voltou a acender a 90% da fase')
tem(PY, 'setTimeout(semDisputa(avancaCopaAuto), Math.max(0,dur+2200+penMs-already))', 'Copa da carreira: o avanço automático não espera a disputa')
tem(CM, 'if (disputaRolandoNaTela() && Date.now() < due + 30000)', 'Copa do Mundo (offline): o apito não espera a disputa do campinho')

// ── 4b. relógio do banco (Copa do Mundo/regionais): o dono segura o 'finish' até a disputa inteira caber ─────────────
const { dueClockCommand, fimDoPassoMs, EXTRA_MAX_PENALTIS_MS } = modulo('src/escalacao/copa-clock-preview.ts')
tem('src/escalacao/copa-clock-preview.ts', 'r.running?extra.current(r.step):0', 'Copa do Mundo: o dono não confere o tempo da disputa antes de apitar')
tem(CR, 'fimDoPassoMs(r, doisDDoPasso(r) ?? doisD, extra.current(r.step))', 'regionais: o dono não confere o tempo da disputa antes de apitar')
const PASSO = 1.6, teto = (n: number) => 0.7 + Math.max(n, 10) * PASSO + 0.6 // pensRevealDelay com gente (o pior caso)
for (const doisD of [false, true]) {
  for (const n of [10, 14, 24, 37, 40, 60, 80]) {
    const precisa = Math.round(teto(n) * 1000)
    const row = { step: 3, running: true, manual: false, speed: 1, started_at: new Date(0).toISOString(), updated_at: new Date(0).toISOString(), duration_ms: doisD ? 43902 : 16000, extra_ms: 700 + Math.min(60000, precisa) }
    const apitoJogo = doisD ? Math.round(row.duration_ms * 0.82) : Math.round(row.duration_ms * 0.82) // 93' no placar
    const fimDisputa = apitoJogo + precisa // a disputa começa aos 93' e dura `precisa`
    const due = fimDoPassoMs(row, doisD, precisa)
    ok(due >= fimDisputa, `relógio do banco (${doisD ? '2D' : 'normal'}): disputa de ${n} cobranças termina em ${fimDisputa} ms e o passo fecha em ${due} ms`)
    ok(dueClockCommand(row, due - 1, doisD, precisa) === null, `relógio do banco: apitou antes da disputa acabar (${n} cobranças)`)
    ok(dueClockCommand(row, due, doisD, precisa) === 'finish', `relógio do banco: não apitou depois da disputa (${n} cobranças) — a sala travaria`)
    ok(fimDoPassoMs(row, doisD, 0) <= due, 'relógio do banco: sem disputa o passo ficou mais longo')
  }
}
// o teto do dono cobre morte súbita de 80 cobranças (40 rodadas) com gente e nunca deixa a sala presa pra sempre
ok(teto(80) * 1000 <= EXTRA_MAX_PENALTIS_MS, `teto do dono (${EXTRA_MAX_PENALTIS_MS} ms) menor que uma morte súbita de 80 cobranças`)
{ const row = { step: 3, running: true, manual: false, speed: 1, started_at: new Date(0).toISOString(), updated_at: new Date(0).toISOString(), duration_ms: 16000, extra_ms: 700 }
  ok(dueClockCommand(row, 16000 + 700 + EXTRA_MAX_PENALTIS_MS + 151, false, 10 ** 9) === 'finish', 'relógio do banco: um extra absurdo prende a sala') }
// a maior disputa já sorteada pelo motor cabe no teto (amostra grande, com a sequência de verdade)
{
  let rng = 12345, maior = 0
  const r01 = () => { rng = (rng * 1103515245 + 12345) & 0x7fffffff; return rng / 0x7fffffff }
  for (let i = 0; i < 20000; i++) maior = Math.max(maior, disputaPenaltisComSequencia(r01).seq.length)
  ok(teto(maior) * 1000 <= EXTRA_MAX_PENALTIS_MS, `a maior disputa sorteada (${maior} cobranças) não cabe no teto do dono`)
}

// ── 4c. o registro "disputa na tela": quem vira fase pergunta aqui ───────────────────────────────────────────────
{
  const s = new DisputaPenaltisCampo({ id: 'registro', pens: [4, 2], aName: 'A', bName: 'B', orcamento: 12 })
  ok(!disputaRolandoNaTela(), 'registro: começa com disputa rolando sem ninguém na tela')
  entrouNaTela(s)
  ok(disputaRolandoNaTela(), 'registro: a disputa na tela não segura a fase')
  while (!s.estado.encerrado) s.avancar(.25, 1, false, true)
  ok(!disputaRolandoNaTela(), 'registro: disputa encerrada continua segurando a fase')
  saiuDaTela(s)
  ok(!disputaRolandoNaTela(), 'registro: disputa que saiu da tela continua segurando a fase')
}
ok(!/Date\.now|localStorage|supabase|channel/.test(ler('src/escalacao/penaltis-na-tela.ts')), 'penaltis-na-tela.ts: o registro só pode ser memória local (nada de relógio, banco ou canal)')

if (falhas.length) { console.error(`❌ penaltis-sem-spoiler: ${falhas.length} falha(s)\n` + [...new Set(falhas)].join('\n')); process.exit(1) }
console.log('✅ penaltis-sem-spoiler: bolinhas/número sobem uma cobrança por vez · 5 telas seguram o vencedor até a última cobrança · fase/botão/automático esperam a disputa · relógio do banco cabe morte súbita de até 80 cobranças (o dono segura acima do teto de 60 s) · placar cinema na mesma marcha da fase')
