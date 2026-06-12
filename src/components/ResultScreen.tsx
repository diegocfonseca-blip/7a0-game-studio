import { useState, useEffect } from 'react'
import type { GameState } from '../engine/game'
import type { ThemePalette } from '../theme'
import { DARK } from '../theme'

interface Props {
  state: GameState
  onReplay: () => void
  onHome: () => void
  theme?: ThemePalette
}

export default function ResultScreen({ state, onReplay, onHome, theme }: Props) {
  const t = theme ?? DARK
  const isDark = t.mode === 'dark'
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 768)
  useEffect(() => {
    const fn = () => setIsDesktop(window.innerWidth >= 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])

  const lastMatch = state.matches[state.matches.length - 1]
  const isChampion = !state.eliminated && lastMatch?.phase === 'Final' && lastMatch?.won
  const totalGoals = state.matches.reduce((s, m) => s + m.goalsFor, 0)
  const totalConceded = state.matches.reduce((s, m) => s + m.goalsAgainst, 0)
  const wins = state.matches.filter(m => m.won).length

  const scorerMap: Record<string, number> = {}
  const assistMap: Record<string, number> = {}
  for (const match of state.matches) {
    for (const ev of match.events) {
      if (ev.type === 'goal' && ev.playerName) scorerMap[ev.playerName] = (scorerMap[ev.playerName] ?? 0) + 1
      if (ev.assistName) assistMap[ev.assistName] = (assistMap[ev.assistName] ?? 0) + 1
    }
  }
  const topScorers = Object.entries(scorerMap).sort((a, b) => b[1] - a[1]).slice(0, 5)
  const topAssists = Object.entries(assistMap).sort((a, b) => b[1] - a[1]).slice(0, 3)

  const shareText = [
    `🏆 0a7LEGENDS — #${state.seed}`,
    isChampion ? '🥇 CAMPEÃO MUNDIAL!' : `❌ Eliminado: ${lastMatch?.phase}`,
    `${wins}V · ${totalGoals} gols · ${totalConceded} sofridos`,
    topScorers.length ? `⚽ ${topScorers[0][0]} (${topScorers[0][1]}g)` : '',
  ].filter(Boolean).join('\n')

  const handleShare = () => {
    if (navigator.share) navigator.share({ text: shareText })
    else { navigator.clipboard.writeText(shareText); alert('Copiado!') }
  }

  // ── Colors ────────────────────────────────────────────────────────────────
  const heroGrad = isChampion
    ? isDark
      ? 'linear-gradient(160deg, #2a1c00 0%, #1a1200 100%)'
      : 'linear-gradient(160deg, #f0e0a0 0%, #e8d48a 100%)'
    : isDark
      ? 'linear-gradient(160deg, #1a0000 0%, #0d0d0d 100%)'
      : 'linear-gradient(160deg, #f5e0e0 0%, #ede0e0 100%)'
  const heroBorder = isChampion
    ? `1px solid ${t.gold}33`
    : `1px solid ${t.red}33`
  const glowColor = isChampion
    ? `radial-gradient(circle, ${t.goldGlow} 0%, transparent 70%)`
    : `radial-gradient(circle, ${t.redDim} 0%, transparent 70%)`

  const winColor = isDark ? '#4CAF50' : '#2E7D32'
  const winBg = isDark ? 'rgba(76,175,80,0.08)' : 'rgba(46,125,50,0.07)'
  const winBorder = isDark ? 'rgba(76,175,80,0.22)' : 'rgba(46,125,50,0.22)'

  // ── Sections ──────────────────────────────────────────────────────────────
  const statsRow = (
    <div style={{ borderRadius: 20, overflow: 'hidden', background: t.surface, border: `1px solid ${t.border}` }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)' }}>
        {[
          { v: state.overall, l: 'OVERALL', c: t.gold },
          { v: wins, l: 'VITÓRIAS', c: winColor },
          { v: totalGoals, l: 'GOLS', c: t.red },
          { v: totalConceded, l: 'SOFREU', c: t.textDim },
        ].map((s, i, arr) => (
          <div key={s.l} style={{ padding: '18px 0', textAlign: 'center', borderRight: i < arr.length - 1 ? `1px solid ${t.border}` : 'none' }}>
            <div style={{ fontSize: 26, fontWeight: 900, color: s.c, lineHeight: 1 }}>{s.v}</div>
            <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: '0.1em', color: t.textMuted, marginTop: 4 }}>{s.l}</div>
          </div>
        ))}
      </div>
    </div>
  )

  const artilharia = (topScorers.length > 0 || topAssists.length > 0) && (
    <div style={{ borderRadius: 20, padding: '16px 18px', background: t.surface, border: `1px solid ${t.border}` }}>
      <p style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.18em', color: t.textMuted, marginBottom: 14 }}>ARTILHARIA DO SEU TIME</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <p style={{ fontSize: 9, fontWeight: 900, color: t.textMuted, marginBottom: 8 }}>⚽ GOLS</p>
          {topScorers.map(([name, g]) => (
            <div key={name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${t.border}` }}>
              <span style={{ fontWeight: 700, fontSize: 12, color: t.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, marginRight: 8 }}>{name.split(' ').pop()}</span>
              <span style={{ fontWeight: 900, fontSize: 14, color: t.red, flexShrink: 0 }}>{g}</span>
            </div>
          ))}
        </div>
        {topAssists.length > 0 && (
          <div>
            <p style={{ fontSize: 9, fontWeight: 900, color: t.textMuted, marginBottom: 8 }}>🎯 ASSISTS</p>
            {topAssists.map(([name, a]) => (
              <div key={name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${t.border}` }}>
                <span style={{ fontWeight: 700, fontSize: 12, color: t.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, marginRight: 8 }}>{name.split(' ').pop()}</span>
                <span style={{ fontWeight: 900, fontSize: 14, color: t.gold, flexShrink: 0 }}>{a}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  const campanha = (
    <div style={{ borderRadius: 20, overflow: 'hidden', background: t.surface, border: `1px solid ${t.border}` }}>
      <div style={{ padding: '12px 18px', borderBottom: `1px solid ${t.border}` }}>
        <p style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.18em', color: t.textMuted }}>A CAMPANHA</p>
      </div>
      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {state.matches.map((m, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 10, borderRadius: 14, padding: '10px 14px',
            background: m.won ? winBg : t.redDim,
            border: `1px solid ${m.won ? winBorder : t.red + '44'}`,
          }}>
            <div style={{ fontSize: 8, fontWeight: 900, padding: '3px 8px', borderRadius: 20, flexShrink: 0,
              background: m.won ? (isDark ? 'rgba(76,175,80,0.2)' : 'rgba(46,125,50,0.15)') : (isDark ? 'rgba(209,46,46,0.2)' : 'rgba(176,24,24,0.12)'),
              color: m.won ? winColor : t.red,
            }}>
              {m.phase.slice(0, 3).toUpperCase()}
            </div>
            <span style={{ fontSize: 15, flexShrink: 0 }}>{m.opponentBadge ?? m.opponentFlag}</span>
            <span style={{ fontWeight: 700, fontSize: 13, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: t.text }}>{m.opponent}</span>
            <span style={{ fontSize: 10, color: t.textMuted, flexShrink: 0 }}>{m.opponentYear}</span>
            <span style={{ fontWeight: 900, fontSize: 14, flexShrink: 0, color: t.text }}>
              {m.goalsFor}–{m.goalsAgainst}
              {m.penalties && <span style={{ fontSize: 9, marginLeft: 4, color: t.textMuted }}>p.{m.penalties.goalsFor}–{m.penalties.goalsAgainst}</span>}
            </span>
          </div>
        ))}
      </div>
    </div>
  )

  const meuTime = (
    <div style={{ borderRadius: 20, overflow: 'hidden', background: t.surface, border: `1px solid ${t.border}` }}>
      <div style={{ padding: '12px 18px', borderBottom: `1px solid ${t.border}` }}>
        <p style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.18em', color: t.textMuted }}>SEU TIME</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '8px 12px' }}>
        {state.picks.map((pick, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: `1px solid ${t.border}` }}>
            <span style={{ fontSize: 9, fontWeight: 900, width: 28, flexShrink: 0, color: t.textMuted }}>{pick.slot.label}</span>
            <span style={{ fontSize: 13, flexShrink: 0 }}>{pick.squad.flagEmoji}</span>
            <span style={{ fontWeight: 700, fontSize: 11, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: t.text }}>{pick.player.name.split(' ').pop()}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
              {scorerMap[pick.player.name] > 0 && <span style={{ fontSize: 9, fontWeight: 900, color: t.red }}>⚽{scorerMap[pick.player.name]}</span>}
              {assistMap[pick.player.name] > 0 && <span style={{ fontSize: 9, fontWeight: 900, color: t.gold }}>🎯{assistMap[pick.player.name]}</span>}
              {pick.player.isLegend && <span style={{ fontSize: 9, color: t.gold }}>★</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const actions = (
    <div style={{ display: 'flex', gap: 10 }}>
      <button onClick={onHome} style={{
        flex: 1, fontWeight: 900, fontSize: 12, padding: '16px 0', borderRadius: 18,
        background: t.surface2, color: t.textDim, border: `1px solid ${t.border}`, cursor: 'pointer',
        letterSpacing: '0.05em',
      }}>← INÍCIO</button>
      <button onClick={handleShare} style={{
        flex: 1, fontWeight: 900, fontSize: 12, padding: '16px 0', borderRadius: 18,
        background: t.goldDim, color: t.gold, border: `1px solid ${t.gold}44`, cursor: 'pointer',
        letterSpacing: '0.05em',
      }}>SHARE 📤</button>
      <button onClick={onReplay} style={{
        flex: 1, fontWeight: 900, fontSize: 12, padding: '16px 0', borderRadius: 18,
        background: `linear-gradient(135deg, ${t.red}, ${t.red}cc)`,
        color: '#fff', border: 'none', cursor: 'pointer',
        boxShadow: `0 4px 20px ${t.red}55`, letterSpacing: '0.05em',
      }}>NOVO 🎲</button>
    </div>
  )

  // ── Hero ──────────────────────────────────────────────────────────────────
  const hero = (
    <div style={{ position: 'relative', overflow: 'hidden', padding: '40px 24px 32px', textAlign: 'center', background: heroGrad, borderBottom: heroBorder, flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%) translateY(-50%)', width: 280, height: 280, borderRadius: '50%', background: glowColor, pointerEvents: 'none' }} />
      <div style={{ fontSize: 64, marginBottom: 12, position: 'relative', lineHeight: 1 }}>{isChampion ? '🏆' : '💀'}</div>
      <h1 style={{ fontSize: 32, fontWeight: 900, letterSpacing: '0.08em', marginBottom: 8, position: 'relative', color: isChampion ? t.gold : t.text }}>
        {isChampion ? 'CAMPEÃO MUNDIAL!' : 'ELIMINADO'}
      </h1>
      {!isChampion && lastMatch && (
        <p style={{ fontSize: 13, color: t.textDim, position: 'relative', lineHeight: 1.5 }}>
          {lastMatch.phase} · {lastMatch.opponentBadge ?? lastMatch.opponentFlag} {lastMatch.opponent} {lastMatch.opponentYear}
          {'  '}{lastMatch.goalsFor}–{lastMatch.goalsAgainst}
          {lastMatch.penalties && ` (pen. ${lastMatch.penalties.goalsFor}–${lastMatch.penalties.goalsAgainst})`}
        </p>
      )}
      {isChampion && lastMatch && (
        <p style={{ fontSize: 13, color: t.textDim, position: 'relative' }}>
          Final · {lastMatch.goalsFor}–{lastMatch.goalsAgainst} vs {lastMatch.opponent} {lastMatch.opponentYear}
        </p>
      )}
      <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.2em', marginTop: 12, color: t.textMuted, position: 'relative' }}>SEED #{state.seed}</div>
    </div>
  )

  // ── Layout ────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: t.bgGrad }}>
      {hero}

      {isDesktop ? (
        /* Desktop 2-col */
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, padding: '24px', maxWidth: 1100, margin: '0 auto', width: '100%', alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {statsRow}
            {artilharia}
            {actions}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {campanha}
            {meuTime}
          </div>
        </div>
      ) : (
        /* Mobile single col */
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 500, margin: '0 auto', width: '100%' }}>
          {statsRow}
          {artilharia}
          {campanha}
          {meuTime}
          <div style={{ paddingBottom: 24 }}>{actions}</div>
        </div>
      )}
    </div>
  )
}
