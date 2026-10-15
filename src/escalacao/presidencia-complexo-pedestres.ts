import {PLANTA_COMPLEXO,caminhosTorcidaComplexo,deslocarCaminhoComplexo,mapaParaMundo,type EstadoComplexo,type PontoComplexo} from './presidencia-complexo-model'

export type PontoPasseioComplexo=PontoComplexo&{y:number}
export type LigacaoPedestreComplexo={
 id:string;points:PontoPasseioComplexo[];width:number;polygon:PontoComplexo[];floor:number
 material:'public'|'club';reason:string;joins:string[];parkingLot?:string;portalLot?:string
}
const FLOOR=.16,PARKING_FLOOR=.035
const points=(values:readonly (readonly number[])[])=>values.map(([x,z])=>({x,z,y:FLOOR}))
const nearest=(p:PontoComplexo,route:readonly PontoComplexo[])=>{
 let best={point:{...route[0]},distance:Infinity}
 for(let i=1;i<route.length;i++){
  const a=route[i-1],b=route[i],dx=b.x-a.x,dz=b.z-a.z
  const t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.z-a.z)*dz)/(dx*dx+dz*dz||1)))
  const point={x:a.x+dx*t,z:a.z+dz*t},distance=Math.hypot(p.x-point.x,p.z-point.z)
  if(distance<best.distance)best={point,distance}
 }
 return best.point
}
// These are the same pavement centre lines drawn by street() in the district.
// Unlike the pedestrian ribbon, street() uses the averaged adjacent direction.
const pavement=(route:readonly PontoComplexo[],offset:number)=>route.map((p,i)=>{
 const a=route[Math.max(0,i-1)],b=route[Math.min(route.length-1,i+1)],length=Math.hypot(b.x-a.x,b.z-a.z)||1
 return{x:p.x-(b.z-a.z)/length*offset,z:p.z+(b.x-a.x)/length*offset}
})
const eastStreet=[[1640,331],[1521,451],[1475,592],[1410,720]].map(([x,y])=>mapaParaMundo({x,y}))
const westStreet=[[-65,269],[150,119],[295,48],[354,-65]].map(([x,y])=>mapaParaMundo({x,y}))
const stationRoute=PLANTA_COMPLEXO.routes.station.points
const eastArrival=[-6.9,6.9].map(offset=>nearest(stationRoute[0],pavement(eastStreet,offset)))
 .sort((a,b)=>Math.hypot(a.x-stationRoute[0].x,a.z-stationRoute[0].z)-Math.hypot(b.x-stationRoute[0].x,b.z-stationRoute[0].z))[0]
const northWestArrival=nearest({x:-227.139389426,z:-174.648192879},pavement(westStreet,6.9))

/** Additional physical connections only. Existing clocks, actor routes,
 * purchases and the southeast parking itinerary remain untouched. A renderer
 * must interpolate points[].y and must not add end caps: the northwest entry
 * runs beside real parking bays. Future footprints are reserved at every stage. */
export function plantaPedestreComplexo(state:EstadoComplexo){
 const planned:(LigacaoPedestreComplexo&{enabled:boolean})[]=[]
 const add=(id:string,path:readonly PontoPasseioComplexo[],width:number,enabled:boolean,material:LigacaoPedestreComplexo['material'],reason:string,joins:string[],parkingLot?:string)=>{
  const copy=path.map(p=>({...p})),polygon=[...deslocarCaminhoComplexo(copy,width/2),...deslocarCaminhoComplexo(copy,-width/2).reverse()]
  planned.push({id,points:copy,width,polygon,floor:FLOOR,material,reason,joins,...(parkingLot?{parkingLot}:{}),enabled})
 }
 const parkingPath=(values:readonly (readonly number[])[])=>points(values).map((p,i)=>i===0?{...p,y:PARKING_FLOOR}:p)
 const shop=PLANTA_COMPLEXO.routes.shop.points[0],away=caminhosTorcidaComplexo(state).away
 add('pedestre-loja-portao',[{...shop,y:FLOOR},{...nearest(shop,away),y:FLOOR}],2.6,!!state.extras.loja,'club','fecha o intervalo entre a loja e o acesso de visitantes',['shop','acesso-torcida-away'])
 add('pedestre-estacao-bairro',[{...stationRoute[0],y:FLOOR},{...eastArrival,y:FLOOR}],2.4,!!state.extras.estacao,'club','liga o acesso da estação à calçada pública leste',['station','via-leste-passeio'])
 const stationEnd=stationRoute.at(-1)!
 add('pedestre-estacao-metro',[{...stationEnd,y:FLOOR},{x:158,z:stationEnd.z,y:FLOOR}],2.4,!!state.extras.estacao,'club','fecha a costura com o passeio das passarelas',['station','metro-passeio-estadio'])
 const food=PLANTA_COMPLEXO.routes.food.points.at(-1)!,foodLot=PLANTA_COMPLEXO.lots.praca.footprint
 const foodDoor=nearest(food,[...foodLot,foodLot[0]]),foodDistance=Math.hypot(foodDoor.x-food.x,foodDoor.z-food.z)
 const foodInside={x:foodDoor.x+(foodDoor.x-food.x)/foodDistance*.9,z:foodDoor.z+(foodDoor.z-food.z)/foodDistance*.9,y:FLOOR}
 add('pedestre-praca-porta',[{...food,y:FLOOR},{...foodDoor,y:FLOOR},foodInside],2.6,!!state.extras.praca,'club','leva o acesso da praça até o vão físico aberto na fachada',['food','praca-porta'])
 planned.at(-1)!.portalLot='praca'
 add('pedestre-praca-estadio',[
  {...PLANTA_COMPLEXO.routes.food.points[0],y:FLOOR},...points([[84,129],[65.911,131.856],[46,131],[26,124]]),
  {...PLANTA_COMPLEXO.gates.home.approach,y:FLOOR},
 ],2.4,!!state.extras.praca,'club','liga a praça ao portão mesmo antes de comprar estacionamento ou asfalto',['food','acesso-torcida-home'])
 add('pedestre-segunda-parada',points([[-70.5,126.5],[-63,124],[-46,124],[-28,124]]),2.4,true,'public','liga a segunda parada ao passeio do terminal sem depender do hotel',['onibus-segunda-parada','terminal-onibus-passeio'])
 // The hotel tower and its reception are larger than the legacy navigation
 // footprint. Approach around their northern faces, from the paved return's
 // sidewalk (radius 6.25 m), rather than cutting through the actual building.
 add('pedestre-hotel-retorno',[
  ...points([[-116.015028385,59.085908353],[-100,72],[-95,72],[-86,75],[-81,82],[-82,90]]),
  {...PLANTA_COMPLEXO.doors.hotel.approach,y:FLOOR},
 ],2,!!state.extras.hotel&&!!state.extras.asfalto,'club','liga o retorno de veículos à recepção contornando o prédio e o anexo reais',['retorno-hotel-passeio','hotel-porta'])
 add('pedestre-estacionamento-sudoeste',[
  {x:-100,z:149,y:PARKING_FLOOR},{...nearest({x:-104.587511758,z:153.803693118},PLANTA_COMPLEXO.routes.sidewalk.points),y:FLOOR},
 ],2.4,state.parking.stage>=2,'club','saída do lote para a calçada registrada',['estacionamento-sudoeste','sidewalk'],'sudoeste')
 add('pedestre-estacionamento-leste',parkingPath([[113,134],[105,128],[89.908338722,124.978037244],[84,129],[65.911,131.856],[46,131],[26,124]]),2,state.parking.stage>=3,'club','contorna a praça e alcança o passeio do primeiro lote comprado',['estacionamento-leste','estacionamento-passeio-estadio'],'leste')
 const northwest=parkingPath([[-149.5,-126],[-160,-137],[-185,-151],[-210,-163]])
 northwest.push({...northWestArrival,y:FLOOR})
 add('pedestre-estacionamento-noroeste',northwest,1.6,state.parking.stage>=4,'club','saída para a calçada pública oeste, presente mesmo sem asfalto do clube',['estacionamento-noroeste','via-oeste-passeio'],'noroeste')
 const walks=planned.filter(walk=>state.valid&&walk.enabled).map(({enabled,...walk})=>walk)
 const metadata={version:1,source:'physical-connections',actorRoutesUnchanged:true,count:walks.length,walks:walks.map(walk=>({
  id:walk.id,width:walk.width,joins:[...walk.joins],material:walk.material,parkingLot:walk.parkingLot??null,portalLot:walk.portalLot??null,
  points:walk.points.map(p=>({...p})),minHeight:Math.min(...walk.points.map(p=>p.y)),maxHeight:Math.max(...walk.points.map(p=>p.y)),
 }))}
 return{walks,reservationPolygons:planned.map(walk=>walk.polygon.map(p=>({...p}))),metadata}
}
