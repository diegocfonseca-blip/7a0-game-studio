// 🧪 Bancada do PLACAR GRANDE da prévia (Diego 19/09): monta o `OnlineScorePresentation`
// de verdade com `big` nos três momentos — bola rolando (lance do último gol na barra),
// GOL (selo + lance) e apito final (resultado na frase, escudo do vencedor brilhando).
//   ?cena=rolando|gol|fim   ?res=v|d|e (só no fim)
import { createRoot } from 'react-dom/client'
import '../../src/escalacao/screens'
import { OnlineScorePresentation } from '../../src/escalacao/online-match-visual'
import { Escudo } from '../../src/escalacao/escudos'
import { lanceDoGol } from '../../src/escalacao/lances'
import '../../src/index.css'

const q = new URLSearchParams(location.search)
const cena = q.get('cena') ?? 'rolando'
const res = q.get('res') ?? 'd'
const goals = [
  { name: 'Clodoaldo Matador', min: 33, home: false, assist: 'Rodrigo Souto' },
  { name: 'Rodrigo Souto', min: 59, home: false },
  { name: 'Petit', min: 91, home: true, assist: 'Gerson' },
]
const g = goals[goals.length - 1]
const lance = lanceDoGol(g, 5)
const fim = cena === 'fim'
const hs = fim ? (res === 'v' ? 3 : res === 'e' ? 2 : 1) : 1
const narr = fim
  ? (res === 'v' ? '📢 Apito final — VITÓRIA! Três pontos no bolso 🎉' : res === 'e' ? '📢 Apito final — empate, um ponto pra cada 🤝' : '📢 Apito final — derrota por 1 a 2. Bola pra frente 😤')
  : `⚽ 90+1′ ${g.name} — ${lance}`
createRoot(document.getElementById('root')!).render(
  <div style={{ maxWidth: 560, margin: '0 auto' }}>
    <OnlineScorePresentation enhanced big result={fim ? (res === 'v' ? 'h' : res === 'd' ? 'a' : null) : null}
      homeName="Neymarzetti" awayName="Dragão Imperial" homeColor="#FFC400" awayColor="#3A7CA5" youIsHome
      homeCrest={<Escudo nome="Neymarzetti" size={92} />} awayCrest={<Escudo nome="Dragão Imperial" size={92} />}
      clock={fim ? 'FIM' : "90+1'"} homeScore={hs} awayScore={2} goals={goals}
      goalSide={cena === 'gol' ? 'h' : null} mascot={null} eventKey={1}
      stamp={`⚽ GOOOL! ${g.name} 90+1′ — ${lance}`} narration={narr} />
  </div>
)
