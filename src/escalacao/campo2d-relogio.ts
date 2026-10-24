/** Presentation clock shared by 2D and 3D. No game rules, RNG or persistence. */
export type AncoraCampo={min:number;em:number;ms:number}
export function ancorarMinutoCampo(r:AncoraCampo,minuto:number,agora:number):AncoraCampo{
 const passo=minuto-r.min;let ms=r.ms
 if(passo>=1&&passo<=3){const med=(agora-r.em)/passo;if(med>40&&med<ms*3)ms=ms*.6+med*.4}
 return {min:minuto,em:agora,ms}
}
/** Hold the precise fractional minute and discard elapsed wall time. */
export function suspenderRelogioCampo(r:AncoraCampo,simMin:number,agora:number):AncoraCampo{
 return {...r,em:agora-(simMin-r.min)*r.ms}
}
export function passoRelogioCampo(simMin:number,dt:number,agora:number,r:AncoraCampo,fechado:boolean,msPorMin:number){
 const teto=r.min+1.25,alvo=Math.min(teto,r.min+(agora-r.em)/r.ms)
 let m=simMin+dt/r.ms
 if(fechado)m=Math.max(93.5,simMin+dt/msPorMin)
 else if(Math.abs(alvo-m)>2.5)m=alvo
 else m=Math.min(teto,simMin+(dt/r.ms)*Math.max(.8,Math.min(1.4,1+(alvo-m)*.9)))
 return Math.max(simMin,m)
}
// The 2D consumer can publish its exact sampled minute without React renders.
// Only the current fixture is retained. Changing view never creates a match.
let source:{id:string;minute:number;sampledAt:number}|undefined
export function publicarTempoCampo2D(id:string,minute:number|null,sampledAt=performance.now()){
 if(minute===null){if(source?.id===id)source=undefined;return}
 if(Number.isFinite(minute))source={id,minute,sampledAt}
}
export function tempoCampo2D(id:string,now:number){return source?.id===id&&now>=source.sampledAt?source.minute:undefined}
