// 💙 PLANO CORAÇÃO · o Diego aprova/recusa no #admin e a FOTO É APAGADA NA HORA (05/11).
// Por que Edge Function e não só SQL: apagar o arquivo do Storage é pela API do Storage (com a service role). O banco grava a
// decisão (`esc_coracao_decidir`, só service role) e devolve o caminho da foto; aqui a foto é removida do bucket privado e só
// então o registro perde o caminho (`esc_coracao_foto_apagada`). Se a remoção falhar, a decisão fica valendo e o #admin mostra
// "foto ainda não apagada — apagar de novo" (ação `apagar`).
// 🔐 Quem pode: SÓ a conta do Diego (conferida pelo LOGIN/JWT, nunca pelo corpo do pedido).
import { createClient } from 'jsr:@supabase/supabase-js@2'

const ADMIN = 'diego.c.fonseca@gmail.com'
const BUCKET = 'coracao-provas'
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const resp = (status: number, corpo: unknown) => new Response(JSON.stringify(corpo), { status, headers: { ...CORS, 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return resp(405, { erro: 'metodo' })
  const url = Deno.env.get('SUPABASE_URL')!
  const jwt = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')
  const { data: u } = await createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!).auth.getUser(jwt)
  if ((u?.user?.email ?? '').toLowerCase() !== ADMIN) return resp(403, { erro: 'so_admin' })

  let id = 0, acao = ''
  try { const b = await req.json(); id = Number(b?.id); acao = String(b?.acao ?? '') } catch { /* corpo inválido */ }
  if (!Number.isInteger(id) || id <= 0 || !['aprovar', 'recusar', 'apagar'].includes(acao)) return resp(400, { erro: 'pedido' })

  const adm = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } })
  const p_aprovar = acao === 'aprovar' ? true : acao === 'recusar' ? false : null
  const { data: path, error } = await adm.rpc('esc_coracao_decidir', { p_id: id, p_aprovar })
  if (error) return resp(409, { erro: /JA_DECIDIDO/.test(error.message) ? 'ja_decidido' : /SEM_DECISAO/.test(error.message) ? 'sem_decisao' : 'banco' })

  // 🗑️ a foto sai do bucket AGORA (path nulo = já tinha saído)
  if (typeof path === 'string' && path) {
    const { error: e2 } = await adm.storage.from(BUCKET).remove([path])
    if (e2) { console.error('coracao-decidir: não apagou a foto', id, e2.message); return resp(200, { ok: true, foto_apagada: false }) }
  }
  const { error: e3 } = await adm.rpc('esc_coracao_foto_apagada', { p_id: id })
  if (e3) return resp(200, { ok: true, foto_apagada: false })
  return resp(200, { ok: true, foto_apagada: true })
})
