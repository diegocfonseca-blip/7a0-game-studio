// 📬 MERCADO PAGO · aviso de pagamento (15/10). verify_jwt OFF: quem prova que é o MP é a ASSINATURA (`x-signature`,
// HMAC-SHA256 com `MP_WEBHOOK_SECRET` sobre "id:<data.id>;request-id:<x-request-id>;ts:<ts>;").
// Mesmo assinado, o corpo do aviso NÃO é a verdade: a função BUSCA o pagamento no MP com o token e só manda pro banco o
// que o MP respondeu (status, valor, external_reference). O banco (`esc_mp_registrar_pagamento`) confere o valor com o
// pedido e só então marca pago (e libera, se o Diego ligou a liberação automática).
import { createClient } from 'jsr:@supabase/supabase-js@2'

const TOLERANCIA_S = 600
const hex = (b: ArrayBuffer) => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('')
async function hmac(chave: string, msg: string) {
  const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(chave), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return hex(await crypto.subtle.sign('HMAC', k, new TextEncoder().encode(msg)))
}
function iguais(a: string, b: string) {
  if (a.length !== b.length) return false
  let d = 0
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return d === 0
}
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('metodo', { status: 405 })
  const segredo = Deno.env.get('MP_WEBHOOK_SECRET'), token = Deno.env.get('MP_ACCESS_TOKEN')
  if (!segredo || !token) return new Response('sem_config', { status: 500 }) // 500 = o MP tenta de novo depois
  const u = new URL(req.url)
  const corpo = await req.text()
  let j: Record<string, unknown> = {}
  try { j = JSON.parse(corpo || '{}') } catch { /* aviso sem corpo */ }
  const tipo = String(u.searchParams.get('type') ?? u.searchParams.get('topic') ?? j.type ?? '')
  const dataId = String(u.searchParams.get('data.id') ?? (j.data as Record<string, unknown> | undefined)?.id ?? '')
  if (tipo !== 'payment' || !dataId) return new Response('ignorado', { status: 200 })

  // 🔐 assinatura
  const sig = req.headers.get('x-signature') ?? '', rid = req.headers.get('x-request-id') ?? ''
  const partes = Object.fromEntries(sig.split(',').map(p => p.trim().split('=').map(s => s.trim())).filter(p => p.length === 2))
  const ts = partes.ts ?? '', v1 = partes.v1 ?? ''
  if (!ts || !v1) return new Response('sem_assinatura', { status: 401 })
  const tsS = Number(ts) > 1e12 ? Number(ts) / 1000 : Number(ts)
  if (!Number.isFinite(tsS) || Math.abs(Date.now() / 1000 - tsS) > TOLERANCIA_S) return new Response('fora_do_tempo', { status: 401 })
  const idAssinado = /^[a-z0-9]+$/i.test(dataId) ? dataId.toLowerCase() : dataId
  const esperado = await hmac(segredo, `id:${idAssinado};request-id:${rid};ts:${ts};`)
  if (!iguais(esperado, v1.toLowerCase())) return new Response('assinatura', { status: 401 })

  // 🔎 a verdade vem do MP
  const r = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(dataId)}`, { headers: { Authorization: `Bearer ${token}` } })
  if (r.status === 404) return new Response('pagamento_inexistente', { status: 200 }) // ex.: o "simular" do painel
  if (!r.ok) return new Response('mp_fora', { status: 502 })
  const pg = await r.json()
  const pedido = String(pg.external_reference ?? '')
  if (!UUID.test(pedido)) return new Response('sem_pedido', { status: 200 })
  if (pg.currency_id && pg.currency_id !== 'BRL') return new Response('moeda', { status: 200 })

  const adm = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const { data, error } = await adm.rpc('esc_mp_registrar_pagamento', {
    p_pedido: pedido, p_mp_id: String(pg.id), p_mp_status: String(pg.status ?? ''),
    p_valor: Number(pg.transaction_amount ?? 0),
    p_payload: { status_detail: pg.status_detail ?? null, date_approved: pg.date_approved ?? null, payment_method_id: pg.payment_method_id ?? null },
  })
  if (error) { console.error('mp-webhook: banco', error.message); return new Response('banco', { status: 500 }) }
  console.log('mp-webhook', pedido, pg.status, data)
  return new Response('ok', { status: 200 })
})
