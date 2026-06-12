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

const SECTOR = (pos: string) => {
  if (pos === 'GOL') return { bar: '#1976D2', bg: 'rgba(25,118,210,0.12)', badge: 'rgba(25,118,210,0.25)', label: '#64B5F6' }
  if (['LD','ZAG','LE'].includes(pos)) return { bar: '#388E3C', bg: 'rgba(56,142,60,0.1)', badge: 'rgba(56,142,60,0.22)', label: '#81C784' }
  if (['VOL','MC','MD','ME','MEI'].includes(pos)) return { bar: '#7B1FA2', bg: 'rgba(123,31,162,0.1)', badge: 'rgba(123,31,162,0.25)', label: '#CE93D8' }
  return { bar: '#C62828', bg: 'rgba(198,40,40,0.1)', badge: 'rgba(198,40,40,0.22)', label: '#EF9A9A' }
}

const POS_ORDER = ['GOL','LD','ZAG','LE','VOL','MC','MD','ME','MEI','PD','PE','CA']

function ratingColor(r: number) {
  if (r >= 95) return '#FFD700'
  if (r >= 90) return '#C9A84C'
  if (r >= 85) return 'rgba(255,255,255,0.85)'
  return 'rgba(255,255,255,0.38)'
}

export default function PlayerList({ squad, mode, selectedPlayer, pickedIds, onSelect, availableSlots }: Props) {
  const sorted = [...squad.players].sort(
    (a, b) => POS_ORDER.indexOf(a.primaryPosition) - POS_ORDER.indexOf(b.primaryPosition)
  )

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 4,
      maxHeight: 380, overflowY: 'auto', overflowX: 'hidden',
    }}>
      {sorted.map((player) => {
        const isPicked   = pickedIds.includes(player.id)
        const isSelected = selectedPlayer?.id === player.id
        const dimmed     = !isPicked && availableSlots.length > 0
          && !availableSlots.includes(player.primaryPosition)
          && !player.secondaryPositions.some(sp => availableSlots.includes(sp))
        const sec = SECTOR(player.primaryPosition)

        return (
          <button
            key={player.id}
            onClick={() => !isPicked && onSelect(player)}
            disabled={isPicked}
            style={{
              width: '100%',
              display: 'flex', alignItems: 'stretch',
              borderRadius: 12,
              overflow: 'hidden',
              border: isSelected
                ? '1.5px solid rgba(209,46,46,0.65)'
                : '1.5px solid rgba(255,255,255,0.07)',
              background: isSelected
                ? 'linear-gradient(90deg, rgba(180,20,20,0.35) 0%, rgba(30,10,10,0.92) 100%)'
                : sec.bg,
              opacity: isPicked ? 0.28 : dimmed ? 0.38 : 1,
              cursor: isPicked ? 'not-allowed' : 'pointer',
              transition: 'all 0.1s',
              minHeight: 44,
            }}
          >
            {/* Left accent */}
            <div style={{ width: 3, background: isSelected ? '#D12E2E' : sec.bar, flexShrink: 0 }} />

            {/* Number */}
            <div style={{
              width: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, background: `${sec.bar}18`,
            }}>
              <span style={{ fontSize: 11, fontWeight: 900, color: sec.label }}>{player.shirtNumber}</span>
            </div>

            {/* Position badge */}
            <div style={{
              display: 'flex', alignItems: 'center',
              padding: '0 4px 0 6px', flexShrink: 0,
            }}>
              <span style={{
                fontSize: 8, fontWeight: 900, letterSpacing: '0.04em',
                padding: '2px 5px', borderRadius: 5,
                background: sec.badge, color: sec.label,
                border: `1px solid ${sec.bar}44`,
              }}>
                {player.primaryPosition}
              </span>
            </div>

            {/* Name */}
            <div style={{
              flex: 1, minWidth: 0,
              display: 'flex', flexDirection: 'column', justifyContent: 'center',
              padding: '0 6px',
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 4,
                overflow: 'hidden',
              }}>
                <span style={{
                  fontSize: 13, fontWeight: 700,
                  color: isSelected ? '#fff' : 'rgba(255,255,255,0.88)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {player.name}
                </span>
                {player.isLegend && (
                  <span style={{ color: '#C9A84C', fontSize: 10, flexShrink: 0 }}>★</span>
                )}
              </div>
              {player.secondaryPositions.length > 0 && (
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', marginTop: 1 }}>
                  {player.secondaryPositions.join(' · ')}
                </div>
              )}
            </div>

            {/* Rating */}
            <div style={{
              width: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, paddingRight: 4,
            }}>
              <span style={{
                fontSize: mode === 'almanac' ? 16 : 15,
                fontWeight: 900,
                color: mode === 'almanac' ? 'rgba(255,255,255,0.15)' : ratingColor(player.rating),
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
