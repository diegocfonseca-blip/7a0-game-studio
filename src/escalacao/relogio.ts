// ─── ⏱️ O RELÓGIO DA SALA — um só pra todo mundo ─────────────────────────────
//
// 🐛 O BUG (Diego, 20/09, sala de Minhas Ligas com a turma): *"os tempos de
// escolhas estão MT longos… tem que ser igual ao modo às cegas. E o monte de
// sobras também, que era 15s e tava bem mais também"*. Nos prints dele:
//   · "Fulano está escolhendo a seleção · 154s" — o certo é 75s
//   · "a convocação abre em 84s" — o certo é 15s (o banner)
//   · "TIME CONVOCADO · 129s" — o certo é 90s
//   · e o Monte de sobras, que é 15s, "bem mais".
//
// 🔍 A CAUSA: **o relógio do celular dele estava ~79 segundos atrasado**. Todo
// prazo do online nasce no aparelho do DONO da sala (`Date.now() + 15s`) e viaja
// como um INSTANTE (um timestamp). Quem recebe faz a conta com o relógio do
// PRÓPRIO celular — então, se o celular está 79s atrasado, todo prazo parece 79s
// maior do que é. Não é a Copa, nem o Monte, nem a Tocaia: é a mesma conta errada
// em todos eles (foi por isso que dois lugares sem nenhuma ligação — a tabela da
// Copa no banco e o Monte que vem pelo broadcast — apareceram com o MESMO erro).
// E o pior não é o número feio: a fase acaba na hora certa (quem manda é o
// relógio do dono), então o convidado leva um susto — "ainda tinha 1 minuto!".
//
// ✅ O CONSERTO: o dono carimba a hora DELE em toda mensagem que já manda (o
// estado e o "tô vivo", que custam os mesmos bytes), e cada convidado aprende o
// DESVIO entre os dois relógios. Daí pra frente todo prazo é lido com
// `agoraSala()` — a hora do DONO — e não com a hora do celular.
//
// 🛡️ Por que é seguro:
//   · pro DONO o desvio é SEMPRE ZERO (ele não recebe carimbo de ninguém e
//     `souODono()` zera na hora) → `agoraSala() === Date.now()`, nada muda;
//   · offline/partida rápida nunca recebem carimbo → desvio zero, nada muda;
//   · host numa versão velha (janela de deploy) não manda carimbo → desvio
//     zero, e o convidado fica exatamente como era hoje;
//   · só PRAZO usa esta hora. Nada de salvar, assinar, ordenar ou registrar —
//     esses continuam no relógio do próprio aparelho.

/** quanto o relógio do DONO da sala está à frente do nosso, em milissegundos */
let desvio = 0

/** a hora AGORA no relógio do dono da sala (offline/dono: é o relógio daqui mesmo) */
export const agoraSala = (): number => Date.now() + desvio

/** só pra tela de diagnóstico e pras travas — em ms */
export const desvioSala = (): number => desvio

// 🧊 ZONA MORTA: a viagem da mensagem varia uns 100-300ms, e um desvio que muda a
// cada batidinha faria a contagem PULAR na tela ("14s, 15s, 14s"). Só troca o
// desvio quando a medida nova discorda da atual por mais de 1,5s — ou seja, só
// quando é relógio errado de verdade, nunca por causa da rede.
const ZONA_MORTA_MS = 1500

/**
 * aprende o desvio a partir do carimbo do dono.
 * @param carimboDoDono `Date.now()` do aparelho do dono, no instante em que ele mandou
 */
export function ajustaRelogioSala(carimboDoDono: unknown): void {
  if (typeof carimboDoDono !== 'number' || !Number.isFinite(carimboDoDono)) return
  const medido = carimboDoDono - Date.now()
  // 🚧 carimbo absurdo (> 12h) é lixo/pacote corrompido: não encosta no relógio
  if (Math.abs(medido) > 12 * 3600 * 1000) return
  if (Math.abs(medido - desvio) < ZONA_MORTA_MS) return
  desvio = medido
}

/** eu sou o dono (ou saí do online): a hora daqui VIRA a hora da sala */
export function souODono(): void { desvio = 0 }
