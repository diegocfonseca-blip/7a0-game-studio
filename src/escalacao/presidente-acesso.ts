import { useSyncExternalStore } from 'react'
import { supabase } from '../lib/supabase'

// Prévia de apresentação local. Nunca vai para o estado compartilhado da sala.
// Não é uma autorização de dados: RLS e permissões do host continuam independentes.
export function presidentPreviewEmail(email?: string | null): boolean {
  return ['diego.c.fonseca@gmail.com'].includes((email ?? '').trim().toLowerCase())
}

let enabled = false
export function presidentPreviewEnabled() { return enabled }
// ⏳ 24/10 (Diego: *"tá aparecendo o mapa da maquete em alguns segundos… e depois, logo em seguida, aparece o mapa imersivo"*):
// enquanto a conta ainda está sendo conferida no servidor, `enabled` é false e a aba Clube desenhava a MAQUETE por uns
// segundos. Se a sessão guardada NESTE aparelho já é da conta liberada, a tela espera a conferência (em vez de mostrar a
// maquete). Só muda o que aparece durante a espera: quem libera continua sendo o servidor (`verify`).
let checked = false
function emailDaSessaoLocal(): string | null {
  try {
    for (const k of Object.keys(localStorage)) {
      if (!/^sb-.*-auth-token$/.test(k)) continue
      const v = JSON.parse(localStorage.getItem(k) || 'null')
      return v?.user?.email ?? v?.currentSession?.user?.email ?? null
    }
  } catch { /* sem localStorage: segue o caminho de sempre */ }
  return null
}
const provavel = presidentPreviewEmail(emailDaSessaoLocal())
const pendenteAgora = () => provavel && !checked
export function usePresidentPreviewPending() {
  return useSyncExternalStore(subscribe, pendenteAgora, () => false)
}
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
    if (version === revision) publish(!error && presidentPreviewEmail(data.user?.email))
  } catch { if (version === revision) publish(false) }
  if (version === revision && !checked) { checked = true; listeners.forEach(listener => listener()) }
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
export function usePresidentPreview() {
  return useSyncExternalStore(subscribe, () => enabled, () => false)
}

// Lote 1 autorizado: criação, perfil e sala. Continua restrito à conta verificada.
// Economia, garagem, teto e troca do estádio têm chaves separadas desligadas.
export const PRESIDENT_INTEGRATION_RELEASED:boolean=true
export const presidentWritesEnabled=()=>PRESIDENT_INTEGRATION_RELEASED&&presidentPreviewEnabled()
