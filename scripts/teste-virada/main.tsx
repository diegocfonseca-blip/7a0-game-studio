// 🔬 BANCADA da virada em passos — monta as DUAS telas novas (🛍️ camisa e 🕴️ bico)
// com os componentes DE VERDADE do jogo, pra conferir o visual antes de publicar.
// Não entra no bundle do jogo: é uma página à parte, como as outras bancadas.
import { createRoot } from 'react-dom/client'
import { PrecoVirada, BicoVirada, LojaTab } from '../../src/escalacao/loja-tela'
import VADICO_ALFA from '../../src/escalacao/img/patro-vadico-alfa.webp'

const st = { inv: { geral: 55, cadeiras: 35 }, ext: ['loja', 'telao', 'estac'] }
const qual = new URLSearchParams(location.search).get('t') ?? 'camisa'

createRoot(document.getElementById('root')!).render(
  <div>
    {qual !== 'bico' && (
      <PrecoVirada passo={{ n: 4, de: 5 }} time="Final Boss FC" div="C" st={st} seasonNo={7}
        loja={{ preco: 'cara', forn: { fornId: 'pumba', anos: 3, div: 'C', desde: 6, porTemporada: 14 } }}
        masterNome="Vadico Veículos" masterLogo={VADICO_ALFA}
        onPreco={p => console.log('preco', p)} />
    )}
    {qual === 'aba' && (
      <LojaTab time="Futpoint FC" st={st} div="B" seasonNo={7} minhaCor="#1B7A3D"
        loja={{ preco: 'popular', forn: { fornId: 'naique', anos: 5, div: 'B', desde: 5, porTemporada: 27 },
          balanco: { season: 6, camisas: 20548, moedas: 91, pos: 3, preco: 'popular', torcida: 90838 } }}
        masterNome="Vadico Veículos" masterLogo={VADICO_ALFA} onIrEstrutura={() => {}} />
    )}
    {qual === 'bico' && (
      <BicoVirada passo={{ n: 5, de: 5 }} div="C" seasonNo={7}
        onPick={b => console.log('bico', b)} />
    )}
  </div>
)
