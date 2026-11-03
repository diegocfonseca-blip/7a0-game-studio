export const STREET_DRESSING:{
 readonly focus:{x:number;z:number};readonly maxDistance:number
 readonly flags:{desktop:number;mobile:number};readonly strings:{desktop:number;mobile:number}
 readonly stringMin:number;readonly stringMax:number
 readonly flagBottom:number;readonly flagTop:number;readonly flagWidth:number
 readonly stringHeight:number;readonly stringSag:number;readonly pennantSpacing:number;readonly pennantColors:number
}
export type StreetPost={x:number;z:number;armX?:number;armZ?:number}
export type StreetDressingPlan={
 flags:{post:number;x:number;z:number;dirX:number;dirZ:number;heading:number}[]
 strings:{a:{x:number;z:number};b:{x:number;z:number};length:number}[]
 pennants:{string:number;u:number;x:number;z:number;sag:number;heading:number;color:number}[]
}
export function streetDressingPlan(posts:readonly StreetPost[]|undefined,options?:{mobile?:boolean}):StreetDressingPlan
