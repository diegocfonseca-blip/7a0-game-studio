// 🧪🎬 Bancada da CONDIÇÃO/GÁS na aba Elenco: monta o SquadTab DE VERDADE (o mesmo
// componente do jogo) com um elenco forjado e gás variado, pra conferir a barrinha,
// o "🏃 jogos", o chip do time, o preparador e o banner do Guia — e pra GRAVAR o
// vídeo da novidade (o RODIZIAR funciona de verdade aqui e a rodada seguinte anda,
// então a barrinha anima). Não entra no jogo (só o index.html da raiz é entrada).
import { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { EscProvider, useEsc } from '../../src/escalacao/store'
import '../../src/escalacao/screens' // mesma ordem de import do app (index.tsx) — senão o ciclo store↔pyramidseason quebra na inicialização
import { SquadTab } from '../../src/escalacao/pyramidseason'
import { sugerirRodizio, GAS_JOGO, GAS_BANCO } from '../../src/escalacao/condicao'
import type { Manager, WonCard, Sector } from '../../src/escalacao/types'

const mk = (i: number, pos: Sector, name: string, club: string, year: number, fame: number, lo: number, hi: number): WonCard =>
  ({ id: `c${i}`, name, club, year, pos, fame, lo, hi, paid: 18 + i, via: 'leilao' } as unknown as WonCard)
const squad: WonCard[] = [
  mk(0, 'GOL', 'Rogério Ceni', 'São Paulo', 2005, 5, 88, 94),
  mk(1, 'LAT', 'Cafu', 'Milan', 2004, 5, 88, 94),
  mk(2, 'ZAG', 'Aldair', 'Roma', 1994, 4, 84, 90),
  mk(3, 'ZAG', 'Lúcio', 'Inter', 2010, 4, 85, 91),
  mk(4, 'LAT', 'Roberto Carlos', 'Real Madrid', 2002, 5, 90, 96),
  mk(5, 'MEI', 'Falcão', 'Internacional', 1979, 5, 88, 94),
  mk(6, 'MEI', 'Sócrates', 'Corinthians', 1983, 5, 90, 96),
  mk(7, 'MEI', 'Zico', 'Flamengo', 1981, 5, 94, 99),
  mk(8, 'ATA', 'Romário', 'Vasco', 2000, 5, 93, 99),
  mk(9, 'ATA', 'Careca', 'São Paulo', 1986, 5, 88, 94),
  mk(10, 'ATA', 'Bebeto', 'Vasco', 1989, 5, 88, 94),
  mk(11, 'GOL', 'Taffarel', 'Internacional', 1989, 4, 84, 90),
  mk(12, 'LAT', 'Júnior', 'Flamengo', 1981, 5, 88, 94),
  mk(13, 'ZAG', 'Mozer', 'Flamengo', 1987, 3, 78, 86),
  mk(14, 'MEI', 'Raí', 'São Paulo', 1992, 5, 88, 94),
  mk(15, 'MEI', 'Djalminha', 'Palmeiras', 1996, 4, 83, 88),
  mk(16, 'ATA', 'Edmundo', 'Vasco', 1997, 4, 85, 91),
  mk(17, 'ATA', 'Túlio', 'Botafogo', 1995, 3, 76, 86),
]
const mgr = { id: 7, name: 'Diego', teamName: 'Nova Eclipse', isHuman: true, auctionRival: false, squad, formation: '4-3-3' } as unknown as Manager
const GAS0: Record<string, number> = { c0: 79, c1: 30, c2: 65, c3: 16, c4: 44, c5: 72, c6: 23, c7: 86, c8: 30, c9: 58, c10: 51, c11: 100, c12: 100, c13: 100, c14: 100, c15: 100, c16: 100, c17: 100 }
const JOGOS0: Record<string, number> = { c0: 3, c1: 10, c2: 5, c3: 12, c4: 8, c5: 4, c6: 11, c7: 2, c8: 10, c9: 6, c10: 7, c11: 0, c12: 1, c13: 2, c14: 3, c15: 0, c16: 4, c17: 1 }
const goals: Record<string, number> = { c7: 14, c8: 19, c9: 11, c10: 9, c14: 6, c16: 8 }
const col = { solid: '#1B7A3D', light: '#CBEFD7' }

function Bancada() {
  const [xi, setXi] = useState(squad.slice(0, 11).map(c => c.id))
  const [gas, setGas] = useState(GAS0)
  const [jogos, setJogos] = useState(JOGOS0)
  const xiCards = xi.map(id => squad.find(c => c.id === id)!)
  // 🔁 o botão do preparador aplica a sugestão DE VERDADE (mesma função do jogo)
  const rodizio = () => { const s = sugerirRodizio(xi, squad, gas); if (s) setXi(s.ids) }
  // ▶️ "próxima rodada": titulares gastam, banco recupera — é isto que anima a barrinha
  const proxima = () => {
    const emCampo = new Set(xi)
    setGas(g => Object.fromEntries(squad.map(c => [c.id, emCampo.has(c.id) ? Math.max(0, (g[c.id] ?? 100) - GAS_JOGO) : Math.min(100, (g[c.id] ?? 100) + GAS_BANCO)])))
    setJogos(j => Object.fromEntries(squad.map(c => [c.id, (j[c.id] ?? 0) + (emCampo.has(c.id) ? 1 : 0)])))
  }
  ;(window as unknown as Record<string, unknown>).__bench = { rodizio, proxima }
  return (
    <SquadTab mgr={mgr} col={col as never} coins={168} xiIds={new Set(xi)} xi={xiCards} goals={goals} assists={{}}
      onSwap={() => {}} selId={null} seasonNo={6} contratosOn={false} olheiros={false}
      condicao={{ gas, jogos, volta: () => 0, onRodizio: rodizio, suspensoId: undefined }} />
  )
}
// ?semguia: fecha os banners do Guia já na montagem (pro vídeo abrir direto na lista)
function SemGuia() {
  const { dispatch } = useEsc()
  useEffect(() => { if (location.search.includes('semguia')) for (const k of ['salario', 'condicao']) dispatch({ type: 'MARK_CAREER_SEEN', key: k }) }, [dispatch])
  return null
}
const cap = (t: string, s?: string) => { const el = document.getElementById('cap'); if (el) el.innerHTML = t + (s ? `<small>${s}</small>` : '') }
;(window as unknown as Record<string, unknown>).__cap = cap
createRoot(document.getElementById('root')!).render(<EscProvider><SemGuia /><Bancada /></EscProvider>)
