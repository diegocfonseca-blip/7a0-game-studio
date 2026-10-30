// ⭐📅 27/10 — ASSINAR O CRAQUE MENSAL pela Vendria, igual ao Pix do Mercado Pago: o servidor (`vendria-checkout`) cria o pedido
// com o e-mail de quem está LOGADO, e é por esse pedido que o plano liga sozinho quando a Vendria avisa que pagou.
// Antes o botão abria um link fixo e o jogo não sabia quem pagou (26/10: 2 compras sem dono).
import { supabase } from '../lib/supabase'
import { MENSAIS } from './planos-regras'
import { foiPagar } from './conta-vez'

export type PlanoMensal = 'craque_salas' | 'craque_completo'
type Tr = (pt: string, en: string) => string

/** Abre o checkout da Vendria pra conta logada. Abre a aba ANTES de esperar o servidor (senão o celular bloqueia o pop-up). */
export async function assinarMensal(plano: PlanoMensal, tr: Tr): Promise<void> {
  const { data: s } = await supabase.auth.getSession()
  if (!s.session) { alert(tr('Entre na sua conta pra assinar: é por ela que o plano chega em você.', 'Sign in to subscribe: that is how the plan reaches you.')); return }
  foiPagar() // 💳 30/10: na volta pro jogo, relê o plano (sem precisar atualizar a página)
  const aba = window.open('', '_blank')
  try { aba?.document.write(`<p style="font:16px sans-serif;padding:24px">${tr('Abrindo o pagamento…', 'Opening the payment…')}</p>`) } catch { /* aba de outro domínio */ }
  const { data, error } = await supabase.functions.invoke('vendria-checkout', { body: { plano } })
  const url = (data as { url?: string } | null)?.url
  if (!error && url) {
    if (aba && !aba.closed) aba.location.href = url
    else window.location.href = url
    return
  }
  aba?.close()
  let cod = ''
  try { cod = (await (error as { context?: Response })?.context?.json?.())?.erro ?? '' } catch { /* sem corpo */ }
  if (cod === 'ja_tem') { alert(tr('Você já assina esse plano (ou o Completo). 😉', 'You already subscribe to this plan (or Complete). 😉')); return }
  if (cod === 'muitos') { alert(tr('Muitas tentativas seguidas. Espera uns minutos e tenta de novo.', 'Too many tries in a row. Wait a few minutes and try again.')); return }
  if (cod === 'sem_login') { alert(tr('Entre na sua conta pra assinar.', 'Sign in to subscribe.')); return }
  // 🛟 servidor fora do ar: o link antigo ainda cobra certo — o plano é ligado à mão pelo e-mail (como em 26/10)
  window.open(MENSAIS[plano].link, '_blank', 'noopener')
}
