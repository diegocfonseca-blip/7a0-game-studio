import type {MeuSocio} from './manto'
import {CAMISAS_SALAO} from './salao-camisas'
export type IdentidadePresidencia={name:string;crest:string|null;shirt:string|null;mascot:string|null;color:string}
const normalize=(s:string)=>s.trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()
/** Account benefits are supplied by the existing account hook, never the save
 * or typed club name. A renamed club cannot claim another owner's artwork. */
export function identidadeDaConta(name:string,member:MeuSocio|null|undefined,color='#B2A583'):IdentidadePresidencia{
 const crest=member?.ativo===true?member.escudoTime?.trim()||null:null
 const shirt=crest?Object.keys(CAMISAS_SALAO).find(key=>normalize(key)===normalize(crest))??null:null
 return {name,crest,shirt,mascot:member?.ativo===true?member.mascoteKey?.trim()||null:null,color:/^#[\da-f]{6}$/i.test(color)?color:'#B2A583'}
}
