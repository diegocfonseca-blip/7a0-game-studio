// ─── 🕵️ CAIXA-PRETA DO "ENVIANDO…" ──────────────────────────────────────────
//
// Por que existe (11/09/2026, sala SV0ONH do FalaD10): o Diego lacrou no
// Rogério Ceni, o envelope não chegou no host, a tela dele ficou no "ENVIANDO…"
// e o setor fechou contando o envelope como vazio. Toda vez que ele traz esse
// erro a investigação para no mesmo ponto: **o jogo não guardava nada do
// momento da travada**, então nunca dá pra dizer QUAL lado piscou — a conexão
// do convidado ou a do host. Sem isso é chute.
//
// O que o Diego aprovou, com estas palavras dele: *"não aparece nada na tela,
// não muda regra nenhuma, não pesa"*. Então:
//
//   1. NADA aparece pro jogador. Nenhum aviso, nenhum botão, nenhum texto.
//   2. NÃO mexe em lance, tempo, lacre, martelo nem em regra nenhuma. Aqui só
//      se LÊ o que já existe e se escreve numa tabela à parte (`esc_travas`).
//   3. Em partida normal ele não escreve NADA. Só grava quando o erro acontece
//      de verdade — o "ENVIANDO…" passar de 8 segundos — e no máximo uma linha
//      por minuto por aparelho (`ULTIMA`), pra nunca virar enxurrada.
//   4. Se ele próprio falhar, falha CALADO (try/catch em tudo, e a escrita é
//      solta, sem await): não tem como travar nem atrasar a jogada de ninguém.
//
// Pra apagar tudo isso um dia: remover este arquivo e a chamada única no
// `screens.tsx` (o `<Envelope>`). Nada mais depende dele.
import { supabase } from '../lib/supabase'

export interface Trava {
  room_id?: string | null
  sala?: string | null
  papel: 'host' | 'convidado'
  momento: 'envelope' | 'resq_envelope' | 'desempate'
  setor?: number | null
  segundos: number
  reenvios: number
  canal?: string | null
  host_calado_ms?: number | null
  banco_ok?: boolean | null
  extra?: Record<string, unknown> | null
}

// no máximo uma anotação por minuto neste aparelho
let ULTIMA = 0
const INTERVALO_MS = 60_000

// `semFreio`: as anotações da COROA (suspeita e rebaixamento, 5 s uma da outra)
// precisam das DUAS linhas — o freio de 1/min derrubaria justamente a segunda,
// que é a que diz o que aconteceu. Continua sendo uma linha por evento.
export function anotaTrava(t: Trava, semFreio = false): void {
  try {
    const agora = Date.now()
    if (!semFreio && agora - ULTIMA < INTERVALO_MS) return
    ULTIMA = agora
    // solta, sem await e sem tratar retorno: o jogo não espera por isto
    void supabase.from('esc_travas').insert(t).then(() => {}, () => {})
  } catch { /* caixa-preta nunca pode atrapalhar o jogo */ }
}
