import { useState, useEffect, useRef } from 'react'
import type { GameState, MatchResult } from '../engine/game'
import { generateMatchMoments } from '../engine/commentary'
import type { MatchMoment } from '../engine/commentary'
import { playCrowdRoar, playCrowdBoo, playCrowdTension, playWhistle, startCrowdMurmur, stopCrowdMurmur } from '../engine/soundUtils'

interface Props { state: GameState; matches: MatchResult[]; onFinish: () => void }

const PHASE_LABELS: Record<string, string> = {
  Grupos: 'FASE DE GRUPOS', Oitavas: 'OITAVAS DE FINAL',
  Quartas: 'QUARTAS DE FINAL', Semifinal: 'SEMIFINAL', Final: 'FINAL',
}

function Confetti({ active }: { active: boolean }) {
  if (!active) return null
  const colors = ['#C9A84C', '#D12E2E', '#fff', '#4CAF50', '#2196F3', '#FF9800']
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 50 }}>
      {Array.from({ length: 32 }, (_, i) => (
        <div key={i} style={{
          position: 'absolute',
          width: 8, height: 12,
          borderRadius: 3,
          left: `${(i * 3.125) % 100}%`,
          top: -12,
          background: colors[i % colors.length],
          transform: `rotate(${i * 47}deg)`,
          animation: `confettiFall ${0.8 + (i % 4) * 0.3}s ease-in ${(i % 5) * 0.08}s forwards`,
          opacity: 0,
        }} />
      ))}
    </div>
  )
}

const BG = 'linear-gradient(160deg, #080808 0%, #0d0d0d 55%, #100800 100%)'

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
  const oppScorerNames = match
    ? match.events.filter(e => e.type === 'conceded' && e.playerName).map(e => e.playerName!)
    : []
  const moments: MatchMoment[] = match
    ? generateMatchMoments(state.picks, match.opponent, match.goalsFor, match.goalsAgainst, state.seed, matchIdx, oppScorerNames, match.phase, match.events)
    : []
  const isFinished = shownCount >= moments.length

  // Start/stop murmur with sound toggle
  useEffect(() => {
    if (soundOn && playing && !isFinished) startCrowdMurmur()
    else stopCrowdMurmur()
    return () => stopCrowdMurmur()
  }, [soundOn, playing, isFinished])

  useEffect(() => {
    if (!playing || isFinished) return
    const delay = speed === 'fast' ? 120 : 650
    const timer = setTimeout(() => {
      const next = moments[shownCount]
      if (next?.type === 'goal' && next?.forUs) {
        setGoalFlash(true)
        setConfetti(true)
        if (soundOn) { playCrowdRoar(2.5) }
        setTimeout(() => setGoalFlash(false), 1800)
        setTimeout(() => setConfetti(false), 2500)
      } else if (next?.type === 'conceded') {
        if (soundOn) playCrowdBoo()
      } else if (next?.type === 'danger') {
        if (soundOn) playCrowdTension()
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
      if (soundOn) { stopCrowdMurmur(); playWhistle(); setTimeout(startCrowdMurmur, 600) }
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

  const isWinning = scoreFor > scoreAgainst
  const isLosing = scoreAgainst > scoreFor

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: BG }}>
      <Confetti active={confetti} />

      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(-12px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        @keyframes goalPulse {
          0%, 100% { text-shadow: 0 0 8px #C9A84C; }
          50%       { text-shadow: 0 0 40px #C9A84C, 0 0 80px #ff9900; }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .goal-glow { animation: goalPulse 0.5s ease-in-out 3; }
        .slide-in  { animation: slideIn 0.25s ease-out; }
      `}</style>

      {/* ── Top control bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: 'rgba(0,0,0,0.7)', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#D12E2E', boxShadow: '0 0 8px rgba(209,46,46,0.8)', animation: playing && !isFinished ? 'pulse 1s infinite' : 'none' }} />
          <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.6)' }}>NARRAÇÃO AO VIVO</span>
        </div>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.25)' }}>{matchIdx + 1}/{matches.length}</span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={() => setSpeed(s => s === 'fast' ? 'normal' : 'fast')}
            style={{ fontSize: 10, fontWeight: 900, padding: '5px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)', background: speed === 'fast' ? 'rgba(201,168,76,0.18)' : 'rgba(255,255,255,0.06)', color: speed === 'fast' ? '#C9A84C' : 'rgba(255,255,255,0.45)', cursor: 'pointer' }}>
            {speed === 'fast' ? '⏩ RÁPIDO' : '▶ NORMAL'}
          </button>
          {!isFinished && (
            <button onClick={() => setShownCount(moments.length)}
              style={{ fontSize: 10, fontWeight: 900, padding: '5px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>
              ⏭ PULAR
            </button>
          )}
        </div>
      </div>

      {/* ── Scoreboard ── */}
      <div style={{
        padding: '20px 16px 16px',
        background: goalFlash
          ? 'linear-gradient(180deg, rgba(201,168,76,0.2) 0%, rgba(0,0,0,0) 100%)'
          : 'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 100%)',
        transition: 'background 0.4s',
        flexShrink: 0,
      }}>
        {/* Phase label */}
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.2em', color: 'rgba(201,168,76,0.6)', background: 'rgba(201,168,76,0.08)', padding: '3px 12px', borderRadius: 20, border: '1px solid rgba(201,168,76,0.2)' }}>
            {PHASE_LABELS[match?.phase ?? ''] ?? match?.phase}
          </span>
        </div>

        {/* Score row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          {/* Our team */}
          <div style={{ flex: 1, textAlign: 'right' }}>
            <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>SEU TIME</div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>OVR {state.overall}</div>
          </div>

          {/* Score */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <span className={goalFlash ? 'goal-glow' : ''} style={{
              fontWeight: 900, fontSize: 56, lineHeight: 1,
              color: isWinning ? '#C9A84C' : isLosing ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.9)',
              minWidth: 40, textAlign: 'center',
              transition: 'color 0.3s',
            }}>{scoreFor}</span>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(255,255,255,0.15)' }} />
              <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(255,255,255,0.15)' }} />
            </div>
            <span style={{
              fontWeight: 900, fontSize: 56, lineHeight: 1,
              color: isLosing ? '#D12E2E' : 'rgba(255,255,255,0.3)',
              minWidth: 40, textAlign: 'center',
              transition: 'color 0.3s',
            }}>{scoreAgainst}</span>
          </div>

          {/* Opponent */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>ADVERSÁRIO</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 9, fontWeight: 900, color: 'rgba(255,255,255,0.6)' }}>{match?.opponentBadge ?? match?.opponentFlag}</span>
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 12, color: '#fff', lineHeight: 1.2 }}>{match?.opponent}</div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>{match?.opponentYear}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Status pill */}
        {isFinished && (
          <div style={{ marginTop: 12, textAlign: 'center' }}>
            <span style={{
              fontSize: 10, fontWeight: 900, padding: '4px 14px', borderRadius: 20,
              background: match.won ? 'rgba(76,175,80,0.25)' : 'rgba(209,46,46,0.25)',
              color: match.won ? '#81C784' : '#EF9A9A',
              border: `1px solid ${match.won ? 'rgba(76,175,80,0.4)' : 'rgba(209,46,46,0.4)'}`,
            }}>
              {match.won ? '✓ VITÓRIA' : '✕ DERROTA'} — {match.goalsFor}×{match.goalsAgainst}
              {match.penalties ? ` (PEN ${match.penalties.goalsFor}×${match.penalties.goalsAgainst})` : ''}
            </span>
          </div>
        )}
      </div>

      {/* ── Commentary feed ── */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 4, minHeight: 240 }}>
        {visibleMoments.map((moment, i) => {
          const isGoalEvent = moment.type === 'goal' && moment.forUs
          const isConceded = moment.type === 'conceded'
          const isBoring = ['buildup', 'miss', 'save'].includes(moment.type)
          return (
            <div key={i} className="slide-in" style={{
              display: 'flex', gap: 10, alignItems: 'flex-start',
              padding: isGoalEvent ? '10px 12px' : isConceded ? '8px 12px' : '5px 8px',
              borderRadius: 12,
              background: isGoalEvent
                ? 'linear-gradient(135deg, rgba(201,168,76,0.2), rgba(100,70,0,0.15))'
                : isConceded
                  ? 'rgba(209,46,46,0.12)'
                  : 'transparent',
              border: isGoalEvent
                ? '1px solid rgba(201,168,76,0.3)'
                : isConceded
                  ? '1px solid rgba(209,46,46,0.2)'
                  : 'none',
            }}>
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', width: 26, flexShrink: 0, fontFamily: 'monospace', fontWeight: 700, paddingTop: 2 }}>
                {moment.minute}'
              </span>
              <span style={{ fontSize: isGoalEvent ? 16 : 12, flexShrink: 0, paddingTop: 1 }}>
                {isGoalEvent ? '⚽' : isConceded ? '⚽' : moment.type === 'save' ? '🧤' : moment.type === 'miss' ? '💨' : moment.type === 'danger' ? '⚠' : '▸'}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                {moment.lines.map((line, j) => (
                  <p key={j} style={{
                    margin: j > 0 ? '2px 0 0' : 0,
                    fontSize: isGoalEvent ? 13 : isConceded ? 12 : isBoring ? 11 : 12,
                    fontWeight: isGoalEvent ? 900 : isConceded ? 700 : 400,
                    lineHeight: 1.4,
                    color: isGoalEvent ? '#C9A84C' : isConceded ? '#EF9A9A' : isBoring ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.6)',
                  }}>{line}</p>
                ))}
              </div>
            </div>
          )
        })}

        {!isFinished && playing && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '5px 8px' }}>
            <span style={{ fontSize: 9, color: 'transparent', width: 26 }}>--</span>
            <div style={{ display: 'flex', gap: 4 }}>
              {[0, 180, 360].map(d => (
                <div key={d} style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', animation: `pulse 1.2s ease-in-out ${d}ms infinite` }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom controls ── */}
      <div style={{ padding: '12px 16px 20px', borderTop: '1px solid rgba(255,255,255,0.07)', background: 'rgba(0,0,0,0.5)', flexShrink: 0 }}>

        {/* Sound + pause row */}
        <div style={{ display: 'flex', gap: 10, marginBottom: isFinished ? 12 : 0 }}>
          {/* Sound toggle — prominent */}
          <button onClick={() => setSoundOn(s => !s)} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '12px 16px', borderRadius: 14,
            border: soundOn ? '1px solid rgba(201,168,76,0.4)' : '1px solid rgba(255,255,255,0.1)',
            background: soundOn ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.06)',
            cursor: 'pointer', flexShrink: 0,
          }}>
            <span style={{ fontSize: 18 }}>{soundOn ? '🔊' : '🔇'}</span>
            <span style={{ fontSize: 10, fontWeight: 900, color: soundOn ? '#C9A84C' : 'rgba(255,255,255,0.35)', letterSpacing: '0.1em' }}>
              {soundOn ? 'SOM ON' : 'SOM OFF'}
            </span>
          </button>

          {/* Play/pause */}
          {!isFinished && (
            <button onClick={() => setPlaying(p => !p)} style={{
              flex: 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '12px', borderRadius: 14,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.06)',
              cursor: 'pointer', fontWeight: 900, fontSize: 12,
              color: 'rgba(255,255,255,0.6)',
            }}>
              <span style={{ fontSize: 16 }}>{playing ? '⏸' : '▶'}</span>
              {playing ? 'PAUSAR' : 'CONTINUAR'}
            </button>
          )}
        </div>

        {/* Next match button */}
        {isFinished && (
          <button onClick={handleNext} style={{
            width: '100%',
            padding: '16px', borderRadius: 16,
            border: 'none', cursor: 'pointer',
            fontWeight: 900, fontSize: 13, letterSpacing: '0.08em',
            background: 'linear-gradient(135deg, #C9A84C, #8a6020)',
            color: '#111',
            boxShadow: '0 8px 24px rgba(201,168,76,0.35)',
          }}>
            {matchIdx + 1 < matches.length
              ? `PRÓXIMO — ${matches[matchIdx + 1]?.opponentBadge ?? ''} ${matches[matchIdx + 1]?.opponent} →`
              : '🏆 VER RESULTADO FINAL'}
          </button>
        )}
      </div>
    </div>
  )
}
