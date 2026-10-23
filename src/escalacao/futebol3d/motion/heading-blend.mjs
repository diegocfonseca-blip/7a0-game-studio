// Generated from scripts/animation-lab/heading-blend.mjs. Repackage after editing source.
const angle=x=>Math.atan2(Math.sin(x),Math.cos(x));
// Pick the turn branch against a fixed endpoint reference. Choosing a new
// shortest arc every frame flips the blended body by 180 degrees when the
// running direction crosses the opposite of the captured direction.
export function blendHeading(base,captured,weight,reference){
 const a=reference+angle(base-reference),b=reference+angle(captured-reference);
 return a+(b-a)*weight;
}
