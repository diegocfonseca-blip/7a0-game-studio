/** Event animations cannot steal a calibrated contact or restart later after
 * being blocked. The caller consumes the official event in either case. */
export function secondaryFootballAction(event,{capture=null,plannedAction=null}={}){
 if(event.tipo!=='carrinho')return{clip:null,reason:'unsupported-secondary-event'};
 if(capture||plannedAction)return{clip:null,reason:'protected-planned-contact'};
 return{clip:'carrinho',reason:'unplanned-source-tackle'};
}
