// 🧪 Bancada da TROCA 2D ↔ PLACAR RÁPIDO na sala online (05/11): os 3 jeitos que o botão do DONO aparece, junto do
// controle da partida. Foto: scripts/mockups/sala-troca-2d.png (390×844 ×2).
import '../../src/index.css'
import '../../src/escalacao/online-match-visual.css'
import { createRoot } from 'react-dom/client'
import { useState } from 'react'
import { TrocaCampo2DVisual } from '../../src/escalacao/screens'
import { setLang } from '../../src/escalacao/lang'
setLang(new URLSearchParams(location.search).get('lang') === 'en' ? 'en' : 'pt')
const INK = '#0C0C0C'
const OSW = { fontFamily: 'Oswald, sans-serif' }

function Caso({ titulo, agora, pendente0 }: { titulo: string; agora: boolean; pendente0: boolean }) {
  const [pendente, setPendente] = useState(pendente0)
  return (
    <div style={{ marginBottom: 14 }}>
      <p style={{ ...OSW, fontWeight: 900, fontSize: 11, textTransform: 'uppercase', margin: '0 0 5px 2px', color: 'rgba(0,0,0,.6)' }}>{titulo}</p>
      {/* o placar da rodada (só de enfeite, pra mostrar ONDE o botão mora) */}
      <div style={{ border: `3px solid ${INK}`, borderRadius: 14, background: '#fff', color: INK, boxShadow: `3px 3px 0 0 ${INK}`, padding: '10px 12px', marginBottom: 10, ...OSW, fontWeight: 900, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>FABULOUS EC</span><span style={{ fontSize: 22 }}>1 × 0</span><span>CHELSÃO</span>
      </div>
      <div style={{ border: `3px solid ${INK}`, borderRadius: 14, background: '#fff', boxShadow: `3px 3px 0 0 ${INK}`, padding: 10 }}>
        <p style={{ ...OSW, fontWeight: 900, fontSize: 9.5, letterSpacing: 1, textTransform: 'uppercase', color: 'rgba(0,0,0,.45)', margin: '0 0 7px 2px' }}>🎮 Controle da partida</p>
        <TrocaCampo2DVisual agora={agora} pendente={pendente} podeLigar onTroca={() => setPendente(p => !p)} />
        <button style={{ width: '100%', border: `2.5px solid ${INK}`, borderRadius: 12, padding: '9px 10px', fontWeight: 900, fontSize: 12, ...OSW, background: '#fff', color: INK, boxShadow: `2px 2px 0 0 ${INK}` }}>⏸️ MANUAL: pausar entre as rodadas</button>
      </div>
    </div>
  )
}
// 🏟️ ?tela=copa — o mesmo botão no controle da COPA DO MUNDO da sala (relógio do banco) e a escolha na sala de espera da LIGA
function Copa() {
  const [pend, setPend] = useState(true)
  const [liga2d, setLiga2d] = useState(true)
  const seg = (on: boolean, txt: string, f: () => void) => <button onClick={f} style={{ flex: 1, border: `2px solid ${INK}`, borderRadius: 10, padding: '7px 6px', ...OSW, fontWeight: 900, fontSize: 12, background: on ? INK : '#fff', color: on ? '#FFC400' : INK }}>{txt}</button>
  return (
    <div style={{ maxWidth: 420, margin: '0 auto', color: INK }}>
      <p style={{ ...OSW, fontWeight: 900, fontSize: 18, textTransform: 'uppercase', margin: '2px 0 8px', color: INK }}>🌐 Copa do Mundo da sala</p>
      <section className="ll27-world-controls ll31-tournament-controls">
        <div className="ll27-world-rhythm"><button>MANUAL</button><button className="selected">AUTO</button><select defaultValue="1"><option value="1">Normal</option></select></div>
        <p>A velocidade pode mudar entre os jogos. Todos acompanham o ritmo do host.</p>
        <div className="ll27-world-rhythm ll31-tournament-actions"><button className="primary" disabled>⏳ Deixa o jogo acabar…</button><button>PULAR</button></div>
        <TrocaCampo2DVisual agora={false} pendente={pend} podeLigar onTroca={() => setPend(p => !p)} />
        <button className="ll31-back-room">VOLTAR À SALA</button>
      </section>
      <p style={{ ...OSW, fontWeight: 900, fontSize: 18, textTransform: 'uppercase', margin: '16px 0 8px', color: INK }}>🏆 Sala de espera da liga (dono)</p>
      <div style={{ border: `3px solid ${INK}`, borderRadius: 14, background: '#fff', boxShadow: `3px 3px 0 0 ${INK}`, padding: 12 }}>
        <p style={{ ...OSW, fontWeight: 900, fontSize: 10.5, textTransform: 'uppercase', color: 'rgba(0,0,0,.6)', margin: '0 0 4px' }}>Como os jogos aparecem</p>
        <div style={{ display: 'flex', gap: 6 }}>{seg(!liga2d, '⚡ Placar rápido', () => setLiga2d(false))}{seg(liga2d, '📺 Campo 2D', () => setLiga2d(true))}</div>
        <p style={{ fontSize: 10.5, fontWeight: 700, color: 'rgba(0,0,0,.5)', margin: '4px 0 0' }}>Vale na próxima largada da liga. Com a temporada rolando, troque pelo botão do jogo (vale do próximo jogo).</p>
      </div>
    </div>
  )
}
if (new URLSearchParams(location.search).get('tela') === 'copa') createRoot(document.getElementById('root')!).render(<Copa />)
else createRoot(document.getElementById('root')!).render(
  <div style={{ maxWidth: 420, margin: '0 auto', color: INK }}>
    <p style={{ ...OSW, fontWeight: 900, fontSize: 18, textTransform: 'uppercase', margin: '2px 0 10px', color: INK }}>📺⚡ Sala online — botão do DONO</p>
    <Caso titulo="1) Sala no placar rápido" agora={false} pendente0={false} />
    <Caso titulo="2) Dono apertou: troca marcada" agora={false} pendente0={true} />
    <Caso titulo="3) Sala no Campo 2D" agora={true} pendente0={false} />
  </div>,
)
