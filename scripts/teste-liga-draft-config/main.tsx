// 🧪 Foto do quadro "📜 Regras da turma + 💰 Prêmio" da Liga Draft (05/11). ?editar=1 abre a edição; ?n=10 mostra a liga de 10.
import '../../src/index.css'
import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { ConfigLigaDraft } from '../../src/escalacao/liga-draft-config'
import type { RegrasDraft } from '../../src/escalacao/liga-draft'
const q = new URLSearchParams(location.search)
function App() {
  const [r, setR] = useState<RegrasDraft>({ semLendas: true, soBrasil: true })
  const [p, setP] = useState<number[] | null>(null)
  return <div style={{ maxWidth: 420, margin: '0 auto', padding: 16, background: '#2a2a2a', minHeight: '100vh' }}><ConfigLigaDraft regras={r} premios={p} nTimes={Number(q.get('n') ?? 20)} onRegras={setR} onPremios={setP} /></div>
}
createRoot(document.getElementById('root')!).render(<App />)
