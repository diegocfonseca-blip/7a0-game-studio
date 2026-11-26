// 🧪 Bancada do troféu do Super Mundial: o troféu (vários tamanhos), a taça do perfil e a festa do campeão.
import { createRoot } from 'react-dom/client'
import '../../src/index.css'
import { Trofeu, FestaCampeao } from '../../src/escalacao/competicoes-visual'
import { TrofeuPerfil } from '../../src/escalacao/trofeus-perfil'
import { SeloClube } from '../../src/escalacao/selo-clube'
const q = new URLSearchParams(location.search)
createRoot(document.getElementById('root')!).render(q.get('v') === 'festa'
  ? <FestaCampeao comp="supermundial" nome="Fluminense" crest={<SeloClube clube="Fluminense" size={150} />} linha="final: Fluminense 2 × 1 Chelsea" souCampeao artilheiro={{ nome: 'Fred', time: 'Fluminense', n: 6 }} garcom={{ nome: 'Thiago Neves', time: 'Fluminense', n: 4 }} onDone={() => {}} />
  : <div style={{ display: 'flex', gap: 24, alignItems: 'flex-end', flexWrap: 'wrap', padding: 20 }}>
      <Trofeu comp="supermundial" size={210} /><Trofeu comp="supermundial" size={120} /><Trofeu comp="supermundial" size={64} /><Trofeu comp="supermundial" size={17} sombra={1.5} />
      <div style={{ transform: 'scale(2.5)', transformOrigin: 'bottom left', marginRight: 80 }}><TrofeuPerfil comp="supermundial" nome="Super Mundial" /></div>
      <Trofeu comp="mundial" size={120} /><Trofeu comp="champions" size={120} />
    </div>)
