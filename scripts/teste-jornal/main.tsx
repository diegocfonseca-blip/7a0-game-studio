// 🧪 Bancada de O MARTELO — monta as matérias DE VERDADE (`CareerNewspaperStories`,
// o componente da carreira) pra conferir a foto do campeão com o manto do clube.
//
// Por que ela existe: a pintura do manto acontece no NAVEGADOR (canvas), então
// medir em Python só prova a máscara, não o jogo. Aqui roda o caminho inteiro —
// `batismos.ts` → `jornal-manto` → canvas → `<img>` — que é o que o jogador vê.
//
//   ?clubes=La Bestia Negra,Fridão FC   → campeão da liga e dono da Copa
import { createRoot } from 'react-dom/client'
import { CareerNewspaperStories } from '../../src/escalacao/jornal-career-visual'
import { BATISMOS } from '../../src/escalacao/batismos'

const q = new URLSearchParams(location.search)
const pedido = (q.get('clubes') ?? '').split(',').map(s => s.trim()).filter(Boolean)
// sem pedido, a bancada mostra um de cada tipo: batismo com manto, batismo SEM
// manto (tem que sair genérico) e clube de CPU (idem)
const comManto = BATISMOS.filter(b => b.manto).map(b => b.clube)
const CASOS: [string, string | undefined, string][] = pedido.length
  ? [[pedido[0], pedido[1], 'pedido na URL']]
  : [
    [comManto[comManto.length - 1], comManto[0], 'batismo COM manto medido'],
    ['Skyy FC', 'Nata de SP', 'batismo SEM camisa → tem que sair genérico'],
    ['Serra Azul FR', undefined, 'clube de CPU → tem que sair genérico'],
  ]

createRoot(document.getElementById('root')!).render(
  <div style={{ maxWidth: 760, margin: '0 auto' }}>
    {CASOS.map(([campeao, copa, porque]) => (
      <div key={campeao} style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: 'Oswald, sans-serif', fontWeight: 900, fontSize: 15, textTransform: 'uppercase', marginBottom: 6 }}>
          {campeao}{copa ? ` · copa: ${copa}` : ''} <span style={{ opacity: .55, fontWeight: 500 }}>— {porque}</span>
        </div>
        <CareerNewspaperStories champion={campeao} division="Série A" cup={copa}
          scorer={{ name: 'Zico', goals: 24 }} />
      </div>
    ))}
  </div>
)
