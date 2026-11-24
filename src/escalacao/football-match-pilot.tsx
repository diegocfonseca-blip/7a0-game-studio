import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'
import { useVerifiedPresentationEmail } from './online-preview'
import { footballMatchPilotEmail, footballMatchPilotScope, footballMatchAdScope, type FootballMatchPilotScope } from './football-match-pilot-policy'
import { tr } from './lang'
import './football-match-pilot.css'
import './football-classic-presentation.css'
import {useFootballMatchNavigation} from './football-match-navigation'

const preferenceKey = (email: string) => `esc-football-match-pilot-v2-off:${email||'public'}`
const preferenceListeners=new Set<()=>void>()
const preferenceSubscribe=(fn:()=>void)=>{preferenceListeners.add(fn);return()=>{preferenceListeners.delete(fn)}}
const memoryPreference=new Map<string,boolean>()
function optedOut(email: string) {
  if(memoryPreference.has(email))return memoryPreference.get(email)!
  try { return localStorage.getItem(preferenceKey(email)) === '1' } catch { return false }
}
let activeScopes = 0
let availableScopes = 0
let holoScopes = 0

export function useFootballMatchAdAccess(state:FootballMatchPilotScope){
 const email=useVerifiedPresentationEmail()
 return footballMatchPilotEmail(email)&&footballMatchAdScope(state)
}

/** Local presentation: no room writes, messages, round state or permission changes. */
export function useFootballMatchPilotAccess(state: FootballMatchPilotScope) {
  const email = useVerifiedPresentationEmail()
  const available = footballMatchPilotEmail(email) && footballMatchPilotScope(state)
  const off=useSyncExternalStore(preferenceSubscribe,()=>optedOut(email),()=>false)
  const enabled = available && !off
  const toggle = useCallback(() => {
    if (!footballMatchPilotEmail(email)) return
      const next = !optedOut(email)
      memoryPreference.set(email,next)
      try { localStorage.setItem(preferenceKey(email), next ? '1' : '0') } catch { /* Appearance remains reversible in memory. */ }
      preferenceListeners.forEach(fn=>fn())
  }, [email])
  return {available,enabled,toggle,holo:available} // 💜 23/11 (Diego): o roxo brilhante das abas vale pra todo mundo, não só na conta dele
}
export function useFootballMatchPilot(state: FootballMatchPilotScope & {roomId?:string}) {
  const access=useFootballMatchPilotAccess(state)
  const enabled=access.enabled
  const {page}=useFootballMatchNavigation(state.roomId??'',enabled)
  useEffect(()=>{
    if(!access.available)return
    availableScopes++;document.body.classList.add('fp-match-available')
    return()=>{if(--availableScopes===0)document.body.classList.remove('fp-match-available')}
  },[access.available])
  useEffect(()=>{
    if(!access.holo)return
    holoScopes++;document.body.classList.add('fp-match-holo')
    return()=>{if(--holoScopes===0)document.body.classList.remove('fp-match-holo')}
  },[access.holo])
  useEffect(() => {
    if (!enabled) return
    activeScopes++
    document.body.classList.add('fp-match-pilot')
    return () => { if (--activeScopes === 0) document.body.classList.remove('fp-match-pilot') }
  }, [enabled])
  useEffect(()=>{
    if(!enabled)return
    document.body.dataset.fpPage=page
    return()=>{delete document.body.dataset.fpPage}
  },[enabled,page])
  return access
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
