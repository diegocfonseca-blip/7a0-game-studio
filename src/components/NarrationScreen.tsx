import { useState, useEffect, useRef, useCallback } from 'react'
import type { GameState, MatchResult } from '../engine/game'
import { generateMatchMoments } from '../engine/commentary'
import type { MatchMoment } from '../engine/commentary'
import { generateAINarration, hasApiKey } from '../engine/ai-narration'
import { playCrowdRoar, playCrowdBoo, playCrowdTension, playWhistle, startCrowdMurmur, stopCrowdMurmur } from '../engine/soundUtils'

interface Props { state: GameState; matches: MatchResult[]; onFinish: () => void; onHome?: () => void }

const PHASE_LABELS: Record<string, string> = {
  Grupos: 'FASE DE GRUPOS', Oitavas: 'OITAVAS DE FINAL',
  Quartas: 'QUARTAS DE FINAL', Semifinal: 'SEMIFINAL', Final: 'FINAL',
}

const PHASE_RATINGS: Record<string, number> = {
  Grupos: 78, Oitavas: 84, Quartas: 87, Semifinal: 90, Final: 93,
}

// Team color lookup — returns [primary, secondary] hex colors
function getTeamColors(name: string): [string, string] {
  const n = name.toLowerCase()
  if (n.includes('flamengo'))    return ['#C8102E', '#000000']
  if (n.includes('fluminense'))  return ['#6B1020', '#009933']
  if (n.includes('palmeiras'))   return ['#006437', '#FFFFFF']
  if (n.includes('corinthians')) return ['#000000', '#FFFFFF']
  if (n.includes('santos'))      return ['#000000', '#FFFFFF']
  if (n.includes('são paulo') || n.includes('sao paulo')) return ['#CC0000', '#FFFFFF']
  if (n.includes('vasco'))       return ['#000080', '#FFFFFF']
  if (n.includes('botafogo'))    return ['#000000', '#FFFFFF']
  if (n.includes('grêmio') || n.includes('gremio')) return ['#003087', '#FFFFFF']
  if (n.includes('milan') && !n.includes('inter')) return ['#C8102E', '#000000']
  if (n.includes('inter') && n.includes('milan')) return ['#003399', '#000000']
  if (n.includes('juventus'))    return ['#000000', '#FFFFFF']
  if (n.includes('barcelona'))   return ['#A50044', '#004D98']
  if (n.includes('real madrid')) return ['#FEBE10', '#FFFFFF']
  if (n.includes('atletico') && n.includes('madrid')) return ['#CC0000', '#FFFFFF']
  if (n.includes('chelsea'))     return ['#034694', '#FFFFFF']
  if (n.includes('arsenal'))     return ['#EF0107', '#FFFFFF']
  if (n.includes('liverpool'))   return ['#C8102E', '#FFFFFF']
  if (n.includes('manchester') && n.includes('united')) return ['#DA291C', '#000000']
  if (n.includes('manchester') && n.includes('city'))   return ['#6CABDD', '#FFFFFF']
  if (n.includes('tottenham'))   return ['#132257', '#FFFFFF']
  if (n.includes('bayern'))      return ['#DC052D', '#FFFFFF']
  if (n.includes('borussia') || n.includes('dortmund')) return ['#FDE100', '#000000']
  if (n.includes('ajax'))        return ['#D2122E', '#FFFFFF']
  if (n.includes('psg') || (n.includes('paris') && n.includes('saint'))) return ['#003370', '#FFFFFF']
  if (n.includes('porto'))       return ['#003087', '#FFD700']
  if (n.includes('benfica'))     return ['#C8102E', '#FFFFFF']
  if (n.includes('brasil') || n.includes('brazil')) return ['#009C3B', '#FFDF00']
  if (n.includes('argentina'))   return ['#74ACDF', '#FFFFFF']
  if (n.includes('alemanha') || n.includes('germany')) return ['#000000', '#DD0000']
  if (n.includes('itália') || n.includes('italy') || n.includes('italia')) return ['#003399', '#FFFFFF']
  if (n.includes('espanha') || n.includes('spain')) return ['#AA151B', '#F1BF00']
  if (n.includes('frança') || n.includes('france') || n.includes('franca')) return ['#002395', '#FFFFFF']
  if (n.includes('holanda') || n.includes('holland') || n.includes('netherlands')) return ['#FF6600', '#FFFFFF']
  if (n.includes('portugal'))    return ['#006600', '#CC0000']
  if (n.includes('england') || n.includes('inglaterra')) return ['#CF091D', '#FFFFFF']
  if (n.includes('croatia') || n.includes('croácia') || n.includes('croacia')) return ['#CC0000', '#FFFFFF']
  if (n.includes('bélgica') || n.includes('belgium') || n.includes('belgica')) return ['#CC0000', '#000000']
  if (n.includes('uruguai') || n.includes('uruguay')) return ['#5AAFC5', '#FFFFFF']
  // Fallback: derive from name hash
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xFFFFFF
  const hue = (h & 0xFF) / 255 * 360
  return [`hsl(${hue},60%,35%)`, '#FFFFFF']
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

export default function NarrationScreen({ state, matches, onFinish, onHome }: Props) {
  const useAI = hasApiKey()

  const [matchIdx, setMatchIdx] = useState(0)
  const [moments, setMoments] = useState<MatchMoment[]>([])
  const [aiLoading, setAiLoading] = useState(false)
  const [aiProgress, setAiProgress] = useState('')
  const [shownCount, setShownCount] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState<'slow' | 'normal' | 'fast'>('normal')
  const [soundOn, setSoundOn] = useState(true)
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
      const aiMoments = await Promise.race([
        generateAINarration(state, m, oppRating, (partial) => setAiProgress(partial)),
        new Promise<null>(res => setTimeout(() => res(null), 35000)),
      ])
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
    const delay = speed === 'fast' ? 80 : speed === 'slow' ? 2200 : useAI ? 950 : 700
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
          {onHome && (
            <button onClick={onHome} style={{ fontWeight: 700, fontSize: 15, color: 'rgba(212,168,64,0.8)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px 4px 0', fontFamily: "'Oswald', sans-serif", letterSpacing: '0.08em' }}>
              0a7
            </button>
          )}
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#E03535', boxShadow: '0 0 10px rgba(224,53,53,0.9)', animation: playing && !isFinished ? 'blink 1s infinite' : 'none' }} />
          <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.55)' }}>AO VIVO</span>
          {useAI && <span style={{ fontSize: 9, fontWeight: 900, padding: '2px 6px', borderRadius: 6, background: 'rgba(76,175,80,0.2)', border: '1px solid rgba(76,175,80,0.4)', color: '#81C784', letterSpacing: '0.1em' }}>IA</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>{matchIdx + 1}/{matches.length}</span>
          <div style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.1)' }} />
          <button onClick={() => setSpeed(s => s === 'slow' ? 'normal' : s === 'normal' ? 'fast' : 'slow')}
            style={{ fontSize: 10, fontWeight: 900, padding: '4px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: speed === 'fast' ? 'rgba(212,168,64,0.18)' : speed === 'slow' ? 'rgba(100,149,237,0.15)' : 'rgba(255,255,255,0.05)', color: speed === 'fast' ? '#D4A840' : speed === 'slow' ? '#90CAF9' : 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
            {speed === 'fast' ? '⏩ RÁPIDO' : speed === 'slow' ? '🐢 LENTO' : '▶ NORMAL'}
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
      {(() => {
        const [oppColor] = match ? getTeamColors(match.opponent) : ['#333', '#fff']
        return (
        <div style={{ flexShrink: 0 }}>
          {/* Phase chip */}
          <div style={{ textAlign: 'center', padding: '10px 0 6px', background: 'rgba(0,0,0,0.6)' }}>
            <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.22em', color: 'rgba(212,168,64,0.7)', background: 'rgba(212,168,64,0.08)', padding: '4px 14px', borderRadius: 20, border: '1px solid rgba(212,168,64,0.22)' }}>
              {PHASE_LABELS[match?.phase ?? ''] ?? match?.phase}
            </span>
          </div>

          {/* Team panels + score */}
          <div style={{ display: 'flex', alignItems: 'stretch', minHeight: 72, padding: '0 12px 10px', gap: 8, background: 'rgba(0,0,0,0.6)' }}>
            {/* SEU TIME — gold/dark pastel */}
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
              padding: '10px 14px', textAlign: 'right', borderRadius: 14,
              background: goalFlash
                ? 'linear-gradient(135deg, rgba(212,168,64,0.3) 0%, rgba(80,50,0,0.25) 100%)'
                : 'linear-gradient(135deg, rgba(212,168,64,0.15) 0%, rgba(80,50,0,0.12) 100%)',
              border: '1px solid rgba(212,168,64,0.2)',
              transition: 'background 0.5s',
            }}>
              <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.14em', color: 'rgba(212,168,64,0.6)', marginBottom: 2 }}>SEU TIME</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(212,168,64,0.45)' }}>OVR {state.overall}</div>
            </div>

            {/* Score */}
            <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 0, padding: '0 4px' }}>
              <span className={goalFlash ? 'goal-glow' : ''} style={{
                fontWeight: 900, fontSize: 54, lineHeight: 1, minWidth: 36, textAlign: 'center',
                color: isWinning ? '#D4A840' : 'rgba(255,255,255,0.9)',
                transition: 'color 0.4s', fontVariantNumeric: 'tabular-nums',
                fontFamily: "'Oswald', sans-serif",
              }}>{scoreFor}</span>
              <span style={{ fontSize: 22, fontWeight: 900, color: 'rgba(255,255,255,0.2)', lineHeight: 1, padding: '0 2px' }}>:</span>
              <span style={{
                fontWeight: 900, fontSize: 54, lineHeight: 1, minWidth: 36, textAlign: 'center',
                color: isLosing ? '#E03535' : 'rgba(255,255,255,0.3)',
                transition: 'color 0.4s', fontVariantNumeric: 'tabular-nums',
                fontFamily: "'Oswald', sans-serif",
              }}>{scoreAgainst}</span>
            </div>

            {/* ADVERSÁRIO — team color */}
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
              padding: '10px 14px', borderRadius: 14,
              background: `linear-gradient(135deg, ${oppColor}18 0%, ${oppColor}42 100%)`,
              border: `1px solid ${oppColor}44`,
            }}>
              <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.14em', color: `${oppColor}bb`, marginBottom: 2 }}>ADVERSÁRIO</div>
              <div style={{ fontWeight: 800, fontSize: 12, color: '#fff', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{match?.opponent}</div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>{match?.opponentYear}</div>
            </div>
          </div>

          {/* Result pill when finished */}
          {isFinished && (
            <div style={{ padding: '8px 16px', textAlign: 'center', background: 'rgba(0,0,0,0.5)' }}>
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
        )
      })()}

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
