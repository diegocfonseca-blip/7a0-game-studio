/** Read-only description of the source ball at the first canonical tick of
 * an official action. It selects presentation requirements, never physics. */
export type EntregaOficial3D={
 sourceType:string; family:'pass'|'through'|'long'|'switch'|'cross'|'clearance'|'shot'|'header'|'other';
 trajectory:'ground'|'air'; distanceBand:'short'|'medium'|'long'|'unknown'; powerBand:'soft'|'firm'|'strong';
 horizontalSpeed:number; verticalSpeed:number; launchAngleDegrees:number; releaseHeight:number; receiverDistance:number|null;
 velocity:[number,number,number];heightBand:'grounded'|'low'|'medium'|'high';
 freeFlightApex:number; animationFamily:'short-pass'|'driven-kick'|'lofted-kick'|'header'|'unknown';
 technique:string; curve:'none'|'source'; curveRate:number; affectsPhysics:false;
}
export function descreverEntregaOficial3D(type:string,velocity:{x:number;y:number;z:number},height:number,receiverDistance:number|null,source:{technique?:string;curveRate?:number}={}):EntregaOficial3D{
 const horizontalSpeed=Math.hypot(velocity.x,velocity.z),verticalSpeed=velocity.y;
 const family:EntregaOficial3D['family']=({passe:'pass',enfiada:'through',lancamento:'long',inversao:'switch',cruzamento:'cross',chutao:'clearance',chute:'shot',cabeceio:'header',cabeceio_gol:'header'} as Record<string,EntregaOficial3D['family']>)[type]??'other';
 // An inversion may be on the ground. Use actual height/vertical velocity,
 // rather than assuming its event name implies an aerial trajectory.
 const trajectory=height>.15||Math.abs(verticalSpeed)>1?'air':'ground';
 const distanceBand=receiverDistance===null?'unknown':receiverDistance<15?'short':receiverDistance<30?'medium':'long';
 const powerBand=horizontalSpeed<17?'soft':horizontalSpeed<25?'firm':'strong';
 const freeFlightApex=height+Math.max(0,verticalSpeed)**2/(2*9.8),heightBand=freeFlightApex<=.3?'grounded':freeFlightApex<=1.2?'low':freeFlightApex<=2.44?'medium':'high';
 // A high shot alone does not imply a chip. Use the technique the official
 // engine actually selected, including its real curve, without adding RNG.
 const technique=source.technique??'unspecified-by-source',curveRate=Number.isFinite(source.curveRate)?source.curveRate!:0,chipped=technique==='cobertura'||technique==='cavadinha';
 const animationFamily=family==='header'?'header':family==='other'?'unknown':family==='shot'?(chipped?'lofted-kick':'driven-kick'):trajectory==='air'&&verticalSpeed>2?'lofted-kick':distanceBand==='long'||powerBand==='strong'?'driven-kick':'short-pass';
 return{sourceType:type,family,trajectory,distanceBand,powerBand,horizontalSpeed,verticalSpeed,velocity:[velocity.x,velocity.y,velocity.z],heightBand,launchAngleDegrees:Math.atan2(verticalSpeed,horizontalSpeed)*180/Math.PI,releaseHeight:height,receiverDistance,freeFlightApex,animationFamily,technique,curve:curveRate?'source':'none',curveRate,affectsPhysics:false};
}
