import { useState, useEffect, useRef } from 'react'
import type { GameState, MatchResult } from '../engine/game'
import { generateMatchMoments } from '../engine/commentary'
import type { MatchMoment } from '../engine/commentary'
import { playCrowdRoar, playWhistle } from '../engine/soundUtils'

interface Props { state: GameState; matches: MatchResult[]; onFinish: () => void }

const PHASE_LABELS: Record<string, string> = {
  Grupos: 'FASE DE GRUPOS', Oitavas: 'OITAVAS DE FINAL',
  Quartas: 'QUARTAS DE FINAL', Semifinal: 'SEMIFINAL', Final: 'FINAL',
}

const TYPE_COLOR: Record<string, string> = {
  goal: 'text-[#C9A84C] font-black',
  conceded: 'text-[#D12E2E] font-bold',
  save: 'text-[#888]', miss: 'text-[#888]',
  buildup: 'text-[#555]', danger: 'text-[#b06020]', tactical: 'text-[#4488bb]',
}
const TYPE_BULLET: Record<string, string> = {
  goal: '⚽', conceded: '⚽', save: '🧤', miss: '💨', buildup: '▸', danger: '⚠', tactical: '◆',
}

// Confetti particle component
function Confetti({ active }: { active: boolean }) {
  if (!active) return null
  const pieces = Array.from({ length: 28 }, (_, i) => i)
  const colors = ['#C9A84C', '#D12E2E', '#fff', '#4CAF50', '#2196F3', '#FF9800']
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {pieces.map(i => (
        <div
          key={i}
          className="absolute w-2 h-3 rounded-sm opacity-0"
          style={{
            left: `${Math.random() * 100}%`,
            top: '-10px',
            background: colors[i % colors.length],
            transform: `rotate(${Math.random() * 360}deg)`,
            animation: `confettiFall ${0.8 + Math.random() * 1.2}s ease-in ${Math.random() * 0.4}s forwards`,
          }}
        />
      ))}
    </div>
  )
}

export default function NarrationScreen({ state, matches, onFinish }: Props) {
  const [matchIdx, setMatchIdx] = useState(0)
  const [shownCount, setShownCount] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [speed, setSpeed] = useState<'normal' | 'fast'>('normal')
  const [soundOn, setSoundOn] = useState(false)
  const [goalFlash, setGoalFlash] = useState(false)
  const [confetti, setConfetti] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const match = matches[matchIdx]
  const moments: MatchMoment[] = match
    ? generateMatchMoments(state.picks, match.opponent, match.goalsFor, match.goalsAgainst, state.seed, matchIdx)
    : []

  const isFinished = shownCount >= moments.length

  useEffect(() => {
    if (!playing || isFinished) return
    const delay = speed === 'fast' ? 150 : 700
    const timer = setTimeout(() => {
      const next = moments[shownCount]
      if (next?.type === 'goal' && next?.forUs) {
        setGoalFlash(true)
        setConfetti(true)
        if (soundOn) playCrowdRoar(2.2)
        setTimeout(() => setGoalFlash(false), 1800)
        setTimeout(() => setConfetti(false), 2500)
      } else if (next?.type === 'conceded' && soundOn) {
        // subtle sound for conceded
      }
      setShownCount(c => c + 1)
    }, delay)
    return () => clearTimeout(timer)
  }, [playing, shownCount, isFinished, speed, moments, soundOn])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [shownCount])

  const handleNext = () => {
    if (matchIdx + 1 < matches.length) {
      setMatchIdx(i => i + 1)
      setShownCount(0)
      setPlaying(true)
      if (soundOn) playWhistle()
    } else {
      onFinish()
    }
  }

  const visibleMoments = moments.slice(0, shownCount)
  let scoreFor = 0, scoreAgainst = 0
  for (const m of visibleMoments) {
    if (m.type === 'goal' && m.forUs) scoreFor++
    if (m.type === 'conceded') scoreAgainst++
  }

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-500 ${goalFlash ? 'bg-[#2a1f00]' : 'bg-[#0f0f0f]'}`}>
      <Confetti active={confetti} />

      {/* CSS for confetti animation */}
      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(-10px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        @keyframes goalPulse {
          0%, 100% { text-shadow: 0 0 8px #C9A84C; }
          50%       { text-shadow: 0 0 30px #C9A84C, 0 0 60px #ff9900; }
        }
        .goal-glow { animation: goalPulse 0.4s ease-in-out 4; }
      `}</style>

      {/* Top bar */}
      <div className="bg-[#1a1a1a] px-4 py-2 flex items-center justify-between flex-shrink-0">
        <span className="text-[#C9A84C] text-[10px] font-black tracking-widest">📺 NARRAÇÃO AO VIVO</span>
        <span className="text-white/40 text-[10px]">{matchIdx + 1}/{matches.length}</span>
        <div className="flex gap-3 items-center">
          <button onClick={() => setSoundOn(s => !s)} className={`text-[10px] font-black transition-colors ${soundOn ? 'text-[#C9A84C]' : 'text-white/30'}`}>
            {soundOn ? '🔊' : '🔇'}
          </button>
          <button onClick={() => setSpeed(s => s === 'fast' ? 'normal' : 'fast')} className="text-white/50 text-[10px] hover:text-white">
            {speed === 'fast' ? '⏩ RÁPIDO' : '▶ NORMAL'}
          </button>
          {!isFinished && (
            <button onClick={() => setShownCount(moments.length)} className="text-white/50 text-[10px] hover:text-white">⏭</button>
          )}
        </div>
      </div>

      {/* Scoreboard */}
      <div className={`px-4 py-4 flex items-center justify-between sticky top-0 z-10 transition-colors duration-300 ${goalFlash ? 'bg-[#3d2900]' : 'bg-[#111]'}`}>
        <div>
          <div className="text-white/30 text-[9px] tracking-widest">{PHASE_LABELS[match?.phase ?? ''] ?? match?.phase}</div>
          <div className="text-white/50 text-[10px] font-black">SEU TIME</div>
        </div>
        <div className="flex items-center gap-4">
          <span className={`font-black text-4xl transition-all ${goalFlash ? 'text-[#C9A84C] goal-glow' : scoreFor > scoreAgainst ? 'text-[#C9A84C]' : 'text-white'}`}>
            {scoreFor}
          </span>
          <span className="text-white/20 text-2xl">–</span>
          <span className={`font-black text-4xl ${scoreAgainst > scoreFor ? 'text-[#D12E2E]' : 'text-white/60'}`}>
            {scoreAgainst}
          </span>
        </div>
        <div className="text-right">
          <div className="text-white/30 text-[9px] tracking-widest">ADVERSÁRIO</div>
          <div className="font-black text-xs text-white">{match?.opponentFlag} {match?.opponent}</div>
        </div>
      </div>

      {/* Commentary */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-2" style={{ minHeight: '280px' }}>
        {visibleMoments.map((moment, i) => {
          const isGoal = moment.type === 'goal' && moment.forUs
          return (
            <div key={i} className={`flex gap-3 items-start rounded-xl transition-all ${isGoal ? 'bg-[#C9A84C]/15 border border-[#C9A84C]/30 px-3 py-2' : moment.type === 'conceded' ? 'bg-[#D12E2E]/10 px-3 py-2 rounded-xl' : ''}`}>
              <span className="text-[10px] text-white/30 w-7 shrink-0 pt-0.5 font-mono font-bold">{moment.minute}'</span>
              <span className="text-sm shrink-0 pt-0.5">{TYPE_BULLET[moment.type]}</span>
              <div>
                {moment.lines.map((line, j) => (
                  <p key={j} className={`text-sm leading-snug ${isGoal ? 'text-[#C9A84C] font-black' : TYPE_COLOR[moment.type] ?? 'text-white/70'} ${j > 0 ? 'mt-0.5' : ''}`}>
                    {line}
                  </p>
                ))}
              </div>
            </div>
          )
        })}

        {!isFinished && playing && (
          <div className="flex gap-3 items-center px-1">
            <span className="text-[10px] text-white/20 w-7 font-mono">···</span>
            <div className="flex gap-1">
              {[0, 150, 300].map(d => (
                <span key={d} className="w-1.5 h-1.5 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom */}
      {isFinished ? (
        <div className="px-4 pb-6 pt-3 border-t border-white/10 flex-shrink-0">
          <div className={`rounded-2xl p-3 mb-3 flex items-center justify-between ${match.won ? 'bg-green-900/40 border border-green-500/30' : 'bg-red-900/40 border border-red-500/30'}`}>
            <div className="text-[9px] text-white/40 font-black tracking-widest">{PHASE_LABELS[match.phase] ?? match.phase}</div>
            <div className="flex items-center gap-2">
              <span className="font-black text-xl text-white">{match.goalsFor}</span>
              <span className="text-white/30">×</span>
              <span className="font-black text-xl text-white">{match.goalsAgainst}</span>
              <span>{match.opponentFlag}</span>
            </div>
            <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${match.won ? 'bg-green-500/30 text-green-300' : 'bg-red-500/30 text-red-300'}`}>
              {match.won ? 'VITÓRIA' : 'DERROTA'}
            </span>
          </div>
          <button
            onClick={handleNext}
            className="w-full bg-[#C9A84C] text-[#1a1a1a] font-black py-4 rounded-2xl text-sm tracking-wider hover:bg-[#b8943d] transition-colors"
          >
            {matchIdx + 1 < matches.length
              ? `PRÓXIMO → ${matches[matchIdx + 1]?.opponentFlag} ${matches[matchIdx + 1]?.opponent}`
              : '🏆 VER RESULTADO FINAL'}
          </button>
        </div>
      ) : (
        <div className="px-4 pb-4 flex-shrink-0">
          <button
            onClick={() => setPlaying(p => !p)}
            className="w-full bg-white/10 text-white/70 font-bold py-3 rounded-2xl text-sm hover:bg-white/15 transition-colors"
          >
            {playing ? '⏸ PAUSAR' : '▶ CONTINUAR'}
          </button>
        </div>
      )}
    </div>
  )
}
