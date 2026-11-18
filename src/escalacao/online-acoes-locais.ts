// Navegação e identidade pertencem ao aparelho, nunca à caixa de ações do dono.
const RETORNO_LOCAL=new Set(['GO_LOBBY_ONLINE','RESTORE_ONLINE','ASSISTIR_ONLINE'])
const ACOES_LOCAIS=new Set([...RETORNO_LOCAL,'GO_LOBBY','NEW_GAME','GO_ALBUM','GO_RANKING',
 'START_ONLINE','SYNC_STATE','FIX_YOU_IDX','STEP_DOWN_HOST','RECOVER_LOCAL_HOST','BECOME_HOST','KICKED_OUT'])

export const retornoDeSalaLocal=(acao:{type:string})=>RETORNO_LOCAL.has(acao.type)
export const acaoDaSalaLocal=(acao:{type:string})=>ACOES_LOCAIS.has(acao.type)
export function acaoRemotaDaSalaPermitida(acao:unknown):boolean{
 if(!acao||typeof acao!=='object'||!('type' in acao)||typeof acao.type!=='string')return false
 return !acaoDaSalaLocal({type:acao.type})
}
