import type {CityPoint} from './activity-route.mjs'
export const MATCHDAY_COACH_DELAY:number
export const MATCHDAY_STALLS:ReadonlyArray<{id:string;label:string;kind:string;x:number;z:number;side:string;color:string}>
export function matchdayFanPoints(side:'home'|'away',index?:number):CityPoint[]
export function matchdayStage(elapsed:number,phase:string,entered:boolean):string
export function stadiumExteriorVisible(position:{x:number;z:number},gate:{threshold:{x:number;z:number};heading:number},previous?:boolean,clearance?:number):boolean
