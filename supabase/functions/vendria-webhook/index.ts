// ─── 🔌 VENDRIA → LEILÃO LEGENDS (14/10) ──────────────────────────────────────
// Diego: "preciso também criar a integração com a Vendria". Pela documentação dele (prints de 14/10):
//   · a Vendria faz POST com o corpo bruto e os cabeçalhos Webhook-Id, Webhook-Timestamp, Webhook-Signature e
//     Webhook-Secret-Version;
//   · assina `<Webhook-Id>.<Webhook-Timestamp>.<corpo bruto>` com HMAC-SHA256, em base64url, prefixo `v1,`;
//   · a entrega é "pelo menos uma vez" (pode repetir e vir fora de ordem) → dedupe pelo `id` do envelope.
//
// 🛡️ FASE 1: RECEBE, CONFERE A ASSINATURA E GUARDA. (FASE 2, 26/10: eventos de assinatura ligam o Craque mensal. FASE 3, 27/10: o dono sai do pedido criado pela API — ver no fim.) (Texto de 14/10:) a documentação não
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
  // ⭐📅 FASE 3 (27/10): o pedido nasce pela API (`vendria-checkout`) com o e-mail de quem está logado, anotado em
  // `esc_vendria_pedidos`. Aqui o aviso só diz QUAL pedido/assinatura mexeu; o dono sai da nossa anotação e o estado (pago?
  // até quando?) sai da API da Vendria — nunca do corpo do aviso. Assim não depende do `subscription.started`, que em 26/10
  // não veio mesmo com a assinatura ATIVA lá.
  try { await aplicaPelaApi(db, ev) } catch (e) { console.error('vendria-webhook: aplicar pela API falhou', String(e)); return new Response('falha ao aplicar', { status: 500 }) }
  // (FASE 2, 26/10, mantida pros pedidos antigos do link fixo: evento de assinatura com e-mail do comprador)
  if ((ev.type ?? '').startsWith('subscription.') || (ev.data as Record<string, unknown> | undefined)?.subscription) {
    const { error: e2 } = await db.rpc('esc_vendria_aplica', { p_ev: ev })
    if (e2) return new Response('falha ao aplicar', { status: 500 }) // a Vendria tenta de novo; aplicar 2× não muda nada
  }
  return new Response(null, { status: 204 })
})

const API = 'https://app.vendria.com.br/api/v1'
type Db = ReturnType<typeof createClient>
async function vendria(caminho: string): Promise<Record<string, any> | null> {
  const chave = Deno.env.get('VENDRIA_API_KEY'); if (!chave) return null
  const r = await fetch(API + caminho, { headers: { Authorization: `Bearer ${chave}`, accept: 'application/json' } })
  if (r.status === 404) return null
  if (!r.ok) throw Error('vendria ' + r.status) // 5xx/timeout → a Vendria repete o aviso
  return (await r.json())?.data ?? null
}
// acha o dono pela anotação do pedido (1º pagamento) ou pela assinatura (renovações) e liga/prorroga/encerra pelo estado da API
async function aplicaPelaApi(db: Db, ev: { type?: string; data?: Record<string, any> }) {
  const tipo = ev.type ?? ''
  const orderId: string | undefined = ev.data?.order?.id
  let subId: string | undefined = ev.data?.subscription?.id
  const firstOrder: string | undefined = ev.data?.subscription?.firstOrderId
  let ped: { order_id: string; email: string; plano: string; sub_id: string | null } | null = null
  if (orderId) {
    const { data } = await db.from('esc_vendria_pedidos').select('order_id,email,plano,sub_id').eq('order_id', orderId).maybeSingle()
    ped = data
    if (!ped && tipo === 'order.paid') { // renovação: o pedido novo é da assinatura que já conhecemos
      const o = await vendria('/orders/' + orderId); subId = subId ?? o?.subscription?.id
    }
  }
  if (!ped && (subId || firstOrder)) {
    const q = db.from('esc_vendria_pedidos').select('order_id,email,plano,sub_id')
    const { data } = await (subId ? q.eq('sub_id', subId) : q.eq('order_id', firstOrder!)).maybeSingle()
    ped = data
    if (!ped && firstOrder) { const { data: d2 } = await db.from('esc_vendria_pedidos').select('order_id,email,plano,sub_id').eq('order_id', firstOrder).maybeSingle(); ped = d2 }
  }
  if (!ped) return // pedido do link antigo ou de outro produto (Parceiro): não é desta régua
  if (tipo === 'order.paid' && orderId === ped.order_id) {
    const o = await vendria('/orders/' + orderId)
    if (o?.status !== 'PAID') return // o aviso diz "pago", mas quem manda é o estado na Vendria
    subId = subId ?? o.subscription?.id
    await db.from('esc_vendria_pedidos').update({ pago_em: o.paidAt ?? new Date().toISOString(), sub_id: subId ?? null }).eq('order_id', orderId)
  }
  subId = subId ?? ped.sub_id ?? undefined
  if (!subId) { // pago e a Vendria ainda não amarrou a assinatura: libera o mês pago (31 dias); a renovação prorroga depois
    if (tipo === 'order.paid') await db.rpc('esc_vendria_libera', { p_email: ped.email, p_plano: ped.plano, p_ate: new Date(Date.now() + 31 * 864e5).toISOString(), p_sub: null })
    return
  }
  if (!ped.sub_id) await db.from('esc_vendria_pedidos').update({ sub_id: subId }).eq('order_id', ped.order_id)
  const s = await vendria('/subscriptions/' + subId)
  const mesPago = () => db.rpc('esc_vendria_libera', { p_email: ped!.email, p_plano: ped!.plano, p_ate: new Date(Date.now() + 31 * 864e5).toISOString(), p_sub: subId })
  if (!s) { if (tipo === 'order.paid') await mesPago(); return }
  const fim = s.status === 'ENDED' || !!s.endedAt
  const ate = fim ? (s.endedAt ?? new Date().toISOString()) : s.currentPeriodEnd
  if (!ate) return
  if (!fim && !['ACTIVE', 'PAST_DUE', 'CANCELLED'].includes(s.status)) { if (tipo === 'order.paid') await mesPago(); return } // assinatura ainda amarrando: o mês pago vale
  const { error } = await db.rpc('esc_vendria_libera', { p_email: ped.email, p_plano: ped.plano, p_ate: ate, p_sub: subId, p_cancel: s.cancelledAt ?? null, p_fim: fim })
  if (error) throw Error(error.message)
}
