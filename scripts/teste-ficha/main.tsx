import '../../src/index.css'
import { createRoot } from 'react-dom/client'
import { FichaClubeCaixa } from '../../src/escalacao/pix-mp'
const h = location.hash.slice(1)
createRoot(document.getElementById('r')!).render(<FichaClubeCaixa produto="fundador" pedido="5501cc24-0000" passou24h={h === '24'} />)
