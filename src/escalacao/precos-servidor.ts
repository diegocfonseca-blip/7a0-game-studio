// ─── 💳 O PREÇO QUE A TELA MOSTRA É O PREÇO QUE O PIX COBRA (13/11) ───────────────────────────────────────────────
// Diego: *"arrume toda a questão do atual dos preços"*. Três telas calculavam o preço de subir de plano por conta própria e
// erravam contra o servidor: o Craque MENSAL via "+ R$ 55" no Batismo e o Pix cobrava 79,90 (EhuLaion FC); quem comprou o Lenda a
// 59,90 via a subida calculada em cima de 44,90 (mais cara que o Pix); e a vitrine nova mostrava preço cheio pra quem já tinha plano.
// Regra de ouro contra botão mudo: a tela lê a MESMA conta do motor. Aqui a tela pergunta ao banco (`esc_mp_meus_precos`, que chama
// o mesmo `esc_mp_preco` do Pix) quanto custa cada plano PRA ESTA CONTA. Sem resposta (deslogado, rede, função ainda não criada),
// cai na conta local de sempre (`precoSubida`), então nada quebra.
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { precoSubida, type PlanoUnico } from './planos-regras'

let srv: Partial<Record<PlanoUnico, number>> = {}
let quando = 0
const ouvintes = new Set<() => void>()
const avisa = () => ouvintes.forEach(f => f())

/** pergunta ao banco (no máximo a cada 20 s, ou na hora se `forca`) */
export function relePrecos(forca = false): void {
  if (!forca && Date.now() - quando < 20_000) return
  quando = Date.now()
  supabase.rpc('esc_mp_meus_precos').then(({ data, error }) => {
    if (error || !data || typeof data !== 'object') return
    const n: Partial<Record<PlanoUnico, number>> = {}
    for (const k of ['craque', 'lenda', 'batismo', 'fundador'] as const) {
      const v = Number((data as Record<string, unknown>)[k])
      if (Number.isFinite(v) && v > 0) n[k] = v
    }
    srv = n; avisa()
  }, () => { /* sem rede: fica a conta local */ })
}
// trocou de conta: esquece os preços da conta anterior
try { supabase.auth.onAuthStateChange(ev => { if (ev === 'SIGNED_IN' || ev === 'SIGNED_OUT') { srv = {}; quando = 0; avisa() } }) } catch { /* ignora */ }

/** o preço de chegar em `alvo` pra esta conta: o do banco quando ele respondeu, senão a conta local (`fixo` = plano pago pra sempre) */
export function usePrecoMeu(): (alvo: PlanoUnico, fixo: PlanoUnico | null) => number {
  const [, t] = useState(0)
  useEffect(() => { const f = () => t(x => x + 1); ouvintes.add(f); relePrecos(); return () => { ouvintes.delete(f) } }, [])
  return (alvo, fixo) => srv[alvo] ?? precoSubida(alvo, fixo)
}
