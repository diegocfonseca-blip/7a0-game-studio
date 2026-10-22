// 🧪 Bancada da HISTÓRIA DO VESTIÁRIO (22/10) — o `EventoBanner` de verdade dentro da mesma moldura escura que o jogo abre por
// cima de tudo. `?tipo=noitada|lesao|expulsao`.
import { createRoot } from 'react-dom/client'
import { EscProvider } from '../../src/escalacao/store'
import '../../src/escalacao/screens'
import { EventoBanner } from '../../src/escalacao/pyramidseason'
import { sorteiaEvento } from '../../src/escalacao/eventos'
import type { WonCard } from '../../src/escalacao/types'

try { localStorage.setItem('bl_lang', 'pt') } catch { /* ignora */ }
const tipo = (new URLSearchParams(location.search).get('tipo') ?? 'noitada') as 'noitada' | 'lesao' | 'expulsao'
const c = (id: string, name: string, pos: string) => ({ id, name, pos, club: 'Flamengo', year: 1995 }) as unknown as WonCard
const xi = [c('a', tipo === 'noitada' ? 'Romário' : tipo === 'expulsao' ? 'Edmundo' : 'Cafu', tipo === 'lesao' ? 'LAT' : 'ATA')]
const reservas = [c('b', 'Leandro', xi[0].pos), c('d', 'Djalma Santos', xi[0].pos)]
let ev = null
for (let seed = 1; seed < 4000 && !ev; seed++) { const s = sorteiaEvento({ seed, seasonNo: 3, round: 30, xi, squad: [...xi, ...reservas] }); if (s && s.tipo === tipo) ev = s }
const ativo = { season: 3, round: 15, mgrId: 1, tipo, cardId: 'a', nome: xi[0].name, pos: xi[0].pos, rodadas: ev?.rodadas ?? 1, historia: ev?.historia ?? '', status: 'pendente' } as never
createRoot(document.getElementById('root')!).render(<EscProvider>
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(12,12,12,.84)', padding: '22px 14px', display: 'flex' }}>
    <div style={{ maxWidth: 460, width: '100%', margin: 'auto' }}>
      <span style={{ fontFamily: 'Oswald', fontWeight: 900, fontSize: 11.5, textTransform: 'uppercase', background: '#FFC400', border: '2px solid #0C0C0C', borderRadius: 999, padding: '3px 11px', display: 'inline-block', marginBottom: 9 }}>📰 Notícia do vestiário</span>
      <EventoBanner ev={ativo} reservas={reservas} onDecide={() => {}} />
    </div>
  </div>
</EscProvider>)
