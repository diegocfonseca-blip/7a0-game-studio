// 🧪 Bancada do 👑 Painel do Dono (07/11): o componente DE VERDADE com o banco de mentira (só pra foto).
import '../../src/index.css'
import { createRoot } from 'react-dom/client'
import { supabase } from '../../src/lib/supabase'
import { PainelDonoLiga } from '../../src/escalacao/painel-dono-liga'
try { localStorage.setItem('bl_lang', 'pt') } catch { /* ignora */ }
const falso: Record<string, unknown> = {
  esc_liga_pedidos_dono: [{ id: 'p1', user_id: 'u9', nome: 'Judas', status: 'pendente', alvo_bot: null, alvo_uid: null, pago: true }],
  esc_liga_formato_prox_ler: null,
  esc_liga_times: [{ id: 3, nome: 'Stocco FC', humano: false, uid: null, pts: 21 }, { id: 5, nome: 'Real Várzea', humano: false, uid: null, pts: 15 }, { id: 1, nome: 'Príncipe Rubro Negro', humano: true, uid: 'u2', pts: 26 }],
}
;(supabase as unknown as { rpc: unknown }).rpc = async (n: string) => ({ data: falso[n] ?? null, error: null })
const m = (id: number, teamName: string, isHuman: boolean) => ({ id, name: teamName, teamName, isHuman }) as never
createRoot(document.getElementById('root')!).render(
  <PainelDonoLiga roomId="r" roomCode="4RVDD8" roomName="Liga Draft do Futpoint" youIdx={0} donoUid="u1" tamanho={10} turnoUnico={false} presence={[0, 4]}
    managers={[m(0, 'Futpoint', true), m(1, 'Príncipe Rubro Negro', true), m(4, 'Duarte', true), m(3, 'Stocco FC', false)]} />)
