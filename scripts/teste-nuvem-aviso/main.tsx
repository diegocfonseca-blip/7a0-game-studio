// 🧪 Bancada (07/11): o aviso do 1º salvamento de quem não tem plano (`JanelaNuvemPlanos` com aviso7) — pra foto do Diego.
import '../../src/index.css'
import { createRoot } from 'react-dom/client'
import { JanelaNuvemPlanos } from '../../src/escalacao/nuvem-planos'
createRoot(document.getElementById('root')!).render(<JanelaNuvemPlanos aviso7 onClose={() => {}} />)
