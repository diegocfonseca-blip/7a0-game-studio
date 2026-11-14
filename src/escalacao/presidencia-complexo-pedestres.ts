import {PLANTA_COMPLEXO,deslocarCaminhoComplexo,type EstadoComplexo,type PontoComplexo} from './presidencia-complexo-model'
export type PontoPasseioComplexo=PontoComplexo&{y:number}
export type LigacaoPedestreComplexo={id:string;points:PontoPasseioComplexo[];width:number;polygon:PontoComplexo[];floor:number;material:'public'|'club';reason:string;joins:string[];parkingLot?:string;portalLot?:string}
/** Ligações físicas da implantação, independentes da posse dos edifícios vizinhos. */
export function plantaPedestreComplexo(state:EstadoComplexo){
 const planned:(LigacaoPedestreComplexo&{enabled:boolean})[]=[]
 const add=(id:string,values:readonly PontoComplexo[],width:number,enabled=true,material:'public'|'club'='club',portalLot?:string)=>{
  const points=values.map(p=>({...p,y:.16})),polygon=[...deslocarCaminhoComplexo(points,width/2),...deslocarCaminhoComplexo(points,-width/2).reverse()]
  planned.push({id,points,width,polygon,floor:.16,material,enabled,reason:'Ligação contínua entre praça e destino',joins:[id,'praca-torcedor'],...(portalLot?{portalLot}:{})})
 }
 const line=(v:number[][])=>v.map(([x,z])=>({x,z}))
 add('pedestre-praca-eixo',line([[0,325],[0,212],[0,115],[-4.55,115]]),5,true,'public')
 add('pedestre-praca-transversal',line([[-90,165],[135,165]]),4,true,'public')
 add('pedestre-loja-portao',PLANTA_COMPLEXO.routes.shop.points,3,!!state.extras.loja)
 add('pedestre-museu',line([[-35,165],[-60,157],[-60,149]]),3)
 add('pedestre-casa-luca',line([[-142,203],[-142,213],[-90,213],[-90,165],[-35,165]]),3,true,'public')
 add('pedestre-praca-porta',line([[83,165],[83,174],[83,175]]),3,!!state.extras.praca,'club','praca')
 add('pedestre-praca-estadio',line([[83,165],[30,165],[30,115],[-4.55,115]]),3,!!state.extras.praca)
 add('pedestre-hotel-estadio',line([[-125,35],[-120,35],[-120,65],[-90,90],[-90,115],[-4.55,115]]),2.8,!!state.extras.hotel)
 add('pedestre-hotel-retorno',line([[-121,73],[-120,65],[-120,35],[-125,35]]),2.4,!!state.extras.hotel)
 add('pedestre-comercio',line([[-205,-201],[300,-201]]),4,true,'public')
 add('pedestre-agencia',line([[-25,-201],[-25,-244.3]]),3,true,'public')
 add('pedestre-shopping',line([[141,-201],[141,-212]]),3,true,'public')
 add('pedestre-comercio-metro',line([[-90,-201],[-90,-174]]),3,true,'public')
 const parkingExits=[[[162,6],[156,6]],[[224,6],[224,2],[156,2]],[[162,183],[156,183]],[[224,183],[224,190],[156,190]]]
 for(let index=0;index<4;index++)add(`pedestre-estacionamento-${index+1}`,line([...parkingExits[index],[156,100],[140,115],[30,115],[-4.55,115]]),2.4,state.parking.stage>=index+1)
 const walks=planned.filter(w=>state.valid&&w.enabled).map(({enabled,...walk})=>walk)
 return{walks,reservationPolygons:planned.map(w=>w.polygon),metadata:{version:2,source:'urban-masterplan',actorRoutesUnchanged:false,count:walks.length,walks:walks.map(w=>({...w,minHeight:.16,maxHeight:.16}))}}
}
