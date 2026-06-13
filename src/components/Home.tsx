import { useState, useEffect, useRef } from 'react'
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

const OSWALD = "'Oswald', 'Impact', 'Arial Narrow', sans-serif"

export default function Home({ onPlay, theme: t, onToggleTheme }: Props) {
  const [picked, setPicked] = useState<GameCategory | null>(null)
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 768)
  const [showKeyInput, setShowKeyInput] = useState(false)
  const [keyDraft, setKeyDraft] = useState('')
  const [testState, setTestState] = useState<'idle' | 'testing' | 'ok' | 'error'>('idle')
  const [testMsg, setTestMsg] = useState('')
  const tapCount = useRef(0)
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const fn = () => setIsDesktop(window.innerWidth >= 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])

  const handleLogoTap = () => {
    tapCount.current++
    if (tapTimer.current) clearTimeout(tapTimer.current)
    tapTimer.current = setTimeout(() => { tapCount.current = 0 }, 1500)
    if (tapCount.current >= 5) {
      tapCount.current = 0
      setKeyDraft(localStorage.getItem('gemini_api_key') ?? '')
      setTestState('idle')
      setTestMsg('')
      setShowKeyInput(true)
    }
  }

  const saveKey = async () => {
    const k = keyDraft.trim()
    if (!k) {
      localStorage.removeItem('gemini_api_key')
      setShowKeyInput(false)
      return
    }
    localStorage.setItem('gemini_api_key', k)
    setTestState('testing')
    setTestMsg('')
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${k}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Responda apenas: OK' }] }],
            generationConfig: { maxOutputTokens: 5 },
          }),
        }
      )
      if (res.ok) {
        setTestState('ok')
        setTimeout(() => { setTestState('idle'); setShowKeyInput(false) }, 2000)
      } else {
        let msg = `Erro ${res.status}`
        try {
          const body = await res.json()
          const detail = body?.error?.message
          if (detail) msg += `: ${detail}`
        } catch { /* ignore */ }
        setTestMsg(msg)
        setTestState('error')
      }
    } catch {
      setTestMsg('Sem conexão com a API')
      setTestState('error')
    }
  }

  const isDark = t.mode === 'dark'

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: t.bgGrad }}>

      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: isDesktop ? '14px 48px' : '14px 20px',
        background: t.topbar,
        borderBottom: `1px solid ${t.topbarBorder}`,
        backdropFilter: 'blur(12px)',
        position: 'sticky', top: 0, zIndex: 20,
      }}>
        <span onClick={handleLogoTap} style={{ fontSize: 15, fontWeight: 700, letterSpacing: '0.18em', color: t.gold, fontFamily: OSWALD, cursor: 'default', userSelect: 'none' }}>
          0a7 LEGENDS
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={onToggleTheme} style={{
            fontSize: 16, background: 'none', border: 'none',
            color: t.textDim, cursor: 'pointer', padding: '4px 8px',
            borderRadius: 8, transition: 'color 0.2s',
          }}>
            {isDark ? '☀' : '🌙'}
          </button>
          <span style={{ fontSize: 10, fontWeight: 600, color: t.textMuted, letterSpacing: '0.12em' }}>
            1930–2024
          </span>
        </div>
      </div>

      {isDesktop ? (
        /* Desktop */
        <div style={{ flex: 1, display: 'flex', maxWidth: 1080, margin: '0 auto', width: '100%', padding: '56px 48px', gap: 72, alignItems: 'flex-start' }}>

          {/* Left: hero */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 96, fontWeight: 700, lineHeight: 0.9, letterSpacing: '-0.02em', color: t.gold, fontFamily: OSWALD, textShadow: isDark ? '0 0 80px rgba(212,168,64,0.3)' : 'none' }}>
                0a7
              </div>
              <div style={{ fontSize: 56, fontWeight: 700, lineHeight: 1, letterSpacing: '0.02em', color: t.text, fontFamily: OSWALD }}>
                LEGENDS
              </div>
            </div>

            <div style={{ display: 'flex', gap: 5, marginBottom: 24 }}>
              <div style={{ height: 3, width: 56, borderRadius: 3, background: t.gold }} />
              <div style={{ height: 3, width: 28, borderRadius: 3, background: t.red }} />
              <div style={{ height: 3, width: 12, borderRadius: 3, background: t.textMuted }} />
            </div>

            <p style={{ fontSize: 15, lineHeight: 1.7, color: t.textDim, maxWidth: 340, marginBottom: 44, fontWeight: 400 }}>
              Monte um time dos sonhos com lendas históricas do futebol e dispute uma Copa do Mundo.
            </p>

            {/* Stats */}
            <div style={{ display: 'flex', gap: 0, marginBottom: 52 }}>
              {[
                { v: `${TOTAL_SQUADS + TOTAL_CLUBS}`, l: 'TIMES' },
                { v: `${TOTAL_PLAYERS + TOTAL_CLUB_PLAYERS}+`, l: 'JOGADORES' },
                { v: '94', l: 'ANOS' },
              ].map((s, i) => (
                <div key={s.l} style={{ paddingRight: 28, borderRight: i < 2 ? `1px solid ${t.border}` : 'none', marginRight: i < 2 ? 28 : 0 }}>
                  <div style={{ fontSize: 30, fontWeight: 700, lineHeight: 1, color: t.gold, fontFamily: OSWALD }}>{s.v}</div>
                  <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.2em', color: t.textMuted, marginTop: 4 }}>{s.l}</div>
                </div>
              ))}
            </div>

            {/* Steps */}
            <div style={{ display: 'flex', gap: 16 }}>
              {[
                { n: '01', t: 'ROLE', d: 'Sorteia um time histórico lendário' },
                { n: '02', t: 'MONTE', d: 'Escale um craque por sorteio' },
                { n: '03', t: 'SIMULE', d: 'Seu time faz o 7 a 0?' },
              ].map(s => (
                <div key={s.n} style={{ flex: 1, padding: '16px', borderRadius: 16, background: t.surface, border: `1px solid ${t.border}` }}>
                  <div style={{ fontSize: 26, fontWeight: 700, lineHeight: 1, color: t.red, marginBottom: 6, fontFamily: OSWALD }}>{s.n}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: t.text, marginBottom: 4 }}>{s.t}</div>
                  <div style={{ fontSize: 11, lineHeight: 1.5, color: t.textDim }}>{s.d}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: mode picker */}
          <div style={{ width: 360, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.22em', color: t.textMuted, marginBottom: 2 }}>ESCOLHA O MODO</p>

            <ModeCard label="Seleções Históricas" icon="🌍" desc="Brasil 70, Argentina 86, Holanda 74..." sub={`${TOTAL_SQUADS} seleções · ${TOTAL_PLAYERS}+ jogadores`} active={picked === 'national'} color={t.red} colorDim={t.redDim} theme={t} onClick={() => setPicked('national')} />
            <ModeCard label="Clubes Históricos" icon="🏆" desc="Barça MSN, Flamengo 82, Milan 89..." sub={`${TOTAL_CLUBS} clubes · ${TOTAL_CLUB_PLAYERS}+ jogadores`} active={picked === 'clubs'} color={t.gold} colorDim={t.goldDim} theme={t} onClick={() => setPicked('clubs')} />

            <button
              onClick={() => picked && onPlay(picked)}
              disabled={!picked}
              style={{
                width: '100%', padding: '20px', borderRadius: 18,
                fontWeight: 700, fontSize: 15, letterSpacing: '0.12em',
                fontFamily: OSWALD,
                background: picked
                  ? `linear-gradient(135deg, ${t.red} 0%, #7a0c0c 100%)`
                  : t.surface,
                color: picked ? '#fff' : t.textMuted,
                border: picked ? 'none' : `1px solid ${t.border}`,
                cursor: picked ? 'pointer' : 'not-allowed',
                boxShadow: picked ? `0 8px 40px rgba(224,53,53,0.35), 0 2px 8px rgba(0,0,0,0.4)` : 'none',
                transition: 'all 0.2s',
                marginTop: 4,
              }}
            >
              {picked ? 'JOGAR AGORA →' : 'ESCOLHA UM MODO'}
            </button>
          </div>
        </div>

      ) : (
        /* Mobile */
        <div style={{ flex: 1, padding: '36px 20px 48px', display: 'flex', flexDirection: 'column' }}>
          {/* Hero */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 78, fontWeight: 700, lineHeight: 0.9, letterSpacing: '-0.02em', color: t.gold, fontFamily: OSWALD, textShadow: isDark ? '0 0 60px rgba(212,168,64,0.35)' : 'none' }}>0a7</div>
            <div style={{ fontSize: 44, fontWeight: 700, lineHeight: 1, letterSpacing: '0.02em', color: t.text, fontFamily: OSWALD }}>LEGENDS</div>
            <div style={{ display: 'flex', gap: 5, marginTop: 16, marginBottom: 16 }}>
              <div style={{ height: 3, width: 48, borderRadius: 3, background: t.gold }} />
              <div style={{ height: 3, width: 24, borderRadius: 3, background: t.red }} />
              <div style={{ height: 3, width: 10, borderRadius: 3, background: t.textMuted }} />
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.65, color: t.textDim, maxWidth: 280 }}>
              Monte um time dos sonhos com lendas históricas e dispute uma Copa do Mundo.
            </p>
          </div>

          {/* Stats strip */}
          <div style={{ borderRadius: 18, padding: '16px 20px', marginBottom: 28, display: 'flex', justifyContent: 'space-around', background: t.surface, border: `1px solid ${t.border}` }}>
            {[
              { v: `${TOTAL_SQUADS + TOTAL_CLUBS}`, l: 'TIMES' },
              { v: `${TOTAL_PLAYERS + TOTAL_CLUB_PLAYERS}+`, l: 'JOGADORES' },
              { v: '94', l: 'ANOS' },
            ].map(s => (
              <div key={s.l} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: t.gold, fontFamily: OSWALD }}>{s.v}</div>
                <div style={{ fontSize: 8, fontWeight: 600, letterSpacing: '0.18em', color: t.textMuted, marginTop: 2 }}>{s.l}</div>
              </div>
            ))}
          </div>

          {/* Mode picker */}
          <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.22em', color: t.textMuted, marginBottom: 12 }}>ESCOLHA O MODO</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
            <ModeCard label="Seleções Históricas" icon="🌍" desc="Brasil 70, Argentina 86, Holanda 74..." sub={`${TOTAL_SQUADS} seleções · ${TOTAL_PLAYERS}+ jogadores`} active={picked === 'national'} color={t.red} colorDim={t.redDim} theme={t} onClick={() => setPicked('national')} />
            <ModeCard label="Clubes Históricos" icon="🏆" desc="Barça MSN, Flamengo 82, Milan 89..." sub={`${TOTAL_CLUBS} clubes · ${TOTAL_CLUB_PLAYERS}+ jogadores`} active={picked === 'clubs'} color={t.gold} colorDim={t.goldDim} theme={t} onClick={() => setPicked('clubs')} />
          </div>

          <button
            onClick={() => picked && onPlay(picked)}
            disabled={!picked}
            style={{
              width: '100%', padding: '18px', borderRadius: 18, marginBottom: 36,
              fontWeight: 700, fontSize: 15, letterSpacing: '0.12em',
              fontFamily: OSWALD,
              background: picked ? `linear-gradient(135deg, ${t.red} 0%, #7a0c0c 100%)` : t.surface,
              color: picked ? '#fff' : t.textMuted,
              border: picked ? 'none' : `1px solid ${t.border}`,
              cursor: picked ? 'pointer' : 'not-allowed',
              boxShadow: picked ? `0 8px 32px rgba(224,53,53,0.3)` : 'none',
            }}
          >
            {picked ? 'JOGAR AGORA →' : 'ESCOLHA UM MODO'}
          </button>

          {/* Steps */}
          <div style={{ display: 'flex', gap: 14 }}>
            {[
              { n: '01', t: 'ROLE', d: 'Sorteia um time lendário' },
              { n: '02', t: 'MONTE', d: 'Escale um craque por rodada' },
              { n: '03', t: 'SIMULE', d: 'Vai ao 7 a 0?' },
            ].map(s => (
              <div key={s.n} style={{ flex: 1 }}>
                <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1, color: t.red, marginBottom: 4, fontFamily: OSWALD }}>{s.n}</div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: t.text, marginBottom: 2 }}>{s.t}</div>
                <div style={{ fontSize: 10, lineHeight: 1.4, color: t.textDim }}>{s.d}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      {showKeyInput && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: '#111', border: '1px solid rgba(212,168,64,0.3)', borderRadius: 20, padding: '28px 24px', width: '100%', maxWidth: 420 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', color: 'rgba(212,168,64,0.7)', marginBottom: 16 }}>CONFIGURAR IA</p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 16, lineHeight: 1.5 }}>
              Cole sua chave do Google AI Studio (aistudio.google.com → Get API key)
            </p>
            <input
              type="text"
              value={keyDraft}
              onChange={e => { setKeyDraft(e.target.value); setTestState('idle') }}
              placeholder="AIzaSy..."
              autoFocus
              style={{ width: '100%', padding: '14px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 14, boxSizing: 'border-box', outline: 'none', fontFamily: 'monospace', marginBottom: 14 }}
            />
            {testState === 'error' && (
              <div style={{ marginBottom: 14, padding: '12px 14px', borderRadius: 10, background: 'rgba(224,53,53,0.15)', border: '1px solid rgba(224,53,53,0.4)', color: '#ff6b6b', fontSize: 12, lineHeight: 1.5, fontFamily: 'monospace', wordBreak: 'break-all' }}>
                {testMsg}
              </div>
            )}
            {testState === 'ok' && (
              <div style={{ marginBottom: 14, padding: '12px 14px', borderRadius: 10, background: 'rgba(76,175,80,0.15)', border: '1px solid rgba(76,175,80,0.4)', color: '#81C784', fontSize: 13, fontWeight: 700 }}>
                IA FUNCIONANDO!
              </div>
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { setShowKeyInput(false); setTestState('idle') }} style={{ flex: 1, padding: '13px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>CANCELAR</button>
              <button
                onClick={saveKey}
                disabled={testState === 'testing'}
                style={{ flex: 2, padding: '13px', borderRadius: 12, border: 'none', background: testState === 'ok' ? '#4CAF50' : testState === 'error' ? '#c0392b' : 'linear-gradient(135deg,#D4A840,#8a6020)', color: '#fff', cursor: testState === 'testing' ? 'wait' : 'pointer', fontSize: 13, fontWeight: 700, letterSpacing: '0.06em', opacity: testState === 'testing' ? 0.7 : 1 }}>
                {testState === 'testing' ? 'TESTANDO...' : testState === 'ok' ? '✓ FUNCIONANDO!' : testState === 'error' ? 'TENTAR NOVAMENTE' : 'SALVAR E TESTAR'}
              </button>
            </div>
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
      width: '100%', textAlign: 'left', padding: '18px 20px',
      borderRadius: 20,
      background: active
        ? `linear-gradient(135deg, ${colorDim} 0%, ${t.surface} 100%)`
        : t.surface,
      border: `1.5px solid ${active ? color + 'aa' : t.border}`,
      boxShadow: active ? `0 0 32px ${colorDim}, 0 4px 16px rgba(0,0,0,0.3)` : '0 2px 8px rgba(0,0,0,0.15)',
      cursor: 'pointer', transition: 'all 0.18s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0, background: active ? colorDim : t.surface2, border: `1px solid ${active ? color + '55' : t.border}`, transition: 'all 0.18s' }}>
          {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2, color: t.text }}>{label}</div>
          <div style={{ fontSize: 11, color: t.textDim, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 5 }}>{desc}</div>
          <div style={{ fontSize: 10, fontWeight: 700, color: active ? color : t.textMuted, transition: 'color 0.18s' }}>{sub}</div>
        </div>
        <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${active ? color : t.border2}`, background: active ? color : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.18s' }}>
          {active && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff' }} />}
        </div>
      </div>
    </button>
  )
}
