import {ShapeUtils,Vector2} from 'three'
import type {PontoComplexo} from './presidencia-complexo-model'

export type RuaComplexo={id:string;baseId?:string;sourceIds?:readonly string[];points:readonly PontoComplexo[];width:number;walk:number;clearance?:number;kind?:string;destinations?:{end:0|1;id:string;turnRadius?:number}[]}
export type ObstaculoRuaComplexo={id:string;polygon:readonly PontoComplexo[]}
export type LigacaoViariaComplexo=RuaComplexo&{fromId:string;toId:string;reason:'component'|'terminal';clearance:number}
export type TravessiaViariaComplexo={roadId:string;pedestrianRouteId:string;pedestrianPolygon:Polygon;roadPoints:readonly PontoComplexo[];width:number}
export type RealinhamentoViarioComplexo={roadId:string;targetId:string;originalPoints:readonly PontoComplexo[];points:readonly PontoComplexo[];reason:string}
export type PedidoRedeViariaComplexo={
 streets:readonly RuaComplexo[]
 obstacles?:readonly ObstaculoRuaComplexo[]
 blockedRoutes?:readonly (ObstaculoRuaComplexo|readonly PontoComplexo[])[]
 maxConnectionLength?:number
 maxConnections?:number
}
// Reserved before the procedural blocks/trees are placed, at every stadium
// stage. A future service road must not acquire a house on its junction.
export const AJUSTES_RUAS_COMPLEXO={
 east:[{x:177.46375762814037,z:-28.10584230986771},{x:176.58680491372908,z:31.79492339148337},{x:187,z:77},{x:205.698401057,z:79.999082280}],
 west:[{x:-120.8802960054321,z:55.16268633733637},{x:-124.04936301203993,z:-.39899863635506},{x:-111.80879196611434,z:-52.549894338789706}],
 branch:[{x:-124.04936301203993,z:-.39899863635506},{x:-185,z:-1},{x:-218.48160694272593,z:-.10453979013396}],
 turning:{center:{x:-120.8802960054321,z:55.16268633733637},radius:5.5,walk:1.5},
}
type Polygon=readonly PontoComplexo[]
type Bounds={minX:number;maxX:number;minZ:number;maxZ:number}
type Prepared={road:RuaComplexo;polygon:Polygon;bounds:Bounds;rightOfWay:Polygon;triangles:PontoComplexo[][]}
type Candidate={from:number;to:number;points:PontoComplexo[];length:number}
const EPS=1e-7
const distance=(a:PontoComplexo,b:PontoComplexo)=>Math.hypot(a.x-b.x,a.z-b.z)
const cross=(a:PontoComplexo,b:PontoComplexo,c:PontoComplexo)=>(b.x-a.x)*(c.z-a.z)-(b.z-a.z)*(c.x-a.x)
const area=(p:Polygon)=>p.reduce((sum,a,i)=>{const b=p[(i+1)%p.length];return sum+a.x*b.z-b.x*a.z},0)/2
const bounds=(points:Polygon):Bounds=>({minX:Math.min(...points.map(p=>p.x)),maxX:Math.max(...points.map(p=>p.x)),minZ:Math.min(...points.map(p=>p.z)),maxZ:Math.max(...points.map(p=>p.z))})
const overlaps=(a:Bounds,b:Bounds)=>a.minX<=b.maxX+EPS&&b.minX<=a.maxX+EPS&&a.minZ<=b.maxZ+EPS&&b.minZ<=a.maxZ+EPS
function onSegment(p:PontoComplexo,a:PontoComplexo,b:PontoComplexo){return Math.abs(cross(a,b,p))<EPS&&p.x>=Math.min(a.x,b.x)-EPS&&p.x<=Math.max(a.x,b.x)+EPS&&p.z>=Math.min(a.z,b.z)-EPS&&p.z<=Math.max(a.z,b.z)+EPS}
function inside(p:PontoComplexo,polygon:Polygon){
 let result=false
 for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
  const a=polygon[i],b=polygon[j]
  if(onSegment(p,a,b))return true
  if((a.z>p.z)!==(b.z>p.z)&&p.x<(b.x-a.x)*(p.z-a.z)/(b.z-a.z)+a.x)result=!result
 }
 return result
}
function segmentsMeet(a:PontoComplexo,b:PontoComplexo,c:PontoComplexo,d:PontoComplexo){
 if(!overlaps(bounds([a,b]),bounds([c,d])))return false
 const p=cross(a,b,c),q=cross(a,b,d),r=cross(c,d,a),s=cross(c,d,b)
 return p*q<=EPS&&r*s<=EPS
}
function polygonsMeet(a:Polygon,b:Polygon){
 if(!overlaps(bounds(a),bounds(b)))return false
 return inside(a[0],b)||inside(b[0],a)||a.some((p,i)=>b.some((q,j)=>segmentsMeet(p,a[(i+1)%a.length],q,b[(j+1)%b.length])))
}
function overlapVertices(a:Polygon,b:Polygon){
 const result=[...a.filter(p=>inside(p,b)),...b.filter(p=>inside(p,a))]
 for(let i=0;i<a.length;i++)for(let j=0;j<b.length;j++){
  const p=a[i],q=a[(i+1)%a.length],r=b[j],s=b[(j+1)%b.length]
  if(!segmentsMeet(p,q,r,s))continue
  const dx=q.x-p.x,dz=q.z-p.z,ex=s.x-r.x,ez=s.z-r.z,den=dx*ez-dz*ex
  if(Math.abs(den)<EPS)continue
  const t=((r.x-p.x)*ez-(r.z-p.z)*ex)/den
  result.push({x:p.x+dx*t,z:p.z+dz*t})
 }
 return result
}
function triangles(polygon:Polygon){
 return ShapeUtils.triangulateShape(polygon.map(p=>new Vector2(p.x,p.z)),[]).map(indices=>{
  const piece=indices.map(i=>({...polygon[i]}));return area(piece)<0?piece.reverse():piece
 })
}

/** Same averaged normal and end caps used by the existing street ribbons.
 * Padding reserves the sidewalk without extending the street's longitudinal cap. */
export function poligonoRuaComplexo(road:Pick<RuaComplexo,'points'|'width'>,padding=0):PontoComplexo[]{
 const points=road.points.filter((p,i)=>!i||distance(p,road.points[i-1])>EPS).map(p=>({...p}))
 if(points.length<2)return []
 const cap=road.width>5?3:.85,width=road.width+2*padding
 for(const [i,j] of [[0,1],[points.length-1,points.length-2]]){
  const p=points[i],q=points[j],length=distance(p,q)
  p.x+=(p.x-q.x)/length*cap;p.z+=(p.z-q.z)/length*cap
 }
 const left:PontoComplexo[]=[],right:PontoComplexo[]=[]
 for(let i=0;i<points.length;i++){
  const a=points[Math.max(0,i-1)],b=points[Math.min(points.length-1,i+1)],length=distance(a,b)||1
  const nx=-(b.z-a.z)/length*width/2,nz=(b.x-a.x)/length*width/2,p=points[i]
  left.push({x:p.x+nx,z:p.z+nz});right.push({x:p.x-nx,z:p.z-nz})
 }
 return [...left,...right.reverse()]
}
function prepare(road:RuaComplexo):Prepared{
 const polygon=poligonoRuaComplexo(road),rightOfWay=poligonoRuaComplexo(road,road.walk)
 return{road,polygon,bounds:bounds(polygon),rightOfWay,triangles:triangles(rightOfWay)}
}
function nearest(p:PontoComplexo,a:PontoComplexo,b:PontoComplexo){
 const dx=b.x-a.x,dz=b.z-a.z,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.z-a.z)*dz)/(dx*dx+dz*dz||1)))
 const point={x:a.x+t*dx,z:a.z+t*dz};return{point,distance:distance(p,point)}
}
function components(roads:readonly Prepared[]){
 const parents=roads.map((_,i)=>i)
 const find=(i:number):number=>parents[i]===i?i:parents[i]=find(parents[i])
 const join=(a:number,b:number)=>{parents[find(a)]=find(b)}
 for(let i=0;i<roads.length;i++)for(let j=i+1;j<roads.length;j++)if(overlaps(roads[i].bounds,roads[j].bounds)&&polygonsMeet(roads[i].polygon,roads[j].polygon))join(i,j)
 return{find,join,count:()=>new Set(parents.map((_,i)=>find(i))).size}
}
// Subtract existing paved rights of way before checking new land occupation.
// This lets a junction reuse an existing sidewalk corner, without allowing a
// connector to cut through the neighbouring parcel or another reserved plot.
function subtractConvex(original:Polygon,clip:Polygon):PontoComplexo[][]{
 let current=original.map(p=>({...p}));const result:PontoComplexo[][]=[]
 for(let edge=0;edge<clip.length&&current.length>=3;edge++){
  const a=clip[edge],b=clip[(edge+1)%clip.length],positive:PontoComplexo[]=[],negative:PontoComplexo[]=[]
  for(let i=0;i<current.length;i++){
   const p=current[i],q=current[(i+1)%current.length],dp=cross(a,b,p),dq=cross(a,b,q)
   if(dp>=-EPS)positive.push(p)
   if(dp<=EPS)negative.push(p)
   if(dp>EPS&&dq< -EPS||dp< -EPS&&dq>EPS){const t=dp/(dp-dq),point={x:p.x+(q.x-p.x)*t,z:p.z+(q.z-p.z)*t};positive.push(point);negative.push(point)}
  }
  if(negative.length>=3&&Math.abs(area(negative))>EPS)result.push(negative)
  current=positive
 }
 return result
}

// The neighbourhood and park generators share a grid, but can register the
// same pavement twice (29 m and 58 m segments). Coalesce only equal, straight
// widths on an identical axis, and only overlapping/touching centre intervals.
// Thus this removes duplicate pavement without filling a missing street.
function coalesce(input:readonly RuaComplexo[]){
 const untouched:RuaComplexo[]=[],groups=new Map<string,{road:RuaComplexo;axis:'x'|'z';fixed:number;from:number;to:number}[]>()
 for(const road of input){
  if(!/^(bairro|parque)-/.test(road.baseId??road.id)||road.points.length!==2){untouched.push(road);continue}
  const [a,b]=road.points,axis=Math.abs(a.z-b.z)<EPS?'x':Math.abs(a.x-b.x)<EPS?'z':undefined
  if(!axis){untouched.push(road);continue}
  const fixed=axis==='x'?a.z:a.x,key=`${axis}:${fixed.toFixed(7)}:${road.width}:${road.walk}`
  const group=groups.get(key)??[];group.push({road,axis,fixed,from:Math.min(a[axis],b[axis]),to:Math.max(a[axis],b[axis])});groups.set(key,group)
 }
 for(const group of groups.values()){
  group.sort((a,b)=>a.from-b.from||a.to-b.to)
  let current=group[0],ids=[...(current.road.sourceIds??[current.road.id])]
  const flush=()=>untouched.push({...current.road,sourceIds:ids,points:current.axis==='x'?[{x:current.from,z:current.fixed},{x:current.to,z:current.fixed}]:[{x:current.fixed,z:current.from},{x:current.fixed,z:current.to}]})
  for(const next of group.slice(1)){
   if(next.from<=current.to+EPS){current={...current,to:Math.max(current.to,next.to)};ids.push(...(next.road.sourceIds??[next.road.id]))}
   else{flush();current=next;ids=[...(next.road.sourceIds??[next.road.id])]}
  }
  flush()
 }
 return untouched
}

/** Connect and repair the visual street plan without changing purchases or
 * actor routes. Invalid service-road tails are recorded explicitly as reroutes. */
export function planejarRedeViaria({streets:input,obstacles=[],blockedRoutes=[],maxConnectionLength=90,maxConnections=32}:PedidoRedeViariaComplexo){
 const ids=new Set<string>()
 const cloned:RuaComplexo[]=input.map((road,index)=>{
  if(road.points.length<2||!road.points.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.z))||!Number.isFinite(road.width)||road.width<=0||!Number.isFinite(road.walk)||road.walk<0)throw new RangeError(`Rua inválida: ${road.id}`)
  let id=road.id;if(ids.has(id))id=`${id}-${index}`;while(ids.has(id))id+='-r';ids.add(id)
  return{...road,id,baseId:road.baseId??road.id,points:road.points.map(p=>({...p})),clearance:road.width/2+road.walk}
 })
 const westSource=cloned.find(road=>road.id==='rua-interna-oeste')
 if(westSource&&westSource.points.some(p=>distance(p,{x:-124.049363012,z:-.398998636})<.05)){
  cloned.push({id:'ramal-oeste-servicos',kind:'service',width:5.8,walk:1.6,points:AJUSTES_RUAS_COMPLEXO.branch})
 }
 const streets=coalesce(cloned)
 const initial=streets.map(prepare);let initialGraph=components(initial)
 const beforeComponents=initialGraph.count()
 const blocked=[...obstacles,...blockedRoutes.map((entry,index)=>Array.isArray(entry)?{id:`pedestrian-${index}`,polygon:entry}:entry as ObstaculoRuaComplexo)]
  .filter(item=>item.polygon.length>=3).map(item=>({...item,bounds:bounds(item.polygon)}))
 const connections:LigacaoViariaComplexo[]=[],rejected:{fromId:string;toId:string;obstacle:string}[]=[]
 const crossings:TravessiaViariaComplexo[]=[]
 const reroutes:RealinhamentoViarioComplexo[]=[]
 const existing=[...initial]
 function clear(road:RuaComplexo,allowedRoutes:ReadonlySet<string>=new Set()){
  const footprint=poligonoRuaComplexo(road,road.walk),box=bounds(footprint)
  const relevant=blocked.filter(item=>!allowedRoutes.has(item.id)&&overlaps(box,item.bounds)&&polygonsMeet(footprint,item.polygon))
  if(!relevant.length)return undefined
  let pieces=triangles(footprint)
  for(const old of existing){
   if(!overlaps(box,bounds(old.rightOfWay)))continue
   for(const triangle of old.triangles){
    const b=bounds(triangle)
    pieces=pieces.flatMap(piece=>overlaps(bounds(piece),b)?subtractConvex(piece,triangle):[piece])
    if(!pieces.length)return undefined
   }
  }
  return relevant.find(item=>pieces.some(piece=>polygonsMeet(piece,item.polygon)))?.id
 }
 function candidates(fromIndices:readonly number[],toIndices:readonly number[],terminal?:{index:number;end:0|1}){
  const result:Candidate[]=[]
  for(const from of fromIndices){
   const source=streets[from],ends=terminal?[source.points[terminal.end===0?0:source.points.length-1]]:[source.points[0],source.points.at(-1)!]
   for(const to of toIndices){
    if(from===to)continue
    const target=streets[to]
    if(terminal&&connections.some(c=>c.id===target.id&&(c.fromId===source.id||c.toId===source.id)))continue
    for(const p of ends){
     let closest:{point:PontoComplexo;distance:number}|undefined
     for(let j=1;j<target.points.length;j++){const n=nearest(p,target.points[j-1],target.points[j]);if(!closest||n.distance<closest.distance)closest=n}
     const options=closest?[closest]:[]
     // A nearest projection can be blocked while the same avenue is reachable
     // a few metres along it. Sample only terminal alternatives, never move the
     // original road or route through a registered pedestrian corridor.
     if(terminal)for(let j=1;j<target.points.length;j++){
      const a=target.points[j-1],b=target.points[j],steps=Math.ceil(distance(a,b)/8)
      for(let k=0;k<=steps;k++){const point={x:a.x+(b.x-a.x)*k/steps,z:a.z+(b.z-a.z)*k/steps};options.push({point,distance:distance(p,point)})}
     }
     for(const closest of options)if(closest.distance>EPS&&closest.distance<=maxConnectionLength){
      // A terminal may turn into a side street, but cannot fold backwards over
      // its own approach and masquerade as a resolved dead end.
      if(terminal){
       const previous=source.points[terminal.end===0?1:source.points.length-2]
       const outward=((p.x-previous.x)*(closest.point.x-p.x)+(p.z-previous.z)*(closest.point.z-p.z))/(distance(p,previous)*closest.distance)
       if(outward<-.2)continue
      }
      result.push({from,to,points:[{...p},closest.point],length:closest.distance})
      if(terminal&&Math.abs(p.x-closest.point.x)>8&&Math.abs(p.z-closest.point.z)>8){
       for(const corner of [{x:p.x,z:closest.point.z},{x:closest.point.x,z:p.z}]){
        const length=distance(p,corner)+distance(corner,closest.point)
        const previous=source.points[terminal.end===0?1:source.points.length-2]
        const outward=((p.x-previous.x)*(corner.x-p.x)+(p.z-previous.z)*(corner.z-p.z))/(distance(p,previous)*distance(p,corner))
        if(length<=maxConnectionLength&&outward>=-.2)result.push({from,to,points:[{...p},corner,closest.point],length})
       }
      }
     }
    }
   }
  }
  return result.sort((a,b)=>a.length-b.length||a.from-b.from||a.to-b.to)
 }
 function connect(candidate:Candidate,reason:LigacaoViariaComplexo['reason']){
  if(connections.length>=maxConnections)return false
  const source=streets[candidate.from],target=streets[candidate.to]
  const width=Math.min(5.8,source.width,target.width),walk=Math.min(1.2,source.walk,target.walk)
  const id=`ligacao-viaria-${connections.length+1}`
  const road:LigacaoViariaComplexo={id,baseId:id,kind:'connection',fromId:source.id,toId:target.id,reason,points:candidate.points,width,walk,clearance:width/2+walk}
  const allowedRoutes=new Set<string>()
  if(reason==='terminal'&&source.id.startsWith('rua-interna-'))for(const route of blocked){
   const south=candidate.points[0].z>100&&route.id==='sidewalk'
   const north=candidate.points[0].z<0&&(route.id==='station'||route.id.startsWith('metro-passeio-estadio-'))
   if(!south&&!north)continue
   const vertices=overlapVertices(poligonoRuaComplexo(road,road.walk),route.polygon)
   // A 16 cm raised table needs its complete 2.2 m ramp before any existing
   // public lane. Reserve 7 m beyond the asphalt edge, including its sidewalk.
   // Close approaches stay blocked; never lift registered traffic routes.
   if(vertices.length&&initial.every(old=>! /^(via-|avenida-)/.test(old.road.baseId??old.road.id)||vertices.every(p=>old.road.points.slice(1).every((b,i)=>nearest(p,old.road.points[i],b).distance>old.road.width/2+7))))allowedRoutes.add(route.id)
  }
  const obstacle=clear(road,allowedRoutes)
  if(obstacle){if(rejected.length<60)rejected.push({fromId:source.id,toId:target.id,obstacle});return false}
  connections.push(road);streets.push(road);existing.push(prepare(road))
  for(const route of blocked)if(allowedRoutes.has(route.id)&&polygonsMeet(poligonoRuaComplexo(road),route.polygon))crossings.push({roadId:id,pedestrianRouteId:route.id,pedestrianPolygon:route.polygon.map(p=>({...p})),roadPoints:road.points,width})
  return true
 }
 // Move the eastern service road outside the parking parcel. Its previous
 // two bends actually crossed the purchased lot, before ending at a sidewalk.
 const eastern=streets.findIndex(r=>r.id==='rua-interna-leste'),eastAvenue=streets.find(r=>r.id==='via-leste')
 if(eastern>=0&&eastAvenue){
  const source=streets[eastern],before=source.points
  if(before.length>=4&&distance(before[1],{x:176.58680491372908,z:31.79492339148337})<.05){
   const changed={...source,points:AJUSTES_RUAS_COMPLEXO.east}
   const obstacle=clear(changed)
   if(!obstacle){
    streets[eastern]=changed;initial[eastern]=prepare(changed);existing[eastern]=initial[eastern]
    reroutes.push({roadId:source.id,targetId:eastAvenue.id,originalPoints:before.map(p=>({...p})),points:changed.points,reason:'Via de serviço pelo lado externo do estacionamento, conectada à avenida leste.'})
   }else rejected.push({fromId:source.id,toId:eastAvenue.id,obstacle:`realinhamento: ${obstacle}`})
  }
 }
 const western=streets.findIndex(r=>r.id==='rua-interna-oeste')
 if(western>=0&&distance(streets[western].points[0],{x:-117.12244244353224,z:143.2223604326007})<.05){
  const source=streets[western],changed:RuaComplexo={...source,points:AJUSTES_RUAS_COMPLEXO.west,destinations:[{end:0,id:'chegada-hotel',turnRadius:AJUSTES_RUAS_COMPLEXO.turning.radius}]}
  streets[western]=changed;initial[western]=prepare(changed);existing[western]=initial[western]
  reroutes.push({roadId:source.id,targetId:'chegada-hotel',originalPoints:source.points,points:changed.points,reason:'Retorno antes do hotel; remove asfalto atravessando o edifício e a calçada pública.'})
 }
 initialGraph=components(initial)
 const indices=initial.map((_,i)=>i)
 if(beforeComponents>1){
  const possible=candidates(indices,indices).filter(c=>initialGraph.find(c.from)!==initialGraph.find(c.to))
  for(const candidate of possible){
   if(initialGraph.find(candidate.from)===initialGraph.find(candidate.to))continue
   if(connect(candidate,'component'))initialGraph.join(candidate.from,candidate.to)
   if(initialGraph.count()===1||connections.length>=maxConnections)break
  }
 }
 const unresolved:{kind:'terminal'|'component';roadId?:string;end?:0|1;point?:PontoComplexo;reason:string}[]=[]
 const resolvedDestinations:{roadId:string;end:0|1;destination:string}[]=[]
 // These named ends are within the detailed map. They need a genuine junction
 // or an already registered parking destination, not a cap in bare grass.
 for(let index=0;index<initial.length;index++){
  const road=streets[index],base=road.baseId??road.id
  if(!/^(avenida-|via-|rua-interna-)/.test(base))continue
  for(const end of [0,1] as const){
   const point=road.points[end===0?0:road.points.length-1]
   const plannedDestination=road.destinations?.find(d=>d.end===end)
   if(plannedDestination){resolvedDestinations.push({roadId:road.id,end,destination:plannedDestination.id});continue}
   const destination=obstacles.find(o=>/estacionamento|parking|terminal/i.test(o.id)&&(
    inside(point,o.polygon)||polygonsMeet(initial[index].polygon,o.polygon)&&o.polygon.some((p,i)=>nearest(point,p,o.polygon[(i+1)%o.polygon.length]).distance<=Math.min(3,road.width/2))
   ))
   if(destination){resolvedDestinations.push({roadId:road.id,end,destination:destination.id});continue}
   if(existing.some((other,j)=>j!==index&&inside(point,other.polygon)))continue
   const found=candidates([index],streets.map((_,i)=>i),{index,end}).some(candidate=>connect(candidate,'terminal'))
   if(!found)unresolved.push({kind:'terminal',roadId:road.id,end,point:{...point},reason:'Nenhuma ligação livre dentro da distância permitida.'})
  }
 }
 const finalGraph=components(existing),afterComponents=finalGraph.count()
 if(afterComponents>1)unresolved.push({kind:'component',reason:`${afterComponents} componentes restantes; obstáculos ou limite de ligação impediram a união.`})
 return{streets,connections,crossings,reroutes,diagnostics:{beforeComponents,afterComponents,originalStreets:input.length,normalizedStreets:initial.length,mergedStreets:input.length-initial.length,addedConnections:connections.length,
  resolvedDestinations,unresolved,rejected,connectionLength:connections.reduce((sum,c)=>sum+c.points.slice(1).reduce((n,p,i)=>n+distance(p,c.points[i]),0),0)}}
}
