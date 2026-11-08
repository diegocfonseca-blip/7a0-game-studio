// 🧪 Bancada (08/11): o banner de indicação de streamer (antes × depois) — pra foto do Diego.
import '../../src/index.css'
import { createRoot } from 'react-dom/client'
import { BannerIndicacao } from '../../src/escalacao/banner-indicacao'
import { BannerInstagram } from '../../src/escalacao/banner-instagram'
const tit = { fontFamily: 'Oswald', fontWeight: 800, fontSize: 13, margin: '10px 0 2px' } as const
createRoot(document.getElementById('root')!).render(<>
  <p style={tit}>ANTES (sai)</p><BannerInstagram />
  <p style={tit}>DEPOIS (entra no mesmo lugar)</p><BannerIndicacao />
</>)
