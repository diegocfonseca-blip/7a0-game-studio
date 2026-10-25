// 📺 PLACAR E CONTROLE POR CIMA DO MAPA 3D (25/10, mockup `scripts/mockups/clube-mapa-hud.png`, aprovado). Placar de TV no alto
// (escudo de cor, gols, minuto ao vivo), narração numa linha e, embaixo, o MESMO controle de sempre: ⏭️ próxima rodada no Manual,
// 🔁 Auto / 🎮 Manual, velocidade — e o ritmo de olhar o estádio (0,25× · 0,5× · 1×). Nada fora do mapa; vale na tela cheia também.
import type { CSSProperties } from 'react'
import type { EstadoPartidaEstadio } from './presidencia-partida-model'
import { useControleMapa } from './controle-partida-mapa'
import { useRitmoCampo } from './presidencia-velocidade'
import { useT } from './lang'

const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D'
const OSW: CSSProperties = { fontFamily: 'Oswald, sans-serif', fontWeight: 900, textTransform: 'uppercase' }
/** (os botões do mapa têm 44 px de altura e sombra — aqui dentro eles são pílulas pequenas) */
const RESET: CSSProperties = { minHeight: 0, minWidth: 0, height: 'auto', margin: 0, boxShadow: 'none', lineHeight: 1.15 }
const sigla = (n: string) => (n.replace(/[^A-Za-zÀ-ú0-9 ]/g, '').trim().split(/\s+/).find(w => w.length > 2) ?? n).slice(0, 3).toUpperCase()

export function MapaHud({ match }: { match: EstadoPartidaEstadio | null | undefined }) {
  const t = useT(), ctl = useControleMapa(), ritmo = useRitmoCampo()
  const vivo = !!match && !match.finished
  if (!match && !ctl) return null
  const [nh, na] = match?.officialTeams ?? [t('Casa', 'Home'), t('Fora', 'Away')]
  const chip = (on: boolean): CSSProperties => ({ ...RESET, font: 'inherit', fontSize: 10.5, fontWeight: 800, padding: '4px 7px', border: 0, background: on ? GOLD : 'transparent', color: on ? INK : '#fff', cursor: 'pointer', pointerEvents: 'auto' })
  const grupo: CSSProperties = { display: 'inline-flex', border: '2px solid #fff', borderRadius: 9, overflow: 'hidden', flex: 'none' }
  const placar = match && <span style={{ display: 'inline-flex', alignItems: 'stretch', border: `2px solid ${INK}`, borderRadius: 7, overflow: 'hidden', ...OSW, flex: 'none' }}>
      <span style={{ background: '#fff', color: INK, padding: '2px 6px', fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 4 }}><i style={{ width: 8, height: 8, borderRadius: 2, background: match.homeColor, border: `1.5px solid ${INK}` }} />{sigla(nh)}</span>
      <span style={{ background: INK, color: '#fff', padding: '2px 8px', fontSize: 14 }}>{match.homeScore} – {match.awayScore}</span>
      <span style={{ background: '#fff', color: INK, padding: '2px 6px', fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 4 }}>{sigla(na)}<i style={{ width: 8, height: 8, borderRadius: 2, background: match.awayColor, border: `1.5px solid ${INK}` }} /></span>
      <span style={{ background: match.finished ? '#ddd' : GOLD, color: INK, padding: '2px 6px', fontSize: 12, display: 'flex', alignItems: 'center' }}>{match.finished ? t('FIM', 'FT') : <>{!match.paused && <i style={{ width: 6, height: 6, borderRadius: '50%', background: '#E8503A', marginRight: 4 }} />}{Math.min(93, Math.max(0, Math.floor(match.minute)))}'</>}</span>
    </span>
  return <div style={{ position: 'absolute', left: 6, right: 90, bottom: 30, background: 'rgba(12,12,12,.86)', border: `2.5px solid ${GOLD}`, borderRadius: 12, padding: 6, color: '#fff', pointerEvents: 'auto', display: 'flex', flexDirection: 'column', gap: 5 }}>
    <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexWrap: 'wrap' }}>
      {placar}
      {ctl && ctl.manual && <button type="button" disabled={!ctl.podeAvancar} onClick={ctl.avanca} style={{ ...RESET, ...OSW, fontSize: 11, padding: '4px 8px', borderRadius: 8, border: `2px solid ${INK}`, background: ctl.podeAvancar ? GREEN : '#555', color: '#fff', cursor: ctl.podeAvancar ? 'pointer' : 'default', flex: 'none' }}>{ctl.rotuloAvancar}</button>}
      {!vivo && ctl?.dia && <span style={{ ...OSW, fontSize: 11.5, color: GOLD, flex: 'none' }}>{ctl.dia}</span>}
      {!vivo && ctl?.irProJogo && <button type="button" onClick={ctl.irProJogo} style={{ ...RESET, ...OSW, fontSize: 11, padding: '4px 8px', borderRadius: 8, border: `2px solid ${INK}`, background: GREEN, color: '#fff', cursor: 'pointer', flex: 'none' }}>{t('⏩ Ir pro jogo', '⏩ Go to the match')}</button>}
      {!vivo && !ctl?.manual && <span style={{ fontSize: 10.5, fontWeight: 800, color: '#ddd' }}>{match?.finished ? t('⏱️ Fim de jogo — o próximo vem sozinho', '⏱️ Full time — the next one comes by itself') : t('⏳ O próximo jogo começa sozinho — e passa aqui no campo', '⏳ The next match starts by itself — right here on the pitch')}</span>}
    </div>
    {(ctl?.manualOk || (ritmo && vivo)) && <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexWrap: 'wrap' }}>
      {ctl && ctl.manualOk && <span style={grupo}><button type="button" style={chip(!ctl.manual)} onClick={() => { if (ctl.manual) ctl.alternaManual() }}>🔁 {t('AUTO', 'AUTO')}</button><button type="button" style={chip(ctl.manual)} onClick={() => { if (!ctl.manual) ctl.alternaManual() }}>🎮 MANUAL</button></span>}
      {ritmo && vivo && <span style={grupo}>{[.25, .5, 1].map(v => <button key={v} type="button" style={chip(ritmo.speed === v)} onClick={() => ritmo.onSet(v)}>{v === 1 ? '1×' : v === .5 ? '0,5×' : '0,25×'}</button>)}</span>}
      {ctl && ctl.manual && !(ritmo && vivo) && <span style={grupo}>{[1, 2, 4].map(v => <button key={v} type="button" style={chip(ctl.velocidade === v)} onClick={() => ctl.mudaVelocidade(v)}>{v}×</button>)}</span>}
    </div>}
    {vivo && match?.officialNarration && <div style={{ fontSize: 11, fontWeight: 700, color: '#FFE79A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>🎙️ {match.officialNarration}</div>}
  </div>
}
