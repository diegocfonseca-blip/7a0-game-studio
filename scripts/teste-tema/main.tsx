// 🧪 Mockup: simulação (liga/copa) com a cara de cada campeonato — HOJE × COMO FICARIA (23/10). ?c=liberta,champions,mundo
import '../../src/index.css'
import { createRoot } from 'react-dom/client'
import '../../src/escalacao/screens'
import { COMPS, Trofeu, type CompId } from '../../src/escalacao/competicoes-visual'
import { Escudo } from '../../src/escalacao/escudos'
const INK = '#0C0C0C', OSW = { fontFamily: 'Oswald, sans-serif', fontWeight: 800, textTransform: 'uppercase' as const }
const TAB = ['K9 FC', 'Ex Bagres', 'Futpoint', 'Leite de Verdade FC', 'Manfré FC', 'Inter Vale']
const OUT = [['Futpoint', 'Manfré FC', '1', '0'], ['Leite de Verdade FC', 'Inter Vale', '2', '2']]
type T = { nome: string; bg: string; ac: string; acInk: string; zona: string[]; frase?: string; comp?: CompId }
const HOJE: T = { nome: 'Libertadores', bg: INK, ac: '#FFC400', acInk: INK, zona: ['#1B7A3D', '#1B7A3D', '#1B7A3D', '#1B7A3D', '#ddd', '#ddd'] }
const ZONA: Partial<Record<CompId, string[]>> = { liberta: ['#C9A227','#C9A227','#B5121B','#B5121B','#ddd','#ddd'], champions: ['#1F3A93','#1F3A93','#8E9AA8','#8E9AA8','#ddd','#ddd'], mundo: ['#2FBF5A','#2FBF5A','#ddd','#ddd','#ddd','#ddd'], nordeste: ['#E86A1C','#E86A1C','#ddd','#ddd','#ddd','#ddd'], liga: ['#FFC400','#1B7A3D','#1B7A3D','#ddd','#C2452F','#C2452F'], copa8: ['#FFC400','#FFC400','#ddd','#ddd','#ddd','#ddd'] }
const tema = (id: CompId): T => { const c = COMPS[id]; return { nome: c.nome[0], bg: c.bg, ac: c.vsBg, acInk: c.vsInk, zona: ZONA[id] ?? HOJE.zona, frase: c.frase[0], comp: id } }
const Bolinha = ({ n }: { n: number }) => <span style={{ position: 'absolute', right: -14, top: -12, width: 28, height: 28, borderRadius: 99, background: '#E8503A', color: '#fff', border: `3px solid ${INK}`, ...OSW, fontSize: 15, display: 'grid', placeItems: 'center', zIndex: 5 }}>{n}</span>
function Tela({ t, hoje }: { t: T; hoje?: boolean }) {
  const box = { color: INK, background: '#fff', border: `3px solid ${INK}`, borderRadius: 16, boxShadow: `4px 4px 0 ${INK}`, overflow: 'hidden' as const, position: 'relative' as const }
  return <div style={{ width: 330 }}>
    <div style={{ ...OSW, fontSize: 22, marginBottom: 8, color: hoje ? '#666' : INK }}>{hoje ? 'HOJE' : 'COMO FICARIA'}<span style={{ display: 'block', fontSize: 13, letterSpacing: '.08em', color: '#555' }}>{hoje ? 'toda copa igual' : t.nome}</span></div>
    <div style={{ background: '#F4ECD6', border: `4px solid ${INK}`, borderRadius: 26, padding: 12, display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* ① faixa do topo */}
      <div style={{ ...box, background: t.bg, color: '#fff', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10, overflow: 'visible' }}>
        {!hoje && <Bolinha n={1} />}
        {t.comp ? <Trofeu comp={t.comp} size={44} /> : <span style={{ fontSize: 30 }}>🏆</span>}
        <div><div style={{ ...OSW, fontSize: 19, lineHeight: 1 }}>{t.nome}</div><div style={{ ...OSW, fontSize: 11, opacity: .8, letterSpacing: '.08em' }}>fase de grupos · rodada 3</div></div>
      </div>
      {/* ② placar */}
      <div style={{ ...box, overflow: 'visible', padding: '12px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {!hoje && <Bolinha n={2} />}
        <div style={{ textAlign: 'center', width: 90 }}><Escudo nome="K9 FC" size={52} /><div style={{ ...OSW, fontSize: 12 }}>K9 FC</div></div>
        <div style={{ textAlign: 'center' }}><div style={{ ...OSW, fontWeight: 900, fontSize: 38, lineHeight: 1 }}>2 × 1</div>
          <span style={{ display: 'inline-block', marginTop: 6, background: t.ac, color: t.acInk, border: `2px solid ${INK}`, borderRadius: 8, padding: '1px 10px', ...OSW, fontSize: 13 }}>67'</span></div>
        <div style={{ textAlign: 'center', width: 90 }}><Escudo nome="Ex Bagres" size={52} /><div style={{ ...OSW, fontSize: 12 }}>Ex Bagres</div></div>
      </div>
      <div style={{ ...box, padding: 10, textAlign: 'center', ...OSW, fontSize: 13, color: '#777' }}>🎮 controle da partida (igual)</div>
      {/* ③ tabela */}
      <div style={{ ...box, overflow: 'visible' }}>
        {!hoje && <Bolinha n={3} />}
        <div style={{ borderRadius: '13px 13px 0 0', overflow: 'hidden' }}>
        <div style={{ background: hoje ? INK : t.bg, color: '#fff', ...OSW, fontSize: 14, padding: '6px 12px' }}>Grupo A</div>
        {TAB.slice(0, 4).map((n, i) => <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderTop: '1px solid #0001', background: i === 0 ? t.ac + '33' : '#fff', fontWeight: 700, fontSize: 13 }}>
          <span style={{ width: 6, height: 20, borderRadius: 3, background: t.zona[i] }} /><b style={{ width: 14 }}>{i + 1}</b><Escudo nome={n} size={20} /><span style={{ flex: 1 }}>{n}</span><b>{9 - i * 2}</b></div>)}
        </div>
      </div>
      {/* outros jogos */}
      <div style={{ ...box }}>
        <div style={{ ...OSW, fontSize: 13, padding: '6px 12px', borderBottom: '1px solid #0002' }}>Outros jogos</div>
        {OUT.map(([a, b, x, y]) => <div key={a} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', fontSize: 12.5, fontWeight: 700 }}><Escudo nome={a} size={18} /><span style={{ flex: 1 }}>{a}</span><b style={{ ...OSW }}>{x} × {y}</b><span style={{ flex: 1, textAlign: 'right' }}>{b}</span><Escudo nome={b} size={18} /></div>)}
      </div>
      {/* ④ frase */}
      {t.frase && <div style={{ position: 'relative', background: t.ac, color: t.acInk, border: `3px solid ${INK}`, borderRadius: 12, boxShadow: `3px 3px 0 ${INK}`, ...OSW, fontSize: 14, textAlign: 'center', padding: 8 }}><Bolinha n={4} />🏆 {t.frase}</div>}
    </div>
  </div>
}
const ids = (new URLSearchParams(location.search).get('c') ?? 'liberta,champions,mundo').split(',') as CompId[]
document.body.style.background = '#F4ECD6'
createRoot(document.getElementById('root')!).render(<div style={{ background: '#F4ECD6', color: INK, padding: 16 }}>
  <div style={{ ...OSW, fontSize: 30, color: INK }}>Simulação com a cara da copa</div>
  <div style={{ fontSize: 15, marginBottom: 16, fontWeight: 600 }}>Mesma tela, mesmo lugar de tudo. Muda só o que tem bolinha vermelha: <b>① faixa com troféu</b> · <b>② relógio na cor da copa</b> · <b>③ tabela com as cores de quem passa</b> · <b>④ frase da copa</b></div>
  <div style={{ display: 'flex', gap: 26, alignItems: 'flex-start' }}><Tela t={HOJE} hoje />{ids.map(i => <Tela key={i} t={tema(i)} />)}</div>
</div>)
