import { useState, useCallback } from 'react'
import { FORMATIONS, canPlayPosition } from '../data/formations'
import type { Formation, FormationSlot } from '../data/formations'
import type { Player, Squad } from '../data/squads'
import squads from '../data/squads'
import clubs from '../data/clubs'
import {
  generateSeed, rollSquad, computeOverall, computeAtaque, computeDefesa,
  simulateCopa, simulateGroupStage, simulateKnockouts,
} from '../engine/game'
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

const BG = 'linear-gradient(160deg, #080808 0%, #0f0f0f 55%, #120c00 100%)'

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
    setTimeout(() => setDiceAnim(false), 500)
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
    setState(s => ({
      ...s, picks: newPicks, overall,
      currentRoll: null,
      phase: newPicks.length === 11 ? 'simulating' : 'rolling',
    }))
    setSelectedPlayer(null)
    setShowField(false)
  }

  const toResults = (results: MatchResult[]) => {
    const lastMatch = results[results.length - 1]
    setState(s => ({ ...s, matches: results, eliminated: !lastMatch?.won || lastMatch.phase !== 'Final', phase: 'results' }))
  }

  const startSimulation = () => {
    const groups = simulateGroupStage(state)
    if (groups.filter(m => !m.won && m.phase === 'Grupos').length >= 2) { toResults(groups) }
    else { setGroupMatches(groups); setHalftimePrompt(true) }
  }

  const startNarration = () => {
    const results = simulateCopa(state)
    const lastMatch = results[results.length - 1]
    setState(s => ({ ...s, matches: results, eliminated: !lastMatch?.won || lastMatch.phase !== 'Final', phase: 'results' }))
    setNarrating(true)
  }

  const afterHalftime = (newPicks: PickedPlayer[], newFormation: Formation, newStyle: GameStyle) => {
    const updState = { ...state, picks: newPicks, formation: newFormation, style: newStyle }
    const allMatches = [...groupMatches, ...simulateKnockouts(updState, groupMatches)]
    setState(s => ({ ...s, picks: newPicks, formation: newFormation, style: newStyle, overall: computeOverall(newPicks, newStyle) }))
    toResults(allMatches)
  }

  const restart = () => {
    setState(initState()); setRollIndex(0); setSelectedPlayer(null)
    setDiceAnim(false); setShowSettings(false); setShowField(false)
    setNarrating(false); setGroupMatches([]); setHalftimePrompt(false)
  }

  // ── Route to sub-screens ──────────────────────────────────────────────────
  if (state.phase === 'simulating')
    return <SimulationScreen state={state} onSimulate={startSimulation} onNarrate={startNarration} onHome={onHome} />

  if (halftimePrompt) {
    const gf   = groupMatches.reduce((s, m) => s + m.goalsFor, 0)
    const ga   = groupMatches.reduce((s, m) => s + m.goalsAgainst, 0)
    const wins = groupMatches.filter(m => m.won).length
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-5" style={{ background: BG }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          <div className="text-center mb-6">
            <div style={{ fontSize: 52, marginBottom: 8 }}>⏸</div>
            <h2 style={{ fontWeight: 900, fontSize: 26, letterSpacing: '0.05em', color: '#fff', margin: 0 }}>INTERVALO</h2>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, marginTop: 4 }}>Fase de Grupos concluída</p>
          </div>

          <div style={{ borderRadius: 20, overflow: 'hidden', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 32, padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              {[{ v: wins, l: 'VITÓRIAS', c: '#4CAF50' }, { v: gf, l: 'GOLS', c: '#C9A84C' }, { v: ga, l: 'SOFRIDOS', c: 'rgba(255,255,255,0.35)' }]
                .map(s => (
                  <div key={s.l} style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 900, fontSize: 28, color: s.c, lineHeight: 1 }}>{s.v}</div>
                    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>{s.l}</div>
                  </div>
                ))}
            </div>
            {groupMatches.map((m, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontWeight: 900, fontSize: 10, color: m.won ? '#4CAF50' : '#D12E2E', width: 12 }}>{m.won ? 'V' : 'D'}</span>
                <span style={{ fontSize: 18 }}>{m.opponentFlag}</span>
                <span style={{ flex: 1, fontWeight: 600, fontSize: 13, color: 'rgba(255,255,255,0.65)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.opponent}</span>
                <span style={{ fontWeight: 900, fontSize: 14, color: '#fff' }}>{m.goalsFor}–{m.goalsAgainst}</span>
              </div>
            ))}
          </div>

          <p style={{ fontWeight: 900, fontSize: 15, textAlign: 'center', color: '#fff', marginBottom: 14 }}>Quer fazer substituições?</p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => { setHalftimePrompt(false); setState(s => ({ ...s, phase: 'halftime' })) }}
              style={{ flex: 1, fontWeight: 900, fontSize: 14, padding: '16px 0', borderRadius: 16, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #C9A84C, #8a6020)', color: '#111', boxShadow: '0 8px 24px rgba(201,168,76,0.4)' }}
            >✅ SIM</button>
            <button
              onClick={() => { setHalftimePrompt(false); afterHalftime(state.picks, state.formation, state.style) }}
              style={{ flex: 1, fontWeight: 900, fontSize: 14, padding: '16px 0', borderRadius: 16, border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer', background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.7)' }}
            >❌ NÃO</button>
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

  // ── Derived values ────────────────────────────────────────────────────────
  const emptySlots     = state.formation.slots.map((slot, i) => ({ slot, i })).filter(({ i }) => !state.picks.find(p => p.slotIndex === i))
  const availableSlots = selectedPlayer ? emptySlots.filter(({ slot }) => canPlayPosition(selectedPlayer.primaryPosition, selectedPlayer.secondaryPositions, slot.position)) : []
  const ataque  = computeAtaque(state.picks)
  const defesa  = computeDefesa(state.picks)
  const canRoll = !state.currentRoll && (state.phase === 'setup' || state.phase === 'rolling')
  const filled  = state.picks.length

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: BG }}>

      {/* ── Top bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(0,0,0,0.65)', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
        <button onClick={onHome} style={{ fontWeight: 900, fontSize: 18, color: '#C9A84C', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textShadow: '0 0 12px rgba(201,168,76,0.5)' }}>0a7</button>

        {/* Progress bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ display: 'flex', gap: 3 }}>
            {Array.from({ length: 11 }).map((_, i) => (
              <div key={i} style={{
                width: i < filled ? 9 : 6,
                height: i < filled ? 9 : 6,
                borderRadius: '50%',
                background: i < filled ? '#C9A84C' : 'rgba(255,255,255,0.12)',
                boxShadow: i < filled ? '0 0 8px rgba(201,168,76,0.7)' : 'none',
                transition: 'all 0.2s',
              }} />
            ))}
          </div>
          <span style={{ fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,0.35)' }}>{filled}/11</span>
        </div>

        <button onClick={() => setShowSettings(s => !s)} style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.1em', color: showSettings ? '#C9A84C' : 'rgba(255,255,255,0.35)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          ⚙ AJUSTES
        </button>
      </div>

      {/* ── Settings panel ── */}
      {showSettings && (
        <div style={{ padding: '16px', background: 'rgba(0,0,0,0.7)', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', gap: 14, flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.25)', marginBottom: 8 }}>FORMAÇÃO</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {Object.keys(FORMATIONS).map(f => (
                <button key={f} onClick={() => setState(s => ({ ...s, formation: FORMATIONS[f] }))}
                  style={{ fontSize: 10, fontWeight: 900, padding: '6px 12px', borderRadius: 10, border: state.formation.name === f ? '1px solid rgba(209,46,46,0.6)' : '1px solid rgba(255,255,255,0.1)', background: state.formation.name === f ? 'rgba(209,46,46,0.25)' : 'rgba(255,255,255,0.06)', color: state.formation.name === f ? '#fff' : 'rgba(255,255,255,0.45)', cursor: 'pointer' }}>
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.25)', marginBottom: 8 }}>ESTILO</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['defensive', 'balanced', 'offensive'] as GameStyle[]).map(s => (
                <button key={s} onClick={() => setState(st => ({ ...st, style: s }))}
                  style={{ flex: 1, fontSize: 10, fontWeight: 900, padding: '8px 4px', borderRadius: 10, border: state.style === s ? '1px solid rgba(201,168,76,0.5)' : '1px solid rgba(255,255,255,0.08)', background: state.style === s ? 'rgba(201,168,76,0.18)' : 'rgba(255,255,255,0.06)', color: state.style === s ? '#C9A84C' : 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>
                  {STYLE_LABELS[s]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Stats strip ── */}
      {filled > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', background: 'rgba(0,0,0,0.4)', borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 20, flex: 1 }}>
            {[
              { v: state.overall, l: 'OVR', c: '#C9A84C', glow: 'rgba(201,168,76,0.5)' },
              ...(ataque !== null ? [{ v: ataque, l: 'ATK', c: '#EF5350', glow: 'rgba(239,83,80,0.4)' }] : []),
              ...(defesa !== null ? [{ v: defesa, l: 'DEF', c: '#66BB6A', glow: 'rgba(102,187,106,0.4)' }] : []),
            ].map(s => (
              <div key={s.l} style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 900, fontSize: 20, lineHeight: 1, color: s.c, textShadow: `0 0 12px ${s.glow}` }}>{s.v}</div>
                <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>{s.l}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.25)' }}>{state.formation.name}</span>
            <button onClick={() => setShowField(f => !f)}
              style={{ fontSize: 10, fontWeight: 900, padding: '6px 12px', borderRadius: 10, border: showField ? '1px solid rgba(201,168,76,0.4)' : '1px solid rgba(255,255,255,0.1)', background: showField ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.06)', color: showField ? '#C9A84C' : 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
              {showField ? '☰ LISTA' : '⬛ CAMPO'}
            </button>
          </div>
        </div>
      )}

      {/* ── Field toggle ── */}
      {showField && filled > 0 && (
        <div style={{ padding: '12px 16px', background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
          <Field formation={state.formation} picks={state.picks} selectedPlayer={selectedPlayer} onSlotClick={placePlayer} />
        </div>
      )}

      {/* ── Main scrollable area ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* ══ ROLL STATE ══ */}
        {canRoll && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 16, gap: 20 }}>

            {/* Instruction */}
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontWeight: 700, fontSize: 14, color: 'rgba(255,255,255,0.45)', margin: 0 }}>
                {filled === 0 ? 'Role o dado para começar' : `${11 - filled} posição${11 - filled > 1 ? 'ões' : ''} restante${11 - filled > 1 ? 's' : ''}`}
              </p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', margin: '4px 0 0' }}>Um craque histórico por rodada</p>
            </div>

            {/* Dice button — full width */}
            <button
              onClick={roll}
              style={{
                width: '100%',
                padding: '28px 0',
                borderRadius: 24,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
                transform: diceAnim ? 'scale(0.95)' : 'scale(1)',
                background: diceAnim
                  ? 'linear-gradient(135deg, #b8943d 0%, #7a5010 100%)'
                  : 'linear-gradient(145deg, rgba(201,168,76,0.12) 0%, rgba(20,16,0,0.95) 100%)',
                boxShadow: diceAnim
                  ? '0 0 50px rgba(201,168,76,0.5), 0 8px 24px rgba(0,0,0,0.4)'
                  : '0 4px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(201,168,76,0.15), 0 0 0 1px rgba(201,168,76,0.18)',
              }}
            >
              <span style={{ fontSize: 52, lineHeight: 1, filter: diceAnim ? 'brightness(0.8)' : 'none' }}>
                {diceAnim ? '🎰' : '🎲'}
              </span>
              <span style={{
                fontSize: 13, fontWeight: 900, letterSpacing: '0.2em',
                color: diceAnim ? '#C9A84C' : '#C9A84C',
              }}>
                ROLAR O DADO
              </span>
            </button>

            {/* Current team */}
            {filled > 0 && (
              <div style={{ width: '100%', borderRadius: 18, overflow: 'hidden', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.25)' }}>TIME ATUAL</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '8px 12px', gap: '0 16px' }}>
                  {state.picks.map((pick, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <span style={{ fontSize: 9, fontWeight: 900, color: 'rgba(255,255,255,0.18)', width: 28, flexShrink: 0 }}>{pick.slot.label}</span>
                      <span style={{ fontSize: 14 }}>{pick.squad.flagEmoji}</span>
                      <span style={{ fontWeight: 700, fontSize: 12, color: 'rgba(255,255,255,0.8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{pick.player.name.split(' ').pop()}</span>
                      {pick.player.isLegend && <span style={{ fontSize: 9, color: '#C9A84C' }}>★</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══ PICK STATE ══ */}
        {state.currentRoll && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Squad card — dramatic reveal */}
            <div style={{
              borderRadius: 22,
              overflow: 'hidden',
              position: 'relative',
              border: '1px solid rgba(201,168,76,0.25)',
              boxShadow: '0 0 40px rgba(201,168,76,0.1), 0 8px 32px rgba(0,0,0,0.5)',
            }}>
              {/* Background gradient */}
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(145deg, rgba(201,168,76,0.15) 0%, rgba(10,8,0,0.9) 60%)',
                pointerEvents: 'none',
              }} />
              {/* Radial glow */}
              <div style={{
                position: 'absolute', top: -40, left: -40, width: 200, height: 200,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(201,168,76,0.2) 0%, transparent 70%)',
                pointerEvents: 'none',
              }} />

              <div style={{ position: 'relative', padding: '18px 20px' }}>
                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.2em', color: 'rgba(201,168,76,0.55)' }}>🎲 SORTEIO</span>
                  <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.2)' }}>
                    {state.currentRoll.squad.year}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  {/* Country/Club code badge */}
                  <div style={{
                    width: 56, height: 56, borderRadius: 14, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'linear-gradient(135deg, rgba(201,168,76,0.25), rgba(100,70,0,0.4))',
                    border: '1.5px solid rgba(201,168,76,0.35)',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 900, color: '#C9A84C', letterSpacing: '0.05em', textAlign: 'center', lineHeight: 1.1 }}>
                      {state.currentRoll.squad.badgeEmoji ?? state.currentRoll.squad.countryCode}
                    </span>
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 900, fontSize: 20, lineHeight: 1.1, color: '#fff', letterSpacing: '-0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {state.currentRoll.squad.clubName ?? state.currentRoll.squad.countryNamePt}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 12, color: '#C9A84C', marginTop: 3, textShadow: '0 0 8px rgba(201,168,76,0.4)' }}>
                      {state.currentRoll.squad.trophy ?? `Copa do Mundo ${state.currentRoll.squad.year}`}
                    </div>
                    {state.currentRoll.squad.notableReason && (
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 5, lineHeight: 1.4, fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {state.currentRoll.squad.notableReason}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Reroll controls */}
            {state.currentRoll.rerollsLeft > 0 && (
              <div style={{ borderRadius: 16, padding: '12px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.3)' }}>NÃO CURTIU?</span>
                  <div style={{ display: 'flex', gap: 5 }}>
                    {[0,1,2].map(i => (
                      <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: i < state.currentRoll!.rerollsLeft ? '#C9A84C' : 'rgba(255,255,255,0.1)', boxShadow: i < state.currentRoll!.rerollsLeft ? '0 0 6px rgba(201,168,76,0.7)' : 'none' }} />
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[{ l: '↺ OUTRO TIME', t: 'squad' as const }, { l: '↺ OUTRA COPA', t: 'copa' as const }].map(b => (
                    <button key={b.t} onClick={() => reroll(b.t)}
                      style={{ flex: 1, fontWeight: 900, fontSize: 11, padding: '10px 0', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>
                      {b.l}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Selected player CTA */}
            {selectedPlayer && !showField && (
              <div style={{ borderRadius: 16, padding: '16px', textAlign: 'center', background: 'linear-gradient(135deg, rgba(209,46,46,0.25), rgba(120,10,10,0.2))', border: '1px solid rgba(209,46,46,0.4)', boxShadow: '0 0 20px rgba(209,46,46,0.2)' }}>
                <p style={{ fontWeight: 900, fontSize: 15, color: '#fff', margin: '0 0 4px' }}>{selectedPlayer.name}</p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', margin: '0 0 12px' }}>Posicione no campo</p>
                <button onClick={() => setShowField(true)}
                  style={{ fontWeight: 900, fontSize: 12, padding: '10px 24px', borderRadius: 12, border: 'none', background: '#D12E2E', color: '#fff', cursor: 'pointer', boxShadow: '0 4px 16px rgba(209,46,46,0.5)' }}>
                  VER CAMPO →
                </button>
              </div>
            )}
            {selectedPlayer && showField && availableSlots.length === 0 && (
              <div style={{ borderRadius: 14, padding: '12px 16px', textAlign: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <span style={{ fontSize: 11, fontWeight: 900, color: 'rgba(255,255,255,0.45)' }}>SEM POSIÇÃO COMPATÍVEL PARA {selectedPlayer.name.toUpperCase()}</span>
              </div>
            )}

            {/* Player list */}
            <div>
              <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.25)', marginBottom: 10 }}>ESCOLHA UM JOGADOR</div>
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

        {/* Field shown in scroll area when picking position */}
        {showField && state.currentRoll && selectedPlayer && (
          <div style={{ borderRadius: 18, padding: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.25)', marginBottom: 12 }}>ESCOLHA A POSIÇÃO</div>
            <Field formation={state.formation} picks={state.picks} selectedPlayer={selectedPlayer} onSlotClick={placePlayer} />
          </div>
        )}
      </div>
    </div>
  )
}
