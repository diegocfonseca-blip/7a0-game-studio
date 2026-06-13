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

const OSWALD = "'Oswald', 'Impact', 'Arial Narrow', sans-serif"

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

  const teamCard = (
    <div style={{
      borderRadius: 24, overflow: 'hidden', position: 'relative',
      background: isDark
        ? 'linear-gradient(145deg, rgba(212,168,64,0.1) 0%, rgba(6,6,10,0.95) 60%)'
        : 'linear-gradient(145deg, rgba(212,168,64,0.12) 0%, rgba(248,242,228,0.95) 60%)',
      border: `1px solid ${t.gold}44`,
      boxShadow: isDark ? `0 0 60px rgba(212,168,64,0.08), 0 8px 40px rgba(0,0,0,0.5)` : '0 8px 32px rgba(0,0,0,0.12)',
    }}>
      <div style={{ position: 'absolute', top: -60, left: '50%', transform: 'translateX(-50%)', width: 280, height: 200, borderRadius: '50%', background: `radial-gradient(circle, ${isDark ? 'rgba(212,168,64,0.18)' : 'rgba(212,168,64,0.1)'} 0%, transparent 70%)`, pointerEvents: 'none' }} />
      <div style={{ position: 'relative', padding: '22px 20px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.22em', color: t.gold, opacity: 0.7, marginBottom: 6 }}>SEU DREAM TEAM</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontWeight: 700, fontSize: 34, lineHeight: 1, color: t.gold, fontFamily: OSWALD }}>{state.overall}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: t.textMuted, letterSpacing: '0.1em' }}>OVERALL</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
            {legends > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 20, background: t.goldDim, border: `1px solid ${t.gold}55` }}>
                <span style={{ color: t.gold, fontSize: 10 }}>★</span>
                <span style={{ fontWeight: 700, fontSize: 10, color: t.gold, letterSpacing: '0.05em' }}>{legends} LENDA{legends > 1 ? 'S' : ''}</span>
              </div>
            )}
            <div style={{ display: 'flex', gap: 2 }}>
              {nations.slice(0, 6).map((f, i) => <span key={i} style={{ fontSize: 15 }}>{f}</span>)}
              {nations.length > 6 && <span style={{ fontSize: 10, color: t.textMuted, alignSelf: 'center', marginLeft: 2 }}>+{nations.length - 6}</span>}
            </div>
          </div>
        </div>
        <div style={{ height: 1, background: `linear-gradient(90deg, ${t.gold}44, transparent)`, marginBottom: 14 }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
          {state.picks.map((pick, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: `1px solid ${t.border}` }}>
              <span style={{ fontWeight: 700, fontSize: 9, width: 28, flexShrink: 0, color: t.textMuted, letterSpacing: '0.05em' }}>{pick.slot.label}</span>
              <span style={{ fontSize: 13 }}>{pick.squad.flagEmoji}</span>
              <span style={{ fontWeight: 600, fontSize: 12, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: t.text }}>{pick.player.name.split(' ').pop()}</span>
              {pick.player.isLegend && <span style={{ fontSize: 9, color: t.gold, flexShrink: 0 }}>★</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const simOptions = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.22em', color: t.textMuted, marginBottom: 2 }}>COMO QUER SIMULAR?</p>

      <button onClick={onNarrate} style={{
        width: '100%', borderRadius: 22, textAlign: 'left', padding: '22px 20px',
        cursor: 'pointer',
        background: isDark
          ? 'linear-gradient(135deg, rgba(224,53,53,0.18) 0%, rgba(100,10,10,0.12) 100%)'
          : 'linear-gradient(135deg, rgba(176,24,24,0.08) 0%, rgba(176,24,24,0.04) 100%)',
        border: `1.5px solid ${t.red}55`,
        boxShadow: isDark ? `0 8px 36px rgba(224,53,53,0.15), 0 2px 8px rgba(0,0,0,0.3)` : '0 4px 16px rgba(176,24,24,0.1)',
        transition: 'all 0.15s',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{ width: 58, height: 58, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0, background: isDark ? 'rgba(224,53,53,0.15)' : 'rgba(176,24,24,0.08)', border: `1px solid ${t.red}33` }}>📺</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 17, letterSpacing: '0.04em', marginBottom: 5, color: t.text, fontFamily: OSWALD }}>MELHORES MOMENTOS</div>
            <div style={{ fontSize: 12, lineHeight: 1.5, color: t.textDim }}>Narração jogo a jogo. Gols, defesas e todo o drama.</div>
          </div>
          <div style={{ fontWeight: 700, fontSize: 22, color: t.red, opacity: 0.8, flexShrink: 0 }}>›</div>
        </div>
      </button>

      <button onClick={onSimulate} style={{
        width: '100%', borderRadius: 22, textAlign: 'left', padding: '18px 20px',
        cursor: 'pointer',
        background: t.surface,
        border: `1px solid ${t.border2}`,
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        transition: 'all 0.15s',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0, background: t.goldDim, border: `1px solid ${t.gold}33` }}>⚡</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: '0.04em', marginBottom: 4, color: t.text, fontFamily: OSWALD }}>RESULTADO DIRETO</div>
            <div style={{ fontSize: 11, lineHeight: 1.5, color: t.textDim }}>Todos os jogos de uma vez, rápido e direto.</div>
          </div>
          <div style={{ fontWeight: 700, fontSize: 20, color: t.textMuted, flexShrink: 0 }}>›</div>
        </div>
      </button>

      <button onClick={onHome} style={{ textAlign: 'center', fontSize: 12, fontWeight: 500, padding: '10px 0', color: t.textMuted, background: 'none', border: 'none', cursor: 'pointer' }}>
        ← Voltar ao início
      </button>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: t.bgGrad }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 20px', background: t.topbar, borderBottom: `1px solid ${t.topbarBorder}`, flexShrink: 0, backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 20 }}>
        <button onClick={onHome} style={{ fontWeight: 700, fontSize: 17, color: t.gold, background: 'none', border: 'none', cursor: 'pointer', fontFamily: OSWALD }}>0a7</button>
        <span style={{ fontWeight: 600, fontSize: 10, letterSpacing: '0.2em', color: t.textDim }}>TIME COMPLETO</span>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 700, fontSize: 22, lineHeight: 1, color: t.gold, fontFamily: OSWALD, textShadow: `0 0 16px ${t.goldGlow}` }}>{state.overall}</div>
          <div style={{ fontSize: 8, fontWeight: 600, letterSpacing: '0.18em', color: t.textMuted }}>OVERALL</div>
        </div>
      </div>

      {isDesktop ? (
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, padding: '32px', maxWidth: 1000, margin: '0 auto', width: '100%', alignItems: 'start' }}>
          {teamCard}
          {simOptions}
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 500, margin: '0 auto', width: '100%' }}>
          {teamCard}
          {simOptions}
        </div>
      )}
    </div>
  )
}
