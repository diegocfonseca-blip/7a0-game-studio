// 🧪 Bancada da Liga + Super Mundial das salas: a grade de escolha (?v=grade) e o torneio (relógio local, ?passo=N).
import { createRoot } from 'react-dom/client'
import '../../src/index.css'
import { EscProvider } from '../../src/escalacao/store'
import '../../src/escalacao/screens'
import { EscolheClubeMundial, MundialSalaTorneio } from '../../src/escalacao/mundial-sala-online'
import { montaFichaMundial } from '../../src/escalacao/mundial-sala'
const q = new URLSearchParams(location.search)
const classif = Array.from({ length: 20 }, (_, i) => ({ id: i, nome: `Técnico ${i + 1}`, humano: i < 4 }))
const ficha = montaFichaMundial(classif, new Map([[0, 'u0'], [1, 'u1'], [2, 'u2'], [3, 'u3']]), new Map([['u0', { pais: 'Fluminense', form: '4-3-3', xiKeys: [] }]]), 777, 1)
createRoot(document.getElementById('root')!).render(q.get('v') === 'grade'
  ? <div className="ll26-cup-entry" style={{ maxWidth: 900, margin: '0 auto' }}><EscolheClubeMundial pegos={new Map([['Real Madrid', 'Diego'], ['Flamengo', 'Futpoint FC']])} seg={33} aoConfirmar={() => {}} /></div>
  : <EscProvider><div style={{ maxWidth: 1100, margin: '0 auto' }}><MundialSalaTorneio ficha={ficha} roomId="00000000-0000-0000-0000-000000000000" meuUid="u0" souDono semRelogio passoBancada={Number(q.get('passo') ?? 0)} aoCampeao={() => {}} aoFechar={() => {}} /></div></EscProvider>)
