// 🧪 Bancada (07/11 · 08/11): o aviso do 1º salvamento de quem não tem plano (`JanelaNuvemPlanos` com aviso7) e o de quando o
// teste de 5 dias acaba (`travado`) — pra foto do Diego. ?t=1 mostra o de depois do teste.
import '../../src/index.css'
import { createRoot } from 'react-dom/client'
import { JanelaNuvemPlanos } from '../../src/escalacao/nuvem-planos'
const travado = new URLSearchParams(location.search).get('t') === '1'
createRoot(document.getElementById('root')!).render(<JanelaNuvemPlanos aviso7={!travado} travado={travado} onClose={() => {}} />)
