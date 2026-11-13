import type {CompId} from './competicoes-visual'
export const competenciaMuseu=(id:string):CompId=>(id.startsWith('liga-')?'car'+id.slice(5):id==='copa'?'copabr':id==='libertadores'?'liberta':id) as CompId
