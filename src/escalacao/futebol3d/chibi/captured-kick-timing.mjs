const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
/** Reuse the collection capture for an outfielder arriving at a touchline.
 * Its original lead-in must not force a distant runner to plant .6 seconds
 * before he actually reaches the ball. The hand-contact pose stays exact. */
export function planMovingPickupTiming(cue,{raw,end,earliestStart=0}){
 const touch=Math.max(.04,Math.min(.36,cue.t-earliestStart)),clipStart=0,clipEnd=Math.min(end,raw+.18);
 return{start:cue.t-touch,clipStart,clipEnd,captureTouch:raw,preRate:raw/touch,followRate:1,touch,duration:touch+clipEnd-raw};
}
/** Retimes an existing capture around its calibrated impact. No new bone poses,
 * ball forces, random choices or changes to the official contact clock. */
export function planCapturedKickTiming(cue,{raw,begin=0,end,earliestStart=0}){
 const name=cue.nome.replace(/_e$/,''),d=cue.delivery??{},strong=name==='chute_forte',placed=cue.variation?.style==='placed-shot';
 const groundPass=!strong&&!placed&&['passe','enfiada','inversao','cruzamento'].includes(cue.tipo)&&d.trajectory==='ground';
 const effort=clamp(((d.horizontalSpeed??17)-10)/23,0,1);
 const preferred=groundPass?(name==='passe_movimento'?.22:.28)+effort*.10:name==='passe'?.32+effort*.08:name==='chute_corrida'?.28:strong?.74+effort*.16:placed?.50:name==='cavadinha'?.42:.48+effort*.12;
 const available=Math.max(.025,cue.t-Math.max(0,earliestStart));
 const preSeconds=Math.min(available,preferred),preSpan=groundPass?Math.min(preSeconds*1.25,.20+effort*.16):preSeconds*1.8,clipStart=Math.max(begin,raw-preSpan);
 const preRate=(raw-clipStart)/preSeconds;
 const followRate=strong?1+effort*.18:placed?.96:name==='passe'?1.06:1;
 const followSpan=strong?.72:placed?.60:groundPass?.16+effort*.15:cue.tipo==='passe'||cue.tipo==='enfiada'?.42:.62;
 const clipEnd=Math.min(end,raw+followSpan),followSeconds=Math.max(.015,(clipEnd-raw)/followRate);
 return{start:cue.t-preSeconds,clipStart,clipEnd,preRate,followRate,captureTouch:raw,touch:preSeconds,duration:preSeconds+followSeconds};
}
/** Continuous speed at impact, exact pose at impact, monotone on both sides. */
export function capturedActionTime(action,elapsed){
 if(!Number.isFinite(action.captureTouch))return action.base+elapsed;
 const contactRate=Math.sqrt(action.preRate*action.followRate),before=elapsed<=action.touch;
 const duration=before?action.touch:action.dur-action.touch;
 const u=clamp((before?elapsed:elapsed-action.touch)/Math.max(.001,duration),0,1);
 const span=before?action.captureTouch-action.base:duration*action.followRate;
 const k=before?1-contactRate/action.preRate:contactRate/action.followRate-1;
 return(before?action.base:action.captureTouch)+span*(u+k*u*(1-u));
}
