import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { useVerifiedPresentationEmail } from './online-preview'
import { footballMatchPilotEmail, footballMatchPilotScope, type FootballMatchPilotScope } from './football-match-pilot-policy'
import { tr } from './lang'
import './football-match-pilot.css'

const preferenceKey = (email: string) => `esc-football-match-pilot-off:${email}`
function optedOut(email: string) {
  try { return localStorage.getItem(preferenceKey(email)) === '1' } catch { return false }
}
let activeScopes = 0

/** Local presentation: no room writes, messages, round state or permission changes. */
export function useFootballMatchPilot(state: FootballMatchPilotScope) {
  const email = useVerifiedPresentationEmail()
  const available = footballMatchPilotEmail(email) && footballMatchPilotScope(state)
  const [preference, setPreference] = useState({ email: '', off: false })
  const off = preference.email === email ? preference.off : optedOut(email)
  const enabled = available && !off
  const toggle = useCallback(() => {
    if (!footballMatchPilotEmail(email)) return
    setPreference(old => {
      const next = !(old.email === email ? old.off : optedOut(email))
      try { localStorage.setItem(preferenceKey(email), next ? '1' : '0') } catch { /* Appearance remains reversible in memory. */ }
      return { email, off: next }
    })
  }, [email])
  useEffect(() => {
    if (!enabled) return
    activeScopes++
    document.body.classList.add('fp-match-pilot')
    return () => { if (--activeScopes === 0) document.body.classList.remove('fp-match-pilot') }
  }, [enabled])
  return { available, enabled, toggle }
}

type ViewOption = { value: string; label: string; disabled: boolean }
/** Keep the actual select and dispatch its native change: all original guards remain. */
export function FootballMatchPilotView({ children }: { children: ReactNode }) {
  const source = useRef<HTMLDivElement>(null)
  const [view, setView] = useState<{ value: string; options: ViewOption[]; note: string }>({ value: '', options: [], note: '' })
  useLayoutEffect(() => {
    const select = source.current?.querySelector('select')
    if (!select) return
    const next = { value: select.value, options: Array.from(select.options, o => ({ value: o.value, label: o.text, disabled: o.disabled || select.disabled })), note: source.current?.querySelector('small')?.textContent ?? '' }
    setView(old => JSON.stringify(old) === JSON.stringify(next) ? old : next)
  }, [children])
  return <div className="fp-view-picker">
    <div ref={source} className="fp-view-native">{children}</div>
    <div role="group" aria-label={tr('Visualização da partida', 'Match view')}>
      {view.options.map(o => <button type="button" key={o.value} disabled={o.disabled} aria-pressed={view.value === o.value} onClick={() => {
        const select = source.current?.querySelector('select')
        const option = select && Array.from(select.options).find(v => v.value === o.value)
        if (!select || select.disabled || !option || option.disabled || select.value === o.value) return
        select.value = o.value
        select.dispatchEvent(new Event('change', { bubbles: true }))
      }}>{o.value === 'placar' ? tr('Placar cinema', 'Cinema scoreboard') : o.label}</button>)}
    </div>
    <small>{view.note || tr('Vale a partir do próximo jogo, para toda a sala.', 'Applies from the next match, for the whole room.')}</small>
  </div>
}
