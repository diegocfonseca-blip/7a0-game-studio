/** Mantém a autorização ao recarregar a mesma aba; uma aba duplicada recebe outro token. */
let geracao=0
let libera: (()=>void)|undefined
export function soltaAparelhoCo2(){++geracao;libera?.();libera=undefined}
export async function tokenDoAparelhoCo2(conta:string,sala:string):Promise<string>{
 soltaAparelhoCo2()
 const contexto=geracao
 const key=`esc-co2-aba:${conta}:${sala}`
 let token='';try{token=sessionStorage.getItem(key)??''}catch{/* usa memória */}
 if(!token)token=crypto.randomUUID()
 if(typeof navigator!=='undefined'&&navigator.locks){
  const tenta=(id:string)=>new Promise<boolean>(resolve=>{
   void navigator.locks.request(`co2-aba:${id}`,{ifAvailable:true},async lock=>{
    if(!lock||contexto!==geracao){resolve(false);return}
    await new Promise<void>(fim=>{libera=fim;resolve(true)})
   }).catch(()=>resolve(false))
  })
  if(!await tenta(token)){token=crypto.randomUUID();await tenta(token)}
 }else token=crypto.randomUUID()
 try{sessionStorage.setItem(key,token)}catch{/* sem persistência, a reserva expira no servidor */}
 return token
}
