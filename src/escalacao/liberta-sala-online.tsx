import {withCupPlans} from './copa-planos'
import {FootballLibertaCupView} from './football-cup-liberta'
import type {CupPenaltyPresentation} from './football-cup-world'
import { useOwnerLayout,useOwnerFootballPilot,useOwnerFootballAvailable, OwnerPlayback, OwnerChampionBanner } from './owner-online-visual'
import { MASCOTES, mascoteKeyDoTime } from './mascotes'
// ─── 🏆 LIGA + LIBERTADORES NA SALA ONLINE (Diego 19/11) ──────────────────────
//
// Acabou a liga: TODOS os times escolhem um CLUBE sul-americano de verdade, um de cada vez,
// na ORDEM DA TABELA (o 1º escolhe primeiro; gente escolhe, bot leva o melhor que sobrou), e
// convocam 11 das cartas DESSE clube. A máquina completa as 32 vagas com os mais fortes que
// ninguém pegou. Formato real: 8 grupos em turno e returno, ida e volta até a semi, final única.
// Mockup aprovado: `scripts/mockups/liberta-clubes-390.png` / `-1280.png`.
//
// ⚠️ É o MESMO desenho seguro da copa regional (`copa-regional-online.tsx`), de onde este
// arquivo foi adaptado:
//   · NÃO passa pelo motor do leilão — nada de assento, nada de reducer. É uma tela por cima
//     da sala parada no fim da liga. Tirar daqui = a sala volta a ser liga comum.
//   · a escolha mora em `room_players.copa` (cada um escreve a PRÓPRIA linha) e a fase em
//     `esc_copa_salas` (só o DONO escreve) — as mesmas tabelas da Copa do Mundo/regional. A
//     sala é Liga + UMA copa só, então não se misturam.
//   · o torneio é PURO e semeado (`simulaLibertaSala`): o dono publica só a ficha (32 clubes +
//     os 11 de cada um) e cada aparelho recalcula a copa inteira, gol por gol.
//   · o relógio sincronizado é o `esc_regional_clock` que JÁ existe no banco (nada de SQL novo):
//     p_rodadas = 12 (6 rodadas de grupo + ida/volta de oitavas, quartas e semi) e p_ko = 1 (a
//     final). Os passos estão em `LIB` (liberta-sala.ts). Sem a função no banco, cada aparelho
//     conta o próprio relógio — o resultado é o mesmo, só o ritmo deixa de andar junto.
//   · sem tática por enquanto (o cartão de tática das copas é preso no formato da regional).
import { TunelFinal, FestaCampeao, Trofeu, TemaCompCtx, FraseCopa } from './competicoes-visual'
import { useCampo2DLigado, doisDDoPasso, Campo2DDoPassoCtx } from './campo2d-modo'
import { usePreparaTroca2D } from './troca2d-copa'
import { fimDoPassoMs, seguraPelaDisputa } from './copa-clock-preview'
import { DUR_2D_SALA_MS } from './campo2d-motor'
import { vel2dBanco, VEL2D_SALA_OPTS } from './vel2d-regra'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { tr, getLang, ordinal } from './lang'
import { agoraSala } from './relogio'
import { CompetitionStage, CompetitionMatch, AberturaCopa, ResumoFase, ArtilheiroCopaCard, type AberturaFase, type ArtilheiroLinha } from './online-match-visual'
import { RESUMO_MS, respiroAntes } from './copa-passos'
import './online-match-visual.css'
import { Penaltis2D } from './campo2d-penaltis-react'
import type { ConfigPenaltisCampo, EstadoPenaltisCampo } from './campo2d-penaltis'
import { LiveScoreCard, PensShootout, pensRevealDelay, useApitoDeLargada, FaixaPlacarMini, usePlacarFora } from './pyramidseason'
import { ChatWidget, GiroDaRodada, TrocaCampo2DSala, CardCollectPrompt } from './screens'
import { startCrowd, stopCrowd } from './sound'
import { SeloClube } from './selo-clube'
import { CMModal, ConvocacaoScreen, type Formation } from './copa-mundo'
import { RelogioConvocacao, SEG_CONVOCA_SALA } from './relogio-convocacao'
import { NaoSai, useChamaNaVez, CartaoSuaVez, AvisoDupla } from './proxima-competicao'
import { quemAgePorAssento, minhaDuplaNaCopa, duplaDoAssento, quemAgePeloEstado, soQuemEstaNaSala, minhaDuplaPeloEstado, duplaDoAssentoPeloEstado, type DuplaDoEstado } from './dupla-copa'
import { poolDoClube, type GolRegional } from './copa-regional'
import { useTaticasCopa, CartaoTaticaCopa } from './copa-taticas-online' // ⚔️ tática (igual às regionais)
import { montaQualTatica } from './copa-taticas'
import {
  LIB, LIBERTA_VAGAS, LETRAS_GRUPO, clubesLiberta, piorClubeLiberta, simulaLibertaSala, tabelaDoGrupo, montaFichaLiberta, entrantesLiberta,
  jogosDoPasso, faseDoPasso, libRodaBola, libComResumo, artilhariaLiberta, garconsLiberta,
  type MundoLiberta, type FichaLiberta, type TimeLiberta, type PickLiberta, type LugarLiberta, type ConfrontoLib, type FaseLibTipo,
} from './liberta-sala'

const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D', ROXO = '#7C3AED'
const OURO_LIB = '#C9A227' // 🎨 o dourado da paleta 'liberta' (COMPS)
const OSWALD = { fontFamily: "'Oswald','Arial Narrow',system-ui,sans-serif" } as const
const box = (bg: string) => ({ border: `3px solid ${INK}`, borderRadius: 14, boxShadow: `4px 4px 0 0 ${INK}`, background: bg }) as const
const semEmoji = (n: string) => n.replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{2B00}-\u{2BFF}]/gu, '').trim() || tr('Técnico', 'Manager')
const NOME = '🏆 Libertadores'

// ⏱️ os mesmos relógios da copa regional (aviso 15s · 40s por escolha · banner 15s · convocação da sala)
const SEG_ESCOLHA = 40
const SEG_AVISO = 15
const SEG_BANNER = 15
const SEG_CONVOCA = SEG_CONVOCA_SALA

type Pick = PickLiberta
const temClube = (p?: Pick | null): p is Pick => !!p && typeof p.pais === 'string' && !!p.pais
const temTime = (p?: Pick | null) => !!p && Array.isArray(p.xiKeys) && p.xiKeys.length === 11
const chaveCarta = (c: { name: string; club: string; year: number }) => `${c.name}|${c.club}|${c.year}`

type Fase = 'aviso' | 'bandeira' | 'banner' | 'convocacao' | 'torneio'
interface LinhaFase { edicao: number; seed: number; fase: Fase; vez_uid: string | null; ate: string | null; times: TimeLiberta[] | null; campeao: string | null }
interface LinhaSala { user_id: string; player_index: number; manager_name: string; copa: Pick | null; dupla_partner_of?: string | null; dupla_categories?: Record<string, string> | null }

const segundosAte = (ate?: string | null) => (ate ? Math.max(0, Math.ceil((new Date(ate).getTime() - agoraSala()) / 1000)) : 0)

// ─── ⏱️ o relógio da sala: o `esc_regional_clock` do banco, com os passos da Libertadores ─────
// (cópia do `useRelogioRegional` — lá os passos saem do formato da regional; aqui são os de `LIB`)
type Row = { revision: number; step: number; running: boolean; manual: boolean; speed: number; vel2d?: number | null; started_at: string; updated_at: string; duration_ms: number; extra_ms: number }
type Cmd = 'next' | 'skip' | 'finish' | 'manual' | 'auto' | 'speed' | 'vel2d'
interface Relogio { row: Row | null; now: number; isHost: boolean; busy: boolean; command: (c: Cmd, speed?: number) => Promise<void> }
const minutoDo = (r: Row, now: number) => (r.running ? Math.max(0, Math.min(93, Math.round((now - Date.parse(r.started_at)) / (r.duration_ms * 0.82) * 93))) : 93)
function useRelogioLiberta(roomId: string, edicao: number, seed: number, isHost: boolean, extraDoPasso: (s: number) => number, doisD = false): Relogio | undefined {
  const [row, setRow] = useState<Row | null>(null)
  const [semBanco, setSemBanco] = useState(false)
  const [busy, setBusy] = useState(false)
  const [now, setNow] = useState(Date.now())
  const prepara2D = usePreparaTroca2D(roomId, isHost)
  const atual = useRef<Row | null>(null), offset = useRef(0), voando = useRef(false), extra = useRef(extraDoPasso)
  extra.current = extraDoPasso
  const rpc = useCallback(async (cmd: 'read' | 'init' | Cmd, speed = 1) => {
    if (voando.current || semBanco) return
    if (cmd !== 'read' && !isHost) return
    voando.current = true
    if (cmd !== 'read') setBusy(true)
    const enviado = Date.now()
    try {
      const { data, error } = await supabase.rpc('esc_regional_clock', { p_room: roomId, p_edicao: edicao, p_seed: seed, p_command: cmd, p_revision: atual.current?.revision ?? -1, p_speed: speed, p_extra: cmd === 'next' ? extra.current((atual.current?.step ?? 0) + 1) : 0, p_rodadas: LIB.P_RODADAS, p_ko: LIB.P_KO })
      if (error) {
        if (error.code === 'PGRST202' || /esc_regional_clock|function/i.test(error.message ?? '')) setSemBanco(true)
        return
      }
      const d = data as { clock: Row | null; server_ms: number }
      offset.current = Number(d.server_ms) - (enviado + Date.now()) / 2
      if (d.clock && (!atual.current || d.clock.revision >= atual.current.revision)) { atual.current = d.clock; setRow(d.clock) }
      setNow(Date.now() + offset.current)
    } catch { /* a próxima batida tenta de novo */ } finally { voando.current = false; setBusy(false) }
  }, [roomId, edicao, seed, isHost, semBanco])
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
      const pronto2D = r.running ? true : prepara2D()
      if (r.running) { const due = fimDoPassoMs(r, doisDDoPasso(r) ?? doisD, extra.current(r.step)); if (agora >= due && !seguraPelaDisputa(due, agora)) void rpc('finish') }
      else if (!r.manual && r.step < LIB.FIM && agora >= Date.parse(r.updated_at) + respiroAntes(libRodaBola(r.step + 1), r.step, libComResumo(r.step + 1)) && pronto2D) void rpc('next')
    }, 250)
    return () => clearInterval(t)
  }, [isHost, rpc, doisD, prepara2D])
  if (semBanco) return undefined
  return { row, now, isHost, busy, command: (c: Cmd, sp?: number) => (c === 'next' && !prepara2D() ? Promise.resolve() : rpc(c, sp)) }
}

// ─── 🛡️ a grade dos clubes (as MESMAS peças da escolha de seleção: `ll27-selecoes`) ─────
function GradeDeClubes({ pegos, marcado, podeMarcar, aoMarcar }: { pegos: Map<string, string>; marcado: string | null; podeMarcar: boolean; aoMarcar: (c: string) => void }) {
  return (
    <div className="ll27-selecoes">
      {clubesLiberta().map(c => {
        const dono = pegos.get(c), eu = marcado === c
        return (
          <button key={c} type="button" disabled={!!dono || !podeMarcar} onClick={() => aoMarcar(c)}
            className={`ll27-selecao${dono ? ' tomada' : ''}${eu ? ' marcada' : ''}`}>
            <SeloClube clube={c} size={52} />
            <span className="ll27-selecao-nome">{c}</span>
            <span className="ll27-selecao-status">{dono ? `${tr('de', 'taken by')} ${dono}` : eu ? tr('✔️ marcado', '✔️ marked') : tr('livre', 'free')}</span>
          </button>
        )
      })}
    </div>
  )
}

function Barra({ seg, total, cor = GOLD }: { seg: number; total: number; cor?: string }) {
  const pct = Math.max(0, Math.min(100, (seg / total) * 100))
  return (
    <div className="ov3-surface" style={{ marginTop: 8, height: 16, border: `2.5px solid ${INK}`, borderRadius: 999, background: '#fff', overflow: 'hidden', position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0, width: `${pct}%`, background: seg <= 10 ? '#E8503A' : cor, transition: 'width .9s linear' }} />
      <b style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontSize: 10.5, fontWeight: 900, ...OSWALD, color: INK }}>{seg}s</b>
    </div>
  )
}

export function EscolheClube({ pegos, seg, aoConfirmar }: { pegos: Map<string, string>; seg: number; aoConfirmar: (c: string) => void }) {
  const [marcado, setMarcado] = useState<string | null>(null)
  const enviado = useRef(false), marcadoRef = useRef<string | null>(null), topo = useRef<HTMLDivElement>(null)
  marcadoRef.current = marcado
  useEffect(() => { topo.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }, [])
  useEffect(() => {
    if (seg > 0 || enviado.current) return
    enviado.current = true
    if (marcadoRef.current) aoConfirmar(marcadoRef.current)
  }, [seg]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div ref={topo} style={{ scrollMarginTop: 8 }}>
      <h3 style={{ margin: '0 0 2px' }}>{tr('🏆 É A SUA VEZ — ESCOLHA O CLUBE', '🏆 YOUR TURN — PICK THE CLUB')}</h3>
      <Barra seg={seg} total={SEG_ESCOLHA} />
      <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(0,0,0,.6)', margin: '6px 0 10px', lineHeight: 1.4 }}>
        {getLang() === 'en'
          ? <>Tap to mark and confirm. Then you call up your team from THAT club's cards (your auction team sits this one out, like in the World Cup). Clubs nobody picks play on auto with their own cards. If time runs out you take the one marked — and, with none marked, <b>the worst club left</b>.</>
          : <>Toque pra marcar e confirme. Depois você convoca o time com as cartas DESSE clube (o time do leilão fica de fora, igual na Copa do Mundo). Os clubes que ninguém escolher jogam no automático com as cartas deles. Se o tempo acabar, você leva o que estiver marcado — e, sem nada marcado, <b>o pior clube que sobrou</b>.</>}
      </p>
      <GradeDeClubes pegos={pegos} marcado={marcado} podeMarcar aoMarcar={setMarcado} />
      <div className="ll27-confirmar-barra">
        <button onClick={() => { if (marcado) { enviado.current = true; aoConfirmar(marcado) } }} disabled={!marcado} className={`ll27-confirmar${marcado ? ' pronto' : ''}`}>
          {marcado ? `${tr('✅ CONFIRMAR', '✅ CONFIRM')} ${marcado.toUpperCase()}` : tr('toque num clube', 'tap a club')}
        </button>
      </div>
    </div>
  )
}

// ─── 🚪 O PORTÃO: o que a sala vê quando a liga acaba ─────────────────────────
export function LibertaSalaGate({ roomId, souDono, meuUid, classificacao, matchSeed, aoStatus, seasonNo = 1, aoRemover, assentos, duplas }: {
  assentos?: string[]
  duplas?: Record<number, DuplaDoEstado>
  roomId: string
  souDono: boolean
  meuUid?: string
  /** a tabela FINAL da liga, do 1º ao último */
  classificacao: LugarLiberta[]
  matchSeed?: number
  aoStatus?: (s: { pendente: boolean; campeao: { nome: string; pais: string } | null; /** 🃏 22/11: a chave da cartinha do campeão (pro resgate) */ chave?: string }) => void
  seasonNo?: number
  aoRemover?: (id: number, nome: string) => void
}) {
  const en = getLang() === 'en'
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

  const acabouRef = useRef(false)
  // 🧯 leitura que falha NÃO apaga o que a tela sabe (lição de 07/09 da Copa do Mundo)
  const ler = useCallback(async () => {
    try {
      const [{ data: pls, error: e1 }, { data: fs, error: e2 }] = await Promise.all([
        supabase.from('room_players').select('user_id, player_index, manager_name, copa, dupla_partner_of, dupla_categories').eq('room_id', roomId),
        supabase.from('esc_copa_salas').select('edicao, seed, fase, vez_uid, ate, times, campeao').eq('room_id', roomId).eq('edicao', edicao).limit(1),
      ])
      if (e1 || e2 || !pls || !fs) return null
      setLinhas(pls as LinhaSala[])
      const f = fs[0] as LinhaFase | undefined
      setFase(f ? { ...f, seed: Number(f.seed) } : null)
      setLido(true)
      acabouRef.current = !!f?.campeao // 🏆 com campeão, para de perguntar ao banco
      return { linhas: pls as LinhaSala[], fase: f ? { ...f, seed: Number(f.seed) } : undefined }
    } catch { return null }
  }, [roomId, edicao])
  // 🐢 23/11 (Diego: "ok faça"): com a Copa ROLANDO (fase 'torneio') a leitura cai de 2 s pra 6 s — nessa hora ela só serve pra
  // descobrir o campeão (o jogo anda pelo relógio do banco e a tática tem leitura própria). Escolha de seleção/convocação seguem em 2 s.
  const torneioRef = useRef(false)
  useEffect(() => { torneioRef.current = fase?.fase === 'torneio' }, [fase?.fase])
  useEffect(() => {
    void ler()
    let ultima = Date.now()
    const iv = setInterval(() => {
      if (acabouRef.current) return
      if (torneioRef.current && Date.now() - ultima < 6000) return
      ultima = Date.now(); void ler()
    }, 2000)
    return () => clearInterval(iv)
  }, [ler])

  // 🤝 assento → quem age por ele (na dupla, só UM escolhe e convoca)
  const porEstado = useMemo(() => quemAgePeloEstado(assentos, duplas), [assentos, duplas])
  const presentes = useMemo(() => new Set(linhas.map(l => l.user_id)), [linhas])
  const uidDe = useMemo(() => porEstado ? soQuemEstaNaSala(porEstado, assentos, duplas, presentes) : quemAgePorAssento(linhas), [porEstado, assentos, duplas, presentes, linhas])
  const dupla = useMemo(() => {
    const d = porEstado ? minhaDuplaPeloEstado(assentos, duplas, meuUid) : minhaDuplaNaCopa(linhas, meuUid)
    return d && porEstado && !presentes.has(d.age) && presentes.has(d.outro) ? { age: d.outro, outro: d.age, nomeAge: d.nomeOutro, nomeOutro: d.nomeAge } : d
  }, [porEstado, assentos, duplas, linhas, meuUid, presentes])
  const euUid = dupla?.age ?? meuUid
  const soAssisto = !!dupla && dupla.age !== meuUid
  const nomeDe = useMemo(() => new Map(linhas.map(l => [l.user_id, semEmoji(l.manager_name)])), [linhas])
  const picks = useMemo(() => { const m = new Map<string, Pick>(); for (const l of linhas) if (temClube(l.copa)) m.set(l.user_id, l.copa); return m }, [linhas])
  // a FILA: TODOS os times da liga entram (32 vagas ≥ a liga), mas só GENTE escolhe na tela; o bot leva o melhor que sobrou na ficha
  const classificados = useMemo(() => classificacao.slice(0, LIBERTA_VAGAS), [classificacao])
  const fila = useMemo(() => classificados.filter(c => c.humano && uidDe.has(c.id)).map((c, i) => ({ ...c, uid: uidDe.get(c.id)!, vez: i + 1 })), [classificados, uidDe])
  const pegos = useMemo(() => { const m = new Map<string, string>(); for (const f of fila) { const p = picks.get(f.uid); if (p) m.set(p.pais, f.nome) } return m }, [fila, picks])
  const seg = segundosAte(fase?.ate)
  const minha = euUid ? picks.get(euUid) ?? null : null
  const souAVez = !soAssisto && fase?.fase === 'bandeira' && fase.vez_uid === meuUid && !minha
  const minhaFila = fila.find(f => f.uid === euUid)
  const antesDeMim = minhaFila ? fila.filter(f => f.vez < minhaFila.vez && !picks.get(f.uid)).length : 0
  const mostraNaoSai = !!minhaFila && !minha && !souAVez && (!fase || fase.fase === 'aviso' || fase.fase === 'bandeira')
  const chama = useChamaNaVez(soAssisto ? null : souAVez ? `vez-${fase?.edicao}` : fase?.fase === 'convocacao' && minha && !temTime(minha) ? `convoca-${fase?.edicao}` : null)

  // ─── 👑 só o DONO empurra a fase (a vez, o prazo, o castigo de quem dormiu) ───
  const passo = useCallback(async () => {
    if (!souDono || acabouRef.current) return
    const l = await ler()
    if (!l?.fase) return
    const f = l.fase
    const pk = new Map<string, Pick>(); for (const x of l.linhas) if (temClube(x.copa)) pk.set(x.user_id, x.copa)
    const uid = porEstado ? soQuemEstaNaSala(porEstado, assentos, duplas, new Set(l.linhas.map(x => x.user_id))) : quemAgePorAssento(l.linhas)
    const filaAgora = classificados.filter(c => c.humano).map(c => ({ id: c.id, uid: uid.get(c.id) })).filter((x): x is { id: number; uid: string } => !!x.uid)
    const venceu = f.ate ? agoraSala() >= new Date(f.ate).getTime() : true
    const grava = (o: Record<string, unknown>) => supabase.from('esc_copa_salas').update(o).eq('room_id', roomId).eq('edicao', f.edicao)
    if (f.fase === 'aviso') {
      if (!venceu) return
      const primeiro = filaAgora.find(x => !pk.has(x.uid))
      await grava(primeiro ? { fase: 'bandeira', vez_uid: primeiro.uid, ate: new Date(Date.now() + SEG_ESCOLHA * 1000).toISOString() }
        : { fase: 'banner', vez_uid: null, ate: new Date(Date.now() + SEG_BANNER * 1000).toISOString() })
      return
    }
    if (f.fase === 'bandeira') {
      const sem = filaAgora.filter(x => !pk.has(x.uid))
      if (!sem.length) { await grava({ fase: 'banner', vez_uid: null, ate: new Date(Date.now() + SEG_BANNER * 1000).toISOString() }); return }
      const daVez = sem[0]
      if (f.vez_uid !== daVez.uid) { await grava({ vez_uid: daVez.uid, ate: new Date(Date.now() + SEG_ESCOLHA * 1000).toISOString() }); return }
      if (venceu) {
        // ⏰ estourou: o PIOR clube livre (sem pegar o que alguém de gente já marcou), e a vez anda
        const pior = piorClubeLiberta(new Set([...pk.values()].map(p => p.pais)))
        await supabase.from('room_players').update({ copa: { pais: pior, form: '4-3-3', xiKeys: [] } }).eq('room_id', roomId).eq('user_id', daVez.uid)
        const prox = sem[1]
        await grava(prox ? { vez_uid: prox.uid, ate: new Date(Date.now() + SEG_ESCOLHA * 1000).toISOString() } : { fase: 'banner', vez_uid: null, ate: new Date(Date.now() + SEG_BANNER * 1000).toISOString() })
      }
      return
    }
    if (f.fase === 'banner') { if (venceu) await grava({ fase: 'convocacao', ate: new Date(Date.now() + SEG_CONVOCA * 1000).toISOString() }); return }
    if (f.fase === 'convocacao') {
      if (!venceu && !filaAgora.every(x => temTime(pk.get(x.uid)))) return
      const ficha = montaFichaLiberta(classificacao, uid, pk, f.seed, f.edicao)
      await grava({ fase: 'torneio', vez_uid: null, ate: null, times: ficha.times })
    }
  }, [souDono, ler, classificados, classificacao, roomId, porEstado, assentos, duplas])
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
        fase: primeiro ? 'aviso' : 'convocacao', vez_uid: null,
        ate: new Date(Date.now() + (primeiro ? SEG_AVISO : SEG_CONVOCA) * 1000).toISOString(),
      })
      if (e2) { setErro(tr('Não consegui começar a Libertadores agora. Tenta de novo em instantes.', "Couldn't start the Libertadores right now. Try again in a moment.")); return }
      await ler()
    } finally { setComecando(false) }
  }
  async function gravaClube(clube: string) {
    if (!meuUid || soAssisto) return
    try { await supabase.from('room_players').update({ copa: { pais: clube, form: '4-3-3', xiKeys: [] } }).eq('room_id', roomId).eq('user_id', meuUid); await ler() } catch { /* a batida tenta de novo */ }
  }
  async function gravaTime(xiKeys: string[], form: Formation, parcial = false) {
    if (!meuUid || !minha || soAssisto) return
    if (!parcial && xiKeys.length !== 11) return
    try { await supabase.from('room_players').update({ copa: { ...minha, form, xiKeys } }).eq('room_id', roomId).eq('user_id', meuUid); await ler() } catch { /* idem */ }
  }

  // 🛡️ ficha só vale com as 32 (ficha velha/torta não abre o torneio — o motor exige 32)
  const ficha: FichaLiberta | null = fase?.fase === 'torneio' && Array.isArray(fase.times) && fase.times.length === LIBERTA_VAGAS ? { seed: fase.seed, edicao: fase.edicao, times: fase.times } : null
  useEffect(() => { if (ficha && !fase?.campeao) setAberta(true) }, [ficha?.seed]) // eslint-disable-line react-hooks/exhaustive-deps
  const campeao = useMemo(() => { if (!fase?.campeao) return null; const [nome, pais] = fase.campeao.split(' | '); return nome ? { nome, pais: pais ?? '' } : null }, [fase?.campeao])
  useEffect(() => { aoStatus?.({ pendente: !campeao, campeao, chave: campeao && fase?.seed != null ? `libsala:${roomId}:${fase.seed}:${fase.edicao}` : undefined }) }, [campeao]) // eslint-disable-line react-hooks/exhaustive-deps
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
  const status = fase?.fase === 'aviso' ? `${tr('A escolha dos clubes começa em', 'Club picks start in')} ${seg}s`
    : fase?.fase === 'bandeira' ? (souAVez ? tr('É a sua vez de escolher o clube', 'Your turn to pick a club') : `${daVezNome} ${tr('está escolhendo o clube', 'is picking a club')} · ${seg}s`)
    : fase?.fase === 'banner' ? `${tr('A convocação abre em', 'Call-up opens in')} ${seg}s`
    : fase?.fase === 'convocacao' ? (temTime(minha) ? tr('Seu time está convocado · esperando a turma', 'Your team is called up · waiting for the crew') : soAssisto ? `${dupla!.nomeAge} ${tr('está convocando pela dupla', 'is calling up for your duo')} · ${seg}s` : `${tr('Convoque os seus 11', 'Call up your 11')} · ${seg}s`)
    : fase?.fase === 'torneio' ? tr('Competição em andamento', 'Competition in progress')
    : tr('Aguardando o dono abrir a Libertadores', 'Waiting for the host to open the Libertadores')
  const detalhe = tr('32 clubes de verdade · 8 grupos · oitavas, quartas e semi em ida e volta · final em jogo único', '32 real clubs · 8 groups · two-legged round of 16, quarters and semis · one-off final')
  const removiveis = fila.filter(f => f.uid !== euUid)
  const [gerenciar, setGerenciar] = useState(false)

  return (
    <>
      {chama.aberto?.startsWith('vez') && <CartaoSuaVez titulo={tr('Sua vez de escolher!', 'Your turn to pick!')} texto={`${NOME} · ${en ? `you have ${SEG_ESCOLHA}s to pick your club` : `você tem ${SEG_ESCOLHA}s pra pegar o clube`}`} botao={tr('Escolher meu clube', 'Pick my club')} aoFechar={chama.fechar} />}
      <CompetitionStage kind="liberta" title={tr('A LIGA TERMINOU · PRÓXIMA COMPETIÇÃO', 'THE LEAGUE IS OVER · NEXT COMPETITION')} phase={NOME} detail={detalhe} status={status}>
        <div className="ll26-cup-entry">
          {soAssisto && dupla && <AvisoDupla quem={dupla.nomeAge} />}
          {mostraNaoSai && <NaoSai minhaVez={minhaFila!.vez} antes={antesDeMim} fase={fase?.fase} seg={seg} segPorVez={SEG_ESCOLHA} />}
          {!!fila.length && fase?.fase !== 'torneio' && fase?.fase !== 'convocacao' && (
            <div className="ll27-fila">
              <h3>{tr('ORDEM DA ESCOLHA (PELA TABELA DA LIGA)', 'PICK ORDER (BY THE LEAGUE TABLE)')}</h3>
              {fila.map(f => {
                const p = picks.get(f.uid), eu = f.uid === euUid
                const du = (porEstado ? duplaDoAssentoPeloEstado(assentos, duplas, f.id) : duplaDoAssento(linhas, f.id))
                const daVez = fase?.fase === 'bandeira' && !p && fila.find(x => !picks.get(x.uid))?.uid === f.uid
                return (
                  <div key={f.uid} className={`ll27-fila-linha${daVez ? ' vez' : ''}${eu ? ' eu' : ''}`}>
                    <span className="ll27-fila-n">{ordinal(f.vez)}</span>
                    <span className="ll27-fila-nome">{f.nome}{eu ? (soAssisto ? tr(' (sua dupla)', ' (your duo)') : tr(' (você)', ' (you)')) : ''}{du && <small style={{ display: 'block', fontSize: 10.5, fontWeight: 700, color: 'rgba(0,0,0,.55)' }}>{en ? `🏳️ ${du.nomeAge} picks · 🤝 ${du.nomeOutro} watches` : `🏳️ ${du.nomeAge} escolhe · 🤝 ${du.nomeOutro} assiste`}</small>}</span>
                    {p ? <span className="ll27-fila-pais"><SeloClube clube={p.pais} size={22} /> {p.pais}{temTime(p) ? ' ✔️' : ''}</span>
                      : <span className="ll27-fila-espera">{daVez ? `⏳ ${seg}s` : tr('na fila', 'in line')}</span>}
                  </div>
                )
              })}
            </div>
          )}
          {!fase && lido && (souDono
            ? <>
                <button className="ll27-portao-botao" disabled={comecando} onClick={() => { void comecar() }}>{comecando ? tr('⏳ Começando…', '⏳ Starting…') : tr('COMEÇAR A 🏆 LIBERTADORES', 'START THE 🏆 LIBERTADORES')}</button>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(0,0,0,.6)', margin: '8px 2px 0', lineHeight: 1.45 }}>
                  {en ? <>From then on the clock runs: <b>{SEG_ESCOLHA}s</b> for each one to pick a club, in table order, then <b>{SEG_CONVOCA}s</b> for everyone to call up their 11 together.</>
                    : <>A partir daí o relógio corre: <b>{SEG_ESCOLHA}s</b> pra cada um escolher o clube, na ordem da tabela, e depois <b>{SEG_CONVOCA}s</b> pra todo mundo convocar os 11 junto.</>}
                </p>
              </>
            : <p className="ll27-portao-aviso">{tr('⏳ O dono da sala abre a Libertadores — segura aí.', '⏳ The room owner opens the Libertadores — hang on.')}</p>)}
          <details className="ll26-format" style={{ marginTop: fase ? 0 : 6 }}>
            <summary>{tr('REGULAMENTO', 'FORMAT')}</summary>
            <p>{en
              ? `${LIBERTA_VAGAS} real South American clubs. Every league team picks a club in table order (bots take the best one left) and calls up 11 from that club's cards; the machine fills the rest with the strongest clubs nobody picked. 8 groups of 4, home and away (6 rounds); the top 2 go through. Round of 16: group winner × runner-up of another group (draw), 2nd leg at the winner's home. Round of 16, quarters and semis over two legs (aggregate; level = penalties, no away goals). One-off final, draw = penalties. Tiebreak: points → wins → goal difference → goals.`
              : `${LIBERTA_VAGAS} clubes sul-americanos de verdade. Todo time da liga escolhe um clube na ordem da tabela (o bot leva o melhor que sobrou) e convoca 11 das cartas dele; a máquina completa com os clubes mais fortes que ninguém pegou. 8 grupos de 4, turno e returno (6 rodadas); passam os 2 primeiros. Oitavas: 1º de grupo × 2º de outro grupo (sorteio), volta na casa do 1º. Oitavas, quartas e semi em ida e volta (soma dos gols; empate = pênaltis, sem gol fora). Final em jogo único, empate = pênaltis. Desempate: pontos → vitórias → saldo → gols.`}</p>
          </details>
          {fase?.fase === 'bandeira' && (souAVez
            ? <EscolheClube pegos={pegos} seg={seg} aoConfirmar={c => { void gravaClube(c) }} />
            : <>
                <p className="ll27-portao-aviso">{minha
                  ? (en ? <><SeloClube clube={minha.pais} size={22} /> You are <b>{minha.pais}</b>. Now wait for the line — <b>{daVezNome}</b> is picking ({seg}s).</> : <><SeloClube clube={minha.pais} size={22} /> Você é o <b>{minha.pais}</b>. Agora é esperar a fila — <b>{daVezNome}</b> está escolhendo ({seg}s).</>)
                  : (en ? <>⏳ <b>{daVezNome}</b> is picking a club ({seg}s). Your turn comes in table order.</> : <>⏳ <b>{daVezNome}</b> está escolhendo o clube ({seg}s). A sua vez vem na ordem da tabela.</>)}</p>
                <GradeDeClubes pegos={pegos} marcado={minha?.pais ?? null} podeMarcar={false} aoMarcar={() => {}} />
              </>)}
          {(fase?.fase === 'aviso' || fase?.fase === 'banner') && (
            <div style={{ ...box(`linear-gradient(150deg,#FFE79A,${GOLD} 55%,#E8A200)`), padding: '14px 13px', textAlign: 'center' }}>
              <Trofeu comp="liberta" size={64} />
              <p style={{ ...OSWALD, fontWeight: 900, fontSize: 19, margin: '2px 0 0', textTransform: 'uppercase' }}>{fase.fase === 'aviso' ? tr('A escolha dos clubes vai começar!', 'Club picks are about to start!') : tr('Todos os clubes escolhidos!', 'All clubs picked!')}</p>
              <p style={{ fontSize: 11.5, fontWeight: 800, color: 'rgba(0,0,0,.7)', margin: '5px 0 0', lineHeight: 1.4 }}>
                {fase.fase === 'aviso'
                  ? (en ? <>One at a time, in <b>league table order</b>: each one has <b>{SEG_ESCOLHA} seconds</b> to pick a club.<br />⚠️ Didn't pick in time? The system gives you the <b>worst club left</b>.</>
                    : <>Um de cada vez, na <b>ordem da tabela da liga</b>: cada um tem <b>{SEG_ESCOLHA} segundos</b> pra escolher o clube.<br />⚠️ Não escolheu no tempo? O sistema te dá o <b>pior clube que sobrou</b>.</>)
                  : (en ? <>Now you have <b>{SEG_CONVOCA} seconds</b> to call up <b>11 players</b> from your club.<br />⚠️ Whoever doesn't call up enters with the <b>worst 11</b>.</>
                    : <>Agora você tem <b>{SEG_CONVOCA} segundos</b> pra convocar <b>11 jogadores</b> do seu clube.<br />⚠️ Quem não convocar entra com os <b>11 piores</b>.</>)}
              </p>
              <Barra seg={seg} total={fase.fase === 'aviso' ? SEG_AVISO : SEG_BANNER} cor="#fff" />
            </div>
          )}
          {fase?.fase === 'convocacao' && (
            <div className="ll27-convoca">
              <h3>{temTime(minha) ? tr('✅ TIME CONVOCADO', '✅ TEAM CALLED UP') : soAssisto ? (en ? `⏳ ${dupla!.nomeAge.toUpperCase()} IS CALLING UP THE 11` : `⏳ ${dupla!.nomeAge.toUpperCase()} ESTÁ CONVOCANDO OS 11`) : tr('⚽ CONVOQUE OS 11', '⚽ CALL UP THE 11')}</h3>
              <RelogioConvocacao seg={seg} total={SEG_CONVOCA} />
              {minha && !temTime(minha) && !soAssisto && <div style={{ marginTop: 10 }}><button className="ll27-portao-botao verde" onClick={() => setConvocaAberta(true)}>{tr('⚽ VOLTAR PRA CONVOCAÇÃO', '⚽ BACK TO THE CALL-UP')}</button></div>}
              {temTime(minha) && <p className="ll27-portao-aviso" style={{ marginTop: 8 }}><SeloClube clube={minha!.pais} size={22} /> <b>{minha!.pais}</b> {tr('com 11 no papel. A Libertadores começa quando o tempo acabar (ou quando todo mundo terminar).', 'with 11 on paper. The Libertadores starts when time runs out (or when everyone finishes).')}</p>}
            </div>
          )}
          {!!erro && <p style={{ fontSize: 11, fontWeight: 800, color: '#B23B2E', margin: '8px 2px 0', lineHeight: 1.4 }}>{erro}</p>}
          {ficha && !aberta && <div style={{ marginTop: 8 }}><button className="ll27-portao-botao" onClick={() => setAberta(true)}>{tr('VOLTAR PRA 🏆 LIBERTADORES', 'BACK TO THE 🏆 LIBERTADORES')}</button></div>}
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
      {fase?.fase === 'convocacao' && convocaAberta && minha && !temTime(minha) && !soAssisto && (
        <CMModal>
          <ConvocacaoScreen pais={minha.pais} poolPronto={poolDoClube(minha.pais)} emblema={<SeloClube clube={minha.pais} size={30} />} rotuloTime={tr('seu clube', 'your club')} prazoSeg={seg}
            fecharam={{ total: picks.size, nomes: [...picks].filter(([, p]) => temTime(p)).map(([u]) => nomeDe.get(u) ?? '').filter(Boolean) }}
            onBack={() => setConvocaAberta(false)}
            aoEstourar={(parcial, f) => { setConvocaAberta(false); void gravaTime(parcial.map(chaveCarta), f, true) }}
            onDone={(xi, f) => { setConvocaAberta(false); void gravaTime(xi.map(chaveCarta), f) }} />
        </CMModal>
      )}
      {ficha && aberta && (
        <CMModal wide cinematic onlineBroadcast>
          <ChatWidget />
          <LibertaSalaTorneio ficha={ficha} roomId={roomId} meuUid={euUid} souDono={souDono}
            aoCampeao={(nome, clube) => { void gravaCampeao(nome, clube) }} aoFechar={() => setAberta(false)} />
        </CMModal>
      )}
    </>
  )
}

// 🪶 o placar grande que vira TIRA no topo ao rolar (a mesma peça da liga online). Só gols até o minuto da tela.
function PlacarQueGruda({ min, fim, home, away, goals, youIsHome, children }: {
  min: number; fim: boolean; home: string; away: string; goals: GolRegional[]; youIsHome: boolean; children: React.ReactNode
}) {
  const caixa = useRef<HTMLDivElement | null>(null)
  const fora = usePlacarFora(caixa)
  const hg = goals.filter(g => g.home).length
  return (
    <>
      <div ref={caixa} style={{ marginBottom: 8 }}>{children}</div>
      {fora && <FaixaPlacarMini topo={0} min={min} fim={fim} home={home} away={away} hg={hg} ag={goals.length - hg} youIsHome={youIsHome}
        onAbrir={() => caixa.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })} />}
    </>
  )
}

const nomeFase = (t: FaseLibTipo | 'final') => (t === 'oitavas' ? tr('OITAVAS DE FINAL', 'ROUND OF 16') : t === 'quartas' ? tr('QUARTAS DE FINAL', 'QUARTER-FINALS') : t === 'semi' ? tr('SEMIFINAL', 'SEMI-FINALS') : tr('🏆 FINAL', '🏆 FINAL'))
const curtoFase = (t: FaseLibTipo | 'final') => (t === 'oitavas' ? tr('OITAVAS', 'R16') : t === 'quartas' ? tr('QUARTAS', 'QF') : t === 'semi' ? 'SEMI' : 'FINAL')

// ─── ⚽ O TORNEIO ─────────────────────────────────────────────────────────────
export function LibertaSalaTorneio({ ficha, roomId, meuUid, souDono, aoCampeao, aoFechar, semRelogio = false, passoBancada = 0 }: {
  ficha: FichaLiberta; roomId: string; meuUid?: string; souDono: boolean
  aoCampeao: (nome: string, clube: string) => void; aoFechar: () => void
  /** 🧪 bancada: força o relógio de cada aparelho (sem banco) */
  semRelogio?: boolean
  /** 🧪 bancada: começa direto num passo (só com `semRelogio`) */
  passoBancada?: number
}) {
  const entrants = useMemo(() => entrantesLiberta(ficha, meuUid), [ficha, meuUid])
  const mundoRef = useRef<MundoLiberta | null>(null)
  const festaKey = `esc-festa-libsala-${roomId}-${ficha.edicao}`
  const [festaVista, setFestaVista] = useState(() => { try { return sessionStorage.getItem(festaKey) === '1' } catch { return false } })
  const temGente = (h: number, a: number) => !!(entrants[h].humano || entrants[a].humano)
  // 🥅 o tempo dos pênaltis entra no `extra` do passo: só na VOLTA (agregado empatado) e na final
  const extraDoPasso = (s: number) => {
    const mundo = mundoRef.current
    if (!mundo) return 0
    if (s === LIB.FINAL) return mundo.final.pen ? Math.round(pensRevealDelay(mundo.final.pen, temGente(mundo.final.h, mundo.final.a)) * 1000) : 0
    if (s === LIB.OIT_VOLTA || s === LIB.QF_VOLTA || s === LIB.SF_VOLTA) {
      const f = faseDoPasso(mundo, s)
      return f ? Math.round(Math.max(0, ...f.ties.map(t => (t.pen ? pensRevealDelay(t.pen, temGente(t.h, t.a)) * 1000 : 0)))) : 0
    }
    return 0
  }
  const c2dSala = useCampo2DLigado()
  const relogioBanco = useRelogioLiberta(roomId, ficha.edicao, ficha.seed, souDono, extraDoPasso, c2dSala)
  // ⚔️ TÁTICA (igual às regionais, `copa-taticas.ts`): só linhas CONGELADAS do banco; a tela espera a que decide o jogo da
  // vez. Usa o MESMO relógio/tabela das regionais (tipo 'regional', a chave é sala + edição + semente). Sem relógio no
  // banco (bancada/fallback) não tem tática — cada aparelho andaria sozinho.
  const comTatica = !semRelogio
  const tat = useTaticasCopa('regional', roomId, ficha.edicao, ficha.seed, comTatica ? relogioBanco?.row : undefined, meuUid)
  const uidsDaFicha = useMemo(() => ficha.times.map(t => t.uid), [ficha])
  const qual = useMemo(() => (comTatica ? withCupPlans(montaQualTatica(tat.linhas, uidsDaFicha),tat.planos,uidsDaFicha) : undefined), [comTatica, tat.linhas,tat.planos, uidsDaFicha])
  const mundo: MundoLiberta = useMemo(() => simulaLibertaSala(entrants, ficha.seed, qual), [entrants, ficha.seed, qual])
  mundoRef.current = mundo
  const ultimoPronto = useRef<Row | null>(null)
  if (tat.pronto && relogioBanco?.row) ultimoPronto.current = relogioBanco.row
  const relogio = semRelogio ? undefined : relogioBanco && !tat.pronto ? { ...relogioBanco, row: ultimoPronto.current } : relogioBanco

  // 🛟 sem relógio no banco: cada aparelho anda sozinho, no automático
  const [passoLocal, setPassoLocal] = useState(semRelogio ? passoBancada : 0)
  const [acabouLocal, setAcabouLocal] = useState(true)
  const [paradoDesde, setParadoDesde] = useState(Date.now())
  const [inicioLocal, setInicioLocal] = useState(Date.now())
  const [, setTique] = useState(0)
  useEffect(() => { if (relogio) return; const iv = setInterval(() => setTique(t => t + 1), 200); return () => clearInterval(iv) }, [!!relogio]) // eslint-disable-line react-hooks/exhaustive-deps
  const c2d = doisDDoPasso(relogio?.row) ?? c2dSala
  const ROUND_MS = c2d ? DUR_2D_SALA_MS : 16000
  const step = relogio ? relogio.row?.step ?? 0 : passoLocal
  const liveDone = relogio ? !!relogio.row && !relogio.row.running : acabouLocal
  const roundMs = relogio?.row?.duration_ms ?? ROUND_MS
  const liveMin = relogio ? (relogio.row ? minutoDo(relogio.row, relogio.now) : 0) : (acabouLocal ? 93 : Math.max(0, Math.min(93, Math.round((Date.now() - inicioLocal) / (ROUND_MS * 0.82) * 93))))
  useEffect(() => {
    if (relogio || acabouLocal) return
    const t = setTimeout(() => { setAcabouLocal(true); setParadoDesde(Date.now()) }, ROUND_MS + 700 + extraDoPasso(passoLocal))
    return () => clearTimeout(t)
  }, [passoLocal, acabouLocal, !!relogio]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (relogio || !acabouLocal || passoLocal >= LIB.FIM) return
    const t = setTimeout(() => { const s = passoLocal + 1; setPassoLocal(s); setParadoDesde(Date.now()); if (libRodaBola(s)) { setAcabouLocal(false); setInicioLocal(Date.now()) } }, respiroAntes(libRodaBola(passoLocal + 1), passoLocal, libComResumo(passoLocal + 1)))
    return () => clearTimeout(t)
  }, [acabouLocal, passoLocal, !!relogio]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { startCrowd(); return () => stopCrowd() }, [])
  useApitoDeLargada('libsala', libRodaBola(step) ? step : null, true)

  const ownerVisual = useOwnerLayout()
  const cupPilot=useOwnerFootballPilot()
  const cupFeatures=useOwnerFootballAvailable()
  const done = step >= LIB.FIM
  const finalVista = step >= LIB.FINAL && liveDone
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
  const rodadaAtual = Math.min(LIB.RODADAS, step)
  const rodadasVistas = step <= LIB.RODADAS && !liveDone ? Math.max(0, rodadaAtual - 1) : rodadaAtual
  const golsAte = (ev: GolRegional[]) => (liveDone ? ev : ev.filter(g => g.min <= liveMin))
  const golsDe = (ev: GolRegional[], casa: boolean) => ev.filter(g => g.home === casa).length
  const sel = (i: number, size = 22) => <SeloClube clube={entrants[i].pais} size={size} />

  const live = (h: number, a: number, ev: GolRegional[], pen?: CupPenaltyPresentation) => (
    <PlacarQueGruda min={Math.min(93, liveMin)} fim={liveDone} home={entrants[h].pais} away={entrants[a].pais} goals={golsAte(ev)} youIsHome={isYou(h)}>
      <LiveScoreCard broadcastTransition={cupPilot?abertura:undefined} penaltyPanel={pen?.panel} neutro={!isYou(h)&&!isYou(a)} disputaPenaltis={pen?.sessao} estadoPenaltis={pen?.estado} enhancedOnline displayMinute={relogio ? liveMin : undefined} homeName={entrants[h].pais} awayName={entrants[a].pais} homeColor={GREEN} awayColor="#C2452F"
        homeOwner={dono(h)} awayOwner={dono(a)} homeEmblem={sel(h, 58)} awayEmblem={sel(a, 58)}
        youIsHome={isYou(h)} goals={ev} roundKey={step} roundMs={roundMs} finished={liveDone} footTint={{ bg: '#FFF3C2', border: '#f0d98a', holo: 0.5 }} elencos={{ casa: entrants[h].xi, fora: entrants[a].xi }} />
    </PlacarQueGruda>
  )
  const jogoLinha = (h: number, a: number, ev: GolRegional[], key: string, status: string, pen?: [number, number]) => {
    const g = golsAte(ev)
    return <CompetitionMatch key={key} showOwners goals={g} home={entrants[h].pais} away={entrants[a].pais} homeOwner={dono(h)} awayOwner={dono(a)}
      homeCrest={sel(h, 26)} awayCrest={sel(a, 26)} homeScore={golsDe(g, true)} awayScore={golsDe(g, false)} mine={isYou(h) || isYou(a)} status={status}
      detail={pen && (liveDone || liveMin >= 93) ? <PensShootout compactOnline pens={pen} aName={entrants[h].pais} bName={entrants[a].pais} aCrest={sel(h, 20)} bCrest={sel(a, 20)} aSquad={entrants[h].xi} bSquad={entrants[a].xi} lento={temGente(h, a)} /> : undefined} />
  }
  // 📋 a tabela de um grupo — INTEIRA (regra do Diego: tabela nunca em janela); os 2 primeiros na faixa dourada
  const tabelaGrupo = (gi: number) => {
    const linhas = tabelaDoGrupo(mundo, gi, rodadasVistas)
    const COLS = '16px 24px minmax(0,1fr) 22px 26px 22px 30px'
    return (
      <div key={gi} style={{ ...box('#fff'), color: INK, padding: 8 }}>
        <p style={{ ...OSWALD, fontWeight: 900, fontSize: 13, margin: '-8px -8px 6px', padding: '5px 9px', textTransform: 'uppercase', background: '#0B0B0B', color: OURO_LIB, borderRadius: '11px 11px 0 0', borderBottom: `2px solid ${INK}` }}>{tr('GRUPO', 'GROUP')} {LETRAS_GRUPO[gi]}</p>
        <div style={{ display: 'grid', gridTemplateColumns: COLS, gap: 5, padding: '0 5px 3px', ...OSWALD, fontSize: 9.5, color: 'rgba(0,0,0,.5)' }}>
          <span>#</span><span /><span>{tr('CLUBE', 'CLUB')}</span><span style={{ textAlign: 'right' }}>{tr('J', 'P')}</span><span style={{ textAlign: 'right' }}>PTS</span><span style={{ textAlign: 'right' }}>{tr('V', 'W')}</span><span style={{ textAlign: 'right' }}>{tr('SG', 'GD')}</span>
        </div>
        {linhas.map((r, i) => (
          <div key={r.t} style={{ display: 'grid', gridTemplateColumns: COLS, gap: 5, alignItems: 'center', padding: '3px 5px', fontSize: 11.5, fontWeight: isYou(r.t) ? 900 : 700,
            background: i < 2 ? OURO_LIB + '33' : 'transparent', borderLeft: `4px solid ${i < 2 ? OURO_LIB : 'transparent'}`, outline: isYou(r.t) ? `2.5px solid ${ROXO}` : undefined, outlineOffset: -2.5 }}>
            <span>{i + 1}</span>{sel(r.t, 20)}
            <span style={{ minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{entrants[r.t].pais}{entrants[r.t].humano ? <small style={{ fontWeight: 700, color: 'rgba(0,0,0,.5)' }}> · {entrants[r.t].club}</small> : null}</span>
            <span style={{ textAlign: 'right' }}>{r.j}</span><span style={{ textAlign: 'right', fontWeight: 900 }}>{r.pts}</span><span style={{ textAlign: 'right' }}>{r.w}</span><span style={{ textAlign: 'right' }}>{r.sg > 0 ? '+' : ''}{r.sg}</span>
          </div>
        ))}
      </div>
    )
  }
  const grupos = (
    <>
      <p style={{ ...OSWALD, fontWeight: 900, fontSize: 11, color: OURO_LIB, margin: '2px 0 6px' }}>{tr('▲ OS 2 PRIMEIROS DE CADA GRUPO VÃO PRAS OITAVAS', '▲ TOP 2 OF EACH GROUP GO TO THE ROUND OF 16')}</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(290px, 100%), 1fr))', gap: 8, marginBottom: 10 }}>{mundo.grupos.map((_, gi) => tabelaGrupo(gi))}</div>
    </>
  )
  // ⚔️ o quadro de um mata-mata de ida e volta (sem spoiler: a volta só aparece depois de jogada)
  const quadroFase = (tipo: FaseLibTipo, ties: ConfrontoLib[], idaVista: boolean, voltaVista: boolean) => (
    <div style={{ ...box('#fff'), color: INK, padding: 10, marginBottom: 10 }}>
      <p style={{ ...OSWALD, fontWeight: 900, fontSize: 13, margin: '0 0 6px' }}>{`⚔️ ${nomeFase(tipo)} · ${tr('IDA E VOLTA', 'TWO LEGS')}`}</p>
      {ties.map((t, i) => (
        <div key={i} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, borderTop: '2px solid rgba(0,0,0,.08)', padding: '6px 2px', fontSize: 12, fontWeight: isYou(t.h) || isYou(t.a) ? 900 : 700 }}>
          {sel(t.h)} {entrants[t.h].pais} <span style={{ color: 'rgba(0,0,0,.4)' }}>×</span> {entrants[t.a].pais} {sel(t.a)}
          {idaVista && <small style={{ fontWeight: 800, color: 'rgba(0,0,0,.6)' }}>· {tr('ida', '1st leg')} {t.ida.gh}×{t.ida.ga}{voltaVista ? ` · ${tr('volta', '2nd leg')} ${t.volta.ga}×${t.volta.gh} · ${tr('agregado', 'agg.')} ${t.agg[0]}×${t.agg[1]}${t.pen ? ` (${tr('pên.', 'pens')} ${t.pen[1]}×${t.pen[0]})` : ''}` : ''}</small>}
          {voltaVista && <b style={{ color: GREEN }}>✔ {entrants[t.winner].pais}</b>}
          {(isYou(t.h) || isYou(t.a)) && <b style={{ color: ROXO }}>{tr(' 👈 VOCÊ', ' 👈 YOU')}</b>}
        </div>
      ))}
      {tipo === 'oitavas' && !idaVista && <p style={{ fontSize: 10.5, fontWeight: 700, color: 'rgba(0,0,0,.55)', margin: '6px 0 0' }}>{tr('🎲 Sorteio: 1º de grupo × 2º de outro grupo. A volta é na casa do 1º.', '🎲 Draw: group winner × runner-up of another group. 2nd leg at the winner’s home.')}</p>}
    </div>
  )

  const fase = faseDoPasso(mundo, step)
  const proximoRotulo = !liveDone ? tr('⏳ Deixa o jogo acabar…', '⏳ Let the game finish…')
    : step < LIB.RODADAS ? `${tr('▶️ Rodada', '▶️ Round')} ${step + 1} ${tr('de', 'of')} ${LIB.RODADAS}`
    : step < LIB.SF_VOLTA ? `▶️ ${nomeFase(mundo.ko[Math.floor((step + 1 - LIB.OIT_IDA) / 2)].tipo)} · ${(step + 1 - LIB.OIT_IDA) % 2 ? tr('VOLTA', '2ND LEG') : tr('IDA', '1ST LEG')}`
    : step < LIB.FINAL ? `▶️ ${nomeFase('final')}`
    : tr('🎉 Cerimônia', '🎉 Ceremony')
  const controles = relogio?.row && (
    <section className={ownerVisual ? 'ov3-clock-controls' : 'll27-world-controls ll31-tournament-controls'} aria-label={tr('Ritmo da copa', 'Cup pace')}>
      {ownerVisual && relogio.isHost ? <OwnerPlayback manual={relogio.row.manual} onToggle={() => void relogio.command(relogio.row?.manual ? 'auto' : 'manual')} speed={c2d ? vel2dBanco(true, relogio.row.vel2d) : relogio.row.speed} onSpeed={v => void relogio.command(c2d ? 'vel2d' : 'speed', v)} opts={c2d ? VEL2D_SALA_OPTS : undefined} canNext={!relogio.busy && liveDone && !done} onNext={() => void relogio.command('next')} onSkip={() => void relogio.command(relogio.row?.running ? 'skip' : 'next')} nextLabel={proximoRotulo} busy={relogio.busy} speedDisabled={relogio.row.running} allowAutoSpeed /> : relogio.isHost ? <>
        <div className="ll27-world-rhythm">
          <button className={relogio.row.manual ? 'selected' : ''} disabled={relogio.busy} onClick={() => void relogio.command('manual')}>MANUAL</button>
          <button className={!relogio.row.manual ? 'selected' : ''} disabled={relogio.busy} onClick={() => void relogio.command('auto')}>AUTO</button>
          <select aria-label={tr('Velocidade', 'Speed')} value={c2d ? vel2dBanco(true, relogio.row.vel2d) : relogio.row.speed} disabled={relogio.busy || relogio.row.running} onChange={e => void relogio.command(c2d ? 'vel2d' : 'speed', Number(e.target.value))}>
            {c2d ? VEL2D_SALA_OPTS.map(o => <option key={o.v} value={o.v}>{tr(o.pt, o.en)}</option>)
              : <><option value={0.25}>¼×</option><option value={0.5}>½×</option><option value={1}>Normal</option><option value={2}>2×</option><option value={3}>3×</option><option value={4}>4×</option></>}
          </select>
        </div>
        <div className="ll27-world-rhythm ll31-tournament-actions">
          <button className="primary" disabled={relogio.busy || !liveDone || done} onClick={() => void relogio.command('next')}>{proximoRotulo}</button>
          <button disabled={relogio.busy} onClick={() => void relogio.command(relogio.row?.running ? 'skip' : 'next')}>{tr('PULAR', 'SKIP')}</button>
        </div>
      </> : <p style={{ fontSize: 11, fontWeight: 700, margin: 0 }}>{tr('Ritmo da sala', 'Room pace')}: {relogio.row.manual ? 'manual' : tr('automático', 'auto')} · {c2d ? vel2dBanco(relogio.row.manual, relogio.row.vel2d) : relogio.row.speed}× · {tr('controlado pelo host', 'controlled by the host')}</p>}
      {!done && <TrocaCampo2DSala />}
    </section>
  )
  const etapa = done ? tr('Campeão definido', 'Champion decided') : step === 0 ? tr('Sorteio dos grupos', 'Group draw')
    : step <= LIB.RODADAS ? `${tr('Fase de grupos · rodada', 'Group stage · round')} ${step} ${tr('de', 'of')} ${LIB.RODADAS}`
    : fase ? `${nomeFase(fase.tipo)} · ${(step - LIB.OIT_IDA) % 2 ? tr('volta', '2nd leg') : tr('ida', '1st leg')}`
    : step === LIB.PAUSA ? tr('A final está definida', 'The final is set') : nomeFase('final')

  // 🎬 ABERTURA (bola parada e o PRÓXIMO passo rodando bola): resumo da fase que fechou + confrontos que vêm + contagem
  const proxPasso = step + 1
  const aberturaOn = liveDone && !done && libRodaBola(proxPasso)
  const abertura = aberturaOn ? (() => {
    const jogosProx = jogosDoPasso(mundo, proxPasso)
    const meuJogo = (js: { h: number; a: number }[]) => js.some(j => isYou(j.h) || isYou(j.a))
    const ordem: { label: string; passos: number[]; jogos: { h: number; a: number }[] }[] = [
      { label: tr('GRUPOS', 'GROUPS'), passos: [1, 2, 3, 4, 5, 6], jogos: mundo.rodadas.flat() },
      ...mundo.ko.map((f, i) => ({ label: curtoFase(f.tipo), passos: [LIB.OIT_IDA + 2 * i, LIB.OIT_IDA + 2 * i + 1], jogos: f.ties })),
      { label: 'FINAL', passos: [LIB.FINAL], jogos: [mundo.final] },
    ]
    const idxOn = ordem.findIndex(o => o.passos.includes(proxPasso))
    const fases: AberturaFase[] = ordem.map((o, i) => ({ label: i === 0 && proxPasso <= LIB.RODADAS ? `${o.label} ${proxPasso}/${LIB.RODADAS}` : o.label, estado: i < idxOn ? 'ok' : i === idxOn ? 'on' : '', meu: i <= idxOn && meuJogo(o.jogos) }))
    const meus = jogosProx.filter(j => isYou(j.h) || isYou(j.a)), outros = jogosProx.filter(j => !(isYou(j.h) || isYou(j.a)))
    const lista = [...meus, ...outros.slice(0, proxPasso === LIB.OIT_IDA ? 8 : 5)] // 🎲 antes das oitavas, o sorteio inteiro
    const confrontos = lista.map(j => ({ home: entrants[j.h].pais, away: entrants[j.a].pais, mine: isYou(j.h) || isYou(j.a), homeCrest: sel(j.h, 30), awayCrest: sel(j.a, 30) }))
    const comResumo = libComResumo(proxPasso)
    const respiro = respiroAntes(true, step, comResumo)
    const seg = relogio?.row ? (relogio.row.manual ? null : Math.max(0, Math.ceil((Date.parse(relogio.row.updated_at) + respiro - relogio.now) / 1000))) : null
    const espera = relogio?.row?.manual ? (relogio.isHost ? tr('▶️ Dê a largada nos controles', '▶️ Kick off from the controls') : tr('⏳ O host dá a largada', '⏳ The host kicks off')) : tr('⚽ Já vai rolar…', '⚽ About to kick off…')
    const total = Math.ceil(respiro / 1000)
    const desde = relogio ? (relogio.row ? Date.parse(relogio.row.updated_at) : 0) : paradoDesde
    const agora = relogio ? relogio.now : Date.now()
    if (comResumo && agora < desde + RESUMO_MS) {
      const r = (i: number) => ({ nome: entrants[i].pais, crest: sel(i, 18), meu: isYou(i) })
      // a fase que acabou de fechar: grupos (antes das oitavas) ou a fase anterior do mata-mata
      const fechada = proxPasso === LIB.OIT_IDA ? null : proxPasso === LIB.FINAL ? mundo.ko[2] : mundo.ko[(proxPasso - LIB.OIT_IDA) / 2 - 1]
      const dentro = new Set(fechada ? fechada.ties.map(t => t.winner) : mundo.classificados.flat())
      const passaram = [...dentro].map(r)
      const cairam = fechada ? fechada.ties.map(t => r(t.winner === t.h ? t.a : t.h)) : entrants.map((_, i) => i).filter(i => !dentro.has(i)).map(r)
      const proxima = proxPasso === LIB.FINAL ? tr('A FINAL', 'THE FINAL') : nomeFase(mundo.ko[(proxPasso - LIB.OIT_IDA) / 2].tipo)
      const titulo = fechada ? `${nomeFase(fechada.tipo)} ${tr('ENCERRADA', 'OVER')}` : tr('FASE DE GRUPOS ENCERRADA', 'GROUP STAGE OVER')
      return <ResumoFase titulo={titulo} passaram={passaram} cairam={cairam} proxima={proxima} seg={seg} total={total} cor={OURO_LIB} espera={espera} />
    }
    // 🎬 TÚNEL DA FINAL na paleta da Libertadores
    if (proxPasso === LIB.FINAL) return <TunelFinal comp="liberta" seg={seg} total={total} espera={espera} casa={{ nome: entrants[mundo.final.h].pais, crest: sel(mundo.final.h, 92) }} fora={{ nome: entrants[mundo.final.a].pais, crest: sel(mundo.final.a, 92) }} />
    return <AberturaCopa fases={fases} confrontos={confrontos} mais={Math.max(0, jogosProx.length - lista.length)} seg={seg} total={total} cor={OURO_LIB} espera={espera} />
  })() : null

  // 🥅 pênaltis no campinho 2D (o jogo grande da volta ou a final)
  const cfgPen2D = (h: number, a: number, pen: [number, number] | undefined, ck: string): ConfigPenaltisCampo | undefined => c2d && pen ? {
    id: `libsala:${step}:${ck}`, pens: pen, aName: entrants[h].pais, bName: entrants[a].pais,
    aSquad: entrants[h].xi, bSquad: entrants[a].xi, orcamento: pensRevealDelay(pen, temGente(h, a)),
  } : undefined
  const blocoPen = (h: number, a: number, pen: [number, number], legenda: string, final: boolean, estado?: EstadoPenaltisCampo) => (
    <div style={{ ...box('#fff'), padding: 8, marginBottom: 8, color: INK }}>
      <p style={{ ...OSWALD, fontWeight: 900, fontSize: 11, margin: '0 0 4px', textAlign: 'center' }}>🥅 {legenda}</p>
      <PensShootout campo={estado} compactOnline final={final} pens={pen} aName={entrants[h].pais} bName={entrants[a].pais} aCrest={sel(h, 20)} bCrest={sel(a, 20)} aSquad={entrants[h].xi} bSquad={entrants[a].xi} lento={temGente(h, a)} />
    </div>
  )

  const cupPlan=meuUid&&relogio?.row?{key:`${roomId}:${ficha.edicao}:${ficha.seed}:${meuUid}`,uid:meuUid,step,minute:liveMin,running:relogio.row.running,duration:relogio.row.duration_ms,hasMatch:jogosDoPasso(mundo,step).some(g=>isYou(g.h)||isYou(g.a)),enabled:tat.plansEnabled&&tat.pronto,rows:tat.planos,legacy:tat.minha,activePosture:qual?.(entrants.findIndex(e=>e.you),step)??'equilibrio',send:tat.enviarPlano}:undefined
  if(cupPilot)return <Campo2DDoPassoCtx.Provider value={doisDDoPasso(relogio?.row)}><TemaCompCtx.Provider value="liberta"><FootballLibertaCupView world={mundo} entrants={entrants} step={step} minute={liveMin} finished={liveDone} field={c2d} renderMatch={(g,pc)=>live(g.h,g.a,g.ev,pc)} transition={abertura} controls={controles} tactics={comTatica&&relogio?.row&&!!meuUid&&ficha.times.some(t=>t.uid===meuUid)&&step<=LIB.FINAL?<CartaoTaticaCopa plan={cupPlan} minha={tat.minha} podeEscolher={tat.podeEscolher} aviso={tat.aviso} onEscolher={t=>void tat.escolher(t)}/>:null} onClose={aoFechar} tournamentKey={`liberta:${roomId}:${ficha.seed}:${ficha.edicao}`} ceremony={<>
    {finalVista&&isYou(mundo.campeao)&&<CardCollectPrompt motivo="Libertadores" seasonKey={`libsala:${roomId}:${ficha.seed}:${ficha.edicao}`} origin="online"/>}
    {done && !festaVista && <FestaCampeao comp="liberta" nome={entrants[mundo.campeao].pais} crest={sel(mundo.campeao, 150)}
        mascote={ownerVisual ? MASCOTES[mascoteKeyDoTime(entrants[mundo.campeao].club) ?? ''] : undefined} lendas={ownerVisual ? entrants[mundo.campeao].xi.filter(c => c.fame >= 5).map(c => ({ nome: c.name, club: c.club, year: c.year })) : undefined} souCampeao={isYou(mundo.campeao)} souVice={isYou(mundo.final.h) || isYou(mundo.final.a)} onDone={() => { setFestaVista(true); try { sessionStorage.setItem(festaKey, '1') } catch { /* segue */ } }}
        artilheiro={(() => { const r = artilhariaLiberta(mundo)[0]; return r && r.goals > 0 ? { nome: r.name, time: entrants[r.team].pais, n: r.goals } : null })()}
        garcom={(() => { const r = garconsLiberta(mundo)[0]; return r && r.assists > 0 ? { nome: r.name, time: entrants[r.team].pais, n: r.assists } : null })()} />}
    {done&&<OwnerChampionBanner title={NOME} name={entrants[mundo.campeao].pais} crest={sel(mundo.campeao,52)} trophy={<Trofeu comp="liberta" size={160}/>} own={isYou(mundo.campeao)} legends={entrants[mundo.campeao].xi.filter(c=>c.fame>=5).map(c=>({nome:c.name,club:c.club,year:c.year}))} mascot={MASCOTES[mascoteKeyDoTime(entrants[mundo.campeao].club)??'']}/>}
  </>}/></TemaCompCtx.Provider></Campo2DDoPassoCtx.Provider>
  return (
    <Campo2DDoPassoCtx.Provider value={doisDDoPasso(relogio?.row)}>
    <TemaCompCtx.Provider value="liberta">
      <CompetitionStage kind="liberta" title={NOME.toUpperCase()} phase={etapa} detail={tr('8 grupos em turno e returno · ida e volta até a semi · final única', '8 groups home and away · two legs until the semis · one-off final')}>{abertura}</CompetitionStage>
      <GiroDaRodada cinema />
      {/* ⚔️ o cartão de tática — só pra quem tem clube nesta copa e enquanto ainda falta jogo (igual às regionais) */}
      {comTatica && relogio?.row && !!meuUid && ficha.times.some(t => t.uid === meuUid) && (cupFeatures ? relogio.row.step <= LIB.FINAL : relogio.row.step < LIB.FINAL) && <CartaoTaticaCopa plan={cupPlan} minha={tat.minha} podeEscolher={tat.podeEscolher} aviso={tat.aviso} onEscolher={t => void tat.escolher(t)} />}
      {/* FASE DE GRUPOS: o meu jogo ao vivo em cima, as 8 tabelas inteiras, os outros jogos da rodada */}
      {step >= 1 && step <= LIB.RODADAS && (() => {
        const rod = mundo.rodadas[rodadaAtual - 1]
        const meu = rod.find(j => isYou(j.h) || isYou(j.a))
        return <>
          {meu && live(meu.h, meu.a, meu.ev)}
          {controles}
          {grupos}
          <p style={{ ...OSWALD, fontWeight: 900, fontSize: 13, color: GOLD, margin: '4px 0 6px' }}>{tr('⚽ JOGOS DA RODADA', '⚽ MATCHES OF THE ROUND')} {rodadaAtual}</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 6, marginBottom: 10 }}>
            {rod.filter(j => j !== meu).map((j, k) => jogoLinha(j.h, j.a, j.ev, `r${k}`, liveDone ? tr('ENCERRADO', 'FULL TIME') : `${Math.min(90, liveMin)}′ · ${tr('AO VIVO', 'LIVE')}`))}
          </div>
          {step === LIB.RODADAS && liveDone && quadroFase('oitavas', mundo.ko[0].ties, false, false)}
        </>
      })()}
      {step === 0 && <>{controles}{grupos}</>}
      {/* MATA-MATA (ida e volta) */}
      {fase && (() => {
        const volta = (step - LIB.OIT_IDA) % 2 === 1
        const jogos = jogosDoPasso(mundo, step)
        const meu = jogos.find(j => isYou(j.h) || isYou(j.a))
        const ag = (j: (typeof jogos)[number]) => {
          if (!j.tie || !j.volta) return ''
          const g = golsAte(j.ev), t = j.tie
          // agregado do ponto de vista do mandante da VOLTA (t.a): ida (fora) + volta (casa)
          return `${tr('agregado', 'agg.')} ${t.ida.ga + golsDe(g, true)}×${t.ida.gh + golsDe(g, false)}`
        }
        return <>
          {meu && <>
            {meu.tie && volta && <p className="ll27-portao-aviso" style={{ marginBottom: 6 }}>{tr('Ida', '1st leg')}: {entrants[meu.tie.h].pais} {meu.tie.ida.gh}×{meu.tie.ida.ga} {entrants[meu.tie.a].pais} · <b>{ag(meu)}</b></p>}
            <Penaltis2D config={volta && meu.tie ? cfgPen2D(meu.h, meu.a, meu.tie.pen, `${meu.h}:${meu.a}`) : undefined} ativo={liveMin >= 93 && volta && !!meu.tie?.pen}>{pc => <>
              {live(meu.h, meu.a, meu.ev, pc)}
              {liveMin >= 93 && volta && meu.tie?.pen && blocoPen(meu.h, meu.a, meu.tie.pen, tr('AGREGADO EMPATADO — DECISÃO NOS PÊNALTIS', 'AGGREGATE LEVEL — DECIDED ON PENALTIES'), false, pc.estado)}
            </>}</Penaltis2D>
          </>}
          {controles}
          <p style={{ ...OSWALD, fontWeight: 900, fontSize: 13, color: GOLD, margin: '4px 0 6px' }}>{nomeFase(fase.tipo)} · {volta ? tr('VOLTA', '2ND LEG') : tr('IDA', '1ST LEG')}</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 6, marginBottom: 10 }}>
            {jogos.filter(j => j !== meu).map((j, i) => jogoLinha(j.h, j.a, j.ev, `k${i}`, `${liveDone ? tr('ENCERRADO', 'FULL TIME') : `${Math.min(90, liveMin)}′ · ${tr('AO VIVO', 'LIVE')}`}${volta ? ` · ${ag(j)}` : ` · ${tr('IDA', '1ST LEG')}`}`, volta ? j.tie?.pen : undefined))}
          </div>
          {quadroFase(fase.tipo, fase.ties, volta || liveDone, volta && liveDone)}
        </>
      })()}
      {/* PARADA ANTES DA FINAL */}
      {step === LIB.PAUSA && <>
        {controles}
        <div style={{ ...box('#0B0B0B'), color: '#F2E6C8', padding: 14, marginBottom: 10, textAlign: 'center' }}>
          <p style={{ ...OSWALD, fontWeight: 900, fontSize: 13, margin: '0 0 8px', color: OURO_LIB }}>{tr('🏆 A FINAL · JOGO ÚNICO', '🏆 THE FINAL · ONE-OFF')}</p>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, ...OSWALD, fontWeight: 900, fontSize: 15 }}>
            {sel(mundo.final.h, 40)} {entrants[mundo.final.h].pais} <span style={{ color: OURO_LIB }}>×</span> {entrants[mundo.final.a].pais} {sel(mundo.final.a, 40)}
          </div>
        </div>
      </>}
      {/* A FINAL */}
      {step === LIB.FINAL && (() => {
        const f = mundo.final
        return <>
          <Penaltis2D config={cfgPen2D(f.h, f.a, f.pen, 'final')} ativo={liveMin >= 93 && !!f.pen}>{pc => <>
            {live(f.h, f.a, f.ev, pc)}
            {liveMin >= 93 && f.pen && blocoPen(f.h, f.a, f.pen, `${f.g[0]}×${f.g[1]} ${tr('NO TEMPO NORMAL — DECISÃO NOS PÊNALTIS', 'AFTER 90 MINUTES — DECIDED ON PENALTIES')}`, true, pc.estado)}
          </>}</Penaltis2D>
          {controles}
        </>
      })()}
      {/* fases que já passaram, recolhidas */}
      {mundo.ko.map((f, i) => step > LIB.OIT_IDA + 2 * i + 1 && (
        <details key={f.tipo} className="ll26-bracket-history"><summary>{nomeFase(f.tipo)} · {tr('RESULTADOS', 'RESULTS')}</summary>{quadroFase(f.tipo, f.ties, true, true)}</details>
      ))}
      {step > LIB.RODADAS && <details className="ll26-bracket-history"><summary>{tr('FASE DE GRUPOS · AS 8 TABELAS', 'GROUP STAGE · ALL 8 TABLES')}</summary>{grupos}</details>}
      {done && controles}
      {/* CERIMÔNIA */}
      {finalVista && isYou(mundo.campeao) && <CardCollectPrompt
        motivo={tr('🏆 Campeão da Libertadores', '🏆 Libertadores champion')}
        seasonKey={`libsala:${roomId}:${ficha.seed}:${ficha.edicao}`} origin="online" />}
      {done && !festaVista && <FestaCampeao comp="liberta" nome={entrants[mundo.campeao].pais} crest={sel(mundo.campeao, 150)}
        mascote={ownerVisual ? MASCOTES[mascoteKeyDoTime(entrants[mundo.campeao].club) ?? ''] : undefined} lendas={ownerVisual ? entrants[mundo.campeao].xi.filter(c => c.fame >= 5).map(c => ({ nome: c.name, club: c.club, year: c.year })) : undefined} souCampeao={isYou(mundo.campeao)} souVice={isYou(mundo.final.h) || isYou(mundo.final.a)} onDone={() => { setFestaVista(true); try { sessionStorage.setItem(festaKey, '1') } catch { /* segue */ } }}
        artilheiro={(() => { const r = artilhariaLiberta(mundo)[0]; return r && r.goals > 0 ? { nome: r.name, time: entrants[r.team].pais, n: r.goals } : null })()}
        garcom={(() => { const r = garconsLiberta(mundo)[0]; return r && r.assists > 0 ? { nome: r.name, time: entrants[r.team].pais, n: r.assists } : null })()} />}
      {done && (() => {
        const c = mundo.campeao, fin = mundo.final
        const art = artilhariaLiberta(mundo).slice(0, 3)
        const linhaFinal = `${entrants[fin.h].pais} ${fin.g[0]}×${fin.g[1]} ${entrants[fin.a].pais}${fin.pen ? ` (${tr('pên.', 'pens')} ${fin.pen[0]}×${fin.pen[1]})` : ''}`
        return <>
          {ownerVisual ? <OwnerChampionBanner title={NOME} name={entrants[c].pais} crest={sel(c, 52)} trophy={<Trofeu comp="liberta" size={210} />} own={isYou(c)} legends={entrants[c].xi.filter(x => x.fame >= 5).map(x => ({ nome: x.name, club: x.club, year: x.year }))} mascot={MASCOTES[mascoteKeyDoTime(entrants[c].club) ?? '']} line={`${tr('Final', 'Final')}: ${linhaFinal}`} /> : (
          <div style={{ ...box(isYou(c) ? `linear-gradient(150deg,#FFE79A,${GOLD} 55%,#E8A200)` : '#fff'), color: INK, padding: 14, marginBottom: 10, textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 10 }}>{sel(c, 70)}<Trofeu comp="liberta" size={64} /></div>
            <p style={{ ...OSWALD, fontWeight: 900, fontSize: 19, margin: '6px 0 0', textTransform: 'uppercase' }}>{entrants[c].pais} {tr('CAMPEÃO DA LIBERTADORES!', 'LIBERTADORES CHAMPION!')}</p>
            <p style={{ fontSize: 11, fontWeight: 800, margin: '3px 0 0' }}>{isYou(c) ? tr('🎉 É VOCÊ! A glória eterna é sua.', '🎉 IT’S YOU! Eternal glory is yours.') : entrants[c].humano ? `${tr('Técnico', 'Manager')}: ${entrants[c].club}` : tr('Título da máquina 🤖', 'Won by the machine 🤖')}</p>
            <p style={{ fontSize: 9.5, fontWeight: 700, color: 'rgba(0,0,0,.55)', margin: '6px 0 0' }}>{tr('final', 'final')}: {linhaFinal}</p>
          </div>
          )}
          <ArtilheiroCopaCard titulo={tr('ARTILHEIRO DA LIBERTADORES', 'LIBERTADORES TOP SCORER')} linhas={art.map((r): ArtilheiroLinha => { const carta = entrants[r.team].xi.find(x => x.name === r.name); return { nome: r.name, clube: entrants[r.team].pais, carta: carta ? `${carta.club} ${carta.year}` : undefined, gols: r.goals, crest: sel(r.team, 40), meu: isYou(r.team) } })} />
        </>
      })()}
      <FraseCopa />
      <button className="ll31-back-room" onClick={aoFechar} style={{ width: '100%', border: `3px solid ${INK}`, borderRadius: 14, padding: 12, ...OSWALD, fontWeight: 900, fontSize: 14, background: done ? GREEN : '#fff', color: done ? '#fff' : INK, boxShadow: `4px 4px 0 0 ${INK}`, cursor: 'pointer' }}>{tr('VOLTAR À SALA', 'BACK TO THE ROOM')}</button>
    </TemaCompCtx.Provider>
    </Campo2DDoPassoCtx.Provider>
  )
}
