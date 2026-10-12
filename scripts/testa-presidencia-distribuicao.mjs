import assert from 'node:assert/strict'
import {MotorFutebol} from '../src/escalacao/presidencia-futebol-motor.ts'
import {contatoLuvas3D} from '../src/escalacao/presidencia-atleta-3d.ts'
const team=s=>['GOL','LAT','LAT','ZAG','ZAG','MEI','MEI','MEI','ATA','ATA','ATA'].map((pos,i)=>({id:s+i,name:s+i,pos}))
const state={context:{id:'distribution',home:team('h'),away:team('a')},minute:20,homeScore:0,awayScore:0,paused:false,finished:false,homeColor:'#123456',awayColor:'#654321'}
const separation=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z)
for(const home of [true,false])for(const speed of [1,4]){
 const m=new MotorFutebol(state),chance={id:'catch-2',home,minute:20,startedAt:0,outcome:'defendeu',speed}
 m.sample({...state,chance},0,0)
 const saved=m.sample({...state,chance},0,600/speed),start=m.sample(state,0,601/speed)
 assert.ok(separation(saved.ball,start.ball)<1e-9,'Removing the official save does not teleport the ball to the feet')
 const key=start.owner,keeper=start.players.find(p=>p.key===key);let previous=start,passed=false
 for(let i=1;i<=140;i++){
  const f=m.sample(state,i/60,601/speed+i*1000/60/speed),p=f.players.find(p=>p.key===key)
  assert.notEqual(f.phase,'tiro-de-meta','Caught ball remains in play')
  assert.ok(f.ball.y>=.11-1e-9)
  if(i<=39){
   assert.ok(separation(f.ball,previous.ball)<.12,'Lowering and dropping the ball are continuous')
   assert.equal(p.mx,keeper.mx);assert.equal(p.mz,keeper.mz);assert.equal(p.heading,keeper.heading)
   assert.deepEqual(m.sample(state,i/60,99999).ball,f.ball,'Pause freezes distribution')
   if(i<15)assert.ok(separation(f.ball,contatoLuvas3D(p))<1e-9,'Ball follows the lowering hands')
  }
  if(f.phase==='passe'&&p.kick>0){passed=true;break}
  previous=f
 }
 assert.ok(passed,'Keeper settles the ball and passes')
}
// A teammate change must not reset the keeper's active gesture or orientation.
{
 const m=new MotorFutebol(state),chance={id:'catch-2',home:true,minute:20,startedAt:0,outcome:'defendeu'}
 m.sample({...state,chance},0,0);m.sample({...state,chance},0,600);m.sample(state,0,601)
 const before=m.sample(state,.1,701),p=before.players.find(p=>p.key===before.owner)
 const changed={...state,context:{...state.context,away:state.context.away.map(a=>a.id==='a10'?{...a,id:'sub10',name:'Substitute'}:a)}}
 const after=m.sample(changed,.1,701),same=after.players.find(a=>a.key===p.key)
 assert.deepEqual(after.ball,before.ball);assert.deepEqual(same,p,'Other substitution preserves the keeper pose')
 const newKeeper={...changed,context:{...changed.context,away:changed.context.away.map(a=>a.id==='a0'?{...a,id:'sub0',name:'Reserve keeper'}:a)}}
 const replaced=m.sample(newKeeper,.1,701)
 assert.equal(replaced.owner,'away:sub0');assert.deepEqual(replaced.ball,before.ball)
 assert.ok(m.sample(newKeeper,1.5,2101).players.some(a=>a.id==='sub0'),'Updated real keeper stays in the XI')
}
console.log('PASS: both keepers at 1x/4x, hands → drop → feet → pass without teleport, ground clearance, pause and substitutions.')
