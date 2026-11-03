// 🧪 bancada da cor adicional: ?tier=bege|prata|ouro&cores=rosa,azul&ativa=rosa
import { createRoot } from 'react-dom/client'
import { _bancadaApoio, _bancadaCores, type ApoioTier, type CorExtra } from '../../src/escalacao/apoio'
import { CoresNaLoja } from '../../src/escalacao/cores-loja'
const q = new URLSearchParams(location.search)
const tier = (q.get('tier') ?? 'ouro') as ApoioTier
if (tier !== 'bege') _bancadaApoio('bancada@exemplo.invalid', tier)
_bancadaCores(((q.get('cores') ?? '').split(',').filter(Boolean)) as CorExtra[], (q.get('ativa') || null) as CorExtra | null)
const INK = '#0C0C0C'
const card = { background: '#fff', border: `3px solid ${INK}`, borderRadius: 14, boxShadow: `3px 3px 0 ${INK}`, padding: 10 }
const h2 = { fontFamily: 'Oswald, sans-serif', fontWeight: 900, fontSize: 19, textTransform: 'uppercase', margin: '0 0 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 } as const
const sub = { fontFamily: 'Arial, sans-serif', fontSize: 11, fontWeight: 700, textTransform: 'none', color: 'rgba(12,12,12,.55)' } as const
createRoot(document.getElementById('root')!).render(<div style={{ maxWidth: 420, margin: '0 auto', padding: 14 }}><CoresNaLoja h2={h2} sub={sub} card={card} reais={v => `R$ ${v.toFixed(2).replace('.', ',')}`} /></div>)
