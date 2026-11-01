const angle=x=>Math.atan2(Math.sin(x),Math.cos(x));
/** Anticipatory turn cone keeps the scheduled impact reachable. Rate limiting
 * prevents a velocity threshold / +/-PI branch change snapping the whole body.
 * The action time, ball and official decisions remain unchanged. */
export function stableActionFacing(previous,desired,contactHeading,remaining,dt,{rate=10,approachRate=8}={}){
 if(!(dt>0))return desired;
 if(Number.isFinite(contactHeading)&&remaining>=0){const cone=approachRate*remaining;desired=contactHeading+Math.max(-cone,Math.min(cone,angle(desired-contactHeading)))}
 return previous+Math.max(-rate*dt,Math.min(rate*dt,angle(desired-previous)));
}
