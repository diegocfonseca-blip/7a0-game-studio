import assert from 'node:assert/strict'
import * as T from 'three'
import {materialDifusoLeve,simplificarMateriaisCampo} from '../src/escalacao/presidencia-material-difuso-leve.ts'
const source=new T.MeshStandardMaterial({color:'#225588',roughness:.9,map:new T.Texture(),normalMap:new T.Texture(),vertexColors:true,side:T.DoubleSide,alphaTest:.1}),uniform={value:2}
source.userData.u={uniform};source.onBeforeCompile=shader=>{shader.uniforms.test=uniform};source.customProgramCacheKey=()=>'uniforme-original'
const result=materialDifusoLeve(source);assert(result instanceof T.MeshLambertMaterial)
assert.equal(result.map,source.map);assert.equal(result.normalMap,source.normalMap);assert.equal(result.color,source.color)
assert.equal(result.side,source.side);assert.equal(result.alphaTest,source.alphaTest);assert.equal(result.vertexColors,true)
source.color.set('#aa9944');assert.equal(result.color.getHexString(),'aa9944','troca de cor continua chegando ao desenho')
const shader={uniforms:{}} as Parameters<T.Material['onBeforeCompile']>[0];result.onBeforeCompile(shader,{} as T.WebGLRenderer);assert.equal(shader.uniforms.test,uniform)
assert.equal(materialDifusoLeve(new T.MeshStandardMaterial({metalness:1})).type,'MeshStandardMaterial','superfície metálica não perde reflexão')
const vidro=new T.MeshPhysicalMaterial({roughness:1,transmission:1});assert.equal(materialDifusoLeve(vidro),vidro,'vidro e revestimentos físicos não são simplificados')
const root=new T.Group(),old=new T.MeshStandardMaterial({roughness:1}),a=new T.Mesh(new T.BoxGeometry(),old),b=new T.Mesh(new T.BoxGeometry(),old);root.add(a,b)
let oldDisposals=0,newDisposals=0;old.addEventListener('dispose',()=>oldDisposals++)
const release=simplificarMateriaisCampo(root);assert.equal(a.material,b.material,'material compartilhado continua único');a.material.addEventListener('dispose',()=>newDisposals++)
release('originais');assert.equal(oldDisposals,1);assert.equal(newDisposals,0);a.material.dispose();assert.equal(newDisposals,1);release('originais');assert.equal(oldDisposals,1)
assert.equal(root.children.length,2);assert.equal(a.geometry.index!.count,36)
console.log('PASS materiais: textura, cor, uniforme, recorte, luz e geometria mantidos; metal preservado; recursos sem duplicação')

const preserveRoot=new T.Group(),roof=new T.MeshStandardMaterial({roughness:1}),cement=new T.MeshStandardMaterial({roughness:1});preserveRoot.add(new T.Mesh(new T.BoxGeometry(),roof),new T.Mesh(new T.BoxGeometry(),cement));const releasePreserved=simplificarMateriaisCampo(preserveRoot,m=>m===roof);assert.equal(preserveRoot.children[0].material,roof,'cobertura mantém controle próprio');assert(preserveRoot.children[1].material instanceof T.MeshLambertMaterial);releasePreserved();
