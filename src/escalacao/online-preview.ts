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

// 🎬 PRÉVIA VISUAL DA TRANSMISSÃO (21/09): laboratório fechado SOMENTE na conta
// principal do Diego. É uma camada de CSS/apresentação — não muda regra, placar,
// resultado nem o estado compartilhado da sala. A segunda conta de testes segue
// vendo o visual online já aprovado, mas não recebe esta rodada nova antes da hora.
const CINEMA_EMAIL = 'diego.c.fonseca@gmail.com'
let cinemaEnabled = false
let cinemaStarted = false
let cinemaRevision = 0
const cinemaListeners = new Set<() => void>()
function publishCinema(value: boolean) {
  if (cinemaEnabled === value) return
  cinemaEnabled = value
  cinemaListeners.forEach(listener => listener())
}
async function verifyCinema() {
  const version = ++cinemaRevision
  try {
    const { data, error } = await supabase.auth.getUser()
    const email = (data.user?.email ?? '').trim().toLowerCase()
    if (version === cinemaRevision) publishCinema(!error && email === CINEMA_EMAIL)
  } catch { if (version === cinemaRevision) publishCinema(false) }
}
function startCinema() {
  if (cinemaStarted) return
  cinemaStarted = true
  supabase.auth.onAuthStateChange(() => {
    ++cinemaRevision
    publishCinema(false)
    queueMicrotask(() => { void verifyCinema() })
  })
  void verifyCinema()
}
function subscribeCinema(listener: () => void) {
  cinemaListeners.add(listener)
  startCinema()
  return () => { cinemaListeners.delete(listener) }
}
export function useOnlineCinemaPreview() {
  return useSyncExternalStore(subscribeCinema, () => cinemaEnabled, () => false)
}
