// 🧪 Bancada da FASE DE GRUPOS da Copa do Mundo — monta o `CupScreen` DE VERDADE
// parado numa rodada, pra olhar a tabela do grupo (faixa dos classificados, cores,
// tamanho) sem esperar o relógio.
//
// Por que nasceu: em 19/09 o Diego perguntou *"precisa de faixa de classificação
// com cor pros dois primeiros do grupo, não? Confira no offline e no online"*.
// A tabela do grupo é a MESMA nos dois (é o mesmo componente); o que muda é o
// `online` — aqui dá pra montar dos dois jeitos.
//
//   ?passo=3     → quantas rodadas já rolaram (0–5; sorteio = 6)
//   ?online=0    → modo carreira (offline). Padrão: online.
//   ?todos=1     → todos os grupos (padrão: só o meu)
import { createRoot } from 'react-dom/client'
import '../../src/escalacao/screens' // ordem do app (o ciclo screens↔pyramidseason↔copa-mundo quebra sem isto)
import '../../src/escalacao/pyramidseason'
import { CupScreen, countryPool, bestXI, type CopaSave } from '../../src/escalacao/copa-mundo'
import { montaFicha, entrantesDaFicha } from '../../src/escalacao/copa-mundo-online'
import type { CopaClockController } from '../../src/escalacao/copa-clock-preview'
import '../../src/index.css'

const q = new URLSearchParams(location.search)
const PASSO = Number(q.get('passo') ?? 3)
const ONLINE = q.get('online') !== '0'
const TODOS = q.get('todos') === '1'

const gente = ['Brasil', 'Argentina', 'França'].map((pais, i) => {
  const xi = bestXI(countryPool(pais), '4-3-3')
  return { uid: 'uid-' + i, nome: ['Diego', 'Dérick', 'Arruda'][i], pick: { pais, form: '4-3-3' as const, xiKeys: xi.map(c => `${c.name}|${c.club}|${c.year}`) } }
})
const ficha = montaFicha(gente, 424242, 1)
const entrants = entrantesDaFicha(ficha, 'uid-0')
const SAVE_VAZIO: CopaSave = { anchor: 0, mural: [], played: [], emAndamento: null }

// ⏱️ relógio FALSO parado no passo pedido (fase encerrada): o CupScreen lê o
// passo daqui e não anda sozinho — é o que deixa o print determinístico.
const agora = new Date().toISOString()
const clock: CopaClockController = {
  row: { revision: 1, step: PASSO, running: false, manual: true, speed: 1, started_at: agora, updated_at: agora, duration_ms: 14000, extra_ms: 0 },
  now: Date.now(), isHost: false, busy: false, error: '', command: async () => {},
}

createRoot(document.getElementById('root')!).render(
  <div className="max-w-xl mx-auto" style={{ padding: '14px 14px 24px', background: '#F4ECD6' }}>
    <CupScreen entrants={entrants} seasonNo={1} seed={ficha.seed} save={SAVE_VAZIO} myForm="4-3-3"
      online={ONLINE ? { seasonKey: 'bancada', clock } : undefined} onClose={() => {}} />
    {TODOS && <p style={{ fontSize: 10, color: '#0c0c0c88' }}>(todos os grupos: toque em "TODOS OS GRUPOS")</p>}
  </div>
)
