// 📚🤝 ÁLBUM: abas COLEÇÕES e TROCAS (04/10, mockup v2 aprovado com o Diego — "ok vamos fazer").
//
// Coleções: TODAS as cartas de um clube (com 11+ no baralho) fecham o time. "Receber" pergunta a carreira, o
// servidor marca as 11 como usadas (esc_colecao_receber) e o aparelho põe as moedas no caixa dela
// (creditaColecao). A carta usada continua no álbum, escurecida, e não conta mais pra aquele clube.
// Trocas: proposta com até 3 cartas de cada lado + recado de até 120 letras, vale 48 h. Aceitar
// troca o dono no servidor, os dois lados de uma vez (esc_troca_responder).
// Tudo atrás de `useColecoesLiberadas()` — sem a trava, o álbum é o de sempre.
import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { useT } from './lang'
import { COLECOES, progressoDas, ordenaProgresso, escolheCopias, colecoesNovas, chaveCarta, type MinhaCarta, type Progresso } from './colecoes'
import { creditaColecao, carreirasParaReceber, type CarreiraParaReceber } from './store'

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
const PENDENTE_KEY = 'esc-colecao-pendente'
type Pendente = { seed: number; moedas: number; marca: string }
function lePendentes(): Pendente[] { try { return JSON.parse(localStorage.getItem(PENDENTE_KEY) || '[]') as Pendente[] } catch { return [] } }
function gravaPendentes(l: Pendente[]) { try { if (l.length) localStorage.setItem(PENDENTE_KEY, JSON.stringify(l)); else localStorage.removeItem(PENDENTE_KEY) } catch { /* ignora */ } }

export function AbaColecoes({ minhas, recarregar }: { minhas: CartaDoAlbum[]; recarregar: () => void }) {
  const t = useT()
  const [aberta, setAberta] = useState<string | null>(null)
  const [receber, setReceber] = useState<Progresso | null>(null)
  const [aviso, setAviso] = useState('')
  const novas = useMemo(() => colecoesNovas(), [])
  // 🛟 moeda que ficou pra trás (cartas marcadas, mas o aparelho não conseguiu gravar): tenta de novo
  useEffect(() => {
    const p = lePendentes(); if (!p.length) return
    gravaPendentes(p.filter(x => !creditaColecao(x.seed, x.moedas, x.marca)))
  }, [])
  const lista = useMemo(() => ordenaProgresso(progressoDas(minhas)), [minhas])
  const prontas = lista.filter(p => p.pronta).length
  return (
    <div>
      <p style={{ fontSize: 12, color: 'rgba(0,0,0,.65)', margin: '0 2px 10px' }}>
        {t(`Junte TODAS as cartas de um clube pra fechar · ${COLECOES.length} clubes · ${prontas} pronta${prontas === 1 ? '' : 's'} pra receber`,
          `Collect ALL the cards of a club to complete it · ${COLECOES.length} clubs · ${prontas} ready to collect`)}
      </p>
      {aviso && <p role="status" style={{ ...caixa({ background: '#FFF3C4', marginBottom: 10 }), fontSize: 13 }}>{aviso}</p>}
      {lista.map(p => {
        const c = p.colecao, aberto = aberta === c.clube
        const doClube = minhas.filter(m => m.club === c.clube)
        const porChave = new Map<string, CartaDoAlbum[]>()
        for (const m of doClube) { const k = chaveCarta(m); const l = porChave.get(k); if (l) l.push(m); else porChave.set(k, [m]) }
        return (
          <div key={c.clube} style={caixa({ marginBottom: 10, background: p.pronta ? 'linear-gradient(150deg,#FFF6D2,#FFE07A)' : '#fff' })}>
            <button onClick={() => setAberta(aberto ? null : c.clube)} style={{ all: 'unset', display: 'block', width: '100%', cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <span style={{ ...OSW, fontSize: 17, lineHeight: 1.05 }}>{c.clube}{novas.has(c.clube) && <span style={{ ...OSW, fontSize: 10, background: VERM, color: '#fff', padding: '2px 7px', borderRadius: 999, border: `2px solid ${INK}`, marginLeft: 6, verticalAlign: 'middle' }}>{t('🆕 nasceu agora', '🆕 just born')}</span>}</span>
                <span style={{ ...OSW, fontSize: 11, padding: '3px 8px', border: `2px solid ${INK}`, borderRadius: 999, whiteSpace: 'nowrap', background: p.pronta ? VERDE : '#fff', color: p.pronta ? '#fff' : INK }}>{p.pronta ? '✅ ' : ''}{p.livres} {t('de', 'of')} {p.total}</span>
              </div>
              <div style={{ height: 11, border: `2px solid ${INK}`, borderRadius: 999, background: '#EFE6CC', margin: '7px 0 5px', overflow: 'hidden' }}><i style={{ display: 'block', height: '100%', width: `${(p.livres / p.total) * 100}%`, background: VERDE }} /></div>
              <p style={{ fontSize: 12, color: 'rgba(0,0,0,.72)' }}>
                {t('Prêmio', 'Prize')}: <b>{c.premio} 🪙</b>
                {p.recebidas > 0 && <> · {t(`recebida ${p.recebidas}x`, `collected ${p.recebidas}x`)}</>}
                {' · '}{aberto ? t('fechar ▲', 'close ▲') : t('ver cartas ▼', 'see cards ▼')}
              </p>
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
            {p.pronta && <button style={botao(GOLD, INK, { marginTop: 10 })} onClick={() => { setAviso(''); setReceber(p) }}>{t(`🪙 Receber ${c.premio} moedas`, `🪙 Collect ${c.premio} coins`)}</button>}
          </div>
        )
      })}
      {receber && <ModalReceber p={receber} minhas={minhas} onFechar={() => setReceber(null)} onFeito={msg => { setReceber(null); setAviso(msg); recarregar() }} />}
    </div>
  )
}

function ModalReceber({ p, minhas, onFechar, onFeito }: { p: Progresso; minhas: CartaDoAlbum[]; onFechar: () => void; onFeito: (msg: string) => void }) {
  const t = useT()
  const carreiras = useMemo<CarreiraParaReceber[]>(() => carreirasParaReceber(), [])
  const [escolha, setEscolha] = useState<number | null>(carreiras[0]?.seed ?? null)
  const [busy, setBusy] = useState(false)
  const [erro, setErro] = useState('')
  const c = p.colecao
  async function confirmar() {
    const alvo = carreiras.find(x => x.seed === escolha)
    const ids = escolheCopias(minhas, c)
    if (!alvo || !ids) return
    setBusy(true); setErro('')
    try {
      const { error } = await supabase.rpc('esc_colecao_receber', { p_cards: ids, p_seed: String(alvo.seed), p_nome: alvo.nome, p_total: c.cartas.length })
      if (error) throw error
      const marca = `col:${c.clube}:${[...ids].sort()[0]}`
      if (!creditaColecao(alvo.seed, c.premio, marca)) {
        gravaPendentes([...lePendentes(), { seed: alvo.seed, moedas: c.premio, marca }])
        onFeito(t('As cartas foram marcadas, mas o aparelho está sem espaço pra gravar as moedas. Elas ficaram guardadas e entram sozinhas na próxima vez que você abrir o álbum.', 'The cards were marked, but this device is out of space to save the coins. They are kept and will be added the next time you open the album.'))
        return
      }
      onFeito(t(`✅ +${c.premio} 🪙 no caixa do ${alvo.nome}. As ${c.cartas.length} cartas do ${c.clube} ficaram marcadas como usadas lá.`, `✅ +${c.premio} 🪙 in ${alvo.nome}'s cash. The ${c.cartas.length} ${c.clube} cards are now marked as used there.`))
    } catch (e) {
      const m = String((e as { message?: string })?.message ?? '')
      setErro(/presa/.test(m) ? t('Uma dessas cartas está numa proposta de troca aberta. Cancele a proposta ou espere ela acabar.', 'One of these cards is in an open trade offer. Cancel the offer or wait for it to end.')
        : /usada/.test(m) ? t('Uma dessas cartas já foi usada. Atualize o álbum e tente de novo.', 'One of these cards was already used. Refresh the album and try again.')
        : t('Não deu pra receber agora (internet?). Nada foi gasto — tente de novo.', 'Could not collect right now (connection?). Nothing was spent — try again.'))
    } finally { setBusy(false) }
  }
  return (
    <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 80, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: 12 }} onClick={onFechar}>
      <div onClick={e => e.stopPropagation()} style={{ ...caixa({ background: '#F4ECD6', width: '100%', maxWidth: 460, maxHeight: '85vh', overflowY: 'auto', padding: 0 }) }}>
        <div style={{ ...OSW, background: ROXO, color: '#fff', textAlign: 'center', padding: '8px 10px', fontSize: 14 }}>{t(`🪙 Receber o ${c.clube} · ${c.premio} moedas`, `🪙 Collect ${c.clube} · ${c.premio} coins`)}</div>
        <div style={{ padding: 12 }}>
          {carreiras.length === 0 ? (
            <p style={{ fontSize: 13 }}>{t('Você ainda não tem carreira neste aparelho. Comece uma carreira e volte aqui pra receber — as cartas continuam guardadas.', 'You have no career on this device yet. Start a career and come back to collect — your cards stay saved.')}</p>
          ) : <>
            <p style={{ ...OSW, fontSize: 12, color: 'rgba(0,0,0,.55)', marginBottom: 6 }}>{t('Em qual carreira?', 'Which career?')}</p>
            {carreiras.map(x => (
              <button key={x.seed} onClick={() => setEscolha(x.seed)} style={{ ...caixa({ display: 'flex', alignItems: 'center', gap: 10, width: '100%', marginBottom: 8, background: escolha === x.seed ? '#FFF3C4' : '#fff', boxShadow: escolha === x.seed ? `3px 3px 0 ${INK}` : 'none', cursor: 'pointer', textAlign: 'left' }) }}>
                <span style={{ minWidth: 0 }}><b style={{ ...OSW, fontSize: 15, display: 'block' }}>{x.nome}</b><span style={{ fontSize: 11, color: 'rgba(0,0,0,.6)' }}>{t('Temporada', 'Season')} {x.temporada}{x.divisao ? ` · ${x.divisao === 'V' ? t('Várzea', 'Amateur') : t('Série ', 'Serie ') + x.divisao}` : ''} · {t('caixa', 'cash')} {x.caixa} 🪙</span></span>
                <span style={{ marginLeft: 'auto', width: 20, height: 20, borderRadius: 999, border: `3px solid ${INK}`, background: escolha === x.seed ? VERDE : '#fff', flex: '0 0 auto' }} />
              </button>
            ))}
            <button disabled={busy || escolha == null} onClick={confirmar} style={botao(VERDE, '#fff', { opacity: busy ? .6 : 1 })}>{busy ? t('Recebendo…', 'Collecting…') : t(`✅ Mandar ${c.premio} 🪙 pro ${carreiras.find(x => x.seed === escolha)?.nome ?? ''}`, `✅ Send ${c.premio} 🪙 to ${carreiras.find(x => x.seed === escolha)?.nome ?? ''}`)}</button>
            <p style={{ fontSize: 11.5, color: 'rgba(0,0,0,.62)', marginTop: 8, lineHeight: 1.35 }}>{t(`Depois disso, uma carta de cada jogador do ${c.clube} fica marcada "usada" nessa carreira. Elas continuam no álbum, mas não contam mais pra fechar o ${c.clube}. Pra receber de novo, junte o clube inteiro outra vez.`, `After that, one card of each ${c.clube} player is marked "used" in that career. They stay in the album but no longer count for ${c.clube}. To collect again, gather the whole club once more.`)}</p>
          </>}
          {erro && <p role="alert" style={{ fontSize: 12.5, color: VERM, fontWeight: 700, marginTop: 8 }}>{erro}</p>}
          <button onClick={onFechar} style={botao('#fff', INK, { marginTop: 10, fontSize: 13 })}>{t('Voltar', 'Back')}</button>
        </div>
      </div>
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
