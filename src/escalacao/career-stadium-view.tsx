import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { careerStadiumView } from './career-stadium-model'
import type { StadiumSave } from './estadiodata'
import './career-stadium-view.css'

export function CareerStadiumView({ st, children, label = 'Vista aérea', inline = true }: {
  st?: StadiumSave; children: ReactNode; label?: string; inline?: boolean
}) {
  const dialog = useRef<HTMLDialogElement>(null), trigger = useRef<HTMLButtonElement>(null)
  const heading = useId(), view = careerStadiumView(st, true)
  useEffect(() => () => { dialog.current?.close() }, [])
  return <div className="ll32-stadium-view">
    {inline && <div className="ll32-stadium-canvas">{children}</div>}
    <button ref={trigger} className="ll32-action" onClick={() => dialog.current?.showModal()}>{label}</button>
    {createPortal(<dialog ref={dialog} className="ll32-aerial" aria-labelledby={heading} onClose={() => trigger.current?.focus()}>
      <header><h2 id={heading}>Seu estádio · vista aérea</h2><button className="ll32-action" onClick={() => dialog.current?.close()}>Voltar</button></header>
      <div className="ll32-stadium-canvas">{children}</div>
      <p><strong>{view.capacity.now.toLocaleString('pt-BR')} lugares</strong> · máximo {view.capacity.max.toLocaleString('pt-BR')}</p>
      <div className="ll32-sector-summary">{view.sectors.map(s => <div key={s.key}><b>{s.name}</b><span>{s.status} · {s.pct}%</span><progress aria-label={`${s.name}: ${s.pct}%`} max={100} value={s.pct}/></div>)}</div>
      <p className="ll32-note">Obras do seu clube. Consultar esta vista não faz compras nem altera a partida.</p>
    </dialog>, document.body)}
  </div>
}
