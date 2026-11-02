import type {CityPoint} from './activity-route.mjs'
export const TEAM_COACH:{length:number;width:number;height:number;wheelRadius:number;floorHeight:number;axles:number[];door:{side:-1;longitudinal:number;width:number}}
export const COACH_BAY:{x:number;z:number;heading:number;wallX:number}
export function roundCoachRoute(vertices:readonly {x:number;z:number}[],radius?:number):CityPoint[]
export function teamCoachAccess():{bay:typeof COACH_BAY;inbound:CityPoint[];outbound:CityPoint[];passenger:CityPoint[];publicTerminalUsed:false;minimumWallClearance:number}
