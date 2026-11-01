// 🧪 Bancada (23/10): o TÚNEL DA FINAL e a FESTA DO CAMPEÃO de verdade, pra foto (celular e computador). ?v=tunel|festa
import '../../src/index.css'
import { createRoot } from 'react-dom/client'
import { TunelFinal, FestaCampeao, Trofeu, type CompId } from '../../src/escalacao/competicoes-visual'
import { NationalCrest } from '../../src/escalacao/national-crest'
const q = new URLSearchParams(location.search), v = q.get('v') ?? 'tunel', c = (q.get('c') ?? 'mundo') as CompId // 🇪🇺 ?c=euro (31/10)
const [A, B] = c === 'euro' ? ['Espanha', 'Inglaterra'] : ['Brasil', 'Argentina']
createRoot(document.getElementById('root')!).render(v === 'trofeu' ? <div style={{ padding: 30, background: '#061a52', display: 'inline-block' }}><Trofeu comp={c} size={160} /></div> : v === 'festa'
  ? <FestaCampeao comp={c} nome={A} crest={<NationalCrest country={A} size={150} />} linha={`final: ${A} 2×1 ${B}`} onDone={() => {}} artilheiro={{ nome: c === 'euro' ? 'Fernando Torres' : 'Ronaldo', time: A, n: 8 }} garcom={{ nome: c === 'euro' ? 'Xavi' : 'Rivaldo', time: A, n: 5 }} />
  : <div style={{ background: '#0b0f14', minHeight: '100vh', padding: 16 }}><div style={{ maxWidth: 760, margin: '0 auto' }}>
      <TunelFinal comp={c} seg={3} total={5} espera="⚽ Já vai rolar…" casa={{ nome: A, crest: <NationalCrest country={A} size={92} /> }} fora={{ nome: B, crest: <NationalCrest country={B} size={92} /> }} />
    </div></div>)
