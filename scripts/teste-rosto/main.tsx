// 🔬 BANCADA de conferência (13/09) — monta telas REAIS do jogo, sem mockup.
//   (padrão)   🏛️ Salão dos Batismos — confere a abertura pra geral: nº de fundador
//              escondido, lista de donos escondida na torcida, tela em PT/EN.
//   ?agencia   🕴️ Agência — confere o rosto de lenda no quadradinho e o TIER de
//              cada carta com ela chegando SEM o campo `promessa` (é assim que ela
//              vem do álbum da nuvem, onde esse campo não existe).
//   ?en        força o inglês.
// ⚠️ ordem dos imports: store → screens → pyramidseason/salao (ciclo do COPA_LEG_MS)
// ⚠️ envolver em <EscProvider>: o UnlockBanner usa useEsc.
import { createRoot } from 'react-dom/client'
import '../../src/index.css'
import { EscProvider } from '../../src/escalacao/store'
import '../../src/escalacao/screens'
import { AgenciadosTab } from '../../src/escalacao/pyramidseason'
import Salao from '../../src/escalacao/salao'
import { CATALOG, CATALOG_EU, CATALOG_WORLD } from '../../src/escalacao/data'
import type { AgCard } from '../../src/escalacao/types'

const q = new URLSearchParams(location.search)
if (q.has('en')) { try { localStorage.setItem('bl_lang', 'en') } catch { /* ignora */ } }

type C = { name: string; club: string; year: number; fame: number; promessa?: boolean; folk?: boolean }
const TODAS: (C & { pos: string })[] = [CATALOG, CATALOG_EU, CATALOG_WORLD]
  .flatMap(cat => Object.entries(cat).flatMap(([pos, l]) => (l as C[]).map(c => ({ ...c, pos }))))
// de propósito SEM o campo `promessa`: é assim que a carta chega do álbum da nuvem
const semFlag = (n: string, cl: string, y: number): AgCard => {
  const c = TODAS.find(x => x.name === n && x.club === cl && x.year === y)!
  return { name: c.name, club: c.club, year: c.year, pos: c.pos, fame: c.fame }
}
const CARDS: AgCard[] = [
  semFlag('Dani Alves', 'Barcelona', 2011), semFlag('Dani Alves', 'Bahia', 2002),
  semFlag('Kaká', 'Milan', 2007), semFlag('Kaká', 'São Paulo', 2003),
  semFlag('Rummenigge', 'Bayern', 1981), semFlag('Allan Simonsen', 'Mönchengladbach', 1977),
  semFlag('Lothar Matthäus', 'Inter', 1990), semFlag('Kenny Dalglish', 'Liverpool', 1983),
  // 🗂️ cartas VELHAS (a gente renomeou a carta; o álbum guarda a antiga)
  { name: 'Zinedine Zidane', club: 'Real Madrid', year: 2002, pos: 'MEI', fame: 5 },
  { name: 'Zizinho', club: 'Flamengo', year: 1950, pos: 'ATA', fame: 5 },
  { name: 'Marcos', club: 'Palmeiras', year: 1999, pos: 'GOL', fame: 5 },
  { name: 'Zlatan Ibrahimović', club: 'Milan', year: 2013, pos: 'ATA', fame: 5 },
]
// estádio fake com tudo desbloqueado (StadiumSave = { inv, ext })
const estadio = { inv: { grama: 999, norte: 999, sul: 999, leste: 999, oeste: 999 }, ext: ['saf'] }

createRoot(document.getElementById('root')!).render(
  <EscProvider>
    {q.has('agencia')
      ? <div style={{ background: '#F4ECD6', minHeight: '100vh', padding: 14 }}>
          <div style={{ maxWidth: 430, margin: '0 auto' }}>
            <AgenciadosTab cards={CARDS} pool={CARDS} hist={{}} fatura={undefined}
              st={estadio} hasFilial={false} primeiroClube="Neymarzetti" onSet={() => {}} />
          </div>
        </div>
      : <Salao />}
  </EscProvider>,
)
