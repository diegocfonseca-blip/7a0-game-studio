import { createContext, useContext, useId, type ReactNode } from 'react'
import { APOIO_PERKS, myApoioPerk } from './apoio'
import { useT } from './lang'
import logo from './img/logo-ll.webp'
import './career-visual-v2.css'

/** Presentation only. Room clocks, permissions and career rules remain with their existing owners. */
export function careerVisualV2(state: { careerOnline?: boolean; onlineMode?: string; sport?: string; co2?: unknown }): boolean {
  return !!state.careerOnline && state.onlineMode !== 'online' && !state.co2 && state.sport !== 'basquete'
}
const CareerVisualContext = createContext(false)
export function CareerVisualProvider({ enabled, children }: { enabled: boolean; children: ReactNode }) {
  return <CareerVisualContext.Provider value={enabled}>{children}</CareerVisualContext.Provider>
}
export function useCareerVisualV2() { return useContext(CareerVisualContext) }

export function CareerBrand({ club }: { club: string }) {
  const t = useT(), perk = myApoioPerk() ?? APOIO_PERKS.bege
  return <header className="cv2-mobile-brand"><div><img src={logo} width={28} height={28} alt="" /><span><strong>LEILÃO LEGENDS</strong><small>{t('O SEU TIME COMEÇA NO LANCE.', 'YOUR TEAM STARTS WITH A BID.')}</small></span></div><span className="cv2-identity" style={{ background: perk.grad, color: perk.tier === 'roxo' || perk.tier === 'verde' ? '#fff' : '#0c0c0c' }}>{club}</span></header>
}
export function CareerHeading({ title, club, season, division, balance }: { title: string; club: string; season: number; division?: string; balance: number }) {
  const t = useT()
  return <header className="cv2-heading"><div><small>{club} · {t('Temporada', 'Season')} {season}{division ? ` · ${division}` : ''}</small><h1>{title}</h1></div><div className="cv2-heading-balance"><small>{t('Caixa da carreira', 'Career balance')}</small><strong>🪙 {balance.toLocaleString()}</strong></div></header>
}
export function CareerSection({ title, id, children, className = '' }: { title: string; id?: string; children: ReactNode; className?: string }) {
  const enabled = useCareerVisualV2()
  const ownId = useId(), heading = `${id ?? ownId}-title`
  if (!enabled) return <>{children}</>
  return <section id={id} aria-labelledby={heading} className={`cv2-section ${className}`}><h2 id={heading} tabIndex={-1}>{title}</h2><div className="cv2-section-body">{children}</div></section>
}
export function CareerSectionLinks({ items, label }: { items: { id: string; label: string }[]; label?: string }) {
  const t = useT(), enabled = useCareerVisualV2()
  if (!enabled) return null
  return <nav className="cv2-section-links" aria-label={label ?? t('Nesta página', 'On this page')}>{items.map(item => <a key={item.id} href={`#${item.id}`} onClick={event => {
    const target = document.getElementById(item.id)
    if (!target) return
    event.preventDefault()
    target.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
    target.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true })
  }}>{item.label}</a>)}</nav>
}
export function CareerMarketSteps({ active, onScout, onSell }: { active: 'scout' | 'sell' | 'auction'; onScout?: () => void; onSell?: () => void }) {
  const t = useT(), steps = [{ id: 'scout', label: t('Sondar', 'Scout'), onClick: onScout }, { id: 'sell', label: t('Contratos e vendas', 'Contracts and sales'), onClick: onSell }, { id: 'auction', label: t('Leilão', 'Auction'), onClick: undefined }]
  return <ol className="cv2-market-steps" aria-label={t('Janela de transferências', 'Transfer window')}>{steps.map((step, i) => <li key={step.id} aria-current={active === step.id ? 'step' : undefined}>{step.onClick ? <button type="button" onClick={step.onClick}>{i + 1} · {step.label}</button> : <span>{i + 1} · {step.label}</span>}</li>)}</ol>
}
export function CareerBalance({ season, balance, entries, onStatement, onContinue }: { season: number; balance: number; entries: { amount: number; label?: string; kind: string }[]; onStatement: () => void; onContinue: () => void }) {
  const t = useT(), income = entries.filter(e => e.amount > 0).reduce((n, e) => n + e.amount, 0), expenses = -entries.filter(e => e.amount < 0).reduce((n, e) => n + e.amount, 0)
  return <section className="cv2-balance" aria-label={t(`Balanço da temporada ${season}`, `Season ${season} balance`)}><div className="cv2-balance-values">{[[t('Caixa atual', 'Current balance'), balance], [t('Entradas', 'Income'), `+${income}`], [t('Saídas', 'Expenses'), `−${expenses}`], [t('Saldo da temporada', 'Season net'), `${income - expenses >= 0 ? '+' : ''}${income - expenses}`]].map(([label, value]) => <div key={label}><small>{label}</small><strong>{value}</strong></div>)}</div><div className="cv2-grid cv2-balance-grid">{[{ title: t('Entradas', 'Income'), rows: entries.filter(e => e.amount >= 0) }, { title: t('Saídas', 'Expenses'), rows: entries.filter(e => e.amount < 0) }].map(group => <CareerSection key={group.title} title={group.title}>{group.rows.length ? group.rows.map((entry, i) => <div className="cv2-ledger-line" key={i}><span>{entry.label ?? entry.kind}</span><strong>{entry.amount > 0 ? '+' : ''}{entry.amount}</strong></div>) : <p>{t('Sem lançamentos.', 'No entries.')}</p>}</CareerSection>)}</div><div className="cv2-balance-actions"><button type="button" onClick={onStatement}>{t('Ver extrato completo', 'View full statement')}</button><button type="button" onClick={onContinue}>{t('Continuar →', 'Continue →')}</button></div></section>
}
