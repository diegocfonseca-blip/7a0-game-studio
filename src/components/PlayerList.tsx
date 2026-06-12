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

export default function PlayerList({ squad, mode, selectedPlayer, pickedIds, onSelect, availableSlots }: Props) {
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm max-h-96 overflow-y-auto">
      {squad.players.map(player => {
        const isPicked = pickedIds.includes(player.id)
        const isSelected = selectedPlayer?.id === player.id
        const isAvailable = availableSlots.length === 0 || availableSlots.includes(player.primaryPosition) ||
          player.secondaryPositions.some(sp => availableSlots.includes(sp))

        return (
          <button
            key={player.id}
            onClick={() => !isPicked && onSelect(player)}
            disabled={isPicked}
            className={`w-full flex items-center gap-3 px-3 py-2.5 border-b border-gray-100 last:border-0 transition-all text-left
              ${isPicked ? 'opacity-30 cursor-not-allowed bg-gray-50' : ''}
              ${isSelected ? 'bg-[#D12E2E]/10 border-l-4 border-l-[#D12E2E]' : ''}
              ${!isPicked && !isSelected ? 'hover:bg-gray-50 cursor-pointer' : ''}
              ${!isPicked && availableSlots.length > 0 && !isAvailable ? 'opacity-50' : ''}
            `}
          >
            {/* Shirt number */}
            <span className="text-xs font-black text-[#888] w-5 text-center">{player.shirtNumber}</span>

            {/* Legend star */}
            {player.isLegend && <span className="text-[10px]">⭐</span>}

            {/* Name + position */}
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm text-[#1a1a1a] truncate">{player.name}</div>
              <div className="text-[10px] text-[#888]">
                {player.primaryPosition}
                {player.secondaryPositions.length > 0 && `/${player.secondaryPositions.join('/')}`}
              </div>
            </div>

            {/* Rating */}
            <span className={`text-sm font-black min-w-8 text-right ${player.rating >= 90 ? 'text-[#C9A84C]' : 'text-[#888]'}`}>
              {mode === 'almanac' ? '?' : player.rating}
            </span>
          </button>
        )
      })}
    </div>
  )
}
