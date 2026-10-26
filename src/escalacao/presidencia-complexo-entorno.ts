import * as THREE from 'three'
import {gerarPlantaTransporte, LOTES_ESTACIONAMENTO_COMPLEXO, faixaTransporteComplexo} from './presidencia-complexo-transporte-model'
import {criarConcessionariaComplexo, PLANTA_VADICO} from './presidencia-complexo-concessionaria'
import {planejarRedeViaria, poligonoRuaComplexo, AJUSTES_RUAS_COMPLEXO, type RuaComplexo} from './presidencia-complexo-ruas'
import {plantaPedestreComplexo} from './presidencia-complexo-pedestres'
import {planejarTravessiasComplexo} from './presidencia-complexo-travessias'
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js'
import type {AncoraLuzComplexo} from './presidencia-complexo-iluminacao'
import {PLANTA_COMPLEXO, mapaParaMundo, caminhosTorcidaComplexo, deslocarCaminhoComplexo, type EstadoComplexo, type PontoComplexo, type PortaComplexo} from './presidencia-complexo-model'

export type SolidoEntorno = {id:string;minX:number;maxX:number;minZ:number;maxZ:number;base:number;top:number;footprint:readonly PontoComplexo[]}
const GROUND = .16
const UP = new THREE.Vector3(0, 1, 0)
const hash = (x:number, z:number) => {
  const value = Math.sin(x * 127.1 + z * 311.7) * 43758.5453
  return value - Math.floor(value)
}
const path = (points:number[][]) => points.map(([x,y]) => mapaParaMundo({x,y}))
const distanceToSegment = (p:PontoComplexo, a:PontoComplexo, b:PontoComplexo) => {
  const dx=b.x-a.x,dz=b.z-a.z,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.z-a.z)*dz)/(dx*dx+dz*dz||1)))
  return Math.hypot(p.x-a.x-t*dx,p.z-a.z-t*dz)
}
// ⚡ 25/10 (Diego: *"senti que tá travando"*): o bairro perguntava milhares de vezes "esse ponto está perto de alguma rua/rota/
// obra?" e cada pergunta media a distância até TODOS os trechos (medido: ~5 s de trava ao abrir o Clube). O índice guarda cada
// trecho nas casinhas de uma grade; a pergunta só mede os trechos das casinhas em volta do ponto. Resposta IDÊNTICA (a conta final
// é a mesma `distanceToSegment`; trecho a menos de r do ponto sempre cai numa casinha que a busca olha) — só mais rápida.
type Trecho = readonly [PontoComplexo, PontoComplexo, number] // a, b, id do dono (rota/polígono)
function indiceTrechos(trechos: readonly Trecho[], lado = 8) {
  const grade = new Map<number, number[]>()
  const cel = (v: number) => Math.floor(v / lado)
  const chave = (i: number, j: number) => i * 100003 + j
  trechos.forEach(([a, b], k) => {
    for (let i = cel(Math.min(a.x, b.x)); i <= cel(Math.max(a.x, b.x)); i++)
      for (let j = cel(Math.min(a.z, b.z)); j <= cel(Math.max(a.z, b.z)); j++) {
        const c = chave(i, j), l = grade.get(c); if (l) l.push(k); else grade.set(c, [k])
      }
  })
  /** algum trecho a distância que passa no teste `perto(d)`, procurando num raio r em volta do ponto */
  return (p: PontoComplexo, r: number, perto: (d: number) => boolean): boolean => {
    const vistos = new Set<number>()
    for (let i = cel(p.x - r); i <= cel(p.x + r); i++) for (let j = cel(p.z - r); j <= cel(p.z + r); j++) {
      const l = grade.get(chave(i, j)); if (!l) continue
      for (const k of l) { if (vistos.has(k)) continue; vistos.add(k); const t = trechos[k]; if (perto(distanceToSegment(p, t[0], t[1]))) return true }
    }
    return false
  }
}
const caixaDe = (pol: readonly PontoComplexo[]) => { let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity; for (const q of pol) { if (q.x < x0) x0 = q.x; if (q.x > x1) x1 = q.x; if (q.z < z0) z0 = q.z; if (q.z > z1) z1 = q.z } return { x0, x1, z0, z1 } }
const inside = (p:PontoComplexo, polygon:readonly PontoComplexo[]) => {
  let result=false
  for(let i=0,j=polygon.length-1;i<polygon.length;j=i++) {
    const a=polygon[i],b=polygon[j]
    if((a.z>p.z)!==(b.z>p.z)&&p.x<(b.x-a.x)*(p.z-a.z)/(b.z-a.z)+a.x)result=!result
  }
  return result
}

/** District reconstructed in metres from the registered illustration. All
 * purchased establishments are separate, and doors are actual openings. */
const RUIDO_PRONTO=new Map<string,Uint8Array>()
const QUADRA=400
let CAMPOS_RUIDO:{size:number;fino:Float64Array;mancha:Float64Array}|null=null
/** grão fino + mancha média (fino) e mancha grande (mancha) do chão — iguais pra toda textura, calculados uma vez por página */
function camposRuido(size:number){
  if(CAMPOS_RUIDO?.size===size)return CAMPOS_RUIDO
  const smooth=(x:number,z:number,step:number)=>{
    const ix=Math.floor(x/step),iz=Math.floor(z/step),fx=x/step-ix,fz=z/step-iz
    const u=fx*fx*(3-2*fx),v=fz*fz*(3-2*fz)
    const period=size/step,sample=(px:number,pz:number)=>hash(px%period,pz%period)
    const a=sample(ix,iz)*(1-u)+sample(ix+1,iz)*u,b=sample(ix,iz+1)*(1-u)+sample(ix+1,iz+1)*u
    return a*(1-v)+b*v-.5
  }
  const fino=new Float64Array(size*size),mancha=new Float64Array(size*size)
  for(let z=0;z<size;z++)for(let x=0;x<size;x++){const i=z*size+x;fino[i]=(hash(x,z)-.5)*.45+smooth(x,z,16)*.35;mancha[i]=smooth(x,z,128)}
  return CAMPOS_RUIDO={size,fino,mancha}
}
export function criarEntornoComplexo(scene:THREE.Scene, state:EstadoComplexo) {
  const root=new THREE.Group()
  root.name='complexo-entorno'
  scene.add(root)
  const solids:SolidoEntorno[]=[]
  const lightAnchors:AncoraLuzComplexo[]=[]
  const doors:Record<string,PortaComplexo>={...PLANTA_COMPLEXO.doors}
  const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>(),textures=new Set<THREE.Texture>()
  const own=<T extends THREE.BufferGeometry>(value:T) => {geometries.add(value);return value}
  const noise=(color:string,grit:number,pavers=false,macro=.55)=>{
    // ⚡ 25/10: os pixels de cada textura saem sempre iguais (não dependem do estádio) — calcula uma vez por página e reaproveita
    const chaveRuido=`${color}|${grit}|${pavers}|${macro}`,guardado=RUIDO_PRONTO.get(chaveRuido)
    const base=new THREE.Color(color),size=512,pixels=guardado??new Uint8Array(size*size*4)
    if(!guardado){
    // ⚡ 25/10 (Diego: "quando aperta em Clube já fica pesado"): o grão e as duas manchas não dependem da cor — eram recalculados nas 10
    // texturas (8 senos por pixel × 262 mil pixels × 10). Agora saem UMA vez (`camposRuido`) e cada textura só mistura. Mesma conta, na
    // mesma ordem e em precisão dupla: pixel por pixel idêntico
    const {fino,mancha}=camposRuido(size)
    for(let z=0;z<size;z++)for(let x=0;x<size;x++){
      // Metre-based UVs: fine aggregate remains visible close up, while broad
      // colour variation avoids a uniform speckled sheet when looking at a block.
      const i=z*size+x,grain=(fino[i]+mancha[i]*macro)*grit
      const grout=pavers&&(z%128<2||(x+(Math.floor(z/128)%2)*128)%256<2)?-.11:0
      const at=i*4
      pixels[at]=Math.max(0,Math.min(255,(base.r+grain+grout)*255))
      pixels[at+1]=Math.max(0,Math.min(255,(base.g+grain+grout)*255))
      pixels[at+2]=Math.max(0,Math.min(255,(base.b+grain+grout)*255));pixels[at+3]=255
    }
    RUIDO_PRONTO.set(chaveRuido,pixels)
    }
    const texture=new THREE.DataTexture(pixels,size,size)
    texture.wrapS=texture.wrapT=THREE.RepeatWrapping
    texture.minFilter=THREE.LinearMipmapLinearFilter;texture.magFilter=THREE.LinearFilter
    texture.generateMipmaps=true;texture.needsUpdate=true;texture.colorSpace=THREE.LinearSRGBColorSpace
    textures.add(texture);return texture
  }
  const material=(color:string,roughness=.85,metalness=0,map?:THREE.Texture)=>{
    const value=new THREE.MeshStandardMaterial({color:map?'#ffffff':color,roughness,metalness,...(map?{map}:{})})
    materials.add(value);return value
  }
  // A large repeated octave across open land forms visible bands at map scale.
  // Retain fine surface detail there without repeating broad stains every 4 m.
  const dirt=material('#968763',1,0,noise('#968763',.09,false,0))
  const grass=material('#647450',1,0,noise('#647450',.075,false,0))
  const asphalt=material('#555a56',.96,0,noise('#555a56',.06))
  const paving=material('#c6bd9e',.91,0,noise('#c6bd9e',.04,true))
  paving.userData.civilianPavement=true
  asphalt.userData.complexoLightFloor = true
  paving.userData.complexoLightFloor = true
  const concrete=material('#c7c1ac',.8,0,noise('#c7c1ac',.03))
  const white=material('#e2dece',.78)
  const dark=material('#39443e',.78,.13)
  const metal=material('#6c7168',.48,.52)
  const glass=material('#53666a',.21,.32)
  const warmGlass=material('#9b8961',.36,.18)
  warmGlass.emissive.set('#b16d24');warmGlass.emissiveIntensity=.10
  warmGlass.userData.complexoNightEmission={color:'#efc886',intensity:.65,dayIntensity:.04}
  const cityWarm=material('#53666a',.21,.32),cityCool=material('#53666a',.21,.32)
  cityWarm.userData.complexoNightEmission={color:'#efc886',intensity:.7}
  cityCool.userData.complexoNightEmission={color:'#c1dded',intensity:.38}
  const lampGlass=material('#e1ddd0',.26,.1)
  lampGlass.userData.complexoNightEmission={color:'#ffe4ae',intensity:2.1}
  const water=material('#3c8d96',.16,.21)
  const wood=material('#876044',.85,0,noise('#876044',.035))
  const roof=material('#7b5d4b',.94,0,noise('#7b5d4b',.05))
  const leaf=material('#405d34',.95,0,noise('#405d34',.075))
  const lightLeaf=material('#667d3d',.96)
  leaf.vertexColors=lightLeaf.vertexColors=true
  for(const [mat,depth] of [[dirt,.010],[grass,.008],[asphalt,.009],[paving,.014],[concrete,.008],[wood,.008],[roof,.014]] as const){
    mat.bumpMap=mat.map;mat.bumpScale=depth
  }
  const flower=material('#c4a760',.93)
  const fanPaths=caminhosTorcidaComplexo(state)
  const transport=gerarPlantaTransporte(state)
  const pedestrianPlan=plantaPedestreComplexo(state)
  const allRoutes=[...Object.values(PLANTA_COMPLEXO.routes),...Object.values(fanPaths).map(points=>({points})),...transport.services.flatMap(service=>[service.inbound,service.outbound,service.passengerRoute,...(service.passengerReturnRoute?[service.passengerReturnRoute]:[])].map(points=>({points}))),...transport.parkingPlants.map(lot=>({points:lot.access}))]
  const trafficCorridors=['roadOut','roadBack'].flatMap(id=>PLANTA_COMPLEXO.routes[id].points.slice(1).map((b,i)=>{
    const a=PLANTA_COMPLEXO.routes[id].points[i],length=Math.hypot(b.x-a.x,b.z-a.z),dx=(b.x-a.x)/length,dz=(b.z-a.z)/length,cap=2.7,radius=2.65
    const from={x:a.x-dx*cap,z:a.z-dz*cap},to={x:b.x+dx*cap,z:b.z+dz*cap}
    const polygon=[{x:from.x+dz*radius,z:from.z-dx*radius},{x:to.x+dz*radius,z:to.z-dx*radius},{x:to.x-dz*radius,z:to.z+dx*radius},{x:from.x-dz*radius,z:from.z+dx*radius}]
    return {polygon,minX:Math.min(...polygon.map(p=>p.x)),maxX:Math.max(...polygon.map(p=>p.x)),minZ:Math.min(...polygon.map(p=>p.z)),maxZ:Math.max(...polygon.map(p=>p.z))}
  }))
  // Purchased driveways are curved/concave, so subtract their actual triangles
  // from old raised pavements rather than treating the whole strip as convex.
  const transportCorridors=[...transport.vehicleSurfaces,{polygon:PLANTA_VADICO.drivewayCutPolygon}].flatMap(surface=>{
    const source=surface.polygon
    return THREE.ShapeUtils.triangulateShape(source.map(p=>new THREE.Vector2(p.x,p.z)),[]).map(indices=>{
      const points=indices.map(i=>source[i]),area=points.reduce((sum,a,i)=>{const b=points[(i+1)%points.length];return sum+a.x*b.z-b.x*a.z},0)
      const polygon=area<0?points.reverse():points
      return{polygon,minX:Math.min(...polygon.map(p=>p.x)),maxX:Math.max(...polygon.map(p=>p.x)),minZ:Math.min(...polygon.map(p=>p.z)),maxZ:Math.max(...polygon.map(p=>p.z))}
    })
  })

  // Subtract the real vehicle envelope from raised paving at junctions. A
  // sidewalk from an intersecting street must not cross an existing lane.
  const subtractConvex=(points:PontoComplexo[],clip:readonly PontoComplexo[])=>{
    // A separating edge proves there is no overlap. Preserve the original
    // face instead of splitting it along extensions of unrelated road edges.
    if(clip.some((a,i)=>{
      const b=clip[(i+1)%clip.length]
      return points.every(p=>(b.x-a.x)*(p.z-a.z)-(b.z-a.z)*(p.x-a.x)<=1e-8)
    }))return[points]
    const pieces:PontoComplexo[][]=[]
    let current=points
    for(let edge=0;edge<clip.length&&current.length>=3;edge++){
      const a=clip[edge],b=clip[(edge+1)%clip.length],positive:PontoComplexo[]=[],negative:PontoComplexo[]=[]
      const signed=(p:PontoComplexo)=>(b.x-a.x)*(p.z-a.z)-(b.z-a.z)*(p.x-a.x)
      for(let i=0;i<current.length;i++){
        const p=current[i],q=current[(i+1)%current.length],dp=signed(p),dq=signed(q)
        if(dp>=-1e-8)positive.push(p)
        if(dp<=1e-8)negative.push(p)
        if((dp>1e-8&&dq< -1e-8)||(dp< -1e-8&&dq>1e-8)){
          const t=dp/(dp-dq),cross={x:p.x+(q.x-p.x)*t,z:p.z+(q.z-p.z)*t}
          positive.push(cross);negative.push(cross)
        }
      }
      if(negative.length>=3)pieces.push(negative)
      current=positive
    }
    return pieces
  }
  type Corridor={polygon:PontoComplexo[];minX:number;maxX:number;minZ:number;maxZ:number}
  const streetCorridors:Corridor[]=[]
  let renderingStreet=false
  const clippedPaving=(original:THREE.BufferGeometry,transportCut=true,outline?:readonly PontoComplexo[])=>{
    const positions=original.getAttribute('position'),indices=original.getIndex(),vertices:number[]=[],uvs:number[]=[],normals:number[]=[]
    // The complete road plan must exist before its pavements are built. Cutting
    // only animated traffic lanes left raised kerbs across local junctions.
    const corridors=[...trafficCorridors,...(transportCut?transportCorridors:[]),...(renderingStreet?streetCorridors:[])]
    original.computeBoundingBox()
    const bounds=original.boundingBox!
    const relevant=corridors.filter(c=>{
      return bounds.max.x>=c.minX&&bounds.min.x<=c.maxX&&bounds.max.z>=c.minZ&&bounds.min.z<=c.maxZ
    })
    const faces:PontoComplexo[][]=[]
    if(outline){
      const area=outline.reduce((sum,a,i)=>{const b=outline[(i+1)%outline.length];return sum+a.x*b.z-b.x*a.z},0)
      const boundary=area>0?[...outline].reverse():[...outline]
      if(boundary.every((a,i)=>{
        const b=boundary[(i+1)%boundary.length],c=boundary[(i+2)%boundary.length]
        return (b.x-a.x)*(c.z-b.z)-(b.z-a.z)*(c.x-b.x)<=1e-8
      }))faces.push(boundary)
    }
    // Clip convex pavement as one face before triangulation, avoiding a seam
    // through every junction. Concave ribbons retain their original triangles.
    if(!faces.length)for(let i=0;i<(indices?.count??positions.count);i+=3)
      faces.push(Array.from({length:3},(_,j)=>{const k=indices?indices.getX(i+j):i+j;return{x:positions.getX(k),z:positions.getZ(k)}}))
    for(const face of faces){
      let pieces=[face]
      for(const corridor of relevant){
        pieces=pieces.flatMap(piece=>{
          if(piece.every(p=>p.x<corridor.minX)||piece.every(p=>p.x>corridor.maxX)||piece.every(p=>p.z<corridor.minZ)||piece.every(p=>p.z>corridor.maxZ))return[piece]
          return subtractConvex(piece,corridor.polygon)
        })
        if(!pieces.length)break
      }
      for(const piece of pieces)for(let j=1;j<piece.length-1;j++){
        const a=piece[0],b=piece[j],c=piece[j+1]
        if(Math.abs((b.x-a.x)*(c.z-a.z)-(b.z-a.z)*(c.x-a.x))<1e-7)continue
        for(const p of [a,b,c]){vertices.push(p.x,0,p.z);uvs.push(p.x/4,p.z/4);normals.push(0,1,0)}
      }
    }
    original.dispose()
    return new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(vertices,3)).setAttribute('normal',new THREE.Float32BufferAttribute(normals,3)).setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2))
  }
  let rotasIdx:ReturnType<typeof indiceTrechos>|undefined
  const protectedPath=(p:PontoComplexo,r=2.2)=>(rotasIdx??=indiceTrechos(allRoutes.flatMap((route,k)=>route.points.slice(1).map((b,i)=>[route.points[i],b,k] as Trecho))))(p,r,d=>d<r)
  const registeredLots=Object.values(PLANTA_COMPLEXO.lots)
  const parkingLots=LOTES_ESTACIONAMENTO_COMPLEXO
  const circle=(center:PontoComplexo,radius:number)=>Array.from({length:48},(_,i)=>({x:center.x+Math.cos(i*Math.PI/24)*radius,z:center.z+Math.sin(i*Math.PI/24)*radius}))
  const serviceReservations=[...['east','west','branch'].map(key=>poligonoRuaComplexo({points:AJUSTES_RUAS_COMPLEXO[key as 'east'|'west'|'branch'],width:5.8},1.6)),circle(AJUSTES_RUAS_COMPLEXO.turning.center,7)]
  const landscapeReservations=[...serviceReservations,...pedestrianPlan.reservationPolygons,...PLANTA_VADICO.reservationPolygons,faixaTransporteComplexo(transport.station.avenue,transport.station.avenueWidth+8),...registeredLots.map(lot=>lot.footprint),...parkingLots,...transport.surfaces.map(surface=>surface.polygon),...transport.parkingPlants.map(lot=>faixaTransporteComplexo(lot.access,8)),
    ...(transport.station.enabled?[faixaTransporteComplexo([transport.station.point(-transport.station.railExtent,0),transport.station.point(transport.station.railExtent,0)],14)]:[]),
    ...['fonte','jardim-acesso-hotel','canteiro-central','canteiro-direito','canteiro-esquerdo','canteiro-calcada-leste'].map(id=>PLANTA_COMPLEXO.footprints[id]),
    path([[578,604],[916,605],[916,770],[657,798],[553,730]]),
  ]
  let obrasIdx:{perto:ReturnType<typeof indiceTrechos>;caixas:{x0:number;x1:number;z0:number;z1:number}[]}|undefined
  const clearOfConstruction=(p:PontoComplexo,margin=0)=>{
    obrasIdx??={perto:indiceTrechos(landscapeReservations.flatMap((f,k)=>f.map((b,i)=>[f[(i+f.length-1)%f.length],b,k] as Trecho))),caixas:landscapeReservations.map(caixaDe)}
    const o=obrasIdx
    // (mesma regra de antes: fora de todo polígono E longe de toda borda; o polígono só é testado se o ponto cai na caixa dele)
    if(landscapeReservations.some((f,k)=>{const c=o.caixas[k];return p.x>=c.x0&&p.x<=c.x1&&p.z>=c.z0&&p.z<=c.z1&&inside(p,f)}))return false
    return !o.perto(p,Math.max(0,margin),d=>!(d>margin))
  }
  const arena=PLANTA_COMPLEXO.arena.collision
  const reserved=(p:PontoComplexo)=>Math.abs(p.x)<118&&p.z>-105&&p.z<119||!clearOfConstruction(p)||inside(p,arena)||protectedPath(p)
  const add=(geometry:THREE.BufferGeometry,mat:THREE.Material,parent:THREE.Object3D=root)=>{
    own(geometry)
    const value=new THREE.Mesh(geometry,mat)
    value.castShadow=true;value.receiveShadow=true;parent.add(value);return value
  }
  const box=(id:string,mat:THREE.Material,w:number,h:number,d:number,x:number,y:number,z:number,angle=0,collider=false)=>{
    const geometry=new THREE.BoxGeometry(w,h,d)
    // UV in metres, so zoom reveals paving/grain without stretching a photo.
    const positions=geometry.getAttribute('position'),normals=geometry.getAttribute('normal'),uv=geometry.getAttribute('uv')
    for(let i=0;i<positions.count;i++) {
      if(Math.abs(normals.getY(i))>.5)uv.setXY(i,positions.getX(i)/4,positions.getZ(i)/4)
      else if(Math.abs(normals.getX(i))>.5)uv.setXY(i,positions.getZ(i)/4,positions.getY(i)/4)
      else uv.setXY(i,positions.getX(i)/4,positions.getY(i)/4)
    }
    const value=add(geometry,mat)
    value.name=id;value.position.set(x,y,z);value.rotation.y=angle
    value.castShadow=h>.25||y>.5
    if(collider){
      value.updateMatrixWorld(true);const bound=new THREE.Box3().setFromObject(value,true)
      const footprint=[[-w/2,-d/2],[w/2,-d/2],[w/2,d/2],[-w/2,d/2]].map(([px,pz])=>({x:x+px*Math.cos(angle)+pz*Math.sin(angle),z:z-px*Math.sin(angle)+pz*Math.cos(angle)}))
      solids.push({id,minX:bound.min.x,maxX:bound.max.x,minZ:bound.min.z,maxZ:bound.max.z,base:bound.min.y,top:bound.max.y,footprint})
    }
    return value
  }
  const beam=(id:string,mat:THREE.Material,a:THREE.Vector3,b:THREE.Vector3,width:number,depth=width)=>{
    const delta=b.clone().sub(a),value=box(id,mat,width,delta.length(),depth,(a.x+b.x)/2,(a.y+b.y)/2,(a.z+b.z)/2)
    value.quaternion.setFromUnitVectors(UP,delta.normalize());return value
  }
  const fixture=(id:string,x:number,y:number,z:number,kind:AncoraLuzComplexo['kind'],floor=GROUND,angle=0)=>{
    box(`${id}-caixa`,metal,.72,.10,.32,x,y+.04,z,angle)
    box(`${id}-lente`,lampGlass,.62,.025,.25,x,y-.023,z,angle)
    lightAnchors.push({id,kind,position:[x,y-.06,z],target:[x,floor,z],color:'#ffe4ae',intensity:kind==='street'?220:75,distance:y-floor+(kind==='street'?16:7),angle:kind==='street'?1.1:.95})
  }
  const polygon=(id:string,points:readonly PontoComplexo[],y:number,mat:THREE.Material)=>{
    const shape=new THREE.Shape(points.map(p=>new THREE.Vector2(p.x,-p.z)))
    let geometry:THREE.BufferGeometry=new THREE.ShapeGeometry(shape)
    geometry.rotateX(-Math.PI/2)
    const position=geometry.getAttribute('position'),uv=geometry.getAttribute('uv')
    for(let i=0;i<position.count;i++)uv.setXY(i,position.getX(i)/4,position.getZ(i)/4)
    if(y>=.075&&y<=.4)geometry=clippedPaving(geometry,!/^(metro-|terminal-onibus-|onibus-|estacionamento-)/.test(id),renderingStreet?points:undefined)
    if(id.startsWith('estacionamento-')&&y>0&&y<.075)geometry=clippedPaving(geometry,false)
    const value=add(geometry,mat);value.name=id;value.position.y=y;value.castShadow=y>.4;return value
  }
  const ribbon=(id:string,points:readonly PontoComplexo[],width:number,y:number,mat:THREE.Material,endCap?:number)=>{
    if(points.length<2)return
    const extended=points.map(p=>({...p})),cap=endCap??(width>5?3:.85)
    for(const [index,neighbor] of [[0,1],[extended.length-1,extended.length-2]]){
      const p=extended[index],a=extended[neighbor],length=Math.hypot(p.x-a.x,p.z-a.z)||1
      p.x+=(p.x-a.x)/length*cap;p.z+=(p.z-a.z)/length*cap
    }
    points=extended
    if(id.startsWith('acesso-torcida-')){
      polygon(id,[...deslocarCaminhoComplexo(points,width/2),...deslocarCaminhoComplexo(points,-width/2).reverse()],y,mat)
      return
    }
    const strip:PontoComplexo[]=[]
    for(let i=0;i<points.length;i++){
      const a=points[Math.max(0,i-1)],b=points[Math.min(points.length-1,i+1)],len=Math.hypot(b.x-a.x,b.z-a.z)||1
      strip.push({x:points[i].x-(b.z-a.z)/len*width/2,z:points[i].z+(b.x-a.x)/len*width/2})
    }
    for(let i=points.length-1;i>=0;i--){
      const a=points[Math.max(0,i-1)],b=points[Math.min(points.length-1,i+1)],len=Math.hypot(b.x-a.x,b.z-a.z)||1
      strip.push({x:points[i].x+(b.z-a.z)/len*width/2,z:points[i].z-(b.x-a.x)/len*width/2})
    }
    polygon(id,strip,y,mat)
  }
  // The land beyond the club is an inhabited, landscaped neighbourhood. Dirt
  // belongs to the club's unfinished plots, not to every gap between city blocks.
  const surface=box('terreno',grass,1800,.24,2600,0,-.36,0)
  surface.castShadow=false
  const rawTerrain=path([[165,320],[464,150],[1050,169],[1355,333],[1350,703],[1000,875],[480,860],[218,616]])
  const clubGround=polygon('terreno-clube',rawTerrain,-.19,state.extras.asfalto?grass:dirt)
  if(!state.extras.asfalto){
    // An unbuilt plot is natural land, not a uniform beige board. World-space
    // colour varies across the real ground mesh; no image is enlarged, no
    // obstacle occupies a reserved purchase, and the pitch keeps its own stage.
    const original=clubGround.geometry,source=original.getAttribute('position'),index=original.getIndex()
    const points:number[]=[],normal:number[]=[],uv:number[]=[],colors:number[]=[]
    const earth=new THREE.Color('#968763'),growth=new THREE.Color('#687348'),shade=new THREE.Color()
    const vertex=(p:THREE.Vector3)=>{
      const patch=Math.sin(p.x*.041+Math.sin(p.z*.031)*1.9)+Math.cos(p.z*.058-p.x*.019)*.65+Math.sin((p.x+p.z)*.113)*.2
      const amount=THREE.MathUtils.smoothstep(patch,-1.45,1.4)
      shade.copy(earth).lerp(growth,amount)
      points.push(p.x,0,p.z);normal.push(0,1,0);uv.push(p.x/4,p.z/4);colors.push(shade.r,shade.g,shade.b)
    }
    const subdivide=(a:THREE.Vector3,b:THREE.Vector3,c:THREE.Vector3,depth:number)=>{
      if(!depth){vertex(a);vertex(b);vertex(c);return}
      const ab=a.clone().lerp(b,.5),bc=b.clone().lerp(c,.5),ca=c.clone().lerp(a,.5)
      subdivide(a,ab,ca,depth-1);subdivide(ab,b,bc,depth-1);subdivide(ca,bc,c,depth-1);subdivide(ab,bc,ca,depth-1)
    }
    for(let i=0;i<(index?.count??source.count);i+=3){
      const p=[0,1,2].map(j=>new THREE.Vector3().fromBufferAttribute(source,index?index.getX(i+j):i+j))
      subdivide(p[0],p[1],p[2],4)
    }
    clubGround.geometry=own(new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(points,3))
      .setAttribute('normal',new THREE.Float32BufferAttribute(normal,3)).setAttribute('uv',new THREE.Float32BufferAttribute(uv,2))
      .setAttribute('color',new THREE.Float32BufferAttribute(colors,3)))
    const natural=material('#ffffff',1);natural.vertexColors=true;natural.bumpMap=dirt.map;natural.bumpScale=.01
    clubGround.material=natural
  }else{
    // The completed club keeps broad natural colour in its residual lawns.
    // Sample in world metres rather than repeating a large stain every 4 m;
    // paving, plots and the existing ground triangles stay exactly in place.
    const size=512,extent=1024,pixels=new Uint8Array(size*size*4)
    const shade=new THREE.Color('#5d704b'),growth=new THREE.Color('#728054'),color=new THREE.Color()
    const smoothNoise=(x:number,z:number,scale:number)=>{
      const px=x/scale,pz=z/scale,ix=Math.floor(px),iz=Math.floor(pz)
      const fx=px-ix,fz=pz-iz,u=fx*fx*(3-2*fx),v=fz*fz*(3-2*fz)
      const a=hash(ix,iz)*(1-u)+hash(ix+1,iz)*u
      const b=hash(ix,iz+1)*(1-u)+hash(ix+1,iz+1)*u
      return a*(1-v)+b*v
    }
    for(let z=0;z<size;z++)for(let x=0;x<size;x++){
      const wx=((x+.5)/size-.5)*extent,wz=((z+.5)/size-.5)*extent
      // Different scales and offsets break any visible square-grid rhythm.
      const patch=smoothNoise(wx+91,wz-37,137)*.62+smoothNoise(wx-63,wz+129,59)*.28+smoothNoise(wx+17,wz+53,27)*.10
      color.copy(shade).lerp(growth,THREE.MathUtils.smoothstep(patch,.12,.88))
      const at=(z*size+x)*4
      pixels[at]=Math.round(color.r*255);pixels[at+1]=Math.round(color.g*255);pixels[at+2]=Math.round(color.b*255);pixels[at+3]=255
    }
    const lawn=new THREE.DataTexture(pixels,size,size)
    lawn.colorSpace=THREE.LinearSRGBColorSpace
    lawn.wrapS=lawn.wrapT=THREE.ClampToEdgeWrapping
    lawn.offset.set(.5,.5);lawn.repeat.set(4/extent,4/extent)
    lawn.magFilter=THREE.LinearFilter;lawn.minFilter=THREE.LinearMipmapLinearFilter
    lawn.generateMipmaps=true;lawn.needsUpdate=true;textures.add(lawn)
    const natural=material('#ffffff',1,0,lawn)
    natural.bumpMap=grass.map;natural.bumpScale=.008
    clubGround.material=natural
  }
  const roadOut=PLANTA_COMPLEXO.routes.roadOut.points,roadBack=[...PLANTA_COMPLEXO.routes.roadBack.points].reverse()
  const peripheral=roadOut.map((p,i)=>({x:(p.x+roadBack[i].x)/2,z:(p.z+roadBack[i].z)/2}))
  const offsetPath=(points:readonly PontoComplexo[],offset:number)=>points.map((p,i)=>{
    const a=points[Math.max(0,i-1)],b=points[Math.min(points.length-1,i+1)],length=Math.hypot(b.x-a.x,b.z-a.z)||1
    return {x:p.x-(b.z-a.z)/length*offset,z:p.z+(b.x-a.x)/length*offset}
  })
  const streetNetwork:(RuaComplexo&{clearance:number})[]=[]
  const street=(id:string,points:readonly PontoComplexo[],width:number,walk=2.8)=>{
    streetNetwork.push({id:/^(bairro|parque)-/.test(id)?`${id}-${streetNetwork.length}`:id,points:[...points],width,walk,clearance:width/2+walk})
  }
  street('via-publica',peripheral,10)
  const north=transport.station.avenue
  street('avenida-norte',north,transport.station.avenueWidth,3.5)
  const east=path([[1640,331],[1521,451],[1475,592],[1410,720]])
  street('via-leste',east,11)
  const west=path([[-65,269],[150,119],[295,48],[354,-65]])
  street('via-oeste',west,11)
  ribbon('calcada-registrada',PLANTA_COMPLEXO.routes.sidewalk.points,3.9,GROUND,paving)
  const markings=(points:readonly PontoComplexo[])=>{
    for(let i=1;i<points.length;i++){
      const a=points[i-1],b=points[i],length=Math.hypot(b.x-a.x,b.z-a.z),yaw=-Math.atan2(b.z-a.z,b.x-a.x)
      for(let d=3;d<length-2;d+=8){const t=d/length;box('faixa-viaria',white,3,.015,.11,a.x+(b.x-a.x)*t,.047,a.z+(b.z-a.z)*t,yaw)}
    }
  }
  markings(peripheral);markings(north);markings(east);markings(west)

  const routeSurface=state.extras.asfalto?paving:dirt
  // These public paths remain at street level at every stadium stage.
  // They share the physical gate contract, not the old office driveway.
  for(const [side,points] of Object.entries(fanPaths))ribbon(`acesso-torcida-${side}`,points,4.4,GROUND,routeSurface)
  for(const id of ['entrance','entranceBare','shop','food','beer','hotel','station']){
    if(id==='entrance'&&!state.extras.asfalto||id==='entranceBare'&&state.extras.asfalto)continue
    const key=({shop:'loja',food:'praca',beer:'chopp',hotel:'hotel',station:'estacao'} as Record<string,string>)[id]
    if(key&&!state.extras[key])continue
    ribbon(`acesso-${id}`,PLANTA_COMPLEXO.routes[id].points,id.startsWith('entrance')?5.5:3.4,GROUND,routeSurface)
  }
  for(const [id,door] of Object.entries(PLANTA_COMPLEXO.doors))if(state.extras[id]){
    ribbon(`chegada-porta-${id}`,[door.approach,door.threshold],2.6,GROUND,routeSurface)
    ribbon(`soleira-${id}`,[door.threshold,door.inside],2.6,GROUND,paving)
  }
  if(state.extras.asfalto){
    const plaza=path([[578,604],[916,605],[916,770],[657,798],[553,730]])
    polygon('praca-acesso-pavimentada',plaza,.095,paving)
    // Walking access uses the destination paths below. The old decorative
    // ring cut through the hotel, gardens and businesses despite looking
    // continuous on the aerial illustration.
    street('rua-interna-oeste',path([[275,673],[330,618],[346,555],[325,466],[347,364],[411,283]]),5.8,1.6)
    street('rua-interna-leste',path([[1293,322],[1345,421],[1370,536],[1343,633],[1249,718]]),5.8,1.6)
  }

  const crownShape=(detail:number,variant:number)=>{
    const geometry=own(new THREE.IcosahedronGeometry(1,detail)),position=geometry.getAttribute('position'),normal=geometry.getAttribute('normal')
    const colors=new Float32Array(position.count*3)
    for(let i=0;i<position.count;i++){
      const x=position.getX(i),y=position.getY(i),z=position.getZ(i)
      // Never expand the existing crown envelope into a reserved path or lot.
      // Smooth shared vertex normals and several silhouettes remove the rigid
      // crystal-like faces without multiplying triangles across the forest.
      const radius=.93+.035*Math.sin(x*8+variant*2)*Math.cos(z*7-variant)+.03*Math.sin(y*9+variant)
      position.setXYZ(i,x*radius,y*radius,z*radius)
      const length=Math.hypot(x,y,z)||1;normal.setXYZ(i,x/length,y/length,z/length)
      const shade=.82+.15*(y+1)/2+.055*Math.sin(x*11+z*7+variant)
      colors.set([shade,shade,shade],i*3)
    }
    geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));return geometry
  }
  const canopyShapes=Array.from({length:4},(_,i)=>crownShape(1,i))
  const canopyGeometry=canopyShapes[0]
  const trunkGeometry=own(new THREE.CylinderGeometry(.20,.34,1,6))
  const plant=(p:PontoComplexo,height=5.5,palm=false,sparse=false,base=-.24)=>{
    if(protectedPath(p,2.5))return
    const trunk=add(trunkGeometry,wood);trunk.scale.y=height;trunk.position.set(p.x,base+height/2,p.z)
    if(palm){
      for(let i=0;i<7;i++){
        const angle=i*Math.PI*2/7,tip=new THREE.Vector3(p.x+Math.cos(angle)*3.8,base+height-.9,p.z+Math.sin(angle)*3.8)
        const hub=new THREE.Vector3(p.x,base+height+.3,p.z)
        const mid=hub.clone().lerp(tip,.5);mid.y+=.9
        const side=new THREE.Vector3(-Math.sin(angle)*.42,0,Math.cos(angle)*.42)
        const vertices=[hub.clone(),mid.clone().add(side),tip.clone(),mid.clone().sub(side)]
        const g=new THREE.BufferGeometry().setFromPoints(vertices);g.setIndex([0,1,2,0,2,3]);g.computeVertexNormals()
        const uv=new Float32Array([0,0,1,0,1,1,0,1]);g.setAttribute('uv',new THREE.BufferAttribute(uv,2))
        const frond=add(g,i%2?leaf:lightLeaf);frond.material.side=THREE.DoubleSide
      }
    }else for(let i=0;i<(sparse?2:3);i++){
      const crown=add(canopyShapes[(Math.floor(hash(p.x,p.z)*4)+i)%4],i%2?lightLeaf:leaf)
      crown.position.set(p.x+Math.cos(i*2.4)*.9,base+height-.8+i*.35,p.z+Math.sin(i*2.4)*.8)
      crown.scale.set(2.0+i*.18,1.9+i*.1,2.2);crown.rotation.y=i*1.2
    }
  }
  const roadsideTrees=(points:readonly PontoComplexo[],offset:number,spacing:number)=>{
    let remainder=0
    for(let i=1;i<points.length;i++){
      const a=points[i-1],b=points[i],length=Math.hypot(b.x-a.x,b.z-a.z),dx=(b.x-a.x)/length,dz=(b.z-a.z)/length
      for(let d=remainder;d<length;d+=spacing){const p={x:a.x+dx*d-dz*offset,z:a.z+dz*d+dx*offset};if(!reserved(p)&&clearOfConstruction(p,4)&&!nearStreet(p,1.5)&&!nearParcel(p,2))plant(p,4.8+hash(p.x,p.z)*2,false)}
      remainder=(remainder-length)%spacing;if(remainder<0)remainder+=spacing
    }
  }

  const localPoint=(cx:number,cz:number,x:number,z:number,rotation:number)=>({x:cx+x*Math.cos(rotation)+z*Math.sin(rotation),z:cz-x*Math.sin(rotation)+z*Math.cos(rotation)})
  const table=(p:PontoComplexo,y:number,umbrella=false)=>{
    box('mesa',wood,1.45,.13,1.45,p.x,y+1,p.z)
    box('pe-mesa',metal,.17,.93,.17,p.x,y+.47,p.z)
    for(const side of [-1,1]){
      box('banco',wood,.44,.12,1.35,p.x+side*1.03,y+.51,p.z)
      box('pe-banco',dark,.15,.45,.16,p.x+side*1.03,y+.25,p.z-.48)
      box('pe-banco',dark,.15,.45,.16,p.x+side*1.03,y+.25,p.z+.48)
    }
    if(umbrella){
      box('haste-sombreiro',metal,.075,2.45,.075,p.x,y+1.225,p.z)
      const top=add(new THREE.ConeGeometry(1.82,.62,4,1,true),white);top.rotation.y=Math.PI/4;top.position.set(p.x,y+2.49,p.z)
    }
  }
  const roofFurniture=(polygonPoints:readonly PontoComplexo[],y:number,step=6)=>{
    const minX=Math.min(...polygonPoints.map(p=>p.x)),maxX=Math.max(...polygonPoints.map(p=>p.x))
    const minZ=Math.min(...polygonPoints.map(p=>p.z)),maxZ=Math.max(...polygonPoints.map(p=>p.z))
    for(let x=minX+3;x<maxX-2;x+=step)for(let z=minZ+3;z<maxZ-2;z+=step){
      const p={x,z};if(inside(p,polygonPoints)&&polygonPoints.every((b,i)=>distanceToSegment(p,polygonPoints[(i+polygonPoints.length-1)%polygonPoints.length],b)>2.6))table(p,y,true)
    }
  }
  const nearestDoorEdge=(points:readonly PontoComplexo[],door:PortaComplexo)=>{
    let best=0,distance=Infinity
    points.forEach((a,i)=>{const d=distanceToSegment(door.threshold,a,points[(i+1)%points.length]);if(d<distance){distance=d;best=i}})
    return best
  }
  const building=(id:string,points:readonly PontoComplexo[],height:number,door:PortaComplexo|undefined,storeys=1)=>{
    polygon(`${id}-piso`,points,GROUND,paving)
    polygon(`${id}-laje`,points,GROUND+height,concrete)
    const doorEdge=door?nearestDoorEdge(points,door):-1
    const outwardSign=points.reduce((sum,a,i)=>{const b=points[(i+1)%points.length];return sum+a.x*b.z-b.x*a.z},0)>0?-1:1
    for(let i=0;i<points.length;i++){
      const a=points[i],b=points[(i+1)%points.length],length=Math.hypot(b.x-a.x,b.z-a.z),dx=(b.x-a.x)/length,dz=(b.z-a.z)/length,yaw=-Math.atan2(dz,dx)
      const at=(d:number)=>({x:a.x+dx*d,z:a.z+dz*d})
      const segment=(from:number,to:number,base:number,h:number,mat:THREE.Material,solid=true)=>{if(to-from<.05)return;const p=at((from+to)/2);box(`${id}-parede`,mat,to-from,h,.28,p.x,base+h/2,p.z,yaw,solid)}
      if(i===doorEdge&&door){
        const center=Math.max(2,Math.min(length-2,(door.threshold.x-a.x)*dx+(door.threshold.z-a.z)*dz)),half=2.2
        segment(0,center-half,GROUND,3.1,concrete);segment(center+half,length,GROUND,3.1,concrete)
        segment(0,length,GROUND+3.1,Math.max(.18,height-3.1),concrete)
        const p=at(center);doors[id]={...door,threshold:p,x:p.x,z:p.z}
        const canopy=box(`${id}-marquise`,concrete,6,.3,2.4,p.x,GROUND+3.12,p.z,yaw)
        canopy.castShadow=true
        fixture(`${id}-luminaria-entrada`,p.x,GROUND+2.94,p.z,'entrance',GROUND,yaw)
      }else segment(0,length,GROUND,height,concrete)
      const bays=Math.max(1,Math.floor(length/3.5)),bay=length/bays
      for(let floor=0;floor<storeys;floor++)for(let j=0;j<bays;j++){
        const d=(j+.5)*bay,p=at(d)
        if(i===doorEdge&&door&&floor===0&&Math.hypot(p.x-door.threshold.x,p.z-door.threshold.z)<3.5)continue
        const outward=.165*outwardSign
        const wy=GROUND+(floor===0?1.72:4+(floor-1)*3+1.5)
        box(`${id}-vitrine`,floor%3?glass:warmGlass,bay-.54,floor===0?2.6:2.12,.042,p.x-dz*outward,wy,p.z+dx*outward,yaw)
        box(`${id}-montante`,white,.16,floor===0?3.4:2.7,.28,p.x-dx*bay/2-dz*.19*outwardSign,wy,p.z-dz*bay/2+dx*.19*outwardSign,yaw)
      }
      for(let floor=1;floor<storeys;floor++)segment(0,length,GROUND+4+(floor-1)*3,.18,white,false)
      segment(0,length,GROUND+height,.5,white,false)
    }
    return points
  }
  const rectangles=(cx:number,cz:number,w:number,d:number,angle:number)=>[[-w/2,-d/2],[w/2,-d/2],[w/2,d/2],[-w/2,d/2]].map(([x,z])=>localPoint(cx,cz,x,z,angle))
  const entered=new Set<string>()

  if(state.extras.loja){
    const lot=PLANTA_COMPLEXO.lots.loja;entered.add('loja')
    building('loja',lot.footprint,7.3,lot.door,2)
    const p=lot.center
    for(let i=-1;i<=1;i++)box('loja-expositor',wood,1.2,1.45,4,p.x+i*4,.16+.725,p.z-2,lot.heading,true)
    box('loja-balcao',wood,5.5,1.1,.9,p.x-1,.71,p.z-8,lot.heading,true)
    for(let i=0;i<3;i++)box('loja-climatizacao',white,2.2,.65,1.45,p.x-2,7.82,p.z-5+i*5,lot.heading)
  }
  if(state.extras.chopp){
    const portal=PLANTA_COMPLEXO.doors.chopp;entered.add('chopp')
    // The registered bar threshold lies behind its open front patio. A solid
    // extrusion of the legacy navigation polygon would wall up that patio.
    const forward={x:Math.sin(portal.heading),z:Math.cos(portal.heading)}
    const center=localPoint(portal.x-forward.x*6.4,portal.z-forward.z*6.4,-9,0,portal.heading)
    const points=rectangles(center.x,center.z,31,12.8,portal.heading)
    building('chopp',points,4.5,portal)
    const terrace=PLANTA_COMPLEXO.lots.chopp.footprint
    polygon('chopp-terraco',terrace,GROUND,paving)
    for(let i=-2;i<=1;i++){
      const p=localPoint(portal.x,portal.z,i*5.5-8,7.1,portal.heading)
      if(inside(p,terrace)&&!protectedPath(p,3))table(p,GROUND,true)
    }
    const counter=localPoint(center.x,center.z,-4,-3,portal.heading)
    box('chopp-balcao',wood,14,1.15,1.1,counter.x,.735,counter.z,portal.heading,true)
    for(let i=0;i<4;i++){const p=localPoint(center.x,center.z,-11+i*6,1.5,portal.heading);table(p,GROUND)}
  }
  if(state.extras.hotel){
    entered.add('hotel')
    const footprint=PLANTA_COMPLEXO.lots.hotel.footprint
    const a=footprint[5],b=footprint[4],length=Math.hypot(b.x-a.x,b.z-a.z),dx=(b.x-a.x)/length,dz=(b.z-a.z)/length
    const hotel=[a,b,{x:b.x+dz*33,z:b.z-dx*33},{x:a.x+dz*33,z:a.z-dx*33}]
    building('hotel',hotel,22,undefined,7)
    const portal=PLANTA_COMPLEXO.doors.hotel,heading=portal.heading
    const annexCenter=localPoint(portal.x,portal.z,0,-4.8,heading)
    const annex=rectangles(annexCenter.x,annexCenter.z,12,9.6,heading)
    building('hotel-recepcao',annex,4,portal)
    doors.hotel={...portal}
    const reception=localPoint(annexCenter.x,annexCenter.z,-3,-2.3,heading)
    box('hotel-balcao-recepcao',wood,4,1.15,.85,reception.x,.735,reception.z,heading,true)
    const poolCenter={x:(a.x+b.x)/2+dz*21,z:(a.z+b.z)/2-dx*21},yaw=-Math.atan2(dz,dx)
    box('hotel-piscina-borda',white,17,.35,7.6,poolCenter.x,22.35,poolCenter.z,yaw)
    box('hotel-piscina-agua',water,15.8,.06,6.3,poolCenter.x,22.56,poolCenter.z,yaw)
    for(let i=0;i<5;i++){
      const p={x:poolCenter.x+dx*(i-2)*3.1-dz*5.6,z:poolCenter.z+dz*(i-2)*3.1+dx*5.6}
      box('hotel-espreguicadeira',white,1.8,.32,.65,p.x,22.4,p.z,yaw)
    }
    const pavilion={x:a.x+dx*10+dz*10,z:a.z+dz*10-dx*10}
    box('hotel-pavilhao-cobertura',glass,12,2.65,5,pavilion.x,23.53,pavilion.z,yaw)
    box('hotel-pavilhao-laje',white,12.6,.24,5.6,pavilion.x,24.98,pavilion.z,yaw)
  }
  if(state.extras.praca){
    const lot=PLANTA_COMPLEXO.lots.praca;entered.add('praca')
    const endpoint=PLANTA_COMPLEXO.routes.food.points.at(-1)!
    const portal:PortaComplexo={id:'praca',approach:endpoint,threshold:endpoint,inside:lot.center,stay:30,heading:lot.heading,x:endpoint.x,z:endpoint.z}
    building('praca',lot.footprint,5.4,portal)
    roofFurniture(lot.footprint,5.57,7.5)
    for(const t of [.22,.5,.75]){
      const a=lot.footprint[0],b=lot.footprint[2],p={x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t}
      box('praca-quiosque',wood,6,2.8,4,p.x,7.0,p.z,lot.heading)
      box('praca-quiosque-telhado',roof,6.7,.28,4.7,p.x,8.53,p.z,lot.heading)
    }
  }

  // Static transportation uses the exact same metric plan as moving actors.
  // In particular no parked train is baked into these material batches.
  for(const surface of transport.surfaces){
    const {polygon:points,y,kind,id}=surface
    if(kind==='platform'||kind==='stair'){
      const a=points[0],b=points[1],d=points[3],base=surface.base??y-.18
      const center={x:(a.x+points[2].x)/2,z:(a.z+points[2].z)/2}
      box(id,kind==='platform'?paving:concrete,Math.hypot(b.x-a.x,b.z-a.z),Math.max(.02,y-base),Math.hypot(d.x-a.x,d.z-a.z),center.x,(base+y)/2,center.z,-Math.atan2(b.z-a.z,b.x-a.x),true)
    }else polygon(id,points,y,kind==='road'?(id.startsWith('estacionamento')&&!transport.parking.paved?dirt:asphalt):routeSurface)
  }
  // The waiting shelter sits behind the bus pavement, with no post or bench
  // in the opened door or in the route to the front gate.
  const bus=transport.bus
  box('onibus-abrigo-cobertura',metal,8,.16,2.4,bus.stop.x-6,3.05,bus.stop.z-5)
  for(const x of [-9,-3])box('onibus-abrigo-poste',metal,.14,2.9,.14,bus.stop.x+x,1.61,bus.stop.z-5.9,0,true)
  box('onibus-banco',wood,5.5,.12,.6,bus.stop.x-6,.61,bus.stop.z-5.5,0,true)
  for(const x of [-8,-4])box('onibus-banco-pe',metal,.08,.48,.4,bus.stop.x+x,.34,bus.stop.z-5.5)
  box('onibus-ponto-poste',metal,.07,2.7,.07,bus.stop.x+3,1.51,bus.stop.z-3.2,0,true)
  box('onibus-ponto-placa',white,.55,.55,.09,bus.stop.x+3,2.7,bus.stop.z-3.2)
  polygon('onibus-plataforma', [{x:bus.stop.x-11,z:bus.stop.z-7},{x:bus.stop.x+5,z:bus.stop.z-7},{x:bus.stop.x+5,z:bus.stop.z-1.25},{x:bus.stop.x-4,z:bus.stop.z-1.25},{x:bus.stop.x-4,z:bus.stop.z-3.5},{x:bus.stop.x-11,z:bus.stop.z-3.5}],GROUND,paving)
  const origin=bus.origin
  polygon('onibus-plataforma-bairro',[{x:origin.x-4,z:origin.z-8},{x:origin.x+4,z:origin.z-8},{x:origin.x+4,z:origin.z-1.25},{x:origin.x-4,z:origin.z-1.25}],GROUND,paving)
  box('onibus-abrigo-bairro',metal,6,.16,2.4,origin.x,3.05,origin.z-5.5)
  for(const side of [-1,1])box('onibus-abrigo-bairro-poste',metal,.14,2.9,.14,origin.x+side*2.7,1.61,origin.z-6.4,0,true)
  box('onibus-banco-bairro',wood,4.6,.12,.6,origin.x,.61,origin.z-6,0,true)
  for(const side of [-1,1])box('onibus-banco-bairro-pe',metal,.08,.48,.4,origin.x+side*1.8,.34,origin.z-6)
  box('onibus-ponto-bairro',white,.55,.55,.09,origin.x+3,2.7,origin.z-3.2)
  fixture('onibus-luminaria-estadio',bus.stop.x-6,2.94,bus.stop.z-5,'bus-stop')
  fixture('onibus-luminaria-bairro',origin.x,2.94,origin.z-5.5,'bus-stop')

  if(state.extras.estacao){
    entered.add('estacao')
    const station=transport.station,{point,length,yaw,railExtent}=station
    const center=point(0,0),stationBlue=material('#254a69',.52,.3)
    // Só a estação alarga para receber plataformas. Fora dela, duas vias
    // férreas continuam além do bairro, sem parecer avenida ou rua sem saída.
    box('estacao-viaduto',concrete,railExtent*2,.72,station.railWidth,center.x,7.36,center.z,yaw,true)
    box('estacao-viaduto-plataformas',concrete,length,.72,19,center.x,7.36,center.z,yaw,true)
    for(const z of [-2.4,-1,1,2.4]){const p=point(0,z);box('estacao-trilho',metal,railExtent*2,.10,.09,p.x,7.85,p.z,yaw)}
    // Dormentes distantes usam menos amostras; a faixa próxima mantém passo
    // de1.4m. Trilho, apoio e reserva territorial seguem contínuos em3200m.
    for(let x=-railExtent+1;x<railExtent;x+=Math.abs(x)<330?1.4:4.2){const p=point(x,0);box('estacao-dormente',wood,.2,.08,5.1,p.x,7.76,p.z,yaw)}
    const protectedGroundPath=(p:PontoComplexo,r:number)=>allRoutes.some(route=>route.points.some((b,i)=>i>0&&Math.min('y' in b?Number(b.y):GROUND,'y' in route.points[i-1]?Number((route.points[i-1] as PontoComplexo & {y:number}).y):GROUND)<2&&distanceToSegment(p,route.points[i-1],b)<r))
    const clearStreet=(p:PontoComplexo,margin=0)=>streetNetwork.every(street=>street.points.every((b,i)=>!i||distanceToSegment(p,street.points[i-1],b)>street.clearance+margin))
    for(let x=-railExtent+9;x<railExtent-4;x+=24){
      const inStation=Math.abs(x)<length/2-3
      for(const z of inStation?[-7.1,7.1]:[-2.9,2.9]){
        const p=point(x,z)
        if(!protectedGroundPath(p,2.4)&&clearStreet(p,1)){box('estacao-pilar',concrete,.8,7.0,.8,p.x,3.66,p.z,yaw,true);box('estacao-pilar-base',concrete,1.4,.4,1.4,p.x,-.04,p.z,yaw,true)}
      }
      if(inStation)for(const z of [-7.1,7.1]){const p=point(x,z);if(!protectedPath(p,.42))box('estacao-coluna-cobertura',stationBlue,.18,4.5,.18,p.x,10.56,p.z,yaw,true)}
    }
    for(const side of [-1,1]){
      const z=side<0?-6.8:8.1,p=point(0,z)
      box('estacao-cobertura',stationBlue,length,.18,side<0?5.9:2.4,p.x,12.92,p.z,yaw)
      for(let x=-length/2+5;x<length/2;x+=9){const lamp=point(x,z);fixture(`estacao-luminaria-${side}-${x}`,lamp.x,12.77,lamp.z,'station',station.floor,yaw)}
      for(const edge of [-1,1]){const trim=point(0,z+edge*(side<0?2.92:1.17));box('estacao-cobertura-faixa',white,length,.11,.06,trim.x,12.84,trim.z,yaw)}
      const gaps=side>0?station.accesses.map(access=>[access.platformX-2.8,access.platformX+2.8]).sort((a,b)=>a[0]-b[0]):[]
      const intervals:number[][]=[];let cursor=-length/2
      for(const [from,to] of gaps){intervals.push([cursor,from]);cursor=to}intervals.push([cursor,length/2])
      for(const [start,end] of intervals){
        const a=point(start,side*9.58),b=point(end,side*9.58)
        beam('estacao-guarda-plataforma',stationBlue,new THREE.Vector3(a.x,9.43,a.z),new THREE.Vector3(b.x,9.43,b.z),.06)
        for(let x=start+.3;x<end-.2;x+=3){const p=point(x,side*9.58);box('estacao-guarda-plataforma-poste',stationBlue,.06,1.05,.06,p.x,8.905,p.z,yaw)}
      }
    }
    for(const access of station.accesses){
      const [a,b]=access.bridge.points,span=Math.hypot(b.x-a.x,b.z-a.z),ux=(b.x-a.x)/span,uz=(b.z-a.z)/span,nx=-uz,nz=ux
      const angle=-Math.atan2(uz,ux),middle={x:(a.x+b.x)/2,z:(a.z+b.z)/2}
      const roofY=station.floor+2.75
      box(`estacao-passarela-cobertura-${access.id}`,stationBlue,span,.14,4.45,middle.x,roofY,middle.z,angle)
      for(let distance=4;distance<span-2;distance+=9)fixture(`passarela-luminaria-${access.id}-${distance}`,a.x+ux*distance,roofY-.12,a.z+uz*distance,'station',station.floor,angle)
      for(const side of [-1,1]){
        const offset=side*2.03
        beam('estacao-passarela-guarda',stationBlue,new THREE.Vector3(a.x+nx*offset,station.floor+1.04,a.z+nz*offset),new THREE.Vector3(b.x+nx*offset,station.floor+1.04,b.z+nz*offset),.065)
        const trim={x:middle.x+nx*side*2.20,z:middle.z+nz*side*2.20}
        box('estacao-passarela-faixa-clara',white,span,.11,.06,trim.x,roofY-.07,trim.z,angle)
        for(let distance=3;distance<span-2;distance+=4){
          const p={x:a.x+ux*distance+nx*offset,z:a.z+uz*distance+nz*offset}
          box('estacao-passarela-montante',stationBlue,.06,2.68,.06,p.x,station.floor+1.34,p.z,angle,true)
        }
      }
      // Pórticos deixam toda a largura das vias livre, inclusive seus passeios.
      for(let distance=4;distance<span-3;distance+=12){
        const p={x:a.x+ux*distance,z:a.z+uz*distance}
        if(!clearStreet(p,3))continue
        for(const side of [-1,1]){const q={x:p.x+nx*side*1.85,z:p.z+nz*side*1.85};if(clearStreet(q,.5)&&!protectedGroundPath(q,.7)){box('estacao-passarela-pilar',concrete,.48,station.floor-.5,.48,q.x,(GROUND+station.floor-.35)/2,q.z,angle,true);box('estacao-passarela-pilar-base',concrete,1,.4,1,q.x,-.04,q.z,angle,true)}}
        beam('estacao-passarela-travessa',concrete,new THREE.Vector3(p.x-nx*2.05,station.floor-.4,p.z-nz*2.05),new THREE.Vector3(p.x+nx*2.05,station.floor-.4,p.z+nz*2.05),.35,.42)
      }
      const first=access.stair.points[0],last=access.stair.points.at(-1)!,stairLength=Math.hypot(last.x-first.x,last.z-first.z),sx=(last.x-first.x)/stairLength,sz=(last.z-first.z)/stairLength
      for(const side of [-1,1]){
        const offset=side*1.72,normal={x:-sz*offset,z:sx*offset}
        for(let i=1;i<access.stair.points.length;i++){
          const a=access.stair.points[i-1],b=access.stair.points[i]
          if(Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z)<.01)continue
          beam('estacao-corrimao',stationBlue,new THREE.Vector3(a.x+normal.x,a.y+1.0,a.z+normal.z),new THREE.Vector3(b.x+normal.x,b.y+1.0,b.z+normal.z),.06)
        }
        for(let distance=1.8;distance<stairLength-.1;distance+=2){
          const p={x:first.x+sx*distance,z:first.z+sz*distance},surface=access.stair.surfaces.find(surface=>inside(p,surface.polygon))
          const floor=surface?.y??station.floor
          box('estacao-corrimao-poste',stationBlue,.06,1.0,.06,p.x+normal.x,floor+.5,p.z+normal.z,0,true)
        }
      }
      // O pé chega a uma praça, com espaço para sair do eixo antes de seguir
      // o passeio segregado até o portão de visitantes.
      const foot=access.walk[0],exit=access.walk[1],plaza=[{x:foot.x-3,z:foot.z-2},{x:foot.x+3,z:foot.z-2},{x:exit.x+3,z:exit.z+3},{x:exit.x-3,z:exit.z+3}]
      polygon(`metro-praca-${access.id}`,plaza,GROUND,paving)
    }
  }

  if(state.extras.estac){
    entered.add('estac')
    for(const lot of transport.parkingPlants.filter(lot=>lot.stage<=transport.parking.stage)){
      polygon(`estacionamento-${lot.id}`,lot.polygon,transport.parking.floor,state.extras.asfalto?asphalt:dirt)
      for(const slot of lot.slots){
        const {center,heading,width,length}=slot
        for(const side of [-1,1]){
          const p=localPoint(center.x,center.z,side*width/2,0,heading)
          box('linha-vaga',white,.07,.012,length,p.x,transport.parking.floor+.012,p.z,heading)
        }
        const end=localPoint(center.x,center.z,0,length/2,heading)
        box('linha-vaga-fundo',white,width,.012,.07,end.x,transport.parking.floor+.012,end.z,heading)
      }
    }
  }

  // Gardens follow the registered island footprints; none creates a shortcut
  // through a planted bed. Public roadside trees exist even in the bare stage.
  if(state.extras.asfalto){
    const fountain=PLANTA_COMPLEXO.footprints.fonte
    const fx=fountain.reduce((s,p)=>s+p.x,0)/fountain.length,fz=fountain.reduce((s,p)=>s+p.z,0)/fountain.length
    box('fonte-bacia',concrete,28.2,.34,12.8,fx,.31,fz,0,true)
    box('fonte-agua',water,26.7,.05,11.3,fx,.505,fz)
    for(const side of [-1,1])box('fonte-borda',white,28.5,.23,.34,fx,.58,fz+side*6.5)
    for(const side of [-1,1])box('fonte-borda',white,.34,.23,12.8,fx+side*14.1,.58,fz)
    for(let i=-2;i<=2;i++){
      box('fonte-bico',metal,.18,.24,.18,fx+i*4.8,.69,fz)
      const jet=add(new THREE.CylinderGeometry(.035,.07,1.2,5),water)
      jet.position.set(fx+i*4.8,1.3,fz)
    }
    for(const id of ['jardim-acesso-hotel','canteiro-central','canteiro-direito','canteiro-esquerdo','canteiro-calcada-leste']){
      if(id==='jardim-acesso-hotel'&&!state.extras.hotel)continue
      const points=PLANTA_COMPLEXO.footprints[id]
      if(!points)continue
      polygon(id,points,.24,grass)
      for(let i=0;i<points.length;i++){
        const a=points[i],b=points[(i+1)%points.length],p={x:(a.x+b.x)/2,z:(a.z+b.z)/2},length=Math.hypot(b.x-a.x,b.z-a.z)
        box('borda-canteiro',concrete,length,.26,.18,p.x,.16,p.z,-Math.atan2(b.z-a.z,b.x-a.x),true)
      }
      const cx=points.reduce((s,p)=>s+p.x,0)/points.length,cz=points.reduce((s,p)=>s+p.z,0)/points.length
      plant({x:cx,z:cz},6.2,true,false,.24)
      if(id==='canteiro-central')for(const dz of [-11,-5.5,5.5,11])plant({x:cx,z:cz+dz},6.8,true,false,.24)
      for(let i=0;i<points.length;i++){
        const p={x:cx+(points[i].x-cx)*.65,z:cz+(points[i].z-cz)*.65}
        if(!protectedPath(p,2.8)){const shrub=add(canopyGeometry,i%2?leaf:flower);shrub.position.set(p.x,.61,p.z);shrub.scale.set(1.4,.57,1.3)}
      }
    }
    const forecourt=path([[532,640],[598,691],[605,752],[929,741],[988,665],[1043,598]])
    for(let i=0;i<forecourt.length;i++){
      const p=forecourt[i]
      // This is the purchased forecourt's own planting. Its plaza reservation
      // excludes city infill, not the palms that belong to the finished garden.
      const forecourtReserved=Math.abs(p.x)<118&&p.z>-105&&p.z<119||registeredLots.some(lot=>inside(p,lot.footprint))||inside(p,arena)||protectedPath(p)
      const trunkClear=parkingLots.every(points=>!inside(p,points)&&points.every((b,j)=>distanceToSegment(p,points[(j+points.length-1)%points.length],b)>.5))
      if(!forecourtReserved&&trunkClear)plant(p,7.2,true)
      for(const side of [-1,1]){
        const q={x:p.x+side*3.8,z:p.z}
        const clearParking=parkingLots.every(points=>!inside(q,points)&&points.every((b,j)=>distanceToSegment(q,points[(j+points.length-1)%points.length],b)>.95))
        if(!protectedPath(q,3)&&clearParking){const cypress=add(new THREE.ConeGeometry(.85,4.7,7),leaf);cypress.position.set(q.x,2.6,q.z)}
      }
    }
  }

  // The original frame already contains residential streets. Extend those
  // blocks beyond the frame instead of surrounding the zoom with a flat colour.
  const publicStreets=[peripheral,north,east,west]
  let ruasIdx:ReturnType<typeof indiceTrechos>|undefined
  const cityFree=(p:PontoComplexo,margin=9)=>!inside(p,rawTerrain)&&!reserved(p)&&!protectedPath(p,margin)&&clearOfConstruction(p,margin)&&!(ruasIdx??=indiceTrechos(publicStreets.flatMap((points,k)=>points.slice(1).map((b,i)=>[points[i],b,k] as Trecho))))(p,margin,d=>d<margin)
  const windowPanel=(w:number,h:number,x:number,y:number,z:number,angle=0)=>{
    const choice=hash(x+y*.7,z),value=add(new THREE.PlaneGeometry(w,h),choice<.32?glass:choice<.82?cityWarm:cityCool)
    value.position.set(x,y,z);value.rotation.y=angle;value.castShadow=false
  }
  // Typologies visible in the reference's northern blocks: low houses,
  // terracotta-roofed townhouses, small flat-roof flats, and occasional taller
  // residential buildings. They are city context, never purchasable club lots.
  let detailedHomes=0
  const residence=(x:number,z:number,variant:number,angle=0,distant=false)=>{
    const floors=variant===0?1:variant===1?2:variant===2?4:6
    const h=3.0*floors+.7,w=variant===3?9.0:variant===2?10.8:9.0+hash(x,z)*2.0,d=variant>1?12.1:10.1
    const center=(lx:number,lz:number)=>localPoint(x,z,lx,lz,angle)
    box('bairro-residencia',variant%2?white:concrete,w,h,d,x,h/2,z,angle)
    if(variant<2){
      if(hash(x+4,z)>.45){
        const rw=(w+.8)/2,rd=(d+.8)/2
        const geometry=new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute([
          -rw,0,-rd,rw,0,-rd,rw,0,rd,-rw,0,rd,0,1.8,-rd,0,1.8,rd,
        ],3)).setIndex([0,5,4,0,3,5,1,4,5,1,5,2,0,4,1,3,2,5,0,1,2,0,2,3])
        const flat=geometry.toNonIndexed();geometry.dispose();flat.computeVertexNormals()
        const pos=flat.getAttribute('position'),uv=new Float32Array(pos.count*2)
        for(let i=0;i<pos.count;i++){uv[i*2]=pos.getX(i)/4;uv[i*2+1]=(pos.getZ(i)+pos.getY(i))/4}
        flat.setAttribute('uv',new THREE.BufferAttribute(uv,2))
        const top=add(flat,roof);top.rotation.y=angle;top.position.set(x,h,z)
      }else{
        const top=add(new THREE.ConeGeometry(Math.max(w,d)*.77,1.8,4),roof)
        top.scale.z=d/w;top.rotation.y=angle+Math.PI/4;top.position.set(x,h+.83,z)
      }
    }else{
      box('bairro-cobertura-plana',metal,w+.16,.17,d+.16,x,h+.1,z,angle)
      for(const side of [-1,1]){
        const a=center(side*w/2,0),b=center(0,side*d/2)
        box('bairro-platibanda',white,.16,.48,d,a.x,h+.31,a.z,angle)
        box('bairro-platibanda',white,w,.48,.16,b.x,h+.31,b.z,angle)
      }
      const tank=center(-w*.24,-d*.2)
      box('bairro-caixa-tecnica',concrete,2.2,1.2,2.7,tank.x,h+.72,tank.z,angle)
    }
    const columns=variant>1?3:2
    for(let floor=0;floor<floors;floor++){
      for(let column=0;column<columns;column++){
        const p=center((column-(columns-1)/2)*2.6,d/2+.015)
        windowPanel(variant>1?1.55:1.27,1.5,p.x,1.75+floor*3,p.z,angle)
      }
      for(const side of [-1,1]){
        const p=center(side*(w/2+.015),floor%2?1.9:-1.9)
        windowPanel(1.3,1.5,p.x,1.75+floor*3,p.z,angle+side*Math.PI/2)
      }
      if(!distant&&variant===2&&floor>0){
        const p=center(0,d/2+.55)
        box('bairro-sacada',concrete,w*.63,.14,1.05,p.x,floor*3+.11,p.z,angle)
        const rail=center(0,d/2+1.03)
        box('bairro-guarda-corpo',metal,w*.63,.065,.055,rail.x,floor*3+.92,rail.z,angle)
      }
    }
    const entrance=center(0,d/2+.025)
    box('bairro-porta',wood,1.2,2.1,.045,entrance.x,1.05,entrance.z,angle)
    if(!distant&&detailedHomes<40){
      detailedHomes++
      // Real relief near the stadium, where the user can inspect the street.
      // Keep distant houses light and reuse the same material batches.
      for(const side of [-1,1]){
        const post=center(side*.7,d/2+.06),eave=center(0,side*(d/2+.16))
        box('bairro-porta-moldura',white,.12,2.2,.13,post.x,1.1,post.z,angle)
        box('bairro-beiral',white,w+.48,.16,.32,eave.x,h,eave.z,angle)
      }
      const lintel=center(0,d/2+.06),sill=center(0,d/2+.3)
      box('bairro-porta-verga',white,1.52,.13,.13,lintel.x,2.2,lintel.z,angle)
      box('bairro-soleira',concrete,1.6,.15,.64,sill.x,.10,sill.z,angle)
    }
  }
  const blocks:PontoComplexo[]=[]
  for(let z=-300;z<=290;z+=29)for(let x=-345;x<=345;x+=29){
    const p={x,z}
    if(cityFree(p,18)&&hash(x,z)>.17)blocks.push(p)
  }
  // Select whole occupied blocks around the entire boundary, not floating house
  // clusters. Local streets connect the blocks and join the peripheral avenues.
  blocks.sort((a,b)=>Math.hypot(a.x,a.z-20)-Math.hypot(b.x,b.z-20))
  const occupied=blocks.slice(0,118)
  for(const p of occupied){
    box('bairro-quarteirao',paving,23,.16,23,p.x,.08,p.z)
    for(const side of [-1,1]){
      const x=p.x+side*5.6,z=p.z-2,choice=hash(x,z)
      residence(x,z,choice>.94?3:choice>.77?2:choice>.36?1:0)
    }
    plant({x:p.x,z:p.z+8.6},4.6,false,true,.08)
  }
  const cityRoads=new Set<string>()
  for(const p of occupied)for(const [dx,dz] of [[29,0],[-29,0],[0,29],[0,-29]]){
    const a={x:p.x+dx/2-(dz?14.5:0),z:p.z+dz/2-(dx?14.5:0)}
    const b={x:a.x+(dz?29:0),z:a.z+(dx?29:0)}
    const key=[a.x,a.z,b.x,b.z].join(':')
    if(cityRoads.has(key))continue
    cityRoads.add(key)
    // A free midpoint alone can leave the ends inside a future building.
    if([0,.25,.5,.75,1].every(t=>cityFree({x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t},5)))street('bairro-rua', [a,b],5.8,1.5)
  }

  // Continue the residential fabric beyond both edges used by a tall mobile
  // viewport. Blocks share the existing street grid instead of forming islands.
  // Foreground routes and every purchased plot remain exactly where they were.
  const extensions:PontoComplexo[]=[]
  for(const z of [-517.5,-459.5,-401.5,-343.5,-285.5,-227.5])for(let x=-330.5;x<=365.5;x+=58)
    if(cityFree({x,z},43)&&occupied.every(p=>Math.hypot(p.x-x,p.z-z)>42))extensions.push({x,z})
  for(const z of [294.5,352.5,410.5,468.5,526.5])for(let x=-214.5;x<=249.5;x+=58)
    if(cityFree({x,z},43)&&occupied.every(p=>Math.hypot(p.x-x,p.z-z)>42))extensions.push({x,z})
  const distantCrowns=Array.from({length:4},(_,i)=>crownShape(0,i))
  // Both trunk ends are hidden by the ground/canopy. Omit their invisible caps
  // in the distant residential blocks without changing the visible silhouette.
  const distantTrunk=own(new THREE.CylinderGeometry(.20,.34,1,6,1,true))
  const smallTree=(x:number,z:number,seed:number)=>{
    if(!clearOfConstruction({x,z},6))return
    const h=5.2+hash(seed,x)*2.4
    const trunk=add(distantTrunk,wood);trunk.scale.y=h+.24;trunk.position.set(x,(h-.24)/2,z)
    for(let i=0;i<2;i++){
      const shapes=Math.hypot(x,z-35)>240?distantCrowns:canopyShapes
      const crown=add(shapes[(Math.floor(hash(x,z)*4)+i)%4],i%2?lightLeaf:leaf)
      crown.position.set(x+Math.cos(i*2.7+seed)*1.1,h-.7+i*.65,z+Math.sin(i*2.7+seed)*1.1)
      crown.scale.set(4.05,3.0,3.85);crown.rotation.y=seed+i
    }
  }
  for(const p of extensions){
    box('bairro-jardins-residenciais',grass,51.7,.26,51.7,p.x,-.13,p.z)
    for(const sx of [-1,1])for(const sz of [-1,1]){
      const x=p.x+sx*12.7,z=p.z+sz*12.6,choice=hash(x,z),variant=choice>.955?3:choice>.86?2:choice>.38?1:0
      residence(x,z,variant,sz<0?Math.PI:0,true)
      ribbon('bairro-acesso-residencia',[{x,z:z+sz*6},{x,z:p.z+sz*25.5}],1.3,GROUND,paving)
    }
    smallTree(p.x,p.z-2,hash(p.x,p.z)*6)
    smallTree(p.x+22,p.z+14,hash(p.z,p.x)*6)
    smallTree(p.x-22,p.z-15,hash(p.x+2,p.z)*6)
    // Leave gates on both front-door axes instead of planting a hedge across
    // the actual access paths. Each 1.8 m opening includes walking clearance.
    for(const [from,to] of [[-17.5,-13.6],[-11.8,11.8],[13.6,17.5]])
      box('bairro-cerca-viva',leaf,to-from,.85,.75,p.x+(from+to)/2,.425,p.z+21.5)
    box('bairro-cerca-viva',leaf,.75,.85,31,p.x-21.5,.425,p.z)
    for(const side of [-1,1]){
      const horizontal=[{x:p.x-29,z:p.z+side*29},{x:p.x+29,z:p.z+side*29}]
      const vertical=[{x:p.x+side*29,z:p.z-29},{x:p.x+side*29,z:p.z+29}]
      for(const points of [horizontal,vertical]){
        const key=points.map(v=>v.x+','+v.z).join(':')
        if(cityRoads.has(key))continue
        cityRoads.add(key)
        // These continuation streets lie outside the conserved actor routes.
        street('bairro-rua-continuacao',points,5.8,1.7)
      }
    }
  }

  // Infill the strips left between the two street grids with public squares.
  // These are city amenities: they never occupy a future club purchase, and
  // remain the same from the bare field to the finished stadium.
  const parcels=[...occupied.map(p=>({...p,half:11.5})),...extensions.map(p=>({...p,half:25.85}))]
  const nearStreet=(p:PontoComplexo,margin=0)=>streetNetwork.some(road=>road.points.some((b,i)=>i>0&&distanceToSegment(p,road.points[i-1],b)<road.clearance+margin))
  const nearParcel=(p:PontoComplexo,margin=0)=>parcels.some(q=>Math.abs(p.x-q.x)<q.half+margin&&Math.abs(p.z-q.z)<q.half+margin)
  const parks:PontoComplexo[]=[]
  for(let z=-503;z<=512;z+=29)for(let x=-403;x<=409;x+=29){
    const p={x,z}
    if(!cityFree(p,18)||nearParcel(p,14))continue
    // Test the entire square; checking only its centre used to leave corners
    // over the avenues and around the reserved plots.
    if([-12,0,12].some(dx=>[-12,0,12].some(dz=>!cityFree({x:x+dx,z:z+dz},3))))continue
    parks.push(p)
  }
  const priority=(p:PontoComplexo)=>Math.min(Math.hypot((p.x+185)*1.4,p.z+335),Math.hypot(p.x,p.z-296),Math.hypot(p.x,p.z)*1.2)
  parks.sort((a,b)=>priority(a)-priority(b))
  const publicParks=parks.slice(0,72)
  for(const p of publicParks){
    box('parque-publico-gramado',grass,23,.10,23,p.x,-.10,p.z)
    // Entrances are drawn after the road network is complete: a missing street
    // must not leave a path ending abruptly in the grass.
    const seed=hash(p.x,p.z)
    for(const [sx,sz] of [[-1,-1],[1,1],[-1,1]])smallTree(p.x+sx*6.7,p.z+sz*6.7,seed*6+sx)
    box('parque-publico-banco',wood,2.2,.14,.52,p.x+4,.54,p.z+2.5)
    box('parque-publico-encosto',wood,2.2,.55,.10,p.x+4,.94,p.z+2.74)
    for(const dx of [-.8,.8])box('parque-publico-pe-banco',metal,.12,.49,.43,p.x+4+dx,.245,p.z+2.5)
    for(const [dx,dz] of [[29,0],[-29,0],[0,29],[0,-29]]){
      const a={x:p.x+dx/2-(dz?14.5:0),z:p.z+dz/2-(dx?14.5:0)}
      const b={x:a.x+(dz?29:0),z:a.z+(dx?29:0)},key=[a.x,a.z,b.x,b.z].join(':')
      if(cityRoads.has(key))continue
      // Whole width of the connection must remain outside the club/avenues.
      if([0,.25,.5,.75,1].some(t=>!cityFree({x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t},4)))continue
      cityRoads.add(key);street('parque-publico-rua',[a,b],5.8,1.5)
    }
    parcels.push({...p,half:11.5})
  }

  const parcelPolygon=(p:PontoComplexo&{half:number})=>[
    {x:p.x-p.half,z:p.z-p.half},{x:p.x+p.half,z:p.z-p.half},
    {x:p.x+p.half,z:p.z+p.half},{x:p.x-p.half,z:p.z+p.half},
  ]
  const roadPlan=planejarRedeViaria({
    streets:streetNetwork,
    obstacles:[
      ...registeredLots.map((lot,i)=>({id:`lote-${i}`,polygon:lot.footprint})),
      ...parkingLots.map((polygon,i)=>({id:`estacionamento-${i}`,polygon})),
      {id:'arena',polygon:arena},
      ...PLANTA_VADICO.reservationPolygons.map((polygon,i)=>({id:`vadico-${i}`,polygon})),
      ...parcels.map((p,i)=>({id:`quadra-${i}`,polygon:parcelPolygon(p)})),
      ...solids.filter(s=>s.base<.3&&s.top>.5).map(s=>({id:s.id,polygon:s.footprint})),
    ],
    blockedRoutes:[
      ...Object.entries(PLANTA_COMPLEXO.routes).filter(([id])=>!['roadOut','roadBack','parking'].includes(id)).map(([id,route])=>({id,polygon:faixaTransporteComplexo(route.points,4)})),
      ...Object.entries(fanPaths).map(([id,points])=>({id:`torcida-${id}`,polygon:faixaTransporteComplexo(points,4.4)})),
      ...transport.pedestrianSurfaces.filter(surface=>surface.y<.5).map(surface=>({id:surface.id,polygon:surface.polygon})),
      ...pedestrianPlan.reservationPolygons.map((polygon,i)=>({id:`pedestre-planejado-${i}`,polygon})),
    ],
  })
  streetNetwork.splice(0,streetNetwork.length,...roadPlan.streets.map(road=>({...road,clearance:road.width/2+road.walk})))
  const turnarounds=state.extras.asfalto?[{...AJUSTES_RUAS_COMPLEXO.turning,roadId:'rua-interna-oeste',destination:'hotel'}]:[]
  // A purchased parking lot is also a drivable surface. Its actual footprint
  // must cut street kerbs, otherwise the western terminal connects on paper
  // while a raised sidewalk still blocks the lateral entrance into the lot.
  for(const source of [...streetNetwork.map(road=>poligonoRuaComplexo(road)),...turnarounds.map(turn=>circle(turn.center,turn.radius)),
    ...transport.parkingPlants.filter(lot=>lot.stage<=transport.parking.stage).map(lot=>lot.polygon)]){
    const area=source.reduce((sum,a,i)=>{const b=source[(i+1)%source.length];return sum+a.x*b.z-b.x*a.z},0)
    const boundary=area<0?[...source].reverse():[...source]
    // A straight road (and the hotel turning circle) is already convex.
    // Subtract it once: cutting separate triangles unnecessarily fragments
    // every bordering pavement along the corridor's invisible diagonals.
    const convex=boundary.every((a,i)=>{
      const b=boundary[(i+1)%boundary.length],c=boundary[(i+2)%boundary.length]
      return (b.x-a.x)*(c.z-b.z)-(b.z-a.z)*(c.x-b.x)>=-1e-8
    })
    const pieces=convex?[boundary]:THREE.ShapeUtils.triangulateShape(boundary.map(p=>new THREE.Vector2(p.x,p.z)),[]).map(indices=>indices.map(i=>boundary[i]))
    for(const polygon of pieces){
      if(polygon.reduce((sum,a,i)=>{const b=polygon[(i+1)%polygon.length];return sum+a.x*b.z-b.x*a.z},0)<0)polygon.reverse()
      streetCorridors.push({polygon,minX:Math.min(...polygon.map(p=>p.x)),maxX:Math.max(...polygon.map(p=>p.x)),minZ:Math.min(...polygon.map(p=>p.z)),maxZ:Math.max(...polygon.map(p=>p.z))})
    }
  }
  renderingStreet=true
  for(const road of streetNetwork){
    polygon(road.id,poligonoRuaComplexo(road),0,asphalt)
    for(const side of [-1,1]){
      ribbon(`${road.id}-passeio`,offsetPath(road.points,side*(road.width/2+road.walk/2)),road.walk,GROUND,paving,3)
      ribbon(`${road.id}-meio-fio`,offsetPath(road.points,side*(road.width/2+.09)),.18,GROUND+.01,concrete,3)
    }
    // Close the outside of junction corners around the actual 3 m asphalt
    // cap. Previously pavement stopped after .85 m, leaving a grass gap.
    // All connected lanes are subtracted, so this cannot cap an open road.
    for(const [index,neighbor] of [[0,1],[road.points.length-1,road.points.length-2]]){
      const p=road.points[index],q=road.points[neighbor],length=Math.hypot(p.x-q.x,p.z-q.z),dx=(p.x-q.x)/length,dz=(p.z-q.z)/length
      const at=(along:number,side:number)=>({x:p.x+dx*along-dz*side,z:p.z+dz*along+dx*side})
      const radius=road.width/2+road.walk
      polygon(`${road.id}-passeio-esquina`,[at(2.98,-radius),at(3+road.walk,-radius),at(3+road.walk,radius),at(2.98,radius)],GROUND,paving)
      polygon(`${road.id}-guia-esquina`,[at(3,-road.width/2),at(3.18,-road.width/2),at(3.18,road.width/2),at(3,road.width/2)],GROUND+.01,concrete)
    }
  }
  for(const turn of turnarounds){
    polygon('retorno-hotel-pista',circle(turn.center,turn.radius),0,asphalt)
    const inner=circle(turn.center,turn.radius),outer=circle(turn.center,turn.radius+turn.walk),kerb=circle(turn.center,turn.radius+.18)
    for(let i=0;i<inner.length;i++){
      const next=(i+1)%inner.length
      polygon('retorno-hotel-passeio',[inner[i],outer[i],outer[next],inner[next]],GROUND,paving)
      polygon('retorno-hotel-guia',[inner[i],kerb[i],kerb[next],inner[next]],GROUND+.01,concrete)
    }
  }
  renderingStreet=false
  const drawGradedWalk=(id:string,points:readonly (PontoComplexo&{y:number})[],width:number,mat:THREE.Material)=>{
    const left=deslocarCaminhoComplexo(points,width/2),right=deslocarCaminhoComplexo(points,-width/2)
    for(let i=1;i<points.length;i++){
      const a=points[i-1],b=points[i],dx=b.x-a.x,dz=b.z-a.z,den=dx*dx+dz*dz
      const floor=polygon(id,[left[i-1],left[i],right[i],right[i-1]],0,mat),positions=floor.geometry.getAttribute('position')
      for(let k=0;k<positions.count;k++){
        const t=Math.max(0,Math.min(1,((positions.getX(k)-a.x)*dx+(positions.getZ(k)-a.z)*dz)/(den||1)))
        positions.setY(k,a.y+(b.y-a.y)*t)
      }
      floor.geometry.computeVertexNormals()
    }
  }
  for(const walk of pedestrianPlan.walks)drawGradedWalk(walk.id,walk.points,walk.width,walk.material==='club'?routeSurface:paving)
  root.userData.pedestrianNetwork=pedestrianPlan.metadata
  const crossingWalks=[
    {id:'sidewalk',polygon:faixaTransporteComplexo(PLANTA_COMPLEXO.routes.sidewalk.points,4.1)},
    ...['hotel','shop','food','beer','station'].filter(id=>state.extras[({hotel:'hotel',shop:'loja',food:'praca',beer:'chopp',station:'estacao'} as Record<string,string>)[id]])
      .map(id=>({id,polygon:faixaTransporteComplexo(PLANTA_COMPLEXO.routes[id].points,3.6)})),
    ...pedestrianPlan.walks.map(walk=>({id:walk.id,polygon:walk.polygon})),
    ...transport.pedestrianSurfaces.filter(surface=>Math.abs(surface.y-GROUND)<.001).map(surface=>({id:surface.id,polygon:surface.polygon})),
  ]
  const crossings=planejarTravessiasComplexo(streetNetwork,crossingWalks)
  for(const crossing of crossings){
    drawGradedWalk(crossing.id,crossing.points,crossing.width,asphalt)
    const a=crossing.points[1],b=crossing.points[2],length=Math.hypot(b.x-a.x,b.z-a.z),angle=-Math.atan2(b.z-a.z,b.x-a.x)
    for(let d=.45;d<length-.2;d+=.85){
      const t=d/length
      box('travessia-faixa',white,.4,.008,crossing.width*.8,a.x+(b.x-a.x)*t,GROUND+.005,a.z+(b.z-a.z)*t,angle)
    }
  }
  root.userData.roadNetwork={...roadPlan,crossings,turnarounds}

  const parkEntrances:{park:PontoComplexo;points:PontoComplexo[]}[]=[]
  for(const p of publicParks){
    const points:PontoComplexo[]=[]
    for(const [dx,dz] of [[-1,0],[1,0],[0,-1],[0,1]]){
      const edge={x:p.x+dx*11.5,z:p.z+dz*11.5}
      const connected=streetNetwork.some(road=>road.points.some((b,i)=>{
        if(!i)return false
        const distance=distanceToSegment(edge,road.points[i-1],b)
        return distance>=road.width/2&&distance<=road.width/2+road.walk+.25
      }))
      if(!connected)continue
      // Same 16 cm surface as the pavement. Closed sides remain landscaped;
      // the connected arms share the centre and give the park real entrances.
      const end={x:p.x+dx*11.5,z:p.z+dz*11.5}
      polygon('parque-publico-passeio',faixaTransporteComplexo([p,end],2.1),GROUND,paving)
      points.push(end)
    }
    parkEntrances.push({park:p,points})
  }
  root.userData.parkEntrances=parkEntrances
  // Street lamps belong to the existing public streets (and only to purchased
  // club paving). They stand at the outside edge of a real sidewalk, clear of
  // doors, crossings and every registered pedestrian/vehicle corridor.
  const streetLamps:PontoComplexo[]=[]
  root.updateMatrixWorld(true)
  const lampFloors=root.children.filter((o):o is THREE.Mesh=>o instanceof THREE.Mesh&&o.material===paving)
    .map(mesh=>({mesh,bounds:new THREE.Box3().setFromObject(mesh,true)})).filter(({bounds})=>bounds.min.y>=-.001&&bounds.max.y<.4)
  const supportRay=new THREE.Raycaster(),supportDown=new THREE.Vector3(0,-1,0)
  const supportedLamp=(p:PontoComplexo)=>{
    let supported=0
    for(const [dx,dz] of [[.15,0],[-.15,0],[0,.15],[0,-.15]]){
      const x=p.x+dx,z=p.z+dz,candidates=lampFloors.filter(({bounds})=>x>=bounds.min.x&&x<=bounds.max.x&&z>=bounds.min.z&&z<=bounds.max.z).map(({mesh})=>mesh)
      supportRay.set(new THREE.Vector3(x,.3,z),supportDown);supportRay.near=0;supportRay.far=.16
      if(supportRay.intersectObjects(candidates,false).some(hit=>hit.face&&hit.face.normal.y>.9&&Math.abs(hit.point.y-GROUND)<.015))supported++
    }
    return supported>=3
  }
  const lampRoads=[...streetNetwork].sort((a,b)=>Math.min(...a.points.map(p=>Math.hypot(p.x,p.z)))-Math.min(...b.points.map(p=>Math.hypot(p.x,p.z))))
  for(const road of lampRoads)for(let i=1;i<road.points.length;i++){
    const a=road.points[i-1],b=road.points[i],length=Math.hypot(b.x-a.x,b.z-a.z),dx=(b.x-a.x)/length,dz=(b.z-a.z)/length
    if(length<16||streetLamps.length>=120)continue
    for(let along=9;along<length-6;along+=30){
      if(streetLamps.length>=120)break
      const side=hash(a.x+along,a.z)>.5?1:-1,offset=side*(road.width/2+road.walk-.22)
      const p={x:a.x+dx*along-dz*offset,z:a.z+dz*along+dx*offset}
      if(streetLamps.some(q=>Math.hypot(q.x-p.x,q.z-p.z)<20)||protectedPath(p,1.1))continue
      if(registeredLots.some(lot=>inside(p,lot.footprint))||parkingLots.some(poly=>inside(p,poly))||PLANTA_VADICO.reservationPolygons.some(poly=>inside(p,poly)))continue
      if(solids.some(s=>s.base<.4&&s.top>1&&inside(p,s.footprint)))continue
      if(streetNetwork.some(other=>other!==road&&other.points.some((q,j)=>j>0&&distanceToSegment(p,other.points[j-1],q)<other.width/2+.4)))continue
      if(!supportedLamp(p))continue
      const id=`poste-rua-${streetLamps.length+1}`,head={x:p.x+dz*side*.65,z:p.z-dx*side*.65},height=6.8
      box(`${id}-base`,metal,.25,.28,.25,p.x,GROUND+.14,p.z,0,true)
      box(`${id}-haste`,metal,.095,height,.095,p.x,GROUND+height/2,p.z,0,true)
      beam(`${id}-braco`,metal,new THREE.Vector3(p.x,GROUND+height,p.z),new THREE.Vector3(head.x,GROUND+height,head.z),.08)
      fixture(id,head.x,GROUND+height-.1,head.z,'street',GROUND,-Math.atan2(dz,dx))
      streetLamps.push(p)
    }
  }
  root.userData.complexoLights=lightAnchors
  root.userData.streetLighting={posts:streetLamps.length,positions:streetLamps}
  // Plant only after junctions and connectors are known, keeping tree trunks
  // off the repaired road openings as well as the original vehicle routes.
  roadsideTrees(peripheral,10,12);roadsideTrees(peripheral,-10,14);roadsideTrees(north,15,13);roadsideTrees(north,-15,13)

  // Tree belts fill the narrow, irregular remnants where a rectangular block
  // cannot fit. Keep full crowns clear of roads, houses and the existing NPC
  // corridors. No random decorations are placed on the actors' routes.
  const beltCandidates:PontoComplexo[]=[]
  for(let z=-550;z<=550;z+=18)for(let x=-480;x<=480;x+=18){
    const p={x:x+(hash(x,z)-.5)*7,z:z+(hash(z,x)-.5)*7}
    if(!cityFree(p,13)||nearParcel(p,5)||nearStreet(p,4)||protectedPath(p,6))continue
    if(hash(x+13,z)<.28)continue
    beltCandidates.push(p)
  }
  beltCandidates.sort((a,b)=>priority(a)-priority(b))
  const beltTrees=Math.min(180,beltCandidates.length)
  for(const p of beltCandidates.slice(0,beltTrees))smallTree(p.x,p.z,hash(p.x,p.z)*8)

  // Inside the club, landscape only the residual ground around the final oval.
  // The full-size arena, all eventual buildings and the pedestrian entrances
  // keep their construction envelope even in the first stage.
  const structure=PLANTA_COMPLEXO.arena.structure
  const clubCandidates:PontoComplexo[]=[]
  for(let z=-140;z<=200;z+=13)for(let x=-180;x<=180;x+=13){
    const p={x:x+(hash(x,z)-.5)*3,z:z+(hash(z,x)-.5)*3}
    const outsideOval=(p.x/117)**2+((p.z-structure.centerZ)/88)**2>1
    if(!inside(p,rawTerrain)||!outsideOval||Math.abs(p.x)<54&&p.z>70&&p.z<121)continue
    if(!clearOfConstruction(p,5)||protectedPath(p,6)||nearStreet(p,5)||nearParcel(p,6))continue
    // Natural existing trees, not the paid gardens/fountain or free asphalt.
    clubCandidates.push(p)
  }
  clubCandidates.sort((a,b)=>Math.hypot(a.x,a.z+75)-Math.hypot(b.x,b.z+75))
  const clubTrees=Math.min(64,clubCandidates.length)
  for(const p of clubCandidates.slice(0,clubTrees))plant(p,5.5+hash(p.x,p.z)*2.8,false,true,-.19)
  // A regional park continues beyond the detailed neighbourhood. Its larger
  // mature trees have a light silhouette mesh, while the stadium-side trees
  // retain their denser crowns. This covers the tall portrait camera footprint
  // without duplicating hundreds of detailed houses outside the playable area.
  const outerWalks=[
    [{x:-442,z:-1220},{x:-475,z:-620},{x:-490,z:-180},{x:-443,z:325},{x:-424,z:1230}],
    [{x:455,z:-1220},{x:495,z:-650},{x:490,z:-210},{x:455,z:345},{x:466,z:1230}],
    [{x:-810,z:-606},{x:-450,z:-590},{x:0,z:-585},{x:460,z:-598},{x:815,z:-630}],
    [{x:-810,z:625},{x:-460,z:602},{x:0,z:598},{x:450,z:610},{x:815,z:650}],
  ]
  for(const walk of outerWalks)ribbon('parque-regional-passeio',walk,3,.03,paving)
  const parkConnections=[
    [{x:17.5,z:-551},{x:17.5,z:-585.2}],
    [{x:17.5,z:560},{x:17.5,z:598.5}],
  ]
  for(const [a,b] of parkConnections){
    const dx=b.x-a.x,dz=b.z-a.z,length=Math.hypot(dx,dz),nx=-dz/length*1.5,nz=dx/length*1.5
    const floor=polygon('parque-regional-acesso',[
      {x:a.x+nx,z:a.z+nz},{x:b.x+nx,z:b.z+nz},{x:b.x-nx,z:b.z-nz},{x:a.x-nx,z:a.z-nz},
    ],0,paving)
    const positions=floor.geometry.getAttribute('position')
    for(let i=0;i<positions.count;i++){
      const t=Math.max(0,Math.min(1,((positions.getX(i)-a.x)*dx+(positions.getZ(i)-a.z)*dz)/(length*length)))
      positions.setY(i,GROUND+(.03-GROUND)*t)
    }
    floor.geometry.computeVertexNormals()
  }
  outerWalks.push(...parkConnections)
  let regionalTrees=0
  for(let z=-1240;z<=1240;z+=32)for(let x=-832;x<=832;x+=32){
    const p={x:x+(hash(x,z)-.5)*18,z:z+(hash(z,x)-.5)*18}
    if(inside(p,rawTerrain)||nearParcel(p,12)||nearStreet(p,13)||protectedPath(p,13)||!clearOfConstruction(p,13))continue
    if(outerWalks.some(walk=>walk.some((b,i)=>i>0&&distanceToSegment(p,walk[i-1],b)<12)))continue
    if(hash(x+7,z)<.24)continue
    const h=9+hash(x,z)*6,r=6+hash(z,x)*3
    const trunk=add(distantTrunk,wood);trunk.position.set(p.x,(h-.24)/2,p.z);trunk.scale.set(1.7,h+.24,1.7)
    const crown=add(distantCrowns[Math.floor(hash(x+3,z)*4)],hash(x,z)>.5?leaf:lightLeaf)
    crown.position.set(p.x,h-1.8,p.z);crown.scale.set(r,5.5,r*.93);crown.rotation.y=hash(z,x)*6
    // Keep distant forests out of the local navigation raycast bounds. Four
    // spatial batches add few draws and avoid testing every far-away triangle
    // whenever a supporter checks the pavement beside the stadium.
    const zone=p.z< -570?'north':p.z>570?'south':p.x<0?'west':'east'
    trunk.userData.batchZone=zone;crown.userData.batchZone=zone
    regionalTrees++
  }
  root.userData.landscape={publicParks:publicParks.length,beltTrees,clubTrees,regionalTrees,roads:streetNetwork.length}
  root.userData.transport={station:transport.station.enabled,stationFloor:transport.station.floor,railY:transport.station.railY,stairs:transport.station.enabled?transport.station.accesses.reduce((count,access)=>count+access.stair.count,0):0,stationAccesses:transport.station.accesses.map(access=>access.id),railExtent:transport.station.railExtent,railWidth:transport.station.railWidth,busStops:2,parkingStage:transport.parking.stage,parkingCapacity:transport.parking.capacity,parkingLots:transport.parkingPlants.filter(lot=>lot.stage<=transport.parking.stage).map(lot=>({id:lot.id,capacity:lot.slots.length,access:lot.access}))}

  // Batch by material and by the four distant forest regions after transforms,
  // retaining logical colliders/doors and useful bounds for local raycasts.
  root.updateMatrixWorld(true)
  const parts=root.children.filter((o):o is THREE.Mesh=>o instanceof THREE.Mesh)
  const batches=new Map<string,{mat:THREE.Material;cast:boolean;parts:THREE.BufferGeometry[]}>()
  for(const part of parts){
    const transformed=part.geometry.index?part.geometry.toNonIndexed():part.geometry.clone()
    transformed.applyMatrix4(part.matrix)
    if(!transformed.getAttribute('uv'))transformed.setAttribute('uv',new THREE.Float32BufferAttribute(new Float32Array(transformed.getAttribute('position').count*2),2))
    // Leaf batches also include palm fronds and hedges. Neutral colours keep
    // their material unchanged and all merged attribute layouts compatible.
    if((part.material as THREE.MeshStandardMaterial).vertexColors&&!transformed.getAttribute('color'))transformed.setAttribute('color',new THREE.Float32BufferAttribute(new Float32Array(transformed.getAttribute('position').count*3).fill(1),3))
    // ⚡ 25/10 (Diego: "o mapa pesado… sem prejudicar o real"): o lote do que faz SOMBRA era por material no mapa inteiro (blocos de até
    // 2,9 km) e entrava inteiro no passe de sombra, que só cobre a volta da câmera. Agora é por material E quadra de 400 m: mesma
    // geometria, mesmo material — só fica de fora do quadro (e da sombra) o que está longe dela
    if(!transformed.boundingBox)transformed.computeBoundingBox()
    const centro=transformed.boundingBox!.getCenter(new THREE.Vector3()),quadra=part.castShadow?Math.floor(centro.x/QUADRA)+','+Math.floor(centro.z/QUADRA):''
    const mat=part.material as THREE.Material,key=mat.uuid+':'+part.castShadow+':'+(part.userData.batchZone??'local')+':'+quadra,batch=batches.get(key)??{mat,cast:part.castShadow,parts:[]}
    batch.parts.push(transformed);batches.set(key,batch)
  }
  for(const {mat,cast,parts} of batches.values()){
    const merged=mergeGeometries(parts);if(merged){const value=add(merged,mat);value.name='entorno-material';value.castShadow=cast}
    parts.forEach(g=>g.dispose())
  }
  // ⚡ 25/10: tirar as peças uma a uma procurava cada uma na lista inteira (milhares × milhares — ~0,35 s ao abrir o Clube). Mesmo
  // resultado do `root.remove`: sem pai, mesmos avisos, e as que ficam na MESMA ordem
  const tirar=new Set<THREE.Object3D>(parts)
  root.children=root.children.filter(child=>!tirar.has(child))
  for(const part of parts){part.parent=null;part.dispatchEvent({type:'removed'});root.dispatchEvent({type:'childremoved',child:part})}
  // Source buffers are no longer rendered after batching. Keep only merged
  // buffers alive so repeated stage previews do not accumulate hidden geometry.
  const rendered=new Set(root.children.flatMap(child=>child instanceof THREE.Mesh?[child.geometry]:[]))
  for(const geo of geometries)if(!rendered.has(geo)){geo.dispose();geometries.delete(geo)}
  // Sponsor scenery has its own lot and resources; it never consumes a club
  // purchase or replaces an eventual building in the stadium's progression.
  const dealership=criarConcessionariaComplexo(root)
  solids.push(...dealership.solids)
  root.userData.dealership=dealership.metadata
  let disposed=false
  return {root,solids,doors,transport,establishments:entered,dispose(){
    if(disposed)return;disposed=true;dealership.dispose();scene.remove(root);root.clear()
    geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose())
  }}
}
