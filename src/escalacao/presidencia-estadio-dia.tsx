import {createContext,useContext,type ReactNode} from 'react'
import {usePartidaNoMapa} from './presidencia-partida-sincronia'
import type {DiaEstadio} from './presidencia-estadio-publico'
export const DiaContext=createContext<DiaEstadio|undefined>(undefined)
export const useDiaEstadio=()=>useContext(DiaContext)
/** Both the office window and the aerial map receive the same club/day. */
export function DiaDoEstadio({day,clubId,children}:{day:DiaEstadio;clubId:number;children:ReactNode}){
 const match=usePartidaNoMapa(undefined,clubId)
 return <DiaContext.Provider value={{...day,match:match?(match.paused&&match.minute>=45?'interval':'playing'):'idle'}}>{children}</DiaContext.Provider>
}
