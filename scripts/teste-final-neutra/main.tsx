// 🧪 Bancada (08/11): a FINAL da copa vista por quem já caiu — placar grande neutro (sem "você"), donos no lugar de VOCÊ/RIVAL.
import '../../src/index.css'
import '../../src/escalacao/screens'
import { createRoot } from 'react-dom/client'
import { LiveScoreCard } from '../../src/escalacao/pyramidseason'
const goals = [{ name: 'Miroslav Klose', min: 12, home: false }, { name: 'Ronaldinho', min: 30, home: true }]
createRoot(document.getElementById('root')!).render(
  <div style={{ maxWidth: 560, margin: '0 auto', background: '#14110b', padding: 8 }}>
    <LiveScoreCard neutro enhancedOnline homeName="Futebol & Pizza" awayName="Monarca Tricolor" homeColor="#3A7CA5" awayColor="#FFC400"
      homeOwner="FINALISTA" awayOwner="Futpoint" youIsHome={false} goals={goals} roundKey={20} roundMs={60000}
      footTint={{ bg: '#F3EAFE', border: '#d9c3f5', holo: 0.5 }} />
  </div>)
