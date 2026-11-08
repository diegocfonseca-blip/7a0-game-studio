// 🧪 Bancada (08/11): prateleira de rivalidades + caminho do draft com favoritos (as peças de verdade, dados de exemplo).
import '../../src/index.css'
import '../../src/escalacao/screens'
import { createRoot } from 'react-dom/client'
import { PrateleiraRivalidades } from '../../src/escalacao/rivalidades-sala'
import { CaminhoDraft, alternaFavorito, favoritosDraft } from '../../src/escalacao/draft-favoritos'
import { todasAsCartas, chaveCarta } from '../../src/escalacao/liga-draft'
const todas = todasAsCartas()
if (favoritosDraft().length === 0) for (const n of ['Romário', 'Zico', 'Ronaldo']) { const c = todas.find(x => x.name === n); if (c) alternaFavorito(chaveCarta(c)) }
const donoDe = new Map<string, { time: string; bot: boolean }>([['ronaldo', { time: 'Gabiru FC', bot: false }]])
const amigos = [
  { uid: 'a', nome: 'Futpoint', time: 'Monarca Tricolor', temporada: { w: 1, d: 0, l: 1 } },
  { uid: 'b', nome: 'Gabiru', time: 'Gabiru FC', temporada: { w: 0, d: 0, l: 0 } },
  { uid: 'c', nome: 'Lindin', time: 'Futebol & Pizza', temporada: { w: 0, d: 1, l: 0 } },
]
const mapa = { a: { v: 4, e: 2, d: 7, seq: 'VEDDD' }, b: { v: 5, e: 1, d: 1, seq: 'VVEV' }, c: { v: 2, e: 3, d: 2, seq: 'VDE' } }
createRoot(document.getElementById('root')!).render(
  <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
    <div style={{ width: 372 }}><PrateleiraRivalidades amigos={amigos} mapa={mapa} proximo={{ amigo: amigos[0], rodada: 16, daqui: 2 }} meuTime="Ice Nugets" /></div>
    <div style={{ width: 372 }}><CaminhoDraft etapas={[{ id: 'liga', pt: 'Liga', en: 'League' }, { id: 'draft', pt: '📋 Draft', en: '📋 Draft' }, { id: 'prox', pt: 'Temp. 4', en: 'Season 4' }]} atual="liga" faltam={3} minhaVez={5} total={8} temporadaQueVem={4} donoDe={donoDe} /></div>
  </div>)
