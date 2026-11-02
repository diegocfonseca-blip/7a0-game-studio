/** Limits presentation work only. Callers retain their real elapsed clocks
 * across skipped RAF callbacks; official simulation never uses this gate. */
export function framePacer(){
 let last=null;
 return{
  take(now,fps=60){
   if(!Number.isFinite(now))return false;
   const period=1000/Math.max(1,Math.min(120,Number.isFinite(fps)?fps:60));
   if(last!==null&&now>=last&&now-last<period-.5)return false;
   last=now;return true;
  },
  reset(){last=null},
 };
}
