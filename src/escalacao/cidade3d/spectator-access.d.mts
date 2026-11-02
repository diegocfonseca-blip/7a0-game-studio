import type {CityPoint} from './activity-route.mjs'
type PublicGate={threshold:{x:number;z:number};heading:number;floor?:number}
export function publicGateDestination(gate:PublicGate,inset?:number):CityPoint
export function isPlayerServiceArea(point:{x:number;z:number;y?:number}):boolean
export function spectatorVisibleAt(point:{x:number;z:number;y?:number}|undefined,side:'home'|'away',gate:PublicGate):boolean
export function intervalSpectatorPoints(side:'home'|'away',gate:PublicGate):CityPoint[]
