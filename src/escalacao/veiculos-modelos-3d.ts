import * as T from 'three'
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js'
import {modeloVeiculo,MODELO_ENTREGA_QUADROS,type PerfilVeiculo} from './veiculos-modelos'

export type Veiculo3D={root:T.Group;profile:PerfilVeiculo;update:(distance:number,steering?:number)=>void;setCargoOpening?:(open:number)=>void;dispose:()=>void}
/** Original low-poly meshes: shaped body panels, glass, details and articulated wheels.
 * Cached on demand per scene; instances share buffers/materials, no textures or GLB downloads. */
export function criarBibliotecaVeiculos(){
 const material=new T.MeshStandardMaterial({vertexColors:true,roughness:.64,metalness:.17})
 const alpha=new Uint8Array(64*64*4);for(let y=0;y<64;y++)for(let x=0;x<64;x++){const d=Math.hypot((x-31.5)/31.5,(y-31.5)/31.5),i=(y*64+x)*4;alpha[i]=alpha[i+1]=alpha[i+2]=255;alpha[i+3]=Math.round(Math.max(0,1-d)**1.5*255)}
 const shadowMap=new T.DataTexture(alpha,64,64);shadowMap.needsUpdate=true;shadowMap.magFilter=T.LinearFilter;const shadowMaterial=new T.MeshBasicMaterial({map:shadowMap,color:'#171d19',transparent:true,opacity:.28,depthWrite:false,toneMapped:false}),shadowGeometry=new T.PlaneGeometry(1,1);shadowGeometry.rotateX(-Math.PI/2)
 const cache=new Map<string,{body:T.BufferGeometry;wheel:T.BufferGeometry;cargoDoor?:T.BufferGeometry;profile:PerfilVeiculo}>()
 const color=(g:T.BufferGeometry,c:string)=>{const n=g.index?g.toNonIndexed():g;if(n!==g)g.dispose();const co=new T.Color(c),a=new Float32Array(n.getAttribute('position').count*3);for(let i=0;i<a.length;i+=3){a[i]=co.r;a[i+1]=co.g;a[i+2]=co.b}n.setAttribute('color',new T.BufferAttribute(a,3));if(!n.getAttribute('uv'))n.setAttribute('uv',new T.BufferAttribute(new Float32Array(a.length/3*2),2));return n}
 function build(p:PerfilVeiculo){
  const parts:T.BufferGeometry[]=[],tires:T.BufferGeometry[]=[]
  const add=(g:T.BufferGeometry,c:string,x=0,y=0,z=0,rx=0,ry=0,rz=0,wheel=false)=>{g.rotateX(rx);g.rotateY(ry);g.rotateZ(rz);g.translate(x,y,z);(wheel?tires:parts).push(color(g,c))}
  const box=(c:string,w:number,h:number,d:number,x:number,y:number,z:number)=>add(new T.BoxGeometry(w,h,d),c,x,y,z)
  const ball=(c:string,w:number,h:number,d:number,x:number,y:number,z:number)=>{const g=new T.SphereGeometry(1,16,8);g.scale(w/2,h/2,d/2);add(g,c,x,y,z)}
  const rod=(c:string,a:number[],b:number[],r=.025)=>{const va=new T.Vector3(...a),vb=new T.Vector3(...b),v=vb.clone().sub(va),g=new T.CylinderGeometry(r,r,v.length(),8);g.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),v.normalize()));add(g,c,...va.add(vb).multiplyScalar(.5).toArray() as [number,number,number])}
  const loft=(rows:number[][],c:string,roof=c)=>{const pos:number[]=[],cols:number[]=[];const ring=(r:number[])=>{const[z,w,lo,hi]=r;return[[-w*.8,lo,z],[-w,lo+.04,z],[-w,lo+(hi-lo)*.72,z],[-w*.83,hi,z],[w*.83,hi,z],[w,lo+(hi-lo)*.72,z],[w,lo+.04,z],[w*.8,lo,z]]};const faces=(a:number[],b:number[],d:number[],co:string)=>{pos.push(...a,...b,...d);const v=new T.Color(co);for(let i=0;i<3;i++)cols.push(v.r,v.g,v.b)};for(let k=1;k<rows.length;k++){const a=ring(rows[k-1]),b=ring(rows[k]);for(let i=0;i<8;i++){const j=(i+1)%8,co=i===3?roof:c;faces(a[i],b[i],b[j],co);faces(a[i],b[j],a[j],co)}}for(const[k,reverse]of[[0,false],[rows.length-1,true]]as const){const a=ring(rows[k]);for(let i=1;i<7;i++)reverse?faces(a[0],a[i+1],a[i],c):faces(a[0],a[i],a[i+1],c)}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('color',new T.Float32BufferAttribute(cols,3));g.setAttribute('uv',new T.Float32BufferAttribute(new Float32Array(pos.length/3*2),2));g.computeVertexNormals();parts.push(g)}
  const paint=p.color,chrome='#a8b2b2',black='#242a2b',glass='#45616b',light='#e9e1ba',red='#a93029',L=p.length,W=p.width,H=p.height,r=p.radius;
  // The common wheel is also a coloured mesh: tread, sidewall and inset rim.
  add(new T.CylinderGeometry(r,r,p.kind==='car'?.21:p.shape==='cruiser'?.18:.09,18), '#242627',0,0,0,0,0,Math.PI/2,true)
  for(const side of[-1,1]){add(new T.CylinderGeometry(r*.63,r*.63,.014,16),chrome,side*(p.kind==='car'?.112:p.shape==='cruiser'?.098:.052),0,0,0,0,Math.PI/2,true);add(new T.CylinderGeometry(r*.37,r*.37,.018,10),'#40494a',side*(p.kind==='car'?.124:p.shape==='cruiser'?.109:.062),0,0,0,0,Math.PI/2,true)}
  if(p.kind==='car'){
   const van=p.shape==='van',suv=['suv','box-suv'].includes(p.shape),beetle=p.shape==='beetle',supercar=['super','wedge'].includes(p.shape),pickup=p.shape==='pickup',convert=p.shape==='convertible',square=['hatch','wagon','sedan','muscle','pickup','box-suv'].includes(p.shape),belt=van?1.03:suv?H*.58:supercar?.65:H*.61;
   const z=[-.5,-.46,-.34,0,.34,.46,.5],tops=beetle?[.62,.77,.89,.94,.86,.71,.58]:supercar?[.56,.67,.76,.73,.62,.5,.43]:van?[1.03,1.05,1.05,1.05,1.05,1.05,.95]:[belt*.82,belt,belt,belt,belt*.98,belt*.85,belt*.72];
   if(beetle){
    const sections=[[-.5,.24,.68],[-.46,.4,.89],[-.34,.47,1.13],[-.2,.47,1.43],[0,.46,1.5],[.15,.44,1.34],[.28,.4,.91],[.43,.33,.78],[.5,.22,.62]],vertices:number[]=[],colors:number[]=[];
    const ring=(r:number[])=>Array.from({length:16},(_,i)=>{const a=i/16*Math.PI*2,lo=.36,hi=r[2];return[Math.sin(a)*r[1]*W,lo+(Math.cos(a)+1)*.5*(hi-lo),r[0]*L]});
    const face=(a:number[],b:number[],c:number[])=>{const x=(a[0]+b[0]+c[0])/3,y=(a[1]+b[1]+c[1])/3,z=(a[2]+b[2]+c[2])/3;const window=y>.95&&((Math.abs(x)>W*.2&&z>-.29*L&&z<.2*L)||(Math.abs(x)<W*.3&&((z>.12*L&&z<.25*L)||(z<-.22*L&&z>-.32*L))));const co=new T.Color(window?glass:paint);vertices.push(...a,...b,...c);for(let k=0;k<3;k++)colors.push(co.r,co.g,co.b)};
    for(let k=1;k<sections.length;k++){const a=ring(sections[k-1]),b=ring(sections[k]);for(let i=0;i<16;i++){const j=(i+1)%16;face(a[i],b[i],b[j]);face(a[i],b[j],a[j])}}for(const[k,rev]of[[0,false],[sections.length-1,true]]as const){const a=ring(sections[k]);for(let i=1;i<15;i++)rev?face(a[0],a[i+1],a[i]):face(a[0],a[i],a[i+1])}
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setAttribute('uv',new T.Float32BufferAttribute(new Float32Array(vertices.length/3*2),2));g.computeVertexNormals();parts.push(g);
   }else if(p.shape==='delivery')box(black,W*.8,.16,L*.92,0,.45,0);else loft(z.map((v,i)=>[v*L,W/2*([.76,.97,1,1,1,.94,.77][i]),r*.95,tops[i]]),paint)
   if(p.shape==='delivery'){const front=L*.14,h=H-.5;box(paint,W,h,.08,0,.5+h/2,front);for(const side of[-1,1])box(paint,.08,h,L*.63,side*(W/2-.04),.5+h/2,-L*.175);box(paint,W,.08,L*.63,0,H,-L*.175);box(black,W,.08,L*.63,0,.5,-L*.175);loft([[L*.19,W*.46,.8,1.7],[L*.37,W*.45,.8,1.7],[L*.47,W*.4,.8,1.4]],glass,paint)}
   else if(van){loft([[-L*.45,W*.48,.97,H*.94],[-L*.32,W*.48,.97,H],[L*.28,W*.48,.97,H],[L*.45,W*.46,.97,H*.96]],glass,p.roof??paint);for(const side of[-1,1])for(const zz of[-.34,-.08,.18,.38])rod(p.roof??paint,[side*W*.482,1.02,zz*L],[side*W*.4,H*.99,zz*L],.035);box(p.roof??paint,W*.97,.09,L*.91,0,H+.015,0)}
   else if(!convert&&!beetle){const rear=pickup?-.02:p.shape==='rear-coupe'?-.37:beetle?-.34:square?-.29:-.31,front=pickup?.29:supercar?.25:.28;
    loft([[rear*L,W*.38,belt-.04,belt+.05],[(rear+.1)*L,W*.42,belt-.04,H*.96],[(front-.12)*L,W*.4,belt-.04,H],[front*L,W*.34,belt-.02,belt+.04]],glass,p.roof??paint)
    for(const side of[-1,1]){rod(paint,[side*W*.35,belt,front*L],[side*W*.33,H*.98,(front-.12)*L],.03);rod(paint,[side*W*.38,belt,rear*L],[side*W*.35,H*.95,(rear+.1)*L],.035);if(square)rod(paint,[side*W*.425,belt,0],[side*W*.35,H*.98,0],.028)}
   }else if(convert){loft([[L*.12,W*.43,belt,belt+.02],[L*.22,W*.37,belt,H],[L*.25,W*.36,belt,H]],glass,paint);box(black,W*.75,.06,L*.27,0,belt+.03,-L*.02);for(const x of[-W*.2,W*.2]){ball(black,.34,.5,.23,x,belt+.16,-L*.06);ball(black,.23,.18,.2,x,belt+.45,-L*.06)}}
   if(pickup){box(black,W*.79,.03,L*.35,0,belt+.012,-L*.26);for(const s of[-1,1])box(paint,.10,.19,L*.4,s*W*.43,belt+.05,-L*.27)}
   // Curved separate arches are the Beetle's defining wings.
   if(beetle)for(const x of[-W*.43,W*.43])for(const z of[-p.wheelbase/2,p.wheelbase/2])ball(paint,.49,.52,1.08,x,.44,z)
   for(const side of[-1,1]){
    const x=side*W*.33;
    if(beetle){add(new T.CylinderGeometry(.14,.14,.055,14),chrome,side*W*.43,.67,p.wheelbase/2+.35,Math.PI/2);ball(light,.235,.235,.035,side*W*.43,.67,p.wheelbase/2+.39)}
    else if(['muscle','rear-coupe','box-suv'].includes(p.shape)){add(new T.SphereGeometry(.12,12,8),light,x,belt*.77,L*.482);if(p.shape==='muscle')add(new T.SphereGeometry(.095,12,8),light,x*.63,belt*.77,L*.49)}
    else box(light,W*.23,.09,.05,x,belt*.76,L*.484)
    box(red,W*.22,.1,.05,x,belt*.77,-L*.485)
    ball(black,.16,.14,.23,side*W*.54,belt+.08,L*.13)
    rod(chrome,[side*W*.51,r*.85,-p.wheelbase*.53],[side*W*.51,r*.85,p.wheelbase*.53],.017)
    box(black,.025,.035,.17,side*W*.502,belt*.98,-L*.01)
   }
   box(beetle?chrome:black,W*.88,.09,.08,0,r*.99,L*.49);box(beetle?chrome:black,W*.88,.09,.08,0,r*.99,-L*.49)
   if(!beetle){box(black,W*.44,.14,.025,0,belt*.57,L*.502);for(let i=-2;i<=2;i++)box(chrome,.012,.1,.03,i*W*.08,belt*.57,L*.506)}else{for(let i=-3;i<=3;i++)box(black,.018,.025,.15,i*.055,.8,-L*.415)}
   box('#e6e4d7',.32,.1,.027,0,.41,-L*.506)
   if(p.spoiler){for(const x of[-W*.3,W*.3])box(black,.065,.27,.065,x,belt+.14,-L*.37);box(paint,W*.99,.07,.30,0,belt+.3,-L*.37)}
   if(p.ladder){for(const x of[-.28,.28])rod(chrome,[x,H+.13,-L*.41],[x,H+.13,L*.43],.024);for(let z=-L*.38;z<L*.43;z+=.26)rod(chrome,[-.28,H+.13,z],[.28,H+.13,z],.018);for(const z of[-.18,.18])box(black,W*.9,.06,.08,0,H+.06,z*L)}
   if(p.stripes){for(const x of[-W*.15,W*.15])box(p.id==='m3-gtr'?'#2367a4':black,W*.14,.018,L*.22,x,belt+.015,L*.34)}
   if(p.shape==='box-suv'){add(new T.CylinderGeometry(.34,.34,.18,14),black,0,.98,-L*.52,Math.PI/2);box(chrome,W*.93,.045,L*.68,0,H+.05,0)}
  }else{
   const bicycle=['bicycle','bmx'].includes(p.shape),cruiser=p.shape==='cruiser',adventure=['adventure','trail'].includes(p.shape),scooter=['step','scooter','moped'].includes(p.shape),sport=p.shape==='sport';
   const rear=-p.wheelbase/2,front=p.wheelbase/2,seat=cruiser?.68:adventure?.91:.8,bar=H*.88,neck=front-.15;
   for(const side of[-1,1]){const x=side*.1;rod(chrome,[x,r,rear],[x,.56,-.12],.025);rod(chrome,[x,.56,-.12],[x,r,front],.025);rod(chrome,[x,r,front],[x,bar,neck],.035);rod(paint,[x,r,rear],[x,seat,-.18],.025);rod(paint,[x,seat,-.18],[x,.4,0],.025);rod(paint,[x,.4,0],[x,bar-.15,neck],.03);rod(paint,[x,seat,-.18],[x,bar-.15,neck],.025)}
   ball(black,cruiser?.47:.3,.13,cruiser?.7:.57,0,seat,-.19)
   rod(chrome,[-p.width*.43,bar,neck+.03],[p.width*.43,bar,neck+.03],.025);for(const side of[-1,1])rod(black,[side*p.width*.30,bar,neck+.03],[side*p.width*.48,bar,neck+.03],.038)
   if(!bicycle){
    if(!scooter)ball(paint,.48,adventure?.43:.34,.57,0,seat-.1,.17)
    else{loft([[-.2,.15,.33,.55],[.25,.19,.3,.55],[neck,.18,.35,bar*.95]],paint);box(black,.38,.07,.6,0,.35,.05)}
    if(cruiser)for(const direction of[-1,1]){const g=new T.CylinderGeometry(.13,.12,.31,12);g.rotateX(direction*.5);add(g,chrome,0,.51,direction*.13);for(let i=0;i<5;i++)rod(black,[-.14,.43+i*.035,direction*.13],[.14,.43+i*.035,direction*.13],.012)}
    ball(chrome,.36,.34,.37,0,.44,-.04);for(let i=0;i<4;i++)box(black,.37,.016,.3,0,.34+i*.05,-.04)
    rod(chrome,[.18,.3,-.12],[.22,.36,rear-.2],.06)
    add(new T.SphereGeometry(cruiser?.115:.09,12,8),light,0,bar-.08,neck+.13)
    box(red,.17,.065,.08,0,seat-.02,rear+.05)
    if(sport){loft([[-.12,.26,.42,.65],[.35,.28,.38,1.0],[front+.14,.13,.55,bar+.06]],paint);loft([[front-.14,.19,bar-.1,bar+.17],[front+.12,.11,bar-.1,bar+.05]],glass)}
    if(adventure){loft([[neck-.1,.18,bar-.12,H],[front+.06,.12,bar-.12,H*.94]],glass);for(const side of[-1,1])box(black,.23,.38,.46,side*.34,seat-.06,rear+.04)}
   }else{rod(chrome,[-.24,.36,-.02],[.24,.36,-.02],.025);for(const side of[-1,1])box(black,.13,.025,.1,side*.24,.36,side*.10)}
   for(const z of[rear,front]){const g=new T.TorusGeometry(r+.045,.035,5,14,Math.PI);g.rotateY(Math.PI/2);add(g,paint,0,r,z)}
  }
  const body=mergeGeometries(parts)!;parts.forEach(g=>g.dispose());const wheel=mergeGeometries(tires)!;tires.forEach(g=>g.dispose());body.computeBoundingSphere();wheel.computeBoundingSphere();return{body,wheel,cargoDoor:p.shape==='delivery'?color(new T.BoxGeometry(W/2-.035,H-.53,.07),paint):undefined,profile:p}
 }
 function create(id:string):Veiculo3D|undefined{
  const p=id==='servico-dsouza'?MODELO_ENTREGA_QUADROS:modeloVeiculo(id);if(!p)return;let template=cache.get(p.id);if(!template){template=build(p);cache.set(p.id,template)}
  const root=new T.Group();root.name='veiculo-'+id;root.userData.vehicleId=id;const body=new T.Mesh(template.body,material);body.castShadow=true;body.receiveShadow=true;root.add(body)
  const wheels:{pivot:T.Group;mesh:T.Mesh;front:boolean}[]=[];
  for(const z of[-p.wheelbase/2,p.wheelbase/2])for(const side of p.kind==='car'?[-1,1]:[0]){const pivot=new T.Group();pivot.position.set(side*(p.width/2-.015),p.radius,z);const mesh=new T.Mesh(template.wheel,material);mesh.castShadow=true;pivot.add(mesh);root.add(pivot);wheels.push({pivot,mesh,front:z>0})}
  const cargo:T.Group[]=[];if(template.cargoDoor)for(const side of[-1,1]){const pivot=new T.Group();pivot.position.set(side*p.width/2,p.height/2+.25,-p.length*.49);const door=new T.Mesh(template.cargoDoor,material);door.position.x=-side*p.width/4;door.castShadow=true;pivot.add(door);root.add(pivot);cargo.push(pivot)}
  const shadow=new T.Mesh(shadowGeometry,shadowMaterial);shadow.scale.set(p.width*1.1,1,p.length*.98);shadow.position.y=.004;root.add(shadow)
  return{root,profile:p,update(distance,steering=0){for(const w of wheels){w.mesh.rotation.x=distance/p.radius;w.pivot.rotation.y=w.front?T.MathUtils.clamp(steering,-.5,.5):0 }},setCargoOpening(open){cargo.forEach((hinge,i)=>{hinge.rotation.y=(i===0?1:-1)*T.MathUtils.clamp(open,0,1)*Math.PI*.85})},dispose(){root.removeFromParent();root.clear()}}
 }
 return{create,inspect:()=>({modelsLoaded:cache.size,triangles:[...cache.values()].reduce((n,t)=>n+t.body.getAttribute('position').count/3+t.wheel.getAttribute('position').count/3,0),bufferBytes:[...cache.values()].reduce((n,t)=>n+[t.body,t.wheel].reduce((s,g)=>s+Object.values(g.attributes).reduce((a,b)=>a+b.array.byteLength,0),0),0)}),dispose(){cache.forEach(t=>{t.body.dispose();t.wheel.dispose();t.cargoDoor?.dispose()});cache.clear();material.dispose();shadowMap.dispose();shadowMaterial.dispose();shadowGeometry.dispose()}}
}
