import * as THREE from 'three'

/** Soil detail evaluated in field coordinates, so adjacent construction strips
 * have neither seams nor stretched grains. No new image downloads at zoom. */
export function materialSolo3D(){
 const mat=new THREE.MeshStandardMaterial({color:'#99774f',roughness:1})
 mat.customProgramCacheKey=()=> 'presidencia-soil-v1'
 mat.onBeforeCompile=shader=>{
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec2 vSoilUv;')
   .replace('#include <begin_vertex>','#include <begin_vertex>\nvSoilUv=uv;')
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
varying vec2 vSoilUv;
float soilHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float soilNoise(vec2 p){
 vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);
 return mix(mix(soilHash(i),soilHash(i+vec2(1.0,0.0)),f.x),mix(soilHash(i+vec2(0.0,1.0)),soilHash(i+vec2(1.0,1.0)),f.x),f.y);
}`)
   .replace('#include <color_fragment>',`#include <color_fragment>
 vec2 soilPoint=vSoilUv*vec2(105.0,68.0);
 float patches=soilNoise(soilPoint*0.7);
 float grit=soilNoise(soilPoint*16.0);
 // Fade subpixel grains when far away, avoiding shimmer while panning.
 float detail=1.0-smoothstep(0.025,0.12,length(fwidth(soilPoint)));
 diffuseColor.rgb*=0.78+0.36*patches+detail*(grit-0.5)*0.16;
`)
 }
 return mat
}
