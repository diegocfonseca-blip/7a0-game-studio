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
  defensive: 'DEFENSIVO', balanced: 'EQUILIBRADO', offensive: 'OFENSIVO',
}

const BG = 'linear-gradient(160deg, #080808 0%, #0f0f0f 50%, #120c00 100%)'

const POS_COLOR: Record<string, string> = {
  GOL: '#1565C0', LD: '#2E7D32', ZAG: '#2E7D32', LE: '#2E7D32',
  VOL: '#6A1B9A', MC: '#6A1B9A', MD: '#6A1B9A', ME: '#6A1B9A',
  MEI: '#E65100', PD: '#B71C1C', PE: '#B71C1C', CA: '#B71C1C',
}

export default function HalftimeScreen({ picks, groupMatches, formation, style, mode, onContinue, onHome }: Props) {
  const [currentPicks, setCurrentPicks] = useState<PickedPlayer[]>(picks)
  const [currentFormation, setCurrentFormation] = useState<Formation>(formation)
  const [currentStyle, setCurrentStyle] = useState<GameStyle>(style)
  const [subsLeft, setSubsLeft] = useState(3)
  const [subOffIdx, setSubOffIdx] = useState<number | null>(null)

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
    if (!canPlayPosition(benchPlayer.primaryPosition, benchPlayer.secondaryPositions, outPick.slot.position)) return
    setCurrentPicks(currentPicks.map((p, i) => i === subOffIdx ? { ...p, player: benchPlayer } : p))
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
    <div className="min-h-screen flex flex-col" style={{ background: BG }}>

      {/* Top bar */}
      <div className="px-4 py-3 flex items-center justify-between flex-shrink-0" style={{ background: 'rgba(0,0,0,0.6)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <button onClick={onHome} className="font-black text-base" style={{ color: '#C9A84C' }}>0a7</button>
        <div className="text-center">
          <div className="font-black text-xs tracking-widest" style={{ color: '#C9A84C' }}>INTERVALO</div>
          <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>Fase de Grupos concluída</div>
        </div>
        <div className="text-right">
          <div className="font-black text-sm" style={{ color: subsLeft > 0 ? '#C9A84C' : 'rgba(255,255,255,0.3)' }}>{subsLeft} sub{subsLeft !== 1 ? 's' : ''}</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 max-w-2xl mx-auto w-full flex flex-col gap-3">

        {/* Group stage results */}
        <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <span className="text-[9px] font-black tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>FASE DE GRUPOS</span>
            <div className="flex gap-3">
              {[
                { v: `${wins}V`, c: '#4CAF50' },
                { v: `${draws}E`, c: '#C9A84C' },
                { v: `${losses}D`, c: '#D12E2E' },
                { v: `${gf}–${ga}`, c: 'rgba(255,255,255,0.6)' },
              ].map(s => <span key={s.v} className="font-black text-sm" style={{ color: s.c }}>{s.v}</span>)}
            </div>
          </div>
          <div className="px-3 py-2 flex flex-col gap-1">
            {groupMatches.map((m, i) => (
              <div key={i} className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: m.won ? 'rgba(76,175,80,0.08)' : 'rgba(209,46,46,0.08)', border: m.won ? '1px solid rgba(76,175,80,0.2)' : '1px solid rgba(209,46,46,0.15)' }}>
                <span className="font-black text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: m.won ? 'rgba(76,175,80,0.2)' : 'rgba(209,46,46,0.2)', color: m.won ? '#4CAF50' : '#D12E2E' }}>
                  {m.won ? 'V' : 'D'}
                </span>
                <span className="text-base">{m.opponentFlag}</span>
                <span className="flex-1 font-bold text-sm truncate" style={{ color: 'rgba(255,255,255,0.7)' }}>{m.opponent}</span>
                <span className="font-black text-sm" style={{ color: '#fff' }}>{m.goalsFor}–{m.goalsAgainst}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Substitutions */}
        {subsLeft > 0 && (
          <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.2)' }}>
            <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(201,168,76,0.12)' }}>
              <span className="text-[9px] font-black tracking-widest" style={{ color: 'rgba(201,168,76,0.7)' }}>SUBSTITUIÇÕES</span>
              <div className="flex gap-1.5">
                {[0,1,2].map(i => (
                  <div key={i} className="w-2 h-2 rounded-full" style={{ background: i < subsLeft ? '#C9A84C' : 'rgba(255,255,255,0.1)', boxShadow: i < subsLeft ? '0 0 6px rgba(201,168,76,0.6)' : 'none' }} />
                ))}
              </div>
            </div>
            <div className="px-3 py-2">
              <p className="text-[10px] mb-3 px-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Toque num jogador para substituí-lo. Só troca pela mesma posição.</p>
              <div className="flex flex-col gap-1">
                {currentPicks.map((pick, i) => {
                  const isOut = subOffIdx === i
                  const posColor = POS_COLOR[pick.slot.position] ?? '#888'
                  return (
                    <button key={i} onClick={() => handleSubOff(i)}
                      className="w-full flex items-center gap-2 rounded-xl px-3 py-2.5 text-left transition-all"
                      style={{
                        background: isOut ? 'linear-gradient(90deg, rgba(209,46,46,0.3), rgba(209,46,46,0.1))' : 'rgba(255,255,255,0.04)',
                        border: isOut ? '1px solid rgba(209,46,46,0.5)' : '1px solid rgba(255,255,255,0.06)',
                      }}>
                      <span className="font-black text-[9px] px-1.5 py-0.5 rounded flex-shrink-0" style={{ background: posColor + '22', color: posColor, border: `1px solid ${posColor}44`, minWidth: 28, textAlign: 'center' }}>
                        {pick.slot.label}
                      </span>
                      <span className="text-xs">{pick.squad.flagEmoji}</span>
                      <span className="flex-1 font-bold text-sm truncate" style={{ color: isOut ? '#fff' : 'rgba(255,255,255,0.8)' }}>{pick.player.name}</span>
                      {pick.player.isLegend && <span className="text-[9px]" style={{ color: '#C9A84C' }}>★</span>}
                      <span className="text-[10px] font-black flex-shrink-0" style={{ color: isOut ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.25)' }}>
                        {mode === 'almanac' ? '?' : pick.player.rating}
                      </span>
                      {isOut && <span className="text-xs font-black" style={{ color: '#D12E2E' }}>↕</span>}
                    </button>
                  )
                })}
              </div>

              {selectedOut && (
                <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(201,168,76,0.15)' }}>
                  <p className="text-[9px] font-black tracking-widest mb-2 px-1" style={{ color: 'rgba(201,168,76,0.6)' }}>
                    RESERVAS · {selectedOut.player.name.toUpperCase()} SAI
                  </p>
                  {bench.length === 0 ? (
                    <p className="text-xs italic px-1" style={{ color: 'rgba(255,255,255,0.3)' }}>Sem reservas disponíveis.</p>
                  ) : (
                    <div className="flex flex-col gap-1">
                      {bench.map(pl => {
                        const compatible = canPlayPosition(pl.primaryPosition, pl.secondaryPositions, selectedOut.slot.position)
                        return (
                          <button key={pl.id} onClick={() => compatible && handleSubOn(pl)} disabled={!compatible}
                            className="w-full flex items-center gap-2 rounded-xl px-3 py-2.5 text-left transition-all"
                            style={{
                              background: compatible ? 'rgba(76,175,80,0.1)' : 'rgba(255,255,255,0.02)',
                              border: compatible ? '1px solid rgba(76,175,80,0.3)' : '1px solid rgba(255,255,255,0.04)',
                              opacity: compatible ? 1 : 0.4,
                              cursor: compatible ? 'pointer' : 'not-allowed',
                            }}>
                            <span className="font-black text-[9px] px-1.5 py-0.5 rounded flex-shrink-0" style={{ background: (POS_COLOR[pl.primaryPosition] ?? '#888') + '22', color: POS_COLOR[pl.primaryPosition] ?? '#888', minWidth: 28, textAlign: 'center' }}>
                              {pl.primaryPosition}
                            </span>
                            <span className="flex-1 font-bold text-sm truncate" style={{ color: compatible ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)' }}>{pl.name}</span>
                            {pl.isLegend && <span className="text-[9px]" style={{ color: '#C9A84C' }}>★</span>}
                            <span className="text-[10px] font-black" style={{ color: 'rgba(255,255,255,0.25)' }}>{mode === 'almanac' ? '?' : pl.rating}</span>
                            {compatible && <span className="font-black text-xs" style={{ color: '#4CAF50' }}>↵</span>}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tactics */}
        <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <span className="text-[9px] font-black tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>TÁTICAS PARA AS OITAVAS</span>
          </div>
          <div className="px-4 py-3 flex flex-col gap-4">
            <div>
              <div className="text-[9px] font-black tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.25)' }}>FORMAÇÃO</div>
              <div className="flex gap-1.5 flex-wrap">
                {Object.keys(FORMATIONS).map(f => (
                  <button key={f} onClick={() => setCurrentFormation(FORMATIONS[f])}
                    className="font-black text-[10px] px-3 py-1.5 rounded-xl transition-all"
                    style={{
                      background: currentFormation.name === f ? '#1a1a1a' : 'rgba(255,255,255,0.06)',
                      color: currentFormation.name === f ? '#fff' : 'rgba(255,255,255,0.45)',
                      border: currentFormation.name === f ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.08)',
                    }}>
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[9px] font-black tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.25)' }}>ESTILO</div>
              <div className="flex gap-1.5">
                {(['defensive', 'balanced', 'offensive'] as GameStyle[]).map(s => (
                  <button key={s} onClick={() => setCurrentStyle(s)}
                    className="flex-1 font-black text-[10px] px-2 py-2 rounded-xl transition-all"
                    style={{
                      background: currentStyle === s ? 'rgba(201,168,76,0.2)' : 'rgba(255,255,255,0.06)',
                      color: currentStyle === s ? '#C9A84C' : 'rgba(255,255,255,0.45)',
                      border: currentStyle === s ? '1px solid rgba(201,168,76,0.4)' : '1px solid rgba(255,255,255,0.08)',
                    }}>
                    {STYLE_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="pb-6">
          <button onClick={() => onContinue(currentPicks, currentFormation, currentStyle)}
            className="w-full font-black py-4 rounded-2xl text-sm tracking-widest transition-all active:scale-[0.97]"
            style={{ background: 'linear-gradient(135deg, #D12E2E, #a01f1f)', color: '#fff', boxShadow: '0 8px 32px rgba(209,46,46,0.4)' }}>
            JOGAR 2° TEMPO — OITAVAS →
          </button>
        </div>
      </div>
    </div>
  )
}
