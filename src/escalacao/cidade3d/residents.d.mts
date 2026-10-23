import type {Scene,Object3D,Camera,Group} from 'three'
export function createResidents(scene:Scene,environment:Object3D,solids:Array<{base:number;top:number;minX:number;maxX:number;minZ:number;maxZ:number}>):{
 root:Group;count():number;configure(value:{enabled:boolean;supporters?:number;built?:number;mobile?:boolean}):void;update(seconds:number,camera?:Camera):void;inspect():unknown;dispose():void
}
