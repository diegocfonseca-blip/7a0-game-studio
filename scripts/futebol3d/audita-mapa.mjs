// Bancada LOCAL: usa a entrada salva e a mesma criarPartidaComplexo do mapa.
// Sem login, banco, gravação de resultado ou motor alternativo.
import * as T from 'three';
import {criarPartidaComplexo} from '../../src/escalacao/presidencia-complexo-partida.ts';
import {quadroFutebol3D} from '../../src/escalacao/presidencia-futebol-motor.ts';
import {enquadramentoFutebol} from '../../src/escalacao/presidencia-enquadramento-futebol.ts';
try {
 localStorage.setItem('esc3d-contact-audit',new URLSearchParams(location.search).get('audit')==='0'?'0':'1');
 const fixture=await fetch('../../test-results/animation-library/neymarzetti-current/football-input.json').then(r=>r.json());
 const {input,sourceMatch}=fixture,roster=cs=>cs.map((p,i)=>({id:String(i),name:p.name,pos:p.pos,fake:p.fake}));
 const state={viewerClubId:sourceMatch.awayClubId,officialInput:input,officialTeams:[sourceMatch.home,sourceMatch.away],context:{id:'auditoria-mapa-'+Date.now(),homeClubId:sourceMatch.homeClubId,awayClubId:sourceMatch.awayClubId,home:roster(input.casa),away:roster(input.fora),stadium:{inv:{grama:100,geral:100,cadeiras:100},ext:[]}},minute:0,homeScore:0,awayScore:0,paused:true,finished:false,homeColor:'#c2452f',awayColor:'#f0efef'};
 const scene=new T.Scene();scene.background=new T.Color('#cbd2cd');
 const game=criarPartidaComplexo(scene,state.context.stadium,state);
 const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(960,540);renderer.outputColorSpace=T.SRGBColorSpace;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
 document.body.append(renderer.domElement);scene.add(new T.HemisphereLight('#fff9ee','#586d4b',2.2));const sun=new T.DirectionalLight('#fff4dc',3);sun.position.set(-30,70,40);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-65,right:65,top:45,bottom:-45,near:.1,far:160});sun.shadow.bias=-.00005;sun.shadow.normalBias=.015;scene.add(sun,sun.target);
 const camera=new T.PerspectiveCamera(38,960/540,.1,1000);let frame,raw,mode='broadcast';
 function seek(t,draw=false){const current={...state,minute:t*93/90};game.update(current,t*1000);raw=quadroFutebol3D(current,t*1000);frame=game.inspect();scene.updateMatrixWorld(true);if(draw)render();return inspect()}
 function inspect(){const ball=frame?.ball??game.inspect().ball,P=ball.presentation??ball,actors=[];
  scene.getObjectByName('complexo-partida')?.traverse(o=>{if(!o.name.startsWith('jogador:'))return;const bones={};o.traverse(b=>{if(b.isBone&&/ToeBase|Foot|Hips|Head|Hand$/.test(b.name))bones[b.name]=b.getWorldPosition(new T.Vector3()).toArray()});actors.push({key:o.name.slice(8),position:o.position.toArray(),heading:o.rotation.y,visible:o.visible,bones})});
  return{...game.inspect(),visibleBall:P,authority:raw,actors,source:sourceMatch,render:{calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,memory:renderer.info.memory}};
 }
 function render(){const f=game.inspect(),b=f.ball.presentation??f.ball,actors=game.subjects();if(mode==='close'||mode==='feet'||mode==='analysis'){const cx=mode==='analysis'&&b.x<-43?b.x+4:b.x-3;camera.position.set(cx,mode==='feet'?.65:2.5,b.z+4.6);camera.lookAt(b.x,mode==='feet'?.25:.8,b.z)}else{const fit=enquadramentoFutebol(camera,b,actors,mode==='tactical'?'tactical':'broadcast');camera.fov=fit.fov;camera.position.copy(fit.position);camera.lookAt(fit.target)}camera.updateProjectionMatrix();renderer.render(scene,camera);document.getElementById('status').textContent=`${sourceMatch.home} ${f.official?.score.join(' × ')} ${sourceMatch.away} · ${((f.time??0)*93/90).toFixed(1)}′ · CAMPO DO MAPA — TESTE LOCAL`}
 const footIndices=new WeakMap();
 function measureBoot(key){
  const actor=scene.getObjectByName('jogador:'+key);if(!actor)return null;let mesh;actor.traverse(o=>{if(o.isSkinnedMesh)mesh=o});if(!mesh)return null;
  actor.updateMatrixWorld(true);mesh.skeleton.update();const g=mesh.geometry,idx=g.index,weights=g.attributes.skinWeight,joints=g.attributes.skinIndex;
  let indices=footIndices.get(g);if(!indices){const feet=new Set(mesh.skeleton.bones.map((b,i)=>/Foot|Toe/.test(b.name)?i:-1)),eligible=i=>{let w=0;for(let k=0;k<4;k++)if(feet.has(joints.getComponent(i,k)))w+=weights.getComponent(i,k);return w>.6};indices=[];for(let i=0;i<idx.count;i+=3){const a=idx.getX(i),b=idx.getX(i+1),c=idx.getX(i+2);if(eligible(a)&&eligible(b)&&eligible(c))indices.push([a,b,c])}footIndices.set(g,indices)}
  const B=frame.ball.presentation??frame.ball,ball=new T.Vector3(B.x,B.y,B.z),cache=new Map(),triangle=new T.Triangle(),point=new T.Vector3();let gap=Infinity,floor=Infinity;
  const vertex=i=>{let v=cache.get(i);if(!v){v=mesh.getVertexPosition(i,new T.Vector3()).applyMatrix4(mesh.matrixWorld);cache.set(i,v);floor=Math.min(floor,v.y)}return v};
  for(const ids of indices){triangle.set(...ids.map(vertex));triangle.closestPointToPoint(ball,point);gap=Math.min(gap,ball.distanceTo(point)-.11)}
  return{gap,floor,triangles:indices.length};
 }
 window.mapAudit={historicalProof:()=>import('../../src/escalacao/presidencia-replay-oficial.ts').then(m=>m.prepararReplayOficial(input,sourceMatch.goals)).then(p=>({valid:p.valid,expected:sourceMatch.score,actual:p.relato.frames.at(-1).score})),timeline:()=>import('../../src/escalacao/futebol3d/motion/map-football-timeline.mjs').then(m=>m.prepareMapTimeline(state)).then(t=>({agenda:t.agenda,duration:t.duration,bytes:t.bytes})),measureBoot,ready:()=>{game.update(state,0);return !!game.inspect().detail},seek,inspect,render,camera:m=>{mode=m},capture:(t,m='close')=>{mode=m;seek(t,true);return renderer.domElement.toDataURL('image/jpeg',.9).split(',')[1]},size:(w,h)=>{renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix()},dispose:()=>{game.dispose();renderer.dispose()}};
} catch(e){window.mapAuditError=e.stack;document.getElementById('status').textContent=e.stack}
