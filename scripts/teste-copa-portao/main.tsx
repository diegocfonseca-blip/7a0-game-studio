// 🧪 Bancada do PORTÃO DA COPA DO MUNDO — monta o `PortaoDaCopa` DE VERDADE (o
// componente do fim da liga), sem banco: a fase, a fila e o relógio vêm da URL.
//
// Por que nasceu: em 19/09 o Diego pediu o portão no formato da Copa dos 8/
// Libertadores (*"acabou a liga, já aparece grande o banner da Copa… embaixo,
// maior, a escolha dos países"*). O `CopaDaLigaGate` lê o Supabase, que este
// ambiente não alcança — então a peça de DESENHO virou componente próprio e é
// ela que a bancada monta.
//
//   ?fase=inicio      → dono, Copa ainda não aberta
//   ?fase=bandeira    → é a MINHA vez (grade tocável + confirmar)
//   ?fase=espera      → outro está escolhendo (grade travada)
//   ?fase=banner      → os 15s entre bandeira e convocação
//   ?fase=convocacao  → convoque os 11
//   ?fase=torneio     → a Copa rolando (botão de voltar)
import { createRoot } from 'react-dom/client'
import '../../src/escalacao/screens' // ordem do app (o ciclo screens↔pyramidseason↔copa-mundo quebra sem isto)
import '../../src/escalacao/pyramidseason'
import { PortaoDaCopa, type CopaPick } from '../../src/escalacao/copa-mundo-online'
import '../../src/index.css'

const q = new URLSearchParams(location.search)
const FASE = q.get('fase') ?? 'bandeira'

const fila = [
  { uid: 'u1', nome: 'Diego', vez: 1 },
  { uid: 'u2', nome: 'Dérick', vez: 2 },
  { uid: 'u3', nome: 'Arruda', vez: 3 },
  { uid: 'u4', nome: 'Braguinha', vez: 4 },
]
const onze = Array.from({ length: 11 }, (_, i) => `k${i}`)
const pick = (pais: string, convocou = false): CopaPick => ({ pais, form: '4-3-3', xiKeys: convocou ? onze : [] })

const picks = new Map<string, CopaPick>()
if (FASE !== 'inicio') picks.set('u1', pick('Brasil', FASE === 'convocacao' || FASE === 'torneio'))
if (FASE === 'espera' || FASE === 'banner' || FASE === 'convocacao' || FASE === 'torneio') picks.set('u2', pick('Argentina', FASE === 'torneio'))
if (FASE === 'banner' || FASE === 'convocacao' || FASE === 'torneio') { picks.set('u3', pick('França', FASE === 'torneio')); picks.set('u4', pick('Alemanha', FASE === 'torneio')) }
const pegas = new Map<string, string>()
for (const f of fila) { const p = picks.get(f.uid); if (p) pegas.set(p.pais, f.nome) }

// quem sou eu em cada cena: na bandeira sou o 2º (é a minha vez); na espera sou o 3º
const meuUid = FASE === 'bandeira' ? 'u2' : FASE === 'espera' ? 'u3' : 'u1'
const minha = picks.get(meuUid) ?? null
const fase = FASE === 'inicio' ? null : FASE === 'espera' ? 'bandeira' : (FASE as 'bandeira' | 'banner' | 'convocacao' | 'torneio')
const seg = FASE === 'bandeira' ? 58 : FASE === 'espera' ? 41 : FASE === 'banner' ? 12 : FASE === 'convocacao' ? 71 : 0

createRoot(document.getElementById('root')!).render(
  <div className="max-w-xl mx-auto" style={{ padding: '14px 14px 24px', background: '#F4ECD6' }}>
    <PortaoDaCopa nLiga={20} fase={fase} lido souDono={FASE === 'inicio'} comecando={false} erro=""
      fila={fila} picks={picks} pegas={pegas} seg={seg} meuUid={meuUid} minha={minha}
      souAVez={FASE === 'bandeira'} daVezNome={FASE === 'espera' ? 'Dérick' : 'Diego'}
      temFicha={FASE === 'torneio'} aberta={false}
      aoComecar={() => {}} aoConfirmarPais={() => {}} aoConvocar={() => {}} aoVoltarCopa={() => {}} />
  </div>
)
