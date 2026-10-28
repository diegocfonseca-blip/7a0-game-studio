// 🧪 Bancada do PARCEIRO (23/10): as peças de verdade onde a marca aparece — palco "apresentada por" (copa regional e liga da
// Várzea), as placas do campinho (?placa=0..3 escolhe qual vai em cima) e o telão com a linha da marca.
import '../../src/index.css'
import { createRoot } from 'react-dom/client'
import { CompetitionStage } from '../../src/escalacao/online-match-visual'
import { CareerCompetitionStage } from '../../src/escalacao/career-match-visual'
import { PlacaGol } from '../../src/escalacao/patrocinio-visual'
import { GiroDaRodada } from '../../src/escalacao/screens'
import { EscCtxBancada } from '../../src/escalacao/store'
const q = new URLSearchParams(location.search)
const ver = q.get('ver') ?? 'tudo'
const giro = [{ texto: '🐶 dSouza · Quadros do seu time pra decorar a parede · Frete grátis · Clique aqui', cor: '#FFC400', link: '#' }]
const st = { screen: 'season', youIdx: 0, onlineMode: 'offline', sport: 'futebol', managers: [] }
createRoot(document.getElementById('root')!).render(<EscCtxBancada.Provider value={{ state: st, dispatch: () => {} } as never}>
  {(ver === 'tudo' || ver === 'regional') && <div className="peca" id="regional"><CompetitionStage kind="liberta" title="LIBERTADORES" phase="Fase de grupos · rodada 1" detail="Cada clube enfrenta os do outro lado." status="Bola rolando · acompanhe os confrontos" /></div>}
  {(ver === 'tudo' || ver === 'varzea') && <div className="peca ll29-career" id="varzea"><CareerCompetitionStage varzea kind="league" title="TEMPORADA 1 · LIGA LEGENDS" phase="Várzea · Rodada 1/38" detail="" status="Bola rolando" /></div>}
  {(ver === 'tudo' || ver === 'placa') && <div className="peca" id="placa" style={{ width: 420, border: '3px solid #000' }}><PlacaGol lado="cima" alt={36} /><div style={{ height: 180, background: 'repeating-linear-gradient(180deg,#2f8a3e 0 30px,#2a7c38 30px 60px)' }} /><PlacaGol lado="baixo" alt={36} /></div>}
  {(ver === 'tudo' || ver === 'telao') && <div className="peca" id="telao"><GiroDaRodada exemplos={giro as never} /></div>}
</EscCtxBancada.Provider>)
