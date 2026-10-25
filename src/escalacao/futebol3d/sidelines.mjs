import * as T from 'three';
import {createCartoonPlayer} from './cartoon/player.mjs';
import {createCartoonRig,renameCivilClip} from './cartoon/rig.mjs';
import {BANCO_Z,TECNICO_Z} from '../presidencia-area-tecnica.ts';
import {playerDetail} from './lod.mjs';
import {apontaOsso} from './players.mjs';

const angle=v=>Math.atan2(Math.sin(v),Math.cos(v));
const skins={light:'#e1b592',warm:'#c89165',medium:'#af6f41',brown:'#7a4b2f',deep:'#4f3021'};
export function realBench(state,frame,side){
 const active=new Set(frame.players.filter(p=>p.side===side).map(p=>p.id)),sentOff=new Set((frame.official?.events??[]).filter(e=>e.tipo==='vermelho'&&e.lado===(side==='home'?0:1)).map(e=>e.a)),seen=new Set();
 // Preserve identity from the existing roster; no filler or new card.
 return(state.context[side==='home'?'homeBench':'awayBench']??[]).filter(p=>{
  if(p.fake||!p.id?.trim()||!p.name?.trim()||!['GOL','LAT','ZAG','MEI','ATA'].includes(p.pos)||active.has(p.id)||sentOff.has(p.name)||seen.has(p.id))return false;
  seen.add(p.id);return true;
 }).slice(0,7);
}
function nativePose(actor,name,time){
 actor.mixer.stopAllAction();for(const p of actor.reference){p.node.position.copy(p.p);p.node.quaternion.copy(p.q);p.node.scale.copy(p.s)}
 const action=actor.actions.get(name);if(!action)throw Error('Captura de apoio indisponível: '+name);
 action.reset().play();action.timeScale=0;action.setLoop(T.LoopOnce,1);action.clampWhenFinished=true;action.time=time;actor.mixer.update(0);actor.holder.updateMatrixWorld(true);
}
function align(actor,x,z,heading){
 actor.holder.position.set(x,0,z);actor.holder.rotation.y=heading;actor.holder.updateMatrixWorld(true);
 const hip=actor.pelvis.getWorldPosition(new T.Vector3());actor.holder.position.x+=x-hip.x;actor.holder.position.z+=z-hip.z;
 actor.holder.updateMatrixWorld(true);
 const skin=actor.soleMesh,indices=actor.soleIndices;
 let low=Infinity;for(const i of indices)low=Math.min(low,skin.getVertexPosition(i,new T.Vector3()).applyMatrix4(skin.matrixWorld).y);
 if(Number.isFinite(low))actor.holder.position.y-=low;actor.holder.updateMatrixWorld(true);actor.footFloor=Infinity;for(const i of indices)actor.footFloor=Math.min(actor.footFloor,skin.getVertexPosition(i,new T.Vector3()).applyMatrix4(skin.matrixWorld).y);
}
function soles(actor){
 const skin=actor.kit?.mesh??actor.meshes.find(m=>m.material.name==='Skin')??actor.meshes[0],ix=skin.geometry.attributes.skinIndex,w=skin.geometry.attributes.skinWeight,ids=new Set(skin.skeleton.bones.map((b,i)=>/^foot_[lr]$/.test(b.name)?i:-1));actor.soleMesh=skin;
 actor.soleIndices=[];for(let i=0;i<ix.count;i++)for(const get of ['getX','getY','getZ','getW'])if(ids.has(ix[get](i))&&w[get](i)>.5){actor.soleIndices.push(i);break;}
}
function avoidReferee(actor,p,frame,athletes,dt,reset){
 const origin=new T.Vector2(p.x,p.z),desired=new T.Vector2(),heading=p.heading??0,travel=new T.Vector2(Math.sin(heading),Math.cos(heading));
 // Anticipate a crossing before the official's large head reaches an athlete.
 // Only the referee's bounded presentation offset moves; source paths/ball do not.
 for(const player of frame.players){if(player.visible===false)continue;const a=athletes?.find(a=>a.key===player.key),head=a?.headCenterLocal?a.bones.get('Head').localToWorld(a.headCenterLocal.clone()):null,at=new T.Vector2(head?.x??player.mx,head?.z??player.mz),velocity=new T.Vector2(Math.sin(player.heading),Math.cos(player.heading)).multiplyScalar(player.speed);
  for(const horizon of [.5,.25,0]){const delta=origin.clone().addScaledVector(travel,(p.speed??0)*horizon).sub(at.clone().addScaledVector(velocity,horizon)),distance=delta.length(),radius=horizon?1.4:.95;if(distance>=radius)continue;if(distance<.05)delta.set(travel.y,-travel.x);else delta.divideScalar(distance);desired.addScaledVector(delta,(radius-distance)*(horizon?.8:1));}
 }
 desired.clampLength(0,1.8);actor.avoidance??=new T.Vector2();if(reset)actor.avoidance.copy(desired);else{const step=desired.sub(actor.avoidance).multiplyScalar(1-Math.exp(-dt/.08)).clampLength(0,dt*4);actor.avoidance.add(step);}
 return{x:p.x+actor.avoidance.x,z:p.z+actor.avoidance.y};
}
function separateReferee(actor,p,athletes){
 if(!athletes)return;
 const head=actor.bones.get('Head').localToWorld(actor.sidelineHeadCenter.clone()),origin=new T.Vector2(p.x,p.z),start=new T.Vector2(actor.holder.position.x,actor.holder.position.z),obstacles=athletes.filter(a=>a.holder.visible&&a.headCenterLocal).map(a=>({head:a.bones.get('Head').localToWorld(a.headCenterLocal.clone()),radius:a.headRadius+actor.sidelineHeadRadius+.025}));
 const valid=offset=>obstacles.every(o=>Math.hypot(head.x+offset.x-o.head.x,head.y-o.head.y,head.z+offset.y-o.head.z)>=o.radius),shift=new T.Vector2();
 if(valid(shift))return;
 for(let iteration=0;iteration<8;iteration++){
  for(const o of obstacles){const dy=head.y-o.head.y;if(Math.abs(dy)>=o.radius)continue;const radius=Math.sqrt(o.radius*o.radius-dy*dy),delta=new T.Vector2(head.x+shift.x-o.head.x,head.z+shift.y-o.head.z),distance=delta.length();if(distance>=radius)continue;if(distance<1e-5)delta.set(Math.cos(p.heading),-Math.sin(p.heading));else delta.divideScalar(distance);shift.addScaledVector(delta,radius-distance);}
  const offset=start.clone().add(shift).sub(origin).clampLength(0,2.4);shift.copy(origin).add(offset).sub(start);if(valid(shift))break;
 }
 if(!valid(shift)){let best=null;for(const radius of [.6,1.2,1.8,2.4])for(let i=0;i<24;i++){const point=origin.clone().add(new T.Vector2(Math.cos(i*Math.PI/12),Math.sin(i*Math.PI/12)).multiplyScalar(radius)),candidate=point.clone().sub(start);if(valid(candidate)&&(!best||candidate.lengthSq()<best.lengthSq()))best=candidate;}if(best)shift.copy(best);}
 actor.holder.position.x+=shift.x;actor.holder.position.z+=shift.y;actor.holder.updateMatrixWorld(true);actor.avoidance.set(actor.holder.position.x-p.x,actor.holder.position.z-p.z);actor.refereeProjection=shift.length();
}
/** Same approved avatar and acquired clips. No football decisions/clock here. */
export async function loadSidelines(scene,source,state,frame,kitPlan,{president,gait}={}){
 const root=new T.Group();root.name='civil-match-officials-and-benches';scene.add(root);
 const actors=[],ownedMaterials=new Set(),ownedGeometry=new Set();let disposed=false,lastTime=null;
 function seat(side,x){
  const area=new T.Group();area.name=side+'-civil-technical-area';root.add(area);
  const material=new T.MeshStandardMaterial({color:'#384c51',roughness:.88}),legs=new T.MeshStandardMaterial({color:'#afb3ae',roughness:.88});ownedMaterials.add(material);ownedMaterials.add(legs);
  for(const [w,h,d,dx,y,z,m]of [[10,.10,.65,0,.225,BANCO_Z,material],[10,.60,.08,0,.64,BANCO_Z-.36,material],[.12,.175,.5,-4.5,.0875,BANCO_Z,legs],[.12,.175,.5,4.5,.0875,BANCO_Z,legs]]){
   const geometry=new T.BoxGeometry(w,h,d),mesh=new T.Mesh(geometry,m);ownedGeometry.add(geometry);mesh.position.set(x+dx,y,z);mesh.castShadow=mesh.receiveShadow=true;area.add(mesh);
  }
  const white=new T.MeshStandardMaterial({color:'#e9e5d9',roughness:.88});ownedMaterials.add(white);
  for(const[w,d,dx,z]of [[.10,2.4,-6,-35.6],[.10,2.4,6,-35.6],[12,.10,0,-34.4]]){const geometry=new T.BoxGeometry(w,.025,d),mesh=new T.Mesh(geometry,white);ownedGeometry.add(geometry);mesh.position.set(x+dx,.03,z);area.add(mesh);}
 }
 async function add(role,side,id,config,options={}){
  let actor;
  if(role==='coach'){
   actor=createCartoonRig(source.gltf);const copies=new Map();actor.root.traverse(n=>{if(!n.isSkinnedMesh)return;const original=n.material;if(!copies.has(original)){const m=original.clone();m.roughness=.88;if(m.name==='Shirt')m.color.set('#28343b');if(m.name==='Skin'&&options.skinColor)m.color.set(options.skinColor);copies.set(original,m);ownedMaterials.add(m)}n.material=copies.get(original);n.castShadow=n.receiveShadow=true;});
   for(const name of ['Idle','Walk'])actor.actions.set(name,actor.mixer.clipAction(renameCivilClip(source.gltf.animations.find(c=>c.name===name),name)));
  }else{
   actor=await createCartoonPlayer(source,config,options);
   const sit=renameCivilClip(source.gltf.animations.find(c=>c.name==='SitDown'),'SidelineSit');actor.actions.set('SidelineSit',actor.mixer.clipAction(sit));
  }
  actor.role=role;actor.side=side;actor.id=id;actor.holder.name=role==='referee'?'match-civil-referee':side+'-civil-'+role+':'+id;
  actor.lastPose=-Infinity;actor.lastHeading=null;soles(actor);const headBox=new T.Box3().setFromObject(actor.meshes[4],true);actor.sidelineHeadCenter=actor.bones.get('Head').worldToLocal(headBox.getCenter(new T.Vector3()));actor.sidelineHeadRadius=Math.max(headBox.max.x-headBox.min.x,headBox.max.z-headBox.min.z)/2;actors.push(actor);root.add(actor.holder);return actor;
 }
 function dispose(){if(disposed)return;disposed=true;for(const a of actors){a.kit?.dispose();a.mixer.stopAllAction();a.mixer.uncacheRoot(a.root);for(const skeleton of new Set(a.meshes.map(m=>m.skeleton)))skeleton.dispose();}for(const m of ownedMaterials)m.dispose();for(const g of ownedGeometry)g.dispose();root.removeFromParent();}
 try{
  // The previous yellow shirt looked like a third goalkeeper. Pick a
  // separate officials' colour without changing either club's uniform.
  const shirtColors=[...kitPlan.map(p=>new T.Color(p.color)),new T.Color('#d6b329')],refereeColor=['#38bace','#e68dbc','#b4d74b'].map(color=>({color,contrast:Math.min(...shirtColors.map(other=>{const c=new T.Color(color);return(c.r-other.r)**2+(c.g-other.g)**2+(c.b-other.b)**2}))})).sort((a,b)=>b.contrast-a.contrast)[0].color;
  await add('referee',null,'official',null,{shirtColor:refereeColor,number:0,skinColor:'#a87250'});
  for(const[i,side]of ['home','away'].entries()){
   const own=state.viewerClubId!==undefined&&state.viewerClubId===state.context[side+'ClubId'],identity=own?president:null;
   const coach=await add('coach',side,identity?.name??side+'-coach',null,{skinColor:skins[identity?.appearance?.skinTone]});
   coach.president=!!identity;coach.identityName=identity?.name??null;coach.appearanceProvisional=!!identity;
   if(identity?.appearance?.hair==='none')for(const m of coach.meshes)if(m.material.name==='Hair')m.visible=false;
   seat(side,i?18:-18);
   for(const[pIndex,p]of realBench(state,frame,side).entries()){
    const keeper=p.pos==='GOL',a=await add('reserve',side,p.id,keeper?null:kitPlan[i].config,{number:12+pIndex,shirtColor:keeper?'#d6b329':kitPlan[i].color,skinColor:['#b9815b','#805439','#d5aa80'][pIndex%3]});
    a.name=p.name;a.slot=pIndex;a.keeper=keeper;a.typeSlot=actors.filter(b=>b!==a&&b.role==='reserve'&&b.side===side&&b.keeper===keeper).length;nativePose(a,'SidelineSit',a.actions.get('SidelineSit').getClip().duration);align(a,(i?18:-18)-3.9+pIndex*1.3,BANCO_Z,0);a.lastPose=frame.time;
   }
  }
 }catch(error){dispose();throw error;}
 function update(frame,camera,height=720,athletes){
  if(disposed)return;const repeated=lastTime===frame.time,dt=lastTime===null?0:Math.max(0,frame.time-lastTime),reset=lastTime===null||frame.time<lastTime||dt>1;lastTime=frame.time;
  const available={home:realBench(state,frame,'home'),away:realBench(state,frame,'away')};
  for(const a of actors){
   const p=a.role==='referee'?frame.referee:{x:a.side==='home'?-18:18,z:a.role==='coach'?TECNICO_Z:BANCO_Z,speed:0,distance:0};
   if(a.role==='reserve'){
    const next=available[a.side].filter(p=>(p.pos==='GOL')===a.keeper)[a.typeSlot];if(next){a.id=next.id;a.name=next.name;}const detail=camera?playerDetail(camera,a.holder.position,height):'full';a.holder.visible=!!next&&(detail==='full'||detail==='intermediate');continue;
   }
   const detail=camera?playerDetail(camera,{x:p.x,y:0,z:p.z},height):'full';a.holder.visible=detail==='full'||detail==='intermediate';if(!a.holder.visible)continue;
   if(repeated&&a.poseTime===frame.time)continue;
   const desired=a.role==='referee'?p.heading:Math.atan2(frame.ball.x-p.x,frame.ball.z-p.z),heading=reset||a.lastHeading===null?desired:a.lastHeading+T.MathUtils.clamp(angle(desired-a.lastHeading),-dt*3,dt*3);a.lastHeading=heading;
   if(reset||frame.time-a.lastPose>=1/(detail==='full'?30:12)){
    const name=a.role==='coach'?'Idle':p.speed<.12?'Idle_Loop':p.speed<2.5?'Walk_Loop':'Jog_Fwd_Loop',action=a.actions.get(name),duration=action.getClip().duration,stride=gait?.[name==='Walk_Loop'?'walk':'run']?.strideLength??(name==='Walk_Loop'?1.16:2.8);
    nativePose(a,name,name==='Idle'||name==='Idle_Loop'?frame.time%duration:((p.distance/stride)%1)*duration);a.lastPose=frame.time;
   }
   const position=a.role==='referee'?avoidReferee(a,p,frame,athletes,dt,reset):p;align(a,position.x,position.z,heading);a.poseTime=frame.time;
   // 🟨🟥 CARTÃO (25/10, Diego: "juiz"): nos 2 s depois do amarelo/vermelho o árbitro levanta o braço direito com o cartão na mão
   // (evento oficial do motor; só desenho — quem pune é o motor). O cartão é um retângulo preso à mão, da cor do evento
   if(a.role==='referee'){const evs=frame.official?.events,now=frame.time;let cartao=null;if(evs)for(let i=evs.length-1;i>=0;i--){const e=evs[i],d=now-e.t;if(d>2)break;if(d>=0&&(e.tipo==='amarelo'||e.tipo==='vermelho')){cartao={tipo:e.tipo,dt:d};break}}
    if(cartao){// (o braço vai pra cima E pra fora: reto pra cima ele some atrás da cabeça grande do boneco — medido: mão a 1,37 m, cabeça até ~1,5 m)
     const k=cartao.dt<.25?cartao.dt/.25:cartao.dt>1.6?Math.max(0,1-(cartao.dt-1.6)/.4):1,dir=new T.Vector3(-Math.cos(heading)*.9,1,Math.sin(heading)*.9).normalize();apontaOsso(a,'upperarm_r','lowerarm_r',dir,k);apontaOsso(a,'lowerarm_r','hand_r',dir,k);a.holder.updateMatrixWorld(true);for(const mesh of a.meshes)mesh.skeleton.update();
     if(!a.cartao){const g=new T.PlaneGeometry(.13,.18),m=new T.MeshBasicMaterial({color:'#ffd21f',side:T.DoubleSide});ownedGeometry.add(g);ownedMaterials.add(m);a.cartao=new T.Mesh(g,m);a.cartao.name='match-civil-referee-card';root.add(a.cartao)}
     a.cartao.material.color.set(cartao.tipo==='vermelho'?'#d8261c':'#ffd21f');a.bones.get('hand_r').getWorldPosition(a.cartao.position);a.cartao.position.addScaledVector(dir,.13);a.cartao.rotation.set(0,heading,0);a.cartao.visible=k>.5;a.ultimoCartao={tipo:cartao.tipo,k:+k.toFixed(2),maoY:+a.bones.get('hand_r').getWorldPosition(new T.Vector3()).y.toFixed(2)}}
    else if(a.cartao){a.cartao.visible=false;a.ultimoCartao=null}}
   if(a.role==='referee'&&athletes){a.refereeProjection=0;separateReferee(a,p,athletes);const head=a.bones.get('Head').localToWorld(a.sidelineHeadCenter.clone());a.minAthleteHeadGap=Math.min(Infinity,...athletes.filter(b=>b.holder.visible&&b.headCenterLocal).map(b=>head.distanceTo(b.bones.get('Head').localToWorld(b.headCenterLocal.clone()))-a.sidelineHeadRadius-b.headRadius));}
  }
 }
 update(frame);
 return{update,dispose,inspect:()=>({style:'civil-cartoon',referees:1,coaches:2,cartao:actors.find(a=>a.role==='referee')?.ultimoCartao??null,reserves:actors.filter(a=>a.role==='reserve').map(a=>({id:a.id,name:a.name,side:a.side,visible:a.holder.visible})),people:actors.map(a=>({role:a.role,id:a.id,side:a.side,visible:a.holder.visible,position:a.holder.position.toArray(),footFloor:a.footFloor,minAthleteHeadGap:a.minAthleteHeadGap??null,rigBones:a.meshes[0].skeleton.bones.length,president:a.president??false,identityName:a.identityName??null,appearanceProvisional:a.appearanceProvisional??false})),sourceUnchanged:true})};
}
