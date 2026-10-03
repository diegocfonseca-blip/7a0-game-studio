export type TrofeuPresidencia={id:string;label:string;competition?:string;count?:number}
/** IDs repetidos são o mesmo registro; competições repetidas ocupam uma única
 * posição com contador. Nunca cria uma conquista que não veio do save. */
export function agruparTrofeus(raw:readonly TrofeuPresidencia[]=[]):TrofeuPresidencia[]{
 const seen=new Set<string>(),groups=new Map<string,TrofeuPresidencia>()
 for(const t of raw){
  if(!t||typeof t.id!=='string'||!t.id.trim()||typeof t.label!=='string'||!t.label.trim()||seen.has(t.id))continue
  const count=t.count===undefined?1:t.count
  if(!Number.isSafeInteger(count)||count<=0)continue
  const key=typeof t.competition==='string'&&t.competition.trim()?t.competition.trim():t.label.trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()
  if(!key)continue
  seen.add(t.id)
  const old=groups.get(key)
  if(old){if(Number.isSafeInteger(old.count!+count))old.count!+=count}
  else groups.set(key,{id:key,label:t.label,competition:t.competition,count})
 }
 return [...groups.values()]
}
export const totalTrofeus=(raw:readonly TrofeuPresidencia[]=[])=>agruparTrofeus(raw).reduce((n,t)=>n+t.count!,0)
