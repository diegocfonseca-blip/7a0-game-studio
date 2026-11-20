import type {NivelMapa} from './presidencia-mapa-qualidade'

/** Presentation only. Never changes the match clock, result, roster or save. */
export function manterFocoNaPartida(input:{session:boolean;started?:boolean;finished:boolean;level:NivelMapa;software:boolean;samples:number;meanGap:number}){
 return input.session&&input.started!==false&&(!input.finished||input.level==='leve'||input.software||input.samples<45||input.meanGap>45)
}

/** A retained final frame must not lock the city on the next career day. */
export function mesmaSessaoDeMapa(session:{key:string;day?:number}|null,key:string,day:number|undefined){
 return !!session&&session.key===key&&session.day===day
}
