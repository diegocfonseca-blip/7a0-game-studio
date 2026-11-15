// 🎬 bancada: as cartas que entram no vídeo da Kings (Kelvin e Lipão lendas, presidentes) — fotografadas uma a uma
import { createRoot } from 'react-dom/client'
import '../../src/index.css'
import { CollectibleCard } from '../../src/escalacao/screens'
const C = ({ id, ...p }: { id: string; name: string; club: string; year: number; pos: never; fame: never }) => <div id={id} style={{ width: 300, padding: 10, display: 'inline-block' }}><CollectibleCard {...p} big /></div>
createRoot(document.getElementById('root')!).render(
  <div style={{ background: '#F4ECD6', padding: 10 }}>
    <C id="kelvin" name="Kelvin" club="G3X" year={2025} pos={'ATA' as never} fame={5 as never} />
    <C id="lipao" name="Lipão" club="Furia" year={2025} pos={'ATA' as never} fame={5 as never} />
    <C id="ludmilla" name="Ludmilla" club="Real Elite" year={2025} pos={'LAT' as never} fame={2 as never} />
    <C id="neymar" name="Neymar Jr." club="Furia" year={2025} pos={'LAT' as never} fame={2 as never} />
    <C id="gaules" name="Gaules" club="G3X" year={2025} pos={'LAT' as never} fame={2 as never} />
    <C id="toguro" name="Toguro" club="Fluxo" year={2026} pos={'LAT' as never} fame={2 as never} />
  </div>)
