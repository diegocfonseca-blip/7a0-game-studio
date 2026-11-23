import * as THREE from 'three'

import {RotacaoBola3D,RAIO_BOLA_FUTEBOL_3D} from './presidencia-bola-rotacao'
export {RAIO_BOLA_FUTEBOL_3D} from './presidencia-bola-rotacao'
type Panel={black:boolean;vertices:THREE.Vector3[]}

/** A truncated icosahedron supplies the actual football panels: twelve black
 * pentagons and twenty white hexagons. Subdivision projects their triangles
 * back onto one sphere, including the narrow seams between white panels.
 * One mesh/material, no texture, canvas, overlay or global GPU resource. */
export function criarBolaFutebol3D(){
 const source=new THREE.IcosahedronGeometry(1,0),positions=source.getAttribute('position')
 const vertices:THREE.Vector3[]=[],faces:number[][]=[],ids=new Map<string,number>()
 for(let i=0;i<positions.count;i+=3){
  const face:number[]=[]
  for(let j=0;j<3;j++){
   const p=new THREE.Vector3().fromBufferAttribute(positions,i+j).normalize(),key=p.toArray().map(v=>v.toFixed(7)).join(',')
   let id=ids.get(key);if(id===undefined){id=vertices.length;ids.set(key,id);vertices.push(p)}
   face.push(id)
  }
  faces.push(face)
 }
 source.dispose()
 const cut=(a:number,b:number)=>vertices[a].clone().multiplyScalar(2).add(vertices[b]).normalize()
 const panels:Panel[]=faces.map(([a,b,c])=>({black:false,vertices:[cut(a,b),cut(b,a),cut(b,c),cut(c,b),cut(c,a),cut(a,c)]}))
 vertices.forEach((axis,index)=>{
  const neighbours=new Set<number>()
  for(const face of faces)if(face.includes(index))for(const n of face)if(n!==index)neighbours.add(n)
  const points=[...neighbours].map(n=>cut(index,n)),u=points[0].clone().addScaledVector(axis,-points[0].dot(axis)).normalize(),v=axis.clone().cross(u)
  points.sort((a,b)=>Math.atan2(a.dot(v),a.dot(u))-Math.atan2(b.dot(v),b.dot(u)))
  panels.push({black:true,vertices:points})
 })
 const black=new THREE.Color('#111614'),white=new THREE.Color('#f9f6eb'),seam=new THREE.Color('#62645b')
 const coordinates:number[]=[],normals:number[]=[],colors:number[]=[],indices:number[]=[],weld=new Map<string,number>()
 const vertex=(unit:THREE.Vector3,color:THREE.Color)=>{
  const key=unit.toArray().map(v=>v.toFixed(9)).join(',')+':'+color.getHexString()
  let index=weld.get(key)
  if(index===undefined){
   index=coordinates.length/3;weld.set(key,index)
   coordinates.push(unit.x*RAIO_BOLA_FUTEBOL_3D,unit.y*RAIO_BOLA_FUTEBOL_3D,unit.z*RAIO_BOLA_FUTEBOL_3D)
   normals.push(unit.x,unit.y,unit.z);colors.push(color.r,color.g,color.b)
  }
  return index
 }
 const middle=(a:THREE.Vector3,b:THREE.Vector3)=>a.clone().add(b).normalize()
 function triangle(a:THREE.Vector3,b:THREE.Vector3,c:THREE.Vector3,color:THREE.Color,subdivide=false){
  if(subdivide){
   const ab=middle(a,b),bc=middle(b,c),ca=middle(c,a)
   triangle(a,ab,ca,color);triangle(ab,b,bc,color);triangle(ca,bc,c,color);triangle(ab,bc,ca,color);return
  }
  // Consistent outward winding also makes shadows and back-face culling agree.
  const outward=b.clone().sub(a).cross(c.clone().sub(a)).dot(a)
  indices.push(vertex(a,color),vertex(outward>0?b:c,color),vertex(outward>0?c:b,color))
 }
 for(const panel of panels){
  const center=panel.vertices.reduce((sum,p)=>sum.add(p),new THREE.Vector3()).normalize()
  const inside=panel.vertices.map(p=>p.clone().lerp(center,.018).normalize())
  for(let i=0;i<panel.vertices.length;i++){
   const next=(i+1)%panel.vertices.length,a=inside[i],b=inside[next],outerA=panel.vertices[i],outerB=panel.vertices[next]
   triangle(center,a,b,panel.black?black:white,true)
   // The seam is part of the same spherical surface. It cannot hide inside a
   // white sphere like the old flat wireframe triangles did.
   const midInner=middle(a,b),midOuter=middle(outerA,outerB)
   triangle(a,outerA,midOuter,seam);triangle(a,midOuter,midInner,seam)
   triangle(midInner,midOuter,outerB,seam);triangle(midInner,outerB,b,seam)
  }
 }
 const geometry=new THREE.BufferGeometry()
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(coordinates,3))
 geometry.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3))
 geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3))
 geometry.setIndex(indices);geometry.computeBoundingSphere();geometry.computeBoundingBox()
 geometry.userData={radius:RAIO_BOLA_FUTEBOL_3D,pentagons:12,hexagons:20,triangles:indices.length/3}
 const material=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.78,metalness:0})
 const ball=new THREE.Mesh(geometry,material)
 ball.name='match-ball';ball.castShadow=true;ball.receiveShadow=true;ball.userData.radius=RAIO_BOLA_FUTEBOL_3D
 // A 22 cm ball is smaller than a stadium shadow-map texel on mobile. A
 // separate soft contact patch grounds it without changing physical scale.
 const size=32,data=new Uint8Array(size*size*4)
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const r=Math.hypot((x+.5-size/2)/(size/2),(y+.5-size/2)/(size/2)),i=(y*size+x)*4
  data.set([22,26,16,Math.round(255*Math.pow(Math.max(0,1-r),1.5))],i)
 }
 const texture=new THREE.DataTexture(data,size,size,THREE.RGBAFormat);texture.needsUpdate=true;texture.minFilter=texture.magFilter=THREE.LinearFilter
 const shadow=new THREE.Mesh(new THREE.PlaneGeometry(.34,.34),new THREE.MeshBasicMaterial({map:texture,transparent:true,opacity:.32,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1}))
 shadow.name='ball-ground-contact';shadow.renderOrder=1;ball.add(shadow)
 // ⚽🔎 22/11 (Diego: *"tamanho da bola"*): a bola de 22 cm some na câmera de TV do celular (3 px) e fica miúda perto do boneco
 // cabeçudo. Só o DESENHO cresce: 1,5× de perto (proporção do boneco) e o que precisar pra ter um tamanho mínimo na tela de longe
 // (teto 3,2×). A posição oficial, o raio físico e o motor não mudam. A conta roda uma vez por quadro desenhado, sem alocar nada;
 // quem nunca desenha (testes) fica em 1×.
 const centre=new THREE.Vector3(),eye=new THREE.Vector3();let lastScaleAt:number|undefined
 ball.onBeforeRender=(renderer,_scene,camera)=>{
  const cam=camera as THREE.PerspectiveCamera;if(!cam.isPerspectiveCamera)return
  const height=renderer.domElement.height/Math.max(.5,renderer.getPixelRatio())
  if(!(height>0))return
  const distance=centre.setFromMatrixPosition(ball.matrixWorld).distanceTo(eye.setFromMatrixPosition(cam.matrixWorld))
  const pixelsPerMetre=height*(cam.zoom||1)/(2*Math.max(.5,distance)*Math.tan(THREE.MathUtils.degToRad(cam.fov)/2))
  const wanted=THREE.MathUtils.clamp(THREE.MathUtils.clamp(height*.011,6,9)/(2*RAIO_BOLA_FUTEBOL_3D*pixelsPerMetre),ESCALA_BOLA_PERTO,ESCALA_BOLA_MAXIMA)
  const current=(ball.userData.visualScale as number|undefined)??1
  const now=performance.now(),dt=lastScaleAt===undefined?1/60:THREE.MathUtils.clamp((now-lastScaleAt)/1000,0,.25);lastScaleAt=now
  ball.userData.visualScale=Math.abs(wanted-current)<.004?wanted:current+(wanted-current)*(1-Math.exp(-dt/.075))
 }
 return ball
}
/** ⚽🔎 quanto o DESENHO da bola cresce: de perto e no máximo (longe). Nunca entra na física. */
// 🔁 22/11 (Diego, depois de ver no ar: *"a bola, você aumentou demais"*): de 1,5×/3,2× e 10 px mínimos pra 1,2×/2,2× e ~6,5 px.
export const ESCALA_BOLA_PERTO=1.2,ESCALA_BOLA_MAXIMA=2.2

const fallbackRoll=new WeakMap<THREE.Object3D,{spin:RotacaoBola3D;time:number}>()
/** All match viewers use the same official position and presentation rotation. */
export function posicionarBolaFutebol3D(ball:THREE.Object3D,frame:{time:number;ball:{x:number;y:number;z:number;rotation?:[number,number,number,number];presentation?:{x:number;y:number;z:number}}}){
 const p=frame.ball,position=p.presentation??p,visual=(ball.userData.visualScale as number|undefined)??1
 // (o desenho maior sobe o centro pra bola continuar APOIADA na grama, não enterrada)
 // 🏁 22/11 (filmado: no escanteio, tiro de meta e saída a bola SUMIA de um lugar e aparecia em outro de um quadro pro outro —
 // 25 m num quadro). O motor recoloca a bola na hora, e isso não muda; o desenho é que agora "põe a bola no lugar": ela cresce do
 // zero em 0,22 s no ponto novo, como a bola reposta pelo gandula, em vez de piscar de um canto pro outro.
 const memory=ball.userData as {lastShown?:{x:number;y:number;z:number;t:number};placedAt?:number}
 const before=memory.lastShown,elapsed=before?frame.time-before.t:0
 if(before&&elapsed>0&&elapsed<.5){const jump=Math.hypot(position.x-before.x,position.y-before.y,position.z-before.z);if(jump>3&&jump/elapsed>60)memory.placedAt=frame.time}
 else if(before&&elapsed<0)memory.placedAt=undefined // (voltou no tempo: replay/busca não anima nada)
 memory.lastShown={x:position.x,y:position.y,z:position.z,t:frame.time}
 const sincePlaced=memory.placedAt===undefined?1:(frame.time-memory.placedAt)/.22,grow=sincePlaced>=1||sincePlaced<0?1:1-(1-sincePlaced)*(1-sincePlaced)
 ball.scale.setScalar(visual*Math.max(.02,grow));ball.position.set(position.x,position.y+(visual-1)*RAIO_BOLA_FUTEBOL_3D,position.z)
 if(p.rotation)ball.quaternion.fromArray(p.rotation)
 else{
 let state=fallbackRoll.get(ball)
 if(!state||frame.time<state.time){state={spin:new RotacaoBola3D(RAIO_BOLA_FUTEBOL_3D,p),time:frame.time};fallbackRoll.set(ball,state)}
 ball.quaternion.copy(state.spin.step(p,frame.time-state.time));state.time=frame.time
 }
 const shadow=ball.getObjectByName('ball-ground-contact') as THREE.Mesh<THREE.PlaneGeometry,THREE.MeshBasicMaterial>|undefined
 if(shadow){
  const inverse=ball.quaternion.clone().invert()
  shadow.position.set(0,(.007-ball.position.y)/ball.scale.x,0).applyQuaternion(inverse)
  shadow.quaternion.copy(inverse).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),-Math.PI/2))
  // 🌑 22/11: a mancha no chão não some mais quando a bola sobe — fica embaixo dela, mais fraca, pra dar pra LER a bola alta
  // (cruzamento, chutão, cabeçada). Antes sumia a 30 cm do chão.
  shadow.material.opacity=.34*(1-.62*THREE.MathUtils.clamp(Math.max(0,position.y-RAIO_BOLA_FUTEBOL_3D)/6,0,1))
  const spread=1+Math.min(1.1,Math.max(0,position.y-RAIO_BOLA_FUTEBOL_3D)*.16);shadow.scale.set(spread,spread,1)
  shadow.visible=shadow.material.opacity>.001
 }
}
