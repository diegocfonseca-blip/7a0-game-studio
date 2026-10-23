// 🧪 Bancada do cartão ESCALAÇÕES SALVAS (23/10): Time A = o que está em campo; Time B salvo com quem foi vendido.
import '../../src/index.css'
import { createRoot } from 'react-dom/client'
import { useReducer, useState } from 'react'
import { EscCtxBancada, reducer } from '../../src/escalacao/store'
import { EscalacaoAB, timeEmCampo } from '../../src/escalacao/escalacao-ab-ui'
import { chaveCarta } from '../../src/escalacao/escalacao-salva'
document.body.style.background = '#F4ECD6'
const c = (id: string, name: string, pos: string, lv = 80) => ({ id, name, club: 'Vasco', year: 1997, pos, fame: 3, lo: lv - 3, hi: lv + 3, paid: 5 })
const squad = [c('g1', 'Taffarel', 'GOL'), c('l1', 'Cafu', 'LAT'), c('l2', 'R. Carlos', 'LAT'), c('z1', 'Aldair', 'ZAG'), c('z2', 'Lúcio', 'ZAG'), c('m1', 'Dunga', 'MEI'), c('m2', 'Kaká', 'MEI'), c('m3', 'Rivaldo', 'MEI'),
  c('a1', 'Bebeto', 'ATA'), c('a3', 'Edmundo', 'ATA'), c('a5', 'Pelé', 'ATA', 99), c('g2', 'Dida', 'GOL', 70), c('l3', 'Zé Maria', 'LAT', 70), c('z3', 'Mauro Galvão', 'ZAG', 70), c('m4', 'Mauro Silva', 'MEI', 72), c('m5', 'Zinho', 'MEI', 75), c('a4', 'Viola', 'ATA', 70)]
const xiA = ['g1', 'l1', 'l2', 'z1', 'z2', 'm1', 'm2', 'm3', 'a1', 'a4', 'a3']
const keys = (ids: string[]) => ids.map(id => chaveCarta(squad.find(x => x.id === id)!))
const romario = 'Romário|Vasco|1997'
const st0 = {
  screen: 'season', careerOnline: true, onlineMode: 'solo', sport: 'futebol', seasonNo: 3, round: 12, youIdx: 0, seed: 1, careerLineup: {},
  managers: [{ id: 1, name: 'Diego', teamName: 'Nova Eclipse', isHuman: true, formation: '4-3-3', money: 100, squad }],
  careerEscalacoes: { 1: {
    ativo: { qual: 'A', ids: xiA },
    A: { f: '4-3-3', keys: keys(xiA), pos: xiA.map(id => squad.find(x => x.id === id)!.pos), elenco: keys(squad.filter(x => x.id !== 'a5').map(x => x.id)), t: 3, r: 3 },
    B: { f: '4-3-3', keys: [...keys(['g1', 'l1', 'l2', 'z1', 'z2', 'm1', 'm2', 'm3', 'a1']), romario, ...keys(['a3'])], pos: ['GOL', 'LAT', 'LAT', 'ZAG', 'ZAG', 'MEI', 'MEI', 'MEI', 'ATA', 'ATA', 'ATA'], elenco: [...keys(squad.filter(x => x.id !== 'a5').map(x => x.id)), romario], t: 3, r: 9 },
  } },
}
function App() {
  const [state, dispatch] = useReducer(reducer as never, st0 as never) as [any, any]
  const m = state.managers[0]
  const xi = state.careerLineup?.[1]?.[state.round] ?? xiA
  const [aberto, setAberto] = useState(false)
  const q = timeEmCampo(state, m, xi)
  const pil = (t: string, on = false, f?: () => void) => <button onClick={f} style={{ flex: 1, fontFamily: 'Oswald', fontWeight: 900, fontSize: 11.5, padding: '6px 8px', border: '2.5px solid #0C0C0C', borderRadius: 9, background: on ? '#0C0C0C' : '#fff', color: on ? '#FFC400' : '#0C0C0C' }}>{t} {on ? '▴' : '▾'}</button>
  return <div style={{ maxWidth: 400, margin: '0 auto' }}><EscCtxBancada.Provider value={{ state, dispatch }}>
    <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>{pil(`🎽 ${m.formation}`)}{pil('🔄 Dinâmico')}{pil(q ? `💾 Time ${q}` : '💾 Time A/B', aberto, () => setAberto(v => !v))}</div>
    <EscalacaoAB mgr={m} xiIds={xi} fora={new Set(['m2'])} gas={{ l1: 30 }} aberto={aberto} fechar={() => setAberto(false)} />
    <div style={{ height: 200, background: 'repeating-linear-gradient(#1f8a45 0 34px,#1a7a3c 34px 68px)', border: '3px solid #000', borderRadius: 14 }} />
  </EscCtxBancada.Provider></div>
}
createRoot(document.getElementById('root')!).render(<App />)
