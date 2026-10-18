import {PresidenciaJanelaViva} from './presidencia-janela-viva'
import {PresidenteCamadas} from './presidente-camadas'
import {camadasDoPresidente} from './presidente-aparencia'
import {carteiraDaCarreira,type PresidenteBaseSave} from './presidencia-carreira'
import {conquistasDaCarreira,type ConquistasCarreira} from './presidencia-conquistas'
import {type CarreiraComEstadio} from './presidencia-estadio-integrado'
import {itemPresidencia} from './presidencia-economia'
import {getLang,useT} from './lang'
import './presidencia-sala-montagem.css'
import type {IdentidadePresidencia} from './presidencia-identidade-conta'
import {IdentidadeNaSala} from './presidencia-identidade-visual'
import {Component,Fragment,lazy,Suspense,useMemo,useState,type ReactNode} from 'react'
import {PresidenciaImagemLocal} from './presidencia-imagem-local'
import {Btn} from './ui-primitives'
import {podeSentarPresidente} from './presidente-pose'
import {usePresidentPreview} from './presidente-acesso'
import {usePartidaNoMapa} from './presidencia-partida-sincronia'
import {jornadaDoComplexo} from './presidencia-complexo-jornada'
import {estadioVisualValido} from './presidencia-estadio-validacao'
import type {ControleComplexo} from './presidencia-complexo-3d'
import {artesIdentidadeSala} from './presidencia-sala-identidade-assets'
import {useVistaCampo} from './presidencia-campo-observacao'
import {RitmoCampo} from './presidencia-velocidade'

const Sala3D=lazy(()=>import('./presidencia-complexo-3d'))
type SalaProps={state:CarreiraComEstadio&ConquistasCarreira;mgrId:number;president:PresidenteBaseSave;identity?:IdentidadePresidencia;onReady?:(api:ControleComplexo|null)=>void}
class SalaProtegida extends Component<{children:ReactNode;fallback:ReactNode},{failed:boolean}>{
 state={failed:false}
 static getDerivedStateFromError(){return {failed:true}}
 render(){return this.state.failed?this.props.fallback:this.props.children}
}

/** One 3D room for the private account. The illustrated composition remains
 * available only as compatibility fallback; no wallet or character is written. */
export function SalaMontagem(props:SalaProps){
 const {state,mgrId,president,identity,onReady}=props,allowed=usePresidentPreview(),t=useT()
 const watching=useVistaCampo<HTMLElement>(allowed)
 const match=usePartidaNoMapa(undefined,mgrId),[failed,setFailed]=useState(false),[attempt,setAttempt]=useState(0)
 const [trophyPage,setTrophyPage]=useState(0)
 const identityArt=useMemo(()=>artesIdentidadeSala(identity),[identity?.name,identity?.crest,identity?.shirt,identity?.mascot,identity?.color])
 const wallet=carteiraDaCarreira(state,mgrId),stadium=state.stadiums?.[mgrId]
 const compatible=<><p role="status">{t('Esta é a vista ilustrada de compatibilidade.','This is the illustrated compatibility view.')}</p><SalaIlustrada {...props}/></>
 if(!allowed)return <SalaIlustrada {...props}/>
 if(!wallet)return <p role="alert">{t('Não foi possível conferir os móveis comprados.','Could not verify purchased furniture.')}</p>
 if(stadium!==undefined&&!estadioVisualValido(stadium))return <p role="alert">{t('Não foi possível conferir as obras do estádio. Reabra sua carreira.','Could not verify stadium construction. Reopen your career.')}</p>
 const agenda=match?.context.agenda,journey=agenda?jornadaDoComplexo({agenda,match,stadiumClubId:mgrId}):undefined
 const trophies=conquistasDaCarreira(state,mgrId,getLang()==='en')
 return <section ref={watching} data-presidencia-sala-3d aria-label={t('Sala da Presidência','President’s office')}>
  <RitmoCampo/>
  {failed?<>{compatible}<Btn onClick={()=>{setFailed(false);setAttempt(n=>n+1)}}>{t('TENTAR ABRIR EM 3D','RETRY 3D OFFICE')}</Btn></>:<SalaProtegida key={attempt} fallback={compatible}>
   <Suspense fallback={<p role="status">{t('Abrindo sua sala…','Opening your office…')}</p>}>
    <Sala3D stadium={stadium} presidency={wallet} president={president} identityArt={identityArt} trophies={trophies} trophyPage={trophyPage} presentation="office" match={match??undefined} journey={journey} onReady={onReady} onUnavailable={()=>setFailed(true)}/>
   </Suspense>
  </SalaProtegida>}
  {identity&&<p className="gp-rule">{identity.name}</p>}
  {trophies.length>9&&wallet.owned.some(i=>i.id.startsWith('estante-'))&&<Btn bg="#fff" onClick={()=>setTrophyPage(n=>(n+1)%Math.ceil(trophies.length/9))}>{t('VER OUTROS TROFÉUS','VIEW OTHER TROPHIES')}</Btn>}
  <details className="pr-trophy-details"><summary>{t('CONQUISTAS DO CLUBE','CLUB HONORS')}</summary>{trophies.length?<ul>{trophies.map(item=><li key={item.id}><span>{item.label}</span><strong>{item.count} {t('títulos','titles')}</strong></li>)}</ul>:<p>{t('Seus próximos títulos aparecerão aqui.','Your next titles will appear here.')}</p>}</details>
  <p className="gp-rule">{t('Arraste para explorar a sala. Use dois dedos para aproximar. A janela acompanha as obras e a partida do seu estádio.','Drag to explore your office. Pinch to zoom. The window follows your stadium construction and match.')}</p>
 </section>
}

const furniture=[['tapete','tapete'],['estante-simples','estante-simples-v51'],['estante-madeira','estante'],['sofa','sofa'],['luminaria','luminaria'],['lustre','lustre'],['quadro','quadro'],['aquario','aquario'],['planta','planta'],['cadeira-simples','cadeira-simples-v49'],['cadeira-couro','cadeira'],['mesa-simples','mesa-simples-v50'],['mesa-madeira','mesa']] as const
/** Layer assembly, not an assertion that every stadium camera is finished. */
export function SalaIlustrada({state,mgrId,president,identity}:SalaProps){
 const t=useT(),wallet=carteiraDaCarreira(state,mgrId)
 const [shelfPage,setShelfPage]=useState(0)
 const [failed,setFailed]=useState<string[]>([]),[attempt,setAttempt]=useState(0)
 const assetRecovered=(id:string)=>setFailed(old=>old.includes(id)?old.filter(value=>value!==id):old)
 const assetFailed=(id:string)=>setFailed(old=>old.includes(id)?old:[...old,id])
 if(!wallet)return <p role="alert">{t('Não foi possível conferir os móveis comprados.','Could not verify purchased furniture.')}</p>
 const owned=new Set(wallet.owned.map(b=>b.id)),st=state.stadiums?.[mgrId]
 const shelf=owned.has('estante-simples')||owned.has('estante-madeira'),trophies=conquistasDaCarreira(state,mgrId,getLang()==='en')
 const pages=Math.max(1,Math.ceil(trophies.length/6)),page=Math.min(shelfPage,pages-1)
 const seated=podeSentarPresidente(president.outfit,wallet.owned)
 const missing=failed.filter(id=>id==='room'||wallet.owned.some(item=>item.id===id)||(shelf&&trophies.slice(page*6,page*6+6).some(item=>'trophy:'+item.id===id)))
 return <section aria-label={t('Montagem da sala','Office assembly')}>
  <div className="pr-scene">
   <div className="pr-window"><PresidenciaJanelaViva stadium={st} mgrId={mgrId}/></div>
   <PresidenciaImagemLocal key={'room:'+attempt} className="pr-layer" onUnavailable={()=>assetFailed('room')} onRecovered={()=>assetRecovered('room')} src={import.meta.env.BASE_URL+'presidencia-moveis/sala-vazia.webp'} alt=""/>
   {furniture.filter(([id])=>owned.has(id)).map(([id,file])=><Fragment key={id}>
    {seated&&id.startsWith('mesa-')&&<div aria-hidden="true" className="pr-president pr-president-seated pr-president-body"><PresidenteCamadas ids={camadasDoPresidente(president)} pose="seated"/></div>}
    <PresidenciaImagemLocal key={attempt} onUnavailable={()=>assetFailed(id)} onRecovered={()=>assetRecovered(id)} className={'pr-layer'+(id==='cadeira-simples'?' pr-chair-basic':'')} data-owned-furniture={id} src={import.meta.env.BASE_URL+'presidencia-moveis/'+file+'.webp'} alt={t(itemPresidencia(id)!.pt,itemPresidencia(id)!.en)}/>
   </Fragment>)}
   {shelf&&<div className={'pr-trophies'+(owned.has('estante-simples')?' pr-basic-shelf':'')} aria-label={t('Troféus por competição','Trophies by competition')}>{trophies.slice(page*6,page*6+6).map(item=><span key={item.id} data-trophy-group={item.id} title={`${item.label}: ${item.count}`} aria-label={`${item.label}: ${item.count}`}><PresidenciaImagemLocal key={attempt} onUnavailable={()=>assetFailed('trophy:'+item.id)} onRecovered={()=>assetRecovered('trophy:'+item.id)} src={import.meta.env.BASE_URL+'trofeus-v137/'+item.id+'.webp'} alt=""/>{item.count!>1&&<b>×{item.count}</b>}</span>)}</div>}
   <div className={'pr-president'+(seated?' pr-president-seated':'')} data-president-pose={seated?'seated':'standing'}><PresidenteCamadas ids={camadasDoPresidente(president)} pose={seated?'seated':'standing'}/></div>
   {identity&&<IdentidadeNaSala identity={identity} desk={owned.has('mesa-simples')||owned.has('mesa-madeira')} frame={owned.has('quadro')}/>}
  </div>
  {missing.length>0&&<div role="alert"><p>{t('Algumas imagens da sala não carregaram. Seus móveis e troféus continuam guardados.','Some office images did not load. Your furniture and trophies are still saved.')}</p><Btn bg="#fff" onClick={()=>{setFailed([]);setAttempt(n=>n+1)}}>{t('TENTAR CARREGAR A SALA','RETRY OFFICE IMAGES')}</Btn></div>}
  {shelf&&pages>1&&<div style={{display:'flex',flexWrap:'wrap',gap:12,alignItems:'center',marginTop:12}}><span aria-live="polite">{t('Estante','Shelf')} {page+1}/{pages}</span><Btn bg="#fff" onClick={()=>setShelfPage((page+1)%pages)}>{t('VER OUTROS TROFÉUS','VIEW OTHER TROPHIES')}</Btn></div>}
  {shelf&&<details className="pr-trophy-details">
   <summary>{t('CONQUISTAS DA ESTANTE','TROPHY CABINET HONORS')}</summary>
   {trophies.length?<ul>{trophies.map(item=><li key={item.id}><span>{item.label}</span><strong>{item.count} {item.count===1?t('título','title'):t('títulos','titles')}</strong></li>)}</ul>:<p>{t('Sua estante está pronta para os próximos títulos.','Your cabinet is ready for future titles.')}</p>}
  </details>}
  <p className="gp-rule">{t('Sua sala mostra os móveis comprados. Mesa e cadeira juntas permitem a pose sentada; a janela acompanha as obras do seu estádio.','Your office shows purchased furniture. A desk and chair together enable the seated pose; the window follows your stadium construction.')}</p>
 </section>
}
