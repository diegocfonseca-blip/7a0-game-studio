import {roupaModularValida} from './presidente-vestuario-modular'
import {presidenteBaseValido,type PresidenteBaseSave} from './presidencia-carreira'
import {copiarAparencia} from './presidente-aparencia'

export function presidenteCadastrado(value:unknown):value is PresidenteBaseSave{
 return presidenteBaseValido(value)&&value.name.trim().length>0
}
/** Legado vira sugestão editável, nunca cadastro confirmado nem reset de carreira. */
export function sugestaoPresidente(saved:unknown,legacy?:{name?:string;outfit?:string}):PresidenteBaseSave{
 if(presidenteBaseValido(saved))return {...saved,...(saved.appearance?{appearance:copiarAparencia(saved.appearance)}:{})}
 return {version:5,name:(legacy?.name??'').slice(0,40),outfit:roupaModularValida(legacy?.outfit)?legacy.outfit:'terno'}
}
