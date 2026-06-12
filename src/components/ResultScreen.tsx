import type { GameState } from '../engine/game'

interface Props { state: GameState; onReplay: () => void; onHome: () => void }

const BG = 'linear-gradient(160deg, #0d0d0d 0%, #111 60%, #1a1200 100%)'

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
      if (ev.type === 'goal' && ev.playerName) scorerMap[ev.playerName] = (scorerMap[ev.playerName] ?? 0) + 1
      if (ev.assistName) assistMap[ev.assistName] = (assistMap[ev.assistName] ?? 0) + 1
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
    <div className="min-h-screen flex flex-col" style={{ background: BG }}>

      {/* Hero header */}
      <div className="relative overflow-hidden px-5 pt-10 pb-8 text-center flex-shrink-0"
        style={{
          background: isChampion
            ? 'linear-gradient(160deg, #2a1c00 0%, #1a1200 100%)'
            : 'linear-gradient(160deg, #1a0000 0%, #0d0d0d 100%)',
          borderBottom: isChampion ? '1px solid rgba(201,168,76,0.2)' : '1px solid rgba(209,46,46,0.15)',
        }}>
        {/* Glow orb */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full pointer-events-none"
          style={{ background: isChampion ? 'radial-gradient(circle, rgba(201,168,76,0.15) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(209,46,46,0.12) 0%, transparent 70%)' }} />

        <div className="text-6xl mb-3 relative">{isChampion ? '🏆' : '💀'}</div>
        <h1 className="text-3xl font-black tracking-wider mb-2 relative" style={{ color: isChampion ? '#C9A84C' : '#fff' }}>
          {isChampion ? 'CAMPEÃO MUNDIAL!' : 'ELIMINADO'}
        </h1>
        {!isChampion && lastMatch && (
          <p className="text-sm relative" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {lastMatch.phase} · {lastMatch.opponentFlag} {lastMatch.opponent} {lastMatch.opponentYear}
            {'  '}{lastMatch.goalsFor}–{lastMatch.goalsAgainst}
            {lastMatch.penalties && ` (pen. ${lastMatch.penalties.goalsFor}–${lastMatch.penalties.goalsAgainst})`}
          </p>
        )}
        <div className="text-[9px] font-bold tracking-widest mt-3 relative" style={{ color: 'rgba(255,255,255,0.15)' }}>
          SEED #{state.seed}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 max-w-lg mx-auto w-full">

        {/* Stats row */}
        <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="grid grid-cols-4 divide-x" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            {[
              { v: state.overall, l: 'OVERALL', c: '#C9A84C' },
              { v: wins, l: 'VITÓRIAS', c: '#4CAF50' },
              { v: totalGoals, l: 'GOLS', c: '#D12E2E' },
              { v: totalConceded, l: 'SOFREU', c: 'rgba(255,255,255,0.35)' },
            ].map(s => (
              <div key={s.l} className="py-4 text-center" style={{ borderRight: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="text-2xl font-black" style={{ color: s.c }}>{s.v}</div>
                <div className="text-[8px] font-black tracking-widest mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Artilharia */}
        {(topScorers.length > 0 || topAssists.length > 0) && (
          <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="text-[10px] font-black tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.3)' }}>ARTILHARIA DO SEU TIME</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[9px] font-black mb-2" style={{ color: 'rgba(255,255,255,0.3)' }}>⚽ GOLS</p>
                {topScorers.map(([name, g]) => (
                  <div key={name} className="flex items-center justify-between py-1.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <span className="font-bold text-xs truncate flex-1 mr-2" style={{ color: 'rgba(255,255,255,0.8)' }}>{name.split(' ').pop()}</span>
                    <span className="font-black text-sm flex-shrink-0" style={{ color: '#D12E2E' }}>{g}</span>
                  </div>
                ))}
              </div>
              {topAssists.length > 0 && (
                <div>
                  <p className="text-[9px] font-black mb-2" style={{ color: 'rgba(255,255,255,0.3)' }}>🎯 ASSISTS</p>
                  {topAssists.map(([name, a]) => (
                    <div key={name} className="flex items-center justify-between py-1.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <span className="font-bold text-xs truncate flex-1 mr-2" style={{ color: 'rgba(255,255,255,0.8)' }}>{name.split(' ').pop()}</span>
                      <span className="font-black text-sm flex-shrink-0" style={{ color: '#C9A84C' }}>{a}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Campaign */}
        <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-[10px] font-black tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>A CAMPANHA</p>
          </div>
          <div className="px-3 py-2 flex flex-col gap-1.5">
            {state.matches.map((m, i) => (
              <div key={i} className="flex items-center gap-2 rounded-xl px-3 py-2.5" style={{
                background: m.won ? 'rgba(76,175,80,0.08)' : 'rgba(209,46,46,0.08)',
                border: m.won ? '1px solid rgba(76,175,80,0.2)' : '1px solid rgba(209,46,46,0.2)',
              }}>
                <div className="text-[9px] font-black px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{
                    background: m.won ? 'rgba(76,175,80,0.2)' : 'rgba(209,46,46,0.2)',
                    color: m.won ? '#4CAF50' : '#D12E2E',
                  }}>
                  {m.phase.slice(0, 3).toUpperCase()}
                </div>
                <span className="text-base flex-shrink-0">{m.opponentFlag}</span>
                <span className="font-bold text-sm flex-1 truncate" style={{ color: 'rgba(255,255,255,0.8)' }}>{m.opponent}</span>
                <span className="text-[10px] flex-shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }}>{m.opponentYear}</span>
                <span className="font-black text-sm flex-shrink-0" style={{ color: '#fff' }}>
                  {m.goalsFor}–{m.goalsAgainst}
                  {m.penalties && <span className="text-[9px] ml-1" style={{ color: 'rgba(255,255,255,0.35)' }}>p.{m.penalties.goalsFor}–{m.penalties.goalsAgainst}</span>}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Team */}
        <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-[10px] font-black tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>SEU TIME</p>
          </div>
          <div className="grid grid-cols-2 px-3 py-2">
            {state.picks.map((pick, i) => (
              <div key={i} className="flex items-center gap-2 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <span className="text-[9px] font-black w-7 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.2)' }}>{pick.slot.label}</span>
                <span className="text-xs flex-shrink-0">{pick.squad.flagEmoji}</span>
                <span className="font-bold text-[11px] truncate flex-1" style={{ color: 'rgba(255,255,255,0.8)' }}>{pick.player.name.split(' ').pop()}</span>
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  {scorerMap[pick.player.name] > 0 && <span className="text-[9px] font-black" style={{ color: '#D12E2E' }}>⚽{scorerMap[pick.player.name]}</span>}
                  {assistMap[pick.player.name] > 0 && <span className="text-[9px] font-black" style={{ color: '#C9A84C' }}>🎯{assistMap[pick.player.name]}</span>}
                  {pick.player.isLegend && <span className="text-[9px]" style={{ color: '#C9A84C' }}>★</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pb-8">
          <button onClick={onHome}
            className="flex-1 font-black py-3.5 rounded-2xl text-sm transition-all active:scale-95"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}>
            ← INÍCIO
          </button>
          <button onClick={handleShare}
            className="flex-1 font-black py-3.5 rounded-2xl text-sm transition-all active:scale-95"
            style={{ background: 'rgba(201,168,76,0.15)', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.3)' }}>
            SHARE 📤
          </button>
          <button onClick={onReplay}
            className="flex-1 font-black py-3.5 rounded-2xl text-sm transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg, #D12E2E, #a01f1f)', color: '#fff', boxShadow: '0 4px 20px rgba(209,46,46,0.35)' }}>
            NOVO 🎲
          </button>
        </div>
      </div>
    </div>
  )
}
