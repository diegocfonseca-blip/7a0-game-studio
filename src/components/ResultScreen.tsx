import type { GameState } from '../engine/game'

interface Props { state: GameState; onReplay: () => void; onHome: () => void }

export default function ResultScreen({ state, onReplay, onHome }: Props) {
  const lastMatch = state.matches[state.matches.length - 1]
  const isChampion = !state.eliminated && lastMatch?.phase === 'Final' && lastMatch?.won
  const totalGoals = state.matches.reduce((s, m) => s + m.goalsFor, 0)
  const totalConceded = state.matches.reduce((s, m) => s + m.goalsAgainst, 0)
  const wins = state.matches.filter(m => m.won).length

  const shareText = `🏆 LENDAS DA COPA — Seed #${state.seed}\n${isChampion ? '🥇 CAMPEÃO!' : `❌ Eliminado nas ${lastMatch?.phase}`}\nOverall: ${state.overall} | ${wins}V ${totalGoals}G ${totalConceded}S\n${state.picks.map(p => `${p.slot.label}: ${p.player.name} (${p.squad.flagEmoji} ${p.squad.year})`).join('\n')}`

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ text: shareText })
    } else {
      navigator.clipboard.writeText(shareText)
      alert('Copiado para a área de transferência!')
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F0E8]">
      {/* Header result */}
      <div className={`py-8 text-center ${isChampion ? 'bg-[#C9A84C]' : 'bg-[#1a1a1a]'}`}>
        <div className="text-5xl mb-2">{isChampion ? '🏆' : '❌'}</div>
        <h1 className={`text-3xl font-black ${isChampion ? 'text-[#1a1a1a]' : 'text-white'}`}>
          {isChampion ? 'CAMPEÃO MUNDIAL!' : `ELIMINADO`}
        </h1>
        {!isChampion && lastMatch && (
          <p className="text-white/70 text-sm mt-1">
            {lastMatch.phase} · {lastMatch.opponentFlag} {lastMatch.opponent} {lastMatch.opponentYear} · {lastMatch.goalsFor} – {lastMatch.goalsAgainst}
          </p>
        )}
        <div className={`text-sm mt-2 font-bold ${isChampion ? 'text-[#1a1a1a]/70' : 'text-white/50'}`}>
          SEED #{state.seed}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Stats */}
        <div className="bg-white rounded-xl p-4 grid grid-cols-4 gap-2 text-center shadow-sm">
          {[
            { v: state.overall, l: 'OVERALL' },
            { v: wins, l: 'VITÓRIAS' },
            { v: totalGoals, l: 'GOLS PRÓ' },
            { v: totalConceded, l: 'SOFRIDOS' },
          ].map(s => (
            <div key={s.l}>
              <div className="text-2xl font-black text-[#D12E2E]">{s.v}</div>
              <div className="text-[10px] text-[#888] uppercase tracking-widest">{s.l}</div>
            </div>
          ))}
        </div>

        {/* Matches */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="text-xs font-black text-[#888] tracking-widest mb-3">A CAMPANHA</div>
          {state.matches.map((m, i) => (
            <div key={i} className="flex items-center gap-2 py-2 border-b border-gray-100 last:border-0">
              <div className={`text-xs font-bold px-1.5 py-0.5 rounded ${m.won ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {m.phase.substring(0, 3).toUpperCase()}
              </div>
              <span className="text-base">{m.opponentFlag}</span>
              <div className="flex-1 text-sm">
                <span className="font-bold">{m.opponent}</span>
                <span className="text-[#888] text-xs ml-1">{m.opponentYear}</span>
              </div>
              <span className="font-black text-sm">{m.goalsFor} – {m.goalsAgainst}</span>
              <span>{m.won ? '✅' : '❌'}</span>
            </div>
          ))}
        </div>

        {/* Team */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="text-xs font-black text-[#888] tracking-widest mb-3">SEU TIME · {state.mode === 'almanac' ? 'DE ALMANAQUE' : 'CLÁSSICO'}</div>
          {state.picks.map((pick, i) => (
            <div key={i} className="flex items-center gap-2 py-1.5 border-b border-gray-100 last:border-0">
              <span className="text-xs text-[#888] w-8 font-bold">{pick.slot.label}</span>
              <span className="text-base">{pick.squad.flagEmoji}</span>
              <span className="flex-1 font-bold text-sm text-[#1a1a1a]">{pick.player.name}</span>
              <span className="text-xs text-[#888]">{pick.squad.countryCode} {pick.squad.year}</span>
              <span className="font-black text-sm text-[#888]">{state.mode === 'almanac' ? '?' : pick.player.rating}</span>
              {pick.player.isLegend && <span>⭐</span>}
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pb-8">
          <button onClick={onHome} className="flex-1 border-2 border-[#1a1a1a] text-[#1a1a1a] font-black py-3 rounded-xl hover:bg-[#1a1a1a] hover:text-white transition-colors">
            ← INÍCIO
          </button>
          <button onClick={handleShare} className="flex-1 bg-[#C9A84C] text-[#1a1a1a] font-black py-3 rounded-xl hover:bg-[#b8943d] transition-colors">
            COMPARTILHAR 📤
          </button>
          <button onClick={onReplay} className="flex-1 bg-[#D12E2E] text-white font-black py-3 rounded-xl hover:bg-[#b52626] transition-colors">
            JOGAR DE NOVO
          </button>
        </div>
      </div>
    </div>
  )
}
