// 🧪 Bancada do 🕵️ SONDAR (22/10) — monta a `AliciarSection` DE VERDADE numa carreira recém-criada, pra tirar foto antes de
// mandar pro Diego. `?olheiro=ouro|prata|nenhum` troca o olheiro da conta; `?passo=tec|jog` abre direto numa lista.
import { createRoot } from 'react-dom/client'
import { useEffect } from 'react'
import { EscProvider, useEsc } from '../../src/escalacao/store'
import '../../src/escalacao/screens' // mesma ordem do app (o ciclo store↔pyramidseason quebra sem isto)
import { AliciarSection } from '../../src/escalacao/pyramidseason'
import { _bancadaApoio } from '../../src/escalacao/apoio'

const q = new URLSearchParams(location.search)
const OLHEIRO = q.get('olheiro') ?? 'nenhum'
if (OLHEIRO !== 'nenhum') _bancadaApoio('bancada@teste', OLHEIRO === 'prata' ? 'prata' : 'ouro')
try { localStorage.clear(); localStorage.setItem('bl_lang', 'pt') } catch { /* ignora */ }

function Tela() {
  const { state, dispatch } = useEsc()
  useEffect(() => { dispatch({ type: 'START_CAREER_SOLO', teamName: 'Nova Eclipse', formation: '4-3-3', rivals: 3 }) }, [dispatch])
  const mgr = state.managers?.[state.youIdx]
  if (!mgr || !state.careerOnline) return <p>montando carreira…</p>
  return <div style={{ padding: '16px 14px 48px' }}><AliciarSection mgr={mgr} onPular={() => alert('vender')} /></div>
}
createRoot(document.getElementById('root')!).render(<EscProvider><Tela /></EscProvider>)
