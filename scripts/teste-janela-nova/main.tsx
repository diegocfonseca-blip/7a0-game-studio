// 🔬 BANCADA DA JANELA NOVA (21/11) — só `vite` de desenvolvimento. Abre uma carreira do Brasil Oficial na temporada `sn`, com 1
// atacante de sobra (pra ter quem vender) e, com `venc=1`, 2 contratos acabando nesta temporada. `?janela=1` liga a chave em DEV.
// uso: /scripts/teste-janela-nova/?janela=1&sn=3&venc=1[&round=38][&caixa=-50][&confirma=1 + window.qaConfirma = true]   · roteiro: `node scripts/teste-janela-nova/roda.mjs`
import { useReducer } from 'react'
import { createRoot } from 'react-dom/client'
import { EscCtxBancada, reducer, INITIAL } from '../../src/escalacao/store'
import '../../src/escalacao/screens'
import { PyramidSeasonScreen, ReserveListScreen, ConfirmaLeilao } from '../../src/escalacao/pyramidseason'
import { _bancadaApoio } from '../../src/escalacao/apoio'
import { _forcaBrasilOficialParaTeste } from '../../src/escalacao/sport'
import { carregaBaralhoOficial } from '../../src/escalacao/baralho-oficial-carga'
import type { WonCard } from '../../src/escalacao/types'
import '../../src/index.css'
const W = window as any, q = new URLSearchParams(location.search)
_bancadaApoio('auditoria-local@example.invalid', 'ouro'); _forcaBrasilOficialParaTeste(true)
await carregaBaralhoOficial()
let seed = reducer(structuredClone(INITIAL), { type: 'START_CAREER_SOLO', teamName: 'Brasiliense', formation: '4-3-3', rivals: 3, oficial: { clube: 'Brasiliense' } })
const sn = Number(q.get('sn') ?? 3)
seed = { ...seed, screen: 'season', oficialAbertura: undefined, seed: 20261121, simSpeed: 4, careerSubMode: 'dinamico', seasonNo: sn }
seed = reducer(seed, { type: 'SET_MASTER', brandId: 'dsouza' })
const you = seed.managers[seed.youIdx], ata = you.squad.find(c => c.pos === 'ATA') as WonCard
seed = { ...seed, managers: seed.managers.map(m => m.id !== you.id ? m : { ...m, squad: [...m.squad.map((c, i) => ({ ...c, contratoAte: q.get('venc') === '1' && i < 2 ? sn : sn + 3 })), { ...ata, id: 'bancada-sobra', name: 'Sobra da Silva Sauro de Nome Bem Comprido', contratoAte: sn + 3 }] }) }
if (Number(q.get('round') ?? 0)) seed = reducer(seed, { type: 'SIM_MANY', count: Number(q.get('round')) })
seed = { ...seed, careerCoins: { ...seed.careerCoins, [you.id]: Number(q.get('caixa') ?? 2000) }, careerSeen: { ...seed.careerSeen, 'guia-primeiro-jogo': true } }
function App() {
  const [state, dispatch] = useReducer(reducer, seed); W.qaState = state; W.qaDispatch = dispatch
  const noop = () => {}, ctx: any = { state, dispatch, emotes: [], emote: noop, addEmote: noop, chat: [], chatUnread: 0, sendChat: noop, chatOpen: false, setChatOpen: noop, hostStale: false, kickPlayer: noop, leaveRoom: noop }
  // `?confirma=1`: só o cartão da confirmação do leilão (na carreira ele mora na caixa da decisão do fim de temporada)
  if (q.get('confirma') === '1' && W.qaConfirma) return <EscCtxBancada.Provider value={ctx}><div style={{ background: '#EAF3FF', padding: 13, minHeight: '100vh' }}><ConfirmaLeilao mgr={state.managers[state.youIdx]} onIr={() => { W.qaFoi = 'leilao' }} onMercado={() => { W.qaFoi = 'mercado' }} /></div></EscCtxBancada.Provider>
  return <EscCtxBancada.Provider value={ctx}>{state.screen === 'season' ? <PyramidSeasonScreen /> : state.screen === 'reserveList' ? <ReserveListScreen /> : <p data-tela-fora style={{ padding: 30, font: '900 22px system-ui' }}>TELA: {state.screen}</p>}</EscCtxBancada.Provider>
}
createRoot(document.getElementById('root') as HTMLElement).render(<App />)
