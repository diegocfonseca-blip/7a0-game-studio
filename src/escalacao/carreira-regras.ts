import type {EscState} from './types'
/** Shared management, without changing rosters, sports or division formats. */
export function carreiraSoloFutebol(s:Pick<EscState,'careerOnline'|'onlineMode'|'sport'|'co2'>):boolean{
 return !!s.careerOnline&&s.onlineMode!=='online'&&s.sport!=='basquete'&&!s.co2
}
export function gestaoDesde(s:EscState):number|undefined{return s.oficial?s.oficial.economiaDesde:s.careerManagementSince}
export function gestaoAtiva(s:EscState):boolean{return carreiraSoloFutebol(s)&&s.seasonNo>=(gestaoDesde(s)??Infinity)}
/** Old seasons finish under their original rules. No retrospective payroll/results. */
export function preparaGestaoCarreira(s:EscState):boolean{
 if(!carreiraSoloFutebol(s)||s.oficial||s.careerManagementSince!=null)return false
 s.careerManagementSince=(s.seasonNo??1)+(s.round>0||s.copaXiSeason===s.seasonNo||Object.values(s.careerCupLive??{}).some(c=>c.season===s.seasonNo)?1:0)
 return true
}

/** Also covers the older offline career, without enabling new Agency rules. */
export function carreiraSemLimite(s:Pick<EscState,'onlineMode'|'sport'|'careerDivision'>):boolean{return s.onlineMode!=='online'&&s.sport!=='basquete'&&!!s.careerDivision}
