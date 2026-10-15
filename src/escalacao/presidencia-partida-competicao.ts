import {escalaValida,type AtletaEstadio,type ContextoPartidaEstadio} from './presidencia-partida-model.ts'
import type {StadiumSave} from './estadiodata'

type TimeCompeticao={teamId:number;xi:readonly AtletaEstadio[];squad?:readonly AtletaEstadio[]}
/** Apenas adapta os XI já decididos pela competição. Não sorteia elenco/resultado. */
export function contextoPartidaCompeticao({enabled,id,speed,home,away,stadiums}:{enabled:boolean;id:string;speed?:number;home:TimeCompeticao;away:TimeCompeticao;stadiums?:Readonly<Record<number,StadiumSave>>}):ContextoPartidaEstadio|undefined{
 if(!enabled||!escalaValida(home.xi)||!escalaValida(away.xi))return undefined
 return {id,speed,homeClubId:home.teamId>=0?home.teamId:undefined,awayClubId:away.teamId>=0?away.teamId:undefined,stadium:home.teamId>=0?stadiums?.[home.teamId]:undefined,home:home.xi,away:away.xi,homeBench:home.squad?.filter(p=>!p.fake),awayBench:away.squad?.filter(p=>!p.fake)}
}
