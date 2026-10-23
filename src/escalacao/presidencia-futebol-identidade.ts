/** Render identity, never a database ID. Motor2's internal numeric IDs are
 * process-global and change when another match is instantiated or replayed. */
export function identidadeAtleta3D(side:'home'|'away',name:string,club?:string,year?:number){
 return JSON.stringify([side,name,club??null,year??null])
}
