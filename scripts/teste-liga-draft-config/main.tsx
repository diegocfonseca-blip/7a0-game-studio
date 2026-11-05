// 🧪 Foto do quadro "💡 Ideias de regras + 💰 Prêmio" da Liga Draft (05/11). ?n=10 mostra a liga de 10.
import '../../src/index.css'
import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { ConfigLigaDraft } from '../../src/escalacao/liga-draft-config'
const q = new URLSearchParams(location.search)
function App() {
  const [p, setP] = useState<number[] | null>(null)
  return <div style={{ maxWidth: 420, margin: '0 auto', padding: 16, background: '#2a2a2a', minHeight: '100vh' }}><ConfigLigaDraft premios={p} nTimes={Number(q.get('n') ?? 20)} onPremios={setP} /></div>
}
createRoot(document.getElementById('root')!).render(<App />)
