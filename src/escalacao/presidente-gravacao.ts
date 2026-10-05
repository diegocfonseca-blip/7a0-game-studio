/** Bounds waiting, not the underlying write: a late write may still complete. */
export function aguardarGravacao(run:()=>boolean|Promise<boolean>,ms=8000):Promise<'accepted'|'failed'|'timeout'>{
 return new Promise(resolve=>{
  const timer=setTimeout(()=>resolve('timeout'),ms)
  Promise.resolve().then(run).then(ok=>{
   clearTimeout(timer);resolve(ok?'accepted':'failed')
  },()=>{clearTimeout(timer);resolve('failed')})
 })
}
