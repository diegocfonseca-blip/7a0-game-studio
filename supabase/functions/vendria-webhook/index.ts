// ─── 🔌 VENDRIA → LEILÃO LEGENDS (14/10) ──────────────────────────────────────
// Diego: "preciso também criar a integração com a Vendria". Pela documentação dele (prints de 14/10):
//   · a Vendria faz POST com o corpo bruto e os cabeçalhos Webhook-Id, Webhook-Timestamp, Webhook-Signature e
//     Webhook-Secret-Version;
//   · assina `<Webhook-Id>.<Webhook-Timestamp>.<corpo bruto>` com HMAC-SHA256, em base64url, prefixo `v1,`;
//   · a entrega é "pelo menos uma vez" (pode repetir e vir fora de ordem) → dedupe pelo `id` do envelope.
//
// 🛡️ FASE 1: RECEBE, CONFERE A ASSINATURA E GUARDA. (FASE 2, 26/10: eventos de assinatura ligam o Craque mensal — ver no fim.) (Texto de 14/10:) a documentação não
//    mostra onde vêm o e-mail do comprador e o produto, e a regra do Diego é nunca liberar nada por informação não
//    verificada. Com o primeiro pedido de verdade guardado em `esc_vendria_eventos`, a fase 2 lê os campos reais e
//    liga a entrega (Sócio / Batismo / Batismo Lenda) pelo e-mail.
// 🔑 O segredo `whsec_…` mora SÓ no Supabase (Edge Functions → Secrets → VENDRIA_WEBHOOK_SECRET; numa troca de segredo,
//    a versão nova vai em VENDRIA_WEBHOOK_SECRET_<versão>). Nunca no código, nunca no chat.
import { createClient } from 'jsr:@supabase/supabase-js@2'

const TOLERANCIA_S = 300 // 5 min: timestamp mais velho que isso é recusado (replay)
const enc = new TextEncoder()

function b64url(buf: ArrayBuffer): string {
  let s = ''; for (const b of new Uint8Array(buf)) s += String.fromCharCode(b)
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
function b64decode(s: string): Uint8Array | null {
  try { const t = s.replace(/-/g, '+').replace(/_/g, '/'); const bin = atob(t + '==='.slice((t.length + 3) % 4)); return Uint8Array.from(bin, c => c.charCodeAt(0)) } catch { return null }
}
async function hmac(chave: Uint8Array, msg: string): Promise<string> {
  const k = await crypto.subtle.importKey('raw', chave, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return b64url(await crypto.subtle.sign('HMAC', k, enc.encode(msg)))
}
function iguais(a: string, b: string): boolean { // comparação em tempo constante
  if (a.length !== b.length) return false
  let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return r === 0
}
// o segredo pode ser usado como texto inteiro ou como a parte em base64 depois de "whsec_" — aceita os dois jeitos
// (os dois exigem conhecer o segredo; a doc não diz qual dos dois a Vendria usa).
function chavesDo(segredo: string): Uint8Array[] {
  const out = [enc.encode(segredo)]
  if (segredo.startsWith('whsec_')) { const d = b64decode(segredo.slice(6)); if (d) out.push(d) }
  return out
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('método não aceito', { status: 405 })
  const corpo = await req.text() // bytes brutos ANTES de qualquer parse
  const id = req.headers.get('Webhook-Id') ?? ''
  const ts = req.headers.get('Webhook-Timestamp') ?? ''
  const assinatura = req.headers.get('Webhook-Signature') ?? ''
  const versao = (req.headers.get('Webhook-Secret-Version') ?? '').replace(/[^A-Za-z0-9_]/g, '')
  if (!id || !ts || !assinatura) return new Response('cabeçalhos faltando', { status: 400 })
  const tsN = Number(ts); const agora = Math.floor(Date.now() / 1000)
  const tsS = tsN > 1e12 ? Math.floor(tsN / 1000) : tsN // aceita segundos ou milissegundos
  if (!Number.isFinite(tsS) || Math.abs(agora - tsS) > TOLERANCIA_S) return new Response('timestamp fora da tolerância', { status: 400 })
  const segredo = (versao && Deno.env.get(`VENDRIA_WEBHOOK_SECRET_${versao}`)) || Deno.env.get('VENDRIA_WEBHOOK_SECRET')
  if (!segredo) return new Response('segredo não configurado', { status: 500 }) // 5xx: a Vendria tenta de novo depois
  const msg = `${id}.${ts}.${corpo}`
  const recebidas = assinatura.split(/\s+/).filter(Boolean) // pode vir mais de uma (troca de segredo)
  let ok = false
  for (const chave of chavesDo(segredo)) {
    const esperado = 'v1,' + await hmac(chave, msg)
    if (recebidas.some(r => iguais(r, esperado))) { ok = true; break }
  }
  if (!ok) return new Response('assinatura inválida', { status: 401 })

  let ev: { id?: string; type?: string; schemaVersion?: string; occurredAt?: string; data?: { order?: { id?: string }; subscription?: unknown } }
  try { ev = JSON.parse(corpo) } catch { return new Response('json inválido', { status: 400 }) }
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } })
  // dedupe pelo id do envelope: repetição da mesma entrega não grava duas vezes
  const { error } = await db.from('esc_vendria_eventos').upsert({
    id: ev.id ?? id, tipo: ev.type ?? 'desconhecido', schema_version: ev.schemaVersion ?? null,
    ocorrido_em: ev.occurredAt ?? null, pedido_id: ev.data?.order?.id ?? null, payload: ev,
  }, { onConflict: 'id', ignoreDuplicates: true })
  if (error) return new Response('falha ao guardar', { status: 500 }) // a Vendria tenta de novo
  // ⭐📅 FASE 2 (26/10): evento de ASSINATURA (começou, renovou, cancelou…) liga o Craque mensal pelo e-mail de quem pagou.
  // `esc_vendria_aplica` decide tudo no banco: só a chave de serviço chama, o plano sai do VALOR cobrado (990 = Craque Salas ·
  // 1490 = Craque Completo), o prazo é o `accessEndsAt` da Vendria e nunca encurta. É idempotente: repetição não dá mês a mais.
  if ((ev.type ?? '').startsWith('subscription.') || (ev.data as Record<string, unknown> | undefined)?.subscription) {
    const { error: e2 } = await db.rpc('esc_vendria_aplica', { p_ev: ev })
    if (e2) return new Response('falha ao aplicar', { status: 500 }) // a Vendria tenta de novo; aplicar 2× não muda nada
  }
  return new Response(null, { status: 204 })
})
