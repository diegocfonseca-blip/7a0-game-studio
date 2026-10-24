import {MathUtils,PerspectiveCamera,Vector3} from 'three'
export type AlvoCameraFutebol={mx:number;mz:number;visible?:boolean;presentation?:{x:number;z:number}}
export type BolaCameraFutebol={x:number;y:number;z:number;presentation?:{x:number;y:number;z:number}}
export type CameraFutebolPreset='broadcast'|'tele'|'wide'|'goal'|'tactical'
const PRESETS={
 broadcast:{fov:46,elevation:.64,depth:.77,halfWidth:12,halfDepth:7,radius:19,count:6,minimum:28},
 tele:{fov:36,elevation:.52,depth:.85,halfWidth:8,halfDepth:5,radius:13,count:4,minimum:25},
 wide:{fov:52,elevation:.78,depth:.63,halfWidth:20,halfDepth:12,radius:28,count:10,minimum:42},
 goal:{fov:48,elevation:.63,depth:.78,halfWidth:11,halfDepth:8,radius:19,count:6,minimum:32},
 tactical:{fov:48,elevation:.96,depth:.28,halfWidth:55,halfDepth:36,radius:120,count:22,minimum:90},
} as const
/** Metres only. Fits the ball and nearby action, never scales characters. */
export function enquadramentoFutebol(camera:PerspectiveCamera,ball:BolaCameraFutebol,subjects:readonly AlvoCameraFutebol[]=[],preset:CameraFutebolPreset|boolean=false){
 // Boolean callers retain their existing lens; the named spectator presets
 // carry a lens of their own and cannot inherit an office/map zoom.
 const mode=typeof preset==='boolean'?(preset?'tactical':'broadcast'):preset,settings=PRESETS[mode],tactical=mode==='tactical'
 const fov=typeof preset==='boolean'?camera.fov:settings.fov
 ball=ball.presentation??ball;subjects=subjects.map(p=>p.presentation?{...p,mx:p.presentation.x,mz:p.presentation.z}:p)
 const portrait=camera.aspect<1,radius=settings.radius*(portrait?.68:1)
 const near=subjects.filter(p=>p.visible!==false&&Number.isFinite(p.mx)&&Number.isFinite(p.mz)&&Math.hypot(p.mx-ball.x,p.mz-ball.z)<radius).sort((a,b)=>Math.hypot(a.mx-ball.x,a.mz-ball.z)-Math.hypot(b.mx-ball.x,b.mz-ball.z)).slice(0,portrait?Math.ceil(settings.count/2):settings.count)
 const focusHeight=.6+MathUtils.clamp((ball.y-2)*.3,0,5)
 const target=tactical?new Vector3(0,.6,0):new Vector3(MathUtils.clamp(ball.x,-44,44),focusHeight,MathUtils.clamp(ball.z,-25,25))
 const halfWidth=settings.halfWidth*(portrait?.68:1),halfDepth=settings.halfDepth*(portrait?.82:1)
 const points=tactical?[-55,55].flatMap(x=>[-36,36].flatMap(z=>[0,2.5].map(y=>new Vector3(x,y,z)))):[
  new Vector3(ball.x-.2,ball.y-.1,ball.z),new Vector3(ball.x+.2,ball.y+.2,ball.z),
  ...near.flatMap(p=>[new Vector3(p.mx,0,p.mz),new Vector3(p.mx,1.78,p.mz)]),
  ...[-halfWidth,halfWidth].flatMap(x=>[-halfDepth,halfDepth].map(z=>new Vector3(target.x+x,0,target.z+z))),
 ]
 // The goal rig is anchored beyond the +X goal line, even when play is in
 // the opposite half. It pans from that end without changing ends or becoming
 // a high chase camera suspended above the pitch.
 const goalAnchor=mode==='goal'?new Vector3(72,24,0):undefined
 const direction=goalAnchor?goalAnchor.clone().sub(target).normalize():new Vector3(0,settings.elevation,settings.depth).normalize()
 const right=new Vector3(direction.z,0,-direction.x).normalize(),up=new Vector3().crossVectors(direction,right)
 const tanV=Math.tan(MathUtils.degToRad(fov)/2),tanH=tanV*Math.max(.1,camera.aspect)
 let distance:number=goalAnchor?goalAnchor.distanceTo(target):settings.minimum
 // Solve the perspective bounds directly. This avoids binary-searching a
 // second camera for every frame, while retaining real 3D high-ball fitting.
 for(const point of points){const relative=point.clone().sub(target),depth=relative.dot(direction)
  distance=Math.max(distance,depth+Math.abs(relative.dot(right))/(tanH*.8),depth+Math.abs(relative.dot(up))/(tanV*.7),depth+camera.near*2)
 }
 distance=Math.min(distance,Math.min(900,camera.far*.85))
 const position=target.clone().addScaledVector(direction,distance)
 return{position,target,distance,direction,fov,subjects:near.length,tactical,preset:mode}
}
