import * as T from 'three'
import {createCivilian} from '../cidade3d/civilians.mjs'
import {centroTrecho} from './cenas'
import {DURACAO_CENA,type PedidoCena} from '../cenas-bairro-model'
import {publicarCena,quadroCenaAtual} from '../cenas-bairro-playback'

/** A bounded cast from the game's actual avatar assets. Only the visible scene owns poses/props. */
export function criarTrechoBairro(parent:T.Object3D,wake:()=>void,ground:(x:number,z:number)=>number=()=>.19){
 const root=new T.Group();root.name='bairro-primeiro-plano';parent.add(root)
 let cue:PedidoCena|undefined,people:ReturnType<typeof createCivilian>[]=[],ready=0,failed=false,time=0,last=0,requestedAt=0,reduced=false,color='#1b7a3d',generation=0,posedAt=-1
 const props=new T.Group();root.add(props)
 let ball:T.Mesh|undefined,label:T.Sprite|undefined
 const carried:T.Object3D[]=[]
 const ownedGeometries:T.BufferGeometry[]=[],ownedMaterials:T.Material[]=[],textures:T.Texture[]=[]
 function mesh(geometry:T.BufferGeometry,shade:string,x:number,y:number,z:number){const material=new T.MeshLambertMaterial({color:shade});ownedGeometries.push(geometry);ownedMaterials.push(material);const m=new T.Mesh(geometry,material);m.position.set(x,y,z);props.add(m);return m}
 function box(w:number,h:number,d:number,x:number,y:number,z:number,shade:string){return mesh(new T.BoxGeometry(w,h,d),shade,x,y,z)}
 function disposePeople(){people.forEach(p=>p.dispose());people=[];props.clear();ownedGeometries.splice(0).forEach(g=>g.dispose());ownedMaterials.splice(0).forEach(m=>m.dispose());textures.splice(0).forEach(t=>t.dispose());ball=undefined;label=undefined;carried.length=0;ready=0}
 function publish(){if(!cue)return;publicarCena({key:cue.key,phase:failed?'unavailable':ready<people.length?'loading':reduced&&!cue.manual?'paused':time>=DURACAO_CENA?'ended':'playing',seconds:time,duration:DURACAO_CENA})}
 function createProps(next:PedidoCena){
  const c=centroTrecho(next.view),y=ground(c.x,c.z)
  if(['lazer','retorno','base'].includes(next.kind)){ball=mesh(new T.IcosahedronGeometry(.18,2),'#f4ecd6',c.x,y+.25,c.z);const band=mesh(new T.TorusGeometry(.18,.022,4,12),'#1b7a3d',0,0,0);ball.add(band)}
  if(next.kind==='noitada'){
   for(const s of [-1,1]){box(.55,1.6,.45,c.x+s*3.2,y+.8,c.z-1.5,'#18131e');const lamp=new T.PointLight(s===1?'#9d4dff':'#ef509c',6,8,2);lamp.position.set(c.x+s*2,y+2.1,c.z-.5);props.add(lamp)}
  }
  if(next.kind==='recuperacao'){
   box(1.5,.025,1,c.x,y+.015,c.z,'#688778');box(.7,.45,.5,c.x-1.8,y+.225,c.z-.4,'#f4ecd6');box(.35,.12,.15,c.x-1.8,y+.52,c.z-.4,'#c2452f')
  }
  if(['retorno','base','tecnico'].includes(next.kind))for(let i=0;i<4;i++)mesh(new T.ConeGeometry(.15,.3,6),'#ef7838',c.x-2+i*1.3,y+.15,c.z+1)
  if(['contratacao','coletiva','patrocinio','marca'].includes(next.kind)){
   // Temporary presentation area in the existing stadium entrance, not a paid/new map facility.
   box(6,2.8,.1,c.x,y+1.4,c.z-1.2,'#142c21');box(3.2,.12,.6,c.x,y+.86,c.z+.25,'#e2d6b7');for(const s of [-1,1])box(.08,.85,.5,c.x+s*1.3,y+.43,c.z+.25,'#202820')
   for(let row=0;row<3;row++)for(let col=0;col<6;col++)box(.55,.18,.025,c.x-2.5+col,y+.5+row*.8,c.z-1.13,(row+col)%2?'#f4ecd6':color)
   box(.06,.4,.06,c.x+.5,y+1.1,c.z+.22,'#1a1a1a');mesh(new T.SphereGeometry(.08,6,4),'#121212',c.x+.5,y+1.33,c.z+.22)
  }
  if(next.ator){
   const canvas=document.createElement('canvas');canvas.width=256;canvas.height=64;const ctx=canvas.getContext('2d')!
   ctx.fillStyle='#0c0c0c';ctx.fillRect(0,0,256,64);ctx.fillStyle='#ffc400';ctx.font='bold 42px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(next.ator.nome,128,32,240)
   const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;textures.push(texture)
   const material=new T.SpriteMaterial({map:texture,depthTest:false});ownedMaterials.push(material);label=new T.Sprite(material);label.scale.set(2.2,.55,1);props.add(label)
  }
 }
 function start(next:PedidoCena|undefined,shirt=color,reduce=false){
  color=shirt;reduced=reduce
  if(!next){generation++;cue=undefined;disposePeople();root.visible=false;last=0;return}
  if(cue?.key===next.key&&!failed){if(next.replay){time=0;last=0;posedAt=-1}cue={...next};publish();return}
  const token=++generation;disposePeople();cue={...next};posedAt=-1;ready=0;failed=false;const saved=quadroCenaAtual();time=!next.replay&&saved.key===next.key?saved.seconds:0;last=0;requestedAt=performance.now();root.visible=true
  createProps(next)
  const cast=next.kind==='recuperacao'?2:['contratacao','coletiva','patrocinio','marca'].includes(next.kind)?3:4
  for(let i=0;i<cast;i++){
   const person=createCivilian(root,{id:`momento-${i===0&&next.ator?`${next.ator.nome}|${next.ator.club}|${next.ator.year}`:next.key}-${i}`,variant:i===0&&next.ator?'adult-man':i%2?'adult-woman':'adult-man',outfitColor:next.kind==='tecnico'&&i===0?'#263b35':i<2?color:'#eee5cf',poseFPS:18,onReady:()=>wake()})
   people.push(person)
   if(['loja','obra','despedida','viagem'].includes(next.kind)){
    const bag=mesh(new T.BoxGeometry(.23,.28,.12),'#bca47b',0,0,0);carried[i]=bag
   }
   if(next.kind==='contratacao'&&i===0){
    const jersey=new T.Group();props.add(jersey);carried[i]=jersey
    const body=box(.42,.45,.04,0,0,0,color),arms=box(.72,.16,.04,0,.15,0,color);jersey.add(body,arms)
   }
   person.ready.then(ok=>{if(token!==generation||!cue)return;ready++;if(!ok)failed=true;person.root.traverse(n=>{if(n instanceof T.Mesh){n.castShadow=false;n.receiveShadow=false}});publish();wake()})
  }
  publish();wake()
 }
 function update(now:number,reduce:boolean,parade?:T.Object3D){
  if(!cue)return
  reduced=reduce
  if(ready<people.length&&now-requestedAt>12000)failed=true
  if(ready<people.length||failed){publish();return}
  const playing=!failed&&(!reduced||cue.manual)&&time<DURACAO_CENA
  if(playing&&last)time=Math.min(DURACAO_CENA,time+Math.max(0,Math.min(.15,(now-last)/1000)))
  last=now
  const c=centroTrecho(cue.view),onBus=cue.kind==='titulo'&&!!parade
  root.position.copy(onBus?parade!.position:new T.Vector3());root.rotation.y=onBus?parade!.rotation.y:0
  const celebrating=['classico','recorde','titulo','acesso','marca'].includes(cue.kind),shop=cue.kind==='loja',exit=cue.kind==='despedida',work=cue.kind==='obra',foot=cue.kind==='lazer',dance=cue.kind==='noitada',recovery=cue.kind==='recuperacao',training=['retorno','base'].includes(cue.kind),presentation=['contratacao','coletiva','patrocinio','marca'].includes(cue.kind),walk=shop||exit||work||['torcida','viagem'].includes(cue.kind)
  if(posedAt!==time||posedAt<0){
   people.forEach((p,i)=>{
    const approach=Math.min(1,Math.max(0,(time-i*.32)/4.4)),outward=exit||shop,travel=shop||work?1.8:3.2
    let x=c.x+(i%2?1:-1)*(1.15+Math.floor(i/2)*.8)+(work?approach*travel:0),z=c.z+Math.floor(i/2)*1.2+(walk&&!work?(outward?1:-1)*approach*travel:0),angle=work?Math.PI/2:walk?(outward?0:Math.PI):i%2?-.65:.65
    if(foot){x=c.x+(i%2?4:-4);z=c.z+(i<2?-1.7:1.7);angle=i%2?-Math.PI/2:Math.PI/2}
    if(dance){x=c.x+(i%2?1.05:-1.05);z=c.z+(i<2?0:-1.3);angle=i%2?-.55:.55}
    if(recovery){x=c.x+(i===0?0:i===1?1.2:-2);z=c.z+(i>1?2:0);angle=i===1?-Math.PI/2:0}
    if(presentation){x=c.x+(i===0?0:i===1?1.4:-2);z=c.z+(i>1?2.8:0);angle=i>1?Math.PI:0}
    if(training){x=c.x+(i===0?-.6:i%2?2.3:-2.3);z=c.z+(i>1?-1.4:0);angle=i===0?Math.PI/2:0}
    const y=ground(x,z);p.root.position.set(onBus?(i%2?.45:-.45):x,onBus?2.95:y,onBus?-2.6+i*1.6:z);p.root.rotation.y=angle
    const volley=Math.floor(time/1.3),hitActor=[0,3,2,1][volley%4],local=(time/1.3)%1
    const hit=foot?(i===hitActor?Math.min(1,local/.24):0):training&&i===0?(time%1.3)/1.3:0
    p.update({seconds:time+i*.43,distance:walk?approach*travel:0,speed:playing&&walk&&approach<1?.75:0,activity:dance?'dancing':foot?'footvolley':training&&i===0?'training':recovery?'recovering':presentation&&i<2||cue!.kind==='tecnico'&&i===0?'presenting':celebrating?'celebrating':shop||work||exit?'carrying':undefined,activityTime:foot||training?hit:(time+i*.5)%2.8,visible:true,detail:'near'},time===DURACAO_CENA)
    const held=carried[i];if(held){held.position.set(x+(cue!.kind==='contratacao'?0:.35*Math.cos(angle)),y+(cue!.kind==='contratacao'?1.08:.83),z+(cue!.kind==='contratacao'?.45:-.35*Math.sin(angle)));held.rotation.y=angle}
    if(i===0&&label)label.position.set(x,y+2.35,z)
   })
   if(ball){const round=Math.floor(time/1.3),phase=(time/1.3)%1,u=Math.max(0,(phase-.12)/.88),from=[0,3,2,1][round%4],to=[0,3,2,1][(round+1)%4],x=(i:number)=>i%2?3.25:-3.25,z=(i:number)=>i<2?-1.7:1.7;ball.position.set(c.x+(foot?x(from)+(x(to)-x(from))*u:-.6+Math.sin(time*2)*.5),ground(c.x,c.z)+.35+(foot?3.45*Math.sin(Math.PI*u):.45*Math.abs(Math.sin(time*4))),c.z+(foot?z(from)+(z(to)-z(from))*u:0));ball.rotation.set(time*3,time*5,0)}
   posedAt=time
  }
  publish()
 }
 return {start,update,playing:()=>!!cue&&!failed&&(ready<people.length||(!reduced||cue.manual)&&time<DURACAO_CENA),view:()=>cue?.view,active:()=>!!cue,inspect:()=>({key:cue?.key,kind:cue?.kind,actor:cue?.ator,time,duration:DURACAO_CENA,ready,failed,ball:ball?.position.toArray(),characters:people.map(p=>p.inspect())}),dispose(){generation++;cue=undefined;disposePeople();root.removeFromParent()}}
}
