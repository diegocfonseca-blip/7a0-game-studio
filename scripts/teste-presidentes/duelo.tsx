// 🎩 bancada: o pênalti do presidente da Kings (placar e 2D usam a MESMA cena) — #gol, #defesa, #rival
import { createRoot } from 'react-dom/client'
import '../../src/index.css'
import { CenaDuelo } from '../../src/escalacao/kings-cenas'
const [h0, clubQ, nomeQ] = decodeURIComponent(location.hash.slice(1)).split('|'); const h = h0 || 'gol'
const duelo = { key: 'p', tipo: 'presidente', min: 50, batedor: 0, goleiro: 1, chute: 2, pulo: h === 'defesa' ? 2 : 3, gol: h !== 'defesa', golPara: h !== 'defesa' ? 0 : null } as const
createRoot(document.getElementById('root')!).render(
  <div style={{ minHeight: '100vh', background: '#F4ECD6' }}>
    <CenaDuelo duelo={duelo as never} souBatedor={h !== 'rival'} nomeBatedor="Tubarões" nomeGoleiro="Rivais FC" onEscolha={() => {}} presidente={nomeQ || 'Neymar Jr.'} presClub={clubQ || 'Furia'} />
  </div>)
