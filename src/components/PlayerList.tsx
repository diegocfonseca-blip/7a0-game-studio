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

const POS_COLOR: Record<string, string> = {
  GOL: '#1565C0', LD: '#2E7D32', ZAG: '#2E7D32', LE: '#2E7D32',
  VOL: '#6A1B9A', MC: '#6A1B9A', MD: '#6A1B9A', ME: '#6A1B9A',
  MEI: '#E65100', PD: '#B71C1C', PE: '#B71C1C', CA: '#B71C1C',
}

function RatingBadge({ rating, hidden }: { rating: number; hidden: boolean }) {
  if (hidden) return <span className="font-black text-sm" style={{ color: 'rgba(255,255,255,0.15)', minWidth: 28, textAlign: 'right' }}>?</span>
  const color = rating >= 95 ? '#C9A84C' : rating >= 90 ? '#fff' : rating >= 85 ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.4)'
  return (
    <span className="font-black text-sm" style={{ color, minWidth: 28, textAlign: 'right' }}>
      {rating}
    </span>
  )
}

export default function PlayerList({ squad, mode, selectedPlayer, pickedIds, onSelect, availableSlots }: Props) {
  const positions = ['GOL', 'LD', 'ZAG', 'LE', 'VOL', 'MC', 'MD', 'ME', 'MEI', 'PD', 'PE', 'CA']
  const sorted = [...squad.players].sort((a, b) =>
    positions.indexOf(a.primaryPosition) - positions.indexOf(b.primaryPosition)
  )

  return (
    <div className="overflow-hidden rounded-2xl" style={{ maxHeight: 400, overflowY: 'auto', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
      {sorted.map((player, idx) => {
        const isPicked = pickedIds.includes(player.id)
        const isSelected = selectedPlayer?.id === player.id
        const isAvailable = availableSlots.length === 0 || availableSlots.includes(player.primaryPosition) ||
          player.secondaryPositions.some(sp => availableSlots.includes(sp))
        const dimmed = !isPicked && availableSlots.length > 0 && !isAvailable

        return (
          <button
            key={player.id}
            onClick={() => !isPicked && onSelect(player)}
            disabled={isPicked}
            className="w-full text-left transition-all"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '11px 14px',
              borderBottom: idx < sorted.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
              background: isSelected
                ? 'linear-gradient(90deg, rgba(209,46,46,0.25) 0%, rgba(209,46,46,0.08) 100%)'
                : isPicked
                ? 'rgba(255,255,255,0.02)'
                : 'transparent',
              borderLeft: isSelected ? '3px solid #D12E2E' : '3px solid transparent',
              opacity: isPicked ? 0.3 : dimmed ? 0.45 : 1,
              cursor: isPicked ? 'not-allowed' : 'pointer',
            }}
          >
            {/* Shirt number */}
            <span className="font-black text-[10px] w-5 text-center flex-shrink-0" style={{ color: 'rgba(255,255,255,0.25)' }}>
              {player.shirtNumber}
            </span>

            {/* Position badge */}
            <span
              className="font-black text-[9px] px-1.5 py-0.5 rounded flex-shrink-0"
              style={{
                background: (POS_COLOR[player.primaryPosition] ?? '#555') + '33',
                color: POS_COLOR[player.primaryPosition] ?? '#aaa',
                border: `1px solid ${(POS_COLOR[player.primaryPosition] ?? '#555')}55`,
                minWidth: 28,
                textAlign: 'center',
              }}
            >
              {player.primaryPosition}
            </span>

            {/* Name */}
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm truncate flex items-center gap-1.5" style={{ color: isSelected ? '#fff' : 'rgba(255,255,255,0.88)' }}>
                {player.name}
                {player.isLegend && <span className="text-[10px]" style={{ color: '#C9A84C' }}>★</span>}
              </div>
              {player.secondaryPositions.length > 0 && (
                <div className="text-[9px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
                  +{player.secondaryPositions.join(' · ')}
                </div>
              )}
            </div>

            {/* Rating */}
            <RatingBadge rating={player.rating} hidden={mode === 'almanac'} />
          </button>
        )
      })}
    </div>
  )
}
