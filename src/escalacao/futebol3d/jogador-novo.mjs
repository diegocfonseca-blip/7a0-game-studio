// 🧍 27/10 — JOGADOR NOVO do 3D: o boneco feito no Meshy (traço da carta, sem rosto) com esqueleto Mixamo e os movimentos de
// futebol de verdade do Mixamo (passe, condução, chute, cabeçada, carrinho, lateral, goleiro…). A roupa vem branca e é pintada
// aqui com as cores do TIME em que ele joga (Diego: "o Pirlo no Neymarzetti veste a camisa do Neymarzetti"), pela máscara
// jogador-roupa.png (R camisa · G calção · B meião). Arquivos montados por scripts/futebol3d/monta-jogador.mjs.
import * as T from 'three'
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js'
import {clone} from 'three/addons/utils/SkeletonUtils.js'
export const ALTURA_JOGADOR=1.78
let pronto=null
/** Carrega uma vez (cacheado): boneco + movimentos + máscara da roupa + dados dos movimentos. */
export function carregaJogadorNovo(base=(import.meta.env?.BASE_URL??'/')){
 pronto??=(async()=>{
  const [gltf,mask,meta]=await Promise.all([
   new GLTFLoader().loadAsync(base+'futebol3d/jogador.glb'),
   new T.TextureLoader().loadAsync(base+'futebol3d/jogador-roupa.png'),
   fetch(base+'futebol3d/jogador-meta.json').then(r=>r.json()),
  ])
  let mesh;gltf.scene.traverse(o=>{if(o.isSkinnedMesh)mesh=o})
  mask.flipY=true;mask.colorSpace=T.NoColorSpace // (a máscara fica na convenção da textura original do FBX; o GLB vira a imagem dele ao exportar)
  const clips=new Map(gltf.animations.map(c=>[c.name,c]))
  const bb=new T.Box3().setFromObject(gltf.scene),escala=ALTURA_JOGADOR/bb.getSize(new T.Vector3()).y
  return{gltf,mask,meta,clips,escala}
 })()
 return pronto
}
/** Material com a roupa pintada: onde a máscara marca camisa/calção/meião, a cor branca da textura vira a cor do clube. */
function materialRoupa(base,mask,cores){
 const m=base.clone(),u={camisa:{value:new T.Color(cores.camisa)},calcao:{value:new T.Color(cores.calcao)},meiao:{value:new T.Color(cores.meiao)},mascara:{value:mask},
  pele:{value:new T.Color(cores.pele??'#ffffff')},cabelo:{value:new T.Color(cores.cabelo??'#ffffff')},careca:{value:cores.careca?1:0}}
 // alfa da máscara: 0 cabelo · .5 pele · 1 resto. A pele ganha o tom da lenda; o cabelo, a cor dele — e no careca o fio vira
 // pele lisa (o cabelo já encolheu até o crânio pelo alvo de forma "careca" do GLB).
 const FRAG=`{vec4 m4=texture2D(mascara,vMapUv);vec3 mk=m4.rgb;float fio=clamp(1.-m4.a*2.,0.,1.),cute=clamp(1.-abs(m4.a-.5)*4.,0.,1.);
  vec3 lisa=vec3(.78,.45,.27)*pele;diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*pele,cute);
  diffuseColor.rgb=mix(diffuseColor.rgb,mix(diffuseColor.rgb*cabelo,lisa,careca),fio);
  float k=clamp(mk.r+mk.g+mk.b,0.,1.);vec3 tinta=(camisa*mk.r+calcao*mk.g+meiao*mk.b)/max(k,1e-3);diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*tinta,k);}`
 m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,u)
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform vec3 camisa;uniform vec3 calcao;uniform vec3 meiao;uniform sampler2D mascara;uniform vec3 pele;uniform vec3 cabelo;uniform float careca;')
   .replace('#include <map_fragment>','#include <map_fragment>\n'+FRAG)}
 m.customProgramCacheKey=()=>'jogador-roupa2'
 m.userData.cores=u
 return m
}
/** Um jogador (clone do esqueleto, mixer próprio). `cores` em CSS (#rrggbb). */
export function criarJogadorNovo(asset,cores){
 const root=clone(asset.gltf.scene),holder=new T.Group();holder.name='jogador-novo';holder.add(root);root.scale.multiplyScalar(asset.escala)
 let mesh;root.traverse(o=>{if(o.isSkinnedMesh){mesh=o;o.frustumCulled=false;o.castShadow=true;o.receiveShadow=true}})
 mesh.material=materialRoupa(mesh.material,asset.mask,cores)
 if(mesh.morphTargetInfluences)mesh.morphTargetInfluences[0]=cores.careca?1:0
 const mixer=new T.AnimationMixer(root),acoes=new Map()
 const acao=nome=>{let a=acoes.get(nome);if(!a){const c=asset.clips.get(nome);if(!c)return null;a=mixer.clipAction(c);acoes.set(nome,a)}return a}
 return{holder,root,mesh,mixer,acao,
  setCores(c){const u=mesh.material.userData.cores;u.camisa.value.set(c.camisa);u.calcao.value.set(c.calcao);u.meiao.value.set(c.meiao);if(c.pele)u.pele.value.set(c.pele);if(c.cabelo)u.cabelo.value.set(c.cabelo);u.careca.value=c.careca?1:0;if(mesh.morphTargetInfluences)mesh.morphTargetInfluences[0]=c.careca?1:0},
  dispose(){mixer.stopAllAction();mixer.uncacheRoot(root);mesh.material.dispose();holder.removeFromParent()}}
}
