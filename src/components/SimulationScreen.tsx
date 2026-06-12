import type { GameState } from '../engine/game'

interface Props {
  state: GameState
  onSimulate: () => void
  onNarrate: () => void
  onHome: () => void
}

export default function SimulationScreen({ state, onSimulate, onNarrate, onHome }: Props) {
  return (
    <div className="min-h-screen bg-[#F5F0E8] flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">🏆</div>
          <h1 className="text-2xl font-black text-[#1a1a1a] mb-1">Time completo!</h1>
          <p className="text-[#888] text-sm">
            Overall: <span className="font-black text-[#D12E2E] text-lg">{state.overall}</span>
          </p>
        </div>

        {/* Team preview */}
        <div className="bg-white rounded-xl p-4 mb-5 shadow-sm">
          <div className="text-[10px] font-black text-[#888] tracking-widest mb-3">SEU TIME</div>
          {state.picks.map((pick, i) => (
            <div key={i} className="flex items-center gap-2 py-1.5 border-b border-gray-100 last:border-0">
              <span className="text-[10px] text-[#888] w-8 font-bold">{pick.slot.label}</span>
              <span className="text-base">{pick.squad.flagEmoji}</span>
              <span className="flex-1 font-bold text-sm text-[#1a1a1a]">{pick.player.name}</span>
              <span className="text-[10px] text-[#888]">{pick.squad.countryCode} {pick.squad.year}</span>
              {pick.player.isLegend && <span className="text-[10px]">⭐</span>}
            </div>
          ))}
        </div>

        {/* Mode choice */}
        <div className="mb-4">
          <div className="text-[10px] font-black text-[#888] tracking-widest mb-2 text-center">COMO QUER SIMULAR?</div>

          <button
            onClick={onNarrate}
            className="w-full mb-2 bg-[#1a1a1a] text-white font-black py-4 rounded-xl hover:bg-[#333] transition-colors flex items-center justify-center gap-3"
          >
            <span className="text-2xl">📺</span>
            <div className="text-left">
              <div className="text-sm tracking-wider">MELHORES MOMENTOS</div>
              <div className="text-[10px] font-normal text-white/60">Narração jogo a jogo — estilo Football Manager</div>
            </div>
          </button>

          <button
            onClick={onSimulate}
            className="w-full bg-white border-2 border-[#1a1a1a] text-[#1a1a1a] font-black py-4 rounded-xl hover:bg-[#1a1a1a] hover:text-white transition-colors flex items-center justify-center gap-3"
          >
            <span className="text-2xl">⚡</span>
            <div className="text-left">
              <div className="text-sm tracking-wider">RESULTADO DIRETO</div>
              <div className="text-[10px] font-normal text-[#888]">Igual ao jogo 7a0 original — sem narração</div>
            </div>
          </button>
        </div>

        <button onClick={onHome} className="w-full text-[#888] text-xs font-bold py-2 hover:text-[#1a1a1a] transition-colors">
          ← VOLTAR AO INÍCIO
        </button>
      </div>
    </div>
  )
}
