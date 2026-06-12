import { useState, useEffect } from 'react'
import { FORMATIONS, canPlayPosition } from '../data/formations'
import type { Formation } from '../data/formations'
import type { MatchResult, PickedPlayer, GameStyle, GameMode } from '../engine/game'
import type { Player } from '../data/squads'
import type { ThemePalette } from '../theme'
import { DARK } from '../theme'

interface Props {
  picks: PickedPlayer[]
  groupMatches: MatchResult[]
  formation: Formation
  style: GameStyle
  mode: GameMode
  onContinue: (newPicks: PickedPlayer[], newFormation: Formation, newStyle: GameStyle) => void
  onHome: () => void
  theme?: ThemePalette
}

const STYLE_LABELS: Record<GameStyle, string> = {
  defensive: 'DEFENSIVO', balanced: 'EQUILIBRADO', offensive: 'OFENSIVO',
}

const POS_COLOR: Record<string, string> = {
  GOL: '#1565C0', LD: '#2E7D32', ZAG: '#2E7D32', LE: '#2E7D32',
  VOL: '#6A1B9A', MC: '#6A1B9A', MD: '#6A1B9A', ME: '#6A1B9A',
  MEI: '#E65100', PD: '#B71C1C', PE: '#B71C1C', CA: '#B71C1C',
}

export default function HalftimeScreen({ picks, groupMatches, formation, style, mode, onContinue, onHome, theme }: Props) {
  const t = theme ?? DARK
  const isDark = t.mode === 'dark'
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 768)
  useEffect(() => {
    const fn = () => setIsDesktop(window.innerWidth >= 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])

  const [currentPicks, setCurrentPicks] = useState<PickedPlayer[]>(picks)
  const [currentFormation, setCurrentFormation] = useState<Formation>(formation)
  const [currentStyle, setCurrentStyle] = useState<GameStyle>(style)
  const [subsLeft, setSubsLeft] = useState(3)
  const [subOffIdx, setSubOffIdx] = useState<number | null>(null)

  const getBench = (squadId: string) => {
    const squadPick = currentPicks.find(p => p.squad.id === squadId)
    if (!squadPick) return []
    const pickedIds = currentPicks.filter(p => p.squad.id === squadId).map(p => p.player.id)
    return squadPick.squad.players.filter(pl => !pickedIds.includes(pl.id))
  }

  const handleSubOff = (pickIdx: number) => {
    if (subsLeft === 0) return
    setSubOffIdx(idx => idx === pickIdx ? null : pickIdx)
  }

  const handleSubOn = (benchPlayer: Player) => {
    if (subOffIdx === null || subsLeft === 0) return
    const outPick = currentPicks[subOffIdx]
    if (!canPlayPosition(benchPlayer.primaryPosition, benchPlayer.secondaryPositions, outPick.slot.position)) return
    setCurrentPicks(currentPicks.map((p, i) => i === subOffIdx ? { ...p, player: benchPlayer } : p))
    setSubsLeft(s => s - 1)
    setSubOffIdx(null)
  }

  const wins = groupMatches.filter(m => m.won).length
  const draws = groupMatches.filter(m => m.goalsFor === m.goalsAgainst).length
  const losses = groupMatches.filter(m => !m.won && m.goalsFor !== m.goalsAgainst).length
  const gf = groupMatches.reduce((s, m) => s + m.goalsFor, 0)
  const ga = groupMatches.reduce((s, m) => s + m.goalsAgainst, 0)
  const selectedOut = subOffIdx !== null ? currentPicks[subOffIdx] : null
  const bench = selectedOut ? getBench(selectedOut.squad.id) : []

  const winColor = isDark ? '#4CAF50' : '#2E7D32'
  const winBg = isDark ? 'rgba(76,175,80,0.08)' : 'rgba(46,125,50,0.07)'
  const winBorder = isDark ? 'rgba(76,175,80,0.22)' : 'rgba(46,125,50,0.22)'

  // ── Group results card ────────────────────────────────────────────────────
  const groupCard = (
    <div style={{ borderRadius: 20, overflow: 'hidden', background: t.surface, border: `1px solid ${t.border}` }}>
      <div style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${t.border}` }}>
        <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.18em', color: t.textMuted }}>FASE DE GRUPOS</span>
        <div style={{ display: 'flex', gap: 12 }}>
          {[
            { v: `${wins}V`, c: winColor },
            { v: `${draws}E`, c: t.gold },
            { v: `${losses}D`, c: t.red },
            { v: `${gf}–${ga}`, c: t.textDim },
          ].map(s => <span key={s.v} style={{ fontWeight: 900, fontSize: 13, color: s.c }}>{s.v}</span>)}
        </div>
      </div>
      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {groupMatches.map((m, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, borderRadius: 14, padding: '9px 14px', background: m.won ? winBg : t.redDim, border: `1px solid ${m.won ? winBorder : t.red + '44'}` }}>
            <span style={{ fontWeight: 900, fontSize: 9, padding: '2px 8px', borderRadius: 20, flexShrink: 0, background: m.won ? (isDark ? 'rgba(76,175,80,0.2)' : 'rgba(46,125,50,0.15)') : (isDark ? 'rgba(209,46,46,0.2)' : 'rgba(176,24,24,0.12)'), color: m.won ? winColor : t.red }}>
              {m.won ? 'V' : 'D'}
            </span>
            <span style={{ fontSize: 15, flexShrink: 0 }}>{m.opponentBadge ?? m.opponentFlag}</span>
            <span style={{ flex: 1, fontWeight: 700, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: t.text }}>{m.opponent}</span>
            <span style={{ fontWeight: 900, fontSize: 14, flexShrink: 0, color: t.text }}>{m.goalsFor}–{m.goalsAgainst}</span>
          </div>
        ))}
      </div>
    </div>
  )

  // ── Substitutions card ────────────────────────────────────────────────────
  const subsCard = subsLeft > 0 && (
    <div style={{ borderRadius: 20, overflow: 'hidden', background: isDark ? 'rgba(201,168,76,0.05)' : 'rgba(201,168,76,0.08)', border: `1px solid ${t.gold}33` }}>
      <div style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${t.gold}22` }}>
        <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.18em', color: t.gold, opacity: 0.8 }}>SUBSTITUIÇÕES</span>
        <div style={{ display: 'flex', gap: 5 }}>
          {[0,1,2].map(i => (
            <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: i < subsLeft ? t.gold : t.border2, boxShadow: i < subsLeft ? `0 0 6px ${t.goldGlow}` : 'none' }} />
          ))}
        </div>
      </div>
      <div style={{ padding: '12px' }}>
        <p style={{ fontSize: 10, marginBottom: 10, paddingLeft: 4, color: t.textDim }}>Toque num jogador para substituí-lo. Só troca pela mesma posição.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {currentPicks.map((pick, i) => {
            const isOut = subOffIdx === i
            const posColor = POS_COLOR[pick.slot.position] ?? '#888'
            return (
              <button key={i} onClick={() => handleSubOff(i)} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10, borderRadius: 14, padding: '10px 14px', textAlign: 'left', cursor: 'pointer',
                background: isOut ? (isDark ? 'linear-gradient(90deg, rgba(209,46,46,0.3), rgba(209,46,46,0.1))' : 'rgba(176,24,24,0.1)') : t.surface,
                border: isOut ? `1px solid ${t.red}88` : `1px solid ${t.border}`,
              }}>
                <span style={{ fontWeight: 900, fontSize: 9, padding: '2px 6px', borderRadius: 6, flexShrink: 0, background: posColor + '22', color: posColor, border: `1px solid ${posColor}44`, minWidth: 30, textAlign: 'center' }}>
                  {pick.slot.label}
                </span>
                <span style={{ fontSize: 12 }}>{pick.squad.flagEmoji}</span>
                <span style={{ flex: 1, fontWeight: 700, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: isOut ? t.text : t.text }}>{pick.player.name}</span>
                {pick.player.isLegend && <span style={{ fontSize: 9, color: t.gold }}>★</span>}
                <span style={{ fontSize: 10, fontWeight: 900, flexShrink: 0, color: t.textMuted }}>{mode === 'almanac' ? '?' : pick.player.rating}</span>
                {isOut && <span style={{ fontWeight: 900, fontSize: 14, color: t.red }}>↕</span>}
              </button>
            )
          })}
        </div>

        {selectedOut && (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${t.gold}22` }}>
            <p style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.18em', marginBottom: 8, paddingLeft: 4, color: t.gold, opacity: 0.8 }}>
              RESERVAS · {selectedOut.player.name.toUpperCase()} SAI
            </p>
            {bench.length === 0 ? (
              <p style={{ fontSize: 11, fontStyle: 'italic', padding: '4px', color: t.textDim }}>Sem reservas disponíveis.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {bench.map(pl => {
                  const compatible = canPlayPosition(pl.primaryPosition, pl.secondaryPositions, selectedOut.slot.position)
                  return (
                    <button key={pl.id} onClick={() => compatible && handleSubOn(pl)} disabled={!compatible} style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 10, borderRadius: 14, padding: '10px 14px', textAlign: 'left',
                      background: compatible ? winBg : t.surface,
                      border: compatible ? `1px solid ${winBorder}` : `1px solid ${t.border}`,
                      opacity: compatible ? 1 : 0.4,
                      cursor: compatible ? 'pointer' : 'not-allowed',
                    }}>
                      <span style={{ fontWeight: 900, fontSize: 9, padding: '2px 6px', borderRadius: 6, flexShrink: 0, background: (POS_COLOR[pl.primaryPosition] ?? '#888') + '22', color: POS_COLOR[pl.primaryPosition] ?? '#888', minWidth: 30, textAlign: 'center' }}>
                        {pl.primaryPosition}
                      </span>
                      <span style={{ flex: 1, fontWeight: 700, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: compatible ? t.text : t.textDim }}>{pl.name}</span>
                      {pl.isLegend && <span style={{ fontSize: 9, color: t.gold }}>★</span>}
                      <span style={{ fontSize: 10, fontWeight: 900, color: t.textMuted }}>{mode === 'almanac' ? '?' : pl.rating}</span>
                      {compatible && <span style={{ fontWeight: 900, fontSize: 14, color: winColor }}>↵</span>}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )

  // ── Tactics card ──────────────────────────────────────────────────────────
  const tacticsCard = (
    <div style={{ borderRadius: 20, overflow: 'hidden', background: t.surface, border: `1px solid ${t.border}` }}>
      <div style={{ padding: '12px 18px', borderBottom: `1px solid ${t.border}` }}>
        <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.18em', color: t.textMuted }}>TÁTICAS PARA AS OITAVAS</span>
      </div>
      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.15em', color: t.textMuted, marginBottom: 8 }}>FORMAÇÃO</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {Object.keys(FORMATIONS).map(f => (
              <button key={f} onClick={() => setCurrentFormation(FORMATIONS[f])} style={{
                fontWeight: 900, fontSize: 10, padding: '6px 12px', borderRadius: 12, cursor: 'pointer',
                background: currentFormation.name === f ? t.surface2 : t.surface,
                color: currentFormation.name === f ? t.text : t.textDim,
                border: currentFormation.name === f ? `1px solid ${t.border2}` : `1px solid ${t.border}`,
              }}>{f}</button>
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.15em', color: t.textMuted, marginBottom: 8 }}>ESTILO</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['defensive', 'balanced', 'offensive'] as GameStyle[]).map(s => (
              <button key={s} onClick={() => setCurrentStyle(s)} style={{
                flex: 1, fontWeight: 900, fontSize: 10, padding: '9px 4px', borderRadius: 12, cursor: 'pointer',
                background: currentStyle === s ? t.goldDim : t.surface,
                color: currentStyle === s ? t.gold : t.textDim,
                border: currentStyle === s ? `1px solid ${t.gold}55` : `1px solid ${t.border}`,
              }}>{STYLE_LABELS[s]}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  const ctaButton = (
    <button onClick={() => onContinue(currentPicks, currentFormation, currentStyle)} style={{
      width: '100%', fontWeight: 900, fontSize: 13, padding: '18px 0', borderRadius: 22, letterSpacing: '0.12em', cursor: 'pointer',
      background: `linear-gradient(135deg, ${t.red}, ${t.red}cc)`,
      color: '#fff', border: 'none',
      boxShadow: `0 8px 32px ${t.red}44`,
    }}>
      JOGAR 2° TEMPO — OITAVAS →
    </button>
  )

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: t.bgGrad }}>
      {/* Topbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', background: t.topbar, borderBottom: `1px solid ${t.topbarBorder}`, flexShrink: 0, backdropFilter: 'blur(8px)', position: 'sticky', top: 0, zIndex: 20 }}>
        <button onClick={onHome} style={{ fontWeight: 900, fontSize: 18, color: t.gold, background: 'none', border: 'none', cursor: 'pointer' }}>0a7</button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 900, fontSize: 11, letterSpacing: '0.18em', color: t.gold }}>INTERVALO</div>
          <div style={{ fontSize: 10, color: t.textMuted }}>Fase de Grupos concluída</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 900, fontSize: 13, color: subsLeft > 0 ? t.gold : t.textMuted }}>{subsLeft} sub{subsLeft !== 1 ? 's' : ''}</div>
        </div>
      </div>

      {isDesktop ? (
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, padding: '24px', maxWidth: 1100, margin: '0 auto', width: '100%', alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {groupCard}
            {tacticsCard}
            {ctaButton}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {subsCard}
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 500, margin: '0 auto', width: '100%' }}>
          {groupCard}
          {subsCard}
          {tacticsCard}
          <div style={{ paddingBottom: 24 }}>{ctaButton}</div>
        </div>
      )}
    </div>
  )
}
