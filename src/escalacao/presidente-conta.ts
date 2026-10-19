// ─── 🧑‍💼 O PRESIDENTE É DA CONTA (15/10, Diego: "sempre com base no e-mail do usuário") ─────────────
//
// UM boneco por conta, guardado em `esc_presidente` (docs/sql/presidente-conta.sql), e não no save da carreira.
// Assim o mesmo presidente vale pra carreira, pro online e pro que vier. O save da carreira continua guardando
// uma CÓPIA (`careerPresidentBase`) só pra posse (`sinceSeason`) e pra quem ainda não tem a conta ligada.
//
// 🔒 Enquanto está em construção, só a conta do Diego liga isso (`PRESIDENTE_CONTA_TESTERS`); o resto do jogo
// continua lendo o save da carreira como sempre. Pra liberar geral: PRESIDENTE_CONTA_GERAL = true.
//
// 💳 Quem decide o que pode é o PLANO da conta (`planoAtual`, a mesma régua da Loja), via presidente-plano.ts.
// Banco fora do ar = plano nulo = a pessoa monta mas não salva; nunca se inventa plano por falta de rede.
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { loggedEmail, meusDireitos, myApoioPerk, useDireitos } from './apoio'
import { planoAtual, type PlanoUnico } from './planos-regras'
import { presidenteBaseValido, type PresidenteBaseSave } from './presidencia-carreira'
import { copiarAparencia } from './presidente-aparencia'
import { podeSalvarPresidente } from './presidente-plano'
import { esquecerPresidente } from './presidente-avatar'
import { podeUsarPecaAvulsa, podeVestirRoupaAvulsa, temBoneco, type PosseAvulsa } from './presidente-avulsas'
import { aparenciaModular } from './presidente-aparencia'
import { roupaModularValida } from './presidente-vestuario-modular'

const PRESIDENTE_CONTA_GERAL = true // 🟢 16/10: liberado pra todos (Diego: "já pode publicar p todos p personagem")
const PRESIDENTE_CONTA_TESTERS = new Set(['diego.c.fonseca@gmail.com', 'diego.c.fonseca2@gmail.com']) // 16/10: + diego2 (grátis), pra ele ver como o plano gratuito enxerga o editor e os preços
/** a conta logada já usa o presidente DA CONTA (em vez do save da carreira)? */
export function presidenteContaLiberado(email: string | null | undefined = loggedEmail()): boolean {
  return PRESIDENTE_CONTA_GERAL || (!!email && PRESIDENTE_CONTA_TESTERS.has(email.toLowerCase()))
}

/** o plano da conta pra régua do presidente — a MESMA conta da Loja do Clube (`planoAtual`) */
export function getPlanoConta(): PlanoUnico | null { return planoAtual(meusDireitos(), myApoioPerk()?.tier ?? null) }
/** hook: re-renderiza quando os direitos chegam do banco */
export function usePlanoConta(): PlanoUnico | null { const d = useDireitos(); return planoAtual(d, myApoioPerk()?.tier ?? null) }

export type EstadoPresidenteConta = { status: 'parado' | 'carregando' | 'pronto' | 'erro'; value: PresidenteBaseSave | null; email: string | null }
let estado: EstadoPresidenteConta = { status: 'parado', value: null, email: null }
const ouvintes = new Set<() => void>()
let pedido = 0
function muda(novo: EstadoPresidenteConta) { estado = novo; ouvintes.forEach(f => { try { f() } catch { /* ignora */ } }) }

/** o visual que vai pro banco: só o que é da PESSOA (posse `sinceSeason` é da carreira, fica fora) */
function limpaVisual(v: PresidenteBaseSave): PresidenteBaseSave {
  return { version: 5, name: v.name.trim().slice(0, 40), outfit: v.outfit, ...(v.appearance ? { appearance: copiarAparencia(v.appearance) } : {}) }
}

/** lê o presidente da conta (uma vez por login; `force` relê) */
export async function carregarPresidenteConta(force = false): Promise<PresidenteBaseSave | null> {
  const email = loggedEmail()
  if (!email || !presidenteContaLiberado(email)) { if (estado.status !== 'parado') muda({ status: 'parado', value: null, email: null }); return null }
  if (!force && estado.status === 'pronto' && estado.email === email) return estado.value
  const n = ++pedido
  muda({ ...estado, status: 'carregando', email })
  try {
    const { data: u } = await supabase.auth.getUser()
    const uid = u.user?.id
    if (!uid) throw new Error('sem login')
    const { data, error } = await supabase.from('esc_presidente').select('visual').eq('user_id', uid).maybeSingle()
    if (n !== pedido) return estado.value
    if (error) throw error
    const v = data?.visual
    muda({ status: 'pronto', value: presidenteBaseValido(v) ? limpaVisual(v) : null, email })
    return estado.value
  } catch {
    if (n === pedido) muda({ ...estado, status: 'erro' })
    return null
  }
}

// ─── 🛍️ PEÇAS AVULSAS COMPRADAS (19/10) — refs `r-<roupa>`/`p-<peça>` que o Pix entregou em `esc_presidente_pecas` ─────
// Quem grava é o BANCO (só quando o Pix cai). Aqui só se LÊ, uma vez por login; depois de pagar, `recarregarMinhasPecas()`.
let pecas: { email: string | null; lista: readonly string[] } = { email: null, lista: [] }
const ouvintesPecas = new Set<() => void>()
let pedidoPecas = 0
export function getMinhasPecas(): readonly string[] { return pecas.email && pecas.email === loggedEmail() ? pecas.lista : [] }
export async function recarregarMinhasPecas(): Promise<readonly string[]> {
  const email = loggedEmail()
  const n = ++pedidoPecas
  if (!email) { pecas = { email: null, lista: [] }; ouvintesPecas.forEach(f => f()); return [] }
  try {
    const { data, error } = await supabase.rpc('esc_minhas_pecas')
    if (n !== pedidoPecas || error) return getMinhasPecas()
    pecas = { email, lista: Array.isArray(data) ? data.filter((x): x is string => typeof x === 'string') : [] }
    ouvintesPecas.forEach(f => { try { f() } catch { /* ignora */ } })
  } catch { /* sem rede: fica o que tinha */ }
  return getMinhasPecas()
}
/** o que a conta tem pra régua do presidente: plano + peças compradas */
export function getPosseConta(): PosseAvulsa { return { plano: getPlanoConta(), compradas: getMinhasPecas() } }
/** hook: plano + peças (carrega as peças na 1ª vez) */
export function usePosseConta(): PosseAvulsa {
  const plano = usePlanoConta()
  const [, bump] = useState(0)
  useEffect(() => {
    const f = () => bump(n => n + 1)
    ouvintesPecas.add(f)
    if (pecas.email !== loggedEmail()) void recarregarMinhasPecas()
    return () => { ouvintesPecas.delete(f) }
  }, [])
  return { plano, compradas: getMinhasPecas() }
}
/** o visual cabe no que a conta tem? (roupa, cabelo, barba e cada acessório) — a MESMA régua da tela e do Pix */
export function visualCabeNaPosse(v: PresidenteBaseSave, p: PosseAvulsa): boolean {
  if (!temBoneco(p) || !roupaModularValida(v.outfit) || !podeVestirRoupaAvulsa(v.outfit, p)) return false
  if (podeSalvarPresidente(p.plano)) return true // plano: todo o rosto é dele
  const a = v.appearance ? aparenciaModular(v.appearance) : null
  if (!a) return false
  return podeUsarPecaAvulsa(a.hair, p) && podeUsarPecaAvulsa(a.beard, p) && a.accessories.every(id => podeUsarPecaAvulsa(id, p))
}

/** grava o presidente da conta. Com plano (Craque+) ou com roupa avulsa comprada, e só com o que a conta tem — a MESMA régua da tela. */
export async function salvarPresidenteConta(v: PresidenteBaseSave): Promise<boolean> {
  const posse = getPosseConta()
  if (!presidenteBaseValido(v) || !v.name.trim() || !visualCabeNaPosse(v, posse)) return false
  try {
    const { data: u } = await supabase.auth.getUser()
    const uid = u.user?.id, email = u.user?.email?.toLowerCase() ?? null
    if (!uid || !presidenteContaLiberado(email)) return false
    const visual = limpaVisual(v)
    const { error } = await supabase.from('esc_presidente').upsert({ user_id: uid, email, visual, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
    if (error) return false
    muda({ status: 'pronto', value: visual, email })
    esquecerPresidente() // 🧑‍💼 a minha linha na sala muda na hora (presidente-avatar.tsx)
    return true
  } catch { return false }
}

/** hook: o presidente da conta (carrega sozinho na 1ª vez) */
export function usePresidenteConta(): EstadoPresidenteConta {
  const [, bump] = useState(0)
  useEffect(() => {
    const f = () => bump(n => n + 1)
    ouvintes.add(f)
    if (estado.status === 'parado' || estado.status === 'erro') void carregarPresidenteConta()
    return () => { ouvintes.delete(f) }
  }, [])
  return estado
}

// trocou de conta / deslogou: zera e, se alguém está olhando, relê. Nunca espera o Supabase DENTRO do callback.
supabase.auth.onAuthStateChange(() => {
  pedido++
  if (pecas.email !== loggedEmail()) { pedidoPecas++; pecas = { email: null, lista: [] }; if (ouvintesPecas.size) queueMicrotask(() => { void recarregarMinhasPecas() }) }
  muda({ status: 'parado', value: null, email: null })
  if (ouvintes.size) queueMicrotask(() => { void carregarPresidenteConta() })
})
