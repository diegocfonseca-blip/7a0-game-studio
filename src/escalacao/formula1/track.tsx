import {useId,useMemo} from 'react'
import circuit from './interlagos.json'
import {carById,driverById} from './catalog'
import {PIT_SECONDS,grid,type Race} from './race'

// Traçado real do mockup aprovado (MIT, Tomislav Bacinger); acesso aos boxes esquemático.
const coords=circuit.coords
const lengths=[0]
for(let i=1;i<coords.length;i++)lengths.push(lengths[i-1]+Math.hypot(coords[i][0]-coords[i-1][0],coords[i][1]-coords[i-1][1]))
const total=lengths[lengths.length-1]
function point(progress:number){const at=((progress%1)+1)%1*total;let i=1;while(i<lengths.length-1&&lengths[i]<at)i++;const t=(at-lengths[i-1])/(lengths[i]-lengths[i-1]);const p=coords[i-1],q=coords[i];return{x:p[0]+(q[0]-p[0])*t,y:p[1]+(q[1]-p[1])*t,angle:Math.atan2(q[1]-p[1],q[0]-p[0])*180/Math.PI}}
export function FormulaTrack({race,selected,onSelect}:{race:Race;selected:string;onSelect:(id:string)=>void}){
 const uid=useId().replace(/:/g,''),order=useMemo(()=>grid(race),[race])
 return <svg className="f1-track-svg" viewBox="0 0 520 355" role="img" aria-label="Circuito de Interlagos, oito carros. Os dois destacados são da sua escuderia.">
  <defs><pattern id={`${uid}grass`} width="32" height="32" patternUnits="userSpaceOnUse"><path d="M0 32 32 0" stroke="#1B7A3D" opacity=".2"/></pattern><pattern id={`${uid}flag`} width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="#F4ECD6"/><rect width="3" height="3" fill="#0C0C0C"/><rect x="3" y="3" width="3" height="3" fill="#0C0C0C"/></pattern></defs>
  <rect width="520" height="355" fill={`url(#${uid}grass)`}/>
  <path d={circuit.path} fill="none" stroke="#668166" strokeWidth="34" strokeLinejoin="round"/>
  <path d={circuit.path} fill="none" stroke="#F4ECD6" strokeWidth="23" strokeLinejoin="round"/>
  <path d={circuit.path} fill="none" stroke="#C2452F" strokeWidth="23" strokeDasharray="9 11" strokeLinejoin="round"/>
  <path d={circuit.path} fill="none" stroke="#26352f" strokeWidth="17" strokeLinejoin="round"/>
  <path d={circuit.path} fill="none" stroke="#91a191" strokeWidth=".8" strokeDasharray="4 8"/>
  <path d="M163 64 Q170 25 135 32 Q104 40 115 77" fill="none" stroke="#93a6a5" strokeWidth="7"/>
  <path d="M163 64 Q170 25 135 32 Q104 40 115 77" fill="none" stroke="#0C0C0C" strokeWidth="3"/>
  <rect x="153" y="51" width="6" height="25" fill={`url(#${uid}flag)`} transform="rotate(75 156 64)"/>
  <g><rect x="112" y="9" width="40" height="17" rx="3" fill="#FFC400"/><text x="132" y="21" textAnchor="middle" fontSize="11" fill="#0C0C0C">BOX</text></g>
  {[...order].reverse().map(c=>{
   const pos=point(c.progress),position=order.findIndex(a=>a.id===c.id)+1,model=carById(c.carId),driver=driverById(c.driverId)
   if(c.pitRemaining>0){const t=1-c.pitRemaining/PIT_SECONDS;pos.x=163-48*t;pos.y=64-34*Math.sin(Math.PI*t);pos.angle=180}
   // Separa visualmente os dois carros sem mudar sua posição real na corrida.
   const offset=c.teamId===0?(c.id===selected?2:-2):c.teamId%2?2:-2
   return <g key={c.id} className="f1-track-car" transform={`translate(${pos.x+offset} ${pos.y+offset})`} onClick={()=>c.teamId===0&&onSelect(c.id)}>
    <title>{`${driver.name} · P${position}${c.pitRemaining?' · nos boxes':''}`}</title>
    {c.teamId===0&&<circle r={c.id===selected?12:10} fill="none" stroke="#FFC400" strokeWidth={c.id===selected?3:2}/>}
    <g transform={`rotate(${pos.angle})`}><rect x="-8" y="-5" width="5" height="3" rx="1" fill="#0C0C0C"/><rect x="-8" y="2" width="5" height="3" rx="1" fill="#0C0C0C"/><rect x="3" y="-5" width="4" height="3" rx="1" fill="#0C0C0C"/><rect x="3" y="2" width="4" height="3" rx="1" fill="#0C0C0C"/><path d="M-8-3H1L9 0 1 3H-8Z" fill={model.colors[0]} stroke={model.colors[1]} strokeWidth="1.5"/><rect x="-3" y="-2" width="4" height="4" fill={model.colors[1]}/></g>
    <text textAnchor="middle" y="-9" fill={c.teamId===0?'#FFC400':'#F4ECD6'} stroke="#0C0C0C" strokeWidth="3" paintOrder="stroke" fontSize="12" fontWeight="800">{position}</text>
   </g>
  })}
 </svg>
}
