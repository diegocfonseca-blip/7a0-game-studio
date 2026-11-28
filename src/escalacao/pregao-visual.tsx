import { useEffect, useRef, useState } from 'react'
import { Shell, CollectibleCard, YourPitch, RivalsStrip } from './screens'
import { useEsc, openSlots, paMesa, paMesasAtivas, paMinimo, paPodeLancar, PA_TICK_MS } from './store'
import type { EscState } from './types'
import { SECTORS, rotuloFormacao } from './types'
import { ehPromessa } from './data'
import { agoraSala } from './relogio'
import { useT } from './lang'
import { playTick, playHammer, playChime, playDouLhe, playCoberto } from './sound'
import { PregaoCompras, PregaoComprasAnimacao } from './pregao-compras'
import './pregao-visual.css'

const PA_ALERTA_FIM = 11

function usePregaoDesktop() {
  const [desktop, setDesktop] = useState(() => typeof window !== 'undefined' && matchMedia('(min-width:701px)').matches)
  useEffect(() => {
    const media = matchMedia('(min-width:701px)')
    const update = () => setDesktop(media.matches)
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])
  return desktop
}

/** Só o host avança o motor. A apresentação lê sempre o relógio sincronizado da sala. */
function usePregaoRelogioESons(state: EscState, now: number) {
  const { dispatch } = useEsc()
  const dispatchRef = useRef(dispatch)
  dispatchRef.current = dispatch
  const active = !!state.pa
  const authority = state.onlineMode !== 'online' || state.isHost
  useEffect(() => {
    if (!active || !authority) return
    const timer = setInterval(() => dispatchRef.current({ type: 'PREGAO_ABERTO_TICK' }), PA_TICK_MS)
    return () => clearInterval(timer)
  }, [active, authority])

  const count = (state.pa?.lances.length ?? 0) + (state.pa?.m2?.lances.length ?? 0)
  const priorBids = useRef(count)
  useEffect(() => {
    if (count > 0 && count !== priorBids.current) playTick()
    priorBids.current = count
  }, [count])
  const sales = state.pa?.vendidos ?? []
  const saleSignature = JSON.stringify(sales.slice(0, 4).map(v => v.cardId))
  const knownSales = useRef(new Set(sales.map(v => v.cardId)))
  useEffect(() => {
    const newSales = sales.slice(0, 4).filter(v => !knownSales.current.has(v.cardId))
    newSales.forEach(v => knownSales.current.add(v.cardId))
    if (newSales.some(v => v.mgr != null)) playHammer()
    const legendary = newSales.some(v => {
      const c = state.pa?.fila.find(c => c.id === v.cardId)
      return v.mgr != null && c && c.fame >= 5 && !ehPromessa(c)
    })
    const chime = legendary ? setTimeout(playChime, 450) : undefined
    return () => { if (chime) clearTimeout(chime) }
  }, [saleSignature]) // eslint-disable-line react-hooks/exhaustive-deps

  const leaders = paMesasAtivas(state).map(k => {
    const m = paMesa(state, k)
    return `${m?.card?.id ?? ''}:${m?.M.lider ?? ''}`
  }).join('|')
  const previousLeaders = useRef(leaders)
  useEffect(() => {
    const old = previousLeaders.current.split('|')
    const me = state.managers[state.youIdx]?.id
    leaders.split('|').forEach((entry, i) => {
      const [card, leader] = entry.split(':'), [oldCard, oldLeader] = (old[i] ?? '').split(':')
      if (card && card === oldCard && oldLeader === String(me) && leader !== oldLeader) playCoberto()
    })
    previousLeaders.current = leaders
  }, [leaders, state.youIdx]) // eslint-disable-line react-hooks/exhaustive-deps
  const counted = useRef<Record<number, string>>({})
  useEffect(() => {
    for (const k of paMesasAtivas(state)) {
      const m = paMesa(state, k)
      if (!m?.card || m.M.lider == null || !m.M.deadline || (m.M.viraAte ?? 0) > now) continue
      const seconds = Math.ceil((m.M.deadline - now) / 1000)
      const key = `${m.card.id}:${m.M.deadline}:${seconds}`
      if (seconds >= 1 && seconds <= 3 && counted.current[k] !== key) {
        counted.current[k] = key
        playDouLhe(seconds)
      }
    }
  }, [now]) // eslint-disable-line react-hooks/exhaustive-deps
}

function MesaPublica({ mesa, now, desktop }: { mesa: number; now: number; desktop: boolean }) {
  const { state, dispatch } = useEsc()
  const t = useT()
  const [other, setOther] = useState('')
  const [warning, setWarning] = useState('')
  const [pending, setPending] = useState<{ cardId: string; value: number } | null>(null)
  const you = state.managers[state.youIdx]
  const view = paMesa(state, mesa)
  const current = view?.card
  const market = view?.M
  const online = state.onlineMode === 'online'
  const reveal = market?.viraId && (market.viraAte ?? 0) > now
    ? state.pa?.fila.find(c => c.id === market.viraId) : undefined
  const sale = reveal ? state.pa?.vendidos.find(v => v.cardId === reveal.id) : undefined
  const sold = !!reveal
  const shown = reveal ?? current
  const minimum = paMinimo(state, mesa)
  const can = (value: number) => !!current && !!you && !sold && paPodeLancar(state, you.id, value, state.youUid, mesa)
  const send = (value: number) => {
    if (!current || !can(value)) return
    dispatch({ type: 'PREGAO_ABERTO_LANCE', mgrId: you.id, valor: value, by: state.youUid, mesa, cardId: current.id })
    setOther('')
    if (online) setPending({ cardId: current.id, value })
  }
  const duo = !!state.pa?.duplo
  const increments = duo ? [1, 5, 10] : [1, 2, 5, 10]
  const keys = duo ? (mesa === 0 ? ['1', '2', '3'] : ['8', '9', '0']) : ['1', '2', '5', '0']
  const keyboard = useRef({ send, minimum, keys, increments })
  keyboard.current = { send, minimum, keys, increments }
  useEffect(() => {
    if (!desktop) return
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (event.repeat || event.ctrlKey || event.metaKey || event.altKey || target?.closest('input,textarea,select,[contenteditable="true"]')) return
      const i = keyboard.current.keys.indexOf(event.key)
      if (i < 0) return
      event.preventDefault()
      keyboard.current.send(keyboard.current.minimum + keyboard.current.increments[i] - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [desktop])
  useEffect(() => { setOther('') }, [current?.id])
  useEffect(() => {
    if (!pending || !you || !view) return
    if (current?.id === pending.cardId && market?.lider === you.id) { setPending(null); return }
    if (current?.id !== pending.cardId || (market?.lider != null && market.lider !== you.id && market.preco >= pending.value)) {
      setPending(null)
      setWarning(current?.id !== pending.cardId
        ? t('O martelo bateu antes do seu lance chegar.', 'The hammer fell before your bid arrived.')
        : t(`Alguém cobriu antes. O mínimo agora é ${minimum} 🪙.`, `Someone bid first. The minimum is now ${minimum} 🪙.`))
    }
  }, [current?.id, market?.lider, market?.preco, pending, you?.id, minimum]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!pending) return
    const timer = setTimeout(() => {
      setPending(null)
      setWarning(t('Seu lance não chegou ao dono da sala. Confira a conexão e tente novamente.', 'Your bid did not reach the host. Check the connection and try again.'))
    }, 5000)
    return () => clearTimeout(timer)
  }, [pending]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!warning) return
    const timer = setTimeout(() => setWarning(''), 3500)
    return () => clearTimeout(timer)
  }, [warning])
  if (!shown || !market || !you) return <section className="pa28-panel pa28-mesa"><h2>{t('Preparando a próxima carta…', 'Preparing the next card…')}</h2></section>

  const leader = state.managers.find(m => m.id === market.lider)
  const winning = !sold && market.lider === you.id
  const seconds = Math.max(0, Math.ceil(((market.deadline ?? now) - now) / 1000))
  const vacancies = openSlots(you, shown.pos)
  const otherMesa = duo ? paMesa(state, 1 - mesa) : null
  const committed = otherMesa?.M.lider === you.id ? otherMesa.M.preco : 0
  const free = Math.max(0, Math.floor(you.money) - committed)
  const buyer = sale?.time ?? t('Clube', 'Club')
  return <section className={`pa28-panel pa28-mesa${sold ? ' pa28-sold' : ''}${winning ? ' pa28-winning' : ''}`} data-mesa={mesa}>
    <h2><span>{duo ? `${t('MESA', 'TABLE')} ${mesa === 0 ? 'A' : 'B'} · ` : ''}{shown.pos}</span><small>{sold ? t('COMPRA FECHADA', 'SALE COMPLETE') : t(`${vacancies} ${vacancies === 1 ? 'vaga' : 'vagas'} no seu time`, `${vacancies} open ${vacancies === 1 ? 'slot' : 'slots'}`)}</small></h2>
    <div className="pa28-mesa-body">
      <div className="pa28-card-area"><div className={`pa28-card${sold ? ' is-revealed' : ''}`} data-card-id={shown.id}>
        <div className="pa28-flipper">
          <div className="pa28-back pa28-face"><div className="pa28-card-tags"><b>{shown.pos}</b><span>{t('? categoria', '? category')}</span></div><div className="pa28-question">?</div><div className="pa28-card-name"><strong>{shown.name}</strong><span>{shown.club} · {shown.year}</span></div></div>
          <div className="pa28-front pa28-face">{reveal && <><CollectibleCard name={shown.name} club={shown.club} year={shown.year} pos={shown.pos} fame={shown.fame} folk={!!shown.folk} promessa={shown.promessa}/><div className="pa28-stamp" aria-label={sale?.mgr == null ? t('Sem comprador', 'No buyer') : t(`${buyer} levou por ${sale.preco} moedas`, `${buyer} won for ${sale.preco} coins`)}><strong>{sale?.mgr == null ? t('NINGUÉM LEVOU', 'NO BUYER') : t(`${buyer} LEVOU`, `${buyer} WON`)}</strong><span>{sale?.mgr == null ? t('Vai para a sobra', 'Left over') : `${sale.preco} 🪙`}</span></div></>}</div>
        </div>{sold && sale?.mgr != null && <span className="pa28-hammer" aria-hidden="true">🔨</span>}
      </div></div>
      <div className="pa28-info">
        <div className="pa28-state" aria-live="polite">{sold ? sale?.mgr === you.id ? t('🎉 É SEU!', '🎉 IT’S YOURS!') : t('🔨 MARTELADO', '🔨 SOLD') : winning ? t('✓ VOCÊ ESTÁ GANHANDO', '✓ YOU ARE LEADING') : leader ? t(`${leader.teamName} está na frente`, `${leader.teamName} leads`) : t('Dê o primeiro lance', 'Place the first bid')}</div>
        <div className="pa28-price"><div><small>{sold ? t('VALOR DA COMPRA', 'SALE PRICE') : t('LANCE ATUAL', 'CURRENT BID')}</small><strong>{sold ? sale?.mgr == null ? '—' : sale.preco : market.lider == null ? '—' : market.preco}<span> 🪙</span></strong></div><div className={`pa28-clock${!sold && leader && seconds <= 2 ? ' urgent' : ''}`}><small>{sold ? t('FINALIZADO', 'FINISHED') : t('MARTELO EM', 'HAMMER IN')}</small><strong>{sold ? '🔨' : leader ? seconds : '—'}<span>{sold || !leader ? '' : 's'}</span></strong><b>{sold ? t('VENDIDO', 'SOLD') : !leader ? t('AGUARDANDO', 'WAITING') : seconds <= 1 ? t('TRÊS…', 'SOLD…') : seconds <= 2 ? t('DUAS…', 'TWICE…') : seconds <= 3 ? t('UMA…', 'ONCE…') : t('DISPUTANDO', 'BIDDING')}</b></div><p>{sold ? sale?.mgr == null ? t('Carta sem comprador', 'No buyer') : buyer : leader?.teamName ?? t('Lance livre', 'Open bid')}</p></div>
        <div className="pa28-history"><h3>{t('ÚLTIMOS LANCES', 'LATEST BIDS')}</h3>{market.lances.length > 0 && !sold ? [...market.lances].reverse().slice(0, 2).map((bid, i) => <div key={`${bid.mgr}-${bid.valor}-${i}`}><span>{state.managers.find(m => m.id === bid.mgr)?.teamName}</span><b>{bid.valor} 🪙</b></div>) : <div className="pa28-history-empty">{sold ? t('Próxima carta automaticamente…', 'Next card automatically…') : t('A disputa aparece aqui', 'Bids appear here')}</div>}</div>
      </div>
      <div className="pa28-controls">
        {warning && <div className="pa28-warning" role="alert">{warning}</div>}
        <div className="pa28-quick">{increments.map((increment, i) => <button key={increment} type="button" disabled={!can(minimum + increment - 1)} onClick={() => send(minimum + increment - 1)}>+{increment}{desktop && <kbd>{keys[i]}</kbd>}</button>)}</div>
        <div className="pa28-custom"><input aria-label={t(`Valor total do lance na mesa ${mesa === 0 ? 'A' : 'B'}`, `Total bid on table ${mesa === 0 ? 'A' : 'B'}`)} inputMode="numeric" placeholder={t('Valor total', 'Total bid')} value={other} onChange={e => setOther(e.target.value.replace(/\D/g, ''))} onKeyDown={e => { if (e.key === 'Enter') send(Number(other)) }}/><button type="button" disabled={!can(Number(other))} onClick={() => send(Number(other))}>{t('DAR LANCE', 'BID')}</button></div>
        <p aria-live="polite">{sold ? t('A próxima carta abre sozinha.', 'The next card opens automatically.') : pending ? t('Enviando seu lance…', 'Sending your bid…') : winning ? t('Você lidera. Aguarde o martelo.', 'You lead. Waiting for the hammer.') : vacancies <= 0 ? t('Você já completou esta posição.', 'You already filled this position.') : free < minimum ? t(`Seu caixa livre não cobre ${minimum} 🪙.`, `Your available cash does not cover ${minimum} 🪙.`) : committed > 0 ? t(`${committed} 🪙 reservadas na outra mesa · ${free} 🪙 livres.`, `${committed} 🪙 reserved on the other table · ${free} 🪙 available.`) : t('Novo lance reinicia o relógio desta mesa.', 'A new bid resets this table’s clock.')}</p>
      </div>
    </div>
  </section>
}

export function PregaoVisualPublico() {
  const { state } = useEsc()
  const t = useT()
  const desktop = usePregaoDesktop()
  const [now, setNow] = useState(agoraSala)
  useEffect(() => { const timer = setInterval(() => setNow(agoraSala()), 250); return () => clearInterval(timer) }, [])
  usePregaoRelogioESons(state, now)
  const pa = state.pa, you = state.managers[state.youIdx]
  if (!pa || !you) return <Shell pregaoPresentation className="ll-pa28-shell"><p>{t('Preparando pregão…', 'Preparing auction…')}</p></Shell>
  const duo = !!pa.duplo
  const vacancies = SECTORS.reduce((total, pos) => total + openSlots(you, pos), 0)
  const remaining = Math.max(0, pa.fila.length - pa.idx - 1) + paMesasAtivas(state).filter(k => !!paMesa(state, k)?.card).length
  const rivals = state.managers.some(m => m.id !== you.id && m.auctionRival)
  return <Shell pregaoPresentation className="ll-pa28-shell"><main className={`pa28-root ${duo ? 'pa28-duo' : 'pa28-single'}`}>
    <div className="pa28-heading"><div><span>{state.reserveAuction ? t('PREGÃO · RESERVAS E TRANSFERÊNCIAS', 'AUCTION · RESERVES AND TRANSFERS') : t('PREGÃO ABERTO', 'OPEN AUCTION')}</span><h1>{duo ? t('DUAS CARTAS NA MESA', 'TWO CARDS AT AUCTION') : t('JOGADOR NA MESA', 'PLAYER AT AUCTION')}</h1><p>{t(`Carta ${Math.min(pa.idx + 1, pa.fila.length)} de ${pa.fila.length}`, `Card ${Math.min(pa.idx + 1, pa.fila.length)} of ${pa.fila.length}`)} <b>·</b> {remaining <= PA_ALERTA_FIM ? t(`${remaining} ${remaining === 1 ? 'carta restante' : 'cartas restantes'}`, `${remaining} ${remaining === 1 ? 'card left' : 'cards left'}`) : duo ? t('Relógios independentes', 'Independent clocks') : t('Categoria no martelo', 'Category at the hammer')}</p></div><div className="pa28-cash"><small>{t('SEU CAIXA', 'YOUR CASH')}</small><strong>{Math.floor(you.money)} <span>🪙</span></strong></div></div>
    <div className="pa28-layout"><div className="pa28-tables">{paMesasAtivas(state).map(mesa => <MesaPublica key={mesa} mesa={mesa} now={now} desktop={desktop}/>)}</div>
      <aside className="pa28-panel pa28-team"><h2><span><span className="pa28-team-desktop-title">{t('SEU TIME', 'YOUR TEAM')}</span><span className="pa28-team-mobile-title">{t('ÚLTIMAS COMPRAS', 'LATEST PURCHASES')}</span></span><small><span className="pa28-mobile-team-count">{t('SEU TIME · ', 'YOUR TEAM · ')}</span>{you.squad.length} / {you.squad.length + vacancies}</small></h2><div className="pa28-team-content"><div className="pa28-team-label"><strong>{you.teamName}</strong><span>{rotuloFormacao(you.formation)}</span></div><p>{t('AINDA FALTAM', 'OPEN POSITIONS')}</p><div className="pa28-slots">{SECTORS.map(pos => { const n = openSlots(you, pos); return <div key={pos} className={n === 0 ? 'complete' : ''}><span>{pos}</span><b>{n === 0 ? '✓' : n}</b></div> })}</div>{!desktop && <PregaoCompras state={state}/>}<div className="pa28-pitch"><YourPitch small/></div></div></aside>
      <section className="pa28-panel pa28-sales"><h2><span>{t('ÚLTIMAS COMPRAS', 'LATEST PURCHASES')}</span><small>{t('COMPRAS DA SALA', 'ROOM PURCHASES')}</small></h2>{desktop && <PregaoCompras state={state}/>}</section>
    </div>
    <footer className="pa28-footer"><span>{t('🎁 Vagas restantes são preenchidas no fim do pregão.', '🎁 Remaining slots are filled at the end of the auction.')}</span></footer>
    <details className="pa28-rules"><summary>{t('Como funciona o pregão', 'How the auction works')}</summary><p>{t('Ganha quem der o maior lance. Cada novo lance reinicia o relógio da sua mesa. A categoria só aparece no martelo; a próxima carta abre automaticamente. Quem já completou a posição não dá mais lances nela. No fim, vagas vazias recebem jogadores de graça, nunca craques nem lendas. As regras não pausam o pregão.', 'The highest bid wins. Each new bid resets its table’s clock. The category is revealed at the hammer; the next card opens automatically. Filled positions cannot bid. Empty slots receive free players at the end, never stars or legends. Opening these rules does not pause the auction.')}</p></details>
    {rivals && <details className="pa28-room"><summary>{t('Equipes da sala', 'Room teams')}</summary><RivalsStrip/></details>}
    <PregaoComprasAnimacao state={state}/>
  </main></Shell>
}
