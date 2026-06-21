import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGame } from '../store/gameStore'
import { LEGENDS, getLegendStatus, getLegendAge } from '../data/legends'
import LegendProfileModal from '../components/LegendProfileModal'
import type { Region, MatchType } from '../types/game'

const REGIONS: { id: Region; label: string; flag: string }[] = [
  { id: 'brasil', label: 'Brasil', flag: '🇧🇷' },
  { id: 'americas', label: 'Américas', flag: '🌎' },
  { id: 'europa-sul', label: 'Europa Sul', flag: '🇮🇹🇪🇸' },
  { id: 'europa-norte', label: 'Europa Norte', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿🇩🇪🇳🇱' },
  { id: 'europa-oeste', label: 'Europa Oeste', flag: '🇫🇷🇵🇹' },
]

const STATUS_CONFIG = {
  available: { dot: '#22c55e', label: 'DISPONÍVEL', glow: '0 0 8px rgba(34,197,94,0.6)', badge: 'rgba(34,197,94,0.12)', badgeText: '#22c55e' },
  urgent:    { dot: '#f59e0b', label: '⚠️ URGENTE',   glow: '0 0 8px rgba(245,158,11,0.8)', badge: 'rgba(245,158,11,0.12)', badgeText: '#f59e0b' },
  locked:    { dot: '#4b5563', label: 'BLOQUEADO',    glow: 'none',                           badge: 'rgba(75,85,99,0.12)',  badgeText: '#6b7280' },
  closed:    { dot: '#E03535', label: 'LENDA — RIVAL', glow: '0 0 8px rgba(224,53,53,0.5)',   badge: 'rgba(224,53,53,0.12)', badgeText: '#E03535' },
}

// Player born 1975 per the story (33 in 2008, woke up in 1992 = age 17)
const PLAYER_BIRTH_YEAR = 1975

const MATCH_TYPES: { type: MatchType; label: string; icon: string; desc: string; moments: number; mult: number }[] = [
  { type: 'racha',     label: 'RACHA',     icon: '⚡', desc: 'Rápido · 3 lances',  moments: 3, mult: 0.6 },
  { type: 'amistoso',  label: 'AMISTOSO',  icon: '⚽', desc: 'Normal · 5–6 lances', moments: 5, mult: 1.0 },
  { type: 'decisiva',  label: 'DECISIVA',  icon: '🏆', desc: 'Alto risco · 8 lances', moments: 8, mult: 1.5 },
]

export default function WorldMapScreen() {
  const { state, dispatch } = useGame()
  const { currentYear, coins, reputation, player, stolenTraits, selectedLegendId, stolenFrom, pendingEvents } = state
  const [yearSummary, setYearSummary] = useState<{ earned: number; lost: number } | null>(null)
  const [matchFlash, setMatchFlash] = useState(false)
  const [showEvents, setShowEvents] = useState(pendingEvents.length > 0)

  const playerAge = currentYear - PLAYER_BIRTH_YEAR
  const urgentLegends = LEGENDS.filter(l => getLegendStatus(l, currentYear) === 'urgent')
  const availableCount = LEGENDS.filter(l => { const s = getLegendStatus(l, currentYear); return s === 'available' || s === 'urgent' }).length
  const matchEarning = 120 + stolenTraits.length * 80
  const weeklyCost = stolenTraits.reduce((s, t) => s + t.weeklyMaintenance, 0)
  const criticalTraits = stolenTraits.filter(t => t.maintenanceBar < 30)

  const handleAdvanceYear = () => {
    const lostCount = stolenTraits.filter(t => t.maintenanceBar - 8 <= 0).length
    const passiveEarned = 200 + stolenTraits.length * 50
    dispatch({ type: 'ADVANCE_YEAR' })
    setYearSummary({ earned: passiveEarned, lost: lostCount })
    setTimeout(() => {
      setYearSummary(null)
      setShowEvents(true)
    }, 1200)
  }

  const handlePlayMatch = (matchType: MatchType) => {
    dispatch({ type: 'PLAY_MATCH', matchType })
    setMatchFlash(true)
    setTimeout(() => setMatchFlash(false), 800)
  }

  const handleDismissEvents = () => {
    dispatch({ type: 'DISMISS_EVENTS' })
    setShowEvents(false)
  }

  return (
    <div className="min-h-screen" style={{ background: 'radial-gradient(ellipse at top, #0d0d1a 0%, #06060f 80%)' }}>

      {/* Top bar */}
      <div className="sticky top-0 z-40 border-b" style={{ background: 'rgba(6,6,15,0.95)', borderColor: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(8px)' }}>
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div>
              <div className="text-xs tracking-widest opacity-40" style={{ color: '#f0e6c8', fontFamily: 'Oswald' }}>O LADRÃO DE LENDAS</div>
              <div className="text-lg font-black leading-none" style={{ color: '#D4A840', fontFamily: 'Oswald' }}>{currentYear}</div>
            </div>
            {player && (
              <div className="hidden sm:block pl-3 border-l border-white/10">
                <div className="text-xs opacity-40" style={{ color: '#f0e6c8', fontFamily: 'Inter' }}>{player.name} · {playerAge} anos</div>
                <div className="text-sm font-bold" style={{ color: '#f0e6c8', fontFamily: 'Oswald' }}>{player.position} · {player.country}</div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 md:gap-5">
            <motion.div animate={matchFlash ? { scale: [1, 1.3, 1] } : {}} className="text-center">
              <div className="text-xs tracking-widest opacity-40" style={{ color: '#D4A840', fontFamily: 'Oswald' }}>C$</div>
              <div className="text-base font-black" style={{ color: '#D4A840', fontFamily: 'Oswald' }}>{coins.toLocaleString()}</div>
            </motion.div>
            <div className="text-center hidden sm:block">
              <div className="text-xs tracking-widest opacity-40" style={{ color: '#f0e6c8', fontFamily: 'Oswald' }}>REP</div>
              <div className="text-base font-black" style={{ color: '#f0e6c8', fontFamily: 'Oswald' }}>{reputation}</div>
            </div>
            <div className="text-center">
              <div className="text-xs tracking-widest opacity-40" style={{ color: '#7c3aed', fontFamily: 'Oswald' }}>TRAÇOS</div>
              <div className="text-base font-black" style={{ color: '#7c3aed', fontFamily: 'Oswald' }}>{stolenTraits.length}</div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'maintenance' })}
                className="px-3 py-1.5 text-xs border transition-all"
                style={{
                  fontFamily: 'Oswald',
                  color: criticalTraits.length > 0 ? '#E03535' : '#f0e6c8',
                  borderColor: criticalTraits.length > 0 ? 'rgba(224,53,53,0.4)' : 'rgba(255,255,255,0.1)',
                  background: criticalTraits.length > 0 ? 'rgba(224,53,53,0.08)' : 'transparent',
                }}
              >
                {criticalTraits.length > 0 ? '⚠️ ' : ''}MANUTENÇÃO
              </button>
              <button
                onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'market' })}
                className="px-3 py-1.5 text-xs border transition-all hover:opacity-80"
                style={{ fontFamily: 'Oswald', color: '#D4A840', borderColor: 'rgba(212,168,64,0.3)', background: 'rgba(212,168,64,0.06)' }}
              >
                🛒 MERCADO
              </button>
              <button
                onClick={handleAdvanceYear}
                className="px-3 py-1.5 text-xs border transition-all hover:opacity-80"
                style={{ fontFamily: 'Oswald', color: 'rgba(240,230,200,0.5)', borderColor: 'rgba(255,255,255,0.1)' }}
              >
                +1 ANO →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Year advance summary toast */}
      <AnimatePresence>
        {yearSummary && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-16 left-1/2 z-50 -translate-x-1/2 px-5 py-3 border rounded-sm text-center"
            style={{ background: '#0d0d1a', borderColor: 'rgba(212,168,64,0.3)', minWidth: 260 }}
          >
            <div className="text-sm font-black mb-1" style={{ color: '#D4A840', fontFamily: 'Oswald' }}>
              {currentYear - 1} → {currentYear} — ANO PASSOU
            </div>
            <div className="text-xs" style={{ color: 'rgba(240,230,200,0.7)', fontFamily: 'Inter' }}>
              +C$ {yearSummary.earned} renda passiva
              {yearSummary.lost > 0 && <span style={{ color: '#E03535' }}> · {yearSummary.lost} traço(s) perdido(s)</span>}
            </div>
            <div className="text-xs mt-1 opacity-50" style={{ color: '#f0e6c8', fontFamily: 'Inter' }}>
              Traços decaem 8% por ano sem manutenção
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Urgent alert */}
      {urgentLegends.length > 0 && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="border-b overflow-hidden"
          style={{ background: 'rgba(245,158,11,0.06)', borderColor: 'rgba(245,158,11,0.2)' }}
        >
          <div className="max-w-4xl mx-auto px-4 py-2 flex items-center gap-3 flex-wrap">
            <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.2, repeat: Infinity }}
              className="text-xs font-bold tracking-widest" style={{ color: '#f59e0b', fontFamily: 'Oswald' }}>
              ⚠️ JANELAS FECHANDO:
            </motion.span>
            {urgentLegends.map(l => (
              <button key={l.id} onClick={() => dispatch({ type: 'SELECT_LEGEND', legendId: l.id })}
                className="text-xs font-bold tracking-wide hover:opacity-80 transition-opacity"
                style={{ color: '#f59e0b', fontFamily: 'Inter' }}>
                {l.nickname} (fecha {l.closeYear}) →
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Critical trait alert */}
      <AnimatePresence>
        {criticalTraits.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b overflow-hidden"
            style={{ background: 'rgba(224,53,53,0.06)', borderColor: 'rgba(224,53,53,0.25)' }}
          >
            <div className="max-w-4xl mx-auto px-4 py-2 flex items-center gap-3 flex-wrap">
              <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 0.9, repeat: Infinity }}
                className="text-xs font-bold tracking-widest" style={{ color: '#E03535', fontFamily: 'Oswald' }}>
                💀 TRAÇOS MORRENDO:
              </motion.span>
              {criticalTraits.map(t => (
                <button key={t.traitId} onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'maintenance' })}
                  className="text-xs font-bold tracking-wide hover:opacity-80 transition-opacity"
                  style={{ color: '#E03535', fontFamily: 'Inter' }}>
                  {t.traitIcon} {t.traitName} ({t.maintenanceBar}%) →
                </button>
              ))}
              <span className="text-xs opacity-60" style={{ color: '#E03535', fontFamily: 'Inter' }}>
                Traços fracos rendem menos nas partidas
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-8">

        {/* ── COMO GANHAR DINHEIRO ── */}
        <div className="border rounded-sm overflow-hidden" style={{ borderColor: 'rgba(212,168,64,0.2)', background: 'rgba(212,168,64,0.03)' }}>
          <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: 'rgba(212,168,64,0.15)' }}>
            <div>
              <div className="text-xs tracking-widest" style={{ color: '#D4A840', fontFamily: 'Oswald' }}>COMO GANHAR C$</div>
              <div className="text-xs opacity-50 mt-0.5" style={{ color: '#f0e6c8', fontFamily: 'Inter' }}>
                Jogue partidas para acumular dinheiro e financiar missões de roubo
              </div>
            </div>
            {weeklyCost > 0 && (
              <div className="text-right hidden sm:block">
                <div className="text-xs opacity-40" style={{ color: '#E03535', fontFamily: 'Inter' }}>custo/ano</div>
                <div className="text-sm font-black" style={{ color: '#E03535', fontFamily: 'Oswald' }}>−C$ {weeklyCost * 52}</div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-0 divide-x divide-white/5">
            {/* 3 tipos de partida */}
            {MATCH_TYPES.map(mt => {
              const earned = Math.round(matchEarning * mt.mult)
              return (
                <motion.button
                  key={mt.type}
                  whileHover={{ background: 'rgba(212,168,64,0.08)' }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handlePlayMatch(mt.type)}
                  className="p-4 text-left flex flex-col gap-1 transition-all"
                  style={{ background: 'transparent' }}
                >
                  <div className="text-2xl">{mt.icon}</div>
                  <div className="text-xs font-black tracking-wide" style={{ color: '#D4A840', fontFamily: 'Oswald' }}>{mt.label}</div>
                  <div className="text-xs opacity-50" style={{ color: '#f0e6c8', fontFamily: 'Inter' }}>{mt.desc}</div>
                  <div className="text-base font-black mt-1" style={{ color: '#22c55e', fontFamily: 'Oswald' }}>+C$ {earned}</div>
                </motion.button>
              )
            })}

            {/* Manutenção dos traços */}
            <div className="p-4 flex flex-col gap-1">
              <div className="text-2xl">🧪</div>
              <div className="text-xs font-black tracking-wide" style={{ color: '#7c3aed', fontFamily: 'Oswald' }}>MANUTENÇÃO</div>
              <div className="text-xs opacity-50" style={{ color: '#f0e6c8', fontFamily: 'Inter' }}>
                Cada traço roubado decai 8%/ano
              </div>
              {stolenTraits.length === 0 ? (
                <div className="text-xs mt-1 opacity-40" style={{ color: '#f0e6c8', fontFamily: 'Inter' }}>
                  Nenhum traço ainda
                </div>
              ) : (
                <div className="mt-1 space-y-1">
                  {stolenTraits.slice(0, 3).map(t => (
                    <div key={t.traitId} className="flex items-center gap-1.5">
                      <span className="text-xs">{t.traitIcon}</span>
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                        <div className="h-full rounded-full" style={{
                          width: `${t.maintenanceBar}%`,
                          background: t.maintenanceBar < 30 ? '#E03535' : t.maintenanceBar < 60 ? '#f59e0b' : '#22c55e'
                        }} />
                      </div>
                      <span className="text-xs font-bold w-8 text-right" style={{
                        color: t.maintenanceBar < 30 ? '#E03535' : 'rgba(240,230,200,0.5)',
                        fontFamily: 'Oswald'
                      }}>{t.maintenanceBar}%</span>
                    </div>
                  ))}
                  {stolenTraits.length > 3 && (
                    <div className="text-xs opacity-40" style={{ color: '#f0e6c8', fontFamily: 'Inter' }}>+{stolenTraits.length - 3} mais</div>
                  )}
                </div>
              )}
            </div>

            {/* Loop do jogo */}
            <div className="p-4 flex flex-col gap-1">
              <div className="text-2xl">🔄</div>
              <div className="text-xs font-black tracking-wide" style={{ color: '#f0e6c8', fontFamily: 'Oswald' }}>LOOP DO JOGO</div>
              <div className="text-xs opacity-50 leading-relaxed" style={{ color: '#f0e6c8', fontFamily: 'Inter' }}>
                Jogue partidas para ganhar C$
              </div>
              <div className="text-xs mt-1 space-y-0.5" style={{ fontFamily: 'Inter' }}>
                <div style={{ color: '#22c55e' }}>① Jogue → ganhe C$</div>
                <div style={{ color: '#D4A840' }}>② Use C$ → missão de roubo</div>
                <div style={{ color: '#7c3aed' }}>③ Roube traço → fica mais forte</div>
                <div style={{ color: '#f59e0b' }}>④ Mantenha traços vivos</div>
                <div style={{ color: '#f0e6c8', opacity: 0.5 }}>⑤ Avance o ano → novas lendas</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── SITUAÇÃO DO JOGADOR ── */}
        {stolenTraits.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 border border-white/8 rounded-sm text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <div className="text-xl font-black" style={{ color: '#f0e6c8', fontFamily: 'Oswald' }}>{playerAge}a</div>
              <div className="text-xs opacity-40" style={{ color: '#f0e6c8', fontFamily: 'Inter' }}>sua idade</div>
            </div>
            <div className="p-3 border border-white/8 rounded-sm text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <div className="text-xl font-black" style={{ color: '#7c3aed', fontFamily: 'Oswald' }}>{stolenTraits.length}</div>
              <div className="text-xs opacity-40" style={{ color: '#f0e6c8', fontFamily: 'Inter' }}>traços ativos</div>
            </div>
            <div className="p-3 border border-white/8 rounded-sm text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <div className="text-xl font-black" style={{ color: '#22c55e', fontFamily: 'Oswald' }}>+C${matchEarning}</div>
              <div className="text-xs opacity-40" style={{ color: '#f0e6c8', fontFamily: 'Inter' }}>por partida</div>
            </div>
            <div className="p-3 border border-white/8 rounded-sm text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <div className="text-xl font-black" style={{ color: criticalTraits.length > 0 ? '#E03535' : '#f59e0b', fontFamily: 'Oswald' }}>{criticalTraits.length}</div>
              <div className="text-xs opacity-40" style={{ color: '#f0e6c8', fontFamily: 'Inter' }}>críticos</div>
            </div>
          </div>
        )}

        {/* ── MAPA DE LENDAS ── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-black" style={{ fontFamily: 'Oswald', color: '#f0e6c8' }}>MAPA DE LENDAS</h2>
              <p className="text-xs opacity-40" style={{ color: '#f0e6c8', fontFamily: 'Inter' }}>
                Você veio do futuro. Só você sabe o que essas crianças vão se tornar.
              </p>
              <p className="text-xs opacity-25 mt-0.5" style={{ color: '#f0e6c8', fontFamily: 'Inter' }}>
                {availableCount} janelas abertas · {stolenFrom.length} roubados · {currentYear}
              </p>
            </div>
            {stolenTraits.length > 0 && (
              <div className="flex gap-1.5">
                {stolenTraits.slice(0, 5).map(t => (
                  <div key={t.traitId} className="w-8 h-8 flex items-center justify-center rounded-sm border text-sm"
                    title={`${t.traitName} (${t.legendNickname})`}
                    style={{ background: 'rgba(124,58,237,0.15)', borderColor: 'rgba(124,58,237,0.3)' }}>
                    {t.traitIcon}
                  </div>
                ))}
                {stolenTraits.length > 5 && (
                  <div className="w-8 h-8 flex items-center justify-center rounded-sm border text-xs font-bold"
                    style={{ color: '#7c3aed', borderColor: 'rgba(124,58,237,0.3)', fontFamily: 'Oswald' }}>
                    +{stolenTraits.length - 5}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-6">
            {REGIONS.map(region => {
              const regionLegends = LEGENDS.filter(l => l.region === region.id)
              if (regionLegends.length === 0) return null
              return (
                <div key={region.id}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-lg">{region.flag}</span>
                    <h3 className="text-sm font-bold tracking-widest" style={{ color: 'rgba(240,230,200,0.5)', fontFamily: 'Oswald' }}>
                      {region.label.toUpperCase()}
                    </h3>
                    <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {regionLegends.map((legend, i) => {
                      const status = getLegendStatus(legend, currentYear)
                      const age = getLegendAge(legend, currentYear)
                      const cfg = STATUS_CONFIG[status]
                      const alreadyStolen = stolenFrom.includes(legend.id)
                      const canAfford = coins >= legend.traits[0].cost

                      return (
                        <motion.button
                          key={legend.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          whileHover={status !== 'locked' ? { scale: 1.02 } : {}}
                          whileTap={status !== 'locked' ? { scale: 0.98 } : {}}
                          onClick={() => dispatch({ type: 'SELECT_LEGEND', legendId: legend.id })}
                          className="p-3 border rounded-sm text-left transition-all relative overflow-hidden"
                          style={{
                            background: alreadyStolen ? 'rgba(34,197,94,0.05)' : status === 'urgent' ? 'rgba(245,158,11,0.06)' : status === 'locked' ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)',
                            borderColor: alreadyStolen ? 'rgba(34,197,94,0.25)' : status === 'urgent' ? 'rgba(245,158,11,0.3)' : status === 'locked' ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.08)',
                            cursor: status === 'locked' ? 'not-allowed' : 'pointer',
                            opacity: status === 'locked' ? 0.5 : 1,
                          }}
                        >
                          <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: alreadyStolen ? '#22c55e' : status === 'locked' ? 'transparent' : legend.colorAccent, opacity: status === 'locked' ? 0 : 0.6 }} />

                          <div className="flex items-center justify-between mb-2">
                            <div className="w-2 h-2 rounded-full" style={{ background: alreadyStolen ? '#22c55e' : cfg.dot, boxShadow: alreadyStolen ? '0 0 6px rgba(34,197,94,0.8)' : cfg.glow }} />
                            <span className="text-xs font-bold" style={{ color: cfg.badgeText, fontFamily: 'Oswald' }}>{age}a</span>
                          </div>

                          <div className="text-sm font-black leading-tight mb-0.5" style={{ color: '#f0e6c8', fontFamily: 'Oswald' }}>{legend.nickname}</div>
                          <div className="text-xs opacity-50 leading-tight mb-2" style={{ color: '#f0e6c8', fontFamily: 'Inter' }}>{legend.city}</div>

                          {(status === 'available' || status === 'urgent') && !alreadyStolen && (
                            <>
                              <div className="text-xs font-bold" style={{ color: canAfford ? '#22c55e' : '#E03535', fontFamily: 'Oswald' }}>
                                {canAfford ? '✓' : '✗'} C$ {legend.traits[0].cost.toLocaleString()}+
                              </div>
                              <div className="text-xs mt-1 opacity-40 italic" style={{ color: '#D4A840', fontFamily: 'Inter' }}>
                                só você sabe
                              </div>
                            </>
                          )}

                          <div className="mt-1.5 px-1.5 py-0.5 text-xs font-bold w-fit" style={{ background: alreadyStolen ? 'rgba(34,197,94,0.15)' : cfg.badge, color: alreadyStolen ? '#22c55e' : cfg.badgeText, fontFamily: 'Oswald' }}>
                            {alreadyStolen ? '✅ ROUBADO' : cfg.label}
                          </div>

                          {status === 'urgent' && !alreadyStolen && (
                            <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
                              className="mt-1 text-xs" style={{ color: '#f59e0b', fontFamily: 'Inter' }}>
                              Fecha em {legend.closeYear}
                            </motion.div>
                          )}
                          {status === 'locked' && (
                            <div className="mt-1 text-xs" style={{ color: '#6b7280', fontFamily: 'Inter' }}>Abre {legend.unlockYear}</div>
                          )}
                        </motion.button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer dica */}
        <div className="p-4 border border-white/5 rounded-sm text-center" style={{ background: 'rgba(124,58,237,0.04)' }}>
          <p className="text-xs opacity-40" style={{ color: '#f0e6c8', fontFamily: 'Inter' }}>
            Você tem {playerAge} anos em {currentYear} · Quando avançar um ano, os traços decaem 8% · Sem manutenção, eles voltam pro dono
          </p>
        </div>
      </div>

      {selectedLegendId && <LegendProfileModal />}

      {/* EventModal */}
      <AnimatePresence>
        {showEvents && pendingEvents.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: 'rgba(0,0,0,0.75)' }}
          >
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              className="w-full max-w-md border rounded-sm overflow-hidden"
              style={{ background: '#0d0d1a', borderColor: 'rgba(212,168,64,0.25)' }}
            >
              <div className="px-5 py-4 border-b" style={{ borderColor: 'rgba(212,168,64,0.15)' }}>
                <div className="text-xs tracking-widest opacity-40 mb-0.5" style={{ color: '#D4A840', fontFamily: 'Oswald' }}>
                  {currentYear} — EVENTOS DO ANO
                </div>
                <div className="text-xl font-black" style={{ color: '#f0e6c8', fontFamily: 'Oswald' }}>
                  O QUE ACONTECEU
                </div>
              </div>

              <div className="px-5 py-4 space-y-3 max-h-80 overflow-y-auto">
                {pendingEvents.map((evt, i) => {
                  const typeColor =
                    evt.type === 'positive' ? '#22c55e' :
                    evt.type === 'negative' ? '#E03535' :
                    evt.type === 'consequence' ? '#7c3aed' : '#D4A840'
                  const typeBg =
                    evt.type === 'positive' ? 'rgba(34,197,94,0.06)' :
                    evt.type === 'negative' ? 'rgba(224,53,53,0.06)' :
                    evt.type === 'consequence' ? 'rgba(124,58,237,0.08)' : 'rgba(212,168,64,0.05)'
                  const typeBorder =
                    evt.type === 'positive' ? 'rgba(34,197,94,0.2)' :
                    evt.type === 'negative' ? 'rgba(224,53,53,0.2)' :
                    evt.type === 'consequence' ? 'rgba(124,58,237,0.25)' : 'rgba(212,168,64,0.15)'

                  const effectLines: string[] = []
                  if (evt.effect?.coins && evt.effect.coins > 0) effectLines.push(`+C$ ${evt.effect.coins}`)
                  if (evt.effect?.coins && evt.effect.coins < 0) effectLines.push(`−C$ ${Math.abs(evt.effect.coins)}`)
                  if (evt.effect?.reputation && evt.effect.reputation > 0) effectLines.push(`+${evt.effect.reputation} rep`)
                  if (evt.effect?.reputation && evt.effect.reputation < 0) effectLines.push(`${evt.effect.reputation} rep`)

                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="p-3 border rounded-sm"
                      style={{ background: typeBg, borderColor: typeBorder }}
                    >
                      <div className="text-xs font-black tracking-widest mb-1" style={{ color: typeColor, fontFamily: 'Oswald' }}>
                        {evt.title}
                      </div>
                      <p className="text-xs leading-relaxed" style={{ color: 'rgba(240,230,200,0.8)', fontFamily: 'Inter' }}>
                        {evt.text}
                      </p>
                      {effectLines.length > 0 && (
                        <div className="mt-2 flex gap-2 flex-wrap">
                          {effectLines.map((l, j) => (
                            <span key={j} className="text-xs font-black px-1.5 py-0.5 rounded-sm"
                              style={{ background: 'rgba(255,255,255,0.06)', color: typeColor, fontFamily: 'Oswald' }}>
                              {l}
                            </span>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )
                })}
              </div>

              <div className="px-5 py-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleDismissEvents}
                  className="w-full py-3 text-sm font-bold tracking-widest"
                  style={{ background: '#D4A840', color: '#06060f', fontFamily: 'Oswald' }}
                >
                  CONTINUAR →
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
