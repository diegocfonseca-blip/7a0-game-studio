// 🧪 Bancada da Liga + Libertadores das salas: a grade de escolha (?v=grade) e o torneio (relógio local).
import { createRoot } from 'react-dom/client'
import '../../src/index.css'
import { EscProvider } from '../../src/escalacao/store'
import '../../src/escalacao/screens'
import { EscolheClube, LibertaSalaTorneio } from '../../src/escalacao/liberta-sala-online'
import { montaFichaLiberta } from '../../src/escalacao/liberta-sala'
const q = new URLSearchParams(location.search)
const classif = Array.from({ length: 20 }, (_, i) => ({ id: i, nome: `Técnico ${i + 1}`, humano: i < 4 }))
const ficha = montaFichaLiberta(classif, new Map([[0, 'u0'], [1, 'u1'], [2, 'u2'], [3, 'u3']]), new Map([['u0', { pais: 'Peñarol', form: '4-3-3', xiKeys: [] }]]), 777, 1)
createRoot(document.getElementById('root')!).render(q.get('v') === 'grade'
  ? <div className="ll26-cup-entry" style={{ maxWidth: 900, margin: '0 auto' }}><EscolheClube pegos={new Map([['Flamengo', 'Diego'], ['River Plate', 'Cajuri Raiva']])} seg={33} aoConfirmar={() => {}} /></div>
  : <EscProvider><div style={{ maxWidth: 1100, margin: '0 auto' }}><LibertaSalaTorneio ficha={ficha} roomId="00000000-0000-0000-0000-000000000000" meuUid="u0" souDono semRelogio passoBancada={Number(q.get('passo') ?? 0)} aoCampeao={() => {}} aoFechar={() => {}} /></div></EscProvider>)
