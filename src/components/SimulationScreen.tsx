import type { GameState } from '../engine/game'

interface Props {
  state: GameState
  onSimulate: () => void
  onNarrate: () => void
  onHome: () => void
}

const BG = 'linear-gradient(160deg, #080808 0%, #0f0f0f 50%, #120c00 100%)'

export default function SimulationScreen({ state, onSimulate, onNarrate, onHome }: Props) {
  const legends = state.picks.filter(p => p.player.isLegend).length
  const nations = [...new Set(state.picks.map(p => p.squad.flagEmoji))]

  return (
    <div className="min-h-screen flex flex-col" style={{ background: BG }}>

      {/* Top bar */}
      <div className="px-4 py-3 flex items-center justify-between flex-shrink-0" style={{ background: 'rgba(0,0,0,0.6)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <button onClick={onHome} className="font-black text-base" style={{ color: '#C9A84C' }}>0a7</button>
        <span className="font-black text-xs tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>TIME COMPLETO</span>
        <div className="text-right">
          <div className="font-black text-xl leading-none" style={{ color: '#C9A84C', textShadow: '0 0 16px rgba(201,168,76,0.5)' }}>{state.overall}</div>
          <div className="text-[8px] font-black tracking-widest" style={{ color: 'rgba(255,255,255,0.25)' }}>OVERALL</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-4 max-w-lg mx-auto w-full">

        {/* Hero — team overview */}
        <div className="relative rounded-3xl overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(201,168,76,0.1) 0%, rgba(0,0,0,0.6) 100%)', border: '1px solid rgba(201,168,76,0.2)', boxShadow: '0 0 40px rgba(201,168,76,0.08)' }}>
          {/* Glow orb */}
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(201,168,76,0.12) 0%, transparent 70%)' }} />

          <div className="relative p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-[9px] font-black tracking-widest mb-1" style={{ color: 'rgba(201,168,76,0.6)' }}>SEU DREAM TEAM</div>
                <div className="font-black text-2xl leading-none" style={{ color: '#fff' }}>
                  {state.picks.length}/11 <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>jogadores</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                {legends > 0 && (
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full" style={{ background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.3)' }}>
                    <span style={{ color: '#C9A84C', fontSize: 10 }}>★</span>
                    <span className="font-black text-[10px]" style={{ color: '#C9A84C' }}>{legends} lenda{legends > 1 ? 's' : ''}</span>
                  </div>
                )}
                <div className="flex gap-0.5">{nations.slice(0, 6).map((f, i) => <span key={i} className="text-base">{f}</span>)}</div>
              </div>
            </div>

            {/* Player grid */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-0">
              {state.picks.map((pick, i) => (
                <div key={i} className="flex items-center gap-2 py-1.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <span className="font-black text-[9px] w-7 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.2)' }}>{pick.slot.label}</span>
                  <span className="text-xs">{pick.squad.flagEmoji}</span>
                  <span className="font-bold text-[11px] truncate flex-1" style={{ color: 'rgba(255,255,255,0.85)' }}>{pick.player.name.split(' ').pop()}</span>
                  {pick.player.isLegend && <span className="text-[9px]" style={{ color: '#C9A84C' }}>★</span>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section title */}
        <div className="text-center">
          <p className="text-[10px] font-black tracking-[0.25em]" style={{ color: 'rgba(255,255,255,0.25)' }}>COMO QUER SIMULAR?</p>
        </div>

        {/* Narrate button — primary */}
        <button
          onClick={onNarrate}
          className="w-full rounded-2xl text-left transition-all active:scale-[0.98]"
          style={{
            padding: '20px',
            background: 'linear-gradient(135deg, rgba(209,46,46,0.22) 0%, rgba(120,20,20,0.15) 100%)',
            border: '1px solid rgba(209,46,46,0.4)',
            boxShadow: '0 8px 32px rgba(209,46,46,0.2), inset 0 1px 0 rgba(255,255,255,0.06)',
          }}
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0" style={{ background: 'rgba(209,46,46,0.2)', border: '1px solid rgba(209,46,46,0.3)' }}>
              📺
            </div>
            <div className="flex-1">
              <div className="font-black text-base tracking-wider mb-1" style={{ color: '#fff' }}>MELHORES MOMENTOS</div>
              <div className="text-[11px] leading-snug" style={{ color: 'rgba(255,255,255,0.45)' }}>Narração jogo a jogo ao vivo. Gols, defesas, drama — tudo.</div>
            </div>
            <div className="text-2xl font-black flex-shrink-0" style={{ color: 'rgba(209,46,46,0.6)' }}>›</div>
          </div>
        </button>

        {/* Quick result button — secondary */}
        <button
          onClick={onSimulate}
          className="w-full rounded-2xl text-left transition-all active:scale-[0.98]"
          style={{
            padding: '20px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
          }}
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              ⚡
            </div>
            <div className="flex-1">
              <div className="font-black text-base tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.8)' }}>RESULTADO DIRETO</div>
              <div className="text-[11px] leading-snug" style={{ color: 'rgba(255,255,255,0.35)' }}>Veja todos os jogos de uma vez, rápido e direto.</div>
            </div>
            <div className="text-2xl font-black flex-shrink-0" style={{ color: 'rgba(255,255,255,0.2)' }}>›</div>
          </div>
        </button>

        <button onClick={onHome} className="text-center text-xs font-bold py-2 transition-colors" style={{ color: 'rgba(255,255,255,0.2)' }}>
          ← Voltar ao início
        </button>
      </div>
    </div>
  )
}
