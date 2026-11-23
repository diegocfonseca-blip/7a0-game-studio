import './base';
import {installCirculation} from './circulation.ts';
import {mergeGeometries} from '../../node_modules/three/examples/jsm/utils/BufferGeometryUtils.js';
const W=window as any,T=W.T,scene=W.scene,renderer=W.renderer,camera=W.camera,controls=W.controls,sun=W.sun;
await document.fonts.ready;
const before=new T.Group();before.name='antes';const after=new T.Group();after.name='acabamento-novo';
for(const child of [...scene.children])if(!child.isLight){before.add(child.clone(true));after.add(child)}scene.add(before,after);before.visible=false;
let seed=73191;function rnd(){seed=(1664525*seed+1013904223)>>>0;return seed/4294967296}
function texture(kind:string,size=256){const c=document.createElement('canvas');c.width=c.height=size;const g=c.getContext('2d')!;
 const base:any={grass:'#7b905b',sand:'#dcc697',stone:'#c8c2ab',wood:'#a8845b',concrete:'#c0bbae',water:'#258f9a',brick:'#ac593d',asphalt:'#555e56'};
 g.fillStyle=base[kind]||'#bfb8a1';g.fillRect(0,0,size,size);
 for(let i=0;i<11000;i++){const v=rnd();g.fillStyle=v>.5?'rgba(255,255,225,.055)':'rgba(25,31,16,.055)';g.fillRect(rnd()*size,rnd()*size,1+rnd()*2,1+rnd()*2)}
 if(kind==='grass'){for(let i=0;i<1400;i++){g.strokeStyle=i%3?'rgba(46,75,25,.10)':'rgba(195,206,136,.18)';const x=rnd()*size,y=rnd()*size;g.beginPath();g.moveTo(x,y);g.lineTo(x+.7,y-1-rnd()*2);g.stroke()}}
 if(kind==='sand'){for(let i=0;i<15;i++){g.strokeStyle='rgba(244,226,177,.11)';g.beginPath();g.ellipse(rnd()*size,rnd()*size,10+rnd()*35,2+rnd()*5,rnd()*3,0,Math.PI*2);g.stroke()}}
 if(kind==='stone'){const w=64,h=32;g.lineWidth=1.2;g.strokeStyle='#aaa58f';for(let y=0;y<size;y+=h)for(let x=-w;x<size;x+=w){const X=x+(y/h%2)*w/2;g.fillStyle=`rgba(${rnd()>.5?'255,250,226':'47,55,36'},.045)`;g.fillRect(X+1,y+1,w-2,h-2);g.strokeRect(X,y,w,h)}}
 if(kind==='wood'){for(let y=0;y<size;y+=32){g.fillStyle='rgba(54,34,16,.28)';g.fillRect(0,y,size,1.2);for(let i=0;i<12;i++){g.strokeStyle='rgba(49,27,12,.09)';g.beginPath();g.moveTo(0,y+rnd()*31);g.bezierCurveTo(65,y+rnd()*31,180,y+rnd()*31,256,y+rnd()*31);g.stroke()}}}
 if(kind==='brick'){g.strokeStyle='#d8c0a0';g.lineWidth=2;for(let y=0;y<size;y+=32)for(let x=-64;x<size;x+=64)g.strokeRect(x+(y/32%2)*32,y,64,32)}
 if(kind==='water'){for(let k=0;k<26;k++){g.strokeStyle=k%2?'rgba(173,232,211,.16)':'rgba(223,247,217,.25)';g.lineWidth=k%3?1:2;g.beginPath();const y=rnd()*size;for(let x=0;x<=size;x+=4){const Y=y+Math.sin(x*.04+k)*4+Math.cos(x*.09+k)*2;x?g.lineTo(x,Y):g.moveTo(x,Y)}g.stroke()}}
 const tx=new T.CanvasTexture(c);tx.colorSpace=T.SRGBColorSpace;tx.wrapS=tx.wrapT=T.RepeatWrapping;tx.anisotropy=2;tx.userData.previewArt=kind;return tx;
}
const textures:any={};for(const k of ['grass','sand','stone','wood','concrete','water','brick','asphalt'])textures[k]=texture(k);
const materials:any={};function material(kind:string,color?:string){const key=kind+(color??'');return materials[key]??=new T.MeshLambertMaterial({color:color??'#ffffff',map:textures[kind]??null})}
function uvWorld(o:any,units=5){const g=o.geometry.clone();o.updateWorldMatrix(true,false);const p=g.attributes.position,a=new Float32Array(p.count*2),v=new T.Vector3(),n=g.attributes.normal;for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld);const nx=n?.getX(i)??0,ny=n?.getY(i)??1,nz=n?.getZ(i)??0;if(Math.abs(ny)>.5){a[i*2]=v.x/units;a[i*2+1]=v.z/units}else if(Math.abs(nx)>Math.abs(nz)){a[i*2]=v.z/units;a[i*2+1]=v.y/units}else{a[i*2]=v.x/units;a[i*2+1]=v.y/units}}g.setAttribute('uv',new T.BufferAttribute(a,2));o.geometry=g}
const mapped=new Map<any,any>();
after.updateMatrixWorld(true);
after.traverse((o:any)=>{if(!o.isMesh)return;const original=Array.isArray(o.material)?o.material:[o.material];o.material=original.map((m:any)=>{
 if(mapped.has(m))return mapped.get(m);let n=m.clone();const name=m.name||'',hex=m.color?.getHexString()||'';
 const palette:any={'estrutura-concreto-claro':'#c6c1af','espelhos-concreto':'#949b8b','passeios-e-lajes':'#cdc5b0','caixilhos-grafite':'#243c33','cobertura-cinza-curva':'#314e43','juntas-cobertura':'#577062','interior-fachada':'#c9b999','acabamento-pedra-clara':'#dbd0b6','cadeiras-creme':'#d4c6a6','cadeiras-grafite':'#43594c','cadeiras-vermelho':'#9e4937'};
 if(palette[name]){n.color.set(palette[name]);if('roughness'in n)n.roughness=.84;if('metalness'in n)n.metalness=.02}
 if(name==='estrutura-concreto-claro'||name==='acabamento-pedra-clara'){n.map=textures.concrete;n.color.set(name==='estrutura-concreto-claro'?'#e6e1d2':'#e5d9bf')}
 if(o.parent===after&&!m.map&&hex==='758653'){n=material('grass')}
 if(o.parent===after&&!m.map&&hex==='645a42'){n.color.set('#524a35')}
 if(o.parent===after&&!m.map&&hex==='b8b5a0'){n=material('stone')}
 if(o.parent===after&&!m.map&&hex==='60645b'){n=material('asphalt')}
 if(o.parent===after&&!m.map&&hex==='d8d3c2'){n=material('stone','#e8e3d5')}
 mapped.set(m,n);return n});if(!Array.isArray(o.material)||o.material.length===1)o.material=o.material[0];
 if((Array.isArray(o.material)?o.material:[o.material]).some((m:any)=>Object.values(textures).includes(m.map)))uvWorld(o,3.5);
});
// Existing recreation club gets new built materials, without replacing its amenities.
const clubMats:any={'4f9a45':material('grass','#e6edce'),'e7cf93':material('sand'),'b98a55':material('wood'),'f2f4f4':new T.MeshLambertMaterial({color:'#f0e4c8'}),'2fa9d8':material('water'),'1d86b8':material('water','#7bacaa'),'2f6b3f':new T.MeshLambertMaterial({color:'#ad573d'}),'9c4a32':material('brick'),'7a4a26':material('wood','#967048'),'efe6cf':new T.MeshLambertMaterial({color:'#ddd2b6'})};
W.club.root.traverse((o:any)=>{if(!o.isMesh)return;const m=o.material,hex=m.color?.getHexString();if(clubMats[hex]){o.material=clubMats[hex];if(o.material.map)uvWorld(o,hex==='e7cf93'?4:3)}if(hex==='f5f5f0'&&m.transparent){const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d')!;g.clearRect(0,0,128,128);g.strokeStyle='#f1ead6';g.lineWidth=2;for(let i=0;i<=128;i+=16){g.beginPath();g.moveTo(i,0);g.lineTo(i,128);g.moveTo(0,i);g.lineTo(128,i);g.stroke()}const tx=new T.CanvasTexture(c);tx.wrapS=tx.wrapT=T.RepeatWrapping;tx.repeat.set(1,5);o.material=new T.MeshLambertMaterial({map:tx,transparent:true,alphaTest:.25,side:T.DoubleSide})}
 if(m.map&&o.geometry.attributes.position.count===4){const c=document.createElement('canvas');c.width=768;c.height=160;const g=c.getContext('2d')!;g.fillStyle='#173f31';g.fillRect(0,0,768,160);g.strokeStyle='#c7b785';g.lineWidth=5;g.strokeRect(9,9,750,142);g.fillStyle='#f4ecd6';g.textAlign='center';g.textBaseline='middle';g.font='700 90px Oswald';g.fillText('CLUBE RECREIO',384,82);const tx=new T.CanvasTexture(c);tx.colorSpace=T.SRGBColorSpace;o.material=new T.MeshLambertMaterial({map:tx})}
});
// New details built as actual geometry, then statically batched.
const additions=new T.Group();additions.name='novas-pecas-de-arte';after.add(additions);
function cube(w:number,h:number,d:number,x:number,y:number,z:number,m:any,parent=additions){const o=new T.Mesh(new T.BoxGeometry(w,h,d),typeof m==='string'?new T.MeshLambertMaterial({color:m}):m);o.position.set(x,y,z);o.castShadow=h>.25;o.receiveShadow=true;parent.add(o);if(o.material.map)uvWorld(o,3);return o}
function plane(w:number,d:number,x:number,y:number,z:number,m:any,parent=additions){const o=new T.Mesh(new T.PlaneGeometry(w,d),m);o.rotation.x=-Math.PI/2;o.position.set(x,y,z);o.receiveShadow=true;parent.add(o);if(m.map)uvWorld(o,3);return o}
function cylinder(rt:number,rb:number,h:number,x:number,y:number,z:number,m:any,parent=additions){const o=new T.Mesh(new T.CylinderGeometry(rt,rb,h,8),typeof m==='string'?new T.MeshLambertMaterial({color:m}):m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o}
const trunk=new T.MeshLambertMaterial({color:'#6a5035'}),foliage=[0x3e6136,0x53733d,0x6d8548].map(color=>new T.MeshLambertMaterial({color,flatShading:true}));
function shrub(x:number,z:number,r=1,parent=additions){const o=new T.Mesh(new T.IcosahedronGeometry(r,1),foliage[Math.floor(rnd()*3)]);o.scale.set(1,.7,1);o.position.set(x,.5+r*.45,z);o.castShadow=true;parent.add(o)}
function tree(x:number,z:number,h=7,parent=additions){cylinder(.23,.36,h*.65,x,h*.325,z,trunk,parent);for(let j=0;j<3;j++){const o=new T.Mesh(new T.IcosahedronGeometry(h*.3,1),foliage[j]);o.position.set(x+(j-1)*h*.17,h*.68+(j%2)*h*.16,z+(j%2)*h*.16);o.scale.y=.8;o.castShadow=true;parent.add(o)}}
function planter(x:number,z:number,w=5,d=1.5,parent=additions){cube(w,.55,d,x,.28,z,'#a6987c',parent);cube(w-.2,.03,d-.2,x,.57,z,'#514431',parent);for(let t=-w/2+.65;t<w/2-.2;t+=1.15)shrub(x+t,z,.7,parent)}
function bench(x:number,z:number,rotation=0){const root=new T.Group();root.position.set(x,0,z);root.rotation.y=rotation;additions.add(root);for(const dz of [-.25,0,.25])cube(2.8,.09,.2,0,.67,dz,material('wood'),root);for(const xx of [-1,1]){cube(.08,.65,.65,xx,.325,0,'#263a31',root);cube(.08,1.2,.08,xx,.6,-.35,'#263a31',root)}cube(2.8,.32,.08,0,1.03,-.35,material('wood'),root)}
function lamp(x:number,z:number){cylinder(.055,.085,4,x,2,z,'#2a3d32');cube(.9,.1,.36,x,4.02,z,'#2a3d32');cube(.65,.04,.25,x,3.95,z,'#eee1ae')}
// Texture-based ground contact shades: no per-object dynamic ambient-occlusion pass.
const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=128;{const g=shadowCanvas.getContext('2d')!,grad=g.createRadialGradient(64,64,5,64,64,62);grad.addColorStop(0,'rgba(34,47,23,.20)');grad.addColorStop(.6,'rgba(34,47,23,.13)');grad.addColorStop(1,'rgba(34,47,23,0)');g.fillStyle=grad;g.fillRect(0,0,128,128)}
const shadowTexture=new T.CanvasTexture(shadowCanvas),shadowMat=new T.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false,toneMapped:false});
function contact(x:number,z:number,w:number,d:number){plane(w,d,x,.10,z,shadowMat)}
// Entry garden and paths around the real club, in the same local coordinates.
const clubArt=new T.Group();W.clubParent.add(clubArt);
for(const s of [-1,1]){cube(20,.16,.38,s*15,.98,-11.5,'#a99a7b',clubArt);cube(.38,.16,23,s*26,.98,0,'#a99a7b',clubArt)}
plane(3.4,12,0,.245,5.5,material('stone'),clubArt);plane(15,2.1,6.4,.25,2.5,material('stone'),clubArt);
for(const x of [-4.1,4.1]){cylinder(.75,.52,.8,x,.55,10,'#b56746',clubArt);shrub(x,10,.86,clubArt)}
for(const x of [-24,24])for(const z of [-9,9])shrub(x,z,.95,clubArt);
for(const z of [-9,0,9])cube(.25,1.7,.25,-25.3,1.2,z,'#596c48',clubArt);
// Pergola rafters and a masonry chimney cap make the barbecue legible close up.
cube(.75,.16,.75,19.95,4.65,2.9,'#544e3b',clubArt);
for(let k=-2;k<=2;k++)cube(6,.11,.11,20.5,2.76,5.2+k*.7,'#b99160',clubArt);
// Stadion forecourt gets routes, planting and a clear walking entrance.
plane(21,50,-30,.07,105,material('stone'));plane(210,8,-30,.075,133,material('stone'));
for(const x of [-123,-98,-73,13,38,63]){planter(x,130,10,2.8);bench(x,125);lamp(x,134)}
for(const [x,z] of [[-136,-80],[-136,-25],[78,-80],[78,-25]])tree(x,z,5.8);
for(const x of [-63,3]){planter(x,103,6,2.3);contact(x,103,10,6)}
// Warm stone marker walls, retaining the original concrete stadium façade.
for(const x of [-51,-9]){cube(11,1,1.2,x,.55,135,'#a89d83');cube(11,.08,1.35,x,1.1,135,'#d8cfb5')}
// Casa Luca keeps its own blue/yellow identity; planting and paving tie it to the campus.
W.lucaParent.traverse((o:any)=>{if(!o.isMesh||o.material.map)return;const g=o.geometry?.attributes.color;if(g){const geometry=o.geometry.clone(),c=geometry.attributes.color,v=new T.Color();for(let i=0;i<c.count;i++){v.setRGB(c.getX(i),c.getY(i),c.getZ(i));const hsl={h:0,s:0,l:0};v.getHSL(hsl);if(hsl.s>.35)v.setHSL(hsl.h,hsl.s*.77,hsl.l*.96);c.setXYZ(i,v.r,v.g,v.b)}o.geometry=geometry;o.material=o.material.clone()}});
for(const [x,z] of [[-219,88],[-218,132],[-167,132]])tree(x,z,4.5);
planter(-193,134,11,1.7);bench(-208,132);lamp(-160,136);
// Compact landscaping, leaving street corners and the two closed compounds unobstructed.
for(const [x,z,h] of [[-221,-120,6],[-221,-55,5.8],[-221,-7,6.3],[-219,23,5.3],[92,48,6.1],[92,86,5.8],[88,130,6],[-135,-122,5.5],[-75,-123,5.6],[-13,-123,5.5],[57,-122,5.5],[118,-129,6],[213,133,5.6],[-221,153,5.5],[-151,153,5.8],[98,151,5.8]]){tree(x,z,h);contact(x,z,9,7)}
// Road crossings at the real pedestrian approaches, made of a shared flat material.
const stripe=new T.MeshLambertMaterial({color:'#e2dfc9'});for(const x of [-30,-184])for(let j=-3;j<=3;j++)cube(.85,.025,6,x+j*1.6,.09,145,stripe);
for(let j=-2;j<=2;j++)cube(5,.025,.8,-147,.09,79+j*1.5,stripe);
// New ground finishes, one lighting setup and one finite, readable island.
scene.background.set('#eee7d3');const hemi=scene.children.find((o:any)=>o.isHemisphereLight);hemi.intensity=1.45;hemi.color.set('#dce9df');hemi.groundColor.set('#a18e66');sun.intensity=2.6;sun.color.set('#fff0d0');sun.position.set(-250,500,-120);
renderer.toneMappingExposure=1.05;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-360,right:360,top:360,bottom:-360,near:1,far:1100});sun.shadow.camera.updateProjectionMatrix();sun.shadow.bias=-.00015;sun.shadow.normalBias=.45;sun.shadow.intensity=.32;
// Measure actual rendered primitives and draw calls. Never infer a phone frame rate from this machine.
function stats(){return {calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,lines:renderer.info.render.lines,textures:renderer.info.memory.textures,geometries:renderer.info.memory.geometries}}
const beforeStats:any={};before.visible=true;after.visible=false;renderer.shadowMap.enabled=false;W.overview();Object.assign(beforeStats,stats());before.visible=false;after.visible=true;renderer.shadowMap.enabled=true;
const circulation=installCirculation({T,scene,after,additions,cube,plane,cylinder,tree,planter,bench,material,renderer,camera});W.circulation=circulation;

await import('./export.ts');
