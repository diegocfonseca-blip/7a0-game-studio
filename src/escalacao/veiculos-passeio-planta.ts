import {TERRENO_USUARIO as HOME,RUA_FRENTE_CASA} from './residencia-planta'
import {PLANTAS_ESTACIONAMENTO_COMPLEXO} from './presidencia-complexo-transporte-model'
import {caminhoPelasRuas,arredondarCaminho,viagemVeiculo,type PontoEntrega} from './veiculos-entrega-rota'
import {segmentoLivre} from './presidencia-estadio-navegacao'
import type {RuaComplexo} from './presidencia-complexo-ruas'
import type {SolidoEntorno} from './presidencia-complexo-entorno'
import type {PerfilVeiculo} from './veiculos-modelos'
export type SentidoPasseio='stadium'|'home'
export type TrechoPasseio={reverse:boolean;trip:ReturnType<typeof viagemVeiculo>}
export type ResultadoPasseio={ok:true;legs:TrechoPasseio[];bay:{x:number;z:number};distance:number}|{ok:false;error:'no-parking'|'blocked'|'no-route'}
/** Só endereços e apresentação. Não compra veículo, não avança calendário ou partida. */
export function planejarPasseioCarro({car,slot,roads,solids,parkingStage,direction,ground}:{car:PerfilVeiculo;slot:number;roads:readonly RuaComplexo[];solids:readonly SolidoEntorno[];parkingStage:number;direction:SentidoPasseio;ground:(p:{x:number;z:number})=>PontoEntrega}):ResultadoPasseio{
 if(parkingStage<1)return{ok:false,error:'no-parking'}
 const bay=PLANTAS_ESTACIONAMENTO_COMPLEXO[0].slots[5].center,aisle=bay.z+6.7
 const home={x:HOME.garage.x+(slot%2===0?-2.1:2.1),z:HOME.garage.z}
 const front=HOME.z+HOME.depth/2,entry={x:330,z:97.5},approach={x:HOME.garage.x,z:front+9}
 let reverse:{x:number;z:number}[],forward:{x:number;z:number}[]
 if(direction==='stadium'){
  reverse=[home,{x:home.x,z:RUA_FRENTE_CASA-6},{x:home.x-6,z:RUA_FRENTE_CASA},{x:home.x-18,z:RUA_FRENTE_CASA}]
  // Termina a ré olhando para leste; sai pela avenida do lado leste do bairro.
  const junction={x:548,z:RUA_FRENTE_CASA},street=caminhoPelasRuas(roads,junction,entry,3)
  if(!street)return{ok:false,error:'no-route'}
  forward=[reverse.at(-1)!,junction,...street.slice(1),{x:280,z:97.5},{x:189,z:97.5},{x:189,z:aisle},{x:bay.x,z:aisle},bay]
 }else{
  reverse=[bay,{x:bay.x,z:aisle},{x:bay.x-12,z:aisle}]
  const street=caminhoPelasRuas(roads,entry,approach,8)
  if(!street)return{ok:false,error:'no-route'}
  const side=HOME.garage.x+7.5
  forward=[reverse.at(-1)!,{x:198,z:aisle},{x:198,z:97.5},entry,...street.slice(1),{x:HOME.garage.x,z:front+1},{x:side,z:front-2},{x:side,z:home.z+4},{x:home.x,z:home.z+3},home]
 }
 const obstacles=solids.filter(s=>s.top>.35&&s.base<2.2).map(s=>({id:s.id,polygon:s.footprint.map(p=>({x:p.x,y:p.z}))}))
 const legs:TrechoPasseio[]=[]
 for(const [index,raw] of [reverse,forward].entries()){
  const dedup=raw.filter((p,i)=>!i||Math.hypot(p.x-raw[i-1].x,p.z-raw[i-1].z)>.05)
  const path=arredondarCaminho(dedup,index===0?3:4)
  for(let i=1;i<path.length;i++)if(!segmentoLivre({x:path[i-1].x,y:path[i-1].z},{x:path[i].x,y:path[i].z},obstacles,car.width/2+.1))return{ok:false,error:'blocked'}
  const samples=path.flatMap((p,i)=>{if(!i)return[p];const a=path[i-1],steps=Math.max(1,Math.ceil(Math.hypot(p.x-a.x,p.z-a.z)));return Array.from({length:steps},(_,k)=>({x:a.x+(p.x-a.x)*(k+1)/steps,z:a.z+(p.z-a.z)*(k+1)/steps}))})
  legs.push({reverse:index===0,trip:viagemVeiculo(samples.map(ground),index===0?2:8)})
 }
 return{ok:true,legs,bay:{...bay},distance:legs.reduce((n,l)=>n+l.trip.length,0)}
}
