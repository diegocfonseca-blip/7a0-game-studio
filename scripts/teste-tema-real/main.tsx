// 🧪 Bancada: a cara de cada copa nas TELAS DE VERDADE (23/10).  ?t=liberta|champions
import '../../src/index.css'
import { createRoot } from 'react-dom/client'
import { EscCtxBancada } from '../../src/escalacao/store'
import { EscLiberta, EscChampions } from '../../src/escalacao/screens'
const q = new URLSearchParams(location.search)
const t = q.get('t') ?? 'liberta'
const N = ['K9 FC', 'Ex Bagres', 'Futpoint', 'Leite de Verdade FC', 'Manfré FC', 'Inter Vale', 'Arrogantchi FC', 'Fabulous EC', 'Real Madruga', 'La Bestia Negra', 'Guimarães', 'Briga de Galo', 'Marolados', 'Fala D10', 'Julia Barranquila', 'Grêmio FBPA']
const nome = (i: number) => N[i % N.length] + (i >= N.length ? ` ${Math.floor(i / N.length) + 1}` : '')
const sq = [['Taffarel','GOL'],['Cafu','LAT'],['Lúcio','ZAG'],['Aldair','ZAG'],['R. Carlos','LAT'],['Dunga','MEI'],['Kaká','MEI'],['Rivaldo','MEI'],['Romário','ATA'],['Ronaldo','ATA'],['Bebeto','ATA']].map(([n, p], i) => ({ id: `s${i}`, name: n, club: 'Vasco', year: 1997, pos: p, fame: 4, lo: 80, hi: 88, paid: 10 }))
const managers = [0, 1].map(i => ({ id: i, teamName: N[i], formation: '4-3-3', squad: sq, money: 10, isHuman: true, name: i ? 'Rival' : 'Diego' }))
const z = (i: number) => ({ pts: 9 - (i % 4) * 2, w: 3 - (i % 4), d: 0, l: i % 4, gf: 6 - (i % 4), ga: 2 + (i % 4) })
const res = (a: number, b: number, hg: number, ag: number) => ({ homeId: a, awayId: b, hg, ag, highlights: hg ? [{ min: 23, teamId: a, text: '⚽ Romário marca para K9 FC.' }] : [] })
const base = { screen: t, youIdx: 0, onlineMode: 'online', isHost: true, sport: 'futebol', seasonNo: 1, seed: 7, round: 38, managers, league: [], news: [], simSpeed: 1, tactics: {}, scorers: [], assists: [] }
let st: object
if (t === 'liberta') {
  const times = Array.from({ length: 32 }, (_, i) => ({ id: i, name: nome(i), pote: (1 + Math.floor(i / 8)) as 1, grupo: i % 8, isManager: i < 2, baseAtk: 70, baseDef: 70, ...z(Math.floor(i / 8)) }))
  st = { ...base, liberta: { fase: 'grupos', times, rodada: 3, fixtures: [], lastResults: [res(0, 8, 2, 1), res(16, 24, 0, 0), res(1, 9, 1, 3)] } }
} else {
  const times = Array.from({ length: 36 }, (_, i) => ({ id: i, name: nome(i), pote: 1 as const, isManager: i < 2, baseAtk: 70, baseDef: 70, pts: 18 - Math.floor(i / 2), w: 6 - Math.floor(i / 6), d: 0, l: Math.floor(i / 6), gf: 14 - Math.floor(i / 3), ga: 4 + Math.floor(i / 4) }))
  st = { ...base, champions: { fase: 'tabela', times, rodada: 4, fixtures: Array.from({ length: 8 }, () => Array.from({ length: 18 }, (_, i) => [i, i + 18] as [number, number])), lastResults: [res(0, 9, 2, 1), res(1, 10, 1, 1)] } }
}
const Tela = t === 'liberta' ? EscLiberta : EscChampions
createRoot(document.getElementById('root')!).render(<EscCtxBancada.Provider value={{ state: st, dispatch: () => {} } as never}><Tela /></EscCtxBancada.Provider>)
