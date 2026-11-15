import { useEffect, useId, useRef, useSyncExternalStore, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useT } from './lang'
import { marcaNome, marcaSigla, marcaFraseClube } from './marca'
import './social-layout.css'

// Only the uppermost social window handles Escape/Tab. Opening a profile keeps
// the friend list and its search/tab/scroll mounted underneath it.
const stack: string[] = [], listeners = new Set<() => void>()
let previousOverflow = ''
const notify = () => listeners.forEach(f => f())
const subscribe = (f: () => void) => { listeners.add(f); return () => { listeners.delete(f) } }
const top = () => stack.at(-1) ?? ''

export function SocialJanela({ titulo, tipo = 'convite', resumo, onClose, children }: {
  titulo: string; tipo?: 'amigos' | 'perfil' | 'avisos' | 'convite'; resumo?: ReactNode
  onClose: () => void; children: ReactNode
}) {
  const t = useT(), id = useId(), root = useRef<HTMLDivElement>(null), close = useRef<HTMLButtonElement>(null)
  const onCloseRef = useRef(onClose)
  useEffect(() => { onCloseRef.current = onClose }, [onClose])
  const active = useSyncExternalStore(subscribe, top, () => '')
  useEffect(() => {
    const before = document.activeElement instanceof HTMLElement ? document.activeElement : null
    if (!stack.length) { previousOverflow = document.body.style.overflow; document.body.style.overflow = 'hidden' }
    stack.push(id); notify()
    const key = (e: KeyboardEvent) => {
      if (top() !== id || e.defaultPrevented || !(e.target instanceof Node) || !root.current?.contains(e.target)) return
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); onCloseRef.current(); return }
      if (e.key !== 'Tab') return
      const nodes = [...root.current.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),summary,[tabindex="0"]')].filter(n => n.getClientRects().length && !n.closest('[hidden],[inert]'))
      const first = nodes[0], last = nodes.at(-1)
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus() }
      if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus() }
    }
    window.addEventListener('keydown', key)
    return () => {
      window.removeEventListener('keydown', key)
      const i = stack.indexOf(id); if (i !== -1) stack.splice(i, 1)
      notify()
      if (!stack.length) document.body.style.overflow = previousOverflow
      requestAnimationFrame(() => { if (before?.isConnected && !before.closest('[inert]')) before.focus({ preventScroll: true }) })
    }
  }, [id])
  useEffect(() => {
    if (active === id && !root.current?.contains(document.activeElement)) close.current?.focus({ preventScroll: true })
  }, [active, id])
  if (tipo === 'convite') return createPortal(<div ref={root} className="ll-social-window social-convite" role="dialog" aria-modal={active === id} aria-labelledby={`${id}-title`} aria-hidden={active !== id || undefined} inert={active !== id}>
    <section className="social-invite-sheet"><header><h1 id={`${id}-title`}>{titulo}</h1><button ref={close} type="button" className="social-button social-close" onClick={onClose} aria-label={t('Fechar', 'Close')}>×</button></header><div className="social-invite-content">{children}</div></section>
  </div>, document.body)
  const title = tipo === 'amigos' ? t('AMIGOS.', 'FRIENDS.') : tipo === 'perfil' ? t('PERFIL.', 'PROFILE.') : t('AVISOS.', 'NOTIFICATIONS.')
  return createPortal(<div ref={root} className={`ll-social-window social-${tipo}`} role="dialog" aria-modal={active === id} aria-labelledby={`${id}-title`} aria-hidden={active !== id || undefined} inert={active !== id}>
    <header className="social-top"><div className="social-wrap"><div className="social-brand"><span aria-hidden="true">{marcaSigla()}</span><div><strong>{marcaNome()}</strong><small>{marcaFraseClube()}</small></div></div><div className="social-top-actions"><button type="button" className="social-button" onClick={onClose}>{tipo === 'perfil' ? t('VOLTAR', 'BACK') : t('VOLTAR AO JOGO', 'BACK TO GAME')}</button><button type="button" className="social-button social-close" ref={close} onClick={onClose} aria-label={t('Fechar', 'Close')}>×</button></div></div></header>
    <section className="social-hero"><div className="social-wrap"><div><div className="social-kicker">{t('A RESENHA CONTINUA FORA DE CAMPO.', 'THE BANTER CONTINUES OFF THE PITCH.')}</div><h1 id={`${id}-title`}>{title}</h1><p>{tipo === 'amigos' ? t('Quem joga com você, suas cartas e seu clã.', 'Your friends, your cards and your clan.') : tipo === 'perfil' ? t('Identidade, conquistas e histórias de quem joga.', 'Identity, achievements and the people who play.') : t('Seus convites e pedidos, num lugar só.', 'Your invitations and requests, in one place.')}</p></div><div className="social-summary">{resumo}</div></div></section>
    <div className="social-wrap social-body" aria-label={titulo}>{children}</div>
  </div>, document.body)
}
