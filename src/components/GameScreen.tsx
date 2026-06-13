import { useState, useCallback, useEffect, useRef } from 'react'
import { FORMATIONS, canPlayPosition } from '../data/formations'
import type { Formation, FormationSlot } from '../data/formations'
import type { Player, Squad } from '../data/squads'
import squads from '../data/squads'
import clubs from '../data/clubs'
import {
  generateSeed, rollSquad, computeOverall, computeAtaque, computeDefesa,
  simulateCopa, simulateGroupStage, simulateKnockouts,
} from '../engine/game'
import type { GameState, PickedPlayer, GameStyle, MatchResult } from '../engine/game'
import type { GameCategory } from '../App'
import type { ThemePalette } from '../theme'
import { DARK } from '../theme'
import Field from './Field'
import PlayerList from './PlayerList'
import SimulationScreen from './SimulationScreen'
import NarrationScreen from './NarrationScreen'
import HalftimeScreen from './HalftimeScreen'
import ResultScreen from './ResultScreen'

const OSWALD = "'Oswald', 'Impact', 'Arial Narrow', sans-serif"

interface Props { category: GameCategory; onHome: () => void; theme?: ThemePalette; onToggleTheme?: () => void }

function getClubCode(squad: import('../data/squads').Squad): string {
  const name = squad.clubName ?? squad.countryNamePt
  const words = name.split(/[\s-]+/).filter(w => w.length > 0)
  if (words.length === 1) return name.substring(0, 3).toUpperCase()
  if (words.length === 2) return (words[0][0] + words[1].substring(0, 2)).toUpperCase()
  return words.slice(0, 3).map(w => w[0].toUpperCase()).join('')
}

function getBadgeColors(emoji?: string): { bg: string; text: string; border: string; shadow: string } {
  switch (emoji) {
    case '🔴': return { bg: '#7f1010', text: '#fff', border: '#c62828aa', shadow: 'rgba(198,40,40,0.4)' }
    case '🔵': return { bg: '#0d3a7a', text: '#fff', border: '#1565C0aa', shadow: 'rgba(21,101,192,0.4)' }
    case '⚫': return { bg: '#1a1a1a', text: '#fff', border: '#424242aa', shadow: 'rgba(0,0,0,0.5)' }
    case '⚪': return { bg: '#4a4a4a', text: '#fff', border: '#757575aa', shadow: 'rgba(100,100,100,0.4)' }
    case '🟡': return { bg: '#7a5000', text: '#ffe082', border: '#F9A825aa', shadow: 'rgba(249,168,37,0.4)' }
    case '🟢': return { bg: '#0d3d18', text: '#a5d6a7', border: '#2E7D32aa', shadow: 'rgba(46,125,50,0.4)' }
    case '🍀': return { bg: '#0d3d18', text: '#a5d6a7', border: '#2E7D32aa', shadow: 'rgba(46,125,50,0.4)' }
    case '⭐': return { bg: '#5c2800', text: '#ffcc80', border: '#E65100aa', shadow: 'rgba(230,81,0,0.4)' }
    case '⛵': return { bg: '#0a2a5c', text: '#90caf9', border: '#1565C0aa', shadow: 'rgba(21,101,192,0.4)' }
    case '⭕': return { bg: '#7f1010', text: '#fff', border: '#c62828aa', shadow: 'rgba(198,40,40,0.4)' }
    case '⬛': return { bg: '#1a1a2e', text: '#aaa', border: '#37474faa', shadow: 'rgba(55,71,79,0.4)' }
    default:   return { bg: '#1a1a1a', text: '#ccc', border: '#333aa', shadow: 'rgba(0,0,0,0.3)' }
  }
}

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

const TICKER_TEXT = '⚽ COPA DO MUNDO   🏆 LENDAS DO FUTEBOL   ★ CRAQUE HISTÓRICO   🥇 HALL DA FAMA   🎖 ÍDOLO DA NAÇÃO   ⚽ COPA DO MUNDO   🏆 LENDAS DO FUTEBOL   ★ CRAQUE HISTÓRICO   🥇 HALL DA FAMA   🎖 ÍDOLO DA NAÇÃO   '

function AdStrip({ theme: t }: { theme: ThemePalette }) {
  const bg = t.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)'
  const color = t.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.3)'
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 10px', background: bg, borderTop: `1px solid ${t.border}`, borderBottom: `1px solid ${t.border}` }}>
      <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.18em', color }}>ANUNCIE AQUI</span>
      <span style={{ fontSize: 8, fontWeight: 600, letterSpacing: '0.12em', color }}>CONTATO</span>
      <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.18em', color }}>ANUNCIE AQUI</span>
    </div>
  )
}

function TickerBanner() {
  return (
    <>
      <style>{`
        @keyframes ticker-slide {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
      `}</style>
      <div style={{ overflow: 'hidden', height: 26, background: 'rgba(0,0,0,0.55)', borderTop: '1px solid rgba(201,168,76,0.12)', display: 'flex', alignItems: 'center' }}>
        <div style={{ display: 'flex', whiteSpace: 'nowrap', animation: 'ticker-slide 22s linear infinite', willChange: 'transform' }}>
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', color: 'rgba(201,168,76,0.45)', padding: '0 8px' }}>{TICKER_TEXT}</span>
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', color: 'rgba(201,168,76,0.45)', padding: '0 8px' }}>{TICKER_TEXT}</span>
        </div>
      </div>
    </>
  )
}

export default function GameScreen({ category, onHome, theme: themeProp, onToggleTheme }: Props) {
  const t = themeProp ?? DARK
  const pool: Squad[] = category === 'clubs' ? clubs : squads
  const [state, setState] = useState<GameState>(initState)
  const [rollIndex, setRollIndex] = useState(0)
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [diceAnim, setDiceAnim] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showField, setShowField] = useState(false)
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 768)
  useEffect(() => {
    const fn = () => setIsDesktop(window.innerWidth >= 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  const fieldPickRef = useRef<HTMLDivElement>(null)
  const [narrating, setNarrating] = useState(false)
  const [groupMatches, setGroupMatches] = useState<MatchResult[]>([])
  const [halftimePrompt, setHalftimePrompt] = useState(false)
  const [favoritePhase, setFavoritePhase] = useState<'ask' | 'pick' | 'done'>('ask')

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

  const pickPlayer = (player: Player) => {
    const next = selectedPlayer?.id === player.id ? null : player
    setSelectedPlayer(next)
    if (next && !isDesktop) setShowField(true)
  }

  useEffect(() => {
    if (selectedPlayer && !isDesktop && fieldPickRef.current) {
      const timer = setTimeout(() => {
        fieldPickRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }, 80)
      return () => clearTimeout(timer)
    }
  }, [selectedPlayer, isDesktop])

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
    const groups = simulateGroupStage(state, pool)
    if (groups.filter(m => !m.won && m.phase === 'Grupos').length >= 2) { toResults(groups) }
    else { setGroupMatches(groups); setHalftimePrompt(true) }
  }

  const startNarration = () => {
    const results = simulateCopa(state, pool)
    const lastMatch = results[results.length - 1]
    setState(s => ({ ...s, matches: results, eliminated: !lastMatch?.won || lastMatch.phase !== 'Final', phase: 'results' }))
    setNarrating(true)
  }

  const afterHalftime = (newPicks: PickedPlayer[], newFormation: Formation, newStyle: GameStyle) => {
    const updState = { ...state, picks: newPicks, formation: newFormation, style: newStyle }
    const allMatches = [...groupMatches, ...simulateKnockouts(updState, groupMatches, pool)]
    setState(s => ({ ...s, picks: newPicks, formation: newFormation, style: newStyle, overall: computeOverall(newPicks, newStyle) }))
    toResults(allMatches)
  }

  const selectFavoriteClub = (squad: Squad) => {
    setState(s => ({ ...s, currentRoll: { squad, rerollsLeft: 3 }, phase: 'picking' }))
    setRollIndex(i => i + 1)
    setFavoritePhase('done')
  }

  const restart = () => {
    setState(initState()); setRollIndex(0); setSelectedPlayer(null)
    setDiceAnim(false); setShowSettings(false); setShowField(false)
    setNarrating(false); setGroupMatches([]); setHalftimePrompt(false)
    setFavoritePhase('ask')
  }

  // ── Favorite club prompt (once, at game start) ────────────────────────────
  if (state.phase === 'setup' && state.picks.length === 0 && favoritePhase !== 'done') {
    const topBar = (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', background: t.topbar, borderBottom: `1px solid ${t.topbarBorder}`, backdropFilter: 'blur(10px)' }}>
        <button onClick={onHome} style={{ fontWeight: 700, fontSize: 17, color: t.gold, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: OSWALD }}>0a7</button>
        <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.2em', color: t.textMuted }}>MONTAR TIME</span>
        <div style={{ width: 32 }} />
      </div>
    )

    if (favoritePhase === 'ask') {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: t.bgGrad }}>
          {topBar}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px' }}>
            <div style={{ maxWidth: 340, width: '100%' }}>
              <div style={{ textAlign: 'center', marginBottom: 36 }}>
                <div style={{ fontSize: 64, marginBottom: 20, filter: 'drop-shadow(0 0 24px rgba(212,168,64,0.5))' }}>🏆</div>
                <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.25em', color: t.gold, opacity: 0.6, marginBottom: 10 }}>MODO LIVRE</div>
                <h2 style={{ fontWeight: 700, fontSize: 26, letterSpacing: '0.04em', color: t.text, margin: '0 0 12px', fontFamily: OSWALD }}>CLUBE FAVORITO</h2>
                <p style={{ fontSize: 13, color: t.textDim, margin: 0, lineHeight: 1.65 }}>
                  Quer garantir jogadores de um time que você ama no seu elenco?
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button
                  onClick={() => setFavoritePhase('pick')}
                  style={{ width: '100%', fontWeight: 700, fontSize: 15, padding: '18px 0', borderRadius: 18, border: 'none', cursor: 'pointer', fontFamily: OSWALD, letterSpacing: '0.08em', background: `linear-gradient(135deg, #D4A840 0%, #7a5010 100%)`, color: '#111', boxShadow: '0 8px 32px rgba(212,168,64,0.35), 0 2px 8px rgba(0,0,0,0.4)' }}
                >
                  SIM, ESCOLHER TIME
                </button>
                <button
                  onClick={() => setFavoritePhase('done')}
                  style={{ width: '100%', fontWeight: 600, fontSize: 14, padding: '16px 0', borderRadius: 18, border: `1px solid ${t.border2}`, cursor: 'pointer', background: t.surface, color: t.textDim, letterSpacing: '0.06em' }}
                >
                  Não, rolar o dado
                </button>
              </div>
              <p style={{ fontSize: 10, color: t.textMuted, marginTop: 20, letterSpacing: '0.05em', textAlign: 'center' }}>
                Você terá 3 rerolls por rodada
              </p>
            </div>
          </div>
        </div>
      )
    }

    if (favoritePhase === 'pick') {
      const sortedPool = [...pool].sort((a, b) => {
        const na = (a.clubName ?? a.countryNamePt).toLowerCase()
        const nb = (b.clubName ?? b.countryNamePt).toLowerCase()
        if (na !== nb) return na.localeCompare(nb, 'pt')
        return a.year - b.year
      })
      return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: t.bgGrad }}>
          {topBar}
          <div style={{ padding: '14px 16px 12px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, borderBottom: `1px solid ${t.topbarBorder}` }}>
            <button onClick={() => setFavoritePhase('ask')} style={{ fontSize: 18, background: 'none', border: 'none', color: t.textDim, cursor: 'pointer', padding: '0 4px', lineHeight: 1 }}>←</button>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: t.text, fontFamily: OSWALD, letterSpacing: '0.04em' }}>ESCOLHA SEU CLUBE</div>
              <div style={{ fontSize: 10, color: t.textMuted }}>{pool.length} times históricos</div>
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px 32px', display: 'flex', flexDirection: 'column', gap: 5 }}>
            {sortedPool.map((squad, idx) => {
              const prevName = idx > 0 ? (sortedPool[idx-1].clubName ?? sortedPool[idx-1].countryNamePt) : ''
              const thisName = squad.clubName ?? squad.countryNamePt
              const showGroupHeader = thisName !== prevName
              const clubCode = getClubCode(squad)
              const clubColors = getBadgeColors(squad.badgeEmoji)
              return (
                <div key={squad.id}>
                  {showGroupHeader && (
                    <div style={{ padding: idx === 0 ? '4px 4px 8px' : '16px 4px 8px', fontSize: 10, fontWeight: 900, letterSpacing: '0.2em', color: t.textDim, borderBottom: idx > 0 ? `1px solid ${t.border}` : 'none', marginBottom: 6 }}>
                      {thisName.toUpperCase()}
                    </div>
                  )}
                  <button
                    onClick={() => selectFavoriteClub(squad)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '11px 14px 11px 18px', borderRadius: 14, border: `1px solid ${t.border}`, background: t.surface, cursor: 'pointer', textAlign: 'left', position: 'relative', overflow: 'hidden' }}
                  >
                    <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 4, background: clubColors.bg, borderRadius: '14px 0 0 14px', opacity: 0.85 }} />
                    <div style={{ width: 42, height: 42, borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: clubColors.bg, border: `1.5px solid ${clubColors.border}`, boxShadow: `0 2px 8px ${clubColors.shadow}` }}>
                      {squad.clubName
                        ? <span style={{ fontSize: 11, fontWeight: 700, color: clubColors.text, letterSpacing: '0.02em', fontFamily: OSWALD }}>{clubCode}</span>
                        : <span style={{ fontSize: 22 }}>{squad.flagEmoji}</span>
                      }
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: t.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {thisName}
                      </div>
                      <div style={{ fontSize: 11, color: t.gold, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {squad.trophy ?? squad.year}
                      </div>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 600, color: t.textMuted, flexShrink: 0 }}>{squad.year}</span>
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )
    }
  }

  // ── Route to sub-screens ──────────────────────────────────────────────────
  if (state.phase === 'simulating')
    return <SimulationScreen state={state} onSimulate={startSimulation} onNarrate={startNarration} onHome={onHome} theme={t} />

  if (halftimePrompt) {
    const gf   = groupMatches.reduce((s, m) => s + m.goalsFor, 0)
    const ga   = groupMatches.reduce((s, m) => s + m.goalsAgainst, 0)
    const wins = groupMatches.filter(m => m.won).length
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-5" style={{ background: t.bgGrad }}>
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
                <span style={{ fontSize: 18 }}>{m.opponentBadge ?? m.opponentFlag}</span>
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
    return <HalftimeScreen picks={state.picks} groupMatches={groupMatches} formation={state.formation} style={state.style} mode={state.mode} onContinue={afterHalftime} onHome={onHome} theme={t} />
  if (state.phase === 'results' && narrating)
    return <NarrationScreen state={state} matches={state.matches} onFinish={() => setNarrating(false)} onHome={onHome} />
  if (state.phase === 'results')
    return <ResultScreen state={state} onReplay={restart} onHome={onHome} theme={t} />

  // ── Derived values ────────────────────────────────────────────────────────
  const emptySlots     = state.formation.slots.map((slot, i) => ({ slot, i })).filter(({ i }) => !state.picks.find(p => p.slotIndex === i))
  const availableSlots = selectedPlayer ? emptySlots.filter(({ slot }) => canPlayPosition(selectedPlayer.primaryPosition, selectedPlayer.secondaryPositions, slot.position)) : []
  const ataque  = computeAtaque(state.picks)
  const defesa  = computeDefesa(state.picks)
  const canRoll = !state.currentRoll && (state.phase === 'setup' || state.phase === 'rolling')
  const filled  = state.picks.length

  // Positions where all formation slots are already filled
  const occupiedPositions = new Set<string>(
    [...new Set(state.formation.slots.map(s => s.position))].filter(pos => {
      const total = state.formation.slots.filter(s => s.position === pos).length
      const used  = state.picks.filter(p => p.slot.position === pos).length
      return used >= total
    })
  )

  // ── Reusable content blocks ──────────────────────────────────────────────

  const statsStrip = filled > 0 && (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: isDesktop ? '12px 0' : '10px 16px', background: isDesktop ? 'transparent' : 'rgba(0,0,0,0.4)', borderBottom: isDesktop ? 'none' : '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
      <div style={{ display: 'flex', gap: 20, flex: 1 }}>
        {[
          { v: state.overall, l: 'OVR', c: t.gold, glow: t.goldGlow },
          ...(ataque !== null ? [{ v: ataque, l: 'ATK', c: '#EF5350', glow: 'rgba(239,83,80,0.4)' }] : []),
          ...(defesa !== null ? [{ v: defesa, l: 'DEF', c: '#66BB6A', glow: 'rgba(102,187,106,0.4)' }] : []),
        ].map(s => (
          <div key={s.l} style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: 22, lineHeight: 1, color: s.c, textShadow: `0 0 12px ${s.glow}`, fontFamily: OSWALD }}>{s.v}</div>
            <div style={{ fontSize: 8, fontWeight: 600, letterSpacing: '0.14em', color: t.textMuted, marginTop: 3 }}>{s.l}</div>
          </div>
        ))}
      </div>
      {!isDesktop && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: t.textMuted }}>{state.formation.name}</span>
          <button onClick={() => setShowField(f => !f)}
            style={{ fontSize: 10, fontWeight: 900, padding: '6px 12px', borderRadius: 10, border: showField ? '1px solid rgba(201,168,76,0.4)' : '1px solid rgba(255,255,255,0.1)', background: showField ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.06)', color: showField ? '#C9A84C' : 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
            {showField ? '☰ LISTA' : '⬛ CAMPO'}
          </button>
        </div>
      )}
    </div>
  )

  const currentTeamList = filled > 0 && (
    <div style={{ borderRadius: 18, overflow: 'hidden', background: t.surface, border: `1px solid ${t.border}` }}>
      <div style={{ padding: '10px 16px', borderBottom: `1px solid ${t.border}` }}>
        <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.15em', color: t.textMuted }}>TIME ATUAL</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '8px 12px', gap: '0 16px' }}>
        {state.picks.map((pick, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: `1px solid ${t.border}` }}>
            <span style={{ fontSize: 9, fontWeight: 900, color: t.textMuted, width: 28, flexShrink: 0 }}>{pick.slot.label}</span>
            <span style={{ fontSize: 14 }}>{pick.squad.flagEmoji}</span>
            <span style={{ fontWeight: 700, fontSize: 12, color: t.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{pick.player.name.split(' ').pop()}</span>
            {pick.player.isLegend && <span style={{ fontSize: 9, color: t.gold }}>★</span>}
          </div>
        ))}
      </div>
    </div>
  )

  const diceButton = (
    <button
      onClick={roll}
      style={{
        width: '100%',
        padding: '30px 0',
        borderRadius: 22,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        border: 'none',
        cursor: 'pointer',
        transition: 'all 0.18s',
        transform: diceAnim ? 'scale(0.93)' : 'scale(1)',
        background: diceAnim
          ? 'linear-gradient(135deg, #D4A840 0%, #7a5010 100%)'
          : 'linear-gradient(145deg, rgba(212,168,64,0.14) 0%, rgba(10,8,0,0.98) 100%)',
        boxShadow: diceAnim
          ? '0 0 60px rgba(212,168,64,0.55), 0 8px 32px rgba(0,0,0,0.5)'
          : '0 6px 32px rgba(0,0,0,0.6), 0 0 0 1.5px rgba(212,168,64,0.22), 0 0 28px rgba(212,168,64,0.05)',
      }}
    >
      <span style={{ fontSize: 52, lineHeight: 1, filter: diceAnim ? 'brightness(0.9) drop-shadow(0 0 16px rgba(255,210,0,0.8))' : 'drop-shadow(0 4px 12px rgba(0,0,0,0.8))' }}>
        {diceAnim ? '🎰' : '🎲'}
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
        <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '0.18em', color: diceAnim ? '#0a0800' : '#D4A840', fontFamily: OSWALD }}>
          ROLAR O DADO
        </span>
        <span style={{ fontSize: 9, fontWeight: 500, letterSpacing: '0.14em', color: diceAnim ? 'rgba(0,0,0,0.5)' : 'rgba(212,168,64,0.38)' }}>
          SORTEAR TIME HISTÓRICO
        </span>
      </div>
    </button>
  )

  const squadRevealCard = state.currentRoll && (() => {
    const sq = state.currentRoll.squad
    const cc = getBadgeColors(sq.badgeEmoji)
    return (
      <div style={{ borderRadius: 22, overflow: 'hidden', position: 'relative', border: `1px solid ${t.gold}33`, boxShadow: `0 0 40px rgba(212,168,64,0.08), 0 8px 36px rgba(0,0,0,0.5)` }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(145deg, rgba(212,168,64,0.1) 0%, rgba(8,6,0,0.95) 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.22em', color: t.gold, opacity: 0.55 }}>SORTEIO</span>
            <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.1em', color: t.textMuted }}>{sq.year}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: cc.bg, border: `1.5px solid ${cc.border}`, boxShadow: `0 4px 20px ${cc.shadow}` }}>
              {sq.clubName
                ? <span style={{ fontSize: 12, fontWeight: 700, color: cc.text, letterSpacing: '0.02em', textAlign: 'center', lineHeight: 1.1, fontFamily: OSWALD }}>{getClubCode(sq)}</span>
                : <span style={{ fontSize: 28 }}>{sq.flagEmoji}</span>
              }
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 20, lineHeight: 1.15, color: t.text, letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: OSWALD }}>
                {sq.clubName ?? sq.countryNamePt}
              </div>
              <div style={{ fontWeight: 600, fontSize: 12, color: t.gold, marginTop: 4 }}>
                {sq.trophy ?? `Copa do Mundo ${sq.year}`}
              </div>
              {sq.notableReason && (
                <div style={{ fontSize: 10, color: t.textDim, marginTop: 6, lineHeight: 1.45, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  {sq.notableReason}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  })()

  const rerollControls = state.currentRoll && state.currentRoll.rerollsLeft > 0 && (
    <div style={{ borderRadius: 16, padding: '12px 14px', background: t.surface, border: `1px solid ${t.border}` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.15em', color: t.textDim }}>NÃO CURTIU?</span>
        <div style={{ display: 'flex', gap: 5 }}>
          {[0,1,2].map(i => (
            <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: i < state.currentRoll!.rerollsLeft ? t.gold : t.border2, boxShadow: i < state.currentRoll!.rerollsLeft ? `0 0 6px ${t.goldGlow}` : 'none' }} />
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {[{ l: '↺ OUTRO TIME', t: 'squad' as const }, { l: '↺ OUTRA COPA', t: 'copa' as const }].map(b => (
          <button key={b.t} onClick={() => reroll(b.t)}
            style={{ flex: 1, fontWeight: 900, fontSize: 11, padding: '10px 0', borderRadius: 12, border: `1px solid ${t.border}`, background: t.surface, color: t.textDim, cursor: 'pointer' }}>
            {b.l}
          </button>
        ))}
      </div>
    </div>
  )

  const playerListSection = state.currentRoll && (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}>
      {selectedPlayer && isDesktop && availableSlots.length === 0 && (
        <div style={{ borderRadius: 14, padding: '12px 16px', textAlign: 'center', background: t.surface, border: `1px solid ${t.border}` }}>
          <span style={{ fontSize: 11, fontWeight: 900, color: t.textDim }}>SEM POSIÇÃO COMPATÍVEL PARA {selectedPlayer.name.toUpperCase()}</span>
        </div>
      )}
      {selectedPlayer && !isDesktop && showField && availableSlots.length === 0 && (
        <div style={{ borderRadius: 14, padding: '12px 16px', textAlign: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <span style={{ fontSize: 11, fontWeight: 900, color: 'rgba(255,255,255,0.45)' }}>SEM POSIÇÃO COMPATÍVEL</span>
        </div>
      )}
      <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.15em', color: t.textMuted }}>ESCOLHA UM JOGADOR</div>
      <PlayerList
        squad={state.currentRoll.squad}
        mode={state.mode}
        selectedPlayer={selectedPlayer}
        pickedIds={state.picks.map(p => p.player.id)}
        onSelect={pickPlayer}
        availableSlots={availableSlots.map(s => s.slot.position)}
        occupiedPositions={occupiedPositions}
        theme={t}
      />
    </div>
  )

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: t.bgGrad }}>

      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', background: t.topbar, borderBottom: `1px solid ${t.topbarBorder}`, flexShrink: 0, backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 20 }}>
        <button onClick={onHome} style={{ fontWeight: 700, fontSize: 17, color: t.gold, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: OSWALD }}>0a7</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
            {Array.from({ length: 11 }).map((_, i) => (
              <div key={i} style={{ width: i < filled ? 8 : 5, height: i < filled ? 8 : 5, borderRadius: '50%', background: i < filled ? t.gold : t.border2, boxShadow: i < filled ? `0 0 6px ${t.goldGlow}` : 'none', transition: 'all 0.18s' }} />
            ))}
          </div>
          <span style={{ fontSize: 10, fontWeight: 600, color: t.textDim }}>{filled}/11</span>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {onToggleTheme && (
            <button onClick={onToggleTheme} style={{ fontSize: 15, background: 'none', border: 'none', cursor: 'pointer', color: t.textDim, padding: 0 }}>
              {t.mode === 'dark' ? '☀' : '🌙'}
            </button>
          )}
          <button onClick={() => setShowSettings(s => !s)} style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', color: showSettings ? t.gold : t.textDim, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            ⚙ AJUSTES
          </button>
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div style={{ padding: '16px', background: t.topbar, borderBottom: `1px solid ${t.topbarBorder}`, display: 'flex', flexDirection: 'column', gap: 14, flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.15em', color: t.textMuted, marginBottom: 8 }}>FORMAÇÃO</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {Object.keys(FORMATIONS).map(f => (
                <button key={f} onClick={() => setState(s => ({ ...s, formation: FORMATIONS[f] }))}
                  style={{ fontSize: 10, fontWeight: 900, padding: '6px 12px', borderRadius: 10, border: state.formation.name === f ? `1px solid ${t.red}88` : `1px solid ${t.border}`, background: state.formation.name === f ? t.redDim : t.surface, color: state.formation.name === f ? t.text : t.textDim, cursor: 'pointer' }}>
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.15em', color: t.textMuted, marginBottom: 8 }}>ESTILO</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['defensive', 'balanced', 'offensive'] as GameStyle[]).map(s => (
                <button key={s} onClick={() => setState(st => ({ ...st, style: s }))}
                  style={{ flex: 1, fontSize: 10, fontWeight: 900, padding: '8px 4px', borderRadius: 10, border: state.style === s ? `1px solid ${t.gold}88` : `1px solid ${t.border}`, background: state.style === s ? t.goldDim : t.surface, color: state.style === s ? t.gold : t.textDim, cursor: 'pointer' }}>
                  {STYLE_LABELS[s]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══ DESKTOP LAYOUT ══ */}
      {isDesktop ? (
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* Left column: field + stats + current team */}
          <div style={{ width: 380, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16, padding: '20px 20px', borderRight: `1px solid ${t.border}`, overflowY: 'auto', background: t.surface }}>
            <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.15em', color: t.textMuted }}>
              CAMPO · {state.formation.name} · {STYLE_LABELS[state.style]}
            </div>
            <AdStrip theme={t} />
            <Field formation={state.formation} picks={state.picks} selectedPlayer={selectedPlayer} onSlotClick={placePlayer} />
            <AdStrip theme={t} />
            <TickerBanner />
            {statsStrip}
            {currentTeamList}
          </div>

          {/* Right column: dice / squad card / player list */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {canRoll && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 8 }}>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontWeight: 700, fontSize: 14, color: t.textDim, margin: 0 }}>
                    {filled === 0 ? 'Role o dado para começar' : `${11 - filled} posição${11 - filled > 1 ? 'ões' : ''} restante${11 - filled > 1 ? 's' : ''}`}
                  </p>
                  <p style={{ fontSize: 11, color: t.textMuted, margin: '4px 0 0' }}>Um craque histórico por rodada</p>
                </div>
                {diceButton}
              </div>
            )}
            {squadRevealCard}
            {rerollControls}
            {playerListSection}
          </div>
        </div>

      ) : (
        /* ══ MOBILE LAYOUT ══ */
        <>
          {filled > 0 && statsStrip}

          {/* Field toggle on mobile */}
          {showField && filled > 0 && (
            <div style={{ padding: '12px 16px', background: t.surface, borderBottom: `1px solid ${t.border}`, flexShrink: 0 }}>
              <Field formation={state.formation} picks={state.picks} selectedPlayer={selectedPlayer} onSlotClick={placePlayer} />
            </div>
          )}

          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {canRoll && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 16, gap: 20 }}>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontWeight: 700, fontSize: 14, color: t.textDim, margin: 0 }}>
                    {filled === 0 ? 'Role o dado para começar' : `${11 - filled} posição${11 - filled > 1 ? 'ões' : ''} restante${11 - filled > 1 ? 's' : ''}`}
                  </p>
                  <p style={{ fontSize: 11, color: t.textMuted, margin: '4px 0 0' }}>Um craque histórico por rodada</p>
                </div>
                {diceButton}
                {currentTeamList}
              </div>
            )}
            {squadRevealCard}
            {rerollControls}
            {playerListSection}

            {/* Field pick overlay on mobile */}
            {showField && state.currentRoll && selectedPlayer && (
              <div ref={fieldPickRef} style={{ borderRadius: 18, overflow: 'hidden', background: t.surface, border: `1px solid ${t.border}` }}>
                <div style={{ padding: '12px 16px 8px', fontSize: 9, fontWeight: 900, letterSpacing: '0.15em', color: t.textMuted }}>ESCOLHA A POSIÇÃO</div>
                <AdStrip theme={t} />
                <div style={{ padding: '8px 12px' }}>
                  <Field formation={state.formation} picks={state.picks} selectedPlayer={selectedPlayer} onSlotClick={placePlayer} />
                </div>
                <AdStrip theme={t} />
                <TickerBanner />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
