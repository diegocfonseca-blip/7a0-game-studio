import { estadioDoClube } from './estadios-oficial'
import { observarSuperficieCampo2D, superficieCampo2D } from './campo2d-superficie'
// Score and narration stay above the pitch. Playback controls are expanded
// explicitly so the career map remains readable on a narrow mobile screen.
import {useState,useSyncExternalStore,type CSSProperties} from 'react'
import type { EstadoPartidaEstadio } from './presidencia-partida-model'
import { useControleMapa } from './controle-partida-mapa'
import { useRitmoCampo, VELOCIDADES_ESTADIO, rotuloVelocidadeCampo } from './presidencia-velocidade'
import { VEL2D_SOLO_VALORES } from './vel2d-regra'
import { useT } from './lang'
import { FestaGolCampo2D, useFestaCampo2D, TelaoGolMapa, useTelaoCampo2D } from './campo2d-festa'
import { estiloPisca, gritoGol } from './radio-pisca'
import { ResumoApitoCampo2D, BotaoReplayCampo2D, useApitoCampo2D, useQuaseCampo2D, QUASE_CSS, estiloQuase } from './campo2d-resumo-ui'

const INK = '#0C0C0C', GOLD = '#FFC400'
const OSW: CSSProperties = { fontFamily: 'Oswald, sans-serif', fontWeight: 900, textTransform: 'uppercase' }
/** (os botões do mapa têm 44 px de altura e sombra — aqui dentro eles são pílulas pequenas) */
const RESET: CSSProperties = { minHeight: 0, minWidth: 0, height: 'auto', margin: 0, boxShadow: 'none', lineHeight: 1.15 }
const sigla = (n: string) => (n.replace(/[^A-Za-zÀ-ú0-9 ]/g, '').trim().split(/\s+/).find(w => w.length > 2) ?? n).slice(0, 3).toUpperCase()

export function MapaHud({ match, torcedores = 0, replay = false }: { match: EstadoPartidaEstadio | null | undefined; /** 🎟️ público do jogo (lotação × lugares construídos) */ torcedores?: number
  /** 🔁 08/11: é o REPLAY de um jogo já encerrado ("Rever jogo salvo no mapa") — nada de "ao vivo" nem de substituir/tática */
  replay?: boolean }) {
  const t = useT(), ctl = useControleMapa(), ritmo = useRitmoCampo(),[controlsOpen,setControlsOpen]=useState(false)
  // ⚽ 04/11 (Diego: *"o gol na aba do mapa também não está aparecendo as coisas do mascote, nome do jogador que fez gol"*): a MESMA
  // festa do campinho da aba Jogos (GOOOOL + mascote/escudo + autor, minuto e 🅰️ assistência), por cima do 3D, e a faixa do
  // locutor grita o gol do mesmo jeito. O campinho escondido é quem avisa (campo2d-festa.tsx) — aqui só desenha.
  const festa = useFestaCampo2D(match?.context.id)
  const telao = useTelaoCampo2D(match?.context.id) // 📺 07/11: o telão do gol, igual ao do campinho da aba Jogos
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
  const oficial = !!match?.officialInput && vivo // ⏩ jogo do motor novo rolando: a marcha é a do campinho 2D
  const aoVivo = vivo && !replay // replay rola o relógio, mas o jogo já acabou: nada de bolinha vermelha nem de mexer no time
  if (!match && !ctl) return null
  const [nh, na] = match?.officialTeams ?? [t('Casa', 'Home'), t('Fora', 'Away')]
  const est = estadioDoClube(nh)
  const foraDeCasa = !!match && match.viewerClubId != null && match.viewerClubId === match.context.awayClubId
  const chip = (on: boolean): CSSProperties => ({ ...RESET, font: 'inherit', fontSize: 10.5, fontWeight: 800, padding: '4px 7px', border: 0, background: on ? GOLD : 'transparent', color: on ? INK : '#fff', cursor: 'pointer', pointerEvents: 'auto' })
  const grupo: CSSProperties = { display: 'inline-flex', border: '2px solid #fff', borderRadius: 9, overflow: 'hidden', flex: 'none' }
  // 🔎 21/11 (Diego: *"o placar do jogo diminua e coloque o estádio menor também embaixo do placar"*)
  const placar = match && <span className="pc3-scoreboard" style={{ display: 'inline-flex', alignItems: 'stretch', border: '2px solid #fffaf0', borderRadius: 9, overflow: 'hidden', background:INK, boxShadow:'2px 3px 0 #0c0c0c', ...OSW, flex: 'none' }}>
      <span style={{ background: INK, color: '#fffaf0', padding: '2px 5px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}><i style={{ width: 8, height: 8, borderRadius: '50%', background: match.homeColor, border: '1.5px solid #fffaf0' }} />{sigla(nh)}</span>
      <span style={{ background: INK, color: '#fff', padding: '1px 6px', fontSize: 13.5 }}>{match.homeScore} – {match.awayScore}</span>
      <span style={{ background: INK, color: '#fffaf0', padding: '2px 5px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>{sigla(na)}<i style={{ width: 8, height: 8, borderRadius: '50%', background: match.awayColor, border: '1.5px solid #fffaf0' }} /></span>
      <span style={{ background: match.finished ? '#ddd' : replay ? '#E8E0CC' : GOLD, color: INK, padding: '1px 5px', fontSize: 10.5, display: 'flex', alignItems: 'center' }}>{penaltis ? `${t('PÊN', 'PENS')} ${penaltis.score[0]}–${penaltis.score[1]}` : match.finished ? t('FIM', 'FT') : <>{replay ? <span style={{ marginRight: 4 }} aria-hidden="true">🔁</span> : !match.paused && <i style={{ width: 6, height: 6, borderRadius: '50%', background: '#E8503A', marginRight: 4 }} />}{Math.min(93, Math.max(0, Math.floor(match.minute)))}'</>}</span>
    </span>
  return <>{festa && <div className="pc3-match-festa" aria-live="polite"><FestaGolCampo2D festa={festa} larg={Math.min(typeof window !== 'undefined' ? window.innerWidth : 390, 520)} /></div>}
   <div className="pc3-match-score">
    <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexWrap: 'wrap' }}>
      {placar}
      {telao && !festa && <TelaoGolMapa telao={telao} />}
      {replay && <span className="pc3-hud-selo" style={{ ...OSW, fontSize: 11, padding: '4px 8px', borderRadius: 8, border: '2px solid #fff', background: '#E8503A', color: '#fff', flex: 'none' }}>{t('🔁 Replay · jogo encerrado', '🔁 Replay · match over')}</span>}
      {!vivo && !replay && ctl?.dia && <span className="pc3-hud-data" style={{ ...OSW, fontSize: 11.5, color: GOLD, flex: 'none', background: INK, border: '2px solid #fffaf0', borderRadius: 8, padding: '3px 7px', boxShadow: '2px 2px 0 #0c0c0c' }}>{ctl.dia}</span>}
      {!vivo && !replay && ctl?.chegando && <span style={{ fontSize: 10.5, fontWeight: 800, color: '#FFE79A', flex: 'none', background: '#0c0c0cd9', borderRadius: 7, padding: '3px 7px' }}>{t('🏟️ Dia de jogo! A torcida está chegando — apito às 16h', '🏟️ Match day! The fans are arriving — kick-off at 4pm')}</span>}
    </div>
    {/* 🏟️ 19/11 (Diego: *"não ficou claro pro usuário o campo da casa do adversário… deve aparecer mais claro o nome de cada estádio"*):
        o nome do estádio do MANDANTE, e quando o seu clube joga fora, isso fica escrito */}
    {match && <div className="pc3-hud-estadio" style={{ ...OSW, fontSize: 8.5, marginTop: 2, background: foraDeCasa ? '#7C3AED' : INK, color: '#fffaf0', border: '1.5px solid #fffaf0', borderRadius: 7, padding: '2px 6px', boxShadow: '1px 2px 0 #0c0c0c', display: 'inline-block', maxWidth: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
      🏟️ {est.nome} · {foraDeCasa ? (est.inventado ? t('🚌 você joga fora', "🚌 you're away") : t(`🚌 fora · casa do ${nh}`, `🚌 away · ${nh}'s ground`)) : est.inventado ? t('em casa', 'home') : t(`casa do ${nh}`, `${nh}'s ground`)}
    </div>}
    {aoVivo && torcedores > 0 && <div style={{ fontSize: 9.5, fontWeight: 800, color: '#FFE79A', marginTop: 2, background: '#0c0c0cbb', borderRadius: 5, padding: '2px 7px' }}>👥 {torcedores.toLocaleString(t('pt-BR', 'en-US'))} {t('torcedores', 'fans')}</div>}
    {penaltis ? <div className="pc3-match-narration">🥅 {penaltis.narration}</div> : vivo && festa ? <div key={`g${festa.lado}|${festa.autor}|${festa.min}`} className="pc3-match-narration ll44-gol-pisca" style={estiloPisca()}><span className="ll44-grito">{gritoGol((match?.officialTeams ?? [nh, na])[festa.lado], t('pt', 'en') === 'en', festa.autor, festa.min)}</span></div>
      : vivo && quase ? <><style>{QUASE_CSS}</style><div key={'q' + quase.k} className="pc3-match-narration" data-quase-campo2d={quase.tipo} style={estiloQuase()}>😱 {quase.txt}</div></>
      : vivo && match?.officialNarration && <div className="pc3-match-narration">🎙️ {match.officialNarration}</div>}
    {match?.finished && !vivo && apito && !festa && <div className="pc3-match-apito" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6, marginTop: 4, width: 'min(330px, 100%)' }}>
      {apito.replay && <BotaoReplayCampo2D replay={apito.replay} />}
      {apito.resumo && !apito.replay?.na && <ResumoApitoCampo2D resumo={apito.resumo} casa={apito.casa} fora={apito.fora} compacto />}
    </div>}
   </div>
   {/* ⏩🔒 21/11 (Diego: *"a velocidade deve ser padrão a que tem no campo 2D… botão manual dentro do quadro do jogo embaixo… só quem
       tem plano, quem não tem fica com cadeado"*): no jogo OFICIAL a marcha é a do campinho (1× … 4×) e mora aqui embaixo, junto do
       AUTO/MANUAL; sem plano o mesmo lugar mostra o cadeado, que abre as ofertas de sempre. */}
   {(ctl||ritmo)&&!replay&&<div className="pc3-match-controls">
    {aoVivo && !penaltis && ctl?.tatica && <button type="button" className="pc3-match-controls-toggle" data-substituir-mapa onClick={ctl.tatica} style={{ order: 2 }}>🔁 {t('Substituir', 'Subs')}</button>}
    {oficial&&ctl?.cadeado&&!ctl.manualOk
     ? <button type="button" className="pc3-match-controls-toggle" onClick={()=>ctl.cadeado?.()}>🎮 {t('Manual e velocidade','Manual and speed')}<span>🔒</span></button>
     : <button type="button" className="pc3-match-controls-toggle" aria-expanded={controlsOpen} onClick={()=>setControlsOpen(v=>!v)}>{controlsOpen?t('Fechar controles','Close controls'):t('Controles','Controls')}{oficial&&ctl?.marcha?<span>{rotuloVelocidadeCampo(ctl.marcha)}</span>:ritmo&&vivo&&<span>{rotuloVelocidadeCampo(ritmo.speed)}</span>}</button>}
    {controlsOpen&&!(oficial&&ctl?.cadeado&&!ctl.manualOk)&&<div className="pc3-match-controls-panel" role="group" aria-label={t('Controles da partida','Match controls')}>
    {(ctl?.manualOk || (ritmo && vivo)) && <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
      {ctl && ctl.manualOk && <span style={grupo}><button type="button" style={chip(!ctl.manual)} onClick={() => { if (ctl.manual) ctl.alternaManual() }}>🔁 {t('AUTO', 'AUTO')}</button><button type="button" style={chip(ctl.manual)} onClick={() => { if (!ctl.manual) ctl.alternaManual() }}>🎮 MANUAL</button></span>}
      {oficial && ctl?.cadeado ? <button type="button" style={{...chip(false),border:'2px solid #fff',borderRadius:9,minHeight:44,fontSize:12}} onClick={()=>ctl.cadeado!()}>⏩ {t('Velocidade','Speed')} 🔒</button>
       : oficial && ctl?.mudaMarcha ? <span style={{...grupo,flexWrap:'wrap',maxWidth:'100%'}}>{VEL2D_SOLO_VALORES.map(v => <button key={v} type="button" aria-pressed={ctl.marcha===v} aria-label={t('Velocidade da partida','Match speed')+' '+rotuloVelocidadeCampo(v)} style={{...chip(ctl.marcha === v),minHeight:44,minWidth:40,fontSize:13}} onClick={() => ctl.mudaMarcha!(v)}>{rotuloVelocidadeCampo(v)}</button>)}</span>
       : <>{ritmo && vivo && <span style={{...grupo,flexWrap:'wrap',maxWidth:'100%'}}>{VELOCIDADES_ESTADIO.map(v => <button key={v} type="button" aria-pressed={ritmo.speed===v} aria-label={t('Velocidade da partida','Match speed')+' '+rotuloVelocidadeCampo(v)} style={{...chip(ritmo.speed === v),minHeight:44,minWidth:44,fontSize:13}} onClick={() => ritmo.onSet(v)}>{rotuloVelocidadeCampo(v)}</button>)}</span>}
      {ctl && ctl.manual && !(ritmo && vivo) && <span style={grupo}>{[1, 2, 3, 4].map(v => <button key={v} type="button" style={chip(ctl.velocidade === v)} onClick={() => ctl.mudaVelocidade(v)}>{v}×</button>)}</span>}</>}
    </div>}
    </div>}
   </div>}
  </>
}
