import {careerStadiumView} from './career-stadium-model'
import {hasExtra,type StadiumSave} from './estadiodata'
import {podeAlterarPresidencia,type CarreiraPresidencia} from './presidencia-carreira'
export type CarreiraComEstadio=CarreiraPresidencia & {stadiums?:Record<number,StadiumSave>;agenciaOn?:boolean}
/** One construction state for every camera; reference images grant no works. */
export function estadioDaPresidencia(state:CarreiraComEstadio,mgrId:number){
 const stadium=state.stadiums?.[mgrId],view=careerStadiumView(stadium,!!state.agenciaOn)
 return {...view,roof:{built:view.scene.retractable,closed:view.scene.retractable&&stadium?.roofClosed===true}}
}
export function alterarTetoPresidencia<T extends CarreiraComEstadio>(state:T,mgrId:number,closed:boolean){
 const st=state.stadiums?.[mgrId]
 if(!podeAlterarPresidencia(state,mgrId)||typeof closed!=='boolean'||!st||!hasExtra(st,'retratil'))return null
 if((st.roofClosed===true)===closed)return state
 return {...state,stadiums:{...state.stadiums,[mgrId]:{...st,roofClosed:closed}}}
}
