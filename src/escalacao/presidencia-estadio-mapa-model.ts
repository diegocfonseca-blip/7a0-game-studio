import {obstaculosDoEstadio,caminhoSeguro} from './presidencia-estadio-navegacao'
import type {StadiumSave} from './estadiodata'
import {estadioVisualValido} from './presidencia-estadio-validacao'
import {populacaoEstadio} from './presidencia-estadio-camadas'
import {CAMPO_MAPA,escalaNoGramado} from './presidencia-partida-geometria'

/** Coordenadas da câmera aprovada, 1536 × 1024. Zoom nunca altera o mundo. */
export const MAPA_ESTADIO={width:1536,height:1024} as const
const escalaAmbiente=(y:number)=>.7+y/MAPA_ESTADIO.height*.3
// Mesma referência de 1,80 m do campo; atlas de caminhada tem 4 px vazios no topo.
const alturaPessoa=escalaNoGramado(CAMPO_MAPA,.5).athleteHeight/escalaAmbiente((CAMPO_MAPA[0][1]+CAMPO_MAPA[2][1])/2)
export type PontoMapa={x:number;y:number}
export type RotaMapa={id:string;points:readonly PontoMapa[];loop:boolean}
const points=(pairs:readonly (readonly [number,number])[])=>pairs.map(([x,y])=>({x,y}))
// Duas faixas distintas. Não atravessar terreno, gramado ou construções.
const faixa=(route:readonly PontoMapa[],offset:number|((p:PontoMapa)=>number))=>route.map((p,i)=>{const a=route[Math.max(0,i-1)],b=route[Math.min(route.length-1,i+1)],dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy)||1,distance=typeof offset==='number'?offset:offset(p);return {x:p.x-dy/length*distance,y:p.y+dx/length*distance}})
// Traçado da via pública conferido na imagem completa. O fluxo sai pela
// rua lateral do cruzamento: não corta o estacionamento para sumir no mapa.
const road=points([[-48,284],[32,364],[60,427],[85,493],[160,586],[265,692],[388,785],[520,850],[651,880],[808,888],[1004,874],[1104,856],[1168,840],[1236,810],[1309,776],[1376,740],[1410,720],[1452,730],[1570,778]])
// A calçada termina antes do cruzamento. Os destinos usam acessos próprios.
// Keep both pedestrian lanes on the paving, outside the east flower border.
const sidewalk=faixa(road.slice(3,-3),p=>-25-3*Math.max(0,Math.min(1,(p.x-1004)/305)))
export const ROTAS_ESTADIO:Readonly<Record<string,RotaMapa>>={
 roadOut:{id:'roadOut',points:faixa(road,-7.5),loop:false},
 roadBack:{id:'roadBack',points:faixa(road,7.5).reverse(),loop:false},
 sidewalk:{id:'sidewalk',points:sidewalk,loop:false},
 // Área de retorno antes da calçada: a curva não invade o fluxo transversal.
 entrance:{id:'entrance',points:points([[828,850],[828,813],[828,753],[828,715],[823,691],[822,665],[822,620],[822,595]]),loop:false},
 entranceBare:{id:'entranceBare',points:points([[752,850],[752,768],[752,665],[752,612]]),loop:false},
 // Visitantes circulam nos passeios dos estabelecimentos. Não usar vagas,
 // canteiros ou telhados como atalho para ligar duas entradas distantes.
 shop:{id:'shop',points:points([[1178,443],[1192,448],[1203,455],[1222,448]]),loop:false},
 food:{id:'food',points:points([[1118,620],[1133,610],[1155,604],[1168,596]]),loop:false},
 beer:{id:'beer',points:points([[1242,451],[1170,469],[1139,442],[1127,391],[1130,345],[1145,330]]),loop:false},
 hotel:{id:'hotel',points:points([[306,638],[337,644],[395,629],[444,614],[478,587],[479,573],[466,558],[455,541]]),loop:false},
 station:{id:'station',points:points([[1485,345],[1440,334],[1384,313],[1327,297],[1275,286],[1235,280],[1227,275]]),loop:false},
 parking:{id:'parking',points:points([[951,853],[939,837],[926,791],[913,757]]),loop:false},
 construction:{id:'construction',points:points([[688,602],[723,602],[772,602],[812,602]]),loop:false},
 securityPost:{id:'securityPost',points:points([[849,600],[851,600]]),loop:false},
}
export type AtorMapa={id:string;kind:'worker'|'fan'|'security'|'car';src:string;srcBack?:string;frames?:number;route:string;speed:number;phase:number;width:number;height:number;lane?:number;path?:RotaMapa}
/** Carro gira pelo centro: o círculo contém toda a carroceria, inclusive nas
 * curvas. Pedestre colide pelos pés, não pelo retângulo vertical do sprite. */
export function raioCorpoAtor(actor:Pick<AtorMapa,'kind'|'width'|'height'>):number{
 return actor.kind==='car'?Math.hypot(actor.width,actor.height)/2:Math.max(2,actor.width/4)
}
/** Tráfego é ambiente da rua pública; estacionamento comprado recebe desvios.
 * Não representa veículos adquiridos pela conta nem simula renda/lotação. */
export function atoresDoMapa(st?:StadiumSave):AtorMapa[]{
 if(!estadioVisualValido(st))return []
 const pop=populacaoEstadio(st),actors:AtorMapa[]=[]
 const add=(id:string,kind:AtorMapa['kind'],src:string,route:string,speed:number,phase:number)=>{
  const walking=kind==='worker'||kind==='fan',personHeight=alturaPessoa*(walking?96/92:1)
  actors.push({id,kind,src:'estadio-circulacao/'+src+(walking?'-walk':'')+'.webp',srcBack:walking?'estadio-circulacao/'+src+'-walk-back.webp':undefined,frames:walking?4:undefined,lane:walking&&['sidewalk','entrance','entranceBare','construction'].includes(route)?(route==='sidewalk'?2.75:2.5):0,route,speed:speed*(kind==='car'?1.7:1.3),phase,width:kind==='car'?19:personHeight*(walking?.75:.5),height:kind==='car'?11:personHeight})
 }
 add('traffic-cream','car','car-cream','roadOut',19,0.2)
 add('traffic-green','car','car-green','roadBack',17,0.55)
 for(let i=0;i<pop.workers;i++)add('worker-'+i,'worker','worker','construction',3.2,i*.4)
 if(pop.workers)add('work-truck','car','truck','roadOut',19,.7)
 for(let i=0;i<pop.fans;i++)add('fan-'+i,'fan','fan',i%2?(st.ext.includes('asfalto')?'entrance':'entranceBare'):'sidewalk',4,i*.13)
 // Posto lateral: o segurança não ocupa a linha percorrida pelos visitantes.
 if(pop.security)add('security','security','security','securityPost',0,.8)
 const destinations=[['loja','shop'],['praca','food'],['chopp','beer'],['hotel','hotel'],['estacao','station']] as const
 for(const [key,route] of destinations)if(st.ext.includes(key))add('visitor-'+key,'fan','fan',route,3.5,.35)
 if(st.ext.includes('estac'))add('parking-car','car','car-cream','parking',7,.15)
 const obstacles=obstaculosDoEstadio(st)
 return actors.flatMap(actor=>{const route=ROTAS_ESTADIO[actor.route],safe=caminhoSeguro(route.points,obstacles,raioCorpoAtor(actor)+(actor.lane??0));return safe.length?[{...actor,path:{...route,points:safe}}]:[]})
}
export function comprimentoRota(route:RotaMapa):number{
 return route.points.slice(1).reduce((sum,p,i)=>sum+Math.hypot(p.x-route.points[i].x,p.y-route.points[i].y),0)
}
/** Distância percorrida, não interpolação que corta curvas. Retorno pedestre
 * percorre o mesmo caminho; carros da rodovia reaparecem fora da moldura. */
export function posicaoNaRota(route:RotaMapa,distance:number,bounce=false){
 const length=comprimentoRota(route)
 if(!Number.isFinite(distance)||length===0)return {...route.points[0],angle:0}
 const cycle=bounce?2*length:length
 const travelled=((distance%cycle)+cycle)%cycle
 const reverse=bounce&&travelled>length
 let remaining=reverse?2*length-travelled:travelled
 for(let i=1;i<route.points.length;i++){
  const a=route.points[i-1],b=route.points[i],segment=Math.hypot(b.x-a.x,b.y-a.y)
  if(remaining<=segment||i===route.points.length-1){
   const fraction=segment?Math.min(1,remaining/segment):0
   return {x:a.x+(b.x-a.x)*fraction,y:a.y+(b.y-a.y)*fraction,angle:Math.atan2(b.y-a.y,b.x-a.x)*180/Math.PI+(reverse?180:0)}
  }
  remaining-=segment
 }
 return {...route.points[0],angle:0}
}
/** Retorno em arco dentro da margem já validada. Cada sentido usa seu lado;
 * o NPC aguarda no destino e faz a curva, sem trocar de faixa instantaneamente. */
function passeioEmFaixas(actor:AtorMapa,route:RotaMapa,seconds:number){
 const radius=actor.lane??0,length=comprimentoRota(route),trip=length/actor.speed,turn=Math.PI*radius/actor.speed,wait=2,stop=wait+turn,cycle=2*(trip+stop)
 const time=((Math.max(0,seconds)+actor.phase*trip)%cycle+cycle)%cycle
 const outward=time<trip,returning=time>=trip+stop&&time<2*trip+stop
 if(outward||returning){
  const lanePoints=faixa(route.points,outward?radius:-radius)
  const laneRoute={...route,points:outward?lanePoints:lanePoints.reverse()}
  const fraction=(outward?time:time-trip-stop)/trip
  const p=posicaoNaRota(laneRoute,fraction*comprimentoRota(laneRoute))
  return {...p,walking:true}
 }
 const far=time<trip+stop,local=far?time-trip:time-2*trip-stop
 const theta=Math.max(0,Math.min(1,(local-wait)/turn))*Math.PI
 const endpoint=far?route.points.at(-1)!:route.points[0],neighbor=far?route.points.at(-2)!:route.points[1]
 const dx=endpoint.x-neighbor.x,dy=endpoint.y-neighbor.y,len=Math.hypot(dx,dy)||1,ux=dx/len,uy=dy/len
 return {x:endpoint.x+radius*(-uy*Math.cos(theta)+ux*Math.sin(theta)),y:endpoint.y+radius*(ux*Math.cos(theta)+uy*Math.sin(theta)),angle:Math.atan2(uy*Math.cos(theta)-ux*Math.sin(theta),ux*Math.cos(theta)+uy*Math.sin(theta))*180/Math.PI,walking:local>wait}
}
export function quadroAtor(actor:AtorMapa,seconds:number){
 const route=actor.path??ROTAS_ESTADIO[actor.route],length=comprimentoRota(route)
 const road=actor.route==='roadOut'||actor.route==='roadBack'
 const lane=actor.lane&&actor.speed>0&&length>0?passeioEmFaixas(actor,route,seconds):undefined
 let distance=actor.phase*length+Math.max(0,seconds)*actor.speed
 let walking=actor.speed>0
 // Pedestres aguardam nas entradas e destinos antes de voltar. O relógio
 // compartilhado da circulação também congela essa espera durante a pausa.
 if(actor.kind!=='car'&&actor.speed>0&&length>0){
  const trip=length/actor.speed,wait=2,cycle=2*(trip+wait)
  const time=((Math.max(0,seconds)+actor.phase*trip)%cycle+cycle)%cycle
  if(time<trip)distance=time*actor.speed
  else if(time<trip+wait){distance=length;walking=false}
  else if(time<2*trip+wait)distance=length+(time-trip-wait)*actor.speed
  else {distance=2*length;walking=false}
 }
 const end=route.points.at(-1)!,outside=(p:PontoMapa)=>p.x< -actor.width||p.x>MAPA_ESTADIO.width+actor.width||p.y< -actor.height||p.y>MAPA_ESTADIO.height+actor.height
 // Só reaparece do outro lado quando a carroceria já saiu inteira da imagem.
 const canWrap=road&&outside(route.points[0])&&outside(end)
 const blocked=road&&!canWrap&&distance>=length
 const p=lane??(blocked?{...end,angle:Math.atan2(end.y-route.points.at(-2)!.y,end.x-route.points.at(-2)!.x)*180/Math.PI}:posicaoNaRota(route,distance,!road))
 if(lane)walking=lane.walking
 if(!lane&&actor.kind!=='car'&&!walking&&actor.speed>0&&distance===2*length)p.angle+=180
 // Estacionamento: retorno de ré mantém a frente do veículo no mesmo sentido.
 if(actor.kind==='car'&&!road&&length&&distance%(2*length)>length)p.angle-=180
 const scale=escalaAmbiente(p.y)
 const back=Math.sin(p.angle*Math.PI/180)<0
 return {...p,scale,depth:Math.round(p.y*10),back,flip:back?Math.cos(p.angle*Math.PI/180)<0:Math.cos(p.angle*Math.PI/180)>0,frame:actor.frames&&walking?Math.floor(Math.max(0,seconds)*6+actor.phase*4)%actor.frames:0}
}

export type VistaMapa={zoom:number;x:number;y:number}
export type DimensoesVista={width:number;height:number;world:{width:number;height:number};minZoom:number}
/** Preserve the normalized world point at the viewport center on rotation/resize. */
export function redimensionarVistaMapa(view:VistaMapa,before:DimensoesVista|undefined,after:DimensoesVista,maxZoom:number):VistaMapa{
 if(!before?.world.width||!before.world.height)return limitarVistaMapa(view,after.width,after.height,maxZoom,after.world,after.minZoom)
 const overview=Math.abs(view.zoom-before.minZoom)<1e-6&&Math.abs(view.x)<1e-6&&Math.abs(view.y)<1e-6
 const zoom=overview?after.minZoom:Math.max(after.minZoom,Math.min(maxZoom,view.zoom))
 const ratio=zoom/view.zoom
 return limitarVistaMapa({zoom,x:view.x*after.world.width/before.world.width*ratio,y:view.y*after.world.height/before.world.height*ratio},after.width,after.height,maxZoom,after.world,after.minZoom)
}
export function limitarVistaMapa(view:VistaMapa,width:number,height:number,maxZoom=4,world?:{width:number;height:number},minZoom=1):VistaMapa{
 const zoom=Number.isFinite(view.zoom)?Math.min(maxZoom,Math.max(minZoom,view.zoom)):1
 const boundX=Math.max(0,(world?.width??width)*zoom-width)/2,boundY=Math.max(0,(world?.height??height)*zoom-height)/2
 return {zoom,x:Number.isFinite(view.x)?Math.max(-boundX,Math.min(boundX,view.x)):0,y:Number.isFinite(view.y)?Math.max(-boundY,Math.min(boundY,view.y)):0}
}
export function aproximarMapa(view:VistaMapa,nextZoom:number,anchor:PontoMapa,width:number,height:number,maxZoom=4,world?:{width:number;height:number},minZoom=1):VistaMapa{
 const zoom=Math.min(maxZoom,Math.max(minZoom,nextZoom)),ratio=zoom/view.zoom
 return limitarVistaMapa({zoom,x:anchor.x-(anchor.x-view.x)*ratio,y:anchor.y-(anchor.y-view.y)*ratio},width,height,maxZoom,world,minZoom)
}
