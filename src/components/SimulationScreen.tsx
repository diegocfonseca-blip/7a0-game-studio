import type { GameState } from '../engine/game'

interface Props {
  state: GameState
  onSimulate: () => void
  onNarrate: () => void
  onHome: () => void
}

export default function SimulationScreen({ state, onSimulate, onNarrate, onHome }: Props) {
  const legends = state.picks.filter(p => p.player.isLegend).length

  return (
    <div className="min-h-screen bg-[#F5F0E8] flex flex-col">
      {/* Header strip */}
      <div className="bg-[#1a1a1a] px-5 py-4 flex items-center justify-between">
        <button onClick={onHome} className="text-[#C9A84C] font-black text-sm tracking-tight">0a7</button>
        <div className="text-center">
          <div className="text-white font-black text-base tracking-wider">TIME COMPLETO</div>
          <div className="text-white/50 text-[10px] tracking-widest">PRONTO PARA JOGAR</div>
        </div>
        <div className="text-right">
          <div className="text-[#C9A84C] font-black text-xl">{state.overall}</div>
          <div className="text-white/40 text-[9px]">OVERALL</div>
        </div>
      </div>

      <div className="flex-1 px-4 py-5 max-w-lg mx-auto w-full flex flex-col gap-4">

        {/* Team summary bar */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black text-[#888] tracking-widest">SEU TIME</span>
            <div className="flex gap-3 text-[10px] font-bold text-[#888]">
              {legends > 0 && <span className="text-[#C9A84C]">⭐ {legends} lenda{legends > 1 ? 's' : ''}</span>}
              <span>{state.picks.length}/11 jogadores</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-4">
            {state.picks.map((pick, i) => (
              <div key={i} className="flex items-center gap-1.5 py-1 border-b border-gray-50 last:border-0">
                <span className="text-[9px] text-[#bbb] w-6 font-black flex-shrink-0">{pick.slot.label}</span>
                <span className="text-xs">{pick.squad.flagEmoji}</span>
                <span className="font-bold text-[11px] text-[#1a1a1a] truncate flex-1">{pick.player.name.split(' ').pop()}</span>
                {pick.player.isLegend && <span className="text-[9px]">⭐</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Simulation mode */}
        <div>
          <p className="text-[10px] font-black text-[#888] tracking-widest text-center mb-3">COMO QUER SIMULAR?</p>

          <button
            onClick={onNarrate}
            className="w-full mb-3 bg-[#1a1a1a] text-white rounded-2xl p-5 flex items-center gap-4 hover:bg-[#2a2a2a] active:scale-[0.98] transition-all shadow-md"
          >
            <div className="text-3xl flex-shrink-0">📺</div>
            <div className="text-left flex-1">
              <div className="font-black text-sm tracking-wider mb-0.5">MELHORES MOMENTOS</div>
              <div className="text-[11px] text-white/50 leading-tight">Narração jogo a jogo, estilo Football Manager. Viva cada gol.</div>
            </div>
            <div className="text-white/30 text-lg">›</div>
          </button>

          <button
            onClick={onSimulate}
            className="w-full bg-white border-2 border-gray-200 text-[#1a1a1a] rounded-2xl p-5 flex items-center gap-4 hover:border-[#1a1a1a] active:scale-[0.98] transition-all"
          >
            <div className="text-3xl flex-shrink-0">⚡</div>
            <div className="text-left flex-1">
              <div className="font-black text-sm tracking-wider mb-0.5">RESULTADO DIRETO</div>
              <div className="text-[11px] text-[#999] leading-tight">Veja todos os jogos de uma vez, rápido e direto.</div>
            </div>
            <div className="text-[#ccc] text-lg">›</div>
          </button>
        </div>

        <button
          onClick={onHome}
          className="text-[#aaa] text-xs font-bold py-2 hover:text-[#1a1a1a] transition-colors text-center"
        >
          ← Voltar ao início
        </button>
      </div>
    </div>
  )
}
