import assert from 'node:assert/strict'
import {MotorFutebol} from '../src/escalacao/presidencia-futebol-motor.ts'
const team=s=>['GOL','LAT','LAT','ZAG','ZAG','MEI','MEI','MEI','ATA','ATA','ATA'].map((pos,i)=>({id:s+i,name:s+i,pos}))
const base={context:{id:'restart',home:team('h'),away:team('a')},minute:20,homeScore:0,awayScore:0,paused:false,finished:false,homeColor:'#1b7a3d',awayColor:'#c2452f'}
for(const minute of [20,46])for(const scoringHome of [true,false]){
 const state={...base,minute},m=new MotorFutebol(state)
 m.sample(state,40,40000)
 const goal={id:'confirmed',home:scoringHome,name:scoringHome?'h10':'a10',minute,phase:'confirmed'}
 m.sample({...state,goal},40,40000)
 let prev=m.sample(state,40,40000)
 assert.equal(prev.phase,'saida');assert.equal(prev.ball.x,0);assert.equal(prev.ball.z,0)
 const side=scoringHome?'away':'home'
 let kicked=false,waited=false
 for(let i=2401;i<9600;i++){
  const f=m.sample(state,i/60,i*1000/60)
  const kicker=prev.players.find(p=>p.kick>0&&Math.hypot(p.mx,p.mz)<.6)
  if(Math.hypot(f.ball.x,f.ball.z)>.01){
   assert.ok(kicker)
   assert.equal(kicker.side,side,'The conceding team restarts')
   for(const p of prev.players){
    if(p.key===kicker.key)continue
    const direction=prev.players.find(a=>a.side===p.side&&a.keeper).x<.5?1:-1
    assert.ok(direction*p.mx<=.1,'Non-takers are in their own half at kickoff')
    if(p.side!==side)assert.ok(Math.hypot(p.mx,p.mz)>=9.1,'Opponents are outside the center circle')
   }
   kicked=true;break
  }
  assert.equal(f.ball.x,0);assert.equal(f.ball.z,0,'Ball waits at the center spot')
  waited=true;prev=f
 }
 assert.ok(waited&&kicked,'Players return and restart without deadlocking')
 assert.equal(state.homeScore,0);assert.equal(state.awayScore,0)
}
console.log('PASS: after goals on either side and in either half, kickoff waits for legal positions, then the conceding team passes without changing the official score.')
