// 🎩 bancada: a carta do presidente da Kings (cores do time, sem retrato) — como aparece quando você GANHA ele
// (a carta grande da revelação/cerimônia) — e o campinho de 7 com a faixa do presidente
import { createRoot } from 'react-dom/client'
import '../../src/index.css'
import { CollectibleCard, CardFace, FAME_TIER } from '../../src/escalacao/screens'
import { CampinhoKings } from '../../src/escalacao/kings-campinho'
const cartas = [['Ludmilla', 'Real Elite', 2025], ['Allan Stag', 'Dibrados', 2026], ['Nobru', 'Fluxo', 2026], ['Neymar Jr.', 'Furia', 2025], ['Gaules', 'G3X', 2026], ['Yuri 22', 'Desimpedidos Goti', 2025]] as const
const elenco = [
  { name: 'Esaú Assunção', pos: 'GOL', fame: 4 }, { name: 'Matheus Dedo', pos: 'ZAG', fame: 4 }, { name: 'Victor Bolt', pos: 'ZAG', fame: 4 },
  { name: 'Lipão', pos: 'MEI', fame: 5 }, { name: 'Juninho Maestro', pos: 'MEI', fame: 4 }, { name: 'Aleix Martí', pos: 'ATA', fame: 4 }, { name: 'Kelvin', pos: 'ATA', fame: 5 },
  { name: 'Neymar Jr.', pos: 'LAT', fame: 2, club: 'Furia', presidente: true },
] as const
const OSW = { fontFamily: 'Oswald, sans-serif', fontWeight: 900 } as const
createRoot(document.getElementById('root')!).render(
  <div style={{ padding: 16, display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start', background: '#F4ECD6' }}>
    <div style={{ width: 300, textAlign: 'center' }}>
      <p style={{ ...OSW, fontSize: 13, letterSpacing: '.14em', margin: '0 0 8px' }}>🔨 VOCÊ GANHOU O PRESIDENTE</p>
      <CollectibleCard name="Neymar Jr." club="Furia" year={2025} pos="LAT" fame={2} big />
      <div style={{ marginTop: 12, background: '#fff', border: '3px solid #0C0C0C', borderRadius: 14, padding: '8px 12px', textAlign: 'left' }}>
        <CardFace c={{ id: 'x', name: 'Neymar Jr.', club: 'Furia', year: 2025, pos: 'LAT', fame: 2, lo: 70, hi: 70, presidente: true } as never} big />
      </div>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 150px)', gap: 12 }}>
      {cartas.map(([n, c, y]) => <CollectibleCard key={n} name={n} club={c} year={y} pos="LAT" fame={2} />)}
    </div>
    <div style={{ width: 330 }}><CampinhoKings elenco={elenco as never} tier={f => FAME_TIER[f] ?? FAME_TIER[1]} /></div>
  </div>)
