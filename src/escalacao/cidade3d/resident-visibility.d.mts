import type {Vector3,Camera} from 'three'
export function residentVisibility(position:Vector3,height:number,camera?:Camera,viewportHeight?:number):{visible:boolean;detail:string;pixels:number|null}
