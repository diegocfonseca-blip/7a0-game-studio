import type {AnimationAction,AnimationClip,AnimationMixer,Group,SkinnedMesh,Texture} from 'three'
import type {GLTF} from 'three/addons/loaders/GLTFLoader.js'
export const ALTURA_JOGADOR:number
export type JogadorAsset={gltf:GLTF;regioes:Texture;meta:{clips:Record<string,{toque?:number;duration?:number}>};clips:Map<string,AnimationClip>;escala:number}
export function carregaJogadorNovo(base?:string):Promise<JogadorAsset>
export function criarJogadorNovo(asset:JogadorAsset,ficha:Record<string,unknown>,pele?:string|null):{
 holder:Group;root:Group;mesh:SkinnedMesh;mixer:AnimationMixer;acao:(nome:string)=>AnimationAction|null;
 setUniforme:(ficha:Record<string,unknown>)=>void;setPele:(css:string)=>void;setDebug:(on:boolean)=>void;dispose:()=>void
}
