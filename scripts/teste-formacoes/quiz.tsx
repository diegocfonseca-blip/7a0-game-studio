// 🧪 Bancada do "Quem é esse jogador?" (23/11): a caixa da espera + o joguinho embaixo
import '../../src/index.css'
import '../../src/escalacao/screens'
import { createRoot } from 'react-dom/client'
import { QuemEJogador } from '../../src/escalacao/quem-e-jogador'
createRoot(document.getElementById('root')!).render(<>
  <div style={{ background: '#fff', border: '3px solid #000', borderRadius: 16, boxShadow: '4px 4px 0 #000', padding: 16, textAlign: 'center' }}>
    <p style={{ fontFamily: 'Oswald', fontWeight: 900, fontSize: 20, margin: 0 }}>✅ CONVOCAÇÃO FECHADA</p>
    <p style={{ fontSize: 12, fontWeight: 800, color: 'rgba(0,0,0,.6)', margin: '4px 0' }}>Esperando mais 2 técnicos: Angel fc, Sport Clube Betasso</p>
    <p style={{ fontFamily: 'Oswald', fontWeight: 900, fontSize: 26, margin: 0 }}>⏱️ 13s</p>
  </div>
  <QuemEJogador />
</>)
