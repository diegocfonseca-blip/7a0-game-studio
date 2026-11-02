import * as THREE from 'three'
import type {AssentoComplexo} from './presidencia-complexo-arquitetura'
import {criarArteDiaJogo,type IdentidadeDiaJogo} from './presidencia-identidade-dia-jogo'

/** Cloth only moves; athletes' rigs and the seating allocation stay intact. */
export function criarBandeirasDiaJogo(parent:THREE.Object3D,seats:readonly AssentoComplexo[],onReady:()=>void=()=>{}){
 const root=new THREE.Group();root.name='matchday-flags';parent.add(root)
 const uniforms={time:{value:0}},geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>(),textures:THREE.Texture[]=[]
 const poleGeometry=new THREE.CylinderGeometry(.022,.027,2.7,6),flagGeometry=new THREE.PlaneGeometry(1.65,.95,8,4);flagGeometry.translate(.84,2.15,0);geometries.add(poleGeometry);geometries.add(flagGeometry)
 const poleMaterial=new THREE.MeshStandardMaterial({color:'#b0ada2',metalness:.6,roughness:.5});materials.add(poleMaterial)
 const canvasFor=(name:string,color:string)=>{const cv=document.createElement('canvas');cv.width=512;cv.height=256;const ctx=cv.getContext('2d')!;ctx.fillStyle=color;ctx.fillRect(0,0,512,256);ctx.fillStyle='#efe9d7';ctx.fillRect(0,102,512,52);ctx.fillStyle='#101a16';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 42px sans-serif';ctx.fillText(name,256,128,478);return cv}
 const teams=(['home','away'] as const).map(side=>{
  const texture=new THREE.CanvasTexture(canvasFor(side==='home'?'MANDANTES':'VISITANTES',side==='home'?'#eeeeee':'#b83228'));texture.colorSpace=THREE.SRGBColorSpace;textures.push(texture)
  const material=new THREE.MeshStandardMaterial({map:texture,side:THREE.DoubleSide,roughness:.94});materials.add(material)
  material.onBeforeCompile=shader=>{shader.uniforms.matchdayTime=uniforms.time;shader.vertexShader='uniform float matchdayTime;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n float freeEdge=clamp(uv.x,0.0,1.0); transformed.z += sin(freeEdge*7.0+position.y*2.2-matchdayTime*2.1)*0.13*freeEdge; transformed.y += cos(freeEdge*5.0-matchdayTime*1.8)*0.025*freeEdge;')};material.customProgramCacheKey=()=> 'matchday-flag-v1'
  const anchors=seats.filter(s=>s.tier==='lower'&&s.row===0&&(side==='away'?s.sector==='visitante':s.sector==='geral'||s.sector==='cadeiras'))
  const chosen=anchors.length?[anchors[Math.floor(anchors.length*.2)],anchors[Math.floor(anchors.length*.5)],anchors[Math.floor(anchors.length*.8)]]:[]
  for(const seat of chosen){const holder=new THREE.Group();holder.position.set(seat.position.x+Math.sin(seat.heading)*.50,seat.position.y+.03,seat.position.z+Math.cos(seat.heading)*.50);holder.rotation.y=seat.heading;root.add(holder);const pole=new THREE.Mesh(poleGeometry,poleMaterial);pole.position.y=1.35;holder.add(pole);const flag=new THREE.Mesh(flagGeometry,material);holder.add(flag)}
  // Entrance flags identify both sides even at a small stadium stage.
  const gate=new THREE.Group();gate.position.set(side==='home'?-7:108,.16,side==='home'?89:11);gate.rotation.y=side==='home'?0:Math.PI/2;root.add(gate);const pole=new THREE.Mesh(poleGeometry,poleMaterial);pole.position.y=1.35;gate.add(pole,new THREE.Mesh(flagGeometry,material))
  return{side,texture,material,art:undefined as ReturnType<typeof criarArteDiaJogo>|undefined,count:chosen.length+1,key:''}
 })
 return{root,configure(info:IdentidadeDiaJogo[]){for(const [i,team]of teams.entries()){const data=info[i];if(!data)continue;const key=JSON.stringify([data.name,data.color,data.secondaryColor,data.crest]);if(key!==team.key){team.art?.dispose();team.art=criarArteDiaJogo(data,'flag',onReady);team.material.map=team.art.texture;team.material.needsUpdate=true;team.key=key}}},update(time:number){uniforms.time.value=time},inspect:()=>teams.map(t=>({side:t.side,flags:t.count,identity:t.key,art:t.art?.inspect()})),dispose(){root.removeFromParent();teams.forEach(t=>t.art?.dispose());geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose())}}
}
