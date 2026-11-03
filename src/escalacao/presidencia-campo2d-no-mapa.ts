import {desenharMarcadorCampo2D,type MarcadorCampo2D} from './campo2d-marcador'
import * as T from 'three'
import {observarSuperficieCampo2D,pedirSuperficieCampo2D,superficieCampo2D} from './campo2d-superficie'
import type {PartidaComplexo,InspecaoPartidaComplexo} from './presidencia-complexo-partida'
import type {EstadoPartidaEstadio} from './presidencia-partida-model'
/** Projects the EXISTING Campo2D canvas onto the real pitch. No engine, rig,
 * animation, independent score or private match clock is created here. */
export function criarCampo2DNoMapa(scene:T.Scene,onReady:()=>void):PartidaComplexo{
 const root=new T.Group();root.name='campo2d-no-mapa';scene.add(root)
 const geometry=new T.PlaneGeometry(109,71),material=new T.MeshBasicMaterial({transparent:false,toneMapped:false,side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-4})
 const plane=new T.Mesh(geometry,material);plane.name='partida2d-superficie';plane.rotation.x=-Math.PI/2;plane.position.y=.095;plane.visible=false;root.add(plane)
 type Token={root:T.Group;mesh:T.Mesh;texture:T.CanvasTexture;material:T.MeshBasicMaterial;key:string}
 const tokens=new Map<string,Token>(),direction=new T.Vector3()
 const dropToken=(token:Token)=>{token.mesh.geometry.dispose();token.material.dispose();token.texture.dispose();token.root.removeFromParent()}
 function marker(key:string,art:MarcadorCampo2D,x:number,z:number,radius:number,heading:number){
  const signature=[art.name,art.color,art.number,art.portrait?.src,!!(art.portrait?.complete&&art.portrait?.naturalWidth),art.owned,art.referee].join('|')
  let token=tokens.get(key)
  if(token?.key!==signature){
   if(token)dropToken(token)
   const c=document.createElement('canvas'),ctx=c.getContext('2d')!,R=8,cy=15,scale=4,nm=art.name.length>13?art.name.split(' ').slice(-1)[0]:art.name
   ctx.font='700 8px Oswald, Arial, sans-serif';const w=Math.ceil(Math.max(30,ctx.measureText(nm).width+8)),h=36;c.width=w*scale;c.height=h*scale;ctx.setTransform(scale,0,0,scale,0,0)
   desenharMarcadorCampo2D(ctx,w/2,cy,R,art)
   const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;map.generateMipmaps=false;map.minFilter=T.LinearFilter
   const mat=new T.MeshBasicMaterial({map,transparent:true,depthWrite:false,toneMapped:false,side:T.DoubleSide}),g=new T.PlaneGeometry(w/R,h/R)
   g.translate(0,-(h/2-cy)/R,0);const mesh=new T.Mesh(g,mat);mesh.rotation.x=-Math.PI/2;mesh.scale.setScalar(radius)
   const holder=new T.Group();holder.name='marcador2d:'+key;holder.add(mesh);root.add(holder);token={root:holder,mesh,material:mat,texture:map,key:signature};tokens.set(key,token)
  }
  token.root.position.set(x,.12,z);token.root.rotation.y=heading
 }
 const ballRoot=new T.Group(),ballGeometry=new T.CircleGeometry(.68,24),ballMaterial=new T.MeshBasicMaterial({color:'#ffffff',side:T.DoubleSide,toneMapped:false}),ball=new T.Mesh(ballGeometry,ballMaterial),edgeGeometry=new T.RingGeometry(.68,.8,24),edgeMaterial=new T.MeshBasicMaterial({color:'#111111',side:T.DoubleSide,toneMapped:false}),edge=new T.Mesh(edgeGeometry,edgeMaterial)
 ball.rotation.x=edge.rotation.x=-Math.PI/2;ballRoot.name='bola2d-no-mapa';ballRoot.add(ball,edge);root.add(ballRoot);ballRoot.visible=false
 let id='',texture:T.CanvasTexture|undefined,canvas:HTMLCanvasElement|undefined,revision=-1,visible=true,viewportVisible=true,disposed=false
 let frame:InspecaoPartidaComplexo={players:0,ball:{x:0,y:.11,z:0}},subjects:ReturnType<PartidaComplexo['subjects']>=[]
 const consumer={},off=observarSuperficieCampo2D(changed=>{if(changed===id&&viewportVisible&&id&&superficieCampo2D(id)&&visible&&!disposed)onReady()})
 const update=(state:EstadoPartidaEstadio|undefined,_now:number,camera?:T.PerspectiveCamera)=>{
  if(disposed)return
  const next=state?.context.id??''
  if(id!==next){if(id)pedirSuperficieCampo2D(id,consumer,0);id=next;revision=-1;plane.visible=false;frame={players:0,ball:{x:0,y:.11,z:0}};subjects=[]}
  if(!state||!id){plane.visible=false;ballRoot.visible=false;tokens.forEach(t=>t.root.visible=false);return}
  pedirSuperficieCampo2D(id,consumer,visible&&viewportVisible?(camera&&camera.position.length()>280?6:30):0)
  const source=superficieCampo2D(id)
  if(!source){plane.visible=false;ballRoot.visible=false;tokens.forEach(t=>t.root.visible=false);return}
  if(canvas!==source.canvas){texture?.dispose();canvas=source.canvas;texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;texture.generateMipmaps=false;texture.minFilter=T.LinearFilter;texture.magFilter=T.LinearFilter;texture.matrixAutoUpdate=false;material.map=texture;material.needsUpdate=true}
  if(revision!==source.revision){
   const r=source.rect,c=source.canvas,rx=r.width/c.width,ry=r.height/c.height,tx=(r.x+r.width)/c.width,ty=1-(r.y+r.height)/c.height
   // Canvas origin is top-left; the stadium is in metres with +X attacking.
   if(source.landscape)texture!.matrix.set(-rx,0,tx,0,ry,ty,0,0,1)
   else texture!.matrix.set(0,-rx,tx,ry,0,ty,0,0,1)
   texture!.needsUpdate=true;revision=source.revision
  }
  plane.visible=true
  const seen=new Set<string>();camera?.getWorldDirection(direction);const heading=camera?Math.atan2(-direction.x,-direction.z):0
  for(const p of source.players){marker(p.key,p.marker,p.x,p.z,p.radius,heading);tokens.get(p.key)!.root.visible=true;seen.add(p.key)}
  marker('referee',{name:'',color:'#111111',number:'J',portrait:null,owned:false,referee:true},source.referee.x,source.referee.z,1.5,heading);tokens.get('referee')!.root.visible=true;seen.add('referee')
  for(const[key,t]of tokens)if(!seen.has(key)){dropToken(t);tokens.delete(key)}
  ballRoot.visible=true;ballRoot.position.set(source.ball.x,.14+source.ball.y,source.ball.z)
  subjects=source.players.map(p=>({key:p.key,name:p.name,side:p.side,keeper:p.keeper,mx:p.x,mz:p.z,visible:true}))
  frame={matchId:id,players:source.players.length,ball:{...source.ball},time:source.minute,phase:state.finished?'fim':'dominio',replay:false,official:undefined}
 }
 return{update,subjects:()=>subjects,frame:()=>frame,inspect:()=>({...frame,ball:{...frame.ball},detail:{design:'campo2d-canvas-compartilhado',sourceId:id,surfaceRevision:revision,ready:revision>=0,actors:frame.players,skinnedPlayers:0,sameCanvas:true,score:superficieCampo2D(id)?.score,narration:superficieCampo2D(id)?.narration} as unknown as InspecaoPartidaComplexo['detail']}),setPresentationVisible:value=>{root.visible=value},setViewportVisible:value=>{viewportVisible=value;if(id&&!value)pedirSuperficieCampo2D(id,consumer,0)},
  dispose(){if(disposed)return;disposed=true;off();if(id)pedirSuperficieCampo2D(id,consumer,0);texture?.dispose();tokens.forEach(dropToken);tokens.clear();ballGeometry.dispose();ballMaterial.dispose();edgeGeometry.dispose();edgeMaterial.dispose();geometry.dispose();material.dispose();root.removeFromParent()}}
}
