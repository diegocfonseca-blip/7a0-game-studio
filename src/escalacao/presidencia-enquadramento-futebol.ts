import {MathUtils,PerspectiveCamera,Vector3} from 'three'
export type AlvoCameraFutebol={mx:number;mz:number;visible?:boolean;presentation?:{x:number;z:number}}
export type BolaCameraFutebol={x:number;y:number;z:number;presentation?:{x:number;y:number;z:number}}
/** Metres only. Fits the ball and nearby action, never scales characters. */
export function enquadramentoFutebol(camera:PerspectiveCamera,ball:BolaCameraFutebol,subjects:readonly AlvoCameraFutebol[]=[],tactical=false){
 ball=ball.presentation??ball;subjects=subjects.map(p=>p.presentation?{...p,mx:p.presentation.x,mz:p.presentation.z}:p)
 const portrait=camera.aspect<1,near=subjects.filter(p=>p.visible!==false&&Math.hypot(p.mx-ball.x,p.mz-ball.z)<(portrait?14:22)).sort((a,b)=>Math.hypot(a.mx-ball.x,a.mz-ball.z)-Math.hypot(b.mx-ball.x,b.mz-ball.z)).slice(0,portrait?3:6)
 const target=tactical?new Vector3(0,.6,0):new Vector3(MathUtils.clamp(ball.x,-52.5,52.5),.6,MathUtils.clamp(ball.z,-34,34))
 const points=tactical?[-55,55].flatMap(x=>[-35,35].map(z=>new Vector3(x,2,z))):[
  new Vector3(ball.x-.2,ball.y-.1,ball.z),new Vector3(ball.x+.2,ball.y+.2,ball.z),
  ...near.flatMap(p=>[new Vector3(p.mx,0,p.mz),new Vector3(p.mx,1.78,p.mz)]),
  new Vector3(target.x-5,0,target.z-4),new Vector3(target.x+5,2,target.z+4),
 ]
 const probe=new PerspectiveCamera(camera.fov,camera.aspect,camera.near,camera.far),direction=new Vector3(0,tactical ? .84 : .62,tactical ? .54 : .78).normalize()
 const fits=(distance:number)=>{probe.position.copy(target).addScaledVector(direction,distance);probe.lookAt(target);probe.updateMatrixWorld(true);return points.every(point=>{const p=point.clone().project(probe);return p.z>-1&&p.z<1&&Math.abs(p.x)<.8&&Math.abs(p.y)<.68})}
 let low=14,high=Math.min(900,camera.far*.85);for(let i=0;i<22;i++){const mid=(low+high)/2;if(fits(mid))high=mid;else low=mid}
 const distance=high,position=target.clone().addScaledVector(direction,distance)
 return{position,target,distance,subjects:near.length,tactical}
}
