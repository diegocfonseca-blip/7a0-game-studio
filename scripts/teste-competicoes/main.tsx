// 🧪 Bancada do TÚNEL DA FINAL e da FESTA DO CAMPEÃO (23/10).  ?comp=liga|copa8|liberta|champions|mundo|mundial|riosp|sulminas|nordeste  ?festa=1
import '../../src/index.css'
import { createRoot } from 'react-dom/client'
import '../../src/escalacao/screens'
import { TunelFinal, FestaCampeao, type CompId } from '../../src/escalacao/competicoes-visual'
import { Escudo } from '../../src/escalacao/escudos'
import { MASCOTES } from '../../src/escalacao/mascotes'
const q = new URLSearchParams(location.search)
const comp = (q.get('comp') ?? 'champions') as CompId
const A = 'Ex Bagres', B = 'Arrogantchi FC'
createRoot(document.getElementById('root')!).render(q.get('festa')
  ? <FestaCampeao comp={comp} nome={A} crest={<Escudo nome={A} size={160} />} mascote={MASCOTES['trevo_seven']} lendas={[{ nome: 'Ronaldinho Gaúcho', club: 'Barcelona', year: 2005 }, { nome: 'Kaká', club: 'Milan', year: 2007 }]} linha="27 pts · vice: Arrogantchi FC" onDone={() => {}} />
  : <TunelFinal comp={comp} seg={7} total={12} casa={{ nome: A, crest: <Escudo nome={A} size={96} /> }} fora={{ nome: B, crest: <Escudo nome={B} size={96} /> }} />)
