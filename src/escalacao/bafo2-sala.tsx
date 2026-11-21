// ─── 🃏 BAFO NOVO · a SALA DE ESPERA e a CONVOCAÇÃO ─────────────────────────────────────────────────────────────────
//
// Tudo que acontece ANTES da liga (Diego, 21/11): as regras em cima, quem está apto, e — quando o dono aperta começar — a
// convocação de 160 s na tela de TODO MUNDO ao mesmo tempo.
//
// Como viaja sem canal novo: cada um grava a própria linha em `room_players.bafo` (a sala de espera já escuta essa tabela):
//   { v: 2, n: quantas cartas, ok: fecha um time?, marks: ids marcados, pronto, conv: { t0 } (só na linha do DONO) }
// O relógio de cada aparelho conta a partir de QUANDO ELE VIU a convocação abrir (não depende do relógio do celular de ninguém).
// Quem fecha é o DONO: ele relê a sala, monta os 22 de cada um pela MESMA conta (`fechaConvocacao`) e larga a liga. O banco
// confere a posse de cada carta antes de aceitar (`bafo2_fecha`).
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../lib/supabase'
import { tr, getLang } from './lang'
import type { FormationKey } from './types'
import { fechaConvocacao, BAFO2_CONVOCA_SEG, BAFO2_ELENCO, BAFO2_MIN, type CartaBafo } from './bafo2'
import { FaltamCartasBafo, RegrasBafo, ConvocacaoBafo, AberturaBafo, ExemploBafo, BAFO2_ABRE_PACOTE_MS, useColecaoBafo, carregaColecao, NEED_BAFO } from './bafo2-ui'

export interface BafoLinha { v: 2; n: number; ok: boolean; marks?: string[]; pronto?: boolean; conv?: { t0: number } | null }
export interface BafoJogador { user_id: string; manager_name: string; bafo?: BafoLinha | null }
/** os 22 de cada um, prontos pra largada: as cartas (id = id no banco) e a formação que o elenco fecha */
export type BafoSquads = Record<string, { f: FormationKey; cartas: CartaBafo[] }>
export const ehBafoLinha = (b: unknown): b is BafoLinha => !!b && typeof b === 'object' && (b as { v?: number }).v === 2
export const bafoApto = (p: { bafo?: unknown }): boolean => ehBafoLinha(p.bafo) && p.bafo.ok
const ABERTURA_MS = BAFO2_ABRE_PACOTE_MS // 🎁 o pacote abrindo: o relógio da convocação só conta DEPOIS (igual em todo aparelho)
const GRACA = 4 // segundos depois do zero antes de o dono fechar (dá tempo de a última gravação de cada um chegar)

export function BafoSala({ roomId, meuUid, donoUid, players, valendo, onLargar }: {
  roomId: string; meuUid: string; donoUid: string; players: BafoJogador[]; valendo: boolean
  /** o dono fechou a convocação: a sala larga a liga com estes elencos. Devolve false se a largada falhou. */
  onLargar: (squads: BafoSquads) => Promise<boolean>
}) {
  const { cartas, erro, pode } = useColecaoBafo(meuUid)
  const souDono = meuUid === donoUid
  const [marks, setMarks] = useState<string[]>([])
  const [pronto, setPronto] = useState(false)
  const [aviso, setAviso] = useState('')
  const [agora, setAgora] = useState(Date.now())
  useEffect(() => { const i = window.setInterval(() => setAgora(Date.now()), 500); return () => window.clearInterval(i) }, [])

  const conv = (() => { const b = players.find(p => p.user_id === donoUid)?.bafo; return ehBafoLinha(b) ? b.conv ?? null : null })()
  const convRef = useRef(conv); convRef.current = conv
  // ⏱️ quando ESTE aparelho viu a convocação abrir (lembrado na aba, pra um F5 não ganhar 120 s de novo)
  const visto = useRef<{ t0: number; em: number } | null>(null)
  if (conv && visto.current?.t0 !== conv.t0) {
    const k = `bafo2-conv-${roomId}-${conv.t0}`
    let em = Date.now() + ABERTURA_MS // 🎁 a abertura vem antes: os 160 s começam quando a lista aparece
    try { const g = Number(sessionStorage.getItem(k)); if (g > 0) em = g; else sessionStorage.setItem(k, String(em)) } catch { /* sem armazenamento: conta daqui */ }
    visto.current = { t0: conv.t0, em }
  }
  const seg = conv && visto.current ? Math.min(BAFO2_CONVOCA_SEG, BAFO2_CONVOCA_SEG - Math.floor((agora - visto.current.em) / 1000)) : 0
  // 🎁 quanto da abertura já passou neste aparelho (negativo = ainda nela). Toque pula só a CENA; o relógio não anda mais cedo pra ninguém.
  const [pulou, setPulou] = useState(0)
  const naAbertura = !!conv && !!visto.current && pulou !== conv.t0 && agora < visto.current.em
  const decorridoAbertura = visto.current ? ABERTURA_MS - (visto.current.em - agora) : 0
  const convAtiva = !!conv && seg > -25

  // ── a MINHA linha na sala (sempre a foto inteira; a `conv` do dono nunca se perde numa regravação) ──
  const estado = useRef({ marks, pronto }); estado.current = { marks, pronto }
  const grava = useCallback(async (extra?: Partial<BafoLinha>) => {
    if (!cartas) return
    const linha: BafoLinha = { v: 2, n: cartas.length, ok: pode, marks: estado.current.marks, pronto: estado.current.pronto, ...(souDono ? { conv: convRef.current } : {}), ...extra }
    await supabase.from('room_players').update({ bafo: linha }).eq('room_id', roomId).eq('user_id', meuUid).then(() => {}, () => {})
  }, [cartas, pode, souDono, roomId, meuUid])
  // entrou na sala / carregou a coleção → diz quantas cartas tem e se está apto
  const registrado = useRef(false)
  useEffect(() => { if (cartas && !registrado.current) { registrado.current = true; void grava() } }, [cartas, grava])
  // convocação NOVA → todo mundo volta a "não pronto" (as marcas ficam, pra quem só quer repetir o time)
  const convT0 = conv?.t0 ?? 0
  useEffect(() => { if (convT0) { setPronto(false) } }, [convT0])
  // marcou/desmarcou → grava depois de 3 s parado (cada gravação acorda a lista da sala em todo aparelho — nada de rajada)
  const sujo = useRef(false)
  useEffect(() => {
    if (!convAtiva || !sujo.current) return
    const t = window.setTimeout(() => { sujo.current = false; void grava() }, 3000)
    return () => window.clearTimeout(t)
  }, [marks, convAtiva, grava])
  // faltando 3 s, a última foto das marcas vai de qualquer jeito
  const flush = useRef(0)
  useEffect(() => { if (convAtiva && seg <= 3 && seg > -2 && flush.current !== convT0) { flush.current = convT0; sujo.current = false; void grava() } }, [convAtiva, seg, convT0, grava])

  // ── o DONO fecha: todo mundo apto já está pronto, ou o tempo acabou ──
  const fechando = useRef(0)
  useEffect(() => {
    if (!souDono || !conv || !convAtiva || fechando.current === conv.t0 || !cartas) return
    const aptos = players.filter(bafoApto)
    const todosProntos = aptos.length >= 2 && aptos.every(p => (p.bafo as BafoLinha).pronto)
    if (!todosProntos && seg > -GRACA) return
    fechando.current = conv.t0
    void (async () => {
      const cancela = async (msg: string) => { setAviso(msg); convRef.current = null; await grava({ conv: null, pronto: false }) }
      try {
        const { data } = await supabase.from('room_players').select('user_id, manager_name, bafo').eq('room_id', roomId)
        const linhas = ((data ?? []) as BafoJogador[]).filter(bafoApto)
        const squads: BafoSquads = {}
        for (const p of linhas) {
          const col = p.user_id === meuUid ? cartas : await carregaColecao(p.user_id)
          const r = fechaConvocacao((p.bafo as BafoLinha).marks ?? [], col, NEED_BAFO)
          if (r && r.cartas.length >= BAFO2_MIN) squads[p.user_id] = { f: r.formacao, cartas: r.cartas }
        }
        if (Object.keys(squads).length < 2) { await cancela(tr('O Bafo precisa de 2 pessoas com time fechado. A convocação foi cancelada — chame mais gente e comece de novo.', 'Bafo needs 2 people with a full team. The call-up was cancelled — bring more people and start again.')); return }
        const ok = await onLargar(squads)
        if (!ok) await cancela(tr('Não deu pra começar o Bafo agora (a internet oscilou ou alguma carta mudou de dono). Nenhuma carta foi mexida — comece de novo.', 'Could not start the Bafo now (connection hiccup or a card changed owner). No card was touched — start again.'))
      } catch {
        await cancela(tr('Não deu pra fechar a convocação (a internet oscilou). Comece de novo.', 'Could not close the call-up (connection hiccup). Start again.'))
      }
    })()
  }, [souDono, conv, convAtiva, seg, players, cartas, roomId, meuUid, onLargar, grava])

  const en = getLang() === 'en'
  const aptos = players.filter(bafoApto)
  const caixaAviso = (bg: string, filho: React.ReactNode) => <div style={{ background: bg, border: '3px solid #0C0C0C', borderRadius: 14, boxShadow: '3px 3px 0 #0C0C0C', padding: '9px 12px', color: '#0C0C0C', fontSize: 12.5, fontWeight: 700, lineHeight: 1.35, marginTop: 10 }}>{filho}</div>

  if (convAtiva && conv) {
    if (!cartas) return caixaAviso('#FFF6D6', tr('🃏 Carregando as suas cartas…', '🃏 Loading your cards…'))
    if (!pode) return caixaAviso('#FFE3DC', tr(`🃏 A convocação está rolando (${Math.max(0, seg)}s). Você ainda não tem ${BAFO2_MIN} cartas que fechem um time — fica assistindo desta vez.`, `🃏 The call-up is on (${Math.max(0, seg)}s). You don't have ${BAFO2_MIN} cards that make a team yet — you watch this one.`))
    // 📄 21/11 (Diego, 1º teste: "deveria abrir uma nova tela… uma página nova"): a convocação é uma PÁGINA própria, por cima da
    // sala de espera — sai sozinha quando a liga larga (ou a convocação é cancelada).
    return createPortal(
      <div style={{ position: 'fixed', inset: 0, zIndex: 4000, background: '#0d1410', overflowY: 'auto', padding: '10px 10px 24px' }}>
       <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <p style={{ fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase', fontWeight: 900, fontSize: 19, color: '#FFC400', margin: '2px 2px 8px' }}>🃏 {tr('Bafo · convocação', 'Bafo · call-up')}</p>
        {naAbertura ? <AberturaBafo decorrido={decorridoAbertura} onPular={() => setPulou(conv.t0)} /> : <>
        <ExemploBafo />
        <ConvocacaoBafo telaCheia colecao={cartas} marcadas={marks} seg={Math.max(0, seg)} pronto={pronto}
          onMarcar={ids => { sujo.current = true; setMarks(ids) }}
          onPronto={() => { setPronto(true); estado.current = { marks, pronto: true }; sujo.current = false; void grava({ pronto: true }) }} />
        {caixaAviso('#fff', <>{aptos.filter(p => (p.bafo as BafoLinha).pronto).length}/{aptos.length} {tr('prontos', 'ready')} · {seg <= 0 ? tr('fechando a convocação…', 'closing the call-up…') : tr('quando todo mundo ficar pronto, começa na hora', 'when everyone is ready it starts right away')}</>)}
        </>}
       </div>
      </div>, document.body)
  }
  return (
    <div>
      <RegrasBafo valendo={valendo} nPessoas={aptos.length} />
      {aviso && caixaAviso('#FFE3DC', <>⚠️ {aviso}</>)}
      {erro ? caixaAviso('#FFE3DC', tr('Não deu pra ler as suas cartas agora. Saia e entre na sala de novo.', 'Could not read your cards now. Leave and rejoin the room.'))
        : !cartas ? caixaAviso('#FFF6D6', tr('🃏 Conferindo as suas cartas…', '🃏 Checking your cards…'))
        : pode ? caixaAviso('#EAF4EC', en ? <>✅ You have <b>{cartas.length} cards</b> and they make a team: you're in. When the owner starts, you get {BAFO2_CONVOCA_SEG}s to pick your {BAFO2_ELENCO}.</> : <>✅ Você tem <b>{cartas.length} cartas</b> e elas fecham um time: está apto. Quando o dono começar, você tem {BAFO2_CONVOCA_SEG} s pra escolher os seus {BAFO2_ELENCO}.</>)
        : <FaltamCartasBafo uid={meuUid} />}
    </div>
  )
}
