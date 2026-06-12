import { useState, useEffect } from 'react'
import { TOTAL_SQUADS, TOTAL_PLAYERS } from '../data/squads'
import clubs from '../data/clubs'
import type { GameCategory } from '../App'
import type { ThemePalette } from '../theme'

interface Props {
  onPlay: (category: GameCategory) => void
  theme: ThemePalette
  onToggleTheme: () => void
}

const TOTAL_CLUBS = clubs.length
const TOTAL_CLUB_PLAYERS = clubs.reduce((a, c) => a + c.players.length, 0)

export default function Home({ onPlay, theme: t, onToggleTheme }: Props) {
  const [picked, setPicked] = useState<GameCategory | null>(null)
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 768)

  useEffect(() => {
    const fn = () => setIsDesktop(window.innerWidth >= 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])

  const isDark = t.mode === 'dark'

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: t.bgGrad }}>

      {/* ── Top bar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: isDesktop ? '16px 48px' : '16px 20px',
        background: t.topbar,
        borderBottom: `1px solid ${t.topbarBorder}`,
        backdropFilter: 'blur(12px)',
        position: 'sticky', top: 0, zIndex: 20,
      }}>
        <span style={{ fontSize: 13, fontWeight: 900, letterSpacing: '0.2em', color: t.gold }}>
          0a7 LEGENDS
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={onToggleTheme} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 11, fontWeight: 900, padding: '6px 14px', borderRadius: 20,
            border: `1px solid ${t.border2}`, background: t.surface2,
            color: t.textDim, cursor: 'pointer', letterSpacing: '0.05em',
            transition: 'all 0.2s',
          }}>
            <span>{isDark ? '☀' : '🌙'}</span>
            <span>{isDark ? 'CLARO' : 'ESCURO'}</span>
          </button>
          <span style={{ fontSize: 10, fontWeight: 700, color: t.textMuted, letterSpacing: '0.15em' }}>
            1930 – 2024
          </span>
        </div>
      </div>

      {/* ── Body ── */}
      {isDesktop ? (
        /* Desktop: hero left + picker right */
        <div style={{ flex: 1, display: 'flex', maxWidth: 1100, margin: '0 auto', width: '100%', padding: '60px 48px', gap: 64, alignItems: 'flex-start' }}>

          {/* Left: hero */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Logo */}
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 100, fontWeight: 900, lineHeight: 1, letterSpacing: '-0.04em', color: t.gold, textShadow: isDark ? '0 0 80px rgba(201,168,76,0.35)' : 'none' }}>
                0a7
              </div>
              <div style={{ fontSize: 62, fontWeight: 900, lineHeight: 1, letterSpacing: '-0.03em', color: t.text }}>
                LEGENDS
              </div>
            </div>

            {/* Accent bars */}
            <div style={{ display: 'flex', gap: 6, marginTop: 20, marginBottom: 24 }}>
              <div style={{ height: 4, width: 64, borderRadius: 4, background: t.gold }} />
              <div style={{ height: 4, width: 32, borderRadius: 4, background: t.red }} />
              <div style={{ height: 4, width: 16, borderRadius: 4, background: t.textMuted }} />
            </div>

            <p style={{ fontSize: 16, lineHeight: 1.65, color: t.textDim, maxWidth: 360, marginBottom: 40 }}>
              Monte um time dos sonhos com lendas históricas e dispute uma Copa do Mundo.
            </p>

            {/* Stats */}
            <div style={{ display: 'flex', gap: 0, marginBottom: 48 }}>
              {[
                { v: `${TOTAL_SQUADS + TOTAL_CLUBS}`, l: 'TIMES' },
                { v: `${TOTAL_PLAYERS + TOTAL_CLUB_PLAYERS}+`, l: 'JOGADORES' },
                { v: '94', l: 'ANOS' },
              ].map((s, i) => (
                <div key={s.l} style={{ paddingRight: 32, borderRight: i < 2 ? `1px solid ${t.border}` : 'none', marginRight: i < 2 ? 32 : 0 }}>
                  <div style={{ fontSize: 28, fontWeight: 900, lineHeight: 1, color: t.gold }}>{s.v}</div>
                  <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.18em', color: t.textMuted, marginTop: 4 }}>{s.l}</div>
                </div>
              ))}
            </div>

            {/* How it works */}
            <div style={{ display: 'flex', gap: 24 }}>
              {[
                { n: '01', t: 'ROLE', d: 'Sorteia um time histórico lendário' },
                { n: '02', t: 'MONTE', d: 'Escale um craque por sorteio' },
                { n: '03', t: 'SIMULE', d: 'Seu time faz o 7 a 0?' },
              ].map(s => (
                <div key={s.n} style={{ flex: 1, padding: '16px', borderRadius: 14, background: t.surface, border: `1px solid ${t.border}` }}>
                  <div style={{ fontSize: 22, fontWeight: 900, lineHeight: 1, color: t.red, marginBottom: 4 }}>{s.n}</div>
                  <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.15em', color: t.text, marginBottom: 4 }}>{s.t}</div>
                  <div style={{ fontSize: 11, lineHeight: 1.4, color: t.textDim }}>{s.d}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: mode picker */}
          <div style={{ width: 380, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.2em', color: t.textMuted, marginBottom: 4 }}>ESCOLHA O MODO</p>

            <ModeCard
              label="Seleções Históricas"
              icon="🌍"
              desc="Brasil 70, Argentina 86, Holanda 74..."
              sub={`${TOTAL_SQUADS} seleções · ${TOTAL_PLAYERS}+ jogadores`}
              active={picked === 'national'}
              color={t.red}
              colorDim={t.redDim}
              theme={t}
              onClick={() => setPicked('national')}
            />
            <ModeCard
              label="Clubes Históricos"
              icon="🏆"
              desc="Barça MSN, Flamengo 82, Milan 89..."
              sub={`${TOTAL_CLUBS} clubes · ${TOTAL_CLUB_PLAYERS}+ jogadores`}
              active={picked === 'clubs'}
              color={t.gold}
              colorDim={t.goldDim}
              theme={t}
              onClick={() => setPicked('clubs')}
            />

            <button
              onClick={() => picked && onPlay(picked)}
              disabled={!picked}
              style={{
                width: '100%', padding: '18px', borderRadius: 16,
                fontWeight: 900, fontSize: 14, letterSpacing: '0.12em',
                background: picked ? `linear-gradient(135deg, ${t.red} 0%, #8a1010 100%)` : t.surface,
                color: picked ? '#fff' : t.textMuted,
                border: 'none', cursor: picked ? 'pointer' : 'not-allowed',
                boxShadow: picked ? `0 8px 32px ${t.redDim}` : 'none',
                transition: 'all 0.2s',
              }}
            >
              {picked ? 'JOGAR AGORA →' : 'ESCOLHA UM MODO'}
            </button>
          </div>
        </div>

      ) : (
        /* Mobile: single column */
        <div style={{ flex: 1, padding: '32px 20px 40px', display: 'flex', flexDirection: 'column', gap: 0 }}>
          {/* Hero */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 80, fontWeight: 900, lineHeight: 1, letterSpacing: '-0.04em', color: t.gold, textShadow: isDark ? '0 0 60px rgba(201,168,76,0.4)' : 'none' }}>0a7</div>
            <div style={{ fontSize: 48, fontWeight: 900, lineHeight: 1, color: t.text, letterSpacing: '-0.03em' }}>LEGENDS</div>
            <div style={{ display: 'flex', gap: 5, marginTop: 16, marginBottom: 16 }}>
              <div style={{ height: 3, width: 56, borderRadius: 3, background: t.gold }} />
              <div style={{ height: 3, width: 28, borderRadius: 3, background: t.red }} />
              <div style={{ height: 3, width: 14, borderRadius: 3, background: t.textMuted }} />
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.6, color: t.textDim, maxWidth: 280 }}>
              Monte um time dos sonhos com lendas históricas e dispute uma Copa do Mundo.
            </p>
          </div>

          {/* Stats strip */}
          <div style={{ borderRadius: 16, padding: '14px 16px', marginBottom: 24, display: 'flex', justifyContent: 'space-around', background: t.surface, border: `1px solid ${t.border}` }}>
            {[
              { v: `${TOTAL_SQUADS + TOTAL_CLUBS}`, l: 'TIMES' },
              { v: `${TOTAL_PLAYERS + TOTAL_CLUB_PLAYERS}+`, l: 'JOGADORES' },
              { v: '94', l: 'ANOS DE HIST.' },
            ].map(s => (
              <div key={s.l} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: t.gold }}>{s.v}</div>
                <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: '0.15em', color: t.textMuted, marginTop: 2 }}>{s.l}</div>
              </div>
            ))}
          </div>

          {/* Mode picker */}
          <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.2em', color: t.textMuted, marginBottom: 12 }}>ESCOLHA O MODO</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
            <ModeCard label="Seleções Históricas" icon="🌍" desc="Brasil 70, Argentina 86, Holanda 74..." sub={`${TOTAL_SQUADS} seleções · ${TOTAL_PLAYERS}+ jogadores`} active={picked === 'national'} color={t.red} colorDim={t.redDim} theme={t} onClick={() => setPicked('national')} />
            <ModeCard label="Clubes Históricos" icon="🏆" desc="Barça MSN, Flamengo 82, Milan 89..." sub={`${TOTAL_CLUBS} clubes · ${TOTAL_CLUB_PLAYERS}+ jogadores`} active={picked === 'clubs'} color={t.gold} colorDim={t.goldDim} theme={t} onClick={() => setPicked('clubs')} />
          </div>

          <button
            onClick={() => picked && onPlay(picked)}
            disabled={!picked}
            style={{
              width: '100%', padding: '16px', borderRadius: 16, marginBottom: 32,
              fontWeight: 900, fontSize: 13, letterSpacing: '0.1em',
              background: picked ? `linear-gradient(135deg, ${t.red} 0%, #8a1010 100%)` : t.surface,
              color: picked ? '#fff' : t.textMuted,
              border: 'none', cursor: picked ? 'pointer' : 'not-allowed',
              boxShadow: picked ? `0 8px 24px ${t.redDim}` : 'none',
            }}
          >
            {picked ? 'JOGAR AGORA →' : 'ESCOLHA UM MODO'}
          </button>

          {/* How it works */}
          <div style={{ display: 'flex', gap: 16 }}>
            {[
              { n: '01', t: 'ROLE', d: 'Sorteia um time histórico lendário' },
              { n: '02', t: 'MONTE', d: 'Escale um craque por sorteio' },
              { n: '03', t: 'SIMULE', d: 'Seu time faz o 7 a 0?' },
            ].map(s => (
              <div key={s.n} style={{ flex: 1 }}>
                <div style={{ fontSize: 20, fontWeight: 900, lineHeight: 1, color: t.red, marginBottom: 3 }}>{s.n}</div>
                <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.12em', color: t.text, marginBottom: 2 }}>{s.t}</div>
                <div style={{ fontSize: 10, lineHeight: 1.4, color: t.textDim }}>{s.d}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ModeCard({ label, icon, desc, sub, active, color, colorDim, theme: t, onClick }: {
  label: string; icon: string; desc: string; sub: string
  active: boolean; color: string; colorDim: string
  theme: ThemePalette; onClick: () => void
}) {
  return (
    <button onClick={onClick} style={{
      width: '100%', textAlign: 'left', padding: '18px',
      borderRadius: 18,
      background: active ? `linear-gradient(135deg, ${colorDim} 0%, transparent 100%)` : t.surface,
      border: `1.5px solid ${active ? color : t.border}`,
      boxShadow: active ? `0 0 28px ${colorDim}` : 'none',
      cursor: 'pointer', transition: 'all 0.15s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0, background: active ? colorDim : t.surface2, border: `1px solid ${active ? color + '44' : t.border}` }}>
          {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 900, fontSize: 14, marginBottom: 2, color: t.text }}>{label}</div>
          <div style={{ fontSize: 11, color: t.textDim, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>{desc}</div>
          <div style={{ fontSize: 10, fontWeight: 900, color: color }}>{sub}</div>
        </div>
        <div style={{ width: 22, height: 22, borderRadius: '50%', border: `2px solid ${active ? color : t.border2}`, background: active ? color : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {active && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />}
        </div>
      </div>
    </button>
  )
}
