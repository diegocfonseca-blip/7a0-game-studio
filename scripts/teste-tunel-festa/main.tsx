// 🧪 Bancada (23/10): o TÚNEL DA FINAL e a FESTA DO CAMPEÃO de verdade, pra foto (celular e computador). ?v=tunel|festa
import '../../src/index.css'
import { createRoot } from 'react-dom/client'
import { TunelFinal, FestaCampeao } from '../../src/escalacao/competicoes-visual'
import { NationalCrest } from '../../src/escalacao/national-crest'
const v = new URLSearchParams(location.search).get('v') ?? 'tunel'
createRoot(document.getElementById('root')!).render(v === 'festa'
  ? <FestaCampeao comp="mundo" nome="Brasil" crest={<NationalCrest country="Brasil" size={150} />} linha="final: Brasil 2×1 Argentina" onDone={() => {}} />
  : <div style={{ background: '#0b0f14', minHeight: '100vh', padding: 16 }}><div style={{ maxWidth: 760, margin: '0 auto' }}>
      <TunelFinal comp="mundo" seg={3} total={5} espera="⚽ Já vai rolar…" casa={{ nome: 'Brasil', crest: <NationalCrest country="Brasil" size={92} /> }} fora={{ nome: 'Argentina', crest: <NationalCrest country="Argentina" size={92} /> }} />
    </div></div>)
