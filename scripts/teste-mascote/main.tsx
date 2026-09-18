// 🐊 BANCADA DO "SOLTA A SUA MASCOTE" — antes × proposta, lado a lado.
//
// Diego (18/09): *"esse solta o mascote das salas online está mt pequeno e sem
// graça… sei lá"*. Ele tem razão: hoje soltar a mascote põe uma fichinha de
// 52px na fila de reações, do lado de "soltou o bicho!". A cantada 💸 tem chuva
// de dinheiro na tela inteira; a mascote do CLUBE BATIZADO tem menos teatro que
// um emoji.
//
// A proposta usa a MESMA arte e os MESMOS keyframes que a festa de campeão já
// tem (`FESTA_JEITO`: quem voa plana alto, quem rasteja ondula rente, o resto
// quica) — zero arte nova, bundle não cresce.
//
//   ?masc=<chave>  qual mascote (padrão: leao_thor)
import { createRoot } from 'react-dom/client'
import { useEffect, useState } from 'react'
import { MASCOTES, FESTA_JEITO } from '../../src/escalacao/mascotes'

const INK = '#0C0C0C', CREME = '#F4ECD6', GOLD = '#FFC400', ROXO = '#7C3AED'
const OSW = { fontFamily: 'Oswald, sans-serif', fontWeight: 900 } as const
const MASC_W = 176, MASC_H = 176
const q = new URLSearchParams(location.search)
const KEY = q.get('masc') || 'leao_thor'
const ART = MASCOTES[KEY]
const JEITO = FESTA_JEITO[KEY] ?? 'quica'

// o fundo: uma sala qualquer, só pra dar ESCALA (não é a tela real do jogo)
const Fundo = () => (
  <div style={{ position: 'absolute', inset: 0, background: CREME, padding: 14 }}>
    <div style={{ ...OSW, fontSize: 15, letterSpacing: 1 }}>🔨 PREGÃO · SETOR MEIAS</div>
    {['Zico · Flamengo 1981', 'Sócrates · Corinthians 1983', 'Raí · São Paulo 1992'].map(t => (
      <div key={t} style={{ marginTop: 9, background: '#fff', border: `3px solid ${INK}`, borderRadius: 12, boxShadow: `3px 3px 0 ${INK}`, padding: '11px 12px', ...OSW, fontSize: 13 }}>{t}</div>
    ))}
  </div>
)

// ── COMO É HOJE: a fichinha de 52px na fila de reações ──────────────────────
const Hoje = () => (
  <div style={{ position: 'absolute', left: 0, right: 0, bottom: 18, display: 'flex', justifyContent: 'center' }}>
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff', border: `2px solid ${INK}`, borderRadius: 999, padding: '4px 12px 4px 6px', boxShadow: `2px 2px 0 ${INK}` }}>
      <span style={{ display: 'inline-block', width: Math.round(MASC_W * 52 / MASC_H), height: 52, position: 'relative', flex: 'none' }}>
        <span style={{ position: 'absolute', left: 0, top: 0, width: MASC_W, height: MASC_H, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', transform: `scale(${52 / MASC_H})`, transformOrigin: 'top left' }}>{ART}</span>
      </span>
      <span style={{ ...OSW, fontSize: 12 }}>Diego: soltou o bicho! 🔊</span>
    </div>
  </div>
)

// ── PROPOSTA: a mascote ATRAVESSA a tela, grande, ~2,2 s ────────────────────
// Camada fixa, `pointer-events:none`, fora do reducer — a mesma receita da
// 💸 chuva de dinheiro: não toca em lance, tempo nem resultado.
const Solta = ({ n }: { n: number }) => {
  const conf = Array.from({ length: 14 }, (_, i) => ({
    x: (i * 137 + 20) % 100, dur: 1.5 + ((i * 79) % 90) / 100, delay: ((i * 53) % 60) / 100,
    w: 5 + (i % 3) * 2, cor: [GOLD, '#E8503A', ROXO, '#41C07A', '#fff'][i % 5], rot: (i * 47) % 360,
  }))
  const alto = JEITO === 'voa'
  return (
    <div key={n} style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 9 }}>
      <style>{`
        @keyframes mjCruza{0%{left:-34%;opacity:0}8%{opacity:1}92%{opacity:1}100%{left:108%;opacity:0}}
        @keyframes mjQuica{0%,100%{transform:translateY(0) rotate(-7deg) scaleY(.96)}50%{transform:translateY(-54px) rotate(7deg) scaleY(1.03)}}
        @keyframes mjPlana{0%,100%{transform:translateY(0) rotate(-3deg)}50%{transform:translateY(-24px) rotate(3deg)}}
        @keyframes mjOndula{0%,100%{transform:translateY(0) rotate(-9deg) scaleX(1.03)}50%{transform:translateY(-12px) rotate(9deg) scaleX(.97)}}
        @keyframes mjConf{0%{top:-8%;opacity:1}100%{top:106%;opacity:0}}
        @keyframes mjBalao{0%{transform:translateY(16px) scale(.8);opacity:0}14%{transform:translateY(0) scale(1);opacity:1}86%{opacity:1}100%{opacity:0}}
      `}</style>
      {conf.map((c, i) => (
        <span key={i} style={{ position: 'absolute', left: `${c.x}%`, top: '-8%', width: c.w, height: c.w + 4, background: c.cor, transform: `rotate(${c.rot}deg)`, animation: `mjConf ${c.dur}s linear ${c.delay}s forwards` }} />
      ))}
      <div style={{ position: 'absolute', bottom: alto ? '46%' : '14%', left: '-34%', animation: 'mjCruza 2.2s linear forwards' }}>
        <div style={{ animation: `${alto ? 'mjPlana 1.4s' : JEITO === 'rasteja' ? 'mjOndula .8s' : 'mjQuica .55s'} ease-in-out infinite` }}>{ART}</div>
        {!alto && <div style={{ width: 96, height: 13, borderRadius: 999, background: 'rgba(0,0,0,.28)', margin: '2px auto 0' }} />}
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 20, textAlign: 'center', animation: 'mjBalao 2.2s ease-out forwards' }}>
        <span style={{ display: 'inline-block', background: ROXO, color: '#fff', border: `3px solid ${INK}`, borderRadius: 999, padding: '6px 16px', boxShadow: `3px 3px 0 ${INK}`, ...OSW, fontSize: 14, textTransform: 'uppercase' }}>
          🐊 Diego soltou o bicho!
        </span>
      </div>
    </div>
  )
}

function Fone({ titulo, cor, children }: { titulo: string; cor: string; children: React.ReactNode }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ display: 'inline-block', background: cor, color: '#fff', border: `3px solid ${INK}`, borderRadius: 999, padding: '5px 18px', ...OSW, fontSize: 15, letterSpacing: 1, boxShadow: `3px 3px 0 ${INK}`, marginBottom: 12 }}>{titulo}</div>
      <div style={{ position: 'relative', width: 360, height: 640, border: `5px solid ${INK}`, borderRadius: 26, overflow: 'hidden', boxShadow: `7px 7px 0 ${INK}`, background: CREME }}>{children}</div>
    </div>
  )
}

function App() {
  const [n, setN] = useState(0)
  useEffect(() => { const iv = setInterval(() => setN(v => v + 1), 3200); return () => clearInterval(iv) }, [])
  return (
    <div style={{ display: 'flex', gap: 46, justifyContent: 'center', padding: '34px 20px' }}>
      <Fone titulo="COMO É HOJE" cor="#3E4A5A"><Fundo /><Hoje /></Fone>
      <Fone titulo="PROPOSTA" cor="#1B7A3D"><Fundo /><Solta n={n} /></Fone>
    </div>
  )
}
createRoot(document.getElementById('root')!).render(<App />)
