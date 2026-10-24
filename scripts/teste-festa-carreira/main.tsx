// 🧪 Bancada (24/10): túnel da final e festa do campeão NA CARREIRA (proposta pro Diego). ?v=tunel|festaB|festaCopa|trofeus
import '../../src/index.css'
import { createRoot } from 'react-dom/client'
import { TunelFinal, FestaCampeao, Trofeu, COMPS, type CompId } from '../../src/escalacao/competicoes-visual'
import escudo from '../../src/escalacao/img/guimaraes-escudo.webp'
import mascote from '../../src/escalacao/img/guimaraes-mascote.webp'
const v = new URLSearchParams(location.search).get('v') ?? 'tunel'
const Esc = ({ s }: { s: number }) => <img src={escudo} style={{ height: s, width: 'auto' }} />
const Rival = ({ s }: { s: number }) => <div style={{ width: s * 0.82, height: s, borderRadius: '12px 12px 50% 50%', border: '4px solid #000', background: 'linear-gradient(90deg,#0E3E86 50%,#fff 50%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Oswald', fontWeight: 900, fontSize: s * 0.3, color: '#000' }}>AT</div>
const todos: CompId[] = ['carV', 'carD', 'carC', 'carB', 'carA', 'copabr', 'supercopa', 'liberta', 'champions', 'mundial', 'mundo']
const root = createRoot(document.getElementById('root')!)
if (v === 'trofeus') root.render(
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, padding: 16, background: '#F4ECD6', justifyContent: 'center' }}>
    {todos.map(c => <div key={c} style={{ width: 128, border: '3px solid #000', borderRadius: 14, background: COMPS[c].bg, boxShadow: '3px 3px 0 #000', padding: '10px 4px 8px', textAlign: 'center' }}>
      <div style={{ display: 'flex', justifyContent: 'center' }}><Trofeu comp={c} size={84} /></div>
      <b style={{ fontFamily: 'Oswald', fontWeight: 900, textTransform: 'uppercase', color: COMPS[c].titulo, fontSize: 14, filter: 'drop-shadow(2px 2px 0 #000)' }}>{COMPS[c].nome[0]}</b>
    </div>)}
  </div>)
else if (v.startsWith('festa')) {
  const copa = v === 'festaCopa'
  root.render(<FestaCampeao comp={copa ? 'copabr' : 'carB'} nome="Guimarães SCI" crest={<Esc s={150} />} mascote={<img src={mascote} style={{ width: '100%' }} />}
    linha={copa ? 'final: Guimarães SCI 2×1 Atlético · Temporada 12' : '78 pontos · 24 vitórias · Temporada 12'} souCampeao onDone={() => {}}
    artilheiro={{ nome: copa ? 'Fernandão' : 'Nilmar', time: 'Guimarães SCI', n: copa ? 6 : 21 }} garcom={{ nome: "D'Alessandro", time: 'Guimarães SCI', n: copa ? 4 : 13 }}
    lendas={[{ nome: 'Fernandão', club: 'Internacional', year: 2006 }]} />)
} else root.render(<div style={{ background: '#0b0f14', minHeight: '100vh', padding: 16 }}><div style={{ maxWidth: 760, margin: '0 auto' }}>
  <TunelFinal comp="copabr" seg={3} total={5} espera="" casa={{ nome: 'Guimarães SCI', crest: <Esc s={92} /> }} fora={{ nome: 'Atlético', crest: <Rival s={92} /> }} />
</div></div>)
