// 🧪 Bancada do campeão "cinema" (24/11): ?tema=liga|liberta|…&sem=1 (sem lendas/mascote, escudo simples)
import '../../src/index.css'
import '../../src/escalacao/screens'
import { createRoot } from 'react-dom/client'
import { CampeaoCinema, type TemaCampeao } from '../../src/escalacao/campeao-cinema'
import esc from '../../src/escalacao/img/pirituba-escudo.webp'
import masc from '../../src/escalacao/img/pirituba-mascote.webp'
const q = new URLSearchParams(location.search), tema = (q.get('tema') ?? 'liberta') as TemaCampeao, sem = !!q.get('sem')
const B = import.meta.env.BASE_URL
createRoot(document.getElementById('root')!).render(sem
  ? <CampeaoCinema chave="x" tema={tema} nome="Angel FC" crest={<div style={{ width: 52, height: 58, clipPath: 'polygon(50% 0,100% 14%,100% 60%,50% 100%,0 60%,0 14%)', background: '#C2452F', display: 'grid', placeItems: 'center', font: '900 22px Oswald', color: '#fff' }}>AF</div>} retratos={[]} />
  : <CampeaoCinema chave="x" tema={tema} nome="Pirituba SF" crest={<img src={esc} width={46} height={54} />} mascote={<img src={masc} style={{ width: '100%' }} />}
    retratos={[`${B}avatars/lendas-v1/zico-flamengo-1981.webp`, `${B}avatars/lendas-v1/kaka-milan-2007.webp`, `${B}avatars/lendas-v1/romario-vasco-2000.webp`]} />)
