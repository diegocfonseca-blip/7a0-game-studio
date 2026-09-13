// 🔬 BANCADA: o que cada carta REAL desenha (rosto + texto), 13/09.
// Pega as cartas DIRETO do baralho (data.ts), com a bio que elas têm de verdade —
// é exatamente o objeto que o jogo copia pro álbum/agência.
import { createRoot } from 'react-dom/client'
import '../../src/index.css'
import '../../src/escalacao/store' // ⚠️ ordem: store → screens (ciclo do COPA_LEG_MS)
import { CollectibleCard } from '../../src/escalacao/screens'
import { CATALOG, CATALOG_EU, CATALOG_WORLD } from '../../src/escalacao/data'

type C = { name: string; club: string; year: number; fame: number; bio?: string; folk?: boolean; promessa?: boolean }
const TODAS: (C & { pos: string })[] = [CATALOG, CATALOG_EU, CATALOG_WORLD]
  .flatMap(cat => Object.entries(cat).flatMap(([pos, lista]) => (lista as C[]).map(c => ({ ...c, pos }))))

const acha = (n: string, cl: string, y: number) => TODAS.find(c => c.name === n && c.club === cl && c.year === y)!
const CARTAS = [
  acha('Dani Alves', 'Bahia', 2002), acha('Dani Alves', 'Barcelona', 2011),
  acha('Kaká', 'São Paulo', 2003), acha('Kaká', 'Milan', 2007),
  acha('Pepe', 'Santos', 1962), acha('Pepe', 'Real Madrid', 2012),
  acha('Reinaldo', 'Atlético-MG', 1977), acha('Reinaldo', 'São Paulo', 2020),
]

createRoot(document.getElementById('root')!).render(
  <div style={{ padding: 18, fontFamily: 'Oswald, sans-serif', background: '#F4ECD6', minHeight: '100vh', color: '#0C0C0C' }}>
    <h1 style={{ fontFamily: 'Oswald, sans-serif', fontWeight: 900, fontSize: 22, textTransform: 'uppercase', margin: '0 0 4px' }}>🔬 tier x rosto x texto da carta — cartas reais do baralho</h1>
    <p style={{ fontWeight: 700, fontSize: 12.5, margin: '0 0 14px', color: 'rgba(12,12,12,.7)' }}>TIER e ROSTO acertam (é por nome+clube+ano): Barcelona/Milan = 👑 LENDA dourada, Bahia/São Paulo = 💎 PROMESSA roxa. O TEXTO ainda é só por NOME — por isso a carta do garoto conta a história da lenda.</p>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 190px)', gap: 14 }}>
      {CARTAS.map((c, i) => (
        <div key={i} data-carta={`${c.name}|${c.club}|${c.year}`}>
          <CollectibleCard name={c.name} club={c.club} year={c.year} pos={c.pos} fame={c.fame} bio={c.bio} folk={c.folk} promessa={c.promessa} showBio />
          <p style={{ fontSize: 11, fontWeight: 800, marginTop: 5, color: '#0C0C0C' }}>{c.club} · {c.year}</p>
        </div>
      ))}
    </div>
  </div>,
)
