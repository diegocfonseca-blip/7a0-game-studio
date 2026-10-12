// ─── 📏 MEDIDOR DE MENSAGENS AO VIVO (Diego 13/10) ─────────────────────────────
// Pedido: *"preciso encontrar aonde tô gastando muito com realtime messages… todo mês tô
// passando muito da conta e não sei o que é"* + *"investiga se as msgs do chat, emojis que
// soltam na tela e etc gastam também"*.
//
// O Supabase cobra cada mensagem ENTREGUE (1 envio numa sala de 20 = ~20 mensagens). Então o
// jeito honesto de medir é cada aparelho contar o que RECEBE — a soma de todo mundo é a fatura.
// Também conta o que ele MANDA (pra saber quem gera) e os bytes (egress).
//
// Como: `instrumenta(canal, nome)` põe UM ouvinte coringa (`event: '*'`) no canal — isso não
// pede nada a mais pro servidor, ele já entrega tudo pro canal — e embrulha o `send`. A cada
// 10 min, e quando a pessoa sai/esconde a aba, grava UMA linha em `esc_realtime_medidor`
// (`docs/sql/medidor-realtime.sql`). Uma gravação pequena por pessoa a cada 10 min.
// ⚠️ É só régua: nada aqui decide jogo. Desligar = `MEDIDOR_LIGADO = false`.
import { supabase } from '../lib/supabase'

export const MEDIDOR_LIGADO = true
const FLUSH_MS = 10 * 60_000

type Conta = { rx: Record<string, number>; tx: Record<string, number>; rxBytes: number; txBytes: number; pessoasMax: number; desde: number }
const contas = new Map<string, Conta>() // chave = `${canal}|${sala}`
const nova = (): Conta => ({ rx: {}, tx: {}, rxBytes: 0, txBytes: 0, pessoasMax: 0, desde: Date.now() })
const tamanho = (p: unknown): number => { try { return JSON.stringify(p ?? '').length } catch { return 0 } }
const chave = (canal: string, sala: string) => `${canal}|${sala}`
let papel: 'host' | 'convidado' = 'convidado'
export function medidorPapel(host: boolean): void { papel = host ? 'host' : 'convidado' }

function pega(canal: string, sala: string): Conta {
  const k = chave(canal, sala)
  let c = contas.get(k)
  if (!c) { c = nova(); contas.set(k, c) }
  return c
}
export function medeRecebida(canal: string, sala: string, evento: string, payload: unknown): void {
  if (!MEDIDOR_LIGADO || !sala) return
  const c = pega(canal, sala)
  c.rx[evento] = (c.rx[evento] ?? 0) + 1
  c.rxBytes += tamanho(payload)
}
export function medeEnviada(canal: string, sala: string, evento: string, payload: unknown): void {
  if (!MEDIDOR_LIGADO || !sala) return
  const c = pega(canal, sala)
  c.tx[evento] = (c.tx[evento] ?? 0) + 1
  c.txBytes += tamanho(payload)
}
export function medePessoas(canal: string, sala: string, n: number): void {
  if (!MEDIDOR_LIGADO || !sala) return
  const c = pega(canal, sala)
  if (n > c.pessoasMax) c.pessoasMax = n
}

type CanalRt = {
  on: (...a: never[]) => unknown
  send: (msg: { type: string; event: string; payload?: unknown }) => unknown
  presenceState?: () => Record<string, unknown>
}
/** põe o ouvinte coringa e embrulha o `send`. Chamar ANTES do `.subscribe()`.
 *  ⚠️ `comPresenca` SÓ pra canal que JÁ usa presença: ouvir presença num canal faz o realtime-js
 *  LIGAR a presença nele (RealtimeChannel: `presence_enabled` = tem ouvinte de presença) — aí o
 *  medidor criaria mensagem nova, que é justamente o que ele existe pra cortar. */
export function instrumenta<T>(ch: T, canal: string, sala: string, comPresenca = false): T {
  if (!MEDIDOR_LIGADO || !sala || !ch) return ch
  const c = ch as unknown as CanalRt
  try {
    ;(c.on as unknown as (t: string, f: { event: string }, cb: (p: { event?: string; payload?: unknown }) => void) => unknown)(
      'broadcast', { event: '*' }, p => medeRecebida(canal, sala, p?.event ?? '?', p?.payload))
    if (comPresenca) (c.on as unknown as (t: string, f: { event: string }, cb: (p: unknown) => void) => unknown)(
      'presence', { event: '*' }, p => {
        medeRecebida(canal, sala, 'presence', p)
        try { medePessoas(canal, sala, Object.keys(c.presenceState?.() ?? {}).length) } catch { /* ignora */ }
      })
    const orig = c.send.bind(ch)
    c.send = (msg: { type: string; event: string; payload?: unknown }) => {
      medeEnviada(canal, sala, msg?.event ?? '?', msg?.payload)
      return orig(msg)
    }
  } catch { /* medir nunca quebra o canal */ }
  return ch
}

/** grava o que juntou (uma linha por canal/sala) e zera. */
export async function medidorFlush(): Promise<void> {
  if (!MEDIDOR_LIGADO || contas.size === 0) return
  const linhas = [...contas.entries()].filter(([, c]) => Object.keys(c.rx).length || Object.keys(c.tx).length)
  contas.clear()
  if (!linhas.length) return
  try {
    const { data } = await supabase.auth.getUser()
    const uid = data?.user?.id ?? null
    const agora = Date.now()
    await supabase.from('esc_realtime_medidor').insert(linhas.map(([k, c]) => {
      const [canal, sala] = k.split('|')
      return {
        user_id: uid, sala, canal, papel,
        minutos: Math.max(1, Math.round((agora - c.desde) / 60_000)),
        pessoas_max: c.pessoasMax,
        rx: c.rx, tx: c.tx, rx_bytes: c.rxBytes, tx_bytes: c.txBytes,
      }
    }))
  } catch { /* sem rede: perde só este pedaço da medição, nunca o jogo */ }
}

if (MEDIDOR_LIGADO && typeof window !== 'undefined') {
  setInterval(() => { void medidorFlush() }, FLUSH_MS)
  document.addEventListener('visibilitychange', () => { if (document.hidden) void medidorFlush() })
  window.addEventListener('pagehide', () => { void medidorFlush() })
}
