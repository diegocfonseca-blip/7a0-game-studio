import { motion } from 'framer-motion'
import { useGame } from '../store/gameStore'
import { LEGENDS, getLegendStatus, getLegendAge } from '../data/legends'
import LegendProfileModal from '../components/LegendProfileModal'
import type { Region } from '../types/game'

const REGIONS: { id: Region; label: string; flag: string }[] = [
  { id: 'brasil', label: 'Brasil', flag: '🇧🇷' },
  { id: 'americas', label: 'Américas', flag: '🌎' },
  { id: 'europa-sul', label: 'Europa Sul', flag: '🇮🇹🇪🇸' },
  { id: 'europa-norte', label: 'Europa Norte', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿🇩🇪🇳🇱' },
  { id: 'europa-oeste', label: 'Europa Oeste', flag: '🇫🇷🇵🇹' },
]

const STATUS_CONFIG = {
  available: {
    dot: '#22c55e',
    label: 'DISPONÍVEL',
    glow: '0 0 8px rgba(34,197,94,0.6)',
    badge: 'rgba(34,197,94,0.12)',
    badgeText: '#22c55e',
  },
  urgent: {
    dot: '#f59e0b',
    label: '⚠️ URGENTE',
    glow: '0 0 8px rgba(245,158,11,0.8)',
    badge: 'rgba(245,158,11,0.12)',
    badgeText: '#f59e0b',
  },
  locked: {
    dot: '#4b5563',
    label: 'BLOQUEADO',
    glow: 'none',
    badge: 'rgba(75,85,99,0.12)',
    badgeText: '#6b7280',
  },
  closed: {
    dot: '#E03535',
    label: 'LENDA — SEU RIVAL',
    glow: '0 0 8px rgba(224,53,53,0.5)',
    badge: 'rgba(224,53,53,0.12)',
    badgeText: '#E03535',
  },
}

export default function WorldMapScreen() {
  const { state, dispatch } = useGame()
  const { currentYear, coins, reputation, player, stolenTraits, selectedLegendId, stolenFrom } = state

  const urgentLegends = LEGENDS.filter(l => getLegendStatus(l, currentYear) === 'urgent')

  const availableCount = LEGENDS.filter(l => {
    const s = getLegendStatus(l, currentYear)
    return s === 'available' || s === 'urgent'
  }).length

  return (
    <div
      className="min-h-screen"
      style={{ background: 'radial-gradient(ellipse at top, #0d0d1a 0%, #06060f 80%)' }}
    >
      {/* Top bar */}
      <div
        className="sticky top-0 z-40 border-b"
        style={{ background: 'rgba(6,6,15,0.95)', borderColor: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(8px)' }}
      >
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div>
              <div className="text-xs tracking-widest opacity-40" style={{ color: '#f0e6c8', fontFamily: 'Oswald' }}>
                O LADRÃO DE LENDAS
              </div>
              <div className="text-lg font-black leading-none" style={{ color: '#D4A840', fontFamily: 'Oswald' }}>
                {currentYear}
              </div>
            </div>
            {player && (
              <div className="hidden sm:block pl-3 border-l border-white/10">
                <div className="text-xs opacity-40" style={{ color: '#f0e6c8', fontFamily: 'Inter' }}>jogador</div>
                <div className="text-sm font-bold" style={{ color: '#f0e6c8', fontFamily: 'Oswald' }}>{player.name}</div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 md:gap-5">
            {/* Coins */}
            <div className="text-center">
              <div className="text-xs tracking-widest opacity-40" style={{ color: '#D4A840', fontFamily: 'Oswald' }}>C$</div>
              <div className="text-base font-black" style={{ color: '#D4A840', fontFamily: 'Oswald' }}>
                {coins.toLocaleString()}
              </div>
            </div>

            {/* Rep */}
            <div className="text-center hidden sm:block">
              <div className="text-xs tracking-widest opacity-40" style={{ color: '#f0e6c8', fontFamily: 'Oswald' }}>REP</div>
              <div className="text-base font-black" style={{ color: '#f0e6c8', fontFamily: 'Oswald' }}>{reputation}</div>
            </div>

            {/* Traits */}
            <div className="text-center">
              <div className="text-xs tracking-widest opacity-40" style={{ color: '#7c3aed', fontFamily: 'Oswald' }}>TRAÇOS</div>
              <div className="text-base font-black" style={{ color: '#7c3aed', fontFamily: 'Oswald' }}>{stolenTraits.length}</div>
            </div>

            {/* Nav buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'maintenance' })}
                className="px-3 py-1.5 text-xs border transition-all"
                style={{
                  fontFamily: 'Oswald',
                  color: stolenTraits.some(t => t.maintenanceBar < 30) ? '#E03535' : '#f0e6c8',
                  borderColor: stolenTraits.some(t => t.maintenanceBar < 30) ? 'rgba(224,53,53,0.4)' : 'rgba(255,255,255,0.1)',
                  background: stolenTraits.some(t => t.maintenanceBar < 30) ? 'rgba(224,53,53,0.08)' : 'transparent',
                }}
              >
                {stolenTraits.some(t => t.maintenanceBar < 30) ? '⚠️ ' : ''}MANUTENÇÃO
              </button>
              <button
                onClick={() => dispatch({ type: 'ADVANCE_YEAR' })}
                className="px-3 py-1.5 text-xs border transition-all hover:border-gold"
                style={{
                  fontFamily: 'Oswald',
                  color: 'rgba(240,230,200,0.5)',
                  borderColor: 'rgba(255,255,255,0.1)',
                }}
              >
                +1 ANO →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Urgent alert */}
      {urgentLegends.length > 0 && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="border-b overflow-hidden"
          style={{ background: 'rgba(245,158,11,0.06)', borderColor: 'rgba(245,158,11,0.2)' }}
        >
          <div className="max-w-4xl mx-auto px-4 py-2 flex items-center gap-3">
            <motion.span
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
              className="text-xs font-bold tracking-widest"
              style={{ color: '#f59e0b', fontFamily: 'Oswald' }}
            >
              ⚠️ JANELAS FECHANDO:
            </motion.span>
            <div className="flex gap-3 flex-wrap">
              {urgentLegends.map(l => (
                <button
                  key={l.id}
                  onClick={() => dispatch({ type: 'SELECT_LEGEND', legendId: l.id })}
                  className="text-xs font-bold tracking-wide hover:opacity-80 transition-opacity"
                  style={{ color: '#f59e0b', fontFamily: 'Inter' }}
                >
                  {l.nickname} (fecha {l.closeYear}) →
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Main content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Summary */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black" style={{ fontFamily: 'Oswald', color: '#f0e6c8' }}>
              MAPA DE LENDAS
            </h2>
            <p className="text-xs opacity-40" style={{ color: '#f0e6c8', fontFamily: 'Inter' }}>
              {availableCount} alvos disponíveis · {stolenFrom.length} roubados
            </p>
          </div>
          {stolenTraits.length > 0 && (
            <div className="flex gap-2">
              {stolenTraits.slice(0, 5).map(t => (
                <div
                  key={t.traitId}
                  className="w-8 h-8 flex items-center justify-center rounded-sm border text-sm"
                  title={`${t.traitName} (${t.legendNickname})`}
                  style={{
                    background: 'rgba(124,58,237,0.15)',
                    borderColor: 'rgba(124,58,237,0.3)',
                  }}
                >
                  {t.traitIcon}
                </div>
              ))}
              {stolenTraits.length > 5 && (
                <div
                  className="w-8 h-8 flex items-center justify-center rounded-sm border text-xs font-bold"
                  style={{ color: '#7c3aed', borderColor: 'rgba(124,58,237,0.3)', fontFamily: 'Oswald' }}
                >
                  +{stolenTraits.length - 5}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Regions */}
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
                          background: alreadyStolen
                            ? 'rgba(34,197,94,0.05)'
                            : status === 'urgent'
                            ? 'rgba(245,158,11,0.06)'
                            : status === 'locked'
                            ? 'rgba(255,255,255,0.02)'
                            : 'rgba(255,255,255,0.04)',
                          borderColor: alreadyStolen
                            ? 'rgba(34,197,94,0.25)'
                            : status === 'urgent'
                            ? 'rgba(245,158,11,0.3)'
                            : status === 'locked'
                            ? 'rgba(255,255,255,0.05)'
                            : 'rgba(255,255,255,0.08)',
                          cursor: status === 'locked' ? 'not-allowed' : 'pointer',
                          opacity: status === 'locked' ? 0.5 : 1,
                        }}
                      >
                        {/* Color accent line */}
                        <div
                          className="absolute top-0 left-0 right-0 h-0.5"
                          style={{
                            background: alreadyStolen ? '#22c55e' : status === 'locked' ? 'transparent' : legend.colorAccent,
                            opacity: status === 'locked' ? 0 : 0.6,
                          }}
                        />

                        {/* Status dot */}
                        <div className="flex items-center justify-between mb-2">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{
                              background: alreadyStolen ? '#22c55e' : cfg.dot,
                              boxShadow: alreadyStolen ? '0 0 6px rgba(34,197,94,0.8)' : cfg.glow,
                            }}
                          />
                          <span
                            className="text-xs font-bold"
                            style={{ color: cfg.badgeText, fontFamily: 'Oswald' }}
                          >
                            {age}a
                          </span>
                        </div>

                        {/* Name */}
                        <div className="text-sm font-black leading-tight mb-1" style={{ color: '#f0e6c8', fontFamily: 'Oswald' }}>
                          {legend.nickname}
                        </div>
                        <div className="text-xs opacity-50 leading-tight" style={{ color: '#f0e6c8', fontFamily: 'Inter' }}>
                          {legend.city}
                        </div>

                        {/* Status badge */}
                        <div
                          className="mt-2 px-1.5 py-0.5 text-xs font-bold w-fit"
                          style={{
                            background: alreadyStolen ? 'rgba(34,197,94,0.15)' : cfg.badge,
                            color: alreadyStolen ? '#22c55e' : cfg.badgeText,
                            fontFamily: 'Oswald',
                          }}
                        >
                          {alreadyStolen ? '✅ ROUBADO' : cfg.label}
                        </div>

                        {status === 'urgent' && !alreadyStolen && (
                          <motion.div
                            animate={{ opacity: [1, 0.3, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="mt-1 text-xs"
                            style={{ color: '#f59e0b', fontFamily: 'Inter' }}
                          >
                            Fecha em {legend.closeYear}
                          </motion.div>
                        )}

                        {status === 'locked' && (
                          <div className="mt-1 text-xs" style={{ color: '#6b7280', fontFamily: 'Inter' }}>
                            Abre {legend.unlockYear}
                          </div>
                        )}
                      </motion.button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer tip */}
        <div className="mt-8 p-4 border border-white/5 rounded-sm text-center" style={{ background: 'rgba(124,58,237,0.04)' }}>
          <p className="text-xs opacity-40" style={{ color: '#f0e6c8', fontFamily: 'Inter' }}>
            Clique numa lenda para ver o perfil e iniciar uma missão de roubo · Use "+1 ANO" para avançar o tempo
          </p>
        </div>
      </div>

      {/* Legend profile modal */}
      {selectedLegendId && <LegendProfileModal />}
    </div>
  )
}
