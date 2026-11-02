export interface GroundStep {
 t:number;owner?:string;keeper:boolean;restart:boolean;ownedFor:number;speed:number;
 ball:{x:number;y:number;h:number;vx:number;vy:number;vh:number};
}
export interface SourceGroundTouch {
 t:number;key:string;ball:{x:number;y:number;z:number};
 velocity:{x:number;z:number};incoming:{x:number;z:number};integrationError:number;impulse:number;
}
export function sourceGroundTouch(before:GroundStep|null,after:GroundStep,{friction}?:{friction?:number}):SourceGroundTouch|null;
