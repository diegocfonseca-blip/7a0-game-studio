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

export default function GameScreen({ category, onHome }: Props) {
  const pool: Squad[] = category === 'clubs' ? clubs : squads
  const [state, setState] = useState<GameState>(initState)
  const [rollIndex, setRollIndex] = useState(0)
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [diceAnim, setDiceAnim] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showField, setShowField] = useState(false)
  const [narrating, setNarrating] = useState(false)
  const [groupMatches, setGroupMatches] = useState<MatchResult[]>([])
  const [halftimePrompt, setHalftimePrompt] = useState(false)

  const roll = useCallback(() => {
    setDiceAnim(true)
    setShowSettings(false)
    setTimeout(() => setDiceAnim(false), 400)
    const squad = rollSquad(state.seed, rollIndex, state.picks.map(p => p.squad.id), pool)
    setState(s => ({ ...s, currentRoll: { squad, rerollsLeft: 3 }, phase: 'picking' }))
    setRollIndex(i => i + 1)
    setSelectedPlayer(null)
  }, [state.seed, state.picks, rollIndex, pool])

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
    const pick: PickedPlayer = { player: selectedPlayer, squad: state.currentRoll.squad, slot, slotIndex }
    const newPicks = [...state.picks, pick]
    const overall = computeOverall(newPicks, state.style)
    if (newPicks.length === 11) {
      setState(s => ({ ...s, picks: newPicks, overall, currentRoll: null, phase: 'simulating' }))
    } else {
      setState(s => ({ ...s, picks: newPicks, overall, currentRoll: null, phase: 'rolling' }))
    }
    setSelectedPlayer(null)
    setShowField(false)
  }

  const toResults = (results: MatchResult[]) => {
    const lastMatch = results[results.length - 1]
    const eliminated = !lastMatch || !lastMatch.won || lastMatch.phase !== 'Final'
    setState(s => ({ ...s, matches: results, eliminated, phase: 'results' }))
  }

  const startSimulation = () => {
    const groups = simulateGroupStage(state)
    const groupLosses = groups.filter(m => !m.won && m.phase === 'Grupos').length
    if (groupLosses >= 2) {
      toResults(groups)
    } else {
      setGroupMatches(groups)
      setHalftimePrompt(true)
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
    const updatedState = { ...state, picks: newPicks, formation: newFormation, style: newStyle }
    const knockouts = simulateKnockouts(updatedState, groupMatches)
    const allMatches = [...groupMatches, ...knockouts]
    setState(s => ({ ...s, picks: newPicks, formation: newFormation, style: newStyle, overall: computeOverall(newPicks, newStyle) }))
    toResults(allMatches)
  }

  const restart = () => {
    setState(initState())
    setRollIndex(0)
    setSelectedPlayer(null)
    setDiceAnim(false)
    setShowSettings(false)
    setShowField(false)
    setNarrating(false)
    setGroupMatches([])
    setHalftimePrompt(false)
  }

  if (state.phase === 'simulating') {
    return <SimulationScreen state={state} onSimulate={startSimulation} onNarrate={startNarration} onHome={onHome} />
  }
  if (halftimePrompt) {
    const gf = groupMatches.reduce((s, m) => s + m.goalsFor, 0)
    const ga = groupMatches.reduce((s, m) => s + m.goalsAgainst, 0)
    const wins = groupMatches.filter(m => m.won).length
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex flex-col items-center justify-center px-6">
        <div className="text-[#C9A84C] text-4xl mb-4">⚽</div>
        <h2 className="text-white font-black text-2xl tracking-wider mb-1">INTERVALO</h2>
        <p className="text-white/50 text-sm mb-6">Fase de Grupos concluída</p>
        <div className="bg-white/10 rounded-2xl px-6 py-4 mb-8 text-center w-full max-w-xs">
          <p className="text-white/40 text-[10px] tracking-widest mb-2">SUA CAMPANHA NA FASE DE GRUPOS</p>
          <div className="flex justify-center gap-6 mb-3">
            <div className="text-center"><div className="text-green-400 font-black text-2xl">{wins}V</div><div className="text-white/30 text-[9px]">VITÓRIAS</div></div>
            <div className="text-center"><div className="text-[#C9A84C] font-black text-2xl">{gf}</div><div className="text-white/30 text-[9px]">GOLS</div></div>
            <div className="text-center"><div className="text-[#888] font-black text-2xl">{ga}</div><div className="text-white/30 text-[9px]">SOFRIDOS</div></div>
          </div>
          {groupMatches.map((m, i) => (
            <div key={i} className="flex items-center justify-between text-xs py-1 border-t border-white/10">
              <span className={`font-black text-[10px] ${m.won ? 'text-green-400' : 'text-red-400'}`}>{m.won ? 'V' : 'D'}</span>
              <span className="text-white/60">{m.opponentFlag} {m.opponent}</span>
              <span className="text-white font-black">{m.goalsFor}–{m.goalsAgainst}</span>
            </div>
          ))}
        </div>
        <p className="text-white font-black text-base mb-6">Quer fazer substituições?</p>
        <div className="flex gap-3 w-full max-w-xs">
          <button
            onClick={() => { setHalftimePrompt(false); setState(s => ({ ...s, phase: 'halftime' })) }}
            className="flex-1 bg-[#C9A84C] text-[#1a1a1a] font-black py-4 rounded-2xl text-sm hover:bg-[#b8943d] transition-colors"
          >
            ✅ SIM
          </button>
          <button
            onClick={() => { setHalftimePrompt(false); afterHalftime(state.picks, state.formation, state.style) }}
            className="flex-1 bg-white/10 text-white font-black py-4 rounded-2xl text-sm hover:bg-white/20 transition-colors"
          >
            ❌ NÃO
          </button>
        </div>
      </div>
    )
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
  const filled = state.picks.length

  return (
    <div className="min-h-screen bg-[#F5F0E8] flex flex-col">

      {/* Top bar */}
      <div className="bg-[#1a1a1a] text-white px-4 py-3 flex items-center justify-between flex-shrink-0">
        <button onClick={onHome} className="text-[#C9A84C] font-black text-base tracking-tight">0a7</button>
        <div className="flex items-center gap-2">
          {/* Progress pills */}
          <div className="flex gap-0.5">
            {Array.from({ length: 11 }).map((_, i) => (
              <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < filled ? 'bg-[#C9A84C]' : 'bg-white/20'}`} />
            ))}
          </div>
          <span className="text-[10px] text-white/50 font-bold">{filled}/11</span>
        </div>
        <button
          onClick={() => setShowSettings(s => !s)}
          className="text-white/60 hover:text-white text-[10px] font-black tracking-widest transition-colors"
        >
          ⚙ AJUSTES
        </button>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="bg-[#1e1e1e] text-white px-4 py-4 flex flex-col gap-3 flex-shrink-0">
          <div>
            <div className="text-[9px] text-white/40 tracking-widest mb-1.5">FORMAÇÃO</div>
            <div className="flex gap-1 flex-wrap">
              {Object.keys(FORMATIONS).map(f => (
                <button
                  key={f}
                  onClick={() => setState(s => ({ ...s, formation: FORMATIONS[f] }))}
                  className={`text-[10px] px-2.5 py-1 font-black rounded-lg transition-colors ${state.formation.name === f ? 'bg-[#D12E2E] text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[9px] text-white/40 tracking-widest mb-1.5">ESTILO</div>
            <div className="flex gap-1">
              {(['defensive', 'balanced', 'offensive'] as GameStyle[]).map(s => (
                <button
                  key={s}
                  onClick={() => setState(st => ({ ...st, style: s }))}
                  className={`text-[10px] px-3 py-1 font-black rounded-lg transition-colors ${state.style === s ? 'bg-[#C9A84C] text-black' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}
                >
                  {STYLE_LABELS[s]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Stats strip (only when has picks) */}
      {filled > 0 && (
        <div className="bg-white border-b border-gray-100 px-4 py-2 flex items-center gap-4 flex-shrink-0">
          <div className="flex gap-3 flex-1">
            <div className="text-center">
              <div className="text-lg font-black text-[#1a1a1a] leading-none">{state.overall}</div>
              <div className="text-[8px] text-[#aaa] tracking-widest">OVR</div>
            </div>
            {ataque !== null && (
              <div className="text-center">
                <div className="text-lg font-black text-[#D12E2E] leading-none">{ataque}</div>
                <div className="text-[8px] text-[#aaa] tracking-widest">ATK</div>
              </div>
            )}
            {defesa !== null && (
              <div className="text-center">
                <div className="text-lg font-black text-[#1a1a1a] leading-none">{defesa}</div>
                <div className="text-[8px] text-[#aaa] tracking-widest">DEF</div>
              </div>
            )}
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-[9px] text-[#888] font-bold">{state.formation.name} · {state.style === 'offensive' ? 'OFE' : state.style === 'defensive' ? 'DEF' : 'EQU'}</span>
            <button
              onClick={() => setShowField(f => !f)}
              className="text-[9px] font-black bg-[#1a1a1a] text-white px-2 py-1 rounded-lg"
            >
              {showField ? 'LISTA' : 'CAMPO'}
            </button>
          </div>
        </div>
      )}

      {/* Field (toggle) */}
      {showField && filled > 0 && (
        <div className="flex-shrink-0 bg-white border-b border-gray-100 px-4 py-3">
          <Field
            formation={state.formation}
            picks={state.picks}
            selectedPlayer={selectedPlayer}
            onSlotClick={placePlayer}
          />
        </div>
      )}

      {/* Main scrollable area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">

        {/* ── ROLL STATE ── */}
        {canRoll && (
          <div className="flex flex-col items-center pt-6 gap-5">
            <div className="text-center">
              <p className="text-[#888] text-sm font-bold mb-1">
                {filled === 0 ? 'Role o dado para sortear seu time' : `${11 - filled} posição${11 - filled > 1 ? 'ões' : ''} restante${11 - filled > 1 ? 's' : ''}`}
              </p>
              <p className="text-[10px] text-[#bbb]">Você escolhe um jogador por sorteio</p>
            </div>

            <button
              onClick={roll}
              className={`bg-[#1a1a1a] text-white w-32 h-32 rounded-3xl flex flex-col items-center justify-center gap-2 shadow-xl hover:bg-[#2a2a2a] active:scale-95 transition-all ${diceAnim ? 'scale-90' : ''}`}
            >
              <span className="text-4xl">{diceAnim ? '🎰' : '🎲'}</span>
              <span className="text-xs font-black tracking-widest">ROLAR</span>
            </button>

            {/* Picked so far (compact) */}
            {filled > 0 && (
              <div className="w-full bg-white rounded-2xl p-3 shadow-sm">
                <p className="text-[9px] font-black text-[#888] tracking-widest mb-2">TIME ATUAL</p>
                <div className="grid grid-cols-2 gap-x-4">
                  {state.picks.map((pick, i) => (
                    <div key={i} className="flex items-center gap-1.5 py-1 border-b border-gray-50 last:border-0">
                      <span className="text-[9px] text-[#ccc] w-6 font-black">{pick.slot.label}</span>
                      <span className="text-xs">{pick.squad.flagEmoji}</span>
                      <span className="font-bold text-[11px] text-[#1a1a1a] truncate flex-1">{pick.player.name.split(' ').pop()}</span>
                      {pick.player.isLegend && <span className="text-[9px]">⭐</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── PICK STATE ── */}
        {state.currentRoll && (
          <div className="flex flex-col gap-3">
            {/* Sorteio banner */}
            <div className="bg-[#1a1a1a] text-white rounded-2xl p-4">
              <div className="text-[9px] text-[#C9A84C] tracking-[0.2em] font-black mb-2">🎲 SORTEIO</div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-4xl">{state.currentRoll.squad.flagEmoji}</span>
                <div>
                  <div className="text-xl font-black leading-tight">
                    {state.currentRoll.squad.clubName ?? state.currentRoll.squad.countryNamePt}
                  </div>
                  <div className="text-[#C9A84C] font-bold text-sm">
                    {state.currentRoll.squad.trophy ?? `Copa ${state.currentRoll.squad.year}`}
                  </div>
                </div>
              </div>
              {state.currentRoll.squad.notableReason && (
                <p className="text-white/40 text-[10px] italic leading-tight">{state.currentRoll.squad.notableReason}</p>
              )}
            </div>

            {/* Reroll */}
            {state.currentRoll.rerollsLeft > 0 && (
              <div className="bg-white rounded-2xl p-3 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] font-black text-[#888] tracking-widest">NÃO CURTIU?</span>
                  <div className="flex gap-1">
                    {[0,1,2].map(i => (
                      <div key={i} className={`w-2 h-2 rounded-full ${i < state.currentRoll!.rerollsLeft ? 'bg-[#C9A84C]' : 'bg-gray-200'}`} />
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => reroll('squad')}
                    className="flex-1 bg-[#F5F0E8] text-[#1a1a1a] font-black text-[11px] py-2.5 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    ↺ OUTRO TIME
                  </button>
                  <button
                    onClick={() => reroll('copa')}
                    className="flex-1 bg-[#F5F0E8] text-[#1a1a1a] font-black text-[11px] py-2.5 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    ↺ OUTRA COPA
                  </button>
                </div>
              </div>
            )}

            {/* Field slot prompt (if player selected) */}
            {selectedPlayer && !showField && (
              <div className="bg-[#D12E2E] text-white rounded-2xl p-3 text-center">
                <p className="font-black text-sm">{selectedPlayer.name}</p>
                <p className="text-[11px] text-white/70 mt-1">Escolha a posição no campo para escalar</p>
                <button
                  onClick={() => setShowField(true)}
                  className="mt-2 bg-white text-[#D12E2E] font-black text-[11px] px-4 py-1.5 rounded-full"
                >
                  VER CAMPO →
                </button>
              </div>
            )}
            {selectedPlayer && showField && availableSlots.length === 0 && (
              <div className="bg-[#888] text-white rounded-2xl p-3 text-center text-[11px] font-black">
                SEM POSIÇÃO COMPATÍVEL PARA {selectedPlayer.name.toUpperCase()}
              </div>
            )}

            {/* Player list */}
            <div>
              <p className="text-[9px] font-black text-[#888] tracking-widest mb-2">ESCOLHA UM JOGADOR</p>
              <PlayerList
                squad={state.currentRoll.squad}
                mode={state.mode}
                selectedPlayer={selectedPlayer}
                pickedIds={state.picks.map(p => p.player.id)}
                onSelect={pickPlayer}
                availableSlots={availableSlots.map(s => s.slot.position)}
              />
            </div>
          </div>
        )}

        {/* Field shown inside scroll area when toggled */}
        {showField && state.currentRoll && selectedPlayer && (
          <div className="bg-white rounded-2xl p-3 shadow-sm">
            <p className="text-[9px] font-black text-[#888] tracking-widest mb-2">ESCOLHA A POSIÇÃO</p>
            <Field
              formation={state.formation}
              picks={state.picks}
              selectedPlayer={selectedPlayer}
              onSlotClick={placePlayer}
            />
          </div>
        )}

      </div>
    </div>
  )
}
