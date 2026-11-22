import type {EscState} from './types'

/** Presentation only: the running round is round-1; round is the next fixture. */
export function footballRoundStatus(state:Pick<EscState,'round'|'fixtures'|'lastResults'|'league'>,youId:number){
 const match=state.lastResults.find(r=>r.homeId===youId||r.awayId===youId)
 const current=state.round>0?state.fixtures[state.round-1]:undefined
 const kind=state.round===0?'waiting':match?'playing':state.league.length%2===1&&current&&current.length===Math.floor(state.league.length/2)&&!current.some(([h,a])=>h===youId||a===youId)?'bye':'unavailable'
 let next:{round:number;opponent:string;home:boolean}|undefined
 for(let i=state.round;i<state.fixtures.length&&!next;i++){
  const game=state.fixtures[i].find(([h,a])=>h===youId||a===youId)
  if(game)next={round:i+1,opponent:state.league.find(t=>t.id===(game[0]===youId?game[1]:game[0]))?.name??'—',home:game[0]===youId}
 }
 return{kind,match,next,round:state.round,clubs:state.league.length,others:state.lastResults.filter(r=>r.homeId!==youId&&r.awayId!==youId)}
}
export type FootballRoundStatus=ReturnType<typeof footballRoundStatus>
