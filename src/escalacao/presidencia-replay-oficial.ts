import {novoMotor2,type EntradaM2} from './motor2/carreira'
type GolOficial={home:boolean;name:string;min:number}
type ReplayConferido={valid:boolean;endMinute:number;goals:ReadonlyArray<{home:boolean;minute:number}>}
const cache=new Map<string,ReplayConferido>()
const ordered=(goals:GolOficial[])=>goals.map(g=>({home:g.home,name:g.name,min:g.min})).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)))
/** Historical results can be frozen in the save while the engine evolves.
 * Validate a read-only replay, never rewrite the saved result or invent goals
 * to force a new trajectory to end with an old score. */
export function prepararReplayOficial(input:EntradaM2,goals:readonly GolOficial[]):ReplayConferido{
 const expected=ordered([...goals]),key=JSON.stringify([input,expected])
 if(cache.has(key))return cache.get(key)!
 const game=novoMotor2(structuredClone(input));game.avancaAte(120)
 const actual=ordered(game.eventos.filter(e=>e.tipo==='gol').map(e=>({home:e.lado===0,name:e.a??'',min:Math.min(93,Math.floor(e.t/(90/93))+1)})))
 const valid=game.fim&&JSON.stringify(actual)===JSON.stringify(expected)&&game.placar[0]===goals.filter(g=>g.home).length&&game.placar[1]===goals.filter(g=>!g.home).length
 if(cache.size>=24)cache.delete(cache.keys().next().value!)
 const result=Object.freeze({valid,endMinute:game.t/(90/93),goals:Object.freeze(game.eventos.filter(e=>e.tipo==='gol').map(e=>Object.freeze({home:e.lado===0,minute:e.t/(90/93)})))})
 cache.set(key,result);return result
}

export function replayOficialDisponivel(input:EntradaM2,goals:readonly GolOficial[]){return prepararReplayOficial(input,goals).valid}
