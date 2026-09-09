import { useSyncExternalStore } from 'react'
import { supabase } from '../lib/supabase'

// Prévia de apresentação local. Nunca vai para o estado compartilhado da sala.
// Não é uma autorização de dados: RLS e permissões do host continuam independentes.
export function onlinePreviewEmail(email?: string | null): boolean {
  return ['diego.c.fonseca@gmail.com', 'diego.c.fonseca2@gmail.com'].includes((email ?? '').trim().toLowerCase())
}

let enabled = false
export function onlinePreviewEnabled() { return enabled }
let started = false
let revision = 0
const listeners = new Set<() => void>()
function publish(value: boolean) {
  if (enabled === value) return
  enabled = value
  listeners.forEach(listener => listener())
}
async function verify() {
  const version = ++revision
  try {
    const { data, error } = await supabase.auth.getUser()
    if (version === revision) publish(!error && onlinePreviewEmail(data.user?.email))
  } catch { if (version === revision) publish(false) }
}
function start() {
  if (started) return
  started = true
  supabase.auth.onAuthStateChange(() => {
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
