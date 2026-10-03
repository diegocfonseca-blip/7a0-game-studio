import {PresidenciaEstadioImagem} from './presidencia-estadio-imagem'
import {PresidenteCamadas} from './presidente-camadas'
import {camadasDoPresidente} from './presidente-aparencia'
import {carteiraDaCarreira,type PresidenteBaseSave} from './presidencia-carreira'
import {conquistasDaCarreira,type ConquistasCarreira} from './presidencia-conquistas'
import {type CarreiraComEstadio} from './presidencia-estadio-integrado'
import {itemPresidencia} from './presidencia-economia'
import {vistaJanelaDisponivel} from './presidencia-vista-estadio'
import {getLang,useT} from './lang'
import './presidencia-sala-montagem.css'
import type {IdentidadePresidencia} from './presidencia-identidade-conta'
import {IdentidadeNaSala} from './presidencia-identidade-visual'
import {duplaDaGaragem} from './presidencia-garagem'
import {VeiculoNoSolo} from './veiculo-no-solo'
import {Fragment,useState} from 'react'
import {PresidenciaImagemLocal} from './presidencia-imagem-local'
import {Btn} from './ui-primitives'
import {podeSentarPresidente} from './presidente-pose'

const furniture=[['tapete','tapete'],['estante-simples','estante-simples-v51'],['estante-madeira','estante'],['sofa','sofa'],['luminaria','luminaria'],['lustre','lustre'],['quadro','quadro'],['aquario','aquario'],['planta','planta'],['cadeira-simples','cadeira-simples-v49'],['cadeira-couro','cadeira'],['mesa-simples','mesa-simples-v50'],['mesa-madeira','mesa']] as const
/** Layer assembly, not an assertion that every stadium camera is finished. */
export function SalaMontagem({state,mgrId,president,identity}:{state:CarreiraComEstadio&ConquistasCarreira;mgrId:number;president:PresidenteBaseSave;identity?:IdentidadePresidencia}){
 const t=useT(),wallet=carteiraDaCarreira(state,mgrId)
 const [shelfPage,setShelfPage]=useState(0)
 const [failed,setFailed]=useState<string[]>([]),[attempt,setAttempt]=useState(0)
 const assetRecovered=(id:string)=>setFailed(old=>old.includes(id)?old.filter(value=>value!==id):old)
 const assetFailed=(id:string)=>setFailed(old=>old.includes(id)?old:[...old,id])
 if(!wallet)return <p role="alert">{t('Não foi possível conferir os móveis comprados.','Could not verify purchased furniture.')}</p>
 const owned=new Set(wallet.owned.map(b=>b.id)),st=state.stadiums?.[mgrId]
 const initial=vistaJanelaDisponivel(st)
 const pair=duplaDaGaragem(wallet.owned,state.careerPresidency?.[mgrId]?.display)
 const shelf=owned.has('estante-simples')||owned.has('estante-madeira'),trophies=conquistasDaCarreira(state,mgrId,getLang()==='en')
 const pages=Math.max(1,Math.ceil(trophies.length/6)),page=Math.min(shelfPage,pages-1)
 const seated=podeSentarPresidente(president.outfit,wallet.owned)
 const missing=failed.filter(id=>id==='room'||wallet.owned.some(item=>item.id===id)||(shelf&&trophies.slice(page*6,page*6+6).some(item=>'trophy:'+item.id===id)))
 return <section aria-label={t('Montagem da sala','Office assembly')}>
  <div className="pr-scene">
   <div className="pr-window"><PresidenciaEstadioImagem stadium={st} camera="window"/></div>
   {initial&&<div className="pr-window pr-vehicles">{pair.map((id,index)=>id?<VeiculoNoSolo key={index} id={id} position={index} camera="room"/>:null)}</div>}
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
