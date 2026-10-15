import {PLANTA_COMPLEXO, caminhosTorcidaComplexo, deslocarCaminhoComplexo, mapaParaMundo, type EstadoComplexo, type PontoComplexo} from './presidencia-complexo-model'

export type PontoTransporteComplexo = PontoComplexo & {y:number}
export type SuperficieTransporteComplexo = {id:string;polygon:PontoComplexo[];y:number;kind:'pavement'|'road'|'platform'|'stair';base?:number}
export type ServicoTransporteComplexo = {
  id:string;kind:'metro'|'bus'|'car';side:'home'|'away';width:number;length:number;wheelRadius:number;floorHeight:number
  stop:{position:PontoTransporteComplexo;heading:number}
  inbound:PontoTransporteComplexo[];outbound:PontoTransporteComplexo[];passengerRoute:PontoTransporteComplexo[];passengerReturnRoute?:PontoTransporteComplexo[]
  door:{side:-1|1;longitudinal:number;width:number}
}
export type EscadaEstacaoComplexo={count:number;rise:number;tread:number;width:number;landing:number;points:PontoTransporteComplexo[];surfaces:SuperficieTransporteComplexo[]}
export type AcessoEstacaoComplexo={id:'oeste'|'leste';points:PontoTransporteComplexo[];surfaces:SuperficieTransporteComplexo[];bridge:{points:PontoTransporteComplexo[];width:number;floor:number};stair:EscadaEstacaoComplexo;walk:PontoTransporteComplexo[];platformX:number}
const GROUND=.16
const point=(p:PontoComplexo,y=GROUND):PontoTransporteComplexo=>({...p,y})
const mapped=(points:number[][])=>points.map(([x,y])=>mapaParaMundo({x,y}))
export const LOTES_ESTACIONAMENTO_COMPLEXO=[
  mapped([[331,683],[491,721],[564,826],[446,780]]),mapped([[930,695],[1088,667],[1156,779],[956,837]]),
  mapped([[1253,494],[1394,524],[1350,660],[1212,652]]),mapped([[312,189],[438,170],[412,282],[205,344]]),
]
export type VagaEstacionamentoComplexo={id:string;center:PontoComplexo;heading:number;width:number;length:number;polygon:PontoComplexo[]}
const insideParking=(p:PontoComplexo,polygon:readonly PontoComplexo[])=>{let result=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){const a=polygon[i],b=polygon[j];if((a.z>p.z)!==(b.z>p.z)&&p.x<(b.x-a.x)*(p.z-a.z)/(b.z-a.z)+a.x)result=!result}return result}
const segmentDistance=(p:PontoComplexo,a:PontoComplexo,b:PontoComplexo)=>{const dx=b.x-a.x,dz=b.z-a.z,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.z-a.z)*dz)/(dx*dx+dz*dz||1)));return Math.hypot(p.x-a.x-dx*t,p.z-a.z-dz*t)}
const parkingAccesses=[
  [{x:38.39,z:208.46057},{x:38.38621511294916,z:203.56924931856256},{x:36.3,z:198.86},{x:34.91,z:184.85},{x:39,z:177},{x:48,z:177}],
  [{x:-84.17232591935513,z:179.3188600497851},{x:-78,z:173},{x:-72,z:165}],
  [{x:153.11222213030794,z:160.31492395331176},{x:149,z:150},{x:143,z:131}],
  [{x:-240.84,z:-153.15},{x:-202,z:-146},{x:-182,z:-134},{x:-151,z:-111}],
]
/** Purchase order and parking bays are stable across all visual stages. */
export const PLANTAS_ESTACIONAMENTO_COMPLEXO=([1,0,2,3] as const).map((originalIndex,index)=>{
  const polygon=LOTES_ESTACIONAMENTO_COMPLEXO[originalIndex],a=polygon[0],b=polygon[1]
  const yaw=-Math.atan2(b.z-a.z,b.x-a.x),cos=Math.cos(yaw),sin=Math.sin(yaw)
  const local=polygon.map(p=>({x:(p.x-a.x)*cos-(p.z-a.z)*sin,z:(p.x-a.x)*sin+(p.z-a.z)*cos}))
  const world=(x:number,z:number)=>({x:a.x+x*cos+z*sin,z:a.z-x*sin+z*cos})
  const maxX=Math.max(...local.map(p=>p.x)),maxZ=Math.max(...local.map(p=>p.z)),slots:VagaEstacionamentoComplexo[]=[]
  const reserve=[parkingAccesses[index],...(index===0?[[{x:54,z:154},{x:67,z:151},{x:74,z:161},{x:77,z:176},{x:61,z:184},{x:42,z:191},{x:38.39,z:203.57}],[{x:48,z:177},{x:54,z:171},{x:54,z:163}],[{x:53.05,z:163},{x:49,z:162},{x:35,z:163}]]:[])]
  const bay=(center:PontoComplexo,heading:number):VagaEstacionamentoComplexo=>({id:`vaga-${index}-${slots.length}`,center,heading,width:2.9,length:5.9,polygon:[[-1.45,-2.95],[1.45,-2.95],[1.45,2.95],[-1.45,2.95]].map(([x,z])=>({x:center.x+x*Math.cos(heading)+z*Math.sin(heading),z:center.z-x*Math.sin(heading)+z*Math.cos(heading)}))})
  if(index===0)slots.push(bay({x:54,z:163},Math.PI))
  for(let z=5;z<maxZ-3;z+=12)for(let x=2;x<maxX-1.5;x+=3.1){
    const center=world(x,z),candidate=bay(center,yaw)
    if(!candidate.polygon.every(p=>insideParking(p,polygon)))continue
    if(reserve.some(route=>route.some((b,i)=>i>0&&candidate.polygon.some(p=>segmentDistance(p,route[i-1],b)<2.8))))continue
    if(slots.some(slot=>Math.hypot(slot.center.x-center.x,slot.center.z-center.z)<4))continue
    slots.push(candidate)
  }
  return{id:(['sudeste','sudoeste','leste','noroeste'] as const)[index],stage:index+1,originalIndex,polygon,access:parkingAccesses[index],slots}
})
export const faixaTransporteComplexo=(points:readonly PontoComplexo[],width:number)=>[
  ...deslocarCaminhoComplexo(points,width/2),...deslocarCaminhoComplexo(points,-width/2).reverse(),
]
/** Circular fillets preserve the declared vehicle turning radius. A quadratic
 * corner cut does not: its curvature can tighten to half the nominal cut. */
const circularLoop=(vertices:PontoTransporteComplexo[],radius:number)=>{
  const corners=vertices.map((p,i)=>{
    const a=vertices[(i+vertices.length-1)%vertices.length],b=vertices[(i+1)%vertices.length]
    const inLength=Math.hypot(p.x-a.x,p.z-a.z),outLength=Math.hypot(b.x-p.x,b.z-p.z)
    const u={x:(p.x-a.x)/inLength,z:(p.z-a.z)/inLength},v={x:(b.x-p.x)/outLength,z:(b.z-p.z)/outLength}
    const cross=u.x*v.z-u.z*v.x,dot=Math.max(-1,Math.min(1,u.x*v.x+u.z*v.z)),turn=Math.atan2(cross,dot)
    return{p,u,turn,cut:radius*Math.tan(Math.abs(turn)/2),outLength}
  })
  for(let i=0;i<corners.length;i++)if(corners[i].cut+corners[(i+1)%corners.length].cut>corners[i].outLength+.000001)throw new RangeError('Curva do veículo não comporta o raio físico')
  const path=corners.flatMap(({p,u,turn,cut})=>{
    if(Math.abs(turn)<.00001)return[p]
    const direction=Math.sign(turn),from={x:p.x-u.x*cut,z:p.z-u.z*cut}
    const center={x:from.x-u.z*radius*direction,z:from.z+u.x*radius*direction},start=Math.atan2(from.z-center.z,from.x-center.x)
    const steps=Math.max(2,Math.ceil(Math.abs(turn)*radius/.45))
    return Array.from({length:steps+1},(_,index)=>{const angle=start+turn*index/steps;return{x:center.x+Math.cos(angle)*radius,y:p.y,z:center.z+Math.sin(angle)*radius}})
  })
  const unique=path.filter((p,i)=>!i||Math.hypot(p.x-path[i-1].x,p.z-path[i-1].z)>1e-7)
  if(unique.length>1&&Math.hypot(unique[0].x-unique.at(-1)!.x,unique[0].z-unique.at(-1)!.z)<1e-7)unique.pop()
  return unique
}
/** Metric plan consumed by the real meshes, actor clock and collision tests.
 * No new purchase or public population is inferred here. */
export function gerarPlantaTransporte(state:EstadoComplexo,options:{metroSide?:'home'|'away'}={}){
  const services:ServicoTransporteComplexo[]=[],surfaces:SuperficieTransporteComplexo[]=[]
  const pedestrianSurfaces:SuperficieTransporteComplexo[]=[],vehicleSurfaces:SuperficieTransporteComplexo[]=[]
  const addSurface=(s:SuperficieTransporteComplexo)=>{surfaces.push(s);(s.kind==='road'?vehicleSurfaces:pedestrianSurfaces).push(s);return s}
  const ribbon=(id:string,points:readonly PontoComplexo[],width:number,y:number,kind:SuperficieTransporteComplexo['kind'])=>addSurface({id,polygon:faixaTransporteComplexo(points,width),y,kind})
  const fanPaths=caminhosTorcidaComplexo(state)
  const homeLane=deslocarCaminhoComplexo(fanPaths.home,3.6)
  const f=PLANTA_COMPLEXO.lots.estacao.footprint
  const a={x:(f[0].x+f[3].x)/2,z:(f[0].z+f[3].z)/2},b={x:(f[1].x+f[2].x)/2,z:(f[1].z+f[2].z)/2}
  const dx=b.x-a.x,dz=b.z-a.z,length=Math.hypot(dx,dz),yaw=-Math.atan2(dz,dx)
  const center={x:(a.x+b.x)/2,z:(a.z+b.z)/2}
  const stationPoint=(x:number,z:number,y=8.38):PontoTransporteComplexo=>({x:center.x+x*Math.cos(yaw)+z*Math.sin(yaw),z:center.z-x*Math.sin(yaw)+z*Math.cos(yaw),y})
  const rectangle=(id:string,x0:number,x1:number,z0:number,z1:number,y:number,kind:SuperficieTransporteComplexo['kind'],base?:number)=>addSurface({id,polygon:[[x0,z0],[x1,z0],[x1,z1],[x0,z1]].map(([x,z])=>stationPoint(x,z)),y,kind,...(base===undefined?{}:{base})})
  const firstStair:EscadaEstacaoComplexo={count:36,rise:(8.38-GROUND)/36,tread:.5,width:3.6,landing:1.8,points:[],surfaces:[]}
  const station={enabled:!!state.extras.estacao,center,length,yaw,heading:Math.atan2(dx,dz),floor:8.38,railY:7.9,railExtent:1600,railWidth:7.6,avenueWidth:18,avenue:[...mapped([[-120,72],[420,78],[815,103]]),stationPoint(-95,40,0),stationPoint(100,40,0),...mapped([[1640,331]])],point:stationPoint,stair:firstStair,accesses:[] as AcessoEstacaoComplexo[],homeWalk:[] as PontoTransporteComplexo[]}
  if(station.enabled){
    for(const side of [-1,1])rectangle(`estacao-plataforma-${side}`,-length/2,length/2,side<0?-9.65:3.10,side<0?-3.10:9.65,station.floor,'platform',7.72)
    const deck=(id:string,a:PontoTransporteComplexo,b:PontoTransporteComplexo,width:number,y:number,kind:SuperficieTransporteComplexo['kind']='platform',base=y-.35)=>{
      const length=Math.hypot(b.x-a.x,b.z-a.z),nx=-(b.z-a.z)/length,nz=(b.x-a.x)/length
      return addSurface({id,polygon:[{x:a.x+nx*width/2,z:a.z+nz*width/2},{x:b.x+nx*width/2,z:b.z+nz*width/2},{x:b.x-nx*width/2,z:b.z-nz*width/2},{x:a.x-nx*width/2,z:a.z-nz*width/2}],y,kind,base})
    }
    // Duas pontes da plataforma para dentro da área pedonal. A leste cruza
    // a avenida; a oeste vence a faixa externa antes da praça junto à arena.
    // Nenhuma escada desemboca na pista nem obriga o passageiro a atravessá-la.
    for(const spec of [
      {id:'oeste' as const,x:-60,top:{x:62,z:-105},direction:{x:0,z:1}},
      {id:'leste' as const,x:50,top:{x:142,z:-82},direction:{x:-16/Math.hypot(16,19),z:19/Math.hypot(16,19)}},
    ]){
      const stair:EscadaEstacaoComplexo=spec.id==='oeste'?firstStair:{...firstStair,points:[],surfaces:[]}
      const bridgePoints=[stationPoint(spec.x,8.6),point(spec.top,station.floor)]
      const bridgeLength=Math.hypot(bridgePoints[1].x-bridgePoints[0].x,bridgePoints[1].z-bridgePoints[0].z)
      const bx=(bridgePoints[1].x-bridgePoints[0].x)/bridgeLength,bz=(bridgePoints[1].z-bridgePoints[0].z)/bridgeLength
      // As cabeceiras avançam meio metro sobre os patamares: uma sola
      // inteira fica apoiada no giro, inclusive nos cantos da ligação oblíqua.
      const deckStart={x:bridgePoints[0].x-bx*.5,z:bridgePoints[0].z-bz*.5,y:station.floor}
      const deckEnd={x:bridgePoints[1].x+bx*.5,z:bridgePoints[1].z+bz*.5,y:station.floor}
      const accessSurfaces:SuperficieTransporteComplexo[]=[deck(`estacao-passarela-${spec.id}`,deckStart,deckEnd,4.2,station.floor)]
      const axis=(distance:number,y:number)=>({x:spec.top.x+spec.direction.x*distance,z:spec.top.z+spec.direction.z*distance,y})
      // O patamar superior dá espaço ao giro antes de iniciar os degraus.
      accessSurfaces.push(deck(`estacao-passarela-patamar-${spec.id}`,axis(-2.1,station.floor),axis(1.5,station.floor),4.2,station.floor))
      let longitudinal=1.5,height=station.floor
      stair.points=[axis(0,height),axis(longitudinal,height)]
      for(let i=0;i<stair.count;i++){
        height=station.floor-(i+1)*stair.rise
        stair.points.push(axis(longitudinal,height))
        const surface=deck(`estacao-escada-${spec.id}-${i}`,axis(longitudinal,height),axis(longitudinal+stair.tread,height),stair.width,height,'stair',GROUND-.18)
        stair.surfaces.push(surface);accessSurfaces.push(surface);longitudinal+=stair.tread
        stair.points.push(axis(longitudinal,height))
        if(i===17){
          const landing=deck(`estacao-escada-patamar-${spec.id}`,axis(longitudinal,height),axis(longitudinal+stair.landing,height),stair.width,height,'stair',GROUND-.18)
          stair.surfaces.push(landing);accessSurfaces.push(landing);longitudinal+=stair.landing;stair.points.push(axis(longitudinal,height))
        }
      }
      const foot=stair.points.at(-1)!,exit=axis(longitudinal+2,GROUND)
      const walk=[foot,exit,...(spec.id==='oeste'?[{x:83,z:-78},{x:102,z:-68},{x:121,z:-63},{x:151,z:-61}]:[{x:151,z:-61}]).map(p=>point(p)),
        ...[{x:158,z:-61},{x:158,z:-13},{x:123.5,z:-9},{x:123.5,z:3.5},{x:105,z:3.5},{x:98,z:3.5}].map(p=>point(p))]
      accessSurfaces.push(ribbon(`metro-passeio-estadio-${spec.id}`,walk,3.6,GROUND,'pavement'))
      station.accesses.push({id:spec.id,platformX:spec.x,points:[...bridgePoints,...stair.points.slice(1)],surfaces:accessSurfaces,bridge:{points:bridgePoints,width:4.2,floor:station.floor},stair,walk})
    }
    // A torcida da casa desembarca na mesma estação e contorna o lado oeste
    // da arena até o portão frontal. O passeio existe independentemente do
    // lado atendido pelo único trem; trocar a demanda não reconstrói o bairro.
    const west=station.accesses[0]
    station.homeWalk=[...west.walk.slice(0,2),...[{x:52,z:-81.7},{x:-94,z:-81.7},{x:-102,z:-63},{x:-110,z:-30},{x:-110,z:40},
      {x:-80,z:65},{x:-55,z:80},{x:-55,z:115},{x:-4.55,z:115},{x:-4.55,z:76}].map(p=>point(p))]
    ribbon('metro-passeio-mandantes',[...station.homeWalk,point({x:-4.55,z:75.4})],2.4,GROUND,'pavement')
    const passengerPath=(access:AcessoEstacaoComplexo,walk=access.walk)=>[stationPoint(0,2.5),stationPoint(0,3.04),stationPoint(0,3.65),stationPoint(0,6.6),stationPoint(access.platformX,6.6),...access.points,...walk.slice(1)]
    // Regional track continues outside the visible map in both directions.
    // The train returns from the same origin with a cab at either end.
    const stop=stationPoint(0,1.7,station.railY),origin=stationPoint(-500,1.7,station.railY)
    const metroSide=options.metroSide??'away',homePath=passengerPath(west,station.homeWalk)
    // The legacy service ID identifies the one train, not its current fans.
    // Keeping it stable lets a new match change side only at the real origin.
    services.push({id:'metro-visitantes',kind:'metro',side:metroSide,width:2.65,length:114.9,wheelRadius:.23,floorHeight:.48,stop:{position:stop,heading:station.heading},inbound:[origin,stop],outbound:[stop,origin],passengerRoute:metroSide==='home'?homePath:passengerPath(west),passengerReturnRoute:metroSide==='home'?[...homePath].reverse():passengerPath(station.accesses[1]).reverse(),door:{side:-1,longitudinal:0,width:1.5}})
  }
  // A dedicated public bus turning court sits inside the frontage. Its loop
  // stays clear of both public traffic lanes and the existing fan walkways.
  const busCenter={x:-25,z:188},busRadiusX=13,busRadiusZ=9
  const busStop={x:-25,y:0,z:179},stopHeading=Math.PI/2
  // The public service approaches from the second stop beside the hotel and
  // returns along a separate curved frontage lane, clear of the parking lots.
  const loop=circularLoop([{x:-74,z:130},{x:-64,z:130},{x:-55,z:150},{x:-43,z:168},{x:-35,z:179},{x:-25,z:179},{x:-15,z:179},{x:-10,z:190},{x:-18,z:198},{x:-29,z:198},{x:-39,z:189},{x:-46,z:176},{x:-58,z:153},{x:-70,z:142},{x:-80,z:143},{x:-89,z:140},{x:-82,z:130}].map(p=>point(p,0)),6)
  const stopIndex=loop.findIndex(p=>Math.hypot(p.x-busStop.x,p.z-busStop.z)<1e-6)
  const busInbound=loop.slice(0,stopIndex+1),busOutbound=[...loop.slice(stopIndex),loop[0]]
  const busWalk=[{x:busStop.x,z:busStop.z-.65,y:.32},{x:busStop.x,z:busStop.z-1.25,y:.32},{x:busStop.x,z:busStop.z-1.25,y:GROUND},{x:busStop.x,z:busStop.z-1.9,y:GROUND},{x:-23,z:174,y:GROUND},{x:-14,z:166,y:GROUND},{x:-28,z:148,y:GROUND},{x:-28,z:124,y:GROUND},{x:-7,z:122,y:GROUND},{x:-3.6,z:116,y:GROUND},{x:-3.6,z:74,y:GROUND}]
  ribbon('terminal-onibus-circulacao',[...loop,loop[0]],5.4,0,'road')
  ribbon('terminal-onibus-conexao',[{x:-25,z:197},{x:-25,z:208}],5.4,0,'road')
  ribbon('terminal-onibus-passeio',busWalk.slice(2),2.4,GROUND,'pavement')
  const bus={center:busCenter,radiusX:busRadiusX,radiusZ:busRadiusZ,stop:busStop,heading:stopHeading,turningRadius:6,walk:busWalk,origin:busInbound[0]}
  services.push({id:'onibus-mandantes',kind:'bus',side:'home',width:2.5,length:10,wheelRadius:.43,floorHeight:.32,stop:{position:busStop,heading:stopHeading},inbound:busInbound,outbound:busOutbound,passengerRoute:busWalk,door:{side:1,longitudinal:0,width:1.5}})
  const parking={enabled:state.parking.stage>0,stage:state.parking.stage,capacity:state.parking.capacity,paved:!!state.extras.asfalto,floor:.035,turningRadius:3.5,entry:{x:38.38621511294916,z:203.56924931856256},slot:{x:54,z:163},width:2.9,length:5.9}
  for(const lot of PLANTAS_ESTACIONAMENTO_COMPLEXO)if(lot.stage<=parking.stage)ribbon(`estacionamento-ligacao-${lot.id}`,lot.access,5.4,parking.floor,'road')
  if(parking.enabled){
    const y=parking.floor
    const rawInbound=[{x:37,z:197},{x:37,z:186},{x:43,z:177},{x:48,z:177},{x:54,z:171},{x:54,z:163}].map(p=>point(p,y))
    const rawOutbound=[{x:54,z:163},{x:54,z:154},{x:67,z:151},{x:74,z:161},{x:77,z:176},{x:61,z:184},{x:44,z:191},{x:44,z:200.5},{x:37,z:200.5},{x:37,z:197}].map(p=>point(p,y))
    const loop=circularLoop([...rawInbound,...rawOutbound.slice(1,-1)],3.5)
    const stopIndex=loop.findIndex(p=>Math.hypot(p.x-parking.slot.x,p.z-parking.slot.z)<1e-6)
    const route=loop.slice(0,stopIndex+1),outbound=[...loop.slice(stopIndex),loop[0]]
    ribbon('estacionamento-chegada',route,5.4,y,'road');ribbon('estacionamento-saida',outbound,5.4,y,'road')
    const start=homeLane.findIndex(p=>p.z<125)
    const selected=homeLane.slice(Math.max(0,start))
    const pedestrian=[{x:53.6,z:163,y:.32},{x:53.05,z:163,y:.32},{x:53.05,z:163,y:GROUND},{x:52.45,z:163,y:GROUND},{x:49,z:162,y:GROUND},{x:35,z:163,y:GROUND},{x:26,z:148,y:GROUND},{x:26,z:124,y:GROUND},...selected.map(p=>point(p))]
    ribbon('estacionamento-passeio-estadio',pedestrian.slice(2),2.4,GROUND,'pavement')
    services.push({id:'estacionamento-mandantes',kind:'car',side:'home',width:1.9,length:4.6,wheelRadius:.3,floorHeight:.285,stop:{position:point(parking.slot,y),heading:Math.PI},inbound:route,outbound,passengerRoute:pedestrian,door:{side:1,longitudinal:0,width:1.4}})
  }
  return{services,station,bus,parking,parkingLots:LOTES_ESTACIONAMENTO_COMPLEXO,parkingPlants:PLANTAS_ESTACIONAMENTO_COMPLEXO,surfaces,pedestrianSurfaces,vehicleSurfaces}
}
export type PlantaTransporteComplexo=ReturnType<typeof gerarPlantaTransporte>
