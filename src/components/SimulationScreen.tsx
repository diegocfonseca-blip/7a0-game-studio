import { GameState } from '../engine/game'

interface Props { state: GameState; onSimulate: () => void; onHome: () => void }

export default function SimulationScreen({ state, onSimulate, onHome }: Props) {
  return (
    <div className="min-h-screen bg-[#F5F0E8] flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="text-6xl font-black text-[#1a1a1a] mb-2">🏆</div>
          <h1 className="text-3xl font-black text-[#1a1a1a] mb-1">Time completo!</h1>
          <p className="text-[#888] text-sm">Overall do time: <span className="font-black text-[#D12E2E] text-lg">{state.overall}</span></p>
        </div>

        {/* Team preview */}
        <div className="bg-white rounded-xl p-4 mb-6 shadow-sm">
          <div className="text-xs font-black text-[#888] tracking-widest mb-3">SEU TIME</div>
          {state.picks.map((pick, i) => (
            <div key={i} className="flex items-center gap-2 py-1.5 border-b border-gray-100 last:border-0">
              <span className="text-xs text-[#888] w-8">{pick.slot.label}</span>
              <span className="flex-1 font-bold text-sm text-[#1a1a1a]">{pick.player.name}</span>
              <span className="text-lg">{pick.squad.flagEmoji}</span>
              <span className="text-xs text-[#888]">{pick.squad.year}</span>
              {pick.player.isLegend && <span className="text-[10px]">⭐</span>}
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button onClick={onHome} className="flex-1 border-2 border-[#1a1a1a] text-[#1a1a1a] font-black py-3 rounded-xl hover:bg-[#1a1a1a] hover:text-white transition-colors">
            ← INÍCIO
          </button>
          <button onClick={onSimulate} className="flex-2 flex-1 bg-[#D12E2E] text-white font-black py-3 rounded-xl hover:bg-[#b52626] transition-colors text-sm tracking-wider animate-pulse-ring">
            SIMULAR A COPA →
          </button>
        </div>
      </div>
    </div>
  )
}
