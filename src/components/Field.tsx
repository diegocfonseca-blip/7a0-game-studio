import { canPlayPosition } from '../data/formations'
import type { Formation, FormationSlot } from '../data/formations'
import type { PickedPlayer } from '../engine/game'
import type { Player } from '../data/squads'

interface Props {
  formation: Formation
  picks: PickedPlayer[]
  selectedPlayer: Player | null
  onSlotClick: (slot: FormationSlot, index: number) => void
}

export default function Field({ formation, picks, selectedPlayer, onSlotClick }: Props) {
  return (
    <div
      className="relative w-full"
      style={{
        aspectRatio: '3/4',
        maxHeight: 340,
        borderRadius: 20,
        overflow: 'hidden',
        background: 'linear-gradient(180deg, #1a4a1a 0%, #1e5c1e 25%, #226022 50%, #1e5c1e 75%, #1a4a1a 100%)',
        boxShadow: 'inset 0 0 60px rgba(0,0,0,0.5), 0 8px 32px rgba(0,0,0,0.6)',
        border: '2px solid rgba(255,255,255,0.1)',
      }}
    >
      {/* Grass stripes */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'repeating-linear-gradient(180deg, transparent 0px, transparent 22px, rgba(0,0,0,0.08) 22px, rgba(0,0,0,0.08) 44px)',
      }} />

      {/* Field markings */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top penalty area */}
        <div className="absolute" style={{ top: '7%', left: '15%', right: '15%', height: '14%', border: '1.5px solid rgba(255,255,255,0.35)', borderRadius: 2 }} />
        {/* Top goal area */}
        <div className="absolute" style={{ top: '7%', left: '31%', right: '31%', height: '6%', border: '1.5px solid rgba(255,255,255,0.35)', borderRadius: 2 }} />
        {/* Top penalty spot */}
        <div className="absolute w-1.5 h-1.5 rounded-full" style={{ top: '16%', left: '50%', transform: 'translateX(-50%)', background: 'rgba(255,255,255,0.4)' }} />

        {/* Halfway line */}
        <div className="absolute" style={{ top: '50%', left: '4%', right: '4%', height: '1.5px', background: 'rgba(255,255,255,0.35)' }} />
        {/* Center circle */}
        <div className="absolute rounded-full" style={{
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '28%', paddingBottom: '28%',
          border: '1.5px solid rgba(255,255,255,0.35)',
        }} />
        {/* Center spot */}
        <div className="absolute w-1.5 h-1.5 rounded-full" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(255,255,255,0.5)' }} />

        {/* Bottom penalty area */}
        <div className="absolute" style={{ bottom: '7%', left: '15%', right: '15%', height: '14%', border: '1.5px solid rgba(255,255,255,0.35)', borderRadius: 2 }} />
        {/* Bottom goal area */}
        <div className="absolute" style={{ bottom: '7%', left: '31%', right: '31%', height: '6%', border: '1.5px solid rgba(255,255,255,0.35)', borderRadius: 2 }} />
        {/* Bottom penalty spot */}
        <div className="absolute w-1.5 h-1.5 rounded-full" style={{ bottom: '16%', left: '50%', transform: 'translateX(-50%)', background: 'rgba(255,255,255,0.4)' }} />

        {/* Corner arcs */}
        {[
          { top: '0%', left: '0%', origin: 'top left', corners: 'tl' },
          { top: '0%', right: '0%', origin: 'top right', corners: 'tr' },
          { bottom: '0%', left: '0%', origin: 'bottom left', corners: 'bl' },
          { bottom: '0%', right: '0%', origin: 'bottom right', corners: 'br' },
        ].map((c, i) => (
          <div key={i} className="absolute w-5 h-5 rounded-full" style={{
            ...c,
            border: '1.5px solid rgba(255,255,255,0.3)',
            clipPath: c.corners === 'tl' ? 'polygon(100% 0, 100% 100%, 0 100%)' :
                       c.corners === 'tr' ? 'polygon(0 0, 0 100%, 100% 100%)' :
                       c.corners === 'bl' ? 'polygon(0 0, 100% 0, 100% 100%)' :
                       'polygon(0 0, 100% 0, 0 100%)',
          }} />
        ))}
      </div>

      {/* Player slots */}
      {formation.slots.map((slot, i) => {
        const pick = picks.find(p => p.slotIndex === i)
        const isEmpty = !pick
        const isCompatible = selectedPlayer
          ? canPlayPosition(selectedPlayer.primaryPosition, selectedPlayer.secondaryPositions, slot.position)
          : false
        const isPickable = isEmpty && isCompatible

        const shortName = pick
          ? (pick.player.name.split(' ').pop()?.substring(0, 4) ?? '?')
          : slot.label

        return (
          <div
            key={i}
            className="absolute flex flex-col items-center"
            style={{
              left: `${slot.x}%`,
              top: `${slot.y}%`,
              transform: 'translate(-50%, -50%)',
              cursor: isPickable ? 'pointer' : 'default',
              zIndex: isPickable ? 10 : 5,
            }}
            onClick={() => isPickable && onSlotClick(slot, i)}
          >
            {/* Token */}
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 9,
                fontWeight: 900,
                letterSpacing: '0.02em',
                transition: 'all 0.15s',
                transform: isPickable ? 'scale(1.15)' : 'scale(1)',
                ...(pick ? {
                  background: 'linear-gradient(160deg, #fff 0%, #e0e0e0 100%)',
                  color: '#111',
                  border: '2.5px solid rgba(255,255,255,0.9)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.8)',
                } : isPickable ? {
                  background: 'linear-gradient(160deg, #D12E2E 0%, #8a1818 100%)',
                  color: '#fff',
                  border: '2px solid rgba(255,150,150,0.6)',
                  boxShadow: '0 0 16px rgba(209,46,46,0.7), 0 4px 12px rgba(0,0,0,0.5)',
                  animation: 'pulse 1.5s infinite',
                } : selectedPlayer && isEmpty ? {
                  background: 'rgba(255,255,255,0.06)',
                  color: 'rgba(255,255,255,0.3)',
                  border: '2px dashed rgba(255,255,255,0.2)',
                  boxShadow: 'none',
                } : {
                  background: 'rgba(255,255,255,0.12)',
                  color: 'rgba(255,255,255,0.7)',
                  border: '2px solid rgba(255,255,255,0.3)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                }),
              }}
            >
              {shortName}
            </div>

            {/* Name below token */}
            {pick && (
              <div
                className="mt-1 font-bold text-center leading-tight"
                style={{
                  fontSize: 8,
                  color: '#fff',
                  textShadow: '0 1px 4px rgba(0,0,0,1), 0 0 8px rgba(0,0,0,0.8)',
                  maxWidth: 44,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {pick.player.name.split(' ').pop()}
              </div>
            )}

            {/* Legend indicator */}
            {pick?.player.isLegend && (
              <div style={{ fontSize: 8, color: '#C9A84C', marginTop: 1, textShadow: '0 0 4px rgba(201,168,76,0.8)' }}>★</div>
            )}
          </div>
        )
      })}

      {/* Vignette overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.35) 100%)',
      }} />
    </div>
  )
}
