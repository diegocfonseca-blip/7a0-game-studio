import type {EntradaM2} from './motor2/carreira'
import {transcreverPartidaOficial,type GolRelato,type RelatoOficial} from './partida-relato-oficial'
type ReplayConferido={valid:boolean;endMinute:number;goals:ReadonlyArray<{home:boolean;minute:number}>;relato:RelatoOficial}
const cache=new Map<string,ReplayConferido>()
// 🅰️ 07/11 (Diego: "caiu numa quarta de copa… mostrou o placar cinema, não tá com campinho"): a assistência NÃO entra na conferência.
// O save não guarda assistência de jogador de mentira (regra de 19/09) e o motor sim — na Várzea (cheia de filler) quase todo jogo
// reprovava e o campinho sumia. Quem decide o placar é quem fez o gol e o minuto; isso continua tendo que bater exatamente.
const ordered=(goals:readonly GolRelato[])=>goals.map(g=>({home:g.home,name:g.name,min:g.min})).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)))
/** Historical results remain authoritative. Never rewrite a saved result or
 * force a newer replay to match it. All presentations consume this transcript. */
export function prepararReplayOficial(input:EntradaM2,goals:readonly GolRelato[],en=false):ReplayConferido{
 const expected=ordered(goals),key=JSON.stringify([input,expected,en])
 if(cache.has(key))return cache.get(key)!
 const relato=transcreverPartidaOficial(input,en),last=relato.frames.at(-1)!
 const valid=last.finished&&JSON.stringify(ordered(relato.goals))===JSON.stringify(expected)&&last.score[0]===goals.filter(g=>g.home).length&&last.score[1]===goals.filter(g=>!g.home).length
 if(cache.size>=24)cache.delete(cache.keys().next().value!)
 const result=Object.freeze({valid,endMinute:relato.endMinute,relato,goals:Object.freeze(relato.events.filter(e=>e.tipo==='gol').map(e=>Object.freeze({home:e.lado===0,minute:e.t/(90/93)})))})
 cache.set(key,result);return result
}
export function replayOficialDisponivel(input:EntradaM2,goals:readonly GolRelato[]){return prepararReplayOficial(input,goals).valid}
