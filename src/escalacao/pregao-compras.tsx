import { useEffect, useRef } from 'react'
import { CollectibleCard } from './screens'
import { Escudo } from './escudos'
import { useT } from './lang'
import type { EscState } from './types'

export function PregaoCompras({ state }: { state: EscState }) {
  const t = useT()
  const sales = state.pa?.vendidos.filter(v => v.mgr != null).slice(0, 3) ?? []
  return <div className="pa28-purchases" aria-label={t('Últimas compras da sala', 'Latest room purchases')}>
    {sales.length === 0 ? <p className="pa28-purchases-empty">{t('As compras da sala aparecerão aqui.', 'Room purchases will appear here.')}</p> : <div className="pa28-purchase-row">{sales.map(sale => {
      const buyer = state.managers.find(m => m.id === sale.mgr)
      const card = state.pa?.fila.find(c => c.id === sale.cardId) ?? buyer?.squad.find(c => c.id === sale.cardId)
      const club = sale.time ?? buyer?.teamName ?? t('Clube', 'Club')
      return <article className="pa28-purchase" data-sale-card={sale.cardId} key={sale.cardId} aria-label={t(`${club}: ${sale.nome}, ${sale.preco} moedas`, `${club}: ${sale.nome}, ${sale.preco} coins`)}>
        <div className="pa28-purchase-thumb">{card ? <div className="pa28-thumbnail-card"><CollectibleCard name={card.name} club={card.club} year={card.year} pos={card.pos} fame={card.fame} folk={!!card.folk} promessa={card.promessa}/></div> : <span className="pa28-purchase-fallback">{sale.pos}</span>}<span className="pa28-purchase-crest"><Escudo nome={club} size={17}/></span></div>
        <div className="pa28-purchase-copy"><strong>{club}</strong><span>{sale.nome}</span><b>{sale.preco} 🪙</b></div>
      </article>
    })}</div>}
  </div>
}

/** Efeito visual independente dos relógios, sem bloquear lances nem avançar o motor. */
export function PregaoComprasAnimacao({ state }: { state: EscState }) {
  const sales = state.pa?.vendidos ?? []
  const seen = useRef(new Set(sales.map(v => v.cardId)))
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>())
  const flights = useRef(new Map<HTMLElement, Animation>())
  const alive = useRef(true)
  const signature = JSON.stringify(sales.slice(0, 4).map(v => v.cardId))
  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
      timers.current.forEach(clearTimeout)
      timers.current.clear()
      flights.current.forEach((animation, node) => { animation.cancel(); node.remove() })
      flights.current.clear()
    }
  }, [])
  useEffect(() => {
    function highlight(target: HTMLElement) {
      if (!alive.current || !target.isConnected) return
      target.classList.add('pa28-arrived')
      const timer = setTimeout(() => { timers.current.delete(timer); target.classList.remove('pa28-arrived') }, 550)
      timers.current.add(timer)
    }
    for (const sale of sales.slice(0, 4)) {
      if (seen.current.has(sale.cardId)) continue
      seen.current.add(sale.cardId)
      if (sale.mgr == null) continue
      const timer = setTimeout(() => {
        timers.current.delete(timer)
        if (!alive.current) return
        const source = [...document.querySelectorAll<HTMLElement>('.pa28-card[data-card-id]')].find(el => el.dataset.cardId === sale.cardId)
        const target = [...document.querySelectorAll<HTMLElement>('.pa28-purchase[data-sale-card]')].find(el => el.dataset.saleCard === sale.cardId)
        const thumb = target?.querySelector<HTMLElement>('.pa28-purchase-thumb')
        const front = source?.querySelector<HTMLElement>('.pa28-front')
        if (!source || !target || !thumb || !front) return
        const from = source.getBoundingClientRect(), to = thumb.getBoundingClientRect()
        if (from.width <= 0 || to.width <= 0 || to.height <= 0 || from.top < 0 || to.top > innerHeight - 12 || to.bottom < 0) return
        if (matchMedia('(prefers-reduced-motion: reduce)').matches || typeof source.animate !== 'function') { highlight(target); return }
        const flyer = document.createElement('div')
        flyer.className = `pa28-flight pa28-card ${state.pa?.duplo ? 'pa28-duo' : 'pa28-single'}`
        Object.assign(flyer.style, { position: 'fixed', left: `${from.left}px`, top: `${from.top}px`, width: `${from.width}px`, height: `${from.height}px`, zIndex: '9990', pointerEvents: 'none', transformOrigin: 'top left', perspective: 'none' })
        const copy = front.cloneNode(true) as HTMLElement
        copy.style.transform = 'none'
        copy.style.backfaceVisibility = 'visible'
        copy.setAttribute('aria-hidden', 'true')
        copy.querySelectorAll<HTMLElement>('.pa28-stamp').forEach(el => { el.style.animation = 'none' })
        flyer.append(copy)
        document.body.append(flyer)
        const dx = to.left - from.left, dy = to.top - from.top, scale = to.width / from.width
        const animation = flyer.animate([
          { transform: 'translate3d(0,0,0) scale(1)', opacity: .96 },
          { transform: `translate3d(${dx * .55}px,${dy * .38 - 22}px,0) scale(.58) rotate(-4deg)`, opacity: .98, offset: .5 },
          { transform: `translate3d(${dx}px,${dy}px,0) scale(${scale})`, opacity: .7 },
        ], { duration: 650, easing: 'cubic-bezier(.28,.6,.3,1)', fill: 'forwards' })
        flights.current.set(flyer, animation)
        animation.finished.then(() => highlight(target)).catch(() => {}).finally(() => { flights.current.delete(flyer); flyer.remove() })
      }, 660)
      timers.current.add(timer)
    }
  }, [signature]) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}
