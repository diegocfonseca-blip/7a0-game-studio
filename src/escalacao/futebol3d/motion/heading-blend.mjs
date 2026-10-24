// Generated from scripts/animation-lab/heading-blend.mjs. Repackage after editing source.
const angle=x=>Math.atan2(Math.sin(x),Math.cos(x));
// Pick the turn branch against a fixed endpoint reference. Choosing a new
// shortest arc every frame flips the blended body by 180 degrees when the
// running direction crosses the opposite of the captured direction.
export function blendHeading(base,captured,weight,reference){
 const a=reference+angle(base-reference),b=reference+angle(captured-reference);
 return a+(b-a)*weight;
}

/** Keep the selected arc for the entire gesture. Re-evaluating a shortest
 * arc every frame flips the blend when either input crosses the antipode. */
export function continuousHeading(previous,token,time,base,captured,weight){
 const continuous=previous?.token===token&&time>=previous.time&&time-previous.time<=.2;
 const a=continuous?previous.a+angle(base-previous.base):base;
 const b=continuous?previous.b+angle(captured-previous.captured):base+angle(captured-base);
 return{token,time,base,captured,a,b,value:a+(b-a)*weight};
}
