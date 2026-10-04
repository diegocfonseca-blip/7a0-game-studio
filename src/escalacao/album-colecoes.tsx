// 📚🤝 ÁLBUM: abas COLEÇÕES e TROCAS (04/10, mockup v2 aprovado com o Diego — "ok vamos fazer").
//
// Coleções: TODAS as cartas de um clube (com 11+ no baralho) fecham o time. No ÁLBUM só se olha; o
// "Receber" mora DENTRO da carreira, na Agência: o servidor marca uma cópia de cada carta como usada
// (esc_colecao_receber) e o reducer põe as moedas no caixa daquela carreira (COLECAO_RECEBIDA).
// A carta usada continua no álbum, escurecida, e não conta mais pra aquele clube.
// Trocas: proposta com até 3 cartas de cada lado + recado de até 120 letras, vale 48 h. Aceitar
// troca o dono no servidor, os dois lados de uma vez (esc_troca_responder).
// Tudo atrás de `useColecoesLiberadas()` — sem a trava, o álbum é o de sempre.
import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { useT } from './lang'
import { COLECOES, progressoDas, ordenaProgresso, escolheCopias, colecoesNovas, chaveCarta, clubeColecao, type MinhaCarta, type Progresso } from './colecoes'

const INK = '#0C0C0C', GOLD = '#FFC400', VERDE = '#1B7A3D', ROXO = '#7C3AED', VERM = '#E8503A'
const OSW = { fontFamily: 'Oswald, sans-serif', fontWeight: 700, textTransform: 'uppercase' as const }
const caixa = (extra: React.CSSProperties = {}): React.CSSProperties => ({ border: `3px solid ${INK}`, borderRadius: 16, background: '#fff', boxShadow: `3px 3px 0 ${INK}`, padding: '10px 12px', ...extra })
const botao = (bg: string, cor = INK, extra: React.CSSProperties = {}): React.CSSProperties => ({ ...OSW, display: 'block', width: '100%', textAlign: 'center', fontSize: 15, padding: '10px 8px', border: `3px solid ${INK}`, borderRadius: 14, boxShadow: `3px 3px 0 ${INK}`, background: bg, color: cor, cursor: 'pointer', ...extra })
const GRAD: Record<number, string> = {
  5: 'linear-gradient(150deg,#FFE79A,#FFC400 40%,#E8A200 70%,#FFDD70)',
  4: 'linear-gradient(150deg,#F4F7FB,#CBD4DE 45%,#9BA7B5 78%,#EAEFF4)',
  3: 'linear-gradient(150deg,#41C07A,#2E9E5B 55%,#1E7A45)',
  2: 'linear-gradient(150deg,#41C07A,#2E9E5B 55%,#1E7A45)',
  1: 'linear-gradient(150deg,#DBD1B5,#CBBF9E 60%,#B2A583)',
}

/** a linha de user_cards que as abas usam (uma linha = uma cópia) */
export type CartaDoAlbum = MinhaCarta & { pos: string; fame: number; usadaNome?: string | null }

// ─── carta pequena (chip) ──────────────────────────────────────────────────
function MiniCarta({ c, sel, onClick, selo, apagada }: { c: { name: string; club: string; year: number; pos: string; fame: number }; sel?: boolean; onClick?: () => void; selo?: ReactNode; apagada?: ReactNode }) {
  const claro = c.fame >= 4 || c.fame <= 1
  return (
    <button onClick={onClick} disabled={!onClick} style={{ position: 'relative', textAlign: 'left', border: `2.5px solid ${INK}`, borderRadius: 10, padding: '5px 7px', background: GRAD[c.fame] ?? GRAD[3], color: claro ? INK : '#fff', boxShadow: sel ? `0 0 0 3px ${ROXO}` : `2px 2px 0 ${INK}`, cursor: onClick ? 'pointer' : 'default', minWidth: 0, overflow: 'hidden' }}>
      <span style={{ ...OSW, fontSize: 9, background: INK, color: '#fff', borderRadius: 4, padding: '0 4px' }}>{c.pos}</span>
      <span style={{ ...OSW, display: 'block', fontSize: 12, lineHeight: 1.1, marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</span>
      <span style={{ display: 'block', fontSize: 9.5, opacity: .7, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.club} · {c.year}</span>
      {selo && <span style={{ position: 'absolute', top: 0, right: 0, ...OSW, fontSize: 10, background: ROXO, color: '#fff', padding: '0 5px', borderBottomLeftRadius: 8 }}>{selo}</span>}
      {apagada && <span style={{ position: 'absolute', inset: 0, background: 'rgba(40,40,40,.62)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', ...OSW, fontSize: 10, lineHeight: 1.15, padding: 4 }}>{apagada}</span>}
    </button>
  )
}

/** a carta que FALTA na coleção: tracejada, com o nome, pra pessoa saber o que caçar */
function Falta({ c }: { c: { name: string; club: string; year: number; pos: string } }) {
  return (
    <div style={{ border: '2.5px dashed rgba(0,0,0,.4)', borderRadius: 10, padding: '5px 7px', background: 'repeating-linear-gradient(135deg,#EDE4C8 0 6px,#E4D9B9 6px 12px)', color: 'rgba(0,0,0,.55)', minWidth: 0, overflow: 'hidden' }}>
      <span style={{ ...OSW, fontSize: 9, background: 'rgba(0,0,0,.35)', color: '#fff', borderRadius: 4, padding: '0 4px' }}>{c.pos}</span>
      <span style={{ ...OSW, display: 'block', fontSize: 12, lineHeight: 1.1, marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>? {c.name}</span>
      <span style={{ display: 'block', fontSize: 9.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.year}</span>
    </div>
  )
}

// ─── 📚 COLEÇÕES ───────────────────────────────────────────────────────────
// Dois lugares, a MESMA lista (04/10, Diego: "no álbum você vê e troca, na carreira você recebe"):
//  · modo 'album'   → só olhar: progresso, o que falta, o que já foi usado. Sem botão de receber.
//  · modo 'carreira'→ dentro da Agência: o botão "Receber" põe as moedas NESTA carreira, sem perguntar.
// Ordem: prontas primeiro, depois a mais completa (em %). Clube já recebido e que não está pronto de
// novo vai pro bloco "✔️ Já recebidas", no fim. Embaixo do clube, se tem repetida: "🔁 N repetidas".
type ModoLista = 'album' | 'carreira'

/** carrega as CÓPIAS da pessoa: cartas, quais foram usadas e quais estão presas numa troca aberta */
export function useMinhasCopias(ligado: boolean): { copias: CartaDoAlbum[] | null; recarregar: () => void } {
  const [copias, setCopias] = useState<CartaDoAlbum[] | null>(null)
  const [n, setN] = useState(0)
  useEffect(() => {
    if (!ligado) return
    let vivo = true
    if (import.meta.env.DEV && (() => { try { return localStorage.getItem('esc-colecoes-demo') === '1' } catch { return false } })()) {
      void import('./colecoes-demo').then(m => { if (vivo) setCopias(m.copiasDemo()) })
      return () => { vivo = false }
    }
    ;(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { if (vivo) setCopias([]); return }
        const [{ data: cs }, { data: us }, { data: tr2 }] = await Promise.all([
          supabase.from('user_cards').select('id, card_name, card_club, card_year, card_pos, card_fame').eq('user_id', user.id),
          supabase.from('esc_cartas_usadas').select('card_id, carreira_nome').eq('user_id', user.id),
          supabase.from('esc_trocas').select('de, de_cartas, para_cartas, expira_em').eq('status', 'aberta').or(`de.eq.${user.id},para.eq.${user.id}`),
        ])
        if (!vivo) return
        const usadas = new Map(((us ?? []) as { card_id: string; carreira_nome: string | null }[]).map(u => [u.card_id, u.carreira_nome ?? '']))
        const presas = new Set<string>()
        for (const x of (tr2 ?? []) as { de: string; de_cartas: string[]; para_cartas: string[]; expira_em: string }[]) {
          if (new Date(x.expira_em).getTime() <= Date.now()) continue
          for (const id of (x.de === user.id ? x.de_cartas : x.para_cartas)) presas.add(id)
        }
        setCopias(((cs ?? []) as { id: string; card_name: string; card_club: string; card_year: number; card_pos: string; card_fame: number }[]).map(c => ({
          id: c.id, name: c.card_name, club: c.card_club, year: c.card_year, pos: c.card_pos, fame: c.card_fame,
          usadaEm: usadas.has(c.id) ? 'sim' : null, usadaNome: usadas.get(c.id) ?? null, presa: presas.has(c.id),
        })))
      } catch { if (vivo) setCopias([]) }
    })()
    return () => { vivo = false }
  }, [ligado, n])
  return { copias, recarregar: () => setN(x => x + 1) }
}

function ListaColecoes({ minhas, modo, onReceber }: { minhas: CartaDoAlbum[]; modo: ModoLista; onReceber?: (p: Progresso, ids: string[]) => Promise<string> }) {
  const t = useT()
  const [aberta, setAberta] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [aviso, setAviso] = useState('')
  const novas = useMemo(() => colecoesNovas(), [])
  const lista = useMemo(() => ordenaProgresso(progressoDas(minhas)), [minhas])
  const ativas = lista.filter(p => p.pronta || p.recebidas === 0)
  const recebidas = lista.filter(p => !p.pronta && p.recebidas > 0)
  const prontas = lista.filter(p => p.pronta).length
  // 🎒 DIVERSOS: carta de clube que ainda não é coleção (menos de 11 no baralho). Fica guardada aqui e
  // muda de lugar sozinha no dia em que o clube chegar a 11 — a lista de coleções vem do baralho.
  const diversos = useMemo(() => {
    const clubes = new Set(COLECOES.filter(c => !c.especial).map(c => c.clube))
    const naEspecial = new Set(COLECOES.filter(c => c.especial).flatMap(c => c.cartas.map(chaveCarta)))
    const m = new Map<string, CartaDoAlbum[]>()
    for (const c of minhas) { if (clubes.has(clubeColecao(c.club)) || naEspecial.has(chaveCarta(c))) continue; const k = chaveCarta(c); const l = m.get(k); if (l) l.push(c); else m.set(k, [c]) }
    return [...m.entries()].sort((a, b) => a[1][0].club.localeCompare(b[1][0].club) || b[1][0].fame - a[1][0].fame)
  }, [minhas])
  async function receber(p: Progresso) {
    const ids = escolheCopias(minhas, p.colecao)
    if (!ids || !onReceber) return
    setBusy(p.colecao.clube); setAviso('')
    try { setAviso(await onReceber(p, ids)) } finally { setBusy(null) }
  }
  const Linha = ({ p }: { p: Progresso }) => {
    const c = p.colecao, aberto = aberta === c.clube
    const chavesDela = new Set(c.cartas.map(chaveCarta))
    const doClube = minhas.filter(m => chavesDela.has(chaveCarta(m)))
    const porChave = new Map<string, CartaDoAlbum[]>()
    for (const m of doClube) { const k = chaveCarta(m); const l = porChave.get(k); if (l) l.push(m); else porChave.set(k, [m]) }
    const livresCopias = doClube.filter(m => !m.usadaEm && !m.presa).length
    const repetidas = Math.max(0, livresCopias - p.livres)
    return (
      <div style={caixa({ marginBottom: 10, background: p.pronta ? 'linear-gradient(150deg,#FFF6D2,#FFE07A)' : '#fff' })}>
        <button onClick={() => setAberta(aberto ? null : c.clube)} style={{ all: 'unset', display: 'block', width: '100%', cursor: 'pointer' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <span style={{ ...OSW, fontSize: 17, lineHeight: 1.05 }}>{c.especial ? '🌟 ' : ''}{c.clube}{novas.has(c.clube) && <span style={{ ...OSW, fontSize: 10, background: VERM, color: '#fff', padding: '2px 7px', borderRadius: 999, border: `2px solid ${INK}`, marginLeft: 6, verticalAlign: 'middle' }}>{t('🆕 nasceu agora', '🆕 just born')}</span>}</span>
            <span style={{ ...OSW, fontSize: 11, padding: '3px 8px', border: `2px solid ${INK}`, borderRadius: 999, whiteSpace: 'nowrap', background: p.pronta ? VERDE : '#fff', color: p.pronta ? '#fff' : INK }}>{p.pronta ? '✅ ' : ''}{p.livres} {t('de', 'of')} {p.total}</span>
          </div>
          <div style={{ height: 11, border: `2px solid ${INK}`, borderRadius: 999, background: '#EFE6CC', margin: '7px 0 5px', overflow: 'hidden' }}><i style={{ display: 'block', height: '100%', width: `${(p.livres / p.total) * 100}%`, background: VERDE }} /></div>
          <p style={{ fontSize: 12, color: 'rgba(0,0,0,.72)' }}>
            {t('Prêmio', 'Prize')}: <b>{c.premio} 🪙</b>
            {p.recebidas > 0 && <> · {t(`recebida ${p.recebidas}x`, `collected ${p.recebidas}x`)}</>}
            {' · '}{aberto ? t('fechar ▲', 'close ▲') : t('ver cartas ▼', 'see cards ▼')}
          </p>
          {repetidas > 0 && <p style={{ fontSize: 11.5, color: ROXO, fontWeight: 700, marginTop: 3 }}>{modo === 'carreira' ? t(`🔁 você tem ${repetidas} repetida${repetidas > 1 ? 's' : ''} do ${c.clube} · troque no Álbum`, `🔁 you have ${repetidas} duplicate${repetidas > 1 ? 's' : ''} of ${c.clube} · trade them in the Album`) : t(`🔁 ${repetidas} repetida${repetidas > 1 ? 's' : ''} · dá pra trocar na aba Trocas`, `🔁 ${repetidas} duplicate${repetidas > 1 ? 's' : ''} · trade them in the Trades tab`)}</p>}
        </button>
        {aberto && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 6, marginTop: 9 }}>
            {c.cartas.map(cb => {
              const copias = porChave.get(chaveCarta(cb))
              if (!copias) return <Falta key={chaveCarta(cb)} c={cb} />
              const livres = copias.filter(x => !x.usadaEm && !x.presa).length
              const usada = copias.find(x => x.usadaEm)
              return <MiniCarta key={chaveCarta(cb)} c={copias[0]} selo={copias.length > 1 ? `x${copias.length}` : undefined}
                apagada={livres === 0 ? (usada ? <>{t('usada', 'used')}<br />{usada.usadaNome ?? ''}</> : t('em troca', 'in a trade')) : undefined} />
            })}
          </div>
        )}
        {p.pronta && modo === 'carreira' && <button disabled={busy !== null} style={botao(GOLD, INK, { marginTop: 10, opacity: busy ? .6 : 1 })} onClick={() => void receber(p)}>{busy === c.clube ? t('Recebendo…', 'Collecting…') : t(`🪙 Receber ${c.premio} moedas`, `🪙 Collect ${c.premio} coins`)}</button>}
        {p.pronta && modo === 'album' && <p style={{ ...OSW, fontSize: 12, color: VERDE, marginTop: 8 }}>{t('✅ Pronta! Receba as moedas dentro da carreira, na Agência', '✅ Ready! Collect the coins inside the career, in the Agency')}</p>}
      </div>
    )
  }
  return (
    <div>
      <p style={{ fontSize: 12, color: 'rgba(0,0,0,.65)', margin: '0 2px 10px' }}>
        {t(`Junte TODAS as cartas de um clube pra fechar · ${COLECOES.length} clubes · ${prontas} pronta${prontas === 1 ? '' : 's'} pra receber`,
          `Collect ALL the cards of a club to complete it · ${COLECOES.length} clubs · ${prontas} ready to collect`)}
      </p>
      {aviso && <p role="status" style={{ ...caixa({ background: '#FFF3C4', marginBottom: 10 }), fontSize: 13 }}>{aviso}</p>}
      {ativas.map(p => <Linha key={p.colecao.clube} p={p} />)}
      {diversos.length > 0 && (
        <div style={caixa({ marginTop: 16, marginBottom: 10 })}>
          <button onClick={() => setAberta(aberta === '__diversos' ? null : '__diversos')} style={{ all: 'unset', display: 'block', width: '100%', cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <span style={{ ...OSW, fontSize: 17 }}>{t('🎒 Cartas Avulsas', '🎒 Loose Cards')}</span>
              <span style={{ ...OSW, fontSize: 11, padding: '3px 8px', border: `2px solid ${INK}`, borderRadius: 999 }}>{diversos.length} {t('cartas', 'cards')}</span>
            </div>
            <p style={{ fontSize: 12, color: 'rgba(0,0,0,.65)', marginTop: 5 }}>{t('Cartas de clubes que ainda não têm 11 no baralho. Quando o clube chegar a 11, ele vira coleção e essas cartas vão pra lá sozinhas.', 'Cards from clubs that do not have 11 in the deck yet. When the club reaches 11, it becomes a collection and these cards move there on their own.')}{' · '}{aberta === '__diversos' ? t('fechar ▲', 'close ▲') : t('ver cartas ▼', 'see cards ▼')}</p>
          </button>
          {aberta === '__diversos' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 6, marginTop: 9 }}>
              {diversos.map(([k, copias]) => <MiniCarta key={k} c={copias[0]} selo={copias.length > 1 ? `x${copias.length}` : undefined} />)}
            </div>
          )}
        </div>
      )}
      {recebidas.length > 0 && <>
        <p style={{ ...OSW, fontSize: 13, color: 'rgba(0,0,0,.55)', margin: '16px 2px 8px' }}>{t(`✔️ Já recebidas (${recebidas.length}) · pra receber de novo, junte o clube inteiro outra vez`, `✔️ Already collected (${recebidas.length}) · to collect again, gather the whole club once more`)}</p>
        {recebidas.map(p => <Linha key={p.colecao.clube} p={p} />)}
      </>}
    </div>
  )
}

/** 📖 aba do ÁLBUM (home): só olhar */
export function AbaColecoes({ minhas }: { minhas: CartaDoAlbum[] }) {
  return <ListaColecoes minhas={minhas} modo="album" />
}

/** 🕴️ dentro da CARREIRA (Agência): receber nesta carreira, sem perguntar qual.
 *  `onPago` é o dispatch do reducer (COLECAO_RECEBIDA) — o dinheiro entra no estado em memória. */
export function ColecoesDaCarreira({ seed, nome, onPago }: { seed: number; nome: string; onPago: (moedas: number, marca: string) => void }) {
  const t = useT()
  const { copias, recarregar } = useMinhasCopias(true)
  if (copias === null) return <p style={{ fontSize: 13, margin: '8px 2px' }}>{t('Carregando as coleções…', 'Loading collections…')}</p>
  return (
    <div style={{ margin: '4px 0 14px' }}>
      <p style={{ ...OSW, fontSize: 18, margin: '0 2px 2px' }}>{t('📚 Coleções de clubes', '📚 Club collections')}</p>
      <ListaColecoes minhas={copias} modo="carreira" onReceber={async (p, ids) => {
        const c = p.colecao
        const { error } = await supabase.rpc('esc_colecao_receber', { p_cards: ids, p_seed: String(seed), p_nome: nome, p_total: c.cartas.length, p_especial: !!c.especial })
        if (error) {
          const m = error.message ?? ''
          return /presa/.test(m) ? t('Uma dessas cartas está numa proposta de troca aberta. Cancele a proposta (Álbum → Trocas) ou espere ela acabar.', 'One of these cards is in an open trade offer. Cancel it (Album → Trades) or wait for it to end.')
            : /usada/.test(m) ? t('Uma dessas cartas já foi usada. A lista vai atualizar.', 'One of these cards was already used. The list will refresh.')
            : t('Não deu pra receber agora (internet?). Nada foi gasto — tente de novo.', 'Could not collect right now (connection?). Nothing was spent — try again.')
        }
        onPago(c.premio, `col:${c.clube}:${[...ids].sort()[0]}`)
        recarregar()
        return t(`✅ +${c.premio} 🪙 no caixa! As ${c.cartas.length} cartas do ${c.clube} ficaram marcadas como usadas nesta carreira.`, `✅ +${c.premio} 🪙 in your cash! The ${c.cartas.length} ${c.clube} cards are now marked as used in this career.`)
      }} />
    </div>
  )
}

// ─── 🤝 TROCAS ─────────────────────────────────────────────────────────────
type Troca = { id: number; de: string; para: string; de_nome: string | null; para_nome: string | null; de_cartas: string[]; para_cartas: string[]; recado: string | null; status: string; criada_em: string; expira_em: string }
type CartaInfo = { id: string; card_name: string; card_club: string; card_year: number; card_pos: string; card_fame: number; user_id: string }
const info2carta = (c: CartaInfo) => ({ name: c.card_name, club: c.card_club, year: c.card_year, pos: c.card_pos, fame: c.card_fame })
const STATUS: Record<string, [string, string]> = { aceita: ['✅ aceita', '✅ accepted'], recusada: ['✖️ recusada', '✖️ declined'], cancelada: ['🚫 cancelada', '🚫 cancelled'], contra: ['🔁 virou contraproposta', '🔁 countered'], vencida: ['⌛ venceu', '⌛ expired'] }

export function AbaTrocas({ meuId, meuNome, minhas, recarregar }: { meuId: string; meuNome: string; minhas: CartaDoAlbum[]; recarregar: () => void }) {
  const t = useT()
  const [sub, setSub] = useState<'recebidas' | 'enviadas' | 'nova'>('recebidas')
  const [trocas, setTrocas] = useState<Troca[] | null>(null)
  const [cartas, setCartas] = useState<Map<string, CartaInfo>>(new Map())
  const [rascunho, setRascunho] = useState<{ para: string; paraNome: string; dou: string[]; quero: string[]; origem?: number } | null>(null)
  const [aviso, setAviso] = useState('')
  async function carregar() {
    const { data } = await supabase.from('esc_trocas').select('*').or(`de.eq.${meuId},para.eq.${meuId}`).order('criada_em', { ascending: false }).limit(60)
    const lista = (data ?? []) as Troca[]
    setTrocas(lista)
    const ids = [...new Set(lista.flatMap(x => [...x.de_cartas, ...x.para_cartas]))]
    if (ids.length) {
      const { data: cs } = await supabase.from('user_cards').select('id, card_name, card_club, card_year, card_pos, card_fame, user_id').in('id', ids)
      setCartas(new Map(((cs ?? []) as CartaInfo[]).map(c => [c.id, c])))
    }
  }
  useEffect(() => { void carregar() }, [meuId]) // eslint-disable-line react-hooks/exhaustive-deps
  const vencida = (x: Troca) => x.status === 'aberta' && new Date(x.expira_em).getTime() <= Date.now()
  const recebidas = (trocas ?? []).filter(x => x.para === meuId)
  const enviadas = (trocas ?? []).filter(x => x.de === meuId)
  const abertasPraMim = recebidas.filter(x => x.status === 'aberta' && !vencida(x)).length
  async function responder(x: Troca, aceitar: boolean) {
    setAviso('')
    const { data, error } = await supabase.rpc('esc_troca_responder', { p_id: x.id, p_aceitar: aceitar })
    const r = data as { ok?: boolean; erro?: string } | null
    if (error || !r?.ok) setAviso(r?.erro === 'indisponivel' ? t('Uma das cartas não está mais disponível (foi usada ou trocada). A proposta foi cancelada.', 'One of the cards is no longer available (used or traded). The offer was cancelled.') : t('Não deu pra responder agora. Tente de novo.', 'Could not reply right now. Try again.'))
    else setAviso(aceitar ? t('✅ Troca feita! As cartas já trocaram de álbum.', '✅ Trade done! The cards have switched albums.') : t('Proposta recusada.', 'Offer declined.'))
    await carregar(); recarregar()
  }
  async function cancelar(x: Troca) {
    await supabase.rpc('esc_troca_cancelar', { p_id: x.id }); await carregar(); recarregar()
  }
  const LinhaTroca = ({ x, minha }: { x: Troca; minha: boolean }) => {
    const dou = (minha ? x.de_cartas : x.para_cartas).map(id => cartas.get(id)).filter(Boolean) as CartaInfo[]
    const recebo = (minha ? x.para_cartas : x.de_cartas).map(id => cartas.get(id)).filter(Boolean) as CartaInfo[]
    const st = vencida(x) ? 'vencida' : x.status
    return (
      <div style={caixa({ marginBottom: 10 })}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', ...OSW, fontSize: 13 }}>
          <span>{minha ? t(`Pro ${x.para_nome ?? 'técnico'}`, `To ${x.para_nome ?? 'manager'}`) : (x.de_nome ?? t('Técnico', 'Manager'))}</span>
          <span style={{ fontSize: 11, color: 'rgba(0,0,0,.5)' }}>{st === 'aberta' ? t('aberta', 'open') : t(...STATUS[st] ?? [st, st])}</span>
        </div>
        <p style={{ ...OSW, fontSize: 11, color: 'rgba(0,0,0,.5)', margin: '6px 0 4px' }}>{t('Você dá', 'You give')}</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 6 }}>{dou.map(c => <MiniCarta key={c.id} c={info2carta(c)} />)}</div>
        <p style={{ ...OSW, fontSize: 11, color: 'rgba(0,0,0,.5)', margin: '8px 0 4px' }}>{t('Você recebe', 'You get')}</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 6 }}>{recebo.map(c => <MiniCarta key={c.id} c={info2carta(c)} />)}</div>
        {x.recado && <p style={{ border: '3px dashed rgba(0,0,0,.3)', borderRadius: 12, padding: '7px 10px', fontSize: 12.5, marginTop: 8 }}>💬 “{x.recado}”</p>}
        {st === 'aberta' && !minha && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginTop: 9 }}>
            <button style={botao(VERDE, '#fff', { fontSize: 13 })} onClick={() => responder(x, true)}>{t('✅ Aceitar', '✅ Accept')}</button>
            <button style={botao(GOLD, INK, { fontSize: 13 })} onClick={() => { setRascunho({ para: x.de, paraNome: x.de_nome ?? '', dou: x.para_cartas, quero: x.de_cartas, origem: x.id }); setSub('nova') }}>{t('🔁 Contra', '🔁 Counter')}</button>
            <button style={botao('#fff', INK, { fontSize: 13 })} onClick={() => responder(x, false)}>{t('✖️ Recusar', '✖️ Decline')}</button>
          </div>
        )}
        {st === 'aberta' && minha && <button style={botao('#fff', INK, { fontSize: 13, marginTop: 9 })} onClick={() => cancelar(x)}>{t('🚫 Cancelar proposta', '🚫 Cancel offer')}</button>}
      </div>
    )
  }
  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        {(['recebidas', 'enviadas', 'nova'] as const).map(k => (
          <button key={k} onClick={() => { setSub(k); if (k !== 'nova') setRascunho(null) }} style={{ ...OSW, flex: 1, fontSize: 12.5, padding: '8px 4px', border: `3px solid ${INK}`, borderRadius: 12, background: sub === k ? GOLD : '#fff', boxShadow: sub === k ? `2px 2px 0 ${INK}` : 'none', cursor: 'pointer' }}>
            {k === 'recebidas' ? <>{t('📨 Recebidas', '📨 Received')}{abertasPraMim > 0 && <b style={{ marginLeft: 4, background: VERM, color: '#fff', borderRadius: 999, padding: '0 6px' }}>{abertasPraMim}</b>}</> : k === 'enviadas' ? t('📤 Enviadas', '📤 Sent') : t('➕ Nova', '➕ New')}
          </button>
        ))}
      </div>
      {aviso && <p role="status" style={{ ...caixa({ background: '#FFF3C4', marginBottom: 10 }), fontSize: 13 }}>{aviso}</p>}
      {trocas === null && sub !== 'nova' && <p style={{ fontSize: 13 }}>{t('Carregando…', 'Loading…')}</p>}
      {sub === 'recebidas' && trocas && (recebidas.length ? recebidas.map(x => <LinhaTroca key={x.id} x={x} minha={false} />) : <p style={{ fontSize: 13, color: 'rgba(0,0,0,.6)' }}>{t('Nenhuma proposta ainda. Quando alguém quiser trocar com você, aparece aqui.', 'No offers yet. When someone wants to trade with you, it shows up here.')}</p>)}
      {sub === 'enviadas' && trocas && (enviadas.length ? enviadas.map(x => <LinhaTroca key={x.id} x={x} minha />) : <p style={{ fontSize: 13, color: 'rgba(0,0,0,.6)' }}>{t('Você ainda não mandou proposta. Toque em ➕ Nova.', 'You have not sent any offer yet. Tap ➕ New.')}</p>)}
      {sub === 'nova' && <NovaTroca meuNome={meuNome} minhas={minhas} inicial={rascunho} onEnviada={async () => { setRascunho(null); setSub('enviadas'); setAviso(t('📨 Proposta enviada! Ela vale 48 horas.', '📨 Offer sent! It is valid for 48 hours.')); await carregar(); recarregar() }} />}
    </div>
  )
}

function NovaTroca({ meuNome, minhas, inicial, onEnviada }: { meuNome: string; minhas: CartaDoAlbum[]; inicial: { para: string; paraNome: string; dou: string[]; quero: string[]; origem?: number } | null; onEnviada: () => void }) {
  const t = useT()
  const [parceiros, setParceiros] = useState<{ user_id: string; nome: string }[] | null>(null)
  const [busca, setBusca] = useState('')
  const [achados, setAchados] = useState<{ user_id: string; nome: string }[] | null>(null)
  const [alvo, setAlvo] = useState<{ user_id: string; nome: string } | null>(inicial ? { user_id: inicial.para, nome: inicial.paraNome } : null)
  const [dele, setDele] = useState<CartaDoAlbum[] | null>(null)
  const [dou, setDou] = useState<string[]>(inicial?.dou ?? [])
  const [quero, setQuero] = useState<string[]>(inicial?.quero ?? [])
  const [recado, setRecado] = useState('')
  const [busy, setBusy] = useState(false)
  const [erro, setErro] = useState('')
  useEffect(() => { supabase.rpc('esc_troca_parceiros').then(({ data }) => setParceiros(((data ?? []) as { user_id: string; nome: string }[])), () => setParceiros([])) }, [])
  useEffect(() => {
    if (!alvo) { setDele(null); return }
    let vivo = true
    ;(async () => {
      const [{ data: cs }, { data: us }] = await Promise.all([
        supabase.from('user_cards').select('id, card_name, card_club, card_year, card_pos, card_fame').eq('user_id', alvo.user_id),
        supabase.from('esc_cartas_usadas').select('card_id').eq('user_id', alvo.user_id),
      ])
      if (!vivo) return
      const usadas = new Set(((us ?? []) as { card_id: string }[]).map(u => u.card_id))
      setDele(((cs ?? []) as { id: string; card_name: string; card_club: string; card_year: number; card_pos: string; card_fame: number }[])
        .filter(c => !usadas.has(c.id))
        .map(c => ({ id: c.id, name: c.card_name, club: c.card_club, year: c.card_year, pos: c.card_pos, fame: c.card_fame })))
    })()
    return () => { vivo = false }
  }, [alvo])
  // o que falta nas MINHAS coleções: clube colecionável + jogador que eu não tenho livre
  const meusLivres = useMemo(() => new Set(minhas.filter(m => !m.usadaEm && !m.presa).map(chaveCarta)), [minhas])
  const clubesColec = useMemo(() => new Set(COLECOES.map(c => c.clube)), [])
  const faltaPraMim = (c: { name: string; club: string; year: number }) => clubesColec.has(c.club) && !meusLivres.has(chaveCarta(c))
  const minhasLivres = useMemo(() => {
    const n = new Map<string, number>()
    for (const m of minhas) if (!m.usadaEm && !m.presa) n.set(chaveCarta(m), (n.get(chaveCarta(m)) ?? 0) + 1)
    return minhas.filter(m => !m.usadaEm && !m.presa).map(m => ({ m, copias: n.get(chaveCarta(m)) ?? 1 })).sort((a, b) => b.copias - a.copias || b.m.fame - a.m.fame || a.m.name.localeCompare(b.m.name))
  }, [minhas])
  const toggle = (lista: string[], set: (l: string[]) => void, id: string) => set(lista.includes(id) ? lista.filter(x => x !== id) : lista.length >= 3 ? lista : [...lista, id])
  async function buscar() {
    if (busca.trim().length < 3) { setAchados([]); return }
    const { data } = await supabase.rpc('esc_troca_buscar', { p_txt: busca.trim() })
    setAchados((data ?? []) as { user_id: string; nome: string }[])
  }
  async function enviar() {
    if (!alvo || !dou.length || !quero.length) return
    setBusy(true); setErro('')
    const { error } = await supabase.rpc('esc_troca_propor', { p_para: alvo.user_id, p_dou: dou, p_quero: quero, p_recado: recado, p_de_nome: meuNome, p_para_nome: alvo.nome, p_origem: inicial?.origem ?? null })
    setBusy(false)
    if (error) {
      const m = error.message ?? ''
      setErro(/presa/.test(m) ? t('Uma dessas cartas já está noutra proposta aberta.', 'One of these cards is already in another open offer.')
        : /usada/.test(m) ? t('Carta usada numa coleção não pode ser trocada.', 'A card used in a collection cannot be traded.')
        : /muitas/.test(m) ? t('Você já tem 20 propostas abertas. Espere alguma acabar.', 'You already have 20 open offers. Wait for one to end.')
        : t('Não deu pra mandar agora. Confira as cartas e tente de novo.', 'Could not send right now. Check the cards and try again.'))
      return
    }
    onEnviada()
  }
  if (!alvo) return (
    <div>
      <p style={{ ...OSW, fontSize: 12, color: 'rgba(0,0,0,.55)', marginBottom: 6 }}>{t('Com quem?', 'With whom?')}</p>
      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        <input value={busca} onChange={e => setBusca(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') void buscar() }} placeholder={t('🔎 Buscar pelo nome do time…', '🔎 Search by team name…')} style={{ flex: 1, minWidth: 0, border: `3px solid ${INK}`, borderRadius: 12, padding: '8px 10px', fontSize: 14 }} />
        <button onClick={() => void buscar()} style={{ ...OSW, border: `3px solid ${INK}`, borderRadius: 12, background: GOLD, padding: '0 12px', cursor: 'pointer' }}>{t('Buscar', 'Search')}</button>
      </div>
      {(achados ?? parceiros ?? []).map(p => (
        <button key={p.user_id} onClick={() => { setAlvo(p); setDou([]); setQuero([]) }} style={{ ...caixa({ display: 'block', width: '100%', textAlign: 'left', marginBottom: 8, boxShadow: 'none', cursor: 'pointer' }) }}>
          <b style={{ ...OSW, fontSize: 14 }}>{p.nome}</b>
          <span style={{ display: 'block', fontSize: 11, color: 'rgba(0,0,0,.6)' }}>{achados ? t('achado na busca', 'found in search') : t('jogou com você', 'played with you')}</span>
        </button>
      ))}
      {parceiros !== null && !achados && parceiros.length === 0 && <p style={{ fontSize: 12.5, color: 'rgba(0,0,0,.6)' }}>{t('Quem jogou sala com você aparece aqui. Ou busque pelo nome do time.', 'People who played a room with you show up here. Or search by team name.')}</p>}
      {achados && achados.length === 0 && <p style={{ fontSize: 12.5, color: 'rgba(0,0,0,.6)' }}>{t('Ninguém com esse nome. Escreva pelo menos 3 letras do time.', 'Nobody with that name. Type at least 3 letters of the team.')}</p>}
    </div>
  )
  const deleOrdenado = (dele ?? []).slice().sort((a, b) => Number(faltaPraMim(b)) - Number(faltaPraMim(a)) || b.fame - a.fame)
  return (
    <div>
      <div style={{ ...OSW, background: ROXO, color: '#fff', borderRadius: 12, padding: '7px 10px', fontSize: 13, marginBottom: 10, display: 'flex', justifyContent: 'space-between', gap: 8 }}>
        <span>{t(`🤝 Proposta pro ${alvo.nome}`, `🤝 Offer to ${alvo.nome}`)}</span>
        {!inicial && <button onClick={() => setAlvo(null)} style={{ all: 'unset', cursor: 'pointer', textDecoration: 'underline', fontSize: 11 }}>{t('trocar', 'change')}</button>}
      </div>
      <p style={{ ...OSW, fontSize: 12, color: 'rgba(0,0,0,.55)', marginBottom: 6 }}>{t(`Você recebe (até 3) · ${quero.length} escolhida${quero.length === 1 ? '' : 's'}`, `You get (up to 3) · ${quero.length} picked`)}</p>
      {dele === null ? <p style={{ fontSize: 13 }}>{t('Carregando as cartas dele…', 'Loading their cards…')}</p> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 6, maxHeight: 260, overflowY: 'auto', padding: 3 }}>
          {deleOrdenado.map(c => <MiniCarta key={c.id} c={c} sel={quero.includes(c.id)} onClick={() => toggle(quero, setQuero, c.id)} selo={faltaPraMim(c) ? t('falta', 'need') : undefined} />)}
          {deleOrdenado.length === 0 && <p style={{ gridColumn: '1/-1', fontSize: 12.5 }}>{t('Ele não tem carta livre pra trocar.', 'They have no free card to trade.')}</p>}
        </div>
      )}
      <p style={{ ...OSW, fontSize: 12, color: 'rgba(0,0,0,.55)', margin: '12px 0 6px' }}>{t(`Você dá (até 3) · ${dou.length} escolhida${dou.length === 1 ? '' : 's'}`, `You give (up to 3) · ${dou.length} picked`)}</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 6, maxHeight: 260, overflowY: 'auto', padding: 3 }}>
        {minhasLivres.map(({ m, copias }) => <MiniCarta key={m.id} c={m} sel={dou.includes(m.id)} onClick={() => toggle(dou, setDou, m.id)} selo={copias > 1 ? `x${copias}` : undefined} />)}
      </div>
      <textarea value={recado} maxLength={120} onChange={e => setRecado(e.target.value)} placeholder={t('💬 Recado (até 120 letras)', '💬 Message (up to 120 characters)')} style={{ width: '100%', marginTop: 10, border: '3px dashed rgba(0,0,0,.35)', borderRadius: 12, padding: '8px 10px', fontSize: 13, minHeight: 56 }} />
      {erro && <p role="alert" style={{ fontSize: 12.5, color: VERM, fontWeight: 700, marginTop: 6 }}>{erro}</p>}
      <button disabled={busy || !dou.length || !quero.length} onClick={enviar} style={botao(ROXO, '#fff', { marginTop: 10, opacity: busy || !dou.length || !quero.length ? .55 : 1 })}>{busy ? t('Mandando…', 'Sending…') : inicial?.origem ? t('🔁 Mandar contraproposta', '🔁 Send counter-offer') : t('📨 Mandar proposta', '📨 Send offer')}</button>
      <p style={{ fontSize: 11.5, color: 'rgba(0,0,0,.6)', marginTop: 6 }}>{t('A proposta vale 48 horas. Nada sai do seu álbum até o outro aceitar. Carta usada numa coleção não entra.', 'The offer lasts 48 hours. Nothing leaves your album until they accept. Cards used in a collection cannot be traded.')}</p>
    </div>
  )
}
