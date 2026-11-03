// Score and narration stay above the pitch. Playback controls are expanded
// explicitly so the career map remains readable on a narrow mobile screen.
import {useState,type CSSProperties} from 'react'
import type { EstadoPartidaEstadio } from './presidencia-partida-model'
import { useControleMapa } from './controle-partida-mapa'
import { useRitmoCampo, VELOCIDADES_ESTADIO, rotuloVelocidadeCampo } from './presidencia-velocidade'
import { useT } from './lang'

const INK = '#0C0C0C', GOLD = '#FFC400'
const OSW: CSSProperties = { fontFamily: 'Oswald, sans-serif', fontWeight: 900, textTransform: 'uppercase' }
/** (os botões do mapa têm 44 px de altura e sombra — aqui dentro eles são pílulas pequenas) */
const RESET: CSSProperties = { minHeight: 0, minWidth: 0, height: 'auto', margin: 0, boxShadow: 'none', lineHeight: 1.15 }
const sigla = (n: string) => (n.replace(/[^A-Za-zÀ-ú0-9 ]/g, '').trim().split(/\s+/).find(w => w.length > 2) ?? n).slice(0, 3).toUpperCase()

export function MapaHud({ match }: { match: EstadoPartidaEstadio | null | undefined }) {
  const t = useT(), ctl = useControleMapa(), ritmo = useRitmoCampo(),[controlsOpen,setControlsOpen]=useState(false)
  const vivo = !!match && !match.finished
  if (!match && !ctl) return null
  const [nh, na] = match?.officialTeams ?? [t('Casa', 'Home'), t('Fora', 'Away')]
  const chip = (on: boolean): CSSProperties => ({ ...RESET, font: 'inherit', fontSize: 10.5, fontWeight: 800, padding: '4px 7px', border: 0, background: on ? GOLD : 'transparent', color: on ? INK : '#fff', cursor: 'pointer', pointerEvents: 'auto' })
  const grupo: CSSProperties = { display: 'inline-flex', border: '2px solid #fff', borderRadius: 9, overflow: 'hidden', flex: 'none' }
  const placar = match && <span className="pc3-scoreboard" style={{ display: 'inline-flex', alignItems: 'stretch', border: '2px solid #fffaf0', borderRadius: 9, overflow: 'hidden', background:INK, boxShadow:'2px 3px 0 #0c0c0c', ...OSW, flex: 'none' }}>
      <span style={{ background: INK, color: '#fffaf0', padding: '5px 8px', fontSize: 16, display: 'flex', alignItems: 'center', gap: 4 }}><i style={{ width: 10, height: 10, borderRadius: '50%', background: match.homeColor, border: '1.5px solid #fffaf0' }} />{sigla(nh)}</span>
      <span style={{ background: INK, color: '#fff', padding: '4px 10px', fontSize: 20 }}>{match.homeScore} – {match.awayScore}</span>
      <span style={{ background: INK, color: '#fffaf0', padding: '5px 8px', fontSize: 16, display: 'flex', alignItems: 'center', gap: 4 }}>{sigla(na)}<i style={{ width: 10, height: 10, borderRadius: '50%', background: match.awayColor, border: '1.5px solid #fffaf0' }} /></span>
      <span style={{ background: match.finished ? '#ddd' : GOLD, color: INK, padding: '4px 8px', fontSize: 14, display: 'flex', alignItems: 'center' }}>{match.finished ? t('FIM', 'FT') : <>{!match.paused && <i style={{ width: 6, height: 6, borderRadius: '50%', background: '#E8503A', marginRight: 4 }} />}{Math.min(93, Math.max(0, Math.floor(match.minute)))}'</>}</span>
    </span>
  return <><div className="pc3-match-score">
    <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexWrap: 'wrap' }}>
      {placar}
      {vivo && ctl?.tatica && <button type="button" onClick={ctl.tatica} style={{ ...RESET, ...OSW, fontSize: 11, padding: '4px 8px', borderRadius: 8, border: '2px solid #fff', background: INK, color: '#fff', cursor: 'pointer', flex: 'none' }}>{t('🔁 Substituir / tática', '🔁 Subs / tactics')}</button>}
      {!vivo && ctl?.dia && <span style={{ ...OSW, fontSize: 11.5, color: GOLD, flex: 'none' }}>{ctl.dia}</span>}
      {!vivo && ctl?.chegando && <span style={{ fontSize: 10.5, fontWeight: 800, color: '#FFE79A', flex: 'none' }}>{t('🏟️ Dia de jogo! A torcida está chegando — apito às 16h', '🏟️ Match day! The fans are arriving — kick-off at 4pm')}</span>}
    </div>
    {vivo && match?.officialNarration && <div className="pc3-match-narration">🎙️ {match.officialNarration}</div>}
   </div>
   {(ctl||ritmo)&&<div className="pc3-match-controls">
    <button type="button" className="pc3-match-controls-toggle" aria-expanded={controlsOpen} onClick={()=>setControlsOpen(v=>!v)}>{controlsOpen?t('Fechar controles','Close controls'):t('Controles','Controls')}{ritmo&&vivo&&<span>{rotuloVelocidadeCampo(ritmo.speed)}</span>}</button>
    {controlsOpen&&<div className="pc3-match-controls-panel" role="group" aria-label={t('Controles da partida','Match controls')}>
    {(ctl?.manualOk || (ritmo && vivo)) && <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
      {ctl && ctl.manualOk && <span style={grupo}><button type="button" style={chip(!ctl.manual)} onClick={() => { if (ctl.manual) ctl.alternaManual() }}>🔁 {t('AUTO', 'AUTO')}</button><button type="button" style={chip(ctl.manual)} onClick={() => { if (!ctl.manual) ctl.alternaManual() }}>🎮 MANUAL</button></span>}
      {ritmo && vivo && <span style={{...grupo,flexWrap:'wrap',maxWidth:'100%'}}>{VELOCIDADES_ESTADIO.map(v => <button key={v} type="button" aria-pressed={ritmo.speed===v} aria-label={t('Velocidade da partida','Match speed')+' '+rotuloVelocidadeCampo(v)} style={{...chip(ritmo.speed === v),minHeight:44,minWidth:44,fontSize:13}} onClick={() => ritmo.onSet(v)}>{rotuloVelocidadeCampo(v)}</button>)}</span>}
      {ctl && ctl.manual && !(ritmo && vivo) && <span style={grupo}>{[1, 2, 4].map(v => <button key={v} type="button" style={chip(ctl.velocidade === v)} onClick={() => ctl.mudaVelocidade(v)}>{v}×</button>)}</span>}
    </div>}
    </div>}
   </div>}
  </>
}
