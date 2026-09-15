// 🔬 Bancada da faixa do TÍTULO no pacote do campeão (15/09).
// Sem login, o componente cai no estado 'noauth' — que é suficiente pra conferir a
// faixa preta com o título, que é o que mudou.
import { createRoot } from 'react-dom/client'
import { EscProvider } from '../../src/escalacao/store'
import { CardCollectPrompt } from '../../src/escalacao/screens'
createRoot(document.getElementById('root')!).render(
  <EscProvider>
    <CardCollectPrompt motivo="🏆 Campeão da Copa Legends" seasonKey="bancada:1" origin="cpu" />
  </EscProvider>
)
