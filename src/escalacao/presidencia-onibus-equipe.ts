import * as THREE from 'three'
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js'
import {TEAM_COACH as C} from './cidade3d/coach-access.mjs'

/** A dedicated high-deck touring coach. Public transport keeps its old rig.
 * Rounded profile, genuine wheel arches and a front stair portal; no brands. */
export function criarOnibusEquipe(parent:THREE.Object3D,id:string){
 const root=new THREE.Group();root.name=id;parent.add(root)
 const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>(),parts=new Map<THREE.Material,THREE.BufferGeometry[]>()
 const mat=(color:string,metalness=0,roughness=.65)=>{const m=new THREE.MeshStandardMaterial({color,metalness,roughness});materials.add(m);return m}
 const body=mat('#eeeeea',.25,.45),accent=mat('#202725',.2,.45),glass=mat('#162831',.45,.16),rubber=mat('#202220'),alloy=mat('#b9bdba',.8,.28),black=mat('#151d20'),led=mat('#fff1d2'),tail=mat('#a32726')
 led.emissive.set('#fff0cd');led.emissiveIntensity=.65;tail.emissive.set('#dd3029');tail.emissiveIntensity=.4
 const add=(g:THREE.BufferGeometry,m:THREE.Material)=>{geometries.add(g);const mesh=new THREE.Mesh(g,m);mesh.castShadow=mesh.receiveShadow=true;root.add(mesh);return mesh}
 const box=(m:THREE.Material,w:number,h:number,d:number,x:number,y:number,z:number)=>{const g=new THREE.BoxGeometry(w,h,d);g.translate(x,y,z);const a=parts.get(m)??[];a.push(g);parts.set(m,a)}
 const profile=(door=false)=>{const s=new THREE.Shape();s.moveTo(-6.4,.58);s.lineTo(-6.4,3.42);s.quadraticCurveTo(-6.4,3.72,-6.08,3.72);s.lineTo(5.10,3.72);s.quadraticCurveTo(5.85,3.72,6.08,3.15);s.lineTo(6.40,1.35);s.quadraticCurveTo(6.49,.58,6.08,.58)
  if(door){s.lineTo(5.85,.58);s.lineTo(5.85,3.18);s.lineTo(4.85,3.18);s.lineTo(4.85,.58)}
  for(const axle of [...C.axles].reverse()){s.lineTo(axle+.65,.58);for(let i=0;i<=20;i++){const a=.123+(Math.PI-.246)*i/20;s.lineTo(axle+Math.cos(a)*.65,.5+Math.sin(a)*.65)}}
  s.lineTo(-6.4,.58);return s}
 for(const side of [-1,1]){const g=new THREE.ExtrudeGeometry(profile(side===C.door.side),{depth:.075,bevelEnabled:true,bevelSize:.025,bevelThickness:.025,bevelSegments:2,steps:1});g.rotateY(-Math.PI/2);g.translate(side<0?-1.30:-1.30+2.6+.075,0,0);add(g,body)}
 box(body,2.48,.14,11.4,0,3.65,-.25);box(black,2.35,.09,12.15,0,1.07,-.1);box(black,2.18,1.5,10.6,0,2.3,-.6)
 // Private coach glazing is opaque/tinted. No unanimated passengers fabricated.
 for(const side of [-1,1]){
  const end=side===C.door.side?4.72:5.28;box(glass,.035,1.42,end+6.02,side*1.407,2.55,(end-6.02)/2)
  for(let z=-5.95;z<end;z+=1.55)box(black,.06,1.46,.045,side*1.435,2.55,z)
  box(accent,.055,.13,10.3,side*1.425,1.76,-.68)
  for(const z of [-2.2,.3,2.3]){box(accent,.045,.025,1.65,side*1.425,.73,z);box(accent,.045,.83,.018,side*1.425,1.15,z-.82);box(black,.06,.035,.18,side*1.45,1.52,z+.55)}
  box(accent,.08,.075,.80,side*1.35,3.25,5.4);box(accent,.08,.42,.075,side*1.65,3.04,5.75);box(glass,.17,.42,.24,side*1.66,2.85,5.75)
 }
 const windshield=new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute([-1.19,1.65,6.37,1.19,1.65,6.37,-1.15,3.35,5.99,1.15,3.35,5.99],3));windshield.setIndex([0,1,2,2,1,3]);windshield.computeVertexNormals();add(windshield,glass)
 box(body,2.5,.62,.12,0,1.2,6.36);box(black,1.3,.18,.14,0,.94,6.44);box(body,2.5,.18,.18,0,.65,6.32)
 for(const side of [-1,1]){box(led,.52,.10,.04,side*.87,1.22,6.44);box(led,.26,.045,.04,side*.96,1.05,6.45);box(tail,.20,.64,.04,side*1.05,1.12,-6.43)}
 box(body,2.47,2.8,.12,0,2.03,-6.37);box(glass,2.14,.78,.025,0,2.94,-6.45);box(accent,1.6,.34,.04,0,1.4,-6.46)
 for(const z of [-2,1.9]){const s=new THREE.Shape();s.moveTo(-.80,-.7);s.lineTo(.8,-.7);s.quadraticCurveTo(.95,-.7,.95,-.5);s.lineTo(.95,.5);s.quadraticCurveTo(.95,.7,.8,.7);s.lineTo(-.8,.7);s.quadraticCurveTo(-.95,.7,-.95,.5);s.lineTo(-.95,-.5);s.quadraticCurveTo(-.95,-.7,-.8,-.7);const g=new THREE.ExtrudeGeometry(s,{depth:.22,bevelEnabled:true,bevelSize:.08,bevelThickness:.08,bevelSegments:2});g.rotateX(-Math.PI/2);g.translate(0,3.76,z);add(g,body)}
 // Visible treads belong to this coach, at the authored front door.
 for(const [i,y]of [.83,.56,.29].entries())box(black,.34,.06,.98,-1.01-i*.28,y-.03,C.door.longitudinal)
 const doors:{mesh:THREE.Group;z:number;direction:number}[]=[]
 for(const direction of [-1,1]){const group=new THREE.Group(),z=C.door.longitudinal+direction*C.door.width/4;group.position.set(-1.41,0,z);root.add(group)
  const g=new THREE.BoxGeometry(.05,2.78,.49);geometries.add(g);const pane=new THREE.Mesh(g,glass);pane.position.y=1.78;pane.castShadow=true;group.add(pane)
  const frameG=new THREE.BoxGeometry(.065,.65,.49);geometries.add(frameG);const panel=new THREE.Mesh(frameG,body);panel.position.y=.73;group.add(panel);doors.push({mesh:group,z,direction})
 }
 const wheels:THREE.Mesh[]=[]
 const wheelG=new THREE.CylinderGeometry(C.wheelRadius,C.wheelRadius,.25,24);wheelG.rotateZ(Math.PI/2);geometries.add(wheelG);const hubG=new THREE.CylinderGeometry(.26,.26,.27,16);hubG.rotateZ(Math.PI/2);geometries.add(hubG)
 for(const x of [-1.2,1.2])for(const z of C.axles){const wheel=new THREE.Mesh(wheelG,rubber);wheel.position.set(x,C.wheelRadius,z);wheel.castShadow=true;const hub=new THREE.Mesh(hubG,alloy);wheel.add(hub);root.add(wheel);wheels.push(wheel)}
 for(const [m,gs]of parts){const g=mergeGeometries(gs,false);gs.forEach(g=>g.dispose());if(g)add(g,m)}
 root.userData.coach={type:'high-deck-team-coach',length:C.length,width:C.width,height:C.height,publicTransit:false}
 root.userData.complexoLights=[-1,1].map(side=>({id:id+'-farol-'+side,kind:'headlight',direction:1,enabled:true,position:[side*.87,1.23,6.46],target:[side*.87,0,24],color:'#fff0d5',intensity:75,distance:28,angle:.3}))
 return{root,doors,wheels,setColor(color:string){body.color.set(color)},setSecondaryColor(color:string){accent.color.set(color)},update(distance:number,opening=0){for(const w of wheels)w.rotation.x=distance/C.wheelRadius;for(const d of doors){d.mesh.position.z=d.z+d.direction*C.door.width/2*opening;d.mesh.position.x=-1.41-opening*.14}},dispose(){root.removeFromParent();geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose())}}
}
