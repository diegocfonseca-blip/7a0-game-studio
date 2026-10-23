import type {Object3D,Group} from 'three'
export const CIVILIAN_VARIANTS:ReadonlyArray<{id:string;file:string;height:number;sex:string;age:string;body?:string;provisional?:boolean}>
export function createCivilian(parent:Object3D,options?:{id?:string;variant?:string;onReady?:()=>void}):{
 root:Group;ready:Promise<boolean>;update(frame:{seconds:number;distance?:number;speed?:number;seated?:number;transition?:string;visible?:boolean;detail?:string},force?:boolean):void;
 inspect():{id:string;variant:string;source:string;height:number;ready:boolean;provisional:boolean;animations:string;poseUpdates:number;measuredHeight:number|null;footFloor:number|null;errors:string[]};dispose():void
}
