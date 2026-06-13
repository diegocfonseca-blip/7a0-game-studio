import { useState, useEffect, useRef, useCallback } from 'react'
import type { GameState, MatchResult } from '../engine/game'
import { generateMatchMoments } from '../engine/commentary'
import type { MatchMoment } from '../engine/commentary'
import { generateAINarration, hasApiKey } from '../engine/ai-narration'
import { playCrowdRoar, playCrowdBoo, playCrowdTension, playWhistle, startCrowdMurmur, stopCrowdMurmur } from '../engine/soundUtils'

interface Props { state: GameState; matches: MatchResult[]; onFinish: () => void }

const PHASE_LABELS: Record<string, string> = {
  Grupos: 'FASE DE GRUPOS', Oitavas: 'OITAVAS DE FINAL',
  Quartas: 'QUARTAS DE FINAL', Semifinal: 'SEMIFINAL', Final: 'FINAL',
}

const PHASE_RATINGS: Record<string, number> = {
  Grupos: 78, Oitavas: 84, Quartas: 87, Semifinal: 90, Final: 93,
}

function Confetti({ active }: { active: boolean }) {
  if (!active) return null
  const colors = ['#D4A840', '#E03535', '#fff', '#4CAF50', '#2196F3', '#FF9800']
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 50 }}>
      {Array.from({ length: 40 }, (_, i) => (
        <div key={i} style={{
          position: 'absolute', width: 8, height: 14, borderRadius: 3,
          left: `${(i * 2.5) % 100}%`, top: -14,
          background: colors[i % colors.length],
          transform: `rotate(${i * 37}deg)`,
          animation: `confettiFall ${0.7 + (i % 5) * 0.25}s ease-in ${(i % 6) * 0.06}s forwards`,
          opacity: 0,
        }} />
      ))}
    </div>
  )
}


function AILoadingScreen({ match }: { match: MatchResult; progress: string }) {
  const [frame, setFrame] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setFrame(f => f + 1), 600)
    return () => clearInterval(t)
  }, [])
  const dots = '.'.repeat((frame % 3) + 1).padEnd(3, ' ')

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(160deg, #080810 0%, #0d0d14 55%, #100c02 100%)', padding: '32px 24px' }}>
      <style>{`
        @keyframes ld-ring { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
        @keyframes ld-pulse { 0%,100%{opacity:0.5;transform:scale(0.95)} 50%{opacity:1;transform:scale(1.05)} }
      `}</style>
      <div style={{ maxWidth: 320, width: '100%', textAlign: 'center' }}>
        {/* Stadium icon with spinner */}
        <div style={{ position: 'relative', width: 88, height: 88, margin: '0 auto 28px' }}>
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid rgba(212,168,64,0.15)' }} />
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid transparent', borderTopColor: 'rgba(212,168,64,0.7)', animation: 'ld-ring 1.2s linear infinite' }} />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, animation: 'ld-pulse 2s ease-in-out infinite' }}>⚽</div>
        </div>

        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.25em', color: 'rgba(212,168,64,0.5)', marginBottom: 12, fontFamily: "'Oswald', sans-serif" }}>
          PREPARANDO PARTIDA{dots}
        </div>
        <div style={{ fontWeight: 700, fontSize: 20, color: '#fff', marginBottom: 4, fontFamily: "'Oswald', sans-serif", letterSpacing: '0.04em' }}>
          {match.opponent}
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em' }}>
          {PHASE_LABELS[match.phase] ?? match.phase}
        </div>
      </div>
    </div>
  )
}

export default function NarrationScreen({ state, matches, onFinish }: Props) {
  const useAI = hasApiKey()

  const [matchIdx, setMatchIdx] = useState(0)
  const [moments, setMoments] = useState<MatchMoment[]>([])
  const [aiLoading, setAiLoading] = useState(false)
  const [aiProgress, setAiProgress] = useState('')
  const [shownCount, setShownCount] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState<'normal' | 'fast'>('normal')
  const [soundOn, setSoundOn] = useState(false)
  const [goalFlash, setGoalFlash] = useState(false)
  const [confetti, setConfetti] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const match = matches[matchIdx]

  // Generate moments for current match (AI or template)
  const loadMoments = useCallback(async (idx: number, aiEnabled: boolean) => {
    const m = matches[idx]
    if (!m) return
    setMoments([])
    setShownCount(0)
    setPlaying(false)
    setAiProgress('')

    if (aiEnabled) {
      setAiLoading(true)
      const oppRating = PHASE_RATINGS[m.phase] ?? 80
      const aiMoments = await generateAINarration(state, m, oppRating, (partial) => {
        setAiProgress(partial)
      })
      setAiLoading(false)
      if (aiMoments && aiMoments.length > 0) {
        setMoments(aiMoments)
        setPlaying(true)
        return
      }
    }

    // Fallback to template narration
    const oppNames = m.events.filter(e => e.type === 'conceded' && e.playerName).map(e => e.playerName!)
    const tmplMoments = generateMatchMoments(
      state.picks, m.opponent, m.goalsFor, m.goalsAgainst,
      state.seed, idx, oppNames, m.phase, m.events
    )
    setMoments(tmplMoments)
    setPlaying(true)
  }, [matches, state])

  // Initial load
  useEffect(() => {
    loadMoments(0, useAI)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const isFinished = shownCount >= moments.length && moments.length > 0

  // Sound murmur
  useEffect(() => {
    if (soundOn && playing && !isFinished) startCrowdMurmur()
    else stopCrowdMurmur()
    return () => stopCrowdMurmur()
  }, [soundOn, playing, isFinished])

  // Auto-advance moments
  useEffect(() => {
    if (!playing || isFinished || moments.length === 0) return
    const delay = speed === 'fast' ? 100 : useAI ? 900 : 650
    const timer = setTimeout(() => {
      const next = moments[shownCount]
      if (next?.type === 'goal' && next?.forUs) {
        setGoalFlash(true); setConfetti(true)
        if (soundOn) playCrowdRoar(2.5)
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
  }, [playing, shownCount, isFinished, speed, moments, soundOn, useAI])

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [shownCount])

  const handleNext = () => {
    if (matchIdx + 1 < matches.length) {
      const nextIdx = matchIdx + 1
      setMatchIdx(nextIdx)
      if (soundOn) { stopCrowdMurmur(); playWhistle(); setTimeout(startCrowdMurmur, 600) }
      loadMoments(nextIdx, useAI)
    } else {
      onFinish()
    }
  }

  // ── AI loading screen ──────────────────────────────────────────────────────
  if (aiLoading && match) {
    return <AILoadingScreen match={match} progress={aiProgress} />
  }

  // ── Derived display values ─────────────────────────────────────────────────
  const visibleMoments = moments.slice(0, shownCount)
  let scoreFor = 0, scoreAgainst = 0
  for (const m of visibleMoments) {
    if (m.type === 'goal' && m.forUs) scoreFor++
    if (m.type === 'conceded') scoreAgainst++
  }
  const isWinning = scoreFor > scoreAgainst
  const isLosing = scoreAgainst > scoreFor

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'linear-gradient(160deg, #080810 0%, #0d0d14 55%, #100c02 100%)' }}>
      <Confetti active={confetti} />

      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(-14px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(102vh) rotate(720deg); opacity: 0; }
        }
        @keyframes goalPulse {
          0%, 100% { text-shadow: 0 0 8px #D4A840; }
          50%       { text-shadow: 0 0 48px #D4A840, 0 0 90px #ff9900; }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.6;transform:scale(0.9)} }
        .goal-glow { animation: goalPulse 0.5s ease-in-out 3; }
        .slide-in  { animation: slideIn 0.3s ease-out; }
      `}</style>

      {/* ── Broadcast top bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: 'rgba(0,0,0,0.85)', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0, backdropFilter: 'blur(8px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#E03535', boxShadow: '0 0 10px rgba(224,53,53,0.9)', animation: playing && !isFinished ? 'blink 1s infinite' : 'none' }} />
          <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.55)' }}>NARRAÇÃO AO VIVO</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>{matchIdx + 1}/{matches.length}</span>
          <div style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.1)' }} />
          <button onClick={() => setSpeed(s => s === 'fast' ? 'normal' : 'fast')}
            style={{ fontSize: 10, fontWeight: 900, padding: '4px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: speed === 'fast' ? 'rgba(212,168,64,0.18)' : 'rgba(255,255,255,0.05)', color: speed === 'fast' ? '#D4A840' : 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>
            {speed === 'fast' ? '⏩ RÁPIDO' : '▶ NORMAL'}
          </button>
          {!isFinished && (
            <button onClick={() => setShownCount(moments.length)}
              style={{ fontSize: 10, fontWeight: 900, padding: '4px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.35)', cursor: 'pointer' }}>
              ⏭ PULAR
            </button>
          )}
        </div>
      </div>

      {/* ── Scoreboard ── */}
      <div style={{
        padding: '20px 20px 14px',
        background: goalFlash
          ? 'linear-gradient(180deg, rgba(212,168,64,0.22) 0%, transparent 100%)'
          : 'linear-gradient(180deg, rgba(0,0,0,0.5) 0%, transparent 100%)',
        transition: 'background 0.5s',
        flexShrink: 0,
      }}>
        {/* Phase chip */}
        <div style={{ textAlign: 'center', marginBottom: 14 }}>
          <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.22em', color: 'rgba(212,168,64,0.7)', background: 'rgba(212,168,64,0.08)', padding: '4px 14px', borderRadius: 20, border: '1px solid rgba(212,168,64,0.22)' }}>
            {PHASE_LABELS[match?.phase ?? ''] ?? match?.phase}
          </span>
        </div>

        {/* Score row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          {/* Our team */}
          <div style={{ flex: 1, textAlign: 'right' }}>
            <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.25)', marginBottom: 3 }}>SEU TIME</div>
            <div style={{ fontSize: 9, color: 'rgba(212,168,64,0.4)', fontWeight: 700 }}>⭐ OVR {state.overall}</div>
          </div>

          {/* Score display */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            <span className={goalFlash ? 'goal-glow' : ''} style={{
              fontWeight: 900, fontSize: 64, lineHeight: 1, minWidth: 44, textAlign: 'center',
              color: isWinning ? '#D4A840' : isLosing ? 'rgba(255,255,255,0.65)' : '#fff',
              transition: 'color 0.4s',
              fontVariantNumeric: 'tabular-nums',
            }}>{scoreFor}</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'center', paddingBottom: 4 }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(255,255,255,0.18)' }} />
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(255,255,255,0.18)' }} />
            </div>
            <span style={{
              fontWeight: 900, fontSize: 64, lineHeight: 1, minWidth: 44, textAlign: 'center',
              color: isLosing ? '#E03535' : 'rgba(255,255,255,0.28)',
              transition: 'color 0.4s',
              fontVariantNumeric: 'tabular-nums',
            }}>{scoreAgainst}</span>
          </div>

          {/* Opponent */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.25)', marginBottom: 4 }}>ADVERSÁRIO</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 9, fontWeight: 900, color: 'rgba(255,255,255,0.55)' }}>{match?.opponentBadge ?? match?.opponentFlag}</span>
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 11, color: '#fff', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{match?.opponent}</div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>{match?.opponentYear}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Result pill when finished */}
        {isFinished && (
          <div style={{ marginTop: 12, textAlign: 'center' }}>
            <span style={{
              fontSize: 11, fontWeight: 900, padding: '5px 16px', borderRadius: 20,
              background: match.won ? 'rgba(76,175,80,0.2)' : 'rgba(224,53,53,0.2)',
              color: match.won ? '#81C784' : '#EF9A9A',
              border: `1px solid ${match.won ? 'rgba(76,175,80,0.4)' : 'rgba(224,53,53,0.4)'}`,
              letterSpacing: '0.08em',
            }}>
              {match.won ? '✓ VITÓRIA' : '✕ DERROTA'} — {match.goalsFor}×{match.goalsAgainst}
              {match.penalties ? ` (pen. ${match.penalties.goalsFor}–${match.penalties.goalsAgainst})` : ''}
            </span>
          </div>
        )}
      </div>

      {/* ── Commentary feed ── */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '6px 14px', display: 'flex', flexDirection: 'column', gap: 3, minHeight: 200 }}>
        {visibleMoments.map((moment, i) => {
          const isGoalFor = moment.type === 'goal' && moment.forUs
          const isConceded = moment.type === 'conceded'
          const isMuted = ['buildup', 'miss', 'save', 'tactical'].includes(moment.type)

          return (
            <div key={i} className="slide-in" style={{
              display: 'flex', gap: 10, alignItems: 'flex-start',
              padding: isGoalFor ? '12px 14px' : isConceded ? '10px 12px' : '5px 8px',
              borderRadius: 14, marginBottom: isGoalFor ? 2 : 0,
              background: isGoalFor
                ? 'linear-gradient(135deg, rgba(212,168,64,0.18) 0%, rgba(80,50,0,0.12) 100%)'
                : isConceded
                  ? 'rgba(224,53,53,0.1)'
                  : 'transparent',
              border: isGoalFor
                ? '1px solid rgba(212,168,64,0.28)'
                : isConceded
                  ? '1px solid rgba(224,53,53,0.18)'
                  : 'none',
            }}>
              {/* Minute */}
              <span style={{ fontSize: 9, color: isGoalFor ? 'rgba(212,168,64,0.6)' : 'rgba(255,255,255,0.18)', width: 26, flexShrink: 0, fontFamily: 'monospace', fontWeight: 700, paddingTop: 2, letterSpacing: '0.02em' }}>
                {moment.minute}'
              </span>

              {/* Icon */}
              <span style={{ fontSize: isGoalFor ? 18 : 12, flexShrink: 0, paddingTop: 1, lineHeight: 1 }}>
                {isGoalFor ? '⚽' : isConceded ? '⚽' : moment.type === 'save' ? '🧤' : moment.type === 'miss' ? '💨' : moment.type === 'danger' ? '⚠️' : '▸'}
              </span>

              {/* Text lines */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {moment.lines.map((line, j) => (
                  <p key={j} style={{
                    margin: j > 0 ? '3px 0 0' : 0,
                    fontSize: isGoalFor ? 14 : isConceded ? 12 : isMuted ? 11 : 12,
                    fontWeight: isGoalFor ? 900 : isConceded ? 700 : 400,
                    lineHeight: 1.45,
                    color: isGoalFor
                      ? (j === 0 ? '#D4A840' : 'rgba(212,168,64,0.75)')
                      : isConceded
                        ? (j === 0 ? '#EF9A9A' : 'rgba(239,154,154,0.7)')
                        : isMuted
                          ? 'rgba(255,255,255,0.22)'
                          : 'rgba(255,255,255,0.65)',
                  }}>{line}</p>
                ))}
              </div>
            </div>
          )
        })}

        {/* Typing indicator */}
        {!isFinished && playing && moments.length > 0 && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '5px 8px' }}>
            <span style={{ fontSize: 9, color: 'transparent', width: 26, fontFamily: 'monospace' }}>--</span>
            <div style={{ display: 'flex', gap: 5 }}>
              {[0, 150, 300].map(d => (
                <div key={d} style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', animation: `pulse 1.2s ease-in-out ${d}ms infinite` }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom controls ── */}
      <div style={{ padding: '12px 16px 20px', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 10, marginBottom: isFinished ? 12 : 0 }}>
          {/* Sound */}
          <button onClick={() => setSoundOn(s => !s)} style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', borderRadius: 13,
            border: soundOn ? '1px solid rgba(212,168,64,0.4)' : '1px solid rgba(255,255,255,0.09)',
            background: soundOn ? 'rgba(212,168,64,0.14)' : 'rgba(255,255,255,0.05)', cursor: 'pointer', flexShrink: 0,
          }}>
            <span style={{ fontSize: 18 }}>{soundOn ? '🔊' : '🔇'}</span>
            <span style={{ fontSize: 10, fontWeight: 900, color: soundOn ? '#D4A840' : 'rgba(255,255,255,0.3)', letterSpacing: '0.1em' }}>
              {soundOn ? 'SOM ON' : 'SOM OFF'}
            </span>
          </button>

          {/* Play/pause */}
          {!isFinished && moments.length > 0 && (
            <button onClick={() => setPlaying(p => !p)} style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '12px', borderRadius: 13, border: '1px solid rgba(255,255,255,0.09)',
              background: 'rgba(255,255,255,0.05)', cursor: 'pointer', fontWeight: 900, fontSize: 12,
              color: 'rgba(255,255,255,0.55)',
            }}>
              <span style={{ fontSize: 16 }}>{playing ? '⏸' : '▶'}</span>
              {playing ? 'PAUSAR' : 'CONTINUAR'}
            </button>
          )}
        </div>

        {/* Next match */}
        {isFinished && (
          <button onClick={handleNext} style={{
            width: '100%', padding: '17px', borderRadius: 16, border: 'none', cursor: 'pointer',
            fontWeight: 900, fontSize: 13, letterSpacing: '0.08em',
            background: 'linear-gradient(135deg, #D4A840 0%, #8a6020 100%)',
            color: '#111', boxShadow: '0 8px 28px rgba(212,168,64,0.35)',
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
