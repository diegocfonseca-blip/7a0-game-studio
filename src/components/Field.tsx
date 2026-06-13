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
        @keyframes slot-available {
          0%, 100% { transform: translate(-50%,-50%) scale(1); opacity: 0.9; }
          50%       { transform: translate(-50%,-50%) scale(1.12); opacity: 1; }
        }
      `}</style>

      <div
        style={{
          width: '100%',
          aspectRatio: '3/4',
          borderRadius: 10,
          overflow: 'hidden',
          background: `repeating-linear-gradient(
            180deg,
            #3d8040 0px, #3d8040 28px,
            #377539 28px, #377539 56px
          )`,
          boxShadow: '0 6px 24px rgba(0,0,0,0.5)',
          position: 'relative',
        }}
      >
        {/* Field markings */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {/* Pitch border */}
          <div style={{ position: 'absolute', top: '3%', left: '5%', right: '5%', bottom: '3%', border: '1.5px solid rgba(255,255,255,0.55)', borderRadius: 1 }} />

          {/* Top penalty box */}
          <div style={{ position: 'absolute', top: '3%', left: '20%', right: '20%', height: '14%', border: '1.5px solid rgba(255,255,255,0.5)', borderTop: 'none' }} />
          {/* Top goal box */}
          <div style={{ position: 'absolute', top: '3%', left: '33%', right: '33%', height: '6.5%', border: '1.5px solid rgba(255,255,255,0.4)', borderTop: 'none' }} />
          {/* Top penalty spot */}
          <div style={{ position: 'absolute', top: '15.5%', left: '50%', transform: 'translateX(-50%)', width: 4, height: 4, borderRadius: '50%', background: 'rgba(255,255,255,0.6)' }} />

          {/* Halfway line */}
          <div style={{ position: 'absolute', top: '50%', left: '5%', right: '5%', height: '1.5px', background: 'rgba(255,255,255,0.5)', transform: 'translateY(-50%)' }} />
          {/* Center circle */}
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '28%', paddingBottom: '28%', border: '1.5px solid rgba(255,255,255,0.48)', borderRadius: '50%' }} />
          {/* Center spot */}
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 4, height: 4, borderRadius: '50%', background: 'rgba(255,255,255,0.65)' }} />

          {/* Bottom penalty box */}
          <div style={{ position: 'absolute', bottom: '3%', left: '20%', right: '20%', height: '14%', border: '1.5px solid rgba(255,255,255,0.5)', borderBottom: 'none' }} />
          {/* Bottom goal box */}
          <div style={{ position: 'absolute', bottom: '3%', left: '33%', right: '33%', height: '6.5%', border: '1.5px solid rgba(255,255,255,0.4)', borderBottom: 'none' }} />
          {/* Bottom penalty spot */}
          <div style={{ position: 'absolute', bottom: '15.5%', left: '50%', transform: 'translateX(-50%)', width: 4, height: 4, borderRadius: '50%', background: 'rgba(255,255,255,0.6)' }} />

          {/* Bottom arc */}
          <div style={{ position: 'absolute', bottom: '17%', left: '50%', transform: 'translateX(-50%)', width: '24%', paddingBottom: '12%', border: '1.5px solid rgba(255,255,255,0.4)', borderRadius: '50% 50% 0 0', borderBottom: 'none', clipPath: 'inset(0 0 50% 0)' }} />

          {/* Corner arcs */}
          {([
            { top: '3%', left: '5%',   borderRadius: '0 100% 100% 0' },
            { top: '3%', right: '5%',  borderRadius: '100% 0 0 100%' },
            { bottom: '3%', left: '5%',   borderRadius: '0 0 100% 100%' },
            { bottom: '3%', right: '5%',  borderRadius: '0 0 0 100%' },
          ] as const).map((c, i) => (
            <div key={i} style={{ position: 'absolute', ...c, width: 14, height: 14, border: '1.5px solid rgba(255,255,255,0.45)' }} />
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
          const isIncompat = !!(selectedPlayer && isEmpty && !isCompatible)
          const isGol = slot.position === 'GOL'

          let circleStyle: React.CSSProperties = {}
          let textColor = '#fff'
          let animation: string | undefined

          if (pick) {
            circleStyle = {
              background: isGol
                ? 'linear-gradient(160deg, #ef5350 0%, #c62828 100%)'
                : 'linear-gradient(160deg, #ffffff 0%, #e0e0e0 100%)',
              border: isGol ? '2.5px solid rgba(255,200,200,0.8)' : '2.5px solid rgba(255,255,255,0.95)',
              boxShadow: isGol
                ? '0 4px 16px rgba(239,83,80,0.6), 0 2px 6px rgba(0,0,0,0.5)'
                : '0 4px 16px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.15)',
            }
            textColor = isGol ? '#fff' : '#111'
          } else if (isPickable) {
            // Solid filled, pulsing — no dashed border
            circleStyle = {
              background: 'rgba(212,168,64,0.25)',
              border: '2px solid rgba(212,168,64,0.9)',
              boxShadow: '0 0 14px rgba(212,168,64,0.5)',
            }
            textColor = 'rgba(212,168,64,1)'
            animation = 'slot-available 1.2s ease-in-out infinite'
          } else if (isIncompat) {
            // Nearly invisible — don't tempt the user to click
            circleStyle = {
              background: 'rgba(0,0,0,0.1)',
              border: '1px dashed rgba(255,255,255,0.15)',
            }
            textColor = 'rgba(255,255,255,0.2)'
          } else {
            // Default empty — subtle dashed like the original
            circleStyle = {
              background: 'rgba(0,0,0,0.12)',
              border: '1.5px dashed rgba(255,255,255,0.45)',
            }
            textColor = 'rgba(255,255,255,0.65)'
          }

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
                zIndex: isPickable ? 10 : pick ? 8 : 5,
              }}
            >
              <div style={{
                width: 46,
                height: 46,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                animation,
                ...(animation ? {} : { transform: 'translate(0,0)' }),
                ...circleStyle,
              }}>
                {pick ? (
                  <span style={{ fontSize: 14, fontWeight: 900, color: textColor, letterSpacing: '-0.02em', lineHeight: 1 }}>
                    {pick.player.rating}
                  </span>
                ) : (
                  <span style={{ fontSize: isPickable ? 10 : 9, fontWeight: 700, color: textColor, letterSpacing: '0.02em' }}>
                    {slot.label}
                  </span>
                )}
              </div>

              {pick && (
                <div style={{
                  marginTop: 3,
                  background: 'rgba(0,0,0,0.75)',
                  borderRadius: 4,
                  padding: '2px 6px',
                  maxWidth: 56,
                }}>
                  <span style={{
                    fontSize: 8,
                    fontWeight: 900,
                    color: pick.player.isLegend ? '#FFD700' : '#fff',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    display: 'block',
                    textOverflow: 'ellipsis',
                    maxWidth: 54,
                  }}>
                    {pick.player.name.split(' ').pop()}
                  </span>
                </div>
              )}
            </div>
          )
        })}

        {/* Edge vignette */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 90% 90% at 50% 50%, transparent 55%, rgba(0,0,0,0.25) 100%)' }} />
      </div>
    </>
  )
}
