import { Formation, FormationSlot } from '../data/formations'
import { PickedPlayer } from '../engine/game'
import type { Player } from '../data/squads'

interface Props {
  formation: Formation
  picks: PickedPlayer[]
  selectedPlayer: Player | null
  onSlotClick: (slot: FormationSlot, index: number) => void
}

export default function Field({ formation, picks, selectedPlayer, onSlotClick }: Props) {
  return (
    <div className="relative w-full aspect-[3/4] bg-[#2d7a2d] rounded-lg overflow-hidden border-2 border-[#1a5c1a]">
      {/* Field markings */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[8%] left-[12%] right-[12%] h-[13%] border border-white/25" />
        <div className="absolute top-[8%] left-[28%] right-[28%] h-[6%] border border-white/25" />
        <div className="absolute top-1/2 left-0 right-0 border-t border-white/25" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30%] pb-[30%] rounded-full border border-white/25" />
        <div className="absolute bottom-[8%] left-[12%] right-[12%] h-[13%] border border-white/25" />
        <div className="absolute bottom-[8%] left-[28%] right-[28%] h-[6%] border border-white/25" />
      </div>

      {/* Slots */}
      {formation.slots.map((slot, i) => {
        const pick = picks.find(p => p.slotIndex === i)
        const isEmpty = !pick
        const isPickable = isEmpty && selectedPlayer !== null

        return (
          <div
            key={i}
            className={`absolute flex flex-col items-center -translate-x-1/2 -translate-y-1/2 cursor-pointer`}
            style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
            onClick={() => isPickable && onSlotClick(slot, i)}
          >
            <div className={`
              w-10 h-10 rounded-full flex items-center justify-center text-xs font-black shadow-md transition-all
              ${pick
                ? 'bg-white border-2 border-[#1a1a1a] text-[#1a1a1a]'
                : isPickable
                  ? 'bg-[#D12E2E] border-2 border-white text-white animate-pulse scale-110'
                  : 'bg-white/20 border-2 border-white/50 text-white/80'
              }
            `}>
              {pick ? (pick.player.name.split(' ').pop()?.substring(0, 3) || '?') : slot.label}
            </div>
            {pick && (
              <span className="text-[8px] text-white font-bold mt-0.5 drop-shadow text-center leading-tight max-w-12 truncate" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}>
                {pick.player.name.split(' ').slice(-1)[0]}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
