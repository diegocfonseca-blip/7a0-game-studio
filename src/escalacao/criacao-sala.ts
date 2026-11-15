/** Deadline and persisted identity belong to one create attempt, never to the
 * host/game clock. Aborting a response cannot undo a server commit, so retries
 * always carry the same UUID to the atomic RPC. */
export const PRAZO_CRIACAO_SALA=30_000
export class ErroPrazoCriacao extends Error {
 etapa:string
 constructor(etapa:string){super('A conexão demorou para confirmar a sala.');this.etapa=etapa;this.name='ErroPrazoCriacao'}
}
export class CriacaoSala {
 readonly controller=new AbortController()
 etapa='preparar'
 private timer:ReturnType<typeof setTimeout>
 private fechada=false
 constructor(ms=PRAZO_CRIACAO_SALA){this.timer=setTimeout(()=>this.controller.abort(new ErroPrazoCriacao(this.etapa)),ms)}
 async passo<T>(etapa:string,job:(signal:AbortSignal)=>PromiseLike<T>):Promise<T>{
  this.etapa=etapa
  const signal=this.controller.signal
  if(signal.aborted||this.fechada)throw signal.reason??new Error('Criação encerrada')
  let abort:()=>void=()=>{}
  try{
   const timeout=new Promise<never>((_,reject)=>{abort=()=>reject(signal.reason??new ErroPrazoCriacao(etapa));signal.addEventListener('abort',abort,{once:true})})
   const result=await Promise.race([Promise.resolve().then(()=>{if(signal.aborted)throw signal.reason;return job(signal)}),timeout])
   if(signal.aborted||this.fechada)throw signal.reason??new Error('Criação encerrada')
   return result
  }finally{signal.removeEventListener('abort',abort)}
 }
 encerrar(){clearTimeout(this.timer);this.fechada=true;this.controller.abort(new Error('Criação encerrada'))}
}
export type CriacaoPendente={v:1;id:string;code:string;at:number}
const key=(uid:string,game:string)=>`esc-criacao-pendente:${game}:${uid}`
const valido=(v:unknown):v is CriacaoPendente=>{
 const p=v as CriacaoPendente|null
 return !!p&&p.v===1&&typeof p.id==='string'&&/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(p.id)&&typeof p.code==='string'&&/^[A-Z0-9]{6}$/.test(p.code)&&Number.isFinite(p.at)&&p.at>Date.now()-86400_000&&p.at<Date.now()+60_000
}
export function leCriacaoPendente(uid:string,game:string):CriacaoPendente|null{
 for(const storage of ['localStorage','sessionStorage'] as const)try{const raw=globalThis[storage]?.getItem(key(uid,game));if(raw){const p:unknown=JSON.parse(raw);if(valido(p))return p}}catch{/* próximo armazenamento */}
 return null
}
/** A failed persistence is reported BEFORE POST, never after creating a room. */
export function gravaCriacaoPendente(uid:string,game:string,value:CriacaoPendente):boolean{
 const raw=JSON.stringify(value)
 for(const storage of ['localStorage','sessionStorage'] as const)try{globalThis[storage].setItem(key(uid,game),raw);if(globalThis[storage].getItem(key(uid,game))===raw)return true}catch{/* sessão costuma ter espaço mesmo com cache local cheio */}
 return false
}
export function limpaCriacaoPendente(uid:string,game:string){for(const storage of ['localStorage','sessionStorage'] as const)try{globalThis[storage]?.removeItem(key(uid,game))}catch{/* sem acesso */}}
export function novoIdCriacao():string{
 if(typeof globalThis.crypto?.randomUUID==='function')return crypto.randomUUID()
 const bytes=new Uint8Array(16);if(typeof globalThis.crypto?.getRandomValues==='function')crypto.getRandomValues(bytes);else for(let i=0;i<16;i++)bytes[i]=Math.floor(Math.random()*256)
 bytes[6]=bytes[6]&15|64;bytes[8]=bytes[8]&63|128
 const s=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('')
 return `${s.slice(0,8)}-${s.slice(8,12)}-${s.slice(12,16)}-${s.slice(16,20)}-${s.slice(20)}`
}
