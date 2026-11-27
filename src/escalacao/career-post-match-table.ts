/** Reuse the revealed standings; never recompute points or pick a future phase. */
export function postMatchTable<T extends {you:boolean}>(division:string,fallback:T[],phase:string|undefined,official?:{
 C:{fases:{nome:string;tabela:T[]}[]};D:{grupos:{nome:string;tabela:T[]}[]}
}|null):{table:T[];phase?:string}{
 if(division==='C'){
  const group=official?.C.fases.find(f=>f.nome===phase&&f.tabela.some(t=>t.you))
  if(group)return {table:group.tabela,phase:group.nome}
 }
 if(division==='D'){
  const group=official?.D.grupos.find(g=>g.tabela.some(t=>t.you))
  if(group)return {table:group.tabela,phase:`Grupo ${group.nome}`}
 }
 return {table:fallback}
}
