import {useEffect, useRef, type ReactNode} from 'react'
import logo from './img/logo-ll.webp'
import {tr} from './lang'
import './mobile-auction-header.css'

/** Approved mobile header only; the caller supplies the existing visible balance. */
export function MobileAuctionHeader({name, title, balance}: {name: string; title: string; balance?: ReactNode}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const bar = ref.current?.closest<HTMLElement>('.ll-shell-bar')
    const shell = bar?.parentElement
    if (!bar || !shell) return
    // Position shortcuts must clear the sticky header, including reserve/invite notices.
    const measure = () => shell.style.setProperty('--ll-mobile-auction-height', `${bar.getBoundingClientRect().height}px`)
    measure()
    const observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(measure)
    observer?.observe(bar)
    return () => { observer?.disconnect(); shell.style.removeProperty('--ll-mobile-auction-height') }
  }, [])
  return <div ref={ref} className="ll-mobile-auction-brand">
    <div className="ll-mobile-auction-title">
      <img src={logo} alt="" width={28} height={32}/>
      <div><strong>Leilão Legends</strong><small title={`${name} · ${title}`}>{name} · {title}</small></div>
    </div>
    {balance != null && <div className="ll-mobile-auction-wallet" aria-label={tr('Moedas do leilão', 'Auction coins')}>
      <span aria-hidden="true">🪙</span><div><small>{tr('Moedas', 'Coins')}</small>{balance}</div>
    </div>}
  </div>
}
