import * as T from 'three'
import type {ImpactoRede3D} from './presidencia-gol-apresentacao'
const nets=new WeakMap<T.Object3D,Array<{sign:number;mesh:T.LineSegments;rest:Float32Array;normals:Float32Array;weights:Float32Array;active?:boolean}>>()
/** A connected grid on rear, sides and roof; edges stay tied to supports.
 * Local damped membrane response, not a full cloth physics solver. */
export function criarRedeGol3D(parent:T.Object3D,sign:number){
 const positions:number[]=[],normals:number[]=[],weights:number[]=[]
 const face=(origin:T.Vector3,u:T.Vector3,v:T.Vector3,normal:T.Vector3,nu:number,nv:number)=>{
  const add=(a:number,b:number)=>{const p=origin.clone().addScaledVector(u,a).addScaledVector(v,b);positions.push(p.x,p.y,p.z);normals.push(normal.x,normal.y,normal.z);weights.push(Math.sin(Math.PI*a)*Math.sin(Math.PI*b))}
  for(let i=0;i<=nu;i++)for(let j=0;j<nv;j++){add(i/nu,j/nv);add(i/nu,(j+1)/nv)}
  for(let j=0;j<=nv;j++)for(let i=0;i<nu;i++){add(i/nu,j/nv);add((i+1)/nu,j/nv)}
 }
 face(new T.Vector3(sign*54.5,0,-3.66),new T.Vector3(0,0,7.32),new T.Vector3(0,2.44,0),new T.Vector3(sign,0,0),60,20)
 face(new T.Vector3(sign*52.5,2.44,-3.66),new T.Vector3(sign*2,0,0),new T.Vector3(0,0,7.32),new T.Vector3(0,1,0),16,60)
 for(const side of [-1,1])face(new T.Vector3(sign*52.5,0,side*3.66),new T.Vector3(sign*2,0,0),new T.Vector3(0,2.44,0),new T.Vector3(0,0,side),16,20)
 const rest=new Float32Array(positions),geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.BufferAttribute(rest.slice(),3).setUsage(T.DynamicDrawUsage));geometry.computeBoundingSphere();geometry.boundingSphere!.radius+=.5
 const mesh=new T.LineSegments(geometry,new T.LineBasicMaterial({color:'#ecefe4',transparent:true,opacity:.72}));mesh.name='goal-net-'+sign;parent.add(mesh)
 const list=nets.get(parent)??[];list.push({sign,mesh,rest,normals:new Float32Array(normals),weights:new Float32Array(weights)});nets.set(parent,list)
}
export function atualizarRedesGol3D(parent:T.Object3D,frame:{time:number;ball:{netImpact?:ImpactoRede3D}}){
 for(const net of nets.get(parent)??[]){const attr=net.mesh.geometry.getAttribute('position') as T.BufferAttribute,impact=frame.ball.netImpact,age=impact?frame.time-impact.time:-1,active=!!impact&&impact.sign===net.sign&&age>=0&&age<2.5;
  if(!active&&!net.active)continue;net.active=active;
  for(let i=0;i<attr.count;i++){
   const k=i*3,x=net.rest[k],y=net.rest[k+1],z=net.rest[k+2];let amount=0
   if(active){const d=Math.hypot(x-net.sign*54.5,y-impact!.y,z-impact!.z);amount=.42*impact!.strength*net.weights[i]*Math.exp(-d*d/1.2)*Math.exp(-2.8*age)*Math.sin(16*age-2*d)*Math.min(1,age*30)}
   attr.setXYZ(i,x+net.normals[k]*amount,y+net.normals[k+1]*amount,z+net.normals[k+2]*amount)
  }
  attr.needsUpdate=true
 }
}
export function inspecionarRedesGol3D(parent:T.Object3D){return(nets.get(parent)??[]).map(net=>{const p=net.mesh.geometry.getAttribute('position');let max=0;for(let i=0;i<p.count;i++)max=Math.max(max,Math.hypot(p.getX(i)-net.rest[i*3],p.getY(i)-net.rest[i*3+1],p.getZ(i)-net.rest[i*3+2]));return{sign:net.sign,vertices:p.count,maximumDisplacement:max}})}
