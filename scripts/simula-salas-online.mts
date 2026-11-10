// 🧪🌐 SIMULADOR DE SALAS ONLINE (estresse) — roda o REDUCER DE VERDADE do jeito que a sala roda:
//   · 1 DONO (isHost) que recebe os recados e é o único que roda as ações da sala;
//   · N CONVIDADOS que só MANDAM recados (como o `dispatch` do EscProvider faz) e recebem o estado do dono pelo mesmo
//     caminho do evento 'state' (sanitize → empacota → desempacota → SYNC_STATE), guardando o youIdx/youUid LOCAL;
//   · a mesma "auto-cura de identidade" do provider (myMgrIdRef → FIX_YOU_IDX) roda no convidado depois de cada estado.
// Rede ruim: atraso aleatório, recado repetido (as duas estradas: rádio + room_acoes), recado perdido, ordem trocada,
// convidado que recarrega a página (RESTORE_ONLINE do "banco") e convidado que sai no meio (KICK_PLAYER).
// Relógio falso (Date.now) e Math.random com semente: toda falha se reproduz com a mesma semente.
//
// uso: npx tsx scripts/simula-salas-online.mts [--seeds 50] [--cenario nome] [--seed N] [--verbose]
import { reducer, INITIAL, sanitize, tiraBioDoRadio, poeBioDoRadio, openSlots, montePickable, paPodeLancar, paMinimo, paMesasAtivas, paMesa, assentoDoCracha, sortedTable } from '../src/escalacao/store'
import { pack, unpack, packCom, unpackCom } from '../src/escalacao/netpack'
import { FORMATIONS, SECTORS, duplaPodeAgir } from '../src/escalacao/types'
import type { EscState, Manager, Card } from '../src/escalacao/types'
import { cartasLivres, nomesOcupados, chaveCarta, chaveNome, cartaPermitidaDraft, podemSairMinha, MLD_ELENCO_MAX } from '../src/escalacao/liga-draft'

// o cliente do Supabase dispara um callback assíncrono ao carregar (lê import.meta.env, que não existe fora do Vite):
// sem rede de verdade aqui, ele só faria o processo cair — ignora ESSE erro e deixa os outros explodirem
process.on('uncaughtException', e => { if (String((e as Error)?.stack ?? e).includes('applyCentralUnlock')) return; throw e })
process.on('unhandledRejection', e => { if (String((e as Error)?.stack ?? e).includes('applyCentralUnlock')) return; throw e })
// ─── relógio e sorte ────────────────────────────────────────────────────────
let NOW = 1_800_000_000_000
Date.now = () => NOW
function mulberry(a: number) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 } }
let R = mulberry(1)
const rnd = () => R()
const chance = (p: number) => rnd() < p
const entre = (a: number, b: number) => a + Math.floor(rnd() * (b - a + 1))
const pega = <T,>(xs: T[]): T | undefined => xs.length ? xs[Math.floor(rnd() * xs.length)] : undefined

const arg = (n: string, d?: string) => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const VERBOSE = process.argv.includes('--verbose')
const CURA_CORRIGIDA = !process.argv.includes('--cura-antiga') // 10/11: a cura pelo crachá (UID) entrou no jogo; --cura-antiga reproduz a de antes
const SEEDS = Number(arg('seeds', '50'))

// ─── tipos do simulador ─────────────────────────────────────────────────────
type Act = { type: string; mgrId?: number; by?: string; [k: string]: unknown }
type Cli = {
  uid: string; nome: string; host: boolean; st: EscState; vivo: boolean; geracao: number
  myMgrId: number | null; lastRoom?: string // refs do provider (auto-cura de identidade)
  cool: Record<string, number> // decisão → quando pode repetir
  ultimoEstado: number; acaoPendente: number
  saiEm?: number; recarregaEm?: number; afk: number // 0..1 chance de não agir na vez
  dupla?: { owner: string } // eu sou parceiro do dono `owner`
  velho?: boolean // 🗂️ aba VELHA aberta (versão de antes da bio fora do rádio): lê o pacote sem pôr a bio de volta
}
type Msg = { t: number; seq: number; run: () => void }
type Falha = { cenario: string; seed: number; tipo: string; detalhe: string; t: number; trilha: string[] }

// ─── fila de eventos ───────────────────────────────────────────────────────
let fila: Msg[] = []
let seqN = 0
const agenda = (dt: number, run: () => void) => { fila.push({ t: NOW + Math.max(0, dt), seq: seqN++, run }) }

// ─── cenário ────────────────────────────────────────────────────────────────
type Cenario = {
  nome: string; humanos: number[]; // tamanhos de sala a sortear
  start: Record<string, unknown>
  fim: 'mesmo' | 'leilao' | 'draft'
  duplas?: boolean
  temporadas?: number
}
const CENARIOS: Cenario[] = [
  { nome: 'envelope-liga', humanos: [2, 4, 8], start: { copaMode: 'liga', deck: 'br' }, fim: 'leilao' },
  { nome: 'tocaia', humanos: [2, 4, 8], start: { copaMode: 'liga', deck: 'br', holandes: true }, fim: 'mesmo' },
  { nome: 'pregao-aberto', humanos: [2, 4, 8], start: { copaMode: 'liga', deck: 'todos', pregaoAberto: true }, fim: 'leilao' },
  { nome: 'envelope-unico', humanos: [2, 4, 8], start: { copaMode: 'liga', deck: 'br', envUnico: true }, fim: 'leilao' },
  { nome: 'clubes', humanos: [2, 4, 8], start: { copaMode: 'liga', deck: 'todos', clubes: true }, fim: 'leilao' },
  { nome: 'duplas', humanos: [4, 6], start: { copaMode: 'liga', deck: 'br' }, fim: 'leilao', duplas: true },
  { nome: 'liga10-novo-leilao', humanos: [2, 4, 8], start: { copaMode: 'liga', deck: 'br', liga: true, tamanhoLiga: 10 }, fim: 'leilao' },
  { nome: 'liga-copa', humanos: [2, 4, 8], start: { copaMode: 'liga_copa', deck: 'br' }, fim: 'leilao' },
  { nome: 'liga-liberta', humanos: [2, 4, 8], start: { copaMode: 'liga_liberta', deck: 'br' }, fim: 'leilao' },
  { nome: 'liga-champions', humanos: [2, 4, 8], start: { copaMode: 'liga_champions', deck: 'eu' }, fim: 'leilao' },
  { nome: 'so-champions', humanos: [2, 4, 8], start: { copaMode: 'champions', deck: 'todos' }, fim: 'leilao' },
  { nome: 'relampago', humanos: [2, 4, 8], start: { copaMode: 'relampago', relampagoChave: 16, deck: 'br' }, fim: 'leilao' },
  { nome: 'liga-draft', humanos: [2, 4, 8], start: { copaMode: 'liga', deck: 'todos', liga: true, ligaDraft: true, minhaLigaDraft: true, draftRegras: { piorPrimeiro: true } }, fim: 'draft' },
]

// ─── estado global da corrida ───────────────────────────────────────────────
let H: Cli // o dono
let G: Cli[] = [] // convidados (inclui parceiros de dupla)
let CEN: Cenario
let SEED = 0
let falhas: Falha[] = []
let trilha: string[] = []
let roomPlayers: { uid: string; nome: string; idx: number; partnerOf?: string }[] = []
let dbSnap: { st: EscState; t: number } | null = null
let estadoEnviadoAte = 0, envioMarcado = false
let ultimoProgresso = 0, assinaturaAnt = ''
let acabou = false
let temporadasJogadas = 0
let fimDecidido = -1
let jaChecouTemporada = ''
let vistosDraftOrdem = ''
let parado = false
const log = (s: string) => { trilha.push(`[${((NOW - T0) / 1000).toFixed(1)}s] ${s}`); if (trilha.length > 60) trilha.shift(); if (VERBOSE) console.log(trilha.at(-1)) }
let T0 = NOW
const falha = (tipo: string, detalhe: string) => {
  if (falhas.some(f => f.tipo === tipo && f.seed === SEED && f.cenario === CEN.nome)) return // uma de cada tipo por corrida
  falhas.push({ cenario: CEN.nome, seed: SEED, tipo, detalhe, t: NOW - T0, trilha: [...trilha.slice(-25)] })
  log(`❌ ${tipo}: ${detalhe}`)
}

// ─── ajudantes de leitura ───────────────────────────────────────────────────
const meuIdNoHost = (uid: string): number => assentoDoCracha(H.st, uid)
const mgrPorId = (st: EscState, id: number) => st.managers.find(m => m.id === id)
const eu = (c: Cli): Manager | undefined => c.st.managers[c.st.youIdx]
const chaveCartaFull = (c: Card) => `${c.name}|${c.club}|${c.year}`

// ─── o DONO aplica uma ação ────────────────────────────────────────────────
const COM_MGR = new Set(['SUBMIT_ENVELOPE', 'SUBMIT_TIEBREAK', 'MONTE_PICK', 'MONTE_PASS', 'HOLANDES_PEGAR', 'PREGAO_ABERTO_LANCE', 'CONVOCAR_CLUBES', 'CAST_SEASON_VOTE',
  'DRAFT_ESCOLHER', 'DRAFT_PASSAR', 'DRAFT_PRONTO', 'DRAFT_ESTOU_PRONTO', 'DRAFT_VENDER', 'DRAFT_SONDAR', 'DRAFT_LANCE', 'DRAFT_LACRAR', 'DRAFT_IGUALAR', 'MLD_FORMACAO', 'MLD_TROCA', 'CONFIRM_RESTART'])
function hostAplica(a: Act, de: string, via: string) {
  if (!H.vivo) return
  const antes = H.st
  // 🪑 o recado que chegou é do assento de QUEM mandou?
  if (de !== H.uid && a.mgrId != null && COM_MGR.has(a.type)) {
    const certo = meuIdNoHost(de)
    if (certo !== a.mgrId) {
      // a ação vale contra o assento de outra pessoa?
      let depois: EscState
      try { depois = reducer(antes, a as never) } catch { depois = antes }
      const outro = mgrPorId(antes, a.mgrId)
      const dono = outro && Array.isArray(antes.seatUids) ? antes.seatUids[outro.id] : undefined
      if (impressao(depois) !== impressao(antes)) falha('ASSENTO-TROCADO', `${a.type} de ${de} (assento certo ${certo}) chegou com mgrId ${a.mgrId}${outro ? ` = ${outro.teamName}${outro.isHuman ? ` (humano, crachá ${dono})` : ' (bot)'}` : ''} via ${via} e o dono ACEITOU (tela ${antes.screen}/${antes.phase})`)
      else log(`(recado com mgrId ${a.mgrId} de ${de} — certo ${certo} — recusado pelo reducer: ${a.type})`)
    }
  }
  let depois: EscState
  try { depois = reducer(antes, a as never) } catch (e) { falha('CRASH', `${a.type} de ${de}: ${(e as Error).stack?.split('\n').slice(0, 4).join(' | ')}`); return }
  if (depois === antes) return
  H.st = depois
  if (VERBOSE && impressao(depois) !== impressao(antes) && a.type !== 'PREGAO_ABERTO_TICK' && a.type !== 'HOLANDES_TICK' && a.type !== 'DRAFT_TICK') log(`dono aplicou ${a.type}${a.mgrId != null ? `(${a.mgrId})` : ''} de ${de} via ${via} → ${depois.screen}/${depois.phase} s${depois.sectorIdx} r${depois.round} mi${antes.monteIdx}->${depois.monteIdx} dl${antes.monteDeadline ? Math.round((antes.monteDeadline - NOW) / 1000) : '-'}->${depois.monteDeadline ? Math.round((depois.monteDeadline - NOW) / 1000) : '-'} vez${antes.monteOrder[antes.monteIdx]}->${depois.monteOrder[depois.monteIdx]}`)
  checaDono(antes, depois, a, de)
  marcaEnvio()
}

// impressão digital do que importa (o reducer devolve CÓPIA mesmo quando recusa, então identidade não serve)
function impressao(st: EscState): string {
  return JSON.stringify([assinatura(st), st.managers.map(m => [m.id, m.isHuman, m.money, m.squad.map(c => c.id).join(',')]), st.pendingEnvelopes, st.seasonVotes, st.submitted,
    st.monteIdx, st.monte.length, st.tiebreaks?.[st.tiebreakIdx]?.submitted, st.tiebreakPending, st.hol?.pedidos, st.hol?.levados, st.pa ? [st.pa.lider, st.pa.preco, st.pa.m2?.lider, st.pa.m2?.preco] : 0,
    st.convocacaoEscolhas, st.convocacaoFeitos, st.draft ? JSON.stringify(st.draft) : 0, st.duplas, st.restartReady])
}
// ─── invariantes do estado do dono ─────────────────────────────────────────
function checaDono(antes: EscState, s: EscState, a: Act, de: string) {
  // 💰 dinheiro
  for (const m of s.managers) {
    if (!Number.isFinite(m.money)) falha('DINHEIRO-NAN', `${m.teamName} money=${m.money} depois de ${a.type}`)
    else if (m.isHuman && m.money < 0) falha('DINHEIRO-NEGATIVO', `${m.teamName} (humano) money=${m.money} depois de ${a.type}`)
  }
  // 🃏 carta em dois times
  const vistos = new Map<string, string>()
  for (const m of s.managers) for (const c of m.squad) {
    if (c.fake) continue
    const k = (c as { pacote?: unknown }).pacote ? `pacote:${c.name}|${c.pos}` : chaveCartaFull(c) // 🧱 pacote de clube: um por posição
    const ja = vistos.get(k)
    if (ja && ja !== m.teamName) { falha('CARTA-DUPLICADA', `${k} em ${ja} e ${m.teamName} depois de ${a.type} (tela ${s.screen})`); break }
    if (ja === m.teamName) { falha('CARTA-REPETIDA-NO-TIME', `${k} 2× em ${m.teamName} depois de ${a.type}`); break }
    vistos.set(k, m.teamName)
  }
  if (s.ligaDraft) { // ☝️ jogador único na liga (pelo nome)
    const nomes = new Map<string, string>()
    for (const m of s.managers) for (const c of m.squad) { if (c.fake) continue; const k = chaveNome(c.name); const ja = nomes.get(k); if (ja && ja !== `${m.id}`) { falha('DRAFT-NOME-REPETIDO', `${c.name} em ${ja} e ${m.id} depois de ${a.type}`); break } nomes.set(k, `${m.id}`) }
  }
  // 🧑‍🤝‍🧑 um recado de A não mexe no voto/envelope/pronto de B
  if (a.mgrId != null && COM_MGR.has(a.type)) {
    const novos = (x: number[] | undefined, y: number[] | undefined) => (y ?? []).filter(id => !(x ?? []).includes(id))
    const quem = new Set<number>([a.mgrId])
    const sub = a.type === 'SUBMIT_ENVELOPE' && s.phase === antes.phase ? novos(antes.submitted, s.submitted).filter(id => !quem.has(id)) : []
    const votos = Object.keys(s.seasonVotes ?? {}).map(Number).filter(id => (antes.seasonVotes ?? {})[id] !== (s.seasonVotes ?? {})[id] && !quem.has(id))
    if (sub.length) falha('ACAO-MEXEU-EM-OUTRO', `${a.type} de ${a.mgrId} marcou lacrado ${sub.join(',')}`)
    if (votos.length && a.type === 'CAST_SEASON_VOTE') falha('ACAO-MEXEU-EM-OUTRO', `voto de ${a.mgrId} mudou voto de ${votos.join(',')}`)
  }
  // ⚽ todo humano com o XI fechado quando a temporada começa
  const k = `${s.seasonNo}|${s.screen}`
  // (Só Champions abre direto na tela 'champions'; Relâmpago abre na 'season' sem liga — os dois contam como começo de temporada)
  if (((s.screen === 'season' && (s.round === 0 || s.copaMode === 'relampago')) || (s.screen === 'champions' && s.champions?.rodada === 0)) && antes.screen !== s.screen && jaChecouTemporada !== `${s.seasonNo}`) {
    jaChecouTemporada = `${s.seasonNo}`; void k
    for (const m of s.managers.filter(m => m.isHuman)) {
      const need = FORMATIONS[m.formation]
      const falta = SECTORS.filter(p => m.squad.filter(c => c.pos === p && !c.fake).length < (need?.[p] ?? 0))
      if (falta.length) falha('XI-INCOMPLETO', `${m.teamName} começou a temporada ${s.seasonNo} sem fechar ${falta.join(',')} (${m.formation}; elenco ${m.squad.length}, fake ${m.squad.filter(c => c.fake).length})`)
      const fakes = m.squad.filter(c => c.fake)
      if (fakes.length) falha('FAKE-EM-HUMANO', `${m.teamName} tem ${fakes.length} jogador(es) de mentira: ${fakes.map(c => c.name).join(', ')}`)
      if (m.squad.some(c => (c as { pacote?: unknown }).pacote)) falha('PACOTE-FECHADO', `${m.teamName} começou a temporada com pacote de clube fechado`)
    }
    if (CEN.start.tamanhoLiga === 10 && s.league.length !== 10) falha('LIGA10-VIROU', `temporada ${s.seasonNo} com tabela de ${s.league.length} (devia ser 10); tamanhoLiga=${s.tamanhoLiga}`)
    if (CEN.start.tamanhoLiga === 10 && s.managers.length !== 10) falha('LIGA10-VIROU', `temporada ${s.seasonNo} com ${s.managers.length} clubes (devia ser 10)`)
    temporadasJogadas = Math.max(temporadasJogadas, s.seasonNo)
    log(`🏁 temporada ${s.seasonNo} começou (${s.managers.filter(m => m.isHuman).length} humanos)`)
  }
  // 📋 ordem do draft pior → melhor
  if (s.draft && s.screen === 'draft' && antes.screen !== 'draft' && vistosDraftOrdem !== `${s.seasonNo}`) {
    vistosDraftOrdem = `${s.seasonNo}`
    const hum = new Set(s.managers.filter(m => m.isHuman).map(m => m.id))
    const esperado = sortedTable(antes.league).map(t => t.id).filter(id => hum.has(id)).reverse()
    if (JSON.stringify(esperado) !== JSON.stringify(s.draft.ordem)) falha('DRAFT-ORDEM', `ordem ${JSON.stringify(s.draft.ordem)} ≠ pior→melhor ${JSON.stringify(esperado)}`)
  }
  void de
}

// ─── o dono manda o estado (junta mudanças em 400 ms, igual ao provider) ───
function marcaEnvio() {
  if (envioMarcado) return
  envioMarcado = true
  agenda(400, () => { envioMarcado = false; transmite('junta') })
}
let cacheSrc: EscState | null = null, cacheTxt = ''
let conferidosPack = 0
function pacote(st: EscState): string {
  if (st === cacheSrc) return cacheTxt
  cacheSrc = st
  cacheTxt = JSON.stringify(sanitize(st))
  // 📡 o caminho do rádio de verdade (bio fora → bio de volta) tem que devolver EXATAMENTE o mesmo estado — confere em todo estado novo
  const z = packCom(sanitize(st), tiraBioDoRadio)
  const volta = unpackCom(z, poeBioDoRadio)
  conferidosPack++
  if (ordena(volta) !== ordena(JSON.parse(cacheTxt))) falha('RADIO-DIFERENTE', 'o estado que chega pelo rádio não é igual ao que o dono mandou')
  cacheVelho = JSON.stringify(unpack(z)) // como a aba velha lê (o `readState` de antes: unpack puro)
  return JSON.stringify(volta)
}
let cacheVelho = ''
const ordena = (x: unknown): string => JSON.stringify(x, (_k, v) => v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)) : v)
// 📏 --medir: quanto cada campo pesa no que o dono manda (comprimido, como vai no rádio)
const MEDIR = process.argv.includes('--medir')
const medida: Record<string, { n: number; tot: number; campos: Record<string, number> }> = {}
let medSrc: EscState | null = null
let medPrevTxt: Record<string, string> = {}, medDeltaUlt = 0, medDelta = 0
const porMotivo: Record<string, number> = {}
let medRadio = 0
let medUlt: { k: string; total: number; radio: number; campos: [string, number][] } = { k: '', total: 0, radio: 0, campos: [] }
function mede(st: EscState, n: number) {
  const novoEstado = st !== medSrc
  if (st !== medSrc) {
    medSrc = st
    const san = sanitize(st) as unknown as Record<string, unknown>
    // 🧪 estimativa: mandar só as chaves de cima que mudaram desde o envio anterior
    const txts: Record<string, string> = {}
    for (const [c, v] of Object.entries(san)) txts[c] = JSON.stringify(v) ?? ''
    const mud: Record<string, unknown> = {}
    for (const c of Object.keys(txts)) if (medPrevTxt[c] !== txts[c]) mud[c] = san[c]
    for (const c of Object.keys(medPrevTxt)) if (!(c in txts)) mud[c] = null
    medPrevTxt = txts
    medDeltaUlt = packCom(mud, tiraBioDoRadio).length
    medUlt = { k: `${st.screen}/${st.phase}`, total: pack(san).length, radio: packCom(san, tiraBioDoRadio).length, campos: [...Object.entries(san).filter(([, v]) => v !== undefined).map(([c, v]) => [c, packCom(v, tiraBioDoRadio).length] as [string, number]),
      ...(process.argv.includes('--medir-mgr') ? Object.keys((san.managers as Record<string, unknown>[])[0] ?? {}).map(f => [`mgr.${f}`, packCom((san.managers as Record<string, unknown>[]).map(m => m[f]), tiraBioDoRadio).length] as [string, number]) : [])] }
  }
  const m = medida[medUlt.k] ??= { n: 0, tot: 0, campos: {} }
  m.n += n; m.tot += medUlt.total * n; medRadio += medUlt.radio * n; medDelta += (novoEstado ? medDeltaUlt : 0) * n
  for (const [c, v] of medUlt.campos) m.campos[c] = (m.campos[c] ?? 0) + v * n
}
export function relatorioMedida() {
  const tot = Object.values(medida).reduce((a, m) => a + m.tot, 0)
  const campos: Record<string, number> = {}
  for (const m of Object.values(medida)) for (const [c, v] of Object.entries(m.campos)) campos[c] = (campos[c] ?? 0) + v
  console.log(`\n📏 enviado ANTES (comprimido, × convidados): ${(tot / 1e6).toFixed(2)} MB`)
  console.log(`🧪 se mandasse só o que mudou (estimativa, sem os reenvios): ${(medDelta / 1e6).toFixed(2)} MB (−${(100 - 100 * medDelta / tot).toFixed(0)}%)`)
  console.log(`📨 entregas por motivo: ${Object.entries(porMotivo).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(' · ')}`)
  console.log(`📡 enviado AGORA (rádio de hoje): ${(medRadio / 1e6).toFixed(2)} MB (−${(100 - 100 * medRadio / tot).toFixed(0)}%)`)
  for (const [k, m] of Object.entries(medida).sort((a, b) => b[1].tot - a[1].tot).slice(0, 8)) console.log(`  ${k}: ${m.n} envios · ${(m.tot / 1e6).toFixed(2)} MB · média ${(m.tot / m.n / 1024).toFixed(1)} KB`)
  const somaC = Object.values(campos).reduce((a, b) => a + b, 0)
  for (const [c, v] of Object.entries(campos).sort((a, b) => b[1] - a[1]).slice(0, 20)) console.log(`    ${c.padEnd(26)} ${(100 * v / somaC).toFixed(1)}%`)
}
function transmite(porque: string, so?: Cli) {
  if (!H.vivo) return
  estadoEnviadoAte = NOW
  if (MEDIR) { const n = (so ? [so] : G).filter(g => g.vivo).length; mede(H.st, n); porMotivo[porque] = (porMotivo[porque] ?? 0) + n }
  const txt = pacote(H.st)
  const tHost = NOW
  for (const g of (so ? [so] : G)) {
    if (!g.vivo) continue
    if (chance(0.06)) continue // perdeu no caminho
    const ger = g.geracao
    // rádio é ordenado por convidado: entrega depois da última marcada
    const dt = entre(40, 900)
    const quando = Math.max(NOW + dt, (g as Cli & { _ult?: number })._ult ?? 0)
    ;(g as Cli & { _ult?: number })._ult = quando
    const meu = g.velho ? cacheVelho : txt
    fila.push({ t: quando, seq: seqN++, run: () => { if (g.vivo && g.geracao === ger) convidadoRecebe(g, meu, tHost) } })
  }
  void porque
}

// ─── o convidado recebe o estado (SYNC_STATE + auto-cura do provider) ──────
function convidadoRecebe(g: Cli, txt: string, _t: number) {
  let next: EscState
  try { next = JSON.parse(txt) } catch { return }
  g.ultimoEstado = NOW
  g.acaoPendente = 0
  const antes = g.st
  try { g.st = reducer(g.st, { type: 'SYNC_STATE', newState: next } as never) } catch (e) { falha('CRASH-SYNC', (e as Error).message); return }
  autoCura(g)
  confereIdentidade(g, 'SYNC')
  void antes
}
// o efeito "AUTO-CURA DE IDENTIDADE" do EscProvider (store.tsx ~15838), copiado à risca
function autoCura(g: Cli) {
  const st = g.st
  if (st.onlineMode !== 'online' || !st.roomId) return
  if (st.screen === 'intro' || st.screen === 'lobby') return
  if (st.roomId !== g.lastRoom) { g.lastRoom = st.roomId; g.myMgrId = null }
  if (CURA_CORRIGIDA && st.youUid && Array.isArray(st.seatUids) && st.seatUids.length) { // 🧪 --cura-corrigida: a correção proposta (o crachá manda)
    const seat = assentoDoCracha(st, st.youUid)
    if (seat >= 0) { g.myMgrId = seat; const idx = st.managers.findIndex(m => m.id === seat); if (idx >= 0 && idx !== st.youIdx) g.st = reducer(g.st, { type: 'FIX_YOU_IDX', idx } as never); return }
  }
  const myId = g.myMgrId
  if (myId != null) {
    const idx = st.managers.findIndex(m => m.isHuman && m.id === myId)
    if (idx >= 0) { if (idx !== st.youIdx) { log(`🛟 ${g.uid}: FIX_YOU_IDX pelo crachá guardado ${myId} → cadeira ${idx}`); g.st = reducer(g.st, { type: 'FIX_YOU_IDX', idx } as never) } return }
    g.myMgrId = null
  }
  const cands = st.managers.filter(m => m.isHuman && m.name.trim() === g.nome)
  if (cands.length !== 1) return
  g.myMgrId = cands[0].id
  const idx = st.managers.findIndex(m => m.id === cands[0].id)
  if (idx >= 0 && idx !== st.youIdx) { log(`🛟 ${g.uid}: FIX_YOU_IDX pelo nome → ${idx}`); g.st = reducer(g.st, { type: 'FIX_YOU_IDX', idx } as never) }
}
function confereIdentidade(g: Cli, onde: string) {
  const st = g.st
  if (!Array.isArray(st.seatUids) || !st.seatUids.length || st.screen === 'lobby' || st.screen === 'intro') return
  const seat = assentoDoCracha(st, g.uid)
  if (seat < 0) return // não estou mais na sala
  const meu = st.managers[st.youIdx]
  if (!meu || meu.id !== seat) falha('IDENTIDADE-ERRADA', `${g.uid} (${g.nome}) depois de ${onde}: youIdx ${st.youIdx} aponta ${meu?.teamName} (id ${meu?.id}${meu?.isHuman ? ', humano' : ', bot'}) mas o crachá diz assento ${seat} (tela ${st.screen}, temporada ${st.seasonNo})`)
}

// ─── o convidado manda um recado ───────────────────────────────────────────
const ESTRADA_RESERVA = new Set(['SUBMIT_ENVELOPE', 'SUBMIT_TIEBREAK', 'HOLANDES_PEGAR', 'PREGAO_ABERTO_LANCE', 'CONVOCAR_CLUBES', 'CONVOCACAO_TIMEOUT', 'FORCE_SEAL', 'FORCE_TIEBREAK',
  'DRAFT_ESCOLHER', 'DRAFT_PRONTO', 'DRAFT_PASSAR', 'DRAFT_SONDAR', 'DRAFT_LANCE', 'DRAFT_LACRAR', 'DRAFT_IGUALAR'])
function manda(c: Cli, a: Act) {
  if (!c.vivo) return
  if (c.host) { hostAplica(a, c.uid, 'local'); return }
  if (a.mgrId != null && COM_MGR.has(a.type)) {
    // o recado sai com o assento que o aparelho DELE acha que é o dele — confere contra a verdade
    const certo = meuIdNoHost(c.uid)
    if (certo >= 0 && certo !== a.mgrId) log(`⚠️ ${c.uid} mandou ${a.type} com mgrId ${a.mgrId} (assento real ${certo}; youIdx local ${c.st.youIdx}, tela local ${c.st.screen} t${c.st.seasonNo})`)
  }
  if (!c.acaoPendente) c.acaoPendente = NOW
  const vai = (dt: number, via: string) => agenda(dt, () => hostAplica(a, c.uid, via))
  if (!chance(0.08)) vai(entre(30, 700), 'radio') // rádio (8% perde)
  if (chance(0.10)) vai(entre(100, 3000), 'radio-dup') // repetido
  if (ESTRADA_RESERVA.has(a.type) && chance(0.85)) vai(entre(900, 3600), 'room_acoes') // a estrada do banco (dono lê de 3 em 3 s)
}
const pode = (c: Cli, chave: string, ms: number) => { if ((c.cool[chave] ?? 0) > NOW) return false; c.cool[chave] = NOW + ms; return true }

// ─── o "jogador" de cada aparelho ──────────────────────────────────────────
function meuUidDeAcao(c: Cli) { return c.uid }
function podeAgir(c: Cli, cat: string): boolean {
  const m = eu(c); if (!m) return false
  return duplaPodeAgir(c.st.duplas, m.id, cat as never, c.uid)
}
function jogador(c: Cli) {
  const st = c.st
  const m = eu(c)
  if (!m || !c.vivo) return
  if (!m.isHuman && st.screen !== 'end') return
  const by = meuUidDeAcao(c)
  const sec = SECTORS[st.sectorIdx]
  if (st.screen === 'auction') {
    if ((st.phase === 'envelope' || st.phase === 'resq_envelope') && !st.submitted.includes(m.id) && m.money > 0) {
      const secs = st.euAberto ? SECTORS.filter(p => openSlots(m, p) > 0 && st.currentCards.some(x => x.pos === p)) : (openSlots(m, sec) > 0 ? [sec] : [])
      const meus = secs.filter(p => podeAgir(c, p))
      if (meus.length && pode(c, `env:${st.seasonNo}:${st.sectorIdx}:${st.phase}:${st.euRodada ?? 0}:${st.sectorCursor}`, chance(c.afk) ? 60_000 : entre(1500, 9000))) {
        if (chance(c.afk)) return
        let caixa = m.money
        const bids: { cardId: string; amount: number }[] = []
        for (const p of meus) for (const card of st.currentCards.filter(x => x.pos === p).slice(0, openSlots(m, p))) {
          if (chance(0.3)) continue
          const v = Math.min(caixa, chance(0.1) ? caixa : entre(0, Math.max(1, Math.floor(m.money / 4))))
          if (v <= 0) continue
          bids.push({ cardId: card.id, amount: v }); caixa -= v
        }
        manda(c, { type: 'SUBMIT_ENVELOPE', mgrId: m.id, bids, by })
      }
    }
    if (st.phase === 'tiebreak') {
      const tb = st.tiebreaks[st.tiebreakIdx]
      if (tb && tb.winner === null && tb.managers.includes(m.id) && !tb.submitted.includes(m.id) && podeAgir(c, tb.card.pos) && pode(c, `tb:${st.tiebreakIdx}:${tb.card.id}`, 5000))
        if (!chance(c.afk)) manda(c, { type: 'SUBMIT_TIEBREAK', mgrId: m.id, amount: entre(tb.amount, Math.max(tb.amount, Math.floor(m.money))), by })
    }
    if (st.phase === 'holandes' && st.hol && chance(0.12)) {
      const levados = new Set(st.hol.levados.map(l => l.cardId))
      const card = pega(st.currentCards.filter(x => !levados.has(x.id) && openSlots(m, x.pos) > 0 && podeAgir(c, x.pos)))
      if (card && st.hol.preco <= m.money && pode(c, `hol:${st.hol.passo}`, 800)) {
        manda(c, { type: 'HOLANDES_PEGAR', mgrId: m.id, cardId: card.id, preco: st.hol.preco, by })
        if (chance(0.15)) manda(c, { type: 'HOLANDES_PEGAR', mgrId: m.id, cardId: card.id, preco: st.hol.preco, by }) // toque duplo
      }
    }
    if (st.phase === 'pregao' && st.pa) {
      for (const k of paMesasAtivas(st)) {
        const mv = paMesa(st, k)
        if (!mv?.card || !chance(0.10)) continue
        const v = paMinimo(st, k) + pega([0, 0, 1, 2, 5])!
        if (paPodeLancar(st, m.id, v, c.uid, k) && pode(c, `pa:${k}:${mv.card.id}:${mv.M.lances.length}`, 700)) {
          manda(c, { type: 'PREGAO_ABERTO_LANCE', mgrId: m.id, valor: v, mesa: k, cardId: mv.card.id, by })
          if (chance(0.1)) manda(c, { type: 'PREGAO_ABERTO_LANCE', mgrId: m.id, valor: v, mesa: k, cardId: mv.card.id, by })
        }
      }
    }
  }
  if (st.screen === 'monte' && st.monteOrder[st.monteIdx] === m.id && podeAgir(c, 'MONTE')) {
    if (pode(c, `monte:${st.seasonNo}:${st.monteIdx}`, chance(c.afk) ? 120_000 : entre(800, 6000))) {
      if (chance(c.afk)) return
      const ok = st.monte.filter(x => openSlots(m, x.pos) > 0 && montePickable(st, m, x))
      const card = pega(ok)
      if (card) {
        manda(c, { type: 'MONTE_PICK', mgrId: m.id, cardId: card.id, by })
        if (chance(0.25)) manda(c, { type: 'MONTE_PICK', mgrId: m.id, cardId: card.id, by }) // toque duplo
        if (chance(0.1)) { const outra = pega(ok.filter(x => x.id !== card.id)); if (outra) manda(c, { type: 'MONTE_PICK', mgrId: m.id, cardId: outra.id, by }) } // apertou outra carta antes do estado chegar
      }
    }
  }
  if (st.screen === 'convocacao' && !(st.convocacaoFeitos ?? []).includes(m.id) && pode(c, `conv:${st.seasonNo}`, entre(3000, 6000))) {
    if (!chance(c.afk)) {
      const cartas: string[] = []
      for (const w of m.squad as (Card & { pacote?: { cartas: Card[] } })[]) if (w.pacote && podeAgir(c, w.pos)) { const x = pega(w.pacote.cartas); if (x) cartas.push(x.id) }
      manda(c, { type: 'CONVOCAR_CLUBES', mgrId: m.id, cartas, by })
    }
  }
  if (st.screen === 'end' && !st.draft && !c.host) {
    const votos = st.seasonVotes ?? {}
    if (!votos[m.id] && pode(c, `voto:${st.seasonNo}`, 7000)) manda(c, { type: 'CAST_SEASON_VOTE', mgrId: m.id, vote: CEN.fim === 'mesmo' ? 'mesmo' : 'leilao' })
  }
  if (st.screen === 'draft' && st.draft) draftJogador(c, m)
}
function draftJogador(c: Cli, m: Manager) {
  const st = c.st, d = st.draft!
  const by = c.uid
  if (d.fase === 'prontos' && !(d.prontos ?? []).includes(m.id) && pode(c, `dpr:${d.temporada}:${d.proxima}`, 6000)) {
    if (chance(0.3) && d.proxima === 'draft') { const v = pega(m.squad.filter(x => !x.fake)); if (v) manda(c, { type: 'DRAFT_VENDER', mgrId: m.id, cardId: v.id, by }) }
    manda(c, { type: 'DRAFT_ESTOU_PRONTO', mgrId: m.id, by })
  }
  if (d.ordem[d.idx] !== m.id) {
    if (d.fase === 'leilao' && pode(c, `dle:${d.temporada}`, 9000)) {
      ;(d.lotes ?? []).forEach((l, i) => { if (l.dono !== m.id && chance(0.5) && m.money > l.piso) manda(c, { type: 'DRAFT_LANCE', mgrId: m.id, lote: i, valor: entre(l.piso, Math.floor(m.money)), by }) })
      if (chance(0.6)) manda(c, { type: 'DRAFT_LACRAR', mgrId: m.id, by })
    }
    if (d.fase === 'igualar' && (d.lotes ?? [])[d.igualarIdx ?? -1]?.sondador === m.id && pode(c, `dig:${d.igualarIdx}`, 5000)) manda(c, { type: 'DRAFT_IGUALAR', mgrId: m.id, sim: chance(0.5), by })
    return
  }
  if (d.fase === 'aguarda' && pode(c, `dpa:${d.temporada}:${d.idx}`, chance(c.afk) ? 120_000 : entre(1000, 5000))) { if (!chance(c.afk)) manda(c, { type: 'DRAFT_PRONTO', mgrId: m.id, by }) }
  if (d.fase === 'escolha' && pode(c, `des:${d.temporada}:${d.idx}`, entre(2000, 8000))) {
    if (chance(c.afk)) return
    if (chance(0.1) && m.squad.length >= MLD_ELENCO_MAX) { manda(c, { type: 'DRAFT_PASSAR', mgrId: m.id, by }); return }
    if (chance(0.08)) { const alvo = pega(st.managers.filter(x => x.isHuman && x.id !== m.id)); const cc = alvo && pega(alvo.squad.filter(x => !x.fake)); if (alvo && cc) { manda(c, { type: 'DRAFT_SONDAR', mgrId: m.id, dono: alvo.id, cardId: cc.id, by }); return } }
    const livres = cartasLivres(nomesOcupados(st.managers), st.minhaLigaDraft ? st.deckLeague as never : undefined).filter(x => cartaPermitidaDraft(x, st.draftRegras))
    const carta = pega(livres.slice(0, 400))
    if (!carta) return
    const sai = m.squad.length >= MLD_ELENCO_MAX ? pega(podemSairMinha(m.squad as never, carta, m.formation)) : undefined
    const a: Act = { type: 'DRAFT_ESCOLHER', mgrId: m.id, carta: chaveCarta(carta), sai: sai?.id ?? '', by }
    manda(c, a)
    if (chance(0.2)) manda(c, a) // toque duplo
  }
}

// ─── os "relógios" de cada aparelho (useVigiaPrazo / setTimeout das telas) ──
const ultimo: Record<string, number> = {}
const cada = (k: string, ms: number) => { if ((ultimo[k] ?? 0) + ms > NOW) return false; ultimo[k] = NOW; return true }
function vigias(c: Cli) {
  const st = c.st
  const tarde = (prazo: number | null | undefined, folga = 800) => !!prazo && NOW >= prazo + folga
  if ((st.phase === 'envelope' || st.phase === 'resq_envelope') && st.screen === 'auction' && tarde(st.phaseDeadline) && pode(c, `vfs:${st.phaseDeadline}`, 3000)) manda(c, { type: 'FORCE_SEAL' })
  if (st.phase === 'tiebreak' && tarde(st.phaseDeadline) && pode(c, `vft:${st.phaseDeadline}`, 3000)) manda(c, { type: 'FORCE_TIEBREAK' })
  if (st.screen === 'monte' && tarde(st.monteDeadline) && st.managers.find(x => x.id === st.monteOrder[st.monteIdx])?.isHuman && pode(c, `vmt:${st.monteDeadline}`, 3000)) manda(c, { type: 'MONTE_TIMEOUT' })
  if (st.screen === 'cerimonia' && tarde(st.cerimoniaDeadline) && pode(c, `vce:${st.cerimoniaDeadline}`, 3000)) manda(c, { type: 'FINISH_CEREMONY' })
  if (st.screen === 'convocacao' && tarde(st.convocacaoDeadline, 4500) && pode(c, `vcv:${st.convocacaoDeadline}`, 3000)) manda(c, { type: 'CONVOCACAO_TIMEOUT' })
}
// o que SÓ o dono toca (telas: AutoAdvance, holandês, pregão aberto, temporada, draft, fim)
function motorDoDono() {
  const st = H.st
  if (st.screen === 'auction') {
    if ((st.phase === 'reveal' || st.phase === 'resq_reveal') && cada('rev', 1500)) hostAplica({ type: 'ADVANCE_REVEAL' }, H.uid, 'tela')
    if (st.phase === 'holandes' && cada('hol', 600)) hostAplica({ type: 'HOLANDES_TICK' }, H.uid, 'tela')
    if (st.phase === 'pregao' && cada('pa', 500)) hostAplica({ type: 'PREGAO_ABERTO_TICK' }, H.uid, 'tela')
  }
  if (st.screen === 'season') {
    const total = st.fixtures.length
    if (st.round < total && cada('round', 1500)) hostAplica({ type: 'PLAY_ROUND' }, H.uid, 'tela')
    else if (st.round >= total && st.champion == null && !st.quickCopa && cada('fin', 1500)) hostAplica({ type: 'FINISH_SEASON' }, H.uid, 'tela')
    // 🏆 copa/mata-mata (Copa dos 8, mata da Liberta/Champions, Relâmpago): o botão "jogar a perna" do dono
    else if (st.round >= total && st.quickCopa && st.quickCopa.phase !== 'done' && cada('copa', 1500)) hostAplica({ type: 'PLAY_COPA_LEG' }, H.uid, 'tela')
  }
  if (st.screen === 'champions' && st.champions && cada('champ', 1500)) hostAplica({ type: st.champions.fase === 'mata' ? 'START_COPA' : st.champions.fase === 'repescao' ? 'PLAY_CHAMPIONS_REPESCAO' : 'PLAY_CHAMPIONS_RODADA' }, H.uid, 'tela') // o mesmo `avancar` da tela (screens.tsx ~9740)
  if (st.screen === 'liberta' && cada('lib', 1500)) hostAplica({ type: 'PLAY_LIBERTA_RODADA' }, H.uid, 'tela')
  if (st.screen === 'draft' && st.draft) {
    const d = st.draft
    if (cada('dtick', 500)) hostAplica({ type: 'DRAFT_TICK' }, H.uid, 'tela')
    if (d.fase === 'prontos') {
      const hum = st.managers.filter(m => m.isHuman).map(m => m.id)
      const todos = hum.every(id => (d.prontos ?? []).includes(id) || !presente(id))
      if ((todos && cada('dseg', 2000)) || cada('dseg2', 40_000)) hostAplica({ type: 'DRAFT_SEGUIR', by: H.uid }, H.uid, 'tela')
    }
    if (d.fase === 'escala' && cada('desc', 5000)) hostAplica({ type: 'DRAFT_SEGUIR', by: H.uid }, H.uid, 'tela')
    // quem não está mais na sala segura a vez: o dono aperta "pular" depois de um tempo (é o botão dele)
    if ((d.fase === 'aguarda' || d.fase === 'escolha') && !presente(d.ordem[d.idx])) {
      const k = `dpul:${d.temporada}:${d.idx}`
      if (!(k in ultimo)) ultimo[k] = NOW
      else if (NOW - ultimo[k] > 30_000) { hostAplica({ type: 'DRAFT_PULAR', by: H.uid }, H.uid, 'tela'); ultimo[k] = NOW + 1e12 }
    }
    if (d.fase === 'aguarda' && presente(d.ordem[d.idx])) {
      const k = `dpul2:${d.temporada}:${d.idx}`
      if (!(k in ultimo)) ultimo[k] = NOW
      else if (NOW - ultimo[k] > 150_000) { log('dono pulou quem está na vez e não deu pronto'); hostAplica({ type: 'DRAFT_PULAR', by: H.uid }, H.uid, 'tela'); ultimo[k] = NOW + 1e12 }
    }
  }
  if (st.screen === 'end' && !st.draft) fimDoDono()
}
const presente = (id: number) => { const uid = H.st.seatUids?.[id]; return !!uid && roomPlayers.some(p => p.uid === uid) }

// ─── fim de temporada: o dono decide (OnlineEndVote) ───────────────────────
function fimDoDono() {
  const st = H.st
  if (fimDecidido === st.seasonNo) return
  const hum = st.managers.filter(m => m.isHuman && m.id !== eu(H)?.id)
  const votos = st.seasonVotes ?? {}
  const pend = hum.filter(m => !votos[m.id] && presente(m.id))
  const k = `end:${st.seasonNo}`
  if (!(k in ultimo)) ultimo[k] = NOW
  if (pend.length && NOW - ultimo[k] < 25_000) return
  fimDecidido = st.seasonNo
  if (temporadasJogadas >= (CEN.temporadas ?? 2)) { acabou = true; log('✅ fim da corrida'); return }
  const pessoas = new Set(roomPlayers.map(p => p.uid)).size
  if (pessoas < 2) { acabou = true; log('sala ficou com 1 pessoa: volta pra espera (fim)'); return }
  // quem saiu de vez é tirado antes (startMesmo / abrirDraft)
  const ativos = new Set(roomPlayers.map(p => p.idx))
  if (CEN.fim === 'mesmo' || (CEN.fim === 'draft' && !st.minhaLigaDraft)) for (const m of st.managers.filter(m => m.isHuman && m.id !== eu(H)?.id)) if (!ativos.has(m.id)) hostAplica({ type: 'KICK_PLAYER', playerIndex: m.id }, H.uid, 'tela')
  if (CEN.fim === 'mesmo') { log('dono: mesmo time'); hostAplica({ type: 'REPLAY_SEASON' }, H.uid, 'tela'); return }
  if (CEN.fim === 'draft') { log('dono: abre o draft'); hostAplica({ type: 'DRAFT_ABRIR' }, H.uid, 'tela'); return }
  novoLeilao()
}
// a conta do `startLeilao` (screens.tsx ~11730): lista limpa do banco → assentos novos → START_ONLINE com tudo da sala
function novoLeilao() {
  const st = H.st
  const sorted = [...roomPlayers].sort((a, b) => a.idx - b.idx)
  const temDono = (uid?: string) => !!uid && sorted.some(d => d.uid === uid && !d.partnerOf)
  const donos = st.duplasMode ? sorted.filter(p => !temDono(p.partnerOf)) : sorted
  const seen = new Set<string>()
  const uniq = donos.filter(p => (seen.has(p.uid) ? false : (seen.add(p.uid), true)))
  if (uniq.length < 2) { acabou = true; log('novo leilão sozinho: volta pra espera (fim)'); return }
  const duplas: Record<number, unknown> = {}
  const playerNames = uniq.map((p, i) => {
    if (!st.duplasMode) return p.nome
    const par = sorted.find(x => x.partnerOf === p.uid && x.uid !== p.uid)
    const d0 = st.duplas?.[st.seatUids?.indexOf(p.uid) ?? -1]
    duplas[i] = { ownerUid: p.uid, ownerName: p.nome, ...(par ? { partnerUid: par.uid, partnerName: par.nome } : {}), ...(d0?.cats ? { cats: d0.cats } : {}) }
    return par ? `${p.nome}|${par.nome}` : p.nome
  })
  // o banco é renumerado (best effort no código de verdade)
  uniq.forEach((p, i) => { p.idx = i; for (const par of sorted) if (par.partnerOf === p.uid) par.idx = i })
  const myPos = uniq.findIndex(p => p.uid === H.uid)
  log(`dono: novo leilão com ${uniq.map(p => p.uid).join(',')}`)
  hostAplica({
    type: 'START_ONLINE', roomId: st.roomId, roomCode: st.roomCode, roomName: st.roomName, isHost: true, playerIndex: myPos >= 0 ? myPos : st.youIdx,
    playerNames, formation: eu(H)?.formation ?? '4-3-3', duplasMode: st.duplasMode, duplas: st.duplasMode ? duplas : undefined, youUid: H.uid,
    seatUids: uniq.map(p => p.uid), deck: st.deckLeague, varzea: st.varzea, regional: st.regionalSala, rematch: NOW, copaMode: st.copaMode,
    seasonNo: (st.seasonNo ?? 1) + 1, stream: st.streamMode, manual: st.manualRoom, chatOff: st.chatOff, campo2d: st.campo2dProximo ?? st.campo2d,
    auctionSecs: st.auctionSecs, ligaFechada: st.ligaFechadaEscolha ?? st.ligaFechada, liga: st.ligaMode, locked: st.locked, pwHash: st.pwHash,
    holandes: st.holandes, pregaoAberto: st.pregaoAberto, envUnico: st.envUnico, tamanhoLiga: st.tamanhoLiga === 10 ? 10 : undefined, turnoUnico: st.turnoUnico === true,
    relampagoChave: st.relampagoChave, ligaDraft: st.ligaDraft, minhaLigaDraft: st.minhaLigaDraft, draftRegras: st.draftRegras, draftPremios: st.draftPremios,
    clubes: st.leilaoClubes, selecao: st.leilaoSelecao, decada: st.leilaoDecada,
  }, H.uid, 'tela')
}

// ─── recarregar / sair ─────────────────────────────────────────────────────
function recarrega(g: Cli) {
  if (!g.vivo || !dbSnap) return
  g.geracao++ // o que estava no caminho pra aba velha some
  g.myMgrId = null; g.lastRoom = undefined; g.cool = {}
  const linha = roomPlayers.find(p => p.uid === g.uid)
  if (!linha) return
  const gs = JSON.parse(JSON.stringify(sanitize(dbSnap.st))) as EscState
  let st = reducer(structuredClone(INITIAL) as EscState, { type: 'NEW_GAME' } as never)
  st = reducer(st, { type: 'RESTORE_ONLINE', state: gs, roomId: H.st.roomId, roomCode: H.st.roomCode, isHost: false, playerIndex: linha.idx, youUid: g.uid } as never)
  g.st = st
  log(`🔄 ${g.uid} recarregou (snapshot de ${((NOW - dbSnap.t) / 1000).toFixed(1)}s atrás, tela ${gs.screen})`)
  autoCura(g)
  confereIdentidade(g, 'RESTORE')
  // pede o estado (request_state)
  agenda(entre(200, 1500), () => { if (H.vivo) transmite('request_state', g) })
}
function sai(g: Cli) {
  if (!g.vivo) return
  const st = g.st
  const inGame = ['auction', 'monte', 'convocacao', 'cerimonia', 'season', 'liberta', 'end', 'draft'].includes(st.screen)
  const m = eu(g)
  log(`🚪 ${g.uid} saiu (tela ${st.screen})`)
  if (inGame && m) {
    const dp = st.duplas?.[m.id]
    const ficou = dp && dp.partnerUid && (g.uid === dp.ownerUid ? dp.partnerUid : g.uid === dp.partnerUid ? dp.ownerUid : null)
    // recado único pelo rádio (pode se perder, como no código de verdade)
    const a: Act = ficou ? { type: 'DUPLA_SOLO', mgrId: m.id, ficouUid: ficou } : { type: 'KICK_PLAYER', playerIndex: m.id }
    if (!chance(0.08)) agenda(entre(30, 500), () => hostAplica(a, g.uid, 'radio'))
  }
  g.vivo = false
  roomPlayers = roomPlayers.filter(p => p.uid !== g.uid)
}

// ─── assinatura de progresso (trava) ───────────────────────────────────────
function assinatura(st: EscState) {
  const d = st.draft
  return [st.screen, st.phase, st.seasonNo, st.sectorIdx, st.sectorCursor, st.revealIdx, st.monteIdx, st.round, st.submitted.length, st.managers.reduce((a, m) => a + m.squad.length, 0),
    st.hol?.passo, st.pa?.idx, st.pa?.lances.length, st.pa?.m2?.lances.length, st.tiebreakIdx, st.euRodada, d?.fase, d?.idx, d?.picks.length, (d?.prontos ?? []).length,
    Object.keys(st.seasonVotes ?? {}).length, (st.convocacaoFeitos ?? []).length, st.champion?.id,
    st.champions?.fase, st.champions?.rodada, (st.champions as { repescao?: { legs?: unknown[] }[] } | undefined)?.repescao?.[0]?.legs?.length, st.liberta?.fase, st.liberta?.rodada, st.quickCopa?.phase, st.quickCopa?.ties?.[0]?.legs.length].join('|')
}

// ─── uma corrida ───────────────────────────────────────────────────────────
function corre(cen: Cenario, seed: number) {
  CEN = cen; SEED = seed
  R = mulberry(seed * 7919 + cen.nome.length * 131)
  Math.random = mulberry(seed * 104729 + 17)
  NOW = 1_800_000_000_000 + seed * 3_600_000; T0 = NOW
  fila = []; seqN = 0; trilha = []; acabou = false; temporadasJogadas = 0; fimDecidido = -1; jaChecouTemporada = ''; vistosDraftOrdem = ''
  for (const k of Object.keys(ultimo)) delete ultimo[k]
  envioMarcado = false; cacheSrc = null; dbSnap = null; parado = false
  const nH = pega(cen.humanos)!
  // assentos: em duplas, pares (dono, parceiro) + talvez um solo
  const pessoas: { uid: string; nome: string; partnerOf?: string }[] = []
  for (let i = 0; i < nH; i++) pessoas.push({ uid: `u${i}`, nome: `Tec${i}` })
  if (cen.duplas) for (let i = 1; i < nH; i += 2) if (i + 1 <= nH - 1 || i === 1) pessoas[i].partnerOf = pessoas[i - 1].uid
  // lista do banco (player_index = posição dos donos)
  const donosL = pessoas.filter(p => !p.partnerOf)
  roomPlayers = pessoas.map(p => ({ uid: p.uid, nome: p.nome, idx: donosL.findIndex(d => d.uid === (p.partnerOf ?? p.uid)), partnerOf: p.partnerOf }))
  const duplas: Record<number, unknown> = {}
  const playerNames = donosL.map((p, i) => {
    if (!cen.duplas) return p.nome
    const par = pessoas.find(x => x.partnerOf === p.uid)
    duplas[i] = { ownerUid: p.uid, ownerName: p.nome, ...(par ? { partnerUid: par.uid, partnerName: par.nome, cats: { GOL: p.uid, LAT: p.uid, ZAG: p.uid, MEI: par.uid, ATA: par.uid, MONTE: par.uid } } : {}) }
    return par ? `${p.nome}|${par.nome}` : p.nome
  })
  const seatUids = donosL.map(p => p.uid)
  const base = { roomId: `sala-${seed}`, roomCode: `S${seed}`, playerNames, seatUids, formation: '4-3-3', duplasMode: !!cen.duplas, duplas: cen.duplas ? duplas : undefined, ...cen.start }
  const novo = (p: { uid: string; nome: string; partnerOf?: string }): Cli => {
    const ehHost = p.uid === 'u0'
    let st = reducer(structuredClone(INITIAL) as EscState, { type: 'NEW_GAME' } as never)
    st = reducer(st, { type: 'START_ONLINE', ...base, isHost: ehHost, playerIndex: donosL.findIndex(d => d.uid === (p.partnerOf ?? p.uid)), youUid: p.uid } as never)
    return { uid: p.uid, nome: p.partnerOf ? `${pessoas.find(x => x.uid === p.partnerOf)!.nome}|${p.nome}` : (cen.duplas && pessoas.some(x => x.partnerOf === p.uid) ? `${p.nome}|${pessoas.find(x => x.partnerOf === p.uid)!.nome}` : p.nome),
      host: ehHost, st, vivo: true, geracao: 0, myMgrId: null, cool: {}, ultimoEstado: NOW, acaoPendente: 0, afk: chance(0.3) ? 0.25 : 0.03, velho: !ehHost && process.argv.includes('--abas-velhas') ? chance(0.5) : undefined, dupla: p.partnerOf ? { owner: p.partnerOf } : undefined }
  }
  H = novo(pessoas[0])
  G = pessoas.slice(1).map(novo)
  // eventos de rede ruim: um recarrega, um sai (às vezes)
  for (const g of G) {
    if (chance(0.35)) g.recarregaEm = NOW + entre(20_000, 400_000)
    if (chance(0.12) && G.length > 1) g.saiEm = NOW + entre(15_000, 300_000)
  }
  transmite('largada')
  ultimoProgresso = NOW; assinaturaAnt = assinatura(H.st)
  let ticks = 0
  const LIMITE = NOW + 6 * 3_600_000
  let proxTick = NOW
  while (!acabou && NOW < LIMITE) {
    // próximo evento: o menor entre a fila e o tique de 250 ms
    fila.sort((a, b) => a.t - b.t || a.seq - b.seq)
    const prox = fila.length && fila[0].t <= proxTick ? fila.shift()! : null
    if (prox) { NOW = Math.max(NOW, prox.t); try { prox.run() } catch (e) { falha('CRASH', (e as Error).stack?.split('\n').slice(0, 4).join(' | ') ?? String(e)) } }
    else {
      NOW = proxTick; proxTick += 250; ticks++
      // aparelhos
      for (const c of [H, ...G]) {
        if (!c.vivo) continue
        if (c.saiEm && NOW >= c.saiEm) { c.saiEm = undefined; sai(c); continue }
        if (c.recarregaEm && NOW >= c.recarregaEm) { c.recarregaEm = undefined; recarrega(c) }
        try { jogador(c); vigias(c) } catch (e) { falha('CRASH-BOT', `${c.uid}: ${(e as Error).stack?.split('\n').slice(0, 3).join(' | ')}`) }
        // vigia do convidado: pediu e não veio estado em 8 s / 60 s calado → request_state
        if (!c.host && ((c.acaoPendente && NOW - c.acaoPendente > 8000) || NOW - c.ultimoEstado > 60_000) && pode(c, 'req', 8000)) agenda(entre(50, 600), () => { if (H.vivo) transmite('request_state', c) })
      }
      try { motorDoDono() } catch (e) { falha('CRASH', `motor do dono: ${(e as Error).stack?.split('\n').slice(0, 4).join(' | ')}`) }
      // batimento do dono (~25 s parado) e "save no banco" (3 s)
      if (NOW - estadoEnviadoAte > 25_000) transmite('heartbeat')
      if (ticks % 12 === 0) dbSnap = { st: H.st, t: NOW } // o save do dono no banco (3 s); serializa só quando alguém lê
      // trava?
      const sig = assinatura(H.st)
      if (sig !== assinaturaAnt) { assinaturaAnt = sig; ultimoProgresso = NOW }
      else if (NOW - ultimoProgresso > 5 * 60_000) {
        const st = H.st
        const vez = st.screen === 'monte' ? st.managers.find(m => m.id === st.monteOrder[st.monteIdx]) : undefined
        falha('TRAVOU', `5 min sem andar: tela ${st.screen}/${st.phase} setor ${st.sectorIdx} rodada ${st.round} temporada ${st.seasonNo}` +
          (st.screen === 'auction' ? ` lacrados ${JSON.stringify(st.submitted)} prazo ${st.phaseDeadline ? Math.round((st.phaseDeadline - NOW) / 1000) + 's' : 'nenhum'}` : '') +
          (vez ? ` vez de ${vez.teamName} (humano ${vez.isHuman}) prazo ${st.monteDeadline ? Math.round((st.monteDeadline - NOW) / 1000) + 's' : 'nenhum'}` : '') +
          (st.draft ? ` draft ${st.draft.fase} idx ${st.draft.idx} vez ${st.draft.ordem[st.draft.idx]}` : ''))
        parado = true
        break
      }
    }
  }
  if (!acabou && !parado) falha('NAO-ACABOU', `6 h de relógio e não terminou (tela ${H.st.screen}/${H.st.phase}, temporada ${H.st.seasonNo}, rodada ${H.st.round})`)
  // fim: todo convidado vivo, depois de um estado novo, aponta pro próprio time
  for (const g of G) if (g.vivo) { const t = pacote(H.st); convidadoRecebe(g, g.velho ? cacheVelho : t, NOW); confereIdentidade(g, 'fim') }
}

// ─── principal ─────────────────────────────────────────────────────────────
// Sem --cenario: cada cenário roda num PROCESSO PRÓPRIO (4 em paralelo). Assim o estado de módulo do jogo (baralho ativo,
// contadores de id) começa limpo em cada um e a falha se reproduz com `--cenario X --seeds N` (as sementes 1..N na mesma ordem).
if (!arg('cenario')) {
  const { spawn } = await import('node:child_process')
  const { fileURLToPath } = await import('node:url')
  const eu = fileURLToPath(import.meta.url)
  const extra = process.argv.slice(2)
  const tIni = performance.now()
  const saidas: string[] = new Array(CENARIOS.length).fill('')
  let ruim = false, prox = 0
  await new Promise<void>(fim => {
    let rodando = 0
    const lanca = () => {
      while (rodando < 4 && prox < CENARIOS.length) {
        const i = prox++; rodando++
        const ch = spawn(process.execPath, [...process.execArgv, eu, '--cenario', CENARIOS[i].nome, '--teto', arg('teto', '150000')!, ...extra], { stdio: ['ignore', 'pipe', 'pipe'] })
        ch.stdout.on('data', d => { saidas[i] += d })
        ch.stderr.on('data', d => { saidas[i] += d })
        ch.on('close', code => { if (code) ruim = true; rodando--; process.stdout.write(saidas[i].split('\n')[0] + '\n'); if (prox >= CENARIOS.length && rodando === 0) fim(); else lanca() })
      }
    }
    lanca()
  })
  console.log('\n──────── detalhes ────────')
  for (const s of saidas) { const det = s.split('\n').slice(1).filter(l => l.trim() && !l.startsWith('⏱️')).join('\n'); if (det) console.log(det) }
  console.log(`\n⏱️ total ${((performance.now() - tIni) / 1000).toFixed(1)}s · ${ruim ? 'COM FALHAS' : 'nenhuma falha'}`)
  process.exit(ruim ? 1 : 0)
}
const so = arg('cenario')
const soSeed = arg('seed')
const inicio = Date.prototype.getTime.call(new (Date as unknown as { new(): Date })())
const tReal = () => performance.now()
const t00 = tReal()
const resumo: Record<string, { corridas: number; falhas: number; ms: number }> = {}
for (const cen of CENARIOS) {
  if (so && cen.nome !== so) continue
  const t1 = tReal()
  const seeds = soSeed ? [Number(soSeed)] : Array.from({ length: SEEDS }, (_, i) => i + 1)
  let n = 0
  for (const sd of seeds) {
    const antes = falhas.length
    try { corre(cen, sd) } catch (e) { falha('CRASH-SIM', (e as Error).stack?.split('\n').slice(0, 5).join(' | ') ?? String(e)) }
    n++
    if (falhas.length > antes && VERBOSE) console.log(`  semente ${sd}: ${falhas.length - antes} falha(s)`)
    if (tReal() - t1 > Number(arg('teto', '35000'))) break // teto de tempo por cenário
  }
  resumo[cen.nome] = { corridas: n, falhas: falhas.filter(f => f.cenario === cen.nome).length, ms: Math.round(tReal() - t1) }
  console.log(`${resumo[cen.nome].falhas ? '❌' : '✅'} ${cen.nome}: ${n} sementes, ${resumo[cen.nome].falhas} falha(s), ${(resumo[cen.nome].ms / 1000).toFixed(1)}s`)
}
void inicio
// agrupa por tipo
const porTipo = new Map<string, Falha[]>()
for (const f of falhas) { const k = `${f.cenario} · ${f.tipo}`; porTipo.set(k, [...(porTipo.get(k) ?? []), f]) }
for (const [k, fs] of porTipo) {
  console.log(`\n❌ ${k} — ${fs.length} semente(s): ${fs.map(f => f.seed).slice(0, 15).join(', ')}`)
  const f = fs[0]
  console.log(`   ex. semente ${f.seed} em ${(f.t / 1000).toFixed(0)}s: ${f.detalhe}`)
  if (process.argv.includes('--trilha')) for (const l of f.trilha) console.log(`     ${l}`)
}
if (MEDIR) relatorioMedida()
console.log(`\n⏱️ ${((tReal() - t00) / 1000).toFixed(1)}s · ${falhas.length ? `${falhas.length} falha(s)` : 'nenhuma falha'}`)
process.exit(falhas.length ? 1 : 0)
