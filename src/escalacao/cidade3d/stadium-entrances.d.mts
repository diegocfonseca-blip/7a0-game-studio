import type {CityPoint} from './activity-route.mjs'
export type StadiumGate={readonly id:string;readonly approach:{x:number;z:number};readonly threshold:{x:number;z:number};readonly inside:{x:number;z:number};readonly heading:number;readonly width:number;readonly height:number;readonly floor:number}
export const STADIUM_SERVICE_GATE:StadiumGate
export const STADIUM_HOME_GATE:StadiumGate
export const STADIUM_AWAY_GATE:StadiumGate
export const STADIUM_ENTRANCES:readonly {readonly id:string;readonly role:string;readonly gate:StadiumGate;readonly label:string;readonly allowed:readonly string[]}[]
export function entrancesForViewer(side?:'home'|'away'):typeof STADIUM_ENTRANCES
export function entranceForRole(role:string,viewerSide?:'home'|'away'):typeof STADIUM_ENTRANCES[number]|undefined
export function serviceExitPoints(lane:number):CityPoint[]
