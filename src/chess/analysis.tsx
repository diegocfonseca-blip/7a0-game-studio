import { useState, useEffect, useMemo, useRef } from 'react'
import { topMoves, quickEval } from './cpu'
import type { MoveInput } from './types'
import type { BoardTheme } from './themes'

// ── Smart post-game analysis: advantage graph, critical moments,
//    best alternatives with plain-language explanations ──────────────────

interface Mistake {
  ply: number          // 0-based index of the bad move
  san: string
  loss: number         // centipawns lost by the mover
  mover: 'w' | 'b'
}

function fmtCp(cp: number): string {
  if (cp > 50_000) return '#'
  if (cp < -50_000) return '-#'
  const v = cp / 100
  return (v > 0 ? '+' : '') + v.toFixed(1)
}

export default function SmartAnalysis({ moves, sans, theme, shownPly, onJump, myColorLabel }: {
  moves: MoveInput[]
  sans: string[]
  theme: BoardTheme
  shownPly: number
  onJump: (ply: number) => void
  myColorLabel?: 'w' | 'b' | null   // highlight mistakes of this side ("você")
}) {
  const [cps, setCps] = useState<number[] | null>(null)     // eval after each ply, index 0 = start
  const [progress, setProgress] = useState(0)
  const cancelled = useRef(false)

  // compute evals in chunks so the UI stays responsive
  useEffect(() => {
    cancelled.current = false
    const out: number[] = []
    let i = 0
    function chunk() {
      if (cancelled.current) return
      const stop = Math.min(moves.length + 1, i + 3)
      for (; i < stop; i++) {
        out.push(quickEval(moves.slice(0, i), 2))
      }
      setProgress(i / (moves.length + 1))
      if (i <= moves.length) setTimeout(chunk, 10)
      else setCps([...out])
    }
    chunk()
    return () => { cancelled.current = true }
  }, [moves])

  const mistakes: Mistake[] = useMemo(() => {
    if (!cps) return []
    const out: Mistake[] = []
    for (let i = 0; i < sans.length; i++) {
      const moverSign = i % 2 === 0 ? 1 : -1
      const loss = (cps[i] - cps[i + 1]) * moverSign
      if (loss >= 180) {
        out.push({ ply: i, san: sans[i], loss, mover: i % 2 === 0 ? 'w' : 'b' })
      }
    }
    return out.sort((a, b) => b.loss - a.loss).slice(0, 6).sort((a, b) => a.ply - b.ply)
  }, [cps, sans])

  // detail for the currently viewed ply (if it's a mistake)
  const detail = useMemo(() => {
    if (!cps) return null
    const i = shownPly - 1               // the move that led to the shown position
    const mk = mistakes.find(m => m.ply === i)
    if (!mk) return null
    const before = moves.slice(0, i)
    const tops = topMoves(before, 3, 2)
    const nextSan = sans[i + 1] ?? null
    let reason = `Depois de ${mk.san}, a avaliação foi de ${fmtCp(cps[i])} para ${fmtCp(cps[i + 1])}.`
    if (tops[0] && (tops[0].san.includes('x'))) {
      reason = `Havia uma captura muito mais forte. ` + reason
    }
    if (nextSan && nextSan.includes('x')) {
      reason += ` A resposta ${nextSan} puniu na hora — tinha peça pendurada.`
    }
    return { mk, tops, reason }
  }, [cps, shownPly, mistakes, moves, sans])

  if (!cps) {
    return (
      <div className="text-xs font-bold py-2" style={{ color: theme.subtext }}>
        🧠 Analisando partida… {Math.round(progress * 100)}%
        <div className="h-1.5 rounded-full overflow-hidden mt-1.5" style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${progress * 100}%`, backgroundColor: theme.gold }} />
        </div>
      </div>
    )
  }

  // ── advantage graph (SVG) ────────────────────────────────────────────
  const W = 260, H = 64
  const clamp = (v: number) => Math.max(-500, Math.min(500, v))
  const pts = cps.map((cp, i) => {
    const x = cps.length > 1 ? (i / (cps.length - 1)) * W : 0
    const y = H / 2 - (clamp(cp) / 500) * (H / 2 - 4)
    return [x, y] as const
  })
  const line = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const area = `${line} L${W},${H / 2} L0,${H / 2} Z`
  const cursorX = cps.length > 1 ? (Math.min(shownPly, cps.length - 1) / (cps.length - 1)) * W : 0

  return (
    <div className="space-y-2.5">
      <div>
        <p className="text-[10px] font-black tracking-widest mb-1" style={{ color: theme.subtext }}>
          GRÁFICO DE VANTAGEM <span className="opacity-60">(⬆ brancas · ⬇ pretas)</span>
        </p>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-lg"
             style={{ backgroundColor: 'rgba(0,0,0,0.3)', border: `1px solid ${theme.panelBorder}` }}>
          <line x1={0} y1={H / 2} x2={W} y2={H / 2} stroke={theme.panelBorder} strokeWidth={1} />
          <path d={area} fill={theme.gold} opacity={0.18} />
          <path d={line} fill="none" stroke={theme.gold} strokeWidth={1.6} />
          <line x1={cursorX} y1={0} x2={cursorX} y2={H} stroke="#FFFFFF" strokeWidth={1} opacity={0.5} />
          {mistakes.map(m => {
            const x = cps.length > 1 ? ((m.ply + 1) / (cps.length - 1)) * W : 0
            return <circle key={m.ply} cx={x} cy={H / 2 - (clamp(cps[m.ply + 1]) / 500) * (H / 2 - 4)} r={3}
                           fill="#E8402F" stroke="#000" strokeWidth={0.5} />
          })}
        </svg>
      </div>

      {mistakes.length > 0 && (
        <div>
          <p className="text-[10px] font-black tracking-widest mb-1" style={{ color: theme.subtext }}>MOMENTOS CRÍTICOS</p>
          <div className="flex flex-wrap gap-1">
            {mistakes.map(m => {
              const isMine = myColorLabel && m.mover === myColorLabel
              return (
                <button key={m.ply} onClick={() => onJump(m.ply + 1)}
                        className="px-2 py-1 rounded-md text-[10px] font-black transition-all active:scale-95"
                        style={{
                          backgroundColor: shownPly === m.ply + 1 ? '#E8402F' : 'rgba(232,64,47,0.15)',
                          color: shownPly === m.ply + 1 ? 'white' : '#FF8A7A',
                          border: '1px solid rgba(232,64,47,0.4)',
                        }}>
                  ⚡ {Math.floor(m.ply / 2) + 1}{m.mover === 'w' ? '.' : '…'} {m.san}{isMine ? ' (você)' : ''}
                </button>
              )
            })}
          </div>
        </div>
      )}
      {mistakes.length === 0 && (
        <p className="text-xs font-bold" style={{ color: theme.gold }}>✨ Partida limpa — nenhum erro grave detectado!</p>
      )}

      {detail && (
        <div className="rounded-lg p-2.5 space-y-1.5"
             style={{ backgroundColor: 'rgba(232,64,47,0.1)', border: '1px solid rgba(232,64,47,0.35)' }}>
          <p className="text-[11px] font-black" style={{ color: '#FF8A7A' }}>
            ⚡ {detail.mk.san} perdeu {fmtCp(detail.mk.loss).replace('+', '')} de vantagem
          </p>
          <p className="text-[11px] leading-snug" style={{ color: theme.text }}>{detail.reason}</p>
          <div className="space-y-0.5">
            {detail.tops.map((t, i) => (
              <p key={i} className="text-[11px] font-bold" style={{ color: i === 0 ? theme.gold : theme.subtext }}>
                {['🥇', '🥈', '🥉'][i]} {t.san} <span className="tabular-nums">({fmtCp(detail.mk.mover === 'w' ? t.cp : -t.cp)})</span>
                {i === 0 ? ' — o melhor lance' : ''}
              </p>
            ))}
          </div>
        </div>
      )}
      {!detail && mistakes.length > 0 && (
        <p className="text-[10px]" style={{ color: theme.subtext }}>
          Toque num momento crítico ⚡ para ver os 3 melhores lances e o motivo do erro.
        </p>
      )}
    </div>
  )
}
