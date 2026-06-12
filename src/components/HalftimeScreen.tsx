import { useState } from 'react'
import { FORMATIONS, canPlayPosition } from '../data/formations'
import type { Formation } from '../data/formations'
import type { MatchResult, PickedPlayer, GameStyle, GameMode } from '../engine/game'
import type { Player } from '../data/squads'

interface Props {
  picks: PickedPlayer[]
  groupMatches: MatchResult[]
  formation: Formation
  style: GameStyle
  mode: GameMode
  onContinue: (newPicks: PickedPlayer[], newFormation: Formation, newStyle: GameStyle) => void
  onHome: () => void
}

const STYLE_LABELS: Record<GameStyle, string> = {
  defensive: 'DEFENSIVO',
  balanced: 'EQUILIBRADO',
  offensive: 'OFENSIVO',
}

export default function HalftimeScreen({ picks, groupMatches, formation, style, mode, onContinue, onHome }: Props) {
  const [currentPicks, setCurrentPicks] = useState<PickedPlayer[]>(picks)
  const [currentFormation, setCurrentFormation] = useState<Formation>(formation)
  const [currentStyle, setCurrentStyle] = useState<GameStyle>(style)
  const [subsLeft, setSubsLeft] = useState(3)
  const [subOffIdx, setSubOffIdx] = useState<number | null>(null) // index in currentPicks

  // Build bench: players from each squad that weren't picked
  const getBench = (squadId: string) => {
    const squadPick = currentPicks.find(p => p.squad.id === squadId)
    if (!squadPick) return []
    const pickedIds = currentPicks.filter(p => p.squad.id === squadId).map(p => p.player.id)
    return squadPick.squad.players.filter(pl => !pickedIds.includes(pl.id))
  }

  const handleSubOff = (pickIdx: number) => {
    if (subsLeft === 0) return
    setSubOffIdx(idx => idx === pickIdx ? null : pickIdx)
  }

  const handleSubOn = (benchPlayer: Player) => {
    if (subOffIdx === null || subsLeft === 0) return
    const outPick = currentPicks[subOffIdx]
    if (!canPlayPosition(benchPlayer.primaryPosition, benchPlayer.secondaryPositions, outPick.slot.position)) {
      // Incompatible position — warn briefly
      return
    }
    const newPicks = currentPicks.map((p, i) =>
      i === subOffIdx ? { ...p, player: benchPlayer } : p
    )
    setCurrentPicks(newPicks)
    setSubsLeft(s => s - 1)
    setSubOffIdx(null)
  }

  const wins = groupMatches.filter(m => m.won).length
  const draws = groupMatches.filter(m => m.goalsFor === m.goalsAgainst).length
  const losses = groupMatches.filter(m => !m.won && m.goalsFor !== m.goalsAgainst).length
  const gf = groupMatches.reduce((s, m) => s + m.goalsFor, 0)
  const ga = groupMatches.reduce((s, m) => s + m.goalsAgainst, 0)

  const selectedOut = subOffIdx !== null ? currentPicks[subOffIdx] : null
  const bench = selectedOut ? getBench(selectedOut.squad.id) : []

  return (
    <div className="min-h-screen bg-[#F5F0E8]">
      {/* Header */}
      <div className="bg-[#1a1a1a] text-white px-4 py-3 flex items-center justify-between">
        <button onClick={onHome} className="text-[#C9A84C] font-black text-sm tracking-tight">0a7</button>
        <div className="text-center">
          <div className="text-xs font-black text-[#C9A84C] tracking-widest">INTERVALO</div>
          <div className="text-[10px] text-white/50">Fase de Grupos concluída</div>
        </div>
        <div className="text-xs font-bold text-white/50">{subsLeft} sub{subsLeft !== 1 ? 's' : ''}</div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">

        {/* Group stage summary */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="text-[10px] font-black text-[#888] tracking-widest mb-3">FASE DE GRUPOS</div>
          <div className="flex gap-4 mb-3">
            {[
              { v: `${wins}V`, c: 'text-green-600' },
              { v: `${draws}E`, c: 'text-yellow-600' },
              { v: `${losses}D`, c: 'text-red-600' },
              { v: `${gf}–${ga}`, c: 'text-[#1a1a1a]' },
            ].map(s => (
              <div key={s.v} className={`font-black text-xl ${s.c}`}>{s.v}</div>
            ))}
          </div>
          {groupMatches.map((m, i) => (
            <div key={i} className="flex items-center gap-2 py-1.5 border-t border-gray-100 text-sm">
              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${m.won ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {m.won ? 'V' : 'D'}
              </span>
              <span>{m.opponentFlag}</span>
              <span className="flex-1 font-bold text-[#1a1a1a]">{m.opponent}</span>
              <span className="font-black">{m.goalsFor}–{m.goalsAgainst}</span>
            </div>
          ))}
        </div>

        {/* Substitutions */}
        {subsLeft > 0 && (
          <div className="bg-[#FFF9E6] border border-[#C9A84C]/30 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[10px] font-black text-[#888] tracking-widest">SUBSTITUIÇÕES</div>
              <div className="flex gap-1">
                {[0,1,2].map(i => (
                  <div key={i} className={`w-5 h-5 rounded-full border-2 ${i < subsLeft ? 'border-[#C9A84C] bg-[#C9A84C]' : 'border-gray-300 bg-white'}`} />
                ))}
              </div>
            </div>
            <p className="text-[11px] text-[#888] mb-3">Toque num jogador para substituí-lo. Só troca pela mesma posição.</p>

            {/* Current lineup clickable */}
            <div className="space-y-1">
              {currentPicks.map((pick, i) => {
                const isOut = subOffIdx === i
                return (
                  <button
                    key={i}
                    onClick={() => handleSubOff(i)}
                    className={`w-full flex items-center gap-2 py-2 px-3 rounded-lg text-left transition-all ${
                      isOut
                        ? 'bg-[#D12E2E] text-white'
                        : 'bg-white hover:bg-gray-50 text-[#1a1a1a]'
                    }`}
                  >
                    <span className="text-[10px] font-black w-8 opacity-60">{pick.slot.label}</span>
                    <span className="text-sm">{pick.squad.flagEmoji}</span>
                    <span className="flex-1 font-bold text-sm truncate">{pick.player.name}</span>
                    {pick.player.isLegend && <span className="text-xs">⭐</span>}
                    <span className="text-[10px] text-[#888] font-bold">
                      {mode === 'almanac' ? '?' : pick.player.rating}
                    </span>
                    {isOut && <span className="text-xs font-black">↕</span>}
                  </button>
                )
              })}
            </div>

            {/* Bench options */}
            {selectedOut && (
              <div className="mt-3 border-t border-[#C9A84C]/30 pt-3">
                <div className="text-[10px] font-black text-[#888] tracking-widest mb-2">
                  RESERVAS DE {selectedOut.squad.countryNamePt.toUpperCase()} · ENTRA NO LUGAR DE {selectedOut.player.name.toUpperCase()}
                </div>
                {bench.length === 0 ? (
                  <p className="text-xs text-[#888] italic">Sem reservas disponíveis nessa seleção.</p>
                ) : (
                  <div className="space-y-1">
                    {bench.map(pl => {
                      const compatible = canPlayPosition(pl.primaryPosition, pl.secondaryPositions, selectedOut.slot.position)
                      return (
                        <button
                          key={pl.id}
                          onClick={() => compatible && handleSubOn(pl)}
                          disabled={!compatible}
                          className={`w-full flex items-center gap-2 py-2 px-3 rounded-lg text-left transition-all ${
                            compatible
                              ? 'bg-green-50 hover:bg-green-100 text-[#1a1a1a] cursor-pointer'
                              : 'bg-gray-50 text-gray-400 cursor-not-allowed opacity-50'
                          }`}
                        >
                          <span className="text-[10px] font-black w-8 opacity-60">
                            {pl.primaryPosition}{pl.secondaryPositions.length ? `/${pl.secondaryPositions[0]}` : ''}
                          </span>
                          <span className="flex-1 font-bold text-sm truncate">{pl.name}</span>
                          {pl.isLegend && <span className="text-xs">⭐</span>}
                          <span className="text-[10px] text-[#888] font-bold">
                            {mode === 'almanac' ? '?' : pl.rating}
                          </span>
                          {compatible && <span className="text-green-600 text-xs font-black">↵</span>}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tactics */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="text-[10px] font-black text-[#888] tracking-widest mb-3">TÁTICAS PARA AS OITAVAS</div>

          <div className="mb-3">
            <div className="text-[10px] text-[#888] mb-1.5">FORMAÇÃO</div>
            <div className="flex gap-1 flex-wrap">
              {Object.keys(FORMATIONS).map(f => (
                <button
                  key={f}
                  onClick={() => setCurrentFormation(FORMATIONS[f])}
                  className={`text-xs px-2.5 py-1 font-black rounded transition-colors ${
                    currentFormation.name === f
                      ? 'bg-[#1a1a1a] text-white'
                      : 'bg-gray-100 text-[#1a1a1a] hover:bg-gray-200'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[10px] text-[#888] mb-1.5">ESTILO</div>
            <div className="flex gap-1">
              {(['defensive', 'balanced', 'offensive'] as GameStyle[]).map(s => (
                <button
                  key={s}
                  onClick={() => setCurrentStyle(s)}
                  className={`text-xs px-3 py-1 font-black rounded transition-colors ${
                    currentStyle === s
                      ? 'bg-[#C9A84C] text-black'
                      : 'bg-gray-100 text-[#1a1a1a] hover:bg-gray-200'
                  }`}
                >
                  {STYLE_LABELS[s]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Continue button */}
        <div className="pb-8">
          <button
            onClick={() => onContinue(currentPicks, currentFormation, currentStyle)}
            className="w-full bg-[#D12E2E] text-white font-black py-4 rounded-xl text-sm tracking-widest hover:bg-[#b52626] transition-colors"
          >
            JOGAR 2° TEMPO — OITAVAS →
          </button>
        </div>
      </div>
    </div>
  )
}
