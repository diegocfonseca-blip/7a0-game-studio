import type { GameState } from '../engine/game'

interface Props { state: GameState; onReplay: () => void; onHome: () => void }

export default function ResultScreen({ state, onReplay, onHome }: Props) {
  const lastMatch = state.matches[state.matches.length - 1]
  const isChampion = !state.eliminated && lastMatch?.phase === 'Final' && lastMatch?.won

  const totalGoals = state.matches.reduce((s, m) => s + m.goalsFor, 0)
  const totalConceded = state.matches.reduce((s, m) => s + m.goalsAgainst, 0)
  const wins = state.matches.filter(m => m.won).length

  const scorerMap: Record<string, number> = {}
  const assistMap: Record<string, number> = {}
  for (const match of state.matches) {
    for (const ev of match.events) {
      if (ev.type === 'goal' && ev.playerName)
        scorerMap[ev.playerName] = (scorerMap[ev.playerName] ?? 0) + 1
      if (ev.assistName)
        assistMap[ev.assistName] = (assistMap[ev.assistName] ?? 0) + 1
    }
  }
  const topScorers = Object.entries(scorerMap).sort((a, b) => b[1] - a[1]).slice(0, 5)
  const topAssists = Object.entries(assistMap).sort((a, b) => b[1] - a[1]).slice(0, 3)

  const shareText = [
    `🏆 0a7LEGENDS — #${state.seed}`,
    isChampion ? '🥇 CAMPEÃO MUNDIAL!' : `❌ Eliminado: ${lastMatch?.phase}`,
    `${wins}V · ${totalGoals} gols · ${totalConceded} sofridos`,
    topScorers.length ? `⚽ ${topScorers[0][0]} (${topScorers[0][1]}g)` : '',
  ].filter(Boolean).join('\n')

  const handleShare = () => {
    if (navigator.share) navigator.share({ text: shareText })
    else { navigator.clipboard.writeText(shareText); alert('Copiado!') }
  }

  return (
    <div className="min-h-screen bg-[#F5F0E8] flex flex-col">

      {/* Result header */}
      <div className={`px-5 pt-8 pb-6 text-center ${isChampion ? 'bg-[#C9A84C]' : 'bg-[#1a1a1a]'}`}>
        <div className="text-5xl mb-3">{isChampion ? '🏆' : '❌'}</div>
        <h1 className={`text-2xl font-black tracking-wider mb-1 ${isChampion ? 'text-[#1a1a1a]' : 'text-white'}`}>
          {isChampion ? 'CAMPEÃO MUNDIAL!' : 'ELIMINADO'}
        </h1>
        {!isChampion && lastMatch && (
          <p className="text-white/60 text-xs mt-1">
            {lastMatch.phase} · {lastMatch.opponentFlag} {lastMatch.opponent} {lastMatch.opponentYear}
            {' '}{lastMatch.goalsFor}–{lastMatch.goalsAgainst}
            {lastMatch.penalties && ` (pen. ${lastMatch.penalties.goalsFor}–${lastMatch.penalties.goalsAgainst})`}
          </p>
        )}
        <div className={`text-[9px] font-bold tracking-widest mt-2 opacity-40 ${isChampion ? 'text-[#1a1a1a]' : 'text-white'}`}>
          SEED #{state.seed}
        </div>
      </div>

      <div className="px-4 py-4 flex flex-col gap-4 max-w-lg mx-auto w-full">

        {/* Stats row */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="grid grid-cols-4 divide-x divide-gray-100">
            {[
              { v: state.overall, l: 'OVERALL', c: 'text-[#1a1a1a]' },
              { v: wins, l: 'VITÓRIAS', c: 'text-green-600' },
              { v: totalGoals, l: 'GOLS', c: 'text-[#D12E2E]' },
              { v: totalConceded, l: 'SOFREU', c: 'text-[#888]' },
            ].map(s => (
              <div key={s.l} className="py-4 text-center">
                <div className={`text-2xl font-black ${s.c}`}>{s.v}</div>
                <div className="text-[8px] text-[#aaa] uppercase tracking-widest mt-0.5">{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Artilharia */}
        {(topScorers.length > 0 || topAssists.length > 0) && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-[10px] font-black text-[#888] tracking-widest mb-3">ARTILHARIA DO SEU TIME</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[9px] text-[#aaa] font-bold mb-2">⚽ GOLS</p>
                {topScorers.map(([name, g]) => (
                  <div key={name} className="flex items-center justify-between py-1 border-b border-gray-50 last:border-0">
                    <span className="font-bold text-xs text-[#1a1a1a] truncate flex-1 mr-2">{name.split(' ').pop()}</span>
                    <span className="font-black text-sm text-[#D12E2E] flex-shrink-0">{g}</span>
                  </div>
                ))}
              </div>
              {topAssists.length > 0 && (
                <div>
                  <p className="text-[9px] text-[#aaa] font-bold mb-2">🎯 ASSISTS</p>
                  {topAssists.map(([name, a]) => (
                    <div key={name} className="flex items-center justify-between py-1 border-b border-gray-50 last:border-0">
                      <span className="font-bold text-xs text-[#1a1a1a] truncate flex-1 mr-2">{name.split(' ').pop()}</span>
                      <span className="font-black text-sm text-[#C9A84C] flex-shrink-0">{a}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Campaign */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] font-black text-[#888] tracking-widest mb-3">A CAMPANHA</p>
          <div className="flex flex-col gap-2">
            {state.matches.map((m, i) => (
              <div key={i} className={`rounded-xl p-3 ${m.won ? 'bg-green-50' : 'bg-red-50'}`}>
                <div className="flex items-center gap-2">
                  <div className={`text-[9px] font-black px-2 py-0.5 rounded-full flex-shrink-0 ${
                    m.won ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                  }`}>{m.phase.slice(0,3).toUpperCase()}</div>
                  <span className="text-base flex-shrink-0">{m.opponentFlag}</span>
                  <span className="font-bold text-sm text-[#1a1a1a] flex-1 truncate">{m.opponent}</span>
                  <span className="text-[10px] text-[#999] flex-shrink-0">{m.opponentYear}</span>
                  <span className="font-black text-sm flex-shrink-0">
                    {m.goalsFor}–{m.goalsAgainst}
                    {m.penalties && (
                      <span className="text-[9px] text-[#999] ml-1">
                        p.{m.penalties.goalsFor}–{m.penalties.goalsAgainst}
                      </span>
                    )}
                  </span>
                </div>
                {/* Goal scorers */}
                {m.events.filter(e => e.type === 'goal').length > 0 && (
                  <div className="mt-1.5 pl-2 flex flex-wrap gap-x-3 gap-y-0.5">
                    {m.events.filter(e => e.type === 'goal').map((ev, j) => (
                      <span key={j} className="text-[10px] text-[#555]">
                        ⚽ {ev.minute}' {ev.playerName?.split(' ').pop()}
                        {ev.assistName && <span className="text-[#999]"> ({ev.assistName?.split(' ').pop()})</span>}
                      </span>
                    ))}
                    {m.events.filter(e => e.type === 'conceded').map((ev, j) => (
                      <span key={j} className="text-[10px] text-red-400">
                        ⚽ {ev.minute}' {m.opponent}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Team */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] font-black text-[#888] tracking-widest mb-3">SEU TIME</p>
          <div className="grid grid-cols-2 gap-x-4">
            {state.picks.map((pick, i) => (
              <div key={i} className="flex items-center gap-1.5 py-1.5 border-b border-gray-50 last:border-0">
                <span className="text-[9px] text-[#ccc] w-6 font-black flex-shrink-0">{pick.slot.label}</span>
                <span className="text-xs flex-shrink-0">{pick.squad.flagEmoji}</span>
                <span className="font-bold text-[11px] text-[#1a1a1a] truncate flex-1">{pick.player.name.split(' ').pop()}</span>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {scorerMap[pick.player.name] > 0 && (
                    <span className="text-[9px] text-[#D12E2E] font-black">⚽{scorerMap[pick.player.name]}</span>
                  )}
                  {assistMap[pick.player.name] > 0 && (
                    <span className="text-[9px] text-[#C9A84C] font-black">🎯{assistMap[pick.player.name]}</span>
                  )}
                  {pick.player.isLegend && <span className="text-[9px]">⭐</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pb-8">
          <button
            onClick={onHome}
            className="flex-1 border-2 border-gray-300 text-[#555] font-black py-3.5 rounded-2xl hover:border-[#1a1a1a] hover:text-[#1a1a1a] transition-colors text-sm"
          >
            ← INÍCIO
          </button>
          <button
            onClick={handleShare}
            className="flex-1 bg-[#C9A84C] text-[#1a1a1a] font-black py-3.5 rounded-2xl hover:bg-[#b8943d] transition-colors text-sm"
          >
            COMPARTILHAR 📤
          </button>
          <button
            onClick={onReplay}
            className="flex-1 bg-[#D12E2E] text-white font-black py-3.5 rounded-2xl hover:bg-[#b52626] transition-colors text-sm"
          >
            JOGAR NOVO
          </button>
        </div>
      </div>
    </div>
  )
}
