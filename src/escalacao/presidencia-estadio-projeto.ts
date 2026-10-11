import {STADIUM_SECTORS,extraUnlocked,type StadiumSave,type StadiumExtra} from './estadiodata'
import {estadioVisualValido} from './presidencia-estadio-validacao'

/** Camarote inclui o anel superior. Mantém preço, renda, lugares e chave
 * antigos; não cobra novamente a estrutura já comprada. */
export function setorPagoNoProjeto(st:StadiumSave|undefined,key:string):boolean{
 if(!estadioVisualValido(st))return false
 if(key==='grama'&&st.ext.includes('grama'))return true
 const cost=STADIUM_SECTORS.find(s=>s.k===key)?.cost
 return cost!==undefined&&(st.inv[key]??0)>=cost
}
export const primeiroAndarConcluido=(st?:StadiumSave)=>['geral','cadeiras','visitante'].every(key=>setorPagoNoProjeto(st,key))
export const segundoAndarConcluido=(st?:StadiumSave)=>primeiroAndarConcluido(st)&&setorPagoNoProjeto(st,'camarote')
export const podeInvestirNoProjeto=(st:StadiumSave|undefined,key:string)=>key!=='camarote'||primeiroAndarConcluido(st)
export const PAVIMENTACAO_ESTADIO:Readonly<StadiumExtra>={k:'asfalto',n:'🛣️ Ruas internas e calçadas',cost:80,inc:0,reqTxt:'Loja do Clube ou Geral concluída',perk:'pavimenta os acessos do clube e conecta os estabelecimentos'}
export function extraLiberadoNoProjeto(st:StadiumSave|undefined,key:string):boolean{
 if(!estadioVisualValido(st))return false
 if(key==='asfalto')return !!st?.ext.includes('loja')||setorPagoNoProjeto(st,'geral')
 if(key==='cober')return segundoAndarConcluido(st)&&setorPagoNoProjeto(st,'grama')
 if(key==='retratil')return segundoAndarConcluido(st)&&setorPagoNoProjeto(st,'grama')&&!!st?.ext.includes('cober')
 return extraUnlocked(st,key)
}
export function requisitoExtraNoProjeto(key:string,en=false):string|undefined{
 if(key==='cober')return en?'Lower and upper tiers + completed pitch':'1º e 2º andares e gramado concluídos'
 if(key==='retratil')return en?'Both tiers completed + roof':'Dois andares concluídos e Cobertura'
 if(key==='asfalto')return en?'Club Store or completed Terraces':'Loja do Clube ou Geral concluída'
 return undefined
}
