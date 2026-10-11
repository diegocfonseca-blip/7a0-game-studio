// ─── 🏟️ COPA REGIONAL NA SALA ONLINE (Diego 10/10) ───────────────────────────
//
// Liga + 🏖️🏙️ Rio × SP · 🧉 Sul × Minas-PR · 🌵 Nordeste. Acabou a liga, os primeiros da
// tabela (16 com a copa cheia) escolhem um CLUBE da região, um de cada vez, na ordem
// da tabela — 60s cada, e quem não escolher fica com o PIOR clube que sobrou. Depois
// todo mundo convoca junto em 90s (o mesmo tempo da convocação do Leilão de Clubes).
// Os bots pegam os melhores que sobraram. Os últimos da liga ficam de fora, assistindo.
//
// ⚠️ É o MESMO desenho seguro da Copa do Mundo da sala (`copa-mundo-online.tsx`):
//   · NÃO passa pelo motor do leilão — nada de assento, nada de reducer. É uma tela por
//     cima da sala parada no fim da liga. Tirar daqui = a sala volta a ser liga comum.
//   · a escolha mora em `room_players.copa` (cada um escreve a PRÓPRIA linha) e a fase
//     em `esc_copa_salas` (só o DONO escreve) — as mesmas tabelas da Copa do Mundo. Uma
//     sala é Liga + Mundo OU Liga + regional, nunca as duas, então não se misturam.
//   · o torneio é PURO e semeado (`simulaRegional`): o dono publica só a ficha (clubes +
//     os 11 de cada um) e cada aparelho recalcula a copa inteira, gol por gol.
//   · o relógio sincronizado é `esc_regional_clock` (docs/sql/regional-clock.sql). Se o
//     banco ainda não tiver essa função, cada aparelho conta o próprio relógio — o
//     resultado é o mesmo pra todo mundo, só o ritmo deixa de andar junto.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { tr, getLang, ordinal } from './lang'
import { agoraSala } from './relogio'
import { CompetitionStage, CompetitionMatch } from './online-match-visual'
import './online-match-visual.css'
import { LiveScoreCard, PensShootout, pensRevealDelay, useApitoDeLargada } from './pyramidseason'
import { startCrowd, stopCrowd } from './sound'
import { Escudo } from './escudos'
import { CMModal, ConvocacaoScreen, type Entrant, type Formation } from './copa-mundo'
import { CONVOCACAO_MS } from './store'
import {
  COPAS_REGIONAIS, clubesDaCopa, poolDoClube, completaXIClube, xiPorChavesClube, xiDaMaquinaClube, forcaDoXI,
  piorClubeLivre, melhorClubeLivre, simulaRegional, tabelaDoLado, passosRegional, passoRegionalRodaBola, artilhariaRegional,
  type CopaRegionalId, type MundoRegional, type ConfrontoRegional, type GolRegional,
} from './copa-regional'

const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D', ROXO = '#7C3AED'
const OSWALD = { fontFamily: "'Oswald','Arial Narrow',system-ui,sans-serif" } as const
const box = (bg: string) => ({ border: `3px solid ${INK}`, borderRadius: 14, boxShadow: `4px 4px 0 0 ${INK}`, background: bg }) as const
const semEmoji = (n: string) => n.replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{2B00}-\u{2BFF}]/gu, '').trim() || tr('Técnico', 'Manager')
const nomeCopa = (id: CopaRegionalId) => { const c = COPAS_REGIONAIS[id]; return `${c.emoji} ${getLang() === 'en' ? c.nomeEn : c.nome}` }
const nomeLado = (id: CopaRegionalId, l: 0 | 1) => { const s = COPAS_REGIONAIS[id].lados[l]; return `${s.emoji} ${getLang() === 'en' ? s.nomeEn : s.nome}` }

// ⏱️ OS RELÓGIOS (Diego 10/10): 60s pra escolher o clube, um de cada vez · 15s de
// banner · 90s de convocação, todo mundo junto (a mesma constante do Leilão de Clubes).
export const SEG_ESCOLHA = 60
const SEG_BANNER = 15
export const SEG_CONVOCA = Math.round(CONVOCACAO_MS / 1000)

// a escolha de UMA pessoa (mesma forma da Copa do Mundo: `pais` aqui é o CLUBE)
interface Pick { pais: string; xiKeys: string[]; form: Formation }
const temClube = (p?: Pick | null): p is Pick => !!p && typeof p.pais === 'string' && !!p.pais
const temTime = (p?: Pick | null) => !!p && Array.isArray(p.xiKeys) && p.xiKeys.length === 11
const chaveCarta = (c: { name: string; club: string; year: number }) => `${c.name}|${c.club}|${c.year}`

export interface TimeRegional { pais: string; nome: string; uid?: string; xiKeys?: string[] }
export interface FichaRegional { seed: number; edicao: number; times: TimeRegional[] }
export interface LugarNaLiga { id: number; nome: string; humano: boolean }
type Fase = 'bandeira' | 'banner' | 'convocacao' | 'torneio'
interface LinhaFase { edicao: number; seed: number; fase: Fase; vez_uid: string | null; ate: string | null; times: TimeRegional[] | null; campeao: string | null }
interface LinhaSala { user_id: string; player_index: number; manager_name: string; copa: Pick | null }

const segundosAte = (ate?: string | null) => (ate ? Math.max(0, Math.ceil((new Date(ate).getTime() - agoraSala()) / 1000)) : 0)

/**
 * 🧾 o dono monta a FICHA: os `vagas` primeiros da liga, na ordem da tabela.
 *  · gente que escolheu → o clube dela (reservado desde o começo, pra bot que terminou
 *    acima não "roubar" — o mesmo bug de 02/09 da Copa do Mundo);
 *  · bot → o MELHOR que sobrou;
 *  · gente que deixou os 60s passarem → o PIOR que sobrou (castigo do Diego).
 * Os times saem na ordem dos LADOS (lado A, depois lado B), que é o que o motor come.
 */
export function montaFichaRegional(copa: CopaRegionalId, classificacao: LugarNaLiga[], uidDe: Map<number, string>, picks: Map<string, Pick>, seed: number, edicao: number): FichaRegional {
  const { ladoA, ladoB, todos } = clubesDaCopa(copa)
  const lugares = classificacao.slice(0, todos.length)
  const reservados = new Set<string>()
  for (const l of lugares) { const u = uidDe.get(l.id); const p = u ? picks.get(u) : undefined; if (l.humano && temClube(p) && todos.includes(p.pais)) reservados.add(p.pais) }
  const pegos = new Set<string>()
  const porClube = new Map<string, TimeRegional>()
  for (const l of lugares) {
    const uid = uidDe.get(l.id)
    const p = uid ? picks.get(uid) : undefined
    const clube = temClube(p) && todos.includes(p.pais) && !pegos.has(p.pais) ? p.pais
      : l.humano ? piorClubeLivre(copa, pegos) : melhorClubeLivre(copa, pegos, reservados)
    pegos.add(clube)
    const xiKeys = l.humano ? completaXIClube(clube, p?.form ?? '4-3-3', temClube(p) && p.pais === clube ? p.xiKeys : []).map(chaveCarta) : undefined
    porClube.set(clube, { pais: clube, nome: l.nome, ...(uid ? { uid } : {}), ...(xiKeys ? { xiKeys } : {}) })
  }
  // clube que sobrou sem dono (liga menor que a copa) vira time da máquina
  const times = [...ladoA, ...ladoB].map(c => porClube.get(c) ?? { pais: c, nome: c })
  return { seed, edicao, times }
}
export function entrantesRegionais(f: FichaRegional, meuUid?: string): Entrant[] {
  return f.times.map(t => {
    const xi = t.xiKeys?.length ? xiPorChavesClube(t.pais, t.xiKeys) : xiDaMaquinaClube(t.pais).xi
    return { club: t.nome, you: !!t.uid && t.uid === meuUid, pais: t.pais, xi, str: forcaDoXI(xi), humano: !!t.uid }
  })
}

// ─── ⏱️ o relógio da sala (banco) — mesmo contrato do da Copa do Mundo ─────────
type Row = { revision: number; step: number; running: boolean; manual: boolean; speed: number; started_at: string; updated_at: string; duration_ms: number; extra_ms: number }
type Cmd = 'next' | 'skip' | 'finish' | 'manual' | 'auto' | 'speed'
interface Relogio { row: Row | null; now: number; isHost: boolean; busy: boolean; command: (c: Cmd, speed?: number) => Promise<void> }
const minutoDo = (r: Row, now: number) => (r.running ? Math.max(0, Math.min(93, Math.round((now - Date.parse(r.started_at)) / (r.duration_ms * 0.82) * 93))) : 93)
function useRelogioRegional(roomId: string, edicao: number, seed: number, isHost: boolean, rodadas: number, ko: number, fim: number, extraDoPasso: (s: number) => number): Relogio | undefined {
  const [row, setRow] = useState<Row | null>(null)
  const [semBanco, setSemBanco] = useState(false)
  const [busy, setBusy] = useState(false)
  const [now, setNow] = useState(Date.now())
  const atual = useRef<Row | null>(null), offset = useRef(0), voando = useRef(false), extra = useRef(extraDoPasso)
  extra.current = extraDoPasso
  const rpc = useCallback(async (cmd: 'read' | 'init' | Cmd, speed = 1) => {
    if (voando.current || semBanco) return
    if (cmd !== 'read' && !isHost) return
    voando.current = true
    if (cmd !== 'read') setBusy(true)
    const enviado = Date.now()
    try {
      const { data, error } = await supabase.rpc('esc_regional_clock', { p_room: roomId, p_edicao: edicao, p_seed: seed, p_command: cmd, p_revision: atual.current?.revision ?? -1, p_speed: speed, p_extra: cmd === 'next' ? extra.current((atual.current?.step ?? 0) + 1) : 0, p_rodadas: rodadas, p_ko: ko })
      if (error) {
        // a função ainda não existe no banco → cada aparelho conta sozinho (ver cabeçalho)
        if (error.code === 'PGRST202' || /esc_regional_clock|function/i.test(error.message ?? '')) setSemBanco(true)
        return
      }
      const d = data as { clock: Row | null; server_ms: number }
      offset.current = Number(d.server_ms) - (enviado + Date.now()) / 2
      if (d.clock && (!atual.current || d.clock.revision >= atual.current.revision)) { atual.current = d.clock; setRow(d.clock) }
      setNow(Date.now() + offset.current)
    } catch { /* a próxima batida tenta de novo */ } finally { voando.current = false; setBusy(false) }
  }, [roomId, edicao, seed, isHost, rodadas, ko, semBanco])
  useEffect(() => {
    void rpc(isHost ? 'init' : 'read')
    const iv = setInterval(() => { void rpc(isHost && !atual.current ? 'init' : 'read') }, 2000)
    return () => clearInterval(iv)
  }, [rpc, isHost])
  useEffect(() => {
    const t = setInterval(() => {
      const agora = Date.now() + offset.current
      setNow(agora)
      const r = atual.current
      if (!isHost || !r) return
      if (r.running) { if (agora >= Date.parse(r.started_at) + r.duration_ms + r.extra_ms) void rpc('finish') }
      else if (!r.manual && r.step < fim && agora >= Date.parse(r.updated_at) + (r.step === 0 ? 500 : 1600)) void rpc('next')
    }, 250)
    return () => clearInterval(t)
  }, [isHost, rpc, fim])
  if (semBanco) return undefined
  return { row, now, isHost, busy, command: rpc }
}

// ─── 🛡️ a grade dos clubes, dividida pelos dois lados ─────────────────────────
function GradeDeClubes({ copa, pegos, marcado, podeMarcar, aoMarcar }: { copa: CopaRegionalId; pegos: Map<string, string>; marcado: string | null; podeMarcar: boolean; aoMarcar: (c: string) => void }) {
  const { ladoA, ladoB } = clubesDaCopa(copa)
  const lado = (l: 0 | 1, clubes: string[]) => (
    <div style={{ marginBottom: 10 }}>
      <p style={{ ...OSWALD, fontWeight: 900, fontSize: 13, margin: '0 0 6px', textTransform: 'uppercase' }}>{nomeLado(copa, l)}</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 7 }}>
        {clubes.map(c => {
          const dono = pegos.get(c), eu = marcado === c
          return (
            <button key={c} disabled={!!dono || !podeMarcar} onClick={() => aoMarcar(c)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left', border: `2.5px solid ${INK}`, borderRadius: 11, padding: '7px 8px', cursor: dono || !podeMarcar ? 'default' : 'pointer',
                background: dono ? '#e7e1d0' : eu ? GOLD : '#fff', opacity: dono ? .7 : 1, boxShadow: dono ? 'none' : `2px 2px 0 0 ${INK}`, color: INK }}>
              <Escudo nome={c} size={30} />
              <span style={{ minWidth: 0 }}>
                <span style={{ ...OSWALD, fontWeight: 900, fontSize: 13, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c}</span>
                <span style={{ fontSize: 9.5, fontWeight: 800, color: dono ? '#B23B2E' : GREEN }}>{dono ? `🔒 ${dono}` : eu ? tr('✔️ marcado', '✔️ marked') : tr('livre', 'free')}</span>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
  return <>{lado(0, ladoA)}{lado(1, ladoB)}</>
}

function Barra({ seg, total, cor = GOLD }: { seg: number; total: number; cor?: string }) {
  const pct = Math.max(0, Math.min(100, (seg / total) * 100))
  return (
    <div style={{ marginTop: 8, height: 16, border: `2.5px solid ${INK}`, borderRadius: 999, background: '#fff', overflow: 'hidden', position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0, width: `${pct}%`, background: seg <= 10 ? '#E8503A' : cor, transition: 'width .9s linear' }} />
      <b style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontSize: 10.5, fontWeight: 900, ...OSWALD, color: INK }}>{seg}s</b>
    </div>
  )
}

export function EscolheClube({ copa, pegos, seg, aoConfirmar }: { copa: CopaRegionalId; pegos: Map<string, string>; seg: number; aoConfirmar: (c: string) => void }) {
  const [marcado, setMarcado] = useState<string | null>(null)
  const enviado = useRef(false), marcadoRef = useRef<string | null>(null), topo = useRef<HTMLDivElement>(null)
  marcadoRef.current = marcado
  useEffect(() => { topo.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }, [])
  // ⏰ acabou o tempo no MEU aparelho: mando o marcado; sem marcado, o dono carimba o pior por mim
  useEffect(() => {
    if (seg > 0 || enviado.current) return
    enviado.current = true
    if (marcadoRef.current) aoConfirmar(marcadoRef.current)
  }, [seg]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div ref={topo} style={{ scrollMarginTop: 8 }}>
      <h3 style={{ margin: '0 0 2px' }}>{tr('🏟️ É A SUA VEZ — ESCOLHA O CLUBE', '🏟️ YOUR TURN — PICK THE CLUB')}</h3>
      <Barra seg={seg} total={SEG_ESCOLHA} />
      <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(0,0,0,.6)', margin: '6px 0 10px', lineHeight: 1.4 }}>
        {getLang() === 'en'
          ? <>Tap to mark and confirm. If time runs out you take the one marked — and, with none marked, <b>the worst club left</b>.</>
          : <>Toque pra marcar e confirme. Se o tempo acabar, você leva o que estiver marcado — e, sem nada marcado, <b>o pior clube que sobrou</b>.</>}
      </p>
      <GradeDeClubes copa={copa} pegos={pegos} marcado={marcado} podeMarcar aoMarcar={setMarcado} />
      <div className="ll27-confirmar-barra">
        <button onClick={() => { if (marcado) { enviado.current = true; aoConfirmar(marcado) } }} disabled={!marcado} className={`ll27-confirmar${marcado ? ' pronto' : ''}`}>
          {marcado ? `${tr('✅ PEGAR O', '✅ TAKE')} ${marcado.toUpperCase()}` : tr('toque num clube', 'tap a club')}
        </button>
      </div>
    </div>
  )
}

// ─── 🚪 O PORTÃO: o que a sala vê quando a liga acaba ─────────────────────────
export function CopaRegionalGate({ copa, roomId, souDono, meuUid, classificacao, matchSeed, aoStatus, seasonNo = 1, aoRemover }: {
  copa: CopaRegionalId
  roomId: string
  souDono: boolean
  meuUid?: string
  /** a tabela FINAL da liga, do 1º ao último */
  classificacao: LugarNaLiga[]
  matchSeed?: number
  aoStatus?: (s: { pendente: boolean; campeao: { nome: string; pais: string } | null }) => void
  seasonNo?: number
  aoRemover?: (id: number, nome: string) => void
}) {
  const en = getLang() === 'en'
  const cfg = COPAS_REGIONAIS[copa]
  const vagas = clubesDaCopa(copa).todos.length
  const [linhas, setLinhas] = useState<LinhaSala[]>([])
  const [fase, setFase] = useState<LinhaFase | null>(null)
  const [lido, setLido] = useState(false)
  const [aberta, setAberta] = useState(false)
  const [comecando, setComecando] = useState(false)
  const [erro, setErro] = useState('')
  const [, setTique] = useState(0)
  const [convocaAberta, setConvocaAberta] = useState(true)
  useEffect(() => { const iv = setInterval(() => setTique(t => t + 1), 1000); return () => clearInterval(iv) }, [])
  const edicao = Math.max(1, Math.floor(Number(seasonNo) || 1))

  // 🧯 leitura que falha NÃO apaga o que a tela sabe (lição de 07/09 da Copa do Mundo)
  const ler = useCallback(async () => {
    try {
      const [{ data: pls, error: e1 }, { data: fs, error: e2 }] = await Promise.all([
        supabase.from('room_players').select('user_id, player_index, manager_name, copa').eq('room_id', roomId),
        supabase.from('esc_copa_salas').select('edicao, seed, fase, vez_uid, ate, times, campeao').eq('room_id', roomId).eq('edicao', edicao).limit(1),
      ])
      if (e1 || e2 || !pls || !fs) return null
      setLinhas(pls as LinhaSala[])
      const f = fs[0] as LinhaFase | undefined
      setFase(f ? { ...f, seed: Number(f.seed) } : null)
      setLido(true)
      return { linhas: pls as LinhaSala[], fase: f ? { ...f, seed: Number(f.seed) } : undefined }
    } catch { return null }
  }, [roomId, edicao])
  useEffect(() => { void ler(); const iv = setInterval(() => { void ler() }, 2000); return () => clearInterval(iv) }, [ler])

  const uidDe = useMemo(() => new Map(linhas.map(l => [l.player_index, l.user_id])), [linhas])
  const nomeDe = useMemo(() => new Map(linhas.map(l => [l.user_id, semEmoji(l.manager_name)])), [linhas])
  const picks = useMemo(() => { const m = new Map<string, Pick>(); for (const l of linhas) if (temClube(l.copa)) m.set(l.user_id, l.copa); return m }, [linhas])
  // a FILA: só gente, só quem ficou entre os classificados da liga, na ordem da tabela
  const classificados = useMemo(() => classificacao.slice(0, vagas), [classificacao, vagas])
  const fila = useMemo(() => classificados.filter(c => c.humano && uidDe.has(c.id)).map((c, i) => ({ ...c, uid: uidDe.get(c.id)!, vez: i + 1 })), [classificados, uidDe])
  const pegos = useMemo(() => { const m = new Map<string, string>(); for (const f of fila) { const p = picks.get(f.uid); if (p) m.set(p.pais, f.nome) } return m }, [fila, picks])
  const seg = segundosAte(fase?.ate)
  const minha = meuUid ? picks.get(meuUid) ?? null : null
  const souAVez = fase?.fase === 'bandeira' && fase.vez_uid === meuUid && !minha
  const fiqueiDeFora = !!meuUid && classificacao.some(c => c.humano && uidDe.get(c.id) === meuUid) && !fila.some(f => f.uid === meuUid)

  // ─── 👑 só o DONO empurra a fase (a vez, o prazo, o castigo de quem dormiu) ───
  const passo = useCallback(async () => {
    if (!souDono) return
    const l = await ler()
    if (!l?.fase) return
    const f = l.fase
    const pk = new Map<string, Pick>(); for (const x of l.linhas) if (temClube(x.copa)) pk.set(x.user_id, x.copa)
    const uid = new Map(l.linhas.map(x => [x.player_index, x.user_id]))
    const filaAgora = classificados.filter(c => c.humano).map(c => ({ id: c.id, uid: uid.get(c.id) })).filter((x): x is { id: number; uid: string } => !!x.uid)
    const venceu = f.ate ? agoraSala() >= new Date(f.ate).getTime() : true
    const grava = (o: Record<string, unknown>) => supabase.from('esc_copa_salas').update(o).eq('room_id', roomId).eq('edicao', f.edicao)
    if (f.fase === 'bandeira') {
      const sem = filaAgora.filter(x => !pk.has(x.uid))
      if (!sem.length) { await grava({ fase: 'banner', vez_uid: null, ate: new Date(Date.now() + SEG_BANNER * 1000).toISOString() }); return }
      const daVez = sem[0]
      if (f.vez_uid !== daVez.uid) { await grava({ vez_uid: daVez.uid, ate: new Date(Date.now() + SEG_ESCOLHA * 1000).toISOString() }); return }
      if (venceu) {
        // ⏰ estourou: o PIOR clube livre, e a vez anda
        const pior = piorClubeLivre(copa, new Set([...pk.values()].map(p => p.pais)))
        await supabase.from('room_players').update({ copa: { pais: pior, form: '4-3-3', xiKeys: [] } }).eq('room_id', roomId).eq('user_id', daVez.uid)
        const prox = sem[1]
        await grava(prox ? { vez_uid: prox.uid, ate: new Date(Date.now() + SEG_ESCOLHA * 1000).toISOString() } : { fase: 'banner', vez_uid: null, ate: new Date(Date.now() + SEG_BANNER * 1000).toISOString() })
      }
      return
    }
    if (f.fase === 'banner') { if (venceu) await grava({ fase: 'convocacao', ate: new Date(Date.now() + SEG_CONVOCA * 1000).toISOString() }); return }
    if (f.fase === 'convocacao') {
      if (!venceu && !filaAgora.every(x => temTime(pk.get(x.uid)))) return
      const ficha = montaFichaRegional(copa, classificacao, uid, pk, f.seed, f.edicao)
      await grava({ fase: 'torneio', vez_uid: null, ate: null, times: ficha.times })
    }
  }, [souDono, ler, classificados, classificacao, roomId, copa])
  useEffect(() => { if (!souDono) return; const iv = setInterval(() => { void passo() }, 2000); return () => clearInterval(iv) }, [souDono, passo])

  async function comecar() {
    if (!souDono || comecando) return
    setComecando(true); setErro('')
    try {
      const { data: fs, error } = await supabase.from('esc_copa_salas').select('edicao').eq('room_id', roomId).eq('edicao', edicao).limit(1)
      if (error) { setErro(tr('Não consegui ler a sala agora. Tenta de novo em instantes.', "Couldn't read the room right now. Try again in a moment.")); return }
      if ((fs ?? []).length > 0) { await ler(); return } // 🛡️ uma copa por temporada
      if (edicao > 1) await supabase.from('room_players').update({ copa: null }).eq('room_id', roomId) // temporada nova, clubes novos
      const primeiro = fila[0]?.uid ?? null
      const { error: e2 } = await supabase.from('esc_copa_salas').insert({
        room_id: roomId, edicao, seed: Math.floor(Math.random() * 1e9), times: null,
        fase: primeiro ? 'bandeira' : 'convocacao', vez_uid: primeiro,
        ate: new Date(Date.now() + (primeiro ? SEG_ESCOLHA : SEG_CONVOCA) * 1000).toISOString(),
      })
      if (e2) { setErro(tr('Não consegui começar a copa agora. Tenta de novo em instantes.', "Couldn't start the cup right now. Try again in a moment.")); return }
      await ler()
    } finally { setComecando(false) }
  }
  async function gravaClube(clube: string) {
    if (!meuUid) return
    try { await supabase.from('room_players').update({ copa: { pais: clube, form: '4-3-3', xiKeys: [] } }).eq('room_id', roomId).eq('user_id', meuUid); await ler() } catch { /* a batida tenta de novo */ }
  }
  async function gravaTime(xiKeys: string[], form: Formation, parcial = false) {
    if (!meuUid || !minha) return
    if (!parcial && xiKeys.length !== 11) return
    try { await supabase.from('room_players').update({ copa: { ...minha, form, xiKeys } }).eq('room_id', roomId).eq('user_id', meuUid); await ler() } catch { /* idem */ }
  }

  const ficha: FichaRegional | null = fase?.fase === 'torneio' && fase.times ? { seed: fase.seed, edicao: fase.edicao, times: fase.times } : null
  useEffect(() => { if (ficha && !fase?.campeao) setAberta(true) }, [ficha?.seed]) // eslint-disable-line react-hooks/exhaustive-deps
  const campeao = useMemo(() => { if (!fase?.campeao) return null; const [nome, pais] = fase.campeao.split(' | '); return nome ? { nome, pais: pais ?? '' } : null }, [fase?.campeao])
  useEffect(() => { aoStatus?.({ pendente: !campeao, campeao }) }, [campeao]) // eslint-disable-line react-hooks/exhaustive-deps
  async function gravaCampeao(nome: string, clube: string) {
    if (!souDono || !fase) return
    try {
      await supabase.from('esc_copa_salas').update({ campeao: `${nome} | ${clube}` }).eq('room_id', roomId).eq('edicao', fase.edicao)
      if (matchSeed != null) {
        const { data: existe } = await supabase.from('game_champions').select('id').eq('room_id', roomId).eq('match_seed', matchSeed).maybeSingle()
        if (existe) await supabase.from('game_champions').update({ copa_champion_name: `${nome} (${clube})` }).eq('id', existe.id)
      }
      await ler()
    } catch { /* nunca trava a copa */ }
  }

  const daVezNome = fase?.vez_uid ? nomeDe.get(fase.vez_uid) ?? tr('alguém', 'someone') : ''
  const status = fase?.fase === 'bandeira' ? (souAVez ? tr('É a sua vez de escolher o clube', 'Your turn to pick a club') : `${daVezNome} ${tr('está escolhendo o clube', 'is picking a club')} · ${seg}s`)
    : fase?.fase === 'banner' ? `${tr('A convocação abre em', 'Call-up opens in')} ${seg}s`
    : fase?.fase === 'convocacao' ? (temTime(minha) ? tr('Seu time está convocado · esperando a turma', 'Your team is called up · waiting for the crew') : `${tr('Convoque os seus 11', 'Call up your 11')} · ${seg}s`)
    : fase?.fase === 'torneio' ? tr('Competição em andamento', 'Competition in progress')
    : tr('Aguardando o dono abrir a copa', 'Waiting for the host to open the cup')
  const detalhe = en
    ? `The top ${vagas} of the league pick a club in table order (${SEG_ESCOLHA}s each) and call up their 11. The last ones sit this one out.`
    : `Os ${vagas} primeiros da liga escolhem um clube na ordem da tabela (${SEG_ESCOLHA}s cada) e convocam os 11. Os últimos ficam de fora.`
  const removiveis = fila.filter(f => f.uid !== meuUid)
  const [gerenciar, setGerenciar] = useState(false)

  return (
    <>
      <CompetitionStage kind="copa8" title={tr('A LIGA TERMINOU · PRÓXIMA COMPETIÇÃO', 'THE LEAGUE IS OVER · NEXT COMPETITION')} phase={nomeCopa(copa)} detail={detalhe} status={status}>
        <div className="ll26-cup-entry">
          {fiqueiDeFora && <p className="ll27-portao-aviso">{tr(`😬 Você terminou a liga fora dos ${vagas} primeiros — fica de fora desta copa. Dá pra assistir daqui.`, `😬 You finished outside the top ${vagas} — you sit out this cup. You can watch from here.`)}</p>}
          {!!fila.length && fase?.fase !== 'torneio' && fase?.fase !== 'convocacao' && (
            <div className="ll27-fila">
              <h3>{tr('🥇 QUEM TERMINOU NA FRENTE ESCOLHE PRIMEIRO', '🥇 WHOEVER FINISHED HIGHER PICKS FIRST')}</h3>
              {fila.map(f => {
                const p = picks.get(f.uid), eu = f.uid === meuUid
                const daVez = fase?.fase === 'bandeira' && !p && fila.find(x => !picks.get(x.uid))?.uid === f.uid
                return (
                  <div key={f.uid} className={`ll27-fila-linha${daVez ? ' vez' : ''}${eu ? ' eu' : ''}`}>
                    <span className="ll27-fila-n">{ordinal(f.vez)}</span>
                    <span className="ll27-fila-nome">{f.nome}{eu ? tr(' (você)', ' (you)') : ''}</span>
                    {p ? <span className="ll27-fila-pais"><Escudo nome={p.pais} size={22} /> {p.pais}{temTime(p) ? ' ✔️' : ''}</span>
                      : <span className="ll27-fila-espera">{daVez ? `⏳ ${seg}s` : tr('na fila', 'in line')}</span>}
                  </div>
                )
              })}
            </div>
          )}
          {!fase && lido && (souDono
            ? <>
                <button className="ll27-portao-botao" disabled={comecando} onClick={() => { void comecar() }}>{comecando ? tr('⏳ Começando…', '⏳ Starting…') : `${tr('COMEÇAR A', 'START THE')} ${nomeCopa(copa).toUpperCase()}`}</button>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(0,0,0,.6)', margin: '8px 2px 0', lineHeight: 1.45 }}>
                  {en ? <>From then on the clock runs: <b>{SEG_ESCOLHA}s</b> for each one to pick a club, in table order, then <b>{SEG_CONVOCA}s</b> for everyone to call up their 11 together.</>
                    : <>A partir daí o relógio corre: <b>{SEG_ESCOLHA}s</b> pra cada um escolher o clube, na ordem da tabela, e depois <b>{SEG_CONVOCA}s</b> pra todo mundo convocar os 11 junto.</>}
                </p>
              </>
            : <p className="ll27-portao-aviso">{tr('⏳ O dono da sala abre a copa — segura aí.', '⏳ The room owner opens the cup — hang on.')}</p>)}
          <details className="ll26-format" style={{ marginTop: fase ? 0 : 6 }}>
            <summary>{tr('REGULAMENTO', 'FORMAT')}</summary>
            <p>{en
              ? `${vagas} clubs in two sides of ${vagas / 2} (${cfg.lados[0].nomeEn} × ${cfg.lados[1].nomeEn}). Each club plays the ${vagas / 2} clubs of the OTHER side once, with a separate table per side. Then a crossed knockout (1st of one side × last qualifier of the other), one-off games, draws go to penalties. Tiebreak: points → wins → goal difference → goals.`
              : `${vagas} clubes em dois lados de ${vagas / 2} (${cfg.lados[0].nome} × ${cfg.lados[1].nome}). Cada clube joga uma vez contra os ${vagas / 2} do OUTRO lado, com tabela separada por lado. Depois mata-mata cruzado (1º de um lado × último classificado do outro), jogo único, empate vai pros pênaltis. Desempate: pontos → vitórias → saldo → gols.`}</p>
          </details>
          {fase?.fase === 'bandeira' && (souAVez
            ? <EscolheClube copa={copa} pegos={pegos} seg={seg} aoConfirmar={c => { void gravaClube(c) }} />
            : <>
                <p className="ll27-portao-aviso">{minha
                  ? (en ? <><Escudo nome={minha.pais} size={22} /> You are <b>{minha.pais}</b>. Now wait for the line — <b>{daVezNome}</b> is picking ({seg}s).</> : <><Escudo nome={minha.pais} size={22} /> Você é o <b>{minha.pais}</b>. Agora é esperar a fila — <b>{daVezNome}</b> está escolhendo ({seg}s).</>)
                  : (en ? <>⏳ <b>{daVezNome}</b> is picking a club ({seg}s). Your turn comes in table order.</> : <>⏳ <b>{daVezNome}</b> está escolhendo o clube ({seg}s). A sua vez vem na ordem da tabela.</>)}</p>
                <GradeDeClubes copa={copa} pegos={pegos} marcado={minha?.pais ?? null} podeMarcar={false} aoMarcar={() => {}} />
              </>)}
          {fase?.fase === 'banner' && (
            <div style={{ ...box(`linear-gradient(150deg,#FFE79A,${GOLD} 55%,#E8A200)`), padding: '14px 13px', textAlign: 'center' }}>
              <p style={{ fontSize: 40, margin: 0 }}>{cfg.emoji}</p>
              <p style={{ ...OSWALD, fontWeight: 900, fontSize: 19, margin: '2px 0 0', textTransform: 'uppercase' }}>{tr('Todos os clubes escolhidos!', 'All clubs picked!')}</p>
              <p style={{ fontSize: 11.5, fontWeight: 800, color: 'rgba(0,0,0,.7)', margin: '5px 0 0', lineHeight: 1.4 }}>
                {en ? <>Now you have <b>{SEG_CONVOCA} seconds</b> to call up <b>11 players</b> from your club.<br />⚠️ Whoever doesn't call up enters with the <b>worst 11</b>.</>
                  : <>Agora você tem <b>{SEG_CONVOCA} segundos</b> pra convocar <b>11 jogadores</b> do seu clube.<br />⚠️ Quem não convocar entra com os <b>11 piores</b>.</>}
              </p>
              <Barra seg={seg} total={SEG_BANNER} cor="#fff" />
            </div>
          )}
          {fase?.fase === 'convocacao' && (
            <div className="ll27-convoca">
              <h3>{temTime(minha) ? tr('✅ TIME CONVOCADO', '✅ TEAM CALLED UP') : tr('⚽ CONVOQUE OS 11', '⚽ CALL UP THE 11')}</h3>
              <Barra seg={seg} total={SEG_CONVOCA} />
              {minha && !temTime(minha) && <div style={{ marginTop: 10 }}><button className="ll27-portao-botao verde" onClick={() => setConvocaAberta(true)}>{tr('⚽ VOLTAR PRA CONVOCAÇÃO', '⚽ BACK TO THE CALL-UP')}</button></div>}
              {temTime(minha) && <p className="ll27-portao-aviso" style={{ marginTop: 8 }}><Escudo nome={minha!.pais} size={22} /> <b>{minha!.pais}</b> {tr('com 11 no papel. A copa começa quando o tempo acabar (ou quando todo mundo terminar).', 'with 11 on paper. The cup starts when time runs out (or when everyone finishes).')}</p>}
            </div>
          )}
          {!!erro && <p style={{ fontSize: 11, fontWeight: 800, color: '#B23B2E', margin: '8px 2px 0', lineHeight: 1.4 }}>{erro}</p>}
          {ficha && !aberta && <div style={{ marginTop: 8 }}><button className="ll27-portao-botao" onClick={() => setAberta(true)}>{`${tr('VOLTAR PRA', 'BACK TO THE')} ${nomeCopa(copa).toUpperCase()}`}</button></div>}
          {souDono && aoRemover && removiveis.length > 0 && fase?.fase !== 'torneio' && (
            <div style={{ marginTop: 10 }}>
              <button onClick={() => setGerenciar(g => !g)} style={{ border: 'none', background: 'transparent', ...OSWALD, fontWeight: 900, fontSize: 12, textDecoration: 'underline', cursor: 'pointer', color: INK }}>{tr('⚙️ Gerenciar técnicos', '⚙️ Manage managers')}</button>
              {gerenciar && removiveis.map(f => (
                <div key={f.uid} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', fontSize: 12, fontWeight: 800 }}>
                  <span style={{ flex: 1 }}>{f.nome}</span>
                  <button onClick={() => aoRemover(f.id, f.nome)} style={{ border: '1px solid rgba(0,0,0,.2)', borderRadius: 8, padding: '4px 8px', fontSize: 11, fontWeight: 900, background: '#F4ECD6', color: '#B23A2A', cursor: 'pointer' }}>{tr('remover', 'remove')}</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CompetitionStage>

      {/* a convocação (a MESMA tela da Copa do Mundo, com o elenco do clube) abre sozinha */}
      {fase?.fase === 'convocacao' && convocaAberta && minha && !temTime(minha) && (
        <CMModal>
          <ConvocacaoScreen pais={minha.pais} poolPronto={poolDoClube(minha.pais)} emblema={<Escudo nome={minha.pais} size={30} />} rotuloTime={tr('seu clube', 'your club')} prazoSeg={seg}
            onBack={() => setConvocaAberta(false)}
            aoEstourar={(parcial, f) => { setConvocaAberta(false); void gravaTime(parcial.map(chaveCarta), f, true) }}
            onDone={(xi, f) => { setConvocaAberta(false); void gravaTime(xi.map(chaveCarta), f) }} />
        </CMModal>
      )}
      {ficha && aberta && (
        <CMModal wide cinematic onlineBroadcast>
          <CopaRegionalTorneio copa={copa} ficha={ficha} roomId={roomId} meuUid={meuUid} souDono={souDono}
            aoCampeao={(nome, clube) => { void gravaCampeao(nome, clube) }} aoFechar={() => setAberta(false)} />
        </CMModal>
      )}
    </>
  )
}

// ─── ⚽ O TORNEIO ─────────────────────────────────────────────────────────────
export function CopaRegionalTorneio({ copa, ficha, roomId, meuUid, souDono, aoCampeao, aoFechar, semRelogio = false }: {
  copa: CopaRegionalId; ficha: FichaRegional; roomId: string; meuUid?: string; souDono: boolean
  aoCampeao: (nome: string, clube: string) => void; aoFechar: () => void
  /** 🧪 bancada: força o relógio de cada aparelho (sem banco) */
  semRelogio?: boolean
}) {
  const entrants = useMemo(() => entrantesRegionais(ficha, meuUid), [ficha, meuUid])
  const mundo: MundoRegional = useMemo(() => simulaRegional(entrants, ficha.seed), [entrants, ficha.seed])
  const P = passosRegional(mundo.n)
  const penMs = (t: ConfrontoRegional) => (t.pen ? pensRevealDelay(t.pen, !!(entrants[t.h].humano || entrants[t.a].humano)) * 1000 : 0)
  const extraDoPasso = (s: number) => { const i = s - P.PRIMEIRO_KO; const f = mundo.ko[i]; return f ? Math.round(Math.max(0, ...f.ties.map(penMs))) : 0 }
  const relogioBanco = useRelogioRegional(roomId, ficha.edicao, ficha.seed, souDono, P.RODADAS, P.KO, P.FIM, extraDoPasso)
  const relogio = semRelogio ? undefined : relogioBanco

  // 🛟 sem relógio no banco: cada aparelho anda sozinho, no automático
  const [passoLocal, setPassoLocal] = useState(0)
  const [acabouLocal, setAcabouLocal] = useState(true)
  const [inicioLocal, setInicioLocal] = useState(Date.now())
  const [, setTique] = useState(0)
  useEffect(() => { if (relogio) return; const iv = setInterval(() => setTique(t => t + 1), 200); return () => clearInterval(iv) }, [!!relogio]) // eslint-disable-line react-hooks/exhaustive-deps
  const ROUND_MS = 15000
  const step = relogio ? relogio.row?.step ?? 0 : passoLocal
  const liveDone = relogio ? !!relogio.row && !relogio.row.running : acabouLocal
  const roundMs = relogio?.row?.duration_ms ?? ROUND_MS
  const liveMin = relogio ? (relogio.row ? minutoDo(relogio.row, relogio.now) : 0) : (acabouLocal ? 93 : Math.max(0, Math.min(93, Math.round((Date.now() - inicioLocal) / (ROUND_MS * 0.82) * 93))))
  useEffect(() => {
    if (relogio || acabouLocal) return
    const t = setTimeout(() => setAcabouLocal(true), ROUND_MS + 700 + extraDoPasso(passoLocal))
    return () => clearTimeout(t)
  }, [passoLocal, acabouLocal, !!relogio]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (relogio || !acabouLocal || passoLocal >= P.FIM) return
    const t = setTimeout(() => { const s = passoLocal + 1; setPassoLocal(s); if (passoRegionalRodaBola(P, s)) { setAcabouLocal(false); setInicioLocal(Date.now()) } }, passoLocal === 0 ? 500 : 1600)
    return () => clearTimeout(t)
  }, [acabouLocal, passoLocal, !!relogio]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { startCrowd(); return () => stopCrowd() }, [])
  useApitoDeLargada(`regional-${copa}`, passoRegionalRodaBola(P, step) ? step : null, true)

  const done = step >= P.FIM
  const finalVista = step >= P.FINAL && liveDone
  const avisou = useRef(false)
  useEffect(() => {
    if (!finalVista || avisou.current) return
    avisou.current = true
    const c = mundo.campeao
    aoCampeao(entrants[c].club, entrants[c].pais)
  }, [finalVista]) // eslint-disable-line react-hooks/exhaustive-deps

  const myIdx = entrants.findIndex(e => e.you)
  const isYou = (i: number) => i === myIdx
  const dono = (i: number) => (entrants[i].humano ? entrants[i].club : undefined)
  const rodadaAtual = Math.min(P.RODADAS, step)
  const rodadasVistas = step <= P.RODADAS && !liveDone ? Math.max(0, rodadaAtual - 1) : rodadaAtual
  const vagasLado = mundo.ko[0]?.tipo === 'quartas' ? 4 : mundo.ko[0]?.tipo === 'semi' ? 2 : 1
  const golsAte = (ev: GolRegional[]) => (liveDone ? ev : ev.filter(g => g.min <= liveMin))

  const live = (h: number, a: number, ev: GolRegional[]) => (
    <div style={{ marginBottom: 8 }}>
      <LiveScoreCard enhancedOnline displayMinute={relogio ? liveMin : undefined} homeName={entrants[h].pais} awayName={entrants[a].pais} homeColor={GREEN} awayColor="#C2452F"
        homeOwner={dono(h)} awayOwner={dono(a)} homeEmblem={<Escudo nome={entrants[h].pais} size={58} />} awayEmblem={<Escudo nome={entrants[a].pais} size={58} />}
        youIsHome={isYou(h)} goals={ev} roundKey={step} roundMs={roundMs} finished={liveDone} footTint={{ bg: '#FFF3C2', border: '#f0d98a', holo: 0.5 }} />
    </div>
  )
  const jogoLinha = (h: number, a: number, ev: GolRegional[], key: string, status: string, pen?: [number, number]) => {
    const g = golsAte(ev)
    return <CompetitionMatch key={key} showOwners goals={g} home={entrants[h].pais} away={entrants[a].pais} homeOwner={dono(h)} awayOwner={dono(a)}
      homeCrest={<Escudo nome={entrants[h].pais} size={26} />} awayCrest={<Escudo nome={entrants[a].pais} size={26} />}
      homeScore={g.filter(x => x.home).length} awayScore={g.filter(x => !x.home).length} mine={isYou(h) || isYou(a)} status={status}
      detail={pen && liveDone ? <PensShootout compactOnline pens={pen} aName={entrants[h].pais} bName={entrants[a].pais} aCrest={<Escudo nome={entrants[h].pais} size={20} />} bCrest={<Escudo nome={entrants[a].pais} size={20} />} aSquad={entrants[h].xi} bSquad={entrants[a].xi} /> : undefined} />
  }
  const tabela = (lado: 0 | 1) => {
    const linhas = tabelaDoLado(mundo, lado, rodadasVistas)
    const COLS = '18px 26px minmax(0,1fr) 30px 26px 32px'
    return (
      <div style={{ ...box('#fff'), color: INK, padding: 10, marginBottom: 10 }}>
        <p style={{ ...OSWALD, fontWeight: 900, fontSize: 14, margin: '0 0 6px', textTransform: 'uppercase' }}>{nomeLado(copa, lado)}</p>
        <div style={{ display: 'grid', gridTemplateColumns: COLS, gap: 6, padding: '0 6px 3px', ...OSWALD, fontSize: 9.5, color: 'rgba(0,0,0,.5)' }}>
          <span>#</span><span /><span>{tr('CLUBE', 'CLUB')}</span><span style={{ textAlign: 'right' }}>PTS</span><span style={{ textAlign: 'right' }}>{tr('V', 'W')}</span><span style={{ textAlign: 'right' }}>{tr('SG', 'GD')}</span>
        </div>
        {linhas.map((r, i) => (
          <div key={r.t}>
            <div style={{ display: 'grid', gridTemplateColumns: COLS, gap: 6, alignItems: 'center', padding: '4px 6px', fontSize: 11.5, fontWeight: isYou(r.t) ? 900 : 700,
              background: i < vagasLado ? '#D8F0DE' : 'transparent', borderLeft: `4px solid ${i < vagasLado ? GREEN : 'transparent'}`, outline: isYou(r.t) ? `2.5px solid ${ROXO}` : undefined, outlineOffset: -2.5 }}>
              <span>{i + 1}</span><Escudo nome={entrants[r.t].pais} size={22} />
              <span style={{ minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{entrants[r.t].pais}{entrants[r.t].humano ? <small style={{ fontWeight: 700, color: 'rgba(0,0,0,.5)' }}> · {entrants[r.t].club}</small> : null}</span>
              <span style={{ textAlign: 'right', fontWeight: 900 }}>{r.pts}</span><span style={{ textAlign: 'right' }}>{r.w}</span><span style={{ textAlign: 'right' }}>{r.sg > 0 ? '+' : ''}{r.sg}</span>
            </div>
            {i === vagasLado - 1 && <div style={{ background: GREEN, color: '#fff', ...OSWALD, fontSize: 9.5, textAlign: 'center', padding: '2px 0' }}>{vagasLado === 4 ? tr('▲ 4 PRIMEIROS VÃO PRAS QUARTAS', '▲ TOP 4 GO TO THE QUARTER-FINALS') : vagasLado === 2 ? tr('▲ 2 PRIMEIROS VÃO PRA SEMI', '▲ TOP 2 GO TO THE SEMI-FINALS') : tr('▲ O 1º VAI PRA FINAL', '▲ THE 1ST GOES TO THE FINAL')}</div>}
          </div>
        ))}
      </div>
    )
  }
  const nomeFase = (t: 'quartas' | 'semi' | 'final') => (t === 'quartas' ? tr('QUARTAS DE FINAL', 'QUARTER-FINALS') : t === 'semi' ? tr('SEMIFINAL', 'SEMI-FINALS') : tr('🏆 FINAL', '🏆 FINAL'))
  const faseAtual = step >= P.PRIMEIRO_KO && step <= P.FINAL ? mundo.ko[step - P.PRIMEIRO_KO] : null
  const proximoRotulo = !liveDone ? tr('⏳ Deixa o jogo acabar…', '⏳ Let the game finish…')
    : step < P.RODADAS ? `${tr('▶️ Rodada', '▶️ Round')} ${step + 1} ${tr('de', 'of')} ${P.RODADAS}`
    : step === P.RODADAS ? tr('⚔️ Ver o mata-mata', '⚔️ See the knockouts')
    : step < P.FINAL ? `▶️ ${nomeFase(mundo.ko[step + 1 - P.PRIMEIRO_KO]?.tipo ?? 'final')}`
    : tr('🎉 Cerimônia', '🎉 Ceremony')
  const controles = relogio?.row && (
    <section className="ll31-tournament-controls" style={{ ...box('#fff'), color: INK, padding: 10, marginBottom: 10 }}>
      <p style={{ ...OSWALD, fontWeight: 900, fontSize: 12, margin: '0 0 6px' }}>{tr('🎮 CONTROLE DA PARTIDA', '🎮 MATCH CONTROL')}</p>
      {relogio.isHost ? <>
        <div className="ll27-world-rhythm">
          <button className={relogio.row.manual ? 'selected' : ''} disabled={relogio.busy} onClick={() => void relogio.command('manual')}>MANUAL</button>
          <button className={!relogio.row.manual ? 'selected' : ''} disabled={relogio.busy} onClick={() => void relogio.command('auto')}>AUTO</button>
          <select aria-label={tr('Velocidade', 'Speed')} value={relogio.row.speed} disabled={relogio.busy || relogio.row.running} onChange={e => void relogio.command('speed', Number(e.target.value))}>
            <option value={0.25}>¼×</option><option value={0.5}>½×</option><option value={1}>Normal</option><option value={2}>2×</option><option value={4}>4×</option>
          </select>
        </div>
        <div className="ll27-world-rhythm">
          <button className="primary" disabled={relogio.busy || !liveDone || done} onClick={() => void relogio.command('next')}>{proximoRotulo}</button>
          <button disabled={relogio.busy} onClick={() => void relogio.command(relogio.row?.running ? 'skip' : 'next')}>{tr('PULAR', 'SKIP')}</button>
        </div>
      </> : <p style={{ fontSize: 11, fontWeight: 700, margin: 0 }}>{tr('Ritmo da sala', 'Room pace')}: {relogio.row.manual ? 'manual' : tr('automático', 'auto')} · {relogio.row.speed}× · {tr('controlado pelo host', 'controlled by the host')}</p>}
    </section>
  )
  const etapa = done ? tr('Campeão definido', 'Champion decided') : step === 0 ? tr('Começando', 'Starting') : step <= P.RODADAS ? `${tr('Rodada', 'Round')} ${step} ${tr('de', 'of')} ${P.RODADAS}` : step === P.CHAVE ? tr('Mata-mata definido', 'Knockouts set') : nomeFase(faseAtual?.tipo ?? 'final')

  return (
    <>
      <CompetitionStage kind="copa8" title={nomeCopa(copa).toUpperCase()} phase={etapa} detail={tr('Cada clube enfrenta os do outro lado. Tabela separada por lado.', 'Each club faces the other side. One table per side.')} />
      {/* RODADAS: o meu jogo ao vivo em cima; os clássicos da rodada; as duas tabelas (só o que já apitou) */}
      {step >= 1 && step <= P.RODADAS && (() => {
        const rod = mundo.rodadas[rodadaAtual - 1]
        const meu = rod.find(j => isYou(j.h) || isYou(j.a))
        return <>
          {meu && live(meu.h, meu.a, meu.ev)}
          {controles}
          <p style={{ ...OSWALD, fontWeight: 900, fontSize: 13, color: GOLD, margin: '4px 0 6px' }}>{tr('⚽ CLÁSSICOS DA RODADA', '⚽ DERBIES OF THE ROUND')} {rodadaAtual}</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 6, marginBottom: 10 }}>
            {rod.filter(j => j !== meu).map((j, k) => jogoLinha(j.h, j.a, j.ev, `r${k}`, liveDone ? tr('ENCERRADO', 'FULL TIME') : `${Math.min(90, liveMin)}′ · ${tr('AO VIVO', 'LIVE')}`))}
          </div>
        </>
      })()}
      {step === 0 && controles}
      {step <= P.CHAVE && <>{tabela(0)}{tabela(1)}</>}
      {/* CHAVE: quem pega quem no mata-mata (cruzado) */}
      {step === P.CHAVE && <>
        {controles}
        <div style={{ ...box('#fff'), color: INK, padding: 10, marginBottom: 10 }}>
          <p style={{ ...OSWALD, fontWeight: 900, fontSize: 13, margin: '0 0 6px' }}>{`⚔️ ${nomeFase(mundo.ko[0].tipo)} · ${tr('CRUZADO, JOGO ÚNICO', 'CROSSED, ONE-OFF')}`}</p>
          {mundo.ko[0].ties.map((t, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, borderTop: '2px solid rgba(0,0,0,.08)', padding: '6px 2px', fontSize: 12, fontWeight: isYou(t.h) || isYou(t.a) ? 900 : 700 }}>
              <Escudo nome={entrants[t.h].pais} size={22} /> {entrants[t.h].pais} <span style={{ color: 'rgba(0,0,0,.4)' }}>×</span> {entrants[t.a].pais} <Escudo nome={entrants[t.a].pais} size={22} />
              {(isYou(t.h) || isYou(t.a)) && <b style={{ color: ROXO }}>{tr(' 👈 VOCÊ', ' 👈 YOU')}</b>}
            </div>
          ))}
        </div>
      </>}
      {/* MATA-MATA */}
      {faseAtual && (() => {
        const meu = faseAtual.ties.find(t => isYou(t.h) || isYou(t.a))
        const final = faseAtual.tipo === 'final' ? faseAtual.ties[0] : null
        const grande = meu ?? final
        return <>
          {grande && live(grande.h, grande.a, grande.ev)}
          {grande && liveDone && grande.pen && (
            <div style={{ ...box('#fff'), padding: 8, marginBottom: 8, color: INK }}>
              <p style={{ ...OSWALD, fontWeight: 900, fontSize: 11, margin: '0 0 4px', textAlign: 'center' }}>🥅 {grande.g[0]}×{grande.g[1]} {tr('NO TEMPO NORMAL — DECISÃO NOS PÊNALTIS', 'AFTER 90 MINUTES — DECIDED ON PENALTIES')}</p>
              <PensShootout compactOnline final={faseAtual.tipo === 'final'} pens={grande.pen} aName={entrants[grande.h].pais} bName={entrants[grande.a].pais} aCrest={<Escudo nome={entrants[grande.h].pais} size={20} />} bCrest={<Escudo nome={entrants[grande.a].pais} size={20} />} aSquad={entrants[grande.h].xi} bSquad={entrants[grande.a].xi} lento={!!(entrants[grande.h].humano || entrants[grande.a].humano)} />
            </div>
          )}
          {controles}
          <p style={{ ...OSWALD, fontWeight: 900, fontSize: 13, color: GOLD, margin: '4px 0 6px' }}>{nomeFase(faseAtual.tipo)} · {tr('JOGO ÚNICO', 'ONE-OFF')}</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 6, marginBottom: 10 }}>
            {faseAtual.ties.filter(t => t !== grande).map((t, i) => jogoLinha(t.h, t.a, t.ev, `k${i}`, liveDone ? tr('ENCERRADO · JOGO ÚNICO', 'FULL TIME · ONE-OFF') : `${Math.min(90, liveMin)}′ · ${tr('AO VIVO', 'LIVE')}`, t.pen))}
          </div>
        </>
      })()}
      {/* fases que já passaram, recolhidas */}
      {mundo.ko.map((f, i) => step > P.PRIMEIRO_KO + i && (
        <details key={f.tipo} className="ll26-bracket-history"><summary>{nomeFase(f.tipo)} · {tr('RESULTADOS', 'RESULTS')}</summary>
          {f.ties.map((t, k) => <CompetitionMatch key={k} showOwners goals={t.ev} home={entrants[t.h].pais} away={entrants[t.a].pais} homeOwner={dono(t.h)} awayOwner={dono(t.a)} homeCrest={<Escudo nome={entrants[t.h].pais} size={26} />} awayCrest={<Escudo nome={entrants[t.a].pais} size={26} />} homeScore={t.g[0]} awayScore={t.g[1]} mine={isYou(t.h) || isYou(t.a)} status={t.pen ? `${tr('pênaltis', 'penalties')} ${t.pen[0]}×${t.pen[1]}` : tr('ENCERRADO', 'FULL TIME')} />)}
        </details>
      ))}
      {step > P.CHAVE && <details className="ll26-bracket-history"><summary>{tr('FASE DE CLASSIFICAÇÃO · AS DUAS TABELAS', 'QUALIFYING STAGE · BOTH TABLES')}</summary>{tabela(0)}{tabela(1)}</details>}
      {/* CERIMÔNIA */}
      {done && (() => {
        const c = mundo.campeao, fin = mundo.ko[mundo.ko.length - 1].ties[0]
        const art = artilhariaRegional(mundo).slice(0, 5)
        return <>
          <div style={{ ...box(isYou(c) ? `linear-gradient(150deg,#FFE79A,${GOLD} 55%,#E8A200)` : '#fff'), color: INK, padding: 14, marginBottom: 10, textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center' }}><Escudo nome={entrants[c].pais} size={70} /></div>
            <p style={{ ...OSWALD, fontWeight: 900, fontSize: 19, margin: '6px 0 0', textTransform: 'uppercase' }}>{entrants[c].pais} {tr('CAMPEÃO!', 'CHAMPION!')}</p>
            <p style={{ fontSize: 11, fontWeight: 800, margin: '3px 0 0' }}>{isYou(c) ? tr('🎉 É VOCÊ! A taça é sua.', '🎉 IT’S YOU! The trophy is yours.') : entrants[c].humano ? `${tr('Técnico', 'Manager')}: ${entrants[c].club}` : tr('Título da máquina 🤖', 'Won by the machine 🤖')}</p>
            <p style={{ fontSize: 9.5, fontWeight: 700, color: 'rgba(0,0,0,.55)', margin: '6px 0 0' }}>{tr('final', 'final')}: {entrants[fin.h].pais} {fin.g[0]}×{fin.g[1]} {entrants[fin.a].pais}{fin.pen ? ` (${tr('pên.', 'pens')} ${fin.pen[0]}×${fin.pen[1]})` : ''}</p>
          </div>
          {art.length > 0 && <div style={{ ...box('#fff'), color: INK, padding: 10, marginBottom: 10 }}>
            <p style={{ ...OSWALD, fontWeight: 900, fontSize: 12, margin: '0 0 4px' }}>{tr('⚽ ARTILHARIA DA COPA', '⚽ CUP TOP SCORERS')}</p>
            {art.map((r, i) => <div key={r.name + r.team} style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 11, fontWeight: isYou(r.team) ? 900 : 700, padding: '2px 0' }}>
              <span style={{ width: 18 }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : ordinal(i + 1)}</span><Escudo nome={entrants[r.team].pais} size={18} />
              <span style={{ flex: 1 }}>{r.name}</span><b>{r.goals}</b>
            </div>)}
          </div>}
        </>
      })()}
      <button className="ll31-back-room" onClick={aoFechar} style={{ width: '100%', border: `3px solid ${INK}`, borderRadius: 14, padding: 12, ...OSWALD, fontWeight: 900, fontSize: 14, background: done ? GREEN : '#fff', color: done ? '#fff' : INK, boxShadow: `4px 4px 0 0 ${INK}`, cursor: 'pointer' }}>{tr('VOLTAR À SALA', 'BACK TO THE ROOM')}</button>
    </>
  )
}
