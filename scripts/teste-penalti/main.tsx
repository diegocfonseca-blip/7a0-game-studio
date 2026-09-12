// 🎬 Bancada do PÊNALTI ILUSTRADO pra gravar o vídeo da novidade (12/09). Monta o
// PenaltyBanner DE VERDADE (o mesmo componente da carreira) com um elenco forjado.
// Não entra no jogo (só o index.html da raiz é entrada do build).
import { createRoot } from 'react-dom/client'
import { EscProvider } from '../../src/escalacao/store'
import '../../src/escalacao/screens' // mesma ordem de import do app — senão o ciclo store↔pyramidseason quebra
import { PenaltyBanner } from '../../src/escalacao/pyramidseason'
import type { Manager, WonCard, Sector } from '../../src/escalacao/types'

const mk = (i: number, pos: Sector, name: string, club: string, year: number, fame: number, lo: number, hi: number): WonCard =>
  ({ id: `c${i}`, name, club, year, pos, fame, lo, hi, paid: 18 + i, via: 'leilao' } as unknown as WonCard)
const squad: WonCard[] = [
  mk(0, 'ATA', 'Romário', 'Vasco', 2000, 5, 93, 99),
  mk(1, 'MEI', 'Zico', 'Flamengo', 1981, 5, 94, 99),
  mk(2, 'ATA', 'Careca', 'São Paulo', 1986, 5, 88, 94),
  mk(3, 'MEI', 'Sócrates', 'Corinthians', 1983, 5, 90, 96),
  mk(4, 'LAT', 'Roberto Carlos', 'Real Madrid', 2002, 5, 90, 96),
  mk(5, 'ATA', 'Bebeto', 'Vasco', 1989, 5, 88, 94),
]
const mgr = { id: 7, name: 'Diego', teamName: 'Nova Eclipse', isHuman: true, auctionRival: false, squad, formation: '4-3-3' } as unknown as Manager

const cap = (t: string, s?: string) => { const el = document.getElementById('cap')!; el.innerHTML = t + (s ? `<small>${s}</small>` : '') }
;(window as unknown as Record<string, unknown>).__cap = cap

createRoot(document.getElementById('root')!).render(
  <EscProvider>
    <PenaltyBanner mgr={mgr} homeName="Nova Eclipse" awayName="Murriz FC" homeG={1} awayG={1} youIsHome mascote={null}
      onDone={() => cap('⚡ Já está no jogo — Carreira', 'leilaolegends.com 🔨')} />
  </EscProvider>,
)
