// 💳 MERCADO PAGO · cria um PIX ÚNICO pra quem está logado (15/10).
// O cliente só diz QUAL produto quer. Quem é a pessoa sai do LOGIN (JWT) e o PREÇO sai do banco (`esc_mp_criar_pedido`,
// mesma régua de `PRECOS_UNICO`/`precoSubida`). O Pix nasce com `external_reference` = id do pedido, e é por ele que o
// `mp-webhook` acha o pedido quando o Mercado Pago avisar que pagou. O token mora só nas Secrets (`MP_ACCESS_TOKEN`).
import { createClient } from 'jsr:@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const NOMES: Record<string, string> = {
  craque: 'Plano Craque', lenda: 'Plano Lenda', batismo: 'Plano Batismo', fundador: 'Plano Fundador',
  salas_extras: '3 salas extras', teste: 'Teste de pagamento',
  moedas_10: '30 moedas', moedas_50: '150 moedas', moedas_100: '300 moedas', canto: 'Canto da torcida', presente: 'Presente de plano',
  moedas_500: '1.500 moedas', moedas_1000: '3.000 moedas', dia_marca: 'Dia da marca', // 16/10 (publicado com o OK do Diego)
  giro_dia: 'Anúncio no giro (1 dia)', // 16/10: Diego pediu o anúncio de 25 na Loja
  ficha_carreira: 'Ficha extra de carreira', // 17/10: +1 carreira salva, R$ 9,99
  tema_coracao: 'Tema da sala · time de coração', tema_clube: 'Tema da sala · seu clube', // 18/10: temas da sala de espera, R$ 9,90
  giro_hora: 'Anúncio no giro (1 hora)', recado_hora: 'Recado em destaque (1 hora)', recado_dia: 'Recado em destaque (dia todo)', // 18/10: recado de jogador + anúncio de 1 h
  peca_presidente: 'Peça do presidente', // 19/10: roupa/cabelo/barba avulsos (1,99 · 2,99 · 3,99 · 4,99), ref r-<roupa> / p-<peça>
}
// ⏳ o Pix vale 24 h (Diego 15/10: tem gente que só paga quando chega em casa)
const VALIDADE_MIN = 24 * 60
const resp = (status: number, corpo: unknown) => new Response(JSON.stringify(corpo), { status, headers: { ...CORS, 'Content-Type': 'application/json' } })
// o MP quer a validade com fuso: devolve no horário de Brasília (-03:00)
const validade = (min: number) => {
  const d = new Date(Date.now() + min * 60_000 - 3 * 3600_000)
  return d.toISOString().replace('Z', '-03:00')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return resp(405, { erro: 'metodo' })
  // (o Diego salvou com a letra trocada — `MP_ACESSS_TOKEN` — e as duas grafias valem)
  const token = Deno.env.get('MP_ACCESS_TOKEN') ?? Deno.env.get('MP_ACESSS_TOKEN')
  if (!token) return resp(500, { erro: 'sem_token' })
  const url = Deno.env.get('SUPABASE_URL')!
  const jwt = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')
  const anon = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!)
  const { data: u } = await anon.auth.getUser(jwt)
  const email = u?.user?.email?.toLowerCase()
  if (!email) return resp(401, { erro: 'sem_login' })
  let produto = '', telefone = '', ref = ''
  try { const b = await req.json(); produto = String(b?.produto ?? ''); telefone = String(b?.telefone ?? '').replace(/\D/g, '').slice(0, 13); ref = String(b?.ref ?? '').replace(/[^\w-]/g, '').slice(0, 40) /* 19/10: 20→40 (a ref de peça do presidente passa de 20 letras) */ } catch { /* corpo inválido */ }
  if (!NOMES[produto]) return resp(400, { erro: 'produto' })

  const adm = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const { data: ped, error } = await adm.rpc('esc_mp_criar_pedido', { p_email: email, p_produto: produto, p_telefone: telefone || null, p_ref: ref })
  if (error || !ped?.[0]) return resp(409, { erro: /JA_TEM/.test(error?.message ?? '') ? 'ja_tem' : 'pedido' })
  const { pedido_id, valor } = ped[0] as { pedido_id: string; valor: number }

  const r = await fetch('https://api.mercadopago.com/v1/payments', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'X-Idempotency-Key': pedido_id },
    body: JSON.stringify({
      transaction_amount: Number(valor),
      description: `Leilão Legends — ${NOMES[produto]}`,
      payment_method_id: 'pix',
      payer: { email },
      external_reference: pedido_id,
      notification_url: `${url}/functions/v1/mp-webhook`,
      date_of_expiration: validade(VALIDADE_MIN),
    }),
  })
  const pg = await r.json().catch(() => null)
  const td = pg?.point_of_interaction?.transaction_data
  if (!r.ok || !td?.qr_code) {
    console.error('mp-criar-pix: MP recusou', r.status, pg?.message ?? pg?.error ?? '')
    return resp(502, { erro: 'mp', status: r.status })
  }
  const expira = new Date(Date.now() + VALIDADE_MIN * 60_000).toISOString()
  await adm.rpc('esc_mp_anota_pix', { p_pedido: pedido_id, p_mp_id: String(pg.id), p_mp_status: String(pg.status ?? ''), p_qr: td.qr_code, p_qr64: td.qr_code_base64 ?? null, p_expira: expira })
  return resp(200, { pedido_id, valor: Number(valor), qr_code: td.qr_code, qr_code_base64: td.qr_code_base64, expira_em: expira })
})
