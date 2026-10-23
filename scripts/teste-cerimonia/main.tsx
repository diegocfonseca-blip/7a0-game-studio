// 🧪 Bancada da CERIMÔNIA (22/10): lendas apresentadas + a conta do pregão nova, com a tela de verdade.  ?n=0..5 lendas no 1º time
import '../../src/index.css'
import { createRoot } from 'react-dom/client'
import { EscCtxBancada } from '../../src/escalacao/store'
import { EscCerimonia } from '../../src/escalacao/screens'
const q = new URLSearchParams(location.search)
const n = Number(q.get('n') ?? 2)
const L = [['Ronaldinho Gaúcho', 'Barcelona', 2005, 41], ['Kaká', 'Milan', 2007, 33], ['Romário', 'Vasco', 2000, 30], ['Zico', 'Flamengo', 1981, 25], ['Pelé', 'Santos', 1962, 20]] as const
let id = 0
const c = (name: string, club: string, year: number, pos: string, fame: number, lo: number, hi: number, paid: number) => ({ id: `c${id++}`, name, club, year, pos, fame, lo, hi, paid, via: 'leilao' })
const m1 = [...L.slice(0, n).map(([a, b, y, p]) => c(a, b, y, 'MEI', 5, 89, 96, p)), c('Cafu', 'Roma', 2001, 'LAT', 4, 80, 86, 12), c('Lúcio', 'Inter', 2010, 'ZAG', 4, 79, 85, 9)]
const m2 = [c('Francesco Totti', 'Roma', 2001, 'ATA', 5, 88, 94, 27), c('Kléberson', 'Atlético-PR', 2002, 'MEI', 2, 62, 70, 30), c('Zé Ninguém', 'Várzea', 2000, 'ZAG', 1, 55, 62, 2)]
const m3 = [c('David Beckham', 'Manchester United', 1999, 'MEI', 5, 86, 92, 8), c('Dida', 'Cruzeiro', 1997, 'GOL', 3, 75, 82, 6)]
const st = {
  screen: 'ceremony', youIdx: 0, onlineMode: 'online', isHost: true, sport: 'futebol', seasonNo: 1,
  managers: [{ id: 0, teamName: 'Power Guido', formation: '4-3-3', squad: m1, money: 3, isHuman: true }, { id: 1, teamName: 'Cativeiro FC', formation: '4-4-2', squad: m2, money: 10, isHuman: true }, { id: 2, teamName: 'Ex Bagres', formation: '4-4-2', squad: m3, money: 48, isHuman: true }],
  resenha: { furada: { 0: { total: 41, pior: { nome: 'Ronaldinho Gaúcho', pago: 55, segundo: 14 } } } },
}
createRoot(document.getElementById('root')!).render(<EscCtxBancada.Provider value={{ state: st, dispatch: () => {} } as never}><EscCerimonia /></EscCtxBancada.Provider>)
