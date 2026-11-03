import * as THREE from 'three'
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js'
import {streetDressingPlan,STREET_DRESSING,type StreetPost} from './cidade3d/street-dressing.mjs'
import type {IdentidadeDiaJogo} from './presidencia-identidade-dia-jogo'

/** 🏳️ Dia de jogo em casa: a torcida enfeita as ruas perto do estádio — bandeira do clube nos postes
 * que a cidade já tem e varais de bandeirolas entre postes vizinhos. Fica dentro do grupo do dia de jogo
 * (só aparece quando o clube do usuário MANDA o jogo). Barato de propósito: 4 desenhos no total
 * (bandeiras, suportes, bandeirolas, cordas), uma textura 128×256 compartilhada, sem sombra, sem luz
 * nova e nada por quadro. */
export function criarEnfeitesRuaDiaJogo(parent:THREE.Object3D,scene:THREE.Scene,ground:(x:number,z:number)=>number,onReady:()=>void=()=>{}){
 const root=new THREE.Group();root.name='matchday-street-dressing';parent.add(root)
 const geometries:THREE.BufferGeometry[]=[],materials:THREE.Material[]=[]
 const canvas=document.createElement('canvas');canvas.width=128;canvas.height=256
 const ctx=canvas.getContext('2d')!
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace
 const flagMaterial=new THREE.MeshStandardMaterial({map:texture,emissiveMap:texture,emissive:'#000000',roughness:.92});materials.push(flagMaterial)
 // 🌙 À noite o pano ganha um brilho próprio (só emissivo, sem luz nova) pra cor do clube aparecer no escuro.
 flagMaterial.userData.complexoNightEmission={color:'#ffffff',intensity:.8,dayIntensity:0}
 const metal=new THREE.MeshStandardMaterial({color:'#5d625e',metalness:.55,roughness:.5});materials.push(metal)
 const pennantMaterial=new THREE.MeshStandardMaterial({color:'#ffffff',emissive:'#000000',side:THREE.DoubleSide,roughness:.9});materials.push(pennantMaterial)
 pennantMaterial.userData.complexoNightEmission={color:'#ffffff',intensity:.5,dayIntensity:0}
 // O brilho noturno da bandeirola leva a cor de CADA uma (a cor mora na instância).
 pennantMaterial.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n#if defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR )\n totalEmissiveRadiance *= vColor.rgb;\n#endif')};pennantMaterial.customProgramCacheKey=()=>'matchday-pennant-v1'
 const ropeMaterial=new THREE.LineBasicMaterial({color:'#2b2a26'});materials.push(ropeMaterial)
 let built=false,flags:THREE.InstancedMesh|undefined,brackets:THREE.InstancedMesh|undefined,pennants:THREE.InstancedMesh|undefined,ropes:THREE.LineSegments|undefined
 let plan:ReturnType<typeof streetDressingPlan>={flags:[],strings:[],pennants:[]},key='',crest:HTMLImageElement|undefined,disposed=false,generation=0,identity:IdentidadeDiaJogo|undefined

 /** Os postes vêm da própria cidade (entorno): posição da base + braço que aponta pra rua. */
 const postsOfCity=():StreetPost[]=>{
  const city=scene.getObjectByName('complexo-entorno')
  const positions=(city?.userData.streetLighting?.positions??[]) as {x:number;z:number}[]
  const anchors=(city?.userData.complexoLights??[]) as {id:string;position:number[]}[]
  const heads=new Map(anchors.filter(a=>a.id?.startsWith('poste-rua-')).map(a=>[a.id,a.position]))
  return positions.map((p,i)=>{const h=heads.get(`poste-rua-${i+1}`);return h?{x:p.x,z:p.z,armX:h[0]-p.x,armZ:h[2]-p.z}:{x:p.x,z:p.z}})
 }
 function build(mobile:boolean){
  built=true
  plan=streetDressingPlan(postsOfCity(),{mobile})
  const S=STREET_DRESSING,dummy=new THREE.Object3D()
  if(plan.flags.length){
   // Frente e verso: dois panos de uma face só (o verso girado), assim o nome nunca aparece espelhado.
   const h=S.flagTop-S.flagBottom,front=new THREE.PlaneGeometry(S.flagWidth,h),back=new THREE.PlaneGeometry(S.flagWidth,h);back.rotateY(Math.PI)
   const flagGeometry=mergeGeometries([front,back],false)!;front.dispose();back.dispose();flagGeometry.translate(.1+S.flagWidth/2,S.flagBottom+h/2,0);geometries.push(flagGeometry)
   const bracketGeometry=new THREE.BoxGeometry(S.flagWidth+.16,.035,.035);bracketGeometry.translate((S.flagWidth+.16)/2,0,0);geometries.push(bracketGeometry)
   flags=new THREE.InstancedMesh(flagGeometry,flagMaterial,plan.flags.length);flags.name='matchday-street-flags'
   brackets=new THREE.InstancedMesh(bracketGeometry,metal,plan.flags.length*2);brackets.name='matchday-street-flag-brackets'
   plan.flags.forEach((f,i)=>{
    const y=ground(f.x,f.z)
    // Local +x vira a direção do braço do poste (a bandeira fica de frente pra quem anda na rua).
    dummy.position.set(f.x,y,f.z);dummy.rotation.set(0,Math.atan2(-f.dirZ,f.dirX),0);dummy.scale.set(1,1,1);dummy.updateMatrix();flags!.setMatrixAt(i,dummy.matrix)
    for(const [k,height]of [S.flagBottom,S.flagTop].entries()){dummy.position.set(f.x,y+height,f.z);dummy.updateMatrix();brackets!.setMatrixAt(i*2+k,dummy.matrix)}
   })
   for(const mesh of [flags,brackets]){mesh.castShadow=false;mesh.receiveShadow=false;mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();root.add(mesh)}
  }
  if(plan.pennants.length){
   const shape=new THREE.BufferGeometry();shape.setAttribute('position',new THREE.Float32BufferAttribute([-.17,0,0,.17,0,0,0,-.38,0],3));shape.setIndex([0,2,1]);shape.computeVertexNormals();geometries.push(shape)
   pennants=new THREE.InstancedMesh(shape,pennantMaterial,plan.pennants.length);pennants.name='matchday-street-bunting'
   const ends=plan.strings.map(s=>({ya:ground(s.a.x,s.a.z),yb:ground(s.b.x,s.b.z)}))
   plan.pennants.forEach((p,i)=>{
    const e=ends[p.string],y=e.ya+(e.yb-e.ya)*p.u+S.stringHeight-p.sag
    dummy.position.set(p.x,y,p.z);dummy.rotation.set(0,p.heading-Math.PI/2,0);dummy.updateMatrix();pennants!.setMatrixAt(i,dummy.matrix)
   })
   pennants.instanceMatrix.needsUpdate=true;pennants.computeBoundingSphere();root.add(pennants)
   // Corda: uma geometria só pra todos os varais (curva de 12 pedaços cada).
   const points:number[]=[]
   plan.strings.forEach((s,i)=>{const e=ends[i],n=12;for(let k=0;k<n;k++)for(const u of [k/n,(k+1)/n]){points.push(s.a.x+(s.b.x-s.a.x)*u,e.ya+(e.yb-e.ya)*u+S.stringHeight-S.stringSag*4*u*(1-u),s.a.z+(s.b.z-s.a.z)*u)}})
   const ropeGeometry=new THREE.BufferGeometry();ropeGeometry.setAttribute('position',new THREE.Float32BufferAttribute(points,3));ropeGeometry.computeBoundingSphere();geometries.push(ropeGeometry)
   ropes=new THREE.LineSegments(ropeGeometry,ropeMaterial);ropes.name='matchday-street-bunting-rope';root.add(ropes)
  }
 }
 const ink=(color:THREE.Color)=>color.r*.2126+color.g*.7152+color.b*.0722>.45?'#14201c':'#f4ecd6'
 function paint(){
  if(!identity)return
  const main=new THREE.Color(identity.color),second=identity.secondaryColor??ink(main),w=canvas.width,h=canvas.height
  ctx.clearRect(0,0,w,h);ctx.fillStyle=identity.color;ctx.fillRect(0,0,w,h)
  ctx.fillStyle=second;ctx.fillRect(0,h*.06,w,h*.07);ctx.fillRect(0,h*.87,w,h*.07)
  const square=w*.78,x=(w-square)/2,y=h*.22
  if(crest){ctx.fillStyle='#f4ecd6';ctx.beginPath();ctx.roundRect(x,y,square,square,square*.12);ctx.fill();const fit=Math.min(square*.86/crest.naturalWidth,square*.86/crest.naturalHeight);ctx.drawImage(crest,x+(square-crest.naturalWidth*fit)/2,y+(square-crest.naturalHeight*fit)/2,crest.naturalWidth*fit,crest.naturalHeight*fit)}
  else{ctx.fillStyle=second;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 54px sans-serif';const initials=identity.name.split(/\s+/).filter(word=>word.length>2||/^[A-Z]/.test(word)).map(word=>word[0]).join('').slice(0,3).toUpperCase()||identity.name.slice(0,2).toUpperCase();ctx.fillText(initials,w/2,y+square/2,w-12)}
  // Nome do clube em pé, embaixo do escudo (fonte pequena: de longe vira faixa colorida, de perto lê).
  ctx.save();ctx.translate(w/2,h*.72);ctx.fillStyle=ink(main);ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 17px sans-serif';ctx.fillText(identity.name.toUpperCase(),0,0,w-10);ctx.restore()
  texture.needsUpdate=true
  if(pennants){const colors=[new THREE.Color(identity.color),new THREE.Color(second),new THREE.Color('#f4ecd6')];plan.pennants.forEach((p,i)=>pennants!.setColorAt(i,colors[p.color%colors.length]));if(pennants.instanceColor)pennants.instanceColor.needsUpdate=true}
  onReady()
 }
 return{root,
  /** home = o clube que manda o jogo (o do usuário quando a cidade é a dele). */
  configure(home:IdentidadeDiaJogo|undefined,mobile:boolean){
   if(disposed||!home)return
   if(!built)build(mobile)
   const next=JSON.stringify([home.name,home.color,home.secondaryColor,home.crest])
   if(next===key)return
   key=next;identity={...home};crest=undefined;const own=++generation;paint()
   void(async()=>{
    try{
     const url=home.crest??(await import('./presidencia-sala-identidade-assets')).arteEscudoClube(home.name)
     if(!url||disposed||own!==generation)return
     const image=new Image();image.crossOrigin='anonymous'
     const ok=await new Promise<boolean>(resolve=>{image.onload=()=>resolve(true);image.onerror=()=>resolve(false);image.src=url})
     if(ok&&!disposed&&own===generation){crest=image;paint()}
    }catch{/* sem escudo: fica a bandeira com as cores e as iniciais */}
   })()
  },
  inspect:()=>({flags:plan.flags.length,strings:plan.strings.length,pennants:plan.pennants.length,identity:identity?.name,color:identity?.color,crest:!!crest,
   drawCalls:[flags,brackets,pennants,ropes].filter(Boolean).length,flagPosts:plan.flags.map(f=>({x:f.x,z:f.z,dirX:f.dirX,dirZ:f.dirZ}))}),
  dispose(){disposed=true;root.removeFromParent();flags?.dispose();brackets?.dispose();pennants?.dispose();geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());texture.dispose()}}
}
