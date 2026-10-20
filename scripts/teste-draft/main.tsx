// 🧪 Bancada da NOITE DO DRAFT (Liga Draft, 19/10) — monta a tela DE VERDADE (`EscLigaDraft`) com um estado feito pelo
// próprio motor (reducer), pra tirar print antes de publicar. Nada de nome inventado: as cartas vêm do baralho.
//   ?cena=espera   → outro técnico escolhendo (carta coberta)
//   ?cena=escolha  → a SUA vez (lista de todos do jogo)
//   ?cena=sai      → você tocou num jogador: "quem sai pra ele entrar?"
//   ?cena=revela&t=5000 → o anúncio, t ms depois de a escolha ser feita (0 · 2000 · 4000 · 6000 · 9000)
import '../../src/index.css' // o mesmo CSS do app (Tailwind), senão a bancada mente
import { createRoot } from 'react-dom/client'
import { useEffect } from 'react'
import { EscProvider, useEsc, reducer } from '../../src/escalacao/store'
import '../../src/escalacao/screens'
import { EscLigaDraft } from '../../src/escalacao/liga-draft-tela'
import { todasAsCartas, chaveNome, chaveCarta } from '../../src/escalacao/liga-draft'
import type { EscState, Card } from '../../src/escalacao/types'

const q = new URLSearchParams(location.search)
const cena = q.get('cena') ?? 'escolha'
const T = Number(q.get('t') ?? 0)
try { localStorage.setItem('bl_lang', 'pt') } catch { /* ignora */ }

function monta(): EscState {
  let s = reducer({} as EscState, { type: 'NEW_GAME' } as never)
  s = reducer(s, { type: 'START_ONLINE', ligaDraft: true, liga: true, seasonNo: 1, roomId: 'r', roomCode: 'DRAFT1', isHost: true, playerIndex: 0,
    playerNames: ['Butinas FC', 'Fabulous EC', 'K9 FC', 'Tocaia SC'], seatUids: ['u0', 'u1', 'u2', 'u3'], formation: '4-3-3', deck: 'todos', copaMode: 'liga' } as never)
  // elencos fracos de verdade (profissional e bom) pros 4 humanos
  const usados = new Set(s.managers.flatMap(m => m.squad.map(c => chaveNome(c.name))))
  const fracas = todasAsCartas().filter(c => c.fame <= 2 && !c.promessa)
  let k = 0
  for (const m of s.managers.filter(m => m.isHuman)) {
    const sq: Card[] = []
    for (const [pos, n] of [['GOL', 1], ['LAT', 2], ['ZAG', 2], ['MEI', 3], ['ATA', 3]] as const) for (let i = 0; i < n; i++) {
      const c = fracas.find(x => x.pos === pos && !usados.has(chaveNome(x.name)))!
      usados.add(chaveNome(c.name)); sq.push({ ...c, id: `b${k++}` })
    }
    m.squad = sq.map(c => ({ ...c, paid: 1, via: 'leilao' as const }))
  }
  s.league = s.managers.map((m, i) => ({ id: m.id, name: m.teamName, isManager: true, baseAtk: 0, baseDef: 0, pts: [80, 74, 90, 61][i] ?? 40 - i, w: 20, d: 0, l: 0, gf: 50, ga: 20 }))
  s.fixtures = Array.from({ length: 38 }, () => [])
  s.round = 38; s.screen = 'end'
  s = reducer(s, { type: 'DRAFT_ABRIR' } as never) // ordem: K9 (90) → Butinas (80) → Fabulous (74) → Tocaia (61)
  // o K9 escolhe o Romário do Vasco 2000 (lenda, com avatar)
  const romario = todasAsCartas().find(c => c.name === 'Romário' && c.club === 'Vasco' && c.year === 2000)!
  s = reducer(s, { type: 'DRAFT_ESCOLHER', mgrId: 2, carta: chaveCarta(romario), sai: s.managers[2].squad.find(c => c.pos === 'ATA')!.id } as never)
  const d = s.draft!
  if (cena === 'revela') { d.inicioRevela = Date.now() - T; d.prazo = Date.now() + 3_600_000 }
  else { d.idx = 1; d.fase = 'escolha'; d.inicioRevela = undefined; d.prazo = Date.now() + 47_000 }
  s.onlineMode = 'cpu'; s.isHost = true
  s.youIdx = cena === 'espera' ? 1 : 0 // espera: sou o Fabulous olhando o Butinas escolher
  return s
}
const ESTADO = monta()

function Bancada() {
  const { dispatch } = useEsc()
  useEffect(() => { dispatch({ type: 'SYNC_STATE', newState: ESTADO } as never) }, [dispatch])
  useEffect(() => {
    if (cena !== 'sai') return
    const iv = setInterval(() => {
      const b = [...document.querySelectorAll('button')].find(x => x.textContent?.includes('ZICO') || x.textContent?.includes('Zico'))
      if (b) { (b as HTMLButtonElement).click(); clearInterval(iv); setTimeout(() => (document.querySelectorAll('.grid button')[1] as HTMLButtonElement | undefined)?.click(), 200) }
    }, 200)
    return () => clearInterval(iv)
  }, [])
  return <EscLigaDraft />
}
createRoot(document.getElementById('root')!).render(<EscProvider><Bancada /></EscProvider>)
