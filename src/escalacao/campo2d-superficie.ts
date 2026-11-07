import type {MarcadorCampo2D} from './campo2d-marcador'
import type {ArredoresMapa} from './campo2d-arredores'
/** One existing Campo2D canvas, shared read-only with the city. No engine,
 * clock, result, network or persistence lives here. */
export type EfeitosSuperficie2D={pouso?:{x:number;z:number;falta:number};chapeu?:{x:number;z:number;age:number};trave?:{sign:number;age:number};gol?:{side:'home'|'away';key:string}}
export type SuperficieCampo2D={id:string;owner:object;canvas:HTMLCanvasElement;rect:{x:number;y:number;width:number;height:number};landscape:boolean;minute:number;players:readonly {key:string;name:string;side:'home'|'away';keeper:boolean;x:number;z:number;radius:number;marker:MarcadorCampo2D}[];ball:{x:number;y:number;z:number};referee:{x:number;z:number};net?:{sign:number;time:number;age:number};score:readonly [number,number];narration:string;/** 🚩📸 07/11: bandeirinhas e fotógrafos (coordenadas do CAMPO) */arredores?:ArredoresMapa;penalties?:{score:readonly [number,number];finished:boolean};/** 🔁 04/11: o que o campinho da aba Jogos mostra e o mapa também precisa mostrar */clima?:'sol'|'nublado'|'chuva';falas?:readonly [string,string];autorGol?:string;/** 🧢 04/11: o sobrenome dos técnicos na beira do campo (o balão já ia; faltava o técnico) */tecnicos?:readonly [string,string];/** 😱 04/11: o QUASE (trave/defesa difícil) — o anel no gramado e o "uhhh" da torcida; `age` 0→1 */quase?:{side:'home'|'away';x:number;z:number;age:number;trave:boolean};/** ✨ 07/11: os efeitos de lance (só quando a conta tem os efeitos ligados) — coordenadas do MAPA (x ao longo do campo, z na largura) */efeitos?:EfeitosSuperficie2D;revision:number;active:boolean}
const surfaces=new Map<string,SuperficieCampo2D>()
let revision=0
const demands=new Map<string,Map<object,number>>(),listeners=new Set<(id:string)=>void>()
export function pedirSuperficieCampo2D(id:string,consumer:object,fps:number){
 let map=demands.get(id)
 if(fps>0){if(!map){map=new Map();demands.set(id,map)}map.set(consumer,Math.max(1,Math.min(30,fps)))}
 else{map?.delete(consumer);if(!map?.size){demands.delete(id);if(surfaces.has(id)&&!surfaces.get(id)!.active)surfaces.delete(id)}}
}
export function demandaSuperficieCampo2D(id:string){return Math.max(0,...(demands.get(id)?.values()??[]))}
export function publicarSuperficieCampo2D(frame:Omit<SuperficieCampo2D,'revision'|'active'>){surfaces.set(frame.id,{...frame,revision:++revision,active:true});listeners.forEach(fn=>fn(frame.id))}
export function soltarSuperficieCampo2D(id:string,owner:object){const current=surfaces.get(id);if(!current||current.owner!==owner)return;if(demandaSuperficieCampo2D(id))surfaces.set(id,{...current,active:false});else surfaces.delete(id)}
export function superficieCampo2D(id:string){return surfaces.get(id)}
export function observarSuperficieCampo2D(fn:(id:string)=>void){listeners.add(fn);return()=>{listeners.delete(fn)}}
// Keep the same presentation engine when the owner switches cinema/2D while
// the map is open. A bounded cache also covers one explicit saved replay.
const engines=new Map<string,unknown>()
export function motorCompartilhadoCampo2D<T>(id:string,create:()=>T):T{
 if(engines.has(id)){const value=engines.get(id) as T;engines.delete(id);engines.set(id,value);return value}
 const game=create();engines.set(id,game);if(engines.size>3)engines.delete(engines.keys().next().value!);return game
}
