import { useState, useRef, useEffect, useCallback } from 'react'
import type { Color } from 'chess.js'

// ── A pair of chess clocks. null initial = untimed game. ─────────────────
export interface ClockPair {
  w: number | null
  b: number | null
}

export function useClockPair(
  initialMs: number | null,
  incrementMs: number,
  activeColor: Color,
  running: boolean,
  onFlag: (color: Color) => void,
) {
  const [clocks, setClocks] = useState<ClockPair>({ w: initialMs, b: initialMs })
  const lastTs = useRef<number>(Date.now())
  const flagged = useRef(false)
  const onFlagRef = useRef(onFlag)
  onFlagRef.current = onFlag

  // reset when a new game starts (initialMs identity change handled by caller via resetClocks)
  const reset = useCallback((ms: number | null) => {
    setClocks({ w: ms, b: ms })
    flagged.current = false
    lastTs.current = Date.now()
  }, [])

  useEffect(() => {
    if (!running || initialMs === null) return
    lastTs.current = Date.now()
    const iv = setInterval(() => {
      const now = Date.now()
      const elapsed = now - lastTs.current
      lastTs.current = now
      setClocks(prev => {
        const cur = prev[activeColor]
        if (cur === null) return prev
        const next = Math.max(0, cur - elapsed)
        if (next === 0 && !flagged.current) {
          flagged.current = true
          // defer: don't set state of parent during render of this one
          setTimeout(() => onFlagRef.current(activeColor), 0)
        }
        return { ...prev, [activeColor]: next }
      })
    }, 100)
    return () => clearInterval(iv)
  }, [running, activeColor, initialMs])

  // after a color completes a move, give them the increment
  const applyIncrement = useCallback((color: Color) => {
    if (incrementMs <= 0) return
    setClocks(prev => prev[color] === null ? prev : { ...prev, [color]: (prev[color] as number) + incrementMs })
  }, [incrementMs])

  // authoritative set (online sync: mover reports their clock)
  const setClock = useCallback((color: Color, ms: number) => {
    setClocks(prev => ({ ...prev, [color]: ms }))
  }, [])

  return { clocks, applyIncrement, setClock, reset }
}
