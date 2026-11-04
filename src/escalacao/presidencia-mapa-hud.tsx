import { observarSuperficieCampo2D, superficieCampo2D } from './campo2d-superficie'
// Score and narration stay above the pitch. Playback controls are expanded
// explicitly so the career map remains readable on a narrow mobile screen.
import {useState,useSyncExternalStore,type CSSProperties} from 'react'
import type { EstadoPartidaEstadio } from './presidencia-partida-model'
import { useControleMapa } from './controle-partida-mapa'
import { useRitmoCampo, VELOCIDADES_ESTADIO, rotuloVelocidadeCampo } from './presidencia-velocidade'
import { useT } from './lang'
import { FestaGolCampo2D, useFestaCampo2D } from './campo2d-festa'
import { estiloPisca, gritoGol } from './radio-pisca'
import { ResumoApitoCampo2D, BotaoReplayCampo2D, useApitoCampo2D, useQuaseCampo2D, QUASE_CSS, estiloQuase } from './campo2d-resumo-ui'

const INK = '#0C0C0C', GOLD = '#FFC400'
const OSW: CSSProperties = { fontFamily: 'Oswald, sans-serif', fontWeight: 900, textTransform: 'uppercase' }
/** (os botões do mapa têm 44 px de altura e sombra — aqui dentro eles são pílulas pequenas) */
const RESET: CSSProperties = { minHeight: 0, minWidth: 0, height: 'auto', margin: 0, boxShadow: 'none', lineHeight: 1.15 }
const sigla = (n: string) => (n.replace(/[^A-Za-zÀ-ú0-9 ]/g, '').trim().split(/\s+/).find(w => w.length > 2) ?? n).slice(0, 3).toUpperCase()

export function MapaHud({ match, torcedores = 0 }: { match: EstadoPartidaEstadio | null | undefined; /** 🎟️ público do jogo (lotação × lugares construídos) */ torcedores?: number }) {
  const t = useT(), ctl = useControleMapa(), ritmo = useRitmoCampo(),[controlsOpen,setControlsOpen]=useState(false)
  // ⚽ 04/11 (Diego: *"o gol na aba do mapa também não está aparecendo as coisas do mascote, nome do jogador que fez gol"*): a MESMA
  // festa do campinho da aba Jogos (GOOOOL + mascote/escudo + autor, minuto e 🅰️ assistência), por cima do 3D, e a faixa do
  // locutor grita o gol do mesmo jeito. O campinho escondido é quem avisa (campo2d-festa.tsx) — aqui só desenha.
  const festa = useFestaCampo2D(match?.context.id)
  // 📊🎬😱 04/11: o resumo do apito, os melhores momentos e o QUASE — os MESMOS componentes do campinho da aba Jogos
  // (campo2d-resumo-ui.tsx), avisados pelo campinho que é a fonte deste campo. Nada disso existe antes do apito / do lance.
  const apito = useApitoCampo2D(match?.context.id), quase = useQuaseCampo2D(match?.context.id)
  const matchId = match?.context.id
  // Só muda o React quando muda o placar ou a frase — não a cada quadro de desenho.
  const resumoPenaltis = useSyncExternalStore(f => observarSuperficieCampo2D(id => { if (id === matchId) f() }), () => {
    const s = matchId ? superficieCampo2D(matchId) : undefined
    return s?.penalties ? JSON.stringify({...s.penalties,narration:s.narration}) : ''
  }, () => '')
  const penaltis = resumoPenaltis ? JSON.parse(resumoPenaltis) as {score:[number,number];finished:boolean;narration:string} : undefined
  const vivo = !!match && (!match.finished || !!penaltis && !penaltis.finished)
  if (!match && !ctl) return null
  const [nh, na] = match?.officialTeams ?? [t('Casa', 'Home'), t('Fora', 'Away')]
  const chip = (on: boolean): CSSProperties => ({ ...RESET, font: 'inherit', fontSize: 10.5, fontWeight: 800, padding: '4px 7px', border: 0, background: on ? GOLD : 'transparent', color: on ? INK : '#fff', cursor: 'pointer', pointerEvents: 'auto' })
  const grupo: CSSProperties = { display: 'inline-flex', border: '2px solid #fff', borderRadius: 9, overflow: 'hidden', flex: 'none' }
  const placar = match && <span className="pc3-scoreboard" style={{ display: 'inline-flex', alignItems: 'stretch', border: '2px solid #fffaf0', borderRadius: 9, overflow: 'hidden', background:INK, boxShadow:'2px 3px 0 #0c0c0c', ...OSW, flex: 'none' }}>
      <span style={{ background: INK, color: '#fffaf0', padding: '5px 8px', fontSize: 16, display: 'flex', alignItems: 'center', gap: 4 }}><i style={{ width: 10, height: 10, borderRadius: '50%', background: match.homeColor, border: '1.5px solid #fffaf0' }} />{sigla(nh)}</span>
      <span style={{ background: INK, color: '#fff', padding: '4px 10px', fontSize: 20 }}>{match.homeScore} – {match.awayScore}</span>
      <span style={{ background: INK, color: '#fffaf0', padding: '5px 8px', fontSize: 16, display: 'flex', alignItems: 'center', gap: 4 }}>{sigla(na)}<i style={{ width: 10, height: 10, borderRadius: '50%', background: match.awayColor, border: '1.5px solid #fffaf0' }} /></span>
      <span style={{ background: match.finished ? '#ddd' : GOLD, color: INK, padding: '4px 8px', fontSize: 14, display: 'flex', alignItems: 'center' }}>{penaltis ? `${t('PÊN', 'PENS')} ${penaltis.score[0]}–${penaltis.score[1]}` : match.finished ? t('FIM', 'FT') : <>{!match.paused && <i style={{ width: 6, height: 6, borderRadius: '50%', background: '#E8503A', marginRight: 4 }} />}{Math.min(93, Math.max(0, Math.floor(match.minute)))}'</>}</span>
    </span>
  return <>{festa && <div className="pc3-match-festa" aria-live="polite"><FestaGolCampo2D festa={festa} larg={Math.min(typeof window !== 'undefined' ? window.innerWidth : 390, 520)} /></div>}
   <div className="pc3-match-score">
    <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexWrap: 'wrap' }}>
      {placar}
      {vivo && !penaltis && ctl?.tatica && <button type="button" onClick={ctl.tatica} style={{ ...RESET, ...OSW, fontSize: 11, padding: '4px 8px', borderRadius: 8, border: '2px solid #fff', background: INK, color: '#fff', cursor: 'pointer', flex: 'none' }}>{t('🔁 Substituir / tática', '🔁 Subs / tactics')}</button>}
      {!vivo && ctl?.dia && <span style={{ ...OSW, fontSize: 11.5, color: GOLD, flex: 'none' }}>{ctl.dia}</span>}
      {!vivo && ctl?.chegando && <span style={{ fontSize: 10.5, fontWeight: 800, color: '#FFE79A', flex: 'none' }}>{t('🏟️ Dia de jogo! A torcida está chegando — apito às 16h', '🏟️ Match day! The fans are arriving — kick-off at 4pm')}</span>}
    </div>
    {vivo && torcedores > 0 && <div style={{ fontSize: 10.5, fontWeight: 800, color: '#FFE79A', marginTop: 3 }}>👥 {torcedores.toLocaleString(t('pt-BR', 'en-US'))} {t('torcedores', 'fans')}</div>}
    {penaltis ? <div className="pc3-match-narration">🥅 {penaltis.narration}</div> : vivo && festa ? <div key={`g${festa.lado}|${festa.autor}|${festa.min}`} className="pc3-match-narration ll44-gol-pisca" style={estiloPisca()}><span className="ll44-grito">{gritoGol((match?.officialTeams ?? [nh, na])[festa.lado], t('pt', 'en') === 'en', festa.autor, festa.min)}</span></div>
      : vivo && quase ? <><style>{QUASE_CSS}</style><div key={'q' + quase.k} className="pc3-match-narration" data-quase-campo2d={quase.tipo} style={estiloQuase()}>😱 {quase.txt}</div></>
      : vivo && match?.officialNarration && <div className="pc3-match-narration">🎙️ {match.officialNarration}</div>}
    {match?.finished && !vivo && apito && !festa && <div className="pc3-match-apito" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6, marginTop: 4, width: 'min(330px, 100%)' }}>
      {apito.replay && <BotaoReplayCampo2D replay={apito.replay} />}
      {apito.resumo && !apito.replay?.na && <ResumoApitoCampo2D resumo={apito.resumo} casa={apito.casa} fora={apito.fora} compacto />}
    </div>}
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
