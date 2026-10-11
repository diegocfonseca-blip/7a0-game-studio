import {obstaculosDoEstadio,caminhoSeguro} from './presidencia-estadio-navegacao'
import type {StadiumSave} from './estadiodata'
import {estadioVisualValido} from './presidencia-estadio-validacao'
import {populacaoEstadio} from './presidencia-estadio-camadas'

/** Coordenadas da câmera aprovada, 1536 × 1024. Zoom nunca altera o mundo. */
export const MAPA_ESTADIO={width:1536,height:1024} as const
export type PontoMapa={x:number;y:number}
export type RotaMapa={id:string;points:readonly PontoMapa[];loop:boolean}
const points=(pairs:readonly (readonly [number,number])[])=>pairs.map(([x,y])=>({x,y}))
// Duas faixas distintas. Não atravessar terreno, gramado ou construções.
const road=points([[-48,284],[18,364],[37,427],[56,493],[124,586],[224,692],[352,785],[501,853],[651,876],[808,881],[1004,866],[1168,818],[1309,722],[1413,599],[1490,478],[1570,339]])
const sidewalk=points([[66,488],[141,579],[242,680],[366,765],[510,830],[657,852],[808,858],[998,840],[1150,793],[1290,702],[1391,583],[1465,472]])
const faixa=(route:readonly PontoMapa[],offset:number)=>route.map((p,i)=>{const a=route[Math.max(0,i-1)],b=route[Math.min(route.length-1,i+1)],dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy)||1;return {x:p.x-dy/length*offset,y:p.y+dx/length*offset}})
export const ROTAS_ESTADIO:Readonly<Record<string,RotaMapa>>={
 roadOut:{id:'roadOut',points:faixa(road,-6),loop:false},
 roadBack:{id:'roadBack',points:faixa(road,6).reverse(),loop:false},
 sidewalk:{id:'sidewalk',points:sidewalk,loop:false},
 entrance:{id:'entrance',points:points([[828,856],[828,813],[828,753],[828,715],[823,691],[820,665],[820,620],[820,595]]),loop:false},
 entranceBare:{id:'entranceBare',points:points([[752,856],[752,768],[752,665],[752,593]]),loop:false},
 shop:{id:'shop',points:points([[1391,583],[1359,548],[1308,501],[1283,463],[1242,451]]),loop:false},
 food:{id:'food',points:points([[1150,793],[1198,755],[1238,697],[1239,644],[1209,605],[1168,596]]),loop:false},
 beer:{id:'beer',points:points([[1242,451],[1170,469],[1139,442],[1127,391],[1130,345],[1145,322]]),loop:false},
 hotel:{id:'hotel',points:points([[242,680],[278,648],[330,615],[385,589]]),loop:false},
 station:{id:'station',points:points([[1465,472],[1465,421],[1444,356],[1385,321],[1320,320],[1233,306]]),loop:false},
 parking:{id:'parking',points:points([[951,853],[939,837],[926,791],[913,757]]),loop:false},
 construction:{id:'construction',points:points([[688,602],[723,602],[772,602],[812,602]]),loop:false},
}
export type AtorMapa={id:string;kind:'worker'|'fan'|'security'|'car';src:string;srcBack?:string;frames?:number;route:string;speed:number;phase:number;width:number;height:number;path?:RotaMapa}
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
  const walking=kind==='worker'||kind==='fan'
  actors.push({id,kind,src:'estadio-circulacao/'+src+(walking?'-walk':'')+'.webp',srcBack:walking?'estadio-circulacao/'+src+'-walk-back.webp':undefined,frames:walking?4:undefined,route,speed:speed*1.7,phase,width:kind==='car'?19:walking?11.25:6.5,height:kind==='car'?11:15})
 }
 add('traffic-cream','car','car-cream','roadOut',19,0.2)
 add('traffic-green','car','car-green','roadBack',17,0.55)
 for(let i=0;i<pop.workers;i++)add('worker-'+i,'worker','worker','construction',3.2,i*.4)
 if(pop.workers)add('work-truck','car','truck','roadOut',19,.7)
 for(let i=0;i<pop.fans;i++)add('fan-'+i,'fan','fan',i%2?(st.ext.includes('asfalto')?'entrance':'entranceBare'):'sidewalk',4,i*.13)
 if(pop.security)add('security','security','security',st.ext.includes('asfalto')?'entrance':'entranceBare',0,.8)
 const destinations=[['loja','shop'],['praca','food'],['chopp','beer'],['hotel','hotel'],['estacao','station']] as const
 for(const [key,route] of destinations)if(st.ext.includes(key))add('visitor-'+key,'fan','fan',route,3.5,.35)
 if(st.ext.includes('estac'))add('parking-car','car','car-cream','parking',7,.15)
 const obstacles=obstaculosDoEstadio(st)
 return actors.flatMap(actor=>{const route=ROTAS_ESTADIO[actor.route],safe=caminhoSeguro(route.points,obstacles,raioCorpoAtor(actor));return safe.length?[{...actor,path:{...route,points:safe}}]:[]})
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
export function quadroAtor(actor:AtorMapa,seconds:number){
 const route=actor.path??ROTAS_ESTADIO[actor.route],length=comprimentoRota(route)
 const road=actor.route==='roadOut'||actor.route==='roadBack'
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
 const p=blocked?{...end,angle:Math.atan2(end.y-route.points.at(-2)!.y,end.x-route.points.at(-2)!.x)*180/Math.PI}:posicaoNaRota(route,distance,!road)
 if(actor.kind!=='car'&&!walking&&actor.speed>0&&distance===2*length)p.angle+=180
 // Estacionamento: retorno de ré mantém a frente do veículo no mesmo sentido.
 if(actor.kind==='car'&&!road&&length&&distance%(2*length)>length)p.angle-=180
 const scale=.7+p.y/MAPA_ESTADIO.height*.3
 const back=Math.sin(p.angle*Math.PI/180)<0
 return {...p,scale,depth:Math.round(p.y*10),back,flip:back?Math.cos(p.angle*Math.PI/180)<0:Math.cos(p.angle*Math.PI/180)>0,frame:actor.frames&&walking?Math.floor(Math.max(0,seconds)*6+actor.phase*4)%actor.frames:0}
}

export type VistaMapa={zoom:number;x:number;y:number}
export function limitarVistaMapa(view:VistaMapa,width:number,height:number,maxZoom=4,world?:{width:number;height:number},minZoom=1):VistaMapa{
 const zoom=Number.isFinite(view.zoom)?Math.min(maxZoom,Math.max(minZoom,view.zoom)):1
 const boundX=Math.max(0,(world?.width??width)*zoom-width)/2,boundY=Math.max(0,(world?.height??height)*zoom-height)/2
 return {zoom,x:Number.isFinite(view.x)?Math.max(-boundX,Math.min(boundX,view.x)):0,y:Number.isFinite(view.y)?Math.max(-boundY,Math.min(boundY,view.y)):0}
}
export function aproximarMapa(view:VistaMapa,nextZoom:number,anchor:PontoMapa,width:number,height:number,maxZoom=4,world?:{width:number;height:number},minZoom=1):VistaMapa{
 const zoom=Math.min(maxZoom,Math.max(minZoom,nextZoom)),ratio=zoom/view.zoom
 return limitarVistaMapa({zoom,x:anchor.x-(anchor.x-view.x)*ratio,y:anchor.y-(anchor.y-view.y)*ratio},width,height,maxZoom,world,minZoom)
}
