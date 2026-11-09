import { useSyncExternalStore } from 'react'
import { supabase } from '../lib/supabase'
import { releConta } from './conta-vez' // 📉 30/10: só relê quando a conta muda (ou foi pagar)

// Prévia de apresentação local. Nunca vai para o estado compartilhado da sala.
// Não é uma autorização de dados: RLS e permissões do host continuam independentes.
export function onlinePreviewEmail(email?: string | null): boolean {
  return ['diego.c.fonseca@gmail.com', 'diego.c.fonseca2@gmail.com'].includes((email ?? '').trim().toLowerCase())
}

let enabled = false
let verifiedEmail = ''
/** Apresentação aprovada em 09/11: só a conta principal, sem herdar a sala ou o tier. */
export function ownerPresentationEmail(email?: string | null): boolean {
  return (email ?? '').trim().toLowerCase() === 'diego.c.fonseca@gmail.com'
}
export function ownerPresentationEnabled() { return enabled && ownerPresentationEmail(verifiedEmail) }
export function onlinePreviewEnabled() { return enabled }
let started = false
let revision = 0
const listeners = new Set<() => void>()
function publish(value: boolean, email = '') {
  const nextEmail = value ? email.trim().toLowerCase() : ''
  if (enabled === value && verifiedEmail === nextEmail) return
  enabled = value
  verifiedEmail = nextEmail
  listeners.forEach(listener => listener())
}
async function verify() {
  const version = ++revision
  try {
    const { data, error } = await supabase.auth.getUser()
    if (version === revision) publish(!error && onlinePreviewEmail(data.user?.email), data.user?.email ?? '')
  } catch { if (version === revision) publish(false) }
}
function start() {
  if (started) return
  started = true
  supabase.auth.onAuthStateChange((_e, s) => {
    if (!releConta('online-preview', s?.user?.id)) return
    ++revision
    publish(false)
    // Fora do callback de Auth: não bloqueia o lock interno do cliente.
    queueMicrotask(() => { void verify() })
  })
  void verify()
}
function subscribe(listener: () => void) {
  listeners.add(listener)
  start()
  return () => { listeners.delete(listener) }
}
export function useOnlinePreview() {
  return useSyncExternalStore(subscribe, () => enabled, () => false)
}
export function useOwnerPresentation() {
  return useSyncExternalStore(subscribe, ownerPresentationEnabled, () => false)
}
