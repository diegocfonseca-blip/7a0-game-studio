import {prepareBodyTrack as prepareNativeBodyTrack} from '../motion/map-root-track.mjs';

/** Fit each side of an official placement separately. Otherwise a recovery
 * ending AFTER half-time can already pull the runner toward midfield BEFORE
 * half-time. This is presentation only; source placements and contacts win. */
export function prepareBodyTrack(knots,controls,source,options={}){
 const breaks=options.breaks??[];
 if(!breaks.length)return prepareNativeBodyTrack(knots,controls,source,options);
 const cuts=breaks.toSorted((a,b)=>a.before-b.before),segments=[];
 let start=-Infinity;
 for(const cut of [...cuts,{before:Infinity,after:Infinity}]){
  const end=cut.before,segmentStart=start;
  // Capture the bounds per segment, rather than the mutable loop variable.
  const boundedSource=t=>source(Math.max(segmentStart,Math.min(end,t)));
  const inSegment=t=>t>=segmentStart-1e-7&&t<=end+1e-7;
  const fit=prepareNativeBodyTrack(knots.filter(k=>inSegment(k.t)),controls.filter(c=>inSegment(c.start)&&inSegment(c.end)),boundedSource,options);
  segments.push({start:segmentStart,end,fit});start=cut.after;
 }
 return t=>segments.find(s=>t>=s.start&&t<=s.end)?.fit(t)??{x:0,z:0};
}
