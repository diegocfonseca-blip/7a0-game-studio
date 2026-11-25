// 🧪 Bancada das TÁTICAS NOVAS na Partida Rápida OFFLINE (25/11): liga sem sala, rodada 0.
//   ?aba=jogo   → a tela da temporada (próximo jogo + tática)
//   ?aba=elenco → a aba Elenco (campinho + tática embaixo da formação)
import '../../src/index.css'
import { createRoot } from 'react-dom/client'
import { useEffect } from 'react'
import { EscProvider, useEsc, reducer } from '../../src/escalacao/store'
import { EscSeason } from '../../src/escalacao/screens'
import { EscalacaoMinha } from '../../src/escalacao/minha-escalacao'
import type { EscState, Card } from '../../src/escalacao/types'
import { todasAsCartas, chaveNome } from '../../src/escalacao/liga-draft'

const aba = new URLSearchParams(location.search).get('aba') ?? 'jogo'
try { localStorage.setItem('bl_lang', 'pt') } catch { /* ignora */ }
const UID = '11111111-2222-4333-8444-555555555555'
function monta(): EscState {
  let s = reducer({} as EscState, { type: 'NEW_GAME' } as never)
  s = reducer(s, { type: 'START_ONLINE', liga: true, seasonNo: 1, roomId: 'r', roomCode: 'DRAFT1', isHost: true, playerIndex: 0,
    playerNames: ['Butinas FC', 'Fabulous EC', 'K9 FC', 'Tocaia SC'], seatUids: [UID, 'u1', 'u2', 'u3'], formation: '4-3-3', deck: 'todos', copaMode: 'liga' } as never)
  // elencos de verdade (baralho), 11 por time, e uma liga mínima com rodadas
  const usados = new Set<string>(); let k = 0
  const cartas = todasAsCartas().filter(c => c.fame <= 3 && !c.promessa)
  for (const m of s.managers) {
    const sq: Card[] = []
    for (const [pos, n] of [['GOL', 1], ['LAT', 2], ['ZAG', 2], ['MEI', 3], ['ATA', 3]] as const) for (let i = 0; i < n; i++) {
      const c = cartas.find(x => x.pos === pos && !usados.has(chaveNome(x.name)))!
      usados.add(chaveNome(c.name)); sq.push({ ...c, id: `b${k++}` })
    }
    m.squad = sq.map(c => ({ ...c, paid: 1, via: 'leilao' as const })) as never
  }
  const ids = s.managers.map(m => m.id)
  s.league = s.managers.map(m => ({ id: m.id, name: m.teamName, isManager: true, baseAtk: 0, baseDef: 0, pts: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0 })) as never
  const pares: [number, number][][] = []
  for (let r = 0; r < Math.max(1, ids.length - 1); r++) { const a = [ids[0], ...ids.slice(1).map((_, i) => ids[1 + ((i + r) % (ids.length - 1))])]; const rod: [number, number][] = []; for (let i = 0; i < a.length / 2; i++) rod.push([a[i], a[a.length - 1 - i]]); pares.push(rod) }
  s.fixtures = [...pares, ...pares.map(r => r.map(([h, a]) => [a, h] as [number, number]))]
  s = { ...s, onlineMode: 'cpu', roomId: '', roomCode: '', isHost: true, youIdx: 0, youUid: undefined, seatUids: undefined, ligaDraft: false, minhaLigaDraft: false, screen: 'season', round: 0, lastResults: [], scorers: [], assists: [], news: [], champion: null, tactics: {} } as EscState
  return s
}
const ESTADO = monta()
try { localStorage.setItem('esc-solo-inprogress-v1', JSON.stringify(ESTADO)) } catch { /* ignora */ }
function Bancada() {
  const { dispatch, state } = useEsc()
  void dispatch; void useEffect
  if (!state.managers?.length) return null
  return aba === 'elenco' ? <div style={{ maxWidth: 760, margin: '0 auto', padding: 12 }}><EscalacaoMinha /></div> : <EscSeason />
}
createRoot(document.getElementById('root')!).render(<EscProvider><Bancada /></EscProvider>)
