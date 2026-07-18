import { supabase } from '../lib/supabase'

// Gravações CRÍTICAS que não podem sumir se o backend estiver fora do ar:
// - carta ganha (user_cards)
// - título/ranking (esc_results)
// Se a gravação falhar por REDE (instabilidade/manutenção), a linha é guardada
// no aparelho e re-tentada quando o jogo abrir de novo (flushPendingWrites).
// Assim, quem ganhou durante uma instabilidade NÃO perde a carta/título.
type Pending = { table: string; row: Record<string, unknown>; onConflict?: string }
const KEY = 'esc-pending-writes'

function isNet(m: string): boolean {
  return /failed to fetch|networkerror|network request failed|load failed|fetch|502|503|504|timeout|unavailable|service unavailable/i.test(m || '')
}
function load(): Pending[] { try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] } }
function save(a: Pending[]) { try { localStorage.setItem(KEY, JSON.stringify(a.slice(-80))) } catch { /* cota cheia — ignora */ } }

async function doWrite(p: Pending): Promise<{ ok: boolean; net: boolean }> {
  try {
    const q = supabase.from(p.table)
    const { error } = p.onConflict
      ? await q.upsert(p.row, { onConflict: p.onConflict })
      : await q.insert(p.row)
    if (error) return { ok: false, net: isNet(error.message) }
    return { ok: true, net: false }
  } catch (e) {
    return { ok: false, net: isNet(e instanceof Error ? e.message : String(e)) }
  }
}

// Grava agora; se falhar por rede, enfileira pra re-tentar depois. Nunca estoura.
export async function resilientWrite(p: Pending): Promise<void> {
  const r = await doWrite(p)
  if (!r.ok && r.net) { const a = load(); a.push(p); save(a) }
}

// Re-tenta tudo que ficou pendente. Chamado ao abrir o jogo. Só mantém na fila
// o que ainda falha por rede; erro não-rede (ex.: já salvo) sai da fila.
export async function flushPendingWrites(): Promise<void> {
  const a = load()
  if (!a.length) return
  const keep: Pending[] = []
  for (const p of a) {
    const r = await doWrite(p)
    if (!r.ok && r.net) keep.push(p)
  }
  save(keep)
}
