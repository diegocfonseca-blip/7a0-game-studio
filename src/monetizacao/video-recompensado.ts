/** AdSense H5: opt-in only. No script loading, game mutations or rewards at import time. */
export type VideoResult = 'viewed' | 'dismissed' | 'unavailable' | 'cancelled' | 'blocked' | 'busy' | 'error'
export type VideoPlacement = {
 type:'reward'; name:string
 beforeReward:(showAd:()=>void)=>void
 beforeAd:()=>void
 adViewed:()=>void
 adDismissed:()=>void
 afterAd:()=>void
 adBreakDone:(info:{breakStatus?:string})=>void
}
export type VideoTransport = (placement:VideoPlacement)=>void
export type VideoOffer = { accept:()=>boolean; cancel:()=>boolean }
export type VideoRequest = {
 name:string
 /** Caller must keep this pause safe until the placement has finished. */
 canWatch:()=>boolean
 /** Called only when the provider has an ad. UI must disclose the exact reward. */
 onOffer:(offer:VideoOffer)=>void
 /** Temporary pause/mute; cleanup restores the prior preference, not a new default. */
 pause:()=>()=>void
 onOfferClosed:()=>void
}
export type VideoJob = { result:Promise<VideoResult>; cancel:()=>boolean }

/** Instantiated once per document so two simultaneous offers cannot start two ads. */
export function createRewardedVideo({approved,transport,offerTimeoutMs=15000}:{approved:boolean;transport:VideoTransport;offerTimeoutMs?:number}){
 let busy=false
 return {
  request(request:VideoRequest):VideoJob{
   const immediate=(value:VideoResult):VideoJob=>({result:Promise.resolve(value),cancel:()=>false})
   const eligible=()=>{try{return request.canWatch()}catch{return false}}
   if(!approved||!eligible())return immediate('blocked')
   if(busy)return immediate('busy')
   busy=true
   let finished=false,accepted=false,started=false,viewed=false,dismissed=false,offered=false,restored=false
   let resume:(()=>void)|undefined
   let resolve!:(result:VideoResult)=>void
   const result=new Promise<VideoResult>(done=>{resolve=done})
   const restore=()=>{if(restored||!started)return;restored=true;try{resume?.()}catch{/* cleanup must not strand the user */}}
   const finish=(value:VideoResult)=>{
    if(finished)return
    finished=true;clearTimeout(timer);restore();busy=false
    try{request.onOfferClosed()}catch{/* UI cleanup must not prevent settlement */}
    resolve(value)
   }
   const timer=setTimeout(()=>{if(!accepted)finish(offered?'cancelled':'unavailable')},offerTimeoutMs)
   const cancel=()=>{if(finished||accepted)return false;finish('cancelled');return true}
   const accept=()=>{
    if(finished||accepted||!offered)return false
    if(!eligible()){finish('blocked');return false}
    accepted=true;clearTimeout(timer)
    try{show?.()}catch{finish('error');return false}
    return true
   }
   let show:(()=>void)|undefined
   try{transport({
    type:'reward',name:request.name,
    beforeReward:fn=>{
     if(finished||offered)return
     offered=true;show=fn
     try{request.onOffer({accept,cancel})}catch{finish('error')}
    },
    beforeAd:()=>{
     if(finished||!accepted||started)return
     started=true
     try{resume=request.pause()}catch{finish('error');throw new Error('Unable to pause for the rewarded ad')}
    },
    adViewed:()=>{if(!finished&&accepted&&started&&!dismissed)viewed=true},
    adDismissed:()=>{if(!finished&&accepted&&started&&!viewed)dismissed=true},
    // Commit the result only once the provider closes the ad. A click or countdown is never proof.
    afterAd:()=>{if(!finished)restore()},
    adBreakDone:()=>{
     if(finished)return
     finish(viewed?'viewed':dismissed?'dismissed':'unavailable')
    },
   })}catch{finish('error')}
   return {result,cancel}
  },
 }
}

type GoogleH5Entry=VideoPlacement|{sound:'on'|'off'}
export type GoogleH5Host={adsbygoogle?:{push:(entry:GoogleH5Entry)=>unknown}}
/** Uses the existing AdSense tag; never creates another script or proves account approval. */
export function googleH5Transport(host:GoogleH5Host):VideoTransport{
 return placement=>{
  const queue=host.adsbygoogle??(host.adsbygoogle=[] as GoogleH5Entry[])
  queue.push(placement)
 }
}
