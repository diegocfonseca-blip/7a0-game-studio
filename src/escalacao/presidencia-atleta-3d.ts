import * as THREE from 'three'
import type {JogadorFutebol} from './presidencia-futebol-motor'
import {geometriaHumana,materialHumano} from './presidencia-humano-acabamento'

const groundCorner=new THREE.Vector3()
type HumanPart=Parameters<typeof geometriaHumana>[0]
function piece(parent:THREE.Object3D,shape:HumanPart,size:[number,number,number],position:[number,number,number],mat:THREE.Material,name:string){
 const mesh=new THREE.Mesh(geometriaHumana(shape),mat)
 mesh.scale.set(...size);mesh.position.set(...position);mesh.name=name
 mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh
}
function finish(parent:THREE.Object3D,geometry:THREE.BufferGeometry,position:[number,number,number],mat:THREE.Material,name:string){
 const colors=new Float32Array(geometry.attributes.position.count*3);colors.fill(1)
 geometry.setAttribute('color',new THREE.BufferAttribute(colors,3))
 const mesh=new THREE.Mesh(geometry,mat);mesh.position.set(...position);mesh.name=name
 mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh
}
/** The palm faces local +Z when gripping. Find its real sphere clearance
 * once, from the rendered glove/hand and thumb triangles, not a proxy box. */
function palmDistance(wrist:THREE.Group){
 const triangles:THREE.Triangle[]=[],point=new THREE.Vector3(),closest=new THREE.Vector3()
 for(const child of wrist.children){if(!(child instanceof THREE.Mesh))continue
  child.updateMatrix();const p=child.geometry.attributes.position,index=child.geometry.index
  for(let i=0;i<(index?.count??p.count);i+=3){
   const vertices=[0,1,2].map(k=>new THREE.Vector3().fromBufferAttribute(p,index?index.getX(i+k):i+k).applyMatrix4(child.matrix))
   const triangle=new THREE.Triangle(vertices[0],vertices[1],vertices[2]);if(triangle.getArea()>1e-12)triangles.push(triangle)
  }
 }
 let low=.11,high=.3
 for(let i=0;i<25;i++){
  const middle=(low+high)/2;point.set(0,0,middle);let distance=Infinity
  for(const triangle of triangles){triangle.closestPointToPoint(point,closest);distance=Math.min(distance,closest.distanceTo(point))}
  if(distance<.11)low=middle;else high=middle
 }
 return high
}
/** Articulated, faceless figures. Feet and ball are measured from the same ground plane. */
export function person(color:string,skinColor:string,keeper=false){
 const group=new THREE.Group(),skin=materialHumano(skinColor,'skin'),kit=materialHumano(color,'fabric'),shorts=materialHumano('#20262a','fabric'),boots=materialHumano('#3a403d','shoe')
 const sole=materialHumano('#111613','sole'),trim=materialHumano('#d7ddce','fabric'),hair=materialHumano('#28221d','hair')
 group.userData.faceless=true
 const torso=piece(group,'torso',[.45,.43,.306],[0,1.19,0],kit,'atleta-camisa')
 torso.userData.bodyCollider='torso'
 const pelvis=piece(group,'pelvis',[.38,.26,.25],[0,.88,0],shorts,'atleta-short-cintura')
 pelvis.userData.bodyCollider='pelvis-shorts'
 piece(group,'forearm',[.128,.135,.13],[0,1.445,0],skin,'atleta-pescoco')
 piece(group,'head',[.29,.3364,.29],[0,1.64,0],skin,'atleta-cabeca-sem-rosto')
 piece(group,'hair',[.29,.3364,.29],[0,1.64,0],hair,'atleta-cabelo')
 const collar=finish(group,new THREE.TorusGeometry(.068,.009,6,20),[0,1.405,0],shorts,'atleta-gola')
 collar.rotation.x=Math.PI/2;collar.scale.z=.8
 const legs=[-1,1].map(side=>{
  const hip=new THREE.Group();hip.position.set(side*.12,.77,0);group.add(hip)
  const shortLeg=piece(hip,'thigh',[.19,.25,.18],[0,-.015,0],shorts,'atleta-short-perna')
  shortLeg.userData.bodyCollider='leg-shorts'
  piece(hip,'thigh',[.145,.31,.14],[0,-.19,0],skin,'atleta-coxa')
  const knee=new THREE.Group();knee.position.y=-.34;hip.add(knee)
  piece(knee,'upperArm',[.112,.17,.11],[0,-.015,0],skin,'atleta-joelho')
  piece(knee,'shin',[.12,.31,.12],[0,-.205,0],kit,'atleta-meiao')
  const sockBand=finish(knee,new THREE.TorusGeometry(.052,.003,4,16),[0,-.075,0],trim,'atleta-punho-meiao')
  sockBand.rotation.x=Math.PI/2
  const ankle=new THREE.Group();ankle.position.y=-.38;knee.add(ankle)
  // Bake this scale into the vertices: contact helpers deliberately measure
  // metres in boot-local coordinates, not a scaled decorative shoe space.
  const bootGeometry=geometriaHumana('shoe');bootGeometry.scale(.15,.10,.28)
  bootGeometry.userData.humanoShape+=':athlete:.15,.10,.28'
  const boot=new THREE.Mesh(bootGeometry,boots);boot.position.set(0,0,.065);boot.name='atleta-chuteira'
  boot.castShadow=true;boot.receiveShadow=true;ankle.add(boot)
  const outsole=piece(boot,'shoe',[.15,.018,.28],[0,-.041,0],sole,'atleta-solado')
  outsole.castShadow=false
  for(const z of [-.017,.003,.023]){
   const lace=finish(boot,new THREE.CylinderGeometry(.002,.002,.05,5),[0,.052,z],trim,'atleta-cadarco')
   lace.rotation.z=Math.PI/2
  }
  return {hip,knee,ankle,boot}
 })
 const elbows:THREE.Group[]=[],hands:THREE.Mesh[]=[],wrists:THREE.Group[]=[],forearms:THREE.Mesh[]=[],sleeves:THREE.Mesh[]=[]
 const handMaterial=keeper?materialHumano('#d8ddd3','shoe'):skin
 const arms=[-1,1].map(side=>{
  const arm=new THREE.Group();arm.position.set(side*.265,1.38,0);group.add(arm)
  sleeves.push(piece(arm,'upperArm',[.158,.22,.17],[0,-.09,0],kit,'atleta-manga'))
  piece(arm,'upperArm',[.105,.22,.105],[0,-.185,0],skin,'atleta-braco')
  const cuff=finish(arm,new THREE.TorusGeometry(.064,.003,4,16),[0,-.17,0],trim,'atleta-punho-manga')
  cuff.rotation.x=Math.PI/2
  const elbow=new THREE.Group();elbow.position.y=-.25;arm.add(elbow);elbows.push(elbow)
  const forearm=piece(elbow,'forearm',[.10,.26,.095],[0,-.115,0],skin,'atleta-antebraco')
  // A wrist is narrower than the forearm belly. Preserve the elbow end and
  // taper the distal flesh so it joins the palm without entering a held ball.
  const vertices=forearm.geometry.attributes.position,uv=forearm.geometry.attributes.uv
  for(let vertex=0;vertex<vertices.count;vertex++){
   const y=vertices.getY(vertex),width=1-.42*Math.max(0,(-y-.12)/.38)
   vertices.setXYZ(vertex,vertices.getX(vertex)*width,y,vertices.getZ(vertex)*width)
  }
  forearm.geometry.computeVertexNormals();const normals=forearm.geometry.attributes.normal,seam=new THREE.Vector3()
  for(let a=0;a<vertices.count;a++)if(uv.getX(a)===0)for(let b=0;b<vertices.count;b++)if(uv.getX(b)===1&&Math.abs(vertices.getY(a)-vertices.getY(b))<1e-8){
   seam.set(normals.getX(a)+normals.getX(b),normals.getY(a)+normals.getY(b),normals.getZ(a)+normals.getZ(b)).normalize()
   normals.setXYZ(a,seam.x,seam.y,seam.z);normals.setXYZ(b,seam.x,seam.y,seam.z)
  }
  forearm.geometry.computeBoundingBox();forearm.geometry.computeBoundingSphere();forearm.geometry.userData.humanoShape+=':wrist-taper'
  forearms.push(forearm)
  const wrist=new THREE.Group();wrist.position.y=-.23;wrist.name='atleta-punho';elbow.add(wrist);wrists.push(wrist)
  hands.push(piece(wrist,'forearm',keeper?[.125,.175,.08]:[.085,.145,.055],[0,0,0],handMaterial,keeper?'atleta-luva':'atleta-mao'))
  piece(wrist,'upperArm',keeper?[.035,.065,.04]:[.026,.055,.028],[-side*(keeper?.052:.039),.011,.012],handMaterial,'atleta-polegar')
  return arm
 })
 const upper=new THREE.Group();upper.position.y=.84
 // One torso pivot lets the thrower crouch and collect the ball naturally.
 for(const child of [...group.children])if(child!==pelvis&&!legs.some(leg=>leg.hip===child)){group.remove(child);child.position.y-=.84;upper.add(child)}
 group.add(upper)
 const grip={radius:Math.max(...wrists.map(palmDistance)),active:false,anchor:new THREE.Vector3(),maximumArmExtension:0}
 return {group,upper,legs,arms,elbows,hands,wrists,forearms,sleeves,grip,kit}
}
const clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n))
const gripLeft=new THREE.Vector3(),gripRight=new THREE.Vector3(),gripAxis=new THREE.Vector3(),gripShoulder=new THREE.Vector3(),gripTarget=new THREE.Vector3(),gripElbow=new THREE.Vector3(),gripAim=new THREE.Vector3(),gripBend=new THREE.Vector3(),gripBase=new THREE.Vector3(),gripLocal=new THREE.Vector3(),gripCurrent=new THREE.Vector3(),gripX=new THREE.Vector3(),gripY=new THREE.Vector3(),gripZ=new THREE.Vector3()
const gripInverse=new THREE.Matrix4(),gripFrame=new THREE.Matrix4(),gripDelta=new THREE.Quaternion(),gripRotation=new THREE.Quaternion(),gripParentRotation=new THREE.Quaternion(),DOWN=new THREE.Vector3(0,-1,0)
function meshFloor(mesh:THREE.Mesh){
 if(!mesh.geometry.boundingBox)mesh.geometry.computeBoundingBox()
 const b=mesh.geometry.boundingBox!;let low=Infinity
 for(const x of [b.min.x,b.max.x])for(const y of [b.min.y,b.max.y])for(const z of [b.min.z,b.max.z]){
  groundCorner.set(x,y,z).applyMatrix4(mesh.matrixWorld);low=Math.min(low,groundCorner.y)
 }
 return low
}
/** Refine the visible arms around the EXISTING ball anchor. Both wrist targets
 * are symmetric about the old hand midpoint, preserving every motor contact.
 * The two-bone solve keeps elbows attached; the forearm may extend by up to
 * approximately 1.7 cm where the old pose held the hands too widely apart. */
function refineGrip(body:ReturnType<typeof person>,strength:number,diving:boolean){
 body.group.updateMatrixWorld(true)
 const sleeveSupported=diving?body.sleeves.map(mesh=>meshFloor(mesh)<1e-7):[]
 body.hands[0].getWorldPosition(gripLeft);body.hands[1].getWorldPosition(gripRight)
 body.grip.anchor.copy(gripLeft).add(gripRight).multiplyScalar(.5)
 gripAxis.copy(gripRight).sub(gripLeft);const oldRadius=gripAxis.length()/2;gripAxis.normalize()
 const radius=THREE.MathUtils.lerp(oldRadius,body.grip.radius,strength)
 body.grip.active=true;body.grip.maximumArmExtension=0
 for(let i=0;i<2;i++){
  const arm=body.arms[i],elbow=body.elbows[i],wrist=body.wrists[i]
  arm.getWorldPosition(gripShoulder);elbow.getWorldPosition(gripElbow)
  gripTarget.copy(body.grip.anchor).addScaledVector(gripAxis,i?radius:-radius)
  gripAim.copy(gripTarget).sub(gripShoulder);const distance=gripAim.length();gripAim.normalize()
  const upper=.25,lower=Math.max(.23,distance-upper+.0001),along=(upper*upper-lower*lower+distance*distance)/(2*distance)
  body.grip.maximumArmExtension=Math.max(body.grip.maximumArmExtension,lower-.23)
  gripBase.copy(gripShoulder).addScaledVector(gripAim,along)
  gripBend.copy(gripElbow).sub(gripBase);gripBend.addScaledVector(gripAim,-gripBend.dot(gripAim))
  if(gripBend.lengthSq()<1e-10){gripBend.set(0,0,1);gripBend.addScaledVector(gripAim,-gripBend.dot(gripAim))}
  gripBend.normalize();const bend=Math.sqrt(Math.max(0,upper*upper-along*along))
  // A diving elbow bends above the turf, never towards it.
  if(diving&&gripBase.y+gripBend.y*bend<.075){gripBend.set(0,1,0).addScaledVector(gripAim,-gripAim.y).normalize()}
  gripElbow.copy(gripBase).addScaledVector(gripBend,bend)
  gripInverse.copy(body.upper.matrixWorld).invert()
  gripLocal.copy(gripElbow).sub(gripShoulder).transformDirection(gripInverse)
  gripCurrent.copy(DOWN).applyQuaternion(arm.quaternion)
  gripDelta.setFromUnitVectors(gripCurrent,gripLocal);arm.quaternion.premultiply(gripDelta);arm.updateMatrixWorld(true)
  gripInverse.copy(arm.matrixWorld).invert()
  gripLocal.copy(gripTarget).sub(gripElbow).transformDirection(gripInverse)
  gripCurrent.copy(DOWN).applyQuaternion(elbow.quaternion)
  gripDelta.setFromUnitVectors(gripCurrent,gripLocal);elbow.quaternion.premultiply(gripDelta)
  const ratio=lower/.23;body.forearms[i].position.y=-.115*ratio;body.forearms[i].scale.y=.26*ratio
  wrist.position.y=-lower;elbow.updateMatrixWorld(true)
  // Turn each palm towards the ball without rotating its centre. Its +Z
  // surface now matches the exact local triangle clearance measured above.
  gripZ.copy(gripAxis).multiplyScalar(i?-1:1)
  gripY.copy(gripElbow).sub(gripTarget);gripY.addScaledVector(gripZ,-gripY.dot(gripZ))
  if(gripY.lengthSq()<1e-10)gripY.set(0,1,0).addScaledVector(gripZ,-gripZ.y)
  gripY.normalize();gripX.crossVectors(gripY,gripZ).normalize()
  gripFrame.makeBasis(gripX,gripY,gripZ);gripRotation.setFromRotationMatrix(gripFrame)
  elbow.getWorldQuaternion(gripParentRotation);gripParentRotation.invert()
  gripRotation.premultiply(gripParentRotation);wrist.quaternion.identity().slerp(gripRotation,strength)
 }
 body.group.updateMatrixWorld(true)
 // A few millimetres of sleeve fabric follow the ground contact while the
 // shoulder turns. Moving this clothing surface avoids lifting the entire
 // diver (and therefore the ball) merely because a sleeve bound rotated.
 if(diving)for(let i=0;i<2;i++){
  const sleeve=body.sleeves[i],low=meshFloor(sleeve)
  if(low<0||sleeveSupported[i]){
   gripInverse.copy(body.arms[i].matrixWorld).invert()
   gripLocal.set(0,1,0).transformDirection(gripInverse).multiplyScalar(-low)
   sleeve.position.add(gripLocal);sleeve.updateMatrixWorld(true)
  }
 }
}
/** Solve thigh/shin against the ankle target. The ankle compensates both
 * joints, so a supporting sole stays flat instead of rocking through turf. */
function placeFoot(leg:ReturnType<typeof person>['legs'][number],forward:number,lift:number,hipHeight:number){
 const down=hipHeight-.05-lift,d=clamp(Math.hypot(down,forward),.041,.72)
 const knee=Math.PI-Math.acos(clamp((.34**2+.38**2-d*d)/(2*.34*.38),-1,1))
 const hip=Math.atan2(-forward,down)-Math.acos(clamp((.34**2+d*d-.38**2)/(2*.34*d),-1,1))
 leg.hip.rotation.x=hip;leg.knee.rotation.x=knee;leg.ankle.rotation.x=-hip-knee
}
export function pose(body:ReturnType<typeof person>,p:Pick<JogadorFutebol,'mx'|'mz'|'heading'|'distance'|'speed'|'kick'|'throwing'> & {save?:number;dive?:number;control?:number;throwPreparation?:number}){
 body.grip.active=false
 for(let i=0;i<2;i++){
  body.arms[i].rotation.set(0,0,0);body.elbows[i].rotation.set(0,0,0)
  body.wrists[i].position.set(0,-.23,0);body.wrists[i].quaternion.identity()
  body.forearms[i].position.y=-.115;body.forearms[i].scale.y=.26
  body.sleeves[i].position.set(0,-.09,0)
 }
 body.group.position.set(p.mx,0,p.mz);body.group.rotation.set(0,p.heading,Math.max(-1,Math.min(1,p.dive??0))*1.5,'YXZ')
 const diving=Math.abs(p.dive??0)>1e-6
 const swing=diving?0:Math.sin(p.distance/1.4*Math.PI*2)*Math.min(.55,p.speed*.12)
 const kick=Math.sin(Math.PI/2*Math.max(0,Math.min(1,p.kick/.3)))*.85
 const control=Math.sin(Math.PI*Math.max(0,Math.min(1,(p.control??0)/.32)))
 const preparation=p.throwPreparation??0
 const pickup=Math.sin(Math.PI*Math.min(1,preparation/.5))**2
 const bend=1.3*pickup
 const throwing=Math.min(1,Math.max(0,p.throwing/.18,(preparation-.4)/.6))
 // Leave clearance for the glove volume when crouching to collect the ball.
 body.upper.position.y=.84+.004*pickup
 body.upper.rotation.x=bend
 const save=Math.max(0,Math.min(1,p.save??0))
 body.legs.forEach((leg,i)=>{
  leg.ankle.rotation.x=0
  const angle=(i?-swing:swing)+(i===1?-kick-.35*control:0)-1.38*pickup
  leg.hip.rotation.x=angle;leg.knee.rotation.x=Math.max(0,-angle)*.8+1.656*pickup
  body.arms[i].rotation.x=-bend-2.65*throwing+(-angle*.65*(1-save)-.60*save)*(1-throwing)*(1-pickup)
  body.arms[i].rotation.z=(i?-1:1)*(.30*save*(1-throwing)+.36*throwing+.36*pickup)
  body.elbows[i].rotation.x=-.25*control-.45*save-.25*Math.min(1,p.speed/5.8)*(1-save)*(1-throwing)
 })
 if(!diving&&preparation===0&&throwing===0){
  if(p.kick>0){
   const impact=clamp(p.kick/.3,0,1),extension=Math.sin(impact*Math.PI/2)
   // At impact the inner boot meets a ground-size ball; the other foot bears
   // the player's weight. Follow-through returns to the same resting pose.
   placeFoot(body.legs[0],-.06*impact,0,.77-.09*impact)
   placeFoot(body.legs[1],.315*extension,.035*extension,.77-.09*impact)
  }else if(control>0){
   placeFoot(body.legs[0],0,0,.77-.04*control)
   placeFoot(body.legs[1],.18*control,.025*control,.77-.04*control)
  }else if(p.speed>0){
   // A full stride retains the original 1.4 m of actual travel. In its first half the
   // planted boot moves backwards by exactly the distance the body advances.
   // The second half recovers that foot above the grass, with matching end
   // velocities. Neither wall-clock time nor playback speed drives the pose.
   // Blend into/out of the stride at low speed. An on/off threshold made an
   // interpolated first frame instantly move a boot by 35 cm and the hip by
   // 10 cm. Above .5 m/s the original planted-foot trajectory is unchanged.
   const transition=clamp(p.speed/.5,0,1),blend=transition*transition*(3-2*transition)
   const phase=((p.distance/1.4)%1+1)%1,hipHeight=.77+(.66+.015*Math.cos(phase*4*Math.PI)-.77)*blend
   body.legs.forEach((leg,i)=>{
    const q=(phase+i*.5)%1,t=(q-.5)*2
    const forward=(q<.5?.35-q*1.4:-.35+.7*(-4*t*t*t+6*t*t-t))*blend
    const lift=q<.5?0:Math.sin(t*Math.PI)**2*(.07+.10*clamp(p.speed/5.8,0,1))*blend
    placeFoot(leg,forward,lift,hipHeight)
    body.arms[i].rotation.x=forward*1.6*(1-save)-.60*save
   })
   body.upper.rotation.x=.07*clamp(p.speed/5.8,0,1)*(1-save)*blend
  }
 }
 // Use all eight boot corners: a tilted toe/heel can be lower than the sole centre.
 body.group.updateMatrixWorld(true)
 let low=Infinity
 const corner=groundCorner
 for(const leg of body.legs)for(const x of [-.075,.075])for(const y of [-.05,.05])for(const z of [-.14,.14]){
  corner.set(x,y,z).applyMatrix4(leg.boot.matrixWorld);low=Math.min(low,corner.y)
 }
 // On the side, shoulders, gloves and head can be lower than the boots.
 // Bounding volumes keep the entire articulated figure above the pitch.
 if(diving)body.group.traverse(node=>{
  if(!(node instanceof THREE.Mesh))return
  if(!node.geometry.boundingBox)node.geometry.computeBoundingBox()
  const bounds=node.geometry.boundingBox!
  for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){
   corner.set(x,y,z).applyMatrix4(node.matrixWorld);low=Math.min(low,corner.y)
  }
 })
 body.group.position.y-=low
 const gripStrength=Math.max(clamp((p.save??0)/.55,0,1),clamp(preparation/.25,0,1),clamp(p.throwing/.18,0,1))
 if(gripStrength>0)refineGrip(body,gripStrength,diving)
}

// A single CPU-only rig measures the same glove positions used by the renderer.
// No canvas, WebGL context or per-frame mesh allocation is needed.
let measurementRig:ReturnType<typeof person>|undefined
const glovePosition=new THREE.Vector3()
export function contatoLuvas3D(p:Parameters<typeof pose>[1]){
 const rig=measurementRig??(measurementRig=person('#ffffff','#ffffff',true))
 pose(rig,p);rig.group.updateMatrixWorld(true)
 const a=rig.hands[0].getWorldPosition(glovePosition),x=a.x,y=a.y,z=a.z
 const b=rig.hands[1].getWorldPosition(glovePosition)
 return {x:(x+b.x)/2,y:(y+b.y)/2,z:(z+b.z)/2}
}

/** Centre of a regulation-size ball touching the right boot's inner face.
 * Call with the exact impact pose (kick=.3) and heading used by the player;
 * this is a strike/contact anchor, not a replacement for free ball movement. */
export function contatoPe3D(p:Parameters<typeof pose>[1]){
 const rig=measurementRig??(measurementRig=person('#ffffff','#ffffff',true))
 pose(rig,p);rig.group.updateMatrixWorld(true)
 glovePosition.set(-.075-.11,.025,0).applyMatrix4(rig.legs[1].boot.matrixWorld)
 return {x:glovePosition.x,y:glovePosition.y,z:glovePosition.z}
}

/** Grounded conduction target ahead of BOTH visible boots. The previous ball
 * prevents a stop or change of support foot from pulling it backwards in one
 * frame. This is guided close control, not free-flight/receiving physics: the
 * caller must first receive the ball and advance poses with bounded motion. */
export function conduzirBola3D(p:Parameters<typeof pose>[1],previous?:{x:number;y:number;z:number},deltaSeconds=1/60){
 const rig=measurementRig??(measurementRig=person('#ffffff','#ffffff',true))
 pose(rig,p);rig.group.updateMatrixWorld(true)
 const sin=Math.sin(p.heading),cos=Math.cos(p.heading),dt=clamp(Number.isFinite(deltaSeconds)?deltaSeconds:0,0,.1)
 let lateral=0,oldForward=-Infinity
 if(previous&&Number.isFinite(previous.x)&&Number.isFinite(previous.z)){
  const dx=previous.x-p.mx,dz=previous.z-p.mz,oldLateral=dx*cos-dz*sin
  oldForward=dx*sin+dz*cos
  lateral=oldLateral+clamp(-oldLateral,-4*dt,4*dt)
 }
 let safe=.42
 // Horizontal support of each complete boot volume, including a tilted toe.
 // Keeping the whole ball ahead also covers changing lateral clearance while
 // turning; selecting just one foot would jump or intersect the other one.
 for(const leg of rig.legs){
  let front=-Infinity,left=Infinity,right=-Infinity,bottom=Infinity,top=-Infinity
  for(const x of [-.075,.075])for(const y of [-.05,.05])for(const z of [-.14,.14]){
   groundCorner.set(x,y,z).applyMatrix4(leg.boot.matrixWorld)
   const dx=groundCorner.x-p.mx,dz=groundCorner.z-p.mz,horizontal=dx*cos-dz*sin
   front=Math.max(front,dx*sin+dz*cos);left=Math.min(left,horizontal);right=Math.max(right,horizontal)
   bottom=Math.min(bottom,groundCorner.y);top=Math.max(top,groundCorner.y)
  }
  const gapX=Math.max(0,left-lateral,lateral-right),gapY=Math.max(0,bottom-.11,.11-top)
  // Sphere clearance against a conservative box in the body's heading plane.
  // Keep the zero-radius branch continuous at the box's side/top edges.
  safe=Math.max(safe,front+Math.sqrt(Math.max(0,.11**2-gapX**2-gapY**2))+.001)
 }
 // Slow recovery towards the feet; toe advancement supplies the next push.
 // A stable centre lane avoids swapping the ball from left to right each step.
 const forward=Math.max(safe,oldForward-(.35+.65*Math.max(0,p.speed))*dt)
 return {x:p.mx+sin*forward+cos*lateral,y:.11,z:p.mz+cos*forward-sin*lateral}
}

const footInverse=[new THREE.Matrix4(),new THREE.Matrix4()]
/** Pure post-interpolation collision correction. Already-clear balls retain
 * their exact position/object. A collision is moved the shortest tested
 * horizontal distance out of both boots, preserving the trajectory's height.
 * The contact normals supplement eight directions so a tiny side contact is
 * corrected locally instead of sending a received ball to a fixed front slot. */
export function separarBolaDosPes3D<T extends {x:number;y:number;z:number}>(p:Parameters<typeof pose>[1],ball:T):T|{x:number;y:number;z:number}{
 const rig=measurementRig??(measurementRig=person('#ffffff','#ffffff',true))
 pose(rig,p);rig.group.updateMatrixWorld(true)
 for(let i=0;i<2;i++)footInverse[i].copy(rig.legs[i].boot.matrixWorld).invert()
 const gap=(x:number,z:number,i:number)=>{
  groundCorner.set(x,ball.y,z).applyMatrix4(footInverse[i])
  return Math.hypot(Math.max(0,Math.abs(groundCorner.x)-.075),Math.max(0,Math.abs(groundCorner.y)-.05),Math.max(0,Math.abs(groundCorner.z)-.14))
 }
 if(gap(ball.x,ball.z,0)>=.11-1e-8&&gap(ball.x,ball.z,1)>=.11-1e-8)return ball
 const directions:{x:number;z:number}[]=[]
 for(let i=0;i<2;i++){
  groundCorner.set(ball.x,ball.y,ball.z).applyMatrix4(footInverse[i])
  glovePosition.set(groundCorner.x-clamp(groundCorner.x,-.075,.075),groundCorner.y-clamp(groundCorner.y,-.05,.05),groundCorner.z-clamp(groundCorner.z,-.14,.14))
  if(glovePosition.lengthSq()>1e-12){
   glovePosition.transformDirection(rig.legs[i].boot.matrixWorld)
   const length=Math.hypot(glovePosition.x,glovePosition.z)
   if(length>1e-6)directions.push({x:glovePosition.x/length,z:glovePosition.z/length})
  }
 }
 for(let i=0;i<8;i++){const heading=p.heading+i*Math.PI/4;directions.push({x:Math.sin(heading),z:Math.cos(heading)})}
 let best=Infinity,result:{x:number;y:number;z:number}|undefined
 const clear=(x:number,z:number)=>gap(x,z,0)>=.1105&&gap(x,z,1)>=.1105
 for(const direction of directions){
  for(let distance=.01;distance<=Math.min(1.6,best+.01);distance+=.01){
   if(!clear(ball.x+direction.x*distance,ball.z+direction.z*distance))continue
   let low=Math.max(0,distance-.01),high=distance
   for(let i=0;i<12;i++){const middle=(low+high)/2;if(clear(ball.x+direction.x*middle,ball.z+direction.z*middle))high=middle;else low=middle}
   if(high<best){best=high;result={x:ball.x+direction.x*high,y:ball.y,z:ball.z+direction.z*high}}
   break
  }
 }
 // With these human-scale boots every intersecting centre has a clear point
 // inside the 1.6 m search radius; preserve input if supplied non-finite data.
 return result??ball
}
