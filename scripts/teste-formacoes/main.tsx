// 🧪 Bancada das formações (23/11): a convocação da Copa do Mundo com o 4-5-1 e o 3-5-2 novo (3 ZAG · 5 MEI · 2 ATA)
import '../../src/index.css'
import { createRoot } from 'react-dom/client'
import '../../src/escalacao/screens'
import { ConvocacaoScreen } from '../../src/escalacao/copa-mundo'
createRoot(document.getElementById('root')!).render(<ConvocacaoScreen pais="Brasil" onBack={() => {}} onDone={() => {}} />)
