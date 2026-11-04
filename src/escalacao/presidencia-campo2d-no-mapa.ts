import type {MarcadorCampo2D} from './campo2d-marcador'
import * as T from 'three'
import {arteMarcadorMapa,arteNomeMapa,escolherRotulosCampo2D,type RotuloCampo2D} from './presidencia-campo2d-legibilidade'
import {observarSuperficieCampo2D,pedirSuperficieCampo2D,superficieCampo2D} from './campo2d-superficie'
import type {PartidaComplexo,InspecaoPartidaComplexo} from './presidencia-complexo-partida'
import type {EstadoPartidaEstadio} from './presidencia-partida-model'
import {atualizarRedesGol3D} from './presidencia-rede-gol-3d'

/** Same Campo2D positions, on the native stadium grass, markings and goals.
 * No opaque pitch overlay, football rig, match engine or independent clock. */
export function criarCampo2DNoMapa(scene:T.Scene,onReady:()=>void,nativeField?:T.Object3D):PartidaComplexo{
 const root=new T.Group();root.name='campo2d-no-mapa';scene.add(root)
 const circle=new T.PlaneGeometry(1,1),ringGeometry=new T.RingGeometry(1.08,1.19,40)
 const ringMaterial=new T.MeshBasicMaterial({color:'#FFC400',side:T.DoubleSide,transparent:true,opacity:.95,depthWrite:false,toneMapped:false})
 const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=64
 const sg=shadowCanvas.getContext('2d')!,gradient=sg.createRadialGradient(32,32,4,32,32,31);gradient.addColorStop(0,'rgba(0,0,0,.32)');gradient.addColorStop(.65,'rgba(0,0,0,.13)');gradient.addColorStop(1,'rgba(0,0,0,0)');sg.fillStyle=gradient;sg.fillRect(0,0,64,64)
 const shadowTexture=new T.CanvasTexture(shadowCanvas),shadowMaterial=new T.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false,toneMapped:false})
 const shadows=new T.InstancedMesh(circle,shadowMaterial,23),shadowPose=new T.Object3D();shadows.name='sombras-marcadores2d';shadows.frustumCulled=false;shadows.count=0;shadows.instanceMatrix.setUsage(T.DynamicDrawUsage);root.add(shadows)
 type Token={root:T.Group;icon:T.Sprite;label?:T.Sprite;ring:T.Mesh;texture:T.CanvasTexture;labelTexture?:T.CanvasTexture;key:string;portrait:boolean;owned:boolean}
 const tokens=new Map<string,Token>(),direction=new T.Vector3(),relative=new T.Vector3(),projected=new T.Vector3()
 const texture=(canvas:HTMLCanvasElement)=>{const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;map.minFilter=T.LinearMipmapLinearFilter;return map}
 const drop=(token:Token)=>{token.icon.material.dispose();token.label?.material.dispose();token.texture.dispose();token.labelTexture?.dispose();token.root.removeFromParent()}
 function marker(key:string,art:MarcadorCampo2D,x:number,z:number,radius:number){
  const portrait=!!(art.portrait?.complete&&art.portrait.naturalWidth),signature=[art.name,art.color,art.number,art.portrait?.src,portrait,art.referee].join('|')
  let token=tokens.get(key)
  if(token?.key!==signature){
   if(token)drop(token)
   const map=texture(arteMarcadorMapa(art)),icon=new T.Sprite(new T.SpriteMaterial({map,transparent:true,depthWrite:false,toneMapped:false}))
   icon.name='icone2d:'+key;icon.scale.set(2*radius,2*radius,1)
   const ring=new T.Mesh(ringGeometry,ringMaterial);ring.rotation.x=-Math.PI/2;ring.position.y=.04;ring.scale.setScalar(radius)
   const holder=new T.Group();holder.name='marcador2d:'+key;holder.add(ring,icon);root.add(holder)
   token={root:holder,icon,ring,texture:map,key:signature,portrait,owned:art.owned}
   if(art.name){
    const canvas=arteNomeMapa(art.name),labelTexture=texture(canvas),label=new T.Sprite(new T.SpriteMaterial({map:labelTexture,transparent:true,depthWrite:false,depthTest:false,toneMapped:false}))
    label.name='nome2d:'+key;label.center.set(.5,2.05);label.scale.set(radius*.94*canvas.width/canvas.height,radius*.94,1);label.renderOrder=12;label.visible=false;holder.add(label);token.label=label;token.labelTexture=labelTexture
   }
   tokens.set(key,token)
  }
  if(token.key===signature&&token.root.parent)desliza(token.root,x,0,z);else token.root.position.set(x,0,z);token.owned=art.owned;token.ring.visible=art.owned
  token.icon.scale.set(2*radius,2*radius,1);token.ring.scale.setScalar(radius)
  if(token.label&&token.labelTexture){const image=token.labelTexture.image as HTMLCanvasElement;token.label.scale.set(radius*.94*image.width/image.height,radius*.94,1)}
  return token
 }
 // ⚽ 04/11 (Diego: *"bola com gomos também não tá aparecendo no campo da aba mapa"*): era uma esferinha com textura miúda que de
 // longe virava um ponto branco. Agora é a MESMA bola do campinho da aba Jogos (branca, gomos pretos, contorno), desenhada de frente
 // pra câmera e no mesmo tamanho em relação aos bonecos; os gomos giram conforme ela rola.
 const ballCanvas=document.createElement('canvas');ballCanvas.width=ballCanvas.height=128
 {const g=ballCanvas.getContext('2d')!,c=64,r=56;g.beginPath();g.arc(c,c,r,0,Math.PI*2);g.fillStyle='#ffffff';g.fill();g.save();g.beginPath();g.arc(c,c,r,0,Math.PI*2);g.clip();g.fillStyle='#151515'
  for(let k=0;k<4;k++){const a=k*1.75,rr=k?r*.95:0,gx=c+Math.cos(a)*rr,gy=c+Math.sin(a)*rr,g5=r*(k?.36:.42);g.beginPath();for(let v=0;v<5;v++){const aa=a+v*1.2566;v?g.lineTo(gx+Math.cos(aa)*g5,gy+Math.sin(aa)*g5):g.moveTo(gx+Math.cos(aa)*g5,gy+Math.sin(aa)*g5)}g.closePath();g.fill()}
  g.restore();g.beginPath();g.arc(c,c,r,0,Math.PI*2);g.lineWidth=7;g.strokeStyle='#111';g.stroke()}
 const ballTexture=texture(ballCanvas),ballGeometry=new T.PlaneGeometry(1,1),ballMaterial=new T.SpriteMaterial({map:ballTexture,toneMapped:false,transparent:true,depthWrite:false}),ball=new T.Sprite(ballMaterial);ball.renderOrder=15;ball.scale.set(1.45,1.45,1)
 ball.name='bola2d-no-mapa';root.add(ball);ball.visible=false
 const ballShadow=new T.Mesh(circle,shadowMaterial);ballShadow.name='sombra-bola2d';ballShadow.rotation.x=-Math.PI/2;ballShadow.position.y=.03;root.add(ballShadow);ballShadow.visible=false
 let id='',revision=-1,viewportVisible=true,disposed=false,lastBall:{x:number;z:number}|undefined,lastMinute=0,labels=new Set<string>(),fontRevision=0
 let net:{key:string;y:number;z:number}|undefined
 let frame:InspecaoPartidaComplexo={players:0,ball:{x:0,y:.11,z:0}},subjects:ReturnType<PartidaComplexo['subjects']>=[]
 const consumer={},off=observarSuperficieCampo2D(changed=>{if(changed===id&&viewportVisible&&!disposed)onReady()})
 void document.fonts?.ready.then(()=>{if(!disposed){fontRevision++;for(const token of tokens.values())token.key='';onReady()}})
 const hide=()=>{ball.visible=ballShadow.visible=false;shadows.count=0;net=undefined;if(nativeField)atualizarRedesGol3D(nativeField,{time:0,ball:{}});tokens.forEach(t=>{t.root.visible=false})}
 // 🧈 04/11 (Diego: *"bola travando"*): o campinho manda as posições ~30 vezes por segundo e o mapa desenha a 60 — sem nada no meio,
 // jogador e bola andavam em degrauzinho. Agora cada um DESLIZA até a posição nova (fração por quadro presa no tempo real);
 // pulo grande (gol, reposição, começo) vai direto.
 let suave=1,ultimoQuadro=0
 const desliza=(o:T.Object3D,x:number,y:number,z:number)=>{const dx=x-o.position.x,dz=z-o.position.z;if(suave>=1||dx*dx+dz*dz>64)o.position.set(x,y,z);else o.position.set(o.position.x+dx*suave,o.position.y+(y-o.position.y)*suave,o.position.z+dz*suave)}
 const update=(state:EstadoPartidaEstadio|undefined,_now:number,camera?:T.PerspectiveCamera)=>{
  {const agora=performance.now(),dt=ultimoQuadro?Math.min(.25,(agora-ultimoQuadro)/1000):1;ultimoQuadro=agora;suave=dt>=.25?1:1-Math.exp(-dt*22)}
  if(disposed)return
  const next=state?.context.id??''
  if(id!==next){if(id)pedirSuperficieCampo2D(id,consumer,0);id=next;revision=-1;lastBall=undefined;labels.clear();hide();frame={players:0,ball:{x:0,y:.11,z:0}};subjects=[]}
  if(!state||!id){hide();return}
  const distant=!!camera&&camera.position.length()>280
  pedirSuperficieCampo2D(id,consumer,viewportVisible?(distant?6:30):0)
  const source=superficieCampo2D(id);if(!source){hide();return}
  revision=source.revision
  const seen=new Set<string>(),candidates:RotuloCampo2D[]=[],obstacles:RotuloCampo2D[]=[];let shadowIndex=0
  const shadowAt=(x:number,z:number,radius:number)=>{if(shadowIndex>=23)return;shadowPose.position.set(x,.028,z);shadowPose.rotation.set(-Math.PI/2,0,0);shadowPose.scale.setScalar(2.6*radius);shadowPose.updateMatrix();shadows.setMatrixAt(shadowIndex++,shadowPose.matrix)}
  camera?.getWorldDirection(direction)
  const tan=camera?Math.tan(T.MathUtils.degToRad(camera.fov)*.5):1,anchor=camera?Math.hypot(direction.x,direction.z):.5
  for(const p of source.players){
   const token=marker(p.key,p.marker,p.x,p.z,p.radius);token.root.visible=true;seen.add(p.key);token.icon.position.y=p.radius*anchor+.10;shadowAt(p.x,p.z,p.radius)
   if(camera){projected.set(p.x,token.icon.position.y,p.z).project(camera);relative.set(p.x,token.icon.position.y,p.z).sub(camera.position);const depth=relative.dot(direction);if(depth>0)obstacles.push({key:p.key,x:projected.x,y:projected.y,halfWidth:p.radius/(depth*tan*camera.aspect),halfHeight:p.radius/(depth*tan),priority:0})}
   if(token.label){
    token.label.position.copy(token.icon.position)
    const distance=Math.hypot(p.x-source.ball.x,p.z-source.ball.z)
    if(camera&&!distant&&token.owned){ // 🏷️ 04/11: nome só de quem ENCOSTA na bola (igual no campinho da aba Jogos)
     projected.set(p.x,token.icon.position.y,p.z).project(camera);relative.set(p.x,token.icon.position.y,p.z).sub(camera.position)
     const depth=relative.dot(direction),hh=token.label.scale.y/(2*depth*tan),hw=token.label.scale.x/(2*depth*tan*camera.aspect)
     if(depth>0&&projected.z>-1&&projected.z<1)candidates.push({key:p.key,x:projected.x,y:projected.y-3.1*hh,halfWidth:hw,halfHeight:hh,priority:(token.owned?-100:token.portrait?-25:0)+distance})
    }
   }
  }
  const ref=marker('referee',{name:'',color:'#FFC400',number:'J',portrait:null,owned:false,referee:true},source.referee.x,source.referee.z,1.05);ref.icon.position.y=1.05*anchor+.10;ref.root.visible=true;seen.add('referee')
  shadowAt(source.referee.x,source.referee.z,1.05);shadows.count=shadowIndex;shadows.instanceMatrix.needsUpdate=true
  for(const[key,t]of tokens)if(!seen.has(key)){drop(t);tokens.delete(key)}
  if(camera){projected.set(source.ball.x,.65+Math.max(0,source.ball.y-.11),source.ball.z).project(camera);relative.set(source.ball.x,.65+Math.max(0,source.ball.y-.11),source.ball.z).sub(camera.position);const depth=relative.dot(direction);if(depth>0)obstacles.push({key:'ball',x:projected.x,y:projected.y,halfWidth:.8/(depth*tan*camera.aspect),halfHeight:.8/(depth*tan),priority:0})}
  labels=escolherRotulosCampo2D(candidates,labels,4,obstacles)
  for(const[key,token]of tokens)if(token.label)token.label.visible=labels.has(key)
  const height=Math.max(0,source.ball.y-.11)
  if(nativeField){
   const impact=source.net
   if(impact){const key=id+':'+impact.sign+':'+impact.time;if(net?.key!==key)net={key,y:T.MathUtils.clamp(.65+height,.3,2.2),z:T.MathUtils.clamp(source.ball.z,-3.5,3.5)}}else net=undefined
   atualizarRedesGol3D(nativeField,{time:impact?.age??0,ball:{netImpact:impact&&net?{sign:impact.sign,time:0,y:net.y,z:net.z,strength:.7}:undefined}})
  }
  ball.visible=ballShadow.visible=true;desliza(ball,source.ball.x,.65+height,source.ball.z);ballShadow.position.set(ball.position.x,.03,ball.position.z);ballShadow.scale.setScalar(1.8+Math.min(2,height*.15))
  if(lastBall&&source.minute>=lastMinute){const dx=source.ball.x-lastBall.x,dz=source.ball.z-lastBall.z,distance=Math.hypot(dx,dz);if(distance>.0001&&distance<8){ballMaterial.rotation+=distance/.7*(dx+dz>=0?1:-1)}}
  lastBall={x:source.ball.x,z:source.ball.z};lastMinute=source.minute
  subjects=source.players.map(p=>({key:p.key,name:p.name,side:p.side,keeper:p.keeper,mx:p.x,mz:p.z,visible:true}))
  frame={matchId:id,players:source.players.length,ball:{...source.ball},time:source.minute,phase:state.finished?'fim':'dominio',replay:false,official:undefined}
 }
 return{update,subjects:()=>subjects,frame:()=>frame,inspect:()=>({...frame,ball:{...frame.ball},detail:{design:'campo2d-marcadores-no-gramado-original',sourceId:id,surfaceRevision:revision,ready:revision>=0,actors:frame.players,skinnedPlayers:0,sameSource:true,nativePitch:true,pitchUploads:0,labels:[...labels],portraitMarkers:[...tokens.values()].filter(t=>t.portrait).length,fontRevision,score:superficieCampo2D(id)?.score,narration:superficieCampo2D(id)?.narration} as unknown as InspecaoPartidaComplexo['detail']}),setPresentationVisible:value=>{root.visible=value},setViewportVisible:value=>{viewportVisible=value;if(id&&!value)pedirSuperficieCampo2D(id,consumer,0)},
  dispose(){if(disposed)return;disposed=true;off();if(id)pedirSuperficieCampo2D(id,consumer,0);tokens.forEach(drop);tokens.clear();shadows.dispose();circle.dispose();ringGeometry.dispose();ringMaterial.dispose();shadowTexture.dispose();shadowMaterial.dispose();ballGeometry.dispose();ballTexture.dispose();ballMaterial.dispose();root.removeFromParent()}}
}
