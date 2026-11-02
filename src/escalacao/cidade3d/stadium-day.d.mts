import type {JornadaComplexo} from '../presidencia-complexo-jornada'
export const STADIUM_DAY:{gatesOpen:number;coaches:number;returnCoaches:number;cleanup:number;close:number}
export type StadiumDayFrame={key:string;phase:string;elapsed:number;phaseElapsed:number;phaseOrigin:number;joinedLate:boolean;active:boolean;gatesOpen:boolean;setup:number;pack:number;standFill:number;trade:string;stage:string}
export function stadiumDayClock():{update(journey:JornadaComplexo|undefined,time:number):StadiumDayFrame}
export function coachReturnSchedule(options:{inbound:number;outbound:number;boarding:number;spacing?:number}):{open:number;lastBoard:number;close:number;depart:number;slot:number;end:number}
export function warmupLane(origin:import('./activity-route.mjs').CityPoint):{period:number;at(time:number):{x:number;y:number;z:number;heading:number;speed:number;distance:number;done:boolean}}
