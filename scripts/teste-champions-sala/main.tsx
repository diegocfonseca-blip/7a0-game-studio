// 🧪 Bancada da Liga + Champions das salas: a grade de escolha (?v=grade) e o torneio (relógio local, ?passo=N).
import { createRoot } from 'react-dom/client'
import '../../src/index.css'
import { EscProvider } from '../../src/escalacao/store'
import '../../src/escalacao/screens'
import { EscolheClube, ChampionsSalaTorneio } from '../../src/escalacao/champions-sala-online'
import { montaFichaChampions } from '../../src/escalacao/champions-sala'
import { OwnerOnlineProvider } from '../../src/escalacao/owner-online-visual'
const q = new URLSearchParams(location.search)
const classif = Array.from({ length: 20 }, (_, i) => ({ id: i, nome: `Técnico ${i + 1}`, humano: i < 4 }))
const ficha = montaFichaChampions(classif, new Map([[0, 'u0'], [1, 'u1'], [2, 'u2'], [3, 'u3']]), new Map([['u0', { pais: 'Atalanta', form: '4-3-3', xiKeys: [] }]]), 777, 1)
createRoot(document.getElementById('root')!).render(q.get('v') === 'grade'
  ? <div className="ll26-cup-entry" style={{ maxWidth: 900, margin: '0 auto' }}><EscolheClube pegos={new Map([['Real Madrid', 'Diego'], ['Liverpool', 'Futpoint FC']])} seg={33} aoConfirmar={() => {}} /></div>
  : <EscProvider><OwnerOnlineProvider enabled={q.get('novo') === '1'} state={{ sport: 'futebol', onlineMode: 'online', screen: 'end', roomId: 'bancada' } as never}><div style={{ maxWidth: q.get('novo') === '1' ? 'none' : 1100, margin: '0 auto' }}><ChampionsSalaTorneio ficha={ficha} roomId="00000000-0000-0000-0000-000000000000" meuUid="u0" souDono semRelogio passoBancada={Number(q.get('passo') ?? 0)} aoCampeao={() => {}} aoFechar={() => {}} /></div></OwnerOnlineProvider></EscProvider>)
