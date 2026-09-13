// ─── 🛟 ZONA SEGURA: um pedaço da tela que cai NÃO derruba a tela inteira ─────
//
// 13/09/2026, caso do Internacional de Madrid: um erro do navegador (WebKit) ao
// desmontar a lista de "outros jogos" da Copa nas quartas jogava o usuário na tela
// "Ops, algo deu errado" — e ele voltava, e caía de novo na mesma fase, pra sempre.
// Com a zona segura, só o pedaço que quebrou some por meio segundo ("⏳ atualizando…")
// e volta remontado do zero (chave nova). O resto da tela — placar, abas, botões,
// relógio da fase — segue vivo. Registra a queda em `esc_quedas` pra investigação.
//
// Por que remontar resolve: o erro acontece ao TIRAR um nó que o navegador já não
// tem onde o React deixou; a zona segura desmonta o pedaço pelo nó de cima (que está
// no lugar), então essa remoção passa, e o pedaço nasce limpo de novo.
import { Component, type ReactNode } from 'react'
import { registraQueda } from './quedas'

export class ZonaSegura extends Component<{ nome: string; children: ReactNode; aviso?: string }, { caiu: boolean; n: number }> {
  state = { caiu: false, n: 0 }
  private timer: ReturnType<typeof setTimeout> | null = null
  static getDerivedStateFromError() { return { caiu: true } }
  componentDidCatch(err: Error, info: { componentStack?: string | null }) {
    registraQueda(this.props.nome, err, info?.componentStack ?? null)
    try { console.error(`Zona segura (${this.props.nome}) caiu:`, err) } catch { /* ignora */ }
    // remonta em meio segundo — se cair de novo, registra de novo (com o freio de 30 s do registro)
    if (this.timer) clearTimeout(this.timer)
    this.timer = setTimeout(() => { this.timer = null; this.setState(s => ({ caiu: false, n: s.n + 1 })) }, 500)
  }
  componentWillUnmount() { if (this.timer) clearTimeout(this.timer) }
  render() {
    if (this.state.caiu) {
      return <p style={{ textAlign: 'center', fontSize: 11, fontWeight: 800, color: 'rgba(0,0,0,.5)', margin: '8px 0' }}>{this.props.aviso ?? '⏳ atualizando…'}</p>
    }
    // a chave muda a cada remontagem: o pedaço inteiro nasce de novo, sem herdar o DOM torto
    return <div key={this.state.n} style={{ display: 'contents' }}>{this.props.children}</div>
  }
}
