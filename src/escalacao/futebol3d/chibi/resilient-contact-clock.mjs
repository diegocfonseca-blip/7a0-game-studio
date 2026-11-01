/** Bounded presentation catch-up for a continuous forward clock. At faster
 * playback/mobile frame drops, a 250-ms cutoff used to skip the strike entirely.
 * Long seeks restore the current pose instead of replaying unlimited history. */
export function resilientContactSteps(agenda,from,to){
 if(from===null||to<=from||to-from>3)return[];
 return [...new Set(agenda.filter(a=>!a.disabled&&!(a.firstTime&&a.kind==='recebe')&&a.t>from+1e-7&&a.t<to-1e-7).map(a=>a.t))].sort((a,b)=>a-b).slice(-8);
}
export function actionStillVisible(cue,time){
 const end=cue.start+(cue.timing?.duration??cue.clipEnd-cue.clipStart);
 return time>=cue.start&&time<=end;
}
export function activeCapturedAction(agenda,key,time){
 const candidates=agenda.filter(c=>c.key===key&&!c.disabled&&!(c.firstTime&&c.kind==='recebe')&&actionStillVisible(c,time));
 // An impact wins over the next preparation; afterwards use the most recent
 // started action, so an older follow-through cannot restart every frame.
 return candidates.find(c=>Math.abs(c.t-time)<1e-6)??candidates.find(c=>c.t<=time&&time-c.t<.04)??candidates.at(-1);
}
