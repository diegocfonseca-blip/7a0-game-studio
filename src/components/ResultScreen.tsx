import { useState, useEffect } from 'react'
import type { GameState } from '../engine/game'
import type { ThemePalette } from '../theme'
import { DARK } from '../theme'

interface Props {
  state: GameState
  onReplay: () => void
  onHome: () => void
  theme?: ThemePalette
}

const OSWALD = "'Oswald', 'Impact', 'Arial Narrow', sans-serif"

export default function ResultScreen({ state, onReplay, onHome, theme }: Props) {
  const t = theme ?? DARK
  const isDark = t.mode === 'dark'
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 768)
  useEffect(() => {
    const fn = () => setIsDesktop(window.innerWidth >= 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])

  const lastMatch = state.matches[state.matches.length - 1]
  const isChampion = !state.eliminated && lastMatch?.phase === 'Final' && lastMatch?.won
  const totalGoals = state.matches.reduce((s, m) => s + m.goalsFor, 0)
  const totalConceded = state.matches.reduce((s, m) => s + m.goalsAgainst, 0)
  const wins = state.matches.filter(m => m.won).length

  const scorerMap: Record<string, number> = {}
  const assistMap: Record<string, number> = {}
  for (const match of state.matches) {
    for (const ev of match.events) {
      if (ev.type === 'goal' && ev.playerName) scorerMap[ev.playerName] = (scorerMap[ev.playerName] ?? 0) + 1
      if (ev.assistName) assistMap[ev.assistName] = (assistMap[ev.assistName] ?? 0) + 1
    }
  }
  const topScorers = Object.entries(scorerMap).sort((a, b) => b[1] - a[1]).slice(0, 5)
  const topAssists = Object.entries(assistMap).sort((a, b) => b[1] - a[1]).slice(0, 3)
  const mvpEntry = topScorers.length > 0 ? topScorers[0] : null
  const mvpPick = mvpEntry ? state.picks.find(p => p.player.name === mvpEntry[0]) : undefined

  const shareText = [
    `🏆 0a7LEGENDS — #${state.seed}`,
    isChampion ? '🥇 CAMPEÃO MUNDIAL!' : `❌ Eliminado: ${lastMatch?.phase}`,
    `${wins}V · ${totalGoals} gols · ${totalConceded} sofridos`,
    topScorers.length ? `⚽ ${topScorers[0][0].split(' ').pop()} (${topScorers[0][1]}g)` : '',
  ].filter(Boolean).join('\n')

  const buildShareImage = async (): Promise<File | null> => {
    try {
      await document.fonts.ready
      const W = 1080, H = 1080
      const canvas = document.createElement('canvas')
      canvas.width = W; canvas.height = H
      const c = canvas.getContext('2d')!

      // Background
      const bg = c.createLinearGradient(0, 0, 0, H)
      if (isChampion) { bg.addColorStop(0, '#1e1400'); bg.addColorStop(0.6, '#100c00'); bg.addColorStop(1, '#0a0800') }
      else            { bg.addColorStop(0, '#180000'); bg.addColorStop(0.6, '#0e0000'); bg.addColorStop(1, '#080808') }
      c.fillStyle = bg; c.fillRect(0, 0, W, H)

      // Glow
      const glow = c.createRadialGradient(W/2, H*0.35, 0, W/2, H*0.35, 420)
      glow.addColorStop(0, isChampion ? 'rgba(212,168,64,0.22)' : 'rgba(224,53,53,0.18)')
      glow.addColorStop(1, 'transparent')
      c.fillStyle = glow; c.fillRect(0, 0, W, H)

      // Border frame
      c.strokeStyle = isChampion ? 'rgba(212,168,64,0.25)' : 'rgba(224,53,53,0.2)'
      c.lineWidth = 3
      c.strokeRect(32, 32, W - 64, H - 64)

      // Logo
      c.font = '600 52px Oswald, Impact, sans-serif'
      c.fillStyle = '#D4A840'
      c.textAlign = 'center'
      c.fillText('0a7 LEGENDS', W/2, 110)

      // Divider
      c.fillStyle = '#D4A840'
      c.fillRect(W/2 - 120, 130, 240, 2)
      c.fillStyle = '#E03535'
      c.fillRect(W/2 - 120, 130, 80, 2)

      // Big emoji
      c.font = '210px serif'
      c.textAlign = 'center'
      c.fillText(isChampion ? '🏆' : '💀', W/2, 390)

      // Status
      c.font = `bold ${isChampion ? 90 : 76}px Oswald, Impact, sans-serif`
      c.fillStyle = isChampion ? '#D4A840' : '#ffffff'
      if (isChampion) {
        c.shadowColor = 'rgba(212,168,64,0.6)'; c.shadowBlur = 40
      }
      c.fillText(isChampion ? 'CAMPEÃO MUNDIAL!' : 'ELIMINADO', W/2, 490)
      c.shadowBlur = 0

      // Phase (if eliminated)
      if (!isChampion && lastMatch) {
        c.font = '500 38px Oswald, Impact, sans-serif'
        c.fillStyle = 'rgba(255,255,255,0.4)'
        c.fillText(`${lastMatch.phase} · ${lastMatch.opponent} ${lastMatch.opponentYear}`, W/2, 548)
      }

      // Stats row boxes
      const stats = [
        { v: String(state.overall), l: 'OVERALL', color: '#D4A840' },
        { v: String(wins), l: 'VITÓRIAS', color: '#4CAF50' },
        { v: String(totalGoals), l: 'GOLS', color: '#E03535' },
        { v: String(totalConceded), l: 'SOFRIDOS', color: 'rgba(255,255,255,0.45)' },
      ]
      const boxW = 210, boxH = 120, gap = 20
      const totalW = stats.length * boxW + (stats.length - 1) * gap
      const startX = (W - totalW) / 2
      const boxY = isChampion ? 560 : 620

      stats.forEach((s, i) => {
        const x = startX + i * (boxW + gap)
        c.fillStyle = 'rgba(255,255,255,0.05)'
        roundRect(c, x, boxY, boxW, boxH, 16)
        c.fill()
        c.strokeStyle = 'rgba(255,255,255,0.08)'
        c.lineWidth = 1
        roundRect(c, x, boxY, boxW, boxH, 16)
        c.stroke()

        c.font = 'bold 52px Oswald, Impact, sans-serif'
        c.fillStyle = s.color
        c.textAlign = 'center'
        c.fillText(s.v, x + boxW/2, boxY + 62)
        c.font = '500 20px Oswald, Impact, sans-serif'
        c.fillStyle = 'rgba(255,255,255,0.35)'
        c.fillText(s.l, x + boxW/2, boxY + 98)
      })

      // Top scorer
      if (topScorers.length) {
        const [scorerName, goals] = topScorers[0]
        const shortName = scorerName.split(' ').pop()!
        const sy = boxY + boxH + 64
        c.font = '500 30px Oswald, Impact, sans-serif'
        c.fillStyle = 'rgba(255,255,255,0.3)'
        c.textAlign = 'center'
        c.fillText('ARTILHEIRO', W/2, sy)
        c.font = 'bold 64px Oswald, Impact, sans-serif'
        c.fillStyle = '#E03535'
        c.fillText(`⚽ ${shortName}`, W/2, sy + 72)
        c.font = 'bold 42px Oswald, Impact, sans-serif'
        c.fillStyle = 'rgba(255,255,255,0.6)'
        c.fillText(`${goals} gols`, W/2, sy + 124)
      }

      // Seed + footer
      c.font = '500 28px Oswald, Impact, sans-serif'
      c.fillStyle = 'rgba(255,255,255,0.2)'
      c.textAlign = 'center'
      c.fillText(`SEED #${state.seed}`, W/2, H - 56)

      return new Promise(resolve => {
        canvas.toBlob(blob => {
          resolve(blob ? new File([blob], '0a7legends.png', { type: 'image/png' }) : null)
        }, 'image/png')
      })
    } catch {
      return null
    }
  }

  const handleShare = async () => {
    const file = await buildShareImage()
    if (file && navigator.canShare?.({ files: [file] })) {
      try { await navigator.share({ files: [file], title: '0a7 LEGENDS' }); return } catch { /* fall through */ }
    }
    if (navigator.share) { navigator.share({ text: shareText }) }
    else { navigator.clipboard.writeText(shareText); alert('Copiado!') }
  }

  function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.lineTo(x + w - r, y)
    ctx.quadraticCurveTo(x + w, y, x + w, y + r)
    ctx.lineTo(x + w, y + h - r)
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
    ctx.lineTo(x + r, y + h)
    ctx.quadraticCurveTo(x, y + h, x, y + h - r)
    ctx.lineTo(x, y + r)
    ctx.quadraticCurveTo(x, y, x + r, y)
    ctx.closePath()
  }

  const winColor = isDark ? '#4CAF50' : '#2E7D32'
  const winBg = isDark ? 'rgba(76,175,80,0.08)' : 'rgba(46,125,50,0.06)'
  const winBorder = isDark ? 'rgba(76,175,80,0.2)' : 'rgba(46,125,50,0.2)'

  const hero = (
    <div style={{
      position: 'relative', overflow: 'hidden',
      padding: isDesktop ? '56px 24px 44px' : '44px 24px 36px',
      textAlign: 'center', flexShrink: 0,
      background: isChampion
        ? isDark ? 'linear-gradient(160deg, #1e1400 0%, #100c00 60%, #0a0800 100%)' : 'linear-gradient(160deg, #f5e8b0 0%, #ede0a0 100%)'
        : isDark ? 'linear-gradient(160deg, #180000 0%, #0e0000 60%, #080808 100%)' : 'linear-gradient(160deg, #f5e0e0 0%, #ece0e0 100%)',
      borderBottom: isChampion ? `1px solid ${t.gold}33` : `1px solid ${t.red}22`,
    }}>
      <div style={{ position: 'absolute', top: '-20%', left: '50%', transform: 'translateX(-50%)', width: '70%', height: '200%', background: isChampion ? `radial-gradient(ellipse, rgba(212,168,64,0.2) 0%, transparent 65%)` : `radial-gradient(ellipse, rgba(224,53,53,0.15) 0%, transparent 65%)`, pointerEvents: 'none' }} />

      <div style={{ fontSize: isDesktop ? 80 : 64, lineHeight: 1, position: 'relative', marginBottom: 16 }}>
        {isChampion ? '🏆' : '💀'}
      </div>
      <h1 style={{ fontFamily: OSWALD, fontSize: isDesktop ? 44 : 36, fontWeight: 700, letterSpacing: '0.06em', marginBottom: 10, position: 'relative', color: isChampion ? t.gold : t.text, textShadow: isChampion && isDark ? `0 0 40px rgba(212,168,64,0.5)` : 'none' }}>
        {isChampion ? 'CAMPEÃO MUNDIAL!' : 'ELIMINADO'}
      </h1>
      {lastMatch && (
        <p style={{ fontSize: 13, color: t.textDim, position: 'relative', lineHeight: 1.6 }}>
          {isChampion
            ? `Final · ${lastMatch.goalsFor}–${lastMatch.goalsAgainst} vs ${lastMatch.opponent} ${lastMatch.opponentYear}`
            : `${lastMatch.phase} · ${lastMatch.opponentBadge ?? lastMatch.opponentFlag} ${lastMatch.opponent} ${lastMatch.opponentYear} · ${lastMatch.goalsFor}–${lastMatch.goalsAgainst}${lastMatch.penalties ? ` (pen. ${lastMatch.penalties.goalsFor}–${lastMatch.penalties.goalsAgainst})` : ''}`
          }
        </p>
      )}
      <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.22em', marginTop: 14, color: t.textMuted, position: 'relative' }}>SEED #{state.seed}</div>
    </div>
  )

  const statsRow = (
    <div style={{ borderRadius: 20, overflow: 'hidden', background: t.surface, border: `1px solid ${t.border}` }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)' }}>
        {[
          { v: state.overall, l: 'OVERALL', c: t.gold },
          { v: wins, l: 'VITÓRIAS', c: winColor },
          { v: totalGoals, l: 'GOLS', c: t.red },
          { v: totalConceded, l: 'SOFREU', c: t.textDim },
        ].map((s, i, arr) => (
          <div key={s.l} style={{ padding: '20px 0', textAlign: 'center', borderRight: i < arr.length - 1 ? `1px solid ${t.border}` : 'none' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: s.c, lineHeight: 1, fontFamily: OSWALD }}>{s.v}</div>
            <div style={{ fontSize: 8, fontWeight: 600, letterSpacing: '0.14em', color: t.textMuted, marginTop: 5 }}>{s.l}</div>
          </div>
        ))}
      </div>
    </div>
  )

  const artilharia = (topScorers.length > 0 || topAssists.length > 0) && (
    <div style={{ borderRadius: 20, padding: '18px 20px', background: t.surface, border: `1px solid ${t.border}` }}>
      <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.2em', color: t.textMuted, marginBottom: 16 }}>ARTILHARIA</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div>
          <p style={{ fontSize: 9, fontWeight: 600, color: t.textMuted, marginBottom: 10, letterSpacing: '0.1em' }}>⚽ GOLS</p>
          {topScorers.map(([name, g]) => (
            <div key={name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid ${t.border}` }}>
              <span style={{ fontWeight: 600, fontSize: 12, color: t.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, marginRight: 8 }}>{name.split(' ').pop()}</span>
              <span style={{ fontWeight: 700, fontSize: 15, color: t.red, flexShrink: 0, fontFamily: OSWALD }}>{g}</span>
            </div>
          ))}
        </div>
        {topAssists.length > 0 && (
          <div>
            <p style={{ fontSize: 9, fontWeight: 600, color: t.textMuted, marginBottom: 10, letterSpacing: '0.1em' }}>🎯 ASSISTS</p>
            {topAssists.map(([name, a]) => (
              <div key={name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid ${t.border}` }}>
                <span style={{ fontWeight: 600, fontSize: 12, color: t.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, marginRight: 8 }}>{name.split(' ').pop()}</span>
                <span style={{ fontWeight: 700, fontSize: 15, color: t.gold, flexShrink: 0, fontFamily: OSWALD }}>{a}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  const PHASE_ORDER = ['Grupos', 'Oitavas', 'Quartas', 'Semifinal', 'Final']
  const PHASE_LABEL_MAP: Record<string, string> = {
    Grupos: 'FASE DE GRUPOS', Oitavas: 'OITAVAS DE FINAL', Quartas: 'QUARTAS DE FINAL',
    Semifinal: 'SEMIFINAL', Final: 'FINAL ★',
  }
  const phaseGroups = PHASE_ORDER
    .filter(ph => state.matches.some(m => m.phase === ph))
    .map(ph => ({ phase: ph, matches: state.matches.filter(m => m.phase === ph) }))

  const timeline = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {phaseGroups.map(({ phase, matches: pm }, gi) => {
        const allWon = pm.every(m => m.won)
        const phaseColor = allWon ? winColor : t.red
        const phaseBg = allWon ? winBg : isDark ? 'rgba(224,53,53,0.06)' : 'rgba(224,53,53,0.05)'
        const phaseBorder = allWon ? winBorder : t.red + '33'
        return (
          <div key={phase}>
            {gi > 0 && (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '2px 0' }}>
                <div style={{ width: 2, height: 18, background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)', borderRadius: 1 }} />
              </div>
            )}
            <div style={{ borderRadius: 16, overflow: 'hidden', background: t.surface, border: `1px solid ${t.border}` }}>
              <div style={{ padding: '8px 14px', background: phaseBg, borderBottom: `1px solid ${phaseBorder}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: phaseColor, flexShrink: 0, boxShadow: `0 0 6px ${phaseColor}` }} />
                <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.2em', color: phaseColor, flex: 1 }}>{PHASE_LABEL_MAP[phase] ?? phase.toUpperCase()}</span>
                <span style={{ fontSize: 9, fontWeight: 700, color: phaseColor }}>
                  {pm.filter(m => m.won).length}V {pm.filter(m => !m.won).length > 0 ? `${pm.filter(m => !m.won).length}D` : ''}
                </span>
              </div>
              <div style={{ padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {pm.map((m, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 10,
                    background: m.won ? winBg : isDark ? 'rgba(224,53,53,0.06)' : 'rgba(224,53,53,0.05)',
                    border: `1px solid ${m.won ? winBorder : t.red + '33'}`,
                  }}>
                    <span style={{ fontSize: 9, fontWeight: 900, width: 14, color: m.won ? winColor : t.red, flexShrink: 0 }}>{m.won ? 'V' : 'D'}</span>
                    <span style={{ fontSize: 15, flexShrink: 0 }}>{m.opponentBadge ?? m.opponentFlag}</span>
                    <span style={{ fontWeight: 600, fontSize: 12, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: t.text }}>{m.opponent}</span>
                    <span style={{ fontSize: 9, color: t.textMuted, flexShrink: 0 }}>{m.opponentYear}</span>
                    <span style={{ fontWeight: 900, fontSize: 14, color: t.text, fontFamily: OSWALD, flexShrink: 0 }}>
                      {m.goalsFor}–{m.goalsAgainst}
                      {m.penalties && <span style={{ fontSize: 8, color: t.textMuted }}> p.{m.penalties.goalsFor}–{m.penalties.goalsAgainst}</span>}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )

  const mvpCard = mvpEntry && (
    <div style={{ borderRadius: 20, background: t.surface, border: `1px solid ${t.border}`, overflow: 'hidden' }}>
      <div style={{ padding: '10px 16px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.2em', color: t.textMuted }}>MVP DA COPA</span>
        <span style={{ fontSize: 9, fontWeight: 900, padding: '3px 10px', borderRadius: 20, background: isDark ? 'rgba(224,53,53,0.18)' : 'rgba(180,0,0,0.1)', color: t.red, border: `1px solid ${t.red}44`, letterSpacing: '0.12em' }}>⭐ MVP</span>
      </div>
      <div style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 62, height: 62, borderRadius: '50%', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(160deg, #EF5350 0%, #B71C1C 100%)', border: '2.5px solid rgba(239,83,80,0.5)', boxShadow: '0 4px 20px rgba(239,83,80,0.45)' }}>
          <span style={{ fontSize: 18, fontWeight: 900, color: '#fff', lineHeight: 1, fontFamily: OSWALD }}>{mvpPick?.player.rating ?? '–'}</span>
          <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.65)', letterSpacing: '0.05em' }}>{mvpPick?.slot.label ?? ''}</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 900, fontSize: 20, color: t.text, fontFamily: OSWALD, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.1 }}>
            {mvpEntry[0].split(' ').pop()}
          </div>
          {mvpPick && (
            <div style={{ fontSize: 10, color: t.textDim, marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {mvpPick.squad.flagEmoji} {mvpPick.squad.clubName ?? mvpPick.squad.countryNamePt} · {mvpPick.squad.year}
            </div>
          )}
          <div style={{ display: 'flex', gap: 16, marginTop: 10 }}>
            <div>
              <div style={{ fontSize: 24, fontWeight: 900, color: t.red, lineHeight: 1, fontFamily: OSWALD }}>{mvpEntry[1]}</div>
              <div style={{ fontSize: 8, color: t.textMuted, letterSpacing: '0.12em', marginTop: 2 }}>GOLS</div>
            </div>
            {(assistMap[mvpEntry[0]] ?? 0) > 0 && (
              <div>
                <div style={{ fontSize: 24, fontWeight: 900, color: t.gold, lineHeight: 1, fontFamily: OSWALD }}>{assistMap[mvpEntry[0]]}</div>
                <div style={{ fontSize: 8, color: t.textMuted, letterSpacing: '0.12em', marginTop: 2 }}>ASSISTS</div>
              </div>
            )}
            <div>
              <div style={{ fontSize: 24, fontWeight: 900, color: t.textDim, lineHeight: 1, fontFamily: OSWALD }}>{state.matches.length}</div>
              <div style={{ fontSize: 8, color: t.textMuted, letterSpacing: '0.12em', marginTop: 2 }}>JOGOS</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const meuTime = (
    <div style={{ borderRadius: 20, overflow: 'hidden', background: t.surface, border: `1px solid ${t.border}` }}>
      <div style={{ padding: '13px 20px', borderBottom: `1px solid ${t.border}` }}>
        <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.2em', color: t.textMuted }}>SEU TIME</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '8px 12px' }}>
        {state.picks.map((pick, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: `1px solid ${t.border}` }}>
            <span style={{ fontSize: 9, fontWeight: 700, width: 28, flexShrink: 0, color: t.textMuted }}>{pick.slot.label}</span>
            <span style={{ fontSize: 13, flexShrink: 0 }}>{pick.squad.flagEmoji}</span>
            <span style={{ fontWeight: 600, fontSize: 12, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: t.text }}>{pick.player.name.split(' ').pop()}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
              {(scorerMap[pick.player.name] ?? 0) > 0 && <span style={{ fontSize: 9, fontWeight: 700, color: t.red }}>⚽{scorerMap[pick.player.name]}</span>}
              {(assistMap[pick.player.name] ?? 0) > 0 && <span style={{ fontSize: 9, fontWeight: 700, color: t.gold }}>🎯{assistMap[pick.player.name]}</span>}
              {pick.player.isLegend && <span style={{ fontSize: 9, color: t.gold }}>★</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const actions = (
    <div style={{ display: 'flex', gap: 10 }}>
      <button onClick={onHome} style={{
        flex: 1, fontWeight: 700, fontSize: 13, padding: '16px 0', borderRadius: 18,
        background: t.surface2, color: t.textDim, border: `1px solid ${t.border}`, cursor: 'pointer',
        letterSpacing: '0.06em', fontFamily: OSWALD,
      }}>← INÍCIO</button>
      <button onClick={handleShare} style={{
        flex: 1, fontWeight: 700, fontSize: 13, padding: '16px 0', borderRadius: 18,
        background: t.goldDim, color: t.gold, border: `1px solid ${t.gold}44`, cursor: 'pointer',
        letterSpacing: '0.06em', fontFamily: OSWALD,
      }}>SHARE 📤</button>
      <button onClick={onReplay} style={{
        flex: 1, fontWeight: 700, fontSize: 13, padding: '16px 0', borderRadius: 18,
        background: `linear-gradient(135deg, ${t.red}, #8a0c0c)`,
        color: '#fff', border: 'none', cursor: 'pointer',
        boxShadow: `0 4px 24px rgba(224,53,53,0.4)`, letterSpacing: '0.06em', fontFamily: OSWALD,
      }}>NOVO 🎲</button>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: t.bgGrad }}>
      {hero}
      {isDesktop ? (
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, padding: '28px', maxWidth: 1100, margin: '0 auto', width: '100%', alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {statsRow}
            {mvpCard}
            {artilharia}
            {actions}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {timeline}
            {meuTime}
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 500, margin: '0 auto', width: '100%' }}>
          {statsRow}
          {mvpCard}
          {artilharia}
          {timeline}
          {meuTime}
          <div style={{ paddingBottom: 24 }}>{actions}</div>
        </div>
      )}
    </div>
  )
}
