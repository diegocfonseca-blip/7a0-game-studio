// 🌍 VITRINE da Copa do Mundo online — monta as telas DE VERDADE (os mesmos
// componentes que o jogo usa) numa página só, pro Diego ver antes de entrar na
// sala. Não é mockup: é o jogo, com dados de mentira.
import { createRoot } from 'react-dom/client'
import { useState } from 'react'
import '../src/escalacao/screens'
import '../src/escalacao/pyramidseason'
import { countryPool, bestXI } from '../src/escalacao/copa-mundo'
import { FaixaCopa, PainelDaCopa, EscolhaSelecao, CopaDaSala, montaFicha, type CopaPick } from '../src/escalacao/copa-mundo-online'

const chaves = (pais: string) => bestXI(countryPool(pais), '4-3-3').map(c => `${c.name}|${c.club}|${c.year}`)
const gente = [
  { uid: 'u1', nome: 'Diego', pick: { pais: 'Brasil', form: '4-3-3' as const, xiKeys: chaves('Brasil') } },
  { uid: 'u2', nome: 'Dérick FC', pick: { pais: 'Argentina', form: '4-3-3' as const, xiKeys: chaves('Argentina') } },
  { uid: 'u3', nome: 'Tricolor do Arruda', pick: { pais: 'França', form: '4-3-3' as const, xiKeys: chaves('França') } },
]
const ficha = montaFicha(gente, 20260831, 1)

function App() {
  const [torneio, setTorneio] = useState(false)
  const minha: CopaPick = gente[0].pick
  return (
    <div style={{ background: '#1b1b1b', minHeight: '100vh', padding: 14 }}>
      <div style={{ width: 384, margin: '0 auto' }}>
        <FaixaCopa />
        <EscolhaSelecao roomId="x" meuUid="u1" minha={minha}
          pegasPorOutros={[{ pais: 'Argentina', nome: 'Dérick FC' }, { pais: 'França', nome: 'Tricolor do Arruda' }]}
          aoEscolher={() => {}} />
        <PainelDaCopa prontos={gente.map(g => ({ nome: g.nome, pais: g.pick.pais }))} total={4} souDono abrindo={false}
          aoAbrir={() => setTorneio(true)} />
      </div>
      {torneio && <CopaDaSala ficha={ficha} meuUid="u1" aoFechar={() => setTorneio(false)} />}
    </div>
  )
}
createRoot(document.getElementById('root')!).render(<App />)
