// ⏱️ 16/11 (Diego: *"aumenta o tempo de convocação nas salas online… mais 10 segundos e deixe bem claro o tempo"*): o relógio da
// convocação das Copas da sala (Copa do Mundo e Copas regionais) no MESMO formato do Leilão de Clubes — caixa grudada no topo,
// número grande, fica vermelha nos últimos 15 s e diz o que acontece se o tempo acabar. A barra fina embaixo continua.
import { tr } from './lang'

const INK = '#0C0C0C', GOLD = '#FFC400', RED = '#E8503A'
const OSW = { fontFamily: 'Oswald, sans-serif', fontWeight: 900 } as const

/** segundos pra convocar nas salas online (era 90; +10 em 16/11) */
export const SEG_CONVOCA_SALA = 100

export function RelogioConvocacao({ seg, total }: { seg: number; total: number }) {
  const pct = Math.max(0, Math.min(100, (seg / total) * 100))
  const apertado = seg <= 15
  return (
    <div style={{ position: 'sticky', top: 6, zIndex: 5, margin: '8px 0', border: `3px solid ${INK}`, borderRadius: 12, background: apertado ? RED : GOLD, color: apertado ? '#fff' : INK, boxShadow: `3px 3px 0 0 ${INK}`, padding: '7px 10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <b style={{ ...OSW, fontSize: 30, lineHeight: 1, flex: 'none', textAlign: 'center', whiteSpace: 'nowrap' }}>⏱️ {seg}s</b>
        <p style={{ fontSize: 11.5, fontWeight: 800, margin: 0, lineHeight: 1.3 }}>
          {tr('Tempo pra convocar. Acabou o tempo? Entra com os 11 piores.', 'Time to call up. Run out of time? You get the worst 11.')}
        </p>
      </div>
      <div style={{ marginTop: 6, height: 8, border: `2px solid ${INK}`, borderRadius: 999, background: '#fff', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: apertado ? INK : GREENISH, transition: 'width .9s linear' }} />
      </div>
    </div>
  )
}
const GREENISH = '#1B7A3D'
