import { createContext, useContext, useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { tr } from './lang'
import './online-create-layout.css'

export const OnlineCreateContext = createContext({ enabled: false, summaries: {} as Record<string, string>, expansion: { version: 0, open: true } })

/** Original fields remain mounted while an accordion is closed. */
export function OnlineCreateSection({ num, title, icon, sub, children }: { num: number; title: string; icon: string; sub?: string; children: ReactNode }) {
  const { summaries, expansion } = useContext(OnlineCreateContext), id = useId()
  const [open, setOpen] = useState(title === tr('O leilão', 'The auction'))
  useEffect(() => { if (expansion.version) setOpen(expansion.open) }, [expansion])
  return <details className="ll-create-accordion" data-section={title} open={open} onToggle={e => setOpen(e.currentTarget.open)}>
    <summary aria-controls={id}><span className="ll-create-number">{num}</span><span className="ll-create-accordion-label"><b>{icon} {title}</b><small>{summaries[title] || sub}</small></span><span className="ll-create-chevron" aria-hidden="true">⌄</span></summary>
    <div id={id} className="ll-create-accordion-body space-y-3">{children}</div>
  </details>
}

export function OnlineCreateLayout({ enabled, modes, children, rows, summaries, name, button, responsibility, error, errorKey, notice }: {
  enabled: boolean; modes: ReactNode; children: ReactNode; rows: [string, string][]; summaries: Record<string, string>; name: string
  button: ReactNode; responsibility: ReactNode; error: ReactNode; errorKey: string; notice: string
}) {
  const [expansion, setExpansion] = useState({ version: 0, open: true }), [allOpen, setAllOpen] = useState(false)
  const dialog = useRef<HTMLDialogElement>(null), restore = useRef<HTMLButtonElement>(null), root = useRef<HTMLDivElement>(null), id = useId()
  const available = Boolean(button)
  useEffect(() => {
    if (enabled && errorKey) { setExpansion(e => ({ version: e.version + 1, open: true })); setAllOpen(true); dialog.current?.close() }
  }, [enabled, errorKey])
  useEffect(() => {
    const element = root.current
    if (!enabled || !element) return
    const update = () => {
      const cards = [...element.querySelectorAll<HTMLDetailsElement>('.ll-create-accordion')]
      setAllOpen(cards.length > 0 && cards.every(card => card.open))
    }
    element.addEventListener('toggle', update, true)
    return () => element.removeEventListener('toggle', update, true)
  }, [enabled, available])
  if (!enabled) return <>{children}</>
  if (!button) return <div className="ll-create-v01"><div className="ll-create-modes cs-claro">{modes}</div>{error && <div className="ll-create-inline-error" role="alert">{error}</div>}{children}</div>
  const summary = <dl className="ll-create-summary-rows">{rows.filter(([, value]) => value).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
  const closeSummary = () => { dialog.current?.close(); restore.current?.focus() }
  return <OnlineCreateContext.Provider value={{ enabled, summaries, expansion }}>
    <div className="ll-create-v01" ref={root}>
      <div className="ll-create-modes cs-claro">{modes}</div>
      <div className="ll-create-builder">
        <section className="ll-create-config"><header className="ll-create-config-heading"><div><h2>{tr('PERSONALIZE A PARTIDA', 'CUSTOMIZE THE MATCH')}</h2><p>{tr('Abra só o que quiser ajustar.', 'Open only what you want to adjust.')}</p></div><button type="button" onClick={() => { setExpansion(e => ({ version: e.version + 1, open: !allOpen })); setAllOpen(!allOpen) }}>{allOpen ? tr('RECOLHER TUDO −', 'COLLAPSE ALL −') : tr('EXPANDIR TUDO ＋', 'EXPAND ALL ＋')}</button></header>
          {children}
          <p className="ll-create-config-note">{tr('As opções disponíveis seguem o modo, o baralho e as permissões da conta.', 'Available options follow the mode, deck and account permissions.')}</p>
          {error && <div className="ll-create-inline-error" role="alert">{error}</div>}
        </section>
        <aside className="ll-create-summary"><small>{tr('CONFIRA SUAS ESCOLHAS', 'REVIEW YOUR CHOICES')}</small><h2>{tr('SUA SALA', 'YOUR ROOM')}</h2><p className="ll-create-summary-name">{name}</p>{summary}<div className="ll-create-responsibility">{responsibility}</div><div className="ll-create-submit">{button || <p>{notice}</p>}</div></aside>
      </div>
      {button && <div className="ll-create-mobile-bar"><button type="button" ref={restore} onClick={() => dialog.current?.showModal()} aria-haspopup="dialog"><small>{tr('SUA SALA', 'YOUR ROOM')}</small><b>{rows[0]?.[1]} · {rows.find(([key]) => key === tr('Campeonato', 'Championship'))?.[1] || name}</b><span>{tr('VER RESUMO ⌃', 'VIEW SUMMARY ⌃')}</span></button><div className="ll-create-submit">{button}</div></div>}
      <dialog ref={dialog} className="ll-create-summary-dialog" aria-labelledby={id} onClose={() => restore.current?.focus()} onClick={e => {
        if (e.target !== e.currentTarget) return
        const bounds = e.currentTarget.getBoundingClientRect()
        if (e.clientX < bounds.left || e.clientX > bounds.right || e.clientY < bounds.top || e.clientY > bounds.bottom) closeSummary()
      }}><header><h2 id={id}>{tr('SUA SALA', 'YOUR ROOM')}</h2><button type="button" aria-label={tr('Fechar resumo', 'Close summary')} onClick={closeSummary}>×</button></header><p className="ll-create-summary-name">{name}</p>{summary}<div className="ll-create-responsibility">{responsibility}</div><div className="ll-create-submit" onClickCapture={e => { if ((e.target as Element).closest('button')) dialog.current?.close() }}>{button}</div></dialog>
    </div>
  </OnlineCreateContext.Provider>
}
