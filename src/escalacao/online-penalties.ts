export type PenaltyKick={ok:boolean;at:number}
/** Preserva a sequência existente quando ela já representa o placar oficial. */
export function exactPenaltyRows(pens:[number,number],original:PenaltyKick[][]):PenaltyKick[][]{
 if(original.every((r,i)=>r.filter(k=>k.ok).length===pens[i]))return original
 if(Math.max(...pens)>5)return original
 const plan:boolean[]=[]
 const search=(i:number,score:[number,number]):boolean=>{
  const taken:[number,number]=[Math.ceil(i/2),Math.floor(i/2)]
  const decided=score[0]>score[1]+5-taken[1]||score[1]>score[0]+5-taken[0]
  if(decided||i===10)return score[0]===pens[0]&&score[1]===pens[1]
  const side=i%2,index=Math.floor(i/2),preferred=original[side][index]?.ok??true
  for(const ok of [preferred,!preferred]){
   const next:[number,number]=[...score];if(ok)next[side]++
   if(next[side]>pens[side]||next[side]+4-index<pens[side])continue
   plan.push(ok);if(search(i+1,next))return true;plan.pop()
  }
  return false
 }
 if(!search(0,[0,0]))return original
 const rows:PenaltyKick[][]=[[],[]];plan.forEach((ok,at)=>rows[at%2].push({ok,at}));return rows
}
