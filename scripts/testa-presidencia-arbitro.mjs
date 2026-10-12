import assert from 'node:assert/strict'
import {MotorFutebol} from '../src/escalacao/presidencia-futebol-motor.ts'
const team=s=>['GOL','LAT','LAT','ZAG','ZAG','MEI','MEI','MEI','ATA','ATA','ATA'].map((pos,i)=>({id:s+i,name:s+i,pos}))
const state={context:{id:'referee',home:team('h'),away:team('a')},minute:20,homeScore:0,awayScore:0,paused:false,finished:false,homeColor:'#123456',awayColor:'#654321'}
const motor=new MotorFutebol(state);let old=motor.sample(state,0,0),moving=0
for(let i=1;i<=7200;i++){
 const frame=motor.sample(state,i/60,i*1000/60),a=frame.referee,b=old.referee,travel=Math.hypot(a.x-b.x,a.z-b.z)
 assert.ok(travel<=4.5/60+1e-10,'Referee has a physical running speed')
 assert.ok(Math.abs(a.distance-b.distance-travel)<1e-10,'Gait distance follows movement')
 if(travel>1e-6){
  moving++;assert.ok(Math.abs(Math.sin(a.heading)-(a.x-b.x)/travel)<1e-8)
  assert.ok(Math.abs(Math.cos(a.heading)-(a.z-b.z)/travel)<1e-8,'Referee faces his running direction')
 }
 assert.deepEqual(motor.sample(state,i/60,i*1000/60+5000).referee,a,'Pause/camera redraw cannot change the referee pose')
 for(const p of frame.players)assert.ok(Math.hypot(p.mx-a.x,p.mz-a.z)>=.64-1e-9,'Referee stays clear of players')
 old=frame
}
assert.ok(moving>100)
const slow=new MotorFutebol(state)
for(let i=0;i<=2400;i++)slow.sample(state,i/20,i*50)
assert.deepEqual(slow.sample(state,120,120000).referee,old.referee,'Camera frame rate cannot change gait or direction')
console.log('PASS: referee faces movement, bounded speed, body clearance, frozen pose on pause and identical gait at 20/60 FPS.')
