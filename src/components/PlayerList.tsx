import type { Squad, Player, Position } from '../data/squads'
import type { GameMode } from '../engine/game'

interface Props {
  squad: Squad
  mode: GameMode
  selectedPlayer: Player | null
  pickedIds: string[]
  onSelect: (p: Player) => void
  availableSlots: Position[]
}

// Sector colors for position groups
const SECTOR = (pos: string) => {
  if (pos === 'GOL') return { bg: '#0d2d5e', accent: '#1976D2', label: '#64B5F6' }
  if (['LD','ZAG','LE'].includes(pos)) return { bg: '#0d3320', accent: '#388E3C', label: '#81C784' }
  if (['VOL','MC','MD','ME','MEI'].includes(pos)) return { bg: '#2d1060', accent: '#7B1FA2', label: '#CE93D8' }
  return { bg: '#3d0d0d', accent: '#C62828', label: '#EF9A9A' }
}

const POSITIONS_ORDER = ['GOL','LD','ZAG','LE','VOL','MC','MD','ME','MEI','PD','PE','CA']

function ratingColor(r: number) {
  if (r >= 95) return { text: '#FFD700', glow: 'rgba(255,215,0,0.6)' }
  if (r >= 90) return { text: '#C9A84C', glow: 'rgba(201,168,76,0.5)' }
  if (r >= 85) return { text: '#fff', glow: 'rgba(255,255,255,0.2)' }
  return { text: 'rgba(255,255,255,0.4)', glow: 'none' }
}

export default function PlayerList({ squad, mode, selectedPlayer, pickedIds, onSelect, availableSlots }: Props) {
  const sorted = [...squad.players].sort(
    (a, b) => POSITIONS_ORDER.indexOf(a.primaryPosition) - POSITIONS_ORDER.indexOf(b.primaryPosition)
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 420, overflowY: 'auto' }}>
      {sorted.map((player) => {
        const isPicked   = pickedIds.includes(player.id)
        const isSelected = selectedPlayer?.id === player.id
        const dimmed     = !isPicked && availableSlots.length > 0 &&
          !availableSlots.includes(player.primaryPosition) &&
          !player.secondaryPositions.some(sp => availableSlots.includes(sp))

        const sec   = SECTOR(player.primaryPosition)
        const rc    = ratingColor(player.rating)

        return (
          <button
            key={player.id}
            onClick={() => !isPicked && onSelect(player)}
            disabled={isPicked}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 0,
              borderRadius: 14,
              overflow: 'hidden',
              border: isSelected
                ? '1.5px solid rgba(209,46,46,0.7)'
                : '1.5px solid rgba(255,255,255,0.07)',
              background: isSelected
                ? 'linear-gradient(90deg, rgba(209,46,46,0.25) 0%, rgba(30,10,10,0.9) 100%)'
                : isPicked
                ? 'rgba(255,255,255,0.02)'
                : `linear-gradient(90deg, ${sec.bg}cc 0%, rgba(15,15,15,0.95) 100%)`,
              opacity: isPicked ? 0.3 : dimmed ? 0.4 : 1,
              cursor: isPicked ? 'not-allowed' : 'pointer',
              boxShadow: isSelected
                ? '0 0 16px rgba(209,46,46,0.3)'
                : player.isLegend && !isPicked && !dimmed
                ? '0 0 8px rgba(201,168,76,0.12)'
                : 'none',
              transition: 'all 0.12s',
            }}
          >
            {/* Left accent bar */}
            <div style={{
              width: 4,
              alignSelf: 'stretch',
              background: isSelected ? '#D12E2E' : sec.accent,
              flexShrink: 0,
            }} />

            {/* Shirt number */}
            <div style={{
              width: 32,
              height: 52,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              background: `${sec.accent}22`,
            }}>
              <span style={{ fontSize: 13, fontWeight: 900, color: sec.label }}>{player.shirtNumber}</span>
            </div>

            {/* Position chip */}
            <div style={{
              padding: '3px 6px',
              background: `${sec.accent}33`,
              border: `1px solid ${sec.accent}55`,
              borderRadius: 6,
              marginLeft: 8,
              flexShrink: 0,
            }}>
              <span style={{ fontSize: 8, fontWeight: 900, color: sec.label, letterSpacing: '0.05em' }}>
                {player.primaryPosition}
              </span>
            </div>

            {/* Name + secondary positions */}
            <div style={{ flex: 1, minWidth: 0, padding: '0 10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: isSelected ? '#fff' : 'rgba(255,255,255,0.9)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {player.name}
                </span>
                {player.isLegend && (
                  <span style={{ fontSize: 10, color: '#C9A84C', textShadow: '0 0 6px rgba(201,168,76,0.8)', flexShrink: 0 }}>★</span>
                )}
              </div>
              {player.secondaryPositions.length > 0 && (
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.28)', marginTop: 2 }}>
                  {player.secondaryPositions.join(' · ')}
                </div>
              )}
            </div>

            {/* Rating */}
            <div style={{ paddingRight: 14, flexShrink: 0, textAlign: 'right' }}>
              {mode === 'almanac' ? (
                <span style={{ fontSize: 18, fontWeight: 900, color: 'rgba(255,255,255,0.12)' }}>?</span>
              ) : (
                <span style={{
                  fontSize: 18,
                  fontWeight: 900,
                  color: rc.text,
                  textShadow: rc.glow !== 'none' ? `0 0 12px ${rc.glow}` : 'none',
                }}>
                  {player.rating}
                </span>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}
