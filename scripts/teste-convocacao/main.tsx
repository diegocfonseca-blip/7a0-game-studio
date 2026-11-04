// 🧪 Bancada da CONVOCAÇÃO do Leilão de Clubes (04/11): a tela de verdade com 5 pacotes de mentira, pra conferir o PC (3 colunas)
// e o celular. Abrir /scripts/teste-convocacao/index.html em 1440px e em 390px.
import '../../src/index.css'
import { createRoot } from 'react-dom/client'
import { EscCtxBancada } from '../../src/escalacao/store'
import { EscConvocacaoClubes } from '../../src/escalacao/convocacao-clubes'
let id = 0
const c = (name: string, club: string, year: number, pos: string) => ({ id: `c${id++}`, name, club, year, pos, fame: 4, lo: 80, hi: 88 })
const pac = (pos: string, clube: string, nomes: [string, string, number][]) => ({ ...c(`Pacote ${pos}`, clube, 2000, pos), paid: 10, via: 'leilao', pacote: { clube, cartas: nomes.map(([n, cl, y]) => c(n, cl, y, pos)) } })
const squad = [
  pac('GOL', 'Holanda', [['Van der Sar', 'Ajax', 1995], ['Stekelenburg', 'Ajax', 2010], ['Krul', 'Newcastle', 2014], ['Cillessen', 'Ajax', 2014], ['Van Breukelen', 'PSV', 1988], ['Verbeek', 'AZ', 2002]]),
  pac('LAT', 'Brasil', [['Cafu', 'Roma', 2001], ['Roberto Carlos', 'Real Madrid', 2002], ['Jorginho', 'Flamengo', 1994], ['Branco', 'Fluminense', 1994], ['Maicon', 'Inter', 2010]]),
  pac('ZAG', 'Itália', [['Cannavaro', 'Juventus', 2006], ['Nesta', 'Milan', 2003], ['Maldini', 'Milan', 1994], ['Chiellini', 'Juventus', 2015], ['Bonucci', 'Juventus', 2017], ['Baresi', 'Milan', 1990], ['Materazzi', 'Inter', 2006]]),
  pac('MEI', 'Argentina', [['Riquelme', 'Boca Juniors', 2001], ['Verón', 'Lazio', 2000], ['Redondo', 'Real Madrid', 1998], ['Aimar', 'Valencia', 2004], ['Simeone', 'Atlético', 1996], ['Cambiasso', 'Inter', 2010]]),
  pac('ATA', 'França', [['Henry', 'Arsenal', 2004], ['Zidane', 'Real Madrid', 2002], ['Papin', 'Milan', 1993], ['Trezeguet', 'Juventus', 2005], ['Cantona', 'Manchester United', 1996], ['Benzema', 'Real Madrid', 2022]]),
]
const st = {
  screen: 'convocacao', youIdx: 0, onlineMode: 'online', isHost: true, sport: 'futebol', seasonNo: 1, convocacaoDeadline: Date.now() + 48_000,
  managers: [{ id: 0, teamName: 'Neymarzetti', formation: '4-3-3', squad, money: 20, isHuman: true, modoClubes: true }, { id: 1, teamName: 'Futpoint FC', formation: '4-3-3', squad: [], money: 10, isHuman: true, modoClubes: true }],
}
createRoot(document.getElementById('root')!).render(<EscCtxBancada.Provider value={{ state: st, dispatch: () => {}, kickPlayer: () => {}, leaveRoom: () => {} } as never}><EscConvocacaoClubes /></EscCtxBancada.Provider>)
