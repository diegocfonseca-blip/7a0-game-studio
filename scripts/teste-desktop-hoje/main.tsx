// 🧪 Bancada (23/10): leilão / liga / copa de VERDADE, no visual das salas online, pra foto de computador "como está hoje".
//   ?fase=auction|season|copa
import '../../src/index.css'
import { createRoot } from 'react-dom/client'
import { useReducer } from 'react'
import { EscCtxBancada, reducer, INITIAL } from '../../src/escalacao/store'
import { EscAuction, EscSeason } from '../../src/escalacao/screens'
import { CATALOG } from '../../src/escalacao/data'
import { applyDesktopNovoBancada } from '../../src/escalacao/sport'
if (new URLSearchParams(location.search).get('desk2')) applyDesktopNovoBancada()
const fase = new URLSearchParams(location.search).get('fase') ?? 'auction'
let n = 0
function monta() {
  let s: any = reducer(INITIAL as any, { type: 'START', teamName: 'Ex Bagres', formation: '4-3-3', rivals: 7, league: 'br', copaMode: 'liga_copa' } as any)
  // a sala online: outros 3 técnicos de gente
  const nomes = ['Neymarzetti', 'Theuzudo FC', 'Chelsão da Massa FC']
  s = { ...s, onlineMode: 'online', isHost: true, roomId: 'bancada', managers: s.managers.map((m: any, i: number) => i >= 1 && i <= 3 ? { ...m, isHuman: true, teamName: nomes[i - 1], name: nomes[i - 1] } : m) }
  if (fase === 'auction') return s
  // elencos prontos pra pular o leilão
  const pega = (pos: string, k: number) => { const L = (CATALOG as any)[pos]; return { ...L[(n++ * 7 + k) % L.length], id: `b${n}`, pos, paid: 5 } }
  const need: Record<string, number> = { GOL: 2, LAT: 3, ZAG: 3, MEI: 4, ATA: 4 }
  s = { ...s, managers: s.managers.map((m: any, i: number) => ({ ...m, squad: Object.entries(need).flatMap(([p, q]) => Array.from({ length: q }, (_, k) => pega(p, i * 13 + k))) })) }
  s = reducer(s, { type: 'REPLAY_SEASON' } as any)
  s = { ...s, onlineMode: 'online', isHost: true }
  if (fase === 'season') return reducer(s, { type: 'SIM_MANY', count: 7 } as any)
  for (let i = 0; i < 40 && s.round < 38; i++) s = reducer(s, { type: 'SIM_MANY', count: 38 } as any)
  s = reducer(s, { type: 'START_COPA' } as any)
  return { ...s, onlineMode: 'online', isHost: true }
}
function App() {
  const [state, dispatch] = useReducer(reducer as any, undefined, monta) as [any, any]
  ;(window as any).__st = state
  const Tela = state.screen === 'auction' ? EscAuction : EscSeason
  return <EscCtxBancada.Provider value={{ state, dispatch, emotes: [], emote: () => {}, chat: [], sendChat: () => {} } as any}><Tela /></EscCtxBancada.Provider>
}
createRoot(document.getElementById('root')!).render(<App />)
