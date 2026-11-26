// 🧪 Bancada da janela do clã (26/11): ClaVer com o banco respondendo de mentira (print.mjs intercepta as chamadas)
import '../../src/index.css'
import { createRoot } from 'react-dom/client'
import { ClaVer } from '../../src/escalacao/cla-ver'
createRoot(document.getElementById('root')!).render(<ClaVer id={1} onClose={() => {}} />)
