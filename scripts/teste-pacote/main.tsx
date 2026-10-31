// 🧪 Bancada do PACOTE (31/10): o pacote do leilão de Clubes/Seleções/Por década DE VERDADE (motor + tela), pra foto.
import '../../src/index.css'
import { createRoot } from 'react-dom/client'
import { reducer, INITIAL } from '../../src/escalacao/store'
import { PacoteMesa } from '../../src/escalacao/pregao-aberto'
import { nomePacote } from '../../src/escalacao/screens'
import type { Card, EscState } from '../../src/escalacao/types'
const modos = [['Seleções', true, false], ['Clubes por década', false, true], ['Seleções por década', true, true]] as const
const linhas = modos.map(([nome, selecao, decada]) => {
  const s = reducer(structuredClone(INITIAL) as EscState, { type: 'START_ONLINE', roomId: 't', roomCode: 'T1', isHost: true, playerIndex: 0, playerNames: ['A', 'B', 'C', 'D'], formation: '4-3-3', deck: 'todos', copaMode: 'liga_copa', clubes: true, selecao, decada } as never)
  const cs: Card[] = [s.deck.ATA[0], s.deck.MEI[0], s.deck.GOL[0]]
  return { nome, cs }
})
createRoot(document.getElementById('root')!).render(
  <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 18 }}>
    {linhas.map(l => <div key={l.nome}><b style={{ fontFamily: 'Oswald', fontSize: 20 }}>{l.nome}</b>
      <div style={{ display: 'flex', gap: 14, marginTop: 8 }}>{l.cs.map(c => <div key={c.id} style={{ width: 260 }}><PacoteMesa c={c} /><p style={{ fontSize: 11 }}>{nomePacote(c)} · {c.pacote!.cartas.map(x => `${x.name} ${x.year}`).join(', ')}</p></div>)}</div></div>)}
  </div>)
