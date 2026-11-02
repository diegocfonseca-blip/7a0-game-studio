import type {Group,Object3D,SkinnedMesh,AnimationMixer,AnimationAction} from 'three'
/** Shared immutable loaded asset; callers must use the provided actor factory. */
export function carregaJogadorNovo():Promise<unknown>
export function criarJogadorNovo(asset:unknown,kit:unknown):{holder:Group;root:Object3D;mesh:SkinnedMesh;mixer:AnimationMixer;acao(name:string):AnimationAction|null;dispose():void;updateFrustumBounds():void}
