// 🧪 Bancada do banner de FIM de temporada da Liga Draft (02/11): ?dono=1 (o dono) · sem = convidado
import '../../src/index.css'
import { createRoot } from 'react-dom/client'
import { useEffect } from 'react'
import { EscProvider, useEsc, reducer } from '../../src/escalacao/store'
import { OnlineEndVote } from '../../src/escalacao/screens'
import type { EscState } from '../../src/escalacao/types'
try { localStorage.setItem('bl_lang', 'pt') } catch { /* ignora */ }
const dono = new URLSearchParams(location.search).get('dono') === '1'
let s = reducer({} as EscState, { type: 'NEW_GAME' } as never)
s = reducer(s, { type: 'START_ONLINE', ligaDraft: true, minhaLigaDraft: true, liga: true, seasonNo: 1, roomId: 'r', roomCode: 'DRAFT1', isHost: true, playerIndex: 0,
  playerNames: ['Futpoint FC', 'Neymarzetti', 'VBrei'], seatUids: ['u0', 'u1', 'u2'], formation: '4-3-3', deck: 'todos', copaMode: 'liga' } as never)
s.screen = 'end'; s.isHost = dono; s.youIdx = dono ? 0 : 1; s.seasonVotes = { 1: 'mesmo' } as never; s.presence = [0, 1]
function B() { const { dispatch } = useEsc(); useEffect(() => { dispatch({ type: 'SYNC_STATE', newState: s } as never) }, [dispatch]); return <OnlineEndVote /> }
createRoot(document.getElementById('root')!).render(<EscProvider><B /></EscProvider>)
