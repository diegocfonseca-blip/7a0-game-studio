import { useState, useEffect, useRef } from 'react'
import type { GameState, MatchResult } from '../engine/game'
import { generateMatchMoments } from '../engine/commentary'
import type { MatchMoment } from '../engine/commentary'

interface Props {
  state: GameState
  matches: MatchResult[]
  onFinish: () => void
}

const PHASE_LABELS: Record<string, string> = {
  Grupos: 'FASE DE GRUPOS',
  Oitavas: 'OITAVAS DE FINAL',
  Quartas: 'QUARTAS DE FINAL',
  Semifinal: 'SEMIFINAL',
  Final: 'FINAL',
}

const TYPE_COLOR: Record<string, string> = {
  goal: 'text-[#C9A84C] font-black',
  conceded: 'text-[#D12E2E] font-bold',
  save: 'text-[#888]',
  miss: 'text-[#888]',
  buildup: 'text-[#555]',
  danger: 'text-[#b06020]',
  tactical: 'text-[#4488bb]',
}

const TYPE_BULLET: Record<string, string> = {
  goal: '⚽',
  conceded: '⚽',
  save: '🧤',
  miss: '💨',
  buildup: '▸',
  danger: '⚠',
  tactical: '◆',
}

function ScoreBadge({ goalsFor, goalsAgainst, opponent, opponentFlag, phase, won }: {
  goalsFor: number; goalsAgainst: number; opponent: string; opponentFlag: string; phase: string; won: boolean
}) {
  return (
    <div className={`rounded-lg p-3 mb-4 flex items-center justify-between ${won ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
      <div className="text-xs font-black text-[#888] tracking-widest">{PHASE_LABELS[phase] ?? phase}</div>
      <div className="flex items-center gap-2">
        <span className="text-xl font-black text-[#1a1a1a]">{goalsFor}</span>
        <span className="text-[#888] font-bold">×</span>
        <span className="text-xl font-black text-[#1a1a1a]">{goalsAgainst}</span>
        <span className="text-lg">{opponentFlag}</span>
        <span className="text-xs font-bold text-[#555]">{opponent}</span>
      </div>
      <div className={`text-xs font-black px-2 py-0.5 rounded ${won ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
        {won ? 'VITÓRIA' : 'DERROTA'}
      </div>
    </div>
  )
}

export default function NarrationScreen({ state, matches, onFinish }: Props) {
  const [matchIdx, setMatchIdx] = useState(0)
  const [shownCount, setShownCount] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [speed, setSpeed] = useState<'normal' | 'fast'>(('normal'))
  const scrollRef = useRef<HTMLDivElement>(null)

  const match = matches[matchIdx]
  const moments: MatchMoment[] = match
    ? generateMatchMoments(
        state.picks,
        match.opponent,
        match.goalsFor,
        match.goalsAgainst,
        state.seed,
        matchIdx
      )
    : []

  const isFinished = shownCount >= moments.length

  // Auto-play: reveal one moment at a time
  useEffect(() => {
    if (!playing || isFinished) return
    const delay = speed === 'fast' ? 180 : 700
    const timer = setTimeout(() => {
      setShownCount(c => c + 1)
    }, delay)
    return () => clearTimeout(timer)
  }, [playing, shownCount, isFinished, speed])

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [shownCount])

  const handleNext = () => {
    if (matchIdx + 1 < matches.length) {
      setMatchIdx(i => i + 1)
      setShownCount(0)
      setPlaying(true)
    } else {
      onFinish()
    }
  }

  const visibleMoments = moments.slice(0, shownCount)

  // Running score
  let scoreFor = 0
  let scoreAgainst = 0
  for (const m of visibleMoments) {
    if (m.type === 'goal' && m.forUs) scoreFor++
    if (m.type === 'conceded') scoreAgainst++
  }

  return (
    <div className="min-h-screen bg-[#F5F0E8] flex flex-col">
      {/* Header */}
      <div className="bg-[#1a1a1a] text-white px-4 py-2 flex items-center justify-between text-xs font-bold tracking-widest sticky top-0 z-10">
        <span className="text-[#C9A84C]">📺 NARRAÇÃO AO VIVO</span>
        <span>{matchIdx + 1}/{matches.length} jogos</span>
        <div className="flex gap-2">
          <button
            onClick={() => setSpeed(s => s === 'fast' ? 'normal' : 'fast')}
            className="text-white/60 hover:text-white text-[10px]"
          >
            {speed === 'fast' ? '⏩ RÁPIDO' : '▶ NORMAL'}
          </button>
          {!isFinished && (
            <button onClick={() => setShownCount(moments.length)} className="text-white/60 hover:text-white text-[10px]">
              ⏭ PULAR
            </button>
          )}
        </div>
      </div>

      {/* Live scoreboard */}
      <div className="bg-[#222] text-white px-4 py-3 flex items-center justify-between sticky top-8 z-10">
        <div className="text-sm">
          <div className="text-[10px] text-white/40 tracking-widest">{PHASE_LABELS[match?.phase ?? ''] ?? match?.phase}</div>
          <div className="font-black text-xs text-white/60">SEU TIME</div>
        </div>
        <div className="flex items-center gap-3 text-3xl font-black">
          <span className={scoreFor > scoreAgainst ? 'text-[#C9A84C]' : 'text-white'}>{scoreFor}</span>
          <span className="text-white/30 text-xl">–</span>
          <span className={scoreAgainst > scoreFor ? 'text-[#D12E2E]' : 'text-white'}>{scoreAgainst}</span>
        </div>
        <div className="text-sm text-right">
          <div className="text-[10px] text-white/40 tracking-widest">ADVERSÁRIO</div>
          <div className="font-black text-xs">
            {match?.opponentFlag} {match?.opponent}
          </div>
        </div>
      </div>

      {/* Commentary feed */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-3 space-y-1.5 max-h-[60vh]"
        style={{ minHeight: '300px' }}
      >
        {visibleMoments.map((moment, i) => (
          <div
            key={i}
            className={`flex gap-3 items-start animate-fade-in ${moment.isGoal ? 'bg-white/70 rounded-lg px-3 py-2 shadow-sm' : ''}`}
          >
            <span className="text-[10px] text-[#888] w-8 shrink-0 pt-0.5 font-mono font-bold">{moment.minute}'</span>
            <span className="text-sm shrink-0 pt-0.5">{TYPE_BULLET[moment.type]}</span>
            <div>
              {moment.lines.map((line, j) => (
                <p key={j} className={`text-sm leading-snug ${TYPE_COLOR[moment.type] ?? 'text-[#333]'} ${j > 0 ? 'mt-0.5' : ''}`}>
                  {line}
                </p>
              ))}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {!isFinished && playing && (
          <div className="flex gap-3 items-center px-1">
            <span className="text-[10px] text-[#ccc] w-8 font-mono">···</span>
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-[#888] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-[#888] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-[#888] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
      </div>

      {/* Result and next button */}
      {isFinished && (
        <div className="px-4 pb-6 pt-2 border-t border-gray-200">
          <ScoreBadge
            goalsFor={match.goalsFor}
            goalsAgainst={match.goalsAgainst}
            opponent={match.opponent}
            opponentFlag={match.opponentFlag}
            phase={match.phase}
            won={match.won}
          />

          {!match.won && (
            <div className="text-center text-[#D12E2E] font-black text-sm mb-3">
              ❌ Eliminado em {PHASE_LABELS[match.phase] ?? match.phase}
            </div>
          )}

          <button
            onClick={handleNext}
            className="w-full bg-[#1a1a1a] text-white font-black py-3 rounded-xl hover:bg-[#333] transition-colors"
          >
            {matchIdx + 1 < matches.length
              ? match.won
                ? `PRÓXIMO JOGO → ${matches[matchIdx + 1]?.opponentFlag} ${matches[matchIdx + 1]?.opponent}`
                : 'VER RESULTADO FINAL →'
              : '🏆 VER RESULTADO FINAL →'}
          </button>
        </div>
      )}

      {/* Pause/Resume while playing */}
      {!isFinished && (
        <div className="px-4 pb-4">
          <button
            onClick={() => setPlaying(p => !p)}
            className="w-full bg-white border border-gray-200 text-[#555] font-bold py-2 rounded-xl hover:bg-gray-50 text-sm"
          >
            {playing ? '⏸ PAUSAR NARRAÇÃO' : '▶ CONTINUAR NARRAÇÃO'}
          </button>
        </div>
      )}
    </div>
  )
}
