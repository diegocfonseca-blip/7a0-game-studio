// 🧪 Bancada do TAMANHO DO ELENCO — monta o `SquadTab` DE VERDADE com N jogadores,
// pra MEDIR (não chutar) o quanto a aba Elenco cresce se o elenco aumentar.
// Pergunta do Diego (15/09): *"o tamanho do elenco, se cabe eu colocar mais gente…
// pelo menos mais um de cada posição… se vai atrapalhar visualmente"*.
//   ?n=22  → como é hoje (2× a formação)
//   ?n=27  → +1 por posição
//   ?n=31  → 27 + os 4 emprestados da SAF na Série A
import { createRoot } from 'react-dom/client'
import { EscProvider } from '../../src/escalacao/store'
import '../../src/escalacao/screens' // mesma ordem do app (o ciclo store↔pyramidseason quebra sem isto)
import { SquadTab } from '../../src/escalacao/pyramidseason'
import type { Manager, WonCard, Sector } from '../../src/escalacao/types'

const N = Number(new URLSearchParams(location.search).get('n') ?? 22)
// 4-4-2 dobrado = GOL 2 · LAT 4 · ZAG 4 · MEI 8 · ATA 4 = 22 (o elenco de hoje).
// Acima disso a gente só empilha mais nomes, pra medir a ALTURA da tela.
const ORDEM: Sector[] = ['GOL', 'LAT', 'ZAG', 'MEI', 'ATA']
const BASE: Record<Sector, number> = { GOL: 2, LAT: 4, ZAG: 4, MEI: 8, ATA: 4 }
const NOMES = ['Rogério Ceni','Cafu','Aldair','Lúcio','Roberto Carlos','Falcão','Sócrates','Zico','Romário','Careca','Bebeto','Taffarel','Júnior','Mozer','Raí','Djalminha','Edmundo','Túlio','Marcelo','Kaká','Rivaldo','Ronaldinho','Adriano','Juninho','Denílson','Emerson','Vampeta','Amoroso','Alex','Élber','Petkovic']
const CLUBES = ['São Paulo','Milan','Roma','Inter','Real Madrid','Internacional','Corinthians','Flamengo','Vasco','Palmeiras','Botafogo','Santos']
const squad: WonCard[] = []
let i = 0
for (const pos of ORDEM) {
  const quantos = BASE[pos] + (N > 22 ? Math.ceil((N - 22) / 5) : 0)
  for (let k = 0; k < quantos && squad.length < N; k++, i++) {
    squad.push({ id: `c${i}`, name: NOMES[i % NOMES.length], club: CLUBES[i % CLUBES.length], year: 1990 + (i % 30),
      pos, fame: 1 + (i % 5), lo: 60 + (i % 25), hi: 78 + (i % 20), paid: 12 + i, via: 'leilao',
      // 🏢 os 4 últimos entram como EMPRESTADOS DA SAF quando n=31, que é o teto real
      ...(N >= 31 && squad.length >= 27 ? { emprestado: 'saf' } : {}) } as unknown as WonCard)
  }
}
const mgr = { id: 7, name: 'Diego', teamName: 'Nova Eclipse', isHuman: true, auctionRival: false, squad, formation: '4-4-2' } as unknown as Manager
const col = { solid: '#1B7A3D', light: '#CBEFD7' }
const xi = squad.slice(0, 11)

createRoot(document.getElementById('root')!).render(
  <EscProvider><SquadTab mgr={mgr} col={col as never} coins={168} xiIds={new Set(xi.map(c => c.id))} xi={xi}
    goals={{}} assists={{}} onSwap={() => {}} selId={null} seasonNo={6} contratosOn={false} olheiros={false} /></EscProvider>
)
