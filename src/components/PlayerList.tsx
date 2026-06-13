import type { Squad, Player, Position } from '../data/squads'
import type { GameMode } from '../engine/game'
import type { ThemePalette } from '../theme'
import { DARK } from '../theme'

interface Props {
  squad: Squad
  mode: GameMode
  selectedPlayer: Player | null
  pickedIds: string[]
  onSelect: (p: Player) => void
  availableSlots: Position[]
  theme?: ThemePalette
  occupiedPositions?: Set<string>
}

// Sector colors — bars and badges work on both themes
// bg tints are very low opacity so they work on any background
const SECTOR = (pos: string) => {
  if (pos === 'GOL') return { bar: '#1976D2', bg: 'rgba(25,118,210,0.1)', badge: 'rgba(25,118,210,0.2)', badgeText: '#1565C0' }
  if (['LD','ZAG','LE'].includes(pos)) return { bar: '#2E7D32', bg: 'rgba(46,125,50,0.08)', badge: 'rgba(46,125,50,0.18)', badgeText: '#1B5E20' }
  if (['VOL','MC','MD','ME','MEI'].includes(pos)) return { bar: '#6A1B9A', bg: 'rgba(106,27,154,0.08)', badge: 'rgba(106,27,154,0.2)', badgeText: '#4A148C' }
  return { bar: '#C62828', bg: 'rgba(198,40,40,0.08)', badge: 'rgba(198,40,40,0.18)', badgeText: '#B71C1C' }
}

// Label colors adjust per theme
const SECTOR_LABEL = (pos: string, isDark: boolean) => {
  if (isDark) {
    if (pos === 'GOL') return '#64B5F6'
    if (['LD','ZAG','LE'].includes(pos)) return '#81C784'
    if (['VOL','MC','MD','ME','MEI'].includes(pos)) return '#CE93D8'
    return '#EF9A9A'
  } else {
    if (pos === 'GOL') return '#1565C0'
    if (['LD','ZAG','LE'].includes(pos)) return '#1B5E20'
    if (['VOL','MC','MD','ME','MEI'].includes(pos)) return '#4A148C'
    return '#B71C1C'
  }
}

const POS_ORDER = ['GOL','LD','ZAG','LE','VOL','MC','MD','ME','MEI','PD','PE','CA']

function ratingColor(r: number, isDark: boolean) {
  if (r >= 95) return '#d4a000'
  if (r >= 90) return isDark ? '#C9A84C' : '#8a6010'
  if (r >= 85) return isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.65)'
  return isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.3)'
}

export default function PlayerList({ squad, mode, selectedPlayer, pickedIds, onSelect, availableSlots, theme, occupiedPositions }: Props) {
  const t = theme ?? DARK
  const isDark = t.mode === 'dark'

  const sorted = [...squad.players].sort(
    (a, b) => POS_ORDER.indexOf(a.primaryPosition) - POS_ORDER.indexOf(b.primaryPosition)
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 420, overflowY: 'auto', overflowX: 'hidden' }}>
      {sorted.map((player) => {
        const isPicked   = pickedIds.includes(player.id)
        const isSelected = selectedPlayer?.id === player.id
        const dimmed     = !isPicked && availableSlots.length > 0
          && !availableSlots.includes(player.primaryPosition)
          && !player.secondaryPositions.some(sp => availableSlots.includes(sp))
        const isPositionFull = !isPicked && !!occupiedPositions &&
          occupiedPositions.has(player.primaryPosition) &&
          (player.secondaryPositions.length === 0 ||
           player.secondaryPositions.every(sp => occupiedPositions.has(sp)))
        const sec = SECTOR(player.primaryPosition)
        const label = SECTOR_LABEL(player.primaryPosition, isDark)

        // Badge background: more saturated/vivid; in dark mode use 0.4 opacity
        const badgeBg = isDark
          ? sec.bar + '66' // ~0.4 opacity in hex
          : sec.bar + '59' // ~0.35 opacity in hex

        return (
          <button
            key={player.id}
            onClick={() => !isPicked && !isPositionFull && onSelect(player)}
            disabled={isPicked || isPositionFull}
            style={{
              width: '100%',
              display: 'flex', alignItems: 'stretch',
              borderRadius: 12, overflow: 'hidden',
              border: isSelected
                ? `1.5px solid ${t.red}aa`
                : `1.5px solid ${t.border}`,
              background: isSelected
                ? isDark
                  ? 'linear-gradient(90deg, rgba(180,20,20,0.35) 0%, rgba(30,10,10,0.9) 100%)'
                  : 'linear-gradient(90deg, rgba(176,24,24,0.12) 0%, rgba(255,240,235,0.9) 100%)'
                : sec.bg,
              opacity: isPicked ? 0.25 : isPositionFull ? 0.3 : dimmed ? 0.35 : 1,
              cursor: isPicked || isPositionFull ? 'not-allowed' : 'pointer',
              transition: 'all 0.1s',
              minHeight: 44,
            }}
          >
            {/* Left accent bar */}
            <div style={{ width: 3, background: isSelected ? t.red : sec.bar, flexShrink: 0 }} />

            {/* Shirt number */}
            <div style={{ width: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: `${sec.bar}14` }}>
              <span style={{ fontSize: 11, fontWeight: 900, color: label }}>{player.shirtNumber}</span>
            </div>

            {/* Position badge */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '0 4px 0 6px', flexShrink: 0 }}>
              <span style={{
                fontSize: 9, fontWeight: 900, letterSpacing: '0.04em',
                padding: '3px 7px', borderRadius: 5,
                background: badgeBg, color: label,
                border: `1.5px solid ${sec.bar}66`,
                boxShadow: isSelected ? `0 0 8px ${sec.bar}55` : undefined,
              }}>
                {player.primaryPosition}
              </span>
            </div>

            {/* Name */}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, overflow: 'hidden' }}>
                <span style={{
                  fontSize: 13, fontWeight: 700,
                  color: isSelected ? (isDark ? '#fff' : t.text) : t.text,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {player.name}
                </span>
                {player.isLegend && <span style={{ color: t.gold, fontSize: 10, flexShrink: 0 }}>★</span>}
              </div>
              {player.secondaryPositions.length > 0 && (
                <div style={{ fontSize: 9, color: t.textMuted, marginTop: 1 }}>
                  {player.secondaryPositions.join(' · ')}
                </div>
              )}
            </div>

            {/* Rating */}
            <div style={{ width: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, paddingRight: 4 }}>
              <span style={{
                fontSize: mode === 'almanac' ? 16 : 15, fontWeight: 900,
                color: mode === 'almanac' ? t.textMuted : ratingColor(player.rating, isDark),
              }}>
                {mode === 'almanac' ? '?' : player.rating}
              </span>
            </div>
          </button>
        )
      })}
    </div>
  )
}
