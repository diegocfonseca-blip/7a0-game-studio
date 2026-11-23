import assert from 'node:assert/strict'
import {createMatchPresentationClock,matchPresentationElapsed,matchPresentationMinute,matchPresentationRemaining,retimeMatchPresentation} from '../src/escalacao/match-presentation-clock'

let checks=0
const close=(a:number,b:number)=>{assert(Math.abs(a-b)<1e-8,`${a} != ${b}`);checks++}
for(const duration of [9000,11000,25000,43902]){
 for(const minute of [0,1,27.3,55,89,93]){
  const clock=createMatchPresentationClock('match',duration,1000)
  let at=1000+minute/93*duration*.82
  for(const next of [duration*4,duration/2,duration*1.5,duration]){
   const before=matchPresentationMinute(clock,at)
   retimeMatchPresentation(clock,next,at)
   close(matchPresentationMinute(clock,at),before)
   close(matchPresentationRemaining(clock,1,0,at),next*(1-minute/93*.82))
  }
  // Same-value renders cannot restart the time anchor or lose elapsed time.
  const anchor=clock.at
  retimeMatchPresentation(clock,duration,at+100)
  assert.equal(clock.at,anchor);checks++
  close(matchPresentationElapsed(clock,at+100),minute/93*duration*.82+100)
 }
 // After the base round, extra penalty/reading time stays in wall milliseconds.
 const pens=createMatchPresentationClock('final',duration,1000)
 const at=1000+duration+3500
 retimeMatchPresentation(pens,duration/4,at)
 close(matchPresentationMinute(pens,at),93)
 close(matchPresentationRemaining(pens,1,13000,at),9500)
 retimeMatchPresentation(pens,duration*4,at+500)
 close(matchPresentationRemaining(pens,1,13000,at+500),9000)
 close(matchPresentationRemaining(pens,1,13000,at+9500),0)
 close(matchPresentationRemaining(pens,.85,250,at+500),0)
}
const fresh=createMatchPresentationClock('new-round',9000,50000)
close(matchPresentationMinute(fresh,50000),0)
close(matchPresentationRemaining(fresh,1,0,50000),9000)
for(const invalid of [NaN,Infinity,-1,0])assert.equal(createMatchPresentationClock('bad',invalid,0).duration,400)
console.log(`PASS: ${checks+4} clock checks: continuous minutes, remaining time, repeated rates, finished matches and fixed penalty tail.`)
