import { useState, useCallback } from 'react'
import { FORMATIONS, canPlayPosition } from '../data/formations'
import type { FormationSlot } from '../data/formations'
import type { Player } from '../data/squads'
import { generateSeed, rollSquad, computeOverall, simulateCopa } from '../engine/game'
import type { GameState, PickedPlayer, GameMode, GameStyle } from '../engine/game'
import Field from './Field'
import PlayerList from './PlayerList'
import SimulationScreen from './SimulationScreen'
import ResultScreen from './ResultScreen'

interface Props { onHome: () => void }

function initState(): GameState {
  const seed = generateSeed()
  return {
    seed,
    formation: FORMATIONS['4-3-3'],
    mode: 'classic',
    style: 'balanced',
    picks: [],
    currentRoll: null,
    phase: 'setup',
    matches: [],
    eliminated: false,
    overall: 0,
  }
}

export default function GameScreen({ onHome }: Props) {
  const [state, setState] = useState<GameState>(initState)
  const [rollIndex, setRollIndex] = useState(0)
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [diceAnim, setDiceAnim] = useState(false)
  const [rerollCount, setRerollCount] = useState(0)

  const roll = useCallback((overrideSeed?: string, overrideIndex?: number) => {
    const usedSeed = overrideSeed ?? state.seed
    const usedIdx = overrideIndex ?? rollIndex
    setDiceAnim(true)
    setTimeout(() => setDiceAnim(false), 650)
    const squad = rollSquad(usedSeed, usedIdx, state.picks.map(p => p.squad.id))
    setState(s => ({ ...s, currentRoll: { squad, rerollsLeft: rerollCount === 0 ? 1 : 0 }, phase: 'picking' }))
    setRollIndex(i => i + 1)
    setSelectedPlayer(null)
    setRerollCount(0)
  }, [state.seed, state.picks, rollIndex, rerollCount])

  const reroll = (type: 'squad' | 'copa') => {
    if (!state.currentRoll || state.currentRoll.rerollsLeft <= 0) return
    const newIdx = rollIndex + 10 + (type === 'copa' ? 5 : 0)
    const squad = rollSquad(state.seed, newIdx, state.picks.map(p => p.squad.id))
    setState(s => ({ ...s, currentRoll: { squad, rerollsLeft: 0 } }))
    setRollIndex(newIdx + 1)
    setSelectedPlayer(null)
    setRerollCount(1)
  }

  const pickPlayer = (player: Player) => setSelectedPlayer(p => p?.id === player.id ? null : player)

  const placePlayer = (slot: FormationSlot, slotIndex: number) => {
    if (!selectedPlayer || !state.currentRoll) return
    const pick: PickedPlayer = {
      player: selectedPlayer,
      squad: state.currentRoll.squad,
      slot,
      slotIndex,
    }
    const newPicks = [...state.picks, pick]
    const overall = computeOverall(newPicks, state.style)
    if (newPicks.length === 11) {
      setState(s => ({ ...s, picks: newPicks, overall, currentRoll: null, phase: 'simulating' }))
    } else {
      setState(s => ({ ...s, picks: newPicks, overall, currentRoll: null, phase: 'rolling' }))
    }
    setSelectedPlayer(null)
  }

  const startSimulation = () => {
    const results = simulateCopa(state)
    const lastMatch = results[results.length - 1]
    setState(s => ({ ...s, matches: results, eliminated: !lastMatch.won || lastMatch.phase !== 'Final', phase: 'results' }))
  }

  const restart = () => {
    setState(initState())
    setRollIndex(0)
    setSelectedPlayer(null)
    setDiceAnim(false)
    setRerollCount(0)
  }

  if (state.phase === 'simulating') {
    return <SimulationScreen state={state} onSimulate={startSimulation} onHome={onHome} />
  }
  if (state.phase === 'results') {
    return <ResultScreen state={state} onReplay={restart} onHome={onHome} />
  }

  const emptySlots = state.formation.slots
    .map((slot, i) => ({ slot, i }))
    .filter(({ i }) => !state.picks.find(p => p.slotIndex === i))

  const availableSlots = selectedPlayer
    ? emptySlots.filter(({ slot }) => canPlayPosition(selectedPlayer.primaryPosition, selectedPlayer.secondaryPositions, slot.position))
    : []

  return (
    <div className="min-h-screen bg-[#F5F0E8]">
      {/* Top bar */}
      <div className="bg-[#1a1a1a] text-white px-4 py-2 flex items-center justify-between text-xs font-bold tracking-widest">
        <button onClick={onHome} className="text-[#C9A84C] hover:text-white transition-colors">← LENDAS DA COPA</button>
        <span>SEED #{state.seed}</span>
        <span className="text-[#C9A84C]">{state.picks.length}/11</span>
      </div>

      {/* Config bar (visible only at setup) */}
      {state.phase === 'setup' && (
        <div className="bg-[#1a1a1a] border-t border-white/10 px-4 py-3 flex flex-wrap gap-4 items-center justify-center">
          {/* Formation */}
          <div className="flex gap-1 flex-wrap justify-center">
            {Object.keys(FORMATIONS).map(f => (
              <button
                key={f}
                onClick={() => setState(s => ({ ...s, formation: FORMATIONS[f] }))}
                className={`text-xs px-2 py-1 font-bold rounded transition-colors ${state.formation.name === f ? 'bg-[#D12E2E] text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}
              >
                {f}
              </button>
            ))}
          </div>
          {/* Mode */}
          <div className="flex gap-1">
            {(['classic', 'almanac'] as GameMode[]).map(m => (
              <button
                key={m}
                onClick={() => setState(s => ({ ...s, mode: m }))}
                className={`text-xs px-3 py-1 font-bold rounded transition-colors ${state.mode === m ? 'bg-[#C9A84C] text-black' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}
              >
                {m === 'classic' ? 'CLÁSSICO' : 'ALMANAQUE'}
              </button>
            ))}
          </div>
          {/* Style */}
          <div className="flex gap-1">
            {(['defensive', 'balanced', 'offensive'] as GameStyle[]).map(s => (
              <button
                key={s}
                onClick={() => setState(st => ({ ...st, style: s }))}
                className={`text-xs px-3 py-1 font-bold rounded transition-colors ${state.style === s ? 'bg-[#C9A84C] text-black' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}
              >
                {s === 'defensive' ? 'DEF' : s === 'balanced' ? 'EQU' : 'OFE'}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-4 flex flex-col md:flex-row gap-4">
        {/* Left: field + controls */}
        <div className="w-full md:w-56 flex-shrink-0 flex flex-col gap-3">
          <Field
            formation={state.formation}
            picks={state.picks}
            selectedPlayer={selectedPlayer}
            onSlotClick={placePlayer}
          />

          {/* Box score */}
          <div className="bg-white rounded-lg p-3 text-xs">
            <div className="font-black text-[#1a1a1a] mb-2 tracking-widest">BOX SCORE · {state.picks.length}/11</div>
            <div className="flex gap-2 mb-2">
              <div className="flex-1 text-center">
                <div className="text-lg font-black text-[#D12E2E]">{state.overall || '?'}</div>
                <div className="text-[#888] text-[10px]">OVERALL</div>
              </div>
            </div>
            {state.formation.slots.map((slot, i) => {
              const pick = state.picks.find(p => p.slotIndex === i)
              return (
                <div key={i} className="flex justify-between py-0.5 border-b border-gray-100 last:border-0">
                  <span className="text-[#888] w-8">{slot.label}</span>
                  <span className="text-[#1a1a1a] font-medium truncate max-w-20">{pick ? pick.player.name : '—'}</span>
                  {pick && <span className="text-[#888]">{state.mode === 'almanac' ? '?' : pick.player.rating}</span>}
                </div>
              )
            })}
          </div>
        </div>

        {/* Right: roll / players */}
        <div className="flex-1">
          {(state.phase === 'setup' || state.phase === 'rolling') && !state.currentRoll && (
            <div className="flex flex-col items-center justify-center h-64 gap-6">
              <p className="text-[#888] text-center text-sm font-medium">
                {state.picks.length === 0
                  ? 'Role o dado para sortear uma seleção histórica e uma Copa do Mundo'
                  : `${11 - state.picks.length} posições restantes — role o dado!`}
              </p>
              <button
                onClick={() => roll()}
                className={`bg-[#D12E2E] text-white font-black text-2xl px-10 py-6 rounded-xl hover:bg-[#b52626] transition-all shadow-lg hover:shadow-xl ${diceAnim ? 'animate-spin-dice' : ''}`}
              >
                🎲 ROLAR
              </button>
            </div>
          )}

          {state.currentRoll && (
            <div className="animate-slide-up">
              {/* Sorteio banner */}
              <div className="bg-[#1a1a1a] text-white rounded-xl p-4 mb-4 flex items-center justify-between">
                <div>
                  <div className="text-[#888] text-xs tracking-widest mb-1">SAIU</div>
                  <div className="text-2xl font-black flex items-center gap-2">
                    {state.currentRoll.squad.flagEmoji} {state.currentRoll.squad.countryNamePt}
                  </div>
                  <div className="text-[#C9A84C] font-bold">Copa {state.currentRoll.squad.year}</div>
                  <div className="text-[#888] text-xs mt-1 italic">{state.currentRoll.squad.notableReason}</div>
                </div>
                {state.currentRoll.rerollsLeft > 0 && (
                  <div className="flex flex-col gap-1">
                    <button onClick={() => reroll('squad')} className="text-xs bg-white/10 hover:bg-white/20 text-white px-2 py-1 rounded font-bold transition-colors">↺ Outra seleção</button>
                    <button onClick={() => reroll('copa')} className="text-xs bg-white/10 hover:bg-white/20 text-white px-2 py-1 rounded font-bold transition-colors">↺ Outra Copa</button>
                  </div>
                )}
              </div>

              {/* Player list */}
              <div className="text-xs font-black text-[#888] tracking-widest mb-2">ESCOLHA UM JOGADOR</div>
              <PlayerList
                squad={state.currentRoll.squad}
                mode={state.mode}
                selectedPlayer={selectedPlayer}
                pickedIds={state.picks.map(p => p.player.id)}
                onSelect={pickPlayer}
                availableSlots={availableSlots.map(s => s.slot.position)}
              />

              {selectedPlayer && availableSlots.length > 0 && (
                <div className="mt-3 bg-[#D12E2E] text-white text-sm font-bold text-center py-2 rounded-lg animate-bounce-in">
                  ← Clique numa posição no campo para escalar {selectedPlayer.name}
                </div>
              )}
              {selectedPlayer && availableSlots.length === 0 && (
                <div className="mt-3 bg-[#888] text-white text-sm font-bold text-center py-2 rounded-lg">
                  Nenhuma posição compatível disponível para {selectedPlayer.name}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
