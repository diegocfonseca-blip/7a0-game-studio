// 🧪 Bancada da VEZ no Minha Liga Draft (23/11): relógio de 60 s desde que a vez chega, botão do chat da sala e a confirmação do
// "Pular a vez dele" (só antes do tempo acabar). ?v=minha (a sua vez) · ?v=outro (vez de outro, você é o dono) · ?v=esgotado (tempo acabou)
import '../../src/index.css'
import { createRoot } from 'react-dom/client'
import { EscCtxBancada } from '../../src/escalacao/store'
import { EscLigaDraft } from '../../src/escalacao/liga-draft-tela'
const v = new URLSearchParams(location.search).get('v') ?? 'outro'
let id = 0
const carta = (name: string, pos: string) => ({ id: `c${id++}`, name, club: 'Flamengo', year: 2019, pos, fame: 3, lo: 74, hi: 82 })
const squad = () => ['GOL', 'LAT', 'LAT', 'ZAG', 'ZAG', 'MEI', 'MEI', 'MEI', 'ATA', 'ATA', 'ATA'].map((p, i) => carta(`Jogador ${i + 1}`, p))
const nomes = ['Palmelado FC', 'Gz FC', 'Sport Clube Betasso', 'Chelsão da Massa FC', 'DEVOTOS DE DEYVERSON']
const vez = v === 'minha' ? 3 : 4
const st = {
  screen: 'draft', youIdx: 3, onlineMode: 'online', isHost: true, roomId: 'r1', roomCode: 'ABC123', sport: 'futebol', seasonNo: 5, minhaLigaDraft: true, ligaDraft: true,
  managers: nomes.map((n, i) => ({ id: i, name: n, teamName: n, formation: '4-3-3', squad: squad(), money: 40, isHuman: true })),
  draft: { temporada: 4, ordem: [0, 1, 2, 3, 4], idx: vez, fase: 'aguarda', prazo: Date.now() + (v === 'esgotado' ? -5000 : 41_000), picks: [], pulados: [], somaTemporada: false },
}
createRoot(document.getElementById('root')!).render(
  <EscCtxBancada.Provider value={{ state: st, dispatch: () => {}, kickPlayer: () => {}, leaveRoom: () => {}, chat: [], chatUnread: 2, sendChat: () => {}, chatOpen: false, setChatOpen: () => {} } as never}>
    <EscLigaDraft />
  </EscCtxBancada.Provider>)
