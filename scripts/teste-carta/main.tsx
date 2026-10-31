// 🧪 Bancada da CARTA (31/10): a CollectibleCard DE VERDADE, pra mandar a foto de uma carta nova pro Diego.
//   ?nome=Lucas%20Barreto&clube=Botafogo&ano=2026&pos=GOL&fama=3
import '../../src/index.css'
import { createRoot } from 'react-dom/client'
import { CollectibleCard } from '../../src/escalacao/screens'
import { CATALOG, CATALOG_EU, CATALOG_WORLD } from '../../src/escalacao/data'
const q = new URLSearchParams(location.search)
const nome = q.get('nome') ?? 'Lucas Barreto'
// a carta DE VERDADE do baralho (nível, bio, promessa…) — achada pelo nome+clube+ano
const real = [CATALOG, CATALOG_EU, CATALOG_WORLD].flatMap(c => Object.values(c).flat()).find(c => c.name === nome && c.club === (q.get('clube') ?? 'Botafogo') && c.year === Number(q.get('ano') ?? 2026)) as { bio?: string; folk?: boolean; promessa?: boolean } | undefined
createRoot(document.getElementById('root')!).render(
  <div style={{ display: 'flex', gap: 24, padding: 24, background: '#F4ECD6', alignItems: 'flex-start' }}>
    <div id="carta" style={{ display: 'inline-block', width: 300 }}><CollectibleCard big name={q.get('nome') ?? 'Lucas Barreto'} club={q.get('clube') ?? 'Botafogo'} year={Number(q.get('ano') ?? 2026)} pos={q.get('pos') ?? 'GOL'} fame={Number(q.get('fama') ?? 3)} bio={real?.bio} folk={real?.folk} promessa={real?.promessa} showBio /></div>
  </div>)
