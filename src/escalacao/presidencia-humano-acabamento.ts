import * as THREE from 'three'
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js'

export type ParteHumana = 'torso'|'head'|'hair'|'pelvis'|'upperArm'|'forearm'|'thigh'|'shin'|'shoe'
type Detail = 'close'|'crowd'
type Profile = readonly (readonly [number, number, number])[]

// Unit envelopes are shared with the articulated rigs. +Y is proximal on
// limbs, +Z is forward; no face details or image planes are used here.
const profiles: Record<Exclude<ParteHumana,'hair'|'shoe'>, Profile> = {
 torso: [[-.5,.88,.84],[-.43,.91,.91],[-.23,.93,.97],[0,.96,1],[.20,1,1],[.34,1,.98],[.44,.87,.80],[.5,.45,.54]],
 pelvis: [[-.5,.56,.65],[-.40,.86,.88],[-.15,1,1],[.15,1,1],[.38,.90,.93],[.5,.72,.80]],
 head: [[-.5,.30,.34],[-.44,.54,.60],[-.31,.73,.80],[-.13,.87,.93],[.08,.94,.96],[.25,.94,.94],[.38,.78,.79],[.47,.43,.46],[.5,.015,.025]],
 upperArm: [[-.5,.68,.72],[-.42,.78,.80],[-.22,.88,.89],[.06,.98,.98],[.26,1,1],[.42,.93,.95],[.5,.70,.76]],
 forearm: [[-.5,.58,.62],[-.40,.65,.70],[-.12,.80,.83],[.15,.96,.96],[.36,1,1],[.46,.94,.94],[.5,.75,.78]],
 thigh: [[-.5,.69,.73],[-.40,.75,.78],[-.15,.87,.91],[.12,.98,.99],[.32,1,1],[.44,.95,.96],[.5,.80,.84]],
 shin: [[-.5,.57,.60],[-.40,.61,.64],[-.18,.76,.79],[.08,.96,1],[.26,1,.98],[.43,.90,.89],[.5,.73,.76]],
}

function profileAt(profile: Profile,y:number): [number,number] {
 for(let i=1;i<profile.length;i++)if(y<=profile[i][0]){
  const a=profile[i-1],b=profile[i],t=(y-a[0])/(b[0]-a[0])
  return [THREE.MathUtils.lerp(a[1],b[1],t),THREE.MathUtils.lerp(a[2],b[2],t)]
 }
 return [profile.at(-1)![1],profile.at(-1)![2]]
}

// Smooth the silhouette of the close-up head without inflating every limb
// in a crowd. Hair uses these exact samples as well, so it cannot cut across
// the curved cranium between rows.
function smoothHead():Profile {
 const source=profiles.head,result:[number,number,number][]=[]
 for(let i=0;i<source.length-1;i++){
  const a=source[i],b=source[i+1],before=source[Math.max(0,i-1)],after=source[Math.min(source.length-1,i+2)]
  result.push([...a])
  const values=[1,2].map(axis=>{
   const m0=(b[axis]-before[axis])/(b[0]-before[0])*(b[0]-a[0])
   const m1=(after[axis]-a[axis])/(after[0]-a[0])*(b[0]-a[0])
   return THREE.MathUtils.clamp(.5*a[axis]+.125*m0+.5*b[axis]-.125*m1,.01,1)
  })
  result.push([(a[0]+b[0])/2,values[0],values[1]])
 }
 result.push([...source.at(-1)!]);return result
}
const headClose=smoothHead()

function loft(part:Exclude<ParteHumana,'shoe'>,detail:Detail) {
 const hair=part==='hair',head=part==='head'||hair
 const profile=head&&detail==='close'?headClose:profiles[hair?'head':part]
 const segments=detail==='close'?(head||part==='torso'?32:24):head?16:part==='torso'?12:8
 const rows=profile.length
 const positions:number[]=[],colors:number[]=[],uvs:number[]=[],indices:number[]=[]
 for(let row=0;row<rows;row++)for(let j=0;j<=segments;j++){
  const angle=j/segments*Math.PI*2,front=Math.sin(angle)
  // The hair cap follows the cranium. Its edge is high at the forehead,
  // lower behind the ears; the entire face remains smooth and unmarked.
  const hairline=-.04+.20*Math.max(0,front)-.17*Math.max(0,-front)
  // Keep every cranium ring in the cap too. Interpolating only eight
  // unrelated rows would cut across the skull and expose patches of skin.
  const y=hair?Math.max(hairline,profile[row][0]):profile[row][0]
  const [width,depth]=profileAt(profile,y)
  const outset=hair?1.035:1
  const x=.5*width*Math.cos(angle)*outset
  const z=.5*depth*front*outset
  positions.push(x,part==='head'?y*.99:y,z)
  const fabric=part==='torso'||part==='pelvis'
  const fold=fabric?.025*Math.sin(angle*6+y*17)**2:hair?.045*(.5+.5*Math.cos(angle*17+y*23)):0
  const hem=fabric&&y<-.40?.035:0
  const shade=1-fold-hem
  colors.push(shade,shade,shade);uvs.push(j/segments,(y+.5))
 }
 for(let row=0;row<rows-1;row++)for(let j=0;j<segments;j++){
  const a=row*(segments+1)+j,b=a+segments+1
  indices.push(a,b,a+1,a+1,b,b+1)
 }
 // Close the body envelopes, including the small poles. A hair cap has an
 // open hairline touching the head and needs only its crown closed.
 for(const row of hair?[rows-1]:[0,rows-1]){
  const index=positions.length/3,y=positions[row*(segments+1)*3+1]
  positions.push(0,y,0);colors.push(1,1,1);uvs.push(.5,row===0?0:1)
  for(let j=0;j<segments;j++){
   const a=row*(segments+1)+j
   if(row===0)indices.push(index,a,a+1)
   else indices.push(index,a+1,a)
  }
 }
 const geometry=new THREE.BufferGeometry()
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3))
 geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3))
 geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2))
 geometry.setIndex(indices);geometry.computeVertexNormals()
 // Join the lighting seam while retaining separate UV vertices.
 const normals=geometry.getAttribute('normal'),normal=new THREE.Vector3()
 for(let row=0;row<rows;row++){
  const a=row*(segments+1),b=a+segments
  normal.set(normals.getX(a)+normals.getX(b),normals.getY(a)+normals.getY(b),normals.getZ(a)+normals.getZ(b)).normalize()
  normals.setXYZ(a,normal.x,normal.y,normal.z);normals.setXYZ(b,normal.x,normal.y,normal.z)
 }
 return geometry
}

/** Fresh, owned geometry: callers may bake a scale/rotation and dispose it.
 * Suffix humanoShape when baking transforms, so instancing never conflates
 * differently shaped parts. All parts stay inside the unit physical envelope. */
export function geometriaHumana(part:ParteHumana,detail:Detail='close'):THREE.BufferGeometry {
 let geometry:THREE.BufferGeometry
 if(part==='shoe'){
  geometry=new RoundedBoxGeometry(1,1,1,detail==='close'?2:1,.18)
  const position=geometry.getAttribute('position'),colors=new Float32Array(position.count*3)
  for(let i=0;i<position.count;i++){
   const x=position.getX(i),y=position.getY(i),z=position.getZ(i)
   // Lower the toe without moving the flat inner instep where a strike
   // contacts the ball (x=-.5, y=.25, z=0), or lifting the supporting sole.
   const toe=Math.max(0,(z-.10)/.40)
   // Start narrowing beyond the flat side panel. Tapering its corner
   // vertices would recess the entire triangulated instep at z=0 too.
   const toeWidth=Math.max(0,(z-.32)/.18)
   position.setXYZ(i,x*(1-.20*toeWidth*toeWidth),y-.28*toe*toe*Math.max(0,y+.5),z)
   const shade=y<-.29?.62:y>.26?.92:1
   colors.set([shade,shade,shade],i*3)
  }
  geometry.setAttribute('color',new THREE.BufferAttribute(colors,3))
  // RoundedBox already has smooth analytical normals. The small toe slope
  // is incorporated without introducing hard seams between its six patches.
  const normals=geometry.getAttribute('normal'),n=new THREE.Vector3()
  for(let i=0;i<position.count;i++){
   const toe=Math.max(0,(position.getZ(i)-.10)/.40)
   n.fromBufferAttribute(normals,i);n.z+=Math.max(0,n.y)*toe*.4;n.normalize();normals.setXYZ(i,n.x,n.y,n.z)
  }
 }else geometry=loft(part,detail)
 geometry.userData.humanoShape=`faceless-v1:${part}:${detail}`
 geometry.computeBoundingBox();geometry.computeBoundingSphere()
 return geometry
}

/** Tiny owned weave texture; no network, canvas or image raster is involved.
 * Each source owner disposes its maps. Instanced material clones share them. */
export function materialHumano(color:string,kind:'skin'|'fabric'|'hair'|'shoe'|'sole'):THREE.MeshStandardMaterial {
 const roughness={skin:.72,fabric:.92,hair:.81,shoe:.61,sole:.97}[kind]
 const material=new THREE.MeshStandardMaterial({color,roughness,metalness:0,vertexColors:true})
 material.userData.humanoKind=kind
 if(kind==='fabric'){
  const size=32,data=new Uint8Array(size*size*4)
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
   const warp=Math.sin(x*Math.PI/2),weft=Math.cos(y*Math.PI/2),over=((x>>1)+(y>>1))%2
   const value=Math.round(128+16*(over?warp:weft)+5*(over?weft:warp)),i=(y*size+x)*4
   data[i]=data[i+1]=data[i+2]=value;data[i+3]=255
  }
  const texture=new THREE.DataTexture(data,size,size,THREE.RGBAFormat)
  texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(6,6)
  texture.magFilter=THREE.LinearFilter;texture.minFilter=THREE.LinearMipmapLinearFilter;texture.generateMipmaps=true
  texture.userData.humanoTexture='faceless-weave-v1';texture.needsUpdate=true
  material.bumpMap=texture;material.bumpScale=.00065
 }
 return material
}
