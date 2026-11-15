// 🎩 bancada: os presidentes do Real Elite (azul + rosa, medidos no escudo) — carta grande, cartinhas, ficha e o pênalti na arena
import { createRoot } from 'react-dom/client'
import '../../src/index.css'
import { CollectibleCard, CardFace } from '../../src/escalacao/screens'
const OSW = { fontFamily: 'Oswald, sans-serif', fontWeight: 900 } as const
createRoot(document.getElementById('root')!).render(
  <div style={{ padding: 16, display: 'flex', gap: 22, alignItems: 'flex-start', background: '#F4ECD6' }}>
    <div style={{ width: 300, textAlign: 'center' }}>
      <p style={{ ...OSW, fontSize: 14, letterSpacing: '.12em', margin: '0 0 8px', color: '#0C0C0C' }}>🔨 VOCÊ GANHOU O PRESIDENTE</p>
      <CollectibleCard name="Ludmilla" club="Real Elite" year={2025} pos="LAT" fame={2} big />
    </div>
    <div>
      <p style={{ ...OSW, fontSize: 14, letterSpacing: '.12em', margin: '0 0 8px', color: '#0C0C0C' }}>OS 3 DO REAL ELITE</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 150px)', gap: 12 }}>
        {['Ludmilla', 'Whindersson Nunes', 'Lucas Freestyle'].map(n => <CollectibleCard key={n} name={n} club="Real Elite" year={2025} pos="LAT" fame={2} />)}
      </div>
      <div style={{ marginTop: 14, background: '#fff', border: '3px solid #0C0C0C', borderRadius: 14, padding: '8px 12px', width: 330 }}>
        <CardFace c={{ id: 'x', name: 'Ludmilla', club: 'Real Elite', year: 2025, pos: 'LAT', fame: 2, lo: 70, hi: 70, presidente: true } as never} big />
      </div>
    </div>
  </div>)
