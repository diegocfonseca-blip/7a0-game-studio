import { useState, useCallback } from 'react'
import { FORMATIONS, canPlayPosition } from '../data/formations'
import type { Formation, FormationSlot } from '../data/formations'
import type { Player, Squad } from '../data/squads'
import squads from '../data/squads'
import clubs from '../data/clubs'
import { generateSeed, rollSquad, computeOverall, computeAtaque, computeDefesa, simulateCopa, simulateGroupStage, simulateKnockouts } from '../engine/game'
import type { GameState, PickedPlayer, GameMode, GameStyle, MatchResult } from '../engine/game'
import type { GameCategory } from '../App'
import Field from './Field'
import PlayerList from './PlayerList'
import SimulationScreen from './SimulationScreen'
import NarrationScreen from './NarrationScreen'
import HalftimeScreen from './HalftimeScreen'
import ResultScreen from './ResultScreen'

interface Props { category: GameCategory; onHome: () => void }

function initState(): GameState {
  const seed = generateSeed()
  return {
    seed,
    formation: FORMATIONS['4-2-3-1'],
    mode: 'almanac',
    style: 'offensive',
    picks: [],
    currentRoll: null,
    phase: 'setup',
    matches: [],
    eliminated: false,
    overall: 0,
    subsUsed: 0,
  }
}

const STYLE_LABELS: Record<GameStyle, string> = {
  defensive: 'DEFENSIVO',
  balanced: 'EQUILIBRADO',
  offensive: 'OFENSIVO',
}

const STYLE_SHORT: Record<GameStyle, string> = {
  defensive: 'DEF',
  balanced: 'EQU',
  offensive: 'OFE',
}

const MODE_LABELS: Record<GameMode, string> = {
  classic: 'CLÁSSICO',
  almanac: 'DE ALMANAQUE',
}

const MODE_SHORT: Record<GameMode, string> = {
  classic: 'CLÁ',
  almanac: 'ALM',
}

export default function GameScreen({ category, onHome }: Props) {
  const pool: Squad[] = category === 'clubs' ? clubs : squads
  const [state, setState] = useState<GameState>(initState)
  const [rollIndex, setRollIndex] = useState(0)
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [diceAnim, setDiceAnim] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [narrating, setNarrating] = useState(false)
  const [groupMatches, setGroupMatches] = useState<MatchResult[]>([])

  const roll = useCallback(() => {
    setDiceAnim(true)
    setShowSettings(false)
    setTimeout(() => setDiceAnim(false), 650)
    const squad = rollSquad(state.seed, rollIndex, state.picks.map(p => p.squad.id), pool)
    setState(s => ({ ...s, currentRoll: { squad, rerollsLeft: 3 }, phase: 'picking' }))
    setRollIndex(i => i + 1)
    setSelectedPlayer(null)
  }, [state.seed, state.picks, rollIndex])

  const reroll = (type: 'squad' | 'copa') => {
    if (!state.currentRoll || state.currentRoll.rerollsLeft <= 0) return
    const newIdx = rollIndex + 10 + (type === 'copa' ? 5 : 0)
    const squad = rollSquad(state.seed, newIdx, state.picks.map(p => p.squad.id), pool)
    setState(s => ({ ...s, currentRoll: { squad, rerollsLeft: (s.currentRoll?.rerollsLeft ?? 1) - 1 } }))
    setRollIndex(newIdx + 1)
    setSelectedPlayer(null)
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

  const toResults = (results: MatchResult[]) => {
    const lastMatch = results[results.length - 1]
    const eliminated = !lastMatch || !lastMatch.won || lastMatch.phase !== 'Final'
    setState(s => ({ ...s, matches: results, eliminated, phase: 'results' }))
  }

  const startSimulation = () => {
    // Run group stage first → if passed → halftime → knockouts
    const groups = simulateGroupStage(state)
    const groupLosses = groups.filter(m => !m.won && m.phase === 'Grupos').length
    if (groupLosses >= 2) {
      // Eliminated in groups — skip halftime
      toResults(groups)
    } else {
      setGroupMatches(groups)
      setState(s => ({ ...s, phase: 'halftime' }))
    }
  }

  const startNarration = () => {
    const results = simulateCopa(state)
    const lastMatch = results[results.length - 1]
    const eliminated = !lastMatch || !lastMatch.won || lastMatch.phase !== 'Final'
    setState(s => ({ ...s, matches: results, eliminated, phase: 'results' }))
    setNarrating(true)
  }

  const afterHalftime = (newPicks: PickedPlayer[], newFormation: Formation, newStyle: GameStyle) => {
    // Apply subs/tactics then simulate knockouts
    const updatedState = { ...state, picks: newPicks, formation: newFormation, style: newStyle }
    const knockouts = simulateKnockouts(updatedState, groupMatches)
    const allMatches = [...groupMatches, ...knockouts]
    setState(s => ({
      ...s,
      picks: newPicks,
      formation: newFormation,
      style: newStyle,
      overall: computeOverall(newPicks, newStyle),
    }))
    toResults(allMatches)
  }

  const restart = () => {
    setState(initState())
    setRollIndex(0)
    setSelectedPlayer(null)
    setDiceAnim(false)
    setShowSettings(false)
    setNarrating(false)
    setGroupMatches([])
  }

  if (state.phase === 'simulating') {
    return <SimulationScreen state={state} onSimulate={startSimulation} onNarrate={startNarration} onHome={onHome} />
  }
  if (state.phase === 'halftime') {
    return (
      <HalftimeScreen
        picks={state.picks}
        groupMatches={groupMatches}
        formation={state.formation}
        style={state.style}
        mode={state.mode}
        onContinue={afterHalftime}
        onHome={onHome}
      />
    )
  }
  if (state.phase === 'results' && narrating) {
    return <NarrationScreen state={state} matches={state.matches} onFinish={() => setNarrating(false)} />
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

  const ataque = computeAtaque(state.picks)
  const defesa = computeDefesa(state.picks)

  const canRoll = !state.currentRoll && (state.phase === 'setup' || state.phase === 'rolling')

  return (
    <div className="game-shell min-h-screen bg-[#F5F0E8]">
      {/* Top bar */}
      <div className="bg-[#1a1a1a] text-white px-4 py-2 flex items-center justify-between text-xs font-bold tracking-widest">
        <button onClick={onHome} className="text-[#C9A84C] hover:text-white transition-colors font-black tracking-tight">0a7</button>
        <div className="text-[10px] text-white/60 tracking-wider whitespace-nowrap">
          {state.formation.name} · {STYLE_SHORT[state.style]} · {MODE_SHORT[state.mode]}
        </div>
        <button
          onClick={() => setShowSettings(s => !s)}
          className="text-white/70 hover:text-white transition-colors"
        >
          AJUSTES {showSettings ? '▴' : '▾'}
        </button>
      </div>

      {/* Settings dropdown */}
      {showSettings && (
        <div className="bg-[#222] text-white px-4 py-4 flex flex-col gap-4">
          {/* Formation */}
          <div>
            <div className="text-[10px] text-white/40 tracking-widest mb-2">FORMAÇÃO</div>
            <div className="flex gap-1 flex-wrap">
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
          </div>
          {/* Style */}
          <div>
            <div className="text-[10px] text-white/40 tracking-widest mb-2">ESTILO</div>
            <div className="flex gap-1">
              {(['defensive', 'balanced', 'offensive'] as GameStyle[]).map(s => (
                <button
                  key={s}
                  onClick={() => setState(st => ({ ...st, style: s }))}
                  className={`text-xs px-3 py-1 font-bold rounded transition-colors ${state.style === s ? 'bg-[#C9A84C] text-black' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}
                >
                  {STYLE_LABELS[s]}
                </button>
              ))}
            </div>
          </div>
          {/* Mode */}
          <div>
            <div className="text-[10px] text-white/40 tracking-widest mb-2">MODO · DIFICULDADE</div>
            <div className="flex gap-1">
              {(['classic', 'almanac'] as GameMode[]).map(m => (
                <button
                  key={m}
                  onClick={() => setState(s => ({ ...s, mode: m }))}
                  className={`text-xs px-3 py-1 font-bold rounded transition-colors ${state.mode === m ? 'bg-[#C9A84C] text-black' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}
                >
                  {MODE_LABELS[m]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="game-layout max-w-4xl mx-auto px-4 py-4 flex flex-col md:flex-row gap-4">
        {/* Left: field + box score */}
        <div className="game-side w-full md:w-56 flex-shrink-0 flex flex-col gap-3">
          <Field
            formation={state.formation}
            picks={state.picks}
            selectedPlayer={selectedPlayer}
            onSlotClick={placePlayer}
          />

          {/* BOX SCORE */}
          <div className="bg-white rounded-lg p-3 text-xs shadow-sm">
            <div className="font-black text-[#1a1a1a] mb-2 tracking-widest text-[10px]">BOX SCORE · {state.picks.length}/11</div>
            <div className="grid grid-cols-2 mb-3 border border-gray-100 rounded-lg overflow-hidden">
              <div className="text-center py-2 border-r border-gray-100">
                <div className="text-2xl font-black text-[#1a1a1a] leading-none">{ataque ?? '?'}</div>
                <div className="text-[#888] text-[9px] tracking-widest mt-0.5">ATAQUE</div>
              </div>
              <div className="text-center py-2">
                <div className="text-2xl font-black text-[#1a1a1a] leading-none">{defesa ?? '?'}</div>
                <div className="text-[#888] text-[9px] tracking-widest mt-0.5">DEFESA</div>
              </div>
            </div>
            {state.formation.slots.map((slot, i) => {
              const pick = state.picks.find(p => p.slotIndex === i)
              return (
                <div key={i} className="flex items-center gap-1 py-0.5 border-b border-gray-100 last:border-0">
                  <span className="text-[#888] w-7 text-[10px] font-bold">{slot.label}</span>
                  <span className="text-[#1a1a1a] font-medium truncate flex-1 text-[10px]">{pick ? pick.player.name : '—'}</span>
                  {pick && <span className="text-[#888] text-[10px]">{state.mode === 'almanac' ? '?' : pick.player.rating}</span>}
                </div>
              )
            })}
          </div>
        </div>

        {/* Right: roll / players */}
        <div className="game-main flex-1">
          {canRoll && (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <p className="text-[#888] text-center text-sm font-medium">
                {state.picks.length === 0
                  ? 'Role para sortear uma seleção e uma Copa do Mundo'
                  : `${11 - state.picks.length} posições restantes — role o dado!`}
              </p>
              <button
                onClick={roll}
                className={`bg-[#1a1a1a] text-white font-black text-2xl w-28 h-28 rounded-2xl hover:bg-[#333] transition-all shadow-lg flex flex-col items-center justify-center gap-1 ${diceAnim ? 'scale-95' : ''}`}
              >
                <span className="text-3xl">🎲</span>
                <span className="text-sm tracking-widest">ROLAR</span>
              </button>
            </div>
          )}

          {state.currentRoll && (
            <div className="animate-slide-up">
              {/* Sorteio banner */}
              <div className="bg-[#1a1a1a] text-white rounded-xl p-4 mb-3">
                <div className="text-[#888] text-[9px] tracking-[0.2em] font-black mb-2">SAIU</div>
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{state.currentRoll.squad.flagEmoji}</span>
                  <div>
                    <div className="text-2xl font-black leading-tight">
                      {state.currentRoll.squad.clubName ?? state.currentRoll.squad.countryNamePt}
                    </div>
                    <div className="text-[#C9A84C] font-bold text-sm">
                      {state.currentRoll.squad.trophy ?? `Copa ${state.currentRoll.squad.year}`}
                    </div>
                  </div>
                </div>
                {state.currentRoll.squad.notableReason && (
                  <div className="text-white/40 text-[10px] mt-2 italic leading-tight">{state.currentRoll.squad.notableReason}</div>
                )}
              </div>

              {/* Re-roll */}
              {state.currentRoll.rerollsLeft > 0 && (
                <div className="mb-3">
                  <div className="text-[10px] font-black text-[#888] tracking-widest mb-1.5">
                    NÃO CURTIU? RE-SORTEIE · {state.currentRoll.rerollsLeft} {state.currentRoll.rerollsLeft === 1 ? 'RESTANTE' : 'RESTANTES'}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => reroll('squad')}
                      className="flex-1 bg-white border border-gray-200 text-[#1a1a1a] font-black text-xs py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      ↺ OUTRA SELEÇÃO
                    </button>
                    <button
                      onClick={() => reroll('copa')}
                      className="flex-1 bg-white border border-gray-200 text-[#1a1a1a] font-black text-xs py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      ↺ OUTRA COPA
                    </button>
                  </div>
                </div>
              )}

              {/* Player list */}
              <div className="text-[10px] font-black text-[#888] tracking-widest mb-2">ESCOLHA UM JOGADOR</div>
              <PlayerList
                squad={state.currentRoll.squad}
                mode={state.mode}
                selectedPlayer={selectedPlayer}
                pickedIds={state.picks.map(p => p.player.id)}
                onSelect={pickPlayer}
                availableSlots={availableSlots.map(s => s.slot.position)}
              />

              {selectedPlayer && availableSlots.length > 0 && (
                <div className="mt-3 bg-[#D12E2E] text-white text-xs font-black text-center py-2 rounded-lg">
                  CLIQUE NO CAMPO PARA ESCALAR {selectedPlayer.name.toUpperCase()}
                </div>
              )}
              {selectedPlayer && availableSlots.length === 0 && (
                <div className="mt-3 bg-[#888] text-white text-xs font-black text-center py-2 rounded-lg">
                  SEM POSIÇÃO COMPATÍVEL PARA {selectedPlayer.name.toUpperCase()}
                </div>
              )}
            </div>
          )}

          {/* After placing a player, hint to tap for position change */}
          {!state.currentRoll && state.picks.length > 0 && state.phase === 'rolling' && (
            <div className="text-center text-[#888] text-xs mt-4">
              Toque num jogador pra mudar de posição
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
