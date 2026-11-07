import type { DisputaPenaltisCampo } from './campo2d-penaltis'

// 🥅 07/11 (Diego: *"o jogo não pode acabar antes dos pênaltis"*): quais disputas de pênaltis do campinho estão NA TELA deste
// aparelho agora (alguma tela pediu e a última cobrança ainda não apareceu). Quem vira fase (o "Próximo", o automático, o
// relógio do DONO na sala) pergunta aqui antes de virar. Só memória local: nada vai pro save, pro banco nem pro canal.
const naTela = new Set<DisputaPenaltisCampo>()
const ouvintes = new Set<() => void>()
const avisa = () => ouvintes.forEach(f => f())
export function entrouNaTela(s: DisputaPenaltisCampo) { naTela.add(s); avisa() }
export function saiuDaTela(s: DisputaPenaltisCampo) { naTela.delete(s); avisa() }
export function mudouNaTela() { avisa() }
export function ouvirNaTela(f: () => void) { ouvintes.add(f); return () => { ouvintes.delete(f) } }
/** alguma disputa de pênaltis ainda está rolando na tela deste aparelho? */
export function disputaRolandoNaTela(): boolean {
  for (const s of naTela) if (!s.estado.encerrado) return true
  return false
}
