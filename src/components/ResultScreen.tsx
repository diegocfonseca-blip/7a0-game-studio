import type { GameState } from '../engine/game'

interface Props { state: GameState; onReplay: () => void; onHome: () => void }

export default function ResultScreen({ state, onReplay, onHome }: Props) {
  const lastMatch = state.matches[state.matches.length - 1]
  const isChampion = !state.eliminated && lastMatch?.phase === 'Final' && lastMatch?.won

  const totalGoals = state.matches.reduce((s, m) => s + m.goalsFor, 0)
  const totalConceded = state.matches.reduce((s, m) => s + m.goalsAgainst, 0)
  const wins = state.matches.filter(m => m.won).length

  // Scorer tally
  const scorerMap: Record<string, number> = {}
  const assistMap: Record<string, number> = {}
  for (const match of state.matches) {
    for (const ev of match.events) {
      if (ev.type === 'goal' && ev.playerName) {
        scorerMap[ev.playerName] = (scorerMap[ev.playerName] ?? 0) + 1
      }
      if (ev.assistName) {
        assistMap[ev.assistName] = (assistMap[ev.assistName] ?? 0) + 1
      }
    }
  }
  const topScorers = Object.entries(scorerMap).sort((a, b) => b[1] - a[1]).slice(0, 5)
  const topAssists = Object.entries(assistMap).sort((a, b) => b[1] - a[1]).slice(0, 3)

  const shareText = [
    `🏆 LENDAS DA COPA — #${state.seed}`,
    isChampion ? '🥇 CAMPEÃO MUNDIAL!' : `❌ Eliminado: ${lastMatch?.phase}`,
    `${wins}V · ${totalGoals} gols · ${totalConceded} sofridos`,
    topScorers.length ? `⚽ Artilheiro: ${topScorers[0][0]} (${topScorers[0][1]}g)` : '',
    state.picks.map(p => `${p.slot.label}: ${p.player.name} (${p.squad.flagEmoji}${p.squad.year})`).join('\n'),
  ].filter(Boolean).join('\n')

  const handleShare = () => {
    if (navigator.share) navigator.share({ text: shareText })
    else {
      navigator.clipboard.writeText(shareText)
      alert('Copiado para a área de transferência!')
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F0E8]">
      {/* Header */}
      <div className={`py-8 text-center ${isChampion ? 'bg-[#C9A84C]' : 'bg-[#1a1a1a]'}`}>
        <div className="text-5xl mb-2">{isChampion ? '🏆' : '❌'}</div>
        <h1 className={`text-3xl font-black ${isChampion ? 'text-[#1a1a1a]' : 'text-white'}`}>
          {isChampion ? 'CAMPEÃO MUNDIAL!' : 'ELIMINADO'}
        </h1>
        {!isChampion && lastMatch && (
          <p className="text-white/70 text-sm mt-1">
            {lastMatch.phase} · {lastMatch.opponentFlag} {lastMatch.opponent} {lastMatch.opponentYear}
            {' · '}{lastMatch.goalsFor}–{lastMatch.goalsAgainst}
            {lastMatch.penalties && ` (pen. ${lastMatch.penalties.goalsFor}–${lastMatch.penalties.goalsAgainst})`}
          </p>
        )}
        <div className={`text-xs mt-2 font-bold opacity-50 ${isChampion ? 'text-[#1a1a1a]' : 'text-white'}`}>
          SEED #{state.seed}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* Stats */}
        <div className="bg-white rounded-xl p-4 grid grid-cols-4 gap-2 text-center shadow-sm">
          {[
            { v: state.overall, l: 'OVERALL' },
            { v: wins,          l: 'VITÓRIAS' },
            { v: totalGoals,    l: 'GOLS PRÓ' },
            { v: totalConceded, l: 'SOFRIDOS' },
          ].map(s => (
            <div key={s.l}>
              <div className="text-2xl font-black text-[#D12E2E]">{s.v}</div>
              <div className="text-[9px] text-[#888] uppercase tracking-widest">{s.l}</div>
            </div>
          ))}
        </div>

        {/* Campaign */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="text-[10px] font-black text-[#888] tracking-widest mb-3">A CAMPANHA</div>
          {state.matches.map((m, i) => (
            <div key={i} className="py-2 border-b border-gray-100 last:border-0">
              <div className="flex items-center gap-2">
                <div className={`text-[9px] font-black px-1.5 py-0.5 rounded shrink-0 ${m.won ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {m.phase.substring(0, 3).toUpperCase()}
                </div>
                <span className="text-base">{m.opponentFlag}</span>
                <div className="flex-1 text-sm">
                  <span className="font-bold">{m.opponent}</span>
                  <span className="text-[#888] text-xs ml-1">{m.opponentYear}</span>
                </div>
                <span className="font-black text-sm">
                  {m.goalsFor}–{m.goalsAgainst}
                  {m.penalties && (
                    <span className="text-[10px] text-[#888] ml-1">
                      (pen {m.penalties.goalsFor}–{m.penalties.goalsAgainst})
                    </span>
                  )}
                </span>
                <span>{m.won ? '✅' : '❌'}</span>
              </div>
              {/* Goal events */}
              {m.events.filter(e => e.type === 'goal').map((ev, j) => (
                <div key={j} className="text-[10px] text-[#555] mt-0.5 pl-9">
                  ⚽ {ev.minute}' {ev.playerName}
                  {ev.assistName && <span className="text-[#888]"> (ass: {ev.assistName})</span>}
                </div>
              ))}
              {m.events.filter(e => e.type === 'conceded').map((ev, j) => (
                <div key={j} className="text-[10px] text-[#D12E2E] mt-0.5 pl-9">
                  ⚽ {ev.minute}' {m.opponent}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Artilharia */}
        {(topScorers.length > 0 || topAssists.length > 0) && (
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="text-[10px] font-black text-[#888] tracking-widest mb-3">ARTILHARIA DO SEU TIME</div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-[9px] text-[#888] mb-2">⚽ GOLS</div>
                {topScorers.map(([name, g]) => (
                  <div key={name} className="flex justify-between text-xs py-0.5">
                    <span className="font-bold text-[#1a1a1a] truncate max-w-28">{name}</span>
                    <span className="font-black text-[#D12E2E]">{g}</span>
                  </div>
                ))}
              </div>
              {topAssists.length > 0 && (
                <div>
                  <div className="text-[9px] text-[#888] mb-2">🎯 ASSISTÊNCIAS</div>
                  {topAssists.map(([name, a]) => (
                    <div key={name} className="flex justify-between text-xs py-0.5">
                      <span className="font-bold text-[#1a1a1a] truncate max-w-28">{name}</span>
                      <span className="font-black text-[#C9A84C]">{a}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Team */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="text-[10px] font-black text-[#888] tracking-widest mb-3">
            SEU TIME · {state.mode === 'almanac' ? 'DE ALMANAQUE' : 'CLÁSSICO'}
          </div>
          {state.picks.map((pick, i) => (
            <div key={i} className="flex items-center gap-2 py-1 border-b border-gray-100 last:border-0">
              <span className="text-[10px] text-[#888] w-7 font-bold">{pick.slot.label}</span>
              <span className="text-sm">{pick.squad.flagEmoji}</span>
              <span className="flex-1 font-bold text-sm text-[#1a1a1a] truncate">{pick.player.name}</span>
              <span className="text-[10px] text-[#888]">{pick.squad.year}</span>
              {scorerMap[pick.player.name] && (
                <span className="text-[10px] text-[#D12E2E] font-black">⚽{scorerMap[pick.player.name]}</span>
              )}
              {assistMap[pick.player.name] && (
                <span className="text-[10px] text-[#C9A84C] font-black">🎯{assistMap[pick.player.name]}</span>
              )}
              <span className="font-black text-xs text-[#888]">
                {state.mode === 'almanac' ? '?' : pick.player.rating}
              </span>
              {pick.player.isLegend && <span>⭐</span>}
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pb-8">
          <button onClick={onHome} className="flex-1 border-2 border-[#1a1a1a] text-[#1a1a1a] font-black py-3 rounded-xl hover:bg-[#1a1a1a] hover:text-white transition-colors text-sm">
            ← INÍCIO
          </button>
          <button onClick={handleShare} className="flex-1 bg-[#C9A84C] text-[#1a1a1a] font-black py-3 rounded-xl hover:bg-[#b8943d] transition-colors text-sm">
            COMPARTILHAR 📤
          </button>
          <button onClick={onReplay} className="flex-1 bg-[#D12E2E] text-white font-black py-3 rounded-xl hover:bg-[#b52626] transition-colors text-sm">
            JOGAR DE NOVO
          </button>
        </div>
      </div>
    </div>
  )
}
