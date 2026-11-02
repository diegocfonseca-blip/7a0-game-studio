/** Presentation time only: never advances a fixture, attendance or inventory. */
export const PREGAME={streets:18,operationsEnd:60,delegations:75,clear:390};
export function pregameFrame(day){
 const active=!!day?.active&&day.phase==='arrival'&&!day.joinedLate;
 const t=day?.elapsed??0;
 return{active,elapsed:t,operations:active&&t<PREGAME.operationsEnd,streets:active&&t>=PREGAME.streets,delegations:active&&t>=PREGAME.delegations,setup:active?Math.max(0,Math.min(1,(t-PREGAME.streets)/18)):1};
}
