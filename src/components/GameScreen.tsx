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
    seed, formation: FORMATIONS['4-2-3-1'],
    mode: 'almanac', style: 'offensive',
    picks: [], currentRoll: null, phase: 'setup',
    matches: [], eliminated: false, overall: 0, subsUsed: 0,
  }
}

const STYLE_LABELS: Record<GameStyle, string> = {
  defensive: 'DEFENSIVO', balanced: 'EQUILIBRADO', offensive: 'OFENSIVO',
}

const BG = 'linear-gradient(160deg, #0d0d0d 0%, #111 60%, #1a1200 100%)'

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
    if (groupLosses >= 2) { toResults(groups) }
    else { setGroupMatches(groups); setHalftimePrompt(true) }
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
    setRollIndex(0); setSelectedPlayer(null); setDiceAnim(false)
    setShowSettings(false); setShowField(false); setNarrating(false)
    setGroupMatches([]); setHalftimePrompt(false)
  }

  if (state.phase === 'simulating')
    return <SimulationScreen state={state} onSimulate={startSimulation} onNarrate={startNarration} onHome={onHome} />

  if (halftimePrompt) {
    const gf = groupMatches.reduce((s, m) => s + m.goalsFor, 0)
    const ga = groupMatches.reduce((s, m) => s + m.goalsAgainst, 0)
    const wins = groupMatches.filter(m => m.won).length
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-5" style={{ background: BG }}>
        <div className="w-full max-w-sm">
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">⏸</div>
            <h2 className="font-black text-2xl tracking-wider mb-1" style={{ color: '#fff' }}>INTERVALO</h2>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Fase de Grupos concluída</p>
          </div>

          <div className="rounded-2xl p-4 mb-4" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <p className="text-[9px] font-black tracking-widest mb-3 text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>FASE DE GRUPOS</p>
            <div className="flex justify-center gap-8 mb-4">
              <div className="text-center"><div className="font-black text-2xl" style={{ color: '#4CAF50' }}>{wins}V</div><div className="text-[9px]" style={{ color: 'rgba(255,255,255,0.3)' }}>VITÓRIAS</div></div>
              <div className="text-center"><div className="font-black text-2xl" style={{ color: '#C9A84C' }}>{gf}</div><div className="text-[9px]" style={{ color: 'rgba(255,255,255,0.3)' }}>GOLS</div></div>
              <div className="text-center"><div className="font-black text-2xl" style={{ color: 'rgba(255,255,255,0.4)' }}>{ga}</div><div className="text-[9px]" style={{ color: 'rgba(255,255,255,0.3)' }}>SOFRIDOS</div></div>
            </div>
            {groupMatches.map((m, i) => (
              <div key={i} className="flex items-center justify-between py-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <span className={`font-black text-[10px] w-4`} style={{ color: m.won ? '#4CAF50' : '#D12E2E' }}>{m.won ? 'V' : 'D'}</span>
                <span className="text-sm">{m.opponentFlag}</span>
                <span className="text-sm flex-1 mx-2 truncate" style={{ color: 'rgba(255,255,255,0.6)' }}>{m.opponent}</span>
                <span className="font-black text-sm" style={{ color: '#fff' }}>{m.goalsFor}–{m.goalsAgainst}</span>
              </div>
            ))}
          </div>

          <p className="font-black text-base text-center mb-4" style={{ color: '#fff' }}>Quer fazer substituições?</p>
          <div className="flex gap-3">
            <button
              onClick={() => { setHalftimePrompt(false); setState(s => ({ ...s, phase: 'halftime' })) }}
              className="flex-1 font-black py-4 rounded-2xl text-sm transition-all active:scale-95"
              style={{ background: 'linear-gradient(135deg, #C9A84C, #a07830)', color: '#111', boxShadow: '0 8px 24px rgba(201,168,76,0.35)' }}
            >
              ✅ SIM
            </button>
            <button
              onClick={() => { setHalftimePrompt(false); afterHalftime(state.picks, state.formation, state.style) }}
              className="flex-1 font-black py-4 rounded-2xl text-sm transition-all active:scale-95"
              style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.12)' }}
            >
              ❌ NÃO
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (state.phase === 'halftime')
    return <HalftimeScreen picks={state.picks} groupMatches={groupMatches} formation={state.formation} style={state.style} mode={state.mode} onContinue={afterHalftime} onHome={onHome} />
  if (state.phase === 'results' && narrating)
    return <NarrationScreen state={state} matches={state.matches} onFinish={() => setNarrating(false)} />
  if (state.phase === 'results')
    return <ResultScreen state={state} onReplay={restart} onHome={onHome} />

  const emptySlots = state.formation.slots.map((slot, i) => ({ slot, i })).filter(({ i }) => !state.picks.find(p => p.slotIndex === i))
  const availableSlots = selectedPlayer
    ? emptySlots.filter(({ slot }) => canPlayPosition(selectedPlayer.primaryPosition, selectedPlayer.secondaryPositions, slot.position))
    : []
  const ataque = computeAtaque(state.picks)
  const defesa = computeDefesa(state.picks)
  const canRoll = !state.currentRoll && (state.phase === 'setup' || state.phase === 'rolling')
  const filled = state.picks.length

  return (
    <div className="min-h-screen flex flex-col" style={{ background: BG }}>

      {/* Top bar */}
      <div className="px-4 py-3 flex items-center justify-between flex-shrink-0" style={{ background: 'rgba(0,0,0,0.5)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <button onClick={onHome} className="font-black text-base tracking-tight" style={{ color: '#C9A84C' }}>0a7</button>

        {/* Progress */}
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {Array.from({ length: 11 }).map((_, i) => (
              <div key={i} className="rounded-full transition-all" style={{
                width: i < filled ? 8 : 6,
                height: i < filled ? 8 : 6,
                background: i < filled ? '#C9A84C' : 'rgba(255,255,255,0.15)',
                boxShadow: i < filled ? '0 0 6px rgba(201,168,76,0.6)' : 'none',
              }} />
            ))}
          </div>
          <span className="text-[10px] font-black" style={{ color: 'rgba(255,255,255,0.4)' }}>{filled}/11</span>
        </div>

        <button
          onClick={() => setShowSettings(s => !s)}
          className="text-[10px] font-black tracking-widest transition-colors"
          style={{ color: showSettings ? '#C9A84C' : 'rgba(255,255,255,0.4)' }}
        >
          ⚙ AJUSTES
        </button>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="px-4 py-4 flex flex-col gap-4 flex-shrink-0" style={{ background: 'rgba(0,0,0,0.6)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div>
            <div className="text-[9px] font-black tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>FORMAÇÃO</div>
            <div className="flex gap-1.5 flex-wrap">
              {Object.keys(FORMATIONS).map(f => (
                <button key={f} onClick={() => setState(s => ({ ...s, formation: FORMATIONS[f] }))}
                  className="text-[10px] px-3 py-1.5 font-black rounded-xl transition-all"
                  style={{
                    background: state.formation.name === f ? '#D12E2E' : 'rgba(255,255,255,0.07)',
                    color: state.formation.name === f ? '#fff' : 'rgba(255,255,255,0.5)',
                    border: state.formation.name === f ? '1px solid #D12E2E' : '1px solid rgba(255,255,255,0.1)',
                  }}>
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[9px] font-black tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>ESTILO</div>
            <div className="flex gap-1.5">
              {(['defensive', 'balanced', 'offensive'] as GameStyle[]).map(s => (
                <button key={s} onClick={() => setState(st => ({ ...st, style: s }))}
                  className="text-[10px] px-3 py-1.5 font-black rounded-xl transition-all flex-1"
                  style={{
                    background: state.style === s ? 'rgba(201,168,76,0.25)' : 'rgba(255,255,255,0.07)',
                    color: state.style === s ? '#C9A84C' : 'rgba(255,255,255,0.5)',
                    border: state.style === s ? '1px solid rgba(201,168,76,0.5)' : '1px solid rgba(255,255,255,0.1)',
                  }}>
                  {STYLE_LABELS[s]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Stats strip */}
      {filled > 0 && (
        <div className="px-4 py-2.5 flex items-center gap-3 flex-shrink-0" style={{ background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex gap-4 flex-1">
            <div className="text-center">
              <div className="font-black text-lg leading-none" style={{ color: '#C9A84C' }}>{state.overall}</div>
              <div className="text-[8px] font-black tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>OVR</div>
            </div>
            {ataque !== null && (
              <div className="text-center">
                <div className="font-black text-lg leading-none" style={{ color: '#D12E2E' }}>{ataque}</div>
                <div className="text-[8px] font-black tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>ATK</div>
              </div>
            )}
            {defesa !== null && (
              <div className="text-center">
                <div className="font-black text-lg leading-none" style={{ color: '#4CAF50' }}>{defesa}</div>
                <div className="text-[8px] font-black tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>DEF</div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-bold" style={{ color: 'rgba(255,255,255,0.3)' }}>{state.formation.name}</span>
            <button
              onClick={() => setShowField(f => !f)}
              className="text-[9px] font-black px-2.5 py-1.5 rounded-xl transition-all"
              style={{
                background: showField ? 'rgba(201,168,76,0.2)' : 'rgba(255,255,255,0.08)',
                color: showField ? '#C9A84C' : 'rgba(255,255,255,0.5)',
                border: showField ? '1px solid rgba(201,168,76,0.4)' : '1px solid rgba(255,255,255,0.1)',
              }}
            >
              {showField ? '☰ LISTA' : '⬛ CAMPO'}
            </button>
          </div>
        </div>
      )}

      {/* Field toggle */}
      {showField && filled > 0 && (
        <div className="flex-shrink-0 px-4 py-3" style={{ background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <Field formation={state.formation} picks={state.picks} selectedPlayer={selectedPlayer} onSlotClick={placePlayer} />
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">

        {/* ROLL STATE */}
        {canRoll && (
          <div className="flex flex-col items-center pt-4 gap-4">
            <div className="text-center">
              <p className="font-bold text-sm mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {filled === 0 ? 'Role o dado para sortear seu time' : `${11 - filled} posição${11 - filled > 1 ? 'ões' : ''} restante${11 - filled > 1 ? 's' : ''}`}
              </p>
              <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>Um craque por sorteio</p>
            </div>

            <button
              onClick={roll}
              className="flex flex-col items-center justify-center gap-2 rounded-3xl transition-all active:scale-90"
              style={{
                width: 128, height: 128,
                background: diceAnim
                  ? 'linear-gradient(135deg, #C9A84C, #a07830)'
                  : 'linear-gradient(135deg, #1e1e1e, #2a2a2a)',
                border: '2px solid rgba(201,168,76,0.3)',
                boxShadow: diceAnim
                  ? '0 0 40px rgba(201,168,76,0.5), 0 8px 32px rgba(0,0,0,0.4)'
                  : '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.07)',
                transform: diceAnim ? 'scale(0.9) rotate(10deg)' : 'scale(1)',
              }}
            >
              <span className="text-4xl">{diceAnim ? '🎰' : '🎲'}</span>
              <span className="text-xs font-black tracking-widest" style={{ color: diceAnim ? '#111' : '#C9A84C' }}>ROLAR</span>
            </button>

            {filled > 0 && (
              <div className="w-full rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="px-4 py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <span className="text-[9px] font-black tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>TIME ATUAL</span>
                </div>
                <div className="grid grid-cols-2 px-3 py-1">
                  {state.picks.map((pick, i) => (
                    <div key={i} className="flex items-center gap-2 py-1.5" style={{ borderBottom: i < state.picks.length - 2 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                      <span className="text-[9px] font-black w-7 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.2)' }}>{pick.slot.label}</span>
                      <span className="text-xs">{pick.squad.flagEmoji}</span>
                      <span className="font-bold text-[11px] truncate flex-1" style={{ color: 'rgba(255,255,255,0.8)' }}>{pick.player.name.split(' ').pop()}</span>
                      {pick.player.isLegend && <span className="text-[9px]" style={{ color: '#C9A84C' }}>★</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* PICK STATE */}
        {state.currentRoll && (
          <div className="flex flex-col gap-3">
            {/* Squad banner */}
            <div className="rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(201,168,76,0.12) 0%, rgba(0,0,0,0.4) 100%)', border: '1px solid rgba(201,168,76,0.2)' }}>
              <div className="px-4 pt-4 pb-3">
                <div className="text-[9px] font-black tracking-[0.2em] mb-3" style={{ color: '#C9A84C' }}>🎲 SORTEIO</div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-4xl">{state.currentRoll.squad.flagEmoji}</span>
                  <div>
                    <div className="font-black text-xl leading-tight" style={{ color: '#fff' }}>
                      {state.currentRoll.squad.clubName ?? state.currentRoll.squad.countryNamePt}
                    </div>
                    <div className="font-bold text-sm" style={{ color: '#C9A84C' }}>
                      {state.currentRoll.squad.trophy ?? `Copa ${state.currentRoll.squad.year}`}
                    </div>
                  </div>
                </div>
                {state.currentRoll.squad.notableReason && (
                  <p className="text-[10px] italic leading-snug" style={{ color: 'rgba(255,255,255,0.35)' }}>{state.currentRoll.squad.notableReason}</p>
                )}
              </div>
            </div>

            {/* Reroll */}
            {state.currentRoll.rerollsLeft > 0 && (
              <div className="rounded-2xl p-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[9px] font-black tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>NÃO CURTIU?</span>
                  <div className="flex gap-1">
                    {[0,1,2].map(i => (
                      <div key={i} className="w-2 h-2 rounded-full" style={{ background: i < state.currentRoll!.rerollsLeft ? '#C9A84C' : 'rgba(255,255,255,0.1)' }} />
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => reroll('squad')}
                    className="flex-1 font-black text-[11px] py-2.5 rounded-xl transition-all active:scale-95"
                    style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    ↺ OUTRO TIME
                  </button>
                  <button onClick={() => reroll('copa')}
                    className="flex-1 font-black text-[11px] py-2.5 rounded-xl transition-all active:scale-95"
                    style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    ↺ OUTRA COPA
                  </button>
                </div>
              </div>
            )}

            {/* Selected player prompt */}
            {selectedPlayer && !showField && (
              <div className="rounded-2xl p-4 text-center" style={{ background: 'linear-gradient(135deg, rgba(209,46,46,0.25), rgba(209,46,46,0.1))', border: '1px solid rgba(209,46,46,0.4)' }}>
                <p className="font-black text-sm mb-1" style={{ color: '#fff' }}>{selectedPlayer.name}</p>
                <p className="text-[11px] mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>Escolha a posição no campo</p>
                <button onClick={() => setShowField(true)}
                  className="font-black text-[11px] px-5 py-2 rounded-full transition-all active:scale-95"
                  style={{ background: '#D12E2E', color: '#fff', boxShadow: '0 4px 16px rgba(209,46,46,0.4)' }}>
                  VER CAMPO →
                </button>
              </div>
            )}
            {selectedPlayer && showField && availableSlots.length === 0 && (
              <div className="rounded-2xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}>
                <span className="text-[11px] font-black" style={{ color: 'rgba(255,255,255,0.5)' }}>SEM POSIÇÃO COMPATÍVEL PARA {selectedPlayer.name.toUpperCase()}</span>
              </div>
            )}

            {/* Player list */}
            <div>
              <p className="text-[9px] font-black tracking-widest mb-2.5" style={{ color: 'rgba(255,255,255,0.3)' }}>ESCOLHA UM JOGADOR</p>
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

        {/* Field in scroll area */}
        {showField && state.currentRoll && selectedPlayer && (
          <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="text-[9px] font-black tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.3)' }}>ESCOLHA A POSIÇÃO</p>
            <Field formation={state.formation} picks={state.picks} selectedPlayer={selectedPlayer} onSlotClick={placePlayer} />
          </div>
        )}
      </div>
    </div>
  )
}
