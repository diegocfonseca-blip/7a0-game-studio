// 🧪 Bancada do PALCO da carreira (o cabeçalho da aba Jogos). Serve pra conferir que,
// sem o subtítulo da liga (Diego 19/09), o bloco não fica com buraco — e que a Copa,
// que CONTINUA com o texto do formato, segue igual.
//   ?copa=1 → versão da Copa (com detail)
import { createRoot } from 'react-dom/client'
import { CareerCompetitionStage } from '../../src/escalacao/career-match-visual'
import '../../src/index.css'

const copa = new URLSearchParams(location.search).get('copa') === '1'
createRoot(document.getElementById('root')!).render(
  <div className="ll29-career" style={{ maxWidth: 560, margin: '0 auto' }}>
    <CareerCompetitionStage kind={copa ? 'copa' : 'league'}
      title={copa ? 'TEMPORADA 28 · 🏆 COPA LEGENDS' : 'TEMPORADA 28 · LIGA LEGENDS'}
      phase={copa ? 'Quartas de final' : 'VÁRZEA · RODADA 26/38'}
      detail={copa ? '8 confrontos · jogo único · Os 4 melhores de cada série (A·B·C·D)' : ''}
      status={copa ? 'Bola rolando · acompanhe os confrontos' : 'Bola rolando'}>
      <div className="ll29-summary"><span>🥹 Torcida <b>20%</b><br/><small>14º lugar · 13º lugar · 9º lugar</small></span><progress max={100} value={20} /><span>20º · Várzea</span><span>💰 18</span></div>
    </CareerCompetitionStage>
  </div>
)
