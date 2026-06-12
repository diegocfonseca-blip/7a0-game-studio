import { useState, useEffect } from 'react'
import type { GameState } from '../engine/game'
import type { ThemePalette } from '../theme'
import { DARK } from '../theme'

interface Props {
  state: GameState
  onSimulate: () => void
  onNarrate: () => void
  onHome: () => void
  theme?: ThemePalette
}

export default function SimulationScreen({ state, onSimulate, onNarrate, onHome, theme }: Props) {
  const t = theme ?? DARK
  const isDark = t.mode === 'dark'
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 768)
  useEffect(() => {
    const fn = () => setIsDesktop(window.innerWidth >= 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])

  const legends = state.picks.filter(p => p.player.isLegend).length
  const nations = [...new Set(state.picks.map(p => p.squad.flagEmoji))]

  // ── Team card ─────────────────────────────────────────────────────────────
  const teamCard = (
    <div style={{
      borderRadius: 24, overflow: 'hidden', position: 'relative',
      background: isDark
        ? 'linear-gradient(135deg, rgba(201,168,76,0.1) 0%, rgba(0,0,0,0.6) 100%)'
        : 'linear-gradient(135deg, rgba(201,168,76,0.15) 0%, rgba(245,237,200,0.8) 100%)',
      border: `1px solid ${t.gold}33`,
      boxShadow: `0 0 40px ${t.goldGlow}22`,
    }}>
      <div style={{ position: 'absolute', top: -40, left: '50%', transform: 'translateX(-50%)', width: 240, height: 240, borderRadius: '50%', background: `radial-gradient(circle, ${t.goldDim} 0%, transparent 70%)`, pointerEvents: 'none' }} />
      <div style={{ position: 'relative', padding: '20px 20px 16px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.2em', color: t.gold, opacity: 0.7, marginBottom: 4 }}>SEU DREAM TEAM</div>
            <div style={{ fontWeight: 900, fontSize: 22, lineHeight: 1, color: t.text }}>
              {state.picks.length}/11 <span style={{ color: t.textMuted, fontSize: 14 }}>jogadores</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
            {legends > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 20, background: t.goldDim, border: `1px solid ${t.gold}44` }}>
                <span style={{ color: t.gold, fontSize: 10 }}>★</span>
                <span style={{ fontWeight: 900, fontSize: 10, color: t.gold }}>{legends} lenda{legends > 1 ? 's' : ''}</span>
              </div>
            )}
            <div style={{ display: 'flex', gap: 2 }}>
              {nations.slice(0, 6).map((f, i) => <span key={i} style={{ fontSize: 14 }}>{f}</span>)}
            </div>
          </div>
        </div>

        {/* Player grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
          {state.picks.map((pick, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: `1px solid ${t.border}` }}>
              <span style={{ fontWeight: 900, fontSize: 9, width: 28, flexShrink: 0, color: t.textMuted }}>{pick.slot.label}</span>
              <span style={{ fontSize: 12 }}>{pick.squad.flagEmoji}</span>
              <span style={{ fontWeight: 700, fontSize: 11, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: t.text }}>{pick.player.name.split(' ').pop()}</span>
              {pick.player.isLegend && <span style={{ fontSize: 9, color: t.gold, flexShrink: 0 }}>★</span>}
            </div>
          ))}
        </div>

        {/* Overall badge */}
        <div style={{ marginTop: 14, display: 'flex', justifyContent: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 20px', borderRadius: 16, background: t.goldDim, border: `1px solid ${t.gold}44` }}>
            <span style={{ fontWeight: 900, fontSize: 28, color: t.gold, lineHeight: 1 }}>{state.overall}</span>
            <div>
              <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: '0.15em', color: t.gold, opacity: 0.7 }}>OVERALL</div>
              <div style={{ fontSize: 9, color: t.textDim }}>do seu time</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  // ── Simulation options ────────────────────────────────────────────────────
  const simOptions = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ textAlign: 'center', marginBottom: 4 }}>
        <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.25em', color: t.textMuted }}>COMO QUER SIMULAR?</p>
      </div>

      {/* Narrate — primary */}
      <button onClick={onNarrate} style={{
        width: '100%', borderRadius: 22, textAlign: 'left', padding: 20, cursor: 'pointer',
        background: isDark
          ? 'linear-gradient(135deg, rgba(209,46,46,0.22) 0%, rgba(120,20,20,0.15) 100%)'
          : 'linear-gradient(135deg, rgba(176,24,24,0.1) 0%, rgba(176,24,24,0.05) 100%)',
        border: `1px solid ${t.red}66`,
        boxShadow: `0 8px 32px ${t.red}22`,
        transition: 'transform 0.1s',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 60, height: 60, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, flexShrink: 0, background: t.redDim, border: `1px solid ${t.red}44` }}>
            📺
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 900, fontSize: 16, letterSpacing: '0.05em', marginBottom: 4, color: t.text }}>MELHORES MOMENTOS</div>
            <div style={{ fontSize: 11, lineHeight: 1.5, color: t.textDim }}>Narração jogo a jogo ao vivo. Gols, defesas, drama — tudo.</div>
          </div>
          <div style={{ fontWeight: 900, fontSize: 24, color: t.red, opacity: 0.7, flexShrink: 0 }}>›</div>
        </div>
      </button>

      {/* Quick result — secondary */}
      <button onClick={onSimulate} style={{
        width: '100%', borderRadius: 22, textAlign: 'left', padding: 20, cursor: 'pointer',
        background: t.surface,
        border: `1px solid ${t.border2}`,
        transition: 'transform 0.1s',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 60, height: 60, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, flexShrink: 0, background: t.goldDim, border: `1px solid ${t.gold}33` }}>
            ⚡
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 900, fontSize: 16, letterSpacing: '0.05em', marginBottom: 4, color: t.text }}>RESULTADO DIRETO</div>
            <div style={{ fontSize: 11, lineHeight: 1.5, color: t.textDim }}>Veja todos os jogos de uma vez, rápido e direto.</div>
          </div>
          <div style={{ fontWeight: 900, fontSize: 24, color: t.textMuted, flexShrink: 0 }}>›</div>
        </div>
      </button>

      <button onClick={onHome} style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, padding: '8px 0', color: t.textMuted, background: 'none', border: 'none', cursor: 'pointer' }}>
        ← Voltar ao início
      </button>
    </div>
  )

  // ── Topbar ────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: t.bgGrad }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', background: t.topbar, borderBottom: `1px solid ${t.topbarBorder}`, flexShrink: 0, backdropFilter: 'blur(8px)', position: 'sticky', top: 0, zIndex: 20 }}>
        <button onClick={onHome} style={{ fontWeight: 900, fontSize: 18, color: t.gold, background: 'none', border: 'none', cursor: 'pointer' }}>0a7</button>
        <span style={{ fontWeight: 900, fontSize: 11, letterSpacing: '0.18em', color: t.textDim }}>TIME COMPLETO</span>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 900, fontSize: 22, lineHeight: 1, color: t.gold, textShadow: `0 0 16px ${t.goldGlow}` }}>{state.overall}</div>
          <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: '0.15em', color: t.textMuted }}>OVERALL</div>
        </div>
      </div>

      {isDesktop ? (
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28, padding: '28px', maxWidth: 1000, margin: '0 auto', width: '100%', alignItems: 'start' }}>
          {teamCard}
          {simOptions}
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 500, margin: '0 auto', width: '100%' }}>
          {teamCard}
          {simOptions}
        </div>
      )}
    </div>
  )
}
