import {PresidenciaEntrada} from './presidencia-entrada'
import {PRESIDENCY_ECONOMY_RELEASED} from './presidencia-lotes'
import {PresidentePainel} from './presidente-painel'
import {salvarPresidenteNaCarreira,type CarreiraPresidencia,type PresidenteBaseSave} from './presidencia-carreira'
import {conquistasDaCarreira,type ConquistasCarreira} from './presidencia-conquistas'
import {useState} from 'react'
import {getPlanoConta,presidenteContaLiberado,salvarPresidenteConta,usePresidenteConta} from './presidente-conta'
import {carteiraDaCarreira} from './presidencia-carreira'
import {GaragemCarreira} from './garagem-carreira'
import type {PresidenciaOrcamento} from './presidencia-economia'
import type {DuplaGaragem} from './presidencia-garagem'
import {Btn} from './ui-primitives'
import type {CarreiraComEstadio} from './presidencia-estadio-integrado'
import {SalaMontagem} from './presidencia-sala-montagem'
import type {MeuSocio} from './manto'
import {identidadeDaConta} from './presidencia-identidade-conta'
import {historiaDaPresidencia,type CronicaPresidencia} from './presidencia-historia'
import {getLang,useT} from './lang'
import {melhorDivisaoRegistrada,type DivisaoPresidencia} from './presidencia-divisao'
import {acessosDaPresidencia} from './presidencia-acessos'
import {valorEstadioPresidencia,valorElencoPresidencia} from './presidencia-valores'
import {usePresidentPreview} from './presidente-acesso'

/** O save da carreira controla tanto o primeiro cadastro quanto a edição.
 * Nenhum visual temporário é tratado como persistido.
 * 🔁 15/10 (Diego: "sempre com base no e-mail"): com a conta ligada (`presidenteContaLiberado`), o presidente
 * que aparece e se edita aqui é o DA CONTA — a mesma pessoa em toda carreira. A posse (`sinceSeason`) continua
 * vindo do save da carreira, porque mandato é do clube, não da pessoa. Salvar grava nos DOIS: conta e carreira. */
export function PresidenciaClube({state,mgrId,onSave,onBack,onStadium,onTrade:tradeHandler,onDisplay:displayHandler,member,tierColor}:{
 state:CarreiraPresidencia & CarreiraComEstadio & ConquistasCarreira & CronicaPresidencia & DivisaoPresidencia & {careerPresident?:{name:string;outfit:string};seasonNo?:number;managers:readonly {id:number;isHuman?:boolean;teamName?:string;squad?:readonly {paid?:number}[]}[]};
 mgrId:number;onSave:(value:PresidenteBaseSave)=>boolean;onBack:()=>void;
 onTrade?:(quote:PresidenciaOrcamento)=>boolean;onDisplay?:(pair:DuplaGaragem)=>boolean;
 onStadium?:()=>void;onRoof?:(closed:boolean)=>void;
 member?:MeuSocio|null;tierColor?:string;
}){
 const privateRoom=usePresidentPreview()
 const [destination,G]=useState<'entry'|'garage'|'furniture'|'room'|null>('entry')
 const garage=destination==='entry'?(privateRoom?'room':null):destination
 const onTrade=PRESIDENCY_ECONOMY_RELEASED?tradeHandler:undefined
 const onDisplay=PRESIDENCY_ECONOMY_RELEASED?displayHandler:undefined
 const t=useT()
 const wallet=carteiraDaCarreira(state,mgrId)
 const valuationManagers:readonly {id:number;squad?:readonly {paid?:number}[]}[]=state.managers
 const identity=identidadeDaConta(state.managers[state.youIdx]?.teamName??'',member,tierColor)
 const conta=usePresidenteConta(),contaOk=presidenteContaLiberado()
 const posse=state.careerPresidentBase?.sinceSeason
 const saved:PresidenteBaseSave|undefined=contaOk&&conta.value?{...conta.value,...(posse!==undefined?{sinceSeason:posse}:{})}:state.careerPresidentBase
 const save=async(value:PresidenteBaseSave)=>{
  if(!salvarPresidenteNaCarreira(state,mgrId,value,getPlanoConta()).ok)return false
  if(contaOk&&!(await salvarPresidenteConta(value)))return false
  return onSave(value)
 }
 return <PresidenciaEntrada saved={saved} legacy={state.careerPresident} onSave={save} onBack={onBack}>
  {value=>garage==='room'?<div className="pp-club-panel"><SalaMontagem state={state} mgrId={mgrId} president={value} identity={identity}/><div style={{display:'flex',flexWrap:'wrap',gap:12,marginTop:12}}><Btn bg="#fff" onClick={()=>G(null)}>{t('PERFIL E APARÊNCIA','PROFILE AND APPEARANCE')}</Btn>{onTrade&&onDisplay&&<><Btn onClick={()=>G('furniture')}>{t('MOBÍLIAS','FURNITURE')}</Btn><Btn bg="#fff" onClick={()=>G('garage')}>{t('GARAGEM','GARAGE')}</Btn></>}{onStadium&&<Btn onClick={onStadium}>{t('IR AO ESTÁDIO','GO TO STADIUM')}</Btn>}</div></div>:garage&&onTrade&&onDisplay?<GaragemCarreira key={garage} furniture={garage==='furniture'} stadiumSave={state.stadiums?.[mgrId]} wallet={carteiraDaCarreira(state,mgrId)} display={state.careerPresidency?.[mgrId]?.display} onTrade={onTrade} onDisplay={onDisplay} onBack={()=>G(privateRoom?'room':null)}/>:<div className="pp-club-panel"><PresidentePainel value={value} onSave={save} onClose={onBack} data={{
   club:state.managers[state.youIdx]?.teamName??'',season:state.seasonNo,
   sinceSeason:value.sinceSeason,
   bestDivision:melhorDivisaoRegistrada(state,mgrId,getLang()==='en'),
   promotions:acessosDaPresidencia(state,mgrId),
   stadiumValue:valorEstadioPresidencia(state.stadiums?.[mgrId]),
   squadValue:valorElencoPresidencia(valuationManagers.find(m=>m.id===mgrId)?.squad),
   cash:state.careerCoins?.[mgrId],owned:wallet?.owned,
   trophies:conquistasDaCarreira(state,mgrId,getLang()==='en'),
   timeline:historiaDaPresidencia(state,mgrId,getLang()==='en'),
  }}/><div style={{marginTop:16}}><Btn bg="#fff" onClick={()=>G('room')}>{t('ENTRAR NA SALA','ENTER OFFICE')}</Btn></div>{onTrade&&onDisplay&&<div style={{marginTop:16,display:'flex',flexWrap:'wrap',gap:12}}><Btn onClick={()=>G('garage')}>{t('GARAGEM','GARAGE')}</Btn><Btn bg="#fff" onClick={()=>G('furniture')}>{t('MOBÍLIAS','FURNITURE')}</Btn></div>}</div>}
 </PresidenciaEntrada>
}
