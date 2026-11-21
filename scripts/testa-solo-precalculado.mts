import assert from 'node:assert/strict'
import * as T from 'three'
import {materialSolo3D} from '../src/escalacao/presidencia-solo-3d.ts'
import {simplificarMateriaisCampo} from '../src/escalacao/presidencia-material-difuso-leve.ts'
// Só os downloads são substituídos; materiais, shaders e descarte são os reais.
;(globalThis as any).ImageData=class{data:Uint8ClampedArray;width:number;height:number;constructor(data:Uint8ClampedArray,width:number,height:number){this.data=data;this.width=width;this.height=height}}
const original=T.TextureLoader.prototype.load,queue: (()=>void)[]=[],textures:T.Texture[]=[],disposals=new Map<T.Texture,number>()
T.TextureLoader.prototype.load=function(url,onLoad){assert(/solo-campo-(perto|medio|longe)-v1\.webp/.test(String(url)));const t=new T.Texture();textures.push(t);t.addEventListener('dispose',()=>disposals.set(t,(disposals.get(t)??0)+1));queue.push(()=>onLoad?.(t));return t}
try{
 let ready=0
 const soil=materialSolo3D(false,()=>ready++),root=new T.Group();root.add(new T.Mesh(new T.PlaneGeometry(1,1),soil))
 assert.equal(textures.length,3);for(const t of textures){assert.equal(t.colorSpace,T.SRGBColorSpace);assert.equal(t.image.width,1);assert.equal(t.image.data[3],255)}
 queue.splice(0).forEach(fn=>fn());assert.equal(ready,3)
 const release=simplificarMateriaisCampo(root),mat=(root.children[0] as T.Mesh).material as T.MeshLambertMaterial
 assert(mat instanceof T.MeshLambertMaterial);assert.equal(mat.map,soil.map);assert.equal(mat.userData,soil.userData)
 const shader={uniforms:{},vertexShader:'',fragmentShader:'#include <common>\n#include <map_fragment>'} as Parameters<T.Material['onBeforeCompile']>[0]
 mat.onBeforeCompile(shader,{} as T.WebGLRenderer);assert.equal((shader.uniforms.soloMedio as any).value,textures[1]);assert.equal((shader.uniforms.soloLonge as any).value,textures[2]);assert(!shader.fragmentShader.includes('soilFbm'))
 release('originais');assert.equal(disposals.size,3);for(const t of textures)assert.equal(disposals.get(t),1,'somente a alocação provisória é descartada ao carregar')
 const found=new Set<T.Texture>([mat.map!,...mat.userData.extraTextures]);for(const t of found){t.userData.disposed=true;t.dispose()}
 for(const t of textures)assert.equal(disposals.get(t),2,'cada uma das duas alocações tem um descarte')
 const next=materialSolo3D(false,()=>ready++);for(const t of [next.map,...next.userData.extraTextures]){t!.userData.disposed=true;t!.dispose()};queue.splice(0).forEach(fn=>fn());assert.equal(ready,3,'carga atrasada não acorda mapa já destruído')
 assert.equal(materialSolo3D(true).map,null,'solo legado continua sem downloads novos')
 console.log('PASS solo: três texturas válidas, shader leve conserva níveis, recursos compartilhados e carga tardia segura')
}finally{T.TextureLoader.prototype.load=original}
