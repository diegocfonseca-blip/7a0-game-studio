// ─── 🚑 REGISTRO DE QUEDAS DE TELA ("Ops, algo deu errado") ─────────────────
//
// Por que existe (13/09/2026): o Internacional de Madrid (Chrome no iPhone) caiu
// DUAS vezes na mesma fase da Copa com "The object can not be found here" em
// removeChild — erro que só o WebKit dá, e aqui não há WebKit pra reproduzir. O
// print mostra a pilha do React minificado (hl, ml, Sl…), que não diz NADA sobre
// qual componente do jogo estava sendo desmontado. A partir de agora, quando uma
// tela cai, gravamos numa tabela à parte (`esc_quedas`): a mensagem, a pilha de
// COMPONENTES (essa tem nome de verdade, o build guarda os nomes), o navegador, a
// tela e a versão. Mesmas regras da caixa-preta do "ENVIANDO…":
//   · nada aparece a mais pro jogador; nada muda de regra; não pesa;
//   · só escreve quando a queda acontece de verdade, no máximo 1 por meio minuto
//     por aparelho pra nunca virar enxurrada;
//   · se falhar, falha calado (try/catch em tudo, escrita solta, sem await).
import { supabase } from '../lib/supabase'

let ultima = 0
export function registraQueda(tela: string, err: unknown, componentes?: string | null, extra?: Record<string, unknown>): void {
  try {
    const agora = Date.now()
    if (agora - ultima < 30_000) return
    ultima = agora
    const e = err as { message?: unknown; stack?: unknown } | null
    const msg = String(e?.message ?? err ?? '').slice(0, 500)
    const stack = typeof e?.stack === 'string' ? e.stack.slice(0, 2000) : null
    const versao = (typeof __BUILD_ID__ !== 'undefined' ? __BUILD_ID__ : '') || null
    void (async () => {
      let email: string | null = null
      try { const { data } = await supabase.auth.getUser(); email = data.user?.email ?? null } catch { /* sem login, segue sem e-mail */ }
      await supabase.from('esc_quedas').insert({
        email, tela, msg, stack, componentes: componentes ? componentes.slice(0, 2000) : null,
        ua: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 300) : null,
        url: typeof location !== 'undefined' ? location.href.slice(0, 300) : null,
        versao, extra: extra ?? null,
      })
    })().catch(() => { /* falha calado */ })
  } catch { /* falha calado */ }
}
