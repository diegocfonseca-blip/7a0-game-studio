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
          0%, 100% { box-shadow: 0 0 0 0 rgba(255,80,80,0.7), 0 0 18px rgba(220,50,50,0.5), 0 4px 12px rgba(0,0,0,0.5); transform: translate(-50%,-50%) scale(1.12); }
          50%       { box-shadow: 0 0 0 8px rgba(255,80,80,0), 0 0 28px rgba(220,50,50,0.8), 0 4px 12px rgba(0,0,0,0.5); transform: translate(-50%,-50%) scale(1.22); }
        }
        @keyframes slot-idle {
          0%, 100% { opacity: 0.7; }
          50%       { opacity: 0.45; }
        }
      `}</style>
      <div
        className="relative w-full"
        style={{
          aspectRatio: '3/4',
          maxHeight: 360,
          borderRadius: 18,
          overflow: 'hidden',
          background: `
            repeating-linear-gradient(
              180deg,
              #1b5e20 0px, #1b5e20 30px,
              #1a6b1a 30px, #1a6b1a 60px
            )
          `,
          boxShadow: 'inset 0 0 80px rgba(0,0,0,0.45), 0 12px 40px rgba(0,0,0,0.7)',
          border: '2px solid rgba(255,255,255,0.12)',
        }}
      >
        {/* Ambient green glow */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse at 50% 40%, rgba(60,150,60,0.18) 0%, transparent 70%)',
        }} />

        {/* Field markings */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Outer border */}
          <div className="absolute" style={{ top: '4%', left: '4%', right: '4%', bottom: '4%', border: '1.5px solid rgba(255,255,255,0.4)', borderRadius: 2 }} />

          {/* Top penalty area */}
          <div className="absolute" style={{ top: '4%', left: '18%', right: '18%', height: '15%', border: '1.5px solid rgba(255,255,255,0.4)', borderTop: 'none' }} />
          {/* Top goal area */}
          <div className="absolute" style={{ top: '4%', left: '32%', right: '32%', height: '7%', border: '1.5px solid rgba(255,255,255,0.35)', borderTop: 'none' }} />
          {/* Top penalty spot */}
          <div className="absolute w-1.5 h-1.5 rounded-full" style={{ top: '17%', left: '50%', transform: 'translateX(-50%)', background: 'rgba(255,255,255,0.5)' }} />
          {/* Top goal posts */}
          <div className="absolute" style={{ top: '3.5%', left: '38%', right: '38%', height: '1.5%', background: 'rgba(255,255,255,0.55)', borderRadius: 2 }} />

          {/* Halfway line */}
          <div className="absolute" style={{ top: '50%', left: '4%', right: '4%', height: '1.5px', background: 'rgba(255,255,255,0.4)', transform: 'translateY(-50%)' }} />
          {/* Center circle */}
          <div className="absolute rounded-full" style={{
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '30%', paddingBottom: '30%',
            border: '1.5px solid rgba(255,255,255,0.38)',
          }} />
          {/* Center spot */}
          <div className="absolute" style={{
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 6, height: 6, borderRadius: '50%',
            background: 'rgba(255,255,255,0.55)',
          }} />

          {/* Bottom penalty area */}
          <div className="absolute" style={{ bottom: '4%', left: '18%', right: '18%', height: '15%', border: '1.5px solid rgba(255,255,255,0.4)', borderBottom: 'none' }} />
          {/* Bottom goal area */}
          <div className="absolute" style={{ bottom: '4%', left: '32%', right: '32%', height: '7%', border: '1.5px solid rgba(255,255,255,0.35)', borderBottom: 'none' }} />
          {/* Bottom penalty spot */}
          <div className="absolute w-1.5 h-1.5 rounded-full" style={{ bottom: '17%', left: '50%', transform: 'translateX(-50%)', background: 'rgba(255,255,255,0.5)' }} />
          {/* Bottom goal posts */}
          <div className="absolute" style={{ bottom: '3.5%', left: '38%', right: '38%', height: '1.5%', background: 'rgba(255,255,255,0.55)', borderRadius: 2 }} />

          {/* Corner arcs */}
          {[
            { style: { top: '4%', left: '4%' }, clip: 'polygon(100% 0, 0 100%, 100% 100%)' },
            { style: { top: '4%', right: '4%' }, clip: 'polygon(0 0, 0 100%, 100% 100%)' },
            { style: { bottom: '4%', left: '4%' }, clip: 'polygon(0 0, 100% 0, 100% 100%)' },
            { style: { bottom: '4%', right: '4%' }, clip: 'polygon(0 0, 100% 0, 0 100%)' },
          ].map((c, i) => (
            <div key={i} className="absolute" style={{
              ...c.style,
              width: 18, height: 18,
              borderRadius: '50%',
              border: '1.5px solid rgba(255,255,255,0.35)',
              clipPath: c.clip,
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
          const isIncompatibleEmpty = selectedPlayer && isEmpty && !isCompatible

          const shortName = pick
            ? (pick.player.name.split(' ').pop()?.substring(0, 6) ?? '?')
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
                  width: 42,
                  height: 42,
                  borderRadius: '50%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  transition: 'all 0.15s',
                  ...(pick ? {
                    background: 'linear-gradient(160deg, #ffffff 0%, #dde8dd 100%)',
                    border: '2.5px solid rgba(255,255,255,0.95)',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.9)',
                    transform: 'translate(0,0)',
                  } : isPickable ? {
                    background: 'linear-gradient(160deg, #e53935 0%, #b71c1c 100%)',
                    border: '2.5px solid rgba(255,180,180,0.7)',
                    animation: 'slot-pulse 1.4s ease-in-out infinite',
                  } : isIncompatibleEmpty ? {
                    background: 'rgba(255,255,255,0.04)',
                    border: '1.5px dashed rgba(255,255,255,0.15)',
                    animation: 'slot-idle 2.5s ease-in-out infinite',
                  } : {
                    background: 'rgba(255,255,255,0.14)',
                    border: '2px solid rgba(255,255,255,0.32)',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.45)',
                  }),
                }}
              >
                {pick ? (
                  <span style={{ fontSize: 18, lineHeight: 1, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}>
                    {pick.squad.flagEmoji}
                  </span>
                ) : (
                  <span style={{
                    fontSize: isPickable ? 10 : 9,
                    fontWeight: 900,
                    letterSpacing: '0.02em',
                    color: isPickable ? '#fff' : isIncompatibleEmpty ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.75)',
                  }}>
                    {slot.label}
                  </span>
                )}
              </div>

              {/* Name label below token */}
              {pick && (
                <div
                  style={{
                    marginTop: 3,
                    fontSize: 8,
                    fontWeight: 900,
                    color: '#fff',
                    textShadow: '0 1px 6px rgba(0,0,0,1), 0 0 12px rgba(0,0,0,0.9)',
                    maxWidth: 48,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    letterSpacing: '0.02em',
                    textTransform: 'uppercase',
                  }}
                >
                  {shortName}
                </div>
              )}

              {/* Legend star */}
              {pick?.player.isLegend && (
                <div style={{ fontSize: 7, color: '#FFD700', lineHeight: 1, textShadow: '0 0 6px rgba(255,200,0,0.9), 0 0 12px rgba(255,150,0,0.5)' }}>★</div>
              )}
            </div>
          )
        })}

        {/* Edge vignette */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse 90% 90% at 50% 50%, transparent 55%, rgba(0,0,0,0.4) 100%)',
        }} />
      </div>
    </>
  )
}
