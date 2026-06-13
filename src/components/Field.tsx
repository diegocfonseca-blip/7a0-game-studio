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
    <>
      <style>{`
        @keyframes slot-pulse {
          0%, 100% { transform: translate(-50%,-50%) scale(1.05); opacity: 1; }
          50%       { transform: translate(-50%,-50%) scale(1.18); opacity: 0.85; }
        }
        @keyframes slot-idle {
          0%, 100% { opacity: 0.5; }
          50%       { opacity: 0.25; }
        }
      `}</style>

      <div
        className="relative w-full"
        style={{
          aspectRatio: '3/4',
          borderRadius: 12,
          overflow: 'hidden',
          /* Alternating horizontal grass stripes matching the reference */
          background: `repeating-linear-gradient(
            180deg,
            #3a7d3a 0px, #3a7d3a 28px,
            #357535 28px, #357535 56px
          )`,
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          border: '2px solid rgba(255,255,255,0.08)',
        }}
      >
        {/* Field markings */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Outer pitch border */}
          <div style={{ position: 'absolute', top: '3%', left: '5%', right: '5%', bottom: '3%', border: '1.5px solid rgba(255,255,255,0.5)', borderRadius: 1 }} />

          {/* Top penalty box */}
          <div style={{ position: 'absolute', top: '3%', left: '20%', right: '20%', height: '14%', border: '1.5px solid rgba(255,255,255,0.5)', borderTop: 'none' }} />
          {/* Top goal box */}
          <div style={{ position: 'absolute', top: '3%', left: '33%', right: '33%', height: '6.5%', border: '1.5px solid rgba(255,255,255,0.45)', borderTop: 'none' }} />
          {/* Top penalty spot */}
          <div style={{ position: 'absolute', top: '15.5%', left: '50%', transform: 'translateX(-50%)', width: 5, height: 5, borderRadius: '50%', background: 'rgba(255,255,255,0.55)' }} />

          {/* Halfway line */}
          <div style={{ position: 'absolute', top: '50%', left: '5%', right: '5%', height: '1.5px', background: 'rgba(255,255,255,0.5)', transform: 'translateY(-50%)' }} />
          {/* Center circle */}
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '28%', paddingBottom: '28%', border: '1.5px solid rgba(255,255,255,0.48)', borderRadius: '50%' }} />
          {/* Center spot */}
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 5, height: 5, borderRadius: '50%', background: 'rgba(255,255,255,0.6)' }} />

          {/* Bottom penalty box */}
          <div style={{ position: 'absolute', bottom: '3%', left: '20%', right: '20%', height: '14%', border: '1.5px solid rgba(255,255,255,0.5)', borderBottom: 'none' }} />
          {/* Bottom goal box */}
          <div style={{ position: 'absolute', bottom: '3%', left: '33%', right: '33%', height: '6.5%', border: '1.5px solid rgba(255,255,255,0.45)', borderBottom: 'none' }} />
          {/* Bottom penalty spot */}
          <div style={{ position: 'absolute', bottom: '15.5%', left: '50%', transform: 'translateX(-50%)', width: 5, height: 5, borderRadius: '50%', background: 'rgba(255,255,255,0.55)' }} />

          {/* Bottom arc */}
          <div style={{ position: 'absolute', bottom: '17%', left: '50%', transform: 'translateX(-50%)', width: '24%', paddingBottom: '12%', border: '1.5px solid rgba(255,255,255,0.45)', borderRadius: '50% 50% 0 0', borderBottom: 'none', clipPath: 'inset(0 0 50% 0)' }} />

          {/* Corner arcs */}
          {([
            { top: '3%', left: '5%',  br: '0 100% 100% 0' },
            { top: '3%', right: '5%', br: '100% 0 0 100%' },
            { bottom: '3%', left: '5%',  br: '0 0 100% 100%' },
            { bottom: '3%', right: '5%', br: '0 0 0 100%' },
          ] as const).map((c, i) => (
            <div key={i} style={{
              position: 'absolute', ...c,
              width: 16, height: 16,
              border: '1.5px solid rgba(255,255,255,0.45)',
              borderRadius: c.br,
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
          const isIncompat  = !!(selectedPlayer && isEmpty && !isCompatible)
          const isGol = slot.position === 'GOL'

          return (
            <div
              key={i}
              onClick={() => isPickable && onSlotClick(slot, i)}
              style={{
                position: 'absolute',
                left: `${slot.x}%`,
                top: `${slot.y}%`,
                transform: 'translate(-50%, -50%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                cursor: isPickable ? 'pointer' : 'default',
                zIndex: isPickable ? 10 : 5,
              }}
            >
              {/* Slot circle */}
              <div style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                transition: 'transform 0.15s',
                ...(pick ? {
                  background: isGol
                    ? 'linear-gradient(160deg, #e53935 0%, #b71c1c 100%)'
                    : 'linear-gradient(160deg, #ffffff 0%, #e8e8e8 100%)',
                  border: isGol ? '2px solid rgba(255,200,200,0.6)' : '2.5px solid rgba(255,255,255,0.9)',
                  boxShadow: isGol
                    ? '0 4px 16px rgba(229,57,53,0.6), 0 2px 8px rgba(0,0,0,0.5)'
                    : '0 4px 16px rgba(0,0,0,0.5)',
                  transform: 'translate(0,0)',
                } : isPickable ? {
                  background: 'rgba(229,57,53,0.15)',
                  border: '2px dashed rgba(229,57,53,0.9)',
                  boxShadow: '0 0 14px rgba(229,57,53,0.5)',
                  animation: 'slot-pulse 1.3s ease-in-out infinite',
                  transform: 'translate(0,0)',
                } : isIncompat ? {
                  background: 'rgba(0,0,0,0.1)',
                  border: '1.5px dashed rgba(255,255,255,0.18)',
                  animation: 'slot-idle 2.5s ease-in-out infinite',
                  transform: 'translate(0,0)',
                } : {
                  background: 'rgba(0,0,0,0.1)',
                  border: '1.5px dashed rgba(255,255,255,0.45)',
                  transform: 'translate(0,0)',
                }),
              }}>
                {pick ? (
                  <span style={{
                    fontSize: 13,
                    fontWeight: 900,
                    color: isGol ? '#fff' : '#111',
                    letterSpacing: '-0.02em',
                    lineHeight: 1,
                  }}>
                    {pick.player.rating}
                  </span>
                ) : (
                  <span style={{
                    fontSize: isPickable ? 10 : 9,
                    fontWeight: 700,
                    color: isPickable
                      ? 'rgba(255,120,120,0.95)'
                      : isIncompat
                        ? 'rgba(255,255,255,0.2)'
                        : 'rgba(255,255,255,0.6)',
                    letterSpacing: '0.02em',
                  }}>
                    {slot.label}
                  </span>
                )}
              </div>

              {/* Name pill below token (only when filled) */}
              {pick && (
                <div style={{
                  marginTop: 4,
                  background: 'rgba(0,0,0,0.72)',
                  borderRadius: 4,
                  padding: '2px 5px',
                  maxWidth: 52,
                }}>
                  <span style={{
                    fontSize: 7.5,
                    fontWeight: 900,
                    color: pick.player.isLegend ? '#FFD700' : '#fff',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    display: 'block',
                    textOverflow: 'ellipsis',
                    maxWidth: 50,
                  }}>
                    {pick.player.name.split(' ').pop()}
                  </span>
                </div>
              )}
            </div>
          )
        })}

        {/* Subtle edge vignette */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse 85% 85% at 50% 50%, transparent 50%, rgba(0,0,0,0.3) 100%)',
        }} />
      </div>
    </>
  )
}
