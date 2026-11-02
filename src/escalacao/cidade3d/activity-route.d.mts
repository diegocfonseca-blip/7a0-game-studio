export type CityPoint={x:number;y:number;z:number}
export type CityPose=CityPoint & {heading:number;speed:number;distance:number;done:boolean}
export function activityRoute(points:readonly CityPoint[],speed?:number,ramp?:number):{length:number;duration:number;points:readonly CityPoint[];at(seconds:number):CityPose}
export function customerJourney(points:readonly CityPoint[],options?:{speed?:number;stay?:number;wait?:number;turnAtExit?:boolean}):{at(seconds:number):CityPose & {phase:string};period:number;inbound:ReturnType<typeof activityRoute>;outbound:ReturnType<typeof activityRoute>}
