import type {CopaSave} from './copa-mundo'
export const COPA_CARREIRA_ANCORA=1
export const COPA_CARREIRA_CICLO=4
const temporada=(n:unknown):n is number=>typeof n==='number'&&Number.isInteger(n)&&n>=1
/** Keeps completed editions and the exact active tournament; only future cadence changes. */
export function agendaCopaCarreira(cur:CopaSave|null,anchor:number,ciclo:number,espelho:CopaSave['mural']=[]):CopaSave{
 const mural=new Map<number,CopaSave['mural'][number]>()
 for(const e of [...(Array.isArray(cur?.mural)?cur.mural:[]),...espelho])if(e&&temporada(e.season)){
  const old=mural.get(e.season);if(!old||e.voce&&!old.voce)mural.set(e.season,e)
 }
 const played=[...new Set([...(Array.isArray(cur?.played)?cur.played:[]).filter(temporada),...mural.keys()])].sort((a,b)=>a-b)
 const comum=anchor===COPA_CARREIRA_ANCORA&&ciclo===COPA_CARREIRA_CICLO
 if(comum){
  const ativa=cur?.emAndamento&&temporada(cur.emAndamento.season)&&!played.includes(cur.emAndamento.season)?cur.emAndamento.season:undefined
  const ultima=played.at(-1)
  const migrar=cur?.calendario!==2||cur.ciclo!==ciclo||ativa!=null&&(ativa-cur.anchor)%ciclo!==0||!temporada(cur.anchor)||!cur.played?.length&&ultima!=null&&!ativa
  return {...cur,anchor:migrar?(ativa??ultima??anchor):cur.anchor,ciclo,calendario:2,mural:[...mural.values()],played}
 }
 // Compatibility with explicit older calendars; no caller outside career is moved.
 return {...cur,anchor:!cur||!played.length?anchor:cur.anchor,ciclo:!cur||!played.length?ciclo:cur.ciclo,mural:[...mural.values()],played}
}
export function convitesSelecoes(paises:readonly string[],pos:number):string[]{
 return Number.isInteger(pos)&&pos>=0&&pos<paises.length?paises.slice(pos):[]
}
