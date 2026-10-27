// ⭐📅 VENDRIA · cria a ASSINATURA mensal do Craque pra quem está logado (27/10).
// Diego: "o jogo precisa liberar o e-mail de quem paga na hora". Igual ao `mp-criar-pix`: o cliente só diz QUAL plano quer;
// quem é a pessoa sai do LOGIN (JWT) e o preço sai daqui (9,90 · 14,90, a mesma régua de `MENSAIS`). O pedido nasce pela API
// da Vendria com o e-mail da conta + `reference` nossa, e fica anotado em `esc_vendria_pedidos` — é por ele que o
// `vendria-webhook` acha de quem é o pagamento. A chave mora só nas Secrets (`VENDRIA_API_KEY`).
// 🛡️ Criar o pedido não libera nada: só o aviso `order.paid` assinado pela Vendria + a conferência na API.
import { createClient } from 'jsr:@supabase/supabase-js@2'

const API = 'https://app.vendria.com.br/api/v1'
const SITE = 'https://leilaolegends.com/'
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const PLANOS: Record<string, { centavos: number; nome: string }> = {
  craque_salas: { centavos: 990, nome: '⭐ Craque Salas · Leilão Legends' },
  craque_completo: { centavos: 1490, nome: '⭐ Craque Completo · Leilão Legends' },
}
const resp = (status: number, corpo: unknown) => new Response(JSON.stringify(corpo), { status, headers: { ...CORS, 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return resp(405, { erro: 'metodo' })
  const chave = Deno.env.get('VENDRIA_API_KEY')
  if (!chave) return resp(500, { erro: 'sem_chave' })
  const url = Deno.env.get('SUPABASE_URL')!
  const jwt = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')
  const { data: u } = await createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!).auth.getUser(jwt)
  const email = u?.user?.email?.toLowerCase()
  if (!email) return resp(401, { erro: 'sem_login' })
  let plano = ''
  try { plano = String((await req.json())?.plano ?? '') } catch { /* corpo vazio */ }
  const p = PLANOS[plano]
  if (!p) return resp(400, { erro: 'plano' })

  const adm = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  // já assina este (ou o Completo, que tem tudo do Salas) e está em dia → não cobra de novo
  const { data: ja } = await adm.from('esc_assinatura_mensal').select('plano,valido_ate,cancelada_em').eq('email', email).maybeSingle()
  if (ja && new Date(ja.valido_ate) > new Date() && !ja.cancelada_em && (ja.plano === plano || ja.plano === 'craque_completo')) return resp(409, { erro: 'ja_tem' })
  // trava contra clique repetido: no máximo 6 pedidos por conta em 10 min
  const { count } = await adm.from('esc_vendria_pedidos').select('order_id', { count: 'exact', head: true }).eq('email', email).gte('criado_em', new Date(Date.now() - 10 * 60_000).toISOString())
  if ((count ?? 0) >= 6) return resp(429, { erro: 'muitos' })

  const r = await fetch(API + '/orders', {
    method: 'POST',
    headers: { Authorization: `Bearer ${chave}`, 'Content-Type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({
      buyer: { email },
      reference: `ll-${plano}-${crypto.randomUUID()}`,
      description: p.nome,
      totalInCents: p.centavos,
      billing: { type: 'SUBSCRIPTION', interval: 'MONTHLY' },
      allowedPaymentMethods: ['PIX_AUTOMATIC'],
      passPlatformFeeToBuyer: true,
      successUrl: SITE + '?assinatura=ok',
      cancelUrl: SITE,
    }),
  })
  let j: { data?: { id?: string; checkoutUrl?: string }; error?: { code?: string; requestId?: string } } = {}
  try { j = await r.json() } catch { /* sem corpo */ }
  if (!r.ok || !j.data?.id || !j.data.checkoutUrl) {
    console.error('vendria-checkout: pedido recusado', r.status, j.error?.code, j.error?.requestId)
    return resp(502, { erro: 'vendria', codigo: j.error?.code ?? null })
  }
  const { error } = await adm.from('esc_vendria_pedidos').insert({ order_id: j.data.id, email, plano, checkout_url: j.data.checkoutUrl })
  if (error) return resp(500, { erro: 'guardar' }) // sem a anotação o pagamento não teria dono: não entrega o link
  return resp(200, { url: j.data.checkoutUrl })
})
