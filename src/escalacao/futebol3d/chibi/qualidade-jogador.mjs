/** One graphics profile for map and imported player. No match/animation clock. */
export function usarBonecoLeve({mapLevel,forced,coarse}){
 if(mapLevel==='leve')return true;
 if(forced==='1')return true;
 if(forced==='0')return false;
 return coarse;
}
