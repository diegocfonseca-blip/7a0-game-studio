import {lots,allLots,roads,roadBox,walks,vehiclePaths,portals,audit,samplePath,inside,overlap} from './layout.mjs';
import {criarFigurantes} from '../../src/escalacao/presidencia-figurantes.ts';
import {criarVeiculoTransporte} from '../../src/escalacao/presidencia-veiculo-transporte.ts';
export function installCirculation(ctx:any){
 const {T,scene,after,additions,cube,plane,cylinder,tree,planter,bench,material,renderer,camera}=ctx,W=window as any;
 const auditResult=audit();if(auditResult.conflicts.length||auditResult.roadConflicts.length||auditResult.pedestrianConflicts.length||auditResult.vehicleConflicts.length||auditResult.disconnectedRoads.length)throw Error('A planta contém conflitos: '+JSON.stringify(auditResult));
 const stone=material('stone'),roadmat=material('asphalt'),steel=new T.MeshLambertMaterial({color:'#334d40'}),cream=new T.MeshLambertMaterial({color:'#e8ddc3'}),glass=new T.MeshLambertMaterial({color:'#9dbeb5',transparent:true,opacity:.53,depthWrite:false});
 function path(points:any[],width:number,m=stone,y=.115){for(let i=1;i<points.length;i++){const A=points[i-1],B=points[i],a=A.length===3?[A[0],A[2]]:A,b=B.length===3?[B[0],B[2]]:B;if((A.length===3&&A[1]>.25)||(B.length===3&&B[1]>.25))continue;const dx=b[0]-a[0],dz=b[1]-a[1],L=Math.hypot(dx,dz);if(L<.03)continue;const mesh=plane(width,L,(a[0]+b[0])/2,y,(a[1]+b[1])/2,m);mesh.rotation.z=Math.atan2(dx,dz)}}
 function sign(text:string,x:number,y:number,z:number,width:number,height:number,bg='#254939',fg='#f4ecd6',yaw=0){const c=document.createElement('canvas');c.width=1024;c.height=Math.round(1024*height/width);const g=c.getContext('2d')!;g.fillStyle=bg;g.fillRect(0,0,c.width,c.height);g.fillStyle=fg;g.textAlign='center';g.textBaseline='middle';g.font=`700 ${c.height*.66}px Oswald`;g.fillText(text,c.width/2,c.height*.53,c.width-35);const tx=new T.CanvasTexture(c);tx.colorSpace=T.SRGBColorSpace;const o=new T.Mesh(new T.PlaneGeometry(width,height),new T.MeshLambertMaterial({map:tx,side:T.DoubleSide}));o.position.set(x,y,z);o.rotation.y=yaw;additions.add(o);return o}
 // Connected junction surfaces. Dashes stop before each crossing instead of running through it.
 const junctions:any[]=[];
 for(let i=0;i<roads.length;i++)for(let j=i+1;j<roads.length;j++){const a=roads[i],b=roads[j];if((a.a[0]===a.b[0])===(b.a[0]===b.b[0]))continue;const x=a.a[0]===a.b[0]?a.a[0]:b.a[0],z=a.a[1]===a.b[1]?a.a[1]:b.a[1];if(x>=Math.min(a.a[0],a.b[0])&&x<=Math.max(a.a[0],a.b[0])&&z>=Math.min(a.a[1],a.b[1])&&z<=Math.max(a.a[1],a.b[1])&&x>=Math.min(b.a[0],b.b[0])&&x<=Math.max(b.a[0],b.b[0])&&z>=Math.min(b.a[1],b.b[1])&&z<=Math.max(b.a[1],b.b[1])){junctions.push({x,z,minX:x-8,maxX:x+8,minZ:z-8,maxZ:z+8});cube(20,.09,20,x,.015,z,stone);cube(16,.035,16,x,.09,z,roadmat)}}
 // Continuous public sidewalks and last-metre connections to each registered entrance.
 // Keep narrow access paths out of the carriageway except the two explicit crossings.
 for(const r of walks)path(r.points,1.8);
 path([[-136,-92],[-136,133],[-34.55,133]],2.5);path([[99,-92],[99,133],[-34.55,133]],2.5);
 // Repair vehicle access to the original parking's internal central aisle.
 path(vehiclePaths.parking,5.5,roadmat,.13);path([[113.5,30.5],[224.5,30.5]],2.2);path([[113.5,41.5],[224.5,41.5]],2.2);
 // Close the southern pedestrian loop at the street junctions.
 path([[-225.5,193],[-164,193],[-164,229.5]],1.8);
 // The map is finite; road and rail continue onto short exit arms. Actors fade beyond the last visible boundary.
 for(const s of [-1,1]){cube(52,8,21,s*264,-4.3,-134,'#645a42');cube(52,.25,21,s*264,-.3,-134,material('grass'));cube(53,.1,15,s*264,-.06,-134,stone);cube(53,.04,10,s*264,.045,-134,roadmat);for(const z of [-142, -126])cube(52,.7,.16,s*264,.4,z,steel);const gateX=s*253;for(const z of [-141,-127])cube(.45,7,.45,gateX,3.5,z,steel);cube(.5,1.1,14.5,gateX,7,-134,steel);sign(s<0?'ENTRADA / SAÍDA DA CIDADE':'OUTROS BAIRROS',gateX-.3,7,-134,12,1.0,'#254939','#f4ecd6',Math.PI/2)}
 // Actual platform, two elevated exits and supported stairs (36 treads per side).
 const metro={center:[-24,-113],floor:6,trackY:5.52,length:160,accesses:[] as any[]};
 for(const side of [-1,1]){cube(160,.5,4.4,-24,5.75,-113+side*4.3,cream);cube(160,.06,.3,-24,6.035,-113+side*2.2,'#d5b651');cube(162,.18,5.6,-24,9,-113+side*4.3,steel);for(let x=-100;x<=52;x+=19)cube(.18,3,.18,x,7.5,-113+side*6,steel)}
 for(const z of [-113.95,-112.05])cube(580,.12,.12,0,5.52,z,'#747e77');for(let x=-286;x<=286;x+=4.2)cube(.25,.12,3.7,x,5.35,-113,'#756b52');
 for(let x=-262;x<=262;x+=38){cube(.65,5.15,.65,x,2.575,-113,cream);cube(4,.3,.8,x,5.05,-113,cream)}
 for(const [topX,platformX] of [[-133,-84],[85,38]]){
  const span=Math.abs(topX-platformX),cx=(topX+platformX)/2;cube(span+2,.28,3,cx,5.84,-107,cream);cube(span+2,.13,3.4,cx,8.6,-107,steel);
  for(const z of [-108.4,-105.6]){cube(span,.08,.08,cx,7.03,z,steel);for(let x=Math.min(topX,platformX);x<=Math.max(topX,platformX);x+=5)cube(.07,1.1,.07,x,6.53,z,steel)}
  cube(3,.3,6,topX,5.83,-105,cream);for(let n=0;n<36;n++){const h=6-(n+1)*(5.84/36),z=-103+(n+.5)/3;cube(2.8,h,.335,topX,h/2,z,cream)}
  // Sloped rail follows the stair exactly and continues across its top landing.
  for(const dx of [-1.5,1.5]){const a=new T.Vector3(topX+dx,7,-103),b=new T.Vector3(topX+dx,1.16,-91),delta=b.clone().sub(a);const rail=new T.Mesh(new T.CylinderGeometry(.045,.045,delta.length(),6),steel);rail.position.copy(a).add(b).multiplyScalar(.5);rail.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());additions.add(rail);for(let n=0;n<=6;n++){const t=n/6;cube(.08,1,.08,topX+dx,6-5.84*t+.5,-103+12*t,steel)}}
  metro.accesses.push({top:[topX,6,-103],foot:[topX,.16,-91],steps:36,rise:5.84/36,tread:1/3});
 }
 sign('METRÔ · ESTÁDIO',-24,8.6,-106.7,21,1.2);sign('ACESSO OESTE',-133,2.8,-90.7,8,.85);sign('ACESSO LESTE',85,2.8,-90.7,8,.85);
 // Real curbside bays, separate from the through lane. Shelters open onto the pedestrian platform.
 const bays=[{id:'estadio',x:-73,z:137.8,x0:-100,x1:-45,platformZ:134.4,dir:-1},{id:'bairro',x:174,z:152.4,x0:140,x1:205,platformZ:156.2,dir:1}];
 const bayBoxes:any[]=[];
 for(const b of bays){const points=b.dir<0?[[b.x0-10,142.5],[b.x0,137.8],[b.x1,137.8],[b.x1+10,142.5]]:[[b.x0-10,147.5],[b.x0,152.4],[b.x1,152.4],[b.x1+10,147.5]];path(points,3.2,roadmat,.13);bayBoxes.push({minX:b.x0-10,maxX:b.x1+10,minZ:Math.min(b.z,b.dir<0?142.5:147.5)-1.6,maxZ:Math.max(b.z,b.dir<0?142.5:147.5)+1.6});cube(10,.13,3.0,b.x,.13,b.platformZ,stone);cube(6,.18,2.0,b.x,3.25,b.platformZ,steel);for(const dx of [-2.8,2.8])cube(.12,3,.12,b.x+dx,1.6,b.platformZ-.65*b.dir,steel);cube(5.4,2.1,.04,b.x,1.7,b.platformZ-.8*b.dir,glass);cube(4.5,.12,.6,b.x,.65,b.platformZ-.35*b.dir,material('wood'));sign(b.id==='estadio'?'ÔNIBUS · ESTÁDIO':'ÔNIBUS · BAIRRO',b.x,2.9,b.platformZ+1.01,5.8,.55);cube(.12,3.1,.12,b.x+5,1.55,b.platformZ,steel);sign('BUS',b.x+5,3.0,b.platformZ+.08,1,.7,'#254939');}
 // Sidewalk goes behind the southern bay, with a marked crossing toward the arena.
 path([[133,151.5],[133,158],[216,158],[224.5,158]],2.1);path([[216,158],[216,133],[174,133]],2.0);
 for(const cross of [[-147,79],[216,145]]){const vertical=cross[0]===-147;for(let j=-3;j<=3;j++)cube(vertical?6.8:.9,.025,vertical?.85:8.0,cross[0]+(vertical?0:j*1.45),.20,cross[1]+(vertical?j*1.45:0),'#e7e2cb')}
 // Shopping: restrained colour, skylights, clear entry and a shaded public forecourt.
 const shopping=after.getObjectByName('mockup-Shopping e Vadico');
 if(shopping){const removeSigns:any[]=[];shopping.updateWorldMatrix(true,true);shopping.traverse((o:any)=>{if(!o.isMesh)return;const ms=Array.isArray(o.material)?o.material:[o.material];if(ms.some((m:any)=>m.name==='shopping-letreiro')){const box=new T.Box3().setFromObject(o),p=box.getCenter(new T.Vector3());if(p.x>70&&p.x<110&&p.y>18&&p.z>-170&&p.z<-165)removeSigns.push(o)}});removeSigns.forEach(o=>o.removeFromParent());shopping.traverse((o:any)=>{if(!o.isMesh)return;const arr=Array.isArray(o.material)?o.material:[o.material];o.material=arr.map((m:any)=>{const n=m.clone();if(n.name==='shopping-preto')n.color.set('#293c33');if(n.name==='shopping-ouro'){n.color.set('#bbab74');n.metalness=.08;n.roughness=.8;n.emissive?.set('#000000');n.emissiveIntensity=0}if(n.name==='shopping-vidro'){n.color.set('#9dbbb5');n.opacity=.7;n.metalness=.05;n.roughness=.4}if(n.name==='shopping-fachada')n.color.set('#e4dbc3');return n});if(o.material.length===1)o.material=o.material[0]});}
 const map=(x:number,z:number)=>[107+(x-158.5)*.84,-180+(z+236.5)*.84];
 const [ex,ez]=map(141,-222);cube(34,.25,5.8,ex,4,ez+2.6,steel);for(const x of [ex-15,ex+15])cube(.24,3.8,.24,x,2,ez+3.8,cream);for(let x=ex-15;x<=ex+15;x+=2.2)cube(.8,.18,5.6,x,4.2,ez+2.6,material('wood'));
 for(const x of [48,134]){cube(28,.16,4,x,3.1,-166.1,cream);for(let xx=x-13;xx<=x+13;xx+=3)cube(.14,2.9,.14,xx,1.6,-164.4,steel);planter(x,-159.4,13,1.5);bench(x-6,-156.5)}
 for(const [x,z] of [[29,-154],[66,-154],[125,-154],[155,-154]])tree(x,z,4.2);
 path([[83,-145.14],[83,-151],[78,-151],[78,-161],[ex,-161],[ex,ez+3.9]],2.6);
 sign('SHOPPING DO CLUBE',ex,22.5,ez+.75,30,2.2);sign('ENTRADA',ex,4.9,ez+5.8,10,.85);
 // Show two independent public connections: mall atrium and Vadico showroom.
 path([[173,-151],[173,-141.5]],2.4);sign('VADICO',174,10,-168,18,1.25,'#f4ecd6','#183e30');
 // Audit public paths at their declared widths; include junction and bay vehicle surfaces.
 const covered=(p:any)=>roads.some(r=>inside(p,roadBox(r,false),.06))||junctions.some(j=>inside(p,j,.08))||bayBoxes.some(j=>inside(p,j,.08));
 const offRoad:any[]=[];for(const [id,pathPoints]of Object.entries(vehiclePaths)){if(id==='parking')continue;for(const p of samplePath(pathPoints as any,.25))if(!covered(p)){offRoad.push({route:id,point:p});break}}
 const amenityCollisions:any[]=[];for(const b of bays){const bb={minX:b.x-5,maxX:b.x+5,minZ:b.platformZ-1.5,maxZ:b.platformZ+1.5};for(const l of allLots)if(overlap(bb,l))amenityCollisions.push({busStop:b.id,lot:l.name})}
 const realBounds:any[]=[];after.updateMatrixWorld(true);for(const obj of new Set([...after.children,W.clubParent,W.lucaParent])){if(!obj.name.startsWith('mockup-')&&obj!==W.clubParent&&obj!==W.lucaParent)continue;if(obj.name==='mockup-Árvore')continue;const box=new T.Box3();obj.traverse((o:any)=>{if(!o.isMesh)return;let p=o;while(p&&p!==after){if(!p.visible)return;p=p.parent}if(!o.geometry.boundingBox)o.geometry.computeBoundingBox();box.union(o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld))});if(!box.isEmpty())realBounds.push({name:obj===W.clubParent?'Clube Recreio':obj===W.lucaParent?'Casa Luca':obj.name.replace('mockup-',''),minX:box.min.x,maxX:box.max.x,minZ:box.min.z,maxZ:box.max.z})}W.realGeometryBounds=realBounds;
 Object.assign(auditResult,{junctions:junctions.length,busStops:bays.length,metroAccesses:metro.accesses.length,metroSteps:metro.accesses.map((a:any)=>a.steps),vehicleOffRoad:offRoad,busPlatformConflicts:amenityCollisions,portals});
 if(offRoad.length||amenityCollisions.length)throw Error('Falha nas vias do transporte: '+JSON.stringify({offRoad,amenityCollisions}));
 // Vehicles/NPCs stay outside the static batching root and follow shared metric paths.
 const dynamic=new T.Group();dynamic.name='circulacao-animada-previa';scene.add(dynamic);
 const spec=(id:string,kind:string,length:number,width:number,floorHeight:number)=>({id,kind,length,width,floorHeight,wheelRadius:kind==='car'?.29:.42,door:{side:1,longitudinal:2,width:1.2},stop:{position:{x:0,y:.1,z:0},heading:0}} as any);
 const bus=criarVeiculoTransporte(dynamic,spec('onibus-estadio','bus',10.6,2.5,.52),'#c5aa63');
 const bus2=criarVeiculoTransporte(dynamic,spec('onibus-bairro','bus',10.6,2.5,.52),'#54745c');
 const train=criarVeiculoTransporte(dynamic,spec('metro','metro',114.9,2.65,.48),'#366a55');
 const car=criarVeiculoTransporte(dynamic,spec('carro-chegada','car',4.4,1.85,.34),'#b7b4a3');
 const people=criarFigurantes(dynamic,16,'pedestres-circulacao');
 const xzy=(p:any)=>p.length===3?{x:p[0],y:p[1],z:p[2]}:{x:p[0],y:.19,z:p[1]};
 function follow(pathPoints:any[],distance:number){const points=pathPoints.map(xzy);let total=0;const legs=[];for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],len=Math.hypot(b.x-a.x,b.y-a.y,b.z-a.z);legs.push({a,b,len});total+=len}let d=((distance%total)+total)%total;for(const l of legs){if(d<=l.len){const u=d/l.len;return{x:l.a.x+(l.b.x-l.a.x)*u,y:l.a.y+(l.b.y-l.a.y)*u,z:l.a.z+(l.b.z-l.a.z)*u,heading:Math.atan2(l.b.x-l.a.x,l.b.z-l.a.z),total}}d-=l.len}return {...points[0],heading:0,total}}
 function actor(body:any,points:any[],distance:number,y=0,opening=0){const p=follow(points,distance);body.root.position.set(p.x,p.y+y,p.z);body.root.rotation.y=p.heading;const fade=Math.max(0,Math.min(1,(288-Math.abs(p.x))/23));body.root.visible=fade>.01;body.root.traverse((o:any)=>{if(o.isMesh){const mats=Array.isArray(o.material)?o.material:[o.material];for(const m of mats){if(m.userData.initialOpacity===undefined)m.userData.initialOpacity=m.opacity;m.transparent=fade<1||m.userData.initialOpacity<1;m.opacity=m.userData.initialOpacity*fade}}});body.update(distance,opening);return p}
 const metroRoute=[[-288,5.52,-113],[-24,5.52,-113],[288,5.52,-113]];
 function update(t:number){const stopped=t>=16&&t<=24,hold=(stop:number,speed:number,arrive:number,depart:number)=>t<arrive?stop-(arrive-t)*speed:t<=depart?stop:stop+(t-depart)*speed;actor(bus,vehiclePaths.bus,hold(1086.1818,4.7,16,24),0,stopped?1:0);actor(bus2,vehiclePaths.busEast,hold(732.8082,4.2,16,24),0,stopped?1:0);actor(car,vehiclePaths.north,t*8.5+210);actor(train,metroRoute,hold(264,5.8,18,28),0,t>=18&&t<=28?1:0);const list=[];const routes=[walks.find(r=>r.id==='metro-oeste')!,walks.find(r=>r.id==='metro-leste')!,walks.find(r=>r.id==='onibus-estadio')!,walks.find(r=>r.id==='onibus-arena')!];for(let i=0;i<12;i++){const route=routes[i%4],p=follow(route.points,t*.9+i*8);list.push({...p,camisa:['#c2452f','#1b7a3d','#e9dfc4','#375e85'][i%4]})}list.push({x:-70.8,y:.20,z:134.5,heading:Math.PI,camisa:'#7c3aed'},{x:176,y:.20,z:156.3,heading:0,camisa:'#e9dfc4'});people.set(list);people.tempo(t);W.previewActors={time:t,people:list.map(({x,y,z}:any)=>({x,y,z})),bus:bus.root.position.toArray(),bus2:bus2.root.position.toArray(),train:train.root.position.toArray()};}
 let active=false,raf=0,t0=0;function animate(now:number){if(!active)return;update((now-t0)/1000+18);renderer.render(scene,camera);raf=requestAnimationFrame(animate)}
 function play(){active=!active;if(active){t0=performance.now();raf=requestAnimationFrame(animate)}else cancelAnimationFrame(raf);return active}
 const button=document.getElementById('simulate');if(button)button.onclick=()=>{const on=play();button.textContent=on?'PAUSAR CHEGADAS':'SIMULAR CHEGADAS'};
 W.planAudit=auditResult;W.setPreviewTime=(t:number)=>{update(t);renderer.render(scene,camera)};
 return {audit:auditResult,update,dynamic,play,metro,portals,stop:()=>{active=false;cancelAnimationFrame(raf)}};
}
